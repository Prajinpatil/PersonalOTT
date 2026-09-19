import express from 'express';
import axios from 'axios';
import { authMiddleware } from '../middleware/auth.js';
import { WatchProgress } from '../models/WatchProgress.js';
import { Video } from '../models/Video.js';

const router = express.Router();

// Fallback helper: Recently added videos (cold start or recommender failure)
const getRecentlyAddedFallback = async () => {
  const videos = await Video.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('uploadedBy', 'name email');

  return {
    videos,
    pagination: {
      total: videos.length,
      page: 1,
      limit: 10,
      pages: 1,
    },
  };
};

// GET /api/recommendations (Protected - returns recommended videos for logged-in user)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Fetch watched video IDs from WatchProgress where seconds > 30
    const progressRecords = await WatchProgress.find({
      userId,
      seconds: { $gt: 30 },
    }).select('videoId');

    const watchedVideoIds = progressRecords
      .map((p) => p.videoId ? p.videoId.toString() : null)
      .filter(Boolean);

    // 2. COLD START: If user has 0 watched videos with > 30 seconds
    if (watchedVideoIds.length === 0) {
      const fallbackData = await getRecentlyAddedFallback();
      return res.json(fallbackData);
    }

    // 3. USER HAS WATCH HISTORY: Fetch catalog embeddings
    const catalogVideos = await Video.find({ embedding: { $exists: true, $ne: null } })
      .select('_id embedding');

    const catalogEmbeddings = catalogVideos
      .filter((v) => Array.isArray(v.embedding) && v.embedding.length > 0)
      .map((v) => ({
        videoId: v._id.toString(),
        embedding: v.embedding,
      }));

    if (catalogEmbeddings.length === 0) {
      const fallbackData = await getRecentlyAddedFallback();
      return res.json(fallbackData);
    }

    const recommenderUrl = process.env.RECOMMENDER_SERVICE_URL || 'http://localhost:8000';

    try {
      const recommendRes = await axios.post(
        `${recommenderUrl}/recommend`,
        {
          watchedVideoIds,
          catalogEmbeddings,
          topN: 10,
        },
        { timeout: 5000 }
      );

      const recommendedIds = recommendRes.data?.recommendations || [];

      if (!Array.isArray(recommendedIds) || recommendedIds.length === 0) {
        const fallbackData = await getRecentlyAddedFallback();
        return res.json(fallbackData);
      }

      // Fetch full metadata for returned video IDs preserving ranked order
      const fullVideos = await Video.find({ _id: { $in: recommendedIds } })
        .populate('uploadedBy', 'name email');

      const videoMap = new Map(fullVideos.map((v) => [v._id.toString(), v]));
      const rankedVideos = recommendedIds
        .map((id) => videoMap.get(id))
        .filter(Boolean);

      if (rankedVideos.length === 0) {
        const fallbackData = await getRecentlyAddedFallback();
        return res.json(fallbackData);
      }

      return res.json({
        videos: rankedVideos,
        pagination: {
          total: rankedVideos.length,
          page: 1,
          limit: 10,
          pages: 1,
        },
      });
    } catch (recommenderErr) {
      console.warn(
        '[Recommender Route Warning] Service failed or timed out. Using recently-added fallback:',
        recommenderErr.message
      );
      const fallbackData = await getRecentlyAddedFallback();
      return res.json(fallbackData);
    }
  } catch (error) {
    console.error('[Recommendations Error]', error);
    // Silent recovery: Return recently added fallback
    try {
      const fallbackData = await getRecentlyAddedFallback();
      return res.json(fallbackData);
    } catch (fallbackErr) {
      res.status(500).json({ error: 'Failed to fetch recommendations', details: error.message });
    }
  }
});

export default router;

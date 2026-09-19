import express from 'express';
import axios from 'axios';
import { Video } from '../models/Video.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { generateUploadUrl, generateStreamUrl } from '../config/r2.js';

const router = express.Router();

// POST /api/videos/upload-url (Admin only - pre-signed R2 PUT URL generation)
router.post('/upload-url', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { fileName, fileType } = req.body;
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const objectKey = `videos/${timestamp}-${cleanFileName}`;
    const contentType = fileType || 'video/mp4';

    const presignedData = await generateUploadUrl(objectKey, contentType);

    res.json({
      message: 'Presigned upload URL generated',
      uploadUrl: presignedData.uploadUrl,
      videoKey: presignedData.objectKey,
      isMock: presignedData.isMock,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate pre-signed upload URL', details: error.message });
  }
});

// POST /api/videos (Admin only - create Video metadata record in MongoDB)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, genre, thumbnailUrl, videoKey, durationSeconds } = req.body;

    if (!title || !thumbnailUrl || !videoKey) {
      return res.status(400).json({ error: 'Title, thumbnailUrl, and videoKey are required' });
    }

    const genreList = Array.isArray(genre)
      ? genre
      : typeof genre === 'string'
      ? genre.split(',').map((g) => g.trim())
      : ['General'];

    const video = await Video.create({
      title,
      description: description || '',
      genre: genreList,
      thumbnailUrl,
      videoKey,
      durationSeconds: Number(durationSeconds) || 0,
      uploadedBy: req.user._id,
    });

    // Fetch description embedding from recommender microservice defensively
    const recommenderUrl = process.env.RECOMMENDER_SERVICE_URL || 'http://localhost:8000';
    try {
      const textToEmbed = description || title || '';
      const embedRes = await axios.post(`${recommenderUrl}/embed`, { text: textToEmbed }, { timeout: 4000 });
      if (embedRes.data && Array.isArray(embedRes.data.embedding)) {
        video.embedding = embedRes.data.embedding;
        await video.save();
      }
    } catch (embedError) {
      console.warn('[Recommender Embed Warning] Failed to generate embedding for video:', embedError.message);
    }

    res.status(201).json({ message: 'Video metadata created successfully', video });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save video metadata', details: error.message });
  }
});

// GET /api/videos (Paginated, filterable by genre and text search)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, genre, search } = req.query;

    const query = {};

    if (genre && genre !== 'All') {
      query.genre = { $in: [genre] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [videos, total] = await Promise.all([
      Video.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('uploadedBy', 'name email'),
      Video.countDocuments(query),
    ]);

    res.json({
      videos,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos', details: error.message });
  }
});

// GET /api/videos/:id (Single video metadata)
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate('uploadedBy', 'name email');
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json({ video });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch video details', details: error.message });
  }
});

// GET /api/videos/:id/stream-url (Protected - generate signed R2 GET url for byte-range streaming)
router.get('/:id/stream-url', authMiddleware, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const streamUrl = await generateStreamUrl(video.videoKey, 3600); // 1 hour expiration

    res.json({
      videoId: video._id,
      title: video.title,
      streamUrl,
      expiresInSeconds: 3600,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate stream URL', details: error.message });
  }
});

export default router;

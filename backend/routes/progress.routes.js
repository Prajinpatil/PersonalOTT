import express from 'express';
import { WatchProgress } from '../models/WatchProgress.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/progress (Protected - fetch all watch progress for logged in user)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const progressList = await WatchProgress.find({ userId: req.user._id })
      .populate('videoId')
      .sort({ updatedAt: -1 });
      
    res.json({ progress: progressList });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch watch progress history', details: error.message });
  }
});

// GET /api/progress/:videoId (Protected - fetch watch progress for single video)
router.get('/:videoId', authMiddleware, async (req, res) => {
  try {
    const progress = await WatchProgress.findOne({
      userId: req.user._id,
      videoId: req.params.videoId,
    });

    res.json({ seconds: progress ? progress.seconds : 0, updatedAt: progress ? progress.updatedAt : null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch watch progress', details: error.message });
  }
});

// POST /api/progress/:videoId (Protected - save / update watch progress)
router.post('/:videoId', authMiddleware, async (req, res) => {
  try {
    const { seconds } = req.body;
    if (seconds === undefined || seconds === null) {
      return res.status(400).json({ error: 'seconds parameter is required' });
    }

    const progress = await WatchProgress.findOneAndUpdate(
      { userId: req.user._id, videoId: req.params.videoId },
      { seconds: Number(seconds), updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'Watch progress saved', progress });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save watch progress', details: error.message });
  }
});

export default router;

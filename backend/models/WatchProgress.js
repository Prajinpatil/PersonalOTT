import mongoose from 'mongoose';

const watchProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
  },
  seconds: {
    type: Number,
    required: true,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

watchProgressSchema.index({ userId: 1, videoId: 1 }, { unique: true });

export const WatchProgress = mongoose.model('WatchProgress', watchProgressSchema);

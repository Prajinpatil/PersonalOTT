import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Video title is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  genre: {
    type: [String],
    default: ['General'],
  },
  thumbnailUrl: {
    type: String,
    required: [true, 'Thumbnail URL is required'],
  },
  videoKey: {
    type: String,
    required: [true, 'R2 videoKey is required'],
  },
  durationSeconds: {
    type: Number,
    default: 0,
  },
  embedding: {
    type: [Number],
    default: null,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

videoSchema.index({ title: 'text', description: 'text' });

export const Video = mongoose.model('Video', videoSchema);

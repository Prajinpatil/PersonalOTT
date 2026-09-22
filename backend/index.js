import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Video } from './models/Video.js';
import { WatchProgress } from './models/WatchProgress.js';

import authRoutes from './routes/auth.routes.js';
import videoRoutes from './routes/video.routes.js';
import progressRoutes from './routes/progress.routes.js';
import recommendationsRouter from './routes/recommendations.routes.js';
import { catalog80Titles } from './config/catalog80.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Rate Limiters to protect single-instance cloud CPU/RAM against DoS & brute-force
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register requests per window
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration for Render + Vercel deployment & Local development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Apply rate limiting middleware
app.use('/api', generalApiLimiter);
app.use('/api/auth', authRateLimiter);

// Auto-sync 20 clean titles with audio across Horror, Sci-Fi, Comedy, and Thriller genres to MongoDB Atlas
const autoSeedCatalogIfEmpty = async () => {
  try {
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const userPasswordHash = await bcrypt.hash('user123', 10);

    const admin = await User.findOneAndUpdate(
      { email: 'admin@ott.com' },
      { name: 'OTT Admin', email: 'admin@ott.com', passwordHash: adminPasswordHash, role: 'admin' },
      { upsert: true, new: true }
    );

    await User.findOneAndUpdate(
      { email: 'user@ott.com' },
      { name: 'Demo Viewer', email: 'user@ott.com', passwordHash: userPasswordHash, role: 'user' },
      { upsert: true, new: true }
    );

    // Sync 20 clean titles with audio into MongoDB Atlas & prune older test records
    const validTitles = catalog80Titles.map(t => t.title);
    await Video.deleteMany({ title: { $nin: validTitles } });

    for (const item of catalog80Titles) {
      await Video.findOneAndUpdate(
        { title: item.title },
        {
          title: item.title,
          description: item.description,
          genre: item.genre,
          thumbnailUrl: item.thumbnailUrl,
          videoKey: item.r2Key,
          durationSeconds: item.durationSeconds || 180,
          uploadedBy: admin._id,
        },
        { upsert: true, new: true }
      );
    }
    const updatedCount = await Video.countDocuments();
    console.log(`[Catalog Sync Success] Successfully synced ${updatedCount} clean video titles with audio to MongoDB Atlas.`);
  } catch (err) {
    console.error('[Boot Sync Error]', err.message);
  }
};

// Database connection & startup check
connectDB().then(() => {
  autoSeedCatalogIfEmpty();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PersonalOTT Backend API',
    timestamp: new Date().toISOString(),
    architecture: 'Decoupled Metadata (MongoDB) + Pre-signed Direct Binary Storage (Cloudflare R2)',
  });
});

// Route registration
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/recommendations', recommendationsRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  PersonalOTT Server running on http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

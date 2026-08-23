import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

import authRoutes from './routes/auth.routes.js';
import videoRoutes from './routes/video.routes.js';
import progressRoutes from './routes/progress.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for Render + Vercel deployment & Local development
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for production portfolio demo
    },
    credentials: true,
  })
);

app.use(express.json());

// Database connection
connectDB();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PersonalOTT Backend API',
    timestamp: new Date().toISOString(),
    architecture: 'Decoupled Metadata (MongoDB) + Pre-signed Direct Binary Storage (Cloudflare R2)',
  });
});

// Mock upload endpoint for local testing when Cloudflare R2 credentials are mock/demo
app.put('/api/videos/mock-upload/*', (req, res) => {
  console.log('[Mock R2 Upload] File received successfully for key:', req.params[0]);
  res.status(200).send('Mock upload successful');
});

// Route registration
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/progress', progressRoutes);

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

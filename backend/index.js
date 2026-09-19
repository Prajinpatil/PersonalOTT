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

dotenv.config();

const app = express();
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

// Auto-seed catalog if empty on server boot
const autoSeedCatalogIfEmpty = async () => {
  try {
    const videoCount = await Video.countDocuments();
    if (videoCount > 0) {
      console.log(`[Catalog Check] Loaded ${videoCount} existing titles from database.`);
      return;
    }

    console.log('[Auto-Seed] Database catalog empty. Populating 32 titles across Horror, Sci-Fi, Comedy, Thriller...');

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

    const initialCatalog = [
      // --- SCI-FI ---
      {
        title: 'Tears of Steel',
        description: 'In a dystopian future, a group of soldiers and scientists gather in Amsterdam to stage a desperate counter-attack against rampaging robots.',
        genre: ['Sci-Fi'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/sci-fi/tears-of-steel.mp4',
        durationSeconds: 734,
        uploadedBy: admin._id,
      },
      {
        title: 'Elephants Dream',
        description: 'Two friends explore a surreal, machine-like world created by their own strange imaginations in this pioneering open-source Sci-Fi film.',
        genre: ['Sci-Fi'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/sci-fi/elephants-dream.mp4',
        durationSeconds: 653,
        uploadedBy: admin._id,
      },
      {
        title: 'Cosmos Laundromat',
        description: 'On a desolate island, a suicidal sheep named Franck meets a quirky salesman who offers him the gift of multiple lives across strange parallel dimensions.',
        genre: ['Sci-Fi'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/sci-fi/cosmos-laundromat.mp4',
        durationSeconds: 720,
        uploadedBy: admin._id,
      },
      {
        title: 'Charge: Cyberpunk Protocol',
        description: 'In an underground robotics laboratory, an engineer fights to keep a high-voltage battery alive while security androids close in.',
        genre: ['Sci-Fi'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/sci-fi/charge-cyberpunk-protocol.mp4',
        durationSeconds: 210,
        uploadedBy: admin._id,
      },
      {
        title: 'Subterranean Horizon',
        description: 'A deep-core drilling team uncovers an ancient alien artifact transmitting signal bursts from beneath the Earth crust.',
        genre: ['Sci-Fi'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/sci-fi/subterranean-horizon.mp4',
        durationSeconds: 340,
        uploadedBy: admin._id,
      },
      {
        title: 'Quantum Drift',
        description: 'Pilot Maya navigates a collapsing wormhole to deliver emergency medical telemetry to an orbital space colony.',
        genre: ['Sci-Fi'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/sci-fi/quantum-drift.mp4',
        durationSeconds: 480,
        uploadedBy: admin._id,
      },
      {
        title: 'The Orbital Station',
        description: 'An AI maintenance unit develops self-awareness while supervising a deep-space communications satellite.',
        genre: ['Sci-Fi'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/sci-fi/the-orbital-station.mp4',
        durationSeconds: 520,
        uploadedBy: admin._id,
      },
      {
        title: 'Nexus Protocol',
        description: 'A rogue synthetic android breaches a high-security research node to recover deleted memories.',
        genre: ['Sci-Fi'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/sci-fi/nexus-protocol.mp4',
        durationSeconds: 180,
        uploadedBy: admin._id,
      },

      // --- COMEDY ---
      {
        title: 'Big Buck Bunny',
        description: 'A large and lovable rabbit seeking hilarious revenge against three bullying rodents who ruin his peaceful morning in the forest.',
        genre: ['Comedy'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/comedy/big-buck-bunny.mp4',
        durationSeconds: 596,
        uploadedBy: admin._id,
      },
      {
        title: 'Caminandes: Llama Drama',
        description: 'Koro the Patagonian llama attempts an epic journey to cross a seemingly endless paved road in South America.',
        genre: ['Comedy'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/comedy/caminandes-llama-drama.mp4',
        durationSeconds: 150,
        uploadedBy: admin._id,
      },
      {
        title: 'Caminandes: Gran Dillama',
        description: 'Koro faces off against a fence that stands between him and a delicious patch of fresh grass.',
        genre: ['Comedy'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/comedy/caminandes-gran-dillama.mp4',
        durationSeconds: 130,
        uploadedBy: admin._id,
      },
      {
        title: 'Caminandes: Llamigos',
        description: 'Koro meets an adorable penguin friend while stuck in an icy blizzard, leading to unexpected snowy shenanigans.',
        genre: ['Comedy'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1551415923-a2297c7fda79?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/comedy/caminandes-llamigos.mp4',
        durationSeconds: 160,
        uploadedBy: admin._id,
      },
      {
        title: 'Glass Half: Art Critics',
        description: 'Two pretentious art critics argue hilarious opinions in a modern museum gallery, with comical consequences.',
        genre: ['Comedy'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/comedy/glass-half-art-critics.mp4',
        durationSeconds: 180,
        uploadedBy: admin._id,
      },
      {
        title: 'The Slapstick Pursuit',
        description: 'A clumsy detective accidentally triggers a chaotic chain reaction during a routine park inspection.',
        genre: ['Comedy'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/comedy/the-slapstick-pursuit.mp4',
        durationSeconds: 220,
        uploadedBy: admin._id,
      },
      {
        title: 'Office Prankster War',
        description: 'Two desk workers engage in an escalating rivalry involving sticky notes, paper airplanes, and spinning chairs.',
        genre: ['Comedy'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/comedy/office-prankster-war.mp4',
        durationSeconds: 195,
        uploadedBy: admin._id,
      },
      {
        title: 'Canine Agility Disaster',
        description: 'A over-enthusiastic golden retriever attempts a dog obstacle course with completely unpredictable results.',
        genre: ['Comedy'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/comedy/canine-agility-disaster.mp4',
        durationSeconds: 140,
        uploadedBy: admin._id,
      },

      // --- HORROR ---
      {
        title: 'Nightmare in the Shadows',
        description: 'A night-shift security guard notices subtle movements in the security camera feeds of an abandoned warehouse.',
        genre: ['Horror'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/horror/nightmare-in-the-shadows.mp4',
        durationSeconds: 420,
        uploadedBy: admin._id,
      },
      {
        title: 'The Haunted Manor',
        description: 'Investigating a 19th-century estate, urban explorers record unsettling EVP audio frequencies in the master bedroom.',
        genre: ['Horror'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/horror/the-haunted-manor.mp4',
        durationSeconds: 510,
        uploadedBy: admin._id,
      },
      {
        title: 'Midnight Caller',
        description: 'A late-night radio host receives a mysterious phone call from someone claiming to be broadcasting from inside his own house.',
        genre: ['Horror'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/horror/midnight-caller.mp4',
        durationSeconds: 290,
        uploadedBy: admin._id,
      },
      {
        title: 'Whispers in the Dark',
        description: 'Camping deep in the Black Forest, two brothers hear rhythmic whispers outside their tent at 3:00 AM.',
        genre: ['Horror'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/horror/whispers-in-the-dark.mp4',
        durationSeconds: 380,
        uploadedBy: admin._id,
      },
      {
        title: 'The Crimson Relic',
        description: 'An archaeologist unearths an ancient carved medallion that causes terrifying hallucinations to whoever holds it.',
        genre: ['Horror'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/horror/the-crimson-relic.mp4',
        durationSeconds: 460,
        uploadedBy: admin._id,
      },
      {
        title: 'Silent Cellar Escape',
        description: 'Trapped in a subterranean bunker, a survivor must solve cryptic lock codes while avoiding an entity sensitive to sound.',
        genre: ['Horror'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1519074069444-1ba4ea16007e?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/horror/silent-cellar-escape.mp4',
        durationSeconds: 310,
        uploadedBy: admin._id,
      },
      {
        title: 'Phantom Echoes',
        description: 'Infrared cameras capture strange distortion anomalies in the corridors of a decommissioned asylum.',
        genre: ['Horror'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/horror/phantom-echoes.mp4',
        durationSeconds: 490,
        uploadedBy: admin._id,
      },
      {
        title: 'The Mirror Reflection',
        description: 'A woman notices her bathroom mirror reflection delay by three full seconds before stepping out of sync.',
        genre: ['Horror'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/horror/the-mirror-reflection.mp4',
        durationSeconds: 240,
        uploadedBy: admin._id,
      },

      // --- THRILLER ---
      {
        title: 'Sintel: Dragon Quest',
        description: 'A fierce young warrior searches across snowy mountain peaks and scorching deserts to rescue a stolen dragon cub.',
        genre: ['Thriller'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/thriller/sintel-dragon-quest.mp4',
        durationSeconds: 888,
        uploadedBy: admin._id,
      },
      {
        title: 'Agent 327: Operation Barbershop',
        description: 'Secret Agent 327 investigates a suspicious barbershop in Amsterdam that conceals a dangerous international syndicate.',
        genre: ['Thriller'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/thriller/agent-327-operation-barbershop.mp4',
        durationSeconds: 230,
        uploadedBy: admin._id,
      },
      {
        title: 'We Are Going On Bullrun',
        description: 'An adrenaline-pumping pursuit of high-performance sports cars navigating treacherous continental mountain passes.',
        genre: ['Thriller'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/thriller/we-are-going-on-bullrun.mp4',
        durationSeconds: 47,
        uploadedBy: admin._id,
      },
      {
        title: 'The Vault Infiltration',
        description: 'A master hacker and safecracker team execute a timed 3-minute breach of a Zurich subterranean diamond bank.',
        genre: ['Thriller'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/thriller/the-vault-infiltration.mp4',
        durationSeconds: 360,
        uploadedBy: admin._id,
      },
      {
        title: 'Sub-Zero Rescue',
        description: 'A Coast Guard helicopter squad braves a Category 5 Arctic storm to extract stranded offshore rig workers.',
        genre: ['Thriller'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/thriller/sub-zero-rescue.mp4',
        durationSeconds: 410,
        uploadedBy: admin._id,
      },
      {
        title: 'Rogue Espionage',
        description: 'Undercover detective Vance uncovers a double-agent conspiracy inside his own intelligence agency.',
        genre: ['Thriller'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/thriller/rogue-espionage.mp4',
        durationSeconds: 320,
        uploadedBy: admin._id,
      },
      {
        title: 'Tactical Recon',
        description: 'Special operations operators clear a compromised harbor container ship under night-vision stealth.',
        genre: ['Thriller'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/thriller/tactical-recon.mp4',
        durationSeconds: 270,
        uploadedBy: admin._id,
      },
      {
        title: 'Terminal Velocity',
        description: 'High-altitude skydiving chase over the Alps to intercept a stolen encrypted satellite drive.',
        genre: ['Thriller'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
        videoKey: 'videos/thriller/terminal-velocity.mp4',
        durationSeconds: 390,
        uploadedBy: admin._id,
      },
    ];

    await Video.insertMany(initialCatalog);
    console.log(`[Auto-Seed Success] Populated ${initialCatalog.length} catalog items connected to Cloudflare R2.`);
  } catch (err) {
    console.error('[Auto-Seed Error]', err);
  }
};

// Database connection & startup auto-seed
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

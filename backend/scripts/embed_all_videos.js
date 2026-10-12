import dotenv from 'dotenv';
import crypto from 'crypto';
import { connectDB } from '../config/db.js';
import { Video } from '../models/Video.js';

dotenv.config({ path: 'backend/.env' });

// Deterministic 384-dimensional feature hashing vectorizer with L2 normalization
function generate384Embedding(text) {
  const dim = 384;
  const vector = new Array(dim).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

  for (const word of words) {
    // Generate multiple feature hashes per token
    for (let i = 0; i < 3; i++) {
      const hash = crypto.createHash('md5').update(`${word}_${i}`).digest('hex');
      const idx = parseInt(hash.substring(0, 8), 16) % dim;
      const val = (parseInt(hash.substring(8, 10), 16) % 2 === 0 ? 1 : -1);
      vector[idx] += val;
    }
  }

  // L2 Norm calculation
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vector[i] = vector[i] / norm;
    }
  }
  return vector;
}

async function embedAllVideos() {
  await connectDB();
  const videos = await Video.find({});
  console.log(`[Embedder] Generating 384-d feature vectors for ${videos.length} videos...`);

  let count = 0;
  for (const v of videos) {
    const textToEmbed = `${v.title}. ${v.description || ''} ${v.genre.join(' ')}`;
    const embedding = generate384Embedding(textToEmbed);
    v.embedding = embedding;
    await v.save();
    count++;
    console.log(` -> ✓ Embedded [${count}/${videos.length}]: "${v.title}"`);
  }

  console.log(`\n[Success] Successfully saved 384-dimensional embedding vectors for all ${count} videos in MongoDB!`);
  process.exit(0);
}

embedAllVideos();

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { connectDB } from '../config/db.js';
import { Video } from '../models/Video.js';
import { User } from '../models/User.js';

dotenv.config({ path: 'backend/.env' });

const MAX_R2_BYTES = 8 * 1024 * 1024 * 1024; // 8 GB limit

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// High quality curated posters by genre
const GENRE_THUMBNAILS = {
  Horror: [
    'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
  ],
  'Sci-Fi': [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
  ],
  Comedy: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1527224857830-43a7acc85260?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop',
  ],
  Action: [
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop',
  ],
  Thriller: [
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop',
  ],
};

function cleanTitle(rawName) {
  let title = rawName.replace(/\.mp4$/i, '');
  // Remove hashtags
  title = title.replace(/#[^\s#]+/g, '');
  // Remove emojis & special YouTube characters
  title = title.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  // Clean punctuation noise like _ and multiple spaces
  title = title.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (title.length < 3) title = rawName.replace(/\.mp4$/i, '');
  return title;
}

function detectGenre(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('horror') || lower.includes('nun') || lower.includes('lallorona') || lower.includes('mime') || lower.includes('terrifying') || lower.includes('scary')) {
    return 'Horror';
  }
  if (lower.includes('scifi') || lower.includes('science fiction') || lower.includes('solar storm') || lower.includes('wandering earth') || lower.includes('graboid') || lower.includes('companion robot') || lower.includes('murderbot') || lower.includes('lion\'s roar')) {
    return 'Sci-Fi';
  }
  if (lower.includes('funny') || lower.includes('comedy') || lower.includes('jethalal') || lower.includes('rajpal') || lower.includes('bean') || lower.includes('starbucks') || lower.includes('memes') || lower.includes('relatable') || lower.includes('mom') || lower.includes('welcome meme')) {
    return 'Comedy';
  }
  if (lower.includes('action') || lower.includes('fight') || lower.includes('john wick') || lower.includes('boyka') || lower.includes('reacher') || lower.includes('bruce lee') || lower.includes('cavill') || lower.includes('statham') || lower.includes('fury road') || lower.includes('parabellum') || lower.includes('mechanic')) {
    return 'Action';
  }
  return 'Thriller';
}

function generateDescription(title, genre) {
  const descriptions = {
    Horror: `A chilling suspense sequence involving ominous supernatural encounters, dark atmospheric tension, and terrifying unexplainable phenomena.`,
    'Sci-Fi': `An immersive futuristic sci-fi showcase exploring advanced robotics, interstellar phenomena, high-tech dystopian realities, and cosmic survival.`,
    Comedy: `A hilarious comedy highlight featuring relatable everyday situations, iconic comedic performances, chaotic humor, and unexpected laugh-out-loud moments.`,
    Action: `A high-octane action sequence featuring pulse-pounding hand-to-hand combat, relentless martial arts choreography, intense vehicle pursuits, and ultimate showdowns.`,
    Thriller: `A high-stakes thriller filled with intense adrenaline, dangerous stunts, edge-of-your-seat suspense, and razor-sharp survival instincts.`,
  };
  return `${title}: ${descriptions[genre] || descriptions.Thriller}`;
}

async function processUserOttFolder() {
  const ottFolderPath = 'E:\\ott';
  if (!fs.existsSync(ottFolderPath)) {
    console.error(`[Error] Directory not found at: ${ottFolderPath}`);
    process.exit(1);
  }

  const files = fs.readdirSync(ottFolderPath).filter(f => f.endsWith('.mp4'));
  console.log(`[Upload Job] Found ${files.length} MP4 files in ${ottFolderPath}`);

  await connectDB();

  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.log('[Info] Admin user missing. Auto-creating OTT Admin user...');
    admin = await User.create({
      name: 'OTT Admin',
      email: 'admin@ott.com',
      passwordHash: 'admin123_hash',
      role: 'admin',
    });
  }

  let totalUploadedBytes = 0;
  let successCount = 0;

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(ottFolderPath, filename);
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    if (totalUploadedBytes + fileSize > MAX_R2_BYTES) {
      console.warn(`[Safety Warning] Upload threshold limit (8 GB) reached! Stopping further uploads.`);
      break;
    }

    const title = cleanTitle(filename);
    const genre = detectGenre(filename);
    const description = generateDescription(title, genre);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const genreSlug = genre.toLowerCase();
    const r2Key = `videos/${genreSlug}/${slug}-${Date.now().toString().slice(-4)}.mp4`;

    const thumbs = GENRE_THUMBNAILS[genre] || GENRE_THUMBNAILS.Thriller;
    const thumbnailUrl = thumbs[i % thumbs.length];

    console.log(`\n[${i + 1}/${files.length}] Processing: "${title}" (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(` -> Genre: ${genre}`);
    console.log(` -> R2 Key: ${r2Key}`);

    try {
      // 1. Upload byte buffer to Cloudflare R2
      const fileBuffer = fs.readFileSync(filePath);
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: r2Key,
          Body: fileBuffer,
          ContentType: 'video/mp4',
        })
      );
      console.log(` -> ✓ Cloudflare R2 Upload Success!`);
      totalUploadedBytes += fileSize;

      // 2. Generate 384-dimensional embedding vector via FastAPI /embed
      let embedding = [];
      try {
        const recommenderUrl = process.env.RECOMMENDER_SERVICE_URL || 'http://localhost:8000';
        const embedRes = await axios.post(`${recommenderUrl}/embed`, { text: `${title}. ${description}` }, { timeout: 4000 });
        if (embedRes.data && Array.isArray(embedRes.data.embedding)) {
          embedding = embedRes.data.embedding;
          console.log(` -> ✓ MiniLM 384-d Embedding Generated!`);
        }
      } catch (embedErr) {
        console.warn(` -> ⚠️ FastAPI embed offline (${embedErr.message}), proceeding without vector...`);
      }

      // 3. Create Video metadata document in MongoDB Atlas
      await Video.create({
        title,
        description,
        genre: [genre],
        thumbnailUrl,
        videoKey: r2Key,
        durationSeconds: Math.floor(Math.random() * 300) + 120, // 2 to 7 mins estimate
        embedding: embedding.length > 0 ? embedding : null,
        uploadedBy: admin._id,
      });
      console.log(` -> ✓ MongoDB Atlas Record Saved!`);
      successCount++;
    } catch (err) {
      console.error(` -> ❌ Error processing file ${filename}:`, err.message);
    }
  }

  console.log('\n===========================================================');
  console.log(`  BATCH UPLOAD COMPLETE!`);
  console.log(`  Uploaded Videos: ${successCount} / ${files.length}`);
  console.log(`  Total Data Uploaded: ${(totalUploadedBytes / (1024 * 1024)).toFixed(2)} MB (Limit: 8,192 MB)`);
  console.log('===========================================================');
  process.exit(0);
}

processUserOttFolder();

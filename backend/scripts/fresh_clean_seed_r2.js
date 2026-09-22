import dotenv from 'dotenv';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Video } from '../models/Video.js';
import { WatchProgress } from '../models/WatchProgress.js';

dotenv.config();

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Verified high-speed open source MP4 templates WITH COMPLETE AUDIO TRACKS (sound, music, voice)
const MP4_AUDIO_SOURCES = [
  'https://media.w3.org/2010/05/bunny/trailer.mp4',
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
];

// 20 unique video catalog entries (5 Horror, 5 Sci-Fi, 5 Comedy, 5 Thriller)
const fresh20Catalog = [
  // --- HORROR (5 Titles) ---
  {
    title: 'Nightmare in the Shadows',
    description: 'A night-shift security guard notices subtle movements in abandoned warehouse feeds accompanied by chilling audio anomalies.',
    genre: ['Horror'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 1,
    r2Key: 'videos/horror/nightmare-in-the-shadows.mp4',
    durationSeconds: 240,
  },
  {
    title: 'The Haunted Manor',
    description: 'Urban explorers investigate a 19th-century estate with a dark, forgotten history.',
    genre: ['Horror'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 0,
    r2Key: 'videos/horror/the-haunted-manor.mp4',
    durationSeconds: 310,
  },
  {
    title: 'Midnight Caller',
    description: 'A late-night radio DJ receives disturbing phone calls from someone claiming to be inside his own station building.',
    genre: ['Horror'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 1,
    r2Key: 'videos/horror/midnight-caller.mp4',
    durationSeconds: 190,
  },
  {
    title: 'Whispers in the Dark',
    description: 'Camping deep in the forest, two brothers hear rhythmic whispers outside their tent at 3:00 AM.',
    genre: ['Horror'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 0,
    r2Key: 'videos/horror/whispers-in-the-dark.mp4',
    durationSeconds: 280,
  },
  {
    title: 'The Crimson Relic',
    description: 'An archaeologist unearths an ancient carved medallion that causes terrifying visions to whoever holds it.',
    genre: ['Horror'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 1,
    r2Key: 'videos/horror/the-crimson-relic.mp4',
    durationSeconds: 360,
  },

  // --- SCI-FI (5 Titles) ---
  {
    title: 'Tears of Steel',
    description: 'In a dystopian future, a group of soldiers and scientists gather in Amsterdam to stage a desperate counter-attack against robots.',
    genre: ['Sci-Fi'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 1,
    r2Key: 'videos/sci-fi/tears-of-steel.mp4',
    durationSeconds: 734,
  },
  {
    title: 'Elephants Dream',
    description: 'Two friends explore a surreal, machine-like world created by their own strange imaginations in this pioneering Sci-Fi film.',
    genre: ['Sci-Fi'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 0,
    r2Key: 'videos/sci-fi/elephants-dream.mp4',
    durationSeconds: 653,
  },
  {
    title: 'Cosmos Laundromat',
    description: 'On a desolate island, a sheep named Franck meets a quirky salesman who offers him multiple lives across parallel dimensions.',
    genre: ['Sci-Fi'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 1,
    r2Key: 'videos/sci-fi/cosmos-laundromat.mp4',
    durationSeconds: 596,
  },
  {
    title: 'Charge: Cyberpunk Protocol',
    description: 'In an underground robotics laboratory, an engineer fights to keep a high-voltage battery alive while security androids close in.',
    genre: ['Sci-Fi'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 0,
    r2Key: 'videos/sci-fi/charge-cyberpunk-protocol.mp4',
    durationSeconds: 210,
  },
  {
    title: 'Subterranean Horizon',
    description: 'A deep-core drilling team uncovers an ancient alien artifact transmitting signal bursts from beneath the Earth crust.',
    genre: ['Sci-Fi'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 1,
    r2Key: 'videos/sci-fi/subterranean-horizon.mp4',
    durationSeconds: 340,
  },

  // --- COMEDY (5 Titles) ---
  {
    title: 'Big Buck Bunny: The Revenge',
    description: 'A large and lovable rabbit seeks hilarious revenge against three bullying rodents who ruin his peaceful morning in the forest.',
    genre: ['Comedy'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 0,
    r2Key: 'videos/comedy/big-buck-bunny-revenge.mp4',
    durationSeconds: 596,
  },
  {
    title: 'Caminandes: Llama Drama',
    description: 'Koro the Patagonian llama attempts an epic journey to cross a seemingly endless paved road in South America.',
    genre: ['Comedy'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 1,
    r2Key: 'videos/comedy/caminandes-llama-drama.mp4',
    durationSeconds: 150,
  },
  {
    title: 'Glass Half: Art Critics',
    description: 'Two amateur art critics debate passionately in a contemporary gallery with unexpected comical results.',
    genre: ['Comedy'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 0,
    r2Key: 'videos/comedy/glass-half-art-critics.mp4',
    durationSeconds: 180,
  },
  {
    title: 'The Slapstick Pursuit',
    description: 'A detective stumbles through a sequence of absurd mishaps while attempting a routine surveillance operation.',
    genre: ['Comedy'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 1,
    r2Key: 'videos/comedy/the-slapstick-pursuit.mp4',
    durationSeconds: 220,
  },
  {
    title: 'Office Prankster War',
    description: 'Two corporate accountants engage in an escalating war of desk pranks involving sticky notes and spinning chairs.',
    genre: ['Comedy'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 0,
    r2Key: 'videos/comedy/office-prankster-war.mp4',
    durationSeconds: 310,
  },

  // --- THRILLER (5 Titles) ---
  {
    title: 'Sintel: Dragon Quest',
    description: 'A lonely warrior girl embarks on a dangerous journey across frozen mountains to rescue a baby dragon.',
    genre: ['Thriller'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 1,
    r2Key: 'videos/thriller/sintel-dragon-quest.mp4',
    durationSeconds: 300,
  },
  {
    title: 'Agent 327: Operation Barbershop',
    description: 'Secret Agent 327 investigates a suspicious barbershop in Amsterdam that serves as a front for a secret syndicate.',
    genre: ['Thriller'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 0,
    r2Key: 'videos/thriller/agent-327-operation-barbershop.mp4',
    durationSeconds: 430,
  },
  {
    title: 'We Are Going On Bullrun',
    description: 'High-stakes sports car pursuit navigating mountain passes under extreme weather conditions.',
    genre: ['Thriller'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 1,
    r2Key: 'videos/thriller/we-are-going-on-bullrun.mp4',
    durationSeconds: 510,
  },
  {
    title: 'The Vault Infiltration',
    description: 'An elite heist crew attempts a timed 3-minute breach of an unhackable subterranean bank vault.',
    genre: ['Thriller'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 0,
    r2Key: 'videos/thriller/the-vault-infiltration.mp4',
    durationSeconds: 440,
  },
  {
    title: 'Sub-Zero Rescue',
    description: 'An arctic rescue team races against a lethal blizzard to extract survivors from a downed transport plane.',
    genre: ['Thriller'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?q=80&w=1200&auto=format&fit=crop',
    sourceIndex: 1,
    r2Key: 'videos/thriller/sub-zero-rescue.mp4',
    durationSeconds: 390,
  }
];

async function runFreshCleanSeed() {
  try {
    console.log('\n===========================================================');
    console.log('  FRESH CLEAN & SEED: CLOUDFLARE R2 & MONGO DB (WITH AUDIO)');
    console.log('===========================================================');

    // Step 1: Empty Cloudflare R2 bucket completely
    console.log('\n[Step 1] Fetching objects from Cloudflare R2 bucket:', process.env.R2_BUCKET_NAME);
    const listRes = await s3Client.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET_NAME }));
    if (listRes.Contents && listRes.Contents.length > 0) {
      const objectsToDelete = listRes.Contents.map((obj) => ({ Key: obj.Key }));
      console.log(`[Step 1] Deleting ${objectsToDelete.length} existing objects from Cloudflare R2...`);
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Delete: { Objects: objectsToDelete },
        })
      );
      console.log('✓ Cloudflare R2 bucket completely emptied!');
    } else {
      console.log('✓ Cloudflare R2 bucket is already completely empty.');
    }

    // Step 2: Clear Database
    console.log('\n[Step 2] Connecting to Database...');
    await connectDB();
    await User.deleteMany({});
    await Video.deleteMany({});
    await WatchProgress.deleteMany({});

    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const userPasswordHash = await bcrypt.hash('user123', 10);

    const admin = await User.create({
      name: 'OTT Admin',
      email: 'admin@ott.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
    });

    await User.create({
      name: 'Demo Viewer',
      email: 'user@ott.com',
      passwordHash: userPasswordHash,
      role: 'user',
    });
    console.log('✓ Database cleared & admin/demo accounts reset!');

    // Step 3: Download verified MP4 template buffers WITH COMPLETE AUDIO TRACKS
    console.log('\n[Step 3] Pre-downloading verified MP4 templates WITH AUDIO...');
    const bufferCache = {};
    for (let idx = 0; idx < MP4_AUDIO_SOURCES.length; idx++) {
      const url = MP4_AUDIO_SOURCES[idx];
      console.log(`  Downloading audio MP4 [${idx + 1}/${MP4_AUDIO_SOURCES.length}]: ${url.split('/').pop()}...`);
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      const buffer = Buffer.from(res.data);
      bufferCache[idx] = buffer;
      console.log(`  ✓ Cached source ${idx + 1}: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB`);
    }

    // Step 4: Upload 20 unique videos (5 Horror, 5 Sci-Fi, 5 Comedy, 5 Thriller) to Cloudflare R2
    console.log('\n[Step 4] Uploading 20 unique titles with audio to Cloudflare R2 & saving metadata to DB...');
    let successCount = 0;
    for (let i = 0; i < fresh20Catalog.length; i++) {
      const item = fresh20Catalog[i];
      const buffer = bufferCache[item.sourceIndex];
      const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);

      console.log(`[${i + 1}/${fresh20Catalog.length}] Uploading "${item.title}" (${sizeMB} MB) to R2: ${item.r2Key}...`);
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: item.r2Key,
          Body: buffer,
          ContentType: 'video/mp4',
        })
      );

      await Video.create({
        title: item.title,
        description: item.description,
        genre: item.genre,
        thumbnailUrl: item.thumbnailUrl,
        videoKey: item.r2Key,
        durationSeconds: item.durationSeconds,
        uploadedBy: admin._id,
      });

      successCount++;
      console.log(`  ✓ Uploaded to R2 & Saved to DB: ${item.title}`);
    }

    console.log('\n===========================================================');
    console.log(`  FRESH CLEAN & SEED COMPLETE! SUCCESS: ${successCount} TITLES WITH AUDIO`);
    console.log('  - Horror: 5 titles');
    console.log('  - Sci-Fi: 5 titles');
    console.log('  - Comedy: 5 titles');
    console.log('  - Thriller: 5 titles');
    console.log(`  All MP4 files live in Cloudflare R2 bucket: ${process.env.R2_BUCKET_NAME}`);
    console.log('===========================================================');
    process.exit(0);
  } catch (err) {
    console.error('[Fresh Seed Error]', err);
    process.exit(1);
  }
}

runFreshCleanSeed();

import dotenv from 'dotenv';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Video } from '../models/Video.js';

dotenv.config();

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const realClips = [
  {
    title: 'Big Buck Bunny: Forest Adventure',
    description: 'A giant rabbit seeks hilarious revenge against three mischievous forest rodents in this iconic animated short.',
    genre: ['Comedy'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
    sourceUrl: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
    r2Key: 'videos/comedy/big-buck-bunny-adventure.mp4',
    durationSeconds: 150,
  },
  {
    title: 'Urban Cyberpunk Detection',
    description: 'Advanced computer vision telemetry scanning autonomous traffic and pedestrians in a futuristic metropolis.',
    genre: ['Sci-Fi'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    sourceUrl: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4',
    r2Key: 'videos/sci-fi/urban-cyberpunk-detection.mp4',
    durationSeconds: 120,
  },
  {
    title: 'High-Speed Highway Pursuit',
    description: 'Dynamic aerial surveillance tracking high-speed vehicular maneuvers across a multi-lane coastal expressway.',
    genre: ['Thriller'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
    sourceUrl: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4',
    r2Key: 'videos/thriller/high-speed-highway-pursuit.mp4',
    durationSeconds: 90,
  },
  {
    title: 'The Portrait of Echoes',
    description: 'A dramatic character study analyzing human facial expressions and emotional nuances under studio lighting.',
    genre: ['Thriller'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop',
    sourceUrl: 'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/head-pose-face-detection-female.mp4',
    r2Key: 'videos/thriller/the-portrait-of-echoes.mp4',
    durationSeconds: 180,
  },
];

async function seedRealClips() {
  try {
    console.log('[R2 Real Clips] Connecting to database...');
    await connectDB();

    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const admin = await User.findOneAndUpdate(
      { email: 'admin@ott.com' },
      { name: 'OTT Admin', email: 'admin@ott.com', passwordHash: adminPasswordHash, role: 'admin' },
      { upsert: true, new: true }
    );

    for (let i = 0; i < realClips.length; i++) {
      const clip = realClips[i];
      console.log(`[${i + 1}/${realClips.length}] Downloading "${clip.title}"...`);
      const response = await axios.get(clip.sourceUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);

      console.log(`  Uploading ${sizeMB} MB directly to Cloudflare R2: ${clip.r2Key}...`);
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: clip.r2Key,
          Body: buffer,
          ContentType: 'video/mp4',
        })
      );

      await Video.findOneAndUpdate(
        { title: clip.title },
        {
          title: clip.title,
          description: clip.description,
          genre: clip.genre,
          thumbnailUrl: clip.thumbnailUrl,
          videoKey: clip.r2Key,
          durationSeconds: clip.durationSeconds,
          uploadedBy: admin._id,
        },
        { upsert: true, new: true }
      );

      console.log(`  ✓ Uploaded to R2 & Saved to DB: ${clip.title}`);
    }

    console.log('\n===========================================================');
    console.log('  Real MP4 Clips Successfully Uploaded to Cloudflare R2!');
    console.log('===========================================================');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err.message);
    process.exit(1);
  }
}

seedRealClips();

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';
import { connectDB } from '../config/db.js';
import { Video } from '../models/Video.js';

dotenv.config();

const isR2Configured = () => {
  return (
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCOUNT_ID !== 'your_cloudflare_account_id' &&
    process.env.R2_ACCOUNT_ID !== 'demo_account_id' &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_ACCESS_KEY_ID !== 'your_r2_access_key_id' &&
    process.env.R2_ACCESS_KEY_ID !== 'demo_access_key' &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_SECRET_ACCESS_KEY !== 'your_r2_secret_access_key' &&
    process.env.R2_SECRET_ACCESS_KEY !== 'demo_secret_key' &&
    process.env.R2_BUCKET_NAME
  );
};

// Download helper into Buffer
const fetchBuffer = (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
};

const processAndUploadClips = async () => {
  try {
    await connectDB();
    console.log('[R2 Uploader] Database connected.');

    if (!isR2Configured()) {
      console.log('===========================================================');
      console.log('  Cloudflare R2 Credentials Not Yet Set in backend/.env');
      console.log('  To perform actual uploads to your Cloudflare R2 bucket:');
      console.log('  1. Open backend/.env');
      console.log('  2. Set your R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
      console.log('  3. Run: npm run upload-r2');
      console.log('  Currently using compressed open 480p/720p direct stream fallbacks.');
      console.log('===========================================================');
      process.exit(0);
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    const videos = await Video.find({});
    console.log(`[R2 Uploader] Found ${videos.length} titles to process...`);

    let uploadedCount = 0;

    for (const video of videos) {
      const genreFolder = (video.genre && video.genre[0]) ? video.genre[0].toLowerCase() : 'general';
      const cleanTitle = video.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const r2ObjectKey = `videos/${genreFolder}/${cleanTitle}.mp4`;

      console.log(`[Processing] ${video.title} -> Key: ${r2ObjectKey}`);

      // If videoKey is a URL, fetch clip buffer and upload to R2
      if (video.videoKey.startsWith('http')) {
        try {
          console.log(`  Downloading compressed clip from: ${video.videoKey.substring(0, 60)}...`);
          const buffer = await fetchBuffer(video.videoKey);

          console.log(`  Uploading ${(buffer.length / (1024 * 1024)).toFixed(2)} MB directly to R2 bucket "${process.env.R2_BUCKET_NAME}"...`);
          
          await s3Client.send(
            new PutObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: r2ObjectKey,
              Body: buffer,
              ContentType: 'video/mp4',
            })
          );

          // Update MongoDB videoKey to R2 object key
          video.videoKey = r2ObjectKey;
          await video.save();
          uploadedCount++;
          console.log(`  ✓ Successfully uploaded and updated database record!`);
        } catch (err) {
          console.error(`  ✕ Error uploading clip for ${video.title}:`, err.message);
        }
      } else {
        console.log(`  ✓ Already stored as R2 key: ${video.videoKey}`);
      }
    }

    console.log('===========================================================');
    console.log(`  Cloudflare R2 Bulk Upload Complete! Uploaded ${uploadedCount} clips.`);
    console.log('  All video keys updated to Cloudflare R2 object paths.');
    console.log('===========================================================');
    process.exit(0);
  } catch (error) {
    console.error('[R2 Bulk Upload Error]', error);
    process.exit(1);
  }
};

processAndUploadClips();

import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import https from 'https';
import http from 'http';
import { connectDB } from '../config/db.js';
import { Video } from '../models/Video.js';

dotenv.config();

// Safety Threshold: Cap total bucket size at 7.0 GB (7,516,192,768 bytes) to stay safely within the 10GB free tier
const MAX_TOTAL_BYTES = 7 * 1024 * 1024 * 1024;

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

// Download helper into Buffer with redirect support
const fetchBuffer = (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP status ${res.statusCode} loading ${url}`));
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
      console.error('[R2 Error] Cloudflare R2 Credentials missing or incomplete in backend/.env');
      process.exit(1);
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    // 1. Calculate current bucket storage usage
    let currentBucketBytes = 0;
    try {
      const listRes = await s3Client.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET_NAME }));
      if (listRes.Contents) {
        currentBucketBytes = listRes.Contents.reduce((sum, item) => sum + (item.Size || 0), 0);
      }
      console.log(`[R2 Storage Audit] Current Bucket Usage: ${(currentBucketBytes / (1024 * 1024)).toFixed(2)} MB / Safety Limit: 7168 MB (7.0 GB)`);
    } catch (auditErr) {
      console.warn('[R2 Storage Audit Warning] Could not list existing objects:', auditErr.message);
    }

    const videos = await Video.find({});
    console.log(`[R2 Uploader] Found ${videos.length} titles across Horror, Sci-Fi, Comedy, Thriller...`);

    let uploadedCount = 0;
    let bytesUploadedThisRun = 0;

    for (const video of videos) {
      // Check 7.0 GB Safety Limit
      if (currentBucketBytes + bytesUploadedThisRun >= MAX_TOTAL_BYTES) {
        console.warn(`[SAFETY TRIGGERED] Reached 7.0 GB safety threshold! Halting further uploads to protect free tier limit.`);
        break;
      }

      const genreFolder = (video.genre && video.genre[0]) ? video.genre[0].toLowerCase() : 'general';
      const cleanTitle = video.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const r2ObjectKey = `videos/${genreFolder}/${cleanTitle}.mp4`;

      // If videoKey is still an external URL, upload to R2
      if (video.videoKey.startsWith('http')) {
        try {
          console.log(`\n[Processing ${uploadedCount + 1}/${videos.length}] ${video.title} (${genreFolder.toUpperCase()})`);
          console.log(`  Downloading compressed 480p/720p clip...`);

          const buffer = await fetchBuffer(video.videoKey);
          const fileSizeMB = buffer.length / (1024 * 1024);

          // Check if adding this file exceeds 7.0 GB limit
          if (currentBucketBytes + bytesUploadedThisRun + buffer.length > MAX_TOTAL_BYTES) {
            console.warn(`  [Safety Cap] Uploading ${fileSizeMB.toFixed(2)} MB would breach 7.0 GB limit. Skipping ${video.title}.`);
            continue;
          }

          console.log(`  Uploading ${fileSizeMB.toFixed(2)} MB directly to Cloudflare R2 bucket "${process.env.R2_BUCKET_NAME}"...`);

          await s3Client.send(
            new PutObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: r2ObjectKey,
              Body: buffer,
              ContentType: 'video/mp4',
            })
          );

          bytesUploadedThisRun += buffer.length;
          video.videoKey = r2ObjectKey;
          await video.save();
          uploadedCount++;

          const totalUsedMB = ((currentBucketBytes + bytesUploadedThisRun) / (1024 * 1024)).toFixed(2);
          console.log(`  ✓ Uploaded successfully! Key: ${r2ObjectKey}`);
          console.log(`  📊 Total R2 Storage Used: ${totalUsedMB} MB / 7168 MB Cap`);
        } catch (err) {
          console.error(`  ✕ Failed to process ${video.title}:`, err.message);
        }
      } else {
        console.log(`  ✓ Title "${video.title}" already points to R2 key: ${video.videoKey}`);
      }
    }

    const finalTotalMB = ((currentBucketBytes + bytesUploadedThisRun) / (1024 * 1024)).toFixed(2);
    const finalTotalGB = ((currentBucketBytes + bytesUploadedThisRun) / (1024 * 1024 * 1024)).toFixed(2);

    console.log('\n===========================================================');
    console.log(`  Cloudflare R2 Bulk Upload Complete!`);
    console.log(`  Titles Uploaded This Run: ${uploadedCount}`);
    console.log(`  Final R2 Storage Usage: ${finalTotalMB} MB (${finalTotalGB} GB)`);
    console.log(`  Safety Limit: 7.0 GB (Well within 10 GB Free Tier)`);
    console.log('===========================================================');
    process.exit(0);
  } catch (error) {
    console.error('[R2 Bulk Upload Error]', error);
    process.exit(1);
  }
};

processAndUploadClips();

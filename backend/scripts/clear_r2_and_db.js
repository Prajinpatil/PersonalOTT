import dotenv from 'dotenv';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { connectDB } from '../config/db.js';
import { Video } from '../models/Video.js';

dotenv.config({ path: 'backend/.env' });

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function clearR2AndDb() {
  try {
    console.log('[R2 Cleanup] Fetching objects from Cloudflare R2 bucket:', process.env.R2_BUCKET_NAME);
    const listRes = await s3Client.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET_NAME }));
    
    if (listRes.Contents && listRes.Contents.length > 0) {
      const objectsToDelete = listRes.Contents.map((obj) => ({ Key: obj.Key }));
      console.log(`[R2 Cleanup] Deleting ${objectsToDelete.length} sample objects from Cloudflare R2...`);
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Delete: { Objects: objectsToDelete },
        })
      );
      console.log('[R2 Cleanup] Cloudflare R2 bucket cleared successfully!');
    } else {
      console.log('[R2 Cleanup] Cloudflare R2 bucket is already empty.');
    }

    // Connect to database and clear videos
    await connectDB();
    const deleted = await Video.deleteMany({});
    console.log(`[DB Cleanup] Removed ${deleted.deletedCount} video records from MongoDB database.`);

    console.log('\n===========================================================');
    console.log('  Cloudflare R2 Bucket & Database Cleared Successfully!');
    console.log('===========================================================');
    process.exit(0);
  } catch (err) {
    console.error('[Cleanup Error]', err.message);
    process.exit(1);
  }
}

clearR2AndDb();

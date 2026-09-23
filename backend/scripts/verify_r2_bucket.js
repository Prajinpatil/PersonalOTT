import dotenv from 'dotenv';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

dotenv.config({ path: 'backend/.env' });

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function verifyR2() {
  const listRes = await s3Client.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET_NAME }));
  console.log(`\n===========================================================`);
  console.log(` Cloudflare R2 Bucket: ${process.env.R2_BUCKET_NAME}`);
  console.log(` Total Objects Present: ${listRes.Contents?.length || 0}`);
  console.log(`===========================================================`);

  if (listRes.Contents) {
    let totalBytes = 0;
    listRes.Contents.forEach((obj, idx) => {
      totalBytes += obj.Size;
      console.log(`[${idx + 1}] Key: ${obj.Key} (${(obj.Size / (1024 * 1024)).toFixed(2)} MB)`);
    });
    console.log(`\nTotal R2 Bucket Storage Used: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  }
}

verifyR2();

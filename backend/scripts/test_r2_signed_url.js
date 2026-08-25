import dotenv from 'dotenv';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import axios from 'axios';

dotenv.config();

const testR2DirectSignedUrl = async () => {
  try {
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    const key = 'videos/sci-fi/tears-of-steel.mp4';
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log('[R2 Direct Test] Generated R2 Presigned GET URL:\n', signedUrl);

    console.log('\n[R2 Direct Test] Sending HTTP Range GET request to Cloudflare R2...');
    const response = await axios.get(signedUrl, {
      headers: {
        'Range': 'bytes=0-1024'
      },
      validateStatus: false
    });

    console.log('[R2 Direct Test] Response Status:', response.status);
    console.log('[R2 Direct Test] Response Headers:', response.headers);

    if (response.status === 206 || response.status === 200) {
      console.log('✓ Cloudflare R2 direct stream is 100% WORKING and serving video bytes!');
    } else {
      console.error('✕ R2 returned status:', response.status, response.data);
    }
  } catch (err) {
    console.error('✕ Error testing direct R2 URL:', err.message);
  }
};

testR2DirectSignedUrl();

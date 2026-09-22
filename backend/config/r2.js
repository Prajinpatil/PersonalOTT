import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const isR2Configured = () => {
  return (
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCOUNT_ID !== 'demo_account_id' &&
    process.env.R2_ACCOUNT_ID !== 'your_cloudflare_account_id' &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_ACCESS_KEY_ID !== 'demo_access_key' &&
    process.env.R2_ACCESS_KEY_ID !== 'your_r2_access_key_id' &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_SECRET_ACCESS_KEY !== 'demo_secret_key' &&
    process.env.R2_SECRET_ACCESS_KEY !== 'your_r2_secret_access_key' &&
    process.env.R2_BUCKET_NAME
  );
};

let s3Client = null;

const getS3Client = () => {
  if (s3Client) return s3Client;
  if (isR2Configured()) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
};

/**
 * Generate a pre-signed PUT URL for client-side direct upload to Cloudflare R2
 */
export const generateUploadUrl = async (objectKey, contentType = 'video/mp4') => {
  const client = getS3Client();
  if (!client) {
    return {
      uploadUrl: `http://localhost:${process.env.PORT || 5000}/api/videos/mock-upload/${objectKey}`,
      objectKey,
      isMock: true
    };
  }

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: objectKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 }); // 15 minutes
  return {
    uploadUrl,
    objectKey,
    isMock: false
  };
};

/**
 * Generate a pre-signed GET URL for direct byte-range video streaming from Cloudflare R2
 */
export const generateStreamUrl = async (objectKey, expiresIn = 3600) => {
  if (!objectKey) return null;

  // If objectKey is already a direct HTTP/HTTPS URL, return directly
  if (objectKey.startsWith('http://') || objectKey.startsWith('https://')) {
    return objectKey;
  }

  const client = getS3Client();
  if (!client) {
    console.error('[R2 Error] R2 storage is not configured on server. Missing R2 environment variables.');
    throw new Error('Cloudflare R2 storage credentials not configured on server');
  }

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: objectKey,
  });

  return await getSignedUrl(client, command, { expiresIn }); // 1 hour expiration
};

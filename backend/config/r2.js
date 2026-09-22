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

/**
 * Generate a pre-signed PUT URL for client-side direct upload to Cloudflare R2
 */
export const generateUploadUrl = async (objectKey, contentType = 'video/mp4') => {
  if (!isR2Configured() || !s3Client) {
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

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 minutes
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
  if (!objectKey) return 'https://media.w3.org/2010/05/sintel/trailer.mp4';

  // 1. If objectKey is a working HTTP/HTTPS URL (e.g. public sample videos), return directly
  if (objectKey.startsWith('http://') || objectKey.startsWith('https://')) {
    return objectKey;
  }

  // 2. If R2 is not configured, return fallback sample
  if (!isR2Configured() || !s3Client) {
    return 'https://media.w3.org/2010/05/sintel/trailer.mp4';
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
    });

    return await getSignedUrl(s3Client, command, { expiresIn }); // 1 hour expiration
  } catch (error) {
    console.error(`[R2 Stream Sign Error] Failed to generate signed GET URL for key ${objectKey}:`, error.message);
    return 'https://media.w3.org/2010/05/sintel/trailer.mp4';
  }
};

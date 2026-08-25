import dotenv from 'dotenv';
import { generateStreamUrl } from '../config/r2.js';
import axios from 'axios';

dotenv.config();

const testStreamUrl = async () => {
  try {
    const objectKey = 'videos/sci-fi/tears-of-steel.mp4';
    console.log('[Test Stream] Generating presigned GET URL for key:', objectKey);

    const streamUrl = await generateStreamUrl(objectKey, 3600);
    console.log('[Test Stream] Presigned GET URL generated:\n', streamUrl);

    console.log('\n[Test Stream] Testing HTTP Range request to R2 URL...');
    const response = await axios.get(streamUrl, {
      headers: {
        'Range': 'bytes=0-1024',
        'User-Agent': 'Mozilla/5.0'
      },
      validateStatus: false
    });

    console.log('[Test Stream] Response HTTP Status:', response.status);
    console.log('[Test Stream] Response Headers:', response.headers);

    if (response.status === 206 || response.status === 200) {
      console.log('✓ Stream URL is working and returning video bytes!');
    } else {
      console.error('✕ Stream request returned error status:', response.status, response.data);
    }
  } catch (err) {
    console.error('✕ Error testing stream URL:', err.message);
  }
};

testStreamUrl();

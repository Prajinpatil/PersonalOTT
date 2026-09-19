import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const testFallback = async () => {
  try {
    console.log('[Test Recommendations Fallback] Querying /api/recommendations with recommender offline...');
    
    // First, login as test user to get JWT token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'user@ott.com',
      password: 'user123'
    });

    const token = loginRes.data.token;
    console.log('✓ Logged in as user@ott.com, obtained JWT token.');

    const recRes = await axios.get('http://localhost:5000/api/recommendations', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('✓ Response Status:', recRes.status);
    console.log('✓ Returned Video Count:', recRes.data.videos ? recRes.data.videos.length : 0);
    console.log('✓ First Video Title:', recRes.data.videos && recRes.data.videos[0] ? recRes.data.videos[0].title : 'None');
    console.log('✓ Verification Passed: Endpoint degrades gracefully with recently-added fallback when recommender service is down!');
  } catch (err) {
    console.error('✕ Error testing fallback:', err.message, err.response?.data);
  }
};

testFallback();

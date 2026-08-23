import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/personal_ott';
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`[MongoDB] Connected to Host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Warning] Primary connection failed (${error.message}). Initializing fallback in-memory MongoDB...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`[MongoDB Memory Server] Connected successfully to in-memory instance at: ${memoryUri}`);
      return conn;
    } catch (memError) {
      console.error('[MongoDB Critical Error] Failed to initialize in-memory fallback:', memError.message);
    }
  }
};

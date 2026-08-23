import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Video } from '../models/Video.js';
import { WatchProgress } from '../models/WatchProgress.js';

dotenv.config();

const sampleVideos = [
  {
    title: 'Tears of Steel',
    description: 'In an apocalyptic future, a group of soldiers and scientists gather in Amsterdam to stage a desperate counter-attack against rampaging robots.',
    genre: ['Sci-Fi', 'Action'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    durationSeconds: 734,
  },
  {
    title: 'Sintel',
    description: 'A lonely young woman named Sintel searches for a dragon cub she befriended after it is snatched by an adult dragon.',
    genre: ['Fantasy', 'Animation', 'Drama'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    durationSeconds: 888,
  },
  {
    title: 'Big Buck Bunny',
    description: 'A large and lovable rabbit seeking revenge against three bullying rodents who ruin his peaceful morning.',
    genre: ['Animation', 'Comedy'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    durationSeconds: 596,
  },
  {
    title: 'Elephant Dream',
    description: 'Two friends explore a surreal, machine-like world created by their own strange imaginations.',
    genre: ['Sci-Fi', 'Animation'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    durationSeconds: 653,
  },
  {
    title: 'For Bigger Blazes',
    description: 'An adrenaline-fueled documentary detailing high-speed emergency response teams and wildland firefighters.',
    genre: ['Documentary', 'Action'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationSeconds: 15,
  },
  {
    title: 'We Are Going On Bullrun',
    description: 'An exclusive look behind the scenes of high-stakes sports cars navigating extreme continental terrain.',
    genre: ['Action', 'Documentary'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    durationSeconds: 47,
  },
];

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Database connected successfully.');

    // Clean existing data
    await User.deleteMany({});
    await Video.deleteMany({});
    await WatchProgress.deleteMany({});
    console.log('[Seed] Cleared existing Users, Videos, and WatchProgress');

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const userPasswordHash = await bcrypt.hash('user123', 10);

    // Create users
    const admin = await User.create({
      name: 'OTT Admin',
      email: 'admin@ott.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
    });

    const user = await User.create({
      name: 'Demo Viewer',
      email: 'user@ott.com',
      passwordHash: userPasswordHash,
      role: 'user',
    });

    console.log('[Seed] Created Admin User (admin@ott.com) & Demo User (user@ott.com)');

    // Create videos
    const createdVideos = await Video.insertMany(
      sampleVideos.map((v) => ({
        ...v,
        uploadedBy: admin._id,
      }))
    );
    console.log(`[Seed] Created ${createdVideos.length} sample videos`);

    // Create initial watch progress for demo user on first video
    if (createdVideos.length > 0) {
      await WatchProgress.create({
        userId: user._id,
        videoId: createdVideos[0]._id,
        seconds: 145,
      });
      console.log('[Seed] Created sample WatchProgress record for Demo Viewer');
    }

    console.log('=======================================================');
    console.log('  Database seeding completed successfully!');
    console.log('  Admin Credentials: email: admin@ott.com | password: admin123');
    console.log('  User Credentials:  email: user@ott.com  | password: user123');
    console.log('=======================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedData();

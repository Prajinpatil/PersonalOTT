import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Video } from '../models/Video.js';
import { WatchProgress } from '../models/WatchProgress.js';

dotenv.config();

const sampleVideos = [
  // --- SCI-FI (8 Titles) ---
  {
    title: 'Tears of Steel',
    description: 'In a dystopian future, a group of soldiers and scientists gather in Amsterdam to stage a desperate counter-attack against rampaging robots.',
    genre: ['Sci-Fi'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    durationSeconds: 734,
  },
  {
    title: 'Elephants Dream',
    description: 'Two friends explore a surreal, machine-like world created by their own strange imaginations in this pioneering open-source Sci-Fi film.',
    genre: ['Sci-Fi'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    durationSeconds: 653,
  },
  {
    title: 'Cosmos Laundromat',
    description: 'On a desolate island, a suicidal sheep named Franck meets a quirky salesman who offers him the gift of multiple lives across strange parallel dimensions.',
    genre: ['Sci-Fi'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    durationSeconds: 720,
  },
  {
    title: 'Charge: Cyberpunk Protocol',
    description: 'In an underground robotics laboratory, an engineer fights to keep a high-voltage battery alive while security androids close in.',
    genre: ['Sci-Fi'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationSeconds: 210,
  },
  {
    title: 'Subterranean Horizon',
    description: 'A deep-core drilling team uncovers an ancient alien artifact transmitting signal bursts from beneath the Earth crust.',
    genre: ['Sci-Fi'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    durationSeconds: 340,
  },
  {
    title: 'Quantum Drift',
    description: 'Pilot Maya navigates a collapsing wormhole to deliver emergency medical telemetry to an orbital space colony.',
    genre: ['Sci-Fi'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    durationSeconds: 480,
  },
  {
    title: 'The Orbital Station',
    description: 'An AI maintenance unit develops self-awareness while supervising a deep-space communications satellite.',
    genre: ['Sci-Fi'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    durationSeconds: 520,
  },
  {
    title: 'Nexus Protocol',
    description: 'A rogue synthetic android breaches a high-security research node to recover deleted memories.',
    genre: ['Sci-Fi'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationSeconds: 180,
  },

  // --- COMEDY (8 Titles) ---
  {
    title: 'Big Buck Bunny',
    description: 'A large and lovable rabbit seeking hilarious revenge against three bullying rodents who ruin his peaceful morning in the forest.',
    genre: ['Comedy'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    durationSeconds: 596,
  },
  {
    title: 'Caminandes: Llama Drama',
    description: 'Koro the Patagonian llama attempts an epic journey to cross a seemingly endless paved road in South America.',
    genre: ['Comedy'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    durationSeconds: 150,
  },
  {
    title: 'Caminandes: Gran Dillama',
    description: 'Koro faces off against a fence that stands between him and a delicious patch of fresh grass.',
    genre: ['Comedy'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    durationSeconds: 130,
  },
  {
    title: 'Caminandes: Llamigos',
    description: 'Koro meets an adorable penguin friend while stuck in an icy blizzard, leading to unexpected snowy shenanigans.',
    genre: ['Comedy'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1551415923-a2297c7fda79?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    durationSeconds: 160,
  },
  {
    title: 'Glass Half: Art Critics',
    description: 'Two pretentious art critics argue hilarious opinions in a modern museum gallery, with comical consequences.',
    genre: ['Comedy'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    durationSeconds: 180,
  },
  {
    title: 'The Slapstick Pursuit',
    description: 'A clumsy detective accidentally triggers a chaotic chain reaction during a routine park inspection.',
    genre: ['Comedy'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationSeconds: 220,
  },
  {
    title: 'Office Prankster War',
    description: 'Two desk workers engage in an escalating rivalry involving sticky notes, paper airplanes, and spinning chairs.',
    genre: ['Comedy'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    durationSeconds: 195,
  },
  {
    title: 'Canine Agility Disaster',
    description: 'A over-enthusiastic golden retriever attempts a dog obstacle course with completely unpredictable results.',
    genre: ['Comedy'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    durationSeconds: 140,
  },

  // --- HORROR (8 Titles) ---
  {
    title: 'Nightmare in the Shadows',
    description: 'A night-shift security guard notices subtle movements in the security camera feeds of an abandoned warehouse.',
    genre: ['Horror'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    durationSeconds: 420,
  },
  {
    title: 'The Haunted Manor',
    description: 'Investigating a 19th-century estate, urban explorers record unsettling EVP audio frequencies in the master bedroom.',
    genre: ['Horror'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    durationSeconds: 510,
  },
  {
    title: 'Midnight Caller',
    description: 'A late-night radio host receives a mysterious phone call from someone claiming to be broadcasting from inside his own house.',
    genre: ['Horror'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationSeconds: 290,
  },
  {
    title: 'Whispers in the Dark',
    description: 'Camping deep in the Black Forest, two brothers hear rhythmic whispers outside their tent at 3:00 AM.',
    genre: ['Horror'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    durationSeconds: 380,
  },
  {
    title: 'The Crimson Relic',
    description: 'An archaeologist unearths an ancient carved medallion that causes terrifying hallucinations to whoever holds it.',
    genre: ['Horror'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    durationSeconds: 460,
  },
  {
    title: 'Silent Cellar Escape',
    description: 'Trapped in a subterranean bunker, a survivor must solve cryptic lock codes while avoiding an entity sensitive to sound.',
    genre: ['Horror'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1519074069444-1ba4ea16007e?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    durationSeconds: 310,
  },
  {
    title: 'Phantom Echoes',
    description: 'Infrared cameras capture strange distortion anomalies in the corridors of a decommissioned asylum.',
    genre: ['Horror'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    durationSeconds: 490,
  },
  {
    title: 'The Mirror Reflection',
    description: 'A woman notices her bathroom mirror reflection delay by three full seconds before stepping out of sync.',
    genre: ['Horror'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationSeconds: 240,
  },

  // --- THRILLER (8 Titles) ---
  {
    title: 'Sintel: Dragon Quest',
    description: 'A fierce young warrior searches across snowy mountain peaks and scorching deserts to rescue a stolen dragon cub.',
    genre: ['Thriller'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    durationSeconds: 888,
  },
  {
    title: 'Agent 327: Operation Barbershop',
    description: 'Secret Agent 327 investigates a suspicious barbershop in Amsterdam that conceals a dangerous international syndicate.',
    genre: ['Thriller'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Subtle_Point.mp4',
    durationSeconds: 230,
  },
  {
    title: 'We Are Going On Bullrun',
    description: 'An adrenaline-pumping pursuit of high-performance sports cars navigating treacherous continental mountain passes.',
    genre: ['Thriller'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    durationSeconds: 47,
  },
  {
    title: 'The Vault Infiltration',
    description: 'A master hacker and safecracker team execute a timed 3-minute breach of a Zurich subterranean diamond bank.',
    genre: ['Thriller'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    durationSeconds: 360,
  },
  {
    title: 'Sub-Zero Rescue',
    description: 'A Coast Guard helicopter squad braves a Category 5 Arctic storm to extract stranded offshore rig workers.',
    genre: ['Thriller'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    durationSeconds: 410,
  },
  {
    title: 'Rogue Espionage',
    description: 'Undercover detective Vance uncovers a double-agent conspiracy inside his own intelligence agency.',
    genre: ['Thriller'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    durationSeconds: 320,
  },
  {
    title: 'Tactical Recon',
    description: 'Special operations operators clear a compromised harbor container ship under night-vision stealth.',
    genre: ['Thriller'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationSeconds: 270,
  },
  {
    title: 'Terminal Velocity',
    description: 'High-altitude skydiving chase over the Alps to intercept a stolen encrypted satellite drive.',
    genre: ['Thriller'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
    videoKey: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    durationSeconds: 390,
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
    console.log(`[Seed] Created ${createdVideos.length} sample videos across Horror, Sci-Fi, Comedy, and Thriller`);

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
    console.log(`  Database seeding completed! Loaded ${createdVideos.length} titles.`);
    console.log('  Genres: Horror | Sci-Fi | Comedy | Thriller');
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

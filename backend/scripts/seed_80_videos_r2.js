import dotenv from 'dotenv';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Video } from '../models/Video.js';

dotenv.config();

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// 4 distinct open source MP4 clip sources
const MP4_SOURCES = [
  'https://media.w3.org/2010/05/bunny/trailer.mp4',
  'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4',
  'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4',
  'https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/head-pose-face-detection-female.mp4',
];

// Helper to build 20 titles for a genre
const generateGenreTitles = (genreName, baseTitles, baseDescriptions, thumbnailPool) => {
  return baseTitles.map((title, idx) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    return {
      title,
      description: baseDescriptions[idx],
      genre: [genreName],
      thumbnailUrl: thumbnailPool[idx % thumbnailPool.length],
      sourceUrl: MP4_SOURCES[idx % MP4_SOURCES.length],
      r2Key: `videos/${genreName.toLowerCase()}/${slug}.mp4`,
      durationSeconds: 120 + (idx * 15),
    };
  });
};

// --- HORROR (20 Titles) ---
const horrorTitles = [
  'Nightmare in the Shadows', 'The Haunted Manor', 'Midnight Caller', 'Whispers in the Dark',
  'The Crimson Relic', 'Silent Cellar Escape', 'Phantom Echoes', 'The Mirror Reflection',
  'Curse of the Forgotten', 'The Séance Room', 'Cursed Horizon', 'The Possession of Cell 13',
  'Voices from Beneath', 'The Asylum Ledger', 'Watcher in the Fog', 'Don\'t Look Behind',
  'The Obsidian Ritual', 'Spectral Passage', 'Entity 404', 'Lullaby of the Damned'
];
const horrorDescriptions = [
  'A night-shift guard notices subtle movements in abandoned warehouse feeds.',
  'Urban explorers investigate an estate with a dark, forgotten history.',
  'A late-night radio DJ receives disturbing calls from inside his station.',
  'Camping deep in the forest, two brothers hear rhythmic whispers at 3:00 AM.',
  'An archaeologist unearths a carved medallion causing terrifying visions.',
  'Trapped in a bunker, a survivor navigates blind terrors using only sound.',
  'Audio engineers discover backwards messages calling out their names.',
  'A woman notices her mirror reflection delay by three full seconds.',
  'An ancient village curse reawakens when an old seal is broken during excavation.',
  'A group of students hold a séance in a dorm room with horrifying results.',
  'A shipwrecked crew lands on an uncharted island inhabited by phantom voices.',
  'A maximum-security cell block becomes the epicenter of demonic activity.',
  'Subterranean miners unearth a cavern that transmits acoustic frequencies.',
  'A journalist uncovers dark patient files from a closed 1920s asylum.',
  'A coastal lighthouse keeper is stalked by silhouettes in the thick sea mist.',
  'A simple rule: never turn your back on the corridor when the lights flicker.',
  'A secret society attempts to summon an ancient horror beneath London.',
  'A forgotten subway tunnel leads passengers into a terrifying alter-dimension.',
  'A rogue computer program begins projecting terrifying apparitions onto VR headsets.',
  'An antique music box plays a melody that induces waking nightmares.'
];
const horrorThumbnails = [
  'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1200&auto=format&fit=crop',
];

// --- SCI-FI (20 Titles) ---
const sciFiTitles = [
  'Tears of Steel', 'Elephants Dream', 'Cosmos Laundromat', 'Charge: Cyberpunk Protocol',
  'Subterranean Horizon', 'Quantum Drift', 'The Orbital Station', 'Nexus Protocol',
  'Singularity Prime', 'Solar Flare 2099', 'Chronos Paradox', 'Deep Space Retrieval',
  'Synthetic Awakening', 'Vector Omega', 'Wormhole Transit', 'Cybernetic Echoes',
  'Alien Telemetry', 'The Grid Outpost', 'Hyperion Eclipse', 'Zero Gravity Ops'
];
const sciFiDescriptions = [
  'In a dystopian future, scientists stage a counter-attack against robots.',
  'Two friends explore a surreal, machine-like world of strange imagination.',
  'On a desolate island, a sheep meets a salesman offering parallel dimension lives.',
  'In an underground lab, an engineer fights security androids.',
  'Drilling teams uncover an alien artifact transmitting signals beneath Earth.',
  'Pilot Maya navigates a collapsing wormhole to deliver emergency telemetry.',
  'An AI maintenance unit develops self-awareness on a space satellite.',
  'A rogue synthetic android breaches research nodes to recover memories.',
  'Scientists activate the first sentient quantum supercomputer core.',
  'Astronauts on Mars defend their dome from an unprecedented coronal ejection.',
  'A time traveler accidentally changes a historical node in 1984.',
  'Scavengers inspect an abandoned starship drifting near Jupiter.',
  'An android unit escapes a high-tech manufacturing facility.',
  'A tactical cyber-team infiltrates a neural network matrix.',
  'A transport vessel experiences gravitational distortion during hyperspace jumps.',
  'Cybernetically enhanced humans fight for autonomy in Neom City.',
  'Radio astronomers decode a repeating signal originating from Saturn rings.',
  'An isolated outpost on Pluto loses communications with Earth command.',
  'Solar sails catch the light of a dying star as colonies evacuate.',
  'Special forces execute zero-gravity containment procedures in high orbit.'
];
const sciFiThumbnails = [
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200&auto=format&fit=crop',
];

// --- COMEDY (20 Titles) ---
const comedyTitles = [
  'Big Buck Bunny', 'Caminandes: Llama Drama', 'Caminandes: Gran Dillama', 'Caminandes: Llamigos',
  'Glass Half: Art Critics', 'The Slapstick Pursuit', 'Office Prankster War', 'Canine Agility Disaster',
  'The Blundering Chef', 'Suburban Golf Mayhem', 'Cat Versus Robot Vacuum', 'The Accidental Hero',
  'Flea Market Hustle', 'Bake Sale Catastrophe', 'Gym Class Mishaps', 'Neighbor Wars',
  'The Great Roommate Mixup', 'Laundry Day Panic', 'Picnic Intruders', 'Speed Dating Speedrun'
];
const comedyDescriptions = [
  'A giant rabbit seeks hilarious revenge against three mischievous forest rodents.',
  'Koro the llama attempts an epic journey to cross a paved road.',
  'Koro encounters a stubborn fence standing between him and fresh berries.',
  'Koro survives a Patagonian winter alongside a clumsy armadillo.',
  'Two amateur art critics debate passionately in a contemporary gallery.',
  'A detective stumbles through a sequence of absurd mishaps during surveillance.',
  'Two accountants engage in an escalating war of desk pranks.',
  'A golden retriever completely ignores obstacle course layouts at a contest.',
  'A TV chef accidentally drops ingredients into hilarious places.',
  'A peaceful round of golf turns into chaotic suburban property damage.',
  'A feisty housecat engages in tactical warfare against a robotic vacuum.',
  'An uncoordinated delivery driver accidentally thwarts a bank robbery.',
  'Bargain hunters clash over vintage knick-knacks at a weekend market.',
  'A simple brownie recipe turns a high school kitchen into a foam volcano.',
  'A substitute PE teacher introduces bizarre new dodgeball rules.',
  'Two suburban dads build hilarious rival front-yard light displays.',
  'A miscommunicated apartment lease leads to three eccentric roommates.',
  'A missing red sock turns a self-service laundromat into a crime scene.',
  'A family picnic is crashed by a gang of hyper-intelligent squirrels.',
  'An awkward bachelor tries to complete 20 speed dates in 20 minutes.'
];
const comedyThumbnails = [
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop',
];

// --- THRILLER (20 Titles) ---
const thrillerTitles = [
  'Sintel: Dragon Quest', 'Agent 327: Operation Barbershop', 'We Are Going On Bullrun', 'The Vault Infiltration',
  'Sub-Zero Rescue', 'Rogue Espionage', 'Tactical Recon', 'Terminal Velocity',
  'The Countdown Protocol', 'Bank Heist 3000', 'Cyber Heist Matrix', 'The Double Agent',
  'High-Stakes Poker Showdown', 'Submarine Perimeter', 'Shadow Surveillance', 'The Target Mastermind',
  'Interceptor Flight 77', 'Subway Lockout', 'Night Express Chase', 'The Blackmail Dossier'
];
const thrillerDescriptions = [
  'A warrior girl embarks on a dangerous journey to rescue a baby dragon.',
  'Agent 327 investigates a suspicious barbershop concealing a syndicate.',
  'High-stakes sports car pursuit navigating mountain passes.',
  'An elite heist crew attempts a timed 3-minute bank vault breach.',
  'An arctic rescue team races a storm to extract stranded rig workers.',
  'A disavowed intelligence officer attempts to clear her name.',
  'Special ops operators clear a compromised harbor container ship under night vision.',
  'A skydiver uncovers a sabotage plot minutes before jumping.',
  'A bomb technician has 60 seconds to disarm an explosive in a subway terminal.',
  'An international gang targets a high-tech vault during a gala.',
  'Hackers execute a zero-day exploit to siphon funds from a megabank.',
  'An operative discovers his handler is selling classified satellite telemetry.',
  'Undercover agents face off in a multi-million dollar high-stakes poker game.',
  'A submarine captain navigates silent waters through a minefield.',
  'A private detective spots a shadowy figure installing wiretaps.',
  'An assassin targets a corrupt politician under heavy secret service protection.',
  'A commercial pilot copes with an in-flight engine sabotage over the Atlantic.',
  'Commuters are trapped inside an automated bullet train with no brakes.',
  'A courier carrying a high-value briefcase is hunted across midnight rooftops.',
  'A blackmail victim turns the tables on his extortionists in a rainy alley.'
];
const thrillerThumbnails = [
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?q=80&w=1200&auto=format&fit=crop',
];

const allCatalog = [
  ...generateGenreTitles('Horror', horrorTitles, horrorDescriptions, horrorThumbnails),
  ...generateGenreTitles('Sci-Fi', sciFiTitles, sciFiDescriptions, sciFiThumbnails),
  ...generateGenreTitles('Comedy', comedyTitles, comedyDescriptions, comedyThumbnails),
  ...generateGenreTitles('Thriller', thrillerTitles, thrillerDescriptions, thrillerThumbnails),
];

async function seed80Videos() {
  try {
    console.log(`[R2 80-Video Seeder] Total Titles to Upload & Seed: ${allCatalog.length}`);
    await connectDB();

    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const admin = await User.findOneAndUpdate(
      { email: 'admin@ott.com' },
      { name: 'OTT Admin', email: 'admin@ott.com', passwordHash: adminPasswordHash, role: 'admin' },
      { upsert: true, new: true }
    );

    // Pre-download the 4 source MP4 buffers into memory once
    console.log('[R2 Buffer Pre-fetch] Fetching source video buffers...');
    const bufferCache = {};
    for (const url of MP4_SOURCES) {
      console.log(`  Downloading template source: ${url.split('/').pop()}...`);
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      bufferCache[url] = Buffer.from(res.data);
    }
    console.log('[R2 Buffer Pre-fetch] All MP4 template buffers ready.');

    let successCount = 0;
    for (let i = 0; i < allCatalog.length; i++) {
      const item = allCatalog[i];
      const buffer = bufferCache[item.sourceUrl];

      console.log(`[${i + 1}/${allCatalog.length}] Uploading to R2: ${item.r2Key}...`);
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: item.r2Key,
          Body: buffer,
          ContentType: 'video/mp4',
        })
      );

      await Video.findOneAndUpdate(
        { title: item.title },
        {
          title: item.title,
          description: item.description,
          genre: item.genre,
          thumbnailUrl: item.thumbnailUrl,
          videoKey: item.r2Key,
          durationSeconds: item.durationSeconds,
          uploadedBy: admin._id,
        },
        { upsert: true, new: true }
      );

      successCount++;
      if ((i + 1) % 10 === 0 || i === allCatalog.length - 1) {
        console.log(`  ✓ Progress: ${i + 1}/${allCatalog.length} titles uploaded to R2 and saved to DB.`);
      }
    }

    console.log('\n===========================================================');
    console.log(`  Successfully Uploaded & Seeded ${successCount} Videos across 4 Genres!`);
    console.log(`  - Horror: 20 titles`);
    console.log(`  - Sci-Fi: 20 titles`);
    console.log(`  - Comedy: 20 titles`);
    console.log(`  - Thriller: 20 titles`);
    console.log(`  All MP4 files live in Cloudflare R2 bucket: ${process.env.R2_BUCKET_NAME}`);
    console.log('===========================================================');
    process.exit(0);
  } catch (err) {
    console.error('[Seed 80 Error]', err);
    process.exit(1);
  }
}

seed80Videos();

import fs from 'fs';
import path from 'path';

const ottFolderPath = 'E:\\ott';
const files = fs.readdirSync(ottFolderPath).filter(f => f.endsWith('.mp4'));

const GENRE_THUMBNAILS = {
  Horror: [
    'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
  ],
  'Sci-Fi': [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
  ],
  Comedy: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1527224857830-43a7acc85260?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop',
  ],
  Action: [
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop',
  ],
  Thriller: [
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop',
  ],
};

function cleanTitle(rawName) {
  let title = rawName.replace(/\.mp4$/i, '');
  title = title.replace(/#[^\s#]+/g, '');
  title = title.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  title = title.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (title.length < 3) title = rawName.replace(/\.mp4$/i, '');
  return title;
}

function detectGenre(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('horror') || lower.includes('nun') || lower.includes('lallorona') || lower.includes('mime') || lower.includes('terrifying') || lower.includes('scary')) {
    return 'Horror';
  }
  if (lower.includes('scifi') || lower.includes('science fiction') || lower.includes('solar storm') || lower.includes('wandering earth') || lower.includes('graboid') || lower.includes('companion robot') || lower.includes('murderbot') || lower.includes('lion\'s roar')) {
    return 'Sci-Fi';
  }
  if (lower.includes('funny') || lower.includes('comedy') || lower.includes('jethalal') || lower.includes('rajpal') || lower.includes('bean') || lower.includes('starbucks') || lower.includes('memes') || lower.includes('relatable') || lower.includes('mom') || lower.includes('welcome meme')) {
    return 'Comedy';
  }
  if (lower.includes('action') || lower.includes('fight') || lower.includes('john wick') || lower.includes('boyka') || lower.includes('reacher') || lower.includes('bruce lee') || lower.includes('cavill') || lower.includes('statham') || lower.includes('fury road') || lower.includes('parabellum') || lower.includes('mechanic')) {
    return 'Action';
  }
  return 'Thriller';
}

function generateDescription(title, genre) {
  const descriptions = {
    Horror: `A chilling suspense sequence involving ominous supernatural encounters, dark atmospheric tension, and terrifying unexplainable phenomena.`,
    'Sci-Fi': `An immersive futuristic sci-fi showcase exploring advanced robotics, interstellar phenomena, high-tech dystopian realities, and cosmic survival.`,
    Comedy: `A hilarious comedy highlight featuring relatable everyday situations, iconic comedic performances, chaotic humor, and unexpected laugh-out-loud moments.`,
    Action: `A high-octane action sequence featuring pulse-pounding hand-to-hand combat, relentless martial arts choreography, intense vehicle pursuits, and ultimate showdowns.`,
    Thriller: `A high-stakes thriller filled with intense adrenaline, dangerous stunts, edge-of-your-seat suspense, and razor-sharp survival instincts.`,
  };
  return `${title}: ${descriptions[genre] || descriptions.Thriller}`;
}

// Map R2 keys matching verified bucket list
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function buildCatalogFile() {
  const listRes = await s3Client.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET_NAME }));
  const r2Objects = listRes.Contents || [];

  const catalogItems = [];

  files.forEach((filename, i) => {
    const title = cleanTitle(filename);
    const genre = detectGenre(filename);
    const description = generateDescription(title, genre);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Match exact key from R2 bucket
    const r2Match = r2Objects.find(obj => obj.Key.includes(slug.slice(0, 15)));
    const r2Key = r2Match ? r2Match.Key : `videos/${genre.toLowerCase()}/${slug}.mp4`;

    const thumbs = GENRE_THUMBNAILS[genre] || GENRE_THUMBNAILS.Thriller;
    const thumbnailUrl = thumbs[i % thumbs.length];

    catalogItems.push({
      title,
      description,
      genre: [genre],
      thumbnailUrl,
      r2Key,
      durationSeconds: Math.floor(Math.random() * 240) + 120,
    });
  });

  const fileContent = `export const catalog80Titles = ${JSON.stringify(catalogItems, null, 2)};\n`;
  fs.writeFileSync('backend/config/catalog80.js', fileContent, 'utf-8');
  console.log(`[Catalog Generator] Updated backend/config/catalog80.js with ${catalogItems.length} catalog titles.`);
}

buildCatalogFile();

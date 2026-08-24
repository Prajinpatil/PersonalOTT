# PersonalOTT — Full-Stack Video Streaming Platform

PersonalOTT is a resume-grade, production-structured video streaming platform built with **React (Vite)**, **Node.js / Express**, **MongoDB Atlas**, and **Cloudflare R2** object storage.

The platform demonstrates modern cloud-native system design: decoupling metadata from binary video storage, offloading heavy file transfers directly to Cloudflare R2 via short-lived pre-signed URLs, and enabling real byte-range streaming (`HTTP 206 Partial Content`) for instant video seeking across **Horror**, **Sci-Fi**, **Comedy**, and **Thriller** catalog titles.

---

## 🏗️ System Architecture

```
┌─────────────────┐        HTTPS        ┌──────────────────┐       Query        ┌──────────────────┐
│   React (Vite)  │◄───────────────────►│  Express API     │◄──────────────────►│  MongoDB Atlas   │
│ (Frontend/Vercel)│                    │ (Backend/Render) │                    │  (M0 Free Tier)  │
└────────┬────────┘                     └────────┬─────────┘                    └──────────────────┘
         │                                       │
         │ Direct signed URL                     │ Generates 1-hour
         │ video fetch (HTTP Range 206)          │ pre-signed upload/
         ▼                                       ▼ stream URLs
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare R2 Storage (S3-Compatible Object Store)        │
│  — Raw video & image assets stored here                     │
│  — Native HTTP Range byte-level streaming support           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Design Decisions & Interview Q&A

### 1. Why store video in Cloudflare R2 instead of MongoDB?
- **Database Bloat Prevention**: Binary data in BSON documents degrades database performance, index size, and backup speed. MongoDB Atlas M0 free tier has a 512MB limit.
- **Cost & Egress**: Cloudflare R2 is S3-compatible, offers **10 GB free storage**, and has **zero egress fees**, making it ideal for video content delivery.

### 2. How do client direct pre-signed PUT uploads work?
- When an admin uploads a video file, the client first requests a pre-signed `PUT` URL from `/api/videos/upload-url`.
- Express signs the request using `@aws-sdk/s3-request-presigner` and returns a 15-minute temporary URL.
- The browser uploads the raw video file **directly to Cloudflare R2** using Axios/fetch `PUT`.
- **Interview Takeaway**: Express server memory and network bandwidth are never choked by large video transfers.

### 3. How does video streaming & seeking work without downloading the entire file?
- The backend generates a 1-hour pre-signed `GET` URL for the video's R2 object key (`GET /api/videos/:id/stream-url`).
- The HTML5 `<video>` tag issues `HTTP Range: bytes=X-Y` headers directly to R2.
- Cloudflare R2 responds with `HTTP 206 Partial Content`, sending only the exact requested bytes for that timestamp.
- This provides instant seeking and scrubbing without requiring custom HLS/DASH transcoders.

### 4. Storage Budget Optimization & Bulk R2 Uploader
- **480p / 720p Clips Over Full Movies**: To maximize demo impact, the platform uses 2-10 minute open-licensed clips (50-150MB each) across Horror, Sci-Fi, Comedy, and Thriller rather than 15 full-length movies. This populates a **32-title catalog** within Cloudflare R2's 10GB free tier.
- **Automated Cloudflare R2 Bulk Upload Command**:
  ```bash
  cd backend
  npm run upload-r2
  ```
  *When Cloudflare R2 credentials are set in `backend/.env`, this script automatically downloads compressed 480p/720p MP4 clips for Horror, Sci-Fi, Comedy, and Thriller, uploads them directly to your Cloudflare R2 bucket (`videos/horror/*.mp4`), and updates the database records.*

### 5. Known Constraints & Production Scaling Strategy (Gigabyte-Month Billing)
> **💡 Key System Design Interview Discussion Point:**
>
> Cloud storage billing is calculated on a **Gigabyte-Month** basis (averaging peak daily storage over a 30-day billing cycle). If PersonalOTT scaled to real-world user uploads of 4K feature films, the 10GB free tier would be exhausted almost instantly.
>
> **Production Scaling Mitigation Plan:**
> 1. **Automated Lifecycle Expiration Policies**: Configure S3/R2 lifecycle rules to transition cold/unwatched video objects (>30 days) to cheaper archival storage (e.g. AWS Glacier / Deep Archive) or purge expired temp uploads.
> 2. **Multi-Bitrate Transcoding Pipeline**: Integrate AWS Elemental MediaConvert or FFmpeg microservices to generate HLS (`.m3u8`) variants automatically on upload.
> 3. **Storage Quotas & Tiered Subscriptions**: Enforce per-creator storage limits and implement paid subscription tiers to fund object storage scaling.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 (Vite), React Router v7, Axios, Tailwind CSS v4, Lucide Icons.
- **Backend**: Node.js, Express.js, JWT Authentication (`jsonwebtoken` + `bcryptjs`), `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`.
- **Database**: MongoDB Atlas (Mongoose ODM).
- **Object Storage**: Cloudflare R2 (S3-compatible API).
- **Deployment**: Frontend → Vercel | Backend → Render Web Service | Database → MongoDB Atlas | Storage → Cloudflare R2.

---

## 📡 API Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user (returns JWT token) |
| `POST` | `/api/auth/login` | Public | Authenticate user (returns JWT token) |
| `GET` | `/api/auth/me` | Protected | Fetch current user session profile |
| `GET` | `/api/videos` | Public | Get paginated video catalog (`?genre=`, `?search=`) |
| `GET` | `/api/videos/:id` | Public | Get single video metadata details |
| `POST` | `/api/videos/upload-url` | Admin | Generate pre-signed R2 `PUT` URL for file upload |
| `POST` | `/api/videos` | Admin | Save video metadata record in MongoDB Atlas |
| `GET` | `/api/videos/:id/stream-url` | Protected | Generate pre-signed R2 `GET` URL for stream |
| `GET` | `/api/progress` | Protected | Fetch user's watch history & positions |
| `GET` | `/api/progress/:videoId` | Protected | Fetch saved playback position for video |
| `POST` | `/api/progress/:videoId` | Protected | Save / update current playback position |

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/personal_ott
JWT_SECRET=your_super_secret_jwt_key_2026
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=personal-ott-bucket
CLIENT_URL=https://your-app.vercel.app
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=https://your-backend.onrender.com/api
```

---

## 🚀 Local Quickstart Guide

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/PersonalOTT.git
cd PersonalOTT

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install
```

### 2. Seed Initial 32-Title Catalog (Horror, Sci-Fi, Comedy, Thriller)
```bash
cd ../backend
npm run seed
```

### 3. Bulk Upload Compressed Clips to Cloudflare R2 (Optional)
```bash
# Set your Cloudflare R2 keys in backend/.env, then run:
npm run upload-r2
```

### 4. Run Development Servers
```bash
# Terminal 1: Run Express Server (http://localhost:5000)
cd backend
npm run dev

# Terminal 2: Run React Client (http://localhost:5173)
cd frontend
npm run dev
```

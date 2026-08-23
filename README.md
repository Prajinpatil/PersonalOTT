# PersonalOTT — Full-Stack Video Streaming Platform

PersonalOTT is a resume-grade, production-structured video streaming platform built with **React (Vite)**, **Node.js / Express**, **MongoDB Atlas**, and **Cloudflare R2** object storage.

The platform demonstrates modern cloud-native system design: decoupling metadata from binary video storage, offloading heavy file transfers directly to Cloudflare R2 via short-lived pre-signed URLs, and enabling real byte-range streaming (`HTTP 206 Partial Content`) for instant video seeking.

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

### 4. How is Watch Progress tracked?
- The `<video>` component throttles `timeupdate` events to `POST /api/progress/:videoId` every 5 seconds.
- Upserts a compound-indexed `{ userId, videoId }` document in MongoDB Atlas.
- When opening a video, the player queries `/api/progress/:videoId` and automatically seeks to the saved timestamp.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 (Vite), React Router v7, Axios, Tailwind CSS v4, Lucide Icons.
- **Backend**: Node.js, Express.js, JWT Authentication (`jsonwebtoken` + `bcryptjs`), `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`.
- **Database**: MongoDB Atlas (Mongoose ODM).
- **Object Storage**: Cloudflare R2 (S3-compatible API).
- **Deployment**: Frontend → Vercel | Backend → Render Web Service | Database → MongoDB Atlas | Storage → Cloudflare R2.

---

## 📁 Monorepo Directory Structure

```
E:\web dev\OTT
├── .gitignore
├── README.md
├── frontend/             # React (Vite) Single Page Application
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── api/          # Axios HTTP client with JWT interceptor
│       ├── components/   # VideoPlayer, Navbar, VideoCard, VideoRow, HeroBanner
│       ├── context/      # AuthContext
│       └── pages/        # HomePage, WatchPage, SearchPage, AdminDashboard, Auth pages
└── backend/              # Express API Server
    ├── package.json
    ├── .env
    ├── index.js          # Express entrypoint
    ├── config/           # db.js (MongoDB) & r2.js (Cloudflare R2 SDK)
    ├── models/           # User, Video, WatchProgress
    ├── routes/           # Auth, Video, Progress routes
    └── scripts/          # Database seeder (npm run seed)
```

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

### 2. Seed Initial Demo Catalog & Users
```bash
cd ../backend
npm run seed
```
> **Default Test Accounts Created:**
> - **Admin**: `admin@ott.com` / `admin123`
> - **User**: `user@ott.com` / `user123`

### 3. Run Development Servers
```bash
# Terminal 1: Run Express Server (http://localhost:5000)
cd backend
npm run dev

# Terminal 2: Run React Client (http://localhost:5173)
cd frontend
npm run dev
```

---

## 🌐 Cloud Deployment Guide

### 1. Database (MongoDB Atlas)
- Create a free **M0 Cluster** on MongoDB Atlas.
- Add Network Access IP `0.0.0.0/0` (or Render outbound IPs).
- Copy the MongoDB connection string to `MONGODB_URI`.

### 2. Object Storage (Cloudflare R2)
- Navigate to Cloudflare Dashboard → R2 → Create Bucket `personal-ott-bucket`.
- Generate API Token with **Object Read & Write** permissions.
- Note `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME`.

### 3. Backend (Render)
- Connect repository to Render as a **Web Service**.
- Build Command: `cd backend && npm install`
- Start Command: `cd backend && npm start`
- Set Environment Variables in Render Dashboard.

### 4. Frontend (Vercel)
- Connect repository to Vercel.
- Framework Preset: **Vite**.
- Root Directory: `frontend`.
- Build Command: `npm run build`
- Output Directory: `dist`
- Set Environment Variable: `VITE_API_URL=https://<your-render-app>.onrender.com/api`.

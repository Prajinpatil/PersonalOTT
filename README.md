# PersonalOTT — Full-Stack Video Streaming Platform

PersonalOTT is a production-engineered, full-stack video streaming platform built with **React (Vite)**, **Node.js / Express**, **MongoDB Atlas**, and **Cloudflare R2** object storage.

The platform replicates modern streaming infrastructure (such as Netflix and Prime Video) by decoupling metadata persistence from binary video delivery, leveraging short-lived pre-signed URLs for direct client uploads, and serving byte-range streams (`HTTP 206 Partial Content`) for instant video playback and seeking.

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

##  Key Features

- **Decoupled Architecture**: High-speed MongoDB metadata querying coupled with S3-compatible Cloudflare R2 binary storage.
- **Direct Pre-Signed R2 Uploads**: Temporary pre-signed `PUT` URLs bypass server bandwidth bottlenecks for direct client-to-R2 uploads.
- **Byte-Range HTTP 206 Streaming**: HTML5 video playback with native `Range: bytes=X-Y` header support for instant scrubbing without downloading full files.
- **API Rate Limiting & Protection**: `express-rate-limit` middleware prevents DoS attacks, IP spamming, and brute-force credential stuffing.
- **Watch Progress Auto-Resume**: Automatic throttled sync feature to `/api/progress/:videoId` along with compound-indexed database persistence (`{ userId, videoId }`).
- **Curated Multi-Genre Catalog**: Currently 32 titles organized under **Horror**, **Sci-Fi**, **Comedy**, and **Thriller**.
- **Admin Management Studio**: Integrated dashboard for uploading new titles, tracking pre-signed upload progress, and catalog management.
- **Responsive Dark OTT UX**: Built with Tailwind CSS, custom horizontal scroll carousels, and loading skeletons.

---

## 💻 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 (Vite) | Single Page Application with fast HMR |
| **Styling & UI** | Tailwind CSS v4 + Lucide Icons | Responsive dark OTT theme |
| **Routing & Client** | React Router v7 + Axios | Declarative client routing and HTTP interceptors |
| **Backend API** | Node.js + Express.js | RESTful API server |
| **Authentication** | JWT + BcryptJS | Password hashing and session tokens |
| **Security & Protection** | `express-rate-limit` | IP-based API rate limiting and DoS mitigation |
| **Database** | MongoDB Atlas (Mongoose) | Metadata & progress persistence |
| **Object Storage** | Cloudflare R2 | S3-compatible object storage (Zero egress fees) |
| **SDK & Signer** | `@aws-sdk/client-s3` | S3 v4 pre-signed URL generation |

---

## ⚖️ Load Balancing Architecture

| Layer | Load Balancer | Routing & Optimization |
| :--- | :--- | :--- |
| **Frontend UI** | **Vercel Anycast Edge Network** | Serves static SPA assets from 300+ global edge locations for sub-50ms latency. |
| **Video Storage** | **Cloudflare R2 Anycast CDN** | Direct byte-range (`HTTP 206`) video streams offloaded to edge storage nodes, bypassing API bandwidth. |
| **Backend API** | **Layer 7 Application Load Balancer (ALB / NGINX)** | Stateless Node/Express instances behind a Round-Robin load balancer auto-scaled via `/api/health` checks. |

---

## 📁 Directory Structure

```
E:\web dev\OTT
├── .gitignore
├── README.md             # Documentation
├── walkthrough.pdf       # walkthrough pdf (git ignored)
├── frontend/             # React (Vite) Frontend Application
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── api/          # Axios client with JWT authorization interceptors
│       ├── components/   # VideoPlayer, Navbar, VideoCard, VideoRow, HeroBanner
│       ├── context/      # AuthContext
│       └── pages/        # HomePage, WatchPage, SearchPage, AdminDashboard, Auth pages
└── backend/              # Express API Server
    ├── package.json
    ├── .env
    ├── index.js          # Express entrypoint & auto-seeder
    ├── config/           # db.js (MongoDB) & r2.js (Cloudflare R2 SDK)
    ├── models/           # User, Video, WatchProgress
    ├── routes/           # Auth, Video, Progress routes
    └── scripts/          # Database seeder & Cloudflare R2 uploader
```

---

## API Endpoints Summary

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public (Rate-Limited) | Register new user (returns JWT) |
| `POST` | `/api/auth/login` | Public (Rate-Limited) | Authenticate user (returns JWT) |
| `GET` | `/api/auth/me` | Protected | Fetch current user session profile |
| `GET` | `/api/videos` | Public (Rate-Limited) | Get paginated video catalog (`?genre=`, `?search=`) |
| `GET` | `/api/videos/:id` | Public (Rate-Limited) | Get single video metadata details |
| `POST` | `/api/videos/upload-url` | Admin | Generate pre-signed R2 `PUT` URL for direct upload |
| `POST` | `/api/videos` | Admin | Save video metadata record in MongoDB Atlas |
| `GET` | `/api/videos/:id/stream-url` | Protected | Generate pre-signed R2 `GET` URL for stream |
| `GET` | `/api/progress` | Protected | Fetch user's watch history & progress positions |
| `GET` | `/api/progress/:videoId` | Protected | Fetch saved playback position for video |
| `POST` | `/api/progress/:videoId` | Protected | Save / update current playback position |

---

## Environment Variables Setup

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/personal_ott
JWT_SECRET=your_super_secret_jwt_key_2026
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=personal-ott-bucket
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Launch & Setup Instructions

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

### 2. Configure Cloudflare R2 Credentials & Seed Database
1. Create a bucket on Cloudflare R2 (`personal-ott-bucket`).
2. Generate an R2 API Token with **Object Read & Write** permissions.
3. Add credentials to `backend/.env`.
4. Run bulk upload & seed script:
```bash
cd backend
npm run seed-and-upload
```

> **Default Test Accounts:**
> - **Admin**: `admin@ott.com` / `admin123`
> - **User**: `user@ott.com` / `user123`

### 3. Launch Development Servers
```bash
# Terminal 1: Run Express Server (http://localhost:5000)
cd backend
npm run dev

# Terminal 2: Run React Client (http://localhost:5173)
cd frontend
npm run dev
```

---

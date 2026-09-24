# 🛠️ Local Development Setup

## What runs where

| Service  | Where         | Command |
|----------|---------------|---------|
| Redis    | Docker        | `docker compose -f docker-compose.dev.yml up -d` |
| MongoDB  | Local install or Atlas | — |
| Backend  | Local Node.js | `cd backend && npm run dev` |
| Frontend | Local Node.js | `cd frontend && npm run dev` |

---

## Step 1 — Start Redis only (Docker)

```bash
docker compose -f docker-compose.dev.yml up -d
```

Check it's running:
```bash
docker ps
# should show: inkwell_redis_dev   redis:7-alpine   0.0.0.0:6379->6379/tcp
```

Stop it later:
```bash
docker compose -f docker-compose.dev.yml down
```

---

## Step 2 — MongoDB

**Option A — Local install (recommended for dev):**
- Download: https://www.mongodb.com/try/download/community
- It runs on `mongodb://localhost:27017` by default — no config needed

**Option B — MongoDB Atlas (free, no install):**
1. Go to https://cloud.mongodb.com → create free cluster
2. Get your connection string, paste into backend `.env` as `MONGO_URI`

---

## Step 3 — Backend

```bash
cd backend

# Copy and fill in your env vars
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/inkwell
JWT_SECRET=any_long_random_string_here
ANTHROPIC_API_KEY=sk-ant-your_key_here
REDIS_URL=redis://localhost:6379
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
CLIENT_URL=http://localhost:3000
```

Then:
```bash
npm install
npm run dev
# ✅ API running on http://localhost:8000
```

---

## Step 4 — Frontend

```bash
cd frontend

cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000/api  ← already set

npm install
npm run dev
# ✅ App running on http://localhost:3000
```

---

## Test everything works

```bash
curl http://localhost:8000/health
# {"status":"ok","service":"Inkwell API"}
```

Open http://localhost:3000 → Register → Create a book → Start writing!

---

## When ready for production → Full Docker

```bash
docker compose -f docker-compose.yml up --build
```

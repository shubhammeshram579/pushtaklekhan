# ✒ Inkwell v2.0 — AI-Powered Book Writing Platform

Full-stack AI-assisted book writing platform built with Next.js, Node.js, MongoDB, Redis, and Claude AI.

## 🚀 Quick Start

```bash
# 1. Start Redis (Docker)
docker compose -f docker-compose.dev.yml up -d

# 2. Backend
cd backend && cp .env.example .env  # fill in keys
npm install && npm run dev          # http://localhost:8000

# 3. Frontend
cd frontend && cp .env.local.example .env.local
npm install && npm run dev          # http://localhost:3000
```

## ✨ Features v2.0

| Feature | Status |
|---------|--------|
| Rich text editor (bold, headings, lists, quotes, code, images) | ✅ |
| Chapter & page management | ✅ |
| AI grammar fix, rewrite, continue, expand, simplify | ✅ |
| AI tone adjustment (5 tones) | ✅ |
| AI writer's block assistant | ✅ |
| AI context-aware (genre, characters, book title) | ✅ |
| Character management system | ✅ |
| Version history & checkpoints | ✅ |
| Writing analytics & streak tracking | ✅ |
| Plot board (Kanban) | ✅ |
| Focus / distraction-free writing mode | ✅ |
| Word count goals & progress | ✅ |
| Auto-save with draft recovery | ✅ |
| Book export (TXT/PDF/DOCX/ePub) | ✅ |
| JWT authentication | ✅ |
| Redis caching + BullMQ queue | ✅ |
| Cloudinary image uploads | ✅ |

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Redux Toolkit
- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **AI**: Anthropic Claude API
- **Cache/Queue**: Redis + BullMQ
- **Storage**: Cloudinary

## 📂 Project Structure

```
inkwell/
├── frontend/
│   ├── app/
│   │   ├── auth/login, register
│   │   ├── dashboard/
│   │   └── book/[bookId]/
│   ├── components/
│   │   ├── characters/CharacterManager.jsx
│   │   ├── version/VersionHistory.jsx
│   │   ├── analytics/WritingAnalytics.jsx
│   │   └── plot/PlotBoard.jsx
│   ├── lib/api.js
│   └── store/index.js
│
└── backend/src/
    ├── controllers/  (auth, book, chapter, page, ai, upload, character, version, analytics)
    ├── models/       (User, Book, Chapter, Page, Character, Version, Analytics)
    ├── routes/       (all 9 route files)
    ├── services/     (ai.service, upload.service)
    └── queues/       (ai.queue with BullMQ)
```

## 🔌 API Endpoints

```
POST/GET        /api/auth/register, login, me
CRUD            /api/books
CRUD            /api/chapters
CRUD            /api/pages
CRUD            /api/characters
CRUD            /api/versions
POST            /api/analytics/track
GET             /api/analytics/book/:bookId
GET             /api/analytics/dashboard
POST            /api/uploads/image
POST            /api/ai/fix-grammar
POST            /api/ai/rewrite
POST            /api/ai/continue-writing
POST            /api/ai/summarize
POST            /api/ai/expand
POST            /api/ai/simplify
POST            /api/ai/tone
POST            /api/ai/writers-block
POST            /api/ai/custom
```

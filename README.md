# PYQ Analyzer

Upload previous-year university question papers. The app splits them into questions, tags each with a topic,
and shows which topics repeat across years. Next.js frontend, Express + MongoDB backend.

## Run it (5 steps)

You need Node 18+ and a MongoDB (local install, or a free MongoDB Atlas URL).

1. Extract the zip.
2. `cd server` then `npm install`
3. `cd ../client` then `npm install`
4. Env files: both already exist with working defaults.
   - `server/.env`: change `MONGO_URI` if you use Atlas. Everything else is optional.
   - `client/.env.local`: leave as is unless the server is not on port 5000.
5. Start both (two terminals):
   - `cd server && npm run seed && npm run dev`   (seed adds demo data once)
   - `cd client && npm run dev`

Open http://localhost:3000

Demo logins (created by `npm run seed`):
- Admin: `admin@pyq.local` / `Admin@123`
- Student: `demo@pyq.local` / `Demo@1234`

Skip the seed and register with `admin@pyq.local` to get an admin account on an empty database.

Or with Docker: `docker compose up --build` (starts MongoDB too). Run the seed with `docker compose exec server npm run seed`.

## Optional keys (all in server/.env)

| Key | What it turns on | Without it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude tags topics/difficulty and writes study plans | Keyword-based topic guess and a simple plan |
| `REDIS_URL` | Redis cache | In-memory cache |
| `SMTP_*` | Real emails | Emails are logged in the server console |
| `RAZORPAY_KEY_ID` / `SECRET` | Real Premium checkout | "Activate Premium (demo)" button |

## Full-stack concepts and where they live

| Concept | Where |
|---|---|
| Auth: JWT access token + rotating httpOnly refresh cookie | `server/src/routes/auth.js`, `client/lib/api.js` |
| Roles (student, contributor, admin) | `server/src/middleware/auth.js`, `routes/admin.js` |
| File upload with type, size and PDF signature checks | `middleware/upload.js`, `services/pdf.js` |
| Background job queue with retries and crash recovery | `services/queue.js`, `services/processor.js` |
| PDF parsing and question splitting | `services/parser.js` |
| AI integration with fallbacks | `services/ai.js` |
| MongoDB aggregation (topic analytics) | `services/analytics.js` |
| Full-text search with text index and ranking | `routes/search.js`, `models/Question.js` |
| Caching (Redis or memory) and invalidation | `services/cache.js` |
| Real-time: notifications and study rooms (Socket.io) | `services/socket.js`, `client/components/Bell.js`, `app/room` |
| Payments: Razorpay order + signature verification | `routes/payments.js`, `app/premium` |
| Email and scheduled reminders (cron) | `services/mailer.js`, `services/cron.js` |
| Moderation workflow and admin dashboard | `routes/admin.js`, `app/admin` |
| Validation (zod), rate limiting, helmet, Mongo sanitize | `middleware/validate.js`, `app.js` |
| Tests (Jest + Supertest) | `server/tests`, run `npm test` in server |
| Docker and GitHub Actions CI | `docker-compose.yml`, `.github/workflows/ci.yml` |

## How a paper flows through the system

1. User uploads a PDF (or pastes text). The API stores it and returns immediately.
2. A job is queued. The worker extracts text, finds questions, tags topics, saves them.
3. Papers from students wait for admin approval. Contributor and admin uploads go live straight away.
4. On approval, subscribers get a notification (live over Socket.io, plus email).
5. Analytics for the subject are cached for 5 minutes and cleared whenever its papers change.

## Known limits

- Scanned PDFs have no text layer. Paste the text instead (OCR is not included).
- Question splitting expects numbered questions ("1." or "Q1."). Unusual layouts may need the paste option.
- The job queue runs inside the server process. Papers that were mid-processing are re-queued on restart.
  For several servers, swap `services/queue.js` for BullMQ (same enqueue/register shape).
- Study-room chat history is kept in memory only.

## Ideas to extend

Google login, OCR for scanned papers, per-university pages, question bookmarks, "ask AI about this question".

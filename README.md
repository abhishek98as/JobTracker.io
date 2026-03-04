# JobTrackr

Full-stack job hunting platform built with Next.js 14, Tailwind, Prisma, and Firebase Google authentication.

## Modules Implemented

- Extended Phase 1 tracker suite:
  - Kanban pipeline with drag-and-drop
  - Duplicate detection warnings while creating applications
  - Follow-up stale indicators and custom reminders
  - Active-filter export (`CSV`, `JSON`, `PDF` report)
  - Timeline/Journey feed from activity events
  - Weekly goals and streak tracking
  - Extended analytics (funnel, best platform, day counter, weekly bars)
- Multi-Resume Manager (Vercel Blob-backed PDF upload + tagging)
- Referral Tracker (reusable referral contacts linked to applications)
- Interview Preparation Hub (per-application interview rounds + personal question bank)
- Company Research Notes (one-to-one research workspace per application)
- Career Path Explorer (skill-based role recommendations)
- ATS Checker (resume vs JD keyword score + checklist)
- Cold email automation:
  - Excel/CSV parsing with flexible header detection
  - Template CRUD with placeholder support and live preview
  - Gmail SMTP sending with spam guardrails
  - Rate-limit checks + randomized delay support
  - Queue status with pause/resume and progress tracking
  - Auto-logging to tracker as `platform = cold_email`

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS + custom Soft Brutalism UI primitives
- Prisma + MongoDB Atlas
- Firebase Auth (Google login) + server session cookie
- Nodemailer (Gmail SMTP)
- Vercel Blob (`@vercel/blob`) for resume storage
- SheetJS (`xlsx`) for Excel parsing
- Recharts for analytics charts
- `html2canvas` + `jspdf` for client-side PDF export

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Fill `.env` values:

- `DATABASE_URL="mongodb+srv://..."`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `BLOB_READ_WRITE_TOKEN`

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Sync schema to MongoDB:

```bash
npm run prisma:push
```

6. Start dev server:

```bash
npm run dev
```

## Core Routes

- `/dashboard`
- `/tracker`
- `/tracker/[id]`
- `/timeline`
- `/resumes`
- `/referrals`
- `/career-explorer`
- `/ats-checker`
- `/cold-email`
- `/cold-email/templates`

## Core API Endpoints

- Applications: `/api/applications`, `/api/applications/[id]`, `/api/applications/[id]/status`, `/api/applications/duplicates`, `/api/applications/export`
- Interviews/Research: `/api/applications/[id]/interviews`, `/api/interviews/[id]`, `/api/interviews/question-bank`, `/api/applications/[id]/research`
- Resumes/Referrals: `/api/resumes`, `/api/resumes/[id]`, `/api/resumes/[id]/signed-url`, `/api/referrals`, `/api/referrals/[id]`
- Analytics/Goals/Timeline: `/api/analytics/extended`, `/api/goals/weekly`, `/api/timeline`, `/api/reminders/badge-count`
- Cold Email: `/api/cold-email/parse`, `/api/cold-email/templates`, `/api/cold-email/templates/[id]`, `/api/cold-email/send`
- Auth: `/api/auth/firebase/session`

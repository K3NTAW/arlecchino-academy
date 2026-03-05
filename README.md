# Arlecchino Academy MVP

This project is a bilingual coding-learning MVP with:

- private login access page (`/login`)
- dashboard page (`/`)
- PDF upload page (`/upload`)
- lesson page (`/lesson/:lessonId`)
- challenge page (`/challenge/:challengeId`)
- progress page (`/progress`)
- PostgreSQL-backed lesson caching so the same PDF is not regenerated

## Structure

- `frontend/`: React + Vite UI
- `backend/`: Express APIs for auth, upload, generation, lessons, progress
- `shared/`: Zod schemas and shared types

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy backend env:

   ```bash
   cp backend/.env.example backend/.env
   ```
   Then set:
   - `DATABASE_URL`
   - `ACCESS_CODE`
   - `ACCESS_TOKEN`
   - `GEMINI_API_KEY`

3. Run apps:

   ```bash
   npm run dev
   ```

## API contracts

- `GET /api/health` -> `{ ok: true }`
- `POST /api/login` -> `{ token }`
- `POST /api/upload` -> `{ text, imageCount, usedOcrFallback }`
- `POST /api/generate` -> `{ lesson, challenges, lessonId, qualityIssues, cached }`
- `GET /api/dashboard` -> dashboard stats and recent lesson
- `GET /api/lessons/:lessonId` -> lesson detail + challenge list
- `GET /api/challenges/:challengeId` -> challenge detail
- `POST /api/challenges/:challengeId/attempt` -> record attempt
- `GET /api/progress` -> XP, badges, mastery

## Quality gates

- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Test: `npm run test`
# arlecchino-academy

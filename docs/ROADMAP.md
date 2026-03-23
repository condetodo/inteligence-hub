# Intelligence Hub — Roadmap

> Last updated: 2026-03-23

## Infrastructure

| Service | Platform | URL | Status |
|---------|----------|-----|--------|
| Frontend | Vercel | https://intelligence-hub-app.vercel.app | Online |
| Backend API | Railway | https://inteligence-hub-production.up.railway.app/api | Online |
| Database | Railway (Postgres) | Internal | Online |
| Repo | GitHub | https://github.com/condetodo/inteligence-hub | Active |

---

## Plans

### Plan 1: Backend API Foundation
- **Status:** COMPLETED
- **Scope:** Express + Prisma + PostgreSQL, auth (JWT), CRUD instances/inputs/content/insights/brand-voice, processing runs
- **Plan file:** `docs/superpowers/plans/2026-03-14-plan1-backend-api.md`

### Plan 2: AI Agent System
- **Status:** COMPLETED
- **Scope:** Anthropic/Google AI integration, corpus builder, brand voice analyzer, content generator, insight reporter, orchestrator pipeline, cron scheduling
- **Plan file:** `docs/superpowers/plans/2026-03-14-plan2-agent-system.md`

### Plan 3A: Frontend Setup
- **Status:** COMPLETED (2026-03-20)
- **Scope:** Next.js 14 + Tailwind, auth pages (login/register), dashboard, sidebar, instance layout with topbar + tabs, UI components (Button, Badge, Modal, StatusBanner), placeholder pages
- **Plan file:** `docs/superpowers/plans/2026-03-14-plan3a-frontend-setup.md`
- **Deployed to Vercel:** Yes

### Plan 3B: Frontend Feature Pages
- **Status:** COMPLETED (2026-03-20)
- **Scope:** Kanban content board, inputs management, insights reports, brand voice editor, processing history
- **Plan file:** `docs/superpowers/plans/2026-03-14-plan3b-frontend-features.md`
- **Components:** PlatformBadge, StatusDot, WeekSelector, StatsBar, ProcessingBanner, PlatformFilter, ContentCard, KanbanColumn, KanbanBoard, ContentModal, InputList, UploadModal, InsightReport, BrandVoiceForm, ProcessingTimeline
- **Deployed to Vercel:** Yes
- **Env fix:** Configured NEXT_PUBLIC_API_URL on Vercel → Railway API

---

### Polish & QA
- **Status:** COMPLETED (2026-03-23)
- **Scope:** Toast notifications, loading spinners, responsive sidebar (drawer), responsive grids (kanban/insights/tabs), mobile header
- **Plan file:** `docs/plans/2026-03-23-polish-qa-design.md`

### API Integration
- **Status:** COMPLETED (2026-03-23)
- **Scope:** Fix frontend-backend mismatches (role→clientRole, response wrappers, _count stats, steps object), fix /auth/me parsing
- **Plan file:** `docs/plans/2026-03-23-api-integration-design.md`

### Production Bugfixes (2026-03-23)
- **Status:** COMPLETED
- **Scope:**
  - Fix toast infinite loop (stabilize ToastProvider context with `useMemo`)
  - Fix Brand Voice page crash (defensive defaults for empty `voiceTone` object)
  - Fix Anthropic API key authentication (updated key in Railway env vars)
  - Fix Brand Voice agent not generating text fields (identity, valueProposition, audience, positioning, metrics)
  - Fix orchestrator skipping agents when no new inputs (now reuses existing weekly corpus)
  - Configure Vercel "Skip deployments" for backend-only commits

### End-to-End Testing (2026-03-23)
- **Status:** COMPLETED
- **Scope:** Full pipeline tested with real data:
  - ✅ Auth (login/register)
  - ✅ Instance CRUD
  - ✅ Input upload (text — Entrevista, Nota)
  - ✅ Processing pipeline (Corpus → Brand Voice → Content + Insights → Distribution)
  - ✅ Insights display (weekly report with executive summary, themes, opportunities)
  - ✅ Brand Voice auto-generation (all fields populated by AI agent)
  - ✅ Content generation (drafts created per platform)

---

## What's Next

1. **Audio input upload** — Upload audio files (.mp3/.m4a) with automatic transcription via Whisper API, eliminating manual transcription friction
2. **Custom domain** — Connect production domain to Vercel
3. **Processing status feedback** — Show real-time progress while agents are running (polling or SSE)
4. **Error handling polish** — Better user feedback for 409 (already processing), timeouts, etc.

---

## Dev Setup

```bash
# Clone
git clone https://github.com/condetodo/inteligence-hub.git
cd inteligence-hub

# Backend (local)
cd intelligence-hub-api
npm install
cp .env.example .env  # configure DATABASE_URL, JWT_SECRET
npm run dev            # runs on localhost:3001

# Frontend (local)
cd intelligence-hub-app
npm install
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL
npm run dev                  # runs on localhost:3000
```

## Railway Token

Project token name: `claude-cli-intelligence-hub`
Used for CLI access to Railway project.

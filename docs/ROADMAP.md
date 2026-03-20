# Intelligence Hub — Roadmap

> Last updated: 2026-03-20

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
- **Status:** PENDING (next up)
- **Scope:** Kanban content board, inputs management, insights reports, brand voice editor, processing history
- **Plan file:** `docs/superpowers/plans/2026-03-14-plan3b-frontend-features.md`

---

## What's Next

1. **Plan 3B** — Build all feature pages inside instances:
   - Kanban content board (drag & drop by status)
   - Inputs page (upload files, list, process)
   - Insights page (weekly reports)
   - Brand Voice page (edit voice profile)
   - History page (processing runs log)

2. **Polish & QA** — Responsive design, error handling, loading states

3. **Custom domain** — Connect production domain

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

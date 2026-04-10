# Intelligence Hub — Roadmap

> Last updated: 2026-04-04

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

### Processing Status Feedback (2026-03-26)
- **Status:** COMPLETED
- **Scope:** Real-time processing status with adaptive polling
  - Dashboard: RunStatusBadge on each instance card (RUNNING/COMPLETED/FAILED)
  - History: Expandable vertical stepper timeline per run (step-by-step progress)
  - Adaptive polling: 3-5s when running, 10-30s idle, auto-stop after 60s
- **Design doc:** `intelligence-hub-app/docs/plans/2026-03-26-processing-status-design.md`
- **Plan file:** `intelligence-hub-app/docs/plans/2026-03-26-processing-status-plan.md`

---

### Digital Twin / Knowledge Base — Phase 1 (2026-03-26)
- **Status:** COMPLETED (backend) — Frontend UI expansion pending
- **Design doc:** `docs/plans/2026-03-26-digital-twin-kb-design.md`
- **Plan file:** `docs/plans/2026-03-26-digital-twin-kb-plan.md`
- **What was implemented:**
  - ✅ Fixed Opus model ID (was pointing to Sonnet)
  - ✅ Expanded BrandVoice schema → KB with topics, contacts, narratives, lockedFields
  - ✅ Added Instance config: processingPeriod (WEEKLY/MONTHLY), activeWindow (default 8)
  - ✅ Created Distillation Agent (Opus) — replaces old BrandVoice agent, respects locked fields
  - ✅ Corpus Builder now filters inputs by period date range (not all inputs forever)
  - ✅ Orchestrator pipeline: corpus → distillation → content+insights → distribution
  - ✅ Content + Insights agents now receive full KB (profile base + active memory of last N periods)
  - ✅ Frontend step labels updated (Destilación replaces Brand Voice, backward compat kept)
  - ✅ Frontend types updated for new KB fields
  - ✅ Production DB migrated (prisma db push)
- **What's still pending (frontend UI):**
  - Brand Voice page expansion: show topics with positions, contacts, narratives
  - Lock/unlock icons on editable fields
  - Instance settings: period selector (weekly/monthly) + active window config
- **Needs testing:**
  - Run a full processing cycle to verify distillation works end-to-end
  - Verify Opus model generates quality distillation output
  - Check that locked fields are respected during processing

---

### Horse Workflow Evolution (2026-04-04)
- **Status:** COMPLETED (code) — Pending DB migration + E2E testing
- **Design doc:** `docs/plans/2026-04-04-horse-workflow-evolution-design.md`
- **Plan file:** `docs/plans/2026-04-04-horse-workflow-evolution-plan.md`
- **Scope:** 6 major changes to align with Horse's real workflow:
  1. **Brand Voice static/dynamic split** — Identity fields (identity, valueProposition, audience, voiceTone, positioning, metrics) are now static and protected from AI updates. KB fields (topics, contacts, narratives) remain dynamic.
  2. **Improved instance kick-off** — Wizard expanded to 6 steps: Profile → Brand Voice (manual) → Strategic Documents → Platforms → Processing → Summary
  3. **Processing modal** — Click "Procesar" opens a modal to configure content type (Thought Leadership / Hitos), milestone details, weekly directives, and platform selection
  4. **Brand Voice consistency analysis** — New Sonnet-based agent scores each draft (1-10) against the Brand Voice identity, with diversity check vs recent approved posts
  5. **Approved content benchmark** — Agents receive up to 3 diverse approved posts as few-shot examples with anti-bias instructions ("superar, no copiar")
  6. **Agent personality configuration** — Non-technical operator panel with style sliders (formal/conversacional, tecnico/accesible, conciso/detallado), free-text instructions, reference examples, and restrictions per platform
- **What was implemented:**
  - ✅ Schema: new fields on BrandVoice, InputFile, ContentOutput, ProcessingRun + new AgentPromptConfig table
  - ✅ Distillation agent respects `staticFieldsLocked`, reports suggestions via `staticSuggestions`
  - ✅ Strategic docs (STRATEGIC_DOC type, isFoundational flag, always in agent context)
  - ✅ Processing config passed through pipeline to all agents
  - ✅ Benchmark with diversity selection + approval notes
  - ✅ Consistency checker agent integrated into pipeline (new step between content and distribution)
  - ✅ Agent prompt config service + routes (GET/PUT per instance/platform)
  - ✅ Brand Voice page split into Identity + Knowledge Base tabs
  - ✅ Instance wizard expanded to 6 steps with BV manual entry + strategic docs
  - ✅ Processing modal with content types, milestone, directives, platform selection
  - ✅ Kanban enhancements: consistency badge + approval notes flow
  - ✅ Agent personality panel in settings (sliders, instructions, restrictions)
  - ✅ Strategic documents section in inputs page
  - ✅ Unified agent context: BV + KB + corpus + strategic docs + config + benchmark + style
- **Pending:**
  - Run `prisma db push` or `prisma migrate dev` on production DB
  - Full E2E testing of the complete flow
  - Verify consistency agent produces useful scores with real data

---

## What's Next

### Digital Twin — Phase 2: Team Operations Report
- **Status:** DESIGNED — Not yet implemented
- **Design doc:** `docs/plans/2026-03-26-digital-twin-kb-design.md` (Phase 2 section)
- **Scope:**
  - New agent generates operational report for communication team
  - Detects: position changes, new/cooling topics, new contacts, tone shifts, contradictions, opportunities
  - Editable report prompt per instance (team customizes focus)
  - New UI tab or email/Slack delivery

### Technical Debt — To Discuss

- **Right-size `maxTokens` per agent** — Current defaults (Sonnet 4096, Opus 8192, Blog 12000) are arbitrary. `consistencyChecker` with 4096 is tight for 9-15 drafts with notes and will cut responses if volume grows. Needs analysis of realistic output sizes per agent + safety floors. Francisco wants to discuss recommended values before changing.
- **Refactor agent function signatures** — `runLinkedInAgent`, `runXAgent`, `runBlogAgent`, `runTikTokAgent` all take 12+ positional parameters. Each new cross-cutting feature (humanization, style, benchmark…) adds one more. Should become a single `{ instanceId, context, config }` object with destructuring. Refactor touches orchestrator + 4 agents. Francisco wants to discuss approach (incremental vs bulk, naming of context bundle) before executing.
- **Horse Workflow E2E testing** — Code shipped 2026-04-04 but never fully tested end-to-end with real data. Need to: run full pipeline, verify consistency scores are useful (distribution between 6-9, not all 9.5), check lock fields are respected, validate benchmark diversity selection.
- **Strategic doc summary extraction** — `[ContentOrchestrator] Loaded 2 foundational doc(s), 0 with summaries` appears in prod logs. Strategic docs load but have no `extractedSummary`, so they contribute nothing to agent context. Need auto-extract on upload (probably via corpus builder or a dedicated small agent).

### Other Improvements
1. **Drag & Drop file upload** — Support real file uploads (.txt, .pdf, .docx, WhatsApp .zip exports) with multer + storage
2. **Bulk input upload** — Upload multiple inputs at once via drag & drop or multi-file selector
3. **Audio input upload** — Upload audio files (.mp3/.m4a) with automatic transcription via Whisper API
4. **Custom domain** — Connect production domain to Vercel
5. **Error handling polish** — Better user feedback for 409 (already processing), timeouts, etc.

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

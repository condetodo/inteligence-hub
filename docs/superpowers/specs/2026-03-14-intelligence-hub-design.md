# Intelligence Hub — Design Spec

## Overview

Intelligence Hub is a proprietary product built by Horse Consulting. It transforms raw client inputs (WhatsApp messages, emails, audio transcripts, notes, interviews) into two parallel outputs running automatically each week:

1. **Content ready to publish** — Posts for LinkedIn, X, TikTok, and Blog, written in the client's authentic voice, adapted per platform, with AI-generated images.
2. **Business intelligence** — Recurring thought patterns, unexploited opportunities, week-over-week evolution, and actionable recommendations.

The end-client never sees the platform. Only the Horse team operates it.

## Business Model

- **Horse** = the company (single tenant)
- **Users** = Horse team members who operate the platform
- **Instances** = each instance represents a client of Horse (e.g., CEO of Ford, a pharma director, etc.)
- Each instance has its own brand voice, inputs, outputs, and insights
- The end-client only sees the outputs (published posts, email reports)

## Architecture

### Two Repositories

| Repo | Stack | Hosting | Purpose |
|------|-------|---------|---------|
| `intelligence-hub-api` | Node.js/TypeScript, Express, Prisma | Railway | Backend API, AI agents, scheduler, processing |
| `intelligence-hub-app` | Next.js, NextAuth | Vercel | Frontend dashboard |

Communication via REST API with JWT authentication.

### External Services

| Service | Purpose | Model/Tier |
|---------|---------|------------|
| Claude API | Content generation, corpus processing, insights analysis | Sonnet for mechanical tasks, Opus for creative/analysis |
| Nano Banana 2 (Gemini 3.1 Flash Image) | Image generation for posts | Via Google AI API |
| Whisper API (OpenAI) | Audio transcription | Phase 2 |

### Architecture Diagram

```
VERCEL
  └── Next.js Frontend (Dashboard)
      Auth (NextAuth) · Kanban · Inputs · Insights
          │
          │ REST API + JWT
          ▼
RAILWAY
  └── Node.js/Express Backend
      ├── Scheduler (node-cron) → Orchestrator
      │
      ├── Orchestrator (coordinates 5 agents)
      │   ├── 1. Corpus Builder Agent (sequential)
      │   ├── 2. Brand Voice Agent (sequential)
      │   ├── 3a. Content Agent (parallel) ──┐
      │   ├── 3b. Insights Agent (parallel) ─┤
      │   └── 4. Distribution Agent ◄────────┘
      │
      └── PostgreSQL (Prisma)

External APIs: Claude API, Nano Banana 2, Whisper (Phase 2)
```

## Database Schema

### User
| Field | Type | Notes |
|-------|------|-------|
| id | String (CUID) | PK |
| email | String | Unique |
| password | String | Hashed |
| name | String | |
| role | Enum (ADMIN, OPERATOR) | |
| createdAt | DateTime | |

### Instance
| Field | Type | Notes |
|-------|------|-------|
| id | String (CUID) | PK |
| name | String | Display name |
| clientName | String | Client's full name |
| role | String | Client's role/title |
| company | String | Client's company |
| industry | String | |
| status | Enum (ACTIVE, PAUSED, ARCHIVED) | |
| driveFolder | String? | Reserved for Phase 2 |
| createdAt | DateTime | |

### UserInstance (join table)
| Field | Type | Notes |
|-------|------|-------|
| userId | String | FK → User |
| instanceId | String | FK → Instance |

### BrandVoice
| Field | Type | Notes |
|-------|------|-------|
| id | String (CUID) | PK |
| instanceId | String | FK → Instance (1:1) |
| identity | String | Text block |
| valueProposition | String | |
| audience | String | |
| voiceTone | JSON | Adjectives, examples, anti-patterns |
| recurringTopics | JSON | Ordered list of topics |
| positioning | String | |
| metrics | String | |
| insightHistory | JSON | Updated weekly |
| updatedAt | DateTime | |

### InputFile
| Field | Type | Notes |
|-------|------|-------|
| id | String (CUID) | PK |
| instanceId | String | FK → Instance |
| type | Enum (WHATSAPP, EMAIL, AUDIO, NOTE, INTERVIEW) | |
| filename | String | |
| content | Text | Raw content |
| status | Enum (PENDING, PROCESSED) | |
| uploadedAt | DateTime | |
| processedAt | DateTime? | |

### WeeklyCorpus
| Field | Type | Notes |
|-------|------|-------|
| id | String (CUID) | PK |
| instanceId | String | FK → Instance |
| weekNumber | Int | |
| year | Int | |
| summary | JSON | Structured extraction |
| topics | JSON | |
| decisions | JSON | |
| concerns | JSON | |
| opportunities | JSON | |
| createdAt | DateTime | |

### ContentOutput
| Field | Type | Notes |
|-------|------|-------|
| id | String (CUID) | PK |
| instanceId | String | FK → Instance |
| weekNumber | Int | |
| year | Int | |
| platform | Enum (LINKEDIN, X, TIKTOK, BLOG) | |
| type | Enum (POST, THREAD, SCRIPT, ARTICLE) | |
| title | String | |
| content | Text | Full post content |
| imageUrl | String? | Generated image URL |
| imagePrompt | String? | Prompt used for image generation |
| variant | String (A, B, C) | AI-generated option |
| status | Enum (DRAFT, REVIEW, APPROVED, PUBLISHED) | |
| engagement | JSON? | Views, reactions, etc. |
| createdAt | DateTime | |

### InsightReport
| Field | Type | Notes |
|-------|------|-------|
| id | String (CUID) | PK |
| instanceId | String | FK → Instance |
| weekNumber | Int | |
| year | Int | |
| executiveSummary | Text | |
| topTopics | JSON | With evidence |
| opportunity | Text | Most actionable one |
| evolution | Text | vs previous week |
| questions | JSON | 3 questions for client |
| recommendations | Text | |
| createdAt | DateTime | |

### ProcessingRun
| Field | Type | Notes |
|-------|------|-------|
| id | String (CUID) | PK |
| instanceId | String | FK → Instance |
| weekNumber | Int | |
| year | Int | |
| status | Enum (RUNNING, COMPLETED, FAILED) | |
| steps | JSON | Progress of each step |
| startedAt | DateTime | |
| completedAt | DateTime? | |
| triggeredBy | Enum (CRON, MANUAL) | |

## Agent System

### 5 Agents

1. **Corpus Builder Agent** — Reads all PENDING InputFiles, extracts themes/decisions/concerns/opportunities/quotes, creates WeeklyCorpus, marks inputs as PROCESSED. Uses Claude Sonnet.

2. **Brand Voice Agent** — Reads new WeeklyCorpus, compares with current BrandVoice, updates evolved fields. Uses Claude Sonnet.

3. **Content Agent** — Reads BrandVoice + WeeklyCorpus, runs 4 skills in parallel (LinkedIn, X, TikTok, Blog), generates text + images (Nano Banana 2), creates ContentOutput records with variants A/B/C. Uses Claude Opus + Nano Banana 2.

4. **Insights Agent** — Reads BrandVoice + WeeklyCorpus + previous corpus, generates weekly intelligence report, creates InsightReport. Uses Claude Opus.

5. **Distribution Agent** — MVP: marks outputs as DRAFT. Phase 2: sends to Notion, Gmail, WordPress, social APIs.

### 4 Skills

1. **LinkedIn Skill** — 3 posts/week. Format: hook + 3-5 short paragraphs + CTA + 3 hashtags. Types: thought leadership, case study, learning, opinion. 150-250 words.

2. **X Skill** — 2 standalone tweets (280 chars max) + 1 thread (5-8 tweets). Direct, one idea per tweet.

3. **TikTok Skill** — Video scripts for short-form content. Format: hook (3 sec) + development (15-45 sec) + CTA. Includes visual directions, text overlays, and trending format suggestions.

4. **Blog Skill** — 1 SEO article/week. 800-1200 words. H1 + meta description + 3-5 H2 sections + conclusion. Primary keyword + 3-5 secondary.

### Orchestration Flow

```
Trigger (cron Monday 7am OR "Process now" button)
  │
  ▼
1. Corpus Builder (sequential) — Claude Sonnet
  │
  ▼
2. Brand Voice Update (sequential) — Claude Sonnet
  │
  ▼
3. Promise.all([
     3a. Content Agent — Claude Opus + Nano Banana 2
     3b. Insights Agent — Claude Opus
   ])
  │
  ▼
4. Distribution Agent (no AI)
  │
  ▼
ProcessingRun.status = COMPLETED
```

Each step updates ProcessingRun.steps in DB for real-time progress display.

## API Endpoints

### Auth
- `POST /api/auth/register` — Create user
- `POST /api/auth/login` — Email + password → JWT
- `GET /api/auth/me` — Current user

### Instances
- `GET /api/instances` — List user's instances
- `POST /api/instances` — Create instance
- `GET /api/instances/:id` — Instance detail
- `PUT /api/instances/:id` — Edit instance
- `DELETE /api/instances/:id` — Archive instance

### Brand Voice
- `GET /api/instances/:id/brand-voice` — Read current brand voice
- `PUT /api/instances/:id/brand-voice` — Edit manually

### Inputs
- `GET /api/instances/:id/inputs` — List inputs
- `POST /api/instances/:id/inputs` — Upload input (text or file)
- `DELETE /api/instances/:id/inputs/:inputId` — Delete input

### Processing
- `POST /api/instances/:id/process` — Trigger "Process now" (async, returns runId)
- `GET /api/instances/:id/runs` — Processing history
- `GET /api/instances/:id/runs/:runId` — Run status (for polling)

### Content
- `GET /api/instances/:id/content` — List content (filters: week, platform, status)
- `GET /api/instances/:id/content/:contentId` — Post detail
- `PATCH /api/instances/:id/content/:contentId` — Change status (kanban move)
- `PUT /api/instances/:id/content/:contentId` — Edit content manually

### Insights
- `GET /api/instances/:id/insights` — List weekly reports
- `GET /api/instances/:id/insights/:week` — Specific week report

### Corpus
- `GET /api/instances/:id/corpus` — List weekly corpus
- `GET /api/instances/:id/corpus/:week` — Specific week corpus

## Frontend Pages

| Route | Purpose |
|-------|---------|
| `/login` | Email + password login |
| `/register` | Registration |
| `/dashboard` | Overview: all instances with stats |
| `/instances/new` | Create instance (onboarding wizard) |
| `/instances/:id/content` | **Kanban view** (main screen) |
| `/instances/:id/inputs` | Upload and view inputs |
| `/instances/:id/insights` | Weekly intelligence reports |
| `/instances/:id/brand-voice` | View/edit brand voice |
| `/instances/:id/history` | Processing timeline |
| `/settings` | Account, team, API keys |

### Kanban View (Primary UI)
4 columns: Draft → In Review → Approved → Published
- Cards show: platform badge, title, preview, type, AI variant selector (A/B/C)
- Click card → modal with full post (text + image + copy/download buttons)
- Filter by platform and week
- Processing status banner at top

### Design System
- Colors: Horse Consulting palette — black (#1a1a1a), dark gray (#32373c), light background (#f5f5f3), white cards
- Typography: Inter (or Glacial Indifference to match Horse branding)
- Style: Minimalist, professional, clean. No AI/tech aesthetics.
- White-labeled: no references to Claude, Anthropic, or any AI provider

## Demo Client

**Francisco Pérez** — Cofounder of Uanaknow / Horse Consulting
- **Voice:** Direct, structured (numbered lists, bullet points), technical but accessible, closes with warmth ("Abrazo"). Goes straight to the point.
- **Positioning:** AI implementation expert for SMBs and mid/large companies. Mix of strategic + tactical assessment + implementation.
- **Strong opinion:** Companies that don't adopt AI will be pushed out of the market. Multidisciplinary teams are needed to make it happen.
- **Active projects:** Custom platforms, multi-agent automation, continuous improvement flows based on AI performance.
- **Ideal client:** Companies not afraid of change, willing to iterate and improve processes.
- **Topics:** AI implementation, process automation, multi-agent systems, digital transformation, scaling without hiring, operational efficiency.

Demo inputs to be created: 8-10 WhatsApp conversations, 4-5 emails, 5-6 notes.

## Roadmap

### Phase 1 — MVP (current build)
- Auth (email + password)
- CRUD instances
- Manual text upload for inputs
- 5 agents functioning (corpus → brand voice → content → insights → distribution)
- 4 skills (LinkedIn, X, TikTok, Blog)
- Image generation with Nano Banana 2
- Kanban with approval flow (Draft → Review → Approved → Published)
- Copy text + download image on approval
- Insights weekly view
- Cron weekly + "Process now" button
- Demo client: Francisco Pérez

### Phase 2 — Integrations
- Google Drive (folder per instance for inputs)
- Whisper API (audio transcription)
- Auto-publish to LinkedIn and X
- Gmail (automatic weekly report email)

### Phase 3 — Scale
- WordPress (blog drafts)
- TikTok API (auto-publish)
- Real engagement metrics (LinkedIn API analytics)
- Multi-tenant (if Horse wants to sell the platform to other agencies)
- Brand voice history with visual diff

# Digital Twin / Knowledge Base — Design Document

**Date:** 2026-03-26
**Status:** Approved
**Phases:** 2

## Problem

The current system processes inputs in isolation — each week's content is generated only from that week's corpus, with no accumulated knowledge. This means:
- No memory of past positions, decisions, or recurring themes
- Content lacks depth and consistency over time
- Re-processing in the same week overwrites instead of accumulating
- The system can't build a true representation of who the CEO is

## Vision

Build a **Digital Twin** for each CEO/persona — an accumulated knowledge base that grows smarter over time, enabling increasingly accurate and consistent content generation. The twin knows who they are, what they think, how they speak, and what matters to them.

## Architecture: Three-Layer Knowledge Base

```
+-----------------------------------------------+
|              KNOWLEDGE BASE                    |
|                                                |
|  +------------------------------------------+  |
|  |  PERFIL BASE (permanent, grows slowly)   |  |
|  |  - Identity, voice, tone, audience       |  |
|  |  - Positioning, value proposition        |  |
|  |  - Core topics with positions            |  |
|  |  - Recurring contacts/network            |  |
|  |  - Active narratives/projects            |  |
|  |  - Each field has locked: boolean        |  |
|  +------------------------------------------+  |
|                                                |
|  +------------------------------------------+  |
|  |  ACTIVE MEMORY (last N periods)          |  |
|  |  = Existing WeeklyCorpus[] records       |  |
|  |  - Period 10: topics, decisions...       |  |
|  |  - Period 11: topics, decisions...       |  |
|  |  - Period 12: topics, decisions...       |  |
|  |  - Period 13: topics, decisions...       |  |
|  +------------------------------------------+  |
|                                                |
|  +------------------------------------------+  |
|  |  CONFIG (per instance)                   |  |
|  |  - Period: weekly | monthly              |  |
|  |  - Active window: N periods (default: 8) |  |
|  +------------------------------------------+  |
+-----------------------------------------------+
```

## Design Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Memory model | Sliding window | Permanent base profile + active memory of last N periods. Most flexible, can evolve to infinite or decay later. |
| Output format | Agnostic | KB stores pure knowledge, any skill/format can consume it (LinkedIn, blog, newsletter, podcast, etc.) |
| Period config | Per instance | Each CEO has their own publishing rhythm (weekly/monthly) |
| Contradictions | Last wins (MVP) | Latest position replaces previous. Phase 2 informe can alert team of changes. |
| Manual edits | Locked fields | Team can edit any field and lock it. Distillation respects locks. Content always uses all fields regardless of lock status. |
| BrandVoice migration | Expand in place | BrandVoice model gets new fields, becomes the profile base. No new model needed. |
| AI models | Opus for reasoning, Sonnet for mechanical | Opus for distillation + content + insights. Sonnet for corpus extraction + distribution. |

## Locked Fields Mechanism

Each editable field in the profile base has a `locked: boolean` flag:

- **Unlocked (default):** Distillation agent can update it automatically
- **Locked:** Only the team can modify it manually

**Critical:** Lock status ONLY affects who can modify the field. ALL fields (locked or not) are ALWAYS used for content generation.

Example:
```json
{
  "identity": { "value": "CEO de fintech...", "locked": false },
  "voiceTone": { "value": { "adjectives": ["..."] }, "locked": true },
  "topics": [
    { "name": "IA", "position": "...", "locked": false },
    { "name": "Fundraising", "position": "...", "locked": true }
  ]
}
```

UI: Small lock icon next to each field. Open = auto-updates. Closed = team controls.

## Processing Pipeline (Phase 1)

```
Inputs (filtered by current period via uploadedAt)
    |
    v
[Corpus Builder] (Sonnet) -- extracts structured data
    |
    v
[Distillation Agent] (Opus) -- NEW STEP
    |  reads: new corpus + current profile base
    |  respects: locked fields
    |  updates: topics, positions, contacts, narratives
    |
    v
KB Updated (profile base + active memory)
    |
    v
[Content Agent] (Opus) -- receives FULL KB (profile + memory)
[Insights Agent] (Opus) -- receives FULL KB
    |
    v
[Distribution] (Sonnet) -- marks as DRAFT
```

### Model assignments:

| Step | Model | Reasoning |
|---|---|---|
| Corpus Builder | Sonnet | Structured extraction, mechanical task |
| Distillation | Opus | Reasoning about contradictions, evolution, nuance |
| Content Generation | Opus | Creativity + coherence with full twin context |
| Insights | Opus | Deep analysis, pattern detection |
| Distribution | Sonnet | Mechanical task (mark as draft) |

## Database Changes (Phase 1)

### Expand BrandVoice model

Add new fields to existing BrandVoice:
- `topics`: JSON array — `[{ name, position, evidence, locked }]`
- `contacts`: JSON array — `[{ name, company, context, frequency, locked }]`
- `narratives`: JSON array — `[{ name, status, startedAt, context, locked }]`
- `lockedFields`: JSON object — tracks which base fields are locked

### Expand Instance model

Add configuration fields:
- `processingPeriod`: enum `WEEKLY | MONTHLY` (default: WEEKLY)
- `activeWindow`: int (default: 8) — how many periods of active memory

### WeeklyCorpus — No changes

Already serves as active memory. Pipeline reads last N records based on `activeWindow`.

### Input filtering

Corpus Builder filters inputs by `uploadedAt` within current period boundaries (week start/end or month start/end), instead of by PENDING status.

## Phase 2: Team Operations Report

**Not implemented in Phase 1. Design only.**

After distillation, a new agent generates an operational report for the communication team:

### Report content:
- **Position changes** — "CEO stopped mentioning AI as priority (was recurring weeks 8-12)"
- **New topics** — "'Expansion to Brazil' appeared for the first time"
- **Cooling topics** — "Hasn't mentioned 'fundraising' in 3 weeks"
- **New contacts** — "Juan Perez (Acme Corp) mentioned 4 times"
- **Tone shifts** — "More cautious tone this week regarding investments"
- **Alerts** — "Possible contradiction: said X in week 10 but now says Y"
- **Opportunities detected** — "New partnership opportunity with Acme Corp based on repeated mentions"

### Key features:
- **Editable report prompt per instance** — team can customize what analysis they want (e.g., "focus on partnership opportunities" vs "focus on product positioning changes")
- Uses Opus (needs to reason about subtle changes)
- New model: `TeamReport`
- New UI tab or email/Slack delivery
- Consumes KB (compares pre/post distillation state) — no changes to core pipeline needed

## Migration Strategy

1. Expand BrandVoice schema with new fields (additive, non-breaking)
2. Add Instance config fields with defaults (WEEKLY, 8)
3. Create Distillation Agent
4. Update Content/Insights agents to receive full KB
5. Update Corpus Builder to filter by period
6. Migrate existing BrandVoice data into new field structure
7. Update frontend Brand Voice page to show expanded fields + locks

# Cost Tracking por Procesamiento — Design Doc

**Date**: 2026-04-06
**Status**: Approved

## Context

Intelligence Hub uses Claude API (Anthropic) and Nano Banana 2 (Google AI) for content generation and image generation respectively. Currently, usage data from API responses is discarded. We need to track tokens and estimated costs per processing run per instance to understand spending.

## Decision

Track costs at the **processing run** level with per-agent granularity. Store in a dedicated `APIUsageLog` table (not JSON blobs) for clean querying and future extensibility.

## Database Schema

```prisma
model APIUsageLog {
  id              String        @id @default(cuid())
  processingRun   ProcessingRun @relation(fields: [processingRunId], references: [id], onDelete: Cascade)
  processingRunId String
  instance        Instance      @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  instanceId      String

  provider        String        // "anthropic" | "google"
  model           String        // e.g. "claude-opus-4-20250514"
  stepName        String        // "corpus", "distillation", "linkedin", "x", "tiktok", "blog", "insights", "consistency", "image"

  inputTokens     Int           @default(0)
  outputTokens    Int           @default(0)
  estimatedCostUsd Float        @default(0)

  createdAt       DateTime      @default(now())

  @@index([processingRunId])
  @@index([instanceId])
}
```

Add relations to `ProcessingRun` and `Instance` models.

## Backend Changes

### 1. Capture usage from API wrappers

**`lib/claude.ts`**: Modify `callOpus`/`callSonnet` return type to include usage:
```typescript
// Before: returns parsed JSON data
// After: returns { data, usage: { inputTokens, outputTokens, model } }
```

The Anthropic SDK response already includes `response.usage.input_tokens` and `response.usage.output_tokens`.

**`lib/nanoBanana.ts`**: Return `usageMetadata` from Google AI response (`result.response.usageMetadata.promptTokens`, `candidatesTokens`).

### 2. Pricing constants

```typescript
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-20250514':       { input: 15 / 1_000_000, output: 75 / 1_000_000 },
  'claude-sonnet-4-5-20250929':   { input: 3 / 1_000_000,  output: 15 / 1_000_000 },
  'gemini-3.1-flash-image-preview': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
};
```

### 3. Log usage in agents

Each agent receives `runId` and `instanceId`, creates an `APIUsageLog` record after its API call. The orchestrator already passes these IDs to each agent.

### 4. Image generation logging

`content.service.ts` — when generating an image on approval, log usage with stepName `"image"` and the content's `instanceId`. Note: no `processingRunId` available at approval time, so this field is nullable or uses a sentinel value.

**Schema adjustment**: Make `processingRunId` optional (`String?`) to support image generation logs outside of processing runs.

### 5. API Endpoint

```
GET /api/instances/:id/costs?month=4&year=2026
```

Returns:
```json
{
  "runs": [
    {
      "runId": "...",
      "weekNumber": 15,
      "startedAt": "2026-04-06T15:06:00Z",
      "totalCost": 0.53,
      "totalInputTokens": 24000,
      "totalOutputTokens": 8400,
      "steps": [
        { "stepName": "corpus", "model": "claude-opus-4-...", "inputTokens": 5000, "outputTokens": 1000, "cost": 0.10 },
        ...
      ]
    }
  ],
  "summary": {
    "totalCost": 2.12,
    "totalRuns": 4,
    "avgCostPerRun": 0.53
  }
}
```

## Frontend

### New tab: "Costos" at `/instances/:id/costs`

- **Header**: Monthly total cost, number of runs, average cost per run
- **Table**: One row per ProcessingRun — date, week, total cost, token count
- **Expandable rows**: Breakdown per agent/step with model, tokens, cost
- **Month selector**: Navigate between months

### Tab registration

Add to `InstanceTabs.tsx`:
```typescript
{ label: 'Costos', href: `/instances/${id}/costs` }
```

## Files to modify

### Backend
- `prisma/schema.prisma` — Add `APIUsageLog` model + relations
- `src/lib/claude.ts` — Return usage data from API calls
- `src/lib/nanoBanana.ts` — Return usage metadata
- `src/lib/pricing.ts` — New file with pricing constants and cost calculator
- `src/agents/*.ts` — All agents: log usage after API calls
- `src/services/content.service.ts` — Log image generation usage on approval
- `src/services/cost.service.ts` — New service for querying cost data
- `src/controllers/cost.controller.ts` — New controller
- `src/routes/cost.routes.ts` — New route

### Frontend
- `src/components/InstanceTabs.tsx` — Add "Costos" tab
- `src/app/(app)/instances/[id]/costs/page.tsx` — New page
- `src/components/costs/CostSummary.tsx` — Monthly summary header
- `src/components/costs/CostTable.tsx` — Expandable run table
- `src/lib/types.ts` — Add cost-related types

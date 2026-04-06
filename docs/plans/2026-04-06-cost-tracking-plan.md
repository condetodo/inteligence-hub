# Cost Tracking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Track API token usage and estimated costs per processing run, per instance, and display in a new "Costos" frontend tab.

**Architecture:** Modify `claude.ts` and `nanoBanana.ts` to return usage metadata alongside data. Each agent logs an `APIUsageLog` record after its API call. New `/costs` endpoint aggregates logs per run. New frontend tab displays runs with expandable cost breakdown.

**Tech Stack:** Prisma (migration), Express routes, Next.js page, existing design system (horse-* tokens, lucide-react icons).

---

### Task 1: Prisma Schema — Add APIUsageLog model

**Files:**
- Modify: `intelligence-hub-api/prisma/schema.prisma`

**Step 1: Add APIUsageLog model and relations**

Add at end of schema:

```prisma
model APIUsageLog {
  id              String         @id @default(cuid())
  processingRun   ProcessingRun? @relation(fields: [processingRunId], references: [id], onDelete: Cascade)
  processingRunId String?
  instance        Instance       @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  instanceId      String

  provider        String
  model           String
  stepName        String

  inputTokens     Int            @default(0)
  outputTokens    Int            @default(0)
  estimatedCostUsd Float         @default(0)

  createdAt       DateTime       @default(now())

  @@index([processingRunId])
  @@index([instanceId])
}
```

Add relation to `Instance` model (line ~106, after `agentConfigs`):

```prisma
  apiUsageLogs           APIUsageLog[]
```

Add relation to `ProcessingRun` model (line ~266, after `triggeredBy`):

```prisma
  usageLogs   APIUsageLog[]
```

**Step 2: Run migration**

```bash
cd intelligence-hub-api && npx prisma migrate dev --name add-api-usage-log
```

Expected: Migration created and applied, `prisma generate` runs automatically.

**Step 3: Commit**

```bash
git add prisma/ && git commit -m "feat: add APIUsageLog schema for cost tracking"
```

---

### Task 2: Pricing utility

**Files:**
- Create: `intelligence-hub-api/src/lib/pricing.ts`

**Step 1: Create pricing module**

```typescript
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-20250514':         { input: 15 / 1_000_000, output: 75 / 1_000_000 },
  'claude-sonnet-4-5-20250929':     { input: 3 / 1_000_000,  output: 15 / 1_000_000 },
  'gemini-3.1-flash-image-preview': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICING[model];
  if (!price) return 0;
  return inputTokens * price.input + outputTokens * price.output;
}
```

**Step 2: Commit**

```bash
git add src/lib/pricing.ts && git commit -m "feat: add API pricing utility"
```

---

### Task 3: Modify claude.ts to return usage data

**Files:**
- Modify: `intelligence-hub-api/src/lib/claude.ts`

**Step 1: Add usage return type and capture usage from response**

Change the `callClaude` function signature and return type:

```typescript
export interface ClaudeUsage {
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export interface ClaudeResult {
  data: Record<string, unknown>;
  usage: ClaudeUsage;
}
```

Change `callClaude` return type from `Promise<Record<string, unknown>>` to `Promise<ClaudeResult>`.

After `JSON.parse(jsonText)` (currently line 40), instead of `return JSON.parse(jsonText)`:

```typescript
return {
  data: JSON.parse(jsonText),
  usage: {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model,
  },
};
```

Update `callSonnet` and `callOpus` return types to `Promise<ClaudeResult>`.

**Step 2: Commit**

```bash
git add src/lib/claude.ts && git commit -m "feat: return usage metadata from Claude API wrapper"
```

---

### Task 4: Modify nanoBanana.ts to return usage data

**Files:**
- Modify: `intelligence-hub-api/src/lib/nanoBanana.ts`

**Step 1: Add usage to GeneratedImage interface and return**

Update `GeneratedImage` interface:

```typescript
export interface GeneratedImage {
  base64: string;
  mimeType: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    model: string;
  };
}
```

In the `generateImage` function, after extracting `imagePart`, capture usage:

```typescript
const usageMetadata = response.usageMetadata;

return {
  base64: imagePart.inlineData.data,
  mimeType: imagePart.inlineData.mimeType || 'image/png',
  usage: {
    inputTokens: usageMetadata?.promptTokenCount ?? 0,
    outputTokens: usageMetadata?.candidatesTokenCount ?? 0,
    model: 'gemini-3.1-flash-image-preview',
  },
};
```

**Step 2: Commit**

```bash
git add src/lib/nanoBanana.ts && git commit -m "feat: return usage metadata from Nano Banana image generation"
```

---

### Task 5: Create usage logging helper

**Files:**
- Create: `intelligence-hub-api/src/lib/usageLogger.ts`

**Step 1: Create the helper**

```typescript
import { prisma } from './prisma';
import { estimateCost } from './pricing';

interface LogUsageParams {
  instanceId: string;
  processingRunId?: string;
  provider: 'anthropic' | 'google';
  model: string;
  stepName: string;
  inputTokens: number;
  outputTokens: number;
}

export async function logUsage(params: LogUsageParams) {
  const cost = estimateCost(params.model, params.inputTokens, params.outputTokens);

  await prisma.aPIUsageLog.create({
    data: {
      instanceId: params.instanceId,
      processingRunId: params.processingRunId ?? null,
      provider: params.provider,
      model: params.model,
      stepName: params.stepName,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      estimatedCostUsd: cost,
    },
  });
}
```

**Step 2: Commit**

```bash
git add src/lib/usageLogger.ts && git commit -m "feat: add usage logging helper"
```

---

### Task 6: Update all agents to log usage

**Files:**
- Modify: `intelligence-hub-api/src/agents/corpusBuilder.ts`
- Modify: `intelligence-hub-api/src/agents/distillation.ts`
- Modify: `intelligence-hub-api/src/agents/linkedinAgent.ts`
- Modify: `intelligence-hub-api/src/agents/xAgent.ts`
- Modify: `intelligence-hub-api/src/agents/tiktokAgent.ts`
- Modify: `intelligence-hub-api/src/agents/blogAgent.ts`
- Modify: `intelligence-hub-api/src/agents/insights.ts`
- Modify: `intelligence-hub-api/src/agents/consistencyChecker.ts`

**Step 1: Update each agent**

Pattern for every agent — example using corpusBuilder.ts:

The `callOpus`/`callSonnet` now returns `{ data, usage }` instead of raw data. Update each agent:

1. Add import: `import { logUsage } from '../lib/usageLogger';`
2. Change the API call from `const result = await callOpus(...)` to `const { data: result, usage } = await callOpus(...)`
3. After the API call, add:
```typescript
await logUsage({
  instanceId,
  processingRunId: runId,
  provider: 'anthropic',
  model: usage.model,
  stepName: 'corpus', // use step name matching the agent
  inputTokens: usage.inputTokens,
  outputTokens: usage.outputTokens,
});
```

**Important:** Each agent function needs to receive `runId` as a parameter. Check the orchestrator — it already has `runId` and passes it or can pass it.

Check the orchestrator call signatures:
- `runCorpusBuilder(instanceId, weekNumber, year, start, end)` — needs `runId` added
- `runDistillationAgent(instanceId, weekNumber, year)` — needs `runId` added
- `runContentOrchestrator(instanceId, weekNumber, year, config)` — needs `runId` added (propagates to sub-agents)
- `runInsightsAgent(instanceId, weekNumber, year)` — needs `runId` added
- `runConsistencyChecker(instanceId, weekNumber, year)` — needs `runId` added
- `runDistributionAgent(instanceId, weekNumber, year)` — needs `runId` added

Update the orchestrator (`src/orchestrator.ts`) to pass `runId` to each agent call.

Step names per agent:
- corpusBuilder → `"corpus"`
- distillation → `"distillation"`
- linkedinAgent → `"linkedin"`
- xAgent → `"x"`
- tiktokAgent → `"tiktok"`
- blogAgent → `"blog"`
- insights → `"insights"`
- consistencyChecker → `"consistency"`

**Step 2: Commit**

```bash
git add src/agents/ src/orchestrator.ts && git commit -m "feat: log API usage in all agents"
```

---

### Task 7: Log image generation usage on approval

**Files:**
- Modify: `intelligence-hub-api/src/services/content.service.ts`

**Step 1: Add usage logging for image generation**

Import `logUsage`:
```typescript
import { logUsage } from '../lib/usageLogger';
```

In `updateStatus`, after `generateImage` succeeds, log the usage:

```typescript
const img = await generateImage(content.imagePrompt);
updateData.imageUrl = `data:${img.mimeType};base64,${img.base64}`;

await logUsage({
  instanceId,
  provider: 'google',
  model: img.usage.model,
  stepName: 'image',
  inputTokens: img.usage.inputTokens,
  outputTokens: img.usage.outputTokens,
});
```

**Step 2: Commit**

```bash
git add src/services/content.service.ts && git commit -m "feat: log image generation usage on content approval"
```

---

### Task 8: Backend — Cost query service and route

**Files:**
- Create: `intelligence-hub-api/src/services/cost.service.ts`
- Create: `intelligence-hub-api/src/controllers/cost.controller.ts`
- Create: `intelligence-hub-api/src/routes/cost.routes.ts`
- Modify: `intelligence-hub-api/src/index.ts`

**Step 1: Create cost service**

```typescript
import { prisma } from '../lib/prisma';

export class CostService {
  static async getByInstance(instanceId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const logs = await prisma.aPIUsageLog.findMany({
      where: {
        instanceId,
        createdAt: { gte: startDate, lt: endDate },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by processingRunId
    const runMap = new Map<string, typeof logs>();
    const orphanLogs: typeof logs = [];

    for (const log of logs) {
      if (log.processingRunId) {
        const group = runMap.get(log.processingRunId) || [];
        group.push(log);
        runMap.set(log.processingRunId, group);
      } else {
        orphanLogs.push(log);
      }
    }

    // Fetch run metadata
    const runIds = Array.from(runMap.keys());
    const runs = await prisma.processingRun.findMany({
      where: { id: { in: runIds } },
      orderBy: { startedAt: 'desc' },
    });

    const runResults = runs.map((run) => {
      const runLogs = runMap.get(run.id) || [];
      const totalCost = runLogs.reduce((s, l) => s + l.estimatedCostUsd, 0);
      const totalInput = runLogs.reduce((s, l) => s + l.inputTokens, 0);
      const totalOutput = runLogs.reduce((s, l) => s + l.outputTokens, 0);

      return {
        runId: run.id,
        weekNumber: run.weekNumber,
        startedAt: run.startedAt,
        status: run.status,
        totalCost: Math.round(totalCost * 10000) / 10000,
        totalInputTokens: totalInput,
        totalOutputTokens: totalOutput,
        steps: runLogs.map((l) => ({
          stepName: l.stepName,
          provider: l.provider,
          model: l.model,
          inputTokens: l.inputTokens,
          outputTokens: l.outputTokens,
          cost: Math.round(l.estimatedCostUsd * 10000) / 10000,
        })),
      };
    });

    // Add orphan image logs
    const imageCosts = orphanLogs.map((l) => ({
      stepName: l.stepName,
      provider: l.provider,
      model: l.model,
      inputTokens: l.inputTokens,
      outputTokens: l.outputTokens,
      cost: Math.round(l.estimatedCostUsd * 10000) / 10000,
      createdAt: l.createdAt,
    }));

    const totalCost = logs.reduce((s, l) => s + l.estimatedCostUsd, 0);

    return {
      runs: runResults,
      imageCosts,
      summary: {
        totalCost: Math.round(totalCost * 10000) / 10000,
        totalRuns: runs.length,
        avgCostPerRun: runs.length > 0 ? Math.round((totalCost / runs.length) * 10000) / 10000 : 0,
      },
    };
  }
}
```

**Step 2: Create controller**

```typescript
import { Request, Response, NextFunction } from 'express';
import { CostService } from '../services/cost.service';

export class CostController {
  static async getByInstance(req: Request, res: Response, next: NextFunction) {
    try {
      const month = Number(req.query.month) || new Date().getMonth() + 1;
      const year = Number(req.query.year) || new Date().getFullYear();
      const result = await CostService.getByInstance(req.params.id, month, year);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
```

**Step 3: Create route**

```typescript
import { Router } from 'express';
import { CostController } from '../controllers/cost.controller';
import { authenticate } from '../middleware/auth';

export const costRoutes = Router();
costRoutes.use(authenticate);
costRoutes.get('/:id/costs', CostController.getByInstance);
```

**Step 4: Register route in index.ts**

Add after line 44 (`agentPromptConfigRoutes`):
```typescript
import { costRoutes } from './routes/cost.routes';
// ...
app.use('/api/instances', costRoutes);
```

**Step 5: Commit**

```bash
git add src/services/cost.service.ts src/controllers/cost.controller.ts src/routes/cost.routes.ts src/index.ts && git commit -m "feat: add costs API endpoint"
```

---

### Task 9: Frontend — Types and tab registration

**Files:**
- Modify: `intelligence-hub-app/src/lib/types.ts`
- Modify: `intelligence-hub-app/src/components/InstanceTabs.tsx`

**Step 1: Add cost types**

Add to `types.ts`:

```typescript
// Costs
export interface CostStep {
  stepName: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface CostRun {
  runId: string;
  weekNumber: number;
  startedAt: string;
  status: RunStatus;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  steps: CostStep[];
}

export interface CostSummary {
  totalCost: number;
  totalRuns: number;
  avgCostPerRun: number;
}

export interface CostData {
  runs: CostRun[];
  imageCosts: (CostStep & { createdAt: string })[];
  summary: CostSummary;
}
```

**Step 2: Add tab**

In `InstanceTabs.tsx`, add to the `tabs` array (after "Historial"):

```typescript
{ href: `/instances/${instanceId}/costs`, label: "Costos" },
```

**Step 3: Commit**

```bash
git add src/lib/types.ts src/components/InstanceTabs.tsx && git commit -m "feat: add cost types and Costos tab"
```

---

### Task 10: Frontend — Costs page and components

**Files:**
- Create: `intelligence-hub-app/src/app/(app)/instances/[id]/costs/page.tsx`

**Step 1: Create the costs page**

Single-file page with:
- Month selector (prev/next month navigation)
- Summary cards: total cost, runs count, avg per run
- Table of runs, each expandable to show per-step breakdown
- Uses `api.get<CostData>` to fetch data
- Pattern: follow existing pages like `history/page.tsx` for layout conventions

The page should use the existing design system:
- Cards with `bg-white border border-horse-gray-200 rounded-xl`
- Text colors: `text-horse-black`, `text-horse-gray-500`
- Small badges: `bg-horse-gray-100 text-horse-gray-500 px-2 py-0.5 rounded text-[10px]`
- Cost formatting: `$0.1234` (4 decimal places)
- Token formatting: `24,000` (with comma separators)
- Use `ChevronDown`/`ChevronRight` from lucide-react for expandable rows

**Step 2: Commit**

```bash
git add "src/app/(app)/instances/[id]/costs/" && git commit -m "feat: add Costos page with run breakdown"
```

---

### Task 11: Build and deploy

**Step 1: Build frontend**

```bash
cd intelligence-hub-app && npx next build
```

Expected: Build succeeds with no errors.

**Step 2: Build backend**

```bash
cd intelligence-hub-api && npx tsc --noEmit
```

Expected: No errors in our modified files.

**Step 3: Commit any fixes and push**

```bash
git push origin main
```

---

## Summary Table

| Task | What | Files |
|------|------|-------|
| 1 | Prisma schema + migration | `schema.prisma` |
| 2 | Pricing utility | `lib/pricing.ts` (new) |
| 3 | Claude wrapper usage | `lib/claude.ts` |
| 4 | Nano Banana usage | `lib/nanoBanana.ts` |
| 5 | Usage logging helper | `lib/usageLogger.ts` (new) |
| 6 | All agents log usage | `agents/*.ts`, `orchestrator.ts` |
| 7 | Image gen logging | `services/content.service.ts` |
| 8 | Cost API endpoint | `services/cost.service.ts`, `controllers/`, `routes/` (new) |
| 9 | Frontend types + tab | `types.ts`, `InstanceTabs.tsx` |
| 10 | Costs page | `costs/page.tsx` (new) |
| 11 | Build + deploy | — |

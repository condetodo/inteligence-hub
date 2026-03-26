# Digital Twin / Knowledge Base — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Evolve BrandVoice into a three-layer Knowledge Base (profile base + active memory + config) with a Distillation Agent, locked fields, configurable periods, and Opus model for reasoning tasks.

**Architecture:** Expand the existing BrandVoice model with new JSON fields (topics with positions, contacts, narratives, lockedFields). Add processingPeriod and activeWindow to Instance. Create a new Distillation Agent that updates the KB respecting locks. Update Content/Insights agents to consume the full KB. Fix Opus model ID in claude.ts.

**Tech Stack:** Prisma (PostgreSQL), Express.js, Anthropic SDK (Opus + Sonnet), Next.js 14, React, Tailwind CSS.

---

### Task 1: Fix Opus model ID in claude.ts

**Files:**
- Modify: `intelligence-hub-api/src/lib/claude.ts:9`

**Step 1: Fix the OPUS_MODEL constant**

Currently both SONNET_MODEL and OPUS_MODEL point to the same model. Change line 9:

```typescript
// FROM:
const OPUS_MODEL = 'claude-sonnet-4-5-20250929';
// TO:
const OPUS_MODEL = 'claude-opus-4-20250514';
```

**Step 2: Verify it compiles**

```bash
cd /c/proyectos/Inteligence-hub/intelligence-hub-api && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/lib/claude.ts
git commit -m "fix: use actual Opus model ID instead of Sonnet duplicate"
```

---

### Task 2: Expand Prisma schema — BrandVoice + Instance

**Files:**
- Modify: `intelligence-hub-api/prisma/schema.prisma`

**Step 1: Add new enum and fields**

Add `ProcessingPeriod` enum after `RunTrigger`:

```prisma
enum ProcessingPeriod {
  WEEKLY
  MONTHLY
}
```

Add fields to `Instance` model (after `driveFolder`):

```prisma
  processingPeriod ProcessingPeriod @default(WEEKLY)
  activeWindow     Int              @default(8)
```

Add fields to `BrandVoice` model (after `insightHistory`):

```prisma
  topics       Json @default("[]")
  contacts     Json @default("[]")
  narratives   Json @default("[]")
  lockedFields Json @default("{}")
```

**Step 2: Generate and run migration**

```bash
cd /c/proyectos/Inteligence-hub/intelligence-hub-api
npx prisma migrate dev --name add-kb-fields
npx prisma generate
```

**Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: expand schema — add KB fields to BrandVoice + period config to Instance"
```

---

### Task 3: Add period date range utility

**Files:**
- Create: `intelligence-hub-api/src/lib/periods.ts`

**Step 1: Create the utility**

```typescript
export type PeriodType = 'WEEKLY' | 'MONTHLY';

interface PeriodRange {
  start: Date;
  end: Date;
  periodNumber: number;
  year: number;
}

export function getCurrentPeriodRange(periodType: PeriodType): PeriodRange {
  const now = new Date();
  const year = now.getFullYear();

  if (periodType === 'MONTHLY') {
    const start = new Date(year, now.getMonth(), 1);
    const end = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end, periodNumber: now.getMonth() + 1, year };
  }

  // WEEKLY — ISO week (Monday to Sunday)
  const day = now.getDay() || 7; // Convert Sunday=0 to 7
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // ISO week number
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return { start: monday, end: sunday, periodNumber: weekNumber, year };
}
```

**Step 2: Commit**

```bash
git add src/lib/periods.ts
git commit -m "feat: add period date range utility (weekly/monthly)"
```

---

### Task 4: Update Corpus Builder — filter inputs by period

**Files:**
- Modify: `intelligence-hub-api/src/agents/corpusBuilder.ts`
- Modify: `intelligence-hub-api/src/orchestrator.ts`

**Step 1: Update corpusBuilder to accept period range**

Replace the function signature and input query:

```typescript
import { prisma } from '../lib/prisma';
import { callSonnet } from '../lib/claude';

const CORPUS_SYSTEM_PROMPT = `...`; // unchanged

export async function runCorpusBuilder(
  instanceId: string,
  weekNumber: number,
  year: number,
  periodStart: Date,
  periodEnd: Date,
) {
  console.log(`[CorpusBuilder] Processing inputs for instance ${instanceId}, period ${weekNumber}/${year}`);

  // Get all inputs uploaded within the current period
  const allInputs = await prisma.inputFile.findMany({
    where: {
      instanceId,
      uploadedAt: { gte: periodStart, lte: periodEnd },
    },
    orderBy: { uploadedAt: 'asc' },
  });

  const pendingInputs = allInputs.filter((i) => i.status === 'PENDING');

  if (allInputs.length === 0) {
    console.log('[CorpusBuilder] No inputs found in current period');
    return null;
  }

  if (pendingInputs.length === 0) {
    console.log('[CorpusBuilder] No new pending inputs in current period');
    return null;
  }

  console.log(`[CorpusBuilder] Found ${allInputs.length} total inputs (${pendingInputs.length} new)`);

  // Build the user prompt with ALL inputs from the period
  const inputTexts = allInputs.map((input) =>
    `--- ${input.type}: ${input.filename} ---\n${input.content}`
  ).join('\n\n');

  const userPrompt = `Procesa los siguientes ${allInputs.length} inputs de este periodo y extrae informacion estructurada:\n\n${inputTexts}`;

  const result = await callSonnet(CORPUS_SYSTEM_PROMPT, userPrompt, 8192);

  const corpus = await prisma.weeklyCorpus.upsert({
    where: {
      instanceId_weekNumber_year: { instanceId, weekNumber, year },
    },
    update: {
      summary: result.summary as any ?? {},
      topics: result.topics as any ?? [],
      decisions: result.decisions as any ?? [],
      concerns: result.concerns as any ?? [],
      opportunities: result.opportunities as any ?? [],
    },
    create: {
      instanceId, weekNumber, year,
      summary: result.summary as any ?? {},
      topics: result.topics as any ?? [],
      decisions: result.decisions as any ?? [],
      concerns: result.concerns as any ?? [],
      opportunities: result.opportunities as any ?? [],
    },
  });

  // Mark only the pending inputs as processed
  await prisma.inputFile.updateMany({
    where: { id: { in: pendingInputs.map((i) => i.id) } },
    data: { status: 'PROCESSED', processedAt: new Date() },
  });

  console.log(`[CorpusBuilder] Created corpus with ${(result.topics as any[])?.length ?? 0} topics`);
  return corpus;
}
```

**Step 2: Update orchestrator to pass period info**

In `orchestrator.ts`, update the beginning of `runOrchestrator`:

```typescript
import { getCurrentPeriodRange } from './lib/periods';

export async function runOrchestrator(instanceId: string, runId: string) {
  // Get instance config for processing period
  const instance = await prisma.instance.findUnique({ where: { id: instanceId } });
  if (!instance) throw new Error(`Instance ${instanceId} not found`);

  const periodType = (instance as any).processingPeriod || 'WEEKLY';
  const period = getCurrentPeriodRange(periodType);
  const weekNumber = period.periodNumber;
  const year = period.year;

  // ... rest of the function stays the same except:
  // Change the corpus builder call to pass period range:
  const newCorpus = await runCorpusBuilder(instanceId, weekNumber, year, period.start, period.end);
```

**Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add src/agents/corpusBuilder.ts src/orchestrator.ts src/lib/periods.ts
git commit -m "feat: filter inputs by configurable period (weekly/monthly)"
```

---

### Task 5: Create Distillation Agent

**Files:**
- Create: `intelligence-hub-api/src/agents/distillation.ts`

**Step 1: Create the agent**

```typescript
import { prisma } from '../lib/prisma';
import { callOpus } from '../lib/claude';

const DISTILLATION_SYSTEM_PROMPT = `Eres un analista de inteligencia personal experto. Tu trabajo es actualizar el perfil base de un Digital Twin (representacion digital de un CEO o lider) basandote en nuevos datos semanales.

Recibes:
1. PERFIL BASE ACTUAL — La representacion acumulada de quien es esta persona
2. CORPUS NUEVO — Informacion fresca extraida de inputs recientes
3. CAMPOS BLOQUEADOS — Campos que el equipo edito manualmente y NO debes modificar

Tu tarea es actualizar el perfil base con la nueva informacion:

REGLAS:
- NUNCA modificar campos que estan en la lista de bloqueados
- Para temas (topics): actualizar posiciones si cambiaron, agregar nuevos, mantener existentes
- Para contactos: agregar nuevos mencionados, actualizar frecuencia de existentes
- Para narrativas: detectar proyectos/iniciativas activas, marcar inactivas si dejaron de mencionarse
- La posicion MAS RECIENTE siempre gana sobre la anterior (ultimo gana)
- Ser especifico y concreto, no generico
- Mantener consistencia con la identidad y voz existente

FORMATO DE RESPUESTA (JSON estricto):
{
  "updatedFields": {
    "identity": "identidad actualizada (o null si no cambio o esta bloqueado)",
    "valueProposition": "propuesta actualizada (o null si no cambio o esta bloqueado)",
    "audience": "audiencia actualizada (o null si no cambio o esta bloqueado)",
    "positioning": "posicionamiento actualizado (o null si no cambio o esta bloqueado)",
    "voiceTone": { "adjectives": [], "examples": [], "antiPatterns": [] },
    "recurringTopics": ["temas recurrentes actualizados"]
  },
  "topics": [
    { "name": "nombre", "position": "posicion/opinion actual", "evidence": "de donde viene", "status": "active|cooling" }
  ],
  "contacts": [
    { "name": "nombre", "company": "empresa", "context": "relacion/contexto", "frequency": "high|medium|low" }
  ],
  "narratives": [
    { "name": "nombre del proyecto/iniciativa", "status": "active|completed|stalled", "context": "contexto actual", "startedWeek": "semana en que se detecto" }
  ],
  "weeklyInsight": {
    "summary": "resumen del insight de este periodo",
    "newPatterns": ["patron nuevo detectado"],
    "recommendations": "recomendacion para el siguiente periodo"
  }
}`;

export async function runDistillationAgent(instanceId: string, weekNumber: number, year: number) {
  console.log(`[Distillation] Updating KB for instance ${instanceId}, period ${weekNumber}/${year}`);

  const brandVoice = await prisma.brandVoice.findUnique({ where: { instanceId } });
  if (!brandVoice) {
    console.log('[Distillation] No brand voice / KB found, skipping');
    return null;
  }

  const corpus = await prisma.weeklyCorpus.findUnique({
    where: { instanceId_weekNumber_year: { instanceId, weekNumber, year } },
  });
  if (!corpus) {
    console.log('[Distillation] No corpus found, skipping');
    return null;
  }

  const lockedFields = (brandVoice.lockedFields as Record<string, boolean>) || {};
  const currentTopics = (brandVoice as any).topics || [];
  const currentContacts = (brandVoice as any).contacts || [];
  const currentNarratives = (brandVoice as any).narratives || [];

  const userPrompt = `PERFIL BASE ACTUAL:
${JSON.stringify({
    identity: brandVoice.identity,
    valueProposition: brandVoice.valueProposition,
    audience: brandVoice.audience,
    voiceTone: brandVoice.voiceTone,
    recurringTopics: brandVoice.recurringTopics,
    positioning: brandVoice.positioning,
    topics: currentTopics,
    contacts: currentContacts,
    narratives: currentNarratives,
  }, null, 2)}

CORPUS NUEVO (Periodo ${weekNumber}, ${year}):
${JSON.stringify({
    summary: corpus.summary,
    topics: corpus.topics,
    decisions: corpus.decisions,
    concerns: corpus.concerns,
    opportunities: corpus.opportunities,
  }, null, 2)}

CAMPOS BLOQUEADOS (NO modificar):
${JSON.stringify(Object.entries(lockedFields).filter(([, v]) => v).map(([k]) => k))}

Actualiza el perfil base del Digital Twin con la nueva informacion.`;

  const result = await callOpus(DISTILLATION_SYSTEM_PROMPT, userPrompt, 8192);

  // Build update data, respecting locked fields
  const updateData: Record<string, any> = {};
  const updatedFields = result.updatedFields as any;

  if (updatedFields) {
    const textFields = ['identity', 'valueProposition', 'audience', 'positioning'] as const;
    for (const field of textFields) {
      if (updatedFields[field] && !lockedFields[field]) {
        updateData[field] = updatedFields[field];
      }
    }
    if (updatedFields.voiceTone && !lockedFields['voiceTone']) {
      updateData.voiceTone = updatedFields.voiceTone;
    }
    if (updatedFields.recurringTopics && !lockedFields['recurringTopics']) {
      updateData.recurringTopics = updatedFields.recurringTopics;
    }
  }

  // Update KB-specific fields (topics, contacts, narratives)
  if (result.topics) updateData.topics = result.topics;
  if (result.contacts) updateData.contacts = result.contacts;
  if (result.narratives) updateData.narratives = result.narratives;

  // Add weekly insight to history
  const currentHistory = (brandVoice.insightHistory as any[]) || [];
  const weeklyInsight = result.weeklyInsight as any;
  if (weeklyInsight) {
    updateData.insightHistory = [
      ...currentHistory,
      { weekNumber, year, ...weeklyInsight },
    ];
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.brandVoice.update({
      where: { instanceId },
      data: updateData,
    });
    console.log('[Distillation] KB updated successfully');
  } else {
    console.log('[Distillation] No updates needed');
  }

  return result;
}
```

**Step 2: Commit**

```bash
git add src/agents/distillation.ts
git commit -m "feat: add Distillation Agent (Opus) for KB profile base updates"
```

---

### Task 6: Update orchestrator — add distillation step + feed full KB to agents

**Files:**
- Modify: `intelligence-hub-api/src/orchestrator.ts`

**Step 1: Add distillation step between corpus and content**

The new orchestrator flow:
1. Corpus Builder (Sonnet) — unchanged
2. Distillation (Opus) — NEW, replaces old BrandVoice agent
3. Content + Insights (Opus) — now receives full KB context
4. Distribution (Sonnet) — unchanged

Replace the orchestrator function with:

```typescript
import { prisma } from './lib/prisma';
import { runCorpusBuilder } from './agents/corpusBuilder';
import { runDistillationAgent } from './agents/distillation';
import { runContentAgent } from './agents/content';
import { runInsightsAgent } from './agents/insights';
import { runDistributionAgent } from './agents/distribution';
import { getCurrentPeriodRange } from './lib/periods';

async function updateStep(runId: string, step: string, status: string) {
  const run = await prisma.processingRun.findUnique({ where: { id: runId } });
  if (!run) return;
  const steps = (run.steps as Record<string, string>) ?? {};
  steps[step] = status;
  await prisma.processingRun.update({
    where: { id: runId },
    data: { steps },
  });
}

export async function runOrchestrator(instanceId: string, runId: string) {
  const instance = await prisma.instance.findUnique({ where: { id: instanceId } });
  if (!instance) throw new Error(`Instance ${instanceId} not found`);

  const periodType = (instance as any).processingPeriod || 'WEEKLY';
  const period = getCurrentPeriodRange(periodType);
  const weekNumber = period.periodNumber;
  const year = period.year;

  console.log(`\n========================================`);
  console.log(`[Orchestrator] Starting processing for instance ${instanceId}`);
  console.log(`[Orchestrator] Period ${weekNumber}, Year ${year} (${periodType})`);
  console.log(`========================================\n`);

  try {
    // Step 1: Corpus Builder (Sonnet)
    await updateStep(runId, 'corpus', 'running');
    console.log('\n--- Step 1: Corpus Builder ---');
    const newCorpus = await runCorpusBuilder(instanceId, weekNumber, year, period.start, period.end);

    const existingCorpus = !newCorpus ? await prisma.weeklyCorpus.findUnique({
      where: { instanceId_weekNumber_year: { instanceId, weekNumber, year } },
    }) : newCorpus;

    await updateStep(runId, 'corpus', newCorpus ? 'completed' : existingCorpus ? 'reused' : 'skipped');

    if (!existingCorpus) {
      console.log('[Orchestrator] No corpus available. Completing run.');
      await prisma.processingRun.update({
        where: { id: runId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      return;
    }

    // Step 2: Distillation (Opus) — replaces old BrandVoice agent
    await updateStep(runId, 'distillation', 'running');
    console.log('\n--- Step 2: Distillation (KB Update) ---');
    await runDistillationAgent(instanceId, weekNumber, year);
    await updateStep(runId, 'distillation', 'completed');

    // Step 3: Content + Insights (Opus, parallel)
    await updateStep(runId, 'content', 'running');
    await updateStep(runId, 'insights', 'running');
    console.log('\n--- Step 3: Content + Insights (parallel) ---');

    const [contentResults, insightsResult] = await Promise.all([
      runContentAgent(instanceId, weekNumber, year).catch((e) => {
        console.error('[Orchestrator] Content agent failed:', e.message);
        return null;
      }),
      runInsightsAgent(instanceId, weekNumber, year).catch((e) => {
        console.error('[Orchestrator] Insights agent failed:', e.message);
        return null;
      }),
    ]);

    await updateStep(runId, 'content', contentResults ? 'completed' : 'failed');
    await updateStep(runId, 'insights', insightsResult ? 'completed' : 'failed');

    // Step 4: Distribution (Sonnet)
    await updateStep(runId, 'distribution', 'running');
    console.log('\n--- Step 4: Distribution ---');
    await runDistributionAgent(instanceId, weekNumber, year);
    await updateStep(runId, 'distribution', 'completed');

    await prisma.processingRun.update({
      where: { id: runId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    console.log(`\n========================================`);
    console.log(`[Orchestrator] Processing COMPLETED for instance ${instanceId}`);
    console.log(`========================================\n`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Orchestrator] Fatal error:', errorMsg);

    const currentRun = await prisma.processingRun.findUnique({ where: { id: runId } });
    const currentSteps = (currentRun?.steps as Record<string, string>) ?? {};
    await prisma.processingRun.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        steps: { ...currentSteps, error: errorMsg },
      },
    });
    throw error;
  }
}
```

**Step 2: Commit**

```bash
git add src/orchestrator.ts
git commit -m "feat: orchestrator uses distillation instead of brandVoice, period-aware"
```

---

### Task 7: Update Content Agent — feed full KB context

**Files:**
- Modify: `intelligence-hub-api/src/agents/content.ts`

**Step 1: Update content agent to read full KB + active memory**

Change the beginning of `runContentAgent` to fetch full KB context:

```typescript
// Get full KB (brand voice / profile base)
const brandVoice = await prisma.brandVoice.findUnique({ where: { instanceId } });
const corpus = await prisma.weeklyCorpus.findUnique({
  where: { instanceId_weekNumber_year: { instanceId, weekNumber, year } },
});

if (!brandVoice || !corpus) {
  console.log('[ContentAgent] Missing KB or corpus, skipping');
  return [];
}

// Get active memory (last N periods)
const instance = await prisma.instance.findUnique({ where: { id: instanceId } });
const activeWindow = (instance as any)?.activeWindow ?? 8;
const recentCorpuses = await prisma.weeklyCorpus.findMany({
  where: { instanceId },
  orderBy: { createdAt: 'desc' },
  take: activeWindow,
});

const brandVoiceData = {
  identity: brandVoice.identity,
  valueProposition: brandVoice.valueProposition,
  audience: brandVoice.audience,
  voiceTone: brandVoice.voiceTone,
  recurringTopics: brandVoice.recurringTopics,
  positioning: brandVoice.positioning,
  topics: (brandVoice as any).topics || [],
  contacts: (brandVoice as any).contacts || [],
  narratives: (brandVoice as any).narratives || [],
};

const corpusData = {
  current: {
    summary: corpus.summary,
    topics: corpus.topics,
    decisions: corpus.decisions,
    concerns: corpus.concerns,
    opportunities: corpus.opportunities,
  },
  activeMemory: recentCorpuses.map((c) => ({
    period: c.weekNumber,
    year: c.year,
    summary: c.summary,
    topics: c.topics,
  })),
};
```

The rest of the function (skill calls, content creation) stays the same. The skills will now receive richer context through `brandVoiceData` and `corpusData`.

**Step 2: Do the same for Insights Agent**

In `intelligence-hub-api/src/agents/insights.ts`, update to pass full KB:

```typescript
// After getting brandVoice and corpus, also get active memory:
const instance = await prisma.instance.findUnique({ where: { id: instanceId } });
const activeWindow = (instance as any)?.activeWindow ?? 8;
const recentCorpuses = await prisma.weeklyCorpus.findMany({
  where: { instanceId },
  orderBy: { createdAt: 'desc' },
  take: activeWindow,
});

// Update the userPrompt to include active memory:
const userPrompt = `PERFIL BASE (DIGITAL TWIN):
${JSON.stringify({
    identity: brandVoice.identity,
    positioning: brandVoice.positioning,
    recurringTopics: brandVoice.recurringTopics,
    topics: (brandVoice as any).topics || [],
    narratives: (brandVoice as any).narratives || [],
    insightHistory: (brandVoice.insightHistory as any[])?.slice(-4) ?? [],
  }, null, 2)}

CORPUS ACTUAL:
${JSON.stringify({
    summary: corpus.summary,
    topics: corpus.topics,
    decisions: corpus.decisions,
    concerns: corpus.concerns,
    opportunities: corpus.opportunities,
  }, null, 2)}

MEMORIA ACTIVA (ultimos ${recentCorpuses.length} periodos):
${JSON.stringify(recentCorpuses.map((c) => ({
    period: c.weekNumber, year: c.year,
    summary: c.summary, topics: c.topics,
  })), null, 2)}

Genera el reporte de inteligencia. Usa la memoria activa para detectar tendencias y cambios.`;
```

**Step 3: Commit**

```bash
git add src/agents/content.ts src/agents/insights.ts
git commit -m "feat: content + insights agents now consume full KB with active memory"
```

---

### Task 8: Update frontend types + BrandVoice service

**Files:**
- Modify: `intelligence-hub-app/src/lib/types.ts`
- Modify: `intelligence-hub-api/src/services/brandVoice.service.ts`

**Step 1: Update frontend BrandVoice type**

In `intelligence-hub-app/src/lib/types.ts`, update the BrandVoice interface:

```typescript
export interface BrandVoice {
  id: string;
  instanceId: string;
  identity: string;
  valueProposition: string;
  audience: string;
  voiceTone: { adjectives: string[]; examples: string[]; antiPatterns: string[] };
  recurringTopics: string[];
  positioning: string;
  metrics: string;
  insightHistory?: Record<string, unknown>;
  topics: { name: string; position: string; evidence: string; status: string; locked?: boolean }[];
  contacts: { name: string; company: string; context: string; frequency: string; locked?: boolean }[];
  narratives: { name: string; status: string; context: string; startedWeek?: string; locked?: boolean }[];
  lockedFields: Record<string, boolean>;
  updatedAt: string;
}
```

Add Instance config type:

```typescript
export interface Instance {
  id: string;
  name: string;
  clientName: string;
  clientRole: string;
  company: string;
  industry: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  processingPeriod?: "WEEKLY" | "MONTHLY";
  activeWindow?: number;
  createdAt: string;
  _count?: {
    inputs: number;
    content: number;
  };
}
```

**Step 2: Update BrandVoice service to handle locked fields**

In `intelligence-hub-api/src/services/brandVoice.service.ts`:

```typescript
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export class BrandVoiceService {
  static async get(instanceId: string) {
    const brandVoice = await prisma.brandVoice.findUnique({
      where: { instanceId },
    });
    if (!brandVoice) {
      throw new AppError(404, 'Brand voice not found');
    }
    return brandVoice;
  }

  static async update(
    instanceId: string,
    data: Partial<{
      identity: string;
      valueProposition: string;
      audience: string;
      voiceTone: any;
      recurringTopics: any;
      positioning: string;
      metrics: string;
      insightHistory: any;
      topics: any;
      contacts: any;
      narratives: any;
      lockedFields: any;
    }>,
  ) {
    const brandVoice = await prisma.brandVoice.update({
      where: { instanceId },
      data,
    });
    return brandVoice;
  }
}
```

**Step 3: Commit**

```bash
cd /c/proyectos/Inteligence-hub
git add intelligence-hub-app/src/lib/types.ts intelligence-hub-api/src/services/brandVoice.service.ts
git commit -m "feat: update types and service for expanded KB fields"
```

---

### Task 9: Update frontend — ProcessingTimeline step labels

**Files:**
- Modify: `intelligence-hub-app/src/lib/processing.ts`

**Step 1: Update step labels for the new pipeline**

The pipeline changed from `brandVoice` step to `distillation`. Update the labels:

```typescript
export const STEP_ORDER = ["corpus", "distillation", "content", "insights", "distribution"] as const;

export const STEP_LABELS: Record<string, string> = {
  corpus: "Corpus",
  distillation: "Destilacion",
  content: "Contenido",
  insights: "Insights",
  distribution: "Distribucion",
  // Keep old label for backward compat with existing runs
  brandVoice: "Brand Voice",
};
```

**Step 2: Commit**

```bash
git add intelligence-hub-app/src/lib/processing.ts
git commit -m "feat: update step labels — distillation replaces brandVoice"
```

---

### Task 10: Run migration on production + verify

**Step 1: Push all changes**

```bash
git push origin main
```

**Step 2: Run migration on Railway (production)**

```bash
# If Railway CLI is configured:
railway run npx prisma migrate deploy
```

**Step 3: Verify checklist**

- [ ] Opus model ID is correct in claude.ts
- [ ] Schema migration ran successfully (new fields on BrandVoice + Instance)
- [ ] Corpus Builder filters inputs by period dates
- [ ] Distillation Agent creates/updates KB profile base
- [ ] Distillation respects locked fields
- [ ] Content Agent receives full KB (profile + active memory)
- [ ] Insights Agent receives full KB
- [ ] Pipeline runs: corpus → distillation → content+insights → distribution
- [ ] Frontend step labels show "Destilacion" instead of "Brand Voice"
- [ ] Existing processing history still renders (backward compat with brandVoice step)
- [ ] Processing can run WEEKLY or MONTHLY based on instance config

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "feat: Digital Twin KB Phase 1 — complete implementation"
```

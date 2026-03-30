# Content Agents Split — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the monolithic content agent into one independent agent per platform (LinkedIn, X, TikTok, Blog) for better quality, isolation, and future multi-model support.

**Architecture:** Each platform gets its own agent file that handles generation (AI call), image generation, and DB persistence. A thin orchestrator loads shared data and dispatches agents in parallel. Skills are absorbed into agents and deleted.

**Tech Stack:** TypeScript, Prisma, Anthropic SDK (callOpus), nanoBanana (images)

---

### Task 1: Create LinkedIn Agent

**Files:**
- Create: `intelligence-hub-api/src/agents/linkedinAgent.ts`
- Reference: `intelligence-hub-api/src/skills/linkedinSkill.ts` (system prompt, types)
- Reference: `intelligence-hub-api/src/agents/content.ts:117-148` (persistence + image logic)

**Step 1: Create the agent file**

```typescript
import { prisma } from '../lib/prisma';
import { callOpus } from '../lib/claude';
import { generateImage } from '../lib/nanoBanana';

// --- Move system prompt from linkedinSkill.ts ---
const buildLinkedInSystemPrompt = (postCount: number) => `Eres un estratega de contenido experto en LinkedIn para lideres empresariales hispanohablantes.
// ... (copy entire prompt from linkedinSkill.ts lines 4-43)
`;

const buildLinkedInUserPrompt = (brandVoice: Record<string, unknown>, corpus: Record<string, unknown>, postCount: number) =>
  `VOZ DE MARCA:\n${JSON.stringify(brandVoice, null, 2)}\n\nCORPUS SEMANAL (temas, decisiones, preocupaciones, oportunidades):\n${JSON.stringify(corpus, null, 2)}\n\nGenera ${postCount} publicaciones de LinkedIn con 3 variantes cada una. Responde SOLO con JSON valido.`;

// --- Keep types from linkedinSkill.ts ---
export interface LinkedInPost {
  type: string;
  title: string;
  imagePrompt: string;
  variants: {
    A: { content: string; hook: string };
    B: { content: string; hook: string };
    C: { content: string; hook: string };
  };
}

interface LinkedInSkillOutput {
  posts: LinkedInPost[];
}

export async function runLinkedInAgent(
  instanceId: string,
  weekNumber: number,
  year: number,
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>,
  config: { postsPerPeriod: number }
): Promise<any[]> {
  console.log(`[LinkedInAgent] Generating ${config.postsPerPeriod} posts for instance ${instanceId}`);

  const systemPrompt = buildLinkedInSystemPrompt(config.postsPerPeriod);
  const userPrompt = buildLinkedInUserPrompt(brandVoice, corpus, config.postsPerPeriod);

  const result = await callOpus(systemPrompt, userPrompt) as unknown as LinkedInSkillOutput;
  const outputs: any[] = [];

  if (result?.posts) {
    for (const post of result.posts) {
      for (const variant of ['A', 'B', 'C'] as const) {
        const v = post.variants[variant];
        if (!v) continue;

        let imageUrl: string | null = null;
        try {
          const img = await generateImage(post.imagePrompt);
          imageUrl = `data:${img.mimeType};base64,${img.base64}`;
        } catch (e: any) {
          console.error('[LinkedInAgent] Image generation failed:', e.message);
        }

        const output = await prisma.contentOutput.create({
          data: {
            instanceId, weekNumber, year,
            platform: 'LINKEDIN',
            type: 'POST',
            title: post.title,
            content: v.content,
            imageUrl,
            imagePrompt: post.imagePrompt,
            variant,
            status: 'DRAFT',
          },
        });
        outputs.push(output);
      }
    }
    console.log(`[LinkedInAgent] Created ${result.posts.length * 3} variants`);
  }

  return outputs;
}
```

**Step 2: Verify it compiles**

Run: `cd intelligence-hub-api && npx tsc --noEmit`
Expected: No errors related to linkedinAgent.ts

**Step 3: Commit**

```bash
git add intelligence-hub-api/src/agents/linkedinAgent.ts
git commit -m "feat: create independent LinkedIn content agent"
```

---

### Task 2: Create X Agent

**Files:**
- Create: `intelligence-hub-api/src/agents/xAgent.ts`
- Reference: `intelligence-hub-api/src/skills/xSkill.ts` (system prompt, types)
- Reference: `intelligence-hub-api/src/agents/content.ts:151-191` (persistence logic)

**Step 1: Create the agent file**

Absorb from xSkill.ts: system prompt (lines 3-39), types (lines 50-65), user prompt builder (lines 41-48).
Absorb from content.ts: tweet persistence (lines 151-166), thread persistence with image generation (lines 167-191).

Agent signature:
```typescript
export async function runXAgent(
  instanceId: string,
  weekNumber: number,
  year: number,
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>,
  config: { postsPerPeriod: number; threadsPerPeriod: number }
): Promise<any[]>
```

Key difference from LinkedIn: handles both standalone tweets AND threads. Thread persistence joins tweets with `\n\n`. Image generation only for threads.

**Step 2: Verify it compiles**

Run: `cd intelligence-hub-api && npx tsc --noEmit`
Expected: No errors related to xAgent.ts

**Step 3: Commit**

```bash
git add intelligence-hub-api/src/agents/xAgent.ts
git commit -m "feat: create independent X content agent"
```

---

### Task 3: Create TikTok Agent

**Files:**
- Create: `intelligence-hub-api/src/agents/tiktokAgent.ts`
- Reference: `intelligence-hub-api/src/skills/tiktokSkill.ts` (system prompt, types)
- Reference: `intelligence-hub-api/src/agents/content.ts:194-211` (persistence logic)

**Step 1: Create the agent file**

Absorb from tiktokSkill.ts: system prompt (lines 3-35), types (lines 46-57), user prompt builder (lines 37-44).
Absorb from content.ts: script persistence (lines 194-211). Note: TikTok does NOT generate images (no nanoBanana call), only stores imagePrompt for thumbnails.

Agent signature:
```typescript
export async function runTikTokAgent(
  instanceId: string,
  weekNumber: number,
  year: number,
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>,
  config: { postsPerPeriod: number }
): Promise<any[]>
```

**Step 2: Verify it compiles**

Run: `cd intelligence-hub-api && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add intelligence-hub-api/src/agents/tiktokAgent.ts
git commit -m "feat: create independent TikTok content agent"
```

---

### Task 4: Create Blog Agent

**Files:**
- Create: `intelligence-hub-api/src/agents/blogAgent.ts`
- Reference: `intelligence-hub-api/src/skills/blogSkill.ts` (system prompt, types)
- Reference: `intelligence-hub-api/src/agents/content.ts:214-242` (persistence logic)

**Step 1: Create the agent file**

Absorb from blogSkill.ts: system prompt (lines 3-37), types (lines 48-63), user prompt builder (lines 39-46). Note: blog uses maxTokens 12000.
Absorb from content.ts: article persistence with image generation (lines 214-242). Blog joins sections with `## heading` format.

Agent signature:
```typescript
export async function runBlogAgent(
  instanceId: string,
  weekNumber: number,
  year: number,
  brandVoice: Record<string, unknown>,
  corpus: Record<string, unknown>,
  config: { postsPerPeriod: number }
): Promise<any[]>
```

**Step 2: Verify it compiles**

Run: `cd intelligence-hub-api && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add intelligence-hub-api/src/agents/blogAgent.ts
git commit -m "feat: create independent Blog content agent"
```

---

### Task 5: Create Content Orchestrator

**Files:**
- Create: `intelligence-hub-api/src/agents/contentOrchestrator.ts`
- Reference: `intelligence-hub-api/src/agents/content.ts:12-77` (data loading logic)

**Step 1: Create the orchestrator**

```typescript
import { prisma } from '../lib/prisma';
import { runLinkedInAgent } from './linkedinAgent';
import { runXAgent } from './xAgent';
import { runTikTokAgent } from './tiktokAgent';
import { runBlogAgent } from './blogAgent';

export async function runContentOrchestrator(instanceId: string, weekNumber: number, year: number) {
  console.log(`[ContentOrchestrator] Starting for instance ${instanceId}, week ${weekNumber}/${year}`);

  // Load shared data (from content.ts lines 12-72)
  const brandVoice = await prisma.brandVoice.findUnique({ where: { instanceId } });
  const corpus = await prisma.weeklyCorpus.findUnique({
    where: { instanceId_weekNumber_year: { instanceId, weekNumber, year } },
  });

  if (!brandVoice || !corpus) {
    console.log('[ContentOrchestrator] Missing KB or corpus, skipping');
    return [];
  }

  const instance = await prisma.instance.findUnique({ where: { id: instanceId } });
  const activeWindow = (instance as any)?.activeWindow ?? 8;

  let platformConfigs = await prisma.instancePlatformConfig.findMany({
    where: { instanceId },
  });

  if (platformConfigs.length === 0) {
    platformConfigs = [
      { platform: 'LINKEDIN', enabled: true, postsPerPeriod: 3, threadsPerPeriod: null } as any,
      { platform: 'X', enabled: true, postsPerPeriod: 2, threadsPerPeriod: 1 } as any,
      { platform: 'TIKTOK', enabled: true, postsPerPeriod: 2, threadsPerPeriod: null } as any,
      { platform: 'BLOG', enabled: true, postsPerPeriod: 1, threadsPerPeriod: null } as any,
    ];
  }

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

  // Dispatch enabled agents in parallel
  const getConfig = (platform: string) =>
    platformConfigs.find((c) => c.platform === platform);

  const tasks: Promise<any[]>[] = [];

  const linkedInConfig = getConfig('LINKEDIN');
  if (linkedInConfig?.enabled) {
    tasks.push(
      runLinkedInAgent(instanceId, weekNumber, year, brandVoiceData, corpusData, {
        postsPerPeriod: linkedInConfig.postsPerPeriod,
      }).catch((e) => { console.error('[ContentOrchestrator] LinkedIn failed:', e.message); return []; })
    );
  }

  const xConfig = getConfig('X');
  if (xConfig?.enabled) {
    tasks.push(
      runXAgent(instanceId, weekNumber, year, brandVoiceData, corpusData, {
        postsPerPeriod: xConfig.postsPerPeriod,
        threadsPerPeriod: xConfig.threadsPerPeriod ?? 1,
      }).catch((e) => { console.error('[ContentOrchestrator] X failed:', e.message); return []; })
    );
  }

  const tiktokConfig = getConfig('TIKTOK');
  if (tiktokConfig?.enabled) {
    tasks.push(
      runTikTokAgent(instanceId, weekNumber, year, brandVoiceData, corpusData, {
        postsPerPeriod: tiktokConfig.postsPerPeriod,
      }).catch((e) => { console.error('[ContentOrchestrator] TikTok failed:', e.message); return []; })
    );
  }

  const blogConfig = getConfig('BLOG');
  if (blogConfig?.enabled) {
    tasks.push(
      runBlogAgent(instanceId, weekNumber, year, brandVoiceData, corpusData, {
        postsPerPeriod: blogConfig.postsPerPeriod,
      }).catch((e) => { console.error('[ContentOrchestrator] Blog failed:', e.message); return []; })
    );
  }

  const results = await Promise.all(tasks);
  const allOutputs = results.flat();

  console.log(`[ContentOrchestrator] Total content created: ${allOutputs.length} pieces`);
  return allOutputs;
}
```

**Step 2: Verify it compiles**

Run: `cd intelligence-hub-api && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add intelligence-hub-api/src/agents/contentOrchestrator.ts
git commit -m "feat: create content orchestrator to dispatch platform agents"
```

---

### Task 6: Update Main Orchestrator

**Files:**
- Modify: `intelligence-hub-api/src/orchestrator.ts:4` (import change)

**Step 1: Update import and usage**

Change line 4:
```typescript
// Before
import { runContentAgent } from './agents/content';
// After
import { runContentOrchestrator } from './agents/contentOrchestrator';
```

Change line 67:
```typescript
// Before
runContentAgent(instanceId, weekNumber, year).catch(...)
// After
runContentOrchestrator(instanceId, weekNumber, year).catch(...)
```

**Step 2: Verify it compiles**

Run: `cd intelligence-hub-api && npx tsc --noEmit`

**Step 3: Commit**

```bash
git add intelligence-hub-api/src/orchestrator.ts
git commit -m "refactor: wire content orchestrator into main orchestrator"
```

---

### Task 7: Delete Old Files

**Files:**
- Delete: `intelligence-hub-api/src/skills/linkedinSkill.ts`
- Delete: `intelligence-hub-api/src/skills/xSkill.ts`
- Delete: `intelligence-hub-api/src/skills/tiktokSkill.ts`
- Delete: `intelligence-hub-api/src/skills/blogSkill.ts`
- Delete: `intelligence-hub-api/src/agents/content.ts`

**Step 1: Check no other files import from deleted files**

Run: `grep -r "from.*skills/linkedinSkill\|from.*skills/xSkill\|from.*skills/tiktokSkill\|from.*skills/blogSkill\|from.*agents/content" intelligence-hub-api/src/ --include="*.ts"`

Expected: Only hits in the files being deleted (content.ts importing skills). If orchestrator.ts still imports content, Task 6 was not applied correctly.

**Step 2: Delete the files**

```bash
rm intelligence-hub-api/src/skills/linkedinSkill.ts
rm intelligence-hub-api/src/skills/xSkill.ts
rm intelligence-hub-api/src/skills/tiktokSkill.ts
rm intelligence-hub-api/src/skills/blogSkill.ts
rm intelligence-hub-api/src/agents/content.ts
```

**Step 3: Verify it compiles**

Run: `cd intelligence-hub-api && npx tsc --noEmit`
Expected: Clean compilation, no missing import errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove old monolithic content agent and skill files"
```

---

### Task 8: Final Verification

**Step 1: Full compile check**

Run: `cd intelligence-hub-api && npx tsc --noEmit`
Expected: 0 errors

**Step 2: Verify agent count and structure**

Run: `ls intelligence-hub-api/src/agents/`
Expected files:
- blogAgent.ts
- brandVoice.ts
- contentOrchestrator.ts
- corpusBuilder.ts
- distillation.ts
- distribution.ts
- insights.ts
- linkedinAgent.ts
- tiktokAgent.ts
- xAgent.ts

Run: `ls intelligence-hub-api/src/skills/`
Expected: empty directory (or no skills/ directory)

**Step 3: Verify no dangling imports**

Run: `grep -r "linkedinSkill\|xSkill\|tiktokSkill\|blogSkill\|agents/content" intelligence-hub-api/src/ --include="*.ts"`
Expected: No results

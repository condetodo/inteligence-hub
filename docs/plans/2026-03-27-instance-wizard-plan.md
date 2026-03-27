# Instance Creation Wizard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the flat instance creation form with a 4-step wizard (Profile → Platforms → Processing → Summary) and make the content agent respect per-instance platform configuration.

**Architecture:** New Prisma model `InstancePlatformConfig` stores which platforms are enabled and content quantities per instance. Frontend wizard is a single page with step state. Content agent reads config and only runs enabled skills with configured quantities.

**Tech Stack:** Next.js (App Router), Prisma, Express, Tailwind CSS, Zod

---

## Task 1: Add InstancePlatformConfig to Prisma Schema

**Files:**
- Modify: `intelligence-hub-api/prisma/schema.prisma:84-103`

**Step 1: Add Platform enum and InstancePlatformConfig model**

Add after the `ProcessingPeriod` enum (around line 13):

```prisma
enum Platform {
  LINKEDIN
  X
  TIKTOK
  BLOG
}
```

Add after Instance model (after line 103):

```prisma
model InstancePlatformConfig {
  id               String   @id @default(cuid())
  instance         Instance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  instanceId       String
  platform         Platform
  enabled          Boolean  @default(true)
  postsPerPeriod   Int      @default(3)
  threadsPerPeriod Int?

  @@unique([instanceId, platform])
}
```

Add relation to Instance model:

```prisma
model Instance {
  // ... existing fields ...
  platformConfigs InstancePlatformConfig[]
}
```

**Step 2: Push schema to DB**

```bash
cd intelligence-hub-api
npx prisma db push
```

Use the production DATABASE_URL: `postgresql://postgres:XHygZebeTOYsqjzxpefwRYoKNsqyfRbk@switchback.proxy.rlwy.net:50643/railway`

**Step 3: Commit**

```bash
git add intelligence-hub-api/prisma/schema.prisma
git commit -m "feat: add InstancePlatformConfig model to schema"
```

---

## Task 2: Update Instance Creation Backend

**Files:**
- Modify: `intelligence-hub-api/src/routes/instances.routes.ts:9-15`
- Modify: `intelligence-hub-api/src/services/instances.service.ts:6-25`

**Step 1: Update Zod validation schema**

In `routes/instances.routes.ts`, replace `createInstanceSchema` (lines 9-15):

```typescript
const platformConfigSchema = z.object({
  platform: z.enum(['LINKEDIN', 'X', 'TIKTOK', 'BLOG']),
  enabled: z.boolean(),
  postsPerPeriod: z.number().int().min(1).max(5),
  threadsPerPeriod: z.number().int().min(0).max(2).nullable().optional(),
});

const createInstanceSchema = z.object({
  name: z.string().min(1),
  clientName: z.string().min(1),
  clientRole: z.string().min(1),
  company: z.string().min(1),
  industry: z.string().min(1),
  processingPeriod: z.enum(['WEEKLY', 'MONTHLY']).optional(),
  activeWindow: z.number().int().min(4).max(16).optional(),
  platforms: z.array(platformConfigSchema).optional(),
});
```

**Step 2: Update InstancesService.create**

In `services/instances.service.ts`, replace the `create` method (lines 6-25):

```typescript
static async create(
  userId: string,
  data: {
    name: string;
    clientName: string;
    clientRole: string;
    company: string;
    industry: string;
    processingPeriod?: string;
    activeWindow?: number;
    platforms?: Array<{
      platform: string;
      enabled: boolean;
      postsPerPeriod: number;
      threadsPerPeriod?: number | null;
    }>;
  },
) {
  const { platforms, processingPeriod, activeWindow, ...instanceData } = data;

  const defaultPlatforms = [
    { platform: 'LINKEDIN', enabled: true, postsPerPeriod: 3, threadsPerPeriod: null },
    { platform: 'X', enabled: true, postsPerPeriod: 2, threadsPerPeriod: 1 },
    { platform: 'TIKTOK', enabled: true, postsPerPeriod: 2, threadsPerPeriod: null },
    { platform: 'BLOG', enabled: true, postsPerPeriod: 1, threadsPerPeriod: null },
  ];

  const platformConfigs = platforms || defaultPlatforms;

  const instance = await prisma.instance.create({
    data: {
      ...instanceData,
      ...(processingPeriod && { processingPeriod: processingPeriod as any }),
      ...(activeWindow && { activeWindow }),
      users: { create: { userId } },
      brandVoice: { create: {} },
      platformConfigs: {
        create: platformConfigs.map((p) => ({
          platform: p.platform as any,
          enabled: p.enabled,
          postsPerPeriod: p.postsPerPeriod,
          threadsPerPeriod: p.threadsPerPeriod,
        })),
      },
    },
    include: { brandVoice: true, platformConfigs: true },
  });
  return instance;
}
```

**Step 3: Commit**

```bash
git add intelligence-hub-api/src/routes/instances.routes.ts intelligence-hub-api/src/services/instances.service.ts
git commit -m "feat: accept platform configs on instance creation"
```

---

## Task 3: Build the Wizard Frontend — Step Components

**Files:**
- Create: `intelligence-hub-app/src/components/wizard/StepIndicator.tsx`
- Create: `intelligence-hub-app/src/components/wizard/StepProfile.tsx`
- Create: `intelligence-hub-app/src/components/wizard/StepPlatforms.tsx`
- Create: `intelligence-hub-app/src/components/wizard/StepProcessing.tsx`
- Create: `intelligence-hub-app/src/components/wizard/StepSummary.tsx`

**Step 1: Create StepIndicator component**

```tsx
// StepIndicator.tsx
'use client';
import { Check } from 'lucide-react';

interface Props {
  steps: string[];
  current: number;
}

export default function StepIndicator({ steps, current }: Props) {
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i < current
                  ? 'bg-horse-black text-white'
                  : i === current
                  ? 'bg-horse-black text-white'
                  : 'bg-horse-gray-100 text-horse-gray-400'
              }`}
            >
              {i < current ? <Check size={16} /> : i + 1}
            </div>
            <span className={`text-xs mt-1.5 ${i <= current ? 'text-horse-black font-medium' : 'text-horse-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 h-px mx-2 mb-5 ${i < current ? 'bg-horse-black' : 'bg-horse-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Create StepProfile component**

```tsx
// StepProfile.tsx
'use client';

interface ProfileData {
  name: string;
  clientName: string;
  clientRole: string;
  company: string;
  industry: string;
}

interface Props {
  data: ProfileData;
  onChange: (data: ProfileData) => void;
}

const fields = [
  { key: 'name' as const, label: 'Nombre de la instancia', placeholder: 'Ej: Martín LinkedIn Q1' },
  { key: 'clientName' as const, label: 'Nombre del cliente', placeholder: 'Ej: Martín Rodríguez' },
  { key: 'clientRole' as const, label: 'Cargo / Rol', placeholder: 'Ej: CEO' },
  { key: 'company' as const, label: 'Empresa', placeholder: 'Ej: AutomatizaPYME' },
  { key: 'industry' as const, label: 'Industria', placeholder: 'Ej: Tecnología / Automatización' },
];

export default function StepProfile({ data, onChange }: Props) {
  const update = (key: keyof ProfileData, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="space-y-4 max-w-lg">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="block text-sm font-medium text-horse-gray-700 mb-1">{f.label}</label>
          <input
            value={data[f.key]}
            onChange={(e) => update(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-black transition-colors"
          />
        </div>
      ))}
    </div>
  );
}
```

**Step 3: Create StepPlatforms component**

```tsx
// StepPlatforms.tsx
'use client';
import { Linkedin, Twitter, Video, FileText } from 'lucide-react';

export interface PlatformConfig {
  platform: string;
  enabled: boolean;
  postsPerPeriod: number;
  threadsPerPeriod: number | null;
}

interface Props {
  platforms: PlatformConfig[];
  onChange: (platforms: PlatformConfig[]) => void;
}

const platformMeta: Record<string, { label: string; icon: any; color: string; hasThreads: boolean; maxPosts: number; maxThreads: number }> = {
  LINKEDIN: { label: 'LinkedIn', icon: Linkedin, color: 'text-sky-600', hasThreads: false, maxPosts: 5, maxThreads: 0 },
  X: { label: 'X / Twitter', icon: Twitter, color: 'text-gray-800', hasThreads: true, maxPosts: 5, maxThreads: 2 },
  TIKTOK: { label: 'TikTok', icon: Video, color: 'text-pink-500', hasThreads: false, maxPosts: 4, maxThreads: 0 },
  BLOG: { label: 'Blog', icon: FileText, color: 'text-orange-500', hasThreads: false, maxPosts: 3, maxThreads: 0 },
};

const contentLabel: Record<string, string> = {
  LINKEDIN: 'Posts por periodo',
  X: 'Tweets por periodo',
  TIKTOK: 'Scripts por periodo',
  BLOG: 'Artículos por periodo',
};

export default function StepPlatforms({ platforms, onChange }: Props) {
  const toggle = (idx: number) => {
    const updated = [...platforms];
    updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
    onChange(updated);
  };

  const updateField = (idx: number, field: string, value: number) => {
    const updated = [...platforms];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
      {platforms.map((p, idx) => {
        const meta = platformMeta[p.platform];
        const Icon = meta.icon;
        return (
          <div
            key={p.platform}
            className={`border rounded-xl p-4 transition-all cursor-pointer ${
              p.enabled ? 'border-horse-black bg-white' : 'border-horse-gray-200 bg-horse-gray-50 opacity-60'
            }`}
            onClick={() => toggle(idx)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon size={20} className={meta.color} />
                <span className="font-medium text-sm">{meta.label}</span>
              </div>
              <div
                className={`w-10 h-5 rounded-full transition-colors flex items-center ${
                  p.enabled ? 'bg-horse-black justify-end' : 'bg-horse-gray-200 justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full mx-0.5" />
              </div>
            </div>
            {p.enabled && (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <div>
                  <label className="text-xs text-horse-gray-500">{contentLabel[p.platform]}</label>
                  <input
                    type="number"
                    min={1}
                    max={meta.maxPosts}
                    value={p.postsPerPeriod}
                    onChange={(e) => updateField(idx, 'postsPerPeriod', Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-horse-gray-200 rounded-lg text-sm mt-1 focus:outline-none focus:border-horse-black"
                  />
                </div>
                {meta.hasThreads && (
                  <div>
                    <label className="text-xs text-horse-gray-500">Threads por periodo</label>
                    <input
                      type="number"
                      min={0}
                      max={meta.maxThreads}
                      value={p.threadsPerPeriod ?? 0}
                      onChange={(e) => updateField(idx, 'threadsPerPeriod', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-horse-gray-200 rounded-lg text-sm mt-1 focus:outline-none focus:border-horse-black"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

**Step 4: Create StepProcessing component**

```tsx
// StepProcessing.tsx
'use client';

interface ProcessingData {
  processingPeriod: 'WEEKLY' | 'MONTHLY';
  activeWindow: number;
}

interface Props {
  data: ProcessingData;
  onChange: (data: ProcessingData) => void;
}

export default function StepProcessing({ data, onChange }: Props) {
  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-horse-gray-700 mb-2">Periodo de procesamiento</label>
        <div className="flex gap-3">
          {(['WEEKLY', 'MONTHLY'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => onChange({ ...data, processingPeriod: period })}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                data.processingPeriod === period
                  ? 'bg-horse-black text-white border-horse-black'
                  : 'bg-white text-horse-gray-500 border-horse-gray-200 hover:border-horse-gray-400'
              }`}
            >
              {period === 'WEEKLY' ? 'Semanal' : 'Mensual'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-horse-gray-700 mb-1">Ventana activa</label>
        <p className="text-xs text-horse-gray-400 mb-2">
          Cuantos periodos pasados usa el AI como memoria para detectar patrones y tendencias.
        </p>
        <input
          type="number"
          min={4}
          max={16}
          value={data.activeWindow}
          onChange={(e) => onChange({ ...data, activeWindow: Number(e.target.value) })}
          className="w-24 px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-black"
        />
        <span className="text-sm text-horse-gray-400 ml-2">periodos</span>
      </div>
    </div>
  );
}
```

**Step 5: Create StepSummary component**

```tsx
// StepSummary.tsx
'use client';
import { PlatformConfig } from './StepPlatforms';
import { Pencil } from 'lucide-react';

interface Props {
  profile: { name: string; clientName: string; clientRole: string; company: string; industry: string };
  platforms: PlatformConfig[];
  processing: { processingPeriod: string; activeWindow: number };
  onEdit: (step: number) => void;
}

const platformLabels: Record<string, string> = {
  LINKEDIN: 'LinkedIn',
  X: 'X / Twitter',
  TIKTOK: 'TikTok',
  BLOG: 'Blog',
};

const contentLabels: Record<string, string> = {
  LINKEDIN: 'posts',
  X: 'tweets',
  TIKTOK: 'scripts',
  BLOG: 'articulos',
};

export default function StepSummary({ profile, platforms, processing, onEdit }: Props) {
  return (
    <div className="space-y-6 max-w-lg">
      {/* Profile */}
      <div className="border border-horse-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Perfil</h3>
          <button onClick={() => onEdit(0)} className="text-horse-gray-400 hover:text-horse-black transition-colors">
            <Pencil size={14} />
          </button>
        </div>
        <p className="text-sm text-horse-gray-600">
          {profile.clientName} · {profile.clientRole} · {profile.company} · {profile.industry}
        </p>
        <p className="text-xs text-horse-gray-400 mt-1">Instancia: {profile.name}</p>
      </div>

      {/* Platforms */}
      <div className="border border-horse-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Contenido</h3>
          <button onClick={() => onEdit(1)} className="text-horse-gray-400 hover:text-horse-black transition-colors">
            <Pencil size={14} />
          </button>
        </div>
        <div className="space-y-1">
          {platforms.map((p) => (
            <p key={p.platform} className={`text-sm ${p.enabled ? 'text-horse-gray-600' : 'text-horse-gray-300 line-through'}`}>
              {p.enabled ? '✓' : '✗'} {platformLabels[p.platform]}
              {p.enabled && (
                <span className="text-horse-gray-400">
                  {' '} — {p.postsPerPeriod} {contentLabels[p.platform]}
                  {p.threadsPerPeriod ? ` + ${p.threadsPerPeriod} threads` : ''}
                  {p.platform === 'LINKEDIN' && ' (con variantes A/B/C)'}
                </span>
              )}
            </p>
          ))}
        </div>
      </div>

      {/* Processing */}
      <div className="border border-horse-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Procesamiento</h3>
          <button onClick={() => onEdit(2)} className="text-horse-gray-400 hover:text-horse-black transition-colors">
            <Pencil size={14} />
          </button>
        </div>
        <p className="text-sm text-horse-gray-600">
          {processing.processingPeriod === 'WEEKLY' ? 'Semanal' : 'Mensual'} · Ventana activa: {processing.activeWindow} periodos
        </p>
      </div>
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add intelligence-hub-app/src/components/wizard/
git commit -m "feat: add wizard step components for instance creation"
```

---

## Task 4: Replace Instance Creation Page with Wizard

**Files:**
- Modify: `intelligence-hub-app/src/app/(app)/instances/new/page.tsx` (full rewrite)

**Step 1: Rewrite the page**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import StepIndicator from '@/components/wizard/StepIndicator';
import StepProfile from '@/components/wizard/StepProfile';
import StepPlatforms, { PlatformConfig } from '@/components/wizard/StepPlatforms';
import StepProcessing from '@/components/wizard/StepProcessing';
import StepSummary from '@/components/wizard/StepSummary';
import { useToast } from '@/components/ui/Toast';

const STEPS = ['Perfil', 'Plataformas', 'Procesamiento', 'Resumen'];

const defaultPlatforms: PlatformConfig[] = [
  { platform: 'LINKEDIN', enabled: true, postsPerPeriod: 3, threadsPerPeriod: null },
  { platform: 'X', enabled: true, postsPerPeriod: 2, threadsPerPeriod: 1 },
  { platform: 'TIKTOK', enabled: true, postsPerPeriod: 2, threadsPerPeriod: null },
  { platform: 'BLOG', enabled: true, postsPerPeriod: 1, threadsPerPeriod: null },
];

export default function NewInstancePage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [profile, setProfile] = useState({
    name: '', clientName: '', clientRole: '', company: '', industry: '',
  });
  const [platforms, setPlatforms] = useState<PlatformConfig[]>(defaultPlatforms);
  const [processing, setProcessing] = useState({ processingPeriod: 'WEEKLY' as const, activeWindow: 8 });

  const profileValid = Object.values(profile).every((v) => v.trim());
  const platformsValid = platforms.some((p) => p.enabled);

  const canNext = step === 0 ? profileValid : step === 1 ? platformsValid : true;

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const instance = await api.post<{ id: string }>('/instances', {
        ...profile,
        ...processing,
        platforms,
      });
      router.push(`/instances/${instance.id}/inputs`);
    } catch {
      toast.error('Error al crear la instancia');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-8">Nueva instancia</h1>
      <StepIndicator steps={STEPS} current={step} />

      {step === 0 && <StepProfile data={profile} onChange={setProfile} />}
      {step === 1 && <StepPlatforms platforms={platforms} onChange={setPlatforms} />}
      {step === 2 && <StepProcessing data={processing} onChange={setProcessing} />}
      {step === 3 && (
        <StepSummary profile={profile} platforms={platforms} processing={processing} onEdit={setStep} />
      )}

      <div className="flex justify-between mt-8 max-w-2xl">
        <div>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-sm text-horse-gray-500 hover:text-horse-black transition-colors"
            >
              Atras
            </button>
          )}
        </div>
        <div>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext}
              className="px-6 py-2 rounded-lg bg-horse-black text-white text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-6 py-2 rounded-lg bg-horse-black text-white text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Creando...' : 'Crear instancia'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add intelligence-hub-app/src/app/\(app\)/instances/new/page.tsx
git commit -m "feat: replace instance creation form with wizard"
```

---

## Task 5: Update Content Agent to Read Platform Config

**Files:**
- Modify: `intelligence-hub-api/src/agents/content.ts:8-30, 62-79`
- Modify: `intelligence-hub-api/src/skills/linkedinSkill.ts:6, 70`
- Modify: `intelligence-hub-api/src/skills/xSkill.ts` (similar pattern)
- Modify: `intelligence-hub-api/src/skills/tiktokSkill.ts` (similar pattern)
- Modify: `intelligence-hub-api/src/skills/blogSkill.ts` (similar pattern)

**Step 1: Update content agent to read InstancePlatformConfig**

In `content.ts`, after loading the instance (around line 12), add:

```typescript
const platformConfigs = await prisma.instancePlatformConfig.findMany({
  where: { instanceId },
});
```

Replace the `Promise.all` block (lines 62-79) with:

```typescript
const getConfig = (platform: string) =>
  platformConfigs.find((c) => c.platform === platform);

const tasks: Promise<any>[] = [];
const taskLabels: string[] = [];

const linkedInConfig = getConfig('LINKEDIN');
if (linkedInConfig?.enabled) {
  tasks.push(generateLinkedIn(brandVoiceData, corpusData, linkedInConfig.postsPerPeriod).catch((e) => { console.error('[Content] LinkedIn failed:', e); return null; }));
  taskLabels.push('LINKEDIN');
}

const xConfig = getConfig('X');
if (xConfig?.enabled) {
  tasks.push(generateX(brandVoiceData, corpusData, xConfig.postsPerPeriod, xConfig.threadsPerPeriod ?? 1).catch((e) => { console.error('[Content] X failed:', e); return null; }));
  taskLabels.push('X');
}

const tiktokConfig = getConfig('TIKTOK');
if (tiktokConfig?.enabled) {
  tasks.push(generateTikTok(brandVoiceData, corpusData, tiktokConfig.postsPerPeriod).catch((e) => { console.error('[Content] TikTok failed:', e); return null; }));
  taskLabels.push('TIKTOK');
}

const blogConfig = getConfig('BLOG');
if (blogConfig?.enabled) {
  tasks.push(generateBlog(brandVoiceData, corpusData, blogConfig.postsPerPeriod).catch((e) => { console.error('[Content] Blog failed:', e); return null; }));
  taskLabels.push('BLOG');
}

const results = await Promise.all(tasks);
const resultMap: Record<string, any> = {};
taskLabels.forEach((label, i) => { resultMap[label] = results[i]; });

const linkedIn = resultMap['LINKEDIN'] || null;
const x = resultMap['X'] || null;
const tiktok = resultMap['TIKTOK'] || null;
const blog = resultMap['BLOG'] || null;
```

**Step 2: Parametrize each skill function signature**

For `linkedinSkill.ts`, change the function to accept `count` parameter:

```typescript
export async function generateLinkedIn(
  brandVoice: any,
  corpus: any,
  postCount: number = 3,
): Promise<LinkedInSkillOutput> {
```

Update the system prompt to use `${postCount}` instead of hardcoded "3":

```typescript
const LINKEDIN_SYSTEM_PROMPT = `...Generar exactamente ${postCount} publicaciones de LinkedIn...`
```

Do the same for:
- `xSkill.ts`: add `tweetCount` and `threadCount` params
- `tiktokSkill.ts`: add `scriptCount` param
- `blogSkill.ts`: add `articleCount` param

**Step 3: Commit**

```bash
git add intelligence-hub-api/src/agents/content.ts intelligence-hub-api/src/skills/
git commit -m "feat: content agent reads platform config for quantities"
```

---

## Task 6: Update Settings Page to Show Platform Config

**Files:**
- Modify: `intelligence-hub-app/src/app/(app)/instances/[id]/settings/page.tsx`
- Modify: `intelligence-hub-api/src/services/instances.service.ts` (include platformConfigs in getById)

**Step 1: Include platformConfigs in instance fetch**

In `instances.service.ts`, find `getById` and add `platformConfigs: true` to the include.

**Step 2: Add platform config section to settings page**

After the processing config section in settings page, add a section showing current platform configuration using the same card pattern from StepPlatforms (or import StepPlatforms directly). Save changes via a new PUT endpoint or extend the existing one to accept platform config updates.

**Step 3: Commit**

```bash
git add intelligence-hub-app/src/app/\(app\)/instances/\[id\]/settings/page.tsx intelligence-hub-api/src/services/instances.service.ts
git commit -m "feat: show platform config in instance settings"
```

---

## Task 7: Handle Backward Compatibility

**Files:**
- Modify: `intelligence-hub-api/src/agents/content.ts`

**Step 1: Handle instances without platform config**

In the content agent, if `platformConfigs` is empty (old instances created before this feature), fall back to running all 4 platforms with default quantities:

```typescript
if (platformConfigs.length === 0) {
  // Legacy instance — run all platforms with defaults
  const defaults = [
    { platform: 'LINKEDIN', enabled: true, postsPerPeriod: 3, threadsPerPeriod: null },
    { platform: 'X', enabled: true, postsPerPeriod: 2, threadsPerPeriod: 1 },
    { platform: 'TIKTOK', enabled: true, postsPerPeriod: 2, threadsPerPeriod: null },
    { platform: 'BLOG', enabled: true, postsPerPeriod: 1, threadsPerPeriod: null },
  ];
  platformConfigs.push(...defaults as any);
}
```

**Step 2: Commit**

```bash
git add intelligence-hub-api/src/agents/content.ts
git commit -m "feat: backward compat for instances without platform config"
```

---

## Task 8: Push and Verify Deploy

**Step 1: Push all changes**

```bash
git push origin main
```

**Step 2: Push schema to production DB**

```bash
cd intelligence-hub-api
DATABASE_URL="postgresql://postgres:XHygZebeTOYsqjzxpefwRYoKNsqyfRbk@switchback.proxy.rlwy.net:50643/railway" npx prisma db push
```

**Step 3: Verify deploys succeed on Vercel (frontend) and Railway (backend)**

**Step 4: Test by creating a new instance through the wizard**

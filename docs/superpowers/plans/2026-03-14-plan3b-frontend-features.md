# Plan 3B: Frontend Feature Pages

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all feature pages inside an instance: Kanban Content (main page), Inputs, Insights, Brand Voice, and History. This plan assumes Plan 3A is complete (project initialized, auth working, layout with sidebar/topbar/tabs, API client ready, dashboard page done).

**Architecture:** Next.js App Router with React Server Components where possible, client components for interactivity. API calls via the `apiClient` created in Plan 3A. All pages nested under `/instances/[id]/` using the instance layout with tabs.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide React (icons), date-fns

**Spec:** `docs/superpowers/specs/2026-03-14-intelligence-hub-design.md`
**Mockup:** `mockup/index.html`

---

## Design Tokens (Tailwind `tailwind.config.ts` extension — already in Plan 3A)

```ts
colors: {
  horse: {
    black: '#1a1a1a',
    dark: '#32373c',
    bg: '#f5f5f3',
    white: '#ffffff',
    gray: { 100: '#f0f0ee', 200: '#e2e2e0', 300: '#c4c4c4', 400: '#9a9a9a', 500: '#7a7a7a', 700: '#4a4a4a' },
  },
  status: { draft: '#d4a017', review: '#2d6cce', approved: '#2a9d5c', published: '#1a1a1a' },
  platform: { linkedin: '#0a66c2', x: '#1a1a1a', tiktok: '#ff0050', blog: '#2a9d5c' },
}
```

---

## File Structure

```
intelligence-hub-app/src/
├── types/
│   └── index.ts                           ← Shared TypeScript types (add to existing)
├── lib/
│   └── weeks.ts                           ← Week number/date utilities
├── components/
│   ├── ui/
│   │   ├── PlatformBadge.tsx              ← Platform color badge (LinkedIn, X, TikTok, Blog)
│   │   ├── StatusDot.tsx                  ← Colored status dot
│   │   ├── WeekSelector.tsx               ← Week nav with prev/next arrows
│   │   └── Modal.tsx                      ← Reusable modal overlay
│   ├── content/
│   │   ├── KanbanBoard.tsx                ← 4-column kanban grid
│   │   ├── KanbanColumn.tsx               ← Single column with header + cards
│   │   ├── ContentCard.tsx                ← Card with platform badge, variant selector, actions
│   │   ├── ContentModal.tsx               ← Full post view modal
│   │   ├── PlatformFilter.tsx             ← Filter pills (All, LinkedIn, X, TikTok, Blog)
│   │   ├── ProcessingBanner.tsx           ← Last run status with step indicators
│   │   └── StatsBar.tsx                   ← 4 stat cards (draft/review/approved/published)
│   ├── inputs/
│   │   ├── InputList.tsx                  ← Table of inputs with type/status badges
│   │   └── UploadModal.tsx                ← Upload form with textarea + type dropdown
│   ├── insights/
│   │   └── InsightReport.tsx              ← Full weekly insight report display
│   ├── brand-voice/
│   │   └── BrandVoiceForm.tsx             ← Editable form with all sections
│   └── history/
│       └── ProcessingTimeline.tsx         ← Timeline of processing runs
├── app/
│   └── (dashboard)/
│       └── instances/
│           └── [id]/
│               ├── content/
│               │   └── page.tsx           ← Kanban content page
│               ├── inputs/
│               │   └── page.tsx           ← Inputs page
│               ├── insights/
│               │   └── page.tsx           ← Insights page
│               ├── brand-voice/
│               │   └── page.tsx           ← Brand voice page
│               └── history/
│                   └── page.tsx           ← History page
```

---

## Chunk 1: Shared Types + Utilities

### Task 1: TypeScript types for all models

**Files:**
- Edit: `intelligence-hub-app/src/types/index.ts`

- [ ] **Step 1: Add content, input, insight, brand voice, and processing types**

Append to existing types file:

```typescript
// Content
export type Platform = 'LINKEDIN' | 'X' | 'TIKTOK' | 'BLOG';
export type ContentStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED';
export type ContentType = 'POST' | 'THREAD' | 'SCRIPT' | 'ARTICLE';
export type Variant = 'A' | 'B' | 'C';

export interface ContentOutput {
  id: string;
  instanceId: string;
  weekNumber: number;
  year: number;
  platform: Platform;
  type: ContentType;
  title: string;
  content: string;
  imageUrl?: string | null;
  imagePrompt?: string | null;
  variant: Variant;
  status: ContentStatus;
  engagement?: Record<string, number> | null;
  createdAt: string;
}

// Inputs
export type InputType = 'WHATSAPP' | 'EMAIL' | 'AUDIO' | 'NOTE' | 'INTERVIEW';
export type InputStatus = 'PENDING' | 'PROCESSED';

export interface InputFile {
  id: string;
  instanceId: string;
  type: InputType;
  filename: string;
  content: string;
  status: InputStatus;
  uploadedAt: string;
  processedAt?: string | null;
}

// Insights
export interface InsightReport {
  id: string;
  instanceId: string;
  weekNumber: number;
  year: number;
  executiveSummary: string;
  topTopics: { topic: string; evidence: string }[];
  opportunity: string;
  evolution: string;
  questions: string[];
  recommendations: string;
  createdAt: string;
}

// Brand Voice
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
  updatedAt: string;
}

// Processing
export type RunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';
export type TriggerType = 'CRON' | 'MANUAL';

export interface ProcessingStep {
  name: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  startedAt?: string;
  completedAt?: string;
}

export interface ProcessingRun {
  id: string;
  instanceId: string;
  weekNumber: number;
  year: number;
  status: RunStatus;
  steps: ProcessingStep[];
  startedAt: string;
  completedAt?: string | null;
  triggeredBy: TriggerType;
}
```

---

### Task 2: Week utilities

**Files:**
- Create: `intelligence-hub-app/src/lib/weeks.ts`

- [ ] **Step 1: Create week helper functions**

```typescript
import { startOfISOWeek, endOfISOWeek, getISOWeek, getISOWeekYear, addWeeks, subWeeks, format } from 'date-fns';
import { es } from 'date-fns/locale';

export function getCurrentWeek() {
  const now = new Date();
  return { weekNumber: getISOWeek(now), year: getISOWeekYear(now) };
}

export function getWeekDates(year: number, weekNumber: number) {
  const jan4 = new Date(year, 0, 4);
  const weekStart = startOfISOWeek(jan4);
  const target = addWeeks(weekStart, weekNumber - 1);
  return {
    start: startOfISOWeek(target),
    end: endOfISOWeek(target),
  };
}

export function formatWeekLabel(year: number, weekNumber: number): string {
  const { start, end } = getWeekDates(year, weekNumber);
  const startStr = format(start, 'd MMM', { locale: es });
  const endStr = format(end, 'd MMM yyyy', { locale: es });
  return `Semana ${weekNumber} · ${startStr}-${endStr}`;
}

export function prevWeek(year: number, weekNumber: number) {
  const { start } = getWeekDates(year, weekNumber);
  const prev = subWeeks(start, 1);
  return { weekNumber: getISOWeek(prev), year: getISOWeekYear(prev) };
}

export function nextWeek(year: number, weekNumber: number) {
  const { start } = getWeekDates(year, weekNumber);
  const next = addWeeks(start, 1);
  return { weekNumber: getISOWeek(next), year: getISOWeekYear(next) };
}
```

- [ ] **Step 2: Install date-fns if not already installed**

```bash
cd /c/Proyectos/Inteligence-hub/intelligence-hub-app
npm install date-fns
```

- [ ] **Step 3: Commit**

```bash
git add intelligence-hub-app/src/types/ intelligence-hub-app/src/lib/weeks.ts
git commit -m "feat(app): add content/input/insight/brandvoice/processing types and week utilities"
```

---

## Chunk 2: Shared UI Components

### Task 3: PlatformBadge, StatusDot, WeekSelector, Modal

**Files:**
- Create: `intelligence-hub-app/src/components/ui/PlatformBadge.tsx`
- Create: `intelligence-hub-app/src/components/ui/StatusDot.tsx`
- Create: `intelligence-hub-app/src/components/ui/WeekSelector.tsx`
- Create: `intelligence-hub-app/src/components/ui/Modal.tsx`

- [ ] **Step 1: Create PlatformBadge**

```tsx
'use client';

import { Platform } from '@/types';

const config: Record<Platform, { label: string; icon: string; classes: string }> = {
  LINKEDIN: { label: 'LinkedIn', icon: 'in', classes: 'bg-[#0a66c2]/10 text-[#0a66c2]' },
  X: { label: 'X', icon: '𝕏', classes: 'bg-black/5 text-[#1a1a1a]' },
  TIKTOK: { label: 'TikTok', icon: '♪', classes: 'bg-[#ff0050]/10 text-[#ff0050]' },
  BLOG: { label: 'Blog', icon: '▤', classes: 'bg-[#2a9d5c]/10 text-[#2a9d5c]' },
};

export default function PlatformBadge({ platform }: { platform: Platform }) {
  const c = config[platform];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${c.classes}`}>
      {c.icon} {c.label}
    </span>
  );
}
```

- [ ] **Step 2: Create StatusDot**

```tsx
import { ContentStatus } from '@/types';

const colors: Record<ContentStatus, string> = {
  DRAFT: 'bg-status-draft',
  REVIEW: 'bg-status-review',
  APPROVED: 'bg-status-approved',
  PUBLISHED: 'bg-status-published',
};

export default function StatusDot({ status }: { status: ContentStatus }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />;
}
```

- [ ] **Step 3: Create WeekSelector**

```tsx
'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatWeekLabel, prevWeek, nextWeek } from '@/lib/weeks';

interface Props {
  year: number;
  weekNumber: number;
  onChange: (year: number, weekNumber: number) => void;
}

export default function WeekSelector({ year, weekNumber, onChange }: Props) {
  const handlePrev = () => {
    const p = prevWeek(year, weekNumber);
    onChange(p.year, p.weekNumber);
  };
  const handleNext = () => {
    const n = nextWeek(year, weekNumber);
    onChange(n.year, n.weekNumber);
  };

  return (
    <div className="flex items-center gap-3">
      <button onClick={handlePrev} className="w-7 h-7 flex items-center justify-center rounded-md border border-horse-gray-200 text-horse-gray-400 hover:border-horse-black hover:text-horse-black transition-colors">
        <ChevronLeft size={16} />
      </button>
      <span className="bg-horse-black text-white px-3.5 py-1.5 rounded-lg text-[13px] font-medium">
        {formatWeekLabel(year, weekNumber)}
      </span>
      <button onClick={handleNext} className="w-7 h-7 flex items-center justify-center rounded-md border border-horse-gray-200 text-horse-gray-400 hover:border-horse-black hover:text-horse-black transition-colors">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Create Modal**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
}

export default function Modal({ open, onClose, title, children, wide }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div ref={overlayRef} onClick={(e) => e.target === overlayRef.current && onClose()} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className={`bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto ${wide ? 'w-full max-w-3xl' : 'w-full max-w-lg'}`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-horse-gray-200">
            <h2 className="text-base font-semibold text-horse-black">{title}</h2>
            <button onClick={onClose} className="text-horse-gray-400 hover:text-horse-black"><X size={18} /></button>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Install lucide-react if not already installed**

```bash
cd /c/Proyectos/Inteligence-hub/intelligence-hub-app
npm install lucide-react
```

- [ ] **Step 6: Commit**

```bash
git add intelligence-hub-app/src/components/ui/
git commit -m "feat(app): add PlatformBadge, StatusDot, WeekSelector, and Modal UI components"
```

---

## Chunk 3: Kanban Content Page (Main Page)

### Task 4: StatsBar and ProcessingBanner

**Files:**
- Create: `intelligence-hub-app/src/components/content/StatsBar.tsx`
- Create: `intelligence-hub-app/src/components/content/ProcessingBanner.tsx`

- [ ] **Step 1: Create StatsBar**

```tsx
interface StatItem {
  label: string;
  value: number;
  colorClass: string;
}

const stats: { key: string; label: string; colorClass: string }[] = [
  { key: 'DRAFT', label: 'Borradores', colorClass: 'text-status-draft' },
  { key: 'REVIEW', label: 'En revisión', colorClass: 'text-status-review' },
  { key: 'APPROVED', label: 'Aprobados', colorClass: 'text-status-approved' },
  { key: 'PUBLISHED', label: 'Publicados', colorClass: 'text-horse-black' },
];

interface Props {
  counts: Record<string, number>;
}

export default function StatsBar({ counts }: Props) {
  return (
    <div className="flex gap-4 mb-6">
      {stats.map((s) => (
        <div key={s.key} className="bg-white border border-horse-gray-200 rounded-[10px] px-5 py-4 flex-1">
          <div className="text-xs text-horse-gray-400 font-medium mb-1">{s.label}</div>
          <div className={`text-[28px] font-bold ${s.colorClass}`}>{counts[s.key] || 0}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create ProcessingBanner**

```tsx
import { ProcessingRun } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  run: ProcessingRun | null;
  contentCount: number;
}

export default function ProcessingBanner({ run, contentCount }: Props) {
  if (!run) return null;

  const dateStr = format(new Date(run.startedAt), "EEEE d MMM, h:mma", { locale: es });

  return (
    <div className="bg-white border border-horse-gray-200 rounded-[10px] px-5 py-3.5 mb-5 flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-[13px] text-horse-gray-700">
        <span className={`w-2 h-2 rounded-full ${run.status === 'RUNNING' ? 'bg-status-review animate-pulse' : run.status === 'COMPLETED' ? 'bg-status-approved' : 'bg-red-500'}`} />
        <span>
          {run.status === 'RUNNING' ? 'Procesando...' : `Último procesamiento: ${dateStr}`}
          {run.status === 'COMPLETED' && <strong> — {contentCount} piezas generadas</strong>}
        </span>
      </div>
      <div className="flex gap-4 text-xs text-horse-gray-400">
        {run.steps.map((step) => (
          <span key={step.name} className={step.status === 'done' ? 'text-status-approved font-medium' : step.status === 'running' ? 'text-status-review font-medium' : step.status === 'failed' ? 'text-red-500 font-medium' : ''}>
            {step.status === 'done' ? '✓' : step.status === 'running' ? '◌' : step.status === 'failed' ? '✕' : '○'} {step.name}
          </span>
        ))}
      </div>
    </div>
  );
}
```

---

### Task 5: PlatformFilter

**Files:**
- Create: `intelligence-hub-app/src/components/content/PlatformFilter.tsx`

- [ ] **Step 1: Create PlatformFilter pills**

```tsx
'use client';

import { Platform } from '@/types';

const filters: { value: Platform | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'X', label: 'X' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'BLOG', label: 'Blog' },
];

interface Props {
  selected: Platform | 'ALL';
  onChange: (value: Platform | 'ALL') => void;
}

export default function PlatformFilter({ selected, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            selected === f.value
              ? 'bg-horse-black text-white border-horse-black'
              : 'border-horse-gray-200 text-horse-gray-500 hover:border-horse-dark hover:text-horse-dark'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
```

---

### Task 6: ContentCard with variant selector and actions

**Files:**
- Create: `intelligence-hub-app/src/components/content/ContentCard.tsx`

- [ ] **Step 1: Create ContentCard**

```tsx
'use client';

import { ContentOutput, Variant } from '@/types';
import PlatformBadge from '@/components/ui/PlatformBadge';
import { Check, X, Eye } from 'lucide-react';

interface Props {
  item: ContentOutput;
  siblings?: ContentOutput[]; // A/B/C variants of same content group
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onSelectVariant?: (variant: Variant, groupItems: ContentOutput[]) => void;
  onClick?: (item: ContentOutput) => void;
}

const typeLabels: Record<string, string> = {
  POST: 'Post',
  THREAD: 'Hilo',
  SCRIPT: 'Script',
  ARTICLE: 'Artículo',
};

export default function ContentCard({ item, siblings, onApprove, onReject, onSelectVariant, onClick }: Props) {
  const variants: Variant[] = ['A', 'B', 'C'];
  const hasVariants = siblings && siblings.length > 1;

  return (
    <div
      onClick={() => onClick?.(item)}
      className="bg-white border border-horse-gray-200 rounded-[10px] p-3.5 cursor-pointer transition-all hover:border-horse-gray-300 hover:shadow-md hover:-translate-y-px"
    >
      <PlatformBadge platform={item.platform} />

      {hasVariants && (
        <div className="flex gap-1 mt-2 mb-2">
          {variants.map((v) => {
            const exists = siblings.find((s) => s.variant === v);
            if (!exists) return null;
            return (
              <button
                key={v}
                onClick={(e) => { e.stopPropagation(); onSelectVariant?.(v, siblings); }}
                className={`w-6 h-6 rounded-md border text-[10px] font-semibold flex items-center justify-center transition-colors ${
                  item.variant === v
                    ? 'border-horse-black bg-horse-black text-white'
                    : 'border-horse-gray-200 text-horse-gray-400 hover:border-horse-dark'
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
      )}

      <div className="text-[13px] font-medium mb-1.5 leading-snug text-horse-black line-clamp-2">{item.title}</div>
      <div className="text-xs text-horse-gray-500 leading-relaxed mb-2.5 line-clamp-2">{item.content.slice(0, 120)}...</div>

      <div className="flex items-center justify-between text-[11px] text-horse-gray-400">
        <span className="bg-horse-gray-100 text-horse-gray-500 px-2 py-0.5 rounded text-[10px] font-medium">
          {typeLabels[item.type] || item.type}
        </span>
        <div className="flex gap-1.5">
          {(item.status === 'DRAFT' || item.status === 'REVIEW') && onApprove && (
            <button
              onClick={(e) => { e.stopPropagation(); onApprove(item.id); }}
              className="w-7 h-7 rounded-md border border-horse-gray-200 flex items-center justify-center text-horse-gray-400 hover:border-status-approved hover:text-status-approved hover:bg-[#2a9d5c]/5 transition-colors"
              title="Aprobar"
            >
              <Check size={14} />
            </button>
          )}
          {item.status === 'REVIEW' && onReject && (
            <button
              onClick={(e) => { e.stopPropagation(); onReject(item.id); }}
              className="w-7 h-7 rounded-md border border-horse-gray-200 flex items-center justify-center text-horse-gray-400 hover:border-red-400 hover:text-red-400 hover:bg-red-50 transition-colors"
              title="Rechazar"
            >
              <X size={14} />
            </button>
          )}
          {item.status === 'APPROVED' && item.engagement && (
            <span className="text-status-approved font-medium text-[11px]">
              ✓ Aprobado
            </span>
          )}
          {item.status === 'PUBLISHED' && item.engagement && (
            <span className="text-horse-black font-medium text-[11px]">
              {item.engagement.views} views · {item.engagement.reactions} reactions
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### Task 7: KanbanColumn and KanbanBoard

**Files:**
- Create: `intelligence-hub-app/src/components/content/KanbanColumn.tsx`
- Create: `intelligence-hub-app/src/components/content/KanbanBoard.tsx`

- [ ] **Step 1: Create KanbanColumn**

```tsx
import { ContentOutput, ContentStatus, Variant } from '@/types';
import StatusDot from '@/components/ui/StatusDot';
import ContentCard from './ContentCard';

const columnLabels: Record<ContentStatus, string> = {
  DRAFT: 'Borrador',
  REVIEW: 'En revisión',
  APPROVED: 'Aprobado',
  PUBLISHED: 'Publicado',
};

interface Props {
  status: ContentStatus;
  items: ContentOutput[];
  allItems: ContentOutput[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onSelectVariant?: (variant: Variant, groupItems: ContentOutput[]) => void;
  onCardClick?: (item: ContentOutput) => void;
}

export default function KanbanColumn({ status, items, allItems, onApprove, onReject, onSelectVariant, onCardClick }: Props) {
  // Group by platform+title to find variant siblings
  const getSiblings = (item: ContentOutput) =>
    allItems.filter((i) => i.platform === item.platform && i.title === item.title && i.status === item.status);

  return (
    <div className="bg-white border border-horse-gray-200 rounded-xl min-h-[500px]">
      <div className="px-4 py-3.5 border-b border-horse-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-horse-dark">
          <StatusDot status={status} />
          {columnLabels[status]}
        </div>
        <span className="bg-horse-gray-100 text-horse-gray-500 px-2 py-0.5 rounded-full text-[11px] font-semibold">
          {items.length}
        </span>
      </div>
      <div className="p-3 flex flex-col gap-2.5">
        {items.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            siblings={getSiblings(item)}
            onApprove={onApprove}
            onReject={onReject}
            onSelectVariant={onSelectVariant}
            onClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create KanbanBoard**

```tsx
'use client';

import { ContentOutput, ContentStatus, Variant } from '@/types';
import KanbanColumn from './KanbanColumn';

const columns: ContentStatus[] = ['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED'];

interface Props {
  items: ContentOutput[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onSelectVariant?: (variant: Variant, groupItems: ContentOutput[]) => void;
  onCardClick?: (item: ContentOutput) => void;
}

export default function KanbanBoard({ items, onApprove, onReject, onSelectVariant, onCardClick }: Props) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          items={items.filter((i) => i.status === status)}
          allItems={items}
          onApprove={onApprove}
          onReject={onReject}
          onSelectVariant={onSelectVariant}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
}
```

---

### Task 8: ContentModal

**Files:**
- Create: `intelligence-hub-app/src/components/content/ContentModal.tsx`

- [ ] **Step 1: Create ContentModal with copy/download**

```tsx
'use client';

import { useState } from 'react';
import { ContentOutput } from '@/types';
import Modal from '@/components/ui/Modal';
import PlatformBadge from '@/components/ui/PlatformBadge';
import { Copy, Download, Check } from 'lucide-react';

interface Props {
  item: ContentOutput | null;
  open: boolean;
  onClose: () => void;
}

export default function ContentModal({ item, open, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    if (!item.imageUrl) return;
    const a = document.createElement('a');
    a.href = item.imageUrl;
    a.download = `${item.title.slice(0, 40).replace(/\s+/g, '-')}.png`;
    a.click();
  };

  return (
    <Modal open={open} onClose={onClose} title={item.title} wide>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <PlatformBadge platform={item.platform} />
          <span className="bg-horse-gray-100 text-horse-gray-500 px-2 py-0.5 rounded text-[10px] font-medium uppercase">{item.type}</span>
          <span className="text-horse-gray-400 text-xs">Variante {item.variant}</span>
        </div>

        {item.imageUrl && (
          <div className="relative rounded-lg overflow-hidden border border-horse-gray-200">
            <img src={item.imageUrl} alt={item.title} className="w-full object-cover max-h-80" />
          </div>
        )}

        <div className="whitespace-pre-wrap text-sm text-horse-black leading-relaxed bg-horse-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
          {item.content}
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-horse-black text-white text-sm font-medium hover:bg-black transition-colors">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copiado' : 'Copiar texto'}
          </button>
          {item.imageUrl && (
            <button onClick={handleDownloadImage} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-horse-gray-300 text-horse-dark text-sm font-medium hover:border-horse-black hover:text-horse-black transition-colors">
              <Download size={16} />
              Descargar imagen
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit kanban components**

```bash
git add intelligence-hub-app/src/components/content/
git commit -m "feat(app): add kanban board components — columns, cards, modal, stats, filters"
```

---

### Task 9: Content page (main Kanban page)

**Files:**
- Create: `intelligence-hub-app/src/app/(dashboard)/instances/[id]/content/page.tsx`

- [ ] **Step 1: Create the content page with all state management**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ContentOutput, ContentStatus, Platform, Variant } from '@/types';
import { getCurrentWeek } from '@/lib/weeks';
import { apiClient } from '@/lib/api';
import WeekSelector from '@/components/ui/WeekSelector';
import PlatformFilter from '@/components/content/PlatformFilter';
import StatsBar from '@/components/content/StatsBar';
import ProcessingBanner from '@/components/content/ProcessingBanner';
import KanbanBoard from '@/components/content/KanbanBoard';
import ContentModal from '@/components/content/ContentModal';
import { ProcessingRun } from '@/types';

export default function ContentPage() {
  const { id } = useParams<{ id: string }>();
  const [week, setWeek] = useState(getCurrentWeek);
  const [platform, setPlatform] = useState<Platform | 'ALL'>('ALL');
  const [items, setItems] = useState<ContentOutput[]>([]);
  const [latestRun, setLatestRun] = useState<ProcessingRun | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentOutput | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        week: String(week.weekNumber),
        year: String(week.year),
      };
      if (platform !== 'ALL') params.platform = platform;

      const [contentRes, runsRes] = await Promise.all([
        apiClient.get(`/instances/${id}/content`, { params }),
        apiClient.get(`/instances/${id}/runs`, { params: { limit: '1' } }),
      ]);
      setItems(contentRes.data);
      setLatestRun(runsRes.data[0] || null);
    } catch (err) {
      console.error('Failed to fetch content:', err);
    } finally {
      setLoading(false);
    }
  }, [id, week, platform]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const handleStatusChange = async (contentId: string, newStatus: ContentStatus) => {
    try {
      await apiClient.patch(`/instances/${id}/content/${contentId}`, { status: newStatus });
      setItems((prev) => prev.map((i) => i.id === contentId ? { ...i, status: newStatus } : i));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleApprove = (contentId: string) => handleStatusChange(contentId, 'APPROVED');
  const handleReject = (contentId: string) => handleStatusChange(contentId, 'DRAFT');

  const handleSelectVariant = (variant: Variant, groupItems: ContentOutput[]) => {
    const target = groupItems.find((i) => i.variant === variant);
    if (target) setSelectedItem(target);
  };

  const counts: Record<string, number> = {};
  items.forEach((i) => { counts[i.status] = (counts[i.status] || 0) + 1; });

  return (
    <div className="p-6 bg-horse-bg min-h-full">
      <ProcessingBanner run={latestRun} contentCount={items.length} />
      <StatsBar counts={counts} />

      <div className="flex items-center justify-between mb-5">
        <WeekSelector year={week.year} weekNumber={week.weekNumber} onChange={(y, w) => setWeek({ year: y, weekNumber: w })} />
        <PlatformFilter selected={platform} onChange={setPlatform} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-horse-gray-400 text-sm">Cargando contenido...</div>
      ) : (
        <KanbanBoard
          items={items}
          onApprove={handleApprove}
          onReject={handleReject}
          onSelectVariant={handleSelectVariant}
          onCardClick={setSelectedItem}
        />
      )}

      <ContentModal item={selectedItem} open={!!selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add intelligence-hub-app/src/app/\(dashboard\)/instances/\[id\]/content/
git commit -m "feat(app): add kanban content page with filters, stats, week selector, and modal"
```

---

## Chunk 4: Inputs Page

### Task 10: InputList and UploadModal

**Files:**
- Create: `intelligence-hub-app/src/components/inputs/InputList.tsx`
- Create: `intelligence-hub-app/src/components/inputs/UploadModal.tsx`

- [ ] **Step 1: Create InputList**

```tsx
'use client';

import { InputFile, InputType } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Trash2 } from 'lucide-react';

const typeConfig: Record<InputType, { label: string; color: string }> = {
  WHATSAPP: { label: 'WhatsApp', color: 'bg-green-100 text-green-700' },
  EMAIL: { label: 'Email', color: 'bg-blue-100 text-blue-700' },
  AUDIO: { label: 'Audio', color: 'bg-purple-100 text-purple-700' },
  NOTE: { label: 'Nota', color: 'bg-yellow-100 text-yellow-700' },
  INTERVIEW: { label: 'Entrevista', color: 'bg-orange-100 text-orange-700' },
};

interface Props {
  inputs: InputFile[];
  onDelete?: (id: string) => void;
}

export default function InputList({ inputs, onDelete }: Props) {
  if (inputs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-horse-gray-400 text-sm">
        <FileText size={32} className="mb-3 text-horse-gray-300" />
        No hay inputs cargados
      </div>
    );
  }

  return (
    <div className="bg-white border border-horse-gray-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-horse-gray-200 text-left text-horse-gray-400 text-xs">
            <th className="px-4 py-3 font-medium">Archivo</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium w-12"></th>
          </tr>
        </thead>
        <tbody>
          {inputs.map((input) => {
            const tc = typeConfig[input.type];
            return (
              <tr key={input.id} className="border-b border-horse-gray-100 hover:bg-horse-gray-100/50 transition-colors">
                <td className="px-4 py-3 font-medium text-horse-black">{input.filename}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${tc.color}`}>{tc.label}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs ${input.status === 'PROCESSED' ? 'text-status-approved' : 'text-horse-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${input.status === 'PROCESSED' ? 'bg-status-approved' : 'bg-horse-gray-300'}`} />
                    {input.status === 'PROCESSED' ? 'Procesado' : 'Pendiente'}
                  </span>
                </td>
                <td className="px-4 py-3 text-horse-gray-400 text-xs">
                  {format(new Date(input.uploadedAt), "d MMM yyyy, HH:mm", { locale: es })}
                </td>
                <td className="px-4 py-3">
                  {onDelete && (
                    <button onClick={() => onDelete(input.id)} className="text-horse-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Create UploadModal**

```tsx
'use client';

import { useState } from 'react';
import { InputType } from '@/types';
import Modal from '@/components/ui/Modal';

const inputTypes: { value: InputType; label: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'NOTE', label: 'Nota' },
  { value: 'INTERVIEW', label: 'Entrevista' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { content: string; type: InputType; filename: string }) => Promise<void>;
}

export default function UploadModal({ open, onClose, onSubmit }: Props) {
  const [content, setContent] = useState('');
  const [type, setType] = useState<InputType>('WHATSAPP');
  const [filename, setFilename] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !filename.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ content, type, filename });
      setContent('');
      setFilename('');
      setType('WHATSAPP');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Subir input">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-horse-gray-500 mb-1.5">Nombre del archivo</label>
          <input
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="conversacion-cliente-mar2026.txt"
            className="w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-horse-gray-500 mb-1.5">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as InputType)}
            className="w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors bg-white"
          >
            {inputTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-horse-gray-500 mb-1.5">Contenido</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="Pegar el contenido del WhatsApp, email, nota, etc..."
            className="w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors resize-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-horse-gray-500 hover:text-horse-black transition-colors">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || !filename.trim() || submitting}
            className="px-4 py-2 rounded-lg bg-horse-black text-white text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Subiendo...' : 'Subir input'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

---

### Task 11: Inputs page

**Files:**
- Create: `intelligence-hub-app/src/app/(dashboard)/instances/[id]/inputs/page.tsx`

- [ ] **Step 1: Create inputs page**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { InputFile, InputType } from '@/types';
import { apiClient } from '@/lib/api';
import InputList from '@/components/inputs/InputList';
import UploadModal from '@/components/inputs/UploadModal';
import { Upload } from 'lucide-react';

export default function InputsPage() {
  const { id } = useParams<{ id: string }>();
  const [inputs, setInputs] = useState<InputFile[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInputs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/instances/${id}/inputs`);
      setInputs(res.data);
    } catch (err) {
      console.error('Failed to fetch inputs:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchInputs(); }, [fetchInputs]);

  const handleUpload = async (data: { content: string; type: InputType; filename: string }) => {
    await apiClient.post(`/instances/${id}/inputs`, data);
    await fetchInputs();
  };

  const handleDelete = async (inputId: string) => {
    await apiClient.delete(`/instances/${id}/inputs/${inputId}`);
    setInputs((prev) => prev.filter((i) => i.id !== inputId));
  };

  return (
    <div className="p-6 bg-horse-bg min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-horse-black">Inputs</h2>
          <p className="text-sm text-horse-gray-400 mt-0.5">{inputs.length} archivos cargados</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-horse-black text-white text-sm font-medium hover:bg-black transition-colors"
        >
          <Upload size={16} />
          Subir input
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-horse-gray-400 text-sm">Cargando inputs...</div>
      ) : (
        <InputList inputs={inputs} onDelete={handleDelete} />
      )}

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onSubmit={handleUpload} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add intelligence-hub-app/src/components/inputs/ intelligence-hub-app/src/app/\(dashboard\)/instances/\[id\]/inputs/
git commit -m "feat(app): add inputs page with upload modal and input list"
```

---

## Chunk 5: Insights Page

### Task 12: InsightReport component and page

**Files:**
- Create: `intelligence-hub-app/src/components/insights/InsightReport.tsx`
- Create: `intelligence-hub-app/src/app/(dashboard)/instances/[id]/insights/page.tsx`

- [ ] **Step 1: Create InsightReport component**

```tsx
import { InsightReport as InsightReportType } from '@/types';
import { Lightbulb, TrendingUp, HelpCircle, Target } from 'lucide-react';

interface Props {
  report: InsightReportType;
}

export default function InsightReport({ report }: Props) {
  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-horse-black mb-3">Resumen Ejecutivo</h3>
        <p className="text-sm text-horse-gray-700 leading-relaxed whitespace-pre-wrap">{report.executiveSummary}</p>
      </div>

      {/* Top Topics */}
      <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-horse-black mb-4 flex items-center gap-2">
          <Target size={16} className="text-status-review" /> Top 3 Temas
        </h3>
        <div className="space-y-4">
          {report.topTopics.map((topic, i) => (
            <div key={i} className="border-l-2 border-status-review pl-4">
              <div className="text-sm font-medium text-horse-black">{topic.topic}</div>
              <div className="text-xs text-horse-gray-500 mt-1 leading-relaxed">{topic.evidence}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Opportunity */}
        <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-horse-black mb-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-status-draft" /> Oportunidad Destacada
          </h3>
          <p className="text-sm text-horse-gray-700 leading-relaxed whitespace-pre-wrap">{report.opportunity}</p>
        </div>

        {/* Evolution */}
        <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-horse-black mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-status-approved" /> Evolución
          </h3>
          <p className="text-sm text-horse-gray-700 leading-relaxed whitespace-pre-wrap">{report.evolution}</p>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-horse-black mb-4 flex items-center gap-2">
          <HelpCircle size={16} className="text-horse-gray-500" /> Preguntas para el Cliente
        </h3>
        <div className="space-y-3">
          {report.questions.map((q, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-horse-gray-100 text-horse-gray-500 flex items-center justify-center text-xs font-semibold flex-shrink-0">{i + 1}</span>
              <p className="text-sm text-horse-gray-700 leading-relaxed">{q}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-horse-black mb-3">Recomendaciones</h3>
        <p className="text-sm text-horse-gray-700 leading-relaxed whitespace-pre-wrap">{report.recommendations}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create insights page**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { InsightReport as InsightReportType } from '@/types';
import { getCurrentWeek } from '@/lib/weeks';
import { apiClient } from '@/lib/api';
import WeekSelector from '@/components/ui/WeekSelector';
import InsightReportComponent from '@/components/insights/InsightReport';
import { Brain } from 'lucide-react';

export default function InsightsPage() {
  const { id } = useParams<{ id: string }>();
  const [week, setWeek] = useState(getCurrentWeek);
  const [report, setReport] = useState<InsightReportType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsight = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/instances/${id}/insights/${week.weekNumber}`, {
        params: { year: String(week.year) },
      });
      setReport(res.data);
    } catch (err: any) {
      if (err?.response?.status === 404) setReport(null);
      else console.error('Failed to fetch insight:', err);
    } finally {
      setLoading(false);
    }
  }, [id, week]);

  useEffect(() => { fetchInsight(); }, [fetchInsight]);

  return (
    <div className="p-6 bg-horse-bg min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-horse-black">Insights</h2>
        <WeekSelector year={week.year} weekNumber={week.weekNumber} onChange={(y, w) => setWeek({ year: y, weekNumber: w })} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-horse-gray-400 text-sm">Cargando insights...</div>
      ) : report ? (
        <InsightReportComponent report={report} />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-horse-gray-400 text-sm">
          <Brain size={32} className="mb-3 text-horse-gray-300" />
          No hay insight para esta semana
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add intelligence-hub-app/src/components/insights/ intelligence-hub-app/src/app/\(dashboard\)/instances/\[id\]/insights/
git commit -m "feat(app): add insights page with weekly report view"
```

---

## Chunk 6: Brand Voice Page

### Task 13: BrandVoiceForm and page

**Files:**
- Create: `intelligence-hub-app/src/components/brand-voice/BrandVoiceForm.tsx`
- Create: `intelligence-hub-app/src/app/(dashboard)/instances/[id]/brand-voice/page.tsx`

- [ ] **Step 1: Create BrandVoiceForm**

```tsx
'use client';

import { useState } from 'react';
import { BrandVoice } from '@/types';
import { Save } from 'lucide-react';

interface Props {
  data: BrandVoice;
  onSave: (data: Partial<BrandVoice>) => Promise<void>;
}

export default function BrandVoiceForm({ data, onSave }: Props) {
  const [form, setForm] = useState({
    identity: data.identity,
    valueProposition: data.valueProposition,
    audience: data.audience,
    voiceTone: data.voiceTone,
    recurringTopics: data.recurringTopics,
    positioning: data.positioning,
    metrics: data.metrics,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const sections: { key: string; label: string; multiline: boolean }[] = [
    { key: 'identity', label: 'Identidad', multiline: true },
    { key: 'valueProposition', label: 'Propuesta de Valor', multiline: true },
    { key: 'audience', label: 'Audiencia', multiline: true },
    { key: 'positioning', label: 'Posicionamiento', multiline: true },
    { key: 'metrics', label: 'Métricas', multiline: true },
  ];

  return (
    <div className="space-y-6">
      {sections.map((s) => (
        <div key={s.key} className="bg-white border border-horse-gray-200 rounded-xl p-6">
          <label className="block text-sm font-semibold text-horse-black mb-2">{s.label}</label>
          <textarea
            value={(form as any)[s.key]}
            onChange={(e) => updateField(s.key, e.target.value)}
            rows={4}
            className="w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm text-horse-gray-700 leading-relaxed focus:outline-none focus:border-horse-black transition-colors resize-none"
          />
        </div>
      ))}

      {/* Voice & Tone (JSON fields) */}
      <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
        <label className="block text-sm font-semibold text-horse-black mb-3">Voz y Tono</label>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-horse-gray-400 mb-1">Adjetivos (separados por coma)</label>
            <input
              value={form.voiceTone.adjectives.join(', ')}
              onChange={(e) => setForm((prev) => ({
                ...prev,
                voiceTone: { ...prev.voiceTone, adjectives: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) },
              }))}
              className="w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-horse-gray-400 mb-1">Ejemplos (uno por línea)</label>
            <textarea
              value={form.voiceTone.examples.join('\n')}
              onChange={(e) => setForm((prev) => ({
                ...prev,
                voiceTone: { ...prev.voiceTone, examples: e.target.value.split('\n').filter(Boolean) },
              }))}
              rows={3}
              className="w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-horse-gray-400 mb-1">Anti-patrones (uno por línea)</label>
            <textarea
              value={form.voiceTone.antiPatterns.join('\n')}
              onChange={(e) => setForm((prev) => ({
                ...prev,
                voiceTone: { ...prev.voiceTone, antiPatterns: e.target.value.split('\n').filter(Boolean) },
              }))}
              rows={3}
              className="w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* Recurring Topics */}
      <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
        <label className="block text-sm font-semibold text-horse-black mb-2">Temas Recurrentes (uno por línea)</label>
        <textarea
          value={form.recurringTopics.join('\n')}
          onChange={(e) => setForm((prev) => ({
            ...prev,
            recurringTopics: e.target.value.split('\n').filter(Boolean),
          }))}
          rows={5}
          className="w-full border border-horse-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-horse-black transition-colors resize-none"
        />
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-horse-black text-white text-sm font-medium hover:bg-black disabled:opacity-50 transition-colors"
        >
          <Save size={16} />
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create brand voice page**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { BrandVoice } from '@/types';
import { apiClient } from '@/lib/api';
import BrandVoiceForm from '@/components/brand-voice/BrandVoiceForm';
import { Mic } from 'lucide-react';

export default function BrandVoicePage() {
  const { id } = useParams<{ id: string }>();
  const [brandVoice, setBrandVoice] = useState<BrandVoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(`/instances/${id}/brand-voice`);
        setBrandVoice(res.data);
      } catch (err) {
        console.error('Failed to fetch brand voice:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async (data: Partial<BrandVoice>) => {
    const res = await apiClient.put(`/instances/${id}/brand-voice`, data);
    setBrandVoice(res.data);
  };

  return (
    <div className="p-6 bg-horse-bg min-h-full">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-horse-black">Brand Voice</h2>
        <p className="text-sm text-horse-gray-400 mt-0.5">Define la voz y personalidad del contenido</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-horse-gray-400 text-sm">Cargando brand voice...</div>
      ) : brandVoice ? (
        <BrandVoiceForm data={brandVoice} onSave={handleSave} />
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-horse-gray-400 text-sm">
          <Mic size={32} className="mb-3 text-horse-gray-300" />
          No hay brand voice configurado
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add intelligence-hub-app/src/components/brand-voice/ intelligence-hub-app/src/app/\(dashboard\)/instances/\[id\]/brand-voice/
git commit -m "feat(app): add brand voice page with editable form"
```

---

## Chunk 7: History Page

### Task 14: ProcessingTimeline and page

**Files:**
- Create: `intelligence-hub-app/src/components/history/ProcessingTimeline.tsx`
- Create: `intelligence-hub-app/src/app/(dashboard)/instances/[id]/history/page.tsx`

- [ ] **Step 1: Create ProcessingTimeline**

```tsx
import { ProcessingRun } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Props {
  runs: ProcessingRun[];
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  COMPLETED: { icon: CheckCircle2, color: 'text-status-approved', label: 'Completado' },
  RUNNING: { icon: Loader2, color: 'text-status-review', label: 'En proceso' },
  FAILED: { icon: XCircle, color: 'text-red-500', label: 'Error' },
};

export default function ProcessingTimeline({ runs }: Props) {
  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-horse-gray-400 text-sm">
        <Clock size={32} className="mb-3 text-horse-gray-300" />
        No hay procesamientos registrados
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {runs.map((run) => {
        const cfg = statusConfig[run.status];
        const Icon = cfg.icon;
        return (
          <div key={run.id} className="bg-white border border-horse-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Icon size={20} className={`${cfg.color} ${run.status === 'RUNNING' ? 'animate-spin' : ''}`} />
                <div>
                  <div className="text-sm font-medium text-horse-black">
                    Semana {run.weekNumber}, {run.year}
                  </div>
                  <div className="text-xs text-horse-gray-400 mt-0.5">
                    {format(new Date(run.startedAt), "EEEE d MMM yyyy, HH:mm", { locale: es })}
                    {run.completedAt && ` — ${format(new Date(run.completedAt), "HH:mm", { locale: es })}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                <span className="text-[10px] text-horse-gray-400 bg-horse-gray-100 px-2 py-0.5 rounded">
                  {run.triggeredBy === 'CRON' ? 'Automático' : 'Manual'}
                </span>
              </div>
            </div>

            {/* Step progress */}
            <div className="flex gap-2">
              {run.steps.map((step, i) => (
                <div key={i} className="flex-1">
                  <div className={`h-1.5 rounded-full mb-1.5 ${
                    step.status === 'done' ? 'bg-status-approved'
                    : step.status === 'running' ? 'bg-status-review animate-pulse'
                    : step.status === 'failed' ? 'bg-red-400'
                    : 'bg-horse-gray-200'
                  }`} />
                  <div className="text-[10px] text-horse-gray-400 font-medium">{step.name}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create history page**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProcessingRun } from '@/types';
import { apiClient } from '@/lib/api';
import ProcessingTimeline from '@/components/history/ProcessingTimeline';

export default function HistoryPage() {
  const { id } = useParams<{ id: string }>();
  const [runs, setRuns] = useState<ProcessingRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(`/instances/${id}/runs`);
        setRuns(res.data);
      } catch (err) {
        console.error('Failed to fetch runs:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="p-6 bg-horse-bg min-h-full">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-horse-black">Historial de Procesamientos</h2>
        <p className="text-sm text-horse-gray-400 mt-0.5">{runs.length} ejecuciones registradas</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-horse-gray-400 text-sm">Cargando historial...</div>
      ) : (
        <ProcessingTimeline runs={runs} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add intelligence-hub-app/src/components/history/ intelligence-hub-app/src/app/\(dashboard\)/instances/\[id\]/history/
git commit -m "feat(app): add processing history page with timeline component"
```

---

## Chunk 8: Wire Tabs to Routes

### Task 15: Update instance layout tabs to use Next.js navigation

**Files:**
- Edit: `intelligence-hub-app/src/app/(dashboard)/instances/[id]/layout.tsx` (created in Plan 3A)

- [ ] **Step 1: Ensure tabs link to correct routes**

The instance layout from Plan 3A should have tabs. Update the tab configuration to map to the correct routes:

```tsx
// In the instance layout, ensure the tabs array matches these routes:
const tabs = [
  { label: 'Contenido', href: `/instances/${id}/content`, badge: null },
  { label: 'Inputs', href: `/instances/${id}/inputs`, badge: null },
  { label: 'Insights', href: `/instances/${id}/insights` },
  { label: 'Brand Voice', href: `/instances/${id}/brand-voice` },
  { label: 'Historial', href: `/instances/${id}/history` },
];
```

Each tab should use `<Link>` from `next/link` and apply the `.active` style when `pathname.startsWith(tab.href)`. The topbar should show the "Subir inputs" and "Procesar ahora" buttons.

- [ ] **Step 2: Add "Procesar ahora" button handler in layout**

The topbar "Procesar ahora" button should call:

```typescript
const handleProcess = async () => {
  try {
    await apiClient.post(`/instances/${id}/process`);
    router.refresh();
  } catch (err) {
    console.error('Failed to trigger processing:', err);
  }
};
```

- [ ] **Step 3: Commit**

```bash
git add intelligence-hub-app/src/app/\(dashboard\)/instances/\[id\]/layout.tsx
git commit -m "feat(app): wire instance tabs to content/inputs/insights/brand-voice/history routes"
```

---

## Chunk 9: Final Verification

### Task 16: Build and verify

- [ ] **Step 1: Run TypeScript check**

```bash
cd /c/Proyectos/Inteligence-hub/intelligence-hub-app
npx tsc --noEmit
```

- [ ] **Step 2: Fix any TypeScript errors found in Step 1**

- [ ] **Step 3: Run Next.js build**

```bash
cd /c/Proyectos/Inteligence-hub/intelligence-hub-app
npm run build
```

- [ ] **Step 4: Fix any build errors found in Step 3**

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "fix(app): resolve build errors from plan 3B feature pages"
```

---

## Summary

| Chunk | Tasks | What it delivers |
|-------|-------|------------------|
| 1 | 1-2 | TypeScript types for all models + week utilities |
| 2 | 3 | PlatformBadge, StatusDot, WeekSelector, Modal |
| 3 | 4-9 | Full Kanban content page (main page) |
| 4 | 10-11 | Inputs page with upload modal |
| 5 | 12 | Insights page with weekly report |
| 6 | 13 | Brand Voice page with editable form |
| 7 | 14 | History page with processing timeline |
| 8 | 15 | Wire tabs to routes + process button |
| 9 | 16 | Build verification |

**Total files:** 20 new files, 1 edit
**Dependencies:** date-fns, lucide-react (install if not from Plan 3A)
**API endpoints used:** GET/PATCH content, GET/POST/DELETE inputs, GET insights, GET/PUT brand-voice, GET runs, POST process

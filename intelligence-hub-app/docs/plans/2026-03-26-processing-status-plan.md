# Processing Status Feedback — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add real-time processing status feedback with adaptive polling — compact badges on dashboard cards and a vertical stepper timeline in instance detail.

**Architecture:** Two custom hooks handle adaptive polling (3s running / 10s idle / stop after 60s). A `RunStatusBadge` component shows status on dashboard cards. A `ProcessingStepper` replaces the flat progress bars in the history page with a vertical timeline. No backend changes needed.

**Tech Stack:** React 18, Next.js 14, Tailwind CSS, Lucide icons, date-fns (ES locale), existing `api` client.

---

### Task 1: Add `StepStatus` extended type and step metadata

**Files:**
- Modify: `src/lib/types.ts:95`

**Step 1: Update StepStatus type to include reused/skipped**

In `src/lib/types.ts`, change line 95 from:

```typescript
export type StepStatus = "pending" | "running" | "done" | "failed";
```

to:

```typescript
export type StepStatus = "pending" | "running" | "done" | "failed" | "reused" | "skipped";
```

**Step 2: Add step metadata constants**

Create file `src/lib/processing.ts`:

```typescript
import { StepStatus } from "./types";

export const STEP_ORDER = ["corpus", "brandVoice", "content", "insights", "distribution"] as const;

export const STEP_LABELS: Record<string, string> = {
  corpus: "Corpus",
  brandVoice: "Brand Voice",
  content: "Contenido",
  insights: "Insights",
  distribution: "Distribución",
};

export function getCompletedStepCount(steps: Record<string, StepStatus>): number {
  return Object.values(steps).filter((s) => s === "done" || s === "reused" || s === "skipped").length;
}

export function getRunningStepName(steps: Record<string, StepStatus>): string | null {
  const entry = Object.entries(steps).find(([, s]) => s === "running");
  if (!entry) return null;
  return STEP_LABELS[entry[0]] || entry[0];
}

export function getFailedStepName(steps: Record<string, StepStatus>): string | null {
  const entry = Object.entries(steps).find(([, s]) => s === "failed");
  if (!entry) return null;
  return STEP_LABELS[entry[0]] || entry[0];
}
```

**Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/processing.ts
git commit -m "feat: add extended StepStatus type and processing step utilities"
```

---

### Task 2: Create `useProcessingStatus` hook (adaptive polling for single instance)

**Files:**
- Create: `src/hooks/useProcessingStatus.ts`

**Step 1: Create the hook**

```typescript
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { ProcessingRun } from "@/lib/types";

interface UseProcessingStatusOptions {
  enabled?: boolean;
}

interface UseProcessingStatusResult {
  latestRun: ProcessingRun | null;
  loading: boolean;
}

export function useProcessingStatus(
  instanceId: string | undefined,
  options: UseProcessingStatusOptions = {}
): UseProcessingStatusResult {
  const { enabled = true } = options;
  const [latestRun, setLatestRun] = useState<ProcessingRun | null>(null);
  const [loading, setLoading] = useState(true);
  const idleTimeRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLatestRun = useCallback(async () => {
    if (!instanceId) return;
    try {
      const runs = await api.get<ProcessingRun[]>(`/instances/${instanceId}/runs?limit=1`);
      setLatestRun(runs.length > 0 ? runs[0] : null);
    } catch {
      // Silently fail — don't break UI on polling errors
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  useEffect(() => {
    if (!instanceId || !enabled) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchLatestRun();

    const tick = () => {
      fetchLatestRun().then(() => {
        // Determine next interval based on current state
        const isRunning = latestRun?.status === "RUNNING";

        if (isRunning) {
          idleTimeRef.current = 0;
        } else {
          idleTimeRef.current += isRunning ? 3000 : 10000;
        }

        // Stop polling after 60s of no RUNNING state
        if (idleTimeRef.current >= 60000 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      });
    };

    // Start with adaptive interval
    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      const interval = latestRun?.status === "RUNNING" ? 3000 : 10000;
      intervalRef.current = setInterval(tick, interval);
    };

    startPolling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [instanceId, enabled, fetchLatestRun, latestRun?.status]);

  return { latestRun, loading };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useProcessingStatus.ts
git commit -m "feat: add useProcessingStatus hook with adaptive polling"
```

---

### Task 3: Create `useDashboardPolling` hook

**Files:**
- Create: `src/hooks/useDashboardPolling.ts`

**Step 1: Create the hook**

```typescript
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { ProcessingRun, Instance } from "@/lib/types";

type RunMap = Record<string, ProcessingRun | null>;

export function useDashboardPolling(instances: Instance[]) {
  const [latestRuns, setLatestRuns] = useState<RunMap>({});
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleTimeRef = useRef(0);

  const fetchAllRuns = useCallback(async () => {
    if (instances.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const results = await Promise.allSettled(
        instances.map((inst) =>
          api.get<ProcessingRun[]>(`/instances/${inst.id}/runs?limit=1`).then((runs) => ({
            id: inst.id,
            run: runs.length > 0 ? runs[0] : null,
          }))
        )
      );

      const map: RunMap = {};
      for (const result of results) {
        if (result.status === "fulfilled") {
          map[result.value.id] = result.value.run;
        }
      }
      setLatestRuns(map);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [instances]);

  useEffect(() => {
    if (instances.length === 0) {
      setLoading(false);
      return;
    }

    fetchAllRuns();

    const hasRunning = Object.values(latestRuns).some((r) => r?.status === "RUNNING");

    if (hasRunning) {
      idleTimeRef.current = 0;
    }

    const interval = hasRunning ? 5000 : 30000;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (!hasRunning) {
        idleTimeRef.current += interval;
      }
      if (idleTimeRef.current >= 60000 && !hasRunning) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      fetchAllRuns();
    }, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [instances, fetchAllRuns, latestRuns]);

  return { latestRuns, loading };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useDashboardPolling.ts
git commit -m "feat: add useDashboardPolling hook for dashboard-wide adaptive polling"
```

---

### Task 4: Create `RunStatusBadge` component

**Files:**
- Create: `src/components/ui/RunStatusBadge.tsx`

**Step 1: Create the component**

```tsx
import { ProcessingRun } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getCompletedStepCount, getRunningStepName, getFailedStepName } from "@/lib/processing";

interface Props {
  run: ProcessingRun | null;
}

export function RunStatusBadge({ run }: Props) {
  if (!run) return null;

  const totalSteps = Object.keys(run.steps || {}).length;

  if (run.status === "RUNNING") {
    const completed = getCompletedStepCount(run.steps);
    const currentStep = getRunningStepName(run.steps);
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(45,108,206,0.1)] text-status-review text-[11px] font-semibold">
        <Loader2 size={12} className="animate-spin" />
        <span>
          {currentStep || "Procesando"} ({completed}/{totalSteps})
        </span>
      </div>
    );
  }

  if (run.status === "COMPLETED") {
    const timeAgo = formatDistanceToNow(new Date(run.completedAt!), { addSuffix: true, locale: es });
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(42,157,92,0.1)] text-status-approved text-[11px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-status-approved" />
        <span>Completado {timeAgo}</span>
      </div>
    );
  }

  if (run.status === "FAILED") {
    const failedStep = getFailedStepName(run.steps);
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(220,38,38,0.1)] text-red-500 text-[11px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        <span>Error{failedStep ? ` en ${failedStep}` : ""}</span>
      </div>
    );
  }

  return null;
}
```

**Step 2: Commit**

```bash
git add src/components/ui/RunStatusBadge.tsx
git commit -m "feat: add RunStatusBadge component for dashboard cards"
```

---

### Task 5: Integrate `RunStatusBadge` into Dashboard

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

**Step 1: Update the dashboard page**

Add imports at the top:

```typescript
import { useDashboardPolling } from "@/hooks/useDashboardPolling";
import { RunStatusBadge } from "@/components/ui/RunStatusBadge";
```

Inside `DashboardPage`, after `const { instances, loading } = useInstances();`:

```typescript
const { latestRuns } = useDashboardPolling(instances);
```

Inside each instance card, add the `RunStatusBadge` after the stats grid (after the closing `</div>` of `grid grid-cols-2`):

```tsx
<RunStatusBadge run={latestRuns[instance.id] || null} />
```

**Step 2: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx
git commit -m "feat: integrate RunStatusBadge into dashboard instance cards"
```

---

### Task 6: Create `ProcessingStepper` component

**Files:**
- Create: `src/components/history/ProcessingStepper.tsx`

**Step 1: Create the vertical stepper component**

```tsx
import { ProcessingRun, StepStatus } from "@/lib/types";
import { STEP_ORDER, STEP_LABELS } from "@/lib/processing";
import { CheckCircle2, XCircle, Loader2, MinusCircle, RefreshCw, Circle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  run: ProcessingRun;
}

const stepIconConfig: Record<StepStatus, { icon: typeof Circle; colorClass: string; animate?: boolean }> = {
  pending: { icon: Circle, colorClass: "text-horse-gray-300" },
  running: { icon: Loader2, colorClass: "text-status-review", animate: true },
  done: { icon: CheckCircle2, colorClass: "text-status-approved" },
  failed: { icon: XCircle, colorClass: "text-red-500" },
  reused: { icon: RefreshCw, colorClass: "text-status-review" },
  skipped: { icon: MinusCircle, colorClass: "text-horse-gray-300" },
};

const stepLineColor: Record<StepStatus, string> = {
  pending: "bg-horse-gray-200",
  running: "bg-status-review",
  done: "bg-status-approved",
  failed: "bg-red-400",
  reused: "bg-status-review",
  skipped: "bg-horse-gray-200",
};

function formatDuration(startedAt: string, completedAt: string | null): string | null {
  if (!completedAt) return null;
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return "<1s";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

export default function ProcessingStepper({ run }: Props) {
  const steps = run.steps || {};
  const orderedSteps = STEP_ORDER.filter((key) => key in steps);
  const duration = formatDuration(run.startedAt, run.completedAt);

  return (
    <div className="py-2">
      {/* Run header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="text-xs text-horse-gray-400">
          Iniciado {format(new Date(run.startedAt), "HH:mm:ss", { locale: es })}
        </div>
        {duration && (
          <div className="text-xs text-horse-gray-400">
            Duración total: <span className="font-medium text-horse-black">{duration}</span>
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="relative pl-4">
        {orderedSteps.map((stepKey, index) => {
          const status = steps[stepKey];
          const config = stepIconConfig[status];
          const Icon = config.icon;
          const isLast = index === orderedSteps.length - 1;
          const label = STEP_LABELS[stepKey] || stepKey;

          return (
            <div key={stepKey} className="relative flex items-start gap-3 pb-6 last:pb-0">
              {/* Vertical line */}
              {!isLast && (
                <div
                  className={`absolute left-[9px] top-[24px] w-[2px] h-[calc(100%-12px)] ${stepLineColor[status]}`}
                />
              )}

              {/* Icon */}
              <div className="relative z-10 flex-shrink-0">
                <Icon
                  size={20}
                  className={`${config.colorClass} ${config.animate ? "animate-spin" : ""}`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 -mt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-horse-black">{label}</span>
                  <span className={`text-[11px] font-semibold ${config.colorClass}`}>
                    {status === "done" ? "Completado" : status === "running" ? "En proceso" : status === "failed" ? "Error" : status === "reused" ? "Reutilizado" : status === "skipped" ? "Omitido" : "Pendiente"}
                  </span>
                </div>

                {/* Step status details */}
                {status === "running" && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="h-1 flex-1 max-w-[120px] bg-horse-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-status-review rounded-full animate-pulse w-2/3" />
                    </div>
                    <span className="text-[10px] text-horse-gray-400">Procesando...</span>
                  </div>
                )}

                {status === "failed" && (
                  <p className="mt-1 text-[11px] text-red-500">El step falló durante la ejecución</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/history/ProcessingStepper.tsx
git commit -m "feat: add ProcessingStepper vertical timeline component"
```

---

### Task 7: Integrate `ProcessingStepper` into `ProcessingTimeline`

**Files:**
- Modify: `src/components/history/ProcessingTimeline.tsx`

**Step 1: Update ProcessingTimeline to use expandable stepper**

Replace the entire file with:

```tsx
'use client';

import { useState } from 'react';
import { ProcessingRun } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, CheckCircle2, XCircle, Loader2, ChevronDown } from 'lucide-react';
import ProcessingStepper from './ProcessingStepper';

interface Props {
  runs: ProcessingRun[];
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  COMPLETED: { icon: CheckCircle2, color: 'text-status-approved', label: 'Completado' },
  RUNNING: { icon: Loader2, color: 'text-status-review', label: 'En proceso' },
  FAILED: { icon: XCircle, color: 'text-red-500', label: 'Error' },
};

export default function ProcessingTimeline({ runs }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(
    // Auto-expand if there's a running run
    runs.find((r) => r.status === 'RUNNING')?.id || null
  );

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
        const isExpanded = expandedId === run.id;

        return (
          <div key={run.id} className="bg-white border border-horse-gray-200 rounded-xl overflow-hidden">
            {/* Clickable header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : run.id)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-horse-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className={`${cfg.color} ${run.status === 'RUNNING' ? 'animate-spin' : ''}`} />
                <div className="text-left">
                  <div className="text-sm font-medium text-horse-black">
                    Semana {run.weekNumber}, {run.year}
                  </div>
                  <div className="text-xs text-horse-gray-400 mt-0.5">
                    {format(new Date(run.startedAt), "EEEE d MMM yyyy, HH:mm", { locale: es })}
                    {run.completedAt && ` — ${format(new Date(run.completedAt), "HH:mm", { locale: es })}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                <span className="text-[10px] text-horse-gray-400 bg-horse-gray-100 px-2 py-0.5 rounded">
                  {run.triggeredBy === 'CRON' ? 'Automatico' : 'Manual'}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-horse-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {/* Expandable stepper */}
            {isExpanded && (
              <div className="px-5 pb-4 border-t border-horse-gray-100">
                <ProcessingStepper run={run} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/history/ProcessingTimeline.tsx
git commit -m "feat: integrate ProcessingStepper into expandable ProcessingTimeline"
```

---

### Task 8: Add polling to History page

**Files:**
- Modify: `src/app/(app)/instances/[id]/history/page.tsx`

**Step 1: Add polling to history page**

Replace the file with:

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ProcessingRun } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Spinner';
import ProcessingTimeline from '@/components/history/ProcessingTimeline';

export default function HistoryPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [runs, setRuns] = useState<ProcessingRun[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleCountRef = useRef(0);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const res = await api.get<ProcessingRun[]>(`/instances/${id}/runs`);
        setRuns(res);
        return res;
      } catch {
        toast.error('Error al cargar historial');
        return [];
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();

    const poll = async () => {
      const data = await fetchRuns();
      const hasRunning = data.some((r) => r.status === 'RUNNING');

      if (hasRunning) {
        idleCountRef.current = 0;
      } else {
        idleCountRef.current += 1;
      }

      // Stop polling after ~60s of no running (6 ticks of 10s)
      if (idleCountRef.current >= 6 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Start at 5s, will adjust based on state
    intervalRef.current = setInterval(poll, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [id, toast]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-horse-black">Historial de Procesamientos</h2>
        <p className="text-sm text-horse-gray-400 mt-0.5">{runs.length} ejecuciones registradas</p>
      </div>

      {loading ? (
        <PageLoader message="Cargando historial..." />
      ) : (
        <ProcessingTimeline runs={runs} />
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(app)/instances/[id]/history/page.tsx
git commit -m "feat: add polling to history page for real-time run updates"
```

---

### Task 9: Visual verification and cleanup

**Step 1: Run the dev server and verify**

```bash
cd /c/proyectos/Inteligence-hub/intelligence-hub-app
npm run dev
```

**Step 2: Verify checklist**

- [ ] Dashboard cards show `RunStatusBadge` with correct status
- [ ] Badge shows spinner + step count when RUNNING
- [ ] Badge shows relative time when COMPLETED
- [ ] Badge shows failed step name when FAILED
- [ ] History page runs auto-expand when RUNNING
- [ ] ProcessingStepper shows vertical timeline with icons
- [ ] Stepper shows connecting lines between steps
- [ ] Status labels are correct (Completado, En proceso, Error, etc.)
- [ ] Polling refreshes dashboard when a run is active
- [ ] Polling refreshes history page when a run is active
- [ ] Polling stops after 60s of no activity
- [ ] Mobile responsive — stepper stacks properly

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: processing status feedback — dashboard badges + stepper timeline + adaptive polling"
```

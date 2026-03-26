# Processing Status Feedback — Design Document

**Date:** 2026-03-26
**Status:** Approved

## Problem

Users have no real-time visibility into what's happening when an instance is processing. They trigger "Procesar ahora" and have no feedback until it completes or fails.

## Solution

Add real-time processing status feedback in two places:

1. **Dashboard** — Compact badge on each instance card showing last run status
2. **Instance detail** — Vertical stepper timeline showing step-by-step progress

Use **adaptive polling** to fetch updates efficiently.

## Design Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Update mechanism | Polling (not SSE/WS) | Backend endpoints already exist, low user count, simpler infra |
| Display locations | Dashboard + detail page | Quick overview + deep inspection |
| Info level | Intermediate | Name, status, timestamps, duration, error messages |
| Visual pattern | Vertical stepper with timeline | Intuitive for sequential progress |
| Polling interval | Adaptive (3s/10s/stop) | Fast when active, efficient when idle |

## Architecture

### 1. Dashboard — RunStatusBadge

Each instance card gets a badge showing the last run's status:

- **No runs** → Nothing displayed
- **RUNNING** → Yellow badge + spinner + "Procesando... (Step 3/5)"
- **COMPLETED** → Green badge + "Completado hace 2h" (relative time)
- **FAILED** → Red badge + "Error en [step name]"

Data source: Fetched alongside instances, or via `GET /instances/:id/runs?limit=1`.

### 2. Instance Detail — ProcessingStepper

Vertical stepper component displayed in the history page when expanding a run:

- **Visual**: Connected vertical line between steps, fills progressively
- **Step icons by status**:
  - `pending` → Gray circle (empty)
  - `running` → Yellow circle with spinner animation
  - `completed` → Green circle with checkmark
  - `failed` → Red circle with X
  - `reused` → Blue circle with refresh icon
  - `skipped` → Gray circle with dash
- **Step info**: Name, duration (e.g., "1m 23s"), start/end timestamps
- **Error display**: Red message below failed step

Steps follow orchestrator order: `corpus → brandVoice → content → insights → distribution`

### 3. Adaptive Polling

**Hook: `useProcessingStatus(instanceId)`**

```
if lastRun.status === "RUNNING":
  poll every 3 seconds
elif lastRun.status in ["COMPLETED", "FAILED"]:
  poll every 10 seconds (catch new runs)
  stop after 60 seconds of no RUNNING state
else:
  no polling
```

**Hook: `useDashboardPolling(instances)`**

- Checks if any instance has a RUNNING run
- If yes: poll all instances every 5 seconds
- If no: poll every 30 seconds (lightweight background refresh)
- Stop aggressive polling after 60s of no activity

### 4. New Components

| Component | Path | Purpose |
|---|---|---|
| `RunStatusBadge` | `src/components/ui/RunStatusBadge.tsx` | Compact status badge for dashboard cards |
| `ProcessingStepper` | `src/components/history/ProcessingStepper.tsx` | Vertical stepper timeline for run detail |
| `useProcessingStatus` | `src/hooks/useProcessingStatus.ts` | Adaptive polling hook for single instance |
| `useDashboardPolling` | `src/hooks/useDashboardPolling.ts` | Adaptive polling hook for dashboard |

### 5. Backend Changes

**None required.** Existing endpoints provide all needed data:

- `GET /api/instances/:id/runs?limit=1` → Latest run with steps
- `GET /api/instances/:id/runs/:runId` → Specific run detail
- `ProcessingRun.steps` is `Record<string, StepStatus>` with all step states

### 6. Types (already exist)

```typescript
type RunStatus = "RUNNING" | "COMPLETED" | "FAILED";
type StepStatus = "pending" | "running" | "done" | "failed";

interface ProcessingRun {
  id: string;
  instanceId: string;
  weekNumber: number;
  year: number;
  status: RunStatus;
  steps: Record<string, StepStatus>;
  startedAt: string;
  completedAt: string | null;
  triggeredBy: TriggerType;
}
```

**Note:** StepStatus may also include `"reused"` and `"skipped"` from the orchestrator. The frontend should handle these gracefully.

## Styling

Follows existing design system:

- **Colors**: horse-black, horse-gray palette
- **Status colors**: green (#2a9d5c), yellow/gold (#d4a017), red (#dc2626), blue (#2d6cce), gray (#9ca3af)
- **Animations**: Tailwind `animate-spin` for running spinner, `animate-pulse` for badge
- **Typography**: Existing text-sm/text-xs patterns
- **Responsive**: Works on mobile (stepper stacks naturally)

# API Integration Fixes — Design

> Date: 2026-03-23

## Problem
Frontend types and field names don't match backend API responses, causing 400 errors and missing data.

## Mismatches & Fixes

1. **Instance field naming**: Frontend uses `role`, backend uses `clientRole` → rename everywhere
2. **Create instance response**: Frontend expects `{ instance }` wrapper, backend returns object directly → unwrap
3. **Dashboard stats**: Frontend expects `stats.pendingInputs/contentCount`, backend returns `_count.inputs/content` → adapt
4. **ProcessingRun.steps**: Frontend expects `ProcessingStep[]` array, backend returns object `{ corpus: 'pending', ... }` → adapt type and component
5. **Instance type**: Update `types.ts` to reflect actual API shape

## Files Changed

- `src/lib/types.ts` — Fix Instance (role→clientRole, stats→_count), ProcessingRun.steps
- `src/app/(app)/instances/new/page.tsx` — Fix form field name + response parsing
- `src/app/(app)/dashboard/page.tsx` — Use _count instead of stats
- `src/components/Sidebar.tsx` — Use clientRole instead of role
- `src/components/InstanceTopbar.tsx` — Use clientRole
- `src/components/history/ProcessingTimeline.tsx` — Adapt to steps object
- `src/hooks/useInstances.ts` — Verify response shape
- `src/app/(app)/instances/[id]/layout.tsx` — Verify instance shape

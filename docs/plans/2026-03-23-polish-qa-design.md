# Polish & QA — Design

> Date: 2026-03-23

## 1. Toast Notification System

- New `Toast` component + `ToastProvider` context + `useToast` hook
- Types: `success`, `error`, `warning`
- Auto-dismiss 5s, manual close button, stacked bottom-right
- Pure Tailwind + React state, no external deps
- Replace all `console.error` in pages with `toast.error()`
- Auth form inline banners stay for validation errors; API failures use toast
- `InstanceTopbar` alert() replaced with toast

## 2. Loading States

- New `Spinner` component (SVG + `animate-spin`)
- New `PageLoader` component (Spinner + text)
- Replace all "Cargando..." plain text with `PageLoader`
- Button loading states already handled — no changes needed

## 3. Responsive Design

- **Sidebar**: Hidden on `<md`, drawer overlay with hamburger button in mobile header. Desktop unchanged.
- **App layout**: Remove fixed `ml-[260px]`, use `md:ml-[260px]`
- **Kanban board**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- **Insights grid**: `grid-cols-1 md:grid-cols-2`
- **Instance tabs**: `overflow-x-auto` for horizontal scroll on mobile
- **Dashboard header + Instance topbar**: Stack on mobile

## Files Changed

### New
- `src/components/ui/Toast.tsx` (Toast + ToastProvider + useToast)
- `src/components/ui/Spinner.tsx` (Spinner + PageLoader)

### Modified
- `src/app/(app)/layout.tsx` — responsive layout + ToastProvider
- `src/components/Sidebar.tsx` — drawer mode on mobile
- `src/components/InstanceTabs.tsx` — overflow scroll
- `src/components/InstanceTopbar.tsx` — toast + responsive
- `src/components/content/KanbanBoard.tsx` — responsive grid
- `src/components/insights/InsightReport.tsx` — responsive grid
- `src/app/(app)/dashboard/page.tsx` — PageLoader + responsive
- `src/app/(app)/instances/[id]/content/page.tsx` — PageLoader + toast
- `src/app/(app)/instances/[id]/inputs/page.tsx` — PageLoader + toast
- `src/app/(app)/instances/[id]/brand-voice/page.tsx` — PageLoader + toast
- `src/app/(app)/instances/[id]/history/page.tsx` — PageLoader + toast
- `src/app/(app)/instances/[id]/insights/page.tsx` — PageLoader + toast

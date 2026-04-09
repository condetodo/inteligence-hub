# Warm & Golden Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the "Warm & Golden" visual redesign across the entire HORSE app — warm backgrounds, golden `#f4c80e` accent, tinted Kanban columns, warm borders.

**Architecture:** Pure CSS/styling changes across ~15 files. No functionality, data flow, or component structure changes. All changes flow from new Tailwind color tokens defined in `tailwind.config.ts`.

**Tech Stack:** Next.js, Tailwind CSS, TypeScript, Lucide icons

---

### Task 1: Add warm & golden color tokens to Tailwind config

**Files:**
- Modify: `intelligence-hub-app/tailwind.config.ts`

- [ ] **Step 1: Add new horse color tokens**

In `intelligence-hub-app/tailwind.config.ts`, add the new tokens inside the `horse` color object (after line 25, before the closing `}`):

```ts
// Add these inside the horse: { ... } block, after the existing entries:
          gold: "#f4c80e",
          "gold-hover": "#e0b800",
          "warm-bg": "#faf8f4",
          "warm-sidebar": "#fffcf7",
          "warm-border": "#e8e2d5",
          "warm-text": "#8a7a66",
          "warm-muted": "#a09080",
          "warm-subtle": "#b8a880",
          "warm-surface": "#f5efe4",
          "warm-active": "#f0e8d8",
```

The full `horse` block should look like:

```ts
        horse: {
          black: "#1a1a1a",
          dark: "#32373c",
          "gray-700": "#4a4a4a",
          "gray-500": "#7a7a7a",
          "gray-400": "#9a9a9a",
          "gray-300": "#c4c4c4",
          "gray-200": "#e2e2e0",
          "gray-100": "#f0f0ee",
          bg: "#f5f5f3",
          white: "#ffffff",
          gold: "#f4c80e",
          "gold-hover": "#e0b800",
          "warm-bg": "#faf8f4",
          "warm-sidebar": "#fffcf7",
          "warm-border": "#e8e2d5",
          "warm-text": "#8a7a66",
          "warm-muted": "#a09080",
          "warm-subtle": "#b8a880",
          "warm-surface": "#f5efe4",
          "warm-active": "#f0e8d8",
        },
```

- [ ] **Step 2: Update globals.css body background**

In `intelligence-hub-app/src/app/globals.css`, change the body background from `#f5f5f3` to `#faf8f4`:

```css
body {
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  background: #faf8f4;
  color: #1a1a1a;
}
```

- [ ] **Step 3: Verify build compiles**

Run: `cd intelligence-hub-app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds (or at least no Tailwind config errors)

- [ ] **Step 4: Commit**

```bash
git add intelligence-hub-app/tailwind.config.ts intelligence-hub-app/src/app/globals.css
git commit -m "feat(design): add warm & golden color tokens to Tailwind config"
```

---

### Task 2: Update app layout and mobile header

**Files:**
- Modify: `intelligence-hub-app/src/app/(app)/layout.tsx`

- [ ] **Step 1: Replace bg-horse-bg with bg-horse-warm-bg and update mobile header**

In `intelligence-hub-app/src/app/(app)/layout.tsx`, make these replacements:

Line 25 — loading screen background:
```
bg-horse-bg  →  bg-horse-warm-bg
```

Line 36 — main container:
```
bg-horse-bg  →  bg-horse-warm-bg
```

Line 40 — mobile header border:
```
border-horse-gray-200  →  border-horse-warm-border
```

Line 48 — mobile logo icon (golden bg, black H):
```
bg-horse-black rounded flex items-center justify-center text-white text-xs font-bold
→
bg-horse-gold rounded flex items-center justify-center text-horse-black text-xs font-bold
```

- [ ] **Step 2: Commit**

```bash
git add intelligence-hub-app/src/app/(app)/layout.tsx
git commit -m "feat(design): warm background and golden logo in app layout"
```

---

### Task 3: Redesign Sidebar with warm theme and golden accent

**Files:**
- Modify: `intelligence-hub-app/src/components/Sidebar.tsx`

- [ ] **Step 1: Update sidebar container**

Line 35 — sidebar `<aside>` classes. Replace:
```
bg-white border-r border-horse-gray-200
```
with:
```
bg-horse-warm-sidebar border-r border-horse-warm-border
```

- [ ] **Step 2: Update logo icon (golden bg, black H)**

Line 37 — logo icon div. Replace:
```
bg-horse-black rounded-md flex items-center justify-center text-white text-sm font-bold
```
with:
```
bg-horse-gold rounded-md flex items-center justify-center text-horse-black text-sm font-bold
```

- [ ] **Step 3: Update header border**

Line 36 — logo container. Replace:
```
border-b border-horse-gray-200
```
with:
```
border-b border-horse-warm-border
```

- [ ] **Step 4: Update section labels**

Line 45 — "General" label and Line 67 — "Instancias" label. Replace both:
```
text-horse-gray-400
```
with:
```
text-horse-warm-subtle
```

- [ ] **Step 5: Update nav items styling**

Lines 55-59 — nav item classes. Replace the entire className string:
```tsx
className={`flex items-center gap-2.5 px-6 py-2.5 text-sm transition-colors ${
  active
    ? "bg-horse-gray-100 text-horse-black font-medium border-l-[3px] border-horse-black"
    : "text-horse-gray-500 hover:bg-horse-gray-100 hover:text-horse-black"
}`}
```
with:
```tsx
className={`flex items-center gap-2.5 px-6 py-2.5 text-sm transition-colors ${
  active
    ? "bg-horse-warm-surface text-horse-black font-medium border-l-[3px] border-horse-gold"
    : "text-horse-warm-text hover:bg-horse-warm-surface hover:text-horse-black"
}`}
```

- [ ] **Step 6: Update instance items styling**

Lines 78-81 — instance link classes. Replace:
```tsx
className={`flex items-center gap-2.5 px-6 py-2.5 text-[13px] transition-colors ${
  active
    ? "bg-horse-gray-100 text-horse-black"
    : "text-horse-gray-500 hover:bg-horse-gray-100 hover:text-horse-black"
}`}
```
with:
```tsx
className={`flex items-center gap-2.5 px-6 py-2.5 text-[13px] transition-colors ${
  active
    ? "bg-horse-warm-active text-horse-black border-l-[3px] border-horse-gold pl-[21px]"
    : "text-horse-warm-text hover:bg-horse-warm-surface hover:text-horse-black"
}`}
```

- [ ] **Step 7: Update instance role text**

Line 89-90 — instance role text. Replace:
```
text-horse-gray-400
```
with:
```
text-horse-warm-muted
```

- [ ] **Step 8: Update "Nueva instancia" CTA**

Line 101 — CTA button. Replace:
```
border-horse-gray-300 rounded-lg text-center text-horse-gray-400 text-[13px] font-medium hover:border-horse-black hover:text-horse-black
```
with:
```
border-[#d4c8b0] rounded-lg text-center text-horse-warm-muted text-[13px] font-medium hover:border-horse-gold hover:text-horse-black
```

- [ ] **Step 9: Commit**

```bash
git add intelligence-hub-app/src/components/Sidebar.tsx
git commit -m "feat(design): warm sidebar with golden accent"
```

---

### Task 4: Update InstanceTopbar with golden avatar

**Files:**
- Modify: `intelligence-hub-app/src/components/InstanceTopbar.tsx`

- [ ] **Step 1: Update topbar container border**

Line 36 — Replace:
```
border-horse-gray-200
```
with:
```
border-horse-warm-border
```

- [ ] **Step 2: Update company text color**

Line 39 — Replace:
```
text-horse-gray-400
```
with:
```
text-horse-warm-muted
```

- [ ] **Step 3: Update user avatar to golden**

Line 49 — Replace:
```
bg-horse-purple flex items-center justify-center text-white text-xs font-semibold
```
with:
```
bg-horse-gold flex items-center justify-center text-horse-black text-xs font-semibold
```

- [ ] **Step 4: Update hover bg and dropdown border**

Line 47 — button hover. Replace `hover:bg-horse-gray-100` with `hover:bg-horse-warm-surface`

Line 67 — dropdown container. Replace `border-horse-gray-200` with `border-horse-warm-border`

Line 74 — dropdown divider. Replace `border-horse-gray-200` with `border-horse-warm-border`

- [ ] **Step 5: Commit**

```bash
git add intelligence-hub-app/src/components/InstanceTopbar.tsx
git commit -m "feat(design): golden avatar and warm borders in topbar"
```

---

### Task 5: Update InstanceTabs with golden underline and badges

**Files:**
- Modify: `intelligence-hub-app/src/components/InstanceTabs.tsx`

- [ ] **Step 1: Update tab container border**

Line 28 — Replace:
```
border-horse-gray-200
```
with:
```
border-horse-warm-border
```

- [ ] **Step 2: Update active tab styling**

Lines 35-38 — Replace the className:
```tsx
className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
  active
    ? "text-horse-black border-horse-black"
    : "text-horse-gray-400 border-transparent hover:text-horse-dark"
}`}
```
with:
```tsx
className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
  active
    ? "text-horse-black border-horse-gold"
    : "text-horse-warm-muted border-transparent hover:text-horse-black"
}`}
```

- [ ] **Step 3: Update badge styling**

Lines 43-46 — Replace badge className:
```tsx
className={`ml-1.5 px-[7px] py-[2px] rounded-[10px] text-[11px] font-semibold ${
  active ? "bg-horse-black text-white" : "bg-horse-gray-100 text-horse-gray-500"
}`}
```
with:
```tsx
className={`ml-1.5 px-[7px] py-[2px] rounded-[10px] text-[11px] font-semibold ${
  active ? "bg-horse-gold text-horse-black" : "bg-horse-warm-active text-horse-warm-muted"
}`}
```

- [ ] **Step 4: Commit**

```bash
git add intelligence-hub-app/src/components/InstanceTabs.tsx
git commit -m "feat(design): golden tab underline and badges"
```

---

### Task 6: Update KanbanColumn with tinted backgrounds

**Files:**
- Modify: `intelligence-hub-app/src/components/content/KanbanColumn.tsx`

- [ ] **Step 1: Add column style map and update column container**

Replace the entire `KanbanColumn` component body (lines 23-54) with:

```tsx
export default function KanbanColumn({ status, items, allItems, loadingIds, onApprove, onReject, onSelectVariant, onCardClick }: Props) {
  const getSiblings = (item: ContentOutput) =>
    allItems.filter((i) => i.platform === item.platform && i.title === item.title && i.status === item.status);

  const columnStyles: Record<ContentStatus, { bg: string; border: string; countBadge: string }> = {
    DRAFT: {
      bg: 'bg-gradient-to-b from-[#fef8e0] via-[#fffdf7] to-white',
      border: 'border-[#ede0b0]',
      countBadge: 'bg-[#fef3c7] text-[#92400e]',
    },
    REVIEW: {
      bg: 'bg-gradient-to-b from-[#edf3ff] via-[#f8faff] to-white',
      border: 'border-[#c8d8f0]',
      countBadge: 'bg-[#dbeafe] text-[#1e40af]',
    },
    APPROVED: {
      bg: 'bg-gradient-to-b from-[#edfbf2] via-[#f7fdf9] to-white',
      border: 'border-[#bce8cc]',
      countBadge: 'bg-[#d1fae5] text-[#065f46]',
    },
    PUBLISHED: {
      bg: 'bg-gradient-to-b from-[#f5f5f2] via-[#fafaf8] to-white',
      border: 'border-[#e0e0da]',
      countBadge: 'bg-[#f0f0ee] text-[#555]',
    },
  };

  const style = columnStyles[status];

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl min-h-[500px]`}>
      <div className={`px-4 py-3.5 border-b ${style.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2 text-[13px] font-semibold text-horse-black">
          <StatusDot status={status} />
          {columnLabels[status]}
        </div>
        <span className={`${style.countBadge} px-2 py-0.5 rounded-full text-[11px] font-semibold`}>
          {items.length}
        </span>
      </div>
      <div className="p-3 flex flex-col gap-2.5">
        {items.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            siblings={getSiblings(item)}
            loading={loadingIds?.has(item.id)}
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

- [ ] **Step 2: Commit**

```bash
git add intelligence-hub-app/src/components/content/KanbanColumn.tsx
git commit -m "feat(design): tinted Kanban columns by status"
```

---

### Task 7: Update ContentCard with warm borders and transparent bg

**Files:**
- Modify: `intelligence-hub-app/src/components/content/ContentCard.tsx`

- [ ] **Step 1: Update card container**

Line 77 — Replace:
```
bg-white border border-horse-gray-200 rounded-[10px] p-3.5 cursor-pointer transition-all hover:border-horse-gray-300 hover:shadow-md hover:-translate-y-px
```
with:
```
bg-white/85 border border-black/[0.06] rounded-[10px] p-3.5 cursor-pointer transition-all hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:-translate-y-px
```

- [ ] **Step 2: Update action button borders**

Lines 119, 129, 138, 147 — all action buttons: Replace every occurrence of:
```
border-horse-gray-200
```
with:
```
border-horse-warm-border
```

- [ ] **Step 3: Update type badge background**

Line 112 — Replace:
```
bg-horse-gray-100 text-horse-gray-500
```
with:
```
bg-horse-warm-active text-horse-warm-text
```

- [ ] **Step 4: Update approval notes section borders**

Line 162 — Replace:
```
border-horse-gray-200
```
with:
```
border-horse-warm-border
```

Line 167 — textarea border. Replace:
```
border-horse-gray-200
```
with:
```
border-horse-warm-border
```

- [ ] **Step 5: Commit**

```bash
git add intelligence-hub-app/src/components/content/ContentCard.tsx
git commit -m "feat(design): transparent cards with warm borders"
```

---

### Task 8: Update WeekSelector with golden pill

**Files:**
- Modify: `intelligence-hub-app/src/components/ui/WeekSelector.tsx`

- [ ] **Step 1: Update week label pill**

Line 27 — Replace:
```
bg-horse-black text-white
```
with:
```
bg-horse-gold text-horse-black
```

- [ ] **Step 2: Update arrow button borders**

Lines 24 and 30 — both arrow buttons. Replace both:
```
border-horse-gray-200 text-horse-gray-400 hover:border-horse-black hover:text-horse-black
```
with:
```
border-horse-warm-border text-horse-warm-muted hover:border-horse-gold hover:text-horse-black
```

- [ ] **Step 3: Commit**

```bash
git add intelligence-hub-app/src/components/ui/WeekSelector.tsx
git commit -m "feat(design): golden week selector"
```

---

### Task 9: Update PlatformFilter pills with golden active state

**Files:**
- Modify: `intelligence-hub-app/src/components/content/PlatformFilter.tsx`

- [ ] **Step 1: Update pill classes**

Lines 25-28 — Replace:
```tsx
className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
  selected === f.value
    ? 'bg-horse-black text-white border-horse-black'
    : 'border-horse-gray-200 text-horse-gray-500 hover:border-horse-dark hover:text-horse-dark'
}`}
```
with:
```tsx
className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
  selected === f.value
    ? 'bg-horse-gold text-horse-black border-horse-gold font-semibold'
    : 'border-horse-warm-border text-horse-warm-text hover:border-[#d4c8b0] hover:text-horse-black'
}`}
```

- [ ] **Step 2: Commit**

```bash
git add intelligence-hub-app/src/components/content/PlatformFilter.tsx
git commit -m "feat(design): golden active pill in platform filter"
```

---

### Task 10: Update StatsBar with warm borders and styled labels

**Files:**
- Modify: `intelligence-hub-app/src/components/content/StatsBar.tsx`

- [ ] **Step 1: Update stat card border and label**

Line 16 — Replace:
```
border-horse-gray-200
```
with:
```
border-horse-warm-border
```

Line 17 — Replace:
```
text-horse-gray-400
```
with:
```
text-horse-warm-muted uppercase tracking-wide
```

- [ ] **Step 2: Commit**

```bash
git add intelligence-hub-app/src/components/content/StatsBar.tsx
git commit -m "feat(design): warm stat cards with styled labels"
```

---

### Task 11: Update ProcessingBanner with golden process button

**Files:**
- Modify: `intelligence-hub-app/src/components/content/ProcessingBanner.tsx`

- [ ] **Step 1: Update banner border**

Line 50 — Replace:
```
border-horse-gray-200
```
with:
```
border-horse-warm-border
```

- [ ] **Step 2: Update process button to golden**

Line 78 — Replace:
```
bg-horse-black text-white hover:bg-black
```
with:
```
bg-horse-gold text-horse-black hover:bg-horse-gold-hover font-semibold
```

- [ ] **Step 3: Commit**

```bash
git add intelligence-hub-app/src/components/content/ProcessingBanner.tsx
git commit -m "feat(design): golden process button and warm banner"
```

---

### Task 12: Update Badge and Button UI components

**Files:**
- Modify: `intelligence-hub-app/src/components/ui/Badge.tsx`
- Modify: `intelligence-hub-app/src/components/ui/Button.tsx`

- [ ] **Step 1: Update Badge active variant**

In `intelligence-hub-app/src/components/ui/Badge.tsx`, line 11 — Replace:
```
active: "bg-horse-black text-white",
```
with:
```
active: "bg-horse-gold text-horse-black",
```

- [ ] **Step 2: Update Button primary variant**

In `intelligence-hub-app/src/components/ui/Button.tsx`, line 9 — Replace:
```
primary: "bg-horse-black text-white hover:bg-black",
```
with:
```
primary: "bg-horse-gold text-horse-black hover:bg-horse-gold-hover",
```

Also update outline variant (line 10). Replace:
```
outline: "bg-transparent border-[1.5px] border-horse-gray-300 text-horse-dark hover:border-horse-black hover:text-horse-black",
```
with:
```
outline: "bg-transparent border-[1.5px] border-horse-warm-border text-horse-dark hover:border-horse-gold hover:text-horse-black",
```

- [ ] **Step 3: Commit**

```bash
git add intelligence-hub-app/src/components/ui/Badge.tsx intelligence-hub-app/src/components/ui/Button.tsx
git commit -m "feat(design): golden Badge active and Button primary variants"
```

---

### Task 13: Update Inputs page with warm theme

**Files:**
- Modify: `intelligence-hub-app/src/app/(app)/instances/[id]/inputs/page.tsx`

- [ ] **Step 1: Update header text**

Line 73 — Replace:
```
text-horse-gray-400
```
with:
```
text-horse-warm-muted
```

- [ ] **Step 2: Update sub-tabs background**

Line 76 — Replace:
```
bg-horse-gray-100
```
with:
```
bg-horse-warm-active
```

- [ ] **Step 3: Update inactive tab text**

Lines 83 and 99 — Replace:
```
text-horse-gray-400 hover:text-horse-gray-500
```
with:
```
text-horse-warm-muted hover:text-horse-warm-text
```

- [ ] **Step 4: Update upload CTA button (replace purple with gold)**

Line 122 — dashed border. Replace:
```
border-horse-gray-200 rounded-xl p-5 mb-6 flex items-center justify-between hover:border-horse-purple/40 hover:bg-horse-purple/[0.02]
```
with:
```
border-horse-warm-border rounded-xl p-5 mb-6 flex items-center justify-between hover:border-horse-gold/40 hover:bg-horse-gold/[0.03]
```

Line 125 — icon background. Replace:
```
bg-horse-purple/10 flex items-center justify-center group-hover:bg-horse-purple/20
```
with:
```
bg-horse-gold/10 flex items-center justify-center group-hover:bg-horse-gold/20
```

Line 126 — icon color. Replace:
```
text-horse-purple
```
with:
```
text-horse-gold
```

Line 133 — chevron color. Replace:
```
text-horse-gray-300 group-hover:text-horse-purple
```
with:
```
text-horse-warm-muted group-hover:text-horse-gold
```

- [ ] **Step 5: Update count badge styling**

Lines 86-90 — weekly count badge. Replace:
```
bg-horse-gray-200 text-horse-gray-500
```
with:
```
bg-horse-warm-active text-horse-warm-text
```

And the inactive text (line 89):
```
text-horse-gray-400
```
with:
```
text-horse-warm-muted
```

Lines 103-108 — strategic count — same pattern, replace `horse-gray-*` with warm equivalents.

- [ ] **Step 6: Commit**

```bash
git add intelligence-hub-app/src/app/(app)/instances/[id]/inputs/page.tsx
git commit -m "feat(design): warm inputs page with golden upload CTA"
```

---

### Task 14: Update StrategicDocsSection with warm theme

**Files:**
- Modify: `intelligence-hub-app/src/components/inputs/StrategicDocsSection.tsx`

- [ ] **Step 1: Update description text**

Line 36 — Replace:
```
text-horse-gray-400
```
with:
```
text-horse-warm-muted
```

- [ ] **Step 2: Update CTA button border**

Line 43 — Replace:
```
border-horse-gray-200
```
with:
```
border-horse-warm-border
```

- [ ] **Step 3: Update doc list item borders**

Line 105 — Replace:
```
bg-horse-gray-50 border border-horse-gray-200 rounded-lg px-4 py-3 group hover:border-horse-gray-300
```
with:
```
bg-horse-warm-sidebar border border-horse-warm-border rounded-lg px-4 py-3 group hover:border-[#d4c8b0]
```

- [ ] **Step 4: Update form inputs border**

Lines 65, 78 — Replace:
```
border-horse-gray-200
```
with:
```
border-horse-warm-border
```

- [ ] **Step 5: Commit**

```bash
git add intelligence-hub-app/src/components/inputs/StrategicDocsSection.tsx
git commit -m "feat(design): warm strategic docs section"
```

---

### Task 15: Final visual verification and deploy

- [ ] **Step 1: Run the dev server and visually check**

Run: `cd intelligence-hub-app && npm run dev`

Check these pages in the browser:
- `/instances/{id}/content` — Golden tabs, tinted Kanban columns, golden process button, golden pills
- `/instances/{id}/inputs` — Warm borders, golden upload CTA
- `/instances/{id}/brand-voice` — Warm borders (inherits from layout/tabs)
- Sidebar — Warm bg, golden logo, golden active border

- [ ] **Step 2: Build check**

Run: `cd intelligence-hub-app && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "feat(design): warm & golden redesign complete"
```

- [ ] **Step 4: Deploy to Vercel**

Use the Vercel deploy tool or push to trigger automatic deployment.

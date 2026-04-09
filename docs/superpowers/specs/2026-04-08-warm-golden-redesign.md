# HORSE UI Redesign — Warm & Golden Theme

**Date:** 2026-04-08
**Status:** Approved
**Direction:** Option C (Cálido y Expresivo) with golden accent `#f4c80e`

## Problem

The current UI is too homogeneous — everything is gray/neutral with no visual hierarchy. The design doesn't help users distinguish states, navigate efficiently, or identify actions. All elements have the same visual weight.

## Design Decisions

### Brand Accent: Golden `#f4c80e`

The golden accent replaces the current all-black approach. The rule is consistent:
- **Golden background + black text** for all interactive/active elements
- Never the inverse (no black bg + gold text)

### Color Palette Changes

#### New tokens to add to `tailwind.config.ts`:

| Token | Value | Usage |
|-------|-------|-------|
| `horse-gold` | `#f4c80e` | Primary accent — buttons, active pills, logo, badges |
| `horse-gold-hover` | `#e0b800` | Hover state for gold elements |
| `horse-warm-bg` | `#faf8f4` | Main content area background (replaces `#f5f5f3`) |
| `horse-warm-sidebar` | `#fffcf7` | Sidebar background |
| `horse-warm-border` | `#e8e2d5` | Warm border color (replaces gray borders) |
| `horse-warm-text` | `#8a7a66` | Secondary text in warm context |
| `horse-warm-muted` | `#a09080` | Muted text |
| `horse-warm-subtle` | `#b8a880` | Section labels |
| `horse-warm-surface` | `#f5efe4` | Hover/active backgrounds in sidebar |
| `horse-warm-active` | `#f0e8d8` | Active instance background |

#### Keep existing tokens:
- All `status-*` colors unchanged (draft `#d4a017`, review `#2d6cce`, approved `#2a9d5c`, published `#1a1a1a`)
- All `platform-*` colors unchanged
- `horse-black` `#1a1a1a` unchanged
- `horse-white` `#ffffff` unchanged

### Component-by-Component Changes

#### 1. Logo (`Sidebar.tsx`)
- **Before:** Black square, white H
- **After:** Golden `#f4c80e` square, black `#1a1a1a` H

#### 2. Sidebar (`Sidebar.tsx`)
- **Background:** `#fffcf7` (warm white, was pure white)
- **Border:** `#e8e2d5` (warm border)
- **Section labels:** `#b8a880` (warm muted)
- **Nav items:** `#8a7a66` text, hover bg `#f5efe4`
- **Active instance:** bg `#f0e8d8`, left border `3px solid #f4c80e`
- **"Nueva instancia" CTA:** dashed border `#d4c8b0`, hover border changes to `#f4c80e`

#### 3. Topbar (`InstanceTopbar.tsx`)
- **User avatar:** background `#f4c80e`, text `#1a1a1a` (was purple bg + white text)
- **Company text:** `#a09080`
- **Border bottom:** `#e8e2d5`

#### 4. Tabs (`InstanceTabs.tsx`)
- **Active tab:** underline color `#f4c80e` (was black `#1a1a1a`)
- **Active tab badge:** background `#f4c80e`, text `#1a1a1a`
- **Inactive tab badge:** background `#f0e8d8`, text `#a09080`
- **Inactive tab text:** `#a09080`

#### 5. Process Button (Content page)
- **Background:** `#f4c80e` (was `#1a1a1a`)
- **Text:** `#1a1a1a` (was white)
- **Hover:** `#e0b800`

#### 6. Week Selector (`WeekSelector.tsx`)
- **Background:** `#f4c80e` (was `#1a1a1a`)
- **Text:** `#1a1a1a` (was white)

#### 7. Platform Filter Pills (Content page)
- **Active pill:** background `#f4c80e`, text `#1a1a1a`, border `#f4c80e`
- **Inactive pill:** border `#e8e2d5`, text `#8a7a66`, bg white
- **Hover:** border `#d4c8b0`, text `#1a1a1a`

#### 8. Kanban Columns (`KanbanColumn.tsx`)
- **Draft column:** gradient bg from `#fef8e0` → white, border `#ede0b0`
- **Review column:** gradient bg from `#edf3ff` → white, border `#c8d8f0`
- **Approved column:** gradient bg from `#edfbf2` → white, border `#bce8cc`
- **Published column:** gradient bg from `#f5f5f2` → white, border `#e0e0da`
- **Count badges:** contextual colors (draft: `bg-#fef3c7 text-#92400e`, review: `bg-#dbeafe text-#1e40af`, approved: `bg-#d1fae5 text-#065f46`, published: `bg-#f0f0ee text-#555`)

#### 9. Content Cards (`ContentCard.tsx`)
- **Background:** `rgba(255,255,255,0.85)` (slightly transparent for column tint to show through)
- **Border:** `rgba(0,0,0,0.06)` (subtle)
- **Hover:** subtle shadow `0 2px 8px rgba(0,0,0,0.06)` + `translateY(-1px)`
- **Platform badges:** colored bg+text (LinkedIn: blue bg, X: gray, TikTok: pink, Blog: green)
- **Action buttons:** border `#e8e2d5`, hover border `#f4c80e`

#### 10. Stat Cards (Content page)
- **Border:** `#e8e2d5` (warm)
- **Labels:** uppercase, `#a09080`, 11px, letter-spacing 0.5px
- **Values:** colored by status (draft: `#b8960e`, review: `#2d6cce`, approved: `#2a9d5c`, published: `#1a1a1a`)

#### 11. Main Content Area Background
- **Before:** `#f5f5f3` (cool gray)
- **After:** `#faf8f4` (warm off-white)

#### 12. Global Changes
- All gray borders (`#e2e2e0`) → warm borders (`#e8e2d5`)
- All muted text → warm muted (`#a09080` or `#8a7a66`)
- Status banner, modals, and other white containers get warm borders

### Pages Affected

1. **Contenido (Kanban)** — Biggest impact: tinted columns, gold buttons/pills, warm backgrounds
2. **Inputs** — Warm borders, gold active tab, upload area warm border
3. **Insights** — Warm styling consistency
4. **Brand Voice** — Warm borders, identity fields warm styling
5. **Historial** — Warm borders and text
6. **Costos** — Warm styling consistency
7. **Ajustes** — Warm styling consistency
8. **Sidebar** — Warm bg, gold active border, gold logo
9. **Topbar** — Gold avatar, warm text

### Files to Modify

1. `tailwind.config.ts` — Add new color tokens
2. `globals.css` — Update body/base styles if needed
3. `src/components/Sidebar.tsx` — Warm bg, gold logo, gold active border
4. `src/components/InstanceTopbar.tsx` — Gold avatar, warm text
5. `src/components/InstanceTabs.tsx` — Gold underline, gold badges
6. `src/components/content/KanbanColumn.tsx` — Tinted column backgrounds
7. `src/components/content/KanbanBoard.tsx` — Pass status to columns for tinting
8. `src/components/content/ContentCard.tsx` — Transparent bg, warm borders, platform badges
9. `src/components/ui/WeekSelector.tsx` — Gold bg
10. `src/components/ui/Badge.tsx` — Update active variant
11. `src/components/ui/Button.tsx` — Gold primary variant
12. `src/components/ui/StatusDot.tsx` — No changes needed (already colored)
13. `src/app/(app)/instances/[id]/content/page.tsx` — Gold process button, gold pills, stat cards
14. `src/app/(app)/instances/[id]/inputs/page.tsx` — Warm borders, consistent styling
15. `src/components/inputs/StrategicDocsSection.tsx` — Warm styling

### What NOT to Change

- Status colors (draft yellow, review blue, approved green, published black)
- Platform colors (LinkedIn blue, X black, TikTok pink, Blog green)
- Font family (Inter)
- General spacing and layout structure
- Functionality or behavior — this is purely visual

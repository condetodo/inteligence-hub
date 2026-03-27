# Instance Creation Wizard — Design Doc

**Date:** 2026-03-27
**Status:** Approved

## Problem

Instance creation is a single flat form with 5 fields. There's no way to configure which platforms to generate content for, how much content per platform, or processing settings. All instances get the same default output (3 LinkedIn posts, 2 tweets + 1 thread, 2 TikTok scripts, 1 blog article).

## Solution

Replace the flat form with a 4-step wizard (3 config steps + 1 preview/confirm).

## Wizard Steps

### Step 1: Client Profile
The same 5 existing fields — no additions.
- Instance name (required)
- Client name (required)
- Client role (required)
- Company (required)
- Industry (required)

Rationale: Tone, objectives, and voice are discovered organically by the Digital Twin through input processing and Brand Voice distillation. Imposing them at creation conflicts with the product philosophy.

### Step 2: Platforms & Content
4 platform cards with toggle on/off + quantity configuration when active.

| Platform | Default | Configurable | Range |
|----------|---------|-------------|-------|
| LinkedIn | 3 posts × 3 variants (A/B/C) | Posts per period | 1-5 |
| X / Twitter | 2 tweets + 1 thread | Standalone tweets + threads | 1-5 tweets, 0-2 threads |
| TikTok | 2 scripts | Scripts per period | 1-4 |
| Blog | 1 article | Articles per period | 1-3 |

- A/B/C variants remain fixed (not configurable) — internal for A/B testing
- At least 1 platform must be active to proceed
- Inactive cards appear grayed out; active cards have black border + platform icon

### Step 3: Processing
- Processing period: Weekly (default) / Monthly — radio buttons
- Active window: 4-16 periods (default: 8) — slider or numeric input
  - Helper text: "How many past periods the AI uses as memory for pattern and trend detection"

### Step 4: Summary / Preview
Three blocks showing all configuration:

**Profile:** Name · Role · Company · Industry
**Content:** List of active platforms with quantities, inactive shown as crossed out
**Processing:** Period + active window

Each block has an "Edit" link back to its step. Buttons: "Back" + "Create Instance".

## UI Details

### Stepper
Horizontal stepper at the top with numbered circles connected by lines:
- Active step: black filled circle
- Completed steps: checkmark
- Pending steps: gray outline

### Navigation
- "Next" / "Back" buttons at the bottom of each step
- Only step 4 shows "Create Instance"
- Validation per step before allowing "Next"

## Backend Changes

### New Table: InstancePlatformConfig
```
model InstancePlatformConfig {
  id               String   @id @default(cuid())
  instanceId       String
  platform         Platform  // LINKEDIN, X, TIKTOK, BLOG
  enabled          Boolean   @default(true)
  postsPerPeriod   Int       @default(3)
  threadsPerPeriod Int?      // only for X
  instance         Instance  @relation(fields: [instanceId], references: [id])

  @@unique([instanceId, platform])
}
```

### Instance Creation Endpoint
POST `/instances` updated to accept optional `platforms` array and `processingPeriod`/`activeWindow`. If no platforms provided, all 4 are created with defaults.

### Content Agent Impact
The content orchestrator reads `InstancePlatformConfig` for the instance and:
- Only runs skills for enabled platforms
- Passes configured quantities to each skill
- Skills use quantity parameter instead of hardcoded counts

## Decisions Made

- **No tone/objective/language fields** — conflicts with Digital Twin philosophy. The system discovers these from inputs.
- **No reference URLs** — no scraping capability, would be a dead field.
- **A/B/C variants not configurable** — internal optimization, not user-facing.
- **Defaults are sensible** — most users can click through steps 2-3 without changing anything.

# Evacuation Planner (Evacuate.Today)

A production Next.js app for building emergency evacuation maps: upload a
floor plan, place life-safety symbols by clicking/dragging on the canvas,
paint the walkable routing layer, and get an auto-computed evacuation route
from every "You Are Here" marker to the nearest exit. Export a print-ready
one-page PDF with a legend, signatures, and bilingual (EN/ES) emergency
notes. Accounts and plans are backed by Supabase; a "Smart Route" AI chat
assistant (Claude, server-side only) can place markers and paint corridors
from a plain-English description.

This app was reconstructed from a live production deployment (evacuate.today)
after its original source was lost (empty GitHub repo, no local copy). The
landing page and CSS design system were recovered byte-for-byte from the
deployed HTML/CSS; the planner's logic was reconstructed from its compiled
JS bundle. The AI Smart Route chat is new.

## Stack

- **Next.js 16 (App Router) + React 19 + TypeScript**, plain CSS (no Tailwind)
  matching the original hand-authored design system
- **Supabase** for auth (email/password) and plan storage (`plans` table,
  row-level security scoped to `auth.uid()`)
- **pdfjs-dist** to convert an uploaded PDF floorplan to an image client-side
- **html2canvas** for the print/PDF export and for the AI assistant's canvas
  screenshot
- **A\* pathfinding** over a hand-painted walkable/blocked grid
  (`src/lib/routing.ts`), computed client-side
- **Anthropic Claude (vision)** for the Smart Route AI chat, called from a
  server-side Route Handler so the API key never reaches the browser

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY to enable AI chat
npm run dev
```

Open http://localhost:3000. `.env.local` already ships with the Supabase
project URL/key pointed at the `Fire_evac_app` project (a public/publishable
anon key, safe to commit-adjacent) so accounts and saving work out of the box.

### Enabling the AI Smart Route assistant

Set a server-side (never exposed to the browser) Anthropic API key:

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
# Optional: override the model (defaults to claude-sonnet-5)
# EVACPLAN_AI_MODEL=claude-sonnet-5
```

Without a key, the chat panel shows a clear inline "not configured" message
instead of failing silently.

## How it works

- **Sign up / sign in** — Supabase email/password auth. The dashboard lists
  your plans and autosaves each one 1.2s after every change.
- **Click to place** — pick a marker (You Are Here, Exit, Assembly Point,
  Fire Extinguisher, Pull Alarm, 3 Elevators, Fire Panel, FDC, Stairwell)
  and click the canvas. Drag any marker to reposition it.
- **Paint the routing layer** — toggle Routing Paint Mode and drag to mark
  walkable corridors, blocked areas, balconies/no-go zones, stairs, or door
  openings. Routes are only computed through walkable/stairs/door cells.
- **Smart Route AI** — describe a marker or route in plain English; the
  assistant looks at a screenshot of the current canvas and returns the
  pixel location to place a marker or a rectangle to paint.
- **Export** — "Print / Save PDF" renders a hidden, print-only one-page
  sheet (Letter landscape) with the map, legend, revision/approval
  signature lines, and bilingual emergency notes.

## Project layout

```
src/
  app/
    page.tsx              # landing page
    login/, signup/        # Supabase auth
    dashboard/              # plan list, New Plan, Sign Out
    planner/                # wraps PlannerApp in Suspense
    api/ai-route/           # server route that talks to the Anthropic API
  components/
    planner/PlannerApp.tsx  # the main planner UI and all its state
    planner/FloatingToolbox.tsx, FloatingDeleteBox.tsx, PrintSheet.tsx
    DraggableMarker.tsx, MarkerIcon.tsx, AiChatDrawer.tsx, SiteFooter.tsx
  lib/
    routing.ts               # grid + A* pathfinding
    planner-config.ts         # marker/paint tool definitions
    aiClient.ts, ai-route     # Smart Route AI plumbing
    supabaseClient.ts, plannerTypes.ts, pdfToImage.ts, fileUtils.ts
```

## Deployment

This is already deployed at **evacuate.today** via the Vercel project
`evacuation-planner-fixed`. Connect that project's Git integration to this
repository (or push via `vercel --prod`) and set `ANTHROPIC_API_KEY`,
`NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in its
environment variables.

---

Copyright 2026 - All Rights Reserved - Evacuation Planner - Prepared by: K.A. Wiley

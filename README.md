# Blueprint

The Blueprint is a wardrobe app for college students that merges closet organization, social outfit-planning, and peer-to-peer borrowing — with an environmental-impact hook (CO₂, water, and textile waste avoided by re-wearing and borrowing instead of buying new).

This repo is a clickable, fully interactive MVP built for an accelerator application. By default it's a client-only React app with realistic seed data for one user (Anna Yang, Columbia University) and four friends, so every flow in the PRD can be demoed end-to-end with zero setup. It can also run against a real Supabase backend (real accounts, a real database) — see "Connecting a real backend" below.

## Core flows

- **Onboarding** — join, connect-your-closet pitch, profile setup (public/private)
- **Digital closet** — categorized wardrobe grid, item detail with wear logging and cost-per-wear, "add item" via mocked Shop/Gmail import or manual camera entry
- **Closet impact** — CO₂ avoided, water saved, textile waste avoided, wears-logged chart, hardest-working pieces, "sitting idle" lending suggestions
- **Social fit checks** — start a fit check from your closet, group chat live voting, confirmed look
- **Peer-to-peer borrowing** — browse friends' closets, send a borrow request (with a live impact preview), approve/decline/return in the Borrows tab. The confirmed-look → "missing one piece" → borrow-request handoff is the centerpiece flow from the original design.
- **Monetization** — Blueprint Plus upsell screen (mocked; no real payment is processed)

## Tech

- React + TypeScript + Vite
- Tailwind CSS, matching the design system extracted from the original Blueprint prototype (Barlow / Barlow Condensed, navy + accent-blue palette)
- Zustand store persisted to `localStorage` — all mutations (logging a wear, sending/approving borrow requests, voting, starting a fit check) are real client-side state changes, not static mockups
- React Router for navigation

## Run it

```bash
npm install
npm run dev
```

## What's mocked vs. real for the demo

- **Real**: all state and interaction logic — add an item, it shows up everywhere it should; log a wear, impact numbers update; approve a borrow, status changes for both sides; vote and lock a look, it carries through to Confirmed Look.
- **Mocked (by design, for a client-only demo)**: the Shop/Gmail receipt integrations (clicking "connect" simulates an import rather than hitting real OAuth/APIs), group chats/live voting (still local-only — see Phase 2 below), and payment for Blueprint Plus.

## Connecting a real backend

The app ships with a Phase 1 backend integration (Supabase: Postgres + Auth), off by default. With no env vars set, everything above runs exactly as the local demo. Set two env vars and the app switches to real accounts and a real database — no other code changes needed.

**What Phase 1 covers**: real sign-up/log-in, profiles, wardrobe items, wear history, and borrow requests between real accounts. **What it doesn't (yet)**: group chats/live voting and the friend graph are still local-only mock data (Phase 2), wardrobe photos are still placeholders (no upload UI yet, Phase 3), and Blueprint Plus / Shop-Gmail import are still mocked (Phases 4–5).

Setup:

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — this creates `profiles`/`items`/`wear_log`/`borrow_requests` with row-level security and a trigger that turns every new signup into a profile row.
3. Copy `.env.example` to `.env` and fill in your project's URL and anon key (Project Settings → API).
4. Restart `npm run dev`. Splash → Join now creates a real Supabase account; "Closets Near Me" shows real items from any other accounts that have signed up and marked something lendable, since the friend graph doesn't exist yet — everyone's public lendable closet is visible to everyone, by design, until Phase 2.

Because sign-up requires only email confirmation settings you control in the Supabase dashboard, turn off "Confirm email" under Authentication → Providers while testing, or you'll need to click a confirmation email before a new account can log in.

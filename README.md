# Blueprint

The Blueprint is a wardrobe app for college students that merges closet organization, social outfit-planning, and peer-to-peer borrowing — with an environmental-impact hook (CO₂, water, and textile waste avoided by re-wearing and borrowing instead of buying new).

This repo is a clickable, fully interactive MVP built for an accelerator application. It's a client-only React app (no backend yet) with realistic seed data for one user (Anna Yang, Columbia University) and four friends, so every flow in the PRD can be demoed end-to-end.

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
- **Mocked (by design, for a client-only demo)**: authentication, the Shop/Gmail receipt integrations (clicking "connect" simulates an import rather than hitting real OAuth/APIs), and payment for Blueprint Plus. Wiring these up to a real backend (auth, Stripe/Apple Pay, Shop/Gmail APIs) is the natural next step post-accelerator.

# Pact

Personal accountability app - mobile-first Next.js PWA.

> Make commitments. Show your progress. Recover together.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- shadcn/ui primitives
- Motion, Lucide
- Convex (realtime backend)

## Develop

```bash
npm install
npx convex dev
```

In a second terminal:

```bash
npm run dev:app
```

Open [http://localhost:3000](http://localhost:3000).

First Convex run creates `.env.local` with `NEXT_PUBLIC_CONVEX_URL`. Opening Today seeds demo data automatically.

## Design system

Tokens live in `src/app/globals.css` and mirror `PACT_PRODUCT_BUILD_BLUEPRINT.md`:

- **Ink** canvas + colored surface cards
- **Volt** primary accent / oversized stats
- **Signal blue** active / FAB
- **Coral / mint / cream** status and note cards

## Backend

Convex schema and functions live in `/convex`:

- Tables: `users`, `pacts`, `pactMembers`, `commitments`, `checkIns`, `activityEvents`
- Demo seed: `npx convex run seed:seedDemo`

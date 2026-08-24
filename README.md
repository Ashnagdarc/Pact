# Pact

Pact is a mobile-first accountability PWA for making commitments, checking in on progress, and recovering from setbacks with support from trusted partners.

It supports personal tasks as well as shared pacts: users can create commitments, invite partners, record progress signals and evidence, respond to check-ins, receive reminders, and use recovery plans when progress stalls.

## Current product scope

- Personal task and commitment management with due dates, reminders, checklists, favourites, priorities, and recurring commitments
- Private, partner, and invite-only pacts with invitations and member roles
- Progress check-ins, partner responses, activity timelines, notifications, and weekly insights
- Evidence attachments, including Cloudflare R2-backed uploads when configured
- Recovery plans for blockers, with revisions and approvals
- Onboarding, sign-in, password recovery, account preferences, push-notification opt-in, calendar, search, install, offline, privacy, terms, waitlist, and beta-access flows

The repository is under active development. Features that need third-party services—for example email delivery, web push, and R2 evidence storage—require their corresponding environment configuration.

## Architecture

The frontend is a Next.js App Router application. Convex supplies the real-time application data layer, schema, scheduled reminders, and domain functions. Better Auth manages application authentication and uses PostgreSQL through `DATABASE_URL`. Server routes handle authentication, beta/waitlist actions, email-related requests, evidence-upload support, and Convex token exchange.

```
Next.js PWA (React + TypeScript)
  ├─ Better Auth + PostgreSQL for identity and sessions
  ├─ Convex for pacts, commitments, check-ins, notifications, and realtime data
  └─ Optional integrations: Brevo email, Web Push, and Cloudflare R2 evidence storage
```

## Stack

- Next.js 16.2.11, React 19, TypeScript, and Tailwind CSS 4
- Convex for application data, server functions, and scheduled work
- Better Auth with PostgreSQL for authentication
- Zod, React Hook Form, Radix-based UI primitives, Motion, and Lucide
- Progressive web app support, IndexedDB-backed offline drafts, and web push support

## Run locally

Requirements: Node.js 20+, a Convex deployment, and a PostgreSQL database for Better Auth.

```bash
npm install
cp .env.example .env.local
npx convex dev
```

In another terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `convex dev` links the local project to a Convex deployment and provides `NEXT_PUBLIC_CONVEX_URL`; configure the remaining required local values in `.env.local`. Set Convex-only variables in the Convex environment rather than exposing them to the browser.

To add demo data deliberately:

```bash
npm run seed
```

Never commit real credentials, private keys, database URLs, or service tokens.

## Project layout

- `src/app` — pages, API routes, and PWA metadata
- `src/components` — mobile-first application, onboarding, landing, and UI components
- `src/lib` and `src/hooks` — client and server utilities, validation, offline drafts, integrations, and app behaviour
- `convex` — schema, queries, mutations, actions, scheduled jobs, and server-side helpers
- `docs/audits` — implementation and deployment audit notes
- `scripts` — service-worker stamping and deployment-support scripts

## Checks

```bash
npm run lint
npm run build
```

`build` stamps the service worker before running the Next.js production build. The repository does not currently define dedicated unit-test, type-check, or end-to-end test scripts.

## Configuration notes

`.env.example` lists the Next.js environment variables used for local setup. Convex has its own server-side environment for values such as `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `BREVO_API_KEY`, `SITE_URL`, and the shared `PACT_SERVER_SECRET`. See the focused deployment notes in [`docs/audits`](docs/audits).

## License

No license is currently supplied. All rights are reserved unless the repository owner adds a license.

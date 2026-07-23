# Critical audit fixes

Date: 2026-07-23  
Scope: Critical findings only (B1, B2, B3, C1, C2, C3, F1).

## Verification summary

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **Pass** |
| ESLint on touched files | Pre-existing `react-hooks/set-state-in-effect` on onboarding screen; no new blocking errors on Convex/auth/API files |
| E2E waitlist mint / beta signup race / push permission | **Not run** — no local env (`NEXT_PUBLIC_CONVEX_URL`, `PACT_SERVER_SECRET` / Convex dashboard secret, Brevo, VAPID) |

Docs consulted: [Convex internal functions](https://docs.convex.dev/functions/internal-functions), [Convex custom JWT / `email_verified`](https://docs.convex.dev/auth/advanced/custom-jwt) + `UserIdentity.emailVerified`, [Better Auth email verification](https://www.better-auth.com/docs/concepts/email), [Next.js `metadataBase` / Open Graph / Twitter](https://nextjs.org/docs/app/api-reference/functions/generate-metadata).

---

## B1 — Public waitlist mint + consume

**Problem:** `convex/waitlist.ts` exposed `join` and `consumeInvite` as public Convex mutations. Anyone with the deployment URL could mint codes or burn invites without going through Next.

**Evidence:** `convex/waitlist.ts` (`join`, former `consumeInvite`); `src/lib/convex-http.ts` called them from the server but clients could call the same public API.

**Fix:**
- `join` now requires `secret` and calls `assertServerSecret` (`convex/lib/serverSecret.ts`).
- Removed public `consumeInvite` (replaced by `claimInvite` for B2, also secret-gated).
- Next helpers pass `getPactServerSecret()` (`src/lib/server-secret.ts`) — `PACT_SERVER_SECRET` or fallback `BETTER_AUTH_SECRET`.
- `/api/waitlist` adds best-effort IP rate limiting (8 req / 60s per instance).

**Verified:** Typecheck pass; code review that mutations throw without matching secret.

**Residual risk:** Rate limit is in-memory per serverless instance (not shared). Secret must be set in **both** Vercel and the Convex dashboard. `validateInvite` remains a public query (needed for redeem UX).

---

## B2 — Beta invite validate→signup→consume not atomic

**Problem:** Auth hooks validated the invite in `before`, then consumed in `after`. Two parallel signups could both pass validation and both create users before either consume ran.

**Evidence:** `src/lib/auth.ts` former `databaseHooks.user.create` before/after; `consumeInvite` was non-atomic relative to user create.

**Fix:**
- New `waitlist.claimInvite` mutation: secret-gated; sets `usedAt` iff unset; returns `{ claimed: false, reason }` otherwise.
- Better Auth `user.create.before` calls `claimBetaInvite` and aborts signup if claim fails.
- `/api/beta/consume` only clears the beta cookie (claim already happened at signup).

**Verified:** Typecheck pass; control-flow review of claim-before-create.

**Residual risk:** If user create fails *after* a successful claim, the invite is burned. Acceptable for beta (safer than double-use).

---

## B3 — Email verification off + Convex link-by-email takeover

**Problem:** `requireEmailVerification: false` and `ensureAppUser` linked any JWT email to an existing `users` row via `by_email`, so an attacker who signed up with a victim’s email could take over that Convex profile.

**Evidence:** `src/lib/auth.ts` (`requireEmailVerification: false`); `convex/users.ts` `ensureAppUser` email branch; Convex tokens from `/api/convex-token` lacked `email_verified`.

**Fix (least disruptive for beta):**
- Do **not** turn on full `requireEmailVerification` (would block sign-in until verify and needs UI work).
- Mint JWT with `email_verified` from Better Auth (`src/lib/convex-jwt.ts`, `/api/convex-token`, JWT plugin `definePayload`).
- `ensureAppUser` only links by email when `identity.emailVerified === true`; otherwise subject-only upsert.

**Tradeoff:** Unverified email/password users can still use the app, but cannot attach to an existing email-matched row. Google (verified) and later-verified emails can still link. Full Better Auth verification remains a follow-up for High/Medium if desired.

**Verified:** Typecheck pass; Convex `UserIdentity.emailVerified` maps from claim `email_verified`.

**Residual risk:** Unverified accounts may create a second `users` row with a duplicate email string (index is not unique). Enable verification later to close that hygiene gap.

---

## C1 — No channel prefs; every `notify()` emails + pushes

**Problem:** `notify()` always scheduled push + email with no user preference.

**Evidence:** `convex/lib/notify.ts`; `users` schema had no prefs.

**Fix:**
- Schema: optional `emailNotifications` / `pushNotifications` on `users` (undefined = on for legacy).
- `notify()` respects prefs; new users default both to `true`.
- `completeOnboarding` can persist prefs; push upsert/remove updates `pushNotifications`.

**Verified:** Typecheck pass.

**Residual risk:** No settings UI beyond onboarding / push button yet.

---

## C2 — Rescue sync on UI mount fans out email + push

**Problem:** `syncRescuePrompts` (NotificationBell / NotificationsScreen mount) called `notify()` which emailed and pushed on every new rescue row.

**Evidence:** `convex/notifications.ts` `syncRescuePrompts`; `src/components/navigation/notification-bell.tsx`; `src/components/screens/notifications-screen.tsx`.

**Fix:** Pass `channels: { inAppOnly: true }` for rescue prompt inserts.

**Verified:** Typecheck pass; code path review.

**Residual risk:** Mount-time sync still creates in-app rows (intended); dedicated scheduled rescue emails/pushes are out of Critical scope.

---

## C3 — Onboarding notification opt-in dead end

**Problem:** Finish requested Notification permission but never called `enablePush` or persisted prefs, so opt-in did nothing durable.

**Evidence:** `src/components/screens/onboarding-screen.tsx` `finish`; `completeOnboarding` ignored notification flags.

**Fix:**
- Persist `emailNotifications` / `pushNotifications` from draft / pending.
- After permission granted, call `enablePush()` (authenticated finish + pending-apply paths).
- Opt-off stores `false`; push remove clears preference when no subscriptions remain.

**Verified:** Typecheck pass.

**Residual risk:** Pending apply after signup sets `pushNotifications: true` from draft then attempts `enablePush` in onboarding pending effect; if permission was not yet granted post-signup, push may fail until user enables later (prefs still reflect intent).

---

## F1 — Missing Open Graph / Twitter / metadataBase

**Problem:** Root layout had title/description only — no `metadataBase`, `openGraph`, or `twitter`.

**Evidence:** `src/app/layout.tsx`.

**Fix:** Set `metadataBase` from `NEXT_PUBLIC_SITE_URL` (fallback `https://www.joinpact.tech`), plus Open Graph and Twitter summary cards using existing `/icons/icon-512.png`.

**Verified:** Typecheck pass; matches Next.js Metadata API docs.

**Residual risk:** OG image is the square app icon, not a dedicated 1200×630 social card.

---

## Deploy notes

1. Set `PACT_SERVER_SECRET` (same value) on Vercel **and** Convex dashboard (or rely on `BETTER_AUTH_SECRET` on both).
2. Redeploy Convex so schema prefs + waitlist mutations go live before Next depends on `claimInvite` / secret args.

---

## Status

**Critical complete — ready for High**

# High audit fixes

Date: 2026-07-23  
Scope: High findings only (B4-B9, F2-F7, C4-C8).

## Verification summary

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **Pass** |
| E2E invite email / delete account / rescue approve / waitlist unsubscribe | **Not run** - needs live Convex + Neon + Brevo + session |
| Manual UI empty-state / filter chips | Code review only |

Docs consulted:
- [Convex OCC](https://docs.convex.dev/database/advanced/occ) - no unique indexes; read-then-write + merge on collect
- [Better Auth deleteUser / beforeDelete](https://www.better-auth.com/docs/concepts/users-accounts#delete-user)
- [Next.js sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) / [robots](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) / [viewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport) (`node_modules/next/dist/docs/…`)
- [Neon connection pooling](https://neon.com/docs/connect/connection-pooling) + repo neon skill (`max` pool + pooled URL; `attachDatabasePool`)
- [Brevo transactional email `headers`](https://developers.brevo.com/docs/send-a-transactional-email) for `List-Unsubscribe`

---

## B4 - No unique constraints on logical keys

**Problem:** Convex indexes (`users.authUserId`, `pactMembers` by pact+user, waitlist email/token/code) are not uniqueness constraints. Concurrent inserts can create duplicates; `.unique()` then throws.

**Evidence:** `convex/schema.ts`; former `.unique()` paths in `convex/users.ts`, `convex/waitlist.ts`, `convex/lib/auth.ts`, invite accept membership.

**Fix:**
- `convex/lib/dedupe.ts` - collect + prefer-oldest helpers.
- `ensureAppUser`, waitlist `join`, invite accept membership, `getAppUserOrNull` / `requireAppUser` / `requirePactMember` use collect/oldest instead of `.unique()`.
- Documented: Convex still cannot enforce DB-level unique indexes.

**Verified:** Typecheck pass.

**Residual risk:** Rare duplicate `users` rows can still exist; we prefer oldest and do not auto-delete user rows (may own data). Manual cleanup if observed.

---

## B5 - Shared pact invites stay pending / last-writer-wins

**Problem:** Accept kept invite `status: "pending"` and overwrote `inviteeUserId`. Decline only logged activity.

**Evidence:** `convex/invitations.ts` accept/decline.

**Fix:** Single-use model - accept sets `status: "accepted"`; decline sets `status: "declined"` + `declinedAt`. Owner creates a new invite via `createInvite` / `ensureInvite` for another partner.

**Verified:** Typecheck pass; control-flow review.

**Residual risk:** Product change - one link can no longer onboard multiple partners. Owners must mint a fresh invite per partner.

---

## B6 - Account delete: Convex wiped before Auth; incomplete cascade

**Problem:** Profile deleted Convex first, then Auth. Auth failure left Auth user with no Convex profile. Partner-assigned commitments kept deleted `assigneeId`.

**Evidence:** `src/app/app/profile/page.tsx`; `convex/users.ts` `deleteAccountData`.

**Fix:**
- Better Auth `deleteUser.beforeDelete` calls secret-gated `users.deleteAccountDataByAuthUserId` (Auth validation first; Convex wipe before Neon row removal - [Better Auth callbacks](https://www.better-auth.com/docs/concepts/users-accounts#callbacks)).
- Profile only calls `authClient.deleteUser`.
- Cascade reassigns remaining assignee commitments to `creatorId`.

**Verified:** Typecheck pass.

**Residual risk:** If Convex wipe succeeds and Auth delete then fails, Convex data is already gone (user can re-signup). Historical `actorId` / `uploadedBy` refs on undeleted rows may still point at removed users.

---

## B7 - Invite email API: any signed-in user + any token

**Problem:** `/api/invite-email` accepted any token + client `pactTitle`; no ownership check or rate limit.

**Evidence:** `src/app/api/invite-email/route.ts`.

**Fix:**
- Secret query `invitations.getForInviteEmail` returns creator `authUserId` + DB `pactTitle`.
- Route requires `createdByAuthUserId === session.user.id`; 5 req/min per user; uses stored title; HTML escaped via shared wrapper.
- Client no longer sends `pactTitle`.

**Verified:** Typecheck pass.

**Residual risk:** In-memory rate limit is per serverless instance.

---

## B8 - Check-in / rescue / status: no idempotency; rescue applies before approve

**Problem:** Double submit duplicated check-ins; rescue applied immediately while approval stayed pending.

**Evidence:** `convex/checkIns.ts`; `convex/rescue.ts`.

**Fix:**
- Check-in / partner respond: return existing row if same signal/type within 15s.
- Rescue: apply immediately only for personal (no pact); with partners, apply on approve/acknowledge once (`appliedAt`); reject re-review when not pending.

**Verified:** Typecheck pass.

**Residual risk:** Window-based dedupe is not a client idempotency key; genuine rapid intentional double check-ins of the same signal are collapsed.

---

## B9 - Neon `pg.Pool` without limits + TLS weaken

**Problem:** Unlimited pool; `rejectUnauthorized: false` for non-local.

**Evidence:** `src/lib/auth.ts` `createDatabase`.

**Fix:** `max: 1`, `ssl: { rejectUnauthorized: true }` for non-local, `attachDatabasePool` from `@vercel/functions` (Neon skill / Fluid compute guidance). Prefer Neon `-pooler` `DATABASE_URL` in deploy.

**Verified:** Typecheck pass.

**Residual risk:** If a custom CA / unusual Postgres host fails verification, set local URL or fix certs - we no longer disable verification.

---

## F2 - No sitemap or robots

**Problem:** Missing search engine guidance.

**Fix:** `src/app/sitemap.ts`, `src/app/robots.ts` per Next Metadata file conventions. Disallow `/app/`, `/api/`, `/invite/`, `/beta/`, `/dash/`.

**Verified:** Typecheck pass.

**Residual risk:** Private app routes are disallowed but not auth-gated for crawlers that ignore robots.

---

## F3 - Viewport blocks pinch-zoom

**Problem:** `maximumScale: 1` in root viewport.

**Evidence:** `src/app/layout.tsx`.

**Fix:** Removed `maximumScale: 1` (kept width / initialScale / themeColor / viewportFit).

**Verified:** Typecheck pass.

---

## F4 - Auth/waitlist forms: placeholders, no labels

**Problem:** Sign-in and waitlist inputs used placeholder-as-label.

**Evidence:** `src/app/sign-in/sign-in-form.tsx`; `src/components/landing/landing-beta-form.tsx`.

**Fix:** Visible `<label>` wrapping each field; placeholders are hints only. Profile delete password also labeled.

**Verified:** Typecheck pass.

---

## F5 - Dead / non-functional chrome

**Problem:** Today Layout button, commitment More, decorative board More, unused `FabCluster`.

**Fix:** Removed Layout / More controls; deleted `src/components/navigation/fab-cluster.tsx`.

**Verified:** Typecheck pass; no remaining `FabCluster` imports.

---

## F6 - Today no empty state for zero focus items

**Problem:** Empty filtered list rendered blank grid.

**Evidence:** `src/components/screens/today-screen.tsx`.

**Fix:** Empty-state card with CTA to add commitment / browse pacts; filter-aware copy.

**Verified:** Typecheck pass.

---

## F7 - Today filters misleading (`due === all`)

**Problem:** “Due today” chip counted/filtered like All (`listForToday` already day-scoped).

**Fix:** Removed Due chip; kept All / Pacts / Blocked. Pacts count uses pact commitments. Filter chips expose `aria-pressed`.

**Verified:** Typecheck pass.

---

## C4 - No unsubscribe / List-Unsubscribe footers

**Problem:** Product and waitlist emails lacked unsubscribe.

**Fix:**
- HMAC tokens (`src/lib/unsubscribe-token.ts`) + `/api/unsubscribe` (GET + POST one-click).
- Waitlist welcome + Convex product mail include footer link and Brevo `headers.List-Unsubscribe` / `List-Unsubscribe-Post`.
- Secret mutation `users.setEmailNotificationsBySecret` (user prefs or waitlist `optedOutAt`).

**Verified:** Typecheck pass.

**Residual risk:** Auth transactional mail (reset/delete) intentionally has no unsubscribe. Convex ↔ Next HMAC must share `PACT_SERVER_SECRET`.

---

## C5 - Unescaped HTML in email bodies

**Problem:** Names / titles / bodies interpolated raw into HTML.

**Fix:** `escapeHtml` + `wrapEmailHtml` in `src/lib/email-html.ts` and `convex/lib/emailHtml.ts`; applied to waitlist, invite, auth, Convex notify mail.

**Verified:** Typecheck pass.

---

## C6 - Bare-bones email templates

**Problem:** Minimal `<p>` strings, inconsistent branding.

**Fix:** Shared branded dark shell (Pact mark, CTA button style, footer) for waitlist / invite / auth / product notify.

**Verified:** Typecheck pass.

**Residual risk:** Not a full design-system template set; good enough for beta transactional mail.

---

## C7 - Spec notification types never fired

**Problem:** `pact_at_risk`, `weekly_review`, evidence-style types defined but unused.

**Evidence:** `convex/lib/notificationTypes.ts`.

**Fix:**
- `refreshPactHealth` notifies partners on transition into `at_risk`.
- Weekly review completion inserts `weekly_review` in-app (inAppOnly).
- Evidence attach notifies partners as `evidence_uploaded` (added to union).

**Verified:** Typecheck pass.

**Residual risk:** `pact_at_risk` only fires when `refresh` runs (not on every background health recompute unless that path calls `refreshPactHealth`).

---

## C8 - Dual runtime Brevo env; Convex silent skip

**Problem:** Next threw in production without `BREVO_API_KEY`; Convex only `console.warn` and returned `{ sent: false }`.

**Evidence:** `convex/email.ts` vs `src/lib/email.ts`.

**Fix:** Convex logs error and throws when Brevo missing on production-like deploy (`SITE_URL` includes `joinpact.tech`, `BREVO_REQUIRED=1`, or `CONVEX_ENVIRONMENT=production`). Align both runtimes to set `BREVO_API_KEY` + `EMAIL_FROM` (+ Convex `SITE_URL`).

**Verified:** Typecheck pass.

**Residual risk:** Local Convex without Brevo still soft-skips unless production markers are set.

---

## Deploy notes

1. Set `PACT_SERVER_SECRET` on Vercel **and** Convex (unsubscribe HMAC + invite email lookup + account delete cascade).
2. Set `BREVO_API_KEY` on both; set Convex `SITE_URL` to the public origin.
3. Prefer Neon pooled `DATABASE_URL` (`-pooler`); TLS verification is now strict.
4. Redeploy Convex schema (`waitlistSignups.optedOutAt`) before relying on waitlist unsubscribe.

---

## Status

**High complete - ready for Medium**

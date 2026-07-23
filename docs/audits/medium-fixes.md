# Medium audit fixes

Date: 2026-07-23  
Scope: Medium findings only (F8–F14, B10–B16, C9–C11).

## Verification summary

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **Pass** |
| E2E waitlist / Today empty / New flow / legal pages / mute | **Not run** — needs browser + live Convex/Brevo |
| Manual reduced-motion / proxy session | Code review only |

Docs consulted:
- [Next.js JSON-LD](https://nextjs.org/docs/app/guides/json-ld) — native `<script type="application/ld+json">`
- [Better Auth Next.js proxy](https://www.better-auth.com/docs/integrations/next#auth-protection) — `auth.api.getSession` on Next 16 proxy
- [Convex indexes](https://docs.convex.dev/database/indexes) — range queries / `take` / optional fields
- Brevo `PUT /v3/contacts/{identifier}` with `listIds` (MCP `contacts_update_contact`)
- `Intl.DateTimeFormat` for IANA timezone day bounds (no new deps)

Critical/High not regresssed intentionally (waitlist secret gate + IP rate limit kept; email escape/unsubscribe kept).

---

## F8 — Landing SEO heading semantics

**Problem:** Rotating line was the sole `<h1>`; brand “Pact” was a `<p>`.

**Evidence:** `landing-page.tsx`, `landing-dynamic-headline.tsx`.

**Fix:** Static brand `<h1>Pact</h1>`; rotator is a supporting `<p aria-live="polite">`. Light `SoftwareApplication` JSON-LD on `src/app/page.tsx`.

**Verified:** Typecheck pass.

**Residual risk:** JSON-LD is minimal (no dedicated OG social image beyond Critical).

---

## F9 — Feature list labels-only

**Problem:** Differentiators were title-only chips.

**Evidence:** `landing-page.tsx` `differentiators`.

**Fix:** One-sentence blurb under each of the six items.

**Verified:** Typecheck pass.

---

## F10 — Privacy/Terms framed as in-app screens

**Problem:** Legal pages used `AppShell` + “Back to profile”.

**Evidence:** `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`.

**Fix:** Marketing wrapper (no tabs), page `metadata`, “Back to home” → `/`.

**Verified:** Typecheck pass.

---

## F11 — Low-contrast / tiny UI text

**Problem:** Secondary copy often `white/40–55`; bottom tabs `text-[10px]`.

**Evidence:** Landing, tabs, Today loading copy.

**Fix:** Raised secondary floors toward `white/65–70` on landing/Today/profile; bottom tab labels `text-xs` (≥12px).

**Verified:** Typecheck pass.

**Residual risk:** Not every `white/45` in deep app screens was rewritten — floor applied to highest-traffic chrome.

---

## F12 — Today home cognitively heavy

**Problem:** Empty/new users still saw prompt + stats + filters + boards chrome.

**Evidence:** `today-screen.tsx`.

**Fix:** When zero commitments, tasks, and boards — show a single start card (prompt + CTAs). Full chrome only when there is content.

**Verified:** Typecheck pass.

---

## F13 — New flow too complex

**Problem:** Title, note, due, where, assignee, evidence, color all visible vs “under 10 seconds”.

**Evidence:** `new-commitment-screen.tsx`.

**Fix:** Default UI = title + due. Everything else behind “More options” (opens if `pactId` query present).

**Verified:** Typecheck pass.

---

## F14 — prefers-reduced-motion incomplete

**Problem:** Intervals / AnimatePresence still ran with reduced motion.

**Evidence:** Headline, hero device, Today prompt, welcome stack, beta countdown.

**Fix:** Central `usePrefersReducedMotion` hook; gate intervals and AnimatePresence; hero uses the hook.

**Verified:** Typecheck pass.

**Residual risk:** Onboarding step transitions still use AnimatePresence (no continuous interval); acceptable for Medium.

---

## B10 — Waitlist HTTP returns invite secrets

**Problem:** JSON returned `code` + `accessUrl`.

**Evidence:** `/api/waitlist`, `landing-beta-form.tsx`.

**Fix:** Response is email-only success (`ok`, `email`, `name`, `alreadyJoined`). Secrets only in email. IP rate limit from Critical kept. CAPTCHA deferred (rate limit already present).

**Verified:** Typecheck pass; JoinedPanel no longer shows code/link.

**Residual risk:** No CAPTCHA — shared serverless rate-limit memory.

---

## B11 — Proxy gate cookie-presence only

**Problem:** `getSessionCookie` only checked presence.

**Evidence:** `src/proxy.ts`.

**Fix:** `auth.api.getSession({ headers: request.headers })` on Next 16 proxy. Client soft-land: if session exists but Convex JWT never authenticates, clear JWT cache, sign out, redirect `/sign-in` (no forever loading).

**Verified:** Typecheck pass.

**Residual risk:** Proxy session check hits Auth DB per matched request (intentional tradeoff).

---

## B12 — Dual auth clocks / JWT cache

**Problem:** Module JWT cache not keyed by user; survived sign-out/user switch.

**Evidence:** `convex-client-provider.tsx`.

**Fix:** Cache `{ token, expMs, userId }`; clear on user change / sign-out (`clearConvexJwtCache`).

**Verified:** Typecheck pass.

---

## B13 — weeklyReviews keyed by pact+week not user

**Problem:** Pact weekly review lookup used `by_pact_week` — last writer won across users.

**Evidence:** `convex/insights.ts`, `schema.ts`.

**Fix:** Index `by_pact_user_week` (`pactId`, `userId`, `weekStart`); `ensureReview` uses it. Kept `by_pact_week` for legacy rows.

**Verified:** Typecheck pass.

**Residual risk:** Deploy Convex schema before relying on new index in production.

---

## B14 — Reminder cron full-table scans

**Problem:** `deliverDue` collected all commitments/tasks.

**Evidence:** `convex/reminders.ts`.

**Fix:** Indexes `commitments.by_reminderAt` / `tasks.by_reminderAt`; query `reminderAt` in `[0, now]`.

**Verified:** Typecheck pass.

**Residual risk:** Rows with `reminderAt` unset are excluded (intended). Still filters `reminderSentAt` / status in JS.

---

## B15 — Notification queries load-all-then-filter

**Problem:** `listForUser` / `unreadCount` / `markAllRead` collected all user notifications.

**Evidence:** `convex/notifications.ts` (index `by_user_readAt` already existed).

**Fix:** List uses `.order("desc").take(limit)`. Unread / mark-all use `by_user_readAt` + `eq("readAt", undefined)`. Rescue sync takes last 200 instead of full collect.

**Verified:** Typecheck pass.

**Residual risk:** Convex optional-undefined index semantics depend on field absence; matches current insert path (no `readAt` until marked).

---

## B16 — Timezone field unused

**Problem:** Today bounds used server local `setHours`.

**Evidence:** `commitments.listForToday`, `tasks.listForToday`; `users.timezone`.

**Fix:** `convex/lib/time.ts` `dayBoundsInTimeZone` via `Intl`; Today queries use `user.timezone`.

**Verified:** Typecheck pass.

**Residual risk:** Week stats / rescue dayKey still use server-local calendar; only Today day bounds fixed as scoped.

---

## C9 — Brevo contacts sync early-return

**Problem:** On “Contact already exist”, sync returned without adding to list.

**Evidence:** `addToBrevoList` in waitlist route.

**Fix:** On 400 already-exists, `PUT /v3/contacts/{email}` with attributes + `listIds`.

**Verified:** Typecheck pass.

**Residual risk:** Brevo IP allowlist can still 401 (best-effort sync, email already sent).

---

## C10 / C11 — Haptics / sound mute + reduced motion

**Problem:** Vibration/sound ignored a11y mute and reduced motion; no persistent mute.

**Evidence:** `haptics.ts`, `ui-sounds.ts`, `feedback.ts`.

**Fix:** `feedback-prefs.ts` — `shouldMuteFeedback()` checks localStorage mute + `prefers-reduced-motion`. Profile toggle “Mute sounds & haptics”. Feedback/haptics/sounds all gate through it.

**Verified:** Typecheck pass.

---

## Deploy notes

1. Redeploy Convex so new indexes (`by_reminderAt`, `by_pact_user_week`) backfill before cron/reviews rely on them.
2. Confirm Better Auth works in Next 16 `proxy` with Node (session DB check).

---

## Status

**Medium complete — ready for Low**

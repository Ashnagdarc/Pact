# Low audit fixes

Date: 2026-07-23  
Scope: Low findings (F15-F17, C12, B17 + quick extras).

## Verification summary

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **Pass** |
| Manual skip-link / Heart / Shelve copy / check-in haptic | Code review only |
| SW notification click / email-status auth | Code review only |

Critical / High / Medium not intentionally regressed.

---

## F15 - “How it works” nav hidden on small screens

**Problem:** Header “How it works” used `hidden … sm:inline`, so small screens lost the nav link.

**Evidence:** `landing-page.tsx` header nav.

**Fix:** Left as intentional mobile pattern. Hero already exposes a primary secondary CTA **“See how it works”** (`#how`) on all breakpoints; header stays Join-beta-first to avoid crowding.

**Verified:** Code review.

**Residual risk:** Users who skip the hero CTA must scroll; acceptable for marketing density.

---

## F16 - Decorative heart looks interactive

**Problem:** Commitment cards showed a Heart in a round hit-target styling without a favorite toggle.

**Evidence:** `commitment-card.tsx`; `favorited` exists in schema but no UI/mutation to toggle from the card.

**Fix:** Removed Heart UI and the unused `favorited` prop from `CommitmentCard`; callers no longer pass it.

**Verified:** Typecheck.

**Residual risk:** `favorited` remains on Convex models for a future feature; unused in UI.

---

## F17 - No skip link / main landmark

**Problem:** Root layout had no skip-to-content; AppShell wrapped content in a generic `div`.

**Evidence:** `layout.tsx`, `app-shell.tsx`.

**Fix:**
- Skip link in root layout → `#content` (visible on focus).
- AppShell children wrapped in `<main id="content">`.
- Landing `<main id="content">` for marketing pages.

**Verified:** Typecheck.

**Residual risk:** Auth/marketing pages outside AppShell that lack `#content` still get a skip link that may no-op until focusable content exists - landing and app shells covered.

---

## C12 - Feedback thin in core loop

**Problem:** Onboarding used rich haptics/sounds; check-in success was silent.

**Evidence:** `commitment-detail-screen.tsx` `sendSignal`; Medium mute/reduced-motion gate in `shouldMuteFeedback`.

**Fix:** After successful `submitCheckIn`, `playFeedback({ sound: "success", haptic: "success" })` - respects mute + `prefers-reduced-motion`.

**Verified:** Typecheck.

**Residual risk:** Failed check-ins still silent (no error haptic by design).

---

## B17 - Rescue `remove` only pauses

**Problem:** Recovery action labeled “Remove” but only set `status: "paused"` (commitments have no `cancelled` status).

**Evidence:** `convex/rescue.ts` `remove` case; `src/lib/rescue.ts` labels.

**Fix:** Renamed user-facing copy to **Shelve**; hints clarify pause semantics; backend note text uses “Shelved via rescue…”.

**Verified:** Typecheck.

**Residual risk:** Action key remains `remove` in API/schema for compatibility; UI says Shelve. True hard-delete/cancel would need a new commitment status.

---

## Extra Low items (quick)

### Email-status exposure

**Problem:** `GET /api/email-status` was public and revealed Brevo readiness per flow.

**Fix:** Requires `Authorization: Bearer <PACT_SERVER_SECRET|BETTER_AUTH_SECRET>`.

**Residual risk:** Ops callers must send the header.

### SW notification click navigation

**Problem:** Click handler called `navigate` without awaiting / absolute URL hygiene.

**Fix:** Resolve absolute URL; await `navigate` when present; else focus; else `openWindow`.

### Unused mono font token

**Problem:** `--font-mono: var(--font-geist-mono)` referenced an unloaded Geist Mono variable.

**Fix:** Removed dead `--font-mono` from `@theme` in `globals.css`.

### Phone-only shell / auth verification note

**Deferred (documented intentional):**
- App chrome stays `max-w-md` phone composition by product design (PWA / mobile-first).
- Email verification UX copy was already covered under Critical auth/`email_verified` work; no extra Low UI note required this turn.

---

## Deploy notes

- Set **`PACT_SERVER_SECRET`** (or shared `BETTER_AUTH_SECRET`) on Vercel **and** Convex for waitlist + email-status.
- Redeploy Convex after `convex/rescue.ts` note-string change.
- Clients may need a refresh to pick up `public/sw.js` notification-click behavior.

---

## Rollup

| Severity | Doc |
| --- | --- |
| Critical | `docs/audits/critical-fixes.md` |
| High | `docs/audits/high-fixes.md` |
| Medium | `docs/audits/medium-fixes.md` |
| Low | `docs/audits/low-fixes.md` |

**Low complete - full severity ladder done**

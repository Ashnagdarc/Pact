# Pact capacity & scaling audit

**Date:** 2026-07-23  
**Scope:** This repo’s actual stack + current official plan limits (Neon, Convex, Vercel, Cloudflare free for verdict only).  
**No app code changes.** Do not treat marketing MAU claims as capacity - numbers below are beta/PWA realistic.

Sources (verified July 2026):

- [Neon plans](https://neon.com/docs/introduction/plans)
- [Convex pricing](https://www.convex.dev/pricing) · [Convex limits](https://docs.convex.dev/production/state/limits) · [Convex file uploads](https://docs.convex.dev/file-storage/upload-files)
- [Vercel limits overview](https://vercel.com/docs/limits/overview)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/) · [R2 pricing / free tier](https://developers.cloudflare.com/r2/pricing/)

---

## A. Current stack map

| Layer | What Pact uses | What it stores / does |
| --- | --- | --- |
| **Hosting** | Vercel (Next.js 16 App Router PWA) | UI, API routes (`/api/*`), Better Auth handlers |
| **Auth DB** | **Neon Postgres** via `DATABASE_URL` + `pg` Pool (`max: 1`) + `attachDatabasePool` | Better Auth sessions/users only - not app domain data |
| **App DB** | **Convex** (deployment linked via `NEXT_PUBLIC_CONVEX_URL`) | Users, pacts, commitments, check-ins, notifications, waitlist, etc. |
| **File uploads** | **Convex file storage** (`ctx.storage.generateUploadUrl`) | Evidence images/PDFs (`evidence` table → `_storage`) |
| **Not used** | `@vercel/blob`, Cloudflare Workers/R2, Neon Object Storage | - |
| **Email / push** | Brevo (transactional) + Web Push | Outside DB capacity; watch Brevo quotas separately |
| **Cron** | Convex `crons.ts` every **15 minutes** → `reminders.deliverDue` | Reminder fan-out; counts toward Convex function calls |

Privacy copy confirms evidence lives in Convex storage (`src/app/privacy/page.tsx`).

**Implication:** Neon capacity ≠ app capacity. Almost all beta growth pressure hits **Convex** (documents, file storage, egress, concurrent sessions) and secondarily **Vercel** (SSR/API + bandwidth). Neon only grows with auth users/sessions.

---

## B. Realistic capacity (beta / PWA)

Assumptions for a Pact-like beta:

- ~2-5 active commitments per user; ~1 check-in/day when engaged  
- Occasional evidence: ~0.5-2 MB compressed image or PDF per upload; ~2-5 uploads/user/month early  
- Live clients hold Convex websocket subscriptions while the PWA is open  
- Reminder cron: 96 runs/day + work proportional to due reminders  

### Neon (auth only)

| Plan | Storage | Compute | Egress | Auth-relevant note |
| --- | --- | --- | --- | --- |
| **Free** | 0.5 GB/project | 100 CU-hours/project/mo; autoscaling ≤ 2 CU; scale-to-zero 5 min | 5 GB/mo | Auth tables for tens of thousands of users typically stay well under 0.5 GB |
| **Launch** | $0.35/GB-mo (usage) | $0.106/CU-hour; ≤ 16 CU | 500 GB included then $0.10/GB | Pay-as-you-go; disable scale-to-zero if cold starts hurt sign-in |
| **Scale** | same storage $ | Higher CU rate; fixed sizes up to 56 CU | same egress pattern | Compliance / SLA when needed |

**Auth-user estimate (Free Neon):** Practically **10k-50k+ registered users** before Neon storage is the issue (sessions + Better Auth schema are tiny). Bottlenecks are more often **CU-hours** (always-warm traffic) or **connection churn** - mitigated already by pooled URL + `max: 1` pool.

### Convex (app + files) - primary limit

| Resource | Free (hard caps) | Starter (same S16, pay overage) | Professional |
| --- | --- | --- | --- |
| DB storage | **0.5 GB** | 0.5 GB included | 50 GB included |
| File storage | **1 GB** | 1 GB included | 100 GB included |
| Function calls | **1M / mo** | 1M included | 25M included |
| DB I/O / egress | **1 GB / mo** each | included + overage | 50 GB included |
| Concurrent sessions | **1,000** (S16) | 1,000 | **10,000** (S256) |
| Concurrent queries / mutations | **16** | 16 | **256** |
| Concurrent actions | **64** | 64 | 512 |

**Active-user estimates (Free Convex, Pact patterns):**

| Metric | Rough free-tier ceiling | Why |
| --- | --- | --- |
| **Simultaneous open PWA clients** | **~500-1,000** | Hard cap 1,000 concurrent sessions |
| **Monthly engaged users (DAU-ish)** | **~200-800** comfortable; **~1k-2k** if light + few evidence views | Function calls + egress from live queries and file URLs |
| **Evidence storage** | **~500-2,000 photos** at ~0.5-2 MB | **1 GB file storage** fills first for media-heavy use |
| **Document DB** | Tens of thousands of check-ins/commitments easily in 0.5 GB | Text/metadata is cheap vs files |

Cron alone is cheap (~3k invocations/mo). Risk is **subscription churn + evidence egress** when partners open shared commitment UIs with images.

**Starter vs Free:** Same concurrency class (S16). Upgrade to Starter when you hit Free hard caps and want pay-as-you-go; upgrade to **Professional** when you need **>1k concurrent sessions** or sustained >16 concurrent queries.

### Vercel (Hobby vs Pro)

| | Hobby | Pro |
| --- | --- | --- |
| Fast Data Transfer | **100 GB**/mo | **1 TB** included |
| Function invocations | **1M**/mo | usage-based |
| Active CPU / memory | 4 CPU-hrs / 360 GB-hrs | usage-based |
| Concurrent builds | 1 | up to 500 |

Auth + thin API routes: Hobby supports a **small beta (hundreds of daily actives)** if assets are mostly CDN-cached. Landing + PWA shell dominate bandwidth before Neon/Convex do. Move to Pro when transfer/invocations hit fair-use or you need team features.

---

## C. Load balancing

**What you already get (no DIY LB needed):**

- **Vercel Edge Network** - global CDN for static/SSR front door  
- **Convex** - managed realtime backend with regional deployment; concurrency classes scale with plan  
- **Neon** - serverless Postgres + pooler endpoint (repo already prefers `-pooler`)

**What you do *not* need yet:**

- Cloudflare Load Balancing / custom multi-region Postgres  
- Self-managed Redis for session stickiness  
- Moving the Next app onto Cloudflare Workers Free (would fight Better Auth + `pg` + Next App Router assumptions)

Load balancing becomes a product decision only after Convex Pro / Neon Launch and you still see regional latency or read-heavy fan-out - then Neon **read replicas** or Convex higher deployment class, not Cloudflare free.

---

## D. Media upload capacity

### In this codebase

| Control | Reality |
| --- | --- |
| UI `accept` | `image/*,application/pdf` only - **no video** in picker |
| Client size check | **None** (no max MB validation) |
| Server MIME/size check | **None** in `convex/evidence.ts` beyond auth + commitment access |
| Upload path | Convex `generateUploadUrl` → POST file → `attach` stores `storageId` |

### Platform caps

| Constraint | Limit |
| --- | --- |
| Convex upload URL POST | **No file-size cap**; **2-minute request timeout** ([docs](https://docs.convex.dev/file-storage/upload-files)) |
| Convex HTTP-action upload alternate | **20 MB** body (not used by Pact today) |
| Convex Free file storage | **1 GB total** |
| Convex Free file egress | **1 GB / month** |

**Video feasibility:** Platform can accept large files via upload URLs if you change `accept` and add validation - but **Free 1 GB storage + 1 GB egress** makes video a non-starter for beta. Even short clips blow the budget. Prefer images/PDFs; compress client-side; add an app max (e.g. 5-10 MB) before enabling video. For video at scale, move blobs to **R2 / Vercel Blob / Neon Object Storage** and keep Convex IDs as pointers.

---

## E. Scale-up playbook (thresholds)

Upgrade in this order for *this* stack:

1. **Convex Free → Starter** when dashboard shows approaching hard caps (file storage, function calls, egress) and you want overages instead of hard fail.  
2. **Convex → Professional ($25/dev)** when **concurrent sessions → ~800-1,000** or mutations/queries queue under load (S16 → S256).  
3. **Neon Free → Launch** when auth compute suspends (100 CU-hours), storage >0.5 GB, or cold starts hurt sign-in (disable scale-to-zero). Neon stays auth-only - don’t expect this to fix app latency.  
4. **Vercel Hobby → Pro** when Fast Data Transfer / invocations approach Hobby limits or you need production team controls.  
5. **Add object storage CDN (R2 or Vercel Blob)** when evidence **file storage or egress** dominates Convex bills, or you enable video. Keep Convex as source of truth for metadata.  
6. **Neon Scale / Convex Business** only for compliance, SLA, or dedicated hardware - not for early beta.

### Concrete watch metrics

| Signal | Action |
| --- | --- |
| Convex file storage > ~70% of 1 GB | Compress uploads; delete orphaned files; Starter or offload to R2 |
| Convex egress spikes when opening evidence | Thumbnail strategy / CDN offload |
| Concurrent sessions near 1,000 | Convex Professional |
| Neon compute suspended mid-month | Launch plan or lower idle wakeups |
| Reminder cron scanning huge due sets | Already indexed (`by_reminderAt`); still watch function time / docs scanned |

---

## F. Cloudflare free - verdict

### **Do NOT switch to Cloudflare free now**

Reasons tied to this repo:

1. **App data and evidence already live on Convex** - Cloudflare Free does not replace Convex DB, realtime, or file storage.  
2. **Auth already lives on Neon + Better Auth on Vercel** - moving to Workers Free (100k req/day, 10 ms CPU on free) is a rewrite, not a toggle.  
3. **Hosting is Vercel** - you already get a global CDN. Cloudflare Free as a DNS/proxy in front can be added later for WAF/caching; it is optional polish, not capacity.  
4. **R2 free tier (10 GB storage, free egress)** is useful **later** if evidence/video outgrows Convex file storage - as an *add-on*, not a platform swap.

**When Cloudflare free *would* make sense:** proxy `www.joinpact.tech` for caching/WAF, or stand up an R2 bucket for media once Convex file GB/egress becomes the bill driver - **without** migrating Neon or Convex.

---

## Summary table (beta planning)

| Question | Answer for Pact today |
| --- | --- |
| DB max capacity | Neon Free 0.5 GB (auth); Convex Free **0.5 GB docs + 1 GB files** (app) |
| Active users | Comfortable beta: **~200-800 engaged**; hard realtime ceiling **~1k concurrent** on Convex Free |
| Load balancing | Inherited from Vercel + Convex (+ Neon pooler); no custom LB needed |
| Uploads | Images/PDF via Convex; no app size cap; Free **1 GB** files; video not UI-enabled and not free-tier friendly |
| Scale up | Convex first (Starter → Pro), then Neon Launch if auth compute bites, then R2/Blob for media |
| Cloudflare free now? | **No** - optional CDN/R2 later, not a stack swap |

# Free-tier options for a longer unpaid Pact beta

**Date:** 2026-07-23  
**Scope:** Research + recommendation only. No migrations. Companion to [capacity-scaling.md](./capacity-scaling.md).  
**Method:** Official pricing/limits pages verified via browser + docs fetch (Jul 23, 2026).

---

## 1. Current stack (confirmed from repo)

| Layer | Service | Role |
| --- | --- | --- |
| Hosting | Vercel (Next.js App Router PWA) | UI, API routes, Better Auth handlers |
| Auth DB | Neon Postgres (`DATABASE_URL`) | Better Auth users/sessions only |
| App DB + realtime | Convex | Pacts, commitments, check-ins, notifications, waitlist, crons |
| Evidence files | Convex file storage | Images/PDFs via `generateUploadUrl` |

**Implication:** Almost all beta growth pressure hits **Convex** (file storage, egress, concurrent sessions, function calls). Neon/auth is not the bottleneck. See capacity audit for ~200-800 engaged users / ~1k concurrent PWA clients on Convex Free.

---

## 2. Comparison table (free / near-free)

Numbers are **free-tier** unless noted. Migration cost is relative to Pact’s Convex-first app layer.

| Contender | DB free | File free | Egress / bandwidth | Concurrent / MAU | Realtime | Auth fit | Migrate cost | Verdict for Pact |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Convex Free (current)** | 0.5 GB | **1 GB** | 1 GB egress | **1,000** sessions; 1M fn calls | Native (reactive) | Keep Better Auth + Neon | - | Best realtime; files/egress bite first |
| **Convex Starter** | same included | same included | same included | same S16 (1k sessions) | Same | Same | **None** | **$0/mo base** + cheap overages (e.g. files ~$0.033/GB) |
| **Convex Professional** | 50 GB incl. | 100 GB incl. | 50 GB egress | **10,000** sessions (S256) | Same | Same | None | **$25/dev/mo** - only when concurrency needs S256 |
| **Supabase Free** | 500 MB | **1 GB** | 5 GB + 5 GB cached | 50k MAU; realtime **200** peak | Yes (Postgres Changes) | Would replace or conflict with Better Auth story | **High** | Same file GB as Convex; **worse** realtime concurrent; pauses after 1 week idle |
| **Cloudflare R2 Free** | n/a (object only) | **10 GB** | **Egress free** | Ops: 1M Class A / 10M Class B | n/a | Keep current auth | **Low-medium** (files only) | **Best free add-on** for evidence |
| **Cloudflare Workers + D1 Free** | D1 500 MB/DB, 5 GB acct | via R2 | Workers egress free; 100k req/day | Workers Free CPU 10 ms | Durable Objects need Paid ($5/mo min) | Rewrite auth/hosting | **Very high** | Not a drop-in Convex replacement |
| **Firebase Spark** | Firestore 1 GiB; RTDB 1 GB | Storage **not on Spark** | Firestore 10 GiB; RTDB 10 GB | RTDB **100** simultaneous | Firestore/RTDB | Replace Better Auth | **Very high** | Evidence storage needs Blaze; RTDB concurrent weaker |
| **Appwrite Cloud Free** | Docs unlimited (read/write quotas) | **2 GB** | 5 GB bandwidth | 75k MAU; realtime **250** | Yes | Replace / dual auth | **High** | Slightly more file GB; weaker concurrent RT; pauses after idle |
| **PocketBase + Oracle Always Free** | Disk on VM (e.g. Ampere 12 GB RAM / ARM cores) | On VM disk | OCI Always Free egress up to **10 TB**/mo (account-level) | Self-managed | Built-in realtime | Replace or dual | **Very high** + ops | Generous hardware; not “free team time”; reliability on you |
| **Fly.io** | Usage $ | Usage $ | Usage $ | - | DIY | - | High | **No free forever** always-on; card required |
| **Railway** | Trial **$5** credit once | - | Usage $ | - | DIY | - | High | Trial ≠ free beta; then Hobby **$5/mo** |
| **Neon Free (keep)** | 0.5 GB | Object Storage beta (separate) | 5 GB | Auth MAU generous | n/a for app RT | **Already fits** Better Auth | - | Keep for auth; don’t expect it to absorb Convex load |

### Sources (verified 2026-07-23)

- [Convex pricing](https://www.convex.dev/pricing) · [Convex limits](https://docs.convex.dev/production/state/limits)
- [Supabase pricing](https://supabase.com/pricing)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/) (docs updated May 28, 2026)
- [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) · [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) · [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [Firebase pricing](https://firebase.google.com/pricing)
- [Appwrite pricing](https://appwrite.io/pricing)
- [Neon plans](https://neon.com/docs/introduction/plans)
- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Fly.io pricing](https://fly.io/docs/about/pricing/)
- [Railway pricing](https://railway.com/pricing)
- [PocketBase](https://pocketbase.io/)

---

## 3. Contender notes (honest)

### Convex Free vs Starter vs Professional

- **Free** = hard caps (mutations fail / limits bind when included amounts are exhausted).
- **Starter** = same included amounts and **same S16 concurrency (1,000 sessions)** but **pay-as-you-go** beyond caps. Entry price is effectively **$0/month** until you overage.
- **Professional** = **$25 per developer/month**, S256 (**10k** concurrent sessions), much larger included quotas. Only needed when Free/Starter concurrency or included quotas are too small.

For a long unpaid beta, **Starter is the cheapest “escape hatch”** if Free hard-caps - often cents to a few dollars if evidence is the only overage.

### Supabase Free

- File storage **1 GB** - **not more** than Convex Free.
- Realtime peak connections **200** vs Convex **1,000** - a **regression** for a live collaborative PWA.
- Projects **pause after 1 week of inactivity**.
- Full migrate = rewrite Convex queries/mutations/subscriptions + schema + evidence + crons. **Weeks of work** for no free-tier win on files/realtime.

### Cloudflare (hybrid vs full)

- **R2 Free: 10 GB storage, free egress** - clearly beats Convex Free’s 1 GB files + 1 GB egress for evidence.
- Full Workers + D1 + realtime stack is a **rewrite**; Durable Objects / serious realtime typically implies **Workers Paid ($5/mo minimum)**.
- Capacity audit already ruled out “switch everything to Cloudflare Free.” That still holds. **R2 as evidence bucket does not.**

### Firebase Spark

- Firestore quotas look OK for light docs; **Cloud Storage is not available on Spark** (Blaze required for file buckets).
- Realtime Database: **100** simultaneous connections on Spark.
- Migration off Convex is a full rewrite. **Not a better free path for Pact evidence + realtime.**

### Appwrite Free

- **2 GB** storage is slightly better than Convex’s 1 GB.
- Realtime **250** concurrent - still worse than Convex’s 1,000.
- Idle pause + high migration cost. Not worth a full rewrite for +1 GB files.

### PocketBase / self-host (Oracle / Fly / Railway)

- **Oracle Always Free** can host PocketBase with real disk and generous egress - closest to “more free forever” capacity.
- Cost shifts to **ops**: backups, TLS, updates, uptime, abuse, multi-region.
- Fly/Railway are **usage-priced** (Railway: one-time $5 trial). Not a free multi-month beta plan.
- Migration cost **very high** and product risk high for a solo unpaid beta.

### Neon

- Keep Free for Better Auth. Auth user volume is not the limiting factor.
- Do **not** migrate app data to Neon to “get more free” - you’d rebuild realtime yourself.

---

## 4. Strategy options

### Option A - Stay on Convex Free + stretch

- Client-compress evidence images; enforce max upload size (e.g. 1-5 MB).
- Delete orphaned / old evidence; avoid serving full originals in lists (thumbnails later).
- Keep reminder fan-out lean (already improved).
- Watch Convex dashboard: file GB, egress GB, function calls, concurrent sessions.

**Best when:** beta is still light on photos and concurrent users ≪ 1k.

### Option B - Cheapest paid bump

1. **Convex Starter ($0 base + overages)** when Free hard-caps bind - usually first on files/egress.  
2. **Convex Professional ($25/dev)** only when approaching **~1k concurrent sessions** or sustained query concurrency pain.  
3. Neon Launch / Vercel Pro later if auth compute or Hobby bandwidth bites (secondary).

**Best when:** you need continuity without rewriting, and a few $/mo is acceptable.

### Option C - Hybrid free (recommended primary path)

**Keep:** Vercel + Neon (Better Auth) + Convex (app data + realtime).  
**Add:** Cloudflare **R2 Free** for evidence blobs; store R2 keys/URLs in Convex documents instead of `ctx.storage`.

| Win | Detail |
| --- | --- |
| File capacity | 1 GB → **10 GB** free |
| Egress | Convex file egress 1 GB/mo → R2 **$0 egress** |
| Realtime | Unchanged (Convex 1k sessions) |
| Auth | Unchanged |
| Effort | Days-~1 week for upload/sign/serve path - **not** a backend rewrite |

### Option D - Full migrate only if…

Only consider Supabase / Appwrite / Firebase / PocketBase if you are **already rewriting** the backend for product reasons. Free tiers do **not** clearly beat Convex Free on realtime concurrency; several are worse. File GB wins (Appwrite 2 GB, R2 10 GB) are achievable via **hybrid** without migration.

---

## 5. Recommendation - longest unpaid beta

**Recommended path: Option C first, then A habits, then B (Starter) if needed.**

1. **Now:** Stay Convex Free; stretch evidence (compress, size limits, prune).  
2. **Before file storage/egress caps:** Move evidence to **Cloudflare R2 Free** (hybrid). This is the only free change that clearly gives **more** than the current stack without sacrificing Convex realtime.  
3. **If Convex Free hard-caps elsewhere:** Flip to **Convex Starter** ($0/mo + overages) - usually cheaper than a rewrite and cheaper than Professional.  
4. **Do not** full-migrate to Supabase/Appwrite/Firebase/PocketBase for “more free” - weeks of work, weaker or similar free realtime, idle pauses, or ops burden.  
5. **Professional ($25/dev)** only when concurrent sessions or S16 limits force it.

**One-line decision:** Hybrid free (Convex + R2) stretches the unpaid beta furthest; Starter is the safety valve; full rewrite does not buy a better free realtime tier.

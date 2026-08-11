# Cloudflare R2 evidence storage setup

**Date:** 2026-07-23  
**Goal:** Keep Convex for app/realtime metadata; store new evidence blobs on **Cloudflare R2 Free** (~10 GB, $0 egress) so unpaid beta lasts longer.

## Architecture

| Concern | Where |
| --- | --- |
| Who uploaded, commitment, MIME, caption, timestamps | Convex `evidence` table |
| File bytes (new uploads) | Cloudflare R2 (`r2Key`) |
| File bytes (legacy) | Convex `_storage` (`storageId`) - still readable |
| Upload URL minting | Next `POST /api/evidence/upload-url` (presigned PUT) |
| Private read | Next `GET /api/evidence/[evidenceId]/file` → short-lived presigned GET (or public base URL if set) |

Auth: Better Auth session → Convex JWT → `assertCanUpload` / `getForViewer` membership checks.

## 1. Create an R2 bucket

1. Cloudflare dashboard → **R2 Object Storage** → **Create bucket** (e.g. `pact-evidence`).
2. Keep the bucket **private** (recommended for partner evidence). Do not enable public access unless you intentionally set `R2_PUBLIC_BASE_URL`.

## 2. Create an API token

1. R2 → **Manage R2 API Tokens** → **Create API token**.
2. Permissions: **Object Read & Write** on the evidence bucket (or account-level if you prefer).
3. Copy **Access Key ID**, **Secret Access Key**, and note your **Account ID** (R2 overview sidebar).

## 3. CORS (required for browser PUT)

Bucket → **Settings** → **CORS policy**. Example for local + production:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://www.joinpact.tech",
      "https://joinpact.tech"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Authorization"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Adjust origins to match your Vercel preview domains if needed.

## 4. Environment variables

Set on **Vercel** (Production + Preview) and locally in `.env.local`:

| Variable | Required | Notes |
| --- | --- | --- |
| `R2_ACCOUNT_ID` | yes | Cloudflare account id |
| `R2_ACCESS_KEY_ID` | yes | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | yes | R2 API token secret |
| `R2_BUCKET_NAME` | yes | e.g. `pact-evidence` |
| `R2_PUBLIC_BASE_URL` | no | Only if using a public bucket / custom domain for reads |

If R2 env is missing, upload returns **503** with a clear error (no silent fallback to Convex for new uploads).

Also required for auth gates (already used by the app): `NEXT_PUBLIC_CONVEX_URL`, `PACT_CONVEX_JWT_PRIVATE_JWK`, Better Auth session cookies.

## 5. App flow (after deploy)

1. Client `POST /api/evidence/upload-url` with `{ commitmentId, contentType, byteSize }`.
2. Browser `PUT` file bytes to the presigned URL (must send matching `Content-Type`).
3. Client Convex `evidence.attach` with `r2Key` (+ `fileType`, `byteSize`, optional `caption`).
4. Lists show images/PDFs via Convex URL (legacy) or `/api/evidence/{id}/file` (R2).

Allowed types: `image/*` and `application/pdf`. Max size: **5 MB**. Video remains blocked in the file picker.

## 6. Migration / compatibility

- Existing rows with `storageId` still resolve via `ctx.storage.getUrl`.
- New rows use `r2Key` only (`storageId` omitted).
- Cascade deletes (commitment / account) remove Convex storage files and evidence documents; **R2 objects may remain** until you add a cleanup job - acceptable for early beta; prune via Cloudflare dashboard if needed.
- Deprecated: Convex `evidence.generateUploadUrl` (legacy clients only).

## 7. Verify locally

```bash
# with R2_* set in .env.local
npm run dev:app
# upload an image on a commitment detail page
```

Without R2 env, the upload button should show a clear configuration error instead of succeeding.

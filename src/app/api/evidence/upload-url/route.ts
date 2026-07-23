import { NextResponse } from "next/server";
import { z } from "zod";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { getAuthedConvexClient } from "@/lib/convex-authed";
import {
  buildEvidenceObjectKey,
  createEvidenceUploadUrl,
  EVIDENCE_MAX_BYTES,
  isAllowedEvidenceMime,
} from "@/lib/r2";

const bodySchema = z.object({
  commitmentId: z.string().min(1),
  contentType: z.string().min(1),
  byteSize: z.number().int().positive(),
});

export async function POST(request: Request) {
  let authed;
  try {
    authed = await getAuthedConvexClient();
  } catch (error) {
    console.error("[evidence/upload-url] auth/jwt failed", error);
    return NextResponse.json(
      { error: "Could not authenticate with Convex" },
      { status: 500 },
    );
  }

  if (!authed) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "commitmentId, contentType, and byteSize are required" },
      { status: 400 },
    );
  }

  const contentType = parsed.data.contentType.trim().toLowerCase();
  if (!isAllowedEvidenceMime(contentType)) {
    return NextResponse.json(
      { error: "Only images and PDF files are allowed" },
      { status: 400 },
    );
  }

  if (parsed.data.byteSize > EVIDENCE_MAX_BYTES) {
    return NextResponse.json(
      {
        error: `File too large (max ${Math.round(EVIDENCE_MAX_BYTES / (1024 * 1024))} MB)`,
      },
      { status: 400 },
    );
  }

  const commitmentId = parsed.data.commitmentId as Id<"commitments">;

  try {
    await authed.convex.query(api.evidence.assertCanUpload, { commitmentId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Not allowed to upload evidence";
    const status =
      message.includes("Forbidden") || message.includes("not found")
        ? 403
        : 400;
    return NextResponse.json({ error: message }, { status });
  }

  let key: string;
  let uploadUrl: string;
  try {
    key = buildEvidenceObjectKey({
      commitmentId,
      authUserId: authed.authUserId,
      contentType,
    });
    uploadUrl = await createEvidenceUploadUrl({ key, contentType });
  } catch (error) {
    console.error("[evidence/upload-url] R2 sign failed", error);
    const message =
      error instanceof Error
        ? error.message
        : "Could not create upload URL";
    const status = message.includes("not configured") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({
    uploadUrl,
    r2Key: key,
    contentType,
    maxBytes: EVIDENCE_MAX_BYTES,
  });
}

import { NextResponse } from "next/server";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { getAuthedConvexClient } from "@/lib/convex-authed";
import { createEvidenceReadUrl } from "@/lib/r2";

type RouteContext = {
  params: Promise<{ evidenceId: string }>;
};

/**
 * Serves evidence for authenticated pact members.
 * - Legacy Convex storage: redirect to Convex file URL
 * - R2: redirect to a short-lived private presigned GET (or public base URL)
 */
export async function GET(_request: Request, context: RouteContext) {
  const { evidenceId: rawId } = await context.params;
  if (!rawId) {
    return NextResponse.json({ error: "Missing evidence id" }, { status: 400 });
  }

  let authed;
  try {
    authed = await getAuthedConvexClient();
  } catch (error) {
    console.error("[evidence/file] auth/jwt failed", error);
    return NextResponse.json(
      { error: "Could not authenticate with Convex" },
      { status: 500 },
    );
  }

  if (!authed) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const evidenceId = rawId as Id<"evidence">;

  let row;
  try {
    row = await authed.convex.query(api.evidence.getForViewer, { evidenceId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load evidence";
    const status = message.includes("Forbidden") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  if (!row) {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  }

  if (row.convexUrl) {
    return NextResponse.redirect(row.convexUrl);
  }

  if (row.r2Key) {
    try {
      const url = await createEvidenceReadUrl({ key: row.r2Key });
      return NextResponse.redirect(url);
    } catch (error) {
      console.error("[evidence/file] R2 sign failed", error);
      const message =
        error instanceof Error ? error.message : "Could not create read URL";
      const status = message.includes("not configured") ? 503 : 500;
      return NextResponse.json({ error: message }, { status });
    }
  }

  return NextResponse.json(
    { error: "Evidence has no stored file" },
    { status: 404 },
  );
}

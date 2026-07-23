import { createHmac, timingSafeEqual } from "crypto";

import { getPactServerSecret } from "@/lib/server-secret";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 90; // 90 days

function signPayload(payload: string): string {
  return createHmac("sha256", getPactServerSecret())
    .update(payload)
    .digest("base64url");
}

/** Signed one-click unsubscribe token for product / waitlist email. */
export function createUnsubscribeToken(input: {
  kind: "user" | "waitlist";
  id: string;
}): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${input.kind}:${input.id}:${exp}`;
  return `${Buffer.from(payload).toString("base64url")}.${signPayload(payload)}`;
}

export function verifyUnsubscribeToken(token: string): {
  kind: "user" | "waitlist";
  id: string;
} | null {
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = signPayload(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const [kind, id, expRaw] = payload.split(":");
  const exp = Number(expRaw);
  if (
    (kind !== "user" && kind !== "waitlist") ||
    !id ||
    !Number.isFinite(exp) ||
    exp < Date.now()
  ) {
    return null;
  }
  return { kind, id };
}

export function buildUnsubscribeUrl(input: {
  kind: "user" | "waitlist";
  id: string;
  origin?: string;
}): string {
  const origin = (
    input.origin ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://www.joinpact.tech"
  ).replace(/\/$/, "");
  const token = createUnsubscribeToken({ kind: input.kind, id: input.id });
  return `${origin}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

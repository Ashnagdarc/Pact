/** Convex-side HTML escape + branded wrapper (mirrors src/lib/email-html.ts). */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function siteOrigin() {
  return (
    process.env.SITE_URL ??
    process.env.BETTER_AUTH_ISSUER ??
    "https://www.joinpact.tech"
  ).replace(/\/$/, "");
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return toBase64Url(sig);
}

export function wrapEmailHtml(
  bodyHtml: string,
  options: { title?: string; unsubscribeUrl?: string } = {},
): string {
  const origin = siteOrigin();
  const title = escapeHtml(options.title ?? "Pact");
  const unsub = options.unsubscribeUrl
    ? `<p style="margin:28px 0 0;color:#888;font-size:12px;line-height:1.5">
        <a href="${escapeHtml(options.unsubscribeUrl)}" style="color:#666">Unsubscribe</a>
        from product emails · <a href="${escapeHtml(origin)}/app/profile" style="color:#666">Notification settings</a>
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:32px 16px">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px;background:#111;border-radius:16px;padding:28px 24px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.5;color:#f5f5f5">
      <tr><td>
        <p style="margin:0 0 20px;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#c9ff4a">Pact</p>
        ${bodyHtml}
        ${unsub}
        <p style="margin:20px 0 0;color:#666;font-size:12px">Pact · <a href="${escapeHtml(origin)}" style="color:#888">${escapeHtml(origin.replace(/^https?:\/\//, ""))}</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** Signed unsubscribe URL matching Next `/api/unsubscribe` tokens. */
export async function buildUserUnsubscribeUrl(
  userId: string,
): Promise<string | undefined> {
  const secret =
    process.env.PACT_SERVER_SECRET ?? process.env.BETTER_AUTH_SECRET;
  if (!secret) return undefined;

  const origin = siteOrigin();
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 90;
  const payload = `user:${userId}:${exp}`;
  const encoded = toBase64Url(new TextEncoder().encode(payload));
  const sig = await hmacSign(secret, payload);
  return `${origin}/api/unsubscribe?token=${encodeURIComponent(`${encoded}.${sig}`)}`;
}

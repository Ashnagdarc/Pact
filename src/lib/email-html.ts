/**
 * Shared HTML email helpers (escape + minimal branded wrapper).
 * Used by Next waitlist/invite/auth mail and mirrored in Convex email delivery.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.BETTER_AUTH_URL ??
    "https://www.joinpact.tech"
  ).replace(/\/$/, "");
}

type WrapEmailOptions = {
  title?: string;
  preheader?: string;
  /** Absolute unsubscribe URL; omitted for transactional auth mail. */
  unsubscribeUrl?: string;
};

/** Minimal branded HTML shell with optional unsubscribe footer. */
export function wrapEmailHtml(
  bodyHtml: string,
  options: WrapEmailOptions = {},
): string {
  const origin = siteOrigin();
  const title = escapeHtml(options.title ?? "Pact");
  const preheader = options.preheader
    ? `<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${escapeHtml(options.preheader)}</span>`
    : "";
  const unsub = options.unsubscribeUrl
    ? `<p style="margin:28px 0 0;color:#888;font-size:12px;line-height:1.5">
        <a href="${escapeHtml(options.unsubscribeUrl)}" style="color:#666">Unsubscribe</a>
        from product emails · <a href="${escapeHtml(origin)}/app/profile" style="color:#666">Notification settings</a>
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a">
${preheader}
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

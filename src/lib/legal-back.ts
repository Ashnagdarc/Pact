/**
 * Safe internal back target for legal pages (Privacy / Terms).
 * Only allows same-origin app paths; rejects open redirects.
 */
export function legalBackHref(from: string | undefined): string {
  if (!from || !from.startsWith("/") || from.startsWith("//")) {
    return "/";
  }
  if (from.startsWith("/app")) {
    return from;
  }
  return "/";
}

export function legalBackLabel(href: string): string {
  return href.startsWith("/app") ? "Back to app" : "Back to home";
}

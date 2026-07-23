/** Shared evidence upload limits (safe to import from client components). */

export const EVIDENCE_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_PREFIXES = ["image/"] as const;
const ALLOWED_MIME_EXACT = new Set(["application/pdf"]);

export function isAllowedEvidenceMime(contentType: string): boolean {
  const normalized = contentType.trim().toLowerCase();
  if (!normalized) return false;
  if (ALLOWED_MIME_EXACT.has(normalized)) return true;
  return ALLOWED_MIME_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

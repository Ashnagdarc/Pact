export const BETA_ACCESS_COOKIE = "pact_beta_access";

export function siteOriginFromRequest(request: Request) {
  const envOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.BETTER_AUTH_URL?.replace(/\/$/, "");
  if (envOrigin) return envOrigin;
  return new URL(request.url).origin;
}

export function betaAccessOpen() {
  return (
    process.env.BETA_ACCESS_OPEN === "1" ||
    process.env.NODE_ENV !== "production"
  );
}

export function buildBetaAccessUrl(origin: string, token: string) {
  return `${origin.replace(/\/$/, "")}/beta/${token}`;
}

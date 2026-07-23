import type { MetadataRoute } from "next";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.joinpact.tech"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/api/", "/invite/", "/beta/", "/dash/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "better-sqlite3"],
  async redirects() {
    return [
      { source: "/today", destination: "/app", permanent: true },
      { source: "/pacts", destination: "/app/pacts", permanent: true },
      { source: "/pacts/:path*", destination: "/app/pacts/:path*", permanent: true },
      {
        source: "/commitments/:path*",
        destination: "/app/commitments/:path*",
        permanent: true,
      },
      { source: "/tasks/:path*", destination: "/app/tasks/:path*", permanent: true },
      { source: "/new", destination: "/app/new", permanent: true },
      {
        source: "/rescue/:path*",
        destination: "/app/rescue/:path*",
        permanent: true,
      },
      { source: "/insights", destination: "/app/insights", permanent: true },
      {
        source: "/notifications",
        destination: "/app/notifications",
        permanent: true,
      },
      { source: "/profile", destination: "/app/profile", permanent: true },
      { source: "/onboarding", destination: "/app/onboarding", permanent: true },
      { source: "/install", destination: "/app/install", permanent: true },
    ];
  },
};

export default nextConfig;

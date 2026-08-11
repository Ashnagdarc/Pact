import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { PostOnboardingRedirect } from "@/components/navigation/post-onboarding-redirect";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import "./globals.css";

// Soft geometric sans (same family for headings + body), close to the
// rounded modern UI look in product references - not sharp AI display faces.
const display = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteDescription =
  "Make commitments. Show your progress. Recover together.";

const metadataBaseUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.joinpact.tech",
);

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl,
  title: "Pact",
  description: siteDescription,
  applicationName: "Pact",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pact",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Pact",
    title: "Pact",
    description: siteDescription,
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Pact",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Pact",
    description: siteDescription,
    images: ["/icons/icon-512.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#121212",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${display.variable} ${body.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-volt-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-white focus:outline-none"
        >
          Skip to content
        </a>
        <ConvexClientProvider>
          <ServiceWorkerRegister />
          <PostOnboardingRedirect />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}

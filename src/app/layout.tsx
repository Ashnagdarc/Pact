import type { Metadata, Viewport } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pact",
  description: "Make commitments. Show your progress. Recover together.",
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#050505",
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
        <ConvexClientProvider>
          <ServiceWorkerRegister />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}

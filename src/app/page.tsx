import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Pact: Finish what you promise",
  description:
    "Make commitments with people you trust, show progress, and recover together when plans change.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Pact",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  url: "https://www.joinpact.tech",
  description:
    "Make commitments with people you trust, show progress, and recover together when plans change.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <LandingPage />
    </>
  );
}

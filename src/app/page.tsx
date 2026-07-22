import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Pact — Finish what you promise",
  description:
    "Make commitments with people you trust, show progress, and recover together when plans change.",
};

export default function HomePage() {
  return <LandingPage />;
}

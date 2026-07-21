import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { TodayScreen } from "@/components/screens/today-screen";

export default function HomePage() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexSetupScreen />;
  }

  return <TodayScreen />;
}

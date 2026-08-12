import type { ReactNode } from "react";

import { BottomTabs } from "@/components/navigation/bottom-tabs";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  className?: string;
  showTabs?: boolean;
  variant?: "default" | "hero";
};

export function AppShell({
  children,
  className,
  showTabs = true,
  variant = "default",
}: AppShellProps) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-ink-950 text-white">
      {/* Desktop framing: keep the mobile column intentional on wide screens */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-full max-w-md -translate-x-1/2 border-x border-white/[0.06] lg:block"
      />
      <main
        id="content"
        className={cn(
          "relative z-10 mx-auto min-h-dvh w-full max-w-md px-4 safe-pt",
          variant === "default" && "dot-grid",
          // Reserve space for the fixed bottom tab bar plus the device safe area
          // (home indicator) so content is never hidden behind the nav.
          showTabs
            ? "pb-[calc(7rem+env(safe-area-inset-bottom,0px))]"
            : "pb-8",
          className
        )}
      >
        {children}
      </main>
      {showTabs ? <BottomTabs /> : null}
    </div>
  );
}

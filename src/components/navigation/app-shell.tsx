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
      {variant === "hero" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,82,38,0.18),_transparent_52%),radial-gradient(ellipse_at_bottom_right,_rgba(158,181,255,0.16),_transparent_48%)]"
        />
      ) : null}
      <main
        id="content"
        className={cn(
          "relative mx-auto min-h-dvh w-full max-w-md px-4 safe-pt",
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

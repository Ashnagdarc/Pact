import type { ReactNode } from "react";

import { BottomTabs } from "@/components/navigation/bottom-tabs";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  className?: string;
  showTabs?: boolean;
};

export function AppShell({
  children,
  className,
  showTabs = true,
}: AppShellProps) {
  return (
    <div className="min-h-dvh bg-ink-950 text-white">
      <div
        className={cn(
          "dot-grid mx-auto min-h-dvh w-full max-w-md px-4 safe-pt",
          showTabs ? "pb-28" : "pb-8",
          className
        )}
      >
        {children}
      </div>
      {showTabs ? <BottomTabs /> : null}
    </div>
  );
}

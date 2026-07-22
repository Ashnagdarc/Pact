"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  LineChart,
  Plus,
  Sun,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: typeof Sun;
  primary?: boolean;
};

const tabs: Tab[] = [
  { href: "/app", label: "Today", icon: Sun },
  { href: "/app/pacts", label: "Pacts", icon: LayoutGrid },
  { href: "/app/new", label: "New", icon: Plus, primary: true },
  { href: "/app/insights", label: "Insights", icon: LineChart },
  { href: "/app/profile", label: "You", icon: UserRound },
];

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="safe-pb pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4"
    >
      <div className="pointer-events-auto mb-2 flex items-center justify-between gap-1 rounded-[1.75rem] border border-white/10 bg-ink-900/90 px-2 py-2 shadow-[0_-8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        {tabs.map((tab) => {
          const active =
            tab.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          if (tab.primary) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.label}
                className="inline-flex size-14 -translate-y-3 items-center justify-center rounded-full bg-signal text-white shadow-[0_10px_30px_rgba(22,133,248,0.45)] transition-transform active:scale-95"
              >
                <Icon className="size-6" strokeWidth={2.5} />
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-w-14 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[10px] font-semibold transition-colors",
                active ? "text-volt-500" : "text-white/45 hover:text-white/80"
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

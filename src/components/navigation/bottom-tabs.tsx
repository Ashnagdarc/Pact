"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutGrid,
  Plus,
  Sun,
  UserRound,
} from "lucide-react";

import { CreateSheet } from "@/components/navigation/create-sheet";
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
  { href: "/app/calendar", label: "Cal", icon: CalendarDays },
  { href: "/app/profile", label: "You", icon: UserRound },
];

export function BottomTabs() {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Primary"
        className="safe-pb pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4"
      >
        <div className="pointer-events-auto mb-2 flex items-center justify-between gap-1 rounded-[1.75rem] border border-white/10 bg-ink-900/88 px-2 py-2 backdrop-blur-xl">
          {tabs.map((tab) => {
            const active =
              tab.href === "/app"
                ? pathname === "/app"
                : !tab.primary && pathname.startsWith(tab.href);
            const Icon = tab.icon;

            if (tab.primary) {
              return (
                <button
                  key={tab.href}
                  type="button"
                  aria-label="Create"
                  aria-haspopup="dialog"
                  aria-expanded={createOpen}
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex size-14 -translate-y-3 items-center justify-center rounded-full bg-volt-500 text-white shadow-[0_10px_30px_rgba(255,82,38,0.4)] transition-transform active:scale-95"
                >
                  <Icon className="size-6" strokeWidth={2.5} />
                </button>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex min-w-14 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "text-white"
                    : "text-white/50 hover:text-white/80"
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <CreateSheet open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

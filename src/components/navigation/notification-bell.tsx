"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { Bell } from "lucide-react";

import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-demo-user";
import { cn } from "@/lib/utils";

type NotificationBellProps = {
  className?: string;
};

export function NotificationBell({ className }: NotificationBellProps) {
  const { userId } = useCurrentUser();
  const unread = useQuery(
    api.notifications.unreadCount,
    userId ? {} : "skip"
  );
  const syncRescuePrompts = useMutation(api.notifications.syncRescuePrompts);

  useEffect(() => {
    if (!userId) return;
    void syncRescuePrompts({});
  }, [userId, syncRescuePrompts]);

  return (
    <Button
      asChild
      size="icon"
      variant="ghost"
      className={cn(
        "relative size-11 rounded-full border border-white/10 bg-white/5",
        className
      )}
    >
      <Link href="/app/notifications" aria-label="Notifications">
        <Bell className="size-5" />
        {typeof unread === "number" && unread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-signal px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}

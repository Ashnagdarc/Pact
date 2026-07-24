"use client";

import Link from "next/link";
import { useEffect, useTransition } from "react";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import { SurfaceCard } from "@/components/cards/surface-card";
import { AppShell } from "@/components/navigation/app-shell";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-demo-user";
import { cn } from "@/lib/utils";

export function NotificationsScreen() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexSetupScreen />;
  }

  return <NotificationsConnected />;
}

function NotificationsConnected() {
  const { userId, loading: userLoading } = useCurrentUser();
  const notifications = useQuery(
    api.notifications.listForUser,
    userId ? {} : "skip"
  );
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const syncRescuePrompts = useMutation(api.notifications.syncRescuePrompts);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!userId) return;
    void syncRescuePrompts({});
  }, [userId, syncRescuePrompts]);

  if (userLoading || notifications === undefined) {
    return (
      <AppShell>
        <div className="flex min-h-[50dvh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-volt-500" />
        </div>
      </AppShell>
    );
  }

  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-3 pt-2">
        <div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight">
            Alerts
          </h1>
          <p className="mt-2 text-sm text-white/55">
            {unread > 0
              ? `${unread} unread · actionable, not guilt-inducing`
              : "You're caught up"}
          </p>
        </div>
        {unread > 0 ? (
          <Button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                if (userId) await markAllRead({});
              })
            }
            variant="ghost"
            className="rounded-full border border-white/15 text-xs font-semibold text-white/70"
          >
            <CheckCheck className="size-4" />
            Mark all
          </Button>
        ) : null}
      </div>

      <div className="mt-6 space-y-3">
        {notifications.length === 0 ? (
          <SurfaceCard tone="ink" padding="lg" className="border border-white/10">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-white/5">
                <Bell className="size-5 text-white/50" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-lg font-bold">No alerts yet</p>
                <p className="mt-1 text-sm text-white/60">
                  Check-ins, help requests, and rescue prompts will show up here.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild className="rounded-full bg-signal text-ink-950">
                    <Link href="/app">Go to Today</Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="rounded-full border border-white/15"
                  >
                    <Link href="/app/pacts/new">Create a Pact</Link>
                  </Button>
                </div>
              </div>
            </div>
          </SurfaceCard>
        ) : (
          notifications.map((notification) => {
            const content = (
              <SurfaceCard
                tone="ink"
                className={cn(
                  "border transition-colors",
                  notification.readAt
                    ? "border-white/8 opacity-70"
                    : "border-signal/30 bg-signal/5"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{notification.title}</p>
                    <p className="mt-1 text-sm text-white/75">
                      {notification.body}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold text-white/40">
                      {formatDistanceToNow(notification._creationTime, {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!notification.readAt ? (
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-signal" />
                  ) : null}
                </div>
              </SurfaceCard>
            );

            if (notification.href) {
              return (
                <Link
                  key={notification._id}
                  href={notification.href}
                  className="block"
                  onClick={() => {
                    if (!userId || notification.readAt) return;
                    void markRead({
                      notificationId: notification._id,
                    });
                  }}
                >
                  {content}
                </Link>
              );
            }

            return <div key={notification._id}>{content}</div>;
          })
        )}
      </div>
    </AppShell>
  );
}

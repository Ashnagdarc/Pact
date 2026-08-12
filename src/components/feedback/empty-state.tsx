import type { ReactNode } from "react";
import Link from "next/link";

import { SurfaceCard } from "@/components/cards/surface-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyAction = {
  href: string;
  label: string;
};

type EmptyStateProps = {
  title: string;
  description: string;
  primaryAction?: EmptyAction;
  secondaryAction?: EmptyAction;
  icon?: ReactNode;
  className?: string;
  /** Larger padding + title scale for full-page empties. */
  size?: "md" | "lg";
};

export function EmptyState({
  title,
  description,
  primaryAction,
  secondaryAction,
  icon,
  className,
  size = "lg",
}: EmptyStateProps) {
  return (
    <SurfaceCard
      tone="ink"
      padding={size === "lg" ? "lg" : "md"}
      className={cn("border border-white/10", className)}
    >
      <div className={cn(icon && "flex items-start gap-3")}>
        {icon ? (
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-heading font-bold tracking-tight",
              size === "lg" ? "text-2xl" : "text-xl"
            )}
          >
            {title}
          </p>
          <p className="mt-2 text-sm text-white/70">{description}</p>
          {primaryAction || secondaryAction ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {primaryAction ? (
                <Button asChild variant="soft">
                  <Link href={primaryAction.href}>{primaryAction.label}</Link>
                </Button>
              ) : null}
              {secondaryAction ? (
                <Button asChild variant="outline">
                  <Link href={secondaryAction.href}>
                    {secondaryAction.label}
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </SurfaceCard>
  );
}

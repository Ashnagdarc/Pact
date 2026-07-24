"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { SurfaceCard } from "@/components/cards/surface-card";
import { AvatarStack, type AvatarPerson } from "@/components/feedback/avatar-stack";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PactBoardCardProps = {
  title: string;
  activeTasks: number;
  members: AvatarPerson[];
  tone?: "signal" | "volt" | "paper" | "cream" | "mint" | "coral";
  className?: string;
  href?: string;
  addHref?: string;
  inviteHref?: string;
};

export function PactBoardCard({
  title,
  activeTasks,
  members,
  tone = "signal",
  className,
  href,
  addHref,
  inviteHref,
}: PactBoardCardProps) {
  return (
    <SurfaceCard
      tone={tone}
      padding="lg"
      className={cn("min-h-[10.5rem] rounded-[2rem]", className)}
    >
      <div className="flex items-start justify-between gap-3">
        {href ? (
          <Link href={href} className="min-w-0 flex-1 block">
            <BoardBody
              title={title}
              activeTasks={activeTasks}
              members={members}
            />
          </Link>
        ) : (
          <div className="min-w-0 flex-1">
            <BoardBody
              title={title}
              activeTasks={activeTasks}
              members={members}
            />
          </div>
        )}

        {addHref || inviteHref ? (
          <div className="flex shrink-0 flex-col items-end gap-2">
            {addHref ? (
              <Button
                asChild
                size="icon"
                variant="ghost"
                className="size-11 rounded-full border border-current/20 bg-black/5 hover:bg-black/10"
              >
                <Link href={addHref} aria-label={`Add commitment to ${title}`}>
                  <Plus className="size-5" />
                </Link>
              </Button>
            ) : null}
            {inviteHref ? (
              <Button
                asChild
                className="h-10 rounded-full border border-current/20 bg-black/5 px-4 text-sm font-bold hover:bg-black/10"
              >
                <Link href={inviteHref}>Invite</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </SurfaceCard>
  );
}

function BoardBody({
  title,
  activeTasks,
  members,
}: {
  title: string;
  activeTasks: number;
  members: AvatarPerson[];
}) {
  return (
    <>
      <AvatarStack people={members} size="sm" className="mb-3" />
      <p className="text-sm font-medium opacity-70">
        {activeTasks} Active Tasks
      </p>
      <h3 className="font-heading text-3xl font-bold tracking-tight">
        {title}
      </h3>
    </>
  );
}

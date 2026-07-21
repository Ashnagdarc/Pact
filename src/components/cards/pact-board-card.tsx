"use client";

import Link from "next/link";
import { MoreHorizontal, Plus } from "lucide-react";

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
};

export function PactBoardCard({
  title,
  activeTasks,
  members,
  tone = "signal",
  className,
  href,
  addHref,
}: PactBoardCardProps) {
  return (
    <SurfaceCard
      tone={tone}
      padding="lg"
      className={cn("min-h-[10.5rem] rounded-[2rem]", className)}
    >
      <div className="mb-8 flex items-start justify-between">
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
        ) : (
          <span className="inline-flex size-11 items-center justify-center rounded-full border border-current/20 bg-black/5">
            <Plus className="size-5" />
          </span>
        )}
        <span className="inline-flex size-10 items-center justify-center rounded-full">
          <MoreHorizontal className="size-5" />
        </span>
      </div>

      {href ? (
        <Link href={href} className="block">
          <BoardBody
            title={title}
            activeTasks={activeTasks}
            members={members}
          />
        </Link>
      ) : (
        <BoardBody title={title} activeTasks={activeTasks} members={members} />
      )}
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
    <div className="flex items-end justify-between gap-3">
      <div>
        <AvatarStack people={members} size="sm" className="mb-3" />
        <p className="text-sm font-medium opacity-70">
          {activeTasks} Active Tasks
        </p>
        <h3 className="font-heading text-3xl font-bold tracking-tight">
          {title}
        </h3>
      </div>
    </div>
  );
}

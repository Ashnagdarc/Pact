"use client";

import { BadgeCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type BadgeAvatarProps = {
  name: string;
  src?: string;
  size?: "sm" | "default" | "lg";
  /** Show the verified mark (default true). */
  verified?: boolean;
  className?: string;
};

/**
 * Avatar with a verified badge — use for partner / primary identity marks.
 */
export function BadgeAvatar({
  name,
  src,
  size = "default",
  verified = true,
  className,
}: BadgeAvatarProps) {
  return (
    <div className={cn("relative w-fit shrink-0", className)}>
      <Avatar size={size} className="ring-0">
        {src ? <AvatarImage alt={name} src={src} /> : null}
        <AvatarFallback className="bg-signal font-semibold text-ink-950">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      {verified ? (
        <span
          aria-hidden
          className="absolute -right-0.5 -bottom-0.5 flex size-3.5 items-center justify-center rounded-full bg-ink-950"
        >
          <BadgeCheck className="size-full fill-blue-500 text-white" />
        </span>
      ) : null}
      {verified ? <span className="sr-only">Verified</span> : null}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default BadgeAvatar;

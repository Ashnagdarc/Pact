"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, Handshake, ListPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type CreateSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function pactIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/app\/pacts\/([^/]+)/);
  if (!match?.[1] || match[1] === "new") return null;
  return match[1];
}

export function CreateSheet({ open, onOpenChange }: CreateSheetProps) {
  const pathname = usePathname();
  const pactId = pactIdFromPath(pathname);
  const commitmentHref = pactId ? `/app/new?pactId=${pactId}` : "/app/new";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-w-md gap-0 rounded-t-[1.75rem] border-white/10 bg-ink-900 px-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] text-white"
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20" />
        <SheetHeader className="px-5 pt-4 pb-2">
          <SheetTitle className="font-heading text-xl font-bold tracking-tight text-white">
            Create
          </SheetTitle>
          <SheetDescription className="text-sm text-white/60">
            Add something small, or start a new Pact.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 px-5 pt-2 pb-4">
          {pactId ? (
            <Button
              asChild
              variant="soft"
              size="lg"
              className="h-14 justify-start gap-3 px-4"
              onClick={() => onOpenChange(false)}
            >
              <Link href={commitmentHref}>
                <ListPlus className="size-5" />
                <span className="flex flex-col items-start gap-0.5 text-left">
                  <span className="leading-none">Add commitment</span>
                  <span className="text-xs font-medium text-ink-950/65">
                    To this Pact
                  </span>
                </span>
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="soft"
              size="lg"
              className="h-14 justify-start gap-3 px-4"
              onClick={() => onOpenChange(false)}
            >
              <Link href="/app/new">
                <ListPlus className="size-5" />
                <span className="flex flex-col items-start gap-0.5 text-left">
                  <span className="leading-none">Add commitment</span>
                  <span className="text-xs font-medium text-ink-950/65">
                    Shared or personal
                  </span>
                </span>
              </Link>
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 justify-start gap-3 px-4"
            onClick={() => onOpenChange(false)}
          >
            <Link href="/app/new?task=1">
              <FilePlus2 className="size-5" />
              <span className="flex flex-col items-start gap-0.5 text-left">
                <span className="leading-none">Add personal task</span>
                <span className="text-xs font-medium text-white/50">
                  Just for you
                </span>
              </span>
            </Link>
          </Button>

          <Button
            asChild
            variant="default"
            size="lg"
            className="h-14 justify-start gap-3 px-4"
            onClick={() => onOpenChange(false)}
          >
            <Link href="/app/pacts/new">
              <Handshake className="size-5" />
              <span className="flex flex-col items-start gap-0.5 text-left">
                <span className="leading-none">Create a Pact</span>
                <span className="text-xs font-medium text-white/75">
                  Invite a partner
                </span>
              </span>
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="mt-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

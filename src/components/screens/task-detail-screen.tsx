"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ArrowLeft, Check, Loader2, Trash2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { SurfaceCard } from "@/components/cards/surface-card";
import { AppShell } from "@/components/navigation/app-shell";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-demo-user";
import { cn } from "@/lib/utils";

export function TaskDetailScreen({ taskId }: { taskId: string }) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexSetupScreen />;
  }
  return <TaskDetailConnected taskId={taskId} />;
}

function TaskDetailConnected({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { userId, loading: userLoading } = useCurrentUser();
  const task = useQuery(
    api.tasks.getById,
    userId ? { taskId: taskId as Id<"tasks"> } : "skip"
  );
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const seeded = useRef(false);

  useEffect(() => {
    if (!task || seeded.current) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    seeded.current = true;
  }, [task]);

  if (userLoading || task === undefined) {
    return (
      <AppShell showTabs={false}>
        <div className="flex min-h-[60dvh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-volt-500" />
        </div>
      </AppShell>
    );
  }

  if (!task) {
    return (
      <AppShell showTabs={false}>
        <SurfaceCard tone="coral" className="mt-8">
          <p className="font-heading text-2xl font-bold">Task not found</p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/app">Back to Today</Link>
          </Button>
        </SurfaceCard>
      </AppShell>
    );
  }

  return (
    <AppShell showTabs={false} className="pb-10">
      <header className="mb-4 flex items-center justify-between pt-2">
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="size-11 rounded-full border border-white/10 bg-white/5"
        >
          <Link href="/app" aria-label="Back">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={isPending}
          className="size-11 rounded-full border border-coral-400/30 bg-coral-400/10 text-coral-400"
          aria-label="Delete task"
          onClick={() =>
            startTransition(async () => {
              await removeTask({ taskId: task._id });
              router.replace("/app");
            })
          }
        >
          <Trash2 className="size-5" />
        </Button>
      </header>

      <SurfaceCard
        tone={task.tone ?? "cream"}
        padding="lg"
        className="rounded-[2rem]"
      >
        <span className="mb-3 inline-flex rounded-full border border-ink-950/20 px-3 py-1 text-xs font-semibold">
          Personal task
        </span>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-auto border-0 bg-transparent p-0 font-heading text-3xl font-extrabold tracking-tight text-ink-950 shadow-none focus-visible:ring-0"
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a note"
          rows={3}
          className="mt-4 rounded-2xl border-black/10 bg-white/40 text-sm text-ink-950"
        />
        <p className="mt-4 text-sm font-semibold opacity-70">
          {task.dueAt ? `Due ${format(task.dueAt, "MMM d, yyyy")}` : "No due date"}
        </p>
      </SurfaceCard>

      <div className="mt-4 grid gap-3">
        <Button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await updateTask({
                taskId: task._id,
                title: title.trim() || task.title,
                description: description.trim() || undefined,
              });
            })
          }
          className="h-12 rounded-full bg-white/10 text-white hover:bg-white/15"
        >
          Save changes
        </Button>
        <Button
          type="button"
          disabled={isPending || task.status === "done"}
          onClick={() =>
            startTransition(async () => {
              await updateTask({ taskId: task._id, status: "done" });
            })
          }
          className={cn(
            "h-14 rounded-full text-base font-bold",
            task.status === "done"
              ? "bg-mint-300/20 text-mint-300"
              : "bg-volt-500 text-white hover:bg-volt-500/90"
          )}
        >
          <Check className="size-4" />
          {task.status === "done" ? "Completed" : "Mark done"}
        </Button>
      </div>
    </AppShell>
  );
}

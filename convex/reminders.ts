import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { notify } from "./lib/notify";

/**
 * Find commitments whose reminder window has opened and notify assignees.
 * Marks reminderSentAt so each reminder fires once.
 */
export const deliverDue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const commitments = await ctx.db.query("commitments").collect();
    let sent = 0;

    for (const commitment of commitments) {
      if (!commitment.reminderAt) continue;
      if (commitment.reminderSentAt) continue;
      if (commitment.reminderAt > now) continue;
      if (commitment.status === "done" || commitment.status === "paused") {
        continue;
      }

      await notify(ctx, {
        userId: commitment.assigneeId,
        type: "commitment_due",
        title: "Reminder",
        body: `“${commitment.title}” is due soon.`,
        href: `/app/commitments/${commitment._id}`,
        pactId: commitment.pactId,
        commitmentId: commitment._id,
      });

      await ctx.db.patch(commitment._id, { reminderSentAt: now });
      sent += 1;
    }

    // Personal task reminders (one-shot via activity metadata + patch reminderAt clear)
    const tasks = await ctx.db.query("tasks").collect();
    for (const task of tasks) {
      if (!task.reminderAt || task.reminderAt > now) continue;
      if (task.status !== "open") continue;

      await notify(ctx, {
        userId: task.ownerId,
        type: "commitment_due",
        title: "Task reminder",
        body: `“${task.title}” is due soon.`,
        href: `/app/tasks/${task._id}`,
      });

      await ctx.db.patch(task._id, { reminderAt: undefined });
      sent += 1;
    }

    return { sent };
  },
});

/** Schedule a one-off reminder relative to a commitment (used after create/update). */
export const scheduleCommitmentReminder = internalMutation({
  args: {
    commitmentId: v.id("commitments"),
    reminderAt: v.number(),
  },
  handler: async (ctx, args) => {
    const commitment = await ctx.db.get(args.commitmentId);
    if (!commitment) return;
    await ctx.db.patch(args.commitmentId, {
      reminderAt: args.reminderAt,
      reminderSentAt: undefined,
    });

    // Ensure cron will pick it up; also schedule a near-term check if soon.
    const delayMs = Math.max(0, args.reminderAt - Date.now());
    if (delayMs <= 1000 * 60 * 60 * 6) {
      await ctx.scheduler.runAfter(
        delayMs,
        internal.reminders.deliverOneCommitment,
        { commitmentId: args.commitmentId }
      );
    }
  },
});

export const deliverOneCommitment = internalMutation({
  args: { commitmentId: v.id("commitments") },
  handler: async (ctx, args) => {
    const commitment = await ctx.db.get(args.commitmentId);
    if (!commitment?.reminderAt || commitment.reminderSentAt) return;
    if (commitment.reminderAt > Date.now()) return;
    if (commitment.status === "done" || commitment.status === "paused") return;

    await notify(ctx, {
      userId: commitment.assigneeId,
      type: "commitment_due",
      title: "Reminder",
      body: `“${commitment.title}” is due soon.`,
      href: `/app/commitments/${commitment._id}`,
      pactId: commitment.pactId,
      commitmentId: commitment._id,
    });

    await ctx.db.patch(args.commitmentId, { reminderSentAt: Date.now() });
  },
});

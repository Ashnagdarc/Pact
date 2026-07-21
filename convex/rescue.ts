import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  blockerType,
  recoveryAction,
  recoveryApprovalStatus,
} from "./lib/validators";
import { notify, notifyPactPartners } from "./lib/notify";
import { recoveryActionLabel } from "./lib/recoveryLabels";

export const listForCommitment = query({
  args: { commitmentId: v.id("commitments") },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("recoveryPlans")
      .withIndex("by_commitment", (q) =>
        q.eq("commitmentId", args.commitmentId)
      )
      .collect();

    return plans.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getLatest = query({
  args: { commitmentId: v.id("commitments") },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("recoveryPlans")
      .withIndex("by_commitment", (q) =>
        q.eq("commitmentId", args.commitmentId)
      )
      .collect();

    return (
      plans.sort((a, b) => b._creationTime - a._creationTime)[0] ?? null
    );
  },
});

export const createPlan = mutation({
  args: {
    commitmentId: v.id("commitments"),
    createdBy: v.id("users"),
    blockerType,
    recoveryAction,
    revisedTitle: v.optional(v.string()),
    revisedDueAt: v.optional(v.number()),
    revisedChecklist: v.optional(
      v.array(
        v.object({
          label: v.string(),
          done: v.boolean(),
        })
      )
    ),
    note: v.optional(v.string()),
    notifyPartner: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const commitment = await ctx.db.get(args.commitmentId);
    if (!commitment) {
      throw new Error("Commitment not found");
    }

    await ctx.db.insert("activityEvents", {
      userId: args.createdBy,
      pactId: commitment.pactId,
      eventName: "rescue_mode_started",
      metadata: {
        commitmentId: args.commitmentId,
        blockerType: args.blockerType,
      },
    });

    const planId = await ctx.db.insert("recoveryPlans", {
      commitmentId: args.commitmentId,
      createdBy: args.createdBy,
      blockerType: args.blockerType,
      recoveryAction: args.recoveryAction,
      revisedTitle: args.revisedTitle,
      revisedDueAt: args.revisedDueAt,
      revisedChecklist: args.revisedChecklist,
      note: args.note,
      approvalStatus: "pending",
    });

    // Apply the recovery to the commitment immediately (partner can still acknowledge)
    switch (args.recoveryAction) {
      case "reduce_scope": {
        await ctx.db.patch(args.commitmentId, {
          title: args.revisedTitle ?? commitment.title,
          description: args.note ?? commitment.description,
          checklist: args.revisedChecklist ?? commitment.checklist,
          status: "on_track",
        });
        break;
      }
      case "split": {
        await ctx.db.patch(args.commitmentId, {
          title: args.revisedTitle ?? commitment.title,
          checklist: args.revisedChecklist ?? [
            { label: "Step 1", done: false },
            { label: "Step 2", done: false },
            { label: "Step 3", done: false },
          ],
          status: "on_track",
        });
        break;
      }
      case "reschedule": {
        await ctx.db.patch(args.commitmentId, {
          dueAt: args.revisedDueAt ?? commitment.dueAt,
          status: "on_track",
        });
        break;
      }
      case "ask_help": {
        await ctx.db.patch(args.commitmentId, {
          status: "need_help",
          description: args.note ?? commitment.description,
        });
        break;
      }
      case "pause": {
        await ctx.db.patch(args.commitmentId, {
          status: "paused",
        });
        break;
      }
      case "remove": {
        await ctx.db.patch(args.commitmentId, {
          status: "paused",
          description: args.note
            ? `Removed via rescue: ${args.note}`
            : "Removed via rescue mode",
        });
        break;
      }
      default: {
        const _exhaustive: never = args.recoveryAction;
        throw new Error(`Unhandled recovery action: ${String(_exhaustive)}`);
      }
    }

    await ctx.db.patch(planId, {
      appliedAt: Date.now(),
      approvalStatus: commitment.pactId ? "pending" : "acknowledged",
    });

    await ctx.db.insert("activityEvents", {
      userId: args.createdBy,
      pactId: commitment.pactId,
      eventName: "recovery_plan_created",
      metadata: {
        commitmentId: args.commitmentId,
        planId,
        recoveryAction: args.recoveryAction,
        notifyPartner: args.notifyPartner ?? Boolean(commitment.pactId),
      },
    });

    const actor = await ctx.db.get(args.createdBy);
    if (commitment.pactId && (args.notifyPartner ?? true)) {
      await notifyPactPartners(ctx, {
        pactId: commitment.pactId,
        excludeUserId: args.createdBy,
        actorId: args.createdBy,
        commitmentId: args.commitmentId,
        type: "recovery_plan",
        title: "Recovery plan shared",
        body: `${actor?.displayName ?? "Your partner"} chose to ${recoveryActionLabel[args.recoveryAction]} on “${commitment.title}”.`,
        href: `/commitments/${args.commitmentId}`,
      });
    }

    return planId;
  },
});

export const reviewPlan = mutation({
  args: {
    planId: v.id("recoveryPlans"),
    reviewerId: v.id("users"),
    approvalStatus: recoveryApprovalStatus,
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Recovery plan not found");
    }

    await ctx.db.patch(args.planId, {
      approvalStatus: args.approvalStatus,
      approvedBy: args.reviewerId,
      note: args.note ?? plan.note,
    });

    const commitment = await ctx.db.get(plan.commitmentId);

    await ctx.db.insert("activityEvents", {
      userId: args.reviewerId,
      pactId: commitment?.pactId,
      eventName: "recovery_plan_approved",
      metadata: {
        planId: args.planId,
        approvalStatus: args.approvalStatus,
      },
    });

    const reviewer = await ctx.db.get(args.reviewerId);
    await notify(ctx, {
      userId: plan.createdBy,
      actorId: args.reviewerId,
      type: "partner_response",
      title: "Recovery acknowledged",
      body: `${reviewer?.displayName ?? "Your partner"} acknowledged your recovery plan${commitment ? ` for “${commitment.title}”` : ""}.`,
      href: commitment ? `/commitments/${commitment._id}` : undefined,
      pactId: commitment?.pactId,
      commitmentId: plan.commitmentId,
    });
  },
});

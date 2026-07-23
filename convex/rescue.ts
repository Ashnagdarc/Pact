import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  blockerType,
  recoveryAction,
  recoveryApprovalStatus,
} from "./lib/validators";
import { notify, notifyPactPartners } from "./lib/notify";
import { recoveryActionLabel } from "./lib/recoveryLabels";
import {
  requireAppUser,
  requireCommitmentAccess,
  requirePactMember,
} from "./lib/auth";

export const listForCommitment = query({
  args: { commitmentId: v.id("commitments") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    await requireCommitmentAccess(ctx, args.commitmentId, user._id);

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
    const user = await requireAppUser(ctx);
    await requireCommitmentAccess(ctx, args.commitmentId, user._id);

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

async function applyRecovery(
  ctx: MutationCtx,
  commitmentId: Id<"commitments">,
  plan: {
    recoveryAction:
      | "reduce_scope"
      | "split"
      | "reschedule"
      | "ask_help"
      | "pause"
      | "remove";
    revisedTitle?: string;
    revisedDueAt?: number;
    revisedChecklist?: { label: string; done: boolean }[];
    note?: string;
  },
  commitment: {
    title: string;
    description?: string;
    checklist?: { label: string; done: boolean }[];
    dueAt?: number;
  },
) {
  switch (plan.recoveryAction) {
    case "reduce_scope": {
      await ctx.db.patch(commitmentId, {
        title: plan.revisedTitle ?? commitment.title,
        description: plan.note ?? commitment.description,
        checklist: plan.revisedChecklist ?? commitment.checklist,
        status: "on_track",
      });
      break;
    }
    case "split": {
      await ctx.db.patch(commitmentId, {
        title: plan.revisedTitle ?? commitment.title,
        checklist: plan.revisedChecklist ?? [
          { label: "Step 1", done: false },
          { label: "Step 2", done: false },
          { label: "Step 3", done: false },
        ],
        status: "on_track",
      });
      break;
    }
    case "reschedule": {
      await ctx.db.patch(commitmentId, {
        dueAt: plan.revisedDueAt ?? commitment.dueAt,
        status: "on_track",
      });
      break;
    }
    case "ask_help": {
      await ctx.db.patch(commitmentId, {
        status: "need_help",
        description: plan.note ?? commitment.description,
      });
      break;
    }
    case "pause": {
      await ctx.db.patch(commitmentId, {
        status: "paused",
      });
      break;
    }
    case "remove": {
      // Shelve = pause with a note (no cancelled commitment status in schema).
      await ctx.db.patch(commitmentId, {
        status: "paused",
        description: plan.note
          ? `Shelved via rescue: ${plan.note}`
          : "Shelved via rescue mode",
      });
      break;
    }
    default: {
      const _exhaustive: never = plan.recoveryAction;
      throw new Error(`Unhandled recovery action: ${String(_exhaustive)}`);
    }
  }
}

export const createPlan = mutation({
  args: {
    commitmentId: v.id("commitments"),
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
    const user = await requireAppUser(ctx);
    const commitment = await requireCommitmentAccess(
      ctx,
      args.commitmentId,
      user._id
    );

    if (commitment.assigneeId !== user._id) {
      throw new Error("Only the assignee can start Rescue Mode");
    }

    await ctx.db.insert("activityEvents", {
      userId: user._id,
      pactId: commitment.pactId,
      eventName: "rescue_mode_started",
      metadata: {
        commitmentId: args.commitmentId,
        blockerType: args.blockerType,
      },
    });

    const needsPartnerApproval = Boolean(commitment.pactId);
    const planId = await ctx.db.insert("recoveryPlans", {
      commitmentId: args.commitmentId,
      createdBy: user._id,
      blockerType: args.blockerType,
      recoveryAction: args.recoveryAction,
      revisedTitle: args.revisedTitle,
      revisedDueAt: args.revisedDueAt,
      revisedChecklist: args.revisedChecklist,
      note: args.note,
      approvalStatus: needsPartnerApproval ? "pending" : "acknowledged",
    });

    // B8: apply only when no partner approval is required; otherwise wait for review.
    if (!needsPartnerApproval) {
      await applyRecovery(ctx, args.commitmentId, args, commitment);
      await ctx.db.patch(planId, { appliedAt: Date.now() });
    }

    await ctx.db.insert("activityEvents", {
      userId: user._id,
      pactId: commitment.pactId,
      eventName: "recovery_plan_created",
      metadata: {
        commitmentId: args.commitmentId,
        planId,
        recoveryAction: args.recoveryAction,
        notifyPartner: args.notifyPartner ?? Boolean(commitment.pactId),
      },
    });

    if (commitment.pactId && (args.notifyPartner ?? true)) {
      await notifyPactPartners(ctx, {
        pactId: commitment.pactId,
        excludeUserId: user._id,
        actorId: user._id,
        commitmentId: args.commitmentId,
        type: "recovery_plan",
        title: "Recovery plan shared",
        body: `${user.displayName} chose to ${recoveryActionLabel[args.recoveryAction]} on “${commitment.title}”.`,
        href: `/app/commitments/${args.commitmentId}`,
      });
    }

    return planId;
  },
});

export const reviewPlan = mutation({
  args: {
    planId: v.id("recoveryPlans"),
    approvalStatus: recoveryApprovalStatus,
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reviewer = await requireAppUser(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Recovery plan not found");
    }

    if (plan.createdBy === reviewer._id) {
      throw new Error("Cannot review your own recovery plan");
    }

    if (plan.approvalStatus !== "pending") {
      return;
    }

    const commitment = await requireCommitmentAccess(
      ctx,
      plan.commitmentId,
      reviewer._id
    );

    if (commitment.pactId) {
      await requirePactMember(ctx, commitment.pactId, reviewer._id);
    }

    await ctx.db.patch(args.planId, {
      approvalStatus: args.approvalStatus,
      approvedBy: reviewer._id,
      note: args.note ?? plan.note,
    });

    // Apply recovery only on approve/acknowledge, and only once.
    if (
      (args.approvalStatus === "approved" ||
        args.approvalStatus === "acknowledged") &&
      !plan.appliedAt
    ) {
      await applyRecovery(ctx, plan.commitmentId, plan, commitment);
      await ctx.db.patch(args.planId, { appliedAt: Date.now() });
    }

    await ctx.db.insert("activityEvents", {
      userId: reviewer._id,
      pactId: commitment.pactId,
      eventName: "recovery_plan_approved",
      metadata: {
        planId: args.planId,
        approvalStatus: args.approvalStatus,
      },
    });

    await notify(ctx, {
      userId: plan.createdBy,
      actorId: reviewer._id,
      type: "partner_response",
      title: "Recovery acknowledged",
      body: `${reviewer.displayName} acknowledged your recovery plan for “${commitment.title}”.`,
      href: `/app/commitments/${commitment._id}`,
      pactId: commitment.pactId,
      commitmentId: plan.commitmentId,
    });
  },
});

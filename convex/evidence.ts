import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import {
  requireAppUser,
  requireCommitmentAccess,
} from "./lib/auth";
import { notifyPactPartners } from "./lib/notify";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAppUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const attach = mutation({
  args: {
    commitmentId: v.id("commitments"),
    checkInId: v.optional(v.id("checkIns")),
    storageId: v.id("_storage"),
    fileType: v.string(),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    await requireCommitmentAccess(ctx, args.commitmentId, user._id);

    if (args.checkInId) {
      const checkIn = await ctx.db.get(args.checkInId);
      if (!checkIn || checkIn.commitmentId !== args.commitmentId) {
        throw new Error("Check-in not found for this commitment");
      }
      if (checkIn.userId !== user._id) {
        throw new Error("Only the check-in author can attach evidence");
      }
    }

    const evidenceId = await ctx.db.insert("evidence", {
      commitmentId: args.commitmentId,
      checkInId: args.checkInId,
      uploadedBy: user._id,
      storageId: args.storageId,
      fileType: args.fileType,
      caption: args.caption,
    });

    await ctx.db.insert("activityEvents", {
      userId: user._id,
      eventName: "evidence_uploaded",
      metadata: {
        commitmentId: args.commitmentId,
        evidenceId,
        checkInId: args.checkInId,
      },
    });

    const commitment = await ctx.db.get(args.commitmentId);
    if (commitment?.pactId) {
      await notifyPactPartners(ctx, {
        pactId: commitment.pactId,
        excludeUserId: user._id,
        actorId: user._id,
        commitmentId: args.commitmentId,
        type: "evidence_uploaded",
        title: "Evidence uploaded",
        body: `${user.displayName} added evidence on “${commitment.title}”.`,
        href: `/app/commitments/${args.commitmentId}`,
      });
    }

    return evidenceId;
  },
});

export const listForCommitment = query({
  args: { commitmentId: v.id("commitments") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    await requireCommitmentAccess(ctx, args.commitmentId, user._id);

    const rows = await ctx.db
      .query("evidence")
      .withIndex("by_commitment", (q) =>
        q.eq("commitmentId", args.commitmentId)
      )
      .collect();

    return await Promise.all(
      rows
        .sort((a, b) => b._creationTime - a._creationTime)
        .map(async (row) => ({
          ...row,
          url: await ctx.storage.getUrl(row.storageId),
        }))
    );
  },
});

export const remove = mutation({
  args: { evidenceId: v.id("evidence") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const row = await ctx.db.get(args.evidenceId);
    if (!row) {
      throw new Error("Evidence not found");
    }
    await requireCommitmentAccess(ctx, row.commitmentId, user._id);
    if (row.uploadedBy !== user._id) {
      throw new Error("Only the uploader can remove evidence");
    }
    await ctx.storage.delete(row.storageId);
    await ctx.db.delete(args.evidenceId);
  },
});

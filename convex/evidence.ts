import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import {
  requireAppUser,
  requireCommitmentAccess,
} from "./lib/auth";
import { notifyPactPartners } from "./lib/notify";

/**
 * @deprecated New uploads use Cloudflare R2 via `/api/evidence/upload-url`.
 * Kept so old clients / emergency fallback still work until fully removed.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAppUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Auth gate for Next.js presign routes — membership checked in Convex. */
export const assertCanUpload = query({
  args: { commitmentId: v.id("commitments") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    await requireCommitmentAccess(ctx, args.commitmentId, user._id);
    return { ok: true as const, userId: user._id };
  },
});

export const getForViewer = query({
  args: { evidenceId: v.id("evidence") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const row = await ctx.db.get(args.evidenceId);
    if (!row) {
      return null;
    }
    await requireCommitmentAccess(ctx, row.commitmentId, user._id);

    return {
      ...row,
      convexUrl: row.storageId
        ? await ctx.storage.getUrl(row.storageId)
        : null,
    };
  },
});

export const attach = mutation({
  args: {
    commitmentId: v.id("commitments"),
    checkInId: v.optional(v.id("checkIns")),
    storageId: v.optional(v.id("_storage")),
    r2Key: v.optional(v.string()),
    byteSize: v.optional(v.number()),
    fileType: v.string(),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    await requireCommitmentAccess(ctx, args.commitmentId, user._id);

    const hasStorage = Boolean(args.storageId);
    const hasR2 = Boolean(args.r2Key?.trim());
    if (hasStorage === hasR2) {
      throw new Error("Provide exactly one of storageId or r2Key");
    }

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
      r2Key: args.r2Key?.trim() || undefined,
      byteSize: args.byteSize,
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
          // Convex-hosted files keep a direct URL; R2 files are served via
          // `/api/evidence/[evidenceId]/file` (presigned GET / private bucket).
          url: row.storageId
            ? await ctx.storage.getUrl(row.storageId)
            : null,
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
    if (row.storageId) {
      await ctx.storage.delete(row.storageId);
    }
    // R2 objects are deleted by Next `/api/evidence/[evidenceId]` when present.
    await ctx.db.delete(args.evidenceId);
    return { r2Key: row.r2Key ?? null };
  },
});

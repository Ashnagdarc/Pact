import { v } from "convex/values";

import type { TableNames } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import { assertServerSecret } from "./lib/serverSecret";

/** Every application table in convex/schema.ts — keep in sync with the schema. */
const ALL_TABLES: TableNames[] = [
  "users",
  "tasks",
  "pacts",
  "pactMembers",
  "invitations",
  "commitments",
  "checkIns",
  "evidence",
  "partnerResponses",
  "recoveryPlans",
  "weeklyReviews",
  "notifications",
  "pushSubscriptions",
  "waitlistSignups",
  "activityEvents",
];

/**
 * One-off admin wipe: deletes every document in every app table plus all
 * Convex file storage. Internal (not client-callable) and secret-guarded;
 * run via `npx convex run admin_wipe:wipeAll '{"secret":"..."}' [--prod]`.
 */
export const wipeAll = internalMutation({
  args: { secret: v.string() },
  handler: async (ctx, args) => {
    assertServerSecret(args.secret);

    const deleted: Record<string, number> = {};
    for (const table of ALL_TABLES) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      deleted[table] = docs.length;
    }

    const files = await ctx.db.system.query("_storage").collect();
    for (const file of files) {
      await ctx.storage.delete(file._id);
    }
    deleted._storage = files.length;

    return deleted;
  },
});

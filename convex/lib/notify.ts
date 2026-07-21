import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type NotifyArgs = {
  userId: Id<"users">;
  type: string;
  title: string;
  body: string;
  href?: string;
  pactId?: Id<"pacts">;
  commitmentId?: Id<"commitments">;
  actorId?: Id<"users">;
  metadata?: unknown;
};

export async function notify(ctx: MutationCtx, args: NotifyArgs) {
  if (args.actorId && args.actorId === args.userId) {
    return null;
  }

  return await ctx.db.insert("notifications", {
    userId: args.userId,
    type: args.type,
    title: args.title,
    body: args.body,
    href: args.href,
    pactId: args.pactId,
    commitmentId: args.commitmentId,
    actorId: args.actorId,
    metadata: args.metadata,
  });
}

export async function notifyPactPartners(
  ctx: MutationCtx,
  args: {
    pactId: Id<"pacts">;
    excludeUserId?: Id<"users">;
    type: string;
    title: string;
    body: string;
    href?: string;
    commitmentId?: Id<"commitments">;
    actorId?: Id<"users">;
  }
) {
  const members = await ctx.db
    .query("pactMembers")
    .withIndex("by_pact", (q) => q.eq("pactId", args.pactId))
    .collect();

  const ids: Id<"notifications">[] = [];

  for (const member of members) {
    if (member.invitationStatus !== "accepted") continue;
    if (args.excludeUserId && member.userId === args.excludeUserId) continue;

    const id = await notify(ctx, {
      userId: member.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      href: args.href,
      pactId: args.pactId,
      commitmentId: args.commitmentId,
      actorId: args.actorId,
    });
    if (id) ids.push(id);
  }

  return ids;
}

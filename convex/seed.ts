import { mutation } from "./_generated/server";

/**
 * Demo seed is disabled now that Convex requires verified Better Auth identity.
 * Keep this export so `npm run seed` fails loudly instead of creating spoofable users.
 */
export const seedDemo = mutation({
  args: {},
  handler: async () => {
    throw new Error(
      "Demo seed is disabled. Use Better Auth sign-up for real users."
    );
  },
});

import { mutation } from "./_generated/server";

/**
 * Idempotent demo seed for local development.
 * Safe to run repeatedly — skips if demo data already exists.
 */
export const seedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    const demoEmail = "demo@pact.local";
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", demoEmail))
      .unique();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        displayName: "Daniel",
        email: demoEmail,
        timezone: "Africa/Lagos",
        onboardingCompleted: true,
        isDemo: true,
      });
      user = (await ctx.db.get(userId))!;
    }

    const existingPacts = await ctx.db
      .query("pacts")
      .withIndex("by_owner", (q) => q.eq("ownerId", user!._id))
      .collect();

    if (existingPacts.length > 0) {
      return { userId: user._id, seeded: false };
    }

    const partnerIds = await Promise.all([
      ctx.db.insert("users", {
        displayName: "Maya Chen",
        email: "maya@pact.local",
        timezone: "Africa/Lagos",
        onboardingCompleted: true,
        isDemo: true,
      }),
      ctx.db.insert("users", {
        displayName: "Jordan Lee",
        email: "jordan@pact.local",
        timezone: "Africa/Lagos",
        onboardingCompleted: true,
        isDemo: true,
      }),
      ctx.db.insert("users", {
        displayName: "Sam Okoro",
        email: "sam@pact.local",
        timezone: "Africa/Lagos",
        onboardingCompleted: true,
        isDemo: true,
      }),
    ]);

    const now = Date.now();
    const laterToday = now + 1000 * 60 * 60 * 4;

    const pactDefs = [
      {
        title: "Career sprint",
        description: "Ship portfolio and apply consistently",
        tone: "signal" as const,
        members: [partnerIds[0]],
      },
      {
        title: "Sweet home",
        description: "Shared household goals",
        tone: "volt" as const,
        members: [partnerIds[0], partnerIds[1]],
      },
      {
        title: "Thesis crew",
        description: "Exam prep and chapter deadlines",
        tone: "paper" as const,
        members: partnerIds,
      },
    ];

    const pactIds = [];
    for (const def of pactDefs) {
      const pactId = await ctx.db.insert("pacts", {
        ownerId: user._id,
        title: def.title,
        description: def.description,
        privacyLevel: "invite_only",
        healthStatus: "healthy",
        status: "active",
        startAt: now,
        tone: def.tone,
      });

      await ctx.db.insert("pactMembers", {
        pactId,
        userId: user._id,
        role: "owner",
        invitationStatus: "accepted",
        joinedAt: now,
        lastActiveAt: now,
      });

      for (const memberId of def.members) {
        await ctx.db.insert("pactMembers", {
          pactId,
          userId: memberId,
          role: "partner",
          invitationStatus: "accepted",
          joinedAt: now,
          lastActiveAt: now,
        });
      }

      pactIds.push(pactId);
    }

    await ctx.db.insert("commitments", {
      pactId: pactIds[0],
      creatorId: user._id,
      assigneeId: user._id,
      title: "Plan for the day",
      status: "on_track",
      dueAt: laterToday,
      evidenceRequired: false,
      favorited: true,
      tone: "coral",
      checklist: [
        { label: "Outline portfolio", done: true },
        { label: "Gym check-in", done: false },
        { label: "Send update", done: false },
      ],
    });

    await ctx.db.insert("commitments", {
      pactId: pactIds[0],
      creatorId: user._id,
      assigneeId: user._id,
      title: "Ship landing hero",
      status: "slipping",
      dueAt: laterToday,
      evidenceRequired: true,
      favorited: true,
      tone: "volt",
      description: "Update 2h ago",
    });

    await ctx.db.insert("commitments", {
      pactId: pactIds[2],
      creatorId: user._id,
      assigneeId: user._id,
      title: "Exam prep pact",
      status: "need_help",
      dueAt: laterToday,
      evidenceRequired: false,
      favorited: true,
      tone: "cream",
      description: "5 notes · with Jordan",
    });

    // Completed this week for the stat hero
    await ctx.db.insert("commitments", {
      pactId: pactIds[0],
      creatorId: user._id,
      assigneeId: user._id,
      title: "Write case study draft",
      status: "done",
      dueAt: now - 1000 * 60 * 60 * 24,
      completedAt: now - 1000 * 60 * 60 * 20,
      evidenceRequired: false,
      favorited: false,
      tone: "mint",
    });

    await ctx.db.insert("commitments", {
      pactId: pactIds[1],
      creatorId: user._id,
      assigneeId: user._id,
      title: "Grocery restock",
      status: "done",
      dueAt: now - 1000 * 60 * 60 * 48,
      completedAt: now - 1000 * 60 * 60 * 40,
      evidenceRequired: false,
      favorited: false,
      tone: "paper",
    });

    for (let i = 0; i < 5; i++) {
      await ctx.db.insert("commitments", {
        pactId: pactIds[i % 3],
        creatorId: user._id,
        assigneeId: user._id,
        title: `Completed task ${i + 1}`,
        status: "done",
        dueAt: now - 1000 * 60 * 60 * 24 * (i + 1),
        completedAt: now - 1000 * 60 * 60 * 20 * (i + 1),
        evidenceRequired: false,
        favorited: false,
      });
    }

    await ctx.db.insert("activityEvents", {
      userId: user._id,
      eventName: "demo_seeded",
      metadata: { pactCount: pactIds.length },
    });

    return { userId: user._id, seeded: true };
  },
});

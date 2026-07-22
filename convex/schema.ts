import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  accountabilityStyle,
  blockerType,
  cardTone,
  checkInFrequency,
  checkInSignal,
  commitmentStatus,
  invitationStatus,
  memberRole,
  pactHealthStatus,
  partnerResponseType,
  recoveryAction,
  recoveryApprovalStatus,
} from "./lib/validators";

export default defineSchema({
  users: defineTable({
    authUserId: v.optional(v.string()),
    displayName: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    timezone: v.string(),
    onboardingCompleted: v.boolean(),
    goalFocus: v.optional(v.string()),
    defaultAccountabilityStyle: v.optional(accountabilityStyle),
    defaultCheckInFrequency: v.optional(checkInFrequency),
    isDemo: v.optional(v.boolean()),
  })
    .index("by_authUserId", ["authUserId"])
    .index("by_email", ["email"]),

  tasks: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("done"),
      v.literal("cancelled")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    dueAt: v.optional(v.number()),
    reminderAt: v.optional(v.number()),
    favorited: v.boolean(),
    tone: v.optional(cardTone),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_dueAt", ["ownerId", "dueAt"]),

  pacts: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    goalType: v.optional(v.string()),
    accountabilityStyle: v.optional(accountabilityStyle),
    checkInFrequency: v.optional(checkInFrequency),
    evidencePolicy: v.optional(v.string()),
    privacyLevel: v.union(
      v.literal("private"),
      v.literal("partners"),
      v.literal("invite_only")
    ),
    healthStatus: pactHealthStatus,
    startAt: v.optional(v.number()),
    targetEndAt: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("ended")
    ),
    tone: v.optional(cardTone),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"]),

  pactMembers: defineTable({
    pactId: v.id("pacts"),
    userId: v.id("users"),
    role: memberRole,
    invitationStatus: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    joinedAt: v.optional(v.number()),
    lastActiveAt: v.optional(v.number()),
  })
    .index("by_pact", ["pactId"])
    .index("by_user", ["userId"])
    .index("by_pact_user", ["pactId", "userId"]),

  invitations: defineTable({
    token: v.string(),
    pactId: v.id("pacts"),
    createdBy: v.id("users"),
    role: memberRole,
    status: invitationStatus,
    inviteeName: v.optional(v.string()),
    inviteeUserId: v.optional(v.id("users")),
    expiresAt: v.number(),
    acceptedAt: v.optional(v.number()),
    declinedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_pact", ["pactId"])
    .index("by_status", ["status"]),

  commitments: defineTable({
    pactId: v.optional(v.id("pacts")),
    creatorId: v.id("users"),
    assigneeId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    completionCriteria: v.optional(v.string()),
    status: commitmentStatus,
    dueAt: v.optional(v.number()),
    reminderAt: v.optional(v.number()),
    evidenceRequired: v.boolean(),
    favorited: v.boolean(),
    completedAt: v.optional(v.number()),
    reminderSentAt: v.optional(v.number()),
    checklist: v.optional(
      v.array(
        v.object({
          label: v.string(),
          done: v.boolean(),
        })
      )
    ),
    tone: v.optional(cardTone),
  })
    .index("by_assignee", ["assigneeId"])
    .index("by_pact", ["pactId"])
    .index("by_assignee_dueAt", ["assigneeId", "dueAt"]),

  checkIns: defineTable({
    commitmentId: v.id("commitments"),
    userId: v.id("users"),
    signal: checkInSignal,
    note: v.optional(v.string()),
    blockerType: v.optional(v.string()),
  })
    .index("by_commitment", ["commitmentId"])
    .index("by_user", ["userId"]),

  evidence: defineTable({
    commitmentId: v.id("commitments"),
    checkInId: v.optional(v.id("checkIns")),
    uploadedBy: v.id("users"),
    storageId: v.id("_storage"),
    fileType: v.string(),
    caption: v.optional(v.string()),
  })
    .index("by_commitment", ["commitmentId"])
    .index("by_checkIn", ["checkInId"])
    .index("by_uploadedBy", ["uploadedBy"]),

  partnerResponses: defineTable({
    checkInId: v.id("checkIns"),
    responderId: v.id("users"),
    responseType: partnerResponseType,
    note: v.optional(v.string()),
  })
    .index("by_checkIn", ["checkInId"])
    .index("by_responder", ["responderId"]),

  recoveryPlans: defineTable({
    commitmentId: v.id("commitments"),
    createdBy: v.id("users"),
    blockerType: blockerType,
    recoveryAction: recoveryAction,
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
    approvalStatus: recoveryApprovalStatus,
    approvedBy: v.optional(v.id("users")),
    appliedAt: v.optional(v.number()),
  })
    .index("by_commitment", ["commitmentId"])
    .index("by_createdBy", ["createdBy"]),

  weeklyReviews: defineTable({
    pactId: v.optional(v.id("pacts")),
    userId: v.optional(v.id("users")),
    weekStart: v.number(),
    weekEnd: v.number(),
    completedCount: v.number(),
    missedCount: v.number(),
    recoveredCount: v.number(),
    openCount: v.number(),
    topBlockers: v.array(v.string()),
    partnerResponseRate: v.number(),
    checkInCount: v.number(),
    summary: v.string(),
    dailyCompletions: v.array(
      v.object({
        day: v.string(),
        count: v.number(),
        target: v.number(),
      })
    ),
  })
    .index("by_pact_week", ["pactId", "weekStart"])
    .index("by_user_week", ["userId", "weekStart"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    href: v.optional(v.string()),
    pactId: v.optional(v.id("pacts")),
    commitmentId: v.optional(v.id("commitments")),
    actorId: v.optional(v.id("users")),
    readAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_user_readAt", ["userId", "readAt"]),

  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    expirationTime: v.optional(v.number()),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  waitlistSignups: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    source: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  activityEvents: defineTable({
    userId: v.optional(v.id("users")),
    pactId: v.optional(v.id("pacts")),
    eventName: v.string(),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_eventName", ["eventName"])
    .index("by_pact", ["pactId"]),
});

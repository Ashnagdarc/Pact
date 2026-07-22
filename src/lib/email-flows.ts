/**
 * Canonical list of Brevo-backed email / contact flows in Pact.
 * Used by `/api/email-status` and kept as the source of truth for ops.
 */
export const BREVO_EMAIL_FLOWS = [
  {
    id: "password_reset",
    name: "Password reset",
    trigger: "Forgot password → requestPasswordReset",
    channel: "smtp" as const,
    env: ["BREVO_API_KEY", "EMAIL_FROM"] as const,
    routeHints: ["/forgot-password", "/reset-password"],
  },
  {
    id: "delete_account_verify",
    name: "Delete account email confirmation",
    trigger: "deleteUser without password → sendDeleteAccountVerification",
    channel: "smtp" as const,
    env: ["BREVO_API_KEY", "EMAIL_FROM"] as const,
    routeHints: ["/app/profile"],
    note: "UI prefers password delete; email path remains for OAuth / no-password cases.",
  },
  {
    id: "pact_invite",
    name: "Pact partner invite",
    trigger: "Profile/Pact detail → send invite email",
    channel: "smtp" as const,
    env: ["BREVO_API_KEY", "EMAIL_FROM"] as const,
    routeHints: ["/app/pacts/[pactId]#invite", "/api/invite-email"],
  },
  {
    id: "product_notifications",
    name: "Product activity emails (assignments, check-ins, rescue, reminders)",
    trigger: "notify() → Convex email.deliverToUser",
    channel: "smtp" as const,
    env: ["BREVO_API_KEY", "EMAIL_FROM", "SITE_URL"] as const,
    routeHints: ["Convex BREVO_API_KEY / SITE_URL"],
    note: "Covers partner_update, help_request, partner_response, recovery_plan, invitation_accepted, commitment_due, rescue_prompt.",
  },
  {
    id: "beta_waitlist",
    name: "Beta waitlist signup + welcome access email",
    trigger: "Landing waitlist form → POST /api/waitlist",
    channel: "contacts" as const,
    env: ["BREVO_API_KEY", "BREVO_BETA_WAITLIST_LIST_ID", "EMAIL_FROM"] as const,
    routeHints: ["/#waitlist", "/api/waitlist", "/beta/[token]"],
    note: "Adds contact to Brevo list, mints one-time 6-digit code + /beta/[token] link, sends welcome email.",
  },
] as const;

export type BrevoFlowId = (typeof BREVO_EMAIL_FLOWS)[number]["id"];

export function getBrevoEnvStatus() {
  const hasApiKey = Boolean(process.env.BREVO_API_KEY?.trim());
  const hasFrom = Boolean(process.env.EMAIL_FROM?.trim());
  const listRaw = process.env.BREVO_BETA_WAITLIST_LIST_ID?.trim() ?? "";
  const listId = Number(listRaw);
  const hasWaitlistList = Number.isFinite(listId) && listId > 0;

  const flows = BREVO_EMAIL_FLOWS.map((flow) => {
    const missing = flow.env.filter((key) => {
      if (key === "BREVO_API_KEY") return !hasApiKey;
      if (key === "EMAIL_FROM") return false; // has default in sendEmail
      if (key === "BREVO_BETA_WAITLIST_LIST_ID") return !hasWaitlistList;
      if (key === "SITE_URL") return false; // Convex-side; Next status can't see it
      return true;
    });
    // EMAIL_FROM is optional (defaults), but report whether custom is set.
    const ready =
      flow.channel === "contacts"
        ? hasApiKey && hasWaitlistList
        : hasApiKey;

    return {
      id: flow.id,
      name: flow.name,
      channel: flow.channel,
      ready,
      missingRequired: missing.filter((k) => k !== "EMAIL_FROM"),
      emailFromConfigured: hasFrom,
      note: "note" in flow ? flow.note : undefined,
      routeHints: [...flow.routeHints],
    };
  });

  return {
    brevoApiKeyConfigured: hasApiKey,
    emailFromConfigured: hasFrom,
    emailFromDefault: "Pact <noreply@joinpact.tech>",
    waitlistListConfigured: hasWaitlistList,
    flows,
    allSmtpReady: hasApiKey,
    waitlistReady: hasApiKey && hasWaitlistList,
  };
}

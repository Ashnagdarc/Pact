import { waitUntil } from "@vercel/functions";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type CapturedResetLink = {
  email: string;
  url: string;
  token: string;
  at: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __pactLastResetLink: CapturedResetLink | undefined;
}

function captureEnabled() {
  return (
    process.env.PACT_CAPTURE_RESET_LINKS === "1" ||
    process.env.NODE_ENV !== "production"
  );
}

export function captureResetLink(input: {
  email: string;
  url: string;
  token: string;
}) {
  if (!captureEnabled()) return;
  globalThis.__pactLastResetLink = {
    ...input,
    at: Date.now(),
  };
  console.info("[pact-email] reset link captured for", input.email);
}

export function getCapturedResetLink() {
  return globalThis.__pactLastResetLink ?? null;
}

function parseFromAddress(from: string): { name: string; email: string } {
  const match = from.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim() || "Pact", email: match[2].trim() };
  }
  return { name: "Pact", email: from.trim() };
}

/**
 * Send via Brevo. Throws when the API key is missing in production or Brevo fails.
 */
export async function sendEmail(input: SendEmailInput) {
  const apiKey = process.env.BREVO_API_KEY;
  const from = parseFromAddress(
    process.env.EMAIL_FROM ?? "Pact <noreply@joinpact.tech>"
  );

  if (!apiKey) {
    const message = `[pact-email] BREVO_API_KEY missing; cannot send "${input.subject}" to ${input.to}`;
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }
    console.info(message, { text: input.text });
    return { sent: false as const };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: from,
      to: [{ email: input.to }],
      subject: input.subject,
      textContent: input.text,
      htmlContent: input.html ?? `<p>${input.text}</p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo failed (${response.status}): ${body}`);
  }

  return { sent: true as const };
}

/**
 * Fire email without blocking the Better Auth response (timing-safe),
 * but keep the serverless invocation alive until Brevo finishes.
 */
export function queueEmail(input: SendEmailInput) {
  const task = sendEmail(input).catch((error) => {
    console.error("[pact-email] queued send failed", error);
  });
  waitUntil(task);
  return task;
}

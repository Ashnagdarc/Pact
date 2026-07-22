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

export async function sendEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ?? "Pact <onboarding@resend.dev>";

  if (!apiKey) {
    console.info("[pact-email] RESEND_API_KEY missing; email not sent", {
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { sent: false as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html ?? `<p>${input.text}</p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend failed (${response.status}): ${body}`);
  }

  return { sent: true as const };
}

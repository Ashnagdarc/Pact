import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WaitlistBody = {
  email?: string;
  name?: string;
};

export async function POST(request: Request) {
  let body: WaitlistBody;
  try {
    body = (await request.json()) as WaitlistBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const name = body.name?.trim() ?? "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address" },
      { status: 400 },
    );
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_BETA_WAITLIST_LIST_ID);

  if (!apiKey || !Number.isFinite(listId) || listId <= 0) {
    console.error("[waitlist] Brevo waitlist is not configured");
    return NextResponse.json(
      { error: "Waitlist is temporarily unavailable" },
      { status: 503 },
    );
  }

  const attributes: Record<string, string | boolean> = {
    SOURCE: "beta_waitlist",
    BETA_WAITLIST: true,
  };
  if (name) {
    attributes.FIRSTNAME = name;
  }

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      attributes,
      listIds: [listId],
      updateEnabled: true,
    }),
  });

  if (!response.ok && response.status !== 204) {
    const payload = await response.text();
    // Duplicate contact that was already updated still counts as success.
    if (response.status !== 400 || !payload.includes("Contact already exist")) {
      console.error("[waitlist] Brevo error", response.status, payload);
      return NextResponse.json(
        { error: "Could not join the waitlist. Try again." },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}

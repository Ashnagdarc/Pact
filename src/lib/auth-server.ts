import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function isAuthenticated() {
  const session = await getSession();
  return Boolean(session);
}

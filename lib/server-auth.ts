import { getCookieSessionToken, getSessionFromCookieToken } from "@/lib/custom-session";

export async function getCurrentUserId() {
  const sessionToken = getCookieSessionToken();
  if (!sessionToken) {
    return null;
  }

  const session = await getSessionFromCookieToken(sessionToken);
  return session?.userId ?? null;
}

export async function requireUserId() {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}
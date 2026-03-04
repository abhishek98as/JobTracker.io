import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "jobtrackr_session";
const SESSION_DAYS = 30;

export async function createSession(userId: string) {
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires
    }
  });

  return session;
}

export async function deleteSessionByToken(sessionToken: string) {
  await prisma.session
    .delete({
      where: {
        sessionToken
      }
    })
    .catch(() => null);
}

export async function getSessionFromCookieToken(sessionToken: string) {
  const session = await prisma.session.findUnique({
    where: {
      sessionToken
    },
    include: {
      user: true
    }
  });

  if (!session) {
    return null;
  }

  if (session.expires < new Date()) {
    await deleteSessionByToken(sessionToken);
    return null;
  }

  return session;
}

export function getCookieSessionToken() {
  return cookies().get(SESSION_COOKIE_NAME)?.value ?? null;
}

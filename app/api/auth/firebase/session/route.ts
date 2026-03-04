import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSessionByToken, getSessionFromCookieToken, SESSION_COOKIE_NAME } from "@/lib/custom-session";
import { verifyFirebaseIdToken } from "@/lib/firebase-auth-server";

const bodySchema = z.object({
  idToken: z.string().min(1)
});

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionToken) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const session = await getSessionFromCookieToken(sessionToken);
    if (!session) {
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.set(SESSION_COOKIE_NAME, "", {
        path: "/",
        expires: new Date(0)
      });
      return response;
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image
      }
    });
  } catch {
    return NextResponse.json({ error: "Failed to read session" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.parse(await request.json());
    const verifiedUser = await verifyFirebaseIdToken(parsed.idToken);

    const user = await prisma.user.upsert({
      where: {
        email: verifiedUser.email
      },
      create: {
        email: verifiedUser.email,
        name: verifiedUser.name,
        image: verifiedUser.image
      },
      update: {
        name: verifiedUser.name,
        image: verifiedUser.image
      }
    });

    const session = await createSession(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image
      }
    });

    response.cookies.set(SESSION_COOKIE_NAME, session.sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: session.expires
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create session" },
      { status: 401 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (sessionToken) {
      await deleteSessionByToken(sessionToken);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      path: "/",
      expires: new Date(0)
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Failed to clear session" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "200");

    const events = await prisma.activityEvent.findMany({
      where: {
        userId
      },
      orderBy: {
        occurredAt: "desc"
      },
      take: Number.isFinite(limit) ? Math.min(Math.max(limit, 10), 1000) : 200,
      include: {
        application: {
          select: {
            id: true,
            company: true,
            role: true,
            status: true,
            platform: true
          }
        }
      }
    });

    return NextResponse.json({ events });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch timeline" }, { status: 500 });
  }
}
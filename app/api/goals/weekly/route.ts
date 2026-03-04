import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import { getIsoWeekRange, getIsoWeekStart } from "@/lib/week-utils";

const goalCreateSchema = z.object({
  weekStartDate: z.string().datetime().optional(),
  targetApplications: z.number().int().min(1).max(200)
});

const goalPatchSchema = z.object({
  id: z.string().optional(),
  weekStartDate: z.string().datetime().optional(),
  targetApplications: z.number().int().min(1).max(200)
});

function normalizeWeekStart(input?: string) {
  if (input) {
    return getIsoWeekStart(new Date(input));
  }

  return getIsoWeekStart(new Date());
}

function localDayKey(date: Date, tzOffsetMinutes: number) {
  const shifted = new Date(date.getTime() - tzOffsetMinutes * 60_000);
  return shifted.toISOString().slice(0, 10);
}

function computeStreak(dayKeys: Set<string>, tzOffsetMinutes: number) {
  let streak = 0;
  let cursor = new Date();

  while (true) {
    const key = localDayKey(cursor, tzOffsetMinutes);
    if (!dayKeys.has(key)) {
      break;
    }
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }

  return streak;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const weekStartInput = searchParams.get("weekStartDate") ?? undefined;
    const tzOffsetMinutes = Number(searchParams.get("tzOffsetMinutes") ?? "0");

    const weekStartDate = normalizeWeekStart(weekStartInput);
    const weekRange = getIsoWeekRange(weekStartDate);

    const [goal, weeklyApplicationsCount, createEvents] = await Promise.all([
      prisma.weeklyGoal.findUnique({
        where: {
          userId_weekStartDate: {
            userId,
            weekStartDate
          }
        }
      }),
      prisma.activityEvent.count({
        where: {
          userId,
          eventType: "application_created",
          occurredAt: {
            gte: weekRange.start,
            lte: weekRange.end
          }
        }
      }),
      prisma.activityEvent.findMany({
        where: {
          userId,
          eventType: "application_created"
        },
        select: {
          occurredAt: true
        },
        orderBy: {
          occurredAt: "desc"
        },
        take: 500
      })
    ]);

    const daySet = new Set(createEvents.map((event) => localDayKey(event.occurredAt, tzOffsetMinutes)));
    const streak = computeStreak(daySet, tzOffsetMinutes);

    return NextResponse.json({
      weekStartDate,
      weekEndDate: weekRange.end,
      goal,
      progress: {
        appliedThisWeek: weeklyApplicationsCount,
        targetApplications: goal?.targetApplications ?? null,
        completionPct: goal ? Math.min(100, Math.round((weeklyApplicationsCount / goal.targetApplications) * 100)) : null,
        streak
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch weekly goal" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = goalCreateSchema.parse(await request.json());

    const weekStartDate = normalizeWeekStart(parsed.weekStartDate);

    const goal = await prisma.weeklyGoal.upsert({
      where: {
        userId_weekStartDate: {
          userId,
          weekStartDate
        }
      },
      create: {
        userId,
        weekStartDate,
        targetApplications: parsed.targetApplications
      },
      update: {
        targetApplications: parsed.targetApplications
      }
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to upsert weekly goal" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = goalPatchSchema.parse(await request.json());

    const existing = parsed.id
      ? await prisma.weeklyGoal.findFirst({ where: { id: parsed.id, userId } })
      : parsed.weekStartDate
        ? await prisma.weeklyGoal.findUnique({
            where: {
              userId_weekStartDate: {
                userId,
                weekStartDate: normalizeWeekStart(parsed.weekStartDate)
              }
            }
          })
        : null;

    if (!existing) {
      return NextResponse.json({ error: "Weekly goal not found" }, { status: 404 });
    }

    const goal = await prisma.weeklyGoal.update({
      where: {
        id: existing.id
      },
      data: {
        targetApplications: parsed.targetApplications
      }
    });

    return NextResponse.json({ goal });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update weekly goal" }, { status: 500 });
  }
}
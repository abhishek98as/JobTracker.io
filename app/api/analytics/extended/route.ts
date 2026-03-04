import { NextRequest, NextResponse } from "next/server";
import { subWeeks, startOfWeek, endOfWeek, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import { getIsoWeekStart } from "@/lib/week-utils";

const POSITIVE_STATUSES = new Set(["responded", "interview", "offer", "accepted"]);
const APPLIED_STATUSES = new Set(["applied", "responded", "interview", "offer", "accepted"]);

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const tzOffsetMinutes = Number(searchParams.get("tzOffsetMinutes") ?? "0");

    const [applications, createEvents, weeklyGoal] = await Promise.all([
      prisma.application.findMany({
        where: { userId },
        select: {
          id: true,
          platform: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          appliedAt: true
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
        }
      }),
      prisma.weeklyGoal.findUnique({
        where: {
          userId_weekStartDate: {
            userId,
            weekStartDate: getIsoWeekStart(new Date())
          }
        }
      })
    ]);

    const total = applications.length;
    const byStatus = (status: string) => applications.filter((application) => application.status === status).length;

    const applied = applications.filter((application) => APPLIED_STATUSES.has(application.status)).length;
    const responded = applications.filter((application) => POSITIVE_STATUSES.has(application.status)).length;
    const interview = byStatus("interview") + byStatus("offer") + byStatus("accepted");
    const offer = byStatus("offer") + byStatus("accepted");
    const accepted = byStatus("accepted");

    const funnel = [
      { stage: "Applied", value: applied },
      { stage: "Responded", value: responded },
      { stage: "Interview", value: interview },
      { stage: "Offer", value: offer },
      { stage: "Accepted", value: accepted }
    ];

    const platformMap = new Map<string, { total: number; positive: number }>();
    applications.forEach((application) => {
      if (!platformMap.has(application.platform)) {
        platformMap.set(application.platform, { total: 0, positive: 0 });
      }

      const entry = platformMap.get(application.platform)!;
      entry.total += 1;
      if (POSITIVE_STATUSES.has(application.status)) {
        entry.positive += 1;
      }
    });

    const platformBreakdown = [...platformMap.entries()].map(([platform, metrics]) => ({
      platform,
      count: metrics.total,
      responseRate: metrics.total ? Math.round((metrics.positive / metrics.total) * 100) : 0
    }));

    const bestPlatform = [...platformBreakdown].sort((a, b) => {
      if (b.responseRate !== a.responseRate) {
        return b.responseRate - a.responseRate;
      }
      return b.count - a.count;
    })[0] ?? null;

    const responseCandidates = applications.filter((application) => POSITIVE_STATUSES.has(application.status));
    const avgResponseTimeDays = responseCandidates.length
      ? Math.round(
          (responseCandidates.reduce((sum, application) => {
            const baseDate = application.appliedAt ?? application.createdAt;
            const days = Math.max(0, Math.round((application.updatedAt.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)));
            return sum + days;
          }, 0) /
            responseCandidates.length) *
            10
        ) / 10
      : 0;

    const weeklyBars = Array.from({ length: 8 }).map((_, index) => {
      const current = subWeeks(new Date(), 7 - index);
      const start = startOfWeek(current, { weekStartsOn: 1 });
      const end = endOfWeek(current, { weekStartsOn: 1 });

      const count = createEvents.filter((event) => event.occurredAt >= start && event.occurredAt <= end).length;
      return {
        label: format(start, "dd MMM"),
        value: count,
        weekStart: start.toISOString()
      };
    });

    const firstApplicationDate = applications.length
      ? applications.reduce((min, app) => (app.createdAt < min ? app.createdAt : min), applications[0].createdAt)
      : new Date();
    const dayCounter = Math.max(1, Math.floor((Date.now() - firstApplicationDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const toLocalDayKey = (date: Date) => {
      const shifted = new Date(date.getTime() - tzOffsetMinutes * 60_000);
      return shifted.toISOString().slice(0, 10);
    };

    const daySet = new Set(createEvents.map((event) => toLocalDayKey(event.occurredAt)));
    let streak = 0;
    let cursor = new Date();
    while (true) {
      const key = toLocalDayKey(cursor);
      if (!daySet.has(key)) {
        break;
      }
      streak += 1;
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
    }

    const currentWeekStart = getIsoWeekStart(new Date());
    const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const appliedThisWeek = createEvents.filter(
      (event) => event.occurredAt >= currentWeekStart && event.occurredAt <= currentWeekEnd
    ).length;

    return NextResponse.json({
      kpis: {
        totalApplications: total,
        responseRate: applied ? Math.round((responded / applied) * 100) : 0,
        interviewRate: applied ? Math.round((interview / applied) * 100) : 0,
        offerRate: applied ? Math.round((offer / applied) * 100) : 0,
        avgResponseTimeDays,
        bestPlatform,
        dayCounter,
        streak,
        weeklyGoal: weeklyGoal
          ? {
              target: weeklyGoal.targetApplications,
              appliedThisWeek,
              completionPct: Math.min(100, Math.round((appliedThisWeek / weeklyGoal.targetApplications) * 100))
            }
          : null
      },
      funnel,
      platformBreakdown,
      weeklyBars
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch extended analytics" }, { status: 500 });
  }
}
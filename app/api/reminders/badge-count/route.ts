import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import { computeApplicationStaleLevel } from "@/lib/stale-utils";

export async function GET() {
  try {
    const userId = await requireUserId();

    const applications = await prisma.application.findMany({
      where: {
        userId,
        status: {
          notIn: ["accepted", "rejected"]
        }
      },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        createdAt: true,
        customReminderAt: true
      }
    });

    const now = new Date();
    const dueReminderIds = new Set<string>();

    applications.forEach((application) => {
      const stale = computeApplicationStaleLevel({
        appliedAt: application.appliedAt,
        createdAt: application.createdAt,
        status: application.status,
        now
      });

      if (stale.isStale) {
        dueReminderIds.add(application.id);
      }

      if (application.customReminderAt && application.customReminderAt <= now) {
        dueReminderIds.add(application.id);
      }
    });

    return NextResponse.json({
      badgeCount: dueReminderIds.size,
      staleCount: applications.filter((application) =>
        computeApplicationStaleLevel({
          appliedAt: application.appliedAt,
          createdAt: application.createdAt,
          status: application.status,
          now
        }).isStale
      ).length,
      customReminderDueCount: applications.filter(
        (application) => application.customReminderAt && application.customReminderAt <= now
      ).length
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch reminder badge count" }, { status: 500 });
  }
}
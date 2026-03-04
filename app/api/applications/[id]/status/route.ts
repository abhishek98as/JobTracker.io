import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import { PIPELINE_STATUSES } from "@/lib/constants";
import { logActivityEvent } from "@/lib/activity-events";

const statusValues = [...PIPELINE_STATUSES] as [string, ...string[]];

const statusSchema = z.object({
  toStatus: z.enum(statusValues)
});

type Context = {
  params: {
    id: string;
  };
};

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();
    const parsed = statusSchema.parse(await request.json());

    const existing = await prisma.application.findFirst({
      where: {
        id: context.params.id,
        userId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (parsed.toStatus === existing.status) {
      return NextResponse.json({ application: existing });
    }

    const application = await prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: {
          id: context.params.id
        },
        data: {
          status: parsed.toStatus,
          statusHistory: {
            create: {
              fromStatus: existing.status,
              toStatus: parsed.toStatus
            }
          }
        },
        include: {
          statusHistory: {
            orderBy: {
              changedAt: "desc"
            }
          },
          resume: true,
          referral: true,
          research: true
        }
      });

      await logActivityEvent({
        tx,
        userId,
        applicationId: updated.id,
        eventType: "status_changed",
        title: `Status changed to ${parsed.toStatus}`,
        description: `${existing.status} -> ${parsed.toStatus}`,
        meta: {
          fromStatus: existing.status,
          toStatus: parsed.toStatus
        }
      });

      if (["offer", "accepted", "rejected"].includes(parsed.toStatus)) {
        await logActivityEvent({
          tx,
          userId,
          applicationId: updated.id,
          eventType: "milestone_reached",
          title: `Milestone reached: ${parsed.toStatus}`,
          description: `${updated.company} - ${updated.role}`
        });
      }

      return updated;
    });

    return NextResponse.json({ application });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
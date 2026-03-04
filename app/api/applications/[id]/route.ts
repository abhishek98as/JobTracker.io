import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import { PIPELINE_STATUSES } from "@/lib/constants";
import { computeApplicationStaleLevel } from "@/lib/stale-utils";
import { logActivityEvent } from "@/lib/activity-events";

const statusValues = [...PIPELINE_STATUSES] as [string, ...string[]];

const patchSchema = z.object({
  company: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  platform: z.string().min(1).optional(),
  status: z.enum(statusValues).optional(),
  jobUrl: z.string().url().optional().or(z.literal("")),
  salary: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  appliedAt: z.string().datetime().optional().or(z.literal("")),
  resumeAssetId: z.string().optional().or(z.literal("")),
  referralContactId: z.string().optional().or(z.literal("")),
  customReminderAt: z.string().datetime().optional().or(z.literal("")),
  customReminderNote: z.string().optional()
});

type Context = {
  params: {
    id: string;
  };
};

function decorateApplication<T extends { appliedAt: Date | null; createdAt: Date; status: string }>(application: T) {
  const stale = computeApplicationStaleLevel({
    appliedAt: application.appliedAt,
    createdAt: application.createdAt,
    status: application.status
  });

  return {
    ...application,
    staleLevel: stale.staleLevel,
    daysSinceApplied: stale.daysSinceApplied,
    isStale: stale.isStale
  };
}

export async function GET(_request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();
    const application = await prisma.application.findFirst({
      where: {
        id: context.params.id,
        userId
      },
      include: {
        statusHistory: {
          orderBy: {
            changedAt: "desc"
          }
        },
        resume: true,
        referral: true,
        interviews: {
          orderBy: {
            createdAt: "desc"
          }
        },
        research: true
      }
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({ application: decorateApplication(application) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();
    const parsed = patchSchema.parse(await request.json());

    const existing = await prisma.application.findFirst({
      where: {
        id: context.params.id,
        userId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.application.update({
        where: { id: context.params.id },
        data: {
          ...parsed,
          jobUrl: parsed.jobUrl === "" ? null : parsed.jobUrl,
          contactEmail: parsed.contactEmail === "" ? null : parsed.contactEmail,
          appliedAt: parsed.appliedAt === "" ? null : parsed.appliedAt ? new Date(parsed.appliedAt) : undefined,
          resumeAssetId: parsed.resumeAssetId === "" ? null : parsed.resumeAssetId,
          referralContactId: parsed.referralContactId === "" ? null : parsed.referralContactId,
          customReminderAt:
            parsed.customReminderAt === ""
              ? null
              : parsed.customReminderAt
                ? new Date(parsed.customReminderAt)
                : undefined,
          statusHistory:
            parsed.status && parsed.status !== existing.status
              ? {
                  create: {
                    fromStatus: existing.status,
                    toStatus: parsed.status
                  }
                }
              : undefined
        },
        include: {
          statusHistory: {
            orderBy: {
              changedAt: "desc"
            }
          },
          resume: true,
          referral: true,
          interviews: {
            orderBy: {
              createdAt: "desc"
            }
          },
          research: true
        }
      });

      if (parsed.status && parsed.status !== existing.status) {
        await logActivityEvent({
          tx,
          userId,
          applicationId: application.id,
          eventType: "status_changed",
          title: `Status changed to ${parsed.status}`,
          description: `${existing.status} -> ${parsed.status}`,
          meta: {
            fromStatus: existing.status,
            toStatus: parsed.status
          }
        });

        if (["offer", "accepted", "rejected"].includes(parsed.status)) {
          await logActivityEvent({
            tx,
            userId,
            applicationId: application.id,
            eventType: "milestone_reached",
            title: `Milestone reached: ${parsed.status}`,
            description: `${application.company} - ${application.role}`
          });
        }
      }

      if (parsed.customReminderAt !== undefined || parsed.customReminderNote !== undefined) {
        await logActivityEvent({
          tx,
          userId,
          applicationId: application.id,
          eventType: "reminder_updated",
          title: "Reminder updated",
          description: "Follow-up reminder data changed."
        });
      }

      if (parsed.resumeAssetId !== undefined && parsed.resumeAssetId !== existing.resumeAssetId) {
        await logActivityEvent({
          tx,
          userId,
          applicationId: application.id,
          eventType: parsed.resumeAssetId ? "resume_linked" : "resume_unlinked",
          title: parsed.resumeAssetId ? "Resume linked" : "Resume unlinked"
        });
      }

      if (parsed.referralContactId !== undefined && parsed.referralContactId !== existing.referralContactId) {
        await logActivityEvent({
          tx,
          userId,
          applicationId: application.id,
          eventType: parsed.referralContactId ? "referral_linked" : "referral_unlinked",
          title: parsed.referralContactId ? "Referral linked" : "Referral unlinked"
        });
      }

      return application;
    });

    return NextResponse.json({ application: decorateApplication(result) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();

    const existing = await prisma.application.findFirst({
      where: {
        id: context.params.id,
        userId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    await prisma.application.delete({
      where: {
        id: context.params.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
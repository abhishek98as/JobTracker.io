import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import { PIPELINE_STATUSES } from "@/lib/constants";
import { buildApplicationWhere } from "@/lib/application-query";
import { detectDuplicateWarnings } from "@/lib/duplicate-detector";
import { computeApplicationStaleLevel } from "@/lib/stale-utils";
import { logActivityEvent } from "@/lib/activity-events";

const statusValues = [...PIPELINE_STATUSES] as [string, ...string[]];

const applicationSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  platform: z.string().min(1),
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

function parseBooleanQuery(value: string | null) {
  if (!value) {
    return false;
  }

  return value === "1" || value.toLowerCase() === "true";
}

function decorateApplications<T extends { appliedAt: Date | null; createdAt: Date; status: string; customReminderAt: Date | null }>(
  applications: T[]
) {
  const now = new Date();
  return applications.map((application) => {
    const stale = computeApplicationStaleLevel({
      appliedAt: application.appliedAt,
      createdAt: application.createdAt,
      status: application.status,
      now
    });

    return {
      ...application,
      staleLevel: stale.staleLevel,
      daysSinceApplied: stale.daysSinceApplied,
      isStale: stale.isStale,
      isReminderDue: application.customReminderAt ? application.customReminderAt <= now : false
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") ?? undefined;
    const platform = searchParams.get("platform") ?? undefined;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const query = searchParams.get("query") ?? undefined;
    const resumeAssetId = searchParams.get("resumeAssetId") ?? undefined;
    const referralContactId = searchParams.get("referralContactId") ?? undefined;
    const staleOnly = parseBooleanQuery(searchParams.get("staleOnly"));
    const dueReminderOnly = parseBooleanQuery(searchParams.get("dueReminderOnly"));

    const where = buildApplicationWhere({
      userId,
      query,
      status,
      platform,
      from,
      to,
      resumeAssetId,
      referralContactId,
      staleOnly,
      dueReminderOnly
    });

    const applications = await prisma.application.findMany({
      where,
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        statusHistory: {
          orderBy: {
            changedAt: "desc"
          }
        },
        resume: true,
        referral: true,
        research: true,
        interviews: {
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    let decorated = decorateApplications(applications);

    if (staleOnly) {
      decorated = decorated.filter((item) => item.isStale);
    }

    if (dueReminderOnly) {
      decorated = decorated.filter((item) => item.isReminderDue);
    }

    return NextResponse.json({
      applications: decorated,
      meta: {
        total: decorated.length,
        staleCount: decorated.filter((item) => item.isStale).length,
        reminderDueCount: decorated.filter((item) => item.isReminderDue).length
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const forceCreate = parseBooleanQuery(searchParams.get("forceCreate"));
    const payload = await request.json();
    const parsed = applicationSchema.parse(payload);

    const existingApplications = await prisma.application.findMany({
      where: { userId },
      select: {
        id: true,
        company: true,
        role: true,
        status: true,
        appliedAt: true,
        createdAt: true
      }
    });

    const duplicateWarnings = detectDuplicateWarnings({
      company: parsed.company,
      role: parsed.role,
      existingApplications
    });

    const application = await prisma.$transaction(async (tx) => {
      const created = await tx.application.create({
        data: {
          userId,
          company: parsed.company,
          role: parsed.role,
          platform: parsed.platform,
          status: parsed.status ?? "wishlist",
          jobUrl: parsed.jobUrl || null,
          salary: parsed.salary || null,
          contactName: parsed.contactName || null,
          contactEmail: parsed.contactEmail || null,
          notes: parsed.notes || null,
          appliedAt: parsed.appliedAt ? new Date(parsed.appliedAt) : null,
          resumeAssetId: parsed.resumeAssetId || null,
          referralContactId: parsed.referralContactId || null,
          customReminderAt: parsed.customReminderAt ? new Date(parsed.customReminderAt) : null,
          customReminderNote: parsed.customReminderNote || null,
          statusHistory: {
            create: {
              fromStatus: "created",
              toStatus: parsed.status ?? "wishlist"
            }
          }
        },
        include: {
          resume: true,
          referral: true,
          research: true,
          statusHistory: {
            orderBy: {
              changedAt: "desc"
            }
          }
        }
      });

      await logActivityEvent({
        tx,
        userId,
        applicationId: created.id,
        eventType: "application_created",
        title: `Applied to ${created.company}`,
        description: `${created.role} via ${created.platform}`,
        occurredAt: created.createdAt,
        meta: {
          status: created.status
        }
      });

      if (created.resumeAssetId) {
        await logActivityEvent({
          tx,
          userId,
          applicationId: created.id,
          eventType: "resume_linked",
          title: "Resume linked",
          description: "A resume was linked while creating the application."
        });
      }

      if (created.referralContactId) {
        await logActivityEvent({
          tx,
          userId,
          applicationId: created.id,
          eventType: "referral_linked",
          title: "Referral linked",
          description: "A referral contact was linked while creating the application."
        });
      }

      if (created.customReminderAt) {
        await logActivityEvent({
          tx,
          userId,
          applicationId: created.id,
          eventType: "reminder_updated",
          title: "Reminder set",
          description: "Custom follow-up reminder scheduled."
        });
      }

      return created;
    });

    const [decorated] = decorateApplications([application]);

    return NextResponse.json(
      {
        application: decorated,
        duplicateWarnings,
        forceCreate
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }
}

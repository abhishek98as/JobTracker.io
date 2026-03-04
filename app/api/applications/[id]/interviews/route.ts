import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import { ROUND_TYPES } from "@/lib/constants";
import { logActivityEvent } from "@/lib/activity-events";

const roundTypes = [...ROUND_TYPES] as [string, ...string[]];

const interviewSchema = z.object({
  roundType: z.enum(roundTypes),
  interviewerName: z.string().optional(),
  scheduledAt: z.string().datetime().optional().or(z.literal("")),
  questionsAsked: z.string().optional(),
  answersGiven: z.string().optional(),
  outcome: z.string().optional(),
  notes: z.string().optional()
});

type Context = {
  params: {
    id: string;
  };
};

async function ensureApplicationOwner(userId: string, applicationId: string) {
  const application = await prisma.application.findFirst({
    where: {
      id: applicationId,
      userId
    },
    select: {
      id: true,
      company: true,
      role: true
    }
  });

  return application;
}

export async function GET(_request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();
    const application = await ensureApplicationOwner(userId, context.params.id);

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const interviews = await prisma.interviewRound.findMany({
      where: {
        applicationId: context.params.id
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ interviews });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();
    const parsed = interviewSchema.parse(await request.json());
    const application = await ensureApplicationOwner(userId, context.params.id);

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const interview = await prisma.$transaction(async (tx) => {
      const created = await tx.interviewRound.create({
        data: {
          applicationId: context.params.id,
          roundType: parsed.roundType,
          interviewerName: parsed.interviewerName || null,
          scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : null,
          questionsAsked: parsed.questionsAsked || null,
          answersGiven: parsed.answersGiven || null,
          outcome: parsed.outcome || null,
          notes: parsed.notes || null
        }
      });

      await logActivityEvent({
        tx,
        userId,
        applicationId: context.params.id,
        eventType: "interview_added",
        title: `Interview round added (${created.roundType})`,
        description: `${application.company} - ${application.role}`,
        meta: {
          interviewId: created.id,
          roundType: created.roundType
        }
      });

      return created;
    });

    return NextResponse.json({ interview }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create interview round" }, { status: 500 });
  }
}
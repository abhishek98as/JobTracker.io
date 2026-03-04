import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import { ROUND_TYPES } from "@/lib/constants";
import { logActivityEvent } from "@/lib/activity-events";

const roundTypes = [...ROUND_TYPES] as [string, ...string[]];

const patchSchema = z.object({
  roundType: z.enum(roundTypes).optional(),
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

async function loadInterviewForUser(userId: string, interviewId: string) {
  return prisma.interviewRound.findFirst({
    where: {
      id: interviewId,
      application: {
        userId
      }
    },
    include: {
      application: {
        select: {
          id: true,
          company: true,
          role: true
        }
      }
    }
  });
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();
    const parsed = patchSchema.parse(await request.json());

    const existing = await loadInterviewForUser(userId, context.params.id);
    if (!existing) {
      return NextResponse.json({ error: "Interview round not found" }, { status: 404 });
    }

    const interview = await prisma.$transaction(async (tx) => {
      const updated = await tx.interviewRound.update({
        where: {
          id: context.params.id
        },
        data: {
          roundType: parsed.roundType,
          interviewerName: parsed.interviewerName,
          scheduledAt: parsed.scheduledAt === "" ? null : parsed.scheduledAt ? new Date(parsed.scheduledAt) : undefined,
          questionsAsked: parsed.questionsAsked,
          answersGiven: parsed.answersGiven,
          outcome: parsed.outcome,
          notes: parsed.notes
        }
      });

      await logActivityEvent({
        tx,
        userId,
        applicationId: existing.applicationId,
        eventType: "interview_updated",
        title: `Interview round updated (${updated.roundType})`,
        description: `${existing.application.company} - ${existing.application.role}`,
        meta: {
          interviewId: updated.id,
          roundType: updated.roundType
        }
      });

      return updated;
    });

    return NextResponse.json({ interview });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update interview round" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();

    const existing = await loadInterviewForUser(userId, context.params.id);
    if (!existing) {
      return NextResponse.json({ error: "Interview round not found" }, { status: 404 });
    }

    await prisma.interviewRound.delete({
      where: {
        id: context.params.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete interview round" }, { status: 500 });
  }
}
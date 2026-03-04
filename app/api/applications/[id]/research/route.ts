import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import { logActivityEvent } from "@/lib/activity-events";

const researchSchema = z.object({
  companySize: z.string().optional(),
  industry: z.string().optional(),
  techStack: z.string().optional(),
  glassdoorRating: z.string().optional(),
  cultureNotes: z.string().optional(),
  interviewInsights: z.string().optional()
});

type Context = {
  params: {
    id: string;
  };
};

async function loadApplication(userId: string, applicationId: string) {
  return prisma.application.findFirst({
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
}

export async function GET(_request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();
    const application = await loadApplication(userId, context.params.id);

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const research = await prisma.companyResearch.findUnique({
      where: {
        applicationId: context.params.id
      }
    });

    return NextResponse.json({ research });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch research" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();
    const parsed = researchSchema.parse(await request.json());
    const application = await loadApplication(userId, context.params.id);

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const research = await prisma.$transaction(async (tx) => {
      const upserted = await tx.companyResearch.upsert({
        where: {
          applicationId: context.params.id
        },
        create: {
          applicationId: context.params.id,
          ...parsed
        },
        update: parsed
      });

      await logActivityEvent({
        tx,
        userId,
        applicationId: context.params.id,
        eventType: "research_updated",
        title: "Company research updated",
        description: `${application.company} - ${application.role}`
      });

      return upserted;
    });

    return NextResponse.json({ research });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to save research" }, { status: 500 });
  }
}
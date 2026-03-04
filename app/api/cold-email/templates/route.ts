import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import { DEFAULT_TEMPLATE_BODY, DEFAULT_TEMPLATE_SUBJECT } from "@/lib/email-template";
import { z } from "zod";

const templateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1)
});

export async function GET() {
  try {
    const userId = await requireUserId();

    let templates = await prisma.emailTemplate.findMany({
      where: { userId },
      orderBy: {
        updatedAt: "desc"
      }
    });

    if (!templates.length) {
      const seeded = await prisma.emailTemplate.create({
        data: {
          userId,
          name: "Default Cold Outreach",
          subject: DEFAULT_TEMPLATE_SUBJECT,
          body: DEFAULT_TEMPLATE_BODY
        }
      });
      templates = [seeded];
    }

    return NextResponse.json({ templates });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = templateSchema.parse(await request.json());

    const template = await prisma.emailTemplate.create({
      data: {
        userId,
        ...parsed
      }
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";

const templatePatchSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional()
});

type Context = {
  params: {
    id: string;
  };
};

export async function GET(_request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();
    const template = await prisma.emailTemplate.findFirst({
      where: {
        id: context.params.id,
        userId
      }
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();
    const parsed = templatePatchSchema.parse(await request.json());

    const existing = await prisma.emailTemplate.findFirst({
      where: {
        id: context.params.id,
        userId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const template = await prisma.emailTemplate.update({
      where: {
        id: context.params.id
      },
      data: parsed
    });

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.emailTemplate.findFirst({
      where: {
        id: context.params.id,
        userId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    await prisma.emailTemplate.delete({
      where: {
        id: context.params.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
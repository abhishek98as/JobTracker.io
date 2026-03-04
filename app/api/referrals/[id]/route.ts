import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional()
});

type Context = {
  params: {
    id: string;
  };
};

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();
    const parsed = patchSchema.parse(await request.json());

    const existing = await prisma.referralContact.findFirst({
      where: {
        id: context.params.id,
        userId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    const referral = await prisma.referralContact.update({
      where: {
        id: context.params.id
      },
      data: {
        name: parsed.name,
        email: parsed.email === "" ? null : parsed.email,
        phone: parsed.phone === "" ? null : parsed.phone,
        linkedinUrl: parsed.linkedinUrl === "" ? null : parsed.linkedinUrl,
        notes: parsed.notes
      },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    return NextResponse.json({ referral });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update referral" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();

    const existing = await prisma.referralContact.findFirst({
      where: {
        id: context.params.id,
        userId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.application.updateMany({
        where: {
          referralContactId: existing.id,
          userId
        },
        data: {
          referralContactId: null
        }
      });

      await tx.referralContact.delete({
        where: {
          id: existing.id
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to delete referral" }, { status: 500 });
  }
}
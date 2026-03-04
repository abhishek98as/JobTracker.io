import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import { deleteResumeBlob } from "@/lib/blob-storage";

const patchSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  roleTag: z.string().max(120).optional().or(z.literal("")),
  isActive: z.boolean().optional()
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

    const existing = await prisma.resumeAsset.findFirst({
      where: {
        id: context.params.id,
        userId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const resume = await prisma.resumeAsset.update({
      where: {
        id: context.params.id
      },
      data: {
        label: parsed.label,
        roleTag: parsed.roleTag === "" ? null : parsed.roleTag,
        isActive: parsed.isActive
      }
    });

    return NextResponse.json({ resume });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to update resume" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();

    const existing = await prisma.resumeAsset.findFirst({
      where: {
        id: context.params.id,
        userId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.application.updateMany({
        where: {
          resumeAssetId: existing.id,
          userId
        },
        data: {
          resumeAssetId: null
        }
      });

      await tx.resumeAsset.delete({
        where: {
          id: existing.id
        }
      });
    });

    await deleteResumeBlob(existing.blobUrl).catch(() => null);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to delete resume" }, { status: 500 });
  }
}
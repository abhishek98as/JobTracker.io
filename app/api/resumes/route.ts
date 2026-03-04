import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import { uploadResumeBlob } from "@/lib/blob-storage";

const metadataSchema = z.object({
  label: z.string().min(1).max(120),
  roleTag: z.string().max(120).optional().or(z.literal(""))
});

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET() {
  try {
    const userId = await requireUserId();

    const resumes = await prisma.resumeAsset.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        applications: {
          select: {
            id: true,
            company: true,
            role: true,
            status: true
          },
          take: 5
        }
      }
    });

    return NextResponse.json({ resumes });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch resumes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const formData = await request.formData();

    const file = formData.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Upload a PDF file using field 'file'." }, { status: 400 });
    }

    const fileName = (formData.get("fileName") as string | null) || "resume.pdf";

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed." }, { status: 400 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Maximum allowed file size is 8MB." }, { status: 400 });
    }

    const payload = metadataSchema.parse({
      label: (formData.get("label") as string | null) || fileName,
      roleTag: (formData.get("roleTag") as string | null) || ""
    });

    const safeName = sanitizeFileName(fileName);
    const pathname = `resumes/${userId}/${Date.now()}-${safeName}`;
    const uploaded = await uploadResumeBlob({
      pathname,
      file
    });

    const resume = await prisma.resumeAsset.create({
      data: {
        userId,
        label: payload.label,
        roleTag: payload.roleTag || null,
        fileName: safeName,
        mimeType: file.type,
        fileSize: file.size,
        blobUrl: uploaded.url,
        blobPath: uploaded.pathname,
        isActive: true
      }
    });

    return NextResponse.json({ resume }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid resume metadata", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to upload resume", details: error instanceof Error ? error.message : null }, { status: 500 });
  }
}
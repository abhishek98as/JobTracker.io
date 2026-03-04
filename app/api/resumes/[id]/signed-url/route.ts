import { head } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";

type Context = {
  params: {
    id: string;
  };
};

export async function GET(_request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();

    const resume = await prisma.resumeAsset.findFirst({
      where: {
        id: context.params.id,
        userId
      }
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    let signedUrl = resume.blobUrl;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blobDetails = await head(resume.blobUrl, {
          token: process.env.BLOB_READ_WRITE_TOKEN
        });

        if ("downloadUrl" in blobDetails && typeof blobDetails.downloadUrl === "string") {
          signedUrl = blobDetails.downloadUrl;
        }
      } catch {
        signedUrl = resume.blobUrl;
      }
    }

    return NextResponse.json({
      signedUrl,
      expiresInSeconds: 3600
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch signed URL" }, { status: 500 });
  }
}

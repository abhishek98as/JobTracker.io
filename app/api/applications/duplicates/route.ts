import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import { detectDuplicateWarnings } from "@/lib/duplicate-detector";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const company = searchParams.get("company")?.trim() ?? "";
    const role = searchParams.get("role")?.trim() ?? "";

    if (!company || !role) {
      return NextResponse.json({ duplicateWarnings: [] });
    }

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
      company,
      role,
      existingApplications
    });

    return NextResponse.json({ duplicateWarnings });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to check duplicates" }, { status: 500 });
  }
}
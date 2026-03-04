import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";

const referralSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional()
});

export async function GET() {
  try {
    const userId = await requireUserId();
    const referrals = await prisma.referralContact.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        applications: {
          select: {
            id: true,
            company: true,
            role: true,
            status: true,
            createdAt: true
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 5
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    return NextResponse.json({ referrals });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const parsed = referralSchema.parse(await request.json());

    const referral = await prisma.referralContact.create({
      data: {
        userId,
        name: parsed.name,
        email: parsed.email || null,
        phone: parsed.phone || null,
        linkedinUrl: parsed.linkedinUrl || null,
        notes: parsed.notes || null
      }
    });

    return NextResponse.json({ referral }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}
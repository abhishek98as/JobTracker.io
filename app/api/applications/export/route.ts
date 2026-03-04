import { NextRequest, NextResponse } from "next/server";
import { buildApplicationWhere } from "@/lib/application-query";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server-auth";
import { computeApplicationStaleLevel } from "@/lib/stale-utils";

function parseBooleanQuery(value: string | null) {
  if (!value) {
    return false;
  }

  return value === "1" || value.toLowerCase() === "true";
}

function toCsvValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") ?? "json").toLowerCase();

    const status = searchParams.get("status") ?? undefined;
    const platform = searchParams.get("platform") ?? undefined;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const query = searchParams.get("query") ?? undefined;
    const resumeAssetId = searchParams.get("resumeAssetId") ?? undefined;
    const referralContactId = searchParams.get("referralContactId") ?? undefined;
    const staleOnly = parseBooleanQuery(searchParams.get("staleOnly"));
    const dueReminderOnly = parseBooleanQuery(searchParams.get("dueReminderOnly"));

    const where = buildApplicationWhere({
      userId,
      query,
      status,
      platform,
      from,
      to,
      resumeAssetId,
      referralContactId
    });

    const applications = await prisma.application.findMany({
      where,
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        resume: true,
        referral: true,
        research: true
      }
    });

    const now = new Date();

    let rows = applications.map((application) => {
      const stale = computeApplicationStaleLevel({
        appliedAt: application.appliedAt,
        createdAt: application.createdAt,
        status: application.status,
        now
      });

      return {
        id: application.id,
        company: application.company,
        role: application.role,
        platform: application.platform,
        status: application.status,
        appliedAt: application.appliedAt?.toISOString() ?? null,
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString(),
        daysSinceApplied: stale.daysSinceApplied,
        staleLevel: stale.staleLevel,
        isStale: stale.isStale,
        customReminderAt: application.customReminderAt?.toISOString() ?? null,
        isReminderDue: application.customReminderAt ? application.customReminderAt <= now : false,
        resumeLabel: application.resume?.label ?? null,
        referralName: application.referral?.name ?? null,
        notes: application.notes ?? null
      };
    });

    if (staleOnly) {
      rows = rows.filter((row) => row.isStale);
    }

    if (dueReminderOnly) {
      rows = rows.filter((row) => row.isReminderDue);
    }

    if (format === "csv") {
      const headers = [
        "id",
        "company",
        "role",
        "platform",
        "status",
        "appliedAt",
        "createdAt",
        "updatedAt",
        "daysSinceApplied",
        "staleLevel",
        "isStale",
        "customReminderAt",
        "isReminderDue",
        "resumeLabel",
        "referralName",
        "notes"
      ];

      const csv = [
        headers.join(","),
        ...rows.map((row) => headers.map((header) => toCsvValue((row as Record<string, unknown>)[header])).join(","))
      ].join("\n");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=applications-export.csv"
        }
      });
    }

    if (format === "json") {
      return new NextResponse(JSON.stringify(rows, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": "attachment; filename=applications-export.json"
        }
      });
    }

    return NextResponse.json({ error: "Unsupported export format. Use csv or json." }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to export applications" }, { status: 500 });
  }
}
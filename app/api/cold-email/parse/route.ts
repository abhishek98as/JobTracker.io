import { NextRequest, NextResponse } from "next/server";
import { parseExcelBuffer } from "@/lib/excel-parser";
import { requireUserId } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    await requireUserId();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Upload a valid Excel/CSV file in field 'file'." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const parsed = parseExcelBuffer(Buffer.from(bytes));

    return NextResponse.json({
      mapping: parsed.mapping,
      warnings: parsed.warnings,
      count: parsed.rows.length,
      rows: parsed.rows.slice(0, 200)
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to parse file", details: error instanceof Error ? error.message : null }, { status: 500 });
  }
}
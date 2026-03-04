import * as XLSX from "xlsx";
import { ParsedExcelRow } from "@/types";

const HEADER_MAP: Record<string, string[]> = {
  companyName: ["company name", "company", "comp", "organization"],
  hrEmail: ["hr email", "recruiter email", "email", "contact email"],
  hrName: ["hr name", "recruiter name", "contact person", "name"],
  jobTitle: ["job title", "role", "position", "designation"],
  jobUrl: ["career page", "job url", "apply link", "company website"]
};

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function detectColumn(headers: string[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeHeader);

  for (const header of headers) {
    const normalizedHeader = normalizeHeader(header);
    if (normalizedAliases.some((alias) => normalizedHeader.includes(alias) || alias.includes(normalizedHeader))) {
      return header;
    }
  }

  return null;
}

export function parseExcelBuffer(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("No worksheets found in the uploaded file.");
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: ""
  });

  if (!rows.length) {
    return {
      mapping: {},
      rows: [] as ParsedExcelRow[],
      warnings: ["No data rows detected in sheet."]
    };
  }

  const headers = Object.keys(rows[0]);

  const mapping: Record<string, string | null> = {
    companyName: detectColumn(headers, HEADER_MAP.companyName),
    jobTitle: detectColumn(headers, HEADER_MAP.jobTitle),
    jobUrl: detectColumn(headers, HEADER_MAP.jobUrl),
    hrEmail: detectColumn(headers, HEADER_MAP.hrEmail),
    hrName: detectColumn(headers, HEADER_MAP.hrName)
  };

  const warnings: string[] = [];

  if (!mapping.companyName || !mapping.jobTitle) {
    warnings.push("Could not confidently map required columns: company and job title.");
  }

  const parsedRows = rows
    .map((row) => ({
      companyName: String(row[mapping.companyName ?? ""] ?? "").trim(),
      jobTitle: String(row[mapping.jobTitle ?? ""] ?? "").trim(),
      jobUrl: String(row[mapping.jobUrl ?? ""] ?? "").trim() || undefined,
      hrEmail: String(row[mapping.hrEmail ?? ""] ?? "").trim() || undefined,
      hrName: String(row[mapping.hrName ?? ""] ?? "").trim() || undefined
    }))
    .filter((row) => row.companyName && row.jobTitle);

  return {
    mapping,
    rows: parsedRows,
    warnings
  };
}
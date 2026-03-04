"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  subjectTemplate: string;
  bodyTemplate: string;
  values: Record<string, string | undefined>;
};

function renderTemplate(template: string, values: Record<string, string | undefined>) {
  return template.replace(/\{\{\s*([^}|]+?)\s*(?:\|\s*"([^"]*)")?\s*\}\}/g, (_, key: string, fallback: string) => {
    const value = values[key.trim()];
    return value && value.trim() ? value : (fallback ?? "");
  });
}

export function TemplatePreview({ subjectTemplate, bodyTemplate, values }: Props) {
  const subject = useMemo(() => renderTemplate(subjectTemplate, values), [subjectTemplate, values]);
  const body = useMemo(() => renderTemplate(bodyTemplate, values), [bodyTemplate, values]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[12px] border-2 border-slate-900 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-600">Subject</p>
          <p className="mt-1 text-sm text-slate-900">{subject}</p>
        </div>
        <div className="rounded-[12px] border-2 border-slate-900 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-600">Body</p>
          <pre className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{body}</pre>
        </div>
      </CardContent>
    </Card>
  );
}
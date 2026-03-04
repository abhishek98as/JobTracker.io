"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Pause, Play, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TemplatePreview } from "@/components/email/template-preview";

type ParsedRow = {
  companyName: string;
  hrEmail?: string;
  hrName?: string;
  jobTitle: string;
  jobUrl?: string;
};

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

type Campaign = {
  id: string;
  status: string;
  totalRecipients: number;
  processed: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
};

export default function ColdEmailPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userName, setUserName] = useState("Your Name");
  const [userSkills, setUserSkills] = useState("React, TypeScript, Next.js");
  const [userPhone, setUserPhone] = useState("+91-");
  const [userLinkedIn, setUserLinkedIn] = useState("linkedin.com/in/");
  const [dryRun, setDryRun] = useState(true);

  useEffect(() => {
    void Promise.all([loadTemplates(), loadCampaigns()]);
  }, []);

  async function loadTemplates() {
    const response = await fetch("/api/cold-email/templates", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    const loadedTemplates = data.templates as Template[];
    setTemplates(loadedTemplates);
    setSelectedTemplateId((current) => current || loadedTemplates[0]?.id || "");
  }

  async function loadCampaigns() {
    const response = await fetch("/api/cold-email/send", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setCampaigns(data.campaigns ?? []);
  }

  async function parseFile() {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    try {
      setParsing(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/cold-email/parse", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to parse file");
      }

      setRows(data.rows ?? []);
      setWarnings(data.warnings ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setParsing(false);
    }
  }

  async function sendCampaign() {
    if (!selectedTemplateId) {
      setError("Select a template before sending.");
      return;
    }

    const recipients = rows.filter((row) => row.hrEmail && row.jobTitle && row.companyName);
    if (!recipients.length) {
      setError("No valid rows with company, job title, and recipient email.");
      return;
    }

    try {
      setSending(true);
      setError(null);
      const response = await fetch("/api/cold-email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          senderProfile: {
            userName,
            userSkills,
            userPhone,
            userLinkedIn
          },
          recipients,
          dryRun,
          skipDelay: dryRun
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to start campaign");
      }

      await loadCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send campaign");
    } finally {
      setSending(false);
    }
  }

  async function setCampaignState(campaignId: string, action: "pause" | "resume") {
    const response = await fetch("/api/cold-email/send", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ campaignId, action })
    });

    if (!response.ok) {
      return;
    }

    await loadCampaigns();
  }

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  );

  const previewValues = rows[0]
    ? {
        ...rows[0],
        userName,
        userSkills,
        userPhone,
        userLinkedIn
      }
    : {
        companyName: "Acme",
        hrName: "Hiring Manager",
        jobTitle: "Software Engineer",
        userName,
        userSkills,
        userPhone,
        userLinkedIn
      };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <h1 className="font-heading text-4xl font-bold text-slate-900">Cold Email Automation</h1>
          <p className="page-subtle">
            Upload lead data, personalize templates, and send Gmail-safe campaigns with queue tracking.
          </p>
        </div>
        <Link
          href="/cold-email/templates"
          className="inline-flex h-10 items-center justify-center rounded-[12px] border-2 border-slate-900 bg-white px-4 text-sm font-semibold text-slate-900 shadow-[4px_4px_0_rgb(15_23_42)]"
        >
          Manage Templates
        </Link>
      </div>

      {error ? <p className="rounded-xl border-2 border-red-600 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {warnings.length ? (
        <div className="rounded-xl border-2 border-amber-700 bg-amber-100 p-3 text-sm text-amber-900">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1) Upload & Parse Excel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <Button onClick={parseFile} disabled={parsing}>
              {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {parsing ? "Parsing..." : "Parse File"}
            </Button>
            <p className="text-xs text-slate-600">Supports header auto-detection for common column name variants.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2) Sender Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="sender-name">Name</Label>
              <Input id="sender-name" value={userName} onChange={(event) => setUserName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sender-phone">Phone</Label>
              <Input id="sender-phone" value={userPhone} onChange={(event) => setUserPhone(event.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="sender-skills">Skills summary</Label>
              <Input id="sender-skills" value={userSkills} onChange={(event) => setUserSkills(event.target.value)} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="sender-linkedin">LinkedIn</Label>
              <Input
                id="sender-linkedin"
                value={userLinkedIn}
                onChange={(event) => setUserLinkedIn(event.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
              <input type="checkbox" checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} />
              Dry run (validate and log without sending SMTP emails)
            </label>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>3) Pick Template & Send</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select id="template" value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </Select>
            <p className="text-xs text-slate-600">Rows detected: {rows.length}</p>
            <Button onClick={sendCampaign} disabled={sending || !rows.length || !selectedTemplateId}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {sending ? "Processing..." : "Start Campaign"}
            </Button>
          </div>

          {selectedTemplate ? (
            <div className="lg:col-span-2">
              <TemplatePreview
                subjectTemplate={selectedTemplate.subject}
                bodyTemplate={selectedTemplate.body}
                values={previewValues}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>HR Name</TableHead>
                <TableHead>HR Email</TableHead>
                <TableHead>Job URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 20).map((row, index) => (
                <TableRow key={`${row.companyName}-${row.hrEmail}-${index}`}>
                  <TableCell>{row.companyName}</TableCell>
                  <TableCell>{row.jobTitle}</TableCell>
                  <TableCell>{row.hrName ?? "-"}</TableCell>
                  <TableCell>{row.hrEmail ?? "-"}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{row.jobUrl ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {campaigns.map((campaign) => {
            const percentage = campaign.totalRecipients
              ? Math.round((campaign.processed / campaign.totalRecipients) * 100)
              : 0;

            return (
              <div key={campaign.id} className="rounded-xl border-2 border-slate-900 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Campaign {campaign.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-600">
                      {campaign.status.toUpperCase()} | {campaign.successCount} success | {campaign.failureCount} failed
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === "sending" ? (
                      <Button variant="outline" size="sm" onClick={() => void setCampaignState(campaign.id, "pause")}>
                        <Pause className="h-4 w-4" /> Pause
                      </Button>
                    ) : null}
                    {campaign.status === "paused" ? (
                      <Button variant="outline" size="sm" onClick={() => void setCampaignState(campaign.id, "resume")}>
                        <Play className="h-4 w-4" /> Resume
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-slate-900 bg-white">
                  <div className="h-full bg-blue-600" style={{ width: `${percentage}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {campaign.processed}/{campaign.totalRecipients} processed ({percentage}%)
                </p>
              </div>
            );
          })}
          {!campaigns.length ? <p className="page-subtle">No campaigns run yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
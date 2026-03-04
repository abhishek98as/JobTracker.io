"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { CalendarDays, Download, GripVertical, Plus, TriangleAlert } from "lucide-react";
import {
  PIPELINE_LABELS,
  PIPELINE_STATUSES,
  PLATFORM_LABELS,
  PLATFORM_OPTIONS,
  STATUS_ACCENT_CLASSES
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type Application = {
  id: string;
  company: string;
  role: string;
  platform: string;
  status: (typeof PIPELINE_STATUSES)[number];
  appliedAt: string | null;
  updatedAt: string;
  notes: string | null;
  staleLevel: "green" | "yellow" | "red";
  daysSinceApplied: number;
  isStale: boolean;
  isReminderDue: boolean;
  resume: { id: string; label: string } | null;
  referral: { id: string; name: string } | null;
};

type ResumeOption = {
  id: string;
  label: string;
};

type ReferralOption = {
  id: string;
  name: string;
};

type DuplicateWarning = {
  applicationId: string;
  company: string;
  role: string;
  similarity: number;
  status: string;
  message: string;
};

type FormState = {
  company: string;
  role: string;
  platform: string;
  status: (typeof PIPELINE_STATUSES)[number];
  jobUrl: string;
  contactName: string;
  contactEmail: string;
  notes: string;
  salary: string;
  resumeAssetId: string;
  referralContactId: string;
  customReminderAt: string;
  customReminderNote: string;
};

type FilterState = {
  query: string;
  platform: string;
  status: string;
  staleOnly: boolean;
  dueReminderOnly: boolean;
  resumeAssetId: string;
  referralContactId: string;
};

const defaultFormState: FormState = {
  company: "",
  role: "",
  platform: "linkedin",
  status: "wishlist",
  jobUrl: "",
  contactName: "",
  contactEmail: "",
  notes: "",
  salary: "",
  resumeAssetId: "",
  referralContactId: "",
  customReminderAt: "",
  customReminderNote: ""
};

const defaultFilters: FilterState = {
  query: "",
  platform: "",
  status: "",
  staleOnly: false,
  dueReminderOnly: false,
  resumeAssetId: "",
  referralContactId: ""
};

function buildFilterQuery(filters: FilterState) {
  const query = new URLSearchParams();

  if (filters.query) query.set("query", filters.query);
  if (filters.platform) query.set("platform", filters.platform);
  if (filters.status) query.set("status", filters.status);
  if (filters.resumeAssetId) query.set("resumeAssetId", filters.resumeAssetId);
  if (filters.referralContactId) query.set("referralContactId", filters.referralContactId);
  if (filters.staleOnly) query.set("staleOnly", "true");
  if (filters.dueReminderOnly) query.set("dueReminderOnly", "true");

  return query.toString();
}

export function KanbanBoard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [creating, setCreating] = useState(false);
  const [duplicateWarnings, setDuplicateWarnings] = useState<DuplicateWarning[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [referrals, setReferrals] = useState<ReferralOption[]>([]);
  const [exportFormat, setExportFormat] = useState<"csv" | "json" | "pdf">("csv");
  const exportRef = useRef<HTMLDivElement | null>(null);

  const loadLookupData = useCallback(async () => {
    const [resumesRes, referralsRes] = await Promise.all([
      fetch("/api/resumes", { cache: "no-store" }),
      fetch("/api/referrals", { cache: "no-store" })
    ]);

    if (resumesRes.ok) {
      const data = await resumesRes.json();
      setResumes((data.resumes ?? []).map((item: ResumeOption) => ({ id: item.id, label: item.label })));
    }

    if (referralsRes.ok) {
      const data = await referralsRes.json();
      setReferrals((data.referrals ?? []).map((item: ReferralOption) => ({ id: item.id, name: item.name })));
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const query = buildFilterQuery(filters);
      const response = await fetch(`/api/applications${query ? `?${query}` : ""}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load applications");
      }
      const data = await response.json();
      setApplications(data.applications ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const checkDuplicates = useCallback(async () => {
    try {
      setCheckingDuplicates(true);
      const search = new URLSearchParams({
        company: formState.company,
        role: formState.role
      });
      const response = await fetch(`/api/applications/duplicates?${search.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        setDuplicateWarnings([]);
        return;
      }

      const data = await response.json();
      setDuplicateWarnings(data.duplicateWarnings ?? []);
    } finally {
      setCheckingDuplicates(false);
    }
  }, [formState.company, formState.role]);

  useEffect(() => {
    void loadLookupData();
  }, [loadLookupData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    if (!formState.company.trim() || !formState.role.trim()) {
      setDuplicateWarnings([]);
      return;
    }

    const timer = setTimeout(() => {
      void checkDuplicates();
    }, 350);

    return () => clearTimeout(timer);
  }, [formState.company, formState.role, checkDuplicates]);

  async function createApplication() {
    if (!formState.company || !formState.role) {
      setError("Company and role are required.");
      return;
    }

    try {
      setCreating(true);
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formState,
          customReminderAt: formState.customReminderAt ? new Date(formState.customReminderAt).toISOString() : ""
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create application");
      }

      setFormState(defaultFormState);
      setDuplicateWarnings([]);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(id: string, toStatus: (typeof PIPELINE_STATUSES)[number]) {
    const current = applications.find((item) => item.id === id);
    if (!current || current.status === toStatus) {
      return;
    }

    setApplications((prev) => prev.map((item) => (item.id === id ? { ...item, status: toStatus } : item)));

    const response = await fetch(`/api/applications/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ toStatus })
    });

    if (!response.ok) {
      setApplications((prev) => prev.map((item) => (item.id === id ? { ...item, status: current.status } : item)));
      const details = await response.json().catch(() => null);
      setError(details?.error ?? "Failed to update status");
      return;
    }

    await loadData();
  }

  async function deleteApplication(id: string) {
    const response = await fetch(`/api/applications/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const details = await response.json().catch(() => null);
      setError(details?.error ?? "Failed to delete application");
      return;
    }

    setApplications((prev) => prev.filter((item) => item.id !== id));
  }

  async function exportApplications() {
    if (exportFormat === "pdf") {
      await exportAsPdf();
      return;
    }

    const query = new URLSearchParams(buildFilterQuery(filters));
    query.set("format", exportFormat);

    const response = await fetch(`/api/applications/export?${query.toString()}`, { cache: "no-store" });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Failed to export data");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `applications-export.${exportFormat}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function exportAsPdf() {
    if (!exportRef.current) {
      return;
    }

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
    const canvas = await html2canvas(exportRef.current, { scale: 2, backgroundColor: "#FAF9F6" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const width = 190;
    const height = (canvas.height * width) / canvas.width;

    pdf.setFontSize(14);
    pdf.text("JobTrackr Filtered Export Report", 10, 12);
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, 18);
    pdf.addImage(imgData, "PNG", 10, 24, width, Math.min(height, 145));

    const startY = 176;
    pdf.setFontSize(11);
    pdf.text("Application Snapshot", 10, startY);

    const previewRows = applications.slice(0, 18);
    let y = startY + 6;
    previewRows.forEach((application, index) => {
      if (y > 286) return;
      const line = `${index + 1}. ${application.company} | ${application.role} | ${application.status} | ${application.platform}`;
      pdf.text(line.slice(0, 110), 10, y);
      y += 5;
    });

    pdf.save("applications-export.pdf");
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) {
      return;
    }

    const appId = result.draggableId;
    const destinationStatus = result.destination.droppableId as (typeof PIPELINE_STATUSES)[number];
    void updateStatus(appId, destinationStatus);
  }

  const grouped = useMemo(() => {
    return PIPELINE_STATUSES.reduce(
      (acc, status) => {
        acc[status] = applications.filter((application) => application.status === status);
        return acc;
      },
      {} as Record<(typeof PIPELINE_STATUSES)[number], Application[]>
    );
  }, [applications]);

  const staleCount = applications.filter((application) => application.isStale).length;
  const reminderDueCount = applications.filter((application) => application.isReminderDue).length;

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Application</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formState.company}
              onChange={(event) => setFormState((prev) => ({ ...prev, company: event.target.value }))}
              placeholder="Google"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={formState.role}
              onChange={(event) => setFormState((prev) => ({ ...prev, role: event.target.value }))}
              placeholder="Software Engineer"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select
              id="platform"
              value={formState.platform}
              onChange={(event) => setFormState((prev) => ({ ...prev, platform: event.target.value }))}
            >
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {PLATFORM_LABELS[option]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={formState.status}
              onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value as FormState["status"] }))}
            >
              {PIPELINE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PIPELINE_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="jobUrl">Job URL</Label>
            <Input
              id="jobUrl"
              value={formState.jobUrl}
              onChange={(event) => setFormState((prev) => ({ ...prev, jobUrl: event.target.value }))}
              placeholder="https://"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resume">Resume</Label>
            <Select
              id="resume"
              value={formState.resumeAssetId}
              onChange={(event) => setFormState((prev) => ({ ...prev, resumeAssetId: event.target.value }))}
            >
              <option value="">No resume link</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="referral">Referral</Label>
            <Select
              id="referral"
              value={formState.referralContactId}
              onChange={(event) => setFormState((prev) => ({ ...prev, referralContactId: event.target.value }))}
            >
              <option value="">No referral link</option>
              {referrals.map((referral) => (
                <option key={referral.id} value={referral.id}>
                  {referral.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input
              id="contactName"
              value={formState.contactName}
              onChange={(event) => setFormState((prev) => ({ ...prev, contactName: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              value={formState.contactEmail}
              onChange={(event) => setFormState((prev) => ({ ...prev, contactEmail: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customReminderAt">Reminder Date</Label>
            <Input
              id="customReminderAt"
              type="datetime-local"
              value={formState.customReminderAt}
              onChange={(event) => setFormState((prev) => ({ ...prev, customReminderAt: event.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formState.notes}
              onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Referral notes, follow-up plan, salary expectations..."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="customReminderNote">Reminder Note</Label>
            <Textarea
              id="customReminderNote"
              value={formState.customReminderNote}
              onChange={(event) => setFormState((prev) => ({ ...prev, customReminderNote: event.target.value }))}
            />
          </div>
          <div className="md:col-span-4">
            <Button className="w-full md:w-auto" onClick={createApplication} disabled={creating}>
              <Plus className="h-4 w-4" />
              {creating ? "Creating..." : "Add Application"}
            </Button>
          </div>

          {(checkingDuplicates || duplicateWarnings.length > 0) && (
            <div className="md:col-span-4 rounded-xl border-2 border-amber-700 bg-amber-100 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <TriangleAlert className="h-4 w-4" />
                Duplicate Check
              </p>
              {checkingDuplicates ? <p className="mt-1 text-xs text-amber-800">Checking existing applications...</p> : null}
              {duplicateWarnings.map((warning) => (
                <p key={warning.applicationId} className="mt-1 text-sm text-amber-900">
                  {warning.message}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters & Export</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-6" ref={exportRef}>
          <div className="space-y-2 md:col-span-2">
            <Label>Search</Label>
            <Input
              value={filters.query}
              onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
              placeholder="Company, role, notes"
            />
          </div>
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={filters.platform} onChange={(event) => setFilters((prev) => ({ ...prev, platform: event.target.value }))}>
              <option value="">All</option>
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {PLATFORM_LABELS[option]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
              <option value="">All</option>
              {PIPELINE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PIPELINE_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Resume</Label>
            <Select
              value={filters.resumeAssetId}
              onChange={(event) => setFilters((prev) => ({ ...prev, resumeAssetId: event.target.value }))}
            >
              <option value="">All</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Referral</Label>
            <Select
              value={filters.referralContactId}
              onChange={(event) => setFilters((prev) => ({ ...prev, referralContactId: event.target.value }))}
            >
              <option value="">All</option>
              {referrals.map((referral) => (
                <option key={referral.id} value={referral.id}>
                  {referral.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-3 flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={filters.staleOnly}
                onChange={(event) => setFilters((prev) => ({ ...prev, staleOnly: event.target.checked }))}
              />
              Stale only
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={filters.dueReminderOnly}
                onChange={(event) => setFilters((prev) => ({ ...prev, dueReminderOnly: event.target.checked }))}
              />
              Reminder due only
            </label>
            <Badge variant="outline">Stale: {staleCount}</Badge>
            <Badge variant="outline">Reminder due: {reminderDueCount}</Badge>
          </div>

          <div className="md:col-span-3 flex flex-wrap items-center justify-end gap-2">
            <Select value={exportFormat} onChange={(event) => setExportFormat(event.target.value as "csv" | "json" | "pdf")} className="w-32">
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="pdf">PDF</option>
            </Select>
            <Button variant="secondary" onClick={exportApplications}>
              <Download className="h-4 w-4" /> Export Active View
            </Button>
            <Button variant="outline" onClick={() => setFilters(defaultFilters)}>
              Reset Filters
            </Button>
          </div>

          <div className="md:col-span-6 grid gap-2 rounded-xl border-2 border-slate-900 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Export Snapshot (Chart Basis)</p>
            {PIPELINE_STATUSES.map((status) => {
              const count = grouped[status]?.length ?? 0;
              const pct = applications.length ? Math.round((count / applications.length) * 100) : 0;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{PIPELINE_LABELS[status]}</span>
                    <span className="metric-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full border border-slate-900 bg-white">
                    <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {error ? <p className="rounded-xl border-2 border-red-700 bg-red-100 p-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="page-subtle">Loading applications...</p> : null}

      {!loading ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid gap-4 xl:grid-cols-7">
            {PIPELINE_STATUSES.map((status) => (
              <Droppable droppableId={status} key={status}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex min-h-[340px] flex-col gap-3 rounded-[14px] border-2 border-slate-900 bg-white p-3 shadow-[3px_3px_0_rgb(15_23_42)]"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">{PIPELINE_LABELS[status]}</h3>
                      <Badge variant="outline">{grouped[status]?.length ?? 0}</Badge>
                    </div>
                    {(grouped[status] ?? []).map((application, index) => (
                      <Draggable draggableId={application.id} index={index} key={application.id}>
                        {(draggableProvided) => (
                          <Card
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            className={`border-l-[8px] ${application.staleLevel === "green" ? "border-l-emerald-500" : application.staleLevel === "yellow" ? "border-l-amber-500" : "border-l-red-500"}`}
                          >
                            <CardContent className="space-y-2 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <Link href={`/tracker/${application.id}`} className="text-sm font-bold text-blue-700 underline-offset-4 hover:underline">
                                    {application.company}
                                  </Link>
                                  <p className="text-xs text-slate-700">{application.role}</p>
                                </div>
                                <button
                                  type="button"
                                  {...draggableProvided.dragHandleProps}
                                  className="rounded p-1 text-slate-500 hover:bg-slate-100"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between text-xs text-slate-600">
                                <span className={`status-chip ${STATUS_ACCENT_CLASSES[application.status]}`}>{application.status}</span>
                                <span className="inline-flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  {application.daysSinceApplied}d
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600">{PLATFORM_LABELS[application.platform as keyof typeof PLATFORM_LABELS] ?? application.platform}</p>
                              {application.resume ? <p className="text-[11px] text-slate-700">Resume: {application.resume.label}</p> : null}
                              {application.referral ? <p className="text-[11px] text-slate-700">Referral: {application.referral.name}</p> : null}
                              {application.isReminderDue ? <Badge variant="destructive">Reminder Due</Badge> : null}
                              {application.notes ? <p className="line-clamp-3 text-xs text-slate-700">{application.notes}</p> : null}
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => void deleteApplication(application.id)}
                              >
                                Delete
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      ) : null}
    </section>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PIPELINE_LABELS, PIPELINE_STATUSES, PLATFORM_LABELS, PLATFORM_OPTIONS, ROUND_TYPES } from "@/lib/constants";

type ResumeOption = {
  id: string;
  label: string;
  roleTag: string | null;
};

type ReferralOption = {
  id: string;
  name: string;
};

type InterviewRound = {
  id: string;
  roundType: string;
  interviewerName: string | null;
  scheduledAt: string | null;
  questionsAsked: string | null;
  answersGiven: string | null;
  outcome: string | null;
  notes: string | null;
};

type ApplicationDetail = {
  id: string;
  company: string;
  role: string;
  platform: string;
  status: string;
  notes: string | null;
  salary: string | null;
  contactName: string | null;
  contactEmail: string | null;
  customReminderAt: string | null;
  customReminderNote: string | null;
  resumeAssetId: string | null;
  referralContactId: string | null;
  staleLevel: string;
  daysSinceApplied: number;
  isStale: boolean;
  interviews: InterviewRound[];
  research: {
    companySize: string | null;
    industry: string | null;
    techStack: string | null;
    glassdoorRating: string | null;
    cultureNotes: string | null;
    interviewInsights: string | null;
  } | null;
};

type QuestionBankItem = {
  question: string;
  count: number;
  companies: string[];
};

export default function ApplicationWorkspacePage() {
  const params = useParams<{ id: string }>();
  const applicationId = params.id;

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [referrals, setReferrals] = useState<ReferralOption[]>([]);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "interview" | "research" | "reminder">("overview");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [overview, setOverview] = useState({
    company: "",
    role: "",
    platform: "linkedin",
    status: "wishlist",
    notes: "",
    salary: "",
    contactName: "",
    contactEmail: "",
    resumeAssetId: "",
    referralContactId: ""
  });

  const [interviewDraft, setInterviewDraft] = useState({
    roundType: "technical",
    interviewerName: "",
    scheduledAt: "",
    questionsAsked: "",
    answersGiven: "",
    outcome: "",
    notes: ""
  });

  const [researchDraft, setResearchDraft] = useState({
    companySize: "",
    industry: "",
    techStack: "",
    glassdoorRating: "",
    cultureNotes: "",
    interviewInsights: ""
  });

  const [reminderDraft, setReminderDraft] = useState({
    customReminderAt: "",
    customReminderNote: ""
  });

  const loadApplication = useCallback(async () => {
    const response = await fetch(`/api/applications/${applicationId}`, { cache: "no-store" });
    if (!response.ok) {
      setError("Failed to load application details");
      return;
    }

    const data = await response.json();
    setApplication(data.application);
  }, [applicationId]);

  useEffect(() => {
    if (!applicationId) {
      return;
    }

    void Promise.all([loadApplication(), loadResumes(), loadReferrals(), loadQuestionBank()]);
  }, [applicationId, loadApplication]);

  useEffect(() => {
    if (!application) {
      return;
    }

    setOverview({
      company: application.company,
      role: application.role,
      platform: application.platform,
      status: application.status,
      notes: application.notes ?? "",
      salary: application.salary ?? "",
      contactName: application.contactName ?? "",
      contactEmail: application.contactEmail ?? "",
      resumeAssetId: application.resumeAssetId ?? "",
      referralContactId: application.referralContactId ?? ""
    });

    setResearchDraft({
      companySize: application.research?.companySize ?? "",
      industry: application.research?.industry ?? "",
      techStack: application.research?.techStack ?? "",
      glassdoorRating: application.research?.glassdoorRating ?? "",
      cultureNotes: application.research?.cultureNotes ?? "",
      interviewInsights: application.research?.interviewInsights ?? ""
    });

    setReminderDraft({
      customReminderAt: application.customReminderAt ? application.customReminderAt.slice(0, 16) : "",
      customReminderNote: application.customReminderNote ?? ""
    });
  }, [application]);

  async function loadResumes() {
    const response = await fetch("/api/resumes", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    setResumes((data.resumes ?? []).map((resume: ResumeOption) => ({ id: resume.id, label: resume.label, roleTag: resume.roleTag })));
  }

  async function loadReferrals() {
    const response = await fetch("/api/referrals", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    setReferrals((data.referrals ?? []).map((referral: ReferralOption) => ({ id: referral.id, name: referral.name })));
  }

  async function loadQuestionBank() {
    const response = await fetch("/api/interviews/question-bank", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    setQuestionBank((data.questionBank ?? []).slice(0, 15));
  }

  async function saveOverview() {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(overview)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save overview");
      }

      setApplication(data.application);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save overview");
    } finally {
      setSaving(false);
    }
  }

  async function addInterviewRound() {
    try {
      setSaving(true);
      setError(null);
      const response = await fetch(`/api/applications/${applicationId}/interviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...interviewDraft,
          scheduledAt: interviewDraft.scheduledAt ? new Date(interviewDraft.scheduledAt).toISOString() : ""
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to add interview round");
      }

      setInterviewDraft({
        roundType: "technical",
        interviewerName: "",
        scheduledAt: "",
        questionsAsked: "",
        answersGiven: "",
        outcome: "",
        notes: ""
      });

      await Promise.all([loadApplication(), loadQuestionBank()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add interview round");
    } finally {
      setSaving(false);
    }
  }

  async function saveResearch() {
    try {
      setSaving(true);
      setError(null);
      const response = await fetch(`/api/applications/${applicationId}/research`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(researchDraft)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save research");
      }

      setApplication((prev) => (prev ? { ...prev, research: data.research } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save research");
    } finally {
      setSaving(false);
    }
  }

  async function saveReminder() {
    try {
      setSaving(true);
      setError(null);
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customReminderAt: reminderDraft.customReminderAt ? new Date(reminderDraft.customReminderAt).toISOString() : "",
          customReminderNote: reminderDraft.customReminderNote
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save reminder");
      }

      setApplication(data.application);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save reminder");
    } finally {
      setSaving(false);
    }
  }

  const staleBadgeClass = useMemo(() => {
    if (!application) {
      return "bg-slate-200 text-slate-900";
    }

    if (application.staleLevel === "green") {
      return "bg-emerald-300 text-slate-900";
    }

    if (application.staleLevel === "yellow") {
      return "bg-amber-300 text-slate-900";
    }

    return "bg-red-300 text-slate-900";
  }, [application]);

  if (!application) {
    return <p className="page-subtle">Loading workspace...</p>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">
            {application.company} - {application.role}
          </h1>
          <p className="page-subtle">Application workspace: overview, interview prep, research, and reminders.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`status-chip ${staleBadgeClass}`}>{application.staleLevel}</span>
          <span className="rounded-lg border-2 border-slate-900 bg-white px-3 py-1 text-xs font-semibold">
            {application.daysSinceApplied} days since applied
          </span>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
        </div>
      </div>

      {error ? <p className="rounded-xl border-2 border-red-600 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {[
          { key: "overview", label: "Overview" },
          { key: "interview", label: "Interview Prep" },
          { key: "research", label: "Research Notes" },
          { key: "reminder", label: "Reminder" }
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={overview.company} onChange={(event) => setOverview((prev) => ({ ...prev, company: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={overview.role} onChange={(event) => setOverview((prev) => ({ ...prev, role: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={overview.platform} onChange={(event) => setOverview((prev) => ({ ...prev, platform: event.target.value }))}>
                {PLATFORM_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {PLATFORM_LABELS[option]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={overview.status} onChange={(event) => setOverview((prev) => ({ ...prev, status: event.target.value }))}>
                {PIPELINE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {PIPELINE_LABELS[status]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input
                value={overview.contactName}
                onChange={(event) => setOverview((prev) => ({ ...prev, contactName: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input
                value={overview.contactEmail}
                onChange={(event) => setOverview((prev) => ({ ...prev, contactEmail: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Linked Resume</Label>
              <Select
                value={overview.resumeAssetId}
                onChange={(event) => setOverview((prev) => ({ ...prev, resumeAssetId: event.target.value }))}
              >
                <option value="">No resume linked</option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Referral Contact</Label>
              <Select
                value={overview.referralContactId}
                onChange={(event) => setOverview((prev) => ({ ...prev, referralContactId: event.target.value }))}
              >
                <option value="">No referral linked</option>
                {referrals.map((referral) => (
                  <option key={referral.id} value={referral.id}>
                    {referral.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={overview.notes} onChange={(event) => setOverview((prev) => ({ ...prev, notes: event.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Button onClick={saveOverview} disabled={saving}>
                {saving ? "Saving..." : "Save Overview"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "interview" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add Interview Round</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Round Type</Label>
                <Select
                  value={interviewDraft.roundType}
                  onChange={(event) => setInterviewDraft((prev) => ({ ...prev, roundType: event.target.value }))}
                >
                  {ROUND_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Interviewer Name</Label>
                <Input
                  value={interviewDraft.interviewerName}
                  onChange={(event) => setInterviewDraft((prev) => ({ ...prev, interviewerName: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Scheduled At</Label>
                <Input
                  type="datetime-local"
                  value={interviewDraft.scheduledAt}
                  onChange={(event) => setInterviewDraft((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Questions Asked</Label>
                <Textarea
                  value={interviewDraft.questionsAsked}
                  onChange={(event) => setInterviewDraft((prev) => ({ ...prev, questionsAsked: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Your Answers</Label>
                <Textarea
                  value={interviewDraft.answersGiven}
                  onChange={(event) => setInterviewDraft((prev) => ({ ...prev, answersGiven: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Outcome</Label>
                <Input
                  value={interviewDraft.outcome}
                  onChange={(event) => setInterviewDraft((prev) => ({ ...prev, outcome: event.target.value }))}
                  placeholder="pass / pending / reject"
                />
              </div>
              <Button onClick={addInterviewRound} disabled={saving}>
                {saving ? "Saving..." : "Add Round"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recorded Rounds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.interviews.map((round) => (
                <div key={round.id} className="rounded-xl border-2 border-slate-900 bg-slate-50 p-3 text-sm">
                  <p className="font-semibold">{round.roundType}</p>
                  <p>{round.interviewerName ?? "No interviewer name"}</p>
                  {round.questionsAsked ? <p className="mt-1 text-xs">Q: {round.questionsAsked}</p> : null}
                </div>
              ))}
              {!application.interviews.length ? <p className="page-subtle">No rounds yet.</p> : null}
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Personal Question Bank</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {questionBank.map((item) => (
                <div key={item.question} className="rounded-xl border-2 border-slate-900 bg-white p-3 text-sm">
                  <p className="font-semibold">{item.question}</p>
                  <p className="text-xs text-slate-600">Asked {item.count} times | Companies: {item.companies.join(", ")}</p>
                </div>
              ))}
              {!questionBank.length ? <p className="page-subtle">Question bank will appear as you add interview notes.</p> : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "research" ? (
        <Card>
          <CardHeader>
            <CardTitle>Company Research Notes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Company Size</Label>
              <Input value={researchDraft.companySize} onChange={(event) => setResearchDraft((prev) => ({ ...prev, companySize: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input value={researchDraft.industry} onChange={(event) => setResearchDraft((prev) => ({ ...prev, industry: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Tech Stack</Label>
              <Input value={researchDraft.techStack} onChange={(event) => setResearchDraft((prev) => ({ ...prev, techStack: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Glassdoor Rating</Label>
              <Input
                value={researchDraft.glassdoorRating}
                onChange={(event) => setResearchDraft((prev) => ({ ...prev, glassdoorRating: event.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Culture Notes</Label>
              <Textarea
                value={researchDraft.cultureNotes}
                onChange={(event) => setResearchDraft((prev) => ({ ...prev, cultureNotes: event.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Interview Process Insights</Label>
              <Textarea
                value={researchDraft.interviewInsights}
                onChange={(event) => setResearchDraft((prev) => ({ ...prev, interviewInsights: event.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={saveResearch} disabled={saving}>
                {saving ? "Saving..." : "Save Research"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "reminder" ? (
        <Card>
          <CardHeader>
            <CardTitle>Follow-Up Reminder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="rounded-xl border-2 border-slate-900 bg-slate-50 p-3 text-sm">
              Current stale state: <span className="font-semibold">{application.staleLevel}</span> | Days since applied: {application.daysSinceApplied}
            </p>
            <div className="space-y-2">
              <Label>Custom Reminder Date</Label>
              <Input
                type="datetime-local"
                value={reminderDraft.customReminderAt}
                onChange={(event) => setReminderDraft((prev) => ({ ...prev, customReminderAt: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Reminder Note</Label>
              <Textarea
                value={reminderDraft.customReminderNote}
                onChange={(event) => setReminderDraft((prev) => ({ ...prev, customReminderNote: event.target.value }))}
              />
            </div>
            <Button onClick={saveReminder} disabled={saving}>
              {saving ? "Saving..." : "Save Reminder"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <p className="text-xs text-slate-600">
        Need full pipeline board? Go back to <Link href="/tracker" className="text-blue-700 underline-offset-4 hover:underline">tracker</Link>.
      </p>
    </section>
  );
}

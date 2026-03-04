"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TemplatePreview } from "@/components/email/template-preview";

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

const SAMPLE_VALUES = {
  companyName: "Acme Corp",
  hrName: "Hiring Manager",
  jobTitle: "Software Engineer",
  userName: "Asha Sharma",
  userSkills: "React, Node.js, SQL",
  userPhone: "+91-9999999999",
  userLinkedIn: "linkedin.com/in/asha"
};

export default function TemplateManagerPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadTemplates();
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  );

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    setName(selectedTemplate.name);
    setSubject(selectedTemplate.subject);
    setBody(selectedTemplate.body);
  }, [selectedTemplate]);

  async function loadTemplates() {
    const response = await fetch("/api/cold-email/templates", { cache: "no-store" });
    if (!response.ok) {
      setError("Failed to load templates");
      return;
    }

    const data = await response.json();
    const loadedTemplates = data.templates as Template[];
    setTemplates(loadedTemplates);
    if (loadedTemplates.length) {
      setSelectedTemplateId(loadedTemplates[0].id);
    }
  }

  async function createTemplate() {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      setError("Name, subject, and body are required.");
      return;
    }

    const response = await fetch("/api/cold-email/templates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, subject, body })
    });

    if (!response.ok) {
      setError("Failed to create template.");
      return;
    }

    setError(null);
    await loadTemplates();
  }

  async function updateTemplate() {
    if (!selectedTemplateId) {
      return;
    }

    const response = await fetch(`/api/cold-email/templates/${selectedTemplateId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, subject, body })
    });

    if (!response.ok) {
      setError("Failed to update template.");
      return;
    }

    setError(null);
    await loadTemplates();
  }

  async function deleteTemplate() {
    if (!selectedTemplateId) {
      return;
    }

    const response = await fetch(`/api/cold-email/templates/${selectedTemplateId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      setError("Failed to delete template.");
      return;
    }

    setError(null);
    await loadTemplates();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-bold text-slate-900">Email Template Manager</h1>
        <p className="page-subtle">Create and maintain reusable outreach templates with placeholders and live preview.</p>
      </div>

      {error ? <p className="rounded-xl border-2 border-red-600 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Saved Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplateId(template.id)}
                className={`w-full rounded-xl border-2 px-3 py-2 text-left text-sm font-semibold transition ${
                  selectedTemplateId === template.id
                    ? "border-slate-900 bg-blue-200 text-slate-900"
                    : "border-slate-900 bg-white text-slate-700"
                }`}
              >
                {template.name}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Template Editor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="tpl-name">Template Name</Label>
              <Input id="tpl-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tpl-subject">Subject</Label>
              <Input id="tpl-subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tpl-body">Body</Label>
              <Textarea
                id="tpl-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="min-h-[220px]"
              />
            </div>
            <p className="text-xs text-slate-600">
              Variables: <code>{"{{companyName}}"}</code>, <code>{"{{hrName | \"Hiring Manager\"}}"}</code>,{" "}
              <code>{"{{jobTitle}}"}</code>, <code>{"{{userName}}"}</code>, <code>{"{{userSkills}}"}</code>,{" "}
              <code>{"{{userPhone}}"}</code>, <code>{"{{userLinkedIn}}"}</code>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={createTemplate}>Create New</Button>
              <Button variant="outline" onClick={updateTemplate} disabled={!selectedTemplateId}>
                Save Changes
              </Button>
              <Button variant="destructive" onClick={deleteTemplate} disabled={!selectedTemplateId}>
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <TemplatePreview subjectTemplate={subject} bodyTemplate={body} values={SAMPLE_VALUES} />
    </div>
  );
}
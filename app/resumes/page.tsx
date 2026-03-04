"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ResumeAsset = {
  id: string;
  label: string;
  roleTag: string | null;
  fileName: string;
  blobUrl: string;
  fileSize: number;
  isActive: boolean;
  updatedAt: string;
  applications: Array<{ id: string; company: string; role: string; status: string }>;
};

export default function ResumesPage() {
  const [resumes, setResumes] = useState<ResumeAsset[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("Frontend Resume");
  const [roleTag, setRoleTag] = useState("frontend");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void loadResumes();
  }, []);

  async function loadResumes() {
    const response = await fetch("/api/resumes", { cache: "no-store" });
    if (!response.ok) {
      setError("Failed to fetch resumes");
      return;
    }
    const data = await response.json();
    setResumes(data.resumes ?? []);
  }

  async function uploadResume() {
    if (!file) {
      setError("Select a PDF file first.");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("label", label);
      formData.append("roleTag", roleTag);

      const response = await fetch("/api/resumes", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to upload resume");
      }

      setFile(null);
      await loadResumes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload resume");
    } finally {
      setUploading(false);
    }
  }

  async function updateResume(resume: ResumeAsset, patch: Partial<Pick<ResumeAsset, "label" | "roleTag" | "isActive">>) {
    const response = await fetch(`/api/resumes/${resume.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(patch)
    });

    if (!response.ok) {
      setError("Failed to update resume");
      return;
    }

    await loadResumes();
  }

  async function deleteResume(resumeId: string) {
    const response = await fetch(`/api/resumes/${resumeId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      setError("Failed to delete resume");
      return;
    }

    await loadResumes();
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-bold text-slate-900">Multi-Resume Manager</h1>
        <p className="page-subtle">Upload and tag multiple role-specific resumes, then link them to applications.</p>
      </div>

      {error ? <p className="rounded-xl border-2 border-red-600 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Upload Resume PDF</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="resume-file">File</Label>
            <Input
              id="resume-file"
              type="file"
              accept="application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resume-label">Label</Label>
            <Input id="resume-label" value={label} onChange={(event) => setLabel(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resume-role-tag">Role Tag</Label>
            <Input id="resume-role-tag" value={roleTag} onChange={(event) => setRoleTag(event.target.value)} />
          </div>
          <div className="md:col-span-4">
            <Button onClick={uploadResume} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Resume"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {resumes.map((resume) => (
          <Card key={resume.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{resume.label}</span>
                <span className={`status-chip ${resume.isActive ? "bg-emerald-300 text-slate-900" : "bg-slate-200 text-slate-700"}`}>
                  {resume.isActive ? "Active" : "Inactive"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="font-semibold">File:</span> {resume.fileName}
              </p>
              <p>
                <span className="font-semibold">Role Tag:</span> {resume.roleTag ?? "-"}
              </p>
              <p>
                <span className="font-semibold">Size:</span> {(resume.fileSize / 1024).toFixed(1)} KB
              </p>
              <p>
                <span className="font-semibold">Linked Applications:</span> {resume.applications.length}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => window.open(resume.blobUrl, "_blank")}>Preview</Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    void updateResume(resume, {
                      isActive: !resume.isActive
                    })
                  }
                >
                  {resume.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => void deleteResume(resume.id)}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!resumes.length ? <p className="page-subtle">No resumes uploaded yet.</p> : null}
      </div>
    </section>
  );
}
"use client";

import { useState } from "react";
import { analyzeATS, ATSAnalysisResult } from "@/lib/ats-analyzer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function ATSCheckerPage() {
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [result, setResult] = useState<ATSAnalysisResult | null>(null);

  function runAnalysis() {
    if (!resumeText.trim() || !jdText.trim()) {
      return;
    }

    setResult(analyzeATS(resumeText, jdText));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-bold text-slate-900">ATS Resume Checker</h1>
        <p className="page-subtle">
          Client-side resume/JD comparison for keyword match, missing terms, and structure checklist.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Paste Resume</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              className="min-h-[260px]"
              placeholder="Paste full resume text..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paste Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={jdText}
              onChange={(event) => setJdText(event.target.value)}
              className="min-h-[260px]"
              placeholder="Paste JD text..."
            />
          </CardContent>
        </Card>
      </div>

      <Button onClick={runAnalysis} disabled={!resumeText.trim() || !jdText.trim()}>
        Analyze ATS Match
      </Button>

      {result ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>ATS Score</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="metric-mono text-5xl font-bold text-slate-900">{result.score}</p>
              <p className="text-sm text-slate-600">out of 100</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Keyword Coverage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-800">Matched Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {result.matchedKeywords.slice(0, 24).map((keyword) => (
                    <Badge key={keyword} variant="default">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-800">Missing Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map((keyword) => (
                    <Badge key={keyword} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Format Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.checklist.map((item) => (
                <div key={item.item} className="rounded-lg border-2 border-slate-900 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{item.item}</p>
                    <Badge variant={item.passed ? "default" : "destructive"}>{item.passed ? "Passed" : "Needs work"}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{item.tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
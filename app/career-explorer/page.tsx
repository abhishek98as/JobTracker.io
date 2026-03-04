"use client";

import { useMemo, useState } from "react";
import { recommendCareerPaths } from "@/lib/career-paths";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const DEFAULT_SKILLS = [
  "Java",
  "Python",
  "JavaScript",
  "TypeScript",
  "HTML",
  "CSS",
  "React",
  "Node",
  "SQL",
  "Testing",
  "Excel",
  "Communication"
];

export default function CareerExplorerPage() {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");

  const recommendations = useMemo(() => recommendCareerPaths(selectedSkills), [selectedSkills]);

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) => (prev.includes(skill) ? prev.filter((item) => item !== skill) : [...prev, skill]));
  }

  function addCustomSkill() {
    const cleaned = customSkill.trim();
    if (!cleaned) {
      return;
    }
    if (!selectedSkills.includes(cleaned)) {
      setSelectedSkills((prev) => [...prev, cleaned]);
    }
    setCustomSkill("");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-bold text-slate-900">Career Path Explorer</h1>
        <p className="page-subtle">
          Select current skills and get role recommendations, match %, skill-gap insights, and a learning path.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Skill Quiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {DEFAULT_SKILLS.map((skill) => {
              const active = selectedSkills.includes(skill);
              return (
                <button
                  type="button"
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`rounded-full border-2 px-3 py-1 text-sm font-semibold transition ${
                    active ? "border-slate-900 bg-blue-200 text-slate-900" : "border-slate-900 bg-white text-slate-700"
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input
              value={customSkill}
              onChange={(event) => setCustomSkill(event.target.value)}
              placeholder="Add another skill"
            />
            <Button type="button" variant="outline" onClick={addCustomSkill}>
              Add
            </Button>
          </div>
          <p className="text-xs text-slate-600">
            Selected: {selectedSkills.length ? selectedSkills.join(", ") : "No skills selected yet."}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {recommendations.slice(0, 3).map((role) => (
          <Card key={role.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{role.name}</span>
                <Badge variant={role.score >= 60 ? "default" : "secondary"}>{role.score}% match</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700">
              <p>{role.summary}</p>
              <div>
                <p className="mb-1 font-semibold text-slate-900">Missing Skills</p>
                <p>{role.missingSkills.length ? role.missingSkills.join(", ") : "You already match core skills."}</p>
              </div>
              <div>
                <p className="mb-1 font-semibold text-slate-900">Learning Path</p>
                <ol className="list-decimal space-y-1 pl-5">
                  {role.learningPath.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
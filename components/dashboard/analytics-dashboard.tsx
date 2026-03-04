"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AnalyticsResponse = {
  kpis: {
    totalApplications: number;
    responseRate: number;
    interviewRate: number;
    offerRate: number;
    avgResponseTimeDays: number;
    dayCounter: number;
    streak: number;
    bestPlatform: {
      platform: string;
      count: number;
      responseRate: number;
    } | null;
    weeklyGoal: {
      target: number;
      appliedThisWeek: number;
      completionPct: number;
    } | null;
  };
  funnel: Array<{ stage: string; value: number }>;
  platformBreakdown: Array<{ platform: string; count: number; responseRate: number }>;
  weeklyBars: Array<{ label: string; value: number; weekStart: string }>;
};

const pieColors = ["#3B82F6", "#F59E0B", "#22C55E", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899"];

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goalValue, setGoalValue] = useState("15");
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    void loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const tzOffsetMinutes = new Date().getTimezoneOffset();
      const response = await fetch(`/api/analytics/extended?tzOffsetMinutes=${tzOffsetMinutes}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const payload = (await response.json()) as AnalyticsResponse;
      setData(payload);
      if (payload.kpis.weeklyGoal) {
        setGoalValue(String(payload.kpis.weeklyGoal.target));
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function saveWeeklyGoal() {
    const target = Number(goalValue);
    if (!Number.isFinite(target) || target < 1) {
      return;
    }

    try {
      setSavingGoal(true);
      const response = await fetch("/api/goals/weekly", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ targetApplications: target })
      });

      if (!response.ok) {
        throw new Error("Failed to save goal");
      }

      await loadAnalytics();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save goal");
    } finally {
      setSavingGoal(false);
    }
  }

  const pieData = useMemo(
    () => data?.platformBreakdown.map((item) => ({ name: item.platform, value: item.count })) ?? [],
    [data]
  );

  if (loading) {
    return <p className="page-subtle">Loading extended analytics...</p>;
  }

  if (error || !data) {
    return <p className="text-red-600">{error ?? "Analytics unavailable"}</p>;
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="metric-mono text-3xl font-bold">{data.kpis.totalApplications}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="metric-mono text-3xl font-bold">{data.kpis.responseRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Interview Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="metric-mono text-3xl font-bold">{data.kpis.interviewRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Offer Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="metric-mono text-3xl font-bold">{data.kpis.offerRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Response</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="metric-mono text-3xl font-bold">{data.kpis.avgResponseTimeDays}d</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Day Counter</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="metric-mono text-3xl font-bold">Day {data.kpis.dayCounter}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.funnel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                <XAxis dataKey="stage" stroke="#1E293B" />
                <YAxis stroke="#1E293B" />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Momentum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border-2 border-slate-900 bg-emerald-100 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Current streak</p>
              <p className="metric-mono mt-1 text-3xl font-bold text-slate-900">{data.kpis.streak} days</p>
            </div>
            <div className="rounded-xl border-2 border-slate-900 bg-blue-100 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Best platform</p>
              <p className="mt-1 font-bold text-slate-900">
                {data.kpis.bestPlatform ? data.kpis.bestPlatform.platform : "Not enough data"}
              </p>
              {data.kpis.bestPlatform ? (
                <p className="metric-mono text-sm text-slate-700">{data.kpis.bestPlatform.responseRate}% response</p>
              ) : null}
            </div>
            <div className="rounded-xl border-2 border-slate-900 bg-amber-100 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Weekly goal</p>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={goalValue}
                  onChange={(event) => setGoalValue(event.target.value)}
                  className="h-9"
                />
                <Button size="sm" onClick={saveWeeklyGoal} disabled={savingGoal}>
                  {savingGoal ? "Saving" : "Set"}
                </Button>
              </div>
              {data.kpis.weeklyGoal ? (
                <p className="metric-mono mt-2 text-sm text-slate-700">
                  {data.kpis.weeklyGoal.appliedThisWeek}/{data.kpis.weeklyGoal.target} this week ({data.kpis.weeklyGoal.completionPct}%)
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-600">No weekly goal set yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={95} label>
                  {pieData.map((item, index) => (
                    <Cell key={`${item.name}-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
                <XAxis dataKey="label" stroke="#1E293B" />
                <YAxis stroke="#1E293B" />
                <Tooltip />
                <Bar dataKey="value" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
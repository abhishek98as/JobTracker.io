import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-4xl font-bold text-slate-900">Extended Analytics Dashboard</h1>
      <p className="page-subtle">
        Track conversion funnel, weekly momentum, best-performing platform, and Day N progression of your search.
      </p>
      <AnalyticsDashboard />
    </div>
  );
}
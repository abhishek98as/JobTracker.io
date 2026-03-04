import { KanbanBoard } from "@/components/kanban/kanban-board";

export default function TrackerPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-4xl font-bold text-slate-900">Application Tracker</h1>
      <p className="page-subtle">
        Manage your full pipeline, set reminders, detect duplicates, and export filtered records.
      </p>
      <KanbanBoard />
    </div>
  );
}
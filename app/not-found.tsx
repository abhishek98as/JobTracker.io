import Link from "next/link";
import { ArrowLeft, Home, KanbanSquare } from "lucide-react";
import { AppLogo } from "@/components/layout/app-logo";
import { NotFoundAnimation } from "@/components/layout/not-found-animation";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-8 py-4">
      <div className="logo-link w-fit">
        <AppLogo size="md" showTagline />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5 rounded-[16px] border-2 border-slate-900 bg-white p-6 shadow-[6px_6px_0_rgb(15_23_42)]">
          <p className="metric-mono text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">Route Missing</p>
          <h1 className="font-heading text-5xl font-extrabold leading-tight text-slate-900">This page ghosted your pipeline.</h1>
          <p className="text-base text-slate-700">
            The URL you opened does not exist. Jump back to your tracker, keep momentum, and continue shipping applications.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/" className="inline-flex items-center gap-2 rounded-[12px] border-2 border-slate-900 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[4px_4px_0_rgb(15_23_42)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgb(15_23_42)]">
              <Home className="h-4 w-4" />
              Back Home
            </Link>
            <Link href="/tracker" className="inline-flex items-center gap-2 rounded-[12px] border-2 border-slate-900 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-[4px_4px_0_rgb(15_23_42)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgb(15_23_42)]">
              <KanbanSquare className="h-4 w-4" />
              Open Tracker
            </Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-[12px] border-2 border-slate-900 bg-amber-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow-[4px_4px_0_rgb(15_23_42)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgb(15_23_42)]">
              <ArrowLeft className="h-4 w-4" />
              View Dashboard
            </Link>
          </div>
        </div>

        <div className="space-y-4 rounded-[16px] border-2 border-slate-900 bg-[#FFFDF7] p-4 shadow-[6px_6px_0_rgb(15_23_42)]">
          <NotFoundAnimation />
          <p className="text-xs text-slate-600">
            Animated preview: your application cards are still moving forward even when a route breaks.
          </p>
        </div>
      </div>
    </section>
  );
}
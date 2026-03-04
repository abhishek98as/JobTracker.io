import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  FileText,
  KanbanSquare,
  Mail,
  Sparkles,
  UserCircle2,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLogo } from "@/components/layout/app-logo";

const cards = [
  {
    href: "/tracker",
    title: "Tracker + Kanban",
    description: "Pipeline board with reminders, duplicate warnings, and exports.",
    icon: KanbanSquare
  },
  {
    href: "/dashboard",
    title: "Extended Analytics",
    description: "Funnel, platform performance, streaks, weekly goals, and day counter.",
    icon: Sparkles
  },
  {
    href: "/timeline",
    title: "Timeline View",
    description: "Chronological activity feed across your job-search journey.",
    icon: CalendarRange
  },
  {
    href: "/resumes",
    title: "Resume Manager",
    description: "Upload role-based resume PDFs and link them to applications.",
    icon: UserCircle2
  },
  {
    href: "/referrals",
    title: "Referral Tracker",
    description: "Track contacts and link referrals to applications.",
    icon: Users
  },
  {
    href: "/ats-checker",
    title: "ATS Checker",
    description: "Resume/JD match score, missing keywords, and checklist tips.",
    icon: FileText
  },
  {
    href: "/career-explorer",
    title: "Career Explorer",
    description: "Skill quiz with role recommendations and skill-gap analysis.",
    icon: ArrowRight
  },
  {
    href: "/cold-email",
    title: "Cold Email Engine",
    description: "Excel parsing, template personalization, and queue-based sending.",
    icon: Mail
  }
];

type HomePageProps = {
  searchParams?: {
    auth?: string;
    next?: string;
  };
};

export default function HomePage({ searchParams }: HomePageProps) {
  const authRequired = searchParams?.auth === "required";
  const nextPath = searchParams?.next || "/dashboard";

  return (
    <section className="space-y-8">
      {authRequired ? (
        <div className="rounded-[14px] border-2 border-amber-700 bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-900">
          Sign in with Google to access <span className="metric-mono">{nextPath}</span>.
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3">
          <h1 className="font-heading text-5xl font-bold tracking-tight text-slate-900">Your Job Hunt, Brutally Clear</h1>
          <p className="max-w-3xl text-slate-700">
            Soft Brutalism workflow for job hunting: structured tracking, interview preparation, referrals, reminders,
            analytics, and outreach automation.
          </p>
        </div>
        <div className="flex items-center justify-start lg:justify-end">
          <div className="logo-link rounded-[18px] border-2 border-slate-900 bg-white p-4 shadow-[6px_6px_0_rgb(15_23_42)]">
            <AppLogo size="lg" showTagline />
          </div>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_rgb(15_23_42)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="h-5 w-5 text-blue-700" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-700">{description}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                  Open module <ArrowRight className="h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

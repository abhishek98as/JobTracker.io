import { cn } from "@/lib/utils";

type AppLogoProps = {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  showTagline?: boolean;
  className?: string;
};

const sizeMap = {
  sm: {
    mark: "h-10 w-10",
    title: "text-xl",
    subtitle: "text-[10px]"
  },
  md: {
    mark: "h-14 w-14",
    title: "text-2xl",
    subtitle: "text-xs"
  },
  lg: {
    mark: "h-20 w-20",
    title: "text-4xl",
    subtitle: "text-sm"
  }
} as const;

export function AppLogo({ size = "md", showWordmark = true, showTagline = false, className }: AppLogoProps) {
  const current = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className={cn("logo-shell", current.mark)} aria-hidden="true">
        <svg viewBox="0 0 96 96" className="logo-mark h-full w-full" role="img">
          <rect x="6" y="8" width="84" height="84" rx="18" fill="#FFFDF7" stroke="#0F172A" strokeWidth="4" />
          <rect x="18" y="20" width="28" height="56" rx="8" fill="#3B82F6" stroke="#0F172A" strokeWidth="3" />
          <rect x="50" y="20" width="28" height="56" rx="8" fill="#F59E0B" stroke="#0F172A" strokeWidth="3" />
          <path d="M34 30v30c0 6-4 10-10 10h-2" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M55 30h18M64 30v33" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="78" cy="78" r="6" fill="#F97316" stroke="#0F172A" strokeWidth="3" />
        </svg>
      </span>

      {showWordmark ? (
        <span className="flex flex-col leading-none">
          <span className={cn("logo-wordmark font-heading font-extrabold tracking-tight text-slate-900", current.title)}>
            JobTrackr
          </span>
          {showTagline ? (
            <span className={cn("logo-tag metric-mono uppercase tracking-[0.2em] text-slate-600", current.subtitle)}>
              Neo Brutal Workflow
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
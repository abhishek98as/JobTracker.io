export const PIPELINE_STATUSES = [
  "wishlist",
  "applied",
  "responded",
  "interview",
  "offer",
  "accepted",
  "rejected"
] as const;

export const PIPELINE_LABELS: Record<(typeof PIPELINE_STATUSES)[number], string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  responded: "Responded",
  interview: "Interview",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected"
};

export const PLATFORM_OPTIONS = [
  "linkedin",
  "naukri",
  "internshala",
  "wellfound",
  "company",
  "referral",
  "cold_email"
] as const;

export const PLATFORM_LABELS: Record<(typeof PLATFORM_OPTIONS)[number], string> = {
  linkedin: "LinkedIn",
  naukri: "Naukri",
  internshala: "Internshala",
  wellfound: "Wellfound",
  company: "Company Website",
  referral: "Referral",
  cold_email: "Cold Email"
};

export const EMAIL_BLACKLIST_WORDS = [
  "free",
  "guaranteed",
  "act now",
  "limited time",
  "click here",
  "100%",
  "winner",
  "congratulations"
];

export const MAX_EMAILS_PER_HOUR = 25;
export const MAX_EMAILS_PER_DAY = 450;

export const CLOSED_STATUSES = ["accepted", "rejected"] as const;

export const STATUS_ACCENT_CLASSES: Record<(typeof PIPELINE_STATUSES)[number], string> = {
  wishlist: "bg-[#B8C0FF] text-slate-900",
  applied: "bg-[#7DD3FC] text-slate-900",
  responded: "bg-[#86EFAC] text-slate-900",
  interview: "bg-[#FCD34D] text-slate-900",
  offer: "bg-[#F9A8D4] text-slate-900",
  accepted: "bg-[#4ADE80] text-slate-900",
  rejected: "bg-[#F87171] text-slate-900"
};

export const STALE_LEVELS = ["green", "yellow", "red"] as const;

export const ROUND_TYPES = ["phone", "technical", "system_design", "hr", "managerial", "other"] as const;

export const ACTIVITY_EVENT_TYPES = [
  "application_created",
  "status_changed",
  "interview_added",
  "interview_updated",
  "reminder_updated",
  "resume_linked",
  "resume_unlinked",
  "referral_linked",
  "referral_unlinked",
  "research_updated",
  "milestone_reached"
] as const;

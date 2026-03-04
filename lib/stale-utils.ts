import { CLOSED_STATUSES } from "@/lib/constants";

export type StaleLevel = "green" | "yellow" | "red";

export function daysSince(baseDate: Date, now = new Date()) {
  const millis = now.getTime() - baseDate.getTime();
  return Math.max(0, Math.floor(millis / (1000 * 60 * 60 * 24)));
}

export function getStaleLevel(days: number): StaleLevel {
  if (days < 7) {
    return "green";
  }

  if (days <= 14) {
    return "yellow";
  }

  return "red";
}

export function computeApplicationStaleLevel(params: {
  appliedAt: Date | null;
  createdAt: Date;
  status: string;
  now?: Date;
}) {
  const baseDate = params.appliedAt ?? params.createdAt;
  const days = daysSince(baseDate, params.now ?? new Date());
  const staleLevel = getStaleLevel(days);
  const isClosed = (CLOSED_STATUSES as readonly string[]).includes(params.status);

  return {
    daysSinceApplied: days,
    staleLevel,
    isStale: !isClosed && days > 14
  };
}
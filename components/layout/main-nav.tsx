"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  showReminderBadge?: boolean;
};

type Props = {
  items: NavItem[];
};

export function MainNav({ items }: Props) {
  const pathname = usePathname();
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadBadge() {
      try {
        const response = await fetch("/api/reminders/badge-count", {
          cache: "no-store"
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!cancelled) {
          setBadgeCount(data.badgeCount ?? 0);
        }
      } catch {
        // ignore nav badge failures
      }
    }

    void loadBadge();
    const interval = setInterval(() => void loadBadge(), 45_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <nav className="hidden flex-wrap items-center gap-2 lg:flex">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "brutal-nav-pill",
              active ? "bg-slate-900 text-white" : "bg-white text-slate-800 hover:-translate-x-0.5 hover:-translate-y-0.5"
            )}
          >
            <span>{item.label}</span>
            {item.showReminderBadge && badgeCount > 0 ? <span className="brutal-reminder-pill">{badgeCount}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
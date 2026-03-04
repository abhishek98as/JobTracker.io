"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

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

    async function bootstrap() {
      try {
        const response = await fetch("/api/auth/firebase/session", {
          cache: "no-store"
        });

        if (!response.ok) {
          if (!cancelled) {
            setIsAuthenticated(false);
            setBadgeCount(0);
          }
          return;
        }

        const data = await response.json();
        const authed = Boolean(data.user);

        if (!cancelled) {
          setIsAuthenticated(authed);
        }

        if (!authed) {
          if (!cancelled) {
            setBadgeCount(0);
          }
          return;
        }

        await loadBadge();
        intervalId = setInterval(() => void loadBadge(), 45_000);
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setBadgeCount(0);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return (
    <>
      {/* ── Desktop nav ── */}
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
              {item.showReminderBadge && isAuthenticated && badgeCount > 0 ? (
                <span className="brutal-reminder-pill">{badgeCount}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* ── Hamburger button (mobile only) ── */}
      <div className="relative lg:hidden" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className={cn(
            "inline-flex items-center justify-center rounded-xl border-2 border-slate-900 bg-white p-2 text-slate-900 transition-all duration-200",
            "shadow-[2px_2px_0_rgb(15_23_42)]",
            menuOpen
              ? "translate-x-[-2px] translate-y-[-2px] shadow-[4px_4px_0_rgb(15_23_42)]"
              : "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_rgb(15_23_42)]"
          )}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* ── Mobile dropdown ── */}
        {menuOpen && (
          <div
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 rounded-[14px] border-2 border-slate-900 bg-[#FAF9F6] p-3"
            style={{ boxShadow: "4px 4px 0 rgb(15 23 42 / 0.95)" }}
          >
            <nav className="flex flex-col gap-2">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "brutal-nav-pill w-full justify-between",
                      active ? "bg-slate-900 text-white" : "bg-white text-slate-800"
                    )}
                  >
                    <span>{item.label}</span>
                    {item.showReminderBadge && isAuthenticated && badgeCount > 0 ? (
                      <span className="brutal-reminder-pill">{badgeCount}</span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </>
  );
}


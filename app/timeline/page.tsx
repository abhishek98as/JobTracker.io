"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_ACCENT_CLASSES } from "@/lib/constants";

type TimelineEvent = {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  occurredAt: string;
  application: {
    id: string;
    company: string;
    role: string;
    status: keyof typeof STATUS_ACCENT_CLASSES;
    platform: string;
  } | null;
};

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadTimeline();
  }, []);

  async function loadTimeline() {
    try {
      setLoading(true);
      const response = await fetch("/api/timeline", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load timeline");
      }
      const data = await response.json();
      setEvents(data.events ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();

    events.forEach((event) => {
      const dayKey = new Date(event.occurredAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
      });

      if (!map.has(dayKey)) {
        map.set(dayKey, []);
      }

      map.get(dayKey)!.push(event);
    });

    return [...map.entries()];
  }, [events]);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-bold text-slate-900">Timeline / Journey View</h1>
        <p className="page-subtle">Chronological feed of your job search events across all applications.</p>
      </div>

      {loading ? <p className="page-subtle">Loading timeline...</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      <div className="space-y-5">
        {grouped.map(([dayKey, dayEvents]) => (
          <div key={dayKey} className="space-y-3">
            <span className="timeline-day-chip">{dayKey}</span>
            <div className="space-y-3">
              {dayEvents.map((event) => (
                <Card key={event.id} className="border-l-[10px] border-l-slate-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-start justify-between gap-4">
                      <div>
                        <p>{event.title}</p>
                        <p className="mt-1 text-xs font-medium text-slate-600">
                          {new Date(event.occurredAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      {event.application ? (
                        <span className={`status-chip ${STATUS_ACCENT_CLASSES[event.application.status]}`}>
                          {event.application.status}
                        </span>
                      ) : null}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-slate-700">
                    {event.description ? <p>{event.description}</p> : null}
                    {event.application ? (
                      <p>
                        <Link href={`/tracker/${event.application.id}`} className="font-semibold text-blue-700 underline-offset-4 hover:underline">
                          {event.application.company} - {event.application.role}
                        </Link>
                        {" | "}
                        <span className="uppercase tracking-wide">{event.application.platform}</span>
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Referral = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  notes: string | null;
  _count: {
    applications: number;
  };
  applications: Array<{
    id: string;
    company: string;
    role: string;
    status: string;
  }>;
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  notes: ""
};

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadReferrals();
  }, []);

  async function loadReferrals() {
    const response = await fetch("/api/referrals", { cache: "no-store" });
    if (!response.ok) {
      setError("Failed to load referrals");
      return;
    }

    const data = await response.json();
    setReferrals(data.referrals ?? []);
  }

  async function createReferral() {
    if (!form.name.trim()) {
      setError("Referral name is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create referral");
      }

      setForm(emptyForm);
      await loadReferrals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create referral");
    } finally {
      setSaving(false);
    }
  }

  async function deleteReferral(id: string) {
    const response = await fetch(`/api/referrals/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      setError("Failed to delete referral");
      return;
    }

    await loadReferrals();
  }

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-bold text-slate-900">Referral Tracker</h1>
        <p className="page-subtle">Track who referred you, where they referred you, and stay organized for thank-you follow-ups.</p>
      </div>

      {error ? <p className="rounded-xl border-2 border-red-600 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Add Referral Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ref-name">Name</Label>
            <Input id="ref-name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ref-email">Email</Label>
            <Input
              id="ref-email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ref-phone">Phone</Label>
            <Input
              id="ref-phone"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ref-li">LinkedIn</Label>
            <Input
              id="ref-li"
              value={form.linkedinUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, linkedinUrl: event.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ref-notes">Notes</Label>
            <Textarea
              id="ref-notes"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={createReferral} disabled={saving}>
              {saving ? "Saving..." : "Create Referral Contact"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {referrals.map((referral) => (
          <Card key={referral.id}>
            <CardHeader>
              <CardTitle>{referral.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Email:</span> {referral.email ?? "-"}
              </p>
              <p>
                <span className="font-semibold">Phone:</span> {referral.phone ?? "-"}
              </p>
              <p>
                <span className="font-semibold">LinkedIn:</span>{" "}
                {referral.linkedinUrl ? (
                  <a href={referral.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline-offset-4 hover:underline">
                    Open profile
                  </a>
                ) : (
                  "-"
                )}
              </p>
              <p>
                <span className="font-semibold">Linked applications:</span> {referral._count.applications}
              </p>
              {referral.applications.length ? (
                <div className="rounded-xl border-2 border-slate-900 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Recent links</p>
                  <ul className="mt-2 space-y-1">
                    {referral.applications.map((application) => (
                      <li key={application.id}>
                        <Link href={`/tracker/${application.id}`} className="text-blue-700 underline-offset-4 hover:underline">
                          {application.company} - {application.role}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {referral.notes ? <p className="rounded-xl border-2 border-slate-900 bg-white p-2 text-xs">{referral.notes}</p> : null}
              <Button size="sm" variant="destructive" onClick={() => void deleteReferral(referral.id)}>
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
        {!referrals.length ? <p className="page-subtle">No referral contacts yet.</p> : null}
      </div>
    </section>
  );
}
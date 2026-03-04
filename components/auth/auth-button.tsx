"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";

type SessionUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

export function AuthButton() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    void loadUser();
  }, []);

  async function loadUser() {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/firebase/session", { cache: "no-store" });
      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();
      setUser(data.user ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    try {
      setWorking(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const idToken = await result.user.getIdToken();

      const response = await fetch("/api/auth/firebase/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ idToken })
      });

      if (!response.ok) {
        throw new Error("Failed to establish authenticated session");
      }

      const data = await response.json();
      setUser(data.user ?? null);
      window.location.reload();
    } catch {
      // no-op UI for now
    } finally {
      setWorking(false);
    }
  }

  async function handleSignOut() {
    try {
      setWorking(true);
      await signOut(firebaseAuth).catch(() => null);
      await fetch("/api/auth/firebase/session", {
        method: "DELETE"
      });
      setUser(null);
      window.location.href = "/";
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return <Button variant="outline">Loading...</Button>;
  }

  if (!user) {
    return (
      <Button onClick={handleSignIn} disabled={working}>
        {working ? "Signing in..." : "Sign in with Google"}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/tracker" className="hidden text-sm font-medium text-slate-700 md:inline">
        {user.name ?? user.email}
      </Link>
      <Button variant="outline" onClick={handleSignOut} disabled={working}>
        {working ? "Signing out..." : "Logout"}
      </Button>
    </div>
  );
}
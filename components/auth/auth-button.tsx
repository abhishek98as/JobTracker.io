"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadUser();
  }, []);

  async function loadUser() {
    try {
      setLoading(true);
      setError(null);
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
      setError(null);
      const provider = new GoogleAuthProvider();
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error("Firebase is not configured. Ensure all NEXT_PUBLIC_FIREBASE_* env vars are set in Vercel and redeploy.");
      }

      const result = await signInWithPopup(auth, provider);
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
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to sign in.");
    } finally {
      setWorking(false);
    }
  }

  async function handleSignOut() {
    try {
      setWorking(true);
      setError(null);
      const auth = getFirebaseAuth();
      if (auth) {
        await signOut(auth).catch(() => null);
      }
      await fetch("/api/auth/firebase/session", {
        method: "DELETE"
      });
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to sign out.");
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return <Button variant="outline">Loading...</Button>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button onClick={handleSignIn} disabled={working}>
          {working ? "Signing in..." : "Sign in with Google"}
        </Button>
        {error ? <p className="max-w-[280px] text-right text-xs text-red-700">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        <Link href="/tracker" className="hidden text-sm font-medium text-slate-700 md:inline">
          {user.name ?? user.email}
        </Link>
        <Button variant="outline" onClick={handleSignOut} disabled={working}>
          {working ? "Signing out..." : "Logout"}
        </Button>
      </div>
      {error ? <p className="max-w-[280px] text-right text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

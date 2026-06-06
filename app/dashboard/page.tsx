"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from("account_settings")
      .select(
        "theme, city, favourite_foods, dietary_restrictions, initial_userflow",
      )
      .eq("id", user!.id)
      .single();

    console.log("PROFILE:", profile); // Remove in production

    if (profile?.initial_userflow === false) {
      router.push("/initial-userflow");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();

    setIsLoggingOut(false);

    if (error) {
      console.error("Logout failed", error);
    }

    router.push("/");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-start justify-center py-12">
      <div className="w-full max-w-3xl bg-slate-900/95 border border-slate-800 shadow-black/30 shadow-xl rounded-3xl p-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-slate-50">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">
              Welcome back — this is a temporary dashboard.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Signing out…" : "Logout"}
          </Button>
        </header>

        <section className="grid gap-4">
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-inner shadow-slate-950/40">
            <h2 className="text-xl font-medium text-slate-100">Account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              You can logout using the button in the top-right.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-inner shadow-slate-950/40">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-slate-100">
                Quick Links
              </h2>
              <div className="text-sm text-slate-500">
                Navigate with confidence
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild variant="outline" size="default">
                <a href="/">Home</a>
              </Button>
              <Button asChild variant="outline" size="default">
                <a href="/recipes">Recipes</a>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

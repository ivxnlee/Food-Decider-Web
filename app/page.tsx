"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import FoodSpinner, { FoodItem } from "@/components/food-spinner";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const [initStatus, setInitStatus] = useState<
    "loading" | "logged in" | "logged out"
  >("loading");
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [mappedFoods, setMappedFoods] = useState<FoodItem[]>([]);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle OTP expiration error from query params or hash params
  useEffect(() => {
    if (!mounted) return;

    // Check query params (PKCE flow)
    const queryParams = new URLSearchParams(window.location.search);

    // Check hash params (implicit flow / error redirects)
    const hashParams = new URLSearchParams(
      window.location.hash.replace("#", ""),
    );

    const errorCode =
      queryParams.get("error_code") || hashParams.get("error_code");

    if (errorCode === "otp_expired") {
      toast.error("Link Expired", {
        description:
          "Your confirmation link has expired. Please sign up again.",
      });
    }
  }, [mounted, searchParams]);

  const fetchProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setInitStatus("logged out");
      return;
    }

    setInitStatus("logged in");

    const { data: profile } = await supabase
      .from("account_settings")
      .select(
        "theme, city, favourite_foods, dietary_restrictions, initial_userflow",
      )
      .eq("id", session.user.id)
      .single();

    if (profile?.initial_userflow === true) {
      router.push("/initial-userflow");
    } else if (profile?.favourite_foods && profile.favourite_foods.length > 0) {
      const { data: foods } = await supabase
        .from("foods")
        .select("id, name, cuisine, desc, image_url")
        .in("id", profile?.favourite_foods);

      if (foods && foods.length > 0) {
        const mappedFoods = foods.map((food) => ({
          name: food.name,
          desc: food.desc,
          cuisine: food.cuisine,
          image_url: food.image_url,
          chance: 0.1,
        }));
        setMappedFoods(mappedFoods);
      }
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
    <main
      style={{ backgroundColor: "lab(2.75381% 0 0)" }}
      className="min-h-screen text-slate-100 flex items-start justify-center py-3"
    >
      <div className="w-full m-6 h-full bg-black shadow-black/30 shadow-xl rounded-3xl p-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-5xl font-semibold text-slate-50">
              Food Decider
            </h1>
            <p className="mt-1 text-xl text-slate-400">
              Can't decide your next meal? Let fate (and flavor) choose for you
              🍜✨
            </p>
          </div>
          {initStatus === "logged out" && (
            <div>
              <Button
                asChild
                variant="green"
                className="mr-2 w-40 h-15 text-3xl"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button
                asChild
                variant="destructive"
                className="w-40 h-15 text-3xl"
              >
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
          {initStatus === "logged in" && (
            <Button
              type="button"
              variant="destructive"
              className="w-40 h-15 text-3xl"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              Logout
            </Button>
          )}
        </header>

        <section className="grid gap-4">
          {initStatus === "logged out" && (
            <div className="p-6 rounded-3xl border border-amber-600 bg-amber-800 shadow-inner shadow-slate-950/40">
              <h2 className="text-xl font-medium text-slate-50">DEMO MODE</h2>
              <p className="mt-2 text-sm leading-6 text-slate-50">
                Create an account to save your preferences and get personalized
                food suggestions! This demo resets each visit. Sign up now to
                start your flavor adventure! 🍕🍣🥗
              </p>
            </div>
          )}

          <FoodSpinner loggedIn={initStatus} items={mappedFoods} />
        </section>
      </div>
    </main>
  );
}

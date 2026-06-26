"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import FoodSpinner, { FoodItem } from "@/components/food-spinner";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

interface FoodData {
  id: number;
  name: string;
  desc: string;
  cuisine: string[];
  image_url: string;
  is_locked: boolean;
  expires_at: string | null;
}

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
  const [suggestAgainDays, setSuggestAgainDays] = useState<number>(4);
  const [favouriteFoods, setFavouriteFoods] = useState<number[] | null>(null);
  const [lockedFoods, setLockedFoods] = useState<FoodData[] | null>(null);
  const [isTouch, setIsTouch] = useState<boolean>(false);
  const [currentEntryID, setCurrentEntryID] = useState<number>(0);
  const [lockLoading, setLockLoading] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);

    const touch =
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;
    setIsTouch(touch);
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
        "theme, city, favourite_foods, dietary_restrictions, initial_userflow, suggest_again_days",
      )
      .eq("id", session.user.id)
      .single();

    if (profile?.initial_userflow === true) {
      router.push("/initial-userflow");
    } else if (profile?.favourite_foods && profile.favourite_foods.length > 0) {
      setSuggestAgainDays(profile.suggest_again_days);
      setFavouriteFoods(profile.favourite_foods);
      getAvailableFavouriteFoods(profile.favourite_foods);
    }
  };

  const getAvailableFavouriteFoods = async (favourite_foods: number[]) => {
    const { data } = await supabase.rpc("get_available_favourite_foods", {
      p_food_ids: favourite_foods,
    });

    const foods = data as FoodData[] | null;

    if (foods && foods.length > 0) {
      const availableFoods = foods.filter((f) => !f.is_locked);
      const lockedFoods = foods.filter((f) => f.is_locked);
      setLockedFoods(lockedFoods);

      if (availableFoods && availableFoods.length > 0) {
        const mappedFoods = availableFoods.map((food: FoodData) => ({
          id: food.id,
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

  const lockIn = async (foodID: number, onSuccess?: () => void) => {
    setLockLoading(true);
    const { error } = await supabase.rpc("lock_food", {
      p_food_id: foodID,
      p_days: suggestAgainDays,
    });

    if (error) {
      console.error("Error updating profile:", error);
      return;
    }
    favouriteFoods && getAvailableFavouriteFoods(favouriteFoods);
    toast.success("Food Locked Successfully");
    setLockLoading(false);
    onSuccess?.();
  };

  const removeFromLock = async (foodID: number) => {
    const { error } = await supabase
      .from("food_locks")
      .delete()
      .eq("food_id", foodID);

    if (error) {
      console.error("Error removing lock:", error);
      return;
    }
    toast.success("Locked Food Removed");
    favouriteFoods && getAvailableFavouriteFoods(favouriteFoods);
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

          <FoodSpinner
            loggedIn={initStatus}
            items={mappedFoods}
            lockIn={lockIn}
            lockLoading={lockLoading}
          />

          {lockedFoods && lockedFoods.length > 0 && (
            <div className="w-full overflow-auto rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
              <div className="sticky top-0 z-10 flex h-11 items-center justify-center border-b border-emerald-500/20 bg-emerald-500/10 text-sm font-semibold text-emerald-400">
                Locked Foods ({lockedFoods.length})
              </div>
              <div className="flex flex-row gap-3 p-4">
                {lockedFoods.map((entry) => (
                  <div
                    key={entry.id}
                    className="group relative flex w-49 items-center gap-3 rounded-xl border border-white/10 bg-white/10 p-3 transition hover:cursor-pointer"
                    onClick={() => isTouch && setCurrentEntryID(entry.id)}
                  >
                    {entry.image_url && (
                      <img
                        src={entry.image_url}
                        alt={entry.name}
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-slate-100">
                        {entry.name}
                      </div>
                      {entry.cuisine && entry.cuisine.length > 0 && (
                        <div className="mt-1 truncate text-sm text-slate-400">
                          {entry.cuisine.join(", ")}
                        </div>
                      )}
                    </div>

                    {isTouch && entry.id === currentEntryID && (
                      <div
                        className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/70 text-sm font-medium text-white opacity-100 transition-opacity duration-200"
                        onClick={() => removeFromLock(entry.id)}
                      >
                        Tap Again to Remove
                      </div>
                    )}

                    {!isTouch && (
                      <div
                        className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/70 text-sm font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        onClick={() => removeFromLock(entry.id)}
                      >
                        Click to Remove
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="mt-0 text-base text-slate-300">
            psst —{" "}
            <a
              href="https://ivanl.dev"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              my portfolio
            </a>{" "}
            is pretty cool too 👀
          </p>
        </section>
      </div>
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import FoodSpinner, { FoodItem } from "@/components/food-spinner";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings02Icon } from "@hugeicons/core-free-icons";
import { SettingsModal } from "@/components/settings-modal";
import { LikesModal } from "@/components/likes-modal";

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
  const router = useRouter();
  const supabase = createClient();
  const [initStatus, setInitStatus] = useState<
    "loading" | "logged in" | "logged out"
  >("loading");
  const [userID, setUserID] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [mappedFoods, setMappedFoods] = useState<FoodItem[]>([]);
  const [mounted, setMounted] = useState<boolean>(false);
  const [suggestAgainDays, setSuggestAgainDays] = useState<number>(4);
  const [city, setCity] = useState<string>("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [halal, setHalal] = useState<boolean>(false);
  const [vegan, setVegan] = useState<boolean>(false);
  const [vegetarian, setVegetarian] = useState<boolean>(false);
  const [favouriteFoods, setFavouriteFoods] = useState<number[] | null>(null);
  const [lockedFoods, setLockedFoods] = useState<FoodData[] | null>(null);
  const [favouriteFoodEntries, setFavouriteFoodEntries] = useState<FoodData[]>(
    [],
  );
  const [suggestedFoods, setSuggestedFoods] = useState<FoodData[]>([]);
  const [isTouch, setIsTouch] = useState<boolean>(false);
  const [currentEntryID, setCurrentEntryID] = useState<number>(0);
  const [lockLoading, setLockLoading] = useState<boolean>(false);
  const [likesMutating, setLikesMutating] = useState<boolean>(false);

  // Modal States
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [likesModalOpen, setLikesModalOpen] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const COOLDOWN_SECONDS = 120; // 2 minutes
  const STORAGE_KEY = "suggestion_cooldown_until";

  useEffect(() => {
    setMounted(true);

    const touch =
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;
    setIsTouch(touch);

    const storedUntil = localStorage.getItem(STORAGE_KEY);
    if (storedUntil) {
      const remaining = Math.ceil((Number(storedUntil) - Date.now()) / 1000);
      if (remaining > 0) setSecondsLeft(remaining);
    }
  }, []);

  // Handle OTP expiration error from query params or hash params
  useEffect(() => {
    if (!mounted) return;

    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
      window.location.hash.replace("#", ""),
    );

    const errorCode =
      queryParams.get("error_code") || hashParams.get("error_code");

    if (errorCode === "otp_expired") {
      toast.error("Link Expired", {
        description:
          "Your link has expired. Please sign up or reset password again.",
      });
    }
  }, [mounted]);

  // Close the currently active card when tapping outside of it (for touch devices)
  useEffect(() => {
    if (!isTouch || currentEntryID === 0) return;

    function handleOutsideTap(e: PointerEvent) {
      const target = e.target as HTMLElement;
      // if the tap wasn't inside the currently active card, close it
      if (!target.closest(`[data-entry-id="${currentEntryID}"]`)) {
        setCurrentEntryID(0);
      }
    }

    document.addEventListener("pointerdown", handleOutsideTap);
    return () => document.removeEventListener("pointerdown", handleOutsideTap);
  }, [isTouch, currentEntryID]);

  // Tick every second while like modal suggestion cooldown is active
  useEffect(() => {
    if (secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          localStorage.removeItem(STORAGE_KEY);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  // Call this right after a successful like modal suggestion submission
  const startCooldown = useCallback(() => {
    const until = Date.now() + COOLDOWN_SECONDS * 1000;
    localStorage.setItem(STORAGE_KEY, String(until));
    setSecondsLeft(COOLDOWN_SECONDS);
  }, []);

  const fetchProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setInitStatus("logged out");
      return;
    }

    setInitStatus("logged in");
    setUserID(session.user.id);

    const { data: profile } = await supabase
      .from("account_settings")
      .select(
        "theme, city, dietary_restrictions, halal, vegan, vegetarian, favourite_foods, initial_userflow, suggest_again_days",
      )
      .eq("id", session.user.id)
      .single();

    const profileCity = profile?.city ?? "";
    const profileDietaryRestrictions = profile?.dietary_restrictions ?? [];
    const profileHalal = Boolean(profile?.halal);
    const profileVegan = Boolean(profile?.vegan);
    const profileVegetarian = Boolean(profile?.vegetarian);

    setCity(profileCity);
    setDietaryRestrictions(profileDietaryRestrictions);
    setHalal(profileHalal);
    setVegan(profileVegan);
    setVegetarian(profileVegetarian);

    if (profile?.initial_userflow === true) {
      router.push("/initial-userflow");
      return;
    }

    const favouriteFoodIds = profile?.favourite_foods ?? [];
    setSuggestAgainDays(profile?.suggest_again_days ?? 4);
    setFavouriteFoods(favouriteFoodIds);

    if (favouriteFoodIds.length > 0) {
      await getAvailableFavouriteFoods(favouriteFoodIds);
      await fetchSuggestedFoods(
        favouriteFoodIds,
        profileCity,
        profileHalal,
        profileVegan,
        profileVegetarian,
      );
    } else {
      setFavouriteFoodEntries([]);
      setLockedFoods([]);
      setMappedFoods([]);
      await fetchSuggestedFoods(
        [],
        profileCity,
        profileHalal,
        profileVegan,
        profileVegetarian,
      );
    }
  };

  const fetchSuggestedFoods = async (
    currentFavouriteIds: number[] = [],
    profileCity = city,
    profileHalal = halal,
    profileVegan = vegan,
    profileVegetarian = vegetarian,
  ) => {
    let query = supabase
      .from("foods")
      .select("id, name, desc, cuisine, image_url")
      .limit(10);

    if (profileCity) {
      query = query.contains("city", [profileCity]);
    }
    if (profileHalal) {
      query = query.eq("halal", true);
    }
    if (profileVegan) {
      query = query.eq("vegan", true);
    }
    if (profileVegetarian) {
      query = query.eq("vegetarian", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching suggested foods:", error);
      return;
    }

    const filteredFoods = (data ?? []).filter(
      (food) => !currentFavouriteIds.includes(food.id),
    ) as FoodData[];
    setSuggestedFoods(filteredFoods);
  };

  const getAvailableFavouriteFoods = async (favourite_foods: number[]) => {
    if (favourite_foods.length === 0) {
      setFavouriteFoodEntries([]);
      setLockedFoods([]);
      setMappedFoods([]);
      return;
    }

    const { data, error } = await supabase.rpc(
      "get_available_favourite_foods",
      {
        p_food_ids: favourite_foods,
      },
    );

    if (error) {
      console.error("Error loading favourite foods:", error);
      return;
    }

    const foods = data as FoodData[] | null;

    if (foods && foods.length > 0) {
      setFavouriteFoodEntries(foods);
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
      } else {
        setMappedFoods([]);
      }
    } else {
      setFavouriteFoodEntries([]);
      setLockedFoods([]);
      setMappedFoods([]);
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

  const handleLikeFood = async (foodID: number) => {
    if (!userID) return;

    setLikesMutating(true);

    const updatedFavouriteFoods = favouriteFoods
      ? Array.from(new Set([...favouriteFoods, foodID]))
      : [foodID];

    const { error } = await supabase
      .from("account_settings")
      .update({ favourite_foods: updatedFavouriteFoods })
      .eq("id", userID)
      .select();

    if (error) {
      console.error("Error liking food:", error);
      setLikesMutating(false);
      return;
    }

    setFavouriteFoods(updatedFavouriteFoods);
    await getAvailableFavouriteFoods(updatedFavouriteFoods);
    await fetchSuggestedFoods(
      updatedFavouriteFoods,
      city,
      halal,
      vegan,
      vegetarian,
    );
    toast.success("Food added to your likes");
    setLikesMutating(false);
  };

  const handleUnlikeFood = async (foodID: number) => {
    if (!userID || !favouriteFoods) return;

    setLikesMutating(true);

    const updatedFavouriteFoods = favouriteFoods.filter((id) => id !== foodID);

    const { error } = await supabase
      .from("account_settings")
      .update({ favourite_foods: updatedFavouriteFoods })
      .eq("id", userID)
      .select();

    if (error) {
      console.error("Error unliking food:", error);
      setLikesMutating(false);
      return;
    }

    setFavouriteFoods(updatedFavouriteFoods);
    await getAvailableFavouriteFoods(updatedFavouriteFoods);
    await fetchSuggestedFoods(
      updatedFavouriteFoods,
      city,
      halal,
      vegan,
      vegetarian,
    );
    toast.success("Food removed from your likes");
    setLikesMutating(false);
  };

  useEffect(() => {
    fetchProfile();

    const handlePopState = () => {
      fetchProfile();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();

    setIsLoggingOut(false);

    if (error) {
      console.error("Logout failed", error);
    }

    window.location.reload();
  };

  const handleSuggestAgainDaysChange = async (days: number) => {
    const { data, error } = await supabase
      .from("account_settings")
      .update({
        suggest_again_days: days,
      })
      .eq("id", userID)
      .select();

    if (error) {
      console.error("Error updating suggest again days:", error);
    } else {
      setSuggestAgainDays(days);
      toast.success("Suggest Again Days updated successfully!");
    }
  };

  const handleSavePreferences = async (preferences: {
    city: string;
    dietaryRestrictions: string[];
    halal: boolean;
    vegan: boolean;
    vegetarian: boolean;
  }) => {
    if (!userID) return;

    const { data, error } = await supabase
      .from("account_settings")
      .update({
        city: preferences.city,
        dietary_restrictions: preferences.dietaryRestrictions,
        halal: preferences.halal,
        vegan: preferences.vegan,
        vegetarian: preferences.vegetarian,
        initial_userflow: true,
      })
      .eq("id", userID)
      .select();

    if (error) {
      console.error("Error updating preferences:", error);
    } else {
      setCity(preferences.city);
      setDietaryRestrictions(preferences.dietaryRestrictions);
      setHalal(preferences.halal);
      setVegan(preferences.vegan);
      setVegetarian(preferences.vegetarian);
      router.push("/initial-userflow");
      toast.success("Preferences saved successfully!");
    }
  };

  const reselectFavourites = async () => {
    router.push("/initial-userflow");
  };

  const onDeleteAccount = async () => {
    const { error } = await supabase
      .from("account_settings")
      .delete()
      .eq("id", userID);
    if (error) {
      console.error("Error deleting account:", error);
      toast.error("Error deleting account. Please try again.");
    } else {
      handleLogout();
    }
  };

  const handleSuggestionSubmit = async (suggestion: string) => {
    if (!userID) return;

    setLikesMutating(true);

    const { error } = await supabase.from("suggestions").insert({
      user_id: userID,
      name: suggestion,
    });

    if (error) {
      if (error.code === "P0001") {
        toast.error("Please wait before submitting another suggestion.");
      } else {
        console.error("Error submitting suggestion:", error);
        toast.error("Error submitting suggestion. Please try again.");
      }
    } else {
      toast.success("Suggestion submitted successfully!");
      startCooldown();
    }

    setLikesMutating(false);
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
              Food Decider (Beta)
            </h1>
            <p className="mt-1 text-xl text-slate-400">
              Can't decide your next meal? Let fate (and flavor) choose for you
              🍜✨
            </p>
          </div>
          {initStatus === "logged out" && (
            <div className="flex items-center gap-4">
              <Button
                asChild
                variant="green"
                className="mr-2 w-35 h-15 text-3xl"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button
                asChild
                variant="destructive"
                className="w-35 h-15 text-3xl"
              >
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
          {initStatus === "logged in" && (
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="green"
                className="w-30 h-15 text-3xl"
                onClick={() => setLikesModalOpen(true)}
              >
                Likes
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-15 h-15"
                onClick={() => setSettingsModalOpen(true)}
              >
                <HugeiconsIcon
                  icon={Settings02Icon}
                  strokeWidth={2}
                  size={30}
                  className="size-7.5"
                />
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="w-40 h-15 text-3xl"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                Logout
              </Button>
            </div>
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
            isTouch={isTouch}
          />

          {lockedFoods && lockedFoods.length > 0 && (
            <div className="w-full overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
              <div className="sticky top-0 z-10 flex h-11 items-center justify-center border-b border-emerald-500/20 bg-emerald-500/10 text-sm font-semibold text-emerald-400">
                Locked Foods ({lockedFoods.length})
              </div>
              <div className="overflow-x-auto">
                <div className="flex min-w-max flex-row gap-3 p-4">
                  {lockedFoods.map((entry) => (
                    <div
                      key={entry.id}
                      data-entry-id={entry.id}
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
      <LikesModal
        open={likesModalOpen}
        onClose={() => setLikesModalOpen(false)}
        favouriteFoods={favouriteFoodEntries}
        suggestions={suggestedFoods}
        onUnlike={handleUnlikeFood}
        onLike={handleLikeFood}
        onSuggestionSubmit={handleSuggestionSubmit}
        isMutating={likesMutating}
        secondsLeft={secondsLeft}
      />
      <SettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onSuggestAgainDaysChange={handleSuggestAgainDaysChange}
        onSavePreferences={handleSavePreferences}
        onReselectFavourites={reselectFavourites}
        onDeleteAccount={onDeleteAccount}
        initialCity={city}
        initialDietaryRestrictions={dietaryRestrictions}
        initialHalal={halal}
        initialVegan={vegan}
        initialVegetarian={vegetarian}
        initialSuggestAgainDays={suggestAgainDays}
      />
    </main>
  );
}

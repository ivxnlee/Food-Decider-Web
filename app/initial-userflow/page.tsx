"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SwipeDeck, {
  SwipeCardItem,
  HistoryEntry,
} from "../../components/swipe-deck";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function InitialUserflowPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [cards, setCards] = useState<SwipeCardItem[]>([]);
  const [userID, setUserID] = useState<string | null>(null);
  const [section, setSection] = useState<number>(1);
  const [likedFoods, setLikedFoods] = useState<number[]>([]);
  const [suggestAgainAfterDays, setSuggestAgainAfterDays] = useState<number>(4);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [initialUserflow, setInitialUserflow] = useState<boolean>(true);

  const fetchProfile = async () => {
    setInitialLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserID(user!.id);

    const { data: profile } = await supabase
      .from("account_settings")
      .select(
        "theme, country, dietary_restrictions, halal, vegan, vegetarian, initial_userflow",
      )
      .eq("id", user!.id)
      .single();

    setInitialUserflow(profile?.initial_userflow ?? true);

    let query = supabase
      .from("foods")
      .select("id, name, cuisine, desc, image_url")
      .contains("country", [profile?.country]);

    if (profile?.halal) {
      query = query.eq("halal", true);
    }
    if (profile?.vegan) {
      query = query.eq("vegan", true);
    }
    if (profile?.vegetarian) {
      query = query.eq("vegetarian", true);
    }

    if (
      profile?.dietary_restrictions &&
      profile.dietary_restrictions.length > 0
    ) {
      const restrictions = profile.dietary_restrictions.join(",");
      query = query.or(
        `gen_ingredients.is.null,gen_ingredients.not.ov.{${restrictions}}`,
      );
    }

    const { data: foods } = await query;

    if (foods && foods.length > 0) {
      setCards(
        foods.map((food) => ({
          id: food.id,
          name: food.name,
          cuisine: food.cuisine,
          desc: food.desc,
          image_url: food.image_url,
        })),
      );
    }
    setInitialLoading(false);
  };

  useEffect(() => {
    fetchProfile();

    const handlePopState = () => {
      fetchProfile();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSubmit = async (history: HistoryEntry[]) => {
    const tempLikedFoods = history
      .filter((entry) => entry.dir === "like")
      .map((entry) => entry.card.id);
    if (tempLikedFoods.length > 2) {
      setLikedFoods(tempLikedFoods);
      if (!initialUserflow) {
        handleCompleteIntUserflow(tempLikedFoods);
      } else {
        setSection(2);
      }
    } else {
      console.error("Please like at least 3 foods to proceed.");
    }
  };

  const handleCompleteIntUserflow = async (foods: number[]) => {
    setSubmitLoading(true);

    const updatePayload: Record<string, unknown> = {
      favourite_foods: foods,
    };

    if (initialUserflow) {
      updatePayload.initial_userflow = false;
      updatePayload.suggest_again_days = suggestAgainAfterDays;
    }

    const { data, error } = await supabase
      .from("account_settings")
      .update(updatePayload)
      .eq("id", userID)
      .select();

    if (error) {
      console.error("Error updating profile:", error);
      setSubmitLoading(false);
    } else {
      router.push("/");
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();

    setIsLoggingOut(false);

    if (error) {
      console.error("Logout failed", error);
    }

    router.push("/");
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <main className="bg-blue-100 dark:bg-[lab(2.75381%_0_0)] min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full min-h-[calc(100vh-2rem)] max-w-4xl">
        <div className="min-h-[calc(100vh-2rem)] bg-sky-100 dark:bg-black rounded-3xl shadow-lg shadow-black/40 p-8">
          <div className="flex items-start justify-between gap-4 mb-8 select-none">
            {section === 1 ? (
              <header>
                <h1 className="text-3xl font-semibold text-slate-800 dark:text-white">
                  Choose your favourites
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                  Swipe through the suggestions to build your personalized
                  experience.
                </p>
              </header>
            ) : (
              <header>
                <h1 className="text-3xl font-semibold text-slate-800 dark:text-white">
                  Finalize your preferences
                </h1>
              </header>
            )}

            <div className="flex items-center gap-2">
              {!initialUserflow && (
                <Button
                  type="button"
                  variant="blue"
                  size="xlg"
                  onClick={handleBackToHome}
                >
                  Back
                </Button>
              )}
              <Button
                type="button"
                variant="destructive"
                size="xlg"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Signing out…" : "Logout"}
              </Button>
            </div>
          </div>
          <section className="flex flex-col items-center gap-4">
            {section === 1 && (
              <SwipeDeck
                cards={cards}
                handleSubmit={handleSubmit}
                isInitialLoading={initialLoading}
              />
            )}
            {section === 2 && (
              <div className="w-full space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">
                    Suggest again frequency
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                    Choose how many days should pass before we suggest the same
                    food again.
                  </p>
                </div>
                <label className="flex w-full flex-col gap-2 text-sm text-slate-500 dark:text-slate-200">
                  <span>Suggest again after</span>
                  <select
                    value={suggestAgainAfterDays}
                    onChange={(event) =>
                      setSuggestAgainAfterDays(Number(event.target.value))
                    }
                    className="w-full rounded-2xl border border-blue-50 bg-blue-200 dark:border-slate-700 dark:bg-slate-950 px-4 py-3 text-slate-800 dark:text-white outline-none transition-colors focus:border-slate-500"
                  >
                    {[3, 4, 5, 6, 7].map((days) => (
                      <option key={days} value={days}>
                        {days} days
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="button"
                  variant="green"
                  className="w-full h-15 text-lg font-bold"
                  onClick={() => handleCompleteIntUserflow(likedFoods)}
                  style={{
                    padding: "10px 24px",
                  }}
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <>
                      <Spinner data-icon="inline-start" />
                      Processing...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

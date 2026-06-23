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

  const fetchProfile = async () => {
    setInitialLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserID(user!.id);

    const { data: profile } = await supabase
      .from("account_settings")
      .select(
        "theme, city, dietary_restrictions, halal, vegan, vegetarian, initial_userflow",
      )
      .eq("id", user!.id)
      .single();

    // Redirect to home if the user has already completed the initial user flow
    if (profile?.initial_userflow === false) {
      router.push("/");
      return;
    }

    let query = supabase
      .from("foods")
      .select("id, name, cuisine, desc, image_url")
      .contains("city", [profile?.city]);

    if (profile?.halal) {
      query = query.eq("halal", true);
    }
    if (profile?.vegan) {
      query = query.eq("vegan", true);
    }
    if (profile?.vegetarian) {
      query = query.eq("vegetarian", true);
    }

    const { data: foods } = await query;

    console.log("Foods:", foods); // Remove in production
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
  }, []);

  const handleSubmit = async (history: HistoryEntry[]) => {
    const tempLikedFoods = history
      .filter((entry) => entry.dir === "like")
      .map((entry) => entry.card.id);
    if (tempLikedFoods.length > 2) {
      setLikedFoods(tempLikedFoods);
      setSection(2);
    } else {
      console.error("Please like at least 3 foods to proceed.");
    }
  };

  const handleCompleteIntUserflow = async () => {
    setSubmitLoading(true);
    const { data, error } = await supabase
      .from("account_settings")
      .update({
        favourite_foods: likedFoods,
        initial_userflow: false,
        suggest_again_days: suggestAgainAfterDays,
      })
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

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ backgroundColor: "lab(2.75381% 0 0)" }}
    >
      <div className="w-full min-h-[calc(100vh-2rem)] max-w-4xl">
        <div className="min-h-[calc(100vh-2rem)] bg-black rounded-3xl shadow-lg shadow-black/40 p-8">
          <div className="flex items-start justify-between gap-4 mb-8">
            {section === 1 ? (
              <header>
                <h1 className="text-3xl font-semibold text-white">
                  Choose your favorites
                </h1>
                <p className="mt-2 text-sm text-slate-300 max-w-2xl">
                  Swipe through the suggestions to build your personalized
                  experience.
                </p>
              </header>
            ) : (
              <header>
                <h1 className="text-3xl font-semibold text-white">
                  Finalize your preferences
                </h1>
              </header>
            )}

            <Button
              type="button"
              variant="destructive"
              size="lg"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Signing out…" : "Logout"}
            </Button>
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
                  <h2 className="text-2xl font-semibold text-white">
                    Suggest again frequency
                  </h2>
                  <p className="mt-2 text-sm text-slate-300 max-w-2xl">
                    Choose how many days should pass before we suggest the same
                    food again.
                  </p>
                </div>
                <label className="flex w-full flex-col gap-2 text-sm text-slate-200">
                  <span>Suggest again after</span>
                  <select
                    value={suggestAgainAfterDays}
                    onChange={(event) =>
                      setSuggestAgainAfterDays(Number(event.target.value))
                    }
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition-colors focus:border-slate-500"
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
                  onClick={() => handleCompleteIntUserflow()}
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

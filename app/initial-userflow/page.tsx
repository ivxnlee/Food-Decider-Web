"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SwipeDeck, {
  SwipeCardItem,
  HistoryEntry,
} from "../../components/swipe-deck";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

export default function InitialUserflowPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [cards, setCards] = useState<SwipeCardItem[]>([]);
  const [userID, setUserID] = useState<string | null>(null);

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserID(user!.id);

    const { data: profile } = await supabase
      .from("account_settings")
      .select("theme, city, dietary_restrictions, halal, vegan, vegetarian")
      .eq("id", user!.id)
      .single();

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
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (history: HistoryEntry[]) => {
    const likedFoods = history
      .filter((entry) => entry.dir === "like")
      .map((entry) => entry.card.id);
    if (likedFoods.length > 2) {
      const { data, error } = await supabase
        .from("account_settings")
        .update({ favourite_foods: likedFoods, initial_userflow: false })
        .eq("id", userID)
        .select();

      if (error) {
        console.error("Error updating profile:", error);
      } else {
        router.push("/dashboard");
      }
    } else {
      console.error("Please like at least 3 foods to proceed.");
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
      <div className="w-full max-w-4xl">
        <div className="bg-black rounded-3xl shadow-lg shadow-black/40 border border-slate-800 p-8">
          <div className="flex items-start justify-between gap-4 mb-8">
            <header>
              <h1 className="text-3xl font-semibold text-white">
                Choose your favorites
              </h1>
              <p className="mt-2 text-sm text-slate-300 max-w-2xl">
                Swipe through the suggestions to build your personalized
                experience.
              </p>
            </header>
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
            <SwipeDeck cards={cards} handleSubmit={handleSubmit} />
          </section>
        </div>
      </div>
    </main>
  );
}

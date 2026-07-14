import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

interface FoodSummary {
  id: number;
  name: string;
  desc?: string;
  cuisine?: string[];
  image_url?: string;
}

interface LikesModalProps {
  open?: boolean;
  onClose: () => void;
  favouriteFoods: FoodSummary[];
  suggestions: FoodSummary[];
  onUnlike: (foodId: number) => Promise<void> | void;
  onLike: (foodId: number) => Promise<void> | void;
  onSuggestionSubmit: (suggestion: string) => Promise<void> | void;
  isMutating?: boolean;
  secondsLeft: number; // prop for cooldown seconds left
}

export function LikesModal({
  open = true,
  onClose,
  favouriteFoods,
  suggestions,
  onUnlike,
  onLike,
  onSuggestionSubmit,
  isMutating = false,
  secondsLeft,
}: LikesModalProps) {
  const [activeTab, setActiveTab] = useState<"likes" | "discover">("likes");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionText, setSuggestionText] = useState("");

  const hasNoLikes = favouriteFoods.length === 0;
  const hasSuggestions = suggestions.length > 0;

  useEffect(() => {
    if (!open) {
      setIsSuggesting(false);
      setSuggestionText("");
    }
  }, [open]);

  const tabButtonClass = (isActive: boolean, position: "left" | "right") =>
    `flex-1 px-4 py-3 text-sm font-semibold transition ${
      position === "left"
        ? "rounded-l-2xl rounded-r-none"
        : "rounded-r-2xl rounded-l-none"
    } ${
      isActive
        ? "bg-white text-black"
        : "bg-white/10 text-slate-300 hover:bg-white/20"
    }`;

  const handleSuggestSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!suggestionText.trim()) return;

    setSuggestionText("");
    setIsSuggesting(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative p-8 mx-4 w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-sky-100 dark:bg-black shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4 px-6 py-5">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">
              Your likes
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Keep your favourites close and discover more foods to love.
            </p>
          </div>
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <Button
              onClick={() => setIsSuggesting(true)}
              variant="green"
              size="xlg"
            >
              Suggest
            </Button>
            <Button onClick={onClose} variant="close" size="xlg">
              Close
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border-t border-white/10 bg-slate-950/80 p-6">
          <div className="flex overflow-hidden rounded-2xl bg-white/10 p-0">
            <button
              type="button"
              className={tabButtonClass(activeTab === "likes", "left")}
              onClick={() => setActiveTab("likes")}
            >
              Your likes
            </button>
            <button
              type="button"
              className={tabButtonClass(activeTab === "discover", "right")}
              onClick={() => setActiveTab("discover")}
            >
              Discover
            </button>
          </div>

          <div className="mt-5 h-105 space-y-3 overflow-y-auto pr-1">
            {isSuggesting ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Suggest a food
                    </h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Share a dish you’d like to see added.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsSuggesting(false)}
                    variant="brightdestructive"
                    size="xlg"
                  >
                    Back
                  </Button>
                </div>

                <form onSubmit={handleSuggestSubmit} className="mt-6 space-y-4">
                  <label className="block text-sm font-medium text-slate-200">
                    Food name
                    <input
                      type="text"
                      value={suggestionText}
                      onChange={(event) =>
                        setSuggestionText(event.target.value.slice(0, 30))
                      }
                      maxLength={30}
                      placeholder="e.g. Laksa"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500"
                    />
                  </label>

                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Keep it short and clear.</span>
                    <span>{suggestionText.length}/30</span>
                  </div>

                  <Button
                    type="submit"
                    variant="brightgreen"
                    className="w-full"
                    onClick={() => onSuggestionSubmit(suggestionText)}
                    disabled={
                      secondsLeft > 0 || !suggestionText.trim() || isMutating
                    }
                  >
                    {secondsLeft > 0
                      ? `Please wait ${secondsLeft}s`
                      : "Submit suggestion"}
                  </Button>
                </form>
              </div>
            ) : (
              <>
                {activeTab === "likes" && (
                  <>
                    {hasNoLikes ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
                        You have not liked any foods yet. Head to Discover tab
                        to start building your list.
                      </div>
                    ) : (
                      favouriteFoods.map((food) => (
                        <div
                          key={food.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {food.image_url && (
                              <img
                                src={food.image_url}
                                alt={food.name}
                                className="h-12 w-12 shrink-0 rounded-xl object-cover"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">
                                {food.name}
                              </p>
                              {food.cuisine && food.cuisine.length > 0 && (
                                <p className="truncate text-sm text-slate-400">
                                  {food.cuisine.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="brightdestructive"
                            size="lg"
                            onClick={() => onUnlike(food.id)}
                            disabled={isMutating || favouriteFoods.length <= 3}
                          >
                            Un-Like
                          </Button>
                        </div>
                      ))
                    )}
                  </>
                )}

                {activeTab === "discover" && (
                  <>
                    {!hasSuggestions ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
                        There are no new suggestions right now. Check back later
                        or suggest a food yourself!
                      </div>
                    ) : (
                      suggestions.map((food) => (
                        <div
                          key={food.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {food.image_url && (
                              <img
                                src={food.image_url}
                                alt={food.name}
                                className="h-12 w-12 shrink-0 rounded-xl object-cover"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">
                                {food.name}
                              </p>
                              {food.desc && (
                                <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                                  {food.desc}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="brightgreen"
                            size="lg"
                            onClick={() => onLike(food.id)}
                            disabled={isMutating}
                          >
                            Like
                          </Button>
                        </div>
                      ))
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

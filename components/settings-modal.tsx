import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings02Icon } from "@hugeicons/core-free-icons";

interface SettingsModalProps {
  /** Controlled visibility */
  open?: boolean;
  /** Called when backdrop is clicked */
  onClose: () => void;
  /** Optional action callbacks */
  onReselectFavourites?: () => void;
  onDeleteAccount?: () => void;
  onSuggestAgainDaysChange?: (days: number) => void;
  onSavePreferences?: (preferences: {
    city: string;
    dietaryRestrictions: string[];
    halal: boolean;
    vegan: boolean;
    vegetarian: boolean;
  }) => void;
  initialCity?: string;
  initialDietaryRestrictions?: string[];
  initialHalal?: boolean;
  initialVegan?: boolean;
  initialVegetarian?: boolean;
  initialSuggestAgainDays?: number;
}

export function SettingsModal({
  open = true,
  onClose,
  onReselectFavourites,
  onDeleteAccount,
  onSuggestAgainDaysChange,
  onSavePreferences,
  initialCity = "",
  initialDietaryRestrictions = [],
  initialHalal = false,
  initialVegan = false,
  initialVegetarian = false,
  initialSuggestAgainDays = 4,
}: SettingsModalProps) {
  const [tempSuggestAgainAfterDays, setTempSuggestAgainAfterDays] =
    useState<number>(initialSuggestAgainDays);
  const [cooldown, setCooldown] = useState<number>(0);
  const [section, setSection] = useState<string>("main");
  const [deleteConfirmed, setDeleteConfirmed] = useState<boolean>(false);
  const [city, setCity] = useState<string>(initialCity);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(
    initialDietaryRestrictions,
  );
  const [halal, setHalal] = useState<boolean>(initialHalal);
  const [vegan, setVegan] = useState<boolean>(initialVegan);
  const [vegetarian, setVegetarian] = useState<boolean>(initialVegetarian);

  useEffect(() => {
    if (!open) return;

    setCity(initialCity);
    setDietaryRestrictions(initialDietaryRestrictions);
    setHalal(initialHalal);
    setVegan(initialVegan);
    setVegetarian(initialVegetarian);
    setTempSuggestAgainAfterDays(initialSuggestAgainDays);
  }, [
    open,
    initialCity,
    initialDietaryRestrictions,
    initialHalal,
    initialVegan,
    initialVegetarian,
    initialSuggestAgainDays,
  ]);

  const allergyOptions = [
    "Shellfish",
    "Peanuts",
    "Fish",
    "Dairy",
    "Eggs",
    "Wheat",
    "Pork",
    "Beef",
    "Chicken",
    "Lamb",
  ];

  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = window.setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cooldown]);

  const handleSaveChanges = () => {
    if (cooldown > 0) return;

    onSuggestAgainDaysChange?.(tempSuggestAgainAfterDays);
    setCooldown(10);
  };

  const handleAllergyChange = (allergy: string, checked: boolean) => {
    if (checked) {
      setDietaryRestrictions([...dietaryRestrictions, allergy]);
    } else {
      setDietaryRestrictions(
        dietaryRestrictions.filter((item) => item !== allergy),
      );
    }
  };

  const handleSavePreferences = () => {
    onSavePreferences?.({
      city,
      dietaryRestrictions,
      halal,
      vegan,
      vegetarian,
    });
    setSection("main");
  };

  const handleDeleteAccount = () => {
    if (!deleteConfirmed) return;
    onDeleteAccount?.();
  };

  const handleClose = () => {
    setSection("main");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative bg-black rounded-lg shadow-xl p-8 max-w-md w-full mx-4 border border-white/10">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-base font-medium text-slate-200 transition hover:bg-white/20"
        >
          Close
        </button>
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <HugeiconsIcon
            icon={Settings02Icon}
            strokeWidth={2}
            size={30}
            className="size-7.5"
          />
          <h2 className="mt-4 text-2xl font-semibold text-white">Settings</h2>
          <p className="mt-2 text-sm text-slate-300 max-w-xs">
            Update your experience preferences and manage permanent account
            changes.
          </p>
        </div>

        {section === "main" && (
          <div className="mt-8 space-y-8">
            <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Suggest again frequency
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Choose how many days should pass before we suggest the same
                  food again after Lock In.
                </p>
              </div>

              <label className="flex w-full flex-col gap-2 text-sm text-slate-200">
                <span>Suggest again after</span>
                <select
                  value={tempSuggestAgainAfterDays}
                  onChange={(event) => {
                    const days = Number(event.target.value);
                    setTempSuggestAgainAfterDays(days);
                  }}
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
                variant="secondary"
                className="w-full justify-center"
                disabled={cooldown > 0}
                onClick={handleSaveChanges}
              >
                {cooldown > 0 ? `Save Changes (${cooldown}s)` : "Save Changes"}
              </Button>
            </section>

            <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Permanent account changes
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Update your city, re-select favourite foods, or delete your
                  account.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full justify-center"
                  onClick={() => setSection("change-pref")}
                >
                  Change city / Dietary preferences
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full justify-center"
                  onClick={onReselectFavourites}
                >
                  Re-select favourites
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full justify-center"
                  onClick={() => {
                    setDeleteConfirmed(false);
                    setSection("delete-account");
                  }}
                >
                  Delete account
                </Button>
              </div>
            </section>
          </div>
        )}

        {section === "change-pref" && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-white">
                Change preferences
              </h3>
              <Button
                type="button"
                variant="secondary"
                className="h-10 px-4"
                onClick={() => setSection("main")}
              >
                Back
              </Button>
            </div>

            <div className="space-y-5 rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  City
                </label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Singapore">Singapore</SelectItem>
                    <SelectItem value="Kuala Lumpur">Kuala Lumpur</SelectItem>
                    <SelectItem value="Bangkok">Bangkok</SelectItem>
                    <SelectItem value="Tokyo">Tokyo</SelectItem>
                    <SelectItem value="Seoul">Seoul</SelectItem>
                    <SelectItem value="Hong Kong">Hong Kong</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Food Exceptions
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {dietaryRestrictions.length === 0
                        ? "Select dietary restrictions..."
                        : `${dietaryRestrictions.length} selected`}
                      <span className="ml-2">▼</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {allergyOptions.map((allergy) => (
                      <div
                        key={allergy}
                        className="flex items-center space-x-2 px-2 py-1.5 cursor-pointer rounded-md hover:bg-foreground/10"
                        onClick={() =>
                          handleAllergyChange(
                            allergy,
                            !dietaryRestrictions.includes(allergy),
                          )
                        }
                      >
                        <Checkbox
                          id={allergy}
                          checked={dietaryRestrictions.includes(allergy)}
                          onCheckedChange={(checked) =>
                            handleAllergyChange(allergy, checked as boolean)
                          }
                        />
                        <label
                          htmlFor={allergy}
                          className="text-sm cursor-pointer flex-1"
                          onClick={(e) => {
                            e.preventDefault();
                            handleAllergyChange(
                              allergy,
                              !dietaryRestrictions.includes(allergy),
                            );
                          }}
                        >
                          {allergy}
                        </label>
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium text-white w-28">
                  Halal Only?
                </label>
                <Toggle
                  pressed={halal}
                  onPressedChange={setHalal}
                  className="flex-1 h-10 justify-center data-[state=on]:bg-sky-700 data-[state=off]:bg-slate-700 hover:data-[state=off]:bg-slate-600 text-white"
                >
                  {halal ? "Yes" : "No"}
                </Toggle>
              </div>
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium text-white w-28">
                  Vegan?
                </label>
                <Toggle
                  pressed={vegan}
                  onPressedChange={setVegan}
                  className="flex-1 h-10 justify-center data-[state=on]:bg-sky-700 data-[state=off]:bg-slate-700 hover:data-[state=off]:bg-slate-600 text-white"
                >
                  {vegan ? "Yes" : "No"}
                </Toggle>
              </div>
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium text-white w-28">
                  Vegetarian?
                </label>
                <Toggle
                  pressed={vegetarian}
                  onPressedChange={setVegetarian}
                  className="flex-1 h-10 justify-center data-[state=on]:bg-sky-700 data-[state=off]:bg-slate-700 hover:data-[state=off]:bg-slate-600 text-white"
                >
                  {vegetarian ? "Yes" : "No"}
                </Toggle>
              </div>

              <Button
                type="button"
                variant="green"
                className="w-full justify-center"
                onClick={handleSavePreferences}
              >
                Save preferences
              </Button>
            </div>
          </div>
        )}
        {section === "delete-account" && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-white">
                Delete account
              </h3>
              <Button
                type="button"
                variant="secondary"
                className="h-10 px-4"
                onClick={() => setSection("main")}
              >
                Back
              </Button>
            </div>

            <div className="space-y-5 rounded-3xl border border-white/10 bg-slate-950/80 p-6">
              <p className="text-sm text-slate-300">
                This action will permanently delete your account and cannot be
                undone.
              </p>
              <label className="flex items-center gap-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={deleteConfirmed}
                  onChange={(event) => setDeleteConfirmed(event.target.checked)}
                  className="h-5 w-5 rounded border-slate-700 bg-slate-950 text-slate-100 focus:ring-slate-500"
                />
                I understand this cannot be undone.
              </label>
              <Button
                type="button"
                variant="destructive"
                className="w-full justify-center"
                disabled={!deleteConfirmed}
                onClick={handleDeleteAccount}
              >
                Delete account permanently
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

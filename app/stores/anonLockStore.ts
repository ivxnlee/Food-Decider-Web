import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LockedFood {
  foodId: number;
  lockedAt: number;
}

interface AnonLockState {
  lockedFoods: LockedFood[];
  favouriteFoodIds: number[];
  country: string;
  lockFood: (foodId: number) => void;
  unlockFood: (foodId: number) => void;
  toggleFavourite: (foodId: number) => void;
  setCountry: (country: string) => void;
  clear: () => void;
}

export const useAnonLockStore = create<AnonLockState>()(
  persist(
    (set, get) => ({
      lockedFoods: [],
      favouriteFoodIds: [4, 5, 7, 8, 9, 15, 17],
      country: "Others",

      lockFood: (foodId) => {
        if (get().lockedFoods.some((f) => f.foodId === foodId)) return; // guard clause, no dupes
        set((state) => ({
          lockedFoods: [...state.lockedFoods, { foodId, lockedAt: Date.now() }],
        }));
      },

      unlockFood: (foodId) =>
        set((state) => ({
          lockedFoods: state.lockedFoods.filter((f) => f.foodId !== foodId),
        })),

      toggleFavourite: (foodId) =>
        set((state) => ({
          favouriteFoodIds: state.favouriteFoodIds.includes(foodId)
            ? state.favouriteFoodIds.filter((id) => id !== foodId)
            : [...state.favouriteFoodIds, foodId],
        })),

      setCountry: (country: string) => set({ country }),

      clear: () =>
        set({
          lockedFoods: [],
          favouriteFoodIds: [4, 5, 7, 8, 9, 15, 17],
          country: "Others",
        }),
    }),
    { name: "food-decider-anon-state" }, // localStorage key
  ),
);

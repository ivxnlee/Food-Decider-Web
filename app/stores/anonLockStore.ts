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
  countryHasSet: boolean;
  lockFood: (foodId: number) => void;
  unlockFood: (foodId: number) => void;
  likeFood: (foodId: number) => void;
  unlikeFood: (foodId: number) => void;
  setCountry: (country: string) => void;
  setCountryBoolean: (countryHasSet: boolean) => void;
  clear: () => void;
}

export const useAnonLockStore = create<AnonLockState>()(
  persist(
    (set, get) => ({
      lockedFoods: [],
      favouriteFoodIds: [4, 5, 7, 8, 9, 15, 17],
      country: "Others",
      countryHasSet: false,

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

      likeFood: (foodId) =>
        set((state) => ({
          favouriteFoodIds: state.favouriteFoodIds.includes(foodId)
            ? state.favouriteFoodIds
            : [...state.favouriteFoodIds, foodId],
        })),

      unlikeFood: (foodId) =>
        set((state) => ({
          favouriteFoodIds: state.favouriteFoodIds.filter(
            (id) => id !== foodId,
          ),
        })),

      setCountry: (country: string) => set({ country }),

      setCountryBoolean: (countryHasSet: boolean) => set({ countryHasSet }),

      clear: () =>
        set({
          lockedFoods: [],
          favouriteFoodIds: [4, 5, 7, 8, 9, 15, 17],
          country: "Others",
          countryHasSet: false,
        }),
    }),
    { name: "food-decider-anon-state" }, // localStorage key
  ),
);

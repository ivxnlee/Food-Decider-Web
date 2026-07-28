import { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { FoodModal } from "./food-modal";

// chance is kept for future weighting; all equal for now
export interface FoodItem {
  id: number;
  name: string;
  desc: string;
  cuisine: string[];
  image_url: string;
  chance: number;
}

const dummyFoods: FoodItem[] = [
  {
    id: 0,
    name: "Loading...",
    desc: "Loading...",
    cuisine: ["Loading..."],
    image_url: "/images/loading.jpg",
    chance: 0.1,
  },
];

const ITEM_WIDTH = 160;
const ITEM_GAP = 14;
const SLOT_WIDTH = ITEM_WIDTH + ITEM_GAP;
const TOTAL_ITEMS = 60;
const WINNING_INDEX = 50;

function pickItem(items: FoodItem[]): FoodItem {
  const total = items.reduce((sum, it) => sum + it.chance, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (const it of items) {
    acc += it.chance;
    if (r <= acc) return it;
  }
  return items[0];
}

function randomFiller(items: FoodItem[]): FoodItem {
  return items[Math.floor(Math.random() * items.length)];
}

interface FoodImageProps {
  item: FoodItem;
  size: number;
}

function FoodImage({ item, size }: FoodImageProps) {
  return item.image_url ? (
    <img
      src={item.image_url}
      alt={item.name}
      draggable={false}
      className="rounded-lg object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg bg-[#2a2a2e] text-xs text-[#777]"
      style={{ width: size, height: size }}
    >
      No image
    </div>
  );
}

interface FoodSpinnerProps {
  initStatus: string;
  lockIn: (
    foodID: number,
    onSuccess?: (() => void) | undefined,
  ) => Promise<void>;
  lockLoading: boolean;
  isTouch: boolean;
  items?: FoodItem[];
  dummyItems?: FoodItem[];
  onResult?: (item: FoodItem) => void;
}

export default function FoodSpinner({
  initStatus,
  lockIn,
  lockLoading,
  isTouch,
  items = dummyFoods,
  dummyItems = dummyFoods,
  onResult,
}: FoodSpinnerProps) {
  const [reelItems, setReelItems] = useState<FoodItem[]>(
    () => Array.from({ length: TOTAL_ITEMS }, () => dummyItems[0]), // deterministic placeholder, matches on server & client
  );

  useEffect(() => {
    let newItems = dummyItems;
    if (items && items.length > 0) {
      newItems = items;
    }

    if (newItems && newItems.length > 0 && newItems !== dummyItems) {
      setReelItems(
        Array.from({ length: TOTAL_ITEMS }, () => randomFiller(newItems)),
      );
    }
  }, [items, initStatus]);

  const [translateX, setTranslateX] = useState(0);
  const [transition, setTransition] = useState("none");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<FoodItem | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const spin = () => {
    setSpinning(true);
    setResult(null);

    let tempItems = dummyItems;
    if (items && items.length > 0) {
      tempItems = items;
    }

    const winningItem = pickItem(tempItems);
    const newItems: FoodItem[] = Array.from({ length: TOTAL_ITEMS }, (_, i) =>
      i === WINNING_INDEX ? winningItem : randomFiller(tempItems),
    );

    setTransition("none");
    setTranslateX(0);
    setReelItems(newItems);

    requestAnimationFrame(() => {
      const wrapperWidth = wrapperRef.current?.clientWidth ?? 680;
      const centerOffset = wrapperWidth / 2 - ITEM_WIDTH / 2;
      const jitter =
        Math.floor(Math.random() * (SLOT_WIDTH * 0.7)) - SLOT_WIDTH * 0.35;
      const target = -(WINNING_INDEX * SLOT_WIDTH) + centerOffset - jitter;

      requestAnimationFrame(() => {
        setTransition("transform 5.5s cubic-bezier(0.12, 0.74, 0.1, 1)");
        setTranslateX(target);
      });
    });

    setTimeout(() => {
      setResult(winningItem);
      setSpinning(false);
      onResult?.(winningItem);
    }, 5600);
  };

  return (
    <div className="mx-auto w-[-webkit-fill-available] max-w-170 font-sans">
      <div
        ref={wrapperRef}
        className="relative h-55 w-full overflow-hidden rounded-xl border border-slate-300 bg-sky-100 dark:border-black dark:bg-black"
      >
        {/* Center marker */}
        <div className="absolute top-0 bottom-0 left-1/2 z-5 w-0.5 -translate-x-1/2 bg-red-500 dark:bg-red-800" />

        {/* Add Loading indicator before reelItems are fully loaded */}
        {/* Reel */}
        <div
          className="absolute top-0 left-0 flex h-full will-change-transform"
          style={{
            transform: `translateX(${translateX}px)`,
            transition,
          }}
        >
          {reelItems.map((item, i) => (
            <div
              key={i}
              className="my-3.75 mx-1.75 flex h-47.5 flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border bg-mist-300 dark:border-[#2e2e33] dark:bg-[#1f1f23]"
              style={{ flex: `0 0 ${ITEM_WIDTH}px` }}
            >
              <FoodImage item={item} size={140} />
              <span className="px-2 text-center text-[13px] leading-[1.3] font-medium text-slate-800 dark:text-[#e8e8ea] select-none">
                {item.name}
              </span>
            </div>
          ))}
        </div>

        {/* Edge fades */}
        <div className="absolute top-0 bottom-0 left-0 z-4 w-15 bg-linear-to-r from-slate-300 dark:from-black to-transparent" />
        <div className="absolute top-0 bottom-0 right-0 z-4 w-15 bg-linear-to-l from-slate-300 dark:from-black to-transparent" />
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          onClick={spin}
          disabled={
            spinning || initStatus === "loading" || items === dummyFoods
          }
          className="h-15 w-40 text-3xl"
        >
          SPIN
        </Button>
      </div>

      <FoodModal
        open={Boolean(result)}
        onClose={() => setResult(null)}
        icon={
          <div className="text-2xl leading-none" aria-hidden="true">
            🍽️
          </div>
        }
        title={result?.name ?? "Your food choice"}
        previewContent={
          result ? (
            <div className="flex items-center justify-center">
              <FoodImage item={result} size={280} />
            </div>
          ) : null
        }
        description={
          result ? (
            <div className="space-y-2 text-left">
              <p className=" line-clamp-5 overflow-y-auto">{result.desc}</p>
              <p className="text-sm text-slate-400 mt-2">
                Cuisine: {result.cuisine.join(", ")}
              </p>
            </div>
          ) : (
            ""
          )
        }
        action={{
          label: lockLoading ? "Processing..." : "Lock In",
          onClick: () => result && lockIn(result.id, () => setResult(null)),
          className: "w-full",
          disabled:
            initStatus === "loading" || lockLoading || items === dummyFoods,
          isTouch: isTouch,
          lockLoading: lockLoading,
          initStatus: initStatus,
          tooltipText:
            "Login to save your choice across devices and get dining recommendations!",
        }}
        secondaryAction={{
          label: "Close",
          onClick: () => setResult(null),
          className: "w-full",
          disabled: lockLoading,
        }}
      />
    </div>
  );
}

import { useState, useRef, type CSSProperties, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/modal";

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

const FOODS: FoodItem[] = [
  {
    id: 8,
    name: "Pizza",
    desc: "Pizza is a beloved, globally popular dish consisting of a flattened disk of bread dough topped with savory ingredients. It typically features a rich, tomato-based sauce and melted cheese (like mozzarella) baked quickly in a hot oven, customized with various meats, vegetables, and herbs.",
    cuisine: ["Italian"],
    image_url: "/images/pizza.jpg",
    chance: 0.1,
  },
  {
    id: 5,
    name: "Sushi",
    desc: "Sushi is a traditional Japanese dish centered around vinegared medium-grain rice. It is paired with a variety of ingredients, such as raw or cooked seafood, vegetables, and egg, and is often wrapped in dried seaweed.",
    cuisine: ["Japanese"],
    image_url: "/images/sushi.jpg",
    chance: 0.1,
  },
  {
    id: 9,
    name: "Hotpot",
    desc: "Hot pot is an interactive, communal dining experience where diners sit around a simmering pot of flavored broth and cook their own raw ingredients at the table.",
    cuisine: ["Chinese"],
    image_url: "/images/hotpot.jpg",
    chance: 0.1,
  },
  {
    id: 4,
    name: "Pasta",
    desc: "Pasta dishes are typically categorized by their defining sauce and regional origins. They are often paired with specific shapes—such as long ribbons or hollow tubes—to best complement the sauce's texture.",
    cuisine: ["Italian"],
    image_url: "/images/pasta.jpg",
    chance: 0.1,
  },
  {
    id: 17,
    name: "Burger",
    desc: "A burger is a sandwich featuring a savory ground meat patty—most commonly beef—pan-fried or grilled, and nestled inside a sliced bun. It is typically layered with melted cheese, fresh vegetables, and condiments like lettuce, tomatoes, onions, bacon, pickles, mayonnaise, and mustard.",
    cuisine: ["American"],
    image_url: "/images/burger.jpg",
    chance: 0.1,
  },
  {
    id: 7,
    name: "Ramen",
    desc: "Ramen is a beloved Japanese noodle soup consisting of wheat noodles served in a savory, umami-rich broth, paired with various meats and vegetables.",
    cuisine: ["Japanese"],
    image_url: "/images/ramen.jpg",
    chance: 0.1,
  },
  {
    id: 15,
    name: "Steak",
    desc: "high-quality beef taken from the hindquarters of the animal, typically cut into thick slices that are cooked by grilling or frying.",
    cuisine: ["American"],
    image_url: "/images/steak.jpg",
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
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        borderRadius: 8,
        flexShrink: 0,
      }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: "#2a2a2e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "#777",
        fontSize: 12,
      }}
    >
      No image
    </div>
  );
}

interface FoodSpinnerProps {
  loggedIn: string;
  lockIn: (
    foodID: number,
    onSuccess?: (() => void) | undefined,
  ) => Promise<void>;
  lockLoading: boolean;
  items?: FoodItem[];
  dummyItems?: FoodItem[];
  onResult?: (item: FoodItem) => void;
}

export default function FoodSpinner({
  loggedIn,
  lockIn,
  lockLoading,
  items = dummyFoods,
  dummyItems = dummyFoods,
  onResult,
}: FoodSpinnerProps) {
  const [reelItems, setReelItems] = useState<FoodItem[]>(
    () => Array.from({ length: TOTAL_ITEMS }, () => dummyItems[0]), // deterministic placeholder, matches on server & client
  );

  useEffect(() => {
    let newItems = dummyItems;
    if (loggedIn === "logged out") {
      newItems = FOODS;
    } else if (loggedIn === "logged in" && items && items.length > 0) {
      newItems = items;
    }

    if (newItems && newItems.length > 0 && newItems !== dummyItems) {
      setReelItems(
        Array.from({ length: TOTAL_ITEMS }, () => randomFiller(newItems)),
      );
    }
  }, [items, loggedIn]);

  const [translateX, setTranslateX] = useState(0);
  const [transition, setTransition] = useState("none");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<FoodItem | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const spin = () => {
    setSpinning(true);
    setResult(null);

    let tempItems = dummyItems;
    if (loggedIn === "logged out") {
      tempItems = FOODS;
    } else if (loggedIn === "logged in" && items && items.length > 0) {
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

  const edgeFadeLeft: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 60,
    background: "linear-gradient(to right, #18181b, transparent)",
    zIndex: 4,
  };

  const edgeFadeRight: CSSProperties = {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 60,
    background: "linear-gradient(to left, #18181b, transparent)",
    zIndex: 4,
  };

  return (
    <div
      style={{
        width: "-webkit-fill-available",
        maxWidth: 680,
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <div
        ref={wrapperRef}
        style={{
          position: "relative",
          width: "100%",
          height: 220,
          overflow: "hidden",
          background: "#18181b",
          borderRadius: 12,
          border: "1px solid #2e2e33",
        }}
      >
        {/* Center marker */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 2,
            background: "#ffb84d",
            transform: "translateX(-1px)",
            zIndex: 5,
          }}
        />
        {/* Add Loading indicator before reelItems are fully loaded */}
        {/* Reel */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            transform: `translateX(${translateX}px)`,
            transition,
            willChange: "transform",
          }}
        >
          {reelItems.map((item, i) => (
            <div
              key={i}
              style={{
                flex: `0 0 ${ITEM_WIDTH}px`,
                height: 190,
                margin: "15px 7px",
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "#1f1f23",
                border: "1px solid #2e2e33",
                overflow: "hidden",
              }}
            >
              <FoodImage item={item} size={140} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  textAlign: "center",
                  padding: "0 8px",
                  lineHeight: 1.3,
                  color: "#e8e8ea",
                  userSelect: "none",
                }}
              >
                {item.name}
              </span>
            </div>
          ))}
        </div>

        {/* Edge fades */}
        <div style={edgeFadeLeft} />
        <div style={edgeFadeRight} />
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
        <Button
          onClick={spin}
          disabled={spinning || loggedIn === "loading"}
          className="w-40 h-15 text-3xl"
        >
          SPIN
        </Button>
      </div>

      <Modal
        open={Boolean(result)}
        onClose={() => setResult(null)}
        icon={
          <div className="text-3xl" aria-hidden="true">
            🍽️
          </div>
        }
        title={result?.name ?? "Your food choice"}
        description={
          result ? (
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-center">
                <FoodImage item={result} size={180} />
              </div>
              <div>
                <p>{result.desc}</p>
                <p className="text-sm text-slate-400 mt-2">
                  Cuisine: {result.cuisine.join(", ")}
                </p>
              </div>
            </div>
          ) : (
            ""
          )
        }
        action={{
          label: lockLoading ? "Processing..." : "Lock In",
          onClick: () => result && lockIn(result.id, () => setResult(null)),
          className: "w-full",
          disabled: loggedIn !== "logged in" || lockLoading,
          tooltipText:
            "Login to save your choice and get personalized recommendations!",
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

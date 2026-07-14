import { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Represents a single card item in the swipe deck
export interface SwipeCardItem {
  id: number;
  name: string;
  cuisine: string[];
  desc: string;
  image_url?: string;
}

// Direction type for swipe actions: "like" (right) or "pass" (left)
export type Direction = "like" | "pass";

// Props configuration for the SwipeDeck component
interface SwipeDeckProps {
  cards?: SwipeCardItem[];
  onSwipe?: (card: SwipeCardItem, dir: Direction) => void;
  onDeckEmpty?: () => void;
  renderCard?: (card: SwipeCardItem) => React.ReactNode;
  disableActions?: boolean;
  disableUndo?: boolean;
  isInitialLoading?: boolean;
  handleSubmit: (history: HistoryEntry[]) => void;
}

// Records a card action for undo functionality
export interface HistoryEntry {
  card: SwipeCardItem;
  dir: Direction;
}

// Minimum horizontal distance (pixels) to trigger a swipe action
const SWIPE_THRESHOLD = 100;
// Degree of rotation applied per pixel of horizontal movement
const ROTATION_FACTOR = 0.12;

// Default card shown if no cards are provided
const DEFAULT_CARDS: SwipeCardItem[] = [
  {
    id: 0,
    name: "Nasi Lemak",
    cuisine: ["Malaysian", "Singaporean"],
    desc: "A traditional Malaysian dish consisting of rice cooked in coconut milk and pandan leaves",
  },
];

// Color definitions for card backgrounds based on swipe direction.
// These are applied imperatively (via el.style) during pointer-drag, so they
// stay as plain values rather than Tailwind classes — the drag handler needs
// to paint every frame without waiting on a React re-render.
const SWIPE_COLORS = {
  like: "#0c3316", // Green for right swipe
  likelight: "oklch(96.2% 0.044 156.743)", // Green for right swipe (light mode)
  pass: "#330c0c", // Red for left swipe
  passlight: "oklch(93.6% 0.032 17.717)", // Red for left swipe (light mode)
  default: "#1a1a1a", // Dark background
  defaultlight: "oklch(96% 0.002 17.2)", // White background for light mode
};

// Card dimensions, expressed as Tailwind breakpoints instead of JS-computed
// pixel values. Mirrors the old isMobile/isTablet/isDesktop steps.
const CARD_SIZE_CLASSES =
  "w-[min(300px,calc(100vw-2rem))] h-[460px] sm:w-[350px] sm:h-[520px] lg:w-[400px] lg:h-[580px]";

// "Like ♥" / "Nope ✕" indicator badge shown while dragging
function SwipeIndicator({
  side,
  innerRef,
}: {
  side: "left" | "right";
  innerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const isRight = side === "right";
  return (
    <div
      ref={innerRef}
      className={`absolute top-5 ${isRight ? "right-5" : "left-5"} rounded-full border px-3.5 py-1.5 text-sm font-medium opacity-0 pointer-events-none transition-opacity duration-75 ${
        isRight
          ? "bg-[#eaf3de] text-[#3b6d11] border-[#97c459]"
          : "bg-[#fcebeb] text-[#a32d2d] border-[#f09595]"
      }`}
    >
      {isRight ? "Like ♥" : "Nope ✕"}
    </div>
  );
}

// A single liked/remaining/disliked counter in the stats row
function StatBox({
  label,
  value,
  isLoading,
}: {
  label: "liked" | "remaining" | "disliked";
  value: number;
  isLoading?: boolean;
}) {
  const color =
    label === "liked"
      ? "text-[#4caf50]"
      : label === "disliked"
        ? "text-[#f44336]"
        : "text-slate-800 dark:text-white";
  return (
    <div className="flex flex-col items-center text-center select-none">
      {isLoading ? (
        <Skeleton className="h-8 w-10 rounded bg-slate-700" />
      ) : (
        <div className={`text-[18px] sm:text-[22px] font-medium ${color}`}>
          {value}
        </div>
      )}
      <div className="mt-0.5 text-[10px] sm:text-xs text-slate-800 dark:text-white">
        {label}
      </div>
    </div>
  );
}

// Default rendering for card content (food name and description)
// Can be overridden with custom renderCard prop
function defaultCardContent(card: SwipeCardItem): React.ReactNode {
  const imageUrl = card.image_url || "/placeholder.jpg";

  return (
    <div className="flex h-full w-full flex-col items-center gap-3 px-4 py-5">
      <img
        src={imageUrl}
        alt={card.name}
        draggable={false}
        className="w-50 h-50 sm:w-60 sm:h-60 lg:w-70 lg:h-70 shrink-0 rounded-2xl object-cover shadow-md"
      />
      <div className="select-none text-center text-base sm:text-lg font-bold leading-tight text-slate-800 dark:text-white">
        {card.name}
      </div>
      {card.cuisine && card.cuisine.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {card.cuisine.slice(0, 2).map((c) => (
            <span
              key={c}
              className="rounded-full bg-black/10 dark:bg-white/15 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-[#e0e0e0] select-none"
            >
              {c}
            </span>
          ))}
        </div>
      )}
      <div className="line-clamp-3 select-none text-center text-xs sm:text-[13px] leading-snug text-slate-700 dark:text-[#d0d0d0]">
        {card.desc}
      </div>
    </div>
  );
}

// Main SwipeDeck component - displays a Tinder-like card swiping interface
export default function SwipeDeck({
  cards = DEFAULT_CARDS,
  onSwipe,
  onDeckEmpty,
  renderCard,
  disableActions = false,
  disableUndo = false,
  isInitialLoading,
  handleSubmit,
}: SwipeDeckProps) {
  // Current remaining cards in the deck
  const [stack, setStack] = useState<SwipeCardItem[]>(cards);
  // History of swiped cards for undo functionality
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  // Count of cards liked by user
  const [liked, setLiked] = useState(0);
  // Count of cards passed by user
  const [disliked, setDisliked] = useState(0);
  // Reference to the top card's imperative swipe function
  const topCardSwipeRef = useRef<((isRight: boolean) => void) | null>(null);

  // Reset deck when new cards are provided
  useEffect(() => {
    setStack(cards);
    setHistory([]);
    setLiked(0);
    setDisliked(0);
  }, [cards]);

  // Handle swipe action: update history, increment counters, remove card, trigger callback
  const handleSwipe = useCallback(
    (card: SwipeCardItem, dir: Direction) => {
      // Record the action in history for undo
      setHistory((h) => [...h, { card, dir }]);
      // Update like/pass counters
      if (dir === "like") setLiked((n) => n + 1);
      else setDisliked((n) => n + 1);
      // Remove swiped card from stack
      setStack((s) => {
        const nextStack = s.filter((c) => c.id !== card.id);
        // Trigger onDeckEmpty callback when last card is swiped
        if (nextStack.length === 0) {
          onDeckEmpty?.();
        }
        return nextStack;
      });
      // Trigger onSwipe callback with card and direction
      onSwipe?.(card, dir);
    },
    [onSwipe, onDeckEmpty],
  );

  // Trigger swipe animation on top card via button clicks
  // isRight: true for "like", false for "pass"
  const programmaticSwipe = useCallback((isRight: boolean) => {
    topCardSwipeRef.current?.(isRight);
  }, []);

  // Undo the last swipe action: restore card to stack and decrement counter
  const undo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    // Decrement the appropriate counter
    if (last.dir === "like") setLiked((n) => n - 1);
    else setDisliked((n) => n - 1);
    // Re-add card to stack
    setStack((s) => [...s, last.card]);
  }, [history]);

  // Reset the deck to initial state
  const restart = useCallback(() => {
    setStack(cards);
    setHistory([]);
    setLiked(0);
    setDisliked(0);
  }, [cards]);

  // Determine which render function to use for card content
  const renderCardContent = (card: SwipeCardItem) =>
    renderCard ? renderCard(card) : defaultCardContent(card);

  return (
    <div className="flex w-full flex-col items-center px-2 py-4 sm:px-4 sm:py-8 font-sans">
      {/* Statistics section: liked count, remaining cards, passed count */}
      <div className="mb-4 sm:mb-6 flex flex-wrap sm:flex-nowrap gap-6 sm:gap-8">
        <StatBox label="liked" value={liked} isLoading={isInitialLoading} />
        <StatBox
          label="remaining"
          value={stack.length}
          isLoading={isInitialLoading}
        />
        <StatBox
          label="disliked"
          value={disliked}
          isLoading={isInitialLoading}
        />
      </div>

      {/* Card deck: renders cards in stack with depth-based positioning and layering */}
      {stack.length > 0 || isInitialLoading ? (
        <div className={`relative mx-auto ${CARD_SIZE_CLASSES}`}>
          {isInitialLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl bg-white/5 p-6">
              <Skeleton className="h-64 w-[calc(100%-2rem)] rounded-3xl bg-slate-800" />
              <Skeleton className="h-7 w-3/4 bg-slate-700" />
              <Skeleton className="h-5 w-1/2 bg-slate-700" />
              <Skeleton className="h-5 w-5/6 bg-slate-700" />
            </div>
          ) : (
            stack.map((card, idx) => {
              const isTop = idx === stack.length - 1;
              // Calculate depth for visual layering (cards behind the top card)
              const depth = stack.length - 1 - idx;
              return (
                <TopCardRef
                  key={card.id}
                  card={card}
                  depth={depth}
                  isTop={isTop}
                  onSwipe={handleSwipe}
                  swipeRef={isTop ? topCardSwipeRef : undefined}
                  renderCard={renderCardContent}
                />
              );
            })
          )}
        </div>
      ) : (
        <div className="mx-auto flex h-115 sm:h-130 lg:h-145 w-[min(300px,calc(100vw-2rem))] sm:w-87.5 lg:w-100 flex-col items-center justify-center gap-3 text-white">
          {/* List of liked foods */}
          {liked > 0 && (
            <div className="mb-4 max-h-[40%] w-full overflow-auto rounded-xl border border-emerald-900 bg-emerald-950/90 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <div className="sticky top-0 flex h-7.5 items-center justify-center bg-emerald-950 text-sm font-semibold text-[#4caf50]">
                Liked Foods ({liked})
              </div>
              <div className="flex flex-col gap-2 p-4 pt-0">
                {history
                  .filter((entry) => entry.dir === "like")
                  .map((entry, idx) => (
                    <div
                      key={`${entry.card.id}-${idx}`}
                      className="rounded-lg bg-white/10 px-3 py-2 text-sm text-[#e0e0e0]"
                    >
                      <div className="font-semibold">{entry.card.name}</div>
                      {entry.card.cuisine && entry.card.cuisine.length > 0 && (
                        <div className="mt-1 text-xs text-[#b0b0b0]">
                          {entry.card.cuisine.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
          {history.length > 0 && (
            <>
              <div className="text-2xl whitespace-nowrap text-slate-800 dark:text-white">
                {liked > 2 ? "Complete!" : "Minimum of 3 likes required!"}
              </div>
              <Button
                onClick={restart}
                className="h-15 w-50 text-lg font-bold px-6 py-2.5"
              >
                Start Over
              </Button>
              {liked > 2 && (
                <Button
                  variant="green"
                  className="h-15 w-50 text-lg font-bold px-6 py-2.5"
                  onClick={() => handleSubmit(history)}
                >
                  Continue
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* Control buttons: Pass, Undo, Like */}
      {/* Buttons are disabled when no cards remain in deck */}
      <div
        className={`mt-4 sm:mt-6 flex flex-wrap sm:flex-nowrap justify-center gap-4 sm:gap-6 ${
          stack.length === 0 || isInitialLoading
            ? "pointer-events-none opacity-30"
            : "opacity-100"
        }`}
      >
        {/* Pass button: swipe left */}
        <Button
          onClick={() => programmaticSwipe(false)}
          size="icon"
          variant="ghost"
          title="Pass"
          className="h-11 w-11 sm:h-13 sm:w-13 rounded-full bg-red-500/15 text-lg sm:text-xl shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:bg-red-500/35 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
        >
          ✕
        </Button>
        {/* Undo button: undo last swipe */}
        <Button
          onClick={undo}
          size="icon"
          variant="ghost"
          title="Undo"
          className="h-11 w-11 sm:h-13 sm:w-13 rounded-full bg-white/15 text-lg sm:text-xl shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:bg-white/25 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
        >
          ↩
        </Button>
        {/* Like button: swipe right */}
        <Button
          onClick={() => programmaticSwipe(true)}
          size="icon"
          variant="ghost"
          title="Like"
          className="h-11 w-11 sm:h-13 sm:w-13 rounded-full bg-green-500/15 text-lg sm:text-xl shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:bg-green-500/35 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
        >
          ♥
        </Button>
      </div>
    </div>
  );
}

// Individual swipeable card component
// Handles pointer events and animations for single cards
// Exposes a flyOut function via ref for programmatic swipes
function TopCardRef({
  card,
  depth,
  isTop,
  onSwipe,
  swipeRef,
  renderCard,
}: {
  card: SwipeCardItem;
  depth: number;
  isTop: boolean;
  onSwipe: (card: SwipeCardItem, dir: Direction) => void;
  swipeRef?: React.MutableRefObject<((isRight: boolean) => void) | null>;
  renderCard?: (card: SwipeCardItem) => React.ReactNode;
}) {
  const { theme } = useTheme();
  // DOM reference to the card element
  const cardRef = useRef<HTMLDivElement>(null);
  // Track if user is currently dragging
  const dragging = useRef(false);
  // Initial touch/pointer position
  const startX = useRef(0);
  const startY = useRef(0);
  // Current offset during drag
  const curX = useRef(0);
  const curY = useRef(0);
  // References to "Like" and "Nope" indicator elements
  const likeRef = useRef<HTMLDivElement>(null);
  const nopeRef = useRef<HTMLDivElement>(null);

  // Calculate visual scaling for depth (cards behind are smaller)
  const scale = 1 - depth * 0.04;
  // Calculate vertical offset for depth (cards behind are lower)
  const yOff = depth * 10;

  // Animate card flying off screen and trigger swipe callback
  // isRight: true = like (right), false = pass (left)
  const flyOut = useCallback(
    (isRight: boolean) => {
      const el = cardRef.current;
      if (!el) return;
      // Calculate exit distance based on the card's actual rendered width,
      // so it stays correct across every breakpoint without needing the
      // width passed down as a prop.
      const exitDistance = el.getBoundingClientRect().width + 200;
      // Apply the like/pass background color — during a drag this is already
      // set frame-by-frame in onPointerMove, but a button-triggered swipe
      // skips straight to flyOut, so it needs to be set here too.
      el.style.backgroundColor = isRight
        ? theme === "dark"
          ? SWIPE_COLORS.like
          : SWIPE_COLORS.likelight
        : theme === "dark"
          ? SWIPE_COLORS.pass
          : SWIPE_COLORS.passlight;
      // Apply exit animation
      el.style.transition = "transform 0.35s ease-in, opacity 0.35s ease-in";
      el.style.transform = `translate(${isRight ? exitDistance : -exitDistance}px, -60px) rotate(${isRight ? 30 : -30}deg)`;
      el.style.opacity = "0";
      // Trigger callback after animation completes
      setTimeout(() => onSwipe(card, isRight ? "like" : "pass"), 350);
    },
    [card, onSwipe],
  );

  // Expose flyOut function to parent component via ref
  if (swipeRef) swipeRef.current = flyOut;

  // Handle pointer down: start drag tracking
  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    curX.current = 0;
    curY.current = 0;
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  // Handle pointer move: update card position and indicator opacity during drag
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    // Calculate offset from starting position
    curX.current = e.clientX - startX.current;
    curY.current = e.clientY - startY.current;
    const el = cardRef.current;
    if (!el) return;
    // Disable transition during drag for smooth movement
    el.style.transition = "none";
    // Apply transform: translate and rotate based on horizontal movement
    el.style.transform = `translate(${curX.current}px, ${curY.current}px) rotate(${curX.current * ROTATION_FACTOR}deg)`;
    // Apply background color based on swipe direction
    el.style.backgroundColor =
      curX.current > 0
        ? theme === "dark"
          ? SWIPE_COLORS.like
          : SWIPE_COLORS.likelight
        : theme === "dark"
          ? SWIPE_COLORS.pass
          : SWIPE_COLORS.passlight;
    // Calculate indicator opacity based on distance (max at SWIPE_THRESHOLD)
    const ratio = Math.min(Math.abs(curX.current) / SWIPE_THRESHOLD, 1);
    // Show "Like" indicator when dragging right
    if (likeRef.current)
      likeRef.current.style.opacity = curX.current > 0 ? String(ratio) : "0";
    // Show "Nope" indicator when dragging left
    if (nopeRef.current)
      nopeRef.current.style.opacity = curX.current < 0 ? String(ratio) : "0";
  };

  // Handle pointer up: commit or revert swipe action
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    // Hide indicators
    if (likeRef.current) likeRef.current.style.opacity = "0";
    if (nopeRef.current) nopeRef.current.style.opacity = "0";
    // Check if swipe exceeded threshold
    if (Math.abs(curX.current) >= SWIPE_THRESHOLD) {
      // Trigger fly-out animation and swipe callback
      flyOut(curX.current > 0);
    } else {
      // Reset card position with spring animation
      const el = cardRef.current;
      if (el) {
        el.style.transition =
          "transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275)";
        el.style.transform = "translate(0,0) rotate(0deg)";
        el.style.backgroundColor =
          theme === "dark" ? SWIPE_COLORS.default : SWIPE_COLORS.defaultlight;
      }
    }
  };

  return (
    <div
      ref={cardRef}
      // Only attach pointer events to top card (isTop)
      onPointerDown={isTop ? onPointerDown : undefined}
      onPointerMove={isTop ? onPointerMove : undefined}
      onPointerUp={isTop ? onPointerUp : undefined}
      // background-color is set imperatively during drag (see above), so it's
      // left out of the className and applied once via inline style here.
      style={{
        backgroundColor:
          theme === "dark" ? SWIPE_COLORS.default : SWIPE_COLORS.defaultlight,
        transform: `translateY(${yOff}px) scale(${scale})`,
        zIndex: isTop ? 10 : 10 - depth,
        // touch-action must stay inline — required for pointer-drag to work
        // reliably on touch devices, and it's not something className can set.
        touchAction: "none",
      }}
      className={`absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-3xl select-none ${
        isTop
          ? "cursor-grab shadow-[0_10px_40px_rgba(0,0,0,0.15)]"
          : "cursor-default shadow-[0_5px_20px_rgba(0,0,0,0.08)] transition-transform duration-300"
      }`}
    >
      {/* "Like ♥" / "Nope ✕" indicators - appears while dragging */}
      <SwipeIndicator side="right" innerRef={likeRef} />
      <SwipeIndicator side="left" innerRef={nopeRef} />
      {/* Card content: rendered via the renderCard function (pre-configured in SwipeDeck) */}
      {renderCard && renderCard(card)}
    </div>
  );
}

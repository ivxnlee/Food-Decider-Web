import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";

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

// Hook to track responsive screen size
function useResponsiveSize() {
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    // Set initial width
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
    }

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return useMemo(() => {
    const isMobile = windowWidth < 640;
    const isTablet = windowWidth >= 640 && windowWidth < 1024;
    const isDesktop = windowWidth >= 1024;

    return {
      isMobile,
      isTablet,
      isDesktop,
      windowWidth,
      // Card dimensions
      cardWidth: isMobile
        ? Math.min(300, windowWidth - 32)
        : isTablet
          ? 350
          : 400,
      cardHeight: isMobile ? 460 : isTablet ? 520 : 580,
      // Image dimensions
      imageSize: isMobile ? 200 : isTablet ? 240 : 280,
      // Button sizes
      buttonSize: isMobile ? 44 : 52,
      // Font sizes
      statFontSize: isMobile ? 18 : 22,
      statLabelFontSize: isMobile ? 10 : 12,
      cardNameFontSize: isMobile ? 16 : 18,
      cardDescFontSize: isMobile ? 12 : 13,
      // Spacing
      padding: isMobile ? "1rem 0.5rem" : "2rem 1rem",
      gapStats: isMobile ? 24 : 32,
      gapButtons: isMobile ? 16 : 24,
      marginBottomStats: isMobile ? "1rem" : "1.5rem",
      marginTopButtons: isMobile ? "1rem" : "1.5rem",
    };
  }, [windowWidth]);
}

// Default card shown if no cards are provided
const DEFAULT_CARDS: SwipeCardItem[] = [
  {
    id: 0,
    name: "Nasi Lemak",
    cuisine: ["Malaysian", "Singaporean"],
    desc: "A traditional Malaysian dish consisting of rice cooked in coconut milk and pandan leaves",
  },
];

// Color definitions for card backgrounds based on swipe direction
const SWIPE_COLORS = {
  like: "#0c3316", // Green for right swipe
  pass: "#330c0c", // Red for left swipe
  default: "#1a1a1a", // Dark background
};

// Creates styling for "Like" and "Nope" indicator badges that appear when swiping
// side: "left" for "Nope ✕", "right" for "Like ♥"
function indicatorStyle(side: "left" | "right"): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    top: 20,
    fontSize: 14,
    fontWeight: 500,
    padding: "6px 14px",
    borderRadius: 999,
    opacity: 0,
    pointerEvents: "none",
    transition: "opacity 0.05s",
  };
  if (side === "right") {
    return {
      ...base,
      right: 20,
      background: "#eaf3de",
      color: "#3b6d11",
      border: "1.5px solid #97c459",
    };
  }
  return {
    ...base,
    left: 20,
    background: "#fcebeb",
    color: "#a32d2d",
    border: "1.5px solid #f09595",
  };
}

// Default rendering for card content (food name and description)
// Can be overridden with custom renderCard prop
function defaultCardContent(
  card: SwipeCardItem,
  imageSize: number,
  cardNameFontSize: number,
  cardDescFontSize: number,
): React.ReactNode {
  const imageUrl = card.image_url || "/placeholder.jpg";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        width: "100%",
        height: "100%",
        padding: "20px 16px",
      }}
    >
      <img
        src={imageUrl}
        alt={card.name}
        draggable={false}
        style={{
          width: imageSize,
          height: imageSize,
          borderRadius: 16,
          objectFit: "cover",
          flexShrink: 0,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      />
      <div
        style={{
          fontSize: cardNameFontSize,
          fontWeight: 700,
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {card.name}
      </div>
      {card.cuisine && card.cuisine.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {card.cuisine.slice(0, 2).map((c) => (
            <span
              key={c}
              style={{
                fontSize: cardDescFontSize - 1,
                padding: "4px 10px",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                color: "#e0e0e0",
                borderRadius: 999,
                fontWeight: 500,
              }}
            >
              {c}
            </span>
          ))}
        </div>
      )}
      <div
        style={{
          fontSize: cardDescFontSize,
          color: "#d0d0d0",
          textAlign: "center",
          lineHeight: 1.4,
          overflow: "hidden",
          display: "-webkit-box",
        }}
      >
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
  // Track which button is being hovered (if any)
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  // Get responsive sizing values
  const sizing = useResponsiveSize();

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
  const programmaticSwipe = useCallback(
    (isRight: boolean) => {
      if (stack.length === 0) return;
      const card = stack[stack.length - 1];
      topCardSwipeRef.current?.(isRight);
    },
    [stack],
  );

  // Reference to the topCardSwipeRef function in TopCardRef component
  const topCardSwipeRef = useRef<((isRight: boolean) => void) | null>(null);

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
    renderCard
      ? renderCard(card)
      : defaultCardContent(
          card,
          sizing.imageSize,
          sizing.cardNameFontSize,
          sizing.cardDescFontSize,
        );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: sizing.padding,
        fontFamily: "sans-serif",
        width: "100%",
      }}
    >
      {/* Statistics section: liked count, remaining cards, passed count */}
      <div
        style={{
          display: "flex",
          gap: sizing.gapStats,
          marginBottom: sizing.marginBottomStats,
          flexWrap: sizing.isMobile ? "wrap" : "nowrap",
        }}
      >
        {[
          ["liked", liked],
          ["remaining", stack.length],
          ["disliked", disliked],
        ].map(([label, val]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: sizing.statFontSize,
                fontWeight: 500,
                color:
                  label === "liked"
                    ? "#4caf50"
                    : label === "disliked"
                      ? "#f44336"
                      : "#fff",
              }}
            >
              {val}
            </div>
            <div
              style={{
                fontSize: sizing.statLabelFontSize,
                color: "#fff",
                marginTop: 2,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Card deck: renders cards in stack with depth-based positioning and layering */}
      {stack.length > 0 ? (
        <div
          style={{
            position: "relative",
            width: sizing.cardWidth,
            height: sizing.cardHeight,
            margin: "0 auto",
          }}
        >
          {stack.map((card, idx) => {
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
                cardWidth={sizing.cardWidth}
                cardHeight={sizing.cardHeight}
              />
            );
          })}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            height: sizing.cardHeight,
            width: sizing.cardWidth,
            color: "#fff",
            margin: "0 auto",
          }}
        >
          {/* List of liked foods */}
          {liked > 0 && (
            <div
              style={{
                width: "100%",
                marginBottom: 16,
                backgroundColor: "rgba(76, 175, 80, 0.1)",
                borderRadius: 12,
                border: "1px solid rgba(76, 175, 80, 0.3)",
                maxHeight: "40%",
                overflow: "auto",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#4caf50",
                  marginBottom: 12,
                  position: "sticky",
                  top: 0,
                  backgroundColor: "rgba(76, 175, 80, 0.1)",
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Liked Foods ({liked})
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "16px",
                  paddingTop: 0,
                }}
              >
                {history
                  .filter((entry) => entry.dir === "like")
                  .map((entry, idx) => (
                    <div
                      key={`${entry.card.id}-${idx}`}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderRadius: 8,
                        fontSize: 14,
                        color: "#e0e0e0",
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{entry.card.name}</div>
                      {entry.card.cuisine && entry.card.cuisine.length > 0 && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#b0b0b0",
                            marginTop: 4,
                          }}
                        >
                          {entry.card.cuisine.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
          <div style={{ fontSize: 28, textWrap: "nowrap" }}>
            {liked > 2 ? "Complete!" : "Minimum of 3 likes required!"}
          </div>
          <Button
            onClick={restart}
            onMouseEnter={() => setHoveredButton("restart")}
            onMouseLeave={() => setHoveredButton(null)}
            className="w-50 h-15 text-lg font-bold"
            style={{
              padding: "10px 24px",
            }}
          >
            Start Over
          </Button>
          {liked > 2 && (
            <Button
              variant="green"
              className="w-50 h-15 text-lg font-bold"
              onClick={() => handleSubmit(history)}
              style={{
                padding: "10px 24px",
              }}
            >
              Continue
            </Button>
          )}
        </div>
      )}

      {/* Control buttons: Pass, Undo, Like */}
      {/* Buttons are disabled when no cards remain in deck */}
      <div
        style={{
          display: "flex",
          gap: sizing.gapButtons,
          marginTop: sizing.marginTopButtons,
          opacity: stack.length === 0 ? 0.3 : 1,
          pointerEvents: stack.length === 0 ? "none" : "auto",
          flexWrap: sizing.isMobile ? "wrap" : "nowrap",
          justifyContent: "center",
        }}
      >
        {/* Pass button: swipe left */}
        <Button
          onClick={() => programmaticSwipe(false)}
          onMouseEnter={() => setHoveredButton("pass")}
          onMouseLeave={() => setHoveredButton(null)}
          size="icon"
          variant="ghost"
          style={{
            width: sizing.buttonSize,
            height: sizing.buttonSize,
            borderRadius: sizing.buttonSize / 2,
            background:
              hoveredButton === "pass"
                ? "rgba(255, 0, 0, 0.35)"
                : "rgba(255, 0, 0, 0.15)",
            fontSize: sizing.isMobile ? 18 : 22,
            boxShadow:
              hoveredButton === "pass"
                ? "0 4px 12px rgba(0, 0, 0, 0.2)"
                : "0 2px 8px rgba(0, 0, 0, 0.12)",
          }}
          title="Pass"
        >
          ✕
        </Button>
        {/* Undo button: undo last swipe */}
        <Button
          onClick={undo}
          onMouseEnter={() => setHoveredButton("undo")}
          onMouseLeave={() => setHoveredButton(null)}
          size="icon"
          variant="ghost"
          style={{
            width: sizing.buttonSize,
            height: sizing.buttonSize,
            borderRadius: sizing.buttonSize / 2,
            background:
              hoveredButton === "undo"
                ? "rgba(255, 255, 255, 0.25)"
                : "rgba(255, 255, 255, 0.15)",
            fontSize: sizing.isMobile ? 18 : 22,
            boxShadow:
              hoveredButton === "undo"
                ? "0 4px 12px rgba(0, 0, 0, 0.2)"
                : "0 2px 8px rgba(0, 0, 0, 0.12)",
          }}
          title="Undo"
        >
          ↩
        </Button>
        {/* Like button: swipe right */}
        <Button
          onClick={() => programmaticSwipe(true)}
          onMouseEnter={() => setHoveredButton("like")}
          onMouseLeave={() => setHoveredButton(null)}
          size="icon"
          variant="ghost"
          style={{
            width: sizing.buttonSize,
            height: sizing.buttonSize,
            borderRadius: sizing.buttonSize / 2,
            background:
              hoveredButton === "like"
                ? "rgba(0, 255, 0, 0.35)"
                : "rgba(0, 255, 0, 0.15)",
            fontSize: sizing.isMobile ? 18 : 22,
            boxShadow:
              hoveredButton === "like"
                ? "0 4px 12px rgba(0, 0, 0, 0.2)"
                : "0 2px 8px rgba(0, 0, 0, 0.12)",
          }}
          title="Like"
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
  cardWidth,
  cardHeight,
}: {
  card: SwipeCardItem;
  depth: number;
  isTop: boolean;
  onSwipe: (card: SwipeCardItem, dir: Direction) => void;
  swipeRef?: React.MutableRefObject<((isRight: boolean) => void) | null>;
  renderCard?: (card: SwipeCardItem) => React.ReactNode;
  cardWidth: number;
  cardHeight: number;
}) {
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
      // Calculate exit distance based on card width for responsive behavior
      const exitDistance = cardWidth + 200;
      // Apply exit animation
      el.style.transition = "transform 0.35s ease-in, opacity 0.35s ease-in";
      el.style.transform = `translate(${isRight ? exitDistance : -exitDistance}px, -60px) rotate(${isRight ? 30 : -30}deg)`;
      el.style.opacity = "0";
      // Trigger callback after animation completes
      setTimeout(() => onSwipe(card, isRight ? "like" : "pass"), 350);
    },
    [card, onSwipe, cardWidth],
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
      curX.current > 0 ? SWIPE_COLORS.like : SWIPE_COLORS.pass;
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
        el.style.backgroundColor = SWIPE_COLORS.default;
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
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 24,
        border: "2px solid white",
        background: SWIPE_COLORS.default,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        // Only top card is draggable
        cursor: isTop ? "grab" : "default",
        touchAction: "none",
        willChange: "transform",
        // Top card visible on top, other cards layered behind
        zIndex: isTop ? 10 : 10 - depth,
        // Apply depth transform: scale and vertical offset
        transform: `translateY(${yOff}px) scale(${scale})`,
        // Only animate non-top cards (e.g., when top card is removed)
        transition: isTop ? "none" : "transform 0.3s ease",
        userSelect: "none",
        boxShadow: isTop
          ? "0 10px 40px rgba(0, 0, 0, 0.15)"
          : "0 5px 20px rgba(0, 0, 0, 0.08)",
        overflow: "hidden",
      }}
    >
      {/* "Like ♥" indicator - appears on right swipe */}
      <div ref={likeRef} style={indicatorStyle("right")}>
        Like ♥
      </div>
      {/* "Nope ✕" indicator - appears on left swipe */}
      <div ref={nopeRef} style={indicatorStyle("left")}>
        Nope ✕
      </div>
      {/* Card content: rendered via the renderCard function (pre-configured in SwipeDeck) */}
      {renderCard && renderCard(card)}
    </div>
  );
}

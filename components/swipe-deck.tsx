import { useState, useRef, useCallback, useEffect } from "react";

export interface SwipeCardItem {
  id: number;
  food: string;
  cuisine: string[];
  desc: string;
}

export type Direction = "like" | "pass";

interface SwipeDeckProps {
  cards?: SwipeCardItem[];
  onSwipe?: (card: SwipeCardItem, dir: Direction) => void;
  onDeckEmpty?: () => void;
  renderCard?: (card: SwipeCardItem) => React.ReactNode;
  disableActions?: boolean;
  disableUndo?: boolean;
}

const SWIPE_THRESHOLD = 100;
const ROTATION_FACTOR = 0.12;

const DEFAULT_CARDS: SwipeCardItem[] = [
  {
    id: 0,
    food: "Nasi Lemak",
    cuisine: ["Malaysian", "Singaporean"],
    desc: "A traditional Malaysian dish consisting of rice cooked in coconut milk and pandan leaves",
  },
];

interface HistoryEntry {
  card: SwipeCardItem;
  dir: Direction;
}

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

function defaultCardContent(card: SwipeCardItem): React.ReactNode {
  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 500, color: "#111" }}>
        {card.food}
      </div>
      <div style={{ fontSize: 13, color: "#888" }}>{card.desc}</div>
    </>
  );
}

export default function SwipeDeck({
  cards = DEFAULT_CARDS,
  onSwipe,
  onDeckEmpty,
  renderCard,
  disableActions = false,
  disableUndo = false,
}: SwipeDeckProps) {
  const [stack, setStack] = useState<SwipeCardItem[]>(cards);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [liked, setLiked] = useState(0);
  const [passed, setPassed] = useState(0);

  useEffect(() => {
    setStack(cards);
    setHistory([]);
    setLiked(0);
    setPassed(0);
  }, [cards]);

  const handleSwipe = useCallback(
    (card: SwipeCardItem, dir: Direction) => {
      setHistory((h) => [...h, { card, dir }]);
      if (dir === "like") setLiked((n) => n + 1);
      else setPassed((n) => n + 1);
      setStack((s) => {
        const nextStack = s.filter((c) => c.id !== card.id);
        if (nextStack.length === 0) {
          onDeckEmpty?.();
        }
        return nextStack;
      });
      onSwipe?.(card, dir);
    },
    [onSwipe, onDeckEmpty],
  );

  const programmaticSwipe = useCallback(
    (isRight: boolean) => {
      if (stack.length === 0) return;
      const card = stack[stack.length - 1];
      topCardSwipeRef.current?.(isRight);
    },
    [stack],
  );

  const topCardSwipeRef = useRef<((isRight: boolean) => void) | null>(null);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    if (last.dir === "like") setLiked((n) => n - 1);
    else setPassed((n) => n - 1);
    setStack((s) => [...s, last.card]);
  }, [history]);

  const restart = useCallback(() => {
    setStack(cards);
    setHistory([]);
    setLiked(0);
    setPassed(0);
  }, [cards]);

  const renderCardContent = (card: SwipeCardItem) =>
    renderCard ? renderCard(card) : defaultCardContent(card);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1rem",
        fontFamily: "sans-serif",
      }}
    >
      {/* stats */}
      <div style={{ display: "flex", gap: 32, marginBottom: "1.5rem" }}>
        {[
          ["liked", liked],
          ["remaining", stack.length],
          ["passed", passed],
        ].map(([label, val]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: "#111" }}>
              {val}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* deck */}
      {stack.length > 0 ? (
        <div style={{ position: "relative", width: 300, height: 400 }}>
          {stack.map((card, idx) => {
            const isTop = idx === stack.length - 1;
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
            height: 400,
            width: 300,
            color: "#888",
          }}
        >
          <div style={{ fontSize: 15 }}>That's the whole deck!</div>
          <button onClick={restart} style={btnStyle(999)}>
            Start over
          </button>
        </div>
      )}

      {/* controls */}
      <div
        style={{
          display: "flex",
          gap: 24,
          marginTop: "1.5rem",
          opacity: stack.length === 0 ? 0.3 : 1,
          pointerEvents: stack.length === 0 ? "none" : "auto",
        }}
      >
        <button
          onClick={() => programmaticSwipe(false)}
          style={btnStyle(50)}
          title="Pass"
        >
          ✕
        </button>
        <button onClick={undo} style={btnStyle(50)} title="Undo">
          ↩
        </button>
        <button
          onClick={() => programmaticSwipe(true)}
          style={btnStyle(50)}
          title="Like"
        >
          ♥
        </button>
      </div>
    </div>
  );
}

function btnStyle(borderRadius: number): React.CSSProperties {
  return {
    width: borderRadius === 50 ? 52 : "auto",
    height: borderRadius === 50 ? 52 : "auto",
    padding: borderRadius === 999 ? "8px 20px" : undefined,
    borderRadius,
    border: "0.5px solid #ccc",
    background: "#fff",
    fontSize: borderRadius === 50 ? 22 : 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

// Wrapper that exposes a swipe trigger via ref
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
  const cardRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const curX = useRef(0);
  const curY = useRef(0);
  const likeRef = useRef<HTMLDivElement>(null);
  const nopeRef = useRef<HTMLDivElement>(null);

  const scale = 1 - depth * 0.04;
  const yOff = depth * 10;

  const flyOut = useCallback(
    (isRight: boolean) => {
      const el = cardRef.current;
      if (!el) return;
      el.style.transition = "transform 0.35s ease-in, opacity 0.35s ease-in";
      el.style.transform = `translate(${isRight ? 600 : -600}px, -60px) rotate(${isRight ? 30 : -30}deg)`;
      el.style.opacity = "0";
      setTimeout(() => onSwipe(card, isRight ? "like" : "pass"), 350);
    },
    [card, onSwipe],
  );

  if (swipeRef) swipeRef.current = flyOut;

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    curX.current = 0;
    curY.current = 0;
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    curX.current = e.clientX - startX.current;
    curY.current = e.clientY - startY.current;
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = `translate(${curX.current}px, ${curY.current}px) rotate(${curX.current * ROTATION_FACTOR}deg)`;
    const ratio = Math.min(Math.abs(curX.current) / SWIPE_THRESHOLD, 1);
    if (likeRef.current)
      likeRef.current.style.opacity = curX.current > 0 ? String(ratio) : "0";
    if (nopeRef.current)
      nopeRef.current.style.opacity = curX.current < 0 ? String(ratio) : "0";
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (likeRef.current) likeRef.current.style.opacity = "0";
    if (nopeRef.current) nopeRef.current.style.opacity = "0";
    if (Math.abs(curX.current) >= SWIPE_THRESHOLD) {
      flyOut(curX.current > 0);
    } else {
      const el = cardRef.current;
      if (el) {
        el.style.transition =
          "transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275)";
        el.style.transform = "translate(0,0) rotate(0deg)";
      }
    }
  };

  return (
    <div
      ref={cardRef}
      onPointerDown={isTop ? onPointerDown : undefined}
      onPointerMove={isTop ? onPointerMove : undefined}
      onPointerUp={isTop ? onPointerUp : undefined}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 16,
        border: "0.5px solid rgba(0,0,0,0.12)",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        cursor: isTop ? "grab" : "default",
        touchAction: "none",
        willChange: "transform",
        zIndex: isTop ? 10 : 10 - depth,
        transform: `translateY(${yOff}px) scale(${scale})`,
        transition: isTop ? "none" : "transform 0.3s ease",
        userSelect: "none",
      }}
    >
      <div ref={likeRef} style={indicatorStyle("right")}>
        Like ♥
      </div>
      <div ref={nopeRef} style={indicatorStyle("left")}>
        Nope ✕
      </div>
      {renderCard ? renderCard(card) : defaultCardContent(card)}
    </div>
  );
}

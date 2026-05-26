"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

const COLS = 24;
const ROWS = 18;
const INITIAL_LENGTH = 4;
const TICK_MS = 110;

type Point = { x: number; y: number };
type Dir = "up" | "down" | "left" | "right";
type Phase = "idle" | "playing" | "paused" | "over";

const DIR_VECTORS: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

function startingSnake(): Point[] {
  const midY = Math.floor(ROWS / 2);
  const midX = Math.floor(COLS / 2);
  return Array.from({ length: INITIAL_LENGTH }, (_, i) => ({
    x: midX - i,
    y: midY,
  }));
}

// Deterministic seed used during SSR so the markup matches the first client
// render. The real food is repositioned in an effect on mount.
const INITIAL_FOOD: Point = { x: COLS - 4, y: Math.floor(ROWS / 2) };

function randomFood(occupied: Point[]): Point {
  const taken = new Set(occupied.map((p) => `${p.x},${p.y}`));
  while (true) {
    const candidate = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
    if (!taken.has(`${candidate.x},${candidate.y}`)) return candidate;
  }
}

export default function SnakeGame() {
  const [snake, setSnake] = useState<Point[]>(startingSnake);
  const [food, setFood] = useState<Point>(INITIAL_FOOD);

  // Randomize the food position only after hydration to avoid SSR mismatch.
  useEffect(() => {
    setFood((f) => (f === INITIAL_FOOD ? randomFood(startingSnake()) : f));
  }, []);
  const [dir, setDir] = useState<Dir>("right");
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = usePersistedBest("snake");

  // Refs let the interval and key handlers read the latest state without
  // re-binding on every tick.
  const dirRef = useRef<Dir>(dir);
  const queuedDirRef = useRef<Dir | null>(null);
  const phaseRef = useRef<Phase>(phase);

  useEffect(() => {
    dirRef.current = dir;
  }, [dir]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const reset = useCallback(() => {
    const fresh = startingSnake();
    setSnake(fresh);
    setFood(randomFood(fresh));
    setDir("right");
    dirRef.current = "right";
    queuedDirRef.current = null;
    setScore(0);
    setPhase("playing");
  }, []);

  const togglePause = useCallback(() => {
    setPhase((p) => (p === "playing" ? "paused" : p === "paused" ? "playing" : p));
  }, []);

  const tick = useCallback(() => {
    setSnake((prev) => {
      const queued = queuedDirRef.current;
      if (queued && queued !== OPPOSITE[dirRef.current]) {
        dirRef.current = queued;
        setDir(queued);
      }
      queuedDirRef.current = null;

      const v = DIR_VECTORS[dirRef.current];
      const head = prev[0];
      const next: Point = { x: head.x + v.x, y: head.y + v.y };

      const hitsWall =
        next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS;
      const eats = next.x === food.x && next.y === food.y;
      const body = eats ? prev : prev.slice(0, -1);
      const hitsSelf = body.some((p) => p.x === next.x && p.y === next.y);

      if (hitsWall || hitsSelf) {
        setPhase("over");
        setBest((b) => Math.max(b, score));
        return prev;
      }

      const moved = [next, ...body];

      if (eats) {
        setScore((s) => {
          const ns = s + 1;
          setBest((b) => Math.max(b, ns));
          return ns;
        });
        setFood(randomFood(moved));
      }

      return moved;
    });
  }, [food.x, food.y, score]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase, tick]);

  const applyDirection = useCallback(
    (mapped: Dir) => {
      if (phaseRef.current === "idle") {
        dirRef.current = mapped;
        setDir(mapped);
        setPhase("playing");
        return;
      }
      if (phaseRef.current === "playing") {
        if (mapped !== OPPOSITE[dirRef.current]) {
          queuedDirRef.current = mapped;
        }
      }
    },
    [],
  );

  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const onBoardPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    touchStartRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  }, []);
  const onBoardPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      const SWIPE_MIN = 18;
      if (adx < SWIPE_MIN && ady < SWIPE_MIN) {
        if (phaseRef.current === "over") {
          reset();
        } else if (phaseRef.current === "idle") {
          setPhase("playing");
        } else {
          togglePause();
        }
        return;
      }
      const mapped: Dir = adx > ady ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
      applyDirection(mapped);
    },
    [applyDirection, reset, togglePause],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key;
      const mapped: Dir | null =
        k === "ArrowUp" || k === "w" || k === "W"
          ? "up"
          : k === "ArrowDown" || k === "s" || k === "S"
            ? "down"
            : k === "ArrowLeft" || k === "a" || k === "A"
              ? "left"
              : k === "ArrowRight" || k === "d" || k === "D"
                ? "right"
                : null;

      if (mapped) {
        e.preventDefault();
        applyDirection(mapped);
        return;
      }

      if (k === " " || k === "Spacebar") {
        e.preventDefault();
        if (phaseRef.current === "over") {
          reset();
        } else if (phaseRef.current === "idle") {
          setPhase("playing");
        } else {
          togglePause();
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reset, togglePause, applyDirection]);

  const headKey = `${snake[0].x},${snake[0].y}`;
  const bodyKeys = new Set(snake.slice(1).map((p) => `${p.x},${p.y}`));
  const foodKey = `${food.x},${food.y}`;

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <div
          onPointerDown={onBoardPointerDown}
          onPointerUp={onBoardPointerUp}
          onPointerCancel={() => (touchStartRef.current = null)}
          className="relative w-full min-w-[360px] max-w-[640px] border border-line bg-surface touch-none select-none"
          style={{ aspectRatio: `${COLS} / ${ROWS}`, touchAction: "none" }}
        >
          <div
            className="grid h-full w-full"
            style={{
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: ROWS * COLS }).map((_, i) => {
              const x = i % COLS;
              const y = Math.floor(i / COLS);
              const key = `${x},${y}`;
              const isHead = key === headKey;
              const isBody = bodyKeys.has(key);
              const isFood = key === foodKey;
              const bg = isHead
                ? "#22c55e"
                : isBody
                  ? "rgba(34,197,94,0.6)"
                  : isFood
                    ? "#ef4444"
                    : undefined;
              return (
                <div
                  key={i}
                  className="border-[0.5px] border-line/30"
                  style={{ background: bg }}
                />
              );
            })}
          </div>

          {phase !== "playing" && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-[2px]">
              <p className="font-serif text-4xl tracking-tight">
                {phase === "idle"
                  ? "Press any key"
                  : phase === "paused"
                    ? "Paused"
                    : "Game over"}
              </p>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {phase === "over"
                  ? "Space to restart"
                  : "Arrow keys · WASD · Space to pause"}
              </p>
            </div>
          )}
        </div>

        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Arrows or WASD to steer · Swipe on the board · Space or tap to {phase === "over" ? "restart" : "pause"}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line">
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Score
            </p>
            <p className="mt-3 font-serif text-6xl">{score}</p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Best
            </p>
            <p className="mt-3 font-serif text-6xl text-accent">{best}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {phase === "playing" ? (
            <button
              type="button"
              onClick={togglePause}
              className="border border-line px-6 py-3 font-serif text-2xl text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Pause
            </button>
          ) : phase === "paused" ? (
            <button
              type="button"
              onClick={togglePause}
              className="border border-accent bg-accent/10 px-6 py-3 font-serif text-2xl text-accent transition-colors hover:bg-accent/20"
            >
              Resume
            </button>
          ) : (
            <button
              type="button"
              onClick={reset}
              className="border border-accent bg-accent/10 px-6 py-3 font-serif text-2xl text-accent transition-colors hover:bg-accent/20"
            >
              {phase === "idle" ? "Start" : "New game"}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2 border border-line p-6 text-sm text-muted">
          <p className="font-mono text-xs uppercase tracking-[0.2em]">
            How to play
          </p>
          <p className="mt-2">
            Eat the pale square to grow. Don&apos;t cross your own body, and
            don&apos;t hit the walls.
          </p>
          <p>One point per bite. Game ends on collision.</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

const WIDTH = 360;
const HEIGHT = 560;
const LANES = 3;
const LANE_W = WIDTH / LANES;
const PLAYER_H = 40;
const PLAYER_W = 28;
const PLAYER_Y = HEIGHT - 90;
const TICK_MS = 16;
const BASE_SPEED = 3.2;

type Obstacle = {
  lane: number;
  y: number;
  kind: "train" | "barrier";
};
type Phase = "idle" | "playing" | "over";

function makeObstacle(yStart: number): Obstacle {
  return {
    lane: Math.floor(Math.random() * LANES),
    y: yStart,
    kind: Math.random() < 0.55 ? "train" : "barrier",
  };
}

export default function SubwaySurfersGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = usePersistedBest("subway-surfers");
  const [, force] = useState(0);

  const laneRef = useRef(1);
  const jumpRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const distRef = useRef(0);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const reset = useCallback(() => {
    laneRef.current = 1;
    jumpRef.current = 0;
    obstaclesRef.current = [
      makeObstacle(-100),
      makeObstacle(-280),
      makeObstacle(-460),
    ];
    distRef.current = 0;
    setScore(0);
    setPhase("playing");
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      const speed = BASE_SPEED + Math.min(4, distRef.current / 4000);
      distRef.current += speed;

      // Decay jump.
      if (jumpRef.current > 0) jumpRef.current = Math.max(0, jumpRef.current - 1);

      // Move obstacles down.
      for (const o of obstaclesRef.current) o.y += speed;
      obstaclesRef.current = obstaclesRef.current.filter((o) => o.y < HEIGHT + 60);
      while (obstaclesRef.current.length < 4) {
        const minY = Math.min(...obstaclesRef.current.map((o) => o.y));
        obstaclesRef.current.push(makeObstacle(minY - 160 - Math.random() * 100));
      }

      // Collision.
      let dead = false;
      for (const o of obstaclesRef.current) {
        if (o.lane !== laneRef.current) continue;
        const oh = o.kind === "train" ? 90 : 30;
        const top = o.y;
        const bot = o.y + oh;
        if (bot > PLAYER_Y && top < PLAYER_Y + PLAYER_H) {
          if (o.kind === "barrier" && jumpRef.current > 0) continue;
          dead = true;
          break;
        }
      }

      if (dead) {
        setPhase("over");
        setBest((b) => Math.max(b, Math.floor(distRef.current / 10)));
      } else {
        setScore(Math.floor(distRef.current / 10));
        force((n) => (n + 1) & 0xffff);
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (phaseRef.current !== "playing") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          reset();
        }
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        laneRef.current = Math.max(0, laneRef.current - 1);
        force((n) => (n + 1) & 0xffff);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        laneRef.current = Math.min(LANES - 1, laneRef.current + 1);
        force((n) => (n + 1) & 0xffff);
      } else if (e.key === "ArrowUp" || e.key === " ") {
        e.preventDefault();
        if (jumpRef.current === 0) jumpRef.current = 28;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reset]);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const onBoardPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    touchStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onBoardPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const s = touchStartRef.current;
      touchStartRef.current = null;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (adx < 18 && ady < 18) {
        if (phaseRef.current !== "playing") {
          reset();
        } else if (jumpRef.current === 0) {
          jumpRef.current = 28;
        }
        return;
      }
      if (phaseRef.current !== "playing") return;
      if (adx > ady) {
        laneRef.current =
          dx > 0
            ? Math.min(LANES - 1, laneRef.current + 1)
            : Math.max(0, laneRef.current - 1);
      } else if (dy < 0) {
        if (jumpRef.current === 0) jumpRef.current = 28;
      }
      force((n) => (n + 1) & 0xffff);
    },
    [reset],
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <div
          onPointerDown={onBoardPointerDown}
          onPointerUp={onBoardPointerUp}
          onPointerCancel={() => (touchStartRef.current = null)}
          className="relative overflow-hidden border border-line bg-surface touch-none select-none"
          style={{ width: WIDTH, height: HEIGHT, maxWidth: "100%", touchAction: "none" }}
        >
          {[1, 2].map((i) => (
            <span
              key={i}
              className="absolute top-0 bottom-0 w-px bg-line"
              style={{ left: LANE_W * i }}
            />
          ))}
          {obstaclesRef.current.map((o, i) => (
            <span
              key={i}
              className={o.kind === "train" ? "absolute bg-foreground/70" : "absolute bg-accent/70"}
              style={{
                left: o.lane * LANE_W + LANE_W / 2 - 22,
                top: o.y,
                width: 44,
                height: o.kind === "train" ? 90 : 18,
              }}
            />
          ))}
          <span
            className="absolute bg-accent transition-[left,transform] duration-100"
            style={{
              left: laneRef.current * LANE_W + LANE_W / 2 - PLAYER_W / 2,
              top: PLAYER_Y,
              width: PLAYER_W,
              height: PLAYER_H,
              transform: jumpRef.current > 0 ? `translateY(-30px) scale(0.85)` : "none",
            }}
          />
          {phase !== "playing" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">
                {phase === "idle" ? "Press space to start" : "Caught"}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {phase === "over" ? "Space to retry" : "← → swap lanes · ↑ jump"}
              </span>
            </span>
          )}
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          ← → swap lanes · ↑/space to jump · or swipe left/right/up
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line">
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Score</p>
            <p className="mt-3 font-serif text-6xl">{score}</p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Best</p>
            <p className="mt-3 font-serif text-6xl text-accent">{best}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 border border-line p-6 text-sm text-muted">
          <p className="font-mono text-xs uppercase tracking-[0.2em]">How to play</p>
          <p className="mt-2">
            ← → swap lanes. ↑ or space jumps short barriers (the gold ones).
            Trains are full-height — you can&apos;t jump them, only dodge.
          </p>
        </div>
      </div>
    </div>
  );
}

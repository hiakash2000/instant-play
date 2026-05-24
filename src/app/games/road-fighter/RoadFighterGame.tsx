"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

const WIDTH = 320;
const HEIGHT = 540;
const ROAD_PAD = 36;
const ROAD_LEFT = ROAD_PAD;
const ROAD_RIGHT = WIDTH - ROAD_PAD;
const ROAD_WIDTH = ROAD_RIGHT - ROAD_LEFT;
const CAR_W = 26;
const CAR_H = 46;
const PLAYER_Y = HEIGHT - CAR_H - 28;
const TICK_MS = 16;
const STEER_STEP = 4;
const BASE_SCROLL = 4;
const ACCEL_PER_SCORE = 0.012;
const STRIPE_GAP = 48;
const SPAWN_MIN = 26;
const SPAWN_MAX = 60;

type Enemy = { x: number; y: number; speed: number; tint: number };
type Phase = "idle" | "playing" | "over";

export default function RoadFighterGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = usePersistedBest("road-fighter");
  const [, force] = useState(0);

  const playerX = useRef((ROAD_LEFT + ROAD_RIGHT) / 2 - CAR_W / 2);
  const enemies = useRef<Enemy[]>([]);
  const stripeOffset = useRef(0);
  const tickCount = useRef(0);
  const nextSpawn = useRef(40);
  const pressed = useRef({ left: false, right: false });
  const scoreRef = useRef(0);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const reset = useCallback(() => {
    playerX.current = (ROAD_LEFT + ROAD_RIGHT) / 2 - CAR_W / 2;
    enemies.current = [];
    stripeOffset.current = 0;
    tickCount.current = 0;
    nextSpawn.current = 40;
    scoreRef.current = 0;
    pressed.current = { left: false, right: false };
    setScore(0);
    setPhase("playing");
  }, []);

  const start = useCallback(() => {
    if (phaseRef.current !== "playing") reset();
  }, [reset]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      tickCount.current += 1;

      if (pressed.current.left) {
        playerX.current = Math.max(ROAD_LEFT, playerX.current - STEER_STEP);
      }
      if (pressed.current.right) {
        playerX.current = Math.min(
          ROAD_RIGHT - CAR_W,
          playerX.current + STEER_STEP,
        );
      }

      const speed = BASE_SCROLL + scoreRef.current * ACCEL_PER_SCORE;
      stripeOffset.current = (stripeOffset.current + speed) % STRIPE_GAP;

      for (const e of enemies.current) {
        e.y += e.speed + speed * 0.35;
      }
      enemies.current = enemies.current.filter((e) => e.y < HEIGHT + CAR_H);

      if (tickCount.current >= nextSpawn.current) {
        const x =
          ROAD_LEFT + 6 + Math.random() * (ROAD_WIDTH - 12 - CAR_W);
        enemies.current.push({
          x,
          y: -CAR_H,
          speed: 1.2 + Math.random() * 2.2,
          tint: Math.random() > 0.5 ? 1 : 0,
        });
        const gap = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
        nextSpawn.current = tickCount.current + Math.floor(gap);
      }

      const px = playerX.current;
      const py = PLAYER_Y;
      let dead = false;
      for (const e of enemies.current) {
        if (
          px < e.x + CAR_W &&
          px + CAR_W > e.x &&
          py < e.y + CAR_H &&
          py + CAR_H > e.y
        ) {
          dead = true;
          break;
        }
      }

      if (dead) {
        setPhase("over");
        return;
      }

      if (tickCount.current % 6 === 0) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        setBest((b) => Math.max(b, scoreRef.current));
      }

      force((n) => (n + 1) & 0xffff);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        pressed.current.left = true;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        pressed.current.right = true;
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        start();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        pressed.current.left = false;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        pressed.current.right = false;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [start]);

  const dragRef = useRef(false);
  const setPlayerFromPointer = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = WIDTH / rect.width;
    const x = (e.clientX - rect.left) * sx - CAR_W / 2;
    playerX.current = Math.max(ROAD_LEFT, Math.min(ROAD_RIGHT - CAR_W, x));
    force((n) => (n + 1) & 0xffff);
  }, []);
  const onBoardPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = true;
      if (phaseRef.current !== "playing") {
        start();
        return;
      }
      setPlayerFromPointer(e);
    },
    [start, setPlayerFromPointer],
  );
  const onBoardPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragRef.current || phaseRef.current !== "playing") return;
      setPlayerFromPointer(e);
    },
    [setPlayerFromPointer],
  );
  const endDrag = useCallback(() => {
    dragRef.current = false;
  }, []);

  const stripes: number[] = [];
  for (
    let y = -STRIPE_GAP + stripeOffset.current;
    y < HEIGHT;
    y += STRIPE_GAP
  ) {
    stripes.push(y);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onPointerDown={onBoardPointerDown}
          onPointerMove={onBoardPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="relative overflow-hidden border border-line bg-surface select-none touch-none"
          style={{ width: WIDTH, height: HEIGHT, maxWidth: "100%", touchAction: "none" }}
          aria-label="Drive"
        >
          <span
            className="absolute top-0 bottom-0 left-0 bg-line/40"
            style={{ width: ROAD_PAD }}
          />
          <span
            className="absolute top-0 bottom-0 right-0 bg-line/40"
            style={{ width: ROAD_PAD }}
          />
          <span
            className="absolute top-0 bottom-0 bg-foreground/[0.04]"
            style={{ left: ROAD_LEFT, width: ROAD_WIDTH }}
          />
          {stripes.map((y, i) => (
            <span
              key={i}
              className="absolute bg-foreground/40"
              style={{
                left: WIDTH / 2 - 1,
                top: y,
                width: 2,
                height: 22,
              }}
            />
          ))}
          {enemies.current.map((e, i) => (
            <span
              key={i}
              className={e.tint ? "absolute bg-foreground/80" : "absolute bg-foreground/60"}
              style={{ left: e.x, top: e.y, width: CAR_W, height: CAR_H }}
            />
          ))}
          <span
            className="absolute bg-accent"
            style={{
              left: playerX.current,
              top: PLAYER_Y,
              width: CAR_W,
              height: CAR_H,
            }}
            aria-hidden
          />
          {phase !== "playing" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">
                {phase === "idle" ? "Click to start" : "Crash"}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {phase === "over"
                  ? "Click or space to retry"
                  : "← → to steer"}
              </span>
            </span>
          )}
        </button>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          ← → or A/D · drag on board · don&apos;t hit anyone
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
        <div className="flex flex-col gap-2 border border-line p-6 text-sm text-muted">
          <p className="font-mono text-xs uppercase tracking-[0.2em]">
            How to play
          </p>
          <p className="mt-2">
            Hold left or right to slide between lanes. Other cars drift down
            the road at random speeds — clip one and the run ends. The road
            speeds up the longer you stay on it.
          </p>
        </div>
      </div>
    </div>
  );
}

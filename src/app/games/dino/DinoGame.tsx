"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

const WIDTH = 720;
const HEIGHT = 220;
const GROUND_Y = HEIGHT - 30;
const DINO_X = 60;
const DINO_W = 28;
const DINO_H = 36;
const GRAVITY = 0.7;
const JUMP_V = -12.5;
const START_SPEED = 5;
const SPEED_GAIN = 0.0015; // per tick
const SPAWN_MIN = 60;
const SPAWN_MAX = 130; // in ticks
const TICK_MS = 16;

type Obstacle = { x: number; w: number; h: number };
type Phase = "idle" | "playing" | "over";

export default function DinoGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = usePersistedBest("dino");
  const [, force] = useState(0);

  const dinoY = useRef(GROUND_Y - DINO_H);
  const dinoV = useRef(0);
  const obstacles = useRef<Obstacle[]>([]);
  const speed = useRef(START_SPEED);
  const ticksToSpawn = useRef(40);
  const distance = useRef(0);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const reset = useCallback(() => {
    dinoY.current = GROUND_Y - DINO_H;
    dinoV.current = 0;
    obstacles.current = [];
    speed.current = START_SPEED;
    ticksToSpawn.current = 50;
    distance.current = 0;
    setScore(0);
    setPhase("playing");
  }, []);

  const jump = useCallback(() => {
    if (phaseRef.current === "idle") {
      reset();
      return;
    }
    if (phaseRef.current === "over") {
      reset();
      return;
    }
    if (dinoY.current + DINO_H >= GROUND_Y) {
      dinoV.current = JUMP_V;
    }
  }, [reset]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      // Dino physics.
      dinoV.current += GRAVITY;
      dinoY.current += dinoV.current;
      if (dinoY.current + DINO_H > GROUND_Y) {
        dinoY.current = GROUND_Y - DINO_H;
        dinoV.current = 0;
      }

      // Spawn obstacles.
      ticksToSpawn.current -= 1;
      if (ticksToSpawn.current <= 0) {
        const w = 14 + Math.floor(Math.random() * 22);
        const h = 28 + Math.floor(Math.random() * 28);
        obstacles.current.push({ x: WIDTH + 10, w, h });
        const range = SPAWN_MAX - SPAWN_MIN;
        ticksToSpawn.current =
          SPAWN_MIN + Math.floor(Math.random() * range);
      }

      // Move obstacles.
      for (const o of obstacles.current) o.x -= speed.current;
      obstacles.current = obstacles.current.filter((o) => o.x + o.w > -10);

      // Speed up and tick score.
      speed.current += SPEED_GAIN;
      distance.current += speed.current;
      const newScore = Math.floor(distance.current / 10);

      // Collision.
      let dead = false;
      const dx1 = DINO_X;
      const dx2 = DINO_X + DINO_W;
      const dy1 = dinoY.current;
      const dy2 = dinoY.current + DINO_H;
      for (const o of obstacles.current) {
        const ox1 = o.x;
        const ox2 = o.x + o.w;
        const oy1 = GROUND_Y - o.h;
        const oy2 = GROUND_Y;
        if (dx1 < ox2 && dx2 > ox1 && dy1 < oy2 && dy2 > oy1) {
          dead = true;
          break;
        }
      }

      if (dead) {
        setPhase("over");
        setBest((b) => Math.max(b, newScore));
        setScore(newScore);
        return;
      }
      setScore(newScore);
      force((n) => (n + 1) & 0xffff);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === " " ||
        e.key === "Spacebar" ||
        e.key === "ArrowUp" ||
        e.key === "w" ||
        e.key === "W"
      ) {
        e.preventDefault();
        jump();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            jump();
          }}
          className="relative overflow-hidden border border-line bg-surface text-left touch-manipulation select-none"
          style={{ width: WIDTH, height: HEIGHT, maxWidth: "100%", touchAction: "manipulation" }}
          aria-label="Jump"
        >
          {/* Ground line */}
          <span
            className="absolute bg-line"
            style={{ left: 0, right: 0, top: GROUND_Y, height: 1 }}
          />
          {/* Dino */}
          <span
            className="absolute bg-accent"
            style={{
              left: DINO_X,
              top: dinoY.current,
              width: DINO_W,
              height: DINO_H,
            }}
          />
          {/* Obstacles */}
          {obstacles.current.map((o, i) => (
            <span
              key={i}
              className="absolute bg-foreground/80"
              style={{
                left: o.x,
                top: GROUND_Y - o.h,
                width: o.w,
                height: o.h,
              }}
            />
          ))}
          {phase !== "playing" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">
                {phase === "idle" ? "Press space to run" : "Game over"}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {phase === "over" ? "Space to retry" : "Space · ↑ · W to jump"}
              </span>
            </span>
          )}
        </button>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Space, ↑, W, or tap to jump
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
            Run forever. Jump over cacti. The world speeds up the longer you
            last.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

const WIDTH = 640;
const HEIGHT = 280;
const GROUND_Y = 230;
const PLAYER_X = 90;
const PLAYER_SIZE = 28;
const GRAVITY = 0.7;
const JUMP_V = -12;
const SCROLL_SPEED = 4.2;
const TICK_MS = 16;

type Spike = { x: number };
type Phase = "idle" | "playing" | "over";

const INITIAL_SPIKES: Spike[] = [
  { x: 520 },
  { x: 760 },
  { x: 1020 },
  { x: 1280 },
];

export default function GeometryDashGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = usePersistedBest("geometry-dash");
  const [, force] = useState(0);

  const yRef = useRef(GROUND_Y - PLAYER_SIZE);
  const vRef = useRef(0);
  const onGroundRef = useRef(true);
  const spikesRef = useRef<Spike[]>(INITIAL_SPIKES);
  const distanceRef = useRef(0);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const reset = useCallback(() => {
    yRef.current = GROUND_Y - PLAYER_SIZE;
    vRef.current = 0;
    onGroundRef.current = true;
    spikesRef.current = INITIAL_SPIKES.map((s) => ({ ...s }));
    distanceRef.current = 0;
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
    if (onGroundRef.current) {
      vRef.current = JUMP_V;
      onGroundRef.current = false;
    }
  }, [reset]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      vRef.current += GRAVITY;
      yRef.current += vRef.current;
      if (yRef.current >= GROUND_Y - PLAYER_SIZE) {
        yRef.current = GROUND_Y - PLAYER_SIZE;
        vRef.current = 0;
        onGroundRef.current = true;
      }

      distanceRef.current += SCROLL_SPEED;
      for (const s of spikesRef.current) {
        s.x -= SCROLL_SPEED;
      }
      while (spikesRef.current[0] && spikesRef.current[0].x < -40) {
        spikesRef.current.shift();
      }
      while (spikesRef.current.length < 4) {
        const last = spikesRef.current[spikesRef.current.length - 1];
        const gap = 220 + Math.floor(Math.random() * 180);
        spikesRef.current.push({ x: (last?.x ?? WIDTH) + gap });
      }

      const px = PLAYER_X;
      const py = yRef.current;
      let dead = false;
      for (const s of spikesRef.current) {
        if (
          s.x < px + PLAYER_SIZE - 6 &&
          s.x + 24 > px + 6 &&
          py + PLAYER_SIZE > GROUND_Y - 22
        ) {
          dead = true;
          break;
        }
      }

      if (dead) {
        setPhase("over");
        setBest((b) => Math.max(b, Math.floor(distanceRef.current / 10)));
      } else {
        setScore(Math.floor(distanceRef.current / 10));
        force((n) => (n + 1) & 0xffff);
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Spacebar" || e.key === "ArrowUp") {
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
          className="relative overflow-hidden border border-line bg-surface touch-manipulation select-none"
          style={{ width: WIDTH, height: HEIGHT, maxWidth: "100%", touchAction: "manipulation" }}
          aria-label="Jump"
        >
          <span
            className="absolute left-0 right-0 bg-line"
            style={{ top: GROUND_Y, height: 1 }}
          />
          <span
            className="absolute bg-accent"
            style={{
              left: PLAYER_X,
              top: yRef.current,
              width: PLAYER_SIZE,
              height: PLAYER_SIZE,
            }}
          />
          {spikesRef.current.map((s, i) => (
            <span
              key={i}
              className="absolute bg-foreground/70"
              style={{
                left: s.x,
                top: GROUND_Y - 22,
                width: 24,
                height: 22,
                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
              }}
            />
          ))}
          {phase !== "playing" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">
                {phase === "idle" ? "Tap to start" : "Game over"}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {phase === "over" ? "Click or space to retry" : "Click or space to jump"}
              </span>
            </span>
          )}
        </button>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Click the board or press space · ↑ also jumps
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
          <p className="font-mono text-xs uppercase tracking-[0.2em]">How to play</p>
          <p className="mt-2">
            The square auto-runs. One tap is one jump, no double jumps. Spikes
            grow taller as the music speeds up — well, the spikes grow taller.
          </p>
        </div>
      </div>
    </div>
  );
}

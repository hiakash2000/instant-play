"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

const WIDTH = 640;
const HEIGHT = 400;
const BUSH_H = 70;
const DUCK_W = 36;
const DUCK_H = 24;
const ROUND_MS = 60_000;
const TICK_MS = 16;

type Duck = {
  x: number;
  y: number;
  vx: number;
  amp: number; // sine wave amplitude
  phase: number;
  baseY: number;
  state: "flying" | "hiding" | "dead";
  hideUntil: number; // performance.now()
  willHide: boolean;
  hideAtX: number;
};
type Phase = "idle" | "playing" | "over";

function spawnDuck(now: number): Duck {
  const fromLeft = Math.random() < 0.5;
  const vx = (1.6 + Math.random() * 1.2) * (fromLeft ? 1 : -1);
  const baseY = 80 + Math.random() * (HEIGHT - BUSH_H - 140);
  const willHide = Math.random() < 0.45;
  const hideAtX = WIDTH * (0.3 + Math.random() * 0.4);
  return {
    x: fromLeft ? -DUCK_W : WIDTH,
    y: baseY,
    vx,
    amp: 18 + Math.random() * 18,
    phase: Math.random() * Math.PI * 2,
    baseY,
    state: "flying",
    hideUntil: 0,
    willHide,
    hideAtX,
  };
}

export default function DuckHuntGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [best, setBest] = usePersistedBest("duck-hunt");
  const [timeLeft, setTimeLeft] = useState(ROUND_MS);
  const [, force] = useState(0);

  const duck = useRef<Duck | null>(null);
  const phaseRef = useRef(phase);
  const roundEndsAt = useRef(0);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const start = useCallback(() => {
    duck.current = spawnDuck(performance.now());
    setScore(0);
    setMisses(0);
    roundEndsAt.current = performance.now() + ROUND_MS;
    setTimeLeft(ROUND_MS);
    setPhase("playing");
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      const now = performance.now();
      const left = Math.max(0, roundEndsAt.current - now);
      setTimeLeft(left);
      if (left <= 0) {
        setPhase("over");
        setBest((b) => Math.max(b, score));
        return;
      }

      const d = duck.current;
      if (!d) {
        duck.current = spawnDuck(now);
      } else if (d.state === "flying") {
        d.x += d.vx;
        d.phase += 0.12;
        d.y = d.baseY + Math.sin(d.phase) * d.amp;

        const crossed =
          (d.vx > 0 && d.x >= d.hideAtX) || (d.vx < 0 && d.x <= d.hideAtX);
        if (d.willHide && crossed) {
          d.state = "hiding";
          d.hideUntil = now + 700 + Math.random() * 500;
        }

        if (d.x < -DUCK_W - 10 || d.x > WIDTH + 10) {
          duck.current = spawnDuck(now);
        }
      } else if (d.state === "hiding") {
        if (now >= d.hideUntil) {
          // Re-emerge somewhere else along the bush.
          const fromLeft = Math.random() < 0.5;
          d.vx = (1.8 + Math.random() * 1.4) * (fromLeft ? 1 : -1);
          d.x = fromLeft ? 30 : WIDTH - 30 - DUCK_W;
          d.baseY = 80 + Math.random() * (HEIGHT - BUSH_H - 140);
          d.state = "flying";
          d.willHide = false; // only one hide per duck
        }
      } else if (d.state === "dead") {
        // Falling into bush.
        d.y += 8;
        if (d.y > HEIGHT - BUSH_H) {
          duck.current = spawnDuck(now);
        }
      }

      force((n) => (n + 1) & 0xffff);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase, score]);

  const onBoardClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (phaseRef.current !== "playing") {
        start();
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const sx = WIDTH / rect.width;
      const sy = HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * sx;
      const y = (e.clientY - rect.top) * sy;
      const d = duck.current;
      if (d && d.state === "flying") {
        if (
          x >= d.x &&
          x <= d.x + DUCK_W &&
          y >= d.y &&
          y <= d.y + DUCK_H
        ) {
          d.state = "dead";
          setScore((s) => s + 1);
          return;
        }
      }
      setMisses((m) => m + 1);
    },
    [start],
  );

  const d = duck.current;
  const showDuck =
    d &&
    (d.state === "flying" || d.state === "dead") &&
    phase === "playing";

  const seconds = Math.ceil(timeLeft / 1000);

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onBoardClick}
          className="relative overflow-hidden border border-line bg-surface"
          style={{ width: WIDTH, height: HEIGHT, maxWidth: "100%", cursor: "crosshair" }}
          aria-label="Shoot"
        >
          {/* Bush along the bottom */}
          <span
            className="absolute bg-foreground/10"
            style={{
              left: 0,
              right: 0,
              bottom: 0,
              height: BUSH_H,
            }}
          />
          <span
            className="absolute bg-foreground/20"
            style={{
              left: 0,
              right: 0,
              bottom: BUSH_H - 1,
              height: 2,
            }}
          />

          {showDuck && d && (
            <span
              className={`absolute ${
                d.state === "dead" ? "bg-foreground/60" : "bg-accent"
              }`}
              style={{
                left: d.x,
                top: d.y,
                width: DUCK_W,
                height: DUCK_H,
                transform: d.state === "dead" ? "rotate(20deg)" : undefined,
              }}
            />
          )}

          {phase !== "playing" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">
                {phase === "idle"
                  ? "Click to start"
                  : `Time! ${score} hit${score === 1 ? "" : "s"}`}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {phase === "idle"
                  ? "60 seconds · click to shoot"
                  : "Click to play again"}
              </span>
            </span>
          )}
        </button>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Aim and click · ducks duck into the bush
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-3 gap-px overflow-hidden border border-line bg-line">
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Hits
            </p>
            <p className="mt-3 font-serif text-5xl">{score}</p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Misses
            </p>
            <p className="mt-3 font-serif text-5xl text-muted">{misses}</p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Time
            </p>
            <p className="mt-3 font-serif text-5xl text-accent">{seconds}</p>
          </div>
        </div>

        <div className="border border-line p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Best
          </p>
          <p className="mt-3 font-serif text-4xl">{best}</p>
        </div>

        <div className="flex flex-col gap-2 border border-line p-6 text-sm text-muted">
          <p className="font-mono text-xs uppercase tracking-[0.2em]">
            How to play
          </p>
          <p className="mt-2">
            Sixty seconds. One duck at a time. Some will dive into the bush
            and pop up somewhere else &mdash; wait them out or get faster.
          </p>
        </div>
      </div>
    </div>
  );
}

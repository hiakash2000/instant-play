"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

const WIDTH = 360;
const HEIGHT = 560;
const BALL_R = 14;
const GRAVITY = 0.45;
const TAP_V = -8;
const TICK_MS = 16;
const HOOP_W = 90;
const HOOP_OPENING = 70;

type Phase = "idle" | "playing" | "over";

function randomHoop() {
  return {
    x: 60 + Math.random() * (WIDTH - 120 - HOOP_W),
    y: 200 + Math.random() * 200,
    dx: Math.random() < 0.5 ? -0.8 : 0.8,
    passed: false,
  };
}

export default function FlappyDunkGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = usePersistedBest("flappy-dunk");
  const [, force] = useState(0);

  const ballRef = useRef({ x: WIDTH / 2, y: HEIGHT / 2, vx: 0, vy: 0 });
  const hoopRef = useRef({
    x: (WIDTH - HOOP_W) / 2,
    y: 280,
    dx: 0.8,
    passed: false,
  });
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const reset = useCallback(() => {
    ballRef.current = { x: WIDTH / 2, y: 80, vx: 0, vy: 0 };
    hoopRef.current = randomHoop();
    setScore(0);
    setPhase("playing");
  }, []);

  const tap = useCallback(() => {
    if (phaseRef.current === "idle" || phaseRef.current === "over") {
      reset();
      return;
    }
    ballRef.current.vy = TAP_V;
  }, [reset]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      const b = ballRef.current;
      b.vy += GRAVITY;
      b.y += b.vy;
      b.x += b.vx;
      if (b.x - BALL_R < 0) {
        b.x = BALL_R;
        b.vx = Math.abs(b.vx);
      } else if (b.x + BALL_R > WIDTH) {
        b.x = WIDTH - BALL_R;
        b.vx = -Math.abs(b.vx);
      }

      // Move hoop.
      const h = hoopRef.current;
      h.x += h.dx;
      if (h.x < 30 || h.x + HOOP_W > WIDTH - 30) h.dx *= -1;

      // Check hoop pass-through (only when moving down).
      const hoopY = h.y;
      if (
        !h.passed &&
        b.vy > 0 &&
        b.y - BALL_R < hoopY + 6 &&
        b.y + BALL_R > hoopY - 6 &&
        b.x > h.x + (HOOP_W - HOOP_OPENING) / 2 &&
        b.x < h.x + (HOOP_W + HOOP_OPENING) / 2
      ) {
        h.passed = true;
        setScore((s) => {
          const ns = s + 1;
          setBest((bb) => Math.max(bb, ns));
          return ns;
        });
        b.vy = -10;
        // New hoop after pass.
        setTimeout(() => {
          hoopRef.current = randomHoop();
        }, 200);
      }

      if (b.y > HEIGHT + 40) {
        setPhase("over");
        return;
      }
      force((n) => (n + 1) & 0xffff);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Spacebar" || e.key === "ArrowUp") {
        e.preventDefault();
        tap();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tap]);

  const h = hoopRef.current;
  const b = ballRef.current;

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            tap();
          }}
          className="relative overflow-hidden border border-line bg-surface touch-manipulation select-none"
          style={{ width: WIDTH, height: HEIGHT, maxWidth: "100%", touchAction: "manipulation" }}
          aria-label="Tap"
        >
          {/* hoop: two side bars and rim */}
          <span
            className="absolute bg-accent"
            style={{ left: h.x, top: h.y, width: (HOOP_W - HOOP_OPENING) / 2, height: 6 }}
          />
          <span
            className="absolute bg-accent"
            style={{
              left: h.x + (HOOP_W + HOOP_OPENING) / 2,
              top: h.y,
              width: (HOOP_W - HOOP_OPENING) / 2,
              height: 6,
            }}
          />
          <span
            className="absolute bg-accent/40"
            style={{ left: h.x + (HOOP_W - HOOP_OPENING) / 2, top: h.y + 6, width: HOOP_OPENING, height: 1 }}
          />

          <span
            className="absolute rounded-full bg-foreground"
            style={{ left: b.x - BALL_R, top: b.y - BALL_R, width: BALL_R * 2, height: BALL_R * 2 }}
          />
          {phase !== "playing" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">
                {phase === "idle" ? "Tap to start" : "Missed"}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                Click or space
              </span>
            </span>
          )}
        </button>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Click the board or press space to bounce
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line">
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Dunks</p>
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
            Each tap is one bounce of fixed strength. The hoop drifts side to
            side — tap so the ball drops through it on the way down.
          </p>
        </div>
      </div>
    </div>
  );
}

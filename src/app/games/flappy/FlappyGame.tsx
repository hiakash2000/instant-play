"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

const WIDTH = 360;
const HEIGHT = 520;
const BIRD_X = 90;
const BIRD_R = 12;
const GRAVITY = 0.45;
const FLAP_V = -7.2;
const PIPE_W = 56;
const PIPE_GAP = 150;
const PIPE_SPEED = 2.2;
const PIPE_SPACING = 220; // horizontal distance between pipes
const TICK_MS = 16;

type Pipe = { x: number; gapY: number; passed: boolean };
type Phase = "idle" | "playing" | "over";

function randomGapY() {
  const margin = 60;
  return margin + Math.random() * (HEIGHT - PIPE_GAP - margin * 2);
}

export default function FlappyGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = usePersistedBest("flappy");
  const [, force] = useState(0);

  const birdY = useRef(HEIGHT / 2);
  const birdV = useRef(0);
  const pipes = useRef<Pipe[]>([]);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const reset = useCallback(() => {
    birdY.current = HEIGHT / 2;
    birdV.current = 0;
    pipes.current = [
      { x: WIDTH + 40, gapY: randomGapY(), passed: false },
      { x: WIDTH + 40 + PIPE_SPACING, gapY: randomGapY(), passed: false },
      { x: WIDTH + 40 + PIPE_SPACING * 2, gapY: randomGapY(), passed: false },
    ];
    setScore(0);
    setPhase("playing");
  }, []);

  const flap = useCallback(() => {
    if (phaseRef.current === "idle") {
      reset();
      birdV.current = FLAP_V;
      return;
    }
    if (phaseRef.current === "playing") {
      birdV.current = FLAP_V;
    } else if (phaseRef.current === "over") {
      reset();
    }
  }, [reset]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      birdV.current += GRAVITY;
      birdY.current += birdV.current;

      let scored = 0;
      for (const p of pipes.current) {
        p.x -= PIPE_SPEED;
        if (!p.passed && p.x + PIPE_W < BIRD_X - BIRD_R) {
          p.passed = true;
          scored += 1;
        }
      }
      pipes.current = pipes.current.filter((p) => p.x + PIPE_W > -20);
      while (pipes.current.length < 3) {
        const last = pipes.current[pipes.current.length - 1];
        pipes.current.push({
          x: (last?.x ?? WIDTH) + PIPE_SPACING,
          gapY: randomGapY(),
          passed: false,
        });
      }

      // Collision: floor, ceiling, or pipe overlap.
      const y = birdY.current;
      let dead = y - BIRD_R < 0 || y + BIRD_R > HEIGHT;
      for (const p of pipes.current) {
        if (p.x < BIRD_X + BIRD_R && p.x + PIPE_W > BIRD_X - BIRD_R) {
          if (y - BIRD_R < p.gapY || y + BIRD_R > p.gapY + PIPE_GAP) {
            dead = true;
            break;
          }
        }
      }

      if (scored > 0) {
        setScore((s) => {
          const ns = s + scored;
          setBest((b) => Math.max(b, ns));
          return ns;
        });
      }

      if (dead) {
        setPhase("over");
      } else {
        force((n) => (n + 1) & 0xffff);
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Spacebar" || e.key === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flap]);

  const rotation = Math.max(-25, Math.min(70, birdV.current * 5));

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            flap();
          }}
          className="relative overflow-hidden border border-line bg-surface touch-manipulation select-none"
          style={{ width: WIDTH, height: HEIGHT, maxWidth: "100%", touchAction: "manipulation" }}
          aria-label="Flap"
        >
          {pipes.current.map((p, i) => (
            <span key={i}>
              <span
                className="absolute bg-accent/70"
                style={{
                  left: p.x,
                  top: 0,
                  width: PIPE_W,
                  height: p.gapY,
                }}
              />
              <span
                className="absolute bg-accent/70"
                style={{
                  left: p.x,
                  top: p.gapY + PIPE_GAP,
                  width: PIPE_W,
                  height: HEIGHT - (p.gapY + PIPE_GAP),
                }}
              />
            </span>
          ))}
          <span
            className="absolute rounded-full bg-foreground"
            style={{
              left: BIRD_X - BIRD_R,
              top: birdY.current - BIRD_R,
              width: BIRD_R * 2,
              height: BIRD_R * 2,
              transform: `rotate(${rotation}deg)`,
            }}
          />
          {phase !== "playing" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">
                {phase === "idle" ? "Tap to flap" : "Game over"}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {phase === "over" ? "Click or space to retry" : "Click or space"}
              </span>
            </span>
          )}
        </button>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Click the board or press space · ↑ also flaps
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
            Gravity is constant. Each flap gives a fixed upward kick. Thread
            the gap between every pair of pipes.
          </p>
        </div>
      </div>
    </div>
  );
}

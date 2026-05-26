"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";
import ResponsivePlayfield from "../ResponsivePlayfield";
import { playSound } from "../sound";

const WIDTH = 360;
const HEIGHT = 560;
const BALL_X = WIDTH / 2;
const BALL_Y = 96;
const BALL_R = 10;
const PLANK_HEIGHT = 18;
const PLANK_SPACING = 110;
const HOLE_WIDTH = 78;
const FALL_SPEED = 1.6;
const SHIFT_STEP = 7;
const ACCEL_PER_SCORE = 0.045;
const TICK_MS = 16;

type Plank = { y: number; holeX: number; passed: boolean };
type Phase = "idle" | "playing" | "over";

function makePlank(y: number): Plank {
  const margin = HOLE_WIDTH / 2 + 16;
  const holeX = margin + Math.random() * (WIDTH - margin * 2);
  return { y, holeX, passed: false };
}

function buildPlanks(): Plank[] {
  const planks: Plank[] = [];
  for (let i = 0; i < 8; i++) {
    planks.push(makePlank(BALL_Y + 220 + i * PLANK_SPACING));
  }
  return planks;
}

export default function BallFallGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = usePersistedBest("ball-fall");
  const [, force] = useState(0);

  const planks = useRef<Plank[]>([]);
  const offset = useRef(0);
  const pressed = useRef({ left: false, right: false });
  const scoreRef = useRef(0);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const reset = useCallback(() => {
    planks.current = buildPlanks();
    offset.current = 0;
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
      if (pressed.current.left) offset.current -= SHIFT_STEP;
      if (pressed.current.right) offset.current += SHIFT_STEP;

      const speed = FALL_SPEED + scoreRef.current * ACCEL_PER_SCORE;
      for (const p of planks.current) {
        p.y -= speed;
      }

      let dead = false;
      for (const p of planks.current) {
        const top = p.y;
        const bot = p.y + PLANK_HEIGHT;
        if (bot >= BALL_Y - BALL_R && top <= BALL_Y + BALL_R) {
          const holeScreenX = p.holeX + offset.current;
          const holeLeft = holeScreenX - HOLE_WIDTH / 2;
          const holeRight = holeScreenX + HOLE_WIDTH / 2;
          if (BALL_X - BALL_R < holeLeft || BALL_X + BALL_R > holeRight) {
            dead = true;
            break;
          }
        }
      }

      if (dead) {
        playSound("lose");
        setPhase("over");
        return;
      }

      let scoredThisTick = 0;
      for (const p of planks.current) {
        if (!p.passed && p.y + PLANK_HEIGHT < BALL_Y - BALL_R) {
          p.passed = true;
          scoredThisTick += 1;
        }
      }
      if (scoredThisTick > 0) {
        playSound("collect");
        scoreRef.current += scoredThisTick;
        setScore(scoreRef.current);
        setBest((b) => Math.max(b, scoreRef.current));
      }

      planks.current = planks.current.filter((p) => p.y > -PLANK_HEIGHT * 2);
      while (planks.current.length < 8) {
        const last = planks.current[planks.current.length - 1];
        planks.current.push(
          makePlank((last?.y ?? BALL_Y) + PLANK_SPACING),
        );
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

  const dragStart = useRef<number | null>(null);
  function onPointerDown(e: React.PointerEvent) {
    if (phaseRef.current !== "playing") {
      start();
      return;
    }
    dragStart.current = e.clientX;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (dragStart.current === null) return;
    const dx = e.clientX - dragStart.current;
    offset.current += dx;
    dragStart.current = e.clientX;
    force((n) => (n + 1) & 0xffff);
  }
  function onPointerUp() {
    dragStart.current = null;
  }

  return (
    <div className="grid gap-10 px-4 sm:px-0 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <ResponsivePlayfield width={WIDTH} height={HEIGHT}>
        <div
          className="relative h-full w-full overflow-hidden border border-line bg-surface select-none touch-none"
                    onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {planks.current.map((p, i) => {
            if (p.y < -PLANK_HEIGHT || p.y > HEIGHT) return null;
            const holeScreenX = p.holeX + offset.current;
            const leftWidth = Math.max(
              0,
              Math.min(WIDTH, holeScreenX - HOLE_WIDTH / 2),
            );
            const rightStart = Math.max(
              0,
              Math.min(WIDTH, holeScreenX + HOLE_WIDTH / 2),
            );
            const rightWidth = Math.max(0, WIDTH - rightStart);
            const PLANK_COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#facc15", "#4ade80"];
            const plankColor = PLANK_COLORS[i % PLANK_COLORS.length];
            return (
              <span key={i}>
                {leftWidth > 0 && (
                  <span
                    className="absolute"
                    style={{
                      left: 0,
                      top: p.y,
                      width: leftWidth,
                      height: PLANK_HEIGHT,
                      background: plankColor,
                    }}
                  />
                )}
                {rightWidth > 0 && (
                  <span
                    className="absolute"
                    style={{
                      left: rightStart,
                      top: p.y,
                      width: rightWidth,
                      height: PLANK_HEIGHT,
                      background: plankColor,
                    }}
                  />
                )}
              </span>
            );
          })}
          <span
            className="absolute rounded-full"
            style={{
              left: BALL_X - BALL_R,
              top: BALL_Y - BALL_R,
              width: BALL_R * 2,
              height: BALL_R * 2,
              background: "#f97316",
            }}
            aria-hidden
          />
          {phase !== "playing" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">
                {phase === "idle" ? "Click to start" : "Game over"}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {phase === "over"
                  ? "Click or space to retry"
                  : "← → align the planks"}
              </span>
            </span>
          )}
        </div>
        </ResponsivePlayfield>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          ← → or A/D · drag the board · space to start
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
            The ball stays where it is. Wooden planks rise from below, each
            with a hole at a different position. Shift the entire stack left or
            right with arrow keys (or drag) so the next hole lines up with the
            ball. Miss the hole and the ball stops on the wood — game over.
          </p>
        </div>
      </div>
    </div>
  );
}

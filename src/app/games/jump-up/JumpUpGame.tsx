"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

const WIDTH = 360;
const HEIGHT = 560;
const CHAR_W = 22;
const CHAR_H = 26;
const PLANK_W = 70;
const PLANK_H = 12;
const GRAVITY = 0.42;
const BOUNCE_V = -10.5;
const MOVE_STEP = 5;
const TICK_MS = 16;
const PLANK_SPACING = 80;
const DISPLAY_CHAR_Y = HEIGHT - 200;
const START_PLANK_Y = HEIGHT - 80;

type Plank = {
  baseX: number;
  y: number;
  speed: number;
  range: number;
  phase: number;
};
type Phase = "idle" | "playing" | "over";

function plankX(p: Plank): number {
  return p.baseX + Math.sin(p.phase) * p.range;
}

function makePlank(y: number, level: number): Plank {
  const baseX = PLANK_W / 2 + Math.random() * (WIDTH - PLANK_W);
  const moves = level > 3;
  const range = moves ? 18 + Math.random() * Math.min(70, level * 4) : 0;
  const speed = moves ? 0.018 + Math.random() * 0.045 : 0;
  return {
    baseX,
    y,
    speed,
    range,
    phase: Math.random() * Math.PI * 2,
  };
}

function buildPlanks(): Plank[] {
  const ps: Plank[] = [];
  ps.push({
    baseX: WIDTH / 2,
    y: START_PLANK_Y,
    speed: 0,
    range: 0,
    phase: 0,
  });
  for (let i = 1; i < 4; i++) {
    ps.push({
      baseX: WIDTH / 2 + (i % 2 === 0 ? 70 : -70),
      y: START_PLANK_Y - i * PLANK_SPACING,
      speed: 0,
      range: 0,
      phase: 0,
    });
  }
  for (let i = 4; i < 14; i++) {
    ps.push(makePlank(START_PLANK_Y - i * PLANK_SPACING, i));
  }
  return ps;
}

export default function JumpUpGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = usePersistedBest("jump-up");
  const [, force] = useState(0);

  const charX = useRef(WIDTH / 2 - CHAR_W / 2);
  const charY = useRef(START_PLANK_Y - CHAR_H);
  const charV = useRef(0);
  const planks = useRef<Plank[]>([]);
  const highestY = useRef(charY.current);
  const climb = useRef(0);
  const pressed = useRef({ left: false, right: false });
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const reset = useCallback(() => {
    charX.current = WIDTH / 2 - CHAR_W / 2;
    charY.current = START_PLANK_Y - CHAR_H;
    charV.current = BOUNCE_V;
    planks.current = buildPlanks();
    highestY.current = charY.current;
    climb.current = 0;
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
      if (pressed.current.left) charX.current -= MOVE_STEP;
      if (pressed.current.right) charX.current += MOVE_STEP;
      if (charX.current + CHAR_W < 0) charX.current = WIDTH;
      else if (charX.current > WIDTH) charX.current = -CHAR_W;

      charV.current += GRAVITY;
      const prevBottom = charY.current + CHAR_H;
      charY.current += charV.current;
      const nextBottom = charY.current + CHAR_H;

      for (const p of planks.current) {
        p.phase += p.speed;
      }

      if (charV.current > 0) {
        const charLeft = charX.current;
        const charRight = charX.current + CHAR_W;
        for (const p of planks.current) {
          const px = plankX(p);
          const pLeft = px - PLANK_W / 2;
          const pRight = px + PLANK_W / 2;
          if (charRight < pLeft || charLeft > pRight) continue;
          if (prevBottom <= p.y && nextBottom >= p.y) {
            charY.current = p.y - CHAR_H;
            charV.current = BOUNCE_V;
            break;
          }
        }
      }

      if (charY.current < highestY.current) {
        const delta = highestY.current - charY.current;
        highestY.current = charY.current;
        climb.current += delta;
        const newScore = Math.floor(climb.current / 10);
        if (newScore > 0) {
          setScore(newScore);
          setBest((b) => Math.max(b, newScore));
        }
      }

      const viewY = highestY.current - DISPLAY_CHAR_Y;
      let topPlankY = Infinity;
      for (const p of planks.current) {
        if (p.y < topPlankY) topPlankY = p.y;
      }
      while (topPlankY > viewY - 120) {
        topPlankY -= PLANK_SPACING;
        const level = Math.floor(climb.current / 80) + planks.current.length;
        planks.current.push(makePlank(topPlankY, level));
      }
      const dropLimit = viewY + HEIGHT + 80;
      planks.current = planks.current.filter((p) => p.y < dropLimit);

      if (charY.current > highestY.current + (HEIGHT - DISPLAY_CHAR_Y)) {
        setPhase("over");
        return;
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

  const viewY = highestY.current - DISPLAY_CHAR_Y;
  const charScreenY = charY.current - viewY;

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={start}
          className="relative overflow-hidden border border-line bg-surface select-none"
          style={{ width: WIDTH, height: HEIGHT }}
          aria-label="Jump"
        >
          {planks.current.map((p, i) => {
            const screenY = p.y - viewY;
            if (screenY < -PLANK_H || screenY > HEIGHT + PLANK_H) return null;
            const px = plankX(p);
            return (
              <span
                key={i}
                className="absolute bg-accent/70"
                style={{
                  left: px - PLANK_W / 2,
                  top: screenY,
                  width: PLANK_W,
                  height: PLANK_H,
                }}
              />
            );
          })}
          <span
            className="absolute bg-foreground"
            style={{
              left: charX.current,
              top: charScreenY,
              width: CHAR_W,
              height: CHAR_H,
            }}
            aria-hidden
          />
          {phase !== "playing" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">
                {phase === "idle" ? "Click to jump" : "Game over"}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {phase === "over"
                  ? "Click or space to retry"
                  : "← → to steer · auto-bounce"}
              </span>
            </span>
          )}
        </button>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          ← → or A/D · space to start · screen wraps at the edges
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
            The character bounces on its own. Land on the planks above to climb
            higher — gravity does the rest. After a few jumps, the planks start
            sliding side to side. Miss them all and the run ends.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

const WIDTH = 520;
const HEIGHT = 360;
const PADDLE_W = 10;
const PADDLE_H = 70;
const BALL_R = 6;
const PLAYER_X = 20;
const AI_X = WIDTH - 20 - PADDLE_W;
const PADDLE_SPEED = 7;
const AI_SPEED = 4.4;
const BALL_SPEED_INIT = 5;
const BALL_SPEED_INC = 0.18;
const BALL_SPEED_MAX = 11;
const TICK_MS = 16;

type Phase = "idle" | "playing";

export default function TennisGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [scoreP, setScoreP] = useState(0);
  const [scoreA, setScoreA] = useState(0);
  const [best, setBest] = usePersistedBest("tennis");
  const [, force] = useState(0);

  const playerY = useRef((HEIGHT - PADDLE_H) / 2);
  const aiY = useRef((HEIGHT - PADDLE_H) / 2);
  const ball = useRef({
    x: WIDTH / 2,
    y: HEIGHT / 2,
    vx: BALL_SPEED_INIT,
    vy: 0,
  });
  const speed = useRef(BALL_SPEED_INIT);
  const pressed = useRef({ up: false, down: false });
  const scorePRef = useRef(0);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const serve = useCallback((toward: "player" | "ai") => {
    speed.current = BALL_SPEED_INIT;
    ball.current = {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      vx: (toward === "player" ? -1 : 1) * BALL_SPEED_INIT,
      vy: (Math.random() - 0.5) * BALL_SPEED_INIT * 0.6,
    };
  }, []);

  const reset = useCallback(() => {
    playerY.current = (HEIGHT - PADDLE_H) / 2;
    aiY.current = (HEIGHT - PADDLE_H) / 2;
    scorePRef.current = 0;
    setScoreP(0);
    setScoreA(0);
    serve(Math.random() < 0.5 ? "player" : "ai");
    setPhase("playing");
  }, [serve]);

  const start = useCallback(() => {
    if (phaseRef.current !== "playing") reset();
  }, [reset]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      if (pressed.current.up) {
        playerY.current = Math.max(0, playerY.current - PADDLE_SPEED);
      }
      if (pressed.current.down) {
        playerY.current = Math.min(
          HEIGHT - PADDLE_H,
          playerY.current + PADDLE_SPEED,
        );
      }

      const target = ball.current.y - PADDLE_H / 2;
      if (aiY.current < target) {
        aiY.current = Math.min(target, aiY.current + AI_SPEED);
      } else if (aiY.current > target) {
        aiY.current = Math.max(target, aiY.current - AI_SPEED);
      }
      aiY.current = Math.max(0, Math.min(HEIGHT - PADDLE_H, aiY.current));

      const b = ball.current;
      b.x += b.vx;
      b.y += b.vy;

      if (b.y - BALL_R < 0) {
        b.y = BALL_R;
        b.vy = -b.vy;
      }
      if (b.y + BALL_R > HEIGHT) {
        b.y = HEIGHT - BALL_R;
        b.vy = -b.vy;
      }

      if (
        b.vx < 0 &&
        b.x - BALL_R <= PLAYER_X + PADDLE_W &&
        b.x - BALL_R >= PLAYER_X - PADDLE_W &&
        b.y >= playerY.current &&
        b.y <= playerY.current + PADDLE_H
      ) {
        b.x = PLAYER_X + PADDLE_W + BALL_R;
        speed.current = Math.min(BALL_SPEED_MAX, speed.current + BALL_SPEED_INC);
        const offset =
          (b.y - (playerY.current + PADDLE_H / 2)) / (PADDLE_H / 2);
        b.vx = speed.current;
        b.vy = offset * speed.current * 0.9;
      }

      if (
        b.vx > 0 &&
        b.x + BALL_R >= AI_X &&
        b.x + BALL_R <= AI_X + PADDLE_W * 2 &&
        b.y >= aiY.current &&
        b.y <= aiY.current + PADDLE_H
      ) {
        b.x = AI_X - BALL_R;
        speed.current = Math.min(BALL_SPEED_MAX, speed.current + BALL_SPEED_INC);
        const offset = (b.y - (aiY.current + PADDLE_H / 2)) / (PADDLE_H / 2);
        b.vx = -speed.current;
        b.vy = offset * speed.current * 0.9;
      }

      if (b.x < -BALL_R * 2) {
        setScoreA((s) => s + 1);
        serve("ai");
      } else if (b.x > WIDTH + BALL_R * 2) {
        scorePRef.current += 1;
        setScoreP(scorePRef.current);
        setBest((bb) => Math.max(bb, scorePRef.current));
        serve("player");
      }

      force((n) => (n + 1) & 0xffff);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase, serve]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        pressed.current.up = true;
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        pressed.current.down = true;
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        start();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        pressed.current.up = false;
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        pressed.current.down = false;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [start]);

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={start}
          className="relative overflow-hidden border border-line bg-surface select-none"
          style={{ width: WIDTH, height: HEIGHT }}
          aria-label="Tennis"
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className="absolute left-1/2 w-px bg-line"
              style={{ top: i * 24 + 4, height: 14 }}
            />
          ))}
          <span
            className="absolute bg-accent"
            style={{
              left: PLAYER_X,
              top: playerY.current,
              width: PADDLE_W,
              height: PADDLE_H,
            }}
            aria-hidden
          />
          <span
            className="absolute bg-foreground"
            style={{
              left: AI_X,
              top: aiY.current,
              width: PADDLE_W,
              height: PADDLE_H,
            }}
            aria-hidden
          />
          <span
            className="absolute rounded-full bg-foreground"
            style={{
              left: ball.current.x - BALL_R,
              top: ball.current.y - BALL_R,
              width: BALL_R * 2,
              height: BALL_R * 2,
            }}
            aria-hidden
          />
          {phase === "idle" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">
                Tap to serve
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                ↑ ↓ or W/S
              </span>
            </span>
          )}
        </button>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          ↑ ↓ or W/S · space resets the score
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-3 gap-px overflow-hidden border border-line bg-line">
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              You
            </p>
            <p className="mt-3 font-serif text-5xl text-accent">{scoreP}</p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              CPU
            </p>
            <p className="mt-3 font-serif text-5xl">{scoreA}</p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Best
            </p>
            <p className="mt-3 font-serif text-5xl">{best}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 border border-line p-6 text-sm text-muted">
          <p className="font-mono text-xs uppercase tracking-[0.2em]">
            How to play
          </p>
          <p className="mt-2">
            Hold up or down to slide your paddle. Hit the ball on the edge of
            your paddle to launch it at a sharper angle. The ball speeds up
            every rally and resets when someone scores.
          </p>
        </div>
      </div>
    </div>
  );
}

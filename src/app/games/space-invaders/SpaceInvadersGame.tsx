"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

const WIDTH = 400;
const HEIGHT = 520;
const PLAYER_W = 36;
const PLAYER_H = 14;
const PLAYER_Y = HEIGHT - PLAYER_H - 24;
const PLAYER_SPEED = 5;
const ALIEN_W = 26;
const ALIEN_H = 18;
const ALIEN_COLS = 8;
const ALIEN_ROWS = 4;
const ALIEN_GAP_X = 12;
const ALIEN_GAP_Y = 14;
const ALIEN_STEP_X = 8;
const ALIEN_STEP_Y = 18;
const BULLET_W = 3;
const BULLET_H = 12;
const BULLET_SPEED = 8;
const BOMB_SPEED = 4;
const ALIEN_TICKS_INIT = 24;
const BOMB_CHANCE = 0.012;
const TICK_MS = 16;

type Alien = { x: number; y: number; row: number; col: number };
type Bullet = { x: number; y: number };
type Bomb = { x: number; y: number };
type Phase = "idle" | "playing" | "over" | "won";

function buildAliens(): Alien[] {
  const aliens: Alien[] = [];
  const totalW = ALIEN_COLS * ALIEN_W + (ALIEN_COLS - 1) * ALIEN_GAP_X;
  const startX = (WIDTH - totalW) / 2;
  for (let r = 0; r < ALIEN_ROWS; r++) {
    for (let c = 0; c < ALIEN_COLS; c++) {
      aliens.push({
        x: startX + c * (ALIEN_W + ALIEN_GAP_X),
        y: 60 + r * (ALIEN_H + ALIEN_GAP_Y),
        row: r,
        col: c,
      });
    }
  }
  return aliens;
}

const ROW_POINTS = [40, 20, 20, 10];

export default function SpaceInvadersGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = usePersistedBest("space-invaders");
  const [wave, setWave] = useState(1);
  const [, force] = useState(0);

  const playerX = useRef((WIDTH - PLAYER_W) / 2);
  const aliens = useRef<Alien[]>(buildAliens());
  const alienDx = useRef<1 | -1>(1);
  const alienStepCounter = useRef(0);
  const alienStepEvery = useRef(ALIEN_TICKS_INIT);
  const bullets = useRef<Bullet[]>([]);
  const bombs = useRef<Bomb[]>([]);
  const pressed = useRef({ left: false, right: false });
  const scoreRef = useRef(0);
  const waveRef = useRef(1);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const reset = useCallback(() => {
    playerX.current = (WIDTH - PLAYER_W) / 2;
    aliens.current = buildAliens();
    alienDx.current = 1;
    alienStepCounter.current = 0;
    alienStepEvery.current = ALIEN_TICKS_INIT;
    bullets.current = [];
    bombs.current = [];
    pressed.current = { left: false, right: false };
    scoreRef.current = 0;
    waveRef.current = 1;
    setScore(0);
    setWave(1);
    setPhase("playing");
  }, []);

  const nextWave = useCallback(() => {
    aliens.current = buildAliens();
    alienDx.current = 1;
    alienStepCounter.current = 0;
    waveRef.current += 1;
    alienStepEvery.current = Math.max(
      6,
      ALIEN_TICKS_INIT - (waveRef.current - 1) * 4,
    );
    bullets.current = [];
    bombs.current = [];
    setWave(waveRef.current);
  }, []);

  const start = useCallback(() => {
    if (phaseRef.current !== "playing") reset();
  }, [reset]);

  const fire = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    if (bullets.current.length >= 3) return;
    bullets.current.push({
      x: playerX.current + PLAYER_W / 2 - BULLET_W / 2,
      y: PLAYER_Y - BULLET_H,
    });
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      if (pressed.current.left) {
        playerX.current = Math.max(0, playerX.current - PLAYER_SPEED);
      }
      if (pressed.current.right) {
        playerX.current = Math.min(
          WIDTH - PLAYER_W,
          playerX.current + PLAYER_SPEED,
        );
      }

      for (const b of bullets.current) b.y -= BULLET_SPEED;
      bullets.current = bullets.current.filter((b) => b.y + BULLET_H > 0);

      for (const m of bombs.current) m.y += BOMB_SPEED;
      bombs.current = bombs.current.filter((m) => m.y < HEIGHT);

      alienStepCounter.current += 1;
      if (alienStepCounter.current >= alienStepEvery.current) {
        alienStepCounter.current = 0;
        let descend = false;
        for (const a of aliens.current) {
          const nx = a.x + alienDx.current * ALIEN_STEP_X;
          if (nx < 0 || nx + ALIEN_W > WIDTH) {
            descend = true;
            break;
          }
        }
        if (descend) {
          alienDx.current = (alienDx.current === 1 ? -1 : 1) as 1 | -1;
          for (const a of aliens.current) a.y += ALIEN_STEP_Y;
        } else {
          for (const a of aliens.current) a.x += alienDx.current * ALIEN_STEP_X;
        }
      }

      if (Math.random() < BOMB_CHANCE * (1 + (waveRef.current - 1) * 0.4)) {
        const cols = new Map<number, Alien>();
        for (const a of aliens.current) {
          const cur = cols.get(a.col);
          if (!cur || a.y > cur.y) cols.set(a.col, a);
        }
        const candidates = Array.from(cols.values());
        if (candidates.length > 0) {
          const shooter =
            candidates[Math.floor(Math.random() * candidates.length)];
          bombs.current.push({
            x: shooter.x + ALIEN_W / 2 - 1.5,
            y: shooter.y + ALIEN_H,
          });
        }
      }

      // bullet vs alien
      const remaining: Alien[] = [];
      let gained = 0;
      for (const a of aliens.current) {
        let hit = false;
        for (let i = 0; i < bullets.current.length; i++) {
          const b = bullets.current[i];
          if (
            b.x < a.x + ALIEN_W &&
            b.x + BULLET_W > a.x &&
            b.y < a.y + ALIEN_H &&
            b.y + BULLET_H > a.y
          ) {
            hit = true;
            bullets.current.splice(i, 1);
            gained += ROW_POINTS[a.row] ?? 10;
            break;
          }
        }
        if (!hit) remaining.push(a);
      }
      aliens.current = remaining;

      if (gained > 0) {
        scoreRef.current += gained;
        setScore(scoreRef.current);
        setBest((b) => Math.max(b, scoreRef.current));
      }

      // bomb vs player
      const pX = playerX.current;
      const pY = PLAYER_Y;
      let hit = false;
      for (const m of bombs.current) {
        if (
          m.x < pX + PLAYER_W &&
          m.x + 3 > pX &&
          m.y < pY + PLAYER_H &&
          m.y + 8 > pY
        ) {
          hit = true;
          break;
        }
      }
      // aliens reached player line
      let reached = false;
      for (const a of aliens.current) {
        if (a.y + ALIEN_H >= PLAYER_Y) {
          reached = true;
          break;
        }
      }
      if (hit || reached) {
        setPhase("over");
        return;
      }

      if (aliens.current.length === 0) {
        nextWave();
      }

      force((n) => (n + 1) & 0xffff);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase, nextWave]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        pressed.current.left = true;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        pressed.current.right = true;
      } else if (e.key === " ") {
        e.preventDefault();
        if (phaseRef.current === "playing") fire();
        else start();
      } else if (e.key === "Enter") {
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
  }, [fire, start]);

  const touchRef = useRef<{ startX: number; moved: boolean } | null>(null);
  const movePlayerToPointer = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = WIDTH / rect.width;
    const x = (e.clientX - rect.left) * sx - PLAYER_W / 2;
    playerX.current = Math.max(0, Math.min(WIDTH - PLAYER_W, x));
    force((n) => (n + 1) & 0xffff);
  }, []);
  const onBoardPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      if (phaseRef.current !== "playing") {
        start();
        touchRef.current = { startX: e.clientX, moved: true };
        return;
      }
      touchRef.current = { startX: e.clientX, moved: false };
      movePlayerToPointer(e);
    },
    [start, movePlayerToPointer],
  );
  const onBoardPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const t = touchRef.current;
      if (!t || phaseRef.current !== "playing") return;
      if (Math.abs(e.clientX - t.startX) > 6) t.moved = true;
      movePlayerToPointer(e);
    },
    [movePlayerToPointer],
  );
  const onBoardPointerUp = useCallback(() => {
    const t = touchRef.current;
    touchRef.current = null;
    if (!t) return;
    if (!t.moved && phaseRef.current === "playing") fire();
  }, [fire]);

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onPointerDown={onBoardPointerDown}
          onPointerMove={onBoardPointerMove}
          onPointerUp={onBoardPointerUp}
          onPointerCancel={() => (touchRef.current = null)}
          className="relative overflow-hidden border border-line select-none touch-none"
          style={{ width: WIDTH, height: HEIGHT, maxWidth: "100%", touchAction: "none", background: "#020617" }}
          aria-label="Space Invaders"
        >
          {aliens.current.map((a) => {
            const alienColor =
              a.row === 0
                ? "#f472b6"
                : a.row === 1 || a.row === 2
                  ? "#4ade80"
                  : "#22d3ee";
            return (
              <span
                key={`${a.row}-${a.col}`}
                className="absolute"
                style={{ left: a.x, top: a.y, width: ALIEN_W, height: ALIEN_H, background: alienColor }}
              />
            );
          })}
          {bullets.current.map((b, i) => (
            <span
              key={`bul-${i}`}
              className="absolute"
              style={{ left: b.x, top: b.y, width: BULLET_W, height: BULLET_H, background: "#facc15" }}
            />
          ))}
          {bombs.current.map((m, i) => (
            <span
              key={`bomb-${i}`}
              className="absolute"
              style={{ left: m.x, top: m.y, width: 3, height: 8, background: "#facc15" }}
            />
          ))}
          <span
            className="absolute"
            style={{
              left: playerX.current,
              top: PLAYER_Y,
              width: PLAYER_W,
              height: PLAYER_H,
              background: "#22d3ee",
            }}
            aria-hidden
          />
          <span
            className="absolute left-0 right-0"
            style={{ top: PLAYER_Y - 8, height: 1, background: "#22d3ee", opacity: 0.4 }}
            aria-hidden
          />
          {phase !== "playing" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">
                {phase === "idle" ? "Tap to start" : "Wiped out"}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {phase === "over"
                  ? "Space or click to retry"
                  : "← → move · space to fire"}
              </span>
            </span>
          )}
        </button>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          ← → or A/D · space to fire · drag to move, tap to fire
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-3 gap-px overflow-hidden border border-line bg-line">
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Score
            </p>
            <p className="mt-3 font-serif text-5xl">{score}</p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Best
            </p>
            <p className="mt-3 font-serif text-5xl text-accent">{best}</p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Wave
            </p>
            <p className="mt-3 font-serif text-5xl">{wave}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 border border-line p-6 text-sm text-muted">
          <p className="font-mono text-xs uppercase tracking-[0.2em]">
            How to play
          </p>
          <p className="mt-2">
            The aliens march sideways and drop a row when they hit a wall. Top
            row aliens are worth more. Clear the formation to start the next
            wave at a higher march speed. Bomb or breach ends the run.
          </p>
        </div>
      </div>
    </div>
  );
}

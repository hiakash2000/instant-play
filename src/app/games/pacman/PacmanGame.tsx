"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

const MAZE = [
  "###############",
  "#......#......#",
  "#.####.#.####.#",
  "#.............#",
  "#.##.###.###.##",
  "#....#...#....#",
  "###.##...##.###",
  "#.....# #.....#",
  "###.##.#.##.###",
  "#....#...#....#",
  "#.##.#####.##.#",
  "#.............#",
  "#.####.#.####.#",
  "#......#......#",
  "###############",
];

const COLS = MAZE[0].length;
const ROWS = MAZE.length;
const CELL = 28;
const WIDTH = COLS * CELL;
const HEIGHT = ROWS * CELL;
const TICK_MS = 150;

type Dir = "left" | "right" | "up" | "down" | null;
type Phase = "idle" | "playing" | "over" | "won";

function isWall(grid: string[], gx: number, gy: number) {
  if (gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) return true;
  return grid[gy][gx] === "#";
}

function step(dir: Dir): [number, number] {
  if (dir === "left") return [-1, 0];
  if (dir === "right") return [1, 0];
  if (dir === "up") return [0, -1];
  if (dir === "down") return [0, 1];
  return [0, 0];
}

function findPacmanStart() {
  for (let y = ROWS - 1; y >= 0; y--) {
    for (let x = 0; x < COLS; x++) {
      if (MAZE[y][x] === ".") return { x, y };
    }
  }
  return { x: 1, y: 1 };
}

function findGhostHomes(): { x: number; y: number }[] {
  return [
    { x: 7, y: 6 },
    { x: 7, y: 8 },
    { x: 6, y: 7 },
    { x: 8, y: 7 },
  ];
}

function initDots(): boolean[][] {
  const grid: boolean[][] = [];
  for (let y = 0; y < ROWS; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < COLS; x++) {
      row.push(MAZE[y][x] === ".");
    }
    grid.push(row);
  }
  return grid;
}

function countDots(grid: boolean[][]): number {
  let n = 0;
  for (const row of grid) for (const c of row) if (c) n += 1;
  return n;
}

function ghostNextDir(
  gx: number,
  gy: number,
  prev: Dir,
  pacX: number,
  pacY: number,
): Dir {
  const dirs: Dir[] = ["left", "right", "up", "down"];
  const reverse: Record<string, Dir> = {
    left: "right",
    right: "left",
    up: "down",
    down: "up",
  };
  const options: Dir[] = [];
  for (const d of dirs) {
    if (prev && d === reverse[prev]) continue;
    const [dx, dy] = step(d);
    if (!isWall(MAZE, gx + dx, gy + dy)) options.push(d);
  }
  if (options.length === 0) {
    const [dx, dy] = step(prev);
    if (!isWall(MAZE, gx + dx, gy + dy)) return prev;
    return null;
  }
  // Pick the option that minimises distance to pacman, with some noise.
  let best: Dir = options[0];
  let bestDist = Infinity;
  for (const d of options) {
    const [dx, dy] = step(d);
    const nx = gx + dx;
    const ny = gy + dy;
    const dist = Math.abs(nx - pacX) + Math.abs(ny - pacY);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  if (Math.random() < 0.18) {
    return options[Math.floor(Math.random() * options.length)];
  }
  return best;
}

export default function PacmanGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = usePersistedBest("pacman");
  const [level, setLevel] = useState(1);
  const [, force] = useState(0);

  const dots = useRef<boolean[][]>(initDots());
  const remainingRef = useRef(0);
  const pac = useRef<{ x: number; y: number; dir: Dir; queued: Dir }>({
    x: 0,
    y: 0,
    dir: null,
    queued: null,
  });
  const ghosts = useRef<{ x: number; y: number; dir: Dir }[]>([]);
  const ghostMoveCounter = useRef(0);
  const levelRef = useRef(1);
  const scoreRef = useRef(0);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const initLevel = useCallback((lvl: number) => {
    dots.current = initDots();
    remainingRef.current = countDots(dots.current);
    const start = findPacmanStart();
    pac.current = { x: start.x, y: start.y, dir: null, queued: null };
    const homes = findGhostHomes();
    const count = Math.min(homes.length, 1 + lvl);
    ghosts.current = homes.slice(0, count).map((h, i) => ({
      x: h.x,
      y: h.y,
      dir: (["left", "right", "up", "down"] as Dir[])[i % 4],
    }));
    ghostMoveCounter.current = 0;
  }, []);

  const reset = useCallback(() => {
    scoreRef.current = 0;
    levelRef.current = 1;
    setScore(0);
    setLevel(1);
    initLevel(1);
    setPhase("playing");
  }, [initLevel]);

  const start = useCallback(() => {
    if (phaseRef.current !== "playing") reset();
  }, [reset]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      const p = pac.current;
      // Pacman: try queued direction first, fall back to current.
      const tryMove = (d: Dir) => {
        if (!d) return false;
        const [dx, dy] = step(d);
        if (!isWall(MAZE, p.x + dx, p.y + dy)) {
          p.x += dx;
          p.y += dy;
          p.dir = d;
          return true;
        }
        return false;
      };
      if (p.queued && tryMove(p.queued)) {
        p.queued = null;
      } else if (!tryMove(p.dir)) {
        // wall; stop until input
      }

      if (dots.current[p.y]?.[p.x]) {
        dots.current[p.y][p.x] = false;
        remainingRef.current -= 1;
        scoreRef.current += 10;
        setScore(scoreRef.current);
        setBest((b) => Math.max(b, scoreRef.current));
      }

      // Ghosts move every other tick.
      ghostMoveCounter.current = 1 - ghostMoveCounter.current;
      if (ghostMoveCounter.current === 0) {
        for (const g of ghosts.current) {
          const dir = ghostNextDir(g.x, g.y, g.dir, p.x, p.y);
          g.dir = dir;
          const [dx, dy] = step(dir);
          if (!isWall(MAZE, g.x + dx, g.y + dy)) {
            g.x += dx;
            g.y += dy;
          }
        }
      }

      // Collision
      for (const g of ghosts.current) {
        if (g.x === p.x && g.y === p.y) {
          setPhase("over");
          return;
        }
      }

      if (remainingRef.current === 0) {
        scoreRef.current += 500;
        setScore(scoreRef.current);
        setBest((b) => Math.max(b, scoreRef.current));
        levelRef.current += 1;
        setLevel(levelRef.current);
        initLevel(levelRef.current);
      }

      force((n) => (n + 1) & 0xffff);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase, initLevel]);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const onBoardPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    touchStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onBoardPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const s = touchStartRef.current;
      touchStartRef.current = null;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (adx < 14 && ady < 14) {
        if (phaseRef.current !== "playing") start();
        return;
      }
      if (phaseRef.current !== "playing") return;
      pac.current.queued = adx > ady ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    },
    [start],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (phaseRef.current !== "playing") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          start();
        }
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        pac.current.queued = "left";
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        pac.current.queued = "right";
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        pac.current.queued = "up";
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        pac.current.queued = "down";
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start]);

  const wallCells = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (MAZE[y][x] === "#") out.push({ x, y });
      }
    }
    return out;
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onPointerDown={onBoardPointerDown}
          onPointerUp={onBoardPointerUp}
          onPointerCancel={() => (touchStartRef.current = null)}
          className="relative overflow-hidden border border-line bg-surface select-none touch-none"
          style={{ width: WIDTH, height: HEIGHT, maxWidth: "100%", touchAction: "none" }}
          aria-label="Pacman"
        >
          {wallCells.map((w) => (
            <span
              key={`w-${w.x}-${w.y}`}
              className="absolute bg-line"
              style={{
                left: w.x * CELL + 2,
                top: w.y * CELL + 2,
                width: CELL - 4,
                height: CELL - 4,
              }}
            />
          ))}
          {dots.current.map((row, y) =>
            row.map((isDot, x) =>
              isDot ? (
                <span
                  key={`d-${x}-${y}`}
                  className="absolute rounded-full bg-muted"
                  style={{
                    left: x * CELL + CELL / 2 - 2,
                    top: y * CELL + CELL / 2 - 2,
                    width: 4,
                    height: 4,
                  }}
                />
              ) : null,
            ),
          )}
          <span
            className="absolute rounded-full bg-accent"
            style={{
              left: pac.current.x * CELL + 3,
              top: pac.current.y * CELL + 3,
              width: CELL - 6,
              height: CELL - 6,
            }}
            aria-hidden
          />
          {ghosts.current.map((g, i) => (
            <span
              key={`g-${i}`}
              className={
                i === 0
                  ? "absolute rounded-t-full bg-rose-500/80"
                  : i === 1
                    ? "absolute rounded-t-full bg-sky-400/80"
                    : i === 2
                      ? "absolute rounded-t-full bg-orange-400/80"
                      : "absolute rounded-t-full bg-fuchsia-400/80"
              }
              style={{
                left: g.x * CELL + 3,
                top: g.y * CELL + 3,
                width: CELL - 6,
                height: CELL - 6,
              }}
            />
          ))}
          {phase !== "playing" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">
                {phase === "idle" ? "Tap to start" : "Caught"}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {phase === "over"
                  ? "Space or click to retry"
                  : "Arrow keys or WASD"}
              </span>
            </span>
          )}
        </button>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Arrows, WASD, or swipe · turn at junctions · eat every dot
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
              Level
            </p>
            <p className="mt-3 font-serif text-5xl">{level}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 border border-line p-6 text-sm text-muted">
          <p className="font-mono text-xs uppercase tracking-[0.2em]">
            How to play
          </p>
          <p className="mt-2">
            Steer Pacman through the maze and eat every dot. Each new level
            spawns one more ghost. Bump into a ghost and the run ends. Each dot
            is 10 points; clearing the maze adds 500.
          </p>
        </div>
      </div>
    </div>
  );
}

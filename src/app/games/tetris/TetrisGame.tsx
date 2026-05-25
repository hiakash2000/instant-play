"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

const COLS = 10;
const ROWS = 20;
const CELL = 24;
const WIDTH = COLS * CELL;
const HEIGHT = ROWS * CELL;
const TICK_MS = 16;

type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type Piece = { type: Cell; rotation: number; x: number; y: number };
type Phase = "idle" | "playing" | "over";

const SHAPES: number[][][][] = [
  [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
    [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
  ],
  [
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
  ],
  [
    [[0, 1, 0, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 0, 0], [1, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [1, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
  ],
  [
    [[0, 1, 1, 0], [1, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [1, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 0], [0, 0, 0, 0]],
  ],
  [
    [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
    [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
  ],
  [
    [[0, 0, 1, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
    [[0, 0, 0, 0], [1, 1, 1, 0], [1, 0, 0, 0], [0, 0, 0, 0]],
    [[1, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
  ],
  [
    [[1, 0, 0, 0], [1, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 0, 0], [1, 1, 1, 0], [0, 0, 1, 0], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [1, 1, 0, 0], [0, 0, 0, 0]],
  ],
];

const COLOR_HEX = [
  "",
  "#22d3ee",
  "#facc15",
  "#a855f7",
  "#22c55e",
  "#ef4444",
  "#3b82f6",
  "#f97316",
];

function makePiece(): Piece {
  return {
    type: (1 + Math.floor(Math.random() * 7)) as Cell,
    rotation: 0,
    x: 3,
    y: 0,
  };
}

function emptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => 0 as Cell),
  );
}

function getShape(p: Piece): number[][] {
  return SHAPES[p.type - 1][p.rotation % 4];
}

function canPlace(board: Cell[][], p: Piece): boolean {
  const shape = getShape(p);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!shape[r][c]) continue;
      const bx = p.x + c;
      const by = p.y + r;
      if (bx < 0 || bx >= COLS || by >= ROWS) return false;
      if (by >= 0 && board[by][bx]) return false;
    }
  }
  return true;
}

function merge(board: Cell[][], p: Piece): Cell[][] {
  const nb = board.map((row) => row.slice()) as Cell[][];
  const shape = getShape(p);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!shape[r][c]) continue;
      const bx = p.x + c;
      const by = p.y + r;
      if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
        nb[by][bx] = p.type;
      }
    }
  }
  return nb;
}

function clearLines(board: Cell[][]): { board: Cell[][]; cleared: number } {
  const keep = board.filter((row) => row.some((c) => c === 0));
  const cleared = ROWS - keep.length;
  const filler = Array.from({ length: cleared }, () =>
    Array.from({ length: COLS }, () => 0 as Cell),
  );
  return { board: [...filler, ...keep], cleared };
}

const LINE_POINTS = [0, 100, 300, 500, 800];

export default function TetrisGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = usePersistedBest("tetris");
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [, force] = useState(0);

  const board = useRef<Cell[][]>(emptyBoard());
  const piece = useRef<Piece>(makePiece());
  const dropAccum = useRef(0);
  const linesRef = useRef(0);
  const levelRef = useRef(1);
  const scoreRef = useRef(0);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const reset = useCallback(() => {
    board.current = emptyBoard();
    piece.current = makePiece();
    dropAccum.current = 0;
    linesRef.current = 0;
    levelRef.current = 1;
    scoreRef.current = 0;
    setScore(0);
    setLines(0);
    setLevel(1);
    setPhase("playing");
  }, []);

  const start = useCallback(() => {
    if (phaseRef.current !== "playing") reset();
  }, [reset]);

  const tryMove = useCallback((dx: number, dy: number) => {
    const next = {
      ...piece.current,
      x: piece.current.x + dx,
      y: piece.current.y + dy,
    };
    if (canPlace(board.current, next)) {
      piece.current = next;
      force((n) => (n + 1) & 0xffff);
      return true;
    }
    return false;
  }, []);

  const tryRotate = useCallback(() => {
    const candidate = {
      ...piece.current,
      rotation: (piece.current.rotation + 1) % 4,
    };
    for (const kick of [0, -1, 1, -2, 2]) {
      const test = { ...candidate, x: candidate.x + kick };
      if (canPlace(board.current, test)) {
        piece.current = test;
        force((n) => (n + 1) & 0xffff);
        return;
      }
    }
  }, []);

  const lockPiece = useCallback(() => {
    board.current = merge(board.current, piece.current);
    const { board: nb, cleared } = clearLines(board.current);
    board.current = nb;
    if (cleared > 0) {
      scoreRef.current += LINE_POINTS[cleared] * levelRef.current;
      linesRef.current += cleared;
      levelRef.current = 1 + Math.floor(linesRef.current / 10);
      setScore(scoreRef.current);
      setLines(linesRef.current);
      setLevel(levelRef.current);
      setBest((b) => Math.max(b, scoreRef.current));
    }
    piece.current = makePiece();
    if (!canPlace(board.current, piece.current)) {
      setPhase("over");
    }
  }, []);

  const hardDrop = useCallback(() => {
    let dy = 0;
    while (
      canPlace(board.current, {
        ...piece.current,
        y: piece.current.y + dy + 1,
      })
    ) {
      dy += 1;
    }
    piece.current = { ...piece.current, y: piece.current.y + dy };
    lockPiece();
    force((n) => (n + 1) & 0xffff);
  }, [lockPiece]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      const dropMs = Math.max(80, 600 - (levelRef.current - 1) * 50);
      dropAccum.current += TICK_MS;
      if (dropAccum.current >= dropMs) {
        dropAccum.current = 0;
        if (!tryMove(0, 1)) {
          lockPiece();
        }
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase, tryMove, lockPiece]);

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
        tryMove(-1, 0);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        tryMove(1, 0);
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        tryMove(0, 1);
      } else if (
        e.key === "ArrowUp" ||
        e.key === "w" ||
        e.key === "W" ||
        e.key === "x" ||
        e.key === "X"
      ) {
        e.preventDefault();
        tryRotate();
      } else if (e.key === " ") {
        e.preventDefault();
        hardDrop();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [start, tryMove, tryRotate, hardDrop]);

  const touchRef = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    startT: number;
    moved: boolean;
    cellPx: number;
  } | null>(null);
  const onBoardPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      if (phaseRef.current !== "playing") {
        start();
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      touchRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        startT: performance.now(),
        moved: false,
        cellPx: Math.max(12, rect.width / COLS),
      };
    },
    [start],
  );
  const onBoardPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const t = touchRef.current;
    if (!t || phaseRef.current !== "playing") return;
    const dx = e.clientX - t.lastX;
    const dy = e.clientY - t.lastY;
    let stepped = false;
    if (Math.abs(dx) >= t.cellPx) {
      const steps = Math.trunc(dx / t.cellPx);
      for (let i = 0; i < Math.abs(steps); i++) tryMove(steps > 0 ? 1 : -1, 0);
      t.lastX += steps * t.cellPx;
      stepped = true;
    }
    if (dy >= t.cellPx) {
      const steps = Math.trunc(dy / t.cellPx);
      for (let i = 0; i < steps; i++) tryMove(0, 1);
      t.lastY += steps * t.cellPx;
      stepped = true;
    }
    if (stepped) t.moved = true;
  }, [tryMove]);
  const onBoardPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const t = touchRef.current;
      touchRef.current = null;
      if (!t || phaseRef.current !== "playing") return;
      const dx = e.clientX - t.startX;
      const dy = e.clientY - t.startY;
      const dt = performance.now() - t.startT;
      if (!t.moved && Math.abs(dx) < t.cellPx && Math.abs(dy) < t.cellPx) {
        tryRotate();
        return;
      }
      if (dy > t.cellPx * 4 && dt < 220) {
        hardDrop();
      }
    },
    [tryRotate, hardDrop],
  );

  const display = board.current.map((row) => row.slice()) as Cell[][];
  if (phase !== "idle") {
    const shape = getShape(piece.current);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!shape[r][c]) continue;
        const x = piece.current.x + c;
        const y = piece.current.y + r;
        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
          display[y][x] = piece.current.type;
        }
      }
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <div
          onPointerDown={onBoardPointerDown}
          onPointerMove={onBoardPointerMove}
          onPointerUp={onBoardPointerUp}
          onPointerCancel={() => (touchRef.current = null)}
          className="relative overflow-hidden border border-line select-none touch-none"
          style={{ width: WIDTH, height: HEIGHT, maxWidth: "100%", touchAction: "none", background: "#0f172a" }}
        >
          {display.map((row, r) =>
            row.map((cell, c) => (
              <span
                key={`${r}-${c}`}
                className="absolute border border-line/20"
                style={{
                  left: c * CELL,
                  top: r * CELL,
                  width: CELL,
                  height: CELL,
                  background: cell ? COLOR_HEX[cell] : undefined,
                }}
              />
            )),
          )}
          {phase !== "playing" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">
                {phase === "idle" ? "Press space to start" : "Game over"}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {phase === "over" ? "Space to retry" : "← → ↓ rotate ↑"}
              </span>
            </span>
          )}
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          ← → move · ↓ soft drop · ↑ rotate · space hard drop · drag/tap on touch
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line">
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
              Lines
            </p>
            <p className="mt-3 font-serif text-4xl">{lines}</p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Level
            </p>
            <p className="mt-3 font-serif text-4xl">{level}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 border border-line p-6 text-sm text-muted">
          <p className="font-mono text-xs uppercase tracking-[0.2em]">
            How to play
          </p>
          <p className="mt-2">
            Stack the tetrominoes and complete horizontal rows. Filled rows
            clear and award points; clearing four at once is a Tetris and is
            worth eight times as much. Every ten lines bumps the level and
            speeds up the fall.
          </p>
        </div>
      </div>
    </div>
  );
}

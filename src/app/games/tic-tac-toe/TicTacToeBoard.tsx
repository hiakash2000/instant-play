"use client";

import { useEffect, useState } from "react";

type Cell = "X" | "O" | null;

const LINES: [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function evaluate(cells: Cell[]): {
  winner: Cell;
  line: [number, number, number] | null;
} {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return { winner: cells[a], line };
    }
  }
  return { winner: null, line: null };
}

function minimax(
  cells: Cell[],
  mover: "X" | "O",
): { score: number; move: number } {
  const { winner } = evaluate(cells);
  if (winner === "O") return { score: 1, move: -1 };
  if (winner === "X") return { score: -1, move: -1 };
  if (cells.every(Boolean)) return { score: 0, move: -1 };

  let best = mover === "O" ? -Infinity : Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (cells[i]) continue;
    const next = cells.slice();
    next[i] = mover;
    const { score } = minimax(next, mover === "O" ? "X" : "O");
    if (mover === "O" ? score > best : score < best) {
      best = score;
      bestMove = i;
    }
  }
  return { score: best, move: bestMove };
}

function aiMove(cells: Cell[]): number {
  return minimax(cells, "O").move;
}

export default function TicTacToeBoard() {
  const [cells, setCells] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");

  const { winner, line } = evaluate(cells);
  const isDraw = !winner && cells.every(Boolean);
  const status: string = winner
    ? winner === "X"
      ? "You win"
      : "CPU wins"
    : isDraw
      ? "Draw"
      : turn === "X"
        ? "Your turn"
        : "CPU thinking";

  useEffect(() => {
    if (turn !== "O" || winner || isDraw) return;
    const t = window.setTimeout(() => {
      const move = aiMove(cells);
      if (move < 0) return;
      const next = cells.slice();
      next[move] = "O";
      setCells(next);
      setTurn("X");
    }, 320);
    return () => window.clearTimeout(t);
  }, [turn, cells, winner, isDraw]);

  function play(i: number) {
    if (cells[i] || winner || turn !== "X") return;
    const next = cells.slice();
    next[i] = "X";
    setCells(next);
    setTurn("O");
  }

  function reset() {
    setCells(Array(9).fill(null));
    setTurn("X");
  }

  return (
    <div className="flex flex-col items-start gap-8">
      <div
        className="font-mono text-xs uppercase tracking-[0.2em] text-muted"
        aria-live="polite"
      >
        {status}
      </div>

      <div
        className="grid grid-cols-3 gap-2"
        role="grid"
        aria-label="Tic Tac Toe board"
      >
        {cells.map((c, i) => {
          const inWinLine = line?.includes(i);
          const disabled = Boolean(c) || Boolean(winner) || turn !== "X";
          return (
            <button
              key={i}
              type="button"
              onClick={() => play(i)}
              disabled={disabled}
              aria-label={`Cell ${i + 1}${c ? `, ${c}` : ", empty"}`}
              className={`flex h-24 w-24 items-center justify-center border border-line font-serif text-5xl transition-colors sm:h-28 sm:w-28 ${
                c ? "text-foreground" : "text-muted hover:bg-surface-hover"
              } ${inWinLine ? "border-accent text-accent" : ""} disabled:cursor-default`}
            >
              {c ?? ""}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={reset}
        className="border border-line px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:border-accent hover:text-accent"
      >
        New game
      </button>
    </div>
  );
}

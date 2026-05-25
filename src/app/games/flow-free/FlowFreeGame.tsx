"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

type Cell = [number, number];
type Endpoint = { color: string; pos: Cell };
type Level = { size: number; endpoints: Endpoint[] };

const LEVELS: Level[] = [
  {
    size: 5,
    endpoints: [
      { color: "rose", pos: [0, 0] },
      { color: "rose", pos: [4, 4] },
      { color: "amber", pos: [4, 0] },
      { color: "amber", pos: [0, 4] },
      { color: "sky", pos: [2, 1] },
      { color: "sky", pos: [3, 3] },
      { color: "emerald", pos: [1, 1] },
      { color: "emerald", pos: [3, 1] },
    ],
  },
  {
    size: 5,
    endpoints: [
      { color: "rose", pos: [0, 0] },
      { color: "rose", pos: [3, 1] },
      { color: "amber", pos: [4, 4] },
      { color: "amber", pos: [2, 2] },
      { color: "sky", pos: [4, 0] },
      { color: "sky", pos: [1, 3] },
      { color: "emerald", pos: [0, 4] },
      { color: "emerald", pos: [3, 4] },
    ],
  },
  {
    size: 6,
    endpoints: [
      { color: "rose", pos: [0, 0] },
      { color: "rose", pos: [5, 5] },
      { color: "amber", pos: [0, 5] },
      { color: "amber", pos: [5, 0] },
      { color: "sky", pos: [2, 2] },
      { color: "sky", pos: [3, 3] },
      { color: "emerald", pos: [1, 4] },
      { color: "emerald", pos: [4, 1] },
      { color: "fuchsia", pos: [2, 4] },
      { color: "fuchsia", pos: [4, 3] },
    ],
  },
];

const COLOR_HEX: Record<string, string> = {
  rose: "#ef4444",
  amber: "#facc15",
  sky: "#3b82f6",
  emerald: "#22c55e",
  fuchsia: "#a855f7",
  orange: "#f97316",
};

const CELL = 56;

function cellKey([x, y]: Cell) {
  return `${x},${y}`;
}

function adjacent(a: Cell, b: Cell) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}

export default function FlowFreeGame() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [best, setBest] = usePersistedBest("flow-free");
  const level = LEVELS[levelIdx];
  const [paths, setPaths] = useState<Record<string, Cell[]>>({});
  const [dragging, setDragging] = useState<{ color: string; path: Cell[] } | null>(null);

  useEffect(() => {
    setPaths({});
    setDragging(null);
  }, [levelIdx]);

  const endpointAt = useCallback(
    (c: Cell) => level.endpoints.find((e) => e.pos[0] === c[0] && e.pos[1] === c[1]),
    [level],
  );

  const cellOwner = useMemo(() => {
    const map = new Map<string, { color: string; idx: number }>();
    for (const [color, path] of Object.entries(paths)) {
      path.forEach((c, i) => map.set(cellKey(c), { color, idx: i }));
    }
    return map;
  }, [paths]);

  const startDrag = (c: Cell) => {
    const ep = endpointAt(c);
    if (ep) {
      setPaths((p) => {
        const n = { ...p };
        delete n[ep.color];
        return n;
      });
      setDragging({ color: ep.color, path: [c] });
    } else {
      const owner = cellOwner.get(cellKey(c));
      if (owner) {
        setPaths((p) => {
          const cut = p[owner.color].slice(0, owner.idx + 1);
          return { ...p, [owner.color]: cut };
        });
        setDragging({ color: owner.color, path: paths[owner.color].slice(0, owner.idx + 1) });
      }
    }
  };

  const continueDrag = (c: Cell) => {
    if (!dragging) return;
    if (c[0] < 0 || c[1] < 0 || c[0] >= level.size || c[1] >= level.size) return;
    const last = dragging.path[dragging.path.length - 1];
    if (!adjacent(last, c)) return;
    // backtrack
    const existingIdx = dragging.path.findIndex((p) => p[0] === c[0] && p[1] === c[1]);
    if (existingIdx !== -1) {
      const newPath = dragging.path.slice(0, existingIdx + 1);
      setDragging({ ...dragging, path: newPath });
      return;
    }
    // can't enter another color's path
    const owner = cellOwner.get(cellKey(c));
    if (owner && owner.color !== dragging.color) return;
    // ok if it's our own other endpoint or empty
    const ep = endpointAt(c);
    if (ep && ep.color !== dragging.color) return;
    const newPath = [...dragging.path, c];
    setDragging({ ...dragging, path: newPath });
    if (ep && ep.color === dragging.color && newPath.length > 1) {
      // Completed
      setPaths((p) => ({ ...p, [dragging.color]: newPath }));
      setDragging(null);
    }
  };

  const endDrag = () => {
    if (!dragging) return;
    setPaths((p) => ({ ...p, [dragging.color]: dragging.path }));
    setDragging(null);
  };

  const allConnected = useMemo(() => {
    const colors = new Set(level.endpoints.map((e) => e.color));
    for (const c of colors) {
      const path = paths[c];
      if (!path) return false;
      const eps = level.endpoints.filter((e) => e.color === c);
      const [a, b] = eps;
      const first = path[0];
      const last = path[path.length - 1];
      const ok =
        (first[0] === a.pos[0] && first[1] === a.pos[1] && last[0] === b.pos[0] && last[1] === b.pos[1]) ||
        (first[0] === b.pos[0] && first[1] === b.pos[1] && last[0] === a.pos[0] && last[1] === a.pos[1]);
      if (!ok) return false;
    }
    // All cells covered.
    let covered = 0;
    for (const p of Object.values(paths)) covered += p.length;
    return covered === level.size * level.size;
  }, [paths, level]);

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <div
          className="relative border border-line bg-surface select-none"
          style={{ width: level.size * CELL, height: level.size * CELL }}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        >
          {Array.from({ length: level.size }).map((_, y) =>
            Array.from({ length: level.size }).map((_, x) => {
              const c: Cell = [x, y];
              const ep = endpointAt(c);
              const owner = cellOwner.get(cellKey(c));
              const dragOwn = dragging?.path.some((p) => p[0] === x && p[1] === y) ? dragging.color : null;
              const color = dragOwn ?? owner?.color ?? null;
              return (
                <span
                  key={`${x}-${y}`}
                  className="absolute border border-line/40"
                  style={{ left: x * CELL, top: y * CELL, width: CELL, height: CELL }}
                  onPointerDown={() => startDrag(c)}
                  onPointerEnter={() => continueDrag(c)}
                >
                  {color && !ep && (
                    <span
                      className="absolute inset-2 opacity-70"
                      style={{ background: COLOR_HEX[color] }}
                    />
                  )}
                  {ep && (
                    <span
                      className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{ background: COLOR_HEX[ep.color] }}
                    />
                  )}
                </span>
              );
            }),
          )}
          {allConnected && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/85 text-center">
              <span className="font-serif text-3xl tracking-tight">Solved</span>
              <button
                type="button"
                onClick={() => {
                  setBest((b) => Math.max(b, levelIdx + 1));
                  setLevelIdx((i) => Math.min(LEVELS.length - 1, i + 1));
                }}
                className="pointer-events-auto mt-2 border border-line px-4 py-2 text-sm hover:bg-surface-hover"
              >
                Next puzzle
              </button>
            </span>
          )}
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Drag from one dot to its match · drag back to undo
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-3 gap-px overflow-hidden border border-line bg-line">
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Puzzle</p>
            <p className="mt-3 font-serif text-5xl">
              {levelIdx + 1}/{LEVELS.length}
            </p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Pipes</p>
            <p className="mt-3 font-serif text-5xl text-accent">
              {Object.keys(paths).length}/{level.endpoints.length / 2}
            </p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Best</p>
            <p className="mt-3 font-serif text-5xl text-accent">{best}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPaths({})}
            className="flex-1 border border-line px-4 py-3 text-sm hover:bg-surface-hover"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setLevelIdx((i) => (i + 1) % LEVELS.length)}
            className="flex-1 border border-line px-4 py-3 text-sm hover:bg-surface-hover"
          >
            Skip
          </button>
        </div>
        <div className="flex flex-col gap-2 border border-line p-6 text-sm text-muted">
          <p className="font-mono text-xs uppercase tracking-[0.2em]">How to play</p>
          <p className="mt-2">
            Drag from a dot to its same-color twin. Paths can&apos;t cross.
            Cover every cell to solve.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";
import ResponsivePlayfield from "../ResponsivePlayfield";
import { playSound } from "../sound";

type Cell = { dx: number; dy: number };
type Piece = { id: number; cells: Cell[] };
type Placement = { x: number; y: number };

const SHAPES: Cell[][] = [
  [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }],
  [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }],
  [{ dx: 0, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }],
  [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 2, dy: 0 }, { dx: 1, dy: 1 }],
  [{ dx: 0, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }],
  [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 }, { dx: 2, dy: 1 }],
];

const CELL = 56;
const TRAY_CELL = 26;
const CAT_COLORS = ["#f472b6", "#facc15", "#22d3ee", "#a78bfa", "#fb7185", "#4ade80", "#fb923c", "#60a5fa"];

function makeLevel(level: number) {
  const size = Math.min(3 + level, 6);
  const count = Math.min(3 + Math.floor(level / 1.5), 5);
  const pieces: Piece[] = [];
  for (let i = 0; i < count; i++) {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    pieces.push({ id: i, cells: shape });
  }
  return { size, pieces };
}

function pieceBounds(cells: Cell[]) {
  const minX = Math.min(...cells.map((c) => c.dx));
  const minY = Math.min(...cells.map((c) => c.dy));
  const maxX = Math.max(...cells.map((c) => c.dx));
  const maxY = Math.max(...cells.map((c) => c.dy));
  return { minX, minY, maxX, maxY };
}

type Phase = "playing" | "won";
type Drag = {
  id: number;
  px: number;
  py: number;
  offX: number;
  offY: number;
};

export default function CatsGame() {
  const [level, setLevel] = useState(1);
  const [best, setBest] = usePersistedBest("cats-organized-neatly");
  const [phase, setPhase] = useState<Phase>("playing");
  const [{ size, pieces }, setLevelData] = useState<{
    size: number;
    pieces: Piece[];
  }>({ size: 4, pieces: [] });
  const [placed, setPlaced] = useState<Record<number, Placement>>({});
  const [drag, setDrag] = useState<Drag | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLevelData(makeLevel(level));
    setPlaced({});
    setPhase("playing");
  }, [level]);

  const occupied = useMemo(() => {
    const map = new Map<string, number>();
    for (const [pidStr, pos] of Object.entries(placed)) {
      const pid = Number(pidStr);
      const piece = pieces.find((p) => p.id === pid);
      if (!piece) continue;
      for (const c of piece.cells) {
        map.set(`${pos.x + c.dx},${pos.y + c.dy}`, pid);
      }
    }
    return map;
  }, [placed, pieces]);

  const tryPlace = useCallback(
    (id: number, gx: number, gy: number) => {
      const piece = pieces.find((p) => p.id === id);
      if (!piece) return false;
      for (const c of piece.cells) {
        const x = gx + c.dx;
        const y = gy + c.dy;
        if (x < 0 || y < 0 || x >= size || y >= size) return false;
        const key = `${x},${y}`;
        const owner = occupied.get(key);
        if (owner !== undefined && owner !== id) return false;
      }
      setPlaced((p) => ({ ...p, [id]: { x: gx, y: gy } }));
      return true;
    },
    [pieces, size, occupied],
  );

  useEffect(() => {
    if (pieces.length > 0 && Object.keys(placed).length === pieces.length) {
      playSound("win");
      setPhase("won");
    }
  }, [placed, pieces]);

  const beginDrag = (
    id: number,
    ev: React.PointerEvent,
    offX: number,
    offY: number,
  ) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    ev.currentTarget.setPointerCapture(ev.pointerId);
    setPlaced((p) => {
      if (!(id in p)) return p;
      const n = { ...p };
      delete n[id];
      return n;
    });
    setDrag({
      id,
      px: ev.clientX - rect.left,
      py: ev.clientY - rect.top,
      offX,
      offY,
    });
  };

  const onPointerMove = (ev: React.PointerEvent) => {
    if (!drag) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setDrag({
      ...drag,
      px: ev.clientX - rect.left,
      py: ev.clientY - rect.top,
    });
  };

  const onPointerUp = (ev: React.PointerEvent) => {
    if (!drag) return;
    const board = boardRef.current;
    if (board) {
      const r = board.getBoundingClientRect();
      if (
        ev.clientX >= r.left &&
        ev.clientX <= r.right &&
        ev.clientY >= r.top &&
        ev.clientY <= r.bottom
      ) {
        const gx = Math.round((ev.clientX - r.left) / CELL - drag.offX);
        const gy = Math.round((ev.clientY - r.top) / CELL - drag.offY);
        tryPlace(drag.id, gx, gy);
      }
    }
    setDrag(null);
  };

  const draggingPiece = drag ? pieces.find((p) => p.id === drag.id) : null;
  const trayPieces = pieces.filter(
    (p) => !(p.id in placed) && drag?.id !== p.id,
  );

  let previewCell: { x: number; y: number } | null = null;
  if (drag && containerRef.current && boardRef.current) {
    const rc = containerRef.current.getBoundingClientRect();
    const rb = boardRef.current.getBoundingClientRect();
    const localX = drag.px - (rb.left - rc.left);
    const localY = drag.py - (rb.top - rc.top);
    if (
      localX >= 0 &&
      localY >= 0 &&
      localX <= size * CELL &&
      localY <= size * CELL
    ) {
      previewCell = {
        x: Math.round(localX / CELL - drag.offX),
        y: Math.round(localY / CELL - drag.offY),
      };
    }
  }

  return (
    <div className="grid gap-10 px-4 sm:px-0 lg:grid-cols-[auto_1fr]">
      <div
        ref={containerRef}
        className="relative flex flex-col gap-4 select-none touch-none"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
      >
        <ResponsivePlayfield width={size * CELL} height={size * CELL}>
        <div
          ref={boardRef}
          className="relative h-full w-full border border-line bg-surface"
        >
          {Array.from({ length: size }).map((_, y) =>
            Array.from({ length: size }).map((_, x) => (
              <span
                key={`${x}-${y}`}
                className="absolute border border-line/60"
                style={{
                  left: x * CELL,
                  top: y * CELL,
                  width: CELL,
                  height: CELL,
                }}
              />
            )),
          )}
          {Object.entries(placed).map(([idStr, pos]) => {
            const id = Number(idStr);
            const piece = pieces.find((p) => p.id === id);
            if (!piece) return null;
            return (
              <button
                key={id}
                type="button"
                className="absolute cursor-grab active:cursor-grabbing"
                style={{ left: pos.x * CELL, top: pos.y * CELL }}
                onPointerDown={(e) => {
                  const r = boardRef.current!.getBoundingClientRect();
                  const offX = (e.clientX - r.left) / CELL - pos.x;
                  const offY = (e.clientY - r.top) / CELL - pos.y;
                  beginDrag(id, e, offX, offY);
                }}
              >
                {piece.cells.map((c, i) => (
                  <span
                    key={i}
                    className="absolute"
                    style={{
                      left: c.dx * CELL + 2,
                      top: c.dy * CELL + 2,
                      width: CELL - 4,
                      height: CELL - 4,
                      background: CAT_COLORS[id % CAT_COLORS.length],
                      opacity: 0.85,
                    }}
                  />
                ))}
              </button>
            );
          })}
          {previewCell && draggingPiece && (
            <span aria-hidden>
              {draggingPiece.cells.map((c, i) => {
                const x = previewCell.x + c.dx;
                const y = previewCell.y + c.dy;
                const inside =
                  x >= 0 && y >= 0 && x < size && y < size;
                if (!inside) return null;
                const owner = occupied.get(`${x},${y}`);
                const conflict = owner !== undefined && owner !== drag!.id;
                return (
                  <span
                    key={i}
                    className="absolute"
                    style={{
                      left: x * CELL + 2,
                      top: y * CELL + 2,
                      width: CELL - 4,
                      height: CELL - 4,
                      background: conflict ? "rgba(244,63,94,0.4)" : CAT_COLORS[drag!.id % CAT_COLORS.length],
                      opacity: conflict ? 1 : 0.35,
                    }}
                  />
                );
              })}
            </span>
          )}
          {phase === "won" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 text-center">
              <span className="font-serif text-2xl tracking-tight">
                Level cleared
              </span>
              <button
                type="button"
                onClick={() => {
                  setBest((b) => Math.max(b, level));
                  setLevel((l) => l + 1);
                }}
                className="pointer-events-auto mt-2 border border-line px-4 py-2 text-sm hover:bg-surface-hover"
              >
                Next level
              </button>
            </span>
          )}
        </div>
        </ResponsivePlayfield>

        <div className="relative flex min-h-[120px] flex-wrap gap-3 border border-line bg-surface p-3">
          {trayPieces.length === 0 && (
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Tray empty — place or drag back to remove
            </p>
          )}
          {trayPieces.map((piece) => {
            const b = pieceBounds(piece.cells);
            const w = (b.maxX - b.minX + 1) * TRAY_CELL;
            const h = (b.maxY - b.minY + 1) * TRAY_CELL;
            return (
              <button
                key={piece.id}
                type="button"
                className="relative cursor-grab active:cursor-grabbing"
                style={{ width: w, height: h }}
                onPointerDown={(e) => {
                  beginDrag(piece.id, e, 0.5, 0.5);
                }}
              >
                {piece.cells.map((c, i) => (
                  <span
                    key={i}
                    className="absolute"
                    style={{
                      left: (c.dx - b.minX) * TRAY_CELL,
                      top: (c.dy - b.minY) * TRAY_CELL,
                      width: TRAY_CELL - 2,
                      height: TRAY_CELL - 2,
                      background: CAT_COLORS[piece.id % CAT_COLORS.length],
                      opacity: 0.75,
                    }}
                  />
                ))}
              </button>
            );
          })}
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Drag cats from the tray onto the grid · drop off-board to return
        </p>

        {drag && draggingPiece && (
          <span
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: drag.px - drag.offX * CELL,
              top: drag.py - drag.offY * CELL,
            }}
          >
            {draggingPiece.cells.map((c, i) => (
              <span
                key={i}
                className="absolute"
                style={{
                  left: c.dx * CELL + 2,
                  top: c.dy * CELL + 2,
                  width: CELL - 4,
                  height: CELL - 4,
                  background: CAT_COLORS[draggingPiece.id % CAT_COLORS.length],
                }}
              />
            ))}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-3 gap-px overflow-hidden border border-line bg-line">
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Level
            </p>
            <p className="mt-3 font-serif text-5xl">{level}</p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Placed
            </p>
            <p className="mt-3 font-serif text-5xl text-accent">
              {Object.keys(placed).length}/{pieces.length}
            </p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Best
            </p>
            <p className="mt-3 font-serif text-5xl text-accent">{best}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 border border-line p-6 text-sm text-muted">
          <p className="font-mono text-xs uppercase tracking-[0.2em]">
            How to play
          </p>
          <p className="mt-2">
            Each level generates a small grid and a handful of cat-shaped tiles.
            Drag them from the tray onto the grid until every piece is placed.
            They can&apos;t overlap and they can&apos;t hang off the edge — a
            faint highlight shows where the piece will land.
          </p>
        </div>
      </div>
    </div>
  );
}

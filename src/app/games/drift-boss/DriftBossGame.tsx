"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

const WIDTH = 480;
const HEIGHT = 480;
const TILE = 60;
const ROWS = HEIGHT / TILE;
const TICK_MS = 400;
const FOCUS_COL = 3;
const FOCUS_ROW = 4;

type Phase = "idle" | "playing" | "over";
type Dir = "right" | "up";

type Tile = { gx: number; gy: number };

function buildInitialRoad(): Tile[] {
  const tiles: Tile[] = [];
  for (let i = 0; i < 4; i++) tiles.push({ gx: i, gy: ROWS - 2 });
  return tiles;
}

function lastDir(tiles: Tile[]): Dir {
  if (tiles.length < 2) return "right";
  const a = tiles[tiles.length - 2];
  const b = tiles[tiles.length - 1];
  return b.gx > a.gx ? "right" : "up";
}

function extendOnce(tiles: Tile[]) {
  const last = tiles[tiles.length - 1];
  const dir = lastDir(tiles);
  const turn = Math.random() < 0.45;
  if (turn) {
    if (dir === "right") tiles.push({ gx: last.gx, gy: last.gy - 1 });
    else tiles.push({ gx: last.gx + 1, gy: last.gy });
  } else {
    if (dir === "right") tiles.push({ gx: last.gx + 1, gy: last.gy });
    else tiles.push({ gx: last.gx, gy: last.gy - 1 });
  }
}

export default function DriftBossGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = usePersistedBest("drift-boss");
  const [, force] = useState(0);

  const tilesRef = useRef<Tile[]>(buildInitialRoad());
  const carRef = useRef({ gx: 0, gy: ROWS - 2, dir: "right" as Dir });
  const carIndexRef = useRef(0);
  const offsetRef = useRef({ x: 0, y: 0 });
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const computeCamera = useCallback((gx: number, gy: number) => {
    const x = Math.max(0, (gx - FOCUS_COL) * TILE);
    const y = Math.min(0, (gy - FOCUS_ROW) * TILE);
    return { x, y };
  }, []);

  const reset = useCallback(() => {
    tilesRef.current = buildInitialRoad();
    while (tilesRef.current.length < 12) extendOnce(tilesRef.current);
    carRef.current = { gx: 0, gy: ROWS - 2, dir: "right" };
    carIndexRef.current = 0;
    offsetRef.current = computeCamera(0, ROWS - 2);
    setScore(0);
    setPhase("playing");
  }, [computeCamera]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      const car = carRef.current;
      const next = { ...car };
      if (car.dir === "right") next.gx += 1;
      else next.gy -= 1;

      const aheadTile = tilesRef.current[carIndexRef.current + 1];
      if (!aheadTile || aheadTile.gx !== next.gx || aheadTile.gy !== next.gy) {
        setPhase("over");
        return;
      }

      carRef.current = next;
      carIndexRef.current += 1;

      while (tilesRef.current.length - carIndexRef.current < 12) {
        extendOnce(tilesRef.current);
      }

      offsetRef.current = computeCamera(next.gx, next.gy);

      setScore((s) => {
        const ns = s + 1;
        setBest((b) => Math.max(b, ns));
        return ns;
      });
      force((n) => (n + 1) & 0xffff);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase, computeCamera]);

  const flip = useCallback(() => {
    if (phaseRef.current === "idle" || phaseRef.current === "over") {
      reset();
      return;
    }
    carRef.current.dir = carRef.current.dir === "right" ? "up" : "right";
  }, [reset]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Enter" || e.key === "ArrowUp") {
        e.preventDefault();
        flip();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flip]);

  const camOffset = offsetRef.current;

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={flip}
          className="relative overflow-hidden border border-line bg-surface"
          style={{ width: WIDTH, height: HEIGHT }}
          aria-label="Flip"
        >
          {tilesRef.current.map((t, i) => {
            const sx = t.gx * TILE - camOffset.x;
            const sy = t.gy * TILE - camOffset.y;
            if (sx < -TILE || sx > WIDTH || sy < -TILE || sy > HEIGHT) {
              return null;
            }
            return (
              <span
                key={i}
                className="absolute bg-line"
                style={{
                  left: sx,
                  top: sy,
                  width: TILE - 2,
                  height: TILE - 2,
                }}
              />
            );
          })}
          <span
            className="absolute bg-accent"
            style={{
              left: carRef.current.gx * TILE - camOffset.x + 14,
              top: carRef.current.gy * TILE - camOffset.y + 14,
              width: TILE - 30,
              height: TILE - 30,
            }}
            aria-hidden
          />
          {phase !== "playing" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">
                {phase === "idle" ? "Tap to start" : "Off the road"}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                Click or space to {phase === "idle" ? "begin" : "retry"}
              </span>
            </span>
          )}
        </button>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Click the board or press space to flip steering
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line">
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Tiles
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
            Two tiles per second. Each tap flips your steering between right and
            up. The road turns at random — flip when you see the corner
            coming. The camera follows so the car is always in view.
          </p>
        </div>
      </div>
    </div>
  );
}

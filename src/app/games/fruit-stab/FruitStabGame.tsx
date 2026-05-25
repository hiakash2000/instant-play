"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

const WIDTH = 360;
const HEIGHT = 560;
const CENTER_X = WIDTH / 2;
const CENTER_Y = 220;
const FRUIT_R = 60;
const KNIFE_LEN = 80;
const TICK_MS = 16;

type Phase = "idle" | "playing" | "over" | "won";

function levelConfig(level: number) {
  return {
    target: 6 + level,
    speed: 0.025 + level * 0.005,
    initial: Math.min(3 + Math.floor(level / 2), 6),
  };
}

export default function FruitStabGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState(1);
  const [thrown, setThrown] = useState(0);
  const [best, setBest] = usePersistedBest("fruit-stab");
  const [, force] = useState(0);

  const stuckRef = useRef<number[]>([]);
  const rotationRef = useRef(0);
  const targetRef = useRef(6);
  const flyingRef = useRef<{ y: number } | null>(null);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const initLevel = useCallback((lvl: number) => {
    const cfg = levelConfig(lvl);
    const angles: number[] = [];
    for (let i = 0; i < cfg.initial; i++) {
      angles.push((Math.PI * 2 * i) / cfg.initial);
    }
    stuckRef.current = angles;
    rotationRef.current = 0;
    targetRef.current = cfg.target;
    flyingRef.current = null;
    setThrown(0);
    setPhase("playing");
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const cfg = levelConfig(level);
    const id = window.setInterval(() => {
      rotationRef.current += cfg.speed;

      if (flyingRef.current) {
        flyingRef.current.y += 22;
        if (flyingRef.current.y >= CENTER_Y + FRUIT_R) {
          // Land knife: position relative to current rotation.
          const angle = (-Math.PI / 2 - rotationRef.current + Math.PI * 2) % (Math.PI * 2);
          // Check collision with any stuck knife.
          const tol = 0.18;
          const hit = stuckRef.current.some((a) => {
            const d = Math.abs(((a - angle + Math.PI) % (Math.PI * 2)) - Math.PI);
            return d < tol;
          });
          if (hit) {
            setPhase("over");
            setBest((b) => Math.max(b, (level - 1) * 10 + thrown));
            return;
          }
          stuckRef.current.push(angle);
          flyingRef.current = null;
          setThrown((t) => {
            const nt = t + 1;
            if (nt >= cfg.target) {
              setPhase("won");
              setBest((b) => Math.max(b, level * 10));
            }
            return nt;
          });
        }
      }

      force((n) => (n + 1) & 0xffff);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase, level, thrown]);

  const throwKnife = useCallback(() => {
    if (phaseRef.current === "idle") {
      initLevel(1);
      setLevel(1);
      return;
    }
    if (phaseRef.current === "over") {
      setLevel(1);
      initLevel(1);
      return;
    }
    if (phaseRef.current === "won") {
      setLevel((l) => {
        const nl = l + 1;
        initLevel(nl);
        return nl;
      });
      return;
    }
    if (flyingRef.current) return;
    flyingRef.current = { y: HEIGHT - 80 };
  }, [initLevel]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        throwKnife();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [throwKnife]);

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            throwKnife();
          }}
          className="relative overflow-hidden border border-line bg-surface touch-manipulation select-none"
          style={{ width: WIDTH, height: HEIGHT, maxWidth: "100%", touchAction: "manipulation" }}
          aria-label="Throw"
        >
          <span
            className="absolute rounded-full"
            style={{
              left: CENTER_X - FRUIT_R,
              top: CENTER_Y - FRUIT_R,
              width: FRUIT_R * 2,
              height: FRUIT_R * 2,
              transform: `rotate(${rotationRef.current}rad)`,
              transformOrigin: "center",
              background: "#ef4444",
              border: "3px solid #b91c1c",
            }}
          />
          <span
            className="absolute"
            style={{
              left: CENTER_X - 4,
              top: CENTER_Y - FRUIT_R - 14,
              width: 8,
              height: 16,
              background: "#15803d",
              transform: `rotate(${rotationRef.current}rad)`,
              transformOrigin: `4px ${FRUIT_R + 14}px`,
            }}
          />
          {stuckRef.current.map((a, i) => {
            const ang = a + rotationRef.current;
            const x = CENTER_X + Math.cos(ang - Math.PI / 2) * FRUIT_R;
            const y = CENTER_Y + Math.sin(ang - Math.PI / 2) * FRUIT_R;
            return (
              <span
                key={i}
                className="absolute"
                style={{
                  left: x - 1,
                  top: y,
                  width: 3,
                  height: KNIFE_LEN,
                  transformOrigin: "top center",
                  transform: `rotate(${(ang * 180) / Math.PI}deg) translateY(0)`,
                  background: "#e5e7eb",
                  borderLeft: "1px solid #9ca3af",
                }}
              />
            );
          })}
          {flyingRef.current && (
            <span
              className="absolute"
              style={{
                left: CENTER_X - 1,
                top: flyingRef.current.y - KNIFE_LEN,
                width: 3,
                height: KNIFE_LEN,
                background: "#e5e7eb",
                borderLeft: "1px solid #9ca3af",
              }}
            />
          )}
          {phase !== "playing" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">
                {phase === "idle"
                  ? "Tap to start"
                  : phase === "won"
                    ? `Level ${level} cleared`
                    : "Knife on knife"}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {phase === "won" ? "Tap for next level" : "Tap or space"}
              </span>
            </span>
          )}
        </button>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Click the board or press space to throw
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-3 gap-px overflow-hidden border border-line bg-line">
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Level</p>
            <p className="mt-3 font-serif text-5xl">{level}</p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Stuck</p>
            <p className="mt-3 font-serif text-5xl">{thrown}/{targetRef.current}</p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Best</p>
            <p className="mt-3 font-serif text-5xl text-accent">{best}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 border border-line p-6 text-sm text-muted">
          <p className="font-mono text-xs uppercase tracking-[0.2em]">How to play</p>
          <p className="mt-2">
            The fruit rotates faster each level. Stick the target number of
            knives without ever touching one already there.
          </p>
        </div>
      </div>
    </div>
  );
}

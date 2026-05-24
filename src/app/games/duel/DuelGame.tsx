"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WIDTH = 720;
const HEIGHT = 360;
const PLAYER_X = 50;
const ENEMY_X = WIDTH - 50 - 24;
const FIGHTER_W = 24;
const FIGHTER_H = 56;
const MOVE_SPEED = 4;
const BULLET_SPEED = 7;
const BULLET_W = 12;
const BULLET_H = 4;
const PLAYER_COOLDOWN_MS = 280;
const ENEMY_FIRE_MIN_MS = 700;
const ENEMY_FIRE_MAX_MS = 1500;
const MAX_HP = 5;
const TICK_MS = 16;

type Bullet = { x: number; y: number; vx: number; from: "player" | "enemy" };
type Phase = "idle" | "playing" | "won" | "lost";

export default function DuelGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [enemyHP, setEnemyHP] = useState(MAX_HP);
  const [, force] = useState(0);

  const playerY = useRef(HEIGHT / 2 - FIGHTER_H / 2);
  const enemyY = useRef(HEIGHT / 2 - FIGHTER_H / 2);
  const enemyDir = useRef<1 | -1>(1);
  const enemyTurnAt = useRef(0);
  const bullets = useRef<Bullet[]>([]);
  const keys = useRef<Set<string>>(new Set());
  const lastPlayerShot = useRef(0);
  const nextEnemyShot = useRef(0);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const reset = useCallback(() => {
    playerY.current = HEIGHT / 2 - FIGHTER_H / 2;
    enemyY.current = HEIGHT / 2 - FIGHTER_H / 2;
    enemyDir.current = 1;
    enemyTurnAt.current = performance.now() + 600;
    bullets.current = [];
    lastPlayerShot.current = 0;
    nextEnemyShot.current = performance.now() + 800;
    setPlayerHP(MAX_HP);
    setEnemyHP(MAX_HP);
    setPhase("playing");
  }, []);

  const fire = useCallback(() => {
    if (phaseRef.current !== "playing") {
      reset();
      return;
    }
    const now = performance.now();
    if (now - lastPlayerShot.current < PLAYER_COOLDOWN_MS) return;
    lastPlayerShot.current = now;
    bullets.current.push({
      x: PLAYER_X + FIGHTER_W,
      y: playerY.current + FIGHTER_H / 2 - BULLET_H / 2,
      vx: BULLET_SPEED,
      from: "player",
    });
  }, [reset]);

  useEffect(() => {
    function onDown(e: KeyboardEvent) {
      if (
        ["ArrowUp", "ArrowDown", "w", "W", "s", "S", " "].includes(e.key) ||
        e.key === "Spacebar"
      ) {
        e.preventDefault();
      }
      if (e.key === " " || e.key === "Spacebar") {
        fire();
        return;
      }
      keys.current.add(e.key);
    }
    function onUp(e: KeyboardEvent) {
      keys.current.delete(e.key);
    }
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [fire]);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      // Player movement.
      const k = keys.current;
      if (k.has("ArrowUp") || k.has("w") || k.has("W")) {
        playerY.current = Math.max(0, playerY.current - MOVE_SPEED);
      }
      if (k.has("ArrowDown") || k.has("s") || k.has("S")) {
        playerY.current = Math.min(
          HEIGHT - FIGHTER_H,
          playerY.current + MOVE_SPEED,
        );
      }

      // Enemy AI: drift and occasionally reverse.
      const now = performance.now();
      if (now >= enemyTurnAt.current) {
        enemyDir.current = (Math.random() < 0.5 ? 1 : -1) as 1 | -1;
        enemyTurnAt.current = now + 400 + Math.random() * 800;
      }
      enemyY.current += enemyDir.current * (MOVE_SPEED - 1);
      if (enemyY.current < 0) {
        enemyY.current = 0;
        enemyDir.current = 1;
      } else if (enemyY.current > HEIGHT - FIGHTER_H) {
        enemyY.current = HEIGHT - FIGHTER_H;
        enemyDir.current = -1;
      }

      // Enemy fires.
      if (now >= nextEnemyShot.current) {
        bullets.current.push({
          x: ENEMY_X - BULLET_W,
          y: enemyY.current + FIGHTER_H / 2 - BULLET_H / 2,
          vx: -BULLET_SPEED,
          from: "enemy",
        });
        const span = ENEMY_FIRE_MAX_MS - ENEMY_FIRE_MIN_MS;
        nextEnemyShot.current =
          now + ENEMY_FIRE_MIN_MS + Math.random() * span;
      }

      // Bullets.
      for (const b of bullets.current) b.x += b.vx;
      bullets.current = bullets.current.filter(
        (b) => b.x > -BULLET_W && b.x < WIDTH + BULLET_W,
      );

      // Collisions.
      let playerHit = false;
      let enemyHit = false;
      bullets.current = bullets.current.filter((b) => {
        if (b.from === "player") {
          if (
            b.x + BULLET_W >= ENEMY_X &&
            b.x <= ENEMY_X + FIGHTER_W &&
            b.y + BULLET_H >= enemyY.current &&
            b.y <= enemyY.current + FIGHTER_H
          ) {
            enemyHit = true;
            return false;
          }
        } else {
          if (
            b.x + BULLET_W >= PLAYER_X &&
            b.x <= PLAYER_X + FIGHTER_W &&
            b.y + BULLET_H >= playerY.current &&
            b.y <= playerY.current + FIGHTER_H
          ) {
            playerHit = true;
            return false;
          }
        }
        return true;
      });

      if (playerHit) {
        setPlayerHP((hp) => {
          const next = hp - 1;
          if (next <= 0) setPhase("lost");
          return Math.max(0, next);
        });
      }
      if (enemyHit) {
        setEnemyHP((hp) => {
          const next = hp - 1;
          if (next <= 0) setPhase("won");
          return Math.max(0, next);
        });
      }

      force((n) => (n + 1) & 0xffff);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            if (phaseRef.current === "playing") fire();
            else reset();
          }}
          className="relative overflow-hidden border border-line bg-surface text-left touch-manipulation select-none"
          style={{ width: WIDTH, height: HEIGHT, maxWidth: "100%", touchAction: "manipulation" }}
          aria-label="Duel"
        >
          {/* Mid-field line */}
          <span
            className="absolute bg-line"
            style={{
              left: WIDTH / 2,
              top: 0,
              bottom: 0,
              width: 1,
              opacity: 0.5,
            }}
          />
          {/* Player */}
          <span
            className="absolute bg-accent"
            style={{
              left: PLAYER_X,
              top: playerY.current,
              width: FIGHTER_W,
              height: FIGHTER_H,
            }}
          />
          {/* Enemy */}
          <span
            className="absolute bg-foreground"
            style={{
              left: ENEMY_X,
              top: enemyY.current,
              width: FIGHTER_W,
              height: FIGHTER_H,
            }}
          />
          {/* Bullets */}
          {bullets.current.map((b, i) => (
            <span
              key={i}
              className={`absolute ${b.from === "player" ? "bg-accent" : "bg-foreground"}`}
              style={{
                left: b.x,
                top: b.y,
                width: BULLET_W,
                height: BULLET_H,
              }}
            />
          ))}
          {phase !== "playing" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">
                {phase === "idle"
                  ? "Stand off"
                  : phase === "won"
                    ? "You win"
                    : "You're down"}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {phase === "idle"
                  ? "Click or space to begin"
                  : "Click or space to replay"}
              </span>
            </span>
          )}
        </button>
        <div className="flex gap-3 lg:hidden">
          <HoldButton
            onPress={() => keys.current.add("ArrowUp")}
            onRelease={() => keys.current.delete("ArrowUp")}
            label="Up"
          >
            ↑
          </HoldButton>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              if (phaseRef.current === "playing") fire();
              else reset();
            }}
            className="flex-1 border border-line bg-surface py-4 font-mono text-xs uppercase tracking-[0.2em] touch-manipulation select-none"
            style={{ touchAction: "manipulation" }}
            aria-label="Fire"
          >
            Fire
          </button>
          <HoldButton
            onPress={() => keys.current.add("ArrowDown")}
            onRelease={() => keys.current.delete("ArrowDown")}
            label="Down"
          >
            ↓
          </HoldButton>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          ↑ ↓ or W S to dodge · Space or tap to fire
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-line bg-line">
          <HPBar label="You" hp={playerHP} accent />
          <HPBar label="Rival" hp={enemyHP} />
        </div>

        <div className="flex flex-col gap-2 border border-line p-6 text-sm text-muted">
          <p className="font-mono text-xs uppercase tracking-[0.2em]">
            How to play
          </p>
          <p className="mt-2">
            Both of you have {MAX_HP} hits. Your bullets fly right; the
            rival&apos;s come back at you. Stay moving.
          </p>
        </div>
      </div>
    </div>
  );
}

function HoldButton({
  onPress,
  onRelease,
  label,
  children,
}: {
  onPress: () => void;
  onRelease: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onPress();
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        onRelease();
      }}
      onPointerCancel={() => onRelease()}
      onPointerLeave={() => onRelease()}
      aria-label={label}
      className="w-20 border border-line bg-surface py-4 font-mono text-lg touch-manipulation select-none active:bg-line"
      style={{ touchAction: "none" }}
    >
      {children}
    </button>
  );
}

function HPBar({
  label,
  hp,
  accent,
}: {
  label: string;
  hp: number;
  accent?: boolean;
}) {
  return (
    <div className="bg-background p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
      <div className="mt-3 flex gap-2">
        {Array.from({ length: MAX_HP }).map((_, i) => (
          <span
            key={i}
            className={`h-6 w-6 border border-line ${
              i < hp ? (accent ? "bg-accent" : "bg-foreground") : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}

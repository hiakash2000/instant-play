"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistedBest } from "../../usePersistedBest";

const WIDTH = 560;
const HEIGHT = 400;
const TICK_MS = 16;

type Vec = { x: number; y: number };
type Enemy = { x: number; y: number; hp: number };
type Bullet = { x: number; y: number; vx: number; vy: number; dmg: number };
type Gem = { x: number; y: number };
type Phase = "idle" | "playing" | "leveling" | "over";

type Stats = {
  damage: number;
  fireRate: number; // ms between shots
  maxHp: number;
  speed: number;
  bullets: number;
};

type Upgrade = {
  label: string;
  apply: (s: Stats) => Stats;
};

const UPGRADE_POOL: Upgrade[] = [
  { label: "+25% damage", apply: (s) => ({ ...s, damage: s.damage * 1.25 }) },
  { label: "+25% fire rate", apply: (s) => ({ ...s, fireRate: s.fireRate * 0.8 }) },
  { label: "+20 max HP", apply: (s) => ({ ...s, maxHp: s.maxHp + 20 }) },
  { label: "+15% speed", apply: (s) => ({ ...s, speed: s.speed * 1.15 }) },
  { label: "+1 projectile", apply: (s) => ({ ...s, bullets: s.bullets + 1 }) },
];

export default function VampireSurvivorsGame() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [time, setTime] = useState(0);
  const [best, setBest] = usePersistedBest("vampire-survivors");
  const [choices, setChoices] = useState<Upgrade[]>([]);
  const [, force] = useState(0);

  const phaseRef = useRef(phase);
  const playerRef = useRef<Vec>({ x: WIDTH / 2, y: HEIGHT / 2 });
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const gemsRef = useRef<Gem[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotRef = useRef(0);
  const statsRef = useRef<Stats>({ damage: 10, fireRate: 500, maxHp: 100, speed: 2.6, bullets: 1 });
  const xpRef = useRef(0);
  const xpNeedRef = useRef(5);
  const hpRef = useRef(100);
  const timeRef = useRef(0);
  const spawnTimerRef = useRef(0);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const reset = useCallback(() => {
    playerRef.current = { x: WIDTH / 2, y: HEIGHT / 2 };
    enemiesRef.current = [];
    bulletsRef.current = [];
    gemsRef.current = [];
    statsRef.current = { damage: 10, fireRate: 500, maxHp: 100, speed: 2.6, bullets: 1 };
    xpRef.current = 0;
    xpNeedRef.current = 5;
    hpRef.current = 100;
    timeRef.current = 0;
    spawnTimerRef.current = 0;
    lastShotRef.current = 0;
    setLevel(1);
    setXp(0);
    setHp(100);
    setMaxHp(100);
    setTime(0);
    setPhase("playing");
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      const stats = statsRef.current;
      const p = playerRef.current;
      const keys = keysRef.current;
      let dx = 0;
      let dy = 0;
      if (keys.has("w") || keys.has("arrowup")) dy -= 1;
      if (keys.has("s") || keys.has("arrowdown")) dy += 1;
      if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
      if (keys.has("d") || keys.has("arrowright")) dx += 1;
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        p.x = Math.max(10, Math.min(WIDTH - 10, p.x + (dx / len) * stats.speed));
        p.y = Math.max(10, Math.min(HEIGHT - 10, p.y + (dy / len) * stats.speed));
      }

      timeRef.current += TICK_MS;
      spawnTimerRef.current += TICK_MS;
      const spawnEvery = Math.max(280, 900 - timeRef.current / 30);
      if (spawnTimerRef.current > spawnEvery) {
        spawnTimerRef.current = 0;
        // spawn from random edge
        const side = Math.floor(Math.random() * 4);
        let ex = 0, ey = 0;
        if (side === 0) { ex = Math.random() * WIDTH; ey = -10; }
        else if (side === 1) { ex = Math.random() * WIDTH; ey = HEIGHT + 10; }
        else if (side === 2) { ex = -10; ey = Math.random() * HEIGHT; }
        else { ex = WIDTH + 10; ey = Math.random() * HEIGHT; }
        const tier = 1 + Math.floor(timeRef.current / 15000);
        enemiesRef.current.push({ x: ex, y: ey, hp: 15 + tier * 8 });
      }

      // Move enemies toward player.
      for (const e of enemiesRef.current) {
        const ex = p.x - e.x;
        const ey = p.y - e.y;
        const d = Math.hypot(ex, ey);
        if (d > 0) {
          e.x += (ex / d) * 1.0;
          e.y += (ey / d) * 1.0;
        }
        if (d < 16) {
          hpRef.current -= 0.5;
        }
      }

      // Auto-fire at nearest.
      if (timeRef.current - lastShotRef.current >= stats.fireRate) {
        lastShotRef.current = timeRef.current;
        let nearest: Enemy | null = null;
        let nd = Infinity;
        for (const e of enemiesRef.current) {
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < nd) { nd = d; nearest = e; }
        }
        if (nearest) {
          for (let i = 0; i < stats.bullets; i++) {
            const angle = Math.atan2(nearest.y - p.y, nearest.x - p.x) + (i - (stats.bullets - 1) / 2) * 0.18;
            bulletsRef.current.push({
              x: p.x,
              y: p.y,
              vx: Math.cos(angle) * 5,
              vy: Math.sin(angle) * 5,
              dmg: stats.damage,
            });
          }
        }
      }

      // Move bullets, check hits.
      for (const b of bulletsRef.current) {
        b.x += b.vx;
        b.y += b.vy;
      }
      bulletsRef.current = bulletsRef.current.filter((b) => b.x > -20 && b.x < WIDTH + 20 && b.y > -20 && b.y < HEIGHT + 20);

      for (const b of bulletsRef.current) {
        for (const e of enemiesRef.current) {
          if (Math.hypot(b.x - e.x, b.y - e.y) < 14) {
            e.hp -= b.dmg;
            b.x = -100; // mark for removal
            break;
          }
        }
      }
      bulletsRef.current = bulletsRef.current.filter((b) => b.x > -10);

      // Remove dead enemies, drop gems.
      enemiesRef.current = enemiesRef.current.filter((e) => {
        if (e.hp <= 0) {
          gemsRef.current.push({ x: e.x, y: e.y });
          return false;
        }
        return true;
      });

      // Gem pickup.
      gemsRef.current = gemsRef.current.filter((g) => {
        if (Math.hypot(g.x - p.x, g.y - p.y) < 22) {
          xpRef.current += 1;
          return false;
        }
        return true;
      });

      // Level up.
      if (xpRef.current >= xpNeedRef.current) {
        xpRef.current -= xpNeedRef.current;
        xpNeedRef.current = Math.floor(xpNeedRef.current * 1.5);
        setLevel((l) => l + 1);
        // Pick 3 random upgrades.
        const shuffled = [...UPGRADE_POOL].sort(() => Math.random() - 0.5);
        setChoices(shuffled.slice(0, 3));
        setPhase("leveling");
      }

      if (hpRef.current <= 0) {
        setBest((b) => Math.max(b, Math.floor(timeRef.current / 1000)));
        setPhase("over");
      } else {
        setHp(hpRef.current);
        setXp(xpRef.current);
        setTime(Math.floor(timeRef.current / 1000));
        force((n) => (n + 1) & 0xffff);
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    function onDown(e: KeyboardEvent) {
      keysRef.current.add(e.key.toLowerCase());
    }
    function onUp(e: KeyboardEvent) {
      keysRef.current.delete(e.key.toLowerCase());
    }
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  const pickUpgrade = (u: Upgrade) => {
    const oldMax = statsRef.current.maxHp;
    statsRef.current = u.apply(statsRef.current);
    if (statsRef.current.maxHp > oldMax) {
      hpRef.current += statsRef.current.maxHp - oldMax;
    }
    setMaxHp(statsRef.current.maxHp);
    setChoices([]);
    setPhase("playing");
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr]">
      <div className="flex flex-col gap-4">
        <div
          className="relative overflow-hidden border border-line bg-surface"
          style={{ width: WIDTH, height: HEIGHT }}
        >
          {enemiesRef.current.map((e, i) => (
            <span
              key={`e${i}`}
              className="absolute bg-rose-500/80"
              style={{ left: e.x - 7, top: e.y - 7, width: 14, height: 14 }}
            />
          ))}
          {gemsRef.current.map((g, i) => (
            <span
              key={`g${i}`}
              className="absolute bg-accent"
              style={{ left: g.x - 3, top: g.y - 3, width: 6, height: 6 }}
            />
          ))}
          {bulletsRef.current.map((b, i) => (
            <span
              key={`b${i}`}
              className="absolute rounded-full bg-foreground"
              style={{ left: b.x - 2, top: b.y - 2, width: 4, height: 4 }}
            />
          ))}
          <span
            className="absolute bg-accent"
            style={{
              left: playerRef.current.x - 9,
              top: playerRef.current.y - 9,
              width: 18,
              height: 18,
            }}
          />

          {/* HP bar */}
          <span className="absolute left-3 top-3 h-2 w-40 bg-line">
            <span
              className="block h-full bg-rose-500"
              style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }}
            />
          </span>

          {phase === "idle" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 text-center">
              <span className="font-serif text-3xl tracking-tight">Survive</span>
              <button
                type="button"
                onClick={reset}
                className="pointer-events-auto mt-2 border border-line px-4 py-2 text-sm hover:bg-surface-hover"
              >
                Begin
              </button>
            </span>
          )}
          {phase === "over" && (
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/85 text-center">
              <span className="font-serif text-3xl tracking-tight">You died</span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {time}s survived
              </span>
              <button
                type="button"
                onClick={reset}
                className="pointer-events-auto mt-2 border border-line px-4 py-2 text-sm hover:bg-surface-hover"
              >
                Try again
              </button>
            </span>
          )}
          {phase === "leveling" && (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/90 p-6 text-center">
              <span className="font-serif text-2xl tracking-tight">Level up</span>
              <div className="flex flex-wrap justify-center gap-2">
                {choices.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickUpgrade(c)}
                    className="border border-line bg-surface-hover px-4 py-3 text-sm hover:border-accent"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </span>
          )}
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          WASD / arrows to move · weapon fires automatically
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-3 gap-px overflow-hidden border border-line bg-line">
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Time</p>
            <p className="mt-3 font-serif text-5xl">{time}s</p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Level</p>
            <p className="mt-3 font-serif text-5xl">{level}</p>
          </div>
          <div className="bg-background p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Best</p>
            <p className="mt-3 font-serif text-5xl text-accent">{best}s</p>
          </div>
        </div>
        <div className="border border-line p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">XP</p>
          <div className="mt-3 h-2 w-full bg-line">
            <div
              className="h-full bg-accent"
              style={{ width: `${(xp / xpNeedRef.current) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 border border-line p-6 text-sm text-muted">
          <p className="font-mono text-xs uppercase tracking-[0.2em]">How to play</p>
          <p className="mt-2">
            Move with WASD or arrows. Your weapon picks the nearest enemy.
            Pick up the gold gems to level up — each level lets you choose one
            upgrade.
          </p>
        </div>
      </div>
    </div>
  );
}

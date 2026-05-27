"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Game = {
  slug: string;
  title: string;
  tagline: string;
  players: string;
  preview: React.ReactNode;
};

type Category = {
  name: string;
  blurb: string;
  hue: string;
  games: Game[];
};

const categories: Category[] = [
  {
    name: "Classic",
    blurb: "Six small arcades. The ones you already know how to play.",
    hue: "#f5a524",
    games: [
      {
        slug: "tic-tac-toe",
        title: "Tic Tac Toe",
        tagline: "Three in a row. Two players, one board, no timer.",
        players: "2 players · local",
        preview: <TicTacToePreview />,
      },
      {
        slug: "snake",
        title: "Snake",
        tagline: "Steer, eat, grow. The arcade classic with arrow keys.",
        players: "1 player · keyboard",
        preview: <SnakePreview />,
      },
      {
        slug: "flappy",
        title: "Flappy",
        tagline: "Gravity is constant. Each tap is a flap. Thread the gap.",
        players: "1 player · tap or space",
        preview: <FlappyPreview />,
      },
      {
        slug: "dino",
        title: "Dino Run",
        tagline: "Endless desert. Jump cacti. The pace climbs the longer you last.",
        players: "1 player · keyboard",
        preview: <DinoPreview />,
      },
      {
        slug: "duck-hunt",
        title: "Duck Hunt",
        tagline: "Sixty seconds. Click ducks before they hide in the bush.",
        players: "1 player · mouse",
        preview: <DuckHuntPreview />,
      },
      {
        slug: "duel",
        title: "Duel",
        tagline: "You and a rival, five hits each. Dodge, fire, repeat.",
        players: "1 player · keyboard",
        preview: <DuelPreview />,
      },
    ],
  },
  {
    name: "Action & Arcade",
    blurb: "One-tap and swipe games. Reflex over thought.",
    hue: "#ff5d8f",
    games: [
      {
        slug: "geometry-dash",
        title: "Geometry Dash",
        tagline: "An auto-running square. Jump the spikes on rhythm.",
        players: "1 player · tap or space",
        preview: <GeometryDashPreview />,
      },
      {
        slug: "ball-fall",
        title: "Ball Fall",
        tagline: "Endless planks rising up. Slide them so the hole lines up under the ball.",
        players: "1 player · arrows or drag",
        preview: <BallFallPreview />,
      },
      {
        slug: "subway-surfers",
        title: "Subway Surfers",
        tagline: "Three lanes, endless trains. Swap lanes, leap obstacles.",
        players: "1 player · arrows",
        preview: <SubwaySurfersPreview />,
      },
      {
        slug: "fruit-stab",
        title: "Fruit Stab",
        tagline: "Knife after knife into spinning fruit. Don't clip a blade.",
        players: "1 player · tap",
        preview: <FruitStabPreview />,
      },
      {
        slug: "drift-boss",
        title: "Drift Boss",
        tagline: "Endless winding road. One tap flips your steering.",
        players: "1 player · tap",
        preview: <DriftBossPreview />,
      },
      {
        slug: "flappy-dunk",
        title: "Flappy Dunk",
        tagline: "Bounce a ball through moving hoops. Chain the dunks.",
        players: "1 player · tap",
        preview: <FlappyDunkPreview />,
      },
      {
        slug: "road-fighter",
        title: "Road Fighter",
        tagline: "Highway never ends. Slide between cars, don't kiss the curb.",
        players: "1 player · arrows",
        preview: <RoadFighterPreview />,
      },
      {
        slug: "jump-up",
        title: "Jump Up",
        tagline: "Auto-bouncing climber. Steer onto each sliding plank above.",
        players: "1 player · arrows",
        preview: <JumpUpPreview />,
      },
      {
        slug: "space-invaders",
        title: "Space Invaders",
        tagline: "A grid of marching aliens. Strafe, fire, clear the wave.",
        players: "1 player · keyboard",
        preview: <SpaceInvadersPreview />,
      },
    ],
  },
  {
    name: "Puzzle & Strategy",
    blurb: "Slower games. Cards, pipes, and quiet boards.",
    hue: "#38bdf8",
    games: [
      {
        slug: "cats-organized-neatly",
        title: "Cats Organized Neatly",
        tagline: "Drag the cats onto the grid. Don't make them touch.",
        players: "1 player · mouse",
        preview: <CatsPreview />,
      },
      {
        slug: "flow-free",
        title: "Flow Free",
        tagline: "Connect matching colors with pipes. Fill the grid.",
        players: "1 player · mouse",
        preview: <FlowFreePreview />,
      },
      {
        slug: "tetris",
        title: "Tetris",
        tagline: "Falling tetrominoes. Pack them, clear lines, chase the four-clear.",
        players: "1 player · keyboard",
        preview: <TetrisPreview />,
      },
    ],
  },
  {
    name: "Idle & Simulation",
    blurb: "Games that play themselves while you steer the upgrades.",
    hue: "#a78bfa",
    games: [
      {
        slug: "vampire-survivors",
        title: "Vampire Survivors",
        tagline: "Auto-firing wizard in a tide of enemies. Survive, level, repeat.",
        players: "1 player · keyboard",
        preview: <VampireSurvivorsPreview />,
      },
      {
        slug: "tennis",
        title: "Tennis",
        tagline: "Two paddles, one rallying ball. The CPU never naps.",
        players: "1 player · keyboard",
        preview: <TennisPreview />,
      },
      {
        slug: "pacman",
        title: "Pacman",
        tagline: "Eat every dot. Ghosts close in. Each level adds another.",
        players: "1 player · keyboard",
        preview: <PacmanPreview />,
      },
    ],
  },
];

const totalGames = categories.reduce((n, c) => n + c.games.length, 0);

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Home() {
  const [ordered, setOrdered] = useState<Category[]>(categories);

  useEffect(() => {
    setOrdered(
      shuffle(categories).map((c) => ({ ...c, games: shuffle(c.games) })),
    );
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #ff5d8f, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-12 h-80 w-80 rounded-full opacity-35 blur-3xl"
          style={{ background: "radial-gradient(circle, #38bdf8, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/3 -bottom-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #a78bfa, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
          <p className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            A small collection
          </p>
          <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-7xl">
            Games you can{" "}
            <span
              className="bg-clip-text italic text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #ff5d8f, #f5a524, #2dd4bf, #a78bfa)",
              }}
            >
              start playing
            </span>{" "}
            in a single click.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
            No accounts, no downloads, no waiting rooms. Pick a board and
            play. That&apos;s the whole site.
          </p>
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            {totalGames} titles · {categories.length} categories
          </p>
        </div>
      </section>

      <nav
        aria-label="Game categories"
        className="sticky top-0 z-30 border-b border-line bg-background/85 backdrop-blur"
      >
        <ul className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-6 py-3 sm:px-10">
          {ordered.map((category) => (
            <li
              key={category.name}
              style={
                { ["--card-hue" as string]: category.hue } as React.CSSProperties
              }
            >
              <a
                href={`#${slugify(category.name)}`}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-line bg-surface/60 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition-all hover:border-[color:var(--card-hue)] hover:text-[color:var(--card-hue)] hover:bg-[color-mix(in_oklab,var(--card-hue)_14%,transparent)]"
              >
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: category.hue }}
                />
                {category.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {ordered.map((category) => (
        <section
          key={category.name}
          id={slugify(category.name)}
          className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 py-20 sm:px-10"
        >
          <div className="mb-10 flex items-baseline justify-between gap-6">
            <div>
              <span
                aria-hidden
                className="mb-4 block h-1 w-12 rounded-full"
                style={{ backgroundColor: category.hue }}
              />
              <h2 className="font-serif text-3xl tracking-tight">
                <span style={{ color: category.hue }}>{category.name}</span>
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted">
                {category.blurb}
              </p>
            </div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted whitespace-nowrap">
              {category.games.length} titles
            </span>
          </div>

          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {category.games.map((game) => (
              <li
                key={game.slug}
                style={
                  { ["--card-hue" as string]: category.hue } as React.CSSProperties
                }
              >
                <Link
                  href={`/games/${game.slug}`}
                  className="group relative flex h-full flex-col gap-5 overflow-hidden rounded-xl border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--card-hue)] hover:shadow-[0_10px_30px_-12px_var(--card-hue)]"
                >
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-0.5 opacity-70"
                    style={{ background: category.hue }}
                  />
                  <div
                    className="flex h-40 items-center justify-center rounded-lg border border-line/60"
                    style={{
                      background: `linear-gradient(135deg, ${category.hue}1f, transparent 65%)`,
                    }}
                  >
                    {game.preview}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                      {game.players}
                    </p>
                    <h3 className="mt-2 font-serif text-2xl tracking-tight transition-colors group-hover:[color:var(--card-hue)]">
                      {game.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                      {game.tagline}
                    </p>
                    <span className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full border border-[color:var(--card-hue)] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--card-hue)] transition-all group-hover:bg-[var(--card-hue)] group-hover:text-background">
                      Play
                      <span
                        aria-hidden
                        className="transition-transform group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function TicTacToePreview() {
  const cells: Array<"X" | "O" | ""> = ["X", "", "O", "", "X", "", "O", "", "X"];
  const diag = new Set([0, 4, 8]);
  return (
    <div className="grid grid-cols-3 gap-2">
      {cells.map((c, i) => (
        <div
          key={i}
          className={`flex h-10 w-10 items-center justify-center border border-line font-serif text-xl ${diag.has(i) ? "pv-pulse" : ""}`}
          data-delay={diag.has(i) ? (i === 0 ? "1" : i === 4 ? "2" : "3") : undefined}
          style={{ color: c === "X" ? "#ff5d8f" : c === "O" ? "#38bdf8" : undefined }}
        >
          {c}
        </div>
      ))}
    </div>
  );
}

function SnakePreview() {
  const snake = new Set(["1,1", "2,1", "3,1", "3,2", "3,3", "2,3", "1,3"]);
  const head = "1,1";
  const food = "5,4";
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 7 * 5 }).map((_, i) => {
        const x = i % 7;
        const y = Math.floor(i / 7);
        const key = `${x},${y}`;
        const isHead = key === head;
        const isBody = snake.has(key) && !isHead;
        const isFood = key === food;
        return (
          <div
            key={i}
            className={`h-4 w-4 border border-line ${isHead ? "pv-slide-x" : isFood ? "pv-pulse" : ""}`}
            style={{
              backgroundColor: isHead
                ? "#22c55e"
                : isBody
                  ? "rgba(34,197,94,0.6)"
                  : isFood
                    ? "#ef4444"
                    : undefined,
              ["--pv-d" as string]: isHead ? "8px" : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

function FlappyPreview() {
  return (
    <div className="relative h-24 w-32 border border-line" style={{ background: "linear-gradient(to bottom, rgba(56,189,248,0.15), transparent)" }}>
      <span className="pv-bob absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full" style={{ background: "#facc15", ["--pv-d" as string]: "10px" }} />
      <span className="absolute left-16 top-0 h-8 w-4" style={{ background: "#22c55e" }} />
      <span className="absolute left-16 bottom-0 h-10 w-4" style={{ background: "#22c55e" }} />
      <span className="absolute right-2 top-0 h-12 w-4" style={{ background: "#22c55e" }} />
      <span className="absolute right-2 bottom-0 h-6 w-4" style={{ background: "#22c55e" }} />
    </div>
  );
}

function DinoPreview() {
  return (
    <div className="relative h-24 w-36 border border-line" style={{ background: "linear-gradient(to bottom, #fde68a, #fcd34d)" }}>
      <span className="absolute left-0 right-0 bottom-4 h-px" style={{ background: "#92400e" }} />
      <span className="pv-jump absolute left-4 bottom-4 h-5 w-4" style={{ background: "#0f766e", ["--pv-d" as string]: "14px" }} />
      <span className="pv-slide-x absolute left-16 bottom-4 h-6 w-3" style={{ background: "#15803d", ["--pv-d" as string]: "-30px" }} />
      <span className="pv-slide-x absolute left-24 bottom-4 h-4 w-3" style={{ background: "#15803d", ["--pv-d" as string]: "-50px" }} data-delay="2" />
    </div>
  );
}

function DuckHuntPreview() {
  return (
    <div className="relative h-24 w-36 border border-line" style={{ background: "linear-gradient(to bottom, #93c5fd, #bfdbfe)" }}>
      <span className="absolute left-0 right-0 bottom-0 h-6" style={{ background: "#15803d" }} />
      <span className="pv-bob absolute right-3 top-3 h-3 w-5" style={{ background: "#7c2d12", ["--pv-d" as string]: "6px" }} />
      <span className="pv-bob absolute left-6 top-1/2 h-3 w-5" style={{ background: "rgba(124,45,18,0.6)", ["--pv-d" as string]: "4px" }} data-delay="2" />
      <span
        className="pv-flicker absolute left-14 top-1/3 h-px w-12 origin-left -rotate-12"
        style={{
          color: "#dc2626",
          backgroundImage:
            "repeating-linear-gradient(90deg, currentColor 0 3px, transparent 3px 6px)",
        }}
      />
    </div>
  );
}

function DuelPreview() {
  return (
    <div className="relative h-24 w-36 border border-line">
      <span className="absolute left-1/2 top-2 bottom-2 w-px bg-line" />
      <span className="absolute left-3 top-1/2 h-10 w-3 -translate-y-1/2" style={{ background: "#ef4444" }} />
      <span className="absolute right-3 top-1/3 h-10 w-3" style={{ background: "#3b82f6" }} />
      <span className="pv-shoot-r absolute left-8 top-1/2 h-1 w-3 -translate-y-1/2" style={{ background: "#ef4444", ["--pv-d" as string]: "70px" }} />
      <span className="pv-shoot-l absolute right-8 top-1/2 h-1 w-3 -translate-y-1/2" style={{ background: "#3b82f6", ["--pv-d" as string]: "70px" }} data-delay="3" />
    </div>
  );
}

function GeometryDashPreview() {
  return (
    <div className="relative h-24 w-36 border border-line" style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)" }}>
      <span className="absolute left-0 right-0 bottom-3 h-px" style={{ background: "#a78bfa" }} />
      <span className="pv-jump absolute left-3 bottom-3 h-4 w-4" style={{ background: "#22d3ee", ["--pv-d" as string]: "18px" }} />
      <span
        className="absolute left-16 bottom-3 h-3 w-3"
        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)", background: "#f472b6" }}
      />
      <span
        className="absolute left-24 bottom-3 h-4 w-4"
        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)", background: "#f472b6" }}
      />
    </div>
  );
}

function BallFallPreview() {
  return (
    <div className="relative h-24 w-32 border border-line">
      <span className="pv-bob absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full" style={{ background: "#f97316", ["--pv-d" as string]: "-6px" }} />
      <span className="absolute left-0 top-7 h-1 w-8" style={{ background: "#22d3ee" }} />
      <span className="absolute right-0 top-7 h-1 w-16" style={{ background: "#22d3ee" }} />
      <span className="absolute left-0 top-12 h-1 w-20" style={{ background: "#a78bfa" }} />
      <span className="absolute right-0 top-12 h-1 w-4" style={{ background: "#a78bfa" }} />
      <span className="absolute left-0 top-16 h-1 w-12" style={{ background: "#f472b6" }} />
      <span className="absolute right-0 top-16 h-1 w-12" style={{ background: "#f472b6" }} />
      <span className="absolute left-0 bottom-3 h-1 w-6" style={{ background: "#facc15" }} />
      <span className="absolute right-0 bottom-3 h-1 w-20" style={{ background: "#facc15" }} />
    </div>
  );
}

function SubwaySurfersPreview() {
  return (
    <div className="relative h-24 w-32 border border-line" style={{ background: "linear-gradient(to bottom, #1f2937, #374151)" }}>
      <span className="absolute left-1/3 top-0 bottom-0 w-px" style={{ background: "#facc15" }} />
      <span className="absolute left-2/3 top-0 bottom-0 w-px" style={{ background: "#facc15" }} />
      <span className="absolute left-3 bottom-3 h-4 w-3" style={{ background: "#ec4899" }} />
      <span className="pv-slide-x absolute left-1/2 top-6 h-5 w-5 -translate-x-1/2" style={{ background: "#f97316", ["--pv-d" as string]: "30px" }} />
      <span className="absolute right-3 top-12 h-4 w-3" style={{ background: "#22d3ee" }} />
    </div>
  );
}

function FruitStabPreview() {
  return (
    <div className="pv-spin relative h-24 w-24">
      <span className="absolute inset-2 rounded-full" style={{ background: "#ef4444", border: "2px solid #b91c1c" }} />
      <span className="absolute left-1/2 top-1 h-3 w-1 -translate-x-1/2" style={{ background: "#15803d" }} />
      <span className="absolute left-1/2 top-2 h-3 w-px -translate-x-1/2" style={{ background: "#9ca3af" }} />
      <span className="absolute right-3 top-1/2 h-3 w-px -translate-y-1/2 rotate-90" style={{ background: "#9ca3af" }} />
      <span className="absolute left-3 top-1/2 h-3 w-px -translate-y-1/2 rotate-90" style={{ background: "#9ca3af" }} />
    </div>
  );
}

function DriftBossPreview() {
  return (
    <svg viewBox="0 0 100 80" className="h-24 w-32">
      <path
        d="M 10 70 Q 30 70 30 50 Q 30 30 50 30 Q 70 30 70 50 Q 70 70 90 70"
        stroke="#7dd3fc"
        strokeWidth="10"
        fill="none"
        strokeDasharray="6 4"
        className="pv-flicker"
      />
      <circle cx="50" cy="30" r="4" fill="#ec4899" className="pv-bob" style={{ ["--pv-d" as string]: "8px", transformOrigin: "center" }} />
    </svg>
  );
}

function FlappyDunkPreview() {
  return (
    <div className="relative h-24 w-24 border border-line">
      <span className="pv-fall absolute left-1/2 top-3 h-3 w-3 -translate-x-1/2 rounded-full" style={{ background: "#f97316", ["--pv-from" as string]: "-8px", ["--pv-to" as string]: "50px" }} />
      <span className="absolute left-1/4 right-1/4 bottom-6 h-px" style={{ background: "#ef4444" }} />
      <span className="absolute left-1/4 bottom-4 h-2 w-px" style={{ background: "#ef4444" }} />
      <span className="absolute right-1/4 bottom-4 h-2 w-px" style={{ background: "#ef4444" }} />
    </div>
  );
}

function RoadFighterPreview() {
  return (
    <div className="relative h-24 w-32 border border-line" style={{ background: "#1f2937" }}>
      <span className="absolute top-0 bottom-0 left-0 w-3" style={{ background: "#16a34a" }} />
      <span className="absolute top-0 bottom-0 right-0 w-3" style={{ background: "#16a34a" }} />
      <span className="pv-scroll-y absolute left-1/2 top-1 h-2 w-px -translate-x-1/2" style={{ background: "#facc15", ["--pv-from" as string]: "-12px", ["--pv-to" as string]: "100px" }} />
      <span className="pv-scroll-y absolute left-1/2 top-7 h-2 w-px -translate-x-1/2" style={{ background: "#facc15", ["--pv-from" as string]: "-12px", ["--pv-to" as string]: "100px" }} data-delay="2" />
      <span className="pv-scroll-y absolute left-1/2 top-13 h-2 w-px -translate-x-1/2" style={{ background: "#facc15", ["--pv-from" as string]: "-12px", ["--pv-to" as string]: "100px" }} data-delay="4" />
      <span className="pv-scroll-y absolute left-5 top-4 h-4 w-3" style={{ background: "#3b82f6", ["--pv-from" as string]: "-30px", ["--pv-to" as string]: "100px" }} />
      <span className="pv-scroll-y absolute right-6 top-10 h-4 w-3" style={{ background: "#a78bfa", ["--pv-from" as string]: "-50px", ["--pv-to" as string]: "100px" }} data-delay="3" />
      <span className="absolute left-1/2 bottom-2 h-5 w-3 -translate-x-1/2" style={{ background: "#ef4444" }} />
    </div>
  );
}

function JumpUpPreview() {
  return (
    <div className="relative h-24 w-24 border border-line">
      <span className="absolute left-3 top-3 h-1 w-8" style={{ background: "#f472b6" }} />
      <span className="absolute right-3 top-9 h-1 w-10" style={{ background: "#22d3ee" }} />
      <span className="absolute left-2 top-16 h-1 w-9" style={{ background: "#a78bfa" }} />
      <span className="pv-jump absolute left-1/2 top-12 h-3 w-3 -translate-x-1/2 rounded-full" style={{ background: "#facc15", ["--pv-d" as string]: "26px" }} />
      <span className="absolute right-3 bottom-3 h-1 w-12" style={{ background: "#4ade80" }} />
    </div>
  );
}

function CatsPreview() {
  const palette = ["#f472b6", "#facc15", "#22d3ee", "#a78bfa", "#fb7185", "#4ade80", "#fb923c", "#60a5fa"];
  const filledMap: Record<number, number> = { 0: 0, 1: 1, 5: 2, 6: 3, 10: 4, 11: 5, 14: 6, 15: 7 };
  return (
    <div className="grid grid-cols-4 gap-1">
      {Array.from({ length: 16 }).map((_, i) => {
        const idx = filledMap[i];
        return (
          <span
            key={i}
            className={`h-5 w-5 rounded-sm border border-line ${idx !== undefined ? "pv-pulse" : ""}`}
            data-delay={idx !== undefined ? String((idx % 5) + 1) : undefined}
            style={{ background: idx !== undefined ? palette[idx] : undefined }}
          />
        );
      })}
    </div>
  );
}

function SpaceInvadersPreview() {
  return (
    <div className="relative h-24 w-32 border border-line" style={{ background: "#020617" }}>
      <span className="pv-slide-x absolute left-3 top-3 h-2 w-3" style={{ background: "#f472b6", ["--pv-d" as string]: "10px" }} />
      <span className="pv-slide-x absolute left-10 top-3 h-2 w-3" style={{ background: "#f472b6", ["--pv-d" as string]: "10px" }} />
      <span className="pv-slide-x absolute right-3 top-3 h-2 w-3" style={{ background: "#f472b6", ["--pv-d" as string]: "10px" }} />
      <span className="pv-slide-x absolute left-3 top-9 h-2 w-3" style={{ background: "#4ade80", ["--pv-d" as string]: "10px" }} />
      <span className="pv-slide-x absolute left-10 top-9 h-2 w-3" style={{ background: "#4ade80", ["--pv-d" as string]: "10px" }} />
      <span className="pv-slide-x absolute right-3 top-9 h-2 w-3" style={{ background: "#4ade80", ["--pv-d" as string]: "10px" }} />
      <span className="pv-rise absolute left-1/2 top-14 h-3 w-px -translate-x-1/2" style={{ background: "#facc15", ["--pv-from" as string]: "10px", ["--pv-to" as string]: "-50px" }} />
      <span className="absolute left-1/2 bottom-3 h-2 w-6 -translate-x-1/2" style={{ background: "#22d3ee" }} />
    </div>
  );
}

function TennisPreview() {
  return (
    <div className="relative h-24 w-32 border border-line" style={{ background: "#15803d" }}>
      <span className="absolute left-1/2 top-2 bottom-2 w-px" style={{ background: "rgba(255,255,255,0.5)" }} />
      <span className="pv-bob absolute left-2 top-1/3 h-8 w-1" style={{ background: "#ef4444", ["--pv-d" as string]: "-14px" }} />
      <span className="pv-bob absolute right-2 bottom-1/3 h-8 w-1" style={{ background: "#3b82f6", ["--pv-d" as string]: "14px" }} data-delay="2" />
      <span className="pv-slide-x absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "#fde047", ["--pv-d" as string]: "50px" }} />
    </div>
  );
}

function PacmanPreview() {
  return (
    <div className="relative h-24 w-24 border border-line" style={{ background: "#020617" }}>
      <span className="absolute left-2 right-2 top-2 h-1" style={{ background: "#3b82f6" }} />
      <span className="absolute left-2 top-2 bottom-2 w-1" style={{ background: "#3b82f6" }} />
      <span className="absolute right-2 top-2 bottom-2 w-1" style={{ background: "#3b82f6" }} />
      <span className="absolute left-2 right-2 bottom-2 h-1" style={{ background: "#3b82f6" }} />
      <span className="pv-slide-x absolute left-5 top-5 h-3 w-3 rounded-full" style={{ background: "#facc15", ["--pv-d" as string]: "30px" }} />
      <span className="pv-slide-x absolute right-5 top-1/2 h-3 w-3 rounded-t-full" style={{ background: "#ef4444", ["--pv-d" as string]: "-20px" }} data-delay="2" />
      <span className="pv-pulse absolute left-1/2 bottom-5 h-1 w-1 -translate-x-1/2 rounded-full" style={{ background: "#22d3ee" }} />
      <span className="pv-pulse absolute left-1/3 top-1/3 h-1 w-1 rounded-full" style={{ background: "#f472b6" }} data-delay="3" />
    </div>
  );
}

function FlowFreePreview() {
  const colorMap: Record<number, string> = {
    0: "#ef4444",
    4: "#ef4444",
    8: "#ef4444",
    9: "#ef4444",
    10: "#ef4444",
    11: "#ef4444",
    15: "#ef4444",
    3: "#3b82f6",
    7: "#3b82f6",
    13: "#3b82f6",
    14: "#3b82f6",
    2: "#facc15",
    6: "#facc15",
  };
  return (
    <div className="grid grid-cols-4 gap-1">
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className={`h-4 w-4 rounded-sm border border-line ${colorMap[i] ? "pv-flicker" : ""}`}
          data-delay={colorMap[i] ? String((i % 5) + 1) : undefined}
          style={{ background: colorMap[i] }}
        />
      ))}
    </div>
  );
}

function TetrisPreview() {
  // 4 cols x 6 rows: a falling T-piece up top, a partial stack below.
  const cells: string[] = [
    "", "T", "",  "",
    "T", "T", "T", "",
    "",  "",  "",  "",
    "",  "",  "O", "O",
    "L", "L", "",  "O",
    "L", "S", "S", "O",
  ];
  const colors: Record<string, string> = {
    T: "#a855f7",
    O: "#facc15",
    L: "#f97316",
    S: "#22c55e",
  };
  return (
    <div className="grid grid-cols-4 gap-px bg-line p-px">
      {cells.map((c, i) => (
        <span
          key={i}
          className={`h-3 w-3 ${i < 8 && c ? "pv-bob" : ""}`}
          style={{ background: colors[c] ?? "var(--background)", ["--pv-d" as string]: "-6px" }}
        />
      ))}
    </div>
  );
}

function VampireSurvivorsPreview() {
  return (
    <div className="relative h-24 w-32 border border-line" style={{ background: "#1e1b4b" }}>
      <span className="pv-pulse absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "#facc15", boxShadow: "0 0 8px #facc15" }} />
      <span className="pv-pulse absolute left-3 top-3 h-2 w-2 rounded-full" style={{ background: "#ef4444" }} data-delay="1" />
      <span className="pv-pulse absolute right-4 top-6 h-2 w-2 rounded-full" style={{ background: "#ef4444" }} data-delay="3" />
      <span className="pv-pulse absolute left-8 bottom-3 h-2 w-2 rounded-full" style={{ background: "#a855f7" }} data-delay="2" />
      <span className="pv-pulse absolute right-3 bottom-5 h-2 w-2 rounded-full" style={{ background: "#a855f7" }} data-delay="4" />
      <span className="pv-flicker absolute left-1/2 top-1/2 h-px w-8 -translate-y-1/2" style={{ background: "linear-gradient(to right, #facc15, transparent)" }} />
    </div>
  );
}

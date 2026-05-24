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
  games: Game[];
};

const categories: Category[] = [
  {
    name: "Classic",
    blurb: "Six small arcades. The ones you already know how to play.",
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
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-32">
          <p className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            A small collection
          </p>
          <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-7xl">
            Games you can{" "}
            <span className="italic text-accent">start playing</span> in a
            single click.
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
        <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 py-3 sm:px-10">
          {ordered.map((category) => (
            <li key={category.name}>
              <a
                href={`#${slugify(category.name)}`}
                className="inline-block whitespace-nowrap border border-transparent px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:border-line hover:text-foreground"
              >
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
              <h2 className="font-serif text-3xl tracking-tight">
                {category.name}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted">
                {category.blurb}
              </p>
            </div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted whitespace-nowrap">
              {category.games.length} titles
            </span>
          </div>

          <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {category.games.map((game) => (
              <li key={game.slug} className="bg-background">
                <Link
                  href={`/games/${game.slug}`}
                  className="group flex h-full flex-col justify-between gap-10 p-8 transition-colors hover:bg-surface-hover sm:p-10"
                >
                  <div className="flex h-32 items-center justify-center">
                    {game.preview}
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                      {game.players}
                    </p>
                    <h3 className="mt-3 font-serif text-3xl tracking-tight">
                      {game.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      {game.tagline}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm text-foreground transition-colors group-hover:text-accent">
                      Play
                      <span
                        aria-hidden
                        className="transition-transform group-hover:translate-x-1"
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
  const cells = ["X", "", "O", "", "X", "", "O", "", "X"];
  return (
    <div className="grid grid-cols-3 gap-2">
      {cells.map((c, i) => (
        <div
          key={i}
          className="flex h-10 w-10 items-center justify-center border border-line font-serif text-xl text-muted"
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
            className={`h-4 w-4 border border-line ${
              isHead
                ? "bg-accent"
                : isBody
                  ? "bg-accent/60"
                  : isFood
                    ? "bg-foreground/70"
                    : ""
            }`}
          />
        );
      })}
    </div>
  );
}

function FlappyPreview() {
  return (
    <div className="relative h-24 w-32 border border-line">
      <span className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-foreground" />
      <span className="absolute left-16 top-0 h-8 w-4 bg-accent/70" />
      <span className="absolute left-16 bottom-0 h-10 w-4 bg-accent/70" />
      <span className="absolute right-2 top-0 h-12 w-4 bg-accent/70" />
      <span className="absolute right-2 bottom-0 h-6 w-4 bg-accent/70" />
    </div>
  );
}

function DinoPreview() {
  return (
    <div className="relative h-24 w-36 border border-line">
      <span className="absolute left-0 right-0 bottom-4 h-px bg-line" />
      <span className="absolute left-4 bottom-4 h-5 w-4 bg-accent" />
      <span className="absolute left-16 bottom-4 h-6 w-3 bg-foreground/70" />
      <span className="absolute left-24 bottom-4 h-4 w-3 bg-foreground/70" />
    </div>
  );
}

function DuckHuntPreview() {
  return (
    <div className="relative h-24 w-36 border border-line">
      <span className="absolute left-0 right-0 bottom-0 h-6 bg-foreground/10" />
      <span className="absolute right-3 top-3 h-3 w-5 bg-accent" />
      <span className="absolute left-6 top-1/2 h-3 w-5 bg-accent/50" />
      <span
        className="absolute left-14 top-1/3 h-px w-12 origin-left -rotate-12 bg-foreground/40"
        style={{
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
      <span className="absolute left-3 top-1/2 h-10 w-3 -translate-y-1/2 bg-accent" />
      <span className="absolute right-3 top-1/3 h-10 w-3 bg-foreground" />
      <span className="absolute left-8 top-1/2 h-1 w-3 -translate-y-1/2 bg-accent" />
      <span className="absolute right-8 top-1/2 h-1 w-3 -translate-y-1/2 bg-foreground" />
    </div>
  );
}

function GeometryDashPreview() {
  return (
    <div className="relative h-24 w-36 border border-line">
      <span className="absolute left-0 right-0 bottom-3 h-px bg-line" />
      <span className="absolute left-3 bottom-3 h-4 w-4 bg-accent" />
      <span
        className="absolute left-16 bottom-3 h-3 w-3 bg-foreground/70"
        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
      />
      <span
        className="absolute left-24 bottom-3 h-4 w-4 bg-foreground/70"
        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
      />
    </div>
  );
}

function BallFallPreview() {
  return (
    <div className="relative h-24 w-32 border border-line">
      <span className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-foreground" />
      <span className="absolute left-0 top-7 h-1 w-8 bg-accent/70" />
      <span className="absolute right-0 top-7 h-1 w-16 bg-accent/70" />
      <span className="absolute left-0 top-12 h-1 w-20 bg-accent/70" />
      <span className="absolute right-0 top-12 h-1 w-4 bg-accent/70" />
      <span className="absolute left-0 top-16 h-1 w-12 bg-accent/70" />
      <span className="absolute right-0 top-16 h-1 w-12 bg-accent/70" />
      <span className="absolute left-0 bottom-3 h-1 w-6 bg-accent/70" />
      <span className="absolute right-0 bottom-3 h-1 w-20 bg-accent/70" />
    </div>
  );
}

function SubwaySurfersPreview() {
  return (
    <div className="relative h-24 w-32 border border-line">
      <span className="absolute left-1/3 top-0 bottom-0 w-px bg-line" />
      <span className="absolute left-2/3 top-0 bottom-0 w-px bg-line" />
      <span className="absolute left-3 bottom-3 h-4 w-3 bg-accent" />
      <span className="absolute left-1/2 top-6 h-5 w-5 -translate-x-1/2 bg-foreground/70" />
      <span className="absolute right-3 top-12 h-4 w-3 bg-foreground/70" />
    </div>
  );
}

function FruitStabPreview() {
  return (
    <div className="relative h-24 w-24">
      <span className="absolute inset-2 rounded-full border border-line" />
      <span className="absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 rounded-full bg-accent" />
      <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-foreground" />
      <span className="absolute right-3 top-1/2 h-3 w-px -translate-y-1/2 rotate-90 bg-foreground" />
      <span className="absolute left-3 top-1/2 h-3 w-px -translate-y-1/2 rotate-90 bg-foreground" />
    </div>
  );
}

function DriftBossPreview() {
  return (
    <svg viewBox="0 0 100 80" className="h-24 w-32">
      <path
        d="M 10 70 Q 30 70 30 50 Q 30 30 50 30 Q 70 30 70 50 Q 70 70 90 70"
        stroke="var(--line)"
        strokeWidth="10"
        fill="none"
      />
      <circle cx="50" cy="30" r="3" fill="var(--accent)" />
    </svg>
  );
}

function FlappyDunkPreview() {
  return (
    <div className="relative h-24 w-24 border border-line">
      <span className="absolute left-1/2 top-3 h-3 w-3 -translate-x-1/2 rounded-full bg-foreground" />
      <span className="absolute left-1/4 right-1/4 bottom-6 h-px bg-accent" />
      <span className="absolute left-1/4 bottom-4 h-2 w-px bg-accent" />
      <span className="absolute right-1/4 bottom-4 h-2 w-px bg-accent" />
    </div>
  );
}

function RoadFighterPreview() {
  return (
    <div className="relative h-24 w-32 border border-line">
      <span className="absolute top-0 bottom-0 left-0 w-3 bg-line/40" />
      <span className="absolute top-0 bottom-0 right-0 w-3 bg-line/40" />
      <span className="absolute left-1/2 top-1 h-2 w-px -translate-x-1/2 bg-foreground/40" />
      <span className="absolute left-1/2 top-7 h-2 w-px -translate-x-1/2 bg-foreground/40" />
      <span className="absolute left-1/2 top-13 h-2 w-px -translate-x-1/2 bg-foreground/40" />
      <span className="absolute left-5 top-4 h-4 w-3 bg-foreground/70" />
      <span className="absolute right-6 top-10 h-4 w-3 bg-foreground/70" />
      <span className="absolute left-1/2 bottom-2 h-5 w-3 -translate-x-1/2 bg-accent" />
    </div>
  );
}

function JumpUpPreview() {
  return (
    <div className="relative h-24 w-24 border border-line">
      <span className="absolute left-3 top-3 h-1 w-8 bg-accent/70" />
      <span className="absolute right-3 top-9 h-1 w-10 bg-accent/70" />
      <span className="absolute left-2 top-16 h-1 w-9 bg-accent/70" />
      <span className="absolute left-1/2 top-12 h-3 w-3 -translate-x-1/2 bg-foreground" />
      <span className="absolute right-3 bottom-3 h-1 w-12 bg-accent/70" />
    </div>
  );
}

function CatsPreview() {
  return (
    <div className="grid grid-cols-4 gap-1">
      {Array.from({ length: 16 }).map((_, i) => {
        const filled = [0, 1, 5, 6, 10, 11, 14, 15].includes(i);
        return (
          <span
            key={i}
            className={`h-5 w-5 border border-line ${filled ? "bg-accent/70" : ""}`}
          />
        );
      })}
    </div>
  );
}

function SpaceInvadersPreview() {
  return (
    <div className="relative h-24 w-32 border border-line">
      <span className="absolute left-3 top-3 h-2 w-3 bg-rose-500/80" />
      <span className="absolute left-10 top-3 h-2 w-3 bg-rose-500/80" />
      <span className="absolute right-3 top-3 h-2 w-3 bg-rose-500/80" />
      <span className="absolute left-3 top-9 h-2 w-3 bg-accent" />
      <span className="absolute left-10 top-9 h-2 w-3 bg-accent" />
      <span className="absolute right-3 top-9 h-2 w-3 bg-accent" />
      <span className="absolute left-1/2 top-14 h-3 w-px -translate-x-1/2 bg-foreground" />
      <span className="absolute left-1/2 bottom-3 h-2 w-6 -translate-x-1/2 bg-foreground" />
    </div>
  );
}

function TennisPreview() {
  return (
    <div className="relative h-24 w-32 border border-line">
      <span className="absolute left-1/2 top-2 bottom-2 w-px bg-line" />
      <span className="absolute left-2 top-1/3 h-8 w-1 bg-accent" />
      <span className="absolute right-2 bottom-1/3 h-8 w-1 bg-foreground" />
      <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" />
    </div>
  );
}

function PacmanPreview() {
  return (
    <div className="relative h-24 w-24 border border-line">
      <span className="absolute left-2 right-2 top-2 h-1 bg-line" />
      <span className="absolute left-2 top-2 bottom-2 w-1 bg-line" />
      <span className="absolute right-2 top-2 bottom-2 w-1 bg-line" />
      <span className="absolute left-2 right-2 bottom-2 h-1 bg-line" />
      <span className="absolute left-5 top-5 h-3 w-3 rounded-full bg-accent" />
      <span className="absolute right-5 top-1/2 h-3 w-3 rounded-t-full bg-rose-500/80" />
      <span className="absolute left-1/2 bottom-5 h-1 w-1 -translate-x-1/2 rounded-full bg-muted" />
      <span className="absolute left-1/3 top-1/3 h-1 w-1 rounded-full bg-muted" />
    </div>
  );
}

function FlowFreePreview() {
  return (
    <div className="grid grid-cols-4 gap-1">
      {Array.from({ length: 16 }).map((_, i) => {
        const accent = [0, 4, 8, 9, 10, 11, 15].includes(i);
        const foreground = [3, 7, 13, 14].includes(i);
        return (
          <span
            key={i}
            className={`h-4 w-4 border border-line ${
              accent
                ? "bg-accent/70"
                : foreground
                  ? "bg-foreground/60"
                  : ""
            }`}
          />
        );
      })}
    </div>
  );
}

function TetrisPreview() {
  // 4 cols x 6 rows: a falling T-piece up top, a partial stack below.
  const cells: ("a" | "f" | "")[] = [
    "", "a", "",  "",
    "a", "a", "a", "",
    "",  "",  "",  "",
    "",  "",  "f", "f",
    "f", "f", "",  "f",
    "f", "a", "a", "f",
  ];
  return (
    <div className="grid grid-cols-4 gap-px bg-line p-px">
      {cells.map((c, i) => (
        <span
          key={i}
          className={`h-3 w-3 ${
            c === "a" ? "bg-accent/80" : c === "f" ? "bg-foreground/60" : "bg-background"
          }`}
        />
      ))}
    </div>
  );
}

function VampireSurvivorsPreview() {
  return (
    <div className="relative h-24 w-32 border border-line">
      <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-accent" />
      <span className="absolute left-3 top-3 h-2 w-2 bg-foreground/70" />
      <span className="absolute right-4 top-6 h-2 w-2 bg-foreground/70" />
      <span className="absolute left-8 bottom-3 h-2 w-2 bg-foreground/70" />
      <span className="absolute right-3 bottom-5 h-2 w-2 bg-foreground/70" />
      <span className="absolute left-1/2 top-1/2 h-px w-6 -translate-y-1/2 bg-accent/60" />
    </div>
  );
}

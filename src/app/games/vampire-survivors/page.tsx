import type { Metadata } from "next";
import MobileFullscreen from "../MobileFullscreen";
import VampireSurvivorsGame from "./VampireSurvivorsGame";

export const metadata: Metadata = {
  title: "Vampire Survivors · GetInstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        One player · WASD or arrows
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span className="italic text-accent">Vampire Survivors</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        You auto-fire. They auto-swarm. Move, collect XP, pick the right
        upgrades, survive.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="landscape">
          <VampireSurvivorsGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

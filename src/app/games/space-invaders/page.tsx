import type { Metadata } from "next";
import SpaceInvadersGame from "./SpaceInvadersGame";

export const metadata: Metadata = {
  title: "Space Invaders · InstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        One player · keyboard
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span className="italic text-accent">Space Invaders</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        A grid of aliens marches across the screen and one row down at each
        wall. Strafe, fire, clear the formation before it reaches you.
      </p>
      <div className="mt-12">
        <SpaceInvadersGame />
      </div>
    </div>
  );
}

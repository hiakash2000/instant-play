import type { Metadata } from "next";
import JumpUpGame from "./JumpUpGame";

export const metadata: Metadata = {
  title: "Jump Up · InstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        One player · arrows or A/D
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span className="italic text-accent">Jump Up</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        The character bounces on its own. Steer left and right to land on the
        next plank. The higher you climb, the more the planks slide.
      </p>
      <div className="mt-12">
        <JumpUpGame />
      </div>
    </div>
  );
}

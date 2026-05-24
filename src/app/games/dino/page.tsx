import type { Metadata } from "next";
import DinoGame from "./DinoGame";

export const metadata: Metadata = {
  title: "Dino · InstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        One player · keyboard
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span className="italic text-accent">Dino</span> run
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Endless desert. Jump over what gets in your way. The pace climbs the
        longer you survive.
      </p>
      <div className="mt-12">
        <DinoGame />
      </div>
    </div>
  );
}

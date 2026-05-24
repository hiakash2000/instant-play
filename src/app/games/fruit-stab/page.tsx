import type { Metadata } from "next";
import FruitStabGame from "./FruitStabGame";

export const metadata: Metadata = {
  title: "Fruit Stab · InstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        One player · tap or space
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span className="italic text-accent">Fruit Stab</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Stick all the knives in the fruit. Don&apos;t hit a knife already in
        there.
      </p>
      <div className="mt-12">
        <FruitStabGame />
      </div>
    </div>
  );
}

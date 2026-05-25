import type { Metadata } from "next";
import MobileFullscreen from "../MobileFullscreen";
import FruitStabGame from "./FruitStabGame";

export const metadata: Metadata = {
  title: "Fruit Stab · GetInstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: "#ef4444" }} />One player · tap or space
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span
          className="bg-clip-text italic text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #ef4444, #f97316)" }}
        >Fruit Stab</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Stick all the knives in the fruit. Don&apos;t hit a knife already in
        there.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="portrait">
          <FruitStabGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import MobileFullscreen from "../MobileFullscreen";
import DuelGame from "./DuelGame";

export const metadata: Metadata = {
  title: "Duel · GetInstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: "#ef4444" }} />One player · keyboard
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span
          className="bg-clip-text italic text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #ef4444, #3b82f6)" }}
        >Duel</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        You and a rival face each other. Both have five hits, both shoot.
        Whoever runs out of life first loses.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="landscape">
          <DuelGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

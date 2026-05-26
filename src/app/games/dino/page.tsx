import type { Metadata } from "next";
import MobileFullscreen from "../MobileFullscreen";
import DinoGame from "./DinoGame";

export const metadata: Metadata = {
  title: "Dino · GetInstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: "#0f766e" }} />One player · keyboard
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span
          className="bg-clip-text italic text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #0f766e, #f59e0b)" }}
        >Dino</span> run
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Endless desert. Jump over what gets in your way. The pace climbs the
        longer you survive.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="landscape" scorePlacement="side">
          <DinoGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

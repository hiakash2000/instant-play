import type { Metadata } from "next";
import MobileFullscreen from "../MobileFullscreen";
import FlappyGame from "./FlappyGame";

export const metadata: Metadata = {
  title: "Flappy · GetInstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        One player · click or keyboard
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span className="italic text-accent">Flappy</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Tap to flap, fall otherwise. Thread the gaps. Each pipe you pass is a
        point.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="landscape">
          <FlappyGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

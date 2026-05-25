import type { Metadata } from "next";
import MobileFullscreen from "../MobileFullscreen";
import FlappyDunkGame from "./FlappyDunkGame";

export const metadata: Metadata = {
  title: "Flappy Dunk · GetInstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        One player · tap or space
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span className="italic text-accent">Flappy Dunk</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        The ball bounces. The hoop drifts. Each tap keeps you in the air long
        enough to dunk it.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="portrait">
          <FlappyDunkGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

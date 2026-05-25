import type { Metadata } from "next";
import MobileFullscreen from "../MobileFullscreen";
import DriftBossGame from "./DriftBossGame";

export const metadata: Metadata = {
  title: "Drift Boss · GetInstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        One player · tap or space
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span className="italic text-accent">Drift Boss</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Tap to flip the wheel. The road keeps building itself — stay on it.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="portrait">
          <DriftBossGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

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
        <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: "#7dd3fc" }} />One player · tap or space
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span
          className="bg-clip-text italic text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #7dd3fc, #ec4899)" }}
        >Drift Boss</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Tap to flip the wheel. The road keeps building itself — stay on it.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="portrait" scorePlacement="below">
          <DriftBossGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

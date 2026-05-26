import type { Metadata } from "next";
import MobileFullscreen from "../MobileFullscreen";
import BallFallGame from "./BallFallGame";

export const metadata: Metadata = {
  title: "Ball Fall · GetInstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: "#f97316" }} />One player · arrows or drag
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span
          className="bg-clip-text italic text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #f97316, #22d3ee, #a78bfa, #f472b6)" }}
        >Ball Fall</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Endless wooden planks rising from below. Each one has a hole. Shift the
        stack left or right so the gap is under the ball before it lands.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="portrait" scorePlacement="below">
          <BallFallGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

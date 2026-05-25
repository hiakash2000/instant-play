import type { Metadata } from "next";
import MobileFullscreen from "../MobileFullscreen";
import RoadFighterGame from "./RoadFighterGame";

export const metadata: Metadata = {
  title: "Road Fighter · GetInstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: "#ef4444" }} />One player · arrows or A/D
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span
          className="bg-clip-text italic text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #ef4444, #facc15, #3b82f6)" }}
        >Road Fighter</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        A two-lane highway that never ends. Steer past oncoming cars and
        don&apos;t clip the curb. The longer you survive, the faster everything
        moves.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="portrait">
          <RoadFighterGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

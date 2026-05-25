import type { Metadata } from "next";
import MobileFullscreen from "../MobileFullscreen";
import SubwaySurfersGame from "./SubwaySurfersGame";

export const metadata: Metadata = {
  title: "Subway Surfers · GetInstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        One player · arrow keys
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span className="italic text-accent">Subway Surfers</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Three lanes, one runner, an endless yard of trains and barriers.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="portrait">
          <SubwaySurfersGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

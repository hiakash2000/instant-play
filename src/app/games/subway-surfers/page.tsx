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
        <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: "#ec4899" }} />One player · arrow keys
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span
          className="bg-clip-text italic text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #ec4899, #f97316, #22d3ee)" }}
        >Subway Surfers</span>
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

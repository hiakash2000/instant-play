import type { Metadata } from "next";
import MobileFullscreen from "../MobileFullscreen";
import CatsGame from "./CatsGame";

export const metadata: Metadata = {
  title: "Cats Organized Neatly · GetInstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: "#f472b6" }} />One player · drag
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span
          className="bg-clip-text italic text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #f472b6, #facc15, #4ade80, #60a5fa, #a78bfa)" }}
        >Cats Organized Neatly</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Drag every cat onto the grid without making them touch. They prefer it
        that way.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="portrait" scorePlacement="below">
          <CatsGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

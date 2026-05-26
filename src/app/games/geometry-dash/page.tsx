import type { Metadata } from "next";
import MobileFullscreen from "../MobileFullscreen";
import GeometryDashGame from "./GeometryDashGame";

export const metadata: Metadata = {
  title: "Geometry Dash · GetInstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: "#22d3ee" }} />One player · tap or space
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span
          className="bg-clip-text italic text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6)" }}
        >Geometry Dash</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        The square never stops running. Time your jumps to clear the spikes.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="landscape" scorePlacement="side">
          <GeometryDashGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

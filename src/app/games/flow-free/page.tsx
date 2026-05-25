import type { Metadata } from "next";
import MobileFullscreen from "../MobileFullscreen";
import FlowFreeGame from "./FlowFreeGame";

export const metadata: Metadata = {
  title: "Flow Free · GetInstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        One player · drag
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span className="italic text-accent">Flow Free</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Connect every pair of dots through the grid. No crossings, no gaps.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="portrait">
          <FlowFreeGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

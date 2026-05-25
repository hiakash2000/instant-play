import type { Metadata } from "next";
import MobileFullscreen from "../MobileFullscreen";
import TetrisGame from "./TetrisGame";

export const metadata: Metadata = {
  title: "Tetris · GetInstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: "#22d3ee" }} />One player · keyboard
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span
          className="bg-clip-text italic text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #22d3ee, #facc15, #a855f7, #22c55e, #ef4444, #f97316)" }}
        >Tetris</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Falling tetrominoes. Pack them, clear lines, and survive as the speed
        creeps up. Four lines at once is the only Tetris that matters.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="portrait">
          <TetrisGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

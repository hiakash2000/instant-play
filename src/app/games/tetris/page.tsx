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
        One player · keyboard
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span className="italic text-accent">Tetris</span>
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

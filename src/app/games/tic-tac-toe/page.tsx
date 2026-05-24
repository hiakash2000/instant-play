import type { Metadata } from "next";
import TicTacToeBoard from "./TicTacToeBoard";

export const metadata: Metadata = {
  title: "Tic Tac Toe · InstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        One player · vs CPU
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        Tic <span className="italic text-accent">Tac</span> Toe
      </h1>
      <p className="mt-4 max-w-md text-muted">
        You play X, the CPU plays O. It uses minimax and will not blunder — the
        best you can do against perfect play is a draw.
      </p>
      <div className="mt-12">
        <TicTacToeBoard />
      </div>
    </div>
  );
}

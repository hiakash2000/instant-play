import type { Metadata } from "next";
import TennisGame from "./TennisGame";

export const metadata: Metadata = {
  title: "Tennis · InstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        One player · keyboard
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span className="italic text-accent">Tennis</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Two paddles, one ball. You on the left, the machine on the right. The
        ball speeds up every rally.
      </p>
      <div className="mt-12">
        <TennisGame />
      </div>
    </div>
  );
}

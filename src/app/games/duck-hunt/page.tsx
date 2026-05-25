import type { Metadata } from "next";
import MobileFullscreen from "../MobileFullscreen";
import DuckHuntGame from "./DuckHuntGame";

export const metadata: Metadata = {
  title: "Duck Hunt · GetInstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: "#f97316" }} />One player · mouse
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        Duck <span
          className="bg-clip-text italic text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #f97316, #ef4444)" }}
        >Hunt</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Sixty seconds. Click the ducks before they reach the other side. Some
        will hide in the bush and pop up where you aren&apos;t looking.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="landscape">
          <DuckHuntGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

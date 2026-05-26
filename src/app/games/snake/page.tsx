import type { Metadata } from "next";
import MobileFullscreen from "../MobileFullscreen";
import SnakeGame from "./SnakeGame";

export const metadata: Metadata = {
  title: "Snake · GetInstantPlay",
};

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        <span aria-hidden className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: "#22c55e" }} />One player · keyboard
      </p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">
        <span
          className="bg-clip-text italic text-transparent"
          style={{ backgroundImage: "linear-gradient(90deg, #22c55e, #facc15)" }}
        >Snake</span>
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Steer with the arrow keys. Eat to grow. The only rule is don&apos;t
        bite yourself.
      </p>
      <div className="mt-12">
        <MobileFullscreen orientation="portrait">
          <SnakeGame />
        </MobileFullscreen>
      </div>
    </div>
  );
}

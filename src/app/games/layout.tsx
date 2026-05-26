import Link from "next/link";
import MuteToggle from "../MuteToggle";

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full opacity-35 blur-3xl"
        style={{
          background: "radial-gradient(circle, #ff5d8f, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-32 h-80 w-80 rounded-full opacity-30 blur-3xl"
        style={{
          background: "radial-gradient(circle, #38bdf8, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/3 -bottom-40 h-[28rem] w-[28rem] rounded-full opacity-25 blur-3xl"
        style={{
          background: "radial-gradient(circle, #a78bfa, transparent 70%)",
        }}
      />
      <div className="relative flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 pt-6 sm:px-10 sm:pt-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted backdrop-blur transition-all hover:border-foreground hover:text-foreground"
          >
            <span
              aria-hidden
              className="transition-transform group-hover:-translate-x-0.5"
            >
              ←
            </span>
            Back to all games
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3.5 py-1.5 backdrop-blur">
            <MuteToggle />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

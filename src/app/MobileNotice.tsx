export default function MobileNotice() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          Instant<span className="italic text-accent">play</span>
        </p>
        <h1 className="mt-6 font-serif text-3xl leading-tight text-foreground">
          Best played on a bigger screen
        </h1>
        <p className="mt-4 text-sm text-muted">
          InstantPlay isn&apos;t optimized for phones just yet. Pop open this
          link on your laptop or desktop to play — keyboard and mouse make
          everything feel right.
        </p>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          See you on a computer
        </p>
      </div>
    </div>
  );
}

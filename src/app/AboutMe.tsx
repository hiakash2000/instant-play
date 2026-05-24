"use client";

import { useEffect, useState } from "react";

export default function AboutMe() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground"
      >
        About me
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-xl border border-line bg-background p-8 sm:p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground"
              aria-label="Close"
            >
              Close
            </button>

            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              About
            </p>
            <h2
              id="about-title"
              className="mt-3 font-serif text-4xl tracking-tight"
            >
              Akash <span className="italic text-accent">Kumar</span>
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
              <p>
                I&apos;m a software engineer who likes shipping things
                end-to-end. This site is a portfolio piece — a single Next.js
                app hosting a couple dozen browser games behind one consistent
                UI, with a dark/light theme and a single tap to play.
              </p>
              <p>
                I care about pragmatic code that fits the problem: short
                files, no premature abstractions, and edges that actually
                handle the real cases.{" "}
                <a
                  href="https://www.linkedin.com/in/hiakash2000/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline decoration-line underline-offset-4 hover:text-accent"
                >
                  My LinkedIn
                </a>{" "}
                has the longer story — roles, stack, recent projects.
              </p>
              <p className="border-l border-line pl-4">
                <span className="block font-mono text-xs uppercase tracking-[0.2em] text-foreground">
                  Why hire me
                </span>
                <span className="mt-2 block">
                  Small surface area, big throughput. I prototype quickly,
                  cut scope when it&apos;s right, and finish what I start.
                  I&apos;m comfortable owning a feature from the ambiguous
                  product brief all the way through shipping and the boring
                  parts after — perf, accessibility, telemetry.
                </span>
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <a
                href="mailto:alpha1akash@gmail.com"
                className="font-mono text-xs uppercase tracking-[0.2em] text-accent hover:text-foreground"
              >
                alpha1akash@gmail.com →
              </a>
              <a
                href="https://www.linkedin.com/in/hiakash2000/"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground"
              >
                linkedin.com/in/hiakash2000 →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

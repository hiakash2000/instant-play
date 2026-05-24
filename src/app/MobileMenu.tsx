"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AboutMe from "./AboutMe";
import ThemeToggle from "./ThemeToggle";

export default function MobileMenu() {
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
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center text-muted hover:text-foreground"
      >
        <span aria-hidden className="flex flex-col gap-[5px]">
          <span className="block h-px w-5 bg-current" />
          <span className="block h-px w-5 bg-current" />
          <span className="block h-px w-5 bg-current" />
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/80"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          onClick={() => setOpen(false)}
        >
          <div
            className="ml-auto h-full w-72 max-w-[85%] border-l border-line bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground"
              >
                Close
              </button>
            </div>

            <ul className="mt-8 flex flex-col gap-6 border-t border-line pt-6">
              <li>
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground"
                >
                  All games
                </Link>
              </li>
              <li>
                <AboutMe />
              </li>
              <li>
                <ThemeToggle />
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

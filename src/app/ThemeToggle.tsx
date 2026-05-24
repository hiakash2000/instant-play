"use client";

import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";

const STORAGE_KEY = "instantplay-theme";

function readStored(): Mode {
  if (typeof window === "undefined") return "system";
  const match = document.cookie.match(
    /(?:^|;\s*)instantplay-theme=(light|dark)/,
  );
  if (match) return match[1] as Mode;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "light" || v === "dark") return v;
  return "system";
}

function setCookie(mode: Mode) {
  if (mode === "system") {
    document.cookie = "instantplay-theme=; path=/; max-age=0; samesite=lax";
  } else {
    document.cookie = `instantplay-theme=${mode}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }
}

function apply(mode: Mode) {
  const root = document.documentElement;
  if (mode === "system") {
    root.removeAttribute("data-theme");
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    root.setAttribute("data-theme", mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }
  setCookie(mode);
}

const NEXT: Record<Mode, Mode> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const LABEL: Record<Mode, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMode(readStored());
    setMounted(true);
  }, []);

  const cycle = () => {
    const next = NEXT[mode];
    apply(next);
    setMode(next);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      className="font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground"
      aria-label={`Theme: ${LABEL[mode]} (click to change)`}
    >
      {mounted ? LABEL[mode] : "Theme"}
    </button>
  );
}

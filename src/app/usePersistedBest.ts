"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Updater = number | ((prev: number) => number);

export function usePersistedBest(slug: string): [number, (n: Updater) => void] {
  const [best, setBestState] = useState(0);
  const key = `instantplay-best-${slug}`;
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(key);
      if (v) {
        const n = parseInt(v, 10);
        if (Number.isFinite(n) && n > 0) setBestState(n);
      }
    } catch {}
    loaded.current = true;
  }, [key]);

  const setBest = useCallback(
    (updater: Updater) => {
      setBestState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (next !== prev && loaded.current) {
          try {
            window.localStorage.setItem(key, String(next));
          } catch {}
        }
        return next;
      });
    },
    [key],
  );

  return [best, setBest];
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  orientation: "landscape" | "portrait";
  children: React.ReactNode;
};

type FsElement = HTMLDivElement & {
  webkitRequestFullscreen?: () => Promise<void>;
};
type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};
type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape" | "portrait") => Promise<void>;
};

export default function MobileFullscreen({ orientation, children }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [needsRotate, setNeedsRotate] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const small = window.matchMedia("(max-width: 900px)").matches;
    setIsMobile(coarse && small);
  }, []);

  useEffect(() => {
    const onChange = () => {
      const d = document as FsDocument;
      const el = d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
      setIsFullscreen(el === stageRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      setNeedsRotate(false);
      setScale(1);
      return;
    }
    const compute = () => {
      const stage = stageRef.current;
      const inner = innerRef.current;
      if (!stage || !inner) return;
      const sw = stage.clientWidth;
      const sh = stage.clientHeight;
      const wide = sw > sh;
      const wantsLandscape = orientation === "landscape";
      setNeedsRotate(isMobile && wantsLandscape !== wide);

      const prev = inner.style.transform;
      inner.style.transform = "none";
      const rect = inner.getBoundingClientRect();
      inner.style.transform = prev;
      const naturalW = rect.width;
      const naturalH = rect.height;
      if (naturalW > 0 && naturalH > 0) {
        const pad = 0.94;
        const s = Math.min((sw / naturalW) * pad, (sh / naturalH) * pad);
        setScale(s > 0 ? s : 1);
      }
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (stageRef.current) ro.observe(stageRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    window.addEventListener("orientationchange", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", compute);
    };
  }, [isFullscreen, isMobile, orientation]);

  const enter = useCallback(async () => {
    const el = stageRef.current as FsElement | null;
    if (!el) return;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      }
    } catch {}
    const so = screen.orientation as LockableOrientation | undefined;
    if (so?.lock) {
      try {
        await so.lock(orientation);
      } catch {}
    }
  }, [orientation]);

  const exit = useCallback(async () => {
    const d = document as FsDocument;
    try {
      if (d.exitFullscreen) await d.exitFullscreen();
      else if (d.webkitExitFullscreen) await d.webkitExitFullscreen();
    } catch {}
  }, []);

  return (
    <>
      {isMobile && !isFullscreen && (
        <div className="mb-6 flex sm:hidden">
          <button
            type="button"
            onClick={enter}
            className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-2 text-sm text-foreground transition-colors hover:bg-surface-hover"
          >
            <span aria-hidden>⛶</span>
            Play fullscreen
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              {orientation}
            </span>
          </button>
        </div>
      )}
      <div
        ref={stageRef}
        className={
          isFullscreen
            ? "fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background"
            : ""
        }
      >
        {isFullscreen && (
          <button
            type="button"
            onClick={exit}
            className="absolute right-3 top-3 z-20 rounded-md border border-line bg-surface/90 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted backdrop-blur transition-colors hover:text-foreground"
          >
            Exit ✕
          </button>
        )}
        {isFullscreen && needsRotate && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/85 p-6 text-center">
            <div className="max-w-xs">
              <p className="font-serif text-2xl">Rotate your device</p>
              <p className="mt-2 text-sm text-muted">
                This game plays best in {orientation}.
              </p>
            </div>
          </div>
        )}
        <div
          ref={innerRef}
          style={
            isFullscreen
              ? { transform: `scale(${scale})`, transformOrigin: "center center" }
              : undefined
          }
        >
          {children}
        </div>
      </div>
    </>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  orientation: "landscape" | "portrait";
  scorePlacement?: "overlay" | "below" | "side";
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

const SCORE_LABEL_RE =
  /^(score|best|lines?|level|time|wave|streak|coins?|hits?|kills?|round|combo|misses?|stars?|chain|distance|moves?|stage|xp|hp|health|points?|hi-?score|highscore|laps?|round|round)$/i;

function isInstructionElement(el: HTMLElement): boolean {
  const cls = typeof el.className === "string" ? el.className : "";
  if (!cls.includes("text-muted")) return false;
  const text = (el.textContent || "").trim();
  if (text.length < 18) return false;
  if (/[←→↑↓]/.test(text)) return true;
  if (text.includes(" · ")) return true;
  const lower = text.toLowerCase();
  return (
    lower.includes("arrows") ||
    lower.includes("keyboard") ||
    lower.includes("drag") ||
    lower.includes("space to ") ||
    lower.includes("tap to ") ||
    lower.includes("how to play")
  );
}

function collectNonEssential(root: HTMLElement): HTMLElement[] {
  const hits: HTMLElement[] = [];
  root.querySelectorAll<HTMLElement>("p").forEach((p) => {
    if (isInstructionElement(p)) hits.push(p);
  });
  root.querySelectorAll<HTMLElement>("div").forEach((card) => {
    const heading = card.querySelector<HTMLElement>("p, span");
    if (heading?.textContent?.trim().toLowerCase() === "how to play") {
      hits.push(card);
    }
  });
  return hits;
}

function findPlayfield(root: HTMLElement): HTMLElement | null {
  for (const el of Array.from(root.querySelectorAll<HTMLElement>("div"))) {
    const cls = typeof el.className === "string" ? el.className : "";
    if (
      cls.includes("select-none") &&
      (cls.includes("touch-none") || cls.includes("touch-manipulation"))
    ) {
      return el;
    }
  }
  const canvas = root.querySelector("canvas");
  if (canvas?.parentElement) return canvas.parentElement;
  let best: HTMLElement | null = null;
  let bestArea = 0;
  root.querySelectorAll<HTMLElement>("div").forEach((d) => {
    const a = d.clientWidth * d.clientHeight;
    if (d.clientWidth > 100 && d.clientHeight > 100 && a > bestArea) {
      bestArea = a;
      best = d;
    }
  });
  return best;
}

function findScorePanel(
  root: HTMLElement,
  playfield: HTMLElement | null,
): HTMLElement | null {
  const candidates = Array.from(root.querySelectorAll<HTMLElement>("div")).reverse();
  let multiHit: HTMLElement | null = null;
  let singleHit: HTMLElement | null = null;
  for (const div of candidates) {
    if (playfield && (div === playfield || playfield.contains(div) || div.contains(playfield))) {
      continue;
    }
    let count = 0;
    const labels = div.querySelectorAll<HTMLElement>("p, span");
    for (const p of Array.from(labels)) {
      const text = (p.textContent || "").trim();
      if (text.length > 0 && text.length < 14 && SCORE_LABEL_RE.test(text)) {
        count++;
      }
    }
    if (count >= 2 && !multiHit) multiHit = div;
    if (count >= 1 && !singleHit) singleHit = div;
  }
  return multiHit ?? singleHit;
}

type Snapshot = { el: HTMLElement; cssText: string };
type ScoreMove = {
  panel: HTMLElement;
  parent: ParentNode;
  next: ChildNode | null;
  panelSnap: Snapshot;
  childSnaps: Snapshot[];
};

function snapshot(el: HTMLElement): Snapshot {
  return { el, cssText: el.style.cssText };
}
function restore(s: Snapshot) {
  s.el.style.cssText = s.cssText;
}

export default function MobileFullscreen({
  orientation,
  scorePlacement = "overlay",
  children,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLElement[]>([]);
  const playfieldSnapRef = useRef<Snapshot | null>(null);
  const scoreMoveRef = useRef<ScoreMove | null>(null);
  const sideSnapsRef = useRef<Snapshot[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [needsRotate, setNeedsRotate] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const onChange = () => {
      const d = document as FsDocument;
      const el = d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
      if (el) {
        setIsFullscreen(el === stageRef.current);
      } else if (
        typeof document.exitFullscreen === "function" ||
        typeof (document as FsDocument).webkitExitFullscreen === "function"
      ) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) {
      setNeedsRotate(false);
      setScale(1);
      hiddenRef.current.forEach((el) => {
        el.style.display = "";
      });
      hiddenRef.current = [];

      const move = scoreMoveRef.current;
      if (move) {
        move.childSnaps.forEach(restore);
        restore(move.panelSnap);
        move.parent.insertBefore(move.panel, move.next);
        scoreMoveRef.current = null;
      }
      if (playfieldSnapRef.current) {
        restore(playfieldSnapRef.current);
        playfieldSnapRef.current = null;
      }
      if (sideSnapsRef.current.length) {
        sideSnapsRef.current.forEach(restore);
        sideSnapsRef.current = [];
      }
      return;
    }

    const inner = innerRef.current;
    if (!inner) return;

    const targets = collectNonEssential(inner);
    targets.forEach((el) => {
      el.style.display = "none";
    });
    hiddenRef.current = targets;

    if (scorePlacement === "side") {
      const outer = inner.firstElementChild as HTMLElement | null;
      const cls =
        outer && typeof outer.className === "string" ? outer.className : "";
      if (outer && cls.includes("grid")) {
        sideSnapsRef.current.push(snapshot(outer));
        outer.style.gridTemplateColumns = "auto auto";
        outer.style.alignItems = "start";
        outer.style.gap = "0.75rem";

        const rightCol = outer.children[1] as HTMLElement | undefined;
        if (rightCol) {
          sideSnapsRef.current.push(snapshot(rightCol));
          rightCol.style.maxWidth = "260px";
        }
      }
    }

    const playfield = findPlayfield(inner);
    const panel =
      playfield && scorePlacement === "overlay"
        ? findScorePanel(inner, playfield)
        : null;

    if (playfield && panel) {
      playfieldSnapRef.current = snapshot(playfield);
      playfield.style.position = "relative";

      const childSnaps: Snapshot[] = [];
      Array.from(panel.children).forEach((c) => {
        const el = c as HTMLElement;
        childSnaps.push(snapshot(el));
        el.style.background = "transparent";
        el.style.padding = "0";
        el.style.border = "none";
        el.style.minWidth = "0";
        el.style.display = "flex";
        el.style.alignItems = "baseline";
        el.style.gap = "4px";
      });
      panel.querySelectorAll<HTMLElement>("p, span").forEach((textEl) => {
        const text = (textEl.textContent || "").trim();
        if (text.length === 0 || text.length > 14) return;
        childSnaps.push(snapshot(textEl));
        textEl.style.marginTop = "0";
        textEl.style.lineHeight = "1";
        if (SCORE_LABEL_RE.test(text)) {
          textEl.style.fontSize = "7px";
          textEl.style.letterSpacing = "0.1em";
          textEl.style.opacity = "0.7";
        } else {
          textEl.style.fontSize = "10px";
          textEl.style.fontWeight = "600";
        }
      });

      const panelSnap = snapshot(panel);
      const move: ScoreMove = {
        panel,
        parent: panel.parentNode!,
        next: panel.nextSibling,
        panelSnap,
        childSnaps,
      };
      scoreMoveRef.current = move;

      panel.style.position = "absolute";
      panel.style.top = "4px";
      panel.style.right = "4px";
      panel.style.left = "auto";
      panel.style.transform = "none";
      panel.style.zIndex = "30";
      panel.style.display = "flex";
      panel.style.flexDirection = "column";
      panel.style.alignItems = "flex-end";
      panel.style.gap = "1px";
      panel.style.background = "rgba(0,0,0,0.45)";
      panel.style.backdropFilter = "blur(6px)";
      panel.style.border = "1px solid rgba(255,255,255,0.1)";
      panel.style.borderRadius = "4px";
      panel.style.padding = "2px 5px";
      panel.style.color = "#fff";
      panel.style.gridTemplateColumns = "none";
      panel.style.gridTemplateRows = "none";
      panel.style.width = "auto";
      panel.style.maxWidth = "40%";
      panel.style.pointerEvents = "none";

      playfield.appendChild(panel);
    }

    const compute = () => {
      const stage = stageRef.current;
      const innerEl = innerRef.current;
      if (!stage || !innerEl) return;
      const sw = stage.clientWidth;
      const sh = stage.clientHeight;
      const wide = sw > sh;
      const wantsLandscape = orientation === "landscape";
      setNeedsRotate(isMobile && wantsLandscape !== wide);

      const prev = innerEl.style.transform;
      innerEl.style.transform = "none";
      const rect = innerEl.getBoundingClientRect();
      innerEl.style.transform = prev;
      const naturalW = rect.width;
      const naturalH = rect.height;
      if (naturalW > 0 && naturalH > 0) {
        const pad = 0.96;
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
  }, [isFullscreen, isMobile, orientation, scorePlacement]);

  const enter = useCallback(async () => {
    const el = stageRef.current as FsElement | null;
    if (!el) return;
    let nativeEntered = false;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
        nativeEntered = true;
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
        nativeEntered = true;
      }
    } catch {}
    if (!nativeEntered) {
      setIsFullscreen(true);
    }
    const so = screen.orientation as LockableOrientation | undefined;
    if (so?.lock) {
      try {
        await so.lock(orientation);
      } catch {}
    }
  }, [orientation]);

  const exit = useCallback(async () => {
    const d = document as FsDocument;
    const native = d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
    if (native) {
      try {
        if (d.exitFullscreen) await d.exitFullscreen();
        else if (d.webkitExitFullscreen) await d.webkitExitFullscreen();
      } catch {}
    } else {
      setIsFullscreen(false);
    }
  }, []);

  return (
    <>
      {isMobile && !isFullscreen && (
        <div className="mb-6 flex">
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
            ? "fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black"
            : ""
        }
      >
        {isFullscreen && (
          <button
            type="button"
            onClick={exit}
            className="absolute right-3 top-3 z-40 rounded-md border border-white/15 bg-black/60 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/70 backdrop-blur transition-colors hover:text-white"
          >
            Exit ✕
          </button>
        )}
        {isFullscreen && needsRotate && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/85 p-6 text-center">
            <div className="max-w-xs">
              <p className="font-serif text-2xl text-white">Rotate your device</p>
              <p className="mt-2 text-sm text-white/60">
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

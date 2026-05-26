"use client";

import { useEffect, useState } from "react";

export type SoundKind =
  | "jump"
  | "flap"
  | "shoot"
  | "hit"
  | "explode"
  | "score"
  | "collect"
  | "crash"
  | "win"
  | "lose"
  | "click";

const MUTE_KEY = "instantplay-muted";

let sharedCtx: AudioContext | null = null;
let muted = false;
const muteListeners = new Set<() => void>();

if (typeof window !== "undefined") {
  muted = window.localStorage.getItem(MUTE_KEY) === "1";
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    sharedCtx = new Ctor();
  }
  return sharedCtx;
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  }
  muteListeners.forEach((fn) => fn());
}

export function useMute() {
  const [m, setM] = useState(muted);
  useEffect(() => {
    const fn = () => setM(muted);
    muteListeners.add(fn);
    return () => {
      muteListeners.delete(fn);
    };
  }, []);
  return { muted: m, toggle: () => setMuted(!muted) };
}

export function playSound(kind: SoundKind) {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  let stopAt = now + 0.15;

  switch (kind) {
    case "jump":
      osc.type = "square";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      stopAt = now + 0.15;
      break;
    case "flap":
      osc.type = "triangle";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.06);
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      stopAt = now + 0.12;
      break;
    case "shoot":
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      stopAt = now + 0.12;
      break;
    case "hit":
      osc.type = "square";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      stopAt = now + 0.15;
      break;
    case "explode":
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      stopAt = now + 0.35;
      break;
    case "score":
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1200, now + 0.06);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      stopAt = now + 0.2;
      break;
    case "collect":
      osc.type = "triangle";
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      stopAt = now + 0.15;
      break;
    case "crash":
      osc.type = "square";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      stopAt = now + 0.45;
      break;
    case "win": {
      // ascending arpeggio C E G C
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.12);
      osc.frequency.setValueAtTime(783.99, now + 0.24);
      osc.frequency.setValueAtTime(1046.5, now + 0.36);
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      stopAt = now + 0.6;
      break;
    }
    case "lose":
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.5);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      stopAt = now + 0.55;
      break;
    case "click":
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      stopAt = now + 0.07;
      break;
  }

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(stopAt);
}

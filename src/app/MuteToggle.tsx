"use client";

import { useMute } from "./games/sound";

export default function MuteToggle() {
  const { muted, toggle } = useMute();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}
      title={muted ? "Sound off" : "Sound on"}
      className="font-mono text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground"
    >
      {muted ? "Sound off" : "Sound on"}
    </button>
  );
}

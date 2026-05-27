"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  width: number;
  height: number;
  className?: string;
  children: React.ReactNode;
};

export default function ResponsivePlayfield({
  width,
  height,
  className,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(Math.min(1, w / width));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [width]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        width: "100%",
        maxWidth: width,
        minWidth: 0,
        height: height * scale,
        position: "relative",
        overflow: "hidden",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

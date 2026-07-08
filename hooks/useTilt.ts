"use client";

import { useRef } from "react";
import { prefersReducedMotion } from "@/lib/utils";

/**
 * Cursor spotlight + subtle 3D tilt for a card. Spread the returned handlers on
 * the element and attach `ref`. Sets --mx/--my (for the .spotlight glow) and a
 * perspective tilt transform toward the pointer. Tilt is skipped under
 * prefers-reduced-motion (the spotlight vars are still updated harmlessly).
 */
export function useTilt(maxDeg = 6) {
  const ref = useRef<HTMLDivElement>(null);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
    if (prefersReducedMotion()) return;
    const rx = (0.5 - py) * maxDeg;
    const ry = (px - 0.5) * maxDeg;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px)`;
    // Drop shadow shifts opposite the tilt so the card reads as floating.
    el.style.boxShadow = `${-ry * 2}px ${16 - rx * 2}px 34px -14px rgba(15, 60, 55, 0.42)`;
  }

  function onMouseLeave() {
    const el = ref.current;
    if (el) {
      el.style.transform = "";
      el.style.boxShadow = "";
    }
  }

  return { ref, onMouseMove, onMouseLeave };
}

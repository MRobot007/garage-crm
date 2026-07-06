"use client";

import { useEffect, useRef, useState } from "react";
import anime from "animejs";
import { prefersReducedMotion } from "@/lib/utils";

/**
 * Animate a number from 0 → value once, using anime.js.
 * Falls back to the final value instantly when reduced motion is preferred.
 */
export function useCountUp(value: number, duration = 900): number {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    const obj = { n: started.current ? value : 0 };
    started.current = true;
    const anim = anime({
      targets: obj,
      n: value,
      round: 1,
      duration,
      easing: "easeOutCubic",
      update: () => setDisplay(obj.n),
    });
    return () => anim.pause();
  }, [value, duration]);

  return display;
}

"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";
import { prefersReducedMotion } from "@/lib/utils";

/**
 * Subtle staggered fade/slide-in for a list's direct children on first load.
 * Pass a CSS selector for the items to animate within the container.
 * `signal` (e.g. a row count or a key) re-runs the reveal when it changes.
 */
export function useStaggerReveal<T extends HTMLElement>(
  selector: string,
  signal: unknown,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const items = container.querySelectorAll(selector);
    if (items.length === 0) return;
    if (prefersReducedMotion()) {
      items.forEach((el) => ((el as HTMLElement).style.opacity = "1"));
      return;
    }
    anime.set(items, { opacity: 0, translateY: 6 });
    anime({
      targets: items,
      opacity: [0, 1],
      translateY: [6, 0],
      delay: anime.stagger(24),
      duration: 320,
      easing: "easeOutQuad",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal]);

  return ref;
}

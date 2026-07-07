import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind-aware class merger for shadcn/ui primitives.
 *
 * Kept separate from the app-wide `cn` in lib/utils.ts on purpose: shadcn
 * components rely on tailwind-merge to let a caller's className override the
 * component's own conflicting utilities, whereas the rest of the app uses a
 * plain join. Scoping this here keeps the new primitives idiomatic without
 * changing how every existing component composes classes.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

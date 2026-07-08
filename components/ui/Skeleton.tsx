import { cn } from "@/lib/utils";

/** A shimmering placeholder block. Compose several to mirror real layout. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

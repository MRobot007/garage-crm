// Lightweight in-memory sliding-window rate limiter.
//
// NOTE: state lives in the process, so on serverless (Vercel) it's per-instance
// and resets on cold starts — a best-effort throttle, not a hard guarantee.
// For strict limits across instances, back this with Upstash/Vercel KV. It still
// meaningfully blunts naive floods and brute-force from a single source.

interface Bucket {
  hits: number[];
}

const store = new Map<string, Bucket>();

/**
 * Returns true if the action is allowed, false if the caller is over the limit.
 * @param key   unique key (e.g. `login:${ip}`)
 * @param limit max events allowed within the window
 * @param windowMs window length in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const bucket = store.get(key) ?? { hits: [] };
  // Drop timestamps outside the window.
  bucket.hits = bucket.hits.filter((t) => t > cutoff);
  if (bucket.hits.length >= limit) {
    store.set(key, bucket);
    return false;
  }
  bucket.hits.push(now);
  store.set(key, bucket);
  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (store.size > 5000) {
    for (const [k, b] of store) {
      if (b.hits.every((t) => t <= cutoff)) store.delete(k);
    }
  }
  return true;
}

/** Best-effort client IP from proxy headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// Lightweight shared-password session: an HMAC-signed, expiring cookie.
// Runs on both the Edge runtime (middleware) and Node (route handlers), so it
// only uses Web Crypto + btoa/atob + TextEncoder — no Node-only APIs.

export const SESSION_COOKIE = "crm_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

// Fallback keeps local dev working, but production MUST set these env vars.
export const AUTH_SECRET = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
export const CRM_PASSWORD = process.env.CRM_PASSWORD || "changeme";

const encoder = new TextEncoder();

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const strToB64url = (s: string) => bytesToB64url(encoder.encode(s));
const b64urlToStr = (s: string) => new TextDecoder().decode(b64urlToBytes(s));

// TS 5.7+ made Uint8Array generic over its backing buffer; widen to BufferSource
// so the Web Crypto calls type-check on both Edge and Node.
const buf = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    buf(encoder.encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Create a signed session token that expires SESSION_MAX_AGE from now. */
export async function createSessionToken(secret: string): Promise<string> {
  const payload = strToB64url(
    JSON.stringify({ exp: Date.now() + SESSION_MAX_AGE * 1000 }),
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    buf(encoder.encode(payload)),
  );
  return `${payload}.${bytesToB64url(new Uint8Array(sig))}`;
}

/** Verify a session token's signature and expiry. */
export async function verifySessionToken(
  token: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let sigBytes: Uint8Array;
  try {
    sigBytes = b64urlToBytes(sig);
  } catch {
    return false;
  }

  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret),
    buf(sigBytes),
    buf(encoder.encode(payload)),
  );
  if (!valid) return false;

  try {
    const data = JSON.parse(b64urlToStr(payload)) as { exp?: number };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

/** Constant-time-ish password comparison. */
export function passwordMatches(input: string): boolean {
  const a = encoder.encode(input);
  const b = encoder.encode(CRM_PASSWORD);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// Per-user auth. HMAC-signed session cookie carrying the user id + role, plus
// PBKDF2 password hashing. Uses only Web Crypto + btoa/atob so it works on both
// the Edge runtime (middleware verifies the session) and Node (login/hashing).

export const SESSION_COOKIE = "crm_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

// Session tokens are HMAC-signed with this. NEVER fall back to a literal in
// production — an unset secret there would let anyone forge an owner session.
// Fail closed in prod; allow a clearly-marked dev fallback locally only.
if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET is not set — refusing to start with an insecure fallback.");
}
export const AUTH_SECRET =
  process.env.AUTH_SECRET || "dev-insecure-secret-change-me";

export type Role = "owner" | "manager" | "staff";

export interface Session {
  uid: string;
  role: Role;
  name: string;
}

const encoder = new TextEncoder();
const buf = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

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

// ─────────────────────────── session tokens ───────────────────────────
async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    buf(encoder.encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(
  secret: string,
  session: Session,
): Promise<string> {
  const payload = strToB64url(
    JSON.stringify({ ...session, exp: Date.now() + SESSION_MAX_AGE * 1000 }),
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    buf(encoder.encode(payload)),
  );
  return `${payload}.${bytesToB64url(new Uint8Array(sig))}`;
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string,
): Promise<Session | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let sigBytes: Uint8Array;
  try {
    sigBytes = b64urlToBytes(sig);
  } catch {
    return null;
  }
  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret),
    buf(sigBytes),
    buf(encoder.encode(payload)),
  );
  if (!valid) return null;

  try {
    const data = JSON.parse(b64urlToStr(payload)) as {
      uid?: string;
      role?: Role;
      name?: string;
      exp?: number;
    };
    if (typeof data.exp !== "number" || data.exp <= Date.now()) return null;
    if (!data.uid || !data.role) return null;
    return { uid: data.uid, role: data.role, name: data.name || "" };
  } catch {
    return null;
  }
}

// ─────────────────────────── passwords (PBKDF2) ───────────────────────────
const PBKDF2_ITERATIONS = 100_000;

async function pbkdf2(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    buf(encoder.encode(password)),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: buf(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return new Uint8Array(bits);
}

/** Hash a password → "salt.hash" (both base64url). */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);
  return `${bytesToB64url(salt)}.${bytesToB64url(hash)}`;
}

/** Verify a password against a stored "salt.hash". */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const dot = stored.indexOf(".");
  if (dot < 0) return false;
  let salt: Uint8Array;
  let expected: Uint8Array;
  try {
    salt = b64urlToBytes(stored.slice(0, dot));
    expected = b64urlToBytes(stored.slice(dot + 1));
  } catch {
    return false;
  }
  const actual = await pbkdf2(password, salt);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

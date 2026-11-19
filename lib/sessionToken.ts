// Signed session token: "<personId>.<expiresAtSeconds>.<hmac>".
// No Next.js imports so it can be used from proxy.ts and server code alike.
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "xp_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 120; // 120 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (at least 32 characters)");
  return s;
}

function hmac(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function createToken(personId: string, nowSeconds: number): string {
  const body = `${personId}.${nowSeconds + SESSION_MAX_AGE_SECONDS}`;
  return `${body}.${hmac(body)}`;
}

/** Returns the personId if the token is authentic and unexpired. */
export function verifyToken(token: string | undefined, nowSeconds: number): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [personId, exp, sig] = parts;
  if (!safeEqual(sig, hmac(`${personId}.${exp}`))) return null;
  if (!/^\d+$/.test(exp) || Number(exp) < nowSeconds) return null;
  return personId;
}

/** Constant-time comparison of an entered PIN with FAMILY_PIN. */
export function pinMatches(entered: string): boolean {
  const pin = process.env.FAMILY_PIN;
  if (!pin) throw new Error("FAMILY_PIN must be set");
  return safeEqual(hmac(`pin:${entered}`), hmac(`pin:${pin}`));
}

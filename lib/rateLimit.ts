// Simple in-memory limiter for PIN attempts (single PM2 process, so memory is fine).
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

/** True while the key has fewer than MAX_ATTEMPTS failures in the current window. */
export function allowAttempt(key: string, now: number): boolean {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) return true;
  return entry.count < MAX_ATTEMPTS;
}

export function recordFailure(key: string, now: number) {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count++;
}

export function clearFailures(key: string) {
  attempts.delete(key);
}

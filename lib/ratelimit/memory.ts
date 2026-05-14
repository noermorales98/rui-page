/**
 * MVP in-memory rate limiter — sliding-window per key.
 *
 * Caveat: in serverless environments (Vercel functions, edge runtime) each
 * invocation may land on a separate instance, so the effective limit is
 * "per instance" not "global". For real abuse mitigation, swap this for
 * Upstash Ratelimit + Redis (see skills/rate-limit.md). For the MVP this
 * is good enough to slow down a single attacker hitting the same warm
 * instance.
 */

type Entry = { hits: number[] }

const buckets = new Map<string, Entry>()

export type RateLimitCheck = {
  ok: boolean
  limit: number
  remaining: number
  resetMs: number
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitCheck {
  const now = Date.now()
  const horizon = now - windowMs

  const entry = buckets.get(key) ?? { hits: [] }
  const recent = entry.hits.filter((t) => t > horizon)

  if (recent.length >= limit) {
    const oldest = recent[0] ?? now
    const resetMs = Math.max(0, oldest + windowMs - now)
    buckets.set(key, { hits: recent })
    return { ok: false, limit, remaining: 0, resetMs }
  }

  recent.push(now)
  buckets.set(key, { hits: recent })
  return { ok: true, limit, remaining: Math.max(0, limit - recent.length), resetMs: windowMs }
}

/**
 * Periodically drop stale keys so the Map doesn't grow forever. Lightweight
 * — called opportunistically from `checkRateLimit` callers can ignore it.
 */
export function pruneRateLimit(windowMs: number): void {
  const horizon = Date.now() - windowMs
  for (const [key, entry] of buckets) {
    const kept = entry.hits.filter((t) => t > horizon)
    if (kept.length === 0) buckets.delete(key)
    else buckets.set(key, { hits: kept })
  }
}

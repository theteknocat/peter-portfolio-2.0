/**
 * Clippy quip pools: fetch a scope's lines from the API and serve them with no
 * immediate repeats.
 *
 * Each scope's pool is fetched once per browser session and held in
 * sessionStorage. Alongside it we keep a shuffled "queue" of not-yet-shown
 * lines; nextQuip() pops one and reshuffles only when the queue runs dry, so a
 * line never repeats until the whole pool has been used. No further API calls
 * happen mid-session — the reshuffle is purely client-side.
 *
 * A failed or empty fetch is treated as "no pool" (returns null) and is not
 * cached, so the caller falls back to its own lines and a transient outage can
 * recover on the next navigation.
 */

const POOL_PREFIX = 'clippy-pool:'
const QUEUE_PREFIX = 'clippy-queue:'

/** Parse a JSON value from sessionStorage, or null if missing/corrupt. */
function readJson<T>(key: string): T | null {
  const raw = sessionStorage.getItem(key)
  if (raw === null) {
    return null
  }
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/** Fisher–Yates shuffle. Returns a new array; does not mutate the input. */
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Fetch a scope's quip pool, caching a non-empty result in sessionStorage.
 *
 * @param scope - The quip scope ('home', 'portfolio/some-slug', …).
 * @returns The pool, or an empty array on any failure (not cached).
 */
async function loadPool(scope: string): Promise<string[]> {
  const key = POOL_PREFIX + scope
  const cached = readJson<string[]>(key)
  if (cached !== null) {
    return cached
  }

  let quips: string[] = []
  try {
    const res = await fetch(`/api/clippy/quips/${scope}`)
    if (res.ok) {
      const data = (await res.json()) as { quips?: unknown }
      if (Array.isArray(data.quips)) {
        quips = data.quips.filter((q): q is string => typeof q === 'string')
      }
    }
  } catch {
    quips = []
  }

  // Only cache real pools — a transient failure should retry, not lock in [].
  if (quips.length > 0) {
    sessionStorage.setItem(key, JSON.stringify(quips))
  }
  return quips
}

/**
 * Quip queue management for the Clippy companion.
 *
 * @returns An object exposing nextQuip().
 */
export function useClippyQuips() {
  /**
   * Get the next quip for a scope, or null if its pool is empty.
   *
   * Never repeats a line until the scope's pool has been exhausted, at which
   * point the queue reshuffles.
   *
   * @param scope - The quip scope to draw from.
   * @returns A quip string, or null if no pool is available.
   */
  async function nextQuip(scope: string): Promise<string | null> {
    const pool = await loadPool(scope)
    if (pool.length === 0) {
      return null
    }

    const queueKey = QUEUE_PREFIX + scope
    let queue = readJson<string[]>(queueKey) ?? []
    if (queue.length === 0) {
      queue = shuffle(pool)
    }

    const quip = queue.shift() ?? null
    sessionStorage.setItem(queueKey, JSON.stringify(queue))
    return quip
  }

  return { nextQuip }
}

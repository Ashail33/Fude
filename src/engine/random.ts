export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function sample<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}

/** Pick `n` distractors from `pool` that are not equal to `answer` (by key). */
export function distractors<T>(pool: readonly T[], answer: T, n: number, key: (t: T) => string = String): T[] {
  const k = key(answer)
  const seen = new Set([k])
  const out: T[] = []
  for (const t of shuffle(pool)) {
    const tk = key(t)
    if (seen.has(tk)) continue
    seen.add(tk)
    out.push(t)
    if (out.length >= n) break
  }
  return out
}

/** Weighted pick without replacement: higher weight = more likely. */
export function weightedSample<T>(arr: readonly T[], n: number, weight: (t: T) => number): T[] {
  const pool = arr.map((t) => ({ t, w: Math.max(0.01, weight(t)) }))
  const out: T[] = []
  while (out.length < n && pool.length) {
    const total = pool.reduce((s, p) => s + p.w, 0)
    let r = Math.random() * total
    let idx = 0
    for (; idx < pool.length - 1; idx++) {
      r -= pool[idx].w
      if (r <= 0) break
    }
    out.push(pool[idx].t)
    pool.splice(idx, 1)
  }
  return out
}

/** Seeded PRNG (mulberry32) for deterministic daily content. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Test helpers (kept separate so the engine stays lean).
import { seeded } from './random'
import type { Pt } from './stroke'

export * from './stroke'

/** A deterministic random scribble inside the 109 box. */
export function seededScribble(seed: number, n = 12): Pt[] {
  const r = seeded(seed)
  return Array.from({ length: n }, () => ({ x: 10 + r() * 89, y: 10 + r() * 89 }))
}

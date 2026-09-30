/** Pure round generation for G3 – Spot the Difference (Kana Edition). */
import { CONFUSABLE_SETS, KANA_BY_CHAR } from '../data/kana'
import { item } from '../engine/items'
import { pick, shuffle } from '../engine/random'

export interface SpotRound {
  level: number
  /** Grid side length (3 at level 1, otherwise 4). */
  size: number
  base: string
  imposter: string
  /** Cell index of the imposter in the size×size grid. */
  at: number
  note: string
}

type ConfusableSet = (typeof CONFUSABLE_SETS)[number]

/** Kanji glosses for the look-alike sets (meaning · kana reading). */
const KANJI_GLOSS: Record<string, string> = {
  土: 'earth · つち',
  士: 'samurai · し',
  未: 'not yet · み',
  末: 'end · すえ',
  大: 'big · おお',
  犬: 'dog · いぬ',
  太: 'thick · ふと',
  日: 'sun · ひ',
  目: 'eye · め',
  白: 'white · しろ',
  人: 'person · ひと',
  入: 'enter · はいる',
}

export const isKana = (ch: string) => KANA_BY_CHAR.has(ch)

/** SRS item id for a character from a confusable set. */
export const spotItemId = (ch: string) => (isKana(ch) ? item.kana(ch) : item.kanji(ch))

/** Short learner-facing label: romaji + script for kana, meaning for kanji. */
export function glossOf(ch: string): string {
  const k = KANA_BY_CHAR.get(ch)
  if (k) return `${k.romaji} (${k.script})`
  return KANJI_GLOSS[ch] ?? 'kanji'
}

/** Level for round `i` of `rounds`, rising evenly from min to max. */
export function levelFor(i: number, rounds: number, minLevel: number, maxLevel: number): number {
  const lo = Math.min(minLevel, maxLevel)
  const hi = Math.max(minLevel, maxLevel)
  const span = hi - lo + 1
  return lo + Math.min(span - 1, Math.floor((i * span) / Math.max(1, rounds)))
}

function setsFor(level: number, sets: readonly ConfusableSet[]): ConfusableSet[] {
  const exact = sets.filter((s) => s.level === level)
  if (exact.length) return exact
  // Fall back to the nearest level that has sets.
  const levels = [...new Set(sets.map((s) => s.level))].sort((a, b) => Math.abs(a - level) - Math.abs(b - level) || a - b)
  return levels.length ? sets.filter((s) => s.level === levels[0]) : []
}

/** Build all rounds, progressing in level and avoiding back-to-back repeats. */
export function buildRounds(rounds: number, minLevel: number, maxLevel: number, sets: readonly ConfusableSet[] = CONFUSABLE_SETS): SpotRound[] {
  const out: SpotRound[] = []
  const used = new Map<ConfusableSet, number>()
  let last: ConfusableSet | null = null
  for (let i = 0; i < rounds; i++) {
    const level = levelFor(i, rounds, minLevel, maxLevel)
    const pool = setsFor(level, sets)
    if (!pool.length) break
    // Prefer the least-used sets, never the same set twice in a row when avoidable.
    const fresh = pool.filter((s) => s !== last || pool.length === 1)
    const minUse = Math.min(...fresh.map((s) => used.get(s) ?? 0))
    const set = pick(fresh.filter((s) => (used.get(s) ?? 0) === minUse))
    used.set(set, (used.get(set) ?? 0) + 1)
    last = set
    const [base, imposter] = shuffle(set.chars)
    const size = level <= 1 ? 3 : 4
    out.push({ level: set.level, size, base, imposter, at: Math.floor(Math.random() * size * size), note: set.note })
  }
  return out
}

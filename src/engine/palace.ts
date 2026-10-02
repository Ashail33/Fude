/**
 * Memory palace logic: which memories the player has placed (met), which
 * are fading (due for review), and recall questions for a place.
 *
 * A memory is placed the moment its item is first learned anywhere in the
 * game, so the palace fills up as you play. Grammar points are placed when
 * their region's lessons begin. A memory fades as its spaced-repetition
 * strength drops; fading places glow in the world to call you back.
 */
import { activitiesFor } from '../data/regions'
import { GRAMMAR_BY_ID } from '../data/grammar'
import { LOCI, type Locus, type Memory } from '../data/palace'
import { shuffle } from './random'
import { describeItem, type ItemInfo } from './items'
import { strength } from './srs'
import { isPassed, type PlayerState } from './store'

export { LOCI }
export type { Locus, Memory }

export const LOCUS_BY_ANCHOR = new Map(LOCI.map((l) => [`${l.map}:${l.anchor}`, l]))
export const LOCUS_BY_ITEM = new Map(LOCI.flatMap((l) => l.memories.map((m) => [m.item, l] as const)))
export const ROOMS = [1, 2, 3, 4, 5]

export function roomLoci(room: number): Locus[] {
  return LOCI.filter((l) => l.room === room)
}

/** Has the player met this item yet? */
export function placed(s: PlayerState, m: Memory): boolean {
  const card = s.srs[m.item]
  if (card && card.seen > 0) return true
  if (m.item.startsWith('g:')) {
    const g = GRAMMAR_BY_ID.get(m.item.slice(2))
    return !!g && activitiesFor(g.region).some((a) => isPassed(s, a.id))
  }
  return false
}

/** Placed, reviewed before, and slipping: worth a visit. */
export function fading(s: PlayerState, m: Memory, now = Date.now()): boolean {
  const card = s.srs[m.item]
  return placed(s, m) && !!card && card.seen > 0 && strength(card, now) < 0.5
}

export function placedIn(s: PlayerState, l: Locus): Memory[] {
  return l.memories.filter((m) => placed(s, m))
}

export function fadingIn(s: PlayerState, l: Locus, now = Date.now()): Memory[] {
  return l.memories.filter((m) => fading(s, m, now))
}

/** Places on a map whose memories are fading (they glow in the world). */
export function fadingAnchors(s: PlayerState, mapId: string): Set<string> {
  const now = Date.now()
  return new Set(LOCI.filter((l) => l.map === mapId && l.memories.some((m) => fading(s, m, now))).map((l) => l.anchor))
}

export function info(m: Memory): ItemInfo | undefined {
  return describeItem(m.item)
}

/** Hide the item's own writing (and reading) inside a cue, just in case. */
export function cueOf(m: Memory): string {
  const i = info(m)
  let s = m.story
  for (const t of [i?.front, i?.reading].filter((x): x is string => !!x && /[^\x00-\x7f]/.test(x))) s = s.split(t).join('？')
  return s
}

export interface RecallQ {
  memory: Memory
  answer: ItemInfo
  options: ItemInfo[]
}

/** A 4-option question: the item and three of the same kind from the palace. */
export function recallQuestion(s: PlayerState, m: Memory): RecallQ | null {
  const answer = info(m)
  if (!answer) return null
  const prefix = m.item.split(':')[0]
  const pool = LOCI.flatMap((l) => l.memories).filter((x) => x.item !== m.item && x.item.startsWith(`${prefix}:`))
  // prefer things the player has met: wrong options they might confuse
  const met = shuffle(pool.filter((x) => placed(s, x)))
  const rest = shuffle(pool.filter((x) => !placed(s, x)))
  const seen = new Set([answer.front])
  const options: ItemInfo[] = [answer]
  for (const x of [...met, ...rest]) {
    const d = info(x)
    if (!d || seen.has(d.front)) continue
    seen.add(d.front)
    options.push(d)
    if (options.length === 4) break
  }
  return { memory: m, answer, options: shuffle(options) }
}

/** What a route walk should cover: placed memories in route order (fading ones always included). */
export function walkMemories(s: PlayerState, room: number, max = 24): { locus: Locus; memories: Memory[] }[] {
  const now = Date.now()
  const stops = roomLoci(room)
    .map((locus) => ({ locus, memories: placedIn(s, locus) }))
    .filter((x) => x.memories.length)
  const total = stops.reduce((n, x) => n + x.memories.length, 0)
  if (total <= max) return stops
  // too many for one walk: keep fading ones, then the weakest, but never break the route order
  const keep = new Set<string>()
  for (const x of stops) for (const m of x.memories) if (fading(s, m, now)) keep.add(m.item)
  const rest = stops
    .flatMap((x) => x.memories)
    .filter((m) => !keep.has(m.item))
    .sort((a, b) => strength(s.srs[a.item], now) - strength(s.srs[b.item], now))
  for (const m of rest) {
    if (keep.size >= max) break
    keep.add(m.item)
  }
  return stops.map((x) => ({ locus: x.locus, memories: x.memories.filter((m) => keep.has(m.item)) })).filter((x) => x.memories.length)
}

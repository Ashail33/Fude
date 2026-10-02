/**
 * The road through the world: region ids in the order the player travels
 * them. A region's id is stable (saves, activity ids, story flags and
 * content files key on it); its place on the road is its position here, so
 * new regions slot in before the Tower without renumbering anything.
 * Compare regions with `regionRank` / `atOrBefore`, never `<` on ids.
 *
 * Kept free of heavy imports so word lists and other data can use it.
 */
import { PACK_DATA } from '../regions/data'

export const JOURNEY: readonly number[] = [1, 2, 3, 4, ...PACK_DATA.map((d) => d.region.id), 5]

const RANK = new Map(JOURNEY.map((id, i) => [id, i + 1]))

/** 1-based position on the road (0 for an unknown region). */
export function regionRank(id: number): number {
  return RANK.get(id) ?? 0
}

/** Is region `a` on the road at or before region `b`? */
export function atOrBefore(a: number, b: number): boolean {
  const ra = regionRank(a)
  return ra > 0 && ra <= regionRank(b)
}

/** The region before this one on the road (undefined for the first). */
export function prevRegion(id: number): number | undefined {
  const i = regionRank(id) - 2
  return i >= 0 ? JOURNEY[i] : undefined
}

/** The region after this one on the road (undefined for the last). */
export function nextRegion(id: number): number | undefined {
  const r = regionRank(id)
  return r > 0 ? JOURNEY[r] : undefined
}

/** The last region: the Tower, where the journey ends. */
export const FINAL_REGION = JOURNEY[JOURNEY.length - 1]

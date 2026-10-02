/**
 * The travel spell (たびの じゅもん). Cast たび (journey), とぶ (fly) or いく
 * (go) into the open and a map of the road unrolls; pick any region you
 * have opened and you are there in a flash. とぶ and いく are vocabulary
 * words, so casting them counts as using them.
 */
import { REGIONS, regionMap, type Region } from '../data/regions'
import { flagOf, regionUnlocked, type PlayerState } from '../engine/store'

/** Spell words → the vocabulary word they practise (null: just the spell). */
export const TRAVEL_WORDS: Record<string, string | null> = { たび: null, とぶ: 'tobu', いく: 'iku' }

export const isTravelWord = (kana: string) => kana in TRAVEL_WORDS

export const HINT_FLAG = 'hint.travel'

export interface TravelStop {
  region: Region
  map: string
  open: boolean
}

/** Every region on the road, in order, and whether the spell can take you there. */
export function travelStops(s: PlayerState): TravelStop[] {
  return REGIONS.map((r) => ({ region: r, map: regionMap(r.id), open: regionUnlocked(s, r.id) }))
}

/** The spell is worth teaching once there is somewhere else to go. */
export function travelReady(s: PlayerState): boolean {
  return travelStops(s).filter((t) => t.open).length >= 2
}

export const travelTaught = (s: PlayerState) => flagOf(s, HINT_FLAG) > 0

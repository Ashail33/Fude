/**
 * Kanji taught as items of their own (`j:<char>`), with readings and a
 * meaning, beyond the radicals and crafting recipes in ./kanji. Each comes
 * from a region pack (the Snowbound Temple teaches most of them); tracing
 * uses the KanjiVG strokes in ./strokes.json.
 */
import { PACK_DATA } from '../regions/data'

export interface KanjiEntry {
  char: string
  /** Region (id) where it is taught. */
  region: number
  meaning: string
  /** On'yomi (katakana) and kun'yomi (hiragana), most useful first. */
  on: string[]
  kun: string[]
  emoji: string
  /** Common words using it: [written, reading, meaning]. */
  words: [string, string, string][]
}

export const KANJI: KanjiEntry[] = PACK_DATA.flatMap((d) => (d.kanji ?? []).map((k) => ({ ...k, region: d.region.id })))
export const KANJI_BY_CHAR = new Map(KANJI.map((k) => [k.char, k]))

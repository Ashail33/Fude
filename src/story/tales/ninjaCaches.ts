/**
 * Secret caches for Stick Ninja, hidden in out-of-the-way corners of the
 * journey: dead ends behind the bamboo, the far end of the lake, a nook
 * under the cloud garden. Most hold an Ink Scroll (one more Ink Arts point);
 * two hold armour you can't buy. Most are word-locked: say the word for what
 * the carving shows.
 */
import type { CacheLoot } from '../../arcade/ninja/data'
import type { ChestSpec } from '../../world/types'
import type { ExtraEntity, TaleContent } from './types'

const NAME = { jp: 'ひみつの はこ', en: 'Secret Cache' }

const lock = (answer: string, jp: string, en: string): ChestSpec['lock'] => ({ answer, jp: `ふたに ${jp}の え。なまえを となえよ。`, en: `A carving of ${en} on the lid. Speak its name to open it.` })

interface Cache {
  map: string
  id: string
  x: number
  y: number
  loot: CacheLoot
  lock?: ChestSpec['lock']
}

const SCROLL: CacheLoot = { scroll: true }

export const CACHES: Cache[] = [
  { map: 'village-bamboo', id: 'nc-bamboo', x: 10, y: 18, loot: SCROLL, lock: lock('たけ', 'たけ', 'bamboo') },
  { map: 'village', id: 'nc-village', x: 35, y: 25, loot: SCROLL },
  { map: 'fields-hill', id: 'nc-hill', x: 29, y: 1, loot: SCROLL, lock: lock('かぜ', 'かぜ', 'the wind') },
  { map: 'forest', id: 'nc-forest', x: 7, y: 9, loot: SCROLL },
  { map: 'forest-lake', id: 'nc-lake', x: 28, y: 11, loot: SCROLL, lock: lock('みず', 'みず', 'water') },
  { map: 'shrine-torii', id: 'nc-torii', x: 14, y: 5, loot: { gear: 'monk-robe' }, lock: lock('つき', 'つき', 'the moon') },
  { map: 'harbour-cove', id: 'nc-cove', x: 0, y: 3, loot: SCROLL, lock: lock('うみ', 'うみ', 'the sea') },
  { map: 'onsen-trail', id: 'nc-trail', x: 2, y: 1, loot: SCROLL, lock: lock('やま', 'やま', 'a mountain') },
  { map: 'castletown-garden', id: 'nc-garden', x: 38, y: 7, loot: SCROLL, lock: lock('にわ', 'にわ', 'a garden') },
  { map: 'snowtemple-lake', id: 'nc-ice', x: 2, y: 25, loot: SCROLL, lock: lock('ゆき', 'ゆき', 'snow') },
  { map: 'clouds-garden', id: 'nc-sky', x: 2, y: 22, loot: { gear: 'tennin-robe' }, lock: lock('そら', 'そら', 'the sky') },
  { map: 'tower-garden', id: 'nc-tower', x: 3, y: 21, loot: SCROLL, lock: lock('ことば', 'ことば', 'words') },
]

const entities: Record<string, ExtraEntity[]> = {}
for (const c of CACHES) (entities[c.map] ??= []).push({ id: c.id, kind: 'chest', tile: 'chest', x: c.x, y: c.y, name: NAME, chest: { ninja: c.loot, xp: 10, lock: c.lock } })

export const NINJA_CACHES: TaleContent = { tales: [], items: [], talk: {}, cast: {}, entities }

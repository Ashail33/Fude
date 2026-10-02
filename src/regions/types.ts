/**
 * Region packs: everything a region adds to the game, kept in its own
 * folder (src/regions/rN/) so regions can be written side by side without
 * touching each other. The central registries (vocabulary, activities,
 * maps, story, palace, battles, art) merge the packs listed in
 * src/regions/index files.
 *
 * A pack is split by what it may import, so nothing forms an import cycle:
 *   data.ts        pure data (types only): the region, its words, grammar,
 *                  sentences, runes, kanji, NPCs and dialogue scenarios
 *   activities.ts  its stages (may import data/vocab, data/journey)
 *   maps.ts        its maps (types only)
 *   story.ts       main-road tales and folklore (TaleContent)
 *   scenes.ts      cutscenes, memory pages and speakers (types only)
 *   palace.ts      its memory-palace room (types only)
 *   battle.ts      its monsters' stats and encounter pool (types only)
 *   sprites.ts     pixel art for its new characters and monsters
 *   art.ts         illustrated (HD) assets, portrait mapping, motion, voices
 *   Boss.tsx       its boss fight
 */
import type { HdAsset } from '../art/hd/cast'
import type { CharDef } from '../art/sprites/characters'
import type { EnemyDef as SpriteDef } from '../art/sprites/enemies'
import type { Profile } from '../anim/deform'
import type { EnemyDef } from '../battle/logic'
import type { Locus } from '../data/palace/types'
import type { GrammarPoint } from '../data/grammar'
import type { KanjiEntry } from '../data/kanjiList'
import type { Npc, Scenario } from '../data/npcs'
import type { Region } from '../data/regions'
import type { ForgeSentence, Rune } from '../data/sentences'
import type { Word } from '../data/vocab'
import type { VoiceProfile } from '../engine/audio/voices'
import type { Activity } from '../games/types'
import type { Page } from '../story/chronicle'
import type { Scene, Speaker } from '../story/scenes'
import type { MapSpec } from '../world/types'
import type { PackSpeaker } from './ids'

/** A word row: id, written form, reading, meaning, part of speech, emoji, extras. */
export type WordRow = [id: string, jp: string, kana: string, en: string, pos: Word['pos'], emoji: string, extra?: Partial<Word>]

export interface RegionData {
  region: Region
  words: WordRow[]
  grammar: GrammarPoint[]
  sentences: ForgeSentence[]
  runes: Rune[]
  /** Kanji taught as their own items (`j:<char>`): tracing, reading, the palace. */
  kanji?: Omit<KanjiEntry, 'region'>[]
  npcs?: Npc[]
  scenarios?: Scenario[]
}

/** Cutscenes (kept apart from the tale scripts so the scene registry stays import-light). */
export interface RegionScenes {
  /** Arrival, pre/post boss and any other cutscenes (ids must be unique). */
  scenes: Scene[]
  /** Fude's memory pages earned in this region (their scenes are included above). */
  pages?: Omit<Page, 'n'>[]
  /** Speakers this pack declares in ./ids PACK_SPEAKERS. */
  speakers?: Partial<Record<PackSpeaker, Speaker>>
}

export interface RegionBattle {
  /** Random-encounter monsters for this region's maps. */
  pool: string[]
  /** Stats for monsters this region introduces. */
  enemies: Record<string, Omit<EnemyDef, 'id'>>
}

export interface RegionSprites {
  characters?: Record<string, CharDef>
  enemies?: Record<string, SpriteDef>
}

export interface RegionArt {
  assets: HdAsset[]
  /** Pixel sprite id → HD portrait id. */
  sprites?: Record<string, string>
  /** Boss game id / speaker key → HD art id. */
  bosses?: Record<string, string>
  /** Speaker key → HD portrait id (when the sprite's portrait isn't the right one). */
  speakers?: Record<string, string>
  /** Map entity id → HD portrait id (folklore spirits and the like). */
  entities?: Record<string, string>
  /** Motion profile for every new figure (portraits, monsters, spirits). */
  profiles?: Record<string, Profile>
  /** Voice for every new character sprite (or an alias to an existing voice). */
  voices?: Record<string, VoiceProfile | string>
}

export interface RegionMaps {
  maps: MapSpec[]
}

export type { Activity, Locus }

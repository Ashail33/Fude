/**
 * Story content types: key items, tales (story quests with stages) and the
 * scripts that make people and places in the world react — to being talked
 * to, and to words cast at them with word magic (ことだま).
 */
import type { SpriteId } from '../../art'
import type { PlayerState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import type { Entity, EntitySpec, Line } from '../../world/types'

export interface KeyItem {
  id: string
  name: string
  jp: string
  kana: string
  emoji: string
  desc: string
}

/**
 * A spirit from Japanese folklore. Helping one ends with it signing your
 * Spirit Scroll (百鬼の まきもの); the scroll shows locked entries as
 * silhouettes so there's always another legend to find.
 */
export interface Yokai {
  id: string
  region: number
  name: string
  jp: string
  kana: string
  emoji: string
  /** Short retelling of the real legend (2–3 sentences, English). */
  lore: string
  /** One-line hint shown while the entry is still locked. */
  hint: string
  /** Vocabulary ids the tale practises (shown on the scroll page). */
  words?: string[]
}

export interface TaleStage {
  /** Objective shown in the story log. */
  en: string
  jp: string
  /** Entity ids marked with the story "!" while this stage is active. */
  target?: string[]
  /** Map the objective is on (for the log's "where"). */
  map?: string
}

export interface Tale {
  id: string
  region: number
  title: string
  jp: string
  /** One-line hook for the story log. */
  summary: string
  /** Entity that offers the tale (marked with a story "!" until started). */
  giver?: string
  /** Only offered once this returns true. */
  available?: (s: PlayerState) => boolean
  stages: TaleStage[]
  /** Main story tales are listed first in the log. */
  main?: boolean
  /** Folklore tales: the spirit whose seal finishing it earns. */
  yokai?: string
}

/** What a script can do. Every helper returns dialog steps or mutates the save. */
export interface Ctx {
  s: () => PlayerState
  /** The entity talked to / cast at (null when casting into the open). */
  e: Entity | null
  speaker?: Line
  portrait?: SpriteId
  /** A line spoken by the entity (or by `who` with `pic`). */
  say(jp: string, en: string, who?: Line, pic?: SpriteId): Step
  /** Narration (no speaker, no voice). */
  narrate(jp: string, en: string): Step
  /** Fude chimes in. */
  fude(jp: string, en: string): Step
  /** Current stage of a tale: -1 not started, stages.length when finished. */
  stage(tale: string): number
  /** Start a tale: returns the "new tale" announcement. */
  start(tale: string): Step[]
  /** Move a tale to a stage (default: next); finishing it announces completion. */
  advance(tale: string, to?: number): Step[]
  flag(k: string): number
  set(k: string, v?: number): void
  has(item: string): boolean
  /** Give a key item (with its "obtained" line). */
  give(item: string): Step[]
  take(item: string): void
  /** Grant XP + shards (with a line). */
  reward(xp: number, shards?: number): Step[]
  /** Consumable (herbs etc.) into the bag. */
  bagItem(id: string, n?: number): Step[]
  /** Put a vocabulary word into the grimoire / count a correct recall. */
  learn(wordId: string): void
  /** A word-magic prompt; `on` gets the cast word as hiragana. */
  cast(prompt: Line, on: (kana: string) => Step[] | void): Step
  choice(prompt: Line, options: [id: string, jp: string, en: string][], on: (id: string) => Step[] | void): Step
  /** A kana answer prompt (riddles, passwords). */
  ask(prompt: Line, answer: string | string[], on: (ok: boolean) => Step[] | void): Step
  /** Visual + sound flourish on the entity (or player). */
  sparkle(kind?: 'spark' | 'leaf' | 'dust' | 'ripple'): void
  sfx(name: 'chest' | 'confirm' | 'correct' | 'wrong' | 'levelUp' | 'door'): void
  /** Play a cutscene after the dialog closes. */
  scene(id: string): void
  /** Open another screen (a game in the Games tab) when the dialog closes; you return to this spot. */
  play(route: string): void
  /** A spirit signs the Spirit Scroll (announcement + any memory it unlocks). */
  seal(yokai: string): Step[]
}

/** Talking to an entity: return steps, or null for its default behaviour. */
export type TalkScript = (c: Ctx) => Step[] | null
/** A word cast at an entity (or into the open): steps, or null for the generic fizzle. */
export type CastScript = (c: Ctx, kana: string) => Step[] | null

/** An entity added to a map by story content, placed by tile coordinates. */
export type ExtraEntity = Omit<EntitySpec, 'at'> & { x: number; y: number }

export interface TaleContent {
  tales: Tale[]
  items: KeyItem[]
  /** Folklore spirits introduced by this content. */
  yokai?: Yokai[]
  talk: Record<string, TalkScript>
  cast: Record<string, CastScript>
  /** Casting with nothing in front of you, per map. */
  mapCast?: Record<string, CastScript>
  entities?: Record<string, ExtraEntity[]>
  /** Entity visibility by story state (entity id → shown?). */
  visible?: Record<string, (s: PlayerState) => boolean>
  /** Entities drawn see-through (unlit lanterns, spirits) by story state. */
  ghost?: Record<string, (s: PlayerState) => boolean>
  /** Where a moved NPC stands, by story state (entity id → tile). */
  moved?: Record<string, (s: PlayerState) => { x: number; y: number } | null>
}

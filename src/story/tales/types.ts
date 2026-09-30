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

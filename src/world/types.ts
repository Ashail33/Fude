import type { CharacterSprite, Dir, EnemySprite } from '../art'
import type { TileId } from '../art/tiles'
import type { TrackId } from '../engine/music'

/** One map cell: ground tile, optional object on it, optional overhead tile drawn above sprites. */
export interface Cell {
  g: TileId
  o?: TileId
  v?: TileId
}

export type ParticleKind = 'sakura' | 'pollen' | 'fireflies' | 'dust' | 'sparkles' | 'none'

/** A bilingual spoken line. `jp` is what is spoken aloud. */
export interface Line {
  jp: string
  en: string
}

export interface ChestSpec {
  item?: string
  n?: number
  shards?: number
  xp?: number
  /** Word lock: type `answer` (kana) to open. */
  lock?: { answer: string; jp: string; en: string }
  /** Stick Ninja loot: gear, or an Ink Scroll (one more Ink Arts point). */
  ninja?: { gear: string } | { scroll: true }
}

export type EntityKind = 'npc' | 'activity' | 'chest' | 'landmark' | 'sign' | 'boss'

export interface EntitySpec {
  /** Marker char in the ASCII rows (used exactly once). */
  at: string
  id: string
  kind: EntityKind
  sprite?: CharacterSprite | EnemySprite
  /** Draw a tile instead of a sprite (well, anvil, tablet…). */
  tile?: TileId
  name?: Line
  dir?: Dir
  /** Wander radius in tiles (NPCs only). */
  wander?: number
  lines?: Line[]
  /** Activity ids offered here (in order). */
  activities?: string[]
  /** Landmark tied to a vocabulary word id (ghost mechanic). */
  word?: string
  chest?: ChestSpec
}

export interface ExitSpec {
  /** Marker char (may repeat for wide exits). */
  at: string
  /**
   * Target map id, or `@next` / `@prev` for the main map of the next or
   * previous region on the road (see data/journey). Road exits arrive at the
   * target's `west` point (from the region before) or `east` point (from the
   * region after), so regions can be added without touching their neighbours.
   */
  to: string
  /** Arrival point name in the target map. */
  point: string
  /** Tile drawn on the exit cells (door, stairs…); otherwise the ground is inferred. */
  tile?: TileId
}

export interface PointSpec {
  name: string
  /** Facing on arrival. */
  dir: Dir
}

export interface MapSpec {
  id: string
  name: string
  jp: string
  region: number
  music: TrackId
  interior?: boolean
  particles: ParticleKind
  /** Colour behind/around the map (interiors are usually black). */
  bg?: string
  /** Warm light tint drawn over the scene (rgba). */
  tint?: string
  rows: string[]
  /** Per-map legend overrides/additions. */
  legend?: Record<string, Cell>
  /** Marker char → arrival point. */
  points: Record<string, PointSpec>
  exits: ExitSpec[]
  entities: EntitySpec[]
  /** Arrival point used for fast travel / new game. */
  spawn: string
  /** Where the player wakes after losing a battle. */
  inn?: string
}

export interface Pt {
  x: number
  y: number
}

export interface Exit extends Pt {
  to: string
  point: string
}

export interface Entity extends Pt {
  spec: EntitySpec
  /** Home position (for bounded wandering). */
  hx: number
  hy: number
  dir: Dir
  /** Tween: previous tile + progress 0..1. */
  px: number
  py: number
  t: number
  /** Next time (ms) the NPC may wander. */
  nextMove: number
  /** Big (2×2) sprite: occupies (x..x+1, y-1..y). */
  big: boolean
}

export interface GameMap {
  spec: MapSpec
  id: string
  w: number
  h: number
  ground: TileId[]
  obj: (TileId | null)[]
  over: (TileId | null)[]
  exits: Map<number, Exit>
  points: Record<string, Pt & { dir: Dir }>
  entitySpecs: (EntitySpec & Pt)[]
}

export type { Dir }

/**
 * Names shared between the region packs and the core game, declared up
 * front so each pack only has to fill in its own folder. Kept free of
 * imports (sprite lists, speaker ids and track ids are used by types all
 * over the game).
 */

/** New regions, in the order they sit on the road (between the Shrine and the Tower). */
export const PACK_REGIONS = [6, 7, 8, 9, 10] as const

/** Walking characters added by the packs (pixel sprites in rN/sprites.ts). */
export const PACK_CHARACTER_SPRITES = [
  'fisher', // r6 harbour
  'sailor',
  'okami', // r7 hot springs
  'monkey',
  'samurai', // r8 castle town
  'lady',
  'monk', // r9 snow temple
  'snowchild',
  'tennin', // r10 cloud capital
  'scholar',
] as const

/** Monsters and bosses added by the packs (32×32 pixel sprites in rN/sprites.ts). */
export const PACK_ENEMY_SPRITES = [
  'crab', // r6
  'umibozu',
  'kamaitachi', // r7
  'yamanba',
  'karakuri', // r8
  'nurarihyon',
  'snow-wolf', // r9
  'yuki-onna',
  'raiju', // r10
  'raijin',
] as const

/** Cutscene speakers the packs define (names and sprites in rN/story.ts). */
export const PACK_SPEAKERS = [
  'kai', 'ume', 'sachi', 'umibozu', // r6
  'haru', 'jiro', 'saru', 'yamanba', // r7
  'tadashi', 'kiku', 'sen', 'nurarihyon', // r8
  'kuu', 'yuki', 'genta', 'yukionna', // r9
  'amane', 'hakase', 'raitaro', 'raijin', // r10
] as const
export type PackSpeaker = (typeof PACK_SPEAKERS)[number]

/** Boss fight game ids (components in rN/Boss.tsx). */
export const PACK_BOSSES = ['boss-umibozu', 'boss-yamanba', 'boss-nurarihyon', 'boss-yukionna', 'boss-raijin'] as const
export type PackBoss = (typeof PACK_BOSSES)[number]

/** Overworld music per new region. */
export const PACK_TRACKS = ['harbour', 'onsen', 'castletown', 'snowtemple', 'clouds'] as const
export type PackTrack = (typeof PACK_TRACKS)[number]

/** Cutscene backdrops per new region (one per region's main map). */
export const PACK_BACKDROPS = ['harbour', 'onsen', 'castletown', 'snowtemple', 'clouds'] as const
export type PackBackdrop = (typeof PACK_BACKDROPS)[number]

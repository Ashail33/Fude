/**
 * Illustrated (HD) art for battles: which backdrop/enemy art a fight uses,
 * and preloading it before the encounter starts.
 */
import type { EnemySprite } from '../art'
import { preloadHd, SPRITE_TO_HD } from '../art/hd'
import { regionMap } from '../data/regions'
import { clampRegion, REGION_POOLS } from './logic'

/** Battle backdrop id for a region (the dragon fights on the summit). */
export function battleBackdropId(region: number, summit = false): string {
  return summit ? 'battle-summit' : `battle-${regionMap(clampRegion(region))}`
}

/** Monsters that hover (bob instead of breathing; smaller, fainter shadow). */
export const FLOATING: ReadonlySet<string> = new Set<EnemySprite>(['bat', 'wisp', 'imp', 'harpy', 'dragon'])

export const enemyHdId = (sprite: string): string | undefined => SPRITE_TO_HD[sprite]

/** Warm the image cache for a region's battles (backdrop, its monster pool, the player portrait). */
export function preloadRegionHd(region: number) {
  const r = clampRegion(region)
  preloadHd([battleBackdropId(r), 'mage', ...REGION_POOLS[r].map((s) => SPRITE_TO_HD[s])])
}

/** Encounter pools and monster stats of every built region pack. */
import type { RegionBattle } from './types'
import { PACK_DATA } from './data'
import { BATTLE as R6 } from './r6/battle'
import { BATTLE as R7 } from './r7/battle'
import { BATTLE as R8 } from './r8/battle'
import { BATTLE as R9 } from './r9/battle'
import { BATTLE as R10 } from './r10/battle'

const ALL: [number, RegionBattle][] = [
  [6, R6],
  [7, R7],
  [8, R8],
  [9, R9],
  [10, R10],
]
const live = new Set(PACK_DATA.map((d) => d.region.id))
/** Region id → random-encounter pool (built packs only). */
export const PACK_POOLS: Record<number, string[]> = Object.fromEntries(ALL.filter(([id, b]) => live.has(id) && b.pool.length).map(([id, b]) => [id, b.pool]))
/** Every pack monster's stats (declared monsters must always have stats). */
export const PACK_ENEMY_STATS: RegionBattle['enemies'] = Object.assign({}, ...ALL.map(([, b]) => b.enemies))

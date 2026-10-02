/** Every region pack's pure data, for the regions that are built (see ./types). */
import type { RegionData } from './types'
import { DATA as R6 } from './r6/data'
import { DATA as R7 } from './r7/data'
import { DATA as R8 } from './r8/data'
import { DATA as R9 } from './r9/data'
import { DATA as R10 } from './r10/data'

/** Built packs, in road order. A pack whose DATA is null isn't in the game yet. */
export const PACK_DATA: RegionData[] = [R6, R7, R8, R9, R10].filter((d): d is RegionData => !!d)

/** Region ids of the built packs. */
export const LIVE_PACKS = new Set(PACK_DATA.map((d) => d.region.id))

/** Maps of every built region pack. */
import type { MapSpec } from '../world/types'
import { LIVE_PACKS } from './data'
import { MAPS as R6 } from './r6/maps'
import { MAPS as R7 } from './r7/maps'
import { MAPS as R8 } from './r8/maps'
import { MAPS as R9 } from './r9/maps'
import { MAPS as R10 } from './r10/maps'

export const PACK_MAPS: MapSpec[] = [...R6, ...R7, ...R8, ...R9, ...R10].filter((m) => LIVE_PACKS.has(m.region))

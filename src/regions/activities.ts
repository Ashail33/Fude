/** Stages of every built region pack. */
import type { Activity } from './types'
import { LIVE_PACKS } from './data'
import { ACTIVITIES as R6 } from './r6/activities'
import { ACTIVITIES as R7 } from './r7/activities'
import { ACTIVITIES as R8 } from './r8/activities'
import { ACTIVITIES as R9 } from './r9/activities'
import { ACTIVITIES as R10 } from './r10/activities'

export const PACK_ACTIVITIES: Activity[] = [...R6, ...R7, ...R8, ...R9, ...R10].filter((a) => LIVE_PACKS.has(a.region))

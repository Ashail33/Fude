/** Memory-palace rooms of every built region pack. */
import type { Locus } from './types'
import { LIVE_PACKS } from './data'
import { ROOM as R6 } from './r6/palace'
import { ROOM as R7 } from './r7/palace'
import { ROOM as R8 } from './r8/palace'
import { ROOM as R9 } from './r9/palace'
import { ROOM as R10 } from './r10/palace'

export const PACK_LOCI: Locus[] = [...R6, ...R7, ...R8, ...R9, ...R10].filter((l) => LIVE_PACKS.has(l.room))

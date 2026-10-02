/** Every room of the memory palace, in travel order (see ./types). */
import { ROOM_1 } from './r1'
import { ROOM_2 } from './r2'
import { ROOM_3 } from './r3'
import { ROOM_4 } from './r4'
import { ROOM_5 } from './r5'
import type { Locus } from './types'

export type { Locus, Memory } from './types'
export const LOCI: Locus[] = [...ROOM_1, ...ROOM_2, ...ROOM_3, ...ROOM_4, ...ROOM_5]

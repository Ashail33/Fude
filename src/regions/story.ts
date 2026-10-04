/** Tale content of every built region pack. */
import type { TaleContent } from '../story/tales/types'
import { LIVE_PACKS } from './data'
import { CONTENT as R6 } from './r6/story'
import { CONTENT as R7 } from './r7/story'
import { CONTENT as R8 } from './r8/story'
import { CONTENT as R9 } from './r9/story'
import { CONTENT as R10 } from './r10/story'
import { CONTENT as R11 } from './r11/story'
import { CONTENT as R12 } from './r12/story'

const ALL: [number, TaleContent[]][] = [
  [6, R6],
  [7, R7],
  [8, R8],
  [9, R9],
  [10, R10],
  [11, R11],
  [12, R12],
]
export const PACK_CONTENT: TaleContent[] = ALL.filter(([id]) => LIVE_PACKS.has(id)).flatMap(([, c]) => c)

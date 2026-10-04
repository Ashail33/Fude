/** Pixel sprites of the region packs (every declared id must have one). */
import type { CharDef } from '../art/sprites/characters'
import type { EnemyDef } from '../art/sprites/enemies'
import { SPRITES as R6 } from './r6/sprites'
import { SPRITES as R7 } from './r7/sprites'
import { SPRITES as R8 } from './r8/sprites'
import { SPRITES as R9 } from './r9/sprites'
import { SPRITES as R10 } from './r10/sprites'
import { SPRITES as R11 } from './r11/sprites'
import { SPRITES as R12 } from './r12/sprites'

const ALL = [R6, R7, R8, R9, R10, R11, R12]
export const PACK_CHARACTERS: Record<string, CharDef> = Object.assign({}, ...ALL.map((s) => s.characters ?? {}))
export const PACK_ENEMIES: Record<string, EnemyDef> = Object.assign({}, ...ALL.map((s) => s.enemies ?? {}))

/** Illustrated art, portrait mapping, motion and voices of the region packs. */
import type { RegionArt } from './types'
import { ART as R6 } from './r6/art'
import { ART as R7 } from './r7/art'
import { ART as R8 } from './r8/art'
import { ART as R9 } from './r9/art'
import { ART as R10 } from './r10/art'
import { ART as R11 } from './r11/art'
import { ART as R12 } from './r12/art'

const ALL: RegionArt[] = [R6, R7, R8, R9, R10, R11, R12]
const merge = <K extends keyof RegionArt>(k: K) => Object.assign({}, ...ALL.map((a) => a[k] ?? {})) as NonNullable<RegionArt[K]>

export const PACK_ASSETS = ALL.flatMap((a) => a.assets)
export const PACK_SPRITE_HD = merge('sprites')
export const PACK_BOSS_HD = merge('bosses')
export const PACK_SPEAKER_HD = merge('speakers')
export const PACK_ENTITY_HD = merge('entities')
export const PACK_PROFILES = merge('profiles')
export const PACK_VOICES = merge('voices')

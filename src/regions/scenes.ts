/** Cutscenes, memory pages and speakers of the region packs. */
import type { Speaker } from '../story/scenes'
import type { PackSpeaker } from './ids'
import { PACK_SPEAKERS } from './ids'
import { LIVE_PACKS } from './data'
import type { RegionScenes } from './types'
import { SCENES as R6 } from './r6/scenes'
import { SCENES as R7 } from './r7/scenes'
import { SCENES as R8 } from './r8/scenes'
import { SCENES as R9 } from './r9/scenes'
import { SCENES as R10 } from './r10/scenes'

const ALL: [number, RegionScenes][] = [
  [6, R6],
  [7, R7],
  [8, R8],
  [9, R9],
  [10, R10],
]
const live = ALL.filter(([id]) => LIVE_PACKS.has(id)).map(([, s]) => s)
export const PACK_SCENES = live.flatMap((s) => s.scenes)
export const PACK_PAGES = live.flatMap((s) => s.pages ?? [])

/** Every declared pack speaker (a quiet placeholder until its pack names it). */
const declared: Partial<Record<PackSpeaker, Speaker>> = Object.assign({}, ...ALL.map(([, s]) => s.speakers ?? {}))
export const PACK_SPEAKER_DEFS = Object.fromEntries(PACK_SPEAKERS.map((id) => [id, declared[id] ?? { sprite: 'fude', name: '???', jp: '？？？', color: '#9aa3c7' }])) as Record<PackSpeaker, Speaker>

/** Every region's story content, in travel order. */
import { VILLAGE_TALES } from './r1-village'
import { FIELDS_TALES } from './r2-fields'
import { FOREST_TALES } from './r3-forest'
import { SHRINE_TALES } from './r4-shrine'
import { TOWER_TALES } from './r5-tower'
import type { TaleContent } from './types'

export const CONTENT: TaleContent[] = [VILLAGE_TALES, FIELDS_TALES, FOREST_TALES, SHRINE_TALES, TOWER_TALES]

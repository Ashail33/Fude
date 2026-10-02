/** Every region's story content, in travel order. */
import { VILLAGE_TALES } from './r1-village'
import { FIELDS_TALES } from './r2-fields'
import { FOREST_TALES } from './r3-forest'
import { SHRINE_TALES } from './r4-shrine'
import { TOWER_TALES } from './r5-tower'
import { VILLAGE_FOLK } from './folk-r1'
import { FIELDS_FOLK } from './folk-r2'
import { FOREST_FOLK } from './folk-r3'
import { SHRINE_FOLK } from './folk-r4'
import { TOWER_FOLK } from './folk-r5'
import { EXTRA_AREAS } from './extra-areas'
import type { TaleContent } from './types'
import { PACK_CONTENT } from '../../regions/story'

export const CONTENT: TaleContent[] = [
  VILLAGE_TALES,
  VILLAGE_FOLK,
  FIELDS_TALES,
  FIELDS_FOLK,
  FOREST_TALES,
  FOREST_FOLK,
  SHRINE_TALES,
  SHRINE_FOLK,
  ...PACK_CONTENT,
  TOWER_TALES,
  TOWER_FOLK,
  EXTRA_AREAS,
]

import { parseMap } from '../mapdef'
import { CONTENT } from '../../story/tales/content'
import type { GameMap, MapSpec } from '../types'
import { FIELDS } from './fields'
import { FOREST } from './forest'
import { SHRINE, SHRINE_LIBRARY } from './shrine'
import { TOWER, TOWER_THRONE, TOWER_TOP } from './tower'
import { VILLAGE, VILLAGE_ELDER, VILLAGE_SCROLLS, VILLAGE_SHOP } from './village'

export const MAP_SPECS: MapSpec[] = [VILLAGE, VILLAGE_ELDER, VILLAGE_SHOP, VILLAGE_SCROLLS, FIELDS, FOREST, SHRINE, SHRINE_LIBRARY, TOWER, TOWER_THRONE, TOWER_TOP]

/** Exterior map per region, in travel order. */
export const REGION_MAPS = ['village', 'fields', 'forest', 'shrine', 'tower'] as const

const cache = new Map<string, GameMap>()

export function getMap(id: string): GameMap | undefined {
  let m = cache.get(id)
  if (!m) {
    const spec = MAP_SPECS.find((s) => s.id === id)
    if (!spec) return undefined
    m = parseMap(spec)
    // characters and objects added by story content
    for (const c of CONTENT) for (const x of c.entities?.[id] ?? []) m.entitySpecs.push({ ...x, at: '' })
    cache.set(id, m)
  }
  return m
}

/** Which map (and entity) hosts an activity. */
export function locateActivity(activityId: string): { map: GameMap; entityId: string } | undefined {
  for (const spec of MAP_SPECS) {
    const e = spec.entities.find((x) => x.activities?.includes(activityId))
    if (e) return { map: getMap(spec.id)!, entityId: e.id }
  }
  return undefined
}

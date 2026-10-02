import { nextRegion, prevRegion, regionMap, REGIONS } from '../../data/regions'
import { PACK_MAPS } from '../../regions/maps'
import { parseMap } from '../mapdef'
import { CONTENT } from '../../story/tales/content'
import type { GameMap, MapSpec } from '../types'
import { FIELDS } from './fields'
import { FIELDS_HILL, FIELDS_WELL } from './fields-extra'
import { FOREST } from './forest'
import { FOREST_HOLLOW, FOREST_LAKE } from './forest-extra'
import { SHRINE, SHRINE_LIBRARY } from './shrine'
import { SHRINE_GARDEN, SHRINE_TORII } from './shrine-extra'
import { TOWER, TOWER_THRONE, TOWER_TOP } from './tower'
import { TOWER_ARMOURY, TOWER_GARDEN, TOWER_LIBRARY } from './tower-extra'
import { VILLAGE, VILLAGE_ELDER, VILLAGE_SCROLLS, VILLAGE_SHOP } from './village'
import { VILLAGE_BAMBOO, VILLAGE_TERRACES } from './village-extra'

export const MAP_SPECS: MapSpec[] = [
  VILLAGE,
  VILLAGE_ELDER,
  VILLAGE_SHOP,
  VILLAGE_SCROLLS,
  VILLAGE_BAMBOO,
  VILLAGE_TERRACES,
  FIELDS,
  FIELDS_HILL,
  FIELDS_WELL,
  FOREST,
  FOREST_HOLLOW,
  FOREST_LAKE,
  SHRINE,
  SHRINE_LIBRARY,
  SHRINE_TORII,
  SHRINE_GARDEN,
  TOWER,
  TOWER_THRONE,
  TOWER_LIBRARY,
  TOWER_TOP,
  TOWER_GARDEN,
  TOWER_ARMOURY,
  ...PACK_MAPS,
]

/** Main outdoor map per region, in journey order. */
export const REGION_MAPS: string[] = REGIONS.map((r) => r.map)

const cache = new Map<string, GameMap>()

export function getMap(id: string): GameMap | undefined {
  let m = cache.get(id)
  if (!m) {
    const spec = MAP_SPECS.find((s) => s.id === id)
    if (!spec) return undefined
    m = parseMap(spec)
    // road exits: to the main map of the neighbouring region on the journey
    for (const [i, ex] of m.exits) {
      if (ex.to !== '@next' && ex.to !== '@prev') continue
      const r = ex.to === '@next' ? nextRegion(spec.region) : prevRegion(spec.region)
      if (r === undefined) m.exits.delete(i)
      else m.exits.set(i, { ...ex, to: regionMap(r), point: ex.to === '@next' ? 'west' : 'east' })
    }
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

import { nextRegion, prevRegion, regionMap, REGIONS } from '../../data/regions'
import { PACK_MAPS } from '../../regions/maps'
import { parseMap } from '../mapdef'
import { CONTENT } from '../../story/tales/content'
import type { GameMap, MapSpec } from '../types'
import { FIELDS } from './fields'
import { FOREST } from './forest'
import { SHRINE, SHRINE_LIBRARY } from './shrine'
import { TOWER, TOWER_THRONE, TOWER_TOP } from './tower'
import { VILLAGE, VILLAGE_ELDER, VILLAGE_SCROLLS, VILLAGE_SHOP } from './village'

export const MAP_SPECS: MapSpec[] = [VILLAGE, VILLAGE_ELDER, VILLAGE_SHOP, VILLAGE_SCROLLS, FIELDS, FOREST, SHRINE, SHRINE_LIBRARY, TOWER, TOWER_THRONE, TOWER_TOP, ...PACK_MAPS]

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

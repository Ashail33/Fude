import type { TileId } from '../art/tiles'
import type { Cell, Exit, GameMap, MapSpec, Pt } from './types'

/**
 * Shared ASCII legend. Maps may override or add chars. Characters not in the
 * legend must be markers (points, exits or entities) declared by the map.
 */
export const LEGEND: Record<string, Cell> = {
  '.': { g: 'grass' },
  ',': { g: 'grass-dark' },
  '"': { g: 'flowers' },
  ';': { g: 'tall-grass' },
  '=': { g: 'path' },
  ':': { g: 'sand' },
  _: { g: 'dirt' },
  n: { g: 'stone-floor' },
  w: { g: 'wood-floor' },
  t: { g: 'tatami' },
  '*': { g: 'snow' },
  '~': { g: 'water' },
  W: { g: 'water-deep' },
  o: { g: 'water', o: 'lily' },
  s: { g: 'water', o: 'stepping-stone' },
  '-': { g: 'water', o: 'bridge-h' },
  '|': { g: 'water-deep', o: 'bridge-v' },
  T: { g: 'grass', o: 'tree' },
  P: { g: 'grass', o: 'pine' },
  K: { g: 'grass', o: 'sakura' },
  B: { g: 'grass', o: 'bamboo' },
  b: { g: 'grass', o: 'bush' },
  r: { g: 'grass', o: 'rock' },
  R: { g: 'grass', o: 'boulder' },
  u: { g: 'grass', o: 'stump' },
  C: { g: 'grass', o: 'cliff' },
  c: { g: 'cliff-top' },
  '^': { g: 'grass', o: 'roof' },
  A: { g: 'grass', o: 'roof-edge' },
  '#': { g: 'grass', o: 'wall' },
  H: { g: 'grass', o: 'wall-window' },
  a: { g: 'grass', o: 'shop-awning' },
  f: { g: 'grass', o: 'fence' },
  Z: { g: 'grass', o: 'stone-wall' },
  X: { g: 'stone-floor', o: 'castle-wall' },
  Y: { g: 'stone-floor', o: 'tower-wall' },
  L: { g: 'grass', o: 'lantern' },
  x: { g: 'dirt', o: 'crate' },
  e: { g: 'dirt', o: 'barrel' },
  p: { g: 'grass', o: 'pot' },
  '%': { g: 'path', o: 'stall' },
  G: { g: 'path', o: 'gate-closed' },
  g: { g: 'path', o: 'gate-open' },
  I: { g: 'path', v: 'torii' },
  S: { g: 'grass', o: 'statue' },
  k: { g: 'wood-floor', o: 'bookshelf' },
  M: { g: 'wood-floor', o: 'carpet' },
  '&': { g: 'dirt', o: 'campfire' },
  V: { g: 'grass', o: 'cave' },
  '<': { g: 'stone-floor', o: 'stairs-up' },
  '>': { g: 'stone-floor', o: 'stairs-down' },
  '@': { g: 'stone-floor', o: 'portal' },
  O: { g: 'grass', o: 'warp-circle' },
  F: { g: 'grass-dark', v: 'tree' },
  D: { g: 'grass', o: 'door' },
  N: { g: 'stone-floor', o: 'lantern' },
  Q: { g: 'stone-floor', o: 'altar' },
  J: { g: 'stone-floor', o: 'throne' },
}

/** Ground tiles you cannot stand on (unless an object like a bridge makes them walkable). */
export const SOLID_GROUND = new Set<TileId>(['water', 'water-deep', 'cliff'])

/** Objects you can walk over. Everything else placed as an object blocks. */
export const WALKABLE_OBJECTS = new Set<TileId>([
  'bridge-h',
  'bridge-v',
  'stepping-stone',
  'carpet',
  'stairs-up',
  'stairs-down',
  'gate-open',
  'portal',
  'warp-circle',
  'flowers',
  'tall-grass',
])

/** Tiles whose look changes over time (redrawn each frame when visible). */
export const ANIMATED = new Set<TileId>(['water', 'water-deep', 'lily', 'flowers', 'lantern', 'portal', 'warp-circle', 'campfire', 'tall-grass'])

export function idx(m: { w: number }, x: number, y: number) {
  return y * m.w + x
}

/** Parse an ASCII map spec into tile layers, exits, points and entity positions. */
export function parseMap(spec: MapSpec): GameMap {
  const legend = { ...LEGEND, ...spec.legend }
  const h = spec.rows.length
  const w = Math.max(...spec.rows.map((r) => [...r].length))
  const ground: TileId[] = new Array(w * h).fill('grass')
  const obj: (TileId | null)[] = new Array(w * h).fill(null)
  const over: (TileId | null)[] = new Array(w * h).fill(null)
  const exits = new Map<number, Exit>()
  const points: GameMap['points'] = {}
  const entitySpecs: GameMap['entitySpecs'] = []
  const exitByChar = new Map(spec.exits.map((e) => [e.at, e]))
  const entByChar = new Map(spec.entities.map((e) => [e.at, e]))
  const markers: Pt[] = []

  const grid = spec.rows.map((r) => [...r])
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const ch = grid[y][x] ?? ' '
      const cell = legend[ch]
      const i = y * w + x
      if (cell) {
        ground[i] = cell.g
        obj[i] = cell.o ?? null
        over[i] = cell.v ?? null
        continue
      }
      markers.push({ x, y })
      const pt = spec.points[ch]
      const ex = exitByChar.get(ch)
      const en = entByChar.get(ch)
      if (pt) points[pt.name] = { x, y, dir: pt.dir }
      if (ex) {
        exits.set(i, { x, y, to: ex.to, point: ex.point })
        if (ex.tile) obj[i] = ex.tile
      }
      if (en) entitySpecs.push({ ...en, x, y })
    }

  // Markers take the most common bare ground (no object) among their neighbours, nearest ring first.
  const isMarker = (x: number, y: number) => !legend[grid[y]?.[x] ?? ' ']
  for (const { x, y } of markers) {
    let g: TileId | undefined
    let fallback: TileId | undefined
    // Markers set into a carpet keep the carpet.
    const carpets = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ].filter(([dx, dy]) => x + dx >= 0 && x + dx < w && obj[(y + dy) * w + x + dx] === 'carpet').length
    if (carpets >= 2 && !obj[y * w + x]) obj[y * w + x] = 'carpet'
    for (let r = 1; r < 6 && !g; r++) {
      const count = new Map<TileId, number>()
      for (const [dx, dy] of [
        [-r, 0],
        [r, 0],
        [0, -r],
        [0, r],
      ]) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || isMarker(nx, ny)) continue
        const c = legend[grid[ny][nx]]
        if (SOLID_GROUND.has(c.g)) continue
        if (c.o) fallback ??= c.g
        else count.set(c.g, (count.get(c.g) ?? 0) + 1)
      }
      let best = 0
      for (const [t, n] of count)
        if (n > best) {
          best = n
          g = t
        }
    }
    ground[y * w + x] = g ?? fallback ?? 'grass'
  }

  return { spec, id: spec.id, w, h, ground, obj, over, exits, points, entitySpecs }
}

/** Static walkability of a tile (ignores entities). Out-of-bounds is solid. */
export function tileSolid(m: GameMap, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true
  const i = y * m.w + x
  if (m.exits.has(i)) return false
  const o = m.obj[i]
  if (o) return !WALKABLE_OBJECTS.has(o)
  return SOLID_GROUND.has(m.ground[i])
}

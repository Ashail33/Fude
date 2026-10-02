/**
 * Overworld tiles. 16×16 original pixel tiles rendered by tilegen.ts and
 * cached per (id, positional variant, animation frame, neighbours).
 *
 * Multi-tile structures (houses, shrines, towers) are composed by the map
 * from these pieces. Edge-aware tiles (water shorelines, paths, roofs,
 * walls, fences, torii, carpets, cliffs) look at `neighbours`; compute it
 * with `computeNeighbours()` so tile *families* blend (e.g. water, lily
 * pads and bridges all count as water).
 *
 * Pass `{ tx, ty }` (the tile's map coordinates) as the last argument so
 * grass/flower fields vary by position and water ripples line up across
 * tiles. Props (trees, lanterns…) draw their own ground; override it with
 * `{ under: 'stone-floor' }` etc.
 */
import { imgToCanvas } from './canvas'
import { hash2 } from './raster'
import { E, N, NE, NW, S, SE, SW, W, frameCount, normaliseNb, renderTile, specOf, tileFamily } from './tilegen'

export const TILE_IDS = [
  // ground
  'grass', 'grass-dark', 'flowers', 'tall-grass', 'path', 'sand', 'dirt', 'stone-floor', 'wood-floor', 'tatami', 'snow',
  // water (animated; shoreline from neighbours)
  'water', 'water-deep', 'lily',
  // crossings
  'bridge-h', 'bridge-v', 'stepping-stone',
  // nature (solid)
  'tree', 'pine', 'sakura', 'bamboo', 'bush', 'rock', 'boulder', 'stump', 'cliff', 'cliff-top',
  // buildings
  'wall', 'wall-window', 'door', 'roof', 'roof-edge', 'shop-awning', 'fence', 'stone-wall', 'castle-wall', 'tower-wall',
  // props (solid unless noted)
  'sign', 'lantern', 'well', 'torii', 'shrine-bell', 'statue', 'stall', 'barrel', 'crate', 'pot', 'chest', 'chest-open',
  'cave', 'stairs-up', 'stairs-down', 'gate-closed', 'gate-open', 'portal', 'warp-circle', 'anvil', 'tablet', 'bookshelf', 'altar', 'throne', 'carpet', 'campfire',
  // additions (v2 art): vermilion roofs for shrines/shops, a noren shop doorway
  'roof-red', 'roof-red-edge', 'noren',
  // additions (v3): hot springs, ice, the sky city, harbour and snow props
  'onsen', 'ice', 'sky', 'cloud', 'snow-pine', 'boat', 'net', 'chochin', 'snowman',
] as const

export type TileId = (typeof TILE_IDS)[number]

/** Which of the 8 neighbours share the same tile id (for edge-aware drawing). Bits: N NE E SE S SW W NW. */
export type Neighbours = number

export const NB = { N, NE, E, SE, S, SW, W, NW } as const

export interface TileExtra {
  /** Tile map coordinates, for positional variation (recommended). */
  tx?: number
  ty?: number
  /** Ground drawn under a prop tile (default depends on the prop). */
  under?: TileId
}

/**
 * Neighbour bitmask for the tile at (x, y) given a lookup. Uses tile
 * families (all water-ish tiles match each other; walls/doors match;
 * roof + roof-edge match…). Out-of-bounds counts as "same" so edges of the
 * map don't sprout shorelines.
 */
export function computeNeighbours(get: (x: number, y: number) => TileId | undefined | null, x: number, y: number): Neighbours {
  const me = get(x, y)
  if (!me) return 0
  const fam = tileFamily(me)
  const same = (dx: number, dy: number) => {
    const t = get(x + dx, y + dy)
    return t == null ? true : tileFamily(t) === fam
  }
  let m = 0
  if (same(0, -1)) m |= N
  if (same(1, -1)) m |= NE
  if (same(1, 0)) m |= E
  if (same(1, 1)) m |= SE
  if (same(0, 1)) m |= S
  if (same(-1, 1)) m |= SW
  if (same(-1, 0)) m |= W
  if (same(-1, -1)) m |= NW
  return m
}

const cache = new Map<string, HTMLCanvasElement>()

/** Positional variant for a tile (stable per map cell). */
export function tileVariant(id: TileId, tx?: number, ty?: number): number {
  const n = specOf(id).variants ?? 1
  if (n <= 1 || tx === undefined || ty === undefined) return 0
  if (n === 9) return (((tx % 3) + 3) % 3) * 3 + (((ty % 3) + 3) % 3) // water: world-aligned ripples
  return hash2(tx, ty, 91) % n
}

/** Animation frame for a tile at a time (with per-cell phase where set). */
export function tileFrame(id: TileId, time: number, tx = 0, ty = 0): number {
  const sp = specOf(id)
  const n = sp.frames ?? 1
  if (n <= 1) return 0
  const phase = sp.phase ? hash2(tx, ty, 5) % n : 0
  return (Math.floor(time / (sp.period ?? 250)) + phase) % n
}

/** Cached native 16×16 canvas for one tile state. */
export function tileCanvas(id: TileId, variant: number, frame: number, neighbours: Neighbours, under?: TileId): HTMLCanvasElement {
  const nb = normaliseNb(id, neighbours)
  const key = `${id}|${variant}|${frame}|${nb}|${under ?? ''}`
  let c = cache.get(key)
  if (!c) {
    c = imgToCanvas(renderTile(id, { variant, frame, nb, under }))
    cache.set(key, c)
  }
  return c
}

/**
 * Draw one tile at canvas pixel (x, y) scaled by `scale`. `time` (ms) drives
 * animation (water shimmer, flowers sway, lanterns flicker, portal swirl).
 */
export function drawTile(ctx: CanvasRenderingContext2D, id: TileId, x: number, y: number, scale: number, time = 0, neighbours: Neighbours = 0xff, extra: TileExtra = {}) {
  const { tx, ty, under } = extra
  const c = tileCanvas(id, tileVariant(id, tx, ty), tileFrame(id, time, tx, ty), neighbours, under)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(c, Math.round(x), Math.round(y), 16 * scale, 16 * scale)
}

export { frameCount }

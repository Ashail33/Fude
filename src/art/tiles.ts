/**
 * Overworld tiles (CONTRACT). 16×16 original pixel tiles.
 * STUB: flat colours. The art implementation replaces the internals but
 * must keep TILE_IDS (it may ADD ids) and drawTile's signature.
 *
 * Multi-tile structures (houses, shrines, towers) are composed by the map
 * from these pieces; tiles marked "edge-aware" should look right when the
 * same tile repeats in a row (e.g. roof, wall, water shoreline is drawn by
 * the renderer from neighbours via `drawTile(..., neighbours)`).
 */
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
] as const

export type TileId = (typeof TILE_IDS)[number]

/** Which of the 8 neighbours share the same tile id (for edge-aware drawing). Bits: N NE E SE S SW W NW. */
export type Neighbours = number

const COLORS: Partial<Record<TileId, string>> = { grass: '#5aa84a', water: '#3a78c8', path: '#c9a86a', tree: '#2f6b35', wall: '#d8c8a8', roof: '#b0443a' }

/**
 * Draw one tile at canvas pixel (x, y) scaled by `scale`. `time` (ms) drives
 * animation (water shimmer, flowers sway, lanterns flicker, portal swirl).
 */
export function drawTile(ctx: CanvasRenderingContext2D, id: TileId, x: number, y: number, scale: number, time = 0, neighbours: Neighbours = 0xff) {
  void time
  void neighbours
  ctx.fillStyle = COLORS[id] ?? '#777'
  ctx.fillRect(Math.round(x), Math.round(y), 16 * scale, 16 * scale)
}

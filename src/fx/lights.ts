/**
 * Point lights for the HD-2D pass: which tiles emit light, where, how they
 * flicker, and which of them make the per-frame cut. Pure (no DOM/GL).
 */
import type { TileId } from '../art/tiles'
import type { RGB } from './grades'

export interface Light {
  /** World position in native pixels (16px tiles). */
  x: number
  y: number
  /** Radius in native pixels. */
  r: number
  color: RGB
  intensity: number
  /** 0 = steady … 1 = wild flame. */
  flicker: number
  seed: number
}

export interface LightDef {
  /** Offset of the light's centre inside the 16×16 tile. */
  dx: number
  dy: number
  r: number
  color: RGB
  intensity: number
  flicker: number
  /** Only lit when the grade is a night grade. */
  nightOnly?: boolean
}

const FLAME: RGB = [1.0, 0.62, 0.3]

export const TILE_LIGHTS: Partial<Record<TileId, LightDef>> = {
  lantern: { dx: 8, dy: 6, r: 58, color: FLAME, intensity: 1.0, flicker: 0.16 },
  campfire: { dx: 8, dy: 9, r: 88, color: [1.0, 0.52, 0.22], intensity: 1.0, flicker: 0.35 },
  portal: { dx: 8, dy: 8, r: 64, color: [0.7, 0.5, 1.0], intensity: 1.15, flicker: 0.12 },
  'warp-circle': { dx: 8, dy: 9, r: 54, color: [0.55, 0.85, 1.0], intensity: 0.55, flicker: 0.1 },
  'shrine-bell': { dx: 8, dy: 5, r: 40, color: [1.0, 0.86, 0.52], intensity: 0.6, flicker: 0.05 },
  altar: { dx: 8, dy: 4, r: 46, color: FLAME, intensity: 0.8, flicker: 0.22 },
  torii: { dx: 8, dy: 4, r: 30, color: [1.0, 0.4, 0.24], intensity: 0.4, flicker: 0.06, nightOnly: true },
  'wall-window': { dx: 8, dy: 9, r: 30, color: [1.0, 0.76, 0.42], intensity: 0.6, flicker: 0.08, nightOnly: true },
  noren: { dx: 8, dy: 10, r: 28, color: [1.0, 0.72, 0.4], intensity: 0.45, flicker: 0.05, nightOnly: true },
}

/** Build a light for tile `id` at tile (tx, ty), or null. */
export function tileLight(id: TileId | null | undefined, tx: number, ty: number, night: boolean): Light | null {
  if (!id) return null
  const d = TILE_LIGHTS[id]
  if (!d || (d.nightOnly && !night)) return null
  return { x: tx * 16 + d.dx, y: ty * 16 + d.dy, r: d.r, color: d.color, intensity: d.intensity, flicker: d.flicker, seed: (tx * 7.31 + ty * 3.17) % 6.283 }
}

export interface LightMap {
  w: number
  h: number
  ground: readonly (TileId | null)[]
  obj: readonly (TileId | null)[]
  over: readonly (TileId | null)[]
}

/** All static tile lights of a map (computed once per map). */
export function mapLights(m: LightMap, night: boolean): Light[] {
  const out: Light[] = []
  for (let y = 0; y < m.h; y++)
    for (let x = 0; x < m.w; x++) {
      const i = y * m.w + x
      for (const id of [m.ground[i], m.obj[i], m.over[i]]) {
        const l = tileLight(id, x, y, night)
        if (l) out.push(l)
      }
    }
  return out
}

/** Flicker multiplier in [1 - flicker, 1] at time `t` (seconds). */
export function flickerAt(l: Pick<Light, 'flicker' | 'seed'>, t: number): number {
  if (l.flicker <= 0) return 1
  const n = 0.5 * Math.sin(t * 9.1 + l.seed * 3) + 0.3 * Math.sin(t * 23.7 + l.seed * 7) + 0.2 * Math.sin(t * 3.3 + l.seed)
  return 1 - l.flicker * (0.5 + 0.5 * n)
}

export interface PackedLights {
  /** x, y (screen native px, y down), radius, unused — per light. */
  pos: Float32Array
  /** r, g, b premultiplied by intensity × flicker × scale, unused. */
  col: Float32Array
  n: number
}

export const MAX_LIGHTS = 24

/**
 * Cull to the view (with radius margin), keep the `max` most important
 * (brightness × size, nearest to the screen centre first) and pack for the shader.
 */
export function packLights(lights: readonly Light[], cam: { x: number; y: number }, vw: number, vh: number, t: number, scale = 1, max = MAX_LIGHTS): PackedLights {
  const cx = vw / 2
  const cy = vh / 2
  const vis: { l: Light; sx: number; sy: number; score: number }[] = []
  for (const l of lights) {
    const sx = l.x - cam.x
    const sy = l.y - cam.y
    if (sx < -l.r || sy < -l.r || sx > vw + l.r || sy > vh + l.r) continue
    const k = l.intensity * scale
    if (k <= 0.004) continue
    const dist = Math.hypot(sx - cx, sy - cy)
    vis.push({ l, sx, sy, score: (k * l.r) / (40 + dist) })
  }
  vis.sort((a, b) => b.score - a.score)
  const n = Math.min(max, vis.length)
  const pos = new Float32Array(max * 4)
  const col = new Float32Array(max * 4)
  for (let i = 0; i < n; i++) {
    const { l, sx, sy } = vis[i]
    const k = l.intensity * scale * flickerAt(l, t)
    pos[i * 4] = sx
    pos[i * 4 + 1] = sy
    pos[i * 4 + 2] = l.r * (0.97 + 0.03 * flickerAt(l, t + 0.13))
    col[i * 4] = l.color[0] * k
    col[i * 4 + 1] = l.color[1] * k
    col[i * 4 + 2] = l.color[2] * k
  }
  return { pos, col, n }
}

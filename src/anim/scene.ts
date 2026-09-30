/**
 * Full-bleed backdrops / key art: instead of deforming a figure, the mesh
 * stays fixed on screen and its texture coordinates move — a slow Ken Burns
 * drift, depth parallax (lower = nearer = moves more) and a very subtle
 * wind / heat-haze in chosen regions (foliage, grass, mist).
 */
import { maskWeight, smooth01, type Profile } from './deform'

export interface SceneMotion {
  /** Zoom range of the Ken Burns move (≥ 1.03 keeps edges hidden). */
  zoom: readonly [number, number]
  /** Seconds for one full there-and-back cycle. */
  period: number
  /** Drift across the cycle (fraction of the visible area). */
  drift: readonly [number, number]
  /** object-position style focus (0..1). */
  focus: readonly [number, number]
  /** Max texture shift for the nearest layer from pointer parallax (fraction of the visible area). */
  parallax: number
  /** Wind / haze inside `regions` (named regions of the profile). */
  wind?: { regions: string | readonly string[]; amp: number; speed: number; freq: number }
  /** Regions for the wind mask. */
  regions: Profile['regions']
}

export interface Rect {
  u0: number
  v0: number
  uw: number
  vh: number
}

/** The visible texture rect for object-fit: cover with the given focus. */
export function coverRect(boxAspect: number, imgAspect: number, fx = 0.5, fy = 0.5): Rect {
  if (imgAspect > boxAspect) {
    const uw = boxAspect / imgAspect
    return { u0: (1 - uw) * fx, v0: 0, uw, vh: 1 }
  }
  const vh = imgAspect / boxAspect
  return { u0: 0, v0: (1 - vh) * fy, uw: 1, vh }
}

/** Ease-in-out 0→1→0 over a period. */
export const kbPhase = (t: number, period: number) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / period)

/**
 * Texture coordinate for screen point (sx, sy) ∈ [0,1]² at time t, with the
 * pointer at (px, py) ∈ [−1,1]² (already smoothed).
 */
export function sceneUv(sx: number, sy: number, t: number, m: SceneMotion, cover: Rect, px = 0, py = 0, amp = 1): [number, number] {
  const e = kbPhase(t, m.period) * amp
  const z = m.zoom[0] + (m.zoom[1] - m.zoom[0]) * e
  const uw = cover.uw / z
  const vh = cover.vh / z
  // Keep the zoom centred on the focus, shifted by the drift.
  const margU = cover.uw - uw
  const margV = cover.vh - vh
  const cu = Math.min(1, Math.max(0, m.focus[0] + m.drift[0] * (e - 0.5)))
  const cv = Math.min(1, Math.max(0, m.focus[1] + m.drift[1] * (e - 0.5)))
  let u = cover.u0 + margU * cu + sx * uw
  let v = cover.v0 + margV * cv + sy * vh
  // Depth parallax: the ground (bottom) is nearer than the sky.
  const depth = 0.25 + 0.75 * smooth01((sy - 0.3) / 0.7)
  const room = Math.min(margU, margV) * 0.45
  const par = Math.min(m.parallax, room)
  u -= px * par * depth
  v -= py * par * depth * 0.5
  if (m.wind && amp > 0) {
    const w = maskWeight({ regions: m.regions }, m.wind.regions, u, v)
    if (w > 0.001) {
      const T = t * m.wind.speed
      const f = m.wind.freq
      const s1 = Math.sin(2 * Math.PI * (f * (u * 0.8 + v * 0.4) - T))
      const s2 = Math.sin(2 * Math.PI * (f * 2.3 * (u - 0.3 * v) - T * 1.6) + 1.3)
      u += m.wind.amp * w * amp * (0.7 * s1 + 0.3 * s2) * uw
      v += m.wind.amp * 0.35 * w * amp * s2 * vh
    }
  }
  return [Math.min(1, Math.max(0, u)), Math.min(1, Math.max(0, v))]
}

/** Default scene motion (tuned per asset in profiles.ts). */
export const DEFAULT_SCENE: SceneMotion = {
  zoom: [1.05, 1.1],
  period: 56,
  drift: [0.5, -0.3],
  focus: [0.5, 0.55],
  parallax: 0.012,
  regions: { ground: { cx: 0.5, cy: 1.05, rx: 0.9, ry: 0.32, soft: 0.8 } },
  wind: { regions: 'ground', amp: 0.0022, speed: 0.22, freq: 2.2 },
}

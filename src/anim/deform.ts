/**
 * Pure deformation math for "living art": a single cut-out illustration is
 * drawn as a grid mesh and every vertex is displaced each frame by a sum of
 * small, physically-motivated motions (breathing, sway, flutter, travelling
 * waves, hover, jelly squash). Everything here is plain math on normalised
 * image coordinates so it can be unit-tested and shared by the renderer.
 *
 * Coordinates: u ∈ [0,1] left→right, v ∈ [0,1] top→bottom of the (trimmed)
 * image. Displacements are in the same units (fractions of width / height).
 */

/** A soft weight mask: an ellipse with a feathered edge, optionally ramped. */
export interface Region {
  cx: number
  cy: number
  rx: number
  ry: number
  /** Feather as a fraction of the radius (0 = hard edge, 1 = fully soft). Default 0.6. */
  soft?: number
  /**
   * Linear ramp [u0, v0, u1, v1]: weight 0 at (u0,v0) rising to 1 at (u1,v1).
   * Use it so hair/tails/hems move more toward their tips than their roots.
   */
  ramp?: readonly [number, number, number, number]
}

export interface Breathe {
  /** Rise of the shoulders/head at full inhale (fraction of height). */
  amp: number
  /** Seconds per breath. */
  period: number
  /** Chest height (v). The torso below it stretches; everything above rises rigidly. Default 0.45. */
  chest?: number
  /** Chest widening at full inhale (fraction of width). Default amp * 0.5. */
  widen?: number
}

export interface Sway {
  /** Horizontal displacement at the very top (fraction of width). */
  amp: number
  period: number
  /** Bend profile: displacement grows with height^power (2 = cantilever). Default 2. */
  power?: number
  /** Phase offset (radians). */
  phase?: number
}

export interface Flutter {
  /** Region names (from the profile's `regions`) whose weights are summed (capped at 1). */
  regions: string | readonly string[]
  /** Horizontal / vertical amplitude (fractions of width / height). */
  ax: number
  ay: number
  /** Temporal speed (waves per second). */
  speed: number
  /** Spatial frequency (waves across the image). Default 1.5. */
  freq?: number
  /** Constant bias along +x / +y scaled by weight × (0.5 + 0.5·wave), e.g. flames licking upward (by < 0). */
  bx?: number
  by?: number
  phase?: number
}

/** A travelling sine along the long axis (serpents, dragons, root ripples). */
export interface Wave {
  /** Perpendicular displacement (fraction of the other dimension). */
  amp: number
  /** Wavelength as a fraction of the axis length. */
  wavelength: number
  /** Cycles per second (positive: travels toward +axis). */
  speed: number
  axis: 'x' | 'y'
  /** Optional mask; whole image when omitted. */
  regions?: string | readonly string[]
}

export interface Float {
  /** Bob height (fraction of height). */
  amp: number
  period: number
  /** Max tilt (radians), a quarter period out of phase with the bob. */
  tilt?: number
}

/** Idle jelly: a periodic self-bounce (squash impulse followed by a damped wobble). */
export interface Jelly {
  amp: number
  period: number
  /** Wobble frequency (Hz). Default 2.6. */
  freq?: number
}

export interface Profile {
  /** Named soft masks referenced by flutter / wave. */
  regions: Record<string, Region>
  breathe?: Breathe
  sway?: Sway
  flutter?: readonly Flutter[]
  wave?: Wave
  float?: Float
  jelly?: Jelly
  /** Horizontal centre of the body (u). Default 0.5. */
  cx?: number
  /** Max lean toward a look target (fraction of width at the top). Default 0.02. */
  lean?: number
  /** Talking bounce strength (0..1). Default 1. */
  talk?: number
  /** Per-asset global multiplier for all idle motion (1 = as authored). */
  gain?: number
}

/** Per-frame dynamic inputs driven by springs (reactions, talking, look). */
export interface Dyn {
  /** Extra vertical stretch around the anchor (+0.1 = 10 % taller, volume preserving). */
  squash: number
  /** Extra bend: horizontal displacement at the top (fraction of width), ∝ height². */
  bend: number
  /** Lean toward a target, −1..1 (scaled by profile.lean). */
  lean: number
  /** Global idle amplitude multiplier (e.g. 0.35 for reduced motion). */
  amp: number
  /** Reduced motion: breathing only. */
  reduced: boolean
}

export const REST_DYN: Dyn = { squash: 0, bend: 0, lean: 0, amp: 1, reduced: false }

const TAU = Math.PI * 2

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const smooth01 = (x: number) => {
  const t = clamp01(x)
  return t * t * (3 - 2 * t)
}

/** Soft weight in [0,1] of a region at (u,v). */
export function regionWeight(r: Region, u: number, v: number): number {
  const dx = (u - r.cx) / r.rx
  const dy = (v - r.cy) / r.ry
  const d = Math.sqrt(dx * dx + dy * dy)
  if (d >= 1) return 0
  const soft = r.soft ?? 0.6
  let w = soft <= 0 ? 1 : 1 - smooth01((d - (1 - soft)) / soft)
  if (r.ramp) {
    const [u0, v0, u1, v1] = r.ramp
    const rx = u1 - u0
    const ry = v1 - v0
    const len2 = rx * rx + ry * ry || 1
    w *= smooth01(((u - u0) * rx + (v - v0) * ry) / len2)
  }
  return w
}

/** Summed (capped) weight of several named regions. */
export function maskWeight(p: Profile, names: string | readonly string[] | undefined, u: number, v: number): number {
  if (names === undefined) return 1
  const list = typeof names === 'string' ? [names] : names
  let w = 0
  for (const n of list) {
    const r = p.regions[n]
    if (r) w += regionWeight(r, u, v)
    if (w >= 1) return 1
  }
  return w
}

/**
 * Breath curve in [0,1]: a quicker inhale (40 %) and a longer, relaxed
 * exhale (60 %), smooth (C¹) at both turning points.
 */
export function breathCurve(t: number, period: number): number {
  let p = (t / period) % 1
  if (p < 0) p += 1
  const q = p < 0.4 ? (p / 0.4) * 0.5 : 0.5 + ((p - 0.4) / 0.6) * 0.5
  return 0.5 - 0.5 * Math.cos(TAU * q)
}

/** Idle jelly squash at time t: impulse at the start of each period, then a damped wobble. */
export function jellySquash(j: Jelly, t: number): number {
  let tau = t % j.period
  if (tau < 0) tau += j.period
  const f = j.freq ?? 2.6
  const k = 5 / j.period + 1.2
  return j.amp * Math.sin(TAU * f * tau) * Math.exp(-k * tau)
}

/** Hover offset (dy, fraction of height; negative = up) and tilt (radians) at time t. */
export function floatPose(f: Float, t: number): { dy: number; tilt: number } {
  const ph = (TAU * t) / f.period
  return { dy: -f.amp * Math.sin(ph), tilt: (f.tilt ?? 0) * Math.sin(ph - Math.PI / 2) }
}

/** Height above the anchor (1 at the top edge, 0 at the bottom edge). */
const heightOf = (v: number) => clamp01(1 - v)

/**
 * Displacement of one vertex. `aspect` = image width / height (rotations
 * are done in pixel space so they stay rigid for wide images).
 * Returns the deformed position in normalised image coordinates.
 */
export function deformPoint(p: Profile, u: number, v: number, t: number, dyn: Dyn, aspect = 1): [number, number] {
  const g = (p.gain ?? 1) * dyn.amp
  const cx = p.cx ?? 0.5
  const h = heightOf(v)
  let dx = 0
  let dy = 0

  // Breathing: torso stretches from the anchor up to the chest; above it rises rigidly.
  if (p.breathe) {
    const b = p.breathe
    const k = breathCurve(t, b.period)
    const chest = b.chest ?? 0.45
    const rise = smooth01(h / Math.max(0.05, 1 - chest))
    dy -= b.amp * g * k * rise
    const widen = b.widen ?? b.amp * 0.5
    const band = Math.exp(-((v - chest) * (v - chest)) / 0.045)
    dx += (u - cx) * widen * g * k * band
  }

  if (!dyn.reduced) {
    // Sway: a cantilever bend that grows with height, two incommensurate harmonics.
    if (p.sway) {
      const s = p.sway
      const w = (TAU * t) / s.period + (s.phase ?? 0)
      const osc = (Math.sin(w) + 0.3 * Math.sin(2.7 * w + 1.1)) / 1.3
      dx += s.amp * g * osc * Math.pow(h, s.power ?? 2)
    }

    // Flutter: layered travelling waves (cheap smooth pseudo-noise) inside masks.
    if (p.flutter) {
      for (const f of p.flutter) {
        const w = maskWeight(p, f.regions, u, v)
        if (w <= 0.001) continue
        const fr = f.freq ?? 1.5
        const ph = f.phase ?? 0
        const T = t * f.speed
        const s1 = Math.sin(TAU * (fr * (v + 0.3 * u) - T) + ph)
        const s2 = Math.sin(TAU * (fr * 1.73 * (u - 0.5 * v) - T * 1.37) + ph * 2.1 + 0.7)
        const s3 = Math.sin(TAU * (fr * 0.61 * (u + v) - T * 0.53) + ph * 0.7 + 2.3)
        const nx = 0.55 * s1 + 0.3 * s2 + 0.15 * s3
        const ny = 0.5 * s2 + 0.3 * s3 + 0.2 * s1
        dx += g * w * (f.ax * nx + (f.bx ?? 0) * (0.5 + 0.5 * s1))
        dy += g * w * (f.ay * ny + (f.by ?? 0) * (0.5 + 0.5 * s2))
      }
    }

    // Serpentine wave along the long axis.
    if (p.wave) {
      const wv = p.wave
      const w = maskWeight(p, wv.regions, u, v)
      if (w > 0.001) {
        const along = wv.axis === 'x' ? u : v
        const ph = TAU * (along / wv.wavelength - wv.speed * t)
        const perp = wv.amp * g * w * Math.sin(ph)
        const par = wv.amp * 0.25 * g * w * Math.cos(ph)
        if (wv.axis === 'x') {
          dy += perp
          dx += par / aspect
        } else {
          dx += perp
          dy += par
        }
      }
    }

    // Idle jelly squash (volume preserving, anchored at the bottom) + a lagging lateral jiggle.
    if (p.jelly) {
      const s = jellySquash(p.jelly, t) * g
      dy -= s * h
      dx += (u - cx) * (1 / Math.sqrt(1 + s) - 1)
      dx += 0.18 * jellySquash(p.jelly, t - 0.09) * g * h * h
    }
  }

  // Spring-driven dynamics (reactions / talking / look).
  if (dyn.squash !== 0) {
    const s = dyn.squash
    dy -= s * h
    dx += (u - cx) * (1 / Math.sqrt(Math.max(0.2, 1 + s)) - 1)
  }
  if (dyn.bend !== 0) dx += dyn.bend * h * h
  if (dyn.lean !== 0) dx += dyn.lean * (p.lean ?? 0.02) * Math.pow(h, 1.5)

  let x = u + dx
  let y = v + dy

  // Hover: whole-body bob and tilt about the centre (in pixel space).
  if (p.float && !dyn.reduced) {
    const f = floatPose(p.float, t)
    const a = f.tilt * g
    if (a !== 0) {
      const px = (x - cx) * aspect
      const py = y - 0.5
      const c = Math.cos(a)
      const sn = Math.sin(a)
      x = cx + (px * c - py * sn) / aspect
      y = 0.5 + px * sn + py * c
    }
    y += f.dy * g
  }
  return [x, y]
}

/**
 * Canvas padding (fractions of the image size) needed so the deformed mesh
 * is never clipped: idle motion extents plus headroom for reactions.
 */
export function profilePad(p: Profile, aspect = 1): { x: number; top: number; bottom: number } {
  const g = p.gain ?? 1
  let x = 0
  let y = 0
  if (p.breathe) {
    y += p.breathe.amp
    x += p.breathe.widen ?? p.breathe.amp * 0.5
  }
  if (p.sway) x += p.sway.amp * 1.3
  for (const f of p.flutter ?? []) {
    x += Math.abs(f.ax) + Math.abs(f.bx ?? 0)
    y += Math.abs(f.ay) + Math.abs(f.by ?? 0)
  }
  if (p.wave) {
    if (p.wave.axis === 'x') y += p.wave.amp
    else x += p.wave.amp
    x += p.wave.amp * 0.25
  }
  if (p.jelly) {
    y += p.jelly.amp
    x += p.jelly.amp * 0.5
  }
  if (p.float) {
    y += p.float.amp
    const t = p.float.tilt ?? 0
    x += t * 0.6
    y += t * 0.6 * aspect
  }
  x += p.lean ?? 0.02
  // Reaction headroom (hit bend ±0.05, squash/stretch ±0.12).
  x = x * g + 0.07
  const top = y * g + 0.13
  const bottom = (p.float ? p.float.amp * g : 0) + 0.03
  const cap = (n: number) => Math.min(0.3, Math.max(0.03, n))
  return { x: cap(x), top: cap(top), bottom: cap(bottom) }
}

/** Reduced-motion variant: gentle breathing only. */
export function reducedProfile(p: Profile): Profile {
  return { regions: p.regions, cx: p.cx, breathe: p.breathe ?? { amp: 0.004, period: 5 }, lean: 0, gain: (p.gain ?? 1) * 0.6 }
}

/** Grid vertex count for n×n quads. */
export const gridVerts = (n: number) => (n + 1) * (n + 1)

/** Triangle indices for an n×n grid. */
export function gridIndices(n: number): Uint16Array {
  const out = new Uint16Array(n * n * 6)
  let k = 0
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const a = j * (n + 1) + i
      const b = a + 1
      const c = a + n + 1
      const d = c + 1
      out[k++] = a
      out[k++] = c
      out[k++] = b
      out[k++] = b
      out[k++] = c
      out[k++] = d
    }
  return out
}

/** Rest UVs of an n×n grid (u,v interleaved). */
export function gridUvs(n: number): Float32Array {
  const out = new Float32Array(gridVerts(n) * 2)
  let k = 0
  for (let j = 0; j <= n; j++)
    for (let i = 0; i <= n; i++) {
      out[k++] = i / n
      out[k++] = j / n
    }
  return out
}

/**
 * Fill `out` (x,y interleaved, in canvas space 0..1) with the deformed
 * grid for a figure, including the canvas padding and optional mirroring.
 */
export function deformGrid(out: Float32Array, uvs: Float32Array, p: Profile, t: number, dyn: Dyn, aspect: number, pad: { x: number; top: number; bottom: number }, flip = false) {
  const W = 1 + 2 * pad.x
  const H = 1 + pad.top + pad.bottom
  for (let k = 0; k < uvs.length; k += 2) {
    const [x, y] = deformPoint(p, uvs[k], uvs[k + 1], t, dyn, aspect)
    out[k] = (pad.x + (flip ? 1 - x : x)) / W
    out[k + 1] = (pad.top + y) / H
  }
}

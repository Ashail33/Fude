/**
 * A tiny DOM-free software rasteriser for the pixel art. Sprites and tiles
 * are composed here as grids of palette colours, then converted to canvases
 * once (see canvas.ts). Keeping this pure lets the art be unit-tested in node.
 */
import { PAL, type PalKey } from './palette'

/** Single-character legend used by every pixel map. `.` is transparent. */
export const LEGEND: Record<string, PalKey> = {
  k: 'ink', n: 'night', N: 'navy', d: 'dusk',
  s: 'stone', S: 'stoneDark', m: 'mist', p: 'paper', P: 'paperShade', w: 'white',
  f: 'skin', F: 'skinShade',
  O: 'woodDark', o: 'wood', L: 'woodLight', a: 'sand', t: 'tatami', T: 'tatamiDark',
  G: 'leafDark', g: 'leaf', r: 'grass', R: 'grassLight',
  B: 'waterDeep', b: 'water', c: 'waterLight', C: 'foam',
  v: 'vermilion', V: 'crimson', e: 'orange', y: 'gold',
  h: 'sakura', H: 'sakuraDark', u: 'violet', U: 'lilac',
  x: 'fire', i: 'ice', l: 'light', j: 'wind', z: 'poison',
}

/** Digits are per-sprite colour slots (e.g. the mage's robe). */
export const SLOT_CHARS = '123456789'

export type Slots = Record<string, string>

export function isHex(c: string) {
  return /^#[0-9a-f]{6}$/i.test(c)
}

/** Resolve a map character to a hex colour (null = transparent). */
export function colorOf(ch: string, slots?: Slots): string | null {
  if (ch === '.' || ch === ' ') return null
  const k = LEGEND[ch]
  if (k) return PAL[k]
  const s = slots?.[ch]
  if (s) return s.startsWith('#') ? s : (PAL as Record<string, string>)[s] ?? null
  throw new Error(`pixel map: unknown char '${ch}'`)
}

/** Validate a pixel map; returns a list of problems (empty = fine). Pure. */
export function checkMap(rows: readonly string[], w: number, h: number, slots: string = ''): string[] {
  const errs: string[] = []
  if (rows.length !== h) errs.push(`expected ${h} rows, got ${rows.length}`)
  rows.forEach((r, i) => {
    if (r.length !== w) errs.push(`row ${i} has width ${r.length}, expected ${w}`)
    for (const ch of r) if (ch !== '.' && !LEGEND[ch] && !slots.includes(ch)) errs.push(`row ${i}: bad char '${ch}'`)
  })
  return errs
}

export class Img {
  w: number
  h: number
  px: (string | null)[]
  constructor(w: number, h: number) {
    this.w = w
    this.h = h
    this.px = new Array(w * h).fill(null)
  }
  get(x: number, y: number): string | null {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null
    return this.px[y * this.w + x]
  }
  set(x: number, y: number, c: string | null) {
    x = Math.floor(x)
    y = Math.floor(y)
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    this.px[y * this.w + x] = c
  }
  rect(x: number, y: number, w: number, h: number, c: string | null) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c)
    return this
  }
  fill(c: string | null) {
    this.px.fill(c)
    return this
  }
  clone() {
    const o = new Img(this.w, this.h)
    o.px = this.px.slice()
    return o
  }
  /** Draw `src` over this image (transparent pixels skipped). */
  blit(src: Img, ox = 0, oy = 0) {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const c = src.px[y * src.w + x]
        if (c) this.set(ox + x, oy + y, c)
      }
    return this
  }
  /** Draw a pixel map (array of strings) at an offset. */
  map(rows: readonly string[], ox = 0, oy = 0, slots?: Slots, flip = false) {
    for (let y = 0; y < rows.length; y++) {
      const r = rows[y]
      for (let x = 0; x < r.length; x++) {
        const c = colorOf(r[flip ? r.length - 1 - x : x], slots)
        if (c) this.set(ox + x, oy + y, c)
      }
    }
    return this
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: string) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx
        const dy = (y + 0.5 - cy) / ry
        if (dx * dx + dy * dy <= 1) this.set(x, y, c)
      }
    return this
  }
  /** Replace colours through a function (null result = keep). */
  recolor(fn: (c: string, x: number, y: number) => string | null | undefined) {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const c = this.px[y * this.w + x]
        if (c) {
          const n = fn(c, x, y)
          if (n !== undefined && n !== null) this.px[y * this.w + x] = n
        }
      }
    return this
  }
}

export function fromMap(rows: readonly string[], slots?: Slots, w?: number, h?: number): Img {
  const img = new Img(w ?? rows[0]?.length ?? 0, h ?? rows.length)
  return img.map(rows, 0, 0, slots)
}

export function flipX(img: Img): Img {
  const o = new Img(img.w, img.h)
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) o.px[y * o.w + x] = img.px[y * img.w + (img.w - 1 - x)]
  return o
}

/** Shift the whole image by (dx, dy); vacated pixels become transparent. */
export function shift(img: Img, dx: number, dy: number): Img {
  const o = new Img(img.w, img.h)
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) o.set(x + dx, y + dy, img.px[y * img.w + x])
  return o
}

/** Mirror rows y0..y1 horizontally inside columns x0..x1 (walk-cycle leg swap). */
export function mirrorRows(img: Img, y0: number, y1: number, x0: number, x1: number): Img {
  const o = img.clone()
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) o.px[y * o.w + x] = img.px[y * img.w + (x0 + x1 - x)]
  return o
}

/** Squash: rows above `pivot` move down by one (drops row `pivot`). A breathing frame. */
export function squash(img: Img, pivot: number): Img {
  const o = img.clone()
  for (let y = pivot; y >= 1; y--) for (let x = 0; x < img.w; x++) o.px[y * o.w + x] = img.px[(y - 1) * img.w + x]
  for (let x = 0; x < img.w; x++) o.px[x] = null
  return o
}

/** Pure white (or any colour) silhouette, e.g. the hit flash. */
export function silhouette(img: Img, color = PAL.white): Img {
  const o = img.clone()
  for (let i = 0; i < o.px.length; i++) if (o.px[i]) o.px[i] = color
  return o
}

/**
 * 1px outline in `color` around every opaque pixel that isn't already the
 * outline colour (4-neighbourhood, so hand-drawn outlines stay single).
 */
export function outline(img: Img, color: string = PAL.ink): Img {
  const o = img.clone()
  for (let y = 0; y < img.h; y++)
    for (let x = 0; x < img.w; x++) {
      if (img.get(x, y)) continue
      const n = [img.get(x - 1, y), img.get(x + 1, y), img.get(x, y - 1), img.get(x, y + 1)]
      if (n.some((c) => c && c !== color)) o.set(x, y, color)
    }
  return o
}

// ---------------------------------------------------------------------------
// Colour ramps + automatic top-left lighting.

/** Material ramps, dark → light. Used by autoShade and for shadows on tiles. */
export const RAMPS: PalKey[][] = [
  ['leafDark', 'leaf', 'grass', 'grassLight'],
  ['navy', 'waterDeep', 'water', 'waterLight', 'foam'],
  ['paperShade', 'paper', 'white'],
  ['night', 'stoneDark', 'stone', 'mist', 'paper'],
  ['woodDark', 'wood', 'woodLight', 'sand'],
  ['crimson', 'vermilion', 'orange', 'gold', 'light'],
  ['crimson', 'fire', 'gold', 'light'],
  ['sakuraDark', 'sakura', 'paper'],
  ['night', 'violet', 'lilac', 'paper'],
  ['skinShade', 'skin', 'paper'],
  ['waterLight', 'ice', 'white'],
  ['tatamiDark', 'tatami', 'sand'],
  ['night', 'navy', 'dusk', 'stone'],
  ['leaf', 'poison', 'grassLight'],
  ['water', 'wind', 'foam'],
]

interface RampPos {
  ramp: string[]
  i: number
  id: number
}
/** Each colour belongs to the first ramp it appears in. */
const MEMBER = new Map<string, RampPos>()
RAMPS.forEach((r, id) => {
  const hex = r.map((k) => PAL[k])
  hex.forEach((c, i) => {
    if (c === PAL.ink || c === PAL.white) return
    if (!MEMBER.has(c)) MEMBER.set(c, { ramp: hex, i, id })
  })
})

/** Step a colour up (+) or down (−) its ramp. Unknown colours are returned unchanged. */
export function rampStep(c: string, steps: number): string {
  const m = MEMBER.get(c)
  if (!m) return c
  return m.ramp[Math.max(0, Math.min(m.ramp.length - 1, m.i + steps))]
}

/**
 * Top-left light: pixels whose colour is in `chars` are brightened near the
 * top-left edges of their material and darkened toward the bottom-right.
 * Accent colours (eyes, ink) don't break a material, other materials do.
 */
export function autoShade(img: Img, chars: string, slots?: Slots, strength = 1): Img {
  const targets = new Set<string>()
  for (const ch of chars) {
    const c = colorOf(ch, slots)
    if (c) targets.add(c)
  }
  const o = img.clone()
  const matId = (c: string | null) => (c ? (MEMBER.get(c)?.id ?? -1) : -2)
  const isBoundary = (me: number, c: string | null) => {
    if (!c) return true
    const id = matId(c)
    return id >= 0 && id !== me
  }
  const dist = (x: number, y: number, dx: number, dy: number, me: number) => {
    let d = 1
    while (d < 24 && !isBoundary(me, img.get(x + dx * d, y + dy * d))) d++
    return d
  }
  for (let y = 0; y < img.h; y++)
    for (let x = 0; x < img.w; x++) {
      const c = img.get(x, y)
      if (!c || !targets.has(c)) continue
      const me = matId(c)
      const du = dist(x, y, 0, -1, me)
      const dd = dist(x, y, 0, 1, me)
      const dl = dist(x, y, -1, 0, me)
      const dr = dist(x, y, 1, 0, me)
      const t = (du + dl) / (du + dl + dd + dr)
      let s = 0
      if (t > 0.64) s = -1
      if (t < 0.3) s = 1
      if ((dd === 1 || dr === 1) && t > 0.42) s = -1
      if ((du === 1 || dl === 1) && t < 0.5) s = 1
      if (strength > 1 && t > 0.8 && (dd === 1 || dr === 1) && du + dd >= 6 && dl + dr >= 6) s = -2
      if (s) o.set(x, y, rampStep(c, s))
    }
  return o
}

/** Darken ground pixels inside an ellipse (a soft cast shadow). */
export function castShadow(img: Img, cx: number, cy: number, rx: number, ry: number) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx
      const dy = (y + 0.5 - cy) / ry
      if (dx * dx + dy * dy <= 1) {
        const c = img.get(x, y)
        if (c) img.set(x, y, rampStep(c, -1))
      }
    }
  return img
}

// ---------------------------------------------------------------------------
// Deterministic hashing / RNG (so tiles vary by position but never flicker).

export function hash2(x: number, y: number, seed = 0): number {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2246822519)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return (h ^ (h >>> 16)) >>> 0
}

export function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

// ---------------------------------------------------------------------------
// Colour maths for outfit recolours.

export function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}
/** Mix two hex colours (t = 0 → a, 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a)
  const y = hexToRgb(b)
  return rgbToHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t)
}
export function luminance(h: string): number {
  const [r, g, b] = hexToRgb(h)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

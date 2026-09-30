/**
 * Pure tile renderer: (id, variant, frame, neighbours) → 16×16 Img.
 * Ground/water/walls are procedural (so fields vary and edges blend);
 * props are palette maps from tilemaps.ts composited over a ground tile.
 */
import { Img, autoShade, castShadow, colorOf, fromMap, hash2, outline, rng } from './raster'
import { PROPS } from './tilemaps'
import type { TileId } from './tiles'

export const N = 1
export const NE = 2
export const E = 4
export const SE = 8
export const S = 16
export const SW = 32
export const W = 64
export const NW = 128

type NbMode = 'none' | 'card' | 'full' | 'h' | 'n'

export interface TileSpec {
  frames?: number
  /** ms per frame */
  period?: number
  /** offset the animation per tile position */
  phase?: boolean
  /** positional variants (hash of tile coords mod this) */
  variants?: number
  nb?: NbMode
  /** default ground drawn beneath a transparent prop */
  under?: TileId
  /** can walk over it (informational for the map; drawing ignores it) */
}

const WATER_FAMILY: readonly string[] = ['water', 'water-deep', 'lily', 'bridge-h', 'bridge-v', 'stepping-stone']
const FAMILIES: Record<string, string> = {}
for (const id of WATER_FAMILY) FAMILIES[id] = 'water'
for (const id of ['wall', 'wall-window', 'door', 'noren', 'shop-awning']) FAMILIES[id] = 'wall'
for (const id of ['roof', 'roof-edge']) FAMILIES[id] = 'roof'
for (const id of ['roof-red', 'roof-red-edge']) FAMILIES[id] = 'roof-red'
for (const id of ['cliff', 'cave']) FAMILIES[id] = 'cliff'
for (const id of ['castle-wall', 'gate-closed', 'gate-open']) FAMILIES[id] = 'castle'

/** Tiles that count as "the same" for edge-aware drawing (e.g. all water). */
export function tileFamily(id: string): string {
  return FAMILIES[id] ?? id
}

export const SPECS: Partial<Record<TileId, TileSpec>> = {
  grass: { variants: 8 },
  'grass-dark': { variants: 8 },
  flowers: { variants: 6, frames: 2, period: 650, phase: true },
  'tall-grass': { variants: 4, frames: 2, period: 520, phase: true, nb: 'card' },
  path: { variants: 6, nb: 'full' },
  sand: { variants: 6, nb: 'full' },
  dirt: { variants: 6, nb: 'full' },
  'stone-floor': { variants: 4 },
  'wood-floor': { variants: 2 },
  tatami: { variants: 2 },
  snow: { variants: 6 },
  water: { variants: 9, frames: 4, period: 280, nb: 'full' },
  'water-deep': { variants: 9, frames: 4, period: 320, nb: 'full' },
  lily: { variants: 9, frames: 4, period: 280, nb: 'full' },
  'bridge-h': { variants: 9, frames: 4, period: 280, nb: 'card' },
  'bridge-v': { variants: 9, frames: 4, period: 280, nb: 'card' },
  'stepping-stone': { variants: 9, frames: 4, period: 280, nb: 'full' },
  tree: { under: 'grass', variants: 2 },
  pine: { under: 'grass' },
  sakura: { under: 'grass', frames: 6, period: 260, phase: true },
  bamboo: { under: 'grass-dark', variants: 2, frames: 2, period: 900, phase: true },
  bush: { under: 'grass' },
  rock: { under: 'grass' },
  boulder: { under: 'grass' },
  stump: { under: 'grass' },
  cliff: { variants: 4, nb: 'card' },
  'cliff-top': { variants: 4, nb: 'card' },
  wall: { nb: 'h' },
  'wall-window': { nb: 'h' },
  door: { nb: 'h' },
  noren: { nb: 'h', frames: 2, period: 1400, phase: true },
  roof: { nb: 'card' },
  'roof-edge': { nb: 'card' },
  'roof-red': { nb: 'card' },
  'roof-red-edge': { nb: 'card' },
  'shop-awning': { nb: 'h' },
  fence: { under: 'grass', nb: 'card' },
  'stone-wall': { nb: 'card', variants: 3 },
  'castle-wall': { nb: 'card', variants: 3 },
  'tower-wall': { nb: 'card', variants: 4, frames: 4, period: 400 },
  sign: { under: 'grass' },
  lantern: { under: 'grass', frames: 4, period: 140, phase: true },
  well: { under: 'grass' },
  torii: { under: 'grass', nb: 'h' },
  'shrine-bell': { under: 'stone-floor' },
  statue: { under: 'grass' },
  stall: { under: 'path' },
  barrel: { under: 'grass' },
  crate: { under: 'grass' },
  pot: { under: 'grass' },
  chest: { under: 'grass' },
  'chest-open': { under: 'grass' },
  cave: {},
  'stairs-up': {},
  'stairs-down': {},
  'gate-closed': { frames: 4, period: 180 },
  'gate-open': {},
  portal: { under: 'stone-floor', frames: 4, period: 150 },
  'warp-circle': { under: 'stone-floor', frames: 4, period: 200 },
  anvil: { under: 'stone-floor' },
  tablet: { under: 'grass' },
  bookshelf: { under: 'wood-floor' },
  altar: { under: 'wood-floor', frames: 3, period: 160, phase: true },
  throne: { under: 'carpet' },
  carpet: { nb: 'full' },
  campfire: { under: 'dirt', frames: 4, period: 110 },
}

export function specOf(id: TileId): TileSpec {
  return SPECS[id] ?? {}
}

/** Keep only the neighbour bits a tile actually uses (smaller cache). */
export function normaliseNb(id: TileId, nb: number): number {
  const mode = specOf(id).nb ?? 'none'
  if (mode === 'none') return 0
  if (mode === 'h') return nb & (E | W)
  if (mode === 'n') return nb & N
  const card = nb & (N | E | S | W)
  if (mode === 'card') return card
  let out = card
  if (nb & NE && card & N && card & E) out |= NE
  if (nb & SE && card & S && card & E) out |= SE
  if (nb & SW && card & S && card & W) out |= SW
  if (nb & NW && card & N && card & W) out |= NW
  return out
}

// ---------------------------------------------------------------------------

const C = (ch: string) => colorOf(ch)!
const has = (nb: number, bit: number) => (nb & bit) !== 0

/** 16-step wobble, zero at both ends so edges line up across tiles. */
const WOB = [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0]

/**
 * Distance (px) from a pixel to the nearest "open" edge given which
 * cardinal/diagonal neighbours are the same material. Rounded outer corners
 * (radius r) and small inner-corner notches.
 */
function edgeDist(x: number, y: number, nb: number, r = 5, inner = 2.2): number {
  const px = x + 0.5
  const py = y + 0.5
  const nOpen = !has(nb, N)
  const sOpen = !has(nb, S)
  const wOpen = !has(nb, W)
  const eOpen = !has(nb, E)
  let d = 99
  if (nOpen) d = Math.min(d, py + WOB[x] * 0.9)
  if (sOpen) d = Math.min(d, 16 - py + WOB[(x + 5) & 15] * 0.9)
  if (wOpen) d = Math.min(d, px + WOB[y] * 0.9)
  if (eOpen) d = Math.min(d, 16 - px + WOB[(y + 5) & 15] * 0.9)
  // rounded outer corners
  const corner = (cx: number, cy: number) => {
    const dx = Math.abs(px - cx)
    const dy = Math.abs(py - cy)
    if (dx < r && dy < r) d = Math.min(d, r - Math.hypot(r - dx, r - dy))
  }
  if (nOpen && wOpen) corner(0, 0)
  if (nOpen && eOpen) corner(16, 0)
  if (sOpen && wOpen) corner(0, 16)
  if (sOpen && eOpen) corner(16, 16)
  // inner corners: both sides same but the diagonal isn't
  const innerC = (bit: number, a: number, b: number, cx: number, cy: number) => {
    if (has(nb, a) && has(nb, b) && !has(nb, bit)) d = Math.min(d, Math.hypot(px - cx, py - cy) - inner)
  }
  innerC(NW, N, W, 0, 0)
  innerC(NE, N, E, 16, 0)
  innerC(SW, S, W, 0, 16)
  innerC(SE, S, E, 16, 16)
  return d
}

// ---------------------------------------------------------------------------
// Ground

function grassBase(img: Img, v: number, base = 'r', dark = 'g', light = 'R') {
  img.fill(C(base))
  const rnd = rng(hash2(v, 7, 11) + 1)
  // soft mottling
  for (let i = 0; i < 7; i++) {
    const x = Math.floor(rnd() * 16)
    const y = Math.floor(rnd() * 16)
    img.set(x, y, C(dark))
  }
  // tufts: a light blade over a dark root
  const tufts = 3 + (v % 3)
  for (let i = 0; i < tufts; i++) {
    const x = 1 + Math.floor(rnd() * 13)
    const y = 1 + Math.floor(rnd() * 13)
    img.set(x, y + 1, C(dark))
    img.set(x + 2, y + 1, C(dark))
    img.set(x + 1, y, C(dark))
    if (rnd() < 0.6) img.set(x, y, C(light))
  }
  if (v % 4 === 1) {
    const x = 2 + Math.floor(rnd() * 12)
    const y = 2 + Math.floor(rnd() * 12)
    img.set(x, y, C(light))
  }
}

function flowers(img: Img, v: number, f: number) {
  grassBase(img, v)
  const rnd = rng(hash2(v, 3, 5) + 9)
  const kinds = [
    ['w', 'y'],
    ['h', 'y'],
    ['y', 'e'],
    ['U', 'w'],
  ]
  const n = 3 + (v % 2)
  for (let i = 0; i < n; i++) {
    const x = 2 + Math.floor(rnd() * 11)
    const y = 3 + Math.floor(rnd() * 10)
    const [pet, mid] = kinds[Math.floor(rnd() * kinds.length)]
    const sway = (f + i) % 2 ? 1 : 0
    // stem & leaf
    img.set(x, y + 2, C('g'))
    img.set(x + 1, y + 2, C('G'))
    img.set(x - 1, y + 3, C('g'))
    // head (sways a pixel)
    const hx = x + sway - (i % 2 ? 0 : sway)
    img.set(hx, y, C(mid))
    img.set(hx - 1, y, C(pet))
    img.set(hx + 1, y, C(pet))
    img.set(hx, y - 1, C(pet))
    img.set(hx, y + 1, C(pet))
    img.set(hx + 1, y + 1, C('g'))
  }
}

function tallGrass(img: Img, v: number, f: number, nb: number) {
  img.fill(C('g'))
  // dense blades in staggered rows; tips sway with the frame
  for (let row = 0; row < 4; row++) {
    const y0 = row * 4 + 3
    for (let k = 0; k < 5; k++) {
      const x0 = ((k * 4 + row * 2 + v) % 16) - 1
      const lean = (f + row + k) % 2 ? 1 : 0
      for (let h = 0; h < 5; h++) {
        const x = x0 + (h < 2 ? lean : 0)
        const y = y0 - h
        img.set(x, y, C(h === 4 ? 'R' : h >= 2 ? 'r' : 'g'))
        img.set(x + 1, y, C(h >= 3 ? 'r' : 'G'))
      }
      img.set(x0 + 2, y0, C('G'))
      img.set(x0 - 1, y0, C('G'))
    }
  }
  // a darker fringe along open bottom edges so zones read as raised
  if (!has(nb, S)) for (let x = 0; x < 16; x++) img.set(x, 15, C((x + v) % 3 ? 'G' : 'g'))
}

function speckle(img: Img, v: number, cols: string[], count: number, seed: number) {
  const rnd = rng(hash2(v, seed, 3) + 5)
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rnd() * 16)
    const y = Math.floor(rnd() * 16)
    img.set(x, y, C(cols[Math.floor(rnd() * cols.length)]))
  }
}

/** A ground material with soft grass edges where neighbours differ. */
function softGround(img: Img, v: number, nb: number, base: string, specks: string[], pebble: string, pebbleHi: string) {
  img.fill(C(base))
  speckle(img, v, specks, 10, 21)
  const rnd = rng(hash2(v, 1, 2) + 3)
  for (let i = 0; i < 2; i++) {
    const x = 2 + Math.floor(rnd() * 11)
    const y = 2 + Math.floor(rnd() * 11)
    img.set(x, y, C(pebble))
    img.set(x + 1, y, C(pebble))
    img.set(x, y - 1, C(pebbleHi))
  }
  if (nb === 0xff) return
  const g = new Img(16, 16)
  grassBase(g, v)
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const d = edgeDist(x, y, nb, 5, 2.5)
      if (d < 1.6) img.set(x, y, g.get(x, y))
      else if (d < 2.6) img.set(x, y, (x + y) % 2 ? g.get(x, y) : C(specks[0]))
      else if (d < 3.4 && (x * 3 + y) % 5 === 0) img.set(x, y, C(specks[0]))
    }
}

function stoneFloor(img: Img, v: number) {
  img.fill(C('s'))
  // 2×2 flagstones with offset per variant
  const off = v % 2 ? 4 : 0
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const row = y < 8 ? 0 : 1
      const xx = (x + (row ? off + 4 : off)) % 8
      const yy = y % 8
      if (yy === 7 || xx === 7) img.set(x, y, C('S'))
      else if (yy === 0 || xx === 0) img.set(x, y, C('m'))
    }
  speckle(img, v, ['S', 'm'], 4, 8)
}

function woodFloor(img: Img, v: number) {
  img.fill(C('o'))
  for (let y = 0; y < 16; y++) {
    const band = Math.floor(y / 4)
    for (let x = 0; x < 16; x++) {
      if (y % 4 === 3) img.set(x, y, C('O'))
      else if (y % 4 === 0) img.set(x, y, C('L'))
      const joint = (band * 7 + v * 5) % 16
      if (x === joint && y % 4 !== 3) img.set(x, y, C('O'))
    }
  }
  img.set((v * 3 + 5) % 16, 1 + (v % 2) * 8, C('O'))
}

function tatami(img: Img, v: number) {
  img.fill(C('t'))
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((y + (x % 2)) % 2 === 0 && x % 2 === 0) img.set(x, y, C('T'))
  // heri (cloth border) — mats alternate orientation per variant
  const hor = v % 2 === 0
  for (let i = 0; i < 16; i++) {
    if (hor) {
      img.set(i, 0, C('G'))
      img.set(i, 15, C('G'))
    } else {
      img.set(0, i, C('G'))
      img.set(15, i, C('G'))
    }
  }
  for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) if ((hor ? y : x) % 3 === 0) img.set(x, y, C('T'))
}

function snow(img: Img, v: number) {
  img.fill(C('p'))
  speckle(img, v, ['w', 'w', 'm'], 9, 4)
  const rnd = rng(v * 13 + 7)
  const x = 2 + Math.floor(rnd() * 11)
  const y = 3 + Math.floor(rnd() * 10)
  img.set(x, y, C('P'))
  img.set(x + 1, y, C('P'))
  img.set(x + 2, y, C('P'))
  img.set(x + 1, y - 1, C('w'))
}

// ---------------------------------------------------------------------------
// Water

function waterBase(img: Img, v: number, f: number, deep: boolean) {
  const ox = Math.floor(v / 3) * 16
  const oy = (v % 3) * 16
  img.fill(C(deep ? 'B' : 'b'))
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const wx = ox + x
      const wy = oy + y
      const r6 = wy % 6
      if (r6 === 1 && (wx + 3 * f + wy * 5) % 12 < 3) img.set(x, y, C(deep ? 'b' : 'c'))
      else if (r6 === 4 && (wx - 3 * f + wy * 7 + 600) % 12 < 2) img.set(x, y, C(deep ? 'b' : 'c'))
      else if (r6 === 2 && (wx + 3 * f + wy * 5) % 12 < 3) img.set(x, y, C(deep ? 'N' : 'B'))
      // rare sparkle
      if (!deep && hash2(wx, wy, f) % 97 === 0) img.set(x, y, C('C'))
    }
}

function shore(img: Img, v: number, f: number, nb: number) {
  if (nb === 0xff) return
  const g = new Img(16, 16)
  grassBase(g, v % 8)
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const d = edgeDist(x, y, nb, 6, 2.6)
      if (d < 2) img.set(x, y, g.get(x, y))
      else if (d < 3) img.set(x, y, C('G'))
      else if (d < 4) img.set(x, y, C('O'))
      else if (d < 5) {
        if ((x + y + f) % 4 !== 0) img.set(x, y, C('C'))
      } else if (d < 6 && (x * 2 + y + f * 3) % 7 === 0) img.set(x, y, C('c'))
    }
}

function lily(img: Img) {
  const pad = ['..gggg..', '.grrrrg.', 'grRrrrrg', 'grrr.rrg', 'grrrrrrg', '.grrrrg.', '..gggg..']
  img.map(pad, 5, 5)
  img.map(['.h.', 'hwh', '.h.'], 9, 4)
}

// ---------------------------------------------------------------------------
// Walls / roofs

function roof(img: Img, nb: number, edge: boolean, red: boolean) {
  const base = red ? 'v' : 'd'
  const hi = red ? 'e' : 's'
  const lo = red ? 'V' : 'N'
  const dk = red ? 'n' : 'n'
  img.fill(C(base))
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const cx = x % 4
      if (cx === 0) img.set(x, y, C(lo))
      else if (cx === 1) img.set(x, y, C(hi))
      if (y % 5 === 4) img.set(x, y, C(cx === 0 ? dk : lo))
    }
  if (!has(nb, N)) {
    // ridge cap
    for (let x = 0; x < 16; x++) {
      img.set(x, 0, C(dk))
      img.set(x, 1, C(red ? 'V' : 'S'))
      img.set(x, 2, C(x % 4 === 1 ? hi : lo))
      img.set(x, 3, C(dk))
    }
  }
  if (!has(nb, W))
    for (let y = 0; y < 16; y++) {
      img.set(0, y, C(dk))
      img.set(1, y, C(hi))
      img.set(2, y, C(lo))
    }
  if (!has(nb, E))
    for (let y = 0; y < 16; y++) {
      img.set(15, y, C(dk))
      img.set(14, y, C(lo))
      img.set(13, y, C(base))
    }
  if (edge) {
    // round tile ends, eave board, and the shadow cast under the eave
    for (let x = 0; x < 16; x++) {
      const cx = x % 4
      img.set(x, 9, C(cx === 0 ? dk : lo))
      img.set(x, 10, C(cx === 0 ? dk : cx === 1 ? 'm' : hi))
      img.set(x, 11, C(cx === 0 ? dk : hi))
      img.set(x, 12, C(cx === 0 || cx === 3 ? dk : lo))
      img.set(x, 13, C('O'))
      img.set(x, 14, C(x % 3 === 0 ? 'k' : 'n'))
      img.set(x, 15, C('n'))
    }
    if (!has(nb, W)) for (let y = 9; y < 16; y++) img.set(0, y, C('n'))
    if (!has(nb, E)) for (let y = 9; y < 16; y++) img.set(15, y, C('n'))
  }
}

function wallBase(img: Img, nb: number, kosh = true) {
  img.fill(C('p'))
  for (let x = 0; x < 16; x++) {
    img.set(x, 0, C('O'))
    img.set(x, 1, C('P'))
    img.set(x, 8, C('o'))
    img.set(x, 9, C('O'))
  }
  // plaster texture
  for (let y = 2; y < 8; y++) for (let x = 0; x < 16; x++) if ((x * 7 + y * 3) % 23 === 0) img.set(x, y, C('P'))
  if (kosh)
    for (let y = 10; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const c = x % 3 === 0 ? 'O' : x % 3 === 1 ? 'o' : 'O'
        img.set(x, y, C(y === 10 ? 'O' : c === 'o' && y === 11 ? 'L' : c))
        if (x % 3 === 2) img.set(x, y, C('n'))
      }
  if (!has(nb, W))
    for (let y = 0; y < 16; y++) {
      img.set(0, y, C('O'))
      img.set(1, y, C('o'))
      img.set(2, y, C('O'))
    }
  if (!has(nb, E))
    for (let y = 0; y < 16; y++) {
      img.set(13, y, C('O'))
      img.set(14, y, C('o'))
      img.set(15, y, C('O'))
    }
}

function wallWindow(img: Img, nb: number) {
  wallBase(img, nb)
  // lattice (koshi) window with warm lamplight
  for (let y = 2; y < 8; y++)
    for (let x = 4; x < 12; x++) {
      const inner = y > 2 && y < 7 && x > 4 && x < 11
      if (!inner) img.set(x, y, C('O'))
      else img.set(x, y, x % 2 ? C('O') : C(y < 5 ? 'l' : 'y'))
    }
  img.set(5, 3, C('w'))
}

function door(img: Img, nb: number) {
  wallBase(img, nb, false)
  for (let y = 1; y < 16; y++)
    for (let x = 2; x < 14; x++) {
      const frame = x === 2 || x === 13 || y === 1 || x === 7 || x === 8
      if (frame) img.set(x, y, C(x === 7 ? 'o' : 'O'))
      else if (y >= 12) img.set(x, y, C(y === 12 ? 'O' : (x + y) % 3 ? 'o' : 'O'))
      else img.set(x, y, C(y % 4 === 0 || x % 3 === 1 ? 'P' : 'p'))
    }
  img.set(6, 8, C('y'))
  img.set(9, 8, C('y'))
}

function noren(img: Img, nb: number, f: number) {
  wallBase(img, nb, false)
  for (let y = 1; y < 16; y++) for (let x = 2; x < 14; x++) img.set(x, y, C(y < 2 ? 'O' : 'n'))
  // warm interior glow
  for (let x = 4; x < 12; x++) img.set(x, 14, C('O'))
  for (let x = 5; x < 11; x++) img.set(x, 15, C('o'))
  // curtain in three flaps with a white crest
  for (let y = 2; y < 10; y++)
    for (let x = 2; x < 14; x++) {
      if (x === 6 || x === 10) {
        if (y > 4 + ((f + x) % 2)) continue
      }
      img.set(x, y, C(y === 2 ? 'd' : x % 4 === 1 ? 'd' : 'N'))
    }
  img.map(['.pp.', 'p..p', 'p..p', '.pp.'], 6, 4)
  img.set(7, 5, C('p'))
  img.set(8, 6, C('p'))
}

function awning(img: Img, nb: number) {
  wallBase(img, nb, false)
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (y > 9) img.set(x, y, C(y === 10 ? 'n' : 'O'))
  for (let y = 0; y < 9; y++)
    for (let x = 0; x < 16; x++) {
      const stripe = Math.floor((x + (y >> 1)) / 3) % 2
      img.set(x, y, C(stripe ? 'v' : 'p'))
      if (y === 0) img.set(x, y, C('V'))
    }
  // scalloped edge
  for (let x = 0; x < 16; x++) {
    const s = x % 4
    const c = Math.floor(x / 3) % 2 ? 'V' : 'P'
    img.set(x, 9, C(c))
    if (s === 1 || s === 2) img.set(x, 10, C(c))
    if (s === 0 || s === 3) img.set(x, 10, C('n'))
    if (s === 1 || s === 2) img.set(x, 11, C('k'))
  }
  if (!has(nb, W)) for (let y = 0; y < 16; y++) img.set(0, y, y < 11 ? C('V') : C('O'))
  if (!has(nb, E)) for (let y = 0; y < 16; y++) img.set(15, y, y < 11 ? C('V') : C('O'))
}

function stoneWall(img: Img, v: number, nb: number) {
  img.fill(C('s'))
  const rnd = rng(v * 31 + 17)
  // irregular stones
  let y = 0
  let row = 0
  while (y < 16) {
    const h = 3 + (row % 2)
    let x = -((row * 3 + v) % 5)
    while (x < 16) {
      const w = 4 + Math.floor(rnd() * 4)
      for (let i = 0; i < w; i++) {
        img.set(x + i, y + h - 1, C('S'))
        img.set(x + i, y, C('m'))
      }
      for (let j = 0; j < h; j++) img.set(x + w - 1, y + j, C('S'))
      img.set(x, y, C('p'))
      x += w
    }
    y += h
    row++
  }
  if (!has(nb, N)) {
    for (let x = 0; x < 16; x++) {
      img.set(x, 0, C('g'))
      img.set(x, 1, C(x % 3 ? 'r' : 'g'))
      img.set(x, 2, C('S'))
    }
  }
  if (!has(nb, S)) for (let x = 0; x < 16; x++) img.set(x, 15, C('n'))
}

function castleWall(img: Img, v: number, nb: number) {
  img.fill(C('m'))
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const row = Math.floor(y / 4)
      const xx = (x + (row % 2 ? 4 : 0) + v * 2) % 8
      if (y % 4 === 3) img.set(x, y, C('s'))
      else if (xx === 7) img.set(x, y, C('s'))
      else if (y % 4 === 0 || xx === 0) img.set(x, y, C('p'))
    }
  speckle(img, v, ['s'], 3, 2)
  if (!has(nb, N)) {
    // crenellations
    for (let x = 0; x < 16; x++) {
      const merlon = x % 8 < 5
      for (let y = 0; y < 4; y++) img.set(x, y, merlon ? C(y === 0 ? 'p' : x % 8 === 4 ? 's' : 'm') : C(y === 3 ? 'n' : 'S'))
      img.set(x, 4, C('S'))
    }
  }
  if (!has(nb, S)) for (let x = 0; x < 16; x++) img.set(x, 15, C('S'))
}

function towerWall(img: Img, v: number, f: number, nb: number) {
  img.fill(C('d'))
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const row = Math.floor(y / 4)
      const xx = (x + (row % 2 ? 4 : 0)) % 8
      if (y % 4 === 3 || xx === 7) img.set(x, y, C('n'))
      else if (y % 4 === 0 || xx === 0) img.set(x, y, C('s'))
    }
  if (v === 1) {
    // a glowing rune that pulses
    const col = ['u', 'U', 'l', 'U'][f]
    img.map(['.x.', 'xxx', '.x.', 'x.x'].map((r) => r.replace(/x/g, col === 'l' ? 'l' : col)), 6, 5)
  }
  if (!has(nb, N))
    for (let x = 0; x < 16; x++) {
      img.set(x, 0, C('N'))
      img.set(x, 1, C('U'))
      img.set(x, 2, C('u'))
      img.set(x, 3, C('n'))
    }
}

// ---------------------------------------------------------------------------
// Cliffs

function cliff(img: Img, v: number, nb: number) {
  img.fill(C('o'))
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const band = (y + (x >> 2) + v) % 5
      if (band === 0) img.set(x, y, C('O'))
      else if (band === 1) img.set(x, y, C('L'))
      if ((x * 5 + y * 3 + v) % 17 === 0) img.set(x, y, C('O'))
    }
  // vertical cracks
  for (let y = 0; y < 16; y++) {
    const cx = (v * 5 + 3 + (y >> 2)) % 16
    img.set(cx, y, C('O'))
  }
  if (!has(nb, N)) {
    for (let x = 0; x < 16; x++) {
      img.set(x, 0, C('r'))
      img.set(x, 1, C(WOB[x] ? 'r' : 'g'))
      img.set(x, 2, C(WOB[x] ? 'g' : 'G'))
      img.set(x, 3, C('O'))
    }
  }
  if (!has(nb, S))
    for (let x = 0; x < 16; x++) {
      img.set(x, 15, C('n'))
      img.set(x, 14, C((x + v) % 3 ? 'O' : 'n'))
    }
}

function cliffTop(img: Img, v: number, nb: number) {
  grassBase(img, v)
  if (!has(nb, S)) {
    for (let x = 0; x < 16; x++) {
      const w = WOB[x]
      img.set(x, 12 + w, C('R'))
      for (let y = 13 + w; y < 16; y++) img.set(x, y, C(y === 13 + w ? 'L' : 'o'))
      img.set(x, 15, C('O'))
    }
  }
  if (!has(nb, W)) for (let y = 0; y < 16; y++) img.set(0, y, C('G'))
  if (!has(nb, E)) for (let y = 0; y < 16; y++) img.set(15, y, C('G'))
}

// ---------------------------------------------------------------------------
// Bridges

function bridge(img: Img, v: number, f: number, nb: number, horizontal: boolean) {
  waterBase(img, v, f, false)
  const t = new Img(16, 16)
  for (let a = 0; a < 16; a++)
    for (let b = 2; b < 14; b++) {
      // planks run across the direction of travel
      const plank = Math.floor(a / 3)
      const edge = a % 3 === 2
      const c = edge ? 'O' : b === 2 ? 'L' : plank % 2 ? 'o' : 'L'
      if (horizontal) t.set(a, b, C(edge ? 'O' : c === 'L' && b > 3 ? 'o' : c))
      else t.set(b, a, C(edge ? 'O' : c === 'L' && b > 3 ? 'o' : c))
    }
  // rails
  for (let a = 0; a < 16; a++) {
    if (horizontal) {
      t.set(a, 1, C('O'))
      t.set(a, 2, C('v'))
      t.set(a, 13, C('v'))
      t.set(a, 14, C('V'))
      t.set(a, 15, C('n'))
    } else {
      t.set(1, a, C('v'))
      t.set(2, a, C('V'))
      t.set(13, a, C('v'))
      t.set(14, a, C('V'))
    }
  }
  // posts where the rail ends / every tile
  const posts = horizontal ? [0, 8] : [0, 8]
  for (const p of posts) {
    if (horizontal) {
      t.rect(p, 0, 2, 3, C('V'))
      t.set(p, 0, C('y'))
      t.rect(p, 13, 2, 3, C('V'))
      t.set(p, 13, C('y'))
    } else {
      t.rect(1, p, 2, 2, C('y'))
      t.rect(13, p, 2, 2, C('y'))
    }
  }
  void nb
  img.blit(t)
}

function steppingStones(img: Img, v: number, f: number, nb: number) {
  waterBase(img, v, f, false)
  shore(img, v, f, nb)
  const st = ['.mmm.', 'mpmss', 'mmssS', '.sSS.']
  img.map(['.CCCCC.'], 1, 8)
  img.map(st, 2, 5)
  img.map(['.CCCC.'], 8, 13)
  img.map(['.mms.', 'mmssS', '.SSS.'], 9, 11)
}

// ---------------------------------------------------------------------------
// Props (palette maps) and animated overlays

function prop(img: Img, id: string, v: number, f: number, nb: number) {
  const def = PROPS[id]
  if (!def) return
  const rows = def.frames ? def.frames[f % def.frames.length] : def.rows
  let p = fromMap(rows)
  if (def.shade) p = autoShade(p, def.shade)
  p = outline(p)
  if (def.shadow) castShadow(img, def.shadow[0], def.shadow[1], def.shadow[2], def.shadow[3])
  img.blit(p)
  void v
  void nb
}

function torii(img: Img, nb: number) {
  const w = !has(nb, W)
  const e = !has(nb, E)
  const t = new Img(16, 16)
  // kasagi (black top beam, upturned at the ends) & red shimaki below
  const x0 = w ? 0 : 0
  const x1 = e ? 15 : 15
  for (let x = x0; x <= x1; x++) {
    t.set(x, 2, C('n'))
    t.set(x, 3, C('v'))
    t.set(x, 4, C('V'))
    t.set(x, 7, C('v'))
    t.set(x, 8, C('V'))
  }
  if (w) {
    t.set(0, 1, C('n'))
    t.set(0, 2, C('n'))
    t.set(0, 7, null)
    t.set(0, 8, null)
  }
  if (e) {
    t.set(15, 1, C('n'))
    t.set(15, 2, C('n'))
    t.set(15, 7, null)
    t.set(15, 8, null)
  }
  const pillar = (px: number) => {
    for (let y = 3; y < 15; y++) {
      t.set(px, y, C(y >= 13 ? 'n' : 'e'))
      t.set(px + 1, y, C(y >= 13 ? 'n' : 'v'))
      t.set(px + 2, y, C(y >= 13 ? 'n' : 'V'))
    }
  }
  if (w && e) {
    pillar(2)
    pillar(11)
    // gakuzuka plaque
    t.rect(7, 4, 2, 3, C('n'))
    t.set(7, 5, C('y'))
  } else if (w) pillar(10)
  else if (e) pillar(3)
  else {
    t.rect(7, 4, 2, 3, C('n'))
    t.set(7, 5, C('y'))
  }
  const o = outline(t)
  if (w && e) {
    castShadow(img, 3.5, 15, 3, 1.2)
    castShadow(img, 12.5, 15, 3, 1.2)
  } else if (w) castShadow(img, 11.5, 15, 3, 1.2)
  else if (e) castShadow(img, 4.5, 15, 3, 1.2)
  img.blit(o)
}

function fence(img: Img, nb: number) {
  const t = new Img(16, 16)
  const hN = has(nb, N)
  const hS = has(nb, S)
  const hE = has(nb, E)
  const hW = has(nb, W)
  const vertical = (hN || hS) && !hE && !hW
  if (vertical) {
    for (let y = hN ? 0 : 4; y < (hS ? 16 : 14); y++) {
      t.set(5, y, C('L'))
      t.set(6, y, C('o'))
      t.set(9, y, C('L'))
      t.set(10, y, C('o'))
    }
    t.rect(6, 3, 4, 12, null)
    for (let y = 3; y < 14; y++) {
      t.set(7, y, C('L'))
      t.set(8, y, C('O'))
    }
    t.set(7, 3, C('a'))
  } else {
    for (let x = hW ? 0 : 6; x < (hE ? 16 : 10); x++) {
      t.set(x, 6, C('L'))
      t.set(x, 7, C('o'))
      t.set(x, 10, C('L'))
      t.set(x, 11, C('o'))
    }
    for (let y = 3; y < 15; y++) {
      t.set(7, y, C('L'))
      t.set(8, y, C('O'))
    }
    t.set(7, 3, C('a'))
    t.set(8, 3, C('L'))
  }
  castShadow(img, 8, 14.5, 3, 1)
  img.blit(outline(t))
}

function carpet(img: Img, nb: number) {
  img.fill(C('V'))
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x + y) % 4 === 0 && (x - y + 16) % 8 === 0) img.set(x, y, C('v'))
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const d = edgeDist(x, y, nb, 1, 0)
      if (d < 1) img.set(x, y, C('O'))
      else if (d < 2) img.set(x, y, C('y'))
      else if (d < 3) img.set(x, y, C('e'))
    }
}

function sakuraPetals(img: Img, f: number, v: number) {
  const pts = [
    [3, 10],
    [11, 4],
    [7, 13],
  ]
  pts.forEach(([x, y], i) => {
    const ff = (f + i * 2 + v) % 6
    const px = x + [0, 1, 1, 0, -1, -1][ff]
    const py = (y + ff * 2) % 16
    if (py > 11) img.set(px, py, C(ff % 2 ? 'h' : 'p'))
  })
}

function gateBarrier(img: Img, f: number) {
  for (let y = 1; y < 15; y++)
    for (let x = 2; x < 14; x++) {
      const k = (x + y * 2 + f * 3) % 8
      if (k === 0) img.set(x, y, C('U'))
      else if (k === 1 && (x + f) % 2 === 0) img.set(x, y, C('w'))
    }
  // bright seam
  for (let y = 1; y < 15; y++) if ((y + f) % 3) img.set(7 + ((y + f) % 2), y, C('l'))
}

function portalSwirl(img: Img, f: number) {
  const cx = 8
  const cy = 9
  for (let y = 3; y < 16; y++)
    for (let x = 3; x < 13; x++) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      const r = Math.hypot(dx / 5, dy / 6)
      if (r > 1) continue
      const a = Math.atan2(dy, dx) + r * 5 - f * (Math.PI / 2)
      const band = Math.floor(((a / (2 * Math.PI)) * 3 + 30) % 3)
      img.set(x, y, C(r < 0.25 ? 'w' : band === 0 ? 'U' : band === 1 ? 'u' : 'n'))
    }
}

function warpCircle(img: Img, f: number) {
  const glow = ['U', 'l', 'U', 'u'][f]
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const r = Math.hypot(x + 0.5 - 8, (y + 0.5 - 8) * 1.15)
      if (r > 6.2 && r < 7.3) img.set(x, y, C(glow))
      else if (r > 3.3 && r < 4.3) img.set(x, y, C('u'))
      else if (r <= 1.2) img.set(x, y, C(f % 2 ? 'w' : 'l'))
    }
  // rune ticks on the ring, rotating
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + f * 0.26
    img.set(Math.round(8 + Math.cos(a) * 5.3 - 0.5), Math.round(8 + Math.sin(a) * 4.6 - 0.5), C('w'))
  }
}

// ---------------------------------------------------------------------------

export interface RenderArgs {
  variant?: number
  frame?: number
  nb?: number
  under?: TileId
}

export function renderTile(id: TileId, a: RenderArgs = {}): Img {
  const v = a.variant ?? 0
  const f = a.frame ?? 0
  const nb = a.nb ?? 0xff
  const img = new Img(16, 16)
  const sp = specOf(id)
  const under = a.under ?? sp.under
  if (under && under !== id) img.blit(renderTile(under, { variant: v % (specOf(under).variants ?? 1), frame: 0, nb: 0xff }))
  switch (id) {
    case 'grass':
      grassBase(img, v)
      break
    case 'grass-dark':
      grassBase(img, v, 'g', 'G', 'r')
      break
    case 'flowers':
      flowers(img, v, f)
      break
    case 'tall-grass':
      tallGrass(img, v, f, nb)
      break
    case 'path':
      softGround(img, v, nb, 'L', ['a', 'o'], 'o', 'a')
      break
    case 'sand':
      softGround(img, v, nb, 'a', ['L', 'p'], 'L', 'p')
      break
    case 'dirt':
      softGround(img, v, nb, 'o', ['O', 'L'], 'O', 'L')
      break
    case 'stone-floor':
      stoneFloor(img, v)
      break
    case 'wood-floor':
      woodFloor(img, v)
      break
    case 'tatami':
      tatami(img, v)
      break
    case 'snow':
      snow(img, v)
      break
    case 'water':
      waterBase(img, v, f, false)
      shore(img, v, f, nb)
      break
    case 'water-deep':
      waterBase(img, v, f, true)
      shore(img, v, f, nb)
      break
    case 'lily':
      waterBase(img, v, f, false)
      shore(img, v, f, nb)
      lily(img)
      break
    case 'bridge-h':
      bridge(img, v, f, nb, true)
      break
    case 'bridge-v':
      bridge(img, v, f, nb, false)
      break
    case 'stepping-stone':
      steppingStones(img, v, f, nb)
      break
    case 'cliff':
      cliff(img, v, nb)
      break
    case 'cliff-top':
      cliffTop(img, v, nb)
      break
    case 'wall':
      wallBase(img, nb)
      break
    case 'wall-window':
      wallWindow(img, nb)
      break
    case 'door':
      door(img, nb)
      break
    case 'noren':
      noren(img, nb, f)
      break
    case 'shop-awning':
      awning(img, nb)
      break
    case 'roof':
      roof(img, nb, false, false)
      break
    case 'roof-edge':
      roof(img, nb, true, false)
      break
    case 'roof-red':
      roof(img, nb, false, true)
      break
    case 'roof-red-edge':
      roof(img, nb, true, true)
      break
    case 'fence':
      fence(img, nb)
      break
    case 'stone-wall':
      stoneWall(img, v, nb)
      break
    case 'castle-wall':
      castleWall(img, v, nb)
      break
    case 'tower-wall':
      towerWall(img, v, f, nb)
      break
    case 'torii':
      torii(img, nb)
      break
    case 'carpet':
      carpet(img, nb)
      break
    case 'sakura':
      prop(img, id, v, f, nb)
      sakuraPetals(img, f, v)
      break
    case 'gate-closed':
      prop(img, id, v, f, nb)
      gateBarrier(img, f)
      break
    case 'portal':
      prop(img, id, v, f, nb)
      portalSwirl(img, f)
      break
    case 'warp-circle':
      warpCircle(img, f)
      break
    default:
      prop(img, id, v, f, nb)
  }
  return img
}

/** Every animation frame count (≥1) for a tile. */
export function frameCount(id: TileId): number {
  return specOf(id).frames ?? 1
}


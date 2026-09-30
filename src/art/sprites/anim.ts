/**
 * Procedural in-betweens for the 16×16 walking characters.
 *
 * The characters are authored as a single pose per direction (plus an
 * optional second step). From that pose we derive a proper walk cycle
 * (contact → passing → contact → passing) with a head bob and arm swing,
 * a faster leaning run, a breathing idle, a blink, and Fude's floating
 * tail swirl. Everything here works on the raw character maps (arrays of
 * strings, before colouring), so it is pure and unit-testable.
 */

export type Anim = 'idle' | 'walk' | 'run'
export const ANIMS: readonly Anim[] = ['idle', 'walk', 'run']

/** Frames per animation for walking characters (Fude floats: see FLOAT_FRAMES). */
export const ANIM_FRAMES: Record<Anim, number> = { idle: 2, walk: 4, run: 4 }
/** Fude's float cycle (idle/walk/run all use it). */
export const FLOAT_FRAMES = 6

type Grid = string[][]

const SKIN = new Set(['f', 'F'])
const STAFF = new Set(['o', 'O', 'm'])

export function toGrid(rows: readonly string[]): Grid {
  return rows.map((r) => r.split(''))
}

export function fromGrid(g: Grid): string[] {
  return g.map((r) => r.join(''))
}

const at = (g: Grid, x: number, y: number) => (y >= 0 && y < g.length && x >= 0 && x < g[y].length ? g[y][x] : '.')

/**
 * Last row of the head (chin). Uses the blush/eye rows of the front view,
 * which every humanoid has; `fallback` when none are found.
 */
export function headEnd(front: readonly string[], fallback = 8): number {
  let h = -1
  for (let y = 0; y < Math.min(12, front.length); y++) if (front[y].includes('h')) h = y
  if (h >= 0) return h
  for (let y = 0; y < Math.min(11, front.length); y++) if (front[y].includes('k')) h = y + 1
  return h >= 0 ? Math.min(h, 10) : fallback
}

/**
 * Head bob: rows 0..head move down one pixel, sinking the head into the
 * collar (head pixels win; torso pixels show where the head row is empty).
 */
export function bobHead(g: Grid, head: number): Grid {
  const o = g.map((r) => r.slice())
  const w = g[0].length
  for (let x = 0; x < w; x++) {
    const c = g[head][x]
    if (c !== '.') o[head + 1][x] = c
  }
  for (let y = head; y >= 1; y--) for (let x = 0; x < w; x++) o[y][x] = g[y - 1][x]
  for (let x = 0; x < w; x++) o[0][x] = '.'
  return o
}

/** Lean: head rows shift one pixel toward +x (side view; left is mirrored later). */
export function leanHead(g: Grid, head: number, dx = 1): Grid {
  const o = g.map((r) => r.slice())
  const w = g[0].length
  for (let y = 0; y <= head; y++)
    for (let x = 0; x < w; x++) {
      const sx = x - dx
      o[y][x] = sx >= 0 && sx < w ? g[y][sx] : '.'
    }
  return o
}

/** Union of the leg rows with their mirror: both feet planted (standing / passing). */
export function standLegs(g: Grid, rows: [number, number], span: [number, number]): Grid {
  const o = g.map((r) => r.slice())
  for (let y = rows[0]; y <= rows[1]; y++)
    for (let x = span[0]; x <= span[1]; x++) {
      if (o[y][x] !== '.') continue
      const m = g[y][span[0] + span[1] - x]
      if (m !== '.') o[y][x] = m
    }
  return o
}

/** Mirror the leg rows inside the span (the other foot forward). */
export function swapLegs(g: Grid, rows: [number, number], span: [number, number]): Grid {
  const o = g.map((r) => r.slice())
  for (let y = rows[0]; y <= rows[1]; y++) for (let x = span[0]; x <= span[1]; x++) o[y][x] = g[y][span[0] + span[1] - x]
  return o
}

/** Side-view passing pose: each leg row gathered under the body (≤3 px wide). */
export function gatherLegs(g: Grid, rows: [number, number], span: [number, number]): Grid {
  const o = g.map((r) => r.slice())
  for (let y = rows[0]; y <= rows[1]; y++) {
    const xs: number[] = []
    for (let x = span[0]; x <= span[1]; x++) if (g[y][x] !== '.') xs.push(x)
    if (!xs.length) continue
    const col = g[y][xs[xs.length - 1]]
    for (let x = span[0]; x <= span[1]; x++) o[y][x] = '.'
    const cx = Math.round((xs[0] + xs[xs.length - 1]) / 2)
    const n = Math.min(3, xs.length)
    for (let i = 0; i < n; i++) o[y][cx - 1 + i] = col
  }
  return o
}

interface Hand {
  x: number
  y0: number
  y1: number
}

/**
 * Hands: runs of skin pixels in the torso rows on the silhouette's outer
 * edge (front/back views). Hands gripping a staff or spear are skipped.
 */
export function findHands(g: Grid, rows: [number, number]): { left?: Hand; right?: Hand } {
  const w = g[0].length
  const res: { left?: Hand; right?: Hand } = {}
  for (const side of ['left', 'right'] as const) {
    const outer = side === 'left' ? -1 : 1
    for (let y = rows[0]; y <= rows[1] && !res[side]; y++) {
      const xs = side === 'left' ? [...Array(w).keys()] : [...Array(w).keys()].reverse()
      const x = xs.find((x) => g[y][x] !== '.')
      if (x === undefined || !SKIN.has(g[y][x])) continue
      if ((side === 'left' ? x >= w / 2 : x < w / 2) || at(g, x + outer, y) !== '.') continue
      if (STAFF.has(at(g, x + outer * 2, y)) && at(g, x + outer * 2, y - 1) !== '.') continue
      let y1 = y
      while (y1 + 1 <= rows[1] && SKIN.has(at(g, x, y1 + 1))) y1++
      res[side] = { x, y0: y, y1 }
    }
  }
  return res
}

/** Move a hand one pixel up (dy −1) or down (+1), keeping the sleeve attached. */
export function moveHand(g: Grid, h: Hand, dy: -1 | 1, limit: number): Grid {
  const o = g.map((r) => r.slice())
  const above = at(g, h.x, h.y0 - 1)
  if (dy < 0) {
    if (above === '.' || h.y0 - 1 < 0) return o
    for (let y = h.y0; y <= h.y1; y++) o[y - 1][h.x] = g[y][h.x]
    o[h.y1][h.x] = above
  } else {
    if (h.y1 + 1 > limit) return o
    for (let y = h.y1; y >= h.y0; y--) o[y + 1][h.x] = g[y][h.x]
    o[h.y0][h.x] = above === '.' ? '.' : above
  }
  return o
}

/**
 * Side view hand: a skin pixel in the torso rows (not on a staff). Swings
 * forward/back by one pixel.
 */
export function swingSideHand(g: Grid, rows: [number, number], dx: -1 | 1): Grid {
  const o = g.map((r) => r.slice())
  const w = g[0].length
  for (let y = rows[0]; y <= rows[1]; y++)
    for (let x = 1; x < w - 1; x++) {
      if (!SKIN.has(g[y][x])) continue
      if (STAFF.has(at(g, x + 1, y)) || STAFF.has(at(g, x - 1, y))) continue
      const nx = x + dx
      const dest = g[y][nx]
      const behind = g[y][x - dx]
      if (SKIN.has(dest)) continue
      o[y][nx] = g[y][x]
      o[y][x] = dest !== '.' ? dest : behind !== '.' ? behind : '.'
      return o
    }
  return o
}

/** Close the eyes: the top pixel of each 2-tall ink eye takes the lid colour above it. */
export function blinkEyes(g: Grid, head: number): Grid {
  const o = g.map((r) => r.slice())
  const w = g[0].length
  for (let y = 1; y < head; y++)
    for (let x = 0; x < w; x++) {
      if (g[y][x] !== 'k' || at(g, x, y + 1) !== 'k' || at(g, x, y - 1) === 'k') continue
      const lid = at(g, x, y - 1)
      o[y][x] = lid !== '.' ? lid : at(g, x + 1, y)
    }
  return o
}

/** Shift whole rows y0..y1 horizontally by dx (Fude's tail sway). */
export function swayRows(g: Grid, y: number, dx: number): Grid {
  if (!dx) return g
  const o = g.map((r) => r.slice())
  const w = g[0].length
  for (let x = 0; x < w; x++) {
    const sx = x - dx
    o[y][x] = sx >= 0 && sx < w ? g[y][sx] : '.'
  }
  return o
}

export function shiftY(g: Grid, dy: number): Grid {
  if (!dy) return g
  const h = g.length
  const w = g[0].length
  const o: Grid = Array.from({ length: h }, () => new Array(w).fill('.'))
  for (let y = 0; y < h; y++) {
    const ny = y + dy
    if (ny >= 0 && ny < h) o[ny] = g[y].slice()
  }
  return o
}

/** Fude float cycle: body bob (sine, ±1px) and a lagging tail swirl. */
export function floatFrame(g: Grid, frame: number, tailRows: number[]): { grid: Grid; dy: number } {
  const p = ((frame % FLOAT_FRAMES) / FLOAT_FRAMES) * Math.PI * 2
  let o = g
  tailRows.forEach((y, i) => {
    const amp = 0.55 + i * 0.5
    o = swayRows(o, y, Math.round(Math.sin(p - (i + 1) * 0.9) * amp))
  })
  // flame flicker on the brush tip: alternate the vermilion wisp
  if (frame % 3 === 1) o = o.map((r) => r.map((c) => (c === 'v' ? 'e' : c)))
  return { grid: o, dy: -Math.round(Math.sin(p) * 1) }
}

/** Milliseconds per frame. Walk/run in the overworld are driven by distance instead. */
export const FRAME_MS: Record<Anim, number> = { idle: 0, walk: 150, run: 95 }
export const FLOAT_MS = 130
/** Idle: breathe in (stand) / out (head dips) — a slow, uneven loop reads as alive. */
const IDLE_IN = 900
const IDLE_OUT = 600
const BLINK_EVERY = 3400
const BLINK_MS = 130

/**
 * Frame (and blink) of a character animation at time `t` (ms). `seed`
 * desynchronises several characters on screen. Pure.
 */
export function animAt(anim: Anim, t: number, opts: { float?: boolean; seed?: number } = {}): { frame: number; blink: boolean } {
  const s = (opts.seed ?? 0) * 977
  const tt = t + s
  const bt = (tt + (opts.seed ?? 0) * 1311) % (BLINK_EVERY + ((opts.seed ?? 0) % 3) * 700)
  const blink = bt < BLINK_MS || (bt > BLINK_MS * 2 && bt < BLINK_MS * 3 && (opts.seed ?? 0) % 2 === 1)
  if (opts.float) return { frame: Math.floor(tt / (anim === 'run' ? FLOAT_MS * 0.7 : FLOAT_MS)) % FLOAT_FRAMES, blink }
  if (anim === 'idle') return { frame: tt % (IDLE_IN + IDLE_OUT) < IDLE_IN ? 0 : 1, blink }
  return { frame: Math.floor(tt / FRAME_MS[anim]) % ANIM_FRAMES[anim], blink: false }
}

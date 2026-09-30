/**
 * Stroke evaluation engine for handwriting games.
 *
 * Reference strokes are SVG path `d` strings from KanjiVG (viewBox 0 0 109 109).
 * User strokes are point lists already mapped into the same 109×109 box (see
 * `toBox`). Each user stroke is compared to the expected reference stroke on:
 *   - shape      mean point distance after aligning centroids and size
 *   - direction  drawing a stroke backwards fails
 *   - position   centroid distance
 * and stroke order: if the stroke fails its own slot but would pass another
 * reference stroke, it is reported as "wrong order".
 */

export interface Pt {
  x: number
  y: number
}

export const BOX = 109
/** Points per resampled stroke. */
export const N = 32

// ─── SVG path parsing ─────────────────────────────────────────────────

const TOKEN = /[MmCcSsLlHhVvZzQqTt]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, steps: number, out: Pt[]) {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    const a = u * u * u
    const b = 3 * u * u * t
    const c = 3 * u * t * t
    const d = t * t * t
    out.push({ x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y })
  }
}

/**
 * Parse an SVG path `d` into a sampled polyline. Supports M, L, H, V, C, S,
 * Q, T and Z in absolute and relative forms (KanjiVG uses mostly M/c/C/s/S).
 */
export function parsePath(d: string, stepsPerCurve = 12): Pt[] {
  const tokens = d.match(TOKEN) ?? []
  const out: Pt[] = []
  let i = 0
  let cmd = ''
  let cur: Pt = { x: 0, y: 0 }
  let start: Pt = { x: 0, y: 0 }
  // Last control point for S/T reflection.
  let lastCtrl: Pt | null = null
  let lastCmd = ''
  const isCmd = (t: string | undefined) => t !== undefined && /^[A-Za-z]$/.test(t)
  const num = () => Number(tokens[i++])

  while (i < tokens.length) {
    if (isCmd(tokens[i])) cmd = tokens[i++]
    else if (!cmd) {
      i++
      continue
    }
    const rel = cmd === cmd.toLowerCase()
    const C = cmd.toUpperCase()
    const ox = rel ? cur.x : 0
    const oy = rel ? cur.y : 0
    // Ensure enough numeric args remain for the command.
    const need = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, Z: 0 }[C] ?? 0
    if (need > 0) {
      let ok = true
      for (let k = 0; k < need; k++) if (i + k >= tokens.length || isCmd(tokens[i + k])) ok = false
      if (!ok) break
    }
    switch (C) {
      case 'M': {
        cur = { x: ox + num(), y: oy + num() }
        start = cur
        out.push(cur)
        lastCtrl = null
        // Subsequent pairs are implicit line-tos.
        cmd = rel ? 'l' : 'L'
        break
      }
      case 'L': {
        cur = { x: ox + num(), y: oy + num() }
        out.push(cur)
        lastCtrl = null
        break
      }
      case 'H': {
        cur = { x: (rel ? cur.x : 0) + num(), y: cur.y }
        out.push(cur)
        lastCtrl = null
        break
      }
      case 'V': {
        cur = { x: cur.x, y: (rel ? cur.y : 0) + num() }
        out.push(cur)
        lastCtrl = null
        break
      }
      case 'C': {
        const p1 = { x: ox + num(), y: oy + num() }
        const p2 = { x: ox + num(), y: oy + num() }
        const p3 = { x: ox + num(), y: oy + num() }
        cubic(cur, p1, p2, p3, stepsPerCurve, out)
        lastCtrl = p2
        cur = p3
        break
      }
      case 'S': {
        const p1: Pt = lastCtrl && /[CcSs]/.test(lastCmd) ? { x: 2 * cur.x - lastCtrl.x, y: 2 * cur.y - lastCtrl.y } : cur
        const p2 = { x: ox + num(), y: oy + num() }
        const p3 = { x: ox + num(), y: oy + num() }
        cubic(cur, p1, p2, p3, stepsPerCurve, out)
        lastCtrl = p2
        cur = p3
        break
      }
      case 'Q': {
        const q = { x: ox + num(), y: oy + num() }
        const p3 = { x: ox + num(), y: oy + num() }
        const p1 = { x: cur.x + (2 / 3) * (q.x - cur.x), y: cur.y + (2 / 3) * (q.y - cur.y) }
        const p2 = { x: p3.x + (2 / 3) * (q.x - p3.x), y: p3.y + (2 / 3) * (q.y - p3.y) }
        cubic(cur, p1, p2, p3, stepsPerCurve, out)
        lastCtrl = q
        cur = p3
        break
      }
      case 'T': {
        const q: Pt = lastCtrl && /[QqTt]/.test(lastCmd) ? { x: 2 * cur.x - lastCtrl.x, y: 2 * cur.y - lastCtrl.y } : cur
        const p3 = { x: ox + num(), y: oy + num() }
        const p1 = { x: cur.x + (2 / 3) * (q.x - cur.x), y: cur.y + (2 / 3) * (q.y - cur.y) }
        const p2 = { x: p3.x + (2 / 3) * (q.x - p3.x), y: p3.y + (2 / 3) * (q.y - p3.y) }
        cubic(cur, p1, p2, p3, stepsPerCurve, out)
        lastCtrl = q
        cur = p3
        break
      }
      case 'Z': {
        cur = start
        out.push(cur)
        lastCtrl = null
        break
      }
      default:
        i++
    }
    lastCmd = cmd
  }
  return out
}

// ─── Geometry helpers ─────────────────────────────────────────────────

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

export function pathLength(pts: readonly Pt[]): number {
  let l = 0
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i])
  return l
}

/** Resample a polyline to `n` points equally spaced along its length. */
export function resample(pts: readonly Pt[], n = N): Pt[] {
  if (pts.length === 0) return Array.from({ length: n }, () => ({ x: BOX / 2, y: BOX / 2 }))
  const total = pathLength(pts)
  if (total === 0 || pts.length === 1) return Array.from({ length: n }, () => ({ ...pts[0] }))
  const step = total / (n - 1)
  const out: Pt[] = [{ ...pts[0] }]
  let acc = 0
  let prev = pts[0]
  let idx = 1
  while (idx < pts.length && out.length < n - 1) {
    const next = pts[idx]
    const seg = dist(prev, next)
    if (acc + seg >= step && seg > 0) {
      const t = (step - acc) / seg
      const p = { x: prev.x + t * (next.x - prev.x), y: prev.y + t * (next.y - prev.y) }
      out.push(p)
      prev = p
      acc = 0
    } else {
      acc += seg
      prev = next
      idx++
    }
  }
  while (out.length < n) out.push({ ...pts[pts.length - 1] })
  return out
}

/** Map points from a drawing surface of size w×h into the 109×109 box. */
export function toBox(pts: readonly Pt[], w: number, h: number): Pt[] {
  return pts.map((p) => ({ x: (p.x / w) * BOX, y: (p.y / h) * BOX }))
}

function centroid(pts: readonly Pt[]): Pt {
  let x = 0
  let y = 0
  for (const p of pts) {
    x += p.x
    y += p.y
  }
  return { x: x / pts.length, y: y / pts.length }
}

function diag(pts: readonly Pt[]): number {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of pts) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  return Math.hypot(maxX - minX, maxY - minY)
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

// ─── Reference cache ──────────────────────────────────────────────────

interface Ref {
  pts: Pt[]
  c: Pt
  size: number
  len: number
}

const refCache = new Map<string, Ref>()

function ref(d: string): Ref {
  let r = refCache.get(d)
  if (!r) {
    const raw = parsePath(d)
    const pts = resample(raw)
    r = { pts, c: centroid(pts), size: diag(pts), len: pathLength(pts) }
    refCache.set(d, r)
  }
  return r
}

/** Sampled polyline for a reference stroke (useful for rendering hints). */
export function referencePoints(d: string): Pt[] {
  return ref(d).pts
}

// ─── Comparison ───────────────────────────────────────────────────────

export type Verdict = 'good' | 'shape' | 'direction' | 'position' | 'order' | 'missing'

export interface StrokeMetrics {
  /** 0–1 (1 = identical). */
  shape: number
  direction: number
  position: number
  reversed: boolean
  /** 0–100 combined score. */
  score: number
  pass: boolean
  failure: Exclude<Verdict, 'good' | 'order' | 'missing'> | null
}

export interface EvalOptions {
  /** >1 loosens tolerances (e.g. recall mode without a guide). Default 1. */
  leniency?: number
}

/** Compare one user stroke (already in box coordinates) to one reference stroke. */
export function compareStroke(user: readonly Pt[], refD: string, opts: EvalOptions = {}): StrokeMetrics {
  const L = opts.leniency ?? 1
  const r = ref(refD)
  const u = resample(user)
  const cu = centroid(u)
  const uSize = diag(u)
  const scaleBase = Math.max(r.size, 18)

  // Position: centroid distance, tolerance grows a little with stroke size.
  const posTol = (12 + 0.12 * r.size) * L
  const posDist = dist(cu, r.c)
  const position = clamp01(1 - posDist / (posTol * 2))

  // Shape: align centroids and size, then mean point distance (forward and reversed).
  const k = uSize > 1 ? Math.min(3, Math.max(1 / 3, Math.max(r.size, 4) / uSize)) : 1
  const aligned = u.map((p) => ({ x: (p.x - cu.x) * k, y: (p.y - cu.y) * k }))
  const rr = r.pts.map((p) => ({ x: p.x - r.c.x, y: p.y - r.c.y }))
  let fwd = 0
  let rev = 0
  for (let i = 0; i < N; i++) {
    fwd += dist(aligned[i], rr[i])
    rev += dist(aligned[i], rr[N - 1 - i])
  }
  fwd /= N
  rev /= N
  const shapeRatio = fwd / scaleBase
  const shapeTol = 0.33 * L
  // Size mismatch also hurts shape (a tiny flick for a long sweep is wrong).
  const sizeRatio = r.size < 8 ? 1 : uSize / r.size
  const sizeOk = r.size < 8 ? uSize < 40 * L : sizeRatio > 0.4 / L && sizeRatio < 2.2 * L
  // Path length (after size alignment) catches scribbles and zig-zags.
  const lenRatio = r.len > 1 ? (pathLength(u) * k) / r.len : 1
  const lenOk = r.len < 20 || (lenRatio > 0.45 / L && lenRatio < 1.9 * L)
  const shape = clamp01(1 - shapeRatio / (shapeTol * 2)) * (sizeOk ? 1 : 0.5) * (lenOk ? 1 : 0.5)

  // Direction: reversed alignment fits clearly better, or start→end chord points the other way.
  const rv = { x: r.pts[N - 1].x - r.pts[0].x, y: r.pts[N - 1].y - r.pts[0].y }
  const uv = { x: u[N - 1].x - u[0].x, y: u[N - 1].y - u[0].y }
  const rvLen = Math.hypot(rv.x, rv.y)
  const uvLen = Math.hypot(uv.x, uv.y)
  const cos = rvLen > 1e-6 && uvLen > 1e-6 ? (rv.x * uv.x + rv.y * uv.y) / (rvLen * uvLen) : 1
  const chordMatters = rvLen > 0.3 * Math.max(r.size, 1) && r.size >= 8
  const reversed = (rev < fwd * 0.75 && fwd > 0.12 * scaleBase) || (chordMatters && cos < -0.2)
  const direction = reversed ? 0 : chordMatters ? clamp01((cos + 1) / 2) ** 0.5 : 1

  const score = Math.round(100 * (0.5 * shape + 0.3 * position + 0.2 * direction))

  let failure: StrokeMetrics['failure'] = null
  if (reversed) failure = 'direction'
  else if (shapeRatio > shapeTol || !sizeOk || !lenOk) failure = 'shape'
  else if (posDist > posTol) failure = 'position'

  return { shape, direction, position, reversed, score: failure ? Math.min(score, 50) : score, pass: failure === null, failure }
}

export interface StrokeResult {
  index: number
  verdict: Verdict
  pass: boolean
  /** 0–100. */
  score: number
  /** For 'order': the reference stroke index this stroke actually matches. */
  matched?: number
  message: string
  metrics?: StrokeMetrics
}

const MESSAGES: Record<Exclude<Verdict, 'order'>, string> = {
  good: 'Beautiful stroke!',
  shape: 'The shape is off. Watch how the stroke curves.',
  direction: 'Wrong direction: this stroke is drawn the other way.',
  position: 'Right shape, wrong place on the scroll.',
  missing: 'This stroke is missing.',
}

/**
 * Evaluate the user's stroke as stroke number `index` of a character.
 * Used live after each stroke.
 */
export function evaluateStroke(user: readonly Pt[], charStrokes: readonly string[], index: number, opts: EvalOptions = {}): StrokeResult {
  if (index >= charStrokes.length) return { index, verdict: 'shape', pass: false, score: 0, message: 'This character has no more strokes.' }
  if (user.length === 0) return { index, verdict: 'missing', pass: false, score: 0, message: MESSAGES.missing }
  const m = compareStroke(user, charStrokes[index], opts)
  if (m.pass) return { index, verdict: 'good', pass: true, score: m.score, message: MESSAGES.good, metrics: m }

  // Stroke order: does it fit another stroke instead?
  let best = -1
  let bestScore = -1
  charStrokes.forEach((d, j) => {
    if (j === index) return
    const o = compareStroke(user, d, opts)
    if (o.pass && o.score > bestScore) {
      best = j
      bestScore = o.score
    }
  })
  if (best >= 0) {
    return {
      index,
      verdict: 'order',
      pass: false,
      score: Math.min(m.score, 30),
      matched: best,
      message: `Wrong order: that is stroke ${best + 1}. Stroke ${index + 1} comes first.`,
      metrics: m,
    }
  }
  const verdict = m.failure ?? 'shape'
  return { index, verdict, pass: false, score: m.score, message: MESSAGES[verdict], metrics: m }
}

export interface CharacterResult {
  /** 0–100 overall accuracy. */
  accuracy: number
  pass: boolean
  strokes: StrokeResult[]
  /** Number of extra strokes beyond the reference count. */
  extra: number
  messages: string[]
}

/** Evaluate a whole character written as a list of strokes. */
export function evaluateCharacter(userStrokes: readonly (readonly Pt[])[], charStrokes: readonly string[], opts: EvalOptions = {}): CharacterResult {
  const strokes = charStrokes.map((_, i) => (i < userStrokes.length ? evaluateStroke(userStrokes[i], charStrokes, i, opts) : { index: i, verdict: 'missing' as const, pass: false, score: 0, message: MESSAGES.missing }))
  const extra = Math.max(0, userStrokes.length - charStrokes.length)
  const total = strokes.reduce((s, r) => s + r.score, 0)
  const accuracy = Math.round(Math.max(0, total / Math.max(1, charStrokes.length) - extra * 10))
  const pass = strokes.every((s) => s.pass) && extra === 0
  const messages = strokes.filter((s) => !s.pass).map((s) => `Stroke ${s.index + 1}: ${s.message}`)
  if (extra) messages.push(`${extra} extra stroke${extra > 1 ? 's' : ''}.`)
  return { accuracy, pass, strokes, extra, messages }
}

// ─── Game scoring ─────────────────────────────────────────────────────

/**
 * Points (0–100) for one drawn character in a drawing game: the quality of
 * the accepted strokes, minus penalties for rejected strokes and hints.
 * A stroke scoring ≥ 85 counts as perfect; 40 or less counts as nothing.
 */
export function characterPoints(strokeScores: readonly number[], mistakes: number, hints: number, hintCost = 15, mistakeCost = 20): number {
  if (!strokeScores.length) return 0
  const q = strokeScores.reduce((s, v) => s + clamp01((v - 40) / 45), 0) / strokeScores.length
  return Math.max(0, Math.round(q * 100 - mistakes * mistakeCost - hints * hintCost))
}

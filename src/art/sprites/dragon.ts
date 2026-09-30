/**
 * The final boss: an eastern (serpentine) void dragon, 64×64. The coiled
 * body is drawn procedurally along a spline (lit tube, gold belly plates,
 * flame fins, occlusion lines where coils overlap); the head, claws and
 * whiskers are hand-placed palette maps.
 */
import { PAL } from '../palette'
import { Img, colorOf, outline } from '../raster'

type P = [number, number]

// Neck → tail.
const PATH: P[] = [
  [29, 18],
  [40, 13],
  [52, 17],
  [57, 28],
  [50, 37],
  [36, 39],
  [22, 41],
  [11, 49],
  [16, 58],
  [31, 60],
  [46, 56],
  [56, 47],
  [60, 37],
  [61, 28],
]

function catmull(p0: P, p1: P, p2: P, p3: P, t: number): P {
  const t2 = t * t
  const t3 = t2 * t
  const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]
}

function samples(step = 0.02) {
  const pts: { p: P; t: number }[] = []
  const n = PATH.length
  for (let i = 0; i < n - 1; i++) {
    const p0 = PATH[Math.max(0, i - 1)]
    const p1 = PATH[i]
    const p2 = PATH[i + 1]
    const p3 = PATH[Math.min(n - 1, i + 2)]
    for (let t = 0; t < 1; t += step) pts.push({ p: catmull(p0, p1, p2, p3, t), t: (i + t) / (n - 1) })
  }
  pts.push({ p: PATH[n - 1], t: 1 })
  return pts
}

export const HEAD = [
  '.......................pP.....',
  '......................pP..pP..',
  '..................pP.pP..pP...',
  '...................pPPpPPP....',
  '....................pPPP..x...',
  '.............uuuuuuuuPP.xxe...',
  '..........uuuuUUUUuuuuuxxeex..',
  '........uuuUUUUUUUUuuuuuxeeyx.',
  '......uuUUUUUUUkyluuuuuuuxeyx.',
  '....uuUUUUUUUUUukluuuuuuuxeex.',
  '..uuUUUuuuuuuuuuuuuuuuuuuuxex.',
  '.kuUuuuuuuuuuuuuuuuuuuuuuuxxe.',
  'kuuuuuuuuuuuuuuuuuuuuuuuuuuxx.',
  '.wkwkwkwkwkuuuuuuuuuuuuuuuuxx.',
  '..VVVVVVVVVkuuuuuuuuuuuuuuuxxe',
  '..VVxxxxVVkuuuuuuuuuuuuuuuxxex',
  '.wkwkwkwkwuuuuuuuuuuuuuuuuxxe.',
  '.yyyyyyyyyyyyuuuuuuuuuuuuxxe..',
  '..yyyyyyyyyyyyyyuuuuuuuuxxe...',
  '.....yyyyyyyyyyyyyyuuuuxxe....',
  '...........yyyyyyyyyyxxe......',
  '...................xxe........',
]

export const CLAW = ['.uuu.', 'uuuu.', '.uuu.', 'y.y.y']

export function buildDragon(frame: number): Img {
  const img = new Img(64, 64)
  const owner = new Float32Array(64 * 64).fill(-1)
  const pts = samples()
  const radius = (t: number) => (t < 0.08 ? 5 + t * 20 : 6.6 - Math.pow(t, 1.4) * 5.4)
  const lx = -Math.SQRT1_2
  const ly = -Math.SQRT1_2
  const C = (ch: string) => colorOf(ch)!
  // tail first so the neck ends up in front
  for (let k = pts.length - 1; k >= 0; k--) {
    const { p, t } = pts[k]
    const q = pts[Math.min(pts.length - 1, k + 1)].p
    const o = pts[Math.max(0, k - 1)].p
    let tx = q[0] - o[0]
    let ty = q[1] - o[1]
    const tl = Math.hypot(tx, ty) || 1
    tx /= tl
    ty /= tl
    // perpendicular (belly on the +n side)
    const nx = -ty
    const ny = tx
    const r = radius(t)
    for (let y = Math.floor(p[1] - r - 1); y <= Math.ceil(p[1] + r + 1); y++)
      for (let x = Math.floor(p[0] - r - 1); x <= Math.ceil(p[0] + r + 1); x++) {
        if (x < 0 || y < 0 || x >= 64 || y >= 64) continue
        const dx = x + 0.5 - p[0]
        const dy = y + 0.5 - p[1]
        const d = Math.hypot(dx, dy)
        if (d > r) continue
        const idx = y * 64 + x
        const prev = owner[idx]
        const side = (dx * nx + dy * ny) / r
        // occlusion line where this coil passes over an earlier one
        if (d > r - 1.1 && prev >= 0 && Math.abs(prev - t) > 0.12) {
          img.set(x, y, PAL.ink)
          owner[idx] = t
          continue
        }
        owner[idx] = t
        const along = Math.round(t * 260)
        let c: string
        if (side > 0.42) {
          // belly plates
          c = along % 4 === 0 ? C('e') : side > 0.8 ? C('e') : C('y')
        } else {
          const lit = (dx * lx + dy * ly) / r
          c = lit > 0.35 ? C('U') : lit > -0.6 ? C('u') : C('n')
          // scale pattern
          if ((along + Math.round(side * 6)) % 5 === 0 && lit > -0.6 && side < 0.3) c = lit > 0.35 ? C('p') : C('U')
        }
        img.set(x, y, c)
      }
    // flame fins along the back
    if (k % 7 === 0 && t > 0.05 && t < 0.92) {
      const h = Math.max(2, Math.round(r * 0.55))
      for (let i = 1; i <= h; i++) {
        const fx = Math.round(p[0] - nx * (r + i - 0.5))
        const fy = Math.round(p[1] - ny * (r + i - 0.5))
        if (fx < 0 || fy < 0 || fx >= 64 || fy >= 64 || owner[fy * 64 + fx] >= 0) continue
        img.set(fx, fy, C(i === h ? 'y' : i === 1 ? 'V' : 'x'))
        const sx = Math.round(fx - tx)
        const sy = Math.round(fy - ty)
        if (i < h && owner[sy * 64 + sx] < 0) img.set(sx, sy, C(frame ? 'e' : 'x'))
      }
    }
  }
  // tail flame tuft
  const tip = PATH[PATH.length - 1]
  img.map(frame ? ['.x.', 'xex', 'eye', '.x.'] : ['x..', 'xex', '.yx', '.x.'], tip[0] - 1, tip[1] - 5)
  // claws gripping the coils
  img.map(CLAW, 45, 38)
  img.map(CLAW, 20, 50)
  // head (breathing: bobs a pixel on frame 1)
  const hy = frame ? 4 : 3
  img.map(HEAD, 1, hy)
  // whiskers
  const whisk = (x0: number, y0: number, dir: number) => {
    for (let i = 0; i < 14; i++) {
      const x = x0 - Math.round(i * 0.6)
      const y = y0 + Math.round(Math.sin(i / 3 + frame) * 1.5 + i * 0.55 * dir)
      img.set(x, y, C(i % 3 === 0 ? 'y' : 'x'))
    }
  }
  whisk(10, hy + 12, 1)
  whisk(8, hy + 17, 1.4)
  // breath glow in the open mouth
  img.map([frame ? 'eyllye' : 'xeyyex'], 4, hy + 15)
  return outline(img)
}

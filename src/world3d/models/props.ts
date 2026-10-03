/**
 * Smooth 3D props for the tile objects: trees, bamboo, rocks, stone
 * lanterns, torii, signs, wells, chests and the rest. Each is added into a
 * Mesher at a cell (bottom centre at the origin passed in), with small
 * per-cell variation so forests don't look stamped. Returns false for
 * tiles that have no model (the caller falls back).
 */
import { PAL as P } from '../../art/palette'
import type { TileId } from '../../art/tiles'
import { G, Mesher, T, mix, rnd, type Vec3 } from './kit'

type Build = (m: Mesher, o: Vec3, k: { v: number; x: number; y: number; nb: number }) => void

const at = (o: Vec3, x: number, y: number, z: number): Vec3 => [o[0] + x, o[1] + y, o[2] + z]

function canopy(m: Mesher, o: Vec3, x: number, y: number, cols: string[], base: number, spread: number, n: number, sway: number) {
  for (let i = 0; i < n; i++) {
    const a = rnd(x, y, i) * Math.PI * 2
    const r = i === 0 ? 0 : spread * (0.55 + rnd(x, y, i + 9) * 0.45)
    const s = base * (i === 0 ? 1 : 0.62 + rnd(y, x, i) * 0.3)
    const h = base * 1.5 + (i === 0 ? 0.08 : rnd(x, i, y) * 0.25)
    m.add(G.ball, cols[i % cols.length], T(at(o, Math.cos(a) * r, h + base * 0.6, Math.sin(a) * r * 0.8), [s, s * 0.9, s], [rnd(x, y, i + 3), rnd(x, y, i + 4), 0]), { sway })
  }
}

const PROPS: Partial<Record<TileId, Build>> = {
  tree(m, o, { x, y }) {
    const s = 0.9 + rnd(x, y, 1) * 0.25
    m.add(G.cyl, P.wood, T(at(o, 0, 0.28 * s, 0), [0.07, 0.56 * s, 0.07]))
    m.add(G.cone, P.woodDark, T(at(o, 0, 0.06, 0), [0.14, 0.14, 0.14]))
    canopy(m, o, x, y, [P.leaf, P.grass, P.leafDark, P.grass], 0.33 * s, 0.22, 5, 0.05)
  },
  sakura(m, o, { x, y }) {
    const s = 0.9 + rnd(x, y, 1) * 0.2
    m.add(G.cyl, P.woodDark, T(at(o, 0, 0.28, 0), [0.07, 0.56, 0.07], [0, 0, 0.1]))
    canopy(m, o, x, y, [P.sakura, P.sakuraDark, '#ffd6e6', P.sakura], 0.32 * s, 0.24, 6, 0.06)
  },
  pine(m, o, { x, y }) {
    const s = 0.9 + rnd(x, y, 1) * 0.3
    m.add(G.cyl, P.woodDark, T(at(o, 0, 0.15, 0), [0.06, 0.3, 0.06]))
    for (let i = 0; i < 3; i++)
      m.add(G.cone, i % 2 ? P.leafDark : mix(P.leafDark, P.leaf, 0.4), T(at(o, 0, (0.4 + i * 0.28) * s, 0), [(0.42 - i * 0.1) * s, 0.5 * s, (0.42 - i * 0.1) * s], [0, rnd(x, y, i), 0]), { sway: 0.02 + i * 0.015 })
  },
  bamboo(m, o, { x, y }) {
    for (let i = 0; i < 4; i++) {
      const px = (rnd(x, y, i) - 0.5) * 0.6
      const pz = (rnd(y, x, i) - 0.5) * 0.4
      const h = 1.1 + rnd(x, i, y) * 0.6
      m.add(G.cyl, i % 2 ? P.leaf : P.grass, T(at(o, px, h / 2, pz), [0.035, h, 0.035]), { sway: 0.08 })
      for (let k = 1; k < 4; k++) m.add(G.cyl, P.grassLight, T(at(o, px, (h * k) / 4, pz), [0.04, 0.02, 0.04]), { sway: 0.08 })
      m.add(G.cone, P.grass, T(at(o, px + 0.08, h - 0.1, pz), [0.03, 0.2, 0.08], [0, 0, 1.2]), { sway: 0.08 })
    }
  },
  bush(m, o, { x, y }) {
    for (let i = 0; i < 4; i++) {
      const a = rnd(x, y, i) * Math.PI * 2
      m.add(G.ball, i % 2 ? P.leaf : P.grass, T(at(o, Math.cos(a) * 0.14 * (i ? 1 : 0), 0.16 + (i ? 0 : 0.06), Math.sin(a) * 0.1), 0.2 + rnd(y, x, i) * 0.06), { sway: 0.015 })
    }
    if (rnd(x, y, 7) > 0.5) for (let i = 0; i < 3; i++) m.add(G.sphere, P.sakura, T(at(o, (rnd(x, i, 1) - 0.5) * 0.3, 0.32, 0.15), 0.03))
  },
  rock(m, o, { x, y }) {
    m.add(G.rock, P.stone, T(at(o, 0, 0.1, 0), [0.24, 0.16, 0.2], [rnd(x, y, 1), rnd(x, y, 2) * 3, 0]))
    m.add(G.rock, P.stoneDark, T(at(o, 0.14, 0.05, 0.05), 0.08))
  },
  boulder(m, o, { x, y }) {
    m.add(G.rock, P.stone, T(at(o, 0, 0.26, 0), [0.4, 0.32, 0.34], [rnd(x, y, 1), rnd(x, y, 2) * 3, 0]))
    m.add(G.rock, P.mist, T(at(o, -0.08, 0.46, 0.08), [0.16, 0.08, 0.14]))
    m.add(G.ball, P.leaf, T(at(o, 0.1, 0.5, 0.05), [0.14, 0.04, 0.12]))
  },
  stump(m, o) {
    m.add(G.cyl, P.wood, T(at(o, 0, 0.12, 0), [0.2, 0.24, 0.2]))
    m.add(G.cyl, P.sand, T(at(o, 0, 0.245, 0), [0.17, 0.01, 0.17]))
    m.add(G.torus, P.woodLight, T(at(o, 0, 0.25, 0), 0.09, [Math.PI / 2, 0, 0]))
  },
  lantern(m, o) {
    // stone tōrō
    m.add(G.box, P.stoneDark, T(at(o, 0, 0.05, 0), [0.3, 0.1, 0.3]))
    m.add(G.cyl6, P.stone, T(at(o, 0, 0.3, 0), [0.07, 0.4, 0.07]))
    m.add(G.box, P.stone, T(at(o, 0, 0.52, 0), [0.28, 0.05, 0.28]))
    m.add(G.box, P.light, T(at(o, 0, 0.65, 0), [0.2, 0.18, 0.2]), { glow: 0.35 })
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) m.add(G.box, P.stone, T(at(o, sx * 0.1, 0.65, sz * 0.1), [0.04, 0.2, 0.04]))
    m.add(G.cone4, P.stoneDark, T(at(o, 0, 0.84, 0), [0.28, 0.18, 0.28], [0, Math.PI / 4, 0]))
    m.add(G.sphere, P.stone, T(at(o, 0, 0.95, 0), 0.05))
  },
  sign(m, o) {
    m.add(G.cyl, P.woodDark, T(at(o, 0, 0.25, -0.02), [0.035, 0.5, 0.035]))
    m.add(G.box, P.wood, T(at(o, 0, 0.45, 0.02), [0.46, 0.24, 0.05], [0, 0, 0.04]))
    m.add(G.box, P.paper, T(at(o, 0, 0.45, 0.05), [0.36, 0.15, 0.01], [0, 0, 0.04]))
    for (let i = 0; i < 3; i++) m.add(G.box, P.ink, T(at(o, -0.1 + i * 0.1, 0.45, 0.058), [0.05, 0.08, 0.005], [0, 0, 0.04]))
  },
  well(m, o) {
    m.add(G.cyl, P.stone, T(at(o, 0, 0.16, 0), [0.34, 0.32, 0.34]))
    m.add(G.cyl, P.waterDeep, T(at(o, 0, 0.325, 0), [0.26, 0.01, 0.26]))
    for (const s of [-1, 1]) m.add(G.box, P.wood, T(at(o, s * 0.3, 0.5, 0), [0.05, 0.7, 0.05]))
    m.add(G.cone4, P.woodDark, T(at(o, 0, 0.95, 0), [0.5, 0.2, 0.4], [0, Math.PI / 4, 0]))
    m.add(G.cyl, P.woodLight, T(at(o, 0, 0.72, 0), [0.03, 0.6, 0.03], [0, 0, Math.PI / 2]))
    m.add(G.cyl, P.wood, T(at(o, 0.1, 0.5, 0), [0.06, 0.1, 0.06]))
  },
  torii(m, o) {
    const w = 0.62
    for (const s of [-1, 1]) {
      m.add(G.cyl, P.vermilion, T(at(o, s * w * 0.72, 0.62, 0), [0.06, 1.24, 0.06]))
      m.add(G.cyl, P.ink, T(at(o, s * w * 0.72, 0.05, 0), [0.075, 0.1, 0.075]))
    }
    m.add(G.box, P.vermilion, T(at(o, 0, 0.98, 0), [w * 1.8, 0.07, 0.08]))
    m.add(G.box, P.vermilion, T(at(o, 0, 1.25, 0), [w * 2.25, 0.09, 0.12]))
    m.add(G.box, P.ink, T(at(o, 0, 1.32, 0), [w * 2.4, 0.05, 0.14]))
    m.add(G.box, P.vermilion, T(at(o, 0, 1.12, 0), [0.06, 0.22, 0.06]))
  },
  statue(m, o) {
    // jizō
    m.add(G.box, P.stoneDark, T(at(o, 0, 0.06, 0), [0.32, 0.12, 0.28]))
    m.add(G.capsule, P.stone, T(at(o, 0, 0.36, 0), [0.14, 0.2, 0.12]))
    m.add(G.sphere, P.stone, T(at(o, 0, 0.66, 0), 0.13))
    m.add(G.cone, P.vermilion, T(at(o, 0, 0.44, 0.08), [0.12, -0.14, 0.05]))
    for (const s of [-1, 1]) m.add(G.box, P.stoneDark, T(at(o, s * 0.045, 0.67, 0.12), [0.04, 0.008, 0.01]))
  },
  stall(m, o) {
    // a low counter (shop interiors put the merchant right behind it, so no awning)
    m.add(G.box, P.wood, T(at(o, 0, 0.22, 0.05), [0.96, 0.44, 0.4]))
    m.add(G.box, P.woodLight, T(at(o, 0, 0.45, 0.05), [1.0, 0.03, 0.44]))
    for (let i = 0; i < 3; i++) m.add(G.sphere, [P.orange, P.fire, P.poison][i], T(at(o, -0.2 + i * 0.2, 0.5, 0.12), 0.05))
  },
  barrel(m, o) {
    m.add(G.sphere, P.wood, T(at(o, 0, 0.28, 0), [0.22, 0.28, 0.22]))
    m.add(G.cyl, P.wood, T(at(o, 0, 0.28, 0), [0.21, 0.5, 0.21]))
    for (const h of [0.1, 0.46]) m.add(G.cyl, P.stoneDark, T(at(o, 0, h, 0), [0.215, 0.03, 0.215]))
    m.add(G.cyl, P.woodLight, T(at(o, 0, 0.535, 0), [0.19, 0.01, 0.19]))
  },
  crate(m, o, { x, y }) {
    const r = (rnd(x, y, 3) - 0.5) * 0.3
    m.add(G.box, P.woodLight, T(at(o, 0, 0.2, 0), [0.4, 0.4, 0.4], [0, r, 0]))
    for (const h of [0.05, 0.35]) m.add(G.box, P.wood, T(at(o, 0, h, 0), [0.42, 0.05, 0.42], [0, r, 0]))
    m.add(G.box, P.wood, T(at(o, 0, 0.2, 0), [0.42, 0.4, 0.04], [0, r, Math.PI / 4]))
  },
  pot(m, o) {
    m.add(G.sphere, P.woodDark, T(at(o, 0, 0.2, 0), [0.2, 0.2, 0.2]))
    m.add(G.cyl, P.woodDark, T(at(o, 0, 0.38, 0), [0.1, 0.08, 0.1]))
    m.add(G.torus, P.wood, T(at(o, 0, 0.42, 0), 0.1, [Math.PI / 2, 0, 0]))
    m.add(G.torus, P.gold, T(at(o, 0, 0.22, 0), 0.2, [Math.PI / 2, 0, 0]))
  },
  chest(m, o) {
    m.add(G.box, P.wood, T(at(o, 0, 0.15, 0), [0.5, 0.3, 0.34]))
    m.add(G.cyl, P.woodLight, T(at(o, 0, 0.3, 0), [0.17, 0.5, 0.17], [0, 0, Math.PI / 2]))
    for (const s of [-1, 1]) m.add(G.box, P.gold, T(at(o, s * 0.2, 0.22, 0), [0.05, 0.44, 0.36]))
    m.add(G.box, P.gold, T(at(o, 0, 0.28, 0.18), [0.08, 0.1, 0.02]))
  },
  'chest-open'(m, o) {
    m.add(G.box, P.wood, T(at(o, 0, 0.15, 0), [0.5, 0.3, 0.34]))
    m.add(G.box, P.woodDark, T(at(o, 0, 0.29, 0), [0.44, 0.02, 0.28]))
    m.add(G.cyl, P.woodLight, T(at(o, 0, 0.42, -0.17), [0.17, 0.5, 0.17], [0, 0, Math.PI / 2]))
    m.add(G.sphere, P.light, T(at(o, 0, 0.3, 0), [0.15, 0.04, 0.1]), { glow: 1 })
  },
  campfire(m, o, { x, y }) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2
      m.add(G.rock, P.stone, T(at(o, Math.cos(a) * 0.26, 0.04, Math.sin(a) * 0.22), 0.07, [a, a, 0]))
    }
    for (let i = 0; i < 3; i++) m.add(G.cyl, P.woodDark, T(at(o, 0, 0.07, 0), [0.04, 0.4, 0.04], [Math.PI / 2, (i / 3) * Math.PI, 0.2]))
    m.add(G.cone, P.fire, T(at(o, 0, 0.25, 0), [0.14, 0.4, 0.14]), { glow: 1, sway: 0.03 + rnd(x, y) * 0.01 })
    m.add(G.cone, P.light, T(at(o, 0.02, 0.22, 0.03), [0.08, 0.28, 0.08]), { glow: 1, sway: 0.04 })
  },
  anvil(m, o) {
    m.add(G.box, P.woodDark, T(at(o, 0, 0.12, 0), [0.26, 0.24, 0.26]))
    m.add(G.box, P.stoneDark, T(at(o, 0, 0.3, 0), [0.4, 0.12, 0.2]))
    m.add(G.cone, P.stoneDark, T(at(o, 0.26, 0.31, 0), [0.06, 0.16, 0.06], [0, 0, -Math.PI / 2]))
  },
  tablet(m, o) {
    m.add(G.box, P.stoneDark, T(at(o, 0, 0.05, 0), [0.5, 0.1, 0.3]))
    m.add(G.box, P.stone, T(at(o, 0, 0.42, 0), [0.4, 0.66, 0.12]))
    for (let i = 0; i < 4; i++) m.add(G.box, P.stoneDark, T(at(o, 0.12 - i * 0.08, 0.45, 0.065), [0.03, 0.4, 0.005]))
  },
  altar(m, o) {
    m.add(G.box, P.stone, T(at(o, 0, 0.2, 0), [0.7, 0.4, 0.45]))
    m.add(G.box, P.paper, T(at(o, 0, 0.41, 0), [0.74, 0.03, 0.5]))
    for (const s of [-1, 1]) {
      m.add(G.cyl, P.paper, T(at(o, s * 0.25, 0.5, 0), [0.03, 0.16, 0.03]))
      m.add(G.cone, P.light, T(at(o, s * 0.25, 0.62, 0), [0.025, 0.07, 0.025]), { glow: 1 })
    }
    m.add(G.sphere, P.gold, T(at(o, 0, 0.5, 0), 0.08))
  },
  throne(m, o) {
    m.add(G.box, P.gold, T(at(o, 0, 0.18, 0), [0.6, 0.36, 0.5]))
    m.add(G.box, P.crimson, T(at(o, 0, 0.38, 0.03), [0.5, 0.06, 0.42]))
    m.add(G.box, P.gold, T(at(o, 0, 0.75, -0.22), [0.6, 0.8, 0.08]))
    m.add(G.box, P.crimson, T(at(o, 0, 0.72, -0.18), [0.44, 0.6, 0.02]))
    for (const s of [-1, 1]) m.add(G.sphere, P.gold, T(at(o, s * 0.28, 1.17, -0.22), 0.06))
  },
  'shrine-bell'(m, o) {
    for (const s of [-1, 1]) m.add(G.box, P.vermilion, T(at(o, s * 0.28, 0.45, 0), [0.05, 0.9, 0.05]))
    m.add(G.box, P.woodDark, T(at(o, 0, 0.9, 0), [0.7, 0.06, 0.1]))
    m.add(G.sphere, P.gold, T(at(o, 0, 0.72, 0), [0.12, 0.1, 0.12]))
    m.add(G.cyl, P.gold, T(at(o, 0, 0.8, 0), [0.03, 0.05, 0.03]))
    m.add(G.cyl, P.vermilion, T(at(o, 0, 0.45, 0.02), [0.015, 0.4, 0.015]))
  },
  // ── v3 tiles: the harbour, hot springs, snow temple and sky city ──
  boat(m, o, { x, y }) {
    // a small wooden fishing boat drawn up on the shore, mast and furled sail
    const yaw = (rnd(x, y, 1) - 0.5) * 0.5
    const R = (r: [number, number, number]): [number, number, number] => [r[0], r[1] + yaw, r[2]]
    const p = (dx: number, dy: number, dz: number) => at(o, dx * Math.cos(yaw) + dz * Math.sin(yaw), dy, -dx * Math.sin(yaw) + dz * Math.cos(yaw))
    m.add(G.capsule, P.wood, T(p(0, 0.12, 0), [0.17, 0.62, 0.15], R([0, 0, Math.PI / 2])))
    m.add(G.box, P.woodDark, T(p(0, 0.2, 0), [0.66, 0.03, 0.2], R([0, 0, 0])))
    for (const s of [-1, 1]) m.add(G.box, P.woodLight, T(p(0, 0.225, s * 0.135), [0.78, 0.035, 0.03], R([0, 0, 0])))
    m.add(G.box, P.vermilion, T(p(0, 0.13, 0), [0.9, 0.04, 0.315], R([0, 0, 0])))
    m.add(G.box, P.woodLight, T(p(-0.12, 0.23, 0), [0.04, 0.03, 0.26], R([0, 0, 0])))
    m.add(G.cyl, P.woodDark, T(p(0.05, 0.6, 0), [0.025, 0.78, 0.025]), { sway: 0.02 })
    m.add(G.capsule, P.paper, T(p(0.05, 0.42, 0.02), [0.05, 0.36, 0.05], R([0, 0, Math.PI / 2])), { sway: 0.02 })
    m.add(G.cone, P.crimson, T(p(0.12, 0.95, 0), [0.05, 0.14, 0.012], R([0, 0, -Math.PI / 2])), { sway: 0.05 })
    m.add(G.torus, P.sand, T(p(-0.28, 0.23, 0), 0.06, [Math.PI / 2, 0, 0]))
    m.add(G.cyl, P.woodLight, T(p(0.15, 0.24, 0.06), [0.015, 0.6, 0.015], R([Math.PI / 2, 0, 0.5])))
  },
  net(m, o, { x, y }) {
    // a fishing net hung out to dry between two poles, with floats along the bottom
    const twine = mix(P.woodDark, P.leafDark, 0.45)
    for (const s of [-1, 1]) {
      m.add(G.cyl, P.woodDark, T(at(o, s * 0.4, 0.42, 0), [0.03, 0.84, 0.03]))
      m.add(G.cyl, P.wood, T(at(o, s * 0.4, 0.86, 0), [0.04, 0.03, 0.04]))
    }
    m.add(G.cyl, P.wood, T(at(o, 0, 0.8, 0), [0.022, 0.86, 0.022], [0, 0, Math.PI / 2]))
    const sag = 0.05 + rnd(x, y, 2) * 0.03
    for (let i = 0; i <= 6; i++) {
      const u = -0.36 + (i / 6) * 0.72
      m.add(G.box, twine, T(at(o, u, 0.53 - Math.cos(u * 4) * sag * 0.3, 0), [0.012, 0.52, 0.012]), { sway: 0.025 })
    }
    for (let j = 0; j < 5; j++) {
      const h = 0.76 - j * 0.12
      m.add(G.box, twine, T(at(o, 0, h - (j / 4) * sag, 0.005), [0.74, 0.012, 0.012]), { sway: 0.02 + j * 0.006 })
    }
    for (let i = 0; i < 5; i++) m.add(G.sphere, i % 2 ? P.orange : P.paper, T(at(o, -0.3 + i * 0.15, 0.26 - sag, 0.02), 0.035), { sway: 0.03 })
    m.add(G.box, P.woodDark, T(at(o, 0.24, 0.07, 0.2), [0.22, 0.14, 0.16]))
    m.add(G.torus, P.sand, T(at(o, -0.25, 0.04, 0.22), 0.08, [Math.PI / 2, 0, 0]))
  },
  chochin(m, o) {
    // a red paper lantern hanging from a little wooden post
    m.add(G.box, P.stoneDark, T(at(o, -0.12, 0.04, 0), [0.18, 0.08, 0.18]))
    m.add(G.cyl, P.woodDark, T(at(o, -0.12, 0.5, 0), [0.03, 0.96, 0.03]))
    m.add(G.box, P.woodDark, T(at(o, 0.0, 0.95, 0), [0.3, 0.03, 0.03]))
    m.add(G.cyl, P.ink, T(at(o, 0.1, 0.88, 0), [0.006, 0.12, 0.006]), { sway: 0.03 })
    m.add(G.sphere, P.vermilion, T(at(o, 0.1, 0.7, 0), [0.13, 0.17, 0.13]), { glow: 0.55, sway: 0.04 })
    for (const h of [-0.09, 0, 0.09]) m.add(G.torus, P.crimson, T(at(o, 0.1, 0.7 + h, 0), [0.125 * Math.cos(h * 5), 0.125 * Math.cos(h * 5), 0.06], [Math.PI / 2, 0, 0]), { sway: 0.04 })
    for (const h of [0.86, 0.54]) m.add(G.cyl, P.ink, T(at(o, 0.1, h, 0), [0.07, 0.035, 0.07]), { sway: 0.04 })
    m.add(G.box, P.ink, T(at(o, 0.1, 0.7, 0.128), [0.05, 0.12, 0.005]), { sway: 0.04 })
    m.add(G.cone, P.gold, T(at(o, 0.1, 0.48, 0), [0.025, 0.08, 0.025], [Math.PI, 0, 0]), { sway: 0.05 })
  },
  snowman(m, o, { x, y }) {
    const turn = (rnd(x, y, 1) - 0.5) * 0.8
    const f = (dx: number, dy: number, dz: number) => at(o, dx * Math.cos(turn) + dz * Math.sin(turn), dy, -dx * Math.sin(turn) + dz * Math.cos(turn))
    m.add(G.sphere, P.white, T(at(o, 0, 0.19, 0), [0.22, 0.2, 0.22]))
    m.add(G.sphere, P.white, T(at(o, 0, 0.46, 0), 0.16))
    m.add(G.sphere, P.white, T(at(o, 0, 0.68, 0), 0.115))
    m.add(G.torus, P.crimson, T(at(o, 0, 0.58, 0), [0.12, 0.12, 0.16], [Math.PI / 2, 0, 0]))
    m.add(G.box, P.crimson, T(f(0.07, 0.5, 0.12), [0.05, 0.14, 0.02], [0, turn, 0.2]))
    for (const s of [-1, 1]) m.add(G.sphere, P.ink, T(f(s * 0.04, 0.71, 0.1), 0.014))
    m.add(G.cone, P.orange, T(f(0, 0.67, 0.15), [0.018, 0.09, 0.018], [Math.PI / 2, turn, 0]))
    for (const h of [0.5, 0.42, 0.3]) m.add(G.sphere, P.ink, T(f(0, h, 0.155 + (h < 0.4 ? 0.05 : 0)), 0.012))
    m.add(G.cyl, P.vermilion, T(at(o, 0, 0.8, 0), [0.075, 0.1, 0.075], [0, 0, 0.15]))
    for (const s of [-1, 1]) m.add(G.cyl, P.woodDark, T(f(s * 0.22, 0.52, 0), [0.012, 0.26, 0.012], [0, turn, s * 1.0]))
  },
  'snow-pine'(m, o, { x, y }) {
    const s = 0.9 + rnd(x, y, 1) * 0.3
    m.add(G.cyl, P.woodDark, T(at(o, 0, 0.15, 0), [0.06, 0.3, 0.06]))
    for (let i = 0; i < 3; i++) {
      const r = (0.42 - i * 0.1) * s
      const h = (0.4 + i * 0.28) * s
      const spin = rnd(x, y, i)
      m.add(G.cone, i % 2 ? P.leafDark : mix(P.leafDark, P.leaf, 0.3), T(at(o, 0, h, 0), [r, 0.5 * s, r], [0, spin, 0]), { sway: 0.015 + i * 0.01 })
      // snow lying on each tier
      m.add(G.cone, P.white, T(at(o, 0, h + 0.1 * s, 0), [r * 0.82, 0.3 * s, r * 0.82], [0, spin + 0.4, 0]), { sway: 0.015 + i * 0.01 })
    }
    m.add(G.sphere, P.white, T(at(o, 0, 0.02, 0), [0.32 * s, 0.05, 0.3 * s]))
  },
  fence(m, o, { nb }) {
    // bits: N=1… use horizontal unless only vertical neighbours
    const horiz = (nb & (4 | 64)) !== 0 || (nb & (1 | 16)) === 0
    const r: Vec3 = horiz ? [0, 0, 0] : [0, Math.PI / 2, 0]
    for (const s of [-1, 1]) m.add(G.box, P.wood, T(at(o, horiz ? s * 0.4 : 0, 0.22, horiz ? 0 : s * 0.4), [0.06, 0.44, 0.06]))
    for (const h of [0.15, 0.32]) m.add(G.box, P.woodLight, T(at(o, 0, h, 0), [1.0, 0.05, 0.03], r))
  },
}

/** Add the smooth model of a tile object at `o`; false if none exists. */
/** Props are built at tile scale, then enlarged to sit with the (chibi, 1.3×) characters. */
const SCALE: Partial<Record<TileId, number>> = { tree: 1.45, sakura: 1.45, pine: 1.5, 'snow-pine': 1.5, bamboo: 1.3, bush: 1.3, boulder: 1.25, torii: 1.15, fence: 1, boat: 1.25, net: 1.2 }

export function addProp(m: Mesher, id: TileId, o: Vec3, k: { v: number; x: number; y: number; nb: number }): boolean {
  const b = PROPS[id]
  if (!b) return false
  const s = SCALE[id] ?? 1.3
  const tmp = new Mesher(m.swayH / s)
  b(tmp, [0, 0, 0], k)
  m.addMesher(tmp, T(o, s))
  return true
}

export function hasProp(id: TileId): boolean {
  return !!PROPS[id]
}

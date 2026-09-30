/**
 * Smooth 3D characters: chibi humans, animals and monsters built from
 * rounded primitives, each with a tiny rig (body, arms, legs, tails) that
 * walks, runs, idles and bobs procedurally. Proportions follow the pixel
 * sprites (big head, short body) and colours come from the same palette,
 * so every character is recognisably the one from the 2D art.
 *
 * Model space: feet at y = 0, facing +Z (toward the camera), ~1 tile tall.
 */
import * as THREE from 'three'
import { OUTFITS } from '../../engine/rewards'
import { PAL } from '../../art/palette'
import { G, Mesher, T, mix } from './kit'

export interface Model {
  root: THREE.Group
  /** Advance the rig: `phase` = distance walked (tiles), `moving`, `run`, time (s). */
  update(phase: number, moving: boolean, run: boolean, t: number): void
  /** Width of the contact shadow (tiles). */
  shadow: number
  /** Top of the head (tiles), for markers. */
  height: number
  dispose(): void
}

type Hat = 'wizard' | 'kasa' | 'helmet' | 'crown' | 'eboshi' | 'bandana' | 'none'
type Hair = 'short' | 'bun' | 'long' | 'bald' | 'spiky' | 'topknot'
type Prop = 'staff' | 'spear' | 'cane' | 'keys' | 'club' | 'none'

interface Human {
  skin: string
  hair: string
  hairStyle: Hair
  cloth: string
  trim: string
  legs: string
  shoes: string
  hat: Hat
  hatColor?: string
  /** Long robe/kimono hiding the legs. */
  robe: boolean
  beard?: string
  apron?: string
  prop: Prop
  scale: number
  horns?: boolean
}

const P = PAL
const HUMANS: Record<string, Partial<Human>> = {
  mage: { hat: 'wizard', robe: true, prop: 'staff', hair: P.woodDark, hairStyle: 'short' },
  merchant: { cloth: P.wood, trim: P.gold, apron: P.paper, hat: 'bandana', hatColor: P.vermilion, hair: P.night, hairStyle: 'bun' },
  guard: { cloth: P.stone, trim: P.stoneDark, hat: 'helmet', hatColor: P.stoneDark, prop: 'spear', legs: P.navy },
  priest: { cloth: P.white, trim: P.vermilion, legs: P.vermilion, robe: true, hat: 'eboshi', hatColor: P.ink, hair: P.night },
  king: { cloth: P.crimson, trim: P.gold, robe: true, hat: 'crown', hatColor: P.gold, beard: P.mist, hair: P.mist, scale: 1.08 },
  elder: { cloth: P.dusk, trim: P.gold, robe: true, beard: P.white, hair: P.mist, hairStyle: 'bald', prop: 'cane', scale: 0.95 },
  innkeeper: { cloth: P.vermilion, trim: P.paper, apron: P.paper, robe: true, hair: P.night, hairStyle: 'bun' },
  jailer: { cloth: P.stoneDark, trim: P.ink, legs: P.night, hat: 'bandana', hatColor: P.ink, prop: 'keys', hair: P.night, hairStyle: 'spiky' },
  'villager-a': { cloth: P.leaf, trim: P.woodLight, legs: P.wood, hat: 'kasa', hatColor: P.sand, hair: P.woodDark },
  'villager-b': { cloth: P.water, trim: P.paper, robe: true, hair: P.night, hairStyle: 'long' },
  child: { cloth: P.orange, trim: P.gold, legs: P.navy, hair: P.woodDark, hairStyle: 'topknot', scale: 0.78 },
  oni: { skin: P.fire, cloth: P.gold, trim: P.ink, legs: P.fire, hair: P.ink, hairStyle: 'spiky', horns: true, prop: 'club', scale: 1.45 },
}

const BASE: Human = { skin: P.skin, hair: P.night, hairStyle: 'short', cloth: P.dusk, trim: P.gold, legs: P.navy, shoes: P.woodDark, hat: 'none', robe: false, prop: 'none', scale: 1 }

/** Pivot group helper. */
function pivot(parent: THREE.Object3D, x: number, y: number, z: number, mesh?: THREE.Mesh): THREE.Group {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  if (mesh) g.add(mesh)
  parent.add(g)
  return g
}

function meshOf(m: Mesher, mat: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(m.geometry(), mat)
  mesh.castShadow = true
  return mesh
}

function eyes(m: Mesher, y: number, z: number, spread: number, size: number, color: string = P.ink) {
  for (const s of [-1, 1]) {
    m.add(G.sphere, color, T([s * spread, y, z], [size * 0.75, size, size * 0.5]))
    m.add(G.sphere, P.white, T([s * spread + size * 0.25, y + size * 0.35, z + size * 0.35], size * 0.28))
  }
}

function humanModel(id: string, mat: THREE.Material, outfit?: string): Model {
  const h: Human = { ...BASE, ...HUMANS[id] }
  if (id === 'mage') {
    const o = OUTFITS.find((x) => x.id === outfit) ?? OUTFITS[0]
    h.cloth = o.robe
    h.trim = o.trim
    h.hatColor = o.robe
  }
  const root = new THREE.Group()
  const rig = new THREE.Group()
  rig.scale.setScalar(h.scale * 1.3)
  root.add(rig)
  const body = pivot(rig, 0, 0, 0)

  // torso + head (one mesh, bobs as a unit)
  const b = new Mesher()
  if (h.robe) {
    b.add(G.cone, h.cloth, T([0, 0.3, 0], [0.24, 0.62, 0.22]))
    b.add(G.cyl, h.trim, T([0, 0.035, 0], [0.235, 0.05, 0.215]))
    b.add(G.cyl, h.cloth, T([0, 0.2, 0], [0.2, 0.36, 0.18]))
  } else {
    b.add(G.capsule, h.cloth, T([0, 0.4, 0], [0.155, 0.1, 0.13]))
    b.add(G.cyl, h.trim, T([0, 0.3, 0], [0.158, 0.035, 0.135]))
  }
  if (h.apron) b.add(G.box, h.apron, T([0, 0.3, 0.135], [0.2, 0.26, 0.02]))
  b.add(G.box, h.trim, T([0, 0.5, 0.12], [0.07, 0.12, 0.02], [0, 0, Math.PI / 4]))
  // neck + head
  const hy = 0.78
  b.add(G.cyl, h.skin, T([0, 0.56, 0], [0.06, 0.06, 0.06]))
  b.add(G.sphere, h.skin, T([0, hy, 0], [0.26, 0.245, 0.24]))
  eyes(b, hy - 0.02, 0.225, 0.09, 0.045, h.horns ? P.gold : P.ink)
  for (const s of [-1, 1]) b.add(G.sphere, P.sakura, T([s * 0.15, hy - 0.08, 0.2], [0.04, 0.02, 0.015]))
  if (h.horns) for (const s of [-1, 1]) b.add(G.cone, P.paper, T([s * 0.1, hy + 0.2, 0], [0.04, 0.14, 0.04], [0, 0, -s * 0.35]))
  // hair
  if (h.hairStyle !== 'bald') b.add(G.sphere, h.hair, T([0, hy + 0.04, -0.04], [0.272, 0.25, 0.24]))
  else b.add(G.sphere, h.hair, T([0, hy - 0.02, -0.06], [0.22, 0.14, 0.17]))
  if (h.hairStyle !== 'bald') b.add(G.sphere, h.hair, T([0, hy + 0.16, 0.12], [0.2, 0.08, 0.12], [0.3, 0, 0]))
  if (h.hairStyle === 'bun') b.add(G.sphere, h.hair, T([0, hy + 0.2, -0.1], 0.08))
  if (h.hairStyle === 'topknot') b.add(G.capsule, h.hair, T([0, hy + 0.23, -0.02], [0.04, 0.05, 0.04]))
  if (h.hairStyle === 'long') b.add(G.capsule, h.hair, T([0, hy - 0.12, -0.12], [0.17, 0.2, 0.08]))
  if (h.hairStyle === 'spiky') for (let i = -2; i <= 2; i++) b.add(G.cone, h.hair, T([i * 0.07, hy + 0.2, -0.04], [0.05, 0.12, 0.05], [0, 0, -i * 0.25]))
  if (h.beard) b.add(G.cone, h.beard, T([0, hy - 0.2, 0.16], [0.14, -0.22, 0.08]))
  // hats
  const hc = h.hatColor ?? h.cloth
  if (h.hat === 'wizard') {
    b.add(G.cyl, hc, T([0, hy + 0.17, 0], [0.36, 0.025, 0.36]))
    b.add(G.cyl, h.trim, T([0, hy + 0.2, 0], [0.23, 0.04, 0.23]))
    b.add(G.cone, hc, T([0, hy + 0.43, -0.05], [0.23, 0.5, 0.23], [-0.25, 0, 0.12]))
  } else if (h.hat === 'kasa') b.add(G.cone, hc, T([0, hy + 0.25, 0], [0.4, 0.18, 0.4]))
  else if (h.hat === 'helmet') {
    b.add(G.sphere, hc, T([0, hy + 0.06, -0.01], [0.28, 0.245, 0.27]))
    b.add(G.box, P.gold, T([0, hy + 0.22, 0], [0.03, 0.08, 0.16]))
  } else if (h.hat === 'crown') {
    b.add(G.cyl, hc, T([0, hy + 0.2, 0], [0.14, 0.07, 0.14]))
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      b.add(G.cone, hc, T([Math.sin(a) * 0.13, hy + 0.27, Math.cos(a) * 0.13], [0.035, 0.08, 0.035]))
    }
    b.add(G.sphere, P.vermilion, T([0, hy + 0.2, 0.14], 0.03))
  } else if (h.hat === 'eboshi') b.add(G.capsule, hc, T([0, hy + 0.24, -0.04], [0.1, 0.12, 0.08], [-0.3, 0, 0]))
  else if (h.hat === 'bandana') b.add(G.sphere, hc, T([0, hy + 0.08, -0.02], [0.275, 0.15, 0.26]))
  const torso = meshOf(b, mat)
  body.add(torso)

  // arms (pivot at the shoulder)
  const arms: THREE.Group[] = []
  for (const s of [-1, 1]) {
    const a = new Mesher()
    a.add(G.capsule, h.cloth, T([0, -0.09, 0], [0.05, 0.1, 0.05]))
    a.add(G.sphere, h.skin, T([0, -0.19, 0], 0.05))
    if (s === 1 && h.prop !== 'none') {
      if (h.prop === 'staff') {
        a.add(G.cyl, P.wood, T([0, 0.05, 0.02], [0.022, 0.62, 0.022]))
        a.add(G.sphere, P.light, T([0, 0.4, 0.02], 0.065), { glow: 0.4 })
        a.add(G.torus, P.gold, T([0, 0.4, 0.02], 0.07, [Math.PI / 2, 0, 0]))
      } else if (h.prop === 'spear') {
        a.add(G.cyl, P.woodDark, T([0, 0.1, 0.02], [0.018, 0.8, 0.018]))
        a.add(G.cone, P.mist, T([0, 0.56, 0.02], [0.04, 0.14, 0.04]))
      } else if (h.prop === 'cane') a.add(G.cyl, P.woodLight, T([0, -0.13, 0.05], [0.018, 0.34, 0.018]))
      else if (h.prop === 'keys') a.add(G.torus, P.gold, T([0, -0.26, 0.03], 0.05, [0, Math.PI / 2, 0]))
      else if (h.prop === 'club') a.add(G.cone, P.woodDark, T([0, 0.05, 0.08], [0.07, -0.5, 0.07], [0.5, 0, 0]))
    }
    const arm = pivot(body, s * 0.17, h.robe ? 0.48 : 0.47, 0, meshOf(a, mat))
    arm.rotation.z = s * 0.12
    arms.push(arm)
  }

  // legs (pivot at the hip)
  const legs: THREE.Group[] = []
  for (const s of [-1, 1]) {
    const l = new Mesher()
    if (!h.robe) l.add(G.capsule, h.legs, T([0, -0.1, 0], [0.055, 0.08, 0.055]))
    l.add(G.sphere, h.shoes, T([0, -0.2, 0.03], [0.065, 0.045, 0.085]))
    legs.push(pivot(rig, s * 0.075, 0.24, 0, meshOf(l, mat)))
  }

  const breath = new THREE.Vector3()
  return {
    root,
    shadow: 0.7 * h.scale,
    height: (h.hat === 'wizard' ? 1.65 : 1.35) * h.scale,
    update(phase, moving, run, t) {
      const sw = Math.sin(phase * Math.PI)
      const amp = moving ? (run ? 0.85 : 0.55) : 0
      legs[0].rotation.x = sw * amp
      legs[1].rotation.x = -sw * amp
      arms[0].rotation.x = -sw * amp * 0.9
      arms[1].rotation.x = sw * amp * 0.9 - (h.prop === 'staff' || h.prop === 'spear' ? 0.1 : 0)
      const bob = moving ? Math.abs(Math.cos(phase * Math.PI)) * (run ? 0.045 : 0.03) : 0
      body.position.y = bob
      body.rotation.x = moving ? (run ? 0.16 : 0.06) : 0
      const br = moving ? 0 : Math.sin(t * 2.4) * 0.012
      breath.set(1 + br * 0.5, 1 + br, 1 + br * 0.5)
      torso.scale.copy(breath)
      if (!moving) {
        arms[0].rotation.x = Math.sin(t * 2.4) * 0.04
        arms[1].rotation.x = -Math.sin(t * 2.4) * 0.04
      }
    },
    dispose() {
      root.traverse((o) => (o as THREE.Mesh).geometry?.dispose())
    },
  }
}

// ─── animals ─────────────────────────────────────────────────────
interface Beast {
  fur: string
  belly: string
  accent: string
  ear: 'point' | 'round' | 'floppy'
  tail: 'thin' | 'bushy' | 'curl' | 'multi'
  size: number
  mask?: string
}
const BEASTS: Record<string, Beast> = {
  cat: { fur: P.stone, belly: P.paper, accent: P.sakuraDark, ear: 'point', tail: 'thin', size: 0.8 },
  dog: { fur: P.woodLight, belly: P.paper, accent: P.ink, ear: 'floppy', tail: 'curl', size: 0.9 },
  fox: { fur: P.orange, belly: P.paper, accent: P.crimson, ear: 'point', tail: 'bushy', size: 0.9 },
  kitsune: { fur: P.paper, belly: P.white, accent: P.vermilion, ear: 'point', tail: 'multi', size: 1.1 },
}

function beastModel(id: string, mat: THREE.Material): Model {
  const k = BEASTS[id]
  const root = new THREE.Group()
  const rig = new THREE.Group()
  rig.scale.setScalar(k.size * 1.3)
  root.add(rig)
  const body = pivot(rig, 0, 0, 0)
  const b = new Mesher()
  b.add(G.capsule, k.fur, T([0, 0.26, -0.02], [0.13, 0.2, 0.13], [Math.PI / 2, 0, 0]))
  b.add(G.sphere, k.belly, T([0, 0.22, 0.02], [0.1, 0.08, 0.2]))
  // head
  const hz = 0.2
  const hy = 0.45
  b.add(G.sphere, k.fur, T([0, hy, hz], [0.16, 0.14, 0.14]))
  b.add(G.sphere, k.belly, T([0, hy - 0.04, hz + 0.1], [0.08, 0.06, 0.07]))
  b.add(G.sphere, P.ink, T([0, hy - 0.01, hz + 0.165], 0.022))
  eyes(b, hy + 0.03, hz + 0.12, 0.065, 0.028)
  for (const s of [-1, 1]) {
    if (k.ear === 'point') {
      b.add(G.cone, k.fur, T([s * 0.08, hy + 0.14, hz - 0.02], [0.05, 0.12, 0.035], [0, 0, -s * 0.2]))
      b.add(G.cone, k.accent, T([s * 0.08, hy + 0.13, hz - 0.005], [0.028, 0.08, 0.01], [0, 0, -s * 0.2]))
    } else if (k.ear === 'floppy') b.add(G.sphere, P.wood, T([s * 0.14, hy + 0.02, hz - 0.02], [0.04, 0.09, 0.06], [0, 0, s * 0.3]))
    else b.add(G.sphere, k.fur, T([s * 0.1, hy + 0.12, hz], 0.05))
  }
  if (id === 'kitsune') for (const s of [-1, 1]) b.add(G.sphere, k.accent, T([s * 0.07, hy - 0.04, hz + 0.12], [0.02, 0.012, 0.01]))
  const torso = meshOf(b, mat)
  body.add(torso)
  // tail(s)
  const t = new Mesher()
  const tails = k.tail === 'multi' ? [-0.5, 0, 0.5] : [0]
  for (const a of tails) {
    if (k.tail === 'thin') t.add(G.capsule, k.fur, T([0, 0.12, -0.05], [0.025, 0.2, 0.025], [-0.5, 0, 0]))
    else if (k.tail === 'curl') t.add(G.torus, k.fur, T([0, 0.08, 0], 0.07, [0, Math.PI / 2, 0]))
    else {
      t.add(G.sphere, k.fur, T([a * 0.15, 0.12, -0.1], [0.07, 0.16, 0.07], [-0.6, 0, -a * 0.6]))
      t.add(G.sphere, P.white, T([a * 0.26, 0.25, -0.2], [0.05, 0.06, 0.05]))
    }
  }
  const tail = pivot(body, 0, 0.3, -0.22, meshOf(t, mat))
  // legs
  const legs: THREE.Group[] = []
  for (const [x, z] of [[-0.07, 0.12], [0.07, 0.12], [-0.07, -0.13], [0.07, -0.13]]) {
    const l = new Mesher()
    l.add(G.capsule, k.fur, T([0, -0.08, 0], [0.035, 0.08, 0.035]))
    l.add(G.sphere, k.belly, T([0, -0.15, 0.015], [0.04, 0.025, 0.05]))
    legs.push(pivot(rig, x, 0.17, z, meshOf(l, mat)))
  }
  return {
    root,
    shadow: 0.65 * k.size,
    height: 0.9 * k.size,
    update(phase, moving, run, time) {
      const sw = Math.sin(phase * Math.PI * 2)
      const amp = moving ? (run ? 0.9 : 0.6) : 0
      legs[0].rotation.x = sw * amp
      legs[3].rotation.x = sw * amp
      legs[1].rotation.x = -sw * amp
      legs[2].rotation.x = -sw * amp
      body.position.y = moving ? Math.abs(sw) * 0.02 : Math.sin(time * 2) * 0.005
      tail.rotation.z = Math.sin(time * (moving ? 9 : 2.5)) * 0.35
    },
    dispose() {
      root.traverse((o) => (o as THREE.Mesh).geometry?.dispose())
    },
  }
}

// ─── spirits and monsters ────────────────────────────────────────
function simple(root: THREE.Group, parts: THREE.Object3D, shadow: number, height: number, update: Model['update']): Model {
  root.add(parts)
  root.scale.setScalar(1.3)
  return {
    root,
    shadow,
    height,
    update,
    dispose() {
      root.traverse((o) => (o as THREE.Mesh).geometry?.dispose())
    },
  }
}

function fudeModel(mat: THREE.Material): Model {
  const root = new THREE.Group()
  const m = new Mesher()
  m.add(G.sphere, P.white, T([0, 0.25, 0], [0.19, 0.2, 0.17]))
  m.add(G.cone, P.white, T([0, 0.47, -0.02], [0.13, 0.26, 0.12], [-0.2, 0, 0]))
  m.add(G.cone, P.ink, T([0, 0.62, -0.06], [0.06, 0.14, 0.06], [-0.35, 0, 0]))
  m.add(G.sphere, P.orange, T([0, 0.7, -0.09], 0.045), { glow: 0.8 })
  eyes(m, 0.27, 0.15, 0.065, 0.032)
  for (const s of [-1, 1]) m.add(G.sphere, P.sakura, T([s * 0.11, 0.2, 0.13], [0.03, 0.015, 0.012]))
  const mesh = meshOf(m, mat)
  return simple(root, mesh, 0.35, 0.75, (_p, moving, _r, t) => {
    mesh.rotation.z = Math.sin(t * 1.6) * 0.08
    mesh.rotation.x = moving ? 0.25 : 0
  })
}

function wispModel(mat: THREE.Material): Model {
  const root = new THREE.Group()
  const m = new Mesher()
  m.add(G.sphere, P.ice, T([0, 0.45, 0], 0.17), { glow: 1 })
  m.add(G.sphere, P.white, T([0, 0.47, 0.05], 0.1), { glow: 1 })
  m.add(G.cone, P.ice, T([0, 0.25, -0.05], [0.12, -0.3, 0.1], [0.4, 0, 0]), { glow: 0.8 })
  eyes(m, 0.47, 0.155, 0.055, 0.03, P.navy)
  const mesh = meshOf(m, mat)
  mesh.castShadow = false
  return simple(root, mesh, 0.3, 0.7, (_p, _m, _r, t) => {
    mesh.position.y = Math.sin(t * 2) * 0.05
    mesh.rotation.y = Math.sin(t * 0.9) * 0.4
  })
}

function golemModel(mat: THREE.Material): Model {
  const root = new THREE.Group()
  const m = new Mesher()
  m.add(G.rock, P.stone, T([0, 0.35, 0], [0.3, 0.3, 0.26]))
  m.add(G.rock, P.stoneDark, T([0, 0.78, 0], [0.2, 0.18, 0.18], [0.3, 0.5, 0]))
  for (const s of [-1, 1]) {
    m.add(G.rock, P.stone, T([s * 0.36, 0.38, 0], [0.12, 0.2, 0.12], [0, 0, s * 0.3]))
    m.add(G.rock, P.stoneDark, T([s * 0.14, 0.08, 0], [0.12, 0.1, 0.12]))
    m.add(G.sphere, P.ice, T([s * 0.07, 0.8, 0.16], 0.035), { glow: 1 })
  }
  m.add(G.box, P.grass, T([0, 0.62, 0.02], [0.3, 0.04, 0.26]))
  const mesh = meshOf(m, mat)
  return simple(root, mesh, 0.75, 1.0, (p, moving, _r, t) => {
    mesh.rotation.z = moving ? Math.sin(p * Math.PI) * 0.08 : Math.sin(t) * 0.02
  })
}

function treantModel(mat: THREE.Material): Model {
  const root = new THREE.Group()
  const m = new Mesher(1.2)
  m.add(G.cyl, P.wood, T([0, 0.35, 0], [0.16, 0.7, 0.16]))
  m.add(G.cyl, P.woodDark, T([0, 0.1, 0], [0.22, 0.2, 0.22]))
  eyes(m, 0.48, 0.15, 0.06, 0.035, P.ink)
  m.add(G.box, P.woodDark, T([0, 0.36, 0.15], [0.12, 0.03, 0.02]))
  for (const [x, y, z, r] of [[0, 0.95, 0, 0.36], [-0.25, 0.82, 0.05, 0.25], [0.26, 0.85, -0.02, 0.26], [0, 1.15, -0.05, 0.25]])
    m.add(G.ball, x ? P.leaf : P.grass, T([x, y, z], r), { sway: 0.04 })
  for (const s of [-1, 1]) m.add(G.capsule, P.wood, T([s * 0.24, 0.5, 0], [0.04, 0.2, 0.04], [0, 0, s * 0.9]))
  const mesh = meshOf(m, mat)
  return simple(root, mesh, 0.7, 1.35, (p, moving, _r, t) => {
    mesh.rotation.z = moving ? Math.sin(p * Math.PI) * 0.1 : Math.sin(t * 0.8) * 0.03
  })
}

function tanukiModel(mat: THREE.Material): Model {
  const root = new THREE.Group()
  const m = new Mesher()
  m.add(G.sphere, P.wood, T([0, 0.28, 0], [0.22, 0.25, 0.2]))
  m.add(G.sphere, P.sand, T([0, 0.25, 0.1], [0.15, 0.17, 0.12]))
  m.add(G.sphere, P.wood, T([0, 0.6, 0.02], [0.17, 0.15, 0.15]))
  m.add(G.sphere, P.woodDark, T([0, 0.6, 0.11], [0.13, 0.05, 0.06]))
  eyes(m, 0.61, 0.15, 0.06, 0.028, P.paper)
  m.add(G.sphere, P.ink, T([0, 0.56, 0.16], 0.02))
  for (const s of [-1, 1]) {
    m.add(G.sphere, P.woodDark, T([s * 0.1, 0.73, 0], 0.045))
    m.add(G.sphere, P.woodDark, T([s * 0.1, 0.05, 0.05], [0.06, 0.04, 0.08]))
  }
  m.add(G.sphere, P.leaf, T([0, 0.78, 0], [0.09, 0.02, 0.06], [0, 0.4, 0.2]))
  m.add(G.capsule, P.woodDark, T([0, 0.15, -0.2], [0.07, 0.12, 0.07], [-0.9, 0, 0]))
  const mesh = meshOf(m, mat)
  return simple(root, mesh, 0.5, 0.85, (p, moving, _r, t) => {
    mesh.position.y = moving ? Math.abs(Math.sin(p * Math.PI)) * 0.04 : 0
    mesh.rotation.z = Math.sin(t * 1.5) * 0.04
  })
}

function dragonModel(mat: THREE.Material): Model {
  const root = new THREE.Group()
  const v = P.violet
  const d = P.night
  const m = new Mesher()
  m.add(G.sphere, v, T([0, 0.7, 0], [0.5, 0.45, 0.6]))
  m.add(G.sphere, P.lilac, T([0, 0.62, 0.3], [0.32, 0.3, 0.3]))
  m.add(G.capsule, v, T([0, 1.2, 0.35], [0.16, 0.35, 0.16], [0.5, 0, 0]))
  m.add(G.sphere, v, T([0, 1.6, 0.55], [0.26, 0.22, 0.3]))
  m.add(G.sphere, v, T([0, 1.55, 0.8], [0.16, 0.12, 0.16]))
  eyes(m, 1.66, 0.76, 0.12, 0.05, P.gold)
  for (const s of [-1, 1]) {
    m.add(G.cone, P.paper, T([s * 0.13, 1.85, 0.45], [0.05, 0.25, 0.05], [-0.5, 0, -s * 0.3]))
    m.add(G.capsule, d, T([s * 0.3, 0.25, 0.1], [0.12, 0.2, 0.12]))
  }
  m.add(G.cone, v, T([0, 0.5, -0.8], [0.18, 0.9, 0.18], [-1.9, 0, 0]))
  const body = meshOf(m, mat)
  const wings: THREE.Group[] = []
  for (const s of [-1, 1]) {
    const w = new Mesher()
    w.add(G.cone4, d, T([s * 0.55, 0.1, 0], [0.55, 0.9, 0.05], [0, 0, -s * 1.2]))
    w.add(G.cone4, v, T([s * 0.5, 0.05, 0.02], [0.4, 0.7, 0.04], [0, 0, -s * 1.2]))
    const g = pivot(root, s * 0.3, 1.0, -0.1, meshOf(w, mat))
    wings.push(g)
  }
  return simple(root, body, 1.6, 2.1, (_p, _m, _r, t) => {
    const f = Math.sin(t * 2.2)
    wings[0].rotation.z = 0.3 + f * 0.35
    wings[1].rotation.z = -0.3 - f * 0.35
    body.position.y = Math.sin(t * 1.1) * 0.04
  })
}

const BUILD: Record<string, (mat: THREE.Material, outfit?: string) => Model> = {
  fude: fudeModel,
  wisp: wispModel,
  golem: golemModel,
  treant: treantModel,
  tanuki: tanukiModel,
  dragon: dragonModel,
}

/** A fresh model instance for a sprite id (falls back to a villager). */
export function buildModel(id: string, mat: THREE.Material, outfit?: string): Model {
  if (BUILD[id]) return BUILD[id](mat, outfit)
  if (BEASTS[id]) return beastModel(id, mat)
  return humanModel(HUMANS[id] ? id : 'villager-b', mat, outfit)
}

/** Whether a smooth model exists for this sprite (others keep the voxel fallback). */
export function hasModel(id: string): boolean {
  return !!(BUILD[id] || BEASTS[id] || HUMANS[id])
}

export { mix }

/**
 * Turns a parsed tile map into a 3D diorama (HD-2D style):
 *  - one ground plane textured with every flat tile (4× upscaled),
 *  - walls and cliffs extruded into blocks (wide multi-row walls become tall facades),
 *  - roofs raised into sloped gables over their walls,
 *  - trees, lanterns and props stood up as cut-out cards that sway in the wind.
 *
 * Units: 1 = one tile. X = east, Z = south, Y = up.
 */
import * as THREE from 'three'
import { computeNeighbours, tileCanvas, tileFrame, tileVariant, type TileId } from '../art/tiles'
import { frameCount } from '../art/tiles'
import type { GameMap } from '../world/types'
import type { Atlas, UvRect } from './atlas'
import { upscaleCanvas } from './upscale'
import { PAL } from '../art/palette'
import { VoxelBuilder, voxelGeometry } from './voxel'
import { Mesher, rnd } from './models/kit'
import { addProp, hasProp } from './models/props'
import { NATURAL, propAsset } from './models/propglb'

/** World units per 16 px of height (vertical art stands a little taller than the ground squash). */
export const VS = 1.35
/** Depth inside a cell where standing things plant their feet. */
export const ANCHOR = 0.72

/** Walkable objects painted flat into the ground. */
const FLAT = new Set<TileId>(['bridge-h', 'bridge-v', 'stepping-stone', 'carpet', 'stairs-up', 'stairs-down', 'gate-open', 'lily', 'flowers', 'tall-grass', 'chest-open'])
/** Flat but animated: drawn as decals just above the ground. */
const DECAL = new Set<TileId>(['portal', 'warp-circle'])
/** Extruded into blocks. */
const SOLID = new Set<TileId>(['wall', 'wall-window', 'door', 'noren', 'stone-wall', 'castle-wall', 'tower-wall', 'cliff', 'cave', 'bookshelf', 'gate-closed'])
/** Raised into sloped roofs. */
const ROOF = new Set<TileId>(['roof', 'roof-edge', 'roof-red', 'roof-red-edge', 'shop-awning'])
/** Cards that sway in the wind (amount at the top edge, in tiles). */
const SWAY: Partial<Record<TileId, number>> = { tree: 0.05, pine: 0.035, sakura: 0.06, bamboo: 0.08, bush: 0.03, torii: 0 }

/** Cut-out grass blades stood up in tall-grass cells (two variants, cached). */
const blades: HTMLCanvasElement[] = []
function bladeCanvas(v: number): HTMLCanvasElement {
  if (blades[v]) return blades[v]
  const c = document.createElement('canvas')
  c.width = c.height = 16
  const g = c.getContext('2d')!
  let seed = 7 + v * 31
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const cols = [PAL.leafDark, PAL.leaf, PAL.grass, PAL.grassLight]
  for (let i = 0; i < 11; i++) {
    let x = Math.floor(rnd() * 15)
    const h = 5 + Math.floor(rnd() * 10)
    const lean = rnd() < 0.5 ? -1 : 1
    for (let k = 0; k < h; k++) {
      const y = 15 - k
      if (k > 2 && k % 4 === 3) x = Math.max(0, Math.min(15, x + lean))
      const t = k / h
      g.fillStyle = cols[Math.min(3, Math.floor(t * 3.2) + (i % 3 === 0 ? 1 : 0))]
      g.fillRect(x, y, 1, 1)
    }
  }
  blades[v] = c
  return c
}

export interface DynQuad {
  /** First vertex index in the owning geometry. */
  v: number
  id: TileId
  variant: number
  nb: number
  x: number
  y: number
  frame: number
}

class Quads {
  pos: number[] = []
  nor: number[] = []
  uv: number[] = []
  sway: number[] = []
  idx: number[] = []
  get count() {
    return this.pos.length / 3
  }
  /** Quad from 4 corners (bl, br, tr, tl) with a UV rect (optionally a sub-rect in tile space). */
  add(bl: number[], br: number[], tr: number[], tl: number[], r: UvRect, n: number[], sway = 0, sub?: [number, number, number, number]): number {
    const v = this.count
    this.pos.push(...bl, ...br, ...tr, ...tl)
    for (let i = 0; i < 4; i++) this.nor.push(...n)
    const [a, b, c, d] = sub ?? [0, 0, 1, 1] // u0, v0, u1, v1 inside the tile
    const U = (t: number) => r.u0 + (r.u1 - r.u0) * t
    const V = (t: number) => r.v0 + (r.v1 - r.v0) * t
    this.uv.push(U(a), V(b), U(c), V(b), U(c), V(d), U(a), V(d))
    this.sway.push(0, 0, sway, sway)
    this.idx.push(v, v + 1, v + 2, v, v + 2, v + 3)
    return v
  }
  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2))
    g.setAttribute('aSway', new THREE.Float32BufferAttribute(this.sway, 1))
    g.setIndex(this.idx)
    g.computeBoundingSphere()
    return g
  }
}

/** Card normal: tilted toward the camera so upright art catches sun and sky like the ground does. */
export const CARD_N = [0, 0.55, 0.835]

export function setQuadUv(g: THREE.BufferGeometry, v: number, r: UvRect) {
  const uv = g.getAttribute('uv') as THREE.BufferAttribute
  uv.setXY(v, r.u0, r.v0)
  uv.setXY(v + 1, r.u1, r.v0)
  uv.setXY(v + 2, r.u1, r.v1)
  uv.setXY(v + 3, r.u0, r.v1)
  uv.needsUpdate = true
}

export interface Diorama {
  ground: THREE.Mesh
  groundTex: THREE.CanvasTexture
  /** Blocks, roofs and static cards (atlas material). */
  statics: THREE.Mesh
  /** Animated cards and decals (UVs rewritten when their frame changes). */
  dynamic: THREE.Mesh
  dyn: DynQuad[]
  /** Voxel props, chunked 8×8 tiles for culling. */
  voxels: THREE.Group
  /** Animated voxel props (geometry swapped per frame). */
  dynVox: DynVox[]
  dispose(): void
}

export interface DynVox {
  mesh: THREE.Mesh
  id: TileId
  variant: number
  nb: number
  x: number
  y: number
  frame: number
  depth: number
}

/** Voxel depth (thickest point, in pixels) per prop; default 5. */
const DEPTH: Partial<Record<TileId, number>> = {
  tree: 7, sakura: 7, pine: 7, bamboo: 4, bush: 7, rock: 7, boulder: 9, stump: 6, statue: 6, well: 8, lantern: 5,
  sign: 2, fence: 2, torii: 3, stall: 6, barrel: 7, crate: 8, pot: 7, chest: 8, 'chest-open': 8, anvil: 6, tablet: 3,
  altar: 6, throne: 6, campfire: 5, 'shrine-bell': 4,
}
export function voxDepth(id: TileId): number {
  return DEPTH[id] ?? 5
}

export function buildDiorama(m: GameMap, atlas: Atlas, cardMat: THREE.Material, groundMat: THREE.MeshLambertMaterial, groundUp: number, voxMat: THREE.Material, toonMat: THREE.Material): Diorama {
  const W = m.w
  const H = m.h
  const inb = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H
  const o = (x: number, y: number) => (inb(x, y) ? m.obj[y * W + x] : null)
  const gGet = (x: number, y: number) => (inb(x, y) ? m.ground[y * W + x] : null)
  const oGet = (x: number, y: number) => (inb(x, y) ? (m.obj[y * W + x] ?? m.ground[y * W + x]) : null)
  const vGet = (x: number, y: number) => (inb(x, y) ? (m.over[y * W + x] ?? m.ground[y * W + x]) : null)
  const objNb = (x: number, y: number) => computeNeighbours(oGet, x, y)
  const bare = (id: TileId, x: number, y: number, frame = 0, nb = objNb(x, y)) => atlas.get(tileCanvas(id, tileVariant(id, x, y), frame, nb, id))

  // ── ground texture: ground tiles + flat objects, frame 0 ──
  const gc = document.createElement('canvas')
  gc.width = W * 16
  gc.height = H * 16
  const g = gc.getContext('2d')!
  g.imageSmoothingEnabled = false
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const gid = m.ground[i]
      g.drawImage(tileCanvas(gid, tileVariant(gid, x, y), 0, computeNeighbours(gGet, x, y)), x * 16, y * 16)
      const ob = m.obj[i]
      if (ob && (FLAT.has(ob) || SOLID.has(ob) || ROOF.has(ob))) {
        // flat objects are painted; under blocks/roofs paint a darker floor (hidden, but seen at edges)
        if (FLAT.has(ob)) g.drawImage(tileCanvas(ob, tileVariant(ob, x, y), 0, objNb(x, y), ob), x * 16, y * 16)
      }
    }
  const big = groundUp > 0 ? upscaleCanvas(gc, groundUp) : gc
  const groundTex = new THREE.CanvasTexture(big)
  groundTex.colorSpace = THREE.SRGBColorSpace
  groundTex.magFilter = THREE.LinearFilter
  groundTex.minFilter = THREE.LinearMipmapLinearFilter
  groundTex.anisotropy = 8
  const gg = new THREE.PlaneGeometry(W, H)
  gg.rotateX(-Math.PI / 2)
  gg.translate(W / 2, 0, H / 2)
  groundMat.map = groundTex
  groundMat.needsUpdate = true
  const ground = new THREE.Mesh(gg, groundMat)
  ground.receiveShadow = true

  const st = new Quads()
  const dq = new Quads()
  const dyn: DynQuad[] = []

  // ── blocks ──
  const isSolid = (x: number, y: number) => {
    const t = o(x, y)
    return !!t && SOLID.has(t)
  }
  const rowRun = (x: number, y: number) => {
    let a = x
    let b = x
    while (isSolid(a - 1, y)) a--
    while (isSolid(b + 1, y)) b++
    return b - a + 1
  }
  const facade = (x: number, y: number) => isSolid(x, y) && rowRun(x, y) >= 3
  /** Height (tiles) of the block a solid cell belongs to, and its southmost row. */
  const blockOf = new Map<number, { h: number; top: number; bottom: number }>()
  for (let x = 0; x < W; x++) {
    let y = 0
    while (y < H) {
      if (!facade(x, y)) {
        y++
        continue
      }
      const ya = y
      while (facade(x, y + 1)) y++
      const yb = y
      const L = yb - ya + 1
      const b = { h: Math.min(L, 5) * VS, top: ya, bottom: yb }
      for (let k = ya; k <= yb; k++) blockOf.set(k * W + x, b)
      y++
    }
  }
  const heightAt = (x: number, y: number) => (isSolid(x, y) ? (blockOf.get(y * W + x)?.h ?? VS) : 0)
  const UP = [0, 1, 0]
  const SOUTH = [0, 0, 1]
  const WEST = [-1, 0, 0]
  const EAST = [1, 0, 0]
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!isSolid(x, y)) continue
      const blk = blockOf.get(y * W + x)
      const h = blk?.h ?? VS
      const id = o(x, y)!
      const r = bare(id, x, y)
      if (blk) {
        // tall facade: only the southmost cell emits the front; rows stack upward
        const L = blk.bottom - blk.top + 1
        const band = h / L
        if (y === blk.bottom) {
          for (let k = blk.top; k <= blk.bottom; k++) {
            const y0 = (blk.bottom - k) * band
            const rk = bare(o(x, k)!, x, k)
            st.add([x, y0, y + 1], [x + 1, y0, y + 1], [x + 1, y0 + band, y + 1], [x, y0 + band, y + 1], rk, SOUTH)
          }
        }
        // top cap
        const rt = bare(o(x, blk.top)!, x, blk.top)
        st.add([x, h, y + 1], [x + 1, h, y + 1], [x + 1, h, y], [x, h, y], rt, UP)
        // sides where the neighbour is lower
        if (heightAt(x - 1, y) < h) {
          const lo = heightAt(x - 1, y)
          st.add([x, lo, y], [x, lo, y + 1], [x, h, y + 1], [x, h, y], r, WEST, 0, [0, lo / h, 1, 1])
        }
        if (heightAt(x + 1, y) < h) {
          const lo = heightAt(x + 1, y)
          st.add([x + 1, lo, y + 1], [x + 1, lo, y], [x + 1, h, y], [x + 1, h, y + 1], r, EAST, 0, [0, lo / h, 1, 1])
        }
      } else {
        if (heightAt(x, y + 1) < h) st.add([x, 0, y + 1], [x + 1, 0, y + 1], [x + 1, h, y + 1], [x, h, y + 1], r, SOUTH)
        st.add([x, h, y + 1], [x + 1, h, y + 1], [x + 1, h, y], [x, h, y], r, UP)
        if (heightAt(x - 1, y) < h) st.add([x, 0, y], [x, 0, y + 1], [x, h, y + 1], [x, h, y], r, WEST)
        if (heightAt(x + 1, y) < h) st.add([x + 1, 0, y + 1], [x + 1, 0, y], [x + 1, h, y], [x + 1, h, y + 1], r, EAST)
      }
    }

  // ── roofs: each column of roof cells becomes a gable over the wall below ──
  const isRoof = (x: number, y: number) => {
    const t = o(x, y)
    return !!t && ROOF.has(t)
  }
  const SLOPE = 0.62
  const OVER = 0.22
  for (let x = 0; x < W; x++) {
    let y = 0
    while (y < H) {
      if (!isRoof(x, y)) {
        y++
        continue
      }
      const r0 = y
      while (isRoof(x, y + 1)) y++
      const r1 = y
      y++
      const wallBelow = isSolid(x, r1 + 1)
      const eaveH = wallBelow ? heightAt(x, r1 + 1) : VS
      const zBack = r0
      const zWall = wallBelow ? r1 + 2 : r1 + 1
      const zFront = zWall + OVER
      const zMid = (zBack + zWall) / 2
      const ridge = eaveH + (zWall - zMid) * SLOPE
      const roofY = (z: number) => (z >= zMid ? ridge - (z - zMid) * SLOPE : ridge - (zMid - z) * SLOPE)
      const n = r1 - r0 + 1
      // param t: 0 = front eave … 1 = back
      const P = (t: number): [number, number] => {
        const z = zFront + (zBack - zFront) * t
        return [roofY(z), z]
      }
      const seg = n * 2
      for (let s = 0; s < seg; s++) {
        const ta = s / seg
        const tb = (s + 1) / seg
        // row index from the front: s>>1 ; rows run r1 (front) … r0 (back)
        const row = r1 - (s >> 1)
        const half = s & 1
        const rr = bare(o(x, row)!, x, row)
        const [ya, za] = P(ta)
        const [yb, zb] = P(tb)
        const nrm = tb <= 0.5 ? [0, 0.85, 0.53] : [0, 0.85, -0.53]
        // tile v runs bottom(0)→top(1); the front half of a row is its lower half
        st.add([x - (isRoof(x - 1, row) ? 0 : 0.12), ya, za], [x + 1 + (isRoof(x + 1, row) ? 0 : 0.12), ya, za], [x + 1 + (isRoof(x + 1, row) ? 0 : 0.12), yb, zb], [x - (isRoof(x - 1, row) ? 0 : 0.12), yb, zb], rr, nrm, 0, [0, half * 0.5, 1, half * 0.5 + 0.5])
      }
      // gable ends (and walls under the roof) where the roof region ends
      const wallId: TileId = wallBelow ? o(x, r1 + 1)! : 'wall'
      for (const side of [-1, 1]) {
        if (isRoof(x + side, r0) || isRoof(x + side, r1)) continue
        const X = side < 0 ? x : x + 1
        const nrm = side < 0 ? WEST : EAST
        const rw = bare(wallId === 'door' || wallId === 'noren' ? 'wall' : wallId, x, r1 + 1, 0, 0)
        for (let z = zBack; z < zWall; z++) {
          const z1 = Math.min(zWall, z + 1)
          const za = side < 0 ? z : z1
          const zb = side < 0 ? z1 : z
          st.add([X, 0, za], [X, 0, zb], [X, eaveH, zb], [X, eaveH, za], rw, nrm)
          const ta = roofY(za)
          const tb = roofY(zb)
          if (Math.max(ta, tb) > eaveH + 0.01) st.add([X, eaveH, za], [X, eaveH, zb], [X, tb, zb], [X, ta, za], rw, nrm, 0, [0, 0.5, 1, 1])
        }
      }
    }
  }

  // ── cards and decals ──
  const place = (id: TileId, x: number, y: number, nb: number) => {
    const frames = frameCount(id)
    const variant = tileVariant(id, x, y)
    if (DECAL.has(id)) {
      for (let f = 0; f < frames; f++) atlas.get(tileCanvas(id, variant, f, nb, id))
      const v = dq.add([x, 0.02, y + 1], [x + 1, 0.02, y + 1], [x + 1, 0.02, y], [x, 0.02, y], atlas.get(tileCanvas(id, variant, 0, nb, id)), UP)
      dyn.push({ v, id, variant, nb, x, y, frame: 0 })
      return
    }
    if (propAsset(id)) {
      // a run of torii across a wide path is one wider gate
      let span = 1
      if (id === 'torii') {
        const isT = (xx: number) => xx >= 0 && xx < W && (m.obj[y * W + xx] === 'torii' || m.over[y * W + xx] === 'torii')
        if (isT(x - 1)) return
        while (isT(x + span)) span++
      }
      const ck = `${id}|${Math.floor(x / 8) + Math.floor(y / 8) * 1000}`
      let list = placed.get(ck)
      if (!list) placed.set(ck, (list = []))
      list.push([x + (span - 1) / 2, y, span])
      return
    }
    if (hasProp(id)) {
      const ck = Math.floor(x / 8) + Math.floor(y / 8) * 1000
      let tm = smooth.get(ck)
      if (!tm) smooth.set(ck, (tm = new Mesher(1.2)))
      addProp(tm, id, [x + 0.5, 0, y + 0.55], { v: variant, x, y, nb })
      return
    }
    const depth = voxDepth(id)
    if (frames > 1) {
      const mesh = new THREE.Mesh(voxelGeometry(tileCanvas(id, variant, 0, nb, id), depth), voxMat)
      mesh.position.set(x + 0.5, 0, y + ANCHOR)
      mesh.castShadow = true
      mesh.receiveShadow = true
      voxels.add(mesh)
      dynVox.push({ mesh, id, variant, nb, x, y, frame: 0, depth })
      return
    }
    const ck = Math.floor(x / 8) + Math.floor(y / 8) * 1000
    let vb = chunks.get(ck)
    if (!vb) chunks.set(ck, (vb = new VoxelBuilder()))
    vb.add(tileCanvas(id, variant, 0, nb, id), x + 0.5, 0, y + ANCHOR, { depth, sway: SWAY[id] ?? 0 })
  }
  const voxels = new THREE.Group()
  const dynVox: DynVox[] = []
  const chunks = new Map<number, VoxelBuilder>()
  const smooth = new Map<number, Mesher>()
  /** Generated-model props, per tile id and 8×8 chunk (instanced, culled per chunk). */
  const placed = new Map<string, [x: number, y: number, span: number][]>()
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (m.ground[y * W + x] !== 'tall-grass' || m.obj[y * W + x]) continue
      for (let k = 0; k < 3; k++) {
        const r = atlas.get(bladeCanvas((x * 3 + y * 5 + k) % 2))
        const z = y + 0.2 + k * 0.33
        const j = (((x * 7 + y * 13 + k * 5) % 5) - 2) * 0.06
        const h = VS * (0.42 + ((x + y + k) % 3) * 0.06)
        st.add([x - 0.1 + j, 0, z], [x + 1.1 + j, 0, z], [x + 1.1 + j, h, z], [x - 0.1 + j, h, z], r, CARD_N, 0.07)
      }
    }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const ob = m.obj[i]
      if (ob && !FLAT.has(ob) && !SOLID.has(ob) && !ROOF.has(ob)) place(ob, x, y, objNb(x, y))
      const ov = m.over[i]
      if (ov) place(ov, x, y, computeNeighbours(vGet, x, y))
    }

  for (const tm of smooth.values()) {
    const mesh = new THREE.Mesh(tm.geometry(), toonMat)
    mesh.castShadow = true
    mesh.receiveShadow = true
    voxels.add(mesh)
  }
  const mtx = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const pos = new THREE.Vector3()
  const scl = new THREE.Vector3()
  const yAxis = new THREE.Vector3(0, 1, 0)
  for (const [ck, cells] of placed) {
    const id = ck.slice(0, ck.indexOf('|')) as TileId
    const pa = propAsset(id)!
    const mesh = new THREE.InstancedMesh(pa.geometry, pa.material, cells.length)
    const natural = NATURAL.has(id)
    cells.forEach(([x, y, span], i) => {
      const s = natural ? 0.88 + rnd(x, y, 7) * 0.24 : 1
      pos.set(x + 0.5 + (natural ? (rnd(x, y, 3) - 0.5) * 0.12 : 0), 0, y + 0.55 + (natural ? (rnd(y, x, 5) - 0.5) * 0.12 : 0))
      q.setFromAxisAngle(yAxis, natural ? rnd(x, y, 11) * Math.PI * 2 : 0)
      // wide gates stretch sideways more than they grow taller
      if (span > 1) scl.set(0.8 * span, 0.6 + 0.3 * span, 0.6 + 0.3 * span)
      else scl.set(s, s, s)
      mesh.setMatrixAt(i, mtx.compose(pos, q, scl))
    })
    mesh.computeBoundingSphere()
    mesh.castShadow = true
    mesh.receiveShadow = true
    // geometry and material belong to the shared prop cache
    mesh.userData.shared = true
    mesh.userData.scenery = natural
    voxels.add(mesh)
  }
  for (const vb of chunks.values()) {
    const mesh = new THREE.Mesh(vb.geometry(), voxMat)
    mesh.castShadow = true
    mesh.receiveShadow = true
    voxels.add(mesh)
  }
  const statics = new THREE.Mesh(st.geometry(), cardMat)
  statics.castShadow = true
  statics.receiveShadow = true
  const dynamic = new THREE.Mesh(dq.geometry(), cardMat)
  dynamic.castShadow = true
  dynamic.receiveShadow = true
  return {
    ground,
    groundTex,
    statics,
    dynamic,
    dyn,
    voxels,
    dynVox,
    dispose() {
      for (const c of voxels.children) if (!c.userData.shared && !dynVox.some((d) => d.mesh === c)) (c as THREE.Mesh).geometry.dispose()
      gg.dispose()
      groundTex.dispose()
      statics.geometry.dispose()
      dynamic.geometry.dispose()
    },
  }
}

/** Advance animated cards/decals/voxel props; returns true when any UV changed. */
export function animateDyn(d: Diorama, atlas: Atlas, now: number): boolean {
  for (const q of d.dynVox) {
    const f = tileFrame(q.id, now, q.x, q.y)
    if (f === q.frame) continue
    q.frame = f
    q.mesh.geometry = voxelGeometry(tileCanvas(q.id, q.variant, f, q.nb, q.id), q.depth)
  }
  let changed = false
  for (const q of d.dyn) {
    const f = tileFrame(q.id, now, q.x, q.y)
    if (f === q.frame) continue
    q.frame = f
    setQuadUv(d.dynamic.geometry, q.v, atlas.get(tileCanvas(q.id, q.variant, f, q.nb, q.id)))
    changed = true
  }
  return changed
}

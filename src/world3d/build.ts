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
import { G, Mesher, rnd, T } from './models/kit'
import { addProp, hasProp } from './models/props'
import { NATURAL, propAsset } from './models/propglb'
import { GROUND_TEX, terrainLayers, WATER, type HdAtlas } from './hdtex'
import { buildOutskirts, magicFx, MARGIN } from './fx3d'

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

/** Uniforms the ground material's terrain shader reads (owned by the renderer). */
export interface TerrainUniforms {
  uTerrain: { value: number }
  uIds: { value: THREE.DataTexture | null }
  uLayers: { value: THREE.DataArrayTexture | null }
  uMapSize: { value: THREE.Vector2 }
}

export function buildDiorama(m: GameMap, atlas: Atlas, cardMat: THREE.Material, groundMat: THREE.MeshLambertMaterial, groundUp: number, voxMat: THREE.Material, toonMat: THREE.Material, hd: HdAtlas | null = null, hdMat: THREE.Material | null = null): Diorama {
  const W = m.w
  const H = m.h
  const inb = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H
  const o = (x: number, y: number) => (inb(x, y) ? m.obj[y * W + x] : null)
  const gGet = (x: number, y: number) => (inb(x, y) ? m.ground[y * W + x] : null)
  const oGet = (x: number, y: number) => (inb(x, y) ? (m.obj[y * W + x] ?? m.ground[y * W + x]) : null)
  const vGet = (x: number, y: number) => (inb(x, y) ? (m.over[y * W + x] ?? m.ground[y * W + x]) : null)
  const objNb = (x: number, y: number) => computeNeighbours(oGet, x, y)
  const bare = (id: TileId, x: number, y: number, frame = 0, nb = objNb(x, y)) => atlas.get(tileCanvas(id, tileVariant(id, x, y), frame, nb, id))
  // HD faces (walls, roofs, cliffs) go in their own mesh on the HD atlas
  const hq = new Quads()
  const hdRects = new WeakSet<UvRect>()
  const face = (id: TileId, x: number, y: number, frame = 0, nb?: number): UvRect => {
    const r = hdMat ? hd?.rect(id) : null
    if (r) {
      hdRects.add(r)
      return r
    }
    return bare(id, x, y, frame, nb)
  }
  const S = (r: UvRect) => (hdRects.has(r) ? hq : st)
  /** Bridges are built in 3D from HD wood when it's available. */
  const woodRect = hdMat ? (hd?.rect('bridge-h') ?? null) : null
  if (woodRect) hdRects.add(woodRect)
  const isBridge = (id: TileId | null | undefined) => id === 'bridge-h' || id === 'bridge-v'
  const modeled = (id: TileId) => !!propAsset(id) || (isBridge(id) && !!woodRect) || (id === 'lily' && !!terrainLayers())

  // ── ground: HD terrain (per-tile material ids blended in the shader) with the
  // remaining pixel art as an overlay, or the pixel tiles alone ──
  const terrain = terrainLayers()
  const tu = groundMat.userData.terrain as TerrainUniforms | undefined
  let idsTex: THREE.DataTexture | null = null
  const layerOf = (id: TileId | null | undefined) => (terrain && id ? terrain.index.get(GROUND_TEX[id] ?? '') : undefined)
  const gc = document.createElement('canvas')
  gc.width = W * 16
  gc.height = H * 16
  const g = gc.getContext('2d')!
  g.imageSmoothingEnabled = false
  const ids = terrain ? new Uint8Array(W * H * 4) : null
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const gid = m.ground[i]
      const ob = m.obj[i]
      // a flower or tall-grass object is just a different patch of ground
      const soft = ob === 'flowers' || ob === 'tall-grass' ? ob : null
      const layer = layerOf(soft ?? gid) ?? (soft ? layerOf(gid) : undefined)
      if (ids && layer !== undefined) {
        ids[i * 4] = layer
        ids[i * 4 + 1] = m.ground[i] === 'water-deep' ? 2 : WATER.has(gid) ? 1 : 0
        ids[i * 4 + 3] = 255
      } else {
        if (ids) {
          ids[i * 4] = layerOf('grass') ?? 0
          ids[i * 4 + 3] = 255
        }
        g.drawImage(tileCanvas(gid, tileVariant(gid, x, y), 0, computeNeighbours(gGet, x, y)), x * 16, y * 16)
      }
      // flat objects are painted (with terrain on, onto a transparent overlay)
      if (ob && FLAT.has(ob) && !modeled(ob) && !(ids && soft && layer !== undefined)) g.drawImage(tileCanvas(ob, tileVariant(ob, x, y), 0, objNb(x, y), ob), x * 16, y * 16)
    }
  if (ids && tu) {
    idsTex = new THREE.DataTexture(ids, W, H, THREE.RGBAFormat)
    idsTex.magFilter = idsTex.minFilter = THREE.NearestFilter
    idsTex.needsUpdate = true
    tu.uIds.value = idsTex
    tu.uLayers.value = terrain!.tex
    tu.uMapSize.value.set(W, H)
    tu.uTerrain.value = 1
  } else if (tu) tu.uTerrain.value = 0
  const big = groundUp > 0 ? upscaleCanvas(gc, groundUp) : gc
  const groundTex = new THREE.CanvasTexture(big)
  groundTex.colorSpace = THREE.SRGBColorSpace
  groundTex.magFilter = THREE.LinearFilter
  groundTex.minFilter = THREE.LinearMipmapLinearFilter
  groundTex.anisotropy = 8
  // with HD terrain the ground carries on past the edge (the shader extends the edge tiles)
  const M = idsTex ? MARGIN : 0
  const gg = new THREE.PlaneGeometry(W + M * 2, H + M * 2)
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
      const r = face(id, x, y)
      if (blk) {
        // tall facade: only the southmost cell emits the front; rows stack upward
        const L = blk.bottom - blk.top + 1
        const band = h / L
        if (y === blk.bottom) {
          for (let k = blk.top; k <= blk.bottom; k++) {
            const y0 = (blk.bottom - k) * band
            const rk = face(o(x, k)!, x, k)
            S(rk).add([x, y0, y + 1], [x + 1, y0, y + 1], [x + 1, y0 + band, y + 1], [x, y0 + band, y + 1], rk, SOUTH)
          }
        }
        // top cap
        const rt = face(o(x, blk.top)!, x, blk.top)
        S(rt).add([x, h, y + 1], [x + 1, h, y + 1], [x + 1, h, y], [x, h, y], rt, UP)
        // sides where the neighbour is lower
        if (heightAt(x - 1, y) < h) {
          const lo = heightAt(x - 1, y)
          S(r).add([x, lo, y], [x, lo, y + 1], [x, h, y + 1], [x, h, y], r, WEST, 0, [0, lo / h, 1, 1])
        }
        if (heightAt(x + 1, y) < h) {
          const lo = heightAt(x + 1, y)
          S(r).add([x + 1, lo, y + 1], [x + 1, lo, y], [x + 1, h, y], [x + 1, h, y + 1], r, EAST, 0, [0, lo / h, 1, 1])
        }
      } else {
        if (heightAt(x, y + 1) < h) S(r).add([x, 0, y + 1], [x + 1, 0, y + 1], [x + 1, h, y + 1], [x, h, y + 1], r, SOUTH)
        S(r).add([x, h, y + 1], [x + 1, h, y + 1], [x + 1, h, y], [x, h, y], r, UP)
        if (heightAt(x - 1, y) < h) S(r).add([x, 0, y], [x, 0, y + 1], [x, h, y + 1], [x, h, y], r, WEST)
        if (heightAt(x + 1, y) < h) S(r).add([x + 1, 0, y + 1], [x + 1, 0, y], [x + 1, h, y], [x + 1, h, y + 1], r, EAST)
      }
    }

  // ── bridges: plank deck, posts, rails and piles in HD wood, joined along each run ──
  if (woodRect) {
    const wr = woodRect
    /** Box from local coords: a = along the bridge, c = across it (0..1 within the tile). */
    const box = (x: number, y: number, horiz: boolean, a0: number, a1: number, y0: number, y1: number, c0: number, c1: number, planks = false) => {
      const P = (a: number, h: number, c: number): number[] => (horiz ? [x + a, h, y + c] : [x + c, h, y + a])
      const n = (v: number[]): number[] => (horiz ? v : [v[2], v[1], v[0]])
      // top: planks run across the direction of travel
      if (planks) S(wr).add(P(a0, y1, c1), P(a0, y1, c0), P(a1, y1, c0), P(a1, y1, c1), wr, UP)
      else S(wr).add(P(a0, y1, c1), P(a1, y1, c1), P(a1, y1, c0), P(a0, y1, c0), wr, UP, 0, [0, 0, 1, 0.2])
      // long sides and ends
      S(wr).add(P(a0, y0, c1), P(a1, y0, c1), P(a1, y1, c1), P(a0, y1, c1), wr, n(SOUTH), 0, [0, 0.4, 1, 0.5])
      S(wr).add(P(a1, y0, c0), P(a0, y0, c0), P(a0, y1, c0), P(a1, y1, c0), wr, n([0, 0, -1]), 0, [0, 0.4, 1, 0.5])
      S(wr).add(P(a0, y0, c0), P(a0, y0, c1), P(a0, y1, c1), P(a0, y1, c0), wr, n(WEST), 0, [0, 0.6, 0.2, 0.7])
      S(wr).add(P(a1, y0, c1), P(a1, y0, c0), P(a1, y1, c0), P(a1, y1, c1), wr, n(EAST), 0, [0, 0.6, 0.2, 0.7])
    }
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const id = o(x, y)
        if (!isBridge(id)) continue
        const horiz = id === 'bridge-h'
        const prev = horiz ? o(x - 1, y) : o(x, y - 1)
        const next = horiz ? o(x + 1, y) : o(x, y + 1)
        // deck
        box(x, y, horiz, 0, 1, -0.05, 0.07, 0.06, 0.94, true)
        // rails on both sides, posts at each tile end, piles into the water
        for (const c of [0.06, 0.88]) {
          box(x, y, horiz, 0, 1, 0.34, 0.41, c, c + 0.06)
          box(x, y, horiz, 0.02, 0.98, 0.18, 0.22, c + 0.01, c + 0.05)
          box(x, y, horiz, 0.44, 0.56, -0.35, -0.05, c, c + 0.06)
          if (!isBridge(prev)) box(x, y, horiz, 0, 0.1, 0.07, 0.47, c - 0.01, c + 0.07)
          if (!isBridge(next)) box(x, y, horiz, 0.9, 1, 0.07, 0.47, c - 0.01, c + 0.07)
          else box(x, y, horiz, 0.95, 1.05, 0.07, 0.44, c, c + 0.06)
        }
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
        const rr = face(o(x, row)!, x, row)
        const [ya, za] = P(ta)
        const [yb, zb] = P(tb)
        const nrm = tb <= 0.5 ? [0, 0.85, 0.53] : [0, 0.85, -0.53]
        // tile v runs bottom(0)→top(1); the front half of a row is its lower half
        S(rr).add([x - (isRoof(x - 1, row) ? 0 : 0.12), ya, za], [x + 1 + (isRoof(x + 1, row) ? 0 : 0.12), ya, za], [x + 1 + (isRoof(x + 1, row) ? 0 : 0.12), yb, zb], [x - (isRoof(x - 1, row) ? 0 : 0.12), yb, zb], rr, nrm, 0, [0, half * 0.5, 1, half * 0.5 + 0.5])
      }
      // gable ends (and walls under the roof) where the roof region ends
      const wallId: TileId = wallBelow ? o(x, r1 + 1)! : 'wall'
      for (const side of [-1, 1]) {
        if (isRoof(x + side, r0) || isRoof(x + side, r1)) continue
        const X = side < 0 ? x : x + 1
        const nrm = side < 0 ? WEST : EAST
        const rw = face(wallId === 'door' || wallId === 'noren' ? 'wall' : wallId, x, r1 + 1, 0, 0)
        for (let z = zBack; z < zWall; z++) {
          const z1 = Math.min(zWall, z + 1)
          const za = side < 0 ? z : z1
          const zb = side < 0 ? z1 : z
          S(rw).add([X, 0, za], [X, 0, zb], [X, eaveH, zb], [X, eaveH, za], rw, nrm)
          const ta = roofY(za)
          const tb = roofY(zb)
          if (Math.max(ta, tb) > eaveH + 0.01) S(rw).add([X, eaveH, za], [X, eaveH, zb], [X, tb, zb], [X, ta, za], rw, nrm, 0, [0, 0.5, 1, 1])
        }
      }
    }
  }

  // ── cards and decals ──
  const place = (id: TileId, x: number, y: number, nb: number) => {
    const frames = frameCount(id)
    const variant = tileVariant(id, x, y)
    const fx = magicFx(id)
    if (fx) {
      const mesh = new THREE.Mesh(fx.geometry, fx.material)
      mesh.position.set(x + 0.5, 0, y + 0.5)
      if (id === 'warp-circle') {
        // neighbouring circle tiles (around a portal, say) make one great circle
        if (circleDone.has(y * W + x)) return
        const magic = (t: TileId | null) => t === 'warp-circle' || t === 'portal'
        let [x0, x1, y0, y1] = [x, x, y, y]
        const todo = [[x, y]]
        circleDone.add(y * W + x)
        while (todo.length) {
          const [cx, cy] = todo.pop()!
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const nx = cx + dx
              const ny = cy + dy
              if (!inb(nx, ny) || circleDone.has(ny * W + nx) || !magic(m.obj[ny * W + nx])) continue
              circleDone.add(ny * W + nx)
              todo.push([nx, ny])
              x0 = Math.min(x0, nx)
              x1 = Math.max(x1, nx)
              y0 = Math.min(y0, ny)
              y1 = Math.max(y1, ny)
            }
        }
        const span = Math.max(x1 - x0, y1 - y0) + 1
        mesh.position.set((x0 + x1 + 1) / 2, 0, (y0 + y1 + 1) / 2)
        if (span > 1) mesh.scale.setScalar((span / 1.25) * 1.05)
      }
      mesh.renderOrder = 4
      mesh.userData.shared = true
      voxels.add(mesh)
      return
    }
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
  const circleDone = new Set<number>()
  const dynVox: DynVox[] = []
  const chunks = new Map<number, VoxelBuilder>()
  const smooth = new Map<number, Mesher>()
  /** Generated-model props, per tile id and 8×8 chunk (instanced, culled per chunk). */
  const placed = new Map<string, [x: number, y: number, span: number][]>()
  const blades = new Mesher(0.5)
  // lily pads float on the HD water as little 3D pads with a flower
  if (terrainLayers())
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (m.obj[y * W + x] !== 'lily') continue
        for (let k = 0; k < 2; k++) {
          const px = x + 0.3 + rnd(x, y, k) * 0.4
          const pz = y + 0.3 + rnd(y, x, k + 2) * 0.4
          const r = k ? 0.17 : 0.24
          blades.add(G.cyl, k ? PAL.leaf : PAL.leafDark, T([px, 0.015, pz], [r, 0.02, r * 0.9], [0, rnd(x, y, k + 5) * 6, 0]))
          if (!k) {
            blades.add(G.sphere, PAL.sakura, T([px, 0.06, pz], [0.07, 0.05, 0.07]))
            blades.add(G.sphere, '#fff4c2', T([px, 0.085, pz], [0.025, 0.02, 0.025]))
          }
        }
      }
  const BLADE = [PAL.leafDark, PAL.leaf, PAL.grass, PAL.grassLight]
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (m.ground[y * W + x] !== 'tall-grass' || m.obj[y * W + x]) continue
      for (let k = 0; k < 9; k++) {
        const bx = x + 0.08 + rnd(x, y, k) * 0.84
        const bz = y + 0.08 + rnd(y, x, k + 3) * 0.84
        const h = 0.28 + rnd(x + k, y, 5) * 0.3
        const lean = (rnd(x, y + k, 7) - 0.5) * 0.5
        blades.add(G.cone4, BLADE[(x + y + k) % 4], T([bx, h / 2, bz], [0.035, h, 0.014], [lean * 0.6, rnd(x, y, k + 11) * 3, lean]), { sway: 0.06 })
      }
    }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const ob = m.obj[i]
      // flat things with a model (bridges, stepping stones) are placed, not painted
      if (ob && (!FLAT.has(ob) || propAsset(ob)) && !SOLID.has(ob) && !ROOF.has(ob)) place(ob, x, y, objNb(x, y))
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
      pos.set(x + 0.5 + (natural ? (rnd(x, y, 3) - 0.5) * 0.12 : 0), 0, y + (id.startsWith('bridge') ? 0.5 : 0.55) + (natural ? (rnd(y, x, 5) - 0.5) * 0.12 : 0))
      q.setFromAxisAngle(yAxis, natural ? rnd(x, y, 11) * Math.PI * 2 : id === 'bridge-v' ? Math.PI / 2 : id === 'stepping-stone' ? rnd(x, y, 13) * Math.PI * 2 : 0)
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
  if (idsTex) for (const mesh of buildOutskirts(m)) voxels.add(mesh)
  if (!blades.empty) {
    const mesh = new THREE.Mesh(blades.geometry(), toonMat)
    mesh.receiveShadow = true
    voxels.add(mesh)
  }
  if (hdMat && hq.count) {
    const mesh = new THREE.Mesh(hq.geometry(), hdMat)
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
      idsTex?.dispose()
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

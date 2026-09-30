/**
 * Voxel models from pixel art: every opaque pixel becomes a small cube and
 * the silhouette is "inflated" (pixels further from the edge are deeper),
 * so a flat 16×16 sprite turns into a rounded 3D figure that still looks
 * exactly like its art from the front. Each animation frame is its own
 * cached geometry, so the existing walk/idle cycles animate the models.
 *
 * Only faces the camera can see are built (front, sides, top); the back
 * and underside are skipped and shadows use double-sided casting. Front
 * faces are merged into runs of equal colour and depth.
 *
 * Model space: origin at the bottom centre; 1 pixel = 1/16 tile across and
 * in depth, VS/16 tall.
 */
import * as THREE from 'three'
import { VS } from './build'

export interface VoxelOpts {
  /** Max depth in voxels at the thickest point. */
  depth: number
  /** Wind sway amount (tiles) at the model's top; 0 = rigid. */
  sway?: number
}

const PX = 1 / 16

export class VoxelBuilder {
  pos: number[] = []
  nor: number[] = []
  col: number[] = []
  sway: number[] = []
  idx: number[] = []

  private quad(a: number[], b: number[], c: number[], d: number[], n: number[], rgb: number[], s: number[]) {
    const v = this.pos.length / 3
    // keep counter-clockwise winding toward the face normal
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
    const wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2]
    const dot = (uy * wz - uz * wy) * n[0] + (uz * wx - ux * wz) * n[1] + (ux * wy - uy * wx) * n[2]
    if (dot < 0) {
      this.pos.push(...d, ...c, ...b, ...a)
      s = [s[3], s[2], s[1], s[0]]
    } else this.pos.push(...a, ...b, ...c, ...d)
    for (let i = 0; i < 4; i++) {
      this.nor.push(n[0], n[1], n[2])
      this.col.push(rgb[0], rgb[1], rgb[2])
      this.sway.push(s[i])
    }
    this.idx.push(v, v + 1, v + 2, v, v + 2, v + 3)
  }

  /**
   * Add a voxelised canvas with its bottom-centre at (ox, oy, oz).
   * `sx` mirrors/scales horizontally (1 = as drawn).
   */
  add(canvas: HTMLCanvasElement, ox: number, oy: number, oz: number, o: VoxelOpts) {
    const vox = voxelData(canvas, o.depth)
    const { w, h, rgb, dep } = vox
    const hy = (VS / 16) as number
    const top = h * hy
    const sw = o.sway ?? 0
    const X = (x: number) => ox + (x - w / 2) * PX
    const Y = (y: number) => oy + (h - y) * hy
    const Z = (d: number) => oz + d * PX
    const S = (y: number) => (sw ? sw * Math.max(0, (h - y) * hy / top) ** 1.5 : 0)
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : dep[y * w + x])
    const c = (i: number) => [rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]]
    for (let y = 0; y < h; y++) {
      // front faces, merged into runs of equal colour + depth
      let x = 0
      while (x < w) {
        const i = y * w + x
        const d = dep[i]
        if (!d) {
          x++
          continue
        }
        let e = x + 1
        while (e < w && dep[y * w + e] === d && rgb[(y * w + e) * 3] === rgb[i * 3] && rgb[(y * w + e) * 3 + 1] === rgb[i * 3 + 1] && rgb[(y * w + e) * 3 + 2] === rgb[i * 3 + 2]) e++
        const zf = Z(d / 2)
        const s0 = S(y + 1)
        const s1 = S(y)
        this.quad([X(x), Y(y + 1), zf], [X(e), Y(y + 1), zf], [X(e), Y(y), zf], [X(x), Y(y), zf], [0, 0, 1], c(i), [s0, s0, s1, s1])
        x = e
      }
      // tops (front + back strips) and undersides, merged into runs
      const same = (a: number, b: number) => rgb[a * 3] === rgb[b * 3] && rgb[a * 3 + 1] === rgb[b * 3 + 1] && rgb[a * 3 + 2] === rgb[b * 3 + 2]
      for (const under of [false, true]) {
        if (under && y + 1 >= h) continue
        const ny = under ? y + 1 : y - 1
        let x3 = 0
        while (x3 < w) {
          const i = y * w + x3
          const d = dep[i]
          const nb = at(x3, ny)
          if (!d || nb >= d) {
            x3++
            continue
          }
          let e = x3 + 1
          while (e < w && dep[y * w + e] === d && at(e, ny) === nb && same(y * w + e, i)) e++
          const rc = c(i)
          if (under) {
            const yb = Y(y + 1)
            const sb = S(y + 1)
            this.quad([X(x3), yb, Z(d / 2)], [X(e), yb, Z(d / 2)], [X(e), yb, Z(nb / 2)], [X(x3), yb, Z(nb / 2)], [0, -1, 0], shade(rc, 0.7), [sb, sb, sb, sb])
          } else {
            const yy = Y(y)
            const sa = S(y)
            const tc = shade(rc, 1.08)
            this.quad([X(x3), yy, Z(d / 2)], [X(e), yy, Z(d / 2)], [X(e), yy, Z(nb / 2)], [X(x3), yy, Z(nb / 2)], [0, 1, 0], tc, [sa, sa, sa, sa])
            this.quad([X(x3), yy, Z(-nb / 2)], [X(e), yy, Z(-nb / 2)], [X(e), yy, Z(-d / 2)], [X(x3), yy, Z(-d / 2)], [0, 1, 0], tc, [sa, sa, sa, sa])
          }
          x3 = e
        }
      }
    }
    // sides, merged down columns (runs of equal colour, depth and neighbour depth)
    for (let x = 0; x < w; x++)
      for (const side of [-1, 1]) {
        let y = 0
        while (y < h) {
          const i = y * w + x
          const d = dep[i]
          const nb = at(x + side, y)
          if (!d || nb >= d) {
            y++
            continue
          }
          let e = y + 1
          while (e < h && dep[e * w + x] === d && at(x + side, e) === nb && rgb[(e * w + x) * 3] === rgb[i * 3] && rgb[(e * w + x) * 3 + 1] === rgb[i * 3 + 1] && rgb[(e * w + x) * 3 + 2] === rgb[i * 3 + 2]) e++
          const xx = X(side < 0 ? x : x + 1)
          const sb = S(e)
          const st = S(y)
          this.quad([xx, Y(e), Z(nb / 2)], [xx, Y(e), Z(d / 2)], [xx, Y(y), Z(d / 2)], [xx, Y(y), Z(nb / 2)], [side, 0, 0], shade(c(i), 0.9), [sb, sb, st, st])
          y = e
        }
      }
  }

  get empty() {
    return this.idx.length === 0
  }

  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3))
    g.setAttribute('aSway', new THREE.Float32BufferAttribute(this.sway, 1))
    g.setIndex(this.idx)
    g.computeBoundingSphere()
    return g
  }
}

function shade(c: number[], k: number): number[] {
  return [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k)]
}

interface VoxData {
  w: number
  h: number
  /** Linear-space colours per pixel. */
  rgb: Float32Array
  /** Depth in voxels per pixel (0 = empty). */
  dep: Uint8Array
}

const dataCache = new WeakMap<HTMLCanvasElement, Map<number, VoxData>>()

/** Colours and inflated depth for each pixel of a canvas (cached). */
export function voxelData(canvas: HTMLCanvasElement, maxDepth: number): VoxData {
  let byDepth = dataCache.get(canvas)
  if (!byDepth) dataCache.set(canvas, (byDepth = new Map()))
  const hit = byDepth.get(maxDepth)
  if (hit) return hit
  const w = canvas.width
  const h = canvas.height
  const px = canvas.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, w, h).data
  const solid = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) solid[i] = px[i * 4 + 3] >= 60 ? 1 : 0
  // chessboard distance to the nearest empty pixel (two-pass)
  const INF = 255
  const dist = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) dist[i] = solid[i] ? INF : 0
  const get = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : dist[y * w + x])
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (!dist[i]) continue
      dist[i] = Math.min(dist[i], get(x - 1, y) + 1, get(x, y - 1) + 1, get(x - 1, y - 1) + 1, get(x + 1, y - 1) + 1)
    }
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x
      if (!dist[i]) continue
      dist[i] = Math.min(dist[i], get(x + 1, y) + 1, get(x, y + 1) + 1, get(x + 1, y + 1) + 1, get(x - 1, y + 1) + 1)
    }
  const scale = Math.max(1, w / 16)
  const dep = new Uint8Array(w * h)
  const rgb = new Float32Array(w * h * 3)
  const tmp = new THREE.Color()
  for (let i = 0; i < w * h; i++) {
    if (!solid[i]) continue
    // edges 2 deep, rising by 2 per pixel inward (rounded, pillowy)
    dep[i] = Math.min(Math.round(maxDepth * scale), 2 * dist[i]) || 1
    tmp.setRGB(px[i * 4] / 255, px[i * 4 + 1] / 255, px[i * 4 + 2] / 255, THREE.SRGBColorSpace)
    rgb[i * 3] = tmp.r
    rgb[i * 3 + 1] = tmp.g
    rgb[i * 3 + 2] = tmp.b
  }
  const d = { w, h, rgb, dep }
  byDepth.set(maxDepth, d)
  return d
}

const geoCache = new WeakMap<HTMLCanvasElement, Map<number, THREE.BufferGeometry>>()

/** A standalone voxel model of one canvas (cached per canvas and depth). */
export function voxelGeometry(canvas: HTMLCanvasElement, depth: number): THREE.BufferGeometry {
  let m = geoCache.get(canvas)
  if (!m) geoCache.set(canvas, (m = new Map()))
  let g = m.get(depth)
  if (!g) {
    const b = new VoxelBuilder()
    b.add(canvas, 0, 0, 0, { depth })
    g = b.geometry()
    m.set(depth, g)
  }
  return g
}

/** Vertex-coloured material for voxel models, with optional wind sway (aSway attribute). */
export function voxelMaterial(uTime: { value: number }): THREE.MeshLambertMaterial {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true })
  m.shadowSide = THREE.DoubleSide
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aSway;\nuniform float uTime;\nvarying float vGlow;')
      .replace('#include <color_vertex>', '#include <color_vertex>\nfloat gMx = max(color.r, max(color.g, color.b)); float gMn = min(color.r, min(color.g, color.b)); vGlow = smoothstep(0.7, 0.98, gMx) * smoothstep(0.55, 0.85, gMx - gMn);')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec4 swW = modelMatrix * vec4(transformed, 1.0);
        transformed.x += (sin(uTime * 1.3 + swW.x * 0.7 + swW.z * 0.45) * 0.8 + sin(uTime * 2.9 + swW.x * 1.9) * 0.25) * aSway;`,
      )
    // saturated bright pixels (flames, lantern windows, magic) glow and feed the bloom
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGlow;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * vGlow * 0.9;')
  }
  return m
}

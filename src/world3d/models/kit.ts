/**
 * Toolkit for the smooth 3D models: coloured primitive shapes merged into
 * one geometry per rigid part, a toon material (soft three-band shading)
 * that also handles wind sway and glowing parts, and small transform
 * helpers. Colours are stored per vertex so a whole forest chunk or a
 * character's body is a single draw.
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type Vec3 = [number, number, number]

/** Shared unit primitives (cloned + transformed when added). */
export const G = {
  sphere: new THREE.SphereGeometry(1, 18, 12),
  ball: new THREE.IcosahedronGeometry(1, 1),
  rock: new THREE.IcosahedronGeometry(1, 0),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 14),
  cyl6: new THREE.CylinderGeometry(1, 1, 1, 6),
  cone: new THREE.ConeGeometry(1, 1, 14),
  cone4: new THREE.ConeGeometry(1, 1, 4),
  box: new THREE.BoxGeometry(1, 1, 1),
  capsule: new THREE.CapsuleGeometry(1, 1, 4, 12),
  torus: new THREE.TorusGeometry(1, 0.25, 8, 18),
}

const tmpQ = new THREE.Quaternion()
const tmpE = new THREE.Euler()

/** Transform: position, scale (number or per-axis) and Euler rotation (radians). */
export function T(p: Vec3, s: number | Vec3 = 1, r: Vec3 = [0, 0, 0]): THREE.Matrix4 {
  const sc = typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s)
  tmpE.set(r[0], r[1], r[2])
  tmpQ.setFromEuler(tmpE)
  return new THREE.Matrix4().compose(new THREE.Vector3(...p), tmpQ, sc)
}

const colorCache = new Map<string, THREE.Color>()
export function col(hex: string): THREE.Color {
  let c = colorCache.get(hex)
  if (!c) colorCache.set(hex, (c = new THREE.Color(hex)))
  return c
}

export function mix(a: string, b: string, t: number): string {
  const c = new THREE.Color(a).lerp(new THREE.Color(b), t)
  return `#${c.getHexString()}`
}

export interface AddOpts {
  /** Emissive strength 0..1 (flames, lantern windows, magic). */
  glow?: number
  /** Wind sway at this part (tiles); scaled by height when the mesher has swayH. */
  sway?: number
}

/** Accumulates coloured shapes into one merged geometry. */
export class Mesher {
  private parts: THREE.BufferGeometry[] = []
  /** Height at which `sway` reaches its full amount (0 = uniform). */
  swayH: number

  constructor(swayH = 0) {
    this.swayH = swayH
  }

  add(geo: THREE.BufferGeometry, color: string, m: THREE.Matrix4, o: AddOpts = {}) {
    const g = geo.clone()
    g.applyMatrix4(m)
    if (g.getAttribute('uv')) g.deleteAttribute('uv')
    if (g.getAttribute('uv1')) g.deleteAttribute('uv1')
    const n = g.getAttribute('position').count
    const c = col(color)
    const cols = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      cols[i * 3] = c.r
      cols[i * 3 + 1] = c.g
      cols[i * 3 + 2] = c.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3))
    const glow = new Float32Array(n).fill(o.glow ?? 0)
    g.setAttribute('aGlow', new THREE.BufferAttribute(glow, 1))
    const sway = new Float32Array(n)
    if (o.sway) {
      const pos = g.getAttribute('position')
      for (let i = 0; i < n; i++) sway[i] = this.swayH > 0 ? o.sway * Math.max(0, Math.min(1.3, pos.getY(i) / this.swayH)) ** 1.5 : o.sway
    }
    g.setAttribute('aSway', new THREE.BufferAttribute(sway, 1))
    if (!g.index) {
      const idx: number[] = []
      for (let i = 0; i < n; i++) idx.push(i)
      g.setIndex(idx)
    }
    this.parts.push(g)
    return this
  }

  /** Append every part of another mesher, transformed. */
  addMesher(other: Mesher, m: THREE.Matrix4) {
    for (const p of other.parts) {
      const g = p.clone()
      g.applyMatrix4(m)
      this.parts.push(g)
    }
    return this
  }

  get empty() {
    return this.parts.length === 0
  }

  geometry(): THREE.BufferGeometry {
    const g = this.parts.length ? mergeGeometries(this.parts, false)! : new THREE.BufferGeometry()
    for (const p of this.parts) p.dispose()
    this.parts = []
    g.computeBoundingSphere()
    return g
  }
}

let gradient: THREE.DataTexture | null = null
function toonGradient(): THREE.DataTexture {
  if (gradient) return gradient
  // three soft bands: shade, mid, lit
  const data = new Uint8Array([165, 165, 170, 255, 215, 215, 215, 255, 255, 255, 255, 255])
  gradient = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat)
  gradient.magFilter = THREE.NearestFilter
  gradient.minFilter = THREE.NearestFilter
  gradient.needsUpdate = true
  return gradient
}

/** Toon material for all models: vertex colours, wind sway (aSway), glow (aGlow). */
export function toonMaterial(uTime: { value: number }, opts: { transparent?: boolean } = {}): THREE.MeshToonMaterial {
  const m = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonGradient(), transparent: opts.transparent ?? false })
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aSway;\nattribute float aGlow;\nuniform float uTime;\nvarying float vGlow;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vGlow = aGlow;
        if (aSway != 0.0) {
          vec4 swW = modelMatrix * vec4(transformed, 1.0);
          transformed.x += (sin(uTime * 1.3 + swW.x * 0.7 + swW.z * 0.45) * 0.8 + sin(uTime * 2.9 + swW.x * 1.9) * 0.25) * aSway;
          transformed.z += sin(uTime * 1.1 + swW.x * 0.5) * aSway * 0.3;
        }`,
      )
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGlow;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * (vGlow * 1.6 + 0.16);')
  }
  return m
}

/** Stable pseudo-random in [0, 1) from integers. */
export function rnd(a: number, b: number, c = 0): number {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

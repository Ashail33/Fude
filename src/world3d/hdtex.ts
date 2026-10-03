/**
 * Generated HD environment textures (public/tex): painted ground materials
 * that the terrain shader blends per tile, and wall, roof and cliff faces
 * packed into one HD atlas. Anything without a texture keeps its pixel tile.
 */
import * as THREE from 'three'
import type { TileId } from '../art/tiles'
import type { UvRect } from './atlas'

/** Ground tiles → terrain material. Ground tiles missing here stay pixel art. */
export const GROUND_TEX: Partial<Record<TileId, string>> = {
  grass: 'grass',
  'grass-dark': 'grass-dark',
  flowers: 'flowers',
  'tall-grass': 'grass-dark',
  path: 'path',
  sand: 'sand',
  dirt: 'dirt',
  'stone-floor': 'stone-floor',
  'wood-floor': 'wood-floor',
  tatami: 'tatami',
  snow: 'snow',
  water: 'water',
  'water-deep': 'water',
  lily: 'water',
  // v3 grounds: frozen ponds, hot springs, the sky city's cloud floor and the open sky below it
  ice: 'ice',
  onsen: 'onsen',
  cloud: 'cloud',
  sky: 'sky',
}
/** Water tiles animate (and get a foam line at the shore); deep water is darker. Hot springs and the open sky drift the same way. */
export const WATER = new Set<TileId>(['water', 'water-deep', 'lily', 'onsen', 'sky'])

/** Block and roof faces → HD texture. */
export const FACE_TEX: Partial<Record<TileId, string>> = {
  wall: 'wall',
  'wall-window': 'wall-window',
  door: 'door',
  noren: 'noren',
  'stone-wall': 'stone-wall',
  'castle-wall': 'castle-wall',
  'gate-closed': 'castle-wall',
  'tower-wall': 'tower-wall',
  cliff: 'cliff',
  cave: 'cliff',
  bookshelf: 'bookshelf',
  roof: 'roof',
  'roof-edge': 'roof',
  'roof-red': 'roof-red',
  'roof-red-edge': 'roof-red',
  'shop-awning': 'awning',
  'bridge-h': 'wood-floor',
  'bridge-v': 'wood-floor',
}

let available: Set<string> | null = null
let listing: Promise<void> | null = null
const images = new Map<string, HTMLImageElement | null>()
const loading = new Map<string, Promise<void>>()
const base = () => import.meta.env?.BASE_URL ?? '/'

function list(): Promise<void> {
  listing ??= fetch(`${base()}tex/available.json`, { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : []))
    .then((ids: unknown) => {
      available = new Set(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : [])
    })
    .catch(() => {
      available = new Set()
    })
  return listing
}

function load(name: string): Promise<void> {
  let p = loading.get(name)
  if (!p) {
    p = new Promise<void>((done) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        images.set(name, img)
        done()
      }
      img.onerror = () => {
        images.set(name, null)
        done()
      }
      img.src = `${base()}tex/${name}.jpg`
    })
    loading.set(name, p)
  }
  return p
}

/** Load every available HD texture (shared by all maps); resolves when settled. */
export function requestTextures(): Promise<void> {
  return list().then(() => Promise.all([...(available ?? [])].map(load)).then(() => undefined))
}

export function texImage(name: string | undefined): HTMLImageElement | null {
  return name ? (images.get(name) ?? null) : null
}

/** How many HD textures are loaded (to tell when a rebuild would change the scene). */
export function texCount(): number {
  let n = 0
  for (const v of images.values()) if (v) n++
  return n
}

// ─── terrain layers ───────────────────────────────────────────────
const LAYER = 512
let layers: { tex: THREE.DataArrayTexture; index: Map<string, number>; key: string } | null = null

/** All loaded ground materials as one texture array (rebuilt when more arrive). */
export function terrainLayers(): { tex: THREE.DataArrayTexture; index: Map<string, number> } | null {
  const names = [...new Set(Object.values(GROUND_TEX))].filter((n): n is string => !!texImage(n))
  if (!names.includes('grass')) return null
  const key = names.join(',')
  if (layers?.key === key) return layers
  layers?.tex.dispose()
  const data = new Uint8Array(LAYER * LAYER * 4 * names.length)
  const c = document.createElement('canvas')
  c.width = c.height = LAYER
  const g = c.getContext('2d', { willReadFrequently: true })!
  names.forEach((n, i) => {
    g.drawImage(texImage(n)!, 0, 0, LAYER, LAYER)
    data.set(g.getImageData(0, 0, LAYER, LAYER).data, i * LAYER * LAYER * 4)
  })
  const tex = new THREE.DataArrayTexture(data, LAYER, LAYER, names.length)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 8
  tex.needsUpdate = true
  layers = { tex, index: new Map(names.map((n, i) => [n, i])), key }
  return layers
}

// ─── HD face atlas ────────────────────────────────────────────────
const SLOT = 256
const PAD = 6

/** Wall, roof and cliff textures packed in one 2048² texture (one face per tile). */
export class HdAtlas {
  readonly canvas: HTMLCanvasElement
  readonly tex: THREE.CanvasTexture
  private ctx: CanvasRenderingContext2D
  private slots = new Map<string, UvRect>()
  private n = 0
  readonly size: number

  constructor(size = 2048) {
    this.size = size
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.canvas.height = size
    this.ctx = this.canvas.getContext('2d')!
    this.tex = new THREE.CanvasTexture(this.canvas)
    this.tex.colorSpace = THREE.SRGBColorSpace
    this.tex.magFilter = THREE.LinearFilter
    this.tex.minFilter = THREE.LinearMipmapLinearFilter
    this.tex.anisotropy = 8
  }

  /** UV rect of a tile's HD face, or null when it has none. */
  rect(id: TileId): UvRect | null {
    const name = FACE_TEX[id]
    if (!name) return null
    const have = this.slots.get(name)
    if (have) return have
    // not cached until loaded: an early build may run before the image arrives
    const img = texImage(name)
    const per = Math.floor(this.size / SLOT)
    if (!img || this.n >= per * per) return null
    const i = this.n++
    const x = (i % per) * SLOT
    const y = Math.floor(i / per) * SLOT
    const inner = SLOT - PAD * 2
    const g = this.ctx
    // edge-extend into the padding so mipmaps don't bleed between faces
    g.drawImage(img, x, y, SLOT, SLOT)
    g.drawImage(img, x + PAD, y + PAD, inner, inner)
    const S = this.size
    const r = { u0: (x + PAD) / S, u1: (x + PAD + inner) / S, v0: 1 - (y + PAD + inner) / S, v1: 1 - (y + PAD) / S }
    this.slots.set(name, r)
    this.tex.needsUpdate = true
    return r
  }
}

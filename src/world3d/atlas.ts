/**
 * One texture holding every standing tile (trees, walls, roofs, props) at
 * 4× (Scale2x ×2), packed on a fixed grid. Keyed by the source canvas, which
 * tileCanvas() caches, so each tile state is packed once.
 */
import * as THREE from 'three'
import { upscaleCanvas } from './upscale'

export interface UvRect {
  u0: number
  v0: number
  u1: number
  v1: number
}

const CELL = 16

export class Atlas {
  readonly up: number
  readonly size: number
  readonly canvas: HTMLCanvasElement
  readonly tex: THREE.CanvasTexture
  private ctx: CanvasRenderingContext2D
  private slots = new Map<HTMLCanvasElement, UvRect>()
  private n = 0
  private dirty = false
  /** Padding (px at 4×) around each slot so mipmaps don't bleed between tiles. */
  private pad: number

  constructor(up = 2, size = 2048) {
    this.up = up
    this.size = size
    this.pad = 1 << up
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.canvas.height = size
    this.ctx = this.canvas.getContext('2d')!
    this.ctx.imageSmoothingEnabled = false
    this.tex = new THREE.CanvasTexture(this.canvas)
    this.tex.colorSpace = THREE.SRGBColorSpace
    this.tex.magFilter = THREE.LinearFilter
    this.tex.minFilter = THREE.LinearMipmapLinearFilter
    this.tex.anisotropy = 4
  }

  private get slot(): number {
    return CELL * (1 << this.up) + this.pad * 2
  }

  get capacity(): number {
    const per = Math.floor(this.size / this.slot)
    return per * per
  }

  /** UV rect of a 16×16 tile canvas (packing it on first use). */
  get(c: HTMLCanvasElement): UvRect {
    let r = this.slots.get(c)
    if (r) return r
    const s = this.slot
    const per = Math.floor(this.size / s)
    const i = this.n < this.capacity ? this.n++ : this.capacity - 1
    const x = (i % per) * s
    const y = Math.floor(i / per) * s
    const big = this.up > 0 ? upscaleCanvas(c, this.up) : c
    const p = this.pad
    const inner = s - p * 2
    const g = this.ctx
    g.clearRect(x, y, s, s)
    // edge-extend into the padding (no transparent seams at the card edges)
    g.drawImage(big, x + p, y + p, inner, inner)
    g.drawImage(big, 0, 0, big.width, 1, x + p, y, inner, p)
    g.drawImage(big, 0, big.height - 1, big.width, 1, x + p, y + s - p, inner, p)
    g.drawImage(big, 0, 0, 1, big.height, x, y + p, p, inner)
    g.drawImage(big, big.width - 1, 0, 1, big.height, x + s - p, y + p, p, inner)
    const S = this.size
    r = { u0: (x + p) / S, u1: (x + p + inner) / S, v0: 1 - (y + p + inner) / S, v1: 1 - (y + p) / S }
    this.slots.set(c, r)
    this.dirty = true
    return r
  }

  /** Upload any newly packed tiles (call once per frame). */
  flush() {
    if (!this.dirty) return
    this.dirty = false
    this.tex.needsUpdate = true
  }

  dispose() {
    this.tex.dispose()
  }
}

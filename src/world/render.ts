/**
 * Canvas renderer for the overworld. Draws at native pixel resolution
 * (16px tiles) into a small buffer, then scales it up by an integer factor.
 * Static layers are cached per map; only animated tiles are redrawn.
 */
import { drawSprite as rawDrawSprite, spriteSize as rawSpriteSize, type SpriteId, type SpriteOpts } from '../art'
import { PAL } from '../art/palette'
import { computeNeighbours, drawTile as rawDrawTile, type Neighbours, type TileId } from '../art/tiles'

// The art library is authored concurrently; never let a missing sprite/tile kill the frame loop.
const broken = new Set<string>()
function drawSprite(ctx: CanvasRenderingContext2D, id: SpriteId, x: number, y: number, scale: number, opts: SpriteOpts) {
  if (broken.has(id)) return
  try {
    rawDrawSprite(ctx, id, x, y, scale, opts)
  } catch (err) {
    broken.add(id)
    console.warn('sprite unavailable', id, err)
  }
}
/** Draw a tile. `cell` gives positional variation; `bare` skips the prop's built-in ground (drawn over existing ground). */
function drawTile(ctx: CanvasRenderingContext2D, id: TileId, x: number, y: number, scale: number, time: number, nb: Neighbours, cell?: Pt, bare = false) {
  if (broken.has('t:' + id)) return
  try {
    rawDrawTile(ctx, id, x, y, scale, time, nb, { tx: cell?.x, ty: cell?.y, under: bare ? id : undefined })
  } catch (err) {
    broken.add('t:' + id)
    console.warn('tile unavailable', id, err)
  }
}
function spriteSize(id: SpriteId): { w: number; h: number } {
  try {
    return rawSpriteSize(id)
  } catch {
    return { w: 32, h: 32 }
  }
}
import { cameraFor, chooseScale, walkerPos, type Walker, type World } from './engine'
import { ANIMATED } from './mapdef'
import type { Entity, Exit, GameMap, ParticleKind, Pt } from './types'

export interface RenderInfo {
  outfit: string
  /** Entity ids drawn as fading ghosts. */
  ghosts: Set<string>
  /** Entity id → marker. */
  markers: Map<string, 'next' | 'done'>
  opened: Set<string>
  exitLocked: (e: Exit) => boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  c: string
}

const LIFT = 4

export class Renderer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  buf: HTMLCanvasElement
  b: CanvasRenderingContext2D
  scale = 3
  dpr = 1
  vw = 0
  vh = 0
  map: GameMap | null = null
  stat: HTMLCanvasElement | null = null
  animCells: number[] = []
  overCells: number[] = []
  groundNb: number[] = []
  objNb: number[] = []
  overNb: number[] = []
  particles: Particle[] = []
  particleKind: ParticleKind = 'none'
  vignette: HTMLCanvasElement | null = null
  cam: Pt = { x: 0, y: 0 }
  /** 0 = clear, 1 = black. */
  fade = 1
  battleFx: { start: number; snap: HTMLCanvasElement | null } | null = null
  shake = 0
  /** Short-lived step effects (grass rustle, running dust). */
  puffs: { x: number; y: number; at: number; kind: 'leaf' | 'dust' }[] = []
  /** Last tap-to-walk target (drawn briefly). */
  tap: { x: number; y: number; at: number } | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.buf = document.createElement('canvas')
    this.b = this.buf.getContext('2d')!
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.dpr = dpr
    this.canvas.width = Math.round(cssW * dpr)
    this.canvas.height = Math.round(cssH * dpr)
    this.scale = chooseScale(cssW, cssH, dpr)
    this.vw = Math.ceil(this.canvas.width / this.scale)
    this.vh = Math.ceil(this.canvas.height / this.scale)
    this.buf.width = this.vw
    this.buf.height = this.vh
    this.vignette = null
    this.seedParticles()
  }

  /** Screen (CSS px) → map tile. */
  tileAt(cssX: number, cssY: number): Pt {
    const f = this.dpr / this.scale
    return { x: Math.floor((cssX * f + this.cam.x) / 16), y: Math.floor((cssY * f + this.cam.y) / 16) }
  }

  setMap(m: GameMap) {
    this.map = m
    const c = document.createElement('canvas')
    c.width = m.w * 16
    c.height = m.h * 16
    const g = c.getContext('2d')!
    g.imageSmoothingEnabled = false
    this.groundNb = []
    this.objNb = []
    this.animCells = []
    this.overCells = []
    const inb = (x: number, y: number) => x >= 0 && y >= 0 && x < m.w && y < m.h
    const gGet = (x: number, y: number) => (inb(x, y) ? m.ground[y * m.w + x] : null)
    const oGet = (x: number, y: number) => (inb(x, y) ? (m.obj[y * m.w + x] ?? m.ground[y * m.w + x]) : null)
    const vGet = (x: number, y: number) => (inb(x, y) ? (m.over[y * m.w + x] ?? m.ground[y * m.w + x]) : null)
    this.overNb = []
    for (let y = 0; y < m.h; y++)
      for (let x = 0; x < m.w; x++) {
        const i = y * m.w + x
        const cell = { x, y }
        this.groundNb[i] = computeNeighbours(gGet, x, y)
        this.objNb[i] = m.obj[i] ? computeNeighbours(oGet, x, y) : 0
        this.overNb[i] = m.over[i] ? computeNeighbours(vGet, x, y) : 0
        drawTile(g, m.ground[i], x * 16, y * 16, 1, 0, this.groundNb[i], cell)
        const o = m.obj[i]
        if (o) drawTile(g, o, x * 16, y * 16, 1, 0, this.objNb[i], cell, true)
        if (ANIMATED.has(m.ground[i]) || (o && ANIMATED.has(o))) this.animCells.push(i)
        if (m.over[i]) this.overCells.push(i)
      }
    this.stat = c
    this.particleKind = m.spec.particles
    this.seedParticles()
  }

  private seedParticles() {
    const n = { none: 0, sakura: 26, pollen: 22, fireflies: 16, dust: 18, sparkles: 22 }[this.particleKind]
    const k = Math.round((n * (this.vw * this.vh)) / (320 * 240))
    this.particles = []
    for (let i = 0; i < k; i++) this.particles.push(this.newParticle(Math.random() * this.vw + this.cam.x, Math.random() * this.vh + this.cam.y))
  }

  private newParticle(x: number, y: number): Particle {
    const r = Math.random()
    switch (this.particleKind) {
      case 'sakura':
        return { x, y, vx: 6 + r * 8, vy: 9 + r * 7, phase: r * 6.28, c: r < 0.6 ? PAL.sakura : r < 0.85 ? PAL.sakuraDark : PAL.white }
      case 'pollen':
        return { x, y, vx: 2 + r * 3, vy: -2 - r * 3, phase: r * 6.28, c: r < 0.7 ? PAL.gold : PAL.light }
      case 'fireflies':
        return { x, y, vx: (r - 0.5) * 6, vy: (Math.random() - 0.5) * 6, phase: r * 6.28, c: r < 0.5 ? PAL.light : PAL.poison }
      case 'dust':
        return { x, y, vx: 1 + r * 2, vy: (Math.random() - 0.6) * 2, phase: r * 6.28, c: PAL.paper }
      case 'sparkles':
        return { x, y, vx: (r - 0.5) * 2, vy: -1 - r * 2, phase: r * 6.28, c: r < 0.5 ? PAL.lilac : PAL.gold }
      default:
        return { x, y, vx: 0, vy: 0, phase: 0, c: PAL.white }
    }
  }

  puff(x: number, y: number, kind: 'leaf' | 'dust', now = performance.now()) {
    this.puffs.push({ x, y, at: now, kind })
    if (this.puffs.length > 24) this.puffs.shift()
  }

  private drawPuffs(now: number) {
    const b = this.b
    this.puffs = this.puffs.filter((p) => now - p.at < 420)
    for (const p of this.puffs) {
      const t = (now - p.at) / 420
      const cx = p.x * 16 + 8 - this.cam.x
      const cy = p.y * 16 + 13 - this.cam.y
      b.globalAlpha = 1 - t
      if (p.kind === 'leaf') {
        b.fillStyle = t < 0.5 ? PAL.grassLight : PAL.leaf
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + p.at
          b.fillRect(Math.round(cx + Math.cos(a) * (3 + t * 7)), Math.round(cy - 3 - t * 6 + Math.sin(a) * 2), 1, 1)
        }
      } else {
        b.fillStyle = PAL.sand
        const r = 1 + Math.round(t * 3)
        b.fillRect(Math.round(cx - 3 - t * 3), cy + 1 - r, r, r)
        b.fillRect(Math.round(cx + 2 + t * 3), cy + 1 - r, r, r)
      }
    }
    b.globalAlpha = 1
  }

  startBattleFx(now: number) {
    const snap = document.createElement('canvas')
    snap.width = this.canvas.width
    snap.height = this.canvas.height
    snap.getContext('2d')!.drawImage(this.canvas, 0, 0)
    this.battleFx = { start: now, snap }
  }

  private drawWalkerSprite(id: SpriteId, w: Walker, opts: { outfit?: string; bob?: number; frame?: number } = {}) {
    const b = this.b
    const p = walkerPos(w)
    const x = Math.round(p.x - this.cam.x)
    const y = Math.round(p.y - this.cam.y)
    // soft shadow
    b.fillStyle = 'rgba(20, 10, 30, 0.25)'
    b.fillRect(x + 5, y + 11, 6, 1)
    b.fillRect(x + 3, y + 12, 10, 2)
    b.fillRect(x + 5, y + 14, 6, 1)
    const moving = w.t < 1
    const frame = opts.frame ?? (moving ? (w.steps + (w.t > 0.5 ? 1 : 0)) % 2 : 0)
    drawSprite(b, id, x, y - LIFT + (opts.bob ?? 0), 1, { dir: w.dir, frame, outfit: opts.outfit })
    // feet hidden by tall grass
    const cx = moving && w.t < 0.4 ? w.px : w.x
    const cy = moving && w.t < 0.4 ? w.py : w.y
    const m = this.map!
    if (m.ground[cy * m.w + cx] === 'tall-grass' && opts.bob === undefined) {
      b.save()
      b.beginPath()
      b.rect(cx * 16 - this.cam.x, cy * 16 - this.cam.y + 9, 16, 7)
      b.clip()
      drawTile(b, 'tall-grass', cx * 16 - this.cam.x, cy * 16 - this.cam.y, 1, performance.now(), this.groundNb[cy * m.w + cx], { x: cx, y: cy })
      b.restore()
    }
  }

  private drawEntity(e: Entity, now: number, info: RenderInfo) {
    const b = this.b
    const ghost = info.ghosts.has(e.spec.id)
    if (ghost) {
      b.globalAlpha = 0.28 + 0.18 * Math.sin(now / 180 + e.x)
    }
    const p = walkerPos(e)
    const x = Math.round(p.x - this.cam.x)
    const y = Math.round(p.y - this.cam.y)
    let tile: TileId | undefined = e.spec.tile
    if (e.spec.kind === 'chest') tile = info.opened.has(e.spec.id) ? 'chest-open' : 'chest'
    if (tile) {
      const jitter = ghost && Math.sin(now / 90 + e.y) > 0.85 ? 1 : 0
      drawTile(b, tile, x + jitter, y, 1, now, 0, { x: e.x, y: e.y }, true)
    }
    if (e.spec.sprite) {
      if (e.big) {
        b.fillStyle = 'rgba(20, 10, 30, 0.3)'
        b.fillRect(x + 4, y + 12, 24, 4)
        const bob = Math.round(Math.sin(now / 420) * 1)
        const sz = spriteSize(e.spec.sprite)
        drawSprite(b, e.spec.sprite, x + 16 - sz.w / 2, y + 16 - sz.h + bob, 1, { frame: Math.floor(now / 450) % 2 })
      } else {
        const moving = e.t < 1
        if (!tile) {
          b.fillStyle = 'rgba(20, 10, 30, 0.25)'
          b.fillRect(x + 5, y + 11, 6, 1)
          b.fillRect(x + 3, y + 12, 10, 2)
          b.fillRect(x + 5, y + 14, 6, 1)
        }
        drawSprite(b, e.spec.sprite, x, y - LIFT, 1, { dir: e.dir, frame: moving ? (e.t > 0.5 ? 1 : 0) : Math.floor(now / 900 + e.hx) % 4 === 0 ? 1 : 0 })
      }
    }
    if (ghost) {
      // glitch slice
      if (Math.sin(now / 70 + e.x * 3) > 0.7) {
        b.globalAlpha = 0.5
        b.fillStyle = PAL.lilac
        b.fillRect(x, y + ((now / 40) % 14), 16, 1)
      }
      b.globalAlpha = 1
    }
  }

  private drawMarker(e: Entity, kind: 'next' | 'done', now: number) {
    const b = this.b
    const p = walkerPos(e)
    const cx = Math.round(p.x - this.cam.x) + (e.big ? 16 : 8)
    const top = Math.round(p.y - this.cam.y) + (e.big && e.spec.sprite ? 14 - spriteSize(e.spec.sprite).h : e.spec.sprite ? -LIFT - 2 : 0)
    if (kind === 'next') {
      const bob = Math.round(Math.sin(now / 160) * 1.5)
      const y = top - 12 + bob
      // speech bubble with a red "!"
      b.fillStyle = PAL.ink
      b.fillRect(cx - 4, y - 1, 9, 11)
      b.fillRect(cx - 5, y, 11, 9)
      b.fillStyle = PAL.white
      b.fillRect(cx - 3, y, 7, 9)
      b.fillRect(cx - 4, y + 1, 9, 7)
      b.fillStyle = PAL.ink
      b.fillRect(cx, y + 10, 1, 2)
      b.fillStyle = PAL.vermilion
      b.fillRect(cx, y + 1, 1, 5)
      b.fillRect(cx - 1, y + 2, 3, 3)
      b.fillRect(cx, y + 7, 1, 1)
    } else {
      const tw = (Math.sin(now / 260 + e.x) + 1) / 2
      const y = top - 5
      b.fillStyle = PAL.gold
      b.globalAlpha = 0.55 + tw * 0.45
      b.fillRect(cx, y - 2, 1, 5)
      b.fillRect(cx - 2, y, 5, 1)
      if (tw > 0.6) {
        b.fillStyle = PAL.white
        b.fillRect(cx, y, 1, 1)
        b.fillStyle = PAL.gold
        b.fillRect(cx - 3, y, 1, 1)
        b.fillRect(cx + 3, y, 1, 1)
        b.fillRect(cx, y - 3, 1, 1)
        b.fillRect(cx, y + 3, 1, 1)
      }
      b.globalAlpha = 1
    }
  }

  private drawBarrier(ex: Exit, now: number) {
    const b = this.b
    const x = ex.x * 16 - this.cam.x
    const y = ex.y * 16 - this.cam.y
    b.save()
    b.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 16; i += 2) {
      const a = 0.25 + 0.25 * Math.sin(now / 200 + i + ex.x)
      b.fillStyle = `rgba(199, 163, 240, ${a})`
      b.fillRect(x + i, y - 6, 1, 22)
    }
    b.fillStyle = 'rgba(138, 79, 209, 0.35)'
    b.fillRect(x, y - 6, 16, 22)
    const sy = ((now / 30 + ex.x * 7) % 22) - 6
    b.fillStyle = 'rgba(255,255,255,0.8)'
    b.fillRect(x + ((ex.x * 5 + Math.floor(now / 300)) % 14) + 1, y + sy, 1, 2)
    b.restore()
  }

  private updateParticles(dt: number, now: number) {
    const b = this.b
    const x0 = this.cam.x - 8
    const y0 = this.cam.y - 8
    const W = this.vw + 16
    const H = this.vh + 16
    b.save()
    for (const p of this.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      if (this.particleKind === 'sakura') p.x += Math.sin(now / 500 + p.phase) * 0.3
      if (this.particleKind === 'fireflies') {
        p.vx += (Math.random() - 0.5) * 8 * dt
        p.vy += (Math.random() - 0.5) * 8 * dt
        p.vx = Math.max(-6, Math.min(6, p.vx))
        p.vy = Math.max(-6, Math.min(6, p.vy))
      }
      // wrap into the view
      if (p.x < x0) p.x += W
      else if (p.x > x0 + W) p.x -= W
      if (p.y < y0) p.y += H
      else if (p.y > y0 + H) p.y -= H
      const sx = Math.round(p.x - this.cam.x)
      const sy = Math.round(p.y - this.cam.y)
      const tw = (Math.sin(now / 300 + p.phase) + 1) / 2
      switch (this.particleKind) {
        case 'sakura': {
          b.fillStyle = p.c
          const flip = Math.sin(now / 240 + p.phase) > 0
          b.fillRect(sx, sy, flip ? 2 : 1, flip ? 1 : 2)
          b.fillRect(sx + 1, sy + 1, 1, 1)
          break
        }
        case 'pollen':
          b.globalAlpha = 0.4 + tw * 0.6
          b.fillStyle = p.c
          b.fillRect(sx, sy, 1, 1)
          break
        case 'fireflies': {
          b.globalCompositeOperation = 'lighter'
          b.globalAlpha = tw * 0.35
          b.fillStyle = p.c
          b.fillRect(sx - 1, sy - 1, 3, 3)
          b.globalAlpha = 0.3 + tw * 0.7
          b.fillRect(sx, sy, 1, 1)
          b.globalCompositeOperation = 'source-over'
          break
        }
        case 'dust':
          b.globalAlpha = 0.15 + tw * 0.35
          b.fillStyle = p.c
          b.fillRect(sx, sy, 1, 1)
          break
        case 'sparkles':
          b.globalAlpha = tw
          b.fillStyle = p.c
          b.fillRect(sx, sy, 1, 1)
          if (tw > 0.75) {
            b.fillRect(sx - 1, sy, 3, 1)
            b.fillRect(sx, sy - 1, 1, 3)
          }
          break
      }
      b.globalAlpha = 1
    }
    b.restore()
  }

  private getVignette(): HTMLCanvasElement {
    if (this.vignette) return this.vignette
    const c = document.createElement('canvas')
    c.width = this.canvas.width
    c.height = this.canvas.height
    const g = c.getContext('2d')!
    const r = Math.hypot(c.width, c.height) / 2
    const grad = g.createRadialGradient(c.width / 2, c.height * 0.45, r * 0.35, c.width / 2, c.height / 2, r * 1.05)
    grad.addColorStop(0, 'rgba(255, 220, 160, 0)')
    grad.addColorStop(0.6, 'rgba(90, 40, 50, 0.12)')
    grad.addColorStop(1, 'rgba(26, 12, 35, 0.55)')
    g.fillStyle = grad
    g.fillRect(0, 0, c.width, c.height)
    // golden-hour glow from the top-left
    const glow = g.createRadialGradient(c.width * 0.15, -c.height * 0.1, 0, c.width * 0.15, -c.height * 0.1, r * 1.2)
    glow.addColorStop(0, 'rgba(255, 214, 140, 0.22)')
    glow.addColorStop(1, 'rgba(255, 214, 140, 0)')
    g.fillStyle = glow
    g.fillRect(0, 0, c.width, c.height)
    this.vignette = c
    return c
  }

  draw(world: World, now: number, dt: number, info: RenderInfo) {
    const m = this.map
    if (!m || !this.stat) return
    const b = this.b
    b.imageSmoothingEnabled = false
    const pp = walkerPos(world.player)
    this.cam = cameraFor(pp.x + 8, pp.y + 8, this.vw, this.vh, m.w * 16, m.h * 16)
    if (this.shake > 0) {
      this.cam.x += Math.round((Math.random() - 0.5) * this.shake)
      this.cam.y += Math.round((Math.random() - 0.5) * this.shake)
      this.shake = Math.max(0, this.shake - dt * 30)
    }
    const cam = this.cam
    b.fillStyle = m.spec.bg ?? PAL.leafDark
    b.fillRect(0, 0, this.vw, this.vh)
    b.drawImage(this.stat, -cam.x, -cam.y)

    // animated tiles in view
    const tx0 = Math.max(0, Math.floor(cam.x / 16))
    const ty0 = Math.max(0, Math.floor(cam.y / 16))
    const tx1 = Math.min(m.w - 1, Math.floor((cam.x + this.vw) / 16))
    const ty1 = Math.min(m.h - 1, Math.floor((cam.y + this.vh) / 16))
    for (const i of this.animCells) {
      const x = i % m.w
      const y = (i - x) / m.w
      if (x < tx0 || x > tx1 || y < ty0 || y > ty1) continue
      const cell = { x, y }
      drawTile(b, m.ground[i], x * 16 - cam.x, y * 16 - cam.y, 1, now, this.groundNb[i], cell)
      const o = m.obj[i]
      if (o) drawTile(b, o, x * 16 - cam.x, y * 16 - cam.y, 1, now, this.objNb[i], cell, true)
    }
    for (const ex of m.exits.values()) if (info.exitLocked(ex)) this.drawBarrier(ex, now)

    // y-sorted sprites
    type D = { y: number; f: () => void }
    const list: D[] = []
    for (const e of world.ents) list.push({ y: walkerPos(e).y + (e.spec.tile && !e.spec.sprite ? -1 : 0), f: () => this.drawEntity(e, now, info) })
    const fb = Math.round(Math.sin(now / 280) * 1.5) - 5
    list.push({ y: walkerPos(world.fude).y - 0.5, f: () => this.drawWalkerSprite('fude', world.fude, { bob: fb, frame: Math.floor(now / 300) % 2 }) })
    list.push({ y: pp.y, f: () => this.drawWalkerSprite('mage', world.player, { outfit: info.outfit }) })
    list.sort((a, c) => a.y - c.y)
    this.drawPuffs(now)
    for (const d of list) d.f()

    // overhead layer (torii, canopy)
    for (const i of this.overCells) {
      const x = i % m.w
      const y = (i - x) / m.w
      if (x < tx0 || x > tx1 || y < ty0 || y > ty1) continue
      drawTile(b, m.over[i]!, x * 16 - cam.x, y * 16 - cam.y, 1, now, this.overNb[i], { x, y }, true)
    }
    for (const e of world.ents) {
      const mk = info.markers.get(e.spec.id)
      if (mk) this.drawMarker(e, mk, now)
    }
    if (this.tap) {
      const age = now - this.tap.at
      if (age > 450) this.tap = null
      else {
        const x = this.tap.x * 16 - cam.x
        const y = this.tap.y * 16 - cam.y
        const o = Math.round((age / 450) * 3)
        b.fillStyle = `rgba(255, 255, 255, ${1 - age / 450})`
        for (const [cx, cy, sx, sy] of [
          [x - o, y - o, 1, 1],
          [x + 15 + o, y - o, -1, 1],
          [x - o, y + 15 + o, 1, -1],
          [x + 15 + o, y + 15 + o, -1, -1],
        ]) {
          b.fillRect(Math.min(cx, cx + sx * 3), cy, 4, 1)
          b.fillRect(cx, Math.min(cy, cy + sy * 3), 1, 4)
        }
      }
    }
    this.updateParticles(dt, now)

    // upscale to screen
    const ctx = this.ctx
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.buf, 0, 0, this.vw * this.scale, this.vh * this.scale)
    if (m.spec.tint) {
      ctx.fillStyle = m.spec.tint
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
    ctx.drawImage(this.getVignette(), 0, 0)
    if (this.fade > 0) {
      ctx.fillStyle = `rgba(5, 4, 12, ${Math.min(1, this.fade)})`
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
    if (this.battleFx) this.drawBattleFx(now)
  }

  /** Flash ×3, then the scene shatters into falling shards over black. */
  private drawBattleFx(now: number) {
    const fx = this.battleFx!
    const t = now - fx.start
    const ctx = this.ctx
    const W = this.canvas.width
    const H = this.canvas.height
    if (t < 420) {
      const k = Math.floor(t / 70) % 2
      if (k === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.fillRect(0, 0, W, H)
      } else {
        ctx.save()
        ctx.globalCompositeOperation = 'difference'
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, W, H)
        ctx.restore()
      }
      return
    }
    const s = Math.min(1, (t - 420) / 800)
    ctx.fillStyle = '#05040c'
    ctx.fillRect(0, 0, W, H)
    if (!fx.snap) return
    const cols = 6
    const rows = 10
    const pw = W / cols
    const ph = H / rows
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const seed = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453
        const rnd = seed - Math.floor(seed)
        const dx = (c + 0.5 - cols / 2) * pw
        const dy = (r + 0.5 - rows / 2) * ph
        const e = s * s
        const x = W / 2 + dx * (1 + e * 1.4) - pw / 2
        const y = H / 2 + dy * (1 + e * 1.4) - ph / 2 + e * H * 0.6 * (0.5 + rnd)
        ctx.save()
        ctx.globalAlpha = 1 - s
        ctx.translate(x + pw / 2, y + ph / 2)
        ctx.rotate((rnd - 0.5) * e * 3)
        ctx.scale(1 - e * 0.5, 1 - e * 0.5)
        ctx.drawImage(fx.snap, c * pw, r * ph, pw, ph, -pw / 2, -ph / 2, pw + 1, ph + 1)
        ctx.restore()
      }
    // swirl ring closing in
    ctx.save()
    ctx.strokeStyle = `rgba(247, 201, 72, ${0.8 * (1 - s)})`
    ctx.lineWidth = Math.max(2, W * 0.01)
    ctx.beginPath()
    const rad = Math.hypot(W, H) * 0.5 * (1 - s)
    ctx.arc(W / 2, H / 2, rad, t / 90, t / 90 + Math.PI * 1.4)
    ctx.stroke()
    ctx.restore()
  }
}


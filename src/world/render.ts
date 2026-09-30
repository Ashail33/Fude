/**
 * Canvas renderer for the overworld. Draws at native pixel resolution
 * (16px tiles) into a small buffer, then scales it up by an integer factor.
 * Static layers are cached per map; only animated tiles are redrawn.
 *
 * Motion: every world object is snapped to the art-pixel grid, but the
 * camera is kept at device-pixel precision — the buffer is one art pixel
 * larger than the view and the stage is translated by the camera's
 * sub-pixel remainder in CSS. The camera follows the mage's *snapped*
 * position plus a springy look-ahead, so the mage never jitters against
 * the world and scrolling stays silky at any scale.
 *
 * The frame loop allocates nothing in steady state (pooled particles,
 * reused draw records, per-walker sprite frame caches).
 */
import { animAt, spriteCanvas, spriteSize as rawSpriteSize, type Anim, type Dir, type SpriteId, type SpriteOpts } from '../art'
import { PAL } from '../art/palette'
import { computeNeighbours, drawTile as rawDrawTile, tileCanvas, tileFrame, tileVariant, type Neighbours, type TileId } from '../art/tiles'

// The art library is authored concurrently; never let a missing sprite/tile kill the frame loop.
const broken = new Set<string>()
function safeSprite(id: SpriteId, opts: SpriteOpts): HTMLCanvasElement | null {
  if (broken.has(id)) return null
  try {
    return spriteCanvas(id, opts)
  } catch (err) {
    broken.add(id)
    console.warn('sprite unavailable', id, err)
    return null
  }
}
function drawSprite(ctx: CanvasRenderingContext2D, id: SpriteId, x: number, y: number, opts: SpriteOpts) {
  const c = safeSprite(id, opts)
  if (c) ctx.drawImage(c, Math.round(x), Math.round(y))
}
const EXTRA: { tx?: number; ty?: number; under?: TileId } = {}
/** Draw a tile. `cell` gives positional variation; `bare` skips the prop's built-in ground (drawn over existing ground). */
function drawTile(ctx: CanvasRenderingContext2D, id: TileId, x: number, y: number, scale: number, time: number, nb: Neighbours, cx?: number, cy?: number, bare = false) {
  if (broken.has('t:' + id)) return
  try {
    EXTRA.tx = cx
    EXTRA.ty = cy
    EXTRA.under = bare ? id : undefined
    rawDrawTile(ctx, id, x, y, scale, time, nb, EXTRA)
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
import { DIRS, OPPOSITE, WALK_SPEED, npcState, springStep, walkFrame, type Walker, type World } from './engine'
import { chooseScale } from './engine'
import { ANIMATED } from './mapdef'
import type { Entity, Exit, GameMap, ParticleKind, Pt } from './types'
import { PostFX, type FxFrame } from '../fx/PostFX'
import { gradeFor } from '../fx/grades'
import { mapLights, tileLight, type Light } from '../fx/lights'

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

type PuffKind = 'leaf' | 'dust' | 'step' | 'ripple' | 'spark'
interface Puff {
  on: boolean
  kind: PuffKind
  /** World px (centre). */
  x: number
  y: number
  at: number
  life: number
  seed: number
  /** Horizontal drift direction for dust (−1 / 0 / 1). */
  dx: number
}

/** Per-sprite animation bookkeeping (turns, idle timer, contact frames, frame cache). */
interface AnimState {
  dir: Dir
  shown: Dir
  turnAt: number
  turnVia: Dir | null
  idleSince: number
  lastFrame: number
  wasMoving: boolean
  // frame cache
  kId: string
  kDir: Dir | ''
  kAnim: Anim | ''
  kBlink: boolean
  kOutfit: string
  frames: (HTMLCanvasElement | null | undefined)[]
}

interface DrawRec {
  y: number
  kind: 0 | 1 | 2
  e: Entity | null
}

const LIFT = 4
/** Opposite turns pass through a side-facing frame for this long (ms). */
const TURN_MS = 70
const PUFFS = 40
const byY = (a: DrawRec, b: DrawRec) => a.y - b.y
const RUSTLE_MS = 520
const easeOutBack = (t: number) => {
  const c = 1.9
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}
const smooth = (t: number) => t * t * (3 - 2 * t)

const PERP: Record<Dir, Dir> = { up: 'right', down: 'left', left: 'down', right: 'down' }

function newAnim(dir: Dir): AnimState {
  return { dir, shown: dir, turnAt: -1e9, turnVia: null, idleSince: 0, lastFrame: -1, wasMoving: false, kId: '', kDir: '', kAnim: '', kBlink: false, kOutfit: '', frames: [] }
}

/** Interpolated tile-tween position (top-left of the tile, world px) into `out`. */
function wpos(w: { x: number; y: number; px: number; py: number; t: number }, out: Pt): Pt {
  const t = w.t < 1 ? w.t : 1
  out.x = (w.px + (w.x - w.px) * t) * 16
  out.y = (w.py + (w.y - w.py) * t) * 16
  return out
}

export class Renderer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  buf: HTMLCanvasElement
  b: CanvasRenderingContext2D
  /** The element translated by the camera's sub-pixel remainder (canvas parent). */
  stage: HTMLElement | null
  scale = 3
  dpr = 1
  /** Buffer size in art px (view + 1 for the sub-pixel margin). */
  vw = 0
  vh = 0
  /** Visible size in art px (fractional). */
  viewW = 0
  viewH = 0
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
  /** Integer camera (top-left of the buffer, world px). */
  cam: Pt = { x: 0, y: 0 }
  /** Exact camera (device-pixel quantised). */
  camF: Pt = { x: 0, y: 0 }
  /** 0 = clear, 1 = black. Rendered by the overlay (see `iris`), not the canvas. */
  fade = 1
  battleFx: { start: number; snap: HTMLCanvasElement | null } | null = null
  shake = 0
  /** Last tap-to-walk target (drawn briefly). */
  tap: { x: number; y: number; at: number } | null = null
  /** HD-2D WebGL post-process (null → plain 2D). */
  fx: PostFX | null = null
  /** Static tile lights of the current map (world px). */
  lights: Light[] = []

  private puffs: Puff[] = Array.from({ length: PUFFS }, () => ({ on: false, kind: 'dust' as PuffKind, x: 0, y: 0, at: 0, life: 1, seed: 0, dx: 0 }))
  private puffN = 0
  private rustles = Array.from({ length: 8 }, () => ({ i: -1, at: -1e9 }))
  private rustleN = 0
  private anims = new WeakMap<object, AnimState>()
  private recs: DrawRec[] = []
  private camS = { x: 0, y: 0, vx: 0, vy: 0 }
  private fudeS = { x: 0, y: 0, vx: 0, vy: 0 }
  private snapNext = true
  private stageX = NaN
  private stageY = NaN
  private p0: Pt = { x: 0, y: 0 }
  private p1: Pt = { x: 0, y: 0 }
  private markerSince = new Map<string, number>()
  private prompt: { e: Entity | null; since: number; out: number } = { e: null, since: 0, out: 0 }
  private chestSeen: Set<string> | null = null
  private chestAnim: { e: Entity; at: number } | null = null
  private bubble: HTMLCanvasElement | null = null
  private fxFrame: FxFrame = { cam: { x: 0, y: 0 }, focusY: 0, now: 0, fade: 0 }
  private lightBuf: Light[] = []
  private lightPool: Light[] = []
  private entLights = new WeakMap<Entity, Light | null>()
  /** Per animated cell: cached tile canvases by frame (ground, object). */
  private animCache: (HTMLCanvasElement | undefined)[][] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.buf = document.createElement('canvas')
    this.b = this.buf.getContext('2d')!
    this.stage = canvas.parentElement
    try {
      if (canvas.parentElement) this.fx = new PostFX(canvas.parentElement, canvas)
    } catch (err) {
      console.warn('[fx] unavailable', err)
    }
  }

  dispose() {
    this.fx?.dispose()
    this.fx = null
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.dpr = dpr
    const W = Math.round(cssW * dpr)
    const H = Math.round(cssH * dpr)
    this.scale = chooseScale(cssW, cssH, dpr)
    this.viewW = W / this.scale
    this.viewH = H / this.scale
    // one extra art pixel each way: room for the sub-pixel camera shift
    this.vw = Math.ceil(this.viewW) + 1
    this.vh = Math.ceil(this.viewH) + 1
    this.canvas.width = this.vw * this.scale
    this.canvas.height = this.vh * this.scale
    this.canvas.style.width = `${this.canvas.width / dpr}px`
    this.canvas.style.height = `${this.canvas.height / dpr}px`
    this.buf.width = this.vw
    this.buf.height = this.vh
    this.vignette = null
    this.fx?.resize(this.vw, this.vh, this.scale, dpr)
    this.seedParticles()
    this.snapNext = true
  }

  /** Screen (CSS px) → map tile. */
  tileAt(cssX: number, cssY: number): Pt {
    const f = this.dpr / this.scale
    // (coordinates relative to the canvas, which already carries the sub-pixel shift)
    return { x: Math.floor((cssX * f + this.cam.x) / 16), y: Math.floor((cssY * f + this.cam.y) / 16) }
  }

  /** World px → screen CSS px (for DOM overlays such as the iris). */
  toScreen(wx: number, wy: number, out: Pt): Pt {
    const f = this.scale / this.dpr
    out.x = (wx - this.camF.x) * f
    out.y = (wy - this.camF.y) * f
    return out
  }

  /** The mage's centre on screen (CSS px). */
  playerScreen(world: World, out: Pt): Pt {
    wpos(world.player, this.p1)
    return this.toScreen(Math.round(this.p1.x) + 8, Math.round(this.p1.y) + 6, out)
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
    this.animCache = []
    const inb = (x: number, y: number) => x >= 0 && y >= 0 && x < m.w && y < m.h
    const gGet = (x: number, y: number) => (inb(x, y) ? m.ground[y * m.w + x] : null)
    const oGet = (x: number, y: number) => (inb(x, y) ? (m.obj[y * m.w + x] ?? m.ground[y * m.w + x]) : null)
    const vGet = (x: number, y: number) => (inb(x, y) ? (m.over[y * m.w + x] ?? m.ground[y * m.w + x]) : null)
    this.overNb = []
    for (let y = 0; y < m.h; y++)
      for (let x = 0; x < m.w; x++) {
        const i = y * m.w + x
        this.groundNb[i] = computeNeighbours(gGet, x, y)
        this.objNb[i] = m.obj[i] ? computeNeighbours(oGet, x, y) : 0
        this.overNb[i] = m.over[i] ? computeNeighbours(vGet, x, y) : 0
        drawTile(g, m.ground[i], x * 16, y * 16, 1, 0, this.groundNb[i], x, y)
        const o = m.obj[i]
        if (o) drawTile(g, o, x * 16, y * 16, 1, 0, this.objNb[i], x, y, true)
        if (ANIMATED.has(m.ground[i]) || (o && ANIMATED.has(o))) {
          this.animCells.push(i)
          this.animCache.push([])
        }
        if (m.over[i]) this.overCells.push(i)
      }
    this.stat = c
    const grade = gradeFor(m.spec)
    this.fx?.setGrade(grade)
    this.lights = mapLights(m, grade.night)
    this.particleKind = m.spec.particles
    this.seedParticles()
    this.snapNext = true
    this.markerSince.clear()
    this.chestSeen = null
    this.chestAnim = null
    this.prompt.e = null
    for (const p of this.puffs) p.on = false
    for (const r of this.rustles) r.i = -1
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

  // ─── pooled effects ──────────────────────────────────────────────
  /** Spawn a short effect at world px (x, y). Legacy tile form: puff(tx, ty, kind). */
  puff(x: number, y: number, kind: PuffKind, now = performance.now(), dx = 0, world = false) {
    const p = this.puffs[this.puffN++ % PUFFS]
    p.on = true
    p.kind = kind
    p.x = world ? x : x * 16 + 8
    p.y = world ? y : y * 16 + 13
    p.at = now
    p.life = kind === 'ripple' ? 700 : kind === 'leaf' ? 480 : kind === 'spark' ? 650 : kind === 'step' ? 260 : 420
    p.seed = (this.puffN * 2.399) % 6.283
    p.dx = dx
  }

  private rustle(i: number, now: number) {
    const r = this.rustles[this.rustleN++ % this.rustles.length]
    r.i = i
    r.at = now
  }

  private rustleOffset(i: number, now: number): number {
    for (const r of this.rustles) {
      if (r.i !== i) continue
      const t = now - r.at
      if (t < 0 || t > RUSTLE_MS) continue
      const k = 1 - t / RUSTLE_MS
      return Math.round(Math.sin(t / 38) * 1.6 * k)
    }
    return 0
  }

  private drawPuffs(now: number) {
    const b = this.b
    const cam = this.cam
    for (const p of this.puffs) {
      if (!p.on) continue
      const age = now - p.at
      if (age > p.life || age < 0) {
        p.on = age < 0
        continue
      }
      const t = age / p.life
      const cx = p.x - cam.x
      const cy = p.y - cam.y
      switch (p.kind) {
        case 'leaf': {
          // blades flung up and out, tumbling back down
          b.globalAlpha = 1 - t * t
          for (let k = 0; k < 5; k++) {
            const a = p.seed + (k / 5) * Math.PI * 2
            const r = 2 + t * 7
            const up = Math.sin(t * Math.PI) * 7
            b.fillStyle = k % 2 ? PAL.grassLight : PAL.leaf
            b.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy - 2 - up + Math.sin(a) * 2 + t * 3), 1, k % 3 === 0 ? 2 : 1)
          }
          break
        }
        case 'dust': {
          // two soft clouds kicked back from the heels, rising and fading
          b.globalAlpha = 0.85 * (1 - t)
          b.fillStyle = PAL.sand
          const r = 1 + Math.round(t * 2.5)
          const drift = -p.dx * t * 5
          b.fillRect(Math.round(cx - 4 - t * 3 + drift), Math.round(cy - r - t * 2), r, r)
          b.fillRect(Math.round(cx + 3 + t * 3 + drift), Math.round(cy - r - t * 3), r, r)
          b.fillStyle = PAL.paper
          if (t < 0.5) b.fillRect(Math.round(cx - 1 + drift), Math.round(cy - 1 - t * 4), 2, 1)
          break
        }
        case 'step': {
          b.globalAlpha = 0.55 * (1 - t)
          b.fillStyle = PAL.sand
          b.fillRect(Math.round(cx - 3 - t * 2), Math.round(cy - t * 2), 1, 1)
          b.fillRect(Math.round(cx + 2 + t * 2), Math.round(cy - t * 2), 1, 1)
          break
        }
        case 'ripple': {
          b.globalAlpha = 0.8 * (1 - t)
          b.fillStyle = PAL.foam
          const rx = 3 + t * 9
          const ry = rx * 0.45
          for (let k = 0; k < 16; k++) {
            const a = (k / 16) * Math.PI * 2
            b.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1)
          }
          break
        }
        case 'spark': {
          b.globalAlpha = 1 - t
          for (let k = 0; k < 8; k++) {
            const a = p.seed + (k / 8) * Math.PI * 2
            const r = 3 + easeOutQuad(t) * 12
            b.fillStyle = k % 2 ? PAL.gold : PAL.white
            const x = Math.round(cx + Math.cos(a) * r)
            const y = Math.round(cy + Math.sin(a) * r * 0.8 - t * 6)
            b.fillRect(x, y, 1, 1)
            if (t < 0.4 && k % 2 === 0) {
              b.fillRect(x - 1, y, 3, 1)
              b.fillRect(x, y - 1, 1, 3)
            }
          }
          break
        }
      }
    }
    b.globalAlpha = 1
  }

  startBattleFx(now: number) {
    // The FX canvas is on top; bake its last frame into the 2D canvas the effect animates.
    this.fx?.drawTo(this.ctx, this.vw * this.scale, this.vh * this.scale)
    this.fx?.setVisible(false)
    const snap = document.createElement('canvas')
    snap.width = this.canvas.width
    snap.height = this.canvas.height
    snap.getContext('2d')!.drawImage(this.canvas, 0, 0)
    this.battleFx = { start: now, snap }
  }

  // ─── characters ──────────────────────────────────────────────────
  private animOf(key: object, dir: Dir): AnimState {
    let st = this.anims.get(key)
    if (!st) {
      st = newAnim(dir)
      this.anims.set(key, st)
    }
    return st
  }

  /** Facing to draw: 180° turns pass through a side-facing frame. */
  private shownDir(st: AnimState, dir: Dir, now: number): Dir {
    if (dir !== st.dir) {
      st.turnVia = OPPOSITE[st.dir] === dir ? (dir === 'up' || dir === 'down' ? (st.shown === 'left' ? 'left' : 'right') : PERP[dir]) : null
      st.turnAt = now
      st.dir = dir
    }
    return st.turnVia && now - st.turnAt < TURN_MS ? st.turnVia : dir
  }

  private frameCanvas(st: AnimState, id: SpriteId, dir: Dir, anim: Anim, frame: number, blink: boolean, outfit: string): HTMLCanvasElement | null {
    if (st.kId !== id || st.kDir !== dir || st.kAnim !== anim || st.kBlink !== blink || st.kOutfit !== outfit) {
      st.kId = id
      st.kDir = dir
      st.kAnim = anim
      st.kBlink = blink
      st.kOutfit = outfit
      st.frames.length = 0
    }
    let c = st.frames[frame]
    if (c === undefined) {
      c = safeSprite(id, { dir, frame, anim, blink, outfit: outfit || undefined })
      st.frames[frame] = c
    }
    return c
  }

  private shadow(x: number, y: number, w = 1) {
    const b = this.b
    b.fillStyle = 'rgba(20, 10, 30, 0.25)'
    b.fillRect(x + 5, y + 11, 6, 1)
    b.fillRect(x + 4 - w, y + 12, 8 + w * 2, 2)
    b.fillRect(x + 5, y + 14, 6, 1)
  }

  /** Hide the feet in tall grass (redraw the grass tile's lower half over them). */
  private grassOverFeet(cx: number, cy: number, now: number) {
    const m = this.map!
    const i = cy * m.w + cx
    if (m.ground[i] !== 'tall-grass') return
    const b = this.b
    const x = cx * 16 - this.cam.x
    const y = cy * 16 - this.cam.y
    b.save()
    b.beginPath()
    b.rect(x, y + 9, 16, 7)
    b.clip()
    drawTile(b, 'tall-grass', x + this.rustleOffset(i, now), y, 1, now, this.groundNb[i], cx, cy)
    b.restore()
  }

  private drawPlayer(world: World, now: number, info: RenderInfo) {
    const w = world.player
    const st = this.animOf(w, w.dir)
    const p = wpos(w, this.p0)
    const x = Math.round(p.x) - this.cam.x
    const y = Math.round(p.y) - this.cam.y
    const moving = w.t < 1
    const dir = this.shownDir(st, w.dir, now)
    let anim: Anim = 'idle'
    let frame = 0
    let blink = false
    if (moving) {
      anim = world.vel > (WALK_SPEED * 1.35) ? 'run' : 'walk'
      frame = walkFrame(w.steps, w.t)
    } else {
      if (st.wasMoving) st.idleSince = now
      ;({ frame, blink } = animAt('idle', now - st.idleSince))
    }
    // footfalls land on the contact frames
    if (moving && (frame === 0 || frame === 2) && frame !== st.lastFrame) this.footfall(world, w, anim === 'run', now, !st.wasMoving)
    st.lastFrame = moving ? frame : -1
    st.wasMoving = moving
    this.shadow(x, y, anim === 'run' ? 0 : 1)
    const c = this.frameCanvas(st, 'mage', dir, anim, frame, blink, info.outfit)
    if (c) this.b.drawImage(c, x, y - LIFT)
    const cx = moving && w.t < 0.4 ? w.px : w.x
    const cy = moving && w.t < 0.4 ? w.py : w.y
    this.grassOverFeet(cx, cy, now)
  }

  /** A foot touches down: dust when running, grass rustles, ripples on stepping stones. */
  private footfall(world: World, w: Walker, running: boolean, now: number, start: boolean) {
    const m = this.map!
    const i = w.y * m.w + w.x
    const g = m.ground[i]
    const d = DIRS[w.dir]
    const fx = (w.px + (w.x - w.px) * Math.min(1, w.t)) * 16 + 8
    const fy = (w.py + (w.y - w.py) * Math.min(1, w.t)) * 16 + 13
    if (g === 'tall-grass') {
      this.rustle(i, now)
      this.puff(fx + d.x * 8, fy + d.y * 6, 'leaf', now, d.x, true)
    }
    const pi = w.py * m.w + w.px
    if (m.ground[pi] === 'tall-grass') this.rustle(pi, now)
    const o = m.obj[i]
    if (g === 'stepping-stone' || o === 'stepping-stone' || g === 'bridge-h' || g === 'bridge-v' || o === 'bridge-h' || o === 'bridge-v') this.puff(w.x * 16 + 8, w.y * 16 + 12, 'ripple', now, 0, true)
    else if (g !== 'tall-grass') {
      if (running || start) this.puff(fx, fy, 'dust', now, d.x, true)
      else if (g === 'sand' || g === 'dirt' || g === 'path' || g === 'snow') this.puff(fx, fy, 'step', now, d.x, true)
    }
    void world
  }

  private drawFude(world: World, now: number) {
    const w = world.fude
    const st = this.animOf(w, w.dir)
    const s = this.fudeS
    const dir = this.shownDir(st, w.dir, now)
    const moving = w.t < 1 || Math.abs(s.vx) + Math.abs(s.vy) > 12
    const { frame, blink } = animAt(moving ? 'run' : 'walk', now, { float: true, seed: 3 })
    const x = Math.round(s.x) - this.cam.x
    const y = Math.round(s.y) - this.cam.y
    const hover = -5 + Math.round(Math.sin(now / 1100))
    // shadow shrinks as Fude rises
    const b = this.b
    b.fillStyle = 'rgba(20, 10, 30, 0.2)'
    b.fillRect(x + 5, y + 12, 6, 2)
    const c = this.frameCanvas(st, 'fude', dir, 'walk', frame, blink, '')
    if (c) b.drawImage(c, x, y - LIFT + hover)
  }

  private drawEntity(e: Entity, now: number, info: RenderInfo) {
    const b = this.b
    const ghost = info.ghosts.has(e.spec.id)
    if (ghost) b.globalAlpha = 0.28 + 0.18 * Math.sin(now / 180 + e.x)
    const p = wpos(e, this.p0)
    const x = Math.round(p.x) - this.cam.x
    const y = Math.round(p.y) - this.cam.y
    let tile: TileId | undefined = e.spec.tile
    if (e.spec.kind === 'chest') {
      tile = info.opened.has(e.spec.id) ? 'chest-open' : 'chest'
      const ca = this.chestAnim
      if (ca && ca.e === e) {
        const t = now - ca.at
        // anticipation squash, then the lid flies open with a hop
        if (t < 110) {
          tile = 'chest'
          drawTile(b, tile, x + (t < 55 ? -1 : 1), y + 1, 1, now, 0, e.x, e.y, true)
          tile = undefined
        } else if (t < 420) {
          const hop = Math.round(Math.sin(((t - 110) / 310) * Math.PI) * 3)
          drawTile(b, 'chest-open', x, y - hop, 1, now, 0, e.x, e.y, true)
          tile = undefined
        } else if (t > 1100) this.chestAnim = null
        if (t >= 110 && t < 1100) {
          // light column + rising sparkle
          const k = 1 - Math.min(1, (t - 110) / 990)
          b.globalAlpha = 0.5 * k
          b.fillStyle = PAL.light
          b.fillRect(x + 5, y - 20 + Math.round(k * 6), 6, 22)
          b.fillStyle = PAL.white
          b.fillRect(x + 7, y - 24 + Math.round(k * 6), 2, 26)
          b.globalAlpha = 1
          const rise = Math.round(easeOutQuad(Math.min(1, (t - 110) / 500)) * 14)
          drawSprite(b, 'star', x, y - 6 - rise, {})
        }
      }
    }
    if (tile) {
      const jitter = ghost && Math.sin(now / 90 + e.y) > 0.85 ? 1 : 0
      drawTile(b, tile, x + jitter, y, 1, now, 0, e.x, e.y, true)
    }
    const sprite = e.spec.sprite
    if (sprite) {
      if (e.big) {
        b.fillStyle = 'rgba(20, 10, 30, 0.3)'
        b.fillRect(x + 4, y + 12, 24, 4)
        const bob = Math.round(Math.sin(now / 420) * 1)
        const sz = spriteSize(sprite)
        drawSprite(b, sprite, x + 16 - sz.w / 2, y + 16 - sz.h + bob, { frame: Math.floor(now / 450) % 2 })
      } else {
        const st = this.animOf(e, e.dir)
        const moving = e.t < 1
        const dir = this.shownDir(st, e.dir, now)
        let frame = 0
        let blink = false
        const seed = (e.hx * 7 + e.hy * 3) % 11
        if (moving) frame = walkFrame(npcState(e).steps - 1, e.t)
        else ({ frame, blink } = animAt('idle', now, { seed, float: sprite === 'fude' }))
        if (!tile) this.shadow(x, y)
        const c = this.frameCanvas(st, sprite, dir, moving ? 'walk' : 'idle', frame, blink, '')
        if (c) b.drawImage(c, x, y - LIFT)
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

  /** Top of an entity's drawn sprite (buffer px) and its centre x. */
  private headOf(e: Entity, out: Pt): Pt {
    const p = wpos(e, out)
    const cx = Math.round(p.x) - this.cam.x + (e.big ? 16 : 8)
    const top = Math.round(p.y) - this.cam.y + (e.big && e.spec.sprite ? 14 - spriteSize(e.spec.sprite).h : e.spec.sprite ? -LIFT - 2 : 0)
    out.x = cx
    out.y = top
    return out
  }

  private getBubble(): HTMLCanvasElement {
    if (this.bubble) return this.bubble
    const c = document.createElement('canvas')
    c.width = 11
    c.height = 12
    const b = c.getContext('2d')!
    b.fillStyle = PAL.ink
    b.fillRect(1, 0, 9, 11)
    b.fillRect(0, 1, 11, 9)
    b.fillStyle = PAL.white
    b.fillRect(2, 1, 7, 9)
    b.fillRect(1, 2, 9, 7)
    b.fillStyle = PAL.ink
    b.fillRect(5, 11, 1, 1)
    b.fillStyle = PAL.vermilion
    b.fillRect(5, 2, 1, 5)
    b.fillRect(4, 3, 3, 3)
    b.fillRect(5, 8, 1, 1)
    this.bubble = c
    return c
  }

  /** "!" bubble with a springy pop: `k` is the pop progress (0..1, eased with overshoot). */
  private drawBubble(cx: number, bottom: number, k: number) {
    const bub = this.getBubble()
    const sy = easeOutBack(Math.min(1, k))
    const sx = Math.min(1.25, 0.6 + 0.4 * easeOutBack(Math.min(1, k * 1.2)))
    const w = Math.max(1, Math.round(11 * sx))
    const h = Math.max(1, Math.round(12 * sy))
    this.b.drawImage(bub, cx - (w >> 1), bottom - h, w, h)
  }

  private drawMarker(e: Entity, kind: 'next' | 'done', now: number) {
    const b = this.b
    const hp = this.headOf(e, this.p1)
    const cx = hp.x
    const top = hp.y
    if (kind === 'next') {
      let since = this.markerSince.get(e.spec.id)
      if (since === undefined) {
        since = now
        this.markerSince.set(e.spec.id, now)
      }
      const k = (now - since) / 380
      const bob = k >= 1 ? Math.round(Math.sin((now - since) / 160) * 1.5) : 0
      this.drawBubble(cx, top - 1 + bob, k)
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

  /** What the mage is facing that can be talked to / opened (for the interaction prompt). */
  private facedEntity(world: World, info: RenderInfo): Entity | null {
    const p = world.player
    if (p.t < 1 || world.frozen) return null
    const d = DIRS[p.dir]
    const fx = p.x + d.x
    const fy = p.y + d.y
    for (const e of world.ents) {
      const hit = e.big ? fx >= e.x && fx <= e.x + 1 && fy >= e.y - 1 && fy <= e.y : e.x === fx && e.y === fy
      if (!hit) continue
      if (e.spec.kind === 'chest' && info.opened.has(e.spec.id)) return null
      return e
    }
    return null
  }

  /** Small white "…" prompt that pops (with overshoot) over what the mage faces. */
  private drawPrompt(world: World, now: number, info: RenderInfo) {
    const e = this.facedEntity(world, info)
    const pr = this.prompt
    if (e !== pr.e) {
      if (e) pr.since = now + 90 // brief beat before popping, so walking past doesn't flicker
      pr.e = e
    }
    if (!e || now < pr.since || info.markers.get(e.spec.id) === 'next') return
    const k = Math.min(1, (now - pr.since) / 260)
    const hp = this.headOf(e, this.p1)
    const b = this.b
    const sy = easeOutBack(k)
    const h = Math.max(1, Math.round(8 * sy))
    const w = Math.max(3, Math.round(11 * Math.min(1.2, 0.5 + 0.5 * easeOutBack(Math.min(1, k * 1.3)))))
    const bottom = hp.y - 1 + (k >= 1 ? Math.round(Math.sin((now - pr.since) / 220)) : 0)
    const x0 = hp.x - (w >> 1)
    b.fillStyle = PAL.ink
    b.fillRect(x0, bottom - h, w, h)
    b.fillRect(hp.x, bottom, 1, 1)
    if (h > 2 && w > 2) {
      b.fillStyle = PAL.white
      b.fillRect(x0 + 1, bottom - h + 1, w - 2, h - 2)
      if (k > 0.5) {
        b.fillStyle = PAL.ink
        const my = bottom - (h >> 1) - 1
        const dots = Math.min(3, Math.floor((now - pr.since) / 180) % 4)
        for (let i = 0; i < 3; i++) if (i <= dots) b.fillRect(hp.x - 3 + i * 3, my, 1, 1)
      }
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

  // ─── camera ──────────────────────────────────────────────────────
  private updateCamera(world: World, dt: number) {
    const m = this.map!
    const pl = world.player
    const pp = wpos(pl, this.p0)
    const px = Math.round(pp.x)
    const py = Math.round(pp.y)
    const moving = pl.t < 1
    const d = DIRS[pl.dir]
    // look-ahead: a little while standing, more walking, most when running
    const look = moving ? (world.vel > WALK_SPEED * 1.35 ? 26 : 14) : 7
    const tx = d.x * look
    const ty = d.y * look * 0.7
    const cs = this.camS
    if (this.snapNext) {
      cs.x = tx
      cs.y = ty
      cs.vx = cs.vy = 0
    } else springStep(cs, tx, ty, 4.2, 1, dt)
    // Fude's lazy spring toward its tile
    const fs = this.fudeS
    const fp = wpos(world.fude, this.p1)
    if (this.snapNext || Math.abs(fs.x - fp.x) + Math.abs(fs.y - fp.y) > 56) {
      fs.x = fp.x
      fs.y = fp.y
      fs.vx = fs.vy = 0
    } else springStep(fs, fp.x, fp.y, 8, 0.62, dt)
    this.snapNext = false
    const clamp = (c: number, view: number, size: number) => (size <= view ? -(view - size) / 2 : Math.max(0, Math.min(size - view, c - view / 2)))
    let cx = clamp(px + 8 + cs.x, this.viewW, m.w * 16)
    let cy = clamp(py + 8 + cs.y, this.viewH, m.h * 16)
    if (this.shake > 0) {
      cx += Math.round((Math.random() - 0.5) * this.shake)
      cy += Math.round((Math.random() - 0.5) * this.shake)
      this.shake = Math.max(0, this.shake - dt * 30)
    }
    // quantise to device pixels; the integer part positions the buffer, the rest the stage
    const s = this.scale
    this.camF.x = Math.round(cx * s) / s
    this.camF.y = Math.round(cy * s) / s
    this.cam.x = Math.floor(this.camF.x)
    this.cam.y = Math.floor(this.camF.y)
    const ox = -((this.camF.x - this.cam.x) * s) / this.dpr
    const oy = -((this.camF.y - this.cam.y) * s) / this.dpr
    if (this.stage && (ox !== this.stageX || oy !== this.stageY)) {
      this.stageX = ox
      this.stageY = oy
      this.stage.style.transform = `translate3d(${ox}px, ${oy}px, 0)`
    }
  }

  /** Force the camera and Fude to their targets on the next frame (after teleports). */
  snap() {
    this.snapNext = true
  }

  draw(world: World, now: number, dt: number, info: RenderInfo) {
    const m = this.map
    if (!m || !this.stat) return
    const b = this.b
    b.imageSmoothingEnabled = false
    this.updateCamera(world, dt)
    const cam = this.cam
    b.fillStyle = m.spec.bg ?? PAL.leafDark
    b.fillRect(0, 0, this.vw, this.vh)
    b.drawImage(this.stat, -cam.x, -cam.y)

    // chests opened since last frame get their lid animation
    if (!this.chestSeen) this.chestSeen = new Set(info.opened)
    else if (info.opened.size !== this.chestSeen.size) {
      for (const e of world.ents) if (e.spec.kind === 'chest' && info.opened.has(e.spec.id) && !this.chestSeen.has(e.spec.id)) {
        this.chestAnim = { e, at: now }
        this.puff(e.x * 16 + 8, e.y * 16 + 4, 'spark', now + 110, 0, true)
      }
      this.chestSeen = new Set(info.opened)
    }

    // animated tiles in view (cached canvases per cell and frame)
    const tx0 = Math.max(0, Math.floor(cam.x / 16))
    const ty0 = Math.max(0, Math.floor(cam.y / 16))
    const tx1 = Math.min(m.w - 1, Math.floor((cam.x + this.vw) / 16))
    const ty1 = Math.min(m.h - 1, Math.floor((cam.y + this.vh) / 16))
    for (let k = 0; k < this.animCells.length; k++) {
      const i = this.animCells[k]
      const x = i % m.w
      const y = (i - x) / m.w
      if (x < tx0 || x > tx1 || y < ty0 || y > ty1) continue
      const sx = x * 16 - cam.x
      const sy = y * 16 - cam.y
      const g = m.ground[i]
      const cache = this.animCache[k]
      const gf = ANIMATED.has(g) ? tileFrame(g, now, x, y) : 0
      let gc = cache[gf]
      if (!gc) {
        try {
          gc = tileCanvas(g, tileVariant(g, x, y), gf, this.groundNb[i])
          cache[gf] = gc
        } catch {
          continue
        }
      }
      b.drawImage(gc, sx, sy)
      if (g === 'tall-grass') {
        const off = this.rustleOffset(i, now)
        if (off) {
          b.save()
          b.beginPath()
          b.rect(sx, sy, 16, 16)
          b.clip()
          b.drawImage(gc, sx + off, sy)
          b.restore()
        }
      }
      const o = m.obj[i]
      if (o) {
        const of = 64 + (ANIMATED.has(o) ? tileFrame(o, now, x, y) : 0)
        let oc = cache[of]
        if (!oc) {
          try {
            oc = tileCanvas(o, tileVariant(o, x, y), of - 64, this.objNb[i], o)
            cache[of] = oc
          } catch {
            continue
          }
        }
        b.drawImage(oc, sx, sy)
      }
    }
    for (const ex of m.exits.values()) if (info.exitLocked(ex)) this.drawBarrier(ex, now)

    // y-sorted sprites (reused records, no closures)
    const recs = this.recs
    const n = world.ents.length + 2
    while (recs.length < n) recs.push({ y: 0, kind: 0, e: null })
    recs.length = n
    let r = 0
    for (const e of world.ents) {
      const rec = recs[r++]
      rec.kind = 0
      rec.e = e
      rec.y = wpos(e, this.p0).y + (e.spec.tile && !e.spec.sprite ? -1 : 0)
    }
    recs[r].kind = 1
    recs[r].e = null
    recs[r++].y = this.fudeS.y - 0.5
    recs[r].kind = 2
    recs[r].e = null
    recs[r++].y = wpos(world.player, this.p0).y
    recs.sort(byY)
    this.drawPuffs(now)
    for (const rec of recs) {
      if (rec.kind === 0) this.drawEntity(rec.e!, now, info)
      else if (rec.kind === 1) this.drawFude(world, now)
      else this.drawPlayer(world, now, info)
    }

    // overhead layer (torii, canopy)
    for (const i of this.overCells) {
      const x = i % m.w
      const y = (i - x) / m.w
      if (x < tx0 || x > tx1 || y < ty0 || y > ty1) continue
      drawTile(b, m.over[i]!, x * 16 - cam.x, y * 16 - cam.y, 1, now, this.overNb[i], x, y, true)
    }
    for (const e of world.ents) {
      const mk = info.markers.get(e.spec.id)
      if (mk) this.drawMarker(e, mk, now)
    }
    this.drawPrompt(world, now, info)
    if (this.tap) {
      const age = now - this.tap.at
      if (age > 450) this.tap = null
      else {
        const x = this.tap.x * 16 - cam.x
        const y = this.tap.y * 16 - cam.y
        const k = age / 450
        const o = Math.round(easeOutQuad(k) * 3)
        b.globalAlpha = 1 - k
        b.fillStyle = PAL.white
        for (let c = 0; c < 4; c++) {
          const sx = c & 1 ? -1 : 1
          const sy = c & 2 ? -1 : 1
          const cx = c & 1 ? x + 15 + o : x - o
          const cy = c & 2 ? y + 15 + o : y - o
          b.fillRect(Math.min(cx, cx + sx * 3), cy, 4, 1)
          b.fillRect(cx, Math.min(cy, cy + sy * 3), 1, 4)
        }
        b.globalAlpha = 1
      }
    }
    this.updateParticles(dt, now)

    const fx = this.fx
    if (fx && fx.active && !this.battleFx) {
      fx.setLights(this.frameLights(world, now, info))
      const f = this.fxFrame
      f.cam.x = cam.x
      f.cam.y = cam.y
      f.focusY = wpos(world.player, this.p0).y - cam.y + 12
      f.now = now
      f.fade = 0
      if (fx.render(this.buf, f)) return
    }
    fx?.setVisible(false)

    // upscale to screen
    const ctx = this.ctx
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.buf, 0, 0, this.vw * this.scale, this.vh * this.scale)
    if (m.spec.tint) {
      ctx.fillStyle = m.spec.tint
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
    ctx.drawImage(this.getVignette(), 0, 0)
    if (this.battleFx) this.drawBattleFx(now)
  }

  private light(): Light {
    const l = this.lightPool[this.lightBuf.length]
    if (l) return l
    const n: Light = { x: 0, y: 0, r: 0, color: [1, 1, 1], intensity: 0, flicker: 0, seed: 0 }
    this.lightPool.push(n)
    return n
  }

  private pushLight(x: number, y: number, r: number, c0: number, c1: number, c2: number, intensity: number, flicker: number, seed: number) {
    const l = this.light()
    l.x = x
    l.y = y
    l.r = r
    const col = l.color as unknown as number[]
    col[0] = c0
    col[1] = c1
    col[2] = c2
    l.intensity = intensity
    l.flicker = flicker
    l.seed = seed
    this.lightBuf.push(l)
  }

  /** Static tile lights + entity props + the mage's staff orb, Fude, fireflies and quest markers. */
  private frameLights(world: World, now: number, info: RenderInfo): Light[] {
    const g = this.fx!.grade
    const out = this.lightBuf
    out.length = 0
    const nightK = Math.max(0.3, g.lights)
    for (const e of world.ents) {
      const p = wpos(e, this.p0)
      if (e.spec.tile && !info.ghosts.has(e.spec.id)) {
        let l = this.entLights.get(e)
        if (l === undefined) {
          l = tileLight(e.spec.tile, 0, 0, g.night)
          this.entLights.set(e, l)
        }
        if (l) this.pushLight(l.x + p.x, l.y + p.y, l.r, l.color[0], l.color[1], l.color[2], l.intensity, l.flicker, e.x * 1.7 + e.y)
      }
      // Quest markers stay readable at night.
      if (info.markers.get(e.spec.id) === 'next') this.pushLight(p.x + (e.big ? 16 : 8), p.y - 14, 22, 1, 0.95, 0.85, 0.7 / nightK, 0, 0)
    }
    const pp = wpos(world.player, this.p0)
    if (g.orb > 0) {
      const bob = Math.sin(now / 420) * 1.5
      this.pushLight(pp.x + 8, pp.y - 2 + bob, 50, 1, 0.82, 0.55, g.orb / nightK, 0.06, 1.3)
      this.pushLight(this.fudeS.x + 8, this.fudeS.y - 2, 26, 0.75, 0.9, 1, (g.orb * 0.6) / nightK, 0.1, 4.1)
    }
    if (this.particleKind === 'fireflies') {
      let n = 0
      for (const p of this.particles) {
        if (n++ >= 8) break
        const tw = (Math.sin(now / 300 + p.phase) + 1) / 2
        this.pushLight(p.x, p.y, 16, 0.85, 1, 0.45, tw * 0.7, 0, p.phase)
      }
    }
    // static lights last (they don't change); copy references, not objects
    for (const l of this.lights) out.push(l)
    return out
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

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t)
}

export { smooth as smoothstep }

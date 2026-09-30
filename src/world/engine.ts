/**
 * Overworld simulation (pure, no DOM): grid movement with tweening,
 * collision, following companion, wandering NPCs, pathfinding, encounters.
 */
import type { Dir } from '../art'
import { tileSolid } from './mapdef'
import type { Entity, Exit, GameMap, Pt } from './types'

export const DIRS: Record<Dir, Pt> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }
export const DIR_LIST: Dir[] = ['up', 'down', 'left', 'right']
export const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }

/** Tiles per second. */
export const WALK_SPEED = 4.2
export const RUN_SPEED = 8
export const NPC_SPEED = 2.6
/** Holding a new direction shorter than this only turns the mage. */
export const TURN_DELAY = 0.085
export const ENCOUNTER_CHANCE = 1 / 12
export const ENCOUNTER_GRACE = 6

export function dirBetween(a: Pt, b: Pt): Dir {
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left'
  return dy > 0 ? 'down' : 'up'
}

/** Cells covered by an entity (big sprites cover 2×2: x..x+1, y-1..y). */
export function entityCells(e: Pt & { big?: boolean }): Pt[] {
  if (!e.big) return [{ x: e.x, y: e.y }]
  return [
    { x: e.x, y: e.y },
    { x: e.x + 1, y: e.y },
    { x: e.x, y: e.y - 1 },
    { x: e.x + 1, y: e.y - 1 },
  ]
}

export function entityAt(ents: Entity[], x: number, y: number): Entity | undefined {
  return ents.find((e) => entityCells(e).some((c) => c.x === x && c.y === y) || (e.t < 1 && e.px === x && e.py === y))
}

/**
 * Breadth-first search on the tile grid (4-dir). Returns the path of cells
 * after `from` up to and including the first goal cell, or null.
 */
export function bfs(w: number, h: number, from: Pt, isGoal: (x: number, y: number) => boolean, passable: (x: number, y: number) => boolean, maxNodes = 5000): Pt[] | null {
  if (isGoal(from.x, from.y)) return []
  const prev = new Int32Array(w * h).fill(-2)
  const start = from.y * w + from.x
  prev[start] = -1
  const q = [start]
  let head = 0
  while (head < q.length && head < maxNodes) {
    const cur = q[head++]
    const cx = cur % w
    const cy = (cur - cx) / w
    for (const d of DIR_LIST) {
      const nx = cx + DIRS[d].x
      const ny = cy + DIRS[d].y
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
      const ni = ny * w + nx
      if (prev[ni] !== -2) continue
      const goal = isGoal(nx, ny)
      if (!goal && !passable(nx, ny)) continue
      prev[ni] = cur
      if (goal) {
        const path: Pt[] = []
        let c = ni
        while (c !== start) {
          path.push({ x: c % w, y: Math.floor(c / w) })
          c = prev[c]
        }
        return path.reverse()
      }
      q.push(ni)
    }
  }
  return null
}

/** Top-left camera position (in pixels) centring on (cx, cy), clamped to the map. */
export function cameraFor(cx: number, cy: number, viewW: number, viewH: number, mapW: number, mapH: number): Pt {
  const clamp = (c: number, view: number, size: number) => (size <= view ? -(view - size) / 2 : Math.max(0, Math.min(size - view, c - view / 2)))
  return { x: Math.round(clamp(cx, viewW, mapW)), y: Math.round(clamp(cy, viewH, mapH)) }
}

/**
 * Integer device-pixel scale for 16px tiles. Phones show ~12 tiles across,
 * tablets ~16, desktops ~20; at least 9 tiles stay visible vertically.
 */
export function chooseScale(cssW: number, cssH: number, dpr = 1): number {
  const target = cssW < 560 ? 12 : cssW < 1000 ? 16 : 20
  const W = cssW * dpr
  const H = cssH * dpr
  let s = Math.max(1, Math.round(W / (16 * target)))
  while (s > 1 && H / (16 * s) < 9) s--
  while (s > 1 && W / (16 * s) < 10.5) s--
  return s
}

export function rollEncounter(stepsSince: number, rng: () => number): boolean {
  return stepsSince >= ENCOUNTER_GRACE && rng() < ENCOUNTER_CHANCE
}

export interface Walker {
  x: number
  y: number
  /** Previous tile while tweening. */
  px: number
  py: number
  /** Tween progress 0..1 (1 = standing). */
  t: number
  dir: Dir
  /** Steps taken (for walk-frame alternation). */
  steps: number
}

export function walker(x: number, y: number, dir: Dir): Walker {
  return { x, y, px: x, py: y, t: 1, dir, steps: 0 }
}

/** Interpolated pixel position (top-left of the tile). */
export function walkerPos(w: { x: number; y: number; px: number; py: number; t: number }): Pt {
  const t = Math.min(1, w.t)
  return { x: (w.px + (w.x - w.px) * t) * 16, y: (w.py + (w.y - w.py) * t) * 16 }
}

export interface WorldEvents {
  /** Player finished a step onto (x, y). Return true to stop further processing (e.g. encounter). */
  onStep?: (x: number, y: number) => void
  onExit?: (exit: Exit) => void
  onInteract?: (target: { entity?: Entity; exit?: Exit; fude?: boolean; x: number; y: number }) => void
  onBump?: () => void
  onEncounter?: () => void
  /** Exit is sealed (target region locked). */
  exitLocked?: (exit: Exit) => boolean
}

/**
 * The live overworld: one map, the player, the companion and NPCs.
 * Rendering and React live elsewhere; this is plain state + `update(dt)`.
 */
export class World {
  map: GameMap
  ents: Entity[]
  player: Walker
  fude: Walker
  held: Dir | null = null
  /** A quick tap that should at least turn the mage (even if released before the next frame). */
  pendingTurn: Dir | null = null
  heldFor = 0
  run = false
  path: Pt[] = []
  pathGoal: { isGoal: (x: number, y: number) => boolean; then?: Pt } | null = null
  frozen = false
  stepsSinceBattle = 0
  encounters = true
  /** NPC currently in conversation (doesn't wander). */
  talking: Entity | null = null
  ev: WorldEvents
  rng: () => number
  now = 0
  private movingLast = false

  constructor(map: GameMap, ents: Entity[], x: number, y: number, dir: Dir, ev: WorldEvents = {}, rng: () => number = Math.random) {
    this.map = map
    this.ents = ents
    this.player = walker(x, y, dir)
    this.fude = walker(x, y, dir)
    this.ev = ev
    this.rng = rng
    this.placeFude()
  }

  /** Put the companion one tile behind the player if possible. */
  placeFude() {
    const p = this.player
    const order: Dir[] = [OPPOSITE[p.dir], ...DIR_LIST.filter((d) => d !== OPPOSITE[p.dir] && d !== p.dir), p.dir]
    for (const d of order) {
      const fx = p.x + DIRS[d].x
      const fy = p.y + DIRS[d].y
      if (!tileSolid(this.map, fx, fy) && !entityAt(this.ents, fx, fy) && !this.exitAt(fx, fy)) {
        this.fude = walker(fx, fy, p.dir)
        return
      }
    }
    this.fude = walker(p.x, p.y, p.dir)
  }

  teleport(map: GameMap, ents: Entity[], x: number, y: number, dir: Dir) {
    this.map = map
    this.ents = ents
    this.player = walker(x, y, dir)
    this.path = []
    this.pathGoal = null
    this.held = null
    this.stepsSinceBattle = 0
    this.placeFude()
  }

  get moving() {
    return this.player.t < 1
  }

  exitAt(x: number, y: number): Exit | undefined {
    return this.map.exits.get(y * this.map.w + x)
  }

  /** Can a walker enter (x, y)? Entities block; locked exits block. */
  blocked(x: number, y: number, ignore?: Entity): boolean {
    if (tileSolid(this.map, x, y)) return true
    const ex = this.exitAt(x, y)
    if (ex && this.ev.exitLocked?.(ex)) return true
    const e = entityAt(this.ents, x, y)
    return !!e && e !== ignore
  }

  facing(): Pt {
    const d = DIRS[this.player.dir]
    return { x: this.player.x + d.x, y: this.player.y + d.y }
  }

  /** Try to interact with whatever the player faces (reaching across counters). */
  interact() {
    if (this.frozen || this.moving) return
    const f = this.facing()
    const d = DIRS[this.player.dir]
    let e = entityAt(this.ents, f.x, f.y)
    if (!e && tileSolid(this.map, f.x, f.y)) {
      const o = this.map.obj[f.y * this.map.w + f.x]
      if (o === 'stall' || o === 'shop-awning' || o === 'fence' || o === 'crate' || o === 'barrel') e = entityAt(this.ents, f.x + d.x, f.y + d.y)
    }
    if (e) return this.ev.onInteract?.({ entity: e, x: e.x, y: e.y })
    const ex = this.exitAt(f.x, f.y)
    if (ex && this.ev.exitLocked?.(ex)) return this.ev.onInteract?.({ exit: ex, x: f.x, y: f.y })
    if (this.fude.x === f.x && this.fude.y === f.y) return this.ev.onInteract?.({ fude: true, x: f.x, y: f.y })
  }

  /** Walk to a tapped tile (or next to a tapped entity, then interact). */
  walkTo(tx: number, ty: number) {
    if (this.frozen) return
    const e = entityAt(this.ents, tx, ty)
    const ex = this.exitAt(tx, ty)
    const lockedEx = ex && this.ev.exitLocked?.(ex)
    const target = e ? entityCells(e) : [{ x: tx, y: ty }]
    const interactable = !!e || !!lockedEx || (this.fude.x === tx && this.fude.y === ty && (tx !== this.player.x || ty !== this.player.y))
    if (!interactable && tileSolid(this.map, tx, ty)) return
    const startPt = { x: this.player.x, y: this.player.y }
    const adjacent = (x: number, y: number) => target.some((c) => Math.abs(c.x - x) + Math.abs(c.y - y) === 1)
    const isGoal = interactable ? (x: number, y: number) => adjacent(x, y) && !this.blocked(x, y) : (x: number, y: number) => x === tx && y === ty
    const path = bfs(this.map.w, this.map.h, startPt, isGoal, (x, y) => !this.blocked(x, y) && !this.exitAt(x, y))
    if (!path) return
    this.path = path
    const then = interactable ? (e ? { x: e.x, y: e.y } : { x: tx, y: ty }) : undefined
    this.pathGoal = { isGoal, then }
    if (!path.length && then) this.finishPath()
  }

  private finishPath() {
    const g = this.pathGoal
    this.path = []
    this.pathGoal = null
    if (!g?.then) return
    const e = entityAt(this.ents, g.then.x, g.then.y)
    const cells = e ? entityCells(e) : [g.then]
    const c = cells.find((c) => Math.abs(c.x - this.player.x) + Math.abs(c.y - this.player.y) === 1) ?? g.then
    this.player.dir = dirBetween(this.player, c)
    this.interact()
  }

  private tryStep(dir: Dir): boolean {
    const p = this.player
    p.dir = dir
    const d = DIRS[dir]
    const nx = p.x + d.x
    const ny = p.y + d.y
    if (this.blocked(nx, ny)) {
      this.ev.onBump?.()
      return false
    }
    // Companion snake-follows into the tile the player leaves.
    const f = this.fude
    if (f.x !== p.x || f.y !== p.y) {
      f.px = f.x
      f.py = f.y
      f.x = p.x
      f.y = p.y
      f.dir = dirBetween({ x: f.px, y: f.py }, f)
      f.t = 0
      f.steps++
    } else {
      f.px = f.x
      f.py = f.y
      f.t = 1
    }
    p.px = p.x
    p.py = p.y
    p.x = nx
    p.y = ny
    p.t = 0
    p.steps++
    return true
  }

  private arrive() {
    const p = this.player
    const ex = this.exitAt(p.x, p.y)
    if (ex) {
      this.path = []
      this.pathGoal = null
      this.ev.onExit?.(ex)
      return true
    }
    this.ev.onStep?.(p.x, p.y)
    if (this.encounters && this.map.ground[p.y * this.map.w + p.x] === 'tall-grass') {
      this.stepsSinceBattle++
      if (rollEncounter(this.stepsSinceBattle, this.rng)) {
        this.stepsSinceBattle = 0
        this.path = []
        this.pathGoal = null
        this.held = null
        this.ev.onEncounter?.()
        return true
      }
    }
    return false
  }

  update(dt: number, now = this.now + dt * 1000) {
    this.now = now
    dt = Math.min(dt, 0.1)
    const p = this.player
    const speed = this.run ? RUN_SPEED : WALK_SPEED
    // Tween companion at the player's pace.
    if (this.fude.t < 1) this.fude.t = Math.min(1, this.fude.t + dt * speed)

    if (this.held) this.heldFor += dt
    else this.heldFor = 0

    let budget = dt
    if (p.t < 1) {
      p.t += dt * speed
      if (p.t < 1) budget = 0
      else {
        budget = (p.t - 1) / speed
        p.t = 1
        if (this.arrive()) budget = 0
      }
    }
    if (!this.frozen && p.t >= 1 && !this.held && this.pendingTurn) p.dir = this.pendingTurn
    this.pendingTurn = null
    if (!this.frozen && p.t >= 1 && budget >= 0) {
      if (this.held) {
        this.path = []
        this.pathGoal = null
        const turnOnly = !this.movingLast && this.held !== p.dir && this.heldFor < TURN_DELAY
        if (turnOnly) p.dir = this.held
        else if (this.heldFor >= TURN_DELAY || this.held === p.dir || this.movingLast) {
          if (this.tryStep(this.held)) p.t = Math.min(0.99, budget * speed)
        }
      } else if (this.path.length) {
        const next = this.path[0]
        if (this.exitAt(next.x, next.y) && !this.pathGoal?.isGoal(next.x, next.y)) this.path = []
        else if (this.blocked(next.x, next.y)) {
          // Something moved into the way: re-plan.
          const g = this.pathGoal
          const np = g ? bfs(this.map.w, this.map.h, p, g.isGoal, (x, y) => !this.blocked(x, y) && !this.exitAt(x, y)) : null
          if (np && np.length) this.path = np
          else {
            this.path = []
            this.pathGoal = null
            p.dir = dirBetween(p, next)
          }
        } else {
          this.path.shift()
          if (this.tryStep(dirBetween(p, next))) p.t = Math.min(0.99, budget * speed)
          if (!this.path.length && this.pathGoal && !this.pathGoal.then) this.pathGoal = null
        }
      } else if (this.pathGoal?.then) this.finishPath()
    }
    this.movingLast = p.t < 1
    this.updateNpcs(dt, now)
  }

  private updateNpcs(dt: number, now: number) {
    for (const e of this.ents) {
      if (e.t < 1) {
        e.t = Math.min(1, e.t + dt * NPC_SPEED)
        continue
      }
      const r = e.spec.wander ?? 0
      if (!r || this.frozen || e === this.talking || now < e.nextMove) continue
      e.nextMove = now + 1400 + this.rng() * 3200
      if (this.rng() < 0.35) {
        e.dir = DIR_LIST[Math.floor(this.rng() * 4)]
        continue
      }
      const dir = DIR_LIST[Math.floor(this.rng() * 4)]
      const nx = e.x + DIRS[dir].x
      const ny = e.y + DIRS[dir].y
      e.dir = dir
      if (Math.abs(nx - e.hx) > r || Math.abs(ny - e.hy) > r) continue
      const p = this.player
      if ((nx === p.x && ny === p.y) || (nx === p.px && ny === p.py && p.t < 1) || (nx === this.fude.x && ny === this.fude.y)) continue
      if (tileSolid(this.map, nx, ny) || this.exitAt(nx, ny) || entityAt(this.ents, nx, ny)) continue
      if (this.map.ground[ny * this.map.w + nx] === 'tall-grass') continue
      e.px = e.x
      e.py = e.y
      e.x = nx
      e.y = ny
      e.t = 0
    }
  }
}

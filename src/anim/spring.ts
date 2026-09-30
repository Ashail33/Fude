/**
 * A tiny spring / tween system for reactions (hit, lunge, defeat, spawn,
 * talking). Springs are integrated with fixed sub-steps (semi-implicit
 * Euler), so they are stable at any frame rate and settle the same way on
 * a 30 Hz phone and a 144 Hz monitor.
 */

export interface SpringOpts {
  /** Natural frequency (Hz): how snappy. */
  freq: number
  /** Damping ratio: 1 = critically damped (no overshoot), < 1 bouncy. */
  damping: number
}

export const CRITICAL: SpringOpts = { freq: 3, damping: 1 }
export const BOUNCY: SpringOpts = { freq: 3.2, damping: 0.35 }

const MAX_STEP = 1 / 240

export class Spring {
  x: number
  v = 0
  target: number
  k: number
  c: number

  constructor(value = 0, opts: SpringOpts = CRITICAL) {
    this.x = value
    this.target = value
    const w = 2 * Math.PI * opts.freq
    this.k = w * w
    this.c = 2 * opts.damping * w
  }

  /** Change stiffness/damping (e.g. snappy lunge, soft settle). */
  tune(opts: SpringOpts) {
    const w = 2 * Math.PI * opts.freq
    this.k = w * w
    this.c = 2 * opts.damping * w
    return this
  }

  /** Add velocity (units per second). */
  kick(dv: number) {
    this.v += dv
    return this
  }

  set(x: number) {
    this.x = x
    this.target = x
    this.v = 0
    return this
  }

  step(dt: number) {
    let left = Math.min(dt, 0.25)
    while (left > 1e-6) {
      const h = Math.min(MAX_STEP, left)
      const a = -this.k * (this.x - this.target) - this.c * this.v
      this.v += a * h
      this.x += this.v * h
      left -= h
    }
    // Snap when at rest so idle frames produce exact values (no endless tiny transforms).
    if (Math.abs(this.x - this.target) < 1e-5 && Math.abs(this.v) < 1e-4) {
      this.x = this.target
      this.v = 0
    }
    return this.x
  }

  settled(eps = 1e-3) {
    return Math.abs(this.x - this.target) < eps && Math.abs(this.v) < eps * 10
  }
}

export type Ease = (t: number) => number
export const easeInCubic: Ease = (t) => t * t * t
export const easeInQuad: Ease = (t) => t * t
export const easeOutCubic: Ease = (t) => 1 - Math.pow(1 - t, 3)
export const easeInOut: Ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const linear: Ease = (t) => t

/** A time-based tween from→to with an easing. */
export class Tween {
  from = 0
  to = 0
  dur = 0
  t = 0
  ease: Ease = linear
  value: number

  constructor(value = 0) {
    this.value = value
  }

  start(to: number, dur: number, ease: Ease = easeOutCubic, from = this.value) {
    this.from = from
    this.to = to
    this.dur = Math.max(1e-3, dur)
    this.t = 0
    this.ease = ease
    this.value = from
    return this
  }

  step(dt: number) {
    if (this.t >= this.dur) return this.value
    this.t = Math.min(this.dur, this.t + dt)
    this.value = this.from + (this.to - this.from) * this.ease(this.t / this.dur)
    return this.value
  }

  get done() {
    return this.t >= this.dur
  }
}

/** Exponential decay toward 0 with a half-life (s). */
export const decay = (x: number, dt: number, halfLife: number) => x * Math.pow(0.5, dt / halfLife)

/** What the renderer needs from the reactions each frame. */
export interface ReactFrame {
  /** Translation (fractions of the image width / height; +y = down). */
  tx: number
  ty: number
  /** Uniform scale about the feet (toward / away from the camera). */
  scale: number
  /** Rotation (radians) about the feet. */
  rot: number
  /** Mesh squash (+ = taller) and top bend (fraction of width). */
  squash: number
  bend: number
  /** White flash 0..1, dissolve 0..1, opacity 0..1. */
  flash: number
  dissolve: number
  alpha: number
}

export type Cue = 'hit' | 'crit' | 'attack' | 'attack-big' | 'defeat' | 'spawn' | 'hop' | 'dodge' | 'talk'

/**
 * Reaction controller: owns the springs/tweens and turns cues into motion.
 * `update(dt)` advances everything; read the frame from `frame`.
 */
export class Reactor {
  private tx = new Spring(0, { freq: 3.4, damping: 0.42 })
  private ty = new Spring(0, { freq: 3, damping: 0.55 })
  private sc = new Spring(1, { freq: 3, damping: 0.5 })
  private rot = new Spring(0, { freq: 2.6, damping: 0.4 })
  private squash = new Spring(0, { freq: 3.6, damping: 0.28 })
  private bend = new Spring(0, { freq: 2.4, damping: 0.3 })
  private flash = 0
  private flashHalf = 0.07
  private dissolve = new Tween(0)
  private alpha = new Tween(1)
  private rise = new Tween(0)
  private queue: { at: number; fn: () => void }[] = []
  private clock = 0
  /** Reduced motion: no wobble / lunge travel, keep flashes and fades. */
  reduced = false
  frame: ReactFrame = { tx: 0, ty: 0, scale: 1, rot: 0, squash: 0, bend: 0, flash: 0, dissolve: 0, alpha: 1 }

  private at(ms: number, fn: () => void) {
    this.queue.push({ at: this.clock + ms / 1000, fn })
  }

  /** Is anything still moving (so an idle-less renderer could sleep)? */
  get busy() {
    return this.queue.length > 0 || this.flash > 0.002 || !this.dissolve.done || !this.alpha.done || ![this.tx, this.ty, this.sc, this.rot, this.squash, this.bend].every((s) => s.settled())
  }

  /**
   * Fire a reaction. `dir` is the side the blow comes from / goes to
   * (−1 left, +1 right, 0 straight on); `k` scales strength.
   */
  cue(c: Cue, dir = 0, k = 1) {
    const m = this.reduced ? 0.25 : 1
    const side = dir || (Math.random() < 0.5 ? -1 : 1)
    switch (c) {
      case 'hit':
      case 'crit': {
        const s = (c === 'crit' ? 1.5 : 1) * k
        // Sharp recoil, no anticipation: velocity impulses, springs pull back with a wobble.
        this.flash = 1
        this.flashHalf = c === 'crit' ? 0.11 : 0.075
        this.tx.kick(side * 1.7 * s * m)
        this.ty.kick(-0.5 * s * m)
        this.sc.kick(-1.4 * s * m)
        this.rot.kick(side * 1.3 * s * m)
        this.squash.kick(-2.2 * s * m)
        this.bend.kick(side * 1.5 * s * m)
        break
      }
      case 'dodge': {
        this.tx.tune({ freq: 4, damping: 0.8 })
        this.tx.target = side * 0.22 * m
        this.bend.kick(-side * 0.6 * m)
        this.at(260, () => {
          this.tx.tune({ freq: 2.6, damping: 0.6 })
          this.tx.target = 0
        })
        break
      }
      case 'attack':
      case 'attack-big': {
        const big = c === 'attack-big' ? 1.35 : 1
        // Anticipation: pull back (away from camera) and squash.
        this.sc.tune({ freq: 4, damping: 0.9 })
        this.ty.tune({ freq: 4, damping: 0.9 })
        this.sc.target = 1 - 0.06 * big * m
        this.ty.target = -0.03 * big * m
        this.squash.target = -0.07 * big * m
        this.rot.target = side * 0.03 * m
        // Lunge: fast stretch toward the camera.
        this.at(170, () => {
          this.sc.tune({ freq: 7, damping: 0.75 })
          this.ty.tune({ freq: 7, damping: 0.75 })
          this.squash.tune({ freq: 7, damping: 0.5 })
          this.sc.target = 1 + 0.2 * big * m
          this.ty.target = 0.07 * big * m
          this.squash.target = 0.09 * big * m
          this.rot.target = -side * 0.02 * m
        })
        // Settle with overshoot.
        this.at(330, () => {
          this.sc.tune({ freq: 2.8, damping: 0.38 })
          this.ty.tune({ freq: 2.8, damping: 0.45 })
          this.squash.tune({ freq: 3.6, damping: 0.28 })
          this.sc.target = 1
          this.ty.target = 0
          this.squash.target = 0
          this.rot.target = 0
        })
        break
      }
      case 'hop': {
        this.squash.kick(-0.9 * m)
        this.at(90, () => {
          this.ty.kick(-0.9 * m)
          this.squash.kick(1.4 * m)
        })
        break
      }
      case 'talk': {
        // A small, slightly random bounce (called at syllable pace while talking).
        this.squash.kick((0.28 + Math.random() * 0.18) * k * (this.reduced ? 0 : 1))
        this.ty.kick(-0.05 * k * (this.reduced ? 0 : 1))
        break
      }
      case 'spawn': {
        this.alpha.start(1, 0.28, easeOutCubic, 0)
        this.sc.set(this.reduced ? 1 : 0.55)
        this.sc.tune({ freq: 2.6, damping: 0.42 })
        this.sc.target = 1
        this.ty.set(this.reduced ? 0 : 0.06)
        this.ty.target = 0
        this.squash.set(0)
        this.squash.kick(1.2 * m)
        this.flash = 0.85
        this.flashHalf = 0.12
        this.at(600, () => this.sc.tune({ freq: 3, damping: 0.5 }))
        break
      }
      case 'defeat': {
        // k stretches the dissolve (bosses take their time).
        const d = Math.max(0.3, k)
        this.flash = 0.9
        this.flashHalf = 0.16 * d
        this.dissolve.start(1, 0.8 * d, easeInQuad, 0)
        this.rise.start(-0.1, 0.9 * d, easeInOut, 0)
        this.sc.tune({ freq: 1.2, damping: 1 })
        this.sc.target = 1.05
        this.squash.kick(0.6 * m)
        break
      }
    }
  }

  /** Hide until a later 'spawn' (e.g. before a battle intro). */
  hide() {
    this.alpha = new Tween(0)
    this.sc.set(this.reduced ? 1 : 0.55)
  }

  /** Instantly return to rest (e.g. when the art changes). */
  reset() {
    for (const s of [this.tx, this.ty, this.rot, this.squash, this.bend]) s.set(0)
    this.sc.set(1)
    this.flash = 0
    this.dissolve = new Tween(0)
    this.alpha = new Tween(1)
    this.rise = new Tween(0)
    this.queue = []
  }

  update(dt: number): ReactFrame {
    this.clock += dt
    if (this.queue.length) {
      const due = this.queue.filter((q) => q.at <= this.clock)
      if (due.length) {
        this.queue = this.queue.filter((q) => q.at > this.clock)
        for (const q of due) q.fn()
      }
    }
    const f = this.frame
    f.tx = this.tx.step(dt)
    f.ty = this.ty.step(dt) + this.rise.step(dt)
    f.scale = this.sc.step(dt)
    f.rot = this.rot.step(dt)
    f.squash = this.squash.step(dt)
    f.bend = this.bend.step(dt)
    this.flash = this.flash < 0.002 ? 0 : decay(this.flash, dt, this.flashHalf)
    f.flash = this.flash
    f.dissolve = this.dissolve.step(dt)
    f.alpha = this.alpha.step(dt)
    // Clamp extremes so a burst of hits can't fling the art off-canvas.
    f.tx = Math.max(-0.3, Math.min(0.3, f.tx))
    f.squash = Math.max(-0.12, Math.min(0.12, f.squash))
    f.bend = Math.max(-0.06, Math.min(0.06, f.bend))
    f.rot = Math.max(-0.2, Math.min(0.2, f.rot))
    return f
  }
}

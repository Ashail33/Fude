/**
 * FX quality preference + automatic step-down for weak devices.
 *
 * Preference (localStorage `fude.fx`): 'high' | 'low' | 'classic' | 'off' (default 'high').
 * 'high' / 'low' use the 3D overworld; 'classic' is the 2D view with the HD-2D post-process.
 * Levels: 3 = full, 2 = half-res blur passes, 1 = no depth of field, 0 = plain 2D.
 */
export type FxQuality = 'high' | 'low' | 'classic' | 'off'
export type FxLevel = 0 | 1 | 2 | 3

const KEY = 'fude.fx'
const listeners = new Set<(q: FxQuality) => void>()

function parse(v: unknown): FxQuality {
  return v === 'low' || v === 'off' || v === 'high' || v === 'classic' ? v : 'high'
}

/** The saved preference (defaults to 'high'; never throws). */
export function fxQuality(): FxQuality {
  try {
    return parse(typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY))
  } catch {
    return 'high'
  }
}

/** Save the preference and apply it live to any running overworld. */
export function setFxQuality(q: FxQuality) {
  const v = parse(q)
  try {
    localStorage.setItem(KEY, v)
  } catch {
    /* private mode — still apply for this session */
  }
  for (const f of listeners) f(v)
}

export function onFxQuality(f: (q: FxQuality) => void): () => void {
  listeners.add(f)
  return () => void listeners.delete(f)
}

export function startLevel(q: FxQuality): FxLevel {
  return q === 'high' || q === 'classic' ? 3 : q === 'low' ? 2 : 0
}

export interface GovernorOpts {
  /** Average frame time (ms) above which quality steps down. */
  threshold: number
  /** Frames averaged per decision. */
  window: number
  /** Frames ignored after start / each change (shader warm-up, texture allocation). */
  warmup: number
}

/**
 * Watches frame times and steps the level down (never up) when the running
 * average exceeds the threshold. Pure: feed it frame intervals in ms.
 */
export class QualityGovernor {
  level: FxLevel
  opts: GovernorOpts
  private skip: number
  private sum = 0
  private n = 0

  constructor(level: FxLevel, opts: Partial<GovernorOpts> = {}) {
    this.level = level
    this.opts = { threshold: 22, window: 90, warmup: 45, ...opts }
    this.skip = this.opts.warmup
  }

  /** Record one frame interval. Returns the new level when it changed, else null. */
  push(ms: number): FxLevel | null {
    if (this.level === 0) return null
    // Tab switches / breakpoints / long GC pauses aren't the GPU's fault.
    if (!(ms > 0) || ms > 250) return null
    if (this.skip > 0) {
      this.skip--
      return null
    }
    this.sum += ms
    this.n++
    if (this.n < this.opts.window) return null
    const avg = this.sum / this.n
    this.sum = 0
    this.n = 0
    if (avg <= this.opts.threshold) return null
    this.level = (this.level - 1) as FxLevel
    this.skip = this.opts.warmup
    return this.level
  }

  reset(level: FxLevel) {
    this.level = level
    this.sum = 0
    this.n = 0
    this.skip = this.opts.warmup
  }
}

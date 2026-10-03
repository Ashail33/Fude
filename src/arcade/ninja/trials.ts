/**
 * Shadow Trials (影の試練): Stick Ninja's side-scrolling platform mode.
 * Long levels of ground, pits, floating platforms, high ledges and walls to
 * wall-jump up; spikes and saws; foes patrolling their platforms (strike one
 * from behind before it sees you to assassinate it); caged hostages to free,
 * three hidden diamonds, gold along the way, a lantern checkpoint and a torii
 * gate at the end.
 *
 * Levels are generated from the world and number with a fixed seed, so each
 * is the same every time. Every jump fits the hero's reach: a single jump
 * clears ~170 across and ~115 up, a double jump ~200 up (see sim's JUMP and
 * GRAV); gaps and steps are kept inside that.
 */
import { giveGear, hasGear, stagePower, WORLDS, xpToNext, type FoeKind, type GearId, type NinjaSave, type Stage, type StageResult } from './data'

/** Solid ground (from `top` down out of sight), or a one-way platform you can jump up through. */
export interface Solid {
  x: number
  w: number
  top: number
  oneWay?: boolean
}

export interface Spikes {
  x: number
  w: number
  top: number
}

/** A spinning saw sliding back and forth along (ax, ay) from its centre. */
export interface Saw {
  x: number
  y: number
  r: number
  ax: number
  ay: number
  speed: number
}

export interface Spot {
  x: number
  y: number
}

export interface Level {
  width: number
  solids: Solid[]
  spikes: Spikes[]
  saws: Saw[]
  foes: { kind: FoeKind; x: number; y: number; px0: number; px1: number; elite?: boolean }[]
  cages: Spot[]
  gems: Spot[]
  coins: Spot[]
  checkpoints: Spot[]
  start: Spot
  /** Reach this x to finish. */
  exit: number
}

export const TRIALS_PER_WORLD = 4
export const TRIAL_COUNT = WORLDS.length * TRIALS_PER_WORLD
export const GEMS_PER_TRIAL = 3

function seeded(seed: number) {
  let a = seed * 7919 + 17
  return () => {
    a = (a * 16807) % 2147483647
    return a / 2147483647
  }
}

/** Build trial `index` (0-based over all worlds). */
export function buildTrial(index: number): Level {
  const world = Math.floor(index / TRIALS_PER_WORLD)
  const n = (index % TRIALS_PER_WORLD) + 1
  const r = seeded(500 + index * 13)
  const pool = WORLDS[world].pool
  const pick = () => pool[Math.floor(r() * pool.length)]
  const hard = Math.min(1, (world + n / TRIALS_PER_WORLD) / 7)
  const lv: Level = { width: 0, solids: [], spikes: [], saws: [], foes: [], cages: [], gems: [], coins: [], checkpoints: [], start: { x: 80, y: 0 }, exit: 0 }
  let x = 0
  let g = 0
  const flat = (w: number, top = g) => {
    lv.solids.push({ x, w, top })
    return w
  }
  const coinLine = (x0: number, x1: number, y: number) => {
    for (let cx = x0; cx <= x1; cx += 34) lv.coins.push({ x: cx, y })
  }
  const coinArc = (x0: number, x1: number, y0: number, h: number) => {
    const k = Math.max(2, Math.round((x1 - x0) / 34))
    for (let i = 0; i <= k; i++) {
      const u = i / k
      lv.coins.push({ x: x0 + (x1 - x0) * u, y: y0 + Math.sin(u * Math.PI) * h })
    }
  }
  const fight = (w: number, count: number) => {
    const x0 = x
    flat(w)
    for (let i = 0; i < count; i++) {
      const fx = x0 + 120 + ((w - 200) * (i + 0.5)) / count
      lv.foes.push({ kind: pick(), x: fx, y: g, px0: x0 + 20, px1: x0 + w - 20, elite: r() < 0.08 + hard * 0.12 })
    }
    x += w
  }
  type Seg = 'gap' | 'step' | 'floaters' | 'ledge' | 'wall' | 'spikes' | 'saw' | 'fight' | 'cage'
  const gems: Spot[] = []
  const segment = (kind: Seg) => {
    switch (kind) {
      case 'gap': {
        const w = 70 + r() * (60 + hard * 60)
        const nextG = Math.max(0, Math.min(40, g + (r() < 0.5 ? -1 : 1) * Math.round(r() * 30)))
        coinArc(x - 10, x + w + 10, Math.max(g, nextG) + 40, 50)
        x += w
        g = nextG
        x += flat(120 + r() * 80)
        break
      }
      case 'step': {
        g = Math.max(0, Math.min(40, g + (r() < 0.5 ? -1 : 1) * (25 + Math.round(r() * 20))))
        x += flat(140 + r() * 100)
        break
      }
      case 'floaters': {
        const count = 2 + (r() < hard ? 1 : 0)
        let px = x + 40
        for (let i = 0; i < count; i++) {
          const top = g + 30 + r() * 50
          const w = 70 + r() * 40
          lv.solids.push({ x: px, w, top, oneWay: true })
          lv.coins.push({ x: px + w / 2, y: top + 30 })
          if (i === count - 1 && r() < 0.5) gems.push({ x: px + w / 2, y: top + 120 })
          px += w + 60 + r() * 50
        }
        x = px + 20
        x += flat(140)
        break
      }
      case 'ledge': {
        // a high block: double jump, or wall-jump up its face
        const x0 = x
        x += flat(90)
        const top = Math.min(150, g + 100 + r() * 40)
        const w = 180 + r() * 100
        lv.solids.push({ x, w, top })
        coinLine(x + 30, x + w - 30, top + 30)
        if (r() < 0.6) lv.foes.push({ kind: pick(), x: x + w / 2, y: top, px0: x + 15, px1: x + w - 15 })
        else lv.cages.push({ x: x + w / 2, y: top })
        x += w
        x += flat(110)
        void x0
        break
      }
      case 'wall': {
        // a tall tower: wall-jump up its face (or double jump to a step first)
        x += flat(110)
        lv.solids.push({ x, w: 40, top: g + 65, oneWay: true })
        const top = Math.min(165, g + 140 + r() * 20)
        const w = 140
        lv.solids.push({ x: x + 70, w, top })
        gems.push({ x: x + 70 + w / 2, y: top + 34 })
        x += 70 + w
        x += flat(120)
        break
      }
      case 'spikes': {
        const x0 = x
        const w = 240
        flat(w)
        const sw = 40 + r() * (30 + hard * 30)
        lv.spikes.push({ x: x0 + (w - sw) / 2, w: sw, top: g })
        coinArc(x0 + (w - sw) / 2 - 20, x0 + (w + sw) / 2 + 20, g + 30, 60)
        x += w
        break
      }
      case 'saw': {
        const x0 = x
        const w = 300
        flat(w)
        const vertical = r() < 0.5
        lv.saws.push({ x: x0 + w / 2, y: g + (vertical ? 70 : 22), r: 18, ax: vertical ? 0 : 90, ay: vertical ? 55 : 0, speed: 1.6 + hard * 1.4 })
        x += w
        break
      }
      case 'fight':
        fight(380 + r() * 120, 1 + Math.floor(r() * (1.5 + hard * 2)))
        break
      case 'cage': {
        const x0 = x
        flat(220)
        lv.cages.push({ x: x0 + 120, y: g })
        x += 220
        break
      }
    }
  }
  // Start, then a run of segments, a lantern halfway, more, and the gate.
  x += flat(320)
  const length = 2400 + world * 160 + n * 260
  const kinds: Seg[] = ['gap', 'step', 'floaters', 'ledge', 'spikes', 'fight', 'gap', 'saw', 'fight', 'wall', 'cage', 'floaters', 'spikes', 'fight', 'gap', 'ledge']
  let half = false
  let k = Math.floor(r() * kinds.length)
  let fights = 0
  while (x < length) {
    let kind = kinds[k % kinds.length]
    k += 1 + Math.floor(r() * 3)
    // early worlds go easy on the hard bits
    if (world === 0 && n === 1 && (kind === 'wall' || kind === 'saw')) kind = 'gap'
    if (kind === 'fight') fights++
    segment(kind)
    if (!half && x > length / 2) {
      half = true
      lv.checkpoints.push({ x, y: g })
      x += flat(160)
    }
  }
  if (fights === 0) fight(420, 2)
  if (!lv.cages.length) segment('cage')
  // Exactly three diamonds: the hidden ones first, then tucked above the route.
  while (gems.length < GEMS_PER_TRIAL) {
    const s = lv.solids[2 + Math.floor(r() * Math.max(1, lv.solids.length - 3))]
    gems.push({ x: s.x + s.w / 2, y: s.top + 105 })
  }
  lv.gems = gems.slice(0, GEMS_PER_TRIAL)
  // the gate
  const gateAt = x + 140
  x += flat(320)
  lv.exit = gateAt
  lv.width = x
  return lv
}

/** The Stage the fight engine runs for trial `index` (no waves: foes come from the level). */
export function trialStage(index: number): Stage {
  const world = Math.floor(index / TRIALS_PER_WORLD)
  const n = (index % TRIALS_PER_WORLD) + 1
  return { index: 1000 + index, world, n, waves: [], power: stagePower(world * 5 + n - 1) * 0.85, urns: 0, lv: buildTrial(index), trial: index }
}

/** Ground top under x (highest solid covering it), or null over a pit. */
export function groundUnder(lv: Level, x: number): number | null {
  let best: number | null = null
  for (const s of lv.solids) if (x >= s.x && x <= s.x + s.w && !s.oneWay && (best === null || s.top > best)) best = s.top
  return best
}

/** Trial `index` is open once the one before is cleared and the story has opened its world. */
export function trialUnlocked(save: NinjaSave, index: number) {
  return index <= (save.trials ?? 0) && index < TRIAL_COUNT
}

/** Gold for clearing a trial, on top of what was picked up; more for each hostage freed. */
export const trialBonus = (index: number, saved: number) => 40 + index * 12 + saved * 30

/** Bank a trial: XP and gold (half the gold if lost), diamonds and hostages kept as bests, the next trial opened. */
export function settleTrial(save: NinjaSave, index: number, won: boolean, xp: number, ryo: number, gems: number, saved: number, found: GearId[] = []): StageResult {
  const firstClear = won && index === (save.trials ?? 0)
  const gotRyo = won ? ryo + trialBonus(index, saved) : Math.floor(ryo / 2)
  let level = save.level
  let pool = save.xp + xp
  let levelsGained = 0
  while (pool >= xpToNext(level)) {
    pool -= xpToNext(level)
    level++
    levelsGained++
  }
  const bestGems = Math.max(save.trialGems?.[index] ?? 0, won ? gems : 0)
  const bestSaved = Math.max(save.trialSaved?.[index] ?? 0, won ? saved : 0)
  let next: NinjaSave = {
    ...save,
    level,
    xp: pool,
    ryo: save.ryo + gotRyo,
    trials: firstClear ? (save.trials ?? 0) + 1 : save.trials ?? 0,
    trialGems: { ...(save.trialGems ?? {}), [index]: bestGems },
    trialSaved: { ...(save.trialSaved ?? {}), [index]: bestSaved },
  }
  const fresh = found.filter((g, i) => found.indexOf(g) === i && !hasGear(save, g))
  for (const g of fresh) next = giveGear(next, g)
  return { save: next, levelsGained, firstClear, shards: firstClear ? 2 : 0, xp, ryo: gotRyo, found: fresh }
}

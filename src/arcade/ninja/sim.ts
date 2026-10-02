/**
 * The Stick Ninja fight: a small side-on fighting engine. Pure (no DOM) and
 * stepped with a delta time, so it can be tested and drawn separately.
 *
 * Everything that swings is a Move: a windup, an active window in which its
 * hit band is live, and a recovery. Moves can dash, spawn projectiles, chain
 * into the next move, or carry super armour. The hero's moves come from the
 * equipped sword; each foe picks from its own list by distance.
 */
import { FOES, heroStats, type FoeKind, type Special, type Stage, type SwordDef } from './data'

export const ARENA = 960
export const GRAV = 1900
const JUMP = 670
const RUN = 250
const BODY_H = 62

export type Swing = 'slash' | 'up' | 'thrust' | 'slam' | 'spin' | 'throw' | 'cast'

export interface Move {
  id: string
  windup: number
  active: number
  recover: number
  /** Hit band: reach in front (and `back` behind), from `lo` to `hi` above the feet. Scaled by the fighter. */
  reach: number
  back?: number
  lo: number
  hi: number
  dmg: number
  kb: number
  lift?: number
  /** Forward speed while active. */
  dash?: number
  unblockable?: boolean
  /** Not flinched by hits while doing this. */
  armor?: boolean
  /** Separate hits across the active window. */
  hits?: number
  stun?: number
  swing: Swing
  /** Once, when the active window opens. */
  spawn?: (s: Sim, f: Fighter) => void
  /** Every frame of the active window. */
  tick?: (s: Sim, f: Fighter, dt: number) => void
  /** Chain straight into this move afterwards. */
  next?: string
  /** Invulnerable for the whole move. */
  inv?: boolean
}

export interface Fighter {
  uid: number
  kind: 'hero' | FoeKind
  team: 0 | 1
  x: number
  y: number
  vx: number
  vy: number
  face: 1 | -1
  hp: number
  maxHp: number
  atk: number
  speed: number
  scale: number
  move: Move | null
  moveT: number
  fired: boolean
  seg: number
  hitIds: number[]
  combo: number
  comboQueued: boolean
  /** Seconds the guard has been up, or -1. */
  blockT: number
  hurtT: number
  stunT: number
  inv: number
  dashT: number
  dashCd: number
  jumps: number
  burnT: number
  burnDps: number
  cd: number
  intent: number
  sawMove: number
  dead: boolean
  deadT: number
  flash: number
  enraged: boolean
  fly: number
  /** Time alive, for idle animation. */
  age: number
}

export type ShotKind = 'star' | 'wave' | 'fire' | 'wind' | 'shock' | 'dragon' | 'flame'

export interface Shot {
  kind: ShotKind
  team: 0 | 1
  x: number
  y: number
  vx: number
  vy: number
  r: number
  dmg: number
  life: number
  age: number
  pierce: boolean
  hit: number[]
  burn?: number
  stun?: number
  unblockable?: boolean
  lifesteal?: number
  kb: number
}

export interface Fx {
  kind: 'spark' | 'ink' | 'text' | 'ring' | 'bolt' | 'ember'
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  size: number
  text?: string
}

export interface Input {
  left: boolean
  right: boolean
  jump: boolean
  attack: boolean
  block: boolean
  dash: boolean
  special: boolean
}

export const noInput = (): Input => ({ left: false, right: false, jump: false, attack: false, block: false, dash: false, special: false })

export interface Sim {
  t: number
  stage: Stage
  wave: number
  hero: Fighter
  foes: Fighter[]
  shots: Shot[]
  fx: Fx[]
  sword: SwordDef
  heroMoves: Record<string, Move>
  /** Special meter, 0–100. */
  meter: number
  hitstop: number
  shake: number
  kills: number
  xp: number
  ryo: number
  /** Hits in a row without being hit. */
  chain: number
  chainT: number
  bestChain: number
  outcome: null | 'win' | 'lose'
  outcomeT: number
  banner: { text: string; sub?: string; t: number } | null
  boss: Fighter | null
  rng: () => number
  nextUid: number
  moveSerial: number
  /** Things for the screen to play (sounds), drained each frame. */
  events: string[]
}

// ─── Moves ─────────────────────────────────────────────────────────────

const shot = (s: Sim, f: Fighter, o: Partial<Shot> & Pick<Shot, 'kind' | 'vx' | 'r' | 'dmg'>): Shot => {
  const sh: Shot = { team: f.team, x: f.x + f.face * 24 * f.scale, y: f.y + 36 * f.scale, vy: 0, life: 2, age: 0, pierce: false, hit: [], kb: 120, ...o }
  s.shots.push(sh)
  return sh
}

const shockwaves = (s: Sim, f: Fighter, dmg: number) => {
  for (const d of [-1, 1]) shot(s, f, { kind: 'shock', x: f.x + d * 30 * f.scale, y: 0, vx: d * 430, r: 16, dmg, unblockable: true, pierce: true, life: 1.4, kb: 200 })
  s.shake = Math.max(s.shake, 0.35)
  s.events.push('slam')
}

/** Foe moves (damage is a multiple of the foe's attack). */
export const FOE_MOVES: Record<string, Move> = {
  slash: { id: 'slash', windup: 0.38, active: 0.1, recover: 0.45, reach: 54, back: 6, lo: 10, hi: 62, dmg: 1, kb: 170, swing: 'slash' },
  quick: { id: 'quick', windup: 0.22, active: 0.08, recover: 0.32, reach: 48, back: 6, lo: 10, hi: 60, dmg: 0.8, kb: 130, swing: 'slash' },
  thrust: { id: 'thrust', windup: 0.45, active: 0.12, recover: 0.5, reach: 90, lo: 25, hi: 52, dmg: 1.1, kb: 190, swing: 'thrust' },
  heavy: { id: 'heavy', windup: 0.7, active: 0.14, recover: 0.7, reach: 72, back: 10, lo: 0, hi: 85, dmg: 1.6, kb: 380, lift: 220, armor: true, swing: 'slam' },
  star: {
    id: 'star', windup: 0.32, active: 0.05, recover: 0.42, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, swing: 'throw',
    spawn: (s, f) => {
      shot(s, f, { kind: 'star', vx: f.face * 430, r: 7, dmg: f.atk, life: 2.4, kb: 90 })
      s.events.push('throw')
    },
  },
  dashStab: { id: 'dashStab', windup: 0.38, active: 0.22, recover: 0.45, reach: 42, lo: 15, hi: 55, dmg: 1.2, kb: 220, dash: 640, swing: 'thrust' },
  // Kaito the Ronin: a three-cut chain and a dashing iaijutsu slash.
  r1: { id: 'r1', windup: 0.3, active: 0.08, recover: 0.07, reach: 60, back: 6, lo: 10, hi: 64, dmg: 0.9, kb: 90, swing: 'slash', next: 'r2' },
  r2: { id: 'r2', windup: 0.1, active: 0.08, recover: 0.07, reach: 60, back: 6, lo: 10, hi: 64, dmg: 0.9, kb: 90, swing: 'up', next: 'r3' },
  r3: { id: 'r3', windup: 0.15, active: 0.1, recover: 0.6, reach: 64, back: 6, lo: 0, hi: 66, dmg: 1.4, kb: 340, lift: 200, swing: 'slam' },
  rdash: { id: 'rdash', windup: 0.5, active: 0.26, recover: 0.55, reach: 52, back: 10, lo: 10, hi: 60, dmg: 1.7, kb: 320, dash: 820, swing: 'thrust' },
  // Gōki the Oni: a sweeping club, a ground slam that sends shockwaves (jump them), a charge.
  club: { id: 'club', windup: 0.65, active: 0.15, recover: 0.65, reach: 60, back: 10, lo: 0, hi: 70, dmg: 1.05, kb: 380, lift: 180, armor: true, swing: 'slash' },
  slam: { id: 'slam', windup: 0.85, active: 0.1, recover: 0.8, reach: 50, back: 20, lo: 0, hi: 60, dmg: 1.5, kb: 300, unblockable: true, armor: true, swing: 'slam', spawn: (s, f) => shockwaves(s, f, f.atk * 0.9) },
  charge: { id: 'charge', windup: 0.55, active: 0.7, recover: 0.6, reach: 34, lo: 0, hi: 60, dmg: 1.3, kb: 440, lift: 200, dash: 520, armor: true, swing: 'thrust' },
  // Hayate the Tengu: fan gusts from the air and diving swoops.
  gust: {
    id: 'gust', windup: 0.42, active: 0.05, recover: 0.5, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, swing: 'cast',
    spawn: (s, f) => {
      const h = s.hero
      const base = Math.atan2(h.y + 30 - (f.y + 40 * f.scale), h.x - f.x)
      const n = f.enraged ? 5 : 3
      for (let i = 0; i < n; i++) {
        const a = base + (i - (n - 1) / 2) * 0.22
        shot(s, f, { kind: 'wind', vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, r: 11, dmg: f.atk * 0.8, life: 2.2, kb: 140 })
      }
      s.events.push('wind')
    },
  },
  swoop: {
    id: 'swoop', windup: 0.5, active: 0.5, recover: 0.5, reach: 46, back: 10, lo: -20, hi: 70, dmg: 1.4, kb: 300, dash: 640, swing: 'thrust',
    tick: (_s, f) => {
      f.fly = 0
    },
  },
  // Kage: vanishes and reappears behind you; throws fans of stars.
  vanish: {
    id: 'vanish', windup: 0.45, active: 0.1, recover: 0.4, reach: 62, back: 8, lo: 5, hi: 64, dmg: 1.5, kb: 260, swing: 'slash',
    spawn: (s, f) => {
      const h = s.hero
      const side = h.face === 1 ? -1 : 1
      inkBurst(s, f.x, f.y + 30, '#3d1f63', 10)
      f.x = clampX(h.x + side * 44)
      f.face = side === 1 ? -1 : 1
      inkBurst(s, f.x, f.y + 30, '#3d1f63', 10)
      s.events.push('vanish')
    },
  },
  fanStar: {
    id: 'fanStar', windup: 0.4, active: 0.05, recover: 0.5, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, swing: 'throw',
    spawn: (s, f) => {
      for (let i = -2; i <= 2; i++) shot(s, f, { kind: 'star', vx: f.face * 400 * Math.cos(i * 0.16), vy: 400 * Math.sin(i * 0.16), r: 7, dmg: f.atk * 0.6, life: 2.4, kb: 80 })
      s.events.push('throw')
    },
  },
  // The Dragon Shōgun: heavy cuts, dragon-fire breath, a leaping slam.
  breath: {
    id: 'breath', windup: 0.5, active: 0.9, recover: 0.5, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, swing: 'cast', armor: true,
    tick: (s, f, dt) => {
      if (s.rng() < dt * 22) {
        const a = (s.rng() - 0.5) * 0.5
        shot(s, f, { kind: 'flame', y: f.y + 48 * f.scale, vx: f.face * 360 * Math.cos(a), vy: 360 * Math.sin(a), r: 12, dmg: f.atk * 0.35, life: 0.85, pierce: true, kb: 60 })
      }
    },
    spawn: (s) => s.events.push('fire'),
  },
  leap: {
    id: 'leap', windup: 0.35, active: 0.75, recover: 0.5, reach: 50, back: 30, lo: 0, hi: 70, dmg: 1.4, kb: 360, armor: true, swing: 'slam',
    spawn: (s, f) => {
      const dx = s.hero.x - f.x
      f.vy = 760
      f.vx = Math.max(-560, Math.min(560, dx * 1.1))
      f.fired = true
    },
    tick: (s, f) => {
      if (f.y <= 0 && f.vy <= 0 && f.moveT > f.move!.windup + 0.15 && f.seg !== 99) {
        f.seg = 99
        shockwaves(s, f, f.atk * 0.8)
        f.vx = 0
      }
    },
  },
}

/** The hero's moves, from the sword in hand. */
export function heroMovesFor(sw: SwordDef): Record<string, Move> {
  const k = 1 / sw.speed
  const special: Record<Special, Move> = {
    spin: { id: 'sp', windup: 0.08, active: 0.6, recover: 0.2, reach: sw.reach + 40, back: sw.reach + 40, lo: -5, hi: 80, dmg: 1.1, kb: 240, hits: 4, armor: true, inv: true, swing: 'spin' },
    wave: {
      id: 'sp', windup: 0.12, active: 0.1, recover: 0.25, reach: sw.reach, back: 6, lo: 5, hi: 64, dmg: 1.4, kb: 260, inv: true, swing: 'slash',
      spawn: (s, f) => shot(s, f, { kind: 'wave', vx: f.face * 720, r: 26, dmg: f.atk * 3, pierce: true, life: 1.2, kb: 280 }),
    },
    flurry: { id: 'sp', windup: 0.06, active: 0.42, recover: 0.2, reach: 60, back: 30, lo: 0, hi: 70, dmg: 1.2, kb: 120, hits: 6, dash: 820, inv: true, swing: 'thrust' },
    fire: {
      id: 'sp', windup: 0.15, active: 0.1, recover: 0.3, reach: sw.reach, back: 10, lo: 0, hi: 64, dmg: 1.5, kb: 260, inv: true, swing: 'slam',
      spawn: (s, f) => shot(s, f, { kind: 'fire', y: 0, vx: f.face * 520, r: 30, dmg: f.atk * 2.6, pierce: true, life: 1.5, burn: 3, kb: 220 }),
    },
    lightning: {
      id: 'sp', windup: 0.3, active: 0.1, recover: 0.3, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, inv: true, swing: 'cast',
      spawn: (s, f) => {
        for (const e of s.foes) {
          if (e.dead) continue
          s.fx.push({ kind: 'bolt', x: e.x, y: e.y + 40 * e.scale, vx: 0, vy: 0, life: 0.35, max: 0.35, color: '#ffe066', size: 1 })
          hit(s, f, e, f.atk * 3, { kb: 120, lift: 150, stun: 1.4, unblockable: true })
        }
        s.shake = 0.4
        s.events.push('thunder')
      },
    },
    crescent: {
      id: 'sp', windup: 0.14, active: 0.1, recover: 0.25, reach: sw.reach, back: 6, lo: 5, hi: 64, dmg: 1.5, kb: 280, inv: true, swing: 'slash',
      spawn: (s, f) => shot(s, f, { kind: 'wave', vx: f.face * 640, r: 48, dmg: f.atk * 4, pierce: true, life: 1.4, lifesteal: 0.3, kb: 320 }),
    },
    dragon: {
      id: 'sp', windup: 0.3, active: 0.1, recover: 0.35, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, inv: true, swing: 'cast',
      spawn: (s, f) => {
        shot(s, f, { kind: 'dragon', y: f.y + 40, vx: f.face * 560, r: 44, dmg: f.atk * 5, pierce: true, life: 1.9, burn: 4, kb: 360 })
        s.shake = 0.3
        s.events.push('fire')
      },
    },
  }
  return {
    s1: { id: 's1', windup: 0.07 * k, active: 0.09 * k, recover: 0.16 * k, reach: sw.reach, back: 8, lo: 6, hi: 64, dmg: 1, kb: 120, swing: 'slash' },
    s2: { id: 's2', windup: 0.06 * k, active: 0.09 * k, recover: 0.16 * k, reach: sw.reach, back: 8, lo: 6, hi: 68, dmg: 1.1, kb: 130, swing: 'up' },
    s3: { id: 's3', windup: 0.1 * k, active: 0.12 * k, recover: 0.28 * k, reach: sw.reach + 6, back: 8, lo: 0, hi: 68, dmg: 1.7, kb: 380, lift: 260, swing: 'slam' },
    air: { id: 'air', windup: 0.05, active: 0.13, recover: 0.12, reach: sw.reach, back: 10, lo: -16, hi: 60, dmg: 1.2, kb: 170, swing: 'slash' },
    sp: special[sw.special],
  }
}

// ─── Setup ─────────────────────────────────────────────────────────────

function fighter(s: Sim, kind: Fighter['kind'], team: 0 | 1, x: number, hp: number, atk: number, speed: number, scale: number): Fighter {
  return {
    uid: s.nextUid++, kind, team, x, y: 0, vx: 0, vy: 0, face: 1, hp, maxHp: hp, atk, speed, scale,
    move: null, moveT: 0, fired: false, seg: -1, hitIds: [], combo: 0, comboQueued: false, blockT: -1, hurtT: 0, stunT: 0, inv: 0,
    dashT: 0, dashCd: 0, jumps: 0, burnT: 0, burnDps: 0, cd: 0.8, intent: 0, sawMove: -1, dead: false, deadT: 0, flash: 0, enraged: false, fly: 0, age: 0,
  }
}

export function spawnFoe(s: Sim, kind: FoeKind, x: number): Fighter {
  const d = FOES[kind]
  const hpMul = d.boss ? 1 + (s.stage.power - 1) * 0.4 : s.stage.power
  const f = fighter(s, kind, 1, x, Math.round(d.hp * hpMul), d.atk * (1 + (s.stage.power - 1) * 0.8), d.speed, d.scale)
  f.face = x > s.hero.x ? -1 : 1
  f.fly = d.fly ?? 0
  f.y = f.fly
  f.cd = 0.6 + s.rng() * 0.8
  s.foes.push(f)
  return f
}

function spawnWave(s: Sim) {
  const kinds = s.stage.waves[s.wave]
  kinds.forEach((k, i) => {
    const right = i % 2 === 0 ? s.hero.x < ARENA / 2 : s.hero.x >= ARENA / 2
    const x = right ? ARENA - 30 - Math.floor(i / 2) * 50 : 30 + Math.floor(i / 2) * 50
    const f = spawnFoe(s, k, x)
    if (FOES[k].boss) {
      s.boss = f
      s.banner = { text: FOES[k].name, sub: FOES[k].jp, t: 2.4 }
      s.events.push('boss')
    }
  })
  if (!s.boss || s.boss.dead) {
    const total = s.stage.waves.length
    s.banner = { text: total > 1 ? `Wave ${s.wave + 1} / ${total}` : 'Fight!', t: 1.4 }
  }
}

export function createSim(stage: Stage, level: number, sword: SwordDef, rng: () => number = Math.random): Sim {
  const st = heroStats(level)
  const s = { t: 0, stage, wave: 0, foes: [], shots: [], fx: [], sword, heroMoves: heroMovesFor(sword), meter: 0, hitstop: 0, shake: 0, kills: 0, xp: 0, ryo: 0, chain: 0, chainT: 0, bestChain: 0, outcome: null, outcomeT: 0, banner: null, boss: null, rng, nextUid: 1, moveSerial: 0, events: [] } as unknown as Sim
  s.hero = fighter(s, 'hero', 0, ARENA / 2, st.hp, sword.dmg * st.atkMul, RUN, 1)
  spawnWave(s)
  return s
}

// ─── Combat ────────────────────────────────────────────────────────────

const clampX = (x: number) => Math.max(20, Math.min(ARENA - 20, x))

function inkBurst(s: Sim, x: number, y: number, color: string, n: number) {
  for (let i = 0; i < n; i++) {
    const a = s.rng() * Math.PI * 2
    const v = 80 + s.rng() * 220
    s.fx.push({ kind: 'ink', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v + 120, life: 0.5 + s.rng() * 0.3, max: 0.8, color, size: 2 + s.rng() * 3 })
  }
}

function sparks(s: Sim, x: number, y: number, color: string, n: number) {
  for (let i = 0; i < n; i++) {
    const a = s.rng() * Math.PI * 2
    const v = 160 + s.rng() * 260
    s.fx.push({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.25, max: 0.25, color, size: 1.5 })
  }
}

interface HitOpts {
  kb: number
  lift?: number
  unblockable?: boolean
  stun?: number
  burn?: number
  lifesteal?: number
  /** Direction of the push (defaults to away from the source). */
  dir?: number
}

const facesToward = (t: Fighter, x: number) => (x >= t.x ? 1 : -1) === t.face

export function hit(s: Sim, src: Fighter | null, t: Fighter, dmg: number, o: HitOpts): 'hit' | 'block' | 'parry' | 'none' {
  if (t.dead || t.inv > 0) return 'none'
  const sx = src ? src.x : t.x - (o.dir ?? 1)
  const dir = o.dir ?? (t.x >= sx ? 1 : -1)
  const hx = t.x
  const hy = t.y + 40 * t.scale
  if (t.blockT >= 0 && !o.unblockable && facesToward(t, sx)) {
    if (t.blockT < 0.16 && src) {
      src.stunT = FOES[src.kind as FoeKind]?.boss ? 0.6 : 1
      src.move = null
      sparks(s, hx + t.face * 14, hy, '#fff6c0', 14)
      s.fx.push({ kind: 'ring', x: hx + t.face * 14, y: hy, vx: 0, vy: 0, life: 0.3, max: 0.3, color: '#fff6c0', size: 30 })
      s.fx.push({ kind: 'text', x: hx, y: hy + 30, vx: 0, vy: 40, life: 0.8, max: 0.8, color: '#fff6c0', size: 12, text: 'PARRY!' })
      if (t.team === 0) s.meter = Math.min(100, s.meter + 18)
      s.hitstop = 0.1
      s.events.push('parry')
      return 'parry'
    }
    dmg *= 0.15
    t.vx = dir * o.kb * 0.4
    sparks(s, hx + t.face * 14, hy, '#ffffff', 6)
    s.events.push('block')
    if (dmg < 0.5) return 'block'
  }
  dmg = Math.max(1, Math.round(dmg))
  t.hp -= dmg
  t.flash = 0.12
  if (o.burn) {
    t.burnT = o.burn
    t.burnDps = Math.max(t.burnDps, dmg * 0.15)
  }
  if (o.stun) t.stunT = Math.max(t.stunT, o.stun)
  const armored = t.move?.armor || (FOES[t.kind as FoeKind]?.boss && t.kind !== 'ronin' && t.kind !== 'kage' && dmg < t.maxHp * 0.08)
  if (!armored || t.hp <= 0) {
    t.vx = dir * o.kb
    if (o.lift) t.vy = o.lift
    t.hurtT = t.team === 0 ? 0.3 : 0.28
    if (t.move && !t.move.armor) t.move = null
    t.blockT = -1
  }
  if (t.team === 0) {
    t.inv = 0.45
    s.meter = Math.min(100, s.meter + 5)
    s.chain = 0
    s.shake = Math.max(s.shake, 0.25)
    s.events.push('hurt')
  } else {
    s.meter = Math.min(100, s.meter + (src?.move?.id === 's3' ? 10 : 6))
    s.chain++
    s.chainT = 2
    s.bestChain = Math.max(s.bestChain, s.chain)
    s.events.push('hit')
    if (o.lifesteal || s.sword.lifesteal) {
      const heal = Math.round(dmg * (o.lifesteal ?? s.sword.lifesteal ?? 0))
      s.hero.hp = Math.min(s.hero.maxHp, s.hero.hp + heal)
    }
  }
  s.hitstop = Math.max(s.hitstop, dmg > 30 ? 0.09 : 0.05)
  inkBurst(s, hx, hy, t.team === 0 ? '#c0392b' : '#1a1a1a', 6)
  sparks(s, hx, hy, '#ffffff', 5)
  s.fx.push({ kind: 'text', x: hx + (s.rng() - 0.5) * 16, y: hy + 26 * t.scale, vx: (s.rng() - 0.5) * 30, vy: 70, life: 0.7, max: 0.7, color: t.team === 0 ? '#ff6b6b' : '#ffffff', size: dmg >= 40 ? 15 : 11, text: String(dmg) })
  if (t.hp <= 0) kill(s, t, dir)
  return 'hit'
}

function kill(s: Sim, t: Fighter, dir: number) {
  t.hp = 0
  t.dead = true
  t.move = null
  t.vx = dir * 260
  t.vy = 320
  t.fly = 0
  s.hitstop = 0.12
  inkBurst(s, t.x, t.y + 30, t.team === 0 ? '#c0392b' : '#111', 18)
  if (t.team === 1) {
    const d = FOES[t.kind as FoeKind]
    s.kills++
    s.xp += Math.round(d.xp * s.stage.power)
    s.ryo += Math.round(d.ryo * s.stage.power)
    s.events.push(d.boss ? 'bossDown' : 'kill')
    if (d.boss) {
      s.shake = 0.6
      for (const e of s.foes) if (!e.dead && e !== t) kill(s, e, e.x >= t.x ? 1 : -1)
    }
  } else s.events.push('dead')
}

function checkHits(s: Sim, f: Fighter) {
  const m = f.move!
  const targets = f.team === 0 ? s.foes : [s.hero]
  for (const t of targets) {
    if (t.dead || f.hitIds.includes(t.uid)) continue
    const rel = (t.x - f.x) * f.face
    const w = 12 * t.scale
    if (rel + w < -(m.back ?? 0) * f.scale || rel - w > m.reach * f.scale) continue
    const lo = f.y + m.lo * f.scale
    const hi = f.y + m.hi * f.scale
    if (hi < t.y || lo > t.y + BODY_H * t.scale) continue
    f.hitIds.push(t.uid)
    hit(s, f, t, f.atk * m.dmg, { kb: m.kb, lift: m.lift, unblockable: m.unblockable, stun: m.stun, burn: f.team === 0 && s.sword.burn ? 3 : undefined, dir: f.face })
  }
}

function startMove(s: Sim, f: Fighter, m: Move) {
  f.move = m
  f.moveT = 0
  f.fired = false
  f.seg = -1
  f.hitIds = []
  f.blockT = -1
  if (f.team === 0) s.moveSerial++
  if (m.inv) f.inv = Math.max(f.inv, m.windup + m.active + m.recover)
}

function runMove(s: Sim, f: Fighter, dt: number) {
  const m = f.move!
  f.moveT += dt
  const t = f.moveT
  if (t >= m.windup && !f.fired) {
    f.fired = true
    if (m.spawn) m.spawn(s, f)
    if (f.team === 0) s.events.push('swing')
  }
  const active = t >= m.windup && t < m.windup + m.active
  if (active) {
    if (m.dash) f.vx = f.face * m.dash
    m.tick?.(s, f, dt)
    if (m.reach > 0) {
      const seg = m.hits ? Math.floor(((t - m.windup) / m.active) * m.hits) : 0
      if (seg !== f.seg && f.seg !== 99) {
        f.seg = seg
        f.hitIds = []
      }
      checkHits(s, f)
    }
  } else if (m.dash && t >= m.windup + m.active) f.vx *= 0.8
  if (t >= m.windup + m.active + m.recover) {
    f.move = null
    if (m.next) startMove(s, f, FOE_MOVES[m.next])
    else if (f.team === 0 && f.comboQueued && (m.id === 's1' || m.id === 's2')) {
      f.comboQueued = false
      startMove(s, f, s.heroMoves[m.id === 's1' ? 's2' : 's3'])
    } else f.comboQueued = false
    if (f.kind === 'tengu' && m.id === 'swoop') f.fly = FOES.tengu.fly!
  }
}

// ─── Control and AI ────────────────────────────────────────────────────

function heroControl(s: Sim, inp: Input, dt: number) {
  const h = s.hero
  h.dashCd -= dt
  if (h.dead || h.stunT > 0 || h.hurtT > 0) {
    h.blockT = -1
    return
  }
  const grounded = h.y <= 0
  if (grounded) h.jumps = 0
  if (inp.special && s.meter >= 100) {
    s.meter = 0
    h.dashT = 0
    startMove(s, h, s.heroMoves.sp)
    s.banner = { text: s.sword.specialName, t: 0.9 }
    s.events.push('special')
    return
  }
  const m = h.move
  const inRecovery = m && h.moveT >= m.windup + m.active
  if (inp.dash && h.dashCd <= 0 && (!m || inRecovery) && !m?.inv) {
    h.move = null
    const dir = inp.left ? -1 : inp.right ? 1 : h.face
    h.face = dir as 1 | -1
    h.dashT = 0.17
    h.inv = Math.max(h.inv, 0.2)
    h.vx = dir * 760
    h.dashCd = 0.55
    h.blockT = -1
    s.events.push('dash')
    return
  }
  if (inp.attack) {
    if (!m && h.dashT <= 0) {
      if (inp.left) h.face = -1
      else if (inp.right) h.face = 1
      startMove(s, h, grounded ? s.heroMoves.s1 : s.heroMoves.air)
    } else if (m && (m.id === 's1' || m.id === 's2') && h.moveT >= m.windup) h.comboQueued = true
  }
  if (h.move || h.dashT > 0) return
  if (inp.block && grounded) {
    h.blockT = h.blockT < 0 ? 0 : h.blockT + dt
    h.vx = 0
    return
  }
  h.blockT = -1
  const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0)
  h.vx = dir * RUN
  if (dir) h.face = dir as 1 | -1
  if (inp.jump && (grounded || h.jumps < 1)) {
    if (!grounded) h.jumps++
    h.vy = JUMP * (grounded ? 1 : 0.85)
    s.events.push('jump')
  }
}

function think(s: Sim, f: Fighter, dt: number) {
  const d = FOES[f.kind as FoeKind]
  const h = s.hero
  if (f.dead || f.move || f.hurtT > 0 || f.stunT > 0) return
  f.cd -= dt * (f.enraged ? 1.4 : 1)
  const dx = h.x - f.x
  const dist = Math.abs(dx)
  f.face = dx >= 0 ? 1 : -1
  if (h.dead) {
    f.intent = 0
    return
  }
  // Raise a guard against a swing that is coming.
  if (f.blockT >= 0) {
    f.blockT += dt
    f.intent = 0
    if (f.blockT > 0.55) f.blockT = -1
    return
  }
  if (h.move && h.move.reach > 0 && f.sawMove !== s.moveSerial && dist < h.move.reach + 40 && h.moveT < h.move.windup + 0.02) {
    f.sawMove = s.moveSerial
    if (s.rng() < d.block) {
      f.blockT = 0
      f.intent = 0
      return
    }
  }
  // Only the two nearest close in; the rest circle at a distance.
  const melee = s.foes.filter((e) => !e.dead && !FOES[e.kind as FoeKind].range).sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x))
  const slot = melee.indexOf(f)
  let want = d.range ?? Math.max(36, FOE_MOVES[d.moves[0][0]].reach * f.scale * 0.7)
  if (!d.boss && slot >= 2) want = 150 + (slot - 2) * 50
  // Attack if a move fits this distance.
  if (f.cd <= 0 && (slot < 2 || d.range || d.boss)) {
    const options = d.moves.filter(([, , min, max]) => dist >= min && dist <= max * (d.boss ? 1 : f.scale))
    if (options.length) {
      let r = s.rng() * options.reduce((a, o) => a + o[1], 0)
      const pick = options.find((o) => (r -= o[1]) < 0) ?? options[0]
      startMove(s, f, FOE_MOVES[pick[0]])
      f.cd = d.cooldown * (0.7 + s.rng() * 0.6)
      f.intent = 0
      return
    }
  }
  if (dist > want + 10) f.intent = Math.sign(dx)
  else if (d.range && dist < want - 60) f.intent = -Math.sign(dx)
  else f.intent = 0
  // Bosses get angry at half health.
  if (d.boss && !f.enraged && f.hp < f.maxHp / 2) {
    f.enraged = true
    f.speed *= 1.2
    s.banner = { text: 'Enraged!', sub: d.jp, t: 1.4 }
    s.shake = 0.4
    s.events.push('boss')
    if (f.kind === 'kage') for (const side of [-1, 1]) spawnFoe(s, 'shade', clampX(h.x + side * 200))
    if (f.kind === 'shogun') for (const side of [-1, 1]) spawnFoe(s, 'bandit', side < 0 ? 30 : ARENA - 30)
    if (f.kind === 'oni') for (const side of [-1, 1]) spawnFoe(s, 'bandit', side < 0 ? 30 : ARENA - 30)
  }
}

function physics(s: Sim, f: Fighter, dt: number) {
  f.age += dt
  f.flash = Math.max(0, f.flash - dt)
  f.inv = Math.max(0, f.inv - dt)
  f.hurtT = Math.max(0, f.hurtT - dt)
  f.stunT = Math.max(0, f.stunT - dt)
  f.dashT = Math.max(0, f.dashT - dt)
  if (f.burnT > 0 && !f.dead) {
    f.burnT -= dt
    f.hp -= f.burnDps * dt
    if (s.rng() < dt * 14) s.fx.push({ kind: 'ember', x: f.x + (s.rng() - 0.5) * 16, y: f.y + s.rng() * 50 * f.scale, vx: 0, vy: 60, life: 0.5, max: 0.5, color: '#ff8a3d', size: 3 })
    if (f.hp <= 0) kill(s, f, f.face === 1 ? -1 : 1)
  }
  if (f.dead) f.deadT += dt
  const flying = f.fly > 0 && !f.dead && f.stunT <= 0
  if (flying) {
    f.vy = (f.fly + Math.sin(f.age * 2) * 10 - f.y) * 4
  } else f.vy -= GRAV * dt
  f.y += f.vy * dt
  if (f.y <= 0) {
    f.y = 0
    if (f.vy < 0) f.vy = 0
  }
  // Walking, or sliding to a stop.
  if (f.team === 1 && !f.dead && !f.move && f.hurtT <= 0 && f.stunT <= 0 && f.blockT < 0) {
    const target = f.intent * f.speed
    f.vx += (target - f.vx) * Math.min(1, dt * 10)
  } else if (f.team === 0 && (f.hurtT > 0 || f.stunT > 0 || f.dead || (f.move && !f.move.dash))) {
    f.vx *= f.y > 0 ? 0.99 : Math.pow(0.002, dt)
  } else if (f.team === 1 && (f.hurtT > 0 || f.dead || f.stunT > 0 || (f.move && !f.move.dash))) {
    f.vx *= f.y > 0 ? 0.99 : Math.pow(0.002, dt)
  }
  f.x = clampX(f.x + f.vx * dt)
}

function updateShots(s: Sim, dt: number) {
  for (const sh of s.shots) {
    sh.age += dt
    sh.x += sh.vx * dt
    sh.y += sh.vy * dt
    if (sh.kind === 'fire' && s.rng() < dt * 40) s.fx.push({ kind: 'ember', x: sh.x + (s.rng() - 0.5) * sh.r, y: sh.y + s.rng() * sh.r * 1.5, vx: 0, vy: 90, life: 0.5, max: 0.5, color: '#ffb74d', size: 4 })
    const targets = sh.team === 0 ? s.foes : [s.hero]
    for (const t of targets) {
      if (t.dead || sh.hit.includes(t.uid)) continue
      const cy = t.y + (BODY_H / 2) * t.scale
      if (Math.abs(t.x - sh.x) < sh.r + 12 * t.scale && Math.abs(cy - (sh.y + (sh.kind === 'shock' || sh.kind === 'fire' ? 10 : 0))) < sh.r + (BODY_H / 2) * t.scale) {
        sh.hit.push(t.uid)
        const r = hit(s, null, t, sh.dmg, { kb: sh.kb, dir: Math.sign(sh.vx) || 1, unblockable: sh.unblockable, burn: sh.burn, stun: sh.stun, lifesteal: sh.lifesteal })
        if (!sh.pierce || r === 'parry') sh.life = 0
        if (r === 'parry' && sh.team === 1) {
          // A parried star flies back at its thrower.
          s.shots.push({ ...sh, team: 0, vx: -sh.vx * 1.2, vy: -sh.vy, life: 2, age: 0, hit: [], dmg: sh.dmg * 2 })
        }
      }
    }
  }
  s.shots = s.shots.filter((sh) => sh.age < sh.life && sh.x > -60 && sh.x < ARENA + 60 && sh.y > -40 && sh.y < 600)
}

function updateFx(s: Sim, dt: number) {
  for (const p of s.fx) {
    p.life -= dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    if (p.kind === 'ink' || p.kind === 'spark') p.vy -= 900 * dt
    if (p.kind === 'ink' && p.y < 0) {
      p.y = 0
      p.vx *= 0.5
      p.vy = 0
    }
  }
  s.fx = s.fx.filter((p) => p.life > 0)
  if (s.fx.length > 400) s.fx.splice(0, s.fx.length - 400)
}

/**
 * Advance the fight by dt seconds. Returns false while frozen in hit-stop,
 * when the input was not read (so keep edge presses for the next frame).
 */
export function step(s: Sim, inp: Input, dt: number): boolean {
  s.shake = Math.max(0, s.shake - dt)
  if (s.banner) {
    s.banner.t -= dt
    if (s.banner.t <= 0) s.banner = null
  }
  if (s.hitstop > 0) {
    s.hitstop -= dt
    return false
  }
  s.t += dt
  s.chainT -= dt
  if (s.chainT <= 0) s.chain = 0
  if (s.outcome) {
    s.outcomeT += dt
    for (const f of [s.hero, ...s.foes]) physics(s, f, dt)
    updateFx(s, dt)
    return true
  }
  heroControl(s, inp, dt)
  for (const f of s.foes) think(s, f, dt)
  for (const f of [s.hero, ...s.foes]) {
    if (f.move && !f.dead && f.hurtT <= 0 && f.stunT <= 0) runMove(s, f, dt)
    else if (f.move && (f.hurtT > 0 || f.stunT > 0) && !f.move.armor) f.move = null
    physics(s, f, dt)
  }
  // Fighters push apart a little so they do not stack.
  const live = s.foes.filter((f) => !f.dead)
  for (let i = 0; i < live.length; i++)
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i]
      const b = live[j]
      const gap = 20 * (a.scale + b.scale) - Math.abs(a.x - b.x)
      if (gap > 0 && Math.abs(a.y - b.y) < 40) {
        const d = a.x <= b.x ? -1 : 1
        a.x = clampX(a.x + (d * gap) / 2)
        b.x = clampX(b.x - (d * gap) / 2)
      }
    }
  updateShots(s, dt)
  updateFx(s, dt)
  s.foes = s.foes.filter((f) => !f.dead || f.deadT < 1.6)
  if (s.hero.dead) {
    s.outcome = 'lose'
    s.banner = { text: 'Defeated…', t: 3 }
    return true
  }
  if (s.foes.every((f) => f.dead)) {
    if (s.wave + 1 < s.stage.waves.length) {
      s.wave++
      // A breather between waves.
      const heal = Math.round(s.hero.maxHp * 0.15)
      s.hero.hp = Math.min(s.hero.maxHp, s.hero.hp + heal)
      s.fx.push({ kind: 'text', x: s.hero.x, y: s.hero.y + 80, vx: 0, vy: 30, life: 1.2, max: 1.2, color: '#7CFC9A', size: 12, text: `+${heal}` })
      spawnWave(s)
    } else {
      s.outcome = 'win'
      s.banner = { text: s.stage.boss ? 'Boss defeated!' : 'Stage clear!', t: 3 }
      s.events.push('win')
    }
  }
  return true
}

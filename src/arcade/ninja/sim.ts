/**
 * The Stick Ninja fight: a small side-on fighting engine. Pure (no DOM) and
 * stepped with a delta time, so it can be tested and drawn separately.
 *
 * Everything that swings is a Move: a windup, an active window in which its
 * hit band is live, and a recovery. Moves can dash, spawn projectiles, chain
 * into the next move, or carry super armour. The hero's moves come from the
 * equipped sword; each foe picks from its own list by distance.
 */
import type { Level, Solid } from './trials'
import { ART_BY_ID, ARMOR_BY_ID, FOES, gearName, heroStats, MOD_INFO, type ArmorDef, type Arts, type FoeKind, type GearId, type Special, type Stage, type SwordDef } from './data'

export const ARENA = 960
/** Width of the fight in play (the arena, or a Shadow Trials level). One fight runs at a time. */
let W = ARENA
export const GRAV = 1900
const JUMP = 670
const RUN = 250
const BODY_H = 62
/** Shuriken the hero carries (they come back over time). */
export const MAX_STARS = 6
const STAR_REGEN = 1.6
/** Height of a fighter's body: much lower while crouching. */
const bodyH = (t: Fighter) => BODY_H * t.scale * (t.crouch ? 0.45 : 1)

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
  /** Hits heal the hero by this fraction of the damage. */
  drain?: number
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
  /** A gold-aura elite (tougher, richer). */
  elite?: boolean
  /** Chilled: moves and attacks at half speed. */
  chillT: number
  /** Marked by shadow: takes a quarter more damage. */
  markT: number
  /** Seconds since last on the ground (for a forgiving jump). */
  airT: number
  /** Ducking low (projectiles and high attacks pass over). */
  crouch: boolean
  /** Height of the ground under the feet (0 in the arena; terrain in a trial; -Infinity over a pit). */
  gy: number
  /** Touching a wall this frame (-1 left, 1 right, 0 none). */
  wall: number
  /** After a wall-jump, a moment when the stick can't cancel the kick-off. */
  wallLock: number
  /** Foes in a trial patrol until they notice the hero (and can be assassinated until then). */
  aware: boolean
  /** Patrol bounds (a foe stays on its own platform). */
  px0: number
  px1: number
}

export type ShotKind = 'star' | 'wave' | 'fire' | 'wind' | 'shock' | 'dragon' | 'flame' | 'water' | 'wisp' | 'arrow' | 'ice' | 'bolt' | 'ink' | 'bone' | 'firefly' | 'crow' | 'geyser' | 'tornado'

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
  lift?: number
  /** Falls (or arcs) under this gravity. */
  grav?: number
  /** Steers toward its target (turn rate). */
  homing?: number
  /** Waits this long before it is live (a telegraph is drawn meanwhile). */
  delay?: number
  /** Can hit the same target again every this many seconds. */
  rehit?: number
  rehitT?: number
  /** Drags nearby foes toward itself. */
  pull?: number
  /** Thrown by the hero's special (gets the Ink Arts). */
  sp?: boolean
  /** Colour override (an element's tint). */
  tint?: string
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
  /** Held ▼: crouch (with attack: a low sweep, or Rising Dragon; in the air, Falling Star). */
  down: boolean
  jump: boolean
  /** Throw a shuriken. */
  throw: boolean
  attack: boolean
  /** The attack button is held down (keeps the combo going). */
  attackHeld: boolean
  block: boolean
  dash: boolean
  special: boolean
}

export const noInput = (): Input => ({ left: false, right: false, down: false, jump: false, throw: false, attack: false, attackHeld: false, block: false, dash: false, special: false })

/** Urns and chests to break in the arena. */
export interface Prop {
  uid: number
  kind: 'urn' | 'chest' | 'cage'
  x: number
  /** Height of the ground it stands on (0 in the arena). */
  y: number
  hp: number
  gear?: GearId
  broken: boolean
  shake: number
  /** Move serial + segment that last hit it (one knock per swing). */
  lastHit: number
}

/** Things to pick up: ryō, onigiri, ink orbs, found gear. */
export interface Drop {
  kind: 'coin' | 'heal' | 'ink' | 'gear' | 'gem'
  /** Placed in the level (floats where it is until picked up). */
  placed?: boolean
  x: number
  y: number
  vx: number
  vy: number
  value: number
  gear?: GearId
  age: number
  taken: boolean
}

/** What the hero brings into a fight besides level and sword. */
export interface Loadout {
  armor?: ArmorDef
  arts?: Arts
  /** Gear already owned (its chest is left out of the stage). */
  have?: GearId[]
}

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
  armor: ArmorDef
  arts: Arts
  /** Meter gain multiplier (Focus, focus armour). */
  meterMul: number
  /** Special damage multiplier (Might). */
  spMul: number
  barrier: number
  barrierT: number
  /** Input buffers (seconds left): a press just before you can act still counts. */
  bufAtk: number
  bufJump: number
  /** Slow motion after a boss falls. */
  slowT: number
  props: Prop[]
  drops: Drop[]
  /** Gear picked up this fight. */
  found: GearId[]
  have: GearId[]
  /** A white flash over the screen (special, boss down). */
  flashT: number
  /** Shuriken in hand, and the time toward the next one coming back. */
  stars: number
  starT: number
  /** Width of this fight (arena or level). */
  width: number
  /** Shadow Trials: the level, the last lantern reached, hostages freed, diamonds found. */
  lv: Level | null
  checkpoint: { x: number; y: number }
  saved: number
  gems: number
  falls: number
}

// ─── Moves ─────────────────────────────────────────────────────────────

const shot = (s: Sim, f: Fighter, o: Partial<Shot> & Pick<Shot, 'kind' | 'vx' | 'r' | 'dmg'>): Shot => {
  const sp = f.team === 0 && f.move?.id === 'sp'
  const tint = sp && s.arts.element ? ART_BY_ID[`el:${s.arts.element}`].color : undefined
  const sh: Shot = { team: f.team, x: f.x + f.face * 24 * f.scale, y: f.y + 36 * f.scale, vy: 0, life: 2, age: 0, pierce: false, hit: [], kb: 120, sp, tint, ...o }
  if (sp && s.arts.element === 'wind') sh.r *= 1.3
  s.shots.push(sh)
  return sh
}

/** Things falling from the sky around x (bones, ink, lightning), each after its own delay. */
const rain = (s: Sim, f: Fighter, kind: ShotKind, x: number, n: number, gap: number, dmg: number, o: Partial<Shot> = {}) => {
  for (let i = 0; i < n; i++) {
    const at = x + (i - (n - 1) / 2) * gap + (s.rng() - 0.5) * 20
    shot(s, f, { kind, x: clampX(at), y: 330, vx: 0, vy: -80, grav: 900, r: 10, dmg, life: 2.4 + i * 0.12, delay: 0.35 + i * 0.12, kb: 120, ...o })
  }
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
  thrust: { id: 'thrust', windup: 0.45, active: 0.12, recover: 0.5, reach: 90, lo: 30, hi: 54, dmg: 1.1, kb: 190, swing: 'thrust' },
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
      if (f.y <= f.gy && f.vy <= 0 && f.moveT > f.move!.windup + 0.15 && f.seg !== 99) {
        f.seg = 99
        shockwaves(s, f, f.atk * 0.8)
        f.vx = 0
      }
    },
  },
  // Kappa: a dashing headbutt and an arcing spit of river water.
  headbutt: { id: 'headbutt', windup: 0.42, active: 0.22, recover: 0.45, reach: 40, lo: 10, hi: 55, dmg: 1.1, kb: 260, dash: 520, swing: 'thrust' },
  spit: {
    id: 'spit', windup: 0.38, active: 0.05, recover: 0.45, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, swing: 'throw',
    spawn: (s, f) => {
      const dx = Math.abs(s.hero.x - f.x)
      shot(s, f, { kind: 'water', vx: f.face * Math.min(420, 140 + dx * 0.8), vy: 260, grav: 700, r: 9, dmg: f.atk * 0.9, life: 2.2, kb: 110 })
      s.events.push('throw')
    },
  },
  // Yūrei: slow wisps that drift after you, and a fade that brings it behind you.
  wisp: {
    id: 'wisp', windup: 0.45, active: 0.05, recover: 0.5, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, swing: 'cast',
    spawn: (s, f) => {
      shot(s, f, { kind: 'wisp', vx: f.face * 150, vy: 20, r: 9, dmg: f.atk * 0.9, life: 3.6, homing: 1.6, kb: 90 })
      s.events.push('wind')
    },
  },
  phase: {
    id: 'phase', windup: 0.6, active: 0.1, recover: 0.5, reach: 54, back: 8, lo: 0, hi: 64, dmg: 1, kb: 200, swing: 'slash',
    spawn: (s, f) => {
      const h = s.hero
      const side = h.face === 1 ? -1 : 1
      inkBurst(s, f.x, f.y + 30, '#bfe3f2', 8)
      f.x = clampX(h.x + side * 46)
      f.face = side === 1 ? -1 : 1
      s.events.push('vanish')
    },
  },
  // Archers: high arcing arrows.
  arrow: {
    id: 'arrow', windup: 0.6, active: 0.05, recover: 0.5, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, swing: 'throw',
    spawn: (s, f) => {
      const dx = Math.abs(s.hero.x - f.x)
      const vx = Math.min(640, 260 + dx * 0.6)
      shot(s, f, { kind: 'arrow', vx: f.face * vx, vy: Math.min(320, (dx / vx) * 260 * 0.5 + 60), grav: 260, r: 6, dmg: f.atk * 1.1, life: 2.6, kb: 120 })
      s.events.push('throw')
    },
  },
  // Warrior monks: a spinning staff that hits on both sides.
  staffSpin: { id: 'staffSpin', windup: 0.42, active: 0.45, recover: 0.45, reach: 66, back: 66, lo: 0, hi: 72, dmg: 0.6, kb: 170, hits: 3, swing: 'spin' },
  // Gatarō the Kappa King: geysers that burst up in a line, and a belly slide.
  geyser: {
    id: 'geyser', windup: 0.55, active: 0.05, recover: 0.6, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, swing: 'slam', armor: true,
    spawn: (s, f) => {
      const n = f.enraged ? 5 : 4
      for (let i = 0; i < n; i++) shot(s, f, { kind: 'geyser', x: clampX(f.x + f.face * (90 + i * 85)), y: 0, vx: 0, r: 22, dmg: f.atk * 1.1, life: 0.55 + i * 0.22 + 0.45, delay: 0.55 + i * 0.22, pierce: true, lift: 420, kb: 80 })
      s.events.push('slam')
    },
  },
  bellySlide: { id: 'bellySlide', windup: 0.55, active: 0.8, recover: 0.6, reach: 40, lo: 0, hi: 40, dmg: 1.3, kb: 420, lift: 160, dash: 600, armor: true, swing: 'thrust' },
  // The Gashadokuro: a crushing grab, ground slams, and a rain of bones.
  boneGrab: { id: 'boneGrab', windup: 0.8, active: 0.16, recover: 0.75, reach: 100, back: 10, lo: 0, hi: 90, dmg: 1.5, kb: 300, stun: 0.5, armor: true, swing: 'slam' },
  boneRain: {
    id: 'boneRain', windup: 0.65, active: 0.05, recover: 0.6, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, swing: 'cast', armor: true,
    spawn: (s, f) => {
      rain(s, f, 'bone', s.hero.x, f.enraged ? 8 : 6, 58, f.atk * 0.7)
      s.events.push('boss')
    },
  },
  // Fubuki: a wave of ice along the ground that freezes what it touches.
  iceWave: {
    id: 'iceWave', windup: 0.42, active: 0.1, recover: 0.5, reach: 50, back: 6, lo: 5, hi: 64, dmg: 1, kb: 200, swing: 'slam',
    spawn: (s, f) => {
      shot(s, f, { kind: 'ice', y: 0, vx: f.face * 470, r: 18, dmg: f.atk * 1.1, pierce: true, life: 1.4, stun: 0.9, kb: 120 })
      s.events.push('wind')
    },
  },
  // Ikazuchi: lightning strikes where you stand (watch for the warning marks).
  bolts: {
    id: 'bolts', windup: 0.5, active: 0.05, recover: 0.55, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, swing: 'cast',
    spawn: (s, f) => {
      const n = f.enraged ? 5 : 3
      for (let i = 0; i < n; i++) {
        const x = clampX(s.hero.x + (i - (n - 1) / 2) * 95)
        shot(s, f, { kind: 'bolt', x, y: 0, vx: 0, r: 20, dmg: f.atk * 1.1, life: 0.95 + i * 0.12, delay: 0.7 + i * 0.12, unblockable: true, stun: 0.4, pierce: true, kb: 140 })
      }
      s.events.push('thunder')
    },
  },
  // The Quiet: a wave of ink, and ink that pours up into the sky and falls back down.
  inkWave: {
    id: 'inkWave', windup: 0.35, active: 0.1, recover: 0.45, reach: 56, back: 6, lo: 5, hi: 64, dmg: 1, kb: 220, swing: 'slash',
    spawn: (s, f) => shot(s, f, { kind: 'ink', vx: f.face * 560, r: 28, dmg: f.atk * 1.2, pierce: true, life: 1.3, kb: 240 }),
  },
  inkRain: {
    id: 'inkRain', windup: 0.7, active: 0.05, recover: 0.6, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, swing: 'cast', armor: true,
    spawn: (s, f) => {
      rain(s, f, 'bone', s.hero.x, f.enraged ? 11 : 8, 60, f.atk * 0.6, { tint: '#1b1030' })
      s.events.push('vanish')
    },
  },
}

/** The hero's moves, from the sword in hand. */
export function heroMovesFor(sw: SwordDef, arts?: Arts): Record<string, Move> {
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
    fireflies: {
      id: 'sp', windup: 0.2, active: 0.1, recover: 0.3, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, inv: true, swing: 'cast',
      spawn: (s, f) => {
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2
          shot(s, f, { kind: 'firefly', x: f.x + Math.cos(a) * 20, y: f.y + 40 + Math.sin(a) * 20, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, r: 7, dmg: f.atk * 1.1, life: 3, homing: 5, burn: 2, kb: 80 })
        }
        s.events.push('fire')
      },
    },
    crows: {
      id: 'sp', windup: 0.22, active: 0.1, recover: 0.3, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, inv: true, swing: 'throw',
      spawn: (s, f) => {
        for (let i = 0; i < 7; i++) shot(s, f, { kind: 'crow', vx: f.face * (260 + i * 30), vy: 140 - i * 45, r: 9, dmg: f.atk * 1.5, life: 3, homing: 4, kb: 140 })
        s.events.push('wind')
      },
    },
    geyser: {
      id: 'sp', windup: 0.2, active: 0.1, recover: 0.35, reach: sw.reach, back: 6, lo: 0, hi: 64, dmg: 1.4, kb: 260, inv: true, swing: 'slam',
      spawn: (s, f) => {
        for (let i = 0; i < 6; i++) shot(s, f, { kind: 'geyser', x: clampX(f.x + f.face * (70 + i * 70)), y: 0, vx: 0, r: 26, dmg: f.atk * 2.2, life: 0.2 + i * 0.1 + 0.5, delay: 0.15 + i * 0.1, pierce: true, unblockable: true, lift: 480, kb: 120 })
        s.shake = 0.3
        s.events.push('slam')
      },
    },
    bloodDance: { id: 'sp', windup: 0.06, active: 0.7, recover: 0.2, reach: 66, back: 36, lo: 0, hi: 72, dmg: 1.25, kb: 120, hits: 10, dash: 880, inv: true, drain: 0.25, swing: 'thrust' },
    tornado: {
      id: 'sp', windup: 0.2, active: 0.1, recover: 0.3, reach: sw.reach, back: 6, lo: 0, hi: 64, dmg: 1.2, kb: 200, inv: true, swing: 'spin',
      spawn: (s, f) => {
        shot(s, f, { kind: 'tornado', y: 0, vx: f.face * 260, r: 40, dmg: f.atk * 0.9, life: 2.4, pierce: true, rehit: 0.22, pull: 260, kb: 40, lift: 120 })
        s.events.push('wind')
      },
    },
    judgement: {
      id: 'sp', windup: 0.4, active: 0.1, recover: 0.4, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, inv: true, swing: 'cast',
      spawn: (s, f) => {
        shot(s, f, { kind: 'wave', vx: f.face * 820, r: 70, dmg: f.atk * 6, pierce: true, unblockable: true, life: 1.2, kb: 420, burn: 3 })
        for (const e of s.foes) if (!e.dead) hit(s, f, e, f.atk * 2, { kb: 80, unblockable: true, sp: true })
        s.flashT = 0.35
        s.shake = 0.5
        s.events.push('thunder')
      },
    },
  }
  const sp = { ...special[sw.special] }
  if (arts?.element === 'wind' && sp.reach > 0) sp.reach *= 1.3
  return {
    s1: { id: 's1', windup: 0.07 * k, active: 0.09 * k, recover: 0.16 * k, reach: sw.reach, back: 8, lo: 6, hi: 64, dmg: 1, kb: 120, swing: 'slash' },
    s2: { id: 's2', windup: 0.06 * k, active: 0.09 * k, recover: 0.16 * k, reach: sw.reach, back: 8, lo: 6, hi: 68, dmg: 1.1, kb: 130, swing: 'up' },
    s3: { id: 's3', windup: 0.1 * k, active: 0.12 * k, recover: 0.28 * k, reach: sw.reach + 6, back: 8, lo: 0, hi: 68, dmg: 1.7, kb: 380, lift: 260, swing: 'slam' },
    air: { id: 'air', windup: 0.05, active: 0.13, recover: 0.12, reach: sw.reach, back: 10, lo: -16, hi: 60, dmg: 1.2, kb: 170, swing: 'slash' },
    // A shuriken, thrown fast (low when crouching).
    toss: {
      id: 'toss', windup: 0.05, active: 0.05, recover: 0.16, reach: 0, lo: 0, hi: 0, dmg: 0, kb: 0, swing: 'throw',
      spawn: (s, f) => {
        shot(s, f, { kind: 'star', y: f.y + (f.crouch ? 16 : 38) * f.scale, vx: f.face * 640, r: 7, dmg: f.atk * 0.55, life: 1.5, kb: 80 })
        s.events.push('throw')
      },
    },
    // Crouching cut at the ankles: trips foes up.
    sweep: { id: 'sweep', windup: 0.06 * k, active: 0.1 * k, recover: 0.22 * k, reach: sw.reach * 0.95, back: 6, lo: -4, hi: 24, dmg: 0.9, kb: 60, lift: 240, stun: 0.35, swing: 'thrust' },
    // Rising Dragon: an uppercut that hops you up with the foe.
    rise: {
      id: 'rise', windup: 0.07 * k, active: 0.16, recover: 0.28, reach: sw.reach, back: 10, lo: 0, hi: 96, dmg: 1.4, kb: 60, lift: 640, swing: 'up',
      spawn: (s, f) => {
        f.vy = 430
        s.events.push('jump')
      },
    },
    // Falling Star: dive straight down; a shockwave where you land.
    plunge: {
      id: 'plunge', windup: 0.06, active: 1.2, recover: 0.22, reach: sw.reach * 0.7, back: 24, lo: -34, hi: 44, dmg: 1.6, kb: 220, armor: true, swing: 'slam',
      tick: (s, f) => {
        f.vx *= 0.9
        f.vy = -1150
        if (f.y <= f.gy + 0.5 && f.seg !== 99) {
          f.seg = 99
          for (const d of [-1, 1]) shot(s, f, { kind: 'shock', x: f.x + d * 26, y: 0, vx: d * 400, r: 15, dmg: f.atk * 1.2, pierce: true, life: 0.7, kb: 220 })
          s.shake = Math.max(s.shake, 0.3)
          s.events.push('slam')
          f.moveT = f.move!.windup + f.move!.active
        }
      },
    },
    sp,
  }
}

// ─── Setup ─────────────────────────────────────────────────────────────

function fighter(s: Sim, kind: Fighter['kind'], team: 0 | 1, x: number, hp: number, atk: number, speed: number, scale: number): Fighter {
  return {
    uid: s.nextUid++, kind, team, x, y: 0, vx: 0, vy: 0, face: 1, hp, maxHp: hp, atk, speed, scale,
    move: null, moveT: 0, fired: false, seg: -1, hitIds: [], combo: 0, comboQueued: false, blockT: -1, hurtT: 0, stunT: 0, inv: 0,
    dashT: 0, dashCd: 0, jumps: 0, burnT: 0, burnDps: 0, cd: 0.8, intent: 0, sawMove: -1, dead: false, deadT: 0, flash: 0, enraged: false, fly: 0, age: 0,
    chillT: 0, markT: 0, airT: 0, crouch: false, gy: 0, wall: 0, wallLock: 0, aware: true, px0: -Infinity, px1: Infinity,
  }
}

export function spawnFoe(s: Sim, kind: FoeKind, x: number, elite = false): Fighter {
  const d = FOES[kind]
  const hpMul = (d.boss ? 1 + (s.stage.power - 1) * 0.4 : s.stage.power) * (elite ? 2.2 : 1)
  const f = fighter(s, kind, 1, x, Math.round(d.hp * hpMul), d.atk * (1 + (s.stage.power - 1) * 0.8) * (elite ? 1.3 : 1), d.speed * (elite ? 1.1 : 1), d.scale * (elite ? 1.12 : 1))
  f.elite = elite
  f.face = x > s.hero.x ? -1 : 1
  f.fly = d.fly ?? 0
  f.y = f.fly
  f.cd = 0.6 + s.rng() * 0.8
  s.foes.push(f)
  return f
}

function spawnWave(s: Sim) {
  const kinds = s.stage.waves[s.wave] ?? []
  const elites = s.stage.elites?.[s.wave] ?? []
  kinds.forEach((k, i) => {
    const right = i % 2 === 0 ? s.hero.x < ARENA / 2 : s.hero.x >= ARENA / 2
    const x = right ? ARENA - 30 - Math.floor(i / 2) * 50 : 30 + Math.floor(i / 2) * 50
    const f = spawnFoe(s, k, x, elites.includes(i) && !FOES[k].boss)
    if (FOES[k].boss) {
      s.boss = f
      s.banner = { text: FOES[k].name, sub: FOES[k].jp, t: 2.4 }
      s.events.push('boss')
    }
  })
  if (!s.boss || s.boss.dead) {
    const total = s.stage.waves.length
    const where = s.stage.abyss !== undefined && s.wave === 0 ? `Abyss floor ${s.stage.abyss + 1}` : undefined
    s.banner = { text: total > 1 ? `Wave ${s.wave + 1} / ${total}` : 'Fight!', sub: where ?? (s.wave === 0 && s.stage.mod ? `${MOD_INFO[s.stage.mod].icon} ${MOD_INFO[s.stage.mod].name}` : undefined), t: 1.4 }
  }
}

const NO_ARTS: Arts = { rank: () => 0 }

export function createSim(stage: Stage, level: number, sword: SwordDef, rng: () => number = Math.random, load: Loadout = {}): Sim {
  const st = heroStats(level)
  const armor = load.armor ?? ARMOR_BY_ID.gi
  const arts = load.arts ?? NO_ARTS
  const s = {
    t: 0, stage, wave: 0, foes: [], shots: [], fx: [], sword, heroMoves: heroMovesFor(sword, arts), meter: 0, hitstop: 0, shake: 0, kills: 0, xp: 0, ryo: 0, chain: 0, chainT: 0, bestChain: 0,
    outcome: null, outcomeT: 0, banner: null, boss: null, rng, nextUid: 1, moveSerial: 0, events: [],
    armor, arts, meterMul: 1 + 0.1 * arts.rank('up:focus') + (armor.perk === 'focus' ? 0.25 : 0), spMul: 1 + 0.15 * arts.rank('up:power'),
    barrier: 0, barrierT: 0, bufAtk: 0, bufJump: 0, slowT: 0, props: [], drops: [], found: [], have: load.have ?? [], flashT: 0, stars: MAX_STARS, starT: 0,
    width: stage.lv?.width ?? ARENA, lv: stage.lv ?? null, checkpoint: stage.lv ? { ...stage.lv.start } : { x: ARENA / 2, y: 0 }, saved: 0, gems: 0, falls: 0,
  } as unknown as Sim
  W = s.width
  s.hero = fighter(s, 'hero', 0, ARENA / 2, st.hp + armor.hp, sword.dmg * st.atkMul, RUN * (armor.perk === 'swift' ? 1.15 : 1), 1)
  s.meter = Math.min(100, 15 * arts.rank('up:surge'))
  if (s.lv) setupTrial(s, s.lv)
  else {
    placeProps(s)
    spawnWave(s)
  }
  return s
}

/** Shadow Trials: the hero at the start, foes on their platforms, cages, coins and diamonds in place. */
function setupTrial(s: Sim, lv: Level) {
  s.hero.x = lv.start.x
  s.hero.y = lv.start.y
  s.hero.gy = lv.start.y
  for (const f of lv.foes) {
    const e = spawnFoe(s, f.kind, f.x, f.elite)
    e.y = f.y + (FOES[f.kind].fly ?? 0)
    e.gy = f.y
    e.aware = false
    e.px0 = f.px0
    e.px1 = f.px1
    e.face = s.rng() < 0.5 ? 1 : -1
  }
  for (const c of lv.cages) s.props.push({ uid: s.nextUid++, kind: 'cage', x: c.x, y: c.y, hp: 2, broken: false, shake: 0, lastHit: -1 })
  for (const c of lv.coins) s.drops.push({ kind: 'coin', x: c.x, y: c.y, vx: 0, vy: 0, value: Math.max(2, Math.round(2 * s.stage.power)), age: 1, taken: false, placed: true })
  for (const c of lv.gems) s.drops.push({ kind: 'gem', x: c.x, y: c.y, vx: 0, vy: 0, value: 1, age: 1, taken: false, placed: true })
  s.banner = { text: 'Reach the gate!', sub: `⛩️ ${lv.cages.length} hostage${lv.cages.length === 1 ? '' : 's'} to free · 💎 3 diamonds`, t: 2.4 }
}

// ─── Terrain (Shadow Trials) ───────────────────────────────────────────

/** The highest ground at x that a fighter at height `fromY` would land on (or -Infinity over a pit). */
export function groundAt(lv: Level, x: number, fromY: number): number {
  let g = -Infinity
  for (const sd of lv.solids) if (x >= sd.x && x <= sd.x + sd.w && sd.top <= fromY + 1 && sd.top > g) g = sd.top
  return g
}

/** Solid walls the body runs into (one-way platforms never block sideways). */
function blockSide(lv: Level, f: Fighter, nx: number): number {
  const R = 9 * f.scale
  f.wall = 0
  for (const sd of lv.solids as Solid[]) {
    if (sd.oneWay || f.y >= sd.top - 1) continue
    if (f.x + R <= sd.x + 0.5 && nx + R > sd.x) {
      nx = sd.x - R
      f.wall = 1
    } else if (f.x - R >= sd.x + sd.w - 0.5 && nx - R < sd.x + sd.w) {
      nx = sd.x + sd.w + R
      f.wall = -1
    }
  }
  return nx
}

/** Urns scattered about the arena, and a chest in a far corner if the stage hides one. */
function placeProps(s: Sim) {
  const r = (i: number) => ((Math.sin((s.stage.index + 1) * 12.9898 + i * 78.233) * 43758.5453) % 1 + 1) % 1
  for (let i = 0; i < s.stage.urns; i++) {
    const x = 60 + r(i) * (ARENA - 120)
    if (Math.abs(x - ARENA / 2) < 60) continue
    s.props.push({ uid: s.nextUid++, kind: 'urn', x, y: 0, hp: 1, broken: false, shake: 0, lastHit: -1 })
  }
  const g = s.stage.chest
  if (g && !s.have.includes(g)) s.props.push({ uid: s.nextUid++, kind: 'chest', x: s.stage.index % 2 ? 44 : ARENA - 44, y: 0, hp: 3, gear: g, broken: false, shake: 0, lastHit: -1 })
}

// ─── Combat ────────────────────────────────────────────────────────────

const clampX = (x: number) => Math.max(20, Math.min(W - 20, x))

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
  /** From the hero's special: gets the Ink Arts (element, Might). */
  sp?: boolean
  /** A chained hit (thunder arcs, thorns): never chains again. */
  chain?: boolean
}

const facesToward = (t: Fighter, x: number) => (x >= t.x ? 1 : -1) === t.face

const text = (s: Sim, x: number, y: number, txt: string, color: string, size = 12) => s.fx.push({ kind: 'text', x, y, vx: 0, vy: 40, life: 0.8, max: 0.8, color, size, text: txt })

/** Meter for the hero, scaled by Focus. */
const gain = (s: Sim, n: number) => (s.meter = Math.min(100, s.meter + n * s.meterMul))

export function hit(s: Sim, src: Fighter | null, t: Fighter, dmg: number, opts: HitOpts): 'hit' | 'block' | 'parry' | 'none' {
  if (t.dead || t.inv > 0) return 'none'
  const o = { ...opts }
  const sx = src ? src.x : t.x - (o.dir ?? 1)
  const dir = o.dir ?? (t.x >= sx ? 1 : -1)
  const hx = t.x
  const hy = t.y + 40 * t.scale
  // The hero's special, with its element.
  if (o.sp && t.team === 1) {
    dmg *= s.spMul
    const el = s.arts.element
    if (el === 'fire') o.burn = Math.max(o.burn ?? 0, 4)
    else if (el === 'frost') {
      o.stun = Math.max(o.stun ?? 0, 1.2)
      t.chillT = 4
    } else if (el === 'wind') o.kb *= 1.5
    else if (el === 'shadow') {
      o.lifesteal = Math.max(o.lifesteal ?? 0, 0.2)
      t.markT = 5
    }
  }
  if (t.markT > 0) dmg *= 1.25
  // Shadow Trials: a foe that hasn't seen you yet is cut down from the shadows.
  if (s.lv && t.team === 1) {
    if (!t.aware && src?.team === 0 && !FOES[t.kind as FoeKind]?.boss) {
      dmg *= 4
      text(s, t.x, t.y + 90 * t.scale, 'ASSASSINATE!', '#ff5252', 12)
      s.events.push('parry')
    }
    t.aware = true
  }
  if (t.blockT >= 0 && !o.unblockable && facesToward(t, sx)) {
    if (t.blockT < 0.16 && src) {
      src.stunT = FOES[src.kind as FoeKind]?.boss ? 0.6 : 1
      src.move = null
      sparks(s, hx + t.face * 14, hy, '#fff6c0', 14)
      s.fx.push({ kind: 'ring', x: hx + t.face * 14, y: hy, vx: 0, vy: 0, life: 0.3, max: 0.3, color: '#fff6c0', size: 30 })
      text(s, hx, hy + 30, 'PARRY!', '#fff6c0')
      if (t.team === 0) gain(s, 18)
      s.hitstop = 0.1
      s.events.push('parry')
      // Riposte: strike straight back.
      if (t.team === 0 && s.arts.rank('tech:riposte') > 0 && !src.dead) {
        t.face = src.x >= t.x ? 1 : -1
        hit(s, t, src, t.atk * 2, { kb: 300, lift: 120, unblockable: true, chain: true })
        text(s, src.x, src.y + 70 * src.scale, 'RIPOSTE!', '#ffe066', 11)
      }
      return 'parry'
    }
    dmg *= 0.15
    t.vx = dir * o.kb * 0.4
    sparks(s, hx + t.face * 14, hy, '#ffffff', 6)
    s.events.push('block')
    if (dmg < 0.5) return 'block'
  }
  // The hero's armour.
  if (t.team === 0) {
    const a = s.armor
    if (a.perk === 'dodge' && s.rng() < 1 / 6) {
      t.inv = Math.max(t.inv, 0.25)
      text(s, hx, hy + 30, 'MISS', '#b388ff')
      s.events.push('dash')
      return 'none'
    }
    if (a.perk === 'fireward' && o.burn) {
      dmg *= 0.5
      o.burn = undefined
    }
    dmg *= 1 - a.def
    if (src && src.team === 1 && !o.chain) {
      if (a.perk === 'thorns') hit(s, null, src, dmg * 0.25, { kb: 60, dir: -dir, chain: true })
      if (a.perk === 'chill') src.chillT = 3
    }
    if (s.barrier > 0) {
      const soak = Math.min(s.barrier, dmg)
      s.barrier -= soak
      dmg -= soak
      s.fx.push({ kind: 'ring', x: hx, y: hy, vx: 0, vy: 0, life: 0.25, max: 0.25, color: '#4dd0e1', size: 26 })
      if (dmg < 0.5) {
        s.events.push('block')
        return 'block'
      }
    }
  }
  dmg = Math.max(1, Math.round(dmg))
  t.hp -= dmg
  t.flash = 0.12
  if (o.burn) {
    t.burnT = o.burn
    t.burnDps = Math.max(t.burnDps, dmg * 0.15)
  }
  if (o.stun) t.stunT = Math.max(t.stunT, o.stun)
  const d = FOES[t.kind as FoeKind]
  const armored = t.move?.armor || (d?.boss && !d.nimble && dmg < t.maxHp * 0.08)
  if (!armored || t.hp <= 0) {
    t.vx = dir * o.kb
    if (o.lift) t.vy = o.lift
    t.hurtT = t.team === 0 ? 0.3 : 0.28
    if (t.move && !t.move.armor) t.move = null
    t.blockT = -1
  }
  if (t.team === 0) {
    t.inv = 0.45
    gain(s, 5)
    s.chain = 0
    s.shake = Math.max(s.shake, 0.25)
    s.events.push('hurt')
  } else {
    gain(s, src?.move?.id === 's3' ? 10 : 6)
    s.chain++
    s.chainT = 2
    s.bestChain = Math.max(s.bestChain, s.chain)
    s.events.push('hit')
    const steal = o.lifesteal ?? (src?.move?.drain ? src.move.drain : s.sword.lifesteal)
    if (steal) {
      const heal = Math.round(dmg * steal)
      s.hero.hp = Math.min(s.hero.maxHp, s.hero.hp + heal)
    }
    // Thunder: the special's hits arc to two more foes.
    if (o.sp && s.arts.element === 'thunder' && !o.chain) {
      const near = s.foes.filter((e) => e !== t && !e.dead && Math.abs(e.x - t.x) < 240).sort((a, b) => Math.abs(a.x - t.x) - Math.abs(b.x - t.x)).slice(0, 2)
      for (const e of near) {
        s.fx.push({ kind: 'bolt', x: e.x, y: e.y + 40 * e.scale, vx: 0, vy: 0, life: 0.3, max: 0.3, color: '#ffe066', size: 1 })
        hit(s, src, e, dmg * 0.4, { kb: 80, stun: 0.6, unblockable: true, chain: true })
      }
    }
  }
  s.hitstop = Math.max(s.hitstop, dmg > 30 ? 0.09 : 0.05)
  inkBurst(s, hx, hy, t.team === 0 ? '#c0392b' : o.sp && s.arts.element ? ART_BY_ID[`el:${s.arts.element}`].color : '#1a1a1a', 6)
  sparks(s, hx, hy, '#ffffff', 5)
  s.fx.push({ kind: 'text', x: hx + (s.rng() - 0.5) * 16, y: hy + 26 * t.scale, vx: (s.rng() - 0.5) * 30, vy: 70, life: 0.7, max: 0.7, color: t.team === 0 ? '#ff6b6b' : o.sp ? '#ffe066' : '#ffffff', size: dmg >= 40 ? 15 : 11, text: String(dmg) })
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
    const rich = t.elite ? 2.5 : 1
    s.kills++
    s.xp += Math.round(d.xp * s.stage.power * rich)
    s.ryo += Math.round(d.ryo * s.stage.power * rich)
    s.events.push(d.boss ? 'bossDown' : 'kill')
    if (t.elite) drop(s, 'ink', t.x, 30)
    if (d.boss) {
      s.shake = 0.6
      s.slowT = 0.9
      s.flashT = 0.3
      for (const e of s.foes) if (!e.dead && e !== t) kill(s, e, e.x >= t.x ? 1 : -1)
      const g = s.stage.bossDrop
      if (g && !s.have.includes(g) && !s.found.includes(g)) drop(s, 'gear', t.x, 0, g)
    }
  } else s.events.push('dead')
}

function checkHits(s: Sim, f: Fighter) {
  const m = f.move!
  if (f.team === 0) hitProps(s, f.x, f.face, m.reach * f.scale, (m.back ?? 0) * f.scale, f.y + m.lo, s.moveSerial * 100 + Math.max(0, f.seg))
  const targets = f.team === 0 ? s.foes : [s.hero]
  for (const t of targets) {
    if (t.dead || f.hitIds.includes(t.uid)) continue
    const rel = (t.x - f.x) * f.face
    const w = 12 * t.scale
    if (rel + w < -(m.back ?? 0) * f.scale || rel - w > m.reach * f.scale) continue
    const lo = f.y + m.lo * f.scale
    const hi = f.y + m.hi * f.scale
    if (hi < t.y || lo > t.y + bodyH(t)) continue
    f.hitIds.push(t.uid)
    hit(s, f, t, f.atk * m.dmg, { kb: m.kb, lift: m.lift, unblockable: m.unblockable, stun: m.stun, burn: f.team === 0 && s.sword.burn ? 3 : undefined, dir: f.face, sp: f.team === 0 && m.id === 'sp' })
  }
}

// ─── Urns, chests and pick-ups ─────────────────────────────────────────

function drop(s: Sim, kind: Drop['kind'], x: number, value: number, gear?: GearId, y = 0) {
  s.drops.push({ kind, x, y: y + 20, vx: (s.rng() - 0.5) * 160, vy: 260 + s.rng() * 120, value, gear, age: 0, taken: false })
}

/** A swing (or the hero's shot) knocks any urn or chest in its band. */
function hitProps(s: Sim, x: number, face: number, reach: number, back: number, lo: number, serial: number) {
  for (const p of s.props) {
    if (p.broken || p.lastHit === serial) continue
    if (lo > p.y + 40 || lo + 80 < p.y) continue
    const rel = (p.x - x) * face
    if (rel + 12 < -back || rel - 12 > reach) continue
    p.lastHit = serial
    p.hp--
    p.shake = 0.25
    sparks(s, p.x, p.y + 16, p.kind === 'urn' ? '#e0b080' : '#ffd54f', 6)
    if (p.hp > 0) {
      s.events.push('block')
      continue
    }
    p.broken = true
    s.events.push(p.kind === 'urn' ? 'urn' : 'chest')
    inkBurst(s, p.x, p.y + 14, p.kind === 'chest' ? '#b71c1c' : p.kind === 'cage' ? '#6d4c2b' : '#a0643c', 10)
    const worth = Math.max(2, Math.round(3 * s.stage.power))
    if (p.kind === 'cage') {
      // a hostage freed
      s.saved++
      text(s, p.x, p.y + 60, 'Saved!', '#7CFC9A', 13)
      s.xp += Math.round(15 * s.stage.power)
      drop(s, 'heal', p.x, 0.15, undefined, p.y)
      continue
    }
    if (p.kind === 'chest') {
      if (p.gear) drop(s, 'gear', p.x, 0, p.gear, p.y)
      for (let i = 0; i < 6; i++) drop(s, 'coin', p.x, worth * 2, undefined, p.y)
      continue
    }
    const roll = s.rng()
    if (roll < 0.55) for (let i = 0; i < 3 + Math.floor(s.rng() * 3); i++) drop(s, 'coin', p.x, worth, undefined, p.y)
    else if (roll < 0.8) drop(s, 'heal', p.x, 0.15, undefined, p.y)
    else drop(s, 'ink', p.x, 30, undefined, p.y)
  }
}

function collect(s: Sim, d: Drop) {
  d.taken = true
  const h = s.hero
  if (d.kind === 'coin') {
    s.ryo += d.value
    s.events.push('coin')
  } else if (d.kind === 'heal') {
    const n = Math.round(h.maxHp * d.value)
    h.hp = Math.min(h.maxHp, h.hp + n)
    text(s, h.x, h.y + 80, `+${n}`, '#7CFC9A')
    s.events.push('heal')
  } else if (d.kind === 'ink') {
    gain(s, d.value)
    text(s, h.x, h.y + 80, 'INK!', '#64b5f6')
    s.events.push('heal')
  } else if (d.kind === 'gem') {
    s.gems++
    s.banner = { text: `Diamond ${s.gems}/3`, sub: '💎', t: 1.4 }
    s.events.push('gear')
  } else if (d.gear && !s.found.includes(d.gear)) {
    s.found.push(d.gear)
    s.banner = { text: `Found: ${gearName(d.gear)}!`, sub: 'みつけた！', t: 2.6 }
    s.flashT = 0.25
    s.events.push('gear')
  }
}

function updateDrops(s: Sim, dt: number) {
  const h = s.hero
  for (const p of s.props) p.shake = Math.max(0, p.shake - dt)
  for (const d of s.drops) {
    if (d.taken) continue
    d.age += dt
    const dx = h.x - d.x
    const dy = h.y + 30 - d.y
    // Close to the hero (or once the fight is won), pick-ups fly to you. Coins and
    // diamonds placed in a level hang where they are until you're right by them.
    const near = d.placed ? Math.abs(dx) < 34 && Math.abs(dy) < 56 : Math.abs(dx) < 70 || (s.outcome === 'win' && !s.lv)
    if (d.age > 0.45 && near) {
      d.placed = false
      d.vx += Math.sign(dx) * 1600 * dt
      d.vx *= 0.92
      d.vy += (dy * 6 - d.vy) * Math.min(1, dt * 6)
    } else if (d.placed) {
      continue
    } else {
      d.vy -= GRAV * 0.7 * dt
      d.vx *= Math.pow(0.15, dt)
    }
    const prevY = d.y
    d.x = clampX(d.x + d.vx * dt)
    d.y += d.vy * dt
    const floor = s.lv ? groundAt(s.lv, d.x, prevY) : 0
    if (d.y <= floor) {
      d.y = floor
      d.vy = Math.abs(d.vy) > 120 ? -d.vy * 0.35 : 0
    }
    // (lost down a pit)
    if (d.y < -150) d.taken = true
    if (d.age > 0.45 && Math.abs(dx) < 20 && Math.abs(h.y + 30 - d.y) < 50) collect(s, d)
  }
  s.drops = s.drops.filter((d) => !d.taken)
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
    else if (f.team === 0 && (f.comboQueued || s.bufAtk > 0) && (m.id === 's1' || m.id === 's2')) {
      s.bufAtk = 0
      f.comboQueued = false
      startMove(s, f, s.heroMoves[m.id === 's1' ? 's2' : 's3'])
    } else f.comboQueued = false
    if (m.id === 'swoop') f.fly = FOES[f.kind as FoeKind]?.fly ?? 0
  }
}

// ─── Control and AI ────────────────────────────────────────────────────

/** Unleash the special: the sword's move, plus whatever the Ink Arts add. */
function unleash(s: Sim) {
  const h = s.hero
  const arts = s.arts
  s.meter = 0
  h.dashT = 0
  startMove(s, h, s.heroMoves.sp)
  const el = arts.element ? ART_BY_ID[`el:${arts.element}`] : undefined
  s.banner = { text: s.sword.specialName, sub: el ? `${el.icon} ${el.name}` : undefined, t: 0.9 }
  s.flashT = Math.max(s.flashT, 0.12)
  s.events.push('special')
  const mend = arts.rank('up:mend')
  if (mend) {
    const n = Math.round(h.maxHp * 0.04 * mend)
    h.hp = Math.min(h.maxHp, h.hp + n)
    text(s, h.x, h.y + 86, `+${n}`, '#7CFC9A')
  }
  const bar = arts.rank('up:barrier')
  if (bar) {
    s.barrier = h.maxHp * 0.07 * bar
    s.barrierT = 6
  }
  if (arts.element === 'fire') {
    // A burst of flame around you.
    s.fx.push({ kind: 'ring', x: h.x, y: h.y + 30, vx: 0, vy: 0, life: 0.4, max: 0.4, color: '#ff7043', size: 90 })
    for (const e of s.foes) if (!e.dead && Math.abs(e.x - h.x) < 100) hit(s, h, e, h.atk * 1.5, { kb: 260, lift: 160, sp: true })
  } else if (arts.element === 'wind') {
    // Drag foes in first.
    for (const e of s.foes) if (!e.dead && Math.abs(e.x - h.x) < 320) e.vx = Math.sign(h.x - e.x) * 520
  }
}

function heroControl(s: Sim, inp: Input, dt: number) {
  const h = s.hero
  h.dashCd -= dt
  s.bufAtk = inp.attack ? 0.16 : Math.max(0, s.bufAtk - dt)
  s.bufJump = inp.jump ? 0.14 : Math.max(0, s.bufJump - dt)
  if (h.dead || h.stunT > 0 || h.hurtT > 0) {
    h.blockT = -1
    h.crouch = false
    return
  }
  const grounded = h.y <= h.gy + 0.5
  // Ducking: holding down on the ground (kept through a crouching attack or throw).
  const ducking = grounded && inp.down && h.dashT <= 0
  h.crouch = ducking && (!h.move || h.move.id === 'sweep' || h.move.id === 'toss')
  if (grounded) {
    h.jumps = 0
    h.airT = 0
  } else h.airT += dt
  if (inp.special && s.meter >= 100) {
    unleash(s)
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
    h.dashCd = s.armor.perk === 'swift' ? 0.38 : 0.55
    h.blockT = -1
    h.hitIds = []
    s.events.push('dash')
    return
  }
  // Shuriken: thrown straight away, even mid-air or crouched.
  if (inp.throw && (!m || inRecovery) && h.dashT <= 0 && !m?.inv) {
    if (s.stars >= 1) {
      if (inp.left !== inp.right) h.face = inp.left ? -1 : 1
      s.stars--
      h.blockT = -1
      startMove(s, h, s.heroMoves.toss)
      return
    }
    s.events.push('empty')
  }
  // Passing Cut: the dash cuts what it passes through.
  if (h.dashT > 0 && s.arts.rank('tech:dashcut') > 0) {
    for (const e of s.foes) {
      if (e.dead || h.hitIds.includes(e.uid) || Math.abs(e.x - h.x) > 26 * e.scale || e.y > h.y + 60) continue
      h.hitIds.push(e.uid)
      hit(s, h, e, h.atk * 0.9, { kb: 90, dir: h.face })
    }
  }
  const wantAtk = s.bufAtk > 0 || inp.attackHeld
  if (wantAtk) {
    if (!m && h.dashT <= 0) {
      if (inp.left) h.face = -1
      else if (inp.right) h.face = 1
      s.bufAtk = 0
      const low = inp.down && grounded
      const mv = low ? (s.arts.rank('tech:rising') ? s.heroMoves.rise : s.heroMoves.sweep) : inp.down && !grounded && s.arts.rank('tech:plunge') ? s.heroMoves.plunge : grounded ? s.heroMoves.s1 : s.heroMoves.air
      startMove(s, h, mv)
    } else if (m && (m.id === 's1' || m.id === 's2') && h.moveT >= m.windup * 0.5) {
      h.comboQueued = true
      s.bufAtk = 0
    }
  }
  if (h.move || h.dashT > 0) return
  if (inp.block && grounded) {
    if (h.blockT < 0) {
      // Raising the guard turns you toward the nearest foe, so it covers the attack that's coming.
      const near = s.foes.filter((e) => !e.dead).sort((a, b) => Math.abs(a.x - h.x) - Math.abs(b.x - h.x))[0]
      if (near) h.face = near.x >= h.x ? 1 : -1
    }
    // Left/right while guarding turns without moving.
    if (inp.left !== inp.right) h.face = inp.left ? -1 : 1
    h.blockT = h.blockT < 0 ? 0 : h.blockT + dt
    h.vx = 0
    return
  }
  h.blockT = -1
  if (h.crouch) {
    // Crouched: no walking, but left/right turns.
    if (inp.left !== inp.right) h.face = inp.left ? -1 : 1
    h.vx = 0
    if (s.bufJump > 0) h.crouch = false
    else return
  }
  const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0)
  h.wallLock = Math.max(0, h.wallLock - dt)
  if (h.wallLock <= 0) {
    h.vx = dir * h.speed
    if (dir) h.face = dir as 1 | -1
  }
  // Wall-jump: kick off a wall you're pressed against in mid-air (and get your air jump back).
  if (s.bufJump > 0 && s.lv && !grounded && h.wall && dir === h.wall) {
    h.vy = JUMP * 0.95
    h.vx = -h.wall * 380
    h.face = -h.wall as 1 | -1
    h.wallLock = 0.16
    h.jumps = 0
    h.airT = 1
    s.bufJump = 0
    s.events.push('jump')
    return
  }
  if (s.bufJump > 0) {
    // A little grace after running off the ground still counts as a ground jump.
    const fromGround = grounded || (h.airT < 0.1 && h.jumps === 0 && h.vy <= 0)
    const airJumps = s.armor.perk === 'air' ? 2 : 1
    if (fromGround || h.jumps < airJumps) {
      if (!fromGround) h.jumps++
      else h.airT = 1
      h.vy = JUMP * (fromGround ? 1 : 0.85)
      s.bufJump = 0
      s.events.push('jump')
    }
  }
}

function think(s: Sim, f: Fighter, dt: number) {
  const d = FOES[f.kind as FoeKind]
  const h = s.hero
  if (f.dead || f.move || f.hurtT > 0 || f.stunT > 0) return
  if (s.lv) {
    const adx = Math.abs(h.x - f.x)
    const ady = Math.abs(h.y - f.y)
    // far away: asleep until the hero comes near
    if (adx > 560) {
      f.intent = 0
      return
    }
    if (!f.aware) {
      const sees = !h.dead && ((Math.sign(h.x - f.x) === f.face && adx < 230 && ady < 80) || (adx < 30 && ady < 50))
      if (!sees) {
        // patrol its platform, slowly
        if (f.x <= f.px0 + 3) f.face = 1
        else if (f.x >= f.px1 - 3) f.face = -1
        f.intent = f.face * 0.4
        return
      }
      f.aware = true
      f.cd = Math.max(f.cd, 0.45)
      text(s, f.x, f.y + 80 * f.scale, '!', '#ffeb3b', 16)
      s.events.push('spot')
    }
  }
  f.cd -= dt * (f.enraged ? 1.4 : 1) * (f.chillT > 0 ? 0.5 : 1)
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
    if (f.kind === 'shogun') for (const side of [-1, 1]) spawnFoe(s, 'bandit', side < 0 ? 30 : W - 30)
    if (f.kind === 'oni') for (const side of [-1, 1]) spawnFoe(s, 'bandit', side < 0 ? 30 : W - 30)
    if (f.kind === 'kappaking') for (const side of [-1, 1]) spawnFoe(s, 'kappa', side < 0 ? 30 : W - 30)
    if (f.kind === 'gasha') for (const side of [-1, 1]) spawnFoe(s, 'yurei', clampX(h.x + side * 220))
    if (f.kind === 'frost') for (const side of [-1, 1]) spawnFoe(s, 'samurai', side < 0 ? 30 : W - 30)
    if (f.kind === 'storm') for (const side of [-1, 1]) spawnFoe(s, 'archer', side < 0 ? 30 : W - 30)
    if (f.kind === 'quiet') for (const side of [-1, 1, -1, 1]) spawnFoe(s, 'shade', clampX(h.x + side * (180 + s.rng() * 120)))
  }
}

function physics(s: Sim, f: Fighter, dt: number) {
  f.age += dt
  f.flash = Math.max(0, f.flash - dt)
  f.inv = Math.max(0, f.inv - dt)
  f.hurtT = Math.max(0, f.hurtT - dt)
  f.stunT = Math.max(0, f.stunT - dt)
  f.dashT = Math.max(0, f.dashT - dt)
  f.chillT = Math.max(0, f.chillT - dt)
  f.markT = Math.max(0, f.markT - dt)
  if (f.team === 0 && s.armor.perk === 'regen' && !f.dead && !s.outcome) f.hp = Math.min(f.maxHp, f.hp + dt * (1 + f.maxHp * 0.008))
  if (f.burnT > 0 && !f.dead) {
    f.burnT -= dt
    f.hp -= f.burnDps * dt
    if (s.rng() < dt * 14) s.fx.push({ kind: 'ember', x: f.x + (s.rng() - 0.5) * 16, y: f.y + s.rng() * 50 * f.scale, vx: 0, vy: 60, life: 0.5, max: 0.5, color: '#ff8a3d', size: 3 })
    if (f.hp <= 0) kill(s, f, f.face === 1 ? -1 : 1)
  }
  if (f.dead) f.deadT += dt
  const flying = f.fly > 0 && !f.dead && f.stunT <= 0
  const lv = s.lv
  if (flying) {
    f.vy = (f.gy + f.fly + Math.sin(f.age * 2) * 10 - f.y) * 4
  } else f.vy -= GRAV * dt
  const prevY = f.y
  f.y += f.vy * dt
  if (lv) {
    // land on whatever is under the feet (one-way platforms only from above)
    const g = groundAt(lv, f.x, prevY)
    if (f.vy <= 0 && f.y <= g) {
      f.y = g
      f.vy = 0
    }
    if (!flying) f.gy = g
    // wall sliding: falling slowly while pressed against a wall
    if (f.team === 0 && f.wall && f.y > f.gy + 1 && f.vy < -150 && !f.move) f.vy = -150
  } else if (f.y <= 0) {
    f.y = 0
    if (f.vy < 0) f.vy = 0
  }
  // Walking, or sliding to a stop.
  if (f.team === 1 && !f.dead && !f.move && f.hurtT <= 0 && f.stunT <= 0 && f.blockT < 0) {
    const target = f.intent * f.speed * (f.chillT > 0 ? 0.5 : 1)
    f.vx += (target - f.vx) * Math.min(1, dt * 10)
  } else if (f.team === 0 && (f.hurtT > 0 || f.stunT > 0 || f.dead || (f.move && !f.move.dash))) {
    f.vx *= f.y > f.gy ? 0.99 : Math.pow(0.002, dt)
  } else if (f.team === 1 && (f.hurtT > 0 || f.dead || f.stunT > 0 || (f.move && !f.move.dash))) {
    f.vx *= f.y > f.gy ? 0.99 : Math.pow(0.002, dt)
  }
  let nx = f.x + f.vx * dt
  if (lv) {
    nx = blockSide(lv, f, nx)
    // foes keep to their own platform
    if (f.team === 1 && !f.dead && f.hurtT <= 0) nx = Math.max(f.px0, Math.min(f.px1, nx))
  }
  f.x = clampX(nx)
}

function updateShots(s: Sim, dt: number) {
  for (const sh of s.shots) {
    sh.age += dt
    // Telegraphed shots wait (their warning is drawn) before going live.
    if (sh.delay && sh.age < sh.delay) continue
    if (sh.grav) sh.vy -= sh.grav * dt
    if (sh.homing) {
      const targets = (sh.team === 0 ? s.foes : [s.hero]).filter((t) => !t.dead && !sh.hit.includes(t.uid))
      const t = targets.sort((a, b) => Math.abs(a.x - sh.x) - Math.abs(b.x - sh.x))[0]
      if (t) {
        const ty = t.y + bodyH(t) / 2
        const sp = Math.hypot(sh.vx, sh.vy) || 200
        const want = Math.atan2(ty - sh.y, t.x - sh.x)
        const cur = Math.atan2(sh.vy, sh.vx)
        let d = want - cur
        while (d > Math.PI) d -= Math.PI * 2
        while (d < -Math.PI) d += Math.PI * 2
        const a = cur + Math.max(-sh.homing * dt, Math.min(sh.homing * dt, d))
        const v = Math.min(sp + 200 * dt, sh.team === 0 ? 520 : 220)
        sh.vx = Math.cos(a) * v
        sh.vy = Math.sin(a) * v
      }
    }
    sh.x += sh.vx * dt
    sh.y += sh.vy * dt
    if (sh.grav && sh.y <= (s.lv ? groundAt(s.lv, sh.x, sh.y + 20) : 0)) sh.life = 0
    if (sh.rehit) {
      sh.rehitT = (sh.rehitT ?? 0) + dt
      if (sh.rehitT >= sh.rehit) {
        sh.rehitT = 0
        sh.hit = []
      }
    }
    if (sh.pull) for (const e of s.foes) if (!e.dead && Math.abs(e.x - sh.x) < sh.pull && !FOES[e.kind as FoeKind].boss) e.vx += Math.sign(sh.x - e.x) * 900 * dt
    if (sh.kind === 'fire' && s.rng() < dt * 40) s.fx.push({ kind: 'ember', x: sh.x + (s.rng() - 0.5) * sh.r, y: sh.y + s.rng() * sh.r * 1.5, vx: 0, vy: 90, life: 0.5, max: 0.5, color: '#ffb74d', size: 4 })
    if (sh.team === 0) hitProps(s, sh.x - sh.r, 1, sh.r * 2, 0, sh.y - sh.r, 5e6 + s.shots.indexOf(sh))
    const ground = sh.kind === 'shock' || sh.kind === 'fire' || sh.kind === 'ice' || sh.kind === 'geyser' || sh.kind === 'bolt' || sh.kind === 'tornado'
    const tall = sh.kind === 'geyser' || sh.kind === 'bolt' || sh.kind === 'tornado'
    const targets = sh.team === 0 ? s.foes : [s.hero]
    for (const t of targets) {
      if (t.dead || sh.hit.includes(t.uid)) continue
      const cy = t.y + bodyH(t) / 2
      const near = Math.abs(t.x - sh.x) < sh.r + 12 * t.scale
      const level = tall ? t.y < 110 : Math.abs(cy - (sh.y + (ground ? 10 : 0))) < sh.r + bodyH(t) / 2
      if (near && level) {
        sh.hit.push(t.uid)
        const r = hit(s, null, t, sh.dmg, { kb: sh.kb, lift: sh.lift, dir: Math.sign(sh.vx) || (t.x >= sh.x ? 1 : -1), unblockable: sh.unblockable, burn: sh.burn, stun: sh.stun, lifesteal: sh.lifesteal, sp: sh.sp })
        if (sh.kind === 'ice' && r === 'hit') t.chillT = Math.max(t.chillT, 2.5)
        if (!sh.pierce || r === 'parry') sh.life = 0
        if (r === 'parry' && sh.team === 1) {
          // A parried star flies back at its thrower.
          s.shots.push({ ...sh, team: 0, vx: -sh.vx * 1.2, vy: -sh.vy, grav: 0, homing: 0, life: 2, age: 0, hit: [], dmg: sh.dmg * 2 })
        }
      }
    }
  }
  s.shots = s.shots.filter((sh) => sh.age < sh.life && sh.x > -60 && sh.x < W + 60 && sh.y > -200 && sh.y < 600)
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

/** Shadow Trials each frame: pits, spikes and saws, lanterns, and the gate. */
function trialTick(s: Sim, lv: Level) {
  const h = s.hero
  // Falling into a pit: it hurts, and you're back at the last lantern.
  if (h.y < -90 && !h.dead) {
    s.falls++
    const loss = Math.round(h.maxHp * 0.2)
    h.hp -= loss
    if (h.hp <= 0) {
      kill(s, h, 1)
      return
    }
    h.x = s.checkpoint.x
    h.y = s.checkpoint.y + 40
    h.vx = h.vy = 0
    h.inv = 1.2
    h.move = null
    text(s, h.x, h.y + 70, `-${loss}`, '#ff6b6b', 13)
    s.events.push('hurt')
  }
  for (const f of s.foes) if (!f.dead && f.y < -90) kill(s, f, 1)
  // Spikes and saws.
  if (h.inv <= 0 && !h.dead) {
    for (const sp of lv.spikes)
      if (h.x > sp.x - 6 && h.x < sp.x + sp.w + 6 && h.y <= sp.top + 4 && h.y >= sp.top - 8) {
        hit(s, null, h, h.maxHp * 0.12, { kb: 0, lift: 560, unblockable: true, dir: h.face })
        break
      }
    for (const sw of lv.saws) {
      const u = Math.sin(s.t * sw.speed)
      const cx = sw.x + sw.ax * u
      const cy = sw.y + sw.ay * u
      if (Math.hypot(h.x - cx, h.y + bodyH(h) / 2 - cy) < sw.r + 11) {
        hit(s, null, h, h.maxHp * 0.15, { kb: 280, lift: 300, unblockable: true, dir: h.x >= cx ? 1 : -1 })
        break
      }
    }
  }
  // Lanterns: the place you come back to.
  for (const cp of lv.checkpoints)
    if (h.x >= cp.x && s.checkpoint.x < cp.x) {
      s.checkpoint = { x: cp.x, y: cp.y }
      s.banner = { text: 'Checkpoint', sub: '🏮', t: 1.4 }
      s.events.push('heal')
    }
  // The gate.
  if (h.x >= lv.exit && !h.dead) {
    s.outcome = 'win'
    s.banner = { text: 'Trial clear!', sub: `💎 ${s.gems}/3 · ⛓️ ${s.saved}/${lv.cages.length}`, t: 3 }
    s.events.push('win')
  }
}

/**
 * Advance the fight by dt seconds. Returns false while frozen in hit-stop,
 * when the input was not read (so keep edge presses for the next frame).
 */
export function step(s: Sim, inp: Input, dt: number): boolean {
  s.flashT = Math.max(0, s.flashT - dt)
  if (s.slowT > 0) {
    s.slowT -= dt
    dt *= 0.35
  }
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
  if (s.barrierT > 0) {
    s.barrierT -= dt
    if (s.barrierT <= 0) s.barrier = 0
  }
  if (s.stars < MAX_STARS) {
    s.starT += dt
    if (s.starT >= STAR_REGEN) {
      s.starT = 0
      s.stars++
    }
  } else s.starT = 0
  if (s.outcome) {
    s.outcomeT += dt
    for (const f of [s.hero, ...s.foes]) physics(s, f, dt)
    updateDrops(s, dt)
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
  updateDrops(s, dt)
  updateFx(s, dt)
  s.foes = s.foes.filter((f) => !f.dead || f.deadT < 1.6)
  if (s.hero.dead) {
    s.outcome = 'lose'
    s.banner = { text: 'Defeated…', t: 3 }
    return true
  }
  if (s.lv) {
    trialTick(s, s.lv)
    return true
  }
  if (s.foes.every((f) => f.dead)) {
    if (s.wave + 1 < s.stage.waves.length) {
      s.wave++
      // A breather between waves (not in a gauntlet).
      if (!s.stage.noRest) {
        const heal = Math.round(s.hero.maxHp * 0.15)
        s.hero.hp = Math.min(s.hero.maxHp, s.hero.hp + heal)
        s.fx.push({ kind: 'text', x: s.hero.x, y: s.hero.y + 80, vx: 0, vy: 30, life: 1.2, max: 1.2, color: '#7CFC9A', size: 12, text: `+${heal}` })
      }
      spawnWave(s)
    } else {
      s.outcome = 'win'
      s.banner = { text: s.stage.boss ? 'Boss defeated!' : 'Stage clear!', t: 3 }
      s.events.push('win')
    }
  }
  return true
}

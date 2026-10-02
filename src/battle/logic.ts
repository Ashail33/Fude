/**
 * Pure battle logic: enemy table, stat formulas, question generation and
 * the turn state machine. No React, no store, no DOM — the UI feeds in the
 * player's level / SRS cards and plays back the returned events.
 */
import { toHiragana } from 'wanakana'
import type { EnemySprite } from '../art'
import { atOrBefore, regionRank } from '../data/journey'
import { ELEMENT_SPELLS, type ElementSpell } from '../data/sentences'
import { VOCAB, type Word } from '../data/vocab'
import { item } from '../engine/items'
import { strength, weakness, type SrsCard } from '../engine/srs'
import { ITEM_BY_ID } from './items'
import { PACK_ENEMY_SPRITES } from '../regions/ids'
import { PACK_ENEMY_STATS, PACK_POOLS } from '../regions/battle'

export type Element = ElementSpell['element']
export type Rng = () => number

/** A bilingual line: Japanese first, English for the immersion helper. */
export interface Line {
  jp: string
  en: string
}

// ─── Enemies ────────────────────────────────────────────────────────────

export interface EnemyDef {
  id: EnemySprite
  /** Written name (kanji/kana) and its reading. */
  jp: string
  kana: string
  en: string
  /** Multipliers on the region baseline. */
  hpMul: number
  atkMul: number
  xpMul: number
  weak: Element
  resist?: Element
  /** Home region (for flavour; stats scale with the encounter region). */
  home: number
  attack: Line
  skill?: Line & { mult: number; chance: number }
  idle?: Line & { chance: number }
  /** Item ids this enemy may drop. */
  drops: string[]
}

const CORE_DEFS: Record<CoreEnemy, EnemyDef> = {
  slime: {
    id: 'slime', jp: 'スライム', kana: 'スライム', en: 'Slime', home: 1,
    hpMul: 0.85, atkMul: 0.8, xpMul: 0.8, weak: 'fire', resist: 'water',
    attack: { jp: 'たいあたりしてきた！', en: 'tackles you!' },
    idle: { jp: 'ぷるぷる ふるえている。', en: 'is wobbling.', chance: 0.3 },
    drops: ['herb'],
  },
  bat: {
    id: 'bat', jp: 'おおこうもり', kana: 'おおこうもり', en: 'Giant Bat', home: 1,
    hpMul: 0.8, atkMul: 1, xpMul: 0.9, weak: 'wind', resist: 'earth',
    attack: { jp: 'かみついてきた！', en: 'bites you!' },
    skill: { jp: 'ちょうおんぱを はなった！', en: 'lets out a piercing screech!', mult: 1.3, chance: 0.2 },
    idle: { jp: 'パタパタと とびまわっている。', en: 'is fluttering about.', chance: 0.2 },
    drops: ['herb', 'smoke'],
  },
  mushroom: {
    id: 'mushroom', jp: 'おばけキノコ', kana: 'おばけキノコ', en: 'Spook Shroom', home: 1,
    hpMul: 1.1, atkMul: 0.9, xpMul: 1, weak: 'fire', resist: 'wood',
    attack: { jp: 'ぶつかってきた！', en: 'bumps into you!' },
    skill: { jp: 'あやしい ほうしを まきちらした！', en: 'scatters strange spores!', mult: 1.4, chance: 0.2 },
    drops: ['herb', 'ether'],
  },
  imp: {
    id: 'imp', jp: '小鬼', kana: 'こおに', en: 'Imp', home: 1,
    hpMul: 1, atkMul: 1.15, xpMul: 1.2, weak: 'water', resist: 'fire',
    attack: { jp: 'やりで つついてきた！', en: 'jabs you with its spear!' },
    skill: { jp: '小さな 火の玉を なげた！', en: 'throws a little fireball!', mult: 1.4, chance: 0.2 },
    drops: ['ether', 'smoke'],
  },
  tanuki: {
    id: 'tanuki', jp: '化け狸', kana: 'ばけだぬき', en: 'Trickster Tanuki', home: 2,
    hpMul: 1, atkMul: 0.9, xpMul: 1, weak: 'light', resist: 'earth',
    attack: { jp: 'しっぽで たたいてきた！', en: 'whacks you with its tail!' },
    skill: { jp: 'はらつづみを ならした！ ポン！', en: 'drums on its belly — pon!', mult: 1.3, chance: 0.2 },
    idle: { jp: 'ねたふりを している…。', en: 'is pretending to sleep…', chance: 0.25 },
    drops: ['herb', 'charm'],
  },
  kappa: {
    id: 'kappa', jp: '河童', kana: 'かっぱ', en: 'Kappa', home: 2,
    hpMul: 1.1, atkMul: 1, xpMul: 1.1, weak: 'earth', resist: 'water',
    attack: { jp: 'つかみかかってきた！', en: 'grabs at you!' },
    skill: { jp: 'みずでっぽうを はなった！', en: 'fires a water jet!', mult: 1.4, chance: 0.2 },
    idle: { jp: 'あたまの おさらを きにしている。', en: 'is fussing over the dish on its head.', chance: 0.2 },
    drops: ['herb', 'ether'],
  },
  'ice-slime': {
    id: 'ice-slime', jp: '氷スライム', kana: 'こおりスライム', en: 'Ice Slime', home: 2,
    hpMul: 0.9, atkMul: 0.9, xpMul: 0.9, weak: 'fire', resist: 'water',
    attack: { jp: 'たいあたりしてきた！', en: 'tackles you!' },
    skill: { jp: 'つめたい いきを ふきかけた！', en: 'breathes an icy mist!', mult: 1.35, chance: 0.2 },
    idle: { jp: 'カチコチに かたまっている。', en: 'is frozen stiff.', chance: 0.2 },
    drops: ['herb'],
  },
  golem: {
    id: 'golem', jp: '石のゴーレム', kana: 'いしのゴーレム', en: 'Stone Golem', home: 2,
    hpMul: 1.45, atkMul: 1.2, xpMul: 1.4, weak: 'wood', resist: 'earth',
    attack: { jp: 'おおきな こぶしを ふりおろした！', en: 'brings down a huge fist!' },
    idle: { jp: 'ゆっくりと こちらを 見ている。', en: 'is slowly watching you.', chance: 0.3 },
    drops: ['herb', 'charm'],
  },
  kitsune: {
    id: 'kitsune', jp: '妖狐', kana: 'ようこ', en: 'Fox Spirit', home: 3,
    hpMul: 0.95, atkMul: 1.1, xpMul: 1.1, weak: 'water', resist: 'fire',
    attack: { jp: 'ひっかいてきた！', en: 'claws at you!' },
    skill: { jp: '狐火を はなった！', en: 'casts foxfire!', mult: 1.45, chance: 0.25 },
    drops: ['ether', 'charm'],
  },
  treant: {
    id: 'treant', jp: '人面樹', kana: 'じんめんじゅ', en: 'Face Tree', home: 3,
    hpMul: 1.4, atkMul: 1.05, xpMul: 1.3, weak: 'fire', resist: 'wood',
    attack: { jp: 'えだを ふりまわした！', en: 'swings its branches!' },
    skill: { jp: 'ねっこで しめつけてきた！', en: 'constricts you with its roots!', mult: 1.35, chance: 0.2 },
    idle: { jp: 'ケタケタと わらっている。', en: 'is cackling.', chance: 0.2 },
    drops: ['herb', 'ether'],
  },
  wisp: {
    id: 'wisp', jp: '人魂', kana: 'ひとだま', en: 'Wisp', home: 3,
    hpMul: 0.8, atkMul: 1.05, xpMul: 1, weak: 'light', resist: 'wind',
    attack: { jp: 'すうっと ちかづいてきた！', en: 'drifts into you!' },
    skill: { jp: 'あおい ほのおで つつみこんだ！', en: 'engulfs you in blue flame!', mult: 1.4, chance: 0.25 },
    idle: { jp: 'ゆらゆらと ゆれている。', en: 'is flickering.', chance: 0.25 },
    drops: ['ether'],
  },
  harpy: {
    id: 'harpy', jp: 'ハーピー', kana: 'ハーピー', en: 'Harpy', home: 3,
    hpMul: 1, atkMul: 1.15, xpMul: 1.15, weak: 'earth', resist: 'wind',
    attack: { jp: 'するどい つめで おそいかかった！', en: 'dives at you with sharp talons!' },
    skill: { jp: 'はばたいて つむじかぜを おこした！', en: 'whips up a whirlwind!', mult: 1.35, chance: 0.2 },
    drops: ['herb', 'smoke'],
  },
  tengu: {
    id: 'tengu', jp: '天狗', kana: 'てんぐ', en: 'Tengu', home: 4,
    hpMul: 1.15, atkMul: 1.15, xpMul: 1.3, weak: 'water', resist: 'wind',
    attack: { jp: 'けんで きりつけてきた！', en: 'slashes at you!' },
    skill: { jp: 'うちわを ひとふりした！ 風が うなる！', en: 'swings its fan — the wind howls!', mult: 1.45, chance: 0.25 },
    idle: { jp: 'はなを たかくして いばっている。', en: 'is showing off, nose in the air.', chance: 0.15 },
    drops: ['ether', 'charm'],
  },
  skeleton: {
    id: 'skeleton', jp: 'がいこつ剣士', kana: 'がいこつけんし', en: 'Skeleton Swordsman', home: 4,
    hpMul: 1.05, atkMul: 1.2, xpMul: 1.2, weak: 'light', resist: 'water',
    attack: { jp: 'さびた けんを ふりおろした！', en: 'swings a rusty sword!' },
    idle: { jp: 'ほねを カタカタ ならしている。', en: 'is rattling its bones.', chance: 0.2 },
    drops: ['herb', 'smoke'],
  },
  oni: {
    id: 'oni', jp: '赤鬼', kana: 'あかおに', en: 'Red Oni', home: 4,
    hpMul: 1.5, atkMul: 1.3, xpMul: 1.6, weak: 'wood', resist: 'fire',
    attack: { jp: 'かなぼうで なぐりかかった！', en: 'swings its iron club!' },
    skill: { jp: 'ちからを ためて おもいきり なぐった！', en: 'winds up and smashes with all its might!', mult: 1.6, chance: 0.18 },
    idle: { jp: 'おおきな あくびを している。', en: 'lets out a big yawn.', chance: 0.15 },
    drops: ['herb', 'charm'],
  },
  dragon: {
    id: 'dragon', jp: '虚空の竜', kana: 'こくうのりゅう', en: 'Void Dragon', home: 5,
    hpMul: 4, atkMul: 1.4, xpMul: 5, weak: 'wind', resist: 'fire',
    attack: { jp: 'するどい きばで かみついた！', en: 'bites with its fangs!' },
    skill: { jp: 'やみの ほのおを はいた！', en: 'breathes dark flames!', mult: 1.6, chance: 0.3 },
    drops: ['ether'],
  },
}

type CoreEnemy = Exclude<EnemySprite, PackEnemy>
type PackEnemy = (typeof PACK_ENEMY_SPRITES)[number]

/** Every monster's stats: the core bestiary, then the region packs' (a gentle stand-in until a pack sets its own). */
export const ENEMY_DEFS: Record<EnemySprite, EnemyDef> = {
  ...CORE_DEFS,
  ...(Object.fromEntries(PACK_ENEMY_SPRITES.map((id) => [id, { ...(PACK_ENEMY_STATS[id] ?? CORE_DEFS.slime), id }])) as Record<PackEnemy, EnemyDef>),
}

/** Random-encounter pools (the dragon is the final boss, never random). */
export const REGION_POOLS: Record<number, EnemySprite[]> = {
  ...(PACK_POOLS as Record<number, EnemySprite[]>),
  1: ['slime', 'bat', 'mushroom', 'imp'],
  2: ['tanuki', 'kappa', 'ice-slime', 'golem'],
  3: ['kitsune', 'treant', 'wisp', 'harpy'],
  4: ['wisp', 'tengu', 'skeleton', 'oni'],
  5: ['oni', 'tengu', 'skeleton', 'harpy'],
}

/**
 * Baselines per step along the road (see data/journey), tuned for the level
 * a player tends to have by then. Index = region rank (1 = the village).
 */
const TIER_HP = [0, 18, 34, 46, 60, 72, 84, 96, 108, 120, 134]
const TIER_ATK = [0, 4, 6.5, 7.5, 9, 10, 11, 12, 13, 14, 15]
const TIER_XP = [0, 6, 11, 17, 24, 30, 36, 42, 48, 54, 60]
const TIER_SHARDS = [0, 2, 3, 4, 5, 5, 6, 6, 7, 7, 8]

/** A region id that has battles (unknown ids fall back to the village). */
export const clampRegion = (r: number) => (REGION_POOLS[Math.round(r)] ? Math.round(r) : 1)
/** How far along the road a region's battles are (1…10), for difficulty. */
export const tierOf = (r: number) => Math.min(TIER_HP.length - 1, Math.max(1, regionRank(clampRegion(r))))

// ─── Player ──────────────────────────────────────────────────────────────

export interface PlayerStats {
  level: number
  maxHp: number
  maxMp: number
  atk: number
  magic: number
}

export function playerStats(level: number): PlayerStats {
  const l = Math.max(1, level)
  return { level: l, maxHp: 30 + l * 6, maxMp: 10 + l * 2, atk: 10 + l * 2.2, magic: 13 + l * 3 }
}

export const SPELL_COST = 4

/** Region from which each element is taught as a basic spell. */
export const SPELL_REGION: Record<Element, number> = { fire: 1, water: 1, wood: 1, wind: 1, earth: 2, light: 2 }

/**
 * Spells the player can cast: those bought (`owned`, as nouns like '火')
 * plus the basic ones for the region.
 */
export function availableSpells(owned: readonly string[], region: number): ElementSpell[] {
  return ELEMENT_SPELLS.filter((e) => owned.includes(e.noun) || atOrBefore(SPELL_REGION[e.element], region))
}

// ─── Battle state ──────────────────────────────────────────────────────

export interface BEnemy {
  uid: number
  def: EnemyDef
  /** Display name incl. A/B suffix when there are duplicates. */
  name: string
  nameEn: string
  hp: number
  maxHp: number
  atk: number
  xp: number
  shards: number
}

export interface BattleState {
  region: number
  player: PlayerStats & { hp: number; mp: number; shield: number; name: string }
  enemies: BEnemy[]
  turn: number
  runAttempts: number
  outcome?: 'win' | 'lose' | 'flee'
}

export type BattleEvent =
  | { t: 'msg'; line: Line }
  | { t: 'strike'; target: number; dmg: number; crit: boolean; element?: Element; eff?: 'weak' | 'resist' }
  | { t: 'miss'; target: number }
  | { t: 'enemyDie'; target: number }
  | { t: 'enemyAct'; enemy: number; dmg: number; blocked: boolean; skill: boolean; element?: Element }
  | { t: 'enemyIdle'; enemy: number }
  | { t: 'heal'; hp: number; mp: number }
  | { t: 'shield' }
  | { t: 'fled' }
  | { t: 'runFail' }
  | { t: 'win' }
  | { t: 'lose' }

export interface Step {
  state: BattleState
  events: BattleEvent[]
}

const SUFFIX = ['A', 'B', 'C']

export function enemyCount(rng: Rng, region: number): number {
  const r = rng()
  const three = tierOf(region) >= 3 ? 0.18 : 0.1
  if (r < three) return 3
  if (r < three + 0.4) return 2
  return 1
}

export function rollEnemies(region: number, rng: Rng = Math.random): EnemySprite[] {
  const pool = REGION_POOLS[clampRegion(region)]
  const n = enemyCount(rng, region)
  return Array.from({ length: n }, () => pool[Math.floor(rng() * pool.length)])
}

export function makeEnemies(ids: EnemySprite[], region: number): BEnemy[] {
  const r = tierOf(region)
  const counts = new Map<string, number>()
  ids.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1))
  const seen = new Map<string, number>()
  // Groups hit softer per monster so a pack of three stays fair.
  const group = [1, 1, 0.8, 0.66][Math.min(3, ids.length)]
  return ids.slice(0, 3).map((id, uid) => {
    const def = ENEMY_DEFS[id]
    const k = seen.get(id) ?? 0
    seen.set(id, k + 1)
    const suffix = (counts.get(id) ?? 0) > 1 ? SUFFIX[k] : ''
    const hp = Math.round(TIER_HP[r] * def.hpMul)
    return {
      uid,
      def,
      name: def.jp + suffix,
      nameEn: def.en + (suffix ? ` ${suffix}` : ''),
      hp,
      maxHp: hp,
      atk: TIER_ATK[r] * def.atkMul * group,
      xp: Math.round(TIER_XP[r] * def.xpMul),
      shards: Math.max(1, Math.round(TIER_SHARDS[r] * def.xpMul)),
    }
  })
}

export function createBattle(region: number, level: number, ids: EnemySprite[], name = 'あなた', bonus?: { hp: number; mp: number; atk: number; magic: number }): BattleState {
  const base = playerStats(level)
  // the Hidden Village's dojo, forge and shrine (engine/hamlet)
  const stats = bonus ? { ...base, maxHp: base.maxHp + bonus.hp, maxMp: base.maxMp + bonus.mp, atk: base.atk + bonus.atk, magic: base.magic + bonus.magic } : base
  return {
    region: clampRegion(region),
    player: { ...stats, hp: stats.maxHp, mp: stats.maxMp, shield: 0, name },
    enemies: makeEnemies(ids, region),
    turn: 0,
    runAttempts: 0,
  }
}

export const alive = (s: BattleState) => s.enemies.filter((e) => e.hp > 0)
export const isAlive = (e: BEnemy) => e.hp > 0

function clone(s: BattleState): BattleState {
  return { ...s, player: { ...s.player }, enemies: s.enemies.map((e) => ({ ...e })) }
}

/** First living enemy at or after `i` (wrapping); -1 if none. */
export function retarget(s: BattleState, i: number): number {
  const n = s.enemies.length
  for (let k = 0; k < n; k++) {
    const j = (((i + k) % n) + n) % n
    if (s.enemies[j].hp > 0) return j
  }
  return -1
}

const vary = (rng: Rng, spread = 0.15) => 1 - spread + rng() * spread * 2

export function effectiveness(def: EnemyDef, el: Element | undefined): 1 | 2 | 0.5 {
  if (!el) return 1
  if (el === def.weak) return 2
  if (el === def.resist) return 0.5
  return 1
}

export const CRIT_MULT = 1.8

export function fightDamage(atk: number, crit: boolean, rng: Rng): number {
  return Math.max(1, Math.round(atk * vary(rng) * (crit ? CRIT_MULT : 1)))
}

export function spellDamage(magic: number, def: EnemyDef, el: Element, bonus: number, rng: Rng): number {
  return Math.max(1, Math.round(magic * vary(rng, 0.1) * effectiveness(def, el) * (1 + bonus)))
}

function hitEnemy(s: BattleState, target: number, dmg: number, ev: BattleEvent[]) {
  const e = s.enemies[target]
  e.hp = Math.max(0, e.hp - dmg)
  if (e.hp === 0) {
    ev.push({ t: 'enemyDie', target })
    ev.push({ t: 'msg', line: { jp: `${e.name}を たおした！`, en: `Defeated ${e.nameEn}!` } })
  }
}

const ELEMENT_JP: Record<Element, string> = { fire: '火', water: '水', wood: '木', earth: '土', light: '光', wind: '風' }

/** Player chose たたかう and answered the word challenge. */
export function resolveFight(state: BattleState, target: number, answer: { correct: boolean; crit: boolean }, rng: Rng = Math.random): Step {
  const s = clone(state)
  const ev: BattleEvent[] = []
  const t = retarget(s, target)
  const e = s.enemies[t]
  if (!answer.correct) {
    ev.push({ t: 'miss', target: t })
    ev.push({ t: 'msg', line: { jp: `しかし ${e.name}は ひらりと かわした！`, en: `But ${e.nameEn} dodged!` } })
    return finishPlayerTurn(s, ev, rng)
  }
  const dmg = fightDamage(s.player.atk, answer.crit, rng)
  if (answer.crit) ev.push({ t: 'msg', line: { jp: 'かいしんの いちげき！', en: 'A critical hit!' } })
  ev.push({ t: 'strike', target: t, dmg, crit: answer.crit })
  ev.push({ t: 'msg', line: { jp: `${e.name}に ${dmg}の ダメージ！`, en: `${dmg} damage to ${e.nameEn}!` } })
  hitEnemy(s, t, dmg, ev)
  return finishPlayerTurn(s, ev, rng)
}

/**
 * Player cast a spell. `valid` = the incantation was grammatical;
 * `bonus` adds damage (adjective +0.25, fast cast etc.).
 */
export function resolveSpell(state: BattleState, target: number, el: Element, cast: { valid: boolean; bonus?: number }, rng: Rng = Math.random): Step {
  const s = clone(state)
  const ev: BattleEvent[] = []
  const t = retarget(s, target)
  const e = s.enemies[t]
  if (!cast.valid) {
    ev.push({ t: 'miss', target: t })
    ev.push({ t: 'msg', line: { jp: 'じゅもんが みだれて まほうは きえてしまった…', en: 'The incantation faltered and the spell fizzled…' } })
    return finishPlayerTurn(s, ev, rng)
  }
  s.player.mp = Math.max(0, s.player.mp - SPELL_COST)
  const mult = effectiveness(e.def, el)
  const dmg = spellDamage(s.player.magic, e.def, el, cast.bonus ?? 0, rng)
  const elJp = ELEMENT_JP[el]
  ev.push({ t: 'strike', target: t, dmg, crit: false, element: el, eff: mult === 2 ? 'weak' : mult === 0.5 ? 'resist' : undefined })
  if (mult === 2) ev.push({ t: 'msg', line: { jp: `${elJp}が よく きいた！ ${e.name}に ${dmg}の ダメージ！`, en: `${cap(el)} hits its weak spot! ${dmg} damage to ${e.nameEn}!` } })
  else if (mult === 0.5) ev.push({ t: 'msg', line: { jp: `${e.name}には ${elJp}が あまり きかない…。${dmg}の ダメージ。`, en: `${cap(el)} barely works on ${e.nameEn}… ${dmg} damage.` } })
  else ev.push({ t: 'msg', line: { jp: `${e.name}に ${dmg}の ダメージ！`, en: `${dmg} damage to ${e.nameEn}!` } })
  hitEnemy(s, t, dmg, ev)
  return finishPlayerTurn(s, ev, rng)
}

const cap = (x: string) => x[0].toUpperCase() + x.slice(1)

/** Player used an item from the bag (the UI removes it from the bag). */
export function resolveItem(state: BattleState, itemId: string, rng: Rng = Math.random): Step {
  const s = clone(state)
  const ev: BattleEvent[] = []
  const it = ITEM_BY_ID.get(itemId)
  if (!it) return { state: s, events: [] }
  ev.push({ t: 'msg', line: { jp: `${s.player.name}は ${it.jp}を つかった！`, en: `${s.player.name} used the ${it.name}!` } })
  const fx = it.effect
  switch (fx.kind) {
    case 'heal': {
      const hp = Math.min(fx.amount, s.player.maxHp - s.player.hp)
      s.player.hp += hp
      ev.push({ t: 'heal', hp, mp: 0 })
      ev.push({ t: 'msg', line: { jp: `HPが ${hp} かいふくした！`, en: `Recovered ${hp} HP!` } })
      break
    }
    case 'mp': {
      const mp = Math.min(fx.amount, s.player.maxMp - s.player.mp)
      s.player.mp += mp
      ev.push({ t: 'heal', hp: 0, mp })
      ev.push({ t: 'msg', line: { jp: `MPが ${mp} かいふくした！`, en: `Recovered ${mp} MP!` } })
      break
    }
    case 'shield': {
      s.player.shield = fx.turns
      ev.push({ t: 'shield' })
      ev.push({ t: 'msg', line: { jp: 'ふしぎな ちからに まもられている！', en: 'A mysterious power protects you!' } })
      break
    }
    case 'flee': {
      s.outcome = 'flee'
      ev.push({ t: 'fled' })
      ev.push({ t: 'msg', line: { jp: 'けむりに まぎれて にげだした！', en: 'You slipped away in the smoke!' } })
      return { state: s, events: ev }
    }
  }
  return finishPlayerTurn(s, ev, rng)
}

export function runChance(state: BattleState): number {
  const avgHome = alive(state).reduce((a, e) => a + e.def.home, 0) / Math.max(1, alive(state).length)
  const base = 0.55 + state.runAttempts * 0.2 - (avgHome >= 4 ? 0.05 : 0)
  return Math.min(0.95, Math.max(0.3, base))
}

export function resolveRun(state: BattleState, rng: Rng = Math.random): Step {
  const s = clone(state)
  const ev: BattleEvent[] = [{ t: 'msg', line: { jp: `${s.player.name}は にげだした！`, en: `${s.player.name} tried to run!` } }]
  if (rng() < runChance(state)) {
    s.outcome = 'flee'
    ev.push({ t: 'fled' })
    return { state: s, events: ev }
  }
  s.runAttempts += 1
  ev.push({ t: 'runFail' })
  ev.push({ t: 'msg', line: { jp: 'しかし まわりこまれてしまった！', en: 'But the way was blocked!' } })
  return enemyTurn(s, ev, rng)
}

function finishPlayerTurn(s: BattleState, ev: BattleEvent[], rng: Rng): Step {
  if (alive(s).length === 0) {
    s.outcome = 'win'
    ev.push({ t: 'win' })
    return { state: s, events: ev }
  }
  return enemyTurn(s, ev, rng)
}

/** Every living enemy acts once. */
export function enemyTurn(s: BattleState, ev: BattleEvent[] = [], rng: Rng = Math.random): Step {
  const name = s.player.name
  for (const e of s.enemies) {
    if (e.hp <= 0) continue
    const d = e.def
    if (d.idle && rng() < d.idle.chance) {
      ev.push({ t: 'enemyIdle', enemy: e.uid })
      ev.push({ t: 'msg', line: { jp: `${e.name}は ${d.idle.jp}`, en: `${e.nameEn} ${d.idle.en}` } })
      continue
    }
    const skill = d.skill && rng() < d.skill.chance ? d.skill : undefined
    const line = skill ?? d.attack
    const dmg = Math.max(1, Math.round(e.atk * vary(rng, 0.2) * (skill ? skill.mult : 1)))
    const blocked = s.player.shield > 0
    ev.push({ t: 'msg', line: { jp: `${e.name}は ${line.jp}`, en: `${e.nameEn} ${line.en}` } })
    ev.push({ t: 'enemyAct', enemy: e.uid, dmg: blocked ? 0 : dmg, blocked, skill: !!skill })
    if (blocked) {
      s.player.shield -= 1
      ev.push({ t: 'msg', line: { jp: 'お守りが こうげきを ふせいだ！', en: 'The charm blocked the attack!' } })
      continue
    }
    s.player.hp = Math.max(0, s.player.hp - dmg)
    ev.push({ t: 'msg', line: { jp: `${name}は ${dmg}の ダメージを うけた！`, en: `${name} took ${dmg} damage!` } })
    if (s.player.hp === 0) {
      s.outcome = 'lose'
      ev.push({ t: 'lose' })
      ev.push({ t: 'msg', line: { jp: '目の前が 真っ暗に なった…', en: 'Everything went dark…' } })
      break
    }
  }
  s.turn += 1
  return { state: s, events: ev }
}

export interface Rewards {
  xp: number
  shards: number
  drop?: string
}

/** XP and shards for defeated enemies, plus an occasional item drop. */
export function battleRewards(s: BattleState, rng: Rng = Math.random): Rewards {
  const xp = s.enemies.reduce((a, e) => a + e.xp, 0)
  const shards = s.enemies.reduce((a, e) => a + e.shards, 0)
  const dropChance = 0.14 + 0.06 * s.enemies.length
  let drop: string | undefined
  if (rng() < dropChance) {
    const src = s.enemies[Math.floor(rng() * s.enemies.length)]
    drop = src.def.drops[Math.floor(rng() * src.def.drops.length)]
  }
  return { xp, shards, drop }
}

// ─── Word challenges ─────────────────────────────────────────────────────

export type QuestionKind = 'meaning' | 'reverse' | 'reading' | 'listen'

export interface Question {
  kind: QuestionKind
  word: Word
  /** SRS item id to review. */
  itemId: string
  /** Multiple choice (not for 'reading'). */
  choices: Word[]
  answer: number
  /** Time limit and critical-hit window in ms. */
  limitMs: number
  critMs: number
}

const hasKanji = (s: string) => /[一-龯㐀-䶿々]/.test(s)

/** Words usable as battle prompts for a region (short, unambiguous). */
export function battlePool(region: number): Word[] {
  return VOCAB.filter((w) => atOrBefore(w.region, clampRegion(region)) && w.jp.length <= 6 && w.kana.length <= 7)
}

/** Pick the prompt word: weaker SRS cards and the current region's words come up more often. */
export function pickWord(pool: readonly Word[], srs: Record<string, SrsCard>, region: number, now: number, avoid: readonly string[] = [], rng: Rng = Math.random): Word {
  const cand = pool.filter((w) => !avoid.includes(w.id))
  const list = cand.length ? cand : pool
  const weights = list.map((w) => (weakness(srs[item.word(w.id)], now) + 0.15) * (w.region === region ? 1.6 : 1))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rng() * total
  for (let i = 0; i < list.length; i++) {
    r -= weights[i]
    if (r <= 0) return list[i]
  }
  return list[list.length - 1]
}

/** Choose a format: new/weak words get recognition; stronger ones get recall and listening. */
export function pickKind(w: Word, card: SrsCard | undefined, now: number, opts: { listen: boolean }, rng: Rng = Math.random): QuestionKind {
  const st = strength(card, now)
  const seen = !!card && card.seen > 0
  const kinds: [QuestionKind, number][] = [
    ['meaning', seen ? 3 : 6],
    ['reverse', seen ? 3 : 3],
    ['reading', seen && hasKanji(w.jp) ? 1.5 + st * 2 : 0],
    ['listen', opts.listen ? (seen ? 2 : 1) : 0],
  ]
  const total = kinds.reduce((a, [, x]) => a + x, 0)
  let r = rng() * total
  for (const [k, x] of kinds) {
    r -= x
    if (r <= 0 && x > 0) return k
  }
  return 'meaning'
}

const choiceKey: Record<QuestionKind, (w: Word) => string> = {
  meaning: (w) => w.en.toLowerCase(),
  reverse: (w) => w.jp,
  listen: (w) => toHiragana(w.kana),
  reading: (w) => w.kana,
}

/** Build a question for `word` with 4 choices (3 in region 1) distinct under the kind's key. */
export function makeQuestion(word: Word, kind: QuestionKind, pool: readonly Word[], region: number, rng: Rng = Math.random): Question {
  const key = choiceKey[kind]
  const n = tierOf(region) <= 1 ? 3 : 4
  const taken = new Set([key(word)])
  // Also keep the English distinct in JP-choice formats so the answer is unambiguous.
  const takenEn = new Set([word.en.toLowerCase()])
  const others = [...pool].sort(() => rng() - 0.5)
  // Prefer the same part of speech for plausible distractors.
  others.sort((a, b) => Number(b.pos === word.pos) - Number(a.pos === word.pos))
  const distract: Word[] = []
  for (const w of others) {
    if (distract.length >= n - 1) break
    if (w.id === word.id || taken.has(key(w)) || takenEn.has(w.en.toLowerCase())) continue
    if (kind !== 'meaning' && taken.has(toHiragana(w.kana))) continue
    taken.add(key(w))
    taken.add(toHiragana(w.kana))
    takenEn.add(w.en.toLowerCase())
    distract.push(w)
  }
  const answer = Math.floor(rng() * (distract.length + 1))
  const choices = [...distract]
  choices.splice(answer, 0, word)
  const typed = kind === 'reading'
  const limitMs = typed ? 16000 + word.kana.length * 1000 : kind === 'listen' ? 10000 : tierOf(region) <= 1 ? 9000 : 8000
  const critMs = typed ? 4500 + word.kana.length * 500 : kind === 'listen' ? 4000 : 2600
  return { kind, word, itemId: item.word(word.id), choices: typed ? [] : choices, answer: typed ? -1 : answer, limitMs, critMs }
}

export function nextQuestion(
  region: number,
  srs: Record<string, SrsCard>,
  opts: { listen: boolean; avoid?: string[]; now?: number },
  rng: Rng = Math.random,
): Question {
  const now = opts.now ?? Date.now()
  const pool = battlePool(region)
  const w = pickWord(pool, srs, region, now, opts.avoid, rng)
  const kind = pickKind(w, srs[item.word(w.id)], now, opts, rng)
  return makeQuestion(w, kind, pool, region, rng)
}

/** Check a typed reading (romaji-converted kana, katakana ok, punctuation ignored). */
export function checkReading(word: Word, typed: string): boolean {
  const norm = (x: string) => toHiragana(x.normalize('NFKC').replace(/[\s。、！？!?.,・ー〜~]/g, ''), { passRomaji: false })
  const g = norm(typed)
  return g.length > 0 && g === norm(word.kana)
}

/** Judge an answer: correct and fast enough for a critical hit? */
export function judge(q: Question, correct: boolean, ms: number): { correct: boolean; crit: boolean } {
  const inTime = ms <= q.limitMs
  return { correct: correct && inTime, crit: correct && inTime && ms <= q.critMs }
}

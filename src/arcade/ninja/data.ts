/**
 * Stick Ninja (ぼうにんじゃ): the data behind the side-on sword fighter.
 * Five worlds of five stages, each ending in a boss; foes to cut down,
 * swords to buy, and the hero's level, XP and ryō (coins). Pure: the
 * fight itself lives in ./sim, the drawing in ./draw.
 */

export type FoeKind =
  | 'bandit'
  | 'spear'
  | 'thrower'
  | 'brute'
  | 'assassin'
  | 'shade'
  | 'ronin'
  | 'oni'
  | 'tengu'
  | 'kage'
  | 'shogun'

export type Weapon = 'sword' | 'spear' | 'club' | 'kunai' | 'fan'

/** A move the AI may pick: [move id, weight, min distance, max distance]. */
export type MoveChoice = [id: string, weight: number, min: number, max: number]

export interface FoeDef {
  name: string
  jp: string
  hp: number
  atk: number
  speed: number
  scale: number
  color: string
  weapon: Weapon
  moves: MoveChoice[]
  /** Seconds between attacks (roughly). */
  cooldown: number
  /** Chance to raise a guard when the hero swings close by. */
  block: number
  /** Distance it likes to keep (ranged foes); otherwise it closes in. */
  range?: number
  xp: number
  ryo: number
  boss?: boolean
  /** Hovers this high off the ground. */
  fly?: number
}

export const FOES: Record<FoeKind, FoeDef> = {
  bandit: { name: 'Bandit', jp: 'ごろつき', hp: 40, atk: 7, speed: 150, scale: 1, color: '#7a4a2a', weapon: 'sword', moves: [['slash', 1, 0, 60]], cooldown: 1.5, block: 0.1, xp: 10, ryo: 6 },
  spear: { name: 'Ashigaru', jp: 'あしがる', hp: 46, atk: 8, speed: 130, scale: 1, color: '#4f6b3a', weapon: 'spear', moves: [['thrust', 1, 0, 92]], cooldown: 1.7, block: 0.15, range: 80, xp: 12, ryo: 7 },
  thrower: { name: 'Shinobi', jp: 'しのび', hp: 30, atk: 6, speed: 175, scale: 0.95, color: '#34406b', weapon: 'kunai', moves: [['star', 3, 90, 600], ['quick', 1, 0, 50]], cooldown: 1.8, block: 0.05, range: 230, xp: 12, ryo: 8 },
  brute: { name: 'Sumō Brute', jp: 'りきし', hp: 115, atk: 14, speed: 100, scale: 1.35, color: '#8a3030', weapon: 'club', moves: [['heavy', 1, 0, 80]], cooldown: 2.3, block: 0, xp: 22, ryo: 14 },
  assassin: { name: 'Assassin', jp: 'あんさつしゃ', hp: 36, atk: 9, speed: 260, scale: 0.95, color: '#5b2a86', weapon: 'sword', moves: [['quick', 2, 0, 52], ['dashStab', 1, 90, 260]], cooldown: 1.1, block: 0.25, xp: 15, ryo: 10 },
  shade: { name: 'Shadow Clone', jp: 'かげぶんしん', hp: 30, atk: 8, speed: 240, scale: 1, color: '#7c4dbd', weapon: 'sword', moves: [['quick', 1, 0, 52]], cooldown: 1.3, block: 0, xp: 5, ryo: 2 },
  ronin: { name: 'Kaito the Ronin', jp: 'ろうにん カイト', hp: 430, atk: 11, speed: 210, scale: 1.1, color: '#2b2b2b', weapon: 'sword', moves: [['r1', 3, 0, 62], ['rdash', 2, 110, 400]], cooldown: 1.0, block: 0.4, boss: true, xp: 120, ryo: 90 },
  oni: { name: 'Gōki the Oni', jp: 'おに ゴウキ', hp: 900, atk: 15, speed: 115, scale: 1.9, color: '#b3261e', weapon: 'club', moves: [['club', 3, 0, 110], ['slam', 2, 0, 260], ['charge', 1, 160, 600]], cooldown: 1.6, block: 0, boss: true, xp: 200, ryo: 150 },
  tengu: { name: 'Hayate the Tengu Lord', jp: 'てんぐ ハヤテ', hp: 820, atk: 14, speed: 220, scale: 1.2, color: '#2f5f4a', weapon: 'fan', moves: [['gust', 3, 120, 700], ['swoop', 2, 80, 500], ['slash', 1, 0, 70]], cooldown: 1.15, block: 0.2, boss: true, fly: 120, range: 200, xp: 260, ryo: 210 },
  kage: { name: 'Kage, Master of Shadows', jp: 'かげ', hp: 1050, atk: 16, speed: 260, scale: 1.05, color: '#3d1f63', weapon: 'sword', moves: [['vanish', 3, 0, 700], ['fanStar', 2, 120, 700], ['quick', 2, 0, 56]], cooldown: 1.0, block: 0.45, boss: true, xp: 330, ryo: 280 },
  shogun: { name: 'The Dragon Shōgun', jp: 'りゅうの しょうぐん', hp: 1300, atk: 16, speed: 150, scale: 1.5, color: '#b8860b', weapon: 'sword', moves: [['heavy', 3, 0, 96], ['breath', 2, 60, 330], ['leap', 2, 150, 700]], cooldown: 1.25, block: 0.25, boss: true, xp: 450, ryo: 400 },
}

export interface World {
  name: string
  jp: string
  boss: FoeKind
  pool: FoeKind[]
}

export const WORLDS: World[] = [
  { name: 'Bamboo Grove', jp: '竹林', boss: 'ronin', pool: ['bandit', 'bandit', 'spear'] },
  { name: 'Oni Island', jp: '鬼ヶ島', boss: 'oni', pool: ['bandit', 'spear', 'brute'] },
  { name: 'Tengu Peaks', jp: '天狗山', boss: 'tengu', pool: ['bandit', 'thrower', 'spear', 'assassin'] },
  { name: 'Shadow Castle', jp: '影の城', boss: 'kage', pool: ['assassin', 'thrower', 'brute', 'spear'] },
  { name: 'Dragon Palace', jp: '龍の宮', boss: 'shogun', pool: ['bandit', 'spear', 'thrower', 'brute', 'assassin'] },
]

export const STAGES_PER_WORLD = 5
export const STAGE_COUNT = WORLDS.length * STAGES_PER_WORLD

export interface Stage {
  /** 0-based index over the whole campaign. */
  index: number
  world: number
  /** 1-based within its world. */
  n: number
  boss?: FoeKind
  waves: FoeKind[][]
  /** Foe strength multiplier. */
  power: number
}

/** A small deterministic generator so each stage is the same every time. */
function seeded(seed: number) {
  let a = seed * 9301 + 49297
  return () => {
    a = (a * 9301 + 49297) % 233280
    return a / 233280
  }
}

export function stageAt(index: number): Stage {
  const world = Math.floor(index / STAGES_PER_WORLD)
  const n = (index % STAGES_PER_WORLD) + 1
  const w = WORLDS[world]
  const rng = seeded(index + 1)
  const pick = () => w.pool[Math.floor(rng() * w.pool.length)]
  const power = 1 + index * 0.12
  if (n === STAGES_PER_WORLD) {
    const warm = Array.from({ length: 2 + Math.min(2, world) }, pick)
    return { index, world, n, boss: w.boss, waves: [warm, [w.boss]], power }
  }
  const waveCount = 2 + Math.floor(n / 2) + (world >= 2 ? 1 : 0)
  const waves = Array.from({ length: waveCount }, (_, i) => Array.from({ length: Math.min(5, 1 + Math.floor((n + world + i) / 2) + (i === waveCount - 1 ? 1 : 0)) }, pick))
  return { index, world, n, waves, power }
}

// ─── Swords ────────────────────────────────────────────────────────────

export type SwordId = 'bokken' | 'katana' | 'kodachi' | 'nodachi' | 'homura' | 'raikiri' | 'tsukikage' | 'ryujin'
export type Special = 'spin' | 'wave' | 'flurry' | 'fire' | 'lightning' | 'crescent' | 'dragon'

export interface SwordDef {
  id: SwordId
  name: string
  jp: string
  dmg: number
  /** Swing speed: 1 is normal, higher is faster. */
  speed: number
  reach: number
  cost: number
  level: number
  special: Special
  specialName: string
  color: string
  burn?: boolean
  lifesteal?: number
  twin?: boolean
  blurb: string
}

export const SWORDS: SwordDef[] = [
  { id: 'bokken', name: 'Bokken', jp: '木刀', dmg: 8, speed: 1, reach: 48, cost: 0, level: 1, special: 'spin', specialName: 'Whirlwind', color: '#c49a63', blurb: 'A wooden practice sword. Everyone starts somewhere.' },
  { id: 'katana', name: 'Katana', jp: '刀', dmg: 12, speed: 1.05, reach: 54, cost: 150, level: 2, special: 'wave', specialName: 'Air Slash', color: '#dfe6ee', blurb: 'A true blade. Its special sends a slash flying across the field.' },
  { id: 'kodachi', name: 'Twin Kodachi', jp: '二刀小太刀', dmg: 9, speed: 1.55, reach: 44, cost: 400, level: 4, special: 'flurry', specialName: 'Hundred Cuts', color: '#cfd8dc', twin: true, blurb: 'Two short blades, very fast. Dash through a crowd cutting all the way.' },
  { id: 'nodachi', name: 'Nōdachi', jp: '野太刀', dmg: 21, speed: 0.75, reach: 78, cost: 700, level: 6, special: 'spin', specialName: 'Great Whirl', color: '#eceff1', blurb: 'A huge field sword: slow, long, and it hits like a falling tree.' },
  { id: 'homura', name: 'Homura', jp: '焔', dmg: 17, speed: 1.05, reach: 56, cost: 1200, level: 8, special: 'fire', specialName: 'Wildfire', color: '#ff7043', burn: true, blurb: 'A blade that never cools. Every cut sets foes burning.' },
  { id: 'raikiri', name: 'Raikiri', jp: '雷切', dmg: 21, speed: 1.2, reach: 56, cost: 1900, level: 11, special: 'lightning', specialName: 'Thunder Call', color: '#ffe066', blurb: 'The sword that cut lightning. Its special strikes every foe at once.' },
  { id: 'tsukikage', name: 'Tsukikage', jp: '月影', dmg: 25, speed: 1.1, reach: 62, cost: 2800, level: 14, special: 'crescent', specialName: 'Moon Crescent', color: '#b39ddb', lifesteal: 0.12, blurb: 'Moonlit steel that drinks a little life with every cut.' },
  { id: 'ryujin', name: 'Ryūjin', jp: '龍神', dmg: 33, speed: 1, reach: 68, cost: 4000, level: 17, special: 'dragon', specialName: 'Dragon God', color: '#4dd0e1', burn: true, blurb: 'The dragon god’s fang. Unleash a dragon of blue flame.' },
]

export const SWORD_BY_ID = Object.fromEntries(SWORDS.map((s) => [s.id, s])) as Record<SwordId, SwordDef>

// ─── The hero's progress ───────────────────────────────────────────────

export interface NinjaSave {
  level: number
  xp: number
  ryo: number
  owned: SwordId[]
  sword: SwordId
  /** Stages cleared in order: stage `cleared` is the next one open. */
  cleared: number
}

export const freshNinja = (): NinjaSave => ({ level: 1, xp: 0, ryo: 0, owned: ['bokken'], sword: 'bokken', cleared: 0 })

export const xpToNext = (level: number) => 40 + 30 * level + 5 * level * level

export function heroStats(level: number) {
  return { hp: 100 + 12 * (level - 1), atkMul: 1 + 0.045 * (level - 1) }
}

export function stageUnlocked(save: NinjaSave, index: number) {
  return index <= save.cleared && index < STAGE_COUNT
}

/** Ryō for clearing a stage, on top of what the foes drop. */
export const clearBonus = (stage: Stage) => 25 * (stage.index + 1) + (stage.boss ? 150 : 0)

/** Spirit shards for the main journey, for a first clear. */
export const firstClearShards = (stage: Stage) => (stage.boss ? 10 + 5 * stage.world : 2)

export interface StageResult {
  save: NinjaSave
  levelsGained: number
  firstClear: boolean
  shards: number
  xp: number
  ryo: number
}

/** Bank what a fight earned. Losing keeps the XP and half the ryō. */
export function settleStage(save: NinjaSave, stage: Stage, won: boolean, xp: number, ryo: number): StageResult {
  const firstClear = won && stage.index === save.cleared
  const gotRyo = won ? ryo + clearBonus(stage) : Math.floor(ryo / 2)
  let level = save.level
  let pool = save.xp + xp
  let levelsGained = 0
  while (pool >= xpToNext(level)) {
    pool -= xpToNext(level)
    level++
    levelsGained++
  }
  return {
    save: { ...save, level, xp: pool, ryo: save.ryo + gotRyo, cleared: firstClear ? save.cleared + 1 : save.cleared },
    levelsGained,
    firstClear,
    shards: firstClear ? firstClearShards(stage) : 0,
    xp,
    ryo: gotRyo,
  }
}

export type BuyCheck = 'ok' | 'owned' | 'level' | 'ryo'

export function canBuy(save: NinjaSave, id: SwordId): BuyCheck {
  const s = SWORD_BY_ID[id]
  if (save.owned.includes(id)) return 'owned'
  if (save.level < s.level) return 'level'
  if (save.ryo < s.cost) return 'ryo'
  return 'ok'
}

export function buySword(save: NinjaSave, id: SwordId): NinjaSave | null {
  if (canBuy(save, id) !== 'ok') return null
  return { ...save, ryo: save.ryo - SWORD_BY_ID[id].cost, owned: [...save.owned, id], sword: id }
}

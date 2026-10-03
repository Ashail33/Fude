/**
 * Stick Ninja (ぼうにんじゃ): the data behind the side-on sword fighter.
 * Ten worlds of five stages, each ending in a boss, then the endless Ink
 * Abyss; foes to cut down, swords and armour to buy or find, the Ink Arts
 * that grow the special move, and the hero's level, XP and ryō (coins).
 * Pure: the fight itself lives in ./sim, the drawing in ./draw.
 */

export type FoeKind =
  | 'bandit'
  | 'spear'
  | 'thrower'
  | 'brute'
  | 'assassin'
  | 'shade'
  | 'kappa'
  | 'yurei'
  | 'archer'
  | 'monk'
  | 'samurai'
  | 'ronin'
  | 'oni'
  | 'tengu'
  | 'kage'
  | 'shogun'
  | 'kappaking'
  | 'gasha'
  | 'frost'
  | 'storm'
  | 'quiet'

export type Weapon = 'sword' | 'spear' | 'club' | 'kunai' | 'fan' | 'bow' | 'claw'

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
  /** Light hits stagger it even though it is a boss (nimble duellists). */
  nimble?: boolean
}

export const FOES: Record<FoeKind, FoeDef> = {
  bandit: { name: 'Bandit', jp: 'ごろつき', hp: 40, atk: 7, speed: 150, scale: 1, color: '#7a4a2a', weapon: 'sword', moves: [['slash', 1, 0, 60]], cooldown: 1.5, block: 0.1, xp: 10, ryo: 6 },
  spear: { name: 'Ashigaru', jp: 'あしがる', hp: 46, atk: 8, speed: 130, scale: 1, color: '#4f6b3a', weapon: 'spear', moves: [['thrust', 1, 0, 92]], cooldown: 1.7, block: 0.15, range: 80, xp: 12, ryo: 7 },
  thrower: { name: 'Shinobi', jp: 'しのび', hp: 30, atk: 6, speed: 175, scale: 0.95, color: '#34406b', weapon: 'kunai', moves: [['star', 3, 90, 600], ['quick', 1, 0, 50]], cooldown: 1.8, block: 0.05, range: 230, xp: 12, ryo: 8 },
  brute: { name: 'Sumō Brute', jp: 'りきし', hp: 115, atk: 14, speed: 100, scale: 1.35, color: '#8a3030', weapon: 'club', moves: [['heavy', 1, 0, 80]], cooldown: 2.3, block: 0, xp: 22, ryo: 14 },
  assassin: { name: 'Assassin', jp: 'あんさつしゃ', hp: 36, atk: 9, speed: 260, scale: 0.95, color: '#5b2a86', weapon: 'sword', moves: [['quick', 2, 0, 52], ['dashStab', 1, 90, 260]], cooldown: 1.1, block: 0.25, xp: 15, ryo: 10 },
  shade: { name: 'Shadow Clone', jp: 'かげぶんしん', hp: 30, atk: 8, speed: 240, scale: 1, color: '#7c4dbd', weapon: 'sword', moves: [['quick', 1, 0, 52]], cooldown: 1.3, block: 0, xp: 5, ryo: 2 },
  kappa: { name: 'Kappa', jp: 'かっぱ', hp: 62, atk: 9, speed: 165, scale: 0.95, color: '#3f8f5a', weapon: 'claw', moves: [['headbutt', 2, 0, 70], ['spit', 2, 110, 420]], cooldown: 1.5, block: 0.1, xp: 17, ryo: 11 },
  yurei: { name: 'Yūrei', jp: 'ゆうれい', hp: 46, atk: 9, speed: 120, scale: 1, color: '#bfe3f2', weapon: 'claw', moves: [['wisp', 3, 90, 650], ['phase', 1, 0, 700]], cooldown: 1.7, block: 0, range: 210, fly: 26, xp: 17, ryo: 10 },
  archer: { name: 'Archer', jp: 'ゆみへい', hp: 34, atk: 8, speed: 150, scale: 1, color: '#6b5a2e', weapon: 'bow', moves: [['arrow', 3, 130, 760], ['quick', 1, 0, 50]], cooldown: 1.9, block: 0.05, range: 320, xp: 14, ryo: 9 },
  monk: { name: 'Warrior Monk', jp: 'そうへい', hp: 95, atk: 11, speed: 130, scale: 1.1, color: '#e0e0e0', weapon: 'spear', moves: [['staffSpin', 2, 0, 76], ['thrust', 1, 0, 92]], cooldown: 1.6, block: 0.35, xp: 22, ryo: 13 },
  samurai: { name: 'Samurai', jp: 'さむらい', hp: 115, atk: 13, speed: 175, scale: 1.05, color: '#8b1e3f', weapon: 'sword', moves: [['r1', 2, 0, 62], ['dashStab', 1, 90, 260]], cooldown: 1.25, block: 0.45, xp: 28, ryo: 18 },
  ronin: { name: 'Kaito the Ronin', jp: 'ろうにん カイト', hp: 430, atk: 11, speed: 210, scale: 1.1, color: '#2b2b2b', weapon: 'sword', moves: [['r1', 3, 0, 62], ['rdash', 2, 110, 400]], cooldown: 1.0, block: 0.4, boss: true, nimble: true, xp: 120, ryo: 90 },
  oni: { name: 'Gōki the Oni', jp: 'おに ゴウキ', hp: 900, atk: 15, speed: 115, scale: 1.9, color: '#b3261e', weapon: 'club', moves: [['club', 3, 0, 110], ['slam', 2, 0, 260], ['charge', 1, 160, 600]], cooldown: 1.6, block: 0, boss: true, xp: 200, ryo: 150 },
  tengu: { name: 'Hayate the Tengu Lord', jp: 'てんぐ ハヤテ', hp: 820, atk: 14, speed: 220, scale: 1.2, color: '#2f5f4a', weapon: 'fan', moves: [['gust', 3, 120, 700], ['swoop', 2, 80, 500], ['slash', 1, 0, 70]], cooldown: 1.15, block: 0.2, boss: true, fly: 120, range: 200, xp: 260, ryo: 210 },
  kage: { name: 'Kage, Master of Shadows', jp: 'かげ', hp: 1050, atk: 16, speed: 260, scale: 1.05, color: '#3d1f63', weapon: 'sword', moves: [['vanish', 3, 0, 700], ['fanStar', 2, 120, 700], ['quick', 2, 0, 56]], cooldown: 1.0, block: 0.45, boss: true, nimble: true, xp: 330, ryo: 280 },
  shogun: { name: 'The Dragon Shōgun', jp: 'りゅうの しょうぐん', hp: 1300, atk: 16, speed: 150, scale: 1.5, color: '#b8860b', weapon: 'sword', moves: [['heavy', 3, 0, 96], ['breath', 2, 60, 330], ['leap', 2, 150, 700]], cooldown: 1.25, block: 0.25, boss: true, xp: 450, ryo: 400 },
  kappaking: { name: 'Gatarō the Kappa King', jp: 'かっぱの おう ガタロウ', hp: 1350, atk: 17, speed: 140, scale: 1.6, color: '#2e7d4f', weapon: 'club', moves: [['club', 3, 0, 110], ['geyser', 2, 90, 650], ['bellySlide', 1, 160, 700]], cooldown: 1.35, block: 0.1, boss: true, xp: 520, ryo: 460 },
  gasha: { name: 'The Gashadokuro', jp: 'がしゃどくろ', hp: 1600, atk: 18, speed: 90, scale: 2.2, color: '#e8e2d0', weapon: 'claw', moves: [['boneGrab', 3, 0, 130], ['slam', 2, 0, 280], ['boneRain', 2, 120, 900]], cooldown: 1.6, block: 0, boss: true, xp: 600, ryo: 540 },
  frost: { name: 'Fubuki the Frost Samurai', jp: 'ふぶき', hp: 1500, atk: 18, speed: 235, scale: 1.15, color: '#7fb3d5', weapon: 'sword', moves: [['r1', 3, 0, 62], ['iceWave', 2, 120, 650], ['rdash', 2, 110, 420]], cooldown: 1.0, block: 0.4, boss: true, nimble: true, xp: 680, ryo: 620 },
  storm: { name: 'Ikazuchi the Storm Lord', jp: 'いかずち', hp: 1700, atk: 19, speed: 210, scale: 1.3, color: '#f2c94c', weapon: 'fan', moves: [['bolts', 3, 0, 900], ['gust', 2, 120, 700], ['swoop', 1, 80, 500]], cooldown: 1.1, block: 0.2, boss: true, fly: 110, range: 220, xp: 760, ryo: 700 },
  quiet: { name: 'The Quiet', jp: 'しずけさ', hp: 2100, atk: 20, speed: 250, scale: 1.1, color: '#1b1030', weapon: 'sword', moves: [['vanish', 3, 0, 700], ['inkWave', 2, 120, 700], ['r1', 2, 0, 62], ['inkRain', 1, 0, 900]], cooldown: 0.95, block: 0.45, boss: true, nimble: true, xp: 900, ryo: 850 },
}

export type Deco = 'bamboo' | 'torii' | 'pines' | 'castle' | 'pagoda' | 'willows' | 'temple' | 'snowpass' | 'drums' | 'void'

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
  { name: 'Kappa River', jp: '河童川', boss: 'kappaking', pool: ['kappa', 'kappa', 'bandit', 'archer'] },
  { name: 'Haunted Temple', jp: '化け寺', boss: 'gasha', pool: ['yurei', 'monk', 'yurei', 'assassin'] },
  { name: 'Frozen Pass', jp: '雪の峠', boss: 'frost', pool: ['samurai', 'archer', 'spear', 'brute'] },
  { name: 'Storm Clouds', jp: '雷雲', boss: 'storm', pool: ['thrower', 'archer', 'assassin', 'samurai', 'monk'] },
  { name: 'Void Gate', jp: '虚無の門', boss: 'quiet', pool: ['shade', 'samurai', 'yurei', 'assassin', 'monk', 'kappa'] },
]

export const STAGES_PER_WORLD = 5
export const STAGE_COUNT = WORLDS.length * STAGES_PER_WORLD
/** The first five worlds (the original campaign; the story's ink echoes). */
export const FIRST_WORLDS = 5

/**
 * A twist on a stage, so no two in a row play alike:
 *  - ambush: foes pour in from both sides at once, and there is an extra wave;
 *  - elite: one foe in each wave is a gold-aura elite (tougher, richer);
 *  - duel: few foes, but each one is an elite;
 *  - night: a dark stage lit by lanterns (and more urns to find);
 *  - gauntlet: more waves, no breather heal between them.
 */
export type StageMod = 'ambush' | 'elite' | 'duel' | 'night' | 'gauntlet'

export const MOD_INFO: Record<StageMod, { name: string; jp: string; icon: string; desc: string }> = {
  ambush: { name: 'Ambush', jp: 'まちぶせ', icon: '⚠️', desc: 'Foes from both sides, and one wave more.' },
  elite: { name: 'Elite', jp: 'せいえい', icon: '👑', desc: 'One gold-aura elite in every wave.' },
  duel: { name: 'Duel', jp: 'いっきうち', icon: '⚔️', desc: 'Few foes, every one an elite.' },
  night: { name: 'Night', jp: 'よる', icon: '🌙', desc: 'Darkness and lanterns; more urns to break.' },
  gauntlet: { name: 'Gauntlet', jp: 'かちぬき', icon: '🔥', desc: 'Extra waves and no rest between them.' },
}

export interface Stage {
  /** 0-based index over the whole campaign (Abyss floors come after it). */
  index: number
  world: number
  /** 1-based within its world. */
  n: number
  boss?: FoeKind
  waves: FoeKind[][]
  /** Foe strength multiplier. */
  power: number
  mod?: StageMod
  /** Indices into waves[i] of the elites (by wave). */
  elites?: number[][]
  /** No heal between waves. */
  noRest?: boolean
  /** Floor of the Ink Abyss (0-based), for Abyss stages. */
  abyss?: number
  /** Gear hidden in this stage's treasure chest. */
  chest?: GearId
  /** Gear the boss leaves behind. */
  bossDrop?: GearId
  /** Breakable urns in the arena. */
  urns: number
}

/** A small deterministic generator so each stage is the same every time. */
function seeded(seed: number) {
  let a = seed * 9301 + 49297
  return () => {
    a = (a * 9301 + 49297) % 233280
    return a / 233280
  }
}

/** Foe strength climbs quickly through the first five worlds, then more gently. */
export const stagePower = (index: number) => 1 + Math.min(index, 25) * 0.12 + Math.max(0, index - 25) * 0.16

function withMod(st: Stage, mod: StageMod, rng: () => number): Stage {
  const pool = WORLDS[st.world].pool
  const pick = () => pool[Math.floor(rng() * pool.length)]
  const waves = st.waves.map((w) => [...w])
  let elites: number[][] = waves.map(() => [])
  let noRest = false
  if (mod === 'ambush') waves.push(Array.from({ length: Math.min(6, waves[waves.length - 1].length + 1) }, pick))
  if (mod === 'elite') elites = waves.map((w) => [Math.floor(rng() * w.length)])
  if (mod === 'duel') {
    const ws = waves.slice(0, 3).map((w) => w.slice(0, Math.max(1, Math.ceil(w.length / 3))))
    return { ...st, mod, waves: ws, elites: ws.map((w) => w.map((_, i) => i)) }
  }
  if (mod === 'gauntlet') {
    waves.push(Array.from({ length: 3 }, pick), Array.from({ length: 4 }, pick))
    noRest = true
  }
  return { ...st, mod, waves, elites, noRest, urns: mod === 'night' ? st.urns + 3 : st.urns }
}

const MODS: StageMod[] = ['ambush', 'elite', 'duel', 'night', 'gauntlet']

export function stageAt(index: number): Stage {
  if (index >= STAGE_COUNT) return abyssStage(index - STAGE_COUNT)
  const world = Math.floor(index / STAGES_PER_WORLD)
  const n = (index % STAGES_PER_WORLD) + 1
  const w = WORLDS[world]
  const rng = seeded(index + 1)
  const pick = () => w.pool[Math.floor(rng() * w.pool.length)]
  const power = stagePower(index)
  const urns = 2 + (world % 3 === 0 ? 1 : 0)
  if (n === STAGES_PER_WORLD) {
    const warm = Array.from({ length: 2 + Math.min(2, world) }, pick)
    return { index, world, n, boss: w.boss, waves: [warm, [w.boss]], power, urns: 1, bossDrop: BOSS_DROPS[world] }
  }
  const waveCount = 2 + Math.floor(n / 2) + (world >= 2 ? 1 : 0)
  const waves = Array.from({ length: waveCount }, (_, i) => Array.from({ length: Math.min(5, 1 + Math.floor((n + world + i) / 2) + (i === waveCount - 1 ? 1 : 0)) }, pick))
  let st: Stage = { index, world, n, waves, power, urns, chest: n === 3 ? CHESTS[world] : undefined }
  // From the second world on, stages 2 and 4 get a twist.
  if (world >= 1 && (n === 2 || n === 4)) st = withMod(st, MODS[(index * 7 + world) % MODS.length], rng)
  return st
}

// ─── The Ink Abyss: endless floors after the campaign ──────────────────

/** Floors the Abyss opens with (more open as you climb). */
export function abyssStage(floor: number): Stage {
  const world = floor % WORLDS.length
  const rng = seeded(1000 + floor)
  const pool = WORLDS.flatMap((w, i) => (i <= Math.min(WORLDS.length - 1, 4 + Math.floor(floor / 3)) ? w.pool : []))
  const pick = () => pool[Math.floor(rng() * pool.length)]
  const power = stagePower(STAGE_COUNT) + floor * 0.12
  const bossFloor = floor % 5 === 4
  const waveCount = 3 + Math.min(3, Math.floor(floor / 4))
  const waves = Array.from({ length: waveCount }, (_, i) => Array.from({ length: Math.min(6, 2 + Math.floor((floor + i) / 3)) }, pick))
  if (bossFloor) waves.push([WORLDS[Math.floor(floor / 5) % WORLDS.length].boss])
  let st: Stage = { index: STAGE_COUNT + floor, world, n: (floor % 5) + 1, waves, power, abyss: floor, urns: 3, boss: bossFloor ? waves[waves.length - 1][0] : undefined }
  if (!bossFloor && floor % 2 === 1) st = withMod(st, MODS[floor % MODS.length], rng)
  return st
}

// ─── Swords ────────────────────────────────────────────────────────────

export type SwordId =
  | 'bokken'
  | 'katana'
  | 'kodachi'
  | 'nodachi'
  | 'homura'
  | 'raikiri'
  | 'tsukikage'
  | 'ryujin'
  | 'dojigiri'
  | 'hotarumaru'
  | 'kogarasu'
  | 'kappa-oar'
  | 'muramasa'
  | 'kusanagi'
  | 'masamune'
export type Special = 'spin' | 'wave' | 'flurry' | 'fire' | 'lightning' | 'crescent' | 'dragon' | 'fireflies' | 'crows' | 'geyser' | 'bloodDance' | 'tornado' | 'judgement'

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
  /** Can't be bought: found in a stage chest, left by a boss, or hidden in the wide world. */
  found?: boolean
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
  { id: 'dojigiri', name: 'Dōjigiri', jp: '童子切', dmg: 41, speed: 1.05, reach: 66, cost: 9000, level: 24, special: 'lightning', specialName: 'Oni-Slayer Thunder', color: '#ffccbc', burn: true, blurb: 'The blade that slew the oni king Shuten-dōji. Thunder answers it.' },
  // ── Found, never sold ──
  { id: 'hotarumaru', name: 'Hotaru-maru', jp: '蛍丸', dmg: 13, speed: 1.15, reach: 54, cost: 0, level: 1, special: 'fireflies', specialName: 'Firefly Swarm', color: '#d4ff6a', found: true, blurb: 'Legend says fireflies mended its nicks overnight. Its special looses a swarm of burning lights. (Bamboo Grove chest)' },
  { id: 'kogarasu', name: 'Kogarasu-maru', jp: '小烏丸', dmg: 27, speed: 1.35, reach: 54, cost: 0, level: 1, special: 'crows', specialName: 'Murder of Crows', color: '#90a4ae', found: true, blurb: 'The Little Crow, a blade of the old emperors. Its special sends crows hunting every foe. (Dragon Palace chest)' },
  { id: 'kappa-oar', name: 'Kappa’s Oar', jp: '河童の櫂', dmg: 34, speed: 0.85, reach: 82, cost: 0, level: 1, special: 'geyser', specialName: 'River Geysers', color: '#4fc3a1', found: true, blurb: 'Not a sword at all, but the Kappa King swore by it. Its special raises a march of geysers. (Gatarō’s prize)' },
  { id: 'muramasa', name: 'Muramasa', jp: '村正', dmg: 38, speed: 1.25, reach: 58, cost: 0, level: 1, special: 'bloodDance', specialName: 'Crimson Dance', color: '#e53950', lifesteal: 0.08, found: true, blurb: 'A cursed, hungry blade. Its dance drinks deep. (Haunted Temple chest)' },
  { id: 'kusanagi', name: 'Kusanagi', jp: '草薙', dmg: 42, speed: 1.15, reach: 64, cost: 0, level: 1, special: 'tornado', specialName: 'Grass-Cutter Gale', color: '#8bc34a', found: true, blurb: 'The grass-cutting sword of the gods. Its gale drags foes into a whirling cyclone. (Storm Clouds chest)' },
  { id: 'masamune', name: 'Masamune', jp: '正宗', dmg: 52, speed: 1.1, reach: 70, cost: 0, level: 1, special: 'judgement', specialName: 'Final Stroke', color: '#fff8e1', burn: true, found: true, blurb: 'The calm, perfect blade. One stroke parts the Quiet itself. (The Quiet’s prize)' },
]

export const SWORD_BY_ID = Object.fromEntries(SWORDS.map((s) => [s.id, s])) as Record<SwordId, SwordDef>

// ─── Armour ────────────────────────────────────────────────────────────

/**
 * What armour adds besides cutting damage:
 *  - regen: slowly heals in a fight;  - swift: faster feet, shorter dash cooldown;
 *  - thorns: melee attackers take some of the hurt back;  - dodge: sometimes slips a hit entirely;
 *  - focus: the special meter fills faster;  - chill: melee attackers are frozen slow;
 *  - fireward: no burning, and fire hurts less;  - air: an extra jump in the air.
 */
export type Perk = 'regen' | 'swift' | 'thorns' | 'dodge' | 'focus' | 'chill' | 'fireward' | 'air'

export const PERK_INFO: Record<Perk, string> = {
  regen: 'Slowly heals during a fight',
  swift: 'Faster feet; dash recovers sooner',
  thorns: 'Melee attackers take a quarter of the hurt back',
  dodge: '1 hit in 6 misses you entirely',
  focus: 'Special meter fills 25% faster',
  chill: 'Melee attackers are frozen slow',
  fireward: 'Immune to burning; fire hurts half as much',
  air: 'An extra jump in mid-air',
}

export type ArmorId = 'gi' | 'kusari' | 'lacquer' | 'oyoroi' | 'monk-robe' | 'oni-hide' | 'tengu-cloak' | 'kage-garb' | 'kappa-shell' | 'frost-mail' | 'tennin-robe' | 'dragon-armour'

export interface ArmorDef {
  id: ArmorId
  name: string
  jp: string
  /** Fraction of damage taken away (0–0.4). */
  def: number
  hp: number
  perk?: Perk
  cost: number
  level: number
  color: string
  found?: boolean
  blurb: string
}

export const ARMORS: ArmorDef[] = [
  { id: 'gi', name: 'Training Gi', jp: '道着', def: 0, hp: 0, cost: 0, level: 1, color: '#1f2b4d', blurb: 'Your old indigo gi. Light, comfortable, no protection whatsoever.' },
  { id: 'kusari', name: 'Kusari Shirt', jp: '鎖帷子', def: 0.08, hp: 10, cost: 300, level: 3, color: '#78909c', blurb: 'Fine chain mail worn under the gi. Blades skid off it.' },
  { id: 'lacquer', name: 'Lacquered Dō', jp: '漆の胴', def: 0.16, hp: 25, cost: 1600, level: 10, color: '#4e342e', blurb: 'A breastplate of lacquered iron plates, laced in silk.' },
  { id: 'oyoroi', name: 'Ō-yoroi', jp: '大鎧', def: 0.22, hp: 40, cost: 6500, level: 20, color: '#5d1a1a', blurb: 'Great armour of a mounted samurai lord: heavy silk-laced plates from shoulder to knee.' },
  // ── Found, never sold ──
  { id: 'monk-robe', name: 'Mountain Monk’s Robe', jp: '山伏の衣', def: 0.06, hp: 10, perk: 'focus', cost: 0, level: 1, color: '#e0d6c2', found: true, blurb: 'A yamabushi’s robe, heavy with prayers. (Hidden on the journey: the Shrine)' },
  { id: 'oni-hide', name: 'Oni-Hide Vest', jp: '鬼の皮衣', def: 0.14, hp: 20, perk: 'thorns', cost: 0, level: 1, color: '#9e2a1f', found: true, blurb: 'Tough red hide, still warm. Whatever hits it regrets it. (Oni Island chest)' },
  { id: 'tengu-cloak', name: 'Tengu Feather Cloak', jp: '天狗の羽衣', def: 0.05, hp: 0, perk: 'swift', cost: 0, level: 1, color: '#263b30', found: true, blurb: 'Black feathers that catch the wind under your feet. (Tengu Peaks chest)' },
  { id: 'kage-garb', name: 'Shadow Garb', jp: '影装束', def: 0.08, hp: 10, perk: 'dodge', cost: 0, level: 1, color: '#2a1840', found: true, blurb: 'Hard to look at directly. Harder still to hit. (Shadow Castle chest)' },
  { id: 'kappa-shell', name: 'Kappa-Shell Guard', jp: '甲羅の守り', def: 0.18, hp: 30, perk: 'regen', cost: 0, level: 1, color: '#2e6b46', found: true, blurb: 'A shell plate that never dries out, and slowly mends you. (Kappa River chest)' },
  { id: 'frost-mail', name: 'Frost-Rimed Ō-yoroi', jp: '霜の大鎧', def: 0.24, hp: 35, perk: 'chill', cost: 0, level: 1, color: '#9fc5dc', found: true, blurb: 'Great armour rimed with frost that never melts. (Frozen Pass chest)' },
  { id: 'tennin-robe', name: 'Tennin’s Feather Robe', jp: '天女の羽衣', def: 0.12, hp: 20, perk: 'air', cost: 0, level: 1, color: '#f3e5f5', found: true, blurb: 'A robe of heaven: you can almost fly in it. (Hidden on the journey: the Cloud Capital)' },
  { id: 'dragon-armour', name: 'Dragon-Scale Armour', jp: '龍鱗の鎧', def: 0.3, hp: 50, perk: 'fireward', cost: 0, level: 1, color: '#c7a13c', found: true, blurb: 'Scales of a dragon laced in gold. Fire slides off it. (Void Gate chest)' },
]

export const ARMOR_BY_ID = Object.fromEntries(ARMORS.map((a) => [a.id, a])) as Record<ArmorId, ArmorDef>

// ─── Gear found by exploring ───────────────────────────────────────────

export type GearId = SwordId | ArmorId

export const isSword = (id: string): id is SwordId => id in SWORD_BY_ID
export const isArmor = (id: string): id is ArmorId => id in ARMOR_BY_ID
export const gearName = (id: GearId) => (isSword(id) ? SWORD_BY_ID[id].name : ARMOR_BY_ID[id].name)

/** Each world's third stage hides a treasure chest in a corner of the arena. */
export const CHESTS: GearId[] = ['hotarumaru', 'oni-hide', 'tengu-cloak', 'kage-garb', 'kogarasu', 'kappa-shell', 'muramasa', 'frost-mail', 'kusanagi', 'dragon-armour']
/** What a world's boss leaves behind (if anything). */
export const BOSS_DROPS: (GearId | undefined)[] = [undefined, undefined, undefined, undefined, undefined, 'kappa-oar', undefined, undefined, undefined, 'masamune']

/**
 * Caches hidden in the wide world of the main journey (out-of-the-way
 * corners of each region): ninja gear, or secret Ink Scrolls that each give
 * one more Ink Arts point. See story/tales/ninjaCaches.ts for where.
 */
export type CacheLoot = { gear: GearId } | { scroll: true }

// ─── Ink Arts: the special move's magic ────────────────────────────────

export type Element = 'fire' | 'frost' | 'thunder' | 'wind' | 'shadow'
export type Upgrade = 'focus' | 'power' | 'mend' | 'barrier' | 'surge'
export type Tech = 'rising' | 'plunge' | 'riposte' | 'dashcut'
export type ArtId = `el:${Element}` | `up:${Upgrade}` | `tech:${Tech}`

export interface ArtDef {
  id: ArtId
  name: string
  jp: string
  icon: string
  /** Points per rank. */
  cost: number
  ranks: number
  color: string
  desc: string
  /** Needs this art first. */
  needs?: ArtId
}

export const ARTS: ArtDef[] = [
  // Elements: learn any, infuse one into the special at a time.
  { id: 'el:fire', name: 'Fire Infusion', jp: '火遁', icon: '🔥', cost: 2, ranks: 1, color: '#ff7043', desc: 'Special hits set foes ablaze, and it opens with a burst of flame around you.' },
  { id: 'el:frost', name: 'Frost Infusion', jp: '氷遁', icon: '❄️', cost: 2, ranks: 1, color: '#81d4fa', desc: 'Special hits freeze foes solid for a moment, then leave them chilled and slow.' },
  { id: 'el:thunder', name: 'Thunder Infusion', jp: '雷遁', icon: '⚡', cost: 2, ranks: 1, color: '#ffe066', desc: 'Special hits arc lightning to two more foes nearby (at 40% strength).' },
  { id: 'el:wind', name: 'Wind Infusion', jp: '風遁', icon: '🌪️', cost: 2, ranks: 1, color: '#a5d6a7', desc: 'The special reaches farther, drags foes in first, and hurls them away.' },
  { id: 'el:shadow', name: 'Shadow Infusion', jp: '影遁', icon: '🌑', cost: 2, ranks: 1, color: '#b388ff', desc: 'Special hits drink life and mark foes: marked foes take a quarter more damage.' },
  // Upgrades to the special itself.
  { id: 'up:focus', name: 'Focus', jp: '集中', icon: '🧘', cost: 1, ranks: 3, color: '#64b5f6', desc: 'The special meter fills 10% faster per rank.' },
  { id: 'up:power', name: 'Might', jp: '剛力', icon: '💥', cost: 1, ranks: 3, color: '#ef5350', desc: 'The special hits 15% harder per rank.' },
  { id: 'up:mend', name: 'Mending Ink', jp: '癒し', icon: '💚', cost: 1, ranks: 3, color: '#66bb6a', desc: 'Unleashing the special heals 4% of your health per rank.' },
  { id: 'up:barrier', name: 'Ink Barrier', jp: '結界', icon: '🛡️', cost: 1, ranks: 3, color: '#4dd0e1', desc: 'After the special, a barrier soaks up 7% of your health in damage per rank, for 6 seconds.' },
  { id: 'up:surge', name: 'Opening Surge', jp: '先手', icon: '⏩', cost: 1, ranks: 3, color: '#ffca28', desc: 'Start every fight with 15% of the meter filled per rank.' },
  // Techniques: new moves.
  { id: 'tech:rising', name: 'Rising Dragon', jp: '昇龍', icon: '🐉', cost: 1, ranks: 1, color: '#ff8a65', desc: 'Hold ▼ and attack on the ground: an uppercut that launches foes into the air.' },
  { id: 'tech:plunge', name: 'Falling Star', jp: '落星', icon: '🌠', cost: 1, ranks: 1, color: '#9575cd', desc: 'Hold ▼ and attack in the air: plunge down with a shockwave on landing.' },
  { id: 'tech:riposte', name: 'Riposte', jp: '返し', icon: '↩️', cost: 1, ranks: 1, color: '#fff176', desc: 'A perfect parry strikes straight back for double damage.' },
  { id: 'tech:dashcut', name: 'Passing Cut', jp: '抜き打ち', icon: '🌬️', cost: 1, ranks: 1, color: '#80deea', desc: 'Your dash cuts every foe you pass through.', needs: 'tech:riposte' },
]

export const ART_BY_ID = Object.fromEntries(ARTS.map((a) => [a.id, a])) as Record<ArtId, ArtDef>

/** What the fight needs to know about the Ink Arts. */
export interface Arts {
  element?: Element
  rank: (id: ArtId) => number
}

export const rankOf = (save: NinjaSave, id: ArtId) => save.arts?.[id] ?? 0

export const artsOf = (save: NinjaSave): Arts => ({ element: save.element && rankOf(save, `el:${save.element}`) > 0 ? save.element : undefined, rank: (id) => rankOf(save, id) })

/** Points earned: one every second level, plus one for each Ink Scroll found on the journey. */
export const artPoints = (save: NinjaSave) => Math.floor(save.level / 2) + (save.scrolls ?? 0)

export const artSpent = (save: NinjaSave) => Object.entries(save.arts ?? {}).reduce((a, [id, r]) => a + (ART_BY_ID[id as ArtId]?.cost ?? 0) * (r ?? 0), 0)

export const artFree = (save: NinjaSave) => artPoints(save) - artSpent(save)

export type LearnCheck = 'ok' | 'max' | 'points' | 'needs'

export function canLearn(save: NinjaSave, id: ArtId): LearnCheck {
  const a = ART_BY_ID[id]
  if (rankOf(save, id) >= a.ranks) return 'max'
  if (a.needs && rankOf(save, a.needs) <= 0) return 'needs'
  if (artFree(save) < a.cost) return 'points'
  return 'ok'
}

export function learnArt(save: NinjaSave, id: ArtId): NinjaSave | null {
  if (canLearn(save, id) !== 'ok') return null
  const arts = { ...(save.arts ?? {}), [id]: rankOf(save, id) + 1 }
  const el = id.startsWith('el:') && !save.element ? (id.slice(3) as Element) : save.element
  return { ...save, arts, element: el }
}

/** Take back every point (free, any time between fights). */
export const resetArts = (save: NinjaSave): NinjaSave => ({ ...save, arts: {}, element: undefined })

export const infuse = (save: NinjaSave, el: Element | undefined): NinjaSave => (el && rankOf(save, `el:${el}`) <= 0 ? save : { ...save, element: el })

// ─── The hero's progress ───────────────────────────────────────────────

export interface NinjaSave {
  level: number
  xp: number
  ryo: number
  owned: SwordId[]
  sword: SwordId
  /** Stages cleared in order: stage `cleared` is the next one open. */
  cleared: number
  armors?: ArmorId[]
  armor?: ArmorId
  arts?: Partial<Record<ArtId, number>>
  element?: Element
  /** Ink Scrolls found on the journey (one Ink Arts point each). */
  scrolls?: number
  /** Highest Ink Abyss floor reached (0 = only the first is open). */
  abyss?: number
}

export const freshNinja = (): NinjaSave => ({ level: 1, xp: 0, ryo: 0, owned: ['bokken'], sword: 'bokken', cleared: 0, armors: ['gi'], armor: 'gi', arts: {}, scrolls: 0, abyss: 0 })

export const armorOf = (save: NinjaSave) => ARMOR_BY_ID[save.armor ?? 'gi'] ?? ARMOR_BY_ID.gi
export const armorsOf = (save: NinjaSave): ArmorId[] => save.armors ?? ['gi']

export const hasGear = (save: NinjaSave, id: GearId) => (isSword(id) ? save.owned.includes(id) : armorsOf(save).includes(id))

/** Add found gear (no-op if already owned). */
export function giveGear(save: NinjaSave, id: GearId): NinjaSave {
  if (hasGear(save, id)) return save
  return isSword(id) ? { ...save, owned: [...save.owned, id] } : { ...save, armors: [...armorsOf(save), id] }
}

export const xpToNext = (level: number) => 40 + 30 * level + 5 * level * level

export function heroStats(level: number) {
  return { hp: 100 + 12 * (level - 1), atkMul: 1 + 0.045 * (level - 1) }
}

export function stageUnlocked(save: NinjaSave, index: number) {
  if (index >= STAGE_COUNT) return save.cleared >= FIRST_WORLDS * STAGES_PER_WORLD && index - STAGE_COUNT <= (save.abyss ?? 0)
  return index <= save.cleared && index < STAGE_COUNT
}

/** Ryō for clearing a stage, on top of what the foes drop. */
export const clearBonus = (stage: Stage) => 25 * (Math.min(stage.index, STAGE_COUNT) + 1) + (stage.boss ? 150 : 0)

/** Spirit shards for the main journey, for a first clear. */
export const firstClearShards = (stage: Stage) => (stage.boss ? 10 + 5 * Math.min(stage.world, 6) : 2)

export interface StageResult {
  save: NinjaSave
  levelsGained: number
  firstClear: boolean
  shards: number
  xp: number
  ryo: number
  /** Gear picked up in the fight that was new. */
  found: GearId[]
}

/** Bank what a fight earned. Losing keeps the XP, half the ryō, and anything found. */
export function settleStage(save: NinjaSave, stage: Stage, won: boolean, xp: number, ryo: number, found: GearId[] = []): StageResult {
  const firstClear = won && stage.abyss === undefined && stage.index === save.cleared
  const gotRyo = won ? ryo + clearBonus(stage) : Math.floor(ryo / 2)
  let level = save.level
  let pool = save.xp + xp
  let levelsGained = 0
  while (pool >= xpToNext(level)) {
    pool -= xpToNext(level)
    level++
    levelsGained++
  }
  let next: NinjaSave = { ...save, level, xp: pool, ryo: save.ryo + gotRyo, cleared: firstClear ? save.cleared + 1 : save.cleared }
  if (won && stage.abyss !== undefined) next.abyss = Math.max(save.abyss ?? 0, stage.abyss + 1)
  const fresh = found.filter((g, i) => found.indexOf(g) === i && !hasGear(save, g))
  for (const g of fresh) next = giveGear(next, g)
  return {
    save: next,
    levelsGained,
    firstClear,
    shards: firstClear ? firstClearShards(stage) : 0,
    xp,
    ryo: gotRyo,
    found: fresh,
  }
}

export type BuyCheck = 'ok' | 'owned' | 'level' | 'ryo' | 'found'

export function canBuy(save: NinjaSave, id: SwordId): BuyCheck {
  const s = SWORD_BY_ID[id]
  if (save.owned.includes(id)) return 'owned'
  if (s.found) return 'found'
  if (save.level < s.level) return 'level'
  if (save.ryo < s.cost) return 'ryo'
  return 'ok'
}

export function buySword(save: NinjaSave, id: SwordId): NinjaSave | null {
  if (canBuy(save, id) !== 'ok') return null
  return { ...save, ryo: save.ryo - SWORD_BY_ID[id].cost, owned: [...save.owned, id], sword: id }
}

export function canBuyArmor(save: NinjaSave, id: ArmorId): BuyCheck {
  const a = ARMOR_BY_ID[id]
  if (armorsOf(save).includes(id)) return 'owned'
  if (a.found) return 'found'
  if (save.level < a.level) return 'level'
  if (save.ryo < a.cost) return 'ryo'
  return 'ok'
}

export function buyArmor(save: NinjaSave, id: ArmorId): NinjaSave | null {
  if (canBuyArmor(save, id) !== 'ok') return null
  return { ...save, ryo: save.ryo - ARMOR_BY_ID[id].cost, armors: [...armorsOf(save), id], armor: id }
}

/**
 * The Hidden Village (隠れ里): the player's own village to build up between
 * adventures. Huts produce wood, stone and rice over real time (also while
 * the game is closed, up to what the storehouse holds); resources build and
 * upgrade more buildings; and buildings make the mage stronger everywhere:
 * the dojo adds HP, the forge attack, the shrine magic, the apothecary brews
 * herbs, the teahouse earns shards. Every few hours yokai raid the village
 * and the mage defends it in a real battle.
 *
 * Everything here is pure (state in, state out) so it can be tested; the
 * screen is src/screens/Hamlet.tsx.
 */

export type Resource = 'wood' | 'stone' | 'rice'
export type Cost = Partial<Record<Resource | 'shards', number>>

export type BuildingId = 'manor' | 'lumber' | 'quarry' | 'paddy' | 'storehouse' | 'dojo' | 'forge' | 'shrine' | 'apothecary' | 'teahouse' | 'wall'

export interface BuildingDef {
  id: BuildingId
  name: string
  jp: string
  kana: string
  emoji: string
  /** What it does, for the build menu. */
  desc: string
  max: number
  /** Cost to reach level 1; later levels scale up. */
  base: Cost
  /** Build time for level 1, in seconds. */
  time: number
  /** Only one of these per village. */
  unique?: boolean
  /** Manor level needed before it can be built. */
  needs?: number
}

export const BUILDINGS: BuildingDef[] = [
  { id: 'manor', name: 'Manor', jp: '屋敷', kana: 'やしき', emoji: '🏯', desc: 'The heart of the village. Its level caps every other building and opens more land.', max: 5, base: { wood: 120, stone: 120, rice: 80 }, time: 60, unique: true },
  { id: 'lumber', name: 'Woodcutter’s Hut', jp: '木こり小屋', kana: 'きこりごや', emoji: '🪓', desc: 'Cuts wood from the hills.', max: 5, base: { rice: 30 }, time: 15 },
  { id: 'quarry', name: 'Quarry', jp: '石切り場', kana: 'いしきりば', emoji: '⛏️', desc: 'Breaks stone from the cliffs.', max: 5, base: { wood: 40, rice: 20 }, time: 20 },
  { id: 'paddy', name: 'Rice Paddy', jp: '田んぼ', kana: 'たんぼ', emoji: '🌾', desc: 'Grows rice to feed builders and defenders.', max: 5, base: { wood: 30 }, time: 15 },
  { id: 'storehouse', name: 'Storehouse', jp: '倉', kana: 'くら', emoji: '🏚️', desc: 'Holds more of every resource.', max: 5, base: { wood: 80, stone: 40 }, time: 30 },
  { id: 'dojo', name: 'Dojo', jp: '道場', kana: 'どうじょう', emoji: '🥋', desc: 'Training hall: more HP in every battle.', max: 5, base: { wood: 120, stone: 60, rice: 60 }, time: 45, unique: true, needs: 1 },
  { id: 'forge', name: 'Forge', jp: '鍛冶屋', kana: 'かじや', emoji: '⚒️', desc: 'Sharper staffs: more attack in every battle.', max: 5, base: { wood: 80, stone: 120, rice: 40 }, time: 45, unique: true, needs: 2 },
  { id: 'shrine', name: 'Village Shrine', jp: '祠', kana: 'ほこら', emoji: '⛩️', desc: 'Prayers before battle: more magic and MP.', max: 5, base: { wood: 100, stone: 100, rice: 100 }, time: 60, unique: true, needs: 2 },
  { id: 'apothecary', name: 'Apothecary', jp: '薬屋', kana: 'くすりや', emoji: '🌿', desc: 'Brews healing herbs for your bag.', max: 5, base: { wood: 90, rice: 90 }, time: 40, unique: true, needs: 1 },
  { id: 'teahouse', name: 'Teahouse', jp: '茶屋', kana: 'ちゃや', emoji: '🍵', desc: 'Travellers stop for tea and leave spirit shards.', max: 5, base: { wood: 150, stone: 80, rice: 120 }, time: 60, unique: true, needs: 3 },
  { id: 'wall', name: 'Stone Wall', jp: '石垣', kana: 'いしがき', emoji: '🧱', desc: 'Fewer raiders get through, and less is lost when they do.', max: 5, base: { stone: 150 }, time: 40, unique: true, needs: 2 },
]
export const BUILDING_BY_ID = new Map(BUILDINGS.map((b) => [b.id, b]))

export interface Plot {
  /** Building on this plot. */
  id: BuildingId
  level: number
  /** When the current construction or upgrade finishes (ms epoch); 0 if idle. */
  until: number
}

export interface HamletState {
  /** Plots by grid index. */
  plots: Record<number, Plot>
  res: Record<Resource, number>
  /** Last time production was settled. */
  tick: number
  /** Herbs brewed and waiting to be collected. */
  herbs: number
  /** Herb brewing progress (0..1). */
  brew: number
  /** Shards earned at the teahouse, waiting to be collected. */
  tea: number
  /** When the next raid arrives (ms epoch). */
  raidAt: number
  raidsWon: number
  raidsLost: number
}

export const COLS = 6
export const ROWS = 5
const HOUR = 3600_000
export const RAID_EVERY = 3 * HOUR

export function freshHamlet(now = Date.now()): HamletState {
  return {
    plots: { 14: { id: 'manor', level: 1, until: 0 } },
    res: { wood: 100, stone: 50, rice: 100 },
    tick: now,
    herbs: 0,
    brew: 0,
    tea: 0,
    raidAt: now + RAID_EVERY,
    raidsWon: 0,
    raidsLost: 0,
  }
}

/** Highest finished level of a building type (0 if none). */
export function levelOf(h: HamletState, id: BuildingId, now = Date.now()): number {
  let best = 0
  for (const p of Object.values(h.plots)) if (p.id === id) best = Math.max(best, done(p, now) ? p.level : p.level - 1)
  return best
}

const done = (p: Plot, now: number) => !p.until || p.until <= now

/** Finished levels of every plot of a type, summed (several huts add up). */
export function totalLevels(h: HamletState, id: BuildingId, now = Date.now()): number {
  let n = 0
  for (const p of Object.values(h.plots)) if (p.id === id) n += done(p, now) ? p.level : p.level - 1
  return n
}

export const manorLevel = (h: HamletState, now = Date.now()) => Math.max(1, levelOf(h, 'manor', now))

/** Land you may build on: grows with the manor. */
export function openPlots(h: HamletState, now = Date.now()): number {
  return Math.min(COLS * ROWS, 8 + manorLevel(h, now) * 4)
}

export function capacity(h: HamletState, now = Date.now()): number {
  return 400 + totalLevels(h, 'storehouse', now) * 500 + manorLevel(h, now) * 100
}

/** Hourly production per resource. */
export function production(h: HamletState, now = Date.now()): Record<Resource, number> {
  return { wood: totalLevels(h, 'lumber', now) * 60, stone: totalLevels(h, 'quarry', now) * 40, rice: totalLevels(h, 'paddy', now) * 50 }
}

export function costOf(id: BuildingId, toLevel: number): Cost {
  const b = BUILDING_BY_ID.get(id)!
  const k = Math.pow(toLevel, 1.6)
  const out: Cost = {}
  for (const [r, n] of Object.entries(b.base) as [keyof Cost, number][]) out[r] = Math.round((n * k) / 5) * 5
  // the later levels of the big buildings also take a few spirit shards
  if (toLevel >= 3 && (b.unique || id === 'storehouse')) out.shards = (toLevel - 2) * 10
  return out
}

export const buildTime = (id: BuildingId, toLevel: number) => Math.round(BUILDING_BY_ID.get(id)!.time * toLevel * toLevel)

export function affordable(h: HamletState, shards: number, cost: Cost): boolean {
  for (const [r, n] of Object.entries(cost) as [keyof Cost, number][]) {
    if (r === 'shards') {
      if (shards < n) return false
    } else if (h.res[r] < n) return false
  }
  return true
}

/** Why a building can't be built/upgraded right now (null if it can). */
export function blocker(h: HamletState, id: BuildingId, toLevel: number, now = Date.now()): string | null {
  const b = BUILDING_BY_ID.get(id)!
  if (toLevel > b.max) return 'Fully upgraded'
  if (id !== 'manor' && toLevel > manorLevel(h, now)) return `Needs a level ${toLevel} Manor`
  if (toLevel === 1 && (b.needs ?? 0) > manorLevel(h, now)) return `Needs a level ${b.needs} Manor`
  if (toLevel === 1 && b.unique && Object.values(h.plots).some((p) => p.id === id)) return 'Only one per village'
  const builders = Object.values(h.plots).filter((p) => !done(p, now)).length
  if (builders >= 2) return 'Both builders are busy'
  return null
}

/** Settle production, brewing and tea up to `now`. */
export function settle(h: HamletState, now = Date.now()): HamletState {
  const dt = Math.max(0, now - h.tick) / HOUR
  if (dt <= 0) return h
  const cap = capacity(h, now)
  const prod = production(h, now)
  const res = { ...h.res }
  for (const r of Object.keys(res) as Resource[]) res[r] = Math.min(cap, res[r] + prod[r] * dt)
  // herbs: one per (4 / level) hours, up to five waiting
  const apo = levelOf(h, 'apothecary', now)
  let brew = h.brew + (apo ? (dt * apo) / 4 : 0)
  let herbs = h.herbs
  while (brew >= 1 && herbs < 5) {
    brew -= 1
    herbs += 1
  }
  if (herbs >= 5) brew = 0
  const tea = Math.min(200, h.tea + levelOf(h, 'teahouse', now) * 4 * dt)
  return { ...h, res, herbs, brew, tea, tick: now }
}

/** Pay and start building (or upgrading) on a plot. */
export function startBuild(h: HamletState, shards: number, plot: number, id: BuildingId, now = Date.now()): { h: HamletState; shards: number } | null {
  const cur = h.plots[plot]
  if (cur && cur.id !== id) return null
  if (!cur && plot >= openPlots(h, now)) return null
  const to = (cur?.level ?? 0) + 1
  if (cur && !done(cur, now)) return null
  if (blocker(h, id, to, now)) return null
  const cost = costOf(id, to)
  if (!affordable(h, shards, cost)) return null
  const res = { ...h.res }
  for (const r of ['wood', 'stone', 'rice'] as Resource[]) res[r] -= cost[r] ?? 0
  return { h: { ...h, res, plots: { ...h.plots, [plot]: { id, level: to, until: now + buildTime(id, to) * 1000 } } }, shards: shards - (cost.shards ?? 0) }
}

/** Finish a construction early for spirit shards (1 per 30 s left, at least 1). */
export const rushCost = (p: Plot, now = Date.now()) => (done(p, now) ? 0 : Math.max(1, Math.ceil((p.until - now) / 30_000)))

// ─── The mage's bonuses ────────────────────────────────────────────────

export interface HamletBonus {
  hp: number
  mp: number
  atk: number
  magic: number
}

export function bonuses(h: HamletState | undefined, now = Date.now()): HamletBonus {
  if (!h) return { hp: 0, mp: 0, atk: 0, magic: 0 }
  const dojo = levelOf(h, 'dojo', now)
  const forge = levelOf(h, 'forge', now)
  const shrine = levelOf(h, 'shrine', now)
  return { hp: dojo * 6, mp: shrine * 3, atk: forge * 2, magic: shrine * 2 }
}

// ─── Raids ─────────────────────────────────────────────────────────────

export const raidDue = (h: HamletState, now = Date.now()) => now >= h.raidAt

/** How many yokai reach the gate (the wall turns some back). */
export function raiders(h: HamletState, now = Date.now()): number {
  const wall = levelOf(h, 'wall', now)
  return Math.max(1, Math.min(3, 1 + Math.floor(manorLevel(h, now) / 2) + (h.raidsWon > 2 ? 1 : 0) - Math.floor(wall / 2)))
}

/** The spoils of a won raid. */
export function raidReward(h: HamletState, now = Date.now()): { res: Record<Resource, number>; shards: number } {
  const m = manorLevel(h, now)
  return { res: { wood: 60 * m, stone: 40 * m, rice: 50 * m }, shards: 10 + m * 5 }
}

/** Settle a raid: winning brings spoils; losing costs a share of the stores (less behind a wall). */
export function endRaid(h: HamletState, won: boolean, now = Date.now()): HamletState {
  const s = settle(h, now)
  const next = now + RAID_EVERY
  if (won) {
    const r = raidReward(s, now)
    const cap = capacity(s, now)
    const res = { ...s.res }
    for (const k of Object.keys(res) as Resource[]) res[k] = Math.min(cap, res[k] + r.res[k])
    return { ...s, res, raidAt: next, raidsWon: s.raidsWon + 1 }
  }
  const keep = 0.75 + levelOf(s, 'wall', now) * 0.04
  const res = { ...s.res }
  for (const k of Object.keys(res) as Resource[]) res[k] = Math.floor(res[k] * keep)
  return { ...s, res, raidAt: next, raidsLost: s.raidsLost + 1 }
}

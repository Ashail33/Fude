import { useSyncExternalStore } from 'react'
import { ACTIVITIES, ACTIVITY_BY_ID, activitiesFor, bossOf, REGIONS } from '../data/regions'
import { RADICALS } from '../data/kanji'
import type { Activity, GameResult } from '../games/types'
import { EFFECTS, levelForXp, OUTFITS } from './rewards'
import { newCard, review, type Review, type SrsCard } from './srs'
import { todayKey } from './random'

export type ImmersionLevel = 0 | 1 | 2 | 3

export interface Settings {
  /** 'auto' follows player level; a number pins the UI language mix. */
  immersion: 'auto' | ImmersionLevel
  showRomaji: boolean
  /** Blend learned Japanese words into English instructions, little by little. */
  weave: boolean
  sound: boolean
  voice: boolean
  speechRate: number
  /** Optional Anthropic API key for Echo-Soul AI conversations. Stored locally only. */
  apiKey: string
  aiModel: string
}

export interface ActivityProgress {
  stars: number
  best: number
  plays: number
  lastPlayed: number
}

export interface Heroic {
  activityId: string
  title: string
  at: number
}

export interface Quest {
  id: string
  title: string
  story: string
  storyJp: string
  wordIds: string[]
  game: 'spell-defense' | 'speedcast' | 'listening' | 'lesson'
  xp: number
  done: boolean
}

export interface PlayerState {
  version: 1
  name: string
  createdAt: number
  xp: number
  /** Spirit shards (ことだま) currency, earned alongside XP. */
  shards: number
  srs: Record<string, SrsCard>
  progress: Record<string, ActivityProgress>
  /** Elemental spells obtained from NPCs. */
  spells: string[]
  discoveredKanji: string[]
  unlockedRadicals: string[]
  outfit: string
  effect: string
  heroic: Record<string, Heroic>
  npcTrust: Record<string, number>
  quests: { day: string; list: Quest[] }
  streak: { last: string; count: number }
  daily: Record<string, { xp: number; ms: number; games: number }>
  settings: Settings
  onboarded: boolean
  /** Where the mage stands in the overworld (map id + tile coords + facing). */
  world: WorldPos
  /** Consumable items by id (see engine/items catalogue in battle/items.ts). */
  bag: Record<string, number>
  /** Story beats already shown (cutscene ids). */
  seenScenes: string[]
  /** Map object ids opened once (chests etc.). */
  opened: string[]
  /** Story flags and tale stages (see src/story/tales). */
  flags: Record<string, number>
  /** Key (story) items carried, by id. */
  keyItems: string[]
  /** Sightings of everyday words woven into instructions (see engine/weave). */
  weave?: Record<string, number>
}

export interface WorldPos {
  map: string
  x: number
  y: number
  dir: 'up' | 'down' | 'left' | 'right'
}

export const START_POS: WorldPos = { map: 'village', x: 12, y: 14, dir: 'down' }

const KEY = 'fude.kotoba.save.v1'

export const DEFAULT_SETTINGS: Settings = {
  immersion: 'auto',
  showRomaji: true,
  weave: true,
  sound: true,
  voice: true,
  speechRate: 0.9,
  apiKey: '',
  aiModel: 'claude-sonnet-5-5',
}

export function freshState(): PlayerState {
  return {
    version: 1,
    name: '',
    createdAt: Date.now(),
    xp: 0,
    shards: 0,
    srs: {},
    progress: {},
    spells: [],
    discoveredKanji: [],
    unlockedRadicals: RADICALS.filter((r) => r.starter).map((r) => r.char),
    outfit: 'apprentice',
    effect: 'sparkle',
    heroic: {},
    npcTrust: {},
    quests: { day: '', list: [] },
    streak: { last: '', count: 0 },
    daily: {},
    settings: { ...DEFAULT_SETTINGS },
    onboarded: false,
    world: { ...START_POS },
    bag: { herb: 3 },
    seenScenes: [],
    opened: [],
    flags: {},
    keyItems: [],
  }
}

function load(): PlayerState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return freshState()
    const parsed = JSON.parse(raw) as Partial<PlayerState>
    const base = freshState()
    return { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings } }
  } catch {
    return freshState()
  }
}

let state: PlayerState = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable (private mode) – keep in memory */
  }
}

export function getState(): PlayerState {
  return state
}

export function setState(updater: (s: PlayerState) => PlayerState) {
  state = updater(state)
  persist()
  listeners.forEach((l) => l())
}

export function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function usePlayer(): PlayerState {
  return useSyncExternalStore(subscribe, getState, getState)
}

export function resetProgress() {
  const settings = state.settings
  state = { ...freshState(), settings }
  persist()
  listeners.forEach((l) => l())
}

export function exportSave(): string {
  return JSON.stringify(state)
}

export function importSave(json: string) {
  const parsed = JSON.parse(json) as PlayerState
  if (parsed.version !== 1 || typeof parsed.srs !== 'object') throw new Error('Not a Kotoba no Mahō save file')
  setState(() => ({ ...freshState(), ...parsed }))
}

// ─── Derived helpers ───────────────────────────────────────────────────

export function level(s: PlayerState = state): number {
  return levelForXp(s.xp)
}

export function immersionOf(s: PlayerState = state): ImmersionLevel {
  if (s.settings.immersion !== 'auto') return s.settings.immersion
  const l = level(s)
  // whole sentences switch late and slowly; until then single learned words
  // are woven into the English (engine/weave)
  if (l < 6) return 0
  if (l < 12) return 1
  if (l < 18) return 2
  return 3
}

export function isPassed(s: PlayerState, activityId: string): boolean {
  return (s.progress[activityId]?.stars ?? 0) > 0
}

export function regionUnlocked(s: PlayerState, region: number): boolean {
  if (region <= 1) return true
  return isPassed(s, bossOf(region - 1).id)
}

export function activityUnlocked(s: PlayerState, a: Activity): boolean {
  if (!regionUnlocked(s, a.region)) return false
  const list = activitiesFor(a.region)
  const i = list.findIndex((x) => x.id === a.id)
  if (i <= 0) return true
  // Learn/practice unlock sequentially; everything before must be passed.
  return isPassed(s, list[i - 1].id)
}

export function regionMastered(s: PlayerState, region: number): boolean {
  return activitiesFor(region).every((a) => (s.progress[a.id]?.stars ?? 0) >= 1) &&
    activitiesFor(region).some((a) => a.stage === 'mastery' && isPassed(s, a.id))
}

export function outfitUnlocked(s: PlayerState, id: string): boolean {
  const o = OUTFITS.find((x) => x.id === id)
  if (!o) return false
  const u = o.unlock
  switch (u.kind) {
    case 'start':
      return true
    case 'level':
      return level(s) >= u.level
    case 'region':
      return regionUnlocked(s, u.region)
    case 'mastery':
      return regionMastered(s, u.region)
  }
}

export function effectUnlocked(s: PlayerState, id: string): boolean {
  const e = EFFECTS.find((x) => x.id === id)
  if (!e) return false
  const u = e.unlock
  switch (u.kind) {
    case 'start':
      return true
    case 'level':
      return level(s) >= u.level
    case 'boss':
      return isPassed(s, u.activityId)
  }
}

export function starsFor(result: GameResult): number {
  const acc = result.maxScore > 0 ? result.score / result.maxScore : 0
  const passed = result.passed ?? acc >= 0.6
  if (!passed) return 0
  if (acc >= 0.95) return 3
  if (acc >= 0.8) return 2
  return 1
}

// ─── Mutations ─────────────────────────────────────────────────────────

export function applyReviews(s: PlayerState, reviews: Review[], now = Date.now()): PlayerState {
  if (!reviews.length) return s
  const srs = { ...s.srs }
  for (const r of reviews) srs[r.itemId] = review(srs[r.itemId] ?? newCard(r.itemId, now), r, now)
  return { ...s, srs }
}

export function recordReviews(reviews: Review[]) {
  setState((s) => applyReviews(s, reviews))
}

export interface Outcome {
  stars: number
  prevStars: number
  xp: number
  shards: number
  levelBefore: number
  levelAfter: number
  unlockedActivities: Activity[]
  unlockedRegion?: number
  newOutfits: string[]
  newEffects: string[]
}

/** Record a finished game: SRS, stars, XP, streak, unlocks. */
export function recordResult(activity: Activity, result: GameResult, durationMs: number, xpMultiplier = 1): Outcome {
  const before = state
  const stars = starsFor(result)
  const prev = before.progress[activity.id]
  const prevStars = prev?.stars ?? 0
  const acc = result.maxScore > 0 ? result.score / result.maxScore : 0

  const stageBonus = { learn: 1, practice: 1.2, challenge: 1.5, boss: 3, mastery: 2.5 }[activity.stage]
  const firstClear = stars > 0 && prevStars === 0 ? 1.5 : 1
  const xp = Math.round((10 + 40 * acc) * stageBonus * firstClear * xpMultiplier)
  const shards = Math.round(xp / 5) + (stars > prevStars ? (stars - prevStars) * 5 : 0)

  const day = todayKey()
  const yesterday = todayKey(new Date(Date.now() - 86400000))
  const streak =
    before.streak.last === day
      ? before.streak
      : { last: day, count: before.streak.last === yesterday ? before.streak.count + 1 : 1 }

  let s = applyReviews(before, result.reviews)
  const heroic = { ...s.heroic }
  for (const id of result.heroic ?? []) heroic[id] = { activityId: activity.id, title: activity.title, at: Date.now() }
  const d = s.daily[day] ?? { xp: 0, ms: 0, games: 0 }

  s = {
    ...s,
    xp: s.xp + xp,
    shards: s.shards + shards,
    heroic,
    streak,
    daily: { ...s.daily, [day]: { xp: d.xp + xp, ms: d.ms + durationMs, games: d.games + 1 } },
    progress: ACTIVITY_BY_ID.has(activity.id)
      ? {
          ...s.progress,
          [activity.id]: {
            stars: Math.max(prevStars, stars),
            best: Math.max(prev?.best ?? 0, Math.round(acc * 100)),
            plays: (prev?.plays ?? 0) + 1,
            lastPlayed: Date.now(),
          },
        }
      : s.progress,
  }

  const unlockedActivities = ACTIVITIES.filter((a) => !activityUnlocked(before, a) && activityUnlocked(s, a))
  const unlockedRegion = REGIONS.find((r) => !regionUnlocked(before, r.id) && regionUnlocked(s, r.id))?.id
  const newOutfits = OUTFITS.filter((o) => !outfitUnlocked(before, o.id) && outfitUnlocked(s, o.id)).map((o) => o.name)
  const newEffects = EFFECTS.filter((e) => !effectUnlocked(before, e.id) && effectUnlocked(s, e.id)).map((e) => e.name)

  setState(() => s)
  return {
    stars,
    prevStars,
    xp,
    shards,
    levelBefore: level(before),
    levelAfter: level(s),
    unlockedActivities,
    unlockedRegion,
    newOutfits,
    newEffects,
  }
}

export function updateSettings(patch: Partial<Settings>) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
}

export function grantSpell(spell: string) {
  setState((s) => (s.spells.includes(spell) ? s : { ...s, spells: [...s.spells, spell] }))
}

export function discoverKanji(char: string, unlocks: string[] = []) {
  setState((s) => ({
    ...s,
    discoveredKanji: s.discoveredKanji.includes(char) ? s.discoveredKanji : [...s.discoveredKanji, char],
    unlockedRadicals: [...new Set([...s.unlockedRadicals, ...unlocks])],
  }))
}

export function adjustTrust(npcId: string, delta: number) {
  setState((s) => ({ ...s, npcTrust: { ...s.npcTrust, [npcId]: Math.max(-5, Math.min(10, (s.npcTrust[npcId] ?? 0) + delta)) } }))
}

export function setWorldPos(pos: WorldPos) {
  setState((s) => ({ ...s, world: pos }))
}

/** Add (or remove, with a negative count) items from the bag. */
export function addItem(id: string, n = 1) {
  setState((s) => {
    const cur = (s.bag[id] ?? 0) + n
    const bag = { ...s.bag }
    if (cur <= 0) delete bag[id]
    else bag[id] = cur
    return { ...s, bag }
  })
}

export function spendShards(n: number): boolean {
  if (state.shards < n) return false
  setState((s) => ({ ...s, shards: s.shards - n }))
  return true
}

export function markScene(id: string) {
  setState((s) => (s.seenScenes.includes(id) ? s : { ...s, seenScenes: [...s.seenScenes, id] }))
}

export function markOpened(id: string) {
  setState((s) => (s.opened.includes(id) ? s : { ...s, opened: [...s.opened, id] }))
}

/** Grant XP and shards outside of an activity (battles, chests). */
export function grantRewards(xp: number, shards: number) {
  setState((s) => ({ ...s, xp: s.xp + xp, shards: s.shards + shards }))
}

// ─── Story flags & key items ───────────────────────────────────────────

export function flagOf(s: PlayerState, k: string): number {
  return s.flags?.[k] ?? 0
}

export function setFlag(k: string, v = 1) {
  setState((s) => ({ ...s, flags: { ...s.flags, [k]: v } }))
}

export function hasKeyItem(s: PlayerState, id: string): boolean {
  return (s.keyItems ?? []).includes(id)
}

export function giveKeyItem(id: string) {
  setState((s) => ((s.keyItems ?? []).includes(id) ? s : { ...s, keyItems: [...(s.keyItems ?? []), id] }))
}

export function takeKeyItem(id: string) {
  setState((s) => ({ ...s, keyItems: (s.keyItems ?? []).filter((x) => x !== id) }))
}

/**
 * Pure logic for G4 Magic Crafting: recipe matching, riddle selection
 * (Kanji Evolution) and map pattern detection (Shape the Land).
 */
import { findRecipe, REACTIONS, RECIPES, type KanjiRecipe, type Reaction } from '../data/kanji'

// ─── Kanji Evolution ────────────────────────────────────────────────────

export type FuseOutcome = { kind: 'fizzle' } | { kind: 'craft'; recipe: KanjiRecipe; isTarget: boolean; isNew: boolean; newRadicals: string[] }

/** Fuse the radicals in the altar slots. Empty slots are ignored. */
export function fuse(slots: (string | null)[], target: string | null, discovered: readonly string[], unlocked: readonly string[]): FuseOutcome {
  const parts = slots.filter((s): s is string => !!s)
  if (parts.length < 2) return { kind: 'fizzle' }
  const recipe = findRecipe(parts)
  if (!recipe) return { kind: 'fizzle' }
  return {
    kind: 'craft',
    recipe,
    isTarget: recipe.result === target,
    isNew: !discovered.includes(recipe.result),
    newRadicals: (recipe.unlocks ?? []).filter((u) => !unlocked.includes(u)),
  }
}

/** Recipes whose parts are all in the player's grimoire. */
export function craftable(unlocked: readonly string[]): KanjiRecipe[] {
  return RECIPES.filter((r) => r.parts.every((p) => unlocked.includes(p)))
}

/**
 * Picks the next riddle. Undiscovered-but-craftable recipes drive the story
 * forward (and unlock new radicals); discovered ones return as review
 * (weighted by SRS weakness). Never repeats `avoid` when there is a choice.
 */
export function pickRiddle(
  unlocked: readonly string[],
  discovered: readonly string[],
  weakness: (kanji: string) => number,
  avoid: readonly string[] = [],
  rng: () => number = Math.random,
  reviewChance = 0.3,
): KanjiRecipe | null {
  const all = craftable(unlocked)
  if (!all.length) return null
  const pool = all.filter((r) => !avoid.includes(r.result))
  const usable = pool.length ? pool : all
  const fresh = usable.filter((r) => !discovered.includes(r.result))
  const known = usable.filter((r) => discovered.includes(r.result))
  const useReview = known.length > 0 && (fresh.length === 0 || rng() < reviewChance)
  const list = useReview ? known : fresh
  // Fresh: prefer recipes that unlock something (keeps progression flowing),
  // otherwise simple 2-part recipes first. Review: weight by weakness.
  const weight = (r: KanjiRecipe) => (useReview ? 0.2 + weakness(r.result) : (r.unlocks?.length ? 2 : 1) * (r.parts.length === 2 ? 1.5 : 1))
  const total = list.reduce((s, r) => s + weight(r), 0)
  let x = rng() * total
  for (const r of list) {
    x -= weight(r)
    if (x <= 0) return r
  }
  return list[list.length - 1]
}

/** Emoji scene for the "growing world" strip: 森 grows three trees, etc. */
export function sceneFor(recipe: KanjiRecipe): string[] {
  const same = recipe.parts.every((p) => p === recipe.parts[0])
  return Array.from({ length: same ? recipe.parts.length : 1 }, () => recipe.emoji)
}

/** Riddle score: 2 for a clean solve, 1 if it took fizzles or hints. */
export function riddlePoints(fizzles: number, hints: number): number {
  return fizzles === 0 && hints === 0 ? 2 : 1
}

// ─── Shape the Land ─────────────────────────────────────────────────────

export const ELEMENTS = ['火', '水', '木', '土', '石', '日'] as const
export type Element = (typeof ELEMENTS)[number]

/** Vocabulary word id for each element spell. */
export const ELEMENT_WORD: Record<Element, string> = { 火: 'hi', 水: 'mizu', 木: 'ki', 土: 'tsuchi', 石: 'ishi', 日: 'hi-sun' }
export const ELEMENT_INFO: Record<Element, { reading: string; en: string; emoji: string; color: string }> = {
  火: { reading: 'ひ', en: 'fire', emoji: '🔥', color: 'var(--fire)' },
  水: { reading: 'みず', en: 'water', emoji: '💧', color: 'var(--water)' },
  木: { reading: 'き', en: 'tree', emoji: '🌳', color: 'var(--wood)' },
  土: { reading: 'つち', en: 'earth', emoji: '🟫', color: 'var(--earth)' },
  石: { reading: 'いし', en: 'stone', emoji: '🪨', color: '#9aa3b5' },
  日: { reading: 'ひ', en: 'sun', emoji: '☀️', color: 'var(--light)' },
}

/** A map tile: an element, empty (null) or a blocked boulder ('#'). */
export type Tile = Element | null | '#'
export type LandMap = Tile[][]

export const MAP_COLS = 7
export const MAP_ROWS = 5

export type ObjectiveId = 'river' | 'forest' | 'mountain' | 'spring' | 'flowers' | 'flame'

export interface Objective {
  id: ObjectiveId
  kanji: string
  reading: string
  /** 「川」を作れ! style command. */
  jp: string
  en: string
  hint: string
  emoji: string
  /** Elements that contribute; casting anything else is a mis-cast. */
  elements: Element[]
  /** Minimum casts on an empty map; mana = min + slack. */
  minCasts: number
}

export const OBJECTIVES: Objective[] = [
  { id: 'flame', kanji: '炎', reading: 'ほのお', jp: '「炎」を作れ!', en: 'Make a blaze', hint: 'Two fires side by side.', emoji: '🔥', elements: ['火'], minCasts: 2 },
  { id: 'spring', kanji: '湯', reading: 'ゆ', jp: '「湯」を作れ!', en: 'Make a hot spring', hint: 'Water right next to fire.', emoji: '♨️', elements: ['水', '火'], minCasts: 2 },
  { id: 'forest', kanji: '森', reading: 'もり', jp: '「森」を作れ!', en: 'Grow a forest', hint: 'Three or more trees touching each other.', emoji: '🌲', elements: ['木'], minCasts: 3 },
  { id: 'flowers', kanji: '花', reading: 'はな', jp: '「花」を咲かせよ!', en: 'Plant a flower field', hint: 'Sunlight touching trees makes blossoms: bloom two of them.', emoji: '🌸', elements: ['日', '木'], minCasts: 3 },
  { id: 'mountain', kanji: '山', reading: 'やま', jp: '「山」を作れ!', en: 'Raise a mountain', hint: 'Earth and stone piled together: three tiles, both kinds.', emoji: '⛰️', elements: ['土', '石'], minCasts: 3 },
  { id: 'river', kanji: '川', reading: 'かわ', jp: '「川」を作れ!', en: 'Create a river', hint: 'A line of water from one edge of the land to the other.', emoji: '🏞️', elements: ['水'], minCasts: MAP_ROWS },
]

export const OBJECTIVE_BY_ID = new Map(OBJECTIVES.map((o) => [o.id, o]))

/** Objectives for a session: `goal` of them, easy → hard, cycling if goal > 6. */
export function pickObjectives(goal: number, rng: () => number = Math.random): Objective[] {
  const shuffled = [...OBJECTIVES].map((o) => ({ o, k: rng() })).sort((a, b) => a.k - b.k).map((x) => x.o)
  const out: Objective[] = []
  for (let i = 0; out.length < goal; i++) out.push(shuffled[i % shuffled.length])
  const rank = (o: Objective) => OBJECTIVES.indexOf(o)
  // Sort each block of 6 by difficulty so each cycle ramps up.
  const blocks: Objective[][] = []
  for (let i = 0; i < out.length; i += OBJECTIVES.length) blocks.push(out.slice(i, i + OBJECTIVES.length).sort((a, b) => rank(a) - rank(b)))
  return blocks.flat()
}

export function emptyMap(rows = MAP_ROWS, cols = MAP_COLS): LandMap {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, (): Tile => null))
}

/**
 * A fresh map with a couple of boulders ('#') to plan around. Boulders are
 * kept off the outer columns' middle so a river is always possible.
 */
export function makeMap(rng: () => number = Math.random, boulders = 2): LandMap {
  for (let tries = 0; tries < 50; tries++) {
    const m = emptyMap()
    let placed = 0
    while (placed < boulders) {
      const r = Math.floor(rng() * MAP_ROWS)
      const c = 1 + Math.floor(rng() * (MAP_COLS - 2))
      if (m[r][c] !== null) continue
      m[r][c] = '#'
      placed++
    }
    // A straight vertical river must still be possible in some column.
    if (m[0].some((_, c) => m.every((row) => row[c] === null))) return m
  }
  return emptyMap()
}

const DIRS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

function neighbours(m: LandMap, r: number, c: number): [number, number][] {
  return DIRS.map(([dr, dc]) => [r + dr, c + dc] as [number, number]).filter(([rr, cc]) => rr >= 0 && cc >= 0 && rr < m.length && cc < m[0].length)
}

/** Connected components (4-neighbour) of tiles matching `pred`. */
export function clusters(m: LandMap, pred: (t: Tile) => boolean): [number, number][][] {
  const seen = new Set<string>()
  const out: [number, number][][] = []
  m.forEach((row, r) =>
    row.forEach((t, c) => {
      if (!pred(t) || seen.has(`${r},${c}`)) return
      const comp: [number, number][] = []
      const stack: [number, number][] = [[r, c]]
      seen.add(`${r},${c}`)
      while (stack.length) {
        const [rr, cc] = stack.pop()!
        comp.push([rr, cc])
        for (const [nr, nc] of neighbours(m, rr, cc)) {
          if (seen.has(`${nr},${nc}`) || !pred(m[nr][nc])) continue
          seen.add(`${nr},${nc}`)
          stack.push([nr, nc])
        }
      }
      out.push(comp)
    }),
  )
  return out
}

export interface ReactionHit {
  a: [number, number]
  b: [number, number]
  reaction: Reaction
}

/** All neighbouring element pairs that react (each pair once). */
export function findReactions(m: LandMap): ReactionHit[] {
  const out: ReactionHit[] = []
  m.forEach((row, r) =>
    row.forEach((t, c) => {
      if (!t || t === '#') return
      // Only look right and down so each pair is counted once.
      for (const [nr, nc] of [
        [r, c + 1],
        [r + 1, c],
      ] as [number, number][]) {
        const u = m[nr]?.[nc]
        if (!u || u === '#') continue
        const reaction = REACTIONS.find((x) => (x.a === t && x.b === u) || (x.a === u && x.b === t))
        if (reaction) out.push({ a: [r, c], b: [nr, nc], reaction })
      }
    }),
  )
  return out
}

/** Whether the objective's pattern is present on the map. */
export function checkObjective(id: ObjectiveId, m: LandMap): boolean {
  const rows = m.length
  const cols = m[0]?.length ?? 0
  switch (id) {
    case 'river':
      return clusters(m, (t) => t === '水').some(
        (comp) =>
          (comp.some(([r]) => r === 0) && comp.some(([r]) => r === rows - 1)) ||
          (comp.some(([, c]) => c === 0) && comp.some(([, c]) => c === cols - 1)),
      )
    case 'forest':
      return clusters(m, (t) => t === '木').some((comp) => comp.length >= 3)
    case 'mountain':
      return clusters(m, (t) => t === '土' || t === '石').some(
        (comp) => comp.length >= 3 && comp.some(([r, c]) => m[r][c] === '土') && comp.some(([r, c]) => m[r][c] === '石'),
      )
    case 'spring':
      return findReactions(m).some((h) => h.reaction.result === '湯')
    case 'flowers':
      return findReactions(m).filter((h) => h.reaction.result === '花').length >= 2
    case 'flame':
      return clusters(m, (t) => t === '火').some((comp) => comp.length >= 2)
  }
}

/** Cells that make up the completed pattern (for highlighting), or []. */
export function objectiveCells(id: ObjectiveId, m: LandMap): [number, number][] {
  if (!checkObjective(id, m)) return []
  const obj = OBJECTIVE_BY_ID.get(id)!
  if (id === 'spring' || id === 'flowers') {
    const target = id === 'spring' ? '湯' : '花'
    return findReactions(m)
      .filter((h) => h.reaction.result === target)
      .flatMap((h) => [h.a, h.b])
  }
  return clusters(m, (t) => t !== null && t !== '#' && obj.elements.includes(t)).filter((comp) => {
    const sub = emptyMap(m.length, m[0].length)
    comp.forEach(([r, c]) => (sub[r][c] = m[r][c]))
    return checkObjective(id, sub)
  })[0] ?? []
}

/** Is casting `el` a sensible move for this objective? */
export function contributes(obj: Objective, el: Element): boolean {
  return obj.elements.includes(el)
}

/** Mana for an objective: the minimum casts plus slack. */
export function manaFor(obj: Objective, slack = 4): number {
  return obj.minCasts + slack
}

/** Objective score: 2 clean, 1 completed with mis-casts, 0 failed. */
export function objectivePoints(done: boolean, miscasts: number): number {
  if (!done) return 0
  return miscasts === 0 ? 2 : 1
}

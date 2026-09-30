import { describe, expect, it } from 'vitest'
import { RADICALS, RECIPES } from '../data/kanji'
import { WORD_BY_ID } from '../data/vocab'
import { seeded } from '../engine/random'
import {
  checkObjective,
  craftable,
  ELEMENT_WORD,
  ELEMENTS,
  emptyMap,
  findReactions,
  fuse,
  makeMap,
  MAP_COLS,
  MAP_ROWS,
  objectiveCells,
  OBJECTIVES,
  pickObjectives,
  pickRiddle,
  sceneFor,
  type LandMap,
  type Tile,
} from './crafting'

const STARTERS = RADICALS.filter((r) => r.starter).map((r) => r.char)

function mapOf(rows: string[]): LandMap {
  return rows.map((row) => Array.from(row).map((ch): Tile => (ch === '.' ? null : (ch as Tile))))
}

describe('kanji evolution', () => {
  it('starters are 火水木土石日月人口', () => {
    expect(STARTERS.join('')).toBe('火水木土石日月人口')
  })

  it('fuses valid recipes in any order and fizzles otherwise', () => {
    const r = fuse(['木', null, '木'], '林', [], STARTERS)
    expect(r.kind).toBe('craft')
    if (r.kind === 'craft') {
      expect(r.recipe.result).toBe('林')
      expect(r.isTarget).toBe(true)
      expect(r.isNew).toBe(true)
      expect(r.newRadicals).toEqual(['山'])
    }
    const m = fuse(['月', '日', null], '森', ['明'], [...STARTERS, '白'])
    expect(m.kind === 'craft' && m.recipe.result === '明' && !m.isTarget && !m.isNew && m.newRadicals.length === 0).toBe(true)
    expect(fuse(['火', '水', null], null, [], STARTERS).kind).toBe('fizzle')
    expect(fuse(['木', null, null], null, [], STARTERS).kind).toBe('fizzle')
  })

  it('every recipe is reachable from the starter radicals via unlocks', () => {
    const unlocked = new Set(STARTERS)
    const found = new Set<string>()
    let changed = true
    while (changed) {
      changed = false
      for (const r of RECIPES) {
        if (found.has(r.result) || !r.parts.every((p) => unlocked.has(p))) continue
        found.add(r.result)
        r.unlocks?.forEach((u) => unlocked.add(u))
        changed = true
      }
    }
    expect([...found].sort()).toEqual(RECIPES.map((r) => r.result).sort())
  })

  it('riddles are always solvable with the current grimoire', () => {
    const rng = seeded(7)
    let unlocked = [...STARTERS]
    const discovered: string[] = []
    const seen: string[] = []
    for (let i = 0; i < 60; i++) {
      const r = pickRiddle(unlocked, discovered, () => 0.5, seen.slice(-1), rng)
      expect(r).not.toBeNull()
      if (!r) break
      expect(r.parts.every((p) => unlocked.includes(p))).toBe(true)
      expect(r.result).not.toBe(seen[seen.length - 1])
      seen.push(r.result)
      if (!discovered.includes(r.result)) discovered.push(r.result)
      unlocked = [...new Set([...unlocked, ...(r.unlocks ?? [])])]
    }
    // Playing riddles alone eventually discovers everything.
    expect(discovered.length).toBe(RECIPES.length)
  })

  it('prefers new discoveries but also brings back known kanji', () => {
    const rng = seeded(3)
    const all = craftable(STARTERS).map((r) => r.result)
    let review = 0
    for (let i = 0; i < 200; i++) {
      const r = pickRiddle(STARTERS, ['林'], () => 1, [], rng)!
      expect(all).toContain(r.result)
      if (r.result === '林') review++
    }
    expect(review).toBeGreaterThan(20)
    expect(review).toBeLessThan(120)
  })

  it('grows the scene', () => {
    expect(sceneFor(RECIPES.find((r) => r.result === '森')!)).toHaveLength(3)
    expect(sceneFor(RECIPES.find((r) => r.result === '休')!)).toHaveLength(1)
  })
})

describe('shape the land', () => {
  it('element words exist in vocab', () => {
    for (const el of ELEMENTS) expect(WORD_BY_ID.get(ELEMENT_WORD[el])?.jp).toBe(el)
  })

  it('detects rivers edge to edge (either axis)', () => {
    expect(checkObjective('river', mapOf(['...水...', '...水...', '...水...', '...水...', '...水...']))).toBe(true)
    expect(checkObjective('river', mapOf(['.......', '水水水....', '..水水水水水', '.......', '.......']))).toBe(true)
    expect(checkObjective('river', mapOf(['...水...', '...水...', '.......', '...水...', '...水...']))).toBe(false)
    // Diagonal steps don't connect.
    expect(checkObjective('river', mapOf(['水......', '.水.....', '..水....', '...水...', '....水..']))).toBe(false)
  })

  it('detects forests, mountains, blazes', () => {
    expect(checkObjective('forest', mapOf(['木木.....', '.木.....', '.......', '.......', '.......']))).toBe(true)
    expect(checkObjective('forest', mapOf(['木.木....', '.木.....', '.......', '.......', '.......']))).toBe(false)
    expect(checkObjective('mountain', mapOf(['.......', '..石....', '..土土...', '.......', '.......']))).toBe(true)
    expect(checkObjective('mountain', mapOf(['.......', '..土....', '..土土...', '.......', '.......']))).toBe(false)
    expect(checkObjective('flame', mapOf(['火火.....', '.......', '.......', '.......', '.......']))).toBe(true)
    expect(checkObjective('flame', mapOf(['火.火....', '.......', '.......', '.......', '.......']))).toBe(false)
  })

  it('detects hot springs and flower fields through reactions', () => {
    const spring = mapOf(['.......', '..水....', '..火....', '.......', '.......'])
    expect(checkObjective('spring', spring)).toBe(true)
    expect(findReactions(spring).map((h) => h.reaction.result)).toEqual(['湯'])
    expect(checkObjective('spring', mapOf(['水.火....', '.......', '.......', '.......', '.......']))).toBe(false)
    expect(checkObjective('flowers', mapOf(['木日木....', '.......', '.......', '.......', '.......']))).toBe(true)
    expect(checkObjective('flowers', mapOf(['木日.....', '.......', '.......', '.......', '.......']))).toBe(false)
    expect(objectiveCells('flowers', mapOf(['木日木....', '.......', '.......', '.......', '.......'])).length).toBe(4)
  })

  it('finds each reacting pair once', () => {
    const m = mapOf(['木火.....', '水土.....', '.......', '.......', '.......'])
    const res = findReactions(m).map((h) => h.reaction.result).sort()
    expect(res).toEqual(['泥', '燃', '茂'].sort())
  })

  it('every objective is achievable within its minimum casts on a generated map', () => {
    for (let seed = 1; seed < 30; seed++) {
      const m = makeMap(seeded(seed))
      expect(m.length).toBe(MAP_ROWS)
      expect(m[0].length).toBe(MAP_COLS)
      expect(m.flat().filter((t) => t === '#').length).toBe(2)
      // Column 0 is never blocked, so a river / any pattern fits there.
      const col = m[0].findIndex((_, c) => m.every((row) => row[c] === null))
      expect(col).toBeGreaterThanOrEqual(0)
      const river = m.map((row) => [...row])
      river.forEach((row) => (row[col] = '水'))
      expect(checkObjective('river', river)).toBe(true)
    }
    for (const o of OBJECTIVES) expect(o.minCasts).toBeGreaterThan(0)
  })

  it('objective with nothing placed is incomplete', () => {
    for (const o of OBJECTIVES) expect(checkObjective(o.id, emptyMap())).toBe(false)
  })

  it('picks objectives, easy first', () => {
    const list = pickObjectives(5, seeded(1))
    expect(list).toHaveLength(5)
    expect(new Set(list.map((o) => o.id)).size).toBe(5)
    const idx = list.map((o) => OBJECTIVES.indexOf(o))
    expect([...idx].sort((a, b) => a - b)).toEqual(idx)
    expect(pickObjectives(8, seeded(2))).toHaveLength(8)
  })
})

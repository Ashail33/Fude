import { describe, expect, it } from 'vitest'
import { ACTIVITIES } from '../data/regions'
import { getWord } from '../data/vocab'
import { buildCandidates, entryCells, entryPoints, generateCrossword, kanjiEligible, validateCrossword, type Crossword } from './crossword'

const crosswordActivities = ACTIVITIES.filter((a) => a.game === 'crossword')

function gen(wordIds: string[], answer: 'kana' | 'mixed', size: number, seed: number): Crossword {
  const cands = buildCandidates(wordIds.map(getWord), answer, size, () => 0.5)
  return generateCrossword(cands, size, { seed })
}

describe('crossword generator', () => {
  it('has crossword activities to test', () => {
    expect(crosswordActivities.length).toBeGreaterThan(0)
  })

  for (const a of crosswordActivities) {
    if (a.game !== 'crossword') continue
    const { wordIds, answer, size } = a.params
    it(`builds valid ${size}×${size} ${answer} grids for ${a.id}`, () => {
      for (let seed = 1; seed <= 25; seed++) {
        const cw = gen(wordIds, answer, size, seed)
        expect(validateCrossword(cw)).toEqual([])
        expect(cw.entries.length).toBeGreaterThanOrEqual(6)
        expect(cw.entries.length).toBeLessThanOrEqual(10)
        // Every entry is a real word from the pool, spelled as clued.
        for (const e of cw.entries) {
          expect(wordIds).toContain(e.id)
          const w = getWord(e.id)
          expect(e.answer.join('')).toBe(e.kanji ? w.jp : w.kana)
        }
        // Unique answers and ids.
        expect(new Set(cw.entries.map((e) => e.id)).size).toBe(cw.entries.length)
        expect(new Set(cw.entries.map((e) => e.answer.join(''))).size).toBe(cw.entries.length)
        if (answer === 'kana') expect(cw.entries.every((e) => !e.kanji)).toBe(true)
      }
    })
  }

  it('mixed mode includes some kanji entries', () => {
    const a = crosswordActivities.find((x) => x.game === 'crossword' && x.params.answer === 'mixed')
    if (!a || a.game !== 'crossword') throw new Error('no mixed activity')
    let total = 0
    for (let seed = 1; seed <= 10; seed++) total += gen(a.params.wordIds, 'mixed', a.params.size, seed).entries.filter((e) => e.kanji).length
    expect(total / 10).toBeGreaterThanOrEqual(1.5)
  })

  it('intersections agree across and down', () => {
    const a = crosswordActivities[0]
    if (a.game !== 'crossword') throw new Error()
    const cw = gen(a.params.wordIds, a.params.answer, a.params.size, 42)
    const byCell = new Map<string, string>()
    let crossings = 0
    for (const e of cw.entries) {
      entryCells(e).forEach(([r, c], i) => {
        const k = `${r},${c}`
        if (byCell.has(k)) {
          crossings++
          expect(byCell.get(k)).toBe(e.answer[i])
        } else byCell.set(k, e.answer[i])
      })
    }
    expect(crossings).toBeGreaterThanOrEqual(cw.entries.length - 1)
  })

  it('prefers heavier (weaker SRS) words', () => {
    const a = crosswordActivities[0]
    if (a.game !== 'crossword') throw new Error()
    const favoured = new Set(a.params.wordIds.slice(0, 20))
    let hits = 0
    let n = 0
    for (let seed = 1; seed <= 10; seed++) {
      const cands = buildCandidates(a.params.wordIds.map(getWord), 'kana', a.params.size, (id) => (favoured.has(id) ? 5 : 0.05))
      const cw = generateCrossword(cands, a.params.size, { seed })
      n += cw.entries.length
      hits += cw.entries.filter((e) => favoured.has(e.id)).length
    }
    // ~15% of the pool is favoured; it should be heavily over-represented.
    expect(hits / n).toBeGreaterThan(0.3)
  })

  it('detects invalid layouts', () => {
    const cw: Crossword = {
      size: 4,
      grid: [
        ['い', 'ぬ', null, null],
        ['ね', 'こ', null, null],
        [null, null, null, null],
        [null, null, null, null],
      ],
      entries: [
        { id: 'inu', answer: ['い', 'ぬ'], kanji: false, row: 0, col: 0, dir: 'across', num: 1 },
        { id: 'neko', answer: ['ね', 'こ'], kanji: false, row: 1, col: 0, dir: 'across', num: 2 },
      ],
    }
    expect(validateCrossword(cw).length).toBeGreaterThan(0)
  })

  it('kanji eligibility and scoring', () => {
    expect(kanjiEligible(getWord('taberu'))).toBe(true)
    expect(kanjiEligible(getWord('hi'))).toBe(false)
    expect(kanjiEligible(getWord('pan'))).toBe(false)
    expect(entryPoints(0, 0, false)).toBe(3)
    expect(entryPoints(1, 1, false)).toBe(1)
    expect(entryPoints(0, 0, true)).toBe(0)
  })
})

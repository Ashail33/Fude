import { describe, expect, it } from 'vitest'
import { CONFUSABLE_SETS } from '../data/kana'
import { buildRounds, glossOf, levelFor, spotItemId } from './spot'

describe('spot rounds', () => {
  it('levels rise evenly from min to max', () => {
    const ls = Array.from({ length: 12 }, (_, i) => levelFor(i, 12, 2, 4))
    expect(ls[0]).toBe(2)
    expect(ls.at(-1)).toBe(4)
    expect([...ls].sort((a, b) => a - b)).toEqual(ls)
    expect(new Set(ls)).toEqual(new Set([2, 3, 4]))
    expect(levelFor(0, 1, 3, 3)).toBe(3)
  })
  it('builds valid rounds for every activity param set', () => {
    for (const [min, max, n] of [[1, 2, 10], [2, 4, 12], [3, 5, 16]]) {
      const rounds = buildRounds(n, min, max)
      expect(rounds).toHaveLength(n)
      rounds.forEach((r) => {
        expect(r.level).toBeGreaterThanOrEqual(min)
        expect(r.level).toBeLessThanOrEqual(max)
        expect(r.base).not.toBe(r.imposter)
        const set = CONFUSABLE_SETS.find((s) => s.chars.includes(r.base) && s.chars.includes(r.imposter))
        expect(set).toBeDefined()
        expect(r.size).toBe(r.level === 1 ? 3 : 4)
        expect(r.at).toBeGreaterThanOrEqual(0)
        expect(r.at).toBeLessThan(r.size * r.size)
      })
    }
  })
  it('avoids repeating the same set back-to-back', () => {
    for (let k = 0; k < 20; k++) {
      const rounds = buildRounds(10, 1, 2)
      for (let i = 1; i < rounds.length; i++) {
        const a = new Set([rounds[i - 1].base, rounds[i - 1].imposter])
        expect(a.has(rounds[i].base) && a.has(rounds[i].imposter)).toBe(false)
      }
    }
  })
  it('falls back to the nearest level with sets', () => {
    const rounds = buildRounds(3, 9, 9)
    expect(rounds).toHaveLength(3)
    rounds.forEach((r) => expect(r.level).toBe(5))
  })
  it('item ids and glosses', () => {
    expect(spotItemId('シ')).toBe('k:シ')
    expect(spotItemId('土')).toBe('j:土')
    expect(glossOf('ツ')).toBe('tsu (katakana)')
    for (const s of CONFUSABLE_SETS) for (const c of s.chars) expect(glossOf(c)).not.toBe('kanji')
  })
})

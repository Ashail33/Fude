import { describe, expect, it } from 'vitest'
import { GRAMMAR_BY_ID } from '../../data/grammar'
import { WORD_BY_ID } from '../../data/vocab'
import { DATA } from './data'
import { ACTIVITIES } from './activities'
import { MEANINGS, POLITE, REPLIES, meaningOptions, pickOptions, reviewItems } from './nopperabo'

const KANJI = /[一-龯]/

describe('the Station Town pack', () => {
  it('teaches 90 everyday words in six lessons of fifteen, with no clashes', () => {
    expect(DATA.words).toHaveLength(90)
    const lessons = ACTIVITIES.filter((a) => a.game === 'lesson')
    expect(lessons).toHaveLength(6)
    for (const l of lessons) if (l.game === 'lesson') expect(l.params.wordIds).toHaveLength(15)
    for (const [id] of DATA.words) expect(WORD_BY_ID.get(id)?.region, id).toBe(11)
    // verbs come with their masu form
    for (const [id, , , , pos, , extra] of DATA.words) if (pos === 'verb') expect(extra?.masu, id).toBeTruthy()
  })

  it('leans on listening: several listening rounds and conversations', () => {
    expect(ACTIVITIES.filter((a) => a.game === 'listening').length).toBeGreaterThanOrEqual(3)
    expect(ACTIVITIES.filter((a) => a.game === 'dialogue').length).toBeGreaterThanOrEqual(2)
    expect(DATA.scenarios!.filter((s) => s.translations === 'hint').length).toBeGreaterThanOrEqual(2)
  })

  it('runs learn → practice → challenge → boss → mastery', () => {
    const order = ['learn', 'practice', 'challenge', 'boss', 'mastery']
    const ranks = ACTIVITIES.map((a) => order.indexOf(a.stage))
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks)
    expect(ACTIVITIES.filter((a) => a.stage === 'boss')).toHaveLength(1)
  })
})

describe('Nopperabō’s lines', () => {
  const all = [...MEANINGS, ...REPLIES, ...POLITE]

  it('use real grammar points and words, and speak in kana', () => {
    for (const q of all) {
      for (const id of reviewItems(q)) {
        const [kind, key] = id.split(':')
        if (kind === 'g') expect(GRAMMAR_BY_ID.has(key), `${q.id} ${id}`).toBe(true)
        else expect(WORD_BY_ID.has(key), `${q.id} ${id}`).toBe(true)
      }
      expect(KANJI.test(q.kana), `${q.id} kana`).toBe(false)
    }
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length)
  })

  it('cover every grammar point of the region', () => {
    const used = new Set(all.map((q) => q.grammar))
    for (const g of DATA.grammar) expect(used.has(g.id), g.id).toBe(true)
  })

  it('offer four distinct options with exactly one right answer', () => {
    for (const q of MEANINGS) {
      const o = meaningOptions(q)
      expect(new Set(o).size, q.id).toBe(4)
      expect(o.filter((x) => x === q.en)).toHaveLength(1)
    }
    for (const q of [...REPLIES, ...POLITE]) {
      const o = pickOptions(q)
      expect(new Set(o).size, q.id).toBe(4)
      expect(o.filter((x) => x === q.answer)).toHaveLength(1)
    }
  })
})

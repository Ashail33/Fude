import { describe, expect, it } from 'vitest'
import { GRAMMAR_BY_ID } from '../../data/grammar'
import { WORD_BY_ID } from '../../data/vocab'
import { DRUM_CALLS, DRUM_VERBS, drumQuestion, FORM_GRAMMAR, galeCorrect, galeQuestion, GALE_SENTENCES, GAPS, slip } from './raijin'

describe('Raijin’s drum calls', () => {
  it('drills real words and grammar', () => {
    for (const v of DRUM_VERBS) expect(WORD_BY_ID.get(v.id)?.kana, v.id).toBe(v.kana)
    for (const g of Object.values(FORM_GRAMMAR)) expect(GRAMMAR_BY_ID.has(g), g).toBe(true)
  })

  it('offers four distinct options with exactly one right answer', () => {
    for (const { verb, form } of DRUM_CALLS) {
      const q = drumQuestion(verb, form)
      expect(new Set(q.options).size, `${verb.id} ${form}`).toBe(4)
      expect(q.options.filter((o) => o === q.answer)).toHaveLength(1)
    }
  })

  it('never offers a real form as the slip', () => {
    for (const { verb, form } of DRUM_CALLS) expect([verb.nai, verb.pot, verb.tara, verb.ba]).not.toContain(slip(verb, form))
  })

  it('conjugates by verb class', () => {
    const by = Object.fromEntries(DRUM_VERBS.map((v) => [v.id, v]))
    expect(by.yomu.nai).toBe('よまない')
    expect(by.kau.nai).toBe('かわない')
    expect(by.taberu.pot).toBe('たべられる')
    expect(by.iku.tara).toBe('いったら')
    expect(by.kuru.ba).toBe('くれば')
    expect(by.aru.nai).toBe('ない')
  })
})

describe('Fūjin’s gale and the storm gaps', () => {
  it('rebuilds every sentence from its tiles', () => {
    for (const s of GALE_SENTENCES) {
      const q = galeQuestion(s)
      expect(q.tiles.length).toBe(s.tokens.length + Math.min(1, s.distractors.length))
      expect(galeCorrect(s, s.tokens)).toBe(true)
      expect(galeCorrect(s, [...s.tokens].reverse())).toBe(s.tokens.length < 2)
    }
  })

  it('every gap tests a grammar point, with four distinct options', () => {
    for (const g of GAPS) {
      expect(GRAMMAR_BY_ID.has(g.grammar), g.id).toBe(true)
      expect(g.jp).toContain('＿')
      expect(new Set([g.answer, ...g.wrong]).size, g.id).toBe(4)
    }
    expect(new Set(GAPS.map((g) => g.grammar)).size).toBe(GAPS.length)
  })
})

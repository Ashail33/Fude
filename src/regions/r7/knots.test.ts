import { describe, expect, it } from 'vitest'
import { GRAMMAR_BY_ID } from '../../data/grammar'
import { WORD_BY_ID } from '../../data/vocab'
import { describeItem } from '../../engine/items'
import { BATH_LAWS, KNOT_VERBS, knotQuestion, lawQuestion, YESTERDAYS, yesterdayQuestion } from './knots'

const all = [
  ...KNOT_VERBS.map((v) => knotQuestion(v.id)),
  ...YESTERDAYS.flatMap((y) => [yesterdayQuestion(y, false), yesterdayQuestion(y, true)]),
  ...BATH_LAWS.map((l) => lawQuestion(l)),
]

describe('the Yamanba’s knots', () => {
  it('knots real words with their dictionary forms', () => {
    for (const v of KNOT_VERBS) {
      const w = WORD_BY_ID.get(v.id)
      expect(w, v.id).toBeDefined()
      expect(w!.kana, v.id).toBe(v.kana)
      expect(w!.jp, v.id).toBe(v.jp)
      expect(GRAMMAR_BY_ID.has(v.rule), v.rule).toBe(true)
    }
  })

  it('follows the て-form rules', () => {
    const ending: Record<string, RegExp> = { 'te-ru': /て$/, 'te-tte': /って$/, 'te-nde': /んで$/, 'te-ite': /(いて|いで|って)$/, 'te-shite': /(して|きて)$/ }
    for (const v of KNOT_VERBS) {
      expect(v.te, v.id).toMatch(ending[v.rule])
      if (v.rule === 'te-ru') expect(v.te, v.id).toBe(v.kana.replace(/る$/, 'て'))
      expect(v.ta, v.id).toBe(v.te.replace(/て$/, 'た').replace(/で$/, 'だ'))
      expect(v.nai, v.id).toMatch(/ない$/)
    }
  })

  it('every question has four distinct options and exactly one answer', () => {
    for (const q of all) {
      expect(new Set(q.options).size, q.jp).toBe(4)
      expect(q.options.filter((o) => o === q.answer), q.jp).toHaveLength(1)
      for (const id of q.itemIds) expect(describeItem(id), id).toBeTruthy()
    }
  })

  it('makes the plain past and its negative', () => {
    const hairu = YESTERDAYS.find((y) => y.verb === 'hairu')!
    expect(yesterdayQuestion(hairu, false).answer).toBe('はいった')
    expect(yesterdayQuestion(hairu, true).answer).toBe('はいらなかった')
    const kuru = YESTERDAYS.find((y) => y.verb === 'kuru')!
    expect(yesterdayQuestion(kuru, true).answer).toBe('こなかった')
  })

  it('answers the bath laws with the right rule', () => {
    const towel = lawQuestion(BATH_LAWS[0])
    expect(towel.answer).toBe('いいえ、いれては いけません。')
    const wash = lawQuestion(BATH_LAWS[1])
    expect(wash.answer).toBe('はい、はいっても いいですよ。')
  })
})

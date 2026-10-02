import { describe, expect, it } from 'vitest'
import { HIRAGANA, KATAKANA } from '../data/kana'
import { item } from './items'
import { xpForLevel } from './rewards'
import { freshState, type PlayerState } from './store'
import { UI_LEARNING_CAP, UI_STAGE_AT, UI_TERMS, weave, type Segment } from './weave'

const card = (interval: number) => ({ id: '', ease: 2.5, interval, due: 0, reps: 2, lapses: 0, seen: 3, correct: 3, wrong: 0, avgMs: 2000, lastSeen: Date.now() })

/** Every kana learned, so the weave isn't held back by reading. */
const ALL_KANA = Object.fromEntries([...HIRAGANA, ...KATAKANA].map((k) => [item.kana(k.char), card(10)]))
function player(over: Partial<PlayerState> = {}): PlayerState {
  return { ...freshState(), ...over, srs: { ...ALL_KANA, ...over.srs } }
}
const woven = (segs: Segment[]) => segs.filter((s) => typeof s !== 'string') as Exclude<Segment, string>[]

describe('language weave', () => {
  it('leaves a brand-new player’s English alone', () => {
    expect(weave(player(), 'Cast fire at the lantern, then tap the answer.')).toEqual(['Cast fire at the lantern, then tap the answer.'])
  })

  it('follows a word’s mastery: familiar → hint, strong → gloss, mastered → Japanese', () => {
    const at = (interval: number) => woven(weave(player({ srs: { [item.word('hi')]: card(interval) } }), 'Cast fire here.'))[0]
    expect(at(3)).toMatchObject({ stage: 1, text: 'fire' })
    expect(at(10)).toMatchObject({ stage: 2 })
    expect(at(30)).toMatchObject({ stage: 3 })
  })

  it('matches whole words and plurals only', () => {
    const p = player({ srs: { [item.word('neko')]: card(30), [item.word('hi')]: card(30) } })
    expect(woven(weave(p, 'Two cats watch the fireworks.')).map((s) => s.text)).toEqual(['cats'])
  })

  it('introduces everyday words a couple at a time, in order', () => {
    const lv2 = { xp: xpForLevel(2) }
    const s1 = player(lv2)
    const text = UI_TERMS.slice(0, 4)
      .map((t) => t.en[0])
      .join(', ')
    expect(woven(weave(player(), text))).toHaveLength(0) // level 1: none yet
    expect(woven(weave(s1, text)).map((s) => s.term.id)).toEqual(UI_TERMS.slice(0, UI_LEARNING_CAP).map((t) => t.id))
    // once the first word is well known, the next one joins
    const s2 = player({ ...lv2, weave: { [UI_TERMS[0].id]: UI_STAGE_AT[1], [UI_TERMS[1].id]: 3 } })
    const ids = woven(weave(s2, text)).map((s) => s.term.id)
    expect(ids).toContain(UI_TERMS[2].id)
    expect(woven(weave(s2, text)).find((s) => s.term.id === UI_TERMS[0].id)?.stage).toBe(3)
  })

  it('keeps sentences readable: at most two hints', () => {
    const srs = Object.fromEntries(['hi', 'mizu', 'ki', 'inu', 'neko'].map((w) => [item.word(w), card(3)]))
    expect(woven(weave(player({ srs }), 'fire, water, tree, dog and cat'))).toHaveLength(2)
  })

  it('keeps a word English (with its kana hint) until every kana in it can be read', () => {
    const word = { [item.word('sakana')]: card(30) }
    const noKana = { ...freshState(), srs: word }
    expect(woven(weave(noKana, 'A fish!'))[0]).toMatchObject({ stage: 1 })
    const someKana = { ...noKana, srs: { ...word, [item.kana('さ')]: card(10), [item.kana('か')]: card(10) } }
    expect(woven(weave(someKana, 'A fish!'))[0]).toMatchObject({ stage: 1 })
    const allKana = { ...someKana, srs: { ...someKana.srs, [item.kana('な')]: card(10) } }
    expect(woven(weave(allKana, 'A fish!'))[0]).toMatchObject({ stage: 3 })
  })

  it('can be switched off', () => {
    const p = player({ srs: { [item.word('hi')]: card(30) } })
    p.settings = { ...p.settings, weave: false }
    expect(weave(p, 'Cast fire.')).toEqual(['Cast fire.'])
  })
})

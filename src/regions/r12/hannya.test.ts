import { describe, expect, it } from 'vitest'
import { GRAMMAR_BY_ID } from '../../data/grammar'
import { WORD_BY_ID } from '../../data/vocab'
import { describeItem } from '../../engine/items'
import { VOICES } from '../../engine/audio/voices'
import { castAt } from '../../story/scenes'
import { DATA } from './data'
import { SCENES } from './scenes'
import { FACES, faceQuestion, fillGap, GAPS, gapOptions, HEARTS, heartQuestion, replyEnglish } from './hannya'

describe('region 12: the Valley of Hearts', () => {
  it('teaches 75 words in five lessons and at least 12 grammar points', () => {
    expect(DATA.words.length).toBe(75)
    expect(new Set(DATA.words.map((w) => w[0])).size).toBe(75)
    expect(DATA.grammar.length).toBeGreaterThanOrEqual(12)
    for (const w of DATA.words) if (w[4] === 'verb') expect(w[6]?.masu, w[0]).toBeTruthy()
  })

  it('gives every cutscene line a translation, and every kanji line a kana reading', () => {
    for (const scene of SCENES.scenes) {
      expect(scene.steps.length).toBeGreaterThan(2)
      scene.steps.forEach((st, i) => {
        if (!st.pause) expect(st.jp || st.en, `${scene.id}#${i}`).toBeTruthy()
        if (st.jp) expect(st.en, `${scene.id}#${i}`).toBeTruthy()
        if (st.who) expect(castAt(scene, i), `${scene.id}#${i} ${st.who}`).toContain(st.who)
        if (st.kana) expect(/[一-龯]/.test(st.kana), `${scene.id}#${i} kana has kanji`).toBe(false)
        if (st.jp && /[一-龯]/.test(st.jp)) expect(st.kana, `${scene.id}#${i} ${st.jp}`).toBeTruthy()
      })
    }
  })

  it('gives its new sprites sane, distinct voices', () => {
    for (const id of ['maskmaker', 'dancer', 'menrei', 'hannya'] as const) {
      const v = VOICES[id]
      expect(v, id).toBeDefined()
      expect(v.tts.pitch).toBeGreaterThanOrEqual(0.4)
      expect(v.tts.pitch).toBeLessThanOrEqual(1.9)
      expect(v.tts.rate).toBeGreaterThanOrEqual(0.75)
      expect(v.tts.rate).toBeLessThanOrEqual(1.3)
      const same = Object.entries(VOICES).filter(([k, o]) => k !== id && o.tts.gender === v.tts.gender && o.tts.pitch === v.tts.pitch && o.tts.rate === v.tts.rate)
      expect(same.map(([k]) => k), id).toEqual([])
    }
  })
})

describe('Hannya: Read the Mask', () => {
  it('asks for real feeling words, four distinct options, one right', () => {
    for (const f of FACES) {
      const c = faceQuestion(f)
      expect(new Set(c.options).size, f.id).toBe(4)
      expect(c.options.filter((o) => o === f.answer)).toHaveLength(1)
      for (const id of c.options) expect(WORD_BY_ID.has(id), `${f.id}: ${id}`).toBe(true)
    }
  })
})

describe('Hannya: Other Hearts', () => {
  it('every gap tests a different grammar point of the region, with four distinct options', () => {
    for (const g of GAPS) {
      expect(GRAMMAR_BY_ID.get(g.grammar)?.region, g.id).toBe(12)
      expect(g.jp.split('＿')).toHaveLength(2)
      expect(new Set(gapOptions(g)).size, g.id).toBe(4)
      expect(fillGap(g)).not.toContain('＿')
    }
    expect(new Set(GAPS.map((g) => g.grammar)).size).toBe(GAPS.length)
    // every grammar point of the region turns up in the fight
    for (const p of DATA.grammar) expect(GAPS.some((g) => g.grammar === p.id), p.id).toBe(true)
  })
})

describe('Hannya: Beneath the Mask', () => {
  it('offers one kind reply among distinct options, and reviews real items', () => {
    for (const h of HEARTS) {
      const c = heartQuestion(h)
      expect(new Set(c.options).size, h.id).toBe(4)
      expect(c.options.filter((o) => o === h.answer.jp)).toHaveLength(1)
      for (const o of c.options) expect(replyEnglish(h, o), `${h.id}: ${o}`).toBeTruthy()
      expect(/[一-龯]/.test(h.jp), `${h.id} is spoken, so kana only`).toBe(false)
      expect(h.items.length).toBeGreaterThan(0)
      for (const id of h.items) expect(describeItem(id), `${h.id}: ${id}`).toBeTruthy()
    }
  })
})

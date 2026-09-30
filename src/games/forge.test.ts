import { describe, expect, it } from 'vitest'
import { FORGE_SENTENCES } from '../data/sentences'
import { checkOrder, isParticle, readingOf, wordIdsIn } from './forge'

const byId = (id: string) => FORGE_SENTENCES.find((s) => s.id === id)!

describe('checkOrder', () => {
  it('accepts the main order and alternatives', () => {
    expect(checkOrder(['私', 'は', '学校', 'に', '行きます'], byId('f5')).correct).toBe(true)
    expect(checkOrder(['私', 'は', '学校', 'へ', '行きます'], byId('f5')).correct).toBe(true)
    expect(checkOrder(['駅', 'に', '友達', 'と', '行きます'], byId('f12')).correct).toBe(true)
  })
  it('finds the first wrong position', () => {
    const r = checkOrder(['私', 'は', '水', 'が', '飲みます'], byId('f1'))
    expect(r.correct).toBe(false)
    expect(r.wrongIndex).toBe(3)
  })
  it('points past the end when tiles are missing', () => {
    expect(checkOrder(['私', 'は'], byId('f1')).wrongIndex).toBe(2)
  })
  it('compares against the closest alternative', () => {
    const r = checkOrder(['鬼', 'を', '剣', 'に', '切ります'], byId('f20'))
    expect(r.wrongIndex).toBe(3)
    expect(r.target[0]).toBe('鬼')
  })
})

describe('readings and words', () => {
  it('knows readings for nouns and masu forms', () => {
    expect(readingOf('水')).toBe('みず')
    expect(readingOf('飲みます')).toBe('のみます')
    expect(readingOf('行きます')).toBe('いきます')
    expect(readingOf('来ます')).toBe('きます')
    expect(readingOf('日本語')).toBe('にほんご')
    expect(readingOf('は')).toBeUndefined()
  })
  it('has a reading for every kanji tile in the forge', () => {
    const tiles = new Set(FORGE_SENTENCES.flatMap((s) => [...s.tokens, ...s.distractors, ...(s.alts ?? []).flat()]))
    const missing = [...tiles].filter((t) => /[一-龯]/.test(t) && !readingOf(t))
    expect(missing).toEqual([])
  })
  it('detects vocab words in tokens', () => {
    expect(wordIdsIn(['私', 'は', '水', 'を', '飲みます'])).toEqual(['watashi', 'mizu', 'nomu'])
  })
  it('classifies particles', () => {
    expect(isParticle('を')).toBe(true)
    expect(isParticle('な')).toBe(false)
  })
})

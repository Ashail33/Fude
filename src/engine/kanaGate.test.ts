import { describe, expect, it } from 'vitest'
import { HIRAGANA, KATAKANA } from '../data/kana'
import { item } from './items'
import { xpForLevel } from './rewards'
import { freshState, immersionOf, kanaHold, kanaStage, type PlayerState } from './store'

const card = (interval: number) => ({ id: '', ease: 2.5, interval, due: 0, reps: 2, lapses: 0, seen: 3, correct: 3, wrong: 0, avgMs: 2000, lastSeen: Date.now() })
const learn = (list: { char: string }[], interval: number) => Object.fromEntries(list.map((k) => [item.kana(k.char), card(interval)]))
const veteran = (srs: PlayerState['srs']): PlayerState => ({ ...freshState(), xp: xpForLevel(25), srs })

describe('Japanese waits for the kana', () => {
  it('a high-level player who can’t read kana still gets English', () => {
    const s = veteran({})
    expect(immersionOf(s)).toBe(0)
    expect(kanaHold(s)?.en).toMatch(/hiragana/)
  })

  it('opens up step by step as hiragana, then katakana, are learned and held', () => {
    expect(kanaStage(veteran(learn(HIRAGANA, 3)))).toBe(1)
    expect(kanaStage(veteran({ ...learn(HIRAGANA, 10), ...learn(KATAKANA, 3) }))).toBe(2)
    expect(kanaStage(veteran({ ...learn(HIRAGANA, 10), ...learn(KATAKANA, 10) }))).toBe(3)
    expect(immersionOf(veteran({ ...learn(HIRAGANA, 10), ...learn(KATAKANA, 10) }))).toBe(3)
  })

  it('a few stragglers don’t hold the player back', () => {
    expect(kanaStage(veteran(learn(HIRAGANA.slice(0, 42), 3)))).toBe(1)
    expect(kanaStage(veteran(learn(HIRAGANA.slice(0, 40), 3)))).toBe(0)
  })

  it('a pinned setting is respected', () => {
    const s = veteran({})
    s.settings = { ...s.settings, immersion: 2 }
    expect(immersionOf(s)).toBe(2)
    expect(kanaHold(s)).toBeNull()
  })
})

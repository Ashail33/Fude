import { describe, expect, it } from 'vitest'
import { ACTIVITIES, activitiesFor, REGIONS } from '../data/regions'
import { RECIPES, RADICALS, findRecipe } from '../data/kanji'
import { FORGE_SENTENCES, PARTICLE_QUESTIONS, RUNES, conjugate, ADJECTIVES } from '../data/sentences'
import { VOCAB, matchesEnglish, getWord } from '../data/vocab'
import { describeItem, item } from './items'
import { generateQuests, featuredToday, questActivity } from './quests'
import { levelForXp, xpForLevel } from './rewards'
import { newCard, review, strength, masteryTier } from './srs'
import { activityUnlocked, applyReviews, freshState, regionUnlocked, starsFor, type PlayerState } from './store'

const DAY = 86400000

describe('srs', () => {
  it('schedules growing intervals for correct answers', () => {
    let c = newCard('w:hi', 0)
    c = review(c, { itemId: 'w:hi', correct: true, ms: 1000 }, 0)
    expect(c.interval).toBe(1)
    c = review(c, { itemId: 'w:hi', correct: true, ms: 1000 }, 2 * DAY)
    expect(c.interval).toBe(3)
    c = review(c, { itemId: 'w:hi', correct: true, ms: 1000 }, 6 * DAY)
    expect(c.interval).toBeGreaterThan(3)
    expect(masteryTier(c)).toBeGreaterThanOrEqual(2)
  })

  it('resets on a lapse and relearns within minutes', () => {
    let c = newCard('w:hi', 0)
    c = review(c, { itemId: 'w:hi', correct: true }, 0)
    c = review(c, { itemId: 'w:hi', correct: false }, 2 * DAY)
    expect(c.reps).toBe(0)
    expect(c.lapses).toBe(1)
    expect(c.due - 2 * DAY).toBeLessThanOrEqual(10 * 60 * 1000)
  })

  it('does not inflate intervals from repeats in the same session', () => {
    let c = newCard('w:hi', 0)
    c = review(c, { itemId: 'w:hi', correct: true }, 0)
    const again = review(c, { itemId: 'w:hi', correct: true }, 60_000)
    expect(again.interval).toBe(c.interval)
    expect(again.correct).toBe(2)
  })

  it('slow answers lower ease more than fast ones', () => {
    const fast = review(newCard('x', 0), { itemId: 'x', correct: true, ms: 1000 }, 0)
    const slow = review(newCard('x', 0), { itemId: 'x', correct: true, ms: 9000 }, 0)
    expect(fast.ease).toBeGreaterThan(slow.ease)
  })

  it('recall strength decays over time', () => {
    let c = newCard('x', 0)
    c = review(c, { itemId: 'x', correct: true }, 0)
    expect(strength(c, 0)).toBeCloseTo(1)
    expect(strength(c, 5 * DAY)).toBeLessThan(0.2)
  })
})

describe('content integrity', () => {
  it('has unique ids and complete words', () => {
    const ids = VOCAB.map((w) => w.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const w of VOCAB) {
      expect(w.kana).toMatch(/^[぀-ヿー]+$/)
      expect(w.romaji).toMatch(/^[a-z' -]+$/)
      expect(w.region).toBeGreaterThanOrEqual(1)
    }
    for (let r = 1; r <= 5; r++) expect(VOCAB.filter((w) => w.region === r).length).toBe(30)
  })

  it('every activity references valid content', () => {
    const wordIds = new Set(VOCAB.map((w) => w.id))
    for (const a of ACTIVITIES) {
      const p = a.params as Record<string, unknown>
      for (const id of (p.wordIds as string[] | undefined) ?? []) expect(wordIds.has(id), `${a.id}: ${id}`).toBe(true)
      for (const id of (p.sentenceIds as string[] | undefined) ?? []) expect(FORGE_SENTENCES.some((s) => s.id === id), `${a.id}: ${id}`).toBe(true)
      for (const id of (p.runeIds as string[] | undefined) ?? []) expect(RUNES.some((s) => s.id === id)).toBe(true)
      if (p.wordIds) expect((p.wordIds as string[]).length, a.id).toBeGreaterThanOrEqual(4)
    }
    expect(new Set(ACTIVITIES.map((a) => a.id)).size).toBe(ACTIVITIES.length)
    for (const r of REGIONS) expect(activitiesFor(r.id).some((a) => a.stage === 'boss')).toBe(true)
  })

  it('recipes are solvable from starter radicals via unlocks', () => {
    const have = new Set(RADICALS.filter((r) => r.starter).map((r) => r.char))
    const found = new Set<string>()
    let progress = true
    while (progress) {
      progress = false
      for (const r of RECIPES) {
        if (found.has(r.result) || !r.parts.every((p) => have.has(p))) continue
        found.add(r.result)
        r.unlocks?.forEach((u) => have.add(u))
        progress = true
      }
    }
    expect([...found].sort()).toEqual(RECIPES.map((r) => r.result).sort())
    expect(findRecipe(['木', '木', '木'])?.result).toBe('森')
    expect(findRecipe(['木', '人'])?.result).toBe('休')
  })

  it('particle questions include their answers', () => {
    for (const q of PARTICLE_QUESTIONS) expect(q.options).toContain(q.answer)
  })

  it('conjugates adjectives', () => {
    const atsui = ADJECTIVES.find((a) => a.base === '熱い')!
    const shizuka = ADJECTIVES.find((a) => a.base === '静か')!
    expect(conjugate(atsui, 'negative')).toBe('熱くない')
    expect(conjugate(atsui, 'past')).toBe('熱かった')
    expect(conjugate(shizuka, 'attributive')).toBe('静かな')
    expect(conjugate(shizuka, 'negative')).toBe('静かじゃない')
    expect(conjugate({ base: 'いい', kana: 'いい', en: 'good', kind: 'i' }, 'past')).toBe('よかった')
  })

  it('matches English leniently', () => {
    expect(matchesEnglish(getWord('taberu'), 'to eat')).toBe(true)
    expect(matchesEnglish(getWord('hi'), 'Flame')).toBe(true)
    expect(matchesEnglish(getWord('hi'), 'water')).toBe(false)
  })

  it('describes every kind of item', () => {
    expect(describeItem(item.word('mizu'))?.front).toBe('水')
    expect(describeItem(item.kana('あ'))?.meaning).toBe('a')
    expect(describeItem(item.kanji('森'))?.meaning).toBe('forest')
    expect(describeItem(item.kanji('火'))?.meaning).toBe('fire')
    expect(describeItem(item.sentence('f1'))?.meaning).toBe('I drink water.')
  })
})

describe('progression', () => {
  const pass = (s: PlayerState, id: string): PlayerState => ({ ...s, progress: { ...s.progress, [id]: { stars: 1, best: 70, plays: 1, lastPlayed: 0 } } })

  it('unlocks activities sequentially and regions via bosses', () => {
    let s = freshState()
    const r1 = activitiesFor(1)
    expect(activityUnlocked(s, r1[0])).toBe(true)
    expect(activityUnlocked(s, r1[1])).toBe(false)
    s = pass(s, r1[0].id)
    expect(activityUnlocked(s, r1[1])).toBe(true)
    expect(regionUnlocked(s, 2)).toBe(false)
    s = pass(s, 'r1-boss')
    expect(regionUnlocked(s, 2)).toBe(true)
    expect(activityUnlocked(s, activitiesFor(2)[0])).toBe(true)
  })

  it('awards stars by accuracy', () => {
    expect(starsFor({ score: 5, maxScore: 10, reviews: [] })).toBe(0)
    expect(starsFor({ score: 6, maxScore: 10, reviews: [] })).toBe(1)
    expect(starsFor({ score: 8, maxScore: 10, reviews: [] })).toBe(2)
    expect(starsFor({ score: 10, maxScore: 10, reviews: [] })).toBe(3)
    expect(starsFor({ score: 10, maxScore: 10, reviews: [], passed: false })).toBe(0)
  })

  it('levels follow the xp curve', () => {
    expect(levelForXp(0)).toBe(1)
    for (let l = 2; l < 30; l++) {
      expect(levelForXp(xpForLevel(l))).toBe(l)
      expect(levelForXp(xpForLevel(l) - 1)).toBe(l - 1)
    }
  })

  it('applies reviews to srs', () => {
    const s = applyReviews(freshState(), [{ itemId: 'w:hi', correct: true, ms: 800 }])
    expect(s.srs['w:hi'].correct).toBe(1)
  })
})

describe('chronos quests', () => {
  it('generates three quests from unlocked words, deterministic per day', () => {
    const s = freshState()
    const a = generateQuests(s, '2026-01-01')
    const b = generateQuests(s, '2026-01-01')
    expect(a).toHaveLength(3)
    expect(a.map((q) => q.title)).toEqual(b.map((q) => q.title))
    for (const q of a) {
      expect(q.wordIds.length).toBeGreaterThanOrEqual(6)
      expect(new Set(q.wordIds).size).toBe(q.wordIds.length)
      expect(q.wordIds.every((id) => getWord(id).region === 1)).toBe(true)
      expect(questActivity(q).game).toBe(q.game)
    }
  })

  it('prefers weak words', () => {
    let s = freshState()
    const weak = 'neko'
    s = applyReviews(s, Array.from({ length: 4 }, () => ({ itemId: item.word(weak), correct: false })))
    const qs = generateQuests(s, '2026-02-02')
    expect(qs.some((q) => q.wordIds.includes(weak))).toBe(true)
  })

  it('features only unlocked, distinct games', () => {
    const s = freshState()
    const f = featuredToday(s, '2026-03-03')
    expect(new Set(f.map((a) => a.game)).size).toBe(f.length)
    for (const a of f) expect(activityUnlocked(s, a)).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { getWord, VOCAB } from '../data/vocab'
import {
  ambiguous,
  buildChoices,
  comboMultiplier,
  directionFor,
  enemyTravelMs,
  fallSpeed,
  findTarget,
  likelyIntended,
  listeningChoices,
  matchesReading,
  maxBlocks,
  nextWord,
  resolveWords,
  safePool,
  soundAlike,
  spawnDelay,
  speedCastScore,
} from './recognition'

describe('pools', () => {
  it('resolves ids, skipping unknown and duplicate ids', () => {
    expect(resolveWords(['hi', 'nope', 'hi', 'mizu']).map((w) => w.id)).toEqual(['hi', 'mizu'])
  })
  it('safePool never returns an empty pool', () => {
    expect(safePool([]).length).toBeGreaterThan(0)
  })
  it('nextWord avoids recent and excluded words when it can', () => {
    const pool = resolveWords(['hi', 'mizu', 'ki', 'inu', 'neko'])
    for (let i = 0; i < 50; i++) {
      const w = nextWord(pool, () => 1, ['hi', 'mizu'], new Set(['ki']))
      expect(['inu', 'neko']).toContain(w.id)
    }
  })
  it('nextWord still returns something from a one-word pool', () => {
    const pool = resolveWords(['hi'])
    expect(nextWord(pool, () => 1, ['hi']).id).toBe('hi')
  })
  it('nextWord favours weak words', () => {
    const pool = resolveWords(['hi', 'mizu', 'ki', 'inu', 'neko', 'tori'])
    let weakHits = 0
    for (let i = 0; i < 400; i++) if (nextWord(pool, (w) => (w.id === 'neko' ? 10 : 0.1)).id === 'neko') weakHits++
    expect(weakHits).toBeGreaterThan(300)
  })
})

describe('answer checking', () => {
  it('accepts kana and romaji readings', () => {
    const inu = getWord('inu')
    expect(matchesReading(inu, 'いぬ')).toBe(true)
    expect(matchesReading(inu, 'inu')).toBe(true)
    expect(matchesReading(inu, ' いぬ ')).toBe(true)
    expect(matchesReading(inu, 'ねこ')).toBe(false)
    expect(matchesReading(inu, '')).toBe(false)
  })
  it('handles trailing n, long vowels, small tsu and katakana words', () => {
    expect(matchesReading(getWord('hon'), 'hon')).toBe(true)
    expect(matchesReading(getWord('gakkou'), 'gakkou')).toBe(true)
    expect(matchesReading(getWord('pan'), 'ぱん')).toBe(true)
    expect(matchesReading(getWord('pan'), 'パン')).toBe(true)
  })
  it('accepts こんにちわ for こんにちは', () => {
    const w = getWord('konnichiwa')
    expect(matchesReading(w, 'konnichiwa')).toBe(true)
    expect(matchesReading(w, 'konnichiha')).toBe(true)
  })
  it('flags ambiguous pairs', () => {
    expect(ambiguous(getWord('hi'), getWord('honoo'), 'en')).toBe(true) // fire (alt flame) vs flame
    expect(ambiguous(getWord('hi'), getWord('hi-sun'), 'sound')).toBe(true) // ひ / ひ
    expect(ambiguous(getWord('hi'), getWord('hi-sun'), 'jp')).toBe(false)
    expect(ambiguous(getWord('aru'), getWord('iru'), 'en')).toBe(true) // both "there is"
    expect(ambiguous(getWord('inu'), getWord('neko'), 'en')).toBe(false)
  })
})

describe('choices', () => {
  it('builds 4 unique, unambiguous options containing the answer', () => {
    const pool = VOCAB.filter((w) => w.region <= 2)
    for (let i = 0; i < 200; i++) {
      const ans = pool[i % pool.length]
      const opts = buildChoices(ans, pool, 'en')
      expect(opts).toHaveLength(4)
      expect(opts).toContain(ans)
      for (let a = 0; a < opts.length; a++) for (let b = a + 1; b < opts.length; b++) expect(ambiguous(opts[a], opts[b], 'en')).toBe(false)
    }
  })
  it('tops up distractors when the pool is tiny', () => {
    const pool = resolveWords(['inu'])
    const opts = buildChoices(pool[0], pool, 'jp')
    expect(opts).toHaveLength(4)
    expect(new Set(opts.map((o) => o.id)).size).toBe(4)
  })
  it('listening choices exclude homophones and favour similar sounds', () => {
    const pool = VOCAB.filter((w) => w.region === 1)
    for (let i = 0; i < 100; i++) {
      const ans = getWord('hi')
      const opts = listeningChoices(ans, pool)
      expect(opts).toHaveLength(4)
      expect(opts).toContain(ans)
      expect(opts.filter((o) => o.kana === 'ひ')).toHaveLength(1)
      const kana = new Set(opts.map((o) => o.kana))
      expect(kana.size).toBe(4)
    }
    expect(soundAlike('かさ', 'かぎ')).toBeGreaterThan(soundAlike('かさ', 'りんご'))
  })
})

describe('spell defense curve', () => {
  it('speeds up with success, capped at 2×', () => {
    expect(fallSpeed(1, 5)).toBeGreaterThan(fallSpeed(1, 0))
    expect(fallSpeed(1, 1000)).toBeCloseTo(fallSpeed(1, 0) * 2)
    expect(fallSpeed(2, 0)).toBeGreaterThan(fallSpeed(1, 0))
  })
  it('only difficulty 3 has several blocks, growing over time', () => {
    expect(maxBlocks(1, 50)).toBe(1)
    expect(maxBlocks(2, 50)).toBe(1)
    expect(maxBlocks(3, 0)).toBe(2)
    expect(maxBlocks(3, 100)).toBe(4)
    expect(spawnDelay(3, 20)).toBeLessThan(spawnDelay(3, 0))
  })
  it('targets the lowest matching block', () => {
    const blocks = [
      { uid: 1, word: getWord('inu'), y: 10 },
      { uid: 2, word: getWord('inu'), y: 60 },
      { uid: 3, word: getWord('neko'), y: 80 },
    ]
    expect(findTarget(blocks, 'inu')?.uid).toBe(2)
    expect(findTarget(blocks, 'tori')).toBeUndefined()
    expect(likelyIntended(blocks, 'neka')?.uid).toBe(3)
  })
})

describe('speed casting', () => {
  it('combo multiplier grows every 3 and caps at 4', () => {
    expect([0, 2, 3, 6, 9, 30].map(comboMultiplier)).toEqual([1, 1, 2, 3, 4, 4])
  })
  it('enemies get faster but never below the floor', () => {
    expect(enemyTravelMs(5, 10)).toBeLessThan(enemyTravelMs(0, 0))
    expect(enemyTravelMs(100, 100)).toBe(2800)
  })
  it('scores correct over enemies faced with a minimum', () => {
    expect(speedCastScore(18, 20, 60)).toEqual({ score: 18, maxScore: 20 })
    expect(speedCastScore(2, 2, 60)).toEqual({ score: 2, maxScore: 10 })
    expect(speedCastScore(1, 6, 60).maxScore).toBe(10)
  })
  it('mixed direction picks both', () => {
    expect(directionFor('mixed', () => 0.1)).toBe('jp-en')
    expect(directionFor('mixed', () => 0.9)).toBe('en-jp')
    expect(directionFor('en-jp', () => 0.1)).toBe('en-jp')
  })
})

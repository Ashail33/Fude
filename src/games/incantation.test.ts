import { describe, expect, it } from 'vitest'
import { checkIncantation, checkSpoken, normaliseIncantation } from './incantation'

describe('normaliseIncantation', () => {
  it('unifies kanji, katakana and punctuation', () => {
    expect(normaliseIncantation('火の魔法！')).toBe('ひのまほう')
    expect(normaliseIncantation('ヒノマホウ')).toBe('ひのまほう')
    expect(normaliseIncantation(' 水を 使います。')).toBe('みずをつかいます')
    expect(normaliseIncantation('熱い火の魔法')).toBe('あついひのまほう')
  })
})

describe('checkIncantation — accepted variants', () => {
  const accepted: [string, string][] = [
    ['火のまほう', 'fire'],
    ['火の魔法', 'fire'],
    ['ひのまほう', 'fire'],
    ['ひの魔法', 'fire'],
    ['水を使います', 'water'],
    ['みずをつかいます', 'water'],
    ['水をつかう', 'water'],
    ['みずを使う', 'water'],
    ['木のまほう', 'wood'],
    ['土を使います', 'earth'],
    ['光の魔法', 'light'],
    ['ひかりのまほう', 'light'],
    ['風をつかいます', 'wind'],
    ['カゼノマホウ', 'wind'],
  ]
  for (const [spell, el] of accepted) {
    it(`accepts ${spell}`, () => {
      const r = checkIncantation(spell)
      expect(r.valid).toBe(true)
      expect(r.success).toBe(true)
      expect(r.element).toBe(el)
      expect(r.damage).toBe(1)
    })
  }

  it('distinguishes ひ (fire) from ひかり (light)', () => {
    expect(checkIncantation('ひかりをつかう').element).toBe('light')
    expect(checkIncantation('ひをつかう').element).toBe('fire')
  })

  it('reports parts for SRS reviews', () => {
    expect(checkIncantation('火の魔法').parts).toEqual({ element: 'hi', mahou: true })
    expect(checkIncantation('土を使います').parts).toEqual({ element: 'tsuchi', tsukau: true })
  })

  it('builds a canonical written form', () => {
    expect(checkIncantation('ひのまほう').canonical).toBe('火の魔法')
    expect(checkIncantation('つよいかぜをつかう').canonical).toBe('強い風を使う')
  })
})

describe('checkIncantation — particle errors', () => {
  it('flags a missing の', () => {
    const r = checkIncantation('火まほう')
    expect(r.valid).toBe(false)
    expect(r.error).toBe('missing-particle')
    expect(r.feedback).toContain('の')
  })
  it('flags a missing を', () => {
    const r = checkIncantation('水使います')
    expect(r.error).toBe('missing-particle')
    expect(r.feedback).toContain('を')
  })
  it('flags wrong particle before まほう', () => {
    for (const p of ['を', 'は', 'に']) {
      const r = checkIncantation(`火${p}まほう`)
      expect(r.error).toBe('wrong-particle')
      expect(r.feedback).toContain(p)
    }
  })
  it('flags wrong particle before 使います', () => {
    expect(checkIncantation('水に使います').error).toBe('wrong-particle')
    expect(checkIncantation('水は使います').error).toBe('wrong-particle')
    expect(checkIncantation('水の使います').error).toBe('wrong-particle')
  })
})

describe('checkIncantation — other errors', () => {
  it('flags wrong verbs and forms', () => {
    expect(checkIncantation('火を食べます').error).toBe('wrong-verb')
    expect(checkIncantation('火を使いました').error).toBe('wrong-verb')
    expect(checkIncantation('火を使って').error).toBe('wrong-verb')
  })
  it('flags missing element and wrong order', () => {
    expect(checkIncantation('まほう').error).toBe('order')
    expect(checkIncantation('まほうの火').error).toBe('order')
    expect(checkIncantation('ねこのまほう').error).toBe('no-element')
    expect(checkIncantation('').error).toBe('empty')
  })
  it('flags incomplete spells', () => {
    expect(checkIncantation('火').error).toBe('incomplete')
    expect(checkIncantation('火の').error).toBe('incomplete')
  })
})

describe('checkIncantation — enemy weakness', () => {
  it('resists the wrong element but keeps grammar valid', () => {
    const r = checkIncantation('水のまほう', 'fire')
    expect(r.valid).toBe(true)
    expect(r.success).toBe(false)
    expect(r.error).toBe('resisted')
    expect(r.damage).toBe(0)
  })
  it('hits the weakness', () => {
    const r = checkIncantation('火のまほう', 'fire')
    expect(r.success).toBe(true)
    expect(r.damage).toBe(1)
  })
})

describe('checkIncantation — adjective bonus', () => {
  it('adds damage for an i-adjective prefix', () => {
    const r = checkIncantation('熱い火のまほう', 'fire')
    expect(r.success).toBe(true)
    expect(r.adjective?.base).toBe('熱い')
    expect(r.damage).toBe(2)
    expect(checkIncantation('強い風を使います', 'wind').damage).toBe(2)
    expect(checkIncantation('つよいかぜをつかいます', 'wind').damage).toBe(2)
  })
  it('accepts na-adjectives with な', () => {
    const r = checkIncantation('きれいな光のまほう', 'light')
    expect(r.success).toBe(true)
    expect(r.damage).toBe(2)
  })
  it('rejects na-adjective without な and i-adjective with な', () => {
    expect(checkIncantation('きれい光のまほう').error).toBe('adjective-form')
    expect(checkIncantation('熱いな火のまほう').error).toBe('adjective-form')
  })
  it('adds a voice bonus', () => {
    expect(checkIncantation('火のまほう', 'fire', { voice: true }).damage).toBe(2)
    expect(checkIncantation('熱い火のまほう', 'fire', { voice: true }).damage).toBe(3)
  })
})

describe('checkSpoken', () => {
  it('picks the successful alternative among recogniser outputs', () => {
    const r = checkSpoken(['日の魔法', '火の魔法'], 'fire')
    expect(r.success).toBe(true)
    expect(r.damage).toBe(2)
  })
  it('accepts homophones in voice mode', () => {
    expect(checkSpoken(['日の魔法'], 'fire').success).toBe(true)
  })
  it('falls back to the most informative failure', () => {
    const r = checkSpoken(['こんにちは', '水の魔法'], 'fire')
    expect(r.error).toBe('resisted')
  })
})

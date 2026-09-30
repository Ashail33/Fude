import { describe, expect, it } from 'vitest'
import { HIRAGANA, KATAKANA } from '../../data/kana'
import { RECIPES } from '../../data/kanji'
import { ADJECTIVES, conjugate, FORGE_SENTENCES, PARTICLE_QUESTIONS, type AdjForm } from '../../data/sentences'
import { VOCAB } from '../../data/vocab'
import { BLIND_PARTICLE_SETS, CHIMERA_TURNS, SENTENCE_TRAPS, SKINS } from './bossData'
import {
  acceptedSentences,
  adjectiveTraps,
  BLIND_INDICES,
  buildOptions,
  castQuestion,
  checkAdjective,
  checkChimera,
  checkKanaRomaji,
  checkOrder,
  checkSplit,
  chimeraQuestion,
  chimeraTurnsFor,
  createDeck,
  DRAGON_FORMS,
  dragonKanjiPool,
  fuseQuestion,
  kanaPool,
  kanaQuestion,
  kanaWordPool,
  kanaWordQuestion,
  kanjiWordQuestion,
  meaningQuestion,
  orderPool,
  orderQuestion,
  particleAccepted,
  particleQuestion,
  runeQuestion,
  sameParts,
  sentenceQuestion,
  splitQuestion,
  TRAP_SENTENCE_IDS,
  whisperPool,
  whisperQuestion,
  type ChoiceQ,
} from './bossLogic'
import { RUNES } from '../../data/sentences'

const FORMS: AdjForm[] = ['attributive', 'negative', 'past', 'pastNegative']
const REPEAT = 25

function expectWellFormed(q: ChoiceQ, n?: number) {
  expect(new Set(q.options).size).toBe(q.options.length)
  expect(q.accepted.length).toBeGreaterThan(0)
  for (const a of q.accepted) expect(q.options).toContain(a)
  if (n !== undefined) expect(q.options.length).toBe(n)
  expect(q.itemId).toMatch(/^[wkjsrpa]:/)
}

describe('buildOptions', () => {
  it('always includes the answer, never duplicates, honours exclude', () => {
    for (let i = 0; i < 50; i++) {
      const o = buildOptions('a', ['a', 'b', 'b', 'c', 'd', 'x'], 4, ['x'])
      expect(o).toContain('a')
      expect(o).not.toContain('x')
      expect(new Set(o).size).toBe(o.length)
      expect(o.length).toBe(4)
    }
  })
})

describe('createDeck', () => {
  it('never repeats the same item twice in a row and brings back requeued items', () => {
    const d = createDeck([1, 2, 3, 4])
    let prev = -1
    for (let i = 0; i < 40; i++) {
      const x = d.next()
      expect(x).not.toBe(prev)
      prev = x
    }
    const d2 = createDeck(['a', 'b', 'c', 'd', 'e', 'f'])
    const first = d2.next()
    d2.requeue(first)
    const next3 = [d2.next(), d2.next(), d2.next()]
    expect(next3).toContain(first)
  })
})

describe('Kana Oni', () => {
  it('accepts standard and alternative romaji, rejects wrong', () => {
    expect(checkKanaRomaji('し', 'shi')).toBe(true)
    expect(checkKanaRomaji('し', 'SI ')).toBe(true)
    expect(checkKanaRomaji('つ', 'tu')).toBe(true)
    expect(checkKanaRomaji('ふ', 'hu')).toBe(true)
    expect(checkKanaRomaji('を', 'o')).toBe(true)
    expect(checkKanaRomaji('ん', 'nn')).toBe(true)
    expect(checkKanaRomaji('シ', 'shi')).toBe(true)
    expect(checkKanaRomaji('お', 'wo')).toBe(false)
    expect(checkKanaRomaji('し', 'tsu')).toBe(false)
    expect(checkKanaRomaji('し', '')).toBe(false)
  })
  it('generates 4 unique romaji options with the answer for every kana', () => {
    for (const script of ['hiragana', 'katakana', 'both'] as const) {
      const pool = kanaPool(script)
      for (const k of pool) {
        const q = kanaQuestion(k, pool)
        expectWellFormed(q, 4)
        expect(q.accepted).toEqual([k.romaji])
        // No option other than the answer may be accepted by the typing checker.
        for (const o of q.options) if (o !== k.romaji) expect(checkKanaRomaji(k.char, o)).toBe(false)
      }
    }
    expect(kanaPool('hiragana')).toBe(HIRAGANA)
    expect(kanaPool('katakana')).toBe(KATAKANA)
  })
  it('word questions are well formed, and shown in the right script', () => {
    const pool = kanaWordPool()
    expect(pool.length).toBeGreaterThan(10)
    for (let i = 0; i < REPEAT; i++)
      for (const w of pool) {
        const q = kanaWordQuestion(w, 'hiragana', pool)
        expectWellFormed(q, 4)
        expect(q.shown).toBe(w.kana)
      }
    const kq = kanaWordQuestion(pool[0], 'katakana', pool)
    expect(kq.shown).toMatch(/^[゠-ヿ]+$/)
  })
})

describe('Radical Golem', () => {
  it('recipes have unique part multisets', () => {
    const keys = RECIPES.map((r) => [...r.parts].sort().join(''))
    expect(new Set(keys).size).toBe(keys.length)
  })
  it('split tiles always contain every part (with multiplicity) and checking is order-insensitive', () => {
    for (let i = 0; i < REPEAT; i++)
      for (const r of RECIPES) {
        const q = splitQuestion(r)
        expect(q.tiles.length).toBe(8)
        for (const p of new Set(r.parts)) {
          const need = r.parts.filter((x) => x === p).length
          expect(q.tiles.filter((x) => x === p).length).toBeGreaterThanOrEqual(need)
        }
        expect(checkSplit(r, [...r.parts].reverse())).toBe(true)
        expect(checkSplit(r, r.parts.slice(1))).toBe(false)
        expect(checkSplit(r, [...r.parts, r.parts[0]])).toBe(false)
      }
    expect(sameParts(['木', '木', '木'], ['木', '木'])).toBe(false)
  })
  it('fuse and meaning questions are well formed', () => {
    for (let i = 0; i < REPEAT; i++)
      for (const r of RECIPES) {
        expectWellFormed(fuseQuestion(r), 4)
        const m = meaningQuestion(r)
        expectWellFormed(m, 4)
        expect(m.accepted).toEqual([r.result])
      }
  })
})

describe('Particle Guardian', () => {
  it('accepts the answer and listed alternatives only', () => {
    const go = PARTICLE_QUESTIONS[3] // 学校＿行きます
    expect(particleAccepted(go, 'に')).toBe(true)
    expect(particleAccepted(go, 'へ')).toBe(true)
    expect(particleAccepted(go, 'を')).toBe(false)
    const sky = PARTICLE_QUESTIONS[14]
    expect(particleAccepted(sky, 'が')).toBe(true)
    expect(particleAccepted(sky, 'で')).toBe(false)
    expect(particleAccepted(PARTICLE_QUESTIONS[13], 'と')).toBe(false)
    expect(particleAccepted(PARTICLE_QUESTIONS[13], 'と', ['と'])).toBe(true)
  })
  it('phase 1 questions keep the authored options and show English', () => {
    PARTICLE_QUESTIONS.forEach((pq, i) => {
      const q = particleQuestion(i, false)
      expectWellFormed(q, pq.options.length)
      expect(q.en).toBe(pq.en)
      expect(q.accepted).toContain(pq.answer)
    })
  })
  it('blind sets have 4–5 unique options including the answer, and hide English', () => {
    for (const b of BLIND_PARTICLE_SETS) {
      expect(b.options.length).toBeGreaterThanOrEqual(4)
      expect(b.options.length).toBeLessThanOrEqual(5)
      const q = particleQuestion(b.index, true)
      expectWellFormed(q)
      expect(q.en).toBeNull()
      expect(q.accepted).toContain(PARTICLE_QUESTIONS[b.index].answer)
      for (const a of b.accept ?? []) expect(b.options).toContain(a)
    }
    expect(BLIND_INDICES).toContain(3)
    const q3 = particleQuestion(3, true)
    expect(q3.accepted.sort()).toEqual(['に', 'へ'].sort())
  })
})

describe('Silent Librarian', () => {
  it('rune questions contain the answer once among 3', () => {
    for (const r of RUNES) expectWellFormed(runeQuestion(r), 3)
  })
  it('whispers never offer a homophone and have 4 unique written forms', () => {
    const pool = whisperPool()
    for (let i = 0; i < 5; i++)
      for (const w of pool) {
        const q = whisperQuestion(w, pool)
        expectWellFormed(q, 4)
        for (const o of q.options) {
          if (o === w.jp) continue
          const other = VOCAB.find((x) => x.jp === o)!
          expect(other.kana).not.toBe(w.kana)
        }
      }
  })
  it('sentence traps are never an accepted sentence and are pairwise distinct', () => {
    for (const t of SENTENCE_TRAPS) {
      const s = FORGE_SENTENCES.find((x) => x.id === t.id)!
      expect(s).toBeTruthy()
      expect(s.tokens[t.particle.at]).not.toBe(t.particle.to)
      expect(s.tokens[t.word.at]).not.toBe(t.word.to)
      const q = sentenceQuestion(t.id)
      expectWellFormed(q, 3)
      const ok = acceptedSentences(s)
      for (const o of q.options) if (!q.accepted.includes(o)) expect(ok).not.toContain(o)
    }
    expect(TRAP_SENTENCE_IDS.length).toBeGreaterThanOrEqual(10)
  })
})

describe('Adjective Chimera', () => {
  it('conjugates i- and na-adjectives correctly', () => {
    const get = (b: string) => ADJECTIVES.find((a) => a.base === b)!
    expect(conjugate(get('熱い'), 'attributive')).toBe('熱い')
    expect(conjugate(get('大きい'), 'negative')).toBe('大きくない')
    expect(conjugate(get('強い'), 'past')).toBe('強かった')
    expect(conjugate(get('速い'), 'pastNegative')).toBe('速くなかった')
    expect(conjugate(get('静か'), 'attributive')).toBe('静かな')
    expect(conjugate(get('きれい'), 'negative')).toBe('きれいじゃない')
    expect(conjugate(get('元気'), 'past')).toBe('元気だった')
    expect(conjugate(get('きれい'), 'pastNegative')).toBe('きれいじゃなかった')
  })
  it('traps are never accepted, for every adjective and form', () => {
    for (const a of ADJECTIVES)
      for (const f of FORMS) {
        const traps = adjectiveTraps(a, f)
        expect(traps.length).toBeGreaterThanOrEqual(3)
        for (const t of traps) expect(checkAdjective(a, f, t)).toBe(false)
        expect(checkAdjective(a, f, conjugate(a, f))).toBe(true)
      }
  })
  it('includes the classic learner traps', () => {
    const get = (b: string) => ADJECTIVES.find((a) => a.base === b)!
    expect(adjectiveTraps(get('静か'), 'attributive')).toContain('静かい')
    expect(adjectiveTraps(get('大きい'), 'attributive')).toContain('大きいな')
    expect(adjectiveTraps(get('熱い'), 'attributive')).toContain('熱くないな')
    expect(adjectiveTraps(get('大きい'), 'negative')).toContain('大きいじゃない')
    expect(adjectiveTraps(get('きれい'), 'negative')).toContain('きれくない')
    expect(adjectiveTraps(get('強い'), 'past')).toContain('強いかった')
  })
  it('every chimera turn produces a solvable, well-formed question', () => {
    for (let i = 0; i < REPEAT; i++)
      for (const t of CHIMERA_TURNS) {
        expect(SKINS[t.skin]).toBeTruthy()
        expect(!!t.noun !== !!t.frame).toBe(true)
        const q = chimeraQuestion(t)
        expect(q.adjOptions.length).toBe(4)
        expect(new Set(q.adjOptions).size).toBe(4)
        expect(q.adjOptions.filter((o) => checkAdjective(q.adj, t.form, o))).toEqual([q.adjAnswer])
        if (t.noun) {
          expect(q.nounOptions!.length).toBe(3)
          expect(new Set(q.nounOptions).size).toBe(3)
          expect(q.nounOptions).toContain(q.nounAnswer)
        }
        expect(checkChimera(q, q.adjAnswer, q.nounAnswer).ok).toBe(true)
        for (const o of q.adjOptions) if (o !== q.adjAnswer) expect(checkChimera(q, o, q.nounAnswer).ok).toBe(false)
        if (q.nounOptions) for (const n of q.nounOptions) if (n !== q.nounAnswer) expect(checkChimera(q, q.adjAnswer, n).ok).toBe(false)
      }
  })
  it('phases use the right forms', () => {
    expect(chimeraTurnsFor(0).every((t) => t.form === 'attributive')).toBe(true)
    expect(chimeraTurnsFor(1).every((t) => t.form === 'negative')).toBe(true)
    expect(chimeraTurnsFor(2).every((t) => t.form === 'past' || t.form === 'pastNegative')).toBe(true)
    for (const p of [0, 1, 2]) expect(chimeraTurnsFor(p).length).toBeGreaterThanOrEqual(5)
  })
})

describe('Void Dragon', () => {
  it('kanji word questions are well formed', () => {
    const pool = dragonKanjiPool()
    for (const w of pool) expectWellFormed(kanjiWordQuestion(w, pool), 4)
  })
  it('order questions are scrambled and checked against alts', () => {
    const pool = orderPool()
    expect(pool.length).toBeGreaterThanOrEqual(5)
    for (let i = 0; i < REPEAT; i++)
      for (const s of pool) {
        const q = orderQuestion(s)
        expect([...q.tiles].sort()).toEqual([...s.tokens].sort())
        expect(checkOrder(s, q.tiles)).toBe(false)
        expect(checkOrder(s, s.tokens)).toBe(true)
      }
    const f10 = FORGE_SENTENCES.find((s) => s.id === 'f10')!
    expect(checkOrder(f10, ['明日', '家', 'へ', '帰ります'])).toBe(true)
  })
  it('cast questions have exactly one correct incantation', () => {
    for (const f of DRAGON_FORMS)
      for (const p of ['no', 'wo'] as const) {
        const q = castQuestion(f, p)
        expectWellFormed(q, 4)
        expect(q.accepted).toEqual([p === 'no' ? `${q.spell.noun}のまほう` : `${q.spell.noun}を使います`])
        for (const o of q.options) if (o !== q.accepted[0]) expect(q.why[o]).toBeTruthy()
      }
  })
})

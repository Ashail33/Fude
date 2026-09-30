import { KANA_BY_CHAR } from '../data/kana'
import { RADICAL_BY_CHAR, RECIPES } from '../data/kanji'
import { FORGE_SENTENCES, PARTICLE_QUESTIONS, RUNES } from '../data/sentences'
import { VOCAB, WORD_BY_ID } from '../data/vocab'

/**
 * Every learnable thing has a string item id, which keys its SRS card:
 *   w:<wordId>   vocabulary word
 *   k:<char>     kana character
 *   j:<char>     kanji (from crafting recipes / drawing)
 *   s:<id>       forge sentence
 *   r:<id>       rune (reading)
 *   p:<index>    particle question
 *   a:<base>     adjective conjugation
 */
export const item = {
  word: (id: string) => `w:${id}`,
  kana: (char: string) => `k:${char}`,
  kanji: (char: string) => `j:${char}`,
  sentence: (id: string) => `s:${id}`,
  rune: (id: string) => `r:${id}`,
  particle: (i: number) => `p:${i}`,
  adjective: (base: string) => `a:${base}`,
}

export type ItemKind = 'word' | 'kana' | 'kanji' | 'sentence' | 'rune' | 'particle' | 'adjective'

export interface ItemInfo {
  id: string
  kind: ItemKind
  front: string
  reading?: string
  meaning: string
  emoji?: string
}

const KIND: Record<string, ItemKind> = { w: 'word', k: 'kana', j: 'kanji', s: 'sentence', r: 'rune', p: 'particle', a: 'adjective' }

export function describeItem(id: string): ItemInfo | undefined {
  const [prefix, ...rest] = id.split(':')
  const key = rest.join(':')
  const kind = KIND[prefix]
  if (!kind) return undefined
  switch (kind) {
    case 'word': {
      const w = WORD_BY_ID.get(key)
      return w && { id, kind, front: w.jp, reading: w.kana, meaning: w.en, emoji: w.emoji }
    }
    case 'kana': {
      const k = KANA_BY_CHAR.get(key)
      return k && { id, kind, front: k.char, reading: k.romaji, meaning: k.romaji }
    }
    case 'kanji': {
      const r = RECIPES.find((x) => x.result === key)
      if (r) return { id, kind, front: key, reading: r.reading, meaning: r.meaning, emoji: r.emoji }
      const rad = RADICAL_BY_CHAR.get(key)
      if (rad) return { id, kind, front: key, reading: rad.reading, meaning: rad.meaning, emoji: rad.emoji }
      const w = VOCAB.find((x) => x.jp === key)
      return { id, kind, front: key, reading: w?.kana, meaning: w?.en ?? 'kanji', emoji: w?.emoji }
    }
    case 'sentence': {
      const s = FORGE_SENTENCES.find((x) => x.id === key)
      return s && { id, kind, front: s.tokens.join(''), meaning: s.en }
    }
    case 'rune': {
      const r = RUNES.find((x) => x.id === key)
      return r && { id, kind, front: r.jp, reading: r.reading, meaning: r.answer }
    }
    case 'particle': {
      const p = PARTICLE_QUESTIONS[Number(key)]
      return p && { id, kind, front: `${p.before}${p.answer}${p.after}`, meaning: p.en }
    }
    case 'adjective':
      return { id, kind, front: key, meaning: 'adjective conjugation' }
  }
}

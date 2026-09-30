/** Pure logic for G6 Sentence Forge (order checking, furigana lookup, word detection). */
import type { ForgeSentence } from '../data/sentences'
import { VOCAB } from '../data/vocab'

export const FORGE_PARTICLES = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'の'] as const

export const PARTICLE_ROLE: Record<string, string> = {
  は: 'topic',
  が: 'subject',
  を: 'object',
  に: 'target / destination',
  で: 'place / means',
  へ: 'direction',
  と: 'with',
  の: "'s (links nouns)",
}

export function isParticle(t: string): boolean {
  return (FORGE_PARTICLES as readonly string[]).includes(t)
}

const hasKanji = (s: string) => /[一-龯㐀-䶿々]/.test(s)

/** Reading of a polite masu form from the dictionary form + its kana. */
function masuReading(jp: string, kana: string, masu: string): string | undefined {
  if (jp === '来る') return 'きます'
  // Common kanji prefix, then swap okurigana.
  let i = 0
  while (i < jp.length && i < masu.length && jp[i] === masu[i] && hasKanji(jp[i])) i++
  if (i === 0) return undefined
  const dictOkuri = jp.slice(i)
  if (!kana.endsWith(dictOkuri)) return undefined
  return kana.slice(0, kana.length - dictOkuri.length) + masu.slice(i)
}

/** Readings for tokens that aren't vocabulary words. */
const EXTRA_READINGS: Record<string, string> = {
  日本語: 'にほんご',
  家: 'いえ',
}

const READINGS = new Map<string, string>()
const WORD_OF = new Map<string, string>()
for (const w of VOCAB) {
  if (!READINGS.has(w.jp)) READINGS.set(w.jp, w.kana)
  if (!WORD_OF.has(w.jp)) WORD_OF.set(w.jp, w.id)
  if (w.masu) {
    const r = masuReading(w.jp, w.kana, w.masu)
    if (r && !READINGS.has(w.masu)) READINGS.set(w.masu, r)
    if (!WORD_OF.has(w.masu)) WORD_OF.set(w.masu, w.id)
  }
}
for (const [k, v] of Object.entries(EXTRA_READINGS)) if (!READINGS.has(k)) READINGS.set(k, v)

/** Kana reading for a tile if it contains kanji and the reading is known. */
export function readingOf(token: string): string | undefined {
  if (!hasKanji(token)) return undefined
  return READINGS.get(token)
}

/** Vocabulary word ids recognisable in a sentence's tokens (deduplicated). */
export function wordIdsIn(tokens: string[]): string[] {
  const out: string[] = []
  for (const t of tokens) {
    const id = WORD_OF.get(t)
    if (id && !out.includes(id)) out.push(id)
  }
  return out
}

export interface OrderCheck {
  correct: boolean
  /** First wrong position in the attempt (may equal attempt.length when tiles are missing). */
  wrongIndex: number
  /** The accepted order that the attempt was compared against. */
  target: string[]
}

/** Compare an attempt against the sentence's tokens and alternative orders. */
export function checkOrder(attempt: string[], s: ForgeSentence): OrderCheck {
  const targets = [s.tokens, ...(s.alts ?? [])]
  let best: OrderCheck | undefined
  for (const target of targets) {
    if (target.length === attempt.length && target.every((t, i) => t === attempt[i])) return { correct: true, wrongIndex: -1, target }
    let i = 0
    while (i < attempt.length && i < target.length && attempt[i] === target[i]) i++
    if (!best || i > best.wrongIndex) best = { correct: false, wrongIndex: i, target }
  }
  return best!
}

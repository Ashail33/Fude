/**
 * Incantation checker for G8 Spell Creation Combat.
 *
 * Accepted patterns for an element noun N (optionally preceded by an
 * adjective A — i-adjective directly, na-adjective + な):
 *   [A] N の まほう / 魔法
 *   [A] N を つかいます / 使います
 *   [A] N を つかう / 使う
 *
 * Input may mix kanji, hiragana and katakana (typed or recognised speech);
 * it is normalised to hiragana before parsing.
 */
import { toHiragana } from 'wanakana'
import { ADJECTIVES, ELEMENT_SPELLS, type Adjective, type ElementSpell } from '../data/sentences'

export type SpellElement = ElementSpell['element']

export type CastError =
  | 'empty'
  | 'no-element'
  | 'order'
  | 'missing-particle'
  | 'wrong-particle'
  | 'wrong-verb'
  | 'adjective-form'
  | 'incomplete'
  | 'extra'
  | 'resisted'

export interface CastResult {
  /** Grammatically valid incantation. */
  valid: boolean
  /** Valid AND hits the enemy's weakness (damage > 0). */
  success: boolean
  error?: CastError
  /** Specific feedback in English (always set when !success). */
  feedback: string
  element?: SpellElement
  adjective?: Adjective
  pattern?: 'no-mahou' | 'wo-tsukau'
  /** Canonical written form of what was cast (for speaking / display). */
  canonical?: string
  /** Vocabulary ids of the parts used (for SRS reviews). */
  parts: { element?: string; mahou?: boolean; tsukau?: boolean }
  damage: number
}

/** Vocabulary word id for each element noun. */
export const ELEMENT_WORD: Record<SpellElement, string> = {
  fire: 'hi',
  water: 'mizu',
  wood: 'ki',
  earth: 'tsuchi',
  light: 'hikari',
  wind: 'kaze',
}

const PARTICLES = ['は', 'が', 'を', 'に', 'で', 'へ', 'と', 'の', 'も']

/** Kanji / written forms → kana. Longest keys are applied first. */
const WRITTEN: [string, string][] = [
  ['魔法', 'まほう'],
  ['使います', 'つかいます'],
  ['使う', 'つかう'],
  ['使', 'つか'],
  ['食べます', 'たべます'],
  ['食べる', 'たべる'],
  ['飲みます', 'のみます'],
  ['飲む', 'のむ'],
  ['見ます', 'みます'],
  ...ELEMENT_SPELLS.map((e): [string, string] => [e.noun, e.kana]),
  ...ADJECTIVES.filter((a) => a.base !== a.kana).map((a): [string, string] => [a.base, a.kana]),
]

/** Extra homophones that speech recognisers like to return. */
const HOMOPHONES: [string, string][] = [
  ['風邪', 'かぜ'],
  ['日', 'ひ'],
  ['陽', 'ひ'],
  ['灯', 'ひ'],
  ['樹', 'き'],
  ['気', 'き'],
  ['槌', 'つち'],
  ['暑い', 'あつい'],
  ['厚い', 'あつい'],
  ['早い', 'はやい'],
  ['魔砲', 'まほう'],
  ['まほー', 'まほう'],
]

function replaceAll(s: string, pairs: [string, string][]): string {
  const sorted = [...pairs].sort((a, b) => b[0].length - a[0].length)
  let out = s
  for (const [from, to] of sorted) out = out.split(from).join(to)
  return out
}

/** Normalise any mix of kanji/kana/punctuation to plain hiragana. */
export function normaliseIncantation(input: string, opts: { lenient?: boolean } = {}): string {
  let s = input.normalize('NFKC').replace(/[\s。、，．！？!?.,「」『』・〜~…'"-]/g, '')
  if (opts.lenient) s = replaceAll(s, HOMOPHONES)
  s = replaceAll(s, WRITTEN)
  // Katakana → hiragana (leaves remaining kanji untouched), then stray romaji.
  s = toHiragana(s, { passRomaji: false })
  return s.replace(/ー/g, '')
}

const ELEMENTS_BY_LENGTH = [...ELEMENT_SPELLS].sort((a, b) => b.kana.length - a.kana.length)
const ADJ_BY_LENGTH = [...ADJECTIVES].sort((a, b) => b.kana.length - a.kana.length)

function matchElement(s: string): ElementSpell | undefined {
  return ELEMENTS_BY_LENGTH.find((e) => s.startsWith(e.kana))
}

interface AdjMatch {
  adj: Adjective
  rest: string
  error?: string
}

/** Try to peel an adjective off the front of `s` such that an element noun follows. */
function matchAdjective(s: string): AdjMatch | undefined {
  for (const adj of ADJ_BY_LENGTH) {
    if (!s.startsWith(adj.kana)) continue
    let rest = s.slice(adj.kana.length)
    if (adj.kind === 'na') {
      if (rest.startsWith('な')) {
        rest = rest.slice(1)
        if (matchElement(rest)) return { adj, rest }
      } else if (matchElement(rest)) {
        return { adj, rest, error: `${adj.base} is a na-adjective: it needs な before a noun (${adj.base}な…).` }
      }
    } else {
      if (matchElement(rest)) return { adj, rest }
      if (rest.startsWith('な') && matchElement(rest.slice(1)))
        return { adj, rest: rest.slice(1), error: `${adj.base} is an i-adjective: it attaches directly to the noun, no な (${adj.base}…).` }
      if (rest.startsWith('の') && matchElement(rest.slice(1)))
        return { adj, rest: rest.slice(1), error: `Adjectives attach directly to the noun — drop the の after ${adj.base}.` }
    }
  }
  return undefined
}

const VERB_TSUKAU = ['つかいます', 'つかう']
const WRONG_TENSE: [string, string][] = [
  ['つかいました', 'past tense'],
  ['つかった', 'past tense'],
  ['つかって', 'て-form'],
  ['つかいません', 'negative'],
  ['つかわない', 'negative'],
  ['つかえ', 'command form'],
  ['つかい', 'stem only'],
]
const DECOY_VERBS: [string, string][] = [
  ['たべます', 'eat'],
  ['たべる', 'eat'],
  ['のみます', 'drink'],
  ['のむ', 'drink'],
  ['みます', 'see'],
  ['します', 'do'],
]

const example = (e: ElementSpell) => `${e.noun}のまほう / ${e.noun}を使います`

function fail(error: CastError, feedback: string, extra: Partial<CastResult> = {}): CastResult {
  return { valid: false, success: false, error, feedback, parts: {}, damage: 0, ...extra }
}

/**
 * Check an incantation.
 * @param weakness the enemy's weak element (omit to accept any element)
 * @param opts.voice spoken via microphone → Voice-to-Magic bonus damage
 * @param opts.lenient accept speech-recognition homophones (日→ひ etc.)
 */
export function checkIncantation(
  input: string,
  weakness?: SpellElement,
  opts: { voice?: boolean; lenient?: boolean } = {},
): CastResult {
  const s = normaliseIncantation(input, { lenient: opts.lenient ?? opts.voice })
  if (!s) return fail('empty', 'Say or build an incantation first.')

  // Optional adjective prefix.
  let adj: Adjective | undefined
  let body = s
  let adjError: string | undefined
  const am = matchAdjective(s)
  if (am) {
    adj = am.adj
    body = am.rest
    adjError = am.error
  }

  const el = matchElement(body)
  if (!el) {
    if (s.startsWith('まほう') || VERB_TSUKAU.some((v) => s.startsWith(v)) || PARTICLES.includes(s[0]))
      return fail('order', 'Name the element first, then link it: 火のまほう (fire magic) or 火を使います (use fire).')
    return fail('no-element', 'No element named. Use 火 (ひ), 水 (みず), 木 (き), 土 (つち), 光 (ひかり) or 風 (かぜ).')
  }
  const parts: CastResult['parts'] = { element: ELEMENT_WORD[el.element] }
  const base = { element: el.element, adjective: adj, parts }
  if (adjError) return fail('adjective-form', adjError, base)

  const tail = body.slice(el.kana.length)
  let pattern: CastResult['pattern']

  if (tail === '') return fail('incomplete', `The spell is unfinished. Try ${example(el)}.`, base)

  const particle = PARTICLES.includes(tail[0]) ? tail[0] : ''
  const after = tail.slice(particle.length)

  if (after === 'まほう') {
    parts.mahou = true
    if (particle === 'の') pattern = 'no-mahou'
    else if (!particle) return fail('missing-particle', `Missing particle: link two nouns with の → ${el.noun}のまほう.`, base)
    else return fail('wrong-particle', `Wrong particle ${particle}: two nouns are linked with の → ${el.noun}のまほう.`, base)
  } else if (VERB_TSUKAU.includes(after)) {
    parts.tsukau = true
    if (particle === 'を') pattern = 'wo-tsukau'
    else if (!particle) return fail('missing-particle', `Missing particle: the thing you use takes を → ${el.noun}を${after === 'つかう' ? '使う' : '使います'}.`, base)
    else if (particle === 'の')
      return fail('wrong-particle', `の links nouns, but 使います is a verb — the thing you use takes を → ${el.noun}を使います.`, base)
    else return fail('wrong-particle', `Wrong particle ${particle}: the thing you use takes を → ${el.noun}を使います.`, base)
  } else {
    const tense = WRONG_TENSE.find(([v]) => after === v)
    if (tense) {
      parts.tsukau = true
      return fail('wrong-verb', `Wrong verb form (${tense[1]}). Cast in the present: 使います or 使う.`, base)
    }
    const decoy = DECOY_VERBS.find(([v]) => after === v)
    if (decoy) return fail('wrong-verb', `That verb means "${decoy[1]}" — you can't ${decoy[1]} a spell! Use 使います (use).`, base)
    if (after.startsWith('まほう') || VERB_TSUKAU.some((v) => after.startsWith(v)))
      return fail('extra', `Extra words after the spell. End it with まほう or 使います.`, base)
    if (particle && after === '') return fail('incomplete', `The spell stops at the particle. Finish it: ${example(el)}.`, base)
    return fail('wrong-verb', `Unknown ending. Finish with のまほう or を使います: ${example(el)}.`, base)
  }

  const adjPart = adj ? adj.base : ''
  const canonical = pattern === 'no-mahou' ? `${adjPart}${el.noun}の魔法` : `${adjPart}${el.noun}を${after === 'つかう' ? '使う' : '使います'}`
  const valid = { ...base, valid: true, pattern, canonical }

  if (weakness && el.element !== weakness)
    return { ...valid, success: false, error: 'resisted', feedback: `Perfect grammar — but ${el.en} (${el.noun}) is resisted! Find the enemy's weakness.`, damage: 0 }

  let damage = 1
  if (adj) damage += 1
  if (opts.voice) damage += 1
  return { ...valid, success: true, feedback: 'The spell strikes true!', damage }
}

/**
 * Check several recognised speech alternatives; returns the best result
 * (a success if any alternative succeeds, else the first valid one, else the first).
 */
export function checkSpoken(alts: string[], weakness?: SpellElement): CastResult & { heard: string } {
  const results = alts.map((a) => ({ ...checkIncantation(a, weakness, { voice: true, lenient: true }), heard: a }))
  return (
    results.find((r) => r.success) ??
    results.find((r) => r.valid) ??
    results.find((r) => r.element) ??
    results[0] ?? { ...fail('empty', "Couldn't hear a spell. Try again."), heard: '' }
  )
}

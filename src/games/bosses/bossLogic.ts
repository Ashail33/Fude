/**
 * Pure question generation and answer checking for the six boss battles.
 * Kept free of React so it can be unit-tested (see bossLogic.test.ts).
 */
import { toKatakana } from 'wanakana'
import { ALL_KANA, HIRAGANA, KANA_BY_CHAR, KATAKANA, type Kana, type Script } from '../../data/kana'
import { RADICALS, RADICAL_BY_CHAR, RECIPES, type KanjiRecipe } from '../../data/kanji'
import {
  ADJECTIVES,
  ELEMENT_SPELLS,
  FORGE_SENTENCES,
  PARTICLE_QUESTIONS,
  conjugate,
  type Adjective,
  type AdjForm,
  type ElementSpell,
  type ForgeSentence,
  type Particle,
  type ParticleQuestion,
  type Rune,
} from '../../data/sentences'
import { VOCAB, type Word } from '../../data/vocab'
import { item } from '../../engine/items'
import { shuffle } from '../../engine/random'
import { BLIND_PARTICLE_SETS, CHIMERA_TURNS, DRAGON_FORMS, SENTENCE_TRAPS, SKINS, type ChimeraTurn, type DragonForm } from './bossData'

// ─── Generic helpers ─────────────────────────────────────────────────────

/** A multiple-choice question: `accepted` ⊆ `options`, all options unique. */
export interface ChoiceQ {
  itemId: string
  options: string[]
  accepted: string[]
}

export function isAccepted(q: Pick<ChoiceQ, 'accepted'>, pick: string): boolean {
  return q.accepted.includes(pick)
}

/**
 * Build `n` unique options containing `answer`, drawing distractors from
 * `pool` in order (so callers can put preferred distractors first; shuffle
 * the rest yourself), skipping anything equal to the answer or in `exclude`.
 */
export function buildOptions(answer: string, pool: readonly string[], n: number, exclude: readonly string[] = []): string[] {
  const seen = new Set([answer, ...exclude])
  const out = [answer]
  for (const p of pool) {
    if (out.length >= n) break
    if (seen.has(p)) continue
    seen.add(p)
    out.push(p)
  }
  return shuffle(out)
}

/**
 * A draw pile that favours weak items (by `weight`) and brings missed items
 * back a couple of turns later so the player gets another shot.
 */
export interface Deck<T> {
  next(): T
  requeue(t: T): void
}

export function createDeck<T>(items: readonly T[], weight: (t: T) => number = () => 1, rng: () => number = Math.random): Deck<T> {
  if (!items.length) throw new Error('Empty deck')
  let pool: T[] = [...items]
  const soon: { t: T; wait: number }[] = []
  let last: T | undefined
  return {
    next() {
      soon.forEach((s) => (s.wait -= 1))
      const readyIdx = soon.findIndex((s) => s.wait <= 0 && s.t !== last)
      if (readyIdx >= 0) {
        const [s] = soon.splice(readyIdx, 1)
        last = s.t
        return s.t
      }
      let candidates = pool.filter((t) => t !== last)
      if (!candidates.length) {
        pool = [...items]
        candidates = pool.filter((t) => t !== last)
        if (!candidates.length) candidates = pool
      }
      const ws = candidates.map((t) => Math.max(0.05, weight(t)))
      const total = ws.reduce((a, b) => a + b, 0)
      let r = rng() * total
      let idx = 0
      for (; idx < candidates.length - 1; idx++) {
        r -= ws[idx]
        if (r <= 0) break
      }
      const t = candidates[idx]
      pool = pool.filter((x) => x !== t)
      last = t
      return t
    },
    requeue(t: T) {
      if (!soon.some((s) => s.t === t)) soon.push({ t, wait: 2 })
    },
  }
}

/** Two words whose English meanings overlap (so one can't be a distractor for the other). */
export function enClash(a: Word, b: Word): boolean {
  const as = [a.en, ...(a.alt ?? [])].map((x) => x.toLowerCase())
  const bs = [b.en, ...(b.alt ?? [])].map((x) => x.toLowerCase())
  return as.some((x) => bs.includes(x))
}

// ─── 1. Kana Oni ─────────────────────────────────────────────────────────

export function kanaPool(script: Script | 'both'): Kana[] {
  return script === 'hiragana' ? HIRAGANA : script === 'katakana' ? KATAKANA : ALL_KANA
}

/** Alternative romanisations accepted when typing (Nihon-shiki etc.). */
const ALT_ROMAJI: Record<string, string[]> = {
  shi: ['si'],
  chi: ['ti'],
  tsu: ['tu'],
  fu: ['hu'],
  wo: ['o'],
  n: ['nn', "n'"],
}

export function acceptedRomaji(char: string): string[] {
  const k = KANA_BY_CHAR.get(char)
  if (!k) return []
  return [k.romaji, ...(ALT_ROMAJI[k.romaji] ?? [])]
}

export function checkKanaRomaji(char: string, input: string): boolean {
  const s = input.trim().toLowerCase()
  return !!s && acceptedRomaji(char).includes(s)
}

export interface KanaQ extends ChoiceQ {
  char: string
  romaji: string
}

export function kanaQuestion(k: Kana, pool: readonly Kana[]): KanaQ {
  const accepted = acceptedRomaji(k.char)
  // Prefer a same-row distractor (harder), then random ones.
  const sameRow = pool.filter((x) => x.row === k.row && x.romaji !== k.romaji).map((x) => x.romaji)
  const first = shuffle(sameRow).slice(0, 1)
  const rest = pool.map((x) => x.romaji)
  const options = buildOptions(k.romaji, [...first, ...shuffle(rest)], 4, accepted)
  return { itemId: item.kana(k.char), char: k.char, romaji: k.romaji, options, accepted: [k.romaji] }
}

/** Region-1 words suitable for "read the whole word" (short, kana only once rendered). */
export function kanaWordPool(): Word[] {
  return VOCAB.filter((w) => w.region === 1 && w.kana.length <= 4 && w.pos !== 'expression')
}

export interface KanaWordQ extends ChoiceQ {
  wordId: string
  shown: string
  emoji: string
}

export function kanaWordQuestion(w: Word, script: Script | 'both', pool: readonly Word[] = kanaWordPool()): KanaWordQ {
  const shown = script === 'katakana' ? toKatakana(w.kana) : w.kana
  const options = buildOptions(
    w.en,
    shuffle(pool.filter((x) => x.kana !== w.kana && !enClash(w, x)).map((x) => x.en)),
    4,
    w.alt ?? [],
  )
  return { itemId: item.word(w.id), wordId: w.id, shown, emoji: w.emoji, options, accepted: [w.en] }
}

// ─── 2. Radical Golem ────────────────────────────────────────────────────

export function sameParts(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && [...a].sort().join('') === [...b].sort().join('')
}

export interface SplitQ {
  itemId: string
  kanji: string
  recipe: KanjiRecipe
  /** Tiles to choose from (may contain duplicates, e.g. 木 ×3 for 森). */
  tiles: string[]
}

export function splitQuestion(r: KanjiRecipe, size = 8): SplitQ {
  const extra = shuffle(RADICALS.map((x) => x.char).filter((c) => !r.parts.includes(c)))
  // A spare copy of one real part makes "pick the right count" matter.
  const spare = shuffle(r.parts)[0]
  const tiles = shuffle([...r.parts, spare, ...extra.slice(0, Math.max(0, size - r.parts.length - 1))])
  return { itemId: item.kanji(r.result), kanji: r.result, recipe: r, tiles }
}

export function checkSplit(r: KanjiRecipe, picked: readonly string[]): boolean {
  return sameParts(r.parts, picked)
}

export interface FuseQ extends ChoiceQ {
  parts: string[]
  recipe: KanjiRecipe
}

export function fuseQuestion(r: KanjiRecipe): FuseQ {
  // Prefer distractors sharing a component (harder to guess).
  const sharing = RECIPES.filter((x) => x !== r && x.parts.some((p) => r.parts.includes(p))).map((x) => x.result)
  const others = RECIPES.filter((x) => x !== r).map((x) => x.result)
  const pool = [...shuffle(sharing).slice(0, 2)]
  const opts = buildOptions(r.result, [...pool, ...shuffle(others)].slice(0, 30), 4)
  return { itemId: item.kanji(r.result), parts: shuffle(r.parts), recipe: r, options: opts, accepted: [r.result] }
}

export interface MeaningQ extends ChoiceQ {
  meaning: string
  emoji: string
  recipe: KanjiRecipe
}

export function meaningQuestion(r: KanjiRecipe): MeaningQ {
  const pool = RECIPES.filter((x) => x.meaning !== r.meaning).map((x) => x.result)
  return { itemId: item.kanji(r.result), meaning: r.meaning, emoji: r.emoji, recipe: r, options: buildOptions(r.result, shuffle(pool), 4), accepted: [r.result] }
}

export function radicalLabel(c: string): { char: string; form?: string; meaning: string } {
  const r = RADICAL_BY_CHAR.get(c)
  return { char: c, form: r?.form, meaning: r?.meaning ?? '' }
}

// ─── 3. Particle Guardian ────────────────────────────────────────────────

export function particleAccepted(q: ParticleQuestion, p: string, extra: readonly string[] = []): boolean {
  return p === q.answer || (q.accept ?? []).includes(p as Particle) || extra.includes(p)
}

export interface ParticleQ extends ChoiceQ {
  index: number
  q: ParticleQuestion
  /** English shown (phase 1) or hidden (phase 2). */
  en: string | null
}

export function particleQuestion(index: number, blind: boolean): ParticleQ {
  const q = PARTICLE_QUESTIONS[index]
  const set = blind ? BLIND_PARTICLE_SETS.find((b) => b.index === index) : undefined
  const options = shuffle(set ? set.options : q.options)
  const accepted = options.filter((o) => particleAccepted(q, o, set?.accept ?? []))
  return { itemId: item.particle(index), index, q, en: blind && set ? null : q.en, options, accepted }
}

export const BLIND_INDICES = BLIND_PARTICLE_SETS.map((b) => b.index)

// ─── 4. Silent Librarian ─────────────────────────────────────────────────

export interface RuneQ extends ChoiceQ {
  rune: Rune
}

export function runeQuestion(r: Rune): RuneQ {
  return { itemId: item.rune(r.id), rune: r, options: shuffle([r.answer, ...r.wrong]), accepted: [r.answer] }
}

/** Words the librarian can whisper: written with kanji, region ≤ 4. */
export function whisperPool(): Word[] {
  return VOCAB.filter((w) => w.region <= 4 && w.jp !== w.kana && w.pos !== 'expression')
}

export interface WhisperQ extends ChoiceQ {
  word: Word
}

export function whisperQuestion(w: Word, pool: readonly Word[] = whisperPool()): WhisperQ {
  // Never offer a homophone (e.g. 火 / 日 are both ひ) — the ear can't tell them apart.
  const candidates = pool.filter((x) => x.kana !== w.kana)
  const sameLen = candidates.filter((x) => x.jp.length === w.jp.length).map((x) => x.jp)
  const opts = buildOptions(w.jp, [...shuffle(sameLen).slice(0, 2), ...shuffle(candidates.map((x) => x.jp))], 4)
  return { itemId: item.word(w.id), word: w, options: opts, accepted: [w.jp] }
}

export interface SentenceQ extends ChoiceQ {
  sentence: ForgeSentence
  /** Explanation per wrong option. */
  why: Record<string, string>
}

export function joinTokens(tokens: readonly string[]): string {
  return tokens.join('')
}

export function acceptedSentences(s: ForgeSentence): string[] {
  return [s.tokens, ...(s.alts ?? [])].map(joinTokens)
}

export const TRAP_SENTENCE_IDS = SENTENCE_TRAPS.map((t) => t.id)

export function sentenceQuestion(id: string): SentenceQ {
  const s = FORGE_SENTENCES.find((x) => x.id === id)
  const trap = SENTENCE_TRAPS.find((t) => t.id === id)
  if (!s || !trap) throw new Error(`No sentence trap for ${id}`)
  const swap = (at: number, to: string) => joinTokens(s.tokens.map((t, i) => (i === at ? to : t)))
  const correct = joinTokens(s.tokens)
  const wrongP = swap(trap.particle.at, trap.particle.to)
  const wrongW = swap(trap.word.at, trap.word.to)
  return {
    itemId: item.sentence(s.id),
    sentence: s,
    options: shuffle([correct, wrongP, wrongW]),
    accepted: [correct],
    why: {
      [wrongP]: `Wrong particle: ${trap.particle.to} can't stand where ${s.tokens[trap.particle.at]} belongs. ${s.hint}`,
      [wrongW]: `Wrong word: ${trap.word.to} changes the meaning (it should be ${s.tokens[trap.word.at]}).`,
    },
  }
}

// ─── 5. Adjective Chimera ────────────────────────────────────────────────

export const ADJ_BY_BASE = new Map(ADJECTIVES.map((a) => [a.base, a]))

export function getAdjective(base: string): Adjective {
  const a = ADJ_BY_BASE.get(base)
  if (!a) throw new Error(`Unknown adjective ${base}`)
  return a
}

/** Plausible learner mistakes for a given adjective + form. Never includes the correct form. */
export function adjectiveTraps(adj: Adjective, form: AdjForm): string[] {
  const b = adj.base
  let traps: string[]
  if (adj.kind === 'i') {
    const stem = b.slice(0, -1)
    switch (form) {
      case 'attributive':
        traps = [`${b}な`, `${stem}くないな`, `${stem}くない`, `${b}の`]
        break
      case 'negative':
        traps = [`${b}じゃない`, `${b}ない`, `${stem}くないな`, `${stem}かった`]
        break
      case 'past':
        traps = [`${b}かった`, `${b}だった`, `${stem}くなかった`, `${stem}くない`]
        break
      case 'pastNegative':
        traps = [`${b}じゃなかった`, `${stem}かったない`, `${stem}かった`, `${stem}くない`]
        break
    }
  } else {
    // na-adjectives; ones ending in い (きれい) tempt an i-adjective treatment.
    const fakeStem = b.endsWith('い') ? b.slice(0, -1) : b
    switch (form) {
      case 'attributive':
        // (No ～の trap: 元気 is also a noun, so 元気の… can be valid.)
        traps = [...(b.endsWith('い') ? [] : [`${b}い`]), b, `${b}だ`, `${b}じゃないな`]
        break
      case 'negative':
        traps = [`${fakeStem}くない`, `${b}ない`, `${b}なじゃない`, `${b}だった`]
        break
      case 'past':
        traps = [`${fakeStem}かった`, `${b}なだった`, `${b}かった`, `${b}じゃなかった`]
        break
      case 'pastNegative':
        traps = [`${fakeStem}くなかった`, `${b}じゃないだった`, `${b}なかった`, `${b}だった`]
        break
    }
  }
  const correct = conjugate(adj, form)
  return [...new Set(traps.filter((t) => t !== correct))]
}

export function checkAdjective(adj: Adjective, form: AdjForm, picked: string): boolean {
  return picked === conjugate(adj, form)
}

/** The rule to show after a mistake. */
export function adjectiveRule(adj: Adjective, form: AdjForm): string {
  const c = conjugate(adj, form)
  if (adj.kind === 'i') {
    switch (form) {
      case 'attributive':
        return `${adj.base} is an i-adjective: it goes straight before the noun — no な. (${c})`
      case 'negative':
        return `i-adjective NOT: drop い, add くない → ${c}. Never じゃない.`
      case 'past':
        return `i-adjective WAS: drop い, add かった → ${c}.`
      case 'pastNegative':
        return `i-adjective WAS NOT: drop い, add くなかった → ${c}.`
    }
  }
  const tail = adj.base.endsWith('い') ? ` (${adj.base} ends in い but is a na-adjective!)` : ''
  switch (form) {
    case 'attributive':
      return `${adj.base} is a na-adjective: put な before a noun → ${c}.${tail}`
    case 'negative':
      return `na-adjective NOT: add じゃない → ${c}. No くない.${tail}`
    case 'past':
      return `na-adjective WAS: add だった → ${c}.${tail}`
    case 'pastNegative':
      return `na-adjective WAS NOT: add じゃなかった → ${c}.${tail}`
  }
}

export interface ChimeraQ {
  itemId: string
  turn: ChimeraTurn
  adj: Adjective
  /** Adjective tiles (unique; exactly one correct). */
  adjOptions: string[]
  adjAnswer: string
  /** Attributive turns: noun tiles (unique; exactly one correct). */
  nounOptions: string[] | null
  nounAnswer: string | null
  rule: string
}

export function elementByKey(e: ElementSpell['element']): ElementSpell {
  return ELEMENT_SPELLS.find((x) => x.element === e)!
}

export function chimeraQuestion(turn: ChimeraTurn): ChimeraQ {
  const adj = getAdjective(turn.adj)
  const adjAnswer = conjugate(adj, turn.form)
  const adjOptions = shuffle([adjAnswer, ...shuffle(adjectiveTraps(adj, turn.form)).slice(0, 3)])
  let nounOptions: string[] | null = null
  let nounAnswer: string | null = null
  if (turn.noun) {
    nounAnswer = elementByKey(turn.noun).noun
    nounOptions = buildOptions(
      nounAnswer,
      shuffle(ELEMENT_SPELLS.map((e) => e.noun)),
      3,
    )
  }
  return { itemId: item.adjective(adj.base), turn, adj, adjOptions, adjAnswer, nounOptions, nounAnswer, rule: adjectiveRule(adj, turn.form) }
}

export function checkChimera(q: ChimeraQ, adjPick: string, nounPick: string | null): { adjOk: boolean; nounOk: boolean; ok: boolean } {
  const adjOk = checkAdjective(q.adj, q.turn.form, adjPick)
  const nounOk = q.nounAnswer === null || nounPick === q.nounAnswer
  return { adjOk, nounOk, ok: adjOk && nounOk }
}

export function chimeraTurnsFor(phase: number): ChimeraTurn[] {
  if (phase === 0) return CHIMERA_TURNS.filter((t) => t.form === 'attributive')
  if (phase === 1) return CHIMERA_TURNS.filter((t) => t.form === 'negative')
  return CHIMERA_TURNS.filter((t) => t.form === 'past' || t.form === 'pastNegative')
}

export function skinOf(turn: ChimeraTurn) {
  return SKINS[turn.skin]
}

// ─── 6. Void Dragon ──────────────────────────────────────────────────────

/** Words with a kanji written form, for rapid recognition. */
export function dragonKanjiPool(): Word[] {
  return VOCAB.filter((w) => /[一-龯]/.test(w.jp) && w.pos !== 'expression')
}

export interface KanjiWordQ extends ChoiceQ {
  word: Word
}

export function kanjiWordQuestion(w: Word, pool: readonly Word[] = dragonKanjiPool()): KanjiWordQ {
  const opts = buildOptions(
    w.en,
    shuffle(pool.filter((x) => x.kana !== w.kana && !enClash(w, x)).map((x) => x.en)),
    4,
    w.alt ?? [],
  )
  return { itemId: item.word(w.id), word: w, options: opts, accepted: [w.en] }
}

/** Short sentences (3–4 tiles) for the ordering phase. */
export function orderPool(): ForgeSentence[] {
  return FORGE_SENTENCES.filter((s) => s.tokens.length >= 3 && s.tokens.length <= 4)
}

export interface OrderQ {
  itemId: string
  sentence: ForgeSentence
  /** Tiles in scrambled order (never already solved). */
  tiles: string[]
}

export function orderQuestion(s: ForgeSentence): OrderQ {
  const accepted = acceptedSentences(s)
  let tiles = shuffle(s.tokens)
  for (let i = 0; i < 20 && accepted.includes(joinTokens(tiles)); i++) tiles = shuffle(s.tokens)
  return { itemId: item.sentence(s.id), sentence: s, tiles }
}

export function checkOrder(s: ForgeSentence, picked: readonly string[]): boolean {
  return [s.tokens, ...(s.alts ?? [])].some((t) => t.length === picked.length && t.every((x, i) => x === picked[i]))
}

export interface CastQ extends ChoiceQ {
  form: DragonForm
  spell: ElementSpell
  pattern: 'no' | 'wo'
  why: Record<string, string>
}

/** Correct incantations for an element noun. */
export function incantations(noun: string): { no: string; wo: string } {
  return { no: `${noun}のまほう`, wo: `${noun}を使います` }
}

export function castQuestion(form: DragonForm, pattern: 'no' | 'wo' = Math.random() < 0.5 ? 'no' : 'wo'): CastQ {
  const spell = elementByKey(form.weakness)
  const n = spell.noun
  const others = shuffle(ELEMENT_SPELLS.filter((e) => e.element !== spell.element))
  const answer = incantations(n)[pattern]
  const wrongElement = incantations(others[0].noun)[pattern]
  const why: Record<string, string> = {
    [wrongElement]: `Wrong element — ${form.en} is weak to ${spell.en} (${n}).`,
  }
  let wrongParticle: string
  let wrongBoth: string
  if (pattern === 'no') {
    wrongParticle = `${n}をまほう`
    wrongBoth = `${others[1].noun}をまほう`
    why[wrongParticle] = 'Linking two nouns ("magic OF fire") needs の, not を.'
    why[wrongBoth] = `Two mistakes: wrong element (you need ${n}) and nouns are linked with の.`
  } else {
    wrongParticle = `${n}の使います`
    wrongBoth = `${others[1].noun}の使います`
    why[wrongParticle] = 'The thing you use is the object of 使います: it takes を.'
    why[wrongBoth] = `Two mistakes: wrong element (you need ${n}) and the object of 使います takes を.`
  }
  return { itemId: item.word(wordIdForElement(spell)), form, spell, pattern, options: shuffle([answer, wrongElement, wrongParticle, wrongBoth]), accepted: [answer], why }
}

function wordIdForElement(e: ElementSpell): string {
  const w = VOCAB.find((v) => v.jp === e.noun)
  return w ? w.id : e.element
}

export { DRAGON_FORMS }

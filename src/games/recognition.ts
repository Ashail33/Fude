/**
 * Pure logic shared by the recognition games: Falling Spell Defense (G1),
 * Speed Spell Casting (G9) and the Listening Challenge.
 *
 * Nothing here touches React, the DOM or the player store, so it is easy to
 * unit-test (see recognition.test.ts).
 */
import { toHiragana } from 'wanakana'
import { atOrBefore } from '../data/journey'
import { matchesEnglish, normaliseEn, VOCAB, WORD_BY_ID, type Word } from '../data/vocab'
import { shuffle, weightedSample } from '../engine/random'

// ─── Word pools ────────────────────────────────────────────────────────

/** Resolve word ids, silently skipping unknown ids and duplicates. */
export function resolveWords(ids: readonly string[]): Word[] {
  const seen = new Set<string>()
  const out: Word[] = []
  for (const id of ids) {
    const w = WORD_BY_ID.get(id)
    if (w && !seen.has(id)) {
      seen.add(id)
      out.push(w)
    }
  }
  return out
}

/** Pool that is never empty: falls back to the first region's words. */
export function safePool(ids: readonly string[]): Word[] {
  const pool = resolveWords(ids)
  return pool.length ? pool : VOCAB.filter((w) => w.region === 1)
}

/**
 * Pick the next word, favouring weak items (higher `weight`) while avoiding
 * the most recently shown ones (and any id in `exclude`, e.g. blocks that are
 * already falling). Falls back gracefully when the pool is tiny.
 */
export function nextWord(pool: readonly Word[], weight: (w: Word) => number, recent: readonly string[] = [], exclude: ReadonlySet<string> = new Set()): Word {
  const avoidN = Math.min(3, Math.max(0, pool.length - 1 - exclude.size))
  const avoid = new Set(recent.slice(-avoidN))
  let candidates = pool.filter((w) => !exclude.has(w.id) && !avoid.has(w.id))
  if (!candidates.length) candidates = pool.filter((w) => !exclude.has(w.id))
  if (!candidates.length) candidates = [...pool]
  return weightedSample(candidates, 1, weight)[0]
}

// ─── Answer checking ───────────────────────────────────────────────────

/** Normalise a kana answer: hiragana, no spaces/punctuation, trailing "n" → ん. */
export function normaliseKana(s: string): string {
  return toHiragana(s.trim().toLowerCase().replace(/[\s。、．.,!！?？・〜~'-]/g, ''))
}

/** Accepted spellings of a word's reading (は-particle greetings accept わ too). */
export function acceptedReadings(w: Word): string[] {
  const base = normaliseKana(w.kana)
  const out = new Set([base])
  if (base.endsWith('は')) out.add(base.slice(0, -1) + 'わ')
  if (/^[぀-ヿ]+$/.test(w.jp)) out.add(normaliseKana(w.jp))
  return [...out]
}

/** Is `input` (kana, or romaji) the reading of `w`? */
export function matchesReading(w: Word, input: string): boolean {
  const g = normaliseKana(input)
  if (!g) return false
  return acceptedReadings(w).includes(g) || g === w.jp
}

/** Does typed text answer the word in English? (wrapper for symmetry) */
export function matchesMeaning(w: Word, input: string): boolean {
  return matchesEnglish(w, input)
}

/**
 * Two words would make an ambiguous multiple-choice pair: same written form,
 * same reading (homophones like 火/日 when heard), or overlapping English.
 */
export function ambiguous(a: Word, b: Word, mode: ChoiceMode): boolean {
  if (a.id === b.id || a.jp === b.jp) return true
  if (normaliseEn(a.en) === normaliseEn(b.en) || matchesEnglish(a, b.en) || matchesEnglish(b, a.en)) return true
  if (mode === 'sound' && normaliseKana(a.kana) === normaliseKana(b.kana)) return true
  return false
}

/** CSS colour for a word's element (spell projectiles, glows). */
export const ELEMENT_COLOR: Record<string, string> = {
  fire: 'var(--fire)',
  water: 'var(--water)',
  wood: 'var(--wood)',
  earth: 'var(--earth)',
  light: 'var(--light)',
  wind: 'var(--wind)',
  metal: '#cfd8e3',
}

export function elementColor(w: Word): string {
  return (w.element && ELEMENT_COLOR[w.element]) || 'var(--accent)'
}

// ─── Multiple-choice generation ────────────────────────────────────────

/**
 * jp: options are written Japanese (answer shown as English/emoji).
 * en: options are English (answer shown as Japanese).
 * sound: options are written forms of a spoken word – homophones excluded.
 */
export type ChoiceMode = 'jp' | 'en' | 'sound'

/**
 * Build `n` shuffled options containing `answer`. Distractors come from
 * `pool` first, then from the wider vocabulary of the same/earlier regions,
 * and never clash with the answer or each other.
 */
export function buildChoices(answer: Word, pool: readonly Word[], mode: ChoiceMode, n = 4): Word[] {
  const chosen: Word[] = [answer]
  const tryAdd = (cands: readonly Word[]) => {
    for (const c of shuffle(cands)) {
      if (chosen.length >= n) return
      if (chosen.some((x) => ambiguous(x, c, mode))) continue
      chosen.push(c)
    }
  }
  tryAdd(pool)
  if (chosen.length < n) tryAdd(VOCAB.filter((w) => atOrBefore(w.region, answer.region)))
  if (chosen.length < n) tryAdd(VOCAB)
  return shuffle(chosen)
}

/** Levenshtein similarity in [0, 1]. */
export function similarity(a: string, b: string): number {
  if (a === b) return 1
  if (!a.length || !b.length) return 0
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return 1 - prev[b.length] / Math.max(a.length, b.length)
}

/** How alike two readings sound (0–1): edit distance, shared first/last mora, length. */
export function soundAlike(a: string, b: string): number {
  const x = normaliseKana(a)
  const y = normaliseKana(b)
  let s = similarity(x, y)
  if (x[0] === y[0]) s += 0.25
  if (x[x.length - 1] === y[y.length - 1]) s += 0.1
  if (x.length === y.length) s += 0.1
  return s
}

/**
 * Listening distractors: mostly similar-sounding words from the same region
 * (or the given pool), plus one random same-region word so the answer can't
 * be found just by picking "the odd one out". Homophones are excluded.
 */
export function listeningChoices(answer: Word, pool: readonly Word[], n = 4): Word[] {
  const regionWords = VOCAB.filter((w) => w.region === answer.region)
  const cands = new Map<string, Word>()
  for (const w of [...pool, ...regionWords]) if (!ambiguous(answer, w, 'sound')) cands.set(w.id, w)
  const ranked = [...cands.values()]
    .map((w) => ({ w, s: soundAlike(answer.kana, w.kana) + Math.random() * 0.15 }))
    .sort((p, q) => q.s - p.s)
    .map((p) => p.w)
  const chosen: Word[] = [answer]
  const add = (w: Word) => {
    if (chosen.length < n && !chosen.some((x) => ambiguous(x, w, 'sound'))) chosen.push(w)
  }
  // Up to n-2 look-alikes from the top of the ranking…
  for (const w of ranked.slice(0, 6)) if (chosen.length < n - 1) add(w)
  // …then one random same-region word, then top up from anywhere.
  for (const w of shuffle(ranked.slice(6))) {
    if (chosen.length >= n) break
    add(w)
  }
  if (chosen.length < n) for (const w of shuffle(VOCAB)) add(w)
  return shuffle(chosen)
}

// ─── Falling Spell Defense ─────────────────────────────────────────────

export type Difficulty = 1 | 2 | 3

export interface DefenseTuning {
  hearts: number
  /** Base fall speed, percent of the sky per second. */
  baseSpeed: number
  /** Maximum simultaneous blocks. */
  maxBlocks: number
}

export function defenseTuning(d: Difficulty): DefenseTuning {
  switch (d) {
    case 1:
      return { hearts: 5, baseSpeed: 5.5, maxBlocks: 1 }
    case 2:
      return { hearts: 4, baseSpeed: 7.5, maxBlocks: 1 }
    default:
      return { hearts: 4, baseSpeed: 6.5, maxBlocks: 3 }
  }
}

/** Fall speed (% per second) ramps up with every block destroyed, capped at 2×. */
export function fallSpeed(d: Difficulty, destroyed: number): number {
  const { baseSpeed } = defenseTuning(d)
  return baseSpeed * Math.min(2, 1 + destroyed * 0.06)
}

/** Delay between spawns in ms (difficulty 3 gets faster as you succeed). */
export function spawnDelay(d: Difficulty, destroyed: number): number {
  if (d < 3) return 450
  return Math.max(1100, 2600 - destroyed * 90)
}

/** How many blocks may be falling at once (grows slowly in difficulty 3). */
export function maxBlocks(d: Difficulty, destroyed: number): number {
  const { maxBlocks: m } = defenseTuning(d)
  return m === 1 ? 1 : Math.min(m + 1, 2 + Math.floor(destroyed / 5))
}

export interface TargetCandidate {
  uid: number
  word: Word
  /** 0 = top of sky, 100 = village. */
  y: number
}

/** Which falling block does the typed reading hit? The lowest (most urgent) match. */
export function findTarget<T extends TargetCandidate>(blocks: readonly T[], input: string): T | undefined {
  return blocks.filter((b) => matchesReading(b.word, input)).sort((a, b) => b.y - a.y)[0]
}

/** For a miss in multi-block mode: which block was the player probably aiming at? */
export function likelyIntended<T extends TargetCandidate>(blocks: readonly T[], input: string): T | undefined {
  if (!blocks.length) return undefined
  const g = normaliseKana(input)
  return [...blocks].sort((a, b) => similarity(g, normaliseKana(b.word.kana)) - similarity(g, normaliseKana(a.word.kana)) || b.y - a.y)[0]
}

// ─── Speed Spell Casting ───────────────────────────────────────────────

/** Combo multiplier: +1 for every 3 in a row, up to ×4. */
export function comboMultiplier(streak: number): number {
  return Math.min(4, 1 + Math.floor(Math.max(0, streak) / 3))
}

/** Milliseconds an enemy takes to reach the player; faster with a streak. */
export function enemyTravelMs(streak: number, answered: number): number {
  return Math.max(2800, 7000 - streak * 250 - answered * 60)
}

/** Seconds lost on a wrong answer or when an enemy gets through. */
export const SPEED_PENALTY_SEC = 3

/**
 * Accuracy for the host: correct / enemies faced (answered + those that got
 * through). maxScore never drops below a small floor, so answering one enemy
 * correctly and idling out the rest cannot earn a perfect score.
 */
export function speedCastScore(correct: number, faced: number, durationSec: number): { score: number; maxScore: number } {
  const floor = Math.min(10, Math.max(1, Math.floor(durationSec / 6)))
  return { score: correct, maxScore: Math.max(faced, floor, correct) }
}

/** Decide the direction for one enemy. */
export function directionFor(direction: 'jp-en' | 'en-jp' | 'mixed', rand = Math.random): 'jp-en' | 'en-jp' {
  if (direction !== 'mixed') return direction
  return rand() < 0.5 ? 'jp-en' : 'en-jp'
}

/**
 * The language weave: English instructions slowly fill with Japanese.
 *
 * Every English sentence the game shows can be "woven": words the player
 * has learned are swapped for their Japanese, one word at a time, and only
 * as fast as they're actually learned. Each term climbs four stages:
 *
 *   0  English only                      fire
 *   1  English with a Japanese hint      fire ⟨ひ⟩
 *   2  Japanese with an English gloss    ひ (fire, above)
 *   3  Japanese only (tap to peek)       火
 *
 * Vocabulary terms follow the spaced-repetition mastery of that word
 * (familiar → hint, strong → gloss, mastered → Japanese), so a word only
 * moves into instructions once the player has really learned it.
 * Everyday instruction words (tap, choose, answer…) aren't drilled
 * anywhere, so they're learned by reading them: they're introduced a
 * couple at a time, in a fixed order, and climb by how often they're seen.
 * A sentence never gets more than a few swaps, so it always stays readable.
 */
import { VOCAB } from '../data/vocab'
import { item } from './items'
import { masteryTier } from './srs'
import { levelForXp } from './rewards'
import type { PlayerState } from './store'

export type WeaveStage = 0 | 1 | 2 | 3

export interface Term {
  id: string
  /** English forms matched (lower case, longest first in the matcher). */
  en: string[]
  /** Written Japanese (kanji where usual). */
  jp: string
  kana: string
  /** Gloss shown with the Japanese. */
  gloss: string
  /** Vocabulary id: stage follows that word's mastery. */
  word?: string
}

/**
 * Everyday words from instructions and UI, in the order they're introduced.
 * Simple, frequent and unambiguous first.
 */
export const UI_TERMS: Term[] = [
  { id: 'ui:yes', en: ['yes'], jp: 'はい', kana: 'はい', gloss: 'yes' },
  { id: 'ui:tap', en: ['tap'], jp: 'タップ', kana: 'たっぷ', gloss: 'tap' },
  { id: 'ui:answer', en: ['answer', 'answers'], jp: 'こたえ', kana: 'こたえ', gloss: 'answer' },
  { id: 'ui:next', en: ['next'], jp: 'つぎ', kana: 'つぎ', gloss: 'next' },
  { id: 'ui:hint', en: ['hint', 'hints'], jp: 'ヒント', kana: 'ひんと', gloss: 'hint' },
  { id: 'ui:mage', en: ['mage', 'mages'], jp: 'まほうつかい', kana: 'まほうつかい', gloss: 'mage' },
  { id: 'ui:choose', en: ['choose', 'pick'], jp: 'えらぶ', kana: 'えらぶ', gloss: 'choose' },
  { id: 'ui:correct', en: ['correct', 'right answer'], jp: 'せいかい', kana: 'せいかい', gloss: 'correct' },
  { id: 'ui:wrong', en: ['wrong', 'mistake', 'mistakes'], jp: 'まちがい', kana: 'まちがい', gloss: 'wrong' },
  { id: 'ui:village', en: ['village'], jp: 'むら', kana: 'むら', gloss: 'village' },
  { id: 'ui:press', en: ['press'], jp: 'おす', kana: 'おす', gloss: 'press' },
  { id: 'ui:spell', en: ['spell', 'spells'], jp: 'じゅもん', kana: 'じゅもん', gloss: 'spell' },
  { id: 'ui:festival', en: ['festival'], jp: 'まつり', kana: 'まつり', gloss: 'festival' },
  { id: 'ui:lantern', en: ['lantern', 'lanterns'], jp: 'ちょうちん', kana: 'ちょうちん', gloss: 'lantern' },
  { id: 'ui:spirit', en: ['spirit', 'spirits'], jp: 'ようかい', kana: 'ようかい', gloss: 'spirit' },
  { id: 'ui:start', en: ['start', 'begin'], jp: 'はじめる', kana: 'はじめる', gloss: 'start' },
  { id: 'ui:sentence', en: ['sentence', 'sentences'], jp: 'ぶん', kana: 'ぶん', gloss: 'sentence' },
  { id: 'ui:quest', en: ['tale', 'tales', 'quest', 'quests'], jp: 'ものがたり', kana: 'ものがたり', gloss: 'tale' },
  { id: 'ui:again', en: ['again'], jp: 'もういちど', kana: 'もういちど', gloss: 'again' },
  { id: 'ui:everyone', en: ['everyone'], jp: 'みんな', kana: 'みんな', gloss: 'everyone' },
]

/**
 * Vocabulary that reads unambiguously inside English sentences. Left out:
 * words whose English has other common senses (light, spring, kind, old,
 * cold, hot, I, one, rest, time, now, letter) and prepositions.
 */
const SKIP = new Set(['hikari', 'izumi', 'yasashii', 'furui', 'tsumetai', 'atsui', 'watashi', 'ichi', 'yasumi', 'toki', 'ima', 'moji', 'ue', 'shita', 'naka', 'ta-rice', 'suki', 'aru', 'iru', 'suru', 'miru', 'kuru', 'kaeru', 'okiru', 'kiru', 'hikaru', 'kesu', 'moyasu', 'kowasu', 'tobu', 'nigeru', 'wataru', 'tsukau'])
const VERBS_OK = new Set(['read', 'write', 'listen', 'eat', 'drink', 'go', 'wait', 'make', 'speak', 'buy', 'sleep', 'help', 'fight', 'protect'])

const plural = (w: string) => (/(s|sh|ch|x)$/.test(w) ? `${w}es` : /[^aeiou]y$/.test(w) ? `${w.slice(0, -1)}ies` : `${w}s`)

export const VOCAB_TERMS: Term[] = VOCAB.filter((w) => !SKIP.has(w.id))
  .filter((w) => w.pos !== 'verb' || VERBS_OK.has(w.en))
  .filter((w) => /^[a-z][a-z ]*$/.test(w.en))
  .map((w) => ({
    id: `w:${w.id}`,
    en: w.pos === 'noun' && !w.en.includes(' ') ? [w.en, plural(w.en)] : [w.en],
    jp: w.jp,
    kana: w.kana,
    gloss: w.en,
    word: w.id,
  }))

export const TERMS: Term[] = [...UI_TERMS, ...VOCAB_TERMS]
export const TERM_BY_ID = new Map(TERMS.map((t) => [t.id, t]))

// one matcher for everything: longest forms first, whole words only
const FORM_TO_TERM = new Map<string, Term>()
for (const t of TERMS) for (const f of t.en) if (!FORM_TO_TERM.has(f)) FORM_TO_TERM.set(f, t)
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const MATCHER = new RegExp(
  `(?<![\\w'’-])(${[...FORM_TO_TERM.keys()]
    .sort((a, b) => b.length - a.length)
    .map(esc)
    .join('|')})(?![\\w-])`,
  'gi',
)

/** How many everyday words can be "in learning" (stages 1–2) at once. */
export const UI_LEARNING_CAP = 2
/** Sightings needed to move an everyday word to the next stage. */
export const UI_STAGE_AT: [number, number] = [25, 80]
/** Level at which everyday words start appearing. */
export const UI_START_LEVEL = 2

const uiStageOf = (n: number): WeaveStage => (n >= UI_STAGE_AT[1] ? 3 : n >= UI_STAGE_AT[0] ? 2 : 1)

/** Stage of every everyday word: introduced in order, a couple at a time. */
function uiStages(s: PlayerState): Map<string, WeaveStage> {
  const seen = s.weave ?? {}
  const out = new Map<string, WeaveStage>()
  const lvl = levelForXp(s.xp)
  let learning = 0
  for (const t of UI_TERMS) {
    const n = seen[t.id] ?? 0
    if (n > 0) {
      const st = uiStageOf(n)
      out.set(t.id, st)
      if (st < 3) learning++
    } else if (lvl >= UI_START_LEVEL && learning < UI_LEARNING_CAP) {
      out.set(t.id, 1)
      learning++
    } else break
  }
  return out
}

const uiCache = new WeakMap<PlayerState, Map<string, WeaveStage>>()

/** The stage a term is at for this player. */
export function termStage(s: PlayerState, t: Term): WeaveStage {
  if (t.word) {
    const tier = masteryTier(s.srs[item.word(t.word)])
    return tier >= 4 ? 3 : tier === 3 ? 2 : tier === 2 ? 1 : 0
  }
  let m = uiCache.get(s)
  if (!m) {
    m = uiStages(s)
    uiCache.set(s, m)
  }
  return m.get(t.id) ?? 0
}

export type Segment = string | { term: Term; stage: WeaveStage; text: string }

/** Most swaps in one sentence: hints clutter faster than Japanese. */
const MAX_HINTS = 2
const MAX_SWAPS = 4

/** Split English text into plain runs and woven terms. */
export function weave(s: PlayerState, text: string): Segment[] {
  if (!text || s.settings.weave === false) return [text]
  const out: Segment[] = []
  let last = 0
  let hints = 0
  let swaps = 0
  const used = new Set<string>()
  for (const m of text.matchAll(MATCHER)) {
    const t = FORM_TO_TERM.get(m[0].toLowerCase())
    if (!t || used.has(t.id)) continue
    const stage = termStage(s, t)
    if (stage === 0) continue
    if (stage === 1 ? hints >= MAX_HINTS : swaps >= MAX_SWAPS) continue
    if (stage === 1) hints++
    else swaps++
    used.add(t.id)
    if (m.index! > last) out.push(text.slice(last, m.index))
    out.push({ term: t, stage, text: m[0] })
    last = m.index! + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** Terms woven into a sentence (for counting sightings). */
export function wovenTerms(segs: Segment[]): Term[] {
  return segs.flatMap((x) => (typeof x === 'string' ? [] : [x.term]))
}

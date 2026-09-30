import type { DialogueNode, DialogueOption, Line, Scenario } from '../data/npcs'
import { item } from './items'
import type { Review } from './srs'
import { normaliseJa } from './speech'

/**
 * Pure dialogue engine: walks a scenario's node graph. No React, no store
 * access — the UI applies the returned side effects (spells, trust).
 */

export interface DialogueState {
  nodeId: string
  hearts: number
  trust: number
  /** Answers attempted (choices + typed/spoken). */
  answered: number
  correct: number
  hintsUsed: number
  /** Spells obtained in this conversation. */
  spells: string[]
  /** Where to return after the jail branch. */
  resumeAt?: string
  jailed: number
  reviews: Review[]
  outcome?: 'win' | 'lose'
}

export interface AnswerResult {
  state: DialogueState
  correct: boolean
  /** NPC reaction to show. */
  reply?: Line
  /** Teaching note (English). */
  note?: string
  /** Model answer to show after a mistake. */
  model?: string
  /** Side effects the UI should persist. */
  grantSpell?: string
  trustDelta: number
  /** True when this answer sent the player to the dungeon. */
  jailed: boolean
}

export function startDialogue(sc: Scenario): DialogueState {
  return enter(sc, {
    nodeId: sc.start,
    hearts: sc.hearts,
    trust: sc.startTrust,
    answered: 0,
    correct: 0,
    hintsUsed: 0,
    spells: [],
    jailed: 0,
    reviews: [],
  }, sc.start)
}

export function currentNode(sc: Scenario, st: DialogueState): DialogueNode {
  const n = sc.nodes[st.nodeId]
  if (!n) throw new Error(`Unknown dialogue node ${st.nodeId} in ${sc.id}`)
  return n
}

/** Options the player can currently see (filters spells already obtained). */
export function visibleOptions(node: DialogueNode, st: DialogueState): DialogueOption[] {
  return (node.options ?? []).filter((o) => !o.unlessSpell || !st.spells.includes(o.unlessSpell))
}

/** Replace `{name}` placeholders. */
export function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m)
}

function clampTrust(sc: Scenario, t: number): number {
  return Math.max(0, Math.min(sc.trustMax, t))
}

/** Move to a node, applying redirects (exitWhen, $resume) and onEnter effects. */
function enter(sc: Scenario, st: DialogueState, target: string): DialogueState {
  let id = target
  let s = st
  if (id === '$resume') {
    id = s.resumeAt ?? sc.start
    s = { ...s, resumeAt: undefined }
  }
  for (let guard = 0; guard < 10; guard++) {
    const n = sc.nodes[id]
    if (!n) throw new Error(`Unknown dialogue node ${id} in ${sc.id}`)
    if (n.exitWhen && n.exitWhen.spells.every((sp) => s.spells.includes(sp))) {
      id = n.exitWhen.to
      continue
    }
    break
  }
  const n = sc.nodes[id]
  if (n.onEnter?.setTrust !== undefined) s = { ...s, trust: clampTrust(sc, n.onEnter.setTrust) }
  if (n.end) s = { ...s, outcome: 'win' }
  return { ...s, nodeId: id }
}

function reviewsFor(ids: string[] | undefined, correct: boolean, ms: number): Review[] {
  return [...new Set(ids ?? [])].map((w) => ({ itemId: item.word(w), correct, ms }))
}

function resolve(
  sc: Scenario,
  st: DialogueState,
  node: DialogueNode,
  correct: boolean,
  opts: { next?: string; trust?: number; spell?: string; wordIds?: string[]; ms: number },
): { state: DialogueState; jailed: boolean; trustDelta: number } {
  const trustDelta = opts.trust ?? 0
  let s: DialogueState = {
    ...st,
    answered: st.answered + 1,
    correct: st.correct + (correct ? 1 : 0),
    hearts: correct ? st.hearts : st.hearts - 1,
    trust: clampTrust(sc, st.trust + trustDelta),
    spells: opts.spell && !st.spells.includes(opts.spell) ? [...st.spells, opts.spell] : st.spells,
    reviews: [...st.reviews, ...reviewsFor(opts.wordIds ?? node.wordIds, correct, opts.ms)],
  }
  if (s.hearts <= 0) return { state: { ...s, hearts: 0, outcome: 'lose' }, jailed: false, trustDelta }
  const target = opts.next ?? (correct ? node.next ?? node.id : node.id)
  if (sc.jail && !node.jail && trustDelta < 0 && s.trust <= sc.jail.threshold) {
    s = { ...s, resumeAt: target, jailed: s.jailed + 1 }
    return { state: enter(sc, s, sc.jail.node), jailed: true, trustDelta }
  }
  return { state: enter(sc, s, target), jailed: false, trustDelta }
}

/** Player picks an option (by object, from visibleOptions). */
export function choose(sc: Scenario, st: DialogueState, option: DialogueOption, ms = 0): AnswerResult {
  if (st.outcome) throw new Error('Dialogue already finished')
  const node = currentNode(sc, st)
  const r = resolve(sc, st, node, option.correct, {
    next: option.next,
    trust: option.effects?.trust,
    spell: option.correct ? option.effects?.grantSpell : undefined,
    wordIds: option.wordIds,
    ms,
  })
  const model = option.correct ? undefined : visibleOptions(node, st).find((o) => o.correct)?.jp
  return {
    state: r.state,
    correct: option.correct,
    reply: option.reply,
    note: option.note,
    model,
    grantSpell: option.correct ? option.effects?.grantSpell : undefined,
    trustDelta: r.trustDelta,
    jailed: r.jailed,
  }
}

// Kanji → kana for words that appear in free-input answers, so 橋を渡ります,
// はしをわたります and ハシヲワタリマス all compare equal.
const KANJI_READINGS: [RegExp, string][] = [
  [/橋/g, 'はし'],
  [/渡/g, 'わた'],
  [/森/g, 'もり'],
  [/行/g, 'い'],
  [/私/g, 'わたし'],
]

/** Normalise a typed/spoken Japanese answer for comparison. */
export function normaliseAnswer(s: string): string {
  let t = s.trim()
  for (const [re, kana] of KANJI_READINGS) t = t.replace(re, kana)
  return normaliseJa(t)
}

export function answerMatches(text: string, accepted: string[]): boolean {
  const t = normaliseAnswer(text)
  if (!t) return false
  return accepted.some((a) => {
    const n = normaliseAnswer(a)
    // Recognisers and learners sometimes write the particle を as お.
    return n === t || n.replace(/を/g, 'お') === t
  })
}

/** Player types or speaks an answer to an input node. */
export function submitText(sc: Scenario, st: DialogueState, text: string, ms = 0): AnswerResult {
  if (st.outcome) throw new Error('Dialogue already finished')
  const node = currentNode(sc, st)
  if (!node.input) throw new Error(`Node ${node.id} does not take text input`)
  return submitVerdict(sc, st, answerMatches(text, node.input.accepted), ms)
}

/** Record a pre-judged free answer (e.g. voice matched with matchUtterance). */
export function submitVerdict(sc: Scenario, st: DialogueState, ok: boolean, ms = 0): AnswerResult {
  const node = currentNode(sc, st)
  const inp = node.input
  if (!inp) throw new Error(`Node ${node.id} does not take text input`)
  const r = resolve(sc, st, node, ok, { ms, trust: ok ? 1 : 0 })
  return {
    state: r.state,
    correct: ok,
    reply: ok ? inp.reply : inp.wrongReply,
    note: ok ? undefined : inp.wrongNote,
    model: ok ? undefined : inp.model,
    trustDelta: r.trustDelta,
    jailed: r.jailed,
  }
}

/** Advance a node that has no options/input ("continue"). */
export function advance(sc: Scenario, st: DialogueState): DialogueState {
  const node = currentNode(sc, st)
  if (node.end || node.options?.length || node.input) return st
  return enter(sc, st, node.next ?? sc.start)
}

export function takeHint(st: DialogueState): DialogueState {
  return { ...st, hintsUsed: st.hintsUsed + 1 }
}

/** Accuracy score: hints count as half a missed answer each. */
export function scoreOf(st: DialogueState): { score: number; maxScore: number } {
  return { score: st.correct * 2, maxScore: Math.max(1, st.answered * 2 + st.hintsUsed) }
}

/** Every word id a scenario can review (for sanity checks / previews). */
export function scenarioWordIds(sc: Scenario): string[] {
  const out = new Set<string>()
  for (const n of Object.values(sc.nodes)) {
    n.wordIds?.forEach((w) => out.add(w))
    n.options?.forEach((o) => o.wordIds?.forEach((w) => out.add(w)))
  }
  return [...out]
}

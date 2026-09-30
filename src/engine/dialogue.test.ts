import { describe, expect, it } from 'vitest'
import { NPC_BY_ID, SCENARIO_BY_ID, SCENARIOS, type Scenario } from '../data/npcs'
import { ACTIVITIES } from '../data/regions'
import { WORD_BY_ID } from '../data/vocab'
import {
  advance,
  answerMatches,
  choose,
  currentNode,
  scenarioWordIds,
  scoreOf,
  startDialogue,
  submitText,
  takeHint,
  visibleOptions,
  type DialogueState,
} from './dialogue'

function sc(id: string): Scenario {
  const s = SCENARIO_BY_ID.get(id)
  if (!s) throw new Error(id)
  return s
}

function pickCorrect(s: Scenario, st: DialogueState) {
  const opt = visibleOptions(currentNode(s, st), st).find((o) => o.correct)
  if (!opt) throw new Error(`no correct option at ${st.nodeId}`)
  return choose(s, st, opt)
}

function pickWrong(s: Scenario, st: DialogueState, tone?: string) {
  const opt = visibleOptions(currentNode(s, st), st).find((o) => !o.correct && (!tone || o.tone === tone))
  if (!opt) throw new Error(`no wrong option at ${st.nodeId}`)
  return choose(s, st, opt)
}

/** Play perfectly to the end. */
function playPerfect(s: Scenario): DialogueState {
  let st = startDialogue(s)
  for (let i = 0; i < 50 && !st.outcome; i++) {
    const n = currentNode(s, st)
    if (n.input) st = submitText(s, st, n.input.model).state
    else if (n.options?.length) st = pickCorrect(s, st).state
    else st = advance(s, st)
  }
  return st
}

describe('scenario data', () => {
  it('every dialogue activity references an existing scenario', () => {
    for (const a of ACTIVITIES) if (a.game === 'dialogue') expect(SCENARIO_BY_ID.has(a.params.scenarioId), a.params.scenarioId).toBe(true)
  })
  it('nodes link to existing nodes, NPCs exist and word ids exist', () => {
    for (const s of SCENARIOS) {
      expect(NPC_BY_ID.has(s.npcId)).toBe(true)
      expect(s.nodes[s.start]).toBeTruthy()
      for (const n of Object.values(s.nodes)) {
        if (n.speaker) expect(NPC_BY_ID.has(n.speaker)).toBe(true)
        if (n.next && n.next !== '$resume') expect(s.nodes[n.next], `${s.id}.${n.id} → ${n.next}`).toBeTruthy()
        if (!n.end) expect(n.next || n.options?.some((o) => o.next), `${s.id}.${n.id} is a dead end`).toBeTruthy()
        if (n.options) {
          expect(n.options.some((o) => o.correct), `${s.id}.${n.id} has no correct option`).toBe(true)
          expect(n.options.some((o) => !o.correct), `${s.id}.${n.id} has no wrong option`).toBe(true)
        }
      }
      for (const w of scenarioWordIds(s)) expect(WORD_BY_ID.has(w), `${s.id}: ${w}`).toBe(true)
    }
  })
  it('every scenario can be completed perfectly', () => {
    for (const s of SCENARIOS) {
      const st = playPerfect(s)
      expect(st.outcome, s.id).toBe('win')
      expect(st.correct).toBe(st.answered)
      const { score, maxScore } = scoreOf(st)
      expect(score).toBe(maxScore)
    }
  })
})

describe('village shop', () => {
  const s = sc('village-shop')
  it('grants the three spells then moves to thanks', () => {
    let st = pickCorrect(s, startDialogue(s)).state
    expect(st.nodeId).toBe('shop')
    const granted: string[] = []
    for (let i = 0; i < 3; i++) {
      const r = pickCorrect(s, st)
      expect(r.grantSpell).toBeTruthy()
      granted.push(r.grantSpell!)
      st = r.state
    }
    expect(new Set(granted)).toEqual(new Set(['火', '水', '木']))
    expect(st.nodeId).toBe('thanks')
  })
  it('hides options for spells already obtained', () => {
    let st = pickCorrect(s, startDialogue(s)).state
    const water = visibleOptions(currentNode(s, st), st).find((o) => o.effects?.grantSpell === '水')!
    st = choose(s, st, water).state
    const vis = visibleOptions(currentNode(s, st), st)
    expect(vis.some((o) => o.unlessSpell === '水')).toBe(false)
    expect(vis.length).toBeGreaterThan(0)
  })
  it('wrong answer costs a heart, stays on node, reviews the word as wrong', () => {
    let st = pickCorrect(s, startDialogue(s)).state
    const eatWater = visibleOptions(currentNode(s, st), st).find((o) => o.jp.startsWith('水をたべ'))!
    const r = choose(s, st, eatWater, 1200)
    st = r.state
    expect(r.correct).toBe(false)
    expect(r.model).toBeTruthy()
    expect(st.nodeId).toBe('shop')
    expect(st.hearts).toBe(s.hearts - 1)
    expect(st.reviews.at(-1)).toEqual({ itemId: 'w:mizu', correct: false, ms: 1200 })
  })
  it('running out of hearts loses', () => {
    let st = startDialogue(s)
    for (let i = 0; i < s.hearts; i++) st = pickWrong(s, st).state
    expect(st.outcome).toBe('lose')
  })
})

describe('bridge guard free input', () => {
  it('accepts kanji, kana and katakana variants', () => {
    const acc = ['橋をわたります']
    expect(answerMatches('橋を渡ります', acc)).toBe(true)
    expect(answerMatches('はしをわたります。', acc)).toBe(true)
    expect(answerMatches('ハシヲワタリマス', acc)).toBe(true)
    expect(answerMatches('はし を わたります', acc)).toBe(true)
    expect(answerMatches('はしおわたります', acc)).toBe(true)
    expect(answerMatches('はしがわたります', acc)).toBe(false)
    expect(answerMatches('', acc)).toBe(false)
  })
  it('wrong typed answer is refused with the model answer', () => {
    const s = sc('bridge-guard')
    let st = startDialogue(s)
    while (!currentNode(s, st).input) st = pickCorrect(s, st).state
    const r = submitText(s, st, 'はしがわたります')
    expect(r.correct).toBe(false)
    expect(r.model).toBe('橋をわたります')
    expect(r.state.nodeId).toBe(st.nodeId)
    const ok = submitText(s, r.state, 'はしをわたります')
    expect(ok.correct).toBe(true)
    expect(ok.state.outcome).toBe('win')
  })
})

describe('king politeness and jail', () => {
  const s = sc('tower-king')
  it('casual answers lower trust and eventually jail the player, who can apologise and resume', () => {
    let st = startDialogue(s)
    const r1 = pickWrong(s, st, 'rude') // -2 → 1
    st = r1.state
    expect(r1.trustDelta).toBe(-2)
    expect(st.trust).toBe(1)
    expect(st.nodeId).toBe('enter')
    const r2 = pickWrong(s, st, 'casual') // → 0 → jail
    expect(r2.jailed).toBe(true)
    st = r2.state
    expect(st.nodeId).toBe('jail')
    expect(st.resumeAt).toBe('enter')
    st = advance(s, st)
    expect(st.nodeId).toBe('jail-1')
    st = pickCorrect(s, st).state
    st = pickCorrect(s, st).state
    expect(st.nodeId).toBe('jail-3')
    expect(st.trust).toBe(2)
    st = advance(s, st)
    expect(st.nodeId).toBe('enter')
    expect(st.resumeAt).toBeUndefined()
  })
  it('wrong answers inside the jail do not re-jail', () => {
    let st = startDialogue(s)
    st = pickWrong(s, st, 'rude').state
    st = pickWrong(s, st, 'casual').state
    st = advance(s, st)
    const r = pickWrong(s, st)
    expect(r.jailed).toBe(false)
    expect(r.state.nodeId).toBe('jail-1')
  })
})

describe('scoring', () => {
  it('hints reduce accuracy', () => {
    const s = sc('shrine-priest')
    let st = startDialogue(s)
    st = takeHint(st)
    st = pickCorrect(s, st).state
    const { score, maxScore } = scoreOf(st)
    expect(score / maxScore).toBeCloseTo(2 / 3)
  })
})

import { atOrBefore, JOURNEY, regionRank } from '../data/journey'
import { describe, expect, it } from 'vitest'
import { ENEMY_SPRITES } from '../art'
import { item } from '../engine/items'
import {
  alive,
  availableSpells,
  battlePool,
  battleRewards,
  checkReading,
  createBattle,
  effectiveness,
  ENEMY_DEFS,
  enemyTurn,
  judge,
  makeQuestion,
  nextQuestion,
  pickWord,
  REGION_POOLS,
  resolveFight,
  resolveItem,
  resolveRun,
  resolveSpell,
  retarget,
  rollEnemies,
  type BattleState,
  type Rng,
} from './logic'
import { ITEM_BY_ID } from './items'
import { WORD_BY_ID } from '../data/vocab'
import { toHiragana } from 'wanakana'

/** Deterministic PRNG. */
function rng(seed = 1): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const always = (x: number): Rng => () => x

describe('enemy table', () => {
  it('has a definition for every enemy sprite', () => {
    for (const id of ENEMY_SPRITES) expect(ENEMY_DEFS[id].id).toBe(id)
  })
  it('pools never contain the dragon and use 4 enemies per region', () => {
    for (let r = 1; r <= 5; r++) {
      expect(REGION_POOLS[r]).toHaveLength(4)
      expect(REGION_POOLS[r]).not.toContain('dragon')
    }
  })
  it('weakness and resistance differ', () => {
    for (const d of Object.values(ENEMY_DEFS)) expect(d.weak).not.toBe(d.resist)
  })
  it('every region-1 weakness is castable with region-1 spells', () => {
    const els = availableSpells([], 1).map((s) => s.element)
    for (const id of REGION_POOLS[1]) expect(els).toContain(ENEMY_DEFS[id].weak)
  })
  it('rolls 1–3 enemies from the pool', () => {
    const r = rng(3)
    for (let i = 0; i < 200; i++) {
      const ids = rollEnemies(2, r)
      expect(ids.length).toBeGreaterThanOrEqual(1)
      expect(ids.length).toBeLessThanOrEqual(3)
      for (const id of ids) expect(REGION_POOLS[2]).toContain(id)
    }
  })
  it('suffixes duplicate names A/B', () => {
    const s = createBattle(1, 1, ['slime', 'slime', 'bat'])
    expect(s.enemies.map((e) => e.name)).toEqual(['スライムA', 'スライムB', 'おおこうもり'])
  })
  it('scales enemies with the region', () => {
    const a = createBattle(4, 1, ['oni']).enemies[0]
    const b = createBattle(5, 1, ['oni']).enemies[0]
    expect(b.maxHp).toBeGreaterThan(a.maxHp)
    expect(b.atk).toBeGreaterThan(a.atk)
  })
})

describe('spells', () => {
  it('offers owned spells plus region basics', () => {
    expect(availableSpells([], 1).map((s) => s.noun)).toEqual(['火', '水', '木', '風'])
    expect(availableSpells(['土'], 1).map((s) => s.noun)).toContain('土')
    expect(availableSpells([], 2)).toHaveLength(6)
  })
  it('weakness doubles, resistance halves', () => {
    const slime = ENEMY_DEFS.slime
    expect(effectiveness(slime, 'fire')).toBe(2)
    expect(effectiveness(slime, 'water')).toBe(0.5)
    expect(effectiveness(slime, 'wood')).toBe(1)
  })
  it('a weak-element spell deals about double and spends MP', () => {
    const s = createBattle(1, 1, ['slime'])
    const hit = resolveSpell(s, 0, 'fire', { valid: true }, always(0.5))
    expect(hit.state.player.mp).toBe(s.player.mp - 4)
    const strike = hit.events.find((e) => e.t === 'strike')
    expect(strike && strike.t === 'strike' && strike.eff).toBe('weak')
    expect(hit.events.some((e) => e.t === 'msg' && e.line.jp.includes('火が よく きいた'))).toBe(true)
  })
  it('a fizzled incantation costs no MP but loses the turn', () => {
    const s = createBattle(1, 1, ['imp'])
    const r = resolveSpell(s, 0, 'water', { valid: false }, always(0.9))
    expect(r.state.player.mp).toBe(s.player.mp)
    expect(r.events.some((e) => e.t === 'enemyAct')).toBe(true)
  })
})

describe('turns', () => {
  it('a correct fight answer damages; a crit hits harder', () => {
    const s = createBattle(3, 5, ['golem'])
    const n = resolveFight(s, 0, { correct: true, crit: false }, always(0.5))
    const c = resolveFight(s, 0, { correct: true, crit: true }, always(0.5))
    const dn = s.enemies[0].hp - n.state.enemies[0].hp
    const dc = s.enemies[0].hp - c.state.enemies[0].hp
    expect(dn).toBeGreaterThan(0)
    expect(dc).toBeGreaterThan(dn)
    expect(c.events[0]).toEqual({ t: 'msg', line: { jp: 'かいしんの いちげき！', en: 'A critical hit!' } })
  })
  it('a wrong answer misses and the enemy acts', () => {
    const s = createBattle(1, 1, ['imp'])
    const r = resolveFight(s, 0, { correct: false, crit: false }, always(0.9))
    expect(r.state.enemies[0].hp).toBe(s.enemies[0].hp)
    expect(r.events[0].t).toBe('miss')
    expect(r.state.player.hp).toBeLessThan(s.player.hp)
  })
  it('killing the last enemy wins without an enemy turn', () => {
    let s = createBattle(1, 30, ['slime'])
    s = resolveFight(s, 0, { correct: true, crit: true }, always(0.5)).state
    expect(s.outcome).toBe('win')
    expect(alive(s)).toHaveLength(0)
  })
  it('retargets to a living enemy', () => {
    const s = createBattle(1, 1, ['slime', 'bat'])
    s.enemies[0].hp = 0
    expect(retarget(s, 0)).toBe(1)
  })
  it('charm blocks attacks', () => {
    let s = createBattle(5, 1, ['oni'])
    s = resolveItem(s, 'charm', always(0.99)).state
    expect(s.player.hp).toBe(s.player.maxHp)
    expect(s.player.shield).toBe(1)
  })
  it('herb heals but not above max; smoke flees', () => {
    const s: BattleState = createBattle(1, 1, ['slime'])
    s.player.hp = s.player.maxHp - 5
    const h = resolveItem(s, 'herb', always(0.99))
    expect(h.events.find((e) => e.t === 'heal')).toEqual({ t: 'heal', hp: 5, mp: 0 })
    expect(resolveItem(s, 'smoke').state.outcome).toBe('flee')
    expect(ITEM_BY_ID.get('herb')).toBeTruthy()
  })
  it('running gets easier after failures', () => {
    const s = createBattle(1, 1, ['slime'])
    const fail = resolveRun(s, always(0.99))
    expect(fail.state.outcome).not.toBe('flee')
    expect(fail.state.runAttempts).toBe(1)
    expect(resolveRun(s, always(0.1)).state.outcome).toBe('flee')
  })
  it('the player can lose', () => {
    const s = createBattle(5, 1, ['oni', 'oni', 'oni'])
    s.player.hp = 1
    const r = enemyTurn(s, [], always(0.99))
    expect(r.state.outcome).toBe('lose')
    expect(r.events.some((e) => e.t === 'msg' && e.line.jp.startsWith('目の前が'))).toBe(true)
  })
  it('rewards sum XP and shards', () => {
    const s = createBattle(2, 4, ['kappa', 'golem'])
    const r = battleRewards(s, always(0.99))
    expect(r.xp).toBe(s.enemies[0].xp + s.enemies[1].xp)
    expect(r.drop).toBeUndefined()
    expect(battleRewards(s, always(0.01)).drop).toBeTruthy()
  })
})

describe('questions', () => {
  it('builds unambiguous multiple choice', () => {
    const r = rng(7)
    for (const region of JOURNEY) {
      for (let i = 0; i < 150; i++) {
        const q = nextQuestion(region, {}, { listen: true }, r)
        if (q.kind === 'reading') {
          expect(q.choices).toHaveLength(0)
          continue
        }
        expect(q.choices[q.answer]).toBe(q.word)
        expect(q.choices.length).toBe(region === 1 ? 3 : 4)
        const en = q.choices.map((c) => c.en.toLowerCase())
        expect(new Set(en).size).toBe(en.length)
        const kana = q.choices.map((c) => toHiragana(c.kana))
        if (q.kind === 'listen') expect(new Set(kana).size).toBe(kana.length)
        const jp = q.choices.map((c) => c.jp)
        expect(new Set(jp).size).toBe(jp.length)
        for (const c of q.choices) expect(atOrBefore(c.region, region), `${c.id} in region ${region}`).toBe(true)
      }
    }
  })
  it('prefers weak words', () => {
    const pool = battlePool(1)
    const bad = pool[3]
    const now = Date.now()
    const srs = Object.fromEntries(
      pool.map((w) => [
        item.word(w.id),
        { id: item.word(w.id), ease: 2.5, interval: 30, due: now + 1e10, reps: 5, lapses: 0, seen: 10, correct: 10, wrong: 0, avgMs: 1000, lastSeen: now },
      ]),
    )
    srs[item.word(bad.id)] = { ...srs[item.word(bad.id)], wrong: 9, correct: 1, reps: 0, due: now - 1 }
    const r = rng(11)
    let hits = 0
    for (let i = 0; i < 400; i++) if (pickWord(pool, srs, 1, now, [], r).id === bad.id) hits++
    expect(hits / 400).toBeGreaterThan(0.1)
  })
  it('reading is only asked of words written with kanji and accepts kana forms', () => {
    const neko = WORD_BY_ID.get('neko')!
    const q = makeQuestion(neko, 'reading', battlePool(1), 1)
    expect(q.choices).toEqual([])
    expect(checkReading(neko, 'ねこ')).toBe(true)
    expect(checkReading(neko, 'ネコ')).toBe(true)
    expect(checkReading(neko, 'ねこ。')).toBe(true)
    expect(checkReading(neko, 'いぬ')).toBe(false)
    expect(checkReading(neko, '')).toBe(false)
  })
  it('judges crits by speed and timeouts as misses', () => {
    const q = makeQuestion(WORD_BY_ID.get('inu')!, 'meaning', battlePool(1), 1)
    expect(judge(q, true, 1000)).toEqual({ correct: true, crit: true })
    expect(judge(q, true, 5000)).toEqual({ correct: true, crit: false })
    expect(judge(q, true, q.limitMs + 1)).toEqual({ correct: false, crit: false })
    expect(judge(q, false, 500)).toEqual({ correct: false, crit: false })
  })
})

describe('balance (simulation)', () => {
  /** A typical level on arrival, by place on the road (1st region, 2nd, …). */
  const LEVEL = [0, 2, 5, 8, 11, 14, 17, 20, 23, 26, 29]
  function sim(region: number, accuracy: number, seed: number) {
    const r = rng(seed)
    let s = createBattle(region, LEVEL[regionRank(region)], rollEnemies(region, r))
    let turns = 0
    while (!s.outcome && turns < 60) {
      const correct = r() < accuracy
      s = resolveFight(s, retarget(s, 0), { correct, crit: correct && r() < 0.4 }, r).state
      turns++
    }
    return { win: s.outcome === 'win', turns }
  }
  it('a decent player (75%) usually wins in a handful of turns', () => {
    for (const region of JOURNEY) {
      let wins = 0
      let turns = 0
      for (let i = 0; i < 300; i++) {
        const o = sim(region, 0.75, region * 1000 + i)
        wins += Number(o.win)
        turns += o.turns
      }
      expect(wins / 300, `region ${region}`).toBeGreaterThan(0.85)
      expect(turns / 300).toBeLessThan(9)
      expect(turns / 300).toBeGreaterThan(1.5)
    }
  })
  it('a struggling player (30%) with no items loses sometimes', () => {
    let losses = 0
    for (let i = 0; i < 300; i++) losses += Number(!sim(3, 0.3, 77 + i).win)
    expect(losses).toBeGreaterThan(20)
  })
})

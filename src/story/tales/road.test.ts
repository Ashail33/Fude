import { beforeEach, describe, expect, it } from 'vitest'
import { ACTIVITY_BY_ID, activitiesFor } from '../../data/regions'
import { atOrBefore } from '../../data/journey'
import { WORD_BY_ID } from '../../data/vocab'
import { activityUnlocked, freshState, getState, hasKeyItem, setFlag, setState, wardOpen, type PlayerState } from '../../engine/store'
import { freshNinja } from '../../arcade/ninja/data'
import { getMap, MAP_SPECS } from '../../world/maps'
import type { Step } from '../../world/Dialog'
import { KEY_ITEMS, makeCtx, TALE_BY_ID, taleDone, taleStage, talkScript } from './engine'
import { GATES, NEEDED_TALES, roadTale } from './road'

const hooks = { sparkle: () => {}, sfx: () => {}, scene: () => {} }

/** Talk to an entity; answer every cast with `word`, pick 'later' at choices. Returns lines and any trial offered. */
function talk(id: string, word = '') {
  const c = makeCtx({ spec: { id, kind: 'npc' } } as never, hooks)
  const lines: string[] = []
  let trial: string | null = null
  const walk = (steps: Step[] | void | null) => {
    for (const st of steps ?? []) {
      if (st.kind === 'say') lines.push(st.line.en)
      else if (st.kind === 'choice') walk(st.onPick('later'))
      else if (st.kind === 'cast') walk(st.onCast(word))
      else if (st.kind === 'activity') trial = st.activity.id
    }
  }
  walk(talkScript(id)?.(c))
  return { lines, trial: trial as string | null }
}

const passAll = (s: PlayerState, region: number): PlayerState => ({
  ...s,
  progress: { ...s.progress, ...Object.fromEntries(activitiesFor(region).filter((a) => a.stage !== 'boss').map((a) => [a.id, { stars: 3, best: 100, plays: 1, lastPlayed: 0 }])) },
})
const finish = (tale: string) => setFlag(`tale.${tale}`, TALE_BY_ID.get(tale)!.stages.length)

describe('the Sealed Road', () => {
  beforeEach(() => setState(() => freshState()))

  it('every gate points at a real boss, real people and real words', () => {
    const where = new Map<string, string>()
    for (const sp of MAP_SPECS) for (const e of getMap(sp.id)!.entitySpecs) where.set(e.id, sp.id)
    for (const g of GATES) {
      const a = ACTIVITY_BY_ID.get(g.activity)!
      expect(a.stage, g.activity).toBe('boss')
      expect(a.region).toBe(g.region)
      expect(where.has(g.boss), g.boss).toBe(true)
      for (const p of g.parts) expect(where.has(p.from), p.from).toBe(true)
      const w = WORD_BY_ID.get(g.word)
      expect(w, g.word).toBeDefined()
      // the word must already be taught by the time you reach the ward
      expect(atOrBefore(w!.region, g.region), `${g.word} in region ${g.region}`).toBe(true)
    }
    for (const t of NEEDED_TALES) expect(TALE_BY_ID.has(t), t).toBe(true)
    // one gate per boss region
    expect(new Set(GATES.map((g) => g.region)).size).toBe(GATES.length)
  })

  it('no part waits on a tale from a later region, and key item ids are unique', () => {
    for (const g of GATES) for (const p of g.parts) expect(p.item.id.startsWith('road-')).toBe(true)
    const ids = KEY_ITEMS.map((k) => k.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('the boss stays locked behind its ward until the key is woven and the word cast', () => {
    setState((s) => passAll(s, 1))
    const boss = ACTIVITY_BY_ID.get('r1-boss')!
    expect(activityUnlocked(getState(), boss)).toBe(false)

    // meeting the ward starts the road tale
    const meet = talk('v-oni')
    expect(meet.trial).toBeNull()
    expect(taleStage(getState(), roadTale(1))).toBe(0)

    // nothing to hand over yet: Sumi's part needs a scroll stage cleared
    talk('vb-sumi')
    expect(hasKeyItem(getState(), 'road-sumi-ink')).toBe(false)

    // the side quests and the dojo free the parts
    finish('festival')
    finish('fk1-kasa')
    setState((s) => ({ ...s, ninja: { ...freshNinja(), cleared: 1 } }))
    talk('v-innkeeper')
    expect(taleStage(getState(), roadTale(1))).toBe(0)
    // any two of the three will do
    talk('fk1-tsuru')
    expect(['road-candle', 'road-lantern-paper'].every((k) => hasKeyItem(getState(), k))).toBe(true)
    expect(taleStage(getState(), roadTale(1))).toBe(1)
    // the third is no longer needed, so Sumi keeps his ink
    talk('vb-sumi')
    expect(hasKeyItem(getState(), 'road-sumi-ink')).toBe(false)

    // a wrong word: the key is woven but the ward holds
    const miss = talk('v-oni', 'みず')
    expect(hasKeyItem(getState(), 'road-lantern')).toBe(true)
    expect(hasKeyItem(getState(), 'road-candle')).toBe(false)
    expect(miss.trial).toBeNull()
    expect(wardOpen(getState(), 1)).toBe(false)

    // the right word breaks it and the fight begins
    const hit = talk('v-oni', 'ひ')
    expect(hit.trial).toBe('r1-boss')
    expect(wardOpen(getState(), 1)).toBe(true)
    expect(taleDone(getState(), roadTale(1))).toBe(true)
    expect(activityUnlocked(getState(), boss)).toBe(true)
    // and the boss talks normally from then on
    expect(talk('v-oni').lines.some((l) => l.includes('ward'))).toBe(false)
  })

  it('saves that already beat a boss keep the road open', () => {
    setState((s) => ({ ...passAll(s, 1), progress: { ...passAll(s, 1).progress, 'r1-boss': { stars: 1, best: 70, plays: 1, lastPlayed: 0 } } }))
    expect(wardOpen(getState(), 1)).toBe(true)
    expect(talk('v-oni').lines.some((l) => l.includes('ward'))).toBe(false)
    expect(activityUnlocked(getState(), ACTIVITY_BY_ID.get('r2-boss')!)).toBe(false)
  })

  it('a part is handed over after the giver’s own talk, with a nudge before it is ready', () => {
    talk('v-oni')
    const early = talk('fk1-tsuru')
    expect(early.lines.some((l) => l.includes('umbrella'))).toBe(true)
    expect(hasKeyItem(getState(), 'road-lantern-paper')).toBe(false)
  })
})

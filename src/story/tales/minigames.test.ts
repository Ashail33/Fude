import { beforeEach, describe, expect, it } from 'vitest'
import { dojoBlessing, gameOpen, ninjaStageOpen, ninjaWorldOpen } from '../../arcade/story'
import { freshNinja } from '../../arcade/ninja/data'
import { freshHamlet } from '../../engine/hamlet'
import { freshState, getState, hasKeyItem, setState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import { makeCtx, taleStage, talkScript } from './engine'

/** Talk to an entity, pick `pick` at every choice, and report what was asked to open. */
function talk(id: string, pick = 'later') {
  let route: string | null = null
  const hooks = { sparkle: () => {}, sfx: () => {}, scene: () => {}, play: (r: string) => (route = r) }
  const c = makeCtx({ spec: { id, kind: 'npc' } } as never, hooks)
  const lines: string[] = []
  const walk = (steps: Step[] | void | null) => {
    for (const st of steps ?? []) {
      if (st.kind === 'say') lines.push(st.line.en)
      else if (st.kind === 'choice') walk(st.onPick(pick))
    }
  }
  walk(talkScript(id)!(c))
  return { lines, route: route as string | null }
}

describe('the games in the story', () => {
  beforeEach(() => setState(() => freshState()))

  it('games are locked until their keeper is met, except for saves that already played', () => {
    const s = freshState()
    expect(gameOpen(s, 'dojo')).toBe(false)
    expect(gameOpen(s, 'valley')).toBe(false)
    expect(gameOpen(s, 'bridge')).toBe(false)
    expect(gameOpen({ ...s, ninja: freshNinja() }, 'dojo')).toBe(true)
    expect(gameOpen({ ...s, hamlet: freshHamlet() }, 'valley')).toBe(true)
    expect(gameOpen({ ...s, arcade: { stick: 4 } }, 'bridge')).toBe(true)
  })

  it('Master Sumi opens the Ink Dojo and can send you into the scroll', () => {
    const first = talk('vb-sumi', 'go')
    expect(first.route).toBe('/stick-ninja?from=world')
    expect(gameOpen(getState(), 'dojo')).toBe(true)
    expect(taleStage(getState(), 'ink-dojo')).toBe(0)
  })

  it('each ink echo beaten earns a keepsake and Sumi’s blessing; the last, the Ink Blade', () => {
    talk('vb-sumi')
    expect(dojoBlessing(getState()).atk).toBe(0)
    setState((s) => ({ ...s, ninja: { ...freshNinja(), cleared: 10 } }))
    talk('vb-sumi')
    expect(hasKeyItem(getState(), 'ronin-hat')).toBe(true)
    expect(hasKeyItem(getState(), 'oni-horn')).toBe(true)
    expect(taleStage(getState(), 'ink-dojo')).toBe(2)
    expect(dojoBlessing(getState()).atk).toBe(4)
    // telling him again gives nothing twice
    talk('vb-sumi')
    expect(getState().keyItems.filter((k) => k === 'ronin-hat')).toHaveLength(1)
    setState((s) => ({ ...s, ninja: { ...freshNinja(), cleared: 25 } }))
    const end = talk('vb-sumi')
    expect(end.lines.some((l) => l.includes('Kotone'))).toBe(true)
    expect(hasKeyItem(getState(), 'ink-blade')).toBe(true)
    expect(taleStage(getState(), 'ink-dojo')).toBe(5)
    expect(dojoBlessing(getState())).toEqual({ hp: 10, mp: 0, atk: 14, magic: 0 })
  })

  it('Granny Tane’s tale follows what you build in the Hidden Village', () => {
    talk('fh-tane')
    expect(hasKeyItem(getState(), 'valley-deed')).toBe(true)
    expect(gameOpen(getState(), 'valley')).toBe(true)
    const h = freshHamlet()
    setState((s) => ({ ...s, hamlet: { ...h, plots: { ...h.plots, 3: { id: 'paddy', level: 1, until: 0 } } } }))
    talk('fh-tane')
    expect(taleStage(getState(), 'empty-valley')).toBe(1)
    setState((s) => ({ ...s, hamlet: { ...s.hamlet!, raidsWon: 1, plots: { ...s.hamlet!.plots, 0: { id: 'manor', level: 2, until: 0 }, 4: { id: 'teahouse', level: 1, until: 0 } } } }))
    talk('fh-tane')
    expect(taleStage(getState(), 'empty-valley')).toBe(4)
    expect(hasKeyItem(getState(), 'village-bell')).toBe(true)
  })

  it('Hayato’s gorge tale tracks your Bamboo Bridge record', () => {
    const first = talk('fo-hayato', 'go')
    expect(first.route).toBe('/bamboo-bridge?from=world')
    setState((s) => ({ ...s, arcade: { stick: 30 } }))
    talk('fo-hayato')
    expect(taleStage(getState(), 'gorge')).toBe(2)
    expect(hasKeyItem(getState(), 'bamboo-charm')).toBe(true)
  })

  it('Stick Ninja’s worlds open with the journey', () => {
    const s = freshState()
    expect(ninjaWorldOpen(s, 0)).toBe(true)
    expect(ninjaStageOpen(s, 4)).toBe(true)
    expect(ninjaStageOpen(s, 5)).toBe(ninjaWorldOpen(s, 1))
    expect(ninjaWorldOpen(s, 4)).toBe(false)
  })
})

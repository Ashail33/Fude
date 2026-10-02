import { describe, expect, it } from 'vitest'
import { bonuses, buildTime, capacity, endRaid, freshHamlet, levelOf, openPlots, raidDue, settle, startBuild, type HamletState } from './hamlet'

const HOUR = 3600_000
const T0 = 1_000_000_000_000

function build(h: HamletState, plot: number, id: Parameters<typeof startBuild>[3], shards = 0, at = T0) {
  const r = startBuild(h, shards, plot, id, at)
  expect(r, `${id} on ${plot}`).toBeTruthy()
  return r!.h
}

describe('the Hidden Village', () => {
  it('starts with a manor, some supplies and the first raid a few hours away', () => {
    const h = freshHamlet(T0)
    expect(levelOf(h, 'manor', T0)).toBe(1)
    expect(openPlots(h, T0)).toBe(12)
    expect(raidDue(h, T0)).toBe(false)
    expect(raidDue(h, T0 + 4 * HOUR)).toBe(true)
  })

  it('builds over time and produces while the game is closed, up to the storehouse', () => {
    let h = freshHamlet(T0)
    h = build(h, 0, 'lumber')
    expect(levelOf(h, 'lumber', T0)).toBe(0) // still building
    const ready = T0 + buildTime('lumber', 1) * 1000
    expect(levelOf(h, 'lumber', ready)).toBe(1)
    const later = settle({ ...h, tick: ready }, ready + 2 * HOUR)
    expect(later.res.wood).toBeCloseTo(h.res.wood + 120)
    const much = settle({ ...h, tick: ready }, ready + 100 * HOUR)
    expect(much.res.wood).toBe(capacity(h, ready))
  })

  it('needs resources, the manor level and a free builder', () => {
    const poor = { ...freshHamlet(T0), res: { wood: 0, stone: 0, rice: 0 } }
    expect(startBuild(poor, 0, 0, 'lumber', T0)).toBeNull()
    const h = freshHamlet(T0)
    expect(startBuild(h, 0, 0, 'forge', T0)).toBeNull() // needs a level 2 manor
    expect(startBuild(h, 0, 29, 'lumber', T0)).toBeNull() // land not opened yet
    let b = build(h, 0, 'paddy')
    b = build(b, 1, 'lumber')
    expect(startBuild({ ...b, res: { wood: 999, stone: 999, rice: 999 } }, 0, 2, 'paddy', T0)).toBeNull() // two builders busy
  })

  it('makes the mage stronger: the dojo adds HP', () => {
    const h = { ...freshHamlet(T0), res: { wood: 999, stone: 999, rice: 999 } }
    const d = build(h, 0, 'dojo')
    const later = T0 + buildTime('dojo', 1) * 1000
    expect(bonuses(d, later).hp).toBe(6)
    expect(bonuses(undefined).hp).toBe(0)
  })

  it('raids: winning brings spoils, losing costs part of the stores', () => {
    const h = freshHamlet(T0)
    const won = endRaid(h, true, T0)
    expect(won.res.wood).toBeGreaterThan(h.res.wood)
    expect(won.raidsWon).toBe(1)
    const lost = endRaid(h, false, T0)
    expect(lost.res.wood).toBeLessThan(h.res.wood)
    expect(raidDue(lost, T0 + 1000)).toBe(false)
  })
})

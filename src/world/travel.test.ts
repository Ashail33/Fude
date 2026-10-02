import { describe, expect, it } from 'vitest'
import { getMap } from './maps'
import { freshState } from '../engine/store'
import { REGIONS } from '../data/regions'
import { isTravelWord, travelReady, travelStops, TRAVEL_WORDS } from './travel'
import { WORD_BY_ID } from '../data/vocab'

describe('the travel spell', () => {
  it('answers たび, とぶ and いく, and its vocabulary words exist', () => {
    expect(isTravelWord('たび')).toBe(true)
    expect(isTravelWord('とぶ')).toBe(true)
    expect(isTravelWord('いく')).toBe(true)
    expect(isTravelWord('みず')).toBe(false)
    for (const id of Object.values(TRAVEL_WORDS)) if (id) expect(WORD_BY_ID.get(id), id).toBeTruthy()
  })
  it('lists every region on the road with a real map to land on', () => {
    const stops = travelStops(freshState())
    expect(stops.map((t) => t.region.id)).toEqual(REGIONS.map((r) => r.id))
    for (const t of stops) {
      const m = getMap(t.map)
      expect(m, t.map).toBeTruthy()
      expect(m!.points[m!.spec.spawn], `${t.map} spawn`).toBeTruthy()
    }
  })
  it('only opens regions you have reached, and waits for a second one', () => {
    const s = freshState()
    const open = travelStops(s).filter((t) => t.open)
    expect(open.length).toBeGreaterThanOrEqual(1)
    expect(travelStops(s)[0].open).toBe(true)
    expect(travelReady(s)).toBe(open.length >= 2)
  })
})

import { describe, expect, it } from 'vitest'
import { GRADES, gradeFor } from './grades'
import { flickerAt, mapLights, packLights, tileLight, MAX_LIGHTS, type Light } from './lights'
import { QualityGovernor, startLevel } from './quality'
import { outputFactor } from './PostFX'
import { MAP_SPECS, getMap } from '../world/maps'

describe('lights from tiles', () => {
  it('places a lantern light inside its tile', () => {
    const l = tileLight('lantern', 3, 2, false)!
    expect(l.x).toBeGreaterThanOrEqual(48)
    expect(l.x).toBeLessThan(64)
    expect(l.y).toBeGreaterThanOrEqual(32)
    expect(l.y).toBeLessThan(48)
    expect(tileLight('grass', 0, 0, true)).toBeNull()
    expect(tileLight(null, 0, 0, true)).toBeNull()
  })
  it('night-only sources switch on at night', () => {
    expect(tileLight('wall-window', 0, 0, false)).toBeNull()
    expect(tileLight('wall-window', 0, 0, true)).not.toBeNull()
  })
  it('extracts lights from every layer of a map', () => {
    const m = { w: 3, h: 2, ground: ['grass', 'grass', 'grass', 'grass', 'grass', 'grass'] as const, obj: [null, 'campfire', null, null, null, 'lantern'] as const, over: [null, null, null, 'torii', null, null] as const }
    expect(mapLights(m, false)).toHaveLength(2)
    expect(mapLights(m, true)).toHaveLength(3)
  })
  it('the shrine is full of lanterns', () => {
    const m = getMap('shrine')!
    expect(mapLights(m, true).length).toBeGreaterThan(5)
  })
  it('flicker stays within [1 - flicker, 1]', () => {
    const l = { flicker: 0.4, seed: 1.2 }
    for (let t = 0; t < 10; t += 0.037) {
      const f = flickerAt(l, t)
      expect(f).toBeGreaterThanOrEqual(0.6 - 1e-9)
      expect(f).toBeLessThanOrEqual(1 + 1e-9)
    }
    expect(flickerAt({ flicker: 0, seed: 0 }, 3)).toBe(1)
  })
  it('packs only visible lights, capped, nearest-important first', () => {
    const mk = (x: number, y: number, intensity = 1): Light => ({ x, y, r: 20, color: [1, 1, 1], intensity, flicker: 0, seed: 0 })
    const lights = [mk(-100, -100), mk(50, 50), mk(1000, 50)]
    for (let i = 0; i < 40; i++) lights.push(mk(10 + i, 10))
    const p = packLights(lights, { x: 0, y: 0 }, 100, 100, 0, 1)
    expect(p.n).toBe(MAX_LIGHTS)
    expect(p.pos[0]).toBe(50) // the centre light wins
    const q = packLights([mk(130, 130)], { x: 100, y: 100 }, 100, 100, 0, 0.5)
    expect(q.n).toBe(1)
    expect(q.pos[0]).toBe(30)
    expect(q.col[0]).toBeCloseTo(0.5)
    expect(packLights([mk(10, 10)], { x: 0, y: 0 }, 100, 100, 0, 0).n).toBe(0)
  })
})

describe('grades', () => {
  it('every map has a grade and the regions have their moods', () => {
    for (const s of MAP_SPECS) expect(gradeFor(s)).toBeDefined()
    expect(gradeFor({ id: 'village', region: 1 }).name).toBe('golden')
    expect(gradeFor({ id: 'fields', region: 2 }).name).toBe('noon')
    expect(gradeFor({ id: 'forest', region: 3 }).name).toBe('forest')
    expect(gradeFor({ id: 'shrine', region: 4 }).name).toBe('night')
    expect(gradeFor({ id: 'tower', region: 5 }).name).toBe('twilight')
    expect(gradeFor({ id: 'village-shop', region: 1, interior: true }).name).toBe('interior')
  })
  it('night is darker than noon and god rays live in forest/shrine', () => {
    const lum = (c: readonly number[]) => c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15
    expect(lum(GRADES.night.ambient)).toBeLessThan(0.5)
    expect(lum(GRADES.noon.ambient)).toBeGreaterThan(0.95)
    expect(GRADES.forest.rayStrength).toBeGreaterThan(0)
    expect(GRADES.night.rayStrength).toBeGreaterThan(0)
    expect(GRADES.noon.rayStrength).toBe(0)
    for (const g of Object.values(GRADES)) {
      expect(g.dof).toBeLessThanOrEqual(0.8)
      expect(g.grain).toBeLessThan(0.05)
    }
  })
})

describe('quality', () => {
  it('maps preferences to start levels', () => {
    expect(startLevel('high')).toBe(3)
    expect(startLevel('low')).toBe(2)
    expect(startLevel('off')).toBe(0)
  })
  it('steps down one level per slow window, after warm-up', () => {
    const g = new QualityGovernor(3, { window: 10, warmup: 5 })
    const feed = (ms: number, n: number) => {
      const out: number[] = []
      for (let i = 0; i < n; i++) {
        const r = g.push(ms)
        if (r !== null) out.push(r)
      }
      return out
    }
    expect(feed(16, 100)).toEqual([])
    expect(g.level).toBe(3)
    expect(feed(30, 15)).toEqual([2])
    expect(feed(30, 15)).toEqual([1])
    expect(feed(30, 15)).toEqual([0])
    expect(feed(30, 100)).toEqual([])
  })
  it('ignores hitches from tab switches', () => {
    const g = new QualityGovernor(3, { window: 10, warmup: 0 })
    for (let i = 0; i < 50; i++) expect(g.push(i % 5 === 0 ? 2000 : 16)).toBeNull()
    expect(g.level).toBe(3)
  })
  it('picks an output factor that divides the scale within budget', () => {
    expect(outputFactor(6, 195, 422, 1_150_000)).toBe(3)
    expect(outputFactor(6, 195, 422, 450_000)).toBe(2)
    expect(outputFactor(4, 320, 200, 1_150_000)).toBe(4)
    expect(outputFactor(5, 400, 300, 10)).toBe(1)
  })
})

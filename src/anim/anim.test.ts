import { describe, expect, it } from 'vitest'
import { HD_ASSETS } from '../art/hd/manifest'
import { breathCurve, deformGrid, deformPoint, gridIndices, gridUvs, jellySquash, maskWeight, profilePad, reducedProfile, regionWeight, REST_DYN, type Profile } from './deform'
import { FIGURE_IDS, PROFILES, profileFor, sceneFor } from './profiles'
import { coverRect, sceneUv } from './scene'
import { BOUNCY, CRITICAL, Reactor, Spring, Tween } from './spring'

describe('springs', () => {
  it('critically damped spring converges without overshoot', () => {
    const s = new Spring(0, CRITICAL)
    s.target = 1
    let max = 0
    for (let i = 0; i < 120; i++) max = Math.max(max, s.step(1 / 60))
    expect(max).toBeLessThanOrEqual(1 + 1e-6)
    expect(s.x).toBeCloseTo(1, 3)
    expect(s.settled()).toBe(true)
  })

  it('bouncy spring overshoots then settles', () => {
    const s = new Spring(0, BOUNCY)
    s.target = 1
    let max = 0
    for (let i = 0; i < 400; i++) max = Math.max(max, s.step(1 / 60))
    expect(max).toBeGreaterThan(1.2)
    expect(s.x).toBeCloseTo(1, 3)
  })

  it('is frame-rate independent (sub-stepped)', () => {
    const a = new Spring(0, BOUNCY)
    const b = new Spring(0, BOUNCY)
    a.target = b.target = 1
    for (let i = 0; i < 30; i++) a.step(1 / 30)
    for (let i = 0; i < 144; i++) b.step(1 / 144)
    expect(Math.abs(a.x - b.x)).toBeLessThan(0.01)
  })

  it('stays stable with huge frame gaps', () => {
    const s = new Spring(0, { freq: 12, damping: 0.2 })
    s.kick(50)
    for (let i = 0; i < 20; i++) s.step(1)
    expect(Number.isFinite(s.x)).toBe(true)
    expect(Math.abs(s.x)).toBeLessThan(1)
  })

  it('tween reaches its target', () => {
    const t = new Tween(0).start(1, 0.5)
    for (let i = 0; i < 40; i++) t.step(1 / 60)
    expect(t.value).toBe(1)
    expect(t.done).toBe(true)
  })
})

describe('reactor', () => {
  const run = (r: Reactor, s: number) => {
    let f = r.update(0)
    for (let i = 0; i < s * 60; i++) f = r.update(1 / 60)
    return f
  }

  it('hit flashes, recoils and returns to rest', () => {
    const r = new Reactor()
    r.cue('hit', 1)
    const f1 = run(r, 0.05)
    expect(f1.flash).toBeGreaterThan(0.3)
    expect(Math.abs(f1.tx) + Math.abs(f1.bend)).toBeGreaterThan(0.005)
    const f = run(r, 3)
    expect(f.flash).toBeLessThan(0.01)
    expect(Math.abs(f.tx)).toBeLessThan(0.002)
    expect(f.scale).toBeCloseTo(1, 2)
    expect(r.busy).toBe(false)
  })

  it('attack anticipates (smaller), lunges (bigger), then settles', () => {
    const r = new Reactor()
    r.cue('attack')
    const a = run(r, 0.15)
    expect(a.scale).toBeLessThan(1)
    const b = run(r, 0.17)
    expect(b.scale).toBeGreaterThan(1.08)
    const c = run(r, 3)
    expect(c.scale).toBeCloseTo(1, 2)
  })

  it('defeat dissolves fully and drifts up', () => {
    const r = new Reactor()
    r.cue('defeat')
    const f = run(r, 1.2)
    expect(f.dissolve).toBe(1)
    expect(f.ty).toBeLessThan(-0.05)
  })

  it('spawn pops in with overshoot', () => {
    const r = new Reactor()
    r.cue('spawn')
    let max = 0
    for (let i = 0; i < 90; i++) max = Math.max(max, r.update(1 / 60).scale)
    expect(max).toBeGreaterThan(1.02)
    expect(r.frame.alpha).toBe(1)
  })
})

describe('deformation', () => {
  it('region weights are 1 at the centre, 0 outside, smooth in between', () => {
    const r = { cx: 0.5, cy: 0.5, rx: 0.2, ry: 0.1 }
    expect(regionWeight(r, 0.5, 0.5)).toBe(1)
    expect(regionWeight(r, 0.71, 0.5)).toBe(0)
    const mid = regionWeight(r, 0.62, 0.5)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
  })

  it('ramps weight from root to tip', () => {
    const r = { cx: 0.5, cy: 0.5, rx: 0.5, ry: 0.5, soft: 0, ramp: [0.5, 0.8, 0.5, 0.2] as const }
    expect(regionWeight(r, 0.5, 0.8)).toBe(0)
    expect(regionWeight(r, 0.5, 0.2)).toBe(1)
    expect(regionWeight(r, 0.5, 0.5)).toBeCloseTo(0.5, 5)
  })

  it('masks sum and cap', () => {
    const p: Profile = { regions: { a: { cx: 0.5, cy: 0.5, rx: 0.3, ry: 0.3 }, b: { cx: 0.5, cy: 0.5, rx: 0.3, ry: 0.3 } } }
    expect(maskWeight(p, ['a', 'b'], 0.5, 0.5)).toBe(1)
    expect(maskWeight(p, 'missing', 0.5, 0.5)).toBe(0)
  })

  it('breath curve is 0 at rest and peaks at 1 after the inhale', () => {
    expect(breathCurve(0, 4)).toBeCloseTo(0, 6)
    expect(breathCurve(1.6, 4)).toBeCloseTo(1, 6)
    expect(breathCurve(4, 4)).toBeCloseTo(0, 6)
  })

  it('breathing keeps the feet planted and lifts the shoulders', () => {
    const p: Profile = { regions: {}, breathe: { amp: 0.01, period: 4, chest: 0.4 } }
    const t = 1.6 // full inhale
    const [, yFeet] = deformPoint(p, 0.5, 1, t, REST_DYN)
    const [, yHead] = deformPoint(p, 0.5, 0.1, t, REST_DYN)
    expect(yFeet).toBeCloseTo(1, 6)
    expect(yHead).toBeCloseTo(0.1 - 0.01, 4)
  })

  it('sway bends the top, not the base', () => {
    const p: Profile = { regions: {}, sway: { amp: 0.02, period: 4 } }
    for (const t of [0.3, 1, 2.2]) {
      expect(deformPoint(p, 0.5, 1, t, REST_DYN)[0]).toBeCloseTo(0.5, 6)
    }
    const tops = [0.3, 1, 2.2].map((t) => Math.abs(deformPoint(p, 0.5, 0, t, REST_DYN)[0] - 0.5))
    expect(Math.max(...tops)).toBeGreaterThan(0.005)
  })

  it('jelly squash starts at rest and decays within a period', () => {
    const j = { amp: 0.05, period: 2 }
    expect(jellySquash(j, 0)).toBeCloseTo(0, 6)
    expect(Math.abs(jellySquash(j, 1.95))).toBeLessThan(0.002)
  })

  it('reduced motion is breathing only', () => {
    const p = reducedProfile(PROFILES['void-dragon'])
    expect(p.wave).toBeUndefined()
    expect(p.float).toBeUndefined()
    expect(p.breathe).toBeDefined()
  })

  it('grid helpers are consistent', () => {
    const n = 4
    const uv = gridUvs(n)
    expect(uv.length).toBe(25 * 2)
    const idx = gridIndices(n)
    expect(idx.length).toBe(96)
    expect(Math.max(...idx)).toBe(24)
  })
})

describe('profiles', () => {
  it('covers every figure HD id (portraits, enemies, bosses)', () => {
    const missing = FIGURE_IDS.filter((id) => !PROFILES[id])
    expect(missing).toEqual([])
    expect(FIGURE_IDS.length).toBeGreaterThan(30)
  })

  it('every flutter/wave/flap references existing regions', () => {
    for (const [id, p] of Object.entries(PROFILES)) {
      const refs = [...(p.flutter ?? []).flatMap((f) => [f.regions].flat()), ...[p.wave?.regions ?? []].flat(), ...[p.flap?.regions ?? []].flat()]
      for (const r of refs) expect(p.regions[r], `${id}: ${r}`).toBeDefined()
    }
  })

  it('never displaces any vertex outside its padded canvas (stress: time sweep + max reactions)', () => {
    const n = 12
    const uv = gridUvs(n)
    const out = new Float32Array(uv.length)
    for (const id of FIGURE_IDS) {
      const p = profileFor(id)
      const pad = profilePad(p, 1)
      for (let t = 0; t < 12; t += 0.37) {
        for (const dyn of [REST_DYN, { ...REST_DYN, squash: 0.12, bend: 0.06, lean: 1 }, { ...REST_DYN, squash: -0.12, bend: -0.06, lean: -1 }]) {
          deformGrid(out, uv, p, t, dyn, 1, pad)
          let lo = Infinity
          let hi = -Infinity
          for (let k = 0; k < out.length; k++) {
            lo = Math.min(lo, out[k])
            hi = Math.max(hi, out[k])
          }
          expect(lo, id).toBeGreaterThanOrEqual(-1e-6)
          expect(hi, id).toBeLessThanOrEqual(1 + 1e-6)
        }
      }
    }
  })

  it('idle motion stays subtle (no seasick amplitudes)', () => {
    for (const id of FIGURE_IDS) {
      const p = profileFor(id)
      let max = 0
      for (let t = 0; t < 10; t += 0.1)
        for (const [u, v] of [[0.5, 0.05], [0.1, 0.4], [0.9, 0.4], [0.5, 0.95]]) {
          const [x, y] = deformPoint(p, u, v, t, REST_DYN)
          max = Math.max(max, Math.hypot(x - u, y - v))
        }
      expect(max, id).toBeLessThan(0.06)
      expect(max, id).toBeGreaterThan(0.001)
    }
  })

  it('has scene motion for backdrops / title / scenes', () => {
    for (const a of HD_ASSETS.filter((x) => x.category === 'backdrops' || x.category === 'title' || x.category === 'scenes')) {
      expect(sceneFor(a.id).zoom[0]).toBeGreaterThanOrEqual(1.03)
    }
  })
})

describe('scene', () => {
  it('cover rect fills the box', () => {
    const r = coverRect(16 / 9, 16 / 9)
    expect(r).toEqual({ u0: 0, v0: 0, uw: 1, vh: 1 })
    const tall = coverRect(9 / 16, 16 / 9)
    expect(tall.vh).toBe(1)
    expect(tall.uw).toBeCloseTo((9 / 16) / (16 / 9), 6)
  })

  it('scene uvs never leave the texture, even with max parallax', () => {
    const m = sceneFor('title-wide')
    const cover = coverRect(390 / 844, 16 / 9)
    for (let t = 0; t < 70; t += 3.3)
      for (const [px, py] of [[-1, -1], [1, 1], [0, 0]])
        for (const [sx, sy] of [[0, 0], [1, 1], [0, 1], [1, 0], [0.5, 0.5]]) {
          const [u, v] = sceneUv(sx, sy, t, m, cover, px, py)
          expect(u).toBeGreaterThanOrEqual(0)
          expect(u).toBeLessThanOrEqual(1)
          expect(v).toBeGreaterThanOrEqual(0)
          expect(v).toBeLessThanOrEqual(1)
        }
  })
})

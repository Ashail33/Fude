import { describe, expect, it } from 'vitest'
import { easeOutBack, easeOutCubic, easeInOutCubic, stepSpring, springSettled } from './motion'

describe('easings', () => {
  it('start at 0 and end at 1', () => {
    for (const f of [easeOutBack, easeOutCubic, easeInOutCubic]) {
      expect(f(0)).toBeCloseTo(0)
      expect(f(1)).toBeCloseTo(1)
    }
  })
  it('ease-out-back overshoots', () => {
    let max = 0
    for (let t = 0; t <= 1; t += 0.01) max = Math.max(max, easeOutBack(t))
    expect(max).toBeGreaterThan(1.05)
  })
})

describe('spring', () => {
  it('converges to the target frame-rate independently', () => {
    const a = { x: 0, v: 0 }
    const b = { x: 0, v: 0 }
    for (let i = 0; i < 60; i++) stepSpring(a, 100, 1 / 60)
    for (let i = 0; i < 30; i++) stepSpring(b, 100, 1 / 30)
    expect(a.x).toBeCloseTo(b.x, 0)
    for (let i = 0; i < 240; i++) stepSpring(a, 100, 1 / 60)
    expect(springSettled(a, 100)).toBe(true)
  })
  it('underdamped springs overshoot, critically damped do not', () => {
    const u = { x: 0, v: 0 }
    const c = { x: 0, v: 0 }
    let mu = 0
    let mc = 0
    for (let i = 0; i < 120; i++) {
      mu = Math.max(mu, stepSpring(u, 1, 1 / 60, 14, 0.5).x)
      mc = Math.max(mc, stepSpring(c, 1, 1 / 60, 14, 1).x)
    }
    expect(mu).toBeGreaterThan(1.05)
    expect(mc).toBeLessThanOrEqual(1.0001)
  })
})

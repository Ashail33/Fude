import { describe, expect, it } from 'vitest'
import { RUN_SPEED, WALK_SPEED, springStep, walkFrame } from './engine'

describe('overworld motion', () => {
  it('walks and runs a whole number of art pixels per 60 Hz frame', () => {
    expect(((WALK_SPEED * 16) / 60) % 1).toBeCloseTo(0)
    expect(((RUN_SPEED * 16) / 60) % 1).toBeCloseTo(0)
  })
  it('walk frames are tied to distance: a contact pose starts every tile', () => {
    for (let steps = 0; steps < 6; steps++) {
      expect(walkFrame(steps, 0) % 2).toBe(0)
      expect(walkFrame(steps, 0.6) % 2).toBe(1)
    }
    const seq = [0, 0.3, 0.6, 0.9].map((t) => walkFrame(1, t))
    expect(seq).toEqual([2, 2, 3, 3])
    expect(walkFrame(2, 0)).toBe(0)
  })
  it('the camera/companion spring settles on its target from any frame rate', () => {
    for (const hz of [30, 60, 144]) {
      const s = { x: 0, y: 0, vx: 0, vy: 0 }
      for (let i = 0; i < hz * 2; i++) springStep(s, 20, -8, 6, 1, 1 / hz)
      expect(s.x).toBeCloseTo(20, 1)
      expect(s.y).toBeCloseTo(-8, 1)
    }
  })
})

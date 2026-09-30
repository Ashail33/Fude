import { describe, expect, it } from 'vitest'
import { hueOf, tintFilter } from './pixelTint'

describe('pixel tint helpers', () => {
  it('reads hues of primary colours', () => {
    expect(hueOf('#ff0000')).toBe(0)
    expect(hueOf('#00ff00')).toBe(120)
    expect(hueOf('#0000ff')).toBe(240)
    expect(hueOf('#808080')).toBe(0)
    expect(hueOf('nope')).toBe(0)
  })

  it('builds a filter that rotates sepia toward the target hue', () => {
    expect(tintFilter('#0000ff', 1)).toBe('sepia(1) saturate(2.60) hue-rotate(202deg)')
    expect(tintFilter('#ff0000', 0)).toContain('sepia(0)')
    expect(tintFilter('#ff0000', 0.5)).toMatch(/hue-rotate\(322deg\)/)
  })
})

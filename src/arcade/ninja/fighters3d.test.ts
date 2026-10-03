import { describe, expect, it } from 'vitest'
import models from '../../../art-src/models.json'
import { CAST3D } from './fighters3d'
import { FOES } from './data'

describe('3D fighters', () => {
  it('every cast model has a source, and every cast kind is a real fighter', () => {
    const src = models as Record<string, unknown>
    for (const [kind, c] of Object.entries(CAST3D)) {
      expect(src[c!.id], `${kind} → ${c!.id}`).toBeTruthy()
      expect(kind === 'hero' || kind in FOES, kind).toBe(true)
    }
  })
  it('the hero is cast, and no foe borrows his model', () => {
    expect(CAST3D.hero?.id).toBe('ninja')
    for (const [kind, c] of Object.entries(CAST3D)) if (kind !== 'hero') expect(c!.id, kind).not.toBe('ninja')
  })
})

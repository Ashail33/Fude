import { describe, expect, it } from 'vitest'
import { describeItem } from '../../engine/items'
import { PHASES } from './bossData'
import { DATA } from './data'

describe('region 8: the Castle Town', () => {
  it('is live, with four lessons of 15 words', () => {
    expect(DATA).not.toBeNull()
    expect(DATA!.words.length).toBe(60)
    expect(DATA!.grammar.length).toBeGreaterThanOrEqual(10)
  })

  it('gives every boss turn one right answer among distinct options, and real review items', () => {
    for (const phase of PHASES) {
      expect(phase.length).toBeGreaterThanOrEqual(8)
      for (const t of phase) {
        const opts = [t.answer, ...t.wrong]
        expect(new Set(opts).size, t.situation).toBe(opts.length)
        expect(t.wrong.length, t.situation).toBeGreaterThanOrEqual(2)
        if (t.frame) expect(t.frame.split('＿').length, t.situation).toBe(2)
        expect(t.items.length, t.situation).toBeGreaterThan(0)
        for (const id of t.items) expect(describeItem(id), `${t.situation}: ${id}`).toBeTruthy()
      }
    }
  })
})

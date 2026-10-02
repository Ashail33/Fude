import { describe, expect, it } from 'vitest'
import { GRAMMAR } from '../data/grammar'
import { HIRAGANA, KATAKANA } from '../data/kana'
import { VOCAB } from '../data/vocab'
import { getMap } from '../world/maps'
import { describeItem, item } from './items'
import { cueOf, LOCI, roomLoci } from './palace'

/** What each room must hold. */
const expected = (room: number): string[] => [
  ...(room === 1 ? HIRAGANA.map((k) => item.kana(k.char)) : []),
  ...(room === 2 ? KATAKANA.map((k) => item.kana(k.char)) : []),
  ...VOCAB.filter((w) => w.region === room).map((w) => item.word(w.id)),
  ...GRAMMAR.filter((g) => g.region === room).map((g) => item.grammar(g.id)),
]

describe('memory palace', () => {
  it('place ids are unique and every item lives in exactly one place', () => {
    expect(new Set(LOCI.map((l) => l.id)).size).toBe(LOCI.length)
    const items = LOCI.flatMap((l) => l.memories.map((m) => m.item))
    const dup = items.filter((x, i) => items.indexOf(x) !== i)
    expect(dup).toEqual([])
  })

  describe.each([1, 2, 3, 4, 5])('room %i', (room) => {
    const loci = roomLoci(room)
    it('has a route of places anchored to things on its maps', () => {
      expect(loci.length).toBeGreaterThanOrEqual(6)
      for (const l of loci) {
        const m = getMap(l.map)
        expect(m, `${l.id} map ${l.map}`).toBeTruthy()
        expect(m!.entitySpecs.some((e) => e.id === l.anchor), `${l.id} anchor ${l.anchor}`).toBe(true)
        expect(l.memories.length, `${l.id} size`).toBeGreaterThanOrEqual(2)
        expect(l.memories.length, `${l.id} size`).toBeLessThanOrEqual(9)
      }
      const anchors = loci.map((l) => `${l.map}:${l.anchor}`)
      expect(new Set(anchors).size, 'one place per anchor').toBe(anchors.length)
    })

    it('holds every kana, word and grammar point of its region', () => {
      const have = new Set(loci.flatMap((l) => l.memories.map((m) => m.item)))
      const missing = expected(room).filter((id) => !have.has(id))
      expect(missing).toEqual([])
    })

    it('memories resolve and their cues never give the answer away', () => {
      for (const l of loci)
        for (const m of l.memories) {
          const d = describeItem(m.item)
          expect(d, m.item).toBeTruthy()
          expect(m.story.length, `${m.item} story`).toBeGreaterThan(30)
          expect(m.story, `${m.item} story shows its own Japanese`).not.toContain(d!.front)
          expect(cueOf(m)).not.toContain(d!.front)
        }
    })
  })
})

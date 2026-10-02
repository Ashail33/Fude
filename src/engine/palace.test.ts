import { describe, expect, it } from 'vitest'
import { GRAMMAR } from '../data/grammar'
import { HIRAGANA, KATAKANA } from '../data/kana'
import { JOURNEY } from '../data/journey'
import { KANJI } from '../data/kanjiList'
import { VOCAB } from '../data/vocab'
import { getMap } from '../world/maps'
import { describeItem, item } from './items'
import { cueOf, episodeCue, homeOf, LOCI, retell, roomLoci, roomOf, storyOf } from './palace'
import { freshState } from './store'

/** What each room must hold. */
const expected = (room: number): string[] => [
  ...(room === 1 ? HIRAGANA.map((k) => item.kana(k.char)) : []),
  ...(room === 2 ? KATAKANA.map((k) => item.kana(k.char)) : []),
  ...VOCAB.filter((w) => w.region === room).map((w) => item.word(w.id)),
  ...GRAMMAR.filter((g) => g.region === room).map((g) => item.grammar(g.id)),
  ...KANJI.filter((k) => k.region === room).map((k) => item.kanji(k.char)),
]

describe('memory palace', () => {
  it('place ids are unique and every item lives in exactly one place', () => {
    expect(new Set(LOCI.map((l) => l.id)).size).toBe(LOCI.length)
    const items = LOCI.flatMap((l) => l.memories.map((m) => m.item))
    const dup = items.filter((x, i) => items.indexOf(x) !== i)
    expect(dup).toEqual([])
  })

  describe.each([...JOURNEY])('room %i', (room) => {
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
          expect(cueOf(freshState(), m)).not.toContain(d!.front)
        }
    })

    it('every memory has a place-free image that can be retold anywhere', () => {
      for (const l of loci)
        for (const m of l.memories) {
          const img = m.image ?? ''
          expect(img.length, `${m.item} image`).toBeGreaterThan(25)
          expect(img.split(/\s+/).length, `${m.item} image is too long`).toBeLessThanOrEqual(40)
          expect(img[0], `${m.item} image should start lower case`).toBe(img[0]?.toLowerCase())
          expect(img, `${m.item} image shows its own Japanese`).not.toContain(describeItem(m.item)!.front)
          expect(/[A-Z]{2,}/.test(img), `${m.item} image needs its CAPS sound hook`).toBe(true)
          expect(img.toLowerCase(), `${m.item} image names its home place`).not.toContain(l.name.en.toLowerCase().replace(/^the /, ''))
        }
    })
  })
})

describe('the player’s own palace', () => {
  const ep = (map: string, anchor: string) => [{ map, anchor, how: 'learned' as const, what: 'First Words I', at: 1 }]
  const base = freshState()

  it('keeps authored homes until something happens in the world', () => {
    const home = homeOf(base, 'k:か')!
    expect(home.personal).toBeFalsy()
    expect(LOCI.find((l) => l.id === home.id)).toBeTruthy()
  })

  it('moves an item to where it was learned, joining the route', () => {
    const s = { ...base, episodes: { 'k:か': ep('village', 'v-teacher') } }
    const home = homeOf(s, 'k:か')!
    expect(home).toMatchObject({ personal: true, map: 'village', anchor: 'v-teacher', room: 1 })
    const route = roomOf(s, 1)
    expect(route).toContain(home)
    expect(route.filter((l) => l.memories.some((m) => m.item === 'k:か'))).toHaveLength(1)
    expect(episodeCue(s, 'k:か')).toContain('First Words I')
  })

  it('moves an item onto an authored place it was used at', () => {
    const inn = LOCI.find((l) => l.room === 1)!
    const other = LOCI.find((l) => l.room === 1 && l.id !== inn.id)!
    const item = other.memories[0].item
    const s = { ...base, episodes: { [item]: ep(inn.map, inn.anchor) } }
    expect(homeOf(s, item)!.id).toBe(inn.id)
  })

  it('ignores moments at things that no longer exist', () => {
    const s = { ...base, episodes: { 'k:か': ep('village', 'no-such-thing') } }
    expect(homeOf(s, 'k:か')!.personal).toBeFalsy()
  })
})

describe('stories follow the item', () => {
  it('reads well everywhere (sample)', () => {
    const ms = LOCI.flatMap((l) => l.memories)
    const places = ['village', 'fields', 'forest', 'shrine', 'tower'].flatMap((id) => getMap(id)!.entitySpecs.slice(0, 40).map((e) => ({ map: id, anchor: e.id, name: e.name ?? { en: 'spot' } })))
    const out = places.map((p, i) => retell(ms[(i * 37) % ms.length], p))
    for (const s of out) expect(s).not.toMatch(/\{|\}|undefined/)
  })

  const base = freshState()
  const at = (map: string, anchor: string) => ({ ...base, episodes: { 'k:か': [{ map, anchor, how: 'learned' as const, at: 1 }] } })
  const ka = LOCI.flatMap((l) => l.memories).find((m) => m.item === 'k:か')!

  it('keeps the hand-written story at the authored place', () => {
    expect(storyOf(base, ka)).toBe(ka.story)
  })

  it('retells the picture at the place the item moved to', () => {
    for (const [map, anchor, name] of [
      ['village', 'v-teacher', 'Teacher Hana'],
      ['village', 'v-flant-1', 'Festival Lantern'],
      ['village', 'v-tanuki', 'Mischievous Tanuki'],
      ['village', 'v-sakura', ''],
    ]) {
      const story = storyOf(at(map, anchor), ka)
      expect(story).not.toBe(ka.story)
      expect(story).toContain(ka.image.replace(/[.!]+$/, '').slice(0, 30))
      if (name) expect(story).toContain(name)
      expect(story[0]).toBe(story[0].toUpperCase())
      expect(cueOf(at(map, anchor), ka)).not.toContain('か')
    }
  })
})

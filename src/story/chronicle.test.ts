import { describe, expect, it } from 'vitest'
import { bossOf } from '../data/regions'
import { freshState, type PlayerState } from '../engine/store'
import { owedMemories, PAGES, YOKAI } from './chronicle'
import { SCENES } from './scenes'
import { TALES } from './tales/engine'

const beat = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, { stars: 1, best: 1, plays: 1, lastPlayed: 0 }]))
const seals = (region: number, n: number) => Object.fromEntries(YOKAI.filter((y) => y.region === region).slice(0, n).map((y) => [`seal.${y.id}`, 1]))
const st = (o: Partial<PlayerState>): PlayerState => ({ ...freshState(), ...o })

describe('chronicle', () => {
  it('every page and the true ending have a scene', () => {
    for (const p of PAGES) expect(SCENES[p.scene], p.scene).toBeTruthy()
    expect(SCENES['true-ending']).toBeTruthy()
  })

  it('every region has folklore spirits, each with a tale that seals it', () => {
    for (let r = 1; r <= 5; r++) expect(YOKAI.filter((y) => y.region === r).length, `region ${r}`).toBeGreaterThanOrEqual(2)
    for (const y of YOKAI) expect(TALES.some((t) => t.yokai === y.id), y.id).toBe(true)
    for (const t of TALES) if (t.yokai) expect(YOKAI.some((y) => y.id === t.yokai), t.id).toBe(true)
  })

  it('starts with nothing to remember', () => {
    expect(owedMemories(st({}))).toEqual([])
  })

  it('the first memory comes with the first boss', () => {
    expect(owedMemories(st({ progress: beat(bossOf(1).id) }))).toEqual(['memory-1'])
  })

  it('spirit pages need their seals and the main-road page before them', () => {
    const progress = beat(bossOf(1).id)
    expect(owedMemories(st({ progress, flags: seals(1, 2) }))).toEqual(['memory-1'])
    expect(owedMemories(st({ progress, flags: seals(1, 1), seenScenes: ['memory-1'] }))).toEqual([])
    expect(owedMemories(st({ progress, flags: seals(1, 2), seenScenes: ['memory-1'] }))).toEqual(['memory-2'])
  })

  it('main-road pages come in order', () => {
    const progress = beat(bossOf(1).id, bossOf(2).id)
    expect(owedMemories(st({ progress }))).toEqual(['memory-1'])
    expect(owedMemories(st({ progress, seenScenes: ['memory-1'] }))).toEqual(['memory-3'])
  })

  it('the true ending waits for every page and the dragon', () => {
    const all = PAGES.map((p) => p.scene)
    const progress = beat(...[1, 2, 3, 4, 5].map((r) => bossOf(r).id), 'r5-dragon')
    expect(owedMemories(st({ progress, seenScenes: [...all.slice(1), 'ending'] }))).not.toContain('true-ending')
    expect(owedMemories(st({ progress, seenScenes: [...all, 'ending'] }))).toEqual(['true-ending'])
  })
})

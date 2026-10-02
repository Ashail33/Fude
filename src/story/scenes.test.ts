import { describe, expect, it } from 'vitest'
import { CHARACTER_SPRITES, ENEMY_SPRITES } from '../art'
import { REGIONS } from '../data/regions'
import { backdropAt, castAt, fill, SCENES, SPEAKERS, speechText } from './scenes'

const REQUIRED = [
  'intro',
  ...REGIONS.map((r) => `arrive-${r.map}`),
  ...REGIONS.flatMap((r) => [`pre-boss-r${r.id}`, `post-boss-r${r.id}`]),
  'ending',
]

describe('story scenes', () => {
  it('has every scene id the game triggers', () => {
    for (const id of REQUIRED) expect(SCENES[id], id).toBeDefined()
  })

  it('uses only known sprites for speakers', () => {
    const known = new Set<string>([...CHARACTER_SPRITES, ...ENEMY_SPRITES])
    for (const s of Object.values(SPEAKERS)) expect(known.has(s.sprite), s.sprite).toBe(true)
  })

  it('every step is either a silent pause or has text; speakers are on stage', () => {
    for (const scene of Object.values(SCENES)) {
      expect(scene.steps.length).toBeGreaterThan(2)
      scene.steps.forEach((st, i) => {
        if (!st.pause) expect(st.jp || st.en, `${scene.id}#${i}`).toBeTruthy()
        if (st.who) expect(castAt(scene, i), `${scene.id}#${i} ${st.who}`).toContain(st.who)
        if (st.jp) expect(st.en, `${scene.id}#${i} needs a translation`).toBeTruthy()
        // speech reading must be kana-only when given
        if (st.kana) expect(/[一-龯]/.test(st.kana), `${scene.id}#${i} kana has kanji`).toBe(false)
        // lines with kanji need a kana reading for TTS
        if (st.jp && /[一-龯]/.test(st.jp) && !/^[木林森、。]+$/.test(st.jp)) expect(st.kana, `${scene.id}#${i} ${st.jp}`).toBeTruthy()
      })
    }
  })

  it('tracks cast and backdrop changes', () => {
    const intro = SCENES.intro
    expect(backdropAt(intro, 0)).toBe('void')
    expect(backdropAt(intro, intro.steps.length - 1)).toBe('night-hill')
    expect(castAt(intro, intro.steps.length - 1)).toEqual(['you', 'fude'])
    expect(castAt(SCENES['post-boss-r5'], 1)).not.toContain('chimera')
  })

  it('fills the player name and cleans speech text', () => {
    expect(fill('{name}さん', 'ユキ')).toBe('ユキさん')
    expect(fill('{name}', '')).toBe('Mage')
    expect(speechText({ jp: '（「です」と「ます」ですよ！）' }, 'x')).toBe('ですとますですよ！')
  })
})

describe('backdrop dioramas', () => {
  it('every diorama is 20 tiles wide with a base per row', async () => {
    const { DIORAMAS } = await import('./Backdrop')
    for (const [id, d] of Object.entries(DIORAMAS)) {
      expect(d.base.length, id).toBe(d.rows.length)
      for (const r of d.rows) expect(r.length, `${id}: ${r}`).toBe(20)
    }
  })
})

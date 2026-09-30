import { describe, expect, it } from 'vitest'
import { CHARACTER_SPRITES, ENEMY_SPRITES } from '../../art'
import { SPEAKERS } from '../../story/scenes'
import { blipFreq, DEFAULT_VOICE, isQuestion, isVoiced, pickJaVoice, shouldBlip, ttsParams, voiceFor, voiceKey, VOICES, type VoiceLike } from './voices'

describe('voice profiles', () => {
  it('covers every character, enemy and story speaker', () => {
    for (const id of [...CHARACTER_SPRITES, ...ENEMY_SPRITES]) expect(voiceKey(id), id).toBe(id)
    for (const [who, sp] of Object.entries(SPEAKERS)) {
      expect(voiceKey(who), who).not.toBeNull()
      expect(voiceKey(sp.sprite), sp.sprite).not.toBeNull()
    }
  })
  it('resolves aliases and falls back to the narrator', () => {
    expect(voiceFor('you')).toBe(VOICES.mage)
    expect(voiceFor('librarian')).toBe(VOICES.wisp)
    expect(voiceFor('Kana-Oni')).toBe(VOICES.oni)
    expect(voiceFor('chest')).toBe(DEFAULT_VOICE)
    expect(voiceFor(undefined)).toBe(DEFAULT_VOICE)
    expect(voiceKey('')).toBeNull()
  })
  it('gives the main characters distinct voices', () => {
    const ids = ['fude', 'mage', 'elder', 'guard', 'merchant', 'child', 'cat', 'dog', 'oni', 'dragon']
    const sig = ids.map((id) => {
      const v = VOICES[id]
      return `${v.wave}:${v.base}:${v.tts.pitch}`
    })
    expect(new Set(sig).size).toBe(ids.length)
    // Big and old sound low, small and young sound high.
    expect(VOICES.elder.base).toBeLessThan(VOICES.fude.base)
    expect(VOICES.dragon.tts.pitch).toBeLessThan(1)
    expect(VOICES.child.tts.pitch).toBeGreaterThan(1)
  })
  it('keeps profiles sane', () => {
    for (const [id, v] of Object.entries(VOICES)) {
      expect(v.base, id).toBeGreaterThan(40)
      expect(v.base, id).toBeLessThan(4000)
      expect(v.len, id).toBeLessThan(0.2)
      expect(v.every, id).toBeGreaterThanOrEqual(1)
      expect(v.gain, id).toBeLessThanOrEqual(0.12)
      expect(v.tts.pitch, id).toBeGreaterThan(0)
      expect(v.tts.pitch, id).toBeLessThanOrEqual(2)
    }
  })
})

describe('talk blips', () => {
  it('skips spaces, punctuation and small kana', () => {
    for (const c of ['あ', 'カ', '火', 'A']) expect(isVoiced(c), c).toBe(true)
    for (const c of [' ', '　', '。', '、', '！', '？', '「', '…', 'ー', 'っ', 'ゃ', '!', ',']) expect(isVoiced(c), c).toBe(false)
  })
  it('blips every n-th character per voice', () => {
    const text = [...'こんにちは、フデです']
    const n = (p: typeof DEFAULT_VOICE) => text.filter((c, i) => shouldBlip(p, c, i)).length
    expect(n(VOICES.child)).toBeGreaterThan(n(VOICES.elder))
  })
  it('pitches deterministically per character within the voice range', () => {
    const v = VOICES.fude
    expect(blipFreq(v, 'あ')).toBe(blipFreq(v, 'あ'))
    const fs = [...'あいうえおかきくけこ'].map((c) => blipFreq(v, c))
    expect(new Set(fs.map((f) => f.toFixed(2))).size).toBeGreaterThan(1)
    for (const f of fs) {
      expect(f).toBeGreaterThan(v.base / 2)
      expect(f).toBeLessThan(v.base * 2)
    }
    expect(blipFreq(v, 'か', true)).toBeGreaterThan(blipFreq(v, 'か'))
    expect(isQuestion('げんき？')).toBe(true)
    expect(isQuestion('げんき。')).toBe(false)
  })
})

describe('text-to-speech voices', () => {
  const kyoko: VoiceLike = { name: 'Kyoko', lang: 'ja-JP' }
  const otoya: VoiceLike = { name: 'Otoya', lang: 'ja-JP' }
  const ichiro: VoiceLike = { name: 'Microsoft Ichiro - Japanese (Japan)', lang: 'ja-JP' }
  const en: VoiceLike = { name: 'Samantha', lang: 'en-US' }

  it('picks the default Japanese voice like before', () => {
    expect(pickJaVoice([en])).toBeNull()
    expect(pickJaVoice([en, { name: 'Foo', lang: 'ja_JP' }])?.name).toBe('Foo')
    expect(pickJaVoice([en, { name: 'Foo', lang: 'ja-JP' }, kyoko])).toBe(kyoko)
  })
  it('prefers deeper or higher voices by character', () => {
    const all = [en, kyoko, otoya]
    expect(pickJaVoice(all, 'low')).toBe(otoya)
    expect(pickJaVoice(all, 'high')).toBe(kyoko)
    // Only one voice: everyone shares it.
    expect(pickJaVoice([kyoko], 'low')).toBe(kyoko)
    // Several of a kind: a speaker keeps the same one.
    const a = pickJaVoice([kyoko, otoya, ichiro], 'low', 'guard')
    expect(pickJaVoice([kyoko, otoya, ichiro], 'low', 'guard')).toBe(a)
    expect([otoya, ichiro]).toContain(a)
  })
  it('derives pitch and rate per speaker, keeping callers without one unchanged', () => {
    const none = ttsParams(undefined, [kyoko, otoya], 1)
    expect(none).toEqual({ voice: kyoko, pitch: 1, rate: 1 })
    const elder = ttsParams('elder', [kyoko, otoya], 1)
    expect(elder.voice).toBe(otoya)
    expect(elder.pitch).toBeLessThan(1)
    expect(elder.rate).toBeLessThan(1)
    // Without a matching deep voice, the pitch shift does all the work.
    expect(ttsParams('elder', [kyoko], 1).pitch).toBeLessThan(elder.pitch)
    const child = ttsParams('child', [kyoko], 0.9)
    expect(child.pitch).toBeGreaterThan(1)
    expect(child.rate).toBeCloseTo(0.9 * VOICES.child.tts.rate)
  })
})

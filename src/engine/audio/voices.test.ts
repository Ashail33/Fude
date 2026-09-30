import { describe, expect, it } from 'vitest'
import { CHARACTER_SPRITES, ENEMY_SPRITES } from '../../art'
import { SPEAKERS } from '../../story/scenes'
import {
  blipFreq,
  contourSemis,
  DEFAULT_VOICE,
  formantLevel,
  FORMANTS,
  formantsFor,
  isQuestion,
  isVoiced,
  nameGender,
  onsetFormants,
  pickJaVoice,
  shouldBlip,
  syllableOf,
  ttsParams,
  ttsSlot,
  voiceFor,
  voiceGender,
  voiceId,
  voiceKey,
  voicePool,
  VOICES,
  type VoiceLike,
} from './voices'

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
    expect(voiceKey('guard#Goro')).toBe('guard')
  })
  it('gives every character a distinct voice', () => {
    const sig = Object.values(VOICES).map((v) => `${v.src}:${v.base}:${v.formant}:${v.contour}:${v.tts.pitch}:${v.tts.rate}`)
    expect(new Set(sig).size).toBe(sig.length)
    // Same-gender characters never share both TTS pitch and rate.
    const tts = Object.values(VOICES).map((v) => `${v.tts.gender}:${v.tts.pitch}:${v.tts.rate}`)
    expect(new Set(tts).size).toBe(tts.length)
  })
  it('makes small bodies high and big bodies low', () => {
    const { fude, child, elder, oni, dragon, golem, bat, merchant, guard } = VOICES
    for (const big of [elder, oni, dragon, golem, guard]) {
      for (const small of [fude, child, bat]) {
        expect(big.base).toBeLessThan(small.base)
        expect(big.formant).toBeLessThan(small.formant)
        expect(big.tts.pitch).toBeLessThan(small.tts.pitch)
      }
    }
    // A chipmunk vs a giant: pitch more than 4 octaves apart, formants ×4.
    expect(bat.base / dragon.base).toBeGreaterThan(16)
    expect(bat.formant / dragon.formant).toBeGreaterThan(3.5)
    // Elders talk slow, kids and Fude fast.
    expect(elder.tts.rate).toBeLessThan(0.85)
    expect(child.tts.rate).toBeGreaterThan(1.2)
    expect(fude.tts.rate).toBeGreaterThan(1.15)
    expect(oni.tts.pitch).toBeLessThanOrEqual(0.45)
    expect(merchant.tts.gender).toBe('female')
    expect(guard.tts.gender).toBe('male')
  })
  it('keeps profiles sane', () => {
    for (const [id, v] of Object.entries(VOICES)) {
      expect(v.base, id).toBeGreaterThan(40)
      expect(v.base, id).toBeLessThan(1200)
      expect(v.formant, id).toBeGreaterThan(0.5)
      expect(v.formant, id).toBeLessThan(2.5)
      expect(v.len, id).toBeLessThan(0.2)
      expect(v.every, id).toBeGreaterThanOrEqual(1)
      expect(v.gain ?? 1, id).toBeLessThanOrEqual(1.5)
      expect(v.tts.pitch, id).toBeGreaterThanOrEqual(0.4)
      expect(v.tts.pitch, id).toBeLessThanOrEqual(1.9)
      expect(v.tts.rate, id).toBeGreaterThanOrEqual(0.75)
      expect(v.tts.rate, id).toBeLessThanOrEqual(1.3)
    }
  })
  it('gives generic villagers per-name variants, keeping named characters fixed', () => {
    expect(voiceId('villager-a', 'Farmer')).toBe('villager-a#Farmer')
    expect(voiceId(undefined, 'x')).toBeUndefined()
    const farmer = voiceFor('villager-a#Farmer')
    const smith = voiceFor('villager-a#Blacksmith')
    expect(farmer).not.toBe(VOICES['villager-a'])
    expect(voiceFor('villager-a#Farmer')).toBe(farmer)
    expect(`${farmer.base}:${farmer.contour}:${farmer.tts.pitch}`).not.toBe(`${smith.base}:${smith.contour}:${smith.tts.pitch}`)
    expect(voiceFor('guard#Goro')).toBe(VOICES.guard)
    // A woman's name on the "man" villager sprite gets a woman's voice.
    const hana = voiceFor('villager-a#Teacher Hana')
    expect(hana.tts.gender).toBe('female')
    expect(hana.base).toBeGreaterThan(VOICES['villager-a'].base * 1.4)
    expect(hana.formant).toBeGreaterThan(VOICES['villager-a'].formant)
    expect(nameGender('Castle Maid')).toBe('female')
    expect(nameGender('Old Rice Farmer')).toBe('male')
    expect(nameGender('Traveller')).toBeNull()
  })
})

describe('talk syllables', () => {
  it('skips spaces, punctuation and small kana', () => {
    for (const c of ['あ', 'カ', '火', 'A']) expect(isVoiced(c), c).toBe(true)
    for (const c of [' ', '　', '。', '、', '！', '？', '「', '…', 'ー', 'っ', 'ゃ', '!', ',']) expect(isVoiced(c), c).toBe(false)
  })
  it('sounds every n-th character per voice', () => {
    const text = [...'こんにちは、フデです']
    const n = (p: typeof DEFAULT_VOICE) => text.filter((c, i) => shouldBlip(p, c, i)).length
    expect(n(VOICES.child)).toBeGreaterThan(n(VOICES.elder))
  })
  it('maps kana to vowels and consonant onsets', () => {
    expect(syllableOf('あ')).toEqual({ v: 'a', onset: 'none', c: '' })
    expect(syllableOf('き')).toEqual({ v: 'i', onset: 'stop', c: 'k' })
    expect(syllableOf('ス')).toEqual({ v: 'u', onset: 'fric', c: 's' })
    expect(syllableOf('ね')).toEqual({ v: 'e', onset: 'nasal', c: 'n' })
    expect(syllableOf('よ')).toEqual({ v: 'o', onset: 'glide', c: 'y' })
    expect(syllableOf('ロ')).toEqual({ v: 'o', onset: 'glide', c: 'r' })
    expect(syllableOf('ぱ')).toEqual({ v: 'a', onset: 'stop', c: 'p' })
    expect(syllableOf('ん').v).toBe('n')
    expect(syllableOf('e').v).toBe('e')
    // Kanji: deterministic.
    expect(syllableOf('火')).toEqual(syllableOf('火'))
    const vowels = new Set([...'火水木金土日月山川田人口'].map((c) => syllableOf(c).v))
    expect(vowels.size).toBeGreaterThan(2)
  })
  it('has Japanese vowel formants that separate the vowels', () => {
    // i: low F1, high F2; a: high F1; o: low F2.
    expect(FORMANTS.i[0]).toBeLessThan(FORMANTS.a[0])
    expect(FORMANTS.i[1]).toBeGreaterThan(FORMANTS.e[1])
    expect(FORMANTS.e[1]).toBeGreaterThan(FORMANTS.a[1])
    expect(FORMANTS.o[1]).toBeLessThan(FORMANTS.u[1])
    for (const f of Object.values(FORMANTS)) expect(f[0] < f[1] && f[1] < f[2]).toBe(true)
  })
  it('shifts formants by body size', () => {
    const giant = formantsFor(VOICES.dragon, 'a')
    const tiny = formantsFor(VOICES.bat, 'a')
    for (let k = 0; k < 3; k++) expect(tiny[k]).toBeGreaterThan(giant[k] * 3)
    for (const v of Object.values(VOICES)) for (const f of formantsFor(v, 'i')) expect(f).toBeLessThanOrEqual(7600)
    expect(onsetFormants(VOICES.fude, syllableOf('や'))).toEqual(formantsFor(VOICES.fude, 'i'))
    expect(onsetFormants(VOICES.fude, syllableOf('か'))).toBeNull()
  })
  it('shapes pitch contours', () => {
    expect(contourSemis('flat')).toEqual([0, 0, 0])
    const [a, , c] = contourSemis('rise', 4)
    expect(c - a).toBe(4)
    const [x, y, z] = contourSemis('arch', 4)
    expect(y).toBeGreaterThan(x)
    expect(y).toBeGreaterThan(z)
  })
  it('estimates a finite, positive level for every voice and vowel (for loudness normalisation)', () => {
    for (const [id, p] of Object.entries(VOICES))
      for (const v of ['a', 'i', 'u', 'e', 'o', 'n'] as const) {
        const l = formantLevel(p, p.base, v)
        expect(l, `${id}/${v}`).toBeGreaterThan(0.004)
        expect(l, `${id}/${v}`).toBeLessThan(2)
      }
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
  const kyoko: VoiceLike = { name: 'Kyoko', lang: 'ja-JP', localService: true }
  const oren: VoiceLike = { name: 'O-ren', lang: 'ja-JP', localService: true }
  const otoya: VoiceLike = { name: 'Otoya', lang: 'ja-JP', localService: true }
  const hattori: VoiceLike = { name: 'Hattori', lang: 'ja-JP', localService: true }
  const grandpa: VoiceLike = { name: 'Grandpa (Japanese (Japan))', lang: 'ja-JP', localService: true }
  const ichiro: VoiceLike = { name: 'Microsoft Ichiro - Japanese (Japan)', lang: 'ja-JP', localService: true }
  const keitaOnline: VoiceLike = { name: 'Microsoft Keita Online (Natural) - Japanese (Japan)', lang: 'ja-JP', localService: false }
  const google: VoiceLike = { name: 'Google 日本語', lang: 'ja-JP', localService: false }
  const en: VoiceLike = { name: 'Samantha', lang: 'en-US' }

  it('knows the gender of Japanese voices across platforms', () => {
    for (const n of ['Otoya', 'Hattori', 'Microsoft Ichiro - Japanese (Japan)', 'Microsoft Keita Online (Natural)', 'Microsoft Daichi', 'Microsoft Naoki', 'ja-jp-x-jac-local', 'Grandpa'])
      expect(voiceGender({ name: n, lang: 'ja-JP' }), n).toBe('male')
    for (const n of ['Kyoko', 'O-ren', 'Microsoft Sayaka', 'Microsoft Haruka Desktop', 'Microsoft Ayumi', 'Microsoft Nanami Online (Natural)', 'Mizuki', 'Google 日本語', 'Grandma'])
      expect(voiceGender({ name: n, lang: 'ja-JP' }), n).toBe('female')
    expect(voiceGender({ name: 'Foo', lang: 'ja-JP' })).toBeNull()
  })
  it('picks the default Japanese voice like before', () => {
    expect(pickJaVoice([en])).toBeNull()
    expect(pickJaVoice([en, { name: 'Foo', lang: 'ja_JP' }])?.name).toBe('Foo')
    expect(pickJaVoice([en, { name: 'Foo', lang: 'ja-JP' }, kyoko])).toBe(kyoko)
  })
  it('picks by gender, preferring local voices and keeping elderly voices for elders', () => {
    const all = [en, google, kyoko, otoya, keitaOnline, grandpa]
    expect(voicePool(all, 'male')).toEqual([otoya])
    expect(voicePool(all, 'male', 'elder')).toEqual([grandpa])
    expect(voicePool(all, 'female')).toEqual([kyoko])
    // No local voice of that gender: use the remote one.
    expect(voicePool([google, otoya], 'female')).toEqual([google])
    expect(pickJaVoice(all, 'male', 0)).toBe(otoya)
    expect(pickJaVoice(all, 'female', 3)).toBe(kyoko)
    // Only one voice: everyone shares it.
    expect(pickJaVoice([kyoko], 'male')).toBe(kyoko)
    // Stable per key.
    expect(pickJaVoice([otoya, ichiro, hattori], 'male', 'guard')).toBe(pickJaVoice([hattori, ichiro, otoya], 'male', 'guard'))
  })
  it('spreads characters of the same gender across the available voices', () => {
    const voices = [kyoko, oren, otoya, hattori, ichiro]
    const males = Object.entries(VOICES).filter(([, v]) => v.tts.gender === 'male').map(([k]) => k)
    const females = Object.entries(VOICES).filter(([, v]) => v.tts.gender === 'female').map(([k]) => k)
    const used = (ids: string[]) => new Set(ids.map((k) => ttsParams(k, voices, 1).voice?.name))
    expect(used(males)).toEqual(new Set(['Otoya', 'Hattori', 'Microsoft Ichiro - Japanese (Japan)']))
    expect(used(females)).toEqual(new Set(['Kyoko', 'O-ren']))
    // The first three men all differ.
    const [a, b, c] = males.slice(0, 3).map((k) => ttsParams(k, voices, 1).voice)
    expect(new Set([a, b, c]).size).toBe(3)
    expect(ttsSlot('elder')).toBe(0)
    expect(ttsSlot('guard')).toBe(1)
    // Deterministic.
    expect(ttsParams('king', voices, 1)).toEqual(ttsParams('king', voices, 1))
  })
  it('derives pitch and rate per speaker, keeping callers without one unchanged', () => {
    const none = ttsParams(undefined, [kyoko, otoya], 1)
    expect(none).toEqual({ voice: kyoko, pitch: 1, rate: 1 })
    const elder = ttsParams('elder', [kyoko, otoya], 1)
    expect(elder.voice).toBe(otoya)
    expect(elder.pitch).toBeCloseTo(VOICES.elder.tts.pitch)
    expect(elder.rate).toBeLessThan(0.85)
    // Only a woman's voice for a man: pitched further down.
    expect(ttsParams('elder', [kyoko], 1).pitch).toBeLessThan(elder.pitch)
    // Only a man's voice for a girl: pitched further up (clamped to 2).
    expect(ttsParams('merchant', [otoya], 1).pitch).toBeGreaterThan(VOICES.merchant.tts.pitch)
    expect(ttsParams('child', [otoya], 1).pitch).toBeLessThanOrEqual(2)
    // The learner's speech-rate setting stays a multiplier.
    const child = ttsParams('child', [kyoko], 0.9)
    expect(child.rate).toBeCloseTo(0.9 * VOICES.child.tts.rate)
    expect(ttsParams('oni', [kyoko, otoya], 1).pitch).toBeLessThan(ttsParams('fude', [kyoko, otoya], 1).pitch / 3)
  })
})

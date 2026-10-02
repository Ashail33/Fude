/**
 * Character voices (pure data + logic; no WebAudio).
 *
 * Every speaker gets:
 * - a "talk" voice in the style of Animal Crossing's animalese: each typed
 *   kana becomes a short formant-synthesised syllable (its vowel's formants
 *   shifted by the speaker's body size, on their own pitch, contour,
 *   breathiness, vibrato and grit — see ./talk.ts), so a chipmunk and a
 *   giant sound nothing alike;
 * - text-to-speech settings: which kind of system voice (male / female,
 *   spread across the installed voices so two men still differ), pitch and
 *   rate;
 * - an optional signature cry (meow, bark, roar… in engine/voice.ts).
 *
 * Keys are sprite ids (src/art) and story speaker ids (src/story/scenes
 * SPEAKERS). A voice id may carry a variant after `#` (e.g.
 * `villager-a#Teacher Hana`): generic villagers then get their own slight
 * twist on the shared voice, and a name that is clearly male/female picks
 * that register.
 */

/** Glottal source of the talk voice. */
export type VoiceSource =
  /** Sawtooth: buzzy, full, adult. */
  | 'saw'
  /** 25 % pulse: reedy. */
  | 'pulse'
  /** 12.5 % pulse: thin and nasal. */
  | 'nasal'
  /** Triangle: soft, gentle. */
  | 'soft'
  /** Sine: pure, flute-like (slimes, spirits). */
  | 'pure'
  /** Noise only: a whisper (ghosts). */
  | 'whisper'

/** Pitch movement within each syllable. */
export type Contour = 'flat' | 'rise' | 'fall' | 'arch' | 'dip' | 'wobble'

/** Signature sounds (synthesised in engine/voice.ts). */
export type CryId =
  | 'chime'
  | 'staff'
  | 'elder'
  | 'armor'
  | 'coins'
  | 'suzu'
  | 'fanfare'
  | 'hum'
  | 'keys'
  | 'greet'
  | 'giggle'
  | 'meow'
  | 'bark'
  | 'kon'
  | 'slime'
  | 'imp'
  | 'screech'
  | 'puff'
  | 'croak'
  | 'pon'
  | 'rumble'
  | 'wisp'
  | 'creak'
  | 'tengu'
  | 'roar'
  | 'rattle'
  | 'growl'

export type Gender = 'male' | 'female'
export type Age = 'child' | 'young' | 'adult' | 'elder'

export interface TtsVoice {
  /** Kind of system voice to use ('any' = the usual default voice). */
  gender: Gender | 'any'
  age?: Age
  /** SpeechSynthesis pitch (0..2, 1 = normal). */
  pitch: number
  /** Multiplier on the player's speech-rate setting. */
  rate: number
}

export interface VoiceProfile {
  src: VoiceSource
  /** Centre pitch (f0, Hz) of the syllables. */
  base: number
  /** Semitone offsets the syllables are drawn from (default: yo pentatonic). */
  scale?: number[]
  /** Formant shift: 1 = adult man, ~1.2 woman, ~1.6 child, <0.7 giant. */
  formant: number
  contour: Contour
  /** Contour depth (semitones, default 3). */
  bend?: number
  /** Syllable length (seconds, vowel part). */
  len: number
  /** A syllable on every n-th voiced character. */
  every: number
  /** Breath noise mixed into the voice (0..1). */
  breath?: number
  /** Vibrato depth (cents) and rate (Hz). */
  vib?: number
  vibRate?: number
  /** Growl / distortion (0..1). */
  grit?: number
  /** Loudness trim (1 = normal). */
  gain?: number
  tts: TtsVoice
  cry?: CryId
  /** Cry pitch multiplier (variants such as the ice slime). */
  cryPitch?: number
  /** Shared by many different people (villagers): variants get their own twist. */
  generic?: boolean
}

const IN = [0, 1, 5, 7, 8]
const NARROW = [0, 2, 4]

/** The narrator / unknown speaker: a neutral, quiet, soft voice. */
export const DEFAULT_VOICE: VoiceProfile = { src: 'soft', base: 210, scale: [0, 2], formant: 1.1, contour: 'flat', len: 0.04, every: 2, gain: 0.55, tts: { gender: 'any', pitch: 1, rate: 1 } }

// Men are listed before the rest of their gender in rough order of
// importance: when there are fewer system voices than characters, the
// first ones of each gender get distinct voices (see `ttsSlot`).
export const VOICES: Record<string, VoiceProfile> = {
  // ─── Heroes
  fude: { src: 'soft', base: 640, formant: 1.6, contour: 'rise', bend: 4, len: 0.05, every: 2, vib: 45, vibRate: 7.5, breath: 0.08, tts: { gender: 'female', age: 'child', pitch: 1.75, rate: 1.22 }, cry: 'chime' },
  mage: { src: 'saw', base: 240, formant: 1.12, contour: 'arch', bend: 2, len: 0.055, every: 2, breath: 0.08, tts: { gender: 'any', age: 'young', pitch: 1.08, rate: 1 }, cry: 'staff' },
  // ─── Villagers
  elder: { src: 'saw', base: 112, scale: NARROW, formant: 0.92, contour: 'fall', bend: 2, len: 0.1, every: 3, vib: 70, vibRate: 5, breath: 0.35, grit: 0.12, tts: { gender: 'male', age: 'elder', pitch: 0.55, rate: 0.78 }, cry: 'elder' },
  guard: { src: 'pulse', base: 98, scale: [0, 2, 5], formant: 0.84, contour: 'fall', bend: 4, len: 0.065, every: 2, breath: 0.05, grit: 0.3, tts: { gender: 'male', age: 'adult', pitch: 0.72, rate: 0.95 }, cry: 'armor' },
  merchant: { src: 'pulse', base: 300, formant: 1.3, contour: 'arch', bend: 5, len: 0.045, every: 1, vib: 18, vibRate: 6, breath: 0.08, tts: { gender: 'female', age: 'young', pitch: 1.35, rate: 1.2 }, cry: 'coins' },
  priest: { src: 'soft', base: 145, scale: IN, formant: 1, contour: 'flat', len: 0.09, every: 3, vib: 22, vibRate: 4.5, breath: 0.25, tts: { gender: 'male', age: 'adult', pitch: 0.85, rate: 0.82 }, cry: 'suzu' },
  king: { src: 'saw', base: 92, scale: [0, 4, 7], formant: 0.8, contour: 'arch', bend: 3, len: 0.09, every: 3, vib: 25, vibRate: 5, grit: 0.15, tts: { gender: 'male', age: 'adult', pitch: 0.62, rate: 0.85 }, cry: 'fanfare' },
  innkeeper: { src: 'soft', base: 225, formant: 1.18, contour: 'dip', bend: 3, len: 0.065, every: 2, breath: 0.15, tts: { gender: 'female', age: 'adult', pitch: 1, rate: 0.92 }, cry: 'hum' },
  jailer: { src: 'nasal', base: 128, scale: [0, 1, 3], formant: 0.95, contour: 'fall', bend: 5, len: 0.055, every: 2, grit: 0.35, tts: { gender: 'male', age: 'adult', pitch: 0.68, rate: 1.12 }, cry: 'keys' },
  'villager-a': { src: 'saw', base: 138, formant: 1, contour: 'fall', bend: 2, len: 0.06, every: 2, breath: 0.1, generic: true, tts: { gender: 'male', age: 'adult', pitch: 0.9, rate: 1 }, cry: 'greet' },
  'villager-b': { src: 'soft', base: 255, formant: 1.25, contour: 'rise', bend: 3, len: 0.055, every: 2, breath: 0.1, generic: true, tts: { gender: 'female', age: 'young', pitch: 1.2, rate: 1.05 }, cry: 'greet' },
  child: { src: 'pulse', base: 430, formant: 1.7, contour: 'rise', bend: 5, len: 0.04, every: 1, breath: 0.05, tts: { gender: 'female', age: 'child', pitch: 1.9, rate: 1.28 }, cry: 'giggle' },
  // ─── Animals
  cat: { src: 'saw', base: 520, scale: [0, 3, 5], formant: 1.8, contour: 'arch', bend: 6, len: 0.07, every: 2, vib: 30, vibRate: 6, tts: { gender: 'female', age: 'young', pitch: 1.85, rate: 1.1 }, cry: 'meow' },
  dog: { src: 'pulse', base: 290, scale: [0, 5, 7], formant: 1.2, contour: 'fall', bend: 6, len: 0.045, every: 2, grit: 0.2, tts: { gender: 'male', age: 'young', pitch: 1.3, rate: 1.25 }, cry: 'bark' },
  fox: { src: 'soft', base: 470, scale: IN, formant: 1.6, contour: 'rise', bend: 4, len: 0.05, every: 2, breath: 0.1, tts: { gender: 'female', age: 'young', pitch: 1.55, rate: 1.05 }, cry: 'kon' },
  // ─── Monsters / bosses
  slime: { src: 'pure', base: 200, scale: NARROW, formant: 1.3, contour: 'rise', bend: 7, len: 0.08, every: 2, tts: { gender: 'female', age: 'child', pitch: 1.6, rate: 0.9 }, cry: 'slime' },
  'ice-slime': { src: 'pure', base: 300, scale: NARROW, formant: 1.5, contour: 'rise', bend: 7, len: 0.08, every: 2, vib: 55, vibRate: 12, tts: { gender: 'female', age: 'child', pitch: 1.7, rate: 0.85 }, cry: 'slime', cryPitch: 1.35 },
  imp: { src: 'nasal', base: 560, scale: IN, formant: 1.9, contour: 'rise', bend: 4, len: 0.035, every: 1, grit: 0.2, tts: { gender: 'male', age: 'child', pitch: 1.8, rate: 1.3 }, cry: 'imp' },
  bat: { src: 'saw', base: 880, scale: [0, 1], formant: 2.2, contour: 'rise', bend: 5, len: 0.03, every: 2, breath: 0.3, tts: { gender: 'female', age: 'child', pitch: 1.9, rate: 1.3 }, cry: 'screech' },
  mushroom: { src: 'soft', base: 235, scale: NARROW, formant: 1.35, contour: 'fall', bend: 3, len: 0.06, every: 2, breath: 0.4, tts: { gender: 'male', age: 'child', pitch: 1.35, rate: 0.85 }, cry: 'puff' },
  kappa: { src: 'pulse', base: 185, scale: [0, 3, 5], formant: 1.1, contour: 'dip', bend: 4, len: 0.06, every: 2, grit: 0.45, tts: { gender: 'male', age: 'young', pitch: 1.15, rate: 1.1 }, cry: 'croak' },
  tanuki: { src: 'soft', base: 165, formant: 1.05, contour: 'arch', bend: 3, len: 0.065, every: 2, breath: 0.1, tts: { gender: 'male', age: 'adult', pitch: 0.95, rate: 1.05 }, cry: 'pon' },
  golem: { src: 'saw', base: 62, scale: NARROW, formant: 0.62, contour: 'flat', len: 0.12, every: 3, breath: 0.2, grit: 0.6, tts: { gender: 'male', age: 'adult', pitch: 0.5, rate: 0.8 }, cry: 'rumble' },
  wisp: { src: 'whisper', base: 330, formant: 1.25, contour: 'arch', bend: 4, len: 0.1, every: 2, vib: 30, vibRate: 4, tts: { gender: 'female', age: 'adult', pitch: 0.8, rate: 0.78 }, cry: 'wisp' },
  kitsune: { src: 'soft', base: 380, scale: IN, formant: 1.35, contour: 'arch', bend: 4, len: 0.06, every: 2, vib: 20, vibRate: 5.5, tts: { gender: 'female', age: 'adult', pitch: 1.2, rate: 0.9 }, cry: 'kon', cryPitch: 0.85 },
  harpy: { src: 'saw', base: 690, scale: [0, 1, 5], formant: 1.9, contour: 'rise', bend: 5, len: 0.04, every: 2, breath: 0.2, grit: 0.15, tts: { gender: 'female', age: 'young', pitch: 1.6, rate: 1.2 }, cry: 'screech', cryPitch: 0.8 },
  treant: { src: 'saw', base: 70, scale: NARROW, formant: 0.66, contour: 'dip', bend: 3, len: 0.13, every: 3, vib: 30, vibRate: 3, breath: 0.3, grit: 0.3, tts: { gender: 'male', age: 'elder', pitch: 0.55, rate: 0.76 }, cry: 'creak' },
  tengu: { src: 'pulse', base: 175, scale: IN, formant: 1, contour: 'fall', bend: 4, len: 0.05, every: 2, breath: 0.35, tts: { gender: 'male', age: 'adult', pitch: 0.8, rate: 1.15 }, cry: 'tengu' },
  oni: { src: 'saw', base: 78, scale: [0, 1, 5], formant: 0.7, contour: 'fall', bend: 5, len: 0.09, every: 2, breath: 0.1, grit: 0.7, tts: { gender: 'male', age: 'adult', pitch: 0.42, rate: 0.9 }, cry: 'roar' },
  skeleton: { src: 'nasal', base: 320, scale: [0, 1, 6], formant: 1.15, contour: 'flat', len: 0.03, every: 1, grit: 0.1, tts: { gender: 'male', age: 'adult', pitch: 1.2, rate: 1.3 }, cry: 'rattle' },
  dragon: { src: 'saw', base: 50, scale: [0, 1, 6], formant: 0.55, contour: 'fall', bend: 3, len: 0.14, every: 3, vib: 25, vibRate: 4, breath: 0.35, grit: 0.8, tts: { gender: 'male', age: 'elder', pitch: 0.4, rate: 0.75 }, cry: 'growl' },
}

/** Story speaker ids (and a few aliases) → sprite ids. */
const ALIASES: Record<string, string> = {
  you: 'mage',
  player: 'mage',
  farmer: 'villager-a',
  guardian: 'treant',
  librarian: 'wisp',
  chimera: 'kitsune',
  scribe: 'merchant',
  kotone: 'merchant',
  shadow: 'wisp',
  // Boss illustration / game ids.
  'kana-oni': 'oni',
  'radical-golem': 'golem',
  'particle-guardian': 'treant',
  'silent-librarian': 'wisp',
  'shifting-chimera': 'kitsune',
  'void-dragon': 'dragon',
}

/** Split a voice id into its sprite / speaker part and optional `#variant`. */
function splitId(id: string): [string, string] {
  const h = id.indexOf('#')
  return h < 0 ? [id.trim().toLowerCase(), ''] : [id.slice(0, h).trim().toLowerCase(), id.slice(h + 1).trim()]
}

/** Resolve a sprite / speaker id (optionally `id#variant`) to its canonical voice key (or null). */
export function voiceKey(id: string | null | undefined): string | null {
  if (!id) return null
  const [k] = splitId(id)
  if (k in VOICES) return k
  if (k in ALIASES) return ALIASES[k]
  return null
}

/** Voice id for a portrait plus the speaker's (English) name, e.g. `villager-a#Teacher Hana`. */
export function voiceId(sprite: string | null | undefined, name?: string | null): string | undefined {
  if (!sprite) return undefined
  return name ? `${sprite}#${name}` : sprite
}

/** Small stable hash (so each character keeps "their" voice among equals). */
export function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const FEMALE_NAME = /\b(hana|mina|haru|maid|maiden|miko|woman|girl|lady|grandma|granny|mother|mom|sister|aunt|queen|princess|nun)\b|おばあ|おんな|むすめ|みこ|めしつかい/i
const MALE_NAME = /\b(old man|grandpa|man|boy|farmer|blacksmith|smith|woodcutter|monk|father|dad|brother|uncle|king|prince|lord)\b|おじい|おとこ|かじや|きこり/i

/** Gender a speaker's name clearly implies, if any. */
export function nameGender(name: string): Gender | null {
  if (FEMALE_NAME.test(name)) return 'female'
  if (MALE_NAME.test(name)) return 'male'
  return null
}

const variants = new Map<string, VoiceProfile>()

/** A generic voice's twist for one named person (pitch, formants, TTS pitch; register from the name). */
function variantOf(p: VoiceProfile, key: string, name: string): VoiceProfile {
  const id = `${key}#${name.toLowerCase()}`
  let v = variants.get(id)
  if (v) return v
  const h = hash(name.toLowerCase())
  const step = (shift: number) => ((h >>> shift) % 5) - 2
  const g = nameGender(name)
  const own = p.tts.gender
  // Cross-register: a woman using a "man's" sprite and vice versa.
  const flip = g && own !== 'any' && g !== own ? (g === 'female' ? 1 : -1) : 0
  v = {
    ...p,
    base: Math.round(p.base * Math.pow(2, (step(0) * 1.2 + flip * 10) / 12)),
    formant: +(p.formant * (1 + step(3) * 0.04) * (flip ? Math.pow(1.22, flip) : 1)).toFixed(3),
    contour: (['fall', 'rise', 'arch', 'dip', 'flat'] as const)[(h >>> 6) % 5],
    tts: {
      ...p.tts,
      gender: g ?? p.tts.gender,
      pitch: +(p.tts.pitch * (1 + step(9) * 0.06) * (flip ? Math.pow(1.3, flip) : 1)).toFixed(3),
      rate: +(p.tts.rate * (1 + step(12) * 0.04)).toFixed(3),
    },
  }
  variants.set(id, v)
  return v
}

/** The voice for a sprite / speaker id; the neutral narrator voice for anything else. */
export function voiceFor(id: string | null | undefined): VoiceProfile {
  const k = voiceKey(id)
  if (!k) return DEFAULT_VOICE
  const p = VOICES[k]
  const variant = id ? splitId(id)[1] : ''
  return p.generic && variant ? variantOf(p, k, variant) : p
}

// ─── Syllables and formants ──────────────────────────────────────────

export type Vowel = 'a' | 'i' | 'u' | 'e' | 'o' | 'n'
/** How a syllable starts: plosive burst, hiss, nasal hum, glide or bare vowel. */
export type Onset = 'none' | 'stop' | 'fric' | 'nasal' | 'glide'

export interface Syllable {
  v: Vowel
  onset: Onset
  /** Consonant (romaji-ish): '', k, g, s, z, t, d, n, h, b, p, m, y, r, w, f, v. */
  c: string
}

/**
 * Formants (F1, F2, F3 in Hz) of the Japanese vowels for an adult male
 * voice; `ん` is a nasal hum. Scaled per character by `formant`.
 */
export const FORMANTS: Record<Vowel, readonly [number, number, number]> = {
  a: [800, 1250, 2600],
  i: [300, 2250, 3000],
  u: [360, 1350, 2350],
  e: [500, 1850, 2600],
  o: [520, 880, 2500],
  n: [260, 1050, 2300],
}

/** Relative level of F1..F3 in the filter bank. */
export const FORMANT_AMP = [1, 0.85, 0.5] as const
/** Formant bandwidths (Hz) for an adult man (scaled like the formants). */
export const FORMANT_BW = [90, 120, 170] as const

const VOWELS: Vowel[] = ['a', 'i', 'u', 'e', 'o']

// Gojūon rows: consonant, onset, kana for a/i/u/e/o ('.' = none).
const ROWS: [string, Onset, string][] = [
  ['', 'none', 'あいうえお'],
  ['', 'none', 'ぁぃぅぇぉ'],
  ['k', 'stop', 'かきくけこ'],
  ['g', 'stop', 'がぎぐげご'],
  ['s', 'fric', 'さしすせそ'],
  ['z', 'fric', 'ざじずぜぞ'],
  ['t', 'stop', 'たちつてと'],
  ['d', 'stop', 'だぢづでど'],
  ['n', 'nasal', 'なにぬねの'],
  ['h', 'fric', 'はひふへほ'],
  ['b', 'stop', 'ばびぶべぼ'],
  ['p', 'stop', 'ぱぴぷぺぽ'],
  ['m', 'nasal', 'まみむめも'],
  ['y', 'glide', 'や.ゆ.よ'],
  ['y', 'glide', 'ゃ.ゅ.ょ'],
  ['r', 'glide', 'らりるれろ'],
  ['w', 'glide', 'わゐ.ゑを'],
  ['w', 'glide', 'ゎ....'],
  ['v', 'fric', '..ゔ..'],
  ['t', 'stop', '..っ..'],
]

const KANA = new Map<string, Syllable>()
for (const [c, onset, row] of ROWS)
  [...row].forEach((k, i) => {
    if (k !== '.') KANA.set(k, { v: VOWELS[i], onset, c })
  })
KANA.set('ん', { v: 'n', onset: 'none', c: '' })

const LATIN_ONSET: Record<string, Onset> = { k: 'stop', g: 'stop', t: 'stop', d: 'stop', p: 'stop', b: 'stop', q: 'stop', c: 'stop', s: 'fric', z: 'fric', h: 'fric', f: 'fric', v: 'fric', j: 'fric', x: 'fric', n: 'nasal', m: 'nasal', y: 'glide', r: 'glide', l: 'glide', w: 'glide' }
const ONSETS: Onset[] = ['none', 'stop', 'fric', 'nasal', 'glide', 'stop']
const ONSET_C: Record<Onset, string> = { none: '', stop: 'k', fric: 's', nasal: 'n', glide: 'r' }

/**
 * The syllable (vowel + consonant onset) a typed character sounds like:
 * kana by the gojūon table, Latin letters by their own sound, anything else
 * (kanji, digits…) deterministically from its code point.
 */
export function syllableOf(ch: string): Syllable {
  const code = ch.codePointAt(0) ?? 0
  // Katakana → hiragana.
  const hira = code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : ch
  const kana = KANA.get(hira)
  if (kana) return kana
  const low = ch.toLowerCase()
  if ('aiueo'.includes(low) && low.length === 1) return { v: low as Vowel, onset: 'none', c: '' }
  if (low in LATIN_ONSET) return { v: VOWELS[(code * 3 + 1) % 5], onset: LATIN_ONSET[low], c: low }
  const h = hash(ch)
  const onset = ONSETS[(h >>> 4) % ONSETS.length]
  return { v: VOWELS[h % 5], onset, c: ONSET_C[onset] }
}

const clampF = (f: number) => Math.min(7600, Math.max(90, f))

/** The formants (Hz) of a vowel in this voice. */
export function formantsFor(p: VoiceProfile, v: Vowel): [number, number, number] {
  const [a, b, c] = FORMANTS[v]
  return [clampF(a * p.formant), clampF(b * p.formant), clampF(c * p.formant)]
}

/** Formants a syllable's onset starts from (glides and nasals move into the vowel); null = none. */
export function onsetFormants(p: VoiceProfile, s: Syllable): [number, number, number] | null {
  if (s.onset === 'nasal') return formantsFor(p, 'n')
  if (s.onset !== 'glide') return null
  return formantsFor(p, s.c === 'y' ? 'i' : s.c === 'w' ? 'u' : 'e')
}

/** Pitch at the start, middle and end of a syllable (semitones from its note). */
export function contourSemis(c: Contour, bend = 3): [number, number, number] {
  const h = bend / 2
  switch (c) {
    case 'rise':
      return [-h, 0, h]
    case 'fall':
      return [h, 0, -h]
    case 'arch':
      return [-h, h, -h]
    case 'dip':
      return [h, -h, h]
    case 'wobble':
      return [0, h, -h]
    default:
      return [0, 0, 0]
  }
}

/** Characters that make a sound when typed (not spaces, punctuation or small kana/long marks). */
export function isVoiced(ch: string): boolean {
  if (!ch || !ch.trim()) return false
  return !/[\p{P}\p{S}ー〜ゃゅょっャュョッぁぃぅぇぉァィゥェォ…・]/u.test(ch)
}

/** Should the `i`-th character (of `text`) sound for this voice? */
export function shouldBlip(p: VoiceProfile, ch: string, i: number): boolean {
  return isVoiced(ch) && i % Math.max(1, p.every) === 0
}

const YO = [0, 2, 5, 7, 9]

/**
 * Syllable pitch (Hz) for one character: picked from the voice's scale by
 * the character code, so a given word always "sounds" the same; lines
 * ending in a question lift at the end.
 */
export function blipFreq(p: VoiceProfile, ch: string, question = false): number {
  const scale = p.scale ?? YO
  const code = ch.codePointAt(0) ?? 0
  const step = scale[(code * 7 + (code >> 3)) % scale.length]
  const centre = scale[Math.floor(scale.length / 2)]
  const semis = step - centre + (question ? 3 : 0)
  return p.base * Math.pow(2, semis / 12)
}

/** Does this line end as a question (for the rising syllables)? */
export function isQuestion(text: string): boolean {
  return /[?？]\s*$/.test(text)
}

// ─── Loudness ────────────────────────────────────────────────────────

/** Number of harmonics in the talk voices' source waveforms. */
export const SOURCE_HARMONICS = 96

const series = new Map<VoiceSource, Float32Array>()

/**
 * Harmonic amplitudes (index = harmonic number, sine phase) of a talk
 * voice's source waveform, scaled to a unit peak. Shared by the synth
 * (as a PeriodicWave) and the loudness estimate below. The soft and pure
 * sources keep a little of the upper harmonics so their vowels still
 * differ (a bare triangle or sine would hum every vowel the same).
 */
export function sourceSeries(src: VoiceSource): Float32Array {
  let a = series.get(src)
  if (a) return a
  a = new Float32Array(SOURCE_HARMONICS + 1)
  for (let h = 1; h <= SOURCE_HARMONICS; h++) {
    switch (src) {
      case 'saw':
        a[h] = 1 / h
        break
      case 'pulse':
        a[h] = Math.abs(Math.sin(Math.PI * h * 0.25)) / h
        break
      case 'nasal':
        a[h] = Math.abs(Math.sin(Math.PI * h * 0.125)) / h
        break
      case 'soft':
        a[h] = 1 / Math.pow(h, 1.5)
        break
      case 'pure':
        a[h] = 1 / Math.pow(h, 2.3)
        break
      default:
        a[h] = 0
    }
  }
  // Scale to a unit peak (as the browser would normalise the waveform).
  let peak = 0
  for (let i = 0; i < 1024; i++) {
    let v = 0
    for (let h = 1; h <= SOURCE_HARMONICS; h++) if (a[h]) v += a[h] * Math.sin((2 * Math.PI * h * i) / 1024)
    peak = Math.max(peak, Math.abs(v))
  }
  if (peak > 0) for (let h = 1; h <= SOURCE_HARMONICS; h++) a[h] /= peak
  series.set(src, a)
  return a
}

/** Magnitude of a (0 dB peak) band-pass at `f`. */
function bandpass(f: number, centre: number, q: number): number {
  const x = f / centre - centre / f
  return 1 / Math.sqrt(1 + q * q * x * x)
}

/** Bandwidths of this voice's formant filters at pitch f0 (wider for high voices so sparse harmonics still ring). */
export function formantBandwidths(p: VoiceProfile, f0: number): [number, number, number] {
  const bw = (k: number) => Math.max(FORMANT_BW[k] * p.formant, f0 * 0.75)
  return [bw(0), bw(1), bw(2)]
}

/** Level of the raw source that is also mixed in (low-passed) for body. */
export const BODY_MIX = 0.12

/**
 * Estimated RMS level of the formant filter bank for a voice, pitch and
 * vowel (from the source's harmonic series), so every character can be
 * normalised to the same loudness however its pitch and formants line up.
 */
export function formantLevel(p: VoiceProfile, f0: number, v: Vowel, nyquist = 22050): number {
  if (p.src === 'whisper') return 0.1
  const fs = formantsFor(p, v)
  const bws = formantBandwidths(p, f0)
  const src = sourceSeries(p.src)
  let power = 0
  for (let h = 1; h <= SOURCE_HARMONICS && h * f0 < Math.min(nyquist, 9000); h++) {
    const a = src[h]
    if (!a) continue
    const f = h * f0
    let g = 0
    for (let k = 0; k < 3; k++) g += FORMANT_AMP[k] * bandpass(f, fs[k], fs[k] / bws[k])
    // Body: 2nd-order low-pass at F2.
    g += BODY_MIX / Math.sqrt(1 + Math.pow(f / fs[1], 4))
    power += (a * g) ** 2 / 2
  }
  return Math.sqrt(power)
}

// ─── Text-to-speech ──────────────────────────────────────────────────

/** Minimal shape of a SpeechSynthesisVoice (so this stays testable). */
export interface VoiceLike {
  name: string
  lang: string
  default?: boolean
  localService?: boolean
}

interface KnownVoice {
  re: RegExp
  gender: Gender
  age?: Age
}

/**
 * Japanese system voices across platforms, best first within each gender
 * (their order decides who gets which voice when there are few).
 */
export const KNOWN_JA_VOICES: KnownVoice[] = [
  // Apple (macOS / iOS)
  { re: /\bkyoko\b/i, gender: 'female' },
  { re: /\botoya\b/i, gender: 'male' },
  { re: /\bo-?ren\b/i, gender: 'female' },
  { re: /\bhattori\b/i, gender: 'male' },
  // Microsoft (Windows / Edge natural voices)
  { re: /\bnanami\b/i, gender: 'female' },
  { re: /\bkeita\b/i, gender: 'male' },
  { re: /\bharuka\b/i, gender: 'female' },
  { re: /\bichiro\b/i, gender: 'male' },
  { re: /\bayumi\b/i, gender: 'female' },
  { re: /\bdaichi\b/i, gender: 'male' },
  { re: /\bsayaka\b/i, gender: 'female' },
  { re: /\bnaoki\b/i, gender: 'male' },
  { re: /\b(aoi|mayu|shiori)\b/i, gender: 'female' },
  { re: /\b(masaru|takumi|kenji)\b/i, gender: 'male' },
  { re: /\bmizuki\b/i, gender: 'female' },
  // Google / Android (Google 日本語 is a woman's voice)
  { re: /google/i, gender: 'female' },
  { re: /ja-jp-x-(jac|jad)/i, gender: 'male' },
  { re: /ja-jp-x-(jab|htm)/i, gender: 'female' },
  // Apple's character voices (also shipped for Japanese)
  { re: /\bgrandpa\b/i, gender: 'male', age: 'elder' },
  { re: /\bgrandma\b/i, gender: 'female', age: 'elder' },
  { re: /\b(eddy|reed|rocko)\b/i, gender: 'male' },
  { re: /\b(flo|sandy|shelley)\b/i, gender: 'female' },
  // Anything that says so
  { re: /女|female|woman/i, gender: 'female' },
  { re: /男|\bmale\b|\bman\b/i, gender: 'male' },
]

function known(v: VoiceLike): [KnownVoice, number] | null {
  const i = KNOWN_JA_VOICES.findIndex((k) => k.re.test(v.name))
  return i < 0 ? null : [KNOWN_JA_VOICES[i], i]
}

export function voiceGender(v: VoiceLike): Gender | null {
  return known(v)?.[0].gender ?? null
}

function voiceAge(v: VoiceLike): Age | null {
  return known(v)?.[0].age ?? null
}

function isJa(v: VoiceLike) {
  return v.lang.replace('_', '-').toLowerCase().startsWith('ja')
}

const PREFERRED = /google|kyoko|otoya|haruka|nanami/i

/** The usual default Japanese voice (as before per-character voices). */
function defaultJa<V extends VoiceLike>(ja: readonly V[]): V {
  return ja.find((v) => v.lang.replace('_', '-') === 'ja-JP' && PREFERRED.test(v.name)) ?? ja[0]
}

/**
 * The Japanese voices of one gender a character can use, best first: local
 * voices (whose pitch browsers honour) when there are any, elderly voices
 * only for elders when others exist.
 */
export function voicePool<V extends VoiceLike>(voices: readonly V[], gender: Gender, age?: Age): V[] {
  const matches = voices.filter((v) => isJa(v) && voiceGender(v) === gender)
  const local = matches.filter((v) => v.localService !== false)
  let pool = local.length ? local : matches
  const elders = pool.filter((v) => voiceAge(v) === 'elder')
  if (age === 'elder' && elders.length) pool = elders
  else if (elders.length < pool.length) pool = pool.filter((v) => voiceAge(v) !== 'elder')
  const rank = (v: V) => known(v)?.[1] ?? 99
  return [...pool].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
}

/**
 * Choose a Japanese system voice. With no gender (or no voice of it) this
 * is the usual best default voice; with several voices of that gender,
 * `slot` (a number, or a key that is hashed) picks one stably, so
 * characters with different slots get different voices.
 */
export function pickJaVoice<V extends VoiceLike>(voices: readonly V[], gender: Gender | 'any' = 'any', slot: number | string = 0, age?: Age): V | null {
  const ja = voices.filter(isJa)
  if (!ja.length) return null
  if (gender === 'any') return defaultJa(ja)
  const pool = voicePool(ja, gender, age)
  if (!pool.length) return defaultJa(ja)
  const n = typeof slot === 'number' ? slot : hash(slot)
  return pool[Math.abs(n) % pool.length]
}

/** Each character's place among the voices of its gender (declaration order in VOICES). */
const SLOTS: Record<string, number> = (() => {
  const seen: Record<string, number> = {}
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(VOICES)) {
    const g = v.tts.gender
    out[k] = seen[g] ?? 0
    seen[g] = out[k] + 1
  }
  return out
})()

/** Which of the available voices of its gender a speaker gets (variants of generic voices hash in). */
export function ttsSlot(id: string | null | undefined): number {
  const key = voiceKey(id)
  if (!key) return 0
  const variant = id ? splitId(id)[1] : ''
  return SLOTS[key] + (variant && VOICES[key].generic ? hash(variant.toLowerCase()) % 7 : 0)
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * TTS settings for a speaker: the chosen voice plus pitch and rate. When
 * only a voice of the other register exists, the pitch shift is pushed
 * further (a man's voice pitched up for a girl and vice versa). Callers
 * without a speaker get the default voice at normal pitch.
 */
export function ttsParams<V extends VoiceLike>(speaker: string | null | undefined, voices: readonly V[], baseRate: number): { voice: V | null; pitch: number; rate: number } {
  const key = voiceKey(speaker)
  const t = key ? voiceFor(speaker).tts : DEFAULT_VOICE.tts
  const voice = pickJaVoice(voices, t.gender, ttsSlot(speaker), t.age)
  let pitch = t.pitch
  const got = voice && voiceGender(voice)
  if (t.gender !== 'any' && got && got !== t.gender) pitch *= t.gender === 'female' ? 1.3 : 0.78
  return { voice, pitch: clamp(pitch, 0.1, 2), rate: clamp(baseRate * t.rate, 0.5, 2) }
}

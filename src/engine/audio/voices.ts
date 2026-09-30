/**
 * Character voices (pure data + logic; no WebAudio).
 *
 * Every speaker gets a procedural "talk blip" voice in the style of Animal
 * Crossing / Undertale — a short tone per few characters, pitched from the
 * character itself so the same line always "sounds" the same — plus
 * text-to-speech settings (pitch, rate, deeper/higher voice preference) and
 * an optional signature cry (meow, bark, roar…). Keys are sprite ids
 * (src/art) and story speaker ids (src/story/scenes SPEAKERS).
 */

export type BlipWave = 'sine' | 'triangle' | 'square' | 'sawtooth' | 'pulse12' | 'pulse25' | 'pulse50' | 'noise'

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

export interface TtsVoice {
  /** SpeechSynthesis pitch (0..2, 1 = normal). */
  pitch: number
  /** Multiplier on the player's speech-rate setting. */
  rate: number
  /** Prefer a deeper (male) or higher (female) system voice when several exist. */
  tone: 'low' | 'high' | 'any'
}

export interface VoiceProfile {
  wave: BlipWave
  /** Centre pitch of the blips (Hz). */
  base: number
  /** Semitone offsets the syllables are drawn from (default: yo pentatonic). */
  scale?: number[]
  /** Band-pass "formant" centre (Hz) that colours the blip; omitted = none. */
  formant?: number
  q?: number
  /** Blip length (seconds). */
  len: number
  /** Blip on every n-th voiced character. */
  every: number
  /** Vibrato depth (cents), e.g. a shaky elder. */
  vib?: number
  /** Pitch at the end of each blip as a ratio (0.85 = falls, 1.2 = chirps up). */
  glide?: number
  /** Blip loudness (sfx bus). */
  gain: number
  tts: TtsVoice
  cry?: CryId
  /** Cry pitch multiplier (variants such as the ice slime). */
  cryPitch?: number
}

const YO = [0, 2, 5, 7, 9]
const IN = [0, 1, 5, 7, 8]
const NARROW = [0, 2, 4]

/** The narrator / unknown speaker: the classic neutral blip. */
export const DEFAULT_VOICE: VoiceProfile = { wave: 'pulse25', base: 620, scale: [0, 2], len: 0.035, every: 2, gain: 0.028, tts: { pitch: 1, rate: 1, tone: 'any' } }

export const VOICES: Record<string, VoiceProfile> = {
  // ─── Heroes
  mage: { wave: 'triangle', base: 440, len: 0.04, every: 2, formant: 1400, q: 0.8, gain: 0.05, tts: { pitch: 1, rate: 1, tone: 'any' }, cry: 'staff' },
  fude: { wave: 'sine', base: 1050, len: 0.045, every: 2, vib: 35, glide: 1.12, gain: 0.05, tts: { pitch: 1.4, rate: 1.08, tone: 'high' }, cry: 'chime' },
  // ─── Villagers
  elder: { wave: 'triangle', base: 185, scale: NARROW, formant: 650, q: 1.2, len: 0.07, every: 3, vib: 28, glide: 0.94, gain: 0.08, tts: { pitch: 0.7, rate: 0.85, tone: 'low' }, cry: 'elder' },
  guard: { wave: 'pulse50', base: 150, scale: [0, 2, 5], formant: 520, q: 1.5, len: 0.05, every: 2, glide: 0.92, gain: 0.05, tts: { pitch: 0.8, rate: 0.95, tone: 'low' }, cry: 'armor' },
  merchant: { wave: 'pulse25', base: 560, len: 0.035, every: 2, glide: 1.06, gain: 0.032, tts: { pitch: 1.25, rate: 1.1, tone: 'high' }, cry: 'coins' },
  priest: { wave: 'sine', base: 330, scale: IN, len: 0.06, every: 3, vib: 12, gain: 0.07, tts: { pitch: 0.92, rate: 0.88, tone: 'low' }, cry: 'suzu' },
  king: { wave: 'sawtooth', base: 200, scale: [0, 4, 7], formant: 600, q: 1.1, len: 0.06, every: 3, vib: 10, gain: 0.05, tts: { pitch: 0.78, rate: 0.85, tone: 'low' }, cry: 'fanfare' },
  innkeeper: { wave: 'triangle', base: 330, len: 0.045, every: 2, formant: 900, q: 0.9, gain: 0.06, tts: { pitch: 1.08, rate: 0.95, tone: 'high' }, cry: 'hum' },
  jailer: { wave: 'pulse12', base: 165, scale: [0, 1, 3], formant: 480, q: 1.4, len: 0.05, every: 2, glide: 0.86, gain: 0.05, tts: { pitch: 0.75, rate: 0.9, tone: 'low' }, cry: 'keys' },
  'villager-a': { wave: 'pulse25', base: 260, formant: 800, q: 1, len: 0.04, every: 2, gain: 0.045, tts: { pitch: 0.92, rate: 1, tone: 'low' }, cry: 'greet' },
  'villager-b': { wave: 'triangle', base: 470, len: 0.04, every: 2, gain: 0.05, tts: { pitch: 1.15, rate: 1.02, tone: 'high' }, cry: 'greet' },
  child: { wave: 'pulse25', base: 760, len: 0.03, every: 1, glide: 1.1, gain: 0.026, tts: { pitch: 1.6, rate: 1.12, tone: 'high' }, cry: 'giggle' },
  // ─── Animals
  cat: { wave: 'sine', base: 880, scale: [0, 3, 5], len: 0.05, every: 2, glide: 1.25, vib: 20, gain: 0.05, tts: { pitch: 1.7, rate: 1.05, tone: 'high' }, cry: 'meow' },
  dog: { wave: 'pulse50', base: 360, scale: [0, 5, 7], formant: 900, q: 1.2, len: 0.04, every: 2, glide: 0.8, gain: 0.045, tts: { pitch: 1.2, rate: 1.15, tone: 'any' }, cry: 'bark' },
  fox: { wave: 'triangle', base: 640, scale: IN, len: 0.04, every: 2, glide: 1.15, gain: 0.05, tts: { pitch: 1.35, rate: 1.05, tone: 'high' }, cry: 'kon' },
  // ─── Monsters / bosses
  slime: { wave: 'sine', base: 300, scale: NARROW, len: 0.06, every: 2, glide: 1.4, gain: 0.07, tts: { pitch: 1.4, rate: 0.95, tone: 'any' }, cry: 'slime' },
  'ice-slime': { wave: 'sine', base: 420, scale: NARROW, len: 0.06, every: 2, glide: 1.4, vib: 25, gain: 0.07, tts: { pitch: 1.5, rate: 0.95, tone: 'any' }, cry: 'slime', cryPitch: 1.35 },
  imp: { wave: 'pulse12', base: 700, scale: IN, len: 0.03, every: 1, glide: 1.2, gain: 0.03, tts: { pitch: 1.7, rate: 1.2, tone: 'any' }, cry: 'imp' },
  bat: { wave: 'square', base: 1100, scale: [0, 1], len: 0.025, every: 2, glide: 1.3, gain: 0.02, tts: { pitch: 1.8, rate: 1.2, tone: 'high' }, cry: 'screech' },
  mushroom: { wave: 'triangle', base: 380, scale: NARROW, formant: 700, len: 0.05, every: 2, glide: 0.9, gain: 0.05, tts: { pitch: 1.2, rate: 0.9, tone: 'any' }, cry: 'puff' },
  kappa: { wave: 'pulse25', base: 300, scale: [0, 3, 5], formant: 700, q: 3, len: 0.05, every: 2, glide: 0.8, gain: 0.04, tts: { pitch: 1.1, rate: 1, tone: 'any' }, cry: 'croak' },
  tanuki: { wave: 'triangle', base: 280, len: 0.05, every: 2, glide: 0.9, gain: 0.06, tts: { pitch: 1.05, rate: 1.05, tone: 'low' }, cry: 'pon' },
  golem: { wave: 'sawtooth', base: 90, scale: NARROW, formant: 350, q: 2, len: 0.09, every: 3, glide: 0.9, gain: 0.07, tts: { pitch: 0.5, rate: 0.75, tone: 'low' }, cry: 'rumble' },
  wisp: { wave: 'noise', base: 1200, scale: YO, len: 0.07, every: 2, glide: 1.1, gain: 0.05, tts: { pitch: 1.3, rate: 0.8, tone: 'high' }, cry: 'wisp' },
  kitsune: { wave: 'triangle', base: 700, scale: IN, len: 0.045, every: 2, glide: 1.15, vib: 18, gain: 0.05, tts: { pitch: 1.3, rate: 0.95, tone: 'high' }, cry: 'kon', cryPitch: 0.85 },
  harpy: { wave: 'pulse25', base: 900, scale: [0, 1, 5], len: 0.035, every: 2, glide: 1.25, gain: 0.03, tts: { pitch: 1.6, rate: 1.1, tone: 'high' }, cry: 'screech', cryPitch: 0.8 },
  treant: { wave: 'sawtooth', base: 110, scale: NARROW, formant: 420, q: 1.6, len: 0.1, every: 3, vib: 15, gain: 0.06, tts: { pitch: 0.6, rate: 0.75, tone: 'low' }, cry: 'creak' },
  tengu: { wave: 'pulse50', base: 330, scale: IN, formant: 1000, q: 1.2, len: 0.045, every: 2, gain: 0.04, tts: { pitch: 0.95, rate: 1.05, tone: 'low' }, cry: 'tengu' },
  oni: { wave: 'sawtooth', base: 120, scale: [0, 1, 5], formant: 500, q: 1.8, len: 0.07, every: 2, glide: 0.85, gain: 0.06, tts: { pitch: 0.55, rate: 0.85, tone: 'low' }, cry: 'roar' },
  skeleton: { wave: 'pulse12', base: 500, scale: [0, 1, 6], len: 0.025, every: 1, gain: 0.03, tts: { pitch: 1.1, rate: 1.1, tone: 'any' }, cry: 'rattle' },
  dragon: { wave: 'sawtooth', base: 75, scale: [0, 1, 6], formant: 380, q: 2.2, len: 0.11, every: 3, vib: 20, glide: 0.85, gain: 0.08, tts: { pitch: 0.45, rate: 0.75, tone: 'low' }, cry: 'growl' },
}

/** Story speaker ids (and a few aliases) → sprite ids. */
const ALIASES: Record<string, string> = {
  you: 'mage',
  player: 'mage',
  farmer: 'villager-a',
  guardian: 'treant',
  librarian: 'wisp',
  chimera: 'kitsune',
  // Boss illustration / game ids.
  'kana-oni': 'oni',
  'radical-golem': 'golem',
  'particle-guardian': 'treant',
  'silent-librarian': 'wisp',
  'shifting-chimera': 'kitsune',
  'void-dragon': 'dragon',
}

/** Resolve a sprite / speaker id to its canonical voice key (or null). */
export function voiceKey(id: string | null | undefined): string | null {
  if (!id) return null
  const k = id.trim().toLowerCase()
  if (k in VOICES) return k
  if (k in ALIASES) return ALIASES[k]
  return null
}

/** The voice for a sprite / speaker id; the neutral narrator voice for anything else. */
export function voiceFor(id: string | null | undefined): VoiceProfile {
  const k = voiceKey(id)
  return k ? VOICES[k] : DEFAULT_VOICE
}

/** Characters that make a sound when typed (not spaces, punctuation or small kana/long marks). */
export function isVoiced(ch: string): boolean {
  if (!ch || !ch.trim()) return false
  return !/[\p{P}\p{S}ー〜ゃゅょっャュョッぁぃぅぇぉァィゥェォ…・]/u.test(ch)
}

/** Should the `i`-th character (of `text`) blip for this voice? */
export function shouldBlip(p: VoiceProfile, ch: string, i: number): boolean {
  return isVoiced(ch) && i % Math.max(1, p.every) === 0
}

/**
 * Blip pitch (Hz) for one character: picked from the voice's scale by the
 * character code, so a given word always "sounds" the same; lines ending in
 * a question lift at the end.
 */
export function blipFreq(p: VoiceProfile, ch: string, question = false): number {
  const scale = p.scale ?? YO
  const code = ch.codePointAt(0) ?? 0
  const step = scale[(code * 7 + (code >> 3)) % scale.length]
  const centre = scale[Math.floor(scale.length / 2)]
  const semis = step - centre + (question ? 3 : 0)
  return p.base * Math.pow(2, semis / 12)
}

/** Does this line end as a question (for the rising blip)? */
export function isQuestion(text: string): boolean {
  return /[?？]\s*$/.test(text)
}

// ─── Text-to-speech ──────────────────────────────────────────────────

/** Minimal shape of a SpeechSynthesisVoice (so this stays testable). */
export interface VoiceLike {
  name: string
  lang: string
  default?: boolean
}

const MALE = /otoya|ichiro|keita|hattori|daichi|naoki|takumi|kenji|男|\bmale\b/i
const FEMALE = /kyoko|haruka|nanami|ayumi|sayaka|mizuki|o-ren|shiori|aoi|mayu|女|female|google/i
const PREFERRED = /google|kyoko|otoya|haruka|nanami/i

export function voiceGender(v: VoiceLike): 'male' | 'female' | null {
  if (MALE.test(v.name)) return 'male'
  if (FEMALE.test(v.name)) return 'female'
  return null
}

function isJa(v: VoiceLike) {
  return v.lang.replace('_', '-').toLowerCase().startsWith('ja')
}

/** Small stable hash (so each character keeps "their" voice among equals). */
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/**
 * Choose a Japanese system voice for a tone preference. With no
 * preference (or no match) this is the usual best default voice; with
 * several matching voices, `key` (the speaker) picks one stably.
 */
export function pickJaVoice<V extends VoiceLike>(voices: readonly V[], tone: TtsVoice['tone'] = 'any', key = ''): V | null {
  const ja = voices.filter(isJa)
  if (!ja.length) return null
  const fallback = ja.find((v) => v.lang.replace('_', '-') === 'ja-JP' && PREFERRED.test(v.name)) ?? ja[0]
  if (tone === 'any') return fallback
  const want = tone === 'low' ? 'male' : 'female'
  const matches = ja.filter((v) => voiceGender(v) === want)
  if (!matches.length) return fallback
  return matches[key ? hash(key) % matches.length : 0]
}

/**
 * TTS settings for a speaker: the chosen voice plus pitch and rate. When a
 * voice of the wanted register exists, the pitch shift is halved (the voice
 * already does most of the work and heavy shifts sound robotic).
 */
export function ttsParams<V extends VoiceLike>(speaker: string | null | undefined, voices: readonly V[], baseRate: number): { voice: V | null; pitch: number; rate: number } {
  const key = voiceKey(speaker)
  const t = key ? VOICES[key].tts : DEFAULT_VOICE.tts
  const voice = pickJaVoice(voices, t.tone, key ?? '')
  const matched = !!voice && t.tone !== 'any' && voiceGender(voice) === (t.tone === 'low' ? 'male' : 'female')
  const pitch = matched ? 1 + (t.pitch - 1) * 0.5 : t.pitch
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
  return { voice, pitch: clamp(pitch, 0.3, 2), rate: clamp(baseRate * t.rate, 0.5, 2) }
}

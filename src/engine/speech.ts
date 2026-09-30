import { toHiragana, toKatakana } from 'wanakana'
import { pickJaVoice, ttsParams } from './audio/voices'
import { getState } from './store'

/**
 * Text-to-speech in Japanese via the Web Speech API. Pass a `speaker`
 * (sprite / story speaker id) and each character gets their own pitch,
 * rate and — when the system has several Japanese voices — a deeper or
 * higher voice (see ./audio/voices.ts).
 */
let jaVoice: SpeechSynthesisVoice | null | undefined
let allVoices: SpeechSynthesisVoice[] = []

function voiceList(): SpeechSynthesisVoice[] {
  if (typeof speechSynthesis === 'undefined') return []
  if (!allVoices.length) allVoices = speechSynthesis.getVoices()
  return allVoices
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null
  if (jaVoice !== undefined && jaVoice !== null) return jaVoice
  jaVoice = pickJaVoice(voiceList())
  return jaVoice
}

if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.addEventListener?.('voiceschanged', () => {
    jaVoice = undefined
    allVoices = []
    pickVoice()
  })
}

export function canSpeak(): boolean {
  return typeof speechSynthesis !== 'undefined'
}

export function hasJapaneseVoice(): boolean {
  return !!pickVoice()
}

/**
 * Speak Japanese text. Resolves when finished (or immediately if
 * unsupported/disabled). `speaker` (sprite / speaker id) picks that
 * character's voice; an explicit `rate` still wins.
 */
export function speak(text: string, opts: { rate?: number; force?: boolean; speaker?: string } = {}): Promise<void> {
  const { settings } = getState()
  if (!canSpeak() || (!settings.voice && !opts.force)) return Promise.resolve()
  return new Promise((resolve) => {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ja-JP'
    u.rate = opts.rate ?? settings.speechRate
    let v = pickVoice()
    if (opts.speaker) {
      const t = ttsParams(opts.speaker, voiceList(), settings.speechRate)
      if (t.voice) v = t.voice
      u.pitch = t.pitch
      if (opts.rate === undefined) u.rate = t.rate
    }
    if (v) u.voice = v
    u.onend = () => resolve()
    u.onerror = () => resolve()
    speechSynthesis.speak(u)
    // Safety: some browsers never fire onend.
    setTimeout(resolve, 4000 + text.length * 250)
  })
}

// ─── Speech recognition (Voice-to-Magic) ───────────────────────────────

interface RecognitionAlt {
  transcript: string
  confidence: number
}

type AnyRecognition = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: { results: ArrayLike<ArrayLike<RecognitionAlt>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

function recognitionCtor(): (new () => AnyRecognition) | null {
  const w = globalThis as unknown as { SpeechRecognition?: new () => AnyRecognition; webkitSpeechRecognition?: new () => AnyRecognition }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function canListen(): boolean {
  return !!recognitionCtor()
}

/**
 * Listen for one Japanese utterance. Resolves with the recognised
 * alternatives (best first), or rejects with an error string.
 */
export function listen(timeoutMs = 7000): { promise: Promise<RecognitionAlt[]>; cancel: () => void } {
  const Ctor = recognitionCtor()
  if (!Ctor) return { promise: Promise.reject(new Error('Speech recognition is not supported in this browser')), cancel: () => {} }
  const rec = new Ctor()
  rec.lang = 'ja-JP'
  rec.interimResults = false
  rec.maxAlternatives = 5
  rec.continuous = false
  let done = false
  const promise = new Promise<RecognitionAlt[]>((resolve, reject) => {
    const timer = setTimeout(() => {
      if (!done) rec.stop()
    }, timeoutMs)
    rec.onresult = (e) => {
      done = true
      clearTimeout(timer)
      const res = e.results[0]
      const alts: RecognitionAlt[] = []
      for (let i = 0; i < res.length; i++) alts.push({ transcript: res[i].transcript, confidence: res[i].confidence })
      resolve(alts)
    }
    rec.onerror = (e) => {
      done = true
      clearTimeout(timer)
      reject(new Error(e.error))
    }
    rec.onend = () => {
      clearTimeout(timer)
      if (!done) reject(new Error('no-speech'))
    }
    rec.start()
  })
  return { promise, cancel: () => rec.abort() }
}

/** Normalise Japanese for comparison: strip punctuation/space, unify kana. */
export function normaliseJa(s: string): string {
  return toHiragana(s.replace(/[\s。、！？!?.,「」『』・〜ー]/g, ''), { passRomaji: false })
}

/**
 * Does a recognised utterance match any of the accepted forms? Recognisers
 * return kanji, kana or even katakana, so we compare several normalisations.
 * Returns a 0–1 score (1 = exact, partial credit for close matches).
 */
export function matchUtterance(alts: RecognitionAlt[], accepted: string[]): number {
  const targets = new Set(accepted.flatMap((a) => [normaliseJa(a), normaliseJa(toKatakana(a))]))
  let best = 0
  for (const alt of alts) {
    const t = normaliseJa(alt.transcript)
    if (targets.has(t)) return 1
    for (const target of targets) best = Math.max(best, similarity(t, target))
  }
  return best
}

/** Normalised Levenshtein similarity in [0, 1]. */
export function similarity(a: string, b: string): number {
  if (a === b) return 1
  if (!a.length || !b.length) return 0
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return 1 - dp[a.length][b.length] / Math.max(a.length, b.length)
}

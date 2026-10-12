/**
 * Speech inside the Android app. An Android WebView has no Web Speech API,
 * so there the game speaks and listens through the phone's own text-to-speech
 * engine and speech recogniser (Capacitor plugins). In a browser none of this
 * runs: `native` is false and engine/speech uses the Web Speech API as before.
 *
 * Voices load asynchronously; until they do, the phone is assumed to have a
 * Japanese voice (nearly every Android phone does via Google's speech engine).
 */
import { Capacitor } from '@capacitor/core'
import type { VoiceLike } from './audio/voices'

export const native = Capacitor.isNativePlatform()

type TtsPlugin = typeof import('@capacitor-community/text-to-speech').TextToSpeech
type SrPlugin = typeof import('@capacitor-community/speech-recognition').SpeechRecognition

let tts: TtsPlugin | null = null
let sr: SrPlugin | null = null
/** The phone's voices, in the plugin's order (a voice is picked by its index). */
let voices: VoiceLike[] = []
let jaOk = true
let listenOk = true

if (native) {
  void import('@capacitor-community/text-to-speech').then(async (m) => {
    tts = m.TextToSpeech
    try {
      voices = (await tts.getSupportedVoices()).voices
      jaOk = voices.some((v) => /^ja/i.test(v.lang)) || (await tts.isLanguageSupported({ lang: 'ja-JP' })).supported
    } catch {
      // keep the optimistic defaults
    }
  })
  void import('@capacitor-community/speech-recognition').then(async (m) => {
    sr = m.SpeechRecognition
    try {
      listenOk = (await sr.available()).available
    } catch {
      listenOk = false
    }
  })
}

export const nativeVoices = (): readonly VoiceLike[] => voices
export const nativeHasJapanese = () => jaOk
export const nativeCanListen = () => listenOk

/** Speak through the phone's TTS engine; resolves when done (or on any failure). */
export async function nativeSay(text: string, rate: number, pitch: number, voice: VoiceLike | null): Promise<void> {
  if (!tts) return
  const i = voice ? voices.indexOf(voice) : -1
  try {
    await tts.stop()
    await tts.speak({ text, lang: 'ja-JP', rate, pitch, ...(i >= 0 ? { voice: i } : {}) })
  } catch {
    // no engine, or interrupted by the next line
  }
}

/** Listen for one Japanese utterance through the phone's recogniser. */
export function nativeListen(timeoutMs: number): { promise: Promise<{ transcript: string; confidence: number }[]>; cancel: () => void } {
  const plugin = sr
  if (!plugin) return { promise: Promise.reject(new Error('Speech recognition is not ready yet')), cancel: () => {} }
  const promise = (async () => {
    const perm = await plugin.requestPermissions()
    if (perm.speechRecognition !== 'granted') throw new Error('not-allowed')
    const timer = setTimeout(() => void plugin.stop().catch(() => {}), timeoutMs)
    try {
      const { matches = [] } = await plugin.start({ language: 'ja-JP', maxResults: 5, partialResults: false, popup: false })
      if (!matches.length) throw new Error('no-speech')
      // the recogniser ranks its guesses but gives no scores: best first
      return matches.map((transcript, n) => ({ transcript, confidence: Math.max(0.1, 0.9 - n * 0.15) }))
    } finally {
      clearTimeout(timer)
    }
  })()
  return { promise, cancel: () => void plugin.stop().catch(() => {}) }
}

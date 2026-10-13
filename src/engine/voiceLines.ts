/**
 * Recorded voice-over for cutscene lines. Every recorded line is a small mp3
 * at public/voice/<sceneId>/<step>.mp3, listed in public/voice/index.json
 * (recorded with ElevenLabs, one Japanese voice per character). A line with
 * no recording falls back to the device's text-to-speech (engine/speech).
 */
import { speak } from './speech'
import { getState } from './store'

const base = () => import.meta.env?.BASE_URL ?? '/'

let index: Record<string, unknown> | null = null
let loading: Promise<void> | null = null

/** Load the list of recorded lines (once). */
export function loadVoiceLines(): Promise<void> {
  loading ??= fetch(`${base()}voice/index.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .then((j: unknown) => {
      index = j && typeof j === 'object' ? (j as Record<string, unknown>) : {}
    })
    .catch(() => {
      index = {}
    })
  return loading
}

export const lineKey = (sceneId: string, step: number) => `${sceneId}#${step}`

/** Is there a recording for this line? (false until the list has loaded) */
export function hasRecording(key: string): boolean {
  return !!index?.[key]
}

let current: HTMLAudioElement | null = null

/** Stop the line that is playing, if any. */
export function stopLine() {
  if (!current) return
  current.pause()
  current.src = ''
  current = null
}

/**
 * Speak a cutscene line: the recording when there is one, else the device
 * voice. Resolves when it has finished (or straight away with voice off).
 */
export function playLine(key: string, text: string, speaker?: string): Promise<void> {
  stopLine()
  if (!getState().settings.voice) return Promise.resolve()
  if (!hasRecording(key)) return speak(text, { speaker })
  const [scene, step] = key.split('#')
  const a = new Audio(`${base()}voice/${encodeURIComponent(scene)}/${step}.mp3`)
  // the learner's speech-rate setting slows or quickens recordings too (0.9 is the default pace)
  a.playbackRate = Math.max(0.6, Math.min(1.5, getState().settings.speechRate / 0.9))
  current = a
  return new Promise((resolve) => {
    const done = () => {
      if (current === a) current = null
      resolve()
    }
    a.onended = done
    a.onerror = () => {
      // a missing or broken file: say it with the device voice instead
      if (current === a) current = null
      void speak(text, { speaker }).then(resolve)
    }
    a.play().catch(() => a.onerror?.(new Event('error')))
  })
}

void loadVoiceLines()

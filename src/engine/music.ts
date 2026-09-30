/**
 * Chiptune music. Original compositions (./audio/tracks.ts) sequenced on
 * WebAudio with lookahead scheduling: a light 60 ms timer queues every note
 * ~0.35 s ahead on the audio clock, so timing never drifts with frame rate.
 *
 * - Nothing sounds before the first user gesture (autoplay rules): a track
 *   requested earlier is remembered and starts on the first tap/key.
 * - Switching tracks cross-fades. Jingles duck the loop, then it resumes.
 * - Obeys `settings.sound` and a separate music volume (localStorage
 *   `fude.musicVolume`, 0..1, default 0.5) via setMusicVolume().
 */

import { audioCtx, getMusicBus, isUnlocked, onUnlock } from './audio/context'
import { TrackPlayer } from './audio/player'
import { compileTrack, type CompiledTrack } from './audio/sequence'
import { TRACKS, type TrackId } from './audio/tracks'
import { getState, subscribe } from './store'

export type { TrackId }

const LOOKAHEAD = 0.35
const TICK_MS = 60
const VOL_KEY = 'fude.musicVolume'

const compiled = new Map<string, CompiledTrack>()
function getTrack(id: TrackId, loop: boolean): CompiledTrack {
  const key = `${id}:${loop}`
  let t = compiled.get(key)
  if (!t) compiled.set(key, (t = compileTrack({ ...TRACKS[id], loop })))
  return t
}

let desired: TrackId | null = null
let active: { id: TrackId; p: TrackPlayer } | null = null
let jingle: { id: TrackId; p: TrackPlayer } | null = null
let timer: ReturnType<typeof setInterval> | null = null
let volume = readVolume()

function readVolume(): number {
  try {
    const v = typeof localStorage === 'undefined' ? null : localStorage.getItem(VOL_KEY)
    const n = v === null ? NaN : Number(v)
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5
  } catch {
    return 0.5
  }
}

/** Slider value (0..1) → bus gain. Squared so the slider feels even. */
function busGain(v: number) {
  return v * v * 1.2
}

function soundOn() {
  try {
    return getState().settings.sound
  } catch {
    return true
  }
}

function liveCtx(): AudioContext | null {
  if (!isUnlocked() || !soundOn() || volume <= 0) return null
  return audioCtx()
}

function ensureTimer() {
  if (!timer && (active || jingle)) timer = setInterval(tick, TICK_MS)
}

function tick() {
  const ctx = audioCtx()
  if (!ctx) return
  const until = ctx.currentTime + LOOKAHEAD
  active?.p.schedule(until)
  if (jingle) {
    jingle.p.schedule(until)
    if (ctx.currentTime > jingle.p.endTime + 0.4) {
      jingle.p.fadeOut(0.6)
      jingle = null
      sync(1.2)
    }
  }
  if (!active && !jingle && timer) {
    clearInterval(timer)
    timer = null
  }
}

function stopAll(fade: number) {
  active?.p.fadeOut(fade)
  jingle?.p.fadeOut(fade)
  active = jingle = null
}

function sync(fadeIn?: number) {
  const ctx = liveCtx()
  const bus = getMusicBus()
  if (!ctx || !bus) {
    stopAll(0.4)
    return
  }
  bus.gain.setTargetAtTime(busGain(volume), ctx.currentTime, 0.05)
  if (!jingle) {
    let crossfade = false
    if (active && active.id !== desired) {
      active.p.fadeOut(desired ? 0.9 : 0.7)
      active = null
      crossfade = true
    }
    if (desired && !active) {
      const p = new TrackPlayer(ctx, bus, getTrack(desired, true), ctx.currentTime + 0.06, 0)
      p.fadeIn(fadeIn ?? (crossfade ? 0.8 : 0.08))
      p.schedule(ctx.currentTime + LOOKAHEAD)
      active = { id: desired, p }
    }
  }
  ensureTimer()
}

/** Start (or cross-fade to) a looping track. No-op if already playing it. */
export function playMusic(track: TrackId): void {
  if (!(track in TRACKS)) return
  if (desired === track && (active || jingle || !liveCtx())) return
  desired = track
  sync()
}

/** Stop music (fade out). A jingle already playing finishes; nothing resumes after it. */
export function stopMusic(): void {
  desired = null
  sync()
}

/** Play a one-shot jingle (e.g. 'victory'), then resume the previous track. */
export function playJingle(track: TrackId): void {
  const ctx = liveCtx()
  const bus = getMusicBus()
  if (!ctx || !bus || !(track in TRACKS)) return
  jingle?.p.fadeOut(0.1)
  active?.p.fadeOut(0.25)
  active = null
  const p = new TrackPlayer(ctx, bus, getTrack(track, false), ctx.currentTime + 0.08)
  p.schedule(ctx.currentTime + LOOKAHEAD)
  jingle = { id: track, p }
  ensureTimer()
}

/** The track currently playing (a jingle while one plays), or the queued track, or null. */
export function currentTrack(): TrackId | null {
  return jingle?.id ?? desired
}

/** Music volume 0..1 (persisted in localStorage `fude.musicVolume`). */
export function getMusicVolume(): number {
  return volume
}

export function setMusicVolume(v: number): void {
  volume = Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0.5))
  try {
    localStorage.setItem(VOL_KEY, String(volume))
  } catch {
    /* private mode etc. */
  }
  sync()
}

onUnlock(() => sync())

let lastSound = soundOn()
try {
  subscribe(() => {
    const s = soundOn()
    if (s !== lastSound) {
      lastSound = s
      sync()
    }
  })
} catch {
  /* store unavailable (tests) */
}

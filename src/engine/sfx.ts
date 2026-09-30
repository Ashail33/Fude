import { audioCtx, getSfxBus } from './audio/context'
import { noiseBuffer, pulseWave } from './audio/synth'
import { getState } from './store'

/**
 * Tiny WebAudio synth for game sounds. No audio files required.
 * Shares one AudioContext with the music (created on the first user gesture;
 * calls before that are silently ignored, so nothing trips autoplay rules).
 */

type Wave = OscillatorType | 'pulse12' | 'pulse25' | 'pulse50'

function out(): { c: AudioContext; bus: AudioNode } | null {
  if (!getState().settings.sound) return null
  const c = audioCtx()
  const bus = getSfxBus()
  return c && bus ? { c, bus } : null
}

interface ToneOpts {
  type?: Wave
  gain?: number
  delay?: number
  /** Glide to this frequency over the note. */
  slide?: number
  attack?: number
}

function tone(freq: number, dur: number, opts: ToneOpts = {}) {
  const o = out()
  if (!o) return
  const { c, bus } = o
  const t0 = c.currentTime + (opts.delay ?? 0)
  const osc = c.createOscillator()
  const g = c.createGain()
  const type = opts.type ?? 'sine'
  if (type.startsWith('pulse')) osc.setPeriodicWave(pulseWave(c, type === 'pulse12' ? 0.125 : type === 'pulse25' ? 0.25 : 0.5))
  else osc.type = type as OscillatorType
  osc.frequency.setValueAtTime(freq, t0)
  if (opts.slide) osc.frequency.exponentialRampToValueAtTime(opts.slide, t0 + dur)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(opts.gain ?? 0.15, t0 + (opts.attack ?? 0.008))
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(bus)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
  osc.onended = () => g.disconnect()
}

interface NoiseOpts {
  gain?: number
  delay?: number
  filter?: BiquadFilterType
  freq?: number
  /** Sweep the filter to this frequency over the sound. */
  sweep?: number
  q?: number
  attack?: number
}

function noise(dur: number, opts: NoiseOpts | number = {}) {
  const o = out()
  if (!o) return
  const { c, bus } = o
  const op = typeof opts === 'number' ? { gain: opts } : opts
  const t0 = c.currentTime + (op.delay ?? 0)
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c)
  src.loop = true
  const f = c.createBiquadFilter()
  f.type = op.filter ?? 'lowpass'
  f.frequency.setValueAtTime(op.freq ?? 6000, t0)
  if (op.sweep) f.frequency.exponentialRampToValueAtTime(op.sweep, t0 + dur)
  f.Q.value = op.q ?? 0.7
  const g = c.createGain()
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(op.gain ?? 0.12, t0 + (op.attack ?? 0.004))
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(f).connect(g).connect(bus)
  src.start(t0, Math.random() * 0.5)
  src.stop(t0 + dur + 0.02)
  src.onended = () => g.disconnect()
}

/** Bell / chime: sine + inharmonic partial with a long decay. */
function chime(freq: number, dur: number, gain = 0.08, delay = 0) {
  tone(freq, dur, { type: 'sine', gain, delay, attack: 0.003 })
  tone(freq * 2.76, dur * 0.4, { type: 'sine', gain: gain * 0.35, delay, attack: 0.002 })
}

/** Rate-limit very frequent sounds (typewriter, footsteps). */
function throttled<A extends unknown[]>(ms: number, fn: (...a: A) => void): (...a: A) => void {
  let last = 0
  return (...a: A) => {
    const now = performance.now()
    if (now - last < ms) return
    last = now
    fn(...a)
  }
}

// Yo-scale pitches (D E G A B) give a Japanese feel.
const YO = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99, 880.0, 987.77, 1174.66, 1318.51, 1567.98]

let blipFlip = 0
const blip = throttled(38, (voice: number = 0) => {
  // Alternate two close pitches so long lines don't drone; `voice` shifts pitch per speaker (semitones).
  const base = 620 * Math.pow(2, voice / 12)
  blipFlip ^= 1
  tone(base * (blipFlip ? 1 : 1.122), 0.035, { type: 'pulse25', gain: 0.028, attack: 0.002 })
})

let stepFlip = 0
const step = throttled(90, () => {
  stepFlip ^= 1
  noise(0.035, { gain: 0.035, filter: 'lowpass', freq: stepFlip ? 900 : 700, attack: 0.002 })
})

const cursor = throttled(30, () => tone(1318.5, 0.04, { type: 'pulse12', gain: 0.05, attack: 0.002 }))
const bump = throttled(180, () => {
  tone(120, 0.1, { type: 'triangle', gain: 0.16, slide: 70, attack: 0.002 })
  noise(0.06, { gain: 0.05, filter: 'lowpass', freq: 500 })
})

export type MagicElement = 'fire' | 'water' | 'wood' | 'earth' | 'metal' | 'light' | 'wind' | 'none'

function magic(element?: MagicElement | string) {
  switch (element) {
    case 'fire':
      noise(0.45, { gain: 0.14, filter: 'bandpass', freq: 500, sweep: 2400, q: 0.8, attack: 0.03 })
      tone(180, 0.4, { type: 'sawtooth', gain: 0.05, slide: 520 })
      for (let i = 0; i < 4; i++) noise(0.03, { gain: 0.07, filter: 'highpass', freq: 3000, delay: 0.1 + i * 0.07 + Math.random() * 0.03 })
      break
    case 'water':
      for (let i = 0; i < 5; i++) tone(380 + Math.random() * 220, 0.09, { type: 'sine', gain: 0.09, slide: 900 + Math.random() * 500, delay: i * 0.06 })
      noise(0.4, { gain: 0.05, filter: 'bandpass', freq: 1200, sweep: 700, q: 1.2, attack: 0.05 })
      break
    case 'wood':
      ;[0, 2, 3, 5].forEach((n, i) => tone(YO[n + 3], 0.25, { type: 'triangle', gain: 0.09, delay: i * 0.055, attack: 0.002 }))
      noise(0.3, { gain: 0.04, filter: 'highpass', freq: 4000, attack: 0.05 })
      break
    case 'earth':
      tone(90, 0.5, { type: 'triangle', gain: 0.22, slide: 38 })
      noise(0.5, { gain: 0.14, filter: 'lowpass', freq: 400, sweep: 120, attack: 0.01 })
      break
    case 'metal':
      chime(1760, 0.7, 0.07)
      chime(2349, 0.5, 0.04, 0.05)
      noise(0.05, { gain: 0.08, filter: 'highpass', freq: 5000 })
      break
    case 'light':
      ;[5, 7, 9, 10, 12].forEach((n, i) => tone(YO[n], 0.22, { type: 'pulse12', gain: 0.05, delay: i * 0.045 }))
      tone(2093, 0.5, { type: 'sine', gain: 0.04, delay: 0.1 })
      break
    case 'wind':
      noise(0.55, { gain: 0.13, filter: 'bandpass', freq: 400, sweep: 3200, q: 3, attack: 0.12 })
      tone(600, 0.45, { type: 'sine', gain: 0.03, slide: 1400, delay: 0.05 })
      break
    default:
      tone(400, 0.25, { type: 'pulse50', gain: 0.05, slide: 1200 })
      noise(0.15, 0.05)
  }
}

export const sfx = {
  click: () => tone(880, 0.05, { type: 'triangle', gain: 0.06 }),
  correct: () => {
    tone(YO[3] * 2, 0.12, { type: 'pulse25', gain: 0.06 })
    tone(YO[5] * 2, 0.2, { type: 'pulse25', gain: 0.06, delay: 0.08 })
  },
  wrong: () => {
    tone(196, 0.12, { type: 'pulse50', gain: 0.06 })
    tone(185, 0.22, { type: 'pulse50', gain: 0.06, delay: 0.1, slide: 150 })
  },
  cast: () => magic('none'),
  hit: () => {
    noise(0.18, { gain: 0.2, filter: 'lowpass', freq: 3500, sweep: 400 })
    tone(140, 0.18, { type: 'triangle', gain: 0.22, slide: 50 })
  },
  hurt: () => {
    tone(330, 0.25, { type: 'pulse50', gain: 0.07, slide: 90 })
    noise(0.12, { gain: 0.1, filter: 'lowpass', freq: 1500 })
  },
  stroke: () => tone(YO[Math.floor(Math.random() * 8)], 0.1, { type: 'sine', gain: 0.05 }),
  win: () => [0, 2, 4, 5, 7].forEach((n, i) => tone(YO[n] * 2, 0.3, { type: 'pulse25', gain: 0.06, delay: i * 0.09 })),
  lose: () => [5, 3, 1, 0].forEach((n, i) => tone(YO[n] / 2, 0.4, { type: 'triangle', gain: 0.14, delay: i * 0.16 })),
  levelUp: () => {
    ;[0, 2, 4, 7, 4, 7, 9].forEach((n, i) => tone(YO[n] * 2, 0.22, { type: 'pulse25', gain: 0.06, delay: i * 0.07 }))
    tone(YO[2], 0.6, { type: 'triangle', gain: 0.12, delay: 0.42 })
  },

  /** Typewriter text blip (soft, rate-limited). `voice` = semitone shift per speaker. */
  blip,
  /** Menu cursor move. */
  cursor,
  confirm: () => {
    tone(880, 0.05, { type: 'pulse25', gain: 0.06, attack: 0.002 })
    tone(1318.5, 0.09, { type: 'pulse25', gain: 0.06, delay: 0.045, attack: 0.002 })
  },
  cancel: () => {
    tone(659.25, 0.05, { type: 'pulse25', gain: 0.055, attack: 0.002 })
    tone(440, 0.08, { type: 'pulse25', gain: 0.055, delay: 0.045, attack: 0.002 })
  },
  /** Very soft footstep (rate-limited). */
  step,
  /** Walking into a wall (rate-limited). */
  bump,
  /** Sliding shoji / door. */
  door: () => {
    noise(0.28, { gain: 0.09, filter: 'bandpass', freq: 700, sweep: 1800, q: 1.4, attack: 0.04 })
    tone(150, 0.08, { type: 'triangle', gain: 0.12, delay: 0.26, slide: 100 })
  },
  chest: () => {
    noise(0.12, { gain: 0.06, filter: 'bandpass', freq: 500, sweep: 900, q: 2 })
    ;[5, 7, 8, 10].forEach((n, i) => tone(YO[n], 0.14, { type: 'pulse25', gain: 0.06, delay: 0.12 + i * 0.07 }))
    tone(YO[12], 0.5, { type: 'pulse12', gain: 0.045, delay: 0.42 })
    chime(YO[10] * 2, 0.5, 0.03, 0.45)
  },
  /** Battle start sting. */
  encounter: () => {
    tone(160, 0.35, { type: 'pulse50', gain: 0.07, slide: 1500 })
    noise(0.35, { gain: 0.08, filter: 'bandpass', freq: 300, sweep: 4000, q: 1.5, attack: 0.2 })
    tone(440, 0.28, { type: 'pulse25', gain: 0.07, delay: 0.36 })
    tone(622.25, 0.28, { type: 'pulse25', gain: 0.06, delay: 0.36 })
    tone(110, 0.35, { type: 'triangle', gain: 0.2, delay: 0.36 })
    noise(0.12, { gain: 0.12, filter: 'lowpass', freq: 2000, delay: 0.36 })
  },
  crit: () => {
    noise(0.3, { gain: 0.24, filter: 'lowpass', freq: 5000, sweep: 300 })
    tone(1600, 0.2, { type: 'pulse50', gain: 0.07, slide: 200 })
    tone(100, 0.3, { type: 'triangle', gain: 0.25, slide: 40 })
    tone(2093, 0.25, { type: 'triangle', gain: 0.06, delay: 0.05 })
  },
  heal: () => {
    ;[2, 3, 5, 6, 7, 9].forEach((n, i) => tone(YO[n] * 2, 0.3, { type: 'triangle', gain: 0.07, delay: i * 0.06 }))
    tone(YO[7] * 2, 0.6, { type: 'sine', gain: 0.04, delay: 0.3 })
  },
  /** Elemental spell (vocab `Element`: fire, water, wood, earth, metal, light, wind, none). */
  magic,
  coin: () => {
    tone(1318.5, 0.05, { type: 'pulse12', gain: 0.05, attack: 0.002 })
    tone(1760, 0.18, { type: 'pulse12', gain: 0.05, delay: 0.05, attack: 0.002 })
  },
  /** Gentle shrine-bell chime for saving. */
  save: () => {
    chime(587.33, 1.2, 0.08)
    chime(880, 1.0, 0.06, 0.15)
    chime(1174.66, 1.2, 0.05, 0.3)
  },
}

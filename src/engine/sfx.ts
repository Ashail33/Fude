import { getState } from './store'

/** Tiny WebAudio synth for game sounds. No audio files required. */
let ctx: AudioContext | null = null

function ac(): AudioContext | null {
  if (!getState().settings.sound) return null
  if (typeof AudioContext === 'undefined') return null
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, dur: number, opts: { type?: OscillatorType; gain?: number; delay?: number; slide?: number } = {}) {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime + (opts.delay ?? 0)
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(freq, t0)
  if (opts.slide) osc.frequency.exponentialRampToValueAtTime(opts.slide, t0 + dur)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(opts.gain ?? 0.15, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function noise(dur: number, gain = 0.12) {
  const c = ac()
  if (!c) return
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  const src = c.createBufferSource()
  const g = c.createGain()
  g.gain.value = gain
  src.buffer = buf
  src.connect(g).connect(c.destination)
  src.start()
}

// Pentatonic (yo scale) notes give a Japanese feel.
const YO = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99]

export const sfx = {
  click: () => tone(880, 0.05, { type: 'triangle', gain: 0.06 }),
  correct: () => {
    tone(YO[3], 0.12, { type: 'triangle' })
    tone(YO[5], 0.18, { type: 'triangle', delay: 0.08 })
  },
  wrong: () => tone(180, 0.25, { type: 'sawtooth', gain: 0.08, slide: 110 }),
  cast: () => {
    tone(400, 0.25, { type: 'square', gain: 0.05, slide: 1200 })
    noise(0.15, 0.05)
  },
  hit: () => {
    noise(0.2, 0.18)
    tone(120, 0.2, { type: 'sine', gain: 0.2, slide: 50 })
  },
  hurt: () => tone(220, 0.3, { type: 'sawtooth', gain: 0.1, slide: 80 }),
  stroke: () => tone(YO[Math.floor(Math.random() * YO.length)], 0.1, { type: 'sine', gain: 0.05 }),
  win: () => [0, 2, 4, 5, 7].forEach((n, i) => tone(YO[n], 0.3, { type: 'triangle', delay: i * 0.1 })),
  lose: () => [5, 3, 1, 0].forEach((n, i) => tone(YO[n] / 2, 0.35, { type: 'triangle', delay: i * 0.14 })),
  levelUp: () => [0, 2, 4, 7, 4, 7].forEach((n, i) => tone(YO[n] * 1.0, 0.25, { type: 'triangle', delay: i * 0.08, gain: 0.12 })),
}

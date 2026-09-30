/**
 * Battle-only sound effects (typewriter blips, slashes, crits, spells).
 * Tiny WebAudio synth; respects the player's sound setting.
 */
import { getState } from '../engine/store'

let ctx: AudioContext | null = null

function ac(): AudioContext | null {
  if (!getState().settings.sound) return null
  if (typeof AudioContext === 'undefined') return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, dur: number, o: { type?: OscillatorType; gain?: number; delay?: number; slide?: number } = {}) {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime + (o.delay ?? 0)
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = o.type ?? 'square'
  osc.frequency.setValueAtTime(freq, t0)
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t0 + dur)
  g.gain.setValueAtTime(o.gain ?? 0.06, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function noise(dur: number, o: { gain?: number; delay?: number; hp?: number; lp?: number } = {}) {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime + (o.delay ?? 0)
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const src = c.createBufferSource()
  src.buffer = buf
  const g = c.createGain()
  g.gain.value = o.gain ?? 0.12
  let node: AudioNode = src
  if (o.hp) {
    const f = c.createBiquadFilter()
    f.type = 'highpass'
    f.frequency.value = o.hp
    node.connect(f)
    node = f
  }
  if (o.lp) {
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = o.lp
    node.connect(f)
    node = f
  }
  node.connect(g).connect(c.destination)
  src.start(t0)
}

export const bsfx = {
  blip: () => tone(1320, 0.03, { gain: 0.025 }),
  cursor: () => tone(990, 0.04, { gain: 0.035 }),
  confirm: () => {
    tone(880, 0.05, { gain: 0.04 })
    tone(1320, 0.07, { gain: 0.04, delay: 0.05 })
  },
  cancel: () => tone(440, 0.07, { gain: 0.04, slide: 330 }),
  slash: () => noise(0.14, { gain: 0.16, hp: 1800 }),
  hit: () => {
    noise(0.18, { gain: 0.2, lp: 1400 })
    tone(140, 0.18, { type: 'triangle', gain: 0.18, slide: 50 })
  },
  crit: () => {
    noise(0.1, { gain: 0.18, hp: 2500 })
    tone(1760, 0.08, { gain: 0.05, delay: 0.02 })
    tone(2350, 0.12, { gain: 0.05, delay: 0.08 })
    noise(0.28, { gain: 0.24, lp: 1200, delay: 0.1 })
  },
  miss: () => tone(700, 0.18, { type: 'triangle', gain: 0.06, slide: 300 }),
  spell: (el: string) => {
    const base = { fire: 220, water: 520, wood: 330, earth: 110, light: 880, wind: 660 }[el] ?? 440
    tone(base, 0.35, { type: 'sawtooth', gain: 0.05, slide: base * 3 })
    noise(0.4, { gain: 0.1, hp: el === 'earth' ? 0 : 600, lp: el === 'earth' ? 500 : undefined, delay: 0.1 })
  },
  weak: () => [0, 4, 7, 12].forEach((n, i) => tone(523 * 2 ** (n / 12), 0.1, { gain: 0.05, delay: i * 0.05 })),
  hurt: () => {
    noise(0.25, { gain: 0.22, lp: 900 })
    tone(200, 0.25, { type: 'sawtooth', gain: 0.08, slide: 70 })
  },
  enemyDie: () => {
    tone(600, 0.3, { gain: 0.05, slide: 1800 })
    noise(0.35, { gain: 0.08, hp: 3000, delay: 0.05 })
  },
  heal: () => [0, 4, 7, 12, 16].forEach((n, i) => tone(660 * 2 ** (n / 12), 0.12, { type: 'triangle', gain: 0.06, delay: i * 0.06 })),
  run: () => [0, 1, 2].forEach((i) => tone(300 + i * 200, 0.06, { gain: 0.04, delay: i * 0.06 })),
  intro: () => {
    for (let i = 0; i < 8; i++) tone(200 + i * 90, 0.05, { gain: 0.04, delay: i * 0.035 })
    noise(0.3, { gain: 0.1, hp: 1500, delay: 0.25 })
  },
}

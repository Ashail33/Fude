/**
 * Chip voices plus a few richer instruments (koto, pad, shakuhachi-ish
 * flute, bass, harp, taiko kit) on WebAudio. Every note is a few short-lived nodes
 * scheduled at an exact audio-clock time, so it works identically on a live
 * AudioContext and an OfflineAudioContext (used for tests/rendering).
 */

import { midiToFreq } from './notes'
import type { CompiledChannel, NoteEvent } from './sequence'

interface CtxCache {
  pulse: Map<number, PeriodicWave>
  noise?: AudioBuffer
  lfo?: OscillatorNode
}
const caches = new WeakMap<BaseAudioContext, CtxCache>()

function cache(ctx: BaseAudioContext): CtxCache {
  let c = caches.get(ctx)
  if (!c) caches.set(ctx, (c = { pulse: new Map() }))
  return c
}

/** Band-limited pulse wave with the given duty cycle (0..1). */
export function pulseWave(ctx: BaseAudioContext, duty: number): PeriodicWave {
  const c = cache(ctx)
  let w = c.pulse.get(duty)
  if (!w) {
    const n = 48
    const real = new Float32Array(n)
    const imag = new Float32Array(n)
    for (let k = 1; k < n; k++) {
      real[k] = Math.sin(2 * Math.PI * k * duty) / (Math.PI * k)
      imag[k] = (1 - Math.cos(2 * Math.PI * k * duty)) / (Math.PI * k)
    }
    w = ctx.createPeriodicWave(real, imag)
    c.pulse.set(duty, w)
  }
  return w
}

export function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const c = cache(ctx)
  if (!c.noise) {
    const len = Math.floor(ctx.sampleRate)
    c.noise = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = c.noise.getChannelData(0)
    // LFSR-ish white noise, deterministic so offline renders are repeatable.
    let s = 0x1234567
    for (let i = 0; i < len; i++) {
      s ^= s << 13
      s ^= s >>> 17
      s ^= s << 5
      d[i] = ((s >>> 0) / 0xffffffff) * 2 - 1
    }
  }
  return c.noise
}

/** One shared 5.5 Hz vibrato LFO per context (connect via a depth gain). */
export function vibratoLfo(ctx: BaseAudioContext): OscillatorNode {
  const c = cache(ctx)
  if (!c.lfo) {
    c.lfo = ctx.createOscillator()
    c.lfo.frequency.value = 5.5
    c.lfo.start()
  }
  return c.lfo
}

const DUTY: Partial<Record<CompiledChannel['inst'], number>> = { pulse12: 0.125, pulse25: 0.25, pulse50: 0.5 }

export interface VoiceOut {
  /** Where notes of this channel connect. */
  node: AudioNode
  /** Optional vibrato source (already scaled to cents) for pitched voices. */
  vib?: AudioNode
}

/**
 * Schedule one note/drum event at audio time `t` (seconds). `spb` = seconds
 * per beat (to turn the event length into seconds). `vel` overrides the
 * event velocity (the player humanises it).
 */
export function playEvent(ctx: BaseAudioContext, ch: CompiledChannel, out: VoiceOut, ev: NoteEvent, t: number, spb: number, vel = ev.vel) {
  const peak = ch.vol * vel
  if (peak <= 0) return
  const len = Math.max(0.03, ev.dur * spb * (ch.gate ?? 0.92))
  if (ch.inst === 'noise') {
    for (const d of ev.drums ?? []) drum(ctx, out.node, d, t, peak)
    return
  }
  if (ev.midi === undefined) return
  const f = midiToFreq(ev.midi)
  if (ch.inst === 'pad') return pad(ctx, out.node, [f, ...(ev.chord ?? []).map(midiToFreq)], t, len, peak)
  // Other instruments strike chord notes one by one (slightly softer).
  const freqs = [f, ...(ev.chord ?? []).map(midiToFreq)]
  const each = freqs.length > 1 ? peak / Math.sqrt(freqs.length) : peak
  for (const fr of freqs) note(ctx, ch, out, fr, t, len, each)
}

function note(ctx: BaseAudioContext, ch: CompiledChannel, out: VoiceOut, f: number, t: number, len: number, peak: number) {
  switch (ch.inst) {
    case 'koto':
      return koto(ctx, out, f, t, len, peak)
    case 'bell':
      return bell(ctx, out.node, f, t, peak)
    case 'flute':
      return flute(ctx, out.node, f, t, len, peak, ch.vib ?? 18)
    case 'bass':
      return bass(ctx, out.node, f, t, len, peak)
    case 'harp':
      return harp(ctx, out.node, f, t, len, peak)
    default:
      return chip(ctx, out, ch.inst, f, t, len, peak, ch.detune)
  }
}

function cleanup(src: AudioScheduledSourceNode, nodes: AudioNode[], vib?: AudioNode, param?: AudioParam) {
  src.onended = () => {
    if (vib && param) vib.disconnect(param)
    for (const n of nodes) n.disconnect()
  }
}

/** Second duty for the chorus layer: a different pulse width gives the classic PWM shimmer. */
const LAYER_DUTY: Record<number, number> = { 0.125: 0.25, 0.25: 0.125, 0.5: 0.25 }

function chip(ctx: BaseAudioContext, out: VoiceOut, inst: CompiledChannel['inst'], f: number, t: number, len: number, peak: number, detune?: number) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  const duty = DUTY[inst]
  if (duty) osc.setPeriodicWave(pulseWave(ctx, duty))
  else osc.type = 'triangle'
  osc.frequency.setValueAtTime(f, t)
  const tri = inst === 'tri'
  const layered = !!detune && !tri
  const lvl = layered ? peak * 0.62 : peak
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(lvl, t + (tri ? 0.003 : 0.005))
  if (!tri) g.gain.setTargetAtTime(lvl * 0.62, t + 0.005, 0.09)
  g.gain.setTargetAtTime(0, t + len, tri ? 0.012 : 0.02)
  osc.connect(g).connect(out.node)
  const vib = out.vib && !tri ? out.vib : undefined
  if (vib) vib.connect(osc.detune)
  osc.start(t)
  osc.stop(t + len + 0.15)
  const nodes: AudioNode[] = [osc, g]
  if (layered) {
    const o2 = ctx.createOscillator()
    o2.setPeriodicWave(pulseWave(ctx, LAYER_DUTY[duty ?? 0.5] ?? 0.25))
    o2.frequency.setValueAtTime(f, t)
    o2.detune.setValueAtTime(detune, t)
    o2.connect(g)
    if (vib) vib.connect(o2.detune)
    o2.start(t)
    o2.stop(t + len + 0.15)
    nodes.push(o2)
    o2.onended = () => {
      if (vib) vib.disconnect(o2.detune)
    }
  }
  cleanup(osc, nodes, vib, osc.detune)
}

/**
 * Soft pad chord: two detuned saws per note through one shared low-pass,
 * slow swell and release. One filter + gain per chord keeps it light.
 */
function pad(ctx: BaseAudioContext, dest: AudioNode, freqs: number[], t: number, len: number, peak: number) {
  const lp = ctx.createBiquadFilter()
  const g = ctx.createGain()
  lp.type = 'lowpass'
  lp.Q.value = 0.4
  lp.frequency.setValueAtTime(700, t)
  lp.frequency.linearRampToValueAtTime(1500, t + Math.min(1.2, len * 0.6))
  const lvl = peak / Math.sqrt(freqs.length)
  const atk = Math.min(0.45, len * 0.4)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(lvl, t + atk)
  g.gain.setTargetAtTime(0, t + len, 0.28)
  const end = t + len + 1.4
  const oscs: OscillatorNode[] = []
  for (const f of freqs)
    for (const cents of [-7, 7]) {
      const o = ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(f, t)
      o.detune.setValueAtTime(cents, t)
      o.connect(lp)
      o.start(t)
      o.stop(end)
      oscs.push(o)
    }
  lp.connect(g).connect(dest)
  cleanup(oscs[0], [...oscs, lp, g])
}

/**
 * Shakuhachi-ish breathy lead: triangle tone that scoops up into pitch,
 * band-passed breath noise, and a vibrato that blooms after the attack.
 */
function flute(ctx: BaseAudioContext, dest: AudioNode, f: number, t: number, len: number, peak: number, vibCents: number) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(f, t)
  osc.detune.setValueAtTime(-45, t)
  osc.detune.setTargetAtTime(0, t, 0.035)
  const vg = ctx.createGain()
  vg.gain.setValueAtTime(0, t)
  vg.gain.setTargetAtTime(vibCents, t + 0.22, 0.2)
  const lfo = vibratoLfo(ctx)
  lfo.connect(vg).connect(osc.detune)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + 0.06)
  g.gain.setTargetAtTime(peak * 0.8, t + 0.06, 0.2)
  g.gain.setTargetAtTime(0, t + len, 0.06)
  // Breath: noise band around the 2nd harmonic, strongest at the attack ("chiff").
  const n = ctx.createBufferSource()
  n.buffer = noiseBuffer(ctx)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = Math.min(6000, f * 2)
  bp.Q.value = 1.4
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(0, t)
  ng.gain.linearRampToValueAtTime(peak * 0.55, t + 0.025)
  ng.gain.setTargetAtTime(peak * 0.12, t + 0.025, 0.08)
  ng.gain.setTargetAtTime(0, t + len, 0.05)
  osc.connect(g).connect(dest)
  n.connect(bp).connect(ng).connect(dest)
  const end = t + len + 0.35
  osc.start(t)
  osc.stop(end)
  n.start(t, (f * 0.37) % 0.6)
  n.stop(end)
  osc.onended = () => {
    lfo.disconnect(vg)
    for (const x of [osc, g, vg, n, bp, ng]) x.disconnect()
  }
}

/** Plucky bass: saw through a snapping low-pass, plus a sine for weight. */
function bass(ctx: BaseAudioContext, dest: AudioNode, f: number, t: number, len: number, peak: number) {
  const saw = ctx.createOscillator()
  const sub = ctx.createOscillator()
  const lp = ctx.createBiquadFilter()
  const g = ctx.createGain()
  saw.type = 'sawtooth'
  sub.type = 'sine'
  saw.frequency.setValueAtTime(f, t)
  sub.frequency.setValueAtTime(f, t)
  lp.type = 'lowpass'
  lp.Q.value = 3
  lp.frequency.setValueAtTime(Math.min(4000, f * 10), t)
  lp.frequency.setTargetAtTime(Math.max(160, f * 2.2), t, 0.06)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + 0.004)
  g.gain.setTargetAtTime(peak * 0.7, t + 0.004, 0.12)
  g.gain.setTargetAtTime(0, t + len, 0.02)
  const sg = ctx.createGain()
  sg.gain.value = 0.7
  saw.connect(lp).connect(g)
  sub.connect(sg).connect(g)
  g.connect(dest)
  const end = t + len + 0.15
  saw.start(t)
  sub.start(t)
  saw.stop(end)
  sub.stop(end)
  cleanup(saw, [saw, sub, lp, sg, g])
}

/** Soft harp/music-box pluck for arpeggios: triangle + quiet octave sine. */
function harp(ctx: BaseAudioContext, dest: AudioNode, f: number, t: number, len: number, peak: number) {
  const a = ctx.createOscillator()
  const b = ctx.createOscillator()
  const g = ctx.createGain()
  const gb = ctx.createGain()
  a.type = 'triangle'
  b.type = 'sine'
  a.frequency.setValueAtTime(f, t)
  b.frequency.setValueAtTime(f * 2, t)
  const ring = Math.min(1.4, len + 0.7)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + 0.002)
  g.gain.setTargetAtTime(0, t + 0.002, 0.3)
  gb.gain.value = 0.3
  a.connect(g)
  b.connect(gb).connect(g)
  g.connect(dest)
  a.start(t)
  b.start(t)
  a.stop(t + ring)
  b.stop(t + ring)
  cleanup(a, [a, b, g, gb])
}

/** Koto-ish pluck: sawtooth through a closing low-pass, fast decay, tiny pitch scoop. */
function koto(ctx: BaseAudioContext, out: VoiceOut, f: number, t: number, len: number, peak: number) {
  const osc = ctx.createOscillator()
  const lp = ctx.createBiquadFilter()
  const g = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(f, t)
  osc.detune.setValueAtTime(-35, t)
  osc.detune.setTargetAtTime(0, t, 0.012)
  lp.type = 'lowpass'
  lp.Q.value = 2
  lp.frequency.setValueAtTime(Math.min(9000, f * 9), t)
  lp.frequency.setTargetAtTime(Math.max(300, f * 1.6), t, 0.07)
  const ring = Math.min(1.6, len + 0.9)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + 0.003)
  g.gain.setTargetAtTime(0, t + 0.003, 0.32)
  g.gain.setTargetAtTime(0, t + ring - 0.06, 0.02)
  osc.connect(lp).connect(g).connect(out.node)
  osc.start(t)
  osc.stop(t + ring + 0.05)
  // Plectrum (tsume) click: a few ms of band-passed noise.
  const n = ctx.createBufferSource()
  n.buffer = noiseBuffer(ctx)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = Math.min(7000, f * 4)
  bp.Q.value = 2
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(peak * 0.5, t)
  ng.gain.setTargetAtTime(0, t, 0.006)
  n.connect(bp).connect(ng).connect(out.node)
  n.start(t, (f * 0.13) % 0.8)
  n.stop(t + 0.04)
  cleanup(n, [n, bp, ng])
  cleanup(osc, [osc, lp, g])
}

/** Temple bell: fundamental + slightly detuned twin (slow beating) + inharmonic partial. */
function bell(ctx: BaseAudioContext, dest: AudioNode, f: number, t: number, peak: number) {
  const a = ctx.createOscillator()
  const b = ctx.createOscillator()
  const p = ctx.createOscillator()
  const g = ctx.createGain()
  const gp = ctx.createGain()
  a.type = b.type = p.type = 'sine'
  a.frequency.value = f
  b.frequency.value = f * 1.0035
  p.frequency.value = f * 2.76
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak * 0.5, t + 0.004)
  g.gain.setTargetAtTime(0, t + 0.004, 1.2)
  gp.gain.setValueAtTime(0, t)
  gp.gain.linearRampToValueAtTime(peak * 0.35, t + 0.002)
  gp.gain.setTargetAtTime(0, t + 0.002, 0.25)
  a.connect(g)
  b.connect(g)
  p.connect(gp)
  g.connect(dest)
  gp.connect(dest)
  const end = t + 5
  for (const o of [a, b, p]) {
    o.start(t)
    o.stop(end)
  }
  cleanup(a, [a, b, p, g, gp])
}

function drum(ctx: BaseAudioContext, dest: AudioNode, kind: string, t: number, peak: number) {
  switch (kind) {
    case 'k':
    case 't':
      return membrane(ctx, dest, t, peak, kind === 'k' ? { from: 150, to: 42, sweep: 0.11, tau: 0.055, lvl: 2.2, type: 'sine' } : { from: 180, to: 85, sweep: 0.16, tau: 0.07, lvl: 1.6, type: 'triangle' }, kind === 'k' ? 0.4 : 0)
    case 'T':
      // Taiko: big low skin with a long body and a woody slap on top.
      membrane(ctx, dest, t, peak, { from: 110, to: 52, sweep: 0.22, tau: 0.16, lvl: 2.4, type: 'sine' }, 0)
      return hiss(ctx, dest, t, peak, { type: 'bandpass', freq: 420, q: 1.2, tau: 0.03, dur: 0.12, level: 0.9 })
    case 'b':
      // Tsuzumi "pon": a bright, pitch-dropping hand drum.
      membrane(ctx, dest, t, peak, { from: 560, to: 320, sweep: 0.09, tau: 0.08, lvl: 0.9, type: 'sine' }, 0)
      return hiss(ctx, dest, t, peak, { type: 'bandpass', freq: 1800, q: 3, tau: 0.008, dur: 0.05, level: 0.5 })
    case 'w':
      // Hyōshigi / wood block: two hard, high, very short partials.
      membrane(ctx, dest, t, peak, { from: 1900, to: 1850, sweep: 0.03, tau: 0.018, lvl: 0.7, type: 'triangle' }, 0)
      return hiss(ctx, dest, t, peak, { type: 'bandpass', freq: 2800, q: 5, tau: 0.01, dur: 0.05, level: 0.6 })
    case 'x':
      return hiss(ctx, dest, t, peak, { type: 'highpass', freq: 4200, q: 0.7, tau: 0.45, dur: 1.6, level: 0.55 })
    case 'c':
      // Clap: three quick bursts then a short tail.
      for (const [dt, lv] of [[0, 0.8], [0.011, 0.7], [0.022, 1]] as const) hiss(ctx, dest, t + dt, peak, { type: 'bandpass', freq: 1300, q: 1.1, tau: dt < 0.02 ? 0.006 : 0.05, dur: 0.2, level: lv })
      return
    case 's':
      // Snare: noise plus a short tonal body.
      membrane(ctx, dest, t, peak, { from: 200, to: 160, sweep: 0.05, tau: 0.035, lvl: 0.7, type: 'triangle' }, 0)
      return hiss(ctx, dest, t, peak, { type: 'bandpass', freq: 1700, q: 0.6, tau: 0.045, dur: 0.25, level: 1.5 })
    case 'o':
      return hiss(ctx, dest, t, peak, { type: 'highpass', freq: 6000, q: 0.7, tau: 0.08, dur: 0.4, level: 0.5 })
    default:
      return hiss(ctx, dest, t, peak, { type: 'highpass', freq: 7500, q: 0.7, tau: 0.012, dur: 0.08, level: 0.55 })
  }
}

interface Membrane {
  from: number
  to: number
  sweep: number
  tau: number
  lvl: number
  type: OscillatorType
}

/** Pitched drum skin (kick, toms, taiko, tsuzumi); `click` adds a beater transient. */
function membrane(ctx: BaseAudioContext, dest: AudioNode, t: number, peak: number, m: Membrane, click: number) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = m.type
  o.frequency.setValueAtTime(m.from, t)
  o.frequency.exponentialRampToValueAtTime(m.to, t + m.sweep)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak * m.lvl, t + 0.003)
  g.gain.setTargetAtTime(0, t + 0.003, m.tau)
  o.connect(g).connect(dest)
  o.start(t)
  o.stop(t + Math.max(0.3, m.tau * 7))
  cleanup(o, [o, g])
  if (click > 0) hiss(ctx, dest, t, peak, { type: 'highpass', freq: 3000, q: 0.7, tau: 0.004, dur: 0.03, level: click })
}

interface Hiss {
  type: BiquadFilterType
  freq: number
  q: number
  tau: number
  dur: number
  level: number
}

/** Filtered noise hit (hats, snare wires, claps, cymbals). */
function hiss(ctx: BaseAudioContext, dest: AudioNode, t: number, peak: number, h: Hiss) {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx)
  const flt = ctx.createBiquadFilter()
  const g = ctx.createGain()
  flt.type = h.type
  flt.frequency.value = h.freq
  flt.Q.value = h.q
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak * h.level, t + 0.002)
  g.gain.setTargetAtTime(0, t + 0.002, h.tau)
  src.connect(flt).connect(g).connect(dest)
  // Offset derived from the time (not Math.random) so offline renders repeat.
  src.start(t, (t * 7.31) % 0.7)
  src.stop(t + h.dur)
  cleanup(src, [src, flt, g])
}

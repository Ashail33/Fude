/**
 * Chip voices on WebAudio. Every note is a couple of short-lived nodes
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
 * per beat (to turn the event length into seconds).
 */
export function playEvent(ctx: BaseAudioContext, ch: CompiledChannel, out: VoiceOut, ev: NoteEvent, t: number, spb: number) {
  const peak = ch.vol * ev.vel
  if (peak <= 0) return
  const len = Math.max(0.03, ev.dur * spb * (ch.gate ?? 0.92))
  if (ch.inst === 'noise') {
    for (const d of ev.drums ?? []) drum(ctx, out.node, d, t, peak)
    return
  }
  if (ev.midi === undefined) return
  const f = midiToFreq(ev.midi)
  switch (ch.inst) {
    case 'koto':
      return koto(ctx, out, f, t, len, peak)
    case 'bell':
      return bell(ctx, out.node, f, t, peak)
    default:
      return chip(ctx, out, ch.inst, f, t, len, peak)
  }
}

function cleanup(src: AudioScheduledSourceNode, nodes: AudioNode[], vib?: AudioNode, param?: AudioParam) {
  src.onended = () => {
    if (vib && param) vib.disconnect(param)
    for (const n of nodes) n.disconnect()
  }
}

function chip(ctx: BaseAudioContext, out: VoiceOut, inst: CompiledChannel['inst'], f: number, t: number, len: number, peak: number) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  const duty = DUTY[inst]
  if (duty) osc.setPeriodicWave(pulseWave(ctx, duty))
  else osc.type = 'triangle'
  osc.frequency.setValueAtTime(f, t)
  const tri = inst === 'tri'
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + (tri ? 0.003 : 0.005))
  if (!tri) g.gain.setTargetAtTime(peak * 0.62, t + 0.005, 0.09)
  g.gain.setTargetAtTime(0, t + len, tri ? 0.012 : 0.02)
  osc.connect(g).connect(out.node)
  if (out.vib && !tri) out.vib.connect(osc.detune)
  osc.start(t)
  osc.stop(t + len + 0.15)
  cleanup(osc, [osc, g], out.vib && !tri ? out.vib : undefined, osc.detune)
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
  if (kind === 'k' || kind === 't') {
    const kick = kind === 'k'
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = kick ? 'sine' : 'triangle'
    o.frequency.setValueAtTime(kick ? 150 : 180, t)
    o.frequency.exponentialRampToValueAtTime(kick ? 42 : 85, t + (kick ? 0.11 : 0.16))
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(peak * (kick ? 2.2 : 1.6), t + 0.003)
    g.gain.setTargetAtTime(0, t + 0.003, kick ? 0.055 : 0.07)
    o.connect(g).connect(dest)
    o.start(t)
    o.stop(t + 0.35)
    cleanup(o, [o, g])
    return
  }
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer(ctx)
  const flt = ctx.createBiquadFilter()
  const g = ctx.createGain()
  let tau = 0.012
  let dur = 0.08
  let level = 0.55
  if (kind === 's') {
    flt.type = 'bandpass'
    flt.frequency.value = 1700
    flt.Q.value = 0.6
    tau = 0.045
    dur = 0.25
    level = 1.5
  } else {
    flt.type = 'highpass'
    flt.frequency.value = kind === 'o' ? 6000 : 7500
    if (kind === 'o') {
      tau = 0.08
      dur = 0.4
      level = 0.5
    }
  }
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak * level, t + 0.002)
  g.gain.setTargetAtTime(0, t + 0.002, tau)
  src.connect(flt).connect(g).connect(dest)
  src.start(t, Math.random() * 0.7)
  src.stop(t + dur)
  cleanup(src, [src, flt, g])
}

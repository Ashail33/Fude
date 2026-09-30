/**
 * "Animalese" talk syllables on WebAudio: a glottal source (buzz, reed,
 * soft tone, pure tone or whisper) with a pitch contour, vibrato and breath
 * noise, shaped into a vowel by a three-formant filter bank, with a short
 * consonant onset (plosive click, hiss, nasal hum or glide) and optional
 * grit (growl + saturation). Works on a live AudioContext and an
 * OfflineAudioContext alike. Voice data lives in ./voices.ts.
 */

import { noiseBuffer } from './synth'
import { blipFreq, BODY_MIX, contourSemis, FORMANT_AMP, formantBandwidths, formantLevel, formantsFor, onsetFormants, sourceSeries, syllableOf, type VoiceProfile, type VoiceSource } from './voices'

/** Peak level of a syllable (before the profile's trim) — clearly audible next to the SFX. */
export const TALK_LEVEL = 0.26
/** RMS the formant bank is normalised to before the envelope (≈ unit peak). */
const NORM_RMS = 0.3

const waves = new WeakMap<BaseAudioContext, Map<VoiceSource, PeriodicWave>>()

/** The source waveform (see `sourceSeries`), cached per context. */
function sourceWave(c: BaseAudioContext, src: VoiceSource): PeriodicWave {
  let m = waves.get(c)
  if (!m) waves.set(c, (m = new Map()))
  let w = m.get(src)
  if (!w) {
    const imag = sourceSeries(src)
    w = c.createPeriodicWave(new Float32Array(imag.length), imag, { disableNormalization: true })
    m.set(src, w)
  }
  return w
}

const curves = new Map<number, Float32Array<ArrayBuffer>>()

/** Soft-clip curve (tanh) for a drive amount, normalised to ±1. */
function satCurve(drive: number): Float32Array<ArrayBuffer> {
  const k = Math.round(drive * 10) / 10
  let c = curves.get(k)
  if (!c) {
    c = new Float32Array(1024)
    const norm = Math.tanh(k)
    for (let i = 0; i < c.length; i++) {
      const x = (i / (c.length - 1)) * 2 - 1
      c[i] = Math.tanh(k * x) / norm
    }
    curves.set(k, c)
  }
  return c
}

export interface SyllableOpts {
  /** Lift the pitch (end of a question). */
  question?: boolean
  /** Loudness multiplier. */
  level?: number
  /** Pitch multiplier. */
  pitch?: number
}

/**
 * Schedule one syllable for character `ch` in voice `p`, starting at `t0`
 * on `dest`. Returns the time it ends.
 */
export function playSyllable(c: BaseAudioContext, dest: AudioNode, t0: number, p: VoiceProfile, ch: string, opts: SyllableOpts = {}): number {
  const syl = syllableOf(ch)
  const f0 = blipFreq(p, ch, opts.question) * (opts.pitch ?? 1)
  const len = p.len
  const pre = syl.onset === 'fric' ? Math.min(0.035, len * 0.45) : syl.onset === 'stop' ? 0.012 : 0
  const tv = t0 + pre
  const end = tv + len
  const stopAt = end + 0.03
  const nodes: AudioNode[] = []
  const sources: AudioScheduledSourceNode[] = []
  const gain = (v: number) => {
    const g = c.createGain()
    g.gain.value = v
    nodes.push(g)
    return g
  }

  // ─── Source: tone with contour + vibrato, and/or breath noise
  const mix = gain(1)
  if (p.src !== 'whisper') {
    const osc = c.createOscillator()
    osc.setPeriodicWave(sourceWave(c, p.src))
    const [s0, s1, s2] = contourSemis(p.contour, p.bend ?? 3)
    const at = (s: number) => f0 * Math.pow(2, s / 12)
    osc.frequency.setValueAtTime(at(s0), tv)
    osc.frequency.linearRampToValueAtTime(at(s1), tv + len * 0.45)
    osc.frequency.linearRampToValueAtTime(at(s2), end)
    if (p.vib) {
      const lfo = c.createOscillator()
      lfo.frequency.value = p.vibRate ?? 6
      lfo.connect(gain(p.vib)).connect(osc.detune)
      sources.push(lfo)
    }
    osc.connect(mix)
    sources.push(osc)
  }
  const breath = p.src === 'whisper' ? 1 : (p.breath ?? 0)
  let noise: AudioBufferSourceNode | null = null
  if (breath > 0) {
    const n = (noise = c.createBufferSource())
    n.buffer = noiseBuffer(c)
    n.loop = true
    // Noise is far denser than a harmonic source: scale it into the same range.
    n.connect(gain(p.src === 'whisper' ? 1 : breath * 0.5)).connect(mix)
    sources.push(n)
  }

  // ─── Formant bank (moving in from the onset for glides and nasals)
  const fs = formantsFor(p, syl.v)
  const from = onsetFormants(p, syl)
  const bws = formantBandwidths(p, f0)
  const sum = gain(1)
  fs.forEach((f, k) => {
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = f / bws[k]
    if (from) {
      bp.frequency.setValueAtTime(from[k], tv)
      bp.frequency.linearRampToValueAtTime(f, tv + Math.min(0.045, len * 0.5))
    } else bp.frequency.setValueAtTime(f, tv)
    nodes.push(bp)
    mix.connect(bp).connect(gain(FORMANT_AMP[k])).connect(sum)
  })
  const body = c.createBiquadFilter()
  body.type = 'lowpass'
  body.frequency.value = fs[1]
  nodes.push(body)
  mix.connect(body).connect(gain(BODY_MIX)).connect(sum)

  // ─── Normalise, grit, envelope
  const rms = formantLevel(p, f0, syl.v, c.sampleRate / 2)
  let head: AudioNode = sum.connect(gain(Math.min(40, NORM_RMS / Math.max(rms, 0.004))))
  const grit = p.grit ?? 0
  if (grit > 0) {
    const ws = c.createWaveShaper()
    ws.curve = satCurve(1 + grit * 5)
    nodes.push(ws)
    head = head.connect(ws)
  }
  const peak = TALK_LEVEL * (p.gain ?? 1) * (opts.level ?? 1) * (syl.v === 'n' ? 0.7 : 1)
  const env = gain(0)
  const atk = syl.onset === 'nasal' || syl.v === 'n' ? 0.018 : 0.007
  env.gain.setValueAtTime(0, tv)
  env.gain.linearRampToValueAtTime(peak, tv + atk)
  env.gain.setTargetAtTime(peak * 0.75, tv + atk, len * 0.35)
  env.gain.linearRampToValueAtTime(0, end)
  head = head.connect(env)
  if (grit > 0.3) {
    // Growl: fast amplitude roughness.
    const am = c.createOscillator()
    am.frequency.value = 26 + grit * 30
    const depth = grit * 0.45
    const g = gain(1 - depth)
    am.connect(gain(depth)).connect(g.gain)
    head = head.connect(g)
    sources.push(am)
  }
  head.connect(dest)

  // ─── Consonant onset: plosive burst or hiss before the vowel
  if (syl.onset === 'stop' || syl.onset === 'fric') {
    const n = c.createBufferSource()
    n.buffer = noiseBuffer(c)
    const flt = c.createBiquadFilter()
    const hiss = syl.c === 's' || syl.c === 'z' || syl.c === 'v'
    const place = syl.c === 'p' || syl.c === 'b' ? 900 : syl.c === 't' || syl.c === 'd' ? 3800 : syl.c === 'h' ? fs[1] : 2200
    flt.type = hiss ? 'highpass' : 'bandpass'
    flt.frequency.value = Math.min(9000, hiss ? 3800 * Math.sqrt(p.formant) : place * Math.sqrt(p.formant))
    flt.Q.value = hiss ? 0.7 : 1.2
    const voiced = 'gzdbv'.includes(syl.c)
    const lvl = TALK_LEVEL * (p.gain ?? 1) * (opts.level ?? 1) * (hiss ? 0.55 : syl.onset === 'fric' ? 0.4 : voiced ? 0.45 : 0.7)
    const g = gain(0)
    const burstEnd = tv + (syl.onset === 'stop' ? 0.004 : 0.01)
    g.gain.setValueAtTime(0, t0)
    g.gain.linearRampToValueAtTime(lvl, t0 + Math.min(0.004, pre * 0.4))
    g.gain.linearRampToValueAtTime(syl.onset === 'fric' ? lvl * 0.8 : lvl * 0.2, tv)
    g.gain.linearRampToValueAtTime(0, burstEnd)
    nodes.push(flt)
    n.connect(flt).connect(g).connect(dest)
    n.start(t0, (t0 * 7.3 + f0) % 0.8)
    n.stop(burstEnd + 0.01)
    n.onended = () => n.disconnect()
  }

  for (const s of sources) {
    if (s === noise) noise.start(tv, (tv * 3.7 + f0 * 0.01) % 0.8)
    else s.start(tv)
    s.stop(stopAt)
  }
  sources[0].onended = () => {
    for (const s of sources) s.disconnect()
    for (const n of nodes) n.disconnect()
  }
  return end
}

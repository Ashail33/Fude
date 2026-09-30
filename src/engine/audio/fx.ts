/**
 * Shared music effects, one set per AudioContext: a small generated
 * convolution reverb (no impulse file: decaying stereo noise, darkened over
 * time) and a ping-pong stereo delay. Players feed them through per-channel
 * send gains; the returns mix into the same destination as the dry signal
 * (the music bus), so the music volume and fades still apply.
 *
 * Kept cheap for phones: one ConvolverNode with a short impulse (shorter
 * still on low-core devices) and two DelayNodes.
 */

export interface MusicFx {
  /** Reverb input (send here). */
  reverb: AudioNode
  /** Stereo delay input (send here). */
  delay: AudioNode
  /** Set the delay time (seconds), e.g. a dotted eighth of the current track. */
  setDelayTime(secs: number): void
}

const cache = new WeakMap<BaseAudioContext, MusicFx>()

function lowPower(): boolean {
  const n = typeof navigator === 'undefined' ? 8 : (navigator.hardwareConcurrency ?? 4)
  return n <= 4
}

/**
 * Stereo reverb impulse: exponentially decaying noise with a short pre-delay
 * and progressive one-pole damping (tail gets darker, like a wooden hall).
 * Deterministic so offline renders are repeatable.
 */
export function reverbImpulse(ctx: BaseAudioContext, seconds: number, decay = 3): AudioBuffer {
  const rate = ctx.sampleRate
  const len = Math.max(1, Math.floor(rate * seconds))
  const buf = ctx.createBuffer(2, len, rate)
  const pre = Math.floor(rate * 0.012)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    let s = 0x2545f491 + c * 0x9e3779b9
    let lp = 0
    for (let i = pre; i < len; i++) {
      s ^= s << 13
      s ^= s >>> 17
      s ^= s << 5
      const white = ((s >>> 0) / 0xffffffff) * 2 - 1
      const x = (i - pre) / (len - pre)
      // Damping coefficient: bright at first, duller as it decays.
      const k = 0.55 - 0.45 * x
      lp += k * (white - lp)
      d[i] = lp * Math.pow(1 - x, decay) * 0.9
    }
  }
  return buf
}

/** The effects for `ctx`, created on first use with returns into `dest`. */
export function musicFx(ctx: BaseAudioContext, dest: AudioNode): MusicFx {
  const hit = cache.get(ctx)
  if (hit) return hit
  const lite = lowPower()

  // ─── Reverb: high-passed send (keeps the bass dry and clean) → convolver.
  const revIn = ctx.createGain()
  const revHp = ctx.createBiquadFilter()
  revHp.type = 'highpass'
  revHp.frequency.value = 220
  const conv = ctx.createConvolver()
  conv.normalize = true
  conv.buffer = reverbImpulse(ctx, lite ? 1.1 : 1.7, lite ? 2.6 : 3)
  const revOut = ctx.createGain()
  revOut.gain.value = 0.55
  revIn.connect(revHp).connect(conv).connect(revOut).connect(dest)

  // ─── Ping-pong delay: L and R taps feed each other through a low-pass.
  const dIn = ctx.createGain()
  const dl = ctx.createDelay(2)
  const dr = ctx.createDelay(2)
  const fb = ctx.createGain()
  const damp = ctx.createBiquadFilter()
  const merge = ctx.createChannelMerger(2)
  const dOut = ctx.createGain()
  dl.delayTime.value = dr.delayTime.value = 0.36
  fb.gain.value = 0.38
  damp.type = 'lowpass'
  damp.frequency.value = 2600
  dOut.gain.value = 0.5
  dIn.connect(dl)
  dl.connect(merge, 0, 0)
  dl.connect(dr)
  dr.connect(merge, 0, 1)
  dr.connect(damp).connect(fb).connect(dl)
  merge.connect(dOut).connect(dest)

  const fx: MusicFx = {
    reverb: revIn,
    delay: dIn,
    setDelayTime(secs) {
      const t = Math.min(1.5, Math.max(0.05, secs))
      dl.delayTime.setTargetAtTime(t, ctx.currentTime, 0.05)
      dr.delayTime.setTargetAtTime(t, ctx.currentTime, 0.05)
    },
  }
  cache.set(ctx, fx)
  return fx
}

/**
 * Plays one compiled track into a destination node using lookahead
 * scheduling: the caller periodically calls `schedule(until)` and every
 * event whose start falls before `until` (audio-clock seconds) is queued
 * on the audio thread with a sample-accurate start time.
 *
 * Adds a little life on top of the sequence: a one-off intro before the
 * loop, humanised timing/velocity (deterministic, so renders repeat), a
 * metric accent, and per-channel sends into the shared reverb/delay.
 */

import { musicFx } from './fx'
import { accent, eventsInWindowWithIntro, humanize, secondsPerBeat, timeToBeat, type CompiledChannel, type CompiledTrack } from './sequence'
import { playEvent, vibratoLfo, type VoiceOut } from './synth'

/** Default reverb / delay sends per instrument (a channel's `rev` / `dly` override). */
const SENDS: Record<CompiledChannel['inst'], [number, number]> = {
  pulse12: [0.22, 0.12],
  pulse25: [0.22, 0.14],
  pulse50: [0.25, 0.16],
  tri: [0.04, 0],
  noise: [0.1, 0],
  koto: [0.35, 0.14],
  bell: [0.6, 0.1],
  pad: [0.5, 0],
  flute: [0.45, 0.26],
  bass: [0, 0],
  harp: [0.4, 0.18],
}

/** Timing jitter (seconds) per instrument: drums tight, leads loose. */
const JITTER: Partial<Record<CompiledChannel['inst'], number>> = { noise: 0.003, tri: 0.002, bass: 0.002, pad: 0 }

export class TrackPlayer {
  readonly ctx: BaseAudioContext
  readonly track: CompiledTrack
  /** Per-player gain (used for fades). */
  readonly out: GainNode
  /** Effect sends of this player (faded together with `out`). */
  private readonly sends: GainNode[] = []
  readonly startTime: number
  private readonly voices: VoiceOut[]
  private readonly extra: AudioNode[] = []
  private readonly vibs: AudioNode[] = []
  private cursor = 0
  private disposed = false

  constructor(ctx: BaseAudioContext, dest: AudioNode, track: CompiledTrack, startTime: number, gain = 1) {
    this.ctx = ctx
    this.track = track
    this.startTime = startTime
    this.out = ctx.createGain()
    this.out.gain.value = gain
    this.out.connect(dest)
    const fx = musicFx(ctx, dest)
    fx.setDelayTime(secondsPerBeat(track.bpm) * 0.75)
    const revBus = ctx.createGain()
    const dlyBus = ctx.createGain()
    revBus.gain.value = dlyBus.gain.value = gain
    revBus.connect(fx.reverb)
    dlyBus.connect(fx.delay)
    this.sends.push(revBus, dlyBus)
    this.voices = track.channels.map((c) => {
      const mix = ctx.createGain()
      mix.connect(this.out)
      this.extra.push(mix)
      let node: AudioNode = mix
      if (c.pan) {
        const p = ctx.createStereoPanner()
        p.pan.value = c.pan
        p.connect(mix)
        this.extra.push(p)
        node = p
      }
      const [rev, dly] = SENDS[c.inst]
      for (const [amt, bus] of [
        [c.rev ?? rev, revBus],
        [c.dly ?? dly, dlyBus],
      ] as const) {
        if (amt <= 0) continue
        const s = ctx.createGain()
        s.gain.value = amt
        mix.connect(s).connect(bus)
        this.extra.push(s)
      }
      let vib: AudioNode | undefined
      if (c.vib && c.inst !== 'flute') {
        const depth = ctx.createGain()
        depth.gain.value = c.vib
        vibratoLfo(ctx).connect(depth)
        this.extra.push(depth)
        this.vibs.push(depth)
        vib = depth
      }
      return { node, vib }
    })
  }

  get spb() {
    return secondsPerBeat(this.track.bpm)
  }

  /** Total beats of a non-looping track (intro + body). */
  private get totalBeats() {
    return this.track.introBeats + this.track.beats
  }

  /** Audio time at which a non-looping track has finished sounding. */
  get endTime() {
    return this.track.loop ? Infinity : this.startTime + this.totalBeats * this.spb
  }

  /** Queue every event that starts before audio time `until`. */
  schedule(until: number) {
    const { track } = this
    let to = timeToBeat(until, track.bpm, this.startTime)
    if (!track.loop) to = Math.min(to, this.totalBeats)
    // If we fell behind (e.g. the main thread stalled), skip rather than cram late notes.
    const now = timeToBeat(this.ctx.currentTime, track.bpm, this.startTime)
    if (this.cursor < now - 0.05) this.cursor = Math.max(this.cursor, now)
    if (to <= this.cursor) return
    const spb = this.spb
    const floor = this.ctx.currentTime
    track.channels.forEach((ch, i) => {
      const jit = JITTER[ch.inst] ?? 0.006
      const acc = ch.inst !== 'pad' && ch.inst !== 'bell'
      for (const { ev, abs } of eventsInWindowWithIntro(ch.introEvents, track.introBeats, ch.events, track.beats, this.cursor, to, track.loop)) {
        const t = Math.max(floor, this.startTime + abs * spb + humanize(abs, i) * jit)
        const vel = ev.vel * (1 + humanize(abs, i, 1) * 0.07) * (acc ? accent(abs - track.introBeats) : 1)
        playEvent(this.ctx, ch, this.voices[i], ev, t, spb, vel)
      }
    })
    this.cursor = to
  }

  private gains() {
    return [this.out, ...this.sends].map((n) => n.gain)
  }

  /** Fade to silence over `secs` and release the nodes afterwards. */
  fadeOut(secs: number) {
    const t = this.ctx.currentTime
    for (const g of this.gains()) {
      g.cancelScheduledValues(t)
      g.setValueAtTime(g.value, t)
      g.linearRampToValueAtTime(0, t + secs)
    }
    this.cursor = Infinity
    setTimeout(() => this.dispose(), (secs + 2) * 1000)
  }

  fadeIn(secs: number, to = 1) {
    for (const g of this.gains()) {
      g.setValueAtTime(0, this.startTime)
      g.linearRampToValueAtTime(to, this.startTime + secs)
    }
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    const lfo = vibratoLfo(this.ctx)
    for (const v of this.vibs) lfo.disconnect(v)
    for (const n of this.extra) n.disconnect()
    for (const n of this.sends) n.disconnect()
    this.out.disconnect()
  }
}

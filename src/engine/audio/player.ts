/**
 * Plays one compiled track into a destination node using lookahead
 * scheduling: the caller periodically calls `schedule(until)` and every
 * event whose start falls before `until` (audio-clock seconds) is queued
 * on the audio thread with a sample-accurate start time.
 */

import { eventsInWindow, secondsPerBeat, timeToBeat, type CompiledTrack } from './sequence'
import { playEvent, vibratoLfo, type VoiceOut } from './synth'

export class TrackPlayer {
  readonly ctx: BaseAudioContext
  readonly track: CompiledTrack
  /** Per-player gain (used for fades). */
  readonly out: GainNode
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
    this.voices = track.channels.map((c) => {
      let node: AudioNode = this.out
      if (c.pan) {
        const p = ctx.createStereoPanner()
        p.pan.value = c.pan
        p.connect(this.out)
        this.extra.push(p)
        node = p
      }
      let vib: AudioNode | undefined
      if (c.vib) {
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

  /** Audio time at which a non-looping track has finished sounding. */
  get endTime() {
    return this.track.loop ? Infinity : this.startTime + this.track.beats * this.spb
  }

  /** Queue every event that starts before audio time `until`. */
  schedule(until: number) {
    const { track } = this
    let to = timeToBeat(until, track.bpm, this.startTime)
    if (!track.loop) to = Math.min(to, track.beats)
    // If we fell behind (e.g. the main thread stalled), skip rather than cram late notes.
    const now = timeToBeat(this.ctx.currentTime, track.bpm, this.startTime)
    if (this.cursor < now - 0.05) this.cursor = Math.max(this.cursor, now)
    if (to <= this.cursor) return
    const spb = this.spb
    track.channels.forEach((ch, i) => {
      for (const { ev, abs } of eventsInWindow(ch.events, track.beats, this.cursor, to, track.loop)) {
        playEvent(this.ctx, ch, this.voices[i], ev, this.startTime + abs * spb, spb)
      }
    })
    this.cursor = to
  }

  /** Fade to silence over `secs` and release the nodes afterwards. */
  fadeOut(secs: number) {
    const t = this.ctx.currentTime
    const g = this.out.gain
    g.cancelScheduledValues(t)
    g.setValueAtTime(g.value, t)
    g.linearRampToValueAtTime(0, t + secs)
    this.cursor = Infinity
    setTimeout(() => this.dispose(), (secs + 2) * 1000)
  }

  fadeIn(secs: number, to = 1) {
    const g = this.out.gain
    g.setValueAtTime(0, this.startTime)
    g.linearRampToValueAtTime(to, this.startTime + secs)
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    const lfo = vibratoLfo(this.ctx)
    for (const v of this.vibs) lfo.disconnect(v)
    for (const n of this.extra) n.disconnect()
    this.out.disconnect()
  }
}

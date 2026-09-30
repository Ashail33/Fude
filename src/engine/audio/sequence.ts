/**
 * Tiny tracker notation + sequencer math (pure; no WebAudio).
 *
 * A channel is a whitespace-separated string of tokens:
 *   `D5:1`     note D5 for 1 beat (beats are quarter notes)
 *   `E5`       duration omitted → reuse the previous duration
 *   `r:2`      rest for 2 beats
 *   `~:1`      tie: lengthen the previous note by 1 beat
 *   `1/3`      durations may be decimals (`.5`) or fractions (`1/3`)
 *   `k s h o t` drum hits on noise channels (kick, snare, hat, open hat, tom); `k+h` = both
 *   `T b x w c` more drums: taiko, tsuzumi "pon", crash, wood block (hyōshigi), clap
 *   `D4+F4+A4` a chord (pads): several notes struck together
 *   `|`        bar line (ignored by the player; used by tests to check bar lengths)
 *   `( … )x4`  repeat a group
 */

import { chordTones, midiToName, noteToMidi } from './notes'

/**
 * Instruments. Chip voices (`pulse*`, `tri`, `noise`) plus richer ones:
 * `koto` pluck, `bell`, `pad` (detuned saw chords), `flute` (breathy
 * shakuhachi-like lead with delayed vibrato), `bass` (plucky filtered saw),
 * `harp` (soft sine/triangle pluck for arpeggios).
 */
export type Inst = 'pulse12' | 'pulse25' | 'pulse50' | 'tri' | 'noise' | 'koto' | 'bell' | 'pad' | 'flute' | 'bass' | 'harp'

export interface ChannelDef {
  inst: Inst
  /** Channel volume 0..1 (before the music master). */
  vol: number
  seq: string
  /** Stereo position -1..1. */
  pan?: number
  /** Fraction of each note's length that sounds (staccato < 1). Default 0.92. */
  gate?: number
  /** Vibrato depth in cents. */
  vib?: number
  /** Classic chiptune echo: re-play each note `beats` later at `vol` × volume. */
  echo?: { beats: number; vol: number }
  /** Chorus layer: a second oscillator detuned by this many cents (chip voices). */
  detune?: number
  /** Reverb / stereo-delay send levels 0..1 (master effects; default per instrument). */
  rev?: number
  dly?: number
  /** Played once before the loop starts (same notation; all intros of a track should be equally long). */
  intro?: string
}

export interface TrackDef {
  bpm: number
  loop: boolean
  beatsPerBar?: number
  channels: ChannelDef[]
}

export interface NoteEvent {
  /** Start, in beats from the start of the loop. */
  beat: number
  /** Length in beats. */
  dur: number
  /** MIDI note (melodic channels). */
  midi?: number
  /** Further notes struck with `midi` (chords). */
  chord?: number[]
  /** Drum hits (noise channels), e.g. ['k','h']. */
  drums?: string[]
  /** Velocity 0..1. */
  vel: number
}

export interface CompiledChannel extends ChannelDef {
  events: NoteEvent[]
  length: number
  /** Events of the one-off intro (beats from the start of the intro). */
  introEvents: NoteEvent[]
}

export interface CompiledTrack {
  bpm: number
  loop: boolean
  /** Loop length in beats (= every channel's length). */
  beats: number
  /** Length of the one-off intro in beats (0 = none); the loop starts after it. */
  introBeats: number
  channels: CompiledChannel[]
}

const DRUMS = new Set(['k', 's', 'h', 'o', 't', 'T', 'b', 'x', 'w', 'c'])

/** Expand `( … )xN` groups (innermost first). */
export function expandRepeats(seq: string): string {
  const re = /\(([^()]*)\)x(\d+)/g
  let prev = ''
  let s = seq
  while (s !== prev) {
    prev = s
    s = s.replace(re, (_m, body: string, n: string) => Array(Number(n)).fill(body).join(' '))
  }
  if (/[()]/.test(s)) throw new Error(`Unbalanced repeat group in: ${seq.slice(0, 60)}…`)
  return s
}

export function parseDur(s: string): number {
  if (s.includes('/')) {
    const [a, b] = s.split('/').map(Number)
    return a / b
  }
  const v = Number(s)
  if (!Number.isFinite(v) || v <= 0) throw new Error(`Bad duration: "${s}"`)
  return v
}

/** Parse a channel string into events. Returns events and total length in beats. */
export function parseSeq(seq: string): { events: NoteEvent[]; length: number } {
  const events: NoteEvent[] = []
  let beat = 0
  let dur = 1
  let last: NoteEvent | null = null
  for (const tok of expandRepeats(seq).split(/\s+/)) {
    if (!tok || tok === '|') continue
    const [head, d] = tok.split(':')
    if (d !== undefined) dur = parseDur(d)
    if (head === 'r') {
      last = null
    } else if (head === '~') {
      if (!last) throw new Error('Tie with nothing to tie to')
      last.dur += dur
    } else {
      const parts = head.split('+')
      if (parts.every((p) => DRUMS.has(p))) {
        last = { beat, dur, drums: parts, vel: 1 }
      } else if (parts.length > 1) {
        const [m, ...rest] = parts.map(noteToMidi)
        last = { beat, dur, midi: m, chord: rest, vel: 1 }
      } else {
        last = { beat, dur, midi: noteToMidi(head), vel: 1 }
      }
      events.push(last)
    }
    beat += dur
  }
  return { events, length: beat }
}

/** Sum of beats in each `|`-separated bar (for tests / authoring checks). */
export function barLengths(seq: string): number[] {
  return expandRepeats(seq)
    .split('|')
    .map((bar) => bar.trim())
    .filter(Boolean)
    .map((bar) => parseSeq(bar).length)
}

/**
 * Generate a channel from a chord progression and a one-bar pattern of
 * chord-tone indices (0 = root, 1 = next chord tone, …; `r` rest, `~` tie).
 * `prog` is one chord per bar; `C,G` splits a bar in two halves (each half
 * takes the first half of the pattern).
 */
export function fromChords(prog: string, octave: number, pattern: string, beatsPerBar = 4): string {
  const pat = pattern.trim().split(/\s+/)
  const bars: string[] = []
  for (const bar of prog.trim().split(/\s+/)) {
    if (bar === '|') continue
    const chords = bar.split(',')
    const span = beatsPerBar / chords.length
    const out: string[] = []
    for (const ch of chords) {
      const tones = chordTones(ch, octave, 12)
      let t = 0
      let dur = 1
      for (const tok of pat) {
        if (t >= span - 1e-9) break
        const [head, d] = tok.split(':')
        if (d !== undefined) dur = parseDur(d)
        const len = Math.min(dur, span - t)
        const name = head === 'r' || head === '~' ? head : midiToName(tones[Number(head)])
        out.push(`${name}:${+len.toFixed(4)}`)
        t += len
      }
      if (t < span - 1e-9) out.push(`r:${+(span - t).toFixed(4)}`)
    }
    bars.push(out.join(' '))
  }
  return bars.join(' | ')
}

/**
 * Pad chords from a progression (one chord per bar, `C,G` splits a bar),
 * voice-led: each chord takes the inversion closest to the previous one so
 * the pad glides instead of jumping. `rhythm` = durations within one chord
 * span (`r:1` rests), e.g. `4`, `2 2`, `1.5 .5 2`.
 */
export function padChords(prog: string, octave: number, rhythm = '4', beatsPerBar = 4): string {
  const pat = rhythm.trim().split(/\s+/)
  let prev: number[] | null = null
  const bars: string[] = []
  for (const bar of prog.trim().split(/\s+/)) {
    if (bar === '|') continue
    const chords = bar.split(',')
    const span = beatsPerBar / chords.length
    const out: string[] = []
    for (const sym of chords) {
      // Candidate voicings: three consecutive chord tones starting at each of the first tones.
      const tones = chordTones(sym, octave - 1, 12)
      let best: number[] = tones.slice(3, 6)
      let bestCost = Infinity
      for (let k = 0; k + 3 <= tones.length; k++) {
        const v = tones.slice(k, k + 3)
        if (v[0] < 12 * (octave + 1) - 7 || v[2] > 12 * (octave + 2) + 7) continue
        const ref = prev ?? chordTones(sym, octave, 3)
        const cost = v.reduce((a, m, i) => a + Math.abs(m - ref[i]), 0)
        if (cost < bestCost) {
          bestCost = cost
          best = v
        }
      }
      prev = best
      const name = best.map(midiToName).join('+')
      let t = 0
      for (const tok of pat) {
        if (t >= span - 1e-9) break
        const rest = tok.startsWith('r')
        const len = Math.min(parseDur(rest ? tok.split(':')[1] : tok), span - t)
        out.push(`${rest ? 'r' : name}:${+len.toFixed(4)}`)
        t += len
      }
      if (t < span - 1e-9) out.push(`r:${+(span - t).toFixed(4)}`)
    }
    bars.push(out.join(' '))
  }
  return bars.join(' | ')
}

/** Shift every note (and chord note) of a sequence by `semis` semitones; drums untouched. */
export function transpose(seq: string, semis: number): string {
  return seq.replace(/(^|[\s+(])([A-G][#b]{0,2}-?\d)(?=[:\s+)|]|$)/g, (_m, pre: string, n: string) => pre + midiToName(noteToMidi(n) + semis))
}

/** Bars `from`..`to` (1-based, inclusive) of a one-chord-per-bar progression. */
export function progBars(prog: string, from: number, to: number): string {
  return prog.trim().split(/\s+/).slice(from - 1, to).join(' ')
}

/** `n` bars of rest. */
export function rests(n: number, beatsPerBar = 4): string {
  return Array(n).fill(`r:${beatsPerBar}`).join(' | ')
}

/**
 * Deterministic "humanising" noise in [-1, 1] for an event (so offline
 * renders stay repeatable): hash of the absolute beat and the channel.
 */
export function humanize(abs: number, channel: number, salt = 0): number {
  let h = Math.imul(Math.round(abs * 96) + 0x9e37, 0x85ebca6b) ^ Math.imul(channel + 1 + salt * 31, 0xc2b2ae35)
  h ^= h >>> 13
  h = Math.imul(h, 0x27d4eb2d)
  h ^= h >>> 15
  return ((h >>> 0) / 0xffffffff) * 2 - 1
}

/** Metric accent: downbeats a touch louder, off-beat 16ths a touch softer. */
export function accent(beat: number, beatsPerBar = 4): number {
  const inBar = ((beat % beatsPerBar) + beatsPerBar) % beatsPerBar
  if (inBar < 1e-6) return 1.08
  const frac = inBar % 1
  if (frac < 1e-6) return inBar === beatsPerBar / 2 ? 1.02 : 0.98
  return Math.abs(frac - 0.5) < 1e-6 ? 0.9 : 0.84
}

export function compileTrack(def: TrackDef): CompiledTrack {
  const parsed = def.channels.map((c) => ({ c, ...parseSeq(c.seq) }))
  const beats = Math.max(...parsed.map((p) => p.length))
  const intros = def.channels.map((c) => (c.intro ? parseSeq(c.intro) : { events: [], length: 0 }))
  const introBeats = Math.max(0, ...intros.map((p) => p.length))
  const channels = parsed.map(({ c, events, length }, ci) => {
    let evs = events
    if (c.echo) {
      const echoes = events.map((e) => {
        let b = e.beat + c.echo!.beats
        if (def.loop && b >= beats) b -= beats
        return { ...e, beat: b, vel: e.vel * c.echo!.vol }
      })
      evs = [...events, ...echoes].sort((a, b) => a.beat - b.beat)
    }
    return { ...c, events: evs, length, introEvents: intros[ci].events }
  })
  return { bpm: def.bpm, loop: def.loop, beats, introBeats, channels }
}

export function secondsPerBeat(bpm: number): number {
  return 60 / bpm
}

/** Audio-clock time of an absolute beat for a track started at `startTime`. */
export function beatToTime(beat: number, bpm: number, startTime: number): number {
  return startTime + beat * secondsPerBeat(bpm)
}

export function timeToBeat(time: number, bpm: number, startTime: number): number {
  return (time - startTime) / secondsPerBeat(bpm)
}

/**
 * Events whose absolute start beat lies in [from, to), unrolling loops.
 * `abs` is the absolute beat since the track started.
 */
export function eventsInWindow(
  events: readonly NoteEvent[],
  loopBeats: number,
  from: number,
  to: number,
  loop: boolean,
): { ev: NoteEvent; abs: number }[] {
  const out: { ev: NoteEvent; abs: number }[] = []
  if (to <= from || loopBeats <= 0) return out
  const k0 = loop ? Math.max(0, Math.floor(from / loopBeats)) : 0
  const k1 = loop ? Math.floor(to / loopBeats) : 0
  for (let k = k0; k <= k1; k++) {
    const base = k * loopBeats
    for (const ev of events) {
      const abs = base + ev.beat
      if (abs >= from && abs < to) out.push({ ev, abs })
    }
  }
  return out
}

/**
 * Like eventsInWindow, for a track with a one-off intro of `introBeats`:
 * intro events play once from beat 0, then the (looping) body follows.
 * `abs` is again the absolute beat since the track started.
 */
export function eventsInWindowWithIntro(
  intro: readonly NoteEvent[],
  introBeats: number,
  events: readonly NoteEvent[],
  loopBeats: number,
  from: number,
  to: number,
  loop: boolean,
): { ev: NoteEvent; abs: number }[] {
  const out: { ev: NoteEvent; abs: number }[] = []
  if (to <= from) return out
  if (from < introBeats) for (const ev of intro) if (ev.beat >= from && ev.beat < to && ev.beat < introBeats) out.push({ ev, abs: ev.beat })
  const f = Math.max(from, introBeats) - introBeats
  const t = to - introBeats
  if (t > f) for (const x of eventsInWindow(events, loopBeats, f, t, loop)) out.push({ ev: x.ev, abs: x.abs + introBeats })
  return out
}

/** Length of a non-looping track in seconds (plus release tail). */
export function trackSeconds(t: CompiledTrack): number {
  return (t.introBeats + t.beats) * secondsPerBeat(t.bpm)
}

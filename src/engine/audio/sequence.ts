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
 *   `|`        bar line (ignored by the player; used by tests to check bar lengths)
 *   `( … )x4`  repeat a group
 */

import { chordTones, midiToName, noteToMidi } from './notes'

export type Inst = 'pulse12' | 'pulse25' | 'pulse50' | 'tri' | 'noise' | 'koto' | 'bell'

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
  /** Drum hits (noise channels), e.g. ['k','h']. */
  drums?: string[]
  /** Velocity 0..1. */
  vel: number
}

export interface CompiledChannel extends ChannelDef {
  events: NoteEvent[]
  length: number
}

export interface CompiledTrack {
  bpm: number
  loop: boolean
  /** Loop length in beats (= every channel's length). */
  beats: number
  channels: CompiledChannel[]
}

const DRUMS = new Set(['k', 's', 'h', 'o', 't'])

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

export function compileTrack(def: TrackDef): CompiledTrack {
  const parsed = def.channels.map((c) => ({ c, ...parseSeq(c.seq) }))
  const beats = Math.max(...parsed.map((p) => p.length))
  const channels = parsed.map(({ c, events, length }) => {
    let evs = events
    if (c.echo) {
      const echoes = events.map((e) => {
        let b = e.beat + c.echo!.beats
        if (def.loop && b >= beats) b -= beats
        return { ...e, beat: b, vel: e.vel * c.echo!.vol }
      })
      evs = [...events, ...echoes].sort((a, b) => a.beat - b.beat)
    }
    return { ...c, events: evs, length }
  })
  return { bpm: def.bpm, loop: def.loop, beats, channels }
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

/** Length of a non-looping track in seconds (plus release tail). */
export function trackSeconds(t: CompiledTrack): number {
  return t.beats * secondsPerBeat(t.bpm)
}

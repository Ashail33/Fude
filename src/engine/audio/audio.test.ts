import { describe, expect, it } from 'vitest'
import { chordTones, midiToFreq, midiToName, noteToFreq, noteToMidi } from './notes'
import { accent, barLengths, beatToTime, compileTrack, eventsInWindow, eventsInWindowWithIntro, expandRepeats, fromChords, humanize, padChords, parseSeq, timeToBeat, transpose, type NoteEvent } from './sequence'
import { TRACK_IDS, TRACKS } from './tracks'

describe('notes', () => {
  it('parses note names to MIDI', () => {
    expect(noteToMidi('A4')).toBe(69)
    expect(noteToMidi('C4')).toBe(60)
    expect(noteToMidi('C#4')).toBe(61)
    expect(noteToMidi('Db4')).toBe(61)
    expect(noteToMidi('Bb2')).toBe(46)
    expect(noteToMidi('B#3')).toBe(60)
    expect(() => noteToMidi('H2')).toThrow()
  })
  it('computes equal-tempered frequencies', () => {
    expect(midiToFreq(69)).toBeCloseTo(440)
    expect(noteToFreq('A5')).toBeCloseTo(880)
    expect(noteToFreq('C4')).toBeCloseTo(261.626, 2)
    expect(noteToFreq('D2')).toBeCloseTo(73.416, 2)
  })
  it('round-trips names', () => {
    for (let m = 24; m < 96; m++) expect(noteToMidi(midiToName(m))).toBe(m)
  })
  it('builds chord tones', () => {
    expect(chordTones('Am', 3, 4).map(midiToName)).toEqual(['A3', 'C4', 'E4', 'A4'])
    expect(chordTones('Bb', 2, 3).map(midiToName)).toEqual(['Bb2', 'D3', 'F3'])
    expect(chordTones('E5', 2, 3).map(midiToName)).toEqual(['E2', 'B2', 'E3'])
  })
})

describe('sequence notation', () => {
  it('parses durations, rests, ties and carried lengths', () => {
    const { events, length } = parseSeq('D5:1 E5:.5 G5 r:1 A5:1/3 ~:2/3')
    expect(length).toBeCloseTo(4)
    expect(events.map((e) => [e.beat, e.dur, e.midi])).toEqual([
      [0, 1, 74],
      [1, 0.5, 76],
      [1.5, 0.5, 79],
      [3, 1, 81],
    ])
  })
  it('parses drums', () => {
    const { events } = parseSeq('k:.5 k+h s')
    expect(events.map((e) => e.drums)).toEqual([['k'], ['k', 'h'], ['s']])
  })
  it('expands repeats', () => {
    expect(expandRepeats('(a (b)x2)x2').split(/\s+/).join('')).toBe('abbabb')
  })
  it('generates from chords', () => {
    expect(fromChords('C G,Am', 3, '0:1 1 2 1')).toBe('C3:1 E3:1 G3:1 E3:1 | G3:1 B3:1 A3:1 C4:1')
  })
  it('parses chords and the new drums', () => {
    const { events } = parseSeq('D4+F4+A4:4 T+x:1 b w c')
    expect(events[0]).toMatchObject({ midi: 62, chord: [65, 69], dur: 4 })
    expect(events.slice(1).map((e) => e.drums)).toEqual([['T', 'x'], ['b'], ['w'], ['c']])
  })
  it('voice-leads pad chords', () => {
    const s = padChords('C F G C', 3)
    expect(barLengths(s)).toEqual([4, 4, 4, 4])
    const chords = parseSeq(s).events.map((e) => [e.midi!, ...e.chord!])
    // Each step moves the voices by only a few semitones in total.
    for (let i = 1; i < chords.length; i++) expect(chords[i].reduce((a, m, j) => a + Math.abs(m - chords[i - 1][j]), 0)).toBeLessThanOrEqual(6)
    expect(barLengths(padChords('Am,E Dm', 3, '.5 r:1.5'))).toEqual([4, 4])
  })
  it('transposes notes but not drums or durations', () => {
    expect(transpose('C4:1 D4+F4:.5 k:1 (Bb3:1/3)x3 r:1', 12)).toBe('C5:1 D5+F5:.5 k:1 (Bb4:1/3)x3 r:1')
  })
  it('humanises deterministically, within bounds', () => {
    for (let b = 0; b < 64; b += 0.25) {
      const h = humanize(b, 2)
      expect(h).toBeGreaterThanOrEqual(-1)
      expect(h).toBeLessThanOrEqual(1)
      expect(humanize(b, 2)).toBe(h)
    }
    expect(humanize(1, 0)).not.toBe(humanize(1, 1))
    expect(accent(0)).toBeGreaterThan(accent(1))
    expect(accent(1)).toBeGreaterThan(accent(1.5))
  })
})

describe('tracks', () => {
  for (const id of TRACK_IDS) {
    const def = TRACKS[id]
    it(`${id}: every channel has the same length, in whole bars`, () => {
      const t = compileTrack(def)
      const bpb = def.beatsPerBar ?? 4
      for (const c of t.channels) expect(c.length).toBeCloseTo(t.beats, 6)
      expect(t.beats % bpb).toBeCloseTo(0, 6)
      if (def.loop) {
        expect(t.beats / bpb).toBeGreaterThanOrEqual(16)
        expect(t.beats / bpb).toBeLessThanOrEqual(32)
      }
    })
    it(`${id}: every bar holds exactly ${def.beatsPerBar ?? 4} beats`, () => {
      def.channels.forEach((c, i) => {
        barLengths(c.seq).forEach((len, bar) => {
          expect({ channel: i, bar: bar + 1, len: +len.toFixed(4) }).toEqual({ channel: i, bar: bar + 1, len: def.beatsPerBar ?? 4 })
        })
      })
    })
    it(`${id}: notes stay in a playable range`, () => {
      for (const c of compileTrack(def).channels)
        for (const e of [...c.events, ...c.introEvents]) {
          if (e.midi === undefined) continue
          for (const m of [e.midi, ...(e.chord ?? [])]) {
            expect(m).toBeGreaterThanOrEqual(24)
            expect(m).toBeLessThanOrEqual(96)
          }
        }
    })
    it(`${id}: intros are whole bars`, () => {
      const t = compileTrack(def)
      expect(t.introBeats % (def.beatsPerBar ?? 4)).toBeCloseTo(0, 6)
      for (const c of def.channels) if (c.intro) for (const len of barLengths(c.intro)) expect(len).toBeCloseTo(def.beatsPerBar ?? 4, 6)
    })
  }
})

describe('scheduler math', () => {
  const evs: NoteEvent[] = [
    { beat: 0, dur: 1, midi: 60, vel: 1 },
    { beat: 2, dur: 1, midi: 62, vel: 1 },
    { beat: 3.5, dur: 0.5, midi: 64, vel: 1 },
  ]
  it('converts beats and time', () => {
    expect(beatToTime(4, 120, 10)).toBeCloseTo(12)
    expect(timeToBeat(12, 120, 10)).toBeCloseTo(4)
  })
  it('finds events in a window without looping', () => {
    expect(eventsInWindow(evs, 4, 0, 3, false).map((x) => x.abs)).toEqual([0, 2])
    expect(eventsInWindow(evs, 4, 4, 8, false)).toEqual([])
  })
  it('unrolls loops across the boundary', () => {
    expect(eventsInWindow(evs, 4, 3, 6.5, true).map((x) => x.abs)).toEqual([3.5, 4, 6])
    expect(eventsInWindow(evs, 4, 40, 44, true).map((x) => x.abs)).toEqual([40, 42, 43.5])
  })
  it('schedules every event exactly once over consecutive windows', () => {
    const seen: number[] = []
    let from = 0
    const steps = [0.3, 1.7, 0.01, 2.2, 3.9, 0.5, 5.3]
    for (let i = 0; i < 40; i++) {
      const to = from + steps[i % steps.length]
      for (const x of eventsInWindow(evs, 4, from, to, true)) seen.push(x.abs)
      from = to
    }
    const expected: number[] = []
    for (let k = 0; k * 4 < from; k++) for (const e of evs) if (k * 4 + e.beat < from) expected.push(k * 4 + e.beat)
    expect(seen).toEqual(expected)
  })
  it('plays an intro once, then loops the body after it', () => {
    const intro: NoteEvent[] = [{ beat: 0, dur: 1, midi: 50, vel: 1 }, { beat: 3, dur: 1, midi: 52, vel: 1 }]
    const got = eventsInWindowWithIntro(intro, 4, evs, 4, 0, 13, true).map((x) => [x.abs, x.ev.midi])
    expect(got).toEqual([
      [0, 50],
      [3, 52],
      [4, 60],
      [6, 62],
      [7.5, 64],
      [8, 60],
      [10, 62],
      [11.5, 64],
      [12, 60],
    ])
    // Consecutive windows see each event exactly once.
    const seen: number[] = []
    for (let f = 0; f < 20; f += 0.7) for (const x of eventsInWindowWithIntro(intro, 4, evs, 4, f, f + 0.7, true)) seen.push(x.abs)
    expect(seen).toEqual(eventsInWindowWithIntro(intro, 4, evs, 4, 0, seen.length ? 20.3 : 0, true).map((x) => x.abs))
  })
  it('wraps echoes into the loop', () => {
    const t = compileTrack({ bpm: 100, loop: true, channels: [{ inst: 'pulse25', vol: 1, seq: 'C4:3 D4:1', echo: { beats: 1.5, vol: 0.5 } }] })
    expect(t.channels[0].events.map((e) => [e.beat, e.vel])).toEqual([
      [0, 1],
      [0.5, 0.5],
      [1.5, 0.5],
      [3, 1],
    ])
  })
})

describe('music API (no WebAudio available)', () => {
  it('queues tracks without throwing and reports them', async () => {
    const m = await import('../music')
    expect(m.currentTrack()).toBe(null)
    m.playMusic('village')
    expect(m.currentTrack()).toBe('village')
    m.playJingle('victory')
    m.stopMusic()
    expect(m.currentTrack()).toBe(null)
    m.setMusicVolume(2)
    expect(m.getMusicVolume()).toBe(1)
  })
  it('sfx calls are silent no-ops before audio is unlocked', async () => {
    const { sfx } = await import('../sfx')
    for (const [k, f] of Object.entries(sfx)) if (k !== 'magic') (f as () => void)()
    sfx.magic('fire')
    sfx.blip(3)
  })
})

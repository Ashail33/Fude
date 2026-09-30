/**
 * Note-name parsing and pitch math (pure; no WebAudio).
 * Notes are written scientific-pitch style: `C4` (middle C), `F#3`, `Bb5`.
 */

const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** Parse a note name like `A4`, `C#5`, `Bb2` into a MIDI number (A4 = 69). */
export function noteToMidi(name: string): number {
  const m = /^([A-Ga-g])([#b]{0,2})(-?\d)$/.exec(name.trim())
  if (!m) throw new Error(`Bad note name: "${name}"`)
  let pc = PC[m[1].toUpperCase()]
  for (const acc of m[2]) pc += acc === '#' ? 1 : -1
  return 12 * (Number(m[3]) + 1) + pc
}

/** Equal-temperament frequency of a MIDI note (A4 = 440 Hz). */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

export function noteToFreq(name: string): number {
  return midiToFreq(noteToMidi(name))
}

const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
export function midiToName(midi: number): string {
  return NAMES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1)
}

/** Chord qualities as semitone offsets from the root. */
const QUALITIES: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  '5': [0, 7],
  dim: [0, 3, 6],
}

/**
 * Chord tones (MIDI) of a chord symbol like `Am`, `F#m7`, `Bbmaj7`, `Esus4`,
 * rooted in `octave`, extended upwards by octaves so index 0 = root,
 * 1 = next chord tone, … (e.g. for a triad index 3 is the root an octave up).
 */
export function chordTones(symbol: string, octave: number, count = 8): number[] {
  const m = /^([A-G][#b]?)(.*)$/.exec(symbol.trim())
  if (!m || !(m[2] in QUALITIES)) throw new Error(`Bad chord: "${symbol}"`)
  const root = noteToMidi(m[1] + octave)
  const q = QUALITIES[m[2]]
  const out: number[] = []
  for (let i = 0; out.length < count; i++) out.push(root + q[i % q.length] + 12 * Math.floor(i / q.length))
  return out
}

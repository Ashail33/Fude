/**
 * Original chiptune compositions for Kotoba no Mahō.
 *
 * Every piece is written for this game (no borrowed melodies). Melodies lean
 * on Japanese scales — yo (1 2 4 5 6), in / miyako-bushi (1 b2 4 5 b6) and the
 * min'yō/ritsu pentatonic modes — over simple Western-style harmony, like a
 * 16-bit RPG soundtrack. Notation: see ./sequence.ts. One token per note,
 * `|` between bars, 4 beats per bar.
 *
 * Arrangement: most loops run an A section (the tune on chip leads) and a
 * variation (the tune handed to the shakuhachi-like flute or koto, with a
 * counter-line, pad chords, bass and busier festival percussion — taiko,
 * tsuzumi, hyōshigi). Some tracks open with a one-off `intro` before the loop.
 */

import type { PackTrack } from '../../regions/ids'
import { fromChords as ch, padChords as pads, progBars as bars, rests, transpose, type TrackDef } from './sequence'

/** Join sections (each a run of whole bars) into one channel string. */
const join = (...parts: string[]) => parts.map((p) => p.trim().replace(/\|$/, '')).join(' | ')

export type TrackId = 'title' | 'village' | 'fields' | 'forest' | 'shrine' | 'tower' | 'battle' | 'boss' | 'victory' | 'shop' | 'game' | PackTrack

// ─── title ─ wistful and grand; D min'yō (D F G A C). A koto glissando and
//     temple bell open; harp-like koto, then the flute (bar 5) and the chip
//     lead (bar 9) take the tune while taiko and timpani join.
const titleProg = 'Dm Bb C Am Dm Bb Gm A Bb C Dm F Gm C Asus4 A'
const titleA = `A4:1.5 D5:.5 C5:1 A4:1 | G4:1 F4:.5 G4:.5 A4:2 | D5:1.5 C5:.5 A4:1 G4:1 | A4:3 r:1`
const titleB = `D5:1 F5:1 G5:1.5 F5:.5 | E5:1 G5:.5 E5:.5 C5:2 | D5:1.5 F5:.5 A5:2 | G5:.5 A5:.5 G5:.5 F5:.5 C5:2 |
  D5:1 G5:1 F5:1 D5:1 | C5:1.5 D5:.5 E5:1 G5:1 | A5:2 G5:1 D5:1 | C#5:4`
const title: TrackDef = {
  bpm: 80,
  loop: true,
  channels: [
    { inst: 'flute', vol: 0.15, vib: 16, pan: -0.1, seq: join(rests(4), titleA, rests(8)) },
    { inst: 'pulse50', vol: 0.12, vib: 14, detune: 9, pan: 0.1, echo: { beats: 0.75, vol: 0.3 }, seq: join(rests(8), titleB) },
    {
      inst: 'pulse12',
      vol: 0.07,
      pan: -0.35,
      seq: `(r:4 |)x8
        F4:4 | G4:4 | A4:4 | A4:4 | Bb4:4 | G4:4 | E4:2 D4:2 | E4:4`,
    },
    { inst: 'koto', vol: 0.2, pan: -0.15, seq: ch(titleProg, 3, '0:.5 1 2 3 4 3 2 1'), intro: 'D4:.25 F4 G4 A4 C5 D5 F5 G5 A5:2' },
    { inst: 'pad', vol: 0.05, seq: pads(titleProg, 3) },
    {
      inst: 'tri',
      vol: 0.24,
      seq: ch('Dm Bb C Am Dm Bb Gm A', 2, '0:4') + ' | ' + ch('Bb C Dm F Gm C Asus4 A', 2, '0:1.5 0:.5 2:1 3:1'),
    },
    { inst: 'bell', vol: 0.12, seq: join('r:4', rests(3), 'D4:4', rests(3), 'A3:4', rests(7)), intro: 'D4:4' },
    {
      inst: 'noise',
      vol: 0.13,
      seq: `(r:4 |)x8 x+T:2 k:1 k:1 | (T:2 k:1 k:1 |)x2 T:2 t:1 t:1 | (T:2 k:1 k:1 |)x3 (s:1/4)x16`,
    },
  ],
}

// ─── village ─ cheerful, bouncy, warm; D yo scale (D E G A B).
//     Second time round the flute sings the tune over koto and a festival
//     beat (tsuzumi), while the chip lead plays a counter-line.
const villageProg = 'D G D A D G Em A G A Bm G D G A D'
const villageTune = `A4:.5 B4:.5 D5:1 B4:.5 A4:.5 G4:1 | B4:1.5 A4:.5 G4:1 E4:1 | D4:.5 E4:.5 G4:.5 A4:.5 B4:1 A4:1 | E5:2 r:1 A4:.5 B4:.5 |
  D5:1 E5:.5 D5:.5 B4:1 A4:1 | G4:.5 A4:.5 B4:1 D5:1.5 B4:.5 | A4:1 G4:.5 E4:.5 G4:1 A4:.5 B4:.5 | A4:3 r:1 |
  B4:.5 D5:.5 E5:1 D5:.5 B4:.5 D5:1 | E5:.5 G5:.5 A5:1 G5:.5 E5:.5 D5:1 | D5:1.5 B4:.5 A4:1 B4:1 | G4:.5 A4:.5 B4:.5 D5:.5 E5:2 |
  A5:1.5 G5:.5 E5:1 D5:1 | B4:.5 D5:.5 E5:.5 D5:.5 B4:1 G4:1 | A4:.5 B4:.5 D5:.5 E5:.5 B4:1 A4:1 | D5:3 r:1`
const villageBeat = `(k:.5 h:.5 h s h h k h |)x15 k:.5 h s h s:.25 s s s k:.5 s`
const village: TrackDef = {
  bpm: 112,
  loop: true,
  channels: [
    { inst: 'pulse25', vol: 0.11, vib: 8, detune: 7, gate: 0.85, seq: join(villageTune, ch(villageProg, 4, '1:2 2:1 1:1')), intro: 'r:2 E4:.5 G4 A4 B4' },
    { inst: 'flute', vol: 0.13, vib: 14, pan: 0.12, seq: join(rests(16), villageTune) },
    { inst: 'pulse12', vol: 0.06, pan: -0.4, gate: 0.5, seq: join(ch(villageProg, 4, 'r:.5 1:.5 r 2 r 1 r 2'), ch(villageProg, 4, 'r:.5 1:.5 r 2 r 1 r 2')) },
    { inst: 'koto', vol: 0.1, pan: 0.35, seq: join(rests(16), ch(villageProg, 4, '0:.5 1 2 1 3 2 1 2')) },
    { inst: 'pad', vol: 0.04, seq: join(rests(8), pads(bars(villageProg, 9, 16), 3), pads(villageProg, 3)) },
    { inst: 'tri', vol: 0.24, gate: 0.7, seq: join(ch(villageProg, 2, '0:1 2:1 3:1 2:.5 1:.5'), ch(villageProg, 2, '0:1 2:1 3:1 2:.5 1:.5')), intro: 'r:3 A2:1' },
    {
      inst: 'noise',
      vol: 0.12,
      seq: join(villageBeat, `x+k:.5 h b s h h k+b h | (k:.5 h b s h h k+b h |)x14 k:.5 h s h s:.25 s s s k:.5 s`),
      intro: 'r:2 s:.5 s s:.25 s s s',
    },
  ],
}

// ─── fields ─ breezy, open, pastoral; G yo (G A C D E).
//     Variation: flute tune, chip counter-line in half notes, harp sparkles.
const fieldsProg = 'G C G D Em C Am D G Em C D Em C D G'
const fieldsTune = `D5:1.5 E5:.5 G5:2 | E5:1 D5:.5 C5:.5 D5:2 | G4:.5 A4:.5 C5:.5 D5:.5 E5:1 D5:1 | A4:3 r:1 |
  E5:1.5 G5:.5 A5:1 G5:1 | E5:.5 D5:.5 C5:1 E5:2 | A4:1 C5:1 D5:1 E5:1 | D5:4 |
  G5:1.5 E5:.5 D5:1 E5:1 | G5:.5 A5:.5 G5:.5 E5:.5 D5:2 | C5:1 D5:.5 E5:.5 G5:1 E5:1 | D5:3 A4:1 |
  G4:1 A4:.5 C5:.5 D5:1 E5:1 | G5:1.5 E5:.5 D5:1 C5:1 | A4:1 C5:1 D5:1 A4:1 | G4:3 r:1`
const fields: TrackDef = {
  bpm: 120,
  loop: true,
  channels: [
    { inst: 'pulse25', vol: 0.11, vib: 12, detune: 6, pan: 0.1, seq: join(fieldsTune, ch(fieldsProg, 4, '1:2 2:2')) },
    { inst: 'flute', vol: 0.13, vib: 14, pan: -0.1, seq: join(rests(16), fieldsTune) },
    { inst: 'pulse12', vol: 0.055, pan: -0.4, gate: 0.6, seq: join(ch(fieldsProg, 4, '0:.5 2 1 2 0 2 1 2'), ch(fieldsProg, 4, '0:.5 2 1 2 0 2 1 2')) },
    { inst: 'harp', vol: 0.06, pan: 0.4, seq: join(rests(16), ch(fieldsProg, 5, 'r:1 0:.5 1 2:1 1:1')) },
    { inst: 'pad', vol: 0.04, seq: join(rests(4), pads(bars(fieldsProg, 5, 16), 3), pads(fieldsProg, 3)) },
    { inst: 'tri', vol: 0.22, gate: 0.85, seq: join(ch(fieldsProg, 2, '0:1 2:1 3:1 2:1'), ch(fieldsProg, 2, '0:1 2:1 3:1 2:1')) },
    { inst: 'noise', vol: 0.09, seq: join(`(k:1 h:.5 h:.5 s:1 h:1 |)x16`, `(k:1 h:.5 h:.5 s:1 h:.5 o:.5 |)x15 k:1 h:.5 h:.5 s:.5 s:.5 s:1/3 s s`) },
  ],
}

// ─── forest ─ mysterious, gentle; E in / miyako-bushi (E F A B C).
//     Variation: the shakuhachi-like flute takes the tune under a pad haze.
const forestProg = 'Am Am Fmaj7 E5 Am Am Fmaj7 E5 F F Am Am F E5 Am E5'
const forestTune = `E5:1.5 F5:.5 E5:1 C5:1 | B4:1 C5:.5 B4:.5 A4:2 | F4:.5 A4:.5 B4:1 C5:1 E5:1 | B4:3 r:1 |
  A5:1.5 F5:.5 E5:1 C5:1 | B4:.5 C5:.5 E5:1 F5:2 | E5:1 C5:1 A4:1 B4:1 | E5:4 |
  F5:1 E5:.5 F5:.5 A5:2 | C5:1 E5:1 F5:1 E5:1 | A4:1.5 B4:.5 C5:1 B4:.5 A4:.5 | E4:4 |
  F4:.5 A4:.5 C5:.5 E5:.5 F5:1 E5:1 | B4:1.5 C5:.5 B4:1 F4:1 | A4:2 r:2 | r:4`
const forest: TrackDef = {
  bpm: 92,
  loop: true,
  channels: [
    { inst: 'pulse50', vol: 0.1, vib: 16, pan: 0.15, echo: { beats: 0.75, vol: 0.35 }, seq: join(forestTune, rests(16)) },
    { inst: 'flute', vol: 0.14, vib: 22, pan: -0.05, seq: join(rests(16), forestTune) },
    { inst: 'pulse12', vol: 0.035, pan: 0.4, vib: 10, seq: join(rests(16), ch(forestProg, 4, 'r:2 2:1.5 1:.5')) },
    { inst: 'koto', vol: 0.17, pan: -0.25, seq: join(ch(forestProg, 3, '0:.5 2 3 2 1 2 3 4'), ch(forestProg, 3, '0:.5 2 3 2 1 2 3 4')) },
    { inst: 'pad', vol: 0.04, seq: join(rests(16), pads(forestProg, 3)) },
    { inst: 'tri', vol: 0.2, seq: join(ch(forestProg, 2, '0:2 0:1.5 2:.5'), ch(forestProg, 2, '0:2 0:1.5 2:.5')) },
    {
      inst: 'noise',
      vol: 0.07,
      seq: join(`(r:1 h:.5 h:.5 r:1 h:1 | r:1 h:.5 h:.5 t:1 h:.5 h:.5 |)x8`, `(b:1 h:.5 h:.5 r:1 h:1 | r:1 h:.5 w:.5 t:1 h:.5 h:.5 |)x8`),
    },
  ],
}

// ─── shrine ─ serene, sparse; D in scale (D Eb G A Bb), koto + temple bell,
//     a breathy flute drone and a distant tsuzumi.
const shrineProg = 'D5 D5 Gm D5 Eb Bb Gm D5 D5 Eb Gm A5 Gm Eb Gm D5'
const shrine: TrackDef = {
  bpm: 66,
  loop: true,
  channels: [
    {
      inst: 'koto',
      vol: 0.24,
      pan: 0.1,
      echo: { beats: 1.5, vol: 0.28 },
      seq: `D5:1 A4:1 Bb4:2 | A4:1 G4:1 D4:2 | G4:.5 A4:.5 Bb4:1 D5:2 | Eb5:1 D5:1 A4:2 |
        r:1 G5:1 D5:1 Eb5:1 | D5:2 Bb4:2 | A4:1 Bb4:.5 A4:.5 G4:1 Eb4:1 | D4:4 |
        A4:1 D5:1 G5:2 | A5:1 G5:.5 Eb5:.5 D5:2 | Bb4:1 D5:1 Eb5:1 G5:1 | A5:4 |
        G5:1 Eb5:1 D5:1 Bb4:1 | A4:2 Bb4:1 A4:1 | G4:1 Eb4:1 D4:2 | r:4`,
    },
    {
      inst: 'flute',
      vol: 0.08,
      pan: -0.3,
      vib: 14,
      seq: `(r:4 |)x8 D4:4 | Eb4:4 | G4:4 | A4:4 | Bb4:4 | A4:4 | G4:2 A4:2 | D4:4`,
    },
    { inst: 'pad', vol: 0.03, seq: pads(shrineProg, 3) },
    { inst: 'tri', vol: 0.18, gate: 0.97, seq: ch(shrineProg, 2, '0:4') },
    { inst: 'bell', vol: 0.16, seq: `D4:4 | (r:4 |)x3 A3:4 | (r:4 |)x3 D4:4 | (r:4 |)x3 G3:4 | r:4 | r:4 | D4:4` },
    { inst: 'noise', vol: 0.06, seq: `(r:4 |)x4 (b:3 b:1 | r:4 |)x6` },
  ],
}

// ─── tower ─ epic, ascending, determined; E minor with rising sequences.
//     Second pass adds a brassy counter-line, pad, doubled bass and taiko.
const towerProg = 'Em C D B Em C Am B C D Em G C D Bsus4 B'
const towerTune = `E4:.5 G4:.5 B4:1 E5:1.5 D5:.5 | C5:1 E5:1 G5:2 | F#5:1.5 E5:.5 D5:1 A4:1 | B4:3 D#5:1 |
  E5:.5 G5:.5 B5:1 A5:1 G5:1 | E5:1.5 G5:.5 C6:2 | A5:1 G5:.5 E5:.5 C5:1 E5:1 | F#5:2 D#5:2 |
  G5:1 E5:.5 G5:.5 C6:2 | A5:1 F#5:.5 A5:.5 D6:2 | B5:1.5 A5:.5 G5:1 E5:1 | D5:1 G5:1 B5:2 |
  C6:1.5 B5:.5 G5:1 E5:1 | D6:1.5 C6:.5 A5:1 F#5:1 | E5:2 F#5:2 | D#5:4`
const towerBass = ch(towerProg, 2, '0:.5 0 3 0 0 3 0 3')
const tower: TrackDef = {
  bpm: 132,
  loop: true,
  channels: [
    { inst: 'pulse50', vol: 0.11, vib: 10, detune: 8, seq: join(towerTune, towerTune) },
    { inst: 'pulse25', vol: 0.05, pan: -0.35, gate: 0.7, seq: join(ch(towerProg, 4, '0:.5 1 2 3 1 2 3 4'), ch(towerProg, 4, '0:.5 1 2 3 1 2 3 4')) },
    { inst: 'pulse25', vol: 0.045, pan: 0.35, detune: 12, seq: join(rests(16), ch(towerProg, 4, '1:2 2:1.5 1:.5')) },
    { inst: 'pad', vol: 0.04, seq: join(rests(8), pads(bars(towerProg, 9, 16), 3), pads(towerProg, 3)) },
    { inst: 'tri', vol: 0.24, gate: 0.8, seq: join(towerBass, towerBass), intro: 'E2:4' },
    { inst: 'bass', vol: 0.09, gate: 0.6, seq: join(rests(16), towerBass) },
    {
      inst: 'noise',
      vol: 0.12,
      seq: join(
        `(k:.5 h s h k k s h |)x7 k:.5 h s h s:.25 s s s k:.5 s | (k:.5 h s h k k s h |)x7 (s:1/4)x8 k:.5 s s:1/3 s s`,
        `x+k:.5 h s h T k s h | (k:.5 h s h T k s h |)x6 k:.5 h s h s:.25 s s s k:.5 s | (T:.5 h s h k T s h |)x7 (s:1/4)x8 k:.5 s s:1/3 s s`,
      ),
      intro: 'T:1 T:1 T:.5 T T:1/3 T T',
    },
  ],
}

// ─── battle ─ fast and driving; A minor with in-scale (Bb) colour.
//     A one-bar charge-in, then on the repeat a counter-line, string stabs and a saw bass.
const battleProg = 'Am Am F G Am Am Bb E Dm F Am Bb Dm E Bb E'
const battleTune = `A4:.5 E5 r A5 G5 E5 D5 E5 | C5:1.5 D5:.5 E5:1 A4:1 | F5:.5 E5 D5 C5 D5:1 A4:1 | G4:.5 A4 B4 D5 G5:2 |
  A5:.5 A5 G5 E5 A5 C6 B5 A5 | E5:2 r:.5 E5 G5 A5 | Bb5:1.5 A5:.5 F5:1 D5:1 | E5:.5 F5 E5 D5 E5:2 |
  D5:1 F5:1 A5:1.5 G5:.5 | F5:.5 E5 F5 A5 C6:2 | A5:1 E5:.5 A5:.5 C6:1 B5:1 | Bb5:1.5 A5:.5 F5:2 |
  D6:1 A5:1 F5:1 D5:1 | E5:1 G#5:1 B5:1 D6:1 | D6:.5 C6 Bb5 A5 F5 D5 F5 A5 | G#5:2 E5:1 B4:1`
const battleBass = ch(battleProg, 2, '0:.5 3 0 3 0 3 0 3')
const battle: TrackDef = {
  bpm: 160,
  loop: true,
  channels: [
    { inst: 'pulse25', vol: 0.11, vib: 6, detune: 7, gate: 0.88, seq: join(battleTune, battleTune), intro: 'A4:.5 r A4 r A4:.25 B4 C5 D5 E5:1' },
    { inst: 'pulse12', vol: 0.055, pan: -0.35, gate: 0.55, seq: join(ch(battleProg, 4, '0:.5 2 3 2 1 2 3 2'), ch(battleProg, 4, '0:.5 2 3 2 1 2 3 2')) },
    { inst: 'pulse50', vol: 0.045, pan: 0.35, seq: join(rests(16), ch(battleProg, 4, '2:1.5 1:1.5 2:1')) },
    { inst: 'pad', vol: 0.045, seq: join(rests(16), pads(battleProg, 3, '.5 r:1.5 .5 r:1.5')) },
    { inst: 'tri', vol: 0.25, gate: 0.75, seq: join(battleBass, battleBass), intro: 'A2:.5 r A2 r A2:.5 A2 E2:1' },
    { inst: 'bass', vol: 0.08, gate: 0.6, seq: join(rests(16), battleBass) },
    {
      inst: 'noise',
      vol: 0.13,
      seq: join(
        `(k:.5 h s h k k s h |)x15 (s:1/4)x12 s:.5 k:.5`,
        `x+k:.5 h s h k k s h | (k:.5 h s h k k s h |)x6 k:.5 h s h t:.5 t t t | (k:.5 h s h k k s h |)x7 (s:1/4)x8 t:.5 t t:.25 t t t`,
      ),
      intro: 'x+k:.5 r k r s:.25 s s s s s s s',
    },
  ],
}

// ─── boss ─ intense and heavy; D in scale (D Eb G A Bb) with a tritone bite.
//     Opens on a taiko roll; the repeat adds taiko, dark pad stabs and bass.
const bossProg = 'Dm Dm Eb Dm Bb A Dm Eb Gm Gm Eb Eb Bb A Eb A'
const bossTune = `D5:1 r:.5 D5:.5 Eb5:1 D5:1 | A4:.5 Bb4 A4 G4 A4:2 | G5:1 r:.5 G5:.5 A5:1 G5:.5 Eb5:.5 | D5:3 r:1 |
  F5:1 D5:.5 F5:.5 Bb5:1 A5:1 | A5:1.5 G5:.5 E5:1 C#5:1 | D5:.5 F5 A5 D6 C6:1 A5:1 | Bb5:2 G5:2 |
  G5:1 Bb5:1 D6:1.5 C6:.5 | Bb5:.5 A5 G5 D5 G5:2 | Eb6:1 D6:.5 Bb5:.5 G5:1 Bb5:1 | A5:4 |
  F5:.5 Bb5 D6 F6 Eb6:1 D6:1 | C#6:2 A5:2 | G5:.5 Bb5 Eb6 D6 Bb5:1 G5:1 | A5:.5 G5 E5 C#5 A4:2`
const bossBass = ch(bossProg, 1, '0:.5 0 3 0 0 2 3 0')
const boss: TrackDef = {
  bpm: 150,
  loop: true,
  channels: [
    { inst: 'pulse50', vol: 0.1, vib: 8, detune: 10, seq: join(bossTune, bossTune) },
    { inst: 'pulse25', vol: 0.05, pan: -0.3, gate: 0.6, seq: join(ch(bossProg, 3, '0:.5 2 0 2 1 2 0 2'), ch(bossProg, 3, '0:.5 2 0 2 1 2 0 2')) },
    { inst: 'pad', vol: 0.04, seq: join(pads(bossProg, 3), pads(bossProg, 3, '1 r:1 1 r:1')), intro: 'D3+F3+A3:4 | Eb3+G3+Bb3:2 D3+F3+A3:2' },
    { inst: 'tri', vol: 0.28, gate: 0.8, seq: join(bossBass, bossBass), intro: 'D1:4 | D1:2 A1:2' },
    { inst: 'bass', vol: 0.08, gate: 0.6, seq: join(rests(16), transpose(bossBass, 12)) },
    {
      inst: 'noise',
      vol: 0.13,
      seq: join(
        `(k:.25 k h:.5 s h k:.25 k k:.5 s h |)x15 (s:1/4)x8 k:.5 s k s`,
        `x+T:.25 k h:.5 s h T:.25 k k:.5 s h | (T:.25 k h:.5 s h T:.25 k k:.5 s h |)x14 (T:1/4)x8 x+k:.5 s k s`,
      ),
      intro: 'T:1 T:1 T:1 T:.5 T:.5 | T:.25 T T T T T T T x+T:2',
    },
  ],
}

// ─── victory ─ short fanfare jingle (not looping); D major / yo colour.
const victory: TrackDef = {
  bpm: 140,
  loop: false,
  channels: [
    { inst: 'pulse50', vol: 0.12, vib: 10, detune: 8, seq: `A4:.5 D5 E5 A5 G5:1 E5:1 | D5:.5 E5 G5 A5 B5:2 | A5:1 G5:.5 E5:.5 G5:1 A5:1 | D6:3 r:1` },
    { inst: 'pulse25', vol: 0.06, pan: -0.3, seq: `F#4:1 A4:1 B4:1 G4:1 | G4:1 B4:1 D5:2 | E5:1 E5:.5 C#5:.5 E5:1 E5:1 | F#5:3 r:1` },
    { inst: 'pad', vol: 0.045, seq: pads('D,G G E,A D', 4) },
    { inst: 'harp', vol: 0.07, pan: 0.35, seq: `(r:4 |)x3 D5:.25 F#5 A5 D6 F#6:3` },
    { inst: 'tri', vol: 0.24, gate: 0.8, seq: `D2:1 D3:1 G2:1 A2:1 | G2:1 G3:1 G2:1 B2:1 | E2:1 E3:1 A2:1 A3:1 | D2:3 r:1` },
    { inst: 'noise', vol: 0.14, seq: `(k:.5 h s h k h s h |)x3 s:.25 s s s x+k:1 r:2` },
  ],
}

// ─── shop ─ playful and light; G yo with bouncy staccato. The repeat hands
//     the tune to the koto (shamisen-ish) with wood-block clacks.
const shopProg = 'G Em C D G Em Am D C D Bm Em C D G D'
const shopTune = `G4:.5 r D5 r B4 A4 G4:1 | E4:.5 G4 A4 B4 E5:1 D5:1 | C5:.5 r E5 r D5 C5 A4:1 | D5:1.5 E5:.5 D5:1 r:1 |
  B4:.5 D5 G5 D5 E5 D5 B4:1 | G4:.5 A4 B4:1 E5:.5 D5 B4:1 | A4:.5 C5 E5 G5 E5 C5 A4:1 | D5:1 A4:.5 D5:.5 r:2 |
  E5:1 G5:.5 E5:.5 D5:1 C5:1 | A4:1 D5:.5 E5:.5 F#5:1 D5:1 | B4:.5 D5 F#5 D5 B4:1 A4:1 | G4:1.5 A4:.5 B4:1 E4:1 |
  C5:.5 E5 G5 E5 C5 E5 G5:1 | A5:.5 G5 F#5 E5 D5:1 A4:1 | B4:.5 D5 G5 B5 A5:1 G5:1 | D5:.5 r D5 r D5:1 r:1`
const shop: TrackDef = {
  bpm: 124,
  loop: true,
  channels: [
    { inst: 'pulse12', vol: 0.13, gate: 0.55, detune: 6, seq: join(shopTune, rests(16)) },
    { inst: 'koto', vol: 0.18, pan: 0.1, seq: join(rests(16), shopTune) },
    { inst: 'pulse25', vol: 0.05, pan: -0.35, gate: 0.4, seq: join(ch(shopProg, 4, 'r:.5 1 r 2 r 1 r 2'), ch(shopProg, 4, 'r:.5 1 r 2 r 1 r 2')) },
    { inst: 'pad', vol: 0.03, seq: join(rests(16), pads(shopProg, 3, '2 2')) },
    { inst: 'tri', vol: 0.24, gate: 0.6, seq: join(ch(shopProg, 2, '0:.5 r 2 r 3 r 2 r'), ch(shopProg, 2, '0:.5 r 2 r 3 r 2 r')) },
    { inst: 'noise', vol: 0.1, seq: join(`(k:.5 h s h:.25 h k:.5 h s h |)x16`, `(k:.5 h s h:.25 w k:.5 w s h |)x16`) },
  ],
}

// ─── game ─ upbeat but calm focus music for mini-games; C major pentatonic.
//     The repeat drops the tune an octave onto the flute with harp sparkles.
const gameProg = 'C Am F G C Am Dm G F G Em Am F G C G'
const gameTune = `E5:1 G5:1 A5:2 | G5:1 E5:1 r:2 | C5:1 D5:1 E5:1.5 D5:.5 | D5:2 r:2 |
  E5:1 G5:1 C6:2 | A5:1 G5:1 r:2 | D5:1 E5:.5 D5:.5 C5:1 A4:1 | G4:2 r:2 |
  A4:1 C5:1 D5:1 E5:1 | D5:2 G5:2 | G5:1 E5:1 D5:1 E5:1 | A4:2 r:2 |
  C5:1 A4:.5 C5:.5 D5:1 E5:1 | G5:2 D5:2 | E5:1.5 D5:.5 C5:2 | r:4`
const gameBeat = `(k:1 h:.5 h:.5 s:1 h:.5 h:.5 |)x16`
const game: TrackDef = {
  bpm: 116,
  loop: true,
  channels: [
    { inst: 'pulse25', vol: 0.085, vib: 8, detune: 6, seq: join(gameTune, rests(16)) },
    { inst: 'flute', vol: 0.12, vib: 12, seq: join(rests(16), transpose(gameTune, -12)) },
    { inst: 'pulse12', vol: 0.045, pan: -0.35, gate: 0.5, seq: join(ch(gameProg, 4, '0:.5 2 1 2 0 2 1 2'), ch(gameProg, 4, '0:.5 2 1 2 0 2 1 2')) },
    { inst: 'harp', vol: 0.045, pan: 0.4, seq: join(rests(16), ch(gameProg, 5, 'r:1 0:.5 1 2:1 1:1')) },
    { inst: 'pad', vol: 0.03, seq: join(pads(gameProg, 3), pads(gameProg, 3)) },
    { inst: 'tri', vol: 0.22, gate: 0.75, seq: join(ch(gameProg, 2, '0:1.5 0:.5 2:1 3:1'), ch(gameProg, 2, '0:1.5 0:.5 2:1 3:1')) },
    { inst: 'noise', vol: 0.08, seq: join(gameBeat, gameBeat) },
  ],
}

// ─── harbour ─ salty, swaying, a fishermen's work song; A yo (A B D E F#).
//     Variation: the flute takes the tune, koto plucks the off-beats, and
//     the hand drums pick up a rowing rhythm.
const harbourProg = 'A D A E A D Bm E D E F#m D A D E A'
const harbourTune = `E5:1 F#5:.5 E5:.5 D5:1 B4:1 | A4:1.5 B4:.5 D5:2 | E5:.5 F#5:.5 A5:1 F#5:1 E5:1 | B4:3 r:1 |
  D5:1 E5:.5 D5:.5 B4:1 A4:1 | B4:.5 D5:.5 E5:1 F#5:2 | E5:1 D5:1 B4:1 D5:1 | E5:4 |
  A5:1.5 F#5:.5 E5:1 D5:1 | E5:.5 F#5:.5 E5:.5 D5:.5 B4:2 | D5:1 E5:.5 F#5:.5 A5:1 F#5:1 | E5:3 r:1 |
  F#5:1 E5:.5 D5:.5 B4:1 D5:1 | E5:1.5 D5:.5 B4:1 A4:1 | B4:.5 D5:.5 E5:1 D5:.5 B4:.5 A4:1 | A4:3 r:1`
const harbour: TrackDef = {
  bpm: 104,
  loop: true,
  channels: [
    { inst: 'pulse25', vol: 0.11, vib: 10, detune: 7, gate: 0.85, seq: join(harbourTune, ch(harbourProg, 4, '1:2 2:1 1:1')), intro: 'r:2 A4:.5 B4 D5 E5' },
    { inst: 'flute', vol: 0.13, vib: 16, pan: 0.12, seq: join(rests(16), harbourTune) },
    { inst: 'koto', vol: 0.12, pan: -0.3, seq: join(ch(harbourProg, 4, 'r:.5 1:.5 r 2 r 1 r 2'), ch(harbourProg, 4, '0:.5 1 2 1 3 2 1 2')) },
    { inst: 'pad', vol: 0.04, seq: join(rests(8), pads(bars(harbourProg, 9, 16), 3), pads(harbourProg, 3)) },
    { inst: 'tri', vol: 0.24, gate: 0.75, seq: join(ch(harbourProg, 2, '0:1.5 2:.5 3:1 2:1'), ch(harbourProg, 2, '0:1.5 2:.5 3:1 2:1')), intro: 'r:3 E2:1' },
    {
      inst: 'noise',
      vol: 0.11,
      seq: join(`(k:1 h:.5 h:.5 s:1 h:.5 h:.5 |)x15 k:1 h:.5 h:.5 s:.5 s:.5 s:1/3 s s`, `x+T:1 h:.5 b:.5 s:1 h:.5 h:.5 | (T:1 h:.5 b:.5 s:1 h:.5 h:.5 |)x14 T:1 h:.5 h:.5 s:.5 s:.5 s:1/3 s s`),
      intro: 'r:2 s:.5 s s:.25 s s s',
    },
  ],
}

// ─── onsen ─ warm, unhurried, steam rising; F yo (F G Bb C D).
//     Koto and a breathy flute over soft pads; a tsuzumi taps now and then.
const onsenProg = 'F Bb F C Dm Bb Gm C F Bb Dm C Bb C F F'
const onsenTune = `C5:1.5 D5:.5 F5:2 | D5:1 C5:.5 Bb4:.5 C5:2 | F4:1 G4:1 Bb4:1 C5:1 | D5:3 r:1 |
  F5:1.5 G5:.5 F5:1 D5:1 | C5:1 D5:.5 C5:.5 Bb4:2 | G4:1 Bb4:1 C5:1 D5:1 | C5:4 |
  D5:1 F5:1 G5:1.5 F5:.5 | D5:1 C5:1 D5:2 | Bb4:1 C5:.5 D5:.5 F5:1 D5:1 | C5:3 r:1 |
  G5:1.5 F5:.5 D5:1 C5:1 | D5:1 C5:.5 Bb4:.5 G4:2 | F4:1 G4:1 C5:1 G4:1 | F4:4`
const onsen: TrackDef = {
  bpm: 76,
  loop: true,
  channels: [
    { inst: 'koto', vol: 0.2, pan: 0.1, echo: { beats: 0.75, vol: 0.25 }, seq: join(onsenTune, ch(onsenProg, 4, '0:.5 1 2 3 2 1 2 1')) },
    { inst: 'flute', vol: 0.12, vib: 18, pan: -0.15, seq: join(rests(16), onsenTune) },
    { inst: 'pad', vol: 0.045, seq: join(pads(onsenProg, 3), pads(onsenProg, 3)) },
    { inst: 'tri', vol: 0.18, gate: 0.9, seq: join(ch(onsenProg, 2, '0:2 2:2'), ch(onsenProg, 2, '0:2 2:2')) },
    { inst: 'bell', vol: 0.08, seq: join('F4:4', rests(7), 'C4:4', rests(7), 'F4:4', rests(7), 'Bb3:4', rests(7)) },
    { inst: 'noise', vol: 0.06, seq: join(`(r:2 t:1 r:1 | r:4 |)x8`, `(b:2 t:1 r:1 | r:2 t:.5 t:.5 r:1 |)x8`) },
  ],
}

// ─── castletown ─ bustling and bright, a festival street; C yo (C D F G A).
//     Shamisen-like plucks (koto), fife on the second pass, taiko and bells.
const castleProg = 'C F C G Am F G C F G Em Am F G C C'
const castleTune = `G4:.5 A4:.5 C5:1 D5:1 C5:1 | A4:1 G4:.5 A4:.5 C5:2 | D5:.5 F5:.5 G5:1 F5:1 D5:1 | C5:3 r:1 |
  G5:1 A5:.5 G5:.5 F5:1 D5:1 | C5:.5 D5:.5 F5:1 G5:2 | A5:1 G5:1 F5:1 D5:1 | G5:4 |
  C6:1.5 A5:.5 G5:1 F5:1 | G5:.5 A5:.5 G5:.5 F5:.5 D5:2 | C5:1 D5:.5 F5:.5 G5:1 A5:1 | G5:3 r:1 |
  A5:1 G5:.5 F5:.5 D5:1 F5:1 | G5:1.5 F5:.5 D5:1 C5:1 | D5:.5 F5:.5 G5:.5 F5:.5 D5:1 G4:1 | C5:3 r:1`
const castletown: TrackDef = {
  bpm: 116,
  loop: true,
  channels: [
    { inst: 'pulse25', vol: 0.11, vib: 8, detune: 6, gate: 0.8, seq: join(castleTune, ch(castleProg, 4, '1:1 2:1 1:2')), intro: 'r:2 G4:.5 A4 C5 D5' },
    { inst: 'flute', vol: 0.14, vib: 12, pan: 0.15, seq: join(rests(16), castleTune) },
    { inst: 'koto', vol: 0.14, pan: -0.3, gate: 0.6, seq: join(ch(castleProg, 4, '0:.5 2 1 2 0 2 1 2'), ch(castleProg, 4, '0:.5 2 1 2 3 2 1 2')) },
    { inst: 'pad', vol: 0.035, seq: join(rests(8), pads(bars(castleProg, 9, 16), 3), pads(castleProg, 3)) },
    { inst: 'tri', vol: 0.24, gate: 0.7, seq: join(ch(castleProg, 2, '0:1 2:1 3:1 2:1'), ch(castleProg, 2, '0:1 2:1 3:1 2:1')), intro: 'r:3 G2:1' },
    {
      inst: 'noise',
      vol: 0.12,
      seq: join(`(T:.5 h:.5 s h T h s h |)x15 T:.5 h s h s:.25 s s s T:.5 s`, `(T:.5 h:.5 s o T T s h |)x15 T:.5 h s h s:.25 s s s T:.5 s`),
      intro: 'r:2 T:.5 T T:.25 T T T',
    },
  ],
}

// ─── snowtemple ─ hushed and crystalline; E in scale (E F# G B C).
//     A bell and koto in the snow; the flute enters the second time round.
const snowProg = 'Em Em Cmaj7 B5 Em Am C B5 Am Am Em Em C B5 Em Em'
const snowTune = `B4:1.5 C5:.5 E5:2 | F#5:1 E5:.5 C5:.5 B4:2 | G4:1 B4:1 C5:1 E5:1 | F#5:3 r:1 |
  G5:1.5 F#5:.5 E5:1 C5:1 | B4:1 C5:1 E5:2 | F#5:1 E5:1 C5:1 B4:1 | B4:4 |
  E5:1 G5:1 B5:2 | A5:1 G5:.5 F#5:.5 E5:2 | C5:1 E5:1 F#5:1 G5:1 | F#5:4 |
  E5:1.5 C5:.5 B4:1 G4:1 | F#4:1 G4:1 B4:2 | C5:1 B4:.5 G4:.5 F#4:2 | E4:4`
const snowtemple: TrackDef = {
  bpm: 70,
  loop: true,
  channels: [
    { inst: 'koto', vol: 0.2, pan: 0.15, echo: { beats: 1.5, vol: 0.3 }, seq: join(snowTune, ch(snowProg, 4, '0:1 2:1 1:1 3:1')) },
    { inst: 'flute', vol: 0.1, vib: 16, pan: -0.2, seq: join(rests(16), snowTune) },
    { inst: 'pad', vol: 0.035, seq: join(pads(snowProg, 3), pads(snowProg, 3)) },
    { inst: 'tri', vol: 0.16, gate: 0.97, seq: join(ch(snowProg, 2, '0:4'), ch(snowProg, 2, '0:4')) },
    { inst: 'bell', vol: 0.14, seq: join('E4:4', rests(3), 'B3:4', rests(3), 'E4:4', rests(3), 'G3:4', rests(3), 'E4:4', rests(3), 'B3:4', rests(3), 'C4:4', rests(3), 'E4:4', rests(3)) },
    { inst: 'noise', vol: 0.04, seq: join(`(r:4 |)x8 (w:4 | r:4 |)x4`, `(r:4 |)x8 (w:4 | r:4 |)x4`) },
  ],
}

// ─── clouds ─ airy and wondering, a city above the weather; D yo (D E F# A B).
//     Harp sparkles and a high flute; thunder drums rumble far below.
const cloudsProg = 'D G D A Bm G A D G A F#m Bm G A D D'
const cloudsTune = `F#5:1 A5:1 B5:1.5 A5:.5 | F#5:1 E5:.5 D5:.5 E5:2 | A4:.5 B4:.5 D5:.5 E5:.5 F#5:1 A5:1 | B5:3 r:1 |
  D6:1.5 B5:.5 A5:1 F#5:1 | E5:.5 F#5:.5 A5:1 B5:2 | A5:1 F#5:1 E5:1 D5:1 | E5:4 |
  B5:1 A5:.5 B5:.5 D6:2 | E6:1 D6:.5 B5:.5 A5:2 | F#5:1 A5:1 B5:1 D6:1 | B5:3 r:1 |
  A5:1.5 F#5:.5 E5:1 D5:1 | E5:1 F#5:.5 A5:.5 B5:2 | A5:1 F#5:.5 E5:.5 D5:1 E5:1 | D5:3 r:1`
const clouds: TrackDef = {
  bpm: 100,
  loop: true,
  channels: [
    { inst: 'pulse12', vol: 0.09, vib: 14, detune: 9, pan: 0.15, echo: { beats: 0.75, vol: 0.35 }, seq: join(cloudsTune, ch(cloudsProg, 5, '1:2 2:2')) },
    { inst: 'flute', vol: 0.13, vib: 18, pan: -0.1, seq: join(rests(16), cloudsTune) },
    { inst: 'harp', vol: 0.08, pan: 0.4, seq: join(ch(cloudsProg, 4, '0:.5 1 2 3 2 1 2 3'), ch(cloudsProg, 5, 'r:1 0:.5 1 2:1 1:1')) },
    { inst: 'pad', vol: 0.05, seq: join(pads(cloudsProg, 3), pads(cloudsProg, 4)) },
    { inst: 'tri', vol: 0.2, gate: 0.85, seq: join(ch(cloudsProg, 2, '0:2 2:1 3:1'), ch(cloudsProg, 2, '0:2 2:1 3:1')) },
    { inst: 'noise', vol: 0.08, seq: join(`(T:2 h:1 h:1 | r:1 h:1 T:1 h:1 |)x8`, `(T:1 h:.5 h:.5 s:1 h:1 | T:1 h:.5 o:.5 T:1 h:1 |)x8`) },
  ],
}

export const TRACKS: Record<TrackId, TrackDef> = { title, village, fields, forest, shrine, tower, battle, boss, victory, shop, game, harbour, onsen, castletown, snowtemple, clouds }
export const TRACK_IDS = Object.keys(TRACKS) as TrackId[]

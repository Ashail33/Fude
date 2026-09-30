/**
 * Original chiptune compositions for Kotoba no Mahō.
 *
 * Every piece is written for this game (no borrowed melodies). Melodies lean
 * on Japanese scales — yo (1 2 4 5 6), in / miyako-bushi (1 b2 4 5 b6) and the
 * min'yō/ritsu pentatonic modes — over simple Western-style harmony, like a
 * 16-bit RPG soundtrack. Notation: see ./sequence.ts. One token per note,
 * `|` between bars, 4 beats per bar.
 */

import { fromChords as ch, type TrackDef } from './sequence'

export type TrackId = 'title' | 'village' | 'fields' | 'forest' | 'shrine' | 'tower' | 'battle' | 'boss' | 'victory' | 'shop' | 'game'

// ─── title ─ wistful and grand; D min'yō (D F G A C). Harp-like koto opens,
//     melody enters at bar 5, harmony + timpani join at bar 9.
const titleProg = 'Dm Bb C Am Dm Bb Gm A Bb C Dm F Gm C Asus4 A'
const title: TrackDef = {
  bpm: 80,
  loop: true,
  channels: [
    {
      inst: 'pulse50',
      vol: 0.13,
      vib: 14,
      pan: 0.1,
      echo: { beats: 0.75, vol: 0.3 },
      seq: `r:4 | r:4 | r:4 | r:4 |
        A4:1.5 D5:.5 C5:1 A4:1 | G4:1 F4:.5 G4:.5 A4:2 | D5:1.5 C5:.5 A4:1 G4:1 | A4:3 r:1 |
        D5:1 F5:1 G5:1.5 F5:.5 | E5:1 G5:.5 E5:.5 C5:2 | D5:1.5 F5:.5 A5:2 | G5:.5 A5:.5 G5:.5 F5:.5 C5:2 |
        D5:1 G5:1 F5:1 D5:1 | C5:1.5 D5:.5 E5:1 G5:1 | A5:2 G5:1 D5:1 | C#5:4`,
    },
    {
      inst: 'pulse12',
      vol: 0.07,
      pan: -0.35,
      seq: `(r:4 |)x8
        F4:4 | G4:4 | A4:4 | A4:4 | Bb4:4 | G4:4 | E4:2 D4:2 | E4:4`,
    },
    { inst: 'koto', vol: 0.2, pan: -0.15, seq: ch(titleProg, 3, '0:.5 1 2 3 4 3 2 1') },
    {
      inst: 'tri',
      vol: 0.24,
      seq: ch('Dm Bb C Am Dm Bb Gm A', 2, '0:4') + ' | ' + ch('Bb C Dm F Gm C Asus4 A', 2, '0:1.5 0:.5 2:1 3:1'),
    },
    {
      inst: 'noise',
      vol: 0.13,
      seq: `(r:4 |)x8 (k:2 k:1 k:1 |)x3 k:2 t:1 t:1 | (k:2 k:1 k:1 |)x3 (s:1/4)x16`,
    },
  ],
}

// ─── village ─ cheerful, bouncy, warm; D yo scale (D E G A B).
const villageProg = 'D G D A D G Em A G A Bm G D G A D'
const village: TrackDef = {
  bpm: 112,
  loop: true,
  channels: [
    {
      inst: 'pulse25',
      vol: 0.12,
      vib: 8,
      gate: 0.85,
      seq: `A4:.5 B4:.5 D5:1 B4:.5 A4:.5 G4:1 | B4:1.5 A4:.5 G4:1 E4:1 | D4:.5 E4:.5 G4:.5 A4:.5 B4:1 A4:1 | E5:2 r:1 A4:.5 B4:.5 |
        D5:1 E5:.5 D5:.5 B4:1 A4:1 | G4:.5 A4:.5 B4:1 D5:1.5 B4:.5 | A4:1 G4:.5 E4:.5 G4:1 A4:.5 B4:.5 | A4:3 r:1 |
        B4:.5 D5:.5 E5:1 D5:.5 B4:.5 D5:1 | E5:.5 G5:.5 A5:1 G5:.5 E5:.5 D5:1 | D5:1.5 B4:.5 A4:1 B4:1 | G4:.5 A4:.5 B4:.5 D5:.5 E5:2 |
        A5:1.5 G5:.5 E5:1 D5:1 | B4:.5 D5:.5 E5:.5 D5:.5 B4:1 G4:1 | A4:.5 B4:.5 D5:.5 E5:.5 B4:1 A4:1 | D5:3 r:1`,
    },
    { inst: 'pulse12', vol: 0.06, pan: -0.4, gate: 0.5, seq: ch(villageProg, 4, 'r:.5 1:.5 r 2 r 1 r 2') },
    { inst: 'tri', vol: 0.24, gate: 0.7, seq: ch(villageProg, 2, '0:1 2:1 3:1 2:.5 1:.5') },
    { inst: 'noise', vol: 0.12, seq: `(k:.5 h:.5 h s h h k h |)x15 k:.5 h s h s:.25 s s s k:.5 s` },
  ],
}

// ─── fields ─ breezy, open, pastoral; G yo (G A C D E).
const fieldsProg = 'G C G D Em C Am D G Em C D Em C D G'
const fields: TrackDef = {
  bpm: 120,
  loop: true,
  channels: [
    {
      inst: 'pulse25',
      vol: 0.12,
      vib: 12,
      pan: 0.1,
      seq: `D5:1.5 E5:.5 G5:2 | E5:1 D5:.5 C5:.5 D5:2 | G4:.5 A4:.5 C5:.5 D5:.5 E5:1 D5:1 | A4:3 r:1 |
        E5:1.5 G5:.5 A5:1 G5:1 | E5:.5 D5:.5 C5:1 E5:2 | A4:1 C5:1 D5:1 E5:1 | D5:4 |
        G5:1.5 E5:.5 D5:1 E5:1 | G5:.5 A5:.5 G5:.5 E5:.5 D5:2 | C5:1 D5:.5 E5:.5 G5:1 E5:1 | D5:3 A4:1 |
        G4:1 A4:.5 C5:.5 D5:1 E5:1 | G5:1.5 E5:.5 D5:1 C5:1 | A4:1 C5:1 D5:1 A4:1 | G4:3 r:1`,
    },
    { inst: 'pulse12', vol: 0.055, pan: -0.4, gate: 0.6, seq: ch(fieldsProg, 4, '0:.5 2 1 2 0 2 1 2') },
    { inst: 'tri', vol: 0.22, gate: 0.85, seq: ch(fieldsProg, 2, '0:1 2:1 3:1 2:1') },
    { inst: 'noise', vol: 0.09, seq: `(k:1 h:.5 h:.5 s:1 h:1 |)x16` },
  ],
}

// ─── forest ─ mysterious, gentle; E in / miyako-bushi (E F A B C).
const forestProg = 'Am Am Fmaj7 E5 Am Am Fmaj7 E5 F F Am Am F E5 Am E5'
const forest: TrackDef = {
  bpm: 92,
  loop: true,
  channels: [
    {
      inst: 'pulse50',
      vol: 0.1,
      vib: 16,
      pan: 0.15,
      echo: { beats: 0.75, vol: 0.35 },
      seq: `E5:1.5 F5:.5 E5:1 C5:1 | B4:1 C5:.5 B4:.5 A4:2 | F4:.5 A4:.5 B4:1 C5:1 E5:1 | B4:3 r:1 |
        A5:1.5 F5:.5 E5:1 C5:1 | B4:.5 C5:.5 E5:1 F5:2 | E5:1 C5:1 A4:1 B4:1 | E5:4 |
        F5:1 E5:.5 F5:.5 A5:2 | C5:1 E5:1 F5:1 E5:1 | A4:1.5 B4:.5 C5:1 B4:.5 A4:.5 | E4:4 |
        F4:.5 A4:.5 C5:.5 E5:.5 F5:1 E5:1 | B4:1.5 C5:.5 B4:1 F4:1 | A4:2 r:2 | r:4`,
    },
    { inst: 'koto', vol: 0.17, pan: -0.25, seq: ch(forestProg, 3, '0:.5 2 3 2 1 2 3 4') },
    { inst: 'tri', vol: 0.2, seq: ch(forestProg, 2, '0:2 0:1.5 2:.5') },
    { inst: 'noise', vol: 0.07, seq: `(r:1 h:.5 h:.5 r:1 h:1 | r:1 h:.5 h:.5 t:1 h:.5 h:.5 |)x8` },
  ],
}

// ─── shrine ─ serene, sparse; D in scale (D Eb G A Bb), koto + temple bell.
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
      inst: 'pulse12',
      vol: 0.035,
      pan: -0.3,
      vib: 10,
      seq: `(r:4 |)x8 D4:4 | Eb4:4 | G4:4 | A4:4 | Bb4:4 | A4:4 | G4:2 A4:2 | D4:4`,
    },
    { inst: 'tri', vol: 0.18, gate: 0.97, seq: ch('D5 D5 Gm D5 Eb Bb Gm D5 D5 Eb Gm A5 Gm Eb Gm D5', 2, '0:4') },
    { inst: 'bell', vol: 0.16, seq: `D4:4 | (r:4 |)x3 A3:4 | (r:4 |)x3 D4:4 | (r:4 |)x3 G3:4 | r:4 | r:4 | D4:4` },
  ],
}

// ─── tower ─ epic, ascending, determined; E minor with rising sequences.
const towerProg = 'Em C D B Em C Am B C D Em G C D Bsus4 B'
const tower: TrackDef = {
  bpm: 132,
  loop: true,
  channels: [
    {
      inst: 'pulse50',
      vol: 0.11,
      vib: 10,
      seq: `E4:.5 G4:.5 B4:1 E5:1.5 D5:.5 | C5:1 E5:1 G5:2 | F#5:1.5 E5:.5 D5:1 A4:1 | B4:3 D#5:1 |
        E5:.5 G5:.5 B5:1 A5:1 G5:1 | E5:1.5 G5:.5 C6:2 | A5:1 G5:.5 E5:.5 C5:1 E5:1 | F#5:2 D#5:2 |
        G5:1 E5:.5 G5:.5 C6:2 | A5:1 F#5:.5 A5:.5 D6:2 | B5:1.5 A5:.5 G5:1 E5:1 | D5:1 G5:1 B5:2 |
        C6:1.5 B5:.5 G5:1 E5:1 | D6:1.5 C6:.5 A5:1 F#5:1 | E5:2 F#5:2 | D#5:4`,
    },
    { inst: 'pulse25', vol: 0.05, pan: -0.35, gate: 0.7, seq: ch(towerProg, 4, '0:.5 1 2 3 1 2 3 4') },
    { inst: 'tri', vol: 0.24, gate: 0.8, seq: ch(towerProg, 2, '0:.5 0 3 0 0 3 0 3') },
    { inst: 'noise', vol: 0.12, seq: `(k:.5 h s h k k s h |)x7 k:.5 h s h s:.25 s s s k:.5 s |` + ` (k:.5 h s h k k s h |)x7 (s:1/4)x8 k:.5 s s:1/3 s s` },
  ],
}

// ─── battle ─ fast and driving; A minor with in-scale (Bb) colour.
const battleProg = 'Am Am F G Am Am Bb E Dm F Am Bb Dm E Bb E'
const battle: TrackDef = {
  bpm: 160,
  loop: true,
  channels: [
    {
      inst: 'pulse25',
      vol: 0.11,
      vib: 6,
      gate: 0.88,
      seq: `A4:.5 E5 r A5 G5 E5 D5 E5 | C5:1.5 D5:.5 E5:1 A4:1 | F5:.5 E5 D5 C5 D5:1 A4:1 | G4:.5 A4 B4 D5 G5:2 |
        A5:.5 A5 G5 E5 A5 C6 B5 A5 | E5:2 r:.5 E5 G5 A5 | Bb5:1.5 A5:.5 F5:1 D5:1 | E5:.5 F5 E5 D5 E5:2 |
        D5:1 F5:1 A5:1.5 G5:.5 | F5:.5 E5 F5 A5 C6:2 | A5:1 E5:.5 A5:.5 C6:1 B5:1 | Bb5:1.5 A5:.5 F5:2 |
        D6:1 A5:1 F5:1 D5:1 | E5:1 G#5:1 B5:1 D6:1 | D6:.5 C6 Bb5 A5 F5 D5 F5 A5 | G#5:2 E5:1 B4:1`,
    },
    { inst: 'pulse12', vol: 0.055, pan: -0.35, gate: 0.55, seq: ch(battleProg, 4, '0:.5 2 3 2 1 2 3 2') },
    { inst: 'tri', vol: 0.25, gate: 0.75, seq: ch(battleProg, 2, '0:.5 3 0 3 0 3 0 3') },
    { inst: 'noise', vol: 0.13, seq: `(k:.5 h s h k k s h |)x15 (s:1/4)x12 s:.5 k:.5` },
  ],
}

// ─── boss ─ intense and heavy; D in scale (D Eb G A Bb) with a tritone bite.
const bossProg = 'Dm Dm Eb Dm Bb A Dm Eb Gm Gm Eb Eb Bb A Eb A'
const boss: TrackDef = {
  bpm: 150,
  loop: true,
  channels: [
    {
      inst: 'pulse50',
      vol: 0.1,
      vib: 8,
      seq: `D5:1 r:.5 D5:.5 Eb5:1 D5:1 | A4:.5 Bb4 A4 G4 A4:2 | G5:1 r:.5 G5:.5 A5:1 G5:.5 Eb5:.5 | D5:3 r:1 |
        F5:1 D5:.5 F5:.5 Bb5:1 A5:1 | A5:1.5 G5:.5 E5:1 C#5:1 | D5:.5 F5 A5 D6 C6:1 A5:1 | Bb5:2 G5:2 |
        G5:1 Bb5:1 D6:1.5 C6:.5 | Bb5:.5 A5 G5 D5 G5:2 | Eb6:1 D6:.5 Bb5:.5 G5:1 Bb5:1 | A5:4 |
        F5:.5 Bb5 D6 F6 Eb6:1 D6:1 | C#6:2 A5:2 | G5:.5 Bb5 Eb6 D6 Bb5:1 G5:1 | A5:.5 G5 E5 C#5 A4:2`,
    },
    { inst: 'pulse25', vol: 0.05, pan: -0.3, gate: 0.6, seq: ch(bossProg, 3, '0:.5 2 0 2 1 2 0 2') },
    { inst: 'tri', vol: 0.28, gate: 0.8, seq: ch(bossProg, 1, '0:.5 0 3 0 0 2 3 0') },
    { inst: 'noise', vol: 0.13, seq: `(k:.25 k h:.5 s h k:.25 k k:.5 s h |)x15 (s:1/4)x8 k:.5 s k s` },
  ],
}

// ─── victory ─ short fanfare jingle (not looping); D major / yo colour.
const victory: TrackDef = {
  bpm: 140,
  loop: false,
  channels: [
    { inst: 'pulse50', vol: 0.12, vib: 10, seq: `A4:.5 D5 E5 A5 G5:1 E5:1 | D5:.5 E5 G5 A5 B5:2 | A5:1 G5:.5 E5:.5 G5:1 A5:1 | D6:3 r:1` },
    { inst: 'pulse25', vol: 0.06, pan: -0.3, seq: `F#4:1 A4:1 B4:1 G4:1 | G4:1 B4:1 D5:2 | E5:1 E5:.5 C#5:.5 E5:1 E5:1 | F#5:3 r:1` },
    { inst: 'tri', vol: 0.24, gate: 0.8, seq: `D2:1 D3:1 G2:1 A2:1 | G2:1 G3:1 G2:1 B2:1 | E2:1 E3:1 A2:1 A3:1 | D2:3 r:1` },
    { inst: 'noise', vol: 0.14, seq: `(k:.5 h s h k h s h |)x3 s:.25 s s s k:1 r:2` },
  ],
}

// ─── shop ─ playful and light; G yo with bouncy staccato.
const shopProg = 'G Em C D G Em Am D C D Bm Em C D G D'
const shop: TrackDef = {
  bpm: 124,
  loop: true,
  channels: [
    {
      inst: 'pulse12',
      vol: 0.13,
      gate: 0.55,
      seq: `G4:.5 r D5 r B4 A4 G4:1 | E4:.5 G4 A4 B4 E5:1 D5:1 | C5:.5 r E5 r D5 C5 A4:1 | D5:1.5 E5:.5 D5:1 r:1 |
        B4:.5 D5 G5 D5 E5 D5 B4:1 | G4:.5 A4 B4:1 E5:.5 D5 B4:1 | A4:.5 C5 E5 G5 E5 C5 A4:1 | D5:1 A4:.5 D5:.5 r:2 |
        E5:1 G5:.5 E5:.5 D5:1 C5:1 | A4:1 D5:.5 E5:.5 F#5:1 D5:1 | B4:.5 D5 F#5 D5 B4:1 A4:1 | G4:1.5 A4:.5 B4:1 E4:1 |
        C5:.5 E5 G5 E5 C5 E5 G5:1 | A5:.5 G5 F#5 E5 D5:1 A4:1 | B4:.5 D5 G5 B5 A5:1 G5:1 | D5:.5 r D5 r D5:1 r:1`,
    },
    { inst: 'pulse25', vol: 0.05, pan: -0.35, gate: 0.4, seq: ch(shopProg, 4, 'r:.5 1 r 2 r 1 r 2') },
    { inst: 'tri', vol: 0.24, gate: 0.6, seq: ch(shopProg, 2, '0:.5 r 2 r 3 r 2 r') },
    { inst: 'noise', vol: 0.1, seq: `(k:.5 h s h:.25 h k:.5 h s h |)x16` },
  ],
}

// ─── game ─ upbeat but calm focus music for mini-games; C major pentatonic.
const gameProg = 'C Am F G C Am Dm G F G Em Am F G C G'
const game: TrackDef = {
  bpm: 116,
  loop: true,
  channels: [
    {
      inst: 'pulse25',
      vol: 0.085,
      vib: 8,
      seq: `E5:1 G5:1 A5:2 | G5:1 E5:1 r:2 | C5:1 D5:1 E5:1.5 D5:.5 | D5:2 r:2 |
        E5:1 G5:1 C6:2 | A5:1 G5:1 r:2 | D5:1 E5:.5 D5:.5 C5:1 A4:1 | G4:2 r:2 |
        A4:1 C5:1 D5:1 E5:1 | D5:2 G5:2 | G5:1 E5:1 D5:1 E5:1 | A4:2 r:2 |
        C5:1 A4:.5 C5:.5 D5:1 E5:1 | G5:2 D5:2 | E5:1.5 D5:.5 C5:2 | r:4`,
    },
    { inst: 'pulse12', vol: 0.045, pan: -0.35, gate: 0.5, seq: ch(gameProg, 4, '0:.5 2 1 2 0 2 1 2') },
    { inst: 'tri', vol: 0.22, gate: 0.75, seq: ch(gameProg, 2, '0:1.5 0:.5 2:1 3:1') },
    { inst: 'noise', vol: 0.08, seq: `(k:1 h:.5 h:.5 s:1 h:.5 h:.5 |)x16` },
  ],
}

export const TRACKS: Record<TrackId, TrackDef> = { title, village, fields, forest, shrine, tower, battle, boss, victory, shop, game }
export const TRACK_IDS = Object.keys(TRACKS) as TrackId[]

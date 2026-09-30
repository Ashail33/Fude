/**
 * Character voices on WebAudio: "animalese" talk syllables while dialogue
 * types out (./audio/talk.ts), and short signature cries (Fude's chime, a
 * cat's meow, the oni's roar…). Profiles live in ./audio/voices.ts.
 * Everything goes through the shared SFX bus, respects `settings.sound`,
 * and is silent before the first user gesture (like the rest of the game's
 * audio).
 */

import { audioCtx, getSfxBus } from './audio/context'
import { noiseBuffer, pulseWave } from './audio/synth'
import { playSyllable } from './audio/talk'
import { shouldBlip, voiceFor, voiceKey, type CryId } from './audio/voices'
import { getState } from './store'

type BlipWave = 'sine' | 'triangle' | 'square' | 'sawtooth' | 'pulse12' | 'pulse25' | 'pulse50' | 'noise'

function out(): { c: AudioContext; bus: AudioNode } | null {
  try {
    if (!getState().settings.sound) return null
  } catch {
    return null
  }
  const c = audioCtx()
  const bus = getSfxBus()
  return c && bus ? { c, bus } : null
}

type Curve = [number, number][]

/** Cries sit clearly above the music and the talk syllables. */
const CRY_BOOST = 1.6

interface OscSpec {
  wave: BlipWave
  /** Frequency points [time from start (s), Hz]; the first is the start pitch. */
  f: Curve
  /** Peak level, attack and the time the note ends (exponential tail). */
  gain: number
  attack?: number
  dur: number
  delay?: number
  /** Optional filter with its own frequency points. */
  filter?: { type: BiquadFilterType; f: Curve; q?: number }
  detune?: number
  /** Amplitude tremolo (Hz, depth 0..1) — growls and croaks. */
  trem?: [number, number]
}

function setCurve(p: AudioParam, t0: number, pts: Curve, mul = 1) {
  p.setValueAtTime(pts[0][1] * mul, t0)
  for (let i = 1; i < pts.length; i++) p.exponentialRampToValueAtTime(Math.max(1, pts[i][1] * mul), t0 + pts[i][0])
}

/** One synthesised voice (oscillator or noise) → optional filter → envelope → bus. */
function voice(spec: OscSpec, pm = 1) {
  const o = out()
  if (!o) return
  const { c, bus } = o
  const t0 = c.currentTime + 0.005 + (spec.delay ?? 0)
  const end = t0 + spec.dur
  let src: AudioScheduledSourceNode
  let head: AudioNode
  const nodes: AudioNode[] = []
  if (spec.wave === 'noise') {
    // Pitched noise: a resonant band-pass that follows the frequency curve.
    const n = c.createBufferSource()
    n.buffer = noiseBuffer(c)
    n.loop = true
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 6
    setCurve(bp.frequency, t0, spec.f, pm)
    n.connect(bp)
    src = n
    head = bp
    nodes.push(n, bp)
  } else {
    const osc = c.createOscillator()
    const wave = spec.wave ?? 'triangle'
    if (wave.startsWith('pulse')) osc.setPeriodicWave(pulseWave(c, wave === 'pulse12' ? 0.125 : wave === 'pulse25' ? 0.25 : 0.5))
    else osc.type = wave as OscillatorType
    setCurve(osc.frequency, t0, spec.f, pm)
    if (spec.detune) osc.detune.value = spec.detune
    src = osc
    head = osc
    nodes.push(osc)
  }
  if (spec.filter) {
    const f = c.createBiquadFilter()
    f.type = spec.filter.type
    f.Q.value = spec.filter.q ?? 1
    setCurve(f.frequency, t0, spec.filter.f, spec.filter.type === 'lowpass' ? 1 : pm)
    head.connect(f)
    head = f
    nodes.push(f)
  }
  const g = c.createGain()
  const atk = Math.min(spec.attack ?? 0.006, spec.dur * 0.5)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.linearRampToValueAtTime(spec.gain * CRY_BOOST, t0 + atk)
  g.gain.exponentialRampToValueAtTime(0.0001, end)
  head.connect(g)
  nodes.push(g)
  if (spec.trem) {
    const lfo = c.createOscillator()
    const depth = c.createGain()
    const tg = c.createGain()
    lfo.frequency.value = spec.trem[0]
    depth.gain.value = spec.trem[1]
    tg.gain.value = 1 - spec.trem[1]
    lfo.connect(depth).connect(tg.gain)
    g.connect(tg).connect(bus)
    lfo.start(t0)
    lfo.stop(end + 0.05)
    nodes.push(lfo, depth, tg)
  } else g.connect(bus)
  if (spec.wave === 'noise') (src as AudioBufferSourceNode).start(t0, (t0 * 3.7) % 0.6)
  else src.start(t0)
  src.stop(end + 0.05)
  src.onended = () => {
    for (const n of nodes) n.disconnect()
  }
}

// ─── Talk syllables ──────────────────────────────────────────────────

let lastBlip = 0
/** Minimum gap between syllables (ms) so fast text never machine-guns. */
const BLIP_GAP = 42

/**
 * Talk syllable for the `i`-th character `ch` of a line spoken by
 * `speaker` (sprite or story speaker id, optionally `id#name`; unknown or
 * undefined = narrator). Skips spaces and punctuation, sounds every few
 * characters per voice, and is rate-limited (slow speakers leave longer
 * gaps, so big creatures really do talk slower).
 */
function talk(speaker: string | null | undefined, ch: string, i: number, question = false) {
  const p = voiceFor(speaker)
  if (!shouldBlip(p, ch, i)) return
  const now = typeof performance === 'undefined' ? Date.now() : performance.now()
  if (now - lastBlip < Math.max(BLIP_GAP, p.len * 700)) return
  const o = out()
  if (!o) return
  lastBlip = now
  try {
    playSyllable(o.c, o.bus, o.c.currentTime + 0.005, p, ch, { question })
  } catch {
    /* audio unavailable */
  }
}

// ─── Signature cries ─────────────────────────────────────────────────

type CryFn = (pm: number, speaker: string) => void

const CRIES: Record<CryId, CryFn> = {
  // Fude: a sparkling yo-scale chime with an inharmonic shimmer.
  chime: (pm) =>
    [1568, 2093, 2637].forEach((f, i) => {
      voice({ wave: 'sine', f: [[0, f]], gain: 0.06, attack: 0.003, dur: 0.6, delay: i * 0.07 }, pm)
      voice({ wave: 'sine', f: [[0, f * 2.76]], gain: 0.02, attack: 0.002, dur: 0.25, delay: i * 0.07 }, pm)
    }),
  // Mage: a staff's low magical hum swelling into a glint.
  staff: (pm) => {
    voice({ wave: 'sine', f: [[0, 110], [0.5, 118]], gain: 0.1, attack: 0.15, dur: 0.55, trem: [7, 0.3] }, pm)
    voice({ wave: 'triangle', f: [[0, 220], [0.5, 236]], gain: 0.04, attack: 0.15, dur: 0.5 }, pm)
    voice({ wave: 'sine', f: [[0, 2349]], gain: 0.035, attack: 0.003, dur: 0.35, delay: 0.32 }, pm)
  },
  // Elder: a warm, creaky "hmm… hm".
  elder: (pm) => {
    voice({ wave: 'sawtooth', f: [[0, 150], [0.22, 138]], gain: 0.07, attack: 0.04, dur: 0.24, filter: { type: 'lowpass', f: [[0, 600]], q: 0.7 }, trem: [9, 0.2] }, pm)
    voice({ wave: 'sawtooth', f: [[0, 158], [0.25, 146]], gain: 0.06, attack: 0.03, dur: 0.26, delay: 0.3, filter: { type: 'lowpass', f: [[0, 560]], q: 0.7 } }, pm)
  },
  // Guard: armour clanks (two steps).
  armor: (pm) =>
    [0, 0.13].forEach((d) => {
      voice({ wave: 'sine', f: [[0, 1250]], gain: 0.04, attack: 0.002, dur: 0.18, delay: d }, pm)
      voice({ wave: 'sine', f: [[0, 1873]], gain: 0.03, attack: 0.002, dur: 0.12, delay: d }, pm)
      voice({ wave: 'noise', f: [[0, 4200]], gain: 0.06, attack: 0.002, dur: 0.05, delay: d }, pm)
    }),
  // Merchant: a little coin jingle.
  coins: (pm) =>
    [1318.5, 1760, 2093].forEach((f, i) => voice({ wave: 'pulse12', f: [[0, f]], gain: 0.035, attack: 0.002, dur: 0.12, delay: i * 0.06 }, pm)),
  // Priest: a shrine suzu bell cluster.
  suzu: (pm) =>
    [3100, 3900, 3350, 4200, 3600].forEach((f, i) => voice({ wave: 'sine', f: [[0, f]], gain: 0.025, attack: 0.002, dur: 0.3, delay: i * 0.045 }, pm)),
  // King: a tiny royal fanfare.
  fanfare: (pm) => {
    ;[587.33, 880, 1174.66].forEach((f, i) => voice({ wave: 'pulse50', f: [[0, f]], gain: 0.04, attack: 0.004, dur: i === 2 ? 0.4 : 0.1, delay: i * 0.09 }, pm))
    voice({ wave: 'triangle', f: [[0, 146.83]], gain: 0.1, dur: 0.5, delay: 0.18 }, pm)
  },
  // Innkeeper: a friendly "mm-hm!".
  hum: (pm) => {
    voice({ wave: 'triangle', f: [[0, 330], [0.14, 300]], gain: 0.07, attack: 0.02, dur: 0.15, filter: { type: 'lowpass', f: [[0, 900]] } }, pm)
    voice({ wave: 'triangle', f: [[0, 300], [0.18, 370]], gain: 0.07, attack: 0.02, dur: 0.2, delay: 0.19, filter: { type: 'lowpass', f: [[0, 900]] } }, pm)
  },
  // Jailer: a jangling key ring.
  keys: (pm) =>
    [0, 0.05, 0.09, 0.16].forEach((d, i) => {
      voice({ wave: 'noise', f: [[0, 5200 + i * 400]], gain: 0.05, attack: 0.002, dur: 0.07, delay: d }, pm)
      voice({ wave: 'sine', f: [[0, 2600 + i * 310]], gain: 0.015, attack: 0.002, dur: 0.1, delay: d }, pm)
    }),
  // Villagers: a curious "ん、ね？" in their own talk voice.
  greet: (pm, speaker) => {
    const o = out()
    if (!o) return
    const p = voiceFor(speaker)
    const t = o.c.currentTime + 0.01
    playSyllable(o.c, o.bus, t, p, 'ん', { pitch: pm, level: 1.2 })
    playSyllable(o.c, o.bus, t + Math.max(0.1, p.len * 1.4), p, 'ね', { pitch: pm, question: true, level: 1.2 })
  },
  // Child: a giggle of quick chirps.
  giggle: (pm) =>
    [900, 1050, 950, 1150].forEach((f, i) => voice({ wave: 'pulse25', f: [[0, f], [0.05, f * 1.15]], gain: 0.025, attack: 0.003, dur: 0.055, delay: i * 0.075 }, pm)),
  // Cat: "m-ee-ow" (pitch and formant rise then fall).
  meow: (pm) =>
    voice(
      {
        wave: 'sawtooth',
        f: [[0, 560], [0.14, 820], [0.45, 520]],
        gain: 0.06,
        attack: 0.05,
        dur: 0.48,
        filter: { type: 'bandpass', f: [[0, 1300], [0.16, 2400], [0.45, 1100]], q: 3 },
      },
      pm,
    ),
  // Dog: "wuf wuf!".
  bark: (pm) =>
    [0, 0.17].forEach((d) => {
      voice({ wave: 'sawtooth', f: [[0, 430], [0.09, 250]], gain: 0.09, attack: 0.006, dur: 0.1, delay: d, filter: { type: 'lowpass', f: [[0, 1500]], q: 2 } }, pm)
      voice({ wave: 'noise', f: [[0, 900]], gain: 0.05, attack: 0.004, dur: 0.07, delay: d }, pm)
    }),
  // Fox / kitsune: "kon kon".
  kon: (pm) =>
    [0, 0.16].forEach((d) => voice({ wave: 'triangle', f: [[0, 1150], [0.08, 780]], gain: 0.07, attack: 0.004, dur: 0.09, delay: d, filter: { type: 'bandpass', f: [[0, 1400]], q: 1.5 } }, pm)),
  // Slime: a wet "blorp".
  slime: (pm) => {
    voice({ wave: 'sine', f: [[0, 170], [0.1, 520], [0.2, 300]], gain: 0.12, attack: 0.01, dur: 0.22 }, pm)
    voice({ wave: 'sine', f: [[0, 600], [0.05, 900]], gain: 0.05, attack: 0.004, dur: 0.06, delay: 0.24 }, pm)
  },
  // Imp: a cackle.
  imp: (pm) =>
    [1300, 1000, 1250, 950, 1200].forEach((f, i) => voice({ wave: 'pulse12', f: [[0, f], [0.05, f * 0.8]], gain: 0.03, attack: 0.003, dur: 0.055, delay: i * 0.065 }, pm)),
  // Bat / harpy: a piercing screech.
  screech: (pm) => {
    voice({ wave: 'sawtooth', f: [[0, 2300], [0.1, 1800], [0.3, 2700]], gain: 0.035, attack: 0.01, dur: 0.32, filter: { type: 'bandpass', f: [[0, 2600]], q: 2 } }, pm)
    voice({ wave: 'noise', f: [[0, 5000]], gain: 0.03, attack: 0.02, dur: 0.3 }, pm)
  },
  // Mushroom: a spore puff.
  puff: (pm) => {
    voice({ wave: 'noise', f: [[0, 700], [0.3, 1500]], gain: 0.08, attack: 0.08, dur: 0.32 }, pm)
    voice({ wave: 'sine', f: [[0, 480], [0.06, 300]], gain: 0.08, attack: 0.003, dur: 0.08 }, pm)
  },
  // Kappa: a froggy croak.
  croak: (pm) =>
    voice({ wave: 'pulse25', f: [[0, 150], [0.28, 135]], gain: 0.07, attack: 0.01, dur: 0.3, filter: { type: 'bandpass', f: [[0, 700]], q: 3 }, trem: [28, 0.8] }, pm),
  // Tanuki: belly-drum "pon… pon!".
  pon: (pm) =>
    [0, 0.2].forEach((d, i) => {
      voice({ wave: 'sine', f: [[0, 175 - i * 15], [0.12, 95]], gain: 0.2, attack: 0.003, dur: 0.28, delay: d }, pm)
      voice({ wave: 'noise', f: [[0, 400]], gain: 0.05, attack: 0.002, dur: 0.05, delay: d }, pm)
    }),
  // Golem: grinding stone.
  rumble: (pm) => {
    voice({ wave: 'noise', f: [[0, 160], [0.9, 90]], gain: 0.22, attack: 0.1, dur: 0.95 }, pm)
    voice({ wave: 'sine', f: [[0, 55], [0.9, 38]], gain: 0.18, attack: 0.08, dur: 0.95, trem: [11, 0.5] }, pm)
    ;[0.2, 0.45, 0.62].forEach((d) => voice({ wave: 'noise', f: [[0, 1400]], gain: 0.04, attack: 0.002, dur: 0.04, delay: d }, pm))
  },
  // Wisp / librarian: a ghostly "wooo".
  wisp: (pm) => {
    voice({ wave: 'sine', f: [[0, 700], [0.3, 1100], [0.7, 620]], gain: 0.05, attack: 0.2, dur: 0.75, trem: [6, 0.35] }, pm)
    voice({ wave: 'noise', f: [[0, 1800], [0.7, 900]], gain: 0.03, attack: 0.25, dur: 0.7 }, pm)
  },
  // Treant / guardian: creaking wood.
  creak: (pm) => {
    voice({ wave: 'square', f: [[0, 38], [0.35, 55], [0.6, 42]], gain: 0.05, attack: 0.05, dur: 0.62, filter: { type: 'bandpass', f: [[0, 650]], q: 5 } }, pm)
    voice({ wave: 'sawtooth', f: [[0, 70], [0.6, 60]], gain: 0.05, attack: 0.1, dur: 0.6, filter: { type: 'lowpass', f: [[0, 300]] } }, pm)
  },
  // Tengu: a gust and a sharp "ha!".
  tengu: (pm) => {
    voice({ wave: 'noise', f: [[0, 500], [0.3, 2600]], gain: 0.08, attack: 0.1, dur: 0.32 }, pm)
    voice({ wave: 'sawtooth', f: [[0, 320], [0.12, 230]], gain: 0.06, attack: 0.005, dur: 0.14, delay: 0.28, filter: { type: 'bandpass', f: [[0, 950]], q: 1.4 } }, pm)
  },
  // Oni: a throaty roar.
  roar: (pm) => {
    for (const dt of [0, 9])
      voice({ wave: 'sawtooth', f: [[0, 105], [0.15, 125], [0.8, 72]], gain: 0.09, attack: 0.06, dur: 0.85, detune: dt, filter: { type: 'lowpass', f: [[0, 1100], [0.8, 380]], q: 1.5 }, trem: [23, 0.35] }, pm)
    voice({ wave: 'noise', f: [[0, 600], [0.8, 300]], gain: 0.1, attack: 0.05, dur: 0.8 }, pm)
  },
  // Skeleton: rattling bones.
  rattle: (pm) =>
    [0, 0.045, 0.085, 0.14, 0.18, 0.24].forEach((d, i) => voice({ wave: 'triangle', f: [[0, i % 2 ? 2100 : 1650]], gain: 0.05, attack: 0.001, dur: 0.03, delay: d }, pm)),
  // Dragon: a huge, rolling growl rising into a roar.
  growl: (pm) => {
    for (const dt of [0, 12])
      voice({ wave: 'sawtooth', f: [[0, 58], [1.2, 44]], gain: 0.12, attack: 0.15, dur: 1.3, detune: dt, filter: { type: 'lowpass', f: [[0, 420]], q: 2 }, trem: [17, 0.5] }, pm)
    voice({ wave: 'noise', f: [[0, 260]], gain: 0.15, attack: 0.2, dur: 1.3 }, pm)
    voice({ wave: 'sawtooth', f: [[0, 150], [0.25, 190], [0.8, 85]], gain: 0.07, attack: 0.05, dur: 0.85, delay: 0.45, filter: { type: 'lowpass', f: [[0, 1400], [0.8, 500]], q: 1.2 } }, pm)
  },
}

/** Roughly how long each cry takes to "land" (ms): dialogue waits this long before talking over it. */
const CRY_LEAD: Record<CryId, number> = {
  chime: 380, staff: 450, elder: 450, armor: 280, coins: 260, suzu: 300, fanfare: 450, hum: 380, keys: 260, greet: 300, giggle: 330,
  meow: 450, bark: 300, kon: 280, slime: 330, imp: 350, screech: 330, puff: 330, croak: 320, pon: 420, rumble: 550, wisp: 550,
  creak: 520, tengu: 450, roar: 600, rattle: 280, growl: 650,
}

const lastCry = new Map<string, number>()

/**
 * Play a speaker's signature cry, if they have one. `pitch` multiplies it
 * (e.g. a smaller variant); repeated calls within 400 ms are ignored.
 * Returns whether a cry exists for that speaker.
 */
function cry(speaker: string | null | undefined, opts: { pitch?: number } = {}): boolean {
  const key = voiceKey(speaker)
  if (!key) return false
  const p = voiceFor(speaker)
  if (!p.cry) return false
  const now = typeof performance === 'undefined' ? Date.now() : performance.now()
  if (now - (lastCry.get(key) ?? -Infinity) < 400) return true
  lastCry.set(key, now)
  try {
    CRIES[p.cry]((p.cryPitch ?? 1) * (opts.pitch ?? 1), speaker!)
  } catch {
    /* audio unavailable */
  }
  return true
}

/** How long (ms) to hold off speech so a speaker's cry is heard first (0 = no cry, or sound off). */
function cryLead(speaker: string | null | undefined): number {
  const p = voiceKey(speaker) ? voiceFor(speaker) : null
  if (!p?.cry || !out()) return 0
  return CRY_LEAD[p.cry]
}

export const voices = {
  /** Talk syllable for one typed character (see `talk`). */
  talk,
  /** Signature cry for a speaker / sprite id. */
  cry,
  /** Delay before speech so the cry is heard (see `cryLead`). */
  cryLead,
  /** Every cry id (for a sound test / tests). */
  cryIds: Object.keys(CRIES) as CryId[],
}

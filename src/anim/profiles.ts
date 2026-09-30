/**
 * Motion profiles for every illustrated (HD) asset. Region coordinates are
 * in the trimmed cut-out's normalised space (0,0 = top-left of the subject's
 * bounding box). They are deliberately soft and conservative so they read
 * well even where the exact silhouette differs a little between renders;
 * tune per asset here (amplitudes are fractions of width/height).
 */
import { HD_ASSETS, HD_BY_ID } from '../art/hd/manifest'
import type { Profile, Region } from './deform'
import { DEFAULT_SCENE, type SceneMotion } from './scene'

// ── Reusable regions ────────────────────────────────────────────────
const R = {
  /** Hair / top of the head for a waist-up portrait. */
  hairTop: { cx: 0.5, cy: 0.1, rx: 0.34, ry: 0.16, soft: 0.8 } as Region,
  /** Hair falling at both sides of the face (portraits). */
  hairSides: { cx: 0.5, cy: 0.3, rx: 0.42, ry: 0.22, soft: 0.8, ramp: [0.5, 0.12, 0.5, 0.45] } as Region,
  /** Bottom hem of long robes / cloth, stronger toward the edge. */
  hem: { cx: 0.5, cy: 0.98, rx: 0.62, ry: 0.26, soft: 0.8, ramp: [0.5, 0.72, 0.5, 1] } as Region,
  /** Sleeves at both sides (portraits). */
  sleeves: { cx: 0.5, cy: 0.82, rx: 0.62, ry: 0.22, soft: 0.9, ramp: [0.5, 0.82, 0.02, 0.82] } as Region,
  sleevesR: { cx: 0.5, cy: 0.82, rx: 0.62, ry: 0.22, soft: 0.9, ramp: [0.5, 0.82, 0.98, 0.82] } as Region,
  /** Left / right wings of a hovering creature. */
  wingL: { cx: 0.1, cy: 0.38, rx: 0.3, ry: 0.4, soft: 0.8, ramp: [0.42, 0.45, 0.0, 0.3] } as Region,
  wingR: { cx: 0.9, cy: 0.38, rx: 0.3, ry: 0.4, soft: 0.8, ramp: [0.58, 0.45, 1.0, 0.3] } as Region,
  /** Flames / leaves / crowns at the top, stronger toward the tip. */
  crown: { cx: 0.5, cy: 0.08, rx: 0.5, ry: 0.22, soft: 0.8, ramp: [0.5, 0.35, 0.5, 0.0] } as Region,
}

/** Gentle waist-up portrait: breathing, a hint of head sway, hair drifting. */
function portrait(o: Partial<{ breath: number; period: number; sway: number; hair: number; extra: Profile['flutter']; regions: Record<string, Region>; talk: number }> = {}): Profile {
  return {
    regions: { hairTop: R.hairTop, hairSides: R.hairSides, sleeves: R.sleeves, sleevesR: R.sleevesR, ...o.regions },
    breathe: { amp: o.breath ?? 0.006, period: o.period ?? 4.4, chest: 0.58, widen: 0.004 },
    sway: { amp: o.sway ?? 0.0025, period: 6.5, power: 2.2 },
    flutter: [{ regions: ['hairTop', 'hairSides'], ax: o.hair ?? 0.0025, ay: (o.hair ?? 0.0025) * 0.4, speed: 0.35, freq: 1.2 }, ...(o.extra ?? [])],
    lean: 0.012,
    talk: o.talk ?? 1,
  }
}

/** Standing full-body creature: weight settles through the legs. */
function stander(o: Partial<{ breath: number; period: number; sway: number; chest: number }> = {}): Profile {
  return {
    regions: {},
    breathe: { amp: o.breath ?? 0.008, period: o.period ?? 3.4, chest: o.chest ?? 0.42 },
    sway: { amp: o.sway ?? 0.003, period: 5.2, power: 2 },
  }
}

/** Hovering creature with flapping wings. */
function flyer(o: Partial<{ amp: number; period: number; wing: number; flap: number; tilt: number }> = {}): Profile {
  const wing = o.wing ?? 0.014
  return {
    regions: { wingL: R.wingL, wingR: R.wingR },
    breathe: { amp: 0.004, period: 2.6, chest: 0.45 },
    float: { amp: o.amp ?? 0.028, period: o.period ?? 2.8, tilt: o.tilt ?? 0.025 },
    // Wings beat together (mirror symmetric), tips following through.
    flap: { regions: ['wingL', 'wingR'], amp: wing, freq: o.flap ?? 1.8 },
  }
}

/** Jelly slime: periodic squash-bounce with a damped wobble. */
function slime(o: Partial<{ amp: number; period: number; shiver: number }> = {}): Profile {
  const p: Profile = {
    regions: { top: { cx: 0.5, cy: 0.12, rx: 0.5, ry: 0.3, soft: 0.9 } },
    jelly: { amp: o.amp ?? 0.045, period: o.period ?? 1.9, freq: 2.4 },
    breathe: { amp: 0.004, period: 3, chest: 0.5 },
    lean: 0.03,
  }
  if (o.shiver) p.flutter = [{ regions: 'top', ax: o.shiver, ay: o.shiver * 0.3, speed: 5.5, freq: 0.6 }]
  return p
}

export const PROFILES: Record<string, Profile> = {
  // ── Bosses ──────────────────────────────────────────────────────────
  'kana-oni': {
    regions: {
      hair: { cx: 0.5, cy: 0.1, rx: 0.36, ry: 0.18, soft: 0.8, ramp: [0.5, 0.26, 0.5, 0.0] },
      club: { cx: 0.85, cy: 0.3, rx: 0.24, ry: 0.36, soft: 0.8 },
      clubL: { cx: 0.15, cy: 0.3, rx: 0.24, ry: 0.36, soft: 0.8 },
      cloth: { cx: 0.5, cy: 0.66, rx: 0.3, ry: 0.12, soft: 0.8 },
    },
    // Heavy, powerful breathing.
    breathe: { amp: 0.012, period: 3.2, chest: 0.36, widen: 0.01 },
    sway: { amp: 0.004, period: 4.8, power: 2 },
    flutter: [
      { regions: 'hair', ax: 0.008, ay: 0.004, speed: 0.55, freq: 1.4 },
      // The club (whichever hand holds it) sways slowly like a heavy pendulum.
      { regions: ['club', 'clubL'], ax: 0.005, ay: 0.002, speed: 0.22, freq: 0.3 },
      { regions: 'cloth', ax: 0.003, ay: 0.001, speed: 0.6, freq: 2 },
    ],
  },
  'radical-golem': {
    regions: { moss: { cx: 0.5, cy: 0.18, rx: 0.4, ry: 0.2, soft: 0.9 } },
    // Slow, ponderous, stone doesn't sway.
    breathe: { amp: 0.006, period: 5.8, chest: 0.4, widen: 0.004 },
    sway: { amp: 0.0012, period: 9, power: 2 },
    flutter: [{ regions: 'moss', ax: 0.0012, ay: 0.0006, speed: 0.4, freq: 2.5 }],
    lean: 0.008,
  },
  'particle-guardian': {
    regions: {
      branches: { cx: 0.5, cy: 0.12, rx: 0.6, ry: 0.28, soft: 0.8, ramp: [0.5, 0.4, 0.5, 0.0] },
      roots: { cx: 0.5, cy: 0.96, rx: 0.6, ry: 0.2, soft: 0.8 },
    },
    breathe: { amp: 0.005, period: 6, chest: 0.4 },
    sway: { amp: 0.006, period: 7, power: 2.6 },
    flutter: [{ regions: 'branches', ax: 0.007, ay: 0.003, speed: 0.4, freq: 1.2 }],
    // Roots ripple like something moving underground.
    wave: { amp: 0.006, wavelength: 0.45, speed: 0.35, axis: 'x', regions: 'roots' },
  },
  'silent-librarian': {
    regions: {
      hem: { cx: 0.5, cy: 0.98, rx: 0.62, ry: 0.32, soft: 0.8, ramp: [0.5, 0.66, 0.5, 1] },
      hair: { cx: 0.5, cy: 0.34, rx: 0.36, ry: 0.3, soft: 0.8, ramp: [0.5, 0.1, 0.5, 0.6] },
    },
    float: { amp: 0.016, period: 4.6, tilt: 0.012 },
    breathe: { amp: 0.004, period: 5, chest: 0.4 },
    flutter: [
      // Spirit-flame hem: a slow travelling ripple, licking upward a little.
      { regions: 'hem', ax: 0.013, ay: 0.006, speed: 0.45, freq: 1.3, by: -0.004 },
      { regions: 'hair', ax: 0.006, ay: 0.002, speed: 0.3, freq: 1 },
    ],
  },
  'shifting-chimera': {
    regions: {
      // Nine tails fan out above/behind the body; move strongly toward the tips.
      tails: { cx: 0.5, cy: 0.22, rx: 0.62, ry: 0.34, soft: 0.8, ramp: [0.5, 0.6, 0.5, 0.0] },
      mane: { cx: 0.5, cy: 0.42, rx: 0.3, ry: 0.18, soft: 0.8 },
    },
    breathe: { amp: 0.008, period: 3, chest: 0.5, widen: 0.006 },
    sway: { amp: 0.002, period: 5.5 },
    flutter: [
      { regions: 'tails', ax: 0.016, ay: 0.009, speed: 0.6, freq: 1.6 },
      { regions: 'mane', ax: 0.004, ay: 0.002, speed: 0.7, freq: 2.2 },
    ],
  },
  'void-dragon': {
    regions: {
      body: { cx: 0.5, cy: 0.5, rx: 0.75, ry: 0.9, soft: 0.5 },
      whiskers: { cx: 0.5, cy: 0.35, rx: 0.6, ry: 0.5, soft: 1 },
    },
    // Serpentine undulation travelling along the body + a slow, heavy hover.
    wave: { amp: 0.012, wavelength: 0.8, speed: 0.13, axis: 'x', regions: 'body' },
    float: { amp: 0.01, period: 6.5, tilt: 0.006 },
    breathe: { amp: 0.004, period: 5.5, chest: 0.5 },
    flutter: [{ regions: 'whiskers', ax: 0.003, ay: 0.003, speed: 0.5, freq: 2.2 }],
    lean: 0.01,
  },

  // ── Portraits ───────────────────────────────────────────────────────
  fude: {
    regions: {
      tail: { cx: 0.5, cy: 0.92, rx: 0.4, ry: 0.22, soft: 0.8, ramp: [0.5, 0.7, 0.5, 1.0] },
      tip: { cx: 0.5, cy: 0.06, rx: 0.3, ry: 0.16, soft: 0.8 },
    },
    float: { amp: 0.03, period: 3.2, tilt: 0.035 },
    // Squishy: a soft bounce every float cycle.
    jelly: { amp: 0.022, period: 3.2, freq: 2 },
    flutter: [
      // The ink-drop tail swirls (horizontal-dominant travelling wave).
      { regions: 'tail', ax: 0.022, ay: 0.006, speed: 0.8, freq: 1.2 },
      { regions: 'tip', ax: 0.003, ay: 0.001, speed: 0.5, freq: 1 },
    ],
    lean: 0.025,
  },
  mage: portrait({
    regions: { hat: { cx: 0.5, cy: 0.06, rx: 0.36, ry: 0.2, soft: 0.8, ramp: [0.5, 0.3, 0.5, 0.0] } },
    extra: [
      // The floppy hat tip sways a beat behind the head.
      { regions: 'hat', ax: 0.009, ay: 0.002, speed: 0.3, freq: 0.5 },
      { regions: ['sleeves', 'sleevesR'], ax: 0.003, ay: 0.001, speed: 0.4, freq: 1.4 },
    ],
  }),
  elder: portrait({ breath: 0.005, period: 5.2, sway: 0.002, regions: { beard: { cx: 0.5, cy: 0.5, rx: 0.18, ry: 0.2, soft: 0.8, ramp: [0.5, 0.35, 0.5, 0.7] } }, extra: [{ regions: 'beard', ax: 0.003, ay: 0.001, speed: 0.3, freq: 1 }] }),
  merchant: portrait({ breath: 0.006, period: 3.9, sway: 0.003, hair: 0.003, regions: { band: { cx: 0.5, cy: 0.08, rx: 0.45, ry: 0.14, soft: 0.8 } }, extra: [{ regions: 'band', ax: 0.004, ay: 0.002, speed: 0.6, freq: 2 }] }),
  guard: portrait({ breath: 0.007, period: 4.6, sway: 0.0015, hair: 0.001 }),
  priest: portrait({ breath: 0.005, period: 5.4, sway: 0.002, regions: { streamers: { cx: 0.75, cy: 0.35, rx: 0.3, ry: 0.3, soft: 0.9 } }, extra: [{ regions: 'streamers', ax: 0.004, ay: 0.002, speed: 0.5, freq: 1.8 }] }),
  king: portrait({ breath: 0.006, period: 4.8, sway: 0.002, extra: [{ regions: ['sleeves', 'sleevesR'], ax: 0.004, ay: 0.001, speed: 0.3, freq: 1 }] }),
  child: portrait({ breath: 0.008, period: 2.9, sway: 0.004, hair: 0.003, talk: 1.3 }),
  farmer: portrait({ breath: 0.006, period: 4, sway: 0.0025, regions: { brim: { cx: 0.5, cy: 0.1, rx: 0.52, ry: 0.13, soft: 0.8, ramp: [0.5, 0.1, 0.02, 0.1] } }, extra: [{ regions: 'brim', ax: 0.001, ay: 0.003, speed: 0.4, freq: 1 }] }),
  innkeeper: portrait({ breath: 0.006, period: 4.6, sway: 0.002 }),
  jailer: portrait({ breath: 0.007, period: 5, sway: 0.0015, hair: 0 }),

  // ── Enemies ─────────────────────────────────────────────────────────
  slime: slime(),
  'ice-slime': slime({ amp: 0.035, period: 2.2, shiver: 0.0025 }),
  imp: {
    ...flyer({ amp: 0.03, period: 2.4, wing: 0.016, flap: 2.2 }),
    regions: { wingL: R.wingL, wingR: R.wingR, tail: { cx: 0.5, cy: 0.95, rx: 0.45, ry: 0.2, soft: 0.8, ramp: [0.5, 0.75, 0.5, 1] } },
    flutter: [
      { regions: 'tail', ax: 0.008, ay: 0.004, speed: 1.4, freq: 2, by: -0.003 },
    ],
  },
  bat: flyer({ amp: 0.035, period: 2.2, wing: 0.022, flap: 2.6, tilt: 0.03 }),
  harpy: {
    ...flyer({ amp: 0.03, period: 3, wing: 0.016, flap: 1.5 }),
    regions: { wingL: R.wingL, wingR: R.wingR, hair: R.hairTop },
    flutter: [
      { regions: 'hair', ax: 0.006, ay: 0.002, speed: 0.8, freq: 1.5 },
    ],
  },
  wisp: {
    regions: { flame: { cx: 0.5, cy: 0.12, rx: 0.55, ry: 0.35, soft: 0.9, ramp: [0.5, 0.55, 0.5, 0.0] } },
    float: { amp: 0.04, period: 3.4, tilt: 0.04 },
    breathe: { amp: 0.006, period: 1.8, chest: 0.6, widen: 0.008 },
    // Flame flicker: fast, licking upward at the top.
    flutter: [{ regions: 'flame', ax: 0.014, ay: 0.008, speed: 1.6, freq: 2.2, by: -0.012 }],
  },
  mushroom: { ...slime({ amp: 0.025, period: 2.6 }), regions: { cap: { cx: 0.5, cy: 0.2, rx: 0.55, ry: 0.28, soft: 0.8 } }, sway: { amp: 0.004, period: 3.2 } },
  kappa: { ...stander({ breath: 0.007, period: 3 }), regions: { dish: { cx: 0.5, cy: 0.06, rx: 0.25, ry: 0.1 } }, flutter: [{ regions: 'dish', ax: 0.001, ay: 0.002, speed: 1.4, freq: 2 }] },
  tanuki: { ...stander({ breath: 0.009, period: 3.6, chest: 0.55 }), regions: { leaf: { cx: 0.5, cy: 0.05, rx: 0.2, ry: 0.1, soft: 0.8 } }, breathe: { amp: 0.009, period: 3.6, chest: 0.55, widen: 0.012 }, flutter: [{ regions: 'leaf', ax: 0.004, ay: 0.002, speed: 0.9, freq: 1 }] },
  golem: stander({ breath: 0.005, period: 5, sway: 0.001 }),
  kitsune: {
    regions: { tails: { cx: 0.5, cy: 0.25, rx: 0.6, ry: 0.35, soft: 0.8, ramp: [0.5, 0.6, 0.5, 0.0] } },
    breathe: { amp: 0.006, period: 3, chest: 0.5 },
    sway: { amp: 0.002, period: 5 },
    flutter: [{ regions: 'tails', ax: 0.012, ay: 0.006, speed: 0.7, freq: 1.5 }],
  },
  treant: { ...stander({ breath: 0.006, period: 4.6, sway: 0.006 }), regions: { crown: R.crown }, flutter: [{ regions: 'crown', ax: 0.006, ay: 0.003, speed: 0.6, freq: 2 }] },
  tengu: { ...stander({ breath: 0.007, period: 3.4 }), regions: { wingL: R.wingL, wingR: R.wingR }, flap: { regions: ['wingL', 'wingR'], amp: 0.006, freq: 0.45, lag: 0.9 } },
  oni: { ...stander({ breath: 0.01, period: 3, sway: 0.003 }), regions: { hair: R.hairTop }, flutter: [{ regions: 'hair', ax: 0.004, ay: 0.002, speed: 0.6, freq: 1.4 }] },
  skeleton: {
    ...stander({ breath: 0.003, period: 4, sway: 0.002 }),
    regions: { skull: { cx: 0.5, cy: 0.15, rx: 0.35, ry: 0.2, soft: 0.8 } },
    // Bones rattle: a faint fast jitter at the head.
    flutter: [{ regions: 'skull', ax: 0.0012, ay: 0.0006, speed: 4, freq: 0.5 }],
  },
}

/** Scene motion for full-bleed art (backdrops, key art, stills). */
export const SCENES: Record<string, SceneMotion> = {
  'title-wide': { ...DEFAULT_SCENE, zoom: [1.04, 1.1], period: 64, drift: [0.6, -0.25], focus: [0.5, 0.5], parallax: 0.014 },
  'title-tall': { ...DEFAULT_SCENE, zoom: [1.04, 1.09], period: 64, drift: [0.3, -0.35], focus: [0.5, 0.4], parallax: 0.014 },
  'battle-summit': { ...DEFAULT_SCENE, regions: { sky: { cx: 0.5, cy: 0.2, rx: 0.8, ry: 0.35, soft: 1 } }, wind: { regions: 'sky', amp: 0.003, speed: 0.12, freq: 1.6 } },
  'battle-tower': { ...DEFAULT_SCENE, wind: undefined },
}

const FALLBACK: Profile = portrait()

/** Figure profile for an HD id (portraits, enemies, bosses). */
export function profileFor(id: string | undefined | null): Profile {
  if (id && PROFILES[id]) return PROFILES[id]
  const cat = id ? HD_BY_ID.get(id)?.category : undefined
  if (cat === 'enemies') return stander()
  return FALLBACK
}

/** Scene motion for an HD id (backdrops, title, scenes). */
export function sceneFor(id: string | undefined | null): SceneMotion {
  return (id && SCENES[id]) || DEFAULT_SCENE
}

/** Ids that need a figure profile (for tests / tooling). */
export const FIGURE_IDS = HD_ASSETS.filter((a) => a.category === 'portraits' || a.category === 'enemies' || a.category === 'bosses').map((a) => a.id)

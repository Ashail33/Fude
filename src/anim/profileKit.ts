/**
 * Building blocks for HD motion profiles (see ./profiles): reusable
 * regions and the portrait / stander / flyer / slime presets. Import-light
 * so region packs can describe their figures' motion.
 */
import type { Profile, Region } from './deform'

// ── Reusable regions ────────────────────────────────────────────────
export const R = {
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
export function portrait(o: Partial<{ breath: number; period: number; sway: number; hair: number; extra: Profile['flutter']; regions: Record<string, Region>; talk: number }> = {}): Profile {
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
export function stander(o: Partial<{ breath: number; period: number; sway: number; chest: number }> = {}): Profile {
  return {
    regions: {},
    breathe: { amp: o.breath ?? 0.008, period: o.period ?? 3.4, chest: o.chest ?? 0.42 },
    sway: { amp: o.sway ?? 0.003, period: 5.2, power: 2 },
  }
}

/** Hovering creature with flapping wings. */
export function flyer(o: Partial<{ amp: number; period: number; wing: number; flap: number; tilt: number }> = {}): Profile {
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
export function slime(o: Partial<{ amp: number; period: number; shiver: number }> = {}): Profile {
  const p: Profile = {
    regions: { top: { cx: 0.5, cy: 0.12, rx: 0.5, ry: 0.3, soft: 0.9 } },
    jelly: { amp: o.amp ?? 0.045, period: o.period ?? 1.9, freq: 2.4 },
    breathe: { amp: 0.004, period: 3, chest: 0.5 },
    lean: 0.03,
  }
  if (o.shiver) p.flutter = [{ regions: 'top', ax: o.shiver, ay: o.shiver * 0.3, speed: 5.5, freq: 0.6 }]
  return p
}


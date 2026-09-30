/**
 * Per-map colour grades for the HD-2D post-process: time of day, ambient
 * darkness (so point lights matter at night), bloom, god rays, depth of field.
 */
export type RGB = readonly [number, number, number]

export interface Grade {
  name: string
  /** Scene multiplier where no point light reaches (1 = untouched daylight). */
  ambient: RGB
  /** Scale applied to every point light's intensity. */
  lights: number
  /** Additive glow from lights (volumetric haze), fraction of the light. */
  haze: number
  /** Night-only light sources (windows, torii) switch on. */
  night: boolean
  /** Player's staff orb intensity (0 = none). */
  orb: number
  lift: RGB
  gamma: RGB
  gain: RGB
  saturation: number
  contrast: number
  bloomThreshold: number
  bloom: number
  /** Light shafts: colour, strength (0 = off), angle from vertical (radians). */
  rays: RGB
  rayStrength: number
  rayAngle: number
  /** Low-sun glow from the top-left: colour, strength. */
  sun: RGB
  sunStrength: number
  /** Max blend toward the blurred image at the screen edges (0..1). */
  dof: number
  vignette: number
  grain: number
  /** Specular glints on water. */
  water: number
}

const base: Grade = {
  name: 'neutral',
  ambient: [1, 1, 1],
  lights: 0.35,
  haze: 0.12,
  night: false,
  orb: 0.15,
  lift: [0, 0, 0],
  gamma: [1, 1, 1],
  gain: [1, 1, 1],
  saturation: 1.05,
  contrast: 1.04,
  bloomThreshold: 0.82,
  bloom: 0.55,
  rays: [1, 0.9, 0.7],
  rayStrength: 0,
  rayAngle: 0.5,
  sun: [1, 0.78, 0.5],
  sunStrength: 0,
  dof: 0.6,
  vignette: 0.45,
  grain: 0.018,
  water: 1,
}

const g = (o: Partial<Grade> & { name: string }): Grade => ({ ...base, ...o })

export const GRADES: Record<string, Grade> = {
  /** Village: golden hour — warm highlights, lavender shadows, long soft light. */
  golden: g({
    name: 'golden',
    ambient: [1.0, 0.93, 0.84],
    lights: 0.5,
    haze: 0.14,
    orb: 0.22,
    lift: [0.035, 0.012, 0.05],
    gamma: [1.02, 1.0, 0.96],
    gain: [1.08, 1.0, 0.9],
    saturation: 1.1,
    rays: [1, 0.82, 0.55],
    rayStrength: 0.1,
    rayAngle: 0.62,
    sunStrength: 0.34,
  }),
  /** Fields: bright noon — clean, saturated, barely any vignette. */
  noon: g({
    name: 'noon',
    ambient: [1.03, 1.02, 0.98],
    lights: 0.25,
    haze: 0.08,
    orb: 0.1,
    lift: [0.01, 0.01, 0.02],
    gain: [1.04, 1.03, 0.98],
    saturation: 1.04,
    contrast: 1.05,
    sun: [1, 0.96, 0.85],
    sunStrength: 0.12,
    bloomThreshold: 0.86,
    bloom: 0.4,
    dof: 0.65,
    vignette: 0.3,
  }),
  /** Forest: cool green shade, warm shafts of sun through the canopy. */
  forest: g({
    name: 'forest',
    ambient: [0.56, 0.7, 0.68],
    lights: 1.0,
    haze: 0.22,
    night: false,
    orb: 0.55,
    lift: [0.01, 0.035, 0.04],
    gamma: [0.98, 1.02, 1.0],
    gain: [0.98, 1.04, 1.0],
    saturation: 0.94,
    contrast: 1.08,
    bloomThreshold: 0.7,
    bloom: 0.7,
    rays: [1, 0.93, 0.62],
    rayStrength: 0.45,
    rayAngle: 0.45,
    dof: 0.62,
    vignette: 0.55,
  }),
  /** Shrine: blue night, strong lantern pools, moonlit shafts. */
  night: g({
    name: 'night',
    ambient: [0.3, 0.37, 0.64],
    lights: 1.35,
    haze: 0.3,
    night: true,
    orb: 0.6,
    lift: [0.02, 0.025, 0.06],
    gamma: [1.0, 1.0, 1.04],
    gain: [1.0, 1.0, 1.06],
    saturation: 0.88,
    contrast: 1.08,
    bloomThreshold: 0.58,
    bloom: 0.95,
    rays: [0.62, 0.72, 1],
    rayStrength: 0.12,
    rayAngle: -0.4,
    dof: 0.62,
    vignette: 0.6,
    grain: 0.022,
  }),
  /** Tower: purple twilight, magic glowing hot. */
  twilight: g({
    name: 'twilight',
    ambient: [0.66, 0.54, 0.8],
    lights: 0.85,
    haze: 0.22,
    night: true,
    orb: 0.6,
    lift: [0.04, 0.015, 0.07],
    gamma: [1.0, 0.98, 1.03],
    gain: [1.06, 0.98, 1.06],
    saturation: 1.05,
    contrast: 1.06,
    bloomThreshold: 0.64,
    bloom: 0.9,
    rays: [1, 0.66, 0.8],
    sun: [1, 0.55, 0.6],
    sunStrength: 0.22,
    rayStrength: 0.1,
    rayAngle: 0.55,
    dof: 0.62,
    vignette: 0.6,
  }),
  /** Lamp-lit interiors. */
  interior: g({
    name: 'interior',
    ambient: [0.62, 0.55, 0.52],
    lights: 1.2,
    haze: 0.24,
    night: true,
    orb: 0.6,
    lift: [0.03, 0.015, 0.03],
    gain: [1.06, 1.0, 0.92],
    bloomThreshold: 0.66,
    bloom: 0.8,
    dof: 0.55,
    vignette: 0.62,
  }),
}

const BY_MAP: Record<string, string> = {
  village: 'golden',
  fields: 'noon',
  forest: 'forest',
  shrine: 'night',
  'shrine-library': 'interior',
  tower: 'twilight',
  'tower-throne': 'interior',
  'tower-top': 'twilight',
}
const BY_REGION = ['golden', 'golden', 'noon', 'forest', 'night', 'twilight']

/** Grade for a map: explicit table first, then interiors, then by region. */
export function gradeFor(spec: { id: string; region: number; interior?: boolean }): Grade {
  const k = BY_MAP[spec.id] ?? (spec.interior ? 'interior' : BY_REGION[spec.region] ?? 'golden')
  return GRADES[k]
}

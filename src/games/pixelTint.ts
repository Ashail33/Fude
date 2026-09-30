/** Pure colour helpers for tinting pixel sprites with CSS filters. */

/** Hue (0–360) of a #rrggbb colour. */
export function hueOf(hex: string): number {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim())
  if (!m) return 0
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  if (d === 0) return 0
  let h: number
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return Math.round(((h * 60) % 360 + 360) % 360)
}

/**
 * A CSS filter that washes a sprite toward `hex`. `sepia` gives every pixel a
 * warm hue (~38°) which `hue-rotate` then turns to the target hue.
 */
export function tintFilter(hex: string, amount = 0.7): string {
  const rot = Math.round((((hueOf(hex) - 38) % 360) + 360) % 360)
  const a = Math.max(0, Math.min(1, amount))
  return `sepia(${a}) saturate(${(1 + a * 1.6).toFixed(2)}) hue-rotate(${rot}deg)`
}

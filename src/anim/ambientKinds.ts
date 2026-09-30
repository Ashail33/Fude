/** Ambient particle styles and which backdrop uses which. */
export type AmbientKind = 'petals' | 'pollen' | 'fireflies' | 'talismans' | 'glyphs' | 'vortex'

/** Particle style per battle backdrop. */
export const AMBIENT_BY_BACKDROP: Record<string, AmbientKind> = {
  'battle-village': 'petals',
  'battle-fields': 'pollen',
  'battle-forest': 'fireflies',
  'battle-shrine': 'talismans',
  'battle-tower': 'glyphs',
  'battle-summit': 'vortex',
}

/**
 * The game's master palette. All pixel art and UI colours come from here so
 * the whole game reads as one 16-bit world. Warm, saturated, slightly
 * dusk-tinted: a Japanese countryside at golden hour.
 */
export const PAL = {
  // darks / outline
  ink: '#1a1423',
  night: '#241d3a',
  navy: '#2b2f5e',
  dusk: '#3d4a8c',
  // UI window
  winBg: '#101634',
  winBg2: '#1b2250',
  winBorder: '#f4ecd8',
  // neutrals
  stone: '#6b6f8a',
  mist: '#a9adc7',
  paper: '#f4ecd8',
  white: '#ffffff',
  // skin & wood
  skin: '#f6c9a0',
  skinShade: '#d99a73',
  wood: '#9a5b34',
  woodDark: '#63381f',
  woodLight: '#c78a4f',
  // greens
  leafDark: '#1f5c3a',
  leaf: '#2f8a4a',
  grass: '#5cb24a',
  grassLight: '#9bd65b',
  // blues
  waterDeep: '#1f4f9e',
  water: '#3b86d6',
  waterLight: '#7fc4f0',
  foam: '#d6f1ff',
  // warm accents
  vermilion: '#e2432f', // torii red
  crimson: '#a61e3a',
  orange: '#f28a2e',
  gold: '#f7c948',
  sand: '#e6c98a',
  // pinks / purples
  sakura: '#f7a8c4',
  sakuraDark: '#d96a9a',
  violet: '#8a4fd1',
  lilac: '#c7a3f0',
  // elements (magic)
  fire: '#ff6b3d',
  ice: '#9be7ff',
  light: '#ffe066',
  wind: '#9be7e0',
  poison: '#8fd14f',
} as const

export type PalKey = keyof typeof PAL

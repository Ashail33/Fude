/**
 * The shared HD art vocabulary: asset type, style prompt, cut-out
 * instruction and the recurring cast. Import-free, so region packs can
 * describe their art without pulling in the manifest.
 */
export type HdCategory = 'portraits' | 'enemies' | 'bosses' | 'backdrops' | 'scenes' | 'title'

export interface HdAsset {
  id: string
  category: HdCategory
  /** Short human name. */
  name: string
  /** Where it appears in the game. */
  usage: string
  /** Generation size (px). */
  w: number
  h: number
  /** Cut-out art is generated on a flat key colour that the processor removes. */
  cutout?: { key: '#00ff00' | '#ff00ff' }
  /** 1 = biggest visual impact, do first. */
  priority: 1 | 2 | 3
  /** Subject prompt (the shared STYLE prompt is appended). */
  prompt: string
}

/** Shared style: append to every prompt so all art matches. */
export const STYLE =
  'Style: hand-painted anime fantasy illustration, soft watercolor washes over clean confident ink linework, warm cinematic lighting with gentle rim light, rich but soft colors (vermilion, indigo, sakura pink, jade green, antique gold), subtle washi paper texture, Japanese folklore setting in an Edo-era countryside, whimsical and cozy, highly detailed, consistent character design. No text, no letters, no watermark, no logo, no border.'

export const CUTOUT = (key: '#00ff00' | '#ff00ff') =>
  `Full body, centered, generous empty margin on all sides, isolated on a perfectly flat solid pure ${key === '#00ff00' ? 'green (#00FF00)' : 'magenta (#FF00FF)'} background, no ground, no cast shadow, no scenery.`

/** The recurring cast, described once so every image keeps them on-model. */
export const CAST = {
  mage: 'a young apprentice mage (age about 16, friendly, gender-neutral) with short brown hair and bright eyes, wearing a tall pointed indigo wizard hat with a gold band and a tiny gold star, an indigo robe with gold trim and a sash, holding a wooden staff topped with a glowing golden orb',
  scribe: 'Kotone, the girl with the brush from long ago (age about 15, gentle, warm and determined): long straight black hair to her waist tied with a vermilion ribbon, a soft wisteria-lilac kimono with a white collar and a deep indigo hakama, ink smudges on her fingers and cheek, carrying a large calligraphy brush with a red-lacquered handle and a gold band, its bristles wet with glowing ink',
  shadow: 'the Nameless Quiet: a small, soft, smoke-like shadow creature the colour of dusk, a wisp of indigo-grey mist with two faint lonely silver eyes and wispy ragged edges, half translucent, more sad than scary',
  fude: 'Fude, a tiny floating calligraphy-brush spirit mascot: a plump round white body shaped like a soft brush tip, big shiny black eyes, rosy cheeks, a red-lacquered brush handle with a gold band on top like a little hat, and a swirling black ink-drop tail; cute, expressive, glowing faintly',
}


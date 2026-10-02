import { CAST, CUTOUT, type HdAsset } from '../../art/hd/cast'
import { flyer, portrait, R, stander } from '../../anim/profileKit'
import type { RegionArt } from '../types'

/** The Cloud Capital's recurring look, described once so every image stays on-model. */
const LOOK = {
  tennin:
    'Amane, a young tennin (celestial maiden, about 17, gentle and bright-eyed): black hair in two soft looped buns with a gold hairpin and long strands falling to her waist, a layered pale-peach and sakura-pink Nara-era robe with a vermilion sash, and a hagoromo, a long translucent feather shawl of white and lilac that floats and loops around her in the air as if weightless',
  scholar:
    'the old sky-scholar (Hakase, a kindly elderly astronomer): a tall black court cap, bushy white eyebrows, a very long white beard reaching his belt, a deep navy robe embroidered with tiny gold stars and constellations, round spectacles pushed up on his forehead, a rolled star chart under one arm and a brass star-compass hanging from his sash',
  raijin:
    'Raijin, the thunder god: a muscular, wild-haired god with crimson-red skin, two small horns, fierce golden eyes and a huge grin, a tiger-skin loincloth and a fluttering pale-green scarf, a drumstick in each fist, and behind him a great floating hoop of linked taiko drums painted with gold mitsudomoe swirls',
  fujin:
    'Fūjin, the wind god, at his side: a lean green-skinned god with a shock of white hair, a shawl streaming in the wind, both arms holding open a huge billowing bag of winds from which torn glowing brush-stroke glyphs are spilling and being blown away',
}

const ASSETS: HdAsset[] = [
  // ── characters
  { id: 'tennin', category: 'portraits', name: 'Amane the Celestial', usage: 'Cloud Capital guide (tennin sprite): dialogue, cutscenes', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Character portrait, waist-up, three-quarter view, of ${LOOK.tennin}, a warm hopeful smile, one hand raised as if catching a drifting word. ${CUTOUT('#00ff00')}` },
  { id: 'scholar', category: 'portraits', name: 'The Sky-Scholar', usage: 'Observatory scholar (scholar sprite): dialogue, cutscenes', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Character portrait, waist-up, of ${LOOK.scholar}, one finger raised mid-lecture, eyes twinkling with curiosity. ${CUTOUT('#00ff00')}` },
  // ── folklore spirits
  { id: 'yokai-hagoromo', category: 'portraits', name: 'The Hagoromo Maiden', usage: 'Cloud Capital folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Portrait of the tennin of the Hagoromo legend: an elegant celestial maiden with long flowing black hair and a jewelled crown of flowers, layered robes in pale turquoise and gold, reaching out with both hands toward a radiant white feather robe (hagoromo) that drifts just above her fingertips, a wistful expression slowly turning to joy, a few pine needles and sea-spray sparkles drifting around her. ${CUTOUT('#ff00ff')}` },
  { id: 'yokai-raitaro', category: 'portraits', name: 'Raitarō', usage: 'Cloud Capital folklore tale; Spirit Scroll; memory page', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Portrait of Raitarō, the thunder child of the folk tale: a small round-cheeked boy of about six with spiky golden hair crackling with tiny sparks, two little nub horns, a tiger-striped bib and shorts, a tiny taiko drum strapped to his back with one cracked drumhead, a brave but slightly teary grin. ${CUTOUT('#00ff00')}` },
  { id: 'yokai-tobiume', category: 'portraits', name: 'Tobiume, the Flying Plum', usage: 'Cloud Capital folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Portrait of the spirit of Tobiume, the flying plum tree of Tenjin's legend: a gentle young woman whose hair is a cascade of dark plum branches covered in white and pale-pink ume blossoms, a robe of soft crimson and white with a plum-blossom crest, a calligraphy poem-slip held to her heart, petals swirling around her on an east wind, a longing, faithful expression. ${CUTOUT('#ff00ff')}` },
  // ── monster and boss
  { id: 'raiju', category: 'enemies', name: 'Raijū', usage: 'Cloud Capital random battles', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 3, prompt: `A raijū, the thunder beast that rides lightning bolts: a sleek wolf-and-weasel creature with bristling blue-white fur crackling with electricity, glowing gold eyes, sharp claws, and a long tail shaped like a zigzag lightning bolt, leaping forward with sparks flying off its fur. ${CUTOUT('#ff00ff')}` },
  { id: 'raijin', category: 'bosses', name: 'Raijin and Fūjin', usage: 'Region 10 boss battle (grammar forms)', w: 1920, h: 1080, cutout: { key: '#ff00ff' }, priority: 1, prompt: `Two storm gods on a churning thundercloud: ${LOOK.raijin}, mid-strike on his drums with jagged lightning bursting from every drumhead, and ${LOOK.fujin}. Dynamic, powerful, a little comical, both whole figures visible, side by side. ${CUTOUT('#ff00ff')}` },
  // ── backdrop and scenes
  { id: 'battle-clouds', category: 'backdrops', name: 'Cloud Capital streets', usage: 'Battle background, region 10', w: 1920, h: 1080, priority: 1, prompt: 'Wide landscape battle background: a street of the Cloud Capital, a city floating above the weather, vermilion-lacquered palace halls with curved roofs and gold finials standing on billowing white clouds, red lacquered walkways bridging gaps of open blue sky, wind chimes and paper lanterns swaying, a rainbow arching in the distance and a dark thunderhead rumbling far behind. The center and lower-middle are open cloud ground. Eye-level camera.' },
  { id: 'arrive-clouds', category: 'scenes', name: 'Arriving: the Cloud Capital', usage: 'Region 10 arrival cutscene', w: 1920, h: 1080, priority: 2, prompt: `A shining rainbow bridge arching up from snowy mountains into the sky, ending at a great vermilion torii gate; beyond it a city of red-roofed palaces floats on islands of cloud, linked by lacquered walkways, with a star observatory dome and a vast drum hall wrapped in a dark thunderhead; glowing words drift through the air and some shatter into scattered glyphs; ${CAST.mage} and ${CAST.fude} step off the bridge, small in frame, greeted by ${LOOK.tennin}.` },
  { id: 'memory-r10-a', category: 'scenes', name: 'Memory: The Breath Before Thunder', usage: 'Memory cutscene illustration', w: 1920, h: 1080, priority: 1, prompt: `Sepia-tinted memory: the Cloud Capital long ago in the hush before a storm, the wind gone still, a huge dark thunderhead above; ${CAST.scribe} kneels on the cloud ground holding out a hand toward ${CAST.shadow}, which trembles at the cloud's edge; ${CAST.fude} floats at her shoulder; one faint flash of lightning far away.` },
  { id: 'memory-r10-b', category: 'scenes', name: 'Memory: A Name That Says “You Can Stay”', usage: 'Memory cutscene illustration', w: 1920, h: 1080, priority: 1, prompt: `Sepia-tinted memory on a stormy night above the clouds: ${CAST.scribe} crouches beside a small spiky-haired thunder child with a tiny drum, both breathing in together, eyes closed; the child's first little bolt of lightning crackles upward; beside them an open notebook shows a list of crossed-out names; ${CAST.fude} floats nearby, delighted.` },
]

export const ART: RegionArt = {
  assets: ASSETS,
  sprites: { tennin: 'tennin', scholar: 'scholar', raiju: 'raiju', raijin: 'raijin' },
  bosses: { 'boss-raijin': 'raijin', raijin: 'raijin' },
  speakers: { raitaro: 'yokai-raitaro' },
  entities: { 'fk10-tennin': 'yokai-hagoromo', 'fk10-raitaro': 'yokai-raitaro', 'fk10-plum': 'yokai-tobiume' },
  profiles: {
    // the feather shawl drifts slowly on its own breeze
    tennin: portrait({
      breath: 0.005,
      period: 4.8,
      hair: 0.004,
      regions: { shawl: { cx: 0.5, cy: 0.7, rx: 0.62, ry: 0.32, soft: 0.85, ramp: [0.5, 0.5, 0.0, 0.85] }, shawlR: { cx: 0.5, cy: 0.7, rx: 0.62, ry: 0.32, soft: 0.85, ramp: [0.5, 0.5, 1.0, 0.85] } },
      extra: [{ regions: ['shawl', 'shawlR'], ax: 0.006, ay: 0.004, speed: 0.3, freq: 1.1 }],
    }),
    scholar: portrait({
      breath: 0.005,
      period: 5.2,
      sway: 0.002,
      hair: 0.0015,
      regions: { beard: { cx: 0.5, cy: 0.55, rx: 0.16, ry: 0.22, soft: 0.8, ramp: [0.5, 0.35, 0.5, 0.75] } },
      extra: [{ regions: 'beard', ax: 0.003, ay: 0.001, speed: 0.4, freq: 1.4 }],
    }),
    'yokai-hagoromo': portrait({
      breath: 0.005,
      period: 5,
      hair: 0.005,
      regions: { robe: { cx: 0.5, cy: 0.12, rx: 0.5, ry: 0.2, soft: 0.85 } },
      extra: [{ regions: 'robe', ax: 0.006, ay: 0.004, speed: 0.35, freq: 1.2 }],
    }),
    'yokai-raitaro': {
      ...stander({ breath: 0.009, period: 2.8, sway: 0.004, chest: 0.5 }),
      regions: { hair: R.hairTop },
      flutter: [{ regions: 'hair', ax: 0.003, ay: 0.002, speed: 3.2, freq: 0.8 }],
    },
    'yokai-tobiume': portrait({
      breath: 0.005,
      period: 5.4,
      hair: 0.005,
      regions: { blossoms: R.crown },
      extra: [{ regions: 'blossoms', ax: 0.006, ay: 0.003, speed: 0.45, freq: 1.6 }],
    }),
    raiju: {
      ...flyer({ amp: 0.016, period: 2.2, wing: 0.004, flap: 2.6, tilt: 0.02 }),
      regions: { wingL: R.wingL, wingR: R.wingR, tail: { cx: 0.85, cy: 0.35, rx: 0.25, ry: 0.4, soft: 0.8 } },
      flutter: [{ regions: 'tail', ax: 0.004, ay: 0.003, speed: 2.4, freq: 0.9 }],
    },
    raijin: {
      regions: {
        drums: { cx: 0.5, cy: 0.18, rx: 0.62, ry: 0.3, soft: 0.8, ramp: [0.5, 0.5, 0.5, 0.0] },
        hair: { cx: 0.35, cy: 0.18, rx: 0.2, ry: 0.15, soft: 0.8 },
        bag: { cx: 0.78, cy: 0.35, rx: 0.24, ry: 0.3, soft: 0.85 },
        cloud: { cx: 0.5, cy: 0.95, rx: 0.62, ry: 0.18, soft: 0.85 },
      },
      breathe: { amp: 0.01, period: 3, chest: 0.4, widen: 0.008 },
      sway: { amp: 0.003, period: 4.2, power: 2 },
      flutter: [
        { regions: 'drums', ax: 0.003, ay: 0.002, speed: 0.5, freq: 1.1 },
        { regions: 'hair', ax: 0.005, ay: 0.003, speed: 0.8, freq: 1.4 },
        // Fūjin's bag of winds billows
        { regions: 'bag', ax: 0.006, ay: 0.004, speed: 0.6, freq: 1.2 },
      ],
      wave: { amp: 0.004, wavelength: 0.5, speed: 0.3, axis: 'x', regions: 'cloud' },
    },
  },
  voices: {
    // a light, airy young woman's voice with a little shimmer
    tennin: { src: 'soft', base: 392, scale: [0, 2, 4, 7, 9], formant: 1.42, contour: 'arch', bend: 3, len: 0.06, every: 2, vib: 26, vibRate: 5.8, breath: 0.18, tts: { gender: 'female', age: 'young', pitch: 1.33, rate: 0.97 }, cry: 'chime' },
    // slow, learned and a little wheezy
    scholar: { src: 'saw', base: 121, scale: [0, 2, 4], formant: 0.94, contour: 'dip', bend: 2, len: 0.095, every: 3, vib: 55, vibRate: 4.6, breath: 0.3, grit: 0.1, tts: { gender: 'male', age: 'elder', pitch: 0.61, rate: 0.79 }, cry: 'elder' },
    raiju: { src: 'nasal', base: 470, scale: [0, 1, 6], formant: 1.55, contour: 'rise', bend: 6, len: 0.04, every: 2, breath: 0.25, grit: 0.35, tts: { gender: 'male', age: 'young', pitch: 1.47, rate: 1.23 }, cry: 'growl', cryPitch: 1.6 },
    raijin: { src: 'saw', base: 71, scale: [0, 5, 7], formant: 0.68, contour: 'fall', bend: 5, len: 0.1, every: 2, breath: 0.15, grit: 0.55, tts: { gender: 'male', age: 'adult', pitch: 0.44, rate: 0.86 }, cry: 'roar', cryPitch: 0.8 },
  },
}

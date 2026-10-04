import { CAST, CUTOUT, type HdAsset } from '../../art/hd/cast'
import { flyer, portrait, R, stander } from '../../anim/profileKit'
import type { RegionArt } from '../types'

/** The Station Town's recurring look, described once so every image stays on-model. */
const LOOK = {
  stationmaster:
    'Tetsu the stationmaster (a stocky, kind-faced man in his late fifties): a navy-blue peaked cap with a gold winged-wheel badge and gold band, a neat grey moustache, a navy railway uniform with a row of gold buttons and red piping, spotless white gloves, a brass whistle on a red cord round his neck and a pocket watch chain at his waist',
  grocer:
    'Mari the grocer (a cheerful, sturdy woman of about forty with rosy cheeks and a huge grin): dark brown hair tucked under an orange headscarf knotted at one side, rolled-up white sleeves, a forest-green apron with a big front pocket stuffed with a pencil and a notepad, and a daikon radish tucked under one arm like a baton',
  nopperabo:
    'Nopperabō, the faceless yokai: a slender figure in a dark violet kimono with a gold obi and wide drooping sleeves, glossy black hair in an old-fashioned topknot, and where the face should be, a perfectly smooth, blank, egg-pale oval with no eyes, nose or mouth; the hem of the kimono fades into mist, and faint glowing brush-stroke greetings (curling lines of light) drift away from its hands like steam',
  pon: 'Pon, a small round tanuki child with a striped tail, a leaf on his head and a big friendly grin',
}

const ASSETS: HdAsset[] = [
  // ── characters
  { id: 'stationmaster', category: 'portraits', name: 'Tetsu the Stationmaster', usage: 'Station Town stationmaster (stationmaster sprite): dialogue, cutscenes', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Character portrait, waist-up, three-quarter view, of ${LOOK.stationmaster}, one gloved hand raised in a crisp salute, a warm, slightly gruff smile. ${CUTOUT('#00ff00')}` },
  { id: 'grocer', category: 'portraits', name: 'Mari the Grocer', usage: 'Station Town grocer (grocer sprite): dialogue, cutscenes', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Character portrait, waist-up, of ${LOOK.grocer}, mouth open mid-chatter, free hand waving as if calling “welcome!” to a customer. ${CUTOUT('#00ff00')}` },
  // ── folklore spirits
  { id: 'yokai-satori', category: 'portraits', name: 'Satori, the Mind-Reader', usage: 'Station Town folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Portrait of a satori, the mind-reading mountain spirit of Hida: a lanky ape-like creature covered in long shaggy chestnut-brown fur, with a clever, slightly lonely human-like face, large knowing amber eyes and a sly half-smile, one long finger tapping its temple as if it already knows what you will say; a few chestnut burrs caught in its fur. ${CUTOUT('#ff00ff')}` },
  { id: 'yokai-hitotsume', category: 'portraits', name: 'Hitotsume-kozō', usage: 'Station Town folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Portrait of Hitotsume-kozō, the one-eyed boy yokai: a small bald boy of about seven dressed as a temple novice in a plain grey kimono and straw sandals, with one huge, round, curious eye in the middle of his face and a long pink tongue sticking out mischievously, leaning forward eagerly as if about to ask a question, holding a small paper lantern. ${CUTOUT('#00ff00')}` },
  { id: 'yokai-bakezori', category: 'portraits', name: 'Bakezōri, the Sandal Spirit', usage: 'Station Town folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Portrait of a bakezōri, a tsukumogami born from an old straw sandal: a worn, lovingly frayed woven-straw sandal standing upright, with one big round friendly eye in the middle of its sole, two skinny little arms waving, and a pair of tiny legs mid-hop; its red cloth thong strap sits like a little hat. Cute, hopeful, a bit lost. ${CUTOUT('#ff00ff')}` },
  // ── monster and boss
  { id: 'yamabiko', category: 'enemies', name: 'Yamabiko', usage: 'Station Town random battles', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 3, prompt: `A yamabiko, the echo spirit of the mountains: a small, round, dog-like creature with shaggy brown fur, huge round ears like satellite dishes, pale monkey-like face and an enormous open mouth mid-shout, with rings of sound waves rippling out from it in lilac light, copying the last word it heard. ${CUTOUT('#ff00ff')}` },
  { id: 'nopperabo', category: 'bosses', name: 'Nopperabō', usage: 'Region 11 boss battle (listening)', w: 1920, h: 1080, cutout: { key: '#ff00ff' }, priority: 1, prompt: `${LOOK.nopperabo}. It stands at the end of a railway platform at dusk, one sleeve raised to wipe its blank face; behind it, ghostly smooth faceless masks float in a ring, each one a townsperson whose face it has taken. Eerie but quietly sad, whole figure visible. ${CUTOUT('#ff00ff')}` },
  // ── backdrop and scenes
  { id: 'battle-ekimae', category: 'backdrops', name: 'Station Town streets', usage: 'Battle background, region 11', w: 1920, h: 1080, priority: 1, prompt: 'Wide landscape battle background: the plaza in front of a small-town Japanese railway station, a red-roofed station building under an elevated stone railway, a big round station clock on a post, a bus stop, a convenience store with a bright awning and a shopping arcade hung with paper lanterns, bicycles parked in a row, telephone wires criss-crossing a soft evening sky; faint glowing greetings drift through the air like dandelion seeds. The center and lower-middle are open paved ground. Eye-level camera.' },
  { id: 'arrive-ekimae', category: 'scenes', name: 'Arriving: the Chattering Station Town', usage: 'Region 11 arrival cutscene', w: 1920, h: 1080, priority: 2, prompt: `A cloud stair winding down from the sky to a cosy little railway town: a red-roofed station under an elevated track, a train waiting at the platform that cannot leave, a busy station plaza full of people whose faces are smooth and blank, speech bubbles above them holding only single nouns; ${CAST.mage} and ${CAST.fude} step off the last stair, small in frame, greeted by ${LOOK.pon}.` },
  { id: 'memory-r11-a', category: 'scenes', name: 'Memory: The Word Between Strangers', usage: 'Memory cutscene illustration', w: 1920, h: 1080, priority: 1, prompt: `Sepia-tinted memory: an old Edo-period post town on a dusty highway long before the railway, two travellers passing each other in silence; in the gap between them hovers ${CAST.shadow}; ${CAST.scribe} stands at the side of the road, one hand raised in a cheerful wave towards the shadow, as if saying good morning; ${CAST.fude} floats at her shoulder; morning light.` },
  { id: 'memory-r11-b', category: 'scenes', name: 'Memory: Good Morning, Quiet', usage: 'Memory cutscene illustration', w: 1920, h: 1080, priority: 1, prompt: `Sepia-tinted memory at sunrise at the edge of an old post town: ${CAST.scribe} sits on a wooden bench with a cup of tea, smiling and talking to ${CAST.shadow}, which has drifted a little closer than before and seems almost to lean towards her; ${CAST.fude} floats beside them; a row of small paper notes on the bench each with a brushed greeting.` },
]

export const ART: RegionArt = {
  assets: ASSETS,
  sprites: { stationmaster: 'stationmaster', grocer: 'grocer', yamabiko: 'yamabiko', nopperabo: 'nopperabo' },
  bosses: { 'boss-nopperabo': 'nopperabo', nopperabo: 'nopperabo' },
  entities: { 'fk11-satori': 'yokai-satori', 'fk11-hitotsume': 'yokai-hitotsume', 'fk11-zori': 'yokai-bakezori' },
  profiles: {
    stationmaster: portrait({
      breath: 0.006,
      period: 4.6,
      sway: 0.002,
      hair: 0.0015,
      regions: { whistle: { cx: 0.5, cy: 0.6, rx: 0.1, ry: 0.12, soft: 0.8 } },
      extra: [{ regions: 'whistle', ax: 0.002, ay: 0.002, speed: 0.6, freq: 1.3 }],
    }),
    grocer: portrait({
      breath: 0.007,
      period: 3.8,
      sway: 0.003,
      hair: 0.003,
      regions: { knot: { cx: 0.7, cy: 0.12, rx: 0.14, ry: 0.12, soft: 0.8 } },
      extra: [{ regions: 'knot', ax: 0.004, ay: 0.003, speed: 0.7, freq: 1.4 }],
    }),
    'yokai-satori': {
      ...stander({ breath: 0.007, period: 3.4, sway: 0.004, chest: 0.5 }),
      regions: { fur: R.hairTop },
      flutter: [{ regions: 'fur', ax: 0.003, ay: 0.002, speed: 0.6, freq: 1.2 }],
    },
    'yokai-hitotsume': {
      ...stander({ breath: 0.009, period: 2.8, sway: 0.004, chest: 0.5 }),
      regions: { lantern: { cx: 0.75, cy: 0.6, rx: 0.16, ry: 0.18, soft: 0.8 } },
      flutter: [{ regions: 'lantern', ax: 0.004, ay: 0.003, speed: 1.4, freq: 0.9 }],
    },
    'yokai-bakezori': {
      ...flyer({ amp: 0.012, period: 1.8, wing: 0.003, flap: 2.2, tilt: 0.02 }),
      regions: { wingL: R.wingL, wingR: R.wingR, strap: R.crown },
      flutter: [{ regions: 'strap', ax: 0.003, ay: 0.002, speed: 1.6, freq: 1 }],
    },
    yamabiko: {
      ...stander({ breath: 0.01, period: 2.4, sway: 0.004, chest: 0.5 }),
      regions: { ears: R.crown },
      flutter: [{ regions: 'ears', ax: 0.004, ay: 0.003, speed: 1.8, freq: 1.1 }],
    },
    nopperabo: {
      regions: {
        sleeves: { cx: 0.5, cy: 0.62, rx: 0.6, ry: 0.22, soft: 0.85 },
        hair: { cx: 0.5, cy: 0.12, rx: 0.18, ry: 0.12, soft: 0.8 },
        masks: { cx: 0.5, cy: 0.3, rx: 0.62, ry: 0.3, soft: 0.85, ramp: [0.5, 0.5, 0.5, 0.0] },
        hem: R.hem,
      },
      breathe: { amp: 0.008, period: 4.4, chest: 0.45, widen: 0.006 },
      sway: { amp: 0.003, period: 5.6, power: 2 },
      flutter: [
        { regions: 'sleeves', ax: 0.004, ay: 0.003, speed: 0.4, freq: 1.1 },
        { regions: 'hair', ax: 0.002, ay: 0.001, speed: 0.5, freq: 1.3 },
        { regions: 'masks', ax: 0.003, ay: 0.003, speed: 0.3, freq: 0.9 },
      ],
      wave: { amp: 0.004, wavelength: 0.5, speed: 0.3, axis: 'x', regions: 'hem' },
    },
  },
  voices: {
    // a warm, slightly gruff baritone that projects down a platform
    stationmaster: { src: 'saw', base: 132, scale: [0, 2, 4, 7], formant: 0.92, contour: 'fall', bend: 2, len: 0.085, every: 2, vib: 22, vibRate: 5.2, breath: 0.18, grit: 0.12, tts: { gender: 'male', age: 'adult', pitch: 0.67, rate: 0.94 }, cry: 'keys' },
    // quick, bright and chatty, never quite finishing a sentence
    grocer: { src: 'soft', base: 286, scale: [0, 2, 4, 5, 7], formant: 1.24, contour: 'arch', bend: 4, len: 0.05, every: 2, vib: 18, vibRate: 6.2, breath: 0.12, tts: { gender: 'female', age: 'adult', pitch: 1.07, rate: 1.16 }, cry: 'coins', cryPitch: 1.05 },
    // a high, bouncy voice that repeats itself, like an echo
    yamabiko: { src: 'nasal', base: 455, scale: [0, 5, 7, 12], formant: 1.5, contour: 'rise', bend: 5, len: 0.045, every: 2, breath: 0.2, grit: 0.15, tts: { gender: 'male', age: 'young', pitch: 1.39, rate: 1.21 }, cry: 'rattle', cryPitch: 1.5 },
    // soft and breathy, coming from a face with no mouth
    nopperabo: { src: 'soft', base: 196, scale: [0, 1, 5], formant: 1.06, contour: 'flat', bend: 1, len: 0.07, every: 3, vib: 12, vibRate: 3.6, breath: 0.45, tts: { gender: 'female', age: 'adult', pitch: 0.88, rate: 0.81 }, cry: 'wisp', cryPitch: 0.9 },
  },
}

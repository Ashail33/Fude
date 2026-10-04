import { CAST, CUTOUT, type HdAsset } from '../../art/hd/cast'
import { portrait, R, stander } from '../../anim/profileKit'
import type { RegionArt } from '../types'

/** The Valley of Hearts' recurring look, described once so every image stays on-model. */
const LOOK = {
  maskmaker:
    'Kaede, the mask carver (about 30, calm, dry humour, kind eyes): short black hair tucked under a white tenugui headband, a sleeves-tied brown work kimono with an orange sash, a paper-white carving apron dusted with wood shavings, a small chisel behind one ear and a half-carved white Noh mask in her hands',
  dancer:
    'Ren, the young kagura dancer (about 16, bright, proud, a little stubborn): long black hair tied back with two gold kanzashi pins and a sprig of red maple, a white chihaya dance jacket with faint pine patterns over vermilion hakama, a gold sash, holding a folding fan painted with a full moon',
  hotaru:
    'Hotaru, a firefly spirit child (about 8, cheerful, earnest): a bob of dark green hair with two tiny antennae ending in soft yellow-green lights, round amber eyes, a short dark kimono with a glowing lime-yellow obi like a firefly’s tail, bare feet, little points of light drifting around her',
  hannya:
    'the Hannya mask come to life: a floating demon mask of jealousy and grief, a pale ivory face with two curling golden horns, gold-rimmed eyes, deeply furrowed vermilion brows, a wide open mouth full of fangs, long wild black hair streaming behind it like smoke, and the sleeves of a faded crimson dancer’s robe drifting below it with no body inside; a single tear glinting at the corner of one eye',
}

const ASSETS: HdAsset[] = [
  // ── characters
  { id: 'maskmaker', category: 'portraits', name: 'Kaede the Mask Carver', usage: 'Valley of Hearts mask carver (maskmaker sprite): dialogue, cutscenes', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Character portrait, waist-up, three-quarter view, of ${LOOK.maskmaker}, a small knowing smile, holding the mask up to the light to judge its expression. ${CUTOUT('#00ff00')}` },
  { id: 'dancer', category: 'portraits', name: 'Ren the Kagura Dancer', usage: 'Valley of Hearts kagura dancer (dancer sprite): dialogue, cutscenes', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Character portrait, waist-up, of ${LOOK.dancer}, mid-turn with the fan opening, eyes bright but a little nervous. ${CUTOUT('#00ff00')}` },
  { id: 'hotaru', category: 'portraits', name: 'Hotaru the Firefly Child', usage: 'Valley of Hearts guide (Hotaru speaker, ko-hotaru entity): dialogue, cutscenes', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Character portrait, waist-up, of ${LOOK.hotaru}, waving both hands in welcome, her antenna lights glowing brighter with excitement. ${CUTOUT('#ff00ff')}` },
  // ── folklore spirits
  { id: 'yokai-amanojaku', category: 'portraits', name: 'Amanojaku', usage: 'Valley of Hearts folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Portrait of Amanojaku, the contrary little demon of Japanese folklore, as a small child-sized imp: tousled black hair, one stubby red horn, cheeks puffed out in a pout, arms crossed, tongue sticking out, wearing a patched indigo farm-child kimono, but its eyes are shining and a little wet, and one hand secretly clutches the sleeve of an unseen grandmother. ${CUTOUT('#00ff00')}` },
  { id: 'yokai-ame-onna', category: 'portraits', name: 'Ame-onna, the Rain Woman', usage: 'Valley of Hearts folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Portrait of Ame-onna, the rain woman: a slender young woman with very long wet black hair that turns into falling rain at the ends, a grey-blue kimono patterned with raindrops and hydrangeas, a small cloud drifting above her head, holding an oiled-paper umbrella she never opens, tears on her cheeks just turning into a hesitant smile. ${CUTOUT('#ff00ff')}` },
  { id: 'yokai-kerakera-onna', category: 'portraits', name: 'Kerakera-onna', usage: 'Valley of Hearts folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Portrait of Kerakera-onna from Toriyama Sekien’s yokai scrolls: a giant, elegant woman in a gorgeous red-and-gold Edo-period furisode, black hair in a tall shimada topknot with tortoiseshell combs, leaning forward and laughing with her mouth wide open and blackened teeth (ohaguro), one sleeve raised to her face, eyes crinkled with genuine delight. ${CUTOUT('#00ff00')}` },
  // ── monster and boss
  { id: 'menrei', category: 'enemies', name: 'Menrei', usage: 'Valley of Hearts random battles', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 3, prompt: `A menrei, a mask spirit: a floating blank white Noh mask (ko-omote, a young woman’s face) with painted black hair lines and narrow slit eyes, small red lips, an unreadable expression, crimson cords trailing from its sides like little arms, and a tail of pale ghostly mist where a body should be. ${CUTOUT('#ff00ff')}` },
  { id: 'hannya', category: 'bosses', name: 'Hannya', usage: 'Region 12 boss battle (feelings)', w: 1920, h: 1080, cutout: { key: '#ff00ff' }, priority: 1, prompt: `${LOOK.hannya}. Above her, faint ghostly images of frozen white masks orbit like moons. Dramatic, frightening at first glance and heartbreaking at second, whole figure visible, centered. ${CUTOUT('#ff00ff')}` },
  // ── backdrop and scenes
  { id: 'battle-kokoro', category: 'backdrops', name: 'Valley of Hearts in autumn', usage: 'Battle background, region 12', w: 1920, h: 1080, priority: 1, prompt: 'Wide landscape battle background: a Japanese valley village in autumn at golden hour, blazing red and orange maple trees, terraced rice paddies of ripe gold stepping down the hillside, a clear river crossed by a wooden bridge hung with paper lanterns, thatched farmhouses, a vermilion kagura stage with festival banners in the middle distance and blue mountains behind. The centre and lower-middle are an open grassy path scattered with fallen maple leaves. Eye-level camera.' },
  { id: 'arrive-kokoro', category: 'scenes', name: 'Arriving: the Valley of Hearts', usage: 'Region 12 arrival cutscene', w: 1920, h: 1080, priority: 2, prompt: `A mountain road opening onto a valley of red maples, rice terraces and a lantern-hung festival street, a kagura stage beyond the river; villagers stand about with faces frozen white and blank like Noh masks, while glowing feeling-words drift unspoken in the air like dim fireflies; ${CAST.mage} and ${CAST.fude} arrive at the village gate, small in frame, greeted by ${LOOK.hotaru}.` },
  { id: 'memory-r12-a', category: 'scenes', name: 'Memory: Happy and Sad Together', usage: 'Memory cutscene illustration', w: 1920, h: 1080, priority: 1, prompt: `Sepia-tinted memory: the Valley of Hearts long ago, the night after the autumn festival, an empty kagura stage, lanterns going out one by one, maple leaves falling; ${CAST.scribe} sits on the stage edge smiling with tears on her cheeks; ${CAST.fude} floats beside her; at the edge of the lantern light sits ${CAST.shadow}, watching the empty stage with her.` },
  { id: 'memory-r12-b', category: 'scenes', name: 'Memory: A Face That Is Both', usage: 'Memory cutscene illustration', w: 1920, h: 1080, priority: 1, prompt: `Sepia-tinted memory in an old mask carver’s workshop: walls lined with Noh masks; an elderly carver tilts a white ko-omote mask upward so that it seems to smile, while beside it the same mask, tilted down, seems to weep; ${CAST.scribe} leans close in wonder, brush in hand, an open notebook with a half-written name beginning “しず”; ${CAST.fude} floats at her shoulder.` },
]

export const ART: RegionArt = {
  assets: ASSETS,
  sprites: { maskmaker: 'maskmaker', dancer: 'dancer', menrei: 'menrei', hannya: 'hannya' },
  bosses: { 'boss-hannya': 'hannya', hannya: 'hannya' },
  speakers: { hotaru: 'hotaru' },
  entities: { 'ko-hotaru': 'hotaru', 'fk12-amanojaku': 'yokai-amanojaku', 'fk12-ameonna': 'yokai-ame-onna', 'fk12-kerakera': 'yokai-kerakera-onna' },
  profiles: {
    // the apron and sleeves stir as she works
    maskmaker: portrait({ breath: 0.005, period: 4.6, sway: 0.002, hair: 0.002 }),
    // the dancer's sleeves and hair keep moving, as if mid-dance
    dancer: portrait({
      breath: 0.006,
      period: 4.2,
      hair: 0.004,
      regions: { fan: { cx: 0.78, cy: 0.62, rx: 0.2, ry: 0.22, soft: 0.85 } },
      extra: [
        { regions: ['sleeves', 'sleevesR'], ax: 0.004, ay: 0.002, speed: 0.5, freq: 1.3 },
        { regions: 'fan', ax: 0.003, ay: 0.002, speed: 0.7, freq: 1.1 },
      ],
    }),
    // antenna lights bob like fireflies
    hotaru: {
      ...stander({ breath: 0.009, period: 2.9, sway: 0.004, chest: 0.5 }),
      regions: { antennae: R.crown },
      flutter: [{ regions: 'antennae', ax: 0.004, ay: 0.003, speed: 2.6, freq: 0.9 }],
    },
    'yokai-amanojaku': {
      ...stander({ breath: 0.009, period: 2.7, sway: 0.004, chest: 0.5 }),
      regions: { hair: R.hairTop },
      flutter: [{ regions: 'hair', ax: 0.003, ay: 0.002, speed: 2.8, freq: 0.8 }],
    },
    // the rain-hair keeps falling
    'yokai-ame-onna': portrait({
      breath: 0.005,
      period: 5.2,
      hair: 0.004,
      regions: { rain: { cx: 0.5, cy: 0.8, rx: 0.55, ry: 0.3, soft: 0.85, ramp: [0.5, 0.55, 0.5, 1] } },
      extra: [{ regions: 'rain', ax: 0.002, ay: 0.005, speed: 0.9, freq: 1.6 }],
    }),
    // shoulders shake with laughter
    'yokai-kerakera-onna': portrait({ breath: 0.008, period: 2.2, sway: 0.004, hair: 0.002 }),
    menrei: {
      regions: { cords: { cx: 0.5, cy: 0.45, rx: 0.6, ry: 0.2, soft: 0.85 }, mist: { cx: 0.5, cy: 0.92, rx: 0.4, ry: 0.2, soft: 0.85 } },
      breathe: { amp: 0.004, period: 3.2, chest: 0.5 },
      float: { amp: 0.022, period: 3.1, tilt: 0.02 },
      flutter: [{ regions: 'cords', ax: 0.004, ay: 0.003, speed: 1.6, freq: 1.1 }],
      wave: { amp: 0.004, wavelength: 0.5, speed: 0.4, axis: 'x', regions: 'mist' },
    },
    hannya: {
      regions: {
        hair: { cx: 0.5, cy: 0.25, rx: 0.62, ry: 0.32, soft: 0.8, ramp: [0.5, 0.45, 0.5, 0.0] },
        sleeves: { cx: 0.5, cy: 0.88, rx: 0.6, ry: 0.2, soft: 0.85 },
        orbit: { cx: 0.5, cy: 0.1, rx: 0.62, ry: 0.18, soft: 0.85 },
      },
      breathe: { amp: 0.009, period: 3.4, chest: 0.4, widen: 0.006 },
      float: { amp: 0.014, period: 4, tilt: 0.012 },
      flutter: [
        { regions: 'hair', ax: 0.005, ay: 0.003, speed: 0.7, freq: 1.3 },
        { regions: 'orbit', ax: 0.003, ay: 0.002, speed: 0.4, freq: 1.0 },
      ],
      wave: { amp: 0.004, wavelength: 0.5, speed: 0.3, axis: 'x', regions: 'sleeves' },
    },
  },
  voices: {
    // calm, low-ish woman's voice, dry and unhurried
    maskmaker: { src: 'soft', base: 205, scale: [0, 2, 5, 7], formant: 1.14, contour: 'dip', bend: 2, len: 0.07, every: 2, vib: 14, vibRate: 4.8, breath: 0.2, tts: { gender: 'female', age: 'adult', pitch: 0.93, rate: 0.89 }, cry: 'hum' },
    // bright, quick, a little proud
    dancer: { src: 'pulse', base: 318, scale: [0, 2, 4, 7, 9], formant: 1.36, contour: 'arch', bend: 4, len: 0.05, every: 2, vib: 20, vibRate: 6.2, breath: 0.1, tts: { gender: 'female', age: 'young', pitch: 1.27, rate: 1.09 }, cry: 'suzu' },
    // a hollow, breathy whisper behind a mask
    menrei: { src: 'soft', base: 340, scale: [0, 1, 5], formant: 1.27, contour: 'wobble', bend: 3, len: 0.07, every: 2, vib: 40, vibRate: 3.6, breath: 0.45, tts: { gender: 'female', age: 'young', pitch: 1.11, rate: 0.83 }, cry: 'wisp', cryPitch: 1.3 },
    // a cracked, deep woman's wail
    hannya: { src: 'saw', base: 158, scale: [0, 1, 6, 7], formant: 1.03, contour: 'fall', bend: 6, len: 0.09, every: 2, vib: 50, vibRate: 5.4, breath: 0.25, grit: 0.4, tts: { gender: 'female', age: 'adult', pitch: 0.71, rate: 0.86 }, cry: 'screech', cryPitch: 0.7 },
  },
}

/**
 * Region 9 illustrated art: the Snowbound Temple's people, spirits and
 * places. Prompts follow the core manifest (subject first; the shared STYLE
 * prompt is appended by the pipeline). Nothing here is generated yet: the
 * game falls back to the pixel sprites until the images exist.
 */
import { CAST, CUTOUT, type HdAsset } from '../../art/hd/cast'
import { portrait, stander } from '../../anim/profileKit'
import type { RegionArt } from '../types'

const MONK = 'Kuu, a young Buddhist monk apprentice (about 14, earnest and a little anxious) with a freshly shaved head and rosy cheeks from the cold, wearing plain black samue-style robes over a white under-collar, a wide conical straw kasa hat tipped back on a cord, holding a calligraphy brush and a small register book against his chest'
const GENTA = 'Genta, a big burly middle-aged Buddhist bell-keeper monk with a shaved head, thick black eyebrows and a booming laugh, black robes with sleeves tied back by a cord, a straw kasa slung on his back, gripping the rope of a temple bell striker log'
const SNOWCHILD = 'Yuki, a little snow-spirit girl (about 6) with snow-white bobbed hair and pale pink cheeks, wearing a thick straw mino rain cape and a little straw hood over a pale blue kimono, white straw boots, frost crystals glittering in her hair, curious shy smile'
const YUKIONNA = 'Yuki-onna, the Snow Woman: a tall, beautiful, very pale woman with long straight black hair falling past her waist, ice-blue eyes, lips faintly blue, wearing a flowing white kimono that fades into swirling snow and mist at the hem, a pale blue obi, snowflakes and icicles orbiting her, cold and sorrowful rather than cruel'

const ASSETS: HdAsset[] = [
  // ── Portraits (dialogue & cutscenes) ──
  { id: 'monk', category: 'portraits', name: 'Kuu the young monk', usage: 'Region 9: monk NPCs (Kuu, the sweeper, the scribes, the abbot) and cutscenes', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Character portrait, waist-up, three-quarter view, of ${MONK}, breath misting in the cold air, a polite small bow. ${CUTOUT('#00ff00')}` },
  { id: 'genta', category: 'portraits', name: 'Genta the bell-keeper', usage: 'Region 9: the bell tower, cutscenes and Kotone’s memory', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Character portrait, waist-up, three-quarter view, of ${GENTA}, laughing heartily with his head thrown back. ${CUTOUT('#00ff00')}` },
  { id: 'snowchild', category: 'portraits', name: 'Yuki the snow child', usage: 'Region 9: Yuki in tales and cutscenes', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Character portrait, waist-up, of ${SNOWCHILD}, holding out her arms to be picked up. ${CUTOUT('#ff00ff')}` },
  // ── Folklore spirits (Spirit Scroll + their tales' dialogue) ──
  { id: 'yokai-yukinko', category: 'portraits', name: 'Yukinko, the snow child', usage: 'Region 9 folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Portrait of a yukinko snow child spirit: ${SNOWCHILD}, sitting on top of a big old snowman and giggling, a tiny bell of clear ice in her hands, snow falling softly around her. ${CUTOUT('#ff00ff')}` },
  { id: 'yokai-tsurara-onna', category: 'portraits', name: 'Tsurara-onna, the icicle wife', usage: 'Region 9 folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Portrait of Tsurara-onna, the icicle wife: a slender pale young woman in a plain white kimono with a pattern of tiny icicles, long black hair held by a comb as clear as ice, her breath leaving no mist, holding a folded letter of white washi to her chest, gentle and wistful, a fringe of glittering icicles hanging above her. ${CUTOUT('#ff00ff')}` },
  { id: 'yokai-mokumokuren', category: 'portraits', name: 'Mokumokuren, the many-eyed screen', usage: 'Region 9 folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Portrait of mokumokuren: an old wooden-latticed shoji paper screen standing on its own, its paper torn into many holes, and in every hole a large expressive eye blinking (curious, sleepy, delighted), a few fresh white patches of washi pasted over some holes, a calligraphy brush leaning against it; spooky but endearing, in the style of an Edo yokai scroll. ${CUTOUT('#ff00ff')}` },
  // ── Monsters ──
  { id: 'snow-wolf', category: 'enemies', name: 'Snow wolf', usage: 'Snowbound Temple random battles', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 3, prompt: `A lean grey-white mountain wolf with a thick frosted ruff, pale ice-blue eyes, icicles hanging from its fur, breath steaming, crouched and snarling on fresh snow. ${CUTOUT('#ff00ff')}` },
  { id: 'yuki-onna', category: 'bosses', name: 'Yuki-onna, the Snow Woman', usage: 'Region 9 boss battle and cutscenes', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 1, prompt: `${YUKIONNA}; frozen kanji glyphs encased in ice drift around her like crystals, one pale hand raised to breathe a freezing wind. ${CUTOUT('#ff00ff')}` },
  // ── Battle backdrop ──
  { id: 'battle-snowtemple', category: 'backdrops', name: 'Snowbound temple grounds', usage: 'Battle background, region 9', w: 1920, h: 1080, priority: 1, prompt: 'Wide landscape battle background: a remote Buddhist mountain temple deep in snow, a black-timbered main hall with a heavy snow-laden roof, a wooden bell tower with a great bronze bell, stone lanterns capped with snow, tall snow-laden cedars and pines, falling snow, soft blue-white light with warm lantern glow in the windows. The center and lower-middle are an open, trampled snowy courtyard. Eye-level camera.' },
  // ── Cutscenes ──
  { id: 'arrive-snowtemple', category: 'scenes', name: 'Arriving: the Snowbound Temple', usage: 'Region 9 arrival cutscene', w: 1920, h: 1080, priority: 2, prompt: `A mountain temple deep in snow at dawn: a great sanmon gate at the top of long snowy stone steps lined with snow-capped lanterns and little jizō statues wearing straw hats, a main hall and a bell tower beyond, every wooden signboard and plaque crusted over with ice so the characters cannot be read, a frozen lake glimpsed below; ${MONK} welcomes ${CAST.mage} and ${CAST.fude} at the gate, while ${SNOWCHILD} peeks shyly from behind a snowman.` },
  { id: 'memory-r9-a', category: 'scenes', name: 'Memory: The Hush of Snow', usage: 'Memory cutscene illustration (region 9, core)', w: 1920, h: 1080, priority: 1, prompt: `A snowy night at a mountain temple long ago, sepia-tinted like an old memory: ${CAST.scribe} sits on the wooden veranda with her eyes closed and a finger to her lips, listening to snow falling in thick silent flakes; ${CAST.fude} listens beside her with wide eyes. At the edge of the lantern light a younger, gentler ${YUKIONNA} stands half-hidden in the falling snow, listening too. Hushed, full, peaceful silence.` },
  { id: 'memory-r9-b', category: 'scenes', name: 'Memory: A Name Written in Sound', usage: 'Memory cutscene illustration (region 9, bonus)', w: 1920, h: 1080, priority: 1, prompt: `A bright winter morning inside a temple scriptorium long ago, sepia-tinted: a big laughing bell-keeper monk guides the hand of ${CAST.scribe} as she writes two large kanji in fresh ink on white washi, her own name, her face lighting up with joy; ${CAST.fude} bounces happily beside the inkstone; snowlight streams through the paper screens.` },
]

export const ART: RegionArt = {
  assets: ASSETS,
  sprites: { monk: 'monk', snowchild: 'snowchild', 'snow-wolf': 'snow-wolf', 'yuki-onna': 'yuki-onna' },
  bosses: { 'boss-yukionna': 'yuki-onna', yukionna: 'yuki-onna' },
  speakers: { genta: 'genta' },
  entities: { 'fk9-tsurara': 'yokai-tsurara-onna', 'fk9-shoji': 'yokai-mokumokuren', 'sb-genta': 'genta' },
  profiles: {
    monk: portrait({ breath: 0.006, period: 4.3, sway: 0.0025, hair: 0.0015, regions: { hat: { cx: 0.5, cy: 0.12, rx: 0.48, ry: 0.16, soft: 0.8 } }, extra: [{ regions: 'hat', ax: 0.002, ay: 0.001, speed: 0.3, freq: 0.6 }] }),
    genta: portrait({ breath: 0.009, period: 3.6, sway: 0.003, hair: 0.001, talk: 1.3 }),
    snowchild: portrait({ breath: 0.008, period: 2.8, sway: 0.004, hair: 0.004, talk: 1.3 }),
    'yokai-yukinko': portrait({ breath: 0.008, period: 2.9, sway: 0.0035, hair: 0.004, talk: 1.2 }),
    'yokai-tsurara-onna': portrait({ breath: 0.003, period: 5.6, sway: 0.0018, hair: 0.004 }),
    'yokai-mokumokuren': stander({ breath: 0.003, period: 4.8, sway: 0.0012 }),
    'snow-wolf': stander({ breath: 0.011, period: 2.2, sway: 0.003, chest: 0.5 }),
    'yuki-onna': {
      regions: {
        hem: { cx: 0.5, cy: 0.98, rx: 0.62, ry: 0.32, soft: 0.8, ramp: [0.5, 0.66, 0.5, 1] },
        hair: { cx: 0.5, cy: 0.36, rx: 0.38, ry: 0.32, soft: 0.8, ramp: [0.5, 0.1, 0.5, 0.65] },
      },
      float: { amp: 0.014, period: 5.2, tilt: 0.01 },
      breathe: { amp: 0.004, period: 5.4, chest: 0.42 },
      flutter: [
        // A snowy hem drifting like a slow blizzard, and long hair lifted by the cold wind.
        { regions: 'hem', ax: 0.012, ay: 0.005, speed: 0.35, freq: 1.2, by: -0.003 },
        { regions: 'hair', ax: 0.007, ay: 0.002, speed: 0.25, freq: 0.9 },
      ],
    },
  },
  voices: {
    monk: { src: 'soft', base: 163, scale: [0, 2, 5, 7, 9], formant: 1.04, contour: 'flat', bend: 2, len: 0.07, every: 2, breath: 0.18, vib: 12, vibRate: 4.2, tts: { gender: 'male', age: 'young', pitch: 0.93, rate: 0.87 }, cry: 'suzu', cryPitch: 0.8 },
    snowchild: { src: 'pure', base: 470, formant: 1.66, contour: 'rise', bend: 5, len: 0.045, every: 1, breath: 0.12, tts: { gender: 'female', age: 'child', pitch: 1.77, rate: 1.17 }, cry: 'giggle', cryPitch: 1.15 },
    'snow-wolf': { src: 'saw', base: 112, scale: [0, 1, 5], formant: 0.86, contour: 'fall', bend: 6, len: 0.07, every: 2, breath: 0.3, grit: 0.45, tts: { gender: 'male', age: 'adult', pitch: 0.57, rate: 1.03 }, cry: 'growl', cryPitch: 1.4 },
    'yuki-onna': { src: 'whisper', base: 262, scale: [0, 1, 5, 7, 8], formant: 1.21, contour: 'wobble', bend: 3, len: 0.11, every: 2, vib: 34, vibRate: 3.6, breath: 0.4, tts: { gender: 'female', age: 'adult', pitch: 0.83, rate: 0.79 }, cry: 'wisp', cryPitch: 0.72 },
  },
}

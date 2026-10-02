import { CAST, CUTOUT } from '../../art/hd/cast'
import { portrait, R, stander } from '../../anim/profileKit'
import type { RegionArt } from '../types'

/** Region 7 illustrated art: the Hot-Spring Hollow, its people, spirits, monster and boss. */
export const ART: RegionArt = {
  assets: [
    // ── Portraits
    { id: 'okami', category: 'portraits', name: 'Haruko, the Proprietress', usage: 'Hot-Spring Hollow inn; check-in dialogue; cutscenes', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Character portrait, waist-up, of Haruko, the poised proprietress (okami) of an old mountain hot-spring inn, about forty: glossy black hair in a high neat bun with a red lacquer comb, a deep indigo kimono with a pattern of rising steam curls, a white kappōgi apron over it and an orange obi, sleeves tied back; she bows slightly with hands folded, a calm, kind smile with a hint of mischief in her eyes. ${CUTOUT('#00ff00')}` },
    { id: 'monkey', category: 'portraits', name: 'Saru the Snow Monkey', usage: 'Snow-monkey NPCs and Saru in cutscenes', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Portrait of an old Japanese snow monkey (macaque) with thick tan-grey fur dusted with snowflakes, a bright red face and wise amber eyes, a small folded white towel balanced on his head, sitting dignified with steam curling around him, a little smug. ${CUTOUT('#ff00ff')}` },
    { id: 'yokai-akaname', category: 'portraits', name: 'Akaname', usage: 'Hot-Spring Hollow folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Portrait of an akaname, the tub-licking bathhouse yokai: a small child-sized spirit with bright red skin, shaggy black hair, one big bare foot forward, huge round eyes and an enormously long pink tongue curling out, wearing a tattered loincloth, hugging a wooden scrubbing brush and a little wooden bath bucket; mischievous but sweet. ${CUTOUT('#00ff00')}` },
    { id: 'yokai-shirasagi', category: 'portraits', name: 'The White Heron of the Spring', usage: 'Hot-Spring Hollow folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Portrait of a sacred white heron (shirasagi) standing on one leg, elegant long neck and flowing breeding plumes, feathers faintly glowing with a soft golden halo, a calm and knowing eye, wisps of hot-spring steam around its feet; serene and quietly divine. ${CUTOUT('#ff00ff')}` },
    { id: 'yokai-yoro-no-taki', category: 'portraits', name: 'Spirit of Yōrō Falls', usage: 'Hot-Spring Hollow folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Portrait of the gentle spirit of a mountain waterfall: a tall, kind old woman whose white robes and long silver hair pour downward and turn into falling water and mist at the hem, holding a gourd (hyōtan) brimming with glowing sweet water, a rainbow in the spray behind her, warm motherly eyes. ${CUTOUT('#ff00ff')}` },

    // ── Monster and boss
    { id: 'kamaitachi', category: 'enemies', name: 'Kamaitachi', usage: 'Hot-Spring Hollow random battles', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 3, prompt: `A kamaitachi, the sickle-weasel yokai: a sleek golden-brown weasel with a cream belly and a huge bushy tail, its front paws ending in curved silver sickle blades, leaping and riding a spinning whirlwind of pale wind and bamboo leaves, sharp grin, fast and slashing. ${CUTOUT('#ff00ff')}` },
    { id: 'knotting-yamanba', category: 'bosses', name: 'The Knotting Yamanba', usage: 'Region 7 boss battle and cutscenes', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 1, prompt: `A yamanba, the wild mountain woman of Japanese legend: an old woman with a huge untamed mane of white hair, sharp grinning teeth, glinting eyes, in a ragged vermilion kimono with a tattered indigo obi; one hand holds a big kitchen knife, the other a straw rope tied into many glowing knots, each knot trapping a little brush-stroke glyph; steam and sparks swirl around her from a bubbling iron pot at her feet; menacing, theatrical, but with something sad in her face. ${CUTOUT('#00ff00')}` },

    // ── Battle backdrop
    { id: 'battle-onsen', category: 'backdrops', name: 'Hot-Spring Hollow', usage: 'Battle background, region 7', w: 1920, h: 1080, priority: 1, prompt: 'Wide landscape battle background: a snowy mountain hot-spring village at dusk, wooden inns with tiled roofs and glowing paper lanterns, steam rising from rock pools, a rope bridge over a deep gorge in the distance, a bamboo grove and snow-laden pines; the center and lower-middle are an open snowy flagstone yard beside a steaming footbath. Eye-level camera.' },

    // ── Cutscenes
    { id: 'arrive-onsen', category: 'scenes', name: 'Arriving: the Hot-Spring Hollow', usage: 'Region 7 arrival cutscene', w: 1920, h: 1080, priority: 2, prompt: `A hot-spring village in a snowy mountain hollow: a lantern-lit street of old wooden inns with noren curtains, clouds of white steam drifting across the snow, a rope bridge over a misty gorge, snow monkeys bathing in a rock pool; glowing brush-stroke glyphs float in the steam but some are tied into tangled knots; ${CAST.mage} and ${CAST.fude} arriving on the road, greeted by a snow monkey with a towel on its head.` },
    { id: 'memory-r7-a', category: 'scenes', name: 'Memory: The Breath of the Water', usage: 'Memory cutscene illustration', w: 1920, h: 1080, priority: 1, prompt: `A snowy night long ago, sepia-tinted: an old rock bath in the mountains under the stars, thick white steam rising; ${CAST.scribe} kneels at the edge and writes in the air with her glowing brush, and the luminous letters melt softly into the steam and drift up toward the stars; ${CAST.fude} watches beside her, wide-eyed; snow monkeys doze in the water. Quiet, tender, wondering.` },
    { id: 'memory-r7-b', category: 'scenes', name: 'Memory: You May Rest', usage: 'Memory cutscene illustration', w: 1920, h: 1080, priority: 1, prompt: `Long ago, sepia-tinted: a snowy mountain path at night where ${CAST.scribe} has sunk down exhausted in the snow, her brush loose in her hand; a tall, kindly mountain woman with wild white hair and a vermilion kimono kneels to offer her a steaming wooden ladle of hot water, a warm lantern-lit rock bath just behind them with snow monkeys soaking; ${CAST.fude} nestled in Kotone’s collar. Gentle, protective, safe.` },
  ],
  sprites: { okami: 'okami', monkey: 'monkey', kamaitachi: 'kamaitachi', yamanba: 'knotting-yamanba' },
  bosses: { 'boss-yamanba': 'knotting-yamanba', yamanba: 'knotting-yamanba' },
  entities: {
    'fk7-akaname': 'yokai-akaname',
    'fk7-sagi': 'yokai-shirasagi',
    'fk7-falls': 'yokai-yoro-no-taki',
  },
  profiles: {
    okami: portrait({ breath: 0.006, period: 4.6, sway: 0.0025, hair: 0.0015 }),
    monkey: { ...stander({ breath: 0.009, period: 2.8, sway: 0.004 }), regions: { towel: { cx: 0.5, cy: 0.08, rx: 0.25, ry: 0.1, soft: 0.8 } }, flutter: [{ regions: 'towel', ax: 0.002, ay: 0.001, speed: 0.6, freq: 1 }] },
    'yokai-akaname': { ...stander({ breath: 0.01, period: 2.4, sway: 0.005 }), regions: { tongue: { cx: 0.5, cy: 0.45, rx: 0.2, ry: 0.16, soft: 0.8 } }, flutter: [{ regions: 'tongue', ax: 0.005, ay: 0.003, speed: 1.3, freq: 1.6 }] },
    'yokai-shirasagi': { ...stander({ breath: 0.004, period: 5.5, sway: 0.002 }), regions: { plume: { cx: 0.5, cy: 0.12, rx: 0.32, ry: 0.18, soft: 0.8, ramp: [0.5, 0.3, 0.5, 0.0] } }, flutter: [{ regions: 'plume', ax: 0.004, ay: 0.002, speed: 0.5, freq: 1.2 }] },
    'yokai-yoro-no-taki': { ...stander({ breath: 0.004, period: 5, sway: 0.002 }), regions: { hem: R.hem, hair: R.hairTop }, flutter: [{ regions: 'hem', ax: 0.008, ay: 0.004, speed: 0.7, freq: 1.4 }, { regions: 'hair', ax: 0.003, ay: 0.001, speed: 0.4, freq: 1 }] },
    kamaitachi: {
      regions: {
        tail: { cx: 0.8, cy: 0.25, rx: 0.25, ry: 0.3, soft: 0.8 },
        wind: { cx: 0.5, cy: 0.86, rx: 0.5, ry: 0.18, soft: 0.8 },
      },
      float: { amp: 0.028, period: 2.2, tilt: 0.03 },
      breathe: { amp: 0.006, period: 1.6, chest: 0.45 },
      // The tail lashes; the whirlwind below it never stops spinning.
      flutter: [
        { regions: 'tail', ax: 0.008, ay: 0.004, speed: 1.2, freq: 1.5 },
        { regions: 'wind', ax: 0.012, ay: 0.003, speed: 1.8, freq: 2 },
      ],
    },
    'knotting-yamanba': {
      regions: {
        hair: { cx: 0.5, cy: 0.2, rx: 0.5, ry: 0.3, soft: 0.8, ramp: [0.5, 0.35, 0.5, 0.0] },
        rope: { cx: 0.85, cy: 0.6, rx: 0.2, ry: 0.25, soft: 0.8 },
        hem: R.hem,
      },
      breathe: { amp: 0.009, period: 3.4, chest: 0.45, widen: 0.006 },
      sway: { amp: 0.004, period: 4.5, power: 2 },
      // Wild hair streaming, the knotted rope swinging, rags at the hem.
      flutter: [
        { regions: 'hair', ax: 0.009, ay: 0.004, speed: 0.5, freq: 1.4 },
        { regions: 'rope', ax: 0.005, ay: 0.004, speed: 0.9, freq: 2 },
        { regions: 'hem', ax: 0.006, ay: 0.002, speed: 0.5, freq: 1.2 },
      ],
      lean: 0.012,
    },
  },
  voices: {
    okami: { src: 'soft', base: 238, formant: 1.2, contour: 'fall', bend: 2, len: 0.07, every: 2, vib: 15, vibRate: 5, breath: 0.12, tts: { gender: 'female', age: 'adult', pitch: 1.04, rate: 0.9 }, cry: 'suzu' },
    monkey: { src: 'pulse', base: 540, scale: [0, 3, 7], formant: 1.75, contour: 'rise', bend: 6, len: 0.04, every: 2, breath: 0.15, tts: { gender: 'male', age: 'child', pitch: 1.62, rate: 1.18 }, cry: 'screech', cryPitch: 1.4 },
    kamaitachi: { src: 'nasal', base: 620, scale: [0, 1, 6], formant: 1.85, contour: 'rise', bend: 5, len: 0.03, every: 1, breath: 0.4, grit: 0.15, tts: { gender: 'male', age: 'young', pitch: 1.66, rate: 1.27 }, cry: 'screech', cryPitch: 1.15 },
    yamanba: { src: 'saw', base: 190, scale: [0, 1, 6], formant: 1.05, contour: 'wobble', bend: 4, len: 0.075, every: 2, vib: 60, vibRate: 6.5, breath: 0.35, grit: 0.35, tts: { gender: 'female', age: 'elder', pitch: 0.82, rate: 0.86 }, cry: 'giggle', cryPitch: 0.6 },
  },
}

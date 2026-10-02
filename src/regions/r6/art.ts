/**
 * Illustrated art for the Harbour of Numbers: the fisherfolk, the giant
 * crab and the Umibōzu, the three sea spirits, the battle backdrop, the
 * arrival painting and the two memories the sea keeps.
 */
import { CAST, CUTOUT } from '../../art/hd/cast'
import { flyer, portrait, stander } from '../../anim/profileKit'
import type { RegionArt } from '../types'

export const ART: RegionArt = {
  assets: [
    { id: 'fisher', category: 'portraits', name: 'Ume the fishmonger', usage: 'Harbour fisherfolk: Ume at the fish market, the fishwife', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Character portrait, waist-up, three-quarter view, of a loud, warm-hearted fishmonger woman in her thirties: black hair tucked under an indigo tenugui headscarf knotted with a small red tie, a sea-blue work kimono with sleeves tied back by a tasuki cord, a white apron with a few honest stains, holding up a fresh silver fish in one hand and a worn wooden-handled knife in the other, grinning mid-shout. ${CUTOUT('#ff00ff')}` },
    { id: 'sailor', category: 'portraits', name: 'Captain Kai', usage: 'Harbour sailors and fishermen: Captain Kai, Old Gen, the auctioneer', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Character portrait, waist-up, three-quarter view, of a weathered, cheerful sea captain in his fifties: short black hair going grey, a white hachimaki headband knotted at the side, a short beard, sun-browned skin, a navy-and-white striped shirt under an open indigo happi coat with a wave crest, a coil of rope over one shoulder, laughing. ${CUTOUT('#ff00ff')}` },
    { id: 'crab', category: 'enemies', name: 'Giant Crab', usage: 'Harbour random battles', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 3, prompt: `A grumpy giant red shore crab the size of a cart, one claw raised and snapping, the other bigger and lopsided, eyes on stalks glaring, barnacles and a scrap of fishing net on its shell, a little puff of sea foam at its mouth. ${CUTOUT('#00ff00')}` },
    { id: 'umibozu', category: 'bosses', name: 'The Umibōzu', usage: 'Region 6 boss battle', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 1, prompt: `The Umibōzu, a colossal sea yokai: a smooth, bald, inky-black head and huge shoulders rising out of a churning dark wave, like an enormous shaven monk, with two pale glowing lantern-like eyes and no other features; seawater pours from its brow, tiny glowing number-like brush glyphs swirl inside its body like swallowed fireflies, a lonely and ancient presence rather than a cruel one. ${CUTOUT('#ff00ff')}` },
    { id: 'yokai-ningyo', category: 'portraits', name: 'Ningyo', usage: 'Spirit Scroll and the mermaid’s tale', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Portrait of a Japanese mermaid (ningyo) from old folklore: a serene young woman with very long black hair streaming like seaweed and pearl-white skin, the lower body of a great silver-blue koi-like fish with flowing fins, sitting on a wet rock and holding a broken string of seven pearls, eyes old beyond her face, gentle and a little sad. ${CUTOUT('#ff00ff')}` },
    { id: 'yokai-funayurei', category: 'portraits', name: 'Funayūrei', usage: 'Spirit Scroll and the ship ghosts’ tale', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `A small group of funayūrei, ghostly drowned sailors from Japanese folklore: three pale translucent blue-white figures in tattered sailor clothes with wet hair over their faces, rising out of a curl of sea mist, each holding out a wooden ladle and reaching forward pleadingly; eerie but more forlorn than frightening, faint glow. ${CUTOUT('#ff00ff')}` },
    { id: 'yokai-shojo', category: 'portraits', name: 'Shōjō', usage: 'Spirit Scroll and the Shōjō’s tale', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `A shōjō from Japanese folklore and Noh theatre: a cheerful sea sprite with a red, monkey-like face and a great mane of flaming red hair, wearing a red-and-gold patterned robe, hugging a big earthenware sake jar, cheeks flushed, mid-dance on a curling wave. ${CUTOUT('#00ff00')}` },
    { id: 'battle-harbour', category: 'backdrops', name: 'Harbour shore', usage: 'Battle background, region 6', w: 1920, h: 1080, priority: 1, prompt: 'Wide landscape battle background: a sandy Japanese fishing beach at golden hour, wooden piers and moored fishing boats with folded sails, nets drying on racks, a white lighthouse on a rocky headland, red-roofed harbour houses with paper lanterns behind, gulls in the sky. The center and lower-middle of the image are open flat sand (monsters will stand there). Eye-level camera, horizon slightly above the middle.' },
    { id: 'arrive-harbour', category: 'scenes', name: 'Arriving: the harbour', usage: 'Region 6 arrival cutscene', w: 1920, h: 1080, priority: 2, prompt: `Looking down a hill road onto a bustling Edo-era fishing harbour: red-tiled roofs, a big fish-market hall hung with noren and red paper lanterns, wooden piers full of boats, a white lighthouse on a rocky point, the wide blue sea sparkling; but the town clocks and price signs are strangely blank, and a huge dark shape looms faintly under the waves of a far cove. In the foreground, seen from behind, ${CAST.mage} with ${CAST.fude} floating at their shoulder, gazing out at the sea.` },
    { id: 'memory-r6-a', category: 'scenes', name: 'Memory: The Hour Between', usage: 'Memory cutscene illustration (harbour)', w: 1920, h: 1080, priority: 1, prompt: `Sepia-tinted memory: a harbour at dusk long ago, the sky half gold and half indigo; ${CAST.scribe} stands at the end of a wooden pier writing a single shining word in the air with her brush, and the glowing ink lays a path of light across the dark water toward one small returning fishing boat; ${CAST.fude} glows at her shoulder; fishermen with lanterns watch from the shore.` },
    { id: 'memory-r6-b', category: 'scenes', name: 'Memory: Longer Than Any Number', usage: 'Memory cutscene illustration (harbour)', w: 1920, h: 1080, priority: 1, prompt: `Sepia-tinted memory: a moonlit cove long ago; on a wet rock a long-haired mermaid with a silver fish tail sings to the waves, counting them; ${CAST.scribe} sits beside her on the rock hugging her knees and listening, ${CAST.fude} floating close, the moon's path shimmering on the sea.` },
  ],
  sprites: { fisher: 'fisher', sailor: 'sailor', crab: 'crab', umibozu: 'umibozu' },
  bosses: { 'boss-umibozu': 'umibozu', umibozu: 'umibozu' },
  entities: { 'fk6-ningyo': 'yokai-ningyo', 'fk6-funa': 'yokai-funayurei', 'fk6-shojo': 'yokai-shojo' },
  profiles: {
    fisher: portrait({ breath: 0.007, period: 3.8, sway: 0.003, hair: 0.002, talk: 1.2 }),
    sailor: portrait({ breath: 0.007, period: 4.6, sway: 0.0025, hair: 0.002, extra: [{ regions: 'hairTop', ax: 0.003, ay: 0.001, speed: 0.5, freq: 1.4 }] }),
    crab: { ...stander({ breath: 0.006, period: 2.4, sway: 0.004 }), regions: { claw: { cx: 0.2, cy: 0.25, rx: 0.25, ry: 0.25, soft: 0.8 } }, flutter: [{ regions: 'claw', ax: 0.004, ay: 0.006, speed: 2.2, freq: 1.2 }] },
    umibozu: { regions: { crown: { cx: 0.5, cy: 0.1, rx: 0.5, ry: 0.25, soft: 0.9 } }, breathe: { amp: 0.008, period: 5.5, chest: 0.4, widen: 0.006 }, float: { amp: 0.012, period: 6, tilt: 0.01 }, sway: { amp: 0.002, period: 7 } },
    'yokai-ningyo': portrait({ breath: 0.006, period: 5, sway: 0.003, hair: 0.006 }),
    'yokai-funayurei': (() => {
      const f = flyer({ amp: 0.03, period: 4, wing: 0.006, flap: 0.8 })
      return { ...f, regions: { ...f.regions, mist: { cx: 0.5, cy: 0.9, rx: 0.6, ry: 0.3, soft: 0.9 } }, flutter: [{ regions: 'mist', ax: 0.01, ay: 0.004, speed: 0.7, freq: 1.4 }] }
    })(),
    'yokai-shojo': portrait({ breath: 0.008, period: 3, sway: 0.006, hair: 0.006, talk: 1.3 }),
  },
  voices: {
    fisher: { src: 'pulse', base: 262, formant: 1.27, contour: 'arch', bend: 5, len: 0.05, every: 1, breath: 0.08, tts: { gender: 'female', age: 'adult', pitch: 1.12, rate: 1.18 }, cry: 'coins', cryPitch: 1.1 },
    sailor: { src: 'saw', base: 118, scale: [0, 2, 5], formant: 0.9, contour: 'fall', bend: 4, len: 0.07, every: 2, breath: 0.15, grit: 0.25, tts: { gender: 'male', age: 'adult', pitch: 0.78, rate: 1.04 }, cry: 'greet' },
    crab: { src: 'pulse', base: 210, scale: [0, 2, 7], formant: 1.15, contour: 'flat', len: 0.035, every: 1, grit: 0.4, tts: { gender: 'male', age: 'young', pitch: 1.22, rate: 1.22 }, cry: 'rattle', cryPitch: 1.3 },
    umibozu: { src: 'saw', base: 56, scale: [0, 2, 5], formant: 0.58, contour: 'dip', bend: 3, len: 0.15, every: 3, vib: 20, vibRate: 3, breath: 0.45, grit: 0.4, tts: { gender: 'male', age: 'elder', pitch: 0.46, rate: 0.76 }, cry: 'rumble', cryPitch: 0.8 },
  },
}

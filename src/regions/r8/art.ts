import { CAST, CUTOUT, type HdAsset } from '../../art/hd/cast'
import { portrait, R, stander } from '../../anim/profileKit'
import type { RegionArt } from '../types'

const assets: HdAsset[] = [
  // ── Portraits ──────────────────────────────────────────────────────
  { id: 'samurai', category: 'portraits', name: 'Tadashi the Retainer', usage: 'Castle town: the lord’s retainer at the gate (keigo dialogue), dojo master, patrols', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Character portrait, waist-up, of Tadashi, an earnest young samurai retainer (about 20): shaved pate with a neat glossy topknot (chonmage), serious dark eyes and a slight blush of embarrassment, a deep navy kimono with a white collar under a grey kamishimo vest with stiff winged shoulders bearing a small white crest, grey hakama, a gold-wrapped sash with two swords (katana and short wakizashi) in black lacquer scabbards at his left hip, one hand resting on a hilt, bowing slightly. ${CUTOUT('#00ff00')}` },
  { id: 'lady', category: 'portraits', name: 'Townswoman in a fine kimono', usage: 'Castle town: Kiku of the tea house, Ochiyo the traveller, Ayame the lady-in-waiting, Oroku', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Character portrait, waist-up, of an elegant Edo townswoman (mid-20s) with a warm, quick-witted smile: glossy black hair in a tall shimada topknot with a gold chrysanthemum kanzashi hairpin and a red comb, a vermilion silk kimono patterned with white plum blossoms, a wide gold obi, holding a small tray with a cup of green tea and a skewer of three dango, slight polite bow. ${CUTOUT('#00ff00')}` },

  // ── Folklore spirits ───────────────────────────────────────────────
  { id: 'yokai-maneki-neko', category: 'portraits', name: 'Maneki-neko', usage: 'Castle town folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Portrait of a maneki-neko spirit: a plump white calico cat with orange and black patches, sitting upright with its left paw raised high in a beckoning wave, a red collar with a little golden bell, holding a gold koban coin against its chest, half living cat and half glazed ceramic lucky charm, a cheerful knowing look. ${CUTOUT('#ff00ff')}` },
  { id: 'yokai-rokurokubi', category: 'portraits', name: 'Rokurokubi', usage: 'Castle town folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Portrait of a shy, gentle rokurokubi: a young Edo woman in a pale blue kimono with a lantern-moth pattern, a black lacquer comb with a gold chrysanthemum in her shimada hair, her impossibly long slender neck curving up and around in a graceful loop so her face peers down from above, hiding a blush behind a sleeve, more embarrassed than eerie. ${CUTOUT('#00ff00')}` },
  { id: 'yokai-hitotsume-kozo', category: 'portraits', name: 'Hitotsume-kozō', usage: 'Castle garden folklore tale; Spirit Scroll', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Portrait of a hitotsume-kozō: a small mischievous boy-monk with a shaved round head, one huge round eye in the middle of his face, a long pink tongue stuck out playfully, wearing a little grey monk’s robe and straw sandals, clutching a battered ledger book with a brush tucked behind his ear, grinning. ${CUTOUT('#00ff00')}` },

  // ── Monster and boss ───────────────────────────────────────────────
  { id: 'karakuri', category: 'enemies', name: 'Clockwork Tea Doll', usage: 'Castle town random battles', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 3, prompt: `A karakuri ningyō, an Edo clockwork tea-serving doll gone haywire: a doll in a red kimono with a black bobbed hairstyle and a pale porcelain face, glowing red eyes, holding a lacquer tray with a teacup sloshing hot tea, brass gears and a wind-up key sticking out of its back, rolling forward on hidden wheels, bowing at a jerky wrong angle. ${CUTOUT('#ff00ff')}` },
  { id: 'nurarihyon', category: 'bosses', name: 'Nurarihyon', usage: 'Region 8 boss battle and cutscenes', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 1, prompt: `Nurarihyon, the slippery old yokai who walks into houses uninvited and plays the master: a sly, dignified old man with an enormous smooth bald head shaped like a gourd swelling up and back, wispy white hair at the temples, a long white beard, half-closed knowing eyes and a smug smile, wearing a luxurious dark indigo haori with gold crests over a plum kimono, lounging as if he owns the place, puffing a long thin kiseru pipe whose smoke curls into shapes like stolen polite words; faint purple aura. ${CUTOUT('#00ff00')}` },

  // ── Backdrop and scenes ────────────────────────────────────────────
  { id: 'battle-castletown', category: 'backdrops', name: 'Castle town street', usage: 'Battle background, region 8', w: 1920, h: 1080, priority: 1, prompt: 'Wide landscape battle background: an Edo castle-town street at golden dusk, wooden shopfronts with indigo noren curtains and rows of red paper chochin lanterns, a canal with a vermilion arched bridge, and a tall white castle keep with dark tiled roofs rising behind the wall. The center and lower-middle are open packed-earth street. Eye-level camera.' },
  { id: 'arrive-castletown', category: 'scenes', name: 'Arriving: the Castle Town', usage: 'Region 8 arrival cutscene', w: 1920, h: 1080, priority: 2, prompt: `A bustling Edo castle town seen from the west road: a long main street hung with red chochin lanterns, shop curtains, a merchant with an abacus, a tea house, a kabuki stage banner, an arched bridge over a canal, and a white castle with a moat beyond; a cheeky kid town guide points the way, while ${CAST.mage} and ${CAST.fude} take it all in.` },
  { id: 'memory-r8-a', category: 'scenes', name: 'Memory: The Pause Before a Reply', usage: 'Memory cutscene illustration', w: 1920, h: 1080, priority: 1, prompt: `Inside an old Edo tea house long ago, sepia-tinted like an old memory: ${CAST.scribe} kneels on tatami beside a low table, writing a single glowing brush stroke in the air; a guest bows, cup in hand, in the quiet pause before thanking the tea mistress; in the space between them sits ${CAST.shadow}, small and content, listening. ${CAST.fude} peeks over her shoulder. Warm, still, gentle mood.` },
  { id: 'memory-r8-b', category: 'scenes', name: 'Memory: The Cat Who Waited', usage: 'Memory cutscene illustration', w: 1920, h: 1080, priority: 1, prompt: `An Edo shop front at dusk long ago, sepia-tinted: a white beckoning cat raises its paw by the doorway while ${CAST.scribe} holds the shop curtain open and gently invites ${CAST.shadow}, which hesitates at the corner of the street, to come in for tea; a pot of tea and three cups wait on the bench, ${CAST.fude} floating beside her. Tender, hopeful mood.` },
]

export const ART: RegionArt = {
  assets,
  sprites: {
    samurai: 'samurai',
    lady: 'lady',
    karakuri: 'karakuri',
    nurarihyon: 'nurarihyon',
  },
  bosses: {
    'boss-nurarihyon': 'nurarihyon',
    nurarihyon: 'nurarihyon',
  },
  entities: {
    'fk8-neko': 'yokai-maneki-neko',
    'fk8-oroku': 'yokai-rokurokubi',
    'fk8-kozo': 'yokai-hitotsume-kozo',
  },
  profiles: {
    samurai: portrait({ breath: 0.005, period: 4.8, sway: 0.002, hair: 0.0015 }),
    lady: portrait({ breath: 0.006, period: 4.3, sway: 0.003, hair: 0.003, talk: 1.15 }),
    'yokai-maneki-neko': stander({ breath: 0.008, period: 2.6, sway: 0.003 }),
    'yokai-rokurokubi': portrait({ breath: 0.006, period: 5, sway: 0.004, hair: 0.003, regions: { neck: { cx: 0.5, cy: 0.3, rx: 0.3, ry: 0.3, soft: 0.9 } }, extra: [{ regions: 'neck', ax: 0.003, ay: 0.002, speed: 0.4, freq: 0.8 }] }),
    'yokai-hitotsume-kozo': stander({ breath: 0.009, period: 2.3, sway: 0.005 }),
    karakuri: stander({ breath: 0.006, period: 1.6, sway: 0.004, chest: 0.5 }),
    nurarihyon: {
      regions: { head: { cx: 0.5, cy: 0.18, rx: 0.36, ry: 0.22, soft: 0.8 }, smoke: { ...R.crown, cx: 0.82, cy: 0.12, rx: 0.2 } },
      breathe: { amp: 0.007, period: 4.6, chest: 0.55, widen: 0.004 },
      sway: { amp: 0.003, period: 6.2, power: 2.2 },
      flutter: [
        { regions: 'smoke', ax: 0.004, ay: 0.003, speed: 0.5, freq: 1.4 },
        { regions: 'head', ax: 0.0015, ay: 0.001, speed: 0.25, freq: 0.6 },
      ],
      lean: 0.012,
      talk: 1,
    },
  },
  voices: {
    samurai: { src: 'pulse', base: 118, scale: [0, 2, 5], formant: 0.9, contour: 'fall', bend: 3, len: 0.06, every: 2, breath: 0.06, grit: 0.15, tts: { gender: 'male', age: 'young', pitch: 0.83, rate: 0.97 }, cry: 'armor' },
    lady: { src: 'soft', base: 275, scale: [0, 1, 5, 7, 8], formant: 1.28, contour: 'arch', bend: 3, len: 0.06, every: 2, vib: 15, vibRate: 5, breath: 0.1, tts: { gender: 'female', age: 'young', pitch: 1.14, rate: 0.97 }, cry: 'suzu' },
    karakuri: { src: 'nasal', base: 410, scale: [0, 2, 4], formant: 1.45, contour: 'flat', len: 0.035, every: 1, grit: 0.05, tts: { gender: 'female', age: 'child', pitch: 1.48, rate: 1.18 }, cry: 'rattle', cryPitch: 1.3 },
    nurarihyon: { src: 'saw', base: 104, scale: [0, 1, 5, 7, 8], formant: 0.88, contour: 'wobble', bend: 3, len: 0.09, every: 3, vib: 35, vibRate: 4.5, breath: 0.3, grit: 0.2, tts: { gender: 'male', age: 'elder', pitch: 0.58, rate: 0.8 }, cry: 'elder', cryPitch: 0.8 },
  },
}

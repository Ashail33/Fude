/**
 * Illustrated art for the people of the side areas and the Games tab's
 * keepers, who otherwise borrow a generic villager's portrait; the arrival
 * paintings for the side areas (played the first time you walk in); and two
 * story paintings: Master Sumi's memory of Kotone, and the valley reborn.
 */
import { portrait } from '../../anim/profileKit'
import type { Profile } from '../../anim/deform'
import { CAST, CUTOUT, type HdAsset } from './cast'

const person = (id: string, name: string, usage: string, who: string, key: '#00ff00' | '#ff00ff' = '#00ff00'): HdAsset => ({
  id,
  category: 'portraits',
  name,
  usage,
  w: 1024,
  h: 1024,
  cutout: { key },
  priority: 2,
  prompt: `Character portrait, waist-up, three-quarter view, of ${who} ${CUTOUT(key)}`,
})

const arrive = (map: string, name: string, scene: string): HdAsset => ({
  id: `arrive-${map}`,
  category: 'scenes',
  name: `Arriving: ${name}`,
  usage: 'First visit to a side area',
  w: 1920,
  h: 1080,
  priority: 2,
  prompt: `${scene} In the foreground, small in frame and seen from behind, ${CAST.mage} with ${CAST.fude} floating at their shoulder.`,
})

export const PEOPLE_ASSETS: HdAsset[] = [
  // ── The Games tab's keepers ────────────────────────────────────────
  person('p-sumi', 'Master Sumi', 'The Ink Dojo’s keeper (bamboo grove)', 'Master Sumi, a retired ink-swordsman in his seventies: long white hair tied back, a neat white beard, calm narrow eyes with laugh lines, a faded charcoal-grey kimono and black hakama with ink stains on the sleeves, a worn katana at his hip and a calligraphy brush tucked in his sash, holding a rolled practice scroll, a dignified, gently amused expression'),
  person('p-tane', 'Granny Tane', 'The Empty Valley’s keeper (Windmill Hill)', 'Granny Tane, a tiny kind old farmer woman in her eighties: white hair in a small bun with a wooden pin, a bent back, a faded brown work kimono with a dark-blue apron, a straw hat hanging on her back, holding a folded old paper deed to her chest, warm wrinkled smile with misty eyes', '#ff00ff'),
  person('p-hayato', 'Hayato the Ninja', 'Bamboo Bridge’s keeper (Mushroom Hollow)', 'Hayato, an eager boy of about ten training to be a ninja: spiky black hair, a too-big dark-blue ninja outfit with the sleeves rolled up, a red scarf, a wooden practice kunai and a bamboo pole over his shoulder, a bandage on his cheek, a big determined grin'),
  // ── Side-area folk ─────────────────────────────────────────────────
  person('p-soyo', 'Soyo of the Windmill', 'Windmill Hill', 'Soyo, a cheerful young windmill keeper woman: short brown hair blown by the wind, a green headscarf, flour on her cheek, a sky-blue work kimono with sleeves tied back, holding a sack of wheat', '#ff00ff'),
  person('p-ringo', 'Old Man Ringo', 'Windmill Hill orchard', 'Old Man Ringo, a round, jolly old apple farmer: bald head with white side tufts, rosy cheeks, a brown haori over a work kimono, holding a basket of shiny red apples'),
  person('p-yomogi', 'Yomogi the Herbalist', 'Mushroom Hollow', 'Yomogi, a calm middle-aged herbalist woman: dark hair in a loose braid with a sprig of mugwort, a moss-green kimono, a satchel of herbs and little paper packets, a small wooden mortar in her hands', '#ff00ff'),
  person('p-angler', 'The Old Angler', 'Misty Lake', 'an old angler: a wide straw hat, a grey stubbly beard, a patched indigo jacket, a long bamboo fishing rod over his shoulder and a wicker fish basket, patient sleepy eyes', '#ff00ff'),
  person('p-sen', 'Sen the Tea Master', 'Moss Garden Teahouse', 'Sen, a serene elderly tea master: shaved head, a plain dark-brown kimono and haori, holding a black raku tea bowl with both hands, a bamboo whisk at his side, a tranquil smile'),
  person('p-gardener', 'The Royal Gardener', 'Castle Garden (the Tower)', 'the royal gardener: a sturdy middle-aged man with a short beard, a straw hat, a dark-green work coat with a gold castle crest, pruning shears in one hand and a wilted rose in the other, worried kind eyes', '#ff00ff'),
  person('p-suzu', 'Suzu the Lady-in-Waiting', 'Castle Garden (the Tower)', 'Suzu, a young lady-in-waiting at the castle: long black hair tied low with a white ribbon, a layered lavender and white court kimono, holding a folded fan, a shy polite bow'),
  person('p-quartermaster', 'The Quartermaster', 'The Armoury (the Tower)', 'the castle quartermaster: a burly veteran soldier with a scarred eyebrow and a thick moustache, dark lacquered armour without a helmet, a ledger under one arm and a ring of keys at his belt, gruff but fair', '#ff00ff'),
  person('p-starreader', 'The Star-Reader', 'The Star Library (the Tower)', 'the Star-Reader, an old woman astronomer: silver hair in a high bun stuck with brass star-pins, a midnight-blue robe sprinkled with silver constellations, half-moon spectacles, a brass astrolabe in her hands', '#ff00ff'),
  person('p-cutter', 'The Old Bamboo Cutter', 'Whispering Bamboo Grove', 'the old bamboo cutter from the tale of Kaguya-hime: a thin, kind old man with a long white beard, a straw raincoat over a plain kimono, a hatchet in his belt, cradling a tall stalk of glowing bamboo, a wistful smile', '#ff00ff'),
  person('p-gen', 'Gen the Miller', 'Riverside Terraces', 'Gen the miller: a broad-shouldered man in his forties dusted with rice flour, a white headband, sleeves tied back, a heavy sack of rice on one shoulder, a hearty laugh'),
  person('p-onigiri', 'Onigiri Granny', 'Riverside Terraces', 'Onigiri Granny, a plump smiling old woman: grey hair under a white kerchief, a red-checked apron over a brown kimono, holding a bamboo-leaf tray of rice balls'),
  person('p-miyo', 'Miyo the Rice Planter', 'Riverside Terraces', 'Miyo, a young rice planter: a wide straw sedge hat tied under her chin, a red-and-white tasuki cord holding back the sleeves of a blue kimono tucked up for the paddies, a bundle of green rice seedlings in her hands, mud on her cheek', '#ff00ff'),
  // ── Arrivals in the side areas ─────────────────────────────────────
  arrive('village-bamboo', 'the Whispering Bamboo Grove', 'A towering bamboo grove at dawn: a narrow earth path winds between stalks that sway and whisper, green light slanting through, a tiny forgotten fox shrine with a red bib on a stone fox, an old thatched hut with a practice scroll hung by its door where ink figures seem to move, a wind chime catching the light.'),
  arrive('village-terraces', 'the Riverside Terraces', 'Stepped rice terraces full of water mirroring the sky, a wooden bridge over a bright river, a stalled waterwheel beside a mill hut, farmers in straw hats planting seedlings, a white heron standing in the shallows.'),
  arrive('fields-hill', 'Windmill Hill', 'A grassy hill above golden fields: an apple orchard climbing to a wooden windmill with cloth sails on the clifftop, beehives among wildflowers, a child flying a kite, a big cloud-watching rock, wide blue sky.'),
  arrive('forest-hollow', 'Mushroom Hollow', 'A hidden hollow deep in an old forest: a gigantic hollow tree, glowing mushrooms of every size, a slow river crossed by a little plank bridge, mossy stones, fireflies, a sleeping tanuki curled at the roots.'),
  arrive('forest-lake', 'Misty Lake', 'A misty lake at morning: a wooden pier with a moored rowing boat, a fishing hut with nets drying, a bronze mist bell on a post, pale mist drifting over still water, a child skipping stones.'),
  arrive('shrine-torii', 'the Path of a Thousand Torii', 'An endless tunnel of vermilion torii gates winding up a mountainside in late afternoon light, stone fox statues with red bibs, small lanterns, glimpses of a sacred inner sanctuary at the top.'),
  arrive('shrine-garden', 'the Moss Garden Teahouse', 'A quiet moss garden: raked white sand in wave patterns around rocks, a koi pond with a stone bridge, a small wooden teahouse with its paper doors open, a steaming kettle, maple leaves turning red.'),
  arrive('tower-garden', 'the Castle Garden', 'A royal castle garden at the foot of a towering spire: clipped hedges, a koi moat with an arched bridge, a moon-viewing pavilion with lanterns, a statue of an ancient hero, a single wilted rose bush in the centre.'),
  // ── Story paintings ────────────────────────────────────────────────
  {
    id: 'sumi-kotone',
    category: 'scenes',
    name: 'Memory: Sumi and Kotone',
    usage: 'Master Sumi’s story, after the last ink echo',
    w: 1920,
    h: 1080,
    priority: 1,
    prompt: `Sepia-tinted memory: a bamboo grove long ago; a young Sumi, a lean swordsman in his twenties with black hair tied back, spars with a wooden practice sword against ${CAST.scribe}, who parries with her big brush, laughing, a trail of glowing ink characters arcing from its tip; ${CAST.fude} bobs between them; bamboo leaves swirl.`,
  },
  {
    id: 'valley-home',
    category: 'scenes',
    name: 'The valley reborn',
    usage: 'The Empty Valley’s ending',
    w: 1920,
    h: 1080,
    priority: 1,
    prompt: `A hidden mountain valley village alive again at golden hour: rice paddies, a manor with lights in its windows, a teahouse with a red parasol and travellers resting, villagers waving and laughing in the street, children running, smoke curling from chimneys, cherry petals in the air; Granny Tane, a tiny old woman with a cane, watches from the hill path with tears of joy beside ${CAST.mage} and ${CAST.fude}.`,
  },
]

/** Entities who now have their own portrait. */
export const PEOPLE_ENTITY_HD: Record<string, string> = {
  'vb-sumi': 'p-sumi',
  'fh-tane': 'p-tane',
  'fo-hayato': 'p-hayato',
  'fh-keeper': 'p-soyo',
  'fh-orchard': 'p-ringo',
  'foh-herbalist': 'p-yomogi',
  'fol-angler': 'p-angler',
  'sg-teamaster': 'p-sen',
  'tg-gardener': 'p-gardener',
  'tg-lady': 'p-suzu',
  'ta-quartermaster': 'p-quartermaster',
  'tl-astronomer': 'p-starreader',
  'vb-cutter': 'p-cutter',
  'vt-miller': 'p-gen',
  'vt-granny': 'p-onigiri',
  'vt-planter': 'p-miyo',
}

/** Gentle idle motion for each new portrait (talking people, a little breathing and sway). */
export const PEOPLE_PROFILES: Record<string, Profile> = Object.fromEntries(
  PEOPLE_ASSETS.filter((a) => a.category === 'portraits').map((a) => [a.id, portrait({ breath: 0.007, period: 3.6 + (a.id.length % 5) * 0.3, sway: 0.003, hair: 0.003, talk: 1.1 })]),
)

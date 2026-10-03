/**
 * Painted art for the Games tab: Stick Ninja's five worlds, its hero and
 * bosses; the Bamboo Bridge sky; the Hidden Village's buildings and valley.
 * Each game draws its own art when these are missing, so they can arrive
 * one at a time like the rest of the HD art.
 *
 * Stick Ninja uses an ink-wash style of its own (`NINJA_STYLE`) to suit its
 * brush-stroke fighters; the village uses the game's shared STYLE.
 */
import { CUTOUT, STYLE, type HdAsset } from '../art/hd/cast'

export const NINJA_STYLE =
  'Style: atmospheric Japanese sumi-e ink wash painting blended with rich modern digital matte painting, layered misty depth, strong graphic silhouettes, a limited palette with one bold accent colour, visible brush texture and ink splatter, cinematic. No text, no letters, no watermark, no logo, no border.'

/** The same look for cut-out figures, minus the mist and splatter that would spoil the cut-out. */
const NINJA_FIGURE_STYLE =
  'Style: dramatic Japanese sumi-e ink painting blended with rich modern digital illustration, bold confident brush strokes, strong graphic silhouette, a limited palette with one bold accent colour, cinematic rim light. No text, no letters, no watermark, no logo, no border.'

const STAGE = 'Wide side-on panorama background for a 2D side-scrolling sword-fighting game, flat eye-level horizon, no characters, no people. The bottom fifth of the image is a plain, flat, empty strip of ground; keep the middle band uncluttered so fighters can be drawn on top.'

const bg = (id: string, name: string, scene: string): HdAsset => ({
  id,
  category: 'backdrops',
  name,
  usage: 'Stick Ninja stage background',
  w: 1920,
  h: 1080,
  priority: 1,
  prompt: `${STAGE} ${scene} ${NINJA_STYLE}`,
})

const ink = (id: string, name: string, who: string, key: '#00ff00' | '#ff00ff' = '#ff00ff'): HdAsset => ({
  id,
  category: 'arcade',
  name,
  usage: 'Stick Ninja dojo cards, boss entrance and results',
  w: 1024,
  h: 1024,
  cutout: { key },
  priority: 1,
  prompt: `Dramatic dynamic full-figure character art of ${who}. ${CUTOUT(key)} ${NINJA_FIGURE_STYLE}`,
})

const building = (id: string, what: string): HdAsset => ({
  id: `hm-${id}`,
  category: 'arcade',
  name: `Hidden Village: ${id}`,
  usage: 'Hidden Village plot art',
  w: 1024,
  h: 1024,
  cutout: { key: '#ff00ff' },
  priority: 2,
  prompt: `Cozy game building asset in a three-quarter top-down isometric view: ${what}, standing on its own small square patch of green grass with a few stones and flowers, the whole tile shown, centered. ${CUTOUT('#ff00ff')} ${STYLE}`,
})

export const ARCADE_ASSETS: HdAsset[] = [
  // ── Stick Ninja: worlds ────────────────────────────────────────────
  bg('nj-bg-0', 'Bamboo Grove', 'A towering bamboo forest at misty dawn: tall jade-green stalks fading into white fog in layers, shafts of golden light slanting through, fallen leaves drifting, faint distant mountains; the ground strip is a packed earth forest path. Accent colour: fresh jade green.'),
  bg('nj-bg-1', 'Oni Island', 'A volcanic island at blood-red dusk: giant vermilion torii gates half sunk in a dark sea, jagged black rocks and a cliff shaped like a horned oni skull, smoke and drifting embers, a huge low red sun; the ground strip is dark volcanic sand. Accent colour: crimson.'),
  bg('nj-bg-2', 'Tengu Peaks', 'High mountain peaks above a sea of clouds on a bright cold morning: wind-bent pines clinging to cliffs, a small temple on a far crag with prayer streamers, birds wheeling, crisp blue sky; the ground strip is a grey stone ledge. Accent colour: sky blue.'),
  bg('nj-bg-3', 'Shadow Castle', 'Night at a vast black Japanese castle keep under an enormous pale moon: purple mist rolling over the moat, a few glowing paper lanterns, cherry petals drifting, bats against the moon; the ground strip is a dark stone courtyard. Accent colour: violet.'),
  bg('nj-bg-4', 'Dragon Palace', 'A palace of red lacquer and gold on a mountain lit by rivers of lava, a sky full of embers and smoke, a colossal golden dragon coiled around a distant pagoda, banners streaming in hot wind; the ground strip is cracked palace flagstones. Accent colour: molten orange-gold.'),
  bg('nj-bg-5', 'Kappa River', 'A wide slow river at a green rainy dusk: weeping willows trailing into the water, lotus pads and pale lotus flowers, a broken wooden waterwheel and a tilted red bridge, cucumber vines on a fisherman’s hut, soft rain rings on the water, fireflies; the ground strip is a wet pebbled riverbank. Accent colour: lotus teal.'),
  bg('nj-bg-6', 'Haunted Temple', 'A ruined mountain temple at midnight: a sagging tiled roof, torn paper doors glowing ghost-blue from inside, rows of mossy stone lanterns with blue will-o’-the-wisp flames, a dead twisted pine, a skeleton-white crescent moon, drifting grave mist; the ground strip is cracked temple flagstones. Accent colour: ghostly cyan.'),
  bg('nj-bg-7', 'Frozen Pass', 'A high mountain pass in a blizzard at blue twilight: snow-buried torii and stone markers, frozen waterfalls hanging like glass, ice-crusted pines leaning in the wind, a lone shrine with a warm lantern far up the slope, swirling snow; the ground strip is packed snow over stone. Accent colour: icy white-blue.'),
  bg('nj-bg-8', 'Storm Clouds', 'A battlefield on top of the clouds during a thunderstorm: towering storm-cloud castles, a ring of giant taiko drums floating in the sky, forked lightning, golden light breaking through gaps, wind-torn banners; the ground strip is a flat bank of dense grey-white cloud. Accent colour: electric gold.'),
  bg('nj-bg-9', 'Void Gate', 'The edge of the world where words are lost: a colossal black ink torii gate standing over an empty pale void, the landscape dissolving into drifting brush strokes and floating fragments of written characters, ink rain falling upward, a faint violet dawn behind; the ground strip is cracked white paper stained with ink. Accent colour: deep violet.'),
  // ── Stick Ninja: cast ──────────────────────────────────────────────
  ink('nj-hero', 'The Stick Ninja', 'a lone young ninja in a dark indigo-black outfit with a long red headband streaming in the wind, mid-leap with a gleaming katana drawn, fearless eyes', '#00ff00'),
  ink('nj-ronin', 'Kaito the Ronin', 'Kaito, a lean wandering ronin swordsman in a battered grey kimono and a wide straw sugegasa hat that hides his eyes, katana half drawn from its scabbard in a fast-draw stance, cherry petals swirling'),
  ink('nj-oni', 'Gōki the Oni', 'Gōki, a gigantic red-skinned oni demon with two curved horns, wild black mane, tusks and burning yellow eyes, tiger-skin loincloth, swinging a huge iron studded kanabō club, ground cracking under him', '#00ff00'),
  ink('nj-tengu', 'Hayate the Tengu Lord', 'Hayate, a tengu lord with a crimson long-nosed face, great black feathered wings spread wide, a yamabushi mountain-priest robe and pom-pom sash, a feathered fan raised to call a gale'),
  ink('nj-kage', 'Kage, Master of Shadows', 'Kage, a masked shadow ninja master wrapped in black and deep violet, glowing white eyes, dissolving at the edges into purple smoke and three shadow clones, a short blade reversed in each hand', '#00ff00'),
  ink('nj-shogun', 'The Dragon Shōgun', 'the Dragon Shōgun, a towering warlord in ornate black-and-gold samurai armour with a golden dragon helmet crest and demon face mask, a great flaming nodachi sword, a spirit dragon of fire coiling behind him', '#00ff00'),
  ink('nj-kappa', 'Gatarō the Kappa King', 'Gatarō, a huge muscular kappa king, green scaly skin, a turtle shell on his back, a water-filled dish on his head ringed by a crown of reeds, webbed hands gripping a barnacled anchor like a club, water splashing around him'),
  ink('nj-gasha', 'The Gashadokuro', 'a towering gashadokuro, a giant skeleton made of countless bones wrapped in tattered funeral robes, ghost-blue fire burning in its eye sockets, reaching forward with a huge bony hand, will-o’-the-wisps circling it', '#00ff00'),
  ink('nj-frost', 'Fubuki the Frost Samurai', 'Fubuki, a samurai in pale blue lacquered armour rimed with frost, a long white scarf streaming, a demon face mask breathing cold mist, an icicle-blue katana trailing snowflakes'),
  ink('nj-storm', 'Ikazuchi the Storm Lord', 'Ikazuchi, a thunder demon lord with wild golden hair standing on end, a ring of taiko drums floating behind him crackling with lightning, a tiger-skin kilt, two drumsticks sparking with electricity, riding a dark storm cloud', '#00ff00'),
  ink('nj-quiet', 'The Quiet', 'the Quiet, a tall faceless figure made entirely of flowing black ink and silence, a hooded silhouette edged with violet light, fragments of written characters peeling off it and dissolving, one long brush-stroke blade in its hand', '#00ff00'),
  // ── Bamboo Bridge ──────────────────────────────────────────────────
  {
    id: 'bridge-bg',
    category: 'backdrops',
    name: 'Bamboo Bridge sky',
    usage: 'Bamboo Bridge background',
    w: 1080,
    h: 1080,
    priority: 2,
    prompt: `Square game background: Mount Fuji at sunset seen across a misty valley, a peach-and-violet sky with a pale full moon and a few streaks of cloud, distant pagoda silhouettes on far ridges; the bottom third fades into soft dark violet mist with nothing in it (stone pillars will be drawn there). No characters. ${NINJA_STYLE}`,
  },
  // ── Hidden Village ─────────────────────────────────────────────────
  {
    id: 'hamlet-bg',
    category: 'backdrops',
    name: 'The hidden valley',
    usage: 'Hidden Village header',
    w: 1920,
    h: 1080,
    priority: 2,
    prompt: `A hidden mountain valley village seen from above at golden hour: terraced rice paddies, a winding stream, a few thatched and tiled Edo-era houses, a small manor, a stone wall and torii gate, cherry trees and pine-covered ridges all around, smoke curling from chimneys. ${STYLE}`,
  },
  building('manor', 'a small two-storey Edo-era Japanese manor house with white plaster walls, dark timber and a curved grey-tiled roof with gold ridge ends, a little garden gate'),
  building('lumber', 'a woodcutter’s hut with a thatched roof, stacked logs, a chopping block with an axe stuck in it, sawdust'),
  building('quarry', 'a small stone quarry cut into a grey rock outcrop with a wooden crane, pickaxes, a cart of cut stone blocks'),
  building('paddy', 'a flooded rice paddy with neat rows of green rice shoots, a little earthen bank, a straw scarecrow and a wooden water wheel'),
  building('storehouse', 'a Japanese kura storehouse with thick white plaster walls, a black-tiled roof, a heavy iron-studded door, rice bales and crates stacked outside'),
  building('dojo', 'a wooden martial-arts dojo hall with a sweeping tiled roof, open sliding doors showing a polished floor, a rack of wooden practice swords and a straw training dummy'),
  building('forge', 'a blacksmith’s forge with a stone chimney glowing orange, an anvil, a water trough, katana blades cooling on a rack, sparks'),
  building('shrine', 'a small Shinto shrine with a vermilion torii gate, a little wooden honden with a copper roof, two stone fox statues and a paper-lantern'),
  building('apothecary', 'an apothecary herb shop with a green noren curtain, hanging bundles of drying herbs, jars and a small herb garden'),
  building('teahouse', 'a charming teahouse with a red parasol, a bench covered in red cloth, paper lanterns, steam rising from a tea kettle'),
  building('wall', 'a section of fortified ishigaki stone wall with a small wooden watch tower and a banner'),
  building('site', 'a construction site: a wooden scaffold frame of a new building, piles of planks and stones, a ladder, tools and a carpenter’s sawhorse'),
]

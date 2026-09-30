/**
 * High-resolution illustrated art (generated in Higgsfield). Every entry
 * lists where the image is used, its target size and the prompt to
 * generate it. Until an image exists in public/art/hd/, the game falls
 * back to the original pixel art, so assets can arrive one at a time.
 *
 * Workflow: drop raw downloads into art-src/<category>/<id>.(png|jpg|webp),
 * run `npm run art:process`, commit public/art/hd/. The processor removes
 * the flat key-colour background from cut-out art and converts to WebP.
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

const CUTOUT = (key: '#00ff00' | '#ff00ff') =>
  `Full body, centered, generous empty margin on all sides, isolated on a perfectly flat solid pure ${key === '#00ff00' ? 'green (#00FF00)' : 'magenta (#FF00FF)'} background, no ground, no cast shadow, no scenery.`

/** The recurring cast, described once so every image keeps them on-model. */
export const CAST = {
  mage: 'a young apprentice mage (age about 16, friendly, gender-neutral) with short brown hair and bright eyes, wearing a tall pointed indigo wizard hat with a gold band and a tiny gold star, an indigo robe with gold trim and a sash, holding a wooden staff topped with a glowing golden orb',
  fude: 'Fude, a tiny floating calligraphy-brush spirit mascot: a plump round white body shaped like a soft brush tip, big shiny black eyes, rosy cheeks, a red-lacquered brush handle with a gold band on top like a little hat, and a swirling black ink-drop tail; cute, expressive, glowing faintly',
}

export const HD_ASSETS: HdAsset[] = [
  // ── Title ──────────────────────────────────────────────────────────
  { id: 'title-wide', category: 'title', name: 'Title key art (wide)', usage: 'Title screen background on desktop', w: 1920, h: 1080, priority: 1, prompt: `Key art for a Japanese fantasy RPG about the magic of words. Night on a grassy hill above a sleeping village with glowing paper lanterns, a huge full moon, a sky of stars where glowing hiragana-like brush strokes drift like fireflies. In the foreground, seen from behind and slightly to the side, ${CAST.mage}, looking up at the sky, with ${CAST.fude} floating beside them. Sakura petals drift on the wind. Leave the upper-middle third of the image calm and uncluttered for a logo.` },
  { id: 'title-tall', category: 'title', name: 'Title key art (tall)', usage: 'Title screen background on phones', w: 1080, h: 1920, priority: 1, prompt: `Vertical key art, same scene as the wide version: night hill above a lantern-lit village, full moon, glowing brush strokes drifting in the starry sky, ${CAST.mage} seen from behind looking up, ${CAST.fude} floating beside them, sakura petals. Keep the top third calm for a logo and the bottom quarter simple for menu buttons.` },

  // ── Portraits (dialogue & cutscenes) ───────────────────────────────
  { id: 'fude', category: 'portraits', name: 'Fude (companion)', usage: 'Dialogue portrait, cutscenes, hints', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 1, prompt: `Character portrait of ${CAST.fude}, cheerful expression, small sparkles of ink around it. ${CUTOUT('#ff00ff')}` },
  { id: 'mage', category: 'portraits', name: 'The player mage', usage: 'Player portrait in dialogue, status, battle', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 1, prompt: `Character portrait, waist-up, three-quarter view, of ${CAST.mage}, determined hopeful smile. ${CUTOUT('#ff00ff')}` },
  { id: 'elder', category: 'portraits', name: 'Village Elder', usage: 'Word lessons in the village', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Character portrait, waist-up, of a kind wise village elder: an old man with a long white beard and bushy eyebrows, round spectacles, brown haori over a grey kimono, leaning on a gnarled wooden cane, warm smile. ${CUTOUT('#00ff00')}` },
  { id: 'merchant', category: 'portraits', name: 'Mina the Spell Merchant', usage: 'Spell shop (ください dialogue)', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Character portrait, waist-up, of Mina, a cheerful young woman shopkeeper who sells magic spells: pink hachimaki headband, sleeves tied back with a tasuki cord, an apron over a sakura-patterned kimono, holding a rolled spell scroll and a wooden abacus, winking. ${CUTOUT('#00ff00')}` },
  { id: 'guard', category: 'portraits', name: 'Goro the Bridge Guard', usage: 'Bridge guard dialogue puzzle', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 2, prompt: `Character portrait, waist-up, of Goro, a burly bridge guard with a big moustache, lacquered blue lamellar armor, a flat jingasa hat, holding a long spear upright, stern face but kind eyes. ${CUTOUT('#ff00ff')}` },
  { id: 'priest', category: 'portraits', name: 'Shrine Priest', usage: 'Shrine priest dialogue, cutscenes', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Character portrait, waist-up, of a calm Shinto shrine priest (kannushi): white and pale-lavender robes, tall black eboshi hat, holding a gohei wand with white paper streamers, serene expression. ${CUTOUT('#00ff00')}` },
  { id: 'king', category: 'portraits', name: 'The King', usage: 'Throne room politeness challenge', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 2, prompt: `Character portrait, waist-up, of a proud fantasy Japanese king: golden crown with jade ornaments, crimson cape with white fur trim, layered royal robes in gold and deep red, raised eyebrow, haughty but fair. ${CUTOUT('#00ff00')}` },
  { id: 'child', category: 'portraits', name: 'Village kid', usage: 'Village cutscenes and NPC chatter', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 3, prompt: `Character portrait, waist-up, of an energetic village kid (about 8) in a short green-and-white checked kimono with a bandage on the nose, grinning and pointing excitedly. ${CUTOUT('#ff00ff')}` },
  { id: 'farmer', category: 'portraits', name: 'Farmer', usage: 'Fields cutscenes and NPCs', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 3, prompt: `Character portrait, waist-up, of a friendly rice farmer with a wide straw hat, rolled-up sleeves, a towel around the neck, holding a bundle of golden rice, sunburnt cheerful face. ${CUTOUT('#ff00ff')}` },
  { id: 'innkeeper', category: 'portraits', name: 'Innkeeper', usage: 'Inns (rest after a lost battle)', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 3, prompt: `Character portrait, waist-up, of a warm middle-aged innkeeper woman in an indigo kimono and white apron, hair in a neat bun with a comb, holding a tray with a teapot, welcoming smile. ${CUTOUT('#00ff00')}` },
  { id: 'jailer', category: 'portraits', name: 'Jailer', usage: 'Tower dungeon apology scene', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 3, prompt: `Character portrait, waist-up, of a grumpy but comical tower jailer: bald, big iron key ring on a belt, dark grey uniform with red cord, arms crossed, one eyebrow raised. ${CUTOUT('#00ff00')}` },

  // ── Bosses ─────────────────────────────────────────────────────────
  { id: 'kana-oni', category: 'bosses', name: 'The Kana Oni', usage: 'Region 1 boss battle and cutscenes', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 1, prompt: `A menacing but slightly comical red oni demon, muscular, with two horns, wild white hair, a tiger-skin loincloth, and an iron kanabō club; its skin is covered in glowing golden hiragana-like brush-stroke tattoos that seem jumbled and scrambled; fierce grin with fangs, dynamic threatening pose. ${CUTOUT('#00ff00')}` },
  { id: 'radical-golem', category: 'bosses', name: 'The Radical Golem', usage: 'Region 2 boss battle', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 1, prompt: `A towering stone golem assembled from carved stone blocks, each block engraved with a glowing kanji radical symbol (fire, water, tree, mouth, person strokes as abstract glyphs, not readable text), moss and small flowers growing in the cracks, glowing amber eyes, heavy fists. ${CUTOUT('#ff00ff')}` },
  { id: 'particle-guardian', category: 'bosses', name: 'The Particle Guardian', usage: 'Region 3 boss battle', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 1, prompt: `An ancient forest guardian spirit: a giant tree-like being with a face in its bark, antler-like branches, glowing jade eyes, surrounded by three floating circular shields of light, each shield marked with a single glowing abstract brush glyph; roots coiling like legs, fireflies around it. ${CUTOUT('#ff00ff')}` },
  { id: 'silent-librarian', category: 'bosses', name: 'The Silent Librarian', usage: 'Region 4 boss battle', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 1, prompt: `An eerie, elegant ghost librarian: a pale translucent woman in flowing white and indigo robes that fade into blue spirit flame at the hem, long black hair, eyes closed, a finger to her lips asking for silence, surrounded by floating open books and paper talismans orbiting her. ${CUTOUT('#00ff00')}` },
  { id: 'shifting-chimera', category: 'bosses', name: 'The Shifting Chimera', usage: 'Region 5 boss battle (adjective forms)', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 1, prompt: `A majestic nine-tailed kitsune chimera, fox body with a mane, each tail made of a different element (flame, ice crystals, swirling wind, lightning, water, glowing light, earth stones, leaves, shadow), shimmering fur shifting colors, fierce clever eyes, poised to pounce. ${CUTOUT('#00ff00')}` },
  { id: 'void-dragon', category: 'bosses', name: 'The Void Dragon', usage: 'Final boss battle and ending', w: 1920, h: 1080, cutout: { key: '#00ff00' }, priority: 1, prompt: `An enormous serpentine eastern dragon made of darkness and swirling ink, coiling through space, with deep violet and crimson scales, glowing golden eyes, long whiskers, pale mane, jagged fins; torn fragments of glowing brush-stroke glyphs are being sucked into its open mouth; epic, awe-inspiring. Whole dragon visible. ${CUTOUT('#00ff00')}` },

  // ── Regular enemies ────────────────────────────────────────────────
  { id: 'slime', category: 'enemies', name: 'Slime', usage: 'Village random battles', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 3, prompt: `A cute blue water-drop slime monster with a glossy jelly body, big eyes and a cheeky grin. ${CUTOUT('#ff00ff')}` },
  { id: 'ice-slime', category: 'enemies', name: 'Ice slime', usage: 'Fields random battles', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 3, prompt: `A cute pale-cyan ice slime monster with frost crystals on top, shivering, breath misting. ${CUTOUT('#ff00ff')}` },
  { id: 'imp', category: 'enemies', name: 'Fire imp', usage: 'Village random battles', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 3, prompt: `A small mischievous purple fire imp with bat wings, little horns, a flaming tail tip and a toothy grin, hovering. ${CUTOUT('#00ff00')}` },
  { id: 'bat', category: 'enemies', name: 'Bat', usage: 'Village random battles', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 3, prompt: `A round fluffy dark-blue cave bat monster with huge ears, wings spread, sleepy but grumpy eyes. ${CUTOUT('#00ff00')}` },
  { id: 'mushroom', category: 'enemies', name: 'Mushroom', usage: 'Village random battles', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 3, prompt: `A walking red-capped mushroom monster with white spots, tiny legs and an annoyed face, releasing a puff of spores. ${CUTOUT('#00ff00')}` },
  { id: 'kappa', category: 'enemies', name: 'Kappa', usage: 'Fields random battles', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 3, prompt: `A kappa river yokai: green turtle-like creature with a shell, a beak, and a water-filled dish on its head, holding a cucumber, playful fighting stance. ${CUTOUT('#ff00ff')}` },
  { id: 'tanuki', category: 'enemies', name: 'Tanuki', usage: 'Fields random battles', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 3, prompt: `A shapeshifting tanuki yokai standing upright with a leaf on its head, straw hat on its back and a sake bottle, round belly, sly grin, puff of transformation smoke. ${CUTOUT('#00ff00')}` },
  { id: 'golem', category: 'enemies', name: 'Stone golem', usage: 'Fields random battles', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 3, prompt: `A small mossy stone golem made of rounded river stones, glowing blue eyes, stubby arms, sturdy stance. ${CUTOUT('#ff00ff')}` },
  { id: 'wisp', category: 'enemies', name: 'Will-o-wisp', usage: 'Forest and shrine random battles', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 3, prompt: `A hitodama spirit wisp: a floating ball of blue-white ghost fire with a curling tail and small hollow eyes, eerie glow. ${CUTOUT('#00ff00')}` },
  { id: 'kitsune', category: 'enemies', name: 'Kitsune', usage: 'Forest random battles', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 3, prompt: `A white fox spirit (kitsune) with three tails tipped in blue foxfire, red markings on its face, elegant and sly. ${CUTOUT('#00ff00')}` },
  { id: 'harpy', category: 'enemies', name: 'Storm harpy', usage: 'Forest and tower random battles', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 3, prompt: `A storm harpy: a bird-woman with grey-blue storm-cloud feathered wings, talons, crackling small lightning around her, fierce. ${CUTOUT('#00ff00')}` },
  { id: 'treant', category: 'enemies', name: 'Treant', usage: 'Forest random battles', w: 1024, h: 1024, cutout: { key: '#ff00ff' }, priority: 3, prompt: `A grumpy young tree spirit (treant) with a bark face, leafy crown, root feet and branch arms, holding a pinecone. ${CUTOUT('#ff00ff')}` },
  { id: 'tengu', category: 'enemies', name: 'Tengu', usage: 'Shrine and tower random battles', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 3, prompt: `A tengu mountain spirit: red face with a very long nose, black crow wings, yamabushi monk clothes with pom-pom sash, a feather fan raised, proud. ${CUTOUT('#00ff00')}` },
  { id: 'oni', category: 'enemies', name: 'Oni', usage: 'Shrine and tower random battles', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 3, prompt: `A blue oni brute with one horn, tiger-striped loincloth, spiked iron club over its shoulder, big grin. ${CUTOUT('#00ff00')}` },
  { id: 'skeleton', category: 'enemies', name: 'Skeleton samurai', usage: 'Shrine and tower random battles', w: 1024, h: 1024, cutout: { key: '#00ff00' }, priority: 3, prompt: `A skeleton samurai in battered red lacquer armor and a horned kabuto helmet, katana drawn, faint blue ghost-fire in its eye sockets. ${CUTOUT('#00ff00')}` },

  // ── Battle backdrops ───────────────────────────────────────────────
  { id: 'battle-village', category: 'backdrops', name: 'Village meadow', usage: 'Battle background, region 1', w: 1920, h: 1080, priority: 1, prompt: 'Wide landscape battle background: a sunny meadow just outside a Japanese village, thatched and tiled roofs in the distance, cherry trees in bloom, a stone lantern, soft clouds. The center and lower-middle of the image are open flat grass (monsters will stand there). Eye-level camera, horizon slightly above the middle.' },
  { id: 'battle-fields', category: 'backdrops', name: 'Golden fields', usage: 'Battle background, region 2', w: 1920, h: 1080, priority: 1, prompt: 'Wide landscape battle background: golden rice terraces and fields at late afternoon, scarecrows, a distant mountain with a small shrine, dragonflies. The center and lower-middle are an open dirt path area. Eye-level camera, horizon slightly above the middle.' },
  { id: 'battle-forest', category: 'backdrops', name: 'Deep forest', usage: 'Battle background, region 3', w: 1920, h: 1080, priority: 1, prompt: 'Wide landscape battle background: a deep ancient cedar forest with shafts of light through mist, moss-covered roots, a small red bridge over a stream in the distance, fireflies. The center and lower-middle are an open mossy clearing. Eye-level camera.' },
  { id: 'battle-shrine', category: 'backdrops', name: 'Shrine courtyard at night', usage: 'Battle background, region 4', w: 1920, h: 1080, priority: 1, prompt: 'Wide landscape battle background: a mountain shrine courtyard at night, rows of glowing stone lanterns, a large vermilion torii gate, stone path, paper talismans on ropes, moonlight and blue mist. The center and lower-middle are open stone paving. Eye-level camera.' },
  { id: 'battle-tower', category: 'backdrops', name: 'Tower interior', usage: 'Battle background, region 5', w: 1920, h: 1080, priority: 1, prompt: 'Wide landscape battle background: inside a mystical tower of creation, a grand hall with floating stone stairs, tall arched windows showing a starry purple sky, glowing magic circles on the floor, floating glyph lights. The center and lower-middle are open floor. Eye-level camera.' },
  { id: 'battle-summit', category: 'backdrops', name: 'Tower summit', usage: 'Final battle against the Void Dragon', w: 1920, h: 1080, priority: 1, prompt: 'Wide landscape battle background: the open summit of a tower above the clouds at twilight, a cracked stone platform with a huge glowing magic circle, a swirling black void vortex tearing open the sky, glowing glyph fragments being pulled into it, dramatic. The center and lower-middle are the open platform.' },

  // ── Cutscene stills ────────────────────────────────────────────────
  { id: 'intro-1', category: 'scenes', name: 'Intro: when words were alive', usage: 'Opening cutscene, frame 1', w: 1920, h: 1080, priority: 2, prompt: 'A peaceful Japanese countryside at dawn where words are alive: glowing golden brush-stroke glyphs float over rice fields, rivers and a village like fireflies and birds, people waving at them happily. Dreamy and warm.' },
  { id: 'intro-2', category: 'scenes', name: 'Intro: the Void Dragon', usage: 'Opening cutscene, frame 2', w: 1920, h: 1080, priority: 2, prompt: 'The same countryside at night under a stormy violet sky: a colossal serpentine eastern dragon made of darkness and ink swallows the glowing brush-stroke glyphs, which scatter across the land like falling stars; villagers look up in fear.' },
  { id: 'intro-3', category: 'scenes', name: 'Intro: Fude wakes you', usage: 'Opening cutscene, frame 3', w: 1920, h: 1080, priority: 2, prompt: `Morning on a grassy hill: ${CAST.mage} is waking up under a cherry tree, rubbing their eyes, while ${CAST.fude} floats excitedly in front of their face. Petals falling, a village visible below.` },
  { id: 'arrive-village', category: 'scenes', name: 'Arriving: the village', usage: 'Region 1 arrival cutscene', w: 1920, h: 1080, priority: 2, prompt: `A cozy Japanese village street with tiled roofs, noren curtains, lanterns, a well and cherry trees; villagers and a cat; seen from the entrance as ${CAST.mage} and ${CAST.fude} arrive.` },
  { id: 'arrive-fields', category: 'scenes', name: 'Arriving: the Elemental Fields', usage: 'Region 2 arrival cutscene', w: 1920, h: 1080, priority: 2, prompt: `Vast golden elemental fields: rice paddies reflecting the sky, a stream, a windmill-like water wheel, standing stones glowing with element symbols (fire, water, tree, earth, stone as abstract glyphs); ${CAST.mage} and ${CAST.fude} on the path, small in frame.` },
  { id: 'arrive-forest', category: 'scenes', name: 'Arriving: the Forest of Sentences', usage: 'Region 3 arrival cutscene', w: 1920, h: 1080, priority: 2, prompt: `An ancient forest whose trees have glowing brush-stroke glyphs growing like leaves and vines connecting them into long lines like sentences; light shafts; a red bridge guarded by a figure with a spear in the distance; ${CAST.mage} and ${CAST.fude} entering.` },
  { id: 'arrive-shrine', category: 'scenes', name: 'Arriving: the Shrine of Reading', usage: 'Region 4 arrival cutscene', w: 1920, h: 1080, priority: 2, prompt: `A mountaintop shrine at dusk: long stairs lined with vermilion torii gates, stone tablets covered in carved glyphs, lanterns lighting up, a library pavilion; ${CAST.mage} and ${CAST.fude} climbing the stairs.` },
  { id: 'arrive-tower', category: 'scenes', name: 'Arriving: the Tower of Creation', usage: 'Region 5 arrival cutscene', w: 1920, h: 1080, priority: 2, prompt: `A colossal spiraling tower of creation rising into a twilight sky full of floating glyphs, a dark vortex at its peak; a royal castle at its base; ${CAST.mage} and ${CAST.fude} look up at it from the approach road, awed.` },
  { id: 'ending', category: 'scenes', name: 'Ending: words return', usage: 'Final cutscene', w: 1920, h: 1080, priority: 2, prompt: `Triumphant sunrise over the whole land seen from the tower summit: countless glowing brush-stroke glyphs stream back across the sky into villages, forests and fields, bringing color back; ${CAST.mage} raises their staff while ${CAST.fude} cheers; villagers celebrate far below.` },
]

export const HD_BY_ID = new Map(HD_ASSETS.map((a) => [a.id, a]))

/** Public URL of the processed asset (WebP). */
export function hdUrl(id: string): string {
  const a = HD_BY_ID.get(id)
  return `${import.meta.env?.BASE_URL ?? './'}art/hd/${a?.category ?? 'misc'}/${id}.webp`
}

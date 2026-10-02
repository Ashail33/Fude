import type { Locus } from './types'

/**
 * Room 5: the Tower of Creation. In through the south gate of the courtyard:
 * the sleepy walled garden (baku statue) on the left, the jailer's dungeon
 * door on the right, then north past the pond to the west sparring ring, across
 * to the east forge and the gate golem, up the Endless Stair, west to the
 * dragon statue, through the tower door into the throne room (the herald guard,
 * then the King) and finally up to the chest on the summit.
 */
export const ROOM_5: Locus[] = [
  {
    id: 'p5-garden',
    room: 5,
    map: 'tower',
    anchor: 'fk5-baku-stone',
    name: { jp: 'ばくの にわ', en: 'Baku Garden' },
    emoji: '🐘',
    memories: [
      { item: 'w:yume', story: 'The stone baku’s long nose slurps a pink dream out of a snoring page boy’s ear. The dream wriggles free and winks: “YOU MAY keep me.” It pops like warm bubblegum.' },
      { item: 'w:kokoro', story: 'A COCONUT ROLLS off the baku’s back, cracks on the path, and inside is a tiny heart, thumping softly in the moonlight. The nanny cups it in both hands.' },
      { item: 'w:inochi', story: 'A small green flame of life flickers on the baku’s stone nose. The nanny shields it from the wind: “EE, NO CHEEky puffing on it!” It warms your face like a sunbeam.' },
      { item: 'w:yasashii', story: 'The kind old nanny tucks a quilt over the stone baku and hums “YAH, SASHAY into sleep…” while stroking its trunk. The statue sighs, gently, like a pillow.' },
    ],
  },
  {
    id: 'p5-jail',
    room: 5,
    map: 'tower',
    anchor: 't-jailer',
    name: { jp: 'ろうや', en: 'Dungeon Door' },
    emoji: '⛓️',
    memories: [
      { item: 'w:oni', story: 'Behind the jailer’s bars a red demon with horns sits peeling a giant ONION, sobbing loudly. The tears sizzle on the stone floor and the whole dungeon reeks.' },
      { item: 'w:kage', story: 'The jailer has locked his own shadow in a birdCAGE. It flaps against the bars, flat and black, while he jangles the keys and laughs: “KAH-GAY!”' },
      { item: 'w:yami', story: 'Thick darkness oozes out under the dungeon door like black syrup. The jailer scoops it up with a ladle, slurps, and grins: “YUMMY!” His teeth vanish into it.' },
      { item: 'w:kowai', story: 'From the deepest cell a huge glowing COW EYE blinks at you, wet and yellow. The jailer’s keys rattle in his shaking hand. Scary. Very scary.' },
      { item: 'w:nigeru', story: 'A prisoner bursts out of a hole in the wall and scrambles away on his KNEES, howling “KNEE, GET, RUN!” Gravel flies as he flees across the courtyard.' },
    ],
  },
  {
    id: 'p5-ring',
    room: 5,
    map: 'tower',
    anchor: 't-captain',
    name: { jp: 'けいこば', en: 'Sparring Ring' },
    emoji: '⚔️',
    memories: [
      { item: 'w:tatakau', story: 'In the sparring ring the captain fights three knights at once, wooden swords clacking: TA-TA-KOW! Splinters spray, sand flies, and someone’s helmet rolls past your feet.' },
      { item: 'w:kiru', story: 'The captain cuts a straw dummy clean in half with one swing, and a golden KEY ROLLS out of its belly, clinking across the sand towards you.' },
      { item: 'w:abunai', story: 'A fluffy BUNNY hops into the ring while blades whirl overhead. Dangerous! Everyone freezes mid-swing and gasps “AH, BUNNY!” as it nibbles a spear shaft.' },
      { item: 'g:mashou', story: 'The captain thrusts his sword skyward and roars “MARCH, SHOW them!” The knights stamp forward as one. Bolted onto any verb, this cry turns it into “Let’s do it together!”' },
    ],
  },
  {
    id: 'p5-forge',
    room: 5,
    map: 'tower',
    anchor: 't-anvil',
    name: { jp: 'えいゆうの かなとこ', en: 'Heroic Anvil' },
    emoji: '⚒️',
    memories: [
      { item: 'w:tsurugi', story: 'On the heroic anvil lies a fresh sword. You lick the blade (why?) and it tastes SOUR: “SOO-ROO-GEE!” Your tongue tingles as the steel rings like a bell.' },
      { item: 'w:moyasu', story: 'The bellows wheeze and the forge burns white-hot. A soot-faced smith screams “MORE, YA SOOTY fire!” and flames lick the rafters, roasting a passing pigeon.' },
      { item: 'w:kesu', story: 'A troll tips a whole CASE of SOUP onto the burning forge. Sssss! Steam billows, the fire is put out, and the courtyard smells of onions.' },
      { item: 'w:kowasu', story: 'The smith brings his hammer down — “KOWA-SMASH!” — and the anvil breaks clean in two. Sparks shower, and both halves thud into the dirt.' },
    ],
  },
  {
    id: 'p5-gate',
    room: 5,
    map: 'tower',
    anchor: 't-golem',
    name: { jp: 'もんばんの ゴーレム', en: 'Gate Golem' },
    emoji: '🗿',
    memories: [
      { item: 'w:tate', story: 'Gonta the golem holds up a shield painted like a TATTERED map. Arrows from the training yard bounce off it — clang, clang — and land in a neat pile at his feet.' },
      { item: 'w:mamoru', story: 'Gonta spreads his stone arms around the little squire like a MAMA guarding her baby, rumbling “MAMA, MORE-ROO.” Nothing gets past to hurt him.' },
      { item: 'w:tasukeru', story: 'The squire is stuck head-first in a barrel. Gonta helps, pulling him out with one gritty finger — what a TASK! — and the boy pops free like a cork.' },
      { item: 'g:te-kudasai', story: 'Gonta ignores bare orders. Only when you bow and tack “TEH, COO-DA-SIGH” onto a verb’s te-form does he creak aside: it turns a command into “please do it.”' },
    ],
  },
  {
    id: 'p5-stair',
    room: 5,
    map: 'tower',
    anchor: 't-stair',
    name: { jp: 'はてしない かいだん', en: 'Endless Stair' },
    emoji: '🪜',
    memories: [
      { item: 'w:tou', story: 'The Endless Stair spirals up a tower so tall its top is lost in cloud. On every step you stub the same TOE — “TOE! OH!” — and the echo rings up forever.' },
      { item: 'w:yuusha', story: 'A hero in a flapping red cape bounds past, three steps at a time. The crowd below chants “YOU, SHAH of heroes!” and throws flowers that never reach him.' },
      { item: 'w:sumimasen', story: 'Squeezing past a fat knight on the narrow stair, you knock his helmet off and bow: “SUE ME, MA’AM, SENseless of me!” Excuse me, excuse me, all the way up.' },
    ],
  },
  {
    id: 'p5-statue',
    room: 5,
    map: 'tower',
    anchor: 't-dragon-statue',
    name: { jp: 'いしの ぞう', en: 'Dragon Statue' },
    emoji: '🐉',
    memories: [
      { item: 'w:ryuu', story: 'The stone dragon statue cracks open one eye, stretches its neck down to your nose, and rumbles “R-YOU sure you’re a mage?” Its breath smells of hot pebbles.' },
      { item: 'w:tobu', story: 'The statue hops off its plinth onto a TOBOGGAN, flaps its stone wings, and flies a loop around the lantern, scraping sparks off the castle wall.' },
      { item: 'w:mahou', story: 'A wizard taps the statue with a MAHOgany wand. Purple magic fizzes along its scales, and the stone tail turns to jelly, wobbling.' },
    ],
  },
  {
    id: 'p5-herald',
    room: 5,
    map: 'tower-throne',
    anchor: 'tt-guard-l',
    name: { jp: 'このえへい', en: 'Royal Herald' },
    emoji: '📜',
    memories: [
      { item: 'g:mashita', story: 'The royal guard unrolls a scroll and reports the day’s deeds, each ending in a cymbal crash, “MASH-TA!”: fought, MASH-TA! guarded, MASH-TA! It politely says the thing was done.' },
      { item: 'g:masendeshita', story: 'Then, red-faced, he reads the failures, each with a sad trombone, “MAH-SEN-DESH-TA…”: the cook did NOT come, the dog did NOT sit. The polite way to say it didn’t happen.' },
    ],
  },
  {
    id: 'p5-throne',
    room: 5,
    map: 'tower-throne',
    anchor: 'tt-king',
    name: { jp: 'ぎょくざ', en: 'Throne' },
    emoji: '👑',
    memories: [
      { item: 'w:ou', story: 'The King sits on his golden throne. Every time his heavy crown slips over his eyes the whole court gasps “OH!” and a page props it back up with a broom.' },
      { item: 'w:shiro', story: 'A tiny castle stands on the arm of the throne. Round its moat, SHE ROWs — the princess in a walnut-shell boat — splashing the King’s sleeve.' },
      { item: 'g:desu', story: 'Before the King, every statement must end with a polite bow and a ding on his DESK bell: “This is a sword, DESS.” Ding! It is the polite “is”.' },
      { item: 'g:dewa-arimasen', story: 'A courtier holds up a lizard. The King frowns: “It is NOT a dragon,” then bows and gongs “DEH-WAH, AH-REE-MAH-SEN.” The polite “is not”, said with a sigh.' },
      { item: 'w:arigatou', story: 'An ALLIGATOR in a tiny crown waddles up the carpet, bows low before the throne, and thanks the King again and again, its tail thumping the floor.' },
    ],
  },
  {
    id: 'p5-summit',
    room: 5,
    map: 'tower-top',
    anchor: 'tp-chest',
    name: { jp: 'いただきの はこ', en: 'Summit Chest' },
    emoji: '🎁',
    memories: [
      { item: 'g:tai', story: 'At the summit the chest flies open and a silk TIE flutters out, your wish stitched on it. Knot TIE onto a verb’s stem and it means “I want to”: protect-TIE, fly-TIE.' },
      { item: 'w:sekai', story: 'From the summit the whole world spreads out below like a map, and a giant KITE shaped like the globe tugs at the chest lid. You SAY, “KITE!” and it spins.' },
      { item: 'w:hikaru', story: 'A glowing kangaroo — a HICK-A-ROO — bounces out of the summit chest, shining so bright that the clouds light up gold and you squint behind your hands.' },
    ],
  },
]

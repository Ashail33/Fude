import type { Locus } from './types'

/**
 * Room 4 of the memory palace: the Shrine of Reading.
 *
 * Route (a loop from the south gate): east to the koi pond, across to the
 * moon-viewing stone, north into the library to the sealed lectern, out to
 * the ema board, up to the three colour bells, west to the main hall's bell,
 * down to the komainu, past the omikuji box, west to the rune tablets, and
 * back south by the sacred tree to the gate.
 */
export const ROOM_4: Locus[] = [
  {
    id: 'p4-koi',
    room: 4,
    map: 'shrine',
    anchor: 's-koi',
    name: { jp: 'こいの いけ', en: 'Koi Pond' },
    emoji: '🎏',
    memories: [
      { item: 'w:atsui', story: 'One corner of the koi pond boils and steams. You dip a toe and yelp "AH, TSOO-EE!" as it scalds you hot, and the koi there swim in sunglasses.' },
      { item: 'w:tsumetai', story: 'The rest of the pond is frozen cold. A shivering koi in an icy bow TIE chatters "TSU... MEH... TIE..." as frost cracks across its fins. Hot corner, cold corner.' },
      { item: 'w:hayai', story: 'A koi in a karate belt shouts "HIGH-YAH!" and rockets across the pond so fast it leaves a wake of foam and splashes your face.' },
      { item: 'w:osoi', story: 'Behind it an ancient koi drifts OH SO slowly, "OH... SO... EE...", moss growing on its back. The fast one laps it twice before it blinks.' },
    ],
  },
  {
    id: 'p4-tsukimi',
    room: 4,
    map: 'shrine',
    anchor: 's-tsukimi',
    name: { jp: 'つきみいし', en: 'Moon-Viewing Stone' },
    emoji: '🌕',
    memories: [
      { item: 'w:kirei', story: 'A silver KEY RAY of moonlight slides into a keyhole in the stone, and the whole garden unlocks, glittering and beautiful, petals floating up into the light.' },
      { item: 'w:oishii', story: 'The moon rabbit pounds mochi beside the stone and stuffs a warm piece in your mouth. "OY, SHE-EE!" you cry at her, chewing: sweet, sticky, delicious.' },
      { item: 'w:kuroi', story: 'A black crow named ROY lands on the stone and spreads his wings, "COO, ROY!", blotting out the moon until the whole sky is inky black.' },
      { item: 'g:na-adj', story: 'Carved on the stone: "beautiful ___ moon". A quiet-type describing word can\'t touch its noun alone, so a sticky NAH-NAH glue bead hops into the gap and binds them: word, NAH, noun.' },
    ],
  },
  {
    id: 'p4-lectern',
    room: 4,
    map: 'shrine-library',
    anchor: 'sl-lectern',
    name: { jp: 'けんだい', en: 'Sealed Lectern' },
    emoji: '📖',
    memories: [
      { item: 'w:kami', story: 'A sheet of paper peels off the sealed lectern, curls a corner like a finger and beckons "COME-EE, COME-EE", folding itself into a crane as you follow.' },
      { item: 'w:kotoba', story: 'An old COAT hangs on the lectern with a TUBA in its pocket. Every honk of the COAT-TUBA blows spoken words out as floating speech bubbles that pop into sentences.' },
      { item: 'w:shizuka', story: 'A ghostly librarian shoulders a SHE-ZOO-KAH bazooka and fires a blob of silence. Every cough, creak and page-flip in the library goes muffled and quiet.' },
      { item: 'w:kantan', story: 'The lectern\'s riddle book is so easy that a tin CAN with a sun TAN reads it aloud in one second, then shrugs and naps on the open page.' },
      { item: 'g:janai', story: 'The sign over the lectern says QUIET, but a tanuki crashing cymbals slaps on a sticker: "JAH-NIGH!" Now it reads NOT quiet. Na-words and nouns take JAH-NIGH to say "not".' },
    ],
  },
  {
    id: 'p4-ema',
    room: 4,
    map: 'shrine',
    anchor: 's-ema',
    name: { jp: 'えまかけ', en: 'Ema Board' },
    emoji: '🪧',
    memories: [
      { item: 'w:namae', story: 'You write your name on a wooden wish plaque. It wriggles, shouts "NAH, MY name!" and scrawls its own name over yours in thick dripping ink.' },
      { item: 'w:suki', story: 'A plaque with a heart drawn on it straps on tiny SKIS and slides down the ema board, leaving a pink trail that spells "I like you".' },
      { item: 'w:taisetsu', story: 'One plaque is so important it is bound with a whole TIE SET, SUE: twelve silk neckties knotted round it, and a guard dog sleeps beneath.' },
      { item: 'w:yuumei', story: 'A famous star\'s plaque glows gold. Cameras flash, fans shove autograph books at it and squeal "YOU MAY sign mine!" while the board creaks under the crowd.' },
    ],
  },
  {
    id: 'p4-bells',
    room: 4,
    map: 'shrine',
    anchor: 's-nbell-white',
    name: { jp: 'いろの すず', en: 'Colour Bells' },
    emoji: '🔔',
    memories: [
      { item: 'w:akai', story: 'A red AH-KITE swoops down, tangles in the first bell\'s rope and flaps wildly, smearing the bell bright red like fresh paint.' },
      { item: 'w:shiroi', story: 'SHE and ROY slosh buckets of whitewash over the middle bell. It rings with a soft milky clang, white drops spattering your sandals.' },
      { item: 'w:aoi', story: 'The last bell tips and pours out a blue wave. "AH! OH! EE!" you yell as it soaks you, dyeing you blue from hair to toes.' },
      { item: 'g:i-adj', story: 'Each bell rope ends in a little tail that squeals "EE!" These EE-tailed describing words march straight up in front of their noun, no glue needed: red-EE bell, white-EE bell.' },
    ],
  },
  {
    id: 'p4-hall',
    room: 4,
    map: 'shrine',
    anchor: 's-bell',
    name: { jp: 'ほんでんの すず', en: 'Main Hall Bell' },
    emoji: '⛩️',
    memories: [
      { item: 'w:jinja', story: 'The main hall is a giant GIN JAR with a thatched lid. You shake the bell rope and the whole shrine sloshes, smelling of juniper.' },
      { item: 'w:tera', story: 'A TERRA-cotta pagoda sprouts beside the hall. Clay monks inside bong a deep gong to drown out the bell: a Buddhist temple next door.' },
      { item: 'w:toki', story: 'The bell rope ends in a giant TOE with a KEY between its toes. Each tug winds a huge hourglass above the hall, sand pouring: time passing.' },
      { item: 'w:ima', story: 'The bell clangs and a booming mother leans out of the hall: "EE, MA says NOW! Right NOW!" Every pigeon takes off at once.' },
    ],
  },
  {
    id: 'p4-komainu',
    room: 4,
    map: 'shrine',
    anchor: 's-komainu',
    name: { jp: 'こまいぬ', en: 'Komainu Guardian' },
    emoji: '🦁',
    memories: [
      { item: 'w:tsuyoi', story: 'The stone lion-dog spins a boulder on a string like a YO-YO, roaring "TSU-YOY-OY!", so strong the ground shakes with every throw.' },
      { item: 'w:yowai', story: 'Its partner is weak: a crumbling stone pup trying to lift one cherry petal, wobbling and sobbing "YO... WHY?" Strong one, weak one, side by side.' },
      { item: 'w:genki', story: 'A GENIE with a KEY on a string bounces on the lion-dog\'s head, cartwheeling and whooping, full of energy, never stopping for breath.' },
    ],
  },
  {
    id: 'p4-omikuji',
    room: 4,
    map: 'shrine',
    anchor: 's-omikuji',
    name: { jp: 'おみくじばこ', en: 'Omikuji Box' },
    emoji: '🎴',
    memories: [
      { item: 'g:kunai', story: 'Your fortune slip says "a cold day". A ninja\'s COO-NIGH blade slashes off its EE ending and stabs into the slip: now it says NOT cold. Swap the EE for the blade to say "not".' },
      { item: 'g:katta', story: 'Last year\'s fortune hangs on the box, already CUT-TA in half. Its EE-word now ends in CUT-TA: "fun" became "WAS fun". That cut puts the describing word in the past.' },
    ],
  },
  {
    id: 'p4-tablets',
    room: 4,
    map: 'shrine',
    anchor: 's-tablet-1',
    name: { jp: 'いしぶみ', en: 'Rune Tablets' },
    emoji: '🪨',
    memories: [
      { item: 'w:moji', story: 'The carved letters crawl out of the mossy tablet like ants, chanting "MO! JEE! MO! JEE!", then march back into their grooves one by one.' },
      { item: 'w:nagai', story: 'The inscription is so long it unrolls off the tablet, across the garden and over the wall. The scribe at the end groans "NAH, GUY, still going?"' },
    ],
  },
  {
    id: 'p4-tree',
    room: 4,
    map: 'shrine',
    anchor: 's-old-tree',
    name: { jp: 'ごしんぼく', en: 'Sacred Tree' },
    emoji: '🌳',
    memories: [
      { item: 'w:takai', story: 'The sacred tree is so tall that a TALL KITE, a TAH-KITE, snags on its top branch far above the clouds, and you crane your neck until it cricks.' },
      { item: 'w:furui', story: 'The ancient tree wears a long grey FURRY beard. It creaks "FOO-ROO-EE" and centuries of dust puff from its old cracked bark.' },
      { item: 'w:atarashii', story: 'Beside the old giant, a brand-new sapling pops up still in shiny wrapping, sings "AH, TA-DA! RASH-EE!" and smells of fresh paint: new next to old.' },
    ],
  },
]

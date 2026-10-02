import type { Locus } from './types'

/**
 * Room 3 of the memory palace: the Forest of Sentences.
 *
 * Route (from the west entrance): the hermit's clearing → the little fox
 * torii → the Sentence Anvil by the smithy → the tinker's hearth → Mugi the
 * baker → the signpost at the crossroads → the spring → the bridge guard →
 * over the river to the Riddle Stone → the Particle Guardian at the north gate.
 *
 * The particles each have a job you can watch: と ribbon, の owner's tag and
 * も tag-along at the torii; を cart and the verb-last hammer at the anvil;
 * で stage at the bakery; に pushpin and へ weathervane at the signpost;
 * か question-crow at the riddle stone; は spotlight and が pointing finger
 * held by the Guardian.
 */
export const ROOM_3: Locus[] = [
  {
    id: 'p3-hermit',
    room: 3,
    map: 'forest',
    anchor: 'fo-hermit',
    name: { jp: 'せんにん', en: 'Hermit’s Clearing' },
    emoji: '🧙',
    memories: [
      { item: 'w:sensei', story: 'The hermit bonks your head with his staff: SEN-SAY! He SENSES what you’ll SAY before you say it. Every teacher in this forest learned from him, and they all bonk.', image: 'an old teacher bonks your head with his staff: SEN-SAY! He SENSES what you’ll SAY before you say it, the way every good teacher does' },
      { item: 'w:gakusei', story: 'A row of students sits on logs at the hermit’s feet. They GAWK and SAY “huh?” in perfect unison, backpacks bouncing, scribbling notes on leaves.', image: 'a row of students sits on logs, GAWKING and SAYING “huh?” in perfect unison, backpacks bouncing as they scribble notes on leaves' },
      { item: 'w:gakkou', story: 'The hermit’s hut is a school: a GAWKING crow on the roof rings the bell, GAK-KOH! GAK-KOH!, and tadpoles in tiny caps file inside for class.', image: 'a little hut turns into a school: a GAWKING crow on its roof rings the bell, GAK-KOH! GAK-KOH!, and tadpoles in tiny caps file inside for class' },
      { item: 'w:tomodachi', story: 'Your friend TOM rides into the clearing on a DACHshund (TOMO-DACHI), waves both arms and hugs you so hard your hat pops off.', image: 'your friend TOM rides up on a DACHshund (TOMO-DACHI), waves both arms and hugs you so hard your hat pops off' },
      { item: 'w:yomu', story: 'A cow sits on the hermit’s bench reading a fat book aloud, “YO… MOO…”, turning each page with a long slurp of her tongue.', image: 'a cow sits reading a fat book aloud, “YO… MOO…”, turning each page with a long slurp of her tongue' },
      { item: 'w:kaku', story: 'A cuckoo dips its beak in the hermit’s ink pot and writes a whole poem on his scroll, pecking each stroke: KAH-KOO! KAH-KOO!', image: 'a cuckoo dips its beak in an ink pot and writes a whole poem on a scroll, pecking each stroke: KAH-KOO! KAH-KOO!' },
    ],
  },
  {
    id: 'p3-torii',
    room: 3,
    map: 'forest',
    anchor: 'fo-torii',
    name: { jp: 'ちいさな とりい', en: 'Little Torii' },
    emoji: '⛩️',
    memories: [
      { item: 'g:to', story: 'Under the little torii two foxes stand TOE to TOE, tails knotted with a red ribbon. This particle is that ribbon: it ties two things together, this AND that, fox WITH fox.', image: 'two foxes stand TOE to TOE, tails knotted with a red ribbon; this particle is that ribbon, tying two things together, this AND that, fox WITH fox' },
      { item: 'g:no', story: 'Every fox at the torii has an owner’s tag hanging off its NOse: “the bride’s tail”, “the groom’s hat”. This particle is the tag that glues an owner to a thing: X’s Y, Y of X.', image: 'a fox wears an owner’s tag on its NOse reading “the bride’s tail”; this particle is the tag that glues an owner to a thing: X’s Y, Y of X' },
      { item: 'g:mo', story: 'A third fox squeezes under the torii yelling “MOre! Me TOO!” This particle is the tag-along tail: whoever it sticks to does the same thing ALSO.', image: 'a third fox squeezes in yelling “MOre! Me TOO!”; this particle is the tag-along tail: whoever it sticks to does the same thing ALSO' },
    ],
  },
  {
    id: 'p3-anvil',
    room: 3,
    map: 'forest',
    anchor: 'fo-anvil',
    name: { jp: 'ぶんの かなとこ', en: 'Sentence Anvil' },
    emoji: '⚒️',
    memories: [
      { item: 'g:verb-last', story: 'On the Sentence Anvil the words are laid in a row, who then what, and the verb is the hammer that ALWAYS falls last: CLANG! No sentence is finished until that final blow.', image: 'words lie in a row, who then what, and the verb is a hammer that ALWAYS falls last: CLANG! No sentence is finished until that final blow' },
      { item: 'g:wo', story: 'A tiny mine cart rattles up onto the anvil, WHOA!, carrying the OBJECT, the thing being acted on, straight to the verb. Whatever rides in this cart gets eaten, read or hammered.', image: 'a tiny mine cart rattles up, WHOA!, carrying the OBJECT, the thing being acted on, straight to the verb; whatever rides in it gets eaten, read or hammered' },
      { item: 'g:masu', story: 'The smith wipes each finished verb with a velvety MOSS cloth, MAS!, until it gleams and bows. That shiny tail is the polite ending every verb wears to meet strangers.', image: 'a smith wipes each finished verb with a velvety MOSS cloth, MAS!, until it gleams and bows: the polite ending every verb wears to meet strangers' },
      { item: 'g:masen', story: 'One polished verb crosses its arms and refuses to ring: MASS-END! Same polite shine, but now it politely doesn’t happen. I don’t, I won’t, thank you kindly.', image: 'one polished verb crosses its arms and refuses to ring: MASS-END! Same polite shine, but now it politely doesn’t happen: I don’t, I won’t, thank you kindly' },
      { item: 'w:tsukuru', story: 'SUE the KANGAROO (TSU-KOO-ROO) bounces on the anvil, and every hop makes something: a horseshoe, a kettle, a sword, sparks spraying from her feet.', image: 'a kangaroo called SUE (TSU-KOO-ROO, SUE the KANGAROO) bounces about, and every hop makes something: a horseshoe, a kettle, a sword, sparks spraying from her feet' },
      { item: 'w:tsukau', story: 'The smith grabs a startled COW by the tail and uses it as a pair of tongs: TSU-COW! Every tool here gets used, even the livestock.', image: 'a smith grabs a startled COW by the tail and uses it as a pair of tongs: TSU-COW! Every tool gets used, even the livestock' },
      { item: 'w:suru', story: 'The anvil hums “SUE-ROO!” and simply does whatever it is asked: do homework, do sport, do magic. Glue it after any noun and the noun becomes something you do.', image: 'a helpful robot hums “SUE-ROO!” and simply does whatever it is asked: do homework, do sport, do magic; glue this word after a noun and it becomes something you do' },
    ],
  },
  {
    id: 'p3-hearth',
    room: 3,
    map: 'forest',
    anchor: 'fk3-hearth',
    name: { jp: 'いろり', en: 'Tinker’s Hearth' },
    emoji: '🔥',
    memories: [
      { item: 'w:neru', story: 'A sleepy NERD curls up on a bedroll by the hearth, glasses crooked, snoring NEH-ROO… NEH-ROO… while sparks drift down onto his blanket.', image: 'a sleepy NERD curls up on a bedroll, glasses crooked, snoring NEH-ROO… NEH-ROO… as he drifts deeper and deeper into sleep' },
      { item: 'w:okiru', story: 'The odd kettle on the fire shrieks “OH, KEY-ROO!” and the sleeper bolts upright, wide awake, hair standing straight up from the steam.', image: 'an odd kettle shrieks “OH, KEY-ROO!” and a sleeper bolts upright, wide awake, hair standing straight up from the steam' },
      { item: 'w:kaeru', story: 'A frog with a bundle on a stick hops back to the hearth, croaks “CAH-EH-ROO, I’m home!”, kicks off its tiny boots and warms its toes by the fire.', image: 'a frog with a bundle on a stick hops back home, croaks “CAH-EH-ROO, I’m home!”, kicks off its tiny boots and warms its toes' },
      { item: 'w:kyou', story: 'The tinker drops a fresh log on the fire and it squeals “KYOH!” as it catches. Today burns right now, right here, this very minute.', image: 'a fresh log squeals “KYOH!” as it catches fire; today burns right now, right here, this very minute' },
      { item: 'w:ashita', story: 'Tomorrow’s sun sleeps buried in the ASHes, glowing pink. “ASH-ITA,” the tinker whispers, banking the coals so it can rise in the morning.', image: 'tomorrow’s sun sleeps buried in a heap of warm ASHes, glowing pink, while someone whispers “ASH-ITA” and banks the coals so it can rise in the morning' },
    ],
  },
  {
    id: 'p3-baker',
    room: 3,
    map: 'forest',
    anchor: 'fo-baker',
    name: { jp: 'むぎさん', en: 'Mugi the Baker' },
    emoji: '🥖',
    memories: [
      { item: 'w:taberu', story: 'A bear in an apron eats loaf after loaf at Mugi’s counter, crumbs flying: “TA, BEAR!” Mugi cheers. Chomp, chomp, chomp, cheeks bulging.', image: 'a bear in an apron eats loaf after loaf, crumbs flying, while a crowd cheers “TA, BEAR!” Chomp, chomp, chomp, cheeks bulging' },
      { item: 'w:pan', story: 'Mugi flips a golden loaf out of a frying PAN, PAN!, and it bounces across the counter like a ball, steaming and smelling of butter.', image: 'a cook flips a golden loaf out of a frying PAN, PAN!, and it bounces along like a ball, steaming and smelling of butter' },
      { item: 'w:kau', story: 'A COW in a bonnet slaps coins on Mugi’s counter and buys every last loaf, carrying them off in a basket hooked on her horns.', image: 'a COW in a bonnet slaps coins down and buys every last loaf, carrying them off in a basket hooked on her horns' },
      { item: 'w:mise', story: 'Mugi’s stall swings open into a little shop. The sign squeaks “ME! SAY! Buy from ME!”, shutters clatter up and bells jingle over the shelves.', image: 'a stall swings open into a little shop; its sign squeaks “ME! SAY! Buy from ME!”, shutters clatter up and bells jingle over the shelves' },
      { item: 'g:de', story: 'Mugi’s counter is a STAGE for a DEbut: whatever happens on it, eating, buying, baking, happens AT this place. This particle is the stage floor under the action, and the rolling pin you do it WITH.', image: 'a little STAGE rolls up for a DEbut: whatever happens on it, eating, buying, baking, happens AT that place; this particle is the stage floor under the action, and the rolling pin you do it WITH' },
    ],
  },
  {
    id: 'p3-signpost',
    room: 3,
    map: 'forest',
    anchor: 'fo-signpost',
    name: { jp: 'みちしるべ', en: 'Signpost' },
    emoji: '🪧',
    memories: [
      { item: 'g:ni', story: 'The signpost’s arrow is a giant KNEE that kicks a pushpin into the map: NEE! This particle pins the exact spot: the place you go TO, where something IS, the time WHEN.', image: 'a giant KNEE kicks a pushpin into a map: NEE! This particle pins the exact spot: the place you go TO, where something IS, the time WHEN' },
      { item: 'g:he', story: 'A creaky weathervane on top of the signpost swings and points vaguely toward the mountains: “EH? That way-ish.” This particle is a heading, not a pin: TOWARD somewhere.', image: 'a creaky weathervane swings and points vaguely toward the mountains: “EH? That way-ish.” This particle is a heading, not a pin: TOWARD somewhere' },
      { item: 'w:iku', story: 'A mouse squeaks “EEK!” and races off down the road away from the signpost, smaller and smaller, going, going, gone.', image: 'a mouse squeaks “EEK!” and races off down the road away from you, smaller and smaller, going, going, gone' },
      { item: 'w:kuru', story: 'A pigeon flies up the road toward you, cooing “COO-ROO”, and lands right on your head. It has come all the way here, to you.', image: 'a pigeon flies toward you, cooing “COO-ROO”, and lands right on your head; it has come all the way here, to you' },
      { item: 'w:eki', story: 'The signpost’s arm points to a tiny train station; a toy train screeches in, its whistle squealing “EH-KEE!”, steam puffing around your boots.', image: 'a toy train screeches into a tiny station, its whistle squealing “EH-KEE!”, steam puffing around your boots' },
    ],
  },
  {
    id: 'p3-spring',
    room: 3,
    map: 'forest',
    anchor: 'fo-spring',
    name: { jp: 'わきみず', en: 'Spring' },
    emoji: '💧',
    memories: [
      { item: 'w:nomu', story: 'A thirsty NO-MOOSE kneels at the spring and drinks it dry in one enormous gulp, water dribbling from its antlers.', image: 'a thirsty NO-MOOSE kneels and drinks a whole barrel of water dry in one enormous gulp, water dribbling from its antlers' },
      { item: 'w:miru', story: 'You lean over the spring to look, and a kangaROO stares back: “ME? ROO?” Your reflection blinks; your eyes go wide as saucers.', image: 'you lean over a bucket of water to look, and a kangaROO stares back: “ME? ROO?” Your reflection blinks; your eyes go wide as saucers' },
      { item: 'w:aru', story: 'A pirate’s chest sits at the bottom of the spring: “ARR-OO!” It, the rocks and a sunken boot just lie there, not alive, simply existing. Things that are there.', image: 'a pirate’s chest just sits there, “ARR-OO!”, beside a rock and an old boot, not alive, simply existing: things that are there' },
      { item: 'w:iru', story: 'An EEL wriggles around the sunken chest squealing “EE-ROO!” It is alive and it is here: the word for living things being somewhere.', image: 'an EEL wriggles around in a bucket squealing “EE-ROO!” It is alive and it is here: the word for living things being somewhere' },
    ],
  },
  {
    id: 'p3-guard',
    room: 3,
    map: 'forest',
    anchor: 'fo-guard',
    name: { jp: 'ばんにん', en: 'Bridge Guard' },
    emoji: '💂',
    memories: [
      { item: 'w:wataru', story: 'The guard lifts his spear and a kangaroo bounds over the WATER: WATA-ROO! One leap from this bank to the far side, crossing the river without a splash.', image: 'a kangaroo bounds over a rushing river, WATA-ROO! One leap from this bank to the far side, crossing the WATER without a splash' },
      { item: 'w:hashi', story: 'The bridge is built of giant chopsticks lashed together. The guard stomps on it and laughs, “HAH! SHE holds!”, as the planks creak.', image: 'a rickety bridge of giant chopsticks lashed together creaks under a stomping giant, who laughs “HAH! SHE holds!” as the planks groan' },
      { item: 'w:matsu', story: 'The guard unrolls a MAT for SUE, who sits and waits… and waits… tapping her foot as an hourglass trickles beside her.', image: 'someone unrolls a MAT for SUE, who sits and waits… and waits… tapping her foot as an hourglass trickles beside her' },
    ],
  },
  {
    id: 'p3-riddle',
    room: 3,
    map: 'forest',
    anchor: 'fo-riddle',
    name: { jp: 'なぞの いし', en: 'Riddle Stone' },
    emoji: '🪨',
    memories: [
      { item: 'g:ka', story: 'A crow perches on the Riddle Stone and caws “KA?” at the end of everything you say. Its rising caw is the question mark: stick it on the end and any sentence becomes “Is it…?”', image: 'a crow caws “KA?” at the end of everything you say; its rising caw is the question mark: stick it on the end and any sentence becomes “Is it…?”' },
      { item: 'w:hanasu', story: 'The Riddle Stone sprouts a huge NOSE and talks through it nonstop, honking “HA! NAH! SUE!”, words tumbling out like pebbles.', image: 'a boulder sprouts a huge NOSE and talks through it nonstop, honking “HA! NAH! SUE!”, words tumbling out like pebbles' },
      { item: 'w:kiku', story: 'Press your ear to the Riddle Stone and listen: a KEY turns inside it and a dove COOs, KEY-COO. Every whisper in the forest reaches your ear.', image: 'you press your ear to a seashell and listen: a KEY turns inside it and a dove COOs, KEY-COO, and every whisper reaches your ear' },
    ],
  },
  {
    id: 'p3-guardian',
    room: 3,
    map: 'forest',
    anchor: 'fo-treant',
    name: { jp: 'じょしの しゅご', en: 'Particle Guardian' },
    emoji: '🌳',
    memories: [
      { item: 'g:wa', story: 'The Particle Guardian swings a lantern and a SPOTLIGHT lands on one thing: WAH! “As for THIS…” This particle sets the topic, the thing the whole sentence is about.', image: 'a lantern swings and a SPOTLIGHT lands on one thing: WAH! “As for THIS…” This particle sets the topic, the thing the whole sentence is about' },
      { item: 'g:ga', story: 'The Guardian jabs a twiggy FINGER, GAH!, at exactly who does it: that one, the doer. The spotlight shows the topic; this pointing finger picks out the subject.', image: 'a twiggy FINGER jabs, GAH!, at exactly who does it: that one, the doer. The spotlight shows the topic; this pointing finger picks out the subject' },
    ],
  },
]

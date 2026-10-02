import type { Locus } from '../types'

/**
 * Room 7 of the memory palace: the Hot-Spring Hollow.
 *
 * Route (from the west road): the welcome sign → Grandpa Gen's footbath →
 * into the inn: the genkan, Haruko's counter, the Pine Room, the snowy
 * window → out to Jiro's bath-house → the egg cauldron → up the lantern
 * street to the starlit rock bath and its wash taps → back down over the
 * swaying bridge → the shrine of the spring god → up the bamboo slope to
 * Yōrō Falls.
 *
 * The て-form's sound changes each have a gang you can hear: the stamping
 * hikers of って on the bridge, the humming monks of んで at the shrine,
 * the boot-kickers of いて/いで at the genkan, the sneezers of して on the
 * bamboo slope, and the slipper-swap of the る-verbs in the Pine Room.
 */
export const ROOM: Locus[] = [
  {
    id: 'p7-gate',
    room: 7,
    map: 'onsen',
    anchor: 'o-sign-west',
    name: { jp: 'さとの かんばん', en: 'The Welcome Sign' },
    emoji: '🪧',
    memories: [
      { item: 'w:kinou', story: 'A traveller under the welcome sign pats every pocket and wails “KEY? NO!” The key was lost YESTERDAY, and he keeps glancing back down the road toward the day before.', image: 'a traveller pats every pocket and wails “KEY? NO!”: the key was lost YESTERDAY, and he keeps glancing back down the road toward the day before' },
      { item: 'w:kesa', story: 'A sleepy girl leans on the sign with a pillow crease on her cheek. KAY SAW the sunrise THIS MORNING, she says, and she has been yawning ever since.', image: 'a sleepy girl with a pillow crease on her cheek yawns that KAY SAW (KE-SA) the sunrise THIS MORNING, only a few hours ago' },
      { item: 'w:senshuu', story: 'A single SHOE was SENt by post and has only now arrived at the sign, stamped seven days ago: SEN-SHOO, it limped here from LAST WEEK.', image: 'a single SHOE SENt by post finally arrives, stamped seven days ago: SEN-SHOO, it has been limping here since LAST WEEK' },
      { item: 'w:sengetsu', story: 'A postman SENds a moon-shaped letter and the inn GETS it a whole moon late: SEN-GETS-oo! It is LAST MONTH’s news, curling at the edges on the sign.', image: 'a postman SENds a moon-shaped letter and someone GETS it a whole moon late, SEN-GETS-oo: it is LAST MONTH’s news, curling at the edges' },
      { item: 'w:hajimete', story: 'Two strangers meet under the sign and shake hands: “HA! JIM! MET you at last!” They have never seen each other before; this is the FIRST TIME.', image: 'two strangers shake hands: “HA! JIM! MET you at last!” (HA-JI-ME-TE); they have never seen each other before, this is the FIRST TIME' },
      { item: 'g:ta-koto', story: 'An octopus in a TOGA leans on the sign, eight trophies in eight arms: “TAKO-TOGA… I HAVE DONE all of this BEFORE!” Past form plus koto ga aru = an experience you have had.', image: 'an octopus in a TOGA juggles eight trophies: “TA-KOTO-GA-ARU! I HAVE DONE all of these BEFORE!”: past form plus koto ga aru is an experience you have had' },
    ],
  },
  {
    id: 'p7-footbath',
    room: 7,
    map: 'onsen',
    anchor: 'o-ashiyu',
    name: { jp: 'げんじいの あしゆ', en: 'Grandpa Gen’s Footbath' },
    emoji: '🦶',
    memories: [
      { item: 'w:ashiyu', story: 'Grandpa Gen dips his toes into the little steaming pool and yelps “ASH! YOU!” at the cat as grey ash puffs off his feet: a FOOTBATH, for feet only.', image: 'an old man dips his toes into a little steaming pool and yelps “ASH! YOU!” as grey ash puffs off his feet: a FOOTBATH, a bath for feet only' },
      { item: 'w:ashi', story: 'A giant bare FOOT stamps into a heap of grey ASH beside the footbath and leaves a perfect print: ASH-EE. Toes, heel, the whole leg wobbling.', image: 'a giant bare FOOT stamps into a heap of grey ASH and leaves a perfect print, ASH-EE: toes, heel and the whole leg wobbling' },
      { item: 'w:atatakai', story: 'Grandpa Gen hugs a teapot to his chest and sighs “AH… TA-TA… KAI…” The water, the pot, his toes: everything here is WARM to the touch.', image: 'a granny hugs a teapot to her chest and sighs “AH… TA-TA… KAI…”: the water, the pot, her toes, everything is WARM to the touch' },
      { item: 'w:kimochiii', story: 'A KEY made of MOCHI is dropped into the footbath and melts: “EEEE!” it squeals happily. Gen closes his eyes. It FEELS GOOD.', image: 'a KEY made of MOCHI melts in hot water and squeals “EEEE!” with happiness (KEY-MOCHI-EE): it FEELS GOOD' },
      { item: 'w:yukkuri', story: 'A snail in a headband slides past the footbath. “YOU COOLLY take your time,” Gen tells it: YU-KKU-RI. SLOWLY, slowly, it arrives next spring.', image: 'a snail in a headband slides past and someone says “YOU COOLLY take your time” (YU-KKU-RI): SLOWLY, slowly, it will arrive next spring' },
      { item: 'g:ta-form', story: 'A magician by the footbath swaps his little te hat for a ta hat and shouts “TA-DA!”: the trick is DONE and over. Make the te-form, change te to ta (de to da), and it is the plain PAST.', image: 'a magician swaps his little te hat for a ta hat and shouts “TA-DA!”: the trick is DONE and over; make the te-form, change te to ta, de to da, and it is the plain PAST' },
    ],
  },
  {
    id: 'p7-genkan',
    room: 7,
    map: 'onsen-inn',
    anchor: 'oi-shoes',
    name: { jp: 'げんかん', en: 'The Inn Entrance' },
    emoji: '👞',
    memories: [
      { item: 'w:kutsu', story: 'In the shoe cupboard a row of SHOES quacks “KOOTS! KOOTS!” like ducklings (KU-TSU), waiting for their owners to come back from the bath.', image: 'a row of SHOES quacks “KOOTS! KOOTS!” like ducklings (KU-TSU), waiting in a neat line for their owners to come back' },
      { item: 'w:nugu', story: 'You TAKE OFF your boots on the step and they are full of bright green NEW GOO. NU-GU! Off they come, off with the socks too.', image: 'you TAKE OFF your boots and they are full of bright green NEW GOO, NU-GU! Off they come, and the socks too' },
      { item: 'w:hairu', story: 'Over the inn door hangs a HIGH RULER, and everyone who GOES IN has to duck under the HIGH RULE: HAI-RU. In they go, into the inn, into the bath.', image: 'a HIGH RULER hangs over a doorway, and everyone who GOES IN must duck under the HIGH RULE, HAI-RU: into the house, into the bath' },
      { item: 'w:deru', story: 'Someone slides the door open into bright DAY and steps OUT: “DAY! RUE!” DEH-RU. Going out, leaving, getting out of the bath.', image: 'someone slides a door open into bright DAY and steps OUT, “DAY! RUE!” (DEH-RU): going out, leaving, getting out of the bath' },
      { item: 'g:verb-groups', story: 'Three teams line up at the entrance: the RU team (always an e or i sound before their ru), the U team (everyone else, including sneaky ones like hairu), and two IRREGULAR troublemakers, SU-RU and KU-RU, who never follow rules.', image: 'three teams line up: the RU team (an e or i sound before ru), the U team (everyone else, even sneaky hairu) and two IRREGULAR troublemakers, SU-RU and KU-RU' },
      { item: 'g:te-ite', story: 'Boot-kickers at the step: every verb ending in KU kicks off its boot and shouts “EE-TEH!”, every GU shouts “EE-DEH!” Only stubborn IKU shouts “IT-TEH!” instead.', image: 'boot-kickers: every verb ending in KU kicks off its boot shouting “EE-TEH!”, every GU shouts “EE-DEH!”, and only stubborn IKU shouts “IT-TEH!”' },
    ],
  },
  {
    id: 'p7-counter',
    room: 7,
    map: 'onsen-inn',
    anchor: 'oi-okami',
    name: { jp: 'はるこの カウンター', en: 'Haruko’s Counter' },
    emoji: '👘',
    memories: [
      { item: 'w:okami', story: 'Haruko bows so low behind the counter that her hair comb almost touches it: “OH, COME IN! OH, KAMI-n!” She is the PROPRIETRESS, the lady who runs this inn.', image: 'a lady in an indigo kimono bows low and sings “OH, COME IN!” (OH-KAH-MEE): she is the PROPRIETRESS, the woman who runs the inn' },
      { item: 'w:ryokan', story: 'A samba dancer from RIO CAN’t believe it: at the counter she is handed slippers, a robe and a tea set. RIO-CAN: a JAPANESE INN with tatami and baths.', image: 'a samba dancer from RIO CAN’t believe it: she is handed slippers, a robe and a tea set, RIO-CAN, a JAPANESE INN with tatami and baths' },
      { item: 'w:shokuji', story: 'The cook carries out a tray so huge that the guests at the counter gasp “SHOCK! OOH, GEE!” SHO-KU-JI: a whole MEAL of nine little dishes.', image: 'a cook carries out a tray so huge everyone gasps “SHOCK! OOH, GEE!” (SHO-KU-JI): a whole MEAL of nine little dishes' },
      { item: 'w:suwaru', story: 'SUE the WALRUS flops onto the cushion by the counter and SITS. SU-WA-RU. She will not stand up again until dinner.', image: 'big SUE the WALRUS flops onto a floor cushion and SITS, SU-WA-RU, and refuses to stand up again until dinner' },
      { item: 'w:issho', story: 'Two strangers at the counter share one bowl at the “EAT SHOW”: ISS-SHO! Two spoons, one bowl, everything done TOGETHER.', image: 'two strangers share one bowl at the “EAT SHOW” (ISS-SHO-NI): two spoons, one bowl, everything done TOGETHER' },
      { item: 'g:te-mo-ii', story: 'A guest raises one hand at the counter: “TEH-MO-EE DESS-KA?” Haruko smiles: “Hai, dōzo.” Te-form + mo ii desu ka is a hand raised to ask MAY I…?', image: 'a guest raises one hand and asks “TEH-MO-EE DESS-KA?”; the answer is a smiling “hai, dōzo”: te-form + mo ii desu ka asks MAY I…?' },
    ],
  },
  {
    id: 'p7-room',
    room: 7,
    map: 'onsen-inn',
    anchor: 'oi-futon',
    name: { jp: 'まつの へや', en: 'The Pine Room' },
    emoji: '🛏️',
    memories: [
      { item: 'w:heya', story: 'You slide open the paper door and the whole ROOM yells “HEY, YA!” with its cushions, its tea set and its sleeping cat.', image: 'you slide open a paper door and the whole ROOM yells “HEY, YA!”: its cushions, its tea set and a sleeping cat' },
      { item: 'w:tatami', story: 'The straw MATS on the floor wave goodbye as you walk across: “TA-TA, ME!” Each one smells of fresh summer grass.', image: 'woven straw floor MATS wave goodbye as you walk across them, “TA-TA, ME!”, each one smelling of fresh summer grass' },
      { item: 'w:futon', story: 'Put one FOOT ON the soft bedding rolled out on the floor, FU-TON, and you sink in up to the knee. Tonight you sleep down here, close to the mats.', image: 'put one FOOT ON the soft bedding rolled out on the floor, FU-TON, and you sink in up to the knee' },
      { item: 'w:yukata', story: 'The maid lays a light cotton robe on the futon. “YOU CUT A fine figure in it,” she says: YU-KA-TA, the robe you wear to the bath.', image: 'a maid lays out a light cotton robe and says “YOU CUT A fine figure in it” (YU-KA-TA): the robe for after the bath' },
      { item: 'w:kiru-wear', story: 'A kangaROO with a KEY on a string WEARS the cotton robe, tying the sash with a flourish: KEY-ROO! Not to be confused with the sword cut.', image: 'a kangaROO with a KEY on a string WEARS a cotton robe and ties the sash with a flourish, KEY-ROO, putting clothes on' },
      { item: 'w:nemui', story: 'NEMO the cow lies down on the futon, moos “NEH-MOO-EE…” and starts to snore. Everyone in the room is SLEEPY now.', image: 'a cow called NEMO lies down, moos “NEH-MOO-EE…” and begins to snore, and everyone near her suddenly feels SLEEPY' },
      { item: 'g:te-ru', story: 'The ru-verbs line up by the futon and each kicks off its RU slipper and slips on a TEH: “RU OFF, TEH ON!” Eat becomes tabete, wear becomes kite.', image: 'ru-verbs kick off their RU slippers and slip on a TEH: “RU OFF, TEH ON!”, so taberu becomes tabete and kiru becomes kite' },
    ],
  },
  {
    id: 'p7-window',
    room: 7,
    map: 'onsen-inn',
    anchor: 'oi-window',
    name: { jp: 'ゆきの まど', en: 'The Snowy Window' },
    emoji: '🪟',
    memories: [
      { item: 'w:mado', story: 'A MAD DOG presses its wet nose to the glass from outside and fogs the whole WINDOW: MA-DO! Snow piles on its ears.', image: 'a MAD DOG presses its wet nose to the glass and fogs up the whole WINDOW, MA-DO, with snow piling on its ears' },
      { item: 'w:mada', story: 'A child at the window calls “MA? DA?” into the snow. Not yet: they are STILL not home. MA-DA. The child keeps watching.', image: 'a child calls “MA? DA?” into the snowy dark; not yet, they are STILL not home (MA-DA), so the child keeps on watching' },
      { item: 'w:mou', story: 'A cow outside the window lifts her head from the snow and MOOs in surprise: it is ALREADY dark, ALREADY knee-deep. MOH!', image: 'a cow lifts her head and MOOs in surprise, MOH!: it is ALREADY dark and the snow is ALREADY knee-deep' },
      { item: 'w:saki-ni', story: 'Getting dressed by the window, you put your SOCK on your KNEE FIRST: SAH-KEY-NEE! First the sock, then everything else in the right order.', image: 'getting dressed, you put a SOCK on your KNEE FIRST (SA-KI-NI): first that, before anything else' },
      { item: 'w:ato-de', story: 'Fude points at the snow outside: “AH, TOE-DAY?” No: “AH-TOE-DEH”, LATER. The snowman can wait until after the bath.', image: 'someone points out at the snow: “AH, TOE-DAY?” No, “AH-TOE-DEH”, LATER; the snowman can wait until afterwards' },
      { item: 'g:datta', story: 'Old DATA is written in the frost on the glass: “The moon WAS full. The street WAS quiet.” DA-TTA, the plain past of nouns and na-words; and ja nakatta for WASN’T.', image: 'old DATA is written in frost: “the moon WAS full, the street WAS quiet”, DA-TTA, the plain past of nouns and na-words, ja nakatta for WASN’T' },
    ],
  },
  {
    id: 'p7-bathhouse',
    room: 7,
    map: 'onsen',
    anchor: 'o-jiro',
    name: { jp: 'じろうの ゆや', en: 'Jiro’s Bath-House' },
    emoji: '🛁',
    memories: [
      { item: 'w:ofuro', story: 'Behind Jiro’s curtain a whole ROW of FOOls sits up to their chins in hot water: “OH, FOO-ROW!” It is a BATH, and they will not get out.', image: 'a whole ROW of FOOls sits up to their chins in hot water, “OH, FOO-ROW!”: a BATH they refuse to get out of' },
      { item: 'w:arau', story: 'Jiro scrubs a muddy ARROW with a brush until it gleams: AH-RAU! He WASHES everything here before it touches the water.', image: 'a boy scrubs a muddy ARROW with a brush until it gleams, AH-RAU: he WASHES everything before it touches the water' },
      { item: 'w:oyogu', story: 'A monkey SWIMS laps across a tub of yoghurt: “OH, YO-GU!” Jiro blows his whistle. Splash, splash, kick.', image: 'a monkey SWIMS laps across a tub of yoghurt shouting “OH, YO-GU!”: splash, splash, kick' },
      { item: 'w:itai', story: 'A customer bites into a necktie by mistake: “EE-TIE!” It HURTS. He clutches his jaw and hops around Jiro’s counter.', image: 'someone bites into a necktie by mistake and yells “EE-TIE!”: it HURTS, and he clutches his jaw and hops about' },
      { item: 'g:te-wa-ikemasen', story: 'Over Jiro’s curtain hangs a red X, and the bouncer chants “TEH-WA… EE-KEH-MASEN!” at anyone with a towel in the water: te-form + wa ikemasen means you MUST NOT.', image: 'a bouncer beneath a big red X chants “TEH-WA… EE-KEH-MASEN!” at a towel near the water: te-form + wa ikemasen means you MUST NOT' },
      { item: 'g:nakatta', story: 'On Jiro’s door hangs a ribbon that was NOT CUT: NA-KATTA. The grand opening DIDN’T happen. Make the nai-form, then swap its last i for katta.', image: 'a ceremony ribbon that was NOT CUT (NA-KATTA): the grand opening DIDN’T happen; make the nai-form, then swap its last i for katta' },
    ],
  },
  {
    id: 'p7-eggs',
    room: 7,
    map: 'onsen',
    anchor: 'o-eggs',
    name: { jp: 'たまごの かま', en: 'The Egg Cauldron' },
    emoji: '🥚',
    memories: [
      { item: 'w:oyu', story: 'The cauldron splashes boiling HOT WATER on your shoes and you jump: “OH, YOU!” OH-YU. The eggs inside bob and giggle.', image: 'a cauldron splashes boiling HOT WATER on your shoes and you jump, “OH, YOU!” (OH-YU), while eggs bob and giggle' },
      { item: 'w:ireru', story: 'Okiku PUTS the eggs IN by the EAR RULE: one egg behind each ear, then plop, plop, into the pot. EE-REH-RU.', image: 'a cook PUTS eggs IN by the EAR RULE: one behind each ear, then plop, plop, into the pot, EE-REH-RU' },
      { item: 'w:tsukareru', story: 'SUE CARRIED RUE up the hill all day and now slumps against the cauldron: SU-KA-RE-RU. She is TIRED, so tired she falls asleep on the eggs.', image: 'poor SUE CARRIED RUE up a hill all day and now slumps down, SU-KA-RE-RU: she is TIRED, too tired even to stand' },
      { item: 'g:te-kara', story: 'The eggs go in first; AFTER that the timer rings “TEH-KARA!” and only then do you eat. Te-form + kara: do one thing, and AFTER it, the next.', image: 'eggs go in first; AFTER that a timer rings “TEH-KARA!” and only then do you eat: te-form + kara means do one thing, and AFTER it the next' },
      { item: 'g:te-chain', story: 'Okiku strings the steps of her recipe on a CHAIN of TEH-hooks: wash-te, crack-te, boil-te… and only the last link wears masu. One chain, in order.', image: 'a recipe hangs on a CHAIN of TEH-hooks: wash-te, crack-te, boil-te… and only the very last link wears the tense, in order' },
    ],
  },
  {
    id: 'p7-rockbath',
    room: 7,
    map: 'onsen-bath',
    anchor: 'ob-pool',
    name: { jp: 'ほしの いわぶろ', en: 'The Starlit Rock Bath' },
    emoji: '♨️',
    memories: [
      { item: 'w:onsen', story: 'You sink into the rocky pool under the stars and gasp “ON… SEN-sational!” ON-SEN: a natural HOT SPRING, steaming in the snow.', image: 'you sink into a rocky pool under the stars and gasp “ON… SEN-sational!” (ON-SEN): a natural HOT SPRING steaming in the snow' },
      { item: 'w:yuge', story: 'A cloud of white rises off the water so thick that “YOU GET lost in it”: YU-GE. The STEAM swallows the monkeys, then gives them back.', image: 'a white cloud rises off hot water so thick that YOU GET lost in it (YU-GE): STEAM swallows the monkeys and then gives them back' },
      { item: 'w:karada', story: 'Your whole BODY folds up like a CAR AT A carwash as you sit down in the pool: KA-RA-DA. Arms, legs, tummy, all under.', image: 'your whole BODY folds up like a CAR AT A carwash as you sit down in hot water, KA-RA-DA: arms, legs, tummy, all of you' },
      { item: 'w:kata', story: 'Saru slaps a wet towel onto your SHOULDER: “CUT-A!” KA-TA. You sink in up to your shoulders, the proper way.', image: 'a monkey slaps a wet towel onto your SHOULDER, “CUT-A!” (KA-TA), and you sink in right up to your shoulders' },
      { item: 'w:senaka', story: 'A monkey SENDS A CAR down your BACK: a tiny toy car rolls from your neck to your waist, SE-NA-KA, and you shiver all along your spine.', image: 'a monkey SENDS A CAR down your BACK, a tiny toy car rolling from your neck to your waist (SE-NA-KA), and you shiver all along your spine' },
      { item: 'g:te-iru', story: 'Saru went into the water an hour ago and IS STILL in it: “TEH… EAR… RU…” he murmurs, eyes shut. Te-form + iru: an action going on, or the state it left behind.', image: 'a monkey went into hot water an hour ago and IS STILL in it, murmuring “TEH… EAR… RU…”: te-form + iru is an action going on, or the state it left' },
    ],
  },
  {
    id: 'p7-taps',
    room: 7,
    map: 'onsen-bath',
    anchor: 'ob-taps',
    name: { jp: 'あらいば', en: 'The Wash Taps' },
    emoji: '🧼',
    memories: [
      { item: 'w:sekken', story: 'KEN steps on a bar of SOAP by the taps and goes flying: “SEK! KEN!” Bubbles float up into the starry sky.', image: 'clumsy KEN steps on a bar of SOAP and goes flying, “SEK! KEN!”, while bubbles float up into the starry sky' },
      { item: 'w:taoru', story: 'A folded white TOWEL sits on the shelf like a little cake. “TAO-RU,” it says, sounding just like itself in English: TOWEL.', image: 'a folded white TOWEL sits on a shelf like a little cake and says “TAO-RU”, sounding just like itself: TOWEL' },
      { item: 'w:atama', story: 'A wooden bucket tips over AT A MAn on the stool and lands upside-down on his HEAD: A-TA-MA. Only his beard sticks out.', image: 'a wooden bucket tips over AT A MAn on a stool and lands upside down on his HEAD (A-TA-MA); only his beard sticks out' },
      { item: 'w:kami-hair', story: 'Your soapy wet HAIR stands up in a peak and begs “COMB ME!” KA-MI. (Same sound as paper, but this one drips.)', image: 'soapy wet HAIR stands up in a peak and begs “COMB ME!” (KA-MI); same sound as paper, but this one drips' },
      { item: 'w:kao', story: 'You wipe the steam off the little mirror and a COW’s FACE stares back at you, chewing calmly: KA-O.', image: 'you wipe the steam off a little mirror and a COW’s FACE stares back, chewing calmly (KA-O)' },
    ],
  },
  {
    id: 'p7-bridge',
    room: 7,
    map: 'onsen',
    anchor: 'o-bridge',
    name: { jp: 'つりばし', en: 'The Swaying Bridge' },
    emoji: '🌉',
    memories: [
      { item: 'w:tsuribashi', story: 'A horse and SURREY carriage BASHes across the rope planks, the whole thing swinging: SURREY-BASH! TSU-RI-BA-SHI, a ROPE BRIDGE over the gorge.', image: 'a horse and SURREY carriage BASHes across swinging rope planks, SURREY-BASH (TSU-RI-BA-SHI): a ROPE BRIDGE strung over a gorge' },
      { item: 'w:tani', story: 'You slip on the bridge and look down past your TAN KNEE into the deep VALLEY: TA-NI. A river glitters far, far below.', image: 'you slip and look down past your TAN KNEE into a deep VALLEY (TA-NI), a river glittering far, far below' },
      { item: 'w:aruku', story: 'A ROOK from a chess set WALKS stiffly across the bridge, one square at a time: A ROOK, A-RU-KU. Step, step, step.', image: 'a chess ROOK WALKS stiffly along, one square at a time (A ROOK, A-RU-KU): step, step, step' },
      { item: 'w:tatsu', story: 'SUE, who has a TAT of a crane, STANDS bolt upright in the middle of the swaying bridge and refuses to sit: TA-TSU.', image: 'a girl called SUE, who has a TAT of a crane, STANDS bolt upright and refuses to sit down (TA-TSU)' },
      { item: 'g:te-tte', story: 'Three hikers named U, TSU and RU cross the bridge, and each lands on the far side with a double stamp: “T-TEH!” Kau becomes katte, tatsu tatte, hairu haitte.', image: 'three hikers named U, TSU and RU each land with a double stamp, “T-TEH!”: kau becomes katte, tatsu tatte, hairu haitte' },
    ],
  },
  {
    id: 'p7-shrine',
    room: 7,
    map: 'onsen',
    anchor: 'o-bell',
    name: { jp: 'ゆがみさまの やしろ', en: 'Shrine of the Spring God' },
    emoji: '⛩️',
    memories: [
      { item: 'w:saru', story: 'A MONKEY swings on the shrine bell rope, rings it far too loud and bows: “SORRY! SA-RU!” Then it rings it again.', image: 'a MONKEY swings on a bell rope, rings it far too loudly and bows, “SORRY! SA-RU!”, then rings it again' },
      { item: 'w:asobu', story: 'Children PLAY peekaboo between the shrine pillars: “AH… SO… BOO!” A-SO-BU. Snowballs, tag and laughter everywhere.', image: 'children PLAY peekaboo between pillars, “AH… SO… BOO!” (A-SO-BU), with snowballs, tag and laughter everywhere' },
      { item: 'w:toru', story: 'Mitsu’s camera flash TORE through the dusk at the shrine: TO-RU! She TAKES A PHOTO of the monkey mid-bow.', image: 'a camera flash TORE through the dusk (TO-RU): someone TAKES A PHOTO of a monkey mid-bow' },
      { item: 'g:te-nde', story: 'Three monks named MU, BU and NU sit before the shrine and, whenever they link one deed to the next, hum “NNN-DEH”: nomu nonde, asobu asonde, yomu yonde.', image: 'three monks named MU, BU and NU hum “NNN-DEH” whenever they link one deed to the next: nomu nonde, asobu asonde, yomu yonde' },
      { item: 'w:kitsune', story: 'A FOX surfs a giant KEY on a TSUNAMI of snow past the shrine gate: KEY-TSU-NEH! Its white-tipped tail flicks as it vanishes.', image: 'a FOX surfs a giant KEY on a TSUNAMI of snow, KEY-TSU-NEH, its white-tipped tail flicking as it vanishes' },
    ],
  },
  {
    id: 'p7-slope',
    room: 7,
    map: 'onsen-trail',
    anchor: 'ot-slope',
    name: { jp: 'たけの さか', en: 'The Bamboo Slope' },
    emoji: '🎋',
    memories: [
      { item: 'w:saka', story: 'A SOCCER ball comes bouncing down the steep SLOPE between the bamboo, and you chase it back up: SA-KA, uphill all the way.', image: 'a SOCCER ball comes bouncing down a steep SLOPE (SA-KA), and you have to chase it back uphill all the way' },
      { item: 'w:noboru', story: 'A mountain goat CLIMBS the bamboo slope singing “NO BORE! NO BORE!” NO-BO-RU. Climbing is never boring.', image: 'a mountain goat CLIMBS higher and higher, singing “NO BORE! NO BORE!” (NO-BO-RU): climbing is never boring' },
      { item: 'w:take', story: 'A panda sits in the middle of the path and holds out a green stalk: “TAKE A stick, TAH-KEH.” BAMBOO, as much as you like.', image: 'a panda holds out a green stalk and says “TAKE A stick” (TAH-KEH): BAMBOO, as much as you like' },
      { item: 'g:te-shite', story: 'On the slope, verbs ending in SU sneeze “SHE-TEH!” (hanasu hanashite); SURU sneezes the same; and KURU flies off on a KITE: kite. The two irregulars, and the s-verbs.', image: 'verbs ending in SU sneeze “SHE-TEH!” (hanasu, hanashite), SURU sneezes the same, and KURU flies off on a KITE (kite): the s-verbs and the two irregulars' },
    ],
  },
  {
    id: 'p7-falls',
    room: 7,
    map: 'onsen-trail',
    anchor: 'ot-falls',
    name: { jp: 'ようろうの たき', en: 'Yōrō Falls' },
    emoji: '💦',
    memories: [
      { item: 'w:taki', story: 'Somebody hung a TACKY plastic sign on the WATERFALL, and the falls roar it right off: TA-KI. White water thunders onto the rocks.', image: 'somebody hangs a TACKY plastic sign on a WATERFALL and the falls roar it right off (TA-KI), white water thundering onto the rocks' },
      { item: 'w:yasumu', story: 'A cow lies in the cool spray at the foot of the falls and sighs “YA… SOO… MOO…” She is TAKING A REST, and nobody may hurry her.', image: 'a cow lies in cool spray and sighs “YA… SOO… MOO…”: she is TAKING A REST, and nobody may hurry her' },
    ],
  },
]

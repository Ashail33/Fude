/**
 * Region 8 — the Castle Town. One main-road tale and three folklore spirits.
 *
 * Main road, “Please and Thank You”: Nurarihyon has eaten the town's
 * courtesy. Give three townsfolk their polite words back by casting them
 * (いらっしゃいませ, どうぞ, ありがとう), win Tadashi's trust at the gate,
 * then free the lord in the keep, who asks what you would like (〜がほしい).
 *
 * Folklore:
 * - Maneki-neko: the kimono shop's beckoning cat has stopped beckoning.
 *   Teach it the polite こちら, choose the paw that invites customers
 *   (ひだり, not みぎ), and bring it a new collar bell.
 * - Rokurokubi: shy Oroku's neck stretches at night and spies her lost comb
 *   “over there”. Help her with ここ / そこ / あそこ.
 * - Hitotsume-kozō: a one-eyed boy in the castle garden keeps a ledger of the
 *   town's rudeness. Call him out with どこ, ask nicely, and trade him dango
 *   (あげる, not くれる or もらう).
 */
import { ACTIVITY_BY_ID } from '../../data/regions'
import { isPassed, type PlayerState } from '../../engine/store'
import { offer } from '../../story/tales/r1-village'
import type { Ctx, TaleContent } from '../../story/tales/types'
import type { Step } from '../../world/Dialog'
import type { Line } from '../../world/types'

const stageOf = (s: PlayerState, tale: string) => s.flags?.[`tale.${tale}`] ?? -1
/** True the first time (per key), for one-off rewards on playful casts. */
const first = (c: Ctx, key: string) => {
  const f = !c.flag(key)
  c.set(key)
  return f
}
/** Keep an activity host's activity reachable after a story line. */
const host = (c: Ctx, activity: string): Step[] => {
  const a = ACTIVITY_BY_ID.get(activity)
  return a ? [{ kind: 'activity', activity: a, speaker: c.speaker, portrait: c.portrait }] : []
}
/** The spirit remembers the girl with the brush; Fude perks up. */
const crumb = (c: Ctx, jp: string, en: string, who: Line, pic: 'cat' | 'lady' | 'child'): Step[] => [
  c.say(jp, en, who, pic),
  c.fude('ふでを もった おんなのこ… ことねの ことだ！ この 町にも きて いたんだね。', 'A girl with a brush… that’s Kotone! She came to this town too.'),
]

// ─── Please and Thank You (main) ──────────────────────────────────────
/** Townsfolk who lost a polite word, and the word that gives it back. */
const RUDE: Record<string, { kana: string; word: string }> = {
  'ct-dango': { kana: 'いらっしゃいませ', word: 'irasshaimase' },
  'ct-porter': { kana: 'どうぞ', word: 'douzo' },
  'ct-fangirl': { kana: 'ありがとう', word: 'arigatou' },
}
const RUDE_IDS = Object.keys(RUDE)
const cured = (c: Ctx, id: string) => c.flag(`r8.polite.${id}`) > 0
const POLITE = new Set(Object.values(RUDE).map((r) => r.kana))

const CURE_LINES: Record<string, [string, string][]> = {
  'ct-dango': [
    ['…いらっしゃいませ！ あっ… いえた！ いらっしゃいませ、いらっしゃいませ！', '…Irasshaimase! Oh… I said it! Welcome, welcome, welcome!'],
    ['だんご、ひとつ どうぞ。おかねは いいの。おれいだから。', 'Have a dango. No charge. It’s my thanks.'],
  ],
  'ct-porter': [
    ['…おさきに どうぞ。…お、おお！ むかしの おれが もどって きた！', '…After you, please. …Oh, oh! The old me is back!'],
    ['にもつ、もちましょうか？ なんてな。はっはっは！', 'Shall I carry your bags? Just kidding. Ha ha ha!'],
  ],
  'ct-fangirl': [
    ['…ありがとう ございました！ そうよ、おきゃくさんには これを いうの！', '…Thank you very much! Yes, that’s what you say to a customer!'],
    ['ほら、もう おきゃくさんが のぞいて いる。いらっしゃいませ！', 'Look, a customer is already peeking in. Welcome!'],
  ],
}

function cure(c: Ctx, id: string, k: string): Step[] | null {
  const want = RUDE[id]
  if (k !== want.kana) return POLITE.has(k) ? [c.narrate('ことばは ひびいたけれど、この ひとが なくした ことばでは ない みたい。', 'The word rings out, but it isn’t the one this person lost.')] : null
  c.learn(want.word)
  if (cured(c, id)) return [c.say(...CURE_LINES[id][1])]
  c.set(`r8.polite.${id}`)
  c.sparkle('spark')
  c.sfx('correct')
  const out: Step[] = [c.narrate(`「${k}」── ことばが きらきら ひかって、むねに もどって いった。`, `“${k}” — the word sparkles and settles back into their heart.`), c.say(...CURE_LINES[id][0])]
  const n = RUDE_IDS.filter((r) => cured(c, r)).length
  if (c.stage('r8-manners') === 0 && n >= 3) out.push(c.fude('3人とも、ていねいな ことばが もどった！ もんの ただしさんに しらせよう！', 'All three have their polite words back! Let’s tell Tadashi at the castle gate!'), ...c.advance('r8-manners'))
  else if (c.stage('r8-manners') === 0) out.push(c.fude(`あと ${3 - n}人！`, `${3 - n} to go!`))
  return out
}

function rudeTalk(c: Ctx, id: string): Step[] | null {
  if (c.stage('r8-manners') !== 0) return null
  if (cured(c, id)) return [c.say(...CURE_LINES[id][1])]
  const hint: Record<string, [string, string]> = {
    'ct-dango': ['みせの ひとが いう「ようこそ」が、ぬけて いるみたい。', 'She’s missing the welcome a shop says to its customers.'],
    'ct-porter': ['「おさきに ＿＿」。ひとに みちを ゆずる ことばを わすれてるね。', '“After you, ___.” He’s forgotten the word for letting someone go first.'],
    'ct-fangirl': ['おきゃくさんに いう、おれいの ことばが ないんだ。', 'She has no word left to thank her customers with.'],
  }
  return [...c.e!.spec.lines!.slice(0, 1).map((l) => c.say(l.jp, l.en)), c.fude(...hint[id])]
}

// ─── Maneki-neko ─────────────────────────────────────────────────────
const NEKO = { jp: 'まねきねこ', en: 'Maneki-neko' }
const OHANA = { jp: 'ごふくやの おはな', en: 'Ohana of the Kimono Shop' }

function choosePaw(c: Ctx): Step {
  return c.choice({ jp: 'どちらの 手を あげる？', en: 'Which paw should it raise?' }, [
    ['migi', 'みぎ（右）の 手', 'The right paw'],
    ['hidari', 'ひだり（左）の 手', 'The left paw'],
  ], (id) => {
    if (id === 'migi') {
      c.learn('migi')
      return [
        c.narrate('ねこは みぎの 手を あげた。チャリン、チャリン… おかねが ころがって きた！ でも、おきゃくさんは ひとりも こない。', 'The cat raises its right paw. Clink, clink… coins come rolling in! But not a single customer.'),
        c.fude('みぎの 手は おかねを まねくんだ。おはなさんが ほしいのは、おきゃくさんだよ！', 'The right paw beckons money. What Ohana wants is customers!'),
      ]
    }
    c.learn('hidari')
    c.sparkle('spark')
    c.sfx('correct')
    return [
      c.narrate('ねこは ひだりの 手を たかく あげた。「こちらへ どうぞ」…', 'The cat raises its left paw high. “This way, please”…'),
      c.narrate('とおりの ひとたちが、ふと たちどまって、みせを のぞきこんだ！', 'People in the street stop, and peer into the shop!'),
      c.say('にゃーん♪', 'Mrrrow♪', NEKO, 'cat'),
      ...c.advance('fk8-maneki'),
    ]
  })
}

// ─── Rokurokubi ──────────────────────────────────────────────────────
const OROKU = { jp: 'おろく', en: 'Oroku' }

// ─── Hitotsume-kozō ──────────────────────────────────────────────────
const KOZO = { jp: 'ひとつめこぞう', en: 'Hitotsume-kozō' }

export const CONTENT: TaleContent[] = [
  {
    items: [
      { id: 'r8-tegata', name: 'Gate Pass', jp: 'つうこうてがた', kana: 'つうこうてがた', emoji: '🪪', desc: 'A wooden pass stamped with the lord’s crest. Tadashi’s trust, in your pocket.' },
      { id: 'r8-kanzashi', name: 'The Lord’s Hairpin', jp: 'とのの かんざし', kana: 'かんざし', emoji: '🌸', desc: 'A silver hairpin shaped like a chrysanthemum, given by the lord himself.' },
    ],
    tales: [
      {
        id: 'r8-manners',
        region: 8,
        main: true,
        title: 'Please and Thank You',
        jp: 'どうぞと ありがとう',
        summary: 'An uninvited old yokai has eaten the castle town’s manners. Shopkeepers bark, porters shove, and the lord is shut in his keep.',
        giver: 'ct-sen',
        stages: [
          { en: 'Give three townsfolk their polite words back: cast いらっしゃいませ at Ofuku the dango seller, どうぞ at Gorohachi the porter, and ありがとう at the fan seller’s daughter', jp: '3人に ていねいな ことばを かえそう：だんごやに「いらっしゃいませ」、にもつもちに「どうぞ」、せんすやの むすめに「ありがとう」', target: RUDE_IDS, map: 'castletown' },
          { en: 'Tell Tadashi at the castle gate that the town is finding its manners', jp: 'おおてもんの ただしに ほうこくしよう', target: ['ct-tadashi'], map: 'castletown' },
          { en: 'Free the lord: face Nurarihyon in the keep, then speak to the lord', jp: 'てんしゅかくの ぬらりひょんを たおし、殿と はなそう', target: ['ck-nurarihyon', 'ck-lord'], map: 'castletown-keep' },
        ],
      },
    ],
    talk: {
      'ct-sen': (c) => {
        const st = c.stage('r8-manners')
        if (st < 0)
          return [
            ...offer(c, 'r8-manners', [
              c.say('ねえ、きいて。おしろに ぬらりひょんって いう ようかいが すみついて から、まちの みんなが らんぼうに なったんだ。', 'Listen. Ever since a yokai called Nurarihyon moved into the castle, everyone in town has turned rude.'),
              c.say('だんごやの おふくさん、にもつもちの ごろはちさん、せんすやの むすめさん… みんな ほんとうは やさしいのに。', 'Ofuku at the dango shop, Gorohachi the porter, the fan seller’s daughter… they’re all kind, really.'),
              c.say('なくした ことばを、まほうで かえして あげて くれない？', 'Could you use your magic to give them back the words they lost?'),
            ]),
            ...host(c, 'r8-words-1'),
          ]
        if (st === 0) {
          const n = RUDE_IDS.filter((id) => cured(c, id)).length
          return [c.say(`あと ${3 - n}人！ みぎ、ひだり、まっすぐ… みんな この とおりに いるよ。`, `${3 - n} more! Right, left, straight on… they’re all on this street.`), ...host(c, 'r8-words-1')]
        }
        if (st === 1) return [c.say('ただしさんは おおてもんの まえ。この とおりを まっすぐ きただよ！', 'Tadashi is at the great gate. Straight up this street, to the north!'), ...host(c, 'r8-words-1')]
        if (st === 2) return [c.say('おしろの なかへ？ すごい！ 庭を とおって、てんしゅかくの とびらだよ。', 'Into the castle? Wow! Through the garden, then the door of the keep.'), ...host(c, 'r8-words-1')]
        return null
      },
      'ct-dango': (c) => rudeTalk(c, 'ct-dango'),
      'ct-porter': (c) => rudeTalk(c, 'ct-porter'),
      'ct-fangirl': (c) => rudeTalk(c, 'ct-fangirl'),
      'ct-tadashi': (c) => {
        const st = c.stage('r8-manners')
        if (st !== 1) return null
        return [
          c.say('なんと… まちに「どうぞ」と「ありがとう」が もどって きた と？', 'What… “please” and “thank you” are coming back to the town?'),
          c.say('かたじけない。だが、殿は まだ おくに とじこめられて いらっしゃる。あの ようかいが、殿の ざに いすわって おるのだ。', 'I am in your debt. But the lord is still shut away inside. That yokai squats in the lord’s own seat.'),
          c.say('これを。つうこうてがた だ。庭を とおって、てんしゅかくへ いって くれ。', 'Take this: a gate pass. Go through the garden to the keep.'),
          ...c.give('r8-tegata'),
          ...c.advance('r8-manners'),
          c.fude('おしろの なかでは、ていねいな ことばが いちばんの まほうだよ。', 'Inside the castle, polite words will be our strongest magic.'),
          ...host(c, 'r8-keigo'),
        ]
      },
      'ck-lord': (c) => {
        const st = c.stage('r8-manners')
        const free = isPassed(c.s(), 'r8-boss')
        if (!free) return null
        if (st === 2)
          return [
            c.say('…おお。こえが でる。よく きて くれた、まほうつかいよ。', '…Ah. My voice returns. You came, young mage.'),
            c.say('そなたの おかげで、しろにも 町にも ことばが もどった。なにか ほしい ものは あるか。', 'Thanks to you, words have returned to castle and town alike. Is there anything you would like?'),
            c.choice({ jp: '殿に こたえよう', en: 'Answer the lord' }, [
              ['nothing', 'いいえ、なにも いりません。', 'No, I need nothing.'],
              ['katana', 'かたなが ほしいです。', 'I would like a katana.'],
              ['dango', 'だんごが ほしいです！', 'I would like dango!'],
            ], (id) => {
              c.learn('hoshii')
              const reply: Record<string, [string, string]> = {
                nothing: ['ははは、よくぞ もうした。だが、うけとって ほしい。', 'Ha ha, nobly said. Still, I want you to have this.'],
                katana: ['かたなは きみには まだ おもかろう。かわりに これを。', 'A katana would be heavy for you yet. Take this instead.'],
                dango: ['ははは！ しょうじきで よい。だんごは あとで とどけさせよう。まずは これを。', 'Ha ha! Honest, I like that. I’ll have dango sent over. First, this.'],
              }
              return [
                c.say(...reply[id]),
                ...c.give('r8-kanzashi'),
                ...c.bagItem('charm', 2),
                ...c.reward(150, 50),
                ...c.advance('r8-manners'),
                c.fude('殿が「ありがとう」って おっしゃった！ この 町は もう だいじょうぶだね。', 'The lord said thank you! This town will be all right now.'),
              ]
            }),
          ]
        return [c.say('この しろの もんは、いつでも ひらいて おる。また いつでも きて くれ。', 'The gates of this castle are always open to you. Come again any time.')]
      },
    },
    cast: {
      'ct-dango': (c, k) => cure(c, 'ct-dango', k),
      'ct-porter': (c, k) => cure(c, 'ct-porter', k),
      'ct-fangirl': (c, k) => cure(c, 'ct-fangirl', k),
      'ct-corner': (c, k) => {
        if (k !== 'かど') return null
        c.learn('kado')
        c.sparkle('spark')
        return [c.narrate('「かど」！ じぞうさまが にっこり わらった… ような きが した。', '“Kado”! The little Jizō on the corner seems to smile.'), ...(first(c, 'cast.ct-corner') ? c.reward(10, 5) : [])]
      },
      'ct-gate-lantern': (c, k) => {
        if (k !== 'もん') return null
        c.learn('mon')
        c.sparkle('spark')
        return [c.narrate('「もん」！ とうろうに ひが ともり、おおてもんが ぎいっと きしんだ。', '“Mon”! The lantern flickers alight and the great gate creaks.'), ...(first(c, 'cast.ct-gate-lantern') ? c.reward(10, 5) : [])]
      },
      'ct-street': (c, k) => {
        if (k !== 'とおり') return null
        c.learn('toori')
        c.sparkle('dust')
        return [c.narrate('「とおり」！ ほんどおりの ちょうちんが いっせいに ゆれた。', '“Tōri”! Every lantern on Main Street sways at once.'), ...(first(c, 'cast.ct-street') ? c.reward(10, 5) : [])]
      },
      'ct-chaya-lantern': (c, k) => {
        if (k !== 'ちゃや') return null
        c.learn('chaya')
        c.sparkle('spark')
        return [c.narrate('「ちゃや」！ あまい だんごの においが ふわっと ひろがった。', '“Chaya”! The sweet smell of dango drifts out.'), ...(first(c, 'cast.ct-chaya-lantern') ? c.reward(10, 5) : [])]
      },
      'ct-milestone': (c, k) => {
        if (k !== 'まち') return null
        c.learn('machi')
        c.sparkle('dust')
        return [c.narrate('「まち」！ いしの もじが くっきり うかびあがった。', '“Machi”! The carved letters stand out crisp and clear.'), ...(first(c, 'cast.ct-milestone') ? c.reward(10, 5) : [])]
      },
      'ct-well': (c, k) => {
        if (k === 'ここ') {
          c.learn('koko')
          c.sparkle('ripple')
          return [c.narrate('「ここ」！ いどの そこから こだまが かえって きた。「ここ… ここ…」', '“Koko”! An echo comes back from the bottom of the well: “here… here…”'), ...(first(c, 'cast.ct-well') ? c.reward(10, 5) : [])]
        }
        if (k === 'どこ') {
          c.learn('doko')
          return [c.narrate('「どこ？」 …いどは こたえた。「ここ」。', '“Where?” …The well answers: “Here.”')]
        }
        return null
      },
      'ct-cat': (c, k) => (k === 'ねこ' ? (c.learn('neko'), [c.say('にゃ？', 'Mew?'), c.fude('この ねこは、ふつうの ねこ みたい。', 'This one seems to be an ordinary cat.')]) : null),
      'ct-angler': (c, k) => {
        if (k !== 'こんにちは') return null
        c.learn('konnichiwa')
        return [c.say('…こんにちは。ははは、ひさしぶりに いったわい。ほら、こいが よって きた。', '…Konnichiwa. Ha, first time I’ve said that in a while. Look, the carp are swimming over.'), ...(first(c, 'cast.ct-angler') ? c.reward(10, 5) : [])]
      },
    },
    mapCast: {
      castletown: (c, k) => {
        if (k === 'ようこそ') {
          c.learn('youkoso')
          return [c.narrate('「ようこそ」！ どこかで だれかが、おなじ ことばで こたえた。', '“Yōkoso”! Somewhere, someone calls the same word back.')]
        }
        if (k === 'しつれいします') {
          c.learn('shitsureishimasu')
          return [c.narrate('「しつれいします」。とおりの ひとが、おどろいて ぺこりと おじぎを した。', '“Shitsurei shimasu.” A passer-by, startled, bows back.')]
        }
        return null
      },
    },
  },

  // ─── Folklore ──────────────────────────────────────────────────────
  {
    yokai: [
      {
        id: 'maneki-neko',
        region: 8,
        name: 'Maneki-neko',
        jp: '招き猫',
        kana: 'まねきねこ',
        emoji: '🐈',
        lore: 'In the Edo period a poor temple priest shared his little food with his cat. One stormy day a passing lord saw the cat beckoning at the gate and stepped inside, just before lightning split the tree where he had stood. In gratitude he became the temple’s patron. Ever since, beckoning cats sit in shop fronts: a raised left paw invites customers, a raised right paw invites money.',
        hint: 'A cat by a shop door has forgotten how to wave…',
        words: ['kochira', 'hidari', 'migi', 'irasshaimase'],
      },
      {
        id: 'rokurokubi',
        region: 8,
        name: 'Rokurokubi',
        jp: 'ろくろ首',
        kana: 'ろくろくび',
        emoji: '🧣',
        lore: 'By day she looks like any other woman. But at night, while she sleeps, her neck stretches out and out, winding through the house to peer over screens or lap the oil from lamps. Many rokurokubi never know what they are; they only wake up tired, with strange dreams of looking down on rooftops.',
        hint: 'Someone at the stage sees farther than anyone else…',
        words: ['asoko', 'koko', 'soko'],
      },
      {
        id: 'hitotsume-kozo',
        region: 8,
        name: 'Hitotsume-kozō',
        jp: '一つ目小僧',
        kana: 'ひとつめこぞう',
        emoji: '👁️',
        lore: 'A little bald boy in a monk’s robe with one huge eye and a long tongue, who loves to jump out and startle people, and does little worse. On the eighth day of the twelfth and second months he was said to go from house to house, noting every misdeed in a ledger for the god of plague, so families hung bamboo baskets on poles: with so many “eyes”, the one-eyed boy would flee, outstared.',
        hint: 'One big eye watches from the castle garden’s long grass…',
        words: ['doko', 'ageru', 'hoshii', 'onegaishimasu'],
      },
    ],
    items: [
      { id: 'fk8-suzu', name: 'Red Collar Bell', jp: 'あかい すず', kana: 'すず', emoji: '🔔', desc: 'A tiny bell on a red cord, the kind beckoning cats wear.' },
      { id: 'fk8-kushi', name: 'Lacquer Comb', jp: 'うるしの くし', kana: 'くし', emoji: '🪮', desc: 'A black lacquer comb with a gold chrysanthemum. Found by the moat.' },
      { id: 'fk8-dango', name: 'Sweet Soy Dango', jp: 'みたらしだんご', kana: 'みたらしだんご', emoji: '🍡', desc: 'Three dumplings on a stick, glazed in sweet soy sauce. Still warm.' },
      { id: 'fk8-ledger', name: 'The Prankster’s Ledger', jp: 'いたずらの ちょうめん', kana: 'ちょうめん', emoji: '📒', desc: 'A ledger of every rude word spoken in the castle town. Its pages are fading to blank.' },
    ],
    tales: [
      {
        id: 'fk8-maneki',
        region: 8,
        yokai: 'maneki-neko',
        title: 'The Cat Who Forgot to Beckon',
        jp: 'てを あげない まねきねこ',
        summary: 'Ohana’s kimono shop has had no customers since its beckoning cat stopped beckoning.',
        giver: 'fk8-ohana',
        stages: [
          { en: 'Find the kimono shop’s cat on Main Street', jp: 'ごふくやの ねこを さがそう', target: ['fk8-neko'], map: 'castletown' },
          { en: 'Teach the cat the polite “this way”: cast こちら at it', jp: 'ねこに「こちら」と となえよう', target: ['fk8-neko'], map: 'castletown' },
          { en: 'Help the cat choose which paw to raise to invite customers', jp: 'おきゃくさんを まねく 手を えらぼう', target: ['fk8-neko'], map: 'castletown' },
          { en: 'Tell Ohana her cat is beckoning again', jp: 'おはなに ほうこくしよう', target: ['fk8-ohana'], map: 'castletown' },
          { en: 'Give the cat its new collar bell', jp: 'ねこに あたらしい すずを あげよう', target: ['fk8-neko'], map: 'castletown' },
        ],
      },
      {
        id: 'fk8-rokuro',
        region: 8,
        yokai: 'rokurokubi',
        title: 'The Woman Who Sees Too Far',
        jp: 'とおくが 見える ひと',
        summary: 'Shy Oroku watches every play from the back row, and somehow sees it best of all.',
        giver: 'fk8-oroku',
        stages: [
          { en: 'Help Oroku say where she saw her lost comb (far from you both)', jp: 'おろくに くしを 見た ばしょの ことばを おしえよう', target: ['fk8-oroku'], map: 'castletown' },
          { en: 'Find the comb by the moat in the castle square', jp: 'おほりの そばで くしを さがそう', target: ['fk8-comb'], map: 'castletown' },
          { en: 'Bring the comb back to Oroku at the stage', jp: 'くしを おろくに かえそう', target: ['fk8-oroku'], map: 'castletown' },
        ],
      },
      {
        id: 'fk8-kozo',
        region: 8,
        yokai: 'hitotsume-kozo',
        title: 'The Ledger of Rudeness',
        jp: 'しつれいの ちょうめん',
        summary: 'Someone keeps pulling up the garden’s moss and sticking out a very long tongue at the gardener.',
        giver: 'cg-gardener',
        stages: [
          { en: 'Find the prankster in the long grass: cast どこ (where?)', jp: 'くさむらで「どこ」と よびかけよう', target: ['fk8-kozo'], map: 'castletown-garden' },
          { en: 'Ask the one-eyed boy for his ledger, politely', jp: 'ひとつめこぞうに ちょうめんを たのもう', target: ['fk8-kozo'], map: 'castletown-garden' },
          { en: 'Get dango from the stall granny in the market', jp: 'いちばの やたいで だんごを もらおう', target: ['ct-stall-dango'], map: 'castletown' },
          { en: 'Give the dango to the one-eyed boy', jp: 'ひとつめこぞうに だんごを あげよう', target: ['fk8-kozo'], map: 'castletown-garden' },
        ],
      },
    ],
    entities: {
      castletown: [
        { id: 'fk8-ohana', kind: 'npc', sprite: 'merchant', x: 51, y: 18, dir: 'down', name: OHANA, lines: [{ jp: 'いらっしゃいませ… って、だれも いないのに いって しまう。', en: 'Welcome… I keep saying it, though there’s nobody here.' }] },
        { id: 'fk8-neko', kind: 'npc', sprite: 'cat', x: 49, y: 21, dir: 'down', name: NEKO, lines: [{ jp: '…にゃ。', en: '…Mew.' }] },
        { id: 'fk8-oroku', kind: 'npc', sprite: 'lady', x: 14, y: 37, dir: 'up', name: OROKU, lines: [{ jp: 'しばいは うしろの せきから 見るのが すきなんです。…なぜか、よく 見えるので。', en: 'I like watching plays from the back row. …For some reason, I see them best from there.' }] },
        { id: 'fk8-comb', kind: 'landmark', tile: 'flowers', x: 9, y: 13, name: { jp: 'きらりと ひかる もの', en: 'Something Glinting' }, lines: [{ jp: 'いしだたみの すきまで、なにかが ひかって いる。', en: 'Something glints between the paving stones.' }] },
      ],
      'castletown-garden': [{ id: 'fk8-kozo', kind: 'npc', sprite: 'child', x: 13, y: 24, dir: 'left', name: KOZO, lines: [{ jp: 'べろべろ ばあ！', en: 'Blehhh!' }] }],
    },
    visible: {
      'fk8-comb': (s) => stageOf(s, 'fk8-rokuro') === 1,
    },
    ghost: {
      // hiding in the long grass until called out with どこ
      'fk8-kozo': (s) => stageOf(s, 'fk8-kozo') < 1,
    },
    talk: {
      // ── Maneki-neko ────────────────────────────────────────────────
      'fk8-ohana': (c) => {
        const st = c.stage('fk8-maneki')
        if (st < 0)
          return offer(c, 'fk8-maneki', [
            c.say('うちの みせの まねきねこが、手を あげなく なったの。', 'Our shop’s beckoning cat has stopped raising its paw.'),
            c.say('あの こが「こちらへ どうぞ」って まねいて くれないと、おきゃくさんが こないのよ。', 'Without it beckoning “this way, please”, no customers come.'),
          ])
        if (st <= 2) return [c.say('ねこは とおりの むこうがわ、ちょうちんの そばに いるわ。', 'The cat is across the street, by the lantern.')]
        if (st === 3)
          return [
            c.say('まあ！ おきゃくさんが こんなに！ いらっしゃいませ！ いらっしゃいませ！', 'Oh my! So many customers! Welcome! Welcome!'),
            c.say('あの こに、これを あげて。あたらしい すずよ。', 'Give this to the cat, would you? A new bell.'),
            ...c.give('fk8-suzu'),
            ...c.advance('fk8-maneki'),
          ]
        if (st === 4) return [c.say('すずを つけて あげてね。', 'Do put the bell on for it.')]
        return [c.say('いらっしゃいませ！ きょうも おきゃくさんで いっぱい！', 'Welcome! Full of customers again today!')]
      },
      'fk8-neko': (c) => {
        const st = c.stage('fk8-maneki')
        if (st < 0) return [c.narrate('ねこは まえあしを ひざに のせた まま、ぴくりとも うごかない。', 'The cat sits with both paws in its lap, not moving a whisker.')]
        if (st === 0)
          return [
            c.narrate('しろい ねこが、ちょうちんの したで しょんぼり すわって いる。くびには すずの ない あかい ひも。', 'A white cat sits glumly under the lantern. Around its neck, a red cord with no bell.'),
            c.say('……にゃ。（どう やって まねくんだっけ…）', '…Mew. (How did I beckon, again…?)', NEKO, 'cat'),
            c.fude('まねきねこだ！ ていねいな「こっち」の ことばを わすれちゃったんだね。「こちら」と となえて あげよう！', 'A maneki-neko! It’s forgotten the polite word for “this way”. Let’s cast こちら for it!'),
            ...c.advance('fk8-maneki'),
          ]
        if (st === 1) return [c.fude('ていねいな「こっち」は… 「こちら」！', 'The polite “this way” is… こちら!')]
        if (st === 2)
          return [
            c.say('にゃ。（みぎの 手？ ひだりの 手？）', 'Mew. (Right paw? Left paw?)', NEKO, 'cat'),
            c.fude('みぎの 手は おかねを、ひだりの 手は ひとを まねくんだって。', 'They say the right paw beckons money, and the left paw beckons people.'),
            choosePaw(c),
          ]
        if (st === 3) return [c.say('にゃーん♪', 'Mrrrow♪', NEKO, 'cat'), c.fude('おはなさんに しらせよう！', 'Let’s tell Ohana!')]
        if (st === 4) {
          if (!c.has('fk8-suzu')) return [c.say('にゃ？', 'Mew?', NEKO, 'cat')]
          c.take('fk8-suzu')
          c.sparkle('spark')
          return [
            c.narrate('あかい ひもに すずを つけて あげた。チリン♪', 'You tie the bell to its red cord. Chirin♪'),
            c.say('にゃーん！ こちらへ どうぞ、こちらへ どうぞ♪', 'Mrrrow! This way please, this way please♪', NEKO, 'cat'),
            ...c.reward(60, 25),
            ...c.advance('fk8-maneki'),
            ...c.seal('maneki-neko'),
            ...crumb(c, 'にゃ。むかし、ふでの おんなのこが、ぼくに まつ ことを おしえて くれた。手を あげて、まつ。それが まねく ことだって。', 'Mew. Long ago a girl with a brush taught me to wait. Raise your paw, and wait: that’s what beckoning means.', NEKO, 'cat'),
          ]
        }
        return [c.say('チリン♪ にゃーん。', 'Chirin♪ Mrrrow.', NEKO, 'cat')]
      },

      // ── Rokurokubi ─────────────────────────────────────────────────
      'fk8-oroku': (c) => {
        const st = c.stage('fk8-rokuro')
        if (st < 0)
          return offer(c, 'fk8-rokuro', [
            c.say('あの… わたし、だいじな くしを なくして しまって。', 'Um… I’ve lost my precious comb.'),
            c.say('ゆうべ、ゆめの なかで くしを 見たんです。たかい ところから… ずっと とおくに。', 'Last night I saw it in a dream. From somewhere high up… far, far away.'),
            c.say('でも「とおくの ばしょ」の ことばが、どうしても でて こなくて…', 'But I just can’t find the word for “that far-off place”…'),
          ])
        if (st === 0)
          return [
            c.say('くしは、わたしからも あなたからも とおい ところに ありました。…なんて いうんでしたっけ？', 'The comb was somewhere far from me and far from you. …What’s the word again?'),
            c.ask({ jp: 'わたしからも あいてからも とおい ばしょ…', en: 'A place far from both me and you…' }, 'あそこ', (ok) => {
              if (!ok) return [c.say('…ちがう ような きが します。', '…I don’t think that’s it.'), c.fude('ちかくは「ここ」、あいての そばは「そこ」。りょうほうから とおいのは…？', 'Near me is ここ, near you is そこ. Far from both of us is…?')]
              c.learn('asoko')
              c.sparkle('spark')
              return [
                c.say('あそこ！ そう、あそこです！', 'Over there! Yes, over there!'),
                c.narrate('おろくの くびが、するする するする… のびて いった！', 'Oroku’s neck goes slithering up, and up, and up!'),
                c.say('きゃっ！ ま、また… あ、でも 見えた！ あそこ、おほりの そばの いしだたみ！', 'Eek! N-not again… oh, but I can see it! Over there, on the paving by the moat!'),
                c.fude('く、くびが ながい… ろくろくびだ！', 'H-her neck… she’s a rokurokubi!'),
                ...c.advance('fk8-rokuro'),
              ]
            }),
          ]
        if (st === 1) return [c.say('くしは あそこ、おほりの そばです。…くび、もう もどりましたよね？', 'The comb is over there, by the moat. …My neck is back to normal, isn’t it?')]
        if (st === 2) {
          if (!c.has('fk8-kushi')) return [c.say('くしは みつかりましたか？', 'Did you find the comb?')]
          return [
            c.say('あっ、それ！ わたしの くし！ …それ、いま どこに ありますか？', 'Oh, that’s it! My comb! …Where is it right now?'),
            c.choice({ jp: 'くしは あなたの 手の なか。どう こたえる？', en: 'The comb is in your hand. How do you answer?' }, [
              ['koko', 'ここに あります。', 'It’s here (by me).'],
              ['soko', 'そこに あります。', 'It’s there (by you).'],
              ['asoko', 'あそこに あります。', 'It’s over there.'],
            ], (id) => {
              if (id !== 'koko')
                return [c.say(id === 'soko' ? 'そこ…？ わたしの そばには ありませんよ？' : 'あそこ…？ また くびを のばさないと…', id === 'soko' ? 'There…? It isn’t by me, though?' : 'Over there…? I’d have to stretch my neck again…'), c.fude('くしは {name}の 手の なか。じぶんの そばは…？', 'The comb is in your own hand. Near yourself is…?')]
              c.learn('koko')
              c.take('fk8-kushi')
              c.sparkle('spark')
              return [
                c.say('ここ、ですね。そして わたしから 見ると… そこ。ふふ、おなじ くしなのに。', 'Here, you say. And from where I stand… there. Hehe, the same comb.'),
                c.narrate('おろくは くしを かみに さした。くびが うれしそうに すこしだけ のびた。', 'Oroku slides the comb into her hair. Her neck stretches, just a little, with happiness.'),
                c.say('ほんとうは、しって いたんです。よる、くびが のびる こと。でも この まちなら、うしろの せきでも いちばん よく 見えるから。', 'I knew, really. That my neck stretches at night. But in this town, it means I see the stage best of all, even from the back row.'),
                ...c.reward(60, 25),
                ...c.advance('fk8-rokuro'),
                ...c.seal('rokurokubi'),
                ...crumb(c, 'むかし、ふでを もった おんなのこが いいました。「とおくが 見えるのは、すてきな ことだよ」って。', 'Long ago, a girl with a brush told me: “Being able to see far is a wonderful thing.”', OROKU, 'lady'),
              ]
            }),
          ]
        }
        return [c.say('こんやも しばい。…うしろの せきで 見ますね。', 'There’s a play tonight too. …I’ll watch from the back row.')]
      },
      'fk8-comb': (c) => {
        if (c.stage('fk8-rokuro') !== 1) return null
        c.sfx('chest')
        return [c.narrate('はなの なかに、うるしの くしが おちて いた。', 'A lacquer comb lies among the flowers.'), ...c.give('fk8-kushi'), ...c.advance('fk8-rokuro')]
      },

      // ── Hitotsume-kozō ─────────────────────────────────────────────
      'cg-gardener': (c) => {
        const st = c.stage('fk8-kozo')
        if (st < 0)
          return offer(c, 'fk8-kozo', [
            c.say('こまったもんだ。くさむらに だれかが いて、こけを ぬいたり、ながい したを べろっと だしたり。', 'It’s a nuisance. Someone hides in the long grass, pulling up the moss and sticking out a long tongue at me.'),
            c.say('すがたは 見えん。よびかけても こたえん。「どこだ」と いうと、くすくす わらう だけでな。', 'I can’t see him. He won’t answer. Ask “where are you?” and he just giggles.'),
          ])
        if (st === 0) return [c.say('ひだりの おくの くさむらだ。よびかけて みな。', 'In the long grass, back on the left. Try calling out.')]
        if (st < 4) return [c.say('ひとつめこぞう、か。わるい やつでは ないんだが。', 'A one-eyed boy, eh. He’s not a bad sort.')]
        return [c.say('こけが また はえて きた。ありがとうよ。', 'The moss is growing back. Thank you.')]
      },
      'fk8-kozo': (c) => {
        const st = c.stage('fk8-kozo')
        if (st <= 0) return [c.narrate('くさむらが がさっと ゆれた。…だれかが いる。', 'The long grass rustles. …Someone is there.'), ...(st === 0 ? [c.fude('「どこ」と よびかけて みよう！', 'Let’s call out どこ!')] : [])]
        if (st === 1)
          return [
            c.say('この ちょうめん？ まちの しつれいな ことば、ぜーんぶ かいて あるんだ。とおりの ひとが どなった、とか。', 'This ledger? Every rude word in town is written in it. Who yelled at whom in the street, all of it.'),
            c.say('これを びょうきの かみさまに わたすのが、おいらの しごと。…でも、わたしたく ないな。みんな ほんとうは やさしいもん。', 'My job is to hand it to the god of sickness. …But I don’t want to. Everybody’s kind, really.'),
            c.choice({ jp: 'ちょうめんを たのもう', en: 'Ask for the ledger' }, [
              ['kuremasenka', 'その ちょうめんを くれませんか。', 'Won’t you give me that ledger?'],
              ['agemasu', 'その ちょうめんを あげます。', 'I will give you that ledger.'],
              ['yokose', 'ちょうめんを よこせ！', 'Hand over the ledger!'],
            ], (id) => {
              if (id === 'agemasu') {
                c.learn('ageru')
                return [c.say('え？ これ、おいらのだよ？ くれる んじゃ なくて、もらいたいんでしょ？', 'Huh? It’s already mine. You want to GET it, don’t you?', KOZO, 'child'), c.fude('あげるは じぶんから あいてへ。ほしい ときは「くれませんか」だよ。', 'あげる goes from you to someone else. When you want something: くれませんか.')]
              }
              if (id === 'yokose') return [c.say('べーっだ！ そんな いいかたじゃ、ちょうめんに かくぞ！', 'Bleh! Talk like that and I’ll write YOU in the ledger!', KOZO, 'child')]
              c.learn('kureru')
              return [
                c.say('ていねいだね！ いいよ… でも、ただじゃ いや。おいら、だんごが ほしい！', 'So polite! OK… but not for free. I want dango!', KOZO, 'child'),
                c.fude('いちばの やたいの おばあさんに たのもう！', 'Let’s ask the stall granny in the market!'),
                ...c.advance('fk8-kozo'),
              ]
            }),
          ]
        if (st === 2) return [c.say('だんご、まだ？ おいら、みたらしが ほしいな〜', 'Dango yet? I want the sweet soy kind~', KOZO, 'child')]
        if (st === 3) {
          if (!c.has('fk8-dango')) return [c.say('だんご、どこ〜？', 'Where’s my dango~?', KOZO, 'child')]
          return [
            c.choice({ jp: 'だんごを わたそう。なんと いう？', en: 'Hand over the dango. What do you say?' }, [
              ['agemasu', 'はい、だんごを あげます。', 'Here, I’ll give you dango.'],
              ['kuremasu', 'はい、だんごを くれます。', 'Here, (you) give me dango.'],
              ['moraimasu', 'はい、だんごを もらいます。', 'Here, I’ll receive dango.'],
            ], (id) => {
              if (id !== 'agemasu')
                return [c.say(id === 'kuremasu' ? 'おいらが くれるの？ だんごを？ ぎゃくだよ〜！' : 'もらうの？ おいらの だんごを？ ずるい〜！', id === 'kuremasu' ? 'I’M giving YOU dango? It’s the other way round!' : 'YOU’RE getting MY dango? No fair!', KOZO, 'child'), c.fude('じぶんから あいてへ わたす ときは… 「あげます」！', 'When it goes from you to someone else… あげます!')]
              c.learn('ageru')
              c.take('fk8-dango')
              c.sparkle('spark')
              return [
                c.say('わーい！ ありがとう！ じゃあ、ちょうめん、あげる！', 'Yay! Thank you! Then the ledger’s yours!', KOZO, 'child'),
                ...c.give('fk8-ledger'),
                c.narrate('ちょうめんを ひらくと、しつれいな ことばが ひとつずつ きえて、まっしろな ページに なって いった。', 'As you open the ledger, the rude words fade one by one, leaving clean white pages.'),
                c.say('まちに「どうぞ」が もどれば、もう かく ことも ないや。おいらも、ちょっと やすみたかったんだ。', 'Once the town says “please” again, there’ll be nothing left to write. I could use a rest, anyway.', KOZO, 'child'),
                ...c.reward(60, 25),
                ...c.advance('fk8-kozo'),
                ...c.seal('hitotsume-kozo'),
                ...crumb(c, 'むかし、ふでの おねえちゃんが、おいらの ちょうめんの さいごの ページに かいたんだ。「きょうは、みんな やさしかった」って。', 'Long ago, the brush girl wrote on the last page of my ledger: “Today, everyone was kind.”', KOZO, 'child'),
              ]
            }),
          ]
        }
        return [c.say('おいら、もう いたずら しないよ。…たぶん。べろべろ ばあ！', 'I won’t play pranks any more. …Probably. Blehhh!', KOZO, 'child')]
      },
      'ct-stall-dango': (c) => {
        if (c.stage('fk8-kozo') !== 2) return null
        if (c.has('fk8-dango')) return [c.say('だんご、はやく もって いって あげな。', 'Hurry and take that dango to them.')]
        return [
          c.say('だんごかい？ ちゃんと たのめたら、あげるよ。', 'Dango, is it? Ask me properly and it’s yours.'),
          c.ask({ jp: 'だんごを たのもう', en: 'Order a dango politely' }, ['だんごをおねがいします', 'だんごをください', 'だんごひとつおねがいします', 'だんごをひとつおねがいします', 'だんごをひとつください'], (ok) => {
            if (!ok) return [c.say('ん？ もう いちど。「だんごを おねがいします」って。', 'Hm? Once more. “Dango, please.”')]
            c.learn('dango')
            c.learn('onegaishimasu')
            return [c.say('はい、みたらし だんご！ まいど！', 'Here you are, sweet soy dango! Thank you!'), ...c.give('fk8-dango'), ...c.advance('fk8-kozo')]
          }),
        ]
      },
    },
    cast: {
      'fk8-neko': (c, k) => {
        if (k === 'こちら') {
          c.learn('kochira')
          if (c.stage('fk8-maneki') !== 1) return [c.say('にゃ♪', 'Mew♪', NEKO, 'cat')]
          c.sparkle('spark')
          c.sfx('correct')
          return [
            c.narrate('「こちら」！ ねこの みみが ぴんと たった。', '“Kochira”! The cat’s ears prick straight up.'),
            c.say('にゃ！（こちらへ どうぞ… そうだ、こう いうんだった！）', 'Mew! (This way, please… that’s how it goes!)', NEKO, 'cat'),
            c.say('にゃ…？（でも、どっちの 手を あげるんだっけ？）', 'Mew…? (But which paw do I raise?)', NEKO, 'cat'),
            ...c.advance('fk8-maneki'),
            choosePaw(c),
          ]
        }
        if (k === 'あちら' || k === 'そちら' || k === 'どちら') return [c.say('にゃ？（それは… ちがう ほうこう…）', 'Mew? (That’s… a different direction…)', NEKO, 'cat'), c.fude('「この ほうへ」の ていねいな いいかたは？', 'What’s the polite way to say “this way”?')]
        if (k === 'ねこ') return (c.learn('neko'), [c.say('にゃ？', 'Mew?', NEKO, 'cat')])
        return null
      },
      'fk8-oroku': (c, k) => {
        if (k !== 'ながい') return null
        c.learn('nagai')
        return [c.narrate('「ながい」… おろくの くびが、ひゅるっと のびかけた！', '“Nagai”… Oroku’s neck starts to stretch!'), c.say('や、やめて ください！ ひるまは だめなんです！', 'P-please don’t! Not in the daytime!', OROKU, 'lady')]
      },
      'fk8-kozo': (c, k) => {
        if (k === 'どこ') {
          c.learn('doko')
          if (c.stage('fk8-kozo') !== 0) return [c.say('ここだよ〜！', 'Over here~!', KOZO, 'child')]
          c.sparkle('leaf')
          c.sfx('correct')
          return [
            c.narrate('「どこ？」── くさむらから、ぴょこんと あたまが でた。', '“Where?” — a head pops up out of the long grass.'),
            c.say('ここだよ〜！ べろべろ ばあ！', 'Here I am~! Blehhh!', KOZO, 'child'),
            c.narrate('つるつる あたまの こどもの かおに、おおきな めが ひとつ。ながい したが べろーん。', 'A little shaved head, one enormous eye, and a long tongue lolling out.'),
            c.fude('ひとつめこぞう！ おどかすのが すきな ようかいだよ。そんなに こわく ないから だいじょうぶ。', 'A hitotsume-kozō! A yokai who loves to startle people. He’s not really scary.'),
            c.say('なんだ、おどろかないの？ つまんない。…あ、この ちょうめん？ 見たいの？', 'What, not scared? Boring. …Oh, this ledger? Want to see?', KOZO, 'child'),
            ...c.advance('fk8-kozo'),
          ]
        }
        if (k === 'め') return (c.learn('me'), [c.say('おいらの め、おおきいでしょ！', 'Big eye, huh!', KOZO, 'child')])
        return null
      },
    },
  },
]

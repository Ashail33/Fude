/**
 * Region 6 tales — the Harbour of Numbers.
 *
 * Main road: the Umibōzu swallowed the harbour's numbers. Count the
 * porter's boxes, read the stopped tide clock so the lighthouse can burn
 * again, find the day Captain Kai's ship sails, then face the sea-monk in
 * the cove. A side tale: the harbour cat wants exactly one fish.
 *
 * Folklore of the sea: a mermaid who has lost count of her pearls (and her
 * years), the drowned sailors who beg passing boats for a ladle, and the
 * red-haired Shōjō who loves sake but can't count his money.
 */
import { ACTIVITY_BY_ID } from '../../data/regions'
import { isPassed } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import { offer } from '../../story/tales/r1-village'
import type { Ctx, TaleContent } from '../../story/tales/types'

const UME = { jp: 'ウメ', en: 'Ume' }
const TOKI = { jp: 'トキ', en: 'Toki' }
const KAI = { jp: 'カイせんちょう', en: 'Captain Kai' }
const TARO = { jp: 'タロ', en: 'Taro' }
const NINGYO = { jp: 'にんぎょ', en: 'Mermaid' }
const FUNA = { jp: 'ふなゆうれい', en: 'Ship Ghosts' }
const SHOJO = { jp: 'しょうじょう', en: 'Shōjō' }

/** Keep an activity host's activity reachable after a short story line. */
const host = (c: Ctx, activity: string): Step[] => {
  const a = ACTIVITY_BY_ID.get(activity)
  return a ? [{ kind: 'activity', activity: a, speaker: c.speaker, portrait: c.portrait }] : []
}

// ─── The Swallowed Numbers (main road) ───────────────────────────────

function countBoxes(c: Ctx): Step[] {
  return [
    c.narrate('そうこの まえに はこが ならんでいる。ひとつ、ふたつ… ぜんぶで よっつ。', 'Boxes are lined up in front of the warehouse. One, two… four in all.'),
    c.ask({ jp: 'はこは いくつ？（〜つで こたえよう）', en: 'How many boxes? (answer with 〜つ)' }, ['よっつ', 'yottsu', '四つ'], (ok) => {
      if (!ok) return [c.say('え？ そんなに あったっけ…', 'Huh? Were there that many…?', TARO), c.fude('ひとつ、ふたつ、みっつ、よっつ… 〜つで かぞえよう！', 'Hitotsu, futatsu, mittsu, yottsu… count them with 〜つ!')]
      c.learn('hako')
      c.learn('ikutsu')
      c.sfx('correct')
      return [
        c.say('よっつ！ そうだ、よっつだ！ ああ、あたまが すっきりした！', 'Four! That’s right, four! Ah, my head feels clear again!', TARO),
        c.say('とうだいの トキじいさんも こまってるって。とけいが とまったんだとさ。', 'Old Toki at the lighthouse is in trouble too. His clock stopped, they say.', TARO),
        ...c.advance('h-numbers'),
      ]
    }),
  ]
}

function readClock(c: Ctx): Step[] {
  return [
    c.narrate('とけいの はりが とまっている。みじかい はりは 9と 10の あいだ。ながい はりは 6。', 'The clock’s hands have stopped. The short hand is between 9 and 10; the long hand points at 6.'),
    c.ask({ jp: 'いま なんじ？', en: 'What time does it say?' }, ['くじはん', 'kujihan', '九時半'], (ok) => {
      if (!ok) return [c.say('ちがう ちがう。9じは「きゅうじ」じゃ なくて… なんじゃったかな。', 'No, no. 9 o’clock isn’t “kyūji”, it’s… now what was it.', TOKI, 'elder'), c.fude('9じは「くじ」！ そして 30ぷんは「はん」だよ。', '9 o’clock is くじ! And thirty minutes is はん.')]
      c.learn('ji')
      c.learn('han')
      c.sparkle('spark')
      c.sfx('correct')
      return [
        c.narrate('カチッ… チク、タク、チク、タク。とけいが また うごきだした！', 'Click… tick, tock, tick, tock. The clock is moving again!'),
        c.say('くじはん！ ばんの ひを ともす じかんじゃ！', 'Half past nine! Time to light the evening lamp!', TOKI, 'elder'),
        c.narrate('とうだいの ランプに、あかい ひが ともった。', 'A warm flame blooms in the great lamp.'),
        c.say('ありがとう。カイの ふねも、これで よるでも かえって こられる。', 'Thank you. Now Kai’s ship can find its way home, even at night.', TOKI, 'elder'),
        ...c.advance('h-numbers'),
      ]
    }),
  ]
}

function sailingDay(c: Ctx): Step[] {
  return [
    c.say('しゅっぱつは「つきの ひ」だ。…つきの ひって、なんようびだっけ？', 'We sail on “the moon’s day”. …Which day of the week is that again?', KAI, 'sailor'),
    c.choice(
      { jp: 'つきの ひは なんようび？', en: 'Which day is the moon’s day?' },
      [
        ['ka', 'かようび', 'Kayōbi'],
        ['getsu', 'げつようび', 'Getsuyōbi'],
        ['nichi', 'にちようび', 'Nichiyōbi'],
      ],
      (id) => {
        if (id === 'ka') return [c.say('かようびは「ひ」の ひだぞ！ ふねが もえちまう！', 'Kayōbi is fire’s day! We’d set the ship ablaze!', KAI, 'sailor')]
        if (id === 'nichi') return [c.say('にちようびは おひさまの ひ。やすみの ひだ！', 'Nichiyōbi is the sun’s day. That’s our day off!', KAI, 'sailor')]
        c.learn('getsuyoubi')
        c.sfx('correct')
        return [
          c.say('げつようび！ 月の ひ！ よし、げつようびの あさ ごじに しゅっぱつだ！', 'Getsuyōbi! The moon’s day! Right — we sail Monday at five in the morning!', KAI, 'sailor'),
          c.say('…だが、うみぼうずが いりえに いる かぎり、ふねは だせん。', '…But as long as the Umibōzu lurks in the cove, no ship can leave.', KAI, 'sailor'),
          c.fude('にしの いりえ… いきましょう、{name}さん！', 'The cove to the west… let’s go, {name}!'),
          ...c.advance('h-numbers'),
        ]
      },
    ),
  ]
}

// ─── One Fish for the Cat ────────────────────────────────────────────

function buyOneFish(c: Ctx): Step[] {
  return [
    c.say('なにに する？ ちゃんと かぞえて ちゅうもん してね！', 'What’ll it be? Order with the right count, mind!'),
    c.ask({ jp: 'さかなを ひとつ… じゃなくて、ちゃんと ちゅうもん しよう', en: 'Order ONE fish — with the fish counter!' }, ['さかなをいっぴきください', 'いっぴきください', 'さかないっぴきください', 'いっぴき', 'さかなを一匹ください', '一匹ください'], (ok) => {
      if (!ok) return [c.say('さかなは「ひき」で かぞえるの。ひとつ じゃ ないよ！', 'Fish are counted with ひき, not ひとつ!'), c.fude('1ぴきは「いっぴき」。ちいさく「っ」が はいるよ。', 'One fish is いっぴき — with a little っ.')]
      c.learn('sakana')
      c.sfx('chest')
      return [c.say('はい、いっぴき！ ねこに あげるの？ やさしいね。', 'One fish, here you go! For the cat? How kind.'), ...c.give('h-fish')]
    }),
  ]
}

// ─── Folklore: the mermaid's pearls ──────────────────────────────────

function mermaid(c: Ctx): Step[] {
  const st = c.stage('fk6-ningyo')
  if (st < 0)
    return offer(
      c,
      'fk6-ningyo',
      [
        c.narrate('いわの うえに、さかなの しっぽの おんなの ひとが すわっている。', 'On the rock sits a woman with the tail of a fish.'),
        c.say('しんじゅの くびかざりが きれて、しおだまりに おちたの。', 'My pearl necklace broke and fell into the tide pool.', NINGYO, 'villager-b'),
        c.say('でも、いくつ あったか わすれて しまった… かずを なくしたのよ。', 'But I’ve forgotten how many there were… I’ve lost my numbers.', NINGYO, 'villager-b'),
      ],
      ['かぞえて あげる', 'I’ll count them'],
      ['また あとで', 'Later'],
    )
  if (st === 0) return [c.say('しおだまりの しんじゅを かぞえて きて。', 'Count the pearls in the tide pool for me.', NINGYO, 'villager-b')]
  if (st === 1)
    return [
      c.say('ななつ… そう、ななつ だったわ。ありがとう。', 'Seven… yes, there were seven. Thank you.', NINGYO, 'villager-b'),
      c.say('もう ひとつ、わすれた かず が ある。わたしの としよ。いしに かいて あるけど、よめないの。', 'There’s one more number I’ve forgotten: my age. It’s carved on the stone, but I can’t read it.', NINGYO, 'villager-b'),
      c.narrate('いわに「八百」と きざまれている。', 'Carved into the rock: 八百.'),
      c.ask({ jp: '「八百」を よもう', en: 'Read 八百 aloud' }, ['はっぴゃく', 'happyaku'], (ok) => {
        if (!ok) return [c.say('…ちがう きが するわ。', '…That doesn’t sound right.', NINGYO, 'villager-b'), c.fude('はち + ひゃく は、おとが かわるよ。「はっ…ぴゃく」！', 'Hachi + hyaku changes its sound: “ha-ppyaku”!')]
        c.learn('hachi')
        c.learn('hyaku')
        c.sfx('correct')
        return [
          c.say('はっぴゃく ねん。…ながい ながい じかんね。', 'Eight hundred years. …Such a long, long time.', NINGYO, 'villager-b'),
          c.say('さいごに、しんじゅを いれる ものが ほしいの。うみの ものが いいわ。', 'Lastly, I need something to keep the pearls in. Something from the sea.', NINGYO, 'villager-b'),
          ...c.advance('fk6-ningyo'),
        ]
      }),
    ]
  if (st === 2) return [c.say('しんじゅを いれる、うみの もの… なにか ないかしら。', 'Something from the sea to hold my pearls…', NINGYO, 'villager-b'), c.fude('うみの もの… 「かい」を となえて みよう！', 'Something from the sea… let’s cast かい (shell)!')]
  return [c.say('なみの かずを かぞえて いるの。いちまん、にまん…', 'I’m counting the waves. Ten thousand, twenty thousand…', NINGYO, 'villager-b')]
}

// ─── Folklore: the ship ghosts ───────────────────────────────────────

function shipGhosts(c: Ctx): Step[] | null {
  const st = c.stage('fk6-funa')
  if (st < 0)
    return offer(
      c,
      'fk6-funa',
      [
        c.narrate('こわれた ふねの まわりに、あおじろい ひとかげが ゆれている。', 'Pale figures sway around the broken boat.'),
        c.say('ひしゃくを… かせ… ひしゃくを かせえ…', 'Lend us… a ladle… lend us a ladle…', FUNA, 'wisp'),
        c.fude('ふなゆうれい！ ひしゃくを わたすと、ふねに みずを いれて しずめちゃうんだって！', 'Ship ghosts! If you give them a ladle, they fill your boat with water and sink it!'),
        c.fude('でも… おしえて もらった ことが ある。そこの ない ひしゃくを わたせば だいじょうぶ！', 'But… I was told a trick: hand them a ladle with no bottom!'),
      ],
      ['ひしゃくを さがす', 'Find a ladle'],
      ['にげる', 'Run'],
    )
  if (st === 0)
    return [
      c.narrate('ふねの なかに、ひしゃくが みっつ ころがっている。', 'Three ladles lie in the boat.'),
      c.choice(
        { jp: 'どの ひしゃくを わたす？', en: 'Which ladle will you hand over?' },
        [
          ['new', 'あたらしい ひしゃく', 'A brand-new ladle'],
          ['big', 'おおきい ひしゃく', 'A big ladle'],
          ['hole', 'そこの ない ひしゃく', 'A ladle with no bottom'],
        ],
        (id) => {
          if (id !== 'hole') return [c.narrate('ザブン！ ふねに みずが どんどん はいって くる！', 'Splash! Water pours into the boat!'), c.fude('だめだめ！ そこの ない ひしゃくを えらんで！', 'No, no! Pick the one with no bottom!')]
          c.sfx('correct')
          return [
            c.narrate('ゆうれいたちは ひしゃくで みずを すくう。…でも みずは ぜんぶ こぼれる。', 'The ghosts scoop and scoop… but every drop runs out.'),
            c.say('…すくえない。…でも、なんだか、たのしい。', '…Can’t scoop. …But somehow, it’s fun.', FUNA, 'wisp'),
            c.say('わしらは むにん。むにんぶん、ほしい。ひしゃくは なんぼん いる？', 'There are six of us. We want one each. How many ladles do we need?', FUNA, 'wisp'),
            ...c.advance('fk6-funa'),
          ]
        },
      ),
    ]
  if (st === 1)
    return [
      c.say('むにん… ひしゃくは なんぼん？', 'Six of us… how many ladles?', FUNA, 'wisp'),
      c.ask({ jp: 'ひしゃく 6ぽん。〜本で こたえよう', en: 'Six ladles — answer with the counter 〜本' }, ['ろっぽん', 'roppon', '六本'], (ok) => {
        if (!ok) return [c.say('…たりない… たりない…', '…not enough… not enough…', FUNA, 'wisp'), c.fude('ろく + ほん は「ろっぽん」。いっぽん、にほん、さんぼん… おとが かわるよ！', 'Roku + hon becomes roppon. Ippon, nihon, sanbon… the sound changes!')]
        c.sfx('correct')
        return [c.say('ろっぽん… ろっぽん…♪ ありがたい…', 'Six ladles… six ladles…♪ How kind…', FUNA, 'wisp'), c.fude('みんなを うみへ かえして あげよう。「なみ」を となえて！', 'Let’s send them home to the sea. Cast なみ — wave!'), ...c.advance('fk6-funa')]
      }),
    ]
  if (st === 2) return [c.say('…うみへ… かえりたい…', '…home… to the sea…', FUNA, 'wisp'), c.fude('「なみ」を となえよう！', 'Cast なみ!')]
  return null
}

// ─── Folklore: the Shōjō ─────────────────────────────────────────────

function shojo(c: Ctx): Step[] {
  const st = c.stage('fk6-shojo')
  if (st < 0)
    return offer(
      c,
      'fk6-shojo',
      [
        c.narrate('まっかな かみの、さるのような かおの せいれいが、つぼを だいて ないている。', 'A spirit with flaming red hair and a monkey-like face is hugging a jar and crying.'),
        c.say('おさけが かいたいのに、おかねの かずが わからないんじゃ！', 'I want to buy sake, but I can’t count my money!', SHOJO, 'imp'),
      ],
      ['いっしょに かぞえる', 'Count it together'],
      ['また こんど', 'Another time'],
    )
  if (st === 0)
    return [
      c.narrate('しょうじょうは せんえんさつを 3まい もっている。', 'The Shōjō is holding three thousand-yen notes.'),
      c.ask({ jp: 'ぜんぶで いくら？', en: 'How much is that altogether?' }, ['さんぜんえん', 'sanzenen', 'さんぜん', '三千円'], (ok) => {
        if (!ok) return [c.say('うーむ？ もっと あるはずじゃ…', 'Hmmm? Surely there’s more…', SHOJO, 'imp'), c.fude('さん + せん は「さんぜん」。せ が ぜ に なるよ！', 'San + sen becomes sanzen — せ turns into ぜ!')]
        c.learn('sen-1000')
        c.learn('en')
        c.sfx('correct')
        return [c.say('さんぜんえん！ これなら たくさん かえるぞ！', 'Three thousand yen! That’ll buy plenty!', SHOJO, 'imp'), ...c.advance('fk6-shojo')]
      }),
    ]
  if (st === 1)
    return [
      c.say('おさけを さんぼん ほしい。みせで なんと いえば いい？', 'I want three bottles of sake. What do I say at the shop?', SHOJO, 'imp'),
      c.choice(
        { jp: 'おさけ 3本、ください', en: 'Three bottles of sake, please' },
        [
          ['mittsu', 'おさけを みっつ ください', 'Osake o mittsu kudasai'],
          ['sanbon', 'おさけを さんぼん ください', 'Osake o sanbon kudasai'],
          ['sannin', 'おさけを さんにん ください', 'Osake o sannin kudasai'],
        ],
        (id) => {
          if (id === 'sannin') return [c.say('さんにん！？ おさけが ひとに なったぞ！', 'Three PEOPLE?! The sake turned into people!', SHOJO, 'imp')]
          if (id === 'mittsu') return [c.say('うむ… つうじるが、びんは「ほん」で かぞえるのが いきじゃ。', 'Hm… they’d understand, but bottles are best counted with ほん.', SHOJO, 'imp')]
          c.sfx('correct')
          return [c.say('さんぼん！ よし、おぼえたぞ！', 'Three bottles! Right, I’ve got it!', SHOJO, 'imp'), c.fude('さいごに「ありがとう」を おしえて あげよう！ となえて！', 'Lastly, let’s teach him “thank you”. Cast it!'), ...c.advance('fk6-shojo')]
        },
      ),
    ]
  if (st === 2) return [c.say('おれいの ことばを しらんのじゃ… なんと いう？', 'I don’t know the words for thanks… what do you say?', SHOJO, 'imp'), c.fude('「ありがとう」を となえよう！', 'Cast ありがとう!')]
  return [c.say('この つぼの おさけは、いくら のんでも なくならんのじゃ。ひっく。', 'The sake in this jar never runs out, however much I drink. Hic.', SHOJO, 'imp')]
}

export const CONTENT: TaleContent[] = [
  {
    items: [
      { id: 'h-fish', name: 'One Fish', jp: 'さかな いっぴき', kana: 'さかないっぴき', emoji: '🐟', desc: 'Exactly one fish, ordered with the right counter. A cat somewhere is waiting.' },
      { id: 'h-tide-table', name: 'Tide Table', jp: 'しおの ひょう', kana: 'しおのひょう', emoji: '📜', desc: 'Toki’s table of the tides, hour by hour. The numbers on it glow faintly.' },
    ],
    tales: [
      {
        id: 'h-numbers',
        region: 6,
        main: true,
        title: 'The Swallowed Numbers',
        jp: 'のみこまれた かず',
        summary: 'The Umibōzu swallowed the harbour’s numbers: nobody can count, the clocks have stopped and no ship can sail.',
        giver: 'ha-porter',
        stages: [
          { en: 'Help Taro the porter count his boxes', jp: 'にもつはこびの タロの はこを かぞえよう', target: ['ha-porter'], map: 'harbour' },
          { en: 'Read the stopped tide clock in the lighthouse', jp: 'とうだいの とまった とけいを よもう', target: ['hl-clock'], map: 'harbour-lighthouse' },
          { en: 'Tell Captain Kai which day his ship sails', jp: 'カイせんちょうに しゅっぱつの ようびを おしえよう', target: ['hs-kai'], map: 'harbour-ship' },
          { en: 'Face the Umibōzu in the cove, then tell Ume', jp: 'いりえの うみぼうずと たたかい、ウメに しらせよう', target: ['hc-umibozu', 'hm-ume'], map: 'harbour-cove' },
        ],
      },
      {
        id: 'h-cat',
        region: 6,
        title: 'Exactly One Fish',
        jp: 'さかなを いっぴき',
        summary: 'The harbour cat won’t stop begging. It wants exactly one fish — ordered properly.',
        giver: 'ha-cat',
        stages: [
          { en: 'Order one fish from the fishwife on the market street', jp: 'さかなうりに さかなを いっぴき ちゅうもん しよう', target: ['ha-fishwife'], map: 'harbour' },
          { en: 'Give the fish to the harbour cat', jp: 'みなとねこに さかなを あげよう', target: ['ha-cat'], map: 'harbour' },
        ],
      },
    ],
    entities: {},
    talk: {
      'ha-porter': (c) => {
        const st = c.stage('h-numbers')
        if (st < 0)
          return offer(c, 'h-numbers', [
            c.say('たいへんだ！ はこを かぞえようと したら、かずが でて こないんだ！', 'This is bad! I went to count the boxes and the numbers won’t come out!', TARO),
            c.say('みなとじゅう そうなんだ。うみぼうずが かずを のみこんだって…', 'The whole harbour’s the same. They say the Umibōzu swallowed the numbers…', TARO),
          ])
        if (st === 0) return countBoxes(c)
        return [c.say('はこは よっつ。もう まちがえないぞ！', 'Four boxes. I won’t get it wrong again!', TARO)]
      },
      'hl-clock': (c) => (c.stage('h-numbers') === 1 ? readClock(c) : null),
      'hl-keeper': (c) => {
        const st = c.stage('h-numbers')
        if (st === 1) return [c.say('とけいが くじはんの まま とまって しまった… よめるかね？', 'The clock stopped and I can’t read it anymore… can you?', TOKI, 'elder'), ...host(c, 'r6-words-3')]
        if (st >= 2 && !c.flag('h.tide-table')) {
          c.set('h.tide-table')
          return [c.say('おれいに、しおの ひょうを あげよう。ときを よむ ちからに なる。', 'Take my tide table as thanks. It will help you read the hours.', TOKI, 'elder'), ...c.give('h-tide-table'), ...c.reward(40, 15), ...host(c, 'r6-words-3')]
        }
        return null
      },
      'hs-kai': (c) => {
        const st = c.stage('h-numbers')
        if (st === 2) return sailingDay(c)
        return null
      },
      'hm-ume': (c) => {
        const st = c.stage('h-numbers')
        if (st === 3 && isPassed(c.s(), 'r6-boss'))
          return [
            c.say('きいたよ！ うみぼうずを おとなしく させたって！', 'I heard! You calmed the Umibōzu!', UME, 'fisher'),
            c.say('ねだんも かずも ぜんぶ もどった。これ、みなとからの おれい！', 'Prices and numbers are all back. This is a thank-you from the whole harbour!', UME, 'fisher'),
            ...c.bagItem('ether', 2),
            ...c.reward(120, 50),
            ...c.advance('h-numbers'),
            ...host(c, 'r6-shop'),
          ]
        if (st === 3) return [c.say('うみぼうずは にしの いりえよ。きを つけてね！', 'The Umibōzu is in the cove to the west. Be careful!', UME, 'fisher'), ...host(c, 'r6-shop')]
        return null
      },
      'ha-cat': (c) => {
        const st = c.stage('h-cat')
        if (st < 0)
          return offer(
            c,
            'h-cat',
            [c.narrate('ねこが じっと こちらを みている。「にゃ（いっぴき）」と いった きが する。', 'The cat stares at you. It seems to say: “Nya (one fish).”'), c.fude('さかなが ほしいのかな？ さかなうりで かって あげよう！', 'Does it want a fish? Let’s buy one from the fishwife!')],
            ['かって あげる', 'Buy it a fish'],
            ['ごめんね', 'Sorry, cat'],
          )
        if (st === 1 && c.has('h-fish')) {
          c.take('h-fish')
          c.sparkle('spark')
          return [c.narrate('ねこは さかなを くわえて、ごろごろ いった。', 'The cat takes the fish and purrs.'), c.narrate('…ねこが くびわから ちいさな かぎを おとして いった。', '…It drops a little key from its collar as it goes.'), ...c.bagItem('charm', 1), ...c.reward(45, 20), ...c.advance('h-cat')]
        }
        if (st >= 2) return [c.say('にゃ〜ん。', 'Mrrrow.')]
        return null
      },
      'ha-fishwife': (c) => (c.stage('h-cat') === 0 && !c.has('h-fish') ? buyOneFish(c) : null),
      'ha-gen': (c) => (c.stage('h-numbers') < 0 ? [c.say('タロが こまってたぞ。はなしを きいて やってくれ。', 'Taro’s in a fix. Go hear him out.'), ...host(c, 'r6-words-1')] : null),
    },
    cast: {
      'ha-cat': (c, k) => {
        if (k !== 'さかな') return null
        return [c.say('にゃ！ …にゃ？（ことばの さかなは たべられない…）', 'Nya! …Nya? (You can’t eat a word-fish…)'), c.fude('ほんものの さかなを いっぴき かって あげよう！', 'Let’s buy it a real fish — just one!')]
      },
      'ha-boat': (c, k) => (k === 'ふね' ? (c.learn('fune'), c.sparkle('ripple'), [c.narrate('ふねが すこし うかんだ きが した。', 'The boat seems to float a little.')]) : null),
      'ha-anchor': (c, k) => (k === 'みなと' ? (c.learn('minato'), [c.narrate('いかりの ひが あかるく ひかった。「みなとを まもる」。', 'The anchor monument glows: “Guardian of the harbour.”')]) : null),
      'hl-lamp': (c, k) => (k === 'とうだい' || k === 'ひ' ? (c.learn('toudai'), c.sparkle('spark'), [c.narrate('ランプの ひが ぽっと おおきく なった。', 'The lamp flame swells with a soft whoomp.')]) : null),
    },
    mapCast: {
      harbour: (c, k) => {
        if (k === 'なみ') return (c.learn('nami'), c.sparkle('ripple'), [c.narrate('ざざーん… なみの おとが こたえた。', 'Shhhaaa… the waves answer.')])
        if (k === 'うみ') return [c.narrate('うみは きょうも ひろい。', 'The sea is wide as ever.')]
        return null
      },
    },
  },

  // ─── Folklore ─────────────────────────────────────────────────────────
  {
    yokai: [
      {
        id: 'ningyo',
        region: 6,
        name: 'Ningyo',
        jp: '人魚',
        kana: 'にんぎょ',
        emoji: '🧜‍♀️',
        lore: 'Japanese mermaids have a fish’s body and a human face, and their singing carries over the waves. Legend says whoever eats a ningyo’s flesh lives unnaturally long: Yao Bikuni, the eight-hundred-year nun, tasted it as a girl and watched every friend she had grow old.',
        hint: 'In the cove, someone has lost count of her pearls — and her years.',
        words: ['hachi', 'hyaku', 'kai', 'nana'],
      },
      {
        id: 'funayurei',
        region: 6,
        name: 'Funayūrei',
        jp: '舟幽霊',
        kana: 'ふなゆうれい',
        emoji: '👻',
        lore: 'The ghosts of drowned sailors rise on foggy nights and drift up to passing boats, begging “Lend us a ladle!” — then fill the boat with seawater until it sinks. Wise sailors carry a ladle with its bottom knocked out, so the ghosts can scoop forever and do no harm.',
        hint: 'Pale figures by a broken boat keep asking for something to scoop with.',
        words: ['fune', 'nami', 'roku'],
      },
      {
        id: 'shojo',
        region: 6,
        name: 'Shōjō',
        jp: '猩々',
        kana: 'しょうじょう',
        emoji: '🍶',
        lore: 'Shōjō are red-haired sea sprites with monkey-like faces who adore sake and dance on the waves. In the Noh play “Shōjō”, an honest sake-seller who keeps serving one is rewarded with a jar of sake that never runs dry.',
        hint: 'On a rocky islet, a red-haired spirit hugs a jar and sobs over his money.',
        words: ['sen-1000', 'en', 'okane'],
      },
    ],
    items: [{ id: 'fk6-pearl', name: 'Mermaid’s Pearl', jp: 'にんぎょの しんじゅ', kana: 'にんぎょのしんじゅ', emoji: '🫧', desc: 'One of seven pearls. Hold it up and you hear waves counting themselves.' }],
    tales: [
      {
        id: 'fk6-ningyo',
        region: 6,
        title: 'The Mermaid’s Pearls',
        jp: 'にんぎょの しんじゅ',
        summary: 'A mermaid’s pearl necklace broke in the tide pool — and she has lost count of more than pearls.',
        yokai: 'ningyo',
        giver: 'fk6-ningyo',
        stages: [
          { en: 'Count the pearls in the tide pool', jp: 'しおだまりの しんじゅを かぞえよう', target: ['fk6-pool'], map: 'harbour-cove' },
          { en: 'Read the mermaid’s age carved on her rock', jp: 'いわに きざまれた にんぎょの としを よもう', target: ['fk6-ningyo'], map: 'harbour-cove' },
          { en: 'Give her something from the sea to hold the pearls (cast かい at her)', jp: '「かい」を となえて、しんじゅを いれる ものを あげよう', target: ['fk6-ningyo'], map: 'harbour-cove' },
        ],
      },
      {
        id: 'fk6-funa',
        region: 6,
        title: 'Lend Us a Ladle',
        jp: 'ひしゃくを かせ',
        summary: 'Ship ghosts drift around a wreck in the cove, begging for a ladle. Give them the wrong one and you sink.',
        yokai: 'funayurei',
        giver: 'fk6-funa',
        stages: [
          { en: 'Hand the ghosts the right ladle', jp: 'ただしい ひしゃくを わたそう', target: ['fk6-funa'], map: 'harbour-cove' },
          { en: 'Tell them how many ladles six ghosts need', jp: 'ひしゃくが なんぼん いるか こたえよう', target: ['fk6-funa'], map: 'harbour-cove' },
          { en: 'Send them home on the waves (cast なみ)', jp: '「なみ」で うみへ かえそう', target: ['fk6-funa'], map: 'harbour-cove' },
        ],
      },
      {
        id: 'fk6-shojo',
        region: 6,
        title: 'The Bottomless Jar',
        jp: 'つきない つぼ',
        summary: 'A red-haired Shōjō wants to buy sake, but he can’t count his money or his bottles.',
        yokai: 'shojo',
        giver: 'fk6-shojo',
        stages: [
          { en: 'Count the Shōjō’s money', jp: 'しょうじょうの おかねを かぞえよう', target: ['fk6-shojo'], map: 'harbour-cove' },
          { en: 'Teach him to order three bottles', jp: 'おさけ 3本の ちゅうもんを おしえよう', target: ['fk6-shojo'], map: 'harbour-cove' },
          { en: 'Teach him to say thank you (cast ありがとう)', jp: '「ありがとう」を おしえよう', target: ['fk6-shojo'], map: 'harbour-cove' },
        ],
      },
    ],
    entities: {
      'harbour-cove': [
        { id: 'fk6-ningyo', kind: 'npc', sprite: 'villager-b', x: 20, y: 9, dir: 'left', name: NINGYO, lines: [{ jp: 'ら、ら、ら… なみの かずを かぞえる うた…', en: 'La, la, la… a song that counts the waves…' }] },
        { id: 'fk6-pool', kind: 'landmark', tile: 'pot', x: 15, y: 9, name: { jp: 'しおだまり', en: 'Tide Pool' }, lines: [{ jp: 'すきとおった みずの なかで、なにかが ひかっている。', en: 'Something glints in the clear water.' }] },
        { id: 'fk6-funa', kind: 'npc', sprite: 'wisp', x: 24, y: 15, dir: 'left', name: FUNA, lines: [{ jp: 'ひしゃくを… かせ…', en: 'Lend us… a ladle…' }] },
        { id: 'fk6-shojo', kind: 'npc', sprite: 'imp', x: 39, y: 25, dir: 'down', name: SHOJO, lines: [{ jp: 'ひっく。おさけは いいのう。', en: 'Hic. Sake is lovely.' }] },
      ],
    },
    ghost: {
      // the ship ghosts fade once they go home
      'fk6-funa': (s) => (s.flags?.['tale.fk6-funa'] ?? -1) >= 3,
    },
    talk: {
      'fk6-ningyo': (c) => mermaid(c),
      'fk6-pool': (c) => {
        if (c.stage('fk6-ningyo') !== 0) return null
        return [
          c.narrate('しおだまりの そこに、しろい しんじゅが ならんでいる。', 'White pearls lie on the bottom of the pool.'),
          c.ask({ jp: 'しんじゅは いくつ？（7こ）', en: 'How many pearls? (there are 7)' }, ['ななつ', 'nanatsu', '七つ'], (ok) => {
            if (!ok) return [c.fude('ななこ… じゃなくて、〜つ で かぞえると？ むっつの つぎ！', 'Not “nanako”… with 〜つ? The one after むっつ!')]
            c.learn('nana')
            c.sfx('correct')
            return [c.narrate('ななつの しんじゅを ひろいあげた。', 'You scoop up all seven pearls.'), ...c.give('fk6-pearl'), ...c.advance('fk6-ningyo')]
          }),
        ]
      },
      'fk6-funa': (c) => shipGhosts(c),
      'fk6-shojo': (c) => shojo(c),
    },
    cast: {
      'fk6-ningyo': (c, k) => {
        if (k !== 'かい' || c.stage('fk6-ningyo') !== 2) return null
        c.learn('kai')
        c.take('fk6-pearl')
        c.sparkle('ripple')
        return [
          c.narrate('おおきな まきがいが、ぽとりと てのひらに おちた。', 'A great spiral shell drops into your palm.'),
          c.say('きれいな かい… しんじゅの おうちに ぴったり。', 'What a lovely shell… a perfect home for my pearls.', NINGYO, 'villager-b'),
          c.say('おれいに、ひとつ おしえて あげる。むかし、ふでを もった おんなのこが ここで いったの。「かずより ながい やくそくを かく」って。', 'In thanks, I’ll tell you something. Long ago, a girl with a brush sat here and said, “I’ll write a promise longer than any number.”', NINGYO, 'villager-b'),
          ...c.reward(70, 30),
          ...c.advance('fk6-ningyo'),
          ...c.seal('ningyo'),
        ]
      },
      'fk6-funa': (c, k) => {
        if (k !== 'なみ' || c.stage('fk6-funa') !== 2) return null
        c.learn('nami')
        c.sparkle('ripple')
        return [
          c.narrate('やさしい なみが ゆうれいたちを つつみ、おきへ はこんで いった。', 'A gentle wave gathers the ghosts and carries them out to sea.'),
          c.say('…ありがとう… これで… ねむれる…', '…thank you… now… we can sleep…', FUNA, 'wisp'),
          c.fude('ばいばい… ゆっくり やすんでね。', 'Bye-bye… rest well.'),
          ...c.reward(70, 30),
          ...c.advance('fk6-funa'),
          ...c.seal('funayurei'),
        ]
      },
      'fk6-shojo': (c, k) => {
        if (k !== 'ありがとう' || c.stage('fk6-shojo') !== 2) return null
        c.learn('arigatou')
        c.sparkle('spark')
        return [
          c.say('ありがとう！ ありがとう！ なんと いい ことばじゃ！', 'Arigatō! Arigatō! What a wonderful word!', SHOJO, 'imp'),
          c.narrate('しょうじょうは なみの うえで くるくる おどりだした。', 'The Shōjō starts spinning and dancing on the waves.'),
          c.say('おれいに、この つぼの おさけを… いや、おまえは まだ こどもか。では これを。', 'In thanks, have some of my sake… oh, you’re too young. Then take this instead.', SHOJO, 'imp'),
          ...c.bagItem('ether', 1),
          ...c.reward(70, 30),
          ...c.advance('fk6-shojo'),
          ...c.seal('shojo'),
        ]
      },
    },
  },
]

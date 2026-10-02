/**
 * Region 9 — the Snowbound Temple. One main-road tale and three folklore
 * spirits.
 *
 * Main road, "The Frozen Script": Yuki-onna has frozen every character in
 * the temple. Kuu sends you to the abbot, who can no longer read his own
 * name. Thaw the season scrolls in the scriptorium by chanting their
 * readings (はる・なつ・あき); the winter scroll is gone. Genta the
 * bell-keeper says the ice cave opens to the great bell: ring it with its
 * reading (かね). Face Yuki-onna, win back the winter scroll, and help the
 * abbot read his name, 冬月 (とうげつ), in on'yomi.
 *
 * Folklore:
 * - Yukinko (雪ん子): Yuki, the snow child, asks to be carried, and grows
 *   heavier and heavier, as snow children do. Answer her snow riddles to
 *   make her light, then build her a snow friend (ゆきだるま).
 * - Tsurara-onna (つらら女): the icicle wife by the lake, who vanished in a
 *   hot bath long ago, wants to leave her family a letter: 冬に また 来ます.
 *   Fetch washi, pick the right kanji, write it (かく) and deliver it.
 * - Mokumokuren (目目連): eyes in the torn screen of the scriptorium are
 *   starved of things to read. Show them kanji by their radicals, then patch
 *   the screen with paper (かみ).
 */
import { ACTIVITY_BY_ID, bossOf } from '../../data/regions'
import { isPassed, type PlayerState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import { offer } from '../../story/tales/r1-village'
import type { Ctx, TaleContent } from '../../story/tales/types'

const ABBOT = { jp: 'ろうし', en: 'The Abbot' }
const TOUGETSU = { jp: 'とうげつ ろうし', en: 'Abbot Tōgetsu' }
const GENTA = { jp: 'げんた', en: 'Genta' }
const YUKI = { jp: 'ゆき', en: 'Yuki' }
const YUKIONNA = { jp: 'ゆきおんな', en: 'Yuki-onna' }
const TSURARA = { jp: 'つららおんな', en: 'Tsurara-onna' }
const EYES = { jp: 'もくもくれん', en: 'Mokumokuren' }
const FISHER = { jp: 'りょうし', en: 'Ice Fisher' }

const stageOf = (s: PlayerState, tale: string) => s.flags?.[`tale.${tale}`] ?? -1
const bossBeaten = (s: PlayerState) => isPassed(s, bossOf(9).id)
/** True the first time (per key): one-off rewards on playful casts. */
const first = (c: Ctx, key: string) => {
  const f = !c.flag(key)
  c.set(key)
  return f
}
/** Keep an activity host's activity reachable after a short story line. */
const host = (c: Ctx, activity: string): Step[] => {
  const a = ACTIVITY_BY_ID.get(activity)
  return a ? [{ kind: 'activity', activity: a, speaker: c.speaker, portrait: c.portrait }] : []
}

// ─── The Frozen Script (main) ────────────────────────────────────────
const SCROLLS: Record<string, { kana: string; word: string; kanji: string; jp: string; en: string }> = {
  'sl-scroll-haru': { kana: 'はる', word: 'haru', kanji: '春', jp: 'さくらの えが いろを とりもどした！', en: 'The cherry blossom painting blooms back into colour!' },
  'sl-scroll-natsu': { kana: 'なつ', word: 'natsu', kanji: '夏', jp: 'ほたるの えが ちかちか ひかりだした！', en: 'The fireflies in the painting start to twinkle!' },
  'sl-scroll-aki': { kana: 'あき', word: 'aki', kanji: '秋', jp: 'もみじの えが あかく そまった！', en: 'The maple leaves in the painting flush red!' },
}
const SEASON_WORDS = new Set(['はる', 'なつ', 'あき', 'ふゆ'])

function thawScroll(c: Ctx, id: string, k: string): Step[] | null {
  const sc = SCROLLS[id]
  if (k !== sc.kana) return SEASON_WORDS.has(k) ? [c.narrate('こおりは びくとも しない。…この かけじくの 季節じゃ ないみたい。', 'The ice doesn’t budge. …That isn’t this scroll’s season.')] : null
  c.learn(sc.word)
  c.sparkle('spark')
  if (c.stage('r9-frozen') !== 1 || c.flag(`r9.${id}`)) return [c.narrate(sc.jp, sc.en)]
  c.set(`r9.${id}`)
  c.sfx('correct')
  const done = Object.keys(SCROLLS).filter((s) => c.flag(`r9.${s}`)).length
  const out: Step[] = [c.narrate(`「${sc.kanji}」の こおりが、ぱきっと われた！`, `The ice over ${sc.kanji} cracks apart!`), c.narrate(sc.jp, sc.en)]
  if (done >= 3)
    out.push(
      c.narrate('三つの かけじくが そろって、へやの くうきが すこし あたたかく なった。', 'With three scrolls awake, the air in the hall grows a little warmer.'),
      c.fude('でも… 冬の かけじくが ない。くぎだけが のこってる。', 'But… the winter scroll is missing. Only the hook is left.'),
      c.say('冬の かけじくは… ゆきおんなが もっていった。かねつきの げんたなら、こおりの あなの ことを しっておる。', 'The winter scroll… Yuki-onna took it. Genta the bell-keeper knows the way into the ice cave.', ABBOT, 'monk'),
      ...c.advance('r9-frozen'),
    )
  else out.push(c.fude(`あと ${3 - done}つ！`, `${3 - done} to go!`))
  return out
}

function ringBell(c: Ctx): Step[] {
  c.learn('kane')
  c.sparkle('ripple')
  if (c.stage('r9-frozen') !== 2) return [c.narrate('ゴーーン…… おとが 山に しみこんでいく。', 'Gooon… the sound soaks into the mountains.'), ...(first(c, 'cast.sb-bell') ? c.reward(10, 5) : [])]
  return [
    c.narrate('ゴーーン…… 鐘の 音が 雪山に ひびきわたった。', 'GOOON… the bell’s sound rolls out across the snowy peaks.'),
    c.say('いい 音じゃ！ では、もんだい。おおみそかの よる、この 鐘は なんかい つく？', 'A fine sound! Now, a question. On New Year’s Eve, how many times is this bell struck?', GENTA, 'monk'),
    c.choice({ jp: 'じょやの かねは なんかい？', en: 'How many strikes for the New Year’s Eve bell?' }, [['108', '百八かい', '108 times'], ['100', '百かい', '100 times'], ['12', '十二かい', '12 times']], (id) => {
      if (id !== '108')
        return [c.say('おしい！ ひとの まよいの かずだけ つくんじゃ。もう いちど 鐘に「かね」と となえて ごらん。', 'Close! We strike it once for each of a person’s troubles. Cast かね at the bell and try again.', GENTA, 'monk')]
      c.sfx('correct')
      return [
        c.say('そう、百八かい！ ひとの まよいは 百八つ。一つ つくたびに、一つ きえる。', 'Yes, 108! People have 108 worldly troubles. Each strike rings one away.', GENTA, 'monk'),
        c.narrate('とおくで、こおりが われる おとが した。北西の こおりの あなが ひらいたのだ。', 'Far off, ice cracks. The ice cave to the north-west has opened.'),
        c.fude('ゆきおんなの ところへ 行こう！', 'Let’s go to Yuki-onna!'),
        ...c.advance('r9-frozen'),
      ]
    }),
  ]
}

function readAbbotName(c: Ctx): Step {
  return c.ask({ jp: 'ふだの 字：「冬月」。お坊さんの 名前は 音読みで 読む。', en: 'The tag reads 冬月. A monk’s name is read in on’yomi.' }, ['とうげつ'], (ok) => {
    if (!ok)
      return [c.say('…ちがう 名前じゃ。もう すこし。', '…That isn’t my name. Almost.', ABBOT, 'monk'), c.fude('冬は 音読みで トウ、月は 月曜日の ゲツ！', 'Winter’s on’yomi is トウ, and moon is ゲツ, as in げつようび!')]
    c.take('r9-winter-scroll')
    c.sparkle('spark')
    c.sfx('correct')
    return [
      c.narrate('「とうげつ」── 名前を よぶと、ふだの こおりが とけて、すみの 字が かがやいた。', '“Tōgetsu.” At his name, the ice on the tag melts and the ink shines.'),
      c.say('とうげつ… そうじゃ、わしは とうげつ！ 冬の 月と 書いて、とうげつ！', 'Tōgetsu… yes, I am Tōgetsu! Written “winter moon”, read Tōgetsu!', TOUGETSU, 'monk'),
      c.say('名前を よばれて、はじめて じぶんに もどれる。字とは ふしぎな ものじゃ。', 'Only when someone calls my name can I be myself again. Writing is a strange and wonderful thing.', TOUGETSU, 'monk'),
      c.say('おれいに、この ふでを。寺の 弟子が はじめて もつ ふでじゃ。', 'Take this brush as thanks: the first brush every apprentice here is given.', TOUGETSU, 'monk'),
      ...c.give('r9-apprentice-brush'),
      ...c.bagItem('ether', 2),
      ...c.reward(150, 50),
      ...c.advance('r9-frozen'),
    ]
  })
}

const ABBOT_CHAT: [string, string][] = [
  ['音読みは ちゅうごくから 来た 音、訓読みは この くにの ことば。どちらも 字の たいせつな こえじゃ。', 'On’yomi is the sound that came from China; kun’yomi is this land’s own word. Both are a character’s voice.'],
  ['名前を わすれた わしを、だれも わらわなかった。それが うれしかった。', 'When I forgot my name, nobody laughed at me. That made me glad.'],
  ['毎朝、冬の かけじくに あいさつ しておる。「おかえり」とな。', 'Every morning I greet the winter scroll. “Welcome home,” I say.'],
]

// ─── Yukinko: the heavy child ───────────────────────────────────────
function heavyRiddles(c: Ctx): Step {
  const heavier = (jp: string, en: string): Step[] => [c.narrate('ずしっ…！ ゆきが また おもく なった。', 'Thud…! Yuki grows heavier again.'), c.say(jp, en, YUKI, 'snowchild'), c.fude('いったん おろして… もう いちど はなしかけよう。', 'Put her down for a moment… then talk to her again.')]
  return c.choice({ jp: 'なぞ一：「ゆき」の 字は どれ？', en: 'Riddle one: which kanji is “snow”?' }, [['雪', '雪', 'rain over a sweeping hand'], ['雲', '雲', 'rain over a swirl'], ['電', '電', 'rain over a lightning tail']], (a) => {
    if (a !== '雪') return heavier('ぶー！ それは ちがう 雨の なかま。', 'Bzzt! That’s a different member of the rain family.')
    c.learn('yuki')
    return [
      c.narrate('ふわっ… ゆきが すこし かるく なった。', 'Whoosh… Yuki gets a little lighter.'),
      c.choice({ jp: 'なぞ二：雪が いちばん ふる 季節の 字は？', en: 'Riddle two: the kanji of the season with the most snow?' }, [['夏', '夏', 'a head dragging its feet'], ['冬', '冬', 'dragging feet over two drops of ice'], ['各', '各', 'dragging feet over a mouth']], (b) => {
        if (b !== '冬') return heavier('あつそう！ 雪が とけちゃう〜！', 'That sounds hot! I’ll melt~!')
        c.learn('fuyu')
        return [
          c.narrate('ふわっ… もっと かるく なった。', 'Whoosh… lighter still.'),
          c.ask({ jp: 'なぞ三：「大雪」は なんと 読む？', en: 'Riddle three: how do you read 大雪 (heavy snow)?' }, ['おおゆき'], (ok) => {
            if (!ok) return heavier('ちがうよ〜。大きい の「おお」と、雪 の「ゆき」！', 'Nope~. It’s おお from big, and ゆき from snow!')
            c.learn('ooyuki')
            c.sparkle('spark')
            c.sfx('correct')
            return [
              c.narrate('ふわり。ゆきは 雪の ひとひらの ように かるく なった。', 'Ever so lightly: Yuki is now as light as a single snowflake.'),
              c.say('すごい！ さいごまで おろさなかったね。ゆきんこを だっこできた ひとは、ちからもちに なれるんだよ。', 'Amazing! You never put me down to the very end. People who can carry a snow child get strong, you know.', YUKI, 'snowchild'),
              c.say('ねえ… もう 一つ おねがい。ゆきの ともだちが ほしいの。あの ふるい 雪だるまに、なかまを つくって？', 'Hey… one more wish. I want a snow friend. Will you make a buddy for that old snow giant?', YUKI, 'snowchild'),
              ...c.advance('fk9-yukinko'),
            ]
          }),
        ]
      }),
    ]
  })
}

// ─── Tsurara-onna: a letter for the family ──────────────────────────
function writeLetter(c: Ctx): Step {
  const fail = (jp: string, en: string): Step[] => [c.say(jp, en, TSURARA, 'villager-b'), c.fude('もう いちど はなしかけて、さいしょから 書こう。', 'Let’s talk to her again and start the letter over.')]
  return c.choice({ jp: '「ふゆに また きます」。ふゆ の 字は？', en: '“I’ll come again in winter.” Which kanji for ふゆ?' }, [['夏', '夏', 'summer'], ['冬', '冬', 'winter'], ['各', '各', 'each']], (a) => {
    if (a !== '冬') return fail(a === '夏' ? '夏…！ あつい 季節の 字は、見るだけで とけそう。' : 'それは ちがう 字… にているけれど。', a === '夏' ? 'Summer…! Just looking at the hot season’s kanji makes me melt.' : 'That’s a different character… a look-alike.')
    c.learn('fuyu')
    return [
      c.narrate('わしに「冬に」と 書いた。', 'You write 冬に on the washi.'),
      c.choice({ jp: 'つぎは「きます」。くる の 字は？', en: 'Next, “きます”. Which kanji for くる (come)?' }, [['来', '来', 'a tree waving its arms'], ['米', '米', 'rice grains scattered'], ['末', '末', 'a tree with a long top bar']], (b) => {
        if (b !== '来') return fail('それでは「こめます」に なって しまうわ…', 'That would turn the letter into nonsense…')
        c.learn('kuru')
        return [
          c.narrate('「冬に また 来ます」。あとは、ふでで しあげるだけ。', '“冬に また 来ます.” All that’s left is to finish it with the brush.'),
          c.cast({ jp: 'てがみを しあげよう：ことばの まほうで「かく」', en: 'Finish the letter: cast かく (write)' }, (k) => {
            if (k !== 'かく') return fail('…すみが まだ のって いないわ。', '…The ink hasn’t taken yet.')
            c.learn('kaku')
            c.take('r9-washi')
            c.sparkle('spark')
            c.sfx('correct')
            return [
              c.narrate('すみが すうっと しみこみ、てがみが できた：「冬に また 来ます」', 'The ink sinks smoothly in, and the letter is done: 冬に また 来ます, “I’ll come again in winter.”'),
              c.say('ありがとう。…みずうみで つりを している ひとに、とどけて くれる？ あの ひとの ひいおじいさんが、わたしの おっとだったの。', 'Thank you. …Will you take it to the man fishing on the lake? His great-grandfather was my husband.', TSURARA, 'villager-b'),
              ...c.give('r9-tsurara-letter'),
              ...c.advance('fk9-tsurara'),
            ]
          }),
        ]
      }),
    ]
  })
}

// ─── Mokumokuren: eyes that want to read ────────────────────────────
function eyeRiddles(c: Ctx): Step {
  const blink = (jp: string, en: string): Step[] => [c.say(jp, en, EYES, 'wisp'), c.fude('ぶしゅ（へん）を よく 見て！ もう いちど はなしかけよう。', 'Look closely at the radicals! Let’s talk to them again.')]
  return c.choice({ jp: 'め：「めに あしが はえた 字は どれ？」', en: 'The eyes: “Which kanji is an eye that grew legs?”' }, [['貝', '貝', 'shell'], ['見', '見', 'see'], ['目', '目', 'eye']], (a) => {
    if (a !== '見') return blink(a === '目' ? 'それは ただの め。あしが ないよ。' : 'それは かい。あしが ある けど、めが ない…', a === '目' ? 'That’s just an eye. No legs.' : 'That’s a shell. It has legs, but no eye…')
    c.learn('miru')
    return [
      c.narrate('めたちが いっせいに ぱちぱち まばたきした。よろこんでいる らしい。', 'All the eyes blink at once. They seem delighted.'),
      c.choice({ jp: 'め：「言（ことば）と した。はなす ときの 字は？」', en: 'The eyes: “Speech plus a tongue: the kanji for talking?”' }, [['語', '語', 'speech + me'], ['読', '読', 'speech + seller'], ['話', '話', 'speech + tongue']], (b) => {
        if (b !== '話') return blink('「言」は あっている。でも みぎがわが ちがう。', 'The 言 is right. But the right-hand side is wrong.')
        c.learn('hanasu')
        return [
          c.narrate('ぱちぱち ぱちぱち。', 'Blink-blink, blink-blink.'),
          c.choice({ jp: 'め：「さいご。言 と うる ひと。よむ ときの 字は？」', en: 'The eyes: “Last one. Speech plus a seller: the kanji for reading?”' }, [['読', '読', 'speech + seller'], ['話', '話', 'speech + tongue'], ['売', '売', 'seller alone']], (d) => {
            if (d !== '読') return blink(d === '売' ? 'それは うる だけ。ことばが たりない。' : 'それは はなす。よむ じゃ ない。', d === '売' ? 'That’s just “sell”. It’s missing the speech.' : 'That’s talking, not reading.')
            c.learn('yomu')
            c.sparkle('spark')
            c.sfx('correct')
            return [
              c.say('ああ… ひさしぶりに 字を 見た！ 読んだ！ おいしい！', 'Ahh… we saw writing again! We read it! Delicious!', EYES, 'wisp'),
              c.say('でも しょうじが やぶれて、さむい。あなを ふさいで くれる？', 'But the screen is torn, and it’s cold. Will you patch the holes?', EYES, 'wisp'),
              c.fude('しょうじに はるのは… 紙！「かみ」と となえよう！', 'What you paste on a screen is… paper! Let’s cast かみ!'),
              ...c.advance('fk9-mokumoku'),
            ]
          }),
        ]
      }),
    ]
  })
}

export const SNOWTEMPLE_TALES: TaleContent = {
  items: [
    { id: 'r9-winter-scroll', name: 'Winter Scroll', jp: '冬の かけじく', kana: 'ふゆの かけじく', emoji: '🖼️', desc: 'The fourth season scroll of the scriptorium: a snowy temple and a single kanji, 冬. Cold to the touch, but no longer frozen.' },
    { id: 'r9-apprentice-brush', name: 'Apprentice’s Brush', jp: '弟子の ふで', kana: 'でしの ふで', emoji: '🖌️', desc: 'The first brush every apprentice of the Snowbound Temple is given. The handle reads 学 (learning).' },
    { id: 'r9-washi', name: 'Washi Paper', jp: 'わし', kana: 'わし', emoji: '📄', desc: 'Thick, soft Japanese paper (和紙) from the scriptorium shelf. Good for letters.' },
    { id: 'r9-tsurara-letter', name: 'Icicle Letter', jp: 'つららの てがみ', kana: 'てがみ', emoji: '✉️', desc: '冬に また 来ます: “I’ll come again in winter.” The ink glitters like frost.' },
    { id: 'r9-snow-bell', name: 'Snow-Child Bell', jp: 'ゆきんこの すず', kana: 'すず', emoji: '🔔', desc: 'A tiny bell of ice from Yuki. It never melts, and it rings without a sound.' },
    { id: 'r9-icicle-comb', name: 'Icicle Comb', jp: 'つららの くし', kana: 'くし', emoji: '🪮', desc: 'A comb clear as an icicle. It was found floating in a bath, long ago.' },
    { id: 'r9-shoji-eye', name: 'Watchful Charm', jp: 'めの おまもり', kana: 'おまもり', emoji: '🧿', desc: 'A paper charm with one small eye on it. It winks when you misread a kanji.' },
  ],
  yokai: [
    {
      id: 'yukinko',
      region: 9,
      name: 'Yukinko, the Snow Child',
      jp: '雪ん子',
      kana: 'ゆきんこ',
      emoji: '❄️',
      lore: 'In the snow country of northern Japan, a little child in a straw cape is sometimes seen playing alone in the falling snow: a yukinko, or yuki-warashi, said to be the snow woman’s child. In some tales the snow woman asks a traveller to hold her little one, and it grows heavier and heavier in his arms; whoever holds on to the end is rewarded with great strength.',
      hint: 'A little girl in a straw cape plays alone by the steaming pond. She would like to be carried.',
      words: ['yuki', 'fuyu', 'ooyuki', 'yukidaruma'],
    },
    {
      id: 'tsurara-onna',
      region: 9,
      name: 'Tsurara-onna, the Icicle Wife',
      jp: '氷柱女',
      kana: 'つららおんな',
      emoji: '🧊',
      lore: 'A man living alone looked at the beautiful icicles hanging from his eaves and wished for a wife as lovely. That night a pale woman came to his door and stayed as his wife, but she would never bathe. One cold night he made her get into a hot bath; when he looked in, she was gone, and only a thin icicle (some say her comb) floated in the water.',
      hint: 'A woman in white stands by the icicles of a lakeside hut, and won’t go near anything warm.',
      words: ['fuyu', 'kuru', 'kaku', 'koori'],
    },
    {
      id: 'mokumokuren',
      region: 9,
      name: 'Mokumokuren, the Many-Eyed Screen',
      jp: '目目連',
      kana: 'もくもくれん',
      emoji: '👁️',
      lore: 'In an old, neglected house, eyes appear in every hole of the torn paper screens, blinking at whoever passes. Toriyama Sekien drew them in 1781. In one tale a lumber merchant from Edo, staying in an empty house in Tsugaru, was not frightened at all: he plucked out every eye and sold them to an eye doctor.',
      hint: 'Something blinks behind the torn screen in the scriptorium. It looks bored.',
      words: ['miru', 'hanasu', 'yomu', 'kami'],
    },
  ],
  tales: [
    {
      id: 'r9-frozen',
      region: 9,
      main: true,
      title: 'The Frozen Script',
      jp: 'こおった 字',
      summary: 'Yuki-onna has frozen every character in the temple. The monks can’t read their sutras, their signs, or even their own names.',
      giver: 'st-kuu',
      stages: [
        { en: 'Visit the abbot in the scriptorium (the main hall)', jp: '本どうの しゃきょうの へやで ろうしに あおう', target: ['sl-abbot'], map: 'snowtemple-library' },
        { en: 'Thaw the three season scrolls: cast each one’s reading (はる, なつ, あき) at it', jp: '三つの かけじくに、その 季節の 読みを となえよう（はる・なつ・あき）', target: ['sl-scroll-haru', 'sl-scroll-natsu', 'sl-scroll-aki'], map: 'snowtemple-library' },
        { en: 'The winter scroll is missing. Ask Genta in the bell tower, then cast かね (bell) at the great bell', jp: '冬の かけじくが ない。かねつきどうの げんたに きいて、大きな 鐘に「かね」と となえよう', target: ['sb-genta', 'sb-bell'], map: 'snowtemple-bell' },
        { en: 'Face Yuki-onna in the ice cave, and ask her for the winter scroll', jp: 'こおりの あなで ゆきおんなと むきあい、冬の かけじくを かえして もらおう', target: ['sc-yukionna', 'sc-yukionna-calm'], map: 'snowtemple-cave' },
        { en: 'Bring the winter scroll home to the abbot, and read his name for him', jp: '冬の かけじくを ろうしに とどけて、名前を 読んで あげよう', target: ['sl-abbot'], map: 'snowtemple-library' },
      ],
    },
    {
      id: 'fk9-yukinko',
      region: 9,
      yokai: 'yukinko',
      title: 'The Heavy Child',
      jp: 'おもい ゆきんこ',
      summary: 'Yuki wants to be carried, but snow children grow heavier and heavier in your arms…',
      giver: 'st-yuki',
      stages: [
        { en: 'Carry Yuki, and answer her snow riddles to make her light again', jp: 'ゆきを だっこして、雪の なぞに こたえよう', target: ['st-yuki'], map: 'snowtemple' },
        { en: 'Make Yuki a snow friend: cast ゆきだるま at the Old Snow Giant', jp: 'ふるい 雪だるまに「ゆきだるま」と となえて、なかまを つくろう', target: ['st-big-snowman'], map: 'snowtemple' },
        { en: 'Tell Yuki her new friend is ready', jp: 'ゆきに しらせよう', target: ['st-yuki'], map: 'snowtemple' },
      ],
    },
    {
      id: 'fk9-tsurara',
      region: 9,
      yokai: 'tsurara-onna',
      title: 'A Letter of Ice',
      jp: 'つららの てがみ',
      summary: 'The woman in white by the lake wants to leave a letter for her family, but every kanji has frozen in her memory.',
      giver: 'fk9-tsurara',
      stages: [
        { en: 'Fetch washi paper from the shelf in the scriptorium', jp: 'しゃきょうの へやの たなから、わしを もらおう', target: ['sl-paper'], map: 'snowtemple-library' },
        { en: 'Help her write the letter: choose the right kanji, then cast かく', jp: 'ただしい 漢字を えらんで、「かく」で てがみを しあげよう', target: ['fk9-tsurara'], map: 'snowtemple-lake' },
        { en: 'Take the letter to the ice fisher on the lake', jp: 'みずうみの りょうしに てがみを とどけよう', target: ['lk-fisher'], map: 'snowtemple-lake' },
        { en: 'Tell the woman in white her letter was read', jp: 'しろい きものの ひとに、てがみが とどいたと つたえよう', target: ['fk9-tsurara'], map: 'snowtemple-lake' },
      ],
    },
    {
      id: 'fk9-mokumoku',
      region: 9,
      yokai: 'mokumokuren',
      title: 'Eyes in the Screen',
      jp: 'しょうじの め',
      summary: 'Eyes blink in every hole of the scriptorium’s torn screen. With all the writing frozen, they have nothing to look at.',
      giver: 'fk9-shoji',
      stages: [
        { en: 'Answer the eyes’ radical riddles', jp: 'めの ぶしゅの なぞに こたえよう', target: ['fk9-shoji'], map: 'snowtemple-library' },
        { en: 'Patch the torn screen: cast かみ (paper) at it', jp: 'やぶれた しょうじに「かみ」と となえよう', target: ['fk9-shoji'], map: 'snowtemple-library' },
      ],
    },
  ],
  entities: {
    snowtemple: [
      { id: 'st-yuki', kind: 'npc', sprite: 'snowchild', x: 27, y: 28, dir: 'down', name: YUKI, lines: [{ jp: '雪、すき？ わたしは だいすき。', en: 'Do you like snow? I love it.' }] },
    ],
    'snowtemple-cave': [
      { id: 'sc-yukionna-calm', kind: 'npc', sprite: 'yuki-onna', x: 15, y: 9, dir: 'down', name: YUKIONNA, lines: [{ jp: '雪は しずか。でも、さびしくは ない。', en: 'Snow is quiet. But it isn’t lonely.' }] },
      { id: 'sc-yuki', kind: 'npc', sprite: 'snowchild', x: 18, y: 9, dir: 'left', name: YUKI, lines: [{ jp: 'おかあさん、もう つめたく ないよ！', en: 'Mother isn’t cold any more!' }] },
    ],
  },
  visible: {
    'sc-yukionna-calm': (s) => bossBeaten(s),
    'sc-yuki': (s) => bossBeaten(s),
  },
  ghost: {
    'sl-scroll-fuyu': (s) => stageOf(s, 'r9-frozen') < 5,
  },
  talk: {
    // ── The Frozen Script ──
    'st-kuu': (c) => {
      const st = c.stage('r9-frozen')
      if (st < 0)
        return [
          ...offer(
            c,
            'r9-frozen',
            [
              c.say('ああ、たびの かた！ たすけて ください。寺じゅうの 字が こおって しまったんです。', 'Ah, a traveller! Please help us. Every character in the temple has frozen.'),
              c.say('お経も、かんばんも、ちょうめんも。ろうしは じぶんの 名前さえ 読めなくなって…', 'The sutras, the signs, the register. The abbot can’t even read his own name…'),
              c.say('ろうしは 本どうの しゃきょうの へやに います。はなしを 聞いて あげて ください。', 'The abbot is in the scriptorium in the main hall. Please go and talk to him.'),
            ],
            ['まかせて ください！', 'Leave it to me!'],
          ),
          ...host(c, 'r9-talk'),
        ]
      const say: [string, string] =
        st === 0
          ? ['ろうしは 本どうに います。北の 大きな たてもの です。', 'The abbot is in the main hall, the big building to the north.']
          : st === 1
            ? ['かけじくの 字が こおっているなら、読みを となえて みて！', 'If the scroll characters are frozen, try chanting their readings!']
            : st === 2
              ? ['げんたさんは かねつきどうに います。東の とうです。', 'Genta is in the bell tower, to the east.']
              : st === 3
                ? ['こおりの あなは 北西です。…どうか、気を つけて。', 'The ice cave is to the north-west. …Please be careful.']
                : st === 4
                  ? ['ろうしに 冬の かけじくを！ きっと よろこびます。', 'Take the winter scroll to the abbot! He’ll be overjoyed.']
                  : ['ちょうめんの 字が もどりました。あなたの 名前も、ちゃんと 書いて ありますよ。', 'The register’s writing is back. Your name is written in it too, properly.']
      return [c.say(...say), ...host(c, 'r9-talk')]
    },
    'sl-abbot': (c) => {
      const st = c.stage('r9-frozen')
      if (st < 0) return [c.say('…………。', '…………'), c.narrate('ろうしは だまって、こおった かけじくを 見つめている。', 'The abbot stares silently at the frozen scrolls.')]
      if (st === 0)
        return [
          c.say('…たびの かたか。わしは この 寺の ろうし… の はずじゃが、名前が 読めん。', '…A traveller. I am the abbot of this temple… I believe. But I cannot read my name.', ABBOT, 'monk'),
          c.narrate('ろうしの むねの ふだは、あつい こおりに おおわれている。', 'The name tag on the abbot’s robe is sealed under thick ice.'),
          c.say('かべの かけじくを 見なされ。春・夏・秋・冬。四つの 季節が、この へやを あたためて おった。', 'Look at the scrolls on the wall: spring, summer, autumn, winter. The four seasons kept this hall warm.', ABBOT, 'monk'),
          c.say('こおった 字は、その 読みを よべば 目を さます。たのむ。', 'A frozen character wakes when you call its reading. I beg you.', ABBOT, 'monk'),
          c.fude('かけじくに「はる」「なつ」「あき」と となえよう！', 'Let’s cast はる, なつ and あき at the scrolls!'),
          ...c.advance('r9-frozen'),
        ]
      if (st === 1) return [c.say('春は はる、夏は なつ、秋は あき… 訓読みで よんで おやり。', 'Spring is はる, summer なつ, autumn あき… call them by their kun’yomi.', ABBOT, 'monk')]
      if (st === 2) return [c.say('げんたは かねつきどうじゃ。あの 男の こえは、こおりも わる。', 'Genta is in the bell tower. That man’s voice could crack ice.', ABBOT, 'monk')]
      if (st === 3) return [c.say('ゆきおんなは わるい ものでは ない。ただ… さびしい だけじゃ。', 'Yuki-onna is not wicked. She is only… lonely.', ABBOT, 'monk')]
      if (st === 4)
        return [
          c.narrate('冬の かけじくを かべに かけた。四つの 季節が そろい、へやが ぽかぽかと あたたまる。', 'You hang the winter scroll on its hook. With all four seasons together, the hall grows warm.'),
          c.narrate('ろうしの ふだの こおりが、うすく なって いく…', 'The ice on the abbot’s name tag grows thin…'),
          c.say('…読める かね？ わしの 名前を、よんで くれ。', '…Can you read it? Please, call my name.', ABBOT, 'monk'),
          readAbbotName(c),
        ]
      const n = c.flag('r9.abbot.chat')
      c.set('r9.abbot.chat', n + 1)
      const [jp, en] = ABBOT_CHAT[n % ABBOT_CHAT.length]
      return [c.say(jp, en, TOUGETSU, 'monk')]
    },
    'sl-scroll-haru': (c) => (c.stage('r9-frozen') === 1 && !c.flag('r9.sl-scroll-haru') ? [c.narrate('さくらの え。字が こおっている：「春」。', 'Cherry blossom. Its character is frozen: 春.'), c.fude('春の 訓読みは…「はる」！ となえて！', 'The kun’yomi of 春 is… はる! Cast it!')] : null),
    'sl-scroll-natsu': (c) => (c.stage('r9-frozen') === 1 && !c.flag('r9.sl-scroll-natsu') ? [c.narrate('ほたるの え。字が こおっている：「夏」。', 'Fireflies. Its character is frozen: 夏.'), c.fude('夏は「なつ」！', '夏 is なつ!')] : null),
    'sl-scroll-aki': (c) => (c.stage('r9-frozen') === 1 && !c.flag('r9.sl-scroll-aki') ? [c.narrate('もみじの え。字が こおっている：「秋」。', 'Maple leaves. Its character is frozen: 秋.'), c.fude('秋は「あき」！', '秋 is あき!')] : null),
    'sl-scroll-fuyu': (c) => {
      const st = c.stage('r9-frozen')
      if (st >= 5) return [c.narrate('雪の 寺の え。「冬」の 字が、しずかに かがやいている。', 'A painting of a snowy temple. The character 冬 glows quietly.')]
      return [c.narrate('からっぽの くぎ。ここに「冬」の かけじくが あった はず。', 'An empty hook. The winter scroll, 冬, should hang here.')]
    },
    'sb-genta': (c) => {
      const st = c.stage('r9-frozen')
      if (st === 2 && !c.flag('r9.genta')) {
        c.set('r9.genta')
        return [
          c.say('冬の かけじく？ わっはっは、それなら ゆきおんなが もっていったわい！', 'The winter scroll? Wahaha, Yuki-onna took that!', GENTA, 'monk'),
          c.say('こおりの あなの 入口は、かたい こおりで ふさがっておる。だが この 鐘の 音なら、われる。', 'The mouth of the ice cave is sealed with hard ice. But the sound of this bell can crack it.', GENTA, 'monk'),
          c.say('鐘の ひょうめんの 字を 読んで、となえて みい。「鐘」じゃ。', 'Read the character on the bell, and chant it. 鐘.', GENTA, 'monk'),
          c.fude('鐘は… かね！ 鐘に「かね」と となえよう！', '鐘 is… かね! Let’s cast かね at the bell!'),
          ...host(c, 'r9-words-3'),
        ]
      }
      if (st === 3 && !bossBeaten(c.s())) return [c.say('こおりの あなは ひらいた！ ゆきおんなに よろしくな。…いや、気を つけてな！', 'The cave is open! Give Yuki-onna my regards. …I mean, be careful!', GENTA, 'monk'), ...host(c, 'r9-words-3')]
      return null
    },
    'sb-bell': (c) => (c.stage('r9-frozen') === 2 ? [c.narrate('大きな 鐘。ひょうめんに「鐘」の 字が こおりついている。', 'A huge bell. The character 鐘 is frozen onto its side.'), c.fude('「かね」と となえて ならそう！', 'Cast かね to ring it!'), ...host(c, 'r9-listen')] : null),
    'sc-yukionna': (c) => [c.say('…しずかに。字は、もう いらない。雪の ように、ぜんぶ しろく ねむれば いい。', '…Hush. Writing is no longer needed. Let everything sleep white, like snow.', YUKIONNA, 'yuki-onna'), ...host(c, 'r9-boss')],
    'sc-yukionna-calm': (c) => {
      const st = c.stage('r9-frozen')
      if (st === 3)
        return [
          c.say('…あなたの 読む こえは、あたたかかった。', '…Your reading voice was warm.'),
          c.say('冬の かけじくを かえします。わたしの 字は、もう こおらせない。', 'I return the winter scroll. I won’t freeze anyone’s writing again.'),
          ...c.give('r9-winter-scroll'),
          c.say('ろうしに… ごめんなさいと つたえて。', 'Tell the abbot… that I’m sorry.'),
          ...c.advance('r9-frozen'),
        ]
      const lines: [string, string][] = [
        ['雪が ふる おとを「しんしん」と いうの。おとの ない おと。でも、からっぽじゃ ない。', 'The sound of falling snow is called “shin-shin”. A sound with no sound. But not an empty one.'],
        ['ゆきが わたしの てを はなさないの。…つめたい てなのに。', 'Yuki won’t let go of my hand. …Even though it’s cold.'],
        ['むかし、ふでを もった むすめが、わたしの 雪に 名前を くれた。…あなたの フデに、にているわね。', 'Long ago, a girl with a brush gave my snowfall a name. …She looked a lot like your Fude’s friend.'],
      ]
      const n = c.flag('r9.yukionna.chat')
      c.set('r9.yukionna.chat', n + 1)
      const [jp, en] = lines[n % lines.length]
      return [c.say(jp, en)]
    },
    'sc-yuki': (c) => [c.say('おかあさんと いっしょに、雪だるま つくるんだ！ こんどは 名前も 書くの！', 'I’m going to build a snowman with Mother! And this time we’ll write its name on it!')],

    // ── Yukinko ──
    'st-yuki': (c) => {
      const st = c.stage('fk9-yukinko')
      if (st < 0)
        return offer(
          c,
          'fk9-yukinko',
          [
            c.narrate('みのを きた ちいさな 女の子が、ひとりで 雪の 中に たっている。かみの けまで まっしろだ。', 'A little girl in a straw cape stands alone in the snow. Even her hair is snow-white.'),
            c.say('わたしは ゆき。ゆきんこ だよ。…ねえ、だっこ して？', 'I’m Yuki. A yukinko, a snow child. …Hey, will you carry me?'),
            c.fude('ゆきんこ… 雪の 子の ようかいだ！', 'A yukinko… a snow-child spirit!'),
            c.narrate('だきあげると、ゆきは ずしっと おもく なった。まるで 雪が つもる ように。', 'When you pick her up, she suddenly grows heavy, as if snow were piling up on her.'),
            c.say('えへへ。わたしの なぞに こたえたら、かるく なるよ。おとさないでね？', 'Hehe. Answer my riddles and I’ll get lighter. Don’t drop me, okay?', YUKI, 'snowchild'),
          ],
          ['がんばる！', 'I’ll hold on!'],
        )
      if (st === 0) return [c.say('だっこ！ なぞなぞ いくよ〜。', 'Up! Here come the riddles~', YUKI, 'snowchild'), heavyRiddles(c)]
      if (st === 1) return [c.say('ふるい 雪だるまは、ひがしの いけの そば。「ゆきだるま」って よんで あげて！', 'The old snow giant is by the pond to the east. Call it ゆきだるま!', YUKI, 'snowchild')]
      if (st === 2) {
        c.sparkle('spark')
        return [
          c.say('見た！ 雪だるまに、ちいさい なかまが できた！ もう さびしくないね。', 'I saw! The snow giant has a little buddy now! It won’t be lonely any more.', YUKI, 'snowchild'),
          c.say('これ、あげる。こおりの すず。おとが しない すず なの。', 'This is for you. A bell made of ice. It rings without a sound.', YUKI, 'snowchild'),
          ...c.give('r9-snow-bell'),
          ...c.reward(90, 35),
          ...c.advance('fk9-yukinko'),
          ...c.seal('yukinko'),
          c.say('…むかしね、ふでを もった おねえちゃんと、あの 雪だるまを つくったの。おなかに 字を 書いて くれた。「友」って。', '…Long ago I built that snow giant with a big sister who carried a brush. She wrote a kanji on its belly: 友, friend.', YUKI, 'snowchild'),
          c.fude('ことね… あの 雪だるまが ずっと とけなかったのは、その 字の せい かもね。', 'Kotone… Maybe that’s why the snow giant never melted: because of that one character.'),
        ]
      }
      const chat: [string, string][] = [
        ['雪の 字の 上は 雨。雨が こおると 雪に なるの。しってた？', 'The top of 雪 is rain. Rain that freezes turns into snow. Did you know?'],
        ['春が 来ると、わたしは ねむるの。でも 冬に また 来るよ。', 'When spring comes, I go to sleep. But I come back in winter.'],
        ['おかあさんと 毎年、ここで しんしんを 聞くの。', 'Every year Mother and I listen to the shin-shin here.'],
      ]
      const n = c.flag('r9.yuki.chat')
      c.set('r9.yuki.chat', n + 1)
      const [jp, en] = chat[n % chat.length]
      return [c.say(jp, en, YUKI, 'snowchild')]
    },
    'st-big-snowman': (c) => (c.stage('fk9-yukinko') === 1 ? [c.narrate('ふるい 雪だるま。となりが ぽっかり あいている。', 'The old snow giant. The spot beside it is conspicuously empty.'), c.fude('「ゆきだるま」と となえて、なかまを つくろう！', 'Cast ゆきだるま to build it a buddy!')] : null),

    // ── Tsurara-onna ──
    'fk9-tsurara': (c) => {
      const st = c.stage('fk9-tsurara')
      if (st < 0)
        return offer(
          c,
          'fk9-tsurara',
          [
            c.narrate('しろい きものの 女の ひとが、こやの のきの つららを 見上げている。いきが ぜんぜん しろく ならない。', 'A woman in a white kimono gazes up at the icicles on the hut’s eaves. Her breath doesn’t mist at all.'),
            c.say('…むかし、この こやに すんでいた 人が、つららを 見て いったの。「こんなに きれいな およめさんが ほしい」って。', '…Long ago, the man who lived in this hut looked at the icicles and said, “I wish I had a wife as lovely as these.”', TSURARA, 'villager-b'),
            c.say('だから わたしが 来たの。つららの 女。…でも ある よる、あたたかい おふろに 入れられて… わたしは とけて しまった。', 'So I came. The icicle woman. …But one night he put me in a hot bath… and I melted away.', TSURARA, 'villager-b'),
            c.fude('つららおんな…！', 'Tsurara-onna…!'),
            c.say('毎年 冬、のきの つららに なって もどって くるの。でも かぞくに、それを つたえた ことが ない。', 'Every winter I come back as the icicles on the eaves. But I never told the family.', TSURARA, 'villager-b'),
            c.say('てがみを 書きたいの。でも 字が、ぜんぶ こおって しまって…', 'I want to write them a letter. But every character has frozen in my mind…', TSURARA, 'villager-b'),
          ],
          ['てつだいます', 'I’ll help'],
        )
      if (st === 0) return [c.say('まずは 紙が いるわ。寺の しゃきょうの へやに、いい わしが あるはず。', 'First I need paper. The scriptorium at the temple should have good washi.', TSURARA, 'villager-b')]
      if (st === 1) return [c.say('わし、ありがとう。いっしょに 書いて くれる？', 'Thank you for the washi. Will you write it with me?', TSURARA, 'villager-b'), writeLetter(c)]
      if (st === 2) return [c.say('つりを している あの 人に、とどけて。…わたしは ちかづけないの。あの 人の ひの そばには。', 'Please take it to the man fishing. …I can’t go near him, or near his little fire.', TSURARA, 'villager-b')]
      if (st === 3) {
        c.sparkle('spark')
        return [
          c.say('…よんで くれたのね。「毎年 のきで、いちばん きれいな つららを さがす」って？', '…He read it. He said he looks for the most beautiful icicle on the eaves every year?', TSURARA, 'villager-b'),
          c.say('ずっと、とどいて いたのね。ことばに しなくても。…でも、ことばに して よかった。', 'So it reached them all along, even without words. …But I’m glad I put it into words.', TSURARA, 'villager-b'),
          c.say('これを。むかし、おふろに のこった わたしの くし。', 'Take this. My comb, the one left floating in the bath long ago.', TSURARA, 'villager-b'),
          ...c.give('r9-icicle-comb'),
          ...c.reward(100, 40),
          ...c.advance('fk9-tsurara'),
          ...c.seal('tsurara-onna'),
          c.say('…ふでを もった むすめを おもいだすわ。「冬に また 来ます」って、わたしに 字を おしえて くれたのも、あの子。', '…I remember a girl with a brush. It was she who first taught me to write 冬に また 来ます.', TSURARA, 'villager-b'),
          c.say('「とけて きえても、ことばは 春を こえて とどくよ」って。', '“Even if you melt away, words carry past the spring,” she said.', TSURARA, 'villager-b'),
          c.fude('…ことねも、きえる まえに、ことばを のこした。おなじ ことを しんじて いたんだね。', '…Kotone left words behind before she faded too. She believed the very same thing.'),
        ]
      }
      return [c.say('冬に また 来ます。…ほんとうよ。', 'I’ll come again in winter. …I truly will.', TSURARA, 'villager-b')]
    },
    'sl-paper': (c) => {
      if (c.stage('fk9-tsurara') !== 0) return null
      return [
        c.narrate('たなに、いろいろな ふだが ならんでいる。「紙」と 書かれた たなは どれ？', 'Labels line the shelves. Which shelf is marked “paper”?'),
        c.choice({ jp: 'どの たなを あける？', en: 'Which shelf will you open?' }, [['糸', '糸', 'thread only'], ['紙', '紙', 'thread + a hooked spoon'], ['氏', '氏', 'a hooked spoon only']], (id) => {
          if (id !== '紙') return [c.narrate(id === '糸' ? 'いとまきが ぎっしり。…紙は こっちじゃ ない。' : 'からっぽの たな。…紙の 字の みぎがわ だけ だった。', id === '糸' ? 'Spools of thread, packed tight. …Not the paper.' : 'An empty shelf. …That was only the right half of the paper kanji.')]
          c.learn('kami')
          c.sparkle('dust')
          return [c.narrate('まっしろな わしが 一まい。いとの ように こまかい せんいが すけて 見える。', 'A single sheet of pure white washi. Fine threads of fibre show through it.'), c.fude('紙の 字の ひだりは「糸」。いとから 紙が できるんだね！', 'The left of 紙 is 糸, thread. Paper is made of fibres!'), ...c.give('r9-washi'), ...c.advance('fk9-tsurara')]
        }),
      ]
    },
    'lk-fisher': (c) => {
      if (c.stage('fk9-tsurara') !== 2) return null
      return [
        c.say('ん？ おれに てがみ？ …雪の ように つめたい 紙だな。', 'Hm? A letter for me? …The paper is cold as snow.', FISHER, 'villager-a'),
        c.ask({ jp: 'てがみを 読んで あげよう：「冬に また 来ます」', en: 'Read the letter aloud for him: 冬に また 来ます' }, ['ふゆにまたきます'], (ok) => {
          if (!ok) return [c.say('ふ… なんだって？ もう いちど たのむ。', 'Fu… what was that? Once more, please.', FISHER, 'villager-a'), c.fude('冬は ふゆ、来ますは きます！', '冬 is ふゆ, and 来ます is きます!')]
          c.take('r9-tsurara-letter')
          c.learn('fuyu')
          c.learn('kuru')
          c.sfx('correct')
          return [
            c.say('「ふゆに また きます」…', '“I’ll come again in winter”…', FISHER, 'villager-a'),
            c.say('ひいじいさんの 口ぐせだった。「のきの つららは、ひいばあさんだ」って。こどもの ころは わらってたけど…', 'My great-grandfather always used to say, “The icicles on the eaves are your great-grandmother.” I laughed at it as a kid…', FISHER, 'villager-a'),
            c.say('毎年、のきで いちばん きれいな つららを さがすんだ。…あの 人に、そう つたえて くれ。', 'Every year I look for the most beautiful icicle on the eaves. …Tell her that for me.', FISHER, 'villager-a'),
            ...c.advance('fk9-tsurara'),
          ]
        }),
      ]
    },

    // ── Mokumokuren ──
    'fk9-shoji': (c) => {
      const st = c.stage('fk9-mokumoku')
      if (st < 0)
        return offer(
          c,
          'fk9-mokumoku',
          [
            c.narrate('しょうじの あなと いう あなに、めが ある。ぱちり。ぱちり。ぜんぶ こちらを 見ている。', 'In every hole of the screen there is an eye. Blink. Blink. All of them are looking at you.'),
            c.fude('ひゃあっ！ め、め、めが いっぱい！', 'Eek! Eyes, eyes, so many eyes!'),
            c.say('…こわがらないで。わたしたちは もくもくれん。ふるい しょうじに すむ め。', '…Don’t be scared. We are mokumokuren, the eyes that live in old paper screens.', EYES, 'wisp'),
            c.say('ここで 字を 見るのが、たのしみ だった。でも 字が ぜんぶ こおって、見る ものが ない。たいくつで、たいくつで…', 'Watching the monks write was our joy. But all the writing froze, and now there’s nothing to see. So bored, so bored…', EYES, 'wisp'),
            c.say('字を 見せて。わたしたちの なぞに こたえて。', 'Show us some characters. Answer our riddles.', EYES, 'wisp'),
          ],
          ['見せて あげる！', 'I’ll show you!'],
        )
      if (st === 0) return [c.say('ぱちぱち。なぞ、いくよ。', 'Blink-blink. Here comes a riddle.', EYES, 'wisp'), eyeRiddles(c)]
      if (st === 1) return [c.say('さむい… あなを ふさいで…', 'So cold… please patch the holes…', EYES, 'wisp'), c.fude('「かみ」と となえよう！', 'Cast かみ!')]
      return [c.say('あたらしい しょうじ、あったかい。字を 書く ところ、ずっと 見ているね。…まちがえたら、ウインク するよ。', 'The new screen is so warm. We’ll keep watching you write. …If you make a mistake, we’ll wink.', EYES, 'wisp')]
    },
  },
  cast: {
    // ── The Frozen Script ──
    ...Object.fromEntries(Object.keys(SCROLLS).map((id) => [id, (c: Ctx, k: string) => thawScroll(c, id, k)])),
    'sl-scroll-fuyu': (c, k) => (k === 'ふゆ' ? (c.learn('fuyu'), [c.narrate('「ふゆ」… くぎが ちりんと ゆれた。でも、かけじくは ここに ない。', '“Fuyu”… the hook trembles with a tiny ring. But the scroll isn’t here.')]) : null),
    'sb-bell': (c, k) => (k === 'かね' ? ringBell(c) : null),
    'sl-abbot': (c, k) => {
      if (k === 'なまえ') return (c.learn('namae'), [c.say('名前… そう、わしにも 名前が あった はずじゃ。', 'A name… yes, I too must have had a name.', ABBOT, 'monk')])
      if (k === 'おきょう') return (c.learn('okyou'), c.sparkle('dust'), [c.narrate('ろうしは 目を とじて、お経の 一行を そらで となえた。', 'The abbot closes his eyes and chants a line of sutra from memory.')])
      return null
    },
    // ── Yukinko ──
    'st-big-snowman': (c, k) => {
      if (k !== 'ゆきだるま') return k === 'ゆき' ? (c.learn('yuki'), [c.narrate('雪が ふわっと まいあがった。雪だるまが うれしそうに 見える。', 'Snow swirls up. The snow giant looks pleased.')]) : null
      c.learn('yukidaruma')
      c.sparkle('spark')
      if (c.stage('fk9-yukinko') === 1)
        return [
          c.narrate('「ゆきだるま」！ 雪が ころころ ころがって、ちいさな 雪だるまが ぽんっと できた！', '“Yukidaruma”! Snow rolls up, roly-poly, and pop: a little snowman appears!'),
          c.narrate('ふるい 雪だるまが、すこし わらった ような 気が した。', 'You could swear the old snow giant smiled a little.'),
          c.fude('ゆきに しらせよう！', 'Let’s tell Yuki!'),
          ...c.advance('fk9-yukinko'),
        ]
      return [c.narrate('ちいさな 雪だるまが ころん。もう 一つ、また 一つ…', 'A little snowman rolls into being. Then another, and another…'), ...(first(c, 'cast.st-big-snowman') ? c.reward(10, 5) : [])]
    },
    'st-yuki': (c, k) => {
      if (k === 'ゆき') return (c.learn('yuki'), [c.say('よんだ？ わたしの 名前、雪の ゆき！', 'You called? My name is Yuki, as in snow!', YUKI, 'snowchild')])
      if (k === 'しんしん') return (c.learn('shinshin'), c.sparkle('dust'), [c.say('しーっ… きこえる？ 雪の おと。', 'Shh… can you hear it? The sound of the snow.', YUKI, 'snowchild')])
      if (k === 'はる') return (c.learn('haru'), [c.say('はる！？ まだ やだ〜！ とけちゃう！', 'Spring?! Not yet~! I’ll melt!', YUKI, 'snowchild')])
      return null
    },
    // ── Tsurara-onna ──
    'fk9-tsurara': (c, k) => {
      if (k === 'あつい' || k === 'なつ') return (c.learn(k === 'あつい' ? 'atsui' : 'natsu'), [c.say('…その ことばは、こわいの。やめて。', '…That word frightens me. Please don’t.', TSURARA, 'villager-b')])
      if (k === 'ふゆ' || k === 'こおり') return (c.learn(k === 'ふゆ' ? 'fuyu' : 'koori'), c.sparkle('spark'), [c.say('ふふ… すずしい ことば。すき。', 'Hehe… what a cool word. I like it.', TSURARA, 'villager-b')])
      return null
    },
    'lk-thin-ice': (c, k) => (k === 'こおり' ? (c.learn('koori'), c.sparkle('ripple'), [c.narrate('「こおり」！ うすい こおりが かちかちに なった。これで あんしん。', '“Koori”! The thin ice freezes hard and solid. Safe now.'), ...(first(c, 'cast.lk-thin-ice') ? c.reward(10, 5) : [])]) : null),
    // ── Mokumokuren ──
    'fk9-shoji': (c, k) => {
      if (k === 'みる') return (c.learn('miru'), [c.say('見る？ わたしたち、見るのが しごと！', 'See? Seeing is our job!', EYES, 'wisp')])
      if (k !== 'かみ') return null
      c.learn('kami')
      if (c.stage('fk9-mokumoku') !== 1) return [c.narrate('紙が ひらひら まって、しょうじに はりついた。', 'Paper flutters through the air and sticks to the screen.')]
      c.sparkle('dust')
      c.sfx('correct')
      return [
        c.narrate('「かみ」！ まっしろな わしが ふわりと まい、しょうじの あなを 一つ 一つ ふさいだ。', '“Kami”! Sheets of white washi drift up and patch the holes, one by one.'),
        c.narrate('めたちは 一つずつ とじて… さいごに、ちいさな め が 一つだけ のこった。', 'One by one the eyes close… until a single small eye is left.'),
        c.say('あったかい。…ありがとう。これからは ひとりで、しずかに 見まもるね。', 'So warm. …Thank you. From now on, just one of us will quietly watch over the writing.', EYES, 'wisp'),
        ...c.give('r9-shoji-eye'),
        ...c.reward(90, 35),
        ...c.advance('fk9-mokumoku'),
        ...c.seal('mokumokuren'),
        c.say('…ずっと むかし、ここで 名前を なんども なんども 書いて いた むすめを 見たよ。ひらがなで 書いて、けして、また 書いて。', '…Long, long ago, we watched a girl write her name here, over and over. In hiragana, then rubbed out, then again.', EYES, 'wisp'),
        c.say('さいごに 漢字で 書けた とき、あの子は ないて わらった。「わたしの 名前、おとなんだ」って。', 'When at last she wrote it in kanji, she laughed and cried at once. “My name is a sound,” she said.', EYES, 'wisp'),
        c.fude('おとの 名前… ことね！', 'A name that’s a sound… Kotone!'),
      ]
    },
    // ── Playful reactions ──
    'st-cat': (c, k) => (k === 'ねこ' ? (c.learn('neko'), [c.say('にゃ… （こたつの ほうが すき、と いう かお）', 'Mew… (It looks like it would prefer a kotatsu.)')]) : null),
    'st-kids': (c, k) => (k === 'ゆき' ? (c.learn('yuki'), [c.say('雪だま、ついか〜！ くらえ！', 'Extra snowballs! Take that!')]) : null),
    'st-pilgrims': (c, k) => {
      if (k === 'はは' || k === 'ちち') return (c.learn(k === 'はは' ? 'haha' : 'chichi'), [c.say('あら、わたしの ことを 母、なんて。じぶんの かぞくの ことば よ、それ。ふふ。', 'Oh my, calling me はは? That’s the word for your OWN mother, you know. Hehe.')])
      if (k === 'かぞく') return (c.learn('kazoku'), c.sparkle('spark'), [c.say('そう、かぞく！ 父と 母と 兄と 妹で、四人かぞく です。', 'That’s right, family! Father, mother, big brother and little sister: a family of four.')])
      return null
    },
    'st-sweeper': (c, k) => {
      const s: Record<string, [string, string, string]> = {
        はる: ['haru', 'さくらの つぼみが 一つ… いや、まだ はやい。', 'One cherry bud… no, it’s still too early.'],
        なつ: ['natsu', 'せみの こえが… 一しゅん だけ きこえた 気が した。', 'For a second, you think you hear a cicada.'],
        あき: ['aki', 'もみじが 一まい、どこからか まいおりた。', 'A single maple leaf drifts down from nowhere.'],
        ふゆ: ['fuyu', 'はいた ところに、また 雪が つもった。おぼうさんは にがわらい。', 'Snow piles back onto the swept path. The monk smiles wryly.'],
      }
      const r = s[k]
      return r ? (c.learn(r[0]), c.sparkle('leaf'), [c.narrate(r[1], r[2])]) : null
    },
    'st-compass': (c, k) => {
      const d: Record<string, [string, string, string]> = {
        ひがし: ['higashi', '東の しるしが ひかった。あさひが のぼる ほう。', 'The east mark glows: where the morning sun rises.'],
        にし: ['nishi', '西の しるしが ひかった。夕日が しずむ ほう。', 'The west mark glows: where the evening sun sets.'],
        みなみ: ['minami', '南の しるしが ひかった。じょうかまちの ほう。', 'The south mark glows: toward the Castle Town.'],
        きた: ['kita', '北の しるしが ひかった。こおりの あなの ほう。…ちょっと さむい。', 'The north mark glows: toward the ice cave. …A little chilly.'],
      }
      const r = d[k]
      return r ? (c.learn(r[0]), c.sparkle('spark'), [c.narrate(r[1], r[2]), ...(first(c, `cast.st-compass.${k}`) ? c.reward(8, 3) : [])]) : null
    },
  },
  mapCast: {
    snowtemple: (c, k) => {
      if (k === 'ゆき') return (c.learn('yuki'), c.sparkle('dust'), [c.narrate('「ゆき」！ 雪が いっそう しずかに、しんしんと ふりはじめた。', '“Yuki”! The snow begins to fall even more softly: shin-shin.')])
      if (k === 'しんしん') return (c.learn('shinshin'), [c.narrate('……。 せかいが いっしゅん、雪の おとだけに なった。', '…… For a moment, the whole world is only the sound of snow.'), c.fude('いっぱいの しずけさ… すき。', 'A full kind of quiet… I like it.')])
      if (k === 'ゆきだるま') return (c.learn('yukidaruma'), c.sparkle('spark'), [c.narrate('あしもとに、てのひらサイズの 雪だるまが ぽんっ。', 'Pop: a palm-sized snowman appears at your feet.')])
      if (k === 'かね') return (c.learn('kane'), [c.narrate('とおくで、鐘が 一つ なった。ゴーン…', 'Far off, the bell tolls once. Gooon…')])
      if (k === 'はる') return (c.learn('haru'), [c.narrate('雪の 下から、ふきのとうが 一つ かおを だして… さむくて ひっこんだ。', 'A butterbur sprout peeks out of the snow… and ducks back in from the cold.')])
      return null
    },
    'snowtemple-library': (c, k) => {
      if (k === 'かんじ') return (c.learn('kanji'), c.sparkle('dust'), [c.narrate('「かんじ」！ ほんだなの 字が、一しゅん ぱっと ひかった。', '“Kanji”! For a moment, every character on the shelves flashes.')])
      if (k === 'べんきょう') return (c.learn('benkyou'), [c.narrate('しゃきょうの おぼうさんたちが、いっせいに せすじを のばした。', 'All the copying monks straighten their backs at once.')])
      return null
    },
    'snowtemple-lake': (c, k) => {
      if (k === 'こおり') return (c.learn('koori'), c.sparkle('ripple'), [c.narrate('みずうみの こおりが、ぴしっと なった。', 'The ice on the lake gives a sharp crack.')])
      if (k === 'さかな') return (c.learn('sakana'), [c.narrate('こおりの あなから、わかさぎが ぴょんと はねた。', 'A smelt leaps out of an ice hole.')])
      return null
    },
  },
}

export const CONTENT: TaleContent[] = [SNOWTEMPLE_TALES]

/**
 * Region 3 folklore side tales — three spirits of the Forest of Sentences:
 * a proud tengu who tests your particles and trains you to write fast,
 * Bunbuku the tanuki stuck as a tea kettle (cool it down, help it remember,
 * cheer its tightrope show), and Yamabiko, the mountain echo whose voice the
 * hungry quiet keeps swallowing.
 */
import type { PlayerState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import { offer } from './r1-village'
import type { Ctx, TaleContent } from './types'

const TENGU = { jp: 'てんぐ', en: 'Tengu' }
const BUNBUKU = { jp: 'ぶんぶく', en: 'Bunbuku' }
const JINBEI = { jp: 'じんべえ', en: 'Jinbei' }
const YAMABIKO = { jp: 'やまびこ', en: 'Yamabiko' }

const stageOf = (s: PlayerState, tale: string) => s.flags?.[`tale.${tale}`] ?? -1

/** The tengu's three sentence trials; progress is kept so a wrong answer resumes where you were. */
function tenguTrial(c: Ctx, i: number): Step[] {
  const pass = (next: number, jp: string, en: string): Step[] => {
    c.set('fk3.tengu.trial', next)
    c.sparkle('leaf')
    c.sfx('correct')
    return [c.say(jp, en), ...tenguTrial(c, next)]
  }
  if (i === 0)
    return [
      c.say('だい1の しれん！ じょしを いれよ。', 'First trial! Fill in the particle.'),
      c.ask({ jp: '「てんぐは やま＿ すんでいる」', en: '“Tengu wa yama _ sunde iru.” (The tengu lives on the mountain.)' }, ['に', 'ni'], (ok) => {
        if (!ok) return [c.say('わはは！ ちがう ちがう！', 'Wahaha! Wrong, wrong!'), c.fude('すんでいる ばしょを さす じょしは…？', 'The particle that points to where you live is…?')]
        c.learn('yama')
        return pass(1, 'てんぐは やまに すんでいる。…よし！', 'The tengu lives on the mountain. …Good!')
      }),
    ]
  if (i === 1)
    return [
      c.say('だい2の しれん！ ただしく ならべた ぶんは どれだ？', 'Second trial! Which sentence is in the right order?'),
      c.choice(
        { jp: '「わたし・うちわ・つかう」', en: 'watashi · uchiwa · tsukau (I use a fan.)' },
        [
          ['flip', 'うちわは わたしを つかう', 'Uchiwa wa watashi o tsukau'],
          ['ok', 'わたしは うちわを つかう', 'Watashi wa uchiwa o tsukau'],
          ['verb', 'つかう わたしは うちわを', 'Tsukau watashi wa uchiwa o'],
        ],
        (id) => {
          if (id === 'flip') return [c.say('ほう！ うちわが おまえを つかうのか！ わはははは！', 'Oho! The FAN uses YOU?! Wahahahaha!'), c.fude('「は」と「を」が いれかわっちゃった…！', 'We swapped は and を…!')]
          if (id === 'verb') return [c.say('うごきの ことばが いちばん まえ？ ぶんが さかだち しておる！', 'The verb first? Your sentence is doing a handstand!'), c.fude('にほんごの うごきの ことばは、さいごに くるよ。', 'In Japanese, the verb comes last.')]
          c.learn('tsukau')
          return pass(2, 'わたしは うちわを つかう。…ふむ、やるな！', 'I use a fan. …Hmph, not bad!')
        },
      ),
    ]
  if (i === 2)
    return [
      c.say('さいごの しれん！ どこで するか、の じょしだ。', 'Final trial! The particle for where something happens.'),
      c.ask({ jp: '「わたしは もり＿ ほんを よむ」', en: '“Watashi wa mori _ hon o yomu.” (I read a book in the forest.)' }, ['で', 'de'], (ok) => {
        if (!ok) return [c.say('ちがう！ おまえの ふでは まだ おそい！', 'Wrong! Your brush is still too slow!'), c.fude('ほんを よむ ばしょ… うごきの ばしょは「で」かな？', 'Where you do the reading… the place of an action takes…?')]
        c.learn('yomu')
        c.learn('hon')
        return pass(3, 'わたしは もりで ほんを よむ。みごと！', 'I read a book in the forest. Splendid!')
      }),
    ]
  c.sfx('correct')
  return [
    c.say('みっつ とも ただしい。あたまは よし。…では、うでは どうかな？', 'All three correct. Your head is sharp. …But what of your arm?'),
    c.say('ひがしの すみの けいこいわを、かぜで はらって みせよ。', 'Go to the training boulder in the corner and sweep it clean with the wind.'),
    ...c.advance('fk3-tengu'),
  ]
}

export const FOREST_FOLK: TaleContent = {
  yokai: [
    {
      id: 'tengu',
      region: 3,
      name: 'Tengu',
      jp: '天狗',
      kana: 'てんぐ',
      emoji: '👺',
      lore: 'Tengu are proud, long-nosed spirits of the deep mountains who fly on feathered wings and stir up storms with a single sweep of their feather fans. Legend says a tengu secretly trained the young warrior Ushiwakamaru on Mount Kurama, teaching him to move faster than any blade.',
      hint: 'On a windy ridge, a red-faced teacher waits with a fan and a test.',
      words: ['yama', 'tsukau', 'yomu', 'hon', 'kaze', 'kaku'],
    },
    {
      id: 'bunbuku',
      region: 3,
      name: 'Bunbuku Chagama',
      jp: '分福茶釜',
      kana: 'ぶんぶくちゃがま',
      emoji: '🫖',
      lore: 'A tanuki rescued from a trap turned itself into a tea kettle so its kind rescuer could sell it — but when the new owner set it on the fire, it yelped, sprouted a furry tail and couldn’t quite change back. Half kettle, half tanuki, it became famous for tightrope-walking shows that made its friend’s fortune.',
      hint: 'Somewhere in the woods, a tea kettle is crying “Hot! Hot!”',
      words: ['mizu', 'ame', 'hi', 'ocha', 'wataru'],
    },
    {
      id: 'yamabiko',
      region: 3,
      name: 'Yamabiko',
      jp: '山彦',
      kana: 'やまびこ',
      emoji: '🏔️',
      lore: 'When you shout into the mountains and your voice comes back, old stories say it is the yamabiko answering — a shy spirit that lives in the cliffs and repeats whatever it hears. Some say it is lonely, and only calls back so that no voice ever goes unanswered.',
      hint: 'High in the quiet north, something tries to answer — and can’t.',
      words: ['yama', 'iru', 'matsu', 'tomodachi', 'kiku'],
    },
  ],
  items: [
    { id: 'fk3-feather', name: 'Tengu Feather', jp: 'てんぐの はね', kana: 'てんぐのはね', emoji: '🪶', desc: 'A glossy black feather from a tengu’s fan. Your brush feels quicker just holding it.' },
    { id: 'fk3-tea', name: 'Bunbuku’s Tea Leaves', jp: 'ぶんぶくの おちゃっぱ', kana: 'ぶんぶくのおちゃっぱ', emoji: '🍵', desc: 'A twist of tea leaves from a kettle that is also a tanuki. Brews best at “not too hot”.' },
    { id: 'fk3-echo-stone', name: 'Echo Pebble', jp: 'やまびこの いし', kana: 'やまびこのいし', emoji: '🪨', desc: 'Hold it to your ear and a small voice says back whatever you just said.' },
  ],
  tales: [
    {
      id: 'fk3-tengu',
      region: 3,
      title: 'The Tengu’s Trial',
      jp: 'てんぐの しれん',
      summary: 'A proud mountain tengu with a feather fan wants to see if your sentences are as sharp as your magic.',
      yokai: 'tengu',
      giver: 'fk3-tengu',
      stages: [
        { en: 'Pass the tengu’s three sentence trials', jp: 'てんぐの ぶんの しれんを 3つ こえよう', target: ['fk3-tengu'], map: 'forest' },
        { en: 'At the training boulder, sweep the leaves away with かぜ, then write with かく', jp: 'けいこいわで「かぜ」、そして「かく」と となえよう', target: ['fk3-tengu-stone'], map: 'forest' },
        { en: 'Return to the tengu', jp: 'てんぐの ところへ もどろう', target: ['fk3-tengu'], map: 'forest' },
      ],
    },
    {
      id: 'fk3-bunbuku',
      region: 3,
      title: 'The Lucky Tea Kettle',
      jp: 'ぶんぶく ちゃがま',
      summary: 'Jinbei the tinker put his new kettle on the fire — and it yelled “HOT!”',
      yokai: 'bunbuku',
      giver: 'fk3-tinker',
      stages: [
        { en: 'Cool down the yelping kettle with water (cast みず at it)', jp: 'ちゃがまに「みず」を かけて ひやそう', target: ['fk3-chagama'], map: 'forest' },
        { en: 'Help the kettle remember what it really is (talk to it)', jp: 'ちゃがまに ほんとうの すがたを おもいださせよう', target: ['fk3-chagama'], map: 'forest' },
        { en: 'Cheer Bunbuku across the tightrope (cast わたる at it)', jp: '「わたる」で ぶんぶくの つなわたりを おうえんしよう', target: ['fk3-chagama'], map: 'forest' },
      ],
    },
    {
      id: 'fk3-echo',
      region: 3,
      title: 'The Echo That Lost Its Voice',
      jp: 'こえを なくした やまびこ',
      summary: 'In the quiet northern rocks, a mountain echo can no longer call back. The quiet keeps swallowing its voice.',
      yokai: 'yamabiko',
      giver: 'fk3-yamabiko',
      stages: [
        { en: 'From the Calling Rock, call out the name of the echo’s home', jp: 'よびかけの いわから、やまびこの すみかの なまえを よぼう', target: ['fk3-echo-rock'], map: 'forest' },
        { en: 'Help Yamabiko put its jumbled sentences back together', jp: 'やまびこの ばらばらの ぶんを なおそう', target: ['fk3-yamabiko'], map: 'forest' },
        { en: 'Call ともだち from the Calling Rock so the whole mountain hears', jp: 'よびかけの いわから「ともだち」と よぼう', target: ['fk3-echo-rock'], map: 'forest' },
      ],
    },
  ],
  entities: {
    forest: [
      { id: 'fk3-tengu', kind: 'npc', sprite: 'tengu', x: 41, y: 29, dir: 'left', name: TENGU, lines: [{ jp: 'わしは てんぐ。この 山の ぬしだ。', en: 'I am the tengu, master of this mountain.' }] },
      { id: 'fk3-tengu-stone', kind: 'landmark', tile: 'boulder', x: 43, y: 30, name: { jp: 'けいこいわ', en: 'Training Boulder' }, lines: [{ jp: 'はっぱに うもれた おおきな いわ。きずが たくさん ある。', en: 'A big boulder buried in leaves, covered in old nicks and scratches.' }] },
      { id: 'fk3-tinker', kind: 'npc', sprite: 'merchant', x: 11, y: 31, dir: 'right', name: JINBEI, lines: [{ jp: 'なべ、かま、なんでも なおすよ。', en: 'Pots, kettles — I fix anything.' }] },
      { id: 'fk3-hearth', kind: 'landmark', tile: 'campfire', x: 12, y: 31, name: { jp: 'いろり', en: 'Hearth' }, lines: [{ jp: 'ぱちぱち もえる たきび。', en: 'A crackling little fire.' }] },
      { id: 'fk3-chagama', kind: 'npc', sprite: 'tanuki', x: 13, y: 31, dir: 'left', name: { jp: 'ちゃがま', en: 'Odd Kettle' }, lines: [{ jp: 'ぶく… ぶく…', en: 'Bubble… bubble…' }] },
      { id: 'fk3-yamabiko', kind: 'npc', sprite: 'wisp', x: 3, y: 2, dir: 'down', name: YAMABIKO, lines: [{ jp: '…こ… え…', en: '…voi… ce…' }] },
      { id: 'fk3-echo-rock', kind: 'landmark', tile: 'rock', x: 7, y: 2, name: { jp: 'よびかけの いわ', en: 'Calling Rock' }, lines: [{ jp: 'やまに むかって、よびかけて ごらん。', en: 'Face the mountain and call out.' }] },
    ],
  },
  ghost: {
    // Faint until its voice is whole again.
    'fk3-yamabiko': (s) => stageOf(s, 'fk3-echo') < 3,
  },
  talk: {
    // ── The Tengu’s Trial ─────────────────────────────────────────────
    'fk3-tengu': (c) => {
      const st = c.stage('fk3-tengu')
      if (st < 0)
        return offer(
          c,
          'fk3-tengu',
          [
            c.narrate('あかい かおに ながい はな。はねの うちわを ぱたぱた させている。', 'A red face, a very long nose, and a feather fan going flap, flap.'),
            c.say('わしは てんぐ。この 山で、つよい ものを きたえて いる。', 'I am a tengu. On this mountain, I train the strong.'),
            c.say('おまえ、ことばの まほうを つかうな？ わしの しれんを うけて みるか？', 'You use word magic, do you? Dare you take my trial?'),
          ],
          ['うける！', 'I accept!'],
          ['こわい…', 'Too scary…'],
        )
      if (st === 0) return tenguTrial(c, c.flag('fk3.tengu.trial'))
      if (st === 1) return [c.say(c.flag('fk3.tengu.wind') ? 'いわは きれいに なったな。さあ、かけ！ はやく！' : 'けいこいわを かぜで はらえ。わしの かぜに まけるなよ！', c.flag('fk3.tengu.wind') ? 'The boulder is clear. Now write! Quickly!' : 'Sweep the training boulder with the wind. Don’t lose to mine!')]
      if (st === 2) {
        c.sparkle('leaf')
        return [
          c.say('みたぞ。かぜより はやい ふでだ。わはは、きにいった！', 'I saw it. A brush faster than the wind. Wahaha, I like you!'),
          c.say('これは わしの うちわの はね。もって いけ、でし よ。', 'Take this feather from my fan, my student.'),
          ...c.give('fk3-feather'),
          ...c.reward(75, 30),
          ...c.advance('fk3-tengu'),
          ...c.seal('tengu'),
          c.say('…なつかしい。むかし、ふでを もった おんなのこも ここで けいこを した。わしの かぜより はやく かいたものだ。', '…This takes me back. Long ago, a girl with a brush trained here too. She wrote faster than my wind.'),
          c.fude('ふでを もった おんなのこ…？ てんぐさん、その こ、どんな こ だったの？', 'A girl with a brush…? Tengu, what was she like?'),
          c.say('ふん。それは、おまえが じぶんで おもいだす ことだ。', 'Hmph. That is for you to remember yourself.'),
        ]
      }
      return [c.say('きょうも けいこか？ よい こころがけだ。', 'Training again today? A fine habit.')]
    },
    'fk3-tengu-stone': (c) => {
      const st = c.stage('fk3-tengu')
      if (st !== 1) return null
      if (!c.flag('fk3.tengu.wind')) return [c.narrate('いわは はっぱに うもれて いる。', 'The boulder is buried under leaves.'), c.fude('かぜの ことばで ふきとばそう！', 'Let’s blow them away with a wind word!')]
      return [c.narrate('いわに「はやく かけ」と きざまれている。', 'Carved in the stone: “Write fast.”'), c.fude('かく！って となえよう！', 'Let’s cast かく — write!')]
    },

    // ── The Lucky Tea Kettle ──────────────────────────────────────────
    'fk3-tinker': (c) => {
      const st = c.stage('fk3-bunbuku')
      if (st < 0)
        return offer(c, 'fk3-bunbuku', [
          c.say('たすけて！ この ちゃがまが「あつい！」って さけんだんだ！', 'Help! My kettle just yelled “HOT!”'),
          c.say('きのう、わなに かかった たぬきを たすけたら、けさ ここに この ちゃがまが あって…', 'Yesterday I freed a tanuki from a trap, and this morning this kettle was sitting right here…'),
          c.say('おちゃを のもうと 火に かけたら… しっぽが はえて きた！', 'I put it on the fire for tea… and it sprouted a tail!'),
          c.fude('それって、もしかして…！', 'Wait… could it be…!'),
        ])
      if (st === 0) return [c.say('はやく 水を！ ちゃがまが ないてる！', 'Water, quick! The kettle is crying!')]
      if (st === 1) return [c.say('ちゃがまが しゃべった… ほんとうに しゃべった…', 'The kettle talked… it really talked…')]
      if (st === 2) return [c.say('つなは はったぞ！ さあ、みせものの はじまりだ！', 'The rope is strung! Let the show begin!')]
      return [c.say('ぶんぶくの おかげで、まいにち おきゃくさんが くるよ。', 'Thanks to Bunbuku, customers come every day.')]
    },
    'fk3-hearth': (c) => (c.stage('fk3-bunbuku') === 0 ? [c.narrate('ちゃがまは いろりの あつい いしの 上で、ぷるぷる ふるえている。', 'The kettle trembles on the hearth’s hot stones.')] : null),
    'fk3-chagama': (c) => {
      const st = c.stage('fk3-bunbuku')
      if (st < 0) return [c.say('あつい… あつい…', 'Hot… hot…', BUNBUKU, 'tanuki'), c.narrate('ちゃがまから、ふわふわの しっぽが でている。', 'A fluffy tail is poking out of the kettle.')]
      if (st === 0) return [c.say('あつい！ あつい！ ぼく、ほんとうは ちゃがま じゃ ない〜！', 'Hot! Hot! I’m not really a kettle!', BUNBUKU, 'tanuki'), c.fude('みずで ひやして あげよう！', 'Let’s cool it with water!')]
      if (st === 1)
        return [
          c.say('ふう… ありがとう。ぼく、たぬきの ぶんぶく。', 'Phew… thank you. I’m Bunbuku. A tanuki.', BUNBUKU, 'tanuki'),
          c.say('じんべえさんに おれいが したくて、ちゃがまに ばけたんだ。うれば おかねに なるから。', 'I wanted to repay Jinbei, so I turned into a kettle he could sell.', BUNBUKU, 'tanuki'),
          c.say('でも もとに もどれない… じぶんが なにか、わすれちゃった。', 'But I can’t change back… I forgot what I am.', BUNBUKU, 'tanuki'),
          c.ask({ jp: 'おもいだす ことばを いって！「ぼく＿ たぬき です」', en: 'Say the words that help it remember: “Boku _ tanuki desu.” (I am a tanuki.)' }, ['は', 'わ'], (ok) => {
            if (!ok) return [c.narrate('ちゃがまは ぶくぶく あわを たてた。…なにも かわらない。', 'The kettle bubbles. …Nothing changes.'), c.fude('「ぼく」が テーマだよ。テーマの じょしは…？', '“I” is the topic. The topic particle is…?')]
            c.sparkle('leaf')
            c.sfx('correct')
            return [
              c.say('ぼくは たぬき です！', 'I am a tanuki!', BUNBUKU, 'tanuki'),
              c.narrate('ぽん！ ぽん！ ぽん！ あたまと あしと しっぽが でた。…でも おなかは ちゃがまの まま。', 'Pop! Pop! Pop! Out come a head, legs and a tail. …But the body is still a kettle.'),
              c.say('はんぶん だけ もどった！ …でも、これも わるく ないかも。', 'Halfway back! …You know, I kind of like it.', BUNBUKU, 'tanuki'),
              c.say('そうだ、じんべえさんに おれいの みせものを しよう！ つなわたり！ 「わたる」って おうえん してね！', 'I know — a show to thank Jinbei! Tightrope walking! Cheer me on with わたる!', BUNBUKU, 'tanuki'),
              ...c.advance('fk3-bunbuku'),
            ]
          }),
        ]
      if (st === 2) return [c.say('つなの 上で まってるよ！ 「わたる」って いって！', 'I’m ready on the rope! Say わたる!', BUNBUKU, 'tanuki')]
      return [c.say('ぶんぶく ぶんぶく♪ きょうも つなわたり！', 'Bunbuku, bunbuku♪ Rope-walking again today!', BUNBUKU, 'tanuki')]
    },

    // ── The Echo That Lost Its Voice ──────────────────────────────────
    'fk3-yamabiko': (c) => {
      const st = c.stage('fk3-echo')
      if (st < 0)
        return offer(
          c,
          'fk3-echo',
          [
            c.narrate('いわかげに、すけた ちいさな ようかいが うずくまっている。', 'A faint, see-through little spirit is huddled among the rocks.'),
            c.say('…ぼくは やまびこ。よばれた ことばを かえすのが、ぼくの しごと…', '…I’m Yamabiko. Calling back whatever you call — that’s my job…'),
            c.say('でも、しずけさが ぼくの こえを たべて しまう。もう、こえが でない…', 'But the quiet keeps eating my voice. I can hardly make a sound anymore…'),
            c.fude('しずけさが、こえを たべる…？ たすけて あげようよ！', 'The quiet… eats voices? Let’s help!'),
          ],
          ['よびかける！', 'I’ll call out!'],
        )
      if (st === 0) return [c.say('…あの いわから、ぼくの おうちの なまえを よんで…', '…From that rock over there… call the name of my home…'), c.fude('やまびこの おうち… 「やま」かな？', 'Yamabiko’s home… the mountain, maybe?')]
      if (st === 1) {
        const order = (): Step[] => [
          c.say('もう ひとつ、かえって きた ぶん。…ここ … ともだちを … まつ …', 'One more came back… here… a friend… wait…'),
          c.ask({ jp: '「ぼくは ここ＿ ともだちを まつ」', en: '“Boku wa koko _ tomodachi o matsu.” (I wait here for a friend.) Which particle?' }, ['で', 'de'], (ok) => {
            if (!ok) return [c.narrate('ことばは いわに ぶつかって、ころころ ころがった。', 'The words bounce off the rocks and roll away.'), c.fude('まつ ばしょ… うごきの ばしょは「で」かな？', 'Where the waiting happens… the place of an action takes…?')]
            c.learn('matsu')
            c.learn('tomodachi')
            c.sparkle('spark')
            c.sfx('correct')
            return [
              c.say('ぼくは ここで ともだちを まつ。…そう。ずっと、まってたんだ。', 'I wait here for a friend. …Yes. I’ve been waiting for so long.'),
              c.fude('じゃあ、ともだちを よぼう！ みんなに きこえるように！', 'Then let’s call for a friend! Loud enough for everyone to hear!'),
              ...c.advance('fk3-echo'),
            ]
          }),
        ]
        if (c.flag('fk3.echo.order')) return order()
        return [
          c.say('こえが もどって きた！ でも… ことばが ばらばらに かえって くる…', 'My voice is coming back! But… the words come back all jumbled…'),
          c.say('…いる … やまに … ぼくは …', '…am… on the mountain… I…'),
          c.choice(
            { jp: 'やまびこの ぶんを ならべなおそう', en: 'Put Yamabiko’s sentence back in order.' },
            [
              ['back', 'いる やまに ぼくは', 'Iru yama ni boku wa'],
              ['swap', 'ぼくに やまは いる', 'Boku ni yama wa iru'],
              ['ok', 'ぼくは やまに いる', 'Boku wa yama ni iru'],
            ],
            (id) => {
              if (id === 'back') return [c.say('いる… やまに… ぼくは… …さかさまの まま だよ。', 'Am… on the mountain… I… …still backwards.'), c.fude('うごきの ことば「いる」は さいごだね。', 'The verb いる goes last.')]
              if (id === 'swap') return [c.say('ぼくの 中に、やまが いる…？ おなかが おもい…', 'There’s a mountain… inside me…? My tummy feels heavy…'), c.fude('「は」と「に」が いれかわってる！', 'は and に got swapped!')]
              c.learn('iru')
              c.learn('yama')
              c.set('fk3.echo.order')
              c.sparkle('spark')
              return [c.say('ぼくは やまに いる。…ぼくは、やまに いる！', 'I am on the mountain. …I am on the mountain!'), ...order()]
            },
          ),
        ]
      }
      if (st === 2) return [c.say('いわから、おおきな こえで よんで。ぼく、ぜんぶ かえすから！', 'Call from the rock, nice and loud. I’ll call it all back!'), c.fude('ともだちを よぶ ことば… 「ともだち」！', 'The word for calling a friend… ともだち!')]
      return [c.say('やっほー！ …やっほー… やっほー…♪', 'Yoo-hoo! …yoo-hoo… yoo-hoo…♪')]
    },
    'fk3-echo-rock': (c) => {
      const st = c.stage('fk3-echo')
      if (st === 0) return [c.fude('ここから やまに むかって、ことばを となえよう！', 'Let’s cast a word from here, toward the mountain!')]
      if (st === 2) return [c.fude('「ともだち」って、おおきな こえで！', 'ともだち — nice and loud!')]
      return null
    },
  },
  cast: {
    // ── The Tengu’s Trial ─────────────────────────────────────────────
    'fk3-tengu-stone': (c, k) => {
      const st = c.stage('fk3-tengu')
      if (k === 'かぜ') {
        c.learn('kaze')
        c.sparkle('leaf')
        if (st !== 1 || c.flag('fk3.tengu.wind')) return [c.narrate('「かぜ」！ びゅう！ いわの 上を かぜが はしった。', '“Kaze”! Whoosh! Wind races over the boulder.')]
        c.set('fk3.tengu.wind')
        c.sfx('correct')
        return [
          c.narrate('「かぜ」！ びゅうう！ はっぱが いっせいに まいあがった！', '“Kaze”! WHOOSH! The leaves fly up all at once!'),
          c.narrate('いわに、ふるい もじが きざまれている。「はやく かけ」。', 'Old letters are carved underneath: “Write fast.”'),
          c.say('ほう、やるな。では、かけ！ はやく！', 'Oho, well done. Now — write! Fast!', TENGU, 'tengu'),
        ]
      }
      if (k === 'かく') {
        c.learn('kaku')
        if (st !== 1) return [c.narrate('いわに ちいさな ぶんを かいた。「わたしは いわを みる」。', 'You write a tiny sentence on the boulder: “I look at the rock.”')]
        if (!c.flag('fk3.tengu.wind')) return [c.narrate('はっぱが じゃまで、なにも かけない。', 'The leaves are in the way. You can’t write anything.'), c.fude('さきに はっぱを ふきとばそう！', 'Let’s blow the leaves away first!')]
        c.sparkle('spark')
        c.sfx('correct')
        return [
          c.narrate('「かく」！ ふでが はしった。シュッ、シュッ、シュッ！', '“Kaku”! The brush flies. Swish, swish, swish!'),
          c.narrate('いわに、ひかる もじが いっしゅんで ならんだ。「わたしは かぜより はやく かく」。', 'In a blink, glowing letters line the stone: “I write faster than the wind.”'),
          c.say('…ほう。', '…Oho.', TENGU, 'tengu'),
          ...c.advance('fk3-tengu'),
        ]
      }
      if (k === 'ひ' || k === 'ほのお') return (c.learn(k === 'ひ' ? 'hi' : 'honoo'), [c.narrate('はっぱが ちょっと こげた。', 'The leaves get a little singed.'), c.say('こら！ 火では ない、かぜだ！', 'Hey! Not fire — wind!', TENGU, 'tengu')])
      return null
    },
    'fk3-tengu': (c, k) => {
      if (k === 'かぜ') return (c.learn('kaze'), [c.narrate('ひゅう… そよかぜが ふいた。', 'Fwoo… a little breeze.'), c.say('それが かぜか？ わしの かぜは こうだ！', 'You call that wind? THIS is wind!'), c.narrate('ぶわっ！ てんぐの うちわで、あなたは くるくる まわった。', 'FWAP! One sweep of the tengu’s fan sends you spinning.')])
      if (k === 'やま') return (c.learn('yama'), [c.say('いかにも。この やまは わしの やまだ。', 'Indeed. This mountain is MY mountain.')])
      if (k === 'はなす') return (c.learn('hanasu'), [c.say('はなすより、かけ！ ふでは くちより はやい！', 'Less talking, more writing! A brush is faster than a mouth!')])
      if (k === 'かく') return (c.learn('kaku'), [c.say('よい ことばだ。かく ものは、つよい。', 'A fine word. Those who write are strong.')])
      return null
    },

    // ── The Lucky Tea Kettle ──────────────────────────────────────────
    'fk3-chagama': (c, k) => {
      const st = c.stage('fk3-bunbuku')
      if (k === 'みず' || k === 'あめ') {
        c.learn(k === 'みず' ? 'mizu' : 'ame')
        c.sparkle('ripple')
        if (st !== 0) return [c.say('つめたい〜。きもちいい。', 'Ooh, cool. That’s nice.', BUNBUKU, 'tanuki')]
        c.sfx('correct')
        return [
          c.narrate(`「${k}」！ じゅわわわ〜っ！ ゆげが もくもく あがった。`, `“${k === 'みず' ? 'Mizu' : 'Ame'}”! Tsssssss! Clouds of steam billow up.`),
          c.say('ふう〜… たすかった…', 'Phew… saved…', BUNBUKU, 'tanuki'),
          c.say('ちゃがまが… ためいきを ついた…！？', 'The kettle… just sighed…?!', JINBEI, 'merchant'),
          ...c.advance('fk3-bunbuku'),
        ]
      }
      if (k === 'ひ' || k === 'ほのお') {
        c.learn(k === 'ひ' ? 'hi' : 'honoo')
        return [c.say('あちちちちち！！', 'HOT HOT HOT HOT!!', BUNBUKU, 'tanuki'), c.narrate('ちゃがまは ぴょんぴょん はねまわった。', 'The kettle hops around wildly.'), c.fude('ご、ごめん！ はんたいだった！', 'S-sorry! That was the opposite!')]
      }
      if (k === 'おちゃ') return (c.learn('ocha'), [c.say(st >= 2 ? 'おちゃなら ぼくに まかせて！ ぬるめでね。' : 'おちゃは もう いい〜！', st >= 2 ? 'Leave the tea to me! Lukewarm, please.' : 'No more tea!', BUNBUKU, 'tanuki')])
      if (k === 'のむ') return (c.learn('nomu'), [c.say('のまないで〜！ ぼく、まだ からっぽ だよ！', 'Don’t drink me! I’m empty!', BUNBUKU, 'tanuki')])
      if (k === 'わたる') {
        c.learn('wataru')
        if (st < 2) return [c.say('わたる？ どこを？', 'Cross? Cross what?', BUNBUKU, 'tanuki')]
        if (st > 2) return [c.narrate('ぶんぶくは つなの 上で、くるっと ちゅうがえり した。', 'Bunbuku does a neat somersault on the rope.')]
        c.sparkle('spark')
        c.sfx('correct')
        return [
          c.narrate('じんべえが 木と 木の あいだに、つなを ぴんと はった。', 'Jinbei strings a rope tight between two trees.'),
          c.narrate('「わたる」！ ちゃがまの たぬきが、つなの 上を そろり、そろり… わたった！', '“Wataru”! The kettle-tanuki tiptoes along the rope… and crosses!'),
          c.narrate('もりの どうぶつたちが あつまって、はくしゅ かっさい！', 'The forest animals gather round, clapping and cheering!'),
          c.say('すごいぞ、ぶんぶく！ ぶんぶく ちゃがまの みせものだ！', 'Amazing, Bunbuku! The Bunbuku Chagama show!', JINBEI, 'merchant'),
          c.say('たすけて くれて ありがとう！ これ、ぼくの とくせい おちゃっぱ。', 'Thank you for helping me! Here — my special tea leaves.', BUNBUKU, 'tanuki'),
          ...c.give('fk3-tea'),
          ...c.reward(70, 30),
          ...c.advance('fk3-bunbuku'),
          ...c.seal('bunbuku'),
          c.say('そうだ… むかし、ふでを もった おんなのこが、ぼくの ふたに「ぶんぶく」って かいて くれたんだ。それが ぼくの なまえ。', 'Oh… long ago, a girl with a brush wrote “Bunbuku” on my lid. That’s how I got my name.', BUNBUKU, 'tanuki'),
          c.fude('なまえを かいて くれる おんなのこ… なんだか、ふでが ぽかぽか する。', 'A girl who wrote names for everyone… Why do my bristles feel so warm?'),
        ]
      }
      return null
    },
    'fk3-hearth': (c, k) => {
      if (k === 'みず' || k === 'あめ') {
        c.learn(k === 'みず' ? 'mizu' : 'ame')
        return [c.narrate('じゅっ。たきびが すこし ちいさく なった。', 'Tssh. The fire shrinks a little.'), ...(c.stage('fk3-bunbuku') === 0 ? [c.fude('ちゃがま じしんに かけて あげよう！', 'Let’s pour it on the kettle itself!')] : [])]
      }
      if (k === 'ひ') return (c.learn('hi'), [c.narrate('たきびが ぼうっと おおきく なった。', 'The fire flares up.'), ...(c.stage('fk3-bunbuku') === 0 ? [c.say('やめて〜！', 'Stop thaaat!', BUNBUKU, 'tanuki')] : [])])
      return null
    },
    'fk3-tinker': (c, k) => {
      if (k === 'かう') return (c.learn('kau'), [c.say('かうかい？ …あの ちゃがまだけは、うれないよ。ともだち だからね。', 'Buying? …Not that kettle, though. He’s a friend.')])
      if (k === 'つくる') return (c.learn('tsukuru'), [c.say('つくるのも なおすのも、おれの しごとさ。', 'Making and mending — that’s my trade.')])
      return null
    },

    // ── The Echo That Lost Its Voice ──────────────────────────────────
    'fk3-echo-rock': (c, k) => {
      const st = c.stage('fk3-echo')
      if (st === 0 && k === 'やま') {
        c.learn('yama')
        c.sparkle('spark')
        c.sfx('correct')
        return [
          c.narrate('「やま」！', '“Yama”!'),
          c.narrate('…やま… やま… やま…', '…yama… yama… yama…'),
          c.say('きこえた…！ ぼくの こえだ！', 'I heard it…! That’s my voice!', YAMABIKO, 'wisp'),
          c.narrate('やまびこの からだが、すこし こく なった。', 'The yamabiko looks a little less see-through.'),
          ...c.advance('fk3-echo'),
        ]
      }
      if (st === 2 && k === 'ともだち') {
        c.learn('tomodachi')
        c.sparkle('spark')
        return [
          c.narrate('「ともだち」！', '“Tomodachi”!'),
          c.narrate('ともだち… ともだち… ともだち…！ やまじゅうに こえが ひびいた。', 'Tomodachi… tomodachi… tomodachi…! The whole mountain rings with it.'),
          c.narrate('しずけさが、いっしゅん だけ みみを すました きが した。', 'For a moment, it feels as if the quiet itself is listening.'),
          c.say('こえが… ぜんぶ もどった！ ぼくの ともだちに なって くれるんだね。', 'My voice… it’s all back! You’ll be my friend, won’t you?', YAMABIKO, 'wisp'),
          c.say('ありがとう。これ、ぼくの こえが はいった いし。', 'Thank you. Here — a pebble with my voice inside.', YAMABIKO, 'wisp'),
          ...c.give('fk3-echo-stone'),
          ...c.reward(80, 35),
          ...c.advance('fk3-echo'),
          ...c.seal('yamabiko'),
          c.say('むかし、ふでを もった おんなのこが この いわで、しずけさに よびかけた。「いつか きっと、あなたの なまえを みつけるからね」って。', 'Long ago, a girl with a brush stood on this rock and called into the quiet: “Someday, I’ll find you a name. I promise.”', YAMABIKO, 'wisp'),
          c.say('ぼくは その ことばを、いまも かえしつづけて いるんだ。', 'I’ve been echoing her words ever since.', YAMABIKO, 'wisp'),
          c.fude('しずけさに、なまえを…？ その こは どうして、そんな やくそくを したんだろう。', 'A name… for the quiet? Why would she ever promise something like that?'),
        ]
      }
      if (!k) return null
      if (st >= 3) return [c.narrate(`「${k}」！ …${k}… ${k}… ${k}…♪`, `“${k}”! …${k}… ${k}… ${k}…♪`)]
      const tail = k.slice(-1)
      return [
        c.narrate(`「${k}」！ ……${tail}…`, `“${k}”! ……${tail}…`),
        c.narrate('こだまは すぐに、しずけさに のみこまれて しまった。', 'The echo is swallowed by the quiet almost at once.'),
        ...(st === 0 ? [c.fude('やまびこの おうちの なまえなら、とどくかも！', 'Maybe the name of its home would reach!')] : st === 2 ? [c.fude('ともだちを よぶ ことばが いいな。', 'Let’s use the word for a friend.')] : []),
      ]
    },
    'fk3-yamabiko': (c, k) => {
      if (k === 'ともだち') return (c.learn('tomodachi'), [c.say(c.stage('fk3-echo') >= 3 ? 'ともだち！ …ともだち… ともだち…♪' : '…とも… だ…', c.stage('fk3-echo') >= 3 ? 'Friends! …friends… friends…♪' : '…fri… end…')])
      if (k === 'きく') return (c.learn('kiku'), [c.say('きいて くれるの？ …うれしいな。', 'You’ll listen? …That makes me happy.')])
      if (k === 'やま') return (c.learn('yama'), [c.say('…やま。ぼくの おうち。', '…The mountain. My home.')])
      return null
    },
  },
}

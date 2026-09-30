/**
 * Region 3 — the Forest of Sentences. Three tales about words that link up:
 * a kodama gathering the particle seeds (は・を・に) the Particle Guardian
 * scattered, a fox wedding that needs a sun-shower and a mountain of bread,
 * and a sulky tanuki who only wants someone to listen, watch and be his friend.
 */
import { bossOf } from '../../data/regions'
import { isPassed, type PlayerState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import { offer } from './r1-village'
import type { Ctx, TaleContent } from './types'

const KODAMA = { jp: 'こだま', en: 'Kodama' }
const PON = { jp: 'ポン', en: 'Pon' }
const MUGI = { jp: 'むぎ', en: 'Mugi' }
const FOX = { jp: 'きつね', en: 'Fox' }

const fl = (s: PlayerState, k: string) => s.flags?.[k] ?? 0
const stageOf = (s: PlayerState, tale: string) => s.flags?.[`tale.${tale}`] ?? -1

/** The three particle seeds the kodama needs. */
const SEEDS = ['seed-wa', 'seed-o', 'seed-ni'] as const
const seedsFound = (c: Ctx) => SEEDS.filter((p) => c.flag(`got.${p}`) > 0).length

function gotSeed(c: Ctx, id: (typeof SEEDS)[number]): Step[] {
  c.set(`got.${id}`)
  const out: Step[] = [...c.give(id)]
  const n = seedsFound(c)
  if (n >= 3 && c.stage('forest-voice') === 0) out.push(c.fude('たねが 3つ そろった！ こだまに とどけよう！', 'All three seeds! Let’s bring them to the kodama!'), ...c.advance('forest-voice'))
  else out.push(c.fude(`たねは あと ${3 - n}つ！`, `${3 - n} seed${3 - n === 1 ? '' : 's'} to go!`))
  return out
}

/** Pon’s moods, and the word that lifts each one. */
const PON_NEEDS = ['きく', 'みる', 'ともだち'] as const

/** A one-time small reward for discovering a word reaction. */
function firstTime(c: Ctx, key: string, xp = 10, shards = 5): Step[] {
  if (c.flag(`cast.${key}`)) return []
  c.set(`cast.${key}`)
  return c.reward(xp, shards)
}

/** Katakana words arrive as hiragana (パン → ぱん). */
const isPan = (k: string) => k === 'ぱん' || k === 'パン'

export const FOREST_TALES: TaleContent = {
  items: [
    { id: 'seed-wa', name: 'は Seed', jp: 'はの たね', kana: 'はのたね', emoji: '🌰', desc: 'A seed shaped like は. Written “ha”, but as a particle it says “wa”.' },
    { id: 'seed-o', name: 'を Seed', jp: 'をの たね', kana: 'をのたね', emoji: '🌰', desc: 'A seed shaped like を. It likes to sit right before the verb’s target.' },
    { id: 'seed-ni', name: 'に Seed', jp: 'にの たね', kana: 'にのたね', emoji: '🌰', desc: 'A seed shaped like に. It always points somewhere.' },
    { id: 'kotonoha', name: 'Kotonoha Leaf', jp: 'ことのは', kana: 'ことのは', emoji: '🍃', desc: '“Leaves of words.” The kodama’s thanks. It rustles softly when someone speaks.' },
    { id: 'bread', name: 'Fox Wedding Bread', jp: 'パン', kana: 'ぱん', emoji: '🍞', desc: 'A basket of warm bread for the fox wedding feast. Smells incredible.' },
    { id: 'fox-mask', name: 'Fox Mask', jp: 'きつねの おめん', kana: 'きつねのおめん', emoji: '🦊', desc: 'A wedding favour. Wear it and foxes wink at you.' },
    { id: 'pon-leaf', name: 'Tanuki Leaf', jp: 'たぬきの はっぱ', kana: 'たぬきのはっぱ', emoji: '🍂', desc: 'Pon’s shape-changing leaf. He says you’re not ready to use it. He’s probably right.' },
  ],
  tales: [
    {
      id: 'forest-voice',
      region: 3,
      main: true,
      title: 'The Forest’s Lost Voice',
      jp: 'もりの こえ',
      summary: 'The Particle Guardian scattered the forest’s little words. Without は, を and に, nobody can finish a sentence.',
      giver: 'fo-kodama',
      stages: [
        { en: 'Find the three particle seeds: は (a bramble-choked tablet by the west road), を (the mushroom gatherer) and に (the spring)', jp: 'じょしの たね「は・を・に」を さがそう', target: ['fo-ha-stone', 'fo-gatherer', 'fo-spring'], map: 'forest' },
        { en: 'Bring the seeds to the kodama in the west woods', jp: 'たねを にしの こだまに とどけよう', target: ['fo-kodama'], map: 'forest' },
        { en: 'Defeat the Particle Guardian across the bridge, then return to the kodama', jp: 'はしの むこうの じょしの しゅごを たおして、こだまに しらせよう', target: ['fo-treant', 'fo-kodama'], map: 'forest' },
      ],
    },
    {
      id: 'fox-wedding',
      region: 3,
      title: 'The Fox’s Wedding',
      jp: 'きつねの よめいり',
      summary: 'The fox is getting married! A fox wedding needs a sun-shower — and a feast.',
      giver: 'fo-fox',
      stages: [
        { en: 'Make a sun-shower at the little torii: sunshine (ひかり) and rain (あめ) at once', jp: 'ちいさな とりいで「ひかり」と「あめ」を となえよう', target: ['fo-torii'], map: 'forest' },
        { en: 'Get bread for the feast from Mugi the baker on the south path', jp: 'みなみの みちの パンやさん「むぎ」から パンを もらおう', target: ['fo-baker', 'fo-oven'], map: 'forest' },
        { en: 'Bring the bread to the fox', jp: 'きつねに パンを とどけよう', target: ['fo-fox'], map: 'forest' },
      ],
    },
    {
      id: 'pon-sulk',
      region: 3,
      title: 'Pon the Sulky Tanuki',
      jp: 'すねた ポン',
      summary: 'A tanuki is sulking by the south path. Nobody ever listens to his belly-drum songs.',
      giver: 'fo-tanuki',
      stages: [
        { en: 'Cheer Pon up with the right words (cast them at him)', jp: 'ことばの まほうで ポンを げんきに しよう', target: ['fo-tanuki'], map: 'forest' },
        { en: 'Pon needs an audience: get the grumpy Bridge Guard to listen (cast きく)', jp: 'はしの ばんにんに「きく」と となえよう', target: ['fo-guard'], map: 'forest' },
        { en: 'Enjoy Pon’s concert by the bridge', jp: 'はしの そばで ポンの コンサートを きこう', target: ['fo-tanuki'], map: 'forest' },
      ],
    },
  ],
  entities: {
    forest: [
      { id: 'fo-kodama', kind: 'npc', sprite: 'wisp', x: 4, y: 22, dir: 'down', name: KODAMA, lines: [{ jp: 'カラカラ… カラカラ…', en: 'Clack-clack… clack-clack…' }] },
      { id: 'fo-ha-stone', kind: 'landmark', tile: 'tablet', x: 2, y: 21, name: { jp: 'いばらの いしぶみ', en: 'Bramble Tablet' }, lines: [{ jp: '「わたしは まほうつかい です。」と ほってある。', en: 'Carved: “I am a mage.”' }] },
      { id: 'fo-torii', kind: 'landmark', tile: 'torii', x: 7, y: 20, name: { jp: 'ちいさな とりい', en: 'Little Torii' }, lines: [{ jp: 'きつねの ための ちいさな とりい。', en: 'A little torii, just the right size for foxes.' }] },
      { id: 'fo-bride', kind: 'npc', sprite: 'kitsune', x: 8, y: 21, dir: 'up', name: { jp: 'はなよめ', en: 'Fox Bride' }, lines: [{ jp: 'コン♪ ありがとう。', en: 'Kon♪ Thank you.' }] },
      { id: 'fo-baker', kind: 'npc', sprite: 'innkeeper', x: 16, y: 27, dir: 'down', name: MUGI, lines: [{ jp: 'いらっしゃい！ やきたての パンは いかが？', en: 'Welcome! Fresh bread?' }] },
      { id: 'fo-oven', kind: 'landmark', tile: 'campfire', x: 17, y: 27, name: { jp: 'パンがま', en: 'Bread Oven' }, lines: [{ jp: 'パンを やく かまど。', en: 'An oven for baking bread.' }] },
      { id: 'fo-tanuki', kind: 'npc', sprite: 'tanuki', x: 22, y: 26, dir: 'left', name: PON, lines: [{ jp: 'ふん。', en: 'Hmph.' }] },
    ],
  },
  visible: {
    'fo-bride': (s) => stageOf(s, 'fox-wedding') >= 3,
  },
  ghost: {
    // Choked in brambles until they're burnt away.
    'fo-ha-stone': (s) => !fl(s, 'burnt.fo-brambles'),
    'fo-kodama': (s) => stageOf(s, 'forest-voice') < 3,
    // The oven is cold until someone lights it.
    'fo-oven': (s) => !fl(s, 'lit.fo-oven'),
  },
  moved: {
    // Pon takes his drum to the bridge once the guard agrees to listen.
    'fo-tanuki': (s) => (stageOf(s, 'pon-sulk') >= 2 ? { x: 28, y: 18 } : null),
  },
  talk: {
    // ── The Forest’s Lost Voice ───────────────────────────────────────
    'fo-kodama': (c) => {
      const st = c.stage('forest-voice')
      if (st < 0)
        return offer(
          c,
          'forest-voice',
          [
            c.narrate('しろくて ちいさな こだまが、くびを カラカラ ならしている。', 'A small white kodama rattles its little head.'),
            c.say('カラカラ… じょしの しゅごが、もりの「は」「を」「に」を ばらまいて しまった。', 'Clack-clack… The Particle Guardian scattered the forest’s は, を and に.'),
            c.say('だから みんな、ぶんが さいごまで いえない。きこりさんに はなしかけて ごらん。', 'Now no one can finish a sentence. Go and listen to the woodcutter.'),
            c.say('たねを 3つ あつめて くれたら、もりに もういちど うえられる。', 'Gather the three seeds, and I can plant them again.'),
          ],
          ['あつめる！', 'I’ll gather them!'],
        )
      if (st === 0) {
        const left: [string, string][] = []
        if (!c.flag('got.seed-wa')) left.push(['「は」は にしの みちの、いばらの いしぶみに。', 'は is stuck in a bramble-choked tablet by the west road.'])
        if (!c.flag('got.seed-o')) left.push(['「を」は きのこの かごに まぎれた。', 'を fell into the mushroom gatherer’s basket.'])
        if (!c.flag('got.seed-ni')) left.push(['「に」は わきみずの そこに しずんだ。', 'に sank to the bottom of the spring.'])
        return [c.say(`たねは あと ${left.length}つ。`, `${left.length} seed${left.length === 1 ? '' : 's'} left.`), ...left.map(([jp, en]) => c.say(jp, en))]
      }
      if (st === 1)
        return [
          c.say('たねだ！ カラカラ♪ さいごに、ならべかたを おしえて。', 'The seeds! Clack-clack♪ Last thing: show me where they go.'),
          c.choice(
            { jp: 'わたし＿ みず＿ のみます。', en: 'Watashi _ mizu _ nomimasu. (I drink water.)' },
            [
              ['wa-o', 'は ・ を', 'wa · o'],
              ['o-wa', 'を ・ は', 'o · wa'],
              ['ni-wa', 'に ・ は', 'ni · wa'],
            ],
            (id) => {
              if (id !== 'wa-o') return [c.narrate('ぶんが ぐらぐら ゆれて、ぱたんと たおれた。', 'The sentence wobbles… and topples over.'), c.say('カラ…？ もういちど かんがえて。', 'Clack…? Think again, and talk to me.')]
              for (const p of SEEDS) c.take(p)
              c.sparkle('leaf')
              c.sfx('correct')
              return [
                c.say('わたしは みずを のみます。…カラカラ！ ただしい！', 'Watashi wa mizu o nomimasu. …Clack-clack! That’s it!'),
                c.narrate('たねが じめんに もぐって、ひかる めを だした。もりが すこし ざわめいた。', 'The seeds burrow into the soil and sprout glowing shoots. The forest murmurs.'),
                c.say('でも、しゅごが いるかぎり、もりは まだ ぜんぶは はなせない。はしの むこうへ！', 'But while the Guardian stands, the forest can’t fully speak. Across the bridge!'),
                ...c.reward(40, 15),
                ...c.advance('forest-voice'),
              ]
            },
          ),
        ]
      if (st === 2) {
        if (!isPassed(c.s(), bossOf(3).id)) return [c.say('しゅごは はしの きたに いる。ただしい じょしで こたえるんだ。', 'The Guardian waits north of the bridge. Answer with the right particles.')]
        c.sparkle('leaf')
        return [
          c.say('きこえる？ とりが うたってる。かぜも はなしてる！', 'Hear that? The birds are singing. Even the wind is talking!'),
          c.narrate('こだまの からだが、はっきり みえるように なった。', 'The kodama grows solid and bright.'),
          c.say('もりの ことばを かえして くれて ありがとう。これは「ことのは」。ことばの はっぱだよ。', 'Thank you for giving the forest back its words. This is a kotonoha — a leaf of words.'),
          ...c.give('kotonoha'),
          ...c.bagItem('charm', 2),
          ...c.reward(100, 40),
          ...c.advance('forest-voice'),
          c.fude('は、を、に。ちいさな ことばが、ぶんを つなげるんだね！', 'は, を, に. Tiny words that hold whole sentences together!'),
        ]
      }
      return [c.say('カラカラ♪ きょうも もりは おしゃべり。', 'Clack-clack♪ The forest is chatty today.')]
    },
    'fo-woodcutter': (c) => {
      const st = c.stage('forest-voice')
      if (st === 0 || st === 1)
        return [
          c.say('おれ… き… きる… いえ… かえる…', 'Me… tree… cut… home… go…'),
          c.say('…くそっ！ ぶんが つながらない！', '…Argh! My sentences won’t join up!'),
          c.fude('じょしが ないと、ことばが ばらばらだね…', 'Without particles, the words just fall apart…'),
        ]
      if (st >= 2) return [c.say('おれは きを きります！ …はは、いえた！ いえたぞ！', 'I cut trees! …Ha, I said it! I said it!')]
      return null
    },
    'fo-ha-stone': (c) => {
      if (!c.flag('burnt.fo-brambles')) return [c.narrate('いしぶみが とげとげの いばらに うもれている。すきまで なにかが ひかった。', 'A little tablet is buried in thorny brambles. Something glints in the gaps.'), c.fude('いばらを もやせば よめるかも… 火の ことばで！', 'If we burned the brambles away… a fire word!')]
      if (c.stage('forest-voice') !== 0 || c.flag('got.seed-wa')) return null
      return [
        c.narrate('いしぶみに「わたし＿ まほうつかい です」と ある。あなに たねが はさまっている。', 'The tablet reads “Watashi _ mahoutsukai desu.” A seed is wedged in the gap.'),
        c.ask({ jp: 'あなに はいる じょしは？', en: 'Which particle fills the gap? (I am a mage.)' }, ['は', 'わ'], (ok) => {
          if (!ok) return [c.narrate('たねは びくとも しない。', 'The seed won’t budge.'), c.fude('「わたし」が テーマだよ。テーマの じょしは…？', '“I” is the topic. The topic particle is…?')]
          c.sparkle('spark')
          return [
            c.narrate('「わたしは まほうつかい です」。たねが ころりと おちた。', '“Watashi wa mahoutsukai desu.” The seed drops out.'),
            c.fude('かくときは「は」、よむときは「わ」。じょしの「は」は とくべつ！', 'Written は, spoken わ. The particle は is special!'),
            ...gotSeed(c, 'seed-wa'),
          ]
        }),
      ]
    },
    'fo-gatherer': (c) => {
      const st = c.stage('forest-voice')
      if (st !== 0 || c.flag('got.seed-o')) return st >= 2 ? [c.say('わたしは きのこを たべます。…ふふ、やっと いえた。', 'I eat mushrooms. …Hehe, I can finally say it.')] : null
      return [
        c.say('きのこ… たべたい… でも… ことば… たりない…', 'Mushroom… want eat… but… words… missing…'),
        c.narrate('かごの 中で、ちいさな たねが ころころ ゆれている。', 'Something small is rolling around in her basket.'),
        c.ask({ jp: 'たすけて あげよう：「きのこ＿ たべたい」', en: 'Help her out: “Kinoko _ tabetai.” (I want to eat mushrooms.)' }, ['を', 'お'], (ok) => {
          if (!ok) return [c.say('きのこ… ？ …ちがう きが する…', 'Mushroom…? …That doesn’t feel right…'), c.fude('たべる ものに つく じょしは…？', 'The particle that marks what you eat is…?')]
          c.learn('taberu')
          c.sparkle('spark')
          return [
            c.say('きのこを たべたい！ …いえた！', 'I want to eat mushrooms! …I said it!'),
            c.narrate('かごから「を」の たねが ぴょんと とびだした。', 'The を seed hops out of her basket.'),
            c.fude('「を」は「お」と よむよ。ものを「どうする」かの しるし！', 'を is read “o”. It marks the thing you do something to!'),
            ...gotSeed(c, 'seed-o'),
          ]
        }),
      ]
    },
    'fo-spring': (c) => {
      if (c.stage('forest-voice') !== 0 || c.flag('got.seed-ni')) return null
      return [c.narrate('わきみずの そこで、ちいさな たねが きらっと ひかった。', 'Something tiny glints at the bottom of the spring.'), c.fude('てが とどかない… ぜんぶ のんじゃえば？ のむ！', 'Too deep to reach… What if we drank it all? のむ!')]
    },

    // ── The Fox’s Wedding ─────────────────────────────────────────────
    'fo-fox': (c) => {
      const st = c.stage('fox-wedding')
      if (st < 0)
        return offer(c, 'fox-wedding', [
          c.say('コンコン！ きいて！ ぼく、けっこん するんだ！', 'Kon kon! Guess what — I’m getting married!'),
          c.say('でも きつねの けっこんしきには、はれてるのに あめが ふる そらが ひつよう。', 'But a fox wedding needs a sun-shower: rain falling from a sunny sky.'),
          c.say('それに ごちそうも！ …てつだって くれる？', 'And a feast! …Will you help?'),
        ])
      if (st === 0) return [c.say('とりいで おひさまと あめを いっしょに よんでね！', 'Call the sun and the rain together at the torii!')]
      if (st === 1) return [c.say('ごちそうは パン！ むぎさんの パンは さいこう なんだ。', 'The feast is bread! Mugi’s bread is the best.')]
      if (st === 2) {
        if (!c.has('bread')) return [c.say('パンは まだ かな…？', 'Is the bread ready yet…?')]
        c.take('bread')
        c.sparkle('spark')
        return [
          c.narrate('パンの かごを わたした。', 'You hand over the basket of bread.'),
          c.narrate('はれた そらから きらきらの あめ。とりいの むこうから、しろい はなよめが あらわれた！', 'Sparkling rain falls from a sunny sky. A white fox bride steps out from behind the torii!'),
          c.say('わたしたちは パンを たべます！ コーン♪', 'We eat bread! Kooon♪'),
          c.say('これは おれいの おめん。きつねは みんな、きみの ともだちだよ。', 'Here, a mask as thanks. Every fox is your friend now.'),
          ...c.give('fox-mask'),
          ...c.bagItem('charm', 1),
          ...c.reward(70, 25),
          ...c.advance('fox-wedding'),
          c.fude('はれの ひの あめを、にほんでは「きつねの よめいり」って いうんだよ。', 'In Japan, a sun-shower is called “the fox’s wedding”!'),
        ]
      }
      return [c.say('しあわせ だなあ。コン♪', 'I’m so happy. Kon♪')]
    },
    'fo-torii': (c) => {
      if (c.stage('fox-wedding') !== 0) return null
      const sun = c.flag('wed.sun') > 0
      const rain = c.flag('wed.rain') > 0
      return [c.fude(sun ? 'おひさまは でた！ あとは あめ！' : rain ? 'あめは ふってる！ あとは ひかり！' : 'おひさまの ひかりと、あめ。どっちも よぼう！', sun ? 'The sun’s out! Now the rain!' : rain ? 'It’s raining! Now the light!' : 'Sunlight and rain — let’s call both!')]
    },
    'fo-baker': (c) => {
      const st = c.stage('fox-wedding')
      if (st !== 1) return null
      if (!c.flag('lit.fo-oven'))
        return [
          c.say('たいへん！ きつねさんの パンを やかなきゃ いけないのに、かまどが きえちゃった！', 'Disaster! I have to bake the fox’s bread and my oven’s gone out!'),
          c.say('まほうつかいさん、かまどに ひを つけて くれない？', 'Little mage, could you light it for me?'),
        ]
      return [
        c.say('いい においでしょ？ やけたよ！ でも わたす まえに…', 'Smells good, right? It’s done! But before I hand it over…'),
        c.ask({ jp: 'パンを どうする？「パンを ＿＿＿」', en: 'What do you do with bread? “Pan o ___.” (eat)' }, ['たべる', 'たべます'], (ok) => {
          if (!ok) return [c.say('パンを… なに？ おなかが すいてたら、どうする？', 'Bread… what? When you’re hungry, you…?')]
          c.learn('taberu')
          return [c.say('そう！ パンを たべる！ はい、どうぞ。できたての うちに！', 'Yes! You EAT bread! Here — while it’s warm!'), ...c.give('bread'), ...c.advance('fox-wedding')]
        }),
      ]
    },

    // ── Pon the Sulky Tanuki ──────────────────────────────────────────
    'fo-tanuki': (c) => {
      const st = c.stage('pon-sulk')
      if (st < 0)
        return offer(
          c,
          'pon-sulk',
          [c.say('ふん。…ほっといて。', 'Hmph. …Leave me alone.'), c.narrate('たぬきは おなかを かかえて、そっぽを むいた。', 'The tanuki hugs his round belly and turns away.'), c.fude('すねてるね… げんきに して あげない？', 'He’s sulking… Shall we cheer him up?')],
          ['げんきに する！', 'Let’s cheer him up!'],
          ['そっと しておく', 'Leave him be'],
        )
      if (st === 0) {
        const mood = c.flag('pon.mood')
        if (mood === 0) return [c.say('ぼくの おなかの たいこ、だれも きいて くれない…', 'Nobody ever listens to my belly-drum…'), c.fude('「きく」って いって あげよう！', 'Let’s tell him we’ll listen: きく!')]
        if (mood === 1) return [c.say('…でも、ぼくの おどりは だれも みない。', '…But nobody watches my dance.'), c.fude('「みる」よ！って つたえよう。', 'Tell him we’ll watch: みる!')]
        return [c.say('…ぼく、ずっと ひとりぼっち なんだ。', '…I’ve always been on my own.'), c.fude('「ともだち」に なって あげよう。', 'Let’s be his friend: ともだち.')]
      }
      if (st === 1) return [c.say('ばんにんさんにも きいて ほしいな。いつも こわい かお だから…', 'I want the bridge guard to hear too. He always looks so grumpy…')]
      if (st === 2)
        return [
          c.say('みんな、きてくれて ありがとう！ いくよ〜！', 'Thanks for coming, everyone! Here goes!'),
          c.narrate('ぽんぽこ ぽん！ ぽんぽこ ぽん！', 'Ponpoko pon! Ponpoko pon!'),
          c.narrate('ばんにんが あしで リズムを とっている。きつねも こだまも ゆらゆら ゆれている。', 'The guard taps his foot. The foxes and the kodama sway along.'),
          c.say('…いい おとだ。また きかせて くれ。', '…Good rhythm. Play again sometime.', { jp: 'はしの ばんにん', en: 'Bridge Guard' }, 'guard'),
          c.say('えへへ。これ、ぼくの だいじな はっぱ。ともだちの しるし！', 'Hehe. Here, my special leaf. A friendship token!'),
          ...c.give('pon-leaf'),
          ...c.bagItem('smoke', 2),
          ...c.reward(60, 20),
          ...c.advance('pon-sulk'),
        ]
      return [c.say('ぽんぽこ♪ きょうも ばんにんさんと セッション ちゅう！', 'Ponpoko♪ Jamming with the guard again today!')]
    },
  },
  cast: {
    // ── tale casts ────────────────────────────────────────────────────
    'fo-ha-stone': (c, k) => {
      if (k === 'ひ' || k === 'ほのお') {
        c.learn(k === 'ひ' ? 'hi' : 'honoo')
        if (c.flag('burnt.fo-brambles')) return [c.narrate('いしぶみが ほんのり あたたかく なった。', 'The tablet gets pleasantly warm.')]
        c.set('burnt.fo-brambles')
        c.sparkle('spark')
        c.sfx('correct')
        return [c.narrate(`「${k}」！ ぼうっ！ いばらが めらめら もえて、はいに なった。`, `“${k === 'ひ' ? 'Hi' : 'Honoo'}”! Whoomph! The brambles burn away to ash.`), c.narrate('いばらの 下から、ちいさな いしぶみが でてきた。', 'Underneath is a little stone tablet.')]
      }
      if ((k === 'みず' || k === 'あめ') && !c.flag('burnt.fo-brambles')) {
        c.learn(k === 'みず' ? 'mizu' : 'ame')
        return [c.narrate('いばらは みずを のんで… もっと とげとげに なった。', 'The brambles drink it up… and grow even thornier.'), c.fude('あっ、そだてちゃった！', 'Oops, we fed them!')]
      }
      if (k === 'き' && !c.flag('burnt.fo-brambles')) return (c.learn('ki'), [c.narrate('いばらの 中から 木が にょきっ。…ますます しげった。', 'A sapling sprouts in the middle of the brambles. …Now they’re even thicker.')])
      return null
    },
    'fo-spring': (c, k) => {
      if (k === 'のむ') {
        c.learn('nomu')
        c.sparkle('ripple')
        if (c.stage('forest-voice') === 0 && !c.flag('got.seed-ni'))
          return [
            c.narrate('「のむ」！ ごくごくごく… わきみずを ぜんぶ のみほした！', '“Nomu”! Gulp, gulp, gulp… you drink the whole spring dry!'),
            c.narrate('カチッ。はに なにかが あたった。…「に」の たねだ！', 'Clink. Something taps your teeth… the に seed!'),
            c.narrate('わきみずは すぐに また わいてきた。', 'The spring quickly fills up again.'),
            ...gotSeed(c, 'seed-ni'),
          ]
        return [c.narrate('「のむ」！ つめたくて おいしい。からだが かるく なった。', '“Nomu”! Cold and delicious. You feel lighter.'), ...firstTime(c, 'fo-spring')]
      }
      if (k === 'みず' || k === 'いずみ') {
        c.learn(k === 'みず' ? 'mizu' : 'izumi')
        c.sparkle('ripple')
        return [c.narrate('わきみずが ぽこぽこ わらった。', 'The spring bubbles, as if laughing.')]
      }
      return null
    },
    'fo-torii': (c, k) => {
      if (k !== 'ひかり' && k !== 'あめ') return null
      c.learn(k === 'ひかり' ? 'hikari' : 'ame')
      c.sparkle(k === 'ひかり' ? 'spark' : 'ripple')
      if (c.stage('fox-wedding') !== 0) return [c.narrate(k === 'ひかり' ? 'とりいが きらりと ひかった。' : 'とりいが あめに ぬれて、あかく つやつや している。', k === 'ひかり' ? 'The torii gleams.' : 'Rain-slick, the torii glows a deep red.')]
      c.set(k === 'ひかり' ? 'wed.sun' : 'wed.rain')
      const sun = c.flag('wed.sun') > 0
      const rain = c.flag('wed.rain') > 0
      if (sun && rain) {
        c.sfx('correct')
        return [
          c.narrate('おひさまが てっている のに、きらきらの あめが ふってきた。', 'The sun is shining — and yet a glittering rain is falling.'),
          c.say('きつねの よめいりだ〜！ コーン！', 'A fox’s wedding sky! Kooon!', FOX, 'fox'),
          ...c.advance('fox-wedding'),
        ]
      }
      if (sun) return [c.narrate('「ひかり」！ こもれびが とりいを てらした。', '“Hikari”! Sunbeams light up the torii.'), c.fude('はれた！ でも あめも いるよ！', 'Sunny! But we need rain too!')]
      return [c.narrate('「あめ」！ ざあざあ ぶり。…そらは まっくら。', '“Ame”! A downpour. …The sky is gloomy grey.'), c.fude('あめは ふった！ おひさまの ひかりも！', 'Rain, check! Now sunlight!')]
    },
    'fo-oven': (c, k) => {
      if (k === 'ひ' || k === 'ほのお') {
        c.learn(k === 'ひ' ? 'hi' : 'honoo')
        if (c.flag('lit.fo-oven')) return [c.narrate('かまどは もう ごうごう もえている。', 'The oven is already roaring.')]
        c.set('lit.fo-oven')
        c.sparkle('spark')
        c.sfx('correct')
        return [c.narrate('「ひ」！ かまどに ひが ともった！', '“Hi”! The oven bursts into flame!'), c.say('やった！ すぐ やくね。…ほら、もう いい におい！', 'Yes! I’ll bake right away. …Smell that already!', MUGI, 'innkeeper')]
      }
      if (k === 'みず' && c.flag('lit.fo-oven')) {
        c.learn('mizu')
        c.set('lit.fo-oven', 0)
        return [c.narrate('じゅっ… かまどが きえた。', 'Tsssh… the oven goes out.'), c.say('わたしの パンがーー！！', 'My BREAAAD!!', MUGI, 'innkeeper')]
      }
      if (isPan(k)) return [c.narrate('かまどの 中で、パンが ぷくっと ふくらんだ。', 'Inside the oven, the bread puffs up proudly.')]
      return null
    },
    'fo-baker': (c, k) => {
      if (isPan(k)) return [c.say('パン！ そう、パンは わたしの いきがい！', 'Bread! Yes! Bread is my life!'), ...firstTime(c, 'fo-baker')]
      if (k === 'かう') return (c.learn('kau'), [c.say('かって くれるの？ きょうは きつねさんの パンで いそがしいから… また あした！', 'Buying? I’m swamped with the fox’s order… come back tomorrow!')])
      if (k === 'みせ') return (c.learn('mise'), [c.say('わたしの みせは この かまど ひとつ。ちいさいけど、あじは 森いち！', 'My shop is just this oven. Small, but the tastiest in the forest!')])
      return null
    },
    'fo-bride': (c, k) => (isPan(k) ? [c.say('コン！？', 'Kon?!'), c.narrate('はなよめの みみが ぴーんと たった。', 'The bride’s ears shoot straight up.')] : null),
    'fo-fox': (c, k) => {
      if (isPan(k)) return [c.say('パン！？ どこ！？', 'Bread?! Where?!'), c.narrate('きつねは しっぽを ぶんぶん ふった。', 'The fox’s tail wags wildly.')]
      if (k === 'ともだち') return (c.learn('tomodachi'), [c.say('コン♪ ともだち！', 'Kon♪ Friends!')])
      return null
    },
    'fo-tanuki': (c, k) => {
      const st = c.stage('pon-sulk')
      if (st !== 0) {
        if (k === 'きく' || k === 'みる' || k === 'ともだち') return [c.say('ぽんぽこ♪', 'Ponpoko♪')]
        return null
      }
      const mood = c.flag('pon.mood')
      const need = PON_NEEDS[Math.min(mood, 2)]
      if (k === need) {
        c.learn(k === 'きく' ? 'kiku' : k === 'みる' ? 'miru' : 'tomodachi')
        c.set('pon.mood', mood + 1)
        c.sparkle('spark')
        c.sfx('correct')
        if (k === 'きく') return [c.say('…きいて くれるの？', '…You’ll listen?'), c.narrate('ぽん… ぽんぽこ ぽん！ たぬきは おなかを たたいた。', 'Pon… ponpoko pon! He drums on his belly.'), c.say('えへ… でも…', 'Hehe… but…')]
        if (k === 'みる') return [c.say('みて くれるの！？', 'You’ll watch?!'), c.narrate('たぬきは くるくる まわって、ずっこけた。…でも わらっている。', 'He spins, and spins, and falls over. …But he’s laughing.'), c.say('…でも…', '…But…')]
        return [c.say('ともだち… ぼくの？', 'Friends… with me?'), c.narrate('ポンの めが うるうる して、しっぽが ふくらんだ。', 'Pon’s eyes go shiny and his tail puffs up.'), c.say('やったー！ ぼく、ポン！ よろしくね！', 'Yay! I’m Pon! Nice to meet you!'), ...c.advance('pon-sulk')]
      }
      if (k === 'たべる') return (c.learn('taberu'), [c.say('たべる！？ ぼくを！？', 'EAT?! Me?!'), c.narrate('ポンは まんまるに ふくらんで、ふるえている。', 'Pon puffs up perfectly round and trembles.'), c.fude('ご、ごめん！ ちがうよ！', 'S-sorry! That’s not what we meant!')])
      if (k === 'ねる') return (c.learn('neru'), [c.narrate('ポンは ごろんと よこに なった。…よこに なったまま すねている。', 'Pon lies down. …And keeps sulking, horizontally.')])
      if (k === 'いぬ') return (c.learn('inu'), [c.say('いぬ！？ どこ！？', 'A dog?! Where?!'), c.narrate('ポンは 木の かげに かくれた。', 'Pon hides behind a tree.')])
      if (k === 'かえる') return (c.learn('kaeru'), [c.say('かえる？ …かえる ところ なんか ないもん。', 'Go home? …I don’t have anywhere to go.'), c.fude('あっ… よけい すねちゃった。', 'Oh no… that made it worse.')])
      if (k === 'きく' || k === 'みる' || k === 'ともだち') return [c.say('…それは もう きいたよ。', '…You already said that one.')]
      return [c.say('ふん。', 'Hmph.'), c.fude('その ことばじゃ ないみたい…', 'Not that word, it seems…')]
    },
    'fo-guard': (c, k) => {
      if (k === 'きく') {
        c.learn('kiku')
        if (c.stage('pon-sulk') === 1)
          return [
            c.say('きく？ …なにを だ。', 'Listen? …To what?'),
            c.narrate('とおくから ぽんぽこ ぽん… と きこえる。', 'From far away: ponpoko pon…'),
            c.say('…たぬきの たいこ か。…まあ、すこし だけ なら。', '…A tanuki’s drum, huh. …Well. Just for a little while.'),
            ...c.advance('pon-sulk'),
          ]
        return [c.say('きいて いるとも。ばんにんは いつも みみを すましている。', 'I’m always listening. A guard keeps his ears open.')]
      }
      if (k === 'はなす') return (c.learn('hanasu'), [c.say('にほんごで はなせ、と いったのは おれだ。…はなして みろ。', 'I’m the one who said “speak Japanese”. …Go on then, speak.')])
      if (k === 'わたる') return (c.learn('wataru'), [c.say('わたりたいなら、ただしく いえ！', 'If you want to cross, say it properly!')])
      return null
    },

    // ── playful word reactions ─────────────────────────────────────────
    'fo-signpost': (c, k) => {
      if (k === 'はし') {
        c.learn('hashi')
        return [c.narrate('みちしるべの やじるしが、はしの ほうへ くるっと まわった。', 'The signpost’s arrow spins to point at the bridge.'), c.fude('はしは「橋」。たべる ときの「はし」も おなじ よみ だよ！', 'はし is a bridge — and chopsticks are also はし!'), ...firstTime(c, 'fo-signpost')]
      }
      if (k === 'わたる') return (c.learn('wataru'), [c.narrate('「はしを わたる」… みちしるべが うなずいた きが した。', '“Cross the bridge”… the signpost almost seems to nod.')])
      return null
    },
    'fo-anvil': (c, k) => {
      if (k === 'つくる') {
        c.learn('tsukuru')
        c.sparkle('spark')
        return [c.narrate('カン！ カン！ かなとこの 上に、ちいさな ぶんが できた：「わたしは パンを つくる」。', 'Clang! Clang! A tiny sentence forms on the anvil: “I make bread.”'), ...firstTime(c, 'fo-anvil')]
      }
      if (k === 'きん') return (c.learn('kin'), [c.narrate('かなとこが きんいろに ひかった… いっしゅん だけ。', 'The anvil flashes gold… for about a second.')])
      return null
    },
    'fo-smith': (c, k) => (k === 'つくる' ? (c.learn('tsukuru'), [c.say('つくる！ いい ことばだ。うでが なるぜ！', 'Make! Now that’s a word. My arms are itching to work!')]) : null),
    'fo-woodcutter': (c, k) => {
      if (k === 'き') return (c.learn('ki'), c.sparkle('leaf'), [c.narrate('めの まえに 木が にょきっと はえた。', 'A tree sprouts right in front of him.'), c.say('…しごとを ふやさないで くれ。', '…Please don’t give me more work.')])
      if (k === 'ねる') return (c.learn('neru'), [c.say('ねる… いいな… ぐう。', 'Sleep… sounds nice… zzz.'), c.narrate('きこりは たったまま ねてしまった。', 'The woodcutter falls asleep standing up.')])
      if (k === 'おきる') return (c.learn('okiru'), [c.say('はっ！ ね、ねてない！ ねてないぞ！', 'Huh! I-I wasn’t sleeping! I wasn’t!')])
      return null
    },
    'fo-stump': (c, k) => {
      if (k === 'おきる') return (c.learn('okiru'), [c.narrate('「おきる」！ …きりかぶは おきない。きりかぶ だから。', '“Okiru”! …The stump does not wake up. It is a stump.')])
      if (k === 'き') {
        c.learn('ki')
        c.sparkle('leaf')
        return [c.narrate('ねんりんが ひとつ ふえた。きりかぶは すこし うれしそうだ。', 'A new tree ring appears. The stump looks faintly pleased.'), ...firstTime(c, 'fo-stump')]
      }
      return null
    },
    'fo-student': (c, k) => {
      if (k === 'せんせい') return (c.learn('sensei'), [c.say('せんせい！？ どこ！？ しゅくだい まだ なのに！', 'Teacher?! Where?! I haven’t done my homework!')])
      if (k === 'がっこう') return (c.learn('gakkou'), [c.say('がっこうは あした！ きょうは もりで べんきょう！', 'School is tomorrow! Today I’m studying in the forest!')])
      if (k === 'よむ') return (c.learn('yomu'), [c.say('よむの だいすき！ この はっぱにも じが かいてあるよ。', 'I love reading! Even this leaf has writing on it.')])
      return null
    },
    'fo-treant': (c, k) => {
      if (k === 'もり' || k === 'き') {
        c.learn(k === 'もり' ? 'mori' : 'ki')
        return [c.say('いかにも。わたしは もりの しゅご。…だが じょし なしでは、わたしには とどかぬ。', 'Indeed. I guard this forest. …But without particles, your words cannot reach me.')]
      }
      if (k === 'はなす') return (c.learn('hanasu'), [c.say('はなすが よい。ただしい じょしで な。', 'Speak, then. With the proper particles.')])
      return null
    },
  },
  mapCast: {
    forest: (c, k) => {
      if (k === 'ねる') {
        c.learn('neru')
        return [c.narrate('「ねる」… ふわあ… まぶたが おもい…', '“Neru”… yawn… your eyelids grow heavy…'), c.fude('ねちゃ だめ！ まだ ぼうけん ちゅう！', 'No napping! We’re mid-adventure!')]
      }
      if (k === 'おきる') return (c.learn('okiru'), [c.narrate('「おきる」！ しゃきっ！ めが さえた。', '“Okiru”! Snap! You’re wide awake.')])
      if (k === 'ほし') {
        c.learn('hoshi')
        c.sparkle('spark')
        return [c.narrate('「ほし」！ ほたるが いっせいに まいあがって、ほしぞらの ように ひかった。', '“Hoshi”! Fireflies swirl up and glitter like a sky full of stars.')]
      }
      if (k === 'とり') {
        c.learn('tori')
        const free = isPassed(c.s(), bossOf(3).id)
        return [c.narrate(free ? '「とり」！ こずえで とりたちが いっせいに うたいだした！' : '「とり」！ …こずえは しんと している。とりたちは だまった ままだ。', free ? '“Tori”! The birds in the canopy burst into song!' : '“Tori”! …The canopy stays silent. The birds aren’t singing.'), ...(free ? [] : [c.fude('もりの ことばが もどれば、とりも うたうかな。', 'Maybe the birds will sing once the forest gets its words back.')])]
      }
      if (k === 'くる') return (c.learn('kuru'), [c.narrate('「くる」！ …がさがさ。しげみから うさぎが きて、すぐ かえった。', '“Kuru”! …Rustle. A rabbit comes out of the bushes, then goes right back.')])
      if (k === 'まつ') return (c.learn('matsu'), [c.narrate('「まつ」… しばらく まった。…こけが すこし のびた。', '“Matsu”… you wait a while. …The moss grows a little.')])
      return null
    },
  },
}

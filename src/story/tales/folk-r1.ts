/**
 * Region 1 folklore side tales — three gentle legends hidden in the Village
 * of First Words, each ending with a spirit signing the Spirit Scroll:
 *
 * - Zashiki-warashi: the Elder's housekeeper fears the lucky child spirit
 *   of the old house is leaving. Play hide-and-seek (cast め to spot her),
 *   answer her riddle (いえ), and bring her a beanbag so she stays.
 * - Kasa-obake: an old umbrella thrown away long ago has come alive and hops
 *   about the meadow. Call it by name (かさ), let Granny Tsuru say sorry and
 *   mend it, then test it in the rain (あめ).
 * - Shita-kiri Suzume: kind Grandpa Jiro's sparrow was shooed away. Call
 *   her out of the grove (とり), visit the sparrows' inn and choose the
 *   small basket — the humble choice is the one full of treasure.
 */
import type { Step } from '../../world/Dialog'
import type { Ctx, TaleContent } from './types'
import { offer } from './r1-village'

const WARASHI = { jp: 'ざしきわらし', en: 'Zashiki-warashi' }
const KASA = { jp: 'からかさおばけ', en: 'Kasa-obake' }
const CHUN = { jp: 'おちゅん', en: 'Ochun' }

const tale = (s: { flags?: Record<string, number> }, id: string) => s.flags?.[`tale.${id}`] ?? -1

/** The spirit remembers the girl with the brush; Fude perks up. */
const crumb = (c: Ctx, jp: string, en: string, who: { jp: string; en: string }, pic: 'child' | 'wisp'): Step[] => [
  c.say(jp, en, who, pic),
  c.fude('…ふでを もった おんなのこ？ わたしの きおくの あの子を… しってるの？', '…A girl with a brush? Does it know the girl from my memories…?'),
]

export const VILLAGE_FOLK: TaleContent = {
  yokai: [
    {
      id: 'zashiki-warashi',
      region: 1,
      name: 'Zashiki-warashi',
      jp: '座敷童子',
      kana: 'ざしきわらし',
      emoji: '👧',
      lore: 'A child spirit who lives in the inner rooms of old houses, seen only by children and the lucky. While she stays, the family thrives; she loves games and small mischief like moving pillows or rustling paper. If she ever leaves, the good fortune leaves with her.',
      hint: 'Laughter echoes in an empty room…',
      words: ['ie', 'me', 'te'],
    },
    {
      id: 'kasa-obake',
      region: 1,
      name: 'Kasa-obake',
      jp: '唐傘お化け',
      kana: 'からかさおばけ',
      emoji: '☂️',
      lore: 'A tsukumogami: a tool that, after a hundred years of service, gains a soul of its own. This one is an old paper umbrella that hops on a single leg, with one big eye and a long tongue. Things that are carelessly thrown away may come back to sulk — so the old tales say to care for old things.',
      hint: 'Something hops through the tall grass on one leg…',
      words: ['kasa', 'ame', 'hito'],
    },
    {
      id: 'shitakiri-suzume',
      region: 1,
      name: 'Shita-kiri Suzume',
      jp: '舌切り雀',
      kana: 'したきりすずめ',
      emoji: '🐦',
      lore: 'A kind old man’s pet sparrow was driven away, and he searched until he found the sparrows’ hidden inn. Offered a parting gift, he humbly chose the small basket and found it full of treasure. His greedy wife grabbed the big one — and out jumped goblins and ghosts.',
      hint: 'A little bird sings of two baskets, one big, one small…',
      words: ['tori', 'ki', 'gohan'],
    },
  ],
  items: [
    { id: 'fk1-otedama', name: 'Beanbag', jp: 'おてだま', kana: 'おてだま', emoji: '🧶', desc: 'A soft cloth beanbag for juggling games. It jingles faintly with beans.' },
    { id: 'fk1-washi', name: 'Oiled Paper', jp: 'かさの かみ', kana: 'かさのかみ', emoji: '📜', desc: 'Strong oiled paper for mending a paper umbrella.' },
    { id: 'fk1-tsuzura', name: 'Small Wicker Basket', jp: 'ちいさな つづら', kana: 'つづら', emoji: '🧺', desc: 'A gift from the sparrows’ inn. Light, but something inside shines.' },
  ],
  tales: [
    {
      id: 'fk1-warashi',
      region: 1,
      yokai: 'zashiki-warashi',
      title: 'Hide-and-Seek in the Old House',
      jp: 'ざしきわらしと かくれんぼ',
      summary: 'Someone small keeps giggling in the Elder’s house — and the housekeeper fears the house’s luck is about to leave.',
      giver: 'fk1-housekeeper',
      stages: [
        { en: 'Find who is giggling in the Elder’s house', jp: 'ちょうろうの いえで わらう こを さがそう', target: ['fk1-warashi'], map: 'village-elder' },
        { en: 'Hide-and-seek! Find the child: cast め (eye) where she hides', jp: 'かくれんぼ！「め」と となえて みつけよう', target: ['fk1-warashi'], map: 'village-elder' },
        { en: 'Ask the housekeeper for a toy to play with', jp: 'おてつだいさんに おもちゃを もらおう', target: ['fk1-housekeeper'], map: 'village-elder' },
        { en: 'Give the beanbag to the zashiki-warashi', jp: 'ざしきわらしに おてだまを あげよう', target: ['fk1-warashi'], map: 'village-elder' },
      ],
    },
    {
      id: 'fk1-kasa',
      region: 1,
      yokai: 'kasa-obake',
      title: 'The Umbrella Who Came Back',
      jp: 'からかさおばけの なみだ',
      summary: 'A one-eyed umbrella hops through the meadow at night, sticking out its tongue at Granny Tsuru.',
      giver: 'fk1-tsuru',
      stages: [
        { en: 'Find the hopping umbrella in the southern meadow, and call it by its name (かさ)', jp: 'みなみの のはらで はねる かさを みつけて「かさ」と よぼう', target: ['fk1-kasa'], map: 'village' },
        { en: 'Tell Granny Tsuru what the umbrella said', jp: 'つるばあさんに かさの きもちを つたえよう', target: ['fk1-tsuru'], map: 'village' },
        { en: 'Mend the umbrella with the paper, then test it: cast あめ (rain)', jp: 'かさを なおして「あめ」で ためそう', target: ['fk1-kasa'], map: 'village' },
      ],
    },
    {
      id: 'fk1-suzume',
      region: 1,
      yokai: 'shitakiri-suzume',
      title: 'The Sparrows’ Inn',
      jp: 'したきりすずめの おやど',
      summary: 'Grandpa Jiro’s little sparrow was shooed away by a grumpy neighbour, and he misses her terribly.',
      giver: 'fk1-jiro',
      stages: [
        { en: 'Find the sparrow in the grove north of the village: cast とり (bird)', jp: 'きたの はやしで「とり」と となえて すずめを よぼう', target: ['fk1-suzume'], map: 'village' },
        { en: 'Visit the sparrows’ inn and choose a parting gift', jp: 'すずめの おやどで おみやげを えらぼう', target: ['fk1-suzume'], map: 'village' },
        { en: 'Bring the basket to Grandpa Jiro', jp: 'つづらを じろうじいさんに とどけよう', target: ['fk1-jiro'], map: 'village' },
      ],
    },
  ],
  entities: {
    'village-elder': [
      { id: 'fk1-housekeeper', kind: 'npc', sprite: 'villager-b', x: 7, y: 5, dir: 'down', name: { jp: 'おてつだいさん', en: 'Housekeeper' }, lines: [{ jp: 'この いえは ずっと しあわせなの。ふしぎね。', en: 'This house has always been a happy one. Funny, isn’t it?' }] },
      { id: 'fk1-warashi', kind: 'npc', sprite: 'child', x: 1, y: 2, dir: 'down', name: WARASHI, lines: [{ jp: 'くすくす…', en: '*giggle*…' }] },
    ],
    village: [
      { id: 'fk1-tsuru', kind: 'npc', sprite: 'villager-b', x: 7, y: 18, dir: 'down', name: { jp: 'つるばあさん', en: 'Granny Tsuru' }, lines: [{ jp: 'あめの ひは ひざが いたくてねえ。', en: 'My knees ache on rainy days.' }] },
      { id: 'fk1-kasa', kind: 'npc', sprite: 'wisp', x: 12, y: 25, dir: 'left', name: KASA, lines: [{ jp: 'ぴょん、ぴょん… べーっ！', en: 'Hop, hop… *sticks out tongue*!' }] },
      { id: 'fk1-jiro', kind: 'npc', sprite: 'elder', x: 3, y: 8, dir: 'down', name: { jp: 'じろうじいさん', en: 'Grandpa Jiro' }, lines: [{ jp: 'いい てんきじゃのう。', en: 'Fine weather, isn’t it?' }] },
      { id: 'fk1-suzume', kind: 'npc', sprite: 'wisp', x: 11, y: 4, dir: 'down', name: CHUN, lines: [{ jp: 'ちゅん、ちゅん！', en: 'Tweet, tweet!' }] },
    ],
  },
  ghost: {
    // hiding until spotted with め / called out with とり
    'fk1-warashi': (s) => tale(s, 'fk1-warashi') < 2,
    'fk1-suzume': (s) => tale(s, 'fk1-suzume') < 1,
  },
  moved: {
    // she hides behind the pot for hide-and-seek
    'fk1-warashi': (s) => (tale(s, 'fk1-warashi') >= 1 ? { x: 9, y: 7 } : null),
    // Ochun flies home to Grandpa once she has given her gift
    'fk1-suzume': (s) => (tale(s, 'fk1-suzume') >= 2 ? { x: 3, y: 9 } : null),
  },
  talk: {
    // ── Zashiki-warashi ──────────────────────────────────────────────
    'fk1-housekeeper': (c) => {
      const st = c.stage('fk1-warashi')
      if (st < 0)
        return offer(c, 'fk1-warashi', [
          c.say('ねえ、きいて。よるに なると、だれも いない へやから わらいごえが するの。', 'Listen — at night, laughter comes from rooms where nobody is.'),
          c.say('むかしから いう でしょう。いえに ちいさな こどもの おばけが いると、しあわせが くるって。', 'You know the old saying: a little child spirit in the house brings good luck.'),
          c.say('でも このごろ、さびしそうな こえなの。でて いっちゃったら どうしよう…', 'But lately the laughter sounds lonely. What if she leaves us…?'),
        ])
      if (st <= 1) return [c.say('くすくす… ほら、また きこえた。', 'There — that giggle again.')]
      if (st === 2)
        return [
          c.say('あそびあいてが いなくて、さびしかったのね…', 'So she was lonely with no one to play with…'),
          c.say('これ、むかし まごが あそんだ おてだま。あの こに あげて。', 'Here — a beanbag my grandchildren used to play with. Give it to her.'),
          ...c.give('fk1-otedama'),
          ...c.advance('fk1-warashi'),
        ]
      if (st === 3) return [c.say('おてだま、よろこんで くれると いいわね。', 'I hope she likes the beanbag.')]
      return [c.say('まいばん、たのしそうな わらいごえが するの。ふふ。', 'Every night now, happy laughter. Hehe.')]
    },
    'fk1-warashi': (c) => {
      const st = c.stage('fk1-warashi')
      if (st < 0) return [c.narrate('すみで なにかが くすくす わらった… きが した。', 'Something in the corner giggled… or did it?')]
      if (st === 0)
        return [
          c.narrate('あかい きものの おんなのこが、ほんだなの かげから のぞいている。', 'A little girl in a red kimono peeks out from behind the bookshelf.'),
          c.say('あそんで くれるの？ じゃあ、かくれんぼ！ みつけてね！', 'Will you play with me? Then — hide-and-seek! Come find me!', WARASHI, 'child'),
          c.narrate('ふっ… おんなのこは きえてしまった。', 'Poof… the girl vanishes.'),
          c.fude('ざしきわらしだ！ どこかに かくれたよ。「め」で よく みて！', 'A zashiki-warashi! She’s hiding somewhere. Use め (eye) to look closely!'),
          ...c.advance('fk1-warashi'),
        ]
      if (st === 1) return [c.narrate('つぼの かげが、すこし ゆらゆら している…', 'The shadow behind the pot is wobbling a little…'), c.fude('あやしい！「め」と となえてみて！', 'Suspicious! Try casting め!')]
      if (st === 2) return [c.say('おもちゃ、ないの？ つまんない〜', 'No toys? Boring~', WARASHI, 'child')]
      if (st === 3) {
        if (!c.has('fk1-otedama')) return [c.say('おもちゃ、まだ〜？', 'Is the toy here yet~?', WARASHI, 'child')]
        c.take('fk1-otedama')
        c.sparkle('spark')
        return [
          c.narrate('おてだまを わたした。', 'You hand her the beanbag.'),
          c.say('わあ、おてだま！ ひとつ、ふたつ… たのしい！', 'A beanbag! One, two… This is fun!', WARASHI, 'child'),
          c.say('きめた。わたし、ずっと この いえに いる！ ありがとう！', 'I’ve decided — I’m staying in this house forever! Thank you!', WARASHI, 'child'),
          ...c.reward(50, 20),
          ...c.advance('fk1-warashi'),
          ...c.seal('zashiki-warashi'),
          ...crumb(c, 'あのね、むかし ふでを もった おねえちゃんが、ここに ちいさな とびらを かいて くれたの。わたしの おうちだよって。', 'You know, long ago the girl with the brush drew me a tiny door right here. “This is your home,” she said.', WARASHI, 'child'),
        ]
      }
      return [c.say('くすくす… また あそぼうね！', '*giggle*… Play with me again!', WARASHI, 'child')]
    },

    // ── Kasa-obake ───────────────────────────────────────────────────
    'fk1-tsuru': (c) => {
      const st = c.stage('fk1-kasa')
      if (st < 0)
        return offer(c, 'fk1-kasa', [
          c.say('きいとくれ。よるに なると、めが ひとつの かさが ぴょんぴょん はねて くるのさ。', 'Listen, dear. Every night a one-eyed umbrella comes hopping past my house.'),
          c.say('わたしに むかって、べーっと したを だすんだよ！ みなみの のはらに いるはずさ。', 'It sticks its tongue out at me! It lives in the southern meadow, I think.'),
        ])
      if (st === 0) return [c.say('かさの おばけは みなみの のはら、たるの そばだよ。', 'The umbrella ghost is in the southern meadow, by the old barrels.')]
      if (st === 1)
        return [
          c.narrate('かさの はなしを した。', 'You tell her what the umbrella said.'),
          c.say('…あの かさ、わたしの かさ だったのかい。', '…That was my umbrella?'),
          c.say('こどもの ころから ずっと つかって、やぶれたら すてて しまった… わるい ことを したねえ。', 'I used it since I was a girl, and when it tore, I just threw it away… That was unkind of me.'),
          c.say('この かみで なおして あげて。「ごめんね、ありがとう」って つたえて おくれ。', 'Mend it with this paper, please. And tell it, “Sorry, and thank you.”'),
          ...c.give('fk1-washi'),
          ...c.advance('fk1-kasa'),
        ]
      if (st === 2) return [c.say('あの かさ、また わらって くれるかねえ。', 'I wonder if that umbrella will smile again.')]
      return [c.say('あめの ひは あの かさと さんぽ するのさ。ひざも いたくないよ。', 'On rainy days I go walking with that umbrella. My knees don’t even ache!')]
    },
    'fk1-kasa': (c) => {
      const st = c.stage('fk1-kasa')
      if (st < 0) return [c.narrate('ふるい かさが、ぴょんと はねて くさむらに かくれた。', 'An old umbrella hops once and hides in the tall grass.')]
      if (st === 0) return [c.say('ぴょん！ べーっ！', 'Hop! *blehh*!', KASA, 'wisp'), c.narrate('かさは はねまわって、はなしを きかない。', 'It bounces around and won’t listen.'), c.fude('なまえで よんだら、とまって くれるかも。「かさ」と となえよう！', 'Maybe it’ll stop if we call it by its name. Cast かさ!')]
      if (st === 1) return [c.say('…つるに、つたえて おくれ。', '…Go on, tell Tsuru.', KASA, 'wisp')]
      if (st === 2) {
        if (c.has('fk1-washi')) {
          c.take('fk1-washi')
          c.set('fk1.kasa-mended')
          c.sparkle('dust')
          return [
            c.narrate('つるばあさんの ことばを つたえて、あたらしい かみを はった。', 'You pass on Granny Tsuru’s words and paste on the new paper.'),
            c.say('「ごめんね、ありがとう」…？ つるが そう いったの？', '“Sorry, and thank you”…? Tsuru said that?', KASA, 'wisp'),
            c.say('…ぐすん。からだが あたらしく なった みたいだ。', '…*sniff*. I feel brand new.', KASA, 'wisp'),
            c.fude('ほんとうに なおったか、「あめ」で ためして みよう！', 'Let’s see if it really works — cast あめ!'),
          ]
        }
        return [c.fude('かさは なおったよ。「あめ」と となえて ためそう！', 'It’s mended. Cast あめ to test it!')]
      }
      return [c.say('あめの ひが たのしみだ！ ぴょん♪', 'I can’t wait for the next rainy day! Hop♪', KASA, 'wisp')]
    },

    // ── Shita-kiri Suzume ────────────────────────────────────────────
    'fk1-jiro': (c) => {
      const st = c.stage('fk1-suzume')
      if (st < 0)
        return offer(c, 'fk1-suzume', [
          c.say('わしの すずめの「おちゅん」が いなく なってのう…', 'My little sparrow, Ochun, has gone away…'),
          c.say('となりの ばあさんの のりを つついて、ほうきで おいだされて しもうたんじゃ。', 'She pecked at the neighbour’s rice starch, and got chased off with a broom.'),
          c.say('きたの はやしに すずめの おやどが あると いう。おちゅんに あいたいのう…', 'They say the sparrows have an inn in the grove up north. How I wish I could see Ochun…'),
        ])
      if (st === 0) return [c.say('きたの はやし、きの なかじゃ。「とり」と よんで みておくれ。', 'In the grove up north, among the trees. Try calling for a bird.')]
      if (st === 1) return [c.say('おちゅんは げんきじゃったか？', 'Was Ochun well?')]
      if (st === 2) {
        if (!c.has('fk1-tsuzura')) return null
        c.take('fk1-tsuzura')
        c.sparkle('spark')
        return [
          c.say('おちゅん！ かえって きて くれたのか！', 'Ochun! You came back to see me!'),
          c.say('ちゅん！ おじいさん、これ おみやげ！', 'Tweet! Grandpa, here’s a present!', CHUN, 'wisp'),
          c.narrate('ちいさな つづらを あけると… きらきらの たからもの！', 'You open the small basket… and it sparkles with treasure!'),
          c.say('こんなに たくさん… わしには もったいない。まほうつかいさん、はんぶん もって いきなさい。', 'So much… far too much for me. Little mage, take half of it.'),
          ...c.reward(70, 30),
          ...c.advance('fk1-suzume'),
          c.say('そうそう、となりの ばあさんは おおきな つづらを もらって きてな。あけたら おばけが ぞろぞろ！', 'Oh — and the grumpy neighbour went and took the BIG basket. Out tumbled a crowd of little ghosts!'),
          c.say('いまでは ばあさんも すずめに ごはんを あげて おる。ふぉふぉ。', 'Now even she feeds the sparrows. Ho ho.'),
          ...c.seal('shitakiri-suzume'),
          ...crumb(c, 'ちゅん。むかし、ふでを もった おんなのこが、おやどの かんばんに すずめ みんなの なまえを かいて くれたの。', 'Tweet. Long ago, the girl with the brush wrote every sparrow’s name on our inn’s sign.', CHUN, 'wisp'),
        ]
      }
      return [c.say('おちゅんと まいにち あさごはんじゃ。しあわせじゃのう。', 'Ochun and I have breakfast together every day. What happiness.')]
    },
    'fk1-suzume': (c) => {
      const st = c.stage('fk1-suzume')
      if (st <= 0) return [c.narrate('きの えだが かさかさ ゆれた。ちいさな なにかが かくれている…', 'The branches rustle. Something small is hiding…'), ...(st === 0 ? [c.fude('とりかな？「とり」と よんで みよう！', 'A bird, maybe? Let’s call it — cast とり!')] : [])]
      if (st === 1)
        return [
          c.say('ようこそ、すずめの おやどへ！ ちゅん、ちゅん♪', 'Welcome to the Sparrows’ Inn! Tweet, tweet♪', CHUN, 'wisp'),
          c.narrate('すずめたちが おどって、おいしい ごはんを ごちそう してくれた。', 'The sparrows dance for you and serve a delicious meal of rice.'),
          c.say('おみやげに つづらを どうぞ。おおきいのと ちいさいの、どっち？', 'Please take a basket as a gift. The big one, or the small one?', CHUN, 'wisp'),
          c.choice({ jp: 'どっちの つづら？', en: 'Which basket?' }, [['big', 'おおきい つづら', 'The big basket'], ['small', 'ちいさい つづら', 'The small basket']], (id) => {
            if (id === 'big') {
              c.sfx('wrong')
              c.sparkle('dust')
              return [
                c.narrate('おおきな つづらを すこし あけると… ドロン！ ちいさな おばけが とびだした！', 'You lift the lid of the big basket a crack… POOF! Little ghosts spring out!'),
                c.narrate('おばけたちは べーっと したを だして、また つづらに もどった。', 'They stick out their tongues at you, then hop back inside.'),
                c.fude('ひゃっ！ よくばりは だめ みたい… もう いちど えらぼう。', 'Eek! Greed doesn’t pay, it seems… Let’s choose again.'),
              ]
            }
            c.sfx('correct')
            return [
              c.say('ちいさい つづらを えらぶ ひとは、やさしい ひと。ちゅん♪', 'Those who choose the small basket have kind hearts. Tweet♪', CHUN, 'wisp'),
              ...c.give('fk1-tsuzura'),
              c.say('おじいさんに あいに いくね。さきに いってて！', 'I’ll fly to see Grandpa. Go on ahead!', CHUN, 'wisp'),
              ...c.advance('fk1-suzume'),
            ]
          }),
        ]
      if (st === 2) return [c.say('おじいさんに つづらを わたしてね！', 'Give the basket to Grandpa!', CHUN, 'wisp')]
      return [c.say('ちゅん♪ おじいさんの ごはん、おいしいの。', 'Tweet♪ Grandpa’s rice is the best.', CHUN, 'wisp')]
    },
  },
  cast: {
    'fk1-warashi': (c, k) => {
      const st = c.stage('fk1-warashi')
      if (k === 'め') {
        c.learn('me')
        if (st !== 1) return [c.say('くすくす。みえてるよ〜', '*giggle* I can see you too~', WARASHI, 'child')]
        c.sparkle('spark')
        return [
          c.narrate('「め」！ めが きらりと ひかって… つぼの かげに おんなのこが みえた！', '“Me”! Your eyes sparkle… and there’s the girl behind the pot!'),
          c.say('あーあ、みつかっちゃった！ じゃあ、なぞなぞ！', 'Aww, you found me! Okay — a riddle!', WARASHI, 'child'),
          c.ask({ jp: 'わたしが すんでる ところ、なーんだ？（ひと が すむ ところ）', en: 'Where do I live? (The place where people live.)' }, ['いえ', 'ie'], (ok) => {
            if (!ok) return [c.say('ぶー！ ちがうよ〜。また みつけてね！', 'Bzzt! Wrong~. Find me again!', WARASHI, 'child'), c.fude('ひとが すむ ところは… い、え？', 'Where people live… i… e?')]
            c.learn('ie')
            c.sfx('correct')
            return [
              c.say('ぴんぽーん！ いえ だよ！', 'Ding-dong! It’s いえ, a house!', WARASHI, 'child'),
              c.say('でも ね… もう だれも あそんで くれないの。おもちゃも ないし…', 'But… nobody plays with me anymore. There aren’t even any toys…', WARASHI, 'child'),
              c.fude('おてつだいさんに、なにか おもちゃが ないか きいて みよう！', 'Let’s ask the housekeeper if she has a toy!'),
              ...c.advance('fk1-warashi'),
            ]
          }),
        ]
      }
      if (k === 'いえ') {
        c.learn('ie')
        return [c.say('うん！ ここは わたしの いえ！', 'Yep! This is my house!', WARASHI, 'child')]
      }
      if (k === 'て' && st >= 2) {
        c.learn('te')
        return [c.narrate('てを だすと、おんなのこが ぱちんと たっちした。', 'You hold out your hand, and the girl gives it a high-five.'), c.say('えへへ！', 'Ehehe!', WARASHI, 'child')]
      }
      return null
    },
    'fk1-kasa': (c, k) => {
      const st = c.stage('fk1-kasa')
      if (k === 'かさ') {
        c.learn('kasa')
        if (st !== 0) return [c.say('なあに？ ぼくは かさ だよ。', 'Yes? I’m an umbrella, that’s me.', KASA, 'wisp')]
        c.sparkle('spark')
        return [
          c.narrate('「かさ」！ はねまわって いた かさが、ぴたっと とまった。', '“Kasa”! The bouncing umbrella stops dead.'),
          c.say('…かさ。ひさしぶりに なまえで よばれた。', '…Kasa. It’s been so long since anyone called me by my name.', KASA, 'wisp'),
          c.say('ぼくは ひゃくねん、つるを あめから まもって きた。でも やぶれたら、ぽいって すてられた。', 'For a hundred years I kept Tsuru dry. But when I tore, she just tossed me away.', KASA, 'wisp'),
          c.say('ふるい ものにも こころが あるんだ。だから おばけに なって、べーって したんだ。', 'Old things have hearts too. So I became a ghost, and stuck my tongue out at her.', KASA, 'wisp'),
          c.fude('さびしかったんだね… つるばあさんに つたえよう。', 'You were lonely, weren’t you… Let’s tell Granny Tsuru.'),
          ...c.advance('fk1-kasa'),
        ]
      }
      if (k === 'あめ') {
        c.learn('ame')
        c.sparkle('ripple')
        if (st === 2 && c.flag('fk1.kasa-mended') > 0)
          return [
            c.narrate('「あめ」！ ぽつ、ぽつ… ざあざあ！', '“Ame”! Pit, pat… then a downpour!'),
            c.narrate('かさが ぱっと ひらいて、あなたの うえに とんで きた。ひとしずくも ぬれない！', 'The umbrella pops open and floats over your head. Not a single drop gets through!'),
            c.say('ぼく、まだ やくに たつ！ つるの ところに かえるよ。ありがとう！', 'I’m still useful! I’m going home to Tsuru. Thank you!', KASA, 'wisp'),
            ...c.reward(60, 25),
            ...c.advance('fk1-kasa'),
            ...c.seal('kasa-obake'),
            ...crumb(c, 'むかし、ふでを もった おんなのこと、あめの なか いっしょに あるいたよ。あの こも ぼくを だいじに してくれた。', 'Long ago, I walked through the rain with a girl who carried a brush. She took good care of me too.', KASA, 'wisp'),
          ]
        if (st === 2) return [c.narrate('あめが ふって、やぶれた かさから ぽたぽた もれた。', 'Rain falls, and drips straight through the torn paper.'), c.say('つめたい… やぶれてる から…', 'Cold… because I’m torn…', KASA, 'wisp')]
        return [c.narrate('あめが ふりだした。かさが うれしそうに くるくる まわる。', 'Rain begins. The umbrella twirls happily.')]
      }
      if (k === 'ひ') {
        c.learn('hi')
        return [c.say('ひゃっ！ かみの かさに ひは だめ〜！', 'Yikes! No fire near a paper umbrella!', KASA, 'wisp')]
      }
      return null
    },
    'fk1-suzume': (c, k) => {
      const st = c.stage('fk1-suzume')
      if (k === 'とり') {
        c.learn('tori')
        if (st !== 0) return [c.say('ちゅん？ よんだ？', 'Tweet? Did you call?', CHUN, 'wisp')]
        c.sparkle('leaf')
        return [
          c.narrate('「とり」！ きの えだから、ちいさな すずめが ちょこんと でて きた。', '“Tori”! A little sparrow hops out onto a branch.'),
          c.say('ちゅん！ おじいさんの ともだち？ わたしは おちゅん！', 'Tweet! Are you Grandpa’s friend? I’m Ochun!', CHUN, 'wisp'),
          c.say('ほうきで おいかけられて、こわくて かえれなかったの。でも おじいさんは だいすき！', 'I got chased with a broom and was too scared to go back. But I love Grandpa!', CHUN, 'wisp'),
          c.say('さあ、すずめの おやどに よって いって！', 'Come, visit the Sparrows’ Inn!', CHUN, 'wisp'),
          ...c.advance('fk1-suzume'),
        ]
      }
      if (k === 'ごはん') {
        c.learn('gohan')
        return [c.narrate('「ごはん」！ ほかほかの ごはんつぶが ぽろぽろ。', '“Gohan”! A few warm grains of rice scatter.'), c.say('ちゅん♪ おいしい！', 'Tweet♪ Yummy!', CHUN, 'wisp')]
      }
      if (k === 'き') {
        c.learn('ki')
        c.sparkle('leaf')
        return [c.narrate('「き」！ はやしの きが さわさわ ゆれた。', '“Ki”! The grove’s trees rustle softly.')]
      }
      return null
    },
  },
}

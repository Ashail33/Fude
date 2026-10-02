/**
 * Side areas of the first five regions (see world/maps/*-extra.ts): small
 * talk and word-magic moments that give each new place something to find.
 * No tales, no activities — just townsfolk who react, a few one-time
 * rewards, and landmarks that answer the right word.
 */
import { flagOf, type PlayerState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import type { Ctx, TaleContent } from './types'

const key = (k: string) => `xa.${k}`
const done = (c: Ctx, k: string) => c.flag(key(k)) > 0
const isSet = (s: PlayerState, k: string) => flagOf(s, key(k)) > 0

/** Steps the first time only (marks `k` done); `later` afterwards. */
function once(c: Ctx, k: string, first: () => Step[], later: () => Step[]): Step[] {
  if (done(c, k)) return later()
  c.set(key(k))
  return first()
}

const FOX = { jp: 'しろぎつね', en: 'White Fox' }
const MILLER = { jp: 'こなひきの ゲン', en: 'Gen the Miller' }
const SOYO = { jp: 'かざぐるまの ソヨ', en: 'Soyo of the Windmill' }
const DOKKO = { jp: 'あなほりの ドッコ', en: 'Dokko the Digger' }
const GARDENER = { jp: 'にわばん', en: 'Royal Gardener' }

export const EXTRA_AREAS: TaleContent = {
  tales: [],
  items: [],
  talk: {
    // ── Village: bamboo grove ─────────────────────────────────────────
    'vb-fox': (c) =>
      done(c, 'vb-flowers')
        ? [c.say('はなの におい… ありがとう。おやしろが よろこんでいる。', 'The scent of flowers… thank you. The shrine is happy.'), c.say('風が ふく ひは、ふうりんの ほうへ いってごらん。', 'On windy days, go and listen to the wind chime.')]
        : [
            c.say('コン。ここは わすれられた おやしろ。だれも はなを そなえて くれない。', 'Kon. This is a forgotten shrine. No one brings it flowers any more.'),
            c.say('あなたは ことばの まほうつかい？ なら、はなを よべる でしょう？', 'Are you a word mage? Then you can call up flowers, can’t you?'),
            c.fude('おやしろに むかって「はな」と となえて みよう！', 'Face the shrine and cast はな (flower)!'),
          ],

    // ── Village: terraces ─────────────────────────────────────────────
    'vt-miller': (c) => {
      if (!done(c, 'vt-mill'))
        return [
          c.say('すいしゃが とまって、こまって いるんだ。かわの みずが こなくて…', 'The waterwheel has stopped and I’m stuck. The river water isn’t reaching it…'),
          c.fude('すいしゃごやに「みず」を とどけて あげよう！', 'Let’s send some みず (water) to the mill!'),
        ]
      return once(
        c,
        'vt-miller',
        () => [c.say('まわった、まわった！ これで こめが ひける。ありがとう！', 'It’s turning! Now I can mill the rice. Thank you!'), c.say('おれいに、これを もっていって。', 'Take this as thanks.'), ...c.bagItem('herb', 2), ...c.reward(30, 15)],
        () => [c.say('ごとん、ごとん… いい おとだろう？', 'Clunk, clunk… a lovely sound, isn’t it?')],
      )
    },
    'vt-granny': (c) => [
      c.say('おなか すいた？ なにが ほしい？', 'Hungry? What would you like?'),
      c.choice({ jp: 'なにを たのむ？', en: 'What will you ask for?' }, [['onigiri', 'おにぎりを ください', 'An onigiri, please'], ['tea', 'おちゃを ください', 'Some tea, please'], ['no', 'だいじょうぶです', 'I’m fine']], (id) => {
        if (id === 'no') return [c.say('そうかい。また おいで。', 'Is that so? Come again.')]
        if (id === 'tea') return [c.say('はい、おちゃ。あつい から きをつけてね。', 'Here’s your tea. Careful, it’s hot.'), c.narrate('ほっと する あじ だ。', 'It tastes comforting.')]
        return once(
          c,
          'vt-onigiri',
          () => [c.say('はい、おにぎり。ちゃんと「ください」って いえたね。', 'Here’s an onigiri. You asked so nicely with “kudasai”.'), ...c.bagItem('herb', 1)],
          () => [c.say('はい どうぞ。…おや、きょうの ぶんは もう あげたね。', 'Here you go. …Oh, I already gave you today’s.'), c.narrate('おにぎりは おいしかった。', 'The onigiri was delicious anyway.')],
        )
      }),
    ],

    // ── Fields: windmill hill ─────────────────────────────────────────
    'fh-keeper': (c) => {
      if (!done(c, 'fh-mill'))
        return [
          c.say('きょうは 風が ない… こむぎが ひけないわ。', 'No wind today… I can’t grind the wheat.'),
          c.fude('かざぐるまに「かぜ」を ふかせて あげよう！', 'Let’s send some かぜ (wind) at the windmill!'),
        ]
      return once(
        c,
        'fh-keeper',
        () => [c.say('はねが まわってる！ あなたの 風ね？ ありがとう！', 'The sails are turning! Was that your wind? Thank you!'), ...c.reward(30, 15)],
        () => [c.say('くるくる… 風が あると、おかは にぎやかね。', 'Round and round… the hill is lively when there’s wind.')],
      )
    },
    'fh-orchard': (c) => {
      if (done(c, 'fh-apples')) return [c.say('りんごは げんきの もとじゃ。', 'Apples keep you healthy.')]
      return [
        c.say('うちの りんごは あまいぞ。いくつ ほしい？', 'My apples are sweet. How many would you like?'),
        c.choice({ jp: 'いくつ？', en: 'How many?' }, [['1', 'いち', 'One'], ['2', 'に', 'Two'], ['3', 'さん', 'Three']], (id) => {
          c.set(key('fh-apples'))
          const n = Number(id)
          const says: Record<string, [string, string]> = {
            '1': ['ひとつ？ えんりょ しなくて いいのに。', 'Just one? No need to be shy.'],
            '2': ['ふたつ だね。はい、どうぞ。', 'Two, then. Here you go.'],
            '3': ['みっつ！ よく たべる こじゃ。ほっほ。', 'Three! A hearty appetite. Ho ho.'],
          }
          return [c.say(...says[id]), ...c.bagItem('herb', n)]
        }),
      ]
    },

    // ── Fields: dry well cave ─────────────────────────────────────────
    'fw-tanuki': (c) => {
      if (!done(c, 'fw-lamp'))
        return [
          c.say('くらくて なにも みえない… だれか、ランプに ひを つけて！', 'It’s too dark to see a thing… somebody light the lamp!', DOKKO, 'tanuki'),
          c.fude('ランプに むかって「ひ」と となえよう！', 'Face the lamp and cast ひ (fire)!'),
        ]
      return once(
        c,
        'fw-tanuki',
        () => [c.say('あかるい！ ほら、ほりだした きんの つぶ。おれいに あげる。', 'Light! Look — gold nuggets I dug up. They’re yours, as thanks.', DOKKO, 'tanuki'), ...c.reward(40, 25)],
        () => [c.say('この いどは むかし、泉の みずで いっぱい だったんだって。', 'They say this well was once full of spring water.', DOKKO, 'tanuki')],
      )
    },

    // ── Forest: mushroom hollow ───────────────────────────────────────
    'foh-herbalist': (c) => {
      if (done(c, 'foh-quiz')) return [c.say('きのこは よく 見て から たべてね。', 'Look carefully at a mushroom before you eat it.')]
      return [
        c.say('この あかくて まだらの きのこ… あなたは たべますか？', 'This red, spotted mushroom… would you eat it?'),
        c.choice({ jp: 'たべますか？', en: 'Will you eat it?' }, [['yes', 'たべます', 'I’ll eat it'], ['no', 'たべません', 'I won’t eat it']], (id) => {
          if (id === 'yes') return [c.say('だめ だめ！ それは どくきのこ です！ もう いちど かんがえて。', 'No, no! That one is poisonous! Think again.')]
          c.set(key('foh-quiz'))
          return [c.say('せいかい！ たべません。かしこい ですね。', 'Correct! You won’t eat it. How wise.'), c.say('これは たべられる くすりそう。どうぞ。', 'This herb, though, is safe. Take it.'), ...c.bagItem('herb', 2)]
        }),
      ]
    },
    'foh-tanuki': (c) => {
      if (done(c, 'foh-woke')) return [c.say('ふぁあ… きょうは はやく おきたよ。', 'Yawn… I got up early today.')]
      return [c.narrate('たぬきが ぐうぐう ねている。', 'The tanuki is fast asleep.'), c.fude('おこして みよう。「おきる」と となえて！', 'Let’s wake it up. Cast おきる (wake up)!')]
    },

    // ── Forest: misty lake ────────────────────────────────────────────
    'fol-angler': (c) => [
      c.say('さかなは まつ ものじゃ。いっしょに まつか？', 'Fishing is all about waiting. Will you wait with me?'),
      c.choice({ jp: 'まちますか？', en: 'Will you wait?' }, [['yes', 'まちます', 'I’ll wait'], ['no', 'まちません', 'I won’t wait']], (id) => {
        if (id === 'no') return [c.say('はっは。わかい もんは いそがしいのう。', 'Ha ha. Young folk are always in a hurry.')]
        return [
          c.narrate('しずかに まった… きりが ゆっくり ながれていく。', 'You wait quietly… the mist drifts slowly past.'),
          ...once(
            c,
            'fol-catch',
            () => [c.say('おお、つれた！ まった かいが あったのう。これは おれいじゃ。', 'Oho, a bite! Waiting paid off. This is for you.'), ...c.reward(25, 15)],
            () => [c.say('きょうは もう つれんのう。でも、まつのも たのしい ものじゃ。', 'Nothing more today. Still, waiting has its own joy.')],
          ),
        ]
      }),
    ],

    // ── Shrine: thousand torii ────────────────────────────────────────
    'st-fox': (c) => {
      if (done(c, 'st-riddle')) return [c.say('コン。とりいを くぐる たびに、ねがいが ひとつ とどくんだよ。', 'Kon. With every torii you pass through, one wish reaches the gods.')]
      return [
        c.say('コン。よく のぼって きたね。ひとつ なぞなぞ。', 'Kon. You climbed all the way up. Here’s a riddle.'),
        c.ask({ jp: 'せんぼんの とりいは、なにいろ？', en: 'What colour are the thousand torii?' }, ['あかい', 'あか'], (ok) => {
          if (!ok) return [c.say('ちがう ちがう。くだりながら、よく 見てごらん。', 'No, no. Look carefully on your way down.')]
          c.set(key('st-riddle'))
          return [c.say('そう、あかい！ おいなりさまの いろだよ。', 'Yes, red! The colour of the Inari gods.'), ...c.reward(30, 20)]
        }),
      ]
    },

    // ── Shrine: moss garden ───────────────────────────────────────────
    'sg-teamaster': (c) => [
      c.say('ようこそ。あつい おちゃと、つめたい おちゃ。どちらが すき？', 'Welcome. Hot tea or cold tea — which do you like?'),
      c.choice({ jp: 'どちら？', en: 'Which one?' }, [['hot', 'あつい おちゃ', 'Hot tea'], ['cold', 'つめたい おちゃ', 'Cold tea']], (id) => [
        id === 'hot' ? c.say('あつい おちゃ ですね。しずかに、ゆっくり どうぞ。', 'Hot tea it is. Drink it slowly, in quiet.') : c.say('つめたい おちゃ ですね。なつの にわに ぴったり。', 'Cold tea, then. Perfect for a summer garden.'),
        c.narrate('にわを ながめながら、おちゃを のんだ。こころが 静かに なる。', 'You sip your tea, looking out at the garden. Your heart grows still.'),
        ...once(
          c,
          'sg-tea',
          () => [c.say('いい かおを していますね。これを もって いきなさい。', 'You have a peaceful look about you. Take this with you.'), ...c.bagItem('ether', 1)],
          () => [],
        ),
      ]),
    ],

    // ── Tower: castle garden ──────────────────────────────────────────
    'tg-gardener': (c) => {
      if (!done(c, 'tg-rose'))
        return [
          c.say('おひめさまの バラが かれそうで… いのちの ことばが あれば…', 'The princess’s rose is wilting… if only I knew a word of life…', GARDENER),
          c.fude('バラに「いのち」を ふきこんで みよう！', 'Let’s breathe いのち (life) into the rose!'),
        ]
      return once(
        c,
        'tg-gardener',
        () => [c.say('さいた！ あなたは ほんものの まほうつかい ですね。', 'It’s blooming! You truly are a mage.', GARDENER), ...c.reward(40, 25)],
        () => [c.say('バラが まいにち きれいに さいています。', 'The rose blooms beautifully every day.', GARDENER)],
      )
    },

    // ── Tower: armoury ────────────────────────────────────────────────
    'ta-quartermaster': (c) => [
      c.say('ここは ぶきこだ。たびの おともに ひとつ えらべ。', 'This is the armoury. Choose one to take on your journey.'),
      c.choice({ jp: 'どちらを えらぶ？', en: 'Which will you choose?' }, [['sword', 'つるぎ', 'The sword'], ['shield', 'たて', 'The shield']], (id) => {
        const line = id === 'sword' ? c.say('つるぎは「きる」 ちから。でも、ことばの ほうが つよいぞ。', 'The sword is the power to cut. But words are stronger.') : c.say('たては「まもる」 ちから。いい えらび だ。', 'The shield is the power to protect. A good choice.')
        return [
          line,
          ...once(
            c,
            'ta-gift',
            () => (id === 'sword' ? c.bagItem('smoke', 1) : c.bagItem('charm', 1)),
            () => [c.say('…と いっても、もう ひとつ あげたな。はっは。', '…Though I already gave you one. Ha ha.')],
          ),
        ]
      }),
    ],

    // ── Tower: star library ───────────────────────────────────────────
    'tl-astronomer': (c) => {
      if (done(c, 'tl-riddle')) return [c.say('ほしを よむと、世界の 夢が わかる。りゅうも、むかしは 星を 見ていたのだよ。', 'Read the stars and you learn what the world dreams. Even the dragon once watched the stars.')]
      return [
        c.say('ほう、わかい まほうつかい。ひとつ きこう。', 'Oh, a young mage. Let me ask you something.'),
        c.ask({ jp: 'よるの 空に たくさん 光る もの。なに？', en: 'Many things shine in the night sky. What are they?' }, ['ほし'], (ok) => {
          if (!ok) return [c.say('ふむ… ぼうえんきょうを のぞいて ごらん。', 'Hmm… take a look through the telescope.')]
          c.set(key('tl-riddle'))
          return [c.say('そのとおり、星だ。よい め を もっている。', 'Exactly — stars. You have good eyes.'), ...c.reward(40, 30)]
        }),
      ]
    },
  },
  cast: {
    'vb-shrine': (c, k) => {
      if (k !== 'はな') return null
      c.learn('hana')
      c.sparkle('leaf')
      return once(
        c,
        'vb-flowers',
        () => [c.narrate('「はな」！ おやしろの まわりに、しろい 花が ぱっと さいた。', '“Hana”! White flowers burst into bloom around the shrine.'), c.say('コン… なんて きれい。ありがとう、まほうつかいさん。', 'Kon… how beautiful. Thank you, mage.', FOX, 'fox'), ...c.reward(30, 15)],
        () => [c.narrate('花が また ひとつ ふえた。', 'One more flower blooms.')],
      )
    },
    'vb-chime': (c, k) => {
      if (k !== 'かぜ') return null
      c.learn('kaze')
      c.sparkle('leaf')
      return [c.narrate('そよかぜが たけを ゆらした。ちりん… ちりーん…', 'A breeze sways the bamboo. Chirin… chiriiin…')]
    },
    'vb-moonstone': (c, k) => {
      if (k !== 'つき') return null
      c.learn('tsuki')
      c.sparkle('ripple')
      return [c.narrate('いけの みずに、まるい 月が ゆらりと うかんだ。', 'A round moon floats up, rippling, on the pond.')]
    },
    'vt-mill': (c, k) => {
      if (k !== 'みず') return null
      c.learn('mizu')
      c.sparkle('ripple')
      return once(
        c,
        'vt-mill',
        () => [c.narrate('「みず」！ かわから みずが ながれこみ、すいしゃが ごとんと まわりだした！', '“Mizu”! River water rushes in, and the waterwheel creaks into motion!'), c.say('おお、まわった！', 'Oh, it’s turning!', MILLER, 'villager-a')],
        () => [c.narrate('すいしゃは げんきに まわっている。', 'The waterwheel is turning merrily.')],
      )
    },
    'vt-jizo': (c, k) => {
      if (k !== 'あめ') return null
      c.learn('ame')
      c.sparkle('ripple')
      return [c.narrate('ぱら ぱら… たんぼに やさしい 雨が ふった。おじぞうさまが わらった きが した。', 'Pitter-patter… a gentle rain falls on the paddies. The Jizō seems to smile.')]
    },
    'vt-heron': (c, k) => {
      if (k === 'さかな') {
        c.learn('sakana')
        c.sparkle('ripple')
        return [c.narrate('さかなが ぴょんと はねた。しらさぎが さっと つかまえた！', 'A fish leaps — and the heron snaps it up!'), c.say('クワッ♪', 'Kwah♪')]
      }
      if (k === 'とり') {
        c.learn('tori')
        return [c.say('クワ？', 'Kwah?'), c.narrate('しらさぎは くびを かしげた。', 'The heron tilts its head.')]
      }
      return null
    },
    'fh-mill': (c, k) => {
      if (k !== 'かぜ') return null
      c.learn('kaze')
      c.sparkle('leaf')
      return once(
        c,
        'fh-mill',
        () => [c.narrate('「かぜ」！ ごうっと 風が ふいて、かざぐるまの はねが まわりだした！', '“Kaze”! A gust roars past and the windmill’s sails begin to turn!'), c.say('まわった！', 'They’re turning!', SOYO, 'villager-b')],
        () => [c.narrate('はねが くるくる まわっている。', 'The sails spin round and round.')],
      )
    },
    'fh-apple': (c, k) => {
      if (k !== 'りんご') return null
      c.learn('ringo')
      c.sparkle('leaf')
      return [c.narrate('りんごが ひとつ、ころりと おちてきた。あまい におい。', 'An apple drops down with a thump. It smells sweet.')]
    },
    'fh-cloudrock': (c, k) => {
      if (k !== 'くも') return null
      c.learn('kumo')
      return [c.narrate('雲が りんごの かたちに なった… きが した。', 'The clouds take the shape of an apple… or so it seems.')]
    },
    'fw-lamp': (c, k) => {
      if (k !== 'ひ') return null
      c.learn('hi')
      c.sparkle('spark')
      return once(
        c,
        'fw-lamp',
        () => [c.narrate('「ひ」！ ランプに あかい ひが ともり、どうくつが あかるく なった。', '“Hi”! A red flame catches in the lamp, and the cave fills with light.'), c.say('わあ、みえる！', 'Whoa, I can see!', DOKKO, 'tanuki')],
        () => [c.narrate('ランプの ひが ゆらゆら もえている。', 'The lamp’s flame flickers gently.')],
      )
    },
    'fw-spring': (c, k) => {
      if (k !== 'いずみ' && k !== 'みず') return null
      c.learn(k === 'いずみ' ? 'izumi' : 'mizu')
      c.sparkle('ripple')
      return [c.narrate('いずみが ぽこぽこ わきたった。つめたくて すんだ みずだ。', 'The spring bubbles up — cold, clear water.')]
    },
    'foh-tanuki': (c, k) => {
      if (k === 'ねる') {
        c.learn('neru')
        return [c.narrate('たぬきは もっと ふかく ねむって しまった… ぐうぐう。', 'The tanuki sinks into an even deeper sleep… snore.')]
      }
      if (k !== 'おきる') return null
      c.learn('okiru')
      c.sparkle('dust')
      return once(
        c,
        'foh-woke',
        () => [c.narrate('「おきる」！ たぬきが ぱちっと めを あけた。', '“Okiru”! The tanuki’s eyes pop open.'), c.say('ふぁあ… おきた。ずっと ゆめを みてた。おこして くれて ありがとう。これ、あげる。', 'Yawn… I’m up. I was dreaming for ages. Thanks for waking me — here.'), ...c.bagItem('smoke', 1), ...c.reward(30, 15)],
        () => [c.say('もう おきてるよ〜。', 'I’m already awake~.')],
      )
    },
    'foh-patch': (c, k) => {
      if (k !== 'たべる') return null
      c.learn('taberu')
      return [c.fude('まって！ たべる まえに、くすしの ヨモギさんに きこう。', 'Wait! Before you eat anything, ask Yomogi the herbalist.')]
    },
    'fol-bell': (c, k) => {
      if (k !== 'きく') return null
      c.learn('kiku')
      c.sparkle('ripple')
      return [c.narrate('ごーん… みずうみの むこうから、こだまが かえって きた。', 'Gooong… an echo comes back from across the lake.')]
    },
    'fol-boat': (c, k) => {
      if (k !== 'わたる') return null
      c.learn('wataru')
      return [c.narrate('こぶねが ゆらりと ゆれた。… きりが ふかくて、きょうは わたれない。', 'The little boat rocks… but the mist is too thick to cross today.')]
    },
    'st-okunoin': (c, k) => {
      if (k !== 'しずか') return null
      c.learn('shizuka')
      c.sparkle('dust')
      return [c.narrate('しずかに てを あわせた。山の 風が、とりいの あいだを ぬけていく。', 'You quietly put your hands together. The mountain wind slips between the torii.')]
    },
    'sg-stone': (c, k) => {
      if (k !== 'しずか') return null
      c.learn('shizuka')
      return [c.narrate('……。にわが いっそう 静かに なった。', '……. The garden grows even quieter.')]
    },
    'tg-rose': (c, k) => {
      if (k !== 'いのち') return null
      c.learn('inochi')
      c.sparkle('leaf')
      return once(
        c,
        'tg-rose',
        () => [c.narrate('「いのち」！ しおれた バラが ゆっくり かおを あげ、まっかに さいた。', '“Inochi”! The wilted rose slowly lifts its head and blooms a deep red.')],
        () => [c.narrate('バラは げんきに さいている。', 'The rose is in full bloom.')],
      )
    },
    'ta-dummy': (c, k) => {
      if (k !== 'きる') return null
      c.learn('kiru')
      c.sparkle('dust')
      return [c.narrate('ずばっ！ わらが ぱらぱら まいおちた。', 'Slash! Straw flutters to the floor.')]
    },
    'tl-telescope': (c, k) => {
      if (k !== 'ほし') return null
      c.learn('hoshi')
      c.sparkle('spark')
      return [c.narrate('ぼうえんきょうの むこうで、星が ひとつ きらりと ながれた。', 'Through the telescope, a single star streaks brightly across the sky.')]
    },
  },
  ghost: {
    // unlit until a mage brings fire
    'fw-lamp': (s) => !isSet(s, 'fw-lamp'),
  },
}

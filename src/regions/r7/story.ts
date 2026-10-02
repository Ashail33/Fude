/**
 * Region 7 — the Hot-Spring Hollow. The Yamanba has knotted the village's
 * verbs and eaten its yesterdays: nobody can say what they did, ask if they
 * may, or tell anyone they must not. Untying each knot means saying the
 * right て-form or た-form out loud.
 *
 * Main road: “The Knotted Words” (Grandpa Gen → three knots → Haruko → the
 * Yamanba's cave). Side tale: the snow monkeys' cold pool.
 * Folklore: the Akaname who licks dirty tubs, the white heron who finds
 * lost springs (Gero Onsen), and Yōrō Falls, whose water turned to sake for
 * a son who looked after his old father.
 */
import { bossOf } from '../../data/regions'
import { isPassed, type PlayerState } from '../../engine/store'
import { offer } from '../../story/tales/r1-village'
import type { Ctx, TaleContent } from '../../story/tales/types'
import type { Step } from '../../world/Dialog'

const MONKEY = { jp: 'ゆきざる', en: 'Snow Monkey' }
const KOSARU = { jp: 'こざる', en: 'Little Monkey' }
const SARU = { jp: 'サル', en: 'Saru' }
const AKANAME = { jp: 'あかなめ', en: 'Akaname' }
const TOME = { jp: 'とめばあさん', en: 'Granny Tome' }
const SAGI = { jp: 'しらさぎ', en: 'White Heron' }
const KIYO = { jp: 'きよ', en: 'Kiyo' }
const KOSUKE = { jp: 'こうすけ', en: 'Kosuke' }
const SANPEI = { jp: 'さんぺいじいさん', en: 'Grandpa Sanpei' }
const FALLS = { jp: 'たきの せい', en: 'Spirit of the Falls' }

const stageOf = (s: PlayerState, tale: string) => s.flags?.[`tale.${tale}`] ?? -1
const fl = (s: PlayerState, k: string) => s.flags?.[k] ?? 0
const bossDown = (c: Ctx) => isPassed(c.s(), bossOf(7).id)

/** A one-time small reward for discovering a word reaction. */
function firstTime(c: Ctx, key: string, xp = 10, shards = 5): Step[] {
  if (c.flag(`cast.${key}`)) return []
  c.set(`cast.${key}`)
  return c.reward(xp, shards)
}

// ── The Knotted Words: three villagers whose verbs are tied in knots ──
const KNOTS = ['gen', 'mitsu', 'jiro'] as const
const knotsUntied = (c: Ctx) => KNOTS.filter((k) => c.flag(`r7.knot.${k}`) > 0).length

function untied(c: Ctx, k: (typeof KNOTS)[number]): Step[] {
  c.set(`r7.knot.${k}`)
  c.sparkle('spark')
  c.sfx('correct')
  const n = knotsUntied(c)
  if (n >= 3 && c.stage('r7-knots') === 0)
    return [c.fude('むすびめが ぜんぶ ほどけた！ りょかんの おかみさんに しらせよう！', 'Every knot is untied! Let’s tell the proprietress at the inn!'), ...c.reward(30, 10), ...c.advance('r7-knots')]
  return [c.fude(`むすびめは あと ${3 - n}つ！`, `${3 - n} knot${3 - n === 1 ? '' : 's'} to go!`)]
}

export const ONSEN_TALES: TaleContent = {
  items: [
    { id: 'r7-tenugui', name: 'Haruko’s Tenugui', jp: 'ゆのさとやの てぬぐい', kana: 'てぬぐい', emoji: '🧣', desc: 'A thin cotton hand towel printed with the inn’s crest: steam rising over a monkey. Warm to the touch even in the snow.' },
    { id: 'r7-yesterdays', name: 'A Page of Yesterdays', jp: 'きのうの ページ', kana: 'きのうのぺーじ', emoji: '📖', desc: 'A page from the inn’s guestbook. In Haruko’s neat brushwork: “Came over the mountain. Untied the Hollow’s words. Took a long, warm bath.”' },
    { id: 'r7-persimmon', name: 'Frozen Persimmon', jp: 'こおった かき', kana: 'かき', emoji: '🟠', desc: 'The little monkey’s treasure, frozen hard as a stone. It will be sweet when it thaws.' },
  ],
  tales: [
    {
      id: 'r7-knots',
      region: 7,
      main: true,
      title: 'The Knotted Words',
      jp: 'もつれた ことば',
      summary: 'All over the Hot-Spring Hollow, verbs are tied in knots. Nobody can say what they did yesterday, ask if they may, or say what is forbidden.',
      giver: 'o-grandpa',
      stages: [
        { en: 'Untie three knotted voices: Grandpa Gen at the footbath, Mitsu the photographer by the bridge, and Jiro at the bath-house', jp: 'げんじい、ミツ、じろうの ことばの むすびめを ほどこう', target: ['o-grandpa', 'o-photographer', 'o-jiro'], map: 'onsen' },
        { en: 'Tell Haruko, the proprietress of the inn, what you found', jp: 'りょかんの おかみ、はるこさんに しらせよう', target: ['oi-okami'], map: 'onsen-inn' },
        { en: 'Climb the bamboo trail to the Yamanba’s steam cave, defeat her, then return to Haruko', jp: 'たけの みちを のぼって やまんばを たおし、はるこさんの ところへ もどろう', target: ['oc-yamanba', 'oi-okami'], map: 'onsen-cave' },
      ],
    },
    {
      id: 'r7-monkeys',
      region: 7,
      title: 'The Monkeys’ Cold Pool',
      jp: 'さるの つめたい おふろ',
      summary: 'The sickle-wind has chilled the snow monkeys’ little pool, and a small monkey is shivering by the rocks.',
      giver: 'r7-kosaru',
      stages: [
        { en: 'Wake the spring source with a word of hot water (cast おゆ at it)', jp: 'わきだしぐちに「おゆ」と となえよう', target: ['ob-source'], map: 'onsen-bath' },
        { en: 'The little monkey asks if it may get in. Answer it properly', jp: 'こざるに ただしく こたえよう', target: ['r7-kosaru'], map: 'onsen-bath' },
        { en: 'Tell Saru what the little monkey is doing now', jp: 'こざるが いま なにを しているか、サルに おしえよう', target: ['ob-saru'], map: 'onsen-bath' },
      ],
    },
  ],
  entities: {
    'onsen-bath': [{ id: 'r7-kosaru', kind: 'npc', sprite: 'monkey', x: 29, y: 4, dir: 'left', name: KOSARU, lines: [{ jp: 'キ… キ…', en: 'Ki… ki…' }] }],
  },
  talk: {
    // ── The Knotted Words ─────────────────────────────────────────────
    'o-grandpa': (c) => {
      const st = c.stage('r7-knots')
      if (st < 0)
        return offer(
          c,
          'r7-knots',
          [
            c.narrate('おじいさんが あしゆに 足を 入れて、くびを かしげている。', 'An old man sits with his feet in the footbath, head tilted in puzzlement.'),
            c.say('わしは きのう… あしゆに… はいる… はいる…？ うう、ことばが もつれて でてこん！', 'Yesterday I… the footbath… get in… get in…? Ugh, the words are tied in a knot!'),
            c.say('この ごろ、さとじゅうの ことばが もつれて おる。きのうの ことを、だれも いえんのじゃ。', 'Lately every word in the Hollow is tangled. Nobody can say what they did yesterday.'),
            c.fude('ことばが むすびめに なってる…！ ほどいて あげよう！', 'The words are tied in knots…! Let’s untie them!'),
          ],
          ['ほどく！', 'I’ll untie them!'],
        )
      if (st === 0 && !c.flag('r7.knot.gen'))
        return [
          c.say('きのう… あしゆに… はい… はい…', 'Yesterday… the footbath… got… got…'),
          c.choice(
            { jp: 'げんじいの ことばを ほどこう：「きのう、あしゆに ＿＿」', en: 'Untie Grandpa Gen’s words: “Kinō, ashiyu ni ___.” (Yesterday I got into the footbath.)' },
            [
              ['ru', 'はいた', 'haita'],
              ['ok', 'はいった', 'haitta'],
              ['raw', 'はいるた', 'hairuta'],
            ],
            (id) => {
              if (id === 'ru') return [c.say('はいた？ わしは くつを はいたのか？', 'Haita? Did I put on my shoes, then?'), c.fude('はいる は「る」で おわるけど、う-どうし！ はいって → …？', 'はいる ends in る, but it’s a う-verb! はいって → …?')]
              if (id === 'raw') return [c.narrate('むすびめが ぎゅっと かたく なった。', 'The knot pulls even tighter.'), c.fude('じしょの かたちに「た」は つかないよ。「て」の かたちから つくろう！', 'You can’t stick た onto the dictionary form. Build it from the て-form!')]
              c.learn('hairu')
              c.learn('ashiyu')
              return [
                c.say('わしは きのう、あしゆに はいった！ …いえた！ それから、さるを みた！ わはは！', 'Yesterday I got into the footbath! …I said it! And then I saw a monkey! Hahaha!'),
                c.fude('はいって → はいった。「て」を「た」に かえれば、きのうの ことが いえるね！', 'はいって → はいった. Swap て for た and you can talk about yesterday!'),
                ...untied(c, 'gen'),
              ]
            },
          ),
        ]
      if (st === 0) return [c.say('ほかの ものの ことばも、もつれて おる。ミツと じろうを たのむぞ。', 'Others are knotted too. See to Mitsu and young Jiro, would you.')]
      if (st >= 3) return [c.say('きのう、あしゆで いい ゆめを みた。…わし、ねて おったのか？', 'Yesterday I had a lovely dream at the footbath. …Was I asleep?')]
      return [c.say('きのうは あしゆ。きょうも あしゆ。あしたも あしゆじゃ！', 'Footbath yesterday. Footbath today. Footbath tomorrow!')]
    },
    'o-photographer': (c) => {
      const st = c.stage('r7-knots')
      if (st !== 0) return st >= 1 ? [c.say('さるの しゃしん、とっても いいって！ ほら、ピース してる。', 'They said I could photograph the monkeys! Look, a peace sign.')] : null
      if (c.flag('r7.knot.mitsu')) return [c.say('いい しゃしんが とれた！ ありがとう！', 'I got a great photo! Thank you!')]
      return [
        c.say('あの さるたちの しゃしんを とりたいの。でも きく ことばが もつれて…「とる… いい…？」', 'I want to photograph those monkeys. But the words for asking are knotted… “Take… okay…?”'),
        c.ask({ jp: 'ミツの かわりに きこう：「しゃしんを ＿＿ も いいですか」', en: 'Ask for her: “Shashin o ___ mo ii desu ka?” (May I take a photo?) Say the て-form of とる.' }, ['とって'], (ok) => {
          if (!ok) return [c.narrate('ことばが もつれて、ぐるぐる まわった。', 'The words tangle and spin.'), c.fude('とる は「る」で おわる う-どうし。う・つ・る は「って」！', 'とる is a う-verb ending in る. う, つ and る make って!')]
          c.learn('toru')
          return [
            c.say('しゃしんを とっても いいですか？ …いえた！', 'May I take a photo? …I said it!'),
            c.say('キキッ！（いいよ！）', 'Kik-kik! (Go ahead!)', MONKEY, 'monkey'),
            c.narrate('パシャッ！ さるが ピースを した。', 'Click! The monkey flashes a peace sign.'),
            ...untied(c, 'mitsu'),
          ]
        }),
      ]
    },
    'o-jiro': (c) => {
      if (c.stage('r7-knots') !== 0 || c.flag('r7.knot.jiro')) return null
      return [
        c.say('たいへん！ さるが ゆやの おふろで およいでる！ でも「だめ」の ことばが もつれて いえない！', 'Disaster! A monkey is swimming in the bath-house tub! But the words for “no” are knotted!'),
        c.ask({ jp: 'じろうの かわりに いおう：「おふろで ＿＿ は いけません！」', en: 'Say it for Jiro: “Ofuro de ___ wa ikemasen!” (You must not swim in the bath!) Say the て-form of およぐ.' }, ['およいで'], (ok) => {
          if (!ok) return [c.narrate('さるは ばしゃばしゃ およぎつづけている。', 'The monkey keeps splashing about.'), c.fude('およぐ は「ぐ」で おわる。ぐ → いで！', 'およぐ ends in ぐ: ぐ → いで!')]
          c.learn('oyogu')
          return [
            c.narrate('「おふろで およいでは いけません！」 さるは ぴたっと とまって、ゆっくり つかった。', '“You must not swim in the bath!” The monkey freezes, then settles down for a slow soak.'),
            c.say('ありがとう！ さるも ちゃんと きいて くれた！', 'Thanks! Even the monkey listened!'),
            ...untied(c, 'jiro'),
          ]
        }),
      ]
    },
    'oi-okami': (c) => {
      const st = c.stage('r7-knots')
      if (st === 1)
        return [
          c.say('まあ… げんじいさんが、きのうの ことを はなしている。あなたが ほどいて くださったのね。', 'Oh my… Grandpa Gen is talking about yesterday again. You untied his words, didn’t you.'),
          c.say('ことばを むすんだのは、やまの やまんばです。', 'The one who knotted our words is the Yamanba of the mountain.'),
          c.say('むかしの やまんばは やさしかった。つかれた たびびとに、お湯を わけて くれる ひと だったのに…', 'The Yamanba of old was kind. She shared her hot water with weary travellers…'),
          c.say('いまは「きのう」を たべて しまう。だから だれも、した ことが いえないの。', 'Now she eats “yesterday”. That is why nobody can say what they did.'),
          c.ask({ jp: 'いわやへの みち：「つりばしを わたって、たけの みちを ＿＿、いわやに 入る」', en: 'The way to her cave: “Cross the rope bridge, ___ the bamboo trail, and go into the cave.” Say the て-form of のぼる (climb).' }, ['のぼって'], (ok) => {
            if (!ok) return [c.say('…もう いちど。のぼる は、どう なりますか？', '…Once more. What does のぼる become?'), c.fude('のぼる も「る」で おわる う-どうし…「って」だね！', 'のぼる is another う-verb ending in る… so って!')]
            c.learn('noboru')
            return [
              c.say('ええ。つりばしを わたって、のぼって、いわやに 入る。', 'Yes. Cross the bridge, climb, and go into the cave.'),
              c.say('これを どうぞ。うちの てぬぐいです。やまの かぜから、あなたを まもります。', 'Please take this: our inn’s tenugui. It will guard you from the mountain wind.'),
              ...c.give('r7-tenugui'),
              ...c.advance('r7-knots'),
              c.fude('「〜て、〜て」で、じゅんばんに いえるんだね。', 'With て… て…, you can say things in order!'),
            ]
          }),
        ]
      if (st === 2) {
        // Until the Yamanba falls, Haruko goes on running her inn (her lessons stay open).
        if (!bossDown(c)) return null
        c.sparkle('spark')
        return [
          c.say('きこえますか？ さとの みんなが、きのうの ことを はなしています。', 'Can you hear it? Everyone in the Hollow is talking about yesterday.'),
          c.narrate('「きのう、ゆきを みた」「きのう、たまごを たべた」… ゆげの むこうから、たくさんの こえ。', '“Yesterday I saw snow.” “Yesterday I ate an egg.” … Voices drift through the steam.'),
          c.say('これは やどちょうの いちまい。あなたの きのうも、ここに かいて おきました。', 'This is a page from our guestbook. I wrote your yesterday in it, too.'),
          ...c.give('r7-yesterdays'),
          ...c.bagItem('ether', 2),
          ...c.reward(110, 45),
          ...c.advance('r7-knots'),
          c.fude('きのうが あるから、きょうの ことも はなせるんだね。', 'Because there is a yesterday, we can talk about today too.'),
        ]
      }
      return null
    },

    // ── The Monkeys' Cold Pool ────────────────────────────────────────
    'r7-kosaru': (c) => {
      const st = c.stage('r7-monkeys')
      if (st < 0)
        return offer(c, 'r7-monkeys', [
          c.narrate('ちいさな さるが、ぶるぶる ふるえている。', 'A little monkey is shivering all over.'),
          c.say('キ… キ… うえの おふろが、つめたく なっちゃった…', 'Ki… ki… our little upper pool went cold…'),
          c.fude('かまいたちの かぜが、お湯を ひやしたのかも。わきだしぐちに、お湯の ことばを！', 'Maybe the sickle-wind chilled it. Let’s give the spring source a word of hot water!'),
        ])
      if (st === 0) return [c.say('わきだしぐち、まだ つめたい…', 'The spring is still cold…'), c.fude('わきだしぐちに「おゆ」って となえよう！', 'Let’s cast おゆ at the spring source!')]
      if (st === 1)
        return [
          c.say('あったかく なった！ …でも、こわい。', 'It’s warm now! …But I’m scared.'),
          c.choice(
            { jp: 'こざる「ぼく、おゆに はいっても いい？」', en: 'Little monkey: “May I get in the water?”' },
            [
              ['ng', 'ううん、はいっては いけないよ。', 'No, you must not get in.'],
              ['bad', 'うん、はいりても いいよ。', 'Yes, you may (wrong form).'],
              ['ok', 'うん、はいっても いいよ。', 'Yes, you may get in.'],
            ],
            (id) => {
              if (id === 'ng') return [c.say('え… だめなの…？', 'Wh-what… I can’t…?'), c.fude('せっかく あったかく なったのに！ 「いい」って いって あげよう。', 'But we just warmed it up! Let’s tell it yes.')]
              if (id === 'bad') return [c.say('はいりて…？', 'Hairite…?'), c.fude('はいる → はいって。「はいりて」は ないよ。', 'はいる → はいって. There’s no “hairite”!')]
              c.learn('hairu')
              c.sparkle('ripple')
              return [c.narrate('こざるは そっと 足を 入れて… ざぶん！', 'The little monkey dips in one foot… and splash!'), c.say('キキーッ♪ あったかい！', 'Kiiik♪ So warm!'), ...c.advance('r7-monkeys')]
            },
          ),
        ]
      if (st === 2) return [c.narrate('こざるは めを とじて、ゆげの 中で ゆらゆら している。', 'The little monkey sways in the steam, eyes closed.')]
      return [c.say('キ♪', 'Ki♪')]
    },
    'ob-saru': (c) => {
      if (c.stage('r7-monkeys') !== 2) return null
      return [
        c.choice(
          { jp: 'サル「あの ちびは いま、なにを している？」', en: 'Saru: “What is the little one doing now?”' },
          [
            ['ta', 'おゆに はいった', 'It got into the water'],
            ['kudasai', 'おゆに はいって ください', 'Please get into the water'],
            ['ok', 'おゆに はいっている', 'It is in the water'],
          ],
          (id) => {
            if (id === 'ta') return [c.say('はいった、か。それは さっきの ことだな。いまは？', 'Got in, eh. That was a moment ago. And now?'), c.fude('いま つづいている ことは「〜ている」！', 'Something going on right now is 〜ている!')]
            if (id === 'kudasai') return [c.say('わしに たのんで どうする。', 'Why are you asking ME to?'), c.fude('「〜てください」は おねがい。いまの ようすは「〜ている」だよ。', '〜てください is a request. What’s happening now is 〜ている.')]
            c.learn('hairu')
            c.learn('saru')
            return [
              c.say('そう、おゆに はいっている。…ありがとうよ、まほうつかい。', 'That’s right: it’s in the water. …Thank you, little mage.', SARU, 'monkey'),
              c.say('これは あいつの たからもの。きみに やれ、と さ。', 'This is the little one’s treasure. It wants you to have it.', SARU, 'monkey'),
              ...c.give('r7-persimmon'),
              ...c.reward(50, 20),
              ...c.advance('r7-monkeys'),
            ]
          },
        ),
      ]
    },
  },
  cast: {
    // ── The Monkeys' Cold Pool ────────────────────────────────────────
    'ob-source': (c, k) => {
      if (k === 'おゆ' || k === 'おんせん') {
        c.learn(k === 'おゆ' ? 'oyu' : 'onsen')
        c.sparkle('ripple')
        if (c.stage('r7-monkeys') !== 0) return [c.narrate('あつい お湯が、ぽこぽこ わいた。', 'Hot water bubbles up, plop, plop.')]
        c.sfx('correct')
        return [c.narrate(`「${k}」！ いわの あいだから、あつい お湯が どっと わきだした！`, `“${k === 'おゆ' ? 'Oyu' : 'Onsen'}”! Hot water gushes up between the rocks!`), c.narrate('うえの おふろから、しろい ゆげが たちのぼる。', 'White steam rises from the upper pool.'), ...c.advance('r7-monkeys')]
      }
      if (k === 'ゆき' || k === 'みず') return (c.learn(k === 'ゆき' ? 'yuki' : 'mizu'), [c.narrate('わきだしぐちが、ますます つめたく なった。', 'The spring gets even colder.'), c.fude('はんたい、はんたい！', 'The opposite, the opposite!')])
      if (k === 'ゆげ') return (c.learn('yuge'), [c.narrate('ゆげが ふわっと ゆれた。…でも お湯は つめたい まま。', 'The steam sways… but the water stays cold.')])
      return null
    },
    'ob-pool': (c, k) => {
      if (k === 'はいる') return (c.learn('hairu'), c.sparkle('ripple'), [c.narrate('「はいる」！ かたまで お湯に つかった。…ふう〜〜。', '“Hairu”! You sink in up to your shoulders. …Haaah.'), c.narrate('きもちいい。', 'Bliss.'), ...firstTime(c, 'ob-pool')])
      if (k === 'きもちいい') return (c.learn('kimochiii'), [c.narrate('ゆげの むこうで、さるたちも「キ〜」と うなずいた。', 'Through the steam, the monkeys nod: “Kiii~”.')])
      if (k === 'およぐ') return (c.learn('oyogu'), [c.say('およいでは いけない！', 'No swimming!', SARU, 'monkey'), c.narrate('サルに ぴしゃりと しかられた。', 'Saru scolds you sharply.')])
      if (k === 'ゆげ') return (c.learn('yuge'), [c.narrate('ゆげが ほしぞらへ のぼって いく。ほしが にじんで みえる。', 'The steam drifts up into the starry sky. The stars blur softly.')])
      return null
    },
    'ob-saru': (c, k) => {
      if (k === 'かた') return (c.learn('kata'), [c.narrate('サルの かたを もんで あげた。', 'You give Saru a shoulder rub.'), c.say('キ〜… そこ そこ。', 'Kiii… right there.', SARU, 'monkey')])
      if (k === 'せなか') return (c.learn('senaka'), [c.say('せなかを ながして くれるのか。よし、こんどは わしが ながしてやろう。', 'Washing my back? Good. Next time I’ll do yours.', SARU, 'monkey')])
      if (k === 'あたま') return (c.learn('atama'), [c.narrate('サルは あたまに ゆきを のせて、すまして いる。', 'Saru sits there with snow on his head, looking dignified.')])
      if (k === 'さる') return (c.learn('saru'), [c.say('いかにも。わしは さる。なまえも サル。', 'Indeed. I am a monkey. My name is also Monkey.', SARU, 'monkey'), ...firstTime(c, 'ob-saru')])
      return null
    },
    'r7-kosaru': (c, k) => {
      if (k === 'あそぶ') return (c.learn('asobu'), [c.say('あそぼう！ あそぼう！', 'Let’s play! Let’s play!'), c.narrate('こざるは ゆきだまを なげて きた。', 'The little monkey throws a snowball at you.')])
      if (k === 'さる') return (c.learn('saru'), [c.say('キ！ ぼく、さる！', 'Ki! I’m a monkey!')])
      return null
    },
    'ob-taps': (c, k) => {
      if (k === 'あらう' || k === 'せっけん') return (c.learn(k === 'あらう' ? 'arau' : 'sekken'), c.sparkle('ripple'), [c.narrate('せっけんで からだを あらった。あわが ゆきみたいに しろい。', 'You wash with the soap. The suds are as white as snow.'), ...firstTime(c, 'ob-taps')])
      return null
    },
    'ob-towels': (c, k) => (k === 'たおる' ? (c.learn('taoru'), [c.narrate('タオルを あたまに のせた。これで ばっちり。', 'You fold a towel on top of your head. Perfect.')]) : null),

    // ── playful word reactions in the village ─────────────────────────
    'o-vent': (c, k) => {
      if (k === 'ゆげ') return (c.learn('yuge'), c.sparkle('dust'), [c.narrate('「ゆげ」！ いわから ゆげが もくもく、ハートの かたちに なった。', '“Yuge”! Steam billows from the rock… into the shape of a heart.'), ...firstTime(c, 'o-vent')])
      if (k === 'ゆき') return (c.learn('yuki'), [c.narrate('ゆきが ゆげに ふれて、すぐに きえた。', 'Snowflakes touch the steam and vanish at once.')])
      return null
    },
    'o-ashiyu': (c, k) => {
      if (k === 'あし') return (c.learn('ashi'), c.sparkle('ripple'), [c.narrate('くつを ぬいで、あしを お湯に 入れた。…あったかい。', 'You take off your shoes and dip your feet in. …So warm.'), ...firstTime(c, 'o-ashiyu')])
      if (k === 'あたたかい') return (c.learn('atatakai'), [c.narrate('あしゆが ほかほかに なった。ねこが よって きた。', 'The footbath gets toasty. The cat comes over.')])
      return null
    },
    'o-bridge': (c, k) => {
      if (k === 'わたる') return (c.learn('wataru'), [c.narrate('つりばしが ぎしぎし ゆれる。…したを みては いけない。', 'The rope bridge creaks and sways. …Don’t look down.')])
      if (k === 'つりばし') return (c.learn('tsuribashi'), [c.narrate('つりばしの なわが、ぴんと はった。', 'The bridge ropes pull taut.'), ...firstTime(c, 'o-bridge')])
      if (k === 'たに') return (c.learn('tani'), [c.narrate('たにの そこから、かわの おとが のぼって きた。', 'The sound of the river rises from the bottom of the gorge.')])
      return null
    },
    'o-monkey': (c, k) => {
      if (k === 'あそぶ') return (c.learn('asobu'), [c.narrate('ゆきざるが ゆきの 上で ころころ ころがった。', 'The snow monkey rolls around in the snow.'), ...firstTime(c, 'o-monkey')])
      if (k === 'さる') return (c.learn('saru'), [c.say('キッ？', 'Kik?')])
      return null
    },
    'o-photographer': (c, k) => (k === 'とる' ? (c.learn('toru'), c.sparkle('spark'), [c.narrate('パシャッ！ ミツが あなたの しゃしんを とった。', 'Click! Mitsu takes your picture.'), c.say('いい かお！', 'Great face!')]) : null),
    'o-cat': (c, k) => (k === 'ねる' || k === 'やすむ' ? (c.learn(k === 'ねる' ? 'neru' : 'yasumu'), [c.narrate('ねこは あしゆの そばで まるく なった。', 'The cat curls up by the footbath.')]) : null),
    'o-eggs': (c, k) => {
      if (k === 'おゆ' || k === 'いれる') return (c.learn(k === 'おゆ' ? 'oyu' : 'ireru'), [c.narrate('かまの お湯に たまごを 入れた。…あとで たべよう。', 'You put an egg into the cauldron. …You’ll eat it later.')])
      return null
    },
    'oi-futon': (c, k) => {
      if (k === 'ねる' || k === 'やすむ') return (c.learn(k === 'ねる' ? 'neru' : 'yasumu'), [c.narrate('ふとんに もぐった。…ぽかぽか。', 'You burrow into the futon. …Toasty.'), c.fude('ねちゃ だめ！ まだ ひるだよ！', 'No sleeping! It’s still daytime!')])
      if (k === 'ねむい') return (c.learn('nemui'), [c.narrate('ふあ〜あ… ふとんが よんでいる。', 'Yaaawn… the futon is calling you.')])
      return null
    },
    'ot-falls': (c, k) => {
      if (k === 'たき') return (c.learn('taki'), c.sparkle('ripple'), [c.narrate('「たき」！ たきの おとが、いっしゅん うたのように きこえた。', '“Taki”! For a moment, the roar of the falls sounds like a song.'), ...firstTime(c, 'ot-falls')])
      return null
    },
    'ot-bamboo': (c, k) => (k === 'たけ' ? (c.learn('take'), c.sparkle('leaf'), [c.narrate('たけが さらさら ゆれて、はっぱが ふった。', 'The bamboo rustles, and leaves drift down.'), ...firstTime(c, 'ot-bamboo')]) : null),
  },
  mapCast: {
    onsen: (c, k) => {
      if (k === 'ゆげ') return (c.learn('yuge'), [c.narrate('「ゆげ」！ さとじゅうの ゆげが、いっせいに おどった。', '“Yuge”! All the steam in the Hollow dances at once.')])
      if (k === 'さる') return (c.learn('saru'), [c.narrate('「さる」！ やねの 上から、ゆきざるが こっちを のぞいた。', '“Saru”! A snow monkey peeks down at you from a rooftop.')])
      if (k === 'つかれる') return (c.learn('tsukareru'), [c.narrate('「つかれる」… どっと つかれが でた。あしゆに いきたい。', '“Tsukareru”… a wave of tiredness hits you. You could use a footbath.')])
      if (k === 'あるく') return (c.learn('aruku'), [c.narrate('「あるく」！ ゆっくり あるいて、ゆげの においを すいこんだ。', '“Aruku”! You stroll slowly, breathing in the smell of steam.')])
      return null
    },
    'onsen-bath': (c, k) => (k === 'ほし' ? (c.learn('hoshi'), c.sparkle('spark'), [c.narrate('「ほし」！ ゆげの むこうで、ながれぼしが ひとつ ながれた。', '“Hoshi”! Beyond the steam, a shooting star streaks past.')]) : null),
  },
  moved: {
    // Grandpa Gen, words untied, finally gets out of the footbath to sit on the bench.
    'o-grandpa': (s) => (stageOf(s, 'r7-knots') >= 3 ? { x: 7, y: 13 } : null),
  },
  ghost: {
    // The little monkey is a shivering blur until its pool is warm.
    'r7-kosaru': (s) => stageOf(s, 'r7-monkeys') < 1,
  },
}

// ── Folklore: three spirits of the Hollow ───────────────────────────────

export const ONSEN_FOLK: TaleContent = {
  yokai: [
    {
      id: 'akaname',
      region: 7,
      name: 'Akaname',
      jp: '垢嘗',
      kana: 'あかなめ',
      emoji: '👅',
      lore: 'The akaname, “filth-licker”, is a red-skinned, child-sized spirit with a very long tongue that creeps into bathhouses at night and licks the grime from tubs nobody has scrubbed. It never hurts anyone, but people kept their baths spotless so it would have no reason to visit — which makes the akaname, in its odd way, the guardian of clean baths.',
      hint: 'In a bath-house nobody has scrubbed for years, something is licking the tub.',
      words: ['arau', 'sekken', 'ofuro', 'issho', 'oyu'],
    },
    {
      id: 'shirasagi',
      region: 7,
      name: 'The White Heron of the Spring',
      jp: '白鷺',
      kana: 'しらさぎ',
      emoji: '🪶',
      lore: 'At Gero, they say, the hot spring once stopped flowing. Soon a white heron came down to the river every day and stood at the same spot; when the villagers looked, hot water was bubbling up there. The heron flew off to a pine on the hill, where they found a statue of Yakushi, the healing Buddha: the god had come as a bird to lead them back to their spring.',
      hint: 'In the shallows of the gorge, a white bird stands very, very still.',
      words: ['tatsu', 'ashi', 'onsen', 'yuge', 'atatakai'],
    },
    {
      id: 'yoro-no-taki',
      region: 7,
      name: 'Yōrō Falls',
      jp: '養老の滝',
      kana: 'ようろうのたき',
      emoji: '🏞️',
      lore: 'A poor young woodcutter looked after his old father, who loved sake but could no longer afford it. One day, slipping on the rocks beneath a mountain waterfall, the son smelled sake: the falling water itself had turned into it. He carried it home every day and his father grew strong and young again. The Empress visited the falls and named the new era Yōrō, “nourishing the old”.',
      hint: 'High on the bamboo trail, a waterfall smells oddly sweet.',
      words: ['taki', 'noboru', 'tsukareru', 'yasumu', 'issho'],
    },
  ],
  items: [
    { id: 'fk7-tawashi', name: 'Akaname’s Scrubbing Brush', jp: 'あかなめの たわし', kana: 'たわし', emoji: '🧽', desc: 'A palm-fibre scrubbing brush, a little damp. The akaname says it is for “licking without a tongue”.' },
    { id: 'fk7-feather', name: 'White Heron Feather', jp: 'しらさぎの はね', kana: 'しらさぎのはね', emoji: '🪶', desc: 'A long white feather, faintly warm, as if it had been standing in a hot spring.' },
    { id: 'fk7-gourd', name: 'Gourd of Falls Water', jp: 'たきの みずの ひょうたん', kana: 'ひょうたん', emoji: '🍶', desc: 'Water from Yōrō Falls. It smells sweet, and it is meant for someone else.' },
  ],
  tales: [
    {
      id: 'fk7-akaname',
      region: 7,
      title: 'The Tub-Licker',
      jp: 'おけを なめる もの',
      summary: 'Granny Tome’s old bath-house has stood dirty for years, and at night something goes lick, lick, lick at the tub.',
      yokai: 'akaname',
      giver: 'fk7-tome',
      stages: [
        { en: 'Meet whatever is licking the old tub, and tell it what it must not do', jp: 'おけを なめる ものに あって、だめな ことを つたえよう', target: ['fk7-akaname'], map: 'onsen' },
        { en: 'Scrub the old tub clean with word magic (cast あらう or せっけん)', jp: 'ふるい おけに「あらう」か「せっけん」と となえよう', target: ['fk7-tub'], map: 'onsen' },
        { en: 'Give the akaname something better to do', jp: 'あかなめに あたらしい しごとを あげよう', target: ['fk7-akaname'], map: 'onsen' },
      ],
    },
    {
      id: 'fk7-sagi',
      region: 7,
      title: 'The Heron in the Shallows',
      jp: 'あさせの しらさぎ',
      summary: 'The river by the gorge has gone cold, and Kiyo can’t do her washing. A white heron has been standing in the shallows all day.',
      yokai: 'shirasagi',
      giver: 'fk7-kiyo',
      stages: [
        { en: 'Watch the white heron in the shallows. What is it doing?', jp: 'しらさぎを みよう。なにを している？', target: ['fk7-sagi'], map: 'onsen' },
        { en: 'Call the steam out of the stones the heron is watching (cast ゆげ or おんせん)', jp: 'さぎが みている いしに「ゆげ」か「おんせん」と となえよう', target: ['fk7-stones'], map: 'onsen' },
        { en: 'Return to the heron', jp: 'しらさぎの ところへ もどろう', target: ['fk7-sagi'], map: 'onsen' },
      ],
    },
    {
      id: 'fk7-yoro',
      region: 7,
      title: 'The Sweet Waterfall',
      jp: 'あまい たき',
      summary: 'Grandpa Sanpei is too tired to climb the mountain any more. Every day his son Kosuke climbs to Yōrō Falls alone.',
      yokai: 'yoro-no-taki',
      giver: 'fk7-sanpei',
      stages: [
        { en: 'Find Kosuke at Yōrō Falls at the top of the bamboo trail', jp: 'たけの みちの うえ、ようろうの たきで こうすけを さがそう', target: ['fk7-kosuke'], map: 'onsen-trail' },
        { en: 'Speak with the spirit of the falls', jp: 'たきの せいと はなそう', target: ['fk7-falls'], map: 'onsen-trail' },
        { en: 'Bring the falls water to Grandpa Sanpei in the village', jp: 'たきの みずを さんぺいじいさんに とどけよう', target: ['fk7-sanpei'], map: 'onsen' },
      ],
    },
  ],
  entities: {
    onsen: [
      { id: 'fk7-tome', kind: 'npc', sprite: 'villager-b', x: 8, y: 33, dir: 'left', name: TOME, lines: [{ jp: 'むかしは この ゆやも、にぎやか だったのよ。', en: 'This bath-house used to be so lively, once.' }] },
      { id: 'fk7-akaname', kind: 'npc', sprite: 'child', x: 5, y: 33, dir: 'up', name: AKANAME, lines: [{ jp: 'ペロ… ペロ…', en: 'Lick… lick…' }] },
      { id: 'fk7-tub', kind: 'landmark', tile: 'barrel', x: 3, y: 33, name: { jp: 'ふるい おけ', en: 'Old Tub' }, lines: [{ jp: 'ぬるぬるの、ふるい きの おけ。', en: 'A slimy old wooden tub.' }] },
      { id: 'fk7-kiyo', kind: 'npc', sprite: 'villager-b', x: 24, y: 35, dir: 'right', name: KIYO, lines: [{ jp: 'かわの みずが つめたくて、てが いたいわ。', en: 'The river water is so cold my hands hurt.' }] },
      { id: 'fk7-sagi', kind: 'npc', sprite: 'wisp', x: 26, y: 38, dir: 'right', name: SAGI, lines: [{ jp: '……。', en: '(The heron stands perfectly still.)' }] },
      { id: 'fk7-stones', kind: 'landmark', tile: 'rock', x: 24, y: 40, name: { jp: 'かわらの いし', en: 'Riverbank Stones' }, lines: [{ jp: 'すこし あたたかい いし。したで なにかが ねむっている？', en: 'Faintly warm stones. Is something sleeping underneath?' }] },
      { id: 'fk7-sanpei', kind: 'npc', sprite: 'elder', x: 5, y: 22, dir: 'down', name: SANPEI, lines: [{ jp: 'こしが いたくてのう…', en: 'Oh, my aching back…' }] },
    ],
    'onsen-trail': [
      { id: 'fk7-kosuke', kind: 'npc', sprite: 'villager-a', x: 16, y: 5, dir: 'left', name: KOSUKE, lines: [{ jp: 'まいにち ここまで のぼって くるんだ。', en: 'I climb all the way up here every day.' }] },
      { id: 'fk7-falls', kind: 'npc', sprite: 'wisp', x: 11, y: 4, dir: 'down', name: FALLS, lines: [{ jp: '……ざあああ……', en: '……rrrrush……' }] },
    ],
  },
  visible: {
    // The spirit of the falls shows itself only to someone who listened to Kosuke.
    'fk7-falls': (s) => stageOf(s, 'fk7-yoro') >= 1,
  },
  ghost: {
    'fk7-akaname': (s) => stageOf(s, 'fk7-akaname') < 0,
    'fk7-sagi': (s) => stageOf(s, 'fk7-sagi') < 3,
    'fk7-falls': (s) => stageOf(s, 'fk7-yoro') < 3,
    // The old tub is grimy until scrubbed.
    'fk7-tub': (s) => !fl(s, 'fk7.scrubbed'),
  },
  moved: {
    // Grandpa Sanpei, young again, takes himself up the mountain with his son.
    'fk7-sanpei': (s) => (stageOf(s, 'fk7-yoro') >= 3 ? { x: 7, y: 22 } : null),
  },
  talk: {
    // ── The Tub-Licker ────────────────────────────────────────────────
    'fk7-tome': (c) => {
      const st = c.stage('fk7-akaname')
      if (st < 0)
        return offer(c, 'fk7-akaname', [
          c.say('この ふるい ゆや、もう だれも あらわなくなって ねえ…', 'Nobody scrubs this old bath-house any more…'),
          c.say('よるに なると、なにかが おけを ペロペロ なめるのよ。こわくて こわくて。', 'And at night, something licks the tub, slurp, slurp. It frightens me so.'),
          c.fude('おけを なめる… それって、もしかして「あかなめ」！？', 'Something that licks tubs… could it be an akaname?!'),
        ])
      if (st < 3) return [c.say('どう？ なにか いた？', 'Well? Was something there?')]
      return [c.say('ぴかぴかの おふろに、かわいい ゆやばん。また おきゃくさんが くるわ。', 'A sparkling bath and a sweet little bath-keeper. The customers will come back.')]
    },
    'fk7-akaname': (c) => {
      const st = c.stage('fk7-akaname')
      if (st < 0) return [c.narrate('くらがりで、ながい したが ちらっと みえた…', 'In the shadows, a long tongue flickers…')]
      if (st === 0)
        return [
          c.narrate('あかい かおの こどもが、ながい したで おけを なめている。', 'A red-faced child is licking the tub with a very long tongue.'),
          c.say('ペロ… だれ？ …ねえ、ここ、なめても いい？ きたないの、だいすき。', 'Lick… who’s there? …Hey, may I lick this? I love dirty things.'),
          c.choice(
            { jp: 'あかなめに こたえよう', en: 'Answer the akaname.' },
            [
              ['yes', 'はい、なめても いいですよ。', 'Yes, you may lick it.'],
              ['ok', 'いいえ、なめては いけません！', 'No, you must not lick it!'],
              ['bad', 'いいえ、なめりては いけません！', 'No, you must not (wrong form)!'],
            ],
            (id) => {
              if (id === 'yes') return [c.narrate('ペロペロペロ！ あかなめは おおよろこび。とおくで とめばあさんが ひめいを あげた。', 'Slurp-slurp-slurp! The akaname is overjoyed. Far off, Granny Tome shrieks.'), c.fude('だ、だめだよ！ 「〜ては いけません」って いわなきゃ！', 'N-no! We have to say 〜てはいけません!')]
              if (id === 'bad') return [c.say('なめりて…？ へんなの。ペロ。', 'Namerite…? Weird. Lick.'), c.fude('なめる は る-どうし。「る」を とって「て」！ なめて。', 'なめる is a る-verb: drop る, add て. なめて!')]
              return [
                c.say('え… だめなの？ でも、おけが きたない かぎり、ぼくは なめなきゃ いけないんだ…', 'Huh… I can’t? But as long as the tub is dirty, I have to lick it…'),
                c.fude('じゃあ、きれいに しちゃおう！ あらう、で！', 'Then let’s make it clean! With あらう!'),
                ...c.advance('fk7-akaname'),
              ]
            },
          ),
        ]
      if (st === 1) return [c.say('ペロ… まだ きたない…', 'Lick… still dirty…')]
      if (st === 2)
        return [
          c.say('ぴかぴか… もう なめる ところが ない。ぼく、なにを すれば いいの？', 'Spotless… there’s nothing left to lick. What do I do now?'),
          c.ask({ jp: 'あかなめに おしえよう：「いっしょに おふろを ＿＿ も いいよ」', en: 'Tell the akaname: “Issho ni ofuro o ___ mo ii yo.” (You may scrub the bath with us.) Say the て-form of あらう.' }, ['あらって'], (ok) => {
            if (!ok) return [c.say('…？', '…?'), c.fude('あらう は「う」で おわる。う → って！', 'あらう ends in う: う → って!')]
            c.learn('arau')
            c.learn('issho')
            return [
              c.say('いっしょに あらっても いいの！？ やったあ！', 'I may scrub it with you?! Hooray!'),
              c.narrate('あかなめは たわしを もって、ごしごし ごしごし。おけが かがみのように ひかった。', 'The akaname grabs a scrubbing brush: scrub-scrub-scrub. The tub shines like a mirror.'),
              c.say('まあ、なんて かわいい ゆやばん！', 'My, what a sweet little bath-keeper!', TOME, 'villager-b'),
              c.say('これ、ぼくの たわし。したの かわり。ペロ♪', 'Here, my scrubbing brush. Instead of a tongue. Lick♪'),
              ...c.give('fk7-tawashi'),
              ...c.reward(70, 30),
              ...c.advance('fk7-akaname'),
              ...c.seal('akaname'),
              c.say('…むかし、ふでを もった おねえちゃんも ここに きた。ゆげに なまえを かいたら、もじが ぜんぶ とけて、わらってた。', '…Long ago a big sister with a brush came here too. She wrote a name on the steam, every letter melted away, and she just laughed.'),
              c.fude('ゆげに なまえを…？ ことねだ…！', 'A name on the steam…? That was Kotone…!'),
            ]
          }),
        ]
      return [c.say('ごしごし♪ きょうも ぴかぴか！', 'Scrub-scrub♪ Sparkling again today!')]
    },
    'fk7-tub': (c) => {
      if (c.stage('fk7-akaname') !== 1) return null
      return [c.narrate('ぬるぬるの おけ。あらう ことばが いりそうだ。', 'A slimy tub. It needs a washing word.'), c.fude('「あらう」か「せっけん」！', 'あらう or せっけん!')]
    },

    // ── The Heron in the Shallows ─────────────────────────────────────
    'fk7-kiyo': (c) => {
      const st = c.stage('fk7-sagi')
      if (st < 0)
        return offer(c, 'fk7-sagi', [
          c.say('むかしは この かわらに、お湯が わいて いたの。せんたくも らくだった。', 'Hot water used to well up on this riverbank. Washing was easy then.'),
          c.say('でも、やまんばが きてから、お湯が とまって しまった。', 'But since the Yamanba came, the hot water has stopped.'),
          c.say('きょうは ずっと、しろい さぎが あさせに たっているの。ふしぎでしょう？', 'All day today, a white heron has been standing in the shallows. Strange, isn’t it?'),
        ])
      if (st < 3) return [c.say('さぎは まだ いる？', 'Is the heron still there?')]
      return [c.say('お湯が もどった！ あったかい かわで、せんたくが できる。ありがとう。', 'The hot water is back! I can do my washing in a warm river. Thank you.')]
    },
    'fk7-sagi': (c) => {
      const st = c.stage('fk7-sagi')
      if (st < 0) return [c.narrate('しろい さぎが、かたあしで じっと たっている。', 'A white heron stands perfectly still on one leg.')]
      if (st === 0)
        return [
          c.narrate('しろい さぎは うごかない。かぜが ふいても、うごかない。', 'The white heron doesn’t move. Even when the wind blows, it doesn’t move.'),
          c.choice(
            { jp: 'さぎは いま、なにを していますか。', en: 'What is the heron doing right now?' },
            [
              ['ok', 'かたあしで たっています。', 'It is standing on one leg.'],
              ['past', 'かたあしで たちました。', 'It stood on one leg.'],
              ['bad', 'かたあしで たちています。', 'It is standing (wrong form).'],
            ],
            (id) => {
              if (id === 'past') return [c.fude('「たちました」は おわった こと。いま つづいて いるのは…？', '“Tachimashita” is finished. Something still going on is…?')]
              if (id === 'bad') return [c.fude('たつ は「つ」で おわる。つ → って！ たって います。', 'たつ ends in つ: つ → って! たっています.')]
              c.learn('tatsu')
              c.learn('ashi')
              return [
                c.narrate('かたあしで たっている。…ずっと、おなじ ばしょに。', 'Standing on one leg… always in the same spot.'),
                c.narrate('さぎが、くびを すこし まげて、かわらの いしを みた。', 'The heron bends its neck a little and looks at the stones on the bank.'),
                c.fude('あの いしに、なにか ある！', 'There’s something about those stones!'),
                ...c.advance('fk7-sagi'),
              ]
            },
          ),
        ]
      if (st === 1) return [c.narrate('さぎは、かわらの いしを じっと みている。', 'The heron is staring at the riverbank stones.')]
      if (st === 2)
        return [
          c.narrate('さぎの からだが、ふわりと ひかった。', 'The heron’s body begins to glow softly.'),
          c.say('みつけて くれましたね。わたしは この たにの いずみを まもる もの。', 'You found it. I am the one who watches over the springs of this valley.'),
          c.say('ふるい はなしを しましょう。この おんせんは、まえにも とまった ことが あるのです。', 'Let me tell you an old story. This hot spring has stopped once before.'),
          c.ask({ jp: '「この おんせんは、まえにも とまった ＿＿ が ある」', en: '“Kono onsen wa, mae ni mo tomatta ___ ga aru.” (This spring has stopped before, too.) What word goes in the gap?' }, ['こと'], (ok) => {
            if (!ok) return [c.say('〜た ＿＿ が ある。けいけんを はなす ことば です。', '〜ta ___ ga aru. The words for talking about experience.'), c.fude('「〜た ことが ある」だよ！', 'It’s 〜たことがある!')]
            c.learn('onsen')
            return [
              c.say('ええ。その ときも、わたしは しろい とりに なって、ひとびとを ここへ みちびきました。', 'Yes. That time, too, I became a white bird and led the people here.'),
              c.say('いずみは なんどでも わく。わすれずに、さがす ものが いる かぎり。', 'A spring will well up again and again — as long as someone remembers to look for it.'),
              ...c.give('fk7-feather'),
              ...c.reward(70, 30),
              ...c.advance('fk7-sagi'),
              ...c.seal('shirasagi'),
              c.say('…ふでの むすめも、ここで ゆげを ながめて いました。「あったかいのと つめたいの、その あいだの いき」と いって。', '…The girl with the brush once watched the steam here too. “The breath between hot and cold,” she called it.'),
            ]
          }),
        ]
      return [c.narrate('しろい はねが、ゆげの 中で きらりと ひかった。', 'A white feather glints in the steam.')]
    },
    'fk7-stones': (c) => {
      if (c.stage('fk7-sagi') !== 1) return null
      return [c.narrate('いしは ほんのり あたたかい。したで なにかが ねむっている。', 'The stones are faintly warm. Something is sleeping underneath.'), c.fude('ゆげを よびだそう！「ゆげ」か「おんせん」！', 'Let’s call the steam out! ゆげ or おんせん!')]
    },

    // ── The Sweet Waterfall ───────────────────────────────────────────
    'fk7-sanpei': (c) => {
      const st = c.stage('fk7-yoro')
      if (st < 0)
        return offer(c, 'fk7-yoro', [
          c.say('わしは もう つかれて、やまに のぼれん。こしも いたい。', 'I’m too tired to climb the mountain any more. And my back hurts.'),
          c.say('むすこの こうすけが、まいにち ひとりで たきまで のぼって いく。…しんぱいでのう。', 'My son Kosuke climbs to the falls on his own every day. …I worry about him.'),
          c.say('ようすを みて きて くれんか。', 'Would you go and see how he is?'),
        ])
      if (st < 2) return [c.say('こうすけは げんきかのう…', 'I wonder if Kosuke is all right…')]
      if (st === 2) {
        if (!c.has('fk7-gourd')) return [c.say('…？', '…?')]
        c.take('fk7-gourd')
        c.sparkle('spark')
        return [
          c.narrate('ひょうたんを わたした。じいさんは ひとくち のんだ。', 'You hand over the gourd. The old man takes a sip.'),
          c.say('…あまい！ からだが、ぽかぽか して きた！', '…Sweet! My whole body is warming up!'),
          c.narrate('まがって いた こしが、しゃんと のびた。', 'His bent back straightens right up.'),
          c.say('これなら、あした、わしも たきまで のぼっても いいかのう？', 'At this rate, might I climb to the falls myself tomorrow?'),
          c.choice(
            { jp: 'さんぺいじいさんに こたえよう', en: 'Answer Grandpa Sanpei.' },
            [
              ['bad', 'はい、のぼりても いいですよ。', 'Yes, you may (wrong form).'],
              ['ok', 'はい、のぼっても いいですよ。', 'Yes, you may climb.'],
              ['bad2', 'はい、のぼっては いいですよ。', 'Yes, you (mixed-up form).'],
            ],
            (id) => {
              if (id === 'bad') return [c.say('のぼりて…？', 'Noborite…?'), c.fude('のぼる → のぼって。う・つ・る は「って」！', 'のぼる → のぼって. う, つ and る make って!')]
              if (id === 'bad2') return [c.say('いいのか、だめなのか、どっちじゃ？', 'Is it yes or no, then?'), c.fude('いい ときは「〜ても いい」。「〜ては」は「いけません」と いっしょ！', 'Yes is 〜てもいい. 〜ては goes with いけません!')]
              c.learn('noboru')
              return [
                c.say('よし！ あしたは こうすけと いっしょに のぼるぞ！', 'Right! Tomorrow I’ll climb with Kosuke!'),
                c.narrate('とおくで、たきの おとが ひびいた。わらって いる ように。', 'Far off, the roar of the falls echoes, almost as if it were laughing.'),
                ...c.reward(70, 30),
                ...c.advance('fk7-yoro'),
                ...c.seal('yoro-no-taki'),
                c.say('…そう いえば、わしの じいさまが いうて おった。むかし、ふでを もった むすめが、たきの きりに なにか かいて いた、と。', '…Come to think of it, my grandfather used to say a girl with a brush once wrote something on the mist of the falls.'),
              ]
            },
          ),
        ]
      }
      return [c.say('きょうも こうすけと たきまで のぼった！ わはは、わかがえったわい！', 'Climbed to the falls with Kosuke again today! Hah, I feel young again!')]
    },
    'fk7-kosuke': (c) => {
      const st = c.stage('fk7-yoro')
      if (st < 0) return null
      if (st === 0)
        return [
          c.say('ちちが たのんだの？ …じつは、きのう ふしぎな ことが あったんだ。', 'Did Father send you? …Actually, something strange happened yesterday.'),
          c.choice(
            { jp: 'こうすけの はなしを ただしく つなげよう', en: 'Link Kosuke’s story together correctly.' },
            [
              ['ok', 'たきまで のぼって、いわで すべって、あまい においが した。', 'I climbed to the falls, slipped on a rock, and smelled something sweet.'],
              ['masu', 'たきまで のぼります、すべります、あまい においが した。', '(Every verb in its own ます form, no て.)'],
              ['bad', 'たきまで のぼりて、すべりて、あまい においが した。', '(Wrong て-forms.)'],
            ],
            (id) => {
              if (id === 'masu') return [c.say('ぶつぶつ きれて、よく わからないよ。', 'It’s all chopped up. I can’t follow it.'), c.fude('つなげる ときは「〜て、〜て」！ さいごだけ じかんが わかる かたち。', 'To link actions: 〜て, 〜て! Only the last verb shows the time.')]
              if (id === 'bad') return [c.say('のぼりて？ すべりて？', 'Noborite? Suberite?'), c.fude('のぼる・すべる は う-どうし。「って」だよ！', 'のぼる and すべる are う-verbs: って!')]
              c.learn('noboru')
              c.learn('taki')
              return [
                c.say('そう！ たきまで のぼって、すべって、そしたら… たきの みずが、あまい においが したんだ。', 'Yes! I climbed to the falls, slipped, and then… the falls smelled sweet.'),
                c.say('ちちに のませて あげたい。でも、きょうは なにも におわない…', 'I want Father to drink it. But today I can’t smell anything…'),
                c.fude('たきに きいて みよう！ たきの まえで、はなしかけて みて。', 'Let’s ask the falls! Talk to it, right there by the water.'),
                ...c.advance('fk7-yoro'),
              ]
            },
          ),
        ]
      if (st === 1) return [c.say('たきの まえに、なにか いる…！', 'There’s something in front of the falls…!')]
      return [c.say('ちちと いっしょに のぼるのが、たのしみだ！', 'I can’t wait to climb with Father!')]
    },
    'fk7-falls': (c) => {
      const st = c.stage('fk7-yoro')
      if (st !== 1) return st >= 2 ? [c.say('……ざあああ……♪', '……rrrrush……♪')] : null
      return [
        c.say('おやを おもう こが いる。だから たきの みずは、あまく なった。', 'Here is a child who thinks of his father. That is why my water turned sweet.'),
        c.say('でも、あまい みずには きまりが ある。じゅんばんを まちがえては いけない。', 'But sweet water has a rule. The order must not be mistaken.'),
        c.choice(
          { jp: 'こうすけに かわって こたえよう。たきの せい「この みずを どう する？」', en: 'Answer for Kosuke. Spirit of the Falls: “What will you do with this water?”' },
          [
            ['self', 'じぶんで のんでから、ちちに あげます。', 'I’ll drink it myself, then give it to my father.'],
            ['ok', 'ちちに あげてから、じぶんで のみます。', 'I’ll give it to my father first, then drink some myself.'],
          ],
          (id) => {
            if (id === 'self') return [c.say('……。', '……'), c.narrate('たきの おとが、すこし つめたく なった。', 'The roar of the falls turns a little cold.'), c.fude('「〜てから」の まえが さき！ だれに さきに あげる？', 'What comes before てから happens first! Who gets it first?')]
            c.learn('nomu')
            c.sparkle('ripple')
            return [
              c.say('よろしい。この みずは、おやを おもう こころの ために。', 'Good. This water is for a heart that thinks of its parent.', FALLS, 'wisp'),
              c.narrate('たきの しぶきが、ひょうたんに すいこまれた。あまい においが する。', 'The spray of the falls swirls into a gourd. It smells sweet.'),
              c.say('ありがとう！ はやく ちちに とどけて！', 'Thank you! Please hurry it to Father!', KOSUKE, 'villager-a'),
              ...c.give('fk7-gourd'),
              ...c.advance('fk7-yoro'),
            ]
          },
        ),
      ]
    },
  },
  cast: {
    'fk7-tub': (c, k) => {
      if (k === 'あらう' || k === 'せっけん') {
        c.learn(k === 'あらう' ? 'arau' : 'sekken')
        c.sparkle('ripple')
        if (c.stage('fk7-akaname') !== 1) return [c.narrate('おけが すこし きれいに なった。', 'The tub gets a little cleaner.')]
        c.set('fk7.scrubbed')
        c.sfx('correct')
        return [
          c.narrate(`「${k}」！ あわが もこもこ… ごしごし、ざぶーん！`, `“${k === 'あらう' ? 'Arau' : 'Sekken'}”! Bubbles foam up… scrub, scrub, sploosh!`),
          c.narrate('ふるい おけが、ぴかぴかに なった。', 'The old tub is sparkling clean.'),
          c.say('あ… なめる ところが、なくなっちゃった…', 'Oh… there’s nothing left to lick…', AKANAME, 'child'),
          ...c.advance('fk7-akaname'),
        ]
      }
      if (k === 'おゆ') return (c.learn('oyu'), [c.narrate('おけに お湯を はった。…でも、まだ ぬるぬる。', 'You fill the tub with hot water. …Still slimy, though.'), c.fude('まず あらって から！', 'Wash it first!')])
      return null
    },
    'fk7-akaname': (c, k) => {
      if (k === 'あらう') return (c.learn('arau'), [c.say('あらう？ …ぼくの したで？', 'Wash? …With my tongue?')])
      if (k === 'いっしょに') return (c.learn('issho'), [c.say('いっしょ… いいね。ずっと ひとりで なめてたから。', 'Together… that sounds nice. I’ve always licked alone.')])
      return null
    },
    'fk7-stones': (c, k) => {
      if (k === 'ゆげ' || k === 'おんせん') {
        c.learn(k === 'ゆげ' ? 'yuge' : 'onsen')
        c.sparkle('ripple')
        if (c.stage('fk7-sagi') !== 1) return [c.narrate('いしの すきまから、ゆげが ゆらりと たった。', 'A wisp of steam curls up between the stones.')]
        c.sfx('correct')
        return [
          c.narrate(`「${k}」！ いしの すきまから、しろい ゆげが ふきだした！`, `“${k === 'ゆげ' ? 'Yuge' : 'Onsen'}”! White steam bursts from between the stones!`),
          c.narrate('こぽこぽ… あたたかい お湯が わいて、あさせに ながれて いく。', 'Blub, blub… warm water wells up and flows out into the shallows.'),
          c.say('お湯！ お湯が もどった！', 'Hot water! The hot water is back!', KIYO, 'villager-b'),
          ...c.advance('fk7-sagi'),
        ]
      }
      if (k === 'あたたかい') return (c.learn('atatakai'), [c.narrate('いしが ほかほかに なった。…でも、お湯は まだ でない。', 'The stones get toasty. …But no water comes yet.')])
      return null
    },
    'fk7-sagi': (c, k) => {
      if (k === 'たつ') return (c.learn('tatsu'), [c.narrate('さぎは かたあしで たった まま、すこし うなずいた。', 'Still standing on one leg, the heron nods slightly.')])
      if (k === 'とり') return (c.learn('tori'), [c.narrate('さぎは とりの ような、とりで ない ような めで、あなたを みた。', 'The heron looks at you with eyes that are bird-like… and not quite a bird’s.')])
      return null
    },
    'fk7-sanpei': (c, k) => {
      if (k === 'やすむ') return (c.learn('yasumu'), [c.say('そうじゃな。すこし やすもう。', 'You’re right. I’ll rest a bit.')])
      if (k === 'つかれる') return (c.learn('tsukareru'), [c.say('つかれた、つかれた。としは とりたく ないのう。', 'Tired, so tired. Getting old is no fun.')])
      return null
    },
  },
}

export const CONTENT: TaleContent[] = [ONSEN_TALES, ONSEN_FOLK]

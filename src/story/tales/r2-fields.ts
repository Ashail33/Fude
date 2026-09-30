/**
 * Region 2 — the Elemental Fields. Three tales about the pieces things are
 * made of: gather the Radical Golem's lost pieces (日, 木, 口) with a little
 * pebble spirit, work the weather (くも → あめ → かぜ) for a thirsty farm,
 * and play hide-and-seek where every hider gives itself away to a word.
 */
import { bossOf } from '../../data/regions'
import { isPassed, type PlayerState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import { offer } from './r1-village'
import type { Ctx, TaleContent } from './types'

const KORO = { jp: 'コロ', en: 'Koro' }
const KONKO = { jp: 'コンコ', en: 'Konko' }
const FARMHAND = { jp: 'はたけの ひと', en: 'Farmhand' }

const fl = (s: PlayerState, k: string) => s.flags?.[k] ?? 0
const stageOf = (s: PlayerState, tale: string) => s.flags?.[`tale.${tale}`] ?? -1

/** The golem's three lost pieces. */
const PIECES = ['piece-sun', 'piece-tree', 'piece-mouth'] as const
const piecesFound = (c: Ctx) => PIECES.filter((p) => c.flag(`got.${p}`) > 0).length

/** Hand over one of the golem's pieces; the third one moves the tale on. */
function gotPiece(c: Ctx, id: (typeof PIECES)[number]): Step[] {
  c.set(`got.${id}`)
  const out: Step[] = [...c.give(id)]
  const n = piecesFound(c)
  if (n >= 3 && c.stage('golem-pieces') === 0) out.push(c.fude('3つ ぜんぶ そろった！ コロの ところへ もどろう！', 'All three pieces! Let’s take them back to Koro!'), ...c.advance('golem-pieces'))
  else out.push(c.fude(`かけらは あと ${3 - n}つ！`, `${3 - n} piece${3 - n === 1 ? '' : 's'} to go!`))
  return out
}

/** Hide-and-seek: the three hiders and who pops out of them. */
const HIDERS = ['f-hide-bush', 'f-hide-rock', 'f-hide-barrel'] as const
const hidersFound = (c: Ctx) => HIDERS.filter((h) => c.flag(`found.${h}`) > 0).length

function found(c: Ctx, id: (typeof HIDERS)[number], reveal: Step[]): Step[] {
  if (c.stage('hide-seek') < 0) return [c.narrate('「まだ だめ！ かくれんぼ、はじまって ないよ！」', '“Not yet! The game hasn’t even started!”'), c.fude('…あの子に はなしかけて みよう。', '…Maybe we should talk to that kid first.')]
  if (c.stage('hide-seek') > 0) return reveal
  c.set(`found.${id}`)
  c.sfx('correct')
  const n = hidersFound(c)
  const out = [...reveal, c.narrate('「みーつけた！」', '“Found you!”')]
  if (n >= 3) out.push(c.fude('ぜんいん みつけた！ あの子に しらせよう！', 'That’s everyone! Let’s tell the kid!'), ...c.advance('hide-seek'))
  else out.push(c.fude(`あと ${3 - n}人！`, `${3 - n} more to find!`))
  return out
}

/** A one-time small reward for discovering a word reaction. */
function firstTime(c: Ctx, key: string, xp = 10, shards = 5): Step[] {
  if (c.flag(`cast.${key}`)) return []
  c.set(`cast.${key}`)
  return c.reward(xp, shards)
}

export const FIELDS_TALES: TaleContent = {
  items: [
    { id: 'piece-sun', name: 'Sun Piece', jp: '日の かけら', kana: 'ひのかけら', emoji: '☀️', desc: 'A warm stone chip shaped like 日. It hums like a sunny afternoon.' },
    { id: 'piece-tree', name: 'Tree Piece', jp: '木の かけら', kana: 'きのかけら', emoji: '🌳', desc: 'A chip shaped like 木. It still thinks it might grow up to be a real tree.' },
    { id: 'piece-mouth', name: 'Mouth Piece', jp: '口の かけら', kana: 'くちのかけら', emoji: '👄', desc: 'A square chip shaped like 口. Now and then it mumbles.' },
    { id: 'radical-stone', name: 'Radical Stone', jp: 'ぶしゅの いし', kana: 'ぶしゅのいし', emoji: '🪨', desc: 'Koro’s gift. Turn it in the light and you can see 木, 日 and 口 inside.' },
    { id: 'daikon', name: 'Giant Daikon', jp: 'だいこん', kana: 'だいこん', emoji: '🥕', desc: 'The biggest radish ever grown in the Fields. Rain-fed, wind-dried, magic-made.' },
    { id: 'grass-whistle', name: 'Grass Whistle', jp: 'くさぶえ', kana: 'くさぶえ', emoji: '🌿', desc: 'A blade of grass that whistles “ぴー！”. Proof you’re the hide-and-seek champion.' },
  ],
  tales: [
    {
      id: 'golem-pieces',
      region: 2,
      main: true,
      title: 'The Golem’s Lost Pieces',
      jp: 'ゴーレムの かけら',
      summary: 'A pebble spirit says the Radical Golem forgot what it is — three of its pieces flew off across the Fields.',
      giver: 'f-koro',
      stages: [
        { en: 'Find the golem’s lost pieces: 日 (a shady sundial), 木 (the veggie patch) and 口 (someone very chatty)', jp: 'ゴーレムの かけら「日・木・口」を さがそう', target: ['f-sundial', 'f-sapling', 'f-kitsune'], map: 'fields' },
        { en: 'Bring the three pieces back to Koro by the Great Boulder', jp: 'かけらを 大岩の そばの コロに とどけよう', target: ['f-koro'], map: 'fields' },
        { en: 'Split the Radical Golem on the east road, then tell Koro', jp: 'ひがしの みちの ゴーレムを たおして、コロに しらせよう', target: ['f-golem', 'f-koro'], map: 'fields' },
      ],
    },
    {
      id: 'rain-crops',
      region: 2,
      title: 'Clouds, Rain and Wind',
      jp: 'くもと あめと かぜ',
      summary: 'Not a drop of rain in weeks: the farmhand’s crops are wilting.',
      giver: 'f-farmhand',
      stages: [
        { en: 'Bring rain to the wilted crops in the veggie patch (rain comes from clouds…)', jp: 'はたけの やさいに あめを ふらせよう（あめは くもから…）', target: ['f-crops'], map: 'fields' },
        { en: 'The rain won’t stop! Blow the cloud away from the crops', jp: 'あめが やまない！ くもを ふきとばそう', target: ['f-crops'], map: 'fields' },
        { en: 'Tell the farmhand the crops are saved', jp: 'はたけの ひとに ほうこくしよう', target: ['f-farmhand'], map: 'fields' },
      ],
    },
    {
      id: 'hide-seek',
      region: 2,
      title: 'Hide-and-Seek',
      jp: 'かくれんぼ',
      summary: 'The kid’s friends are hiding somewhere in the Fields. Nobody has ever found Kota.',
      giver: 'f-child',
      stages: [
        { en: 'Find the hiders: Sora hides somewhere leafy, Mei somewhere wet, Kota pretends to be big and heavy', jp: 'かくれている 3人を さがそう（はっぱ・みず・おもくて 大きい もの）', map: 'fields' },
        { en: 'Tell the kid you found everyone', jp: 'こどもに ほうこくしよう', target: ['f-child'], map: 'fields' },
      ],
    },
  ],
  entities: {
    fields: [
      { id: 'f-koro', kind: 'npc', sprite: 'wisp', x: 34, y: 12, dir: 'left', name: KORO, lines: [{ jp: 'ころころ…', en: 'Roll, roll…' }] },
      { id: 'f-sundial', kind: 'landmark', tile: 'tablet', x: 18, y: 8, name: { jp: 'ひどけい', en: 'Sundial' }, lines: [{ jp: 'ひどけいだ。かげが ながくて、じかんが よめない。', en: 'A sundial. Its shadow is so long you can’t read the time.' }] },
      { id: 'f-sapling', kind: 'landmark', tile: 'bush', x: 4, y: 20, name: { jp: 'ふしぎな なえぎ', en: 'Odd Sapling' }, lines: [{ jp: 'にんじんの あいだに、へんな なえぎが はえている。', en: 'An odd sapling is growing between the carrots.' }] },
      { id: 'f-kitsune', kind: 'npc', sprite: 'kitsune', x: 24, y: 12, dir: 'down', name: KONKO, lines: [{ jp: 'コンコン！ きいて きいて！ きょうは ね…', en: 'Kon kon! Listen, listen! So today…' }] },
      { id: 'f-crops', kind: 'landmark', tile: 'bush', x: 9, y: 26, name: { jp: 'しおれた やさい', en: 'Wilted Crops' }, lines: [{ jp: 'やさいが ぐったり している。', en: 'The vegetables are drooping.' }] },
      { id: 'f-hide-bush', kind: 'landmark', tile: 'bush', x: 27, y: 17, name: { jp: 'くさむら', en: 'Bush' }, lines: [{ jp: 'ふつうの くさむら…かな？', en: 'An ordinary bush… probably?' }] },
      { id: 'f-hide-rock', kind: 'landmark', tile: 'boulder', x: 38, y: 2, name: { jp: 'へんな いわ', en: 'Odd Rock' }, lines: [{ jp: 'まるい いわだ。…すこし あたたかい？', en: 'A round rock. …Is it warm?' }] },
      { id: 'f-hide-barrel', kind: 'landmark', tile: 'barrel', x: 3, y: 15, name: { jp: 'つけものの たる', en: 'Pickle Barrel' }, lines: [{ jp: 'つけものの においが する。', en: 'It smells of pickles.' }] },
      { id: 'f-kid-sora', kind: 'npc', sprite: 'child', x: 18, y: 14, dir: 'down', name: { jp: 'そら', en: 'Sora' }, lines: [{ jp: 'つぎは かわの 中に かくれるよ！', en: 'Next time I’ll hide in the river!' }] },
      { id: 'f-kid-mei', kind: 'npc', sprite: 'child', x: 17, y: 14, dir: 'right', name: { jp: 'めい', en: 'Mei' }, lines: [{ jp: 'まだ つけものの においが する…', en: 'I still smell like pickles…' }] },
      { id: 'f-kota', kind: 'npc', sprite: 'tanuki', x: 19, y: 13, dir: 'down', name: { jp: 'コタ', en: 'Kota' }, lines: [{ jp: 'ぽこ。', en: 'Poko.' }] },
    ],
  },
  visible: {
    'f-sapling': (s) => !fl(s, 'got.piece-tree'),
    'f-hide-bush': (s) => !fl(s, 'found.f-hide-bush'),
    'f-hide-rock': (s) => !fl(s, 'found.f-hide-rock'),
    'f-hide-barrel': (s) => !fl(s, 'found.f-hide-barrel'),
    'f-kid-sora': (s) => fl(s, 'found.f-hide-bush') > 0,
    'f-kid-mei': (s) => fl(s, 'found.f-hide-barrel') > 0,
    'f-kota': (s) => fl(s, 'found.f-hide-rock') > 0,
  },
  ghost: {
    // Koro is only a flicker of a spirit until the golem is whole again.
    'f-koro': (s) => stageOf(s, 'golem-pieces') < 3,
    'f-crops': (s) => stageOf(s, 'rain-crops') < 1,
  },
  talk: {
    'f-koro': (c) => {
      const st = c.stage('golem-pieces')
      if (st < 0)
        return offer(
          c,
          'golem-pieces',
          [
            c.narrate('大岩の かげで、ちいさな いしの せいれいが ころころ ころがっている。', 'In the Great Boulder’s shadow, a tiny stone spirit is rolling back and forth.'),
            c.say('ころころ… ぼく、コロ。ゴーレムの からだから おちちゃったの。', 'Roll, roll… I’m Koro. I fell off the golem.'),
            c.say('ゴーレムが おこって あばれたとき、かけらが 3つ とんでいった。日と、木と、口。', 'When it got angry and thrashed about, three pieces flew away: 日, 木 and 口.'),
            c.say('かけらが ないから、ゴーレムは じぶんが なにか わからないんだ…', 'Without them, it can’t remember what it is…'),
            c.fude('だから「わたしは なに？」って いってたんだ！', 'So that’s why it keeps asking “what am I?”!'),
          ],
          ['さがして くる！', 'We’ll find them!'],
        )
      if (st === 0) {
        const left: [string, string][] = []
        if (!c.flag('got.piece-sun')) left.push(['日は ひかげの ひどけいに…', '日 is stuck in a shady sundial…'])
        if (!c.flag('got.piece-tree')) left.push(['木は やさいばたけに ねを はった…', '木 took root in the veggie patch…'])
        if (!c.flag('got.piece-mouth')) left.push(['口は… だれかが ひろって、しゃべりつづけてる…', '口… someone picked it up and hasn’t stopped talking since…'])
        return [c.say(`かけらは あと ${left.length}つ。`, `${left.length} piece${left.length === 1 ? '' : 's'} left.`), ...left.map(([jp, en]) => c.say(jp, en))]
      }
      if (st === 1)
        return [
          c.say('ぼくの なかまだ！ ころころ♪', 'My friends! Roll, roll♪'),
          c.say('でも、ゴーレムに かえす まえに… ぶしゅの ちからを ためさせて。', 'But before they go back to the golem… let me test your radical power.'),
          c.choice({ jp: '木 と 木 が ならぶと…？', en: 'Put 木 next to 木 and you get…?' }, [['hayashi', '林（はやし）', 'grove'], ['yama', '山（やま）', 'mountain'], ['kawa', '川（かわ）', 'river']], (id) => {
            if (id !== 'hayashi') return [c.say('ころ…？ ちがうよ〜。木が 2ほん だよ！', 'Roll…? Nope! It’s two trees side by side!'), c.fude('もう いちど はなしかけて みよう。', 'Let’s talk to Koro again and retry.')]
            c.learn('hayashi')
            c.sfx('correct')
            return [
              c.say('せいかい！ 林！ じゃあ…', 'Right! 林, a grove! Then…'),
              c.ask({ jp: '木が 3ぼんで「森」。よみを となえて！', en: 'Three trees make 森. Chant its reading!' }, 'もり', (ok) => {
                if (!ok) return [c.say('おしい！ ヒント：も… で はじまるよ。', 'So close! Hint: it starts with も…'), c.fude('また はなしかけよう。', 'Talk to Koro to try again.')]
                c.learn('mori')
                c.sparkle('spark')
                for (const p of PIECES) c.take(p)
                return [
                  c.say('もり！ だいせいかい！', 'もり! Perfect!'),
                  c.narrate('3つの かけらが ひかって、ひがしの みちへ とんでいった。', 'The three pieces glow and fly off toward the east road.'),
                  c.say('ゴーレムは おもいだしかけてる。さいごは、きみが ゴーレムを ただしく わけて あげて！', 'The golem is starting to remember. Now split it into the right kanji and set it free!'),
                  ...c.reward(40, 15),
                  ...c.advance('golem-pieces'),
                ]
              }),
            ]
          }),
        ]
      if (st === 2) {
        if (!isPassed(c.s(), bossOf(2).id)) return [c.say('ゴゴゴ… ここまで きこえる。ゴーレムは ひがしの みちに いるよ。', 'Rumble… you can hear it from here. The golem is on the east road.'), c.fude('ぶしゅに わけて あげよう！', 'Let’s split it into its radicals!')]
        c.sparkle('spark')
        return [
          c.say('きこえた？ ゴーレムが わらったよ！「わたしは 森。林。木」って！', 'Did you hear? The golem laughed! “I am forest. Grove. Tree,” it said!'),
          c.narrate('コロの からだが、はっきり みえるように なった。', 'Koro’s little body grows solid and clear.'),
          c.say('ぼくも もう、ただの いしじゃ ない。これ、おれいに あげる！', 'I’m not just a pebble anymore. Here, a thank-you gift!'),
          ...c.give('radical-stone'),
          ...c.bagItem('ether', 2),
          ...c.reward(80, 30),
          ...c.advance('golem-pieces'),
          c.fude('木、林、森。かんじは ぶひんで できてるんだね！', '木, 林, 森. Kanji really are built from pieces!'),
        ]
      }
      return [c.say('ゴーレムと いっしょに さんぽ してるんだ。ころころ♪', 'The golem and I go for walks now. Roll, roll♪')]
    },
    'f-sundial': (c) => {
      if (c.stage('golem-pieces') === 0 && !c.flag('got.piece-sun'))
        return [
          c.narrate('ひどけいの まんなかに、日の かたちの かけらが はまっている。でも つめたくて くらい。', 'A chip shaped like 日 is stuck in the sundial’s face — but it’s cold and dim.'),
          c.fude('日は おひさま。ここは かげだから、げんきが ないんだ。「ひかり」を あげよう！', '日 is the sun. It’s sulking in the shade — let’s give it light: ひかり!'),
        ]
      return null
    },
    'f-sapling': (c) => {
      if (c.stage('golem-pieces') === 0)
        return [
          c.narrate('なえぎの はっぱが「木」の かたちを している。…くねくね うごいた！', 'The sapling’s leaves are shaped like 木. …It just wiggled!'),
          c.fude('じぶんを ほんものの 木だと おもってるんだ。なまえで よんで あげよう！', 'It thinks it’s a real tree! Let’s call it by its name!'),
        ]
      return null
    },
    'f-kitsune': (c) => {
      const st = c.stage('golem-pieces')
      if (c.flag('got.piece-mouth')) return [c.say('…コン。', '…Kon.'), c.narrate('コンコは しずかに しっぽを ふっている。…すこし ほっと した かおだ。', 'Konko quietly swishes her tail. She looks a little relieved, honestly.')]
      if (st !== 0) return null
      return [
        c.say('コンコン！ あのね、この しかくい いし ひろったら、くちが とまらなく なったの！', 'Kon kon! So I picked up this square stone and now my mouth won’t stop!'),
        c.say('あさごはんの こと、くもの かたちの こと、となりの いぬの こと…', 'About breakfast, about cloud shapes, about the dog next door…'),
        c.fude('口の かけらだ！ かえして もらえる？', 'That’s the 口 piece! Could we have it back?'),
        c.say('いいよ！ でも なぞなぞに こたえられたらね！', 'Sure! If you can answer my riddle!'),
        c.ask({ jp: '口は あるけど しゃべらない。山から うみへ はしっていく。なあに？', en: 'It has a mouth but never talks. It runs from the mountains to the sea. What is it?' }, ['かわ', '川'], (ok) => {
          if (!ok) return [c.say('ぶっぶー！ ヒント：みずが ながれるよ。', 'Bzzt! Hint: water flows along it.'), c.fude('また はなしかけよう。', 'Let’s ask her again.')]
          c.learn('kawa')
          c.sparkle('spark')
          return [
            c.say('せいかい！「川」の 口は「かわぐち」って いうのよ！ それから…', 'Correct! A river’s mouth is called kawaguchi! And another thing…'),
            c.narrate('しかくい いしが コンコの 口から ぽろっと おちた。', 'The square stone pops out of Konko’s mouth.'),
            c.say('…コン。', '…Kon.'),
            ...gotPiece(c, 'piece-mouth'),
          ]
        }),
      ]
    },
    'f-farmhand': (c) => {
      const st = c.stage('rain-crops')
      if (st < 0)
        return offer(c, 'rain-crops', [
          c.say('はあ… もう なんしゅうかんも あめが ふらないんだ。', 'Sigh… it hasn’t rained in weeks.'),
          c.say('やさいばたけが ぐったりだよ。まほうつかいなら、てんきを よべるって きいたけど…', 'The veggie patch is wilting. I hear word mages can call the weather…'),
        ])
      if (st === 0) return [c.say('やさいばたけは この さくの 中だよ。たのむ！', 'The veggie patch is inside this fence. Please!')]
      if (st === 1) return [c.say('わわっ、ふりすぎ ふりすぎ！ たんぼが あふれちゃう！', 'Whoa, too much, too much! The paddies are overflowing!'), c.fude('くもを ふきとばす ことばは…？', 'What word blows a cloud away…?')]
      if (st === 2)
        return [
          c.say('みて！ にじだ！ やさいが みんな げんきに なった！', 'Look — a rainbow! The vegetables are all perking up!'),
          c.say('これ、はたけで いちばん 大きい だいこん。もって いって！', 'Here, the biggest daikon in the whole field. Take it!'),
          ...c.give('daikon'),
          ...c.bagItem('herb', 3),
          ...c.reward(50, 20),
          ...c.advance('rain-crops'),
          c.fude('くも、あめ、かぜ。てんきも ことばで かわるんだね！', 'Cloud, rain, wind. Even the weather listens to words!'),
        ]
      return null
    },
    'f-crops': (c) => {
      const st = c.stage('rain-crops')
      if (st === 0) return [c.narrate('つちが からからに かわいている。', 'The soil is bone dry.'), c.fude(c.flag('rain.cloud') ? 'くもが きた！ こんどは あめを！' : 'あめを よぶ まえに… そらに なにが ひつようかな？', c.flag('rain.cloud') ? 'A cloud! Now call the rain!' : 'Before rain… what does the sky need first?')]
      if (st === 1) return [c.narrate('ざあざあ ぶり。くもは ここが きにいった みたいだ。', 'It’s pouring. The cloud seems to like it here.')]
      if (st >= 2) return [c.narrate('やさいが ぴんと たっている。', 'The vegetables stand tall and proud.')]
      return null
    },
    'f-child': (c) => {
      const st = c.stage('hide-seek')
      if (st < 0)
        return offer(
          c,
          'hide-seek',
          [
            c.say('ねえ、かくれんぼ しよう！ ぼくの ともだちが 3人 かくれてるの。', 'Hey, let’s play hide-and-seek! Three of my friends are hiding.'),
            c.say('そらは はっぱの ところ。めいは みずの ところ。コタは… 大きくて おもい ものの ふり。', 'Sora likes leafy places. Mei likes wet places. Kota… pretends to be something big and heavy.'),
            c.say('でもね、コタは まだ だれにも みつかった ことが ないんだ！', 'But nobody has ever found Kota!'),
          ],
          ['あそぶ！', 'Let’s play!'],
        )
      if (st === 0) return [c.say(`あと ${3 - hidersFound(c)}人！ みつけたら ことばで よびだしてね！`, `${3 - hidersFound(c)} left! When you spot one, call them out with a word!`)]
      if (st === 1)
        return [
          c.say('すごい！ ぜんいん みつけたの！？ コタまで！', 'Wow! You found everyone?! Even Kota!'),
          c.say('…え？ コタって たぬき だったの！？', '…Wait. Kota is a TANUKI?!'),
          c.say('ぽこ。', 'Poko.', { jp: 'コタ', en: 'Kota' }, 'tanuki'),
          c.say('ま、いっか！ チャンピオンの しるしに、くさぶえを あげる！', 'Oh well! Here, a grass whistle — the champion’s prize!'),
          ...c.give('grass-whistle'),
          ...c.bagItem('smoke', 2),
          ...c.reward(45, 15),
          ...c.advance('hide-seek'),
        ]
      if (st >= 2) return [c.say('つぎは ぼくが おにね！ …コタ、どこ？', 'I’m “it” next time! …Kota? Where’d you go?')]
      return null
    },
    'f-hide-bush': (c) => (c.stage('hide-seek') === 0 ? [c.narrate('くさむらが… くすくす わらった。', 'The bush… giggles.'), c.fude('はっぱを ふきとばせば…？', 'If we blew the leaves away…?')] : null),
    'f-hide-rock': (c) =>
      c.stage('hide-seek') === 0
        ? [c.narrate('まるい いわ。…しましまの しっぽが はみでている。', 'A round rock. …A fluffy striped tail is sticking out.'), c.fude('なにの ふりを してるか、いって あげよう！', 'Tell it what it’s pretending to be!')]
        : null,
    'f-hide-barrel': (c) =>
      c.stage('hide-seek') === 0 ? [c.narrate('たるの 中から「しーっ！」と きこえた。', 'A voice from inside the barrel: “Shh!”'), c.fude('つめたい ものを いれたら、でて くるかも…', 'Something cold might bring them out…')] : null,
    'f-kota': (c) => (c.stage('hide-seek') >= 1 ? [c.say('ぽこ。…ひるねの じゃまを したな。', 'Poko. …You interrupted my nap.')] : null),
  },
  cast: {
    'f-koro': (c, k) => {
      if (k === 'いし' || k === 'いわ') {
        c.learn(k === 'いし' ? 'ishi' : 'iwa')
        c.sparkle('dust')
        return [c.say('ころっ！ よんだ？ ぼく いし だよ。ちいさいけど！', 'Roll! You called? Yep, I’m a stone. A small one!')]
      }
      if (k === 'ちいさい') {
        c.learn('chii')
        return [c.say('ちいさくても、ぼくは ゴーレムの だいじな ぶひん なんだ！', 'Small, but I’m an important part of the golem!')]
      }
      return null
    },
    'f-sundial': (c, k) => {
      if (k === 'ひかり') {
        c.learn('hikari')
        c.sparkle('spark')
        if (c.stage('golem-pieces') === 0 && !c.flag('got.piece-sun'))
          return [c.narrate('「ひかり」！ ひどけいが きらきら かがやいて…', '“Hikari”! The sundial blazes with light…'), c.narrate('日の かけらが あたたまって、ぽんと とびだした！', 'The 日 piece warms up and pops right out!'), ...gotPiece(c, 'piece-sun')]
        return [c.narrate('かげが みじかく なった。ひどけいの じこくは…「おやつの じかん」。', 'The shadow shrinks. The sundial reads… “snack time.”'), ...firstTime(c, 'f-sundial')]
      }
      if (k === 'ひ') {
        c.learn('hi')
        return [c.narrate('「ひ」！ ひどけいが ちょっと こげた…', '“Hi”! The sundial gets a little scorched…'), c.fude('それは 火！ 日も「ひ」と よむけど、ほしいのは「ひかり」だよ。', 'That was 火, fire! 日 is also read ひ, but what it wants is ひかり — light.')]
      }
      if (k === 'つき') {
        c.learn('tsuki')
        return [c.narrate('つきの ひかりが さした。…ひどけいは なにも いわない。', 'Moonlight falls on it. …The sundial says nothing.'), c.fude('つきの ひかりじゃ、ひどけいは うごかないね。', 'Sundials don’t work by moonlight!')]
      }
      return null
    },
    'f-sapling': (c, k) => {
      if (k === 'き') {
        c.learn('ki')
        if (c.stage('golem-pieces') === 0 && !c.flag('got.piece-tree')) {
          c.sparkle('leaf')
          return [
            c.narrate('「き」！ なえぎが びくっと ふるえて…', '“Ki”! The sapling gives a startled shiver…'),
            c.narrate('すぽん！ じめんから とびだした。つちを はらうと… 木の かけらだ！', 'Pop! It jumps out of the ground, shakes off the dirt… it’s the 木 piece!'),
            ...gotPiece(c, 'piece-tree'),
          ]
        }
        return [c.narrate('なえぎが うれしそうに ゆれた。', 'The sapling sways happily.')]
      }
      if (k === 'みず' || k === 'あめ') {
        c.learn(k === 'みず' ? 'mizu' : 'ame')
        c.sparkle('ripple')
        return [c.narrate('なえぎは みずを のんで… 1センチ のびた。', 'The sapling drinks it up and grows… one centimetre.')]
      }
      if (k === 'はやし' || k === 'もり') {
        c.learn(k === 'はやし' ? 'hayashi' : 'mori')
        return [c.narrate('なえぎは きょろきょろ あたりを みまわした。…木は 1ぽん しか いない。', 'The sapling looks around nervously. …There’s only one of it.')]
      }
      return null
    },
    'f-kitsune': (c, k) => {
      if (k === 'くち') {
        c.learn('kuchi')
        if (c.flag('got.piece-mouth')) return [c.say('コン？', 'Kon?')]
        return [c.narrate('コンコの 口が ぱくっと とじた。…しずか。', 'Konko’s mouth snaps shut. …Blessed silence.'), c.say('…っぷは！ それでね、それでね！', '…Pwah! And then, and then!')]
      }
      if (k === 'かわ' && c.stage('golem-pieces') === 0 && !c.flag('got.piece-mouth')) return [c.say('あっ、こたえ いっちゃ だめ〜！ ちゃんと なぞなぞで きいてよ！', 'Hey, no shouting the answer! Wait for the riddle!')]
      return null
    },
    'f-crops': (c, k) => {
      const st = c.stage('rain-crops')
      if (k === 'くも') {
        c.learn('kumo')
        if (st === 0) {
          c.set('rain.cloud')
          c.sparkle('dust')
          return [c.narrate('「くも」！ ふわふわの くもが やさいばたけの 上に あつまった。', '“Kumo”! A fluffy cloud gathers over the veggie patch.'), c.fude('くもが きた！ こんどは…？', 'A cloud! And now…?')]
        }
        return [c.narrate('くもが もう ひとつ ふえた。くもどうし、なかよく ならんでいる。', 'Another cloud drifts in and snuggles up to the first one.')]
      }
      if (k === 'あめ') {
        c.learn('ame')
        if (st === 0 && !c.flag('rain.cloud')) return [c.narrate('ぽつ。…しずくが 1てき。そらは まっさお。', 'Plip. …A single drop. The sky is completely clear.'), c.fude('あめは くもから ふるんだよ。さきに「くも」を よぼう！', 'Rain comes from clouds. Call くも first!')]
        if (st === 0) {
          c.sparkle('ripple')
          c.sfx('correct')
          return [
            c.narrate('「あめ」！ ざあああ… つめたい あめが ふりだした！', '“Ame”! Whoosh… cool rain pours down!'),
            c.narrate('やさいが ぐんぐん おきあがる。…でも、あめが やまない。くもは ここが きにいった みたいだ。', 'The vegetables spring up. …But the rain won’t stop. The cloud likes it here.'),
            c.say('わああ！ たんぼが あふれる〜！', 'Aaah! The paddies are overflowing!', FARMHAND, 'villager-a'),
            ...c.advance('rain-crops'),
          ]
        }
        return [c.narrate('あめが ざあざあ ふった。やさいは もう おなか いっぱいだ。', 'Rain pours. The vegetables are already full.')]
      }
      if (k === 'かぜ') {
        c.learn('kaze')
        if (st === 1) {
          c.set('rain.cloud', 0)
          c.sparkle('leaf')
          c.sfx('correct')
          return [c.narrate('「かぜ」！ びゅうっ！ くもは もりの ほうへ ふきとばされた。', '“Kaze”! Whoosh! The cloud is blown off toward the forest.'), c.narrate('そらに 大きな にじが かかった！', 'A huge rainbow arcs across the sky!'), ...c.advance('rain-crops')]
        }
        return [c.narrate('はっぱが さらさら ゆれた。', 'The leaves rustle in the breeze.')]
      }
      if (k === 'みず') {
        c.learn('mizu')
        return [c.narrate('コップ 1ぱいぶんの みず。にんじんが 1ぽん げんきに なった。…にんじんは 100ぽん ある。', 'A cupful of water. One carrot perks up. …There are a hundred carrots.'), c.fude('もっと 大きな みずが いるね。てんきの ことばは？', 'We need a lot more water. A weather word?')]
      }
      if (k === 'ひ') {
        c.learn('hi')
        return [c.say('やめてー！ やさいを やかないでー！', 'Nooo! Don’t roast the vegetables!', FARMHAND, 'villager-a')]
      }
      return null
    },
    'f-hide-bush': (c, k) => {
      if (k !== 'かぜ') return k === 'くさ' ? (c.learn('kusa'), [c.narrate('くさむらが「そうです、くさです」と いった。', 'The bush says: “Yes. I am grass.”'), c.fude('…くさは しゃべらないよね？', '…Grass doesn’t talk, does it?')]) : null
      c.learn('kaze')
      c.sparkle('leaf')
      return found(c, 'f-hide-bush', [c.narrate('「かぜ」！ びゅうっ！ はっぱが ぜんぶ とんでいって…', '“Kaze”! Whoosh! Every leaf flies away and…'), c.say('あーあ、みつかっちゃった！', 'Aww, you found me!', { jp: 'そら', en: 'Sora' }, 'child')])
    },
    'f-hide-rock': (c, k) => {
      if (k !== 'いわ' && k !== 'いし') return null
      c.learn(k === 'いわ' ? 'iwa' : 'ishi')
      c.sparkle('dust')
      return found(c, 'f-hide-rock', [
        c.say('ぼくは いわじゃ ないぞ！ …あっ。', 'I am NOT a rock! …Oops.', { jp: 'いわ？', en: 'Rock?' }, 'tanuki'),
        c.narrate('ぼふん！ けむりの 中から たぬきが あらわれた！', 'Poof! A tanuki appears in a puff of smoke!'),
        c.say('ぽこ。コタだ。…ひるね ちゅう だったのに。', 'Poko. I’m Kota. …I was napping.', { jp: 'コタ', en: 'Kota' }, 'tanuki'),
      ])
    },
    'f-hide-barrel': (c, k) => {
      if (k !== 'みず') return null
      c.learn('mizu')
      c.sparkle('ripple')
      return found(c, 'f-hide-barrel', [c.narrate('「みず」！ たるに つめたい みずが どぼどぼ…', '“Mizu”! Cold water glugs into the barrel…'), c.say('つめたーい！！', 'COLD!!', { jp: 'めい', en: 'Mei' }, 'child'), c.narrate('ずぶぬれの 女の子が とびだした。', 'A soaking-wet girl bursts out.')])
    },
    'f-kota': (c, k) => {
      if (k === 'ねこ') return (c.learn('neko'), [c.say('ねこでも ないぞ。ぽこ。', 'Not a cat either. Poko.')])
      if (k === 'いぬ') return (c.learn('inu'), [c.say('いぬでも ない！ ぽこぽこ！', 'Not a dog either! Poko poko!')])
      return null
    },
    // ── playful word reactions ─────────────────────────────────────────
    'f-golem': (c, k) => {
      if (k === 'いし' || k === 'やま') {
        c.learn(k === 'いし' ? 'ishi' : 'yama')
        c.sparkle('dust')
        return [c.say(`ゴゴ… わたしは ${k}…？ ちがう… わたしは…`, `Rumble… I am ${k === 'いし' ? 'stone' : 'mountain'}…? No… I am…`), c.fude('まだ まよってる。かけらが たりないんだ。', 'It’s still confused. It’s missing pieces.')]
      }
      if (k === 'もり' || k === 'はやし') {
        c.learn(k === 'もり' ? 'mori' : 'hayashi')
        return [c.say('…その ことば… なつかしい…', '…That word… it sounds like home…'), c.narrate('ゴーレムの からだに、みどりの こけが ぽつっと はえた。', 'A tiny patch of green moss sprouts on the golem’s shoulder.')]
      }
      return null
    },
    'f-boulder': (c, k) => {
      if (k === 'いわ') {
        c.learn('iwa')
        c.sparkle('dust')
        return [c.narrate('「いわ」！ 大岩が ごろんと ゆれて、「なに？」と いう かおを した。', '“Iwa”! The Great Boulder rocks on its base, looking faintly annoyed.'), ...firstTime(c, 'f-boulder')]
      }
      if (k === 'ちから') {
        c.learn('chikara')
        return [c.narrate('「ちから」！ ぐぐぐ… 大岩を もちあげようと した。', '“Chikara”! Hnnng… you try to lift the boulder.'), c.narrate('…びくとも しない。こしが いたい。', '…It doesn’t budge. Your back hurts.'), c.fude('ちからだけじゃ だめな ことも あるね。', 'Some things power alone can’t fix.')]
      }
      return null
    },
    'f-racer': (c, k) => {
      if (k !== 'いぬ') return null
      c.learn('inu')
      c.sparkle('dust')
      return [c.say('わん！ よんだ？ かけっこ する？ する？ するよね！？', 'Woof! You called? Race? Race? We’re racing, right?!'), c.narrate('いぬは その ばで 3かい まわった。', 'The dog spins in three excited circles.'), ...firstTime(c, 'f-racer')]
    },
    'f-paddy-sign': (c, k) => {
      if (k === 'た' || k === 'こめ') {
        c.learn(k === 'た' ? 'ta' : 'ta-rice')
        c.sparkle('leaf')
        return [c.narrate(`「${k}」！ たんぼの いねが いっせいに さわさわ ゆれた。`, `“${k === 'た' ? 'Ta' : 'Kome'}”! The rice in the paddies rustles all at once.`), c.fude('田は たんぼ。米は おこめ。どちらも この のの たからものだね。', '田 is a paddy, 米 is the rice. Both are treasures of the Fields.'), ...firstTime(c, 'f-paddy-sign')]
      }
      return null
    },
    'f-cauldron': (c, k) => {
      if (k === 'ひ' || k === 'ほのお') {
        c.learn(k === 'ひ' ? 'hi' : 'honoo')
        c.sparkle('spark')
        return [c.narrate('かまが ぐらぐら にえたった！ …なかから「あちち！」と こえが した。', 'The cauldron boils over! …Something inside yelps “Hot, hot!”'), c.fude('だ、だれか はいってるの？', 'W-was someone in there?')]
      }
      if (k === 'みず') {
        c.learn('mizu')
        c.sparkle('ripple')
        return [c.narrate('じゅわーっ！ ゆげが もくもく。ちょうど いい おんどに なった。', 'Hsssss! Clouds of steam. Now it’s just the right temperature.'), ...firstTime(c, 'f-cauldron')]
      }
      return null
    },
    'f-cat': (c, k) => {
      if (k !== 'ねこ') return null
      c.learn('neko')
      c.sparkle('spark')
      return [c.say('ねこ？ ふふん、わたしは ただの ねこじゃ ないにゃ。', 'Cat? Hmph, I’m no ordinary cat, nya.'), c.narrate('ぼふん！ ねこは いぬに なって、とりに なって、また ねこに もどった。', 'Poof! The cat turns into a dog, then a bird, then back into a cat.'), c.say('ばけねこ にゃ！', 'Shape-shifter cat, nya!')]
    },
    'f-traveller': (c, k) => {
      if (k !== 'みち') return null
      c.learn('michi')
      return [c.say('みちですか？ この みちは ひがしの 森へ つづきますよ。ゴーレムが いなければ ね。', 'The road? It runs east to the forest. If the golem would ever move, that is.'), ...firstTime(c, 'f-traveller')]
    },
  },
  mapCast: {
    fields: (c, k) => {
      if (k === 'あめ' && c.stage('rain-crops') === 0) return (c.learn('ame'), [c.fude('ここじゃ なくて、やさいばたけの 上で となえよう！ …それに、そらに くもが ないよ。', 'Not here — cast it at the veggie patch! …And there isn’t a single cloud in the sky.')])
      if (k === 'ゆき') {
        c.learn('yuki')
        c.sparkle('spark')
        return [c.narrate('「ゆき」！ はるの のはらに、ひらひら ゆきが ふった。', '“Yuki”! Snowflakes flutter down over the spring fields.'), c.say('ええっ、いまは はるだよ！？', 'What?! It’s spring!', FARMHAND, 'villager-a')]
      }
      if (k === 'かぜ') {
        c.learn('kaze')
        c.sparkle('leaf')
        return [c.narrate('「かぜ」！ きんいろの いなほが なみのように ゆれた。', '“Kaze”! The golden rice ripples like waves.')]
      }
      if (k === 'はな') {
        c.learn('hana')
        c.sparkle('leaf')
        return [c.narrate('「はな」！ あしもとに ちいさな はなが ぽぽぽっと さいた。', '“Hana”! Little flowers pop up around your feet.')]
      }
      if (k === 'くも') {
        c.learn('kumo')
        return [c.narrate('「くも」！ くもが ひとつ、ぷかぷか やってきた。…うさぎの かたちだ。', '“Kumo”! A single cloud drifts over. …It’s shaped like a rabbit.')]
      }
      if (k === 'そら') {
        c.learn('sora')
        return [c.narrate('「そら」！ みあげると、どこまでも あおい。', '“Sora”! You look up. Blue, forever.'), c.fude('のはらの そらは ひろいね！', 'The sky out here is huge!')]
      }
      return null
    },
  },
}

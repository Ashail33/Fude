/**
 * The Games tab, woven into the journey (see arcade/story.ts):
 *
 *  - 墨の道場 The Ink Dojo — Master Sumi, a retired ink-swordsman in the
 *    Village's bamboo grove. The Quiet's shadows have seeped into his
 *    practice scroll as ink warriors; Fude can carry you inside to fight
 *    them (Stick Ninja). Each ink echo you beat earns a keepsake and his
 *    blessing; the last one, a memory of sparring with Kotone.
 *  - からっぽの たに The Empty Valley — Granny Tane on Windmill Hill, whose
 *    valley emptied when the Quiet stole her neighbours' words. Her deed
 *    opens the Hidden Village; the tale follows what you build there.
 *  - たにを わたれ Cross the Gorge — Hayato, a ninja in training by the river
 *    in Mushroom Hollow (Bamboo Bridge).
 *
 * Every keeper can send you into their game; you come back to the same spot.
 */
import { echoesBeaten, MET_FLAG } from '../../arcade/story'
import { levelOf, manorLevel } from '../../engine/hamlet'
import type { Step } from '../../world/Dialog'
import type { Ctx, TaleContent } from './types'

const SUMI = { jp: 'スミ せんせい', en: 'Master Sumi' }
const TANE = { jp: 'タネ ばあちゃん', en: 'Granny Tane' }

/** "Go now?" — on yes, the game opens when the talk ends. */
function goNow(c: Ctx, route: string, yes: [string, string], fude: [string, string]): Step {
  return c.choice({ jp: 'どうする？', en: 'What will you do?' }, [['go', yes[0], yes[1]], ['later', 'また こんど', 'Maybe later']], (id) => {
    if (id !== 'go') return [c.say('いつでも おいで。', 'Come back any time.')]
    c.play(route)
    return [c.fude(fude[0], fude[1])]
  })
}

// ─── The Ink Dojo ──────────────────────────────────────────────────────

const ECHOES: { item: string; jp: string; en: string; told: [string, string][] }[] = [
  {
    item: 'ronin-hat',
    jp: 'ろうにん カイト',
    en: 'Kaito the Ronin',
    told: [
      ['カイトの かげを きったか。あれは まよいの かげ じゃ。', 'You cut down Kaito’s echo. That one is the shadow of doubt.'],
      ['どこへも いけず、だれにも あえない きもち。…しずけさの かけらじゃよ。', 'The feeling of having nowhere to go and no one to meet. …A shard of the Quiet.'],
    ],
  },
  {
    item: 'oni-horn',
    jp: 'おに ゴウキ',
    en: 'Gōki the Oni',
    told: [
      ['ゴウキの かげは、いかりの かたまり じゃった。', 'Gōki’s echo was a lump of anger.'],
      ['ほんとうは「きいて ほしい」と さけんで おった だけ かも しれんの。', 'Perhaps all it was really shouting was “listen to me”.'],
    ],
  },
  {
    item: 'tengu-feather',
    jp: 'てんぐ ハヤテ',
    en: 'Hayate the Tengu',
    told: [
      ['ハヤテの かげは、たかい ところから だれも みおろして おった。', 'Hayate’s echo looked down on everyone from up high.'],
      ['ひとりで たかく とぶのは、さびしい ものじゃ。', 'Flying high all alone is a lonely thing.'],
    ],
  },
  {
    item: 'shadow-mask',
    jp: 'かげ',
    en: 'Kage',
    told: [
      ['かげの かげ… ややこしいの。あれは「かくれたい」きもち じゃ。', 'The shadow of Kage… how confusing. That one is the wish to hide.'],
      ['みつけて もらえない のと、みつけて ほしくない のは、よく にて おる。', 'Not being found and not wanting to be found look very alike.'],
    ],
  },
  {
    item: 'dragon-scale',
    jp: 'りゅうの しょうぐん',
    en: 'the Dragon Shōgun',
    told: [
      ['しょうぐんの かげまで… ほんとうに やりおったな！', 'Even the Shōgun’s echo… you really did it!'],
      ['あれは「ぜんぶ わしの ものだ」と いう かげ。ことばを ひとりじめ したい きもちじゃ。', 'That was the shadow that says “it is all mine”: the wish to keep every word for oneself.'],
    ],
  },
]

function sumiReport(c: Ctx, k: number): Step[] {
  const e = ECHOES[k]
  const out: Step[] = [c.say(...e.told[0]), c.say(...e.told[1]), c.say('これを もって いきなさい。わしの 「しゅくふく」も いっしょに。', 'Take this, and my blessing with it.'), ...c.give(e.item)]
  out.push(c.narrate('⚔️ スミ せんせいの しゅくふく：たたかいで こうげき +2', '⚔️ Master Sumi’s blessing: +2 attack in every battle'))
  out.push(...c.reward(40 + k * 30, 10 + k * 5))
  if (k === ECHOES.length - 1) {
    out.push(
      c.say('…ひとつ、むかしばなしを しようかの。', '…Let me tell you an old story.'),
      c.say('むかし、ふでを もった おんなのこが この たけやぶに きた。コトネ という こ じゃった。', 'Long ago a girl with a brush came to this grove. Her name was Kotone.'),
      c.say('まいにち わしと けいこを した。いちども かてなかった。…でも、いちども なかなかった。', 'She sparred with me every day. She never won once. …And she never once cried.'),
      c.say('「かたなで きる より、ことばで つなぐ ほうが いい」と わらって おった。', '“Joining things with words is better than cutting them with a sword,” she would laugh.'),
      c.fude('…コトネ。うん、そう いってた。ぼく、おぼえてる。', '…Kotone. Yes, she used to say that. I remember.'),
      c.say('きみの けんは、あの こに よく にて おる。これを うけとって くれ。', 'Your sword is a lot like hers. Please take this.'),
      ...c.give('ink-blade'),
      c.narrate('🗡️ すみの かたな：たたかいで こうげき +4、HP +10', '🗡️ The Ink Blade: +4 attack and +10 HP in every battle'),
    )
  }
  return out
}

function sumi(c: Ctx): Step[] {
  const st = c.stage('ink-dojo')
  const enter = () => goNow(c, '/stick-ninja?from=world', ['まきものに はいる', 'Step into the scroll'], ['いくよ！ まきものの なかへ！', 'Here we go, into the scroll!'])
  if (st < 0) {
    c.set(MET_FLAG.dojo)
    return [
      c.say('ほう… ことばの まほうつかい か。わしは スミ。むかしは すみの けんしと よばれて おった。', 'Oh… a word mage. I am Sumi. Long ago they called me the Ink Swordsman.'),
      c.say('この まきものを みて くれ。わしの けいこ ようの まきもの じゃ。', 'Look at this scroll. It is the scroll I train with.'),
      c.narrate('まきものの なかで、すみで かいた ひとが うごいて いる…！', 'Inside the scroll, figures drawn in ink are moving…!'),
      c.say('しずけさの かげが しみこんで、すみの せんしに なって しもうた。', 'The Quiet’s shadows seeped in and became ink warriors.'),
      c.say('わしは もう としじゃ。かわりに きって くれんか。', 'I am too old now. Will you cut them down for me?'),
      c.fude('ぼくが まきものの なかへ つれて いけるよ！ ぼくも ふで だからね。', 'I can take you inside the scroll! I’m a brush too, after all.'),
      ...c.start('ink-dojo'),
      c.narrate('🎮 「あそび」に すみの どうじょう（ぼうにんじゃ）が ひらいた！', '🎮 The Ink Dojo (Stick Ninja) is now open in the Games tab!'),
      enter(),
    ]
  }
  const beaten = Math.min(ECHOES.length, echoesBeaten(c.s()))
  const out: Step[] = []
  for (let k = st; k < beaten; k++) {
    out.push(...sumiReport(c, k))
    out.push(...c.advance('ink-dojo'))
  }
  if (out.length) return out
  if (st >= ECHOES.length)
    return [c.say('すみの せかいは しずかに なった。でも、けいこは いつでも できるぞ。', 'The ink world is quiet now. But you can always train.'), enter()]
  return [c.say(`つぎは ${ECHOES[st].jp} の かげ じゃ。きを つけて。`, `Next is the echo of ${ECHOES[st].en}. Take care.`), enter()]
}

// ─── The Empty Valley ──────────────────────────────────────────────────

const VALLEY: { done: (c: Ctx) => boolean; thanks: [string, string][] }[] = [
  {
    done: (c) => Object.values(c.s().hamlet?.plots ?? {}).some((p) => p?.id === 'paddy'),
    thanks: [
      ['たんぼが できた？ ああ、また こめの においが する…！', 'A rice paddy? Oh, the valley smells of rice again…!'],
      ['つぎは やしきを なおして おくれ。むらの まんなか だからね。', 'Next, please fix up the manor. It is the heart of the village.'],
    ],
  },
  {
    done: (c) => !!c.s().hamlet && manorLevel(c.s().hamlet!) >= 2,
    thanks: [
      ['やしきに ひが ともったって？ なつかしいねえ。', 'A light in the manor again? How it takes me back.'],
      ['でも ようかいが ねらって くる。むらを まもって おくれ。', 'But the yokai will come for it. Please defend the village.'],
    ],
  },
  {
    done: (c) => (c.s().hamlet?.raidsWon ?? 0) >= 1,
    thanks: [
      ['ようかいを おいかえした！ あんたは つよいねえ。', 'You drove the yokai off! Aren’t you strong.'],
      ['さいごに、ちゃやを たてて おくれ。たびびとが よる ところが あれば、ひとは もどって くる。', 'Last of all, build a teahouse. Where travellers stop, people come back.'],
    ],
  },
  {
    done: (c) => !!c.s().hamlet && levelOf(c.s().hamlet!, 'teahouse') >= 1,
    thanks: [
      ['ちゃやの けむりが みえたよ。…ほら、きいて ごらん。', 'I saw smoke from the teahouse. …There, listen.'],
      ['たにから わらいごえが きこえる。みんな、ことばを とりもどして もどって きたんだ。', 'Laughter from the valley. Everyone has found their words and come home.'],
    ],
  },
]

function tane(c: Ctx): Step[] {
  const st = c.stage('empty-valley')
  const visit = () => goNow(c, '/hamlet?from=world', ['たにへ いく', 'Go to the valley'], ['かくれざとへ しゅっぱつ！', 'Off to the Hidden Village!'])
  if (st < 0) {
    c.set(MET_FLAG.valley)
    return [
      c.say('おや、たびの ひと。この おかの むこうに、ちいさな たにが あるんだよ。', 'Oh, a traveller. Past this hill there is a little valley.'),
      c.say('むかしは にぎやかな むら だった。でも しずけさが きて、みんな ことばを なくして…', 'It used to be a lively village. But the Quiet came, and everyone lost their words…'),
      c.say('ひとり、また ひとりと、どこかへ いって しまった。いまは だれも いない。', 'One by one they wandered off. Now nobody is left.'),
      c.say('わたしは もう あるけない。これを あげる から、むらを たてなおして くれないかい？', 'I can’t walk that far any more. If I give you this, will you rebuild the village?'),
      ...c.give('valley-deed'),
      ...c.start('empty-valley'),
      c.narrate('🎮 「あそび」に かくれざとが ひらいた！', '🎮 The Hidden Village is now open in the Games tab!'),
      visit(),
    ]
  }
  if (st >= VALLEY.length) return [c.say('たにの みんなが よろしくって。ときどき かおを だして おくれ。', 'Everyone in the valley says hello. Do drop by now and then.'), visit()]
  const out: Step[] = []
  let k = st
  while (k < VALLEY.length && VALLEY[k].done(c)) {
    out.push(...VALLEY[k].thanks.map(([jp, en]) => c.say(jp, en)))
    out.push(...c.reward(30 + k * 20, 10 + k * 5))
    out.push(...c.advance('empty-valley'))
    k++
  }
  if (k >= VALLEY.length && k > st) out.push(...c.give('village-bell'), c.say('この すずを もって いって。たにの みんなからの おれいだよ。', 'Take this bell. It is a thank-you from everyone in the valley.'))
  if (out.length) return [...out, visit()]
  return [c.say('たにの ようすは どうだい？', 'How is the valley coming along?'), visit()]
}

// ─── Cross the Gorge ───────────────────────────────────────────────────

const GORGE = [10, 25]

function hayato(c: Ctx): Step[] {
  const st = c.stage('gorge')
  const cross = () => goNow(c, '/bamboo-bridge?from=world', ['わたって みる', 'Try the crossing'], ['ぼうを のばして… よし、いこう！', 'Stretch the pole… right, let’s go!'])
  if (st < 0) {
    c.set(MET_FLAG.bridge)
    return [
      c.say('しーっ！ いま しゅぎょう ちゅう なんだ。ぼくは ハヤト。にんじゃの たまご！', 'Shh! I’m training. I’m Hayato, a ninja in the making!'),
      c.say('たけの ぼうを のばして、はしらから はしらへ わたるんだ。ながすぎても みじかすぎても、ドボン！', 'You stretch a bamboo pole and cross from pillar to pillar. Too long or too short and — splash!'),
      c.say('ぼくの きろくは 9 ほん。それより たくさん わたれる？', 'My record is 9 pillars. Can you cross more than that?'),
      ...c.start('gorge'),
      c.narrate('🎮 「あそび」に ぼうわたりが ひらいた！', '🎮 Bamboo Bridge is now open in the Games tab!'),
      cross(),
    ]
  }
  const best = c.s().arcade?.stick ?? 0
  const out: Step[] = []
  let k = st
  while (k < GORGE.length && best >= GORGE[k]) {
    if (k === 0) out.push(c.say(`${best} ほん！？ ぼくの きろくを こえた…！ しゅぎょう、もっと がんばる！`, `${best} pillars!? You beat my record…! I’ll train even harder!`), ...c.reward(30, 10))
    else out.push(c.say('25 ほん いじょう… せんせいって よんでも いい？ これ、ぼくの たからもの。', 'More than 25… can I call you sensei? This is my treasure.'), ...c.give('bamboo-charm'), ...c.reward(60, 25))
    out.push(...c.advance('gorge'))
    k++
  }
  if (out.length) return [...out, cross()]
  if (k >= GORGE.length) return [c.say('せんせい！ きょうも いっしょに しゅぎょう しよう！', 'Sensei! Let’s train together again today!'), cross()]
  return [c.say(`いまの きろくは ${best} ほん。めざせ ${GORGE[k]} ほん！`, `Your record is ${best}. Aim for ${GORGE[k]}!`), cross()]
}

// ─── Content ───────────────────────────────────────────────────────────

export const MINIGAMES: TaleContent = {
  tales: [
    {
      id: 'ink-dojo',
      region: 1,
      title: 'The Ink Dojo',
      jp: '墨の道場',
      summary: 'The Quiet’s shadows have become ink warriors in Master Sumi’s scroll. Step inside and cut down their echoes (Stick Ninja).',
      giver: 'vb-sumi',
      stages: ECHOES.map((e, i) => ({
        jp: `まきもので ${e.jp}の かげを たおし、スミ せんせいに しらせよう`,
        en: `In the scroll (Stick Ninja), defeat the ink echo of ${e.en} (stage ${i + 1}-5), then tell Master Sumi.`,
        target: ['vb-sumi'],
        map: 'village-bamboo',
      })),
    },
    {
      id: 'empty-valley',
      region: 2,
      title: 'The Empty Valley',
      jp: 'からっぽの たに',
      summary: 'Granny Tane’s valley emptied when the Quiet stole her neighbours’ words. Rebuild it as the Hidden Village.',
      giver: 'fh-tane',
      stages: [
        { jp: 'かくれざとに たんぼを つくり、タネ ばあちゃんに しらせよう', en: 'In the Hidden Village, plant a rice paddy, then tell Granny Tane.', target: ['fh-tane'], map: 'fields-hill' },
        { jp: 'やしきを レベル2に して、タネ ばあちゃんに しらせよう', en: 'Raise the manor to level 2, then tell Granny Tane.', target: ['fh-tane'], map: 'fields-hill' },
        { jp: 'ようかいの しゅうげきから むらを まもろう', en: 'Defend the village from a yokai raid, then tell Granny Tane.', target: ['fh-tane'], map: 'fields-hill' },
        { jp: 'ちゃやを たてて、タネ ばあちゃんに しらせよう', en: 'Build a teahouse so travellers return, then tell Granny Tane.', target: ['fh-tane'], map: 'fields-hill' },
      ],
    },
    {
      id: 'gorge',
      region: 3,
      title: 'Cross the Gorge',
      jp: 'たにを わたれ',
      summary: 'Hayato, a ninja in training, dares you to beat his record on the Bamboo Bridge.',
      giver: 'fo-hayato',
      stages: [
        { jp: 'ぼうわたりで 10ほん わたり、ハヤトに みせよう', en: 'Cross 10 pillars on the Bamboo Bridge, then show Hayato.', target: ['fo-hayato'], map: 'forest-hollow' },
        { jp: 'ぼうわたりで 25ほん わたり、ハヤトに みせよう', en: 'Cross 25 pillars on the Bamboo Bridge, then show Hayato.', target: ['fo-hayato'], map: 'forest-hollow' },
      ],
    },
  ],
  items: [
    { id: 'ronin-hat', name: 'Ronin’s Straw Hat', jp: 'ろうにんの かさ', kana: 'ろうにんの かさ', emoji: '👒', desc: 'Left behind by Kaito’s ink echo. Master Sumi’s blessing: +2 attack in battle.' },
    { id: 'oni-horn', name: 'Ink Oni Horn', jp: 'おにの つの', kana: 'おにの つの', emoji: '🦴', desc: 'A horn of dried ink from Gōki’s echo. +2 attack in battle.' },
    { id: 'tengu-feather', name: 'Tengu Feather', jp: 'てんぐの はね', kana: 'てんぐの はね', emoji: '🪶', desc: 'A black feather from Hayate’s echo. +2 attack in battle.' },
    { id: 'shadow-mask', name: 'Shadow Mask', jp: 'かげの めん', kana: 'かげの めん', emoji: '🎭', desc: 'Kage’s mask; behind it was only ink. +2 attack in battle.' },
    { id: 'dragon-scale', name: 'Dragon Scale', jp: 'りゅうの うろこ', kana: 'りゅうの うろこ', emoji: '🐉', desc: 'A golden scale from the Dragon Shōgun’s echo. +2 attack in battle.' },
    { id: 'ink-blade', name: 'The Ink Blade', jp: 'すみの かたな', kana: 'すみの かたな', emoji: '🗡️', desc: 'Master Sumi’s own sword, once crossed with Kotone’s brush. +4 attack and +10 HP in battle.' },
    { id: 'valley-deed', name: 'Deed to the Valley', jp: 'たにの けんりしょ', kana: 'たにの けんりしょ', emoji: '📜', desc: 'Granny Tane’s deed to the empty valley. Rebuild it as the Hidden Village (Games tab).' },
    { id: 'village-bell', name: 'Valley Bell', jp: 'たにの すず', kana: 'たにの すず', emoji: '🔔', desc: 'A thank-you from the people who came home to the valley.' },
    { id: 'bamboo-charm', name: 'Hayato’s Bamboo Charm', jp: 'たけの おまもり', kana: 'たけの おまもり', emoji: '🎋', desc: 'Hayato’s treasure, given to the sensei who out-crossed him.' },
  ],
  talk: {
    'vb-sumi': sumi,
    'vb-scroll': (c) =>
      c.flag(MET_FLAG.dojo) > 0
        ? [c.narrate('すみの せんしたちが まきものの なかで まって いる。', 'The ink warriors wait inside the scroll.'), goNow(c, '/stick-ninja?from=world', ['まきものに はいる', 'Step into the scroll'], ['いくよ！', 'Here we go!'])]
        : [c.narrate('ふしぎな まきもの。すみの ひとが うごいて いる… だれの もの だろう？', 'A strange scroll. Ink figures move across it… whose could it be?')],
    'fh-tane': tane,
    'fo-hayato': hayato,
  },
  cast: {},
  entities: {
    'village-bamboo': [
      { id: 'vb-sumi', kind: 'npc', sprite: 'samurai', dir: 'left', x: 25, y: 9, name: SUMI, lines: [{ jp: 'すみと かたなの みちは ひとつ。', en: 'Ink and the sword follow one path.' }] },
      { id: 'vb-scroll', kind: 'landmark', tile: 'sign', x: 26, y: 8, name: { jp: 'すみの まきもの', en: 'The Ink Scroll' }, lines: [{ jp: 'すみの ひとが うごいて いる。', en: 'Ink figures are moving.' }] },
    ],
    'fields-hill': [{ id: 'fh-tane', kind: 'npc', sprite: 'okami', dir: 'left', x: 20, y: 17, name: TANE, lines: [{ jp: 'たにの むこうは、むかし にぎやか だったんだよ。', en: 'Past the hill, it used to be so lively.' }] }],
    'forest-hollow': [{ id: 'fo-hayato', kind: 'npc', sprite: 'child', dir: 'right', x: 16, y: 12, name: { jp: 'にんじゃの ハヤト', en: 'Hayato the Ninja' }, lines: [{ jp: 'しゅぎょう、しゅぎょう！', en: 'Training, training!' }] }],
  },
}

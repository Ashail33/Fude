/**
 * Region 1 — the Village of First Words. Three tales that teach you to use
 * words as magic in the world: lure a frightened cat with a fish you catch
 * by casting さかな, relight the spring festival with ひ, and carry a
 * homesick guard's letter to the Fields.
 */
import { regionUnlocked } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import type { Ctx, TaleContent } from './types'

const TAMA = { jp: 'たま', en: 'Tama' }
const LANTERNS = ['v-flant-1', 'v-flant-2', 'v-flant-3']
const lit = (c: { flag: (k: string) => number }, id: string) => c.flag(`lit.${id}`) > 0

/** Offer a tale with a yes/no; `intro` are the giver's lines. */
export function offer(c: Ctx, tale: string, intro: Step[], yes: [string, string] = ['まかせて！', 'Leave it to me!'], no: [string, string] = ['また こんど', 'Maybe later']): Step[] {
  return [
    ...intro,
    c.choice({ jp: 'たすける？', en: 'Will you help?' }, [['yes', yes[0], yes[1]], ['no', no[0], no[1]]], (id) =>
      id === 'yes' ? [c.say('ほんとう？ ありがとう！', 'Really? Thank you!'), ...c.start(tale)] : [c.say('そっか… きが むいたら またね。', 'Oh… come back if you change your mind.')],
    ),
  ]
}

export const VILLAGE_TALES: TaleContent = {
  items: [
    { id: 'fish', name: 'Fresh Fish', jp: 'さかな', kana: 'さかな', emoji: '🐟', desc: 'A wriggling pond fish. Cats find it irresistible.' },
    { id: 'tama-bell', name: 'Tama’s Bell', jp: 'たまの すず', kana: 'たまのすず', emoji: '🔔', desc: 'A tiny silver bell. Animals seem to trust whoever carries it.' },
    { id: 'uchiwa', name: 'Festival Fan', jp: 'うちわ', kana: 'うちわ', emoji: '🪭', desc: 'A paper fan from the spring festival, painted with lanterns.' },
    { id: 'letter', name: 'Goro’s Letter', jp: 'ゴローの てがみ', kana: 'てがみ', emoji: '✉️', desc: 'Sealed with rice glue. “To Mother,” in wobbly kana.' },
    { id: 'onigiri', name: 'Mother’s Onigiri', jp: 'おにぎり', kana: 'おにぎり', emoji: '🍙', desc: 'Still warm, wrapped in a leaf. Made with love.' },
  ],
  tales: [
    {
      id: 'tama',
      region: 1,
      title: 'Tama Up a Tree',
      jp: 'たまは どこ？',
      summary: 'The village kid’s cat has run off and won’t come home.',
      giver: 'v-child',
      stages: [
        { en: 'Find Tama, the kid’s lost cat (try the cherry trees)', jp: 'まいごの ねこ「たま」を さがそう（さくらの 木の ほう？）', target: ['v-tama'], map: 'village' },
        { en: 'Catch a fish at the pond: face the fishing spot and cast さかな', jp: 'いけの つりばで「さかな」と となえよう', target: ['v-pond'], map: 'village' },
        { en: 'Offer the fish to Tama', jp: 'たまに さかなを あげよう', target: ['v-tama'], map: 'village' },
        { en: 'Tell the kid that Tama is home', jp: 'こどもに たまが かえったと つたえよう', target: ['v-child'], map: 'village' },
      ],
    },
    {
      id: 'festival',
      region: 1,
      title: 'Festival of Lights',
      jp: 'ひかりの まつり',
      summary: 'The spring festival is tonight, but a cold wind blew every lantern out.',
      giver: 'v-innkeeper',
      stages: [
        { en: 'Light the three festival lanterns: face each one and cast ひ (fire)', jp: 'まつりの ちょうちんを 3つ「ひ」で ともそう', target: LANTERNS, map: 'village' },
        { en: 'Tell the innkeeper the lanterns are lit', jp: 'やどやの おかみに ほうこくしよう', target: ['v-innkeeper'], map: 'village' },
      ],
    },
    {
      id: 'letter',
      region: 1,
      title: 'A Letter for Mother',
      jp: 'はは への てがみ',
      summary: 'Guard Goro can’t leave his post, and his mother lives out in the Fields.',
      giver: 'v-guard',
      available: (s) => regionUnlocked(s, 2),
      stages: [
        { en: 'Deliver Goro’s letter to his mother Ume in the Fields', jp: '元素の野に すむ ゴローの はは「うめ」に てがみを とどけよう', target: ['f-ume'], map: 'fields' },
        { en: 'Bring Ume’s onigiri back to Goro in the village', jp: 'うめの おにぎりを むらの ゴローに とどけよう', target: ['v-guard'], map: 'village' },
      ],
    },
  ],
  entities: {
    village: [
      { id: 'v-tama', kind: 'npc', sprite: 'cat', x: 37, y: 16, dir: 'left', name: TAMA, lines: [{ jp: 'シャーッ！', en: 'Hsssss!' }] },
      { id: 'v-pond', kind: 'landmark', tile: 'sign', x: 27, y: 17, name: { jp: 'つりば', en: 'Fishing Spot' }, lines: [{ jp: 'つりば ── ここで さかなが よく つれる。', en: 'Fishing spot — the fish bite well here.' }] },
      { id: 'v-flant-1', kind: 'landmark', tile: 'lantern', x: 11, y: 9, name: { jp: 'まつりの ちょうちん', en: 'Festival Lantern' } },
      { id: 'v-flant-2', kind: 'landmark', tile: 'lantern', x: 28, y: 9, name: { jp: 'まつりの ちょうちん', en: 'Festival Lantern' } },
      { id: 'v-flant-3', kind: 'landmark', tile: 'lantern', x: 20, y: 18, name: { jp: 'まつりの ちょうちん', en: 'Festival Lantern' } },
    ],
    fields: [
      { id: 'f-ume', kind: 'npc', sprite: 'elder', x: 8, y: 12, dir: 'down', name: { jp: 'うめ', en: 'Grandma Ume' }, lines: [{ jp: 'いい てんきだねえ。はたけしごとが はかどるよ。', en: 'Lovely weather. Good for the fields.' }] },
    ],
  },
  ghost: Object.fromEntries(LANTERNS.map((id) => [id, (s) => !((s.flags?.[`lit.${id}`] ?? 0) > 0)])),
  moved: {
    // Tama goes home to the kid once lured down with the fish.
    'v-tama': (s) => ((s.flags?.['tale.tama'] ?? -1) >= 3 ? { x: 25, y: 17 } : null),
  },
  talk: {
    'v-child': (c) => {
      const st = c.stage('tama')
      if (st < 0)
        return offer(c, 'tama', [
          c.say('ねえ… ぼくの ねこの「たま」が いなくなっちゃった…', 'Hey… my cat Tama ran away…'),
          c.say('さくらの 木の ほうに いったのを 見たんだ。でも よんでも こないの。', 'I saw her run toward the cherry trees, but she won’t come when I call.'),
        ])
      if (st < 3) return [c.say('たま、おなか すいてないかな…', 'I hope Tama isn’t hungry…')]
      if (st === 3)
        return [
          c.say('たま！！ おかえり！', 'Tama!! You’re home!'),
          c.say('たまを つれて きて くれて ありがとう！ これ、たまの すず。おれいに あげる！', 'Thank you for bringing her back! Here — Tama’s spare bell, as thanks!'),
          ...c.give('tama-bell'),
          ...c.bagItem('charm', 1),
          ...c.reward(40, 15),
          ...c.advance('tama'),
          c.fude('ねこは「ねこ」。さかなは「さかな」。ことばは まほうだね！', 'Cat is ねこ, fish is さかな. Words really are magic!'),
        ]
      return [c.say('たまと あそんでるんだ。にゃーん！', 'I’m playing with Tama. Meow!')]
    },
    'v-tama': (c) => {
      const st = c.stage('tama')
      if (st === 0)
        return [
          c.narrate('さくらの 木の かげで、ねこが ふるえている。くびわに「たま」と かいてある。', 'A cat is trembling in the shade of the cherry tree. Her collar reads “Tama”.'),
          c.say('シャーッ！', 'Hsssss!', TAMA, 'cat'),
          c.fude('こわがってるね… ねこは さかなが だいすき！ いけで つれないかな？', 'She’s scared… Cats love fish! Maybe we can catch one at the pond?'),
          ...c.advance('tama'),
        ]
      if (st === 1) return [c.say('…フーッ。', '…Hff.', TAMA, 'cat'), c.fude('いけの つりばで「さかな」と となえよう！', 'Let’s cast さかな at the pond’s fishing spot!')]
      if (st === 2) {
        if (!c.has('fish')) return [c.fude('さかなを もってないよ。つりばへ いこう！', 'We don’t have a fish yet. To the fishing spot!')]
        return [
          c.choice({ jp: 'さかなを あげる？', en: 'Offer the fish?' }, [['give', 'さかなを あげる', 'Offer the fish'], ['keep', 'やめておく', 'Not yet']], (id) => {
            if (id !== 'give') return
            c.take('fish')
            c.sparkle('spark')
            return [c.say('…にゃ？ にゃあ〜ん♪', '…Mew? Mrrrow~♪', TAMA, 'cat'), c.narrate('たまは さかなを たべて、ごろごろ のどを ならした。', 'Tama gobbles the fish and starts to purr.'), c.fude('なついた！ いえに かえろうね、たま。', 'She trusts us now! Let’s go home, Tama.'), ...c.advance('tama')]
          }),
        ]
      }
      if (st >= 3) return [c.say('にゃ〜ん♪', 'Mrrrow~♪', TAMA, 'cat')]
      return null
    },
    'v-pond': (c) => {
      if (c.stage('tama') === 1) return [c.narrate('さかなが すいすい およいでいる。', 'Fish dart through the clear water.'), c.fude('ここで「さかな」と となえてみて！ ✨ボタンか Cキーで まほう！', 'Cast さかな here! Use the ✨ button or the C key for word magic!')]
      return null
    },
    'v-innkeeper': (c) => {
      const st = c.stage('festival')
      if (st < 0)
        return offer(c, 'festival', [
          c.say('こんやは はるの まつり なのに… つめたい かぜが ふいて、ちょうちんが ぜんぶ きえちゃったの。', 'Tonight is the spring festival, but a cold wind blew every lantern out.'),
          c.say('まほうつかいさん、「ひ」の ことばで ともせない？', 'Little mage — could you relight them with the word for fire?'),
        ])
      if (st === 0) {
        const n = LANTERNS.filter((id) => lit(c, id)).length
        return [c.say(`ちょうちんは あと ${3 - n}こ。「ひ」と となえてね！`, `${3 - n} lantern${3 - n === 1 ? '' : 's'} to go. Cast ひ at them!`)]
      }
      if (st === 1)
        return [
          c.say('まあ！ むらじゅうが あかるく なったわ！', 'Oh my! The whole village is glowing!'),
          c.narrate('どこからか たいこの おとが きこえる。むらびとたちが おどりだした！', 'Drums start up somewhere. The villagers begin to dance!'),
          c.say('ほら、まつりの うちわ。あなたの ぶんよ。', 'Here — a festival fan, just for you.'),
          ...c.give('uchiwa'),
          ...c.reward(50, 20),
          ...c.advance('festival'),
        ]
      return [c.say('まつり、たのしんでね！', 'Enjoy the festival!')]
    },
    'v-guard': (c) => {
      const st = c.stage('letter')
      const s = c.s()
      if (st < 0 && regionUnlocked(s, 2))
        return offer(c, 'letter', [
          c.say('おう、まほうつかい。たのみが あるんだ。', 'Hey, mage. I need a favor.'),
          c.say('はは への てがみを かいたんだが、ここを はなれられない。元素の野の「うめ」に とどけて くれないか？', 'I wrote a letter to my mother, but I can’t leave my post. Could you take it to Ume in the Elemental Fields?'),
        ])
      if (st === 0 && c.has('letter')) return [c.say('ははは 元素の野の にしの ほうに すんでいる。たのんだぞ。', 'Mother lives on the west side of the Fields. Counting on you.')]
      if (st === 1 && c.has('onigiri')) {
        c.take('onigiri')
        return [
          c.say('これは… ははの おにぎり！ このあじ、なつかしいなあ。', 'This is… Mother’s onigiri! That taste takes me back.'),
          c.say('ありがとう。これは おれの おまもりだ。もって いけ。', 'Thank you. Take my lucky charm — you’ll need it more than me.'),
          ...c.bagItem('charm', 2),
          ...c.reward(60, 25),
          ...c.advance('letter'),
        ]
      }
      return null
    },
    'f-ume': (c) => {
      const st = c.stage('letter')
      if (st === 0 && c.has('letter')) {
        c.take('letter')
        return [
          c.narrate('ゴローの てがみを わたした。', 'You hand over Goro’s letter.'),
          c.say('まあ、ゴローから！「げんきです。ははうえも おげんきで」…ふふ、あいかわらず じが へたねえ。', 'Oh, from Goro! “I am well. Stay well, Mother.” …Hehe, his handwriting is as messy as ever.'),
          c.say('これを あの子に。おにぎりよ。「おいしい」って いうのよ、ってね。', 'Take him this — an onigiri. And tell him to say “oishii”!'),
          ...c.give('onigiri'),
          ...c.advance('letter'),
        ]
      }
      if (st === 1) return [c.say('ゴローに よろしくね。', 'Say hello to Goro for me.')]
      if (st >= 2) return [c.say('ゴローから また てがみが きたのよ。「おいしかった」って！', 'Goro wrote again — “it was delicious”!')]
      return null
    },
  },
  cast: {
    'v-pond': (c, k) => {
      if (k === 'さかな') {
        c.learn('sakana')
        if (c.stage('tama') === 1 && !c.has('fish')) {
          c.sparkle('ripple')
          return [c.narrate('「さかな」！ みずが きらりと ひかって…', '“Sakana”! The water flashes silver…'), c.narrate('ぴちぴちっ！ さかなが とびこんで きた！', 'Splash! A fish leaps right into your hands!'), ...c.give('fish'), ...c.advance('tama')]
        }
        c.sparkle('ripple')
        return [c.narrate('さかなが ぴょんと はねて、また もぐった。', 'A fish leaps, then dives back down.')]
      }
      if (k === 'みず') {
        c.learn('mizu')
        c.sparkle('ripple')
        return [c.narrate('みずが ぽちゃんと はねた。いけは もう みずで いっぱいだ。', 'The water splashes. The pond is already full of water!')]
      }
      return null
    },
    'v-tama': (c, k) => {
      if (k === 'ねこ') {
        c.learn('neko')
        return [c.narrate('「ねこ」… たまの みみが ぴくっと うごいた。', '“Neko”… Tama’s ears twitch.'), c.say(c.stage('tama') >= 3 ? 'にゃ♪' : '…にゃ？', c.stage('tama') >= 3 ? 'Mew♪' : '…Mew?', TAMA, 'cat')]
      }
      if (k === 'さかな' && c.stage('tama') <= 2) return [c.narrate('たまの めが きらりと ひかった。…でも ほんものの さかなが ほしそうだ。', 'Tama’s eyes light up… but she clearly wants a real fish.')]
      return null
    },
    ...Object.fromEntries(
      LANTERNS.map((id) => [
        id,
        (c: Ctx, k: string) => {
          if (k === 'ひ') {
            c.learn('hi')
            if (lit(c, id)) return [c.narrate('ちょうちんは もう あかあかと ともっている。', 'This lantern is already burning bright.')]
            c.set(`lit.${id}`)
            c.sparkle('spark')
            c.sfx('correct')
            const n = LANTERNS.filter((x) => lit(c, x)).length
            const out: Step[] = [c.narrate('「ひ」！ ぽっと あたたかい ひが ともった！', '“Hi”! A warm flame blooms inside the lantern!')]
            if (c.stage('festival') === 0 && n >= 3) out.push(c.fude('ぜんぶ ついた！ おかみさんに しらせよう！', 'All lit! Let’s tell the innkeeper!'), ...c.advance('festival'))
            else if (c.stage('festival') === 0) out.push(c.fude(`あと ${3 - n}こ！`, `${3 - n} to go!`))
            return out
          }
          if (k === 'みず' && lit(c, id)) {
            c.learn('mizu')
            c.set(`lit.${id}`, 0)
            if (c.stage('festival') === 1) c.set('tale.festival', 0)
            return [c.narrate('じゅっ… ひが きえてしまった！', 'Tsssh… the flame goes out!'), c.fude('あっ！ みずは ひを けすんだよ！', 'Whoops! Water puts out fire!')]
          }
          return null
        },
      ]),
    ),
    'v-cat': (c, k) => (k === 'ねこ' ? (c.learn('neko'), [c.say('にゃあ！', 'Meow!'), c.fude('へんじ してくれた！', 'It answered you!')]) : null),
    'v-dog': (c, k) => (k === 'いぬ' ? (c.learn('inu'), c.sparkle('dust'), [c.say('わん！ わん！', 'Woof! Woof!'), c.narrate('いぬは しっぽを ぶんぶん ふっている。', 'The dog wags its tail like mad.')]) : null),
    'v-sakura': (c, k) => {
      if (k !== 'はな') return null
      c.learn('hana')
      c.sparkle('leaf')
      const first = !c.flag('cast.v-sakura')
      c.set('cast.v-sakura')
      return [c.narrate('「はな」！ さくらの はなびらが いっせいに まいあがった！', '“Hana”! Cherry petals burst into the air!'), ...(first ? c.reward(10, 5) : [])]
    },
    'v-well': (c, k) => {
      if (k !== 'みず') return null
      c.learn('mizu')
      c.sparkle('ripple')
      const first = !c.flag('cast.v-well')
      c.set('cast.v-well')
      return [c.narrate('「みず」！ いどの そこから つめたい みずが わきあがった。', '“Mizu”! Cool water wells up from the bottom.'), ...(first ? [c.narrate('ひとくち のむと、からだが かるく なった。', 'One sip and you feel lighter.'), ...c.reward(10, 5)] : [])]
    },
  },
  mapCast: {
    village: (c, k) => {
      if (k === 'あめ') {
        c.learn('ame')
        return [c.narrate('「あめ」！ ぽつ、ぽつ… こさめが ふりだした。', '“Ame”! Pit, pat… a light rain begins.'), c.say('おや、あめだ！ はたけが よろこぶよ。', 'Oh, rain! The crops will be happy.', { jp: 'のうふ', en: 'Farmer' }, 'villager-a')]
      }
      return null
    },
  },
}

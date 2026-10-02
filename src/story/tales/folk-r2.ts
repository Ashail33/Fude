/**
 * Region 2 folklore side tales — three old stories retold in the Fields:
 *
 * - かっぱの おじぎ (the Kappa): a river imp pinches a boy's cucumbers. It
 *   challenges you to sumo, but a polite bow (こんにちは) makes it bow back
 *   and spill the water from its dish. Refill it with みず, then bring it a
 *   cucumber from the boy's family and it promises to be a good neighbour.
 * - かさじぞう (Kasa Jizō): six roadside Jizō are buried in a late snow.
 *   Melt it with ひかり, count the old hat-maker's hats (five for six), and
 *   cover the last bare head with a かさ of your own. That night, gifts.
 * - つるの おんがえし (the Crane's Return of a Favour): free a crane from a
 *   snare with your hands (て). A young weaver arrives and asks one thing:
 *   never watch her weave. Choosing to peek gently fails; waiting under the
 *   moon (つき / ほし) keeps the promise.
 *
 * Each spirit signs the Spirit Scroll and remembers the girl with the brush.
 */
import type { PlayerState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import { offer } from './r1-village'
import type { Ctx, TaleContent, TalkScript, CastScript } from './types'

const KENTA = { jp: 'けんた', en: 'Kenta' }
const KAPPA = { jp: 'かっぱ', en: 'Kappa' }
const SAKICHI = { jp: 'かさや の さきち', en: 'Sakichi the Hat-Maker' }
const JIZO = { jp: 'じぞうさま', en: 'Jizō' }
const YOHEI = { jp: 'よへい じいさん', en: 'Old Yohei' }
const TSUU = { jp: 'つう', en: 'Tsuu' }

const stageOf = (s: PlayerState, tale: string) => s.flags?.[`tale.${tale}`] ?? -1

/** The six roadside Jizō, top to bottom; the last one is left without a straw hat. */
const JIZOS = ['fk2-jizo-1', 'fk2-jizo-2', 'fk2-jizo-3', 'fk2-jizo-4', 'fk2-jizo-5', 'fk2-jizo-6'] as const
const LAST_JIZO = 'fk2-jizo-6'
const hatsOn = (c: Ctx) => c.flag('fk2.jizo.hats') > 0

// ── Kappa ────────────────────────────────────────────────────────────────

/** You bow, the kappa bows back… and out pours the water from its dish. */
function kappaBow(c: Ctx): Step[] {
  c.learn('konnichiwa')
  c.sparkle('ripple')
  c.sfx('correct')
  return [
    c.narrate('あなたは ていねいに おじぎを した。「こんにちは」', 'You bow politely. “Konnichiwa.”'),
    c.say('ケッ！？ …こ、こんにちは！', 'Kek?! …H-hello to you too!'),
    c.narrate('かっぱも ふかぶかと おじぎを かえした。…あたまの おさらから、みずが ざばーっと こぼれた！', 'The kappa bows back, deep and proper… and the water pours right out of the dish on its head!'),
    c.say('ああっ！ おさらの みずが… ちからが でない… ふにゃ…', 'Ah! My dish… without its water I’ve got no strength… flop…'),
    c.fude('かっぱは おさらの みずが いのち なんだって！ みずを あげよう！', 'A kappa’s strength lives in the water on its head! Let’s give it some water!'),
    ...c.advance('fk2-kappa'),
  ]
}

// ── Crane ────────────────────────────────────────────────────────────────

/** Waiting outside the weaving room: keep the promise under the night sky. */
function keepWaiting(c: Ctx): Step[] {
  return [
    c.narrate('あなたは しょうじの まえに すわって、まった。とん、とん、からり…', 'You sit down outside the paper screen and wait. Ton, ton, karari…'),
    c.narrate('ひが くれて、あたりが まっくらに なった。', 'The sun sets and everything goes dark.'),
    c.fude('くらいと さみしいね。そらに あかりを ともして、いっしょに まとう。', 'It’s lonely in the dark. Let’s light up the sky and wait with her.'),
    c.cast({ jp: 'よぞらに ことばを となえよう', en: 'Cast a word into the night sky' }, (k) => {
      if (k !== 'つき' && k !== 'ほし') {
        if (k === 'ひ' || k === 'ほのお') return [c.fude('ひは だめ！ はたおりの へやが もえちゃう！ よぞらに ある ものは…？', 'No fire — the weaving room would burn! What shines in the night sky…?'), c.fude('もう いちど しょうじに はなしかけよう。', 'Let’s try again at the screen.')]
        return [c.narrate('よるは しずかな まま…', 'The night stays dark and still…'), c.fude('よるの そらで ひかる ものは…？ もう いちど ためそう。', 'What glows in the night sky…? Let’s try again.')]
      }
      c.learn(k === 'つき' ? 'tsuki' : 'hoshi')
      c.sparkle('spark')
      c.sfx('correct')
      return [
        c.narrate(k === 'つき' ? '「つき」！ まるい つきが のぼって、にわを ぎんいろに てらした。' : '「ほし」！ ほしが いっぱい またたいて、にわを やさしく てらした。', k === 'つき' ? '“Tsuki”! A round moon rises and paints the yard silver.' : '“Hoshi”! Countless stars twinkle and light the yard softly.'),
        c.narrate('あなたは いちども のぞかずに、あさまで まった。', 'You wait until morning, and never once peek.'),
        c.narrate('しょうじが すっと ひらいた。つうが、すこし やせた かおで でてきた。', 'The screen slides open. Tsuu steps out, looking a little thinner.'),
        c.say('…まって いて くれたのね。ほんとうに、いちども みなかった。', '…You waited. And you truly never looked.', TSUU, 'villager-b'),
        c.say('これを、よへいさんに わたして ください。', 'Please give this to Yohei.', TSUU, 'villager-b'),
        ...c.give('fk2-crane-cloth'),
        ...c.advance('fk2-tsuru'),
      ]
    }),
  ]
}

// ── Jizō ─────────────────────────────────────────────────────────────────

/** Talking to one of the six Jizō. */
function jizoTalk(id: (typeof JIZOS)[number]): TalkScript {
  return (c) => {
    const st = c.stage('fk2-jizo')
    if (st < 0) return [c.narrate('みちばたの おじぞうさまが、ゆきに うもれて ふるえている みたいだ。', 'The roadside Jizō are buried in snow. They almost seem to shiver.'), c.fude('はるなのに ゆき？ ちかくの ひとに きいて みよう。', 'Snow, in spring? Let’s ask someone nearby.')]
    if (st === 0) return [c.narrate('あたまにも かたにも、ゆきが どっさり。', 'Snow is piled on their heads and shoulders.'), c.fude('つめたそう… あたたかい「ひかり」で とかして あげよう！', 'They look so cold… Let’s melt it with warm light — ひかり!')]
    if (st === 1) return [c.narrate('ゆきが とけて、おじぞうさまが すこし ほほえんだ ように みえた。', 'With the snow gone, the Jizō seem to be smiling a little.'), c.fude('さきちさんに しらせよう！', 'Let’s tell Sakichi!')]
    if (st === 2) {
      if (!hatsOn(c)) {
        if (!c.has('fk2-straw-hats')) return [c.fude('かさが ない… さきちさんの ところへ もどろう。', 'We don’t have the hats… let’s go back to Sakichi.')]
        c.take('fk2-straw-hats')
        c.set('fk2.jizo.hats')
        c.sparkle('leaf')
        return [
          c.narrate('ひとり、ふたり… あなたは おじぞうさまに ひとつずつ かさを かぶせた。', 'One, two… you place a straw hat on each Jizō in turn.'),
          c.narrate('五つめの かさで、てが からっぽに なった。いちばん さいごの おじぞうさまだけ、あたまが まるだし だ。', 'With the fifth hat your hands are empty. Only the very last Jizō is still bare-headed.'),
          c.fude('あと 一つ… そうだ！ わたしたちには ことばが ある。いちばん さいごの おじぞうさまに「かさ」を となえよう！', 'One short… Wait! We have words! Let’s cast かさ at the very last Jizō!'),
        ]
      }
      if (id === LAST_JIZO) return [c.narrate('この おじぞうさまだけ、かさが ない。', 'Only this Jizō has no hat.'), c.fude('「かさ」を となえて あげよう！', 'Let’s cast かさ for it!')]
      return [c.narrate('わらの かさを かぶって、ほっと した かお。', 'Wearing its straw hat, this Jizō looks relieved.')]
    }
    if (id === LAST_JIZO) return [c.narrate('この おじぞうさまは、ちいさな かさを さして にこにこ している。', 'This Jizō holds a little umbrella and beams.')]
    return [c.narrate('わらの かさを かぶった おじぞうさま。どこか うれしそう。', 'A Jizō in a straw hat. It looks quietly happy.')]
  }
}

/** A word cast at one of the six Jizō. */
function jizoCast(id: (typeof JIZOS)[number]): CastScript {
  return (c, k) => {
    const st = c.stage('fk2-jizo')
    if (k === 'ひかり') {
      c.learn('hikari')
      c.sparkle('spark')
      if (st !== 0) return [c.narrate('あたたかい ひかりが おじぞうさまを つつんだ。', 'Warm light wraps around the Jizō.')]
      c.sfx('correct')
      return [
        c.narrate('「ひかり」！ おひさまの ような ひかりが みちに あふれて…', '“Hikari”! Light like a little sun spills across the road…'),
        c.narrate('じゅわっ。六人の おじぞうさまの ゆきが、みるみる とけた。', 'Hiss. The snow on all six Jizō melts away before your eyes.'),
        c.fude('とけた！ さきちさんに しらせよう！', 'It’s melted! Let’s tell Sakichi!'),
        ...c.advance('fk2-jizo'),
      ]
    }
    if (k === 'ひ' || k === 'ほのお') {
      c.learn(k === 'ひ' ? 'hi' : 'honoo')
      return [c.fude('まって！ おじぞうさまに 火は だめ！ もっと やさしい あかりに しよう…「ひかり」！', 'Wait! No fire on a Jizō! Something gentler… like ひかり, light!')]
    }
    if (k === 'かぜ') {
      c.learn('kaze')
      c.sparkle('leaf')
      return [c.narrate('「かぜ」！ ゆきが すこし とんだけど、また ふりつもった。', '“Kaze”! A little snow blows off, but more drifts right back.')]
    }
    if (k === 'ゆき') {
      c.learn('yuki')
      return [c.narrate('ゆきが もっと ふってきた…！', 'Even more snow comes down…!'), c.fude('ぎゃくだよ〜！', 'That’s the opposite of what we want!')]
    }
    if (k === 'かさ') {
      c.learn('kasa')
      if (st === 2 && hatsOn(c)) {
        if (id !== LAST_JIZO) return [c.fude('この おじぞうさまは もう かさを かぶってる。いちばん さいごの おじぞうさまだよ！', 'This one already has a hat. It’s the very last Jizō that needs one!')]
        c.sparkle('spark')
        c.sfx('correct')
        return [
          c.narrate('「かさ」！ ぽんっ！ おじぞうさまの てに、ちいさな かさが ひらいた。', '“Kasa”! Pop! A little umbrella opens in the Jizō’s hands.'),
          c.fude('ふふ。むかしの わらの ぼうしも「かさ」って いうんだよ。かさは かさ でも、ちょっと ちがうけどね！', 'Hehe. Those old straw hats are called かさ too — a different かさ, but it keeps the snow off just the same!'),
          c.narrate('六人の おじぞうさまが、みんな あたたかそうに ならんでいる。', 'All six Jizō now stand snug in a row.'),
          ...c.advance('fk2-jizo'),
        ]
      }
      if (st === 2) return [c.fude('さきに、さきちさんの わらの かさを かぶせて あげよう。', 'Let’s put Sakichi’s straw hats on them first.')]
      return [c.narrate('ちいさな かさが ひらいて、すぐ とじた。', 'A little umbrella pops open, then folds away again.')]
    }
    return null
  }
}

export const FIELDS_FOLK: TaleContent = {
  yokai: [
    {
      id: 'kappa',
      region: 2,
      name: 'Kappa',
      jp: 'かっぱ',
      kana: 'かっぱ',
      emoji: '🥒',
      lore: 'Kappa are river imps with a turtle’s shell, a beak and a dish of water on top of their heads that holds all their strength. They play tricks on people by the water and love cucumbers more than anything. But a kappa is terribly polite: bow to one, and it must bow back, spilling its water.',
      hint: 'Something green watches from the river, waiting for someone with good manners.',
      words: ['konnichiwa', 'mizu', 'kawa'],
    },
    {
      id: 'kasa-jizo',
      region: 2,
      name: 'Kasa Jizō',
      jp: 'かさじぞう',
      kana: 'かさじぞう',
      emoji: '🗿',
      lore: 'On a snowy New Year’s Eve, a poor old hat-maker who had sold nothing passed six stone Jizō standing in the snow. He gave them his unsold straw hats, and his own cloth for the last one, and went home with nothing. That night the statues came walking through the snow, singing, and left rice and treasures at his door.',
      hint: 'Six stone friends stand by the south road, waiting for someone to notice the cold.',
      words: ['hikari', 'kasa', 'ichi', 'yuki'],
    },
    {
      id: 'tsuru',
      region: 2,
      name: 'Tsuru, the Grateful Crane',
      jp: 'つる',
      kana: 'つる',
      emoji: '🕊️',
      lore: 'A poor old man freed a crane caught in a trap. Soon a young woman came to stay and wove cloth more beautiful than any in the land, asking only that no one ever watch her at the loom. When curiosity won and the door was opened, a crane was seen weaving with her own feathers, and she had to fly away.',
      hint: 'A white bird cries in the reeds. Some kindnesses are repaid in thread.',
      words: ['te', 'tsuki', 'hoshi', 'tori'],
    },
  ],
  items: [
    { id: 'fk2-cucumber', name: 'Crisp Cucumber', jp: 'きゅうり', kana: 'きゅうり', emoji: '🥒', desc: 'Fresh from Kenta’s family garden, still cool from the well. A kappa’s favourite thing in the world.' },
    { id: 'fk2-kappa-salve', name: 'Kappa Salve', jp: 'かっぱの くすり', kana: 'かっぱのくすり', emoji: '🫙', desc: 'A secret river-weed ointment. Kappa are said to know the best cures for bumps and bruises.' },
    { id: 'fk2-straw-hats', name: 'Straw Hats', jp: 'わらの かさ', kana: 'わらのかさ', emoji: '👒', desc: 'Five woven straw hats nobody bought at market. Plain, but warm.' },
    { id: 'fk2-jizo-mochi', name: 'Jizō’s Mochi', jp: 'じぞうさまの おもち', kana: 'じぞうさまのおもち', emoji: '🍡', desc: 'Found at dawn by Sakichi’s door, with little stone footprints in the snow.' },
    { id: 'fk2-crane-cloth', name: 'Crane Cloth', jp: 'つるの ぬの', kana: 'つるのぬの', emoji: '🧵', desc: 'Shimmering white cloth, light as a feather. You never saw how it was made.' },
    { id: 'fk2-crane-feather', name: 'Crane Feather', jp: 'つるの はね', kana: 'つるのはね', emoji: '🪶', desc: 'A single white feather. It feels like a promise kept.' },
  ],
  tales: [
    {
      id: 'fk2-kappa',
      region: 2,
      yokai: 'kappa',
      title: 'The Kappa’s Bow',
      jp: 'かっぱの おじぎ',
      summary: 'Kenta’s cucumbers keep vanishing, and something splashes anyone who goes near the river.',
      giver: 'fk2-kenta',
      stages: [
        { en: 'Find the kappa at the river bend, north of the bridge', jp: 'はしの きたの 川べで かっぱを さがそう', target: ['fk2-kappa'], map: 'fields' },
        { en: 'The kappa’s dish is empty! Refill it with a water word', jp: 'かっぱの おさらが からっぽ！ みずの ことばで みたそう', target: ['fk2-kappa'], map: 'fields' },
        { en: 'Ask Kenta for a cucumber for the hungry kappa', jp: 'けんたに きゅうりを わけて もらおう', target: ['fk2-kenta'], map: 'fields' },
        { en: 'Bring the cucumber to the kappa', jp: 'かっぱに きゅうりを とどけよう', target: ['fk2-kappa'], map: 'fields' },
      ],
    },
    {
      id: 'fk2-jizo',
      region: 2,
      yokai: 'kasa-jizo',
      title: 'Straw Hats for the Jizō',
      jp: 'かさじぞう',
      summary: 'A late snow has buried the six roadside Jizō, and old Sakichi’s knees are too stiff to help.',
      giver: 'fk2-sakichi',
      stages: [
        { en: 'Melt the snow off the six Jizō by the south road (something warm and gentle…)', jp: 'みなみの みちの じぞうさま 六人の ゆきを とかそう（あたたかくて やさしい ことば…）', target: [...JIZOS], map: 'fields' },
        { en: 'Tell Sakichi the snow is gone', jp: 'さきちに ゆきが とけたと つたえよう', target: ['fk2-sakichi'], map: 'fields' },
        { en: 'Put the straw hats on the Jizō, and cover the last bare head with a word', jp: 'じぞうさまに かさを かぶせよう。さいごの 一人には ことばで', target: [...JIZOS], map: 'fields' },
        { en: 'Night falls. Go back to Sakichi', jp: 'よるに なった。さきちの ところへ もどろう', target: ['fk2-sakichi'], map: 'fields' },
      ],
    },
    {
      id: 'fk2-tsuru',
      region: 2,
      yokai: 'tsuru',
      title: 'The Crane’s Return',
      jp: 'つるの おんがえし',
      summary: 'Old Yohei hears a crane crying in the reeds, caught in a snare.',
      giver: 'fk2-yohei',
      stages: [
        { en: 'Free the crane in the reeds to the north, gently, with your own hands', jp: 'きたの くさむらの つるを たすけよう（やさしく、じぶんの 手で）', target: ['fk2-crane'], map: 'fields' },
        { en: 'A young woman has come to Yohei’s. Talk to her', jp: 'よへいの ところに わかい むすめが きた。はなしかけよう', target: ['fk2-tsuu'], map: 'fields' },
        { en: 'Wait by the weaving room, and keep your promise', jp: 'はたおりの へやの まえで まとう。やくそくを まもって', target: ['fk2-loom'], map: 'fields' },
        { en: 'Bring Tsuu’s cloth to Old Yohei', jp: 'つうの ぬのを よへいに とどけよう', target: ['fk2-yohei'], map: 'fields' },
      ],
    },
  ],
  entities: {
    fields: [
      { id: 'fk2-kenta', kind: 'npc', sprite: 'child', x: 29, y: 19, dir: 'up', name: KENTA, lines: [{ jp: 'かわで およぎたいなあ。', en: 'I wish I could go swimming in the river.' }] },
      { id: 'fk2-kappa', kind: 'npc', sprite: 'kappa', x: 29, y: 11, dir: 'left', name: KAPPA, lines: [{ jp: 'ケケッ。', en: 'Kek-kek.' }] },
      { id: 'fk2-sakichi', kind: 'npc', sprite: 'elder', x: 24, y: 19, dir: 'left', name: SAKICHI, lines: [{ jp: 'かさは いらんかね〜。わらの かさだよ〜。', en: 'Straw hats! Who needs a straw hat?' }] },
      ...JIZOS.map((id, i) => ({ id, kind: 'landmark' as const, tile: 'statue' as const, x: 21, y: 20 + i, name: JIZO, lines: [{ jp: 'みちばたの おじぞうさま。', en: 'A little roadside Jizō statue.' }] })),
      { id: 'fk2-yohei', kind: 'npc', sprite: 'villager-a', x: 43, y: 8, dir: 'left', name: YOHEI, lines: [{ jp: 'まずしいが、こころは ゆたかに いきたいもんだ。', en: 'I may be poor, but I try to be rich at heart.' }] },
      { id: 'fk2-loom', kind: 'landmark', tile: 'noren', x: 43, y: 6, name: { jp: 'はたおりの へや', en: 'Weaving Room' }, lines: [{ jp: 'よへいの こやの はたおりの へや。しょうじが しまっている。', en: 'The weaving room of Yohei’s hut. The paper screen is shut.' }] },
      { id: 'fk2-tsuu', kind: 'npc', sprite: 'villager-b', x: 42, y: 7, dir: 'down', name: TSUU, lines: [{ jp: 'こんにちは。', en: 'Hello.' }] },
      { id: 'fk2-crane', kind: 'npc', sprite: 'wisp', x: 34, y: 3, dir: 'down', name: { jp: 'つる', en: 'Crane' }, lines: [{ jp: 'クルル…', en: 'Krrroo…' }] },
    ],
  },
  visible: {
    // In the snare until freed; back on the reeds as a friend once the tale is done.
    'fk2-crane': (s) => stageOf(s, 'fk2-tsuru') <= 0 || stageOf(s, 'fk2-tsuru') >= 4,
    // Tsuu is only seen outside while she asks her promise; then she is at the loom.
    'fk2-tsuu': (s) => stageOf(s, 'fk2-tsuru') === 1,
  },
  talk: {
    // ── Kappa ──
    'fk2-kenta': (c) => {
      const st = c.stage('fk2-kappa')
      if (st < 0)
        return offer(c, 'fk2-kappa', [
          c.say('ねえ、きいて！ うちの はたけの きゅうりが、まいばん なくなるの。', 'Hey, listen! Every night, cucumbers vanish from our garden.'),
          c.say('それに 川に ちかづくと、だれかが みずを ばしゃって かけてくる！', 'And whenever I go near the river, someone splashes me!'),
          c.fude('きゅうりが すきで、川に すむ… それって、かっぱ かも！', 'Loves cucumbers, lives in the river… that sounds like a kappa!'),
          c.say('かっぱ！？ …あの、はなしを して きて くれる？', 'A kappa?! …Could you go and talk to it?'),
        ])
      if (st === 0) return [c.say('かっぱは はしの きたの 川べに いるよ。すもうが つよいって きいた…', 'The kappa’s up by the river, north of the bridge. They say it’s super strong at sumo…'), c.fude('ちからくらべより、いい ほうほうが あるかも。', 'Maybe there’s a better way than a contest of strength.')]
      if (st === 1) return [c.say('え、かっぱが ぐったり してる？ 早く みずを あげて！', 'The kappa’s all floppy? Quick, give it water!')]
      if (st === 2)
        return [
          c.say('かっぱ、おなかが すいてたんだ… それに、だれも あいさつ して くれなかったんだね。', 'The kappa was hungry… and nobody ever said hello to it.'),
          c.say('じゃあ、これ！ いちばん おいしい きゅうり。「こんにちは」って いって わたしてね。', 'Then here! Our tastiest cucumber. Say “konnichiwa” when you give it.'),
          ...c.give('fk2-cucumber'),
          ...c.advance('fk2-kappa'),
        ]
      if (st === 3) return [c.say('きゅうり、よろこんで くれるかな？', 'Do you think it’ll like the cucumber?')]
      return [c.say('きょう かっぱと すもう したよ！ おじぎ したら、ぼくが かった！', 'I did sumo with the kappa today! I bowed first, and I won!')]
    },
    'fk2-kappa': (c) => {
      const st = c.stage('fk2-kappa')
      if (st < 0) return [c.narrate('みどりいろの なにかが、ちゃぽんと 川に もぐった。', 'Something green ducks under the river with a plop.'), c.fude('いまの、かっぱ…？ ちかくの 子に きいて みよう。', 'Was that… a kappa? Let’s ask the kid nearby.')]
      if (st === 0)
        return [
          c.narrate('川から、みどりの かっぱが ざばっと でてきた。あたまの おさらに みずが きらきら。', 'A green kappa bursts up out of the river, the dish on its head brimming with water.'),
          c.say('ケケッ！ おまえ、すもう しよう！ かったら きゅうりは ぜんぶ おれの もの！', 'Kek-kek! You! Sumo, now! If I win, every cucumber is mine!'),
          c.choice({ jp: 'どうする？', en: 'What will you do?' }, [['sumo', 'すもう を とる', 'Wrestle it'], ['bow', 'おじぎして「こんにちは」', 'Bow and say “konnichiwa”'], ['run', 'にげる', 'Back away']], (id) => {
            if (id === 'bow') return kappaBow(c)
            if (id === 'sumo') return [c.narrate('はっけよい… ざぶーん！ あなたは 川に なげとばされた。', 'Hakkeyoi… SPLASH! You’re thrown straight into the river.'), c.say('ケケケ！ おれの かち！', 'Kekeke! I win!'), c.fude('つ、つよい… ちからじゃ かてないね。もっと ていねいに いって みよう。', 'S-so strong… We can’t win on muscle. Let’s try being polite.')]
            return [c.say('ケッ、よわむし〜！', 'Kek, scaredy-cat!'), c.fude('また はなしかけよう。こんどは ちがう ほうほうで。', 'Let’s talk to it again, and try something different.')]
          }),
        ]
      if (st === 1) return [c.say('ふにゃ… おさらが… かわいてる…', 'Flop… my dish… so dry…'), c.fude('みずの ことばを となえよう！', 'Let’s cast a water word!')]
      if (st === 2) return [c.say('きゅうり… たべたいなあ… ちゃんと ください って いえば よかった…', 'Cucumber… I wish I’d just asked nicely…'), c.fude('けんたに はなして みよう。', 'Let’s talk to Kenta.')]
      if (st === 3) {
        if (!c.has('fk2-cucumber')) return [c.say('きゅうり…？', 'Cucumber…?'), c.fude('けんたに もう いちど あおう。', 'Let’s see Kenta again.')]
        c.take('fk2-cucumber')
        c.learn('konnichiwa')
        return [
          c.narrate('あなたは おじぎを して、きゅうりを さしだした。「こんにちは」', 'You bow and hold out the cucumber. “Konnichiwa.”'),
          c.say('こ、こんにちは！ …おさらを おさえて、と。', 'H-hello! …Holding my dish this time.'),
          c.narrate('ぽりぽり ぽりぽり。かっぱは しあわせそうに きゅうりを たべた。', 'Crunch, crunch. The kappa munches its cucumber, blissful.'),
          c.say('ケケ… うまい！ もう きゅうりは とらない。みずも かけない。やくそく する！', 'Kek… delicious! No more stealing cucumbers. No more splashing. I promise!'),
          c.say('おれいに、かっぱの ひみつの くすり。けがを したら ぬるといい。', 'Here, a thank-you: the kappa’s secret salve. Rub it on any bump or scrape.'),
          ...c.give('fk2-kappa-salve'),
          ...c.reward(60, 25),
          ...c.advance('fk2-kappa'),
          ...c.seal('kappa'),
          c.say('…むかし、ふでを もった 女の子が、この 川に「かわ」って なまえを くれたんだ。おれに さいしょに おじぎ したのも、あの子だった。', '…Long ago, a girl with a brush gave this river its name, かわ. She was the first one who ever bowed to me, too.'),
          c.fude('ふでを もった 女の子…？ なんだか、むねが ぎゅっと する。だれ なんだろう…', 'A girl with a brush…? Something just tugged at my heart. Who was she…?'),
        ]
      }
      return [c.narrate('かっぱは おさらを おさえながら、ていねいに おじぎした。', 'The kappa bows politely, one hand holding its dish.'), c.say('ケケ♪ こんにちは！', 'Kek-kek♪ Konnichiwa!')]
    },
    // ── Jizō ──
    'fk2-sakichi': (c) => {
      const st = c.stage('fk2-jizo')
      if (st < 0)
        return offer(c, 'fk2-jizo', [
          c.say('ゆうべ、やまから へんな ゆきが ふってきてな。この みちだけ まっしろ なんじゃ。', 'Last night a strange snow came down off the mountain. Only this road turned white.'),
          c.say('みちばたの おじぞうさまが 六人、ゆきに うもれて さむそうで…', 'The six Jizō by the road are buried in it. They look so cold…'),
          c.say('わしは ひざが いたくて、ゆきかきも できん。たのめるかね？', 'My knees are too stiff to dig them out. Could I ask you?'),
        ])
      if (st === 0) return [c.say('おじぞうさまは この みちの にしがわに ならんどる。', 'The Jizō stand in a row on the west side of this road.'), c.fude('あたたかくて やさしい ことば… なんだろう？', 'A warm, gentle word… what could it be?')]
      if (st === 1)
        return [
          c.say('おお、ゆきが とけた！ ありがとう。', 'Oh, the snow’s melted! Thank you.'),
          c.say('でも まだ さむそうじゃ。うれのこりの わらの かさを かぶせて あげたいんじゃが…', 'But they still look cold. I’d like to give them my unsold straw hats, only…'),
          c.say('かさは 五つ。おじぞうさまは 六人。', 'I have five hats. And there are six Jizō.'),
          c.ask({ jp: 'かさは いくつ たりない？（すうじを よみで）', en: 'How many hats short is he? (say the number in Japanese)' }, ['いち', 'ひとつ', '一', '1'], (ok) => {
            if (!ok) return [c.say('ううん… 五と 六… ゆびで かぞえて ごらん。', 'Hmm… five and six… try counting on your fingers.'), c.fude('もう いちど さきちさんに はなしかけよう。', 'Let’s talk to Sakichi again.')]
            c.learn('ichi')
            c.sfx('correct')
            return [
              c.say('そう、一つ たりん。…まあ、まずは 五つ かぶせて あげて おくれ。', 'Right, one short. …Well, put the five on them for now.'),
              ...c.give('fk2-straw-hats'),
              ...c.advance('fk2-jizo'),
            ]
          }),
        ]
      if (st === 2) return [c.say('さいごの おじぞうさまは どうしようかのう…', 'Whatever shall we do about the last Jizō…'), c.fude('わたしたちの ことばで なんとか できるかも！', 'Maybe our words can help!')]
      if (st === 3)
        return [
          c.narrate('その よる。ゆきの みちから、ふしぎな うたが きこえてきた。', 'That night, a strange song drifts in from the snowy road.'),
          c.narrate('「えっさ、ほいさ… かさを くれた ひとの いえは どこ…」', '“Heave-ho, heave-ho… where is the house of the one who gave us hats…”'),
          c.narrate('あさに なると、さきちの まえに おもちや おこめが どっさり。ゆきには ちいさな いしの あしあと。', 'At dawn, mochi and rice are piled up in front of Sakichi — and in the snow, tiny stone footprints.'),
          c.say('な、なんと… おじぞうさまが きて くださったんじゃ！ あんたの おかげじゃ。', 'W-well I never… the Jizō came to visit! This is all thanks to you.'),
          c.say('ほれ、いちばん おいしそうな おもちを もって いきなされ。', 'Here, take the tastiest-looking mochi.'),
          ...c.give('fk2-jizo-mochi'),
          ...c.reward(70, 30),
          ...c.advance('fk2-jizo'),
          ...c.seal('kasa-jizo'),
          c.say('…ふでの 女の子も、むかし わしらの ゆきを はらって くれた。いつも うしろを ふりかえって、なにかの かげを きに していたが…', '…Long ago, the girl with the brush brushed the snow from us too. She kept glancing over her shoulder, as if a shadow were following her…', JIZO),
          c.fude('かげ…？ あの子は なにに おいかけられて いたの？ もっと しりたい…！', 'A shadow…? What was following her? I want to know more…!'),
        ]
      return [c.say('おじぞうさまに あったら、よろしく いって おくれ。', 'If you pass the Jizō, give them my regards.')]
    },
    ...Object.fromEntries(JIZOS.map((id) => [id, jizoTalk(id)])),
    // ── Crane ──
    'fk2-yohei': (c) => {
      const st = c.stage('fk2-tsuru')
      if (st < 0)
        return offer(c, 'fk2-tsuru', [
          c.say('きこえるかい？ きたの くさむらで、つるが ないて いるんじゃ。', 'Hear that? A crane is crying in the reeds to the north.'),
          c.say('だれかの わなに かかって しまった らしい。わしの あしでは まにあわん…', 'It seems to be caught in someone’s snare. My old legs won’t get me there in time…'),
        ])
      if (st === 0) return [c.say('つるは きたの くさむらじゃ。そっと、やさしくな。', 'The crane is in the reeds to the north. Gently, now.')]
      if (st === 1) return [c.say('ゆうべ、つうと いう むすめさんが とまりに きてな。はなしを して ごらん。', 'Last night a young woman called Tsuu came asking for shelter. Go and talk to her.')]
      if (st === 2) return [c.say('つうは へやに こもって、なにかを おって おる。…みないで ほしい そうじゃ。', 'Tsuu has shut herself in the weaving room. …She asked that no one look.')]
      if (st === 3) {
        if (!c.has('fk2-crane-cloth')) return [c.say('つうは どうしたかね？', 'How is Tsuu?')]
        c.take('fk2-crane-cloth')
        c.sparkle('spark')
        return [
          c.narrate('あなたは よへいに ぬのを わたした。ゆきの ように しろくて、ひかりに すけて きらきら している。', 'You hand Yohei the cloth. It is white as snow and glitters when the light passes through it.'),
          c.say('なんと うつくしい… これは うれん。だいじに しまって おこう。', 'How beautiful… I could never sell this. I’ll treasure it always.'),
          c.say('…よへいさん。ほんとうの ことを いわせて ください。', '…Yohei. Please let me tell you the truth.', TSUU, 'villager-b'),
          c.say('わたしは、あの ひ わなから たすけて もらった つる です。', 'I am the crane you saved from the snare that day.', TSUU, 'villager-b'),
          c.say('やくそくを まもって くれた から、じぶんの くちで いえました。ありがとう。', 'Because you kept your promise, I could say it with my own voice. Thank you.', TSUU, 'villager-b'),
          c.narrate('つうは しろい つるの すがたに もどり、あなたの まわりを ひとまわり した。ひらりと はねが 一まい おちた。', 'Tsuu becomes a white crane once more and circles around you. A single feather drifts down.'),
          ...c.give('fk2-crane-feather'),
          ...c.reward(75, 35),
          ...c.advance('fk2-tsuru'),
          ...c.seal('tsuru'),
          c.say('…むかし、ふでの 女の子が、かあさんの うたを かきとめて くれた。かげが きて、とりの うたを たべて しまった よるに。', '…Long ago, the girl with the brush wrote down my mother’s song, the night a shadow came and ate the birdsong.', TSUU, 'villager-b'),
          c.fude('うたを たべる かげ…？ わたし、それを しってる きが する…', 'A shadow that eats songs…? I feel like I’ve seen it somewhere…'),
        ]
      }
      return [c.say('つうは ふゆに なると、ときどき かおを みせに くるんじゃ。', 'When winter comes, Tsuu sometimes drops by to visit.')]
    },
    'fk2-crane': (c) => {
      const st = c.stage('fk2-tsuru')
      if (st < 0) return [c.narrate('しろい つるが わなに あしを とられて、くるしそうに ないている。', 'A white crane is caught by the leg in a snare, crying out in pain.'), c.fude('たいへん！ だれか、この つるを しってる ひとは いないかな？', 'Oh no! Does anyone around here know about this crane?')]
      if (st === 0) return [c.narrate('つるは わなに からまって、うごけない。', 'The crane is tangled in the snare and can’t move.'), c.fude('まほうで きずつけちゃ だめ。やさしく、じぶんの「て」で ほどこう！', 'Magic might hurt it. Let’s untie it gently with our own hands — て!')]
      return [c.narrate('しろい つるが くさむらで はねを やすめている。あなたを みて、ちいさく おじぎした。', 'The white crane rests its wings in the reeds. It sees you and dips its head in a small bow.')]
    },
    'fk2-tsuu': (c) => {
      if (c.stage('fk2-tsuru') !== 1) return null
      return [
        c.say('はじめまして。つう と もうします。たびの とちゅうで、よへいさんに とめて いただきました。', 'How do you do. My name is Tsuu. Yohei kindly gave me shelter on my travels.'),
        c.say('おれいに、ぬのを おりたいのです。でも、ひとつだけ おねがいが あります。', 'I would like to weave some cloth to thank him. But I have one request.'),
        c.say('わたしが はたを おって いる あいだ、ぜったいに へやを のぞかないで ください。', 'While I am weaving, please, never look into the room.'),
        c.choice({ jp: 'やくそく する？', en: 'Will you promise?' }, [['yes', 'やくそく する', 'I promise'], ['no', 'どうして？', 'Why not?']], (id) => {
          if (id === 'no') return [c.say('…それは、いえないのです。ごめんなさい。', '…That, I cannot tell you. I’m sorry.'), c.fude('なにか わけが あるんだね。また はなしかけよう。', 'She must have her reasons. Let’s talk to her again.')]
          return [c.say('ありがとう。…では、はじめます。', 'Thank you. …Then I shall begin.'), c.narrate('つうは はたおりの へやに はいり、しょうじを しめた。', 'Tsuu steps into the weaving room and slides the screen shut.'), ...c.advance('fk2-tsuru')]
        }),
      ]
    },
    'fk2-loom': (c) => {
      const st = c.stage('fk2-tsuru')
      if (st === 1) return [c.narrate('しょうじが しまっている。…つうは まだ そとに いる。', 'The screen is shut. …Tsuu is still outside.')]
      if (st === 3) return [c.narrate('はたおりの へやは しずか。とんとん からりの おとは もう しない。', 'The weaving room is quiet now. No more ton-ton karari.')]
      if (st !== 2) return null
      return [
        c.narrate('しょうじの むこうから、はたおりの おとが きこえる。とん、とん、からり…', 'From behind the screen comes the sound of a loom. Ton, ton, karari…'),
        c.narrate('しょうじに ほんの すこし、すきまが ある。', 'There is the tiniest gap in the screen.'),
        c.choice({ jp: 'どうする？', en: 'What will you do?' }, [['wait', 'しずかに まつ', 'Wait quietly'], ['call', 'こえを かける', 'Call out softly'], ['peek', 'すきまから のぞく', 'Peek through the gap']], (id) => {
          if (id === 'wait') return keepWaiting(c)
          if (id === 'call') return [c.say('…もう すこし、まって いて ください。', '…Please wait just a little longer.', TSUU, 'villager-b'), c.fude('こえは げんき そう。まって あげよう。', 'She sounds all right. Let’s keep waiting.')]
          c.sfx('wrong')
          return [
            c.narrate('あなたは そっと かおを ちかづけた。…しろい はねが、ちらりと みえた きが した。', 'You lean in close. …For a moment you think you see a flash of white feathers.'),
            c.narrate('はたおりの おとが、ぴたりと とまった。', 'The loom falls suddenly silent.'),
            c.say('…みないで、と いったのに。', '…I asked you not to look.', TSUU, 'villager-b'),
            c.fude('…やくそく したのに、ごめんなさい。つうは まだ いて くれてる。こんどこそ、ちゃんと まとう。', '…We promised, and we broke it. I’m sorry. She’s still here, though. This time, let’s wait properly.'),
            c.narrate('しばらく すると、とん… とん… と、おとが ゆっくり もどってきた。', 'After a while, slowly, the ton… ton… of the loom begins again.'),
          ]
        }),
      ]
    },
  },
  cast: {
    'fk2-kappa': (c, k) => {
      const st = c.stage('fk2-kappa')
      if (k === 'こんにちは' || k === 'こんにちわ') {
        if (st === 0) return kappaBow(c)
        c.learn('konnichiwa')
        if (st < 0) return [c.narrate('川の 中から「…ケ？」と こえが した。', 'A small “…kek?” comes from under the water.')]
        return [c.narrate('かっぱは おさらを りょうてで おさえながら おじぎした。', 'The kappa bows, both hands clamped over its dish.'), c.say('こんにちは！ ケケ♪', 'Konnichiwa! Kek-kek♪')]
      }
      if (k === 'みず' || k === 'かわ') {
        c.learn(k === 'みず' ? 'mizu' : 'kawa')
        c.sparkle('ripple')
        if (st !== 1) return [c.narrate('ぱしゃっ！ かっぱは きもちよさそうに みずを あびた。', 'Splash! The kappa happily soaks it up.')]
        c.sfx('correct')
        return [
          c.narrate(k === 'みず' ? '「みず」！ つめたい みずが、おさらに なみなみ そそがれた。' : '「かわ」！ 川の みずが ぴょんと はねて、おさらを いっぱいに した。', k === 'みず' ? '“Mizu”! Cool water fills the dish to the brim.' : '“Kawa”! A splash of river leaps up and fills the dish to the brim.'),
          c.say('ケケッ！ ちからが もどった！ …おまえ、やさしいな。', 'Kek-kek! My strength is back! …You’re kind, you know.'),
          c.say('…ほんとは、おなかが すいてたんだ。だれも あいさつ して くれないから、いたずら ばかり してた。', '…Truth is, I was hungry. And nobody ever says hello to me, so I just played tricks.'),
          c.fude('けんたに はなして、きゅうりを わけて もらおう！', 'Let’s tell Kenta and ask if he’ll share a cucumber!'),
          ...c.advance('fk2-kappa'),
        ]
      }
      if (k === 'きゅうり') return [c.say('きゅうり！？ どこ！？ どこ！？', 'Cucumber?! Where?! Where?!')]
      if (k === 'さかな') {
        c.learn('sakana')
        return [c.say('さかなも すきだけど… いちばんは きゅうり！', 'I like fish too… but cucumbers are the best!')]
      }
      if (k === 'ひ' || k === 'ほのお') {
        c.learn(k === 'ひ' ? 'hi' : 'honoo')
        return [c.say('あちち！ おさらが かわく〜！', 'Hot, hot! My dish is drying out!'), c.fude('かっぱに 火は だめだね…', 'No fire near a kappa…')]
      }
      return null
    },
    ...Object.fromEntries(JIZOS.map((id) => [id, jizoCast(id)])),
    'fk2-sakichi': (c, k) => {
      if (k !== 'かさ') return null
      c.learn('kasa')
      return [c.say('ほっほ、かさかね？ わしの かさは、あめも ゆきも ふせぐ わらの かさじゃよ。', 'Ho ho, a kasa? Mine are straw kasa — they keep off rain and snow alike.')]
    },
    'fk2-crane': (c, k) => {
      const st = c.stage('fk2-tsuru')
      if (k === 'て') {
        c.learn('te')
        if (st !== 0) return [c.narrate('つるが あなたの てに そっと くちばしを よせた。', 'The crane gently touches its beak to your hand.')]
        c.sparkle('leaf')
        c.sfx('correct')
        return [
          c.narrate('「て」！ あなたは じぶんの 手で、わなの なわを ひとつ ひとつ ほどいた。', '“Te”! With your own hands you untie the snare, knot by knot.'),
          c.narrate('つるは おおきく はねを ひろげ、あなたの うえを 三かい まわって、そらへ とんで いった。', 'The crane spreads its great wings, circles over you three times, and flies off into the sky.'),
          c.fude('よかった！ …いま、ありがとうって いった きが する。', 'Thank goodness! …I think it just said thank you.'),
          ...c.advance('fk2-tsuru'),
        ]
      }
      if (k === 'とり') {
        c.learn('tori')
        return [c.narrate('つるは「クルル」と ないた。とりは とりでも、とても きれいな とりだ。', 'The crane calls “krrroo.” A bird, yes — and a very beautiful one.')]
      }
      if (k === 'かぜ' || k === 'ひ' || k === 'ほのお') {
        c.learn(k === 'かぜ' ? 'kaze' : k === 'ひ' ? 'hi' : 'honoo')
        if (st !== 0) return null
        return [c.narrate(k === 'かぜ' ? 'かぜで なわが もっと からまって しまった！' : 'つるが こわがって ばたばた あばれた！', k === 'かぜ' ? 'The wind just tangles the snare even more!' : 'The crane flaps in fright!'), c.fude('まほうじゃ なくて、じぶんの「て」で ほどこう。', 'Not magic — let’s untie it with our own hands: て.')]
      }
      return null
    },
    'fk2-loom': (c, k) => {
      if (c.stage('fk2-tsuru') !== 2) return null
      if (k === 'つき' || k === 'ほし') return [c.fude('まず しずかに まって いよう。しょうじに はなしかけてね。', 'First, let’s settle down to wait. Talk to the screen.')]
      if (k === 'め' || k === 'みる') return [c.fude('「め」で みるのは だめ！ やくそく したでしょう？', 'No looking — we promised, remember?')]
      return null
    },
  },
}

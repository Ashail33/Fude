/**
 * Region 5 folklore — three legends at the Tower of Creation, told in polite
 * court speech. Kaguya-hime sets three "impossible" requests that only words
 * can answer, the baku is called with the old charm to eat the castle's
 * nightmares, and Urashima Tarō, back from the Dragon Palace, is helped to
 * remember who he is before deciding what to do with his forbidden box.
 * Each spirit, once it signs the scroll, remembers the girl with the brush.
 */
import type { PlayerState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import { offer } from './r1-village'
import type { Ctx, TaleContent } from './types'

const KAGUYA = { jp: 'かぐやひめ', en: 'Princess Kaguya' }
const BAKU = { jp: 'ばく', en: 'Baku' }

const stageOf = (s: PlayerState, tale: string) => s.flags?.[`tale.${tale}`] ?? -1

// ─── Kaguya-hime ─────────────────────────────────────────────────────
function moonRiddle(c: Ctx, tries = 0): Step {
  return c.ask({ jp: 'つきを ことばで もってこよう', en: 'Bring her the moon — in a word' }, ['つき', 'おつきさま'], (ok) => {
    if (!ok)
      return tries < 1
        ? [c.say('うふふ。それは つきでは ありません。よるの 空を 見て ください。', 'Hehe. That isn’t the moon. Look up at the night sky.'), moonRiddle(c, tries + 1)]
        : [c.say('いそがなくて いいのですよ。つきは にげませんから。', 'There’s no hurry. The moon won’t run away.')]
    c.learn('tsuki')
    c.sparkle('spark')
    c.sfx('correct')
    return [
      c.say('「つき」…。まあ。ことばの 中に、ちゃんと つきが あります。', '“Tsuki”… Oh. The moon is right there, inside the word.'),
      c.say('りゅうの たまを さがしに いった 人たちより、ずっと かしこいですね。', 'Far wiser than the suitors who sailed off hunting a dragon’s jewel.'),
      c.say('ふたつめの おねがいです。「もえない ひかりを、あの たけに ともして ください。」', 'My second request: “Light that bamboo with a light that does not burn.”'),
      ...c.advance('fk5-kaguya'),
    ]
  })
}

function kaguyaFarewell(c: Ctx): Step {
  return c.choice(
    { jp: 'なんと いいますか？', en: 'What will you say?' },
    [
      ['stay', 'いかないで！ ずっと ここに いて！', 'Don’t go! Stay here forever!'],
      ['plain', 'じゃあね、ばいばい。', 'See ya, bye-bye.'],
      ['polite', 'つきに かえっても、わすれません。どうぞ おげんきで。', 'Even when you return to the moon, I won’t forget you. Please be well.'],
    ],
    (id) => {
      if (id === 'stay') return [c.say('…それは、いちばん むずかしい おねがいですね。', '…Now that is the most impossible request of all.'), c.fude('ひきとめたら、かぐやひめが こまっちゃう。やさしい さよならを さがそう。', 'If we hold her back, she’ll only be torn. Let’s find a gentle goodbye.')]
      if (id === 'plain') return [c.say('あら、かるいですね。おうさまの おしろでは、もうすこし ていねいに。', 'My, how breezy. In the King’s castle, a little more politeness, please.')]
      c.take('fk5-bamboo-light')
      c.sparkle('spark')
      return [
        c.say('…ありがとう ございます。それが、いちばん やさしい さよならです。', '…Thank you. That is the gentlest goodbye there is.'),
        c.say('むかし、わたしは おじいさんと おばあさんに、なにも いわずに かえって しまいました。', 'Long ago I left the old bamboo cutter and his wife without a proper word.'),
        c.say('こんどは、ちゃんと さよならが いえました。これを、おうさまに とどけて ください。', 'This time I could say goodbye properly. Please give this to the King.'),
        ...c.give('fk5-moon-letter'),
        ...c.reward(100, 45),
        ...c.advance('fk5-kaguya'),
        ...c.seal('kaguya-hime'),
        c.say('…むかし、ふでを もった 女の子も、ここで つきを 見あげて いました。「いちばん やさしい なまえを さがしているの」と いって。', '…Long ago, a girl with a brush looked up at this same moon. “I’m searching for the gentlest name,” she said.'),
        c.fude('その 子…！ やさしい なまえ… だれに あげる なまえ だったんだろう。', 'That girl…! The gentlest name… who was she going to give it to?'),
        c.narrate('つきの ひかりが ふりそそぎ、かぐやひめは しずかに 空へ のぼって いった。', 'Moonlight pours down, and Princess Kaguya rises quietly into the sky.'),
      ]
    },
  )
}

// ─── The baku ────────────────────────────────────────────────────────
function bakuCall(c: Ctx): Step {
  return c.ask(
    { jp: 'むかしからの よびかた：「ばくさん、ばくさん、…」', en: 'The old call: “Baku-san, baku-san, …”' },
    ['ばくさん ばくさん ゆめを たべて', 'ばくさん ばくさん ゆめを たべて ください', 'ばくさん ばくさん ゆめお たべて', 'ばくさん ばくさん ゆめお たべて ください'],
    (ok) => {
      if (!ok) return [c.say('ちがう ちがう。「ばくさん、ばくさん、ゆめを たべて」。もう いちど どうぞ。', 'No, no. “Baku-san, baku-san, yume wo tabete.” Once more, please.'), bakuCall(c)]
      c.learn('yume')
      c.learn('taberu')
      c.sparkle('dust')
      c.sfx('correct')
      return [
        c.narrate('ばくは ながい はなを のばし、おしろじゅうの こわい ゆめを すいこんだ。ずずずーっ。', 'The baku stretches out its long trunk and slurps up every nightmare in the castle. Slurrrrp.'),
        c.say('ごちそうさまでした。りゅうの きた よるの ゆめは、からくて こわい あじ でした。', 'Thank you for the meal. Dreams from the night the dragon came taste spicy and scary.'),
        c.say('これからは、こわい ゆめを 見たら、ぼくの なまえを よんで ください。', 'From now on, if anyone has a bad dream, please call my name.'),
        ...c.give('fk5-baku-ofuda'),
        ...c.reward(90, 40),
        ...c.advance('fk5-baku'),
        ...c.seal('baku'),
        c.say('…むかし、ふでを もった 女の子の ゆめも たべました。ないて いる かげの ゆめ でした。', '…Long ago I ate a dream for a girl with a brush, too. She dreamed of a shadow that was crying.'),
        c.fude('ないている かげ…。こわかったんじゃ なくて、さびしかったのかな。', 'A crying shadow… Maybe it wasn’t frightening at all. Maybe it was lonely.'),
      ]
    },
  )
}

// ─── Urashima Tarō ───────────────────────────────────────────────────
function rememberTurtle(c: Ctx): Step {
  return c.choice(
    { jp: 'はまべで なにを たすけた？', en: 'What did he save on the beach?' },
    [
      ['neko', 'ねこ', 'A cat'],
      ['kame', 'かめ', 'A turtle'],
      ['tori', 'とり', 'A bird'],
    ],
    (id) => {
      if (id === 'neko') return [c.say('ねこ…？ いいえ、ひげは ありましたが、こうらも ありました。', 'A cat…? No — it had whiskers of a sort, but it also had a shell.'), rememberTurtle(c)]
      if (id === 'tori') return [c.say('とり…？ いいえ、とんでは いませんでした。とても ゆっくり あるいて いました。', 'A bird…? No, it didn’t fly. It walked ever so slowly.'), rememberTurtle(c)]
      return [
        c.say('そう、かめ です！ 子どもたちに いじめられて いた かめを、たすけました。', 'Yes — a turtle! Some children were tormenting it, and I set it free.'),
        c.say('かめは おれいに、わたしを どこかへ つれて いって くれました…', 'To thank me, the turtle carried me somewhere…'),
        rememberPalace(c),
      ]
    },
  )
}

function rememberPalace(c: Ctx): Step {
  return c.choice(
    { jp: 'かめは どこへ つれて いった？', en: 'Where did the turtle take him?' },
    [
      ['sky', 'くもの 上の おしろ', 'A palace above the clouds'],
      ['mountain', '山の 中の おしろ', 'A palace inside a mountain'],
      ['sea', 'うみの そこの おしろ', 'A palace at the bottom of the sea'],
    ],
    (id) => {
      if (id !== 'sea') return [c.say('いいえ… もっと つめたくて、あおくて、さかなが およいで いました。', 'No… somewhere cooler, and blue, with fish swimming by.'), rememberPalace(c)]
      return [
        c.say('うみの そこ… そうです、りゅうぐうじょう！ おとひめさまの おしろ でした。', 'The bottom of the sea… yes, Ryūgū-jō! The palace of Princess Otohime.'),
        c.say('でも、そこから さきが おもいだせません。…あの いけの そばの いし、かめに にて いますね。', 'But after that, it all goes dark. …That stone by the pond looks like a turtle, doesn’t it?'),
        c.fude('あの いしに「うみ」の ことばを とどけて みよう！ なにか おもいだせるかも。', 'Let’s cast うみ (sea) at that stone! It might bring something back.'),
        ...c.advance('fk5-urashima'),
      ]
    },
  )
}

function urashimaChoice(c: Ctx): Step {
  return c.choice(
    { jp: 'なんと いいますか？', en: 'What will you say?' },
    [
      ['keep', 'あけないで ください。おもいでは、はこの そとにも ありますよ。', 'Please don’t open it. Your memories live outside the box, too.'],
      ['open', 'あけて みましょう。', 'Let’s open it.'],
      ['unsure', 'わかりません…', 'I don’t know…'],
    ],
    (id) => {
      if (id === 'unsure') return [c.say('そうですね… わたしにも わかりません。もうすこし、いけを 見ながら かんがえます。', 'No… nor do I. I’ll think a while longer, watching the pond.')]
      const closing: Step[] = [
        ...c.reward(110, 50),
        ...c.advance('fk5-urashima'),
        ...c.seal('urashima'),
        c.say('…そういえば、むかし りゅうぐうに、ふでを もった 女の子が きました。「ときが たっても、ことばは のこる」と いって いました。', '…Come to think of it, long ago a girl with a brush visited the Dragon Palace. “Even when time passes, words remain,” she said.'),
        c.fude('ときが たっても、のこる…。わたしの きおくも、どこかに のこって いるのかな。', 'Even when time passes, they remain… Then maybe my memories are still out there somewhere, too.'),
      ]
      if (id === 'keep') {
        c.set('fk5.ura-kept')
        return [
          c.say('…そう ですね。おとひめさまも、そう いって いました。', '…Yes. That is just what Princess Otohime said.'),
          c.say('わすれて いた ことを、あなたが おもいださせて くれました。それで じゅうぶんです。', 'You helped me remember what I had forgotten. That is enough.'),
          c.say('はこは しめた まま、だいじに します。かわりに、これを どうぞ。', 'I’ll keep the box closed, and treasure it. Please take this instead.'),
          ...c.give('fk5-ryugu-pearl'),
          ...closing,
        ]
      }
      c.sparkle('dust')
      return [
        c.narrate('はこを あけると、しろい けむりが もくもくと たちのぼった…', 'He lifts the lid, and white smoke billows up…'),
        c.narrate('おじいさんの かみも ひげも、ゆきの ように しろく なった。', 'His hair and beard turn as white as snow.'),
        c.say('ほっほっ… はこに 入って いたのは、わたしの 三百ねん でした。', 'Ho ho… what the box held was my three hundred years.'),
        c.say('でも ふしぎ。こころは かるいです。ときは、かえして もらう ものでは ないのですね。', 'And yet, how strange — my heart feels light. Time isn’t something you get back, is it.'),
        c.say('からの はこですが、きれいでしょう。おれいに どうぞ。', 'It’s empty now, but still lovely. Please take it, with my thanks.'),
        ...c.give('fk5-empty-box'),
        ...closing,
      ]
    },
  )
}

export const TOWER_FOLK: TaleContent = {
  yokai: [
    {
      id: 'kaguya-hime',
      region: 5,
      name: 'Kaguya-hime',
      jp: 'かぐや姫',
      kana: 'かぐやひめ',
      emoji: '🎋',
      lore: 'An old bamboo cutter found a tiny girl inside a glowing stalk of bamboo and raised her as his own. She grew so lovely that noble suitors and even the Emperor sought her hand, but she set each an impossible task — a jewel from a dragon’s neck, a robe that fire cannot burn. At last, under the full moon, her people came for her, and she returned to the Moon, leaving a letter for those she loved.',
      hint: 'In a castle garden with no lantern, a single stalk of bamboo glows like the moon.',
      words: ['tsuki', 'hikari', 'hikaru', 'kirei'],
    },
    {
      id: 'baku',
      region: 5,
      name: 'Baku',
      jp: '獏',
      kana: 'ばく',
      emoji: '🐘',
      lore: 'The baku is a gentle chimera with an elephant’s trunk, a tiger’s paws and an ox’s tail, said to feed on bad dreams. Wake from a nightmare and whisper “Baku-san, baku-san, eat my dream,” and it will swallow the dream so it never returns. People once slept with a picture of the baku tucked beneath their pillows.',
      hint: 'Something with a very long nose is hungry, and the castle children are sleeping badly.',
      words: ['yume', 'taberu', 'kowai', 'yasashii'],
    },
    {
      id: 'urashima',
      region: 5,
      name: 'Urashima Tarō',
      jp: '浦島太郎',
      kana: 'うらしまたろう',
      emoji: '🐢',
      lore: 'A young fisherman rescued a turtle from cruel children, and in thanks it carried him to Ryūgū-jō, the Dragon Palace beneath the sea, where Princess Otohime welcomed him. After three happy days he went home with a jewelled box, the tamatebako, and a warning never to open it — but three hundred years had passed on land. Lost and alone, he lifted the lid; white smoke poured out, and in an instant he was an old man.',
      hint: 'By the castle pond, an old man holds a box he was told never to open.',
      words: ['umi', 'toki', 'furui', 'ryuu'],
    },
  ],
  items: [
    { id: 'fk5-bamboo-light', name: 'Bamboo Moonlight', jp: 'たけの ひかり', kana: 'たけのひかり', emoji: '🎋', desc: 'A drop of cool light from a glowing bamboo joint. It doesn’t burn, even a little.' },
    { id: 'fk5-moon-letter', name: 'Letter from the Moon', jp: 'つきの てがみ', kana: 'つきのてがみ', emoji: '🌕', desc: 'Kaguya-hime’s farewell to the King, in silver ink. It smells faintly of night air.' },
    { id: 'fk5-baku-ofuda', name: 'Baku Charm', jp: 'ばくの おふだ', kana: 'ばくのおふだ', emoji: '🐘', desc: 'A paper charm of a long-nosed beast. Slip it under a pillow and nightmares stay away.' },
    { id: 'fk5-ryugu-pearl', name: 'Ryūgū Pearl', jp: 'りゅうぐうの しんじゅ', kana: 'しんじゅ', emoji: '🫧', desc: 'A pearl from the Dragon Palace. Hold it to your ear and you hear a sea from three hundred years ago.' },
    { id: 'fk5-empty-box', name: 'Empty Tamatebako', jp: 'からの たまてばこ', kana: 'たまてばこ', emoji: '🎁', desc: 'Lacquered and lovely. Whatever it held is gone — only a faint scent of the sea remains.' },
  ],
  tales: [
    {
      id: 'fk5-kaguya',
      region: 5,
      yokai: 'kaguya-hime',
      title: 'Three Impossible Requests',
      jp: 'みっつの むりな おねがい',
      summary: 'A princess found long ago inside a bamboo stalk is a guest at court. She has three requests — and only words can answer them.',
      giver: 'fk5-kaguya',
      stages: [
        { en: 'Kaguya-hime’s first request: talk to her and bring her the moon', jp: 'かぐやひめの ひとつめの おねがい：つきを もってこよう', target: ['fk5-kaguya'], map: 'tower' },
        { en: 'Second request: light the glowing bamboo with a light that doesn’t burn — cast ひかり (light)', jp: 'ふたつめ：ひかる たけに「ひかり」を ともそう（もえない ひかり）', target: ['fk5-bamboo'], map: 'tower' },
        { en: 'Third request: bring Kaguya-hime the bamboo’s light and say a gentle, polite goodbye', jp: 'みっつめ：たけの ひかりを とどけて、やさしい さよならを いおう', target: ['fk5-kaguya'], map: 'tower' },
      ],
    },
    {
      id: 'fk5-baku',
      region: 5,
      yokai: 'baku',
      title: 'Eater of Nightmares',
      jp: 'ゆめを たべる もの',
      summary: 'Since the dragon came, the castle children have nightmares every night. The royal nanny remembers an old charm.',
      giver: 'fk5-nanny',
      stages: [
        { en: 'Talk to Ken, the sleepless page boy, about his nightmare', jp: 'ねむれない こしょうの ケンに、ゆめの はなしを きこう', target: ['fk5-page'], map: 'tower' },
        { en: 'Wake the old baku statue in the tall grass: cast ゆめ (dream)', jp: 'くさむらの ばくの いしぞうに「ゆめ」と となえよう', target: ['fk5-baku-stone'], map: 'tower' },
        { en: 'Ask the baku — politely — to eat the nightmares', jp: 'ばくに ていねいに おねがいしよう', target: ['fk5-baku'], map: 'tower' },
      ],
    },
    {
      id: 'fk5-urashima',
      region: 5,
      yokai: 'urashima',
      title: 'The Box from the Sea',
      jp: 'うみから きた はこ',
      summary: 'An old man by the castle pond can’t remember his own name. He carries a box he was told never to open.',
      giver: 'fk5-urashima',
      stages: [
        { en: 'Help the old fisherman remember: talk with him', jp: 'つりびとの おじいさんが おもいだす てつだいを しよう', target: ['fk5-urashima'], map: 'tower' },
        { en: 'Cast うみ (sea) at the turtle-shaped stone by the pond', jp: 'いけの そばの かめいしに「うみ」と となえよう', target: ['fk5-kameishi'], map: 'tower' },
        { en: 'Tell the old fisherman what you saw — and advise him about the box', jp: 'おじいさんに 見た ことを つたえて、はこの ことを はなそう', target: ['fk5-urashima'], map: 'tower' },
      ],
    },
  ],
  entities: {
    tower: [
      // the moon-viewing corner of the courtyard, north-west
      { id: 'fk5-kaguya', kind: 'npc', sprite: 'priest', x: 12, y: 4, dir: 'up', name: KAGUYA, lines: [{ jp: 'こんやの つきは、きれいですね。', en: 'The moon is beautiful tonight, isn’t it.' }] },
      { id: 'fk5-bamboo', kind: 'landmark', tile: 'bamboo', x: 13, y: 2, name: { jp: 'ひかる たけ', en: 'Glowing Bamboo' }, lines: [{ jp: 'ふしの ひとつが、うっすら ひかって いる。', en: 'One of its joints glows faintly.' }] },
      // the walled garden in the south-west, where the children sleep badly
      { id: 'fk5-nanny', kind: 'npc', sprite: 'innkeeper', x: 8, y: 24, dir: 'down', name: { jp: 'うば', en: 'Royal Nanny' }, lines: [{ jp: '子どもたちが、よく ねむれると いいのですが…', en: 'If only the children could sleep soundly…' }] },
      { id: 'fk5-page', kind: 'npc', sprite: 'child', x: 5, y: 24, dir: 'down', name: { jp: 'こしょうの ケン', en: 'Page Boy Ken' }, lines: [{ jp: 'ふぁ… ねむくない です… ふぁあ…', en: 'Yawn… I’m not sleepy… yaaawn…' }] },
      { id: 'fk5-baku-stone', kind: 'landmark', tile: 'statue', x: 7, y: 27, name: { jp: 'ばくの いしぞう', en: 'Baku Statue' }, lines: [{ jp: 'はなの ながい けものの いしぞう。「ゆめを くう もの」と ほって ある。', en: 'A stone beast with a long nose. Carved below: “The one who eats dreams.”' }] },
      { id: 'fk5-baku', kind: 'npc', sprite: 'tanuki', x: 8, y: 27, dir: 'left', name: BAKU, lines: [{ jp: 'すぴー… すぴー…', en: 'Snooore… snooore…' }] },
      // south of the courtyard pond
      { id: 'fk5-urashima', kind: 'npc', sprite: 'elder', x: 20, y: 21, dir: 'up', name: { jp: 'つりびとの おじいさん', en: 'Old Fisherman' }, lines: [{ jp: 'この はこは… けっして あけては いけない…', en: 'This box… must never be opened…' }] },
      { id: 'fk5-kameishi', kind: 'landmark', tile: 'rock', x: 18, y: 21, name: { jp: 'かめいし', en: 'Turtle Stone' }, lines: [{ jp: 'かめの かたちを した いし。こけが はえて いる。', en: 'A mossy stone shaped like a turtle.' }] },
    ],
  },
  visible: {
    // she returns to the moon once her tale is told
    'fk5-kaguya': (s) => stageOf(s, 'fk5-kaguya') < 3,
    // the baku only comes when called
    'fk5-baku': (s) => stageOf(s, 'fk5-baku') >= 2,
  },
  ghost: {
    'fk5-baku': () => true,
  },
  talk: {
    // ── Kaguya-hime ──
    'fk5-kaguya': (c) => {
      const st = c.stage('fk5-kaguya')
      if (st < 0)
        return offer(
          c,
          'fk5-kaguya',
          [
            c.say('こんばんは。わたしは かぐや と もうします。', 'Good evening. My name is Kaguya.'),
            c.say('むかし、ひかる たけの 中で、小さな 子として 見つけられました。', 'Long ago, I was found as a tiny child inside a glowing stalk of bamboo.'),
            c.say('たくさんの 人が わたしと けっこんしたいと いいました。わたしは みんなに、むりな おねがいを しました。', 'Many asked for my hand. To each of them I gave an impossible request.'),
            c.say('竜の くびの たまや、火に もえない きもの… だれも もって きませんでした。', 'A jewel from a dragon’s neck, a robe that fire cannot burn… no one ever brought them.'),
            c.say('あなたには、ことばで こたえられる おねがいを 三つ します。きいて いただけますか。', 'For you, I have three requests that words can answer. Will you hear them?'),
          ],
          ['はい、きかせて ください。', 'Yes, please tell me.'],
          ['すみません、また こんど。', 'Sorry, another time.'],
        )
      if (st === 0)
        return [
          c.say('ひとつめの おねがいです。「つきを、ここへ もって きて ください。」', 'My first request: “Please bring me the moon.”'),
          c.fude('つきを もってくる！？ むりだよ… あ、まって。ことばなら…！', 'Bring her the MOON!? Impossible… oh, wait. With a word, maybe…!'),
          moonRiddle(c),
        ]
      if (st === 1) return [c.say('たけに、もえない ひかりを。ほのおでは いけませんよ。', 'A light that does not burn, for the bamboo. Flame will not do.'), c.fude('もえない ひかり… 「ひかり」か「ひかる」かな？', 'A light that doesn’t burn… ひかり or ひかる, maybe?')]
      if (st === 2 && c.has('fk5-bamboo-light'))
        return [
          c.narrate('たけの ひかりを さしだした。', 'You hold out the bamboo’s light.'),
          c.say('…なつかしい。わたしが 見つけられた よるも、こんな ひかり でした。', '…How it takes me back. The night I was found, the light was just like this.'),
          c.say('さいごの おねがいです。わたしは つぎの まんげつに、つきへ かえらなければ なりません。', 'My last request. At the next full moon, I must return to the Moon.'),
          c.say('だれも かなしく ならない さよならを、おしえて ください。', 'Please teach me a goodbye that makes no one sad.'),
          kaguyaFarewell(c),
        ]
      return null
    },
    'fk5-bamboo': (c) => {
      const st = c.stage('fk5-kaguya')
      if (st === 1) return [c.narrate('ふしの ひとつが、うっすら ひかって いる。…もっと ひかりたがって いるようだ。', 'One joint glows faintly. …It seems to want to shine brighter.')]
      if (st >= 3) return [c.narrate('たけは もう ひかって いない。でも こんやの つきは、いつもより ちかく 見える。', 'The bamboo no longer glows. But tonight the moon looks closer than ever.')]
      return null
    },
    // ── The baku ──
    'fk5-nanny': (c) => {
      const st = c.stage('fk5-baku')
      if (st < 0)
        return offer(
          c,
          'fk5-baku',
          [
            c.say('まあ、まほうつかいさま。すこし よろしいですか。', 'Oh, honoured mage. Might I have a moment?'),
            c.say('りゅうが きてから、おしろの 子どもたちが まいばん こわい ゆめを 見るのです。', 'Ever since the dragon came, the castle children have had nightmares every night.'),
            c.say('こしょうの ケンは、もう みっかも ねて いません。', 'Ken the page boy hasn’t slept in three days.'),
            c.say('わたしの ははが よく いって いました。「こわい ゆめは、ばくさんに たべて もらいなさい」と。', 'My mother always said: “Let the baku eat your bad dreams.”'),
          ],
          ['はい、てつだいます。', 'Yes, I’ll help.'],
          ['すみません、また あとで。', 'Sorry, maybe later.'],
        )
      if (st === 0) return [c.say('ケンは あそこで おきて います。はなしを きいて あげて ください。', 'Ken is awake, just over there. Please listen to him.')]
      if (st === 1) return [c.say('くさむらの ふるい いしぞうが、ばくさん です。ゆめの ことばで おこすのですよ。', 'The old statue in the grass is the baku. You wake it with the word for dream.')]
      if (st === 2) return [c.say('ばくさんが… ほんとうに！？ ていねいに おねがい して くださいね。', 'The baku… really!? Do ask it politely, won’t you?')]
      return [c.say('ケンは ぐっすり ねて います。わたしも、ひさしぶりに よく ねむれました。', 'Ken is sound asleep. And for once, so was I.')]
    },
    'fk5-page': (c) => {
      const st = c.stage('fk5-baku')
      if (st === 0)
        return [
          c.say('まいばん、くろい かげの ゆめを 見ます。かげが、ぼくの なまえを たべちゃうんです。', 'Every night I dream of a black shadow. It eats my name.'),
          c.say('こわくて、ねられません…', 'It’s so scary, I can’t sleep…'),
          c.choice(
            { jp: 'なんと いいますか？', en: 'What will you say?' },
            [
              ['tough', 'ゆめなんか こわくない！', 'Dreams aren’t scary!'],
              ['sleep', 'はやく ねなさい。', 'Just go to sleep.'],
              ['kind', 'こわかったですね。もう だいじょうぶですよ。', 'That sounds frightening. It’ll be all right now.'],
            ],
            (id) => {
              if (id !== 'kind') return [c.say('ううん… やっぱり こわいよ…', 'Mm… it’s still scary…'), c.fude('もっと やさしく、ていねいに いって あげよう。', 'Let’s say it more gently — and politely.')]
              c.learn('kowai')
              return [
                c.say('…ほんとう？ ありがとう ございます。', '…Really? Thank you.'),
                c.say('ばあやが おしえて くれました。「ばくさん、ばくさん、ゆめを たべて」って よぶんだって。', 'Nanny taught me: you call “Baku-san, baku-san, yume wo tabete.”'),
                c.say('でも、ばくさんは どこに いるの？', 'But where is the baku?'),
                c.fude('くさむらの ふるい いしぞう… はなが ながいよ！ 「ゆめ」の ことばで おこして みよう！', 'That old statue in the grass has a long nose! Let’s wake it with ゆめ (dream)!'),
                ...c.advance('fk5-baku'),
              ]
            },
          ),
        ]
      if (st === 1 || st === 2) return [c.say('ばくさん、きて くれるかな…', 'Do you think the baku will come…?')]
      if (st >= 3) return [c.say('ゆうべは、とても いい ゆめを 見ました！ 空を とぶ ゆめ です！', 'Last night I had the best dream! I was flying through the sky!')]
      return null
    },
    'fk5-baku-stone': (c) => (c.stage('fk5-baku') === 1 ? [c.narrate('はなの ながい けものの いしぞう。ねむって いる ように 見える。', 'A stone beast with a long nose. It looks as if it’s sleeping.'), c.fude('「ゆめ」の ことばで おこそう！', 'Let’s wake it with ゆめ!')] : null),
    'fk5-baku': (c) => {
      const st = c.stage('fk5-baku')
      if (st === 2)
        return [
          c.say('ふぁあ… よんだのは だれ？ ぼくは ばく。わるい ゆめを たべる もの です。', 'Yaaawn… who called? I am the baku. I eat bad dreams.'),
          c.fude('たぬき…？', 'A tanuki…?'),
          c.say('ばく です。ほら、はなが ながいでしょう。', 'A BAKU. Look — a long nose, see?'),
          c.say('ゆめを たべて ほしいなら、ちゃんと おねがい して くださいね。', 'If you want me to eat dreams, please ask properly.'),
          c.choice(
            { jp: 'どう おねがいしますか？', en: 'How will you ask?' },
            [
              ['command', 'ゆめを たべろ！', 'Eat the dreams!'],
              ['plain', 'ゆめ、たべる？', 'Dreams. Eat?'],
              ['polite', 'こわい ゆめを たべて ください。', 'Please eat the bad dreams.'],
            ],
            (id) => {
              if (id === 'command') return [c.say('むっ。めいれいは きらいです。', 'Hmph. I don’t like being ordered about.')]
              if (id === 'plain') return [c.say('たべる… けど、なにを？ だれの？ もうすこし ちゃんと いって ください。', 'Eat… but what? Whose? Please say it a bit more properly.')]
              return [c.say('うん、ていねい。では、むかしからの よびかたで、もう いちど よんで ください。', 'Mm, very polite. Now call me once more — the old way.'), bakuCall(c)]
            },
          ),
        ]
      if (st >= 3) return [c.narrate('ばくは まんぷくで、ねむって いる。すぴー… すぴー…', 'The baku is full, and fast asleep. Snooore… snooore…')]
      return null
    },
    // ── Urashima Tarō ──
    'fk5-urashima': (c) => {
      const st = c.stage('fk5-urashima')
      if (st < 0)
        return offer(
          c,
          'fk5-urashima',
          [
            c.say('おや… こんばんは。ここは、どなたの おしろ でしょうか。', 'Oh… good evening. Whose castle might this be?'),
            c.say('わたしは うみから かえって きました。でも、しって いる 人が だれも いないのです。', 'I have come home from the sea, but there is no one here I know.'),
            c.say('じぶんの なまえも おもいだせません。この はこ だけを もって いました。', 'I can’t even remember my own name. All I have is this box.'),
            c.say('「けっして あけては いけません」と、だれかに いわれた きが します。', 'Someone told me, I think: “You must never open it.”'),
            c.say('…おもいだす てつだいを、して いただけませんか。', '…Would you help me remember?'),
          ],
          ['はい。いっしょに おもいだしましょう。', 'Yes. Let’s remember together.'],
          ['すみません、また あとで。', 'Sorry, maybe later.'],
        )
      if (st === 0) return [c.say('はまべで… なにかを たすけた きが します。かたい こうらが あって、とても ゆっくり あるく…', 'On a beach… I think I saved something. It had a hard shell, and walked so very slowly…'), rememberTurtle(c)]
      if (st === 1) return [c.say('あの かめの いしを 見ると、うみの においが します…', 'When I look at that turtle stone, I can smell the sea…')]
      if (st === 2)
        return [
          c.narrate('まぼろしで 見た ことを つたえた。', 'You tell him what you saw in the vision.'),
          c.say('…おもいだしました。わたしは、うらしま たろう です。', '…I remember now. My name is Urashima Tarō.'),
          c.say('りゅうぐうで みっか すごしたら、ここでは 三百ねんが すぎて いました。', 'Three days at the Dragon Palace — and here, three hundred years went by.'),
          c.say('かぞくも ともだちも、もう いません。…この はこを あけたら、むかしに もどれるでしょうか。', 'My family and friends are long gone. …If I open this box, could I go back?'),
          urashimaChoice(c),
        ]
      if (st >= 3)
        return c.flag('fk5.ura-kept')
          ? [c.say('はこは しめた まま。おもいでは、ちゃんと ここに あります。', 'The box stays closed. My memories are right here, where they belong.')]
          : [c.say('しろい ひげも、わるく ありませんね。ほっほっ。', 'A white beard isn’t so bad, is it? Ho ho.')]
      return null
    },
    'fk5-kameishi': (c) => (c.stage('fk5-urashima') === 1 ? [c.narrate('かめの かたちの いし。かすかに、なみの おとが きこえる きが する。', 'A turtle-shaped stone. You almost hear waves.'), c.fude('「うみ」の ことばを とどけて みよう！', 'Let’s cast うみ (sea) at it!')] : null),
  },
  cast: {
    // ── Kaguya-hime ──
    'fk5-kaguya': (c, k) => {
      if (k === 'つき') return (c.learn('tsuki'), c.sparkle('spark'), [c.say('つき… わたしの ふるさと です。', 'The moon… it is my home.')])
      if (k === 'きれい') return (c.learn('kirei'), [c.say('まあ。…つきの ほうが、ずっと きれいですよ。', 'Oh my. …The moon is far more beautiful.')])
      if (k === 'ほし') return (c.learn('hoshi'), [c.say('ほしは、つきの おとなりさん です。', 'The stars are the moon’s neighbours.')])
      return null
    },
    'fk5-bamboo': (c, k) => {
      const st = c.stage('fk5-kaguya')
      if (k === 'ひかり' || k === 'ひかる') {
        c.learn(k === 'ひかり' ? 'hikari' : 'hikaru')
        c.sparkle('spark')
        if (st === 1) {
          c.sfx('correct')
          return [
            c.narrate('たけが ふわりと ひかった。あつくない、つきの ような ひかりだ。', 'The bamboo glows softly — a cool light, like moonlight.'),
            c.narrate('ひかる ふしの 中から、小さな ひかりの つぶが ころがりでた。', 'From inside the glowing joint, a tiny bead of light rolls out.'),
            ...c.give('fk5-bamboo-light'),
            c.fude('もえない ひかり！ かぐやひめに とどけよう！', 'A light that doesn’t burn! Let’s take it to Kaguya-hime!'),
            ...c.advance('fk5-kaguya'),
          ]
        }
        return [c.narrate('たけが いっしゅん、つきの ように ひかった。', 'For a moment, the bamboo shines like the moon.')]
      }
      if (k === 'ひ' || k === 'ほのお' || k === 'もやす') {
        c.learn(k === 'ひ' ? 'hi' : k === 'ほのお' ? 'honoo' : 'moyasu')
        return [c.fude('わわっ、だめ！ もえない ひかり、って いってたよ！', 'Whoa, no! She said a light that DOESN’T burn!')]
      }
      if (k === 'つき') return (c.learn('tsuki'), [c.narrate('たけの ふしが、つきに こたえる ように ちかっと ひかった。', 'The bamboo joint flickers, as if answering the moon.')])
      return null
    },
    // ── The baku ──
    'fk5-baku-stone': (c, k) => {
      const st = c.stage('fk5-baku')
      if (k === 'ゆめ') {
        c.learn('yume')
        c.sparkle('dust')
        if (st === 1) {
          c.sfx('correct')
          return [
            c.narrate('「ゆめ」！ いしぞうが ふるえ、あまい ゆめの においが した…', '“Yume”! The statue trembles, and the air smells of sweet dreams…'),
            c.narrate('ぽんっ！ はなの ながい ふしぎな けものが あらわれた！', 'Pop! A strange beast with a long nose appears!'),
            ...c.advance('fk5-baku'),
          ]
        }
        return [c.narrate('いしぞうが、すこし あたたかく なった。', 'The statue grows a little warm.')]
      }
      if (k === 'ねる') return (c.learn('neru'), [c.narrate('いしぞうが あくびを した… ような きが した。', 'The statue yawned… or so it seemed.')])
      return null
    },
    'fk5-baku': (c, k) => {
      if (k === 'やさしい') return (c.learn('yasashii'), [c.say('えへへ。ばくは やさしい ようかい なんですよ。', 'Hehe. Baku are very kind spirits, you know.')])
      if (k === 'こわい') return (c.learn('kowai'), [c.say('こわい？ ぼくが？ …ちょっと きずつきました。', 'Scary? Me? …That hurt a little.')])
      if (k === 'ゆめ') return (c.learn('yume'), [c.say('いい ゆめは たべません。それは みなさんの ものですから。', 'I never eat good dreams. Those belong to you.')])
      if (k === 'たべる') return (c.learn('taberu'), [c.say('たべる！ …あ、こわい ゆめ だけ ですよ。', 'Eat! …Only bad dreams, mind you.')])
      return null
    },
    'fk5-page': (c, k) => {
      if (k === 'やさしい') return (c.learn('yasashii'), [c.say('…えへへ。すこし、こわくなく なりました。', '…Hehe. I feel a little less scared.')])
      if (k === 'ねる') return (c.learn('neru'), [c.say(c.stage('fk5-baku') >= 3 ? 'はい！ こんやも ぐっすり ねます！' : 'ねたら、また あの ゆめを 見ちゃう…', c.stage('fk5-baku') >= 3 ? 'Yes! I’ll sleep like a log tonight too!' : 'If I sleep, I’ll have that dream again…')])
      return null
    },
    // ── Urashima Tarō ──
    'fk5-kameishi': (c, k) => {
      const st = c.stage('fk5-urashima')
      if (k === 'うみ') {
        c.learn('umi')
        c.sparkle('ripple')
        if (st === 1) {
          c.sfx('correct')
          return [
            c.narrate('「うみ」！ いしの まわりに、なみの おとが ひびいた…', '“Umi”! The sound of waves rises around the stone…'),
            c.narrate('まぼろしが 見えた。うみの そこの ひかる おしろ。おとひめが、はこを わたして いる。', 'A vision: a shining palace at the bottom of the sea. Princess Otohime is handing over a box.'),
            c.say('「この たまてばこを、けっして あけては いけません。」', '“You must never, ever open this tamatebako.”', { jp: 'おとひめ', en: 'Otohime' }),
            c.narrate('まぼろしの 中では、みっかが すぎた。…でも おかの 上では、三百ねんが すぎて いた。', 'In the vision, three days pass. …But up on land, three hundred years went by.'),
            c.fude('りゅうぐうの みっかは、ここの 三百ねん… おじいさんに つたえよう。', 'Three days in the Dragon Palace, three hundred years here… Let’s tell the old man.'),
            ...c.advance('fk5-urashima'),
          ]
        }
        return [c.narrate('いしの まわりに、まぼろしの さかなが およいだ。', 'Phantom fish swim around the stone.')]
      }
      if (k === 'りゅう') return (c.learn('ryuu'), [c.narrate('かめいしの 目が、とおい りゅうぐうの ほうを 見た きが した。', 'The turtle stone seems to gaze toward the far-off Dragon Palace.'), ...(st === 1 ? [c.fude('りゅうぐうは うみの そこ… 「うみ」の ほうが いいかも！', 'The Dragon Palace is under the sea… maybe うみ would work better!')] : [])])
      if (k === 'さかな') return (c.learn('sakana'), [c.narrate('いけの さかなが、かめいしの まわりに あつまって きた。', 'The pond fish gather around the turtle stone.')])
      return null
    },
    'fk5-urashima': (c, k) => {
      if (k === 'とき') return (c.learn('toki'), [c.say('とき… りゅうぐうでは、ときが とても ゆっくり ながれて いました。', 'Time… at the Dragon Palace, time flowed ever so slowly.')])
      if (k === 'ふるい') return (c.learn('furui'), [c.say('ふるい？ …ええ、とても ふるい おじいさん です。ほっほっ。', 'Old? …Yes, a very old man indeed. Ho ho.')])
      if (k === 'うみ') return (c.learn('umi'), [c.say('うみ… なつかしい ことば です。', 'The sea… what a dear old word.')])
      if (k === 'なまえ') return (c.learn('namae'), [c.say(c.stage('fk5-urashima') >= 2 ? 'なまえ… ええ、もう わすれません。' : 'なまえ… わたしの なまえは、なんでしたか…', c.stage('fk5-urashima') >= 2 ? 'My name… yes, I won’t forget it again.' : 'A name… what was my name, I wonder…')])
      return null
    },
  },
}

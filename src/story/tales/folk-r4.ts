/**
 * Region 4 folklore side tales, by the night shrine: the moon rabbit (月の
 * うさぎ) come down to pound mochi for the moon-viewing, the noppera-bō who
 * forgot its own face and wants it written back, and Tanabata, where wishes
 * on bamboo call the magpies to bridge the River of Heaven. Each spirit
 * signs the Spirit Scroll and remembers the girl with the brush.
 */
import type { PlayerState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import { offer } from './r1-village'
import type { Ctx, TaleContent } from './types'

const USAGI = { jp: 'つきの うさぎ', en: 'Moon Rabbit' }
const NOPPERA = { jp: 'のっぺらぼう', en: 'Noppera-bō' }
const TSUMUGI = { jp: 'つむぎ', en: 'Tsumugi' }
const ORIHIME = { jp: 'おりひめ', en: 'Orihime' }
const HIKOBOSHI = { jp: 'ひこぼし', en: 'Hikoboshi' }

const stageOf = (s: PlayerState, tale: string) => s.flags?.[`tale.${tale}`] ?? -1
/** The noppera-bō speaks under its true name once it has turned around. */
const nb = (c: Ctx, jp: string, en: string) => c.say(jp, en, NOPPERA, 'villager-b')
/** Run `more` after the player says yes to an `offer`. */
const onYes = (steps: Step[], more: () => Step[]): Step[] =>
  steps.map((s) => (s.kind === 'choice' ? { ...s, onPick: (id: string) => [...(s.onPick(id) ?? []), ...(id === 'yes' ? more() : [])] } : s))

// ─── Tsuki no Usagi: mochi for the moon-viewing ──────────────────────
function shapeMochi(c: Ctx): Step {
  return c.choice({ jp: 'おつきみの おもちは、どんな いろ？', en: 'What colour are moon-viewing mochi?' }, [['shiroi', 'しろい', 'White'], ['kuroi', 'くろい', 'Black'], ['aoi', 'あおい', 'Blue']], (col) => {
    if (col !== 'shiroi') return [c.say(col === 'kuroi' ? 'くろい おもち？ …こげちゃってるよ！' : 'あおい おもち？ …ちょっと こわい。', col === 'kuroi' ? 'Black mochi? …Those are burnt!' : 'Blue mochi? …That’s a little scary.'), c.fude('つきの いろを おもいだして！ もう いちど はなしかけよう。', 'Think of the moon’s colour! Let’s talk to the rabbit again.')]
    c.learn('shiroi')
    return [
      c.say('そう、しろい！ つきと おなじ いろ。', 'Yes, white! The same colour as the moon.'),
      c.choice({ jp: 'おもちの おおきさは？', en: 'And how big should each one be?' }, [['chii', 'ちいさい', 'Small'], ['oo', 'おおきい', 'Big']], (size) => {
        if (size !== 'chii') return [c.say('おおきすぎて、うすから でられない…！', 'Too big! It’s stuck in the mortar…!'), c.narrate('うさぎは おもちを ちぎって、もう いちど まるめた。', 'The rabbit tears it apart to start again.'), c.fude('ひとくちで たべられる おおきさが いいかも。', 'Maybe bite-sized is better.')]
        c.learn('chii')
        c.sparkle('spark')
        c.sfx('correct')
        return [
          c.narrate('ぺったん、ぺったん。しろくて ちいさい おもちが、つきの ように まるく ならんだ。', 'Pettan, pettan. Small white mochi line up, round as little moons.'),
          c.say('できた！ おつきみの おもち！ …ひとつ たべて みて。', 'Done! Moon-viewing mochi! …Try one.'),
          c.narrate('やわらかくて、あまくて、すこし あたたかい。', 'Soft, sweet, and still a little warm.'),
          c.fude('おいしい〜！ つきの あじが する！', 'Delicious~! It tastes like moonlight!'),
          c.say('ありがとう。これで みんなで つきを みられる。おみやげも どうぞ。', 'Thank you. Now everyone can watch the moon together. Take some home, too.'),
          ...c.give('fk4-moon-mochi'),
          ...c.reward(80, 35),
          ...c.advance('fk4-usagi'),
          ...c.seal('tsuki-usagi'),
          c.say('…ねえ。むかし、ふでを もった おんなのこが いたの。さいごの よる、つきの ひかりで かいていた。すみが どんどん へって… それでも わらってた。', '…Say. Long ago there was a girl with a brush. On the last night she wrote by moonlight. Her ink kept running out… and still she smiled.'),
          c.fude('つきの ひかりで… その よる、わたしも そばに いた きがする。', 'By moonlight… I feel like I was right there beside her that night.'),
        ]
      }),
    ]
  })
}

const USAGI_CHAT: [string, string][] = [
  ['むかし、おなかの すいた おじいさんに あげる ものが なにも なくて、わたし じしんを さしだしたの。', 'Long ago, I had nothing to give a hungry old man, so I offered him myself.'],
  ['おじいさんは かみさま だった。ないて、わらって、わたしを つきに つれて いって くれた。', 'He was a god in disguise. He cried, then smiled, and carried me up to the moon.'],
  ['つきを よく みて。もちを つく うさぎが みえるでしょ？ あれ、わたし。', 'Look closely at the moon. See the rabbit pounding mochi? That’s me.'],
  ['あたらしい おもちも いいけど、つぎの ひの かたい おもちも すき。', 'Fresh mochi is lovely, but I like it the next day too, when it’s chewy.'],
]

// ─── Noppera-bō: writing back a forgotten face ────────────────────────
function writeFace(c: Ctx): Step {
  const fail = (jp: string, en: string): Step[] => [nb(c, jp, en), c.fude('えの せつめいを よみなおそう。だいじな もちものに あるよ！', 'Let’s reread the portrait — it’s in your key items!')]
  return c.choice({ jp: 'め は どんな め？', en: 'What are the eyes like?' }, [['oo', 'おおきい め', 'Big eyes'], ['chii', 'ちいさい め', 'Small eyes']], (eye) => {
    if (eye !== 'oo') return fail('ちいさい め…？ なんだか ねむそう。わたしじゃ ない きがする。', 'Small eyes…? I look sleepy. That isn’t me, I think.')
    c.learn('oo')
    c.learn('me')
    return [
      c.narrate('のっぺりした かおに、おおきな め が ふたつ うかんだ。', 'Two big eyes bloom on the smooth face.'),
      c.choice({ jp: 'くち は？', en: 'And the mouth?' }, [['oo', 'おおきい くち', 'A big mouth'], ['chii', 'ちいさい くち', 'A small mouth']], (mouth) => {
        if (mouth !== 'chii') return fail('おおきい くち… がおー！ …ちがう、これは おにの かお。', 'A big mouth… RAWR! …No, that’s an oni’s face.')
        c.learn('chii')
        c.learn('kuchi')
        return [
          c.narrate('ちいさな くち が、ちょこんと かかれた。', 'A small, neat mouth appears.'),
          c.choice({ jp: 'かみ は？', en: 'And the hair?' }, [['long', 'ながくて くろい かみ', 'Long black hair'], ['white', 'ながくて しろい かみ', 'Long white hair'], ['paper', 'しろい かみ（紙）', 'White paper']], (hair) => {
            if (hair === 'paper') return [nb(c, 'かみ… それは 紙！ あたまに 紙を のせても、かみがたじゃ ないわ。', 'Kami… that’s paper! Paper on my head is not a hairstyle.'), c.fude('「かみ」は 紙も 髪も「かみ」なんだね…', 'So “kami” means both paper and hair…'), c.fude('もう いちど はなしかけよう。', 'Let’s talk to her again.')]
            if (hair !== 'long') return fail('しろい かみ？ …まだ そんなに としじゃ ないわ。', 'White hair? …I’m not that old yet.')
            c.learn('nagai')
            c.learn('kuroi')
            return [
              c.narrate('ながくて くろい かみが、さらりと ゆれた。あとは、ふでで しあげるだけ。', 'Long black hair falls softly into place. All that’s left is the finishing stroke.'),
              c.cast({ jp: 'かおを かきあげよう！ ことばの まほうで「かく」', en: 'Finish the face — cast かく (write)!' }, (k) => {
                if (k !== 'かく') return [nb(c, '…まだ うすい。きえて しまいそう…', '…It’s still faint. It might fade away…'), c.fude('かおを「かく」んだよ！ もう いちど はなしかけて、さいごから やりなおそう。', 'We need to write it — かく! Talk to her again and we’ll redo it.')]
                c.learn('kaku')
                c.sparkle('spark')
                c.sfx('correct')
                return [
                  c.narrate('ふでが すべり、かおに いのちが はいった。おおきな め が、ぱちり と まばたきした。', 'The brush glides, and the face comes alive. The big eyes blink.'),
                  nb(c, '…あ。これ、わたし。わたしの かお！', '…Oh. That’s me. That’s my face!'),
                  nb(c, 'ずっと、かおの ない わたしは だれでも ない きが していたの。ありがとう。', 'Without a face I felt like I was no one at all. Thank you.'),
                  nb(c, '…でも、ときどき つるんと もどして、たびびとを おどろかせても いい？', '…Though may I still go smooth now and then, to startle travellers?'),
                  c.fude('…ほどほどに ね。', '…In moderation.'),
                  ...c.bagItem('ether', 1),
                  ...c.reward(90, 40),
                  ...c.advance('fk4-noppera'),
                  ...c.seal('noppera-bo'),
                  nb(c, '…おもいだした。むかし、ふでを もった おんなのこ。わたしの かおを みても、あのこだけは にげなかった。', '…I remember now. Long ago, a girl with a brush. She was the only one who never ran from my face.'),
                  nb(c, '「かおが なくても、あなたは あなた」って。あの え を かいたのも、きっと あのこ。', '“Face or no face, you’re still you,” she said. I think she painted that portrait, too.'),
                  c.fude('なまえが きえても、かいた ものは のこる… なんだか、むねが ぎゅっと する。', 'Her name faded, but what she wrote stayed… It makes my heart ache somehow.'),
                ]
              }),
            ]
          }),
        ]
      }),
    ]
  })
}

// ─── Tanabata: wishes, magpies and a bridge of birds ──────────────────
/** Tsumugi's three wishes, and the colour of paper each one goes on. */
const WISHES: { colour: string; who: [string, string]; jp: string; en: string }[] = [
  { colour: 'akai', who: ['おかあさんの ねがい', 'Mum’s wish'], jp: '「おかあさんが ずっと げんきで いますように」', en: '“May Mum always stay well.”' },
  { colour: 'aoi', who: ['つむぎの ねがい', 'Tsumugi’s wish'], jp: '「かんじが じょうずに かけますように」', en: '“May I write kanji beautifully.”' },
  { colour: 'shiroi', who: ['ほしの ふたりの ねがい', 'The two stars’ wish'], jp: '「おりひめと ひこぼしが あえますように」', en: '“May Orihime and Hikoboshi meet.”' },
]
const COLOURS: [string, string, string][] = [['akai', 'あかい たんざく', 'Red tanzaku'], ['aoi', 'あおい たんざく', 'Blue tanzaku'], ['shiroi', 'しろい たんざく', 'White tanzaku'], ['kuroi', 'くろい たんざく', 'Black tanzaku']]

function writeWish(c: Ctx): Step[] {
  const n = c.flag('fk4.wishes')
  const w = WISHES[n]
  if (!w) return []
  return [
    c.narrate(`${w.who[0]}：${w.jp}`, `${w.who[1]}: ${w.en}`),
    c.choice({ jp: 'どの いろの たんざくに かく？', en: 'Which colour tanzaku does it go on?' }, COLOURS, (id) => {
      if (id === 'kuroi') return [c.narrate('くろい たんざくは ない。…くろい かみに くろい すみでは、よめないね。', 'There’s no black tanzaku. …Black ink on black paper would be unreadable anyway.')]
      if (id !== w.colour) return [c.say('あっ、その いろじゃ ないよ〜！', 'Ah, not that colour~!', TSUMUGI, 'child'), c.fude('あかい かみは おかあさん、あおい かみは つむぎ、しろい かみは ほしの ふたり。もう いちど「かく」！', 'Red is for Mum, blue for Tsumugi, white for the two stars. Cast かく again!')]
      c.set('fk4.wishes', n + 1)
      c.learn(id)
      c.sparkle('leaf')
      c.sfx('correct')
      const out: Step[] = [c.narrate('たんざくに かいて、ささに むすんだ。かぜに さらさら ゆれる。', 'You write it out and tie it to the bamboo. It rustles in the breeze.')]
      if (n + 1 >= WISHES.length) {
        c.take('fk4-tanzaku')
        out.push(c.fude('3まい ぜんぶ かけた！ ねがいが いっぱいの ささには、とりが あつまるって！', 'All three written! They say birds gather where the bamboo is heavy with wishes!'), ...c.advance('fk4-tanabata'))
      } else out.push(c.fude(`あと ${WISHES.length - n - 1}まい！ もう いちど「かく」！`, `${WISHES.length - n - 1} to go! Cast かく again!`))
      return out
    }),
  ]
}

function buildBridge(c: Ctx): Step {
  return c.choice({ jp: 'かささぎ：「カチカチ！ どんな はしを つくる？」', en: 'Magpies: “Kachi-kachi! What kind of bridge shall we make?”' }, [['short', 'ちいさい はし', 'A small bridge'], ['long', 'ながい はし', 'A long bridge'], ['red', 'あかい はし', 'A red bridge']], (id) => {
    if (id !== 'long') return [c.narrate('かささぎたちは くびを かしげた。「あまのがわは とても ひろいよ？」', 'The magpies tilt their heads. “The River of Heaven is very wide, you know?”'), c.fude('むこうまで とどく はし… もう いちど「とり」を よぼう！', 'A bridge that reaches all the way across… let’s call the birds again!')]
    c.learn('nagai')
    return [
      c.narrate('「ながい はし！」かささぎたちが いっせいに はばたいた。', '“A long bridge!” The magpies take wing as one.'),
      c.cast({ jp: 'さいごの ことばで はしを かけよう', en: 'Cast the final word to make the bridge' }, (k) => {
        if (k !== 'はし') return [c.narrate('かささぎたちは そらを ぐるぐる まわっている…', 'The magpies circle the sky, waiting…'), c.fude('「はし」と となえなきゃ！ もう いちど ささに「とり」と となえよう。', 'We need to say はし, bridge! Cast とり at the bamboo again.')]
        c.learn('hashi')
        c.sparkle('spark')
        c.sfx('correct')
        return [
          c.narrate('かささぎが つばさを つないで、よぞらに ながい ながい はしが かかった！', 'Wing to wing, the magpies stretch a long, long bridge across the night sky!'),
          c.narrate('はしの りょうはしで、ふたつの ほしが ひかりはじめた…', 'At either end of it, two stars begin to glow…'),
          ...c.advance('fk4-tanabata'),
        ]
      }),
    ]
  })
}

function meeting(c: Ctx): Step[] {
  c.sparkle('spark')
  return [
    c.narrate('ふたつの ひかりが はしを わたって、まんなかで かさなった。', 'The two lights cross the bridge and meet in the middle.'),
    c.say('ひこぼし…！ いちねん、ずっと まって いました。', 'Hikoboshi…! I’ve waited a whole year.', ORIHIME, 'wisp'),
    c.say('おりひめ。ことしも あえたね。', 'Orihime. We met again this year.', HIKOBOSHI, 'wisp'),
    c.say('ねがいを かいて、とりを よんで くれたのは あなたね。ありがとう。', 'You wrote the wishes and called the birds, didn’t you? Thank you.', ORIHIME, 'wisp'),
    c.say('これを。わたしが おった、ほしの いと です。', 'Take this — a thread of starlight from my loom.', ORIHIME, 'wisp'),
    ...c.give('fk4-star-thread'),
    ...c.reward(100, 45),
    ...c.advance('fk4-tanabata'),
    ...c.seal('tanabata'),
    c.say('…むかし、ふでを もった おんなのこが、まいとし たんざくを かいて くれました。いつも ひとの ねがい ばかり。', '…Long ago, a girl with a brush wrote tanzaku for us every year. Always other people’s wishes, never her own.', ORIHIME, 'wisp'),
    c.say('さいごの とし、あのこの たんざくだけは しろい まま だった。', 'The last year, her tanzaku alone was left blank.', HIKOBOSHI, 'wisp'),
    c.fude('しろい まま… かく すみが、もう なかったのかな。…それとも、ねがいを だれかに のこしたの？', 'Left blank… Did she have no ink left to write with? …Or was she leaving that wish for someone else?'),
  ]
}

const met = (s: PlayerState) => stageOf(s, 'fk4-tanabata') >= 3

export const SHRINE_FOLK: TaleContent = {
  yokai: [
    {
      id: 'tsuki-usagi',
      region: 4,
      name: 'Moon Rabbit',
      jp: '月の兎',
      kana: 'つきのうさぎ',
      emoji: '🐇',
      lore: 'A rabbit, a monkey and a fox met a starving old man. The rabbit had nothing to give, so it offered itself instead; the old man, a god in disguise, was so moved that he placed the rabbit on the moon. On clear nights you can still see it there, pounding mochi.',
      hint: 'Something white and soft has come down to the moon-viewing pond, and keeps looking up.',
      words: ['shiroi', 'chii', 'atsui', 'ta-rice', 'tsuki'],
    },
    {
      id: 'noppera-bo',
      region: 4,
      name: 'Noppera-bō',
      jp: 'のっぺらぼう',
      kana: 'のっぺらぼう',
      emoji: '😶',
      lore: 'A traveller finds someone crying by a dark road and asks what is wrong; they turn, and their face is smooth as an egg. He flees to a noodle seller for help, who wipes a hand over his own face… and it is just as blank. Noppera-bō mean no harm; startling people is simply what they do.',
      hint: 'Someone is crying by the lantern path, and will not show their face.',
      words: ['oo', 'chii', 'me', 'kuchi', 'nagai', 'kuroi', 'hikari', 'kaku'],
    },
    {
      id: 'tanabata',
      region: 4,
      name: 'Orihime & Hikoboshi',
      jp: '織姫と彦星',
      kana: 'おりひめと ひこぼし',
      emoji: '🎋',
      lore: 'Orihime, the weaver star, and Hikoboshi, the cowherd, loved each other so much they forgot their work, so the River of Heaven was set between them. Once a year, on the seventh night of the seventh month, magpies make a bridge so they can meet. People write wishes on tanzaku papers and hang them on bamboo.',
      hint: 'A bamboo branch at the shrine is waiting for wishes, and two stars are waiting for a bridge.',
      words: ['kaku', 'akai', 'aoi', 'shiroi', 'tori', 'nagai', 'hashi', 'hoshi'],
    },
  ],
  items: [
    { id: 'fk4-rice', name: 'Offering Rice', jp: 'おそなえの こめ', kana: 'こめ', emoji: '🍚', desc: 'Sticky white rice from the shrine’s offering stand. Perfect for mochi.' },
    { id: 'fk4-moon-mochi', name: 'Moon Mochi', jp: 'つきみ もち', kana: 'もち', emoji: '🍡', desc: 'Small, white and round, pounded by the moon rabbit. Somehow still warm.' },
    { id: 'fk4-portrait', name: 'Faded Portrait', jp: 'うすれた え', kana: 'え', emoji: '🖼️', desc: 'め は おおきくて、くち は ちいさい。かみ は ながくて くろい。 — Big eyes, a small mouth, long black hair. The painter’s name has worn away.' },
    { id: 'fk4-tanzaku', name: 'Tanzaku Papers', jp: 'たんざく', kana: 'たんざく', emoji: '🎋', desc: 'Three blank wish-strips: red, blue and white. Wishes go on the bamboo.' },
    { id: 'fk4-star-thread', name: 'Star Thread', jp: 'ほしの いと', kana: 'いと', emoji: '🧵', desc: 'Woven by Orihime on her loom of stars. It glows faintly, like the Milky Way.' },
  ],
  tales: [
    {
      id: 'fk4-usagi',
      region: 4,
      yokai: 'tsuki-usagi',
      title: 'Mochi for the Moon',
      jp: 'つきの うさぎの おもち',
      summary: 'The moon rabbit came down for the moon-viewing, but forgot the rice — and the mortar is cold.',
      giver: 'fk4-usagi',
      stages: [
        { en: 'Find white rice at the offering stand before the main hall', jp: 'ほんでんの まえの おそなえだいで しろい こめを さがそう', target: ['fk4-sonae'], map: 'shrine' },
        { en: 'Warm the rabbit’s cold mortar: cast あつい (hot) at it', jp: 'つめたい うすに「あつい」と となえよう', target: ['fk4-usu'], map: 'shrine' },
        { en: 'Make the moon-viewing mochi with the rabbit', jp: 'うさぎと いっしょに おつきみの おもちを つくろう', target: ['fk4-usagi'], map: 'shrine' },
      ],
    },
    {
      id: 'fk4-noppera',
      region: 4,
      yokai: 'noppera-bo',
      title: 'The Face Left Blank',
      jp: 'かおの ない ひと',
      summary: 'A spirit by the lantern path has forgotten its own face, and wants it written back.',
      giver: 'fk4-noppera',
      stages: [
        { en: 'Find the noppera-bō’s old portrait in the library — it’s too dark to read without light', jp: 'としょかんで のっぺらぼうの ふるい えを さがそう（くらくて よめない…）', target: ['fk4-portrait'], map: 'shrine-library' },
        { en: 'Help the noppera-bō write its face back, as the portrait describes it', jp: 'えの とおりに、のっぺらぼうの かおを かこう', target: ['fk4-noppera'], map: 'shrine' },
      ],
    },
    {
      id: 'fk4-tanabata',
      region: 4,
      yokai: 'tanabata',
      title: 'A Bridge of Wings',
      jp: 'たなばたの ねがい',
      summary: 'Tonight is Tanabata. If the wish bamboo fills up, the magpies may bridge the River of Heaven.',
      giver: 'fk4-tsumugi',
      stages: [
        { en: 'Write three wishes: cast かく (write) at the wish bamboo', jp: 'ねがいの ささに「かく」と となえて、たんざくを 3まい かこう', target: ['fk4-sasa'], map: 'shrine' },
        { en: 'Call the magpies: cast とり (bird) at the wish bamboo, then build the bridge', jp: 'ささに「とり」と となえて かささぎを よび、はしを かけよう', target: ['fk4-sasa'], map: 'shrine' },
        { en: 'Watch the two stars meet on the bridge', jp: 'はしの うえで ふたつの ほしが あうのを みまもろう', target: ['fk4-orihime', 'fk4-hikoboshi'], map: 'shrine' },
      ],
    },
  ],
  entities: {
    shrine: [
      { id: 'fk4-usagi', kind: 'npc', sprite: 'cat', x: 25, y: 28, dir: 'right', name: USAGI, lines: [{ jp: 'ぴょん。つきが きれいな よるだね。', en: 'Hop. What a lovely moonlit night.' }] },
      { id: 'fk4-usu', kind: 'landmark', tile: 'pot', x: 25, y: 27, name: { jp: 'もちつきの うす', en: 'Mochi Mortar' }, lines: [{ jp: 'きの うす。もちを つく どうぐ。', en: 'A wooden mortar for pounding mochi.' }] },
      { id: 'fk4-sonae', kind: 'landmark', tile: 'altar', x: 26, y: 9, name: { jp: 'おそなえだい', en: 'Offering Stand' }, lines: [{ jp: 'かみさまへの おそなえが ならんでいる。', en: 'Offerings to the gods are set out in a row.' }] },
      { id: 'fk4-noppera', kind: 'npc', sprite: 'villager-b', x: 19, y: 26, dir: 'left', name: { jp: 'ないている ひと', en: 'Weeping Figure' }, lines: [{ jp: '…しく しく…', en: '…sob… sob…' }] },
      { id: 'fk4-sasa', kind: 'landmark', tile: 'bamboo', x: 6, y: 8, name: { jp: 'ねがいの ささ', en: 'Wish Bamboo' }, lines: [{ jp: 'ささの はが さらさら なっている。', en: 'The bamboo leaves whisper sara-sara.' }] },
      { id: 'fk4-tsumugi', kind: 'npc', sprite: 'child', x: 5, y: 9, dir: 'up', name: TSUMUGI, lines: [{ jp: 'こんやは たなばた！', en: 'Tonight is Tanabata!' }] },
      { id: 'fk4-orihime', kind: 'npc', sprite: 'wisp', x: 5, y: 4, dir: 'right', name: ORIHIME, lines: [{ jp: 'はたを おる おとが、ほしの ように ひびく…', en: 'The sound of a loom, ringing like starlight…' }] },
      { id: 'fk4-hikoboshi', kind: 'npc', sprite: 'wisp', x: 10, y: 4, dir: 'left', name: HIKOBOSHI, lines: [{ jp: 'うしたちは げんきだよ。', en: 'The cattle are doing well.' }] },
    ],
    'shrine-library': [
      { id: 'fk4-portrait', kind: 'landmark', tile: 'sign', x: 10, y: 5, name: { jp: 'くらい え', en: 'Dark Portrait' }, lines: [{ jp: 'かべに かかった ふるい え。くらくて よく みえない。', en: 'An old portrait on the wall. It’s too dark to make out.' }] },
    ],
  },
  visible: {
    'fk4-orihime': (s) => stageOf(s, 'fk4-tanabata') >= 2,
    'fk4-hikoboshi': (s) => stageOf(s, 'fk4-tanabata') >= 2,
  },
  ghost: {
    'fk4-orihime': (s) => !met(s),
    'fk4-hikoboshi': (s) => !met(s),
  },
  moved: {
    // Once the bridge is crossed, the two stars stand side by side.
    'fk4-orihime': (s) => (met(s) ? { x: 7, y: 4 } : null),
    'fk4-hikoboshi': (s) => (met(s) ? { x: 8, y: 4 } : null),
  },
  talk: {
    // ── Moon rabbit ──
    'fk4-usagi': (c) => {
      const st = c.stage('fk4-usagi')
      if (st < 0)
        return offer(
          c,
          'fk4-usagi',
          [
            c.narrate('いけの ほとりに、しろくて ちいさな うさぎが いる。みみが しょんぼり たれている。', 'By the pond sits a small white rabbit, its long ears drooping.'),
            c.say('こんばんは。わたしは つきの うさぎ。おつきみの おもちを つきに、おりて きたの。', 'Good evening. I’m the rabbit from the moon. I came down to pound mochi for the moon-viewing.'),
            c.say('でも、こめを わすれちゃった。それに、うすが つめたくて… これじゃ おもちが つけない。', 'But I forgot the rice. And my mortar is so cold… I can’t make mochi like this.'),
            c.fude('つきの うさぎ！ ほんとうに つきから きたんだ…！', 'The moon rabbit! It really came down from the moon…!'),
          ],
          ['てつだう！', 'I’ll help!'],
        )
      if (st === 0) return [c.say('ほんでんの まえの おそなえだいに、こめが あるはず。しろい こめ だよ！', 'There should be rice on the offering stand before the main hall. White rice!')]
      if (st === 1) return [c.say('こめ、ありがとう！ でも うすが まだ つめたいの。あつく して くれる？', 'Thank you for the rice! But the mortar is still cold. Can you make it hot?'), c.fude('うすに「あつい」と となえよう！', 'Let’s cast あつい (hot) at the mortar!')]
      if (st === 2) return [c.say('うすが ぽかぽか！ さあ、いっしょに つこう。ぺったん、ぺったん！', 'The mortar’s nice and warm! Let’s pound together. Pettan, pettan!'), shapeMochi(c)]
      const n = c.flag('fk4.usagi.chat')
      c.set('fk4.usagi.chat', n + 1)
      const [jp, en] = USAGI_CHAT[n % USAGI_CHAT.length]
      return [c.say(jp, en)]
    },
    'fk4-sonae': (c) => {
      if (c.stage('fk4-usagi') !== 0) return null
      return [
        c.narrate('おそなえだいに、みっつの おわんが ならんでいる。', 'Three bowls sit on the offering stand.'),
        c.choice({ jp: 'どの おわんを もらう？', en: 'Which bowl will you take?' }, [['akai', 'あかい まめ', 'Red beans'], ['shiroi', 'しろい こめ', 'White rice'], ['kuroi', 'くろい ごま', 'Black sesame']], (id) => {
          if (id !== 'shiroi') return [c.narrate(id === 'akai' ? 'あかい まめ。…おいしそう だけど、うさぎは「しろい」と いっていた。' : 'くろい ごま。…うさぎは「しろい」と いっていた。', id === 'akai' ? 'Red beans. …Tasty, but the rabbit said white.' : 'Black sesame. …The rabbit said white.')]
          c.learn('shiroi')
          c.learn('ta-rice')
          c.sparkle('spark')
          return [c.narrate('てを あわせて、しろい こめを すこし わけて もらった。', 'You put your hands together in thanks and take a little of the white rice.'), ...c.give('fk4-rice'), ...c.advance('fk4-usagi')]
        }),
      ]
    },
    'fk4-usu': (c) => {
      const st = c.stage('fk4-usagi')
      if (st === 1) return [c.narrate('きの うす。さわると こおりの ように つめたい。', 'A wooden mortar, cold as ice to the touch.'), c.fude('「あつい」と となえて あたためよう！', 'Cast あつい to warm it up!')]
      if (st >= 2) return [c.narrate('うすから、ほかほか ゆげが たっている。', 'Steam curls up from the warm mortar.')]
      return null
    },
    // ── Noppera-bō ──
    'fk4-noppera': (c) => {
      const st = c.stage('fk4-noppera')
      if (st < 0)
        return offer(
          c,
          'fk4-noppera',
          [
            c.narrate('とうろうの そばで、だれかが そでに かおを うずめて ないている。', 'By the lanterns, someone is crying with their face buried in their sleeves.'),
            c.fude('あの… だいじょうぶ ですか？', 'Um… are you all right?'),
            c.narrate('その ひとが ゆっくり ふりむいた。…かおが ない。たまごの ように つるつるだ！', 'The figure slowly turns around. …There is no face. It’s as smooth as an egg!'),
            c.fude('きゃああああっ！？', 'KYAAAAAH!?'),
            nb(c, 'ご、ごめんなさい！ おどろかす つもりじゃ なかったの。', 'I-I’m sorry! I didn’t mean to scare you.'),
            nb(c, 'わたしは のっぺらぼう。むかしは わざと つるんと して、たびびとを おどろかせていたの。', 'I’m a noppera-bō. I used to go smooth on purpose, to startle travellers.'),
            nb(c, 'でも りゅうの しずけさが きて… ほんとうの かおを わすれて しまった。もどれないの。', 'But the dragon’s quiet came… and I forgot my real face. I can’t change back.'),
            nb(c, 'むかし、だれかが わたしの えを かいて くれた。としょかんに ある はず…', 'Long ago, someone painted my portrait. It should be in the library…'),
          ],
          ['かおを さがそう！', 'Let’s find your face!'],
        )
      if (st === 0) return [nb(c, 'としょかんの おくの かべに、わたしの え が… でも あそこは くらくて。', 'My portrait hangs on the back wall of the library… but it’s so dark in there.'), c.fude('くらいなら、ひかりの ことばだね！', 'If it’s dark, we need a word of light!')]
      if (st === 1) return [nb(c, 'え は みつかった？ …わたしの かお、かいて くれる？', 'You found the portrait? …Will you write my face for me?'), writeFace(c)]
      return [nb(c, 'みて、この おおきな め！ …ときどき つるんと させるけどね。ばあ！', 'Look at these big eyes! …I still go smooth sometimes, though. Boo!')]
    },
    'fk4-portrait': (c) => {
      const st = c.stage('fk4-noppera')
      if (st === 0) return [c.narrate('くらくて、え も もじも よく みえない。', 'It’s too dark to see the picture or the writing.'), c.fude('「ひかり」で てらして みよう！', 'Let’s light it up with ひかり!')]
      if (st >= 1) return [c.narrate('ふるい え。かおの ところだけ、すっかり うすれている。', 'An old portrait. Only the face has faded away completely.'), c.narrate('「め は おおきくて、くち は ちいさい。かみ は ながくて くろい。」', '“Big eyes, a small mouth. Long, black hair.”')]
      return null
    },
    // ── Tanabata ──
    'fk4-tsumugi': (c) => {
      const st = c.stage('fk4-tanabata')
      if (st < 0)
        return onYes(
          offer(
          c,
          'fk4-tanabata',
          [
            c.say('こんばんは！ わたし つむぎ。こんやは たなばた なんだよ！', 'Good evening! I’m Tsumugi. Tonight is Tanabata!'),
            c.say('はたおりの おりひめと、うしかいの ひこぼしは、あまのがわの むこうと こっちに わかれて いるの。', 'Orihime the weaver and Hikoboshi the cowherd live on opposite banks of the River of Heaven.'),
            c.say('あえるのは 一ねんに 一ど だけ。かささぎが はしに なって くれたら、ね。', 'They can only meet once a year — if the magpies make them a bridge.'),
            c.say('ささが ねがいで いっぱいに なると、かささぎが くるの。でも わたし、まだ じが かけなくて…', 'The magpies come when the bamboo is full of wishes. But I can’t write very well yet…'),
          ],
          ['かいて あげる！', 'I’ll write them!'],
          ),
          () => [...c.give('fk4-tanzaku'), c.say('あかい かみは おかあさん、あおい かみは わたし、しろい かみは ほしの ふたりの ねがい！', 'Red is for Mum’s wish, blue is mine, and white is for the two stars!')],
        )
      if (st === 0) return [c.say('ささに「かく」と となえてね。あかい・あおい・しろい、3まい だよ！', 'Cast かく at the bamboo. Red, blue and white — three papers!')]
      if (st === 1) return [c.say('ねがいが いっぱい！ こんどは とりを よぼう。「とり」だよ！', 'So many wishes! Now let’s call the birds. Cast とり!')]
      if (st === 2) return [c.say('みて！ ほしが ふたつ、ささの うえに おりて きた！', 'Look! Two stars have come down above the bamboo!')]
      return [c.say('ふたりが あえた！ らいねんも、いっしょに たんざく かこうね。', 'They met! Let’s write tanzaku together next year too.')]
    },
    'fk4-sasa': (c) => {
      const st = c.stage('fk4-tanabata')
      if (st === 0) return [c.narrate('ささに たんざくを むすぶ ひもが ある。', 'There are strings on the bamboo for tying tanzaku.'), c.fude('「かく」と となえて、ねがいを かこう！', 'Cast かく to write the wishes!')]
      if (st === 1) return [c.narrate('たんざくが 3まい、さらさら ゆれている。', 'Three tanzaku flutter in the breeze.'), c.fude('「とり」で かささぎを よぼう！', 'Let’s call the magpies with とり!')]
      if (st >= 2) return [c.narrate('ねがいで いっぱいの ささ。よぞらに あまのがわが ながれている。', 'The bamboo hangs heavy with wishes. The River of Heaven flows across the night sky.')]
      return null
    },
    'fk4-orihime': (c) => {
      const st = c.stage('fk4-tanabata')
      if (st === 2) return meeting(c)
      if (st >= 3) return [c.say('また らいねん。…でも、いちねんは あっと いうまよ。', 'Until next year. …A year passes in a blink, you know.', ORIHIME, 'wisp')]
      return null
    },
    'fk4-hikoboshi': (c) => {
      const st = c.stage('fk4-tanabata')
      if (st === 2) return meeting(c)
      if (st >= 3) return [c.say('うしたちに、あなたの ことを はなして おくよ。', 'I’ll tell the cattle all about you.', HIKOBOSHI, 'wisp')]
      return null
    },
  },
  cast: {
    // ── Moon rabbit ──
    'fk4-usu': (c, k) => {
      const st = c.stage('fk4-usagi')
      if (k === 'あつい') {
        c.learn('atsui')
        c.sparkle('spark')
        if (st === 1 && c.has('fk4-rice')) {
          c.take('fk4-rice')
          c.sfx('correct')
          return [c.narrate('「あつい」！ うすが ぽかぽかに なり、こめから しろい ゆげが たった。', '“Atsui”! The mortar glows warm, and white steam rises from the rice.'), c.say('ほかほか！ これで おもちが つける！', 'Piping hot! Now we can pound mochi!', USAGI, 'cat'), ...c.advance('fk4-usagi')]
        }
        return [c.narrate('うすが すこし あたたかく なった。', 'The mortar warms a little.')]
      }
      if (k === 'ひ') return (c.learn('hi'), [c.narrate('ひのこが ぱちっと はねた。…きの うすが もえたら たいへん！', 'Sparks crackle. …A wooden mortar on fire would be a disaster!'), c.fude('もやすんじゃ なくて、「あつい」に するんだよ。', 'Not burn it — make it あつい, hot.')])
      if (k === 'つめたい') return (c.learn('tsumetai'), [c.narrate('うすに しもが おりた。…もっと つめたく なった。', 'Frost settles on the mortar. …It’s even colder now.')])
      return null
    },
    'fk4-sonae': (c, k) => {
      if (k !== 'こめ') return null
      c.learn('ta-rice')
      if (c.stage('fk4-usagi') !== 0) return [c.narrate('おそなえの こめが、つきあかりに しろく ひかった。', 'The offering rice shines white in the moonlight.')]
      c.sparkle('spark')
      return [c.narrate('「こめ」！ しろい こめの おわんが ふわりと ひかった。', '“Kome”! The bowl of white rice glows softly.'), ...c.give('fk4-rice'), ...c.advance('fk4-usagi')]
    },
    'fk4-usagi': (c, k) => {
      if (k === 'つき') return (c.learn('tsuki'), [c.say('つき… わたしの おうち。きょうは まんまるで、きれい。', 'The moon… my home. It’s perfectly round tonight, and beautiful.')])
      if (k === 'しろい') return (c.learn('shiroi'), [c.say('うん、しろい！ ふわふわでしょ？', 'Yep, white! Fluffy, right?')])
      if (k === 'おいしい') return (c.learn('oishii'), [c.say(c.stage('fk4-usagi') >= 3 ? 'でしょ？ つきの おもちは せかいいち！' : 'まだ おもちが ないよ〜。', c.stage('fk4-usagi') >= 3 ? 'Right? Moon mochi is the best in the world!' : 'There’s no mochi yet~')])
      if (k === 'はやい') return (c.learn('hayai'), [c.say('うさぎ だもん！ …かめには まけたけど。', 'I’m a rabbit! …Though I did lose to a tortoise once.')])
      return null
    },
    // ── Noppera-bō ──
    'fk4-portrait': (c, k) => {
      if (k === 'ひかり' || k === 'つき') {
        c.learn(k === 'ひかり' ? 'hikari' : 'tsuki')
        c.sparkle('spark')
        if (c.stage('fk4-noppera') !== 0) return [c.narrate('え が ほんのり てらされた。', 'The portrait is gently lit.')]
        return [
          c.narrate(k === 'ひかり' ? '「ひかり」！ やさしい ひかりが、かべの え を てらした。' : '「つき」！ まどから つきの ひかりが さしこみ、かべの え を てらした。', k === 'ひかり' ? '“Hikari”! A gentle light falls on the portrait.' : '“Tsuki”! Moonlight slants through the window onto the portrait.'),
          c.narrate('かおの ところは うすれて いるが、したに もじが のこっていた。', 'The face itself has faded, but words remain beneath it.'),
          c.narrate('「め は おおきくて、くち は ちいさい。かみ は ながくて くろい。」', '“Big eyes, a small mouth. Long, black hair.”'),
          c.narrate('かいた ひとの なまえも ある… でも、すりきれて よめない。', 'There’s a painter’s name too… but it’s worn away past reading.'),
          c.fude('…よめない なまえ。なんだか、ほうって おけないね。', '…A name no one can read. I can’t quite let that go.'),
          ...c.give('fk4-portrait'),
          ...c.advance('fk4-noppera'),
        ]
      }
      if (k === 'ひ') return (c.learn('hi'), [c.fude('まって！ ほんの へやで ひは だめ！ もえない ひかりに しよう。', 'Wait! No fire in a room full of books! Let’s use a light that doesn’t burn.')])
      if (k === 'よむ') return (c.learn('yomu'), [c.narrate(c.stage('fk4-noppera') >= 1 ? '「め は おおきくて、くち は ちいさい。かみ は ながくて くろい。」' : 'くらすぎて よめない…', c.stage('fk4-noppera') >= 1 ? '“Big eyes, a small mouth. Long, black hair.”' : 'Too dark to read…')])
      return null
    },
    'fk4-noppera': (c, k) => {
      const done = c.stage('fk4-noppera') >= 2
      if (k === 'め' || k === 'くち') {
        c.learn(k === 'め' ? 'me' : 'kuchi')
        if (done) return [nb(c, k === 'め' ? 'ぱちぱち。ちゃんと みえてるよ。' : 'にっこり。', k === 'め' ? 'Blink blink. I can see just fine.' : '*smiles*')]
        return [c.narrate(k === 'め' ? 'め が ひとつ、おでこに ぽこっと でて… すぐ きえた。' : 'くち が ほっぺに でて… すぐ きえた。', k === 'め' ? 'An eye pops up on the forehead… and fades right away.' : 'A mouth appears on a cheek… and fades right away.'), c.fude('どんな め か、どんな くち か、ちゃんと わからないと だめ みたい。', 'I think we need to know exactly what kind first.')]
      }
      if (k === 'なまえ') return (c.learn('namae'), [nb(c, 'のっぺらぼう。「のっぺり した かお」って いみ。…なまえだけは わすれなかったの。', 'Noppera-bō. It means “smooth, flat face.” …My name, at least, I never forgot.')])
      if (k === 'きれい' && done) return (c.learn('kirei'), [nb(c, 'きれい？ …かおが あると、てれるって わかったわ。', 'Beautiful? …Now that I have a face, I’ve learned what blushing is.')])
      return null
    },
    // ── Tanabata ──
    'fk4-sasa': (c, k) => {
      const st = c.stage('fk4-tanabata')
      if (k === 'かく') {
        c.learn('kaku')
        if (st === 0 && c.has('fk4-tanzaku')) return writeWish(c)
        return [c.narrate('ささに かける たんざくが ない。', 'You have no tanzaku to hang.')]
      }
      if (k === 'とり') {
        c.learn('tori')
        if (st !== 1) return [c.narrate('とおくで とりが ないた。', 'A bird calls far away.')]
        c.sparkle('leaf')
        return [c.narrate('「とり」！ ささが ゆれて… カチカチ、カチカチ！ くろと しろの かささぎが あつまって きた！', '“Tori”! The bamboo sways… kachi-kachi, kachi-kachi! Black-and-white magpies gather!'), buildBridge(c)]
      }
      if (k === 'ほし') return (c.learn('hoshi'), c.sparkle('spark'), [c.narrate('ささの うえで、ほしが ちかちか またたいた。', 'Stars twinkle above the bamboo.')])
      return null
    },
    'fk4-tsumugi': (c, k) => {
      if (k === 'ほし') return (c.learn('hoshi'), [c.say('あれが おりひめ、あれが ひこぼし。あいだの しろい ながれが あまのがわ！', 'That one’s Orihime, that one’s Hikoboshi. The white stream between them is the River of Heaven!')])
      if (k === 'かく') return (c.learn('kaku'), [c.say('わたしも かけるように なりたいな。かんじ、むずかしい…', 'I want to learn to write too. Kanji are hard…')])
      return null
    },
    'fk4-orihime': (c, k) => (k === 'きれい' ? (c.learn('kirei'), [c.say('この ぬのの こと？ …ふふ、ありがとう。', 'My weaving? …Hehe, thank you.', ORIHIME, 'wisp')]) : null),
    'fk4-hikoboshi': (c, k) => (k === 'つよい' ? (c.learn('tsuyoi'), [c.say('うしの ほうが ずっと つよいよ。', 'The cattle are much stronger than me.', HIKOBOSHI, 'wisp')]) : null),
  },
}

/**
 * Region 4 — the Shrine of Reading, by night. Three tales: give the Silent
 * Librarian back the name the dragon's shadow ate (a sealed lectern opened
 * with かぎ, a blank scroll read by moonlight with つき, her riddles, then
 * her name), ring the midnight bells in a riddle's colour order for Ponta the
 * tanuki, and play hide-and-seek with three sleepy hitodama. Plus an omikuji
 * box with opinions.
 */
import { ACTIVITY_BY_ID, bossOf } from '../../data/regions'
import { isPassed, type PlayerState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import { offer } from './r1-village'
import type { Ctx, TaleContent } from './types'

const KOHAKU = { jp: 'こはく', en: 'Kohaku' }
const PONTA = { jp: 'ぽんた', en: 'Ponta' }
const SHIORI = { jp: 'しおり', en: 'Shiori' }
const KID = { jp: 'ちいさな ひとだま', en: 'Little Hitodama' }

const flagOf = (s: PlayerState, k: string) => s.flags?.[k] ?? 0
const stageOf = (s: PlayerState, tale: string) => s.flags?.[`tale.${tale}`] ?? -1
/** True the first time (per key) — for one-off rewards on playful casts. */
const first = (c: Ctx, key: string) => {
  const f = !c.flag(key)
  c.set(key)
  return f
}
/** Keep an activity host's activity reachable after a short story line. */
const host = (c: Ctx, activity: string): Step[] => {
  const a = ACTIVITY_BY_ID.get(activity)
  return a ? [{ kind: 'activity', activity: a, speaker: c.speaker, portrait: c.portrait }] : []
}

// ─── Night bells ─────────────────────────────────────────────────────
const BELLS: Record<string, { kana: string; word: string }> = {
  's-nbell-red': { kana: 'あかい', word: 'akai' },
  's-nbell-white': { kana: 'しろい', word: 'shiroi' },
  's-nbell-blue': { kana: 'あおい', word: 'aoi' },
}
/** Snow's colour, then the sky's, then flame's. */
const BELL_ORDER = ['s-nbell-white', 's-nbell-blue', 's-nbell-red']
const COLOUR_WORDS = new Set(Object.values(BELLS).map((b) => b.kana))

function ringBell(c: Ctx, id: string, k: string): Step[] | null {
  const bell = BELLS[id]
  if (k !== bell.kana) return COLOUR_WORDS.has(k) ? [c.narrate('すずは しーんと している。…この すずの いろじゃ ないみたい。', 'The bell stays silent. …That isn’t its colour.')] : null
  c.learn(bell.word)
  c.sparkle('spark')
  if (c.stage('night-bells') !== 0) return [c.narrate('チリーン… すんだ ねが よぞらに とけていった。', 'Chiriiin… a clear note melts into the night sky.')]
  const n = c.flag('r4.bells')
  if (BELL_ORDER[n] !== id) {
    c.set('r4.bells', 0)
    c.sfx('wrong')
    return [
      c.narrate('ガラン！ ゴロン！ へんな おとが なりひびいた！', 'CLANG! BONG! A horribly wrong note rings out!'),
      c.say('ぽんぽこーっ！？', 'Ponpokooo!?', PONTA, 'tanuki'),
      c.narrate('とおくで ぽんたが びっくりして、やかんに ばけてしまった。', 'Far off, Ponta panics and turns into a kettle.'),
      c.fude('じゅんばんが ちがう みたい。さいしょから やりなおし！', 'Wrong order, I think. From the top!'),
    ]
  }
  c.set('r4.bells', n + 1)
  c.sfx('correct')
  const out: Step[] = [c.narrate(['リーン…♪', 'ゴーン…♪', 'チリン…♪'][n], ['Riiin…♪', 'Gooon…♪', 'Chirin…♪'][n])]
  if (n + 1 >= 3)
    out.push(
      c.narrate('3つの ねが かさなって、やしろ じゅうに ひびいた。', 'The three notes weave together and echo through the shrine.'),
      c.narrate('くもが ひらき、まんまるな つきが かおを だした！', 'The clouds part — and a perfectly round moon peeks out!'),
      ...c.advance('night-bells'),
    )
  else out.push(c.fude(`いい おと！ あと ${2 - n}つ！`, `Lovely! ${2 - n} to go!`))
  return out
}

// ─── Hitodama hide-and-seek ──────────────────────────────────────────
const KIDS = ['s-hd-1', 's-hd-2', 's-hd-3']
const HOME: Record<string, { x: number; y: number }> = { 's-hd-1': { x: 13, y: 32 }, 's-hd-2': { x: 18, y: 32 }, 's-hd-3': { x: 11, y: 33 } }
/** 0 hiding, 1 found (visible at the hiding spot), 2 gone home. */
const kid = (c: Ctx, id: string) => c.flag(`r4.${id}`)

function kidHome(c: Ctx, id: string): Step[] {
  c.set(`r4.${id}`, 2)
  const out: Step[] = [c.narrate('ちいさな ひとだまは、ふわふわ おかあさんの ところへ とんでいった。', 'The little hitodama floats off home to its mother.')]
  const n = KIDS.filter((k) => kid(c, k) >= 2).length
  if (c.stage('hitodama') === 0 && n >= 3) out.push(c.fude('3人 ぜんいん みつけた！ ともしびさんに しらせよう！', 'That’s all three! Let’s tell Tomoshibi!'), ...c.advance('hitodama'))
  else if (c.stage('hitodama') === 0) out.push(c.fude(`あと ${3 - n}人！`, `${3 - n} left to find!`))
  return out
}

// ─── Omikuji ─────────────────────────────────────────────────────────
const FORTUNES: { jp: string; en: string; item: string }[] = [
  { jp: '【大吉】「ことばが どんどん おぼえられる。ただし とりに ごはんを とられる。」', en: '【Great Luck】 “Words will stick like glue. A bird will steal your lunch.”', item: 'charm' },
  { jp: '【中吉】「まいごの ねこが みつかる。…ねこの ほうが あなたを さがしていた。」', en: '【Good Luck】 “A lost cat will be found. …It was looking for you.”', item: 'herb' },
  { jp: '【小吉】「たびは じゅんちょう。くつしたは かたほう なくなる。」', en: '【Small Luck】 “Your journey goes smoothly. One sock will vanish.”', item: 'herb' },
  { jp: '【吉】「まちびと きたる。ただし 3じかん おくれて。」', en: '【Luck】 “The one you wait for will come. Three hours late.”', item: 'ether' },
  { jp: '【凶】「わすれものに ちゅうい。…いま、なにか わすれてない？」', en: '【Bad Luck】 “Beware forgotten things. …Did you forget something just now?”', item: 'smoke' },
]

function drawOmikuji(c: Ctx): Step[] {
  const n = c.flag('r4.omikuji')
  c.set('r4.omikuji', n + 1)
  if (n > 0 && n % 5 === 4) return [c.narrate('はこの なかから こえが した。「…ひきすぎです。」', 'A voice from inside the box: “…You’re drawing too many.”'), c.fude('はこが しゃべった！？', 'The box talked!?')]
  const f = FORTUNES[Math.floor(Math.random() * FORTUNES.length)]
  c.sparkle('spark')
  const out: Step[] = [c.narrate('からから… ぽとん。', 'Rattle, rattle… plop.'), c.narrate(f.jp, f.en)]
  if (f.item === 'smoke') out.push(c.fude('わるい おみくじは 木に むすんで、かみさまに あずけよう！', 'Tie bad fortunes to a tree and let the gods take them away!'))
  if (n === 0) out.push(c.narrate('はこの そこに、なにか はいっていた。', 'Something was tucked in the bottom of the box.'), ...c.bagItem(f.item, 1), ...c.reward(15, 5))
  return out
}

// ─── Shiori (main) ───────────────────────────────────────────────────
function askName(c: Ctx): Step {
  return c.ask({ jp: 'ししょの ほんとうの なまえを よぼう', en: 'Call the librarian by her true name' }, 'しおり', (ok) => {
    if (!ok) return [c.narrate('…ちがう なまえ。ひかりが さみしそうに ゆれた。', '…Not her name. The light flickers sadly.'), c.fude('まきものに かいてあったよ！ だいじな もちものを みてみて。', 'It was written in the scroll! Check your key items.')]
    c.take('name-scroll')
    c.sparkle('spark')
    c.sfx('correct')
    return [
      c.narrate('「しおり」── なまえを よぶと、ひかりが ぱあっと ひろがった！', '“Shiori” — at her name, the pale light blooms!'),
      c.say('しおり… そう、わたしは しおり！', 'Shiori… Yes! I’m Shiori!', SHIORI, 'wisp'),
      c.say('ああ、こえが でる！ ひゃくねんぶん はなしたい ことが あるの！', 'Oh, I have a voice! I have a hundred years of talking to do!', SHIORI, 'wisp'),
      c.say('まず ほんの はなし。つぎに ほんの はなし。それから ほんの…', 'First, books. Next, books. And after that, books…', SHIORI, 'wisp'),
      c.fude('…もう「しずかな ししょ」じゃ ないね。', '…Not so “silent” any more.'),
      c.say('これ、おれい。わたしの しおり。…ふふ、しおりの しおり！', 'Here, as thanks — my bookmark. Hehe, Shiori’s shiori!', SHIORI, 'wisp'),
      ...c.give('shiori-mark'),
      ...c.bagItem('ether', 2),
      ...c.reward(120, 40),
      ...c.advance('shiori'),
    ]
  })
}

const SHIORI_CHAT: [string, string][] = [
  ['しってる？「本」って 木の ねもとに しるしを つけた もじ なのよ。', 'Did you know? 本 is a tree with a mark at its roots — the “origin” of things.'],
  ['「しずか」の ほんを かいたの。1ページも しずかじゃ ないけど。', 'I wrote a book called “Quiet”. Not one page of it is quiet.'],
  ['こはくが「しゃべりすぎ」って いうの。ひどいと おもわない？ ねえ？ ねえ？', 'Kohaku says I talk too much. Isn’t that mean? Isn’t it? Isn’t it?'],
  ['つぎの しゅくだい：ほんを 1さつ よむこと。…10さつでも いいのよ？', 'Your homework: read one book. …Ten is also fine, you know?'],
]

export const SHRINE_TALES: TaleContent = {
  items: [
    { id: 'blank-scroll', name: 'Blank Scroll', jp: 'まっしろな まきもの', kana: 'まきもの', emoji: '📜', desc: 'Sealed in the library lectern. Its pages are blank… or are they?' },
    { id: 'name-scroll', name: 'Scroll of a Name', jp: 'なまえの まきもの', kana: 'まきもの', emoji: '📜', desc: 'Moonlight revealed one line: わたしの なまえは しおり — “My name is Shiori.”' },
    { id: 'shiori-mark', name: 'Shiori’s Bookmark', jp: 'しおりの しおり', kana: 'しおり', emoji: '🔖', desc: 'A pressed-flower bookmark. しおり means “bookmark” — its owner finds this hilarious.' },
    { id: 'ponta-leaf', name: 'Ponta’s Leaf', jp: 'ぽんたの はっぱ', kana: 'はっぱ', emoji: '🍃', desc: 'A tanuki transformation leaf. Put it on your head and… nothing happens. Needs practice.' },
    { id: 'hitodama-lantern', name: 'Hitodama Lantern', jp: 'ひとだま ちょうちん', kana: 'ちょうちん', emoji: '🏮', desc: 'Glows with a soft blue spirit-light. Sometimes it giggles.' },
  ],
  tales: [
    {
      id: 'shiori',
      region: 4,
      main: true,
      title: 'The Librarian’s Name',
      jp: 'ししょの なまえ',
      summary: 'The dragon’s shadow ate the librarian’s name. Without it, she can only speak in riddles.',
      giver: 's-kohaku',
      stages: [
        { en: 'Open the sealed lectern in the library: cast かぎ (key) at it', jp: 'としょかんの ふういんされた けんだいに「かぎ」と となえよう', target: ['sl-lectern'], map: 'shrine-library' },
        { en: 'The scroll is blank. Cast つき (moon) at the Moon-Viewing Stone by the koi pond', jp: 'まっしろな まきもの… いけの「つきみいし」で「つき」と となえよう', target: ['s-tsukimi'], map: 'shrine' },
        { en: 'Answer the Silent Librarian’s riddles — then see what remains of her', jp: 'しずかな ししょの なぞに こたえよう', target: ['sl-librarian', 'sl-shiori'], map: 'shrine-library' },
        { en: 'Give the librarian back her true name', jp: 'ししょに ほんとうの なまえを かえそう', target: ['sl-shiori'], map: 'shrine-library' },
      ],
    },
    {
      id: 'night-bells',
      region: 4,
      title: 'The Midnight Bells',
      jp: 'まよなかの すず',
      summary: 'Ponta the tanuki forgot the order of the midnight bells, and the moon won’t come out.',
      giver: 's-ponta',
      stages: [
        { en: 'Ring the bells in the riddle’s order — snow’s colour, sky’s colour, flame’s colour — by casting each bell’s colour at it', jp: 'ゆきの いろ → そらの いろ → ほのおの いろ の じゅんに、いろの ことばで すずを ならそう', target: BELL_ORDER, map: 'shrine' },
        { en: 'Tell Ponta the moon is out', jp: 'ぽんたに つきが でたと つたえよう', target: ['s-ponta'], map: 'shrine' },
      ],
    },
    {
      id: 'hitodama',
      region: 4,
      title: 'Hitodama Hide-and-Seek',
      jp: 'ひとだまの かくれんぼ',
      summary: 'It’s long past bedtime and three little spirit-flames won’t stop hiding.',
      giver: 's-tomoshibi',
      stages: [
        { en: 'Find the three hiding hitodama: one loves the old tree, one loves cold water, one hides by a dark rock and hates bright light', jp: 'ひとだまを 3人 さがそう：ふるい 木・つめたい みず・くらい いわ（まぶしいのが にがて）', map: 'shrine' },
        { en: 'Tell Tomoshibi her children are home', jp: 'ともしびに こどもたちが かえったと つたえよう', target: ['s-tomoshibi'], map: 'shrine' },
      ],
    },
  ],
  entities: {
    shrine: [
      { id: 's-kohaku', kind: 'npc', sprite: 'kitsune', x: 35, y: 22, dir: 'left', name: KOHAKU, lines: [{ jp: 'コン。よるの やしろは、ことばが よく ひびく。', en: 'Kon. Words echo well in the shrine at night.' }] },
      { id: 's-tsukimi', kind: 'landmark', tile: 'rock', x: 26, y: 28, name: { jp: 'つきみいし', en: 'Moon-Viewing Stone' }, lines: [{ jp: 'たいらな いし。いけに つきが うつる ばしょ。', en: 'A flat stone, right where the moon reflects in the pond.' }] },
      { id: 's-ponta', kind: 'npc', sprite: 'tanuki', x: 34, y: 11, dir: 'down', name: PONTA, lines: [{ jp: 'ぽんぽこ！', en: 'Ponpoko!' }] },
      { id: 's-nbell-red', kind: 'landmark', tile: 'shrine-bell', x: 32, y: 9, name: { jp: '赤い すず', en: 'Red Bell' }, lines: [{ jp: 'ひもに ふだ：「わが いろを よべ」', en: 'A tag on the rope: “Call my colour.”' }] },
      { id: 's-nbell-white', kind: 'landmark', tile: 'shrine-bell', x: 34, y: 9, name: { jp: '白い すず', en: 'White Bell' }, lines: [{ jp: 'ひもに ふだ：「わが いろを よべ」', en: 'A tag on the rope: “Call my colour.”' }] },
      { id: 's-nbell-blue', kind: 'landmark', tile: 'shrine-bell', x: 36, y: 9, name: { jp: '青い すず', en: 'Blue Bell' }, lines: [{ jp: 'ひもに ふだ：「わが いろを よべ」', en: 'A tag on the rope: “Call my colour.”' }] },
      { id: 's-tomoshibi', kind: 'npc', sprite: 'wisp', x: 16, y: 32, dir: 'down', name: { jp: 'ともしび', en: 'Tomoshibi' }, lines: [{ jp: 'よるは ひとだまの じかん。…でも こどもは ねる じかん。', en: 'Night is spirit time. …But also bedtime.' }] },
      { id: 's-koi', kind: 'landmark', tile: 'sign', x: 32, y: 33, name: { jp: 'こいの いけ', en: 'Koi Pond' }, lines: [{ jp: 'こいが ゆったり およいでいる。みずは とても つめたい。', en: 'Koi drift lazily. The water is very cold.' }] },
      { id: 's-darkrock', kind: 'landmark', tile: 'rock', x: 5, y: 25, name: { jp: 'くらい いわ', en: 'Dark Rock' }, lines: [{ jp: 'いわの かげが みょうに くらい…', en: 'The shadow behind this rock is strangely dark…' }] },
      { id: 's-hd-1', kind: 'npc', sprite: 'wisp', x: 16, y: 19, name: KID, lines: [{ jp: 'きゃはは！', en: 'Eeheehee!' }] },
      { id: 's-hd-2', kind: 'npc', sprite: 'wisp', x: 28, y: 33, name: KID, lines: [{ jp: 'ぷくぷく…', en: 'Blub blub…' }] },
      { id: 's-hd-3', kind: 'npc', sprite: 'wisp', x: 4, y: 27, name: KID, lines: [{ jp: 'すぴー…', en: 'Zzz…' }] },
      { id: 's-omikuji', kind: 'landmark', tile: 'altar', x: 18, y: 11, name: { jp: 'おみくじばこ', en: 'Omikuji Box' }, lines: [{ jp: 'おみくじばこ。「ひとり 一まい」', en: 'A fortune box. “One per person.”' }] },
    ],
    'shrine-library': [
      { id: 'sl-lectern', kind: 'landmark', tile: 'altar', x: 2, y: 5, name: { jp: 'ふういんの けんだい', en: 'Sealed Lectern' }, lines: [{ jp: 'しっかり ふういんされた けんだい。', en: 'A firmly sealed lectern.' }] },
      { id: 'sl-shiori', kind: 'npc', sprite: 'wisp', x: 10, y: 8, dir: 'down', name: { jp: 'ししょの たましい', en: 'Librarian’s Spirit' }, lines: [{ jp: '…………。', en: '…………' }] },
    ],
  },
  visible: {
    'sl-shiori': (s) => stageOf(s, 'shiori') >= 2 && isPassed(s, bossOf(4).id),
    's-hd-1': (s) => stageOf(s, 'hitodama') >= 0 && flagOf(s, 'r4.s-hd-1') >= 1,
    's-hd-2': (s) => stageOf(s, 'hitodama') >= 0 && flagOf(s, 'r4.s-hd-2') >= 1,
    's-hd-3': (s) => stageOf(s, 'hitodama') >= 0 && flagOf(s, 'r4.s-hd-3') >= 1,
  },
  ghost: {
    'sl-shiori': (s) => stageOf(s, 'shiori') < 4,
    's-hd-1': () => true,
    's-hd-2': () => true,
    's-hd-3': () => true,
  },
  moved: {
    ...Object.fromEntries(KIDS.map((id) => [id, (s: PlayerState) => (flagOf(s, `r4.${id}`) >= 2 ? HOME[id] : null)])),
    // Once the boss is beaten (and gone), her spirit takes the librarian's own seat.
    'sl-shiori': (s) => (isPassed(s, bossOf(4).id) ? { x: 6, y: 3 } : null),
  },
  talk: {
    's-kohaku': (c) => {
      const st = c.stage('shiori')
      if (st < 0)
        return offer(
          c,
          'shiori',
          [
            c.say('コン… こんばんは、ちいさな まほうつかい。ぼくは こはく。', 'Kon… Good evening, little mage. I’m Kohaku.'),
            c.say('としょかんの ししょは、むかしは いちばんの おしゃべり だった。', 'The librarian used to be the chattiest soul in this shrine.'),
            c.say('でも りゅうの かげに なまえを たべられて… もう ひとことも。', 'Then the dragon’s shadow ate her name. Not a word since.'),
            c.say('なまえの ない たましいは、なぞでしか はなせないんだ。', 'A spirit with no name can only speak in riddles.'),
            c.say('ふういんの けんだいに、なまえが のこってる かも。コン。', 'Her name might survive in the sealed lectern. Kon.'),
          ],
          ['さがしてみる！', 'I’ll look for it!'],
        )
      if (st === 0) return [c.say('ふういんは「かぎ」の ことばで ひらく はず。', 'The seal should open to the word for “key”.')]
      if (st === 1) return [c.say('まっしろ？ …つきの ひかりでしか よめない インクかも。', 'Blank? …Maybe the ink only shows by moonlight.'), c.fude('いけの そばに「つきみいし」が あったね！', 'There’s a moon-viewing stone by the koi pond!')]
      if (st === 2) return [c.say('なまえが わかっても、まずは なぞに こたえないと きいて くれないよ。', 'Even with her name, she won’t listen till you answer her riddles.')]
      if (st === 3) return [c.say('はやく なまえを よんで あげて！ コン！', 'Hurry, call her name! Kon!')]
      return [c.say('しおりが また しゃべりだした。…ちょっと しゃべりすぎ かも。コン。', 'Shiori’s talking again. …Maybe a little too much. Kon.')]
    },
    'sl-lectern': (c) => {
      const st = c.stage('shiori')
      if (st === 0) return [c.narrate('ふるい けんだい。ふたに 一つの もじが きざまれている：「鍵」', 'An old lectern. A single kanji is carved on its lid: 鍵.'), c.fude('「鍵」は かぎ！「かぎ」と となえてみよう！', '鍵 means key — cast かぎ!')]
      if (st > 0) return [c.narrate('からっぽの けんだい。ほこりの かたちが まきものの あと。', 'An empty lectern. A scroll-shaped gap in the dust.')]
      return null
    },
    's-tsukimi': (c) => {
      if (c.stage('shiori') === 1) return [c.narrate('たいらな いし。いけの みずに、くもった よぞらが うつっている。', 'A flat stone. The pond mirrors a cloudy night sky.'), c.fude('ここで「つき」と となえよう！', 'Cast つき (moon) here!')]
      return null
    },
    'sl-librarian': (c) => {
      if (c.stage('shiori') !== 2) return null
      return [c.narrate('ししょは あなたの まきものを じっと みつめた…', 'The librarian stares at the scroll you carry…'), c.say('………なぞに こたえよ。そうすれば、きこう。', '………Answer my riddles. Then I will listen.'), ...host(c, 'r4-boss')]
    },
    'sl-shiori': (c) => {
      const st = c.stage('shiori')
      if (st === 2)
        return [
          c.narrate('ししょの すがたは、うすい ひかりに なって ただよっている。', 'What’s left of the librarian drifts like pale light.'),
          c.say('…なぞを とく ひと… ありがとう…', '…Solver of riddles… thank you…'),
          c.say('でも… わたしは… だれ…？', 'But… who… am I…?'),
          ...c.advance('shiori'),
          askName(c),
        ]
      if (st === 3) return [c.say('…わたしは… だれ…？', '…Who… am I…?'), askName(c)]
      if (st >= 4) {
        const n = c.flag('r4.shiori.chat')
        c.set('r4.shiori.chat', n + 1)
        const [jp, en] = SHIORI_CHAT[n % SHIORI_CHAT.length]
        return [c.say(jp, en, SHIORI, 'wisp')]
      }
      return null
    },
    's-ponta': (c) => {
      const st = c.stage('night-bells')
      if (st < 0)
        return offer(c, 'night-bells', [
          c.say('ぽんぽこ！ おいらは ぽんた。すずばんの… でしだ！ …じしょう。', 'Ponpoko! I’m Ponta, the bell-keeper’s apprentice! …Self-appointed.'),
          c.say('まよなかに 3つの すずを ただしい じゅんに ならすと、つきが でるんだ。', 'Ring the three bells in the right order at midnight, and the moon comes out.'),
          c.say('でも じゅんばん わすれちゃった。はっぱに メモした はず… あった！', 'But I forgot the order. I wrote it on a leaf… here!'),
          c.narrate('「はじめに ゆきの いろ、つぎに そらの いろ、さいごに ほのおの いろ」', '“First the colour of snow, then the colour of the sky, last the colour of flame.”'),
          c.say('すずは いろの ことばで なるんだ。たのむよ！', 'The bells only ring for colour words. Please!'),
        ])
      if (st === 0) return [c.say('ゆきの いろ… そらの いろ… ほのおの いろ… なんだっけ？', 'Snow’s colour… sky’s colour… flame’s colour… what were they again?'), c.fude('いろの ことば：あかい・あおい・しろい！', 'Colour words: あかい red, あおい blue, しろい white!')]
      if (st === 1)
        return [
          c.say('つきだ！ まんまるだ！ おいら、ほんものの すずばんに なれるかも！', 'The moon! It’s so round! Maybe I can be a real bell-keeper!'),
          c.narrate('ぽんたは うれしくて、おなかを ぽんぽこ たたいた。', 'Ponta drums on his belly for joy: pon-poko-pon!'),
          c.say('おれいに おいらの はっぱ！ あたまに のせると… なにも おきない。れんしゅうが いるんだ。', 'Take my leaf! Put it on your head and… nothing happens. It takes practice.'),
          ...c.give('ponta-leaf'),
          ...c.bagItem('ether', 2),
          ...c.reward(90, 30),
          ...c.advance('night-bells'),
        ]
      return [c.say('つきが きれいだね。…あっ、いまのは「きれい」の れんしゅう！', 'The moon is beautiful. …That was me practising きれい!')]
    },
    's-tomoshibi': (c) => {
      const st = c.stage('hitodama')
      if (st < 0)
        return offer(
          c,
          'hitodama',
          [
            c.say('こんばんは… わたしは ともしび。ひとだまの ははです。', 'Good evening… I’m Tomoshibi, a mother of hitodama.'),
            c.say('もう ねる じかんなのに、こどもたちが かくれんぼを やめないの。', 'It’s long past bedtime, and my little ones won’t stop playing hide-and-seek.'),
            c.say('ひとりは ふるい 木が すき。ひとりは つめたい みずが すき。', 'One loves the old tree. One loves cold water.'),
            c.say('もうひとりは くらい いわの かげ… まぶしいのが にがてなの。', 'The last hides by a dark rock… and can’t stand bright light.'),
            c.fude('かくれがに ことばを となえたら、でてくるかも！', 'If we cast words at their hiding spots, they might pop out!'),
          ],
          ['さがす！', 'I’ll find them!'],
        )
      if (st === 0) {
        const n = KIDS.filter((k) => kid(c, k) >= 2).length
        return [c.say(`あと ${3 - n}人… どこに いるのかしら。`, `${3 - n} still out there… where can they be?`)]
      }
      if (st === 1)
        return [
          c.say('みんな かえって きた！ ほら、おれいを いいなさい。', 'Everyone’s home! Now, say thank you.'),
          c.say('ありがと〜！ また あそぼ〜！', 'Thaaank you! Play again sometime!', KID, 'wisp'),
          c.say('この ちょうちんを どうぞ。こどもたちの ひかりが すこし はいっているの。', 'Take this lantern. There’s a little of my children’s light inside.'),
          ...c.give('hitodama-lantern'),
          ...c.bagItem('smoke', 2),
          ...c.reward(90, 30),
          ...c.advance('hitodama'),
        ]
      return [c.say('こどもたちは ぐっすり。…ねごとで あなたの なまえを よんでたわ。', 'The children are fast asleep. …One said your name in its sleep.')]
    },
    's-hd-1': (c) => (kid(c, 's-hd-1') >= 2 ? [c.say('ねむくない！ …ふぁ〜あ。', 'I’m not sleepy! …*yaaawn*')] : null),
    's-hd-2': (c) => {
      const k = kid(c, 's-hd-2')
      if (k >= 2) return [c.say('かわ って こたえ、よく わかったね〜。', 'You got “river”! Clever~')]
      if (k !== 1) return null
      return [
        c.say('なぞなぞに こたえたら、かえって あげても いいよ？', 'Answer my riddle and maybe I’ll go home?'),
        c.ask({ jp: '「あしが ないのに はしる。やまから うみまで。なあに？」', en: '“No legs, yet it runs, from the mountains to the sea. What is it?”' }, 'かわ', (ok) => {
          if (!ok) return [c.say('ぶっぶー！ また きてね〜', 'Bzzzt! Try again~'), c.fude('やまから うみへ ながれる もの… みずの みち！', 'Something that flows from mountain to sea… a road of water!')]
          c.learn('kawa')
          c.sparkle('ripple')
          return [c.say('せいかい！「かわ」！ …しかたない、かえる〜。', 'Correct! “Kawa”, river! …Fine, I’ll go home~'), ...kidHome(c, 's-hd-2')]
        }),
      ]
    },
    's-hd-3': (c) => {
      const k = kid(c, 's-hd-3')
      if (k >= 2) return [c.say('かくれんぼ ちゅうに ねちゃった… ぼくの かち？', 'I fell asleep hiding… does that mean I win?')]
      if (k === 1) return [c.narrate('すぴー… すぴー… ぐっすり ねている。', 'Zzz… zzz… fast asleep.'), c.fude('おこして あげよう。「おきる」！', 'Let’s wake it up — cast おきる!')]
      return null
    },
    's-omikuji': (c) => [
      c.narrate('おみくじばこ。「ひとり 一まい」と かいてある。', 'A fortune box. “One per person,” it says.'),
      c.choice({ jp: 'おみくじを ひく？', en: 'Draw a fortune?' }, [['draw', 'ひく', 'Draw one'], ['no', 'やめる', 'Leave it']], (id) => (id === 'draw' ? drawOmikuji(c) : undefined)),
    ],
  },
  cast: {
    // ── Shiori ──
    'sl-lectern': (c, k) => {
      if (k === 'かぎ') {
        c.learn('kagi')
        const st = c.stage('shiori')
        if (st === 0) {
          c.sparkle('spark')
          c.sfx('door')
          return [c.narrate('「かぎ」！ カチリ。ふういんが とけて、ふたが ひらいた。', '“Kagi”! Click. The seal dissolves and the lid swings open.'), c.narrate('なかには まきものが 一つ。…でも なにも かいてない。', 'Inside lies one scroll. …But it’s completely blank.'), ...c.give('blank-scroll'), ...c.advance('shiori')]
        }
        if (st > 0) return [c.narrate('けんだいは もう あいている。', 'The lectern is already open.')]
        return [c.narrate('カチリ… と おとが したが、ふういんは また しまった。', 'Click… then the seal snaps shut again.'), c.fude('ここの ことを しっている ひとに はなしを きこう。', 'Let’s ask someone who knows about this place.')]
      }
      if (k === 'ほん') return [c.fude('それは けんだい。ほんを のせる だい だよ。…おしい！', 'That’s a lectern — the stand a book sits on. …Close!')]
      if (k === 'よむ') return (c.learn('yomu'), [c.narrate('ふたの もじを よんだ：「鍵」。かぎ、だね。', 'You read the lid: 鍵. That’s “kagi”.')])
      return null
    },
    's-tsukimi': (c, k) => {
      if (k === 'つき') {
        c.learn('tsuki')
        c.sparkle('ripple')
        if (c.stage('shiori') === 1 && c.has('blank-scroll')) {
          c.take('blank-scroll')
          return [
            c.narrate('「つき」！ くもが わかれ、つきの ひかりが まきものを てらす…', '“Tsuki”! The clouds part and moonlight falls on the scroll…'),
            c.narrate('しろい かみに、ぎんいろの もじが うかびあがった！', 'Silver letters rise out of the white paper!'),
            c.narrate('「わたしの なまえは しおり。ほんの あいだで ねむる もの。」', '“My name is Shiori — one who sleeps between the pages.”'),
            c.fude('しおり… ほんに はさむ「しおり」と おなじ ことばだ！', 'Shiori… the same word as a bookmark you slip between pages!'),
            ...c.give('name-scroll'),
            ...c.advance('shiori'),
          ]
        }
        return [c.narrate('いけの みずに、まるい つきが ゆらゆら うつった。', 'A round moon wobbles on the surface of the pond.'), ...(first(c, 'cast.s-tsukimi') ? c.reward(10, 5) : [])]
      }
      if (k === 'ほし') return (c.learn('hoshi'), c.sparkle('ripple'), [c.narrate('いけに ほしが ちらばった。こいが それを たべようと している。', 'Stars scatter across the pond. A koi tries to eat one.')])
      return null
    },
    // ── Night bells ──
    ...Object.fromEntries(Object.keys(BELLS).map((id) => [id, (c: Ctx, k: string) => ringBell(c, id, k)])),
    's-ponta': (c, k) => {
      if (k === 'つき') return (c.learn('tsuki'), [c.say('つき！ つきを みると おなかを たたきたく なる！ ぽんぽこ♪', 'The moon! It makes me want to drum my belly! Ponpoko♪')])
      if (k === 'げんき') return (c.learn('genki'), c.sparkle('leaf'), [c.say('げんき ひゃくばい！', 'A hundred times more genki!'), c.narrate('ぽんたは はっぱを あたまに のせて、…じぞうに ばけた。なぜ。', 'Ponta puts a leaf on his head and… turns into a stone statue. Why.')])
      if (k === 'いぬ' || k === 'ねこ') return [c.say('おいらは たぬき！ いぬでも ねこでも ない！ …たぶん。', 'I’m a TANUKI! Not a dog, not a cat! …Probably.')]
      return null
    },
    // ── Hitodama ──
    's-old-tree': (c, k) => {
      if (k !== 'き' && k !== 'ふるい') return null
      c.learn(k === 'き' ? 'ki' : 'furui')
      c.sparkle('leaf')
      if (c.stage('hitodama') === 0 && kid(c, 's-hd-1') === 0)
        return [c.narrate('ざわっ！ ごしんぼくの うろから、あおい ひかりが とびだした！', 'Rustle! A blue light shoots out of the sacred tree’s hollow!'), c.say('きゃはは！ みつかっちゃった〜！', 'Eeheehee! You found me~!', KID, 'wisp'), ...kidHome(c, 's-hd-1')]
      if (k === 'ふるい') return [c.narrate('どこからか ひくい こえ：「だれが ふるい じゃ。…まあ、500さい じゃが。」', 'A deep voice from somewhere: “Who are you calling old? …Well, I am 500.”')]
      return [c.narrate('はっぱが ひらひら おちてきた。', 'Leaves come fluttering down.')]
    },
    's-koi': (c, k) => {
      if (k !== 'みず' && k !== 'つめたい' && k !== 'さかな') return null
      c.learn(k === 'みず' ? 'mizu' : k === 'つめたい' ? 'tsumetai' : 'sakana')
      c.sparkle('ripple')
      if (c.stage('hitodama') === 0 && kid(c, 's-hd-2') === 0) {
        c.set('r4.s-hd-2', 1)
        return [c.narrate('ぽちゃん！ みずの なかから あおい ひかりが とびだした！', 'Splash! A blue light bursts out of the water!'), c.say('ひえっ、つめた〜い！ …みつかっちゃった。', 'Eek, so cold! …You found me.', KID, 'wisp'), c.fude('はなしかけて みよう！', 'Let’s talk to it!')]
      }
      if (k === 'さかな') return [c.narrate('こいが ぱくぱく くちを あけた。えさだと おもったらしい。', 'The koi gape hopefully. They think it’s feeding time.')]
      return [c.narrate('いけが きらきら ゆれた。', 'The pond shimmers.')]
    },
    's-darkrock': (c, k) => {
      if (k !== 'ひかり' && k !== 'ひかる' && k !== 'ひ') return null
      c.learn(k === 'ひかり' ? 'hikari' : k === 'ひかる' ? 'hikaru' : 'hi')
      c.sparkle('spark')
      if (c.stage('hitodama') === 0 && kid(c, 's-hd-3') === 0) {
        c.set('r4.s-hd-3', 1)
        return [c.narrate('いわの かげが てらされて… まぶしい！', 'Light floods the shadow behind the rock…'), c.narrate('すや… すや… ひとだまが まるまって ねている。', 'Zzz… zzz… a hitodama is curled up, fast asleep.'), c.fude('かくれんぼ ちゅうに ねちゃったんだ！ おこして あげよう。', 'It fell asleep while hiding! Let’s wake it up.')]
      }
      return [c.narrate('いわの かげが きえて、ただの いわに なった。', 'The shadow vanishes. It’s just a rock now.')]
    },
    's-hd-3': (c, k) => {
      if (kid(c, 's-hd-3') !== 1) return null
      if (k === 'おきる') {
        c.learn('okiru')
        c.sparkle('spark')
        return [c.say('はっ！ …ねてない！ かくれてた だけ！', 'Huh! …I wasn’t asleep! I was just hiding!'), c.say('…ぼくの まけ？ かえる〜。', '…I lose? Okay, going home~'), ...kidHome(c, 's-hd-3')]
      }
      if (k === 'ねる') return (c.learn('neru'), [c.narrate('ひとだまは もっと ぐっすり ねむった。…ぎゃくこうか！', 'The hitodama sleeps even deeper. …Wrong spell!')])
      return null
    },
    // ── Playful reactions ──
    's-komainu': (c, k) => {
      if (k === 'おきる') return (c.learn('okiru'), c.sparkle('dust'), [c.narrate('いしの めが ぱちっと ひらいた…', 'The stone eyes snap open…'), c.say('…ねていない。みはって いたのだ。', '…I was not asleep. I was keeping watch.')])
      if (k === 'いぬ') return (c.learn('inu'), [c.say('われは こまいぬ。いぬでは ない。…ちょっとだけ いぬ。', 'I am a komainu, not a dog. …Only slightly dog.')])
      return null
    },
    's-fox': (c, k) => (k === 'こんにちは' ? (c.learn('konnichiwa'), [c.say('コンにちは！ …きつねの あいさつ だよ。', 'KON-nichiwa! …That’s how foxes say hello.')]) : null),
    's-cat': (c, k) => {
      if (k === 'ねこ') return (c.learn('neko'), [c.say('にゃ？', 'Mew?')])
      if (k === 'しずか') return (c.learn('shizuka'), [c.narrate('ねこは まるく なって、しずかに ねむった。', 'The cat curls up and quietly falls asleep.')])
      return null
    },
    's-lantern': (c, k) => {
      if (k === 'ひかり' || k === 'ひかる') {
        c.learn(k === 'ひかり' ? 'hikari' : 'hikaru')
        c.sparkle('spark')
        return [c.narrate('とうろうの ひかりが ふわっと おおきく なり、よみちを てらした。', 'The lantern swells with light, brightening the night path.'), ...(first(c, 'cast.s-lantern') ? c.reward(10, 5) : [])]
      }
      if (k === 'ひ') return (c.learn('hi'), [c.narrate('もう ひは ついている。とうろうが「しってる」と いいたげだ。', 'It’s already lit. The lantern looks faintly offended.')])
      return null
    },
    's-pilgrim': (c, k) => (k === 'げんき' ? (c.learn('genki'), c.sparkle('spark'), [c.say('げんき！ ひざが いたかったのに、なおった！ おどれる！', 'Genki! My knee stopped hurting! I can dance!')]) : null),
    's-miko': (c, k) => (k === 'きれい' ? (c.learn('kirei'), [c.say('えっ… わたし？ …あ、つきの こと ですね。そうですよね。', 'Eh… me? …Oh, you mean the moon. Of course.')]) : null),
    's-ema': (c, k) => {
      if (k !== 'かく') return null
      c.learn('kaku')
      return [c.narrate('えまに ねがいを かいた：「にほんごが じょうずに なりますように」', 'You write a wish on a plaque: “May my Japanese get better.”'), ...(first(c, 'cast.s-ema') ? [c.narrate('となりの えま：「ぽんたが すずばんに なれますように」', 'The plaque next to it: “May Ponta become bell-keeper.”'), ...c.reward(10, 5)] : [])]
    },
    's-tablet-1': (c, k) => (k === 'よむ' ? (c.learn('yomu'), [c.narrate('いしぶみを こえに だして よんだ。「ことばは いのち。わすれれば きえる。」', 'You read the tablet aloud: “Words are life. Forget them, and they fade.”')]) : null),
    'sl-apprentice': (c, k) => {
      if (k === 'しずか') return (c.learn('shizuka'), [c.say('そう！ それです！ …しーっ。', 'Yes! Exactly! …Shh.')])
      if (k === 'はなす') return (c.learn('hanasu'), [c.say('しーっ！ としょかんでは はなさないで！', 'Shhh! No talking in the library!')])
      return null
    },
  },
  mapCast: {
    shrine: (c, k) => {
      if (k === 'つき') return (c.learn('tsuki'), [c.narrate('「つき」！ くもの あいだから、つきが そっと かおを だした。', '“Tsuki”! The moon peeks shyly out from the clouds.')])
      if (k === 'ほし') {
        c.learn('hoshi')
        c.sparkle('spark')
        return [c.narrate('「ほし」！ ながれぼしが ひとつ、やしろの うえを よこぎった！', '“Hoshi”! A shooting star streaks over the shrine!'), c.fude('はやく ねがいごと！ えーと、えーと… おわっちゃった。', 'Quick, make a wish! Um, um… it’s gone.')]
      }
      if (k === 'あめ') return (c.learn('ame'), [c.narrate('ぽつ、ぽつ… いしだたみが つきあかりに ひかる。', 'Pit, pat… the flagstones shine in the moonlight.')])
      if (k === 'じんじゃ') return (c.learn('jinja'), [c.fude('そう、ここが じんじゃ！ よるの じんじゃは ちょっと こわいね。', 'Yep, this is a shrine! A little spooky at night, huh.')])
      return null
    },
    'shrine-library': (c, k) => {
      if (k === 'ほん') {
        c.learn('hon')
        c.sparkle('dust')
        const books: [string, string][] = [
          ['『ねこでも わかる かんじ』', '“Kanji Even a Cat Can Learn”'],
          ['『しずかに する 100の ほうほう』', '“100 Ways to Be Quiet”'],
          ['『りゅうの そだてかた（きけん）』', '“How to Raise a Dragon (Dangerous)”'],
          ['『たぬきの ばけかた 入門』', '“Intro to Tanuki Transformation”'],
        ]
        const [jp, en] = books[c.flag('r4.books') % books.length]
        c.set('r4.books', c.flag('r4.books') + 1)
        return [c.narrate(`「ほん」！ ほんだなから 一さつ とびだした：${jp}`, `“Hon”! A book flies off the shelf: ${en}`)]
      }
      if (k === 'しずか') return (c.learn('shizuka'), [c.narrate('……………。としょかんが もっと しずかに なった。', '…………… The library grows even quieter.')])
      if (k === 'よむ') return (c.learn('yomu'), [c.narrate('ほんを ひらいて よんだ。…きづくと 1じかん たっていた。', 'You open a book and read. …An hour vanishes.')])
      return null
    },
  },
}

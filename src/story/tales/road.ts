/**
 * The Sealed Road (ふうじられた みち): the thread that ties the side quests,
 * the Games tab and the journey together, adventure-game style.
 *
 * Every region's boss hides inside a ward of the Quiet. Talking to it starts
 * that region's road tale: Fude can weave a key to break the ward, but needs
 * two of three things for it, and they are scattered:
 *
 *  - one from a side quest in the region itself (finish it, then ask again),
 *  - one from a trip back to an earlier region (the travel spell helps),
 *  - one from a game keeper: Master Sumi's Ink Dojo (Stick Ninja), Hayato's
 *    Bamboo Bridge, or Granny Tane's Hidden Village.
 *
 * Carry any two back to the ward (all three for the Tower's last ward) and
 * Fude weaves them into the key; cast
 * the right word through it and the ward shatters. The boss can't be fought
 * (in the world or from the region menu) until then. Saves that already beat
 * a boss keep their road open.
 */
import { toRomaji } from 'wanakana'
import { echoesBeaten } from '../../arcade/story'
import { levelOf, manorLevel } from '../../engine/hamlet'
import { ACTIVITY_BY_ID } from '../../data/regions'
import { WORD_BY_ID } from '../../data/vocab'
import { isPassed, regionUnlocked, setFlag, wardFlag, wardOpen, type PlayerState } from '../../engine/store'
import type { Step } from '../../world/Dialog'
import type { Ctx, KeyItem, Tale, TaleContent, TalkScript } from './types'

type JE = [jp: string, en: string]

export interface Part {
  item: KeyItem
  /** Who hands it over. */
  from: string
  /** Can they hand it over yet? */
  ready: (c: Ctx) => boolean
  /** What they say as they do. */
  give: JE[]
  /** Fude's nudge when you talk to them before it is ready. */
  hint: JE
}

export interface Gate {
  region: number
  /** The boss entity sitting in the ward, and its battle. */
  boss: string
  activity: string
  title: string
  jp: string
  summary: string
  /** What the ward looks like, and Fude working out how to break it. */
  ward: JE[]
  parts: [Part, Part, Part]
  /** Objective while gathering (shown in the story log). */
  gather: JE
  /** Objective once you hold two of the three. */
  bring: JE
  /** The key Fude weaves (kept afterwards as a keepsake). */
  key: KeyItem
  /** The word to cast through the key (a vocabulary id). */
  word: string
  /** Parts it takes (default: any two of the three). */
  needs?: 2 | 3
}

const item = (id: string, name: string, jp: string, kana: string, emoji: string, desc: string): KeyItem => ({ id: `road-${id}`, name, jp, kana, emoji, desc })

// ─── what the keepers can hand over ────────────────────────────────────

const dojo = (n: number) => (c: Ctx) => echoesBeaten(c.s()) >= n
const firstScroll = (c: Ctx) => (c.s().ninja?.cleared ?? 0) >= 1
const bridge = (n: number) => (c: Ctx) => (c.s().arcade?.stick ?? 0) >= n
const paddy = (c: Ctx) => Object.values(c.s().hamlet?.plots ?? {}).some((p) => p?.id === 'paddy')
const manor = (n: number) => (c: Ctx) => !!c.s().hamlet && manorLevel(c.s().hamlet!) >= n
const teahouse = (c: Ctx) => !!c.s().hamlet && levelOf(c.s().hamlet!, 'teahouse') >= 1
/** Side tales a part waits on (checked by the tests: a typo would block the road). */
export const NEEDED_TALES = new Set<string>()
const tale = (id: string) => {
  NEEDED_TALES.add(id)
  return (c: Ctx) => c.done(id)
}

const SUMI_GIVES: JE = ['…みごとな けんさばき じゃった。これを もって いきなさい。', '…Fine swordwork. Take this with you.']

export const GATES: Gate[] = [
  // ── 1 · The Village of First Words ────────────────────────────────
  {
    region: 1,
    boss: 'v-oni',
    activity: 'r1-boss',
    title: 'The Sealed Road: A Light for the Oni',
    jp: 'ふうじられた みち：おにの あかり',
    summary: 'The Kana Oni crouches inside a ward of shadow. Words can’t reach it in the dark: we need a light.',
    ward: [
      ['おにの まわりに くろい かげの かべ…「しずけさ」の けっかいだ！', 'A wall of black shadow around the oni… a ward of the Quiet!'],
      ['くらくて ことばが とどかない。あかりが あれば…', 'It’s too dark for words to reach. If only we had a light…'],
      ['ろうそくと、ちょうちんの かみと、すみ。この みっつで「はじまりの ちょうちん」を つくれるよ！', 'A candle, lantern paper and ink: with those three I can make a Lantern of First Letters!'],
    ],
    parts: [
      {
        item: item('candle', 'Festival Candle', 'まつりの ろうそく', 'ろうそく', '🕯️', 'Left over from the Festival of Lights. It still smells of summer nights.'),
        from: 'v-innkeeper',
        ready: tale('festival'),
        give: [['まつりの ろうそくが ひとつ のこってるよ。もって いきな！', 'There’s one festival candle left over. Take it!']],
        hint: ['やどやさんの「ひかりの まつり」を てつだえば、ろうそくを わけて くれるかも。', 'Help with the innkeeper’s Festival of Lights and maybe there’ll be a candle to spare.'],
      },
      {
        item: item('lantern-paper', 'Lantern Paper', 'ちょうちんの かみ', 'かみ', '📃', 'Oiled paper from the umbrella spirit. Light shines through it warm and gold.'),
        from: 'fk1-tsuru',
        ready: tale('fk1-kasa'),
        give: [['かさおばけが のこした あぶらがみ。ちょうちんに ぴったりよ。', 'Oiled paper the umbrella spirit left behind. Perfect for a lantern.']],
        hint: ['かさを なくした こを たすけたら、あぶらがみを くれるかも。', 'Help the girl who lost her umbrella, and she might share some oiled paper.'],
      },
      {
        item: item('sumi-ink', 'Sumi’s Ink Stick', 'スミの すみ', 'すみ', '🖋️', 'Master Sumi’s practice ink. Letters drawn with it glow faintly.'),
        from: 'vb-sumi',
        ready: firstScroll,
        give: [SUMI_GIVES, ['わしの すみじゃ。あかりに もじを かけば、くらやみも おそれぬ。', 'My own ink. Write a letter on a light with it, and the dark holds no fear.']],
        hint: ['スミせんせいの まきものに はいって、さいしょの ステージを クリアしよう！（ゲーム：すみの どうじょう）', 'Step into Master Sumi’s scroll and clear its first stage! (the Ink Dojo)'],
      },
    ],
    gather: ['けっかいを やぶる ざいりょうを あつめよう：まつりの ろうそく（やどや）・ちょうちんの かみ（かさの こ）・スミの すみ（たけやぶの どうじょう）', 'Gather what the ward needs: a festival candle (the innkeeper), lantern paper (the umbrella girl) and ink from Master Sumi’s dojo (the bamboo grove)'],
    bring: ['ふたつ そろったら、ひがしの みちの おにの けっかいへ', 'Take two of them to the oni’s ward on the east road'],
    key: item('lantern', 'Lantern of First Letters', 'はじまりの ちょうちん', 'ちょうちん', '🏮', 'Woven by Fude from a candle, lantern paper and Sumi’s ink. It broke the Quiet’s first ward.'),
    word: 'hi',
  },
  // ── 2 · The Elemental Fields ──────────────────────────────────────
  {
    region: 2,
    boss: 'f-golem',
    activity: 'r2-boss',
    title: 'The Sealed Road: Bind the Golem',
    jp: 'ふうじられた みち：ゴーレムを むすべ',
    summary: 'The Radical Golem is wrapped in a whirl of loose radicals. Nothing holds still long enough to fight.',
    ward: [
      ['ゴーレムの まわりで ぶしゅが ぐるぐる まわってる… これも けっかいだ！', 'Radicals whirl round and round the golem… another ward!'],
      ['ばらばらの ものを ひとつに むすぶ ものが いるね。', 'We need something that binds scattered things into one.'],
      ['なわと、のりと、ねんど。それで「むすびの ふだ」が つくれる！', 'Rope, glue and clay: with those I can make a Binding Charm!'],
    ],
    parts: [
      {
        item: item('straw-rope', 'Straw Rope', 'わらの なわ', 'なわ', '🪢', 'Plaited from the straw left over from the Jizō hats.'),
        from: 'fk2-sakichi',
        ready: tale('fk2-jizo'),
        give: [['かさを あんだ わらの のこりで なわを なったんだ。もって いって。', 'I plaited a rope from the straw left over from the hats. Take it.']],
        hint: ['かさじぞうの はなしを おわらせたら、わらの なわを くれるかも。', 'Finish the tale of the Jizō hats and there may be straw rope to spare.'],
      },
      {
        item: item('rice-glue', 'Sparrows’ Rice Glue', 'すずめの のり', 'のり', '🍚', 'Sticky rice glue from the Sparrows’ Inn. Sticks anything to anything.'),
        from: 'fk1-jiro',
        ready: tale('fk1-suzume'),
        give: [['すずめの やどの おれいに もらった のりだよ。なんでも くっつくんだ。', 'Glue the sparrows gave me to say thanks. It sticks anything.']],
        hint: ['むらの ジロウさんの「すずめの おやど」を たすけたら、のりを くれるかも。（むらに もどろう）', 'Help Jirō with the Sparrows’ Inn back in the Village and there may be glue in it for you.'],
      },
      {
        item: item('valley-clay', 'Valley Clay', 'たにの ねんど', 'ねんど', '🏺', 'Red clay from the new paddy in the Hidden Village.'),
        from: 'fh-tane',
        ready: paddy,
        give: [['たんぼの つちが いい ねんどに なって ねえ。ほら、もって おいき。', 'The soil from the paddy makes lovely clay. Here, take some.']],
        hint: ['かくれざとに たんぼを つくったら、タネばあちゃんが ねんどを くれるかも。（ゲーム：かくれざと）', 'Plant a rice paddy in the Hidden Village and Granny Tane may give you some clay.'],
      },
    ],
    gather: ['むすびの ざいりょう：わらの なわ（じぞうの サキチ）・すずめの のり（むらの ジロウ）・たにの ねんど（かざぐるまの おかの タネばあちゃん）', 'Gather the binding: straw rope (Sakichi of the Jizō), sparrows’ rice glue (Jirō, back in the Village) and valley clay (Granny Tane on Windmill Hill)'],
    bring: ['ふたつ そろったら、ひがしの みちの ゴーレムへ', 'Take two of them to the golem on the east road'],
    key: item('binding', 'Binding Charm', 'むすびの ふだ', 'ふだ', '🧧', 'Rope, glue and clay, woven into a charm that holds scattered things together.'),
    word: 'ishi',
  },
  // ── 3 · The Forest of Sentences ───────────────────────────────────
  {
    region: 3,
    boss: 'fo-treant',
    activity: 'r3-boss',
    title: 'The Sealed Road: A Voice in the Vines',
    jp: 'ふうじられた みち：つるの なかの こえ',
    summary: 'The Particle Guardian sleeps in a hush of vines that swallows every particle you speak.',
    ward: [
      ['つるが ことばを のみこんでしまう… は も を も に も、きこえない！', 'The vines swallow the words… no は, no を, no に gets through!'],
      ['こえを とおくまで はこぶ ものが ほしいな。', 'We need something to carry a voice a long way.'],
      ['ひもと、ふえと、うたう こいし。それで「こだまの ふえ」が できる！', 'A ribbon, a flute and a singing pebble: that makes an Echo Flute!'],
    ],
    parts: [
      {
        item: item('wedding-ribbon', 'Wedding Ribbon', 'いわいの ひも', 'ひも', '🎀', 'A red-and-white ribbon from the fox wedding.'),
        from: 'fo-fox',
        ready: tale('fox-wedding'),
        give: [['けっこんしきの いわいの ひも。しあわせを むすぶ ひもだよ。', 'A ribbon from the wedding. It ties good fortune together.']],
        hint: ['きつねの よめいりを てつだったら、いわいの ひもを くれるかも。', 'Help with the fox wedding and there may be a ribbon for you.'],
      },
      {
        item: item('bamboo-flute', 'Bamboo Flute', 'たけぶえ', 'たけぶえ', '🎋', 'Hayato carved it from a bamboo bridge pole.'),
        from: 'fo-hayato',
        ready: bridge(10),
        give: [['10ぽん わたれたね！ これ、ぼうの あまりで つくった ふえ。あげる！', 'You crossed ten! I made this flute from a spare pole. It’s yours!']],
        hint: ['ハヤトの「ぼうわたり」で 10ぽん わたって みせよう！（ゲーム：ぼうわたり）', 'Cross ten pillars on Hayato’s Bamboo Bridge and show him!'],
      },
      {
        item: item('river-pebble', 'Singing Pebble', 'うたう こいし', 'こいし', '🪨', 'A river pebble the kappa gave in thanks. Hold it to your ear and it hums.'),
        from: 'fk2-kenta',
        ready: tale('fk2-kappa'),
        give: [['かっぱが おれいに くれた こいし。みみに あてると うたうんだ。', 'The kappa gave me this pebble as thanks. Hold it to your ear and it sings.']],
        hint: ['はたけの ケンタと かっぱの はなしを おわらせよう。（はたけに もどろう）', 'Finish Kenta’s tale of the kappa, back in the Fields.'],
      },
    ],
    gather: ['こえの ざいりょう：いわいの ひも（きつね）・たけぶえ（きのこの くぼちの ハヤト）・うたう こいし（はたけの ケンタ）', 'Gather a voice: a wedding ribbon (the fox), a bamboo flute (Hayato in Mushroom Hollow) and a singing pebble (Kenta, back in the Fields)'],
    bring: ['ふたつ そろったら、もりの おくの しゅごしゃへ', 'Take two of them to the Guardian deep in the forest'],
    key: item('echo-flute', 'Echo Flute', 'こだまの ふえ', 'ふえ', '🪈', 'Whatever you say into it, the whole forest hears.'),
    word: 'ki',
  },
  // ── 4 · The Shrine of Silence ─────────────────────────────────────
  {
    region: 4,
    boss: 'sl-librarian',
    activity: 'r4-boss',
    title: 'The Sealed Road: A Mirror for a Name',
    jp: 'ふうじられた みち：なまえを うつす かがみ',
    summary: 'The Silent Librarian sits in a storm of blank pages. Nothing written there can be read.',
    ward: [
      ['まっしろな ページが ふぶきみたいに まってる… なにも よめない！', 'Blank pages swirl like a blizzard… nothing can be read!'],
      ['つきの ひかりは かくれた もじを うつすって、いうよね。', 'They say moonlight shows writing that hides.'],
      ['すずの ひもと、しゅの すみと、つきの はっぱ。それで「つきの かがみ」を つくろう！', 'A bell cord, red ink and a moonlit leaf: let’s make a Moon Mirror!'],
    ],
    parts: [
      {
        item: item('bell-cord', 'Bell Cord', 'すずの ひも', 'ひも', '🔔', 'A cord from the midnight bells. It still rings faintly in your pocket.'),
        from: 's-ponta',
        ready: tale('night-bells'),
        give: [['まよなかの すずの ひも、ひとつ あまったぽん。あげるぽん！', 'One of the midnight bell cords was left over, pon. It’s yours, pon!']],
        hint: ['ポンタの「まよなかの すず」を てつだおう。', 'Help Ponta with the midnight bells.'],
      },
      {
        item: item('seal-ink', 'Sumi’s Red Ink', 'しゅの すみ', 'しゅ', '🖍️', 'Vermilion ink for seals and names. Master Sumi’s reward for cutting down doubt.'),
        from: 'vb-sumi',
        ready: dojo(1),
        give: [SUMI_GIVES, ['まよいの かげを きった あかしに、しゅの すみを やろう。なまえを かく すみじゃ。', 'For cutting down the shadow of doubt: red ink. The ink for writing names.']],
        hint: ['スミせんせいの まきもので、カイトの かげ（さいしょの ボス）を たおそう！（むらの たけやぶ）', 'Defeat Kaito’s echo, the first boss in Master Sumi’s scroll (back in the Village’s bamboo grove)!'],
      },
      {
        item: item('moon-leaf', 'Moonlit Leaf', 'つきの はっぱ', 'はっぱ', '🍂', 'Pon’s leaf, soaked in moonlight. It shows what is hidden.'),
        from: 'fo-tanuki',
        ready: tale('pon-sulk'),
        give: [['…ふん。つきに ほした はっぱだ。かくれた ものが みえる。…つかえよ。', '…Hmph. A leaf dried in moonlight. It shows hidden things. …Use it.']],
        hint: ['もりの すねた たぬき、ポンの きげんを なおそう。（もりに もどろう）', 'Cheer up Pon, the sulky tanuki in the Forest.'],
      },
    ],
    gather: ['かがみの ざいりょう：すずの ひも（ポンタ）・しゅの すみ（むらの スミせんせい）・つきの はっぱ（もりの ポン）', 'Gather the mirror: a bell cord (Ponta), red ink (Master Sumi, back in the Village) and a moonlit leaf (Pon, back in the Forest)'],
    bring: ['ふたつ そろったら、としょかんの ししょの けっかいへ', 'Take two of them to the Librarian’s ward in the library'],
    key: item('moon-mirror', 'Moon Mirror', 'つきの かがみ', 'かがみ', '🪞', 'Holds moonlight even at noon. Hidden writing shows in it.'),
    word: 'namae',
  },
  // ── 6 · The Harbour ───────────────────────────────────────────────
  {
    region: 6,
    boss: 'hc-umibozu',
    activity: 'r6-boss',
    title: 'The Sealed Road: Calm the Tide',
    jp: 'ふうじられた みち：しおを しずめよ',
    summary: 'A black sea-mist swallows the cove: the Umibōzu’s ward eats boats and numbers alike.',
    ward: [
      ['くろい きりが いりえを のみこんでる… これが うみぼうずの けっかい！', 'Black mist is swallowing the cove… the Umibōzu’s ward!'],
      ['むかしから、うみぼうずには「そこの ない ひしゃく」を わたすんだって。', 'The old sailors say: give an umibōzu a ladle with no bottom.'],
      ['ひしゃくと、つきの おまもりと、あらしの すみ。それで「しおの おまもり」が できる！', 'A ladle, a moon charm and storm ink: that makes a Tide Charm!'],
    ],
    parts: [
      {
        item: item('ladle', 'Bottomless Ladle', 'そこなしの ひしゃく', 'ひしゃく', '🥄', 'The funayūrei’s thanks. It can’t scoop a drop, which is the whole point.'),
        from: 'fk6-funa',
        ready: tale('fk6-funa'),
        give: [['そこの ない ひしゃく… これで うみの ものは みずを くめない。もって おいき。', 'A ladle with no bottom… with it, no sea spirit can scoop. Take it.']],
        hint: ['いりえの ふなゆうれいに ひしゃくを かして あげよう。', 'Lend the funayūrei in the cove a ladle.'],
      },
      {
        item: item('moon-charm', 'Moon-Rabbit Charm', 'つきうさぎの おまもり', 'おまもり', '🐇', 'The moon pulls the tides, and the moon rabbit knows it.'),
        from: 'fk4-usagi',
        ready: tale('fk4-usagi'),
        give: [['つきは しおを ひっぱるの。この おまもりで うみも おとなしく なるよ。', 'The moon pulls the tides. With this charm, even the sea behaves.']],
        hint: ['やしろの つきうさぎに おもちを あげよう。（やしろに もどろう）', 'Bring the moon rabbit at the Shrine some mochi.'],
      },
      {
        item: item('storm-ink', 'Storm Ink', 'あらしの すみ', 'すみ', '🌀', 'Ink swirled with the anger of Gōki’s echo. Master Sumi says it can still a storm.'),
        from: 'vb-sumi',
        ready: dojo(2),
        give: [SUMI_GIVES, ['いかりの かげから とれた すみじゃ。あらしを しずめるには、あらしを しる すみが いる。', 'Ink from the shadow of anger. To still a storm, you need ink that knows storms.']],
        hint: ['スミせんせいの まきもので、おにの ゴウキの かげを たおそう！（むらの たけやぶ）', 'Defeat Gōki the Oni’s echo in Master Sumi’s scroll (the Village’s bamboo grove)!'],
      },
    ],
    gather: ['しおの ざいりょう：そこなしの ひしゃく（いりえの ふなゆうれい）・つきうさぎの おまもり（やしろ）・あらしの すみ（むらの スミせんせい）', 'Gather the tide: a bottomless ladle (the funayūrei in the cove), a moon-rabbit charm (back at the Shrine) and storm ink (Master Sumi, in the Village)'],
    bring: ['ふたつ そろったら、いりえの うみぼうずへ', 'Take two of them to the Umibōzu in the cove'],
    key: item('tide-charm', 'Tide Charm', 'しおの おまもり', 'おまもり', '🌊', 'Ladle, moon charm and storm ink in one. The sea listens to whoever carries it.'),
    word: 'umi',
  },
  // ── 7 · The Hot-Spring Village ────────────────────────────────────
  {
    region: 7,
    boss: 'oc-yamanba',
    activity: 'r7-boss',
    title: 'The Sealed Road: Comb Out the Knots',
    jp: 'ふうじられた みち：もつれを ほどけ',
    summary: 'The Yamanba’s cave is choked with knotted hair and steam. Every sentence that goes in comes out tangled.',
    ward: [
      ['かみの けと ゆげが もつれて、どうくつを ふさいでる…', 'Hair and steam have knotted together and blocked the cave…'],
      ['もつれを ほどく くしが あれば…！', 'If we had a comb to work out the knots…!'],
      ['ぬくい いしと、しんじゅと、たけの かんざし。それで「ほどきの くし」が つくれる！', 'A warm stone, a pearl and a bamboo pin: that makes an Untangling Comb!'],
    ],
    parts: [
      {
        item: item('hot-stone', 'Warm Stone', 'ぬくい いし', 'いし', '♨️', 'A stone from the monkeys’ pool that never cools down.'),
        from: 'r7-kosaru',
        ready: tale('r7-monkeys'),
        give: [['キキッ！ おふろの いし、あげる！ ずっと ぬくいよ！', 'Kiki! A stone from the pool, for you! It stays warm forever!']],
        hint: ['さるの つめたい おふろを なんとか しよう。', 'Do something about the monkeys’ cold pool.'],
      },
      {
        item: item('pearl', 'Mermaid’s Pearl', 'にんぎょの しんじゅ', 'しんじゅ', '🦪', 'Smooth as a wave. Anything combed with it won’t tangle.'),
        from: 'fk6-ningyo',
        ready: tale('fk6-ningyo'),
        give: [['しんじゅで くしを かざると、かみが からまないのよ。ひとつ どうぞ。', 'A comb set with pearl never tangles hair. Have one.']],
        hint: ['みなとの いりえの にんぎょに しんじゅを かえして あげよう。（みなとに もどろう）', 'Help the mermaid in the Harbour cove get her pearls back.'],
      },
      {
        item: item('bamboo-pin', 'Hayato’s Bamboo Pin', 'たけの かんざし', 'かんざし', '🎍', 'Whittled by Hayato on the bridge. Light, strong and very pointy.'),
        from: 'fo-hayato',
        ready: bridge(25),
        give: [['25ほん！？ すごい… これ、ぼくの たからものの かんざし。もって いって！', 'Twenty-five?! Amazing… this pin is my treasure. Take it!']],
        hint: ['ハヤトの「ぼうわたり」で 25ほん わたって みせよう！（もりの きのこの くぼち）', 'Cross twenty-five pillars on Hayato’s Bamboo Bridge (Mushroom Hollow, in the Forest)!'],
      },
    ],
    gather: ['くしの ざいりょう：ぬくい いし（おふろの こざる）・にんぎょの しんじゅ（みなとの いりえ）・たけの かんざし（もりの ハヤト）', 'Gather the comb: a warm stone (the little monkey at the baths), a mermaid’s pearl (back at the Harbour cove) and a bamboo pin (Hayato, back in the Forest)'],
    bring: ['ふたつ そろったら、やまの どうくつの やまんばへ', 'Take two of them to the Yamanba’s mountain cave'],
    key: item('comb', 'Untangling Comb', 'ほどきの くし', 'くし', '🪮', 'It combs knots out of hair, steam and sentences alike.'),
    word: 'mizu',
  },
  // ── 8 · The Castle Town ───────────────────────────────────────────
  {
    region: 8,
    boss: 'ck-nurarihyon',
    activity: 'r8-boss',
    title: 'The Sealed Road: The True Seal',
    jp: 'ふうじられた みち：まことの いん',
    summary: 'Nurarihyon sits in the lord’s seat behind a ward of “of course I belong here”. Everyone politely forgets he’s an intruder.',
    ward: [
      ['あれ… あの ひと、だれだっけ？ …ちがう！ これが ぬらりひょんの けっかいだ！', 'Wait… who is that again? …No! This is Nurarihyon’s ward!'],
      ['ほんものの とのさまの「いん」が あれば、にせものだって わかるはず。', 'With the real lord’s seal, everyone would see he’s a fake.'],
      ['まねきの てと、さぎの はねと、やしきの ろう。それで「まことの いん」を つくろう！', 'A beckoning paw, a heron quill and manor wax: let’s make the True Seal!'],
    ],
    parts: [
      {
        item: item('paw', 'Beckoning Paw', 'まねきの て', 'て', '🐾', 'A paw-print in gold lacquer from the beckoning cat. It calls the truth over.'),
        from: 'fk8-ohana',
        ready: tale('fk8-maneki'),
        give: [['ねこが また てまねき してくれたの！ おれいに、きんの あしあと。', 'The cat is beckoning again! As thanks, a golden paw-print.']],
        hint: ['てまねきを わすれた ねこを たすけよう。', 'Help the cat who forgot how to beckon.'],
      },
      {
        item: item('heron-quill', 'Heron Quill', 'さぎの はね', 'はね', '🪶', 'A white heron’s feather, cut into a pen. It only writes the truth.'),
        from: 'fk7-kiyo',
        ready: tale('fk7-sagi'),
        give: [['しらさぎの はねで つくった ふでよ。うそは かけないの。', 'A pen cut from the white heron’s feather. It can’t write a lie.']],
        hint: ['おんせんの キヨと しらさぎの はなしを おわらせよう。（おんせんに もどろう）', 'Finish Kiyo’s tale of the white heron, back in the Hot Springs.'],
      },
      {
        item: item('manor-wax', 'Manor Seal Wax', 'やしきの ろう', 'ろう', '🔴', 'Red sealing wax from the valley manor, where a lord once lived.'),
        from: 'fh-tane',
        ready: manor(2),
        give: [['やしきの くらに ふるい ろうが あったよ。とのさまの いんに つかって いた ものさ。', 'There was old wax in the manor storehouse. The lord used it for his seal.']],
        hint: ['かくれざとの やしきを レベル2に したら、タネばあちゃんが なにか くれるかも。（はたけの かざぐるまの おか）', 'Raise the manor in the Hidden Village to level 2 and Granny Tane may have something for you (Windmill Hill).'],
      },
    ],
    gather: ['いんの ざいりょう：まねきの て（おはな）・さぎの はね（おんせんの キヨ）・やしきの ろう（かざぐるまの おかの タネばあちゃん）', 'Gather the seal: a beckoning paw (Ohana), a heron quill (Kiyo, back at the Hot Springs) and manor wax (Granny Tane, Windmill Hill)'],
    bring: ['ふたつ そろったら、おしろの てんしゅの ぬらりひょんへ', 'Take two of them to Nurarihyon in the castle keep'],
    key: item('true-seal', 'True Seal', 'まことの いん', 'いん', '🔏', 'A seal that can’t be faked. Stamped on anything, it shows what is real.'),
    word: 'tono',
  },
  // ── 9 · The Snow Temple ───────────────────────────────────────────
  {
    region: 9,
    boss: 'sc-yukionna',
    activity: 'r9-boss',
    title: 'The Sealed Road: A Warm Light',
    jp: 'ふうじられた みち：ぬくもりの あかり',
    summary: 'Yuki-onna’s cave is behind a blizzard that freezes words before they are spoken.',
    ward: [
      ['ふぶきで いきが こおる… ことばも こおって とどかない！', 'The blizzard freezes your breath… and words freeze before they arrive!'],
      ['あたたかい あかりが あれば、ことばも とけるはず。', 'With a warm light, the words would thaw.'],
      ['てぶくろと、とおみの あかりと、ほのおの すみ。それで「ぬくもりの ひ」が できる！', 'A mitten, a far-seeing lamp and ember ink: that makes a Hearth Light!'],
    ],
    parts: [
      {
        item: item('mitten', 'Snow-Child’s Mitten', 'ゆきんこの てぶくろ', 'てぶくろ', '🧤', 'A tiny red mitten, warm on the inside even in a blizzard.'),
        from: 'st-yuki',
        ready: tale('fk9-yukinko'),
        give: [['ゆきんこが おとして いった てぶくろ。なかは ずっと あったかいの。', 'The snow child dropped this mitten. It’s always warm inside.']],
        hint: ['おもい ゆきんこの はなしを おわらせよう。', 'Finish the tale of the heavy snow child.'],
      },
      {
        item: item('far-lamp', 'Far-Seeing Lamp', 'とおみの あかり', 'あかり', '🪔', 'Oroku’s lamp. Its light reaches as far as her neck can stretch.'),
        from: 'fk8-oroku',
        ready: tale('fk8-rokuro'),
        give: [['わたしの くびほど とおくまで とどく あかりよ。ふぶきの むこうも てらせるわ。', 'A lamp that reaches as far as my neck. It can light the far side of a blizzard.']],
        hint: ['じょうかまちの おろくの はなしを おわらせよう。（じょうかまちに もどろう）', 'Finish Oroku’s tale, back in the Castle Town.'],
      },
      {
        item: item('ember-ink', 'Ember Ink', 'ほのおの すみ', 'すみ', '🔥', 'Ink from the high-flying Hayate’s echo, warm to the touch.'),
        from: 'vb-sumi',
        ready: dojo(3),
        give: [SUMI_GIVES, ['たかく とぶ かげの すみは、たいように ちかくて あたたかい。もって いけ。', 'Ink from the high-flying shadow has been near the sun. It is warm. Take it.']],
        hint: ['スミせんせいの まきもので、てんぐの ハヤテの かげを たおそう！（むらの たけやぶ）', 'Defeat Hayate the Tengu’s echo in Master Sumi’s scroll (the Village’s bamboo grove)!'],
      },
    ],
    gather: ['あかりの ざいりょう：ゆきんこの てぶくろ（ユキ）・とおみの あかり（じょうかまちの おろく）・ほのおの すみ（むらの スミせんせい）', 'Gather the light: a snow child’s mitten (Yuki), a far-seeing lamp (Oroku, back in the Castle Town) and ember ink (Master Sumi, in the Village)'],
    bring: ['ふたつ そろったら、ゆきの どうくつの ゆきおんなへ', 'Take two of them to Yuki-onna’s snow cave'],
    key: item('hearth', 'Hearth Light', 'ぬくもりの ひ', 'ひ', '🔆', 'A little sun in a lamp. Frozen words thaw in its glow.'),
    word: 'yuki',
  },
  // ── 10 · The Cloud Capital ────────────────────────────────────────
  {
    region: 10,
    boss: 'ch-raijin',
    activity: 'r10-boss',
    title: 'The Sealed Road: A Drum That Sings',
    jp: 'ふうじられた みち：うたう たいこ',
    summary: 'Raijin’s thunderheads drown out every sentence before it can be finished.',
    ward: [
      ['ゴロゴロ… かみなりの おとで、ことばが ぜんぶ かき けされる！', 'Rumble… the thunder drowns out every word!'],
      ['かみなりに かつには、うたう たいこが いるね。', 'To beat thunder, we need a drum that sings.'],
      ['つぎあてと、つららの ばちと、いかずちの すみ。それで「あまうたの たいこ」が できる！', 'A patch, an icicle drumstick and thunder ink: that makes a Rain-Song Drum!'],
    ],
    parts: [
      {
        item: item('drum-patch', 'Drum Patch', 'たいこの つぎ', 'つぎ', '🥁', 'Left over from mending the thunder child’s drum.'),
        from: 'c-grandma',
        ready: tale('fk10-raitaro'),
        give: [['ライタロウの たいこを なおした あまりの かわだよ。もって おいき。', 'Leather left over from mending Raitarō’s drum. Take it.']],
        hint: ['かみなりの こ、ライタロウの はなしを おわらせよう。', 'Finish the tale of Raitarō the thunder child.'],
      },
      {
        item: item('icicle-stick', 'Icicle Drumstick', 'つららの ばち', 'ばち', '🧊', 'An icicle that never melts, from the snow lake. It rings like a bell.'),
        from: 'fk9-tsurara',
        ready: tale('fk9-tsurara'),
        give: [['とけない つらら… たいこを うてば、すずの ように なるわ。', 'An icicle that never melts… strike a drum with it and it rings like a bell.']],
        hint: ['ゆきの みずうみの つららおんなの てがみを とどけよう。（ゆきでらに もどろう）', 'Help the icicle woman at the Snow Temple lake with her letter.'],
      },
      {
        item: item('thunder-ink', 'Thunder Ink', 'いかずちの すみ', 'すみ', '⚡', 'Ink from Kage’s echo. It crackles when you shake the pot.'),
        from: 'vb-sumi',
        ready: dojo(4),
        give: [SUMI_GIVES, ['かくれる かげの すみは、くらやみで ひかる。かみなりの すみじゃ。', 'Ink from the hiding shadow glows in the dark. Thunder ink.']],
        hint: ['スミせんせいの まきもので、かげの かげを たおそう！（むらの たけやぶ）', 'Defeat Kage’s echo in Master Sumi’s scroll (the Village’s bamboo grove)!'],
      },
    ],
    gather: ['たいこの ざいりょう：たいこの つぎ（おばあさん）・つららの ばち（ゆきでらの みずうみ）・いかずちの すみ（むらの スミせんせい）', 'Gather the drum: a drum patch (Grandma), an icicle drumstick (back at the Snow Temple lake) and thunder ink (Master Sumi, in the Village)'],
    bring: ['ふたつ そろったら、くもの ごてんの らいじんへ', 'Take two of them to Raijin in the cloud hall'],
    key: item('song-drum', 'Rain-Song Drum', 'あまうたの たいこ', 'たいこ', '🪘', 'Beat it and the thunder sings along instead of shouting.'),
    word: 'taiko',
  },
  // ── 5 · The Tower of Babel (the end of the road) ──────────────────
  {
    region: 5,
    boss: 'tp-chimera',
    activity: 'r5-chimera',
    title: 'The Sealed Road: The Brush of Many Voices',
    jp: 'ふうじられた みち：みんなの ふで',
    summary: 'At the top of the Tower, the Quiet’s last ward: woven from every word ever lost.',
    ward: [
      ['これが さいごの けっかい… うしなわれた ことば ぜんぶで できてる。', 'The last ward… made of every word that was ever lost.'],
      ['ひとりの こえじゃ たりない。たくさんの こえを ひとつの ふでに あつめよう。', 'One voice isn’t enough. Let’s gather many voices into one brush.'],
      ['つきの たけと、てんの いとと、たにの こえ。それで「みんなの ふで」が つくれる！', 'Moon bamboo, heavenly thread and the valley’s voices: that makes the Brush of Many Voices!'],
    ],
    parts: [
      {
        item: item('moon-bamboo', 'Moon Bamboo', 'つきの たけ', 'たけ', '🎋', 'A stalk of bamboo that glows like the moon. Kaguya-hime’s farewell gift.'),
        from: 'fk5-kaguya',
        ready: tale('fk5-kaguya'),
        give: [['つきへ かえる まえに… この たけを。ふでの じくに なさい。', 'Before I return to the moon… this bamboo. Make it the handle of your brush.']],
        hint: ['かぐやひめの「みっつの むりな おねがい」を かなえよう。', 'Grant Kaguya-hime her three impossible requests.'],
      },
      {
        item: item('heaven-thread', 'Heavenly Thread', 'てんの いと', 'いと', '🧵', 'A thread from the tennin’s feather robe. Light as a cloud, strong as a promise.'),
        from: 'fk10-tennin',
        ready: tale('fk10-hagoromo'),
        give: [['はごろもの いとを ひとすじ。ふでの けを たばねるのに つかって。', 'One thread from my feather robe. Use it to bind the bristles of your brush.']],
        hint: ['くもの みやこの てんにょに はごろもを かえそう。（くもの みやこに もどろう）', 'Return the tennin’s feather robe, back in the Cloud Capital.'],
      },
      {
        item: item('valley-voices', 'Voices of the Valley', 'たにの こえ', 'こえ', '🔔', 'A bell that rings with the laughter of everyone who came home to the valley.'),
        from: 'fh-tane',
        ready: teahouse,
        give: [['たにの みんなが、あんたに って。…ふると、みんなの わらいごえが きこえるよ。', 'From everyone in the valley, for you. …Ring it and you’ll hear them all laughing.']],
        hint: ['かくれざとに ちゃやを たてたら、タネばあちゃんが なにか くれるかも。（はたけの かざぐるまの おか）', 'Build a teahouse in the Hidden Village and Granny Tane may have something for you (Windmill Hill).'],
      },
    ],
    gather: ['ふでの ざいりょう：つきの たけ（かぐやひめ）・てんの いと（くもの みやこの てんにょ）・たにの こえ（かざぐるまの おかの タネばあちゃん）', 'Gather the brush: moon bamboo (Kaguya-hime), heavenly thread (the tennin, back in the Cloud Capital) and the valley’s voices (Granny Tane, Windmill Hill)'],
    bring: ['みっつ そろったら、とうの てっぺんの けっかいへ', 'Take all three to the ward at the top of the Tower'],
    key: item('many-brush', 'Brush of Many Voices', 'みんなの ふで', 'ふで', '🖌️', 'Bamboo from the moon, thread from heaven, and a whole valley’s laughter. Kotone would have loved it.'),
    word: 'kotoba',
    // the last ward of all takes every voice
    needs: 3,
  },
]

/** Parts of the three it takes to weave a gate's key. */
export const needs = (g: Gate) => g.needs ?? 2

export const roadTale = (region: number) => `road-r${region}`

// ─── scripts ───────────────────────────────────────────────────────────

/** Fude weaves the key (if not yet) and asks for the word. */
function weave(c: Ctx, g: Gate): Step[] {
  const out: Step[] = []
  if (!c.has(g.key.id)) {
    const held = g.parts.filter((p) => c.has(p.item.id)).map((p) => p.item)
    out.push(c.fude(`${held.map((i) => i.jp).join('、')}… いくよ！`, `${held.map((i) => `The ${i.name}`).join(', ')}… here goes!`))
    for (const i of held) c.take(i.id)
    c.sparkle('spark')
    out.push(c.narrate('フデが ぜんぶを くるくると あんで いく…', 'Fude spins them together, round and round…'), ...c.give(g.key.id))
  }
  const w = WORD_BY_ID.get(g.word)!
  out.push(c.fude(`${g.key.jp}に ことばを こめて！「${w.en}」の ことばを となえるんだ！`, `Put a word into the ${g.key.name}! Cast the word for “${w.en}”!`))
  out.push(
    c.cast({ jp: `「${w.en}」の ことばを となえる…`, en: `Cast the word for “${w.en}”…` }, (kana) => {
      if (kana !== w.kana) {
        return [c.narrate('けっかいが ゆらいだ… でも、もとに もどった。', 'The ward wavers… then settles back.'), c.fude(`おしい！「${w.en}」は「${w.kana}」（${toRomaji(w.kana)}）だよ。もう いちど はなしかけて、ためそう！`, `So close! “${w.en}” is ${w.kana} (${toRomaji(w.kana)}). Talk to the ward again and try once more!`)]
      }
      c.learn(w.id)
      c.sparkle('spark')
      c.sfx('levelUp')
      setFlag(wardFlag(g.region))
      const a = ACTIVITY_BY_ID.get(g.activity)
      const speaker = c.e?.spec.name
      return [
        c.narrate(`「${w.jp}」！ ${g.key.emoji} ${g.key.jp}が まばゆく ひかり──`, `“${w.kana}”! ${g.key.emoji} The ${g.key.name} blazes with light──`),
        c.narrate('パリーン！ けっかいが くだけちった！', 'CRASH! The ward shatters!'),
        ...c.advance(roadTale(g.region)),
        ...(a ? [{ kind: 'activity' as const, activity: a, speaker, portrait: c.portrait }] : []),
      ]
    }),
  )
  return out
}

/** Talking to a boss whose ward still stands. */
function wardTalk(c: Ctx, g: Gate): Step[] | null {
  const s = c.s()
  if (wardOpen(s, g.region)) return null
  const id = roadTale(g.region)
  const st = c.stage(id)
  if (st < 0) return [c.narrate('ブウウン…', 'Vmmmmm…'), ...g.ward.map(([jp, en]) => c.fude(jp, en)), needs(g) < 3 ? c.fude('みっつの うち、ふたつ あれば なんとか なるよ！', 'Any two of the three should do!') : c.fude('さいごの けっかいだ… みっつ ぜんぶ ひつようだよ！', 'The last ward of all… we’ll need every one of them!'), ...c.start(id)]
  if (st === 0) {
    const missing = g.parts.filter((p) => !c.has(p.item.id))
    return [
      c.narrate('けっかいが ブウウンと うなって いる…', 'The ward hums, solid as ever…'),
      needs(g) - (g.parts.length - missing.length) < missing.length
        ? c.fude(`あと ${needs(g) - (g.parts.length - missing.length)}つ！ どれでも いいよ：${missing.map((p) => p.item.jp).join('・')}`, `${needs(g) - (g.parts.length - missing.length)} more to go! Any of these: ${missing.map((p) => `the ${p.item.name}`).join(', ')}.`)
        : c.fude(`まだ たりないよ：${missing.map((p) => p.item.jp).join('・')}`, `We’re still missing: ${missing.map((p) => `the ${p.item.name}`).join(', ')}.`),
      ...missing.map((p) => c.fude(p.hint[0], p.hint[1])),
    ]
  }
  return weave(c, g)
}

/** Parts this entity can hand over right now. */
function handOver(c: Ctx, from: string): Step[] {
  const out: Step[] = []
  for (const g of GATES) {
    const id = roadTale(g.region)
    if (c.stage(id) !== 0) continue
    for (const p of g.parts) {
      if (p.from !== from || c.has(p.item.id) || !p.ready(c)) continue
      out.push(c.fude('あっ！ それ、けっかいを やぶるのに つかえるかも！', 'Oh! That could help us break the ward!'))
      out.push(...p.give.map(([jp, en]) => c.say(jp, en)), ...c.give(p.item.id))
      if (g.parts.filter((q) => c.has(q.item.id)).length >= needs(g)) {
        out.push(needs(g) < 3 ? c.fude('これで ふたつ そろった！ けっかいへ いそごう！', 'That’s two! To the ward, quick!') : c.fude('これで みっつ そろった！ けっかいへ いそごう！', 'That’s all three! To the ward, quick!'), ...c.advance(id))
        break
      }
    }
  }
  return out
}

/** A nudge when you talk to someone whose part isn't ready yet. */
function nudge(c: Ctx, from: string): Step[] {
  for (const g of GATES) {
    if (c.stage(roadTale(g.region)) !== 0) continue
    const p = g.parts.find((q) => q.from === from && !c.has(q.item.id))
    if (p) return [c.fude(p.hint[0], p.hint[1])]
  }
  return []
}

function partTalk(c: Ctx, base: TalkScript | undefined, from: string): Step[] | null {
  // their own story first (it may finish the very tale that frees the part)
  const b = base?.(c) ?? null
  const g = handOver(c, from)
  const tail = g.length ? g : nudge(c, from)
  if (!tail.length) return b
  if (!b) return g.length ? g : null
  // a talk that ends in a trial: hand over before it starts
  if (b.some((x) => x.kind === 'activity')) return g.length ? [...g, ...b] : b
  return [...b, ...tail]
}

const wrapTalk: NonNullable<TaleContent['wrapTalk']> = {}
for (const g of GATES) wrapTalk[g.boss] = (c, base) => wardTalk(c, g) ?? base?.(c) ?? null
for (const from of new Set(GATES.flatMap((g) => g.parts.map((p) => p.from)))) wrapTalk[from] = (c, base) => partTalk(c, base, from)

const tales: Tale[] = GATES.map((g) => ({
  id: roadTale(g.region),
  region: g.region,
  main: true,
  title: g.title,
  jp: g.jp,
  summary: g.summary,
  giver: g.boss,
  available: (s) => regionUnlocked(s, g.region) && !isPassed(s, g.activity),
  stages: [
    needs(g) < 3
      ? { jp: `${g.gather[0]}（どれか ふたつで OK）`, en: `${g.gather[1]}. Any two will do`, target: g.parts.map((p) => p.from) }
      : { jp: `${g.gather[0]}（みっつ ぜんぶ）`, en: `${g.gather[1]}. This last ward needs all three`, target: g.parts.map((p) => p.from) },
    { jp: g.bring[0], en: g.bring[1], target: [g.boss] },
  ],
}))

export const ROAD: TaleContent = {
  tales,
  items: GATES.flatMap((g) => [...g.parts.map((p) => p.item), g.key]),
  talk: {},
  cast: {},
  wrapTalk,
  // a sealed boss shimmers, half out of reach, until its ward breaks
  ghost: Object.fromEntries(GATES.map((g) => [g.boss, (s: PlayerState) => !wardOpen(s, g.region)])),
}

/**
 * The story, as data. Each scene is a list of steps played by <Cutscene>.
 *
 * Language ramps with the regions: the intro and village scenes are mostly
 * English with simple kana words; by the Shrine and the Tower, characters
 * speak Japanese first and the English is a translation shown according to
 * the player's immersion level. `{name}` is replaced with the player's name.
 * Japanese lines are written in the kana/kanji the player has met by then.
 */
import type { SpriteId } from '../art'
import type { TrackId } from '../engine/music'
import { MEMORY_SCENES } from './memories'
import type { PackBackdrop } from '../regions/ids'
import { PACK_SCENES, PACK_SPEAKER_DEFS } from '../regions/scenes'

export type Backdrop = 'void' | 'night-hill' | 'village' | 'fields' | 'forest' | 'shrine' | 'tower' | 'dawn' | PackBackdrop
export type Emote = '!' | '?' | '♪' | '…' | '♥' | '💢'

export interface Speaker {
  sprite: SpriteId
  name: string
  jp: string
  /** Name-plate colour. */
  color: string
}

const CORE_SPEAKERS = {
  fude: { sprite: 'fude', name: 'Fude', jp: 'フデ', color: '#f7c948' },
  you: { sprite: 'mage', name: '{name}', jp: '{name}', color: '#9be7ff' },
  elder: { sprite: 'elder', name: 'Elder', jp: 'ちょうろう', color: '#e6c98a' },
  merchant: { sprite: 'merchant', name: 'Mina', jp: 'ミナ', color: '#f7a8c4' },
  child: { sprite: 'child', name: 'Kid', jp: 'こども', color: '#9bd65b' },
  farmer: { sprite: 'villager-a', name: 'Farmer', jp: 'のうか', color: '#9bd65b' },
  guard: { sprite: 'guard', name: 'Goro', jp: 'ゴロー', color: '#7fc4f0' },
  priest: { sprite: 'priest', name: 'Priest', jp: 'かんぬし', color: '#c7a3f0' },
  king: { sprite: 'king', name: 'King', jp: 'おうさま', color: '#f7c948' },
  oni: { sprite: 'oni', name: 'Kana Oni', jp: 'かなのおに', color: '#ff6b3d' },
  golem: { sprite: 'golem', name: 'Radical Golem', jp: 'ぶしゅのゴーレム', color: '#e6c98a' },
  guardian: { sprite: 'treant', name: 'Particle Guardian', jp: 'じょしのしゅご', color: '#5cb24a' },
  librarian: { sprite: 'wisp', name: 'Silent Librarian', jp: 'しずかなししょ', color: '#9be7ff' },
  chimera: { sprite: 'kitsune', name: 'Shifting Chimera', jp: 'かわるキメラ', color: '#c7a3f0' },
  dragon: { sprite: 'dragon', name: 'Void Dragon', jp: 'こくうのりゅう', color: '#a61e3a' },
  // Fude's memories: the girl who carried her before, and the nameless quiet
  // her name is a secret the memories reveal, so the plate never gives it away
  scribe: { sprite: 'scribe', name: 'Girl with the Brush', jp: 'ふでの しょうじょ', color: '#f2a7c3' },
  kotone: { sprite: 'scribe', name: 'Kotone', jp: 'ことね', color: '#f2a7c3' },
  shadow: { sprite: 'wisp', name: '???', jp: '？？？', color: '#8a8fb8' },
} satisfies Record<string, Speaker>

/** Everyone who can speak in a cutscene: the core cast, then the region packs'. */
export const SPEAKERS = { ...CORE_SPEAKERS, ...PACK_SPEAKER_DEFS }

export type ActorId = keyof typeof SPEAKERS

export interface SceneStep {
  /** Who speaks (portrait + name). Omit for narration. */
  who?: ActorId
  /** Japanese line (typed out and spoken). */
  jp?: string
  /** English line / translation. */
  en?: string
  /** Kana reading for text-to-speech when `jp` contains kanji. */
  kana?: string
  /** Emote bubble over `target` (default: the speaker). */
  emote?: Emote
  target?: ActorId
  /** Screen shake. */
  shake?: boolean
  /** Full-screen flash colour. */
  flash?: string
  /** Actor walks on / leaves. */
  enter?: ActorId
  exit?: ActorId
  /** Change the backdrop. */
  bg?: Backdrop
  /** Silent beat that auto-advances after this many ms (no message box). */
  pause?: number
}

export interface Scene {
  id: string
  title: string
  bg: Backdrop
  music?: TrackId
  /** Actors on stage when the scene opens (left → right). */
  cast: ActorId[]
  steps: SceneStep[]
  /** One of Fude's memories: drawn in faded sepia. */
  memory?: boolean
}

const S: Scene[] = [
  // ─── Prologue ──────────────────────────────────────────────────────
  {
    id: 'intro',
    title: 'Prologue',
    bg: 'void',
    music: 'title',
    cast: [],
    steps: [
      { pause: 700 },
      { jp: 'むかしむかし、ことばは いきていました。', en: 'Long ago, every word in the world was alive.' },
      { jp: '「ひ」と いえば、ひが もえる。「みず」と いえば、かわが ながれる。', en: 'Say ひ (fire), and fire would burn. Say みず (water), and rivers would flow.' },
      { jp: 'でも、ある よる… こくうの りゅうが きました。', en: 'But one night, the Void Dragon came. It swallowed the Kotoba, the first words, and scattered them across the land.', shake: true, flash: '#a61e3a' },
      { jp: 'ことばが きえていきます…', en: 'Now the words are fading. Bridges turn to mist. Songs lose their lyrics. Friends forget each other’s names.' },
      { bg: 'night-hill', enter: 'you', pause: 900 },
      { enter: 'fude', pause: 500 },
      { who: 'fude', emote: '!', jp: 'おきて！ おきて！', en: 'Wake up! Wake up!' },
      { who: 'you', emote: '?', jp: '……？', en: '(You open your eyes. A tiny floating brush is staring at you.)' },
      { who: 'fude', emote: '♪', jp: 'よかった！ こんばんは！', en: 'Oh, thank goodness! こんばんは means “good evening”!' },
      { who: 'fude', jp: 'わたしは フデ。ふでの せいれいです。', en: 'I’m Fude, a brush spirit. I used to write the world’s words… until they started to fade.' },
      { who: 'fude', emote: '…', jp: 'なまえの ないものは、きえてしまう。', en: 'Without words, nothing can be named. And whatever has no name slowly disappears.' },
      { who: 'fude', jp: 'でも、あなたには ことばが みえる。', en: 'But you can still see the words glowing. That means you have the gift: word magic!' },
      { who: 'fude', emote: '!', jp: 'ことばを まなんで、せかいを なおしましょう！', en: 'Learn the Kotoba again, one by one, and we can restore the land. We’ll start with the village below the hill.' },
      { who: 'you', jp: 'はい！', en: 'Yes!' },
      { who: 'fude', emote: '♪', jp: 'いきましょう！ …あ、おなまえは？', en: 'Let’s go! Oh, wait. What’s your name?' },
    ],
  },

  // ─── Arrivals ──────────────────────────────────────────────────────
  {
    id: 'arrive-village',
    title: 'The Village of First Words',
    bg: 'village',
    music: 'village',
    cast: ['you', 'fude'],
    steps: [
      { pause: 500 },
      { enter: 'child', pause: 300 },
      { who: 'child', emote: '!', jp: 'あ！ まどうしだ！', en: 'Ah! A mage!' },
      { who: 'fude', emote: '♪', jp: 'はじまりの むら です。', en: 'This is the Village of First Words. Every mage starts here.' },
      { who: 'fude', jp: 'これは ひらがな。', en: 'See the letters on the signs? That’s hiragana (ひらがな). Each one is a sound, and every word is built from them.' },
      { who: 'child', emote: '…', jp: 'かんばんの じが、きえちゃった…', en: 'But the letters on the signs are fading…' },
      { enter: 'merchant', pause: 300 },
      { who: 'merchant', emote: '♪', jp: 'いらっしゃいませ！', en: 'Welcome! I’m Mina, the spell merchant. Want a spell? Just ask me politely with ください (please).' },
      { who: 'fude', jp: 'がんばりましょう！', en: 'Learn the kana, collect words, and the village will light up again. がんばりましょう: let’s do our best!' },
    ],
  },
  {
    id: 'arrive-fields',
    title: 'The Elemental Fields',
    bg: 'fields',
    music: 'fields',
    cast: ['you', 'fude'],
    steps: [
      { pause: 500 },
      { who: 'fude', emote: '!', jp: 'ひろい！', en: 'So wide! These are the Elemental Fields: fire, water, tree, earth and stone.' },
      { who: 'fude', jp: '木、林、森。', kana: 'き、はやし、もり。', en: 'Words out here are older. A tree is 木. Two trees make 林, a grove. Three trees make 森, a forest!' },
      { enter: 'farmer', pause: 300 },
      { who: 'farmer', emote: '💢', shake: true, jp: 'たすけて！ 田んぼの 字が きえました！', kana: 'たすけて！ たんぼの じが きえました！', en: 'Help! The character for my rice field has vanished!' },
      { who: 'fude', jp: 'くみあわせて みよう！', en: 'Kanji are built from pieces called radicals. Put the right pieces together and meaning blooms. The sharp katakana (カタカナ) live here too.' },
      { who: 'you', emote: '♪', jp: 'よし！', en: 'Alright!' },
    ],
  },
  {
    id: 'arrive-forest',
    title: 'The Forest of Sentences',
    bg: 'forest',
    music: 'forest',
    cast: ['you', 'fude'],
    steps: [
      { pause: 600 },
      { who: 'fude', emote: '…', jp: 'しずかですね…', en: 'It’s so quiet…' },
      { who: 'fude', jp: 'ここは 文の森。ことばが 木のように つながります。', kana: 'ここは ぶんのもり。ことばが きのように つながります。', en: 'This is the Forest of Sentences. Here, words link together like branches.' },
      { who: 'fude', jp: 'は、を、に、で… これは「じょし」です。', en: 'は, を, に, で… these little words are particles. They tie words into sentences.' },
      { who: 'fude', emote: '!', jp: 'わたしは みずを のみます。', en: '“I drink water.” See? The topic takes は, the object takes を, and the verb comes last.' },
      { enter: 'guard', shake: true, pause: 300 },
      { who: 'guard', emote: '!', jp: 'とまれ！ ただしく いえないと、はしは わたれないぞ！', en: 'Halt! If you can’t say it correctly, you can’t cross the bridge!' },
      { who: 'you', jp: 'がんばります！', en: 'I’ll do my best!' },
    ],
  },
  {
    id: 'arrive-shrine',
    title: 'The Shrine of Reading',
    bg: 'shrine',
    music: 'shrine',
    cast: ['you', 'fude'],
    steps: [
      { pause: 600 },
      { who: 'fude', jp: 'きれいな じんじゃですね。', en: 'What a beautiful shrine.' },
      { enter: 'priest', pause: 300 },
      { who: 'priest', jp: 'ようこそ、読みの社へ。', kana: 'ようこそ、よみのやしろへ。', en: 'Welcome to the Shrine of Reading.' },
      { who: 'priest', jp: 'ここの いしぶみには、ふるい ことばが 書いてあります。', kana: 'ここの いしぶみには、ふるい ことばが かいてあります。', en: 'The stone tablets here hold ancient words.' },
      { who: 'priest', jp: 'よく 読んで、よく 聞いてください。', kana: 'よく よんで、よく きいてください。', en: 'Read carefully, and listen carefully.' },
      { who: 'fude', emote: '♪', jp: '「あつい」「さむい」「しずか」… かたちの ことばを おぼえよう！', en: 'Hot, cold, quiet… let’s learn describing words: adjectives!' },
    ],
  },
  {
    id: 'arrive-tower',
    title: 'The Tower of Creation',
    bg: 'tower',
    music: 'tower',
    cast: ['you', 'fude'],
    steps: [
      { pause: 600 },
      { who: 'fude', emote: '!', jp: 'たかい！ これが 創造の塔です。', kana: 'たかい！ これが そうぞうのとうです。', en: 'So tall! This is the Tower of Creation.' },
      { enter: 'king', pause: 300 },
      { who: 'king', jp: 'よく 来た、わかき まどうしよ。', kana: 'よく きた、わかき まどうしよ。', en: 'Welcome, young mage.' },
      { who: 'king', jp: 'この 塔では、ことばが そのまま 力に なる。', kana: 'この とうでは、ことばが そのまま ちからに なる。', en: 'In this tower, words become power itself.' },
      { who: 'king', jp: 'ただし、王の まえでは ていねいに 話すように。', kana: 'ただし、おうの まえでは ていねいに はなすように。', en: 'But mind your manners: speak politely before the king.' },
      { who: 'fude', emote: '…', jp: '（「です」と「ます」ですよ！）', en: '(Remember: です and ます!)' },
      { who: 'you', jp: 'はい、わかりました。', en: 'Yes, understood.' },
    ],
  },

  // ─── Bosses ────────────────────────────────────────────────────────
  {
    id: 'pre-boss-r1',
    title: 'The Kana Oni',
    bg: 'village',
    music: 'boss',
    cast: ['you', 'fude'],
    steps: [
      { enter: 'oni', shake: true, flash: '#e2432f', pause: 400 },
      { who: 'oni', emote: '💢', jp: 'ガハハハ！', en: 'GAHAHAHA!' },
      { who: 'oni', jp: 'おれは かなの おに！', en: 'I am the Kana Oni! I ate this village’s letters and scrambled them all up!' },
      { who: 'fude', emote: '!', jp: 'よんで！', en: 'Careful! It’s made of jumbled hiragana. Read each kana it throws at you, fast!' },
      { who: 'oni', jp: 'よめるかな？', en: 'Think you can read me?' },
      { who: 'you', jp: 'いくぞ！', en: 'Here I come!' },
    ],
  },
  {
    id: 'post-boss-r1',
    title: 'Letters Return',
    bg: 'village',
    music: 'village',
    cast: ['you', 'fude', 'oni'],
    steps: [
      { who: 'oni', emote: '…', shake: true, jp: 'う、うそだ…', en: 'N-no way…' },
      { flash: '#ffffff', jp: 'もじが もどりました！', en: 'The scrambled kana fly free and settle back onto the signs, doors and lanterns.' },
      { who: 'oni', jp: '…ごめんなさい。', en: '…I’m sorry. Without any words, I was just so lonely.' },
      { who: 'fude', emote: '♪', jp: 'やった！', en: 'We did it! The village can read again. And look: the road to the fields is open!' },
      { who: 'fude', jp: 'つぎは げんその の！', en: 'Next stop: the Elemental Fields!' },
    ],
  },
  {
    id: 'pre-boss-r2',
    title: 'The Radical Golem',
    bg: 'fields',
    music: 'boss',
    cast: ['you', 'fude'],
    steps: [
      { enter: 'golem', shake: true, pause: 400 },
      { who: 'golem', jp: 'ゴゴゴゴ…', en: '(The ground rumbles…)', shake: true },
      { who: 'fude', emote: '!', jp: 'ぶしゅの ゴーレム！', en: 'A golem of fused radicals! 木, 日, 口… all stuck together in the wrong shapes.' },
      { who: 'golem', jp: 'わたしは 石。わたしは 山。わたしは… なに？', kana: 'わたしは いし。わたしは やま。わたしは… なに？', en: 'I am stone. I am mountain. I am… what?' },
      { who: 'fude', jp: 'わけて あげよう！', en: 'It doesn’t know what it is! Split it into the right kanji and set its pieces free.' },
    ],
  },
  {
    id: 'post-boss-r2',
    title: 'The Fields Bloom',
    bg: 'fields',
    music: 'fields',
    cast: ['you', 'fude', 'golem'],
    steps: [
      { who: 'golem', emote: '…', jp: 'ああ… わたしは 森。林。木…', kana: 'ああ… わたしは もり。はやし。き…', en: 'Ah… I am forest. Grove. Tree…' },
      { flash: '#9bd65b', jp: '田んぼに 字が もどった。', kana: 'たんぼに じが もどった。', en: 'The fields bloom. Kanji return to the rice paddies, the rivers and the hills.' },
      { who: 'golem', emote: '♥', jp: 'ありがとう。', en: 'Thank you.' },
      { who: 'fude', jp: 'つぎは 文の森です。ことばを つなげましょう！', kana: 'つぎは ぶんのもりです。ことばを つなげましょう！', en: 'Next is the Forest of Sentences. Let’s link words together!' },
    ],
  },
  {
    id: 'pre-boss-r3',
    title: 'The Particle Guardian',
    bg: 'forest',
    music: 'boss',
    cast: ['you', 'fude'],
    steps: [
      { enter: 'guardian', shake: true, pause: 400 },
      { who: 'guardian', jp: 'わたしは じょしの しゅご。', en: 'I am the Particle Guardian.' },
      { who: 'guardian', jp: 'は、が、を、に、で… ただしい じょしだけが わたしに とどく。', en: 'は, が, を, に, で… only the right particle can reach me.' },
      { who: 'fude', emote: '?', jp: 'ほかの こうげきは きかない…？', en: 'So nothing else will hurt it…?' },
      { who: 'fude', emote: '!', jp: 'よし、ぶんを よく 見て！', kana: 'よし、ぶんを よく みて！', en: 'Okay! Read each sentence closely!' },
    ],
  },
  {
    id: 'post-boss-r3',
    title: 'The Forest Speaks',
    bg: 'forest',
    music: 'forest',
    cast: ['you', 'fude', 'guardian'],
    steps: [
      { who: 'guardian', emote: '…', jp: 'みごとだ。', en: 'Splendid.' },
      { who: 'guardian', jp: '森の ことばを かえそう。', kana: 'もりの ことばを かえそう。', en: 'I return the forest’s words to you.' },
      { flash: '#9be7e0', jp: 'とりが うたい、かぜが はなしはじめた。', en: 'Birds sing again. Even the wind begins to talk.' },
      { who: 'fude', emote: '♪', jp: 'つぎは 読みの社へ 行きましょう。', kana: 'つぎは よみのやしろへ いきましょう。', en: 'Next, let’s go to the Shrine of Reading.' },
    ],
  },
  {
    id: 'pre-boss-r4',
    title: 'The Silent Librarian',
    bg: 'shrine',
    music: 'boss',
    cast: ['you', 'fude'],
    steps: [
      { jp: '……。', en: '(Total silence falls over the shrine.)', pause: 1200 },
      { enter: 'librarian', pause: 400 },
      { who: 'librarian', jp: 'しーっ。', en: 'Shh.' },
      { who: 'librarian', jp: 'わたしは しずかな ししょ。声では なく、字で 話します。', kana: 'わたしは しずかな ししょ。こえでは なく、じで はなします。', en: 'I am the Silent Librarian. I speak not with my voice, but with writing.' },
      { who: 'fude', emote: '…', jp: '（なぞなぞを 読んで、こたえるんですね…）', kana: 'なぞなぞを よんで、こたえるんですね', en: '(We have to read her riddles and answer…)' },
      { who: 'librarian', jp: 'では、読んで ごらんなさい。', kana: 'では、よんで ごらんなさい。', en: 'Now then. Read.' },
    ],
  },
  {
    id: 'post-boss-r4',
    title: 'The Bell Rings',
    bg: 'shrine',
    music: 'shrine',
    cast: ['you', 'fude', 'librarian'],
    steps: [
      { who: 'librarian', emote: '♪', jp: 'すばらしい。あなたは 本当に 読めるのですね。', kana: 'すばらしい。あなたは ほんとうに よめるのですね。', en: 'Wonderful. You truly can read.' },
      { who: 'librarian', jp: 'この 本を どうぞ。いつか、塔の かぎに なります。', kana: 'この ほんを どうぞ。いつか、とうの かぎに なります。', en: 'Please take this book. One day it will be your key to the Tower.' },
      { flash: '#f7c948', jp: 'やしろの かねが なりひびいた。', en: 'The shrine bell rings out across the land.' },
      { who: 'fude', emote: '!', jp: '塔は まだ とおい… まずは 山を おりて、みなとへ 行きましょう！', kana: 'とうは まだ とおい… まずは やまを おりて、みなとへ いきましょう！', en: 'The Tower is still far away… First, down the mountain to the harbour!' },
    ],
  },
  {
    id: 'pre-boss-r5',
    title: 'The Shifting Chimera',
    bg: 'tower',
    music: 'boss',
    cast: ['you', 'fude'],
    steps: [
      { enter: 'chimera', shake: true, flash: '#8a4fd1', pause: 400 },
      { who: 'chimera', jp: 'わたしは かわる キメラ。あつく、つめたく、大きく、小さく…', kana: 'わたしは かわる キメラ。あつく、つめたく、おおきく、ちいさく…', en: 'I am the Shifting Chimera. Hot, cold, big, small…' },
      { who: 'chimera', jp: 'わたしを ただしく 言えるか？', kana: 'わたしを ただしく いえるか？', en: 'Can you describe me correctly?' },
      { who: 'fude', emote: '!', jp: 'かたちに ちゅうい！「あつい」は「あつくない」になりますよ。', en: 'Watch the forms! あつい (hot) becomes あつくない (not hot).' },
      { who: 'you', jp: 'まかせてください。', en: 'Leave it to me.' },
    ],
  },
  {
    id: 'post-boss-r5',
    title: 'The Void Dragon',
    bg: 'tower',
    music: 'boss',
    cast: ['you', 'fude', 'chimera'],
    steps: [
      { who: 'chimera', emote: '…', jp: 'わたしの かたちが… きまった…', en: 'My shape… is settling…' },
      { exit: 'chimera', bg: 'void', shake: true, flash: '#000000', jp: 'そのとき、そらが まっくらに なった。', en: 'Then the sky went black.' },
      { enter: 'dragon', shake: true, pause: 600 },
      { who: 'dragon', jp: 'よくぞ ここまで 来た、ちいさき まどうしよ。', kana: 'よくぞ ここまで きた、ちいさき まどうしよ。', en: 'So you made it this far, little mage.' },
      { who: 'dragon', emote: '💢', shake: true, jp: 'ことばなど いらぬ。すべてを しずけさに かえしてやろう。', en: 'Words are useless. I shall return everything to silence.' },
      { who: 'fude', emote: '!', jp: '{name}さん、いままで まなんだ ことば ぜんぶで たたかいましょう！', en: '{name}, let’s fight with every word we’ve learned!' },
      { who: 'you', jp: 'はい！', en: 'Yes!' },
    ],
  },

  // ─── Ending ────────────────────────────────────────────────────────
  {
    id: 'ending',
    title: 'Epilogue',
    bg: 'void',
    music: 'title',
    cast: ['you', 'fude', 'dragon'],
    steps: [
      { who: 'dragon', emote: '…', shake: true, jp: 'ばかな… ことばが… ひかる…', en: 'Impossible… the words… are shining…' },
      { flash: '#ffffff', exit: 'dragon', jp: 'りゅうの なかから、ことばが あふれだした。', en: 'Words burst out of the dragon: every name, every song, every greeting.' },
      { bg: 'dawn', pause: 900 },
      { jp: 'はしが もどり、うたが もどり、ともだちの なまえが もどった。', en: 'Bridges return. Songs return. Friends remember each other’s names.' },
      { enter: 'dragon', pause: 400 },
      { who: 'dragon', jp: '…ことばは、あたたかいな。', en: '…Words are warm, aren’t they.' },
      { who: 'fude', emote: '♥', jp: '{name}さん、ありがとう！ あなたは もう りっぱな ことばの まどうしです。', en: '{name}, thank you! You are a true word-mage now.' },
      { who: 'you', jp: 'フデ、ありがとう。これからも いっしょに まなぼう。', en: 'Thank you, Fude. Let’s keep learning together.' },
      { who: 'fude', emote: '♪', jp: 'もちろん！ ことばの たびは、まだまだ つづきます！', en: 'Of course! The journey of words goes on!' },
      { jp: 'おわり … そして、はじまり。', en: 'The End… and a new beginning.' },
    ],
  },
]

export const SCENES: Record<string, Scene> = Object.fromEntries([...S, ...MEMORY_SCENES, ...PACK_SCENES].map((s) => [s.id, s]))

export function hasSceneData(id: string): boolean {
  return id in SCENES
}

/** Replace `{name}` placeholders. */
export function fill(text: string | undefined, name: string): string {
  return (text ?? '').replace(/\{name\}/g, name || 'Mage')
}

/** The text passed to speech synthesis for a step (kana reading preferred; brackets stripped). */
export function speechText(step: SceneStep, name: string): string {
  return fill(step.kana ?? step.jp, name)
    .replace(/[（）()「」]/g, '')
    .replace(/…+|……/g, '、')
    .trim()
}

/** The on-stage cast after applying enter/exit up to (and including) step `upto`. */
export function castAt(scene: Scene, upto: number): ActorId[] {
  const cast = [...scene.cast]
  for (let i = 0; i <= upto && i < scene.steps.length; i++) {
    const s = scene.steps[i]
    if (s.exit) {
      const j = cast.indexOf(s.exit)
      if (j >= 0) cast.splice(j, 1)
    }
    if (s.enter && !cast.includes(s.enter)) cast.push(s.enter)
  }
  return cast
}

/** The backdrop at step `upto`. */
export function backdropAt(scene: Scene, upto: number): Backdrop {
  let bg = scene.bg
  for (let i = 0; i <= upto && i < scene.steps.length; i++) bg = scene.steps[i].bg ?? bg
  return bg
}

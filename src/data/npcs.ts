/**
 * NPCs and dialogue scenarios.
 *
 * Scenarios are small state machines (see engine/dialogue.ts): each node has
 * an NPC line (Japanese + English) and either player options, a free-input
 * challenge, or a "continue" link to the next node.
 *
 * `{name}` inside any text is replaced with the player's name.
 */
import { PACK_DATA } from '../regions/data'

export type Politeness = 'casual' | 'polite' | 'formal'
export type Tone = 'polite' | 'casual' | 'rude'

export interface Npc {
  id: string
  name: string
  jp: string
  emoji: string
  region: number
  /** Short personality sketch (also fed to the Echo-Soul AI). */
  personality: string
  /** What register the NPC expects from the player. */
  politeness: Politeness
  /** Accent colour for the portrait / bubble. */
  color: string
  /** Topics they like to talk about (Echo-Soul). */
  interests: string[]
  greeting: { jp: string; en: string }
}

const CORE_NPCS: Npc[] = [
  {
    id: 'merchant',
    name: 'Mina the Spell Merchant',
    jp: 'まほうやの ミナ',
    emoji: '🧙‍♀️',
    region: 1,
    personality: 'Cheerful village shopkeeper who sells elemental spells in little glass bottles. Warm, patient and chatty.',
    politeness: 'polite',
    color: '#ff9ecf',
    interests: ['spells', 'fire, water and wood', 'the village', 'food'],
    greeting: { jp: 'いらっしゃいませ！', en: 'Welcome!' },
  },
  {
    id: 'guard',
    name: 'Goro the Bridge Guard',
    jp: 'はしの ばんにん ゴロー',
    emoji: '💂',
    region: 3,
    personality: 'Gruff but fair guard of the forest bridge. Speaks in short, blunt sentences. Secretly loves cats.',
    politeness: 'casual',
    color: '#7fd18b',
    interests: ['the bridge', 'the forest', 'cats', 'rules'],
    greeting: { jp: 'とまれ！', en: 'Halt!' },
  },
  {
    id: 'priest',
    name: 'The Shrine Priest',
    jp: 'かんぬしさま',
    emoji: '🧓',
    region: 4,
    personality: 'Gentle, calm shrine priest. Speaks slowly and kindly, asks many questions about the traveller.',
    politeness: 'polite',
    color: '#ffd166',
    interests: ['the shrine', 'the seasons', 'where people come from', 'what people like'],
    greeting: { jp: 'ようこそ。', en: 'Welcome.' },
  },
  {
    id: 'king',
    name: 'The King of the Tower',
    jp: '塔の 王さま',
    emoji: '🤴',
    region: 5,
    personality: 'Proud, formal king. Expects polite です/ます speech and humble phrases; is offended by casual speech.',
    politeness: 'formal',
    color: '#c9a7ff',
    interests: ['the dragon', 'the kingdom', 'heroes', 'respect'],
    greeting: { jp: 'よく来た。', en: 'You have come.' },
  },
  {
    id: 'jailer',
    name: 'The Jailer',
    jp: 'ろうやばん',
    emoji: '🧌',
    region: 5,
    personality: 'Grumpy dungeon jailer who only lets out prisoners who apologise properly.',
    politeness: 'casual',
    color: '#9aa0b8',
    interests: ['apologies', 'keys', 'rules'],
    greeting: { jp: 'なんだ？', en: 'What?' },
  },
  {
    id: 'innkeeper',
    name: 'Haru the Innkeeper',
    jp: 'さかばの ハル',
    emoji: '🧑‍🍳',
    region: 1,
    personality: 'Friendly tavern keeper who loves meeting travellers, talks about food, drinks and adventures.',
    politeness: 'polite',
    color: '#ffb36b',
    interests: ['food', 'drinks', 'travellers', 'the weather', 'adventures'],
    greeting: { jp: 'いらっしゃい！', en: 'Welcome in!' },
  },
]

export const NPCS: Npc[] = [...CORE_NPCS, ...PACK_DATA.flatMap((d) => d.npcs ?? [])]
export const NPC_BY_ID = new Map(NPCS.map((n) => [n.id, n]))

// ─── Scenario data ─────────────────────────────────────────────────────

export interface Line {
  jp: string
  en: string
}

export interface OptionEffects {
  /** Elemental spell granted (e.g. '水'). */
  grantSpell?: string
  /** Trust change for the scenario NPC. */
  trust?: number
}

export interface DialogueOption {
  jp: string
  /** Reading (kana) when `jp` contains kanji. */
  kana?: string
  en: string
  correct: boolean
  /** Social register of the answer (King scenario). */
  tone?: Tone
  /** NPC's spoken reaction. */
  reply?: Line
  /** Teaching note shown after choosing (English). */
  note?: string
  /** Vocabulary reviewed by this answer (defaults to the node's wordIds). */
  wordIds?: string[]
  effects?: OptionEffects
  /** Hide the option once this spell was obtained in this conversation. */
  unlessSpell?: string
  /** Where to go. Default: correct → node.next, wrong → stay on this node. */
  next?: string
}

export interface FreeInput {
  /** Accepted answers (kanji or kana — compared after normalisation). */
  accepted: string[]
  /** Model answer shown after a mistake. */
  model: string
  modelKana: string
  /** Reaction when the answer is wrong. */
  wrongReply: Line
  wrongNote: string
  reply?: Line
}

export interface DialogueNode {
  id: string
  /** NPC speaking this line (defaults to the scenario NPC). */
  speaker?: string
  line: Line
  /** Reading of `line.jp` when it contains kanji (used for TTS clarity). */
  kana?: string
  options?: DialogueOption[]
  input?: FreeInput
  /** Next node after a correct answer or for "continue" nodes. `$resume` returns from the jail branch. */
  next?: string
  /** Vocabulary tested at this node. */
  wordIds?: string[]
  /** English hint (bought with the hint button in hint mode). */
  hint?: string
  /** If all these spells were obtained in this conversation, jump to `to`. */
  exitWhen?: { spells: string[]; to: string }
  /** Effect applied when the node is entered. */
  onEnter?: { setTrust?: number }
  /** Part of the jail branch (no re-jailing inside it). */
  jail?: boolean
  /** Conversation ends here (success). */
  end?: boolean
}

export interface Scenario {
  id: string
  npcId: string
  region: number
  /** always: English under the NPC's Japanese. hint: English only via a (costly) hint. */
  translations: 'always' | 'hint'
  start: string
  hearts: number
  /** Trust meter (0..trustMax). */
  startTrust: number
  trustMax: number
  /** When trust falls to this value or below, jump to `jail.node`. */
  jail?: { threshold: number; node: string }
  intro: string[]
  nodes: Record<string, DialogueNode>
}

function nodes(list: DialogueNode[]): Record<string, DialogueNode> {
  return Object.fromEntries(list.map((n) => [n.id, n]))
}

// ─── Region 1 – The Spell Merchant ─────────────────────────────────────

const VILLAGE_SHOP: Scenario = {
  id: 'village-shop',
  npcId: 'merchant',
  region: 1,
  translations: 'always',
  start: 'greet',
  hearts: 5,
  startTrust: 3,
  trustMax: 6,
  intro: [
    'Mina sells elemental spells — but only to those who ask in Japanese.',
    'Get the 🔥 火, 💧 水 and 🌳 木 spells. Ask with 〜をください (please give me ~).',
    'Pick your reply with a tap or the keys 1–4. Wrong words cost a ❤️.',
  ],
  nodes: nodes([
    {
      id: 'greet',
      line: { jp: 'いらっしゃいませ！こんにちは。', en: 'Welcome! Hello.' },
      wordIds: ['konnichiwa'],
      next: 'shop',
      options: [
        { jp: 'こんにちは！', en: 'Hello!', correct: true, reply: { jp: 'はい、こんにちは！', en: 'Yes, hello!' }, effects: { trust: 1 } },
        { jp: 'さようなら。', en: 'Goodbye.', correct: false, reply: { jp: 'え？もう かえりますか？', en: 'Huh? Leaving already?' }, note: 'さようなら means "goodbye". Greet her with こんにちは.' },
        { jp: 'いただきます。', en: "Let's eat.", correct: false, reply: { jp: 'ここは レストランじゃ ありませんよ！', en: "This isn't a restaurant!" }, note: 'いただきます is said before eating. Greet her with こんにちは.' },
      ],
    },
    {
      id: 'shop',
      line: { jp: 'なにに しますか？', en: 'What would you like?' },
      exitWhen: { spells: ['火', '水', '木'], to: 'thanks' },
      next: 'shop',
      hint: 'Ask with 〜をください: 水をください = "Water, please."',
      options: [
        { jp: '水をください。', kana: 'みずをください。', en: 'Water, please.', correct: true, wordIds: ['mizu'], unlessSpell: '水', effects: { grantSpell: '水' }, reply: { jp: 'はい、水です。どうぞ！', en: 'Here you are — water!' } },
        { jp: '火をください。', kana: 'ひをください。', en: 'Fire, please.', correct: true, wordIds: ['hi'], unlessSpell: '火', effects: { grantSpell: '火' }, reply: { jp: 'はい、火です。どうぞ！', en: 'Here you are — fire!' } },
        { jp: '木をください。', kana: 'きをください。', en: 'A tree, please.', correct: true, wordIds: ['ki'], unlessSpell: '木', effects: { grantSpell: '木' }, reply: { jp: 'はい、木です。どうぞ！', en: 'Here you are — a tree!' } },
        { jp: '水をたべます。', kana: 'みずをたべます。', en: 'I eat water.', correct: false, wordIds: ['mizu'], unlessSpell: '水', reply: { jp: 'え？水は たべられませんよ！', en: "Huh? You can't eat water!" }, note: 'たべます means "eat". To ask for something say 水をください.' },
        { jp: '火はください。', kana: 'ひはください。', en: '(As for fire,) please.', correct: false, wordIds: ['hi'], unlessSpell: '火', reply: { jp: 'ん？もう いちど どうぞ。', en: 'Hm? Once more, please.' }, note: 'The thing you ask for takes を, not は: 火をください.' },
        { jp: '木をのみます。', kana: 'きをのみます。', en: 'I drink a tree.', correct: false, wordIds: ['ki'], unlessSpell: '木', reply: { jp: '木は のめませんよ！', en: "You can't drink a tree!" }, note: 'のみます means "drink". Ask with 木をください.' },
      ],
    },
    {
      id: 'thanks',
      line: { jp: 'ぜんぶ そろいましたね！', en: "That's all three — you have them all!" },
      wordIds: ['arigatou'],
      next: 'bye',
      options: [
        { jp: 'ありがとう！', en: 'Thank you!', correct: true, effects: { trust: 1 } },
        { jp: 'こんにちは！', en: 'Hello!', correct: false, reply: { jp: 'こんにちは…？', en: 'Hello…?' }, note: 'You already greeted her. Now thank her: ありがとう.' },
        { jp: 'いただきます。', en: "Let's eat.", correct: false, reply: { jp: 'まほうは たべものじゃ ありませんよ。', en: "Spells aren't food, you know." }, note: 'いただきます is for meals. Say ありがとう (thank you).' },
      ],
    },
    { id: 'bye', line: { jp: 'どういたしまして。また きてね！', en: "You're welcome. Come again!" }, end: true },
  ]),
}

// ─── Region 3 – The Bridge Guard ───────────────────────────────────────

const BRIDGE_GUARD: Scenario = {
  id: 'bridge-guard',
  npcId: 'guard',
  region: 3,
  translations: 'hint',
  start: 'halt',
  hearts: 3,
  startTrust: 2,
  trustMax: 5,
  intro: [
    'Goro guards the only bridge out of the forest. He speaks only Japanese.',
    'Tell him you want to cross — the particle matters!',
    'Tap 💡 for an English hint (it lowers your score). Mistakes cost a ❤️.',
  ],
  nodes: nodes([
    {
      id: 'halt',
      line: { jp: 'とまれ！ここは 橋だ。', en: 'Halt! This is a bridge.' },
      kana: 'とまれ！ここは はしだ。',
      wordIds: ['sumimasen', 'hashi'],
      hint: 'He shouts "Halt!". Get his attention politely.',
      next: 'ask',
      options: [
        { jp: 'すみません。', en: 'Excuse me.', correct: true, wordIds: ['sumimasen'], effects: { trust: 1 }, reply: { jp: 'なんだ？', en: 'What is it?' } },
        { jp: 'こんにちは。', en: 'Hello.', correct: true, wordIds: ['konnichiwa'], reply: { jp: 'ああ、こんにちは。', en: 'Ah, hello.' } },
        { jp: 'いただきます。', en: "Let's eat.", correct: false, wordIds: ['sumimasen'], reply: { jp: 'ここで たべるな！', en: "Don't eat here!" }, note: 'いただきます is said before meals. Try すみません (excuse me).' },
        { jp: 'おやすみなさい。', en: 'Good night.', correct: false, wordIds: ['sumimasen'], reply: { jp: 'ねるな！', en: "Don't fall asleep!" }, note: 'おやすみなさい means "good night". Try すみません (excuse me).' },
      ],
    },
    {
      id: 'ask',
      line: { jp: 'なにを しに 来た？', en: 'What did you come here to do?' },
      kana: 'なにを しに きた？',
      wordIds: ['hashi', 'wataru'],
      hint: 'Say you will cross the bridge. The place you cross takes を; "cross" is わたります.',
      next: 'where',
      options: [
        { jp: '橋を わたります。', kana: 'はしを わたります。', en: 'I will cross the bridge.', correct: true, effects: { trust: 1 }, reply: { jp: 'ほう、わたりたいのか。', en: 'Oh, you want to cross?' } },
        { jp: '橋が わたります。', kana: 'はしが わたります。', en: 'The bridge crosses.', correct: false, reply: { jp: '橋が？橋は うごかないぞ。', en: "The bridge? Bridges don't move." }, note: 'が makes the bridge the one doing the crossing. The place you cross takes を: 橋をわたります.' },
        { jp: '橋を たべます。', kana: 'はしを たべます。', en: 'I will eat the bridge.', correct: false, reply: { jp: 'たべるな！', en: "Don't eat it!" }, note: 'たべます = eat. You want わたります (cross): 橋をわたります.' },
        { jp: '橋で ねます。', kana: 'はしで ねます。', en: 'I will sleep on the bridge.', correct: false, reply: { jp: 'だめだ！', en: 'No way!' }, note: 'ねます = sleep. You want 橋をわたります (I will cross the bridge).' },
      ],
    },
    {
      id: 'where',
      line: { jp: 'どこへ 行く？', en: 'Where are you going?' },
      kana: 'どこへ いく？',
      wordIds: ['mori', 'iku'],
      hint: 'Name a place + へ + 行きます (go).',
      next: 'say',
      options: [
        { jp: '森へ 行きます。', kana: 'もりへ いきます。', en: 'I am going to the forest.', correct: true, reply: { jp: '森か。あぶないぞ。', en: 'The forest, eh? It is dangerous.' } },
        { jp: '森が 行きます。', kana: 'もりが いきます。', en: 'The forest goes.', correct: false, reply: { jp: '森は 行かない！', en: "Forests don't go anywhere!" }, note: 'The destination takes へ (or に): 森へ行きます.' },
        { jp: '森を たべます。', kana: 'もりを たべます。', en: 'I will eat the forest.', correct: false, reply: { jp: 'なに？', en: 'What?' }, note: 'He asked where you are going: 森へ行きます.' },
        { jp: 'きのう 行きました。', kana: 'きのう いきました。', en: 'I went yesterday.', correct: false, reply: { jp: 'きのうの ことは きいてない。', en: "I didn't ask about yesterday." }, note: 'He asked where you are going now: 森へ行きます.' },
      ],
    },
    {
      id: 'say',
      line: { jp: 'よし。では、じぶんの ことばで もう いちど 言え。なにを する？', en: 'Good. Now say it again in your own words. What will you do?' },
      kana: 'よし。では、じぶんの ことばで もう いちど いえ。なにを する？',
      wordIds: ['hashi', 'wataru'],
      hint: 'Type or say: はしをわたります (I will cross the bridge).',
      next: 'pass',
      input: {
        accepted: ['橋をわたります', '橋を渡ります', 'はしをわたります', 'はしを渡ります', '橋をわたりたいです', '橋を渡りたいです', 'はしをわたりたいです'],
        model: '橋をわたります',
        modelKana: 'はしをわたります',
        wrongReply: { jp: 'なに？きこえないぞ。', en: "What? I can't hear you." },
        wrongNote: 'Say 橋をわたります (hashi o watarimasu) — "I will cross the bridge".',
        reply: { jp: 'よし、きこえた。', en: 'Right, I heard you.' },
      },
    },
    { id: 'pass', line: { jp: 'よし、とおれ！きを つけてな。', en: 'Alright, pass! Take care.' }, end: true },
  ]),
}

// ─── Region 4 – The Shrine Priest ──────────────────────────────────────

const SHRINE_PRIEST: Scenario = {
  id: 'shrine-priest',
  npcId: 'priest',
  region: 4,
  translations: 'hint',
  start: 'welcome',
  hearts: 3,
  startTrust: 2,
  trustMax: 6,
  intro: [
    'The priest asks about you — in Japanese only.',
    'Choose answers that are both grammatical and actually answer the question.',
    '💡 hints show English but lower your score. Mistakes cost a ❤️.',
  ],
  nodes: nodes([
    {
      id: 'welcome',
      line: { jp: 'ようこそ。こんにちは。', en: 'Welcome. Hello.' },
      wordIds: ['konnichiwa'],
      hint: 'He greets you. Greet him back.',
      next: 'name',
      options: [
        { jp: 'こんにちは。', en: 'Hello.', correct: true, effects: { trust: 1 } },
        { jp: 'おやすみなさい。', en: 'Good night.', correct: false, reply: { jp: 'まだ ひるですよ。', en: "It's still daytime." }, note: 'おやすみなさい means "good night". Reply こんにちは.' },
        { jp: 'いただきます。', en: "Let's eat.", correct: false, reply: { jp: 'ここは じんじゃですよ。', en: 'This is a shrine.' }, note: 'いただきます is said before a meal. Reply こんにちは.' },
      ],
    },
    {
      id: 'name',
      line: { jp: 'お名前は？', en: 'Your name?' },
      kana: 'おなまえは？',
      wordIds: ['watashi', 'namae'],
      hint: 'Introduce yourself: わたしは (I am) + name + です.',
      next: 'from',
      options: [
        { jp: 'わたしは {name} です。', en: 'I am {name}.', correct: true, effects: { trust: 1 }, reply: { jp: '{name}さん。いい 名前ですね。', en: '{name}. A fine name.' } },
        { jp: 'わたしを {name} です。', en: '(ungrammatical) Me-object {name} is.', correct: false, reply: { jp: '…はい？', en: '…Pardon?' }, note: 'The topic takes は, not を: わたしは〜です.' },
        { jp: 'げんきです。', en: "I'm fine.", correct: false, reply: { jp: 'それは よかった。でも、お名前は？', en: "Glad to hear it. But your name?" }, note: 'He asked your name, not how you are.' },
        { jp: '{name} が 好きです。', kana: '{name} が すきです。', en: 'I like {name}.', correct: false, reply: { jp: 'そうですか…？', en: 'Is that so…?' }, note: 'That means "I like {name}". Say わたしは {name} です.' },
      ],
    },
    {
      id: 'from',
      line: { jp: 'どこから 来ましたか？', en: 'Where did you come from?' },
      kana: 'どこから きましたか？',
      wordIds: ['kuru'],
      hint: 'Place + から (from) + 来ました (came).',
      next: 'like',
      options: [
        { jp: 'むらから 来ました。', kana: 'むらから きました。', en: 'I came from the village.', correct: true, effects: { trust: 1 }, reply: { jp: 'とおい ところから、ようこそ。', en: 'Welcome, from so far away.' } },
        { jp: 'むらを 来ました。', kana: 'むらを きました。', en: '(ungrammatical) I came the village.', correct: false, reply: { jp: 'むらを…？', en: 'The village…?' }, note: '"From" is から: むらから来ました.' },
        { jp: 'むらから たべました。', en: 'I ate from the village.', correct: false, reply: { jp: 'たべた？', en: 'Ate?' }, note: 'たべました = ate. He asked where you came from: むらから来ました.' },
        { jp: 'あしたです。', en: "It's tomorrow.", correct: false, reply: { jp: 'あした…？', en: 'Tomorrow…?' }, note: 'He asked "from where", not "when".' },
      ],
    },
    {
      id: 'like',
      line: { jp: '何が 好きですか？', en: 'What do you like?' },
      kana: 'なにが すきですか？',
      wordIds: ['suki'],
      hint: 'Thing + が + 好きです (I like ~).',
      next: 'today',
      options: [
        { jp: 'ねこが 好きです。', kana: 'ねこが すきです。', en: 'I like cats.', correct: true, wordIds: ['suki', 'neko'], effects: { trust: 1 }, reply: { jp: 'ねこは かわいいですね。', en: 'Cats are cute, aren’t they.' } },
        { jp: '本が 好きです。', kana: 'ほんが すきです。', en: 'I like books.', correct: true, wordIds: ['suki', 'hon'], effects: { trust: 1 }, reply: { jp: '本は いいですね。', en: 'Books are wonderful.' } },
        { jp: 'はい、好きです。', kana: 'はい、すきです。', en: 'Yes, I like it.', correct: false, reply: { jp: 'なにが 好きですか？', en: 'What do you like?' }, note: 'He asked WHAT you like. Name a thing: ねこが好きです.' },
        { jp: 'ねこで 好きです。', kana: 'ねこで すきです。', en: '(ungrammatical) With cats, I like.', correct: false, reply: { jp: 'ねこ…で？', en: 'Cats… with?' }, note: '好き takes が: ねこが好きです.' },
      ],
    },
    {
      id: 'today',
      line: { jp: '今日は 何を しますか？', en: 'What will you do today?' },
      kana: 'きょうは なにを しますか？',
      wordIds: ['kyou'],
      hint: 'Say what you will do (present/future ます form).',
      next: 'bless',
      options: [
        { jp: '本を 読みます。', kana: 'ほんを よみます。', en: 'I will read a book.', correct: true, wordIds: ['kyou', 'yomu'], effects: { trust: 1 }, reply: { jp: 'いいですね。', en: 'How nice.' } },
        { jp: '森へ 行きます。', kana: 'もりへ いきます。', en: 'I will go to the forest.', correct: true, wordIds: ['kyou', 'iku'], effects: { trust: 1 }, reply: { jp: 'きを つけて。', en: 'Be careful.' } },
        { jp: 'きのう 本を 読みました。', kana: 'きのう ほんを よみました。', en: 'I read a book yesterday.', correct: false, wordIds: ['kyou', 'yomu'], reply: { jp: 'きのう？今日は？', en: 'Yesterday? And today?' }, note: 'He asked about today. Use the present ます form: 本を読みます.' },
        { jp: '本に 読みます。', kana: 'ほんに よみます。', en: '(ungrammatical) I read to a book.', correct: false, wordIds: ['kyou', 'yomu'], reply: { jp: '本に…？', en: 'To a book…?' }, note: 'The thing you read takes を: 本を読みます.' },
      ],
    },
    {
      id: 'bless',
      line: { jp: 'そうですか。いい 一日を。', en: 'I see. Have a good day.' },
      kana: 'そうですか。いい いちにちを。',
      wordIds: ['arigatou'],
      hint: 'He wishes you a good day. Thank him politely.',
      next: 'end',
      options: [
        { jp: 'ありがとうございます。', en: 'Thank you very much.', correct: true, effects: { trust: 1 } },
        { jp: 'いただきます。', en: "Let's eat.", correct: false, reply: { jp: '…たべものは ありませんよ。', en: "…There's no food." }, note: 'Thank him: ありがとうございます.' },
        { jp: 'ごめんなさい。', en: "I'm sorry.", correct: false, reply: { jp: 'あやまる ことは ありませんよ。', en: 'There is nothing to apologise for.' }, note: 'He was kind — thank him: ありがとうございます.' },
      ],
    },
    { id: 'end', line: { jp: 'また 来てください。', en: 'Please come again.' }, kana: 'また きてください。', end: true },
  ]),
}

// ─── Region 5 – Audience with the King ─────────────────────────────────

const TOWER_KING: Scenario = {
  id: 'tower-king',
  npcId: 'king',
  region: 5,
  translations: 'hint',
  start: 'enter',
  hearts: 4,
  startTrust: 3,
  trustMax: 8,
  jail: { threshold: 0, node: 'jail' },
  intro: [
    'The King expects polite です/ます speech — humble phrases please him most.',
    'Casual answers lower his trust 👑. If it hits zero, it’s the dungeon!',
    'Mistakes cost a ❤️. 💡 hints lower your score.',
  ],
  nodes: nodes([
    {
      id: 'enter',
      line: { jp: 'よく 来た、たびびとよ。わしが この 塔の 王だ。', en: 'Welcome, traveller. I am the King of this tower.' },
      kana: 'よく きた、たびびとよ。わしが この とうの おうだ。',
      wordIds: ['ou', 'tou'],
      hint: 'Introduce yourself politely: はじめまして…',
      next: 'task',
      options: [
        { jp: 'はじめまして。よろしく おねがいします。', en: 'Nice to meet you. I am at your service.', correct: true, tone: 'polite', effects: { trust: 1 }, reply: { jp: 'うむ、れいぎ ただしいな。', en: 'Hm, well-mannered.' } },
        { jp: 'こんにちは、王さま。', kana: 'こんにちは、おうさま。', en: 'Hello, Your Majesty.', correct: true, tone: 'polite', reply: { jp: 'うむ。', en: 'Mm.' } },
        { jp: 'よう！', en: 'Yo!', correct: false, tone: 'casual', effects: { trust: -1 }, reply: { jp: 'よう…だと？', en: '"Yo"…?!' }, note: 'Far too casual for a king. Try はじめまして。よろしくおねがいします.' },
        { jp: 'おまえ だれ？', en: 'Who are you?', correct: false, tone: 'rude', effects: { trust: -2 }, reply: { jp: 'ぶれいな！', en: 'How rude!' }, note: 'おまえ is very rude. Be polite: はじめまして.' },
      ],
    },
    {
      id: 'task',
      line: { jp: '竜を たおして くれるか？', en: 'Will you defeat the dragon for me?' },
      kana: 'りゅうを たおして くれるか？',
      wordIds: ['ryuu'],
      hint: 'Accept humbly: はい、かしこまりました (Yes, certainly).',
      next: 'gift',
      options: [
        { jp: 'はい、かしこまりました。', en: 'Yes, certainly, Your Majesty.', correct: true, tone: 'polite', effects: { trust: 1 }, reply: { jp: 'たのもしい！', en: 'How reliable!' } },
        { jp: 'はい、たたかいます。', en: 'Yes, I will fight.', correct: true, tone: 'polite', wordIds: ['ryuu', 'tatakau'], reply: { jp: 'よろしい。', en: 'Very well.' } },
        { jp: 'うん、いいよ。', en: 'Yeah, sure.', correct: false, tone: 'casual', effects: { trust: -1 }, reply: { jp: 'うん、だと…？', en: '"Yeah"…?' }, note: 'うん is casual. Say はい、かしこまりました.' },
        { jp: 'いやだ。', en: 'No way.', correct: false, tone: 'rude', effects: { trust: -2 }, reply: { jp: 'なんだと！', en: 'What did you say?!' }, note: 'Refusing a king bluntly is rude. Say はい、かしこまりました.' },
      ],
    },
    {
      id: 'gift',
      line: { jp: 'では、この 剣を あたえよう。', en: 'Then I grant you this sword.' },
      kana: 'では、この つるぎを あたえよう。',
      wordIds: ['arigatou', 'tsurugi'],
      hint: 'Thank him in the most polite way.',
      next: 'question',
      options: [
        { jp: 'ありがとうございます。', en: 'Thank you very much.', correct: true, tone: 'polite', wordIds: ['arigatou'], effects: { trust: 1 }, reply: { jp: 'うむ。', en: 'Mm.' } },
        { jp: 'ありがとう。', en: 'Thanks.', correct: false, tone: 'casual', wordIds: ['arigatou'], effects: { trust: -1 }, reply: { jp: '…ございます、は？', en: '…Where is your "gozaimasu"?' }, note: 'Plain ありがとう is casual. To a king: ありがとうございます.' },
        { jp: 'どうも。', en: 'Thanks.', correct: false, tone: 'casual', wordIds: ['arigatou'], effects: { trust: -1 }, reply: { jp: 'かるいな。', en: 'How flippant.' }, note: 'どうも alone is casual. Say ありがとうございます.' },
        { jp: 'いらない。', en: "Don't need it.", correct: false, tone: 'rude', wordIds: ['arigatou'], effects: { trust: -2 }, reply: { jp: 'ぶれいもの！', en: 'Insolent!' }, note: 'Refusing a royal gift is rude. Say ありがとうございます.' },
      ],
    },
    {
      id: 'question',
      line: { jp: 'なにか しつもんは あるか？', en: 'Do you have any questions?' },
      wordIds: ['ryuu'],
      hint: 'Ask politely with 〜ますか, or decline politely: いいえ、ありません.',
      next: 'farewell',
      options: [
        { jp: '竜は どこに いますか？', kana: 'りゅうは どこに いますか？', en: 'Where is the dragon?', correct: true, tone: 'polite', wordIds: ['ryuu', 'iru'], effects: { trust: 1 }, reply: { jp: '塔の うえだ。', en: 'At the top of the tower.' } },
        { jp: 'いいえ、ありません。', en: 'No, I have none.', correct: true, tone: 'polite', reply: { jp: 'よろしい。', en: 'Very well.' } },
        { jp: '竜は どこ？', kana: 'りゅうは どこ？', en: "Where's the dragon?", correct: false, tone: 'casual', effects: { trust: -1 }, reply: { jp: 'ことばづかいに きを つけよ。', en: 'Mind your language.' }, note: 'Too casual. Add the polite verb: 竜はどこにいますか？' },
        { jp: 'ない。', en: 'Nope.', correct: false, tone: 'casual', effects: { trust: -1 }, reply: { jp: 'ない…だと？', en: '"Nope"…?' }, note: 'Plain ない is casual. Say いいえ、ありません.' },
      ],
    },
    {
      id: 'farewell',
      line: { jp: 'では ゆけ、ゆうしゃよ！', en: 'Then go forth, hero!' },
      wordIds: ['yuusha'],
      hint: 'Take your leave politely: しつれいします.',
      next: 'victory',
      options: [
        { jp: 'しつれいします。', en: 'Excuse me (as I take my leave).', correct: true, tone: 'polite', effects: { trust: 1 } },
        { jp: 'いってきます。', en: "I'm off (and will return).", correct: true, tone: 'polite' },
        { jp: 'じゃあね！', en: 'See ya!', correct: false, tone: 'casual', effects: { trust: -1 }, reply: { jp: 'じゃあね…？', en: '"See ya"…?' }, note: 'Too casual. Say しつれいします.' },
        { jp: 'バイバイ！', en: 'Bye-bye!', correct: false, tone: 'casual', effects: { trust: -1 }, reply: { jp: 'こどもか！', en: 'Are you a child?!' }, note: 'Bye-bye is for friends. Say しつれいします.' },
      ],
    },
    { id: 'victory', line: { jp: 'たのんだぞ、ゆうしゃよ。', en: 'I am counting on you, hero.' }, end: true },

    // ── Jailbreak branch ──
    {
      id: 'jail',
      jail: true,
      line: { jp: 'ぶれいものめ！ろうやへ つれて いけ！', en: 'Insolent fool! Take them to the dungeon!' },
      next: 'jail-1',
    },
    {
      id: 'jail-1',
      jail: true,
      speaker: 'jailer',
      line: { jp: 'ふん。王さまに 言うことは あるか？', en: 'Hmph. Anything to say to the King?' },
      kana: 'ふん。おうさまに いうことは あるか？',
      wordIds: ['sumimasen'],
      hint: 'Apologise! すみません / ごめんなさい / もうしわけありません.',
      next: 'jail-2',
      options: [
        { jp: 'すみません。', en: "I'm sorry.", correct: true, tone: 'polite', effects: { trust: 1 }, reply: { jp: 'ふむ。', en: 'Hmm.' } },
        { jp: 'ごめんなさい。', en: "I'm sorry.", correct: true, tone: 'polite', effects: { trust: 1 }, reply: { jp: 'ふむ。', en: 'Hmm.' }, note: 'Good! ごめんなさい is a heartfelt apology, but a bit personal for a king.' },
        { jp: 'しらない。', en: "Don't know, don't care.", correct: false, tone: 'rude', reply: { jp: 'では ずっと ここに いろ。', en: 'Then stay here forever.' }, note: 'Apologise: すみません or ごめんなさい.' },
        { jp: 'ありがとう。', en: 'Thanks.', correct: false, tone: 'casual', reply: { jp: 'ありがとう…？', en: 'Thanks…?' }, note: 'Wrong feeling! Apologise: すみません.' },
      ],
    },
    {
      id: 'jail-2',
      jail: true,
      speaker: 'jailer',
      line: { jp: 'もっと ていねいに！', en: 'More politely!' },
      hint: 'The most formal apology: もうしわけありませんでした.',
      next: 'jail-3',
      options: [
        { jp: 'もうしわけ ありませんでした。', en: 'I am deeply sorry.', correct: true, tone: 'polite', effects: { trust: 1 }, reply: { jp: 'よろしい。', en: 'Very well.' } },
        { jp: 'ごめんね。', en: 'Sorry~', correct: false, tone: 'casual', reply: { jp: 'ていねいに、と 言っただろう！', en: 'I said politely!' }, note: 'ごめんね is casual. The most formal apology is もうしわけありませんでした.' },
        { jp: 'わるかった。', en: 'My bad.', correct: false, tone: 'casual', reply: { jp: 'だめだ。', en: 'Not good enough.' }, note: 'わるかった is casual. Say もうしわけありませんでした.' },
        { jp: 'うるさい。', en: 'Shut up.', correct: false, tone: 'rude', reply: { jp: 'なんだと！', en: 'What?!' }, note: 'Very rude! Say もうしわけありませんでした.' },
      ],
    },
    {
      id: 'jail-3',
      jail: true,
      speaker: 'jailer',
      onEnter: { setTrust: 2 },
      line: { jp: 'よし。王さまの ところへ もどれ。こんどは ていねいにな。', en: 'Fine. Go back to the King — politely this time.' },
      kana: 'よし。おうさまの ところへ もどれ。こんどは ていねいにな。',
      next: '$resume',
    },
  ]),
}

export const SCENARIOS: Scenario[] = [VILLAGE_SHOP, BRIDGE_GUARD, SHRINE_PRIEST, TOWER_KING, ...PACK_DATA.flatMap((d) => d.scenarios ?? [])]
export const SCENARIO_BY_ID = new Map(SCENARIOS.map((s) => [s.id, s]))

import { toRomaji } from 'wanakana'
import { atOrBefore } from './journey'
import { PACK_DATA } from '../regions/data'

export type PartOfSpeech = 'noun' | 'verb' | 'i-adj' | 'na-adj' | 'expression' | 'pronoun' | 'number' | 'adverb'
export type Element = 'fire' | 'water' | 'wood' | 'earth' | 'metal' | 'light' | 'wind' | 'none'

export interface Word {
  id: string
  /** Written form (kanji where common, otherwise kana). */
  jp: string
  /** Reading in kana. */
  kana: string
  romaji: string
  /** Primary English meaning. */
  en: string
  /** Other accepted English answers. */
  alt?: string[]
  pos: PartOfSpeech
  /** Region (id, see ./journey) in which the word is introduced. */
  region: number
  emoji: string
  element?: Element
  /** Verb dictionary form & polite form, adjective data, etc. */
  masu?: string
}

type Row = [id: string, jp: string, kana: string, en: string, pos: PartOfSpeech, emoji: string, extra?: Partial<Word>]

// Region 1 – The Village of First Words: 30 foundational words.
const R1: Row[] = [
  ['hi', '火', 'ひ', 'fire', 'noun', '🔥', { element: 'fire', alt: ['flame'] }],
  ['mizu', '水', 'みず', 'water', 'noun', '💧', { element: 'water' }],
  ['ki', '木', 'き', 'tree', 'noun', '🌳', { element: 'wood', alt: ['wood'] }],
  ['inu', '犬', 'いぬ', 'dog', 'noun', '🐕'],
  ['neko', '猫', 'ねこ', 'cat', 'noun', '🐈'],
  ['tori', '鳥', 'とり', 'bird', 'noun', '🐦', { element: 'wind' }],
  ['sakana', '魚', 'さかな', 'fish', 'noun', '🐟', { element: 'water' }],
  ['hana', '花', 'はな', 'flower', 'noun', '🌸', { element: 'wood' }],
  ['yama', '山', 'やま', 'mountain', 'noun', '⛰️', { element: 'earth' }],
  ['kawa', '川', 'かわ', 'river', 'noun', '🏞️', { element: 'water' }],
  ['sora', '空', 'そら', 'sky', 'noun', '🌤️', { element: 'wind' }],
  ['ame', '雨', 'あめ', 'rain', 'noun', '🌧️', { element: 'water' }],
  ['kaze', '風', 'かぜ', 'wind', 'noun', '🌬️', { element: 'wind' }],
  ['tsuki', '月', 'つき', 'moon', 'noun', '🌙', { element: 'light' }],
  ['hoshi', '星', 'ほし', 'star', 'noun', '⭐', { element: 'light' }],
  ['hito', '人', 'ひと', 'person', 'noun', '🧑', { alt: ['people', 'human'] }],
  ['me', '目', 'め', 'eye', 'noun', '👁️'],
  ['te', '手', 'て', 'hand', 'noun', '✋'],
  ['kuchi', '口', 'くち', 'mouth', 'noun', '👄'],
  ['ie', '家', 'いえ', 'house', 'noun', '🏠', { alt: ['home'] }],
  ['michi', '道', 'みち', 'road', 'noun', '🛤️', { alt: ['path', 'way'] }],
  ['hon', '本', 'ほん', 'book', 'noun', '📖'],
  ['kasa', '傘', 'かさ', 'umbrella', 'noun', '☂️'],
  ['kagi', '鍵', 'かぎ', 'key', 'noun', '🗝️', { element: 'metal' }],
  ['ringo', 'りんご', 'りんご', 'apple', 'noun', '🍎'],
  ['sushi', 'すし', 'すし', 'sushi', 'noun', '🍣'],
  ['ocha', 'お茶', 'おちゃ', 'tea', 'noun', '🍵', { alt: ['green tea'] }],
  ['gohan', 'ご飯', 'ごはん', 'rice', 'noun', '🍚', { alt: ['meal', 'cooked rice'] }],
  ['watashi', '私', 'わたし', 'I', 'pronoun', '🙋', { alt: ['me', 'myself'] }],
  ['konnichiwa', 'こんにちは', 'こんにちは', 'hello', 'expression', '👋', { alt: ['good afternoon', 'hi'] }],
]

// Region 2 – The Elemental Fields: kanji roots and nature.
const R2: Row[] = [
  ['tsuchi', '土', 'つち', 'earth', 'noun', '🟫', { element: 'earth', alt: ['soil', 'ground', 'dirt'] }],
  ['ishi', '石', 'いし', 'stone', 'noun', '🪨', { element: 'earth', alt: ['rock'] }],
  ['kin', '金', 'きん', 'gold', 'noun', '🪙', { element: 'metal', alt: ['metal', 'money'] }],
  ['hi-sun', '日', 'ひ', 'sun', 'noun', '☀️', { element: 'light', alt: ['day'] }],
  ['hayashi', '林', 'はやし', 'grove', 'noun', '🌲', { element: 'wood', alt: ['woods', 'small forest'] }],
  ['mori', '森', 'もり', 'forest', 'noun', '🌲', { element: 'wood' }],
  ['ta', '田', 'た', 'rice field', 'noun', '🌾', { element: 'earth', alt: ['paddy', 'field'] }],
  ['umi', '海', 'うみ', 'sea', 'noun', '🌊', { element: 'water', alt: ['ocean'] }],
  ['yuki', '雪', 'ゆき', 'snow', 'noun', '❄️', { element: 'water' }],
  ['kumo', '雲', 'くも', 'cloud', 'noun', '☁️', { element: 'wind' }],
  ['hikari', '光', 'ひかり', 'light', 'noun', '✨', { element: 'light' }],
  ['honoo', '炎', 'ほのお', 'flame', 'noun', '🔥', { element: 'fire', alt: ['blaze', 'inferno'] }],
  ['iwa', '岩', 'いわ', 'boulder', 'noun', '🪨', { element: 'earth', alt: ['crag', 'large rock'] }],
  ['izumi', '泉', 'いずみ', 'spring', 'noun', '⛲', { element: 'water', alt: ['fountain', 'water spring'] }],
  ['hatake', '畑', 'はたけ', 'farm field', 'noun', '🌱', { element: 'earth', alt: ['field', 'crop field'] }],
  ['kusa', '草', 'くさ', 'grass', 'noun', '🌿', { element: 'wood' }],
  ['ta-rice', '米', 'こめ', 'uncooked rice', 'noun', '🌾', { alt: ['rice grain'] }],
  ['otoko', '男', 'おとこ', 'man', 'noun', '👨', { alt: ['male'] }],
  ['onna', '女', 'おんな', 'woman', 'noun', '👩', { alt: ['female'] }],
  ['ko', '子', 'こ', 'child', 'noun', '🧒', { alt: ['kid'] }],
  ['chikara', '力', 'ちから', 'power', 'noun', '💪', { alt: ['strength', 'force'] }],
  ['oo', '大きい', 'おおきい', 'big', 'i-adj', '🐘', { alt: ['large'] }],
  ['chii', '小さい', 'ちいさい', 'small', 'i-adj', '🐭', { alt: ['little', 'tiny'] }],
  ['ue', '上', 'うえ', 'above', 'noun', '⬆️', { alt: ['up', 'top', 'on'] }],
  ['shita', '下', 'した', 'below', 'noun', '⬇️', { alt: ['down', 'under', 'bottom'] }],
  ['naka', '中', 'なか', 'inside', 'noun', '🎯', { alt: ['middle', 'in', 'center'] }],
  ['ichi', '一', 'いち', 'one', 'number', '1️⃣'],
  ['ni', '二', 'に', 'two', 'number', '2️⃣'],
  ['san', '三', 'さん', 'three', 'number', '3️⃣'],
  ['yasumi', '休み', 'やすみ', 'rest', 'noun', '😴', { alt: ['holiday', 'break', 'day off'] }],
]

// Region 3 – The Forest of Sentences: verbs and particles-in-action.
const R3: Row[] = [
  ['taberu', '食べる', 'たべる', 'eat', 'verb', '🍽️', { masu: '食べます', alt: ['to eat'] }],
  ['nomu', '飲む', 'のむ', 'drink', 'verb', '🥤', { masu: '飲みます', alt: ['to drink'] }],
  ['miru', '見る', 'みる', 'see', 'verb', '👀', { masu: '見ます', alt: ['look', 'watch', 'to see'] }],
  ['iku', '行く', 'いく', 'go', 'verb', '🚶', { masu: '行きます', alt: ['to go'] }],
  ['kuru', '来る', 'くる', 'come', 'verb', '🏃', { masu: '来ます', alt: ['to come'] }],
  ['yomu', '読む', 'よむ', 'read', 'verb', '📚', { masu: '読みます', alt: ['to read'] }],
  ['kaku', '書く', 'かく', 'write', 'verb', '✍️', { masu: '書きます', alt: ['to write', 'draw'] }],
  ['hanasu', '話す', 'はなす', 'speak', 'verb', '🗣️', { masu: '話します', alt: ['talk', 'to speak'] }],
  ['kiku', '聞く', 'きく', 'listen', 'verb', '👂', { masu: '聞きます', alt: ['hear', 'ask', 'to listen'] }],
  ['kau', '買う', 'かう', 'buy', 'verb', '🛒', { masu: '買います', alt: ['to buy'] }],
  ['tsukau', '使う', 'つかう', 'use', 'verb', '🪄', { masu: '使います', alt: ['to use'] }],
  ['wataru', '渡る', 'わたる', 'cross', 'verb', '🌉', { masu: '渡ります', alt: ['to cross'] }],
  ['suru', 'する', 'する', 'do', 'verb', '⚙️', { masu: 'します', alt: ['to do'] }],
  ['aru', 'ある', 'ある', 'exist (things)', 'verb', '📦', { masu: 'あります', alt: ['there is', 'be', 'exist'] }],
  ['iru', 'いる', 'いる', 'exist (living)', 'verb', '🐾', { masu: 'います', alt: ['there is', 'be', 'exist'] }],
  ['neru', '寝る', 'ねる', 'sleep', 'verb', '🛌', { masu: '寝ます', alt: ['to sleep'] }],
  ['okiru', '起きる', 'おきる', 'wake up', 'verb', '⏰', { masu: '起きます', alt: ['get up', 'to wake up'] }],
  ['kaeru', '帰る', 'かえる', 'return home', 'verb', '🏡', { masu: '帰ります', alt: ['go home', 'return'] }],
  ['matsu', '待つ', 'まつ', 'wait', 'verb', '⏳', { masu: '待ちます', alt: ['to wait'] }],
  ['tsukuru', '作る', 'つくる', 'make', 'verb', '🔨', { masu: '作ります', alt: ['create', 'build', 'to make'] }],
  ['hashi', '橋', 'はし', 'bridge', 'noun', '🌉', { element: 'wood' }],
  ['pan', 'パン', 'パン', 'bread', 'noun', '🍞'],
  ['gakkou', '学校', 'がっこう', 'school', 'noun', '🏫'],
  ['tomodachi', '友達', 'ともだち', 'friend', 'noun', '🧑‍🤝‍🧑'],
  ['sensei', '先生', 'せんせい', 'teacher', 'noun', '🧑‍🏫'],
  ['gakusei', '学生', 'がくせい', 'student', 'noun', '🎒'],
  ['mise', '店', 'みせ', 'shop', 'noun', '🏪', { alt: ['store'] }],
  ['eki', '駅', 'えき', 'station', 'noun', '🚉', { alt: ['train station'] }],
  ['kyou', '今日', 'きょう', 'today', 'noun', '📅'],
  ['ashita', '明日', 'あした', 'tomorrow', 'noun', '🌅'],
]

// Region 4 – The Shrine of Reading: descriptive words & everyday reading.
const R4: Row[] = [
  ['atsui', '熱い', 'あつい', 'hot', 'i-adj', '🌡️', { element: 'fire' }],
  ['tsumetai', '冷たい', 'つめたい', 'cold (to touch)', 'i-adj', '🧊', { element: 'water', alt: ['cold', 'chilly'] }],
  ['hayai', '速い', 'はやい', 'fast', 'i-adj', '⚡', { alt: ['quick'] }],
  ['osoi', '遅い', 'おそい', 'slow', 'i-adj', '🐢', { alt: ['late'] }],
  ['takai', '高い', 'たかい', 'tall', 'i-adj', '🗼', { alt: ['high', 'expensive'] }],
  ['nagai', '長い', 'ながい', 'long', 'i-adj', '📏'],
  ['tsuyoi', '強い', 'つよい', 'strong', 'i-adj', '🦁', { alt: ['powerful'] }],
  ['yowai', '弱い', 'よわい', 'weak', 'i-adj', '🥀'],
  ['akai', '赤い', 'あかい', 'red', 'i-adj', '🟥'],
  ['aoi', '青い', 'あおい', 'blue', 'i-adj', '🟦'],
  ['shiroi', '白い', 'しろい', 'white', 'i-adj', '⬜'],
  ['kuroi', '黒い', 'くろい', 'black', 'i-adj', '⬛'],
  ['atarashii', '新しい', 'あたらしい', 'new', 'i-adj', '🆕'],
  ['furui', '古い', 'ふるい', 'old', 'i-adj', '🏚️', { alt: ['ancient'] }],
  ['oishii', '美味しい', 'おいしい', 'delicious', 'i-adj', '😋', { alt: ['tasty'] }],
  ['kirei', 'きれい', 'きれい', 'beautiful', 'na-adj', '💎', { alt: ['pretty', 'clean'] }],
  ['shizuka', '静か', 'しずか', 'quiet', 'na-adj', '🤫', { alt: ['calm', 'silent'] }],
  ['genki', '元気', 'げんき', 'energetic', 'na-adj', '😄', { alt: ['healthy', 'lively', 'well'] }],
  ['suki', '好き', 'すき', 'liked', 'na-adj', '❤️', { alt: ['like', 'favorite', 'fond'] }],
  ['yuumei', '有名', 'ゆうめい', 'famous', 'na-adj', '🌟'],
  ['kantan', '簡単', 'かんたん', 'easy', 'na-adj', '👌', { alt: ['simple'] }],
  ['taisetsu', '大切', 'たいせつ', 'important', 'na-adj', '💝', { alt: ['precious', 'valuable'] }],
  ['jinja', '神社', 'じんじゃ', 'shrine', 'noun', '⛩️'],
  ['tera', '寺', 'てら', 'temple', 'noun', '🛕'],
  ['kami', '紙', 'かみ', 'paper', 'noun', '📜'],
  ['moji', '文字', 'もじ', 'letter', 'noun', '🔤', { alt: ['character', 'script'] }],
  ['kotoba', '言葉', 'ことば', 'word', 'noun', '💬', { alt: ['language', 'words'] }],
  ['namae', '名前', 'なまえ', 'name', 'noun', '🏷️'],
  ['toki', '時', 'とき', 'time', 'noun', '⌛', { alt: ['when', 'hour'] }],
  ['ima', '今', 'いま', 'now', 'noun', '⏱️'],
]

// Region 5 – The Tower of Creation: magic, combat and free expression.
const R5: Row[] = [
  ['mahou', '魔法', 'まほう', 'magic', 'noun', '🪄', { alt: ['spell', 'sorcery'] }],
  ['tate', '盾', 'たて', 'shield', 'noun', '🛡️', { element: 'metal' }],
  ['tsurugi', '剣', 'つるぎ', 'sword', 'noun', '🗡️', { element: 'metal', alt: ['blade'] }],
  ['ryuu', '竜', 'りゅう', 'dragon', 'noun', '🐉', { element: 'fire' }],
  ['oni', '鬼', 'おに', 'demon', 'noun', '👹', { alt: ['ogre', 'oni'] }],
  ['yuusha', '勇者', 'ゆうしゃ', 'hero', 'noun', '🦸', { alt: ['brave one'] }],
  ['tou', '塔', 'とう', 'tower', 'noun', '🗼'],
  ['shiro', '城', 'しろ', 'castle', 'noun', '🏯'],
  ['ou', '王', 'おう', 'king', 'noun', '🤴'],
  ['kage', '影', 'かげ', 'shadow', 'noun', '👤', { alt: ['shade'] }],
  ['yami', '闇', 'やみ', 'darkness', 'noun', '🌑', { alt: ['dark'] }],
  ['inochi', '命', 'いのち', 'life', 'noun', '💚', { alt: ['life force'] }],
  ['kokoro', '心', 'こころ', 'heart', 'noun', '💗', { alt: ['mind', 'spirit'] }],
  ['yume', '夢', 'ゆめ', 'dream', 'noun', '💭'],
  ['sekai', '世界', 'せかい', 'world', 'noun', '🌍'],
  ['tatakau', '戦う', 'たたかう', 'fight', 'verb', '⚔️', { masu: '戦います', alt: ['battle', 'to fight'] }],
  ['mamoru', '守る', 'まもる', 'protect', 'verb', '🛡️', { masu: '守ります', alt: ['defend', 'to protect'] }],
  ['kiru', '切る', 'きる', 'cut', 'verb', '✂️', { masu: '切ります', alt: ['slash', 'to cut'] }],
  ['moyasu', '燃やす', 'もやす', 'burn', 'verb', '🔥', { masu: '燃やします', element: 'fire', alt: ['to burn', 'ignite'] }],
  ['kesu', '消す', 'けす', 'extinguish', 'verb', '🧯', { masu: '消します', alt: ['erase', 'put out', 'turn off'] }],
  ['tobu', '飛ぶ', 'とぶ', 'fly', 'verb', '🕊️', { masu: '飛びます', element: 'wind', alt: ['to fly', 'jump'] }],
  ['nigeru', '逃げる', 'にげる', 'flee', 'verb', '💨', { masu: '逃げます', alt: ['run away', 'escape'] }],
  ['tasukeru', '助ける', 'たすける', 'help', 'verb', '🤝', { masu: '助けます', alt: ['save', 'rescue', 'to help'] }],
  ['hikaru', '光る', 'ひかる', 'shine', 'verb', '🌟', { masu: '光ります', element: 'light', alt: ['glow', 'to shine'] }],
  ['kowasu', '壊す', 'こわす', 'break', 'verb', '💥', { masu: '壊します', alt: ['destroy', 'to break'] }],
  ['kowai', '怖い', 'こわい', 'scary', 'i-adj', '😱', { alt: ['frightening', 'afraid'] }],
  ['abunai', '危ない', 'あぶない', 'dangerous', 'i-adj', '⚠️', { alt: ['watch out'] }],
  ['yasashii', '優しい', 'やさしい', 'kind', 'i-adj', '🤗', { alt: ['gentle'] }],
  ['arigatou', 'ありがとう', 'ありがとう', 'thank you', 'expression', '🙏', { alt: ['thanks'] }],
  ['sumimasen', 'すみません', 'すみません', 'excuse me', 'expression', '🙇', { alt: ['sorry', 'pardon'] }],
]

function build(rows: Row[], region: number): Word[] {
  return rows.map(([id, jp, kana, en, pos, emoji, extra]) => ({
    id,
    jp,
    kana,
    romaji: toRomaji(kana),
    en,
    pos,
    region,
    emoji,
    ...extra,
  }))
}

export const VOCAB: Word[] = [
  ...build(R1, 1),
  ...build(R2, 2),
  ...build(R3, 3),
  ...build(R4, 4),
  ...build(R5, 5),
  ...PACK_DATA.flatMap((d) => build(d.words, d.region.id)),
]

export const WORD_BY_ID = new Map(VOCAB.map((w) => [w.id, w]))

export function wordsForRegion(region: number, includeEarlier = true): Word[] {
  return VOCAB.filter((w) => (includeEarlier ? atOrBefore(w.region, region) : w.region === region))
}

export function getWord(id: string): Word {
  const w = WORD_BY_ID.get(id)
  if (!w) throw new Error(`Unknown word: ${id}`)
  return w
}

/** Normalise an English guess for lenient comparison. */
export function normaliseEn(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/^(to|a|an|the)\s+/, '')
    .replace(/[^a-z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchesEnglish(word: Word, guess: string): boolean {
  const g = normaliseEn(guess)
  if (!g) return false
  return [word.en, ...(word.alt ?? [])].some((a) => normaliseEn(a) === g)
}

/**
 * Grammar and script rules as learnable items (SRS ids `g:<id>`), so they
 * can be placed in the memory palace and reviewed like words. Each region
 * teaches its own: kana rules in the Village and Fields, particles and verb
 * forms in the Forest, adjectives at the Shrine, polite speech in the Tower.
 */
import { PACK_DATA } from '../regions/data'

export interface GrammarPoint {
  id: string
  region: number
  /** The pattern as written. */
  jp: string
  /** How to say it (romaji), when that isn't obvious. */
  say?: string
  /** What it does, in a few words. */
  en: string
  example: { jp: string; en: string }
}

const CORE: GrammarPoint[] = [
  // Region 1: reading and asking
  { id: 'dakuten', region: 1, jp: '゛', say: 'ten-ten', en: 'voices a kana: か→が, さ→ざ, た→だ, は→ば', example: { jp: 'かき → かぎ', en: 'persimmon → key' } },
  { id: 'handakuten', region: 1, jp: '゜', say: 'maru', en: 'turns は-row into p: は→ぱ', example: { jp: 'ぱん', en: 'bread' } },
  { id: 'small-tsu', region: 1, jp: 'っ', say: 'small tsu', en: 'doubles the next consonant (a tiny pause)', example: { jp: 'きって', en: 'stamp (kitte)' } },
  { id: 'youon', region: 1, jp: 'ゃ・ゅ・ょ', say: 'small ya / yu / yo', en: 'blends with the kana before: き+ゃ = きゃ (kya)', example: { jp: 'おちゃ', en: 'tea (ocha)' } },
  { id: 'kudasai', region: 1, jp: '〜を ください', say: 'o kudasai', en: 'please give me ~', example: { jp: 'みずを ください。', en: 'Water, please.' } },
  // Region 2: katakana rules and numbers
  { id: 'chouon', region: 2, jp: 'ー', say: 'long vowel bar', en: 'stretches the vowel in katakana', example: { jp: 'ケーキ', en: 'cake (kēki)' } },
  { id: 'counting', region: 2, jp: '一・二・三', say: 'ichi, ni, san', en: 'kanji numbers: lines you can count', example: { jp: '木が 三ぼん', en: 'three trees' } },
  // Region 3: particles and sentence order
  { id: 'wa', region: 3, jp: 'は', say: 'wa', en: 'topic marker: “as for ~”', example: { jp: 'わたしは まほうつかいです。', en: 'I am a mage.' } },
  { id: 'ga', region: 3, jp: 'が', say: 'ga', en: 'subject marker: who/what does it', example: { jp: 'とりが とぶ。', en: 'A bird flies.' } },
  { id: 'wo', region: 3, jp: 'を', say: 'o', en: 'object marker: the thing acted on', example: { jp: 'みずを のむ。', en: 'I drink water.' } },
  { id: 'ni', region: 3, jp: 'に', say: 'ni', en: 'to / at / in (where it goes, where it is, when)', example: { jp: 'もりに いく。', en: 'I go to the forest.' } },
  { id: 'de', region: 3, jp: 'で', say: 'de', en: 'at (where an action happens) / by means of', example: { jp: 'もりで よむ。', en: 'I read in the forest.' } },
  { id: 'he', region: 3, jp: 'へ', say: 'e', en: 'towards (direction)', example: { jp: 'やまへ いく。', en: 'I head toward the mountain.' } },
  { id: 'no', region: 3, jp: 'の', say: 'no', en: 'of / ’s (belonging)', example: { jp: 'ねこの ほん', en: 'the cat’s book' } },
  { id: 'to', region: 3, jp: 'と', say: 'to', en: 'and / with', example: { jp: 'いぬと ねこ', en: 'a dog and a cat' } },
  { id: 'mo', region: 3, jp: 'も', say: 'mo', en: 'also / too', example: { jp: 'わたしも いく。', en: 'I’m going too.' } },
  { id: 'ka', region: 3, jp: 'か', say: 'ka', en: 'turns a sentence into a question', example: { jp: 'げんきですか。', en: 'Are you well?' } },
  { id: 'verb-last', region: 3, jp: '〜を〜ます', say: 'verb last', en: 'word order: the verb comes at the end', example: { jp: 'わたしは パンを たべます。', en: 'I eat bread.' } },
  { id: 'masu', region: 3, jp: '〜ます', say: 'masu', en: 'polite verb ending', example: { jp: 'よみます', en: 'I read (polite)' } },
  { id: 'masen', region: 3, jp: '〜ません', say: 'masen', en: 'polite “don’t”', example: { jp: 'のみません', en: 'I don’t drink' } },
  // Region 4: describing words
  { id: 'i-adj', region: 4, jp: '〜い', say: 'i-adjective', en: 'describing word ending in い, goes before the noun', example: { jp: 'あかい はな', en: 'a red flower' } },
  { id: 'kunai', region: 4, jp: '〜くない', say: 'kunai', en: 'not ~ (い→くない)', example: { jp: 'さむくない', en: 'not cold' } },
  { id: 'katta', region: 4, jp: '〜かった', say: 'katta', en: 'was ~ (い→かった)', example: { jp: 'たのしかった', en: 'it was fun' } },
  { id: 'na-adj', region: 4, jp: '〜な', say: 'na-adjective', en: 'な-word + な + noun', example: { jp: 'しずかな もり', en: 'a quiet forest' } },
  { id: 'janai', region: 4, jp: '〜じゃない', say: 'janai', en: 'not ~ (for な-words and nouns)', example: { jp: 'しずかじゃない', en: 'not quiet' } },
  // Region 5: polite speech
  { id: 'desu', region: 5, jp: '〜です', say: 'desu', en: 'is / am / are (polite)', example: { jp: 'これは つるぎです。', en: 'This is a sword.' } },
  { id: 'dewa-arimasen', region: 5, jp: '〜ではありません', say: 'dewa arimasen', en: 'is not (polite)', example: { jp: 'ドラゴンではありません。', en: 'It isn’t a dragon.' } },
  { id: 'mashita', region: 5, jp: '〜ました', say: 'mashita', en: 'did (polite past)', example: { jp: 'たたかいました', en: 'I fought' } },
  { id: 'masendeshita', region: 5, jp: '〜ませんでした', say: 'masen deshita', en: 'didn’t (polite past negative)', example: { jp: 'にげませんでした', en: 'I didn’t run away' } },
  { id: 'mashou', region: 5, jp: '〜ましょう', say: 'mashō', en: 'let’s ~', example: { jp: 'いきましょう！', en: 'Let’s go!' } },
  { id: 'te-kudasai', region: 5, jp: '〜てください', say: 'te kudasai', en: 'please do ~', example: { jp: 'まってください。', en: 'Please wait.' } },
  { id: 'tai', region: 5, jp: '〜たい', say: 'tai', en: 'want to ~', example: { jp: 'まもりたい', en: 'I want to protect' } },
]

/** Every grammar point: the core regions', then each region pack's. */
export const GRAMMAR: GrammarPoint[] = [...CORE, ...PACK_DATA.flatMap((d) => d.grammar)]
export const GRAMMAR_BY_ID = new Map(GRAMMAR.map((g) => [g.id, g]))

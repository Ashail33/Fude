import { atOrBefore } from '../../data/journey'
import { VOCAB } from '../../data/vocab'
import type { Activity } from '../types'
import { PACK as DATA } from './data'

const R = 9
const words = (from = 0, to?: number) => DATA.words.slice(from, to).map((w) => w[0])
const upTo = () => VOCAB.filter((w) => atOrBefore(w.region, R)).map((w) => w.id)
const sentences = DATA.sentences.map((s) => s.id)
const runes = DATA.runes.map((r) => r.id)
const KANJI = (DATA.kanji ?? []).map((k) => k.char)
/** Words written with at least one kanji (for listening: hear it, pick the kanji). */
const kanjiWords = DATA.words.filter((w) => /[一-龯]/.test(w[1])).map((w) => w[0])

export const ACTIVITIES: Activity[] = [
  { id: 'r9-words-1', region: R, stage: 'learn', game: 'lesson', title: 'Four Seasons, Four Winds', jp: 'しきと しほう', description: 'Spring, summer, autumn, winter; north, south, east, west; and the snow.', params: { wordIds: words(0, 15) } },
  { id: 'r9-trace-1', region: R, stage: 'learn', game: 'arcana', title: 'Brush of the Seasons', jp: 'きせつの ふで', description: 'Trace 春夏秋冬, the four directions, and the snow and temple kanji.', params: { chars: ['春', '夏', '秋', '冬', '東', '西', '南', '北', '雪', '寺', '朝', '夜', '夕'], mode: 'trace', count: 8 } },
  { id: 'r9-words-2', region: R, stage: 'learn', game: 'lesson', title: 'Family and Temple Folk', jp: 'かぞくと てらの ひと', description: 'My father, your father; brothers, sisters, apprentices and monks.', params: { wordIds: words(15, 30) } },
  { id: 'r9-trace-2', region: R, stage: 'learn', game: 'arcana', title: 'The Brush Mound', jp: 'ふでづか', description: 'Trace the family kanji and the kanji of years and hours.', params: { chars: ['父', '母', '兄', '弟', '姉', '妹', '年', '週', '午', '前', '後', '毎', '方'], mode: 'trace', count: 8 } },
  { id: 'r9-talk', region: R, stage: 'practice', game: 'dialogue', title: 'The Guest Register', jp: 'さんけいしゃの ちょうめん', description: 'Kuu writes you into the temple register: where from, what season, which family words.', params: { scenarioId: 'snowtemple-register' } },
  { id: 'r9-words-3', region: R, stage: 'practice', game: 'lesson', title: 'Years and Weeks', jp: 'としと しゅう', description: 'This year, last year, next year; this week, every week; a.m. and p.m.', params: { wordIds: words(30, 45) } },
  { id: 'r9-listen', region: R, stage: 'practice', game: 'listening', title: 'Echoes of the Great Bell', jp: 'かねの こだま', description: 'The bell’s echo carries words. Hear each one and pick how it is written in kanji.', params: { wordIds: kanjiWords, rounds: 12 } },
  { id: 'r9-words-4', region: R, stage: 'practice', game: 'lesson', title: 'The Scriptorium', jp: 'しゃきょうの へや', description: 'Kanji, study, practice, calligraphy, sutras and the two kinds of reading.', params: { wordIds: words(45) } },
  { id: 'r9-trace-3', region: R, stage: 'practice', game: 'arcana', title: 'Copying the Verbs', jp: 'どうしの しゃきょう', description: 'Trace the kanji inside see, go, come, eat, drink, write, talk, read, buy and make, then the kanji of study.', params: { chars: ['見', '行', '来', '食', '飲', '書', '話', '読', '買', '作', '学', '校', '字', '漢', '語', '文', '名', '習', '勉', '強', '道'], mode: 'trace', count: 10 } },
  { id: 'r9-forge', region: R, stage: 'practice', game: 'forge', title: 'Sutra Copying Table', jp: 'しゃきょうの つくえ', description: 'Forge sentences with time words, family words and the kanji you have traced.', params: { sentenceIds: sentences, distractors: false, timed: false } },
  { id: 'r9-defense', region: R, stage: 'practice', game: 'spell-defense', title: 'Snowball Fight', jp: 'ゆきがっせん', description: 'The temple kids are pelting you with snowballs. Name each word before it hits!', params: { wordIds: words(), difficulty: 2, goal: 16 } },
  { id: 'r9-trace-4', region: R, stage: 'practice', game: 'arcana', title: 'Writing on Ice', jp: 'こおりに かく', description: 'Scratch the last kanji into the frozen lake: friends, sounds, colours, songs and paper.', params: { chars: ['友', '新', '音', '長', '高', '早', '何', '歌', '紙', '赤', '青', '黒', '色'], mode: 'trace', count: 8 } },
  { id: 'r9-speed', region: R, stage: 'challenge', game: 'speedcast', title: 'Ice-Hole Fishing', jp: 'あなづり', description: 'Words bite fast through the ice. Read each one and reel in its meaning.', params: { wordIds: words(), direction: 'jp-en', durationSec: 60 } },
  { id: 'r9-runes', region: R, stage: 'challenge', game: 'runes', title: 'Lakeside Steles', jp: 'みずうみの いしぶみ', description: 'Old stones by the lake, carved in kanji compounds. Read what they say.', params: { runeIds: runes, showReading: true } },
  { id: 'r9-cross', region: R, stage: 'challenge', game: 'crossword', title: 'The Snow Giant’s Crossword', jp: 'ゆきの きょじんの クロスワード', description: 'A crossword packed in snow. Some answers must be written in kanji.', params: { wordIds: upTo(), answer: 'mixed', size: 11 } },
  { id: 'r9-recall', region: R, stage: 'challenge', game: 'arcana', title: 'The Frozen Wall', jp: 'こおりの かべ', description: 'Kanji are trapped in the ice wall. Write them from memory, with only a meaning to go on.', params: { chars: KANJI, mode: 'recall', count: 10 } },
  { id: 'r9-boss', region: R, stage: 'boss', game: 'boss-yukionna', title: 'Yuki-onna, the Snow Woman', jp: 'ゆきおんな', description: 'She froze every character in the temple. Thaw her compounds, see through her blizzard, keep the warmth alive.', params: {} },
  { id: 'r9-mastery', region: R, stage: 'mastery', game: 'forge', title: 'Snowbound Mastery Trial', jp: 'ゆきの てらの しれん', description: 'Every temple sentence, with decoys, before the candle burns down.', params: { sentenceIds: sentences, distractors: true, timed: true } },
  { id: 'r9-mastery-2', region: R, stage: 'mastery', game: 'runes', title: 'The Ice Mirror', jp: 'こおりの かがみ', description: 'The mirror shows kanji with no readings at all. Read them anyway.', params: { runeIds: runes, showReading: false } },
]

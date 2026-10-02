import { atOrBefore } from '../../data/journey'
import { VOCAB } from '../../data/vocab'
import type { Activity } from '../types'
import { DATA } from './data'

const R = 7
const words = (from = 0, to?: number) => DATA.words.slice(from, to).map((w) => w[0])
const upTo = () => VOCAB.filter((w) => atOrBefore(w.region, R)).map((w) => w.id)
const sentences = DATA.sentences.map((s) => s.id)
const runes = DATA.runes.map((r) => r.id)
/** The verbs met so far, for the listening and defence drills. */
const verbs = () => VOCAB.filter((w) => w.pos === 'verb' && atOrBefore(w.region, R)).map((w) => w.id)

export const ACTIVITIES: Activity[] = [
  { id: 'r7-words-1', region: R, stage: 'learn', game: 'lesson', title: 'The Inn and the Bath', jp: 'やどと おふろ', description: 'Hot spring, inn, futon, yukata, soap: the words of a night at a ryokan.', params: { wordIds: words(0, 15) } },
  { id: 'r7-trace', region: R, stage: 'learn', game: 'arcana', title: 'The Guestbook Brush', jp: 'やどちょうの ふで', description: 'Sign the guestbook: trace 湯, 足, 体, 竹, 歩, 入, 立, 着 and more.', params: { chars: ['湯', '足', '体', '竹', '歩', '入', '休', '立', '着', '先', '週', '後', '泉', '旅', '館', '屋'], mode: 'trace', count: 8 } },
  { id: 'r7-words-2', region: R, stage: 'learn', game: 'lesson', title: 'Verbs of the Bath', jp: 'おふろの うごく ことば', description: 'Walk, go in, wash, rest, swim, take off, put on: the verbs whose て-forms you will need.', params: { wordIds: words(15, 30) } },
  { id: 'r7-checkin', region: R, stage: 'practice', game: 'dialogue', title: 'Checking In', jp: 'やどに とまる', description: 'Haruko the proprietress welcomes you. Ask permission, say what you did, and learn the bath rules.', params: { scenarioId: 'onsen-checkin' } },
  { id: 'r7-forge-1', region: R, stage: 'practice', game: 'forge', title: 'The Egg Cauldron', jp: 'たまごの かま', description: 'Simmer sentences with the て-form: after doing, may I, must not, is doing.', params: { sentenceIds: sentences.slice(0, 8), distractors: false, timed: false } },
  { id: 'r7-words-3', region: R, stage: 'practice', game: 'lesson', title: 'Mountain and Body', jp: 'やまと からだ', description: 'Saru the snow monkey teaches head, shoulders and back, then bamboo, falls and the steam itself.', params: { wordIds: words(30, 45) } },
  { id: 'r7-listen', region: R, stage: 'practice', game: 'listening', title: 'Voices in the Steam', jp: 'ゆげの こえ', description: 'Ring the spring god’s bell. Catch the words that come back through the steam.', params: { wordIds: [...words(0, 45)], rounds: 12 } },
  { id: 'r7-words-4', region: R, stage: 'practice', game: 'lesson', title: 'Yesterday’s Steam', jp: 'きのうの ゆげ', description: 'Warm, feels good, sleepy, slowly, together; yesterday, last week, for the first time.', params: { wordIds: words(45) } },
  { id: 'r7-forge-2', region: R, stage: 'practice', game: 'forge', title: 'Hot-Spring Eggs', jp: 'おんせん たまご', description: 'Every Hollow sentence, now with cracked eggs: wrong て-forms hide among the tiles.', params: { sentenceIds: sentences, distractors: true, timed: false } },
  { id: 'r7-bathkeeper', region: R, stage: 'challenge', game: 'dialogue', title: 'Jiro’s Bath Quiz', jp: 'じろうの クイズ', description: 'The bath-house boy talks casually: did, didn’t, is doing, must not. Pass his quiz to get in.', params: { scenarioId: 'onsen-bathkeeper' } },
  { id: 'r7-runes', region: R, stage: 'challenge', game: 'runes', title: 'Notices of the Bath-House', jp: 'ゆやの はりがみ', description: 'Read the bath rules and the guests’ notes: may, must not, have done, didn’t.', params: { runeIds: runes, showReading: true } },
  { id: 'r7-cross', region: R, stage: 'challenge', game: 'crossword', title: 'The Travellers’ Stone', jp: 'たびびとの いしぶみ', description: 'A crossword carved by travellers, from everything you have learned so far.', params: { wordIds: upTo(), answer: 'mixed', size: 11 } },
  { id: 'r7-defense', region: R, stage: 'challenge', game: 'spell-defense', title: 'The Sickle Wind', jp: 'かまいたちの かぜ', description: 'Kamaitachi slash through the bamboo. Name every verb before it cuts you.', params: { wordIds: verbs(), difficulty: 2, goal: 16 } },
  { id: 'r7-combat', region: R, stage: 'challenge', game: 'combat', title: 'The Mountain Monk’s Drill', jp: 'やまぶしの けいこ', description: 'Type your incantations against the creatures of the bamboo trail.', params: { enemyIds: ['kamaitachi', 'tengu', 'kitsune'], input: 'type' } },
  { id: 'r7-boss', region: R, stage: 'boss', game: 'boss-yamanba', title: 'The Knotting Yamanba', jp: 'もつれの やまんば', description: 'The mountain hag tied the Hollow’s verbs in knots and ate its yesterdays. Untie them.', params: {} },
  { id: 'r7-mastery', region: R, stage: 'mastery', game: 'forge', title: 'Trial of the Hollow', jp: 'ゆのさとの しれん', description: 'Every Hollow sentence, with decoys, before the steam clears.', params: { sentenceIds: sentences, distractors: true, timed: true } },
  { id: 'r7-mastery-2', region: R, stage: 'mastery', game: 'runes', title: 'The Cave Wall', jp: 'いわやの かべ', description: 'The old bath laws carved in the Yamanba’s cave. No readings this time.', params: { runeIds: runes, showReading: false } },
]

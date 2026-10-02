import { atOrBefore } from '../../data/journey'
import { VOCAB } from '../../data/vocab'
import type { Activity } from '../types'
import { PACK as DATA } from './data'

const R = 6
const words = (from = 0, to?: number) => DATA.words.slice(from, to).map((w) => w[0])
const upTo = () => VOCAB.filter((w) => atOrBefore(w.region, R)).map((w) => w.id)
const sentences = DATA.sentences.map((s) => s.id)
const runes = DATA.runes.map((r) => r.id)

export const ACTIVITIES: Activity[] = [
  { id: 'r6-words-1', region: R, stage: 'learn', game: 'lesson', title: 'Counting the Catch', jp: 'かずを かぞえる', description: 'Four to ten thousand, yen, and “how many / how much?”', params: { wordIds: words(0, 15) } },
  { id: 'r6-trace', region: R, stage: 'learn', game: 'arcana', title: 'Brush of Numbers', jp: 'かずの ふで', description: 'Trace the number kanji 四 to 十, then 百, 千, 万 and 円.', params: { chars: ['四', '五', '六', '七', '八', '九', '十', '百', '千', '万', '円'], mode: 'trace', count: 8 } },
  { id: 'r6-words-2', region: R, stage: 'learn', game: 'lesson', title: 'Words of the Harbour', jp: 'みなとの ことば', description: 'Ships, crabs, waves, islands — and counting things with つ.', params: { wordIds: words(15, 30) } },
  { id: 'r6-shop', region: R, stage: 'practice', game: 'dialogue', title: 'Ume’s Fish Stall', jp: 'さかなやの ウメ', description: 'Buy fish with the right counter, pay, and count your change.', params: { scenarioId: 'harbour-fishmonger' } },
  { id: 'r6-words-3', region: R, stage: 'practice', game: 'lesson', title: 'Time and Tide', jp: 'ときと しお', description: 'O’clock, half past, morning and night, the seven days.', params: { wordIds: words(30, 45) } },
  { id: 'r6-listen', region: R, stage: 'practice', game: 'listening', title: 'The Fish Auction', jp: 'せりの こえ', description: 'The auctioneer calls numbers, prices and times. Catch what you hear.', params: { wordIds: [...words(0, 15), ...words(30, 45)], rounds: 12 } },
  { id: 'r6-forge', region: R, stage: 'practice', game: 'forge', title: 'Rope and Anchor', jp: 'つなと いかり', description: 'Forge sentences with numbers and counters in the right place.', params: { sentenceIds: sentences, distractors: false, timed: false } },
  { id: 'r6-words-4', region: R, stage: 'practice', game: 'lesson', title: 'Haggling', jp: 'ねぎり', description: 'Cheap, sell, pay, count — and this, that, that over there.', params: { wordIds: words(45) } },
  { id: 'r6-runes', region: R, stage: 'challenge', game: 'runes', title: 'Harbour Notices', jp: 'みなとの はりがみ', description: 'Read the notices on the harbour board: prices, times, ships.', params: { runeIds: runes, showReading: true } },
  { id: 'r6-cross', region: R, stage: 'challenge', game: 'crossword', title: 'Fishing-Net Crossword', jp: 'あみの クロスワード', description: 'A crossword knotted from everything so far.', params: { wordIds: upTo(), answer: 'mixed', size: 11 } },
  { id: 'r6-defense', region: R, stage: 'challenge', game: 'spell-defense', title: 'Gull Storm', jp: 'かもめの あらし', description: 'Gulls dive at the catch. Name each one in time!', params: { wordIds: words(), difficulty: 2, goal: 16 } },
  { id: 'r6-boss', region: R, stage: 'boss', game: 'boss-umibozu', title: 'The Counting Umibōzu', jp: 'かぞえる うみぼうず', description: 'A sea giant swallowed the harbour’s numbers. Count back what it took.', params: {} },
  { id: 'r6-mastery', region: R, stage: 'mastery', game: 'forge', title: 'Harbour Mastery Trial', jp: 'みなとの しれん', description: 'Every harbour sentence, with decoys, against the tide clock.', params: { sentenceIds: sentences, distractors: true, timed: true } },
]

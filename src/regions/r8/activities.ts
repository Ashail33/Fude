import { atOrBefore } from '../../data/journey'
import { VOCAB } from '../../data/vocab'
import type { Activity } from '../types'
import { DATA as D } from './data'

const R = 8
const DATA = D!
const words = (from = 0, to?: number) => DATA.words.slice(from, to).map((w) => w[0])
const upTo = () => VOCAB.filter((w) => atOrBefore(w.region, R)).map((w) => w.id)
const sentences = DATA.sentences.map((s) => s.id)
const runes = DATA.runes.map((r) => r.id)

export const ACTIVITIES: Activity[] = [
  // ── learn
  { id: 'r8-words-1', region: R, stage: 'learn', game: 'lesson', title: 'Which Way?', jp: 'どっちの みち？', description: 'Right, left, straight on, the corner — and here, there, over there, where.', params: { wordIds: words(0, 15) } },
  { id: 'r8-trace', region: R, stage: 'learn', game: 'arcana', title: 'The Sign Painter’s Brush', jp: 'かんばんの ふで', description: 'Paint the kanji on the town’s signs: 右, 左, 前, 後, 町, 店, 茶, 通.', params: { chars: ['右', '左', '前', '後', '町', '店', '茶', '通'], mode: 'trace', count: 8 } },
  { id: 'r8-words-2', region: R, stage: 'learn', game: 'lesson', title: 'Shop Talk', jp: 'みせの ことば', description: 'This one, that one, which one — and how a shop says welcome.', params: { wordIds: words(15, 30) } },
  // ── practice
  { id: 'r8-directions', region: R, stage: 'practice', game: 'dialogue', title: 'Lost on Main Street', jp: 'みちあんない', description: 'A traveller is lost. Tell her the way: straight on, left, next to, behind.', params: { scenarioId: 'castletown-directions' } },
  { id: 'r8-teahouse', region: R, stage: 'practice', game: 'dialogue', title: 'Tea at Kikuya', jp: 'きくやで おちゃを', description: 'Be the politest customer in town: choose a seat, order, ask, invite.', params: { scenarioId: 'castletown-teahouse' } },
  { id: 'r8-words-3', region: R, stage: 'practice', game: 'lesson', title: 'Likes, Wants and Skills', jp: 'すき・ほしい・じょうず', description: 'Dislike, skilful, clumsy, want — and the samurai, the lord and the dojo.', params: { wordIds: words(30, 45) } },
  { id: 'r8-listen', region: R, stage: 'practice', game: 'listening', title: 'Voices from the Stage', jp: 'ぶたいの こえ', description: 'The actors call out directions and shop talk. Catch what you hear.', params: { wordIds: words(0, 45), rounds: 12 } },
  { id: 'r8-forge', region: R, stage: 'practice', game: 'forge', title: 'The Swordsmith’s Sentences', jp: 'かたなかじの ぶん', description: 'Forge polite sentences: turning corners, ordering, liking, giving.', params: { sentenceIds: sentences, distractors: false, timed: false } },
  { id: 'r8-words-4', region: R, stage: 'practice', game: 'lesson', title: 'Gifts and Courtesy', jp: 'おくりものと れいぎ', description: 'Give, give me, receive, lend, borrow — and the respectful words for the lord.', params: { wordIds: words(45) } },
  // ── challenge
  { id: 'r8-runes', region: R, stage: 'challenge', game: 'runes', title: 'The Notice Board', jp: 'こうさつ', description: 'Read the notices posted before the castle gate.', params: { runeIds: runes, showReading: true } },
  { id: 'r8-keigo', region: R, stage: 'challenge', game: 'dialogue', title: 'At the Castle Gate', jp: 'おおてもんの まえで', description: 'Speak to the lord’s retainer: respectful for the lord, humble for yourself.', params: { scenarioId: 'castletown-retainer' } },
  { id: 'r8-cross', region: R, stage: 'challenge', game: 'crossword', title: 'The Great Ledger', jp: 'だいふくちょう', description: 'A crossword from the merchants’ ledger, of everything so far.', params: { wordIds: upTo(), answer: 'mixed', size: 11 } },
  { id: 'r8-defense', region: R, stage: 'challenge', game: 'spell-defense', title: 'Runaway Tea Dolls', jp: 'くるった からくり', description: 'Clockwork tea dolls trundle down the street. Name each one in time!', params: { wordIds: words(), difficulty: 2, goal: 16 } },
  { id: 'r8-speed', region: R, stage: 'challenge', game: 'speedcast', title: 'The Courier’s Dash', jp: 'ひきゃくの はやうち', description: 'Every castle-town word, at a courier’s pace.', params: { wordIds: words(), direction: 'mixed', durationSec: 75 } },
  // ── boss
  { id: 'r8-boss', region: R, stage: 'boss', game: 'boss-nurarihyon', title: 'Nurarihyon in the Lord’s Seat', jp: 'とのの ざの ぬらりひょん', description: 'The uninvited guest has eaten the town’s manners. Answer his every rudeness politely.', params: {} },
  // ── mastery
  { id: 'r8-mastery', region: R, stage: 'mastery', game: 'forge', title: 'Castle Town Mastery Trial', jp: 'じょうかまちの しれん', description: 'Every castle-town sentence, with decoys, against the clock.', params: { sentenceIds: sentences, distractors: true, timed: true } },
]

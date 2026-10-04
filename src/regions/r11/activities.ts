import { atOrBefore } from '../../data/journey'
import { VOCAB } from '../../data/vocab'
import type { Activity } from '../types'
import { DATA } from './data'

const R = 11
const words = (from = 0, to?: number) => DATA.words.slice(from, to).map((w) => w[0])
const upTo = () => VOCAB.filter((w) => atOrBefore(w.region, R)).map((w) => w.id)
const sentences = DATA.sentences.map((s) => s.id)
const runes = DATA.runes.map((r) => r.id)
const grammar = (...ids: string[]) => ids.map((id) => `g:${id}`)

/**
 * The Chattering Station Town is a listening region: three listening
 * rounds (announcements, café chatter, rush hour), three conversations
 * (one with English, two by ear) and a boss who speaks with no face.
 */
export const ACTIVITIES: Activity[] = [
  { id: 'r11-words-1', region: R, stage: 'learn', game: 'lesson', title: 'Greetings and Replies', jp: 'あいさつと へんじ', description: 'Good morning, good night, I’m home, welcome back, and the many ways to say yes and no.', params: { wordIds: words(0, 15) } },
  { id: 'r11-casual', region: R, stage: 'learn', game: 'review', title: 'How Friends Talk', jp: 'ともだちの はなしかた', description: 'Casual だ, questions without か, 〜んだ, よ and ね, dropped particles, and the little noises that show you’re listening.', params: { itemIds: grammar('casual-da', 'casual-question', 'n-desu', 'yo-ne', 'particle-drop', 'aizuchi') } },
  { id: 'r11-words-2', region: R, stage: 'learn', game: 'lesson', title: 'What? Who? Why?', jp: 'なに？ だれ？ なんで？', description: 'Question words, and the glue of conversation: ええと, なるほど, やっぱり, へえ.', params: { wordIds: words(15, 30) } },
  { id: 'r11-listen-1', region: R, stage: 'practice', game: 'listening', title: 'Platform Announcements', jp: 'ホームの アナウンス', description: 'The platform speaker crackles out greetings and question words. Catch each one by ear.', params: { wordIds: words(0, 30), rounds: 12 } },
  { id: 'r11-cafe', region: R, stage: 'practice', game: 'dialogue', title: 'A Coffee at Komorebi', jp: 'こもれびで コーヒーを', description: 'Order a drink and chat with Yui, who starts polite and slides into casual talk.', params: { scenarioId: 'ekimae-cafe' } },
  { id: 'r11-words-3', region: R, stage: 'practice', game: 'lesson', title: 'Round the Town', jp: 'まちの なか', description: 'Work, the company, trains and buses, phones, the hospital, the bank, the konbini, movies and music.', params: { wordIds: words(30, 45) } },
  { id: 'r11-words-4', region: R, stage: 'practice', game: 'lesson', title: 'Food and Home', jp: 'たべものと いえ', description: 'Breakfast, lunch and dinner, eggs and milk, the TV, photos, birthdays and homework.', params: { wordIds: words(45, 60) } },
  { id: 'r11-listen-2', region: R, stage: 'practice', game: 'listening', title: 'Café Chatter', jp: 'カフェの おしゃべり', description: 'The old jukebox replays the café’s chatter: town words and kitchen words.', params: { wordIds: words(30, 60), rounds: 12 } },
  { id: 'r11-spoken', region: R, stage: 'practice', game: 'review', title: 'Words That Get Squeezed', jp: 'ちぢむ ことば', description: 'けど, って, てる, ちゃう, とく, かな, じゃん, and the connectors that join one turn to the next.', params: { itemIds: grammar('kedo-soft', 'tte-quote', 'teru-contraction', 'chau', 'toku', 'kana-wonder', 'connectors', 'jan') } },
  { id: 'r11-words-5', region: R, stage: 'practice', game: 'lesson', title: 'How It Is', jp: 'どんな かんじ？', description: 'Good and bad, hot and cold, near and far, busy and free, fun and boring.', params: { wordIds: words(60, 75) } },
  { id: 'r11-forge', region: R, stage: 'practice', game: 'forge', title: 'Overheard Sentences', jp: 'きこえた ぶん', description: 'Put the café’s overheard chatter back together: casual, contracted and real.', params: { sentenceIds: sentences, distractors: false, timed: false } },
  { id: 'r11-words-6', region: R, stage: 'practice', game: 'lesson', title: 'Doing and People', jp: 'すること、ひと', description: 'Say, live, work, hold, open, close, help, do your best, call — and he, she, everyone, me.', params: { wordIds: words(75) } },
  { id: 'r11-weekend', region: R, stage: 'challenge', game: 'dialogue', title: 'Weekend Talk on the Platform', jp: 'ホームで しゅうまつの はなし', description: 'Chat with Haruto, a fast-talking student. No English this time: listen.', params: { scenarioId: 'ekimae-weekend' } },
  { id: 'r11-phone', region: R, stage: 'challenge', game: 'dialogue', title: 'A Call from the Grocer', jp: 'やおやからの でんわ', description: 'The phone box rings. No faces on the phone, no English: catch what Mari needs, how many, and by when.', params: { scenarioId: 'ekimae-phone' } },
  { id: 'r11-listen-3', region: R, stage: 'challenge', game: 'listening', title: 'Rush Hour', jp: 'ラッシュアワー', description: 'The bus stop at rush hour: every word of the town, all at once.', params: { wordIds: words(), rounds: 16 } },
  { id: 'r11-runes', region: R, stage: 'challenge', game: 'runes', title: 'Rooftop Notes', jp: 'おくじょうの メモ', description: 'Notes the neighbours scribbled on the rooftop board, in real casual Japanese. No readings.', params: { runeIds: runes, showReading: false } },
  { id: 'r11-cross', region: R, stage: 'challenge', game: 'crossword', title: 'Laundry-Line Crossword', jp: 'ものほしの クロスワード', description: 'Words pegged out on the washing lines, from everything so far.', params: { wordIds: upTo(), answer: 'mixed', size: 12 } },
  { id: 'r11-combat', region: R, stage: 'challenge', game: 'combat', title: 'Echoes in the Park', jp: 'こうえんの こだま', description: 'Yamabiko echo every word in the park’s long grass. Speak first, before they steal it.', params: { enemyIds: ['yamabiko', 'tanuki', 'karakuri'], input: 'type' } },
  { id: 'r11-boss', region: R, stage: 'boss', game: 'boss-nopperabo', title: 'Nopperabō of the Last Platform', jp: 'さいごの ホームの のっぺらぼう', description: 'The faceless yokai speaks with no face, and no words on screen. Hear what it means, answer it, and give the town back its small talk.', params: {} },
  { id: 'r11-mastery', region: R, stage: 'mastery', game: 'forge', title: 'Station Town Mastery Trial', jp: 'えきまちの しれん', description: 'Every overheard sentence, with decoys, against the station clock.', params: { sentenceIds: sentences, distractors: true, timed: true } },
  { id: 'r11-speed', region: R, stage: 'mastery', game: 'speedcast', title: 'Departure Bell', jp: 'はっしゃの ベル', description: 'The bell is ringing! Cast each word before the doors close.', params: { wordIds: upTo(), direction: 'mixed', durationSec: 75 } },
]

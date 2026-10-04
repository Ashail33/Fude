import { atOrBefore } from '../../data/journey'
import { VOCAB } from '../../data/vocab'
import type { Activity } from '../types'
import { DATA } from './data'

const R = 12
const words = (from = 0, to?: number) => DATA.words.slice(from, to).map((w) => w[0])
const upTo = () => VOCAB.filter((w) => atOrBefore(w.region, R)).map((w) => w.id)
const sentences = DATA.sentences.map((s) => s.id)
const runes = DATA.runes.map((r) => r.id)
const grammar = (...ids: string[]) => ids.map((id) => `g:${id}`)

export const ACTIVITIES: Activity[] = [
  { id: 'r12-words-1', region: R, stage: 'learn', game: 'lesson', title: 'How It Feels', jp: 'どんな きもち？', description: 'Happy, embarrassed, frustrated, nostalgic, envious: the words for what’s inside.', params: { wordIds: words(0, 15) } },
  { id: 'r12-feelings', region: R, stage: 'learn', game: 'review', title: 'Reading the Masks', jp: 'めんを よむ', description: 'Why you feel (〜て), what you feel about (〜が), and how others look and seem: 〜そう, 〜がる, 〜みたい, 〜たがる.', params: { itemIds: grammar('te-feeling', 'feeling-ga', 'sou-looks', 'garu', 'mitai', 'tagaru') } },
  { id: 'r12-words-2', region: R, stage: 'learn', game: 'lesson', title: 'Laughing and Crying', jp: 'わらって、ないて', description: 'Laugh, cry, get angry, apologise, forgive, comfort, cheer on.', params: { wordIds: words(15, 30) } },
  { id: 'r12-cheer', region: R, stage: 'practice', game: 'dialogue', title: 'Ren After the Fall', jp: 'ころんだ あとの レン', description: 'Ren fell in the dress rehearsal and wants to give up. Listen, name her feelings and cheer her on.', params: { scenarioId: 'kokoro-cheer' } },
  { id: 'r12-words-3', region: R, stage: 'practice', game: 'lesson', title: 'Things of the Heart', jp: 'こころの もの', description: 'Tears, smiles, love, quarrels and making up, gratitude, regret, secrets.', params: { wordIds: words(30, 45) } },
  { id: 'r12-listen', region: R, stage: 'practice', game: 'listening', title: 'Voices Behind the Masks', jp: 'めんの うらの こえ', description: 'Every mask on the wall whispers a feeling. Hear it and find its word.', params: { wordIds: words(0, 45), rounds: 12 } },
  { id: 'r12-wishes', region: R, stage: 'practice', game: 'review', title: 'Wishes and Regrets', jp: 'ねがいと こうかい', description: 'I want you to…, I have a feeling…, oops…, even though…, I wish I had…, I’m glad…, to think that…, thank you for….', params: { itemIds: grammar('te-hoshii', 'ki-ga-suru', 'te-shimatta', 'noni', 'ba-yokatta', 'te-yokatta', 'nante', 'te-kurete-arigatou') } },
  { id: 'r12-sorry', region: R, stage: 'practice', game: 'dialogue', title: 'Spilled Candy Apples', jp: 'おちた りんごあめ', description: 'You knocked over Sora’s stall. Apologise properly, make amends and make up.', params: { scenarioId: 'kokoro-sorry' } },
  { id: 'r12-words-4', region: R, stage: 'practice', game: 'lesson', title: 'Sound-Feelings', jp: 'こころの おと', description: 'ドキドキ, わくわく, イライラ, ほっと: feelings you can hear.', params: { wordIds: words(45, 60) } },
  { id: 'r12-forge', region: R, stage: 'practice', game: 'forge', title: 'Carving Feelings', jp: 'きもちを ほる', description: 'Carve words into whole sentences that say how you feel, and how others seem.', params: { sentenceIds: sentences, distractors: false, timed: false } },
  { id: 'r12-words-5', region: R, stage: 'practice', game: 'lesson', title: 'Real Reactions', jp: 'ほんとうの はんのう', description: 'Thank goodness! The best! No way! What a hassle! The words that jump out first.', params: { wordIds: words(60) } },
  { id: 'r12-listen-2', region: R, stage: 'challenge', game: 'listening', title: 'Firefly Whispers', jp: 'ほたるの ささやき', description: 'The fireflies blink out sound-feelings and reactions. Catch every one in the dark.', params: { wordIds: words(45), rounds: 12 } },
  { id: 'r12-congrats', region: R, stage: 'challenge', game: 'dialogue', title: 'First Prize Rice', jp: 'いちばんの おこめ', description: 'Mamoru’s rice won first prize. Congratulate him and share his joy, with English only as a hint.', params: { scenarioId: 'kokoro-congrats' } },
  { id: 'r12-runes', region: R, stage: 'challenge', game: 'runes', title: 'Firefly Tablets', jp: 'ほたるの いしぶみ', description: 'Read the glowing tablets of the grove. No readings to help.', params: { runeIds: runes, showReading: false } },
  { id: 'r12-cross', region: R, stage: 'challenge', game: 'crossword', title: 'Grandma’s Diary', jp: 'おばあさんの にっき', description: 'A crossword hidden in an old diary, from every word of the road so far.', params: { wordIds: upTo(), answer: 'mixed', size: 12 } },
  { id: 'r12-defense', region: R, stage: 'challenge', game: 'spell-defense', title: 'Falling Masks', jp: 'ふって くる めん', description: 'Frozen masks rain down on the festival. Name each feeling before it lands!', params: { wordIds: words(), difficulty: 2, goal: 18 } },
  { id: 'r12-combat', region: R, stage: 'challenge', game: 'combat', title: 'Mask Spirits in the Paddies', jp: 'たんぼの めんれい', description: 'Menrei, the mask spirits, hide in the rice grass. Type your incantations to drive them off.', params: { enemyIds: ['menrei', 'kitsune', 'wisp'], input: 'type' } },
  { id: 'r12-boss', region: R, stage: 'boss', game: 'boss-hannya', title: 'Hannya, the Mask of Jealousy', jp: 'しっとの めん はんにゃ', description: 'Name the feelings she throws at you, read the hearts around you, and find the words that reach the grief under her rage.', params: {} },
  { id: 'r12-mastery', region: R, stage: 'mastery', game: 'forge', title: 'Valley of Hearts Mastery Trial', jp: 'こころの たにの しれん', description: 'Every feeling sentence, with decoys, against the festival drum.', params: { sentenceIds: sentences, distractors: true, timed: true } },
  { id: 'r12-speed', region: R, stage: 'mastery', game: 'speedcast', title: 'Quick as a Heartbeat', jp: 'ドキドキ はやうち', description: 'English flashes past: cast the Japanese before your heart beats twice.', params: { wordIds: upTo(), direction: 'en-jp', durationSec: 75 } },
]

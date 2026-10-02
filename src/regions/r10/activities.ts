import { atOrBefore } from '../../data/journey'
import { VOCAB } from '../../data/vocab'
import type { Activity } from '../types'
import { DATA } from './data'

const R = 10
const words = (from = 0, to?: number) => DATA.words.slice(from, to).map((w) => w[0])
const upTo = () => VOCAB.filter((w) => atOrBefore(w.region, R)).map((w) => w.id)
const sentences = DATA.sentences.map((s) => s.id)
const runes = DATA.runes.map((r) => r.id)
const grammar = (...ids: string[]) => ids.map((id) => `g:${id}`)

export const ACTIVITIES: Activity[] = [
  { id: 'r10-words-1', region: R, stage: 'learn', game: 'lesson', title: 'Reading the Sky', jp: 'そらを よむ', description: 'Weather, thunder, rainbows and fog, and the verbs that fall and blow.', params: { wordIds: words(0, 15) } },
  { id: 'r10-forms', region: R, stage: 'learn', game: 'review', title: 'The Shape of Verbs', jp: 'どうしの かたち', description: 'Plain form, ない-form, “can”, and the three ways to say “if”.', params: { itemIds: grammar('plain-form', 'nai-form', 'potential', 'koto-ga-dekiru', 'tara', 'ba', 'to-whenever') } },
  { id: 'r10-words-2', region: R, stage: 'learn', game: 'lesson', title: 'Verbs of the Mind', jp: 'こころの どうし', description: 'Think, decide, compare, forget, believe — and できる.', params: { wordIds: words(15, 30) } },
  { id: 'r10-forecast', region: R, stage: 'practice', game: 'dialogue', title: 'Shigure’s Forecast', jp: 'シグレの よほう', description: 'Rebuild a shattered weather forecast: でしょう, かもしれない, と思う, から, たら.', params: { scenarioId: 'clouds-forecast' } },
  { id: 'r10-words-3', region: R, stage: 'practice', game: 'lesson', title: 'Feelings and Meanings', jp: 'きもちと いみ', description: 'Fun, sad, lonely; meaning, reason, promise, future.', params: { wordIds: words(30, 45) } },
  { id: 'r10-listen', region: R, stage: 'practice', game: 'listening', title: 'Thunder Echoes', jp: 'かみなりの こだま', description: 'The wind chimes repeat what the thunder said. Catch each word.', params: { wordIds: words(0, 45), rounds: 12 } },
  { id: 'r10-opinions', region: R, stage: 'practice', game: 'review', title: 'The Scholar’s Questions', jp: 'はかせの しつもん', description: 'Comparing, reasons, opinions, plans, duties and guesses.', params: { itemIds: grammar('yori-hou', 'naka-de-ichiban', 'kara-because', 'to-omou', 'tsumori', 'nakereba-naranai', 'kamoshirenai', 'deshou') } },
  { id: 'r10-forge', region: R, stage: 'practice', game: 'forge', title: 'Star-Chart Sentences', jp: 'ほしの ぶん', description: 'Join scattered words into whole sentences, like stars into constellations.', params: { sentenceIds: sentences, distractors: false, timed: false } },
  { id: 'r10-words-4', region: R, stage: 'practice', game: 'lesson', title: 'More, Most, Maybe', jp: 'もっと、いちばん、たぶん', description: 'The little words of comparing and guessing.', params: { wordIds: words(45) } },
  { id: 'r10-runes', region: R, stage: 'challenge', game: 'runes', title: 'Sky-Garden Tablets', jp: 'そらにわの いしぶみ', description: 'Read the old tablets of the sky garden. No readings to help.', params: { runeIds: runes, showReading: false } },
  { id: 'r10-cross', region: R, stage: 'challenge', game: 'crossword', title: 'Constellation Crossword', jp: 'せいざの クロスワード', description: 'A crossword drawn across the night sky, from everything so far.', params: { wordIds: upTo(), answer: 'mixed', size: 12 } },
  { id: 'r10-defense', region: R, stage: 'challenge', game: 'spell-defense', title: 'Hailstorm on the Ramparts', jp: 'ひょうの あらし', description: 'Hailstones the size of words fall on the city. Name each one in time!', params: { wordIds: words(), difficulty: 2, goal: 18 } },
  { id: 'r10-combat', region: R, stage: 'challenge', game: 'combat', title: 'Thunder-Beast Patrol', jp: 'らいじゅう たいじ', description: 'Raijū prowl the cloud streets. Type your incantations to drive them off.', params: { enemyIds: ['raiju', 'harpy', 'tengu'], input: 'type' } },
  { id: 'r10-boss', region: R, stage: 'boss', game: 'boss-raijin', title: 'Raijin of the Thunder Drums', jp: 'たいこの らいじん', description: 'The thunder god drums every sentence to pieces. Answer each beat in the form he calls.', params: {} },
  { id: 'r10-mastery', region: R, stage: 'mastery', game: 'forge', title: 'Cloud Capital Mastery Trial', jp: 'くもの みやこの しれん', description: 'Every sentence of the sky, with decoys, against the storm clock.', params: { sentenceIds: sentences, distractors: true, timed: true } },
  { id: 'r10-speed', region: R, stage: 'mastery', game: 'speedcast', title: 'Lightning Round', jp: 'いなずまの はやうち', description: 'English flashes like lightning: cast the Japanese before the thunder.', params: { wordIds: upTo(), direction: 'en-jp', durationSec: 75 } },
]

import type { Activity, Stage } from '../games/types'
import { HIRAGANA, KATAKANA } from './kana'
import { FORGE_SENTENCES, RUNES } from './sentences'
import { atOrBefore, JOURNEY } from './journey'
import { VOCAB } from './vocab'
import { PACK_ACTIVITIES } from '../regions/activities'
import { PACK_DATA } from '../regions/data'

export interface Region {
  id: number
  name: string
  jp: string
  reading: string
  tagline: string
  teaches: string[]
  color: string
  emoji: string
  /** Map position (percent) on the world map. */
  pos: { x: number; y: number }
  /** The region's main outdoor map (interiors and side areas hang off it). */
  map: string
}

const CORE_REGIONS: Region[] = [
  { id: 1, name: 'The Village of First Words', jp: 'はじまりの村', reading: 'はじまりのむら', tagline: 'Where every mage speaks their first spell.', teaches: ['Hiragana', '30 basic words', 'Asking with ください'], color: '#ff9e6d', emoji: '🏘️', pos: { x: 18, y: 72 }, map: 'village' },
  { id: 2, name: 'The Elemental Fields', jp: '元素の野', reading: 'げんそのの', tagline: 'Fire, water, tree, earth, stone: the roots of all kanji.', teaches: ['Katakana', 'Kanji roots', 'Combining radicals'], color: '#7ed957', emoji: '🌾', pos: { x: 40, y: 50 }, map: 'fields' },
  { id: 3, name: 'The Forest of Sentences', jp: '文の森', reading: 'ぶんのもり', tagline: 'Words grow into sentences beneath the ancient canopy.', teaches: ['Verbs', 'Particles は・を・に・で', 'Sentence order'], color: '#3fbf9f', emoji: '🌲', pos: { x: 62, y: 70 }, map: 'forest' },
  { id: 4, name: 'The Shrine of Reading', jp: '読みの社', reading: 'よみのやしろ', tagline: 'Ancient tablets reveal their meaning to those who read.', teaches: ['Adjectives', 'Reading comprehension', 'Listening'], color: '#c792ea', emoji: '⛩️', pos: { x: 78, y: 42 }, map: 'shrine' },
  { id: 5, name: 'The Tower of Creation', jp: '創造の塔', reading: 'そうぞうのとう', tagline: 'Here, language is power. Speak, and the world obeys.', teaches: ['Casting sentences', 'Adjective conjugation', 'Free expression'], color: '#ffd166', emoji: '🗼', pos: { x: 55, y: 16 }, map: 'tower' },
]

/** Every region, in journey order (see ./journey: ids are stable, the order is the road). */
const ALL_REGIONS: Region[] = [...CORE_REGIONS, ...PACK_DATA.map((d) => d.region)]
export const REGIONS: Region[] = JOURNEY.map((id) => ALL_REGIONS.find((r) => r.id === id)!)
export const REGION_BY_ID = new Map(REGIONS.map((r) => [r.id, r]))
export { atOrBefore, FINAL_REGION, JOURNEY, nextRegion, prevRegion, regionRank } from './journey'

/** A region's main outdoor map. */
export function regionMap(id: number): string {
  return REGION_BY_ID.get(id)?.map ?? REGIONS[0].map
}

const ids = (region: number, from = 0, to?: number) =>
  VOCAB.filter((w) => w.region === region)
    .slice(from, to)
    .map((w) => w.id)

const kanaOfRows = (list: typeof HIRAGANA, rows: string[]) => list.filter((k) => rows.includes(k.row)).map((k) => k.char)
const sentencesOf = (region: number) => FORGE_SENTENCES.filter((s) => s.region === region).map((s) => s.id)
const runesOf = (...regions: number[]) => RUNES.filter((r) => regions.includes(r.region)).map((r) => r.id)
const upTo = (region: number) => VOCAB.filter((w) => atOrBefore(w.region, region)).map((w) => w.id)

const CORE_ACTIVITIES: Activity[] = [
  // ─── Region 1 ─────────────────────────────────────────────────────────
  { id: 'r1-words-1', region: 1, stage: 'learn', game: 'lesson', title: 'First Words I', jp: 'はじめのことば', description: 'Meet your first 15 words of power.', params: { wordIds: ids(1, 0, 15) } },
  { id: 'r1-trace-1', region: 1, stage: 'learn', game: 'arcana', title: 'Scroll of Kana I', jp: 'かなのまきもの', description: 'Trace the faded hiragana あ to の.', params: { chars: kanaOfRows(HIRAGANA, ['a', 'ka', 'sa', 'ta', 'na']), mode: 'trace', count: 10 } },
  { id: 'r1-shop', region: 1, stage: 'learn', game: 'dialogue', title: 'The Spell Merchant', jp: 'まほうや', description: 'Ask the merchant for your first elemental spells.', params: { scenarioId: 'village-shop' } },
  { id: 'r1-defense-1', region: 1, stage: 'practice', game: 'spell-defense', title: 'Falling Spell Defense', jp: 'まもりのまほう', description: 'Objects fall from the sky. Cast the right word to destroy them.', params: { wordIds: ids(1, 0, 15), difficulty: 1, goal: 12 } },
  { id: 'r1-words-2', region: 1, stage: 'practice', game: 'lesson', title: 'First Words II', jp: 'つぎのことば', description: 'Fifteen more words for your grimoire.', params: { wordIds: ids(1, 15, 30) } },
  { id: 'r1-spot', region: 1, stage: 'practice', game: 'spot', title: 'Spot the Imposter', jp: 'まちがいさがし', description: 'One character is not like the others. Find it fast.', params: { minLevel: 1, maxLevel: 2, rounds: 10, timeLimitSec: 60 } },
  { id: 'r1-trace-2', region: 1, stage: 'practice', game: 'arcana', title: 'Scroll of Kana II', jp: 'かなのまきもの・二', description: 'Trace hiragana は to ん.', params: { chars: kanaOfRows(HIRAGANA, ['ha', 'ma', 'ya', 'ra', 'wa']), mode: 'trace', count: 10 } },
  { id: 'r1-defense-2', region: 1, stage: 'challenge', game: 'spell-defense', title: 'Defense: Kana Storm', jp: 'かなのあらし', description: 'Now the blocks show Japanese. Name them in English.', params: { wordIds: ids(1), difficulty: 2, goal: 15 } },
  { id: 'r1-recall', region: 1, stage: 'challenge', game: 'arcana', title: 'Blank Scroll', jp: 'しろいまきもの', description: 'No guide this time. Write hiragana from memory.', params: { chars: HIRAGANA.map((k) => k.char), mode: 'recall', count: 8 } },
  { id: 'r1-listen', region: 1, stage: 'challenge', game: 'listening', title: 'Village Whispers', jp: 'むらのささやき', description: 'Villagers speak a word. Choose what you heard.', params: { wordIds: ids(1), rounds: 10 } },
  { id: 'r1-boss', region: 1, stage: 'boss', game: 'boss-kana', title: 'The Kana Oni', jp: 'かなのおに', description: 'A demon made of scrambled kana guards the road out of the village.', params: { script: 'hiragana' } },
  { id: 'r1-mastery', region: 1, stage: 'mastery', game: 'spell-defense', title: 'Village Mastery Trial', jp: 'むらのしれん', description: 'Fast, many blocks, kana only. Prove your mastery.', params: { wordIds: ids(1), difficulty: 3, goal: 20 } },

  // ─── Region 2 ─────────────────────────────────────────────────────────
  { id: 'r2-words-1', region: 2, stage: 'learn', game: 'lesson', title: 'Roots of the Earth', jp: 'だいちのね', description: 'Elemental kanji: earth, stone, sun, forest…', params: { wordIds: ids(2, 0, 15) } },
  { id: 'r2-kata-1', region: 2, stage: 'learn', game: 'arcana', title: 'Katakana Runes I', jp: 'カタカナ・一', description: 'Trace the sharp katakana ア to ノ.', params: { chars: kanaOfRows(KATAKANA, ['a', 'ka', 'sa', 'ta', 'na']), mode: 'trace', count: 10 } },
  { id: 'r2-kanji-trace', region: 2, stage: 'learn', game: 'arcana', title: 'Elemental Brushwork', jp: 'げんそのふで', description: 'Trace the elemental kanji.', params: { chars: ['火', '水', '木', '土', '石', '日', '月', '山', '川', '田', '人', '口'], mode: 'trace', count: 8 } },
  { id: 'r2-evolve', region: 2, stage: 'practice', game: 'crafting', title: 'Kanji Evolution', jp: 'かんじのしんか', description: 'Combine radicals to discover new kanji. 木 + 木 = ?', params: { mode: 'evolution', goal: 8 } },
  { id: 'r2-words-2', region: 2, stage: 'practice', game: 'lesson', title: 'Powers of the Fields', jp: 'ののちから', description: 'People, numbers and directions.', params: { wordIds: ids(2, 15, 30) } },
  { id: 'r2-kata-2', region: 2, stage: 'practice', game: 'arcana', title: 'Katakana Runes II', jp: 'カタカナ・二', description: 'Trace katakana ハ to ン.', params: { chars: kanaOfRows(KATAKANA, ['ha', 'ma', 'ya', 'ra', 'wa']), mode: 'trace', count: 10 } },
  { id: 'r2-spot', region: 2, stage: 'practice', game: 'spot', title: 'Shape-Shifter Hunt', jp: 'にせものさがし', description: 'シ or ツ? ソ or ン? Katakana imposters appear.', params: { minLevel: 2, maxLevel: 4, rounds: 12, timeLimitSec: 75 } },
  { id: 'r2-world', region: 2, stage: 'challenge', game: 'crafting', title: 'Shape the Land', jp: 'だいちをつくる', description: 'Use elemental spells to build rivers, forests and mountains.', params: { mode: 'world', goal: 5 } },
  { id: 'r2-speed', region: 2, stage: 'challenge', game: 'speedcast', title: 'Speed Casting', jp: 'はやうち', description: 'Kanji fly at you. Name them before they strike.', params: { wordIds: upTo(2), direction: 'jp-en', durationSec: 60 } },
  { id: 'r2-boss', region: 2, stage: 'boss', game: 'boss-radical', title: 'The Radical Golem', jp: 'ぶしゅのゴーレム', description: 'A golem of fused radicals. Split its body into the right kanji.', params: {} },
  { id: 'r2-mastery', region: 2, stage: 'mastery', game: 'spot', title: 'Fields Mastery Trial', jp: 'ののしれん', description: 'Kanji look-alikes at speed: 土 or 士? 日, 目 or 白?', params: { minLevel: 3, maxLevel: 5, rounds: 16, timeLimitSec: 75 } },

  // ─── Region 3 ─────────────────────────────────────────────────────────
  { id: 'r3-words-1', region: 3, stage: 'learn', game: 'lesson', title: 'Words that Move', jp: 'うごくことば', description: 'Verbs: eat, drink, see, go and more.', params: { wordIds: ids(3, 0, 15) } },
  { id: 'r3-forge-1', region: 3, stage: 'learn', game: 'forge', title: 'Sentence Forge', jp: 'ぶんのかじ', description: 'Hammer word-tiles into a sentence.', params: { sentenceIds: sentencesOf(3).slice(0, 6), distractors: false, timed: false } },
  { id: 'r3-cross-1', region: 3, stage: 'practice', game: 'crossword', title: 'Leaf Crossword', jp: 'はっぱのクロスワード', description: 'A crossword grown from your words. Answer in kana.', params: { wordIds: upTo(3), answer: 'kana', size: 9 } },
  { id: 'r3-words-2', region: 3, stage: 'practice', game: 'lesson', title: 'People & Places', jp: 'ひととばしょ', description: 'Friends, teachers, schools and shops.', params: { wordIds: ids(3, 15, 30) } },
  { id: 'r3-forge-2', region: 3, stage: 'practice', game: 'forge', title: 'Forge with Decoys', jp: 'にせのタイル', description: 'Decoy tiles have appeared. Choose carefully.', params: { sentenceIds: sentencesOf(3), distractors: true, timed: false } },
  { id: 'r3-guard', region: 3, stage: 'challenge', game: 'dialogue', title: 'The Bridge Guard', jp: 'はしのばんにん', description: 'Only those who can say it correctly may cross.', params: { scenarioId: 'bridge-guard' } },
  { id: 'r3-cross-2', region: 3, stage: 'challenge', game: 'crossword', title: 'Kanji Canopy', jp: 'かんじのこずえ', description: 'Kana and kanji entwined. Some answers need kanji.', params: { wordIds: upTo(3), answer: 'mixed', size: 10 } },
  { id: 'r3-boss', region: 3, stage: 'boss', game: 'boss-particle', title: 'The Particle Guardian', jp: 'じょしのしゅご', description: 'Its weak points appear only when the right particle is used.', params: {} },
  { id: 'r3-mastery', region: 3, stage: 'mastery', game: 'forge', title: 'Forest Mastery Trial', jp: 'もりのしれん', description: 'All sentences, decoys, and the clock is ticking.', params: { sentenceIds: sentencesOf(3), distractors: true, timed: true } },

  // ─── Region 4 ─────────────────────────────────────────────────────────
  { id: 'r4-words-1', region: 4, stage: 'learn', game: 'lesson', title: 'Words that Describe', jp: 'かたちのことば', description: 'Hot, cold, fast, slow: adjectives.', params: { wordIds: ids(4, 0, 15) } },
  { id: 'r4-runes-1', region: 4, stage: 'learn', game: 'runes', title: 'Rune Tablets', jp: 'いしぶみ', description: 'Read ancient tablets and choose their meaning.', params: { runeIds: runesOf(3, 4), showReading: true } },
  { id: 'r4-words-2', region: 4, stage: 'practice', game: 'lesson', title: 'Words of the Shrine', jp: 'やしろのことば', description: 'Na-adjectives and shrine vocabulary.', params: { wordIds: ids(4, 15, 30) } },
  { id: 'r4-listen', region: 4, stage: 'practice', game: 'listening', title: 'Echoes of the Shrine', jp: 'やしろのこだま', description: 'The shrine bells speak. Choose the kanji you hear.', params: { wordIds: upTo(4), rounds: 12 } },
  { id: 'r4-forge', region: 4, stage: 'practice', game: 'forge', title: 'Descriptive Forge', jp: 'かざりのかじ', description: 'Forge sentences with adjectives.', params: { sentenceIds: sentencesOf(4), distractors: true, timed: false } },
  { id: 'r4-priest', region: 4, stage: 'challenge', game: 'dialogue', title: 'The Shrine Priest', jp: 'かんぬし', description: 'Answer the priest’s questions in Japanese.', params: { scenarioId: 'shrine-priest' } },
  { id: 'r4-runes-2', region: 4, stage: 'challenge', game: 'runes', title: 'Unlit Tablets', jp: 'くらいいしぶみ', description: 'No reading aids. Only kanji remain.', params: { runeIds: runesOf(3, 4, 5), showReading: false } },
  { id: 'r4-cross', region: 4, stage: 'challenge', game: 'crossword', title: 'Shrine Crossword', jp: 'やしろのクロスワード', description: 'A crossword of everything so far.', params: { wordIds: upTo(4), answer: 'mixed', size: 11 } },
  { id: 'r4-boss', region: 4, stage: 'boss', game: 'boss-librarian', title: 'The Silent Librarian', jp: 'しずかなししょ', description: 'She speaks only in riddles written and whispered.', params: {} },
  { id: 'r4-mastery', region: 4, stage: 'mastery', game: 'speedcast', title: 'Shrine Mastery Trial', jp: 'やしろのしれん', description: 'English flies at you: cast the Japanese.', params: { wordIds: upTo(4), direction: 'en-jp', durationSec: 75 } },

  // ─── Region 5 ─────────────────────────────────────────────────────────
  { id: 'r5-words-1', region: 5, stage: 'learn', game: 'lesson', title: 'Words of Power', jp: 'ちからのことば', description: 'Magic, swords, dragons and heroes.', params: { wordIds: ids(5, 0, 15) } },
  { id: 'r5-combat-1', region: 5, stage: 'learn', game: 'combat', title: 'Spell Duel', jp: 'まほうのけっとう', description: 'Build incantations from tiles to strike enemy weaknesses.', params: { enemyIds: ['slime', 'imp', 'golem'], input: 'choose' } },
  { id: 'r5-words-2', region: 5, stage: 'practice', game: 'lesson', title: 'Verbs of Battle', jp: 'たたかいのことば', description: 'Fight, protect, cut, burn, fly.', params: { wordIds: ids(5, 15, 30) } },
  { id: 'r5-forge', region: 5, stage: 'practice', game: 'forge', title: 'Heroic Forge', jp: 'えいゆうのかじ', description: 'Forge the sentences of legends.', params: { sentenceIds: sentencesOf(5), distractors: true, timed: false } },
  { id: 'r5-speed', region: 5, stage: 'practice', game: 'speedcast', title: 'Tower Speed Casting', jp: 'とうのはやうち', description: 'Every word you know, at speed.', params: { wordIds: upTo(5), direction: 'mixed', durationSec: 75 } },
  { id: 'r5-king', region: 5, stage: 'challenge', game: 'dialogue', title: 'Audience with the King', jp: 'おうのまえで', description: 'Speak politely, or face the dungeon.', params: { scenarioId: 'tower-king' } },
  { id: 'r5-combat-2', region: 5, stage: 'challenge', game: 'combat', title: 'Incantation Combat', jp: 'えいしょうのたたかい', description: 'Type your incantations. Speak them aloud if you dare.', params: { enemyIds: ['wisp', 'harpy', 'treant', 'slime', 'imp'], input: 'type' } },
  { id: 'r5-chimera', region: 5, stage: 'boss', game: 'boss-chimera', title: 'The Shifting Chimera', jp: 'かわるキメラ', description: 'Describe your magic precisely: hot, not big, faster…', params: {} },
  { id: 'r5-dragon', region: 5, stage: 'mastery', game: 'boss-dragon', title: 'The Void Dragon', jp: 'こくうのりゅう', description: 'The final guardian. Everything you have learned is your weapon.', params: {} },
]

export const ACTIVITIES: Activity[] = [...CORE_ACTIVITIES, ...PACK_ACTIVITIES]
export const ACTIVITY_BY_ID = new Map(ACTIVITIES.map((a) => [a.id, a]))

export const STAGE_ORDER: Stage[] = ['learn', 'practice', 'challenge', 'boss', 'mastery']

export const STAGE_LABEL: Record<Stage, { en: string; jp: string }> = {
  learn: { en: 'Learn', jp: 'まなぶ' },
  practice: { en: 'Practice', jp: 'れんしゅう' },
  challenge: { en: 'Challenge', jp: 'ちょうせん' },
  boss: { en: 'Boss', jp: 'ボス' },
  mastery: { en: 'Mastery', jp: 'しゅうとく' },
}

export function activitiesFor(region: number): Activity[] {
  return ACTIVITIES.filter((a) => a.region === region)
}

export function bossOf(region: number): Activity {
  return ACTIVITIES.find((a) => a.region === region && a.stage === 'boss')!
}

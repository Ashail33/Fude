import type { Review } from '../engine/srs'
import type { Script } from '../data/kana'

/**
 * Parameters for every game, keyed by game id. Activities in
 * `data/regions.ts` pick a game and supply its params.
 */
export interface GameParams {
  /** Word lesson: meet words (audio, emoji, mnemonic), then a quick check. */
  lesson: { wordIds: string[] }
  /** Spaced-repetition review of any item ids (see engine/items.ts). */
  review: { itemIds: string[] }
  /** G1 – Falling Spell Defense. */
  'spell-defense': {
    /** Pool of vocabulary word ids that fall as blocks. */
    wordIds: string[]
    /**
     * 1: block shows emoji + English, player picks the Japanese spell.
     * 2: block shows Japanese (kanji+kana), player types or picks English/romaji.
     * 3: faster, multiple simultaneous blocks, kana only, type romaji of the word.
     */
    difficulty: 1 | 2 | 3
    /** Blocks to destroy to win. */
    goal: number
  }
  /** G2 – Hiragana Arcana Drawing. */
  arcana: {
    chars: string[]
    /** trace = faded guide visible; recall = blank scroll, only the romaji/meaning is shown. */
    mode: 'trace' | 'recall'
    /** How many characters to draw in this session (sampled from chars). */
    count: number
  }
  /** G3 – Spot the Difference (Kana Edition). */
  spot: { minLevel: number; maxLevel: number; rounds: number; timeLimitSec: number }
  /** G4 – Magic Crafting. evolution = combine radicals into kanji; world = objectives on a map. */
  crafting: { mode: 'evolution' | 'world'; goal: number }
  /** G5 – Word Crossword. */
  crossword: { wordIds: string[]; /** kana: answers in kana. mixed: some answers require kanji chosen from a palette. */ answer: 'kana' | 'mixed'; size: number }
  /** G6 – Sentence Forge. */
  forge: { sentenceIds: string[]; distractors: boolean; timed: boolean }
  /** G7 – Rune Interpretation. */
  runes: { runeIds: string[]; showReading: boolean }
  /** Listening Challenge: hear a word, choose the kanji/written form. */
  listening: { wordIds: string[]; rounds: number }
  /** G8 – Spell Creation Combat. choose = pick phrase tiles; type = type the incantation (kana/romaji), voice allowed. */
  combat: { enemyIds: string[]; input: 'choose' | 'type' }
  /** G9 – Speed Spell Casting. */
  speedcast: { wordIds: string[]; /** jp→en: word shown in Japanese, pick English. en→jp: reverse. */ direction: 'jp-en' | 'en-jp' | 'mixed'; durationSec: number }
  /** Memory-palace walk through one room (region) of the palace, in route order. */
  palace: { room: number }
  /** NPC dialogue scenario (see data/npcs.ts). */
  dialogue: { scenarioId: string }
  /** Bosses. */
  'boss-kana': { script: Script | 'both' }
  'boss-radical': Record<string, never>
  'boss-particle': Record<string, never>
  'boss-librarian': Record<string, never>
  'boss-chimera': Record<string, never>
  'boss-dragon': Record<string, never>
  /** Region-pack bosses (src/regions/rN/Boss.tsx). */
  'boss-umibozu': Record<string, never>
  'boss-yamanba': Record<string, never>
  'boss-nurarihyon': Record<string, never>
  'boss-yukionna': Record<string, never>
  'boss-raijin': Record<string, never>
  'boss-nopperabo': Record<string, never>
  'boss-hannya': Record<string, never>
}

export type GameKey = keyof GameParams

export type Stage = 'learn' | 'practice' | 'challenge' | 'boss' | 'mastery'

export type Activity = {
  [K in GameKey]: {
    id: string
    region: number
    stage: Stage
    game: K
    title: string
    jp: string
    description: string
    params: GameParams[K]
  }
}[GameKey]

export interface GameResult {
  /** Points earned. */
  score: number
  /** Maximum points possible; accuracy = score / maxScore. */
  maxScore: number
  /** Override pass/fail (bosses: did the player win?). Defaults to accuracy ≥ 60%. */
  passed?: boolean
  /** Every answer given, for the spaced-repetition engine. */
  reviews: Review[]
  /** Item ids used in a boss-defeating blow (Mnemonic Bloom emotional anchor). */
  heroic?: string[]
  /** Short summary lines shown on the result screen. */
  notes?: string[]
}

export interface GameProps<K extends GameKey = GameKey> {
  activity: Extract<Activity, { game: K }>
  params: GameParams[K]
  /** Call exactly once when the game ends. */
  onFinish: (result: GameResult) => void
  /** Abandon the game (no result recorded). */
  onExit: () => void
}

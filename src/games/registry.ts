import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { GameKey, GameProps } from './types'

type Loader = () => Promise<{ default: ComponentType<GameProps> }>

const loaders: Record<GameKey, Loader> = {
  lesson: () => import('./Lesson') as Promise<{ default: ComponentType<GameProps> }>,
  review: () => import('./Review') as Promise<{ default: ComponentType<GameProps> }>,
  'spell-defense': () => import('./SpellDefense') as Promise<{ default: ComponentType<GameProps> }>,
  arcana: () => import('./ArcanaDrawing') as Promise<{ default: ComponentType<GameProps> }>,
  spot: () => import('./SpotDifference') as Promise<{ default: ComponentType<GameProps> }>,
  crafting: () => import('./MagicCrafting') as Promise<{ default: ComponentType<GameProps> }>,
  crossword: () => import('./Crossword') as Promise<{ default: ComponentType<GameProps> }>,
  forge: () => import('./SentenceForge') as Promise<{ default: ComponentType<GameProps> }>,
  runes: () => import('./RuneReading') as Promise<{ default: ComponentType<GameProps> }>,
  listening: () => import('./Listening') as Promise<{ default: ComponentType<GameProps> }>,
  combat: () => import('./SpellCombat') as Promise<{ default: ComponentType<GameProps> }>,
  speedcast: () => import('./SpeedCast') as Promise<{ default: ComponentType<GameProps> }>,
  dialogue: () => import('./Dialogue') as Promise<{ default: ComponentType<GameProps> }>,
  palace: () => import('./PalaceWalk') as Promise<{ default: ComponentType<GameProps> }>,
  'boss-kana': () => import('./bosses/KanaOni') as Promise<{ default: ComponentType<GameProps> }>,
  'boss-radical': () => import('./bosses/RadicalGolem') as Promise<{ default: ComponentType<GameProps> }>,
  'boss-particle': () => import('./bosses/ParticleGuardian') as Promise<{ default: ComponentType<GameProps> }>,
  'boss-librarian': () => import('./bosses/SilentLibrarian') as Promise<{ default: ComponentType<GameProps> }>,
  'boss-chimera': () => import('./bosses/AdjectiveChimera') as Promise<{ default: ComponentType<GameProps> }>,
  'boss-dragon': () => import('./bosses/VoidDragon') as Promise<{ default: ComponentType<GameProps> }>,
  'boss-umibozu': () => import('../regions/r6/Boss') as Promise<{ default: ComponentType<GameProps> }>,
  'boss-yamanba': () => import('../regions/r7/Boss') as Promise<{ default: ComponentType<GameProps> }>,
  'boss-nurarihyon': () => import('../regions/r8/Boss') as Promise<{ default: ComponentType<GameProps> }>,
  'boss-yukionna': () => import('../regions/r9/Boss') as Promise<{ default: ComponentType<GameProps> }>,
  'boss-raijin': () => import('../regions/r10/Boss') as Promise<{ default: ComponentType<GameProps> }>,
}

const cache = new Map<GameKey, LazyExoticComponent<ComponentType<GameProps>>>()

export function gameComponent(key: GameKey) {
  let c = cache.get(key)
  if (!c) {
    c = lazy(loaders[key])
    cache.set(key, c)
  }
  return c
}

export const GAME_META: Record<GameKey, { name: string; jp: string; icon: string; skill: string }> = {
  lesson: { name: 'Word Lesson', jp: 'レッスン', icon: '📜', skill: 'Vocabulary' },
  review: { name: 'Grimoire Review', jp: 'ふくしゅう', icon: '🔁', skill: 'Spaced repetition' },
  'spell-defense': { name: 'Falling Spell Defense', jp: 'まもりのまほう', icon: '🛡️', skill: 'Instant recognition' },
  arcana: { name: 'Arcana Drawing', jp: 'ふでのまほう', icon: '🖌️', skill: 'Writing' },
  spot: { name: 'Spot the Difference', jp: 'まちがいさがし', icon: '🔍', skill: 'Visual discrimination' },
  crafting: { name: 'Magic Crafting', jp: 'まほうのれんきん', icon: '⚗️', skill: 'Kanji logic' },
  crossword: { name: 'Word Crossword', jp: 'クロスワード', icon: '🧩', skill: 'Recall & spelling' },
  forge: { name: 'Sentence Forge', jp: 'ぶんのかじ', icon: '⚒️', skill: 'Grammar' },
  runes: { name: 'Rune Interpretation', jp: 'ルーンよみ', icon: '🪨', skill: 'Reading' },
  listening: { name: 'Listening Challenge', jp: 'ききとり', icon: '👂', skill: 'Listening' },
  combat: { name: 'Spell Creation Combat', jp: 'まほうバトル', icon: '⚔️', skill: 'Production' },
  speedcast: { name: 'Speed Spell Casting', jp: 'はやうち', icon: '⚡', skill: 'Fluency' },
  dialogue: { name: 'NPC Encounter', jp: 'かいわ', icon: '💬', skill: 'Conversation' },
  palace: { name: 'Palace Walk', jp: 'きおくの やかた', icon: '🏯', skill: 'Memory palace' },
  'boss-kana': { name: 'Boss', jp: 'ボス', icon: '👹', skill: 'Kana' },
  'boss-radical': { name: 'Boss', jp: 'ボス', icon: '🗿', skill: 'Kanji' },
  'boss-particle': { name: 'Boss', jp: 'ボス', icon: '🛡️', skill: 'Particles' },
  'boss-librarian': { name: 'Boss', jp: 'ボス', icon: '📚', skill: 'Reading & listening' },
  'boss-chimera': { name: 'Boss', jp: 'ボス', icon: '🦁', skill: 'Adjectives' },
  'boss-dragon': { name: 'Final Boss', jp: 'ラスボス', icon: '🐉', skill: 'Everything' },
  'boss-umibozu': { name: 'Boss', jp: 'ボス', icon: '🌊', skill: 'Numbers & counters' },
  'boss-yamanba': { name: 'Boss', jp: 'ボス', icon: '♨️', skill: 'Verb forms' },
  'boss-nurarihyon': { name: 'Boss', jp: 'ボス', icon: '🏯', skill: 'Polite speech' },
  'boss-yukionna': { name: 'Boss', jp: 'ボス', icon: '❄️', skill: 'Kanji' },
  'boss-raijin': { name: 'Boss', jp: 'ボス', icon: '⚡', skill: 'Grammar' },
}

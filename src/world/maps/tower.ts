import type { MapSpec } from '../types'
import { LAYOUTS } from './layouts'

/** Region 5 — 創造の塔: a castle courtyard at dusk around the great tower. */
export const TOWER: MapSpec = {
  id: 'tower',
  name: 'The Tower of Creation',
  jp: '創造の塔',
  region: 5,
  music: 'tower',
  particles: 'sparkles',
  tint: 'rgba(90, 70, 170, 0.18)',
  rows: LAYOUTS.tower,
  legend: { M: { g: 'stone-floor', o: 'carpet' }, S: { g: 'stone-floor', o: 'statue' } },
  spawn: 'south',
  inn: 'south',
  points: {
    q: { name: 'south', dir: 'up' },
    j: { name: 'tower', dir: 'down' },
  },
  exits: [
    { at: '9', to: 'shrine', point: 'north' },
    { at: 'd', to: 'tower-throne', point: 'door', tile: 'door' },
  ],
  entities: [
    { at: '5', id: 't-wizard', kind: 'activity', sprite: 'elder', dir: 'down', wander: 1, activities: ['r5-words-1'], name: { jp: 'きゅうてい まじゅつし', en: 'Court Wizard' }, lines: [{ jp: 'まほう、つるぎ、りゅう… ちからの ことばを おしえよう。', en: 'Magic, sword, dragon… I will teach you words of power.' }] },
    { at: '1', id: 't-knight', kind: 'activity', sprite: 'guard', dir: 'right', activities: ['r5-combat-1'], name: { jp: 'けんし', en: 'Sparring Knight' }, lines: [{ jp: 'けいこだ！ ことばを くみたてて じゅもんに しろ！', en: 'Training time! Build your words into an incantation!' }] },
    { at: '2', id: 't-captain', kind: 'activity', sprite: 'guard', dir: 'up', activities: ['r5-combat-2'], name: { jp: 'きしだんちょう', en: 'Knight Captain' }, lines: [{ jp: 'つぎは じゅもんを うちこめ。こえに だしても いいぞ！', en: 'Now type your incantations. You may even speak them aloud!' }] },
    { at: '3', id: 't-anvil', kind: 'activity', tile: 'anvil', activities: ['r5-forge'], name: { jp: 'えいゆうの かなとこ', en: 'Heroic Anvil' }, lines: [{ jp: 'でんせつの ぶんを きたえよう。', en: 'Forge the sentences of legend.' }] },
    { at: '4', id: 't-stair', kind: 'activity', tile: 'stairs-up', activities: ['r5-speed'], name: { jp: 'はてしない かいだん', en: 'Endless Stair' }, lines: [{ jp: 'かいだんを かけあがりながら、ことばを うて！', en: 'Race up the stairs, casting words as you go!' }] },
    { at: 'U', id: 't-jailer', kind: 'activity', sprite: 'jailer', dir: 'down', activities: ['r5-words-2'], name: { jp: 'ろうばん', en: 'Jailer' }, lines: [{ jp: 'たたかう、まもる、きる… へへ、たたかいの ことばを おしえてやる。', en: 'Fight, protect, cut… heh, I’ll teach you the words of battle.' }] },
    { at: '$', id: 't-chest-garden', kind: 'chest', tile: 'chest', chest: { item: 'herb', n: 3, shards: 20 } },
    { at: '?', id: 't-chest-hero', kind: 'chest', tile: 'chest', chest: { item: 'charm', n: 1, shards: 40, lock: { answer: 'ゆうしゃ', jp: 'ふたに「勇者」。よみを となえよ。', en: 'The lid bears 勇者. Chant its reading.' } } },
    { at: '(', id: 't-guard', kind: 'npc', sprite: 'guard', wander: 2, name: { jp: 'えいへい', en: 'Guard' }, lines: [{ jp: 'おうさまの まえでは ていねいに はなすんだぞ。', en: 'Speak politely before the King.' }] },
    { at: ')', id: 't-maid', kind: 'npc', sprite: 'villager-b', wander: 2, name: { jp: 'めしつかい', en: 'Castle Maid' }, lines: [{ jp: 'とうの てっぺんに、りゅうが いるらしいです…', en: 'They say a dragon lives at the top of the tower…' }] },
    { at: '+', id: 't-dog', kind: 'npc', sprite: 'dog', wander: 2, name: { jp: 'いぬ', en: 'Dog' }, lines: [{ jp: 'わんわん！', en: 'Woof woof!' }] },
    { at: ']', id: 't-dragon-statue', kind: 'landmark', tile: 'statue', word: 'ryuu', name: { jp: '竜の ぞう', en: 'Dragon Statue' }, lines: [{ jp: '竜の ぞう。いまにも うごきだしそうだ。', en: 'A dragon statue. It looks ready to move at any moment.' }] },
    { at: '{', id: 't-lantern', kind: 'landmark', tile: 'lantern', word: 'yami', name: { jp: 'とうろう', en: 'Lantern' }, lines: [{ jp: '闇を てらす とうろう。', en: 'A lantern pushing back the darkness.' }] },
  ],
}

export const TOWER_THRONE: MapSpec = {
  id: 'tower-throne',
  name: 'Throne Room',
  jp: 'ぎょくざの ま',
  region: 5,
  music: 'tower',
  interior: true,
  particles: 'sparkles',
  bg: '#0b0a14',
  tint: 'rgba(255, 170, 90, 0.10)',
  rows: LAYOUTS['tower-throne'],
  spawn: 'door',
  points: { v: { name: 'door', dir: 'up' }, z: { name: 'stairs', dir: 'down' } },
  exits: [
    { at: '0', to: 'tower', point: 'tower', tile: 'carpet' },
    { at: '2', to: 'tower-top', point: 'stairs', tile: 'stairs-up' },
  ],
  entities: [
    { at: '1', id: 'tt-king', kind: 'activity', sprite: 'king', tile: 'throne', dir: 'down', activities: ['r5-king'], name: { jp: 'おうさま', en: 'The King' }, lines: [{ jp: 'よくぞ まいった、まほうつかいよ。ていねいに もうしてみよ。', en: 'Well met, mage. Speak, and speak politely.' }] },
    { at: '(', id: 'tt-guard-l', kind: 'npc', sprite: 'guard', dir: 'right', name: { jp: 'このえへい', en: 'Royal Guard' }, lines: [{ jp: 'おうさまの まえだ。しずかに。', en: 'You stand before the King. Be quiet.' }] },
    { at: ')', id: 'tt-guard-r', kind: 'npc', sprite: 'guard', dir: 'left', name: { jp: 'このえへい', en: 'Royal Guard' }, lines: [{ jp: 'かいだんの 上は あぶないぞ。', en: 'It’s dangerous at the top of the stairs.' }] },
  ],
}

export const TOWER_TOP: MapSpec = {
  id: 'tower-top',
  name: 'Tower Summit',
  jp: '塔の いただき',
  region: 5,
  music: 'tower',
  interior: true,
  particles: 'sparkles',
  bg: '#241d3a',
  tint: 'rgba(120, 80, 200, 0.2)',
  rows: LAYOUTS['tower-top'],
  spawn: 'stairs',
  points: { v: { name: 'stairs', dir: 'up' } },
  exits: [{ at: '0', to: 'tower-throne', point: 'stairs', tile: 'stairs-down' }],
  entities: [
    { at: '1', id: 'tp-chimera', kind: 'boss', sprite: 'kitsune', activities: ['r5-chimera'], name: { jp: 'かわる キメラ', en: 'The Shifting Chimera' }, lines: [{ jp: 'わが すがたは かわりつづける。ことばで いいあらわしてみよ！', en: 'My form never stops changing. Describe it in words, if you can!' }] },
    { at: '2', id: 'tp-dragon', kind: 'boss', sprite: 'dragon', activities: ['r5-dragon'], name: { jp: 'こくうの りゅう', en: 'The Void Dragon' }, lines: [{ jp: 'ちいさき まほうつかいよ。おまえの ことばの すべてを みせよ。', en: 'Little mage. Show me every word you have.' }] },
    { at: '$', id: 'tp-chest', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 2, shards: 50 } },
  ],
}

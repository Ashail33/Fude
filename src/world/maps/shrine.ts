import type { MapSpec } from '../types'
import { LAYOUTS } from './layouts'

/** Region 4 — 読みの社: torii-lined approach, tablet garden, bamboo, koi pond and a library. */
export const SHRINE: MapSpec = {
  id: 'shrine',
  name: 'The Shrine of Reading',
  jp: '読みの社',
  region: 4,
  music: 'shrine',
  particles: 'dust',
  tint: 'rgba(150, 90, 180, 0.14)',
  rows: LAYOUTS.shrine,
  spawn: 'south',
  inn: 'south',
  points: {
    q: { name: 'south', dir: 'up' },
    v: { name: 'north', dir: 'down' },
    j: { name: 'library', dir: 'down' },
  },
  exits: [
    { at: '9', to: 'forest', point: 'north' },
    { at: '0', to: 'tower', point: 'south', tile: 'stairs-up' },
    { at: 'd', to: 'shrine-library', point: 'door', tile: 'door' },
  ],
  entities: [
    { at: '!', id: 's-miko', kind: 'activity', sprite: 'villager-b', dir: 'down', wander: 1, activities: ['r4-words-1'], name: { jp: 'みこ', en: 'Shrine Maiden' }, lines: [{ jp: 'あつい、つめたい、はやい… かたちの ことばを おしえますね。', en: 'Hot, cold, fast… let me teach you words that describe.' }] },
    { at: '1', id: 's-priest', kind: 'activity', sprite: 'priest', dir: 'down', activities: ['r4-priest'], name: { jp: 'かんぬし', en: 'Shrine Priest' }, lines: [{ jp: 'ようこそ。ここでは にほんごだけで はなしましょう。', en: 'Welcome. Here, we speak only Japanese.' }] },
    { at: '2', id: 's-bell', kind: 'activity', tile: 'shrine-bell', activities: ['r4-listen'], name: { jp: 'やしろの すず', en: 'Shrine Bell' }, lines: [{ jp: 'すずの ねが こだまする…', en: 'The bell’s chime echoes…' }] },
    { at: '3', id: 's-tablet-1', kind: 'activity', tile: 'tablet', activities: ['r4-runes-1'], name: { jp: 'いしぶみ', en: 'Rune Tablet' }, lines: [{ jp: 'こけむした いしぶみ。よみがなが そえてある。', en: 'A mossy tablet, with readings written beside the text.' }] },
    { at: '4', id: 's-tablet-2', kind: 'activity', tile: 'tablet', activities: ['r4-runes-2'], name: { jp: 'くらい いしぶみ', en: 'Unlit Tablet' }, lines: [{ jp: 'もじだけが のこる、くらい いしぶみ。', en: 'A dark tablet where only the kanji remain.' }] },
    { at: '5', id: 's-ema', kind: 'activity', tile: 'sign', activities: ['r4-forge'], name: { jp: 'えまかけ', en: 'Ema Board' }, lines: [{ jp: 'えまに ねがいを かこう。「あかい 花は きれいです」…', en: 'Write a wish on a votive plaque. “The red flower is beautiful”…' }] },
    { at: 'U', id: 's-komainu', kind: 'activity', tile: 'statue', activities: ['r4-cross'], name: { jp: 'こまいぬ', en: 'Komainu Guardian' }, lines: [{ jp: 'こまいぬが なぞを かけてくる。', en: 'The stone lion-dog poses a riddle.' }] },
    { at: '7', id: 's-trial', kind: 'activity', tile: 'statue', activities: ['r4-mastery'], name: { jp: 'しれんの いし', en: 'Trial Stone' }, lines: [{ jp: 'やしろの しれん。えいごを にほんごに かえよ。', en: 'The shrine trial. Turn English into Japanese.' }] },
    { at: '8', id: 's-sign', kind: 'sign', tile: 'sign', name: { jp: 'かんばん', en: 'Sign' }, lines: [{ jp: 'きた：創造の塔。しずかな ししょを たおした ものだけが のぼれる。', en: 'North: the Tower of Creation. Only those who defeat the Silent Librarian may climb.' }] },
    { at: '$', id: 's-chest-bamboo', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 2, shards: 20 } },
    { at: '?', id: 's-chest-pond', kind: 'chest', tile: 'chest', chest: { item: 'charm', n: 1, shards: 25, lock: { answer: 'しずか', jp: 'ふたに「静か」。よみを となえよ。', en: 'The lid bears 静か. Chant its reading.' } } },
    { at: '(', id: 's-fox', kind: 'npc', sprite: 'fox', wander: 2, name: { jp: 'きつね', en: 'Fox' }, lines: [{ jp: 'コン。ここの きつねは かみさまの つかいだよ。', en: 'Kon. The foxes here are messengers of the gods.' }] },
    { at: ')', id: 's-pilgrim', kind: 'npc', sprite: 'villager-a', wander: 2, name: { jp: 'さんぱいしゃ', en: 'Pilgrim' }, lines: [{ jp: 'いしぶみを よむと、むかしの ことが わかるよ。', en: 'Read the tablets and you’ll learn of the old days.' }, { jp: 'としょかんは しずかに ね。', en: 'Be quiet in the library.' }] },
    { at: '+', id: 's-cat', kind: 'npc', sprite: 'cat', wander: 2, name: { jp: 'ねこ', en: 'Cat' }, lines: [{ jp: 'にゃーん。', en: 'Meow~' }] },
    { at: ']', id: 's-lantern', kind: 'landmark', tile: 'lantern', word: 'hikari', name: { jp: 'いしどうろう', en: 'Stone Lantern' }, lines: [{ jp: 'やさしい 光が ともっている。', en: 'A gentle light glows within.' }] },
    { at: '{', id: 's-old-tree', kind: 'landmark', tile: 'tree', word: 'furui', name: { jp: 'ごしんぼく', en: 'Sacred Tree' }, lines: [{ jp: 'とても 古い 木。なんびゃくねんも ここに たっている。', en: 'A very old tree, standing here for centuries.' }] },
  ],
}

export const SHRINE_LIBRARY: MapSpec = {
  id: 'shrine-library',
  name: 'Shrine Library',
  jp: 'やしろの としょかん',
  region: 4,
  music: 'shrine',
  interior: true,
  particles: 'dust',
  bg: '#0b0a14',
  tint: 'rgba(120, 90, 200, 0.14)',
  rows: LAYOUTS['shrine-library'],
  legend: { N: { g: 'wood-floor', o: 'lantern' } },
  spawn: 'door',
  points: { v: { name: 'door', dir: 'up' } },
  exits: [{ at: '0', to: 'shrine', point: 'library', tile: 'carpet' }],
  entities: [
    { at: '1', id: 'sl-apprentice', kind: 'activity', sprite: 'villager-b', dir: 'left', activities: ['r4-words-2'], name: { jp: 'ししょの でし', en: 'Librarian’s Apprentice' }, lines: [{ jp: 'しずかに… ここで やしろの ことばを おしえます。', en: 'Shh… I’ll teach you the words of the shrine here.' }] },
    { at: '6', id: 'sl-librarian', kind: 'boss', sprite: 'wisp', activities: ['r4-boss'], name: { jp: 'しずかな ししょ', en: 'The Silent Librarian' }, lines: [{ jp: '………しずかに。なぞに こたえよ。', en: '………Silence. Answer my riddles.' }] },
    { at: '$', id: 'sl-chest', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 1, shards: 20 } },
  ],
}

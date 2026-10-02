import type { MapSpec } from '../types'
import { EXTRA_LAYOUTS } from './extra-layouts'

/** Region 5 side area — through the west gate: the castle's walled garden with a koi pond and a moon pavilion. */
export const TOWER_GARDEN: MapSpec = {
  id: 'tower-garden',
  name: 'Castle Garden',
  jp: 'おしろの にわ',
  region: 5,
  music: 'tower',
  particles: 'sparkles',
  tint: 'rgba(110, 80, 170, 0.16)',
  rows: EXTRA_LAYOUTS['tower-garden'],
  spawn: 'east',
  points: { v: { name: 'east', dir: 'left' } },
  exits: [{ at: '0', to: 'tower', point: 'garden' }],
  entities: [
    { at: '1', id: 'tg-moonlamp', kind: 'landmark', tile: 'lantern', word: 'hikaru', name: { jp: 'つきみの とうろう', en: 'Moon-Viewing Lantern' }, lines: [{ jp: 'よるに なると、ほのかに 光る。', en: 'When night falls, it shines softly.' }] },
    { at: '2', id: 'tg-hero', kind: 'landmark', tile: 'statue', word: 'yuusha', name: { jp: 'はじまりの 勇者の ぞう', en: 'Statue of the First Hero' }, lines: [{ jp: '「ことばで まもれ」と ほってある。', en: '“Protect with words,” reads the inscription.' }] },
    { at: '3', id: 'tg-gardener', kind: 'npc', sprite: 'villager-a', dir: 'left', name: { jp: 'にわばん', en: 'Royal Gardener' }, lines: [{ jp: 'おしろの にわは、わたしの じまんです。', en: 'The castle garden is my pride and joy.' }] },
    { at: '4', id: 'tg-rose', kind: 'landmark', tile: 'bush', word: 'inochi', name: { jp: 'しおれた バラ', en: 'Wilted Rose' }, lines: [{ jp: 'バラが ぐったり している。', en: 'The rose bush is drooping.' }] },
    { at: '5', id: 'tg-lady', kind: 'npc', sprite: 'villager-b', dir: 'down', wander: 2, name: { jp: 'じじょの スズ', en: 'Suzu the Lady-in-Waiting' }, lines: [{ jp: 'おひめさまは この にわが だいすきなの。', en: 'The princess adores this garden.' }, { jp: '夢の なかでも ここを あるくそうよ。', en: 'She says she walks here even in her dreams.' }] },
    { at: '6', id: 'tg-dial', kind: 'landmark', tile: 'tablet', word: 'kage', name: { jp: 'ひどけい', en: 'Sundial' }, lines: [{ jp: '影が ときを おしえて くれる。', en: 'The shadow tells the time.' }] },
    { at: '$', id: 'tg-chest-hedge', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 1, shards: 25 } },
    { at: '?', id: 'tg-chest-flowers', kind: 'chest', tile: 'chest', chest: { item: 'charm', n: 1, shards: 30, lock: { answer: 'こころ', jp: 'ふたに「心」の 字。よみを となえよ。', en: 'The lid bears 心. Chant its reading.' } } },
  ],
}

const hall = { interior: true, particles: 'sparkles' as const, bg: '#0b0a14' }

/** Region 5 side area — the armoury beside the tower, behind the courtyard door. */
export const TOWER_ARMOURY: MapSpec = {
  ...hall,
  id: 'tower-armoury',
  name: 'Armoury',
  jp: 'ぶきこ',
  region: 5,
  music: 'tower',
  tint: 'rgba(255, 150, 80, 0.12)',
  rows: EXTRA_LAYOUTS['tower-armoury'],
  legend: {
    x: { g: 'stone-floor', o: 'crate' },
    e: { g: 'stone-floor', o: 'barrel' },
    S: { g: 'stone-floor', o: 'statue' },
  },
  spawn: 'door',
  points: { v: { name: 'door', dir: 'up' } },
  exits: [{ at: '0', to: 'tower', point: 'armoury', tile: 'carpet' }],
  entities: [
    { at: '1', id: 'ta-quartermaster', kind: 'npc', sprite: 'guard', dir: 'down', name: { jp: 'ぶきがかり', en: 'Quartermaster' }, lines: [{ jp: 'ここは ぶきこだ。', en: 'This is the armoury.' }] },
    { at: '2', id: 'ta-swords', kind: 'landmark', tile: 'altar', word: 'tsurugi', name: { jp: 'つるぎかけ', en: 'Sword Rack' }, lines: [{ jp: 'ぴかぴかの 剣が ならんでいる。', en: 'A row of gleaming swords.' }] },
    { at: '3', id: 'ta-shield', kind: 'landmark', tile: 'statue', word: 'tate', name: { jp: 'よろいと たて', en: 'Armour and Shield' }, lines: [{ jp: 'おもい よろいと、大きな 盾。', en: 'Heavy armour and a great shield.' }] },
    { at: '4', id: 'ta-dummy', kind: 'landmark', tile: 'stump', word: 'kiru', name: { jp: 'わらにんぎょう', en: 'Straw Dummy' }, lines: [{ jp: 'きずだらけの けいこよう にんぎょう。', en: 'A practice dummy, covered in nicks and cuts.' }] },
    { at: '(', id: 'ta-cat', kind: 'npc', sprite: 'cat', dir: 'down', name: { jp: 'ぶきこの ねこ', en: 'Armoury Cat' }, lines: [{ jp: 'にゃ。(たての 上で ねている)', en: 'Nya. (it’s napping on a shield)' }] },
    { at: '$', id: 'ta-chest', kind: 'chest', tile: 'chest', chest: { item: 'charm', n: 1, shards: 25, lock: { answer: 'まもる', jp: 'ふたに「守」の 字。「くにを ＿＿」。こたえを となえよ。', en: 'The lid bears 守: “to ___ the realm”. Chant the verb.' } } },
  ],
}

/** Region 5 side area — the star library, a floor between the throne room and the summit. */
export const TOWER_LIBRARY: MapSpec = {
  ...hall,
  id: 'tower-library',
  name: 'Star Library',
  jp: 'ほしよみの しょこ',
  region: 5,
  music: 'tower',
  tint: 'rgba(120, 100, 220, 0.16)',
  rows: EXTRA_LAYOUTS['tower-library'],
  spawn: 'down',
  points: { z: { name: 'down', dir: 'right' }, v: { name: 'up', dir: 'left' } },
  exits: [
    { at: '0', to: 'tower-throne', point: 'stairs', tile: 'stairs-down' },
    { at: '9', to: 'tower-top', point: 'stairs', tile: 'stairs-up' },
  ],
  entities: [
    { at: '1', id: 'tl-telescope', kind: 'landmark', tile: 'statue', word: 'hoshi', name: { jp: 'ぼうえんきょう', en: 'Telescope' }, lines: [{ jp: '星が、手が とどきそうな くらい ちかくに 見える。', en: 'The stars look close enough to touch.' }] },
    { at: '2', id: 'tl-astronomer', kind: 'npc', sprite: 'elder', dir: 'down', name: { jp: 'ほしよみの ハカセ', en: 'The Star-Reader' }, lines: [{ jp: 'ほしを よむと、世界の 夢が わかる。', en: 'Read the stars, and you learn what the world dreams.' }] },
    { at: '3', id: 'tl-globe', kind: 'landmark', tile: 'altar', word: 'sekai', name: { jp: 'せかいの ちきゅうぎ', en: 'Globe of the World' }, lines: [{ jp: 'この 世界の ちず。むらから 塔まで、ぜんぶ ある。', en: 'A map of this world — everything from the village to the tower.' }] },
    { at: '4', id: 'tl-dreambook', kind: 'landmark', tile: 'bookshelf', word: 'yume', name: { jp: 'ゆめの ほん', en: 'Book of Dreams' }, lines: [{ jp: 'たくさんの 夢を かきとめた ふるい ほん。', en: 'An old book full of written-down dreams.' }] },
    { at: '(', id: 'tl-archivist', kind: 'npc', sprite: 'villager-b', dir: 'left', wander: 1, name: { jp: 'しょこばん', en: 'Archivist' }, lines: [{ jp: 'うえは 塔の いただき。りゅうが まっています。', en: 'Above us is the summit. The dragon is waiting.' }, { jp: 'ほんは しずかに よんでくださいね。', en: 'Please read quietly.' }] },
    { at: '$', id: 'tl-chest', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 2, shards: 30, lock: { answer: 'ゆめ', jp: 'ふたに「夢」の 字。よみを となえよ。', en: 'The lid bears 夢. Chant its reading.' } } },
  ],
}

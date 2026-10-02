import type { MapSpec } from '../types'
import { EXTRA_LAYOUTS } from './extra-layouts'

/** Region 1 side area — a bamboo grove west of the wall, hiding a forgotten fox shrine. */
export const VILLAGE_BAMBOO: MapSpec = {
  id: 'village-bamboo',
  name: 'Whispering Bamboo Grove',
  jp: 'ささやきの たけやぶ',
  region: 1,
  music: 'village',
  particles: 'fireflies',
  tint: 'rgba(70, 150, 90, 0.14)',
  rows: EXTRA_LAYOUTS['village-bamboo'],
  spawn: 'east',
  points: { v: { name: 'east', dir: 'left' } },
  exits: [{ at: '0', to: 'village', point: 'bamboo' }],
  entities: [
    { at: '1', id: 'vb-shrine', kind: 'landmark', tile: 'altar', name: { jp: 'ちいさな おいなりさん', en: 'Little Fox Shrine' }, lines: [{ jp: 'わすれられた おやしろ。はなも なにも そなえていない。', en: 'A forgotten shrine. No flowers, no offerings at all.' }] },
    { at: '2', id: 'vb-fox', kind: 'npc', sprite: 'fox', dir: 'down', name: { jp: 'しろぎつね', en: 'White Fox' }, lines: [{ jp: 'コン。ここに 人が くるのは ひさしぶり。', en: 'Kon. It has been a long time since anyone came here.' }] },
    { at: '3', id: 'vb-cutter', kind: 'npc', sprite: 'elder', dir: 'right', wander: 1, name: { jp: 'たけとりの おじいさん', en: 'Old Bamboo Cutter' }, lines: [{ jp: 'むかし、ひかる たけを みつけた ことが あるんじゃ。', en: 'Long ago, I found a stalk of bamboo that glowed.' }, { jp: 'その なかには… いや、むかしばなしじゃよ。ほっほ。', en: 'And inside it was… ah, that is just an old story. Ho ho.' }] },
    { at: '4', id: 'vb-chime', kind: 'landmark', tile: 'shrine-bell', word: 'kaze', name: { jp: 'ふうりん', en: 'Wind Chime' }, lines: [{ jp: '風が ふくと、ちりんと なる。', en: 'When the wind blows, it rings: chirin.' }] },
    { at: '5', id: 'vb-moonstone', kind: 'landmark', tile: 'rock', word: 'tsuki', name: { jp: 'つきの いし', en: 'Moon Stone' }, lines: [{ jp: 'よるに なると、いけに 月が うつる。', en: 'At night, the moon shines in the pond.' }] },
    { at: '(', id: 'vb-child', kind: 'npc', sprite: 'child', wander: 1, name: { jp: 'かくれんぼの こ', en: 'Hide-and-Seek Kid' }, lines: [{ jp: 'しーっ！ いま、かくれんぼ ちゅう なの。', en: 'Shh! I’m in the middle of hide-and-seek.' }, { jp: 'たけやぶは、かくれる ところが いっぱい！', en: 'The bamboo grove has lots of places to hide!' }] },
    { at: '$', id: 'vb-chest-hidden', kind: 'chest', tile: 'chest', chest: { item: 'smoke', n: 1, shards: 15 } },
    { at: '?', id: 'vb-chest-shrine', kind: 'chest', tile: 'chest', chest: { item: 'charm', n: 1, shards: 10, lock: { answer: 'かぜ', jp: 'ふたに「風」の 字。よみを となえよ。', en: 'The lid bears 風. Chant its reading.' } } },
  ],
}

/** Region 1 side area — stepped rice terraces east of the village, a stalled watermill and the river. */
export const VILLAGE_TERRACES: MapSpec = {
  id: 'village-terraces',
  name: 'Riverside Terraces',
  jp: 'かわべの たなだ',
  region: 1,
  music: 'village',
  particles: 'pollen',
  tint: 'rgba(255, 200, 120, 0.10)',
  rows: EXTRA_LAYOUTS['village-terraces'],
  spawn: 'west',
  points: { v: { name: 'west', dir: 'right' } },
  exits: [{ at: '0', to: 'village', point: 'terraces' }],
  entities: [
    { at: '1', id: 'vt-mill', kind: 'landmark', tile: 'noren', name: { jp: 'すいしゃごや', en: 'Watermill' }, lines: [{ jp: 'すいしゃが とまっている。みずが きていない。', en: 'The waterwheel has stopped. No water is reaching it.' }] },
    { at: '2', id: 'vt-miller', kind: 'npc', sprite: 'villager-a', dir: 'up', name: { jp: 'こなひきの ゲン', en: 'Gen the Miller' }, lines: [{ jp: 'すいしゃが まわらないと、こめが ひけないんだ。', en: 'If the wheel won’t turn, I can’t mill the rice.' }] },
    { at: '3', id: 'vt-planter', kind: 'npc', sprite: 'villager-b', dir: 'down', wander: 1, name: { jp: 'たうえの ミヨ', en: 'Miyo the Rice Planter' }, lines: [{ jp: 'たうえの うたを うたいましょう♪', en: 'Let’s sing the rice-planting song♪' }, { jp: 'あめが ふると、たんぼが よろこぶの。', en: 'When it rains, the paddies are happy.' }] },
    { at: '4', id: 'vt-jizo', kind: 'landmark', tile: 'statue', word: 'ame', name: { jp: 'あめふり じぞう', en: 'Rain Jizō' }, lines: [{ jp: '雨を よぶ おじぞうさま。ちいさな かさを かぶっている。', en: 'A Jizō who calls the rain. He wears a tiny hat.' }] },
    { at: '5', id: 'vt-heron', kind: 'npc', sprite: 'wisp', dir: 'left', name: { jp: 'しらさぎ', en: 'White Heron' }, lines: [{ jp: 'クワッ… (さかなを まっている)', en: 'Kwah… (it’s waiting for a fish)' }] },
    { at: '6', id: 'vt-marker', kind: 'landmark', tile: 'sign', word: 'kawa', name: { jp: 'かわの しるべ', en: 'River Marker' }, lines: [{ jp: '「川」── はしを わたって ひがしへ。', en: '“River” — cross the bridge to the east.' }] },
    { at: '7', id: 'vt-ricepot', kind: 'landmark', tile: 'pot', word: 'gohan', name: { jp: 'ごはんの かま', en: 'Rice Pot' }, lines: [{ jp: 'たきたての ご飯の におい。', en: 'The smell of freshly cooked rice.' }] },
    { at: '8', id: 'vt-granny', kind: 'npc', sprite: 'elder', dir: 'down', name: { jp: 'おにぎり ばあちゃん', en: 'Onigiri Granny' }, lines: [{ jp: 'おなか すいた？', en: 'Hungry?' }] },
    { at: '9', id: 'vt-boy', kind: 'npc', sprite: 'child', wander: 2, name: { jp: 'かえるとりの タロウ', en: 'Taro the Frog Catcher' }, lines: [{ jp: 'けろけろ！ かえるを いっぴき つかまえた！', en: 'Ribbit! I caught a frog!' }, { jp: 'はしの むこうに、たからばこが あるよ。', en: 'There’s a treasure chest across the bridge.' }] },
    { at: '$', id: 'vt-chest-bank', kind: 'chest', tile: 'chest', chest: { item: 'herb', n: 2, shards: 10 } },
  ],
}

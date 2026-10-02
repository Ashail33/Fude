import type { MapSpec } from '../types'
import { EXTRA_LAYOUTS } from './extra-layouts'

/** Region 2 side area — an apple orchard climbing to a windmill on the hilltop, north of the fields. */
export const FIELDS_HILL: MapSpec = {
  id: 'fields-hill',
  name: 'Windmill Hill',
  jp: 'かざぐるまの おか',
  region: 2,
  music: 'fields',
  particles: 'pollen',
  tint: 'rgba(255, 210, 120, 0.10)',
  rows: EXTRA_LAYOUTS['fields-hill'],
  spawn: 'south',
  points: { v: { name: 'south', dir: 'up' } },
  exits: [{ at: '0', to: 'fields', point: 'hill' }],
  entities: [
    { at: '1', id: 'fh-mill', kind: 'landmark', tile: 'noren', word: 'kaze', name: { jp: 'かざぐるま ごや', en: 'Windmill' }, lines: [{ jp: 'はねが とまっている。風が ない…', en: 'The sails are still. There’s no wind…' }] },
    { at: '2', id: 'fh-keeper', kind: 'npc', sprite: 'villager-b', dir: 'left', name: { jp: 'かざぐるまの ソヨ', en: 'Soyo of the Windmill' }, lines: [{ jp: 'きょうは 風が ない…', en: 'No wind today…' }] },
    { at: '3', id: 'fh-orchard', kind: 'npc', sprite: 'elder', dir: 'down', name: { jp: 'りんご じいさん', en: 'Old Man Ringo' }, lines: [{ jp: 'うちの りんごは あまいぞ。', en: 'My apples are sweet.' }] },
    { at: '4', id: 'fh-apple', kind: 'landmark', tile: 'tree', word: 'ringo', name: { jp: 'りんごの 木', en: 'Apple Tree' }, lines: [{ jp: 'あかい りんごが なっている。', en: 'Red apples hang from the branches.' }] },
    { at: '5', id: 'fh-cloudrock', kind: 'landmark', tile: 'rock', word: 'kumo', name: { jp: 'くもみ いわ', en: 'Cloud-Watching Rock' }, lines: [{ jp: '雲が ゆっくり ながれていく。', en: 'Clouds drift slowly by.' }] },
    { at: '6', id: 'fh-kite', kind: 'npc', sprite: 'child', wander: 2, name: { jp: 'たこあげの ハル', en: 'Haru the Kite Flyer' }, lines: [{ jp: 'たこが 空に とんでるよ！', en: 'My kite is flying in the sky!' }, { jp: '風が つよい ひは、おかに くるんだ。', en: 'On windy days, I come up the hill.' }] },
    { at: '7', id: 'fh-beekeeper', kind: 'npc', sprite: 'villager-a', dir: 'down', wander: 1, name: { jp: 'はちかいの ミツオ', en: 'Mitsuo the Beekeeper' }, lines: [{ jp: '花が あると、はちが くる。はちが くると、りんごが できる。', en: 'Where there are flowers, bees come. Where bees come, apples grow.' }] },
    { at: '$', id: 'fh-chest-top', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 1, shards: 15 } },
    { at: '?', id: 'fh-chest-orchard', kind: 'chest', tile: 'chest', chest: { item: 'herb', n: 3, lock: { answer: 'りんご', jp: 'ふたに あかい くだものの え。なまえを となえよ。', en: 'A red fruit is painted on the lid. Chant its name.' } } },
  ],
}

/** Region 2 side area — the old dry well by the farmhouse drops into a cave with a hidden spring. */
export const FIELDS_WELL: MapSpec = {
  id: 'fields-well',
  name: 'The Dry Well Cave',
  jp: 'かれいどの どうくつ',
  region: 2,
  music: 'fields',
  interior: true,
  particles: 'dust',
  bg: '#0b0a14',
  tint: 'rgba(80, 110, 170, 0.18)',
  rows: EXTRA_LAYOUTS['fields-well'],
  legend: {
    C: { g: 'dirt', o: 'cliff' },
    R: { g: 'dirt', o: 'boulder' },
    r: { g: 'dirt', o: 'rock' },
  },
  spawn: 'rope',
  points: { v: { name: 'rope', dir: 'down' } },
  exits: [{ at: '0', to: 'fields', point: 'well', tile: 'stairs-up' }],
  entities: [
    { at: '1', id: 'fw-lamp', kind: 'landmark', tile: 'lantern', word: 'hi', name: { jp: 'ふるい ランプ', en: 'Old Lamp' }, lines: [{ jp: 'ひが きえている。', en: 'The flame has gone out.' }] },
    { at: '2', id: 'fw-tanuki', kind: 'npc', sprite: 'tanuki', dir: 'left', name: { jp: 'あなほりの ドッコ', en: 'Dokko the Digger' }, lines: [{ jp: 'ほり ほり…', en: 'Dig, dig…' }] },
    { at: '3', id: 'fw-spring', kind: 'landmark', tile: 'sign', word: 'izumi', name: { jp: 'ちかの いずみ', en: 'Underground Spring' }, lines: [{ jp: '泉の みずが しずかに わいている。', en: 'Spring water wells up quietly.' }] },
    { at: '4', id: 'fw-glowstone', kind: 'landmark', tile: 'rock', word: 'ishi', name: { jp: 'ひかる 石', en: 'Glowing Stone' }, lines: [{ jp: '石が ぼんやり ひかっている。', en: 'The stone glows faintly.' }] },
    { at: '5', id: 'fw-bat', kind: 'npc', sprite: 'bat', dir: 'down', name: { jp: 'こうもり', en: 'Bat' }, lines: [{ jp: 'キィ… キィ… (さかさまに ねている)', en: 'Skree… skree… (it’s sleeping upside down)' }] },
    { at: '$', id: 'fw-chest-gold', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 1, shards: 30, lock: { answer: 'きん', jp: 'ふたに「金」の 字。よみを となえよ。', en: 'The lid bears 金. Chant its reading.' } } },
    { at: '?', id: 'fw-chest-spring', kind: 'chest', tile: 'chest', chest: { item: 'herb', n: 2, shards: 5 } },
  ],
}

import type { MapSpec } from '../types'
import { LAYOUTS } from './layouts'

/** Region 2 — 元素の野: golden fields, rice paddies, a river and a racing track. */
export const FIELDS: MapSpec = {
  id: 'fields',
  name: 'The Elemental Fields',
  jp: '元素の野',
  region: 2,
  music: 'fields',
  particles: 'pollen',
  tint: 'rgba(255, 196, 100, 0.12)',
  rows: LAYOUTS.fields,
  spawn: 'south',
  inn: 'south',
  points: {
    q: { name: 'south', dir: 'up' },
    v: { name: 'east', dir: 'left' },
    j: { name: 'hill', dir: 'down' },
    l: { name: 'well', dir: 'right' },
  },
  exits: [
    { at: '9', to: 'village', point: 'gate' },
    { at: '0', to: 'forest', point: 'west' },
    { at: 'h', to: 'fields-hill', point: 'south' },
    { at: 'U', to: 'fields-well', point: 'rope', tile: 'well' },
  ],
  entities: [
    { at: '1', id: 'f-farmer', kind: 'activity', sprite: 'villager-a', dir: 'down', activities: ['r2-words-1'], name: { jp: 'たんぼの おじいさん', en: 'Old Rice Farmer' }, lines: [{ jp: 'つち、いし、た… だいちの ことばを おしえよう。', en: 'Earth, stone, rice paddy… let me teach you the words of the land.' }] },
    { at: '2', id: 'f-cauldron', kind: 'activity', tile: 'pot', activities: ['r2-evolve'], name: { jp: 'れんきんの かま', en: 'Alchemist’s Cauldron' }, lines: [{ jp: 'かまが ぐつぐつ にえている。木と 木を いれると…？', en: 'The cauldron bubbles. Add tree and tree and…?' }] },
    { at: '3', id: 'f-circle', kind: 'activity', tile: 'warp-circle', activities: ['r2-world'], name: { jp: 'だいちの まほうじん', en: 'Earth-Shaping Circle' }, lines: [{ jp: 'この まほうじんで、だいちを かたちづくれる。', en: 'With this circle, you can shape the land itself.' }] },
    { at: '4', id: 'f-racer', kind: 'activity', sprite: 'dog', dir: 'down', activities: ['r2-speed'], name: { jp: 'かけっこ いぬ', en: 'Racing Dog' }, lines: [{ jp: 'わん！ はやうち きょうそうだ！ ついて こられるか？', en: 'Woof! A speed-casting race! Can you keep up?' }] },
    { at: '5', id: 'f-fox', kind: 'activity', sprite: 'fox', dir: 'down', activities: ['r2-kata-1'], name: { jp: 'きつね', en: 'Fox Scribe' }, lines: [{ jp: 'コン。カタカナは とがった もじ。まねして かいてごらん。', en: 'Kon. Katakana are sharp letters. Try copying them.' }] },
    { at: 'E', id: 'f-kata-stones', kind: 'activity', tile: 'boulder', activities: ['r2-kata-2'], name: { jp: 'カタカナの いわ', en: 'Katakana Rocks' }, lines: [{ jp: 'いわに ハ、マ、ヤ… と するどい もじが きざまれている。', en: 'Sharp letters are carved in the rock: ha, ma, ya…' }] },
    { at: '!', id: 'f-sage', kind: 'activity', sprite: 'elder', dir: 'down', activities: ['r2-kanji-trace'], name: { jp: 'ふでの せんにん', en: 'Brush Sage' }, lines: [{ jp: '火、水、木… げんその かんじを かいてみよ。', en: 'Fire, water, tree… write the elemental kanji.' }] },
    { at: '/', id: 'f-traveller', kind: 'activity', sprite: 'villager-b', dir: 'left', wander: 1, activities: ['r2-words-2'], name: { jp: 'たびびと', en: 'Traveller' }, lines: [{ jp: 'おとこ、おんな、いち、に、さん。のはらの ことばを おしえましょう。', en: 'Man, woman, one, two, three. Let me teach you the words of the fields.' }] },
    { at: '+', id: 'f-cat', kind: 'activity', sprite: 'cat', dir: 'down', activities: ['r2-spot'], name: { jp: 'ばけねこ', en: 'Shape-Shifter Cat' }, lines: [{ jp: 'にゃ？ にせものが まぎれこんで いるにゃ。みやぶれるかにゃ？', en: 'Nya? Impostors are hiding among us. Can you see through them?' }] },
    { at: '6', id: 'f-golem', kind: 'boss', sprite: 'golem', activities: ['r2-boss'], name: { jp: 'ぶしゅのゴーレム', en: 'The Radical Golem' }, lines: [{ jp: 'ゴゴゴ… わが からだを わけてみよ。', en: 'Rumble… try to split my body, if you can.' }] },
    { at: '7', id: 'f-trial', kind: 'activity', tile: 'statue', activities: ['r2-mastery'], name: { jp: 'しれんの いし', en: 'Trial Stone' }, lines: [{ jp: 'のの しれん。にた かんじを みわけよ。', en: 'The fields’ trial. Tell look-alike kanji apart.' }] },
    { at: '8', id: 'f-sign', kind: 'sign', tile: 'sign', name: { jp: 'かんばん', en: 'Sign' }, lines: [{ jp: 'ひがし：文の森。ゴーレムが みちを ふさいでいる。', en: 'East: the Forest of Sentences. A golem blocks the road.' }] },
    { at: '$', id: 'f-chest-grass', kind: 'chest', tile: 'chest', chest: { item: 'herb', n: 2, shards: 10 } },
    { at: '?', id: 'f-chest-river', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 1, shards: 15, lock: { answer: 'みず', jp: 'ふたに「水」の 字。よみを となえよ。', en: 'The lid bears 水. Chant its reading.' } } },
    { at: '(', id: 'f-child', kind: 'npc', sprite: 'child', wander: 2, name: { jp: 'こども', en: 'Child' }, lines: [{ jp: 'かわに はしが あるよ。わたって みて！', en: 'There’s a bridge over the river. Try crossing it!' }] },
    { at: ')', id: 'f-farmhand', kind: 'npc', sprite: 'villager-a', wander: 2, name: { jp: 'はたけの ひと', en: 'Farmhand' }, lines: [{ jp: 'この はたけの やさいは おいしいよ。', en: 'The vegetables from this field are delicious.' }, { jp: 'たかい くさの 中には、まものが いるから きをつけて。', en: 'Monsters hide in the tall grass. Be careful.' }] },
    { at: ']', id: 'f-boulder', kind: 'landmark', tile: 'boulder', word: 'iwa', name: { jp: '大岩', en: 'Great Boulder' }, lines: [{ jp: '大きな 岩が ある。', en: 'There is a huge boulder.' }] },
    { at: '{', id: 'f-paddy-sign', kind: 'landmark', tile: 'sign', word: 'ta', name: { jp: 'たんぼの かんばん', en: 'Paddy Sign' }, lines: [{ jp: '「田」— ここは たんぼです。', en: '“田” — these are rice paddies.' }] },
  ],
}

import type { MapSpec } from '../types'
import { EXTRA_LAYOUTS } from './extra-layouts'

const DARK = {
  T: { g: 'grass-dark', o: 'tree' },
  P: { g: 'grass-dark', o: 'pine' },
  D: { g: 'grass-dark', o: 'door' },
  '^': { g: 'grass-dark', o: 'roof' },
  A: { g: 'grass-dark', o: 'roof-edge' },
  '#': { g: 'grass-dark', o: 'wall' },
  H: { g: 'grass-dark', o: 'wall-window' },
} as const

/** Region 3 side area — up the fox's secret trail: a dim hollow of mushrooms around a giant hollow tree. */
export const FOREST_HOLLOW: MapSpec = {
  id: 'forest-hollow',
  name: 'Mushroom Hollow',
  jp: 'きのこの くぼち',
  region: 3,
  music: 'forest',
  particles: 'fireflies',
  tint: 'rgba(40, 60, 110, 0.22)',
  rows: EXTRA_LAYOUTS['forest-hollow'],
  legend: { ...DARK },
  spawn: 'south',
  points: { v: { name: 'south', dir: 'up' } },
  exits: [{ at: '0', to: 'forest', point: 'hollow' }],
  entities: [
    { at: '1', id: 'foh-tree', kind: 'landmark', tile: 'stump', word: 'ki', name: { jp: 'うろの 大木', en: 'Great Hollow Tree' }, lines: [{ jp: 'とても 大きな 木。みきに ぽっかり あなが あいている。', en: 'An enormous tree, with a great hollow in its trunk.' }] },
    { at: '2', id: 'foh-herbalist', kind: 'npc', sprite: 'villager-b', dir: 'down', name: { jp: 'くすしの ヨモギ', en: 'Yomogi the Herbalist' }, lines: [{ jp: 'この きのこは たべられます。あの きのこは… たべないで！', en: 'This mushroom you can eat. That one… don’t eat it!' }] },
    { at: '3', id: 'foh-sprite', kind: 'npc', sprite: 'mushroom', dir: 'down', name: { jp: 'きのこの せい', en: 'Mushroom Sprite' }, lines: [{ jp: 'ぽこっ。わたしたち、よるに なると わに なって おどるの。', en: 'Pop! When night comes, we dance in a ring.' }] },
    { at: '4', id: 'foh-tanuki', kind: 'npc', sprite: 'tanuki', dir: 'down', name: { jp: 'ねぼすけ たぬき', en: 'Sleepy Tanuki' }, lines: [{ jp: 'ぐう… ぐう…', en: 'Snore… snore…' }] },
    { at: '5', id: 'foh-patch', kind: 'landmark', tile: 'bush', word: 'taberu', name: { jp: 'きのこの むれ', en: 'Mushroom Patch' }, lines: [{ jp: 'いろいろな きのこが はえている。…たべても いいのかな？', en: 'All kinds of mushrooms grow here. …Are they safe to eat?' }] },
    { at: '6', id: 'foh-owl', kind: 'landmark', tile: 'stump', word: 'neru', name: { jp: 'ふくろうの きりかぶ', en: 'Owl’s Stump' }, lines: [{ jp: 'ひるの あいだ、ふくろうが ここで ねている。', en: 'During the day, an owl sleeps here.' }] },
    { at: '7', id: 'foh-watcher', kind: 'npc', sprite: 'villager-a', dir: 'left', wander: 1, name: { jp: 'とりみの ケン', en: 'Ken the Bird-Watcher' }, lines: [{ jp: 'しーっ。とりを 見ています。', en: 'Shh. I’m watching birds.' }, { jp: 'あさ はやく おきると、たくさん 見られるよ。', en: 'If you get up early, you can see lots of them.' }] },
    { at: '$', id: 'foh-chest-root', kind: 'chest', tile: 'chest', chest: { item: 'smoke', n: 1, shards: 20 } },
    { at: '?', id: 'foh-chest-ring', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 1, shards: 15, lock: { answer: 'ねる', jp: '「よる、ふとんで ＿＿」。こたえを となえよ。', en: '“At night, in my futon, I ___.” Chant the verb.' } } },
  ],
}

/** Region 3 side area — east through the pines: a misty lake with a fishing hut and a long pier. */
export const FOREST_LAKE: MapSpec = {
  id: 'forest-lake',
  name: 'Misty Lake',
  jp: 'きりの みずうみ',
  region: 3,
  music: 'forest',
  particles: 'dust',
  tint: 'rgba(170, 190, 210, 0.16)',
  rows: EXTRA_LAYOUTS['forest-lake'],
  legend: { ...DARK },
  spawn: 'west',
  points: { v: { name: 'west', dir: 'right' } },
  exits: [{ at: '0', to: 'forest', point: 'lake' }],
  entities: [
    { at: '1', id: 'fol-angler', kind: 'npc', sprite: 'elder', dir: 'right', name: { jp: 'つりの おじいさん', en: 'Old Angler' }, lines: [{ jp: 'さかなは まつ ものじゃ。', en: 'Fishing is all about waiting.' }] },
    { at: '2', id: 'fol-boat', kind: 'landmark', tile: 'boat', word: 'wataru', name: { jp: 'こぶね', en: 'Little Boat' }, lines: [{ jp: 'みずうみを わたる ための こぶね。', en: 'A little boat for crossing the lake.' }] },
    { at: '3', id: 'fol-child', kind: 'npc', sprite: 'child', wander: 1, name: { jp: 'いしなげの ナミ', en: 'Nami the Stone-Skipper' }, lines: [{ jp: 'いしを なげると、ぴょん ぴょん はねるよ！', en: 'Throw a stone and it skips — hop, hop!' }, { jp: 'きのうは 五かい はねたの！', en: 'Yesterday mine skipped five times!' }] },
    { at: '4', id: 'fol-bell', kind: 'landmark', tile: 'shrine-bell', word: 'kiku', name: { jp: 'きりの かね', en: 'Mist Bell' }, lines: [{ jp: 'きりの ひに ならす かね。よく きいて…', en: 'A bell rung on misty days. Listen closely…' }] },
    { at: '5', id: 'fol-mist', kind: 'npc', sprite: 'wisp', dir: 'down', name: { jp: 'きりの せい', en: 'Mist Spirit' }, lines: [{ jp: 'ふわ… ふわ… きりは あさに きえるの。', en: 'Drift… drift… the mist fades with the morning.' }] },
    { at: '6', id: 'fol-net', kind: 'landmark', tile: 'net', name: { jp: 'あみほし', en: 'Drying Nets' }, lines: [{ jp: 'あみが ほしてある。さかなの におい。', en: 'Nets hung out to dry. It smells of fish.' }] },
    { at: '7', id: 'fol-sign', kind: 'landmark', tile: 'sign', word: 'nomu', name: { jp: 'みずうみの たてふだ', en: 'Lake Notice' }, lines: [{ jp: '「この みずは のまないで ください。」', en: '“Please do not drink this water.”' }] },
    { at: '$', id: 'fol-chest-shore', kind: 'chest', tile: 'chest', chest: { item: 'charm', n: 1, shards: 20, lock: { answer: 'まつ', jp: '「ともだちを ＿＿」。こたえを となえよ。', en: '“To ___ for a friend” (wait). Chant the verb.' } } },
  ],
}

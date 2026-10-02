import type { MapSpec } from '../types'
import { EXTRA_LAYOUTS } from './extra-layouts'

/** Region 4 side area — a winding tunnel of red torii up the mountain to the inner sanctuary. */
export const SHRINE_TORII: MapSpec = {
  id: 'shrine-torii',
  name: 'Path of a Thousand Torii',
  jp: 'せんぼん とりい',
  region: 4,
  music: 'shrine',
  particles: 'fireflies',
  tint: 'rgba(200, 80, 70, 0.12)',
  rows: EXTRA_LAYOUTS['shrine-torii'],
  spawn: 'south',
  points: { v: { name: 'south', dir: 'up' } },
  exits: [{ at: '0', to: 'shrine', point: 'torii' }],
  entities: [
    { at: '1', id: 'st-okunoin', kind: 'landmark', tile: 'altar', word: 'jinja', name: { jp: 'おくのいん', en: 'Inner Sanctuary' }, lines: [{ jp: '山の うえの ちいさな おやしろ。とても 静かだ。', en: 'A small sanctuary on the mountaintop. It is very quiet.' }] },
    { at: '2', id: 'st-fox', kind: 'npc', sprite: 'fox', dir: 'down', name: { jp: 'いなりの つかい', en: 'Inari’s Messenger' }, lines: [{ jp: 'コン。よく のぼって きたね。', en: 'Kon. You climbed all the way up.' }] },
    { at: '3', id: 'st-lookout', kind: 'landmark', tile: 'sign', word: 'takai', name: { jp: 'てんぼうだい', en: 'Lookout' }, lines: [{ jp: 'ここは 高い！ もりも、のはらも、むらも 見える。', en: 'So high up! You can see the forest, the fields, even the village.' }] },
    { at: '4', id: 'st-pilgrim', kind: 'npc', sprite: 'villager-a', dir: 'down', name: { jp: 'つかれた さんぱいしゃ', en: 'Weary Pilgrim' }, lines: [{ jp: 'この みちは 長い… とりいが せんぼんも あるんだ。', en: 'This path is long… there are a thousand torii.' }, { jp: 'でも、上の けしきは きれいですよ。', en: 'But the view from the top is beautiful.' }] },
    { at: '5', id: 'st-counter', kind: 'npc', sprite: 'child', wander: 1, name: { jp: 'かぞえる こ', en: 'Counting Kid' }, lines: [{ jp: 'いち、に、さん… きゅうじゅうきゅう！ あれ、なんぼん だっけ？', en: 'One, two, three… ninety-nine! Wait, how many was that?' }] },
    { at: '6', id: 'st-donors', kind: 'landmark', tile: 'tablet', word: 'nagai', name: { jp: 'きしんの いしぶみ', en: 'Donors’ Stone' }, lines: [{ jp: 'とりいを おさめた 人の 名前が、長く 長く ならんでいる。', en: 'The names of everyone who gave a torii, in a long, long list.' }] },
    { at: '7', id: 'st-amazake', kind: 'landmark', tile: 'stall', word: 'atsui', name: { jp: 'あまざけの みせ', en: 'Amazake Stand' }, lines: [{ jp: '「あつい あまざけ あります」… みせの 人は いない。', en: '“Hot amazake here”… but nobody is minding the stand.' }] },
    { at: '$', id: 'st-chest-lookout', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 1, shards: 20 } },
    { at: '?', id: 'st-chest-path', kind: 'chest', tile: 'chest', chest: { item: 'charm', n: 1, shards: 20, lock: { answer: 'あかい', jp: 'ふたに「赤」の 字。「＿＿ とりい」。こたえを となえよ。', en: 'The lid bears 赤: “the ___ torii”. Chant the adjective.' } } },
  ],
}

/** Region 4 side area — east of the hall: a raked-sand and moss garden with a teahouse. */
export const SHRINE_GARDEN: MapSpec = {
  id: 'shrine-garden',
  name: 'Moss Garden Teahouse',
  jp: 'こけの にわの ちゃしつ',
  region: 4,
  music: 'shrine',
  particles: 'sakura',
  tint: 'rgba(120, 160, 110, 0.12)',
  rows: EXTRA_LAYOUTS['shrine-garden'],
  legend: { '#': { g: 'grass-dark', o: 'wall' } },
  spawn: 'west',
  points: { v: { name: 'west', dir: 'right' } },
  exits: [{ at: '0', to: 'shrine', point: 'garden' }],
  entities: [
    { at: '1', id: 'sg-teamaster', kind: 'npc', sprite: 'elder', dir: 'down', name: { jp: 'ちゃじんの セン', en: 'Sen the Tea Master' }, lines: [{ jp: 'ようこそ。おちゃを どうぞ。', en: 'Welcome. Please, have some tea.' }] },
    { at: '2', id: 'sg-kettle', kind: 'landmark', tile: 'pot', word: 'atsui', name: { jp: 'てつびん', en: 'Iron Kettle' }, lines: [{ jp: 'てつびんが しゅんしゅん いっている。とても あつい。', en: 'The kettle is singing. It’s very hot.' }] },
    { at: '3', id: 'sg-gardener', kind: 'npc', sprite: 'villager-a', dir: 'right', wander: 1, name: { jp: 'にわしの イシ', en: 'Ishi the Gardener' }, lines: [{ jp: 'すなに なみを かいているんです。', en: 'I’m drawing waves in the sand.' }, { jp: 'この にわは 静かでしょう？', en: 'This garden is quiet, isn’t it?' }] },
    { at: '4', id: 'sg-stone', kind: 'landmark', tile: 'rock', word: 'shizuka', name: { jp: 'しじまの いし', en: 'Silent Stone' }, lines: [{ jp: '石は なにも いわない。とても 静かだ。', en: 'The stone says nothing. All is quiet.' }] },
    { at: '5', id: 'sg-moss', kind: 'landmark', tile: 'bush', word: 'kirei', name: { jp: 'こけの とこ', en: 'Moss Bed' }, lines: [{ jp: 'みどりの こけが、ほんとうに きれいだ。', en: 'The green moss is truly beautiful.' }] },
    { at: '6', id: 'sg-cat', kind: 'npc', sprite: 'cat', wander: 2, name: { jp: 'にわの ねこ', en: 'Garden Cat' }, lines: [{ jp: 'にゃ… (いけの こいを じっと 見ている)', en: 'Nya… (it’s staring at the koi in the pond)' }] },
    { at: '$', id: 'sg-chest-maple', kind: 'chest', tile: 'chest', chest: { item: 'herb', n: 2, shards: 15 } },
    { at: '?', id: 'sg-chest-moss', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 1, shards: 20, lock: { answer: 'きれい', jp: '「＿＿な にわ」。こたえを となえよ。', en: '“A ___ garden” (beautiful). Chant the word.' } } },
  ],
}

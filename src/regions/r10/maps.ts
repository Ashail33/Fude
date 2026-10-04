import type { Cell, MapSpec } from '../../world/types'
import { LAYOUTS } from './layouts'

/** Shared look of the floating city: cloud ground over open sky, red-lacquered walkways, vermilion roofs. */
const SKY: Record<string, Cell> = {
  '.': { g: 'cloud' },
  '~': { g: 'sky' },
  M: { g: 'sky', o: 'carpet' },
  '^': { g: 'cloud', o: 'roof-red' },
  A: { g: 'cloud', o: 'roof-red-edge' },
  '#': { g: 'cloud', o: 'wall' },
  H: { g: 'cloud', o: 'wall-window' },
  D: { g: 'cloud', o: 'door' },
  c: { g: 'path', o: 'chochin' },
  L: { g: 'cloud', o: 'lantern' },
  f: { g: 'cloud', o: 'fence' },
  b: { g: 'cloud', o: 'bush' },
  R: { g: 'cloud', o: 'boulder' },
  S: { g: 'cloud', o: 'statue' },
  K: { g: 'cloud', o: 'sakura' },
  P: { g: 'cloud', o: 'pine' },
}

/**
 * Region 10 — 雲の都: palaces floating above the weather. The rainbow bridge
 * from the Snow Temple lands at the west gate; lacquered walkways link the
 * cloud islands: the weather-readers' terrace, the star observatory, the
 * storm-wrapped thunder-drum hall, the market plaza with its rain pool, the
 * pine cliff, the cloud-folk houses, the sky-garden stair and, far east, the
 * last stair towards the Tower of Creation.
 */
export const CLOUDS: MapSpec = {
  id: 'clouds',
  name: 'The Cloud Capital',
  jp: '雲の都',
  region: 10,
  music: 'clouds',
  particles: 'sparkles',
  bg: '#7fc4f0',
  tint: 'rgba(170, 150, 255, 0.10)',
  rows: LAYOUTS.clouds,
  legend: { ...SKY, x: { g: 'stone-floor', o: 'crate' }, e: { g: 'stone-floor', o: 'barrel' }, p: { g: 'stone-floor', o: 'pot' } },
  spawn: 'west',
  inn: 'west',
  points: {
    q: { name: 'west', dir: 'right' },
    j: { name: 'east', dir: 'left' },
    U: { name: 'hall', dir: 'down' },
    v: { name: 'obs', dir: 'down' },
    y: { name: 'garden', dir: 'up' },
  },
  exits: [
    { at: '0', to: '@prev', point: 'east', tile: 'carpet' },
    { at: '9', to: '@next', point: 'west', tile: 'stairs-up' },
    { at: 'd', to: 'clouds-hall', point: 'door', tile: 'door' },
    { at: 'h', to: 'clouds-observatory', point: 'door', tile: 'door' },
    { at: '8', to: 'clouds-garden', point: 'gate', tile: 'stairs-down' },
  ],
  entities: [
    // ── the west gate, where the rainbow bridge lands
    { at: '[', id: 'c-amane', kind: 'npc', sprite: 'tennin', dir: 'down', name: { jp: 'てんにんの アマネ', en: 'Amane the Celestial' }, lines: [{ jp: 'ようこそ、雲の… みやこ… ことば… われて…', en: 'Welcome to the Cloud… capital… words… breaking…' }] },
    { at: ']', id: 'c-sign', kind: 'sign', tile: 'sign', name: { jp: 'かんばん', en: 'Signpost' }, lines: [{ jp: 'にし：にじの はし（雪の 寺へ）。ひがし：くだりの かいだん（えきまちへ）。', en: 'West: the rainbow bridge (to the Snow Temple). East: the stair down (to the Station Town).' }, { jp: 'きた：ほしの やかた・かみなりの たいこどの。みなみ：そらの にわ。', en: 'North: the star observatory and the thunder-drum hall. South: the sky garden.' }] },
    { at: '{', id: 'c-rainbow', kind: 'landmark', tile: 'statue', word: 'niji', name: { jp: 'にじの はしら', en: 'Rainbow Pillar' }, lines: [{ jp: 'にじの はしの はしら。七つの 色が、ゆっくり まわって いる。', en: 'The pillar of the rainbow bridge. Seven colours turn slowly around it.' }] },
    // ── the weather-readers' terrace
    { at: '1', id: 'c-shepherd', kind: 'activity', sprite: 'child', dir: 'left', wander: 1, activities: ['r10-words-1'], name: { jp: '雲かいの ソラタ', en: 'Sorata the Cloud-Herder' }, lines: [{ jp: '雲を… かってるんだ。晴れ、くもり、きり… 天気の ことば、おしえる…よ！', en: 'I herd… clouds. Clear, cloudy, fog… I’ll teach you… weather words!' }] },
    { at: '2', id: 'c-shigure', kind: 'activity', sprite: 'villager-b', dir: 'down', activities: ['r10-forecast'], name: { jp: '天気よみの シグレ', en: 'Shigure the Weather-Reader' }, lines: [{ jp: 'あしたは… 晴れ… でし… ドン！ …ああ、また よほうが こわれた！', en: 'Tomorrow will be… clear… prob— BOOM! …Ugh, my forecast broke again!' }] },
    { at: '3', id: 'c-kite', kind: 'landmark', tile: 'sign', word: 'tenki-yohou', name: { jp: 'よほうの たこ', en: 'Forecast Kite' }, lines: [{ jp: 'まいあさ、あしたの 天気を 書いて あげる 大きな たこ。きょうの 字は、ばらばらだ。', en: 'A great kite that carries tomorrow’s weather up into the sky each morning. Today its letters are scattered.' }] },
    { at: 'z', id: 'c-cat', kind: 'npc', sprite: 'cat', wander: 2, name: { jp: '雲ねこ', en: 'Cloud Cat' }, lines: [{ jp: 'にゃ。（しっぽが ふわふわの 雲に なって いる）', en: 'Nya. (Its tail is a fluffy little cloud.)' }] },
    // ── the market plaza
    { at: '4', id: 'c-chimes', kind: 'activity', tile: 'shrine-bell', activities: ['r10-listen'], name: { jp: 'ふうりんの あずまや', en: 'Wind-Chime Pavilion' }, lines: [{ jp: 'ちりん… ちりん… 雷の 音を、ふうりんが まねして いる。', en: 'Chirin… chirin… the wind chimes echo whatever the thunder says.' }] },
    { at: '5', id: 'c-poet', kind: 'activity', sprite: 'villager-a', dir: 'down', wander: 1, activities: ['r10-words-3'], name: { jp: 'うたよみの ハルカゼ', en: 'Harukaze the Poet' }, lines: [{ jp: 'たのしい… かなしい… さびしい… きもちの ことばが、ちぎれて とんで いく…', en: 'Fun… sad… lonely… the words for feelings are torn and blowing away…' }] },
    { at: '6', id: 'c-candy', kind: 'activity', sprite: 'merchant', dir: 'down', activities: ['r10-words-4'], name: { jp: '雲がしやの モモ', en: 'Momo the Cloud-Candy Seller' }, lines: [{ jp: 'いらっしゃい！ こっちの 雲がしの ほうが… もっと… 大き… ドン！ …もう！', en: 'Welcome! This cloud candy is… more… big… BOOM! …Oh, come on!' }] },
    { at: '7', id: 'c-painter', kind: 'activity', sprite: 'elder', dir: 'down', activities: ['r10-forms'], name: { jp: 'かんばんやの ゲン', en: 'Gen the Sign-Painter' }, lines: [{ jp: 'かんばんの どうしが、みんな おかしな かたちに なった。「よむ」「よまない」「よめる」… なおして くれんか。', en: 'All the verbs on the shop signs have gone into odd shapes. よむ, よまない, よめる… will you help me fix them?' }] },
    { at: '/', id: 'c-kid', kind: 'npc', sprite: 'child', wander: 2, name: { jp: 'おへそを かくす 子', en: 'Kid Hiding Their Belly Button' }, lines: [{ jp: 'かみなりさまに おへそを とられる！ だから、ずっと おなかを かくして いるの！', en: 'The thunder god steals belly buttons! So I keep my tummy covered all the time!' }] },
    // ── the thunder-drum hall
    { at: '!', id: 'c-captain', kind: 'activity', sprite: 'guard', dir: 'down', activities: ['r10-combat'], name: { jp: '雲のへいたいちょう', en: 'Sky-Guard Captain' }, lines: [{ jp: 'らいじゅうが 雲の くさむらに… でる。じゅもんを うて… たいじ…！', en: 'Raijū… in the cloud-grass. Cast your spells… drive them off…!' }] },
    { at: 'i', id: 'c-hall-guard', kind: 'npc', sprite: 'guard', dir: 'down', name: { jp: 'たいこどのの もんばん', en: 'Drum-Hall Gatekeeper' }, lines: [{ jp: 'ドン！ …なか… あぶない… ドン！ …かみなりさま、おこって…', en: 'BOOM! …Inside… dangerous… BOOM! …The thunder god, angry…' }] },
    { at: '+', id: 'c-rod', kind: 'landmark', tile: 'statue', word: 'kaminari', name: { jp: 'ひらいしん', en: 'Lightning Rod' }, lines: [{ jp: 'きんぞくの はしら。上の ほうが、まだ すこし あつい。', en: 'A metal pillar. The top is still a little warm.' }] },
    { at: '?', id: 'c-chest-hall', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 2, shards: 40, lock: { answer: 'かみなり', jp: 'ふたに「雷」。よみを となえよ。', en: 'The lid bears 雷. Chant its reading.' } } },
    // ── the tower road
    { at: '(', id: 'c-watch', kind: 'activity', sprite: 'guard', dir: 'down', activities: ['r10-defense'], name: { jp: 'じょうへきの みはり', en: 'Rampart Watch' }, lines: [{ jp: 'ひょうが… ふって くる！ ことばの 大きさの ひょう… なまえを よんで、わって くれ！', en: 'Hail… falling! Hailstones the size of words… call their names and smash them!' }] },
    { at: ')', id: 'c-stone', kind: 'activity', tile: 'statue', activities: ['r10-speed'], name: { jp: 'いなずまいし', en: 'Lightning Stone' }, lines: [{ jp: 'いなずまに うたれた いし。「ここから さきは、さいごの のぼり」と ほって ある。', en: 'A stone once struck by lightning. Carved on it: “From here on, the last climb.”' }] },
    // ── the pine cliff
    { at: 'E', id: 'c-fog', kind: 'landmark', tile: 'rock', word: 'kiri', name: { jp: 'きりいし', en: 'Fog Stone' }, lines: [{ jp: 'いつも うすい きりに つつまれた いし。さわると つめたい。', en: 'A stone always wrapped in thin fog. Cold to the touch.' }] },
    { at: '$', id: 'c-chest-pine', kind: 'chest', tile: 'chest', chest: { item: 'herb', n: 3, shards: 25 } },
    // ── the cloud-folk houses
    { at: 'l', id: 'c-grandma', kind: 'npc', sprite: 'innkeeper', wander: 1, name: { jp: '雲だの おばあさん', en: 'Grandma of the Cloud Field' }, lines: [{ jp: 'うちの 雲だで、ゆうべ なにか ひかったよ。ドーンと おちて きて…', en: 'Something lit up in our cloud-field last night. Came down with a great BOOM…' }] },
  ],
}

/** The thunder-drum hall: a ring of drums around the dais where Raijin plays. */
export const CLOUDS_HALL: MapSpec = {
  id: 'clouds-hall',
  name: 'Thunder-Drum Hall',
  jp: 'かみなりの たいこどの',
  region: 10,
  music: 'clouds',
  interior: true,
  particles: 'dust',
  bg: '#0e0b1c',
  tint: 'rgba(120, 90, 210, 0.2)',
  rows: LAYOUTS['clouds-hall'],
  legend: { e: { g: 'stone-floor', o: 'barrel' }, k: { g: 'stone-floor', o: 'bookshelf' }, M: { g: 'stone-floor', o: 'carpet' } },
  spawn: 'door',
  points: { v: { name: 'door', dir: 'up' } },
  exits: [{ at: '0', to: 'clouds', point: 'hall', tile: 'carpet' }],
  entities: [
    { at: '1', id: 'ch-raijin', kind: 'boss', sprite: 'raijin', activities: ['r10-boss'], name: { jp: 'らいじん', en: 'Raijin the Thunder God' }, lines: [{ jp: 'ドン！ ドドン！ ことばなど、こなごなに して くれる！', en: 'BOOM! BA-BOOM! I’ll drum your words to dust!' }] },
    { at: '2', id: 'ch-drum', kind: 'activity', tile: 'altar', activities: ['r10-mastery'], name: { jp: 'おおだいこ', en: 'The Great Drum' }, lines: [{ jp: 'ひとつ たたけば、ぶんが ひとつ くみあがる… そんな ふしぎな たいこ。', en: 'Strike it once and a whole sentence falls into place… a mysterious drum.' }] },
    { at: '3', id: 'ch-drummer', kind: 'npc', sprite: 'villager-a', dir: 'left', name: { jp: 'みならいの たいこうち', en: 'Apprentice Drummer' }, lines: [{ jp: 'かみなりさまの たいこ… いつもは もっと やさしい 音なんです…', en: 'The thunder god’s drums… they usually sound much gentler…' }] },
    { at: '$', id: 'ch-chest', kind: 'chest', tile: 'chest', chest: { item: 'charm', n: 1, shards: 45 } },
  ],
}

/** The star observatory: the great telescope, star charts and the old sky-scholar. */
export const CLOUDS_OBSERVATORY: MapSpec = {
  id: 'clouds-observatory',
  name: 'Star Observatory',
  jp: 'ほしの やかた',
  region: 10,
  music: 'clouds',
  interior: true,
  particles: 'sparkles',
  bg: '#0b0a14',
  tint: 'rgba(90, 110, 220, 0.14)',
  rows: LAYOUTS['clouds-observatory'],
  spawn: 'door',
  points: { v: { name: 'door', dir: 'up' } },
  exits: [{ at: '0', to: 'clouds', point: 'obs', tile: 'carpet' }],
  entities: [
    { at: '1', id: 'co-hakase', kind: 'activity', sprite: 'scholar', dir: 'down', activities: ['r10-opinions'], name: { jp: 'そらの はかせ', en: 'The Sky-Scholar' }, lines: [{ jp: 'ふむ。わしは ほしと 天気を しらべて おる。…しつもんが あるかね？', en: 'Hm. I study the stars and the weather. …Have you a question?' }] },
    { at: '2', id: 'co-apprentice', kind: 'activity', sprite: 'child', dir: 'right', activities: ['r10-words-2'], name: { jp: 'でしの ミチル', en: 'Michiru the Apprentice' }, lines: [{ jp: '思う、考える、決める… はかせの くちぐせ、ぜんぶ おぼえたよ！ おしえて あげる！', en: 'Think, consider, decide… I’ve learned all the scholar’s favourite words! I’ll teach you!' }] },
    { at: '3', id: 'co-telescope', kind: 'activity', tile: 'statue', activities: ['r10-cross'], name: { jp: 'おおぼうえんきょう', en: 'The Great Telescope' }, lines: [{ jp: 'のぞくと、ほしと ほしの あいだに、ことばの せいざが 見える。', en: 'Look through it, and between the stars you can see constellations made of words.' }] },
    { at: '4', id: 'co-chart', kind: 'activity', tile: 'altar', activities: ['r10-forge'], name: { jp: 'せいずの つくえ', en: 'Star-Chart Table' }, lines: [{ jp: 'ちらばった ことばを、せいざの ように ぶんに つなごう。', en: 'Join the scattered words into sentences, the way stars join into constellations.' }] },
    { at: '$', id: 'co-chest', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 1, shards: 30 } },
  ],
}

/** The sky garden: floating lawns, a moon-pond, an old plum grove, tablets and a tiny shrine of learning. */
export const CLOUDS_GARDEN: MapSpec = {
  id: 'clouds-garden',
  name: 'The Sky Garden',
  jp: 'そらの にわ',
  region: 10,
  music: 'clouds',
  particles: 'pollen',
  bg: '#7fc4f0',
  tint: 'rgba(255, 200, 230, 0.08)',
  rows: LAYOUTS['clouds-garden'],
  legend: SKY,
  spawn: 'gate',
  points: { q: { name: 'gate', dir: 'down' } },
  exits: [{ at: '0', to: 'clouds', point: 'garden', tile: 'stairs-up' }],
  entities: [
    { at: '1', id: 'cg-tablet', kind: 'activity', tile: 'tablet', activities: ['r10-runes'], name: { jp: 'そらにわの いしぶみ', en: 'Sky-Garden Tablet' }, lines: [{ jp: 'むかしの 天気よみが のこした いしぶみ。よみがなは ない。', en: 'A tablet left by weather-readers of old. No readings are given.' }] },
    { at: '2', id: 'cg-plum', kind: 'landmark', tile: 'sakura', word: 'omoide', name: { jp: 'ふるい うめの 木', en: 'Old Plum Tree' }, lines: [{ jp: 'とても ふるい うめの 木。花の かおりが、なにかを 思い出させる。', en: 'A very old plum tree. The scent of its blossoms brings something back to mind.' }] },
    { at: '3', id: 'cg-gardener', kind: 'npc', sprite: 'elder', wander: 1, name: { jp: 'にわし', en: 'Gardener' }, lines: [{ jp: 'この にわの 花は、雨の ほうが 好きな 花と、晴れの ほうが 好きな 花が ある。', en: 'In this garden, some flowers like rain better, and some like sunshine better.' }] },
    { at: '4', id: 'cg-shrine', kind: 'landmark', tile: 'shrine-bell', word: 'oboeru', name: { jp: 'てんじんさまの ほこら', en: 'Shrine of Tenjin' }, lines: [{ jp: 'まなびの かみさまの ちいさな ほこら。「よく おぼえられますように」と えまが かかって いる。', en: 'A tiny shrine to the god of learning. A votive plaque reads: “May I remember well.”' }] },
    { at: '5', id: 'cg-sunflower', kind: 'landmark', tile: 'pot', word: 'hare', name: { jp: 'ひまわりの はちうえ', en: 'Potted Sunflower' }, lines: [{ jp: '晴れの 日にだけ さく ひまわり。いまは、うつむいて いる。', en: 'A sunflower that only opens on clear days. Right now its head is bowed.' }] },
    { at: '$', id: 'cg-chest', kind: 'chest', tile: 'chest', chest: { item: 'herb', n: 2, shards: 30 } },
    { at: '?', id: 'cg-chest-lock', kind: 'chest', tile: 'chest', chest: { item: 'charm', n: 1, shards: 40, lock: { answer: 'ゆうき', jp: 'ふたに「勇気」。よみを となえよ。', en: 'The lid bears 勇気. Chant its reading.' } } },
  ],
}

export const MAPS: MapSpec[] = [CLOUDS, CLOUDS_HALL, CLOUDS_OBSERVATORY, CLOUDS_GARDEN]

import type { Cell, MapSpec } from '../../world/types'
import { LAYOUTS } from './layouts'

/**
 * Region 12 — こころの谷: a valley village in autumn, getting ready for its
 * kagura festival.
 *
 * kokoro            the village: the west gate and teahouse, the mask carver's
 *                   workshop among the maples (NW), the hill shrine (N), the
 *                   river and its lantern bridge, the festival street of stalls
 *                   and paper lanterns (E), the kagura hall (NE), the rice
 *                   terraces (SW), and through the bamboo (SE) the lonely old
 *                   farmhouse and the path down to the firefly grove
 * kokoro-workshop   Kaede's workshop: a wall of masks, the carving bench
 * kokoro-stage      the kagura hall: the stage, the great drum, backstage
 * kokoro-grove      the firefly bamboo grove by the river, at night
 * kokoro-farmhouse  the old farmhouse: tatami, a hearth, a diary on the shelf
 */

/** The valley's look: red maples (the sakura tile in autumn light), vermilion shrine roofs, paper lanterns, bamboo. */
const VALLEY: Record<string, Cell> = {
  v: { g: 'grass', o: 'roof-red' },
  y: { g: 'grass', o: 'roof-red-edge' },
  c: { g: 'path', o: 'chochin' },
  B: { g: 'grass-dark', o: 'bamboo' },
}

/** Wooden interiors: crates, barrels and pots stand on the floorboards. */
const INSIDE: Record<string, Cell> = {
  x: { g: 'wood-floor', o: 'crate' },
  e: { g: 'wood-floor', o: 'barrel' },
  p: { g: 'wood-floor', o: 'pot' },
}

export const KOKORO: MapSpec = {
  id: 'kokoro',
  name: 'The Valley of Hearts',
  jp: 'こころの谷',
  region: 12,
  music: 'kokoro',
  particles: 'sakura',
  bg: '#3a2a22',
  tint: 'rgba(255, 140, 70, 0.10)',
  rows: LAYOUTS.kokoro,
  legend: VALLEY,
  spawn: 'west',
  inn: 'west',
  points: {
    q: { name: 'west', dir: 'right' },
    j: { name: 'east', dir: 'left' },
    'ⓦ': { name: 'workshop', dir: 'down' },
    'ⓢ': { name: 'stage', dir: 'down' },
    'ⓕ': { name: 'farmhouse', dir: 'down' },
    'ⓖ': { name: 'grove', dir: 'up' },
  },
  exits: [
    { at: '0', to: '@prev', point: 'east' },
    { at: '9', to: '@next', point: 'west' },
    { at: 'd', to: 'kokoro-workshop', point: 'door', tile: 'door' },
    { at: 'h', to: 'kokoro-stage', point: 'door', tile: 'door' },
    { at: 'm', to: 'kokoro-farmhouse', point: 'door', tile: 'door' },
    { at: '8', to: 'kokoro-grove', point: 'gate', tile: 'stairs-down' },
  ],
  entities: [
    // ── the west gate and the teahouse
    { at: 'α', id: 'ko-hotaru', kind: 'npc', sprite: 'child', dir: 'right', name: { jp: 'ほたるの こ ホタル', en: 'Hotaru the Firefly Child' }, lines: [{ jp: 'あっ、ことばが 見える 人だ！ ねえ、この 谷の みんなの 顔、見て…', en: 'Oh! Someone who can see words! Hey, look at everyone’s faces in this valley…' }] },
    { at: 'β', id: 'ko-sign', kind: 'sign', tile: 'sign', name: { jp: 'かんばん', en: 'Signpost' }, lines: [{ jp: 'にし：おしゃべりの えきまち。ひがし：そうぞうの とう。', en: 'West: the Chattering Station Town. East: the Tower of Creation.' }, { jp: 'きた：めんの こうぼう・やまの おみや。ひがし きた：かぐらでん。みなみ：たんぼと ふるい いえ。', en: 'North: the mask workshop and the hill shrine. North-east: the kagura hall. South: the rice terraces and the old farmhouse.' }] },
    { at: 'γ', id: 'ko-teahouse', kind: 'activity', sprite: 'villager-b', dir: 'left', activities: ['r12-words-1'], name: { jp: 'ちゃみせの ハナエ', en: 'Hanae of the Teahouse' }, lines: [{ jp: 'いらっしゃい… うれしい？ かなしい？ わたし、じぶんの きもちが わからないの。', en: 'Welcome… am I happy? Sad? I can’t tell how I feel anymore.' }] },
    { at: 'δ', id: 'ko-maple', kind: 'landmark', tile: 'sakura', word: 'natsukashii', name: { jp: 'おおもみじ', en: 'Great Maple' }, lines: [{ jp: 'たにで いちばん ふるい もみじ。あかい はっぱが、むかしの においを はこんで くる。', en: 'The oldest maple in the valley. Its red leaves carry the smell of long ago.' }] },
    { at: 'ε', id: 'ko-well', kind: 'landmark', tile: 'well', word: 'namida', name: { jp: 'なみだの いど', en: 'Well of Tears' }, lines: [{ jp: '「かなしい ときは ここで なきなさい」と、いどの ふちに ほって ある。', en: 'Carved on the rim: “When you are sad, come here and cry.”' }] },
    { at: 'χ', id: 'ko-cat', kind: 'npc', sprite: 'cat', wander: 2, name: { jp: 'もみじねこ', en: 'Maple Cat' }, lines: [{ jp: 'にゃ。（ねこの 顔だけは、こおって いない）', en: 'Nya. (Only the cat’s face hasn’t frozen.)' }] },
    // ── the hill shrine
    { at: 'ζ', id: 'ko-priest', kind: 'activity', sprite: 'priest', dir: 'down', activities: ['r12-words-3'], name: { jp: 'かんぬしの シノブ', en: 'Shinobu the Priest' }, lines: [{ jp: 'あい、こい、かんしゃ… こころの ことばが、おみやから きえて いく。', en: 'Love, romance, gratitude… the words of the heart are fading from the shrine.' }] },
    { at: 'η', id: 'ko-bell', kind: 'landmark', tile: 'shrine-bell', word: 'kansha', name: { jp: 'おれいの すず', en: 'Bell of Thanks' }, lines: [{ jp: 'ありがとうを いいたい とき、ならす すず。いまは、だれも ならさない。', en: 'A bell you ring when you want to say thank you. Lately, no one rings it.' }] },
    // ── the river and the lantern bridge
    { at: 'θ', id: 'ko-taro', kind: 'activity', sprite: 'child', dir: 'left', wander: 1, activities: ['r12-words-2'], name: { jp: 'なきむしの タロウ', en: 'Taro the Crybaby' }, lines: [{ jp: 'なきたいのに、なけないんだ。顔が うごかない…', en: 'I want to cry, but I can’t. My face won’t move…' }] },
    { at: 'ι', id: 'ko-gen', kind: 'activity', sprite: 'elder', dir: 'down', activities: ['r12-wishes'], name: { jp: 'かたりべの ゲン', en: 'Gen the Storyteller' }, lines: [{ jp: '「〜して ほしい」「〜すれば よかった」… わしの はなしの ことばが、こおって しまった。', en: '“I want you to…”, “I wish I had…” …the words of my tales have frozen solid.' }] },
    { at: 'κ', id: 'ko-lantern', kind: 'landmark', tile: 'lantern', word: 'kitai', name: { jp: 'ねがいの とうろう', en: 'Wishing Lantern' }, lines: [{ jp: 'まつりの まえの ばん、ねがいを こめて ひを ともす とうろう。ひは きえて いる。', en: 'On the night before the festival, people light this lantern with a wish. Its flame is out.' }] },
    // ── the festival street
    { at: 'λ', id: 'ko-sora', kind: 'activity', sprite: 'merchant', dir: 'down', activities: ['r12-sorry'], name: { jp: 'りんごあめやの ソラ', en: 'Sora the Candy-Apple Seller' }, lines: [{ jp: 'レンと けんか したの。なかなおり したいのに、ことばが でて こない。', en: 'I had a quarrel with Ren. I want to make up, but the words won’t come.' }] },
    { at: 'μ', id: 'ko-drummer', kind: 'activity', sprite: 'villager-a', dir: 'down', activities: ['r12-words-4'], name: { jp: 'たいこうちの ポン', en: 'Pon the Drummer' }, lines: [{ jp: 'ドキドキ、わくわく、そわそわ… こころの 音が、きこえなく なった。', en: 'Thump-thump, tingle, fidget… I can’t hear the sounds of the heart anymore.' }] },
    { at: 'ν', id: 'ko-aunt', kind: 'activity', sprite: 'innkeeper', dir: 'up', activities: ['r12-words-5'], name: { jp: 'うわさずきの キヨ', en: 'Kiyo the Gossip' }, lines: [{ jp: 'うそ！ まさか！ …って いいたいのに、ぜんぜん おどろけないのよ。', en: 'No way! Surely not! …I want to say it, but I can’t even be surprised anymore.' }] },
    { at: 'ξ', id: 'ko-watch', kind: 'activity', sprite: 'guard', dir: 'down', activities: ['r12-defense'], name: { jp: 'まつりの みはり', en: 'Festival Watch' }, lines: [{ jp: 'こおった めんが、空から ふって くる！ なまえを よんで、とかして くれ！', en: 'Frozen masks are falling from the sky! Call out their names and thaw them!' }] },
    { at: 'σ', id: 'ko-stone', kind: 'activity', tile: 'statue', activities: ['r12-speed'], name: { jp: 'こころいし', en: 'Heart Stone' }, lines: [{ jp: '「ここから さきは、そうぞうの とう」と ほって ある。さわると、すこし あたたかい。', en: 'Carved: “Beyond here, the Tower of Creation.” It’s a little warm to the touch.' }] },
    { at: 'τ', id: 'ko-kid', kind: 'npc', sprite: 'child', wander: 2, name: { jp: 'めんを かぶった 子', en: 'Kid in a Fox Mask' }, lines: [{ jp: 'めんを とったら、わたしの 顔も めんに なってたの。どっちが ほんとうの 顔？', en: 'When I took off my mask, my face had turned into a mask too. Which one is my real face?' }] },
    { at: 'υ', id: 'ko-bro-a', kind: 'npc', sprite: 'villager-a', dir: 'right', name: { jp: 'あにの カイト', en: 'Kaito the Older Brother' }, lines: [{ jp: 'おとうとと けんか した。…ごめん、が いえない。', en: 'I had a fight with my little brother. …I can’t say sorry.' }] },
    { at: 'φ', id: 'ko-bro-b', kind: 'npc', sprite: 'child', dir: 'left', name: { jp: 'おとうとの リク', en: 'Riku the Little Brother' }, lines: [{ jp: 'にいちゃんなんか、しらない。（でも、ちらちら 見て いる）', en: 'I don’t care about my big brother. (But he keeps glancing over.)' }] },
    // ── the rice terraces
    { at: 'ο', id: 'ko-ronin', kind: 'activity', sprite: 'samurai', dir: 'down', activities: ['r12-combat'], name: { jp: 'さすらいの ケンシン', en: 'Kenshin the Wanderer' }, lines: [{ jp: 'たんぼの くさむらに、めんの おにが でる。じゅもんで おいはらうぞ。', en: 'Mask spirits lurk in the paddy grass. We drive them off with spells.' }] },
    { at: 'π', id: 'ko-mamoru', kind: 'activity', sprite: 'villager-a', dir: 'left', activities: ['r12-congrats'], name: { jp: 'こめづくりの マモル', en: 'Mamoru the Rice Farmer' }, lines: [{ jp: 'ぼくの おこめが… いちばんに なったんです。でも、どんな 顔を すれば いいか…', en: 'My rice… came first. But I don’t know what kind of face to make…' }] },
    { at: 'ρ', id: 'ko-scarecrow', kind: 'landmark', tile: 'statue', word: 'egao', name: { jp: 'わらう かかし', en: 'Smiling Scarecrow' }, lines: [{ jp: 'えがおを かいた かかし。その えがおも、いまは かすれて いる。', en: 'A scarecrow with a painted smile. Even its smile has faded.' }] },
    // ── chests
    { at: '$', id: 'ko-chest-maple', kind: 'chest', tile: 'chest', chest: { item: 'herb', n: 3, shards: 30 } },
    { at: '?', id: 'ko-chest-bamboo', kind: 'chest', tile: 'chest', chest: { item: 'charm', n: 1, shards: 45, lock: { answer: 'えがお', jp: 'ふたに「笑顔」。よみを となえよ。', en: 'The lid bears 笑顔. Chant its reading.' } } },
  ],
}

/** Kaede's workshop: a whole wall of masks, a tatami corner, the carving bench. */
export const KOKORO_WORKSHOP: MapSpec = {
  id: 'kokoro-workshop',
  name: 'Mask Workshop',
  jp: 'めんの こうぼう',
  region: 12,
  music: 'kokoro',
  interior: true,
  particles: 'dust',
  bg: '#140d09',
  tint: 'rgba(255, 170, 90, 0.12)',
  rows: LAYOUTS['kokoro-workshop'],
  legend: INSIDE,
  spawn: 'door',
  points: { v: { name: 'door', dir: 'up' } },
  exits: [{ at: '0', to: 'kokoro', point: 'workshop', tile: 'door' }],
  entities: [
    { at: '1', id: 'kw-kaede', kind: 'activity', sprite: 'maskmaker', dir: 'down', activities: ['r12-feelings'], name: { jp: 'めんうちの カエデ', en: 'Kaede the Mask Carver' }, lines: [{ jp: 'めんは、かおを かくす ものじゃ ない。きもちを うつす ものなの。…なのに、ぜんぶ こおって しまった。', en: 'A mask isn’t for hiding a face. It’s for showing a feeling. …And yet they’ve all frozen.' }] },
    { at: '2', id: 'kw-masks', kind: 'activity', tile: 'bookshelf', activities: ['r12-listen'], name: { jp: 'めんの かべ', en: 'Wall of Masks' }, lines: [{ jp: 'たくさんの めんが、ちいさな こえで なにかを ささやいて いる。', en: 'Dozens of masks are whispering something in tiny voices.' }] },
    { at: '3', id: 'kw-bench', kind: 'activity', tile: 'anvil', activities: ['r12-forge'], name: { jp: 'めんうちの だい', en: 'Carving Bench' }, lines: [{ jp: 'ことばを ひとつずつ ほって、きもちの ぶんを つくろう。', en: 'Carve words one by one into sentences that carry a feeling.' }] },
    { at: '4', id: 'kw-oni', kind: 'landmark', tile: 'statue', word: 'ikari', name: { jp: 'おにの めん', en: 'Oni Mask' }, lines: [{ jp: 'まっかな おにの めん。いかりを あらわす めんだ。', en: 'A bright red oni mask. It is the mask of anger.' }] },
    { at: '$', id: 'kw-chest', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 1, shards: 30 } },
  ],
}

/** The kagura hall: the stage under its curtain, the great drum, and a backstage room of costumes. */
export const KOKORO_STAGE: MapSpec = {
  id: 'kokoro-stage',
  name: 'Kagura Hall',
  jp: 'かぐらでん',
  region: 12,
  music: 'kokoro',
  interior: true,
  particles: 'dust',
  bg: '#0f0a10',
  tint: 'rgba(230, 90, 120, 0.14)',
  rows: LAYOUTS['kokoro-stage'],
  legend: INSIDE,
  spawn: 'door',
  points: { v: { name: 'door', dir: 'up' } },
  exits: [{ at: '0', to: 'kokoro', point: 'stage', tile: 'door' }],
  entities: [
    { at: '1', id: 'ks-hannya', kind: 'boss', sprite: 'hannya', activities: ['r12-boss'], name: { jp: 'はんにゃ', en: 'Hannya' }, lines: [{ jp: 'うらやましい… みんなの えがおが、うらやましい！ だから ぜんぶ こおらせて やる！', en: 'I envy them… I envy all their smiles! So I’ll freeze every one of them!' }] },
    { at: '2', id: 'ks-ren', kind: 'activity', sprite: 'dancer', dir: 'down', activities: ['r12-cheer'], name: { jp: 'かぐらの まいて レン', en: 'Ren the Kagura Dancer' }, lines: [{ jp: '…もう おどれない。めんに きもちが はいらないの。', en: '…I can’t dance anymore. I can’t put any feeling into the mask.' }] },
    { at: '3', id: 'ks-drum', kind: 'activity', tile: 'altar', activities: ['r12-mastery'], name: { jp: 'かぐらの おおだいこ', en: 'Great Kagura Drum' }, lines: [{ jp: 'まつりの はじまりを つげる たいこ。きもちの こもった ぶんで たたこう。', en: 'The drum that opens the festival. Strike it with sentences full of feeling.' }] },
    { at: '4', id: 'ks-flute', kind: 'npc', sprite: 'villager-b', dir: 'up', name: { jp: 'ふえふきの ミオ', en: 'Mio the Flute Player' }, lines: [{ jp: 'ふえを ふいても、かなしい 音しか でないの。', en: 'Whatever I play on my flute, only sad notes come out.' }] },
    { at: '$', id: 'ks-chest', kind: 'chest', tile: 'chest', chest: { item: 'charm', n: 1, shards: 40 } },
  ],
}

/** The firefly grove: bamboo, a dark river crossed on stepping stones, a weeping willow, an old tablet. */
export const KOKORO_GROVE: MapSpec = {
  id: 'kokoro-grove',
  name: 'Firefly Grove',
  jp: 'ほたるの たけやぶ',
  region: 12,
  music: 'kokoro',
  particles: 'fireflies',
  bg: '#0b1210',
  tint: 'rgba(30, 50, 110, 0.32)',
  rows: LAYOUTS['kokoro-grove'],
  legend: { B: VALLEY.B },
  spawn: 'gate',
  points: { v: { name: 'gate', dir: 'down' } },
  exits: [{ at: '0', to: 'kokoro', point: 'grove', tile: 'stairs-up' }],
  entities: [
    { at: '1', id: 'kg-tablet', kind: 'activity', tile: 'tablet', activities: ['r12-runes'], name: { jp: 'ほたるの いしぶみ', en: 'Firefly Tablet' }, lines: [{ jp: 'こけむした いしぶみ。ほたるが とまると、字が ひかる。', en: 'A mossy tablet. Where a firefly lands, the letters glow.' }] },
    { at: '2', id: 'kg-lights', kind: 'activity', tile: 'lantern', activities: ['r12-listen-2'], name: { jp: 'ほたるの ともしび', en: 'Firefly Lights' }, lines: [{ jp: 'ほたるが ちかちか ひかって、ことばを ささやいて いる。', en: 'The fireflies blink on and off, whispering words.' }] },
    { at: '3', id: 'kg-shrine', kind: 'landmark', tile: 'shrine-bell', word: 'omoiyari', name: { jp: 'ほたるの ほこら', en: 'Firefly Shrine' }, lines: [{ jp: 'ちいさな ほこら。「ひとの きもちを おもう こころ」と かいて ある。', en: 'A tiny shrine. It reads: “A heart that thinks of others’ feelings.”' }] },
    { at: '4', id: 'kg-willow', kind: 'landmark', tile: 'tree', word: 'shikushiku', name: { jp: 'なく やなぎ', en: 'Weeping Willow' }, lines: [{ jp: 'かぜが ふくと、やなぎが しくしく なく ような 音が する。', en: 'When the wind blows, the willow makes a sound like quiet sobbing.' }] },
    { at: '$', id: 'kg-chest', kind: 'chest', tile: 'chest', chest: { item: 'herb', n: 2, shards: 35 } },
  ],
}

/** The old farmhouse: tatami, a sunken hearth, an old woman's diary on the shelf. */
export const KOKORO_FARMHOUSE: MapSpec = {
  id: 'kokoro-farmhouse',
  name: 'Old Farmhouse',
  jp: 'ふるい いえ',
  region: 12,
  music: 'kokoro',
  interior: true,
  particles: 'dust',
  bg: '#120c08',
  tint: 'rgba(255, 150, 70, 0.14)',
  rows: LAYOUTS['kokoro-farmhouse'],
  legend: INSIDE,
  spawn: 'door',
  points: { v: { name: 'door', dir: 'up' } },
  exits: [{ at: '0', to: 'kokoro', point: 'farmhouse', tile: 'door' }],
  entities: [
    { at: '1', id: 'kf-obaa', kind: 'npc', sprite: 'okami', dir: 'right', name: { jp: 'チヨ おばあさん', en: 'Grandma Chiyo' }, lines: [{ jp: 'まごたちは まちへ いって しまってね。この いえも、しずかに なったよ。', en: 'My grandchildren have all gone off to the town. This house has grown so quiet.' }] },
    { at: '2', id: 'kf-diary', kind: 'activity', tile: 'bookshelf', activities: ['r12-cross'], name: { jp: 'おばあさんの にっき', en: 'Grandma’s Diary' }, lines: [{ jp: 'ふるい にっき。ページの あいだに、ことばが ますめに ならんで いる。', en: 'An old diary. Between the pages, words are lined up in little squares.' }] },
    { at: '3', id: 'kf-hearth', kind: 'landmark', tile: 'campfire', word: 'anshin', name: { jp: 'いろり', en: 'Sunken Hearth' }, lines: [{ jp: 'ぱちぱちと ひが はぜる。そばに いると、ほっと する。', en: 'The fire crackles softly. Sitting near it, you feel at ease.' }] },
    { at: '$', id: 'kf-chest', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 2, shards: 35 } },
  ],
}

export const MAPS: MapSpec[] = [KOKORO, KOKORO_WORKSHOP, KOKORO_STAGE, KOKORO_GROVE, KOKORO_FARMHOUSE]

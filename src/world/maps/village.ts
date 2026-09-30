import type { MapSpec } from '../types'
import { LAYOUTS } from './layouts'

/** Region 1 — はじまりの村: a walled spring village with a pond, a well and cherry trees. */
export const VILLAGE: MapSpec = {
  id: 'village',
  name: 'The Village of First Words',
  jp: 'はじまりの村',
  region: 1,
  music: 'village',
  particles: 'sakura',
  tint: 'rgba(255, 186, 120, 0.10)',
  rows: LAYOUTS.village,
  spawn: 'inn',
  inn: 'inn',
  points: {
    y: { name: 'inn', dir: 'down' },
    q: { name: 'gate', dir: 'down' },
    j: { name: 'elder', dir: 'down' },
    m: { name: 'scrolls', dir: 'down' },
    l: { name: 'shop', dir: 'down' },
  },
  exits: [
    { at: '0', to: 'fields', point: 'south', tile: 'gate-open' },
    { at: 'd', to: 'village-elder', point: 'door', tile: 'door' },
    { at: 'i', to: 'village-scrolls', point: 'door', tile: 'door' },
    { at: 'h', to: 'village-shop', point: 'door', tile: 'noren' },
  ],
  entities: [
    { at: '1', id: 'v-teacher', kind: 'activity', sprite: 'villager-a', dir: 'down', wander: 1, activities: ['r1-words-2'], name: { jp: 'ハナせんせい', en: 'Teacher Hana' }, lines: [{ jp: 'さくらの 下で、ことばを おしえています。', en: 'I teach words under the cherry trees.' }] },
    { at: '2', id: 'v-guard', kind: 'activity', sprite: 'guard', dir: 'right', activities: ['r1-defense-1'], name: { jp: 'みはりの へいし', en: 'Wall Guard' }, lines: [{ jp: 'そらから なにかが おちてくる！ てつだって！', en: 'Something is falling from the sky! Help me!' }] },
    { at: '3', id: 'v-bell', kind: 'activity', tile: 'shrine-bell', activities: ['r1-defense-2'], name: { jp: 'やぐらの かね', en: 'Alarm Bell' }, lines: [{ jp: 'かねを ならすと、かなの あらしが くる…', en: 'Ring the bell and the kana storm will come…' }] },
    { at: '4', id: 'v-tanuki', kind: 'activity', sprite: 'tanuki', activities: ['r1-spot'], name: { jp: 'いたずらたぬき', en: 'Mischievous Tanuki' }, lines: [{ jp: 'ぽん！ ぼくは なんにでも ばけられるよ。にせものを みつけて！', en: 'Pon! I can turn into anything. Spot the fake!' }] },
    { at: '5', id: 'v-well', kind: 'activity', tile: 'well', activities: ['r1-listen'], word: 'mizu', name: { jp: 'むらの いど', en: 'Village Well' }, lines: [{ jp: 'いどの そこから、ささやきが きこえる…', en: 'Whispers rise from the bottom of the well…' }] },
    { at: '6', id: 'v-oni', kind: 'boss', sprite: 'oni', activities: ['r1-boss'], name: { jp: 'かなのおに', en: 'The Kana Oni' }, lines: [{ jp: 'グオオ！ この みちは とおさない！', en: 'GRAAH! None shall pass this road!' }] },
    { at: '7', id: 'v-trial', kind: 'activity', tile: 'statue', activities: ['r1-mastery'], name: { jp: 'しれんの いし', en: 'Trial Stone' }, lines: [{ jp: 'むらの しれん。まことの ちからを しめせ。', en: 'The village trial. Show your true power.' }] },
    { at: '8', id: 'v-sign', kind: 'sign', tile: 'sign', name: { jp: 'かんばん', en: 'Sign' }, lines: [{ jp: 'きた：元素の野。かなのおにが みちを ふさいでいる。', en: 'North: the Elemental Fields. The Kana Oni blocks the road.' }] },
    { at: '9', id: 'v-innkeeper', kind: 'npc', sprite: 'innkeeper', dir: 'down', name: { jp: 'やどやの おかみ', en: 'Innkeeper' }, lines: [{ jp: 'いらっしゃい！ つかれたら、いつでも やすんでね。', en: 'Welcome! Rest here whenever you are tired.' }, { jp: 'きょうは いい てんきですね。', en: 'Lovely weather today, isn’t it?' }] },
    { at: '$', id: 'v-chest-meadow', kind: 'chest', tile: 'chest', chest: { item: 'herb', n: 2, shards: 5 } },
    { at: '?', id: 'v-chest-island', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 1, shards: 20, lock: { answer: 'ひらけ', jp: 'この たからばこは『ひらけ』で ひらく…', en: 'This chest opens to the word “hirake” (open!).' } } },
    { at: '+', id: 'v-villager', kind: 'npc', sprite: 'villager-b', wander: 2, name: { jp: 'むらびと', en: 'Villager' }, lines: [{ jp: 'みずは いどで くめますよ。', en: 'You can draw water at the well.' }, { jp: 'さくらが きれいですね。', en: 'The cherry blossoms are beautiful, aren’t they?' }] },
    { at: '(', id: 'v-child', kind: 'npc', sprite: 'child', wander: 2, name: { jp: 'こども', en: 'Child' }, lines: [{ jp: 'いけに たぬきが いるよ！ ほんとうだよ！', en: 'There’s a tanuki in the pond! Really!' }, { jp: 'ねこと いぬ、どっちが すき？', en: 'Cats or dogs, which do you like?' }] },
    { at: ')', id: 'v-cat', kind: 'npc', sprite: 'cat', wander: 2, name: { jp: 'ねこ', en: 'Cat' }, lines: [{ jp: 'にゃあ。', en: 'Meow.' }] },
    { at: '[', id: 'v-dog', kind: 'npc', sprite: 'dog', wander: 2, name: { jp: 'いぬ', en: 'Dog' }, lines: [{ jp: 'わん！ わん！', en: 'Woof! Woof!' }] },
    { at: '/', id: 'v-farmer', kind: 'npc', sprite: 'villager-a', wander: 1, name: { jp: 'のうふ', en: 'Farmer' }, lines: [{ jp: 'あめが ふると、かわの みずが ふえるんだ。', en: 'When it rains, the river rises.' }, { jp: 'やまの むこうに、ひろい のはらが あるよ。', en: 'Beyond the mountains lie wide fields.' }] },
    { at: ']', id: 'v-sakura', kind: 'landmark', tile: 'sakura', word: 'hana', name: { jp: 'さくらの 木', en: 'Cherry Tree' }, lines: [{ jp: '花が さいている。', en: 'The flowers are in bloom.' }] },
    { at: '{', id: 'v-lantern', kind: 'landmark', tile: 'lantern', word: 'hi', name: { jp: 'とうろう', en: 'Lantern' }, lines: [{ jp: '火が ゆれている。', en: 'A flame flickers.' }] },
    { at: '}', id: 'v-signpost', kind: 'landmark', tile: 'sign', word: 'michi', name: { jp: 'みちしるべ', en: 'Signpost' }, lines: [{ jp: 'この 道を まっすぐ きたへ。', en: 'Follow this road straight north.' }] },
  ],
}

const room = { interior: true, particles: 'dust' as const, bg: '#0b0a14', tint: 'rgba(255, 170, 90, 0.10)' }

export const VILLAGE_ELDER: MapSpec = {
  ...room,
  id: 'village-elder',
  name: 'Elder’s House',
  jp: 'ちょうろうの いえ',
  region: 1,
  music: 'village',
  rows: LAYOUTS['village-elder'],
  legend: { p: { g: 'tatami', o: 'pot' }, k: { g: 'tatami', o: 'bookshelf' } },
  spawn: 'door',
  points: { v: { name: 'door', dir: 'up' } },
  exits: [{ at: '0', to: 'village', point: 'elder', tile: 'carpet' }],
  entities: [
    { at: '1', id: 've-elder', kind: 'activity', sprite: 'elder', dir: 'down', activities: ['r1-words-1'], name: { jp: 'ちょうろう', en: 'Village Elder' }, lines: [{ jp: 'よく きたな、わかき まほうつかいよ。まずは ことばを まなびなさい。', en: 'Welcome, young mage. First, you must learn your words.' }] },
    { at: ')', id: 've-cat', kind: 'npc', sprite: 'cat', dir: 'down', name: { jp: 'ねこ', en: 'Cat' }, lines: [{ jp: 'ごろごろ…', en: 'Purr…' }] },
    { at: '$', id: 've-chest', kind: 'chest', tile: 'chest', chest: { item: 'charm', n: 1 } },
  ],
}

export const VILLAGE_SHOP: MapSpec = {
  ...room,
  id: 'village-shop',
  name: 'Spell Shop',
  jp: 'まほうや',
  region: 1,
  music: 'shop',
  rows: LAYOUTS['village-shop'],
  legend: {
    p: { g: 'wood-floor', o: 'pot' },
    e: { g: 'wood-floor', o: 'barrel' },
    x: { g: 'wood-floor', o: 'crate' },
    '%': { g: 'wood-floor', o: 'stall' },
  },
  spawn: 'door',
  points: { v: { name: 'door', dir: 'up' } },
  exits: [{ at: '0', to: 'village', point: 'shop', tile: 'carpet' }],
  entities: [
    { at: '1', id: 'vs-merchant', kind: 'activity', sprite: 'merchant', dir: 'down', activities: ['r1-shop'], name: { jp: 'まほうやの しょうにん', en: 'Spell Merchant' }, lines: [{ jp: 'いらっしゃいませ！ なにに なさいますか？', en: 'Welcome! What can I get for you?' }] },
  ],
}

export const VILLAGE_SCROLLS: MapSpec = {
  ...room,
  id: 'village-scrolls',
  name: 'Scroll Hall',
  jp: 'まきものの やかた',
  region: 1,
  music: 'village',
  rows: LAYOUTS['village-scrolls'],
  legend: { p: { g: 'tatami', o: 'pot' }, k: { g: 'tatami', o: 'bookshelf' } },
  spawn: 'door',
  points: { v: { name: 'door', dir: 'up' } },
  exits: [{ at: '0', to: 'village', point: 'scrolls', tile: 'carpet' }],
  entities: [
    { at: '1', id: 'vc-teacher', kind: 'activity', sprite: 'villager-b', dir: 'down', activities: ['r1-trace-1'], name: { jp: 'しょどうの せんせい', en: 'Calligraphy Teacher' }, lines: [{ jp: 'ふでを もって。いっしょに かきましょう。', en: 'Take up the brush. Let’s write together.' }] },
    { at: '2', id: 'vc-shelf', kind: 'activity', tile: 'bookshelf', activities: ['r1-trace-2'], name: { jp: 'まきものの たな', en: 'Scroll Shelf' }, lines: [{ jp: 'たなに ふるい まきものが ある。', en: 'An old scroll rests on the shelf.' }] },
    { at: '3', id: 'vc-altar', kind: 'activity', tile: 'altar', activities: ['r1-recall'], name: { jp: 'しろい まきもの', en: 'The Blank Scroll' }, lines: [{ jp: 'まっしろな まきもの。おぼえている かなを かこう。', en: 'A pure white scroll. Write the kana you remember.' }] },
    { at: '(', id: 'vc-student', kind: 'npc', sprite: 'child', wander: 1, name: { jp: 'でし', en: 'Pupil' }, lines: [{ jp: 'あ、い、う、え、お！ ぼく、ぜんぶ かけるよ。', en: 'A, i, u, e, o! I can write them all!' }] },
  ],
}

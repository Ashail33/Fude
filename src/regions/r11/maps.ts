import type { Cell, MapSpec } from '../../world/types'
import { LAYOUTS } from './layouts'

/** Shared look of the station town: stone streets, red station roofs, shop curtains and paper lanterns. */
const TOWN: Record<string, Cell> = {
  R: { g: 'stone-floor', o: 'roof-red' },
  E: { g: 'stone-floor', o: 'roof-red-edge' },
  h: { g: 'stone-floor', o: 'noren' },
  c: { g: 'stone-floor', o: 'chochin' },
  '#': { g: 'stone-floor', o: 'wall' },
  H: { g: 'stone-floor', o: 'wall-window' },
  '^': { g: 'stone-floor', o: 'roof' },
  A: { g: 'stone-floor', o: 'roof-edge' },
  a: { g: 'stone-floor', o: 'shop-awning' },
  D: { g: 'stone-floor', o: 'door' },
  G: { g: 'stone-floor', o: 'gate-closed' },
  Z: { g: 'stone-floor', o: 'stone-wall' },
  x: { g: 'stone-floor', o: 'crate' },
  p: { g: 'stone-floor', o: 'pot' },
  u: { g: 'grass', o: 'stump' },
  '%': { g: 'stone-floor', o: 'stall' },
}

/** Inside: wooden floors, plastered walls. */
const ROOM: Record<string, Cell> = {
  '#': { g: 'wood-floor', o: 'wall' },
  H: { g: 'wood-floor', o: 'wall-window' },
  '%': { g: 'wood-floor', o: 'stall' },
  x: { g: 'wood-floor', o: 'crate' },
  e: { g: 'wood-floor', o: 'barrel' },
  p: { g: 'wood-floor', o: 'pot' },
  u: { g: 'wood-floor', o: 'stump' },
}

const INSIDE = { interior: true, particles: 'dust' as const, bg: '#0d0b12', tint: 'rgba(255, 190, 120, 0.10)' }

/**
 * Region 11 — おしゃべりの駅町: the town round the railway station, below
 * the Cloud Capital. The stair from the clouds lands at the west end of the
 * main street. North of the street: the station with its ticket gate under
 * the elevated railway, the plaza with the big clock and the bus stop, the
 * konbini and the bank (north-west), the little hospital (north-east).
 * South: the park with its pond and long grass, the shotengai arcade (the
 * grocer's and Café Komorebi open onto it), the karaoke box and the police
 * box, and the apartment block whose stair climbs to the rooftop. East: the
 * road to the Valley of Hearts.
 */
export const EKIMAE: MapSpec = {
  id: 'ekimae',
  name: 'The Chattering Station Town',
  jp: 'おしゃべりの駅町',
  region: 11,
  music: 'ekimae',
  particles: 'sakura',
  tint: 'rgba(120, 220, 190, 0.06)',
  rows: LAYOUTS.ekimae,
  legend: TOWN,
  spawn: 'west',
  inn: 'west',
  points: {
    q: { name: 'west', dir: 'right' },
    j: { name: 'east', dir: 'left' },
    v: { name: 'gate', dir: 'down' },
    y: { name: 'yaoya', dir: 'down' },
    m: { name: 'cafe', dir: 'down' },
    l: { name: 'apart', dir: 'down' },
  },
  exits: [
    { at: '9', to: '@prev', point: 'east', tile: 'stairs-up' },
    { at: '8', to: '@next', point: 'west' },
    { at: '0', to: 'ekimae-platform', point: 'gate', tile: 'gate-open' },
    { at: '5', to: 'ekimae-yaoya', point: 'door', tile: 'noren' },
    { at: '6', to: 'ekimae-cafe', point: 'door', tile: 'noren' },
    { at: '7', to: 'ekimae-rooftop', point: 'stairs', tile: 'door' },
  ],
  entities: [
    // ── the station plaza
    { at: 'α', id: 'e-tetsu', kind: 'activity', sprite: 'stationmaster', dir: 'down', activities: ['r11-casual'], name: { jp: 'えきちょうの テツ', en: 'Tetsu the Stationmaster' }, lines: [{ jp: '…電車。…きっぷ。…ホーム。', en: '…Train. …Ticket. …Platform. (He can only manage nouns.)' }] },
    { at: 'β', id: 'e-pon', kind: 'activity', sprite: 'tanuki', activities: ['r11-words-1'], name: { jp: 'たぬきの ポン', en: 'Pon the Tanuki' }, lines: [{ jp: 'ぽん！ おはよう！ …あれ、だれも かえして くれない。顔が ないんだもん。', en: 'Pon! Good morning! …Huh, nobody says it back. They’ve got no faces, see.' }] },
    { at: 'γ', id: 'e-clock', kind: 'activity', tile: 'statue', activities: ['r11-mastery'], name: { jp: 'えきまえの 大どけい', en: 'The Big Station Clock' }, lines: [{ jp: 'えきまえの 大きな とけい。はりは うごいて いるのに、電車は 一つも 出て いない。', en: 'The great clock in front of the station. Its hands still move, but not one train has left.' }] },
    { at: 'δ', id: 'e-sign', kind: 'sign', tile: 'sign', name: { jp: 'あんないばん', en: 'Town Map' }, lines: [{ jp: 'きた：えき（かいさつ・ホーム）。にし：コンビニ・ぎんこう。ひがし：びょういん・バスてい。', en: 'North: the station (ticket gate, platforms). West: konbini, bank. East: hospital, bus stop.' }, { jp: 'みなみ：こうえん・しょうてんがい・アパート。にしの かいだん：雲の みやこへ。ひがしの みち：こころの たにへ。', en: 'South: park, shopping arcade, apartments. West stair: up to the Cloud Capital. East road: to the Valley of Hearts.' }] },
    { at: '+', id: 'e-commuter', kind: 'npc', sprite: 'villager-b', wander: 2, name: { jp: '顔の ない つうきんしゃ', en: 'Faceless Commuter' }, lines: [{ jp: '…会社。…時間。…電車。（顔は つるんとして いる）', en: '…Company. …Time. …Train. (Their face is perfectly smooth.)' }] },
    { at: 'η', id: 'e-taxi', kind: 'npc', sprite: 'villager-a', dir: 'down', name: { jp: 'タクシーの うんてんしゅ', en: 'Taxi Driver' }, lines: [{ jp: '…どこ。…どこ。（行き先を 聞きたいのに、それしか 言えない らしい）', en: '…Where. …Where. (He wants to ask where you’re going, but that’s all that comes out.)' }] },
    { at: 'κ', id: 'e-car', kind: 'landmark', tile: 'crate', word: 'kuruma', name: { jp: 'まって いる タクシー', en: 'Waiting Taxi' }, lines: [{ jp: 'きいろい タクシー。エンジンは かかって いるけど、だれも のって いない。', en: 'A yellow taxi. The engine’s running, but nobody gets in.' }] },
    { at: 'ε', id: 'e-busstop', kind: 'activity', tile: 'sign', activities: ['r11-listen-3'], name: { jp: 'バスてい', en: 'Bus Stop' }, lines: [{ jp: 'バスを まつ 人が ならんで いる。みんな、口の なかで なにか つぶやいて いる…', en: 'A queue of people waiting for the bus, all mumbling something under their breath…' }] },
    { at: 'ζ', id: 'e-timetable', kind: 'landmark', tile: 'sign', word: 'basu', name: { jp: 'バスの じこくひょう', en: 'Bus Timetable' }, lines: [{ jp: '「こころの たに ゆき」。でも 字が かすれて、時間が よめない。', en: '“For the Valley of Hearts.” But the letters are faded, and the times can’t be read.' }] },
    // ── north-west: konbini, phone box, bank, bicycles
    { at: 'θ', id: 'e-clerk', kind: 'activity', sprite: 'villager-b', dir: 'down', activities: ['r11-words-3'], name: { jp: 'コンビニの てんいん ケン', en: 'Ken the Konbini Clerk' }, lines: [{ jp: 'いら… いらっしゃ… …コンビニ。（「いらっしゃいませ」が 出て こない）', en: 'Wel… welco… …Konbini. (The word “welcome” just won’t come out.)' }] },
    { at: 'ι', id: 'e-phonebox', kind: 'activity', tile: 'shrine-bell', activities: ['r11-phone'], name: { jp: 'こうしゅう でんわ', en: 'Phone Box' }, lines: [{ jp: 'ジリリリ… ジリリリ… でんわが なって いる！', en: 'Brrring… brrring… the phone is ringing!' }] },
    { at: 'λ', id: 'e-bank', kind: 'landmark', tile: 'sign', word: 'ginkou', name: { jp: 'ぎんこうの かんばん', en: 'Bank Sign' }, lines: [{ jp: '「えきまえ ぎんこう」。まどぐちの 人も、すうじしか 言えない らしい。', en: '“Station-Front Bank.” The tellers can only say numbers, apparently.' }] },
    { at: 'μ', id: 'e-bikes', kind: 'landmark', tile: 'fence', word: 'jitensha', name: { jp: 'ちゅうりんじょう', en: 'Bicycle Rack' }, lines: [{ jp: 'じてんしゃが ずらりと ならんで いる。ベルが ひとつ、ちりんと なった。', en: 'Bicycles in a long row. One bell gives a little ring.' }] },
    // ── north-east: the little hospital
    { at: 'ν', id: 'e-nurse', kind: 'activity', sprite: 'innkeeper', dir: 'down', activities: ['r11-words-6'], name: { jp: 'かんごしの サキ', en: 'Saki the Nurse' }, lines: [{ jp: 'かんじゃさんに「だいじょうぶ？」って 聞きたいのに… 言えないの。顔も ないし。', en: 'I want to ask my patients “are you all right?”… but I can’t say it. I haven’t got a face, either.' }] },
    { at: 'ξ', id: 'e-hospital', kind: 'landmark', tile: 'sign', word: 'byouin', name: { jp: 'びょういんの かんばん', en: 'Hospital Sign' }, lines: [{ jp: '「えきまえ クリニック」。まちの ちいさな びょういん。', en: '“Station-Front Clinic.” The town’s little hospital.' }] },
    { at: 'ο', id: 'e-salaryman', kind: 'npc', sprite: 'villager-a', wander: 1, name: { jp: 'サラリーマン', en: 'Office Worker' }, lines: [{ jp: '仕事。仕事。仕事。…（ためいき）', en: 'Work. Work. Work. …(A long sigh.)' }] },
    // ── the park
    { at: 'π', id: 'e-oldman', kind: 'activity', sprite: 'elder', dir: 'down', activities: ['r11-spoken'], name: { jp: 'ベンチの ゲンさん', en: 'Old Gen on the Bench' }, lines: [{ jp: 'わしは まいにち ここで、人の はなしを 聞いとるんじゃ。…いまは だれも 話さんがのう。', en: 'Every day I sit here and listen to people talk. …Nobody talks now, mind.' }] },
    { at: 'ρ', id: 'e-kids', kind: 'activity', sprite: 'child', wander: 1, activities: ['r11-words-5'], name: { jp: 'こうえんの ミオ', en: 'Mio in the Park' }, lines: [{ jp: 'あつい！ さむい！ …ちがう、どっちでも ない！ ことばが ばらばらなの！', en: 'Hot! Cold! …No, neither! My words are all jumbled!' }] },
    { at: 'σ', id: 'e-koban', kind: 'activity', sprite: 'guard', dir: 'down', activities: ['r11-combat'], name: { jp: 'こうばんの おまわりさん', en: 'Police Officer' }, lines: [{ jp: 'くさむらに やまびこが いる。こえを まねして、ことばを ぬすんで いくんだ。', en: 'There are yamabiko in the long grass. They copy your voice and steal your words.' }] },
    { at: 'τ', id: 'e-bandstand', kind: 'landmark', tile: 'statue', word: 'ongaku', name: { jp: 'やがいステージ', en: 'Bandstand' }, lines: [{ jp: 'にちようびには ここで おんがくが ながれる。いまは しずかだ。', en: 'On Sundays, music plays here. Right now it’s silent.' }] },
    { at: 'υ', id: 'e-family', kind: 'npc', sprite: 'villager-a', dir: 'down', name: { jp: 'おべんとうの かぞく', en: 'Family with Bento' }, lines: [{ jp: '…べんとう。…はし。…（みんな だまって、たべはじめられずに いる）', en: '…Bento. …Chopsticks. …(The whole family sits in silence, unable to start eating.)' }] },
    // ── the shotengai arcade
    { at: 'φ', id: 'e-reporter', kind: 'activity', sprite: 'lady', dir: 'down', activities: ['r11-words-2'], name: { jp: 'レポーターの アヤ', en: 'Aya the Reporter' }, lines: [{ jp: 'まちの みなさんに インタビュー… なのに、「なに？」も「だれ？」も 言えない！', en: 'I’m interviewing the townsfolk… but I can’t even say “what?” or “who?”!' }] },
    { at: 'χ', id: 'e-poster', kind: 'landmark', tile: 'sign', word: 'eiga', name: { jp: 'えいがの ポスター', en: 'Movie Poster' }, lines: [{ jp: '「こわい えいが・のっぺらぼうの よる」。…ちょっと できすぎて いる。', en: '“Scary Movie: Night of the Nopperabō.” …A bit too on the nose.' }] },
    { at: 'ψ', id: 'e-karaoke', kind: 'npc', sprite: 'villager-b', wander: 1, name: { jp: 'カラオケの てんいん', en: 'Karaoke Attendant' }, lines: [{ jp: 'うたは ある。マイクも ある。でも、うたう ことばが ない…', en: 'We’ve got songs. We’ve got mics. But no words to sing…' }] },
    { at: 'ç', id: 'e-cat', kind: 'npc', sprite: 'cat', wander: 2, name: { jp: 'しょうてんがいの ねこ', en: 'Arcade Cat' }, lines: [{ jp: 'にゃー。（ねこには、さいしょから あいさつは いらない らしい）', en: 'Mrrow. (Cats never needed greetings in the first place, apparently.)' }] },
    // ── the apartments
    { at: 'ω', id: 'e-mom', kind: 'npc', sprite: 'villager-b', dir: 'down', name: { jp: 'アパートの おかあさん', en: 'Mother at the Apartments' }, lines: [{ jp: '子どもが かえって きたのに… なんて いえば いいのか、わからない…', en: 'My child just got home… and I can’t remember what you’re supposed to say…' }] },
    { at: 'Ω', id: 'e-grandma', kind: 'npc', sprite: 'okami', dir: 'down', name: { jp: '三がいの フミさん', en: 'Grandma Fumi from Floor Three' }, lines: [{ jp: 'あたしの ぞうり、どこかで なくしちゃってねえ。はだしは つめたいよ。', en: 'I went and lost one of my sandals somewhere. Bare feet get cold, you know.' }] },
    // ── treasure
    { at: '$', id: 'e-chest-park', kind: 'chest', tile: 'chest', chest: { item: 'herb', n: 3, shards: 25 } },
    { at: '?', id: 'e-chest-garden', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 2, shards: 40, lock: { answer: 'ただいま', jp: 'ふたに「いえに かえった ときの あいさつは？」と ある。', en: 'The lid asks: “What do you say when you get home?”' } } },
    { at: '!', id: 'e-chest-apart', kind: 'chest', tile: 'chest', chest: { item: 'charm', n: 1, shards: 35, lock: { answer: 'おやすみ', jp: 'ふたに「ねる まえの あいさつは？」と ある。', en: 'The lid asks: “What do you say before bed?”' } } },
  ],
}

/** The platform: a train that cannot leave, benches, the kiosk, and at the far end, a figure with no face. */
export const EKIMAE_PLATFORM: MapSpec = {
  id: 'ekimae-platform',
  name: 'Platform One',
  jp: '一ばんせん',
  region: 11,
  music: 'ekimae',
  particles: 'dust',
  bg: '#1b2433',
  tint: 'rgba(110, 160, 220, 0.12)',
  rows: LAYOUTS['ekimae-platform'],
  legend: { ...TOWN, f: { g: 'stone-floor', o: 'fence' }, u: { g: 'stone-floor', o: 'stump' } },
  spawn: 'gate',
  points: { v: { name: 'gate', dir: 'up' } },
  exits: [{ at: '0', to: 'ekimae', point: 'gate', tile: 'stairs-down' }],
  entities: [
    { at: 'α', id: 'p-nopperabo', kind: 'boss', sprite: 'nopperabo', activities: ['r11-boss'], name: { jp: 'のっぺらぼう', en: 'Nopperabō' }, lines: [{ jp: '…………。', en: '(It turns towards you. Where its face should be, there is nothing at all.)' }] },
    { at: 'β', id: 'p-speaker', kind: 'activity', tile: 'sign', activities: ['r11-listen-1'], name: { jp: 'ホームの スピーカー', en: 'Platform Speaker' }, lines: [{ jp: 'ザザ… 「まもなく… ザザ… 一ばんせんに…」 アナウンスが とぎれとぎれに 聞こえる。', en: 'Krrsh… “Shortly… krrsh… on platform one…” The announcement keeps cutting out.' }] },
    { at: 'γ', id: 'p-bell', kind: 'activity', tile: 'shrine-bell', activities: ['r11-speed'], name: { jp: 'はっしゃの ベル', en: 'Departure Bell' }, lines: [{ jp: 'でんしゃが 出る ときに なる ベル。ずっと だまった ままだ。', en: 'The bell that rings when a train departs. It has stayed silent all day.' }] },
    { at: 'δ', id: 'p-haruto', kind: 'activity', sprite: 'child', dir: 'left', activities: ['r11-weekend'], name: { jp: 'こうこうせいの ハルト', en: 'Haruto the Student' }, lines: [{ jp: 'あ〜、電車 来ない！ ひまだ〜！ …だれか しゃべろうよ。', en: 'Ugh, the train won’t come! So bored! …Somebody talk to me.' }] },
    { at: 'ε', id: 'p-car', kind: 'landmark', tile: 'sign', word: 'densha', name: { jp: '三ごうしゃの ドア', en: 'Door of Car Three' }, lines: [{ jp: 'ドアは あいて いる。うんてんしは のって いる。…でも、だれも「いってらっしゃい」と 言えない。', en: 'The doors are open. The driver is aboard. …But nobody can call out “off you go”.' }] },
    { at: 'ζ', id: 'p-kiosk', kind: 'npc', sprite: 'merchant', dir: 'right', name: { jp: 'ばいてんの おばさん', en: 'Kiosk Lady' }, lines: [{ jp: '…お弁当。…お茶。…しんぶん。（売る ものの なまえしか 言えない）', en: '…Bento. …Tea. …Newspaper. (She can only say the names of what she sells.)' }] },
    { at: '$', id: 'p-chest', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 1, shards: 30 } },
  ],
}

/** Café Komorebi on the shotengai: a long counter, small tables, an old jukebox and a writer who listens. */
export const EKIMAE_CAFE: MapSpec = {
  id: 'ekimae-cafe',
  name: 'Café Komorebi',
  jp: 'カフェ こもれび',
  region: 11,
  music: 'ekimae',
  ...INSIDE,
  rows: LAYOUTS['ekimae-cafe'],
  legend: ROOM,
  spawn: 'door',
  points: { v: { name: 'door', dir: 'up' } },
  exits: [{ at: '0', to: 'ekimae', point: 'cafe', tile: 'door' }],
  entities: [
    { at: 'α', id: 'k-yui', kind: 'activity', sprite: 'merchant', dir: 'down', activities: ['r11-cafe'], name: { jp: 'バリスタの ユイ', en: 'Yui the Barista' }, lines: [{ jp: 'いらっしゃい… ませ。…あ、まだ 半分は 言えるみたい。', en: 'Wel… come. …Oh, looks like I can still say half of it.' }] },
    { at: 'β', id: 'k-jukebox', kind: 'activity', tile: 'altar', activities: ['r11-listen-2'], name: { jp: 'ふるい ジュークボックス', en: 'Old Jukebox' }, lines: [{ jp: 'おかねを いれると、うたの かわりに、カフェで 聞こえた おしゃべりが ながれる。', en: 'Put a coin in, and instead of a song it plays back the chatter it overheard in the café.' }] },
    { at: 'γ', id: 'k-writer', kind: 'activity', sprite: 'scholar', dir: 'up', activities: ['r11-forge'], name: { jp: 'しょうせつかの ハヤシ', en: 'Hayashi the Novelist' }, lines: [{ jp: 'わしは 人の かいわを 書きとめて、しょうせつに して おる。…さいきん、メモが ばらばらでな。', en: 'I jot down people’s conversations and turn them into novels. …My notes have gone to pieces lately.' }] },
    { at: 'δ', id: 'k-coffee', kind: 'landmark', tile: 'pot', word: 'koohii', name: { jp: 'コーヒーの ポット', en: 'Coffee Pot' }, lines: [{ jp: 'こうばしい においが する。この においだけは、のっぺらぼうにも けせない。', en: 'A rich, toasty smell. That is one thing Nopperabō can’t wipe away.' }] },
    { at: 'ζ', id: 'k-regular', kind: 'npc', sprite: 'villager-a', dir: 'right', name: { jp: 'じょうれんさん', en: 'Café Regular' }, lines: [{ jp: '…コーヒー。…新聞。…（いつもなら、ユイちゃんと 十分は しゃべるのに）', en: '…Coffee. …Paper. …(Normally he chats with Yui for a good ten minutes.)' }] },
    { at: '$', id: 'k-chest', kind: 'chest', tile: 'chest', chest: { item: 'herb', n: 2, shards: 30 } },
  ],
}

/** Mari's grocer: crates of vegetables, a milk cooler, and her son's homework desk in the corner. */
export const EKIMAE_YAOYA: MapSpec = {
  id: 'ekimae-yaoya',
  name: 'Mari’s Grocer',
  jp: 'やおや マリ',
  region: 11,
  music: 'ekimae',
  ...INSIDE,
  rows: LAYOUTS['ekimae-yaoya'],
  legend: ROOM,
  spawn: 'door',
  points: { v: { name: 'door', dir: 'up' } },
  exits: [{ at: '0', to: 'ekimae', point: 'yaoya', tile: 'door' }],
  entities: [
    { at: 'α', id: 'y-mari', kind: 'activity', sprite: 'grocer', dir: 'down', activities: ['r11-words-4'], name: { jp: 'やおやの マリ', en: 'Mari the Grocer' }, lines: [{ jp: '…やさい。…たまご。…（いつもは「いらっしゃい！ きょうは なにに する？」って 大きな こえで 言うのに）', en: '…Vegetables. …Eggs. …(Usually she’d boom “Welcome! What’ll it be today?”)' }] },
    { at: 'β', id: 'y-veg', kind: 'landmark', tile: 'crate', word: 'yasai', name: { jp: 'やさいの はこ', en: 'Vegetable Crate' }, lines: [{ jp: 'だいこん、にんじん、キャベツ。どれも ぴかぴかで おいしそう。', en: 'Daikon, carrots, cabbages. All shiny and delicious-looking.' }] },
    { at: 'γ', id: 'y-eggs', kind: 'landmark', tile: 'barrel', word: 'tamago', name: { jp: 'たまごの かご', en: 'Egg Basket' }, lines: [{ jp: 'たまごの かごは からっぽだ。「うりきれ」の ふだが かかって いる。', en: 'The egg basket is empty. A “sold out” tag hangs on it.' }] },
    { at: 'δ', id: 'y-milk', kind: 'landmark', tile: 'pot', word: 'gyuunyuu', name: { jp: 'ぎゅうにゅうの れいぞうこ', en: 'Milk Cooler' }, lines: [{ jp: 'ひんやり した れいぞうこ。ぎゅうにゅうも のこり すくない。', en: 'A chilly cooler. The milk is running low too.' }] },
    { at: 'ε', id: 'y-son', kind: 'npc', sprite: 'child', dir: 'right', name: { jp: 'マリの むすこ ソウタ', en: 'Sota, Mari’s Son' }, lines: [{ jp: 'しゅくだい… わかんない。…でも「わかんない」って 言えた！', en: 'Homework… I don’t get it. …But hey, I managed to say “I don’t get it”!' }] },
    { at: 'ζ', id: 'y-desk', kind: 'landmark', tile: 'bookshelf', word: 'tsukue', name: { jp: 'ソウタの つくえ', en: 'Sota’s Desk' }, lines: [{ jp: 'みせの すみの ちいさな つくえ。しゅくだいの プリントが ちらばって いる。', en: 'A little desk in the corner of the shop, covered in homework sheets.' }] },
    { at: '$', id: 'y-chest', kind: 'chest', tile: 'chest', chest: { item: 'herb', n: 2, shards: 25 } },
  ],
}

/** The apartment rooftop: washing lines, planters, a notice board and a view all the way to the valley. */
export const EKIMAE_ROOFTOP: MapSpec = {
  id: 'ekimae-rooftop',
  name: 'Apartment Rooftop',
  jp: 'アパートの おくじょう',
  region: 11,
  music: 'ekimae',
  particles: 'sparkles',
  bg: '#8fd3f0',
  tint: 'rgba(255, 210, 150, 0.08)',
  rows: LAYOUTS['ekimae-rooftop'],
  legend: { ...TOWN, f: { g: 'stone-floor', o: 'fence' }, u: { g: 'stone-floor', o: 'stump' } },
  spawn: 'stairs',
  points: { v: { name: 'stairs', dir: 'up' } },
  exits: [{ at: '0', to: 'ekimae', point: 'apart', tile: 'stairs-down' }],
  entities: [
    { at: 'α', id: 'r-board', kind: 'activity', tile: 'tablet', activities: ['r11-runes'], name: { jp: 'おくじょうの けいじばん', en: 'Rooftop Notice Board' }, lines: [{ jp: 'じゅうにんたちの メモが いっぱい。「まど、あけとくね」「ただいま！」…', en: 'Covered in the neighbours’ notes. “I’ll leave the window open.” “I’m home!”…' }] },
    { at: 'β', id: 'r-laundry', kind: 'activity', tile: 'sign', activities: ['r11-cross'], name: { jp: 'ものほしざお', en: 'Washing Lines' }, lines: [{ jp: 'せんたくものの かわりに、ことばが ずらりと ほして ある。', en: 'Instead of laundry, words are pegged out in long rows to dry.' }] },
    { at: 'γ', id: 'r-view', kind: 'landmark', tile: 'statue', word: 'tooi', name: { jp: 'おくじょうの ぼうえんきょう', en: 'Rooftop Telescope' }, lines: [{ jp: 'のぞくと、ずっと とおくに たにが 見える。こころの たに だ。', en: 'Look through it, and far, far away you can see a valley: the Valley of Hearts.' }] },
    { at: 'δ', id: 'r-aerial', kind: 'landmark', tile: 'lantern', word: 'terebi', name: { jp: 'テレビの アンテナ', en: 'TV Aerial' }, lines: [{ jp: 'アパートじゅうの テレビに つながる アンテナ。ザーッと 音が する。', en: 'The aerial for every TV in the building. It hisses with static.' }] },
    { at: 'ε', id: 'r-girl', kind: 'npc', sprite: 'child', dir: 'up', name: { jp: 'おくじょうの ハナ', en: 'Hana on the Roof' }, lines: [{ jp: 'ここは わたしの ひみつの ばしょ。…あ、ひみつ じゃなく なっちゃった。', en: 'This is my secret place. …Oh, I guess it’s not a secret any more.' }] },
    { at: 'ζ', id: 'r-planter', kind: 'landmark', tile: 'pot', word: 'akarui', name: { jp: 'ひなたの プランター', en: 'Sunny Planter' }, lines: [{ jp: 'ひあたりの いい プランター。トマトが まっかに なって いる。', en: 'A planter in the full sun. The tomatoes have gone bright red.' }] },
    { at: '$', id: 'r-chest', kind: 'chest', tile: 'chest', chest: { item: 'ether', n: 1, shards: 35 } },
  ],
}

export const MAPS: MapSpec[] = [EKIMAE, EKIMAE_PLATFORM, EKIMAE_CAFE, EKIMAE_YAOYA, EKIMAE_ROOFTOP]

import type { RegionBattle } from '../types'

/**
 * Random encounters in the castle town's long grass and the overgrown castle
 * garden: clockwork tea dolls gone haywire, with the town's old tricksters.
 */
export const BATTLE: RegionBattle = {
  pool: ['karakuri', 'tanuki', 'kitsune', 'tengu'],
  enemies: {
    karakuri: {
      jp: 'からくり人形',
      kana: 'からくりにんぎょう',
      en: 'Clockwork Tea Doll',
      home: 8,
      hpMul: 1.05,
      atkMul: 1.1,
      xpMul: 1.15,
      weak: 'water',
      resist: 'wood',
      attack: { jp: 'あつい おちゃを ぶちまけた！', en: 'flings scalding tea at you!' },
      skill: { jp: 'ぜんまいを まいて、まっすぐ とっしんして きた！', en: 'winds its spring and charges straight at you!', mult: 1.4, chance: 0.22 },
      idle: { jp: 'カタカタ… おじぎを くりかえして いる。', en: 'is bowing over and over, clack-clack.', chance: 0.25 },
      drops: ['herb', 'ether'],
    },
    nurarihyon: {
      jp: 'ぬらりひょん',
      kana: 'ぬらりひょん',
      en: 'Nurarihyon',
      home: 8,
      hpMul: 3,
      atkMul: 1.3,
      xpMul: 4,
      weak: 'light',
      resist: 'wind',
      attack: { jp: 'きせるで ぽかりと たたいた！', en: 'raps you with his long pipe!' },
      skill: { jp: '「ここは わしの いえじゃ」と いすわった！', en: 'settles in: “This is MY house!”', mult: 1.5, chance: 0.25 },
      idle: { jp: 'ゆうゆうと おちゃを すすって いる。', en: 'is sipping tea as if he owned the place.', chance: 0.2 },
      drops: ['ether', 'charm'],
    },
  },
}

import type { RegionBattle } from '../types'

export const BATTLE: RegionBattle = {
  // the harbour's own crab, river kappa come down to the sea, and the shore's wisps and bats
  pool: ['crab', 'kappa', 'wisp', 'bat'],
  enemies: {
    crab: {
      jp: '大蟹',
      kana: 'おおがに',
      en: 'Giant Crab',
      home: 5,
      hpMul: 1.2,
      atkMul: 1,
      xpMul: 1.1,
      weak: 'earth',
      resist: 'water',
      attack: { jp: 'はさみで はさんできた！', en: 'pinches you with a claw!' },
      skill: { jp: 'りょうほうの はさみで ガシャン！', en: 'snaps both claws at once!', mult: 1.5, chance: 0.2 },
      idle: { jp: 'よこに あるいている。', en: 'is walking sideways.', chance: 0.25 },
      drops: ['herb', 'smoke'],
    },
    umibozu: {
      jp: '海坊主',
      kana: 'うみぼうず',
      en: 'Umibōzu',
      home: 5,
      hpMul: 3,
      atkMul: 1.3,
      xpMul: 3,
      weak: 'light',
      resist: 'water',
      attack: { jp: 'おおきな なみを たたきつけた！', en: 'slams down a great wave!' },
      skill: { jp: 'ふねを ひっくりかえそうと した！', en: 'tries to capsize everything!', mult: 1.6, chance: 0.25 },
      drops: ['ether'],
    },
  },
}

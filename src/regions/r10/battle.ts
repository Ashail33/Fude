import type { RegionBattle } from '../types'

/**
 * Over the cloud streets: the raijū, Raijin's thunder beast, which loves to
 * curl up in people's belly buttons, with tengu and harpies riding the
 * updrafts and will-o'-wisps drifting through the storm clouds.
 */
export const BATTLE: RegionBattle = {
  pool: ['raiju', 'tengu', 'harpy', 'wisp'],
  enemies: {
    raiju: {
      jp: '雷獣',
      kana: 'らいじゅう',
      en: 'Raijū',
      home: 10,
      hpMul: 1.05,
      atkMul: 1.15,
      xpMul: 1.25,
      weak: 'earth',
      resist: 'light',
      attack: { jp: 'いなずまの ように とびかかって きた！', en: 'pounces like a bolt of lightning!' },
      skill: { jp: 'からだじゅうの 毛を さかだてて、でんげきを はなった！', en: 'bristles every hair and lets loose a jolt of thunder!', mult: 1.45, chance: 0.22 },
      idle: { jp: 'だれかの おへそを さがして いる…', en: 'is looking for somebody’s belly button…', chance: 0.25 },
      drops: ['ether', 'herb'],
    },
    raijin: {
      jp: '雷神',
      kana: 'らいじん',
      en: 'Raijin',
      home: 10,
      hpMul: 3,
      atkMul: 1.35,
      xpMul: 4,
      weak: 'earth',
      resist: 'light',
      attack: { jp: 'たいこを うちならした！ ドドン！', en: 'beats his drums! BA-BOOM!' },
      skill: { jp: 'ふうじんと いっしょに、かぜと かみなりの あらしを よんだ！', en: 'calls a storm of wind and thunder with Fūjin!', mult: 1.6, chance: 0.28 },
      idle: { jp: 'ばちを くるくる まわして いる。', en: 'is twirling his drumsticks.', chance: 0.15 },
      drops: ['ether', 'charm'],
    },
  },
}

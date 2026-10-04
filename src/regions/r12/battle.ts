import type { RegionBattle } from '../types'

/**
 * In the paddy grass and the bamboo: menrei, mask spirits, the frozen faces
 * the dragon's hunger peeled off the villagers, drifting about looking for
 * a feeling to wear; with tricksy foxes and tanuki, and will-o'-wisps
 * glowing like lost fireflies.
 */
export const BATTLE: RegionBattle = {
  pool: ['menrei', 'kitsune', 'tanuki', 'wisp'],
  enemies: {
    menrei: {
      jp: '面霊',
      kana: 'めんれい',
      en: 'Menrei',
      home: 12,
      hpMul: 1.1,
      atkMul: 1.15,
      xpMul: 1.3,
      weak: 'fire',
      resist: 'wind',
      attack: { jp: 'かおに はりつこうと した！', en: 'tries to stick itself onto your face!' },
      skill: { jp: 'こおった ひょうじょうで にらんだ！ きもちが こおりつく…', en: 'glares with a frozen expression! Your feelings start to freeze…', mult: 1.45, chance: 0.22 },
      idle: { jp: 'わらって いるのか ないて いるのか、わからない 顔で うかんで いる。', en: 'floats there with a face you can’t read: laughing or crying?', chance: 0.25 },
      drops: ['herb', 'ether'],
    },
    hannya: {
      jp: '般若',
      kana: 'はんにゃ',
      en: 'Hannya',
      home: 12,
      hpMul: 3.1,
      atkMul: 1.4,
      xpMul: 4.2,
      weak: 'light',
      resist: 'fire',
      attack: { jp: 'しっとの ほのおを はいた！', en: 'breathes flames of jealousy!' },
      skill: { jp: '「うらやましい！ うらやましい！」 さけびごえが こころを きりさく！', en: '“I envy you! I ENVY you!” Her scream cuts straight to the heart!', mult: 1.6, chance: 0.28 },
      idle: { jp: 'つのの したで、なみだが ひかった ような 気が した。', en: 'For a moment, something like a tear glints beneath her horns.', chance: 0.15 },
      drops: ['ether', 'charm'],
    },
  },
}

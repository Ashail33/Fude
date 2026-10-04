import type { RegionBattle } from '../types'

/**
 * Round the station town: yamabiko, the echo spirits, hiding in the park's
 * long grass and repeating (and stealing) every word you say; tanuki
 * playing tricks in the alleys; a karakuri clockwork doll wandered down
 * from the Castle Town; and raijū that fell from the Cloud Capital above.
 */
export const BATTLE: RegionBattle = {
  pool: ['yamabiko', 'tanuki', 'karakuri', 'raiju'],
  enemies: {
    yamabiko: {
      jp: '山彦',
      kana: 'やまびこ',
      en: 'Yamabiko',
      home: 11,
      hpMul: 1.1,
      atkMul: 1.1,
      xpMul: 1.3,
      weak: 'earth',
      resist: 'wind',
      attack: { jp: 'あなたの ことばを まねして、そのまま なげかえした！', en: 'copies your words and throws them straight back!' },
      skill: { jp: '「ヤッホー… ヤッホー… ヤッホー…」こだまが ぐるぐる まわって あたまが くらくら！', en: '“Yoo-hoo… yoo-hoo… yoo-hoo…” its echo spins round and round until your head reels!', mult: 1.4, chance: 0.22 },
      idle: { jp: 'だれかが しゃべるのを、じっと まって いる…', en: 'is waiting very quietly for someone to say something…', chance: 0.25 },
      drops: ['herb', 'ether'],
    },
    nopperabo: {
      jp: 'のっぺらぼう',
      kana: 'のっぺらぼう',
      en: 'Nopperabō',
      home: 11,
      hpMul: 3,
      atkMul: 1.35,
      xpMul: 4,
      weak: 'light',
      resist: 'water',
      attack: { jp: 'つるんとした 顔を ちかづけて きた！', en: 'leans in close with its smooth, blank face!' },
      skill: { jp: '顔を ひとなで… あなたの あいさつが きえて いく！', en: 'wipes a hand down its face… and your greetings start to vanish!', mult: 1.6, chance: 0.28 },
      idle: { jp: 'だまって、こちらを 見て いる。…目は ないのに。', en: 'stands silently, looking at you. …Though it has no eyes.', chance: 0.15 },
      drops: ['ether', 'charm'],
    },
  },
}

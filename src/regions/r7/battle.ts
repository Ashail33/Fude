import type { RegionBattle } from '../types'

/**
 * Region 7 battles: kamaitachi in the bamboo, with the mountain's tengu,
 * fox spirits and tanuki. The Yamanba's stats are for her appearances as a
 * monster (the boss fight itself is the language duel in ./Boss).
 */
export const BATTLE: RegionBattle = {
  pool: ['kamaitachi', 'tengu', 'kitsune', 'tanuki'],
  enemies: {
    kamaitachi: {
      jp: 'かまいたち',
      kana: 'かまいたち',
      en: 'Kamaitachi',
      home: 7,
      hpMul: 0.95,
      atkMul: 1.25,
      xpMul: 1.2,
      weak: 'fire',
      resist: 'wind',
      attack: { jp: 'かまの つめで きりつけた！', en: 'slashes with its sickle claws!' },
      skill: { jp: 'つむじかぜに のって、みっつの きずを つけた！', en: 'rides a whirlwind and leaves three cuts at once!', mult: 1.5, chance: 0.2 },
      idle: { jp: 'たけやぶの かげで、しっぽを ふっている。', en: 'flicks its tail in the shadow of the bamboo.', chance: 0.2 },
      drops: ['herb', 'smoke'],
    },
    yamanba: {
      jp: 'やまんば',
      kana: 'やまんば',
      en: 'Yamanba',
      home: 7,
      hpMul: 2.2,
      atkMul: 1.35,
      xpMul: 2.5,
      weak: 'water',
      resist: 'fire',
      attack: { jp: 'ほうちょうを ふりまわした！', en: 'swings her kitchen knife!' },
      skill: { jp: 'ことばを むすんで、なげつけた！', en: 'ties a word in a knot and hurls it at you!', mult: 1.5, chance: 0.25 },
      idle: { jp: 'なべを かきまぜて、ひっひっひと わらった。', en: 'stirs her pot and cackles.', chance: 0.2 },
      drops: ['ether'],
    },
  },
}

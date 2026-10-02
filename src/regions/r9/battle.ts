import type { RegionBattle } from '../types'

/** Snow wolves on the mountain paths, with ice slimes, wisps and tengu from earlier roads. */
export const BATTLE: RegionBattle = {
  pool: ['snow-wolf', 'ice-slime', 'wisp', 'tengu'],
  enemies: {
    'snow-wolf': {
      jp: '雪狼',
      kana: 'ゆきおおかみ',
      en: 'Snow Wolf',
      home: 9,
      hpMul: 1.1,
      atkMul: 1.15,
      xpMul: 1.2,
      weak: 'fire',
      resist: 'water',
      attack: { jp: 'こおりの きばで かみついた！', en: 'bites with icy fangs!' },
      skill: { jp: 'とおぼえで ふぶきを よんだ！', en: 'howls up a blizzard!', mult: 1.45, chance: 0.22 },
      idle: { jp: '雪の 中で、じっと みみを すませている。', en: 'is listening intently in the snow.', chance: 0.2 },
      drops: ['herb', 'ether'],
    },
    'yuki-onna': {
      jp: '雪女',
      kana: 'ゆきおんな',
      en: 'Yuki-onna',
      home: 9,
      hpMul: 2.2,
      atkMul: 1.3,
      xpMul: 2.5,
      weak: 'fire',
      resist: 'water',
      attack: { jp: 'こおりの いきを ふきかけた！', en: 'breathes a freezing mist!' },
      skill: { jp: 'ふぶきで、せかいを まっしろに ぬりつぶした！', en: 'whites out the world with a blizzard!', mult: 1.6, chance: 0.25 },
      idle: { jp: '雪の 音に、しずかに みみを かたむけている。', en: 'is quietly listening to the snow.', chance: 0.2 },
      drops: ['ether', 'charm'],
    },
  },
}

/** Cosmetic rewards: outfits and spell effects, unlocked by progress. */

export interface Outfit {
  id: string
  name: string
  jp: string
  /** Robe colour and hat emoji for the player avatar. */
  robe: string
  trim: string
  hat: string
  unlock: { kind: 'start' } | { kind: 'level'; level: number } | { kind: 'region'; region: number } | { kind: 'mastery'; region: number }
}

export const OUTFITS: Outfit[] = [
  { id: 'apprentice', name: 'Apprentice Robe', jp: 'みならいのころも', robe: '#5b6bd6', trim: '#ffd166', hat: '🎓', unlock: { kind: 'start' } },
  { id: 'ember', name: 'Ember Kimono', jp: 'ほのおのきもの', robe: '#d6453d', trim: '#ffb86b', hat: '🔥', unlock: { kind: 'level', level: 3 } },
  { id: 'field', name: 'Field Druid Cloak', jp: 'ののマント', robe: '#3f8f4f', trim: '#c9f29b', hat: '🌿', unlock: { kind: 'region', region: 2 } },
  { id: 'tide', name: 'Tidecaller Haori', jp: 'しおのはおり', robe: '#2d7fb8', trim: '#a8e6ff', hat: '🌊', unlock: { kind: 'level', level: 6 } },
  { id: 'forest', name: 'Forest Sage Robe', jp: 'もりのけんじゃ', robe: '#1f6f5c', trim: '#7ee8c7', hat: '🍃', unlock: { kind: 'region', region: 3 } },
  { id: 'shrine', name: 'Shrine Maiden Garb', jp: 'みこのしょうぞく', robe: '#f2f2f2', trim: '#e0344a', hat: '⛩️', unlock: { kind: 'region', region: 4 } },
  { id: 'night', name: 'Moonlit Shinobi', jp: 'つきのしのび', robe: '#26264a', trim: '#b5b5ff', hat: '🌙', unlock: { kind: 'level', level: 10 } },
  { id: 'tower', name: 'Archmage Vestments', jp: 'だいまどうしのころも', robe: '#7a3fd1', trim: '#ffd166', hat: '🧙', unlock: { kind: 'region', region: 5 } },
  { id: 'village-master', name: 'Village Guardian', jp: 'むらのまもりて', robe: '#b86b2d', trim: '#ffe0b3', hat: '🏮', unlock: { kind: 'mastery', region: 1 } },
  { id: 'dragon', name: 'Dragonslayer Regalia', jp: 'りゅうごろしのよろい', robe: '#111111', trim: '#ff4d6d', hat: '🐉', unlock: { kind: 'mastery', region: 5 } },
]

export interface SpellEffect {
  id: string
  name: string
  emoji: string[]
  unlock: { kind: 'start' } | { kind: 'level'; level: number } | { kind: 'boss'; activityId: string }
}

export const EFFECTS: SpellEffect[] = [
  { id: 'sparkle', name: 'Sparkles', emoji: ['✨', '⭐', '✦'], unlock: { kind: 'start' } },
  { id: 'sakura', name: 'Sakura Storm', emoji: ['🌸', '🌸', '💮'], unlock: { kind: 'level', level: 4 } },
  { id: 'kanji', name: 'Kanji Burst', emoji: ['火', '水', '木', '光'], unlock: { kind: 'boss', activityId: 'r2-boss' } },
  { id: 'lightning', name: 'Thunder', emoji: ['⚡', '💥', '⚡'], unlock: { kind: 'level', level: 8 } },
  { id: 'lantern', name: 'Spirit Lanterns', emoji: ['🏮', '🔥', '✨'], unlock: { kind: 'boss', activityId: 'r3-boss' } },
  { id: 'moon', name: 'Moonfall', emoji: ['🌙', '⭐', '🌟'], unlock: { kind: 'boss', activityId: 'r4-boss' } },
]

/** XP required to reach `level` (level 1 = 0 XP). Gentle quadratic curve. */
export function xpForLevel(level: number): number {
  return Math.round(60 * (level - 1) * (level + 2) * 0.5)
}

export function levelForXp(xp: number): number {
  let l = 1
  while (xpForLevel(l + 1) <= xp) l++
  return l
}

export const TITLES: [number, string, string][] = [
  [1, 'Apprentice', 'みならい'],
  [4, 'Word-Weaver', 'ことばつかい'],
  [8, 'Rune Scholar', 'ルーンがくしゃ'],
  [12, 'Spellwright', 'まほうし'],
  [18, 'Sage', 'けんじゃ'],
  [25, 'Archmage', 'だいまどうし'],
]

export function titleFor(level: number): [string, string] {
  let t = TITLES[0]
  for (const row of TITLES) if (level >= row[0]) t = row
  return [t[1], t[2]]
}

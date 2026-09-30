/**
 * Kanji building blocks and the recipes that combine them. All recipes are
 * genuine component relationships, so combining teaches real etymology.
 */

export interface Radical {
  char: string
  /** Form used when it appears as a component, if different (e.g. 人 → 亻). */
  form?: string
  meaning: string
  reading: string
  emoji: string
  /** Magic Crafting: available from the start vs. unlocked by discovery. */
  starter?: boolean
}

export const RADICALS: Radical[] = [
  { char: '火', meaning: 'fire', reading: 'ひ', emoji: '🔥', starter: true },
  { char: '水', form: '氵', meaning: 'water', reading: 'みず', emoji: '💧', starter: true },
  { char: '木', meaning: 'tree', reading: 'き', emoji: '🌳', starter: true },
  { char: '土', meaning: 'earth', reading: 'つち', emoji: '🟫', starter: true },
  { char: '石', meaning: 'stone', reading: 'いし', emoji: '🪨', starter: true },
  { char: '日', meaning: 'sun', reading: 'ひ', emoji: '☀️', starter: true },
  { char: '月', meaning: 'moon', reading: 'つき', emoji: '🌙', starter: true },
  { char: '人', form: '亻', meaning: 'person', reading: 'ひと', emoji: '🧑', starter: true },
  { char: '口', meaning: 'mouth', reading: 'くち', emoji: '👄', starter: true },
  { char: '山', meaning: 'mountain', reading: 'やま', emoji: '⛰️' },
  { char: '田', meaning: 'rice field', reading: 'た', emoji: '🌾' },
  { char: '力', meaning: 'power', reading: 'ちから', emoji: '💪' },
  { char: '女', meaning: 'woman', reading: 'おんな', emoji: '👩' },
  { char: '子', meaning: 'child', reading: 'こ', emoji: '🧒' },
  { char: '白', meaning: 'white', reading: 'しろ', emoji: '⬜' },
  { char: '門', meaning: 'gate', reading: 'もん', emoji: '⛩️' },
  { char: '耳', meaning: 'ear', reading: 'みみ', emoji: '👂' },
  { char: '心', meaning: 'heart', reading: 'こころ', emoji: '💗' },
  { char: '言', meaning: 'say', reading: 'いう', emoji: '💬' },
  { char: '生', meaning: 'life', reading: 'せい', emoji: '🌱' },
  { char: '雨', meaning: 'rain', reading: 'あめ', emoji: '🌧️' },
  { char: '鳥', meaning: 'bird', reading: 'とり', emoji: '🐦' },
  { char: '目', meaning: 'eye', reading: 'め', emoji: '👁️' },
  { char: '十', meaning: 'ten', reading: 'じゅう', emoji: '🔟' },
  { char: '小', meaning: 'small', reading: 'ちいさい', emoji: '🐭' },
  { char: '大', meaning: 'big', reading: 'おおきい', emoji: '🐘' },
]

export const RADICAL_BY_CHAR = new Map(RADICALS.map((r) => [r.char, r]))

export interface KanjiRecipe {
  result: string
  /** Components (order-insensitive multiset). */
  parts: string[]
  meaning: string
  reading: string
  emoji: string
  /** A one-line story linking the parts to the meaning (mnemonic). */
  story: string
  /** Components unlocked for crafting when this is discovered. */
  unlocks?: string[]
}

export const RECIPES: KanjiRecipe[] = [
  { result: '林', parts: ['木', '木'], meaning: 'grove', reading: 'はやし', emoji: '🌲', story: 'Two trees stand together: a grove.', unlocks: ['山'] },
  { result: '森', parts: ['木', '木', '木'], meaning: 'forest', reading: 'もり', emoji: '🌲', story: 'Three trees make a deep forest.', unlocks: ['鳥'] },
  { result: '炎', parts: ['火', '火'], meaning: 'flame', reading: 'ほのお', emoji: '🔥', story: 'Fire stacked on fire becomes a blazing flame.', unlocks: ['力'] },
  { result: '休', parts: ['人', '木'], meaning: 'rest', reading: 'やすむ', emoji: '😴', story: 'A person leaning against a tree: resting.', unlocks: ['女'] },
  { result: '明', parts: ['日', '月'], meaning: 'bright', reading: 'あかるい', emoji: '💡', story: 'Sun and moon together: brightness.', unlocks: ['白'] },
  { result: '岩', parts: ['山', '石'], meaning: 'boulder', reading: 'いわ', emoji: '🪨', story: 'A stone the size of a mountain.', unlocks: ['田'] },
  { result: '畑', parts: ['火', '田'], meaning: 'farm field', reading: 'はたけ', emoji: '🌱', story: 'Burn the field to prepare it for crops.', unlocks: ['生'] },
  { result: '男', parts: ['田', '力'], meaning: 'man', reading: 'おとこ', emoji: '👨', story: 'Power in the rice field: a man at work.', unlocks: ['子'] },
  { result: '好', parts: ['女', '子'], meaning: 'like', reading: 'すき', emoji: '❤️', story: 'A woman with her child: love and fondness.', unlocks: ['心'] },
  { result: '泉', parts: ['白', '水'], meaning: 'spring', reading: 'いずみ', emoji: '⛲', story: 'Pure white water bubbles up: a spring.', unlocks: ['雨'] },
  { result: '星', parts: ['日', '生'], meaning: 'star', reading: 'ほし', emoji: '⭐', story: 'A sun being born: a star.', unlocks: ['目'] },
  { result: '雷', parts: ['雨', '田'], meaning: 'thunder', reading: 'かみなり', emoji: '⚡', story: 'Rain crashing over the fields: thunder.', unlocks: ['門'] },
  { result: '鳴', parts: ['口', '鳥'], meaning: 'chirp', reading: 'なく', emoji: '🐦', story: 'A bird opens its mouth: chirping.', unlocks: ['耳'] },
  { result: '品', parts: ['口', '口', '口'], meaning: 'goods', reading: 'しな', emoji: '📦', story: 'Boxes stacked in a pile: goods.', unlocks: ['十'] },
  { result: '晶', parts: ['日', '日', '日'], meaning: 'crystal', reading: 'しょう', emoji: '💎', story: 'Three suns sparkling: crystal.', unlocks: ['言'] },
  { result: '朋', parts: ['月', '月'], meaning: 'companion', reading: 'とも', emoji: '🧑‍🤝‍🧑', story: 'Two moons side by side: companions.' },
  { result: '相', parts: ['木', '目'], meaning: 'mutual', reading: 'あい', emoji: '🤝', story: 'An eye watching a tree, the tree watching back.' },
  { result: '加', parts: ['力', '口'], meaning: 'add', reading: 'くわえる', emoji: '➕', story: 'Words (mouth) add power.' },
  { result: '思', parts: ['田', '心'], meaning: 'think', reading: 'おもう', emoji: '🤔', story: 'A field of thought above the heart.' },
  { result: '古', parts: ['十', '口'], meaning: 'old', reading: 'ふるい', emoji: '🏚️', story: 'Ten mouths have told this tale: old.', unlocks: ['小', '大'] },
  { result: '信', parts: ['人', '言'], meaning: 'trust', reading: 'しん', emoji: '🤞', story: 'A person standing by their word: trust.' },
  { result: '間', parts: ['門', '日'], meaning: 'interval', reading: 'あいだ', emoji: '↔️', story: 'Sunlight through a gate: the space between.' },
  { result: '問', parts: ['門', '口'], meaning: 'question', reading: 'もん', emoji: '❓', story: 'A mouth at the gate asks a question.' },
  { result: '聞', parts: ['門', '耳'], meaning: 'hear', reading: 'きく', emoji: '👂', story: 'An ear at the gate: listening.' },
  { result: '尖', parts: ['小', '大'], meaning: 'pointed', reading: 'とがる', emoji: '🔺', story: 'Small on top of big: a sharp point.' },
]

export function findRecipe(parts: string[]): KanjiRecipe | undefined {
  const key = [...parts].sort().join('')
  return RECIPES.find((r) => [...r.parts].sort().join('') === key)
}

/**
 * World-building reactions for the Elemental Fields map. When a tile's
 * element is placed next to another, the pair can transform the landscape.
 */
export interface Reaction {
  a: string
  b: string
  result: string
  label: string
  emoji: string
}

export const REACTIONS: Reaction[] = [
  { a: '木', b: '火', result: '燃', label: 'burning tree', emoji: '🔥' },
  { a: '水', b: '木', result: '茂', label: 'river forest', emoji: '🌴' },
  { a: '水', b: '火', result: '湯', label: 'hot spring', emoji: '♨️' },
  { a: '水', b: '土', result: '泥', label: 'mud', emoji: '🟤' },
  { a: '土', b: '石', result: '岩', label: 'boulder', emoji: '🪨' },
  { a: '日', b: '木', result: '花', label: 'blossom', emoji: '🌸' },
]

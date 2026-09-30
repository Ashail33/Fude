export type Script = 'hiragana' | 'katakana'

export interface Kana {
  id: string // e.g. "h-a", "k-shi"
  char: string
  romaji: string
  script: Script
  row: string // gojūon row: a, ka, sa, ...
}

const ROWS: [string, string[], string[], string[]][] = [
  // row, romaji, hiragana, katakana
  ['a', ['a', 'i', 'u', 'e', 'o'], ['あ', 'い', 'う', 'え', 'お'], ['ア', 'イ', 'ウ', 'エ', 'オ']],
  ['ka', ['ka', 'ki', 'ku', 'ke', 'ko'], ['か', 'き', 'く', 'け', 'こ'], ['カ', 'キ', 'ク', 'ケ', 'コ']],
  ['sa', ['sa', 'shi', 'su', 'se', 'so'], ['さ', 'し', 'す', 'せ', 'そ'], ['サ', 'シ', 'ス', 'セ', 'ソ']],
  ['ta', ['ta', 'chi', 'tsu', 'te', 'to'], ['た', 'ち', 'つ', 'て', 'と'], ['タ', 'チ', 'ツ', 'テ', 'ト']],
  ['na', ['na', 'ni', 'nu', 'ne', 'no'], ['な', 'に', 'ぬ', 'ね', 'の'], ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ']],
  ['ha', ['ha', 'hi', 'fu', 'he', 'ho'], ['は', 'ひ', 'ふ', 'へ', 'ほ'], ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ']],
  ['ma', ['ma', 'mi', 'mu', 'me', 'mo'], ['ま', 'み', 'む', 'め', 'も'], ['マ', 'ミ', 'ム', 'メ', 'モ']],
  ['ya', ['ya', 'yu', 'yo'], ['や', 'ゆ', 'よ'], ['ヤ', 'ユ', 'ヨ']],
  ['ra', ['ra', 'ri', 'ru', 're', 'ro'], ['ら', 'り', 'る', 'れ', 'ろ'], ['ラ', 'リ', 'ル', 'レ', 'ロ']],
  ['wa', ['wa', 'wo', 'n'], ['わ', 'を', 'ん'], ['ワ', 'ヲ', 'ン']],
]

export const HIRAGANA: Kana[] = []
export const KATAKANA: Kana[] = []

for (const [row, romaji, hira, kata] of ROWS) {
  romaji.forEach((r, i) => {
    HIRAGANA.push({ id: `h-${r}`, char: hira[i], romaji: r, script: 'hiragana', row })
    KATAKANA.push({ id: `k-${r}`, char: kata[i], romaji: r, script: 'katakana', row })
  })
}

export const ALL_KANA = [...HIRAGANA, ...KATAKANA]
export const KANA_BY_CHAR = new Map(ALL_KANA.map((k) => [k.char, k]))
export const KANA_ROWS = ROWS.map((r) => r[0])

/**
 * Groups of characters that learners commonly confuse. Used by Spot the
 * Difference: one member is the "imposter" among copies of another.
 * Ordered roughly from easy (early levels) to devious (late levels).
 */
export const CONFUSABLE_SETS: { chars: string[]; level: number; note: string }[] = [
  { chars: ['あ', 'お'], level: 1, note: 'あ has a curved tail; お has a dot' },
  { chars: ['さ', 'き'], level: 1, note: 'き has two horizontal strokes' },
  { chars: ['さ', 'ち'], level: 1, note: 'ち is a mirrored さ' },
  { chars: ['い', 'こ'], level: 1, note: 'い is vertical; こ is horizontal' },
  { chars: ['は', 'ほ'], level: 1, note: 'ほ has a closed top bar' },
  { chars: ['ぬ', 'め'], level: 2, note: 'ぬ ends in a loop' },
  { chars: ['ね', 'れ', 'わ'], level: 2, note: 'Watch the final stroke' },
  { chars: ['る', 'ろ'], level: 2, note: 'る ends in a loop' },
  { chars: ['た', 'な'], level: 2, note: 'な has a knot at the bottom right' },
  { chars: ['け', 'は'], level: 2, note: 'は loops at the bottom' },
  { chars: ['う', 'つ'], level: 2, note: 'う has a dot on top' },
  { chars: ['ク', 'タ'], level: 3, note: 'タ has an extra inner stroke' },
  { chars: ['ソ', 'ン'], level: 3, note: 'ン strokes rise from the bottom' },
  { chars: ['シ', 'ツ'], level: 3, note: 'シ dots stack vertically on the left' },
  { chars: ['ウ', 'ワ'], level: 3, note: 'ウ has a top tick' },
  { chars: ['コ', 'ユ'], level: 3, note: 'ユ bottom stroke extends' },
  { chars: ['ア', 'マ'], level: 3, note: 'ア has a vertical tail' },
  { chars: ['ヌ', 'ス'], level: 3, note: 'ヌ has an extra slash' },
  { chars: ['へ', 'ヘ'], level: 4, note: 'Hiragana へ vs katakana ヘ are near-identical!' },
  { chars: ['り', 'リ'], level: 4, note: 'Hiragana り joins its strokes' },
  { chars: ['か', 'カ'], level: 4, note: 'か has an extra dot' },
  { chars: ['き', 'キ'], level: 4, note: 'Hiragana き has a separate bottom curve' },
  { chars: ['土', '士'], level: 5, note: '土 has the long bottom line; 士 the long top' },
  { chars: ['未', '末'], level: 5, note: '末 has the long top line' },
  { chars: ['大', '犬', '太'], level: 5, note: 'Look for the dot and its position' },
  { chars: ['日', '目', '白'], level: 5, note: 'Count the inner lines' },
  { chars: ['人', '入'], level: 5, note: '入 leans the other way' },
]

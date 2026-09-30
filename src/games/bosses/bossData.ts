/**
 * Hand-curated content for the boss battles. Every Japanese string here has
 * been checked so that wrong options are genuinely wrong (not merely an
 * alternative phrasing), since bosses punish mistakes.
 */
import type { AdjForm, ElementSpell, Particle } from '../../data/sentences'

// ─── Particle Guardian, phase 2 ("blind": no English shown) ──────────────
/**
 * Without the English meaning, some of the authored options become valid
 * Japanese (e.g. 猫はいます, 先生と本). For the blind phase we use an explicit,
 * larger option set per question that stays unambiguous. `accept` lists
 * extra particles that are also correct here.
 */
export interface BlindParticleSet {
  index: number
  options: Particle[]
  accept?: Particle[]
}

export const BLIND_PARTICLE_SETS: BlindParticleSet[] = [
  { index: 0, options: ['を', 'に', 'へ', 'の'] }, // ご飯＿食べます
  { index: 1, options: ['を', 'に', 'へ', 'の'] }, // 水＿飲みます
  { index: 2, options: ['は', 'を', 'に', 'へ', 'で'] }, // 私＿学生です
  { index: 3, options: ['に', 'へ', 'を', 'の'] }, // 学校＿行きます (に / へ both fine)
  { index: 4, options: ['で', 'に', 'へ', 'の'] }, // 学校＿勉強します
  { index: 5, options: ['が', 'を', 'へ', 'の'] }, // 猫＿います
  { index: 6, options: ['と', 'を', 'の', 'へ'] }, // 友達＿行きます
  { index: 8, options: ['へ', 'に', 'を', 'の'] }, // 山＿向かいます (へ / に)
  { index: 9, options: ['で', 'に', 'へ', 'の'] }, // 剣＿切ります
  { index: 11, options: ['に', 'を', 'の', 'へ', 'で'] }, // 七時＿起きます
  { index: 12, options: ['が', 'に', 'で', 'へ'] }, // 犬＿好きです
  { index: 13, options: ['に', 'と', 'を', 'で', 'へ'], accept: ['と'] }, // 友達＿会います (に / と)
  { index: 14, options: ['は', 'が', 'を', 'に', 'へ'] }, // 空＿青いです (は / が)
  { index: 15, options: ['で', 'を', 'に', 'へ'] }, // 日本語＿手紙を書きます
]

// ─── Silent Librarian, phase 3 ───────────────────────────────────────────
/** For a forge sentence: which token to swap for a wrong particle, and which for a wrong word. */
export interface SentenceTrap {
  id: string
  particle: { at: number; to: string }
  word: { at: number; to: string }
}

export const SENTENCE_TRAPS: SentenceTrap[] = [
  { id: 'f1', particle: { at: 3, to: 'に' }, word: { at: 4, to: '食べます' } }, // 私は水を飲みます
  { id: 'f2', particle: { at: 3, to: 'に' }, word: { at: 4, to: '飲みます' } }, // 私はご飯を食べます
  { id: 'f3', particle: { at: 1, to: 'を' }, word: { at: 2, to: 'あります' } }, // 猫がいます
  { id: 'f4', particle: { at: 1, to: 'を' }, word: { at: 2, to: 'います' } }, // 本があります
  { id: 'f5', particle: { at: 3, to: 'で' }, word: { at: 4, to: '来ます' } }, // 私は学校に行きます
  { id: 'f6', particle: { at: 3, to: 'に' }, word: { at: 4, to: '書きます' } }, // 私は本を読みます
  { id: 'f7', particle: { at: 3, to: 'に' }, word: { at: 4, to: '聞きます' } }, // 先生は日本語を話します
  { id: 'f9', particle: { at: 1, to: 'を' }, word: { at: 4, to: '食べます' } }, // 店でパンを買います
  { id: 'f10', particle: { at: 2, to: 'を' }, word: { at: 0, to: '今日' } }, // 明日家に帰ります
  { id: 'f11', particle: { at: 3, to: 'が' }, word: { at: 2, to: '水' } }, // 私は魔法を使います
  { id: 'f13', particle: { at: 1, to: 'を' }, word: { at: 2, to: '赤い' } }, // 海は青いです
  { id: 'f14', particle: { at: 1, to: 'を' }, word: { at: 2, to: '元気' } }, // 神社は静かです
  { id: 'f15', particle: { at: 3, to: 'で' }, word: { at: 2, to: '犬' } }, // 私は猫が好きです
  { id: 'f17', particle: { at: 1, to: 'の' }, word: { at: 2, to: '本' } }, // きれいな花です
]

// ─── Shifting Chimera ────────────────────────────────────────────────────
export interface ChimeraSkin {
  id: string
  en: string
  jp: string
  emoji: string
  color: string
}

export const SKINS: Record<string, ChimeraSkin> = {
  ice: { id: 'ice', en: 'Ice Block', jp: 'こおりのかたまり', emoji: '🧊', color: '#7fd8ff' },
  blaze: { id: 'blaze', en: 'Blazing', jp: 'もえるすがた', emoji: '🔥', color: '#ff6b3d' },
  swift: { id: 'swift', en: 'Super Fast', jp: 'はやいすがた', emoji: '💨', color: '#9be7e0' },
  giant: { id: 'giant', en: 'Gigantic', jp: 'きょだいなすがた', emoji: '⛰️', color: '#c8955a' },
  shadow: { id: 'shadow', en: 'Shadow', jp: 'かげのすがた', emoji: '🌑', color: '#8a6bff' },
  roar: { id: 'roar', en: 'Roaring', jp: 'ほえるすがた', emoji: '📢', color: '#ff9f43' },
  cursed: { id: 'cursed', en: 'Cursed', jp: 'のろいのすがた', emoji: '🦠', color: '#7bd160' },
  withered: { id: 'withered', en: 'Withering', jp: 'かれるすがた', emoji: '🥀', color: '#b88' },
  mirror: { id: 'mirror', en: 'Mirror Hide', jp: 'かがみのすがた', emoji: '🪞', color: '#dfe6ff' },
  armor: { id: 'armor', en: 'Iron Armor', jp: 'てつのよろい', emoji: '🛡️', color: '#aab' },
  sleep: { id: 'sleep', en: 'Sleeping', jp: 'ねむるすがた', emoji: '💤', color: '#a0a8ff' },
  sponge: { id: 'sponge', en: 'Heat Eater', jp: 'ねつをたべるすがた', emoji: '♨️', color: '#ff8c69' },
  tiny: { id: 'tiny', en: 'Shrunken', jp: 'ちいさいすがた', emoji: '🐜', color: '#e0c060' },
}

export interface ChimeraTurn {
  skin: string
  /** The chimera's state (shown big). */
  situation: string
  /** What the player must do, in English, with the key word in CAPS. */
  instruction: string
  adj: string
  form: AdjForm
  /** Attributive turns: element noun that the adjective describes. */
  noun?: ElementSpell['element']
  /** Predicate turns: Japanese frame, with ＿ where the adjective goes. */
  frame?: string
  frameEn?: string
}

export const CHIMERA_TURNS: ChimeraTurn[] = [
  // Phase 1 – attributive (adjective + noun)
  { skin: 'ice', situation: 'The chimera is an ICE BLOCK!', instruction: 'Melt it: cast HOT fire.', adj: '熱い', form: 'attributive', noun: 'fire' },
  { skin: 'blaze', situation: 'The chimera is BLAZING!', instruction: 'Douse it: cast COLD water.', adj: '冷たい', form: 'attributive', noun: 'water' },
  { skin: 'swift', situation: 'The chimera is SUPER FAST!', instruction: 'Catch it: cast FAST wind.', adj: '速い', form: 'attributive', noun: 'wind' },
  { skin: 'giant', situation: 'The chimera is GIGANTIC!', instruction: 'Topple it: cast STRONG wind.', adj: '強い', form: 'attributive', noun: 'wind' },
  { skin: 'shadow', situation: 'The chimera hides in SHADOW!', instruction: 'Reveal it: cast BRIGHT light.', adj: '明るい', form: 'attributive', noun: 'light' },
  { skin: 'roar', situation: 'The chimera is ROARING!', instruction: 'Calm it: cast QUIET wind.', adj: '静か', form: 'attributive', noun: 'wind' },
  { skin: 'cursed', situation: 'The chimera is CURSED!', instruction: 'Purify it: cast BEAUTIFUL light.', adj: 'きれい', form: 'attributive', noun: 'light' },
  { skin: 'withered', situation: 'The chimera withers the forest!', instruction: 'Regrow it: cast an ENERGETIC tree.', adj: '元気', form: 'attributive', noun: 'wood' },
  { skin: 'tiny', situation: 'The chimera SHRANK and hides in a crack!', instruction: 'Reach it: cast LONG water.', adj: '長い', form: 'attributive', noun: 'water' },
  // Phase 2 – negation
  { skin: 'armor', situation: 'Its shield absorbs BIG attacks!', instruction: 'Cast fire that is NOT big.', adj: '大きい', form: 'negative', noun: 'fire' },
  { skin: 'mirror', situation: 'Its mirror hide reflects STRONG spells!', instruction: 'Cast wind that is NOT strong.', adj: '強い', form: 'negative', noun: 'wind' },
  { skin: 'sponge', situation: 'It feeds on HOT things!', instruction: 'Cast water that is NOT hot.', adj: '熱い', form: 'negative', noun: 'water' },
  { skin: 'shadow', situation: 'It drinks BRIGHT light!', instruction: 'Cast light that is NOT bright.', adj: '明るい', form: 'negative', noun: 'light' },
  { skin: 'sleep', situation: 'It is sleeping, lulled by QUIET!', instruction: 'Wake it: cast wind that is NOT quiet.', adj: '静か', form: 'negative', noun: 'wind' },
  { skin: 'mirror', situation: 'Its mirror copies BEAUTIFUL light!', instruction: 'Cast light that is NOT beautiful.', adj: 'きれい', form: 'negative', noun: 'light' },
  { skin: 'swift', situation: 'It dodges every FAST spell!', instruction: 'Cast earth that is NOT fast.', adj: '速い', form: 'negative', noun: 'earth' },
  { skin: 'armor', situation: 'Its iron armor shrugs off WEAK spells!', instruction: 'Cast water that is NOT weak.', adj: '弱い', form: 'negative', noun: 'water' },
  // Phase 3 – past / past negative (predicate)
  { skin: 'giant', situation: '"Your fire was weak!" it sneers.', instruction: 'Retort: my fire WAS strong!', adj: '強い', form: 'past', frame: '私の火は＿！', frameEn: 'My fire ___!' },
  { skin: 'blaze', situation: 'It remembers your last flame.', instruction: 'Say: the flame WAS hot.', adj: '熱い', form: 'past', frame: '炎は＿。', frameEn: 'The flame ___.' },
  { skin: 'roar', situation: 'It wrecked the peaceful forest.', instruction: 'Say: the forest WAS quiet.', adj: '静か', form: 'past', frame: '森は＿。', frameEn: 'The forest ___.' },
  { skin: 'cursed', situation: 'It boasts about its old scales.', instruction: 'Say: its scales WERE NOT beautiful.', adj: 'きれい', form: 'pastNegative', frame: 'うろこは＿。', frameEn: 'The scales ___.' },
  { skin: 'swift', situation: 'It claims its last dash was lightning.', instruction: 'Say: that wind WAS NOT fast.', adj: '速い', form: 'pastNegative', frame: 'その風は＿。', frameEn: 'That wind ___.' },
  { skin: 'armor', situation: 'It hides behind a shield again.', instruction: 'Say: the shield WAS NOT big.', adj: '大きい', form: 'pastNegative', frame: '盾は＿。', frameEn: 'The shield ___.' },
  { skin: 'withered', situation: 'It drained your energy earlier.', instruction: 'Say: I WAS NOT energetic.', adj: '元気', form: 'pastNegative', frame: '私は＿。', frameEn: 'I ___.' },
  { skin: 'ice', situation: 'It melted, then froze again.', instruction: 'Say: the water WAS cold.', adj: '冷たい', form: 'past', frame: '水は＿。', frameEn: 'The water ___.' },
  { skin: 'shadow', situation: 'The shadow fades before your spell.', instruction: 'Say: the light WAS bright.', adj: '明るい', form: 'past', frame: '光は＿。', frameEn: 'The light ___.' },
]

// ─── Void Dragon ─────────────────────────────────────────────────────────
export interface DragonForm {
  id: string
  en: string
  jp: string
  emoji: string
  color: string
  /** English hint of what breaks this form. */
  hint: string
  weakness: ElementSpell['element']
}

export const DRAGON_FORMS: DragonForm[] = [
  { id: 'frost', en: 'Frost Dragon', jp: 'こおりの竜', emoji: '🧊', color: '#7fd8ff', hint: 'Its ice scales crack under FIRE.', weakness: 'fire' },
  { id: 'inferno', en: 'Inferno Dragon', jp: 'ほのおの竜', emoji: '🔥', color: '#ff6b3d', hint: 'Its flames die under WATER.', weakness: 'water' },
  { id: 'stone', en: 'Stone Dragon', jp: 'いわの竜', emoji: '🪨', color: '#c8955a', hint: 'Roots of WOOD split its stone.', weakness: 'wood' },
  { id: 'shadow', en: 'Shadow Dragon', jp: 'かげの竜', emoji: '🌑', color: '#8a6bff', hint: 'Shadows vanish in LIGHT.', weakness: 'light' },
  { id: 'storm', en: 'Storm Dragon', jp: 'あらしの竜', emoji: '⛈️', color: '#9be7e0', hint: 'EARTH grounds its lightning.', weakness: 'earth' },
  { id: 'void', en: 'Void Dragon', jp: 'こくうの竜', emoji: '🌀', color: '#c77dff', hint: 'Only WIND can scatter the void.', weakness: 'wind' },
]

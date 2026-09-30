/** Sentence content for Sentence Forge, Rune Reading, bosses and combat. */

export interface ForgeSentence {
  id: string
  en: string
  /** Tiles in the correct order. */
  tokens: string[]
  /** Other acceptable orders (e.g. time word moved). */
  alts?: string[][]
  /** Extra wrong tiles shown at higher difficulty. */
  distractors: string[]
  region: number
  /** Grammar hint shown after a wrong attempt. */
  hint: string
}

export const FORGE_SENTENCES: ForgeSentence[] = [
  { id: 'f1', en: 'I drink water.', tokens: ['私', 'は', '水', 'を', '飲みます'], distractors: ['が', '食べます'], region: 3, hint: 'Topic は after the speaker; object を after what you drink.' },
  { id: 'f2', en: 'I eat rice.', tokens: ['私', 'は', 'ご飯', 'を', '食べます'], distractors: ['に', '飲みます'], region: 3, hint: 'を marks the thing being eaten.' },
  { id: 'f3', en: 'There is a cat.', tokens: ['猫', 'が', 'います'], distractors: ['あります', 'を'], region: 3, hint: 'Living things use います; が marks what exists.' },
  { id: 'f4', en: 'There is a book.', tokens: ['本', 'が', 'あります'], distractors: ['います', 'を'], region: 3, hint: 'Objects use あります.' },
  { id: 'f5', en: 'I go to school.', tokens: ['私', 'は', '学校', 'に', '行きます'], alts: [['私', 'は', '学校', 'へ', '行きます']], distractors: ['を', '来ます'], region: 3, hint: 'に (or へ) marks the destination.' },
  { id: 'f6', en: 'I read a book.', tokens: ['私', 'は', '本', 'を', '読みます'], distractors: ['で', '書きます'], region: 3, hint: 'を marks what is read.' },
  { id: 'f7', en: 'The teacher speaks Japanese.', tokens: ['先生', 'は', '日本語', 'を', '話します'], distractors: ['に', '聞きます'], region: 3, hint: 'The language spoken takes を.' },
  { id: 'f8', en: 'I cross the bridge.', tokens: ['私', 'は', '橋', 'を', '渡ります'], distractors: ['に', 'が'], region: 3, hint: 'Crossing a place uses を.' },
  { id: 'f9', en: 'I buy bread at the shop.', tokens: ['店', 'で', 'パン', 'を', '買います'], distractors: ['に', 'が'], region: 3, hint: 'で marks where an action happens.' },
  { id: 'f10', en: 'I go home tomorrow.', tokens: ['明日', '家', 'に', '帰ります'], alts: [['明日', '家', 'へ', '帰ります']], distractors: ['を', '今日'], region: 3, hint: 'Time words usually come first; に marks the destination.' },
  { id: 'f11', en: 'I use magic.', tokens: ['私', 'は', '魔法', 'を', '使います'], distractors: ['に', 'で'], region: 3, hint: 'The thing used takes を.' },
  { id: 'f12', en: 'I go to the station with a friend.', tokens: ['友達', 'と', '駅', 'に', '行きます'], alts: [['友達', 'と', '駅', 'へ', '行きます'], ['駅', 'に', '友達', 'と', '行きます']], distractors: ['を', 'で'], region: 3, hint: 'と means "together with".' },
  { id: 'f13', en: 'The sea is blue.', tokens: ['海', 'は', '青い', 'です'], distractors: ['を', '赤い'], region: 4, hint: 'i-adjectives come straight before です.' },
  { id: 'f14', en: 'The shrine is quiet.', tokens: ['神社', 'は', '静か', 'です'], distractors: ['な', 'を'], region: 4, hint: 'na-adjectives drop な before です.' },
  { id: 'f15', en: 'I like cats.', tokens: ['私', 'は', '猫', 'が', '好き', 'です'], distractors: ['を', 'な'], region: 4, hint: '好き takes が for the thing liked.' },
  { id: 'f16', en: 'It is a big mountain.', tokens: ['大きい', '山', 'です'], distractors: ['な', 'は'], region: 4, hint: 'i-adjectives attach directly to nouns.' },
  { id: 'f17', en: 'It is a beautiful flower.', tokens: ['きれい', 'な', '花', 'です'], distractors: ['い', 'を'], region: 4, hint: 'na-adjectives need な before a noun.' },
  { id: 'f18', en: 'The dragon flies in the sky.', tokens: ['竜', 'が', '空', 'を', '飛びます'], distractors: ['に', 'で'], region: 5, hint: 'Moving through a space takes を.' },
  { id: 'f19', en: 'The hero protects the castle.', tokens: ['勇者', 'は', '城', 'を', '守ります'], distractors: ['に', '壊します'], region: 5, hint: 'What is protected takes を.' },
  { id: 'f20', en: 'I cut the demon with a sword.', tokens: ['剣', 'で', '鬼', 'を', '切ります'], alts: [['鬼', 'を', '剣', 'で', '切ります']], distractors: ['に', 'が'], region: 5, hint: 'で marks the tool; を the target.' },
  { id: 'f21', en: 'I help my friend.', tokens: ['友達', 'を', '助けます'], distractors: ['に', 'が'], region: 5, hint: 'The person helped takes を.' },
  { id: 'f22', en: 'The light of the moon is beautiful.', tokens: ['月', 'の', '光', 'は', 'きれい', 'です'], distractors: ['な', 'を'], region: 5, hint: 'の links nouns: "moon\'s light".' },
]

export interface Rune {
  id: string
  jp: string
  /** Reading in kana (shown as help in early immersion). */
  reading: string
  answer: string
  wrong: [string, string]
  region: number
}

export const RUNES: Rune[] = [
  { id: 'r1', jp: 'ねこがいます', reading: 'ねこがいます', answer: 'There is a cat.', wrong: ['I eat a cat.', 'The cat drinks water.'], region: 3 },
  { id: 'r2', jp: '水をください', reading: 'みずをください', answer: 'Water, please.', wrong: ['The water is cold.', 'I drink water.'], region: 3 },
  { id: 'r3', jp: '私は学生です', reading: 'わたしはがくせいです', answer: 'I am a student.', wrong: ['I am a teacher.', 'I go to school.'], region: 3 },
  { id: 'r4', jp: '犬が好きです', reading: 'いぬがすきです', answer: 'I like dogs.', wrong: ['There is a dog.', 'The dog is big.'], region: 4 },
  { id: 'r5', jp: '山は高いです', reading: 'やまはたかいです', answer: 'The mountain is tall.', wrong: ['The mountain is far.', 'I climb the mountain.'], region: 4 },
  { id: 'r6', jp: '明日、神社に行きます', reading: 'あした、じんじゃにいきます', answer: 'Tomorrow I will go to the shrine.', wrong: ['Today I went to the temple.', 'The shrine is quiet tomorrow.'], region: 4 },
  { id: 'r7', jp: 'この本は古いです', reading: 'このほんはふるいです', answer: 'This book is old.', wrong: ['This book is new.', 'That book is interesting.'], region: 4 },
  { id: 'r8', jp: '橋を渡ってはいけません', reading: 'はしをわたってはいけません', answer: 'You must not cross the bridge.', wrong: ['Please cross the bridge.', 'The bridge is broken.'], region: 4 },
  { id: 'r9', jp: '川の水は冷たいです', reading: 'かわのみずはつめたいです', answer: 'The river water is cold.', wrong: ['The river is long.', 'I drink river water.'], region: 4 },
  { id: 'r10', jp: '店でパンを買いました', reading: 'みせでパンをかいました', answer: 'I bought bread at the shop.', wrong: ['I will buy bread at the shop.', 'The shop sells rice.'], region: 4 },
  { id: 'r11', jp: '森の中に鬼がいます', reading: 'もりのなかにおにがいます', answer: 'There is a demon in the forest.', wrong: ['The demon left the forest.', 'The forest is scary.'], region: 4 },
  { id: 'r12', jp: '静かな夜です', reading: 'しずかなよるです', answer: 'It is a quiet night.', wrong: ['It is a noisy night.', 'The night is cold.'], region: 4 },
  { id: 'r13', jp: '竜は火を使います', reading: 'りゅうはひをつかいます', answer: 'The dragon uses fire.', wrong: ['The dragon fears fire.', 'I use the dragon\'s fire.'], region: 5 },
  { id: 'r14', jp: '勇者は城を守りました', reading: 'ゆうしゃはしろをまもりました', answer: 'The hero protected the castle.', wrong: ['The hero destroyed the castle.', 'The king protected the hero.'], region: 5 },
  { id: 'r15', jp: '光る剣で闇を切ります', reading: 'ひかるつるぎでやみをきります', answer: 'I cut the darkness with a shining sword.', wrong: ['The darkness breaks my sword.', 'I polish the sword in the dark.'], region: 5 },
  { id: 'r16', jp: '友達を助けたいです', reading: 'ともだちをたすけたいです', answer: 'I want to help my friend.', wrong: ['My friend helped me.', 'I cannot help my friend.'], region: 5 },
]

export type Particle = 'は' | 'が' | 'を' | 'に' | 'で' | 'へ' | 'と' | 'の'

export interface ParticleQuestion {
  en: string
  before: string
  after: string
  answer: Particle
  /** Accepted alternatives (e.g. へ for destinations). */
  accept?: Particle[]
  options: Particle[]
  why: string
}

export const PARTICLE_QUESTIONS: ParticleQuestion[] = [
  { en: 'I eat rice.', before: 'ご飯', after: '食べます', answer: 'を', options: ['に', 'を', 'へ'], why: 'を marks the direct object.' },
  { en: 'I drink water.', before: '水', after: '飲みます', answer: 'を', options: ['を', 'が', 'で'], why: 'を marks what is drunk.' },
  { en: 'As for me, I am a student.', before: '私', after: '学生です', answer: 'は', options: ['を', 'は', 'に'], why: 'は marks the topic.' },
  { en: 'I go to school.', before: '学校', after: '行きます', answer: 'に', accept: ['へ'], options: ['を', 'に', 'で'], why: 'に marks the destination.' },
  { en: 'I study at school.', before: '学校', after: '勉強します', answer: 'で', options: ['に', 'で', 'を'], why: 'で marks where an action takes place.' },
  { en: 'There is a cat.', before: '猫', after: 'います', answer: 'が', options: ['が', 'を', 'で'], why: 'が marks the subject that exists.' },
  { en: 'I go with a friend.', before: '友達', after: '行きます', answer: 'と', options: ['と', 'を', 'の'], why: 'と means "together with".' },
  { en: "The teacher's book.", before: '先生', after: '本', answer: 'の', options: ['の', 'と', 'は'], why: 'の shows possession.' },
  { en: 'I head toward the mountain.', before: '山', after: '向かいます', answer: 'へ', accept: ['に'], options: ['へ', 'で', 'を'], why: 'へ marks direction.' },
  { en: 'I cut with a sword.', before: '剣', after: '切ります', answer: 'で', options: ['で', 'を', 'が'], why: 'で marks the tool or means.' },
  { en: 'I cross the bridge.', before: '橋', after: '渡ります', answer: 'を', options: ['に', 'を', 'で'], why: 'を marks the space moved through.' },
  { en: 'I wake up at 7.', before: '七時', after: '起きます', answer: 'に', options: ['に', 'で', 'を'], why: 'に marks a specific time.' },
  { en: 'I like dogs.', before: '犬', after: '好きです', answer: 'が', options: ['を', 'が', 'に'], why: '好き takes が for its object.' },
  { en: 'I meet my friend.', before: '友達', after: '会います', answer: 'に', options: ['に', 'を', 'で'], why: '会う takes に for the person met.' },
  { en: 'The sky is blue.', before: '空', after: '青いです', answer: 'は', accept: ['が'], options: ['は', 'を', 'で'], why: 'は marks the topic being described.' },
  { en: 'I write a letter in Japanese.', before: '日本語', after: '手紙を書きます', answer: 'で', options: ['で', 'を', 'に'], why: 'で marks the means (language).' },
]

export interface Adjective {
  base: string
  kana: string
  en: string
  kind: 'i' | 'na'
}

export const ADJECTIVES: Adjective[] = [
  { base: '熱い', kana: 'あつい', en: 'hot', kind: 'i' },
  { base: '冷たい', kana: 'つめたい', en: 'cold', kind: 'i' },
  { base: '速い', kana: 'はやい', en: 'fast', kind: 'i' },
  { base: '遅い', kana: 'おそい', en: 'slow', kind: 'i' },
  { base: '大きい', kana: 'おおきい', en: 'big', kind: 'i' },
  { base: '小さい', kana: 'ちいさい', en: 'small', kind: 'i' },
  { base: '強い', kana: 'つよい', en: 'strong', kind: 'i' },
  { base: '弱い', kana: 'よわい', en: 'weak', kind: 'i' },
  { base: '長い', kana: 'ながい', en: 'long', kind: 'i' },
  { base: '明るい', kana: 'あかるい', en: 'bright', kind: 'i' },
  { base: 'きれい', kana: 'きれい', en: 'beautiful', kind: 'na' },
  { base: '静か', kana: 'しずか', en: 'quiet', kind: 'na' },
  { base: '元気', kana: 'げんき', en: 'energetic', kind: 'na' },
  { base: '大切', kana: 'たいせつ', en: 'precious', kind: 'na' },
]

export type AdjForm = 'attributive' | 'negative' | 'past' | 'pastNegative'

/** Conjugate an adjective. Handles いい → よく irregularity. */
export function conjugate(adj: Adjective, form: AdjForm): string {
  if (adj.kind === 'na') {
    switch (form) {
      case 'attributive':
        return `${adj.base}な`
      case 'negative':
        return `${adj.base}じゃない`
      case 'past':
        return `${adj.base}だった`
      case 'pastNegative':
        return `${adj.base}じゃなかった`
    }
  }
  const stem = adj.base === 'いい' ? 'よ' : adj.base.slice(0, -1)
  switch (form) {
    case 'attributive':
      return adj.base
    case 'negative':
      return `${stem}くない`
    case 'past':
      return `${stem}かった`
    case 'pastNegative':
      return `${stem}くなかった`
  }
}

export const ADJ_FORM_LABEL: Record<AdjForm, string> = {
  attributive: 'describing a noun (~ spell)',
  negative: 'NOT ~',
  past: 'WAS ~',
  pastNegative: 'WAS NOT ~',
}

/** Spell-casting combat: element nouns and the phrases that invoke them. */
export interface ElementSpell {
  element: 'fire' | 'water' | 'wood' | 'earth' | 'light' | 'wind'
  noun: string
  kana: string
  en: string
  emoji: string
  color: string
}

export const ELEMENT_SPELLS: ElementSpell[] = [
  { element: 'fire', noun: '火', kana: 'ひ', en: 'fire', emoji: '🔥', color: '#ff6b3d' },
  { element: 'water', noun: '水', kana: 'みず', en: 'water', emoji: '💧', color: '#3da5ff' },
  { element: 'wood', noun: '木', kana: 'き', en: 'wood', emoji: '🌿', color: '#4cd07d' },
  { element: 'earth', noun: '土', kana: 'つち', en: 'earth', emoji: '🪨', color: '#c8955a' },
  { element: 'light', noun: '光', kana: 'ひかり', en: 'light', emoji: '✨', color: '#ffe066' },
  { element: 'wind', noun: '風', kana: 'かぜ', en: 'wind', emoji: '🌪️', color: '#9be7e0' },
]

export interface Enemy {
  id: string
  name: string
  jp: string
  emoji: string
  hp: number
  weakness: ElementSpell['element']
  /** Flavour line in Japanese, with English. */
  taunt: [string, string]
}

export const ENEMIES: Enemy[] = [
  { id: 'slime', name: 'Ice Slime', jp: '氷スライム', emoji: '🧊', hp: 3, weakness: 'fire', taunt: ['つめたいぞ！', "I'm cold!"] },
  { id: 'imp', name: 'Fire Imp', jp: '火の小鬼', emoji: '😈', hp: 3, weakness: 'water', taunt: ['もやすぞ！', "I'll burn you!"] },
  { id: 'golem', name: 'Stone Golem', jp: '石のゴーレム', emoji: '🗿', hp: 4, weakness: 'wood', taunt: ['かたいぞ！', "I'm hard!"] },
  { id: 'wisp', name: 'Shadow Wisp', jp: '影の精', emoji: '👻', hp: 3, weakness: 'light', taunt: ['くらいぞ…', "It's dark..."] },
  { id: 'harpy', name: 'Storm Harpy', jp: '嵐のハーピー', emoji: '🦅', hp: 4, weakness: 'earth', taunt: ['とぶぞ！', "I'm flying!"] },
  { id: 'treant', name: 'Rotten Treant', jp: '腐った木', emoji: '🌲', hp: 5, weakness: 'fire', taunt: ['おおきいぞ！', "I'm huge!"] },
  { id: 'dragon', name: 'Void Dragon', jp: '虚空の竜', emoji: '🐉', hp: 6, weakness: 'wind', taunt: ['つよいぞ！', "I'm strong!"] },
]

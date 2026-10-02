/**
 * Pure logic for Raijin's boss fight (see ./Boss.tsx): the drum calls (a
 * verb and the form he wants), Fūjin's scattered sentences, and the
 * fill-the-gap storm questions. Kept free of React so it can be tested.
 */
import type { ForgeSentence } from '../../data/sentences'
import { shuffle } from '../../engine/random'
import { DATA } from './data'

export type Form = 'nai' | 'pot' | 'tara' | 'ba'

/** Grammar point each drum-call form drills. */
export const FORM_GRAMMAR: Record<Form, string> = { nai: 'nai-form', pot: 'potential', tara: 'tara', ba: 'ba' }

/** What Raijin shouts for each form, and what it means. */
export const FORM_CALL: Record<Form, { jp: string; en: string }> = {
  nai: { jp: '「ない」に しろ！', en: 'Make it NOT! (ない-form)' },
  pot: { jp: '「できる」に しろ！', en: 'Make it CAN! (potential)' },
  tara: { jp: '「たら」に しろ！', en: 'Make it “if / once”! (〜たら)' },
  ba: { jp: '「ば」に しろ！', en: 'Make it “if”! (〜ば)' },
}

type Kind = 'godan' | 'ichidan' | 'irregular'

export interface DrumVerb {
  /** Vocabulary id. */
  id: string
  /** Dictionary form as written, and its reading. */
  jp: string
  kana: string
  en: string
  kind: Kind
  nai: string
  /** Potential form (omitted where it would be odd: weather, わかる…). */
  pot?: string
  tara: string
  ba: string
}

const V = (id: string, jp: string, kana: string, en: string, kind: Kind, nai: string, pot: string | undefined, tara: string, ba: string): DrumVerb => ({ id, jp, kana, en, kind, nai, pot, tara, ba })

/** Verbs Raijin drums at you: the old friends of the road and this region's new ones. */
export const DRUM_VERBS: DrumVerb[] = [
  V('taberu', '食べる', 'たべる', 'eat', 'ichidan', 'たべない', 'たべられる', 'たべたら', 'たべれば'),
  V('nomu', '飲む', 'のむ', 'drink', 'godan', 'のまない', 'のめる', 'のんだら', 'のめば'),
  V('iku', '行く', 'いく', 'go', 'godan', 'いかない', 'いける', 'いったら', 'いけば'),
  V('kuru', '来る', 'くる', 'come', 'irregular', 'こない', 'こられる', 'きたら', 'くれば'),
  V('suru', 'する', 'する', 'do', 'irregular', 'しない', 'できる', 'したら', 'すれば'),
  V('yomu', '読む', 'よむ', 'read', 'godan', 'よまない', 'よめる', 'よんだら', 'よめば'),
  V('kaku', '書く', 'かく', 'write', 'godan', 'かかない', 'かける', 'かいたら', 'かけば'),
  V('hanasu', '話す', 'はなす', 'speak', 'godan', 'はなさない', 'はなせる', 'はなしたら', 'はなせば'),
  V('matsu', '待つ', 'まつ', 'wait', 'godan', 'またない', 'まてる', 'まったら', 'まてば'),
  V('kau', '買う', 'かう', 'buy', 'godan', 'かわない', 'かえる', 'かったら', 'かえば'),
  V('miru', '見る', 'みる', 'see', 'ichidan', 'みない', 'みられる', 'みたら', 'みれば'),
  V('kaeru', '帰る', 'かえる', 'go home', 'godan', 'かえらない', 'かえれる', 'かえったら', 'かえれば'),
  V('aru', 'ある', 'ある', 'exist (things)', 'godan', 'ない', undefined, 'あったら', 'あれば'),
  V('tsukuru', '作る', 'つくる', 'make', 'godan', 'つくらない', 'つくれる', 'つくったら', 'つくれば'),
  V('kiku', '聞く', 'きく', 'listen', 'godan', 'きかない', 'きける', 'きいたら', 'きけば'),
  V('omou', '思う', 'おもう', 'think', 'godan', 'おもわない', undefined, 'おもったら', 'おもえば'),
  V('wakaru', '分かる', 'わかる', 'understand', 'godan', 'わからない', undefined, 'わかったら', 'わかれば'),
  V('oboeru', '覚える', 'おぼえる', 'remember', 'ichidan', 'おぼえない', 'おぼえられる', 'おぼえたら', 'おぼえれば'),
  V('wasureru', '忘れる', 'わすれる', 'forget', 'ichidan', 'わすれない', 'わすれられる', 'わすれたら', 'わすれれば'),
  V('kimeru', '決める', 'きめる', 'decide', 'ichidan', 'きめない', 'きめられる', 'きめたら', 'きめれば'),
  V('erabu', '選ぶ', 'えらぶ', 'choose', 'godan', 'えらばない', 'えらべる', 'えらんだら', 'えらべば'),
  V('oshieru', '教える', 'おしえる', 'teach', 'ichidan', 'おしえない', 'おしえられる', 'おしえたら', 'おしえれば'),
  V('shinjiru', '信じる', 'しんじる', 'believe', 'ichidan', 'しんじない', 'しんじられる', 'しんじたら', 'しんじれば'),
  V('tsuzukeru', '続ける', 'つづける', 'continue', 'ichidan', 'つづけない', 'つづけられる', 'つづけたら', 'つづければ'),
  V('furu', '降る', 'ふる', 'fall (rain)', 'godan', 'ふらない', undefined, 'ふったら', 'ふれば'),
  V('fuku', '吹く', 'ふく', 'blow (wind)', 'godan', 'ふかない', undefined, 'ふいたら', 'ふけば'),
  V('hareru', '晴れる', 'はれる', 'clear up', 'ichidan', 'はれない', undefined, 'はれたら', 'はれれば'),
]

/** A plausible wrong conjugation: the classic slip of bolting the ending onto the dictionary form. */
export function slip(v: DrumVerb, form: Form): string {
  if (form === 'pot') return v.kind === 'ichidan' ? `${v.kana.slice(0, -1)}える` : `${v.kana}られる`
  return v.kana + { nai: 'ない', tara: 'たら', ba: 'ば' }[form]
}

export interface DrumQ {
  verb: DrumVerb
  form: Form
  answer: string
  options: string[]
  /** One-line rule shown after the answer. */
  rule: string
}

const RULES: Record<Form, Record<Kind, string>> = {
  nai: { godan: 'う-verbs: last sound to the あ row + ない (よむ → よまない; う → わ: かう → かわない).', ichidan: 'る-verbs: drop る + ない (たべる → たべない).', irregular: 'Irregular: する → しない, くる → こない, ある → ない.' },
  pot: { godan: 'う-verbs: last sound to the え row + る (よむ → よめる).', ichidan: 'る-verbs: drop る + られる (たべる → たべられる).', irregular: 'Irregular: する → できる, くる → こられる.' },
  tara: { godan: 'た-form + ら (よむ → よんだ → よんだら; いく → いった → いったら).', ichidan: 'た-form + ら (たべる → たべた → たべたら).', irregular: 'た-form + ら (する → したら, くる → きたら).' },
  ba: { godan: 'Last sound to the え row + ば (よむ → よめば).', ichidan: 'Drop る, add れば (たべる → たべれば).', irregular: 'する → すれば, くる → くれば.' },
}

export function drumQuestion(v: DrumVerb, form: Form, rng: () => number = Math.random): DrumQ {
  const answer = v[form]!
  const others = (['nai', 'pot', 'tara', 'ba'] as Form[]).filter((f) => f !== form && v[f]).map((f) => v[f]!)
  const pool = [...new Set([slip(v, form), ...others])].filter((o) => o !== answer)
  const picked = pool.sort(() => rng() - 0.5).slice(0, 3)
  return { verb: v, form, answer, options: shuffle([answer, ...picked]), rule: RULES[form][v.kind] }
}

/** All (verb, form) pairs Raijin may call. */
export const DRUM_CALLS: { verb: DrumVerb; form: Form }[] = DRUM_VERBS.flatMap((verb) => (['nai', 'pot', 'tara', 'ba'] as Form[]).filter((form) => verb[form]).map((form) => ({ verb, form })))

// ─── Fūjin's gale: rebuild the scattered sentence ─────────────────────

export interface GaleQ {
  sentence: ForgeSentence
  tiles: string[]
}

export const GALE_SENTENCES: ForgeSentence[] = DATA.sentences

export function galeQuestion(s: ForgeSentence): GaleQ {
  const extra = s.distractors.slice(0, 1)
  return { sentence: s, tiles: shuffle([...s.tokens, ...extra]) }
}

export function galeCorrect(s: ForgeSentence, picked: string[]): boolean {
  return [s.tokens, ...(s.alts ?? [])].some((t) => t.length === picked.length && t.every((x, i) => x === picked[i]))
}

// ─── The storm: fill the gap with the right grammar ──────────────────

export interface Gap {
  id: string
  /** Grammar point (data.ts) this gap tests. */
  grammar: string
  /** Sentence with ＿ where the answer goes. */
  jp: string
  en: string
  answer: string
  wrong: [string, string, string]
}

export const GAPS: Gap[] = [
  { id: 'g1', grammar: 'deshou', jp: 'あしたは 雪＿。', en: 'It will probably snow tomorrow.', answer: 'でしょう', wrong: ['ましょう', 'ください', 'つもりです'] },
  { id: 'g2', grammar: 'kamoshirenai', jp: 'あしたは 雨が ふる＿。', en: 'It might rain tomorrow.', answer: 'かもしれません', wrong: ['つもりです', 'ましょう', 'ください'] },
  { id: 'g3', grammar: 'to-omou', jp: 'らいじんさまは ほんとうは やさしいと ＿。', en: 'I think Lord Raijin is kind, really.', answer: 'おもいます', wrong: ['できます', 'なります', 'あります'] },
  { id: 'g4', grammar: 'tsumori', jp: 'あした、そうぞうの とうへ 行く ＿です。', en: 'I plan to go to the Tower of Creation tomorrow.', answer: 'つもり', wrong: ['ば', 'より', 'を'] },
  { id: 'g5', grammar: 'nakereba-naranai', jp: 'もう かえら＿ なりません。', en: 'I have to go home now.', answer: 'なければ', wrong: ['ないで', 'なかった', 'ない'] },
  { id: 'g6', grammar: 'kara-because', jp: '雨だ＿、きょうは 行きません。', en: 'It’s raining, so I won’t go today.', answer: 'から', wrong: ['より', 'ほど', 'まで'] },
  { id: 'g7', grammar: 'yori-hou', jp: '雨＿ 雪の ほうが 好きです。', en: 'I like snow more than rain.', answer: 'より', wrong: ['から', 'まで', 'で'] },
  { id: 'g8', grammar: 'naka-de-ichiban', jp: '天気の 中＿ 晴れが いちばん 好きです。', en: 'Of all kinds of weather, I like clear skies best.', answer: 'で', wrong: ['を', 'へ', 'から'] },
  { id: 'g9', grammar: 'tara', jp: '＿、さんぽに 行きましょう。', en: 'Once it clears up, let’s go for a walk.', answer: 'はれたら', wrong: ['はれるたら', 'はれれたら', 'はれてら'] },
  { id: 'g10', grammar: 'ba', jp: 'まいにち ＿、おぼえます。', en: 'If you read every day, you’ll remember.', answer: 'よめば', wrong: ['よむば', 'よみば', 'よんでば'] },
  { id: 'g11', grammar: 'potential', jp: 'わたしは この かんじが ＿。', en: 'I can read this kanji.', answer: 'よめます', wrong: ['よむます', 'よめるます', 'よみれます'] },
  { id: 'g12', grammar: 'koto-ga-dekiru', jp: 'てんにんは 雲の 上を あるく ＿ できます。', en: 'Celestial maidens can walk on the clouds.', answer: 'ことが', wrong: ['から', 'つもり', 'ほうが'] },
  { id: 'g13', grammar: 'nai-form', jp: 'きょうは 雨が ＿。', en: 'It won’t rain today.', answer: 'ふらない', wrong: ['ふりない', 'ふるない', 'ふるくない'] },
  { id: 'g14', grammar: 'to-whenever', jp: '風が ふく＿、雲が うごきます。', en: 'Whenever the wind blows, the clouds move.', answer: 'と', wrong: ['を', 'より', 'で'] },
  { id: 'g15', grammar: 'plain-form', jp: 'たいこを しずかに ＿ つもりです。', en: 'I intend to beat the drum quietly.', answer: 'たたく', wrong: ['たたきます', 'たたいて', 'たたけば'] },
]

export function gapOptions(g: Gap): string[] {
  return shuffle([g.answer, ...g.wrong])
}

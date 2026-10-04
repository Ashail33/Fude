/**
 * Pure logic for Hannya's boss fight (see ./Boss.tsx): the faces and
 * situations she throws at you (name the feeling), the hearts of the people
 * around you (say someone else's feeling with the right grammar), and her
 * own lines under the mask (answer with the kind, fitting words). Kept free
 * of React so it can be tested.
 */
import { WORD_BY_ID } from '../../data/vocab'
import { shuffle } from '../../engine/random'

// ─── Phase 1 · Read the Mask: name the feeling ───────────────────────

export interface FaceQ {
  id: string
  /** The face she shows (emoji). */
  face: string
  /** The situation, in Japanese, and in English. */
  jp: string
  en: string
  /** Vocabulary id of the feeling that fits. */
  answer: string
  wrong: [string, string, string]
}

export const FACES: FaceQ[] = [
  { id: 'f1', face: '😳', jp: 'みんなの まえで ころんで、かおが まっかに なった。', en: 'You fell over in front of everyone, and your face went bright red.', answer: 'hazukashii', wrong: ['urayamashii', 'natsukashii', 'taikutsu'] },
  { id: 'f2', face: '😤', jp: 'まいにち れんしゅうしたのに、しあいに まけた。', en: 'You practised every day, and still lost the match.', answer: 'kuyashii', wrong: ['anshin', 'taikutsu', 'natsukashii'] },
  { id: 'f3', face: '📼', jp: 'むかし すんで いた まちの しゃしんを 見つけた。', en: 'You found a photo of the town you used to live in.', answer: 'natsukashii', wrong: ['kuyashii', 'fuan', 'hidoi'] },
  { id: 'f4', face: '👀', jp: 'ともだちが あたらしい ふでを もらった。わたしも ほしい…', en: 'Your friend got a new brush. You want one too…', answer: 'urayamashii', wrong: ['anshin', 'hazukashii', 'taikutsu'] },
  { id: 'f5', face: '😰', jp: 'あしたは しけん。でも、ぜんぜん べんきょう して いない…', en: 'The exam is tomorrow. And you haven’t studied at all…', answer: 'fuan', wrong: ['shiawase', 'natsukashii', 'urayamashii'] },
  { id: 'f6', face: '😌', jp: 'なくした さいふが、やっと 見つかった。', en: 'At last, you found the wallet you lost.', answer: 'anshin', wrong: ['kuyashii', 'fuan', 'iya'] },
  { id: 'f7', face: '🥱', jp: 'する ことが なにも ない。雨で そとにも でられない。', en: 'There’s nothing to do. It’s raining, so you can’t even go out.', answer: 'taikutsu', wrong: ['shiawase', 'hazukashii', 'urayamashii'] },
  { id: 'f8', face: '😞', jp: 'たのしみに して いた まつりが、なくなった。', en: 'The festival you were looking forward to was called off.', answer: 'zannen', wrong: ['anshin', 'natsukashii', 'subarashii'] },
  { id: 'f9', face: '🍀', jp: 'かぞくと いっしょに、あたたかい ごはんを たべて いる。', en: 'You’re eating a warm dinner together with your family.', answer: 'shiawase', wrong: ['kuyashii', 'fuan', 'taikutsu'] },
  { id: 'f10', face: '💓', jp: 'はじめて ぶたいで おどる。まくが あく すこし まえ…', en: 'Your first time dancing on stage. Just before the curtain rises…', answer: 'dokidoki', wrong: ['gakkari', 'niyaniya', 'hotto'] },
  { id: 'f11', face: '😮‍💨', jp: 'まいごの こねこが、ぶじに いえに かえって きた。', en: 'The lost kitten came home safe and sound.', answer: 'hotto', wrong: ['iraira', 'zotto', 'punpun'] },
  { id: 'f12', face: '🫠', jp: 'プレゼントの はこを あけたら、からっぽだった。', en: 'You opened the present box, and it was empty.', answer: 'gakkari', wrong: ['ukiuki', 'nikoniko', 'wakuwaku'] },
  { id: 'f13', face: '😾', jp: 'となりの 人が、ずっと ペンで つくえを たたいて いる。', en: 'The person next to you keeps tapping the desk with a pen.', answer: 'iraira', wrong: ['wakuwaku', 'hotto', 'ukiuki'] },
  { id: 'f14', face: '🥶', jp: 'よる、だれも いない はずの へやから こえが きこえた。', en: 'At night, a voice came from a room that should be empty.', answer: 'zotto', wrong: ['ukiuki', 'nikoniko', 'hotto'] },
]

export interface FaceChoice {
  q: FaceQ
  /** Word ids in display order. */
  options: string[]
}

export function faceQuestion(q: FaceQ): FaceChoice {
  return { q, options: shuffle([q.answer, ...q.wrong]) }
}

/** How a feeling word is shown on a button: written form (and reading, when it has kanji). */
export function wordLabel(id: string): { jp: string; kana: string; en: string } {
  const w = WORD_BY_ID.get(id)
  return w ? { jp: w.jp, kana: w.kana, en: w.en } : { jp: id, kana: id, en: id }
}

// ─── Phase 2 · Other Hearts: say someone else's feeling right ────────

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
  { id: 'g1', grammar: 'sou-looks', jp: '（かおを 見て）レンさんは ＿です。', en: '(Looking at her face) Ren looks sad.', answer: 'かなしそう', wrong: ['かなしい', 'かなしさそう', 'かなしくて'] },
  { id: 'g2', grammar: 'garu', jp: 'こどもは おにの めんを ＿ います。', en: 'The child is scared of the demon mask.', answer: 'こわがって', wrong: ['こわくて', 'こわいて', 'こわさって'] },
  { id: 'g3', grammar: 'mitai', jp: 'ホタルちゃんは ねむい ＿です。', en: 'Hotaru seems sleepy.', answer: 'みたい', wrong: ['たい', 'がる', 'のに'] },
  { id: 'g4', grammar: 'tagaru', jp: 'タロウくんは まつりに ＿ います。', en: 'Taro is dying to go to the festival.', answer: 'いきたがって', wrong: ['いきたくて', 'いきたいて', 'いくたがって'] },
  { id: 'g5', grammar: 'feeling-ga', jp: 'わたしは くらい ところ＿ こわいです。', en: 'I’m scared of dark places.', answer: 'が', wrong: ['を', 'で', 'に'] },
  { id: 'g6', grammar: 'te-feeling', jp: 'また あえ＿ うれしい！', en: 'I’m so happy I got to see you again!', answer: 'て', wrong: ['ても', 'ない', 'と'] },
  { id: 'g7', grammar: 'noni', jp: 'れんしゅうした＿、まけた。', en: 'Even though I practised, I lost.', answer: 'のに', wrong: ['から', 'ので', 'ために'] },
  { id: 'g8', grammar: 'te-shimatta', jp: 'めんを わって ＿…', en: 'Oh no, I broke the mask…', answer: 'しまった', wrong: ['ほしい', 'よかった', 'あげた'] },
  { id: 'g9', grammar: 'te-hoshii', jp: 'レンに まつりで おどって ＿。', en: 'I want Ren to dance at the festival.', answer: 'ほしい', wrong: ['たい', 'しまった', 'がる'] },
  { id: 'g10', grammar: 'ba-yokatta', jp: 'もっと はやく あやまれ＿ よかった。', en: 'I wish I had apologised sooner.', answer: 'ば', wrong: ['て', 'ない', 'のに'] },
  { id: 'g11', grammar: 'te-yokatta', jp: 'この 谷に きて ＿。', en: 'I’m glad I came to this valley.', answer: 'よかった', wrong: ['しまった', 'ほしい', 'あげた'] },
  { id: 'g12', grammar: 'nante', jp: 'はんにゃが なく ＿…！', en: 'To think that Hannya would cry…!', answer: 'なんて', wrong: ['ので', 'ほしい', 'がる'] },
  { id: 'g13', grammar: 'te-kurete-arigatou', jp: 'たすけて ＿ ありがとう。', en: 'Thank you for helping me.', answer: 'くれて', wrong: ['あげて', 'しまって', 'ほしくて'] },
  { id: 'g14', grammar: 'ki-ga-suru', jp: 'だれかが ないて いる ような ＿ する。', en: 'I have a feeling someone is crying.', answer: 'きが', wrong: ['きを', 'きに', 'きで'] },
]

export function gapOptions(g: Gap): string[] {
  return shuffle([g.answer, ...g.wrong])
}

export function fillGap(g: Gap, with_: string = g.answer): string {
  return g.jp.replace('＿', with_)
}

// ─── Phase 3 · Beneath the Mask: the kind reply ──────────────────────

export interface Reply {
  jp: string
  en: string
}

export interface HeartQ {
  id: string
  /** What Hannya says (spoken aloud; kana only, so speech is clear). */
  jp: string
  en: string
  /** What she really feels under the words (shown after answering). */
  feeling: string
  answer: Reply
  wrong: [Reply, Reply, Reply]
  /** Item ids reviewed by this answer (`w:` words, `g:` grammar). */
  items: string[]
}

export const HEARTS: HeartQ[] = [
  {
    id: 'h1',
    jp: 'だれも わたしを おぼえて いない… さびしい。',
    en: 'No one remembers me… I’m so lonely.',
    feeling: 'Lonely. Comfort her (なぐさめる).',
    answer: { jp: 'さびしかったんだね。もう ひとりじゃ ないよ。', en: 'You were lonely, weren’t you. You’re not alone anymore.' },
    wrong: [
      { jp: 'へいきでしょう？ がまんして。', en: 'You’re fine, right? Just put up with it.' },
      { jp: 'おめでとう！', en: 'Congratulations!' },
      { jp: 'めんどうくさいなあ。', en: 'What a hassle.' },
    ],
    items: ['w:nagusameru', 'w:heiki'],
  },
  {
    id: 'h2',
    jp: 'わたしは みんなの えがおを こおらせて しまった…',
    en: 'I froze everyone’s smiles…',
    feeling: 'Regret (こうかい). Help her make amends.',
    answer: { jp: 'こうかいして いるんだね。いっしょに あやまりに いこう。', en: 'You regret it, don’t you. Let’s go and apologise together.' },
    wrong: [
      { jp: 'よかったね！', en: 'Good for you!' },
      { jp: 'ぜったい ゆるさない！', en: 'I’ll never forgive you!' },
      { jp: 'たいくつだね。', en: 'How boring.' },
    ],
    items: ['w:koukai', 'w:ayamaru', 'g:te-shimatta'],
  },
  {
    id: 'h3',
    jp: 'もう いちど おどりたい。でも、こわい…',
    en: 'I want to dance again. But I’m scared…',
    feeling: 'Scared but wanting to. Encourage her (はげます).',
    answer: { jp: 'こわくても だいじょうぶ。おうえんするよ！', en: 'It’s okay to be scared. I’ll cheer for you!' },
    wrong: [
      { jp: 'じゃあ、やめれば？ らくだよ。', en: 'Then why not quit? It’s easier.' },
      { jp: 'こわがるなんて、はずかしいね。', en: 'Being scared? How embarrassing.' },
      { jp: 'まさか。うそでしょう。', en: 'No way. You’re lying.' },
    ],
    items: ['w:ouen-suru', 'w:hagemasu'],
  },
  {
    id: 'h4',
    jp: 'みんなの えがおが、うらやましくて たまらなかった。',
    en: 'I envied everyone’s smiles so much I couldn’t bear it.',
    feeling: 'Envy, and wanting to belong. Understand her.',
    answer: { jp: 'うらやましかったんだね。こんどは いっしょに わらおう。', en: 'You envied them, didn’t you. This time, let’s laugh together.' },
    wrong: [
      { jp: 'うらやましがらないで！ ひどい！', en: 'Stop being envious! That’s awful!' },
      { jp: 'ぷんぷん！ しらない！', en: 'Hmph! I don’t care!' },
      { jp: 'わたしは しあわせです。', en: 'I am happy. (only about yourself)' },
    ],
    items: ['w:urayamashii', 'w:warau'],
  },
  {
    id: 'h5',
    jp: 'ごめんなさい… ゆるして くれる？',
    en: 'I’m sorry… will you forgive me?',
    feeling: 'She apologised. Forgive her, and thank her.',
    answer: { jp: 'うん、ゆるすよ。あやまって くれて ありがとう。', en: 'Yes, I forgive you. Thank you for apologising.' },
    wrong: [
      { jp: 'ゆるして あげて ありがとう。', en: '(Thank you for forgiving-for-someone-else.)' },
      { jp: 'しらない。', en: 'Don’t know, don’t care.' },
      { jp: 'さいあく。', en: 'The worst.' },
    ],
    items: ['w:yurusu', 'g:te-kurete-arigatou'],
  },
  {
    id: 'h6',
    jp: 'むかしは、みんなが わたしの おどりを みに きて くれたの。',
    en: 'Long ago, everyone used to come and watch me dance.',
    feeling: 'Nostalgic. Share the feeling, and ask for more.',
    answer: { jp: 'なつかしいね。こんどの まつりで、また 見せて ほしい。', en: 'That brings back memories. I want you to show us again at the festival.' },
    wrong: [
      { jp: 'たいくつそうな はなしだね。', en: 'Sounds like a boring story.' },
      { jp: 'また 見せたい。', en: 'I want to show it again. (says it about yourself)' },
      { jp: 'めんどうくさいね。', en: 'What a hassle.' },
    ],
    items: ['w:natsukashii', 'g:te-hoshii'],
  },
  {
    id: 'h7',
    jp: 'いかりが とまらない… どうして こんなに イライラ するの？',
    en: 'My anger won’t stop… why am I so irritated?',
    feeling: 'Anger with sadness underneath. Name the real feeling.',
    answer: { jp: 'おこって いるのは、ほんとうは かなしいから じゃ ない？', en: 'Maybe you’re angry because, really, you’re sad?' },
    wrong: [
      { jp: 'おこるな！', en: 'Don’t get angry!' },
      { jp: 'わらえば いいよ。', en: 'Just laugh it off.' },
      { jp: 'イライラ しても へいきだね。', en: 'Being irritated is fine for you, huh.' },
    ],
    items: ['w:okoru', 'w:iraira', 'w:ikari'],
  },
  {
    id: 'h8',
    jp: 'ありがとう… あなたが きて くれて、うれしい。',
    en: 'Thank you… I’m so glad you came.',
    feeling: 'Gratitude and relief. Answer warmly.',
    answer: { jp: 'こちらこそ。あえて よかった。', en: 'Likewise. I’m glad I got to meet you.' },
    wrong: [
      { jp: 'べつに。', en: 'Whatever.' },
      { jp: 'さいあく。', en: 'The worst.' },
      { jp: 'かなしかった なんて、うそでしょう。', en: 'You, sad? That’s a lie.' },
    ],
    items: ['g:te-yokatta', 'w:kansha'],
  },
]

export interface HeartChoice {
  q: HeartQ
  /** Replies in display order (Japanese). */
  options: string[]
}

export function heartQuestion(q: HeartQ): HeartChoice {
  return { q, options: shuffle([q.answer.jp, ...q.wrong.map((r) => r.jp)]) }
}

/** English for any reply shown with a heart question. */
export function replyEnglish(q: HeartQ, jp: string): string {
  return [q.answer, ...q.wrong].find((r) => r.jp === jp)?.en ?? ''
}

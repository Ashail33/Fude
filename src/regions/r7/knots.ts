/**
 * The Yamanba's knots: pure question logic for the region 7 boss.
 *
 * Phase 1 — むすびめ: she ties a verb in a knot; untie it into its て-form.
 * Phase 2 — きのうの いと: she says what she is doing (or not doing) now;
 *           say what she did (or didn't do) yesterday: た / なかった.
 * Phase 3 — ゆの おきて: she asks if she may do things at the bath; answer
 *           with 〜てもいいです or 〜てはいけません, and the right rule.
 */
import { item } from '../../engine/items'

export interface KnotVerb {
  /** Vocabulary id. */
  id: string
  /** Dictionary form as written, and in kana. */
  jp: string
  kana: string
  en: string
  te: string
  ta: string
  /** Plain negative (ない-form). */
  nai: string
  /** The grammar point that makes its て-form. */
  rule: 'te-ru' | 'te-tte' | 'te-nde' | 'te-ite' | 'te-shite'
  /** Plausible wrong て-forms. */
  traps: [string, string, string]
  /** Plausible wrong なかった-forms. */
  naiTraps: [string, string, string]
  /** Why the て-form is what it is (shown after a miss). */
  why: string
}

const v = (id: string, jp: string, kana: string, en: string, te: string, nai: string, rule: KnotVerb['rule'], traps: KnotVerb['traps'], naiTraps: KnotVerb['naiTraps'], why: string): KnotVerb => ({
  id,
  jp,
  kana,
  en,
  te,
  ta: te.replace(/て$/, 'た').replace(/で$/, 'だ'),
  nai,
  rule,
  traps,
  naiTraps,
  why,
})

export const KNOT_VERBS: KnotVerb[] = [
  v('kau', '買う', 'かう', 'buy', 'かって', 'かわない', 'te-tte', ['かいて', 'かうて', 'かんで'], ['かいなかった', 'かあなかった', 'かわないた'], 'う → って. (Its ない-form uses わ: かわない.)'),
  v('tatsu', '立つ', 'たつ', 'stand', 'たって', 'たたない', 'te-tte', ['たちて', 'たいて', 'たんで'], ['たちなかった', 'たつなかった', 'たたないた'], 'つ → って.'),
  v('hairu', '入る', 'はいる', 'enter', 'はいって', 'はいらない', 'te-tte', ['はいて', 'はいりて', 'はいんで'], ['はいなかった', 'はいりなかった', 'はいらないた'], 'はいる looks like a る-verb but is a う-verb: る → って.'),
  v('noboru', '登る', 'のぼる', 'climb', 'のぼって', 'のぼらない', 'te-tte', ['のぼて', 'のぼりて', 'のぼんで'], ['のぼなかった', 'のぼりなかった', 'のぼらないた'], 'う-verb ending in る: る → って.'),
  v('arau', '洗う', 'あらう', 'wash', 'あらって', 'あらわない', 'te-tte', ['あらいて', 'あらうて', 'あらんで'], ['あらいなかった', 'あらあなかった', 'あらわないた'], 'う → って.'),
  v('matsu', '待つ', 'まつ', 'wait', 'まって', 'またない', 'te-tte', ['まちて', 'まいて', 'まんで'], ['まちなかった', 'まつなかった', 'またないた'], 'つ → って.'),
  v('kaeru', '帰る', 'かえる', 'go home', 'かえって', 'かえらない', 'te-tte', ['かえて', 'かえりて', 'かえんで'], ['かえなかった', 'かえりなかった', 'かえらないた'], 'かえる (go home) is a う-verb in disguise: る → って.'),
  v('suwaru', '座る', 'すわる', 'sit', 'すわって', 'すわらない', 'te-tte', ['すわて', 'すわりて', 'すわんで'], ['すわなかった', 'すわりなかった', 'すわらないた'], 'う-verb ending in る: る → って.'),
  v('toru', '撮る', 'とる', 'take (a photo)', 'とって', 'とらない', 'te-tte', ['とて', 'とりて', 'とんで'], ['となかった', 'とりなかった', 'とらないた'], 'う-verb ending in る: る → って.'),
  v('nomu', '飲む', 'のむ', 'drink', 'のんで', 'のまない', 'te-nde', ['のみて', 'のって', 'のいて'], ['のみなかった', 'のむなかった', 'のまないた'], 'む → んで.'),
  v('asobu', '遊ぶ', 'あそぶ', 'play', 'あそんで', 'あそばない', 'te-nde', ['あそびて', 'あそって', 'あそいで'], ['あそびなかった', 'あそぶなかった', 'あそばないた'], 'ぶ → んで.'),
  v('yasumu', '休む', 'やすむ', 'rest', 'やすんで', 'やすまない', 'te-nde', ['やすみて', 'やすって', 'やすいて'], ['やすみなかった', 'やすむなかった', 'やすまないた'], 'む → んで.'),
  v('yomu', '読む', 'よむ', 'read', 'よんで', 'よまない', 'te-nde', ['よみて', 'よって', 'よいて'], ['よみなかった', 'よむなかった', 'よまないた'], 'む → んで.'),
  v('aruku', '歩く', 'あるく', 'walk', 'あるいて', 'あるかない', 'te-ite', ['あるきて', 'あるって', 'あるいで'], ['あるきなかった', 'あるくなかった', 'あるかないた'], 'く → いて.'),
  v('kaku', '書く', 'かく', 'write', 'かいて', 'かかない', 'te-ite', ['かきて', 'かって', 'かいで'], ['かきなかった', 'かくなかった', 'かかないた'], 'く → いて.'),
  v('oyogu', '泳ぐ', 'およぐ', 'swim', 'およいで', 'およがない', 'te-ite', ['およぎて', 'およいて', 'およって'], ['およぎなかった', 'およぐなかった', 'およがないた'], 'ぐ → いで.'),
  v('nugu', '脱ぐ', 'ぬぐ', 'take off', 'ぬいで', 'ぬがない', 'te-ite', ['ぬぎて', 'ぬいて', 'ぬって'], ['ぬぎなかった', 'ぬぐなかった', 'ぬがないた'], 'ぐ → いで.'),
  v('iku', '行く', 'いく', 'go', 'いって', 'いかない', 'te-ite', ['いいて', 'いきて', 'いんで'], ['いきなかった', 'いくなかった', 'いかないた'], 'いく is the one く-verb that breaks the rule: いって.'),
  v('hanasu', '話す', 'はなす', 'speak', 'はなして', 'はなさない', 'te-shite', ['はなって', 'はないて', 'はなすて'], ['はなしなかった', 'はなすなかった', 'はなさないた'], 'す → して.'),
  v('kesu', '消す', 'けす', 'put out', 'けして', 'けさない', 'te-shite', ['けって', 'けいて', 'けすて'], ['けしなかった', 'けすなかった', 'けさないた'], 'す → して.'),
  v('suru', 'する', 'する', 'do', 'して', 'しない', 'te-shite', ['すって', 'すりて', 'すて'], ['すらなかった', 'さなかった', 'するなかった'], 'する is irregular: して, した, しない.'),
  v('kuru', '来る', 'くる', 'come', 'きて', 'こない', 'te-shite', ['くって', 'くりて', 'くて'], ['きなかった', 'くらなかった', 'くるなかった'], 'くる is irregular: きて, きた, こない.'),
  v('taberu', '食べる', 'たべる', 'eat', 'たべて', 'たべない', 'te-ru', ['たべって', 'たべりて', 'たべんで'], ['たべらなかった', 'たべるなかった', 'たべないた'], 'る-verb: drop る, add て.'),
  v('kiru-wear', '着る', 'きる', 'wear', 'きて', 'きない', 'te-ru', ['きって', 'きりて', 'きんで'], ['きらなかった', 'きるなかった', 'きないた'], '着る (wear) is a る-verb: きて. (きって is 切る, “cut”!)'),
  v('deru', '出る', 'でる', 'go out', 'でて', 'でない', 'te-ru', ['でって', 'でりて', 'でんで'], ['でらなかった', 'でるなかった', 'でないた'], 'る-verb: drop る, add て.'),
  v('ireru', '入れる', 'いれる', 'put in', 'いれて', 'いれない', 'te-ru', ['いれって', 'いれりて', 'いれんで'], ['いれらなかった', 'いれるなかった', 'いれないた'], 'る-verb: drop る, add て.'),
  v('neru', '寝る', 'ねる', 'sleep', 'ねて', 'ねない', 'te-ru', ['ねって', 'ねりて', 'ねんで'], ['ねらなかった', 'ねるなかった', 'ねないた'], 'る-verb: drop る, add て.'),
  v('miru', '見る', 'みる', 'see', 'みて', 'みない', 'te-ru', ['みって', 'みりて', 'みんで'], ['みらなかった', 'みるなかった', 'みないた'], 'る-verb: drop る, add て.'),
  v('tsukareru', '疲れる', 'つかれる', 'get tired', 'つかれて', 'つかれない', 'te-ru', ['つかれって', 'つかれりて', 'つかれんで'], ['つかれらなかった', 'つかれるなかった', 'つかれないた'], 'る-verb: drop る, add て.'),
]

export const KNOT_BY_ID = new Map(KNOT_VERBS.map((k) => [k.id, k]))

/** Phase 2 lines: what she is doing now, in her own words. */
export interface Yesterday {
  verb: string
  /** Words before the verb. */
  pre: string
  /** What she is doing, in English (“I am …”). */
  ing: string
}

export const YESTERDAYS: Yesterday[] = [
  { verb: 'hairu', pre: 'ゆに ', ing: 'in the bath' },
  { verb: 'nomu', pre: 'おちゃを ', ing: 'drinking tea' },
  { verb: 'asobu', pre: 'さると ', ing: 'playing with the monkeys' },
  { verb: 'aruku', pre: 'ゆきの なかを ', ing: 'walking through the snow' },
  { verb: 'kaku', pre: 'てがみを ', ing: 'writing a letter' },
  { verb: 'oyogu', pre: 'かわで ', ing: 'swimming in the river' },
  { verb: 'taberu', pre: 'たまごを ', ing: 'eating eggs' },
  { verb: 'neru', pre: 'ふとんで ', ing: 'sleeping on the futon' },
  { verb: 'nugu', pre: 'くつを ', ing: 'taking off my shoes' },
  { verb: 'hanasu', pre: 'たびびとと ', ing: 'talking with travellers' },
  { verb: 'matsu', pre: 'あんたを ', ing: 'waiting for you' },
  { verb: 'kiru-wear', pre: 'ゆかたを ', ing: 'wearing a yukata' },
  { verb: 'suru', pre: 'そうじを ', ing: 'doing the cleaning' },
  { verb: 'kuru', pre: 'ここに ', ing: 'here (I have come)' },
]

/** Phase 3: the bath laws. */
export interface BathLaw {
  verb: string
  /** Her question, up to the verb (the verb's て-form + も いいかい？ follows). */
  pre: string
  en: string
  allowed: boolean
  why: string
}

export const BATH_LAWS: BathLaw[] = [
  { verb: 'ireru', pre: 'ゆに タオルを ', en: 'May I put my towel in the water?', allowed: false, why: 'Towels never go into the bath water. Fold it on your head instead.' },
  { verb: 'hairu', pre: 'からだを あらってから、ゆに ', en: 'May I get in after washing my body?', allowed: true, why: 'Wash first, then in you go. That is the proper order.' },
  { verb: 'oyogu', pre: 'ゆの なかで ', en: 'May I swim in the bath?', allowed: false, why: 'A shared bath is for soaking, not swimming.' },
  { verb: 'yasumu', pre: 'ゆから でて、ゆっくり ', en: 'May I get out and have a good rest?', allowed: true, why: 'Resting after a soak is exactly what a hot spring is for.' },
  { verb: 'arau', pre: 'ゆの なかで からだを ', en: 'May I wash my body in the bath water?', allowed: false, why: 'You wash at the taps, never in the shared bath.' },
  { verb: 'nomu', pre: 'ゆから でてから、みずを ', en: 'May I drink some water after I get out?', allowed: true, why: 'Drinking water after a hot soak is good for you.' },
  { verb: 'suwaru', pre: 'あらいばで いすに ', en: 'May I sit on a stool at the wash taps?', allowed: true, why: 'You sit on the little stools to wash.' },
  { verb: 'toru', pre: 'おふろで ほかの ひとの しゃしんを ', en: 'May I take photos of other people in the bath?', allowed: false, why: 'Never take photos of other bathers.' },
  { verb: 'kiru-wear', pre: 'ゆから でて、ゆかたを ', en: 'May I put on a yukata after my bath?', allowed: true, why: 'A cotton yukata is just right after the bath.' },
  { verb: 'hairu', pre: 'からだを あらう まえに、ゆに ', en: 'May I get in before I wash?', allowed: false, why: 'Wash first! Nobody gets in dirty.' },
]

export interface KnotQ {
  phase: 0 | 1 | 2
  verb: KnotVerb
  /** Her line (Japanese) and its English. */
  jp: string
  en: string
  /** The gap line for phases 1 and 2 (＿ marks the answer). */
  frame?: string
  options: string[]
  answer: string
  /** Shown after the answer. */
  why: string
  itemIds: string[]
}

function shuffle<T>(xs: T[], rng: () => number): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Phase 1: tie the verb in a knot; untie it into its て-form. */
export function knotQuestion(id: string, rng: () => number = Math.random): KnotQ {
  const verb = KNOT_BY_ID.get(id)!
  return {
    phase: 0,
    verb,
    jp: `「${verb.kana}」を むすんで やったよ。ほどいて ごらん！`,
    en: `I tied “${verb.kana}” (${verb.en}) in a knot. Untie it into its て-form!`,
    frame: `${verb.kana} → ＿`,
    options: shuffle([verb.te, ...verb.traps], rng),
    answer: verb.te,
    why: verb.why,
    itemIds: [item.word(verb.id), item.grammar(verb.rule)],
  }
}

/** Phase 2: from “I'm doing it now” to “I did it yesterday too” (or didn't). */
export function yesterdayQuestion(y: Yesterday, negative: boolean, rng: () => number = Math.random): KnotQ {
  const verb = KNOT_BY_ID.get(y.verb)!
  const now = negative ? `${verb.te}いない` : `${verb.te}いる`
  const answer = negative ? verb.nai.replace(/い$/, 'かった') : verb.ta
  const traps = negative ? verb.naiTraps : ([...verb.traps.map((t) => t.replace(/て$/, 'た').replace(/で$/, 'だ')).slice(0, 2), verb.te] as string[])
  return {
    phase: 1,
    verb,
    jp: `あたしは いま、${y.pre}${now}。きのうは どうだった？`,
    en: negative ? `Right now I am not ${y.ing}. And yesterday? (I didn’t, either.)` : `Right now I am ${y.ing}. And yesterday? (I did, too.)`,
    frame: `きのうも ${y.pre}＿。`,
    options: shuffle([answer, ...traps.slice(0, 3)], rng),
    answer,
    why: negative ? `${verb.nai} → ${answer}: the ない-form with い → かった.` : `${verb.te} → ${answer}: て → た, で → だ.`,
    itemIds: [item.word(verb.id), item.grammar(negative ? 'nakatta' : 'ta-form')],
  }
}

/** Phase 3: may I…? Answer with the right rule and the right grammar. */
export function lawQuestion(law: BathLaw, rng: () => number = Math.random): KnotQ {
  const verb = KNOT_BY_ID.get(law.verb)!
  const yes = `はい、${verb.te}も いいですよ。`
  const no = `いいえ、${verb.te}は いけません。`
  const answer = law.allowed ? yes : no
  const traps = law.allowed ? [no, `はい、${verb.traps[0]}も いいですよ。`, `はい、${verb.te}は いいですよ。`] : [yes, `いいえ、${verb.traps[0]}は いけません。`, `いいえ、${verb.te}も いけません。`]
  return {
    phase: 2,
    verb,
    jp: `${law.pre}${verb.te}も いいかい？`,
    en: law.en,
    options: shuffle([answer, ...traps], rng),
    answer,
    why: `${law.why} (${law.allowed ? '〜ても いいです = you may' : '〜ては いけません = you must not'})`,
    itemIds: [item.word(verb.id), item.grammar(law.allowed ? 'te-mo-ii' : 'te-wa-ikemasen')],
  }
}

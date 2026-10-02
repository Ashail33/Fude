/**
 * Yuki-onna, the Snow Woman (region 9 boss). She froze every character in
 * the temple; the fight tests the region's kanji in three phases:
 *
 * 1. Frozen Compounds (こおった じゅくご): a kanji compound sealed in ice.
 *    Thaw it by choosing its reading; the traps mix up on'yomi and
 *    kun'yomi, rendaku and the small っ.
 * 2. Blizzard (ふぶき): snow hides the kanji. Only its radical and its
 *    meaning show through; pick the kanji they belong to.
 * 3. Warmth (ぬくもり): a sentence with one frozen word; read it in context
 *    before the cold wins. The warmth meter (candles) is the twist: every
 *    right answer in the fight lights a candle, every wrong one snuffs one,
 *    and in the last phase each candle buys you more time to answer.
 */
import { useState, type CSSProperties } from 'react'
import type { GameProps } from '../../games/types'
import { T, useAnswerTimer } from '../../components/ui'
import { item } from '../../engine/items'
import { shuffle } from '../../engine/random'
import { speak } from '../../engine/speech'
import { weakness, type Review } from '../../engine/srs'
import { getState } from '../../engine/store'
import type { StripCell } from '../../games/pixel'
import { tintFilter } from '../../games/pixelHooks'
import { BossArena, ChoiceGrid, Feedback, TimerBar } from '../../games/bosses/BossArena'
import { useBossBattle } from '../../games/bosses/battle'
import { createDeck } from '../../games/bosses/bossLogic'
import { PACK } from './data'
import './Boss.css'

/** Kanji this region teaches (only these get kanji reviews). */
const TAUGHT = new Set((PACK.kanji ?? []).map((k) => k.char))
const kanjiItems = (s: string) => [...new Set([...s].filter((c) => TAUGHT.has(c)))].map(item.kanji)

interface Frozen {
  jp: string
  kana: string
  en: string
  traps: [string, string, string]
  /** Word id when the compound is a vocabulary word. */
  word?: string
  grammar?: string
  note: string
}

/** Phase 1: compounds and their readings (traps are never valid readings). */
const FROZEN: Frozen[] = [
  { jp: '来年', kana: 'らいねん', en: 'next year', traps: ['くるとし', 'らいとし', 'きねん'], word: 'rainen', grammar: 'kj-jukugo', note: 'A compound takes on’yomi: 来 ライ + 年 ネン.' },
  { jp: '今年', kana: 'ことし', en: 'this year', traps: ['いまとし', 'こんとし', 'いまねん'], word: 'kotoshi', grammar: 'kj-jukujikun', note: 'A special reading: the whole word is read ことし.' },
  { jp: '山寺', kana: 'やまでら', en: 'mountain temple', traps: ['やまてら', 'さんじ', 'やまじ'], grammar: 'kj-rendaku', note: 'Rendaku: てら becomes でら after やま.' },
  { jp: '学校', kana: 'がっこう', en: 'school', traps: ['がくこう', 'まなこう', 'がくこ'], word: 'gakkou', grammar: 'kj-sokuon', note: 'がく + こう squeezes into がっこう (small っ).' },
  { jp: '北口', kana: 'きたぐち', en: 'north exit', traps: ['きたくち', 'ほくこう', 'ほっこう'], grammar: 'kj-rendaku', note: 'Kun’yomi on both halves, and くち voices to ぐち.' },
  { jp: '青空', kana: 'あおぞら', en: 'blue sky', traps: ['あおそら', 'せいくう', 'あおくう'], grammar: 'kj-rendaku', note: 'あお + そら → あおぞら (rendaku).' },
  { jp: '大雪', kana: 'おおゆき', en: 'heavy snow', traps: ['だいゆき', 'おおせつ', 'たいゆき'], word: 'ooyuki', note: 'Both halves keep their kun’yomi: おお + ゆき.' },
  { jp: '兄弟', kana: 'きょうだい', en: 'siblings', traps: ['あにおとうと', 'きょうおと', 'けいだい'], word: 'kyoudai', grammar: 'kj-jukugo', note: 'On’yomi: 兄 キョウ + 弟 ダイ.' },
  { jp: '書道', kana: 'しょどう', en: 'calligraphy', traps: ['かくみち', 'しょみち', 'かきどう'], word: 'shodou', grammar: 'kj-jukugo', note: 'On’yomi: 書 ショ + 道 ドウ.' },
  { jp: '午後', kana: 'ごご', en: 'p.m.', traps: ['ごあと', 'うまご', 'ごうしろ'], word: 'gogo', grammar: 'kj-onyomi', note: 'On’yomi: 午 ゴ + 後 ゴ.' },
  { jp: '東西', kana: 'とうざい', en: 'east and west', traps: ['ひがしにし', 'とうせい', 'とうさい'], grammar: 'kj-jukugo', note: 'On’yomi: 東 トウ + 西 サイ, voiced to ざい.' },
  { jp: '春夏秋冬', kana: 'しゅんかしゅうとう', en: 'the four seasons', traps: ['はるなつあきふゆ', 'しゅんげしゅうとう', 'しゅんかあきふゆ'], grammar: 'kj-jukugo', note: 'Four kanji, four on’yomi: シュン・カ・シュウ・トウ.' },
  { jp: '新年', kana: 'しんねん', en: 'New Year', traps: ['あたらとし', 'しんとし', 'にいねん'], word: 'shinnen', grammar: 'kj-onyomi', note: 'On’yomi: 新 シン + 年 ネン.' },
  { jp: '一行', kana: 'いちぎょう', en: 'one line of text', traps: ['ひとゆき', 'いちいく', 'ひとぎょう'], word: 'ichigyou', note: '行 is read ギョウ when it means a line of text.' },
  { jp: '名字', kana: 'みょうじ', en: 'surname', traps: ['なじ', 'めいじ', 'なまえじ'], word: 'myouji', note: '名 has two on’yomi: メイ and ミョウ. Here: みょう.' },
  { jp: '作文', kana: 'さくぶん', en: 'composition', traps: ['つくりぶん', 'さくもん', 'さぶん'], word: 'sakubun', grammar: 'kj-onyomi', note: 'On’yomi: 作 サク + 文 ブン.' },
  { jp: '音読み', kana: 'おんよみ', en: 'on-reading', traps: ['おとよみ', 'いんよみ', 'おんどく'], word: 'onyomi', grammar: 'kj-okurigana', note: '音 オン (on’yomi) + 読み よみ (kun’yomi with okurigana).' },
  { jp: '朝食', kana: 'ちょうしょく', en: 'breakfast', traps: ['あさしょく', 'あさたべ', 'ちょうじき'], grammar: 'kj-jukugo', note: 'On’yomi: 朝 チョウ + 食 ショク.' },
  { jp: '来週', kana: 'らいしゅう', en: 'next week', traps: ['くるしゅう', 'きしゅう', 'らいしゅ'], word: 'raishuu', note: 'On’yomi: 来 ライ + 週 シュウ (a long う).' },
  { jp: '毎週', kana: 'まいしゅう', en: 'every week', traps: ['まいしゅ', 'ごとしゅう', 'まいにち'], word: 'maishuu', note: 'On’yomi: 毎 マイ + 週 シュウ.' },
]

interface Flake {
  k: string
  part: string
  partEn: string
  meaning: string
  others: [string, string, string]
}

/** Phase 2: the blizzard leaves only a radical and a meaning. */
const BLIZZARD: Flake[] = [
  { k: '話', part: '言', partEn: 'speech', meaning: 'talk', others: ['語', '読', '言'] },
  { k: '語', part: '言', partEn: 'speech', meaning: 'language, word', others: ['話', '読', '言'] },
  { k: '読', part: '言', partEn: 'speech', meaning: 'read', others: ['話', '語', '売'] },
  { k: '姉', part: '女', partEn: 'woman', meaning: 'older sister', others: ['妹', '好', '母'] },
  { k: '妹', part: '女', partEn: 'woman', meaning: 'younger sister', others: ['姉', '好', '女'] },
  { k: '校', part: '木', partEn: 'tree, wood', meaning: 'school', others: ['林', '森', '休'] },
  { k: '東', part: '木', partEn: 'tree, wood', meaning: 'east', others: ['本', '車', '果'] },
  { k: '春', part: '日', partEn: 'sun', meaning: 'spring', others: ['早', '明', '昼'] },
  { k: '早', part: '日', partEn: 'sun', meaning: 'early', others: ['草', '春', '昼'] },
  { k: '朝', part: '月', partEn: 'moon', meaning: 'morning', others: ['前', '明', '有'] },
  { k: '道', part: '辶', partEn: 'road, moving on', meaning: 'road, way', others: ['週', '近', '通'] },
  { k: '週', part: '辶', partEn: 'road, moving on', meaning: 'week', others: ['道', '近', '通'] },
  { k: '見', part: '目', partEn: 'eye', meaning: 'see', others: ['貝', '目', '具'] },
  { k: '買', part: '貝', partEn: 'shell (old money)', meaning: 'buy', others: ['見', '貝', '員'] },
  { k: '雪', part: '雨', partEn: 'rain, weather', meaning: 'snow', others: ['雲', '電', '雷'] },
  { k: '紙', part: '糸', partEn: 'thread', meaning: 'paper', others: ['糸', '氏', '細'] },
  { k: '何', part: '亻', partEn: 'person', meaning: 'what', others: ['作', '休', '体'] },
  { k: '作', part: '亻', partEn: 'person', meaning: 'make', others: ['何', '休', '住'] },
  { k: '飲', part: '食', partEn: 'food, eating', meaning: 'drink', others: ['食', '飯', '欠'] },
  { k: '習', part: '羽', partEn: 'wings', meaning: 'learn', others: ['白', '羽', '曜'] },
  { k: '字', part: '子', partEn: 'child', meaning: 'character, letter', others: ['学', '子', '安'] },
  { k: '学', part: '子', partEn: 'child', meaning: 'study, learning', others: ['字', '子', '覚'] },
  { k: '冬', part: '冫', partEn: 'ice', meaning: 'winter', others: ['各', '夏', '終'] },
  { k: '黒', part: '灬', partEn: 'fire (below)', meaning: 'black', others: ['里', '魚', '点'] },
  { k: '秋', part: '禾', partEn: 'grain', meaning: 'autumn', others: ['私', '科', '火'] },
]

interface Warm {
  /** Sentence with the frozen word marked 【】. */
  jp: string
  en: string
  kana: string
  traps: [string, string, string]
  items: string[]
  note: string
}

/** Phase 3: read the frozen word in its sentence. */
const WARMTH: Warm[] = [
  { jp: '【来年】も 雪を 見に 来ます。', en: 'Next year too, I’ll come to see the snow.', kana: 'らいねん', traps: ['くるとし', 'きねん', 'らいとし'], items: ['w:rainen'], note: 'A compound: on’yomi ライ + ネン.' },
  { jp: '毎年 雪を 【見】ます。', en: 'Every year I look at the snow.', kana: 'み', traps: ['けん', 'みる', 'め'], items: ['j:見', 'g:kj-okurigana'], note: 'Before the okurigana ます, 見 is read み (kun’yomi).' },
  { jp: '寺を 【見学】します。', en: 'I’ll make a study visit to the temple.', kana: 'けんがく', traps: ['みがく', 'みまなぶ', 'けんまなぶ'], items: ['j:見', 'j:学', 'g:kj-onyomi'], note: 'In a compound, both halves take on’yomi: ケン + ガク.' },
  { jp: '雪が しんしんと ふる 【夜】。', en: 'A night when the snow falls silently.', kana: 'よる', traps: ['や', 'ゆう', 'ばん'], items: ['j:夜', 'w:shinshin'], note: 'Standing alone, 夜 takes its kun’yomi: よる.' },
  { jp: '【今夜】は 雪です。', en: 'Tonight it’s snowing.', kana: 'こんや', traps: ['いまよる', 'こんよる', 'いまや'], items: ['j:夜'], note: 'A compound: 今 コン + 夜 ヤ.' },
  { jp: '【南】へ 行きます。', en: 'I’m going south.', kana: 'みなみ', traps: ['なん', 'みなと', 'きた'], items: ['w:minami', 'j:南'], note: 'Alone, 南 is read みなみ (kun’yomi).' },
  { jp: '【南北】に のびる 道。', en: 'A road running north and south.', kana: 'なんぼく', traps: ['みなみきた', 'なんきた', 'みなみぼく'], items: ['j:南', 'j:北', 'g:kj-jukugo'], note: 'A compound: ナン + ホク, voiced to ぼく.' },
  { jp: '姉は 【高校】の 先生です。', en: 'My older sister is a high-school teacher.', kana: 'こうこう', traps: ['たかこう', 'こうこ', 'たかがっこう'], items: ['j:高', 'j:校'], note: 'On’yomi twice: コウ + コウ.' },
  { jp: 'この 山は 【高い】です。', en: 'This mountain is tall.', kana: 'たかい', traps: ['こうい', 'ながい', 'たこい'], items: ['j:高', 'g:kj-okurigana'], note: 'With okurigana い, 高 takes its kun’yomi: たか(い).' },
  { jp: '【父】は お坊さんです。', en: 'My father is a monk.', kana: 'ちち', traps: ['ふ', 'とう', 'はは'], items: ['w:chichi', 'g:kj-family'], note: 'Talking about your own father: 父 (ちち).' },
  { jp: '【お父さん】は お元気ですか。', en: 'Is your father well?', kana: 'おとうさん', traps: ['おちちさん', 'おふさん', 'おとさん'], items: ['w:otousan', 'g:kj-family'], note: 'Someone else’s father: お父さん (おとうさん), a special reading.' },
  { jp: '【夕方】、鐘が なります。', en: 'In the evening, the bell rings.', kana: 'ゆうがた', traps: ['ゆうほう', 'せきがた', 'ゆうかた'], items: ['w:yuugata', 'g:kj-rendaku'], note: 'ゆう + かた, voiced to がた.' },
  { jp: '【一行】ずつ 書いて ください。', en: 'Please write it one line at a time.', kana: 'いちぎょう', traps: ['ひとゆき', 'いちいく', 'ひとぎょう'], items: ['w:ichigyou', 'j:行'], note: '行 is ギョウ when it means a line of text.' },
  { jp: '【新しい】 ふでを 買います。', en: 'I’ll buy a new brush.', kana: 'あたらしい', traps: ['しんしい', 'あらたしい', 'にいしい'], items: ['j:新', 'g:kj-okurigana'], note: 'With okurigana しい: あたら(しい).' },
  { jp: '【新年】 おめでとう！', en: 'Happy New Year!', kana: 'しんねん', traps: ['あたらとし', 'しんとし', 'にいねん'], items: ['w:shinnen'], note: 'A compound: シン + ネン.' },
  { jp: '【人々】が あつまる。', en: 'People gather.', kana: 'ひとびと', traps: ['ひとひと', 'じんじん', 'にんにん'], items: ['g:kj-noma', 'g:kj-rendaku'], note: '々 repeats 人, and the second ひと voices to びと.' },
  { jp: '鐘の 【音】が しない。', en: 'The bell makes no sound.', kana: 'おと', traps: ['おん', 'いん', 'こえ'], items: ['j:音', 'w:kane'], note: 'Alone, 音 is read おと (kun’yomi).' },
  { jp: '漢字の 【音読み】を 書きます。', en: 'I write the kanji’s on-reading.', kana: 'おんよみ', traps: ['おとよみ', 'いんよみ', 'ねよみ'], items: ['j:音', 'w:onyomi'], note: '音 オン (on’yomi) + 読み よみ (kun’yomi).' },
]

type Q = { kind: 'frozen'; q: Frozen; options: string[] } | { kind: 'blizzard'; q: Flake; options: string[] } | { kind: 'warm'; q: Warm; options: string[] }

const AURAS = ['#9be7ff', '#d6f1ff', '#ffd166']
/** She is pale ice at first, a white-out in the blizzard, and thaws to gold. */
const PHASE_FILTERS = ['none', 'brightness(1.25) saturate(0.6)', tintFilter('#ffd166', 0.35)]
const SNOW_FLOOR: StripCell[][] = [['snow', 'ice', 'snow', { id: 'snow-pine', under: 'snow' }, 'snow', 'ice', 'ice', 'snow', { id: 'snowman', under: 'snow' }, 'snow']]
const TAUNTS = [
  { jp: 'こおった 字を、読めるかしら？', en: 'Can you read my frozen words?' },
  { jp: 'ふぶきよ… すべてを かくして。', en: 'Blizzard… hide everything.' },
  { jp: 'さむい… でも、なぜ あたたかいの？', en: 'So cold… then why does it feel warm?' },
]
const WARMTH_MAX = 5

const w = (id: string) => weakness(getState().srs[id])
const frozenItems = (f: Frozen) => [...(f.word ? [item.word(f.word)] : []), ...kanjiItems(f.jp), ...(f.grammar ? [item.grammar(f.grammar)] : [])]
const warmItems = (x: Warm) => x.items.map((id) => (id.startsWith('j:') || id.startsWith('w:') || id.startsWith('g:') ? id : item.word(id)))

export default function Boss({ activity, onFinish, onExit }: GameProps<'boss-yukionna'>) {
  const [decks] = useState(() => ({
    frozen: createDeck(FROZEN, (f) => w(frozenItems(f)[0])),
    blizzard: createDeck(BLIZZARD, (f) => w(item.kanji(f.k))),
    warm: createDeck(WARMTH, (x) => w(warmItems(x)[0])),
  }))
  const [q, setQ] = useState<Q | null>(null)
  const [reveal, setReveal] = useState<{ picked: string | null; ok: boolean } | null>(null)
  const [warmth, setWarmth] = useState(2)

  const battle = useBossBattle({
    maxHp: 12,
    hearts: 5,
    phaseAt: [8, 4],
    onFinish,
    onNext: (ph) => {
      setReveal(null)
      if (ph === 0) {
        const f = decks.frozen.next()
        setQ({ kind: 'frozen', q: f, options: shuffle([f.kana, ...f.traps]) })
      } else if (ph === 1) {
        const f = decks.blizzard.next()
        setQ({ kind: 'blizzard', q: f, options: shuffle([f.k, ...f.others]) })
      } else {
        const x = decks.warm.next()
        setQ({ kind: 'warm', q: x, options: shuffle([x.kana, ...x.traps]) })
      }
    },
  })
  const elapsed = useAnswerTimer(battle.turn)

  function answer(picked: string | null) {
    if (!q || reveal || battle.busy) return
    const ms = elapsed()
    const correct = q.kind === 'blizzard' ? q.q.k : q.q.kana
    const ok = picked === correct
    setReveal({ picked, ok })
    setWarmth((n) => Math.max(0, Math.min(WARMTH_MAX, n + (ok ? 1 : -1))))
    let ids: string[]
    if (q.kind === 'frozen') {
      ids = frozenItems(q.q)
      if (ok) void speak(q.q.kana)
      else decks.frozen.requeue(q.q)
    } else if (q.kind === 'blizzard') {
      ids = [item.kanji(q.q.k)]
      if (!ok) decks.blizzard.requeue(q.q)
    } else {
      ids = warmItems(q.q)
      if (ok) void speak(q.q.kana)
      else decks.warm.requeue(q.q)
    }
    const reviews: Review[] = ids.map((itemId) => ({ itemId, correct: ok, ms }))
    // A full row of candles makes the blow land twice as hard.
    const damage = ok && warmth >= WARMTH_MAX - 1 && q.kind === 'warm' ? 2 : 1
    battle.resolve(ok, reviews, { heroic: ids.slice(0, 2), damage, delay: ok ? 1400 : 3000 })
  }

  const timeMs = 4500 + warmth * 1300
  const sprite = (
    <div className="r9-flakes" aria-hidden>
      {['❄', '❅', '❆', '❄', '❅', '❆'].map((f, i) => (
        <span key={i} className={`r9-flake r9-flake-${i}`}>
          {f}
        </span>
      ))}
    </div>
  )
  const candles = (
    <div className="r9-warmth" aria-label={`Warmth ${warmth} of ${WARMTH_MAX}`}>
      <span className="r9-warmth-label">
        <T en="Warmth" jp="ぬくもり" />
      </span>
      {Array.from({ length: WARMTH_MAX }, (_, i) => (
        <span key={i} className={`r9-candle ${i < warmth ? 'lit' : ''}`}>
          🕯️
        </span>
      ))}
    </div>
  )

  return (
    <BossArena
      battle={battle}
      activity={activity}
      onExit={onExit}
      name={{ en: 'Yuki-onna, the Snow Woman', jp: 'ゆきおんな' }}
      spriteId="yuki-onna"
      spriteFilter={PHASE_FILTERS[battle.phase]}
      sprite={sprite}
      floor={SNOW_FLOOR}
      aura={AURAS[battle.phase]}
      className={`r9-boss r9-phase-${battle.phase}`}
      phaseNames={[
        { en: 'Frozen Compounds', jp: 'こおった じゅくご' },
        { en: 'Blizzard', jp: 'ふぶき' },
        { en: 'The Last Warmth', jp: 'さいごの ぬくもり' },
      ]}
      introLines={[
        'Yuki-onna has frozen every character in the temple. Thaw them with their readings.',
        'Phase 1: a compound is sealed in ice. Choose its reading: on’yomi or kun’yomi? Watch for rendaku and the small っ.',
        'Phase 2: a blizzard hides the kanji. Only its radical and meaning show. Which kanji is it?',
        'Phase 3: read the frozen word in its sentence before the cold wins. Every right answer lights a candle of warmth (🕯️), and each candle gives you more time. A full row hits twice as hard.',
      ]}
      taunt={TAUNTS[battle.phase]}
      victory={{ jp: 'こおりが とけた…', en: 'The ice melts away…' }}
    >
      {candles}
      {q?.kind === 'frozen' && (
        <>
          <div className="ba-prompt r9-ice">
            <div className="ba-prompt-label">
              <T en="A compound frozen in ice. How is it read?" jp="こおった じゅくご。どう 読む？" />
            </div>
            <div className={`ba-prompt-big r9-frozen-word ${reveal?.ok ? 'thawed' : ''}`} lang="ja">
              {q.q.jp}
            </div>
            <div className="muted">“{q.q.en}”</div>
          </div>
          <ChoiceGrid options={q.options} jp onPick={answer} reveal={reveal && { picked: reveal.picked, accepted: [q.q.kana] }} />
          <Feedback ok={reveal?.ok ?? null}>
            {reveal && (
              <>
                <span lang="ja">
                  {q.q.jp}（{q.q.kana}）
                </span>{' '}
                — {q.q.en}
                <small>{q.q.note}</small>
              </>
            )}
          </Feedback>
        </>
      )}
      {q?.kind === 'blizzard' && (
        <>
          <div className="ba-prompt r9-ice">
            <div className="ba-prompt-label">
              <T en="The blizzard hides the kanji. Only its radical and meaning show through." jp="ふぶきで 字が 見えない。ぶしゅと いみだけ…" />
            </div>
            <div className="r9-blizzard">
              <span className={`ba-prompt-big r9-hidden ${reveal ? 'shown' : ''}`} lang="ja">
                {q.q.k}
              </span>
              <span className="r9-part" lang="ja">
                {q.q.part}
                <small>{q.q.partEn}</small>
              </span>
            </div>
            <div className="ba-prompt-main r9-meaning">“{q.q.meaning}”</div>
          </div>
          <ChoiceGrid options={q.options} jp onPick={answer} reveal={reveal && { picked: reveal.picked, accepted: [q.q.k] }} />
          <Feedback ok={reveal?.ok ?? null}>
            {reveal && (
              <>
                <span lang="ja">{q.q.k}</span> = <span lang="ja">{q.q.part}</span> ({q.q.partEn}) … {q.q.meaning}
              </>
            )}
          </Feedback>
        </>
      )}
      {q?.kind === 'warm' && (
        <>
          <TimerBar ms={timeMs} active={!reveal && battle.status === 'fight' && !battle.busy} id={battle.turn} onTimeout={() => answer(null)} />
          <div className="ba-prompt r9-ice" style={{ '--r9-warm': warmth / WARMTH_MAX } as CSSProperties}>
            <div className="ba-prompt-label">
              <T en="Read the frozen word in its sentence, before the cold wins." jp="こおった ことばを 読もう。さむさに まけないで！" />
            </div>
            <div className="ba-prompt-main" lang="ja">
              {q.q.jp.split(/(【[^】]+】)/).map((part, i) =>
                part.startsWith('【') ? (
                  <mark key={i} className="r9-mark">
                    {part.slice(1, -1)}
                  </mark>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </div>
            <div className="muted">“{q.q.en}”</div>
          </div>
          <ChoiceGrid options={q.options} jp onPick={answer} reveal={reveal && { picked: reveal.picked, accepted: [q.q.kana] }} />
          <Feedback ok={reveal?.ok ?? null}>
            {reveal && (
              <>
                {reveal.picked === null && <T en="Too slow: the cold got there first. " jp="おそかった… " />}
                <span lang="ja">{q.q.kana}</span>
                <small>{q.q.note}</small>
              </>
            )}
          </Feedback>
        </>
      )}
    </BossArena>
  )
}

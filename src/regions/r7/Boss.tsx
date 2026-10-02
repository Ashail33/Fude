import { useState, type CSSProperties } from 'react'
import type { GameProps } from '../../games/types'
import { item } from '../../engine/items'
import { speak } from '../../engine/speech'
import { weakness } from '../../engine/srs'
import { getState } from '../../engine/store'
import { sfx } from '../../engine/sfx'
import { T, useAnswerTimer } from '../../components/ui'
import { type StripCell } from '../../games/pixel'
import { tintFilter } from '../../games/pixelHooks'
import { BossArena, ChoiceGrid, Feedback } from '../../games/bosses/BossArena'
import { useBossBattle } from '../../games/bosses/battle'
import { createDeck } from '../../games/bosses/bossLogic'
import './boss.css'
import { BATH_LAWS, KNOT_VERBS, knotQuestion, lawQuestion, YESTERDAYS, yesterdayQuestion, type BathLaw, type KnotQ, type Yesterday } from './knots'

/**
 * The Knotting Yamanba (region 7). She ties the Hollow's verbs in knots and
 * eats its yesterdays.
 *
 *  1. むすびめ — a verb arrives tied in a knot: pick its て-form to untie it.
 *  2. きのうの いと — she says what she is (not) doing now; say what she
 *     did (or didn't do) yesterday: the plain past た / なかった.
 *  3. ゆの おきて — she asks if she may do things at the bath; answer with
 *     〜ても いいです or 〜ては いけません, and the right rule.
 *
 * Answering fast in the first two phases strikes twice as hard.
 */
const CAVE_FLOOR: StripCell[][] = [['stone-floor', 'onsen', 'onsen', 'stone-floor', { id: 'rock', under: 'stone-floor' }, 'stone-floor', 'onsen', 'stone-floor']]
const AURAS = ['#e58f65', '#b5523b', '#7fc4f0']
const TINTS = ['none', tintFilter('#b5523b', 0.35), tintFilter('#7fc4f0', 0.3)]
const TAUNTS = [
  { jp: 'ほどけるものなら、ほどいて ごらん！', en: 'Untie them, if you can!' },
  { jp: 'きのうなんて、もう ないよ！', en: 'There is no yesterday any more!' },
  { jp: 'ねえ、〜ても いいかい？ ひっひっひ。', en: 'Say, may I…? Hee hee hee.' },
]
const FAST_MS = 3000

const verbWeight = (id: string) => weakness(getState().srs[item.word(id)])

/** A knotted word: its letters tumble about until it is untied. */
function Knot({ text, untied }: { text: string; untied: boolean }) {
  return (
    <span className={`yb-knot ${untied ? 'yb-untied' : ''}`} lang="ja">
      <span className="yb-rope" aria-hidden>
        🪢
      </span>
      {[...text].map((ch, i) => (
        <span key={i} style={{ '--r': `${(i % 2 ? 1 : -1) * (14 + i * 9)}deg`, '--y': `${((i % 3) - 1) * 0.15}em` } as CSSProperties}>
          {ch}
        </span>
      ))}
      <span className="yb-rope" aria-hidden>
        🪢
      </span>
    </span>
  )
}

export default function Boss({ activity, onFinish, onExit }: GameProps<'boss-yamanba'>) {
  const [decks] = useState(() => ({
    knots: createDeck(
      KNOT_VERBS.map((v) => v.id),
      verbWeight,
    ),
    yesterdays: createDeck<Yesterday>(YESTERDAYS, (y) => verbWeight(y.verb)),
    laws: createDeck<BathLaw>(BATH_LAWS, (l) => verbWeight(l.verb)),
  }))
  const [q, setQ] = useState<KnotQ | null>(null)
  const [reveal, setReveal] = useState<{ picked: string; ok: boolean; crit: boolean } | null>(null)
  const [turnN, setTurnN] = useState(0)

  const battle = useBossBattle({
    maxHp: 12,
    hearts: 5,
    phaseAt: [8, 4],
    onFinish,
    onNext: (ph) => {
      setReveal(null)
      setTurnN((n) => n + 1)
      if (ph === 0) setQ(knotQuestion(decks.knots.next()))
      else if (ph === 1) setQ(yesterdayQuestion(decks.yesterdays.next(), Math.random() < 0.4))
      else setQ(lawQuestion(decks.laws.next()))
    },
  })
  const elapsed = useAnswerTimer(battle.turn)

  function pick(o: string) {
    if (!q || reveal || battle.busy) return
    const ms = elapsed()
    const ok = o === q.answer
    const crit = ok && q.phase < 2 && ms < FAST_MS
    setReveal({ picked: o, ok, crit })
    const reviews = q.itemIds.map((itemId) => ({ itemId, correct: ok, ms }))
    if (ok) {
      sfx.cast()
      void speak(q.frame ? q.frame.replace('＿', q.answer).replace(/^.* → /, '') : q.answer)
    } else if (q.phase === 0) decks.knots.requeue(q.verb.id)
    battle.resolve(ok, reviews, { damage: crit ? 2 : 1, heroic: q.itemIds, delay: ok ? 1500 : 3200 })
  }

  const phaseHelp = [
    { en: 'Untie the knot: pick the て-form.', jp: '「て」の かたちに ほどこう。' },
    { en: 'Say what she did yesterday: plain past (た / なかった).', jp: 'きのうの ことを いおう（た・なかった）。' },
    { en: 'Answer her: may she, or must she not?', jp: '〜ても いい？ 〜ては いけない？' },
  ]

  const sprite = (
    <div className="yb-steam" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <i key={i} style={{ '--i': i } as CSSProperties} />
      ))}
    </div>
  )

  return (
    <BossArena
      battle={battle}
      activity={activity}
      onExit={onExit}
      name={{ en: 'The Knotting Yamanba', jp: 'もつれの やまんば' }}
      spriteId="yamanba"
      spriteFilter={TINTS[battle.phase]}
      sprite={sprite}
      floor={CAVE_FLOOR}
      aura={AURAS[battle.phase]}
      phaseNames={[
        { en: 'Knotted Verbs', jp: 'むすびめ' },
        { en: 'Yesterday’s Thread', jp: 'きのうの いと' },
        { en: 'The Laws of the Bath', jp: 'ゆの おきて' },
      ]}
      introLines={[
        'The Yamanba ties verbs in knots. Untie each one by choosing its て-form (かう → かって, のむ → のんで, あるく → あるいて…).',
        'Then she eats yesterday: she says what she is doing now, and you say what she did yesterday (た) or didn’t (なかった).',
        'Last, she asks “〜ても いいかい?” about the bath. Answer with 〜ても いいです or 〜ては いけません, and get the rule right.',
        'Answer quickly in the first two phases for a double strike!',
      ]}
      taunt={TAUNTS[battle.phase]}
      victory={{ jp: 'むすびめが ぜんぶ ほどけた！', en: 'Every knot is untied!' }}
    >
      {q && (
        <>
          <div className="ba-prompt">
            <div className="ba-prompt-label">
              <T en={phaseHelp[q.phase].en} jp={phaseHelp[q.phase].jp} />
            </div>
            {q.phase === 0 ? (
              <div className="ba-prompt-main" key={turnN}>
                <Knot text={q.verb.kana} untied={!!reveal?.ok} />
                <div className="muted yb-frame">
                  {q.verb.jp !== q.verb.kana && <span lang="ja">{q.verb.jp} · </span>}
                  {q.verb.en}
                </div>
              </div>
            ) : (
              <>
                <div className="ba-prompt-main" lang="ja" style={{ fontSize: 'clamp(1.1rem, 5vw, 1.6rem)' }}>
                  「{q.jp}」
                </div>
                <div className="muted">{q.en}</div>
              </>
            )}
            {q.frame && q.phase === 1 && (
              <div className="yb-frame" lang="ja">
                {q.frame.split('＿').map((part, i) => (
                  <span key={i}>
                    {i > 0 && <span className={`yb-slot ${reveal ? (reveal.ok ? 'ok' : 'bad') : ''}`}>{reveal ? reveal.picked : '？'}</span>}
                    {part}
                  </span>
                ))}
              </div>
            )}
          </div>
          <ChoiceGrid key={turnN} options={q.options} jp onPick={pick} disabled={battle.busy} reveal={reveal && { picked: reveal.picked, accepted: [q.answer] }} />
          <Feedback ok={reveal ? reveal.ok : null}>
            {reveal &&
              (reveal.ok ? (
                <>
                  {reveal.crit ? <T en="Untied in a flash! Double strike!" jp="いっしゅんで ほどけた！ にばいの いちげき！" /> : <T en="The knot comes undone!" jp="むすびめが ほどけた！" />} <small>{q.why}</small>
                </>
              ) : (
                <>
                  <T en="The knot pulls tighter!" jp="むすびめが きつく なった！" />
                  <small>
                    <span lang="ja">
                      <b>{q.answer}</b>
                    </span>{' '}
                    — {q.why}
                  </small>
                </>
              ))}
          </Feedback>
        </>
      )}
    </BossArena>
  )
}

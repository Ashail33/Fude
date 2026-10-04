import { useEffect, useState } from 'react'
import type { GameProps } from '../../games/types'
import { item } from '../../engine/items'
import type { Review } from '../../engine/srs'
import { canSpeak, speak } from '../../engine/speech'
import { weakness } from '../../engine/srs'
import { getState } from '../../engine/store'
import { sfx } from '../../engine/sfx'
import { T, useAnswerTimer } from '../../components/ui'
import type { StripCell } from '../../games/pixel'
import { tintFilter } from '../../games/pixelHooks'
import { BossArena, ChoiceGrid, Feedback, TimerBar } from '../../games/bosses/BossArena'
import { useBossBattle } from '../../games/bosses/battle'
import { createDeck } from '../../games/bosses/bossLogic'
import { FACES, faceQuestion, fillGap, GAPS, gapOptions, HEARTS, heartQuestion, replyEnglish, wordLabel, type FaceChoice, type FaceQ, type Gap, type HeartChoice, type HeartQ } from './hannya'
import '../../games/bosses/bosses.css'
import './Boss.css'

/**
 * Hannya, the mask of jealousy. Three phases:
 *  1. Read the Mask: she throws a face and a situation at you; name the
 *     feeling before her glare freezes it.
 *  2. Other Hearts: she twists what people around you feel. Say someone
 *     else's feeling the right way (〜そう, 〜がる, 〜みたい…) and fill each
 *     torn sentence with the grammar of wishes, regrets and thanks.
 *  3. Beneath the Mask: the rage cracks. Listen to what she says, hear the
 *     grief under it, and choose the kind words that reach her.
 */
type Q = { kind: 'face'; c: FaceChoice } | { kind: 'gap'; q: Gap; options: string[] } | { kind: 'heart'; c: HeartChoice }

const FACE_MS = 12000
const w = (id: string) => weakness(getState().srs[id])

const STAGE_FLOOR: StripCell[][] = [['wood-floor', 'wood-floor', { id: 'chochin', under: 'wood-floor' }, 'wood-floor', 'wood-floor', 'wood-floor', 'wood-floor', 'wood-floor', { id: 'chochin', under: 'wood-floor' }, 'wood-floor']]

export default function Boss({ activity, onFinish, onExit }: GameProps<'boss-hannya'>) {
  const [decks] = useState(() => ({
    face: createDeck<FaceQ>(FACES, (f) => w(item.word(f.answer))),
    gap: createDeck<Gap>(GAPS, (g) => w(item.grammar(g.grammar))),
    heart: createDeck<HeartQ>(HEARTS, (h) => h.items.reduce((s, id) => s + w(id), 0) / h.items.length),
  }))
  const [q, setQ] = useState<Q | null>(null)
  const [reveal, setReveal] = useState<{ picked: string | null; ok: boolean } | null>(null)
  const [shown, setShown] = useState(false)

  const battle = useBossBattle({
    maxHp: 12,
    hearts: 4,
    phaseAt: [8, 4],
    onFinish,
    onNext: (ph) => {
      setReveal(null)
      setShown(!canSpeak())
      if (ph === 0) setQ({ kind: 'face', c: faceQuestion(decks.face.next()) })
      else if (ph === 1) {
        const g = decks.gap.next()
        setQ({ kind: 'gap', q: g, options: gapOptions(g) })
      } else setQ({ kind: 'heart', c: heartQuestion(decks.heart.next()) })
    },
  })
  const elapsed = useAnswerTimer(battle.turn)
  const active = !!q && !reveal && !battle.busy

  // Phase 3: Hannya speaks her line aloud when it appears.
  const heartLine = q?.kind === 'heart' ? q.c.q.jp : null
  useEffect(() => {
    if (heartLine) void speak(heartLine, { force: true, rate: 0.85, speaker: 'hannya' })
  }, [heartLine, battle.turn])

  function finishTurn(ok: boolean, picked: string | null, reviews: Review[], speakText: string | null, delay: number) {
    setReveal({ picked, ok })
    setShown(true)
    if (ok && speakText) void speak(speakText)
    battle.resolve(ok, reviews, { heroic: reviews.map((r) => r.itemId), delay })
  }

  function chooseFace(o: string | null) {
    if (!q || q.kind !== 'face' || !active) return
    const ok = o === q.c.q.answer
    sfx.cast()
    if (!ok) decks.face.requeue(q.c.q)
    const reviews: Review[] = [{ itemId: item.word(q.c.q.answer), correct: ok, ms: elapsed() }]
    if (o && !ok) reviews.push({ itemId: item.word(o), correct: false, ms: elapsed() })
    finishTurn(ok, o, reviews, wordLabel(q.c.q.answer).kana, ok ? 1000 : 3200)
  }

  function chooseGap(o: string) {
    if (!q || q.kind !== 'gap' || !active) return
    const ok = o === q.q.answer
    sfx.cast()
    if (!ok) decks.gap.requeue(q.q)
    finishTurn(ok, o, [{ itemId: item.grammar(q.q.grammar), correct: ok, ms: elapsed() }], fillGap(q.q), ok ? 1200 : 3400)
  }

  function chooseHeart(o: string) {
    if (!q || q.kind !== 'heart' || !active) return
    const ok = o === q.c.q.answer.jp
    sfx.cast()
    if (!ok) decks.heart.requeue(q.c.q)
    finishTurn(ok, o, q.c.q.items.map((itemId) => ({ itemId, correct: ok, ms: elapsed() })), q.c.q.answer.jp, ok ? 1500 : 3800)
  }

  const phase = battle.phase
  const aura = phase === 0 ? '#c43a5a' : phase === 1 ? '#e8a25c' : '#9be7ff'
  const sprite = (
    <div className={`hn-masks hn-p${phase}`} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className="hn-mask" style={{ ['--i' as string]: i }} />
      ))}
      {phase >= 2 && (
        <span className="hn-tears">
          {Array.from({ length: 3 }, (_, i) => (
            <b key={i} style={{ ['--i' as string]: i }} />
          ))}
        </span>
      )}
    </div>
  )
  const taunt =
    q?.kind === 'face'
      ? { jp: 'この 顔の きもち、いえるものなら いって みよ！', en: 'Name the feeling on this face, if you can!' }
      : q?.kind === 'gap'
        ? { jp: 'ひとの こころなど、わかるものか！', en: 'As if you could understand anyone else’s heart!' }
        : { jp: '…………', en: '(Her voice cracks. Under the rage, something else is trembling.)' }

  return (
    <BossArena
      battle={battle}
      activity={activity}
      onExit={onExit}
      name={{ en: 'Hannya', jp: 'はんにゃ' }}
      spriteId="hannya"
      spriteFilter={phase === 1 ? tintFilter('#e8a25c', 0.3) : phase === 2 ? tintFilter('#9be7ff', 0.35) : 'none'}
      sprite={sprite}
      floor={STAGE_FLOOR}
      aura={aura}
      phaseNames={[
        { en: 'Read the Mask', jp: 'めんを よむ' },
        { en: 'Other Hearts', jp: 'ひとの こころ' },
        { en: 'Beneath the Mask', jp: 'めんの した' },
      ]}
      introLines={[
        'Hannya, the mask of jealousy, freezes every feeling she envies. Name feelings truly to break her rage.',
        'Phase 1: she shows a face and a situation. Name the feeling before her glare freezes it.',
        'Phase 2: she twists other people’s hearts. Fill each sentence with the right grammar: someone else’s feelings take 〜そう, 〜がる or 〜みたい.',
        'Phase 3: her mask cracks. Listen to what she says, and answer with the kind words that fit.',
      ]}
      taunt={taunt}
      victory={{ jp: 'めんの したに、なみだと えがおが あった。', en: 'Under the mask were tears, and a smile.' }}
    >
      {q?.kind === 'face' && (
        <>
          <TimerBar ms={FACE_MS} active={active} id={battle.turn} onTimeout={() => chooseFace(null)} />
          <div className="ba-prompt">
            <div className="ba-prompt-label">
              <T en="What is this feeling?" jp="これは どんな きもち？" />
            </div>
            <div className="hn-face" aria-hidden key={battle.turn}>
              {q.c.q.face}
            </div>
            <div className="ba-prompt-main" lang="ja">
              {q.c.q.jp}
            </div>
            <div className="muted">“{q.c.q.en}”</div>
          </div>
          <ChoiceGrid
            options={q.c.options}
            jp
            className="hn-choices"
            onPick={chooseFace}
            reveal={reveal && { picked: reveal.picked, accepted: [q.c.q.answer] }}
            render={(id) => {
              const l = wordLabel(id)
              return l.jp !== l.kana ? (
                <ruby>
                  {l.jp}
                  <rt>{l.kana}</rt>
                </ruby>
              ) : (
                l.jp
              )
            }}
          />
          <Feedback ok={reveal?.ok ?? null}>
            {reveal && (
              <>
                {reveal.picked === null && 'Too slow! '}
                {wordLabel(q.c.q.answer).jp} ({wordLabel(q.c.q.answer).kana}): {wordLabel(q.c.q.answer).en}
                {reveal.picked && !reveal.ok && <small>{wordLabel(reveal.picked).jp} means “{wordLabel(reveal.picked).en}”.</small>}
              </>
            )}
          </Feedback>
        </>
      )}
      {q?.kind === 'gap' && (
        <>
          <div className="ba-prompt">
            <div className="ba-prompt-label">
              <T en="Mend the sentence she twisted:" jp="ねじれた ぶんを なおそう：" />
            </div>
            <div className="ba-prompt-main" lang="ja">
              {q.q.jp}
            </div>
            <div className="muted">“{q.q.en}”</div>
          </div>
          <ChoiceGrid options={q.options} jp onPick={chooseGap} reveal={reveal && { picked: reveal.picked, accepted: [q.q.answer] }} />
          <Feedback ok={reveal?.ok ?? null}>{reveal && <>{fillGap(q.q)}</>}</Feedback>
        </>
      )}
      {q?.kind === 'heart' && (
        <>
          <div className="ba-prompt">
            <div className="ba-prompt-label">
              <T en="Listen to her, then answer kindly:" jp="はんにゃの ことばを きいて、やさしく こたえよう：" />
            </div>
            {shown ? (
              <>
                <div className="ba-prompt-main hn-line" lang="ja">
                  「{q.c.q.jp}」
                </div>
                <div className="muted">“{q.c.q.en}”</div>
              </>
            ) : (
              <div className="ba-prompt-main hn-line hn-hidden" aria-label="Hannya is speaking">
                🎭 ………
              </div>
            )}
            <div className="hn-listen">
              <button type="button" className="btn" onClick={() => void speak(q.c.q.jp, { force: true, rate: 0.75, speaker: 'hannya' })}>
                🔊 <T en="Listen again" jp="もう いちど きく" />
              </button>
              {!shown && (
                <button type="button" className="btn" onClick={() => setShown(true)}>
                  👁 <T en="Show her words" jp="ことばを 見る" />
                </button>
              )}
            </div>
          </div>
          <ChoiceGrid options={q.c.options} jp onPick={chooseHeart} reveal={reveal && { picked: reveal.picked, accepted: [q.c.q.answer.jp] }} />
          <Feedback ok={reveal?.ok ?? null}>
            {reveal && (
              <>
                {q.c.q.feeling}
                <small>
                  {q.c.q.answer.jp}: “{q.c.q.answer.en}”
                  {reveal.picked && !reveal.ok && <> · {reveal.picked}: “{replyEnglish(q.c.q, reveal.picked)}”</>}
                </small>
              </>
            )}
          </Feedback>
        </>
      )}
    </BossArena>
  )
}

/**
 * The Counting Umibōzu: a sea giant who swallowed the harbour's numbers.
 * Count his catch with the right counter, catch the hours and prices he
 * booms, then read the numbers off the tide-stone, sound changes and all.
 * Every miss lets the tide rise a little higher.
 */
import { useState } from 'react'
import { T, useAnswerTimer } from '../../components/ui'
import { canSpeak, speak } from '../../engine/speech'
import { type StripCell } from '../../games/pixel'
import { tintFilter } from '../../games/pixelHooks'
import type { GameProps } from '../../games/types'
import { BossArena, ChoiceGrid, Feedback, TimerBar } from '../../games/bosses/BossArena'
import { useBossBattle } from '../../games/bosses/battle'
import { countQuestion, listenQuestion, readQuestion, type UmiQ } from './umibozu'
import '../../games/bosses/bosses.css'
import './boss.css'

const AURAS = ['#3da5ff', '#6b8cff', '#9be7ff']
const PHASE_FILTERS = ['none', tintFilter('#2b4a7a', 0.35), 'saturate(1.3) brightness(1.15)']
const SHORE: StripCell[][] = [['sand', 'sand', 'water', 'sand', 'sand', 'water', 'water', 'sand', 'sand', 'sand']]
const TAUNTS = [
  { jp: 'さかなは なんびき？', en: 'How many fish?' },
  { jp: 'きこえるか？', en: 'Can you hear me?' },
  { jp: 'よめるか？ しおが みちるぞ…', en: 'Can you read it? The tide is rising…' },
]
const READ_MS = 9000

export default function Boss({ activity, onFinish, onExit }: GameProps<'boss-umibozu'>) {
  const [q, setQ] = useState<UmiQ | null>(null)
  const [reveal, setReveal] = useState<{ picked: string | null; ok: boolean } | null>(null)
  const battle = useBossBattle({
    maxHp: 12,
    hearts: 5,
    phaseAt: [8, 4],
    onFinish,
    onNext: (ph) => {
      setReveal(null)
      const next = ph === 0 ? countQuestion() : ph === 1 ? listenQuestion() : readQuestion()
      setQ(next)
      if (next.kind === 'listen') void speak(next.say)
    },
  })
  const elapsed = useAnswerTimer(battle.turn)
  const voice = canSpeak()

  function answer(picked: string | null) {
    if (!q || reveal || battle.busy) return
    const ms = elapsed()
    const ok = picked === q.answer
    setReveal({ picked, ok })
    if (q.kind !== 'listen') void speak(q.say)
    battle.resolve(
      ok,
      q.itemIds.map((itemId) => ({ itemId, correct: ok, ms })),
      { heroic: q.itemIds, delay: ok ? 1100 : 2600 },
    )
  }

  const tide = Math.round(((battle.maxHearts - battle.hearts) / battle.maxHearts) * 100)
  const phase = battle.phase

  return (
    <BossArena
      battle={battle}
      activity={activity}
      onExit={onExit}
      name={{ en: 'The Counting Umibōzu', jp: 'かぞえる うみぼうず' }}
      spriteId="umibozu"
      spriteFilter={PHASE_FILTERS[phase]}
      floor={SHORE}
      aura={AURAS[phase]}
      overlay={<div className="umi-tide" style={{ height: `${8 + tide * 0.45}%` }} aria-hidden />}
      phaseNames={[
        { en: 'Count the Catch', jp: 'えものを かぞえよ' },
        { en: 'The Hour and the Price', jp: 'ときと ねだん' },
        { en: 'Read the Tide', jp: 'しおを よめ' },
      ]}
      introLines={[
        'The Umibōzu swallowed the harbour’s numbers. Win them back!',
        'Phase 1: he holds up his catch — count it with the right counter (匹, 本, 枚, 人, 個, つ).',
        'Phase 2: he booms an hour or a price. Pick what you heard (🔊 to hear it again).',
        'Phase 3: read the numbers on the tide-stone before the wave breaks — mind the sound changes!',
        'Every miss lets the tide rise.',
      ]}
      taunt={TAUNTS[phase]}
      victory={{ jp: 'かずが みなとへ かえった！', en: 'The numbers flow back to the harbour!' }}
    >
      {q && (
        <>
          {q.kind === 'read' && <TimerBar ms={READ_MS} active={!reveal && !battle.busy} id={battle.turn} onTimeout={() => answer(null)} />}
          <div className="ba-prompt">
            <div className="ba-prompt-label">{q.label}</div>
            {q.kind === 'listen' ? (
              <div className="ba-prompt-main">
                <button type="button" className="btn umi-say" onClick={() => void speak(q.say)} aria-label="Hear it again">
                  🔊
                </button>
                {(!voice || reveal) && (
                  <span lang="ja" className="umi-heard">
                    {q.say}
                  </span>
                )}
              </div>
            ) : (
              <div className={`ba-prompt-main ${q.kind === 'count' ? 'umi-pile' : 'ba-prompt-big'}`} key={battle.turn} lang="ja">
                {q.shown}
              </div>
            )}
          </div>
          <ChoiceGrid options={q.options} jp={q.kind !== 'listen'} onPick={(o) => answer(o)} reveal={reveal && { picked: reveal.picked, accepted: [q.answer] }} />
          <Feedback ok={reveal?.ok ?? null}>
            {reveal && (reveal.ok ? <T en={`Right! ${q.why}`} jp={`せいかい！ ${q.why}`} /> : <>{reveal.picked === null ? 'The wave broke! ' : 'The tide rises… '}{q.why}</>)}
          </Feedback>
        </>
      )}
    </BossArena>
  )
}

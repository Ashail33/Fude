import { useState } from 'react'
import type { GameProps } from '../types'
import { PARTICLE_QUESTIONS } from '../../data/sentences'
import { item } from '../../engine/items'
import { speak } from '../../engine/speech'
import { weakness } from '../../engine/srs'
import { getState } from '../../engine/store'
import { sfx } from '../../engine/sfx'
import { T, useAnswerTimer } from '../../components/ui'
import { type StripCell } from '../pixel'
import { tintFilter } from '../pixelHooks'
import { BossArena, ChoiceGrid, Feedback, TimerBar } from './BossArena'
import { useBossBattle, useKey } from './battle'
import { BLIND_INDICES, createDeck, isAccepted, particleQuestion, type ParticleQ } from './bossLogic'
import './bosses.css'

const ALL_INDICES = PARTICLE_QUESTIONS.map((_, i) => i)
const AURAS = ['#3da5ff', '#ff6fb5']
const FOREST_FLOOR: StripCell[][] = [['grass-dark', 'tall-grass', 'grass-dark', 'flowers', 'grass-dark', 'grass', 'tall-grass', 'grass-dark']]
const TAUNTS = [
  { jp: 'じょしを えらべ！', en: 'Choose your particle!' },
  { jp: 'いみは もう みせない！', en: 'No more meanings for you!' },
]
const WEAK_MS = 2200

type Stage = 'ask' | 'weak' | 'done'

export default function ParticleGuardian({ activity, onFinish, onExit }: GameProps<'boss-particle'>) {
  const weight = (i: number) => weakness(getState().srs[item.particle(i)])
  const [decks] = useState(() => ({ open: createDeck(ALL_INDICES, weight), blind: createDeck(BLIND_INDICES, weight) }))
  const [q, setQ] = useState<ParticleQ | null>(null)
  const [stage, setStage] = useState<Stage>('ask')
  const [reveal, setReveal] = useState<{ picked: string; ok: boolean } | null>(null)
  const [weakPos, setWeakPos] = useState({ x: 50, y: 40 })
  const [pickMs, setPickMs] = useState(0)
  const [crit, setCrit] = useState<boolean | null>(null)

  const battle = useBossBattle({
    maxHp: 12,
    hearts: 5,
    phaseAt: [6],
    onFinish,
    onNext: (ph) => {
      setReveal(null)
      setCrit(null)
      setStage('ask')
      setQ(ph === 0 ? particleQuestion(decks.open.next(), false) : particleQuestion(decks.blind.next(), true))
    },
  })
  const elapsed = useAnswerTimer(battle.turn)

  function pick(p: string) {
    if (!q || stage !== 'ask' || battle.busy) return
    const ms = elapsed()
    const ok = isAccepted(q, p)
    setReveal({ picked: p, ok })
    if (ok) {
      sfx.cast()
      setPickMs(ms)
      setWeakPos({ x: 22 + Math.random() * 56, y: 18 + Math.random() * 50 })
      setStage('weak')
      void speak(`${q.q.before}${p}${q.q.after}`)
    } else {
      setStage('done')
      ;(q.en ? decks.open : decks.blind).requeue(q.index)
      battle.resolve(false, [{ itemId: q.itemId, correct: false, ms }], { delay: 3000 })
    }
  }

  function strike(hitWeakPoint: boolean) {
    if (!q || stage !== 'weak') return
    setStage('done')
    setCrit(hitWeakPoint)
    battle.resolve(true, [{ itemId: q.itemId, correct: true, ms: pickMs }], { damage: hitWeakPoint ? 2 : 1, heroic: [q.itemId], delay: 1100 })
  }

  useKey('Enter', () => strike(true), stage === 'weak')
  useKey(' ', () => strike(true), stage === 'weak')

  const filled = reveal ? reveal.picked : null
  const sprite = (
    <div className={`bp-guardian ${stage === 'weak' ? 'bp-open' : ''}`}>
      <span className="bp-shield-ring" aria-hidden />
    </div>
  )

  const overlay =
    stage === 'weak' ? (
      <button type="button" className="bp-weak" style={{ left: `${weakPos.x}%`, top: `${weakPos.y}%` }} onClick={() => strike(true)} aria-label="Strike the weak point">
        ✦
      </button>
    ) : null

  return (
    <BossArena
      battle={battle}
      activity={activity}
      onExit={onExit}
      name={{ en: 'Particle Guardian', jp: 'じょしのしゅご' }}
      spriteId="treant"
      spriteFilter={battle.phase === 0 ? 'none' : tintFilter('#ff6fb5', 0.45)}
      sprite={sprite}
      floor={FOREST_FLOOR}
      aura={AURAS[battle.phase]}
      phaseNames={[
        { en: 'Shields of Meaning', jp: 'いみのたて' },
        { en: 'Blind Shields', jp: 'めかくしのたて' },
      ]}
      introLines={[
        'The Guardian hides behind shields marked with particles (は, を, に…).',
        'Pick the particle that completes the sentence: its weak point appears ✦.',
        'Tap the weak point fast (or press Enter) for a critical hit!',
        'A wrong shield reflects your spell back at you.',
      ]}
      taunt={TAUNTS[battle.phase]}
      overlay={overlay}
      victory={{ jp: 'しゅごしゃが みちを ひらいた！', en: 'The Guardian opens the way!' }}
    >
      {q && (
        <>
          <div className={`ba-prompt bp-sentence ${stage !== 'ask' && reveal?.ok ? 'bp-lit' : ''}`}>
            <div className="ba-prompt-label">
              {q.en ? (
                <>
                  “{q.en}”
                </>
              ) : (
                <T en="No meaning given — read the sentence itself." jp="いみは ない。ぶんを よもう。" />
              )}
            </div>
            <div className="ba-prompt-main" lang="ja">
              {q.q.before}
              <span className={`bp-slot ${filled ? (reveal?.ok ? 'ok' : 'bad') : ''}`} key={filled ?? 'empty'}>
                {filled ?? '＿'}
              </span>
              {q.q.after}
            </div>
          </div>
          {stage === 'weak' && <TimerBar ms={WEAK_MS} active id={battle.turn} onTimeout={() => strike(false)} />}
          <ChoiceGrid
            className={`bp-shields bp-n${q.options.length}`}
            options={q.options}
            jp
            onPick={pick}
            reveal={reveal && (reveal.ok ? { picked: reveal.picked, accepted: [reveal.picked] } : { picked: reveal.picked, accepted: q.accepted })}
            render={(o) => <span className="bp-shield">{o}</span>}
          />
          <Feedback ok={reveal ? reveal.ok : null}>
            {reveal &&
              (reveal.ok ? (
                stage === 'weak' ? (
                  <T en="Weak point exposed — strike it! ✦" jp="じゃくてんだ！ うて！ ✦" />
                ) : crit ? (
                  <>
                    <T en="Critical hit!" jp="かいしんの いちげき！" /> <small>{q.q.why}</small>
                  </>
                ) : (
                  <>
                    <T en="Hit!" jp="あたった！" /> <small>{q.q.why}</small>
                  </>
                )
              ) : (
                <>
                  <T en="The shield reflects your spell!" jp="たてが はねかえした！" />
                  <small>
                    {q.q.before}
                    <b>{q.q.answer}</b>
                    {q.q.after}
                    {q.accepted.length > 1 && ` (${q.accepted.join(' / ')})`} — {q.q.why}
                  </small>
                </>
              ))}
          </Feedback>
        </>
      )}
    </BossArena>
  )
}

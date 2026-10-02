/**
 * Region 8 boss: Nurarihyon, the uninvited guest, in the lord's seat.
 *
 * He barges in with a situation and you answer with the polite phrase that
 * fits (phase 1); he says things plainly and you raise the lord or lower
 * yourself with keigo (phase 2); he twists who gave what to whom (phase 3).
 *
 * The twist is the courtesy meter (れい): three polite answers in a row and
 * the next one is a deep bow that hits twice as hard. Every rude (wrong)
 * answer empties the meter and makes the old yokai swell with pride.
 */
import { useState } from 'react'
import type { GameProps } from '../../games/types'
import { speak } from '../../engine/speech'
import { weakness } from '../../engine/srs'
import { getState } from '../../engine/store'
import { shuffle } from '../../engine/random'
import { sfx } from '../../engine/sfx'
import { useAnswerTimer } from '../../components/ui'
import type { StripCell } from '../../games/pixel'
import { BossArena, ChoiceGrid, Feedback } from '../../games/bosses/BossArena'
import { useBossBattle } from '../../games/bosses/battle'
import { createDeck } from '../../games/bosses/bossLogic'
import '../../games/bosses/bosses.css'
import { PHASES, type BossTurn } from './bossData'

const KEEP_FLOOR: StripCell[][] = [['tatami', 'tatami', { id: 'lantern', under: 'tatami' }, 'carpet', 'carpet', 'tatami', { id: 'chochin', under: 'tatami' }, 'tatami']]
const AURAS = ['#b48ad9', '#d9534f', '#f2c14e']
/** Courtesy hits needed for a deep bow. */
const BOW = 3
const MAX_SWELL = 3

const TAUNTS: { jp: string; en: string }[] = [
  { jp: 'ほっほ。まあ、すわりなさい。…わしの いえじゃ からな。', en: 'Ho ho. Do sit down. …It’s MY house, after all.' },
  { jp: 'ふふん、れいぎなど しらんわい。', en: 'Hmph, manners? Never heard of them.' },
  { jp: 'わしの あたまが、ふくらんで きたぞ！', en: 'My head is swelling with pride!' },
  { jp: 'しつれい、しつれい、だいすきじゃ！', en: 'Rudeness, rudeness, I love it!' },
]

const weight = (t: BossTurn) => Math.max(...t.items.map((id) => weakness(getState().srs[id])))

interface Q {
  turn: BossTurn
  options: string[]
}

export default function Boss({ activity, onFinish, onExit }: GameProps<'boss-nurarihyon'>) {
  const [decks] = useState(() => PHASES.map((p) => createDeck(p, weight)))
  const [q, setQ] = useState<Q | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [ok, setOk] = useState<boolean | null>(null)
  const [streak, setStreak] = useState(0)
  const [swell, setSwell] = useState(0)

  const battle = useBossBattle({
    maxHp: 12,
    hearts: 5,
    phaseAt: [8, 4],
    onFinish,
    onNext: (ph) => {
      const turn = decks[ph].next()
      setPicked(null)
      setOk(null)
      setQ({ turn, options: shuffle([turn.answer, ...turn.wrong]) })
    },
  })
  const elapsed = useAnswerTimer(battle.turn)

  function answer(o: string) {
    if (!q || ok !== null || battle.busy) return
    const ms = elapsed()
    const right = o === q.turn.answer
    setPicked(o)
    setOk(right)
    sfx.cast()
    const bow = right && streak + 1 >= BOW
    if (right) {
      void speak(q.turn.frame ? q.turn.frame.replace('＿', q.turn.answer) : q.turn.answer)
      setStreak(bow ? 0 : streak + 1)
      setSwell((s) => Math.max(0, s - 1))
    } else {
      decks[battle.phase].requeue(q.turn)
      setStreak(0)
      setSwell((s) => Math.min(MAX_SWELL, s + 1))
    }
    battle.resolve(
      right,
      q.turn.items.map((itemId) => ({ itemId, correct: right, ms })),
      { damage: bow ? 2 : 1, heroic: q.turn.items, delay: right ? 1500 : 3600 },
    )
  }

  const taunt = swell > 0 ? TAUNTS[Math.min(TAUNTS.length - 1, swell)] : q ? q.turn.say : TAUNTS[0]
  const filter = swell ? `saturate(${1 + swell * 0.35}) hue-rotate(${-swell * 12}deg) drop-shadow(0 0 ${swell * 5}px #ff5d8f)` : 'none'
  const meter = (
    <div aria-label={`Courtesy ${streak} of ${BOW}`} style={{ position: 'absolute', left: 8, top: 8, padding: '4px 8px', borderRadius: 8, background: 'rgba(10, 8, 20, 0.6)', color: '#ffe9b0', fontSize: 14, lineHeight: 1.3, pointerEvents: 'none' }}>
      <div>
        <span lang="ja">れい</span> {Array.from({ length: BOW }, (_, i) => (i < streak ? '🙇' : '·')).join(' ')}
      </div>
      {swell > 0 && (
        <div style={{ color: '#ff9fbf' }}>
          <span lang="ja">うぬぼれ</span> {'▲'.repeat(swell)}
        </div>
      )}
    </div>
  )

  return (
    <BossArena
      battle={battle}
      activity={activity}
      onExit={onExit}
      name={{ en: 'Nurarihyon', jp: 'ぬらりひょん' }}
      spriteId="nurarihyon"
      spriteFilter={filter}
      floor={KEEP_FLOOR}
      aura={AURAS[battle.phase] ?? AURAS[0]}
      overlay={battle.status === 'fight' ? meter : null}
      phaseNames={[
        { en: 'The uninvited guest', jp: 'まねかれざる きゃく' },
        { en: 'Words for the lord', jp: 'とのへの ことば' },
        { en: 'Who gives to whom?', jp: 'だれが だれに？' },
      ]}
      introLines={[
        'Nurarihyon walks into any house uninvited and plays the master. He has eaten the town’s manners: answer his every rudeness politely.',
        'Phase 1: he barges into a situation. Pick the polite phrase that fits.',
        'Phase 2: raise the lord with respectful verbs (いらっしゃる, めしあがる, おっしゃる); lower yourself with humble ones (まいります, おります, いたします).',
        'Phase 3: who gives to whom? あげる, くれる, もらう, かす and かりる.',
        'Three polite answers in a row fill the courtesy meter (れい): your next answer is a deep bow that hits twice as hard. Rude answers make him swell.',
      ]}
      taunt={taunt}
      victory={{ jp: 'ぬらりひょんが、ぺこりと おじぎを した！', en: 'Nurarihyon bows, at last!' }}
    >
      {q && (
        <>
          <div className="ba-prompt bc-prompt">
            <div className="bc-situation">{q.turn.situation}</div>
            {q.turn.arrow && (
              <div className="bc-instruction" aria-hidden>
                {q.turn.arrow}
              </div>
            )}
            {q.turn.frame && (
              <div className="ba-prompt-main" lang="ja">
                {q.turn.frame.split('＿').map((part, i) => (
                  <span key={i}>
                    {i > 0 && <span className={`bc-slot ${picked ? 'full' : ''} ${ok === null ? '' : ok ? 'ok' : 'bad'}`}>{picked ?? '＿'}</span>}
                    {part}
                  </span>
                ))}
              </div>
            )}
          </div>
          <ChoiceGrid options={q.options} jp onPick={answer} disabled={battle.busy} reveal={ok === null ? null : { picked, accepted: [q.turn.answer] }} />
          <Feedback ok={ok}>
            {ok !== null && (
              <>
                {ok ? (streak === 0 ? '🙇 Deep bow! ' : 'Polite! ') : `${q.turn.answer} — `}
                <small>{q.turn.rule}</small>
              </>
            )}
          </Feedback>
        </>
      )}
    </BossArena>
  )
}

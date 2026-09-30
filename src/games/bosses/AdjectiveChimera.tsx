import { useState, type ReactNode } from 'react'
import type { GameProps } from '../types'
import { ADJ_FORM_LABEL, ELEMENT_SPELLS } from '../../data/sentences'
import { item } from '../../engine/items'
import { speak } from '../../engine/speech'
import { weakness } from '../../engine/srs'
import { getState } from '../../engine/store'
import { sfx } from '../../engine/sfx'
import { T, useAnswerTimer } from '../../components/ui'
import type { ChimeraTurn } from './bossData'
import { tintFilter, type StripCell } from '../pixel'
import { BossArena, ChoiceGrid, Feedback } from './BossArena'
import { useBossBattle, useKey, useNumberKeys } from './battle'
import { checkChimera, chimeraQuestion, chimeraTurnsFor, createDeck, skinOf, type ChimeraQ } from './bossLogic'
import './bosses.css'

const weight = (t: ChimeraTurn) => weakness(getState().srs[item.adjective(t.adj)])

const TOWER_FLOOR: StripCell[][] = [['stone-floor', 'stone-floor', { id: 'lantern', under: 'stone-floor' }, 'stone-floor', 'stone-floor', 'stone-floor', 'stone-floor', { id: 'lantern', under: 'stone-floor' }]]

export default function AdjectiveChimera({ activity, onFinish, onExit }: GameProps<'boss-chimera'>) {
  const [decks] = useState(() => [0, 1, 2].map((p) => createDeck(chimeraTurnsFor(p), weight)))
  const [q, setQ] = useState<ChimeraQ | null>(null)
  const [adj, setAdj] = useState<string | null>(null)
  const [noun, setNoun] = useState<string | null>(null)
  const [reveal, setReveal] = useState<{ ok: boolean; adjOk: boolean; nounOk: boolean } | null>(null)

  const battle = useBossBattle({
    maxHp: 9,
    hearts: 5,
    phaseAt: [6, 3],
    onFinish,
    onNext: (ph) => {
      setReveal(null)
      setAdj(null)
      setNoun(null)
      setQ(chimeraQuestion(decks[ph].next()))
    },
  })
  const elapsed = useAnswerTimer(battle.turn)

  function cast(adjPick: string | null = adj, nounPick: string | null = noun) {
    if (!q || reveal || battle.busy || !adjPick) return
    if (q.nounOptions && !nounPick) return
    const ms = elapsed()
    const r = checkChimera(q, adjPick, nounPick)
    setReveal(r)
    sfx.cast()
    const phrase = q.turn.frame ? q.turn.frame.replace('＿', q.adjAnswer) : `${q.adjAnswer}${q.nounAnswer}`
    if (r.ok) void speak(phrase)
    else decks[battle.phase].requeue(q.turn)
    battle.resolve(r.ok, [{ itemId: q.itemId, correct: r.ok, ms }], { heroic: [q.itemId], delay: r.ok ? 1300 : 3400 })
  }

  const attributive = !!q?.nounOptions
  const active = !!q && !reveal && !battle.busy
  useNumberKeys(
    attributive ? 7 : 0,
    (i) => {
      if (!q) return
      if (i < 4) setAdj(q.adjOptions[i] ?? null)
      else setNoun(q.nounOptions?.[i - 4] ?? null)
    },
    active && attributive,
  )
  useKey('Enter', () => cast(), active && attributive && !!adj && !!noun)

  const skin = q ? skinOf(q.turn) : null
  const sprite = (
    <div className="bc-chimera" key={skin?.id}>
      <span className="bc-motes" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <i key={i} style={{ ['--i' as string]: i }} />
        ))}
      </span>
    </div>
  )
  const nounInfo = (n: string) => ELEMENT_SPELLS.find((e) => e.noun === n)

  return (
    <BossArena
      battle={battle}
      activity={activity}
      onExit={onExit}
      name={{ en: 'The Shifting Chimera', jp: 'かわるキメラ' }}
      spriteId="kitsune"
      spriteFilter={skin ? tintFilter(skin.color, 0.6) : 'none'}
      sprite={sprite}
      floor={TOWER_FLOOR}
      aura={skin?.color ?? '#ff9f43'}
      phaseNames={[
        { en: 'Describe your magic', jp: 'まほうを えがけ' },
        { en: 'Negate its power', jp: 'ちからを うちけせ' },
        { en: 'Tell of the past', jp: 'かこを かたれ' },
      ]}
      introLines={[
        'The Chimera keeps changing its skin. Describe your spell precisely to hurt it.',
        'Phase 1: adjective + element (i-adjectives go straight on; na-adjectives need な).',
        'Phase 2: NOT … (i-adj: ～くない, na-adj: ～じゃない).',
        'Phase 3: WAS / WAS NOT (～かった, ～だった, ～くなかった, ～じゃなかった).',
      ]}
      taunt={skin ? { jp: skin.jp, en: skin.en } : null}
      victory={{ jp: 'キメラが しずまった！', en: 'The Chimera is tamed!' }}
    >
      {q && (
        <>
          <div className="ba-prompt bc-prompt">
            <div className="bc-situation">{q.turn.situation}</div>
            <div className="bc-instruction">{q.turn.instruction}</div>
            <div className="bc-form muted">
              {ADJ_FORM_LABEL[q.turn.form]}
            </div>
            <div className="ba-prompt-main bc-spell" lang="ja">
              {attributive ? (
                <>
                  <span className={`bc-slot ${adj ? 'full' : ''} ${reveal ? (reveal.adjOk ? 'ok' : 'bad') : ''}`}>{adj ?? '？'}</span>
                  <span className={`bc-slot ${noun ? 'full' : ''} ${reveal ? (reveal.nounOk ? 'ok' : 'bad') : ''}`}>{noun ?? '？'}</span>
                </>
              ) : (
                q.turn.frame!.split('＿').map((part, i) => (
                  <span key={i}>
                    {i > 0 && <span className={`bc-slot ${adj ? 'full' : ''} ${reveal ? (reveal.adjOk ? 'ok' : 'bad') : ''}`}>{adj ?? '＿'}</span>}
                    {part}
                  </span>
                ))
              )}
            </div>
            {q.turn.frameEn && <div className="muted bc-frame-en">{q.turn.frameEn}</div>}
          </div>

          {attributive ? (
            <>
              <div className="bc-label muted">
                <T en="Adjective" jp="けいようし" />
              </div>
              <TileRow options={q.adjOptions} value={adj} onPick={setAdj} disabled={!active} answer={reveal ? q.adjAnswer : null} offset={0} />
              <div className="bc-label muted">
                <T en="Element" jp="ぞくせい" />
              </div>
              <TileRow
                className="bc-tiles-3"
                options={q.nounOptions!}
                value={noun}
                onPick={setNoun}
                disabled={!active}
                answer={reveal ? q.nounAnswer : null}
                offset={4}
                render={(n) => (
                  <>
                    {nounInfo(n)?.emoji} {n}
                  </>
                )}
              />
              <button type="button" className="btn btn-primary btn-lg" disabled={!active || !adj || !noun} onClick={() => cast()}>
                🪄 <T en="Cast!" jp="となえる！" />
              </button>
            </>
          ) : (
            <ChoiceGrid
              options={q.adjOptions}
              jp
              onPick={(o) => {
                setAdj(o)
                cast(o, null)
              }}
              reveal={reveal && { picked: adj, accepted: [q.adjAnswer] }}
            />
          )}
          <Feedback ok={reveal?.ok ?? null}>
            {reveal &&
              (reveal.ok ? (
                <>
                  {q.turn.frame ? q.turn.frame.replace('＿', q.adjAnswer) : `${q.adjAnswer}${q.nounAnswer}`}！ <small>{q.rule}</small>
                </>
              ) : (
                <>
                  {!reveal.adjOk ? q.rule : `Right adjective — wrong element! You needed ${q.nounAnswer} (${nounInfo(q.nounAnswer!)?.en}).`}
                  {!reveal.adjOk && !reveal.nounOk && <small>Also, the element should be {q.nounAnswer}.</small>}
                </>
              ))}
          </Feedback>
        </>
      )}
    </BossArena>
  )
}

function TileRow({
  options,
  value,
  onPick,
  disabled,
  answer,
  offset,
  render,
  className,
}: {
  className?: string
  options: string[]
  value: string | null
  onPick: (o: string) => void
  disabled: boolean
  answer: string | null
  offset: number
  render?: (o: string) => ReactNode
}) {
  return (
    <div className={`bc-tiles ${className ?? ''}`}>
      {options.map((o, i) => {
        let cls = 'bc-tile choice-jp'
        if (value === o) cls += ' sel'
        if (answer !== null) cls += o === answer ? ' correct' : value === o ? ' wrong' : ' ba-dim'
        return (
          <button
            key={o}
            type="button"
            className={cls}
            lang="ja"
            disabled={disabled}
            aria-pressed={value === o}
            onClick={() => {
              sfx.click()
              onPick(o)
            }}
          >
            <span className="ba-key" aria-hidden>
              {i + 1 + offset}
            </span>
            {render ? render(o) : o}
          </button>
        )
      })}
    </div>
  )
}

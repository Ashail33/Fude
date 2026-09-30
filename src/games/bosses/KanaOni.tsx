import { useState } from 'react'
import type { GameProps } from '../types'
import type { Kana } from '../../data/kana'
import type { Word } from '../../data/vocab'
import { item } from '../../engine/items'
import { speak } from '../../engine/speech'
import { weakness } from '../../engine/srs'
import { getState } from '../../engine/store'
import { sample } from '../../engine/random'
import { KanaInput, T, useAnswerTimer } from '../../components/ui'
import { BossArena, ChoiceGrid, Feedback, TimerBar } from './BossArena'
import { hasFinePointer, useBossBattle } from './battle'
import { checkKanaRomaji, createDeck, isAccepted, kanaPool, kanaQuestion, kanaWordPool, kanaWordQuestion, type KanaQ, type KanaWordQ } from './bossLogic'
import './bosses.css'

type Q = { kind: 'kana'; q: KanaQ; timed: boolean } | { kind: 'word'; q: KanaWordQ }

const SPRITES = ['👹', '👺', '👿']
const AURAS = ['#ff5d73', '#ff9f43', '#c77dff']
const TAUNTS = [
  { jp: 'よめるか？', en: 'Can you read me?' },
  { jp: 'ことばを くらえ！', en: 'Eat my words!' },
  { jp: 'はやく！ はやく！', en: 'Faster! Faster!' },
]

const w = (id: string) => weakness(getState().srs[id])

export default function KanaOni({ activity, params, onFinish, onExit }: GameProps<'boss-kana'>) {
  const script = params.script
  const [pool] = useState(() => kanaPool(script))
  const [decks] = useState(() => ({
    kana: createDeck<Kana>(pool, (k) => w(item.kana(k.char))),
    word: createDeck<Word>(kanaWordPool(), (x) => w(item.word(x.id))),
  }))
  const [orbit] = useState(() => sample(pool, 6).map((k) => k.char))
  const [q, setQ] = useState<Q | null>(null)
  const [typed, setTyped] = useState('')
  const [reveal, setReveal] = useState<{ picked: string | null; ok: boolean } | null>(null)

  const battle = useBossBattle({
    maxHp: 12,
    hearts: 5,
    phaseAt: [8, 4],
    onFinish,
    onNext: (ph) => {
      setReveal(null)
      setTyped('')
      if (ph === 1) setQ({ kind: 'word', q: kanaWordQuestion(decks.word.next(), script) })
      else setQ({ kind: 'kana', q: kanaQuestion(decks.kana.next(), pool), timed: ph === 2 })
    },
  })
  const elapsed = useAnswerTimer(battle.turn)

  function answer(picked: string | null, typedInput?: string) {
    if (!q || reveal || battle.busy) return
    const ms = elapsed()
    let ok: boolean
    if (q.kind === 'kana') ok = typedInput !== undefined ? checkKanaRomaji(q.q.char, typedInput) : picked !== null && isAccepted(q.q, picked)
    else ok = picked !== null && isAccepted(q.q, picked)
    setReveal({ picked, ok })
    if (ok) void speak(q.kind === 'kana' ? q.q.char : q.q.shown)
    else if (q.kind === 'kana') decks.kana.requeue(pool.find((k) => k.char === q.q.char)!)
    battle.resolve(ok, [{ itemId: q.q.itemId, correct: ok, ms }], { heroic: [q.q.itemId], delay: ok ? (q.kind === 'kana' && q.timed ? 600 : 900) : 2000 })
  }

  const phase = battle.phase
  const lines = [
    'The Kana Oni hurls characters at you. Read each one to strike back.',
    'Phase 1: tap the romaji — or type it and press Enter.',
    'Phase 2: whole words! Choose their meaning.',
    'Phase 3: rapid fire — 3 seconds per kana. Every miss costs a heart.',
  ]

  const sprite = (
    <div className="bk-oni">
      <span>{SPRITES[phase]}</span>
      <div className="bk-orbit" aria-hidden>
        {orbit.map((c, i) => (
          <span key={c + i} lang="ja" style={{ ['--i' as string]: i }}>
            {c}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <BossArena
      battle={battle}
      activity={activity}
      onExit={onExit}
      name={{ en: 'Kana Oni', jp: 'かなのおに' }}
      sprite={sprite}
      aura={AURAS[phase]}
      phaseNames={[
        { en: 'Scrambled Kana', jp: 'みだれもじ' },
        { en: 'Word Storm', jp: 'ことばのあらし' },
        { en: 'Rapid Fire', jp: 'れんだ' },
      ]}
      introLines={lines}
      taunt={TAUNTS[phase]}
      victory={{ jp: 'おにを たおした！', en: 'The oni is defeated!' }}
    >
      {q?.kind === 'kana' && (
        <>
          {q.timed && <TimerBar ms={3000} active={!reveal && !battle.busy} id={battle.turn} onTimeout={() => answer(null)} />}
          <div className="ba-prompt">
            <div className="ba-prompt-label">
              <T en="The oni throws a kana — what is it?" jp="このかなは？" />
            </div>
            <div className="ba-prompt-big bk-attack" key={battle.turn} lang="ja">
              {q.q.char}
            </div>
          </div>
          <ChoiceGrid options={q.q.options} onPick={(o) => answer(o)} reveal={reveal && { picked: reveal.picked, accepted: q.q.accepted }} />
          <div className="ba-row">
            <KanaInput
              key={battle.turn}
              mode="romaji"
              value={typed}
              onChange={(v) => {
                // Number keys still pick a choice while the input has focus.
                if (/^[1-4]$/.test(v)) answer(q.q.options[Number(v) - 1])
                else setTyped(v)
              }}
              onSubmit={(v) => v.trim() && answer(v.trim(), v)}
              placeholder="or type romaji + Enter"
              autoFocus={hasFinePointer()}
              disabled={!!reveal}
            />
          </div>
          <Feedback ok={reveal?.ok ?? null}>
            {reveal &&
              (reveal.ok ? (
                <>
                  {q.q.char} = {q.q.romaji}！
                </>
              ) : (
                <>
                  {reveal.picked === null ? "Too slow! " : ''}
                  {q.q.char} is “{q.q.romaji}”
                </>
              ))}
          </Feedback>
        </>
      )}
      {q?.kind === 'word' && (
        <>
          <div className="ba-prompt">
            <div className="ba-prompt-label">
              <T en="A cursed word flies at you — what does it mean?" jp="このことばの いみは？" />
            </div>
            <div className="ba-prompt-main bk-attack" key={battle.turn} lang="ja">
              {q.q.shown}
            </div>
          </div>
          <ChoiceGrid options={q.q.options} onPick={(o) => answer(o)} reveal={reveal && { picked: reveal.picked, accepted: q.q.accepted }} />
          <Feedback ok={reveal?.ok ?? null}>
            {reveal && (
              <>
                {q.q.emoji} {q.q.shown} = {q.q.accepted[0]}
              </>
            )}
          </Feedback>
        </>
      )}
    </BossArena>
  )
}

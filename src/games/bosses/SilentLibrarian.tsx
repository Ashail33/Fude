import { useState } from 'react'
import type { GameProps } from '../types'
import { RUNES, type Rune } from '../../data/sentences'
import type { Word } from '../../data/vocab'
import { item } from '../../engine/items'
import { canSpeak, hasJapaneseVoice, speak } from '../../engine/speech'
import { weakness } from '../../engine/srs'
import { getState } from '../../engine/store'
import { T, useAnswerTimer } from '../../components/ui'
import { PixelSprite } from '../../art'
import { tintFilter, type StripCell } from '../pixel'
import { BossArena, ChoiceGrid, Feedback } from './BossArena'
import { useBossBattle } from './battle'
import {
  createDeck,
  isAccepted,
  runeQuestion,
  sentenceQuestion,
  TRAP_SENTENCE_IDS,
  whisperPool,
  whisperQuestion,
  type RuneQ,
  type SentenceQ,
  type WhisperQ,
} from './bossLogic'
import './bosses.css'

type Q = { kind: 'rune'; q: RuneQ } | { kind: 'whisper'; q: WhisperQ; audio: boolean } | { kind: 'sentence'; q: SentenceQ }

const AURAS = ['#9be7e0', '#a0a8ff', '#ffe066']
const PHASE_FILTERS = ['none', tintFilter('#a0a8ff', 0.4), tintFilter('#ffe066', 0.5)]
const LIBRARY_FLOOR: StripCell[][] = [['stone-floor', 'stone-floor', { id: 'lantern', under: 'stone-floor' }, 'stone-floor', 'stone-floor', 'stone-floor', 'stone-floor', { id: 'bookshelf' }, 'stone-floor', 'stone-floor']]
const TAUNTS = [
  { jp: 'しずかに… よみなさい。', en: 'Quietly… read.' },
  { jp: 'きこえますか？', en: 'Can you hear me?' },
  { jp: 'まことの ぶんは？', en: 'Which sentence is true?' },
]

const w = (id: string) => weakness(getState().srs[id])

export default function SilentLibrarian({ activity, onFinish, onExit }: GameProps<'boss-librarian'>) {
  const [decks] = useState(() => ({
    rune: createDeck<Rune>(
      RUNES.filter((r) => r.region <= 4),
      (r) => w(item.rune(r.id)),
    ),
    word: createDeck<Word>(whisperPool(), (x) => w(item.word(x.id))),
    sentence: createDeck<string>(TRAP_SENTENCE_IDS, (id) => w(item.sentence(id))),
  }))
  const [q, setQ] = useState<Q | null>(null)
  const [reveal, setReveal] = useState<{ picked: string; ok: boolean } | null>(null)

  const battle = useBossBattle({
    maxHp: 9,
    hearts: 5,
    phaseAt: [6, 3],
    onFinish,
    onNext: (ph) => {
      setReveal(null)
      if (ph === 0) setQ({ kind: 'rune', q: runeQuestion(decks.rune.next()) })
      else if (ph === 1) {
        const wq = whisperQuestion(decks.word.next())
        const audio = canSpeak() && hasJapaneseVoice()
        setQ({ kind: 'whisper', q: wq, audio })
        if (audio) void speak(wq.word.kana, { force: true, rate: 0.8 })
      } else setQ({ kind: 'sentence', q: sentenceQuestion(decks.sentence.next()) })
    },
  })
  const elapsed = useAnswerTimer(battle.turn)

  function pick(o: string) {
    if (!q || reveal || battle.busy) return
    const ms = elapsed()
    const ok = isAccepted(q.q, o)
    setReveal({ picked: o, ok })
    if (q.kind === 'rune') {
      if (ok) void speak(q.q.rune.reading)
      else decks.rune.requeue(q.q.rune)
    } else if (q.kind === 'whisper') {
      if (ok) void speak(q.q.word.kana)
      else decks.word.requeue(q.q.word)
    } else {
      if (ok) void speak(q.q.accepted[0])
      else decks.sentence.requeue(q.q.sentence.id)
    }
    battle.resolve(ok, [{ itemId: q.q.itemId, correct: ok, ms }], { heroic: [q.q.itemId], delay: ok ? 1200 : 3000 })
  }

  const sprite = (
    <div className="bl-librarian">
      <span className="bl-book b1" aria-hidden>
        <PixelSprite id="book" scale={2} />
      </span>
      <span className="bl-book b2" aria-hidden>
        <PixelSprite id="scroll" scale={2} />
      </span>
      <span className="bl-book b3" aria-hidden>
        <PixelSprite id="book" scale={2} />
      </span>
    </div>
  )

  return (
    <BossArena
      battle={battle}
      activity={activity}
      onExit={onExit}
      name={{ en: 'Silent Librarian', jp: 'しずかなししょ' }}
      spriteId="wisp"
      spriteFilter={PHASE_FILTERS[battle.phase]}
      sprite={sprite}
      floor={LIBRARY_FLOOR}
      aura={AURAS[battle.phase]}
      phaseNames={[
        { en: 'Written Riddles', jp: 'かかれたなぞ' },
        { en: 'Whispered Riddles', jp: 'ささやくなぞ' },
        { en: 'The True Sentence', jp: 'まことのぶん' },
      ]}
      introLines={[
        'The Librarian speaks only in riddles. Answer truly or be silenced.',
        'Phase 1: read her rune sentences.',
        'Phase 2: she whispers a word — pick how it is written (turn your sound on).',
        'Phase 3: find the one correct Japanese sentence among her forgeries.',
      ]}
      taunt={TAUNTS[battle.phase]}
      victory={{ jp: 'ししょが ほほえんだ…', en: 'The Librarian smiles and lets you pass.' }}
    >
      {q?.kind === 'rune' && (
        <>
          <div className="ba-prompt bl-scroll">
            <div className="ba-prompt-label">
              <T en="A rune glows on the page. What does it say?" jp="このルーンの いみは？" />
            </div>
            <div className="ba-prompt-main" lang="ja">
              {q.q.rune.jp}
            </div>
            <div className="bl-reading" lang="ja">
              {q.q.rune.reading}
            </div>
          </div>
          <ChoiceGrid className="ba-choices-1" options={q.q.options} onPick={pick} reveal={reveal && { picked: reveal.picked, accepted: q.q.accepted }} />
          <Feedback ok={reveal?.ok ?? null}>{reveal && `${q.q.rune.jp} — ${q.q.rune.answer}`}</Feedback>
        </>
      )}
      {q?.kind === 'whisper' && (
        <>
          <div className="ba-prompt bl-scroll">
            <div className="ba-prompt-label">
              {q.audio ? <T en="She whispers a word… which is it?" jp="ささやきが きこえる… どれ？" /> : <T en="(No voice available) She writes the sound in kana:" jp="かなで かいた おと：" />}
            </div>
            {q.audio ? (
              <button type="button" className="btn bl-listen" onClick={() => void speak(q.q.word.kana, { force: true, rate: 0.8 })}>
                👂 <T en="Listen again" jp="もういちど" />
              </button>
            ) : (
              <div className="ba-prompt-main" lang="ja">
                {q.q.word.kana}
              </div>
            )}
          </div>
          <ChoiceGrid options={q.q.options} jp onPick={pick} reveal={reveal && { picked: reveal.picked, accepted: q.q.accepted }} />
          <Feedback ok={reveal?.ok ?? null}>
            {reveal && (
              <>
                {q.q.word.emoji} {q.q.word.jp} ({q.q.word.kana}) — {q.q.word.en}
              </>
            )}
          </Feedback>
        </>
      )}
      {q?.kind === 'sentence' && (
        <>
          <div className="ba-prompt bl-scroll">
            <div className="ba-prompt-label">
              <T en="Which sentence truly says:" jp="ただしい ぶんは？" />
            </div>
            <div className="ba-prompt-main bl-en">“{q.q.sentence.en}”</div>
          </div>
          <ChoiceGrid className="ba-choices-1" options={q.q.options} jp onPick={pick} reveal={reveal && { picked: reveal.picked, accepted: q.q.accepted }} />
          <Feedback ok={reveal?.ok ?? null}>
            {reveal && (reveal.ok ? <>{q.q.sentence.hint}</> : <>{q.q.why[reveal.picked] ?? q.q.sentence.hint}</>)}
          </Feedback>
        </>
      )}
    </BossArena>
  )
}

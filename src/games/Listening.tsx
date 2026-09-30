import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameProps } from './types'
import type { Review } from '../engine/srs'
import type { Word } from '../data/vocab'
import { GameFrame, Hearts, Intro, Progress, useAnswerTimer, useBurst, useFlash } from '../components/ui'
import { item } from '../engine/items'
import { sfx } from '../engine/sfx'
import { canSpeak, hasJapaneseVoice, speak } from '../engine/speech'
import { weakness } from '../engine/srs'
import { getState, usePlayer } from '../engine/store'
import { listeningChoices, nextWord, safePool } from './recognition'
import './Listening.css'

const HEARTS = 3
const NPCS = ['👵', '🧑‍🌾', '👧', '🧙‍♂️', '👴', '🧝', '👩‍🍳', '🧒']

interface Round {
  word: Word
  choices: Word[]
  npc: string
}

function audioAvailable(): boolean {
  return canSpeak() && hasJapaneseVoice()
}

export default function Listening({ activity, params, onFinish, onExit }: GameProps<'listening'>) {
  const rounds = Math.max(1, params.rounds || 10)
  const player = usePlayer()
  const [pool] = useState(() => safePool(params.wordIds))
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro')
  const [roundNo, setRoundNo] = useState(0)
  const [round, setRound] = useState<Round | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [hearts, setHearts] = useState(HEARTS)
  const [correct, setCorrect] = useState(0)
  const [voiceOk, setVoiceOk] = useState(audioAvailable)
  const [speaking, setSpeaking] = useState(false)
  const [flashCls, flash] = useFlash()
  const [burstNode, burst] = useBurst()
  const elapsed = useAnswerTimer(round)
  const reviews = useRef<Review[]>([])
  const recent = useRef<string[]>([])
  const used = useRef(new Set<string>())
  const timers = useRef(new Set<number>())
  const done = useRef(false)

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
  }, [])

  useEffect(() => {
    const set = timers.current
    return () => {
      set.forEach((id) => clearTimeout(id))
      set.clear()
    }
  }, [])

  // Voices load asynchronously in most browsers.
  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') return
    const update = () => setVoiceOk(audioAvailable())
    speechSynthesis.addEventListener?.('voiceschanged', update)
    const id = window.setTimeout(update, 600)
    return () => {
      speechSynthesis.removeEventListener?.('voiceschanged', update)
      clearTimeout(id)
    }
  }, [])

  const fallback = !voiceOk || !player.settings.voice

  const say = useCallback((w: Word) => {
    setSpeaking(true)
    void speak(w.kana, { force: true }).then(() => setSpeaking(false))
  }, [])

  const newRound = useCallback(() => {
    const srs = getState().srs
    // Prefer words not yet heard this session, weighted by weakness.
    const fresh = pool.filter((w) => !used.current.has(w.id))
    const word = nextWord(fresh.length ? fresh : pool, (w) => weakness(srs[item.word(w.id)]), recent.current)
    used.current.add(word.id)
    recent.current = [...recent.current.slice(-4), word.id]
    const r: Round = { word, choices: listeningChoices(word, pool), npc: NPCS[Math.floor(Math.random() * NPCS.length)] }
    setRound(r)
    setPicked(null)
    return r
  }, [pool])

  const begin = () => {
    setPhase('play')
    setVoiceOk(audioAvailable())
    const r = newRound()
    if (audioAvailable() && getState().settings.voice) later(() => say(r.word), 350)
  }

  const end = useCallback(
    (score: number, lost: boolean) => {
      setPhase('end')
      if (lost) sfx.lose()
      else sfx.win()
      later(() => {
        if (done.current) return
        done.current = true
        onFinish({
          score,
          maxScore: rounds,
          passed: lost ? false : undefined,
          reviews: reviews.current,
          notes: [lost ? `Out of hearts after ${reviews.current.length} words.` : `You understood ${score} of ${rounds} words.`],
        })
      }, 1200)
    },
    [later, onFinish, rounds],
  )

  const choose = useCallback(
    (w: Word) => {
      if (!round || picked || phase !== 'play') return
      const ok = w.id === round.word.id
      setPicked(w.id)
      reviews.current.push({ itemId: item.word(round.word.id), correct: ok, ms: elapsed() })
      const nextCorrect = correct + (ok ? 1 : 0)
      const nextHearts = hearts - (ok ? 0 : 1)
      if (ok) {
        sfx.correct()
        flash('good')
        burst(50, 30, 14)
        setCorrect(nextCorrect)
      } else {
        sfx.wrong()
        flash('bad')
        setHearts(nextHearts)
        // Learning moment: say it again while the answer is shown.
        if (!fallback) later(() => say(round.word), 300)
      }
      const last = roundNo + 1 >= rounds
      later(
        () => {
          if (nextHearts <= 0) return end(nextCorrect, true)
          if (last) return end(nextCorrect, false)
          setRoundNo((n) => n + 1)
          const r = newRound()
          if (!fallback) later(() => say(r.word), 300)
        },
        ok ? 1300 : 2300,
      )
    },
    [round, picked, phase, elapsed, correct, hearts, flash, burst, fallback, later, say, roundNo, rounds, end, newRound],
  )

  useEffect(() => {
    if (phase !== 'play') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R' || e.key === ' ') {
        if (round && !fallback) {
          e.preventDefault()
          say(round.word)
        }
        return
      }
      const n = Number(e.key)
      const c = n >= 1 && n <= 4 ? round?.choices[n - 1] : undefined
      if (c) {
        e.preventDefault()
        choose(c)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, round, fallback, say, choose])

  const right = (
    <>
      <Hearts value={hearts} max={HEARTS} />
    </>
  )

  if (phase === 'intro') {
    return (
      <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right}>
        <Intro
          title={activity.title}
          jp={activity.jp}
          lines={[
            'A villager whispers a word. Listen closely.',
            'Choose how it is written (tap, or keys 1–4). Replay with 🔊 or R.',
            `${rounds} words · ${HEARTS} hearts. Some options sound alike!`,
          ]}
          onStart={begin}
        >
          {fallback && (
            <p className="ls-note">
              {!voiceOk ? 'No Japanese voice was found on this device, so' : 'Voice is turned off in settings, so'} the villagers will show the reading in kana instead.
            </p>
          )}
        </Intro>
      </GameFrame>
    )
  }

  const answered = picked !== null
  return (
    <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right} className="ls-game">
      <Progress value={roundNo + (answered ? 1 : 0)} max={rounds} />
      <div className={`card ls-stage ${flashCls}`}>
        {round && (
          <>
            <div className="ls-npc-row">
              <div className={`ls-npc ${speaking ? 'ls-talking' : ''}`} aria-hidden>
                {round.npc}
              </div>
              <div className="ls-bubble">
                {fallback ? (
                  <>
                    <span className="ls-kana" lang="ja">
                      「{round.word.kana}」
                    </span>
                    <small className="muted">{!voiceOk ? 'No Japanese voice here: read the whisper' : 'Voice off: read the whisper'}</small>
                  </>
                ) : (
                  <>
                    <span className={`ls-wave ${speaking ? 'on' : ''}`} aria-hidden>
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    {answered && (
                      <span className="ls-kana pop" lang="ja">
                        「{round.word.kana}」
                      </span>
                    )}
                  </>
                )}
              </div>
              <button type="button" className="btn-icon ls-replay" onClick={() => say(round.word)} aria-label="Replay the word" title="Replay (R)">
                🔊
              </button>
            </div>
            {answered && (
              <div className={`feedback ${picked === round.word.id ? 'good' : 'bad'} pop`}>
                <span className="ls-meaning">
                  {round.word.emoji} <span lang="ja">{round.word.jp}</span> = {round.word.en}
                </span>
              </div>
            )}
          </>
        )}
        {burstNode}
        {phase === 'end' && (
          <div className="ls-end pop">
            <span lang="ja">{hearts <= 0 ? 'ざんねん…' : 'よくできました！'}</span>
          </div>
        )}
      </div>
      <div className="choices ls-choices">
        {round?.choices.map((c, i) => {
          const isAnswer = c.id === round.word.id
          const cls = answered ? (isAnswer ? 'correct' : picked === c.id ? 'wrong' : 'ls-dim') : ''
          return (
            <button key={`${round.word.id}-${c.id}`} type="button" className={`choice choice-jp ${cls}`} disabled={answered || phase !== 'play'} onClick={() => choose(c)}>
              <span className="ls-key">{i + 1}</span>
              <span lang="ja">{c.jp}</span>
              {answered && (
                <small className="ls-reading" lang="ja">
                  {c.kana !== c.jp ? c.kana : ''} {c.en}
                </small>
              )}
            </button>
          )
        })}
      </div>
    </GameFrame>
  )
}

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { GameProps } from './types'
import type { Review } from '../engine/srs'
import type { Word } from '../data/vocab'
import { GameFrame, HpBar, Intro, Jp, useBurst } from '../components/ui'
import { item } from '../engine/items'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import { weakness } from '../engine/srs'
import { getState } from '../engine/store'
import {
  buildChoices,
  comboMultiplier,
  directionFor,
  elementColor,
  enemyTravelMs,
  nextWord,
  safePool,
  SPEED_PENALTY_SEC,
  speedCastScore,
} from './recognition'
import './SpeedCast.css'

const MONSTERS = ['👾', '👻', '🦇', '🐺', '🐗', '💀', '🕷️', '🐍', '👺', '🧟', '🦂', '🐲']
/** Lane geometry in % of the lane width. */
const START_X = 88
const PLAYER_X = 12
const SHOT_MS = 200
const REVEAL_MS = 1100

interface Enemy {
  uid: number
  word: Word
  dir: 'jp-en' | 'en-jp'
  choices: Word[]
  monster: string
  born: number
  travelMs: number
  /** 0 = just appeared, 1 = reached the player. */
  progress: number
  state: 'approach' | 'dying' | 'reveal' | 'struck'
  picked?: string
}

interface State {
  enemy: Enemy | null
  endAt: number
  now: number
  correct: number
  faced: number
  streak: number
  best: number
  points: number
  recent: string[]
  reviews: Review[]
  shot: { id: number; x: number } | null
  over: boolean
}

let seq = 1

export default function SpeedCast({ activity, params, onFinish, onExit }: GameProps<'speedcast'>) {
  const duration = Math.max(10, params.durationSec || 60)
  const [pool] = useState(() => safePool(params.wordIds))
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro')
  const [shake, setShake] = useState(false)
  const [penalty, setPenalty] = useState(0)
  const [, rerender] = useReducer((x: number) => x + 1, 0)
  const [burstNode, burst] = useBurst()
  const timers = useRef(new Set<number>())
  const onFinishRef = useRef(onFinish)
  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])
  const g = useRef<State>({
    enemy: null,
    endAt: 0,
    now: 0,
    correct: 0,
    faced: 0,
    streak: 0,
    best: 0,
    points: 0,
    recent: [],
    reviews: [],
    shot: null,
    over: false,
  })

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

  const spawn = useCallback(() => {
    const s = g.current
    if (s.over) return
    const srs = getState().srs
    const word = nextWord(pool, (w) => weakness(srs[item.word(w.id)]), s.recent)
    s.recent = [...s.recent.slice(-6), word.id]
    const dir = directionFor(params.direction)
    s.enemy = {
      uid: seq++,
      word,
      dir,
      choices: buildChoices(word, pool, dir === 'jp-en' ? 'en' : 'jp'),
      monster: MONSTERS[Math.floor(Math.random() * MONSTERS.length)],
      born: performance.now(),
      travelMs: enemyTravelMs(s.streak, s.faced),
      progress: 0,
      state: 'approach',
    }
  }, [params.direction, pool])

  const finish = useCallback(() => {
    const s = g.current
    if (s.over) return
    s.over = true
    setPhase('end')
    sfx.win()
    later(() => {
      const { score, maxScore } = speedCastScore(s.correct, s.faced, duration)
      onFinishRef.current({
        score,
        maxScore,
        reviews: s.reviews,
        notes: [`${s.correct} of ${s.faced} enemies banished · ${s.points} points`, `Best combo: ${s.best}`],
      })
    }, 1300)
  }, [duration, later])

  /** Wrong answer or an enemy got through: combo breaks and time is lost. */
  const penalise = useCallback(
    (e: Enemy, now: number) => {
      const s = g.current
      s.faced += 1
      s.streak = 0
      s.endAt -= SPEED_PENALTY_SEC * 1000
      s.reviews.push({ itemId: item.word(e.word.id), correct: false, ms: Math.round(now - e.born) })
      setShake(true)
      setPenalty((p) => p + 1)
      later(() => setShake(false), 420)
      later(() => {
        if (s.enemy === e) s.enemy = null
        spawn()
      }, REVEAL_MS)
    },
    [later, spawn],
  )

  // ─── Main loop ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'play') return
    let raf = 0
    const loop = (t: number) => {
      const s = g.current
      if (s.over) return
      s.now = t
      const e = s.enemy
      if (e && e.state === 'approach') {
        e.progress = Math.min(1, (t - e.born) / e.travelMs)
        if (e.progress >= 1) {
          e.state = 'struck'
          sfx.hurt()
          penalise(e, t)
        }
      }
      if (t >= s.endAt) {
        finish()
        rerender()
        return
      }
      rerender()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase, finish, penalise])

  const start = () => {
    const s = g.current
    s.endAt = performance.now() + duration * 1000
    s.now = performance.now()
    spawn()
    setPhase('play')
  }

  const answer = useCallback(
    (w: Word) => {
      const s = g.current
      const e = s.enemy
      if (!e || e.state !== 'approach' || s.over) return
      const now = performance.now()
      e.picked = w.id
      if (w.id === e.word.id) {
        e.state = 'dying'
        s.correct += 1
        s.faced += 1
        s.streak += 1
        s.best = Math.max(s.best, s.streak)
        s.points += 10 * comboMultiplier(s.streak)
        s.reviews.push({ itemId: item.word(e.word.id), correct: true, ms: Math.round(now - e.born) })
        const x = START_X - e.progress * (START_X - PLAYER_X)
        s.shot = { id: seq++, x }
        sfx.cast()
        later(() => {
          s.shot = null
          sfx.correct()
          burst(x, 55, 12)
          void speak(e.word.kana)
        }, SHOT_MS)
        later(() => {
          if (s.enemy === e) s.enemy = null
          spawn()
        }, SHOT_MS + 380)
      } else {
        e.state = 'reveal'
        sfx.wrong()
        penalise(e, now)
      }
      rerender()
    },
    [burst, later, penalise, spawn],
  )

  useEffect(() => {
    if (phase !== 'play') return
    const onKey = (ev: KeyboardEvent) => {
      const n = Number(ev.key)
      if (!(n >= 1 && n <= 4)) return
      const c = g.current.enemy?.choices[n - 1]
      if (c) {
        ev.preventDefault()
        answer(c)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, answer])

  const s = g.current
  const left = phase === 'intro' ? duration : Math.max(0, (s.endAt - s.now) / 1000)
  const mult = comboMultiplier(s.streak)
  const right = (
    <span className="sc-score">
      <b>{s.points}</b>
      {mult > 1 && <span className="sc-mult pop" key={mult}>×{mult}</span>}
    </span>
  )

  const directionLine =
    params.direction === 'jp-en'
      ? 'Each enemy carries a Japanese word: choose its English meaning.'
      : params.direction === 'en-jp'
        ? 'Each enemy carries an English word: choose the Japanese spell.'
        : 'Enemies carry Japanese or English words: choose the other language.'

  if (phase === 'intro') {
    return (
      <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right}>
        <Intro
          title={activity.title}
          jp={activity.jp}
          lines={[directionLine, 'Answer before it reaches you (tap, or keys 1–4).', `Streaks build a combo multiplier. Mistakes and hits cost ${SPEED_PENALTY_SEC} seconds.`, `You have ${duration} seconds.`]}
          onStart={start}
        />
      </GameFrame>
    )
  }

  const e = s.enemy
  const ex = e ? START_X - e.progress * (START_X - PLAYER_X) : START_X
  const revealing = e && (e.state === 'reveal' || e.state === 'struck')

  return (
    <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right} className="sc-game">
      <div className="sc-timer">
        <HpBar value={left} max={duration} color={left < 10 ? 'var(--bad)' : 'linear-gradient(90deg, var(--wind), var(--accent))'} />
        <span className="sc-time">{Math.ceil(left)}s</span>
        {penalty > 0 && (
          <span className="sc-penalty" key={penalty}>
            −{SPEED_PENALTY_SEC}s
          </span>
        )}
      </div>

      <div className={`sc-lane ${shake ? 'shake' : ''} ${phase === 'end' ? 'sc-stopped' : ''}`}>
        <div className="sc-hills" aria-hidden />
        <div className="sc-ground" aria-hidden />
        <div className="sc-player" style={{ left: `${PLAYER_X}%` }} aria-hidden>
          🧙
        </div>
        {e && (
          <div
            key={e.uid}
            className={`sc-enemy ${e.state === 'dying' ? 'sc-dying' : ''} ${e.state === 'struck' ? 'sc-struck' : ''} ${e.progress > 0.7 && e.state === 'approach' ? 'sc-close' : ''}`}
            style={{ left: `${ex}%`, ['--sc-color' as string]: elementColor(e.word) }}
          >
            <div className="sc-card">
              {e.dir === 'jp-en' ? (
                <Jp text={e.word.jp} reading={e.word.kana} className="sc-jp" />
              ) : (
                <>
                  <span className="sc-emoji">{e.word.emoji}</span>
                  <span className="sc-en">{e.word.en}</span>
                </>
              )}
            </div>
            <div className="sc-monster">{e.monster}</div>
          </div>
        )}
        {s.shot && <span key={s.shot.id} className="sc-shot" style={{ ['--x1' as string]: `${s.shot.x}%`, ['--x0' as string]: `${PLAYER_X + 4}%`, animationDuration: `${SHOT_MS}ms`, ['--sc-color' as string]: e ? elementColor(e.word) : 'var(--accent)' }} />}
        {revealing && e && (
          <div className="sc-reveal pop">
            <span lang="ja">{e.word.jp}</span>
            {e.word.jp !== e.word.kana && <small lang="ja">{e.word.kana}</small>}
            <span>= {e.word.en}</span>
          </div>
        )}
        {phase === 'end' && (
          <div className="sc-end pop">
            <span lang="ja">じかんです！</span>
            <small>Time! {s.correct} banished</small>
          </div>
        )}
        {burstNode}
      </div>

      {s.streak >= 3 && phase === 'play' && (
        <div className="sc-combo glow-text" key={s.streak}>
          {s.streak} combo!
        </div>
      )}

      <div className="choices sc-choices">
        {(e?.choices ?? []).map((c, i) => {
          const isAnswer = c.id === e?.word.id
          const cls = revealing && isAnswer ? 'correct' : e?.picked === c.id ? (isAnswer ? 'correct' : 'wrong') : ''
          return (
            <button key={`${e?.uid}-${c.id}`} type="button" className={`choice ${e?.dir === 'en-jp' ? 'choice-jp' : ''} ${cls}`} disabled={!e || e.state !== 'approach' || phase !== 'play'} onClick={() => answer(c)}>
              <span className="sc-key">{i + 1}</span>
              {e?.dir === 'en-jp' ? <Jp text={c.jp} reading={c.kana} /> : c.en}
            </button>
          )
        })}
      </div>
    </GameFrame>
  )
}

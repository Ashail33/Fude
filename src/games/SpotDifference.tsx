import { useCallback, useEffect, useRef, useState } from 'react'
import { GameFrame, Intro, Progress, T, useBurst, useFlash } from '../components/ui'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import type { Review } from '../engine/srs'
import { buildRounds, glossOf, isKana, spotItemId, type SpotRound } from './spot'
import type { GameProps } from './types'
import { Portrait } from './pixel'
import { useHitFlash } from './pixelHooks'
import './SpotDifference.css'

const PENALTY_MS = 3000
const REVEAL_MS = 1500

export default function SpotDifference({ activity, params, onFinish, onExit }: GameProps<'spot'>) {
  const { minLevel, maxLevel, rounds: roundCount, timeLimitSec } = params
  const [rounds] = useState<SpotRound[]>(() => buildRounds(roundCount, minLevel, maxLevel))
  const total = rounds.length

  const [started, setStarted] = useState(false)
  const [i, setI] = useState(0)
  const [found, setFound] = useState(0)
  const [wrongCells, setWrongCells] = useState<number[]>([])
  const [reveal, setReveal] = useState(false)
  const [note, setNote] = useState('')
  const hostFlash = useHitFlash(wrongCells.length)
  const [penalty, setPenalty] = useState(0) // key for "−3s" pop
  const [leftMs, setLeftMs] = useState(timeLimitSec * 1000)
  const [over, setOver] = useState(false)
  const [burst, fire] = useBurst()
  const [flashCls, flash] = useFlash()

  const reviews = useRef<Review[]>([])
  const endAt = useRef(0)
  const paused = useRef<number | null>(null) // remaining ms while paused
  const roundStart = useRef(0)
  const missedThisRound = useRef(false)
  const finished = useRef(false)
  const timers = useRef<number[]>([])
  const foundRef = useRef(0)

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const round = rounds[i]

  const finish = useCallback(
    (timedOut: boolean) => {
      if (finished.current) return
      finished.current = true
      setOver(true)
      const f = foundRef.current
      if (timedOut) {
        sfx.lose()
        // The imposter left standing counts as a miss.
        const r = rounds[i]
        if (r && !missedThisRound.current) reviews.current.push({ itemId: spotItemId(r.imposter), correct: false })
      } else sfx.win()
      later(
        () =>
          onFinish({
            score: f,
            maxScore: total,
            reviews: reviews.current,
            notes: [`${f} of ${total} imposters unmasked`, timedOut ? 'The hourglass ran out' : `${Math.ceil(Math.max(0, endAt.current - Date.now()) / 1000)}s to spare`],
          }),
        timedOut ? 1200 : 900,
      )
    },
    [i, later, onFinish, rounds, total],
  )

  // Global hourglass.
  useEffect(() => {
    if (!started || over) return
    const id = window.setInterval(() => {
      if (paused.current !== null) return
      const left = Math.max(0, endAt.current - Date.now())
      setLeftMs(left)
      if (left <= 0) finish(true)
    }, 100)
    return () => clearInterval(id)
  }, [started, over, finish])

  useEffect(() => {
    if (!started || total === 0) return
    roundStart.current = performance.now()
    missedThisRound.current = false
    setWrongCells([])
    setNote('')
  }, [started, i, total])

  useEffect(() => {
    if (started && total === 0 && !finished.current) {
      finished.current = true
      onFinish({ score: 0, maxScore: 0, reviews: [], passed: true })
    }
  }, [started, total, onFinish])

  const start = () => {
    endAt.current = Date.now() + timeLimitSec * 1000
    setStarted(true)
  }

  const tap = (cell: number) => {
    if (!round || reveal || over || wrongCells.includes(cell)) return
    if (cell === round.at) {
      const ms = Math.round(performance.now() - roundStart.current)
      if (!missedThisRound.current) reviews.current.push({ itemId: spotItemId(round.imposter), correct: true, ms })
      foundRef.current += 1
      setFound(foundRef.current)
      sfx.correct()
      flash('good')
      const col = round.at % round.size
      const row = Math.floor(round.at / round.size)
      fire(((col + 0.5) / round.size) * 100, ((row + 0.5) / round.size) * 100, 14)
      void speak(round.imposter)
      // Pause the hourglass during the reveal.
      paused.current = Math.max(0, endAt.current - Date.now())
      setReveal(true)
      later(() => {
        setReveal(false)
        endAt.current = Date.now() + (paused.current ?? 0)
        paused.current = null
        if (i + 1 >= total) finish(false)
        else setI(i + 1)
      }, REVEAL_MS)
    } else {
      sfx.wrong()
      flash('bad')
      if (!missedThisRound.current) reviews.current.push({ itemId: spotItemId(round.imposter), correct: false, ms: Math.round(performance.now() - roundStart.current) })
      missedThisRound.current = true
      endAt.current -= PENALTY_MS
      setLeftMs(Math.max(0, endAt.current - Date.now()))
      setPenalty((p) => p + 1)
      setWrongCells((w) => [...w, cell])
      setNote(round.note)
      if (endAt.current <= Date.now()) finish(true)
    }
  }

  // Keyboard: digits 1–9 pick cells on 3×3 grids.
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {})
  keyRef.current = (e: KeyboardEvent) => {
    if (!started || !round || round.size !== 3) return
    const n = Number(e.key)
    if (n >= 1 && n <= 9) tap(n - 1)
  }
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const secs = Math.ceil(leftMs / 1000)
  const right = (
    <>
      <span className={`sd-time ${secs <= 10 ? 'sd-low' : ''}`}>
        ⏳ {secs}s
        {penalty > 0 && (
          <span key={penalty} className="sd-penalty">
            −3s
          </span>
        )}
      </span>
      <span className="sd-found">
        ✦ {found}/{total}
      </span>
    </>
  )

  if (!started) {
    return (
      <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right}>
        <Intro
          title={activity.title}
          jp={activity.jp}
          onStart={start}
          lines={[
            'A shape-shifter hides among identical characters.',
            'Tap the one that is different. Look closely!',
            `Wrong taps cost 3 seconds. Unmask ${total} imposters in ${timeLimitSec}s.`,
          ]}
        />
      </GameFrame>
    )
  }

  if (!round) return <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right}>{null}</GameFrame>

  const cells = Array.from({ length: round.size * round.size }, (_, c) => (c === round.at ? round.imposter : round.base))
  const kanji = !isKana(round.base) || !isKana(round.imposter)

  return (
    <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right} className="spot-game">
      <Progress value={leftMs} max={timeLimitSec * 1000} />
      <div className="sd-head">
        <span className="muted">
          <T en={`Round ${i + 1}/${total}`} jp={`${i + 1}/${total}かいめ`} />
        </span>
        <span className="sd-level">
          <T en={`Level ${round.level}`} jp={`レベル${round.level}`} />
        </span>
      </div>
      <div className="spot-host">
        <Portrait id="tanuki" scale={2} ground={round.level >= 3 ? 'tatami' : 'grass'} talking={!reveal} flash={hostFlash} title="Tanuki" />
        <p className="sd-instr spot-bubble" key={reveal ? 'r' : 'q'}>
          {reveal ? <T en="Curses, you saw through me!" jp="ばれたか！" /> : <T en="Find the imposter!" jp="にせものはどれ？" />}
        </p>
      </div>

      <div className={`sd-board ${flashCls}`}>
        <div className={`sd-grid sd-grid-${round.size} ${kanji ? 'sd-kanji' : ''}`} key={i} role="group" aria-label="Character grid">
          {cells.map((ch, c) => {
            const isImp = c === round.at
            const cls = ['sd-cell', wrongCells.includes(c) ? 'sd-wrong' : '', reveal && isImp ? 'sd-found-cell' : '', reveal && !isImp ? 'sd-dim' : ''].join(' ')
            return (
              <button key={c} type="button" className={cls} lang="ja" onClick={() => tap(c)} aria-label={`Cell ${c + 1}: ${ch}`} disabled={reveal || over}>
                {ch}
              </button>
            )
          })}
        </div>
        {reveal && (
          <div className="sd-reveal pop" role="status">
            <div className="sd-pair">
              <div>
                <span lang="ja" className="sd-pair-ch">
                  {round.base}
                </span>
                <small>{glossOf(round.base)}</small>
              </div>
              <span className="sd-vs">≠</span>
              <div className="sd-pair-imp">
                <span lang="ja" className="sd-pair-ch">
                  {round.imposter}
                </span>
                <small>{glossOf(round.imposter)}</small>
              </div>
            </div>
            <p>{round.note}</p>
          </div>
        )}
        {burst}
      </div>

      <div className={`feedback ${note ? 'bad' : ''}`} role="status">
        {note && !reveal ? `✗ −3s · ${note}` : ''}
      </div>
    </GameFrame>
  )
}

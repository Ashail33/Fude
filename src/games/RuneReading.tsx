import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RUNES, type Rune } from '../data/sentences'
import { GameFrame, Hearts, Intro, Jp, Progress, SpeakButton, T, useAnswerTimer, useBurst } from '../components/ui'
import { item } from '../engine/items'
import { shuffle, weightedSample } from '../engine/random'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import { weakness, type Review } from '../engine/srs'
import { getState } from '../engine/store'
import type { GameProps } from './types'
import { PixelTile, TileStrip, type StripCell } from './pixel'
import './RuneReading.css'

const MAX_RUNES = 10
const MAX_HEARTS = 3
/** The shrine hall floor: worn flagstones with a strip of carpet down the middle. */
const hallRow = (): StripCell[] => Array.from({ length: 41 }, (_, i) => (i === 20 ? 'carpet' : 'stone-floor'))
const HALL_FLOOR: StripCell[][] = [hallRow(), hallRow()]

const KANJI_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

type Phase = 'ask' | 'right' | 'wrong' | 'opening'

export default function RuneReading({ activity, params, onFinish, onExit }: GameProps<'runes'>) {
  const runes = useMemo(() => {
    const pool = RUNES.filter((r) => params.runeIds.includes(r.id))
    const srs = getState().srs
    return weightedSample(pool, Math.min(MAX_RUNES, pool.length), (r) => weakness(srs[item.rune(r.id)]))
  }, [params.runeIds])

  const [started, setStarted] = useState(false)
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('ask')
  const [picked, setPicked] = useState<string | null>(null)
  const [lit, setLit] = useState(false)
  const [hearts, setHearts] = useState(MAX_HEARTS)
  const [score, setScore] = useState(0)

  const reviews = useRef<Review[]>([])
  const scoreRef = useRef(0)
  const correctCount = useRef(0)
  const finished = useRef(false)
  const timeouts = useRef<number[]>([])
  const [burstNode, burst] = useBurst()
  const elapsed = useAnswerTimer(`${idx}-${started}`)

  const rune = runes[idx] as Rune | undefined
  const options = useMemo(() => (rune ? shuffle([rune.answer, ...rune.wrong]) : []), [rune])

  const later = useCallback((fn: () => void, ms: number) => {
    timeouts.current.push(window.setTimeout(fn, ms))
  }, [])
  useEffect(() => () => timeouts.current.forEach(clearTimeout), [])

  const finish = useCallback(
    (won: boolean) => {
      if (finished.current) return
      finished.current = true
      onFinish({
        score: scoreRef.current,
        maxScore: runes.length * 2,
        reviews: reviews.current,
        passed: won ? undefined : false,
        notes: [`${correctCount.current} of ${runes.length} tablets deciphered`, ...(won ? [] : ['The tablets crumbled — the shrine sealed itself.'])],
      })
    },
    [onFinish, runes.length],
  )

  const choose = useCallback(
    (opt: string) => {
      if (!rune || phase !== 'ask') return
      const ok = opt === rune.answer
      setPicked(opt)
      reviews.current.push({ itemId: item.rune(rune.id), correct: ok, ms: elapsed() })
      if (ok) {
        const pts = !params.showReading && lit ? 1 : 2
        scoreRef.current += pts
        correctCount.current += 1
        setScore(scoreRef.current)
        setPhase('right')
        sfx.correct()
        burst(50, 35, 16)
        void speak(rune.jp)
      } else {
        const h = hearts - 1
        setHearts(h)
        setPhase('wrong')
        sfx.wrong()
        sfx.hurt()
        void speak(rune.jp)
        if (h <= 0) {
          later(() => {
            sfx.lose()
            finish(false)
          }, 1500)
        }
      }
    },
    [rune, phase, params.showReading, lit, elapsed, burst, hearts, later, finish],
  )

  const next = useCallback(() => {
    if (phase === 'ask' || phase === 'opening' || hearts <= 0) return
    if (idx + 1 >= runes.length) {
      sfx.win()
      finish(true)
      return
    }
    if (phase === 'right') {
      // The door slides open; the scene advances deeper into the shrine.
      setPhase('opening')
      sfx.cast()
      later(() => {
        setIdx((i) => i + 1)
        setPicked(null)
        setLit(false)
        setPhase('ask')
      }, 900)
    } else {
      setIdx((i) => i + 1)
      setPicked(null)
      setLit(false)
      setPhase('ask')
    }
  }, [phase, hearts, idx, runes.length, finish, later])

  const illuminate = () => {
    if (lit || phase !== 'ask') return
    setLit(true)
    sfx.cast()
  }

  useEffect(() => {
    if (!started) return
    const onKey = (e: KeyboardEvent) => {
      if (phase === 'ask' && /^[1-3]$/.test(e.key)) {
        const o = options[Number(e.key) - 1]
        if (o) choose(o)
      } else if (e.key === 'Enter' && (phase === 'right' || phase === 'wrong')) {
        e.preventDefault()
        next()
      } else if ((e.key === 'i' || e.key === 'I') && !params.showReading) {
        illuminate()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const right = (
    <>
      <span className="rr-score">📜 {score}</span>
      <Hearts value={hearts} max={MAX_HEARTS} />
    </>
  )

  if (!started || !rune) {
    return (
      <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right}>
        <Intro
          title="Rune Interpretation"
          jp="いしぶみをよむ"
          lines={[
            'Ancient tablets bar the way through the shrine. Read each carved sentence.',
            'Choose its meaning (1–3). A correct reading opens the next door.',
            'A wrong reading cracks the tablet and costs a heart — three hearts in all.',
            params.showReading
              ? 'Kana readings glow above the carvings to help you.'
              : 'The tablets are unlit: kanji only. "Illuminate" reveals the reading but halves the reward.',
          ]}
          onStart={() => setStarted(true)}
        />
      </GameFrame>
    )
  }

  const showReading = params.showReading || lit
  const depth = idx + 1

  return (
    <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right} className="rr">
      <Progress value={idx + (phase === 'ask' ? 0 : 1)} max={runes.length} />

      <div className={`rr-scene depth-${Math.min(depth, 10)}`} style={{ ['--depth' as string]: depth }}>
        {burstNode}
        <div className="rr-hall" aria-hidden>
          <TileStrip rows={HALL_FLOOR} scale={2} className="rr-floor" animate={false} />
          <span className="rr-lantern l">
            <PixelTile id="lantern" under="stone-floor" scale={3} />
          </span>
          <span className="rr-lantern r">
            <PixelTile id="lantern" under="stone-floor" scale={3} />
          </span>
          <div className="rr-far-door" />
        </div>
        <div className="rr-room-label">
          <T en={`Chamber ${depth}`} jp={`第${KANJI_NUM[idx] ?? depth}の間`} />
        </div>

        <div className={`rr-doors ${phase === 'opening' ? 'open' : ''}`} aria-hidden>
          <div className="rr-door left" />
          <div className="rr-door right" />
        </div>

        <div key={rune.id} className={`rr-tablet ${phase === 'right' || phase === 'opening' ? 'glow' : ''} ${phase === 'wrong' ? 'cracked shake' : ''} ${phase === 'opening' ? 'sink' : 'rise'}`}>
          <div className="rr-carving">
            <Jp text={rune.jp} reading={showReading ? rune.reading : undefined} hideHelp={!showReading} className="rr-jp" />
          </div>
          {phase === 'wrong' && (
            <svg className="rr-crack" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden>
              <path d="M96 0 L88 30 L104 46 L90 72 L102 94 L94 120" />
              <path d="M88 30 L60 40 L42 36" />
              <path d="M90 72 L128 80 L150 74" />
            </svg>
          )}
          <div className="rr-tablet-foot">
            {!params.showReading && phase === 'ask' && !lit && (
              <button type="button" className="btn btn-sm rr-illuminate" onClick={illuminate}>
                🕯️ <T en="Illuminate (½ reward)" jp="てらす（はんぶん）" />
              </button>
            )}
            {phase !== 'ask' && <SpeakButton text={rune.jp} />}
          </div>
        </div>
      </div>

      <div className="prompt-label center">
        <T en="What does the tablet say?" jp="いしぶみはなんといっている？" />
      </div>

      <div className="choices rr-choices">
        {options.map((o, i) => {
          const isAnswer = o === rune.answer
          const cls = phase !== 'ask' && isAnswer ? 'correct' : phase !== 'ask' && o === picked ? 'wrong' : ''
          return (
            <button key={o} type="button" className={`choice ${cls}`} disabled={phase !== 'ask'} onClick={() => choose(o)}>
              <span className="rr-num">{i + 1}</span> {o}
            </button>
          )
        })}
      </div>

      <div className={`feedback ${phase === 'wrong' ? 'bad' : phase === 'ask' ? '' : 'good'}`} role="status">
        {phase === 'right' && <T en="The runes blaze with light — a passage opens!" jp="ひかった！みちがひらく！" />}
        {phase === 'wrong' && (
          <span>
            <T en="The tablet cracks!" jp="いしぶみがわれた！" /> — “{rune.answer}”
          </span>
        )}
      </div>

      {(phase === 'right' || phase === 'wrong') && hearts > 0 && (
        <div className="row rr-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={next} autoFocus>
            {idx + 1 >= runes.length ? <T en="Leave the shrine" jp="でる" /> : phase === 'right' ? <T en="Enter the passage" jp="すすむ" /> : <T en="Next tablet" jp="つぎへ" />}
          </button>
        </div>
      )}
    </GameFrame>
  )
}

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { GameFrame, Intro, Progress, T, useBurst, useFlash } from '../components/ui'
import { KANA_BY_CHAR } from '../data/kana'
import { RADICAL_BY_CHAR, RECIPES } from '../data/kanji'
import strokesJson from '../data/strokes.json'
import { item } from '../engine/items'
import { weightedSample } from '../engine/random'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import { weakness, type Review } from '../engine/srs'
import { usePlayer } from '../engine/store'
import { BOX, characterPoints, evaluateStroke, parsePath, pathLength, type Pt } from '../engine/stroke'
import type { GameProps } from './types'
import { PixelSprite } from '../art'
import './ArcanaDrawing.css'

const STROKES = strokesJson as Record<string, string[]>

/** Meaning + kana reading for kanji not covered by data/kanji.ts. */
const EXTRA_KANJI: Record<string, { meaning: string; reading: string }> = {
  川: { meaning: 'river', reading: 'かわ' },
  中: { meaning: 'middle', reading: 'なか' },
  上: { meaning: 'up, above', reading: 'うえ' },
  下: { meaning: 'down, below', reading: 'した' },
  一: { meaning: 'one', reading: 'いち' },
  二: { meaning: 'two', reading: 'に' },
  三: { meaning: 'three', reading: 'さん' },
  本: { meaning: 'book, origin', reading: 'ほん' },
  手: { meaning: 'hand', reading: 'て' },
  犬: { meaning: 'dog', reading: 'いぬ' },
  花: { meaning: 'flower', reading: 'はな' },
  空: { meaning: 'sky', reading: 'そら' },
  金: { meaning: 'gold, money', reading: 'きん' },
  士: { meaning: 'samurai, scholar', reading: 'し' },
  太: { meaning: 'fat, thick', reading: 'ふとい' },
  未: { meaning: 'not yet', reading: 'み' },
  末: { meaning: 'end', reading: 'すえ' },
  入: { meaning: 'enter', reading: 'はいる' },
}

interface CharInfo {
  char: string
  kana: boolean
  itemId: string
  /** Romaji for kana; kana reading for kanji. */
  reading: string
  meaning: string
  /** What to pass to speak(). */
  say: string
}

function charInfo(char: string): CharInfo {
  const k = KANA_BY_CHAR.get(char)
  if (k) return { char, kana: true, itemId: item.kana(char), reading: k.romaji, meaning: k.script, say: char }
  const r = RADICAL_BY_CHAR.get(char)
  const rec = RECIPES.find((x) => x.result === char)
  const x = EXTRA_KANJI[char]
  const reading = r?.reading ?? rec?.reading ?? x?.reading ?? ''
  const meaning = r?.meaning ?? rec?.meaning ?? x?.meaning ?? 'kanji'
  return { char, kana: false, itemId: item.kanji(char), reading, meaning, say: reading || char }
}

const HINT_COST = { trace: 5, recall: 15 } as const
const MISTAKE_COST = 20
const toPoints = (pts: readonly Pt[]) => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

export default function ArcanaDrawing({ activity, params, onFinish, onExit }: GameProps<'arcana'>) {
  const player = usePlayer()
  const { mode } = params
  const trace = mode === 'trace'

  // Characters for this session, weighted toward weak SRS items.
  const [queue] = useState<CharInfo[]>(() => {
    const valid = [...new Set(params.chars)].filter((c) => STROKES[c]?.length)
    const n = Math.min(params.count, valid.length)
    return weightedSample(valid, n, (c) => weakness(player.srs[charInfo(c).itemId]) + 0.1).map(charInfo)
  })

  const [started, setStarted] = useState(false)
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState<number[]>([]) // accepted stroke scores
  const [current, setCurrent] = useState<Pt[] | null>(null)
  const [bad, setBad] = useState<{ pts: Pt[]; key: number } | null>(null)
  const [demo, setDemo] = useState<{ stroke: number; key: number } | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [hints, setHints] = useState(0)
  const [failsHere, setFailsHere] = useState(0) // rejected attempts on the current stroke
  const [casting, setCasting] = useState(false)
  const [msg, setMsg] = useState<{ text: string; kind: 'good' | 'bad' | '' }>({ text: '', kind: '' })
  const [score, setScore] = useState(0)
  const [reviews, setReviews] = useState<Review[]>([])
  const [burst, fire] = useBurst()
  const [flashCls, flash] = useFlash()

  const svgRef = useRef<SVGSVGElement | null>(null)
  // Touches on the paper only ever draw: they never scroll or zoom the page.
  // (iOS doesn't reliably honour touch-action on SVG, and a scroll that starts
  // mid-stroke cancels the pointer and loses the stroke.)
  const paperRef = useCallback((el: SVGSVGElement | null) => {
    svgRef.current = el
    if (!el) return
    const hold = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault()
    }
    el.addEventListener('touchstart', hold, { passive: false })
    el.addEventListener('touchmove', hold, { passive: false })
  }, [])
  const drawing = useRef<{ id: number; pts: Pt[] } | null>(null)
  const timers = useRef<number[]>([])
  const charStart = useRef(0)
  const finished = useRef(false)
  const keyRef = useRef(0)

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const info = queue[idx]
  const strokes = useMemo(() => (info ? STROKES[info.char] : []), [info])
  const starts = useMemo(() => strokes.map((d) => parsePath(d)[0]), [strokes])
  const next = done.length

  const playDemo = useCallback((stroke: number) => {
    keyRef.current += 1
    setDemo({ stroke, key: keyRef.current })
  }, [])

  // New character: reset per-character state and demo the first stroke in trace mode.
  useEffect(() => {
    if (!started || !info) return
    charStart.current = performance.now()
    setDone([])
    setMistakes(0)
    setHints(0)
    setFailsHere(0)
    setBad(null)
    setMsg({ text: '', kind: '' })
    if (trace) {
      playDemo(0)
      if (info.kana) void speak(info.say)
    } else setDemo(null)
  }, [started, idx, info, trace, playDemo])

  // Nothing drawable (should not happen with shipped data): finish cleanly.
  useEffect(() => {
    if (started && queue.length === 0 && !finished.current) {
      finished.current = true
      onFinish({ score: 0, maxScore: 0, reviews: [], passed: true, notes: ['The scroll was blank.'] })
    }
  }, [started, queue.length, onFinish])

  const completeChar = (scores: number[]) => {
    const pts = characterPoints(scores, mistakes, hints, HINT_COST[mode], MISTAKE_COST)
    const correct = pts >= 60 && (trace || hints === 0)
    const r = [...reviews, { itemId: info.itemId, correct, ms: Math.round(performance.now() - charStart.current) }]
    const s = score + pts
    setReviews(r)
    setScore(s)
    setCasting(true)
    setDemo(null)
    sfx.cast()
    later(() => sfx.correct(), 150)
    fire(50, 45, 18)
    flash('good')
    void speak(info.say)
    setMsg({ text: pts >= 90 ? 'Flawless spell!' : pts >= 60 ? 'The spell awakens!' : 'The spell flickers weakly…', kind: pts >= 60 ? 'good' : 'bad' })
    later(() => {
      setCasting(false)
      if (idx + 1 >= queue.length) {
        if (finished.current) return
        finished.current = true
        sfx.win()
        onFinish({
          score: s,
          maxScore: queue.length * 100,
          reviews: r,
          notes: [`${queue.length} character${queue.length > 1 ? 's' : ''} inscribed`, `Accuracy ${Math.round((s / (queue.length * 100)) * 100)}%`],
        })
      } else setIdx(idx + 1)
    }, 1500)
  }

  const submitStroke = (raw: Pt[]) => {
    if (!info || casting) return
    if (raw.length < 2 || pathLength(raw) < 2) return // stray tap
    const res = evaluateStroke(raw, strokes, next, { leniency: trace ? 1 : 1.25 })
    if (res.pass) {
      sfx.stroke()
      const scores = [...done, res.score]
      setDone(scores)
      setFailsHere(0)
      setDemo(null)
      setMsg({ text: '', kind: '' })
      if (scores.length >= strokes.length) completeChar(scores)
      else if (trace && failsHere > 0) playDemo(scores.length)
    } else {
      sfx.wrong()
      flash('bad')
      keyRef.current += 1
      setBad({ pts: raw, key: keyRef.current })
      later(() => setBad(null), 700)
      setMistakes((m) => m + 1)
      setFailsHere((f) => f + 1)
      setMsg({ text: `${res.message} (−${MISTAKE_COST})`, kind: 'bad' })
      later(() => playDemo(next), 450)
    }
  }

  // ─── Pointer handling ──────────────────────────────────────────────

  const toBoxPt = (e: { clientX: number; clientY: number }): Pt => {
    const rect = svgRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - rect.left) / rect.width) * BOX, y: ((e.clientY - rect.top) / rect.height) * BOX }
  }

  const onDown = (e: RPointerEvent<SVGSVGElement>) => {
    if (casting || drawing.current || !info) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toBoxPt(e)
    drawing.current = { id: e.pointerId, pts: [p] }
    setCurrent([p])
    setDemo(null)
  }
  const onMove = (e: RPointerEvent<SVGSVGElement>) => {
    const d = drawing.current
    if (!d || d.id !== e.pointerId) return
    const evs = e.nativeEvent.getCoalescedEvents?.() ?? []
    for (const ev of evs.length ? evs : [e.nativeEvent]) d.pts.push(toBoxPt(ev))
    setCurrent([...d.pts])
  }
  const onUp = (e: RPointerEvent<SVGSVGElement>) => {
    const d = drawing.current
    if (!d || d.id !== e.pointerId) return
    drawing.current = null
    setCurrent(null)
    if (e.type !== 'pointercancel') submitStroke(d.pts)
  }

  // ─── Controls ─────────────────────────────────────────────────────

  const hint = () => {
    if (casting || !info || next >= strokes.length) return
    sfx.click()
    setHints((h) => h + 1)
    playDemo(next)
    setMsg({ text: `Stroke ${next + 1} of ${strokes.length} (−${HINT_COST[mode]})`, kind: '' })
  }
  const undo = () => {
    if (casting || !done.length) return
    sfx.click()
    setDone((d) => d.slice(0, -1))
    setFailsHere(0)
    setDemo(null)
  }
  const clear = () => {
    if (casting || !done.length) return
    sfx.click()
    setDone([])
    setFailsHere(0)
    setDemo(null)
  }

  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {})
  keyHandler.current = (e: KeyboardEvent) => {
    if (!started) return
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      undo()
    } else if (e.key.toLowerCase() === 'h' || e.key === '?') hint()
    else if (e.key === 'Backspace') undo()
    else if (e.key === 'Delete') clear()
  }
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyHandler.current(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const right = (
    <>
      <span className="ad-count">
        {Math.min(idx + 1, Math.max(1, queue.length))}/{queue.length}
      </span>
      <span className="ad-score">✦ {score}</span>
    </>
  )

  if (!started) {
    return (
      <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right}>
        <Intro
          title={activity.title}
          jp={activity.jp}
          onStart={() => setStarted(true)}
          lines={
            trace
              ? ['An ancient scroll shows a faded character.', 'Trace each stroke in order, in the right direction.', 'A wrong stroke burns away and costs points. Tap “Show me” to see the next stroke.', 'Complete every stroke to awaken the spell!']
              : ['The scroll is blank: only the sound or meaning is written.', 'Write the character from memory, stroke by stroke, in order.', 'Hints reveal the next stroke but cost points.', 'Complete every stroke to awaken the spell!']
          }
        />
      </GameFrame>
    )
  }

  if (!info) return <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right}>{null}</GameFrame>

  const showGuideFor = (i: number) => trace || (i === next && failsHere >= 2)

  return (
    <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right} className="ad-game">
      <Progress value={idx + (casting ? 1 : 0)} max={queue.length} />
      <div className="ad-prompt">
        {trace ? (
          <>
            <span className="ad-prompt-label">
              <T en="Trace" jp="なぞって" />
            </span>
            <span className="ad-prompt-main" lang="ja">
              {info.char}
            </span>
            <span className="ad-prompt-sub">{info.kana ? info.reading : `${info.reading} · ${info.meaning}`}</span>
          </>
        ) : info.kana ? (
          <>
            <span className="ad-prompt-label">
              <T en={`Write the ${info.meaning} for`} jp={info.meaning === 'hiragana' ? 'ひらがなでかいて' : 'カタカナでかいて'} />
            </span>
            <span className="ad-prompt-main ad-romaji">{info.reading}</span>
          </>
        ) : (
          <>
            <span className="ad-prompt-label">
              <T en="Write the kanji for" jp="かんじでかいて" />
            </span>
            <span className="ad-prompt-main ad-meaning">{info.meaning}</span>
            <span className="ad-prompt-sub" lang="ja">
              {info.reading}
            </span>
          </>
        )}
        <span className="ad-strokes">
          {next}/{strokes.length} <T en="strokes" jp="かく" />
        </span>
      </div>

      <div className={`ad-scroll ${flashCls} ${casting ? 'ad-casting' : ''}`}>
        <div className="ad-rod" aria-hidden />
        <div className="ad-paper">
          <svg
            ref={paperRef}
            className="ad-svg"
            viewBox={`0 0 ${BOX} ${BOX}`}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            role="img"
            aria-label={trace ? `Trace ${info.char}` : `Write ${info.kana ? info.reading : info.meaning}`}
          >
            <g className="ad-grid">
              <line x1={BOX / 2} y1={4} x2={BOX / 2} y2={BOX - 4} />
              <line x1={4} y1={BOX / 2} x2={BOX - 4} y2={BOX / 2} />
            </g>
            {/* Faded guide */}
            <g className="ad-guide">
              {strokes.map((d, i) => (showGuideFor(i) && i >= next ? <path key={i} d={d} className={i === next ? 'ad-guide-next' : ''} /> : null))}
            </g>
            {/* Inked strokes */}
            <g className="ad-ink">
              {strokes.slice(0, next).map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            {/* Stroke-number hints */}
            {trace && !casting && (
              <g className="ad-nums">
                {starts.map((p, i) =>
                  i >= next && p ? (
                    <g key={i} className={i === next ? 'ad-num-next' : ''}>
                      {i === next && <circle cx={p.x} cy={p.y} r={2.6} className="ad-start" />}
                      <text x={Math.max(4, Math.min(BOX - 4, p.x - 5))} y={Math.max(7, Math.min(BOX - 2, p.y - 3))}>
                        {i + 1}
                      </text>
                    </g>
                  ) : null,
                )}
              </g>
            )}
            {/* Demo of the next stroke */}
            {demo && demo.stroke < strokes.length && (
              <g key={demo.key} className="ad-demo">
                <path d={strokes[demo.stroke]} pathLength={1} />
                {starts[demo.stroke] && <circle cx={starts[demo.stroke].x} cy={starts[demo.stroke].y} r={3} />}
              </g>
            )}
            {bad && <polyline key={bad.key} className="ad-bad" points={toPoints(bad.pts)} />}
            {current && <polyline className="ad-current" points={toPoints(current)} />}
          </svg>
          {casting && (
            <div className="ad-spell" aria-hidden>
              <span lang="ja">{info.char}</span>
            </div>
          )}
          {burst}
        </div>
        <div className="ad-rod" aria-hidden />
      </div>

      <div className="ad-helper">
        <span className={`ad-fude ${msg.kind ? `ad-fude-${msg.kind}` : ''}`} key={msg.text} aria-hidden>
          <PixelSprite id="fude" scale={3} animate />
        </span>
        <div className={`feedback ${msg.kind}`} role="status">
          {msg.text}
        </div>
        {!msg.text && (
          <span className="ad-fude-idle">
            <T en={trace ? 'Stroke by stroke, in order!' : 'Can you remember it?'} jp={trace ? '1ばんから じゅんばんに かいてね！' : 'おもいだして かいてね！'} />
          </span>
        )}
      </div>

      <div className="ad-controls">
        <button type="button" className="btn btn-sm" onClick={undo} disabled={casting || !done.length}>
          ↶ <T en="Undo" jp="もどす" />
        </button>
        <button type="button" className="btn btn-sm" onClick={clear} disabled={casting || !done.length}>
          ✕ <T en="Clear" jp="けす" />
        </button>
        <button type="button" className="btn btn-sm btn-primary" onClick={hint} disabled={casting}>
          {trace ? '👁' : '💡'} <T en={trace ? 'Show me' : 'Hint'} jp={trace ? 'みせて' : 'ヒント'} /> <small>−{HINT_COST[mode]}</small>
        </button>
      </div>
    </GameFrame>
  )
}

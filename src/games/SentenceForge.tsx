import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { FORGE_SENTENCES, type ForgeSentence } from '../data/sentences'
import { GameFrame, Intro, Jp, Progress, SpeakButton, T, useAnswerTimer, useBurst, useFlash } from '../components/ui'
import { item } from '../engine/items'
import { shuffle, weightedSample } from '../engine/random'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import { weakness } from '../engine/srs'
import { getState } from '../engine/store'
import type { Review } from '../engine/srs'
import type { GameProps } from './types'
import { checkOrder, isParticle, PARTICLE_ROLE, readingOf, wordIdsIn } from './forge'
import './SentenceForge.css'

const MAX_SENTENCES = 10

const PARTICLE_CLASS: Record<string, string> = { は: 'wa', が: 'ga', を: 'wo', に: 'ni', で: 'de', へ: 'he', と: 'to', の: 'no' }

interface Tile {
  key: string
  text: string
}

type Status = 'building' | 'solved' | 'failed'

function heatSeconds(s: ForgeSentence) {
  return 10 + s.tokens.length * 4
}

function tileClass(text: string) {
  return isParticle(text) ? `fg-tile fg-particle fg-p-${PARTICLE_CLASS[text]}` : 'fg-tile'
}

function TileFace({ text }: { text: string }) {
  return <Jp text={text} reading={readingOf(text)} />
}

export default function SentenceForge({ activity, params, onFinish, onExit }: GameProps<'forge'>) {
  const sentences = useMemo(() => {
    const pool = FORGE_SENTENCES.filter((s) => params.sentenceIds.includes(s.id))
    const srs = getState().srs
    return weightedSample(pool, Math.min(MAX_SENTENCES, pool.length), (s) => weakness(srs[item.sentence(s.id)]))
  }, [params.sentenceIds])

  const [started, setStarted] = useState(false)
  const [idx, setIdx] = useState(0)
  const [tiles, setTiles] = useState<Tile[]>([])
  const [placed, setPlaced] = useState<string[]>([])
  const [tries, setTries] = useState(0)
  const [status, setStatus] = useState<Status>('building')
  const [wrongIdx, setWrongIdx] = useState<number | null>(null)
  const [message, setMessage] = useState<{ kind: 'good' | 'bad'; text: string } | null>(null)
  const [heat, setHeat] = useState(1)
  const [score, setScore] = useState(0)
  const [striking, setStriking] = useState(false)
  const [drag, setDrag] = useState<{ key: string; text: string; x: number; y: number } | null>(null)

  const reviews = useRef<Review[]>([])
  const finished = useRef(false)
  const scoreRef = useRef(0)
  const solvedCount = useRef(0)
  const anvilRef = useRef<HTMLDivElement>(null)
  const timeouts = useRef<number[]>([])
  const [burstNode, burst] = useBurst()
  const [flashCls, flash] = useFlash()
  const elapsed = useAnswerTimer(`${idx}-${started}`)

  const s = sentences[idx] as ForgeSentence | undefined
  const tileByKey = useMemo(() => new Map(tiles.map((t) => [t.key, t])), [tiles])
  const placedTexts = placed.map((k) => tileByKey.get(k)?.text ?? '')

  const later = useCallback((fn: () => void, ms: number) => {
    timeouts.current.push(window.setTimeout(fn, ms))
  }, [])
  useEffect(() => () => timeouts.current.forEach(clearTimeout), [])

  // Set up tiles for sentence i.
  const setup = useCallback(
    (i: number) => {
      const sen = sentences[i]
      if (!sen) return
      const texts = [...sen.tokens, ...(params.distractors ? sen.distractors : [])]
      setIdx(i)
      setTiles(shuffle(texts.map((text, k) => ({ key: `${sen.id}-${k}`, text }))))
      setPlaced([])
      setTries(0)
      setStatus('building')
      setWrongIdx(null)
      setMessage(null)
      setHeat(1)
    },
    [sentences, params.distractors],
  )

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    const n = sentences.length
    onFinish({
      score: scoreRef.current,
      maxScore: n * 2,
      reviews: reviews.current,
      notes: [`${solvedCount.current} of ${n} sentences forged`],
    })
  }, [onFinish, sentences.length])

  const resolve = useCallback(
    (solved: boolean, ms: number) => {
      if (!s) return
      for (const id of wordIdsIn(s.tokens)) reviews.current.push({ itemId: item.word(id), correct: solved, ms })
    },
    [s],
  )

  const failSentence = useCallback(
    (why: string) => {
      if (!s) return
      setStatus('failed')
      setWrongIdx(null)
      setMessage({ kind: 'bad', text: why })
      void speak(s.tokens.join(''))
    },
    [s],
  )

  const strike = useCallback(() => {
    if (!s || status !== 'building' || striking || placed.length === 0) return
    const ms = elapsed()
    const r = checkOrder(placedTexts, s)
    reviews.current.push({ itemId: item.sentence(s.id), correct: r.correct, ms })
    if (r.correct) {
      const pts = tries === 0 ? 2 : 1
      scoreRef.current += pts
      solvedCount.current += 1
      setScore(scoreRef.current)
      resolve(true, ms)
      setStriking(true)
      sfx.hit()
      later(() => sfx.hit(), 260)
      later(() => {
        sfx.correct()
        burst(50, 40, 18)
        setStriking(false)
        setStatus('solved')
        setMessage({ kind: 'good', text: tries === 0 ? 'Flawless forging! +2' : 'Forged on the second strike. +1' })
        void speak(placedTexts.join(''))
      }, 560)
    } else {
      sfx.wrong()
      flash('bad')
      if (tries === 0) {
        setTries(1)
        setWrongIdx(r.wrongIndex)
        setMessage({ kind: 'bad', text: `The metal cracks at tile ${r.wrongIndex + 1}. ${s.hint} One more strike for half credit.` })
      } else {
        resolve(false, ms)
        failSentence(`The blade shatters. ${s.hint}`)
      }
    }
  }, [s, status, striking, placed.length, elapsed, placedTexts, tries, resolve, later, burst, flash, failSentence])

  const next = useCallback(() => {
    if (status === 'building') return
    if (idx + 1 >= sentences.length) {
      sfx.win()
      finish()
    } else {
      setup(idx + 1)
    }
  }, [status, idx, sentences.length, finish, setup])

  // Heat gauge (timed mode): the forge cools; at zero the sentence is lost.
  const heatEnd = useRef<{ id: string; end: number } | null>(null)
  useEffect(() => {
    if (!started || !params.timed || !s || status !== 'building' || striking) return
    const total = heatSeconds(s) * 1000
    if (heatEnd.current?.id !== s.id) heatEnd.current = { id: s.id, end: Date.now() + total }
    const end = heatEnd.current.end
    const id = window.setInterval(() => {
      const left = Math.max(0, end - Date.now())
      setHeat(left / total)
      if (left <= 0) {
        window.clearInterval(id)
        sfx.wrong()
        const ms = elapsed()
        reviews.current.push({ itemId: item.sentence(s.id), correct: false, ms })
        resolve(false, ms)
        failSentence('The forge went cold! The metal hardened before you struck.')
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [started, params.timed, s, status, striking, elapsed, resolve, failSentence])

  const edit = useCallback(
    (fn: (p: string[]) => string[]) => {
      if (status !== 'building' || striking) return
      setPlaced(fn)
      setWrongIdx(null)
      sfx.click()
    },
    [status, striking],
  )

  const toggle = useCallback(
    (key: string) => edit((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key])),
    [edit],
  )

  // Keyboard: 1–9 place tray tiles, Backspace removes last, Enter strikes / continues.
  useEffect(() => {
    if (!started) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'Enter') {
        e.preventDefault()
        if (status === 'building') strike()
        else next()
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        edit((p) => p.slice(0, -1))
      } else if (/^[1-9]$/.test(e.key)) {
        const t = tiles[Number(e.key) - 1]
        if (t && !placed.includes(t.key)) toggle(t.key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, status, strike, next, edit, tiles, placed, toggle])

  // ─── Pointer drag ─────────────────────────────────────
  const dragInfo = useRef<{ key: string; x0: number; y0: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  const onPointerDown = (e: RPointerEvent<HTMLButtonElement>, key: string) => {
    if (status !== 'building' || striking || e.button !== 0) return
    dragInfo.current = { key, x0: e.clientX, y0: e.clientY, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: RPointerEvent<HTMLButtonElement>) => {
    const d = dragInfo.current
    if (!d) return
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 8) return
    d.moved = true
    setDrag({ key: d.key, text: tileByKey.get(d.key)?.text ?? '', x: e.clientX, y: e.clientY })
  }
  const onPointerUp = (e: RPointerEvent<HTMLButtonElement>) => {
    const d = dragInfo.current
    dragInfo.current = null
    setDrag(null)
    if (!d || !d.moved) return
    suppressClick.current = true
    const anvil = anvilRef.current
    if (!anvil) return
    const r = anvil.getBoundingClientRect()
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top - 20 && e.clientY <= r.bottom + 20
    if (!inside) {
      if (placed.includes(d.key)) edit((p) => p.filter((k) => k !== d.key))
      return
    }
    const els = Array.from(anvil.querySelectorAll<HTMLElement>('[data-key]')).filter((el) => el.dataset.key !== d.key)
    let at = els.length
    for (let i = 0; i < els.length; i++) {
      const b = els[i].getBoundingClientRect()
      if (e.clientY < b.top || (e.clientY <= b.bottom && e.clientX < b.left + b.width / 2)) {
        at = i
        break
      }
    }
    edit((p) => {
      const rest = p.filter((k) => k !== d.key)
      return [...rest.slice(0, at), d.key, ...rest.slice(at)]
    })
  }
  const onTileClick = (key: string) => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    toggle(key)
  }
  const dragHandlers = (key: string) => ({
    onPointerDown: (e: RPointerEvent<HTMLButtonElement>) => onPointerDown(e, key),
    onPointerMove,
    onPointerUp,
    onPointerCancel: () => {
      dragInfo.current = null
      setDrag(null)
    },
    onClick: () => onTileClick(key),
  })

  const right = (
    <span className="fg-score" aria-label="score">
      ⚒️ {score}
    </span>
  )

  if (!started || !s) {
    return (
      <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right}>
        <Intro
          title="Sentence Forge"
          jp="ぶんのかじ"
          lines={[
            'Read the English, then place word-tiles on the anvil in Japanese order (tap or drag; tap a placed tile to return it).',
            'Particles glow in their own colours — は topic, を object, に destination…',
            'Strike! to forge. A crack shows the first wrong tile; one retry earns half credit.',
            ...(params.distractors ? ['Decoy tiles are mixed in — not every tile belongs.'] : []),
            ...(params.timed ? ['The forge cools! Strike before the heat gauge runs out.'] : []),
          ]}
          onStart={() => {
            setup(0)
            setStarted(true)
          }}
        />
      </GameFrame>
    )
  }

  const presentParticles = Array.from(new Set(tiles.map((t) => t.text).filter(isParticle)))
  const done = status !== 'building'
  const heatPct = Math.round(heat * 100)

  return (
    <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right} className="fg">
      <Progress value={idx + (done ? 1 : 0)} max={sentences.length} />

      <div className="card fg-prompt">
        <div className="prompt-label">
          <T en={`Forge this sentence (${idx + 1}/${sentences.length})`} jp={`このぶんをきたえよ（${idx + 1}/${sentences.length}）`} />
        </div>
        <div className="fg-en">{s.en}</div>
        {params.timed && (
          <div className="fg-heat" aria-label={`Forge heat ${heatPct}%`}>
            <span className="fg-heat-ico">{heat > 0.5 ? '🔥' : heat > 0.2 ? '♨️' : '🧊'}</span>
            <div className="fg-heat-track">
              <div className="fg-heat-fill" style={{ width: `${heatPct}%`, background: `hsl(${Math.round(heat * 30)}, 95%, ${45 + (1 - heat) * 20}%)` }} />
            </div>
          </div>
        )}
      </div>

      <div className={`fg-forge ${flashCls}`}>
        {burstNode}
        <div className={`fg-hammer ${striking ? 'swing' : ''}`} aria-hidden>
          🔨
        </div>
        <div ref={anvilRef} className={`fg-anvil ${striking ? 'striking' : ''} ${status === 'solved' ? 'solved' : ''} ${status === 'failed' ? 'failed' : ''}`} aria-label="Anvil">
          {status === 'failed' ? (
            <div className="fg-answer">
              <div className="fg-answer-label">
                <T en="The true form:" jp="ただしいかたち：" />
              </div>
              <div className="fg-row">
                {s.tokens.map((t, i) => (
                  <span key={i} className={tileClass(t)}>
                    <TileFace text={t} />
                  </span>
                ))}
                <SpeakButton text={s.tokens.join('')} />
              </div>
            </div>
          ) : status === 'solved' ? (
            <div className="fg-spell pop">
              <div className="fg-spell-text glow-text" lang="ja">
                {placedTexts.map((t, i) => (
                  <span key={i} className={isParticle(t) ? `fg-glow-p fg-p-${PARTICLE_CLASS[t]}` : ''}>
                    <TileFace text={t} />
                  </span>
                ))}
              </div>
              <div className="row fg-spell-en">
                <span className="muted">{s.en}</span>
                <SpeakButton text={placedTexts.join('')} />
              </div>
            </div>
          ) : (
            <div className="fg-row">
              {placed.length === 0 && (
                <span className="fg-empty muted">
                  <T en="Place tiles here" jp="ここにタイルを" />
                </span>
              )}
              {placed.map((k, i) => {
                const t = tileByKey.get(k)
                if (!t) return null
                return (
                  <button
                    key={k}
                    type="button"
                    data-key={k}
                    className={`${tileClass(t.text)} ${wrongIdx === i ? 'fg-wrong' : ''} ${drag?.key === k ? 'fg-dragging' : ''}`}
                    aria-label={`Placed ${t.text}, tap to remove`}
                    {...dragHandlers(k)}
                  >
                    <TileFace text={t.text} />
                  </button>
                )
              })}
              {wrongIdx !== null && wrongIdx >= placed.length && <span className="fg-tile fg-missing fg-wrong">?</span>}
            </div>
          )}
        </div>
      </div>

      <div className={`feedback ${message?.kind ?? ''}`} role="status">
        {message?.text}
      </div>

      {!done && (
        <>
          <div className="fg-tray" aria-label="Tiles">
            {tiles.map((t, i) => {
              const used = placed.includes(t.key)
              return (
                <button
                  key={t.key}
                  type="button"
                  disabled={used}
                  className={`${tileClass(t.text)} ${used ? 'fg-used' : ''} ${drag?.key === t.key ? 'fg-dragging' : ''}`}
                  aria-label={`Tile ${i + 1}: ${t.text}`}
                  {...dragHandlers(t.key)}
                >
                  <TileFace text={t.text} />
                  {i < 9 && <span className="fg-key">{i + 1}</span>}
                </button>
              )
            })}
          </div>
          {presentParticles.length > 0 && (
            <div className="fg-legend">
              {presentParticles.map((p) => (
                <span key={p} className={`fg-legend-item fg-p-${PARTICLE_CLASS[p]}`}>
                  <b lang="ja">{p}</b> {PARTICLE_ROLE[p]}
                </span>
              ))}
            </div>
          )}
          <div className="row fg-actions">
            <button type="button" className="btn" onClick={() => edit(() => [])} disabled={placed.length === 0 || striking}>
              <T en="Clear" jp="けす" />
            </button>
            <button type="button" className="btn btn-primary btn-lg" onClick={strike} disabled={placed.length === 0 || striking}>
              🔨 <T en="Strike!" jp="うて！" />
            </button>
          </div>
        </>
      )}

      {done && (
        <div className="row fg-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={next} autoFocus>
            {idx + 1 >= sentences.length ? <T en="Finish" jp="おわり" /> : <T en="Next sentence" jp="つぎへ" />}
          </button>
        </div>
      )}

      {drag && (
        <div className={`${tileClass(drag.text)} fg-ghost`} style={{ left: drag.x, top: drag.y }} aria-hidden>
          <TileFace text={drag.text} />
        </div>
      )}
    </GameFrame>
  )
}

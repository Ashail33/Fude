/**
 * Palace Walk: the method of loci, played. Walk one room of the memory
 * palace place by place, in route order. At each place you see its image
 * with the answer hidden, pick what lives there, then see the whole image
 * again. Walking the same route every time is what makes it stick.
 */
import { useEffect, useMemo, useState } from 'react'
import { GameFrame, Intro, T } from '../components/ui'
import { HdImage } from '../art/hd'
import { REGIONS } from '../data/regions'
import { MAP_IDS } from '../story/scenes'
import { cueOf, episodeCue, recallQuestion, roomOf, storyOf, walkMemories, type RecallQ } from '../engine/palace'
import { ensureStories } from '../engine/palaceAI'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import type { Review } from '../engine/srs'
import { getState, usePlayer } from '../engine/store'
import type { GameProps } from './types'
import './PalaceWalk.css'

interface Stop {
  emoji: string
  name: { jp: string; en: string }
  personal?: boolean
  questions: RecallQ[]
}

export default function PalaceWalk({ activity, params, onFinish, onExit }: GameProps<'palace'>) {
  const p = usePlayer()
  // the route is fixed when the walk starts
  const stops = useMemo<Stop[]>(
    () =>
      walkMemories(getState(), params.room).map(({ locus, memories }) => ({
        emoji: locus.emoji,
        name: locus.name,
        personal: locus.personal,
        questions: memories.map((m) => recallQuestion(getState(), m)).filter((q): q is RecallQ => !!q),
      })),
    [params.room],
  )
  const total = stops.reduce((n, s) => n + s.questions.length, 0)
  const room = REGIONS[params.room - 1]
  const [started, setStarted] = useState(false)
  const [si, setSi] = useState(0)
  const [qi, setQi] = useState(-1) // -1: arriving at the place
  const [picked, setPicked] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])

  // while the intro is read, Claude can write stories for the player's own places
  useEffect(() => {
    void ensureStories(roomOf(getState(), params.room), 6)
  }, [params.room])

  useEffect(() => {
    if (!total) onFinish({ score: 0, maxScore: 0, reviews: [], passed: true, notes: ['Nothing is placed in this room yet. Learn some words here first, and they’ll appear in the palace.'] })
  }, [total, onFinish])

  const stop = stops[si]
  const q = stop && qi >= 0 ? stop.questions[qi] : undefined
  const score = reviews.filter((r) => r.correct).length

  const advance = () => {
    setPicked(null)
    if (qi + 1 < stop.questions.length) return setQi(qi + 1)
    if (si + 1 < stops.length) {
      setSi(si + 1)
      setQi(-1)
      return
    }
    onFinish({ score, maxScore: total, reviews })
  }

  const answer = (id: string) => {
    if (!q || picked) return
    const ok = id === q.answer.id
    setPicked(id)
    setReviews((r) => [...r, { itemId: q.answer.id, correct: ok }])
    if (ok) sfx.correct()
    else sfx.wrong()
    void speak(q.answer.kind === 'kana' || !q.answer.reading ? q.answer.front : q.answer.reading)
  }

  useEffect(() => {
    if (!started) return
    const onKey = (e: KeyboardEvent) => {
      if (qi < 0 || picked) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'z') {
          e.preventDefault()
          if (qi < 0) setQi(0)
          else advance()
        }
        return
      }
      const n = Number(e.key)
      if (q && n >= 1 && n <= q.options.length) answer(q.options[n - 1].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!total) return null

  if (!started)
    return (
      <GameFrame title={activity.title} jp={activity.jp} onExit={onExit}>
        <Intro
          title={activity.title}
          jp={activity.jp}
          onStart={() => setStarted(true)}
          lines={[
            `Walk ${room?.name ?? 'this room'} along its route: ${stops.length} places, ${total} memories.`,
            'At each place, picture it first. Then read the scene and pick what lives there.',
            'Walk the same route often: the places themselves will start reminding you.',
          ]}
        />
      </GameFrame>
    )

  const route = (
    <ol className="pw-route" aria-label="Route">
      {stops.map((s, n) => (
        <li key={n} className={n < si ? 'past' : n === si ? 'here' : ''} title={s.name.en}>
          {s.emoji}
        </li>
      ))}
    </ol>
  )

  return (
    <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={<span className="chip">🏯 {score}/{total}</span>}>
      {route}
      {qi < 0 ? (
        <button type="button" className="card pw-arrive pop" key={`a${si}`} onClick={() => setQi(0)}>
          <HdImage id={`arrive-${MAP_IDS[params.room - 1]}`} className="pw-arrive-art" />
          <span className="pw-arrive-emoji" aria-hidden>
            {stop.emoji}
          </span>
          <span className="bi pw-arrive-name">
            <span lang="ja">{stop.name.jp}</span>
            <small>{stop.name.en}</small>
          </span>
          <span className="muted small">
            <T en={`Picture this place… ${stop.questions.length} ${stop.questions.length === 1 ? 'memory lives' : 'memories live'} here.`} jp={`この ばしょを おもいうかべて… きおくが ${stop.questions.length}こ。`} />
          </span>
          <span className="btn btn-primary">
            <T en="Look closer ▶" jp="よく みる ▶" />
          </span>
        </button>
      ) : (
        q && (
          <div className="card pw-card" key={`${si}-${qi}`}>
            <div className="pw-place">
              {stop.emoji} <span lang="ja">{stop.name.jp}</span> · {stop.name.en}
              {stop.personal && <span className="pw-own"> ✨</span>}
            </div>
            {episodeCue(p, q.memory.item) && <p className="pw-episode">📍 {episodeCue(p, q.memory.item)}</p>}
            <p className="pw-cue">{picked ? storyOf(p, q.memory) : cueOf(p, q.memory)}</p>
            {picked && (
              <div className={`pw-answer pop ${picked === q.answer.id ? 'good' : 'bad'}`}>
                <span className="pw-answer-front" lang="ja">
                  {q.answer.front}
                </span>
                <span>
                  {q.answer.kind === 'kana' ? (
                    `“${q.answer.reading}”`
                  ) : (
                    <>
                      {q.answer.reading && q.answer.reading !== q.answer.front && <span lang="ja">{q.answer.reading} · </span>}
                      {q.answer.meaning}
                    </>
                  )}
                </span>
              </div>
            )}
            <div className="choices">
              {q.options.map((o, n) => {
                const state = picked ? (o.id === q.answer.id ? 'correct' : o.id === picked ? 'wrong' : '') : ''
                return (
                  <button type="button" key={o.id} className={`choice choice-jp ${state}`} disabled={!!picked} onClick={() => answer(o.id)}>
                    <span className="choice-key">{n + 1}</span>
                    <span lang="ja">{o.front}</span>
                    {o.kind !== 'kana' && o.reading && o.reading !== o.front && p.settings.showRomaji !== false && <small className="pw-opt-reading">{o.reading}</small>}
                  </button>
                )
              })}
            </div>
            {picked && (
              <button type="button" className="btn btn-primary pw-next" onClick={advance} autoFocus>
                <T en="Walk on ▶" jp="つぎへ ▶" />
              </button>
            )}
          </div>
        )
      )}
    </GameFrame>
  )
}

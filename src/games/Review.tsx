import { useEffect, useMemo, useState } from 'react'
import { GameFrame, Intro, Jp, Progress, T, useAnswerTimer, useBurst, useFlash } from '../components/ui'
import { describeItem, type ItemInfo } from '../engine/items'
import { distractors, shuffle } from '../engine/random'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import type { Review as SrsReview } from '../engine/srs'
import { usePlayer } from '../engine/store'
import type { GameProps } from './types'
import './Lesson.css'

interface Question {
  info: ItemInfo
  /** true: show Japanese, choose meaning. false: show meaning, choose Japanese. */
  forward: boolean
  options: ItemInfo[]
}

export function buildQuestions(itemIds: string[]): Question[] {
  const infos = itemIds.map(describeItem).filter((x): x is ItemInfo => !!x)
  return infos.map((info, i) => {
    const same = infos.filter((x) => x.kind === info.kind)
    // Fall back to any described items of the same kind if the due set is small.
    const pool = same.length >= 4 ? same : [...same, ...infos]
    const opts = shuffle([info, ...distractors(pool, info, 3, (x) => x.meaning)])
    const forward = info.kind !== 'word' || i % 2 === 0
    return { info, forward, options: opts }
  })
}

export default function Review({ activity, params, onFinish, onExit }: GameProps<'review'>) {
  const p = usePlayer()
  const questions = useMemo(() => buildQuestions(params.itemIds), [params.itemIds])
  const [started, setStarted] = useState(false)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [reviews, setReviews] = useState<SrsReview[]>([])
  const [score, setScore] = useState(0)
  const [burst, fire] = useBurst()
  const [flashCls, flash] = useFlash()
  const elapsed = useAnswerTimer(i)
  const q = questions[i]
  const heroic = q ? p.heroic[q.info.id] : undefined

  useEffect(() => {
    if (!questions.length) onFinish({ score: 0, maxScore: 0, reviews: [], passed: true, notes: ['Nothing to review. Your grimoire is strong!'] })
  }, [questions.length, onFinish])

  useEffect(() => {
    // Emotional anchoring: replay the echo of the victory this word won.
    if (started && heroic) sfx.cast()
  }, [started, i, heroic])

  const answer = (opt: ItemInfo) => {
    if (picked) return
    const correct = opt.id === q.info.id
    setPicked(opt.id)
    const r = [...reviews, { itemId: q.info.id, correct, ms: elapsed() }]
    const s = score + (correct ? 1 : 0)
    setReviews(r)
    setScore(s)
    if (correct) {
      sfx.correct()
      fire(50, 30)
      flash('good')
      if (q.info.kind !== 'particle') void speak(q.info.reading && q.info.kind !== 'kana' ? q.info.reading : q.info.front)
    } else {
      sfx.wrong()
      flash('bad')
    }
    setTimeout(
      () => {
        setPicked(null)
        if (i + 1 >= questions.length) onFinish({ score: s, maxScore: questions.length, reviews: r })
        else setI(i + 1)
      },
      correct ? 700 : 1800,
    )
  }

  useEffect(() => {
    if (!started || !q) return
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= q.options.length) answer(q.options[n - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!q) return null

  if (!started)
    return (
      <GameFrame title={activity.title} jp={activity.jp} onExit={onExit}>
        <Intro
          title={activity.title}
          jp={activity.jp}
          onStart={() => setStarted(true)}
          lines={[`${questions.length} entries in your grimoire are fading.`, 'Recall each one to re-ink it before it vanishes.', 'Fast, confident answers keep words strong for longer.']}
        />
      </GameFrame>
    )

  return (
    <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={<span className="chip">✦ {score}</span>}>
      <Progress value={i} max={questions.length} />
      <div className={`card lesson-card ${flashCls}`} key={i}>
        {burst}
        {heroic && (
          <div className="review-echo pop">
            ⚔️ <T en={`Echo: you wielded this against ${heroic.title}`} jp={`こだま：${heroic.title}とのたたかい`} />
          </div>
        )}
        <div className="prompt">
          <div className="prompt-label">{q.forward ? <T en="What does this mean?" jp="いみは？" /> : <T en="Which is it?" jp="どれ？" />}</div>
          {q.forward ? (
            <Jp text={q.info.front} reading={q.info.kind === 'kana' ? undefined : q.info.reading} big={q.info.front.length <= 6} hideHelp={q.info.kind === 'kana'} />
          ) : (
            <div className="lesson-en-prompt">
              {q.info.emoji && <span className="lesson-emoji-sm">{q.info.emoji}</span>} {q.info.meaning}
            </div>
          )}
        </div>
        <div className="choices">
          {q.options.map((o, n) => {
            const state = picked ? (o.id === q.info.id ? 'correct' : o.id === picked ? 'wrong' : '') : ''
            return (
              <button type="button" key={o.id} className={`choice ${state} ${q.forward ? '' : 'choice-jp'}`} disabled={!!picked} onClick={() => answer(o)}>
                <span className="choice-key">{n + 1}</span>
                {q.forward ? o.meaning : o.front}
              </button>
            )
          })}
        </div>
      </div>
    </GameFrame>
  )
}

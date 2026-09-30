import { useEffect, useMemo, useState } from 'react'
import { GameFrame, Intro, Jp, Progress, SpeakButton, T, useAnswerTimer, useBurst, useFlash } from '../components/ui'
import { getWord, VOCAB, type Word } from '../data/vocab'
import { item } from '../engine/items'
import { distractors, shuffle } from '../engine/random'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import type { Review } from '../engine/srs'
import { usePlayer } from '../engine/store'
import type { GameProps } from './types'
import { PixelSprite } from '../art'
import { Portrait } from './pixel'
import './Lesson.css'

type Step = { kind: 'meet'; word: Word } | { kind: 'quiz'; word: Word; dir: 'jp-en' | 'en-jp'; options: Word[] }

const CHUNK = 5

/** Build the lesson: meet words in chunks of five, each chunk followed by a quiz. */
export function buildSteps(words: Word[]): Step[] {
  const steps: Step[] = []
  for (let i = 0; i < words.length; i += CHUNK) {
    const chunk = words.slice(i, i + CHUNK)
    chunk.forEach((word) => steps.push({ kind: 'meet', word }))
    shuffle(chunk).forEach((word, j) => {
      const dir = j % 2 === 0 ? 'jp-en' : 'en-jp'
      // Distractors from the same part of speech where possible.
      const pool = VOCAB.filter((w) => w.pos === word.pos && w.region <= Math.max(word.region, 2))
      const options = shuffle([word, ...distractors(pool.length >= 4 ? pool : VOCAB, word, 3, (w) => w.en)])
      steps.push({ kind: 'quiz', word, dir, options })
    })
  }
  return steps
}

export default function Lesson({ activity, params, onFinish, onExit }: GameProps<'lesson'>) {
  const p = usePlayer()
  const words = useMemo(() => params.wordIds.map(getWord), [params.wordIds])
  const steps = useMemo(() => buildSteps(words), [words])
  const [started, setStarted] = useState(false)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [score, setScore] = useState(0)
  const [burst, fire] = useBurst()
  const [flashCls, flash] = useFlash()
  const step = steps[i]
  const elapsed = useAnswerTimer(i)
  const quizCount = steps.filter((s) => s.kind === 'quiz').length

  useEffect(() => {
    if (started && step?.kind === 'meet') void speak(step.word.kana)
  }, [started, step])

  const next = (newReviews = reviews, newScore = score) => {
    setPicked(null)
    if (i + 1 >= steps.length) {
      onFinish({ score: newScore, maxScore: quizCount, reviews: newReviews })
    } else setI(i + 1)
  }

  const answer = (w: Word) => {
    if (picked || step.kind !== 'quiz') return
    const correct = w.id === step.word.id
    setPicked(w.id)
    const r = [...reviews, { itemId: item.word(step.word.id), correct, ms: elapsed() }]
    setReviews(r)
    const s = score + (correct ? 1 : 0)
    setScore(s)
    if (correct) {
      sfx.correct()
      fire(50, 30)
      flash('good')
      void speak(step.word.kana)
    } else {
      sfx.wrong()
      flash('bad')
    }
    setTimeout(() => next(r, s), correct ? 700 : 1600)
  }

  useEffect(() => {
    if (!started || !step) return
    const onKey = (e: KeyboardEvent) => {
      if (step.kind === 'meet' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        next()
      }
      if (step.kind === 'quiz') {
        const n = Number(e.key)
        if (n >= 1 && n <= step.options.length) answer(step.options[n - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!started)
    return (
      <GameFrame title={activity.title} jp={activity.jp} onExit={onExit}>
        <Intro
          title={activity.title}
          jp={activity.jp}
          onStart={() => setStarted(true)}
          lines={[
            `You will meet ${words.length} new words of power, ${CHUNK} at a time.`,
            'Listen to each one, then prove you remember it in a short trial.',
            'Words you struggle with will return more often in future adventures.',
          ]}
        >
          <div className="lesson-teacher">
            <Portrait id={activity.region <= 2 ? 'elder' : 'fude'} scale={4} ground={activity.region <= 2 ? 'grass' : 'tatami'} />
            <p className="lesson-teacher-say">
              <T en="Here are today's words of power." jp="きょうの ことばは これだよ。" />
            </p>
          </div>
          <div className="lesson-preview">
            {words.map((w) => (
              <span key={w.id} title={w.en}>
                {w.emoji}
              </span>
            ))}
          </div>
        </Intro>
      </GameFrame>
    )

  return (
    <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={<span className="chip">✦ {score}</span>}>
      <Progress value={i} max={steps.length} />
      <div className={`card lesson-card ${flashCls}`} key={i}>
        {burst}
        {step.kind === 'meet' ? (
          <div className="lesson-meet pop">
            <div className="lesson-stage">
              <span className="lesson-presenter" aria-hidden>
                <span className="lesson-say" lang="ja">
                  みて！
                </span>
                <PixelSprite id={activity.region <= 2 ? 'elder' : 'fude'} scale={4} dir="right" animate />
              </span>
              <div className="lesson-emoji float">{step.word.emoji}</div>
            </div>
            <Jp text={step.word.jp} reading={step.word.kana} big />
            <div className="lesson-en">{step.word.en}</div>
            {step.word.masu && (
              <div className="muted">
                <T en="polite form" jp="ていねいけい" />: <span lang="ja">{step.word.masu}</span>
              </div>
            )}
            {step.word.alt && <div className="muted small">also: {step.word.alt.join(', ')}</div>}
            <div className="row lesson-actions">
              <SpeakButton text={step.word.kana} />
              <button type="button" className="btn btn-primary" onClick={() => next()}>
                <T en="Got it" jp="わかった" /> →
              </button>
            </div>
          </div>
        ) : (
          <div className="lesson-quiz">
            <div className="prompt">
              <div className="prompt-label">
                {step.dir === 'jp-en' ? <T en="What does this mean?" jp="いみは？" /> : <T en="Which word is this?" jp="どのことば？" />}
              </div>
              {step.dir === 'jp-en' ? (
                <Jp text={step.word.jp} reading={p.settings.showRomaji ? step.word.kana : undefined} big />
              ) : (
                <div className="lesson-en-prompt">
                  <span className="lesson-emoji-sm">{step.word.emoji}</span> {step.word.en}
                </div>
              )}
            </div>
            <div className="choices">
              {step.options.map((w, n) => {
                const state = picked ? (w.id === step.word.id ? 'correct' : w.id === picked ? 'wrong' : '') : ''
                return (
                  <button type="button" key={w.id} className={`choice ${state} ${step.dir === 'en-jp' ? 'choice-jp' : ''}`} disabled={!!picked} onClick={() => answer(w)}>
                    <span className="choice-key">{n + 1}</span>
                    {step.dir === 'jp-en' ? w.en : w.jp}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </GameFrame>
  )
}

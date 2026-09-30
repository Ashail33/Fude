import { useEffect, useMemo, useRef, useState } from 'react'
import { VOCAB, WORD_BY_ID, type Word } from '../data/vocab'
import { item } from '../engine/items'
import { distractors, shuffle } from '../engine/random'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import { strength } from '../engine/srs'
import { recordReviews, setState, usePlayer } from '../engine/store'
import { T } from './ui'

const RECALL_SECONDS = 5

/**
 * "Ghost Recall": words the player hasn't practised lately start to fade
 * from the world. A 5-second recall re-stabilises them.
 */
export function GhostRecall() {
  const p = usePlayer()
  const [active, setActive] = useState<Word | null>(null)

  const fading = useMemo(() => {
    const now = Date.now()
    return Object.values(p.srs)
      .filter((c) => c.id.startsWith('w:') && c.seen > 0)
      .map((c) => ({ w: WORD_BY_ID.get(c.id.slice(2)), s: strength(c, now) }))
      .filter((x): x is { w: Word; s: number } => !!x.w && x.s < 0.5)
      .sort((a, b) => a.s - b.s)
      .slice(0, 4)
  }, [p.srs])

  if (!fading.length) return null

  return (
    <section className="ghosts card">
      <div className="ghosts-head">
        <strong>
          👻 <T en="Fading from the world" jp="きえかけているもの" />
        </strong>
        <span className="muted small">
          <T en="Tap to re-stabilise before they vanish" jp="タップしてもどそう" />
        </span>
      </div>
      <div className="ghosts-list">
        {fading.map(({ w, s }) => (
          <button key={w.id} type="button" className="ghost-item" style={{ ['--fade' as string]: String(0.25 + s) }} onClick={() => setActive(w)}>
            <span className="ghost ghost-emoji">{w.emoji}</span>
            <span className="ghost-jp" lang="ja">
              {w.jp}
            </span>
          </button>
        ))}
      </div>
      {active && <RecallModal word={active} onClose={() => setActive(null)} />}
    </section>
  )
}

function RecallModal({ word, onClose }: { word: Word; onClose: () => void }) {
  const options = useMemo(() => shuffle([word, ...distractors(VOCAB, word, 3, (w) => w.en)]), [word])
  const [left, setLeft] = useState(RECALL_SECONDS)
  const [picked, setPicked] = useState<string | null>(null)
  const start = useRef(performance.now())

  const resolve = (w: Word | null) => {
    if (picked) return
    const correct = w?.id === word.id
    setPicked(w?.id ?? 'timeout')
    recordReviews([{ itemId: item.word(word.id), correct, ms: Math.round(performance.now() - start.current) }])
    if (correct) {
      sfx.correct()
      void speak(word.kana)
      setState((s) => ({ ...s, xp: s.xp + 5 }))
    } else sfx.wrong()
    setTimeout(onClose, correct ? 900 : 1800)
  }

  useEffect(() => {
    if (picked) return
    const id = setInterval(() => {
      const l = RECALL_SECONDS - Math.floor((performance.now() - start.current) / 1000)
      setLeft(l)
      if (l <= 0) {
        clearInterval(id)
        resolve(null)
      }
    }, 200)
    return () => clearInterval(id)
  })

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card pop" role="dialog" aria-label="Recall" onClick={(e) => e.stopPropagation()}>
        <div className="recall-timer">
          <span style={{ width: `${(left / RECALL_SECONDS) * 100}%` }} />
        </div>
        <div className={`recall-word ${picked ? '' : 'ghost'}`} lang="ja">
          {word.jp}
        </div>
        <p className="muted center">
          <T en="Quick! What does it mean?" jp="はやく！いみは？" />
        </p>
        <div className="choices">
          {options.map((o) => (
            <button
              type="button"
              key={o.id}
              className={`choice ${picked ? (o.id === word.id ? 'correct' : o.id === picked ? 'wrong' : '') : ''}`}
              disabled={!!picked}
              onClick={() => resolve(o)}
            >
              {o.emoji} {o.en}
            </button>
          ))}
        </div>
        {picked && (
          <p className={`feedback ${picked === word.id ? 'good' : 'bad'}`}>
            {picked === word.id ? (
              <T en="Stabilised! +5 XP" jp="もどった！" />
            ) : (
              <>
                {word.jp} ({word.kana}) = {word.en}
              </>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Dragon-Quest-style message window for the overworld: typewriter lines,
 * activity challenge cards (Yes/No), word-lock kana input and quick recall.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toHiragana } from 'wanakana'
import type { SpriteId } from '../art'
import { preloadHd, SPRITE_TO_HD, useHdLoaded } from '../art/hd'
import { CommandMenu } from '../components/CommandMenu'
import { KanaInput } from '../components/ui'
import { activitiesFor, bossOf, REGIONS, STAGE_LABEL } from '../data/regions'
import { VOCAB, WORD_BY_ID } from '../data/vocab'
import { item } from '../engine/items'
import { distractors, shuffle } from '../engine/random'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import { activityUnlocked, immersionOf, recordReviews, regionUnlocked, usePlayer } from '../engine/store'
import type { Activity } from '../games/types'
import { VnBusts, type Bust } from '../ui/Hd'
import { uiSound } from '../ui/sound'
import { Sprite } from './Sprite'
import type { Line } from './types'

export type Step =
  | { kind: 'say'; speaker?: Line; portrait?: SpriteId; line: Line; voice?: boolean }
  | { kind: 'activity'; activity: Activity; speaker?: Line; portrait?: SpriteId }
  | { kind: 'choice'; prompt: Line; options: { id: string; label: Line }[]; onPick: (id: string) => Step[] | void }
  | { kind: 'kana'; prompt: Line; answer: string; onResult: (ok: boolean) => Step[] | void }
  | { kind: 'recall'; wordId: string; onResult: (ok: boolean) => Step[] | void }

/** Bilingual line following the immersion level (0: EN below, 1: small EN, 2: EN on tap, 3: JP only). */
export function Bi({ line, className }: { line: Line; className?: string }) {
  const p = usePlayer()
  const lvl = immersionOf(p)
  const [show, setShow] = useState(false)
  return (
    <span className={`bi-line ${className ?? ''}`} onClick={lvl === 2 ? () => setShow((s) => !s) : undefined} title={lvl === 2 ? line.en : undefined}>
      <span lang="ja" className="bi-jp">
        {line.jp}
      </span>
      {(lvl <= 1 || (lvl === 2 && show)) && line.en && <span className={`bi-en ${lvl >= 1 ? 'small' : ''}`}>{line.en}</span>}
    </span>
  )
}

function Typewriter({ text, onDone, skip }: { text: string; onDone: () => void; skip: number }) {
  const [n, setN] = useState(0)
  const done = useRef(false)
  const chars = useMemo(() => [...text], [text])
  useEffect(() => {
    if (n >= chars.length) {
      if (!done.current) {
        done.current = true
        onDone()
      }
      return
    }
    const id = setTimeout(() => {
      setN((v) => v + 1)
      if (n % 2 === 0 && chars[n] !== ' ') uiSound.blip(0)
    }, 34)
    return () => clearTimeout(id)
  }, [n, chars, onDone])
  useEffect(() => {
    if (skip > 0) setN(chars.length)
  }, [skip, chars.length])
  return (
    <span lang="ja" className="bi-jp">
      {chars.slice(0, n).join('')}
      <span className="tw-ghost">{chars.slice(n).join('')}</span>
    </span>
  )
}

function SayStep({ step, onNext, bust }: { step: Extract<Step, { kind: 'say' }>; onNext: () => void; bust?: string }) {
  const bustShown = useHdLoaded(bust)
  const p = usePlayer()
  const lvl = immersionOf(p)
  const [typed, setTyped] = useState(false)
  const [skip, setSkip] = useState(0)
  const [showEn, setShowEn] = useState(false)
  const typedRef = useRef(false)
  typedRef.current = typed
  useEffect(() => {
    if (step.voice !== false) void speak(step.line.jp)
  }, [step])
  const advance = () => {
    if (!typedRef.current) {
      setSkip((s) => s + 1)
      return
    }
    uiSound.confirm()
    onNext()
  }
  const adv = useRef(advance)
  adv.current = advance
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['z', 'Z', 'Enter', ' ', 'x', 'X', 'Escape', 'Backspace'].includes(e.key)) {
        if (e.repeat) return
        e.preventDefault()
        e.stopImmediatePropagation()
        adv.current()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  return (
    <div className="dq-msg" onClick={() => adv.current()}>
      {step.portrait && !bustShown && (
        <div className="dq-portrait">
          <Sprite id={step.portrait} scale={3} animate />
        </div>
      )}
      <div className="dq-text">
        <Typewriter text={step.line.jp} onDone={() => setTyped(true)} skip={skip} />
        {typed && (lvl <= 1 || (lvl === 2 && showEn)) && step.line.en && <span className={`bi-en ${lvl >= 1 ? 'small' : ''}`}>{step.line.en}</span>}
        {typed && lvl === 2 && !showEn && step.line.en && (
          <button
            type="button"
            className="dq-en-toggle"
            onClick={(e) => {
              e.stopPropagation()
              setShowEn(true)
            }}
          >
            EN
          </button>
        )}
      </div>
      {typed && <span className="dq-more">▼</span>}
    </div>
  )
}

function StarRow({ n }: { n: number }) {
  return (
    <span className="dq-stars" aria-label={`${n} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <Sprite key={i} id={i < n ? 'star' : 'star-empty'} scale={2} />
      ))}
    </span>
  )
}

function lockReason(a: Activity, p: ReturnType<typeof usePlayer>): Line | null {
  if (activityUnlocked(p, a)) return null
  if (!regionUnlocked(p, a.region)) {
    const boss = bossOf(a.region - 1)
    return { jp: `まず『${boss.jp}』を たおそう。`, en: `Defeat ${boss.title} first.` }
  }
  const list = activitiesFor(a.region)
  const prev = list[list.findIndex((x) => x.id === a.id) - 1]
  return { jp: `まず『${prev.jp}』を クリアしよう。`, en: `Complete “${prev.title}” first.` }
}

function ActivityStep({ step, onStart, onNext }: { step: Extract<Step, { kind: 'activity' }>; onStart: (a: Activity) => void; onNext: () => void }) {
  const p = usePlayer()
  const a = step.activity
  const stars = p.progress[a.id]?.stars ?? 0
  const lock = lockReason(a, p)
  const region = REGIONS.find((r) => r.id === a.region)
  const stage = STAGE_LABEL[a.stage]
  useEffect(() => {
    if (lock) sfx.wrong()
  }, [lock])
  return (
    <div className="dq-activity">
      <div className="dq-card">
        <div className="dq-card-head">
          <span className={`dq-stage stage-${a.stage}`}>
            <Bi line={{ jp: stage.jp, en: stage.en }} />
          </span>
          <StarRow n={stars} />
        </div>
        <div className="dq-card-title">
          <span lang="ja">{a.jp}</span>
          <small>{a.title}</small>
        </div>
        <p className="dq-card-desc">{a.description}</p>
        {region && <div className="dq-card-region">{region.jp} · {region.name}</div>}
      </div>
      {lock ? (
        <div className="dq-choice">
          <div className="dq-lock">
            <Sprite id="lock" scale={2} />
            <Bi line={lock} />
          </div>
          <CommandMenu items={[{ id: 'close', label: <Bi line={{ jp: 'とじる', en: 'Close' }} /> }]} onSelect={onNext} onCancel={onNext} />
        </div>
      ) : (
        <div className="dq-choice">
          <Bi line={{ jp: '挑戦しますか？', en: 'Take the challenge?' }} className="dq-q" />
          <CommandMenu
            columns={2}
            items={[
              { id: 'yes', label: <Bi line={{ jp: 'はい', en: 'Yes' }} /> },
              { id: 'no', label: <Bi line={{ jp: 'いいえ', en: 'No' }} /> },
            ]}
            onSelect={(id) => (id === 'yes' ? onStart(a) : onNext())}
            onCancel={onNext}
          />
        </div>
      )}
    </div>
  )
}

function KanaStep({ step, onResult }: { step: Extract<Step, { kind: 'kana' }>; onResult: (ok: boolean) => void }) {
  const [v, setV] = useState('')
  const submit = (raw: string) => {
    const norm = (s: string) => toHiragana(s.trim()).replace(/\s/g, '')
    const ok = norm(raw) === norm(step.answer)
    if (ok) sfx.correct()
    else sfx.wrong()
    onResult(ok)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        onResult(false)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })
  return (
    <div className="dq-msg dq-kana" onKeyDown={(e) => e.stopPropagation()}>
      <Bi line={step.prompt} />
      <div className="dq-kana-row">
        <KanaInput value={v} onChange={setV} onSubmit={submit} autoFocus placeholder="romaji → かな" />
        <button type="button" className="dq-btn" onClick={() => submit(v)}>
          <Bi line={{ jp: 'となえる', en: 'Chant' }} />
        </button>
      </div>
    </div>
  )
}

const RECALL_MS = 6000

function RecallStep({ step, onResult }: { step: Extract<Step, { kind: 'recall' }>; onResult: (ok: boolean) => void }) {
  const word = WORD_BY_ID.get(step.wordId)!
  const options = useMemo(() => shuffle([word, ...distractors(VOCAB, word, 3, (w) => w.en)]), [word])
  const start = useRef(performance.now())
  const [left, setLeft] = useState(1)
  const [picked, setPicked] = useState<string | null>(null)
  const resolve = (id: string | null) => {
    if (picked) return
    const ok = id === word.id
    setPicked(id ?? 'timeout')
    recordReviews([{ itemId: item.word(word.id), correct: ok, ms: Math.round(performance.now() - start.current) }])
    if (ok) {
      sfx.correct()
      void speak(word.kana)
    } else sfx.wrong()
    setTimeout(() => onResult(ok), ok ? 700 : 1600)
  }
  const res = useRef(resolve)
  res.current = resolve
  useEffect(() => {
    if (picked) return
    const id = setInterval(() => {
      const l = 1 - (performance.now() - start.current) / RECALL_MS
      setLeft(Math.max(0, l))
      if (l <= 0) res.current(null)
    }, 100)
    return () => clearInterval(id)
  }, [picked])
  return (
    <div className="dq-msg dq-recall">
      <div className="recall-bar">
        <span style={{ width: `${left * 100}%` }} />
      </div>
      <div className={`dq-recall-word ${picked ? '' : 'fading'}`} lang="ja">
        {word.jp}
      </div>
      {picked ? (
        <div className={picked === word.id ? 'good' : 'bad'}>
          {picked === word.id ? <Bi line={{ jp: 'もどった！', en: 'It’s solid again!' }} /> : `${word.jp}（${word.kana}）= ${word.en}`}
        </div>
      ) : (
        <CommandMenu columns={2} items={options.map((o) => ({ id: o.id, label: `${o.emoji} ${o.en}` }))} onSelect={(id) => resolve(id)} />
      )}
    </div>
  )
}

/** Boss encounters (by activity id) → boss illustration. */
const BOSS_ACTIVITY_HD: Record<string, string> = {
  'r1-boss': 'kana-oni',
  'r2-boss': 'radical-golem',
  'r3-boss': 'particle-guardian',
  'r4-boss': 'silent-librarian',
  'r5-chimera': 'shifting-chimera',
  'r5-dragon': 'void-dragon',
}
const HEROES = new Set(['mage', 'fude'])

const portraitOf = (s: Step | undefined): SpriteId | undefined => (s && (s.kind === 'say' || s.kind === 'activity') ? s.portrait : undefined)

export function Dialog({ steps, speaker, onClose, onStart }: { steps: Step[]; speaker?: Line; onClose: () => void; onStart: (a: Activity) => void }) {
  // The parent remounts the dialog (via `key`) for each new conversation.
  const [queue, setQueue] = useState(steps)
  const [i, setI] = useState(0)
  const step = queue[i]

  // ─── Visual-novel bust (illustrated portrait) when available ───
  const bossId = useMemo(() => {
    const a = queue.find((s) => s.kind === 'activity')
    return a?.kind === 'activity' ? BOSS_ACTIVITY_HD[a.activity.id] : undefined
  }, [queue])
  const hdOf = (sp: SpriteId | undefined) => (!sp ? undefined : bossId && !HEROES.has(sp) ? bossId : SPRITE_TO_HD[sp])
  useEffect(() => {
    preloadHd(queue.map((s) => hdOf(portraitOf(s))))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue])
  let bustSprite: SpriteId | undefined
  for (let k = Math.min(i, queue.length - 1); k >= 0; k--) {
    const sp = portraitOf(queue[k])
    if (sp && hdOf(sp)) {
      bustSprite = sp
      break
    }
  }
  const curPortrait = portraitOf(step)
  const bustId = hdOf(bustSprite)
  const bustActive = !(step?.kind === 'say' && curPortrait !== bustSprite)
  const busts: Bust[] = bustId ? [{ id: bustId, side: HEROES.has(bustSprite!) ? 'left' : 'right', active: bustActive }] : []

  useEffect(() => {
    if (!step) onClose()
  }, [step, onClose])
  if (!step) return null
  const next = (more?: Step[] | void) => {
    if (more && more.length) {
      setQueue((q) => [...q.slice(0, i + 1), ...more, ...q.slice(i + 1)])
    }
    setI((v) => v + 1)
  }
  const name = (step.kind === 'say' || step.kind === 'activity' ? step.speaker : undefined) ?? speaker
  let body: ReactNode
  switch (step.kind) {
    case 'say':
      body = <SayStep key={i} step={step} onNext={() => next()} bust={hdOf(step.portrait)} />
      break
    case 'activity':
      body = <ActivityStep key={i} step={step} onStart={onStart} onNext={() => next()} />
      break
    case 'choice':
      body = (
        <div className="dq-choice" key={i}>
          <Bi line={step.prompt} className="dq-q" />
          <CommandMenu items={step.options.map((o) => ({ id: o.id, label: <Bi line={o.label} /> }))} onSelect={(id) => next(step.onPick(id))} onCancel={() => next()} />
        </div>
      )
      break
    case 'kana':
      body = <KanaStep key={i} step={step} onResult={(ok) => next(step.onResult(ok))} />
      break
    case 'recall':
      body = <RecallStep key={i} step={step} onResult={(ok) => next(step.onResult(ok))} />
      break
  }
  return (
    <div className="dq-layer" role="dialog" aria-live="polite">
      <div className="dq-dock">
      <VnBusts busts={busts} className="dq-vn" />
      <div className="win dq-win">
        {name && (
          <div className="win-title dq-name">
            <span lang="ja">{name.jp}</span>
            {name.en && <small> {name.en}</small>}
          </div>
        )}
        {body}
      </div>
      </div>
    </div>
  )
}

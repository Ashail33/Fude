/**
 * Renders English text with learned Japanese woven in (see engine/weave).
 * Tapping a woven word says it aloud and toggles its English. Sightings are
 * counted (once per mount) so everyday words climb at reading pace, and a
 * small notice welcomes each word the first time it joins the instructions.
 */
import { useEffect, useMemo, useState } from 'react'
import { speak } from '../engine/speech'
import { setState, usePlayer } from '../engine/store'
import { weave, wovenTerms, type Segment, type Term } from '../engine/weave'

// ─── Sightings: buffered, written to the save every few seconds ────────────

const pending = new Map<string, number>()
let flushTimer = 0
type Listener = (t: Term) => void
const listeners = new Set<Listener>()

function flush() {
  flushTimer = 0
  if (!pending.size) return
  const add = new Map(pending)
  pending.clear()
  setState((s) => {
    const weaveSeen = { ...(s.weave ?? {}) }
    for (const [id, n] of add) weaveSeen[id] = (weaveSeen[id] ?? 0) + n
    return { ...s, weave: weaveSeen }
  })
}

/** Count a sighting of each term; the first ever sighting is announced. */
export function noteSeen(terms: Term[], seenBefore: Record<string, number>) {
  for (const t of terms) {
    const first = !(seenBefore[t.id] > 0) && !pending.has(t.id)
    pending.set(t.id, (pending.get(t.id) ?? 0) + 1)
    if (first) listeners.forEach((l) => l(t))
  }
  if (!flushTimer) flushTimer = window.setTimeout(flush, 4000)
}

if (typeof window !== 'undefined') window.addEventListener('pagehide', flush)

// ─── Rendering ─────────────────────────────────────────────────────────────

function Woven({ seg }: { seg: Exclude<Segment, string> }) {
  const [peek, setPeek] = useState(false)
  const { term, stage, text } = seg
  const say = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPeek((p) => !p)
    void speak(term.kana)
  }
  if (stage === 1)
    return (
      <span className="wv wv-1" onClick={say} title={`${term.jp}（${term.kana}）`}>
        {text}
        <span className="wv-hint" lang="ja">
          {term.kana}
        </span>
      </span>
    )
  const kanji = term.jp !== term.kana && /[一-鿿]/.test(term.jp)
  if (stage === 2)
    return (
      <ruby className="wv wv-2" onClick={say} lang="ja">
        {kanji ? term.kana : term.jp}
        <rt>{term.gloss}</rt>
      </ruby>
    )
  return (
    <span className="wv wv-3" onClick={say} title={term.gloss} lang="ja">
      {kanji ? (
        <ruby>
          {term.jp}
          <rt>{term.kana}</rt>
        </ruby>
      ) : (
        term.jp
      )}
      {peek && <span className="wv-peek">{term.gloss}</span>}
    </span>
  )
}

/** English text, with whatever Japanese the player has learned woven in. */
export function Weave({ text }: { text: string }) {
  const p = usePlayer()
  // stages only move between sightings, so weave against the save as of mount
  const segs = useMemo(() => weave(p, text), [text, p.srs, p.settings.weave, p.xp]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const terms = wovenTerms(segs)
    if (terms.length) noteSeen(terms, p.weave ?? {})
  }, [text]) // eslint-disable-line react-hooks/exhaustive-deps
  if (segs.length === 1 && typeof segs[0] === 'string') return <>{segs[0]}</>
  return <>{segs.map((sg, i) => (typeof sg === 'string' ? <span key={i}>{sg}</span> : <Woven key={i} seg={sg} />))}</>
}

/** "New word in your instructions" notice, shown once per word. */
export function WeaveNotice() {
  const [queue, setQueue] = useState<Term[]>([])
  useEffect(() => {
    const on: Listener = (t) => setQueue((q) => (q.some((x) => x.id === t.id) ? q : [...q, t]))
    listeners.add(on)
    return () => {
      listeners.delete(on)
    }
  }, [])
  const cur = queue[0]
  useEffect(() => {
    if (!cur) return
    const id = setTimeout(() => setQueue((q) => q.slice(1)), 4200)
    return () => clearTimeout(id)
  }, [cur])
  if (!cur) return null
  return (
    <div className="wv-notice" role="status" onClick={() => setQueue((q) => q.slice(1))}>
      <span className="wv-notice-tag">
        ✍️ <span lang="ja">あたらしい ことば</span> · New word in your instructions
      </span>
      <span className="wv-notice-word">
        <span lang="ja">{cur.jp}</span>
        {cur.jp !== cur.kana && <small lang="ja">{cur.kana}</small>} = {cur.gloss}
      </span>
    </div>
  )
}

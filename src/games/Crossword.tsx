import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as wanakana from 'wanakana'
import type { GameProps } from './types'
import { GameFrame, Intro, KanaInput, SpeakButton, T, useAnswerTimer, useBurst } from '../components/ui'
import { getWord, WORD_BY_ID, type Word } from '../data/vocab'
import { bounds, buildCandidates, entryCells, entryPoints, generateCrossword, kanjiEligible, type Placed } from '../engine/crossword'
import { item } from '../engine/items'
import { shuffle } from '../engine/random'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import { weakness, type Review } from '../engine/srs'
import { getState } from '../engine/store'
import './Crossword.css'

interface EntryState {
  solved: boolean
  mistakes: number
  reveals: number
  /** Answer given up / fully revealed: no points. */
  lost: boolean
  /** Kanji-palette options already tried and wrong. */
  tried: string[]
}

type CellKind = 'gold' | 'hint' | 'lost'

const MAX_MISTAKES = 3
const key = (r: number, c: number) => `${r},${c}`

function sameKana(a: string, b: string): boolean {
  const norm = (s: string) => wanakana.toHiragana(s.replace(/\s+/g, ''))
  return norm(a) === norm(b)
}

export default function Crossword({ activity, params, onFinish, onExit }: GameProps<'crossword'>) {
  const [burstNode, fire] = useBurst()
  const [started, setStarted] = useState(false)
  const cw = useMemo(() => {
    const srs = getState().srs
    const words = params.wordIds.map((id) => WORD_BY_ID.get(id)).filter((w) => w !== undefined)
    const cands = buildCandidates(words, params.answer, params.size, (id) => weakness(srs[item.word(id)]))
    return generateCrossword(cands, params.size)
  }, [params.wordIds, params.answer, params.size])
  const entries = cw.entries
  const box = useMemo(() => bounds(cw), [cw])

  // Kanji palette per kanji entry: the answer + 3 look-alike-length decoys.
  const palettes = useMemo(() => {
    const pool = params.wordIds.map((id) => WORD_BY_ID.get(id)).filter((w): w is Word => !!w && kanjiEligible(w))
    const m = new Map<string, string[]>()
    for (const e of entries) {
      if (!e.kanji) continue
      const ans = e.answer.join('')
      const others = shuffle(pool.filter((w) => w.jp !== ans)).sort(
        (a, b) => Math.abs([...a.jp].length - e.answer.length) - Math.abs([...b.jp].length - e.answer.length),
      )
      // Prefer decoys sharing a character (harder), then same length.
      const sharing = others.filter((w) => [...w.jp].some((ch) => e.answer.includes(ch)))
      const picks = [...new Set([...sharing.slice(0, 1), ...others].map((w) => w.jp))].slice(0, 3)
      m.set(e.id, shuffle([ans, ...picks]))
    }
    return m
  }, [entries, params.wordIds])

  const [states, setStates] = useState<EntryState[]>(() => entries.map(() => ({ solved: false, mistakes: 0, reveals: 0, lost: false, tried: [] })))
  const [cells, setCells] = useState<Map<string, { ch: string; kind: CellKind }>>(new Map())
  const [sel, setSel] = useState(0)
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(0)
  const [msg, setMsg] = useState<{ text: string; good: boolean } | null>(null)
  const [done, setDone] = useState(false)
  const reviews = useRef<Review[]>([])
  const finished = useRef(false)
  const timers = useRef<number[]>([])
  const elapsed = useAnswerTimer(sel)
  const fineInput = useMemo(() => typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches, [])

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), [])

  const cur: Placed | undefined = entries[sel]
  const curState = states[sel]
  const curCells = useMemo(() => (cur ? new Set(entryCells(cur).map(([r, c]) => key(r, c))) : new Set<string>()), [cur])
  const solvedN = states.filter((s) => s.solved).length
  const score = states.reduce((s, st) => s + (st.solved ? entryPoints(st.mistakes, st.reveals, st.lost) : 0), 0)
  const maxScore = entries.length * 3

  // Clue number at each start cell.
  const numbers = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of entries) m.set(key(e.row, e.col), e.num)
    return m
  }, [entries])

  const finishGame = useCallback(
    (finalStates: EntryState[]) => {
      if (finished.current) return
      finished.current = true
      setDone(true)
      sfx.win()
      fire(50, 40, 24)
      const finalScore = finalStates.reduce((s, st) => s + entryPoints(st.mistakes, st.reveals, st.lost), 0)
      const clean = finalStates.filter((s) => !s.lost && s.mistakes === 0 && s.reveals === 0).length
      timers.current.push(
        window.setTimeout(
          () =>
            onFinish({
              score: finalScore,
              maxScore,
              reviews: reviews.current,
              notes: [`${clean} of ${entries.length} words solved cleanly.`],
            }),
          1400,
        ),
      )
    },
    [entries.length, fire, maxScore, onFinish],
  )

  /** Selects the next unsolved entry after `from` (wrapping). */
  const nextUnsolved = (st: EntryState[], from: number) => {
    for (let k = 1; k <= entries.length; k++) {
      const i = (from + k) % entries.length
      if (!st[i].solved) return i
    }
    return from
  }

  /**
   * Marks entry `i` as finished and fills its cells. Crossing entries whose
   * squares all become known still need to be answered (one review each).
   */
  const complete = (i: number, kind: CellKind, patch: Partial<EntryState>, nextCells: Map<string, { ch: string; kind: CellKind }>, st: EntryState[]) => {
    const e = entries[i]
    st[i] = { ...st[i], ...patch, solved: true }
    for (const [r, c] of entryCells(e)) {
      const k = key(r, c)
      const prev = nextCells.get(k)
      if (!prev || prev.kind === 'hint' || kind === 'gold') nextCells.set(k, { ch: cw.grid[r][c]!, kind: prev?.kind === 'gold' ? 'gold' : kind })
    }
  }

  const afterUpdate = (st: EntryState[], nextCells: Map<string, { ch: string; kind: CellKind }>, from: number) => {
    setStates(st)
    setCells(nextCells)
    setInput('')
    setShake(0)
    if (st.every((s) => s.solved)) finishGame(st)
    else setSel(nextUnsolved(st, from))
  }

  const submit = (answer: string) => {
    if (!cur || curState.solved || done) return
    const w = getWord(cur.id)
    const target = cur.answer.join('')
    const ok = cur.kanji ? answer === target : sameKana(answer, target)
    if (!answer.trim()) return
    const ms = elapsed()
    const st = [...states]
    const nextCells = new Map(cells)
    if (ok) {
      sfx.correct()
      void speak(w.jp)
      fire(50, 45, 14)
      const clean = curState.mistakes === 0 && curState.reveals === 0
      reviews.current.push({ itemId: item.word(cur.id), correct: clean, ms })
      setMsg({ text: `✓ ${w.jp}${w.jp !== w.kana ? ` (${w.kana})` : ''} = ${w.en}`, good: true })
      complete(sel, 'gold', {}, nextCells, st)
      afterUpdate(st, nextCells, sel)
      return
    }
    sfx.wrong()
    setShake((n) => n + 1)
    const mistakes = curState.mistakes + 1
    const tried = cur.kanji ? [...curState.tried, answer] : curState.tried
    if (mistakes >= MAX_MISTAKES) {
      // Learning moment: show the answer, no points for this word.
      reviews.current.push({ itemId: item.word(cur.id), correct: false, ms })
      setMsg({ text: `The answer was ${target}${cur.kanji ? ` (${w.kana})` : ''}: ${w.en}`, good: false })
      void speak(w.jp)
      complete(sel, 'lost', { mistakes, tried, lost: true }, nextCells, st)
      afterUpdate(st, nextCells, sel)
      return
    }
    st[sel] = { ...curState, mistakes, tried }
    setStates(st)
    setInput('')
    setMsg({ text: `✗ Not “${answer}”. ${MAX_MISTAKES - mistakes} tr${MAX_MISTAKES - mistakes === 1 ? 'y' : 'ies'} left before the answer is revealed.`, good: false })
  }

  const revealLetter = () => {
    if (!cur || curState.solved || done) return
    const cellsOf = entryCells(cur)
    const idx = cellsOf.findIndex(([r, c]) => !cells.has(key(r, c)))
    if (idx < 0) return
    sfx.click()
    const nextCells = new Map(cells)
    const [r, c] = cellsOf[idx]
    nextCells.set(key(r, c), { ch: cur.answer[idx], kind: 'hint' })
    const st = [...states]
    st[sel] = { ...curState, reveals: curState.reveals + 1 }
    if (cellsOf.every(([rr, cc]) => nextCells.has(key(rr, cc)))) {
      // Every letter revealed: the word is given away.
      reviews.current.push({ itemId: item.word(cur.id), correct: false, ms: elapsed() })
      const w = getWord(cur.id)
      setMsg({ text: `${cur.answer.join('')} = ${w.en}`, good: false })
      complete(sel, 'lost', { reveals: st[sel].reveals, lost: true }, nextCells, st)
      afterUpdate(st, nextCells, sel)
      return
    }
    setStates(st)
    setCells(nextCells)
  }

  const clickCell = (r: number, c: number) => {
    if (done) return
    const here = entries.map((e, i) => ({ e, i })).filter(({ e }) => entryCells(e).some(([rr, cc]) => rr === r && cc === c))
    if (!here.length) return
    sfx.click()
    const inSel = here.findIndex(({ i }) => i === sel)
    let pickI: number
    if (inSel >= 0 && here.length > 1) pickI = here[(inSel + 1) % here.length].i
    else if (inSel >= 0) pickI = sel
    else pickI = (here.find(({ i }) => !states[i].solved) ?? here[0]).i
    if (pickI !== sel) {
      setSel(pickI)
      setShake(0)
      setInput('')
      setMsg(null)
    }
  }

  const selectEntry = (i: number) => {
    if (done) return
    sfx.click()
    setSel(i)
    setShake(0)
    setInput('')
    setMsg(null)
  }

  // Keyboard: 1–4 pick a kanji option.
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {})
  useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      if (!started || !cur?.kanji || curState.solved) return
      const n = Number(e.key)
      const opts = palettes.get(cur.id) ?? []
      if (n >= 1 && n <= opts.length && !curState.tried.includes(opts[n - 1])) submit(opts[n - 1])
    }
  })
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const right = started ? (
    <div className="cw-hud">
      <span title="Words solved">📜 {solvedN}/{entries.length}</span>
      <span title="Score">⭐ {score}</span>
    </div>
  ) : null

  if (!entries.length) {
    return (
      <GameFrame title={activity.title} jp={activity.jp} onExit={onExit}>
        <div className="card center">The leaves refuse to form a puzzle… try again later.</div>
      </GameFrame>
    )
  }

  const cols = box.c1 - box.c0 + 1
  const rows = box.r1 - box.r0 + 1
  const across = entries.map((e, i) => ({ e, i })).filter(({ e }) => e.dir === 'across')
  const down = entries.map((e, i) => ({ e, i })).filter(({ e }) => e.dir === 'down')
  const w = cur ? getWord(cur.id) : null
  const mixed = params.answer === 'mixed'

  const clueList = (list: { e: Placed; i: number }[]) =>
    list.map(({ e, i }) => {
      const cw_ = getWord(e.id)
      const st = states[i]
      return (
        <li key={e.id}>
          <button type="button" className={`cw-clue ${i === sel ? 'active' : ''} ${st.solved ? (st.lost ? 'lost' : 'solved') : ''}`} onClick={() => selectEntry(i)}>
            <span className="cw-clue-num">{e.num}</span>
            <span className="cw-clue-emoji">{cw_.emoji}</span>
            <span className="cw-clue-text">
              {cw_.en} <span className="muted">({e.answer.length})</span>
            </span>
            {e.kanji && <span className="cw-tag">漢字</span>}
          </button>
          {mixed && <SpeakButton text={cw_.jp} className="cw-clue-speak" />}
        </li>
      )
    })

  return (
    <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right} className="cw-game">
      {!started ? (
        <Intro
          title="Word Crossword"
          jp="ことばのクロスワード"
          lines={[
            'Tap a clue or a square to choose a word, then type its reading in romaji (it turns into kana).',
            mixed ? 'Clues marked 漢字 must be written in kanji: choose the right spelling.' : 'Each square holds one kana. Small ゃ・ゅ・ょ・っ take a square of their own.',
            `Wrong answers shake the grid; after ${MAX_MISTAKES} the word is revealed. Hints cost points.`,
          ]}
          onStart={() => setStarted(true)}
        />
      ) : (
        <div className="cw-layout">
          <div className="cw-board">
            {burstNode}
            <div
              className="cw-grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                // the board never takes more than ~40% of the screen's height, so the clue and input stay in view
                width: `min(100%, ${cols * 46}px, calc(40dvh * ${cols} / ${rows}))`,
                ['--cw-font' as string]: `min(1.5rem, calc(min(100vw - 40px, ${cols * 46}px, 40dvh * ${cols} / ${rows}) / ${cols} * 0.52))`,
              }}
            >
              {Array.from({ length: rows }, (_, rr) =>
                Array.from({ length: cols }, (_, cc) => {
                  const r = rr + box.r0
                  const c = cc + box.c0
                  const ch = cw.grid[r][c]
                  if (ch === null) return <div key={key(r, c)} className="cw-cell empty" />
                  const k = key(r, c)
                  const fill = cells.get(k)
                  const num = numbers.get(k)
                  const active = curCells.has(k)
                  return (
                    <button
                      type="button"
                      key={active ? `${k}-${shake}` : k}
                      className={`cw-cell ${active ? 'active' : ''} ${fill ? `filled ${fill.kind}` : ''} ${active && shake ? 'shaking' : ''}`}
                      onClick={() => clickCell(r, c)}
                      aria-label={fill ? fill.ch : `Square${num ? ` ${num}` : ''}`}
                    >
                      {num !== undefined && <span className="cw-num">{num}</span>}
                      {fill && (
                        <span className="cw-ch" lang="ja">
                          {fill.ch}
                        </span>
                      )}
                    </button>
                  )
                }),
              )}
            </div>
          </div>

          {cur && w && (
            <div className={`card cw-active ${curState.solved ? 'is-solved' : ''}`} key={`${sel}-${shake}`}>
              <div className={`cw-active-clue ${shake && !curState.solved ? 'shake' : ''}`}>
                <span className="cw-clue-num">
                  {cur.num}
                  {cur.dir === 'across' ? '→' : '↓'}
                </span>
                <span className="cw-active-emoji">{w.emoji}</span>
                <span className="cw-active-en">{w.en}</span>
                {cur.kanji && <span className="cw-tag">漢字</span>}
                {mixed && <SpeakButton text={w.jp} />}
              </div>
              <div className="cw-slots" lang="ja">
                {entryCells(cur).map(([r, c], i) => {
                  const f = cells.get(key(r, c))
                  return (
                    <span key={i} className={`cw-slot ${f ? f.kind : ''}`}>
                      {f?.ch ?? ''}
                    </span>
                  )
                })}
              </div>
              {curState.solved ? (
                <div className="feedback good">{curState.lost ? '📖 Revealed' : '✓ Solved'}</div>
              ) : cur.kanji ? (
                <div className="choices cw-kanji-choices">
                  {(palettes.get(cur.id) ?? []).map((opt, i) => (
                    <button
                      type="button"
                      key={opt}
                      className={`choice choice-jp ${curState.tried.includes(opt) ? 'wrong' : ''}`}
                      disabled={curState.tried.includes(opt) || done}
                      onClick={() => submit(opt)}
                    >
                      <span className="cw-key">{i + 1}</span>
                      <span lang="ja">{opt}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <form
                  className="cw-input-row"
                  onSubmit={(e) => {
                    e.preventDefault()
                    submit(wanakana.toHiragana(input))
                  }}
                >
                  <KanaInput value={input} onChange={setInput} onSubmit={submit} autoFocus={fineInput} disabled={done} placeholder={`${cur.answer.length} kana · type romaji`} />
                  <button type="submit" className="btn btn-primary" disabled={!input || done}>
                    <T en="Cast" jp="けってい" />
                  </button>
                </form>
              )}
              <div className="row cw-tools">
                <button type="button" className="btn btn-sm" onClick={revealLetter} disabled={curState.solved || done}>
                  💡 <T en="Reveal letter" jp="ヒント" /> (−1⭐)
                </button>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => selectEntry(nextUnsolved(states, sel))} disabled={done || solvedN === entries.length}>
                  <T en="Next clue" jp="つぎ" /> ⏭
                </button>
              </div>
              <div className={`feedback ${msg?.good ? 'good' : 'bad'}`}>{msg?.text}</div>
            </div>
          )}

          <div className="card cw-clues">
            <div>
              <h3>
                <T en="Across" jp="よこ" /> →
              </h3>
              <ol>{clueList(across)}</ol>
            </div>
            <div>
              <h3>
                <T en="Down" jp="たて" /> ↓
              </h3>
              <ol>{clueList(down)}</ol>
            </div>
          </div>
        </div>
      )}
    </GameFrame>
  )
}

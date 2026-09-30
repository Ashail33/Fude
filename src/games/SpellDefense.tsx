import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { toRomaji } from 'wanakana'
import type { GameProps } from './types'
import type { Review } from '../engine/srs'
import type { Word } from '../data/vocab'
import { GameFrame, Hearts, Intro, Jp, KanaInput, useBurst } from '../components/ui'
import { item } from '../engine/items'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import { weakness } from '../engine/srs'
import { getState } from '../engine/store'
import {
  acceptedReadings,
  buildChoices,
  defenseTuning,
  elementColor as colorOf,
  fallSpeed,
  findTarget,
  likelyIntended,
  matchesMeaning,
  matchesReading,
  maxBlocks,
  nextWord,
  normaliseKana,
  safePool,
  spawnDelay,
  type Difficulty,
} from './recognition'
import './SpellDefense.css'

/** Sky occupies the top SKY% of the field; the village is below. */
const SKY = 80
/** Approximate block height (px) so blocks start fully visible and land on the roofs. */
const BLOCK_H = 76
const blockTop = (y: number) => `calc((${SKY}% - ${BLOCK_H}px) * ${(y / 100).toFixed(4)})`
const blockCentre = (y: number) => `calc((${SKY}% - ${BLOCK_H}px) * ${(y / 100).toFixed(4)} + ${BLOCK_H / 2}px)`
/** Rough centre in % (for particle bursts, which take percentages). */
const blockCentrePct = (y: number) => ((SKY - 18) * y) / 100 + 9
const MAGE = { x: 50, y: 90 }
const LANES = [8, 36, 64, 92]
const SHOT_MS = 230


interface Block {
  uid: number
  word: Word
  x: number
  /** 0 = top of the sky, 100 = the village roofs. */
  y: number
  speed: number
  state: 'fall' | 'locked' | 'dying'
  failed: boolean
  revealUntil: number
  born: number
  choices: Word[]
  /** Choice ids picked wrongly (shown red). */
  wrongPicks: string[]
}

interface Shot {
  id: number
  x0: number
  y0: number
  x1: number
  y1: string
  color: string
}

interface GameState {
  blocks: Block[]
  shots: Shot[]
  hearts: number
  destroyed: number
  clean: number
  resolved: number
  landed: number
  recent: string[]
  nextSpawnAt: number
  lockUntil: number
  reviews: Review[]
  over: boolean
  /** Most recent single-mode block, so the spell buttons stay put between blocks. */
  last: Block | null
}

let uidSeq = 1

export default function SpellDefense({ activity, params, onFinish, onExit }: GameProps<'spell-defense'>) {
  const difficulty: Difficulty = params.difficulty === 2 || params.difficulty === 3 ? params.difficulty : 1
  const goal = Math.max(1, params.goal || 10)
  const tuning = defenseTuning(difficulty)
  const [pool] = useState(() => safePool(params.wordIds))
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro')
  const [outcome, setOutcome] = useState<'win' | 'lose' | null>(null)
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)
  const [hurt, setHurt] = useState(false)
  const [toast, setToast] = useState<{ id: number; text: string; bad: boolean } | null>(null)
  const [, rerender] = useReducer((x: number) => x + 1, 0)
  const [burstNode, burst] = useBurst()
  const timers = useRef(new Set<number>())
  const finished = useRef(false)
  const onFinishRef = useRef(onFinish)
  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])
  const g = useRef<GameState>({
    blocks: [],
    shots: [],
    hearts: tuning.hearts,
    destroyed: 0,
    clean: 0,
    resolved: 0,
    landed: 0,
    recent: [],
    nextSpawnAt: 0,
    lockUntil: 0,
    reviews: [],
    over: false,
    last: null,
  })

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
  }, [])

  useEffect(() => {
    const set = timers.current
    return () => {
      set.forEach((id) => clearTimeout(id))
      set.clear()
    }
  }, [])

  const showToast = useCallback(
    (text: string, bad: boolean) => {
      const id = Date.now()
      setToast({ id, text, bad })
      later(() => setToast((t) => (t && t.id === id ? null : t)), 1600)
    },
    [later],
  )

  const finish = useCallback(
    (win: boolean) => {
      const s = g.current
      if (s.over) return
      s.over = true
      setOutcome(win ? 'win' : 'lose')
      setPhase('end')
      if (win) sfx.win()
      else sfx.lose()
      later(() => {
        if (finished.current) return
        finished.current = true
        onFinishRef.current({
          score: s.clean,
          maxScore: Math.max(1, s.resolved),
          passed: win ? undefined : false,
          reviews: s.reviews,
          notes: [
            win ? `The village is safe! ${s.destroyed} blocks destroyed.` : `The village fell after ${s.destroyed} of ${goal} blocks.`,
            `${s.clean} destroyed on the first cast · ${s.landed} landed`,
          ],
        })
      }, 1400)
    },
    [goal, later],
  )

  // ─── Spawning ───────────────────────────────────────────────────────
  const spawn = useCallback(
    (now: number) => {
      const s = g.current
      const active = s.blocks.filter((b) => b.state !== 'dying')
      const exclude = new Set(active.map((b) => b.word.id))
      const activeKana = new Set(active.map((b) => normaliseKana(b.word.kana)))
      const srs = getState().srs
      let word = nextWord(pool, (w) => weakness(srs[item.word(w.id)]), s.recent, exclude)
      // In typing mode two blocks with the same reading would be confusing.
      for (let i = 0; i < 5 && activeKana.has(normaliseKana(word.kana)); i++) word = nextWord(pool, () => 1, s.recent, exclude)
      s.recent = [...s.recent.slice(-6), word.id]
      const usedLanes = new Set(active.map((b) => b.x))
      const lanes = difficulty === 3 ? LANES.filter((l) => !usedLanes.has(l)) : [30 + Math.random() * 40]
      const x = lanes.length ? lanes[Math.floor(Math.random() * lanes.length)] : LANES[Math.floor(Math.random() * LANES.length)]
      const block: Block = {
        uid: uidSeq++,
        word,
        x,
        y: 0,
        speed: fallSpeed(difficulty, s.destroyed) * (0.9 + Math.random() * 0.2),
        state: 'fall',
        failed: false,
        revealUntil: 0,
        born: now,
        choices: difficulty === 3 ? [] : buildChoices(word, pool, difficulty === 1 ? 'jp' : 'en'),
        wrongPicks: [],
      }
      s.blocks.push(block)
      s.last = block
      s.nextSpawnAt = difficulty === 3 ? now + spawnDelay(difficulty, s.destroyed) : Infinity
    },
    [difficulty, pool],
  )

  const land = useCallback(
    (b: Block, now: number) => {
      const s = g.current
      s.blocks = s.blocks.filter((x) => x !== b)
      s.hearts -= 1
      s.landed += 1
      s.resolved += 1
      if (!b.failed) s.reviews.push({ itemId: item.word(b.word.id), correct: false, ms: Math.round(now - b.born) })
      sfx.hurt()
      setHurt(true)
      later(() => setHurt(false), 450)
      showToast(`${b.word.emoji} ${b.word.jp}${b.word.jp !== b.word.kana ? ` (${b.word.kana})` : ''} = ${b.word.en}`, true)
      if (s.hearts <= 0) finish(false)
      else if (difficulty < 3) s.nextSpawnAt = now + spawnDelay(difficulty, s.destroyed) + 500
    },
    [difficulty, finish, later, showToast],
  )

  // ─── Main loop ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'play') return
    let raf = 0
    let last = performance.now()
    if (!g.current.nextSpawnAt) g.current.nextSpawnAt = last + 300
    const loop = (t: number) => {
      const s = g.current
      if (s.over) return
      const dt = Math.min(0.05, Math.max(0, (t - last) / 1000))
      last = t
      for (const b of [...s.blocks]) {
        if (b.state !== 'fall') continue
        b.y += b.speed * dt
        if (b.y >= 100) land(b, t)
      }
      if (!s.over) {
        const active = s.blocks.filter((b) => b.state !== 'dying').length
        if (t >= s.nextSpawnAt && active < maxBlocks(difficulty, s.destroyed) && s.destroyed + active < goal + 2) spawn(t)
      }
      rerender()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase, difficulty, goal, land, spawn])

  // ─── Casting ────────────────────────────────────────────────────────
  const castHit = useCallback(
    (b: Block) => {
      const s = g.current
      if (b.state !== 'fall' || s.over) return
      const now = performance.now()
      b.state = 'locked'
      const color = colorOf(b.word)
      const shot: Shot = { id: uidSeq++, x0: MAGE.x, y0: MAGE.y, x1: b.x, y1: blockCentre(b.y), color }
      s.shots.push(shot)
      sfx.cast()
      if (!b.failed) s.reviews.push({ itemId: item.word(b.word.id), correct: true, ms: Math.round(now - b.born) })
      later(() => {
        s.shots = s.shots.filter((x) => x.id !== shot.id)
        if (s.over) return
        b.state = 'dying'
        sfx.correct()
        burst(b.x, blockCentrePct(b.y), 14)
        void speak(b.word.kana)
        s.destroyed += 1
        s.resolved += 1
        if (!b.failed) s.clean += 1
        later(() => {
          s.blocks = s.blocks.filter((x) => x !== b)
        }, 380)
        if (s.destroyed >= goal) finish(true)
        else if (difficulty < 3) s.nextSpawnAt = performance.now() + spawnDelay(difficulty, s.destroyed)
      }, SHOT_MS)
    },
    [burst, difficulty, finish, goal, later],
  )

  const castMiss = useCallback(
    (b: Block | undefined, pickedId?: string) => {
      const s = g.current
      if (s.over) return
      const now = performance.now()
      sfx.wrong()
      setShake(true)
      later(() => setShake(false), 420)
      s.lockUntil = now + 900
      later(() => rerender(), 920)
      if (!b) return
      s.reviews.push({ itemId: item.word(b.word.id), correct: false, ms: Math.round(now - b.born) })
      b.failed = true
      b.revealUntil = now + 1500
      if (pickedId) b.wrongPicks = [...b.wrongPicks, pickedId]
      // The misfire feeds the block: it surges toward the village and speeds up.
      b.y = Math.min(96, b.y + 12)
      b.speed *= 1.2
      later(() => rerender(), 1520)
    },
    [later],
  )

  const current = (): Block | undefined => g.current.blocks.find((b) => b.state === 'fall')
  const locked = () => performance.now() < g.current.lockUntil

  const pickChoice = useCallback(
    (w: Word) => {
      const b = g.current.blocks.find((x) => x.state === 'fall')
      if (!b || performance.now() < g.current.lockUntil) return
      if (w.id === b.word.id) castHit(b)
      else castMiss(b, w.id)
    },
    [castHit, castMiss],
  )

  const typedMatches = (b: Block, text: string) => (difficulty === 2 ? matchesMeaning(b.word, text) : matchesReading(b.word, text))

  const submitTyped = (text: string) => {
    if (!text.trim() || locked()) return
    const falling = g.current.blocks.filter((b) => b.state === 'fall')
    if (difficulty === 3) {
      const target = findTarget(falling, text)
      if (target) castHit(target)
      else castMiss(likelyIntended(falling, text))
    } else {
      const b = falling[0]
      if (b && typedMatches(b, text)) castHit(b)
      else castMiss(b)
    }
    setInput('')
  }

  // Auto-cast as soon as the typed text is exactly right (no Enter needed),
  // unless another falling word starts with the same letters.
  const onType = (v: string) => {
    setInput(v)
    if (locked()) return
    const falling = g.current.blocks.filter((b) => b.state === 'fall')
    const raw = v.trim()
    if (!raw) return
    if (difficulty === 2) {
      const b = falling[0]
      if (b && matchesMeaning(b.word, raw)) {
        castHit(b)
        setInput('')
      }
      return
    }
    const hit = falling.filter((b) => acceptedReadings(b.word).includes(raw)).sort((a, b) => b.y - a.y)[0]
    if (!hit) return
    const longer = falling.some((b) => b !== hit && acceptedReadings(b.word).some((r) => r.length > raw.length && r.startsWith(raw)))
    if (longer) return
    castHit(hit)
    setInput('')
  }

  // Number keys 1–4 pick a spell.
  useEffect(() => {
    if (phase !== 'play' || difficulty === 3) return
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (!(n >= 1 && n <= 4)) return
      const t = e.target as HTMLElement | null
      if (t?.tagName === 'INPUT' && (t as HTMLInputElement).value) return
      const b = g.current.blocks.find((x) => x.state === 'fall')
      const choice = b?.choices[n - 1]
      if (choice) {
        e.preventDefault()
        pickChoice(choice)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, difficulty, pickChoice])

  const s = g.current
  const now = performance.now()
  const right = (
    <>
      <Hearts value={Math.max(0, s.hearts)} max={tuning.hearts} />
      <span className="sd-count" aria-label={`${s.destroyed} of ${goal} destroyed`}>
        💥 {s.destroyed}/{goal}
      </span>
    </>
  )

  const introLines =
    difficulty === 1
      ? ['Enchanted objects fall toward the village.', 'Cast the matching Japanese spell (tap it, press 1–4, or type the reading).', `Each block that lands costs a heart. Destroy ${goal} to win.`]
      : difficulty === 2
        ? ['Japanese words fall toward the village.', 'Cast their meaning: pick the English (1–4) or type it.', `Blocks fall faster now. Destroy ${goal} to win.`]
        : ['A storm of kana! Several blocks fall at once.', 'Type the reading (romaji turns into kana) to blast the matching block.', `Misfires make blocks surge. Destroy ${goal} to win.`]

  if (phase === 'intro') {
    return (
      <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right}>
        <Intro title={activity.title} jp={activity.jp} lines={introLines} onStart={() => setPhase('play')} />
      </GameFrame>
    )
  }

  const active = current()
  const shown = active ?? s.last
  const showAnswer = shown && (shown.revealUntil > now || !active)

  return (
    <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right} className="sd-game">
      <div className={`sd-field ${shake ? 'shake' : ''} ${hurt ? 'sd-hurt' : ''} ${difficulty === 3 ? 'sd-storm' : ''}`}>
        <div className="sd-stars" aria-hidden />
        {s.blocks.map((b) => {
          const reveal = b.revealUntil > now
          return (
            <div
              key={b.uid}
              className={`sd-block sd-d${difficulty} ${b.state === 'dying' ? 'sd-dying' : ''} ${reveal ? 'sd-reveal' : ''} ${b.y > 72 ? 'sd-danger' : ''}`}
              style={{ left: `${b.x}%`, top: blockTop(b.y), ['--sd-tx' as string]: `-${b.x}%`, ['--sd-color' as string]: colorOf(b.word) }}
            >
              {difficulty === 1 && (
                <>
                  <span className="sd-emoji">{b.word.emoji}</span>
                  <span className="sd-en">{b.word.en}</span>
                </>
              )}
              {difficulty === 2 && <Jp text={b.word.jp} reading={b.word.kana} hideHelp className="sd-jp" />}
              {difficulty === 2 && b.word.jp !== b.word.kana && (
                <span className="sd-kana" lang="ja">
                  {b.word.kana}
                </span>
              )}
              {difficulty === 3 && (
                <span className="sd-jp" lang="ja">
                  {b.word.kana}
                </span>
              )}
              {reveal && (
                <span className="sd-answer">
                  {difficulty === 1 ? (
                    <span lang="ja">
                      {b.word.jp}
                      {b.word.jp !== b.word.kana && ` · ${b.word.kana}`}
                    </span>
                  ) : difficulty === 2 ? (
                    b.word.en
                  ) : (
                    toRomaji(b.word.kana)
                  )}
                </span>
              )}
            </div>
          )
        })}
        {s.shots.map((sh) => (
          <span
            key={sh.id}
            className="sd-shot"
            style={{
              ['--x0' as string]: `${sh.x0}%`,
              ['--y0' as string]: `${sh.y0}%`,
              ['--x1' as string]: `${sh.x1}%`,
              ['--y1' as string]: sh.y1,
              ['--sd-color' as string]: sh.color,
              animationDuration: `${SHOT_MS}ms`,
            }}
          />
        ))}
        <div className="sd-village" aria-hidden>
          <span>🏠</span>
          <span>🌳</span>
          <span>🏡</span>
          <span className="sd-mage">🧙</span>
          <span>⛩️</span>
          <span>🏠</span>
          <span>🌸</span>
        </div>
        {toast && <div className={`sd-toast ${toast.bad ? 'bad' : ''}`}>{toast.text}</div>}
        {phase === 'end' && (
          <div className="sd-end pop">
            {outcome === 'win' ? (
              <>
                <span lang="ja">むらをまもった！</span>
                <small>The village is safe!</small>
              </>
            ) : (
              <>
                <span lang="ja">むらがやられた…</span>
                <small>The village has fallen…</small>
              </>
            )}
          </div>
        )}
        {burstNode}
      </div>

      {phase === 'play' && (
        <div className="sd-controls">
          {difficulty < 3 && shown && (
            <div className="choices sd-choices">
              {shown.choices.map((c, i) => {
                const isRight = c.id === shown.word.id
                const cls = showAnswer && isRight ? 'correct' : shown.wrongPicks.includes(c.id) ? 'wrong' : ''
                return (
                  <button key={`${shown.uid}-${c.id}`} type="button" className={`choice ${difficulty === 1 ? 'choice-jp' : ''} ${cls}`} disabled={!active || locked()} onClick={() => pickChoice(c)}>
                    <span className="sd-key">{i + 1}</span>
                    {difficulty === 1 ? <Jp text={c.jp} reading={c.kana} /> : c.en}
                  </button>
                )
              })}
            </div>
          )}
          {difficulty < 3 && !shown && <div className="sd-wait muted">…</div>}
          <KanaInput
            value={input}
            onChange={onType}
            onSubmit={submitTyped}
            mode={difficulty === 2 ? 'romaji' : 'hiragana'}
            placeholder={difficulty === 1 ? 'or type the reading → かな' : difficulty === 2 ? 'or type the English…' : 'type the reading → かな'}
            autoFocus={difficulty === 3}
            className="sd-input"
          />
        </div>
      )}
    </GameFrame>
  )
}

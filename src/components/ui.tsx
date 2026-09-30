import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import * as wanakana from 'wanakana'
import { EFFECTS } from '../engine/rewards'
import { speak } from '../engine/speech'
import { immersionOf, usePlayer } from '../engine/store'

/**
 * Bilingual label that follows the player's immersion level:
 *   0 English · 1 Japanese with English beneath · 2 Japanese (English on hover) · 3 Japanese only
 */
export function T({ en, jp, className }: { en: string; jp: string; className?: string }) {
  const p = usePlayer()
  const lvl = immersionOf(p)
  if (lvl === 0) return <span className={className}>{en}</span>
  if (lvl === 1)
    return (
      <span className={`bi ${className ?? ''}`}>
        <span lang="ja">{jp}</span>
        <small>{en}</small>
      </span>
    )
  return (
    <span className={className} lang="ja" title={lvl === 2 ? en : undefined}>
      {jp}
    </span>
  )
}

/**
 * Japanese text with optional reading (furigana) and romaji, depending on
 * settings. `reading` should be kana. Set `hideHelp` to suppress aids.
 */
export function Jp({ text, reading, hideHelp, className, big }: { text: string; reading?: string; hideHelp?: boolean; className?: string; big?: boolean }) {
  const p = usePlayer()
  const showReading = !hideHelp && reading && reading !== text
  const romaji = !hideHelp && p.settings.showRomaji ? wanakana.toRomaji(reading ?? text) : null
  return (
    <span className={`jp ${big ? 'jp-big' : ''} ${className ?? ''}`} lang="ja">
      {showReading ? (
        <ruby>
          {text}
          <rt>{reading}</rt>
        </ruby>
      ) : (
        text
      )}
      {romaji && /[a-z]/i.test(romaji) && <span className="romaji">{romaji}</span>}
    </span>
  )
}

export function SpeakButton({ text, label, className }: { text: string; label?: string; className?: string }) {
  return (
    <button
      type="button"
      className={`btn-icon ${className ?? ''}`}
      aria-label={label ?? `Listen: ${text}`}
      title="Listen"
      onClick={(e) => {
        e.stopPropagation()
        void speak(text, { force: true })
      }}
    >
      🔊
    </button>
  )
}

export function HpBar({ value, max, color, label, flip }: { value: number; max: number; color?: string; label?: ReactNode; flip?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className={`hpbar ${flip ? 'flip' : ''}`}>
      {label && <div className="hpbar-label">{label}</div>}
      <div className="hpbar-track">
        <div className="hpbar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

/** Rows of a pixel bitmap ('#' = filled) → crisp SVG rects. */
function pixelRects(rows: string[], ch = '#') {
  const out: { x: number; y: number; w: number }[] = []
  rows.forEach((r, y) => {
    let x = 0
    while (x < r.length) {
      if (r[x] !== ch) {
        x++
        continue
      }
      let w = 1
      while (r[x + w] === ch) w++
      out.push({ x, y, w })
      x += w
    }
  })
  return out
}

const STAR_ROWS = ['....#....', '...###...', '#########', '.#######.', '..#####..', '..#####..', '.###.###.', '.##...##.', '#.......#']
const STAR_SHINE = ['.........', '....#....', '...#.....', '.........', '.........', '.........', '.........', '.........', '.........']
const HEART_ROWS = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...']
const HEART_SHINE = ['.......', '.#.....', '.......', '.......', '.......', '.......']

/** A crisp pixel star (uses currentColor). */
export function PixelStar({ on = true, size = 18 }: { on?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden>
      {pixelRects(STAR_ROWS).map((r, i) => (
        <rect key={`s${i}`} x={r.x + 1} y={r.y + 1} width={r.w} height={1} fill="#1a1423" />
      ))}
      {pixelRects(STAR_ROWS).map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill="currentColor" />
      ))}
      {on && pixelRects(STAR_SHINE).map((r, i) => <rect key={`h${i}`} x={r.x} y={r.y} width={r.w} height={1} fill="#fff8d6" />)}
    </svg>
  )
}

/** A crisp pixel heart. */
export function PixelHeart({ on = true, size = 18 }: { on?: boolean; size?: number }) {
  return (
    <svg width={size} height={(size * 6) / 7} viewBox="0 0 7 6" aria-hidden>
      {pixelRects(HEART_ROWS).map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={on ? '#ff4d5e' : '#2a2f5a'} />
      ))}
      {on && pixelRects(HEART_SHINE).map((r, i) => <rect key={`h${i}`} x={r.x} y={r.y} width={r.w} height={1} fill="#ffd0d6" />)}
    </svg>
  )
}

export function Hearts({ value, max }: { value: number; max: number }) {
  return (
    <span className="hearts" aria-label={`${value} of ${max} hearts`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? 'heart on' : 'heart'}>
          <PixelHeart on={i < value} />
        </span>
      ))}
    </span>
  )
}

export function Stars({ n, max = 3 }: { n: number; max?: number }) {
  return (
    <span className="stars" aria-label={`${n} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < n ? 'star on' : 'star'}>
          <PixelStar on={i < n} />
        </span>
      ))}
    </span>
  )
}

/** Header bar shared by every game. */
export function GameFrame({
  title,
  jp,
  onExit,
  right,
  children,
  className,
}: {
  title: string
  jp?: string
  onExit: () => void
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`game ${className ?? ''}`}>
      <header className="game-header">
        <button type="button" className="btn-icon" onClick={onExit} aria-label="Leave game" title="Leave">
          ✕
        </button>
        <div className="game-title">
          <T en={title} jp={jp ?? title} />
        </div>
        <div className="game-header-right">{right}</div>
      </header>
      <div className="game-body">{children}</div>
    </div>
  )
}

/** Progress pips (e.g. round 3 of 10). */
export function Progress({ value, max }: { value: number; max: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className="progress-fill" style={{ width: `${(value / Math.max(1, max)) * 100}%` }} />
    </div>
  )
}

/** Text input that converts romaji to kana as you type. */
export function KanaInput({
  value,
  onChange,
  onSubmit,
  mode = 'hiragana',
  placeholder,
  autoFocus,
  disabled,
  className,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit?: (v: string) => void
  mode?: 'hiragana' | 'katakana' | 'romaji'
  placeholder?: string
  autoFocus?: boolean
  disabled?: boolean
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])
  return (
    <input
      ref={ref}
      className={`kana-input ${className ?? ''}`}
      lang="ja"
      value={value}
      placeholder={placeholder ?? (mode === 'romaji' ? 'type…' : 'type romaji → かな')}
      disabled={disabled}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      onChange={(e) => {
        const raw = e.target.value
        if (mode === 'romaji') return onChange(raw)
        // Convert while typing, but keep a trailing lone "n" so "na" etc. still work.
        const conv = mode === 'katakana' ? wanakana.toKatakana(raw, { IMEMode: true }) : wanakana.toHiragana(raw, { IMEMode: true })
        onChange(conv)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onSubmit) {
          e.preventDefault()
          // Finalise a trailing "n" → ん on submit.
          const final = mode === 'romaji' ? value : mode === 'katakana' ? wanakana.toKatakana(value) : wanakana.toHiragana(value)
          onSubmit(final)
        }
      }}
    />
  )
}

/** Measures how long the player takes to answer the current prompt. */
export function useAnswerTimer(dep: unknown): () => number {
  const start = useRef(0)
  useEffect(() => {
    start.current = performance.now()
  }, [dep])
  return useCallback(() => Math.round(performance.now() - start.current), [])
}

export function useCountdown(seconds: number, running: boolean, onDone: () => void): number {
  const [left, setLeft] = useState(seconds)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    if (!running) return
    const end = Date.now() + left * 1000
    const id = setInterval(() => {
      const l = Math.max(0, Math.ceil((end - Date.now()) / 1000))
      setLeft(l)
      if (l <= 0) {
        clearInterval(id)
        done.current()
      }
    }, 200)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])
  return left
}

interface Particle {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  ch: string
}

/**
 * Spell burst particles using the player's equipped effect. Render `node`
 * inside a position:relative container and call `fire(xPct, yPct)`.
 */
export function useBurst(): [ReactNode, (x?: number, y?: number, count?: number) => void] {
  const p = usePlayer()
  const [parts, setParts] = useState<Particle[]>([])
  const nextId = useRef(0)
  const effect = EFFECTS.find((e) => e.id === p.effect) ?? EFFECTS[0]
  const fire = useCallback(
    (x = 50, y = 50, count = 12) => {
      const batch: Particle[] = Array.from({ length: count }, () => {
        const a = Math.random() * Math.PI * 2
        const d = 40 + Math.random() * 80
        return { id: nextId.current++, x, y, dx: Math.cos(a) * d, dy: Math.sin(a) * d, ch: effect.emoji[Math.floor(Math.random() * effect.emoji.length)] }
      })
      setParts((ps) => [...ps, ...batch])
      const ids = new Set(batch.map((b) => b.id))
      setTimeout(() => setParts((ps) => ps.filter((q) => !ids.has(q.id))), 900)
    },
    [effect],
  )
  const node = (
    <div className="burst-layer" aria-hidden>
      {parts.map((q) => (
        <span key={q.id} className="burst" style={{ left: `${q.x}%`, top: `${q.y}%`, ['--dx' as string]: `${q.dx}px`, ['--dy' as string]: `${q.dy}px` }}>
          {q.ch}
        </span>
      ))}
    </div>
  )
  return [node, fire]
}

/** Brief full-card flash for correct/incorrect feedback. */
export function useFlash(): [string, (kind: 'good' | 'bad') => void] {
  const [cls, setCls] = useState('')
  const flash = useCallback((kind: 'good' | 'bad') => {
    setCls('')
    requestAnimationFrame(() => setCls(kind === 'good' ? 'flash-good' : 'flash-bad shake'))
    setTimeout(() => setCls(''), 500)
  }, [])
  return [cls, flash]
}

/** Intro card shown before a game starts. */
export function Intro({ title, jp, lines, onStart, children }: { title: string; jp: string; lines: string[]; onStart: () => void; children?: ReactNode }) {
  return (
    <div className="intro card">
      <h2>
        <span lang="ja" className="intro-jp">
          {jp}
        </span>
        <span>{title}</span>
      </h2>
      <ul>
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      {children}
      <button type="button" className="btn btn-primary btn-lg" onClick={onStart} autoFocus>
        <T en="Begin" jp="はじめる" />
      </button>
    </div>
  )
}

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { GameResult } from '../types'
import type { Review } from '../../engine/srs'
import { sfx } from '../../engine/sfx'
import { useBurst } from '../../components/ui'

/** Keep a ref pointing at the latest value without writing it during render. */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  useLayoutEffect(() => {
    ref.current = value
  })
  return ref
}

// ─── Battle state hook ───────────────────────────────────────────────────

export type BattleStatus = 'intro' | 'fight' | 'phase' | 'won' | 'lost'

export interface BossConfig {
  maxHp: number
  hearts: number
  /** Boss HP values at which the next phase begins (descending), e.g. [8, 4]. */
  phaseAt: number[]
  onFinish: (r: GameResult) => void
  /** Called whenever a new question is needed (start, after each answer, after a phase change). */
  onNext: (phase: number) => void
}

export interface DamagePop {
  id: number
  text: string
  kind: 'boss' | 'player' | 'crit'
}

export interface ResolveOpts {
  damage?: number
  /** Item ids to record as the heroic blow if this answer defeats the boss. */
  heroic?: string[]
  /** How long to leave the feedback on screen before the next question (ms). */
  delay?: number
}

export interface Battle {
  hp: number
  maxHp: number
  hearts: number
  maxHearts: number
  phase: number
  phases: number
  status: BattleStatus
  /** True while feedback is showing — ignore input. */
  busy: boolean
  /** Increments every time a new question is requested (use as React key). */
  turn: number
  anim: { kind: '' | 'hit' | 'attack'; n: number }
  pops: DamagePop[]
  shaking: boolean
  burst: ReactNode
  start: () => void
  resolve: (ok: boolean, reviews: Review[], opts?: ResolveOpts) => void
}

export function useBossBattle(cfg: BossConfig): Battle {
  const cfgRef = useLatest(cfg)
  const [hp, setHp] = useState(cfg.maxHp)
  const [hearts, setHearts] = useState(cfg.hearts)
  const [phase, setPhase] = useState(0)
  const [status, setStatus] = useState<BattleStatus>('intro')
  const [busy, setBusy] = useState(false)
  const [turn, setTurn] = useState(0)
  const [anim, setAnim] = useState<Battle['anim']>({ kind: '', n: 0 })
  const [pops, setPops] = useState<DamagePop[]>([])
  const [shaking, setShaking] = useState(false)
  const [burst, fire] = useBurst()

  const live = useRef({ hp: cfg.maxHp, hearts: cfg.hearts, phase: 0, status: 'intro' as BattleStatus, busy: false })
  const log = useRef({ reviews: [] as Review[], correct: 0, total: 0 })
  const finished = useRef(false)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  const popId = useRef(0)

  useEffect(() => {
    const set = timers.current
    return () => {
      set.forEach(clearTimeout)
      set.clear()
    }
  }, [])

  const after = useCallback((ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
  }, [])

  const setSt = (s: BattleStatus) => {
    live.current.status = s
    setStatus(s)
  }
  const setBz = (b: boolean) => {
    live.current.busy = b
    setBusy(b)
  }

  const next = useCallback((ph: number) => {
    setTurn((t) => t + 1)
    cfgRef.current.onNext(ph)
  }, [cfgRef])

  const pop = useCallback(
    (text: string, kind: DamagePop['kind']) => {
      const id = popId.current++
      setPops((ps) => [...ps, { id, text, kind }])
      after(1100, () => setPops((ps) => ps.filter((p) => p.id !== id)))
    },
    [after],
  )

  const finish = useCallback((passed: boolean, heroic?: string[]) => {
    if (finished.current) return
    finished.current = true
    const { reviews, correct, total } = log.current
    cfgRef.current.onFinish({
      score: correct,
      maxScore: Math.max(1, total),
      passed,
      reviews,
      heroic: passed ? heroic : undefined,
      notes: [`${correct} / ${total} spells landed`],
    })
  }, [cfgRef])

  const start = useCallback(() => {
    if (live.current.status !== 'intro') return
    setSt('fight')
    next(0)
  }, [next])

  const resolve = useCallback(
    (ok: boolean, reviews: Review[], opts: ResolveOpts = {}) => {
      const L = live.current
      if (L.status !== 'fight' || L.busy || finished.current) return
      setBz(true)
      log.current.reviews.push(...reviews)
      log.current.total += 1
      if (ok) {
        log.current.correct += 1
        const dmg = opts.damage ?? 1
        const nhp = Math.max(0, L.hp - dmg)
        L.hp = nhp
        sfx.correct()
        after(120, () => {
          sfx.hit()
          setHp(nhp)
          setAnim((a) => ({ kind: 'hit', n: a.n + 1 }))
          pop(`-${dmg}`, dmg > 1 ? 'crit' : 'boss')
          fire(50, 38, 14)
        })
        if (nhp <= 0) {
          after(700, () => {
            setSt('won')
            sfx.win()
          })
          after(3000, () => finish(true, opts.heroic ?? reviews.map((r) => r.itemId)))
          return
        }
        const cfgNow = cfgRef.current
        const np = cfgNow.phaseAt.filter((t) => nhp <= t).length
        const delay = opts.delay ?? 950
        if (np > L.phase) {
          after(delay, () => {
            setSt('phase')
            sfx.levelUp()
          })
          after(delay + 2000, () => {
            L.phase = np
            setPhase(np)
            setSt('fight')
            setBz(false)
            next(np)
          })
        } else {
          after(delay, () => {
            setBz(false)
            next(L.phase)
          })
        }
      } else {
        sfx.wrong()
        const nh = Math.max(0, L.hearts - 1)
        L.hearts = nh
        after(350, () => {
          sfx.hurt()
          setHearts(nh)
          setAnim((a) => ({ kind: 'attack', n: a.n + 1 }))
          pop('-❤', 'player')
          setShaking(true)
          after(450, () => setShaking(false))
        })
        const delay = opts.delay ?? 2200
        if (nh <= 0) {
          after(delay, () => {
            setSt('lost')
            sfx.lose()
          })
          after(delay + 2200, () => finish(false))
        } else {
          after(delay, () => {
            setBz(false)
            next(L.phase)
          })
        }
      }
    },
    [after, cfgRef, finish, fire, next, pop],
  )

  return {
    hp,
    maxHp: cfg.maxHp,
    hearts,
    maxHearts: cfg.hearts,
    phase,
    phases: cfg.phaseAt.length + 1,
    status,
    busy,
    turn,
    anim,
    pops,
    shaking,
    burst,
    start,
    resolve,
  }
}

/** Number-key shortcuts (1–9) for a list of choices; ignored while typing in inputs. */
export function useNumberKeys(count: number, onKey: (i: number) => void, enabled: boolean) {
  const cb = useLatest(onKey)
  useEffect(() => {
    if (!enabled) return
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number(e.key)
      if (Number.isInteger(n) && n >= 1 && n <= count) {
        e.preventDefault()
        cb.current(n - 1)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [count, enabled, cb])
}

/** Global key handler (ignored while typing in inputs). Enter on a focused button is intercepted too. */
export function useKey(key: string, fn: () => void, enabled: boolean) {
  const cb = useLatest(fn)
  useEffect(() => {
    if (!enabled) return
    const h = (e: KeyboardEvent) => {
      if (e.key !== key || e.repeat) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      e.preventDefault()
      cb.current()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [key, enabled, cb])
}

/** Does this device have a fine pointer (desktop)? Used to decide autofocus. */
export function hasFinePointer(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: fine)').matches
}

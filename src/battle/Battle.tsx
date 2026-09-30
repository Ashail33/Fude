/**
 * Random-encounter battle: a Dragon-Quest-style first-person fight where
 * every command is language. たたかう = a timed word challenge, まほう = build
 * or type an incantation, どうぐ = items from the bag, にげる = run.
 *
 * Rendered by the overworld as a full-screen overlay (not a route) so the
 * player's position is kept. Pure rules live in ./logic.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { EnemySprite } from '../art'
import { PixelSprite, spriteCanvas } from '../art'
import { KanaInput } from '../components/ui'
import { ELEMENT_SPELLS } from '../data/sentences'
import { ELEMENT_WORD, checkIncantation } from '../games/incantation'
import { item } from '../engine/items'
import { playJingle, playMusic } from '../engine/music'
import { sfx } from '../engine/sfx'
import { canSpeak, speak } from '../engine/speech'
import { addItem, getState, grantRewards, immersionOf, level, recordReviews, usePlayer, type ImmersionLevel } from '../engine/store'
import Backdrop from './Backdrop'
import { ITEMS, ITEM_BY_ID } from './items'
import {
  SPELL_COST,
  availableSpells,
  battleRewards,
  checkReading,
  clampRegion,
  createBattle,
  judge,
  nextQuestion,
  resolveFight,
  resolveItem,
  resolveRun,
  resolveSpell,
  retarget,
  rollEnemies,
  type BattleEvent,
  type BattleState,
  type Element,
  type Line,
  type Question,
  type Rewards,
} from './logic'
import { bsfx } from './sound'
import './Battle.css'

export type BattleOutcome = 'win' | 'lose' | 'flee'

export interface BattleProps {
  /** Region 1–5: picks the enemy pool and the vocabulary used. */
  region: number
  /** Specific enemies (1–3); otherwise chosen from the region pool. */
  enemies?: EnemySprite[]
  onEnd: (outcome: BattleOutcome) => void
}

type Phase = 'intro' | 'busy' | 'command' | 'target' | 'question' | 'spells' | 'incant' | 'items' | 'end'
type Act = 'fight' | 'magic'

interface Fx {
  id: number
  kind: 'dmg' | 'spark' | 'slash' | 'ring' | 'kanji' | 'heal'
  x: number
  y: number
  text?: string
  color?: string
  dx?: number
  dy?: number
  size?: number
  crit?: boolean
}

interface Tile {
  id: number
  text: string
}

const COMMANDS: { id: 'fight' | 'magic' | 'items' | 'run'; jp: string; en: string }[] = [
  { id: 'fight', jp: 'たたかう', en: 'Fight' },
  { id: 'magic', jp: 'まほう', en: 'Magic' },
  { id: 'items', jp: 'どうぐ', en: 'Items' },
  { id: 'run', jp: 'にげる', en: 'Run' },
]

const EL_COLOR: Record<Element, string> = Object.fromEntries(ELEMENT_SPELLS.map((e) => [e.element, e.color])) as Record<Element, string>
const EL_NOUN: Record<Element, string> = Object.fromEntries(ELEMENT_SPELLS.map((e) => [e.element, e.noun])) as Record<Element, string>
/** An adjective that suits each element, offered as an optional bonus tile. */
const EL_ADJ: Record<Element, string> = { fire: '熱い', water: '冷たい', wood: '大きい', earth: '強い', light: '明るい', wind: '速い' }

const KIND_TITLE: Record<Question['kind'], Line> = {
  meaning: { jp: 'この ことばの いみは？', en: 'What does this word mean?' },
  reverse: { jp: '日本語で なんと いう？', en: 'Which is the Japanese?' },
  reading: { jp: 'よみかたを 入力せよ！', en: 'Type the reading!' },
  listen: { jp: 'よく きいて えらべ！', en: 'Listen and choose!' },
}

/** Monsters stand this far (fraction of the field height) above the windows. */
const ENEMY_BOTTOM = 0.16
/** Native sprite width (32, or 64 for the dragon). */
function spriteWidth(id: EnemySprite): number {
  try {
    return spriteCanvas(id).width
  } catch {
    return id === 'dragon' ? 64 : 32
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const hasKanji = (s: string) => /[一-龯々]/.test(s)

/** Japanese line with English according to the immersion level. */
function Bi({ line, imm, block }: { line: Line; imm: ImmersionLevel; block?: boolean }) {
  const cls = block ? 'bt-bi bt-bi-block' : 'bt-bi'
  if (imm >= 3) return <span lang="ja">{line.jp}</span>
  if (imm === 2)
    return (
      <span lang="ja" title={line.en}>
        {line.jp}
      </span>
    )
  return (
    <span className={cls}>
      <span lang="ja">{line.jp}</span>
      <small className={imm === 1 ? 'bt-en-sm' : 'bt-en'}>{line.en}</small>
    </span>
  )
}

function Ruby({ text, reading }: { text: string; reading?: string }) {
  if (!reading || reading === text || !hasKanji(text)) return <span lang="ja">{text}</span>
  return (
    <ruby lang="ja">
      {text}
      <rt>{reading}</rt>
    </ruby>
  )
}

function Bar({ value, max, kind }: { value: number; max: number; kind: 'hp' | 'mp' }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  return (
    <span className={`bt-bar bt-bar-${kind} ${kind === 'hp' && pct <= 25 ? 'low' : ''}`}>
      <span style={{ width: `${pct}%` }} />
    </span>
  )
}

export default function Battle({ region, enemies, onEnd }: BattleProps) {
  const player = usePlayer()
  const imm = immersionOf(player)
  const reg = clampRegion(region)
  const isBoss = !!enemies?.includes('dragon')

  const initial = useMemo(() => {
    const s = getState()
    const ids = enemies?.length ? enemies.slice(0, 3) : rollEnemies(reg)
    return createBattle(reg, level(s), ids, s.name || 'あなた')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const truth = useRef<BattleState>(initial)
  const [view, setView] = useState<BattleState>(initial)
  const [phase, setPhase] = useState<Phase>('intro')
  const [cursor, setCursor] = useState(0)
  const lastCmd = useRef(0)
  const [efx, setEfx] = useState<string[]>(() => initial.enemies.map(() => 'enter'))
  const [flashing, setFlashing] = useState<boolean[]>(() => initial.enemies.map(() => false))
  const [lines, setLines] = useState<Line[]>([])
  const [typed, setTyped] = useState(0)
  const [fx, setFx] = useState<Fx[]>([])
  const [shake, setShake] = useState('')
  const [hitstop, setHitstop] = useState(false)
  const [screenFlash, setScreenFlash] = useState('')
  const [hurt, setHurt] = useState(false)
  const [chant, setChant] = useState<{ text: string; color: string } | null>(null)
  const [fade, setFade] = useState<'' | 'out' | 'dark'>('')
  const [banner, setBanner] = useState<Line | null>(null)
  /** Weaknesses discovered this battle (shown on the name tags). */
  const [weakSeen, setWeakSeen] = useState<Record<number, Element>>({})

  // Action context
  const [act, setAct] = useState<Act>('fight')
  const [target, setTarget] = useState(0)
  const [spellEl, setSpellEl] = useState<Element>('fire')

  // Question
  const [q, setQ] = useState<Question | null>(null)
  const [picked, setPicked] = useState<number | null>(null)
  const [reveal, setReveal] = useState<null | { correct: boolean; timeout?: boolean }>(null)
  const [typedAns, setTypedAns] = useState('')
  const qStart = useRef(0)
  const qDone = useRef(false)
  const timerRef = useRef<HTMLSpanElement>(null)
  const recent = useRef<string[]>([])
  const answered = useRef<{ jp: string; kana: string; en: string; correct: boolean }[]>([])

  // Incantation
  const [tiles, setTiles] = useState<Tile[]>([])
  const [built, setBuilt] = useState<number[]>([])
  const [typeMode, setTypeMode] = useState(false)
  const [incText, setIncText] = useState('')
  const [castFb, setCastFb] = useState<{ ok: boolean; text: string; hint?: string } | null>(null)

  // End
  const [end, setEnd] = useState<null | { kind: 'win' | 'lose'; rewards?: Rewards; levelUp?: number }>(null)

  const rootRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const enemyRefs = useRef<(HTMLButtonElement | null)[]>([])
  const statusRef = useRef<HTMLDivElement>(null)
  const mounted = useRef(true)
  const ended = useRef(false)
  const endOnce = (o: BattleOutcome) => {
    if (ended.current) return
    ended.current = true
    onEnd(o)
  }
  const skipRef = useRef<(() => void) | null>(null)
  const fxId = useRef(0)
  const [fieldSize, setFieldSize] = useState({ w: 390, h: 400 })

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useLayoutEffect(() => {
    const el = fieldRef.current
    if (!el) return
    const measure = () => setFieldSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const listenOk = canSpeak() && player.settings.voice
  const spells = useMemo(() => availableSpells(player.spells, reg), [player.spells, reg])
  const bagItems = ITEMS.filter((i) => (player.bag?.[i.id] ?? 0) > 0)

  // ─── Sprite scale ────────────────────────────────────────────────────
  const n = view.enemies.length
  const spriteSize = Math.max(32, ...view.enemies.map((e) => spriteWidth(e.def.id)))
  const scale = useMemo(() => {
    const byW = (fieldSize.w * 0.92) / (n * spriteSize * 1.12)
    const byH = (fieldSize.h * 0.44) / spriteSize
    return Math.max(2, Math.min(8, Math.floor(Math.min(byW, byH))))
  }, [fieldSize, n, spriteSize])

  // The ground line sits a little behind the monsters' feet (above the name tags).
  const rootH = rootRef.current?.clientHeight || fieldSize.h + 290
  const horizon = Math.round(((fieldSize.h * (1 - ENEMY_BOTTOM) - 34 - scale * spriteSize * 0.3) / rootH) * 100) / 100

  // ─── FX helpers ──────────────────────────────────────────────────────
  const addFx = useCallback((items: Omit<Fx, 'id'>[], life = 900) => {
    const withIds = items.map((f) => ({ ...f, id: fxId.current++ }))
    setFx((cur) => [...cur, ...withIds])
    const ids = new Set(withIds.map((f) => f.id))
    setTimeout(() => mounted.current && setFx((cur) => cur.filter((f) => !ids.has(f.id))), life)
  }, [])

  const enemyCenter = (i: number) => {
    const el = enemyRefs.current[i]?.querySelector('canvas')
    const root = rootRef.current
    if (!el || !root) return { x: fieldSize.w / 2, y: fieldSize.h / 2, h: 64 }
    const a = el.getBoundingClientRect()
    const b = root.getBoundingClientRect()
    return { x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height / 2, h: a.height }
  }

  const statusCenter = () => {
    const el = statusRef.current
    const root = rootRef.current
    if (!el || !root) return { x: 100, y: 40 }
    const a = el.getBoundingClientRect()
    const b = root.getBoundingClientRect()
    return { x: a.left - b.left + a.width * 0.6, y: a.top - b.top + a.height / 2 }
  }

  const sparks = (x: number, y: number, color: string, count = 14, spread = 90) =>
    Array.from({ length: count }, () => {
      const a = Math.random() * Math.PI * 2
      const d = spread * (0.35 + Math.random() * 0.75)
      return { kind: 'spark' as const, x, y, color, dx: Math.cos(a) * d, dy: Math.sin(a) * d - 20, size: 3 + Math.floor(Math.random() * 3) * 2 }
    })

  const doShake = async (kind: 'small' | 'big', ms = 320) => {
    setShake('')
    await sleep(16)
    setShake(kind)
    setTimeout(() => mounted.current && setShake(''), ms)
  }

  const doFlash = async (color: string, ms = 120) => {
    setScreenFlash(color)
    await sleep(ms)
    setScreenFlash('')
  }

  const flashEnemy = async (i: number) => {
    for (let k = 0; k < 3; k++) {
      setFlashing((f) => f.map((v, j) => (j === i ? true : v)))
      await sleep(55)
      setFlashing((f) => f.map((v, j) => (j === i ? false : v)))
      await sleep(45)
    }
  }

  const setEnemyFx = (i: number, cls: string) => setEfx((cur) => cur.map((c, j) => (j === i ? cls : c)))

  // ─── Message window (typewriter) ─────────────────────────────────────
  const waitOrSkip = (ms: number) =>
    new Promise<void>((res) => {
      const t = setTimeout(() => {
        skipRef.current = null
        res()
      }, ms)
      skipRef.current = () => {
        clearTimeout(t)
        skipRef.current = null
        res()
      }
    })

  const say = async (line: Line, hold = 650) => {
    const chars = [...line.jp]
    setLines((cur) => [...cur.slice(-1), line])
    setTyped(0)
    let skip = false
    skipRef.current = () => {
      skip = true
    }
    for (let i = 1; i <= chars.length; i++) {
      if (!mounted.current) return
      if (skip) {
        setTyped(chars.length)
        break
      }
      setTyped(i)
      if (i % 2 === 1 && chars[i - 1] !== ' ') bsfx.blip()
      await sleep(26)
    }
    skipRef.current = null
    await waitOrSkip(hold)
  }

  // ─── Event playback ──────────────────────────────────────────────────
  const play = async (events: BattleEvent[]) => {
    for (const ev of events) {
      if (!mounted.current) return
      switch (ev.t) {
        case 'msg':
          await say(ev.line)
          break
        case 'strike': {
          const c = enemyCenter(ev.target)
          if (ev.element) {
            const col = EL_COLOR[ev.element]
            bsfx.spell(ev.element)
            addFx([{ kind: 'kanji', x: c.x, y: c.y, text: EL_NOUN[ev.element], color: col }], 900)
            await sleep(380)
            addFx([{ kind: 'ring', x: c.x, y: c.y, color: col, size: c.h }, ...sparks(c.x, c.y, col, ev.eff === 'weak' ? 26 : 16, ev.eff === 'weak' ? 140 : 90)], 900)
            if (ev.eff === 'weak') {
              const el = ev.element
              setWeakSeen((w) => ({ ...w, [ev.target]: el }))
              bsfx.weak()
              void doFlash(col, 110)
            }
          } else {
            bsfx.slash()
            addFx([{ kind: 'slash', x: c.x, y: c.y, size: c.h, crit: ev.crit }], 500)
            if (ev.crit) {
              bsfx.crit()
              void doFlash('#ffffff', 90)
            } else bsfx.hit()
            await sleep(120)
          }
          setHitstop(true)
          await sleep(ev.crit || ev.eff === 'weak' ? 140 : 80)
          setHitstop(false)
          setEnemyFx(ev.target, 'hit')
          void doShake(ev.crit || ev.eff === 'weak' ? 'big' : 'small')
          addFx([{ kind: 'dmg', x: c.x, y: c.y - c.h * 0.3, text: String(ev.dmg), crit: ev.crit || ev.eff === 'weak', color: ev.element ? EL_COLOR[ev.element] : ev.crit ? '#f7c948' : undefined }], 1100)
          if (!ev.element) addFx(sparks(c.x, c.y, ev.crit ? '#f7c948' : '#f4ecd8', ev.crit ? 18 : 10, ev.crit ? 120 : 70), 800)
          setView((v) => ({
            ...v,
            player: ev.element ? { ...v.player, mp: Math.max(0, v.player.mp - SPELL_COST) } : v.player,
            enemies: v.enemies.map((e, j) => (j === ev.target ? { ...e, hp: Math.max(0, e.hp - ev.dmg) } : e)),
          }))
          await flashEnemy(ev.target)
          setEnemyFx(ev.target, '')
          break
        }
        case 'miss': {
          bsfx.miss()
          setEnemyFx(ev.target, 'dodge')
          const c = enemyCenter(ev.target)
          addFx([{ kind: 'dmg', x: c.x, y: c.y - c.h * 0.3, text: 'MISS', color: '#a9adc7' }], 900)
          await sleep(420)
          setEnemyFx(ev.target, '')
          break
        }
        case 'enemyDie': {
          const c = enemyCenter(ev.target)
          bsfx.enemyDie()
          setEnemyFx(ev.target, 'dying')
          addFx(sparks(c.x, c.y, '#f7c948', 12, 110), 1000)
          await sleep(200)
          addFx(sparks(c.x, c.y - c.h * 0.2, '#ffffff', 14, 80), 1000)
          await sleep(350)
          setEnemyFx(ev.target, 'dead')
          break
        }
        case 'enemyAct': {
          const i = ev.enemy
          setEnemyFx(i, ev.skill ? 'lunge big' : 'lunge')
          await sleep(220)
          if (ev.blocked) {
            const s = statusCenter()
            bsfx.heal()
            addFx([{ kind: 'ring', x: s.x, y: s.y, color: '#f7c948', size: 80 }, ...sparks(s.x, s.y, '#f7c948', 10, 60)], 900)
          } else {
            bsfx.hurt()
            sfx.hurt()
            setHurt(true)
            void doShake('big', 400)
            void doFlash('rgba(226,67,47,0.55)', 140)
            const s = statusCenter()
            addFx([{ kind: 'dmg', x: s.x, y: s.y + 18, text: String(ev.dmg), color: '#ff6b5a' }, ...sparks(s.x - 40, s.y, '#ff6b5a', ev.skill ? 16 : 10, 80)], 1100)
            setView((v) => ({ ...v, player: { ...v.player, hp: Math.max(0, v.player.hp - ev.dmg) } }))
            setTimeout(() => mounted.current && setHurt(false), 420)
          }
          await sleep(260)
          setEnemyFx(i, '')
          break
        }
        case 'enemyIdle':
          setEnemyFx(ev.enemy, 'idle-bounce')
          await sleep(300)
          setEnemyFx(ev.enemy, '')
          break
        case 'heal': {
          const s = statusCenter()
          bsfx.heal()
          addFx([...sparks(s.x, s.y, ev.mp ? '#7fc4f0' : '#8fe07a', 14, 70), { kind: 'heal', x: s.x, y: s.y, text: `+${ev.hp || ev.mp}`, color: ev.mp ? '#7fc4f0' : '#8fe07a' }], 1000)
          setView((v) => ({ ...v, player: { ...v.player, hp: Math.min(v.player.maxHp, v.player.hp + ev.hp), mp: Math.min(v.player.maxMp, v.player.mp + ev.mp) } }))
          break
        }
        case 'shield': {
          const s = statusCenter()
          bsfx.heal()
          addFx([{ kind: 'ring', x: s.x, y: s.y, color: '#f7c948', size: 90 }, ...sparks(s.x, s.y, '#f7c948', 16, 80)], 1000)
          break
        }
        case 'fled':
          bsfx.run()
          break
        case 'runFail':
          sfx.wrong()
          break
        case 'win':
        case 'lose':
          break
      }
    }
  }

  // ─── Flow ────────────────────────────────────────────────────────────
  const toCommand = () => {
    if (!mounted.current) return
    setLines([{ jp: 'どうする？', en: 'What will you do?' }])
    setTyped(99)
    setCursor(lastCmd.current)
    setPhase('command')
  }

  const commit = (s: BattleState) => {
    truth.current = s
  }

  const finish = async () => {
    const s = truth.current
    setView(s)
    if (s.outcome === 'win') return victory()
    if (s.outcome === 'lose') return defeat()
    if (s.outcome === 'flee') return fled()
    toCommand()
  }

  const runStep = async (step: { state: BattleState; events: BattleEvent[] }) => {
    setPhase('busy')
    setLines([])
    commit(step.state)
    await play(step.events)
    await finish()
  }

  const victory = async () => {
    setPhase('busy')
    const before = level(getState())
    const rw = battleRewards(truth.current)
    grantRewards(rw.xp, rw.shards)
    if (rw.drop) addItem(rw.drop, 1)
    const after = level(getState())
    playJingle('victory')
    sfx.win()
    const es = truth.current.enemies
    setLines([])
    await say(
      es.length === 1 ? { jp: `${es[0].name}を やっつけた！`, en: `You defeated ${es[0].nameEn}!` } : { jp: 'まものたちを やっつけた！', en: 'You defeated the monsters!' },
    )
    await say({ jp: `${rw.xp}ポイントの けいけんちを かくとく！`, en: `Gained ${rw.xp} XP!` })
    await say({ jp: `ことだまを ${rw.shards}こ 手に入れた！`, en: `Found ${rw.shards} spirit shards!` })
    if (rw.drop) {
      const it = ITEM_BY_ID.get(rw.drop)
      const src = es.find((e) => e.def.drops.includes(rw.drop!)) ?? es[0]
      if (it) await say({ jp: `${src.name}は ${it.jp}を おとしていった！`, en: `${src.nameEn} dropped a ${it.name}!` })
    }
    if (after > before) {
      sfx.levelUp()
      setBanner({ jp: 'レベルアップ！', en: 'Level up!' })
      const c = { x: fieldSize.w / 2, y: fieldSize.h * 0.4 }
      addFx([...sparks(c.x, c.y, '#f7c948', 24, 160), ...sparks(c.x, c.y, '#ffffff', 16, 120)], 1200)
      await say({ jp: `${truth.current.player.name}の レベルが ${after}に あがった！`, en: `${truth.current.player.name} reached level ${after}!` }, 900)
    }
    setEnd({ kind: 'win', rewards: rw, levelUp: after > before ? after : undefined })
    setCursor(0)
    setPhase('end')
  }

  const defeat = async () => {
    setPhase('busy')
    sfx.lose()
    setFade('dark')
    await sleep(1400)
    setEnd({ kind: 'lose' })
    setPhase('end')
  }

  const fled = async () => {
    setPhase('busy')
    await say({ jp: 'うまく にげきれた！', en: 'You got away safely!' }, 500)
    setFade('out')
    await sleep(450)
    if (mounted.current) endOnce('flee')
  }

  // Intro
  useEffect(() => {
    playMusic(isBoss ? 'boss' : 'battle')
    bsfx.intro()
    let cancelled = false
    ;(async () => {
      await sleep(650)
      if (cancelled) return
      setEfx((cur) => cur.map(() => ''))
      await sleep(250)
      const es = initial.enemies
      await say(
        es.length === 1
          ? { jp: `${es[0].name}が あらわれた！`, en: `${es[0].nameEn} appeared!` }
          : new Set(es.map((e) => e.def.id)).size === 1
            ? { jp: `${es[0].def.jp}の むれが あらわれた！`, en: `A pack of ${es[0].def.en}s appeared!` }
            : { jp: 'まものの むれが あらわれた！', en: 'A band of monsters appeared!' },
        800,
      )
      if (!cancelled) toCommand()
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Commands ────────────────────────────────────────────────────────
  const livingIdx = () => view.enemies.map((e, i) => (e.hp > 0 ? i : -1)).filter((i) => i >= 0)

  const chooseTarget = (a: Act, el?: Element) => {
    setAct(a)
    if (el) setSpellEl(el)
    const living = livingIdx()
    if (living.length === 1) return begin(a, living[0], el)
    setCursor(Math.max(0, living.indexOf(retarget(truth.current, target))))
    setPhase('target')
  }

  const begin = (a: Act, t: number, el?: Element) => {
    setTarget(t)
    if (a === 'fight') startQuestion()
    else startIncant(el ?? spellEl)
  }

  const command = async (i: number) => {
    const c = COMMANDS[i]
    lastCmd.current = i
    bsfx.confirm()
    if (c.id === 'fight') return chooseTarget('fight')
    if (c.id === 'magic') {
      setCursor(0)
      setPhase('spells')
      return
    }
    if (c.id === 'items') {
      if (!bagItems.length) {
        setPhase('busy')
        setLines([])
        await say({ jp: 'どうぐを なにも もっていない。', en: "You don't have any items." })
        return toCommand()
      }
      setCursor(0)
      setPhase('items')
      return
    }
    if (isBoss) {
      setPhase('busy')
      setLines([])
      await say({ jp: 'にげられない！', en: "You can't run!" })
      return toCommand()
    }
    await runStep(resolveRun(truth.current))
  }

  const castSpell = async (i: number) => {
    const sp = spells[i]
    if (!sp) return
    if (view.player.mp < SPELL_COST) {
      bsfx.cancel()
      setPhase('busy')
      setLines([])
      await say({ jp: 'MPが たりない！', en: 'Not enough MP!' })
      return toCommand()
    }
    bsfx.confirm()
    chooseTarget('magic', sp.element)
  }

  const applyItem = async (i: number) => {
    const it = bagItems[i]
    if (!it) return
    bsfx.confirm()
    if (it.effect.kind === 'flee' && isBoss) {
      setPhase('busy')
      setLines([])
      await say({ jp: 'けむりが はれてしまった… にげられない！', en: "The smoke clears… you can't escape!" })
      return toCommand()
    }
    addItem(it.id, -1)
    await runStep(resolveItem(truth.current, it.id))
  }

  // ─── Word challenge (たたかう) ─────────────────────────────────────────
  const startQuestion = () => {
    const nq = nextQuestion(reg, getState().srs, { listen: listenOk, avoid: recent.current })
    recent.current = [...recent.current.slice(-5), nq.word.id]
    setQ(nq)
    setPicked(null)
    setReveal(null)
    setTypedAns('')
    setCursor(0)
    qDone.current = false
    qStart.current = performance.now()
    setLines([])
    setPhase('question')
    if (nq.kind === 'listen') void speak(nq.word.kana)
  }

  const answer = async (choice: number | string | null) => {
    if (!q || qDone.current) return
    qDone.current = true
    const ms = Math.round(performance.now() - qStart.current)
    let ok = false
    if (typeof choice === 'number') {
      setPicked(choice)
      ok = choice === q.answer
    } else if (typeof choice === 'string') ok = checkReading(q.word, choice)
    const j = judge(q, ok, ms)
    recordReviews([{ itemId: q.itemId, correct: j.correct, ms }])
    answered.current.push({ jp: q.word.jp, kana: q.word.kana, en: q.word.en, correct: j.correct })
    setReveal({ correct: j.correct, timeout: choice === null })
    if (j.correct) sfx.correct()
    else sfx.wrong()
    void speak(q.word.kana)
    await sleep(j.correct ? (j.crit ? 650 : 520) : 1900)
    if (!mounted.current) return
    await runStep(resolveFight(truth.current, target, j))
  }

  // Timer bar (rAF writes straight to the DOM; no per-frame React renders).
  useEffect(() => {
    if (phase !== 'question' || !q) return
    let raf = 0
    const tick = () => {
      const el = timerRef.current
      const t = performance.now() - qStart.current
      if (el && !qDone.current) {
        const left = Math.max(0, 1 - t / q.limitMs)
        el.style.transform = `scaleX(${left})`
        el.dataset.zone = t <= q.critMs ? 'crit' : left < 0.25 ? 'late' : 'ok'
      }
      if (!qDone.current && t >= q.limitMs) {
        void answer(null)
        return
      }
      if (!qDone.current) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, q])

  // ─── Incantation (まほう) ─────────────────────────────────────────────
  const startIncant = (el: Element) => {
    const noun = EL_NOUN[el]
    const words = [noun, 'の', 'まほう', 'を', '使います', 'に']
    if (reg >= 2) words.push('が')
    if (reg >= 3) words.push(EL_ADJ[el], '食べます')
    const shuffled = words.map((text, id) => ({ id, text, k: Math.random() })).sort((a, b) => a.k - b.k)
    setTiles(shuffled.map(({ id, text }) => ({ id, text })))
    setBuilt([])
    setIncText('')
    setCastFb(null)
    setCursor(0)
    setLines([])
    setPhase('incant')
  }

  const incantString = typeMode ? incText : built.map((id) => tiles.find((t) => t.id === id)?.text ?? '').join('')

  const cast = async (raw?: string) => {
    const text = (raw ?? incantString).trim()
    if (!text) {
      bsfx.cancel()
      return
    }
    const res = checkIncantation(text)
    const el = res.element
    const known = !!el && spells.some((s) => s.element === el)
    const valid = res.valid && known
    if (el) recordReviews([{ itemId: item.word(ELEMENT_WORD[el]), correct: valid }])
    setPhase('busy')
    if (!valid) {
      sfx.wrong()
      const example = `${EL_NOUN[spellEl]}のまほう ／ ${EL_NOUN[spellEl]}を使います`
      setCastFb({ ok: false, text: el && !known ? "You haven't learned that element yet." : res.feedback, hint: example })
      await sleep(2600)
      setCastFb(null)
      return runStep(resolveSpell(truth.current, target, spellEl, { valid: false }))
    }
    bsfx.confirm()
    setCastFb({ ok: true, text: res.canonical ?? text })
    void speak(res.canonical ?? text)
    setChant({ text: res.canonical ?? text, color: EL_COLOR[el!] })
    await sleep(900)
    setCastFb(null)
    setChant(null)
    await runStep(resolveSpell(truth.current, target, el!, { valid: true, bonus: res.adjective ? 0.25 : 0 }))
  }

  // ─── Input: keyboard ─────────────────────────────────────────────────
  const confirmKeys = ['z', 'Z', 'Enter', ' ']
  const cancelKeys = ['x', 'X', 'Escape', 'Backspace']
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {})
  keyRef.current = (e: KeyboardEvent) => {
    const inInput = (e.target as HTMLElement)?.tagName === 'INPUT'
    if (inInput && e.key !== 'Escape') return
    const k = e.key
    const isConfirm = confirmKeys.includes(k)
    const isCancel = cancelKeys.includes(k)
    const move = (dx: number, dy: number, count: number, cols: number) => {
      if (count <= 0) return
      let c = cursor
      if (cols > 1) {
        const col = c % cols
        const row = Math.floor(c / cols)
        const rows = Math.ceil(count / cols)
        c = ((row + dy + rows) % rows) * cols + ((col + dx + cols) % cols)
        if (c >= count) c = count - 1
      } else c = (c + dy + dx + count) % count
      if (c !== cursor) bsfx.cursor()
      setCursor(c)
    }
    const dir = { ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0], ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1] }[k] as [number, number] | undefined

    if (phase === 'busy' || phase === 'intro') {
      if (isConfirm && skipRef.current) {
        e.preventDefault()
        skipRef.current()
      }
      return
    }
    if (phase === 'command') {
      if (dir) return move(dir[0], dir[1], 4, 2)
      if (isConfirm) {
        e.preventDefault()
        return void command(cursor)
      }
    }
    if (phase === 'target') {
      const living = livingIdx()
      if (dir) return move(dir[0] + dir[1], 0, living.length, 1)
      if (isConfirm) {
        e.preventDefault()
        bsfx.confirm()
        return begin(act, living[cursor] ?? living[0])
      }
      if (isCancel) {
        bsfx.cancel()
        return act === 'magic' ? setPhase('spells') : toCommand()
      }
    }
    if (phase === 'question' && q && q.kind !== 'reading' && !qDone.current) {
      const num = Number(k)
      if (num >= 1 && num <= q.choices.length) return void answer(num - 1)
      if (dir) return move(dir[0], dir[1], q.choices.length, 2)
      if (isConfirm) {
        e.preventDefault()
        return void answer(cursor)
      }
    }
    if (phase === 'spells') {
      if (dir) return move(dir[0], dir[1], spells.length, 2)
      if (isConfirm) {
        e.preventDefault()
        return void castSpell(cursor)
      }
      if (isCancel) {
        bsfx.cancel()
        return toCommand()
      }
    }
    if (phase === 'items') {
      if (dir) return move(dir[0], dir[1], bagItems.length, 1)
      if (isConfirm) {
        e.preventDefault()
        return void applyItem(cursor)
      }
      if (isCancel) {
        bsfx.cancel()
        return toCommand()
      }
    }
    if (phase === 'incant' && !typeMode) {
      const count = tiles.length + 1 // + cast button
      if (dir) return move(dir[0], dir[1], count, Math.min(4, count))
      if (isConfirm) {
        e.preventDefault()
        if (cursor >= tiles.length) return void cast()
        const t = tiles[cursor]
        if (t) toggleTile(t.id)
        return
      }
      if (isCancel) {
        e.preventDefault()
        if (built.length) {
          bsfx.cancel()
          return setBuilt((b) => b.slice(0, -1))
        }
        bsfx.cancel()
        return setPhase('spells')
      }
    }
    if (phase === 'incant' && typeMode && k === 'Escape') {
      bsfx.cancel()
      return setPhase('spells')
    }
    if (phase === 'end' && isConfirm) {
      e.preventDefault()
      endBattle()
    }
  }
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const toggleTile = (id: number) => {
    bsfx.cursor()
    setBuilt((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]))
  }

  const endBattle = () => {
    if (!end) return
    bsfx.confirm()
    setFade('out')
    setTimeout(() => endOnce(end.kind === 'win' ? 'win' : 'lose'), 380)
  }

  // Auto-continue after a defeat so the overworld can take over.
  useEffect(() => {
    if (end?.kind !== 'lose') return
    const t = setTimeout(() => endOnce('lose'), 5000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end])

  // ─── Render ──────────────────────────────────────────────────────────
  const p = view.player
  const hpLow = p.hp / p.maxHp <= 0.25
  const living = livingIdx()
  const targetIdx = phase === 'target' ? living[cursor] : phase === 'question' || phase === 'incant' ? target : -1

  const onRootPointer = () => {
    if ((phase === 'busy' || phase === 'intro') && skipRef.current) skipRef.current()
  }

  const renderMessage = () => {
    const last = lines.length - 1
    return (
      <div className="bt-win bt-msg" aria-live="polite">
        {lines.map((l, i) => {
          const full = i < last || typed >= [...l.jp].length
          const shown = i < last ? l.jp : [...l.jp].slice(0, typed).join('')
          return (
            <div key={i + l.jp} className="bt-line">
              <span lang="ja">{shown}</span>
              {full && imm <= 1 && <small className={imm === 1 ? 'bt-en-sm' : 'bt-en'}>{l.en}</small>}
              {full && imm === 2 && <small className="bt-en-sm bt-en-tap">{l.en}</small>}
            </div>
          )
        })}
        {phase === 'busy' && lines.length > 0 && typed >= [...(lines[last]?.jp ?? '')].length && <span className="bt-more">▼</span>}
      </div>
    )
  }

  let panel: ReactNode = null
  if (phase === 'command') {
    panel = (
      <div className="bt-win bt-cmd" role="menu">
        <div className="bt-cmd-title">
          <span lang="ja">{p.name}</span>
        </div>
        <div className="bt-grid2">
          {COMMANDS.map((c, i) => (
            <button key={c.id} type="button" role="menuitem" className={`bt-opt ${cursor === i ? 'sel' : ''}`} onMouseEnter={() => setCursor(i)} onClick={() => void command(i)}>
              <span className="bt-cur">▶</span>
              <Bi line={c} imm={imm} />
            </button>
          ))}
        </div>
      </div>
    )
  } else if (phase === 'target') {
    panel = (
      <div className="bt-win bt-list">
        <div className="bt-panel-title">
          <Bi line={{ jp: 'だれを ねらう？', en: 'Choose a target' }} imm={imm} />
        </div>
        {living.map((i, k) => (
          <button key={i} type="button" className={`bt-opt ${cursor === k ? 'sel' : ''}`} onMouseEnter={() => setCursor(k)} onClick={() => begin(act, i)}>
            <span className="bt-cur">▶</span>
            <span lang="ja">{view.enemies[i].name}</span>
            {imm <= 1 && <small className="bt-en-sm"> {view.enemies[i].nameEn}</small>}
          </button>
        ))}
        <button type="button" className="bt-back" onClick={() => (act === 'magic' ? setPhase('spells') : toCommand())}>
          ✕ <Bi line={{ jp: 'もどる', en: 'Back' }} imm={imm} />
        </button>
      </div>
    )
  } else if (phase === 'question' && q) {
    const w = q.word
    const correctIdx = q.answer
    panel = (
      <div className={`bt-win bt-q ${reveal ? (reveal.correct ? 'right' : 'wrong') : ''}`}>
        <div className="bt-q-head">
          <Bi line={KIND_TITLE[q.kind]} imm={imm} />
        </div>
        <div className="bt-q-prompt">
          {q.kind === 'meaning' && (
            <span className="bt-q-big">
              <Ruby text={w.jp} reading={w.kana} />
            </span>
          )}
          {q.kind === 'reverse' && (
            <span className="bt-q-big bt-q-en">
              <span className="bt-emoji">{w.emoji}</span> {w.en}
            </span>
          )}
          {q.kind === 'reading' && (
            <span className="bt-q-big">
              <span lang="ja">{w.jp}</span>
            </span>
          )}
          {q.kind === 'listen' && (
            <button type="button" className="bt-listen" onClick={() => void speak(w.kana, { force: true })} aria-label="Play the word again">
              🔊 <Bi line={{ jp: 'もういちど', en: 'Replay' }} imm={imm} />
            </button>
          )}
        </div>
        <div className="bt-timer">
          <span ref={timerRef} data-zone="crit" />
        </div>
        {q.kind === 'reading' ? (
          <div className="bt-read">
            <KanaInput value={typedAns} onChange={setTypedAns} onSubmit={(v) => void answer(v)} autoFocus disabled={!!reveal} placeholder="romaji → かな" />
            <div className="bt-read-btns">
              <button type="button" className="bt-btn" disabled={!!reveal} onClick={() => void answer(typedAns)}>
                <Bi line={{ jp: 'けってい', en: 'OK' }} imm={imm} />
              </button>
              <button type="button" className="bt-btn ghost" disabled={!!reveal} onClick={() => void answer('')}>
                <Bi line={{ jp: 'わからない', en: "Don't know" }} imm={imm} />
              </button>
            </div>
          </div>
        ) : (
          <div className="bt-grid2 bt-choices">
            {q.choices.map((c, i) => {
              const state = reveal ? (i === correctIdx ? 'good' : i === picked ? 'bad' : 'dim') : ''
              return (
                <button key={c.id} type="button" className={`bt-opt bt-choice ${cursor === i && !reveal ? 'sel' : ''} ${state}`} onMouseEnter={() => !reveal && setCursor(i)} onClick={() => void answer(i)} disabled={!!reveal}>
                  <span className="bt-cur">▶</span>
                  <span className="bt-key">{i + 1}</span>
                  {q.kind === 'meaning' ? <span>{c.en}</span> : q.kind === 'listen' && imm >= 2 ? <span lang="ja">{c.jp}</span> : <Ruby text={c.jp} reading={c.kana} />}
                </button>
              )
            })}
          </div>
        )}
        {reveal && (
          <div className={`bt-reveal ${reveal.correct ? 'good' : 'bad'}`}>
            {reveal.correct ? (
              <span>◎ {w.jp !== w.kana ? `${w.jp}（${w.kana}）` : w.jp} ＝ {w.en}</span>
            ) : (
              <span>
                {reveal.timeout ? '⌛ ' : '✕ '}
                <b lang="ja">{w.jp !== w.kana ? `${w.jp}（${w.kana}）` : w.jp}</b> ＝ {w.emoji} {w.en}
              </span>
            )}
          </div>
        )}
      </div>
    )
  } else if (phase === 'spells') {
    panel = (
      <div className="bt-win bt-list">
        <div className="bt-panel-title">
          <Bi line={{ jp: 'どの まほうを となえる？', en: 'Which spell?' }} imm={imm} />
          <span className="bt-mp-note">MP {p.mp}</span>
        </div>
        <div className="bt-grid2">
          {spells.map((s, i) => (
            <button key={s.element} type="button" className={`bt-opt ${cursor === i ? 'sel' : ''} ${p.mp < SPELL_COST ? 'dim' : ''}`} onMouseEnter={() => setCursor(i)} onClick={() => void castSpell(i)}>
              <span className="bt-cur">▶</span>
              <span className="bt-spell-noun" style={{ color: s.color }} lang="ja">
                {s.noun}
              </span>
              <span className="bt-spell-meta">
                <span lang="ja">{s.kana}</span>
                {imm <= 2 && <small className="bt-en-sm">{s.en}</small>}
              </span>
              <span className="bt-cost">{SPELL_COST}</span>
            </button>
          ))}
        </div>
        <button type="button" className="bt-back" onClick={() => toCommand()}>
          ✕ <Bi line={{ jp: 'もどる', en: 'Back' }} imm={imm} />
        </button>
      </div>
    )
  } else if (phase === 'incant' || (phase === 'busy' && castFb)) {
    const col = EL_COLOR[spellEl]
    panel = (
      <div className="bt-win bt-inc" style={{ '--el': col } as CSSProperties}>
        <div className="bt-panel-title">
          <Bi line={{ jp: 'じゅもんを となえよ！', en: 'Speak the incantation!' }} imm={imm} />
          <button type="button" className="bt-mode" onClick={() => setTypeMode((m) => !m)} disabled={phase !== 'incant'}>
            {typeMode ? '🀄 tiles' : '⌨ type'}
          </button>
        </div>
        <div className="bt-inc-hint">
          <Bi line={{ jp: `${EL_NOUN[spellEl]}（${ELEMENT_SPELLS.find((s) => s.element === spellEl)?.kana}）の まほうを つかおう`, en: `Cast ${spellEl} magic — e.g. "〜のまほう" or "〜を使います"` }} imm={imm} />
        </div>
        {castFb ? (
          <div className={`bt-cast-fb ${castFb.ok ? 'good' : 'bad'}`}>
            {castFb.ok ? (
              <span className="bt-chant-line" lang="ja">
                「{castFb.text}」
              </span>
            ) : (
              <>
                <span>✕ {castFb.text}</span>
                {castFb.hint && (
                  <span className="bt-cast-hint" lang="ja">
                    {castFb.hint}
                  </span>
                )}
              </>
            )}
          </div>
        ) : typeMode ? (
          <div className="bt-read">
            <KanaInput value={incText} onChange={setIncText} onSubmit={(v) => void cast(v)} autoFocus placeholder="hinomahou → ひのまほう" />
            <div className="bt-read-btns">
              <button type="button" className="bt-btn" onClick={() => void cast()}>
                <Bi line={{ jp: 'となえる', en: 'Cast' }} imm={imm} />
              </button>
              <button type="button" className="bt-btn ghost" onClick={() => setPhase('spells')}>
                <Bi line={{ jp: 'もどる', en: 'Back' }} imm={imm} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="bt-slot" aria-label="Your incantation">
              {built.length === 0 ? (
                <span className="bt-slot-empty">…</span>
              ) : (
                built.map((id) => (
                  <button key={id} type="button" className="bt-tile placed" onClick={() => toggleTile(id)}>
                    {tiles.find((t) => t.id === id)?.text}
                  </button>
                ))
              )}
            </div>
            <div className="bt-tiles">
              {tiles.map((t, i) => (
                <button key={t.id} type="button" lang="ja" className={`bt-tile ${built.includes(t.id) ? 'used' : ''} ${cursor === i ? 'sel' : ''}`} onClick={() => toggleTile(t.id)} disabled={built.includes(t.id)}>
                  {t.text}
                </button>
              ))}
              <button type="button" className={`bt-tile bt-cast ${cursor === tiles.length ? 'sel' : ''}`} onClick={() => void cast()} disabled={!built.length}>
                <Bi line={{ jp: 'となえる', en: 'Cast' }} imm={imm} />
              </button>
            </div>
            <button type="button" className="bt-back" onClick={() => setPhase('spells')}>
              ✕ <Bi line={{ jp: 'もどる', en: 'Back' }} imm={imm} />
            </button>
          </>
        )}
      </div>
    )
  } else if (phase === 'items') {
    panel = (
      <div className="bt-win bt-list">
        <div className="bt-panel-title">
          <Bi line={{ jp: 'どの どうぐを つかう？', en: 'Use which item?' }} imm={imm} />
        </div>
        {bagItems.map((it, i) => (
          <button key={it.id} type="button" className={`bt-opt bt-item ${cursor === i ? 'sel' : ''}`} onMouseEnter={() => setCursor(i)} onClick={() => void applyItem(i)}>
            <span className="bt-cur">▶</span>
            <PixelSprite id={it.icon} scale={2} />
            <span className="bt-item-name">
              <Ruby text={it.jp} reading={it.kana} />
              {imm <= 1 && <small className="bt-en-sm">{it.description}</small>}
            </span>
            <span className="bt-count">×{player.bag[it.id]}</span>
          </button>
        ))}
        <button type="button" className="bt-back" onClick={() => toCommand()}>
          ✕ <Bi line={{ jp: 'もどる', en: 'Back' }} imm={imm} />
        </button>
      </div>
    )
  } else if (phase === 'end' && end?.kind === 'win') {
    panel = (
      <div className="bt-win bt-end">
        <div className="bt-panel-title">
          <Bi line={{ jp: 'しょうり！', en: 'Victory!' }} imm={imm} />
          <span className="bt-rw">
            +{end.rewards?.xp} XP · 💠{end.rewards?.shards}
            {end.levelUp ? ` · Lv ${end.levelUp}!` : ''}
          </span>
        </div>
        {answered.current.length > 0 && (
          <ul className="bt-words">
            {answered.current.slice(-6).map((a, i) => (
              <li key={i} className={a.correct ? 'good' : 'bad'}>
                <span>{a.correct ? '◎' : '✕'}</span> <span lang="ja">{a.jp}</span>
                {a.jp !== a.kana && <small lang="ja"> {a.kana}</small>} <span className="bt-w-en">{a.en}</span>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="bt-btn bt-continue" onClick={endBattle}>
          <Bi line={{ jp: 'つづける ▶', en: 'Continue' }} imm={imm} />
        </button>
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className={`bt-root bt-r${reg} ${shake ? `bt-shake-${shake}` : ''} ${hitstop ? 'bt-hitstop' : ''} ${fade ? `bt-fade-${fade}` : ''}`}
      role="dialog"
      aria-label="Battle"
      onPointerDown={onRootPointer}
    >
      <div className="bt-stage">
        <Backdrop region={reg} horizon={horizon} />
        {reg >= 4 && <div className="bt-twinkle" aria-hidden />}
      </div>
      <div className="bt-field" ref={fieldRef}>
        <div ref={statusRef} className={`bt-win bt-status ${hpLow ? 'low' : ''} ${hurt ? 'hurt' : ''}`}>
          <div className="bt-portrait">
            <PixelSprite id="mage" scale={2} animate outfit={player.outfit} />
          </div>
          <div className="bt-stats">
            <div className="bt-name">
              <span lang="ja">{p.name}</span>
              <span className="bt-lv">Lv {p.level}</span>
              {truth.current.player.shield > 0 && (
                <span className="bt-shield" title="Charm">
                  ✦{truth.current.player.shield}
                </span>
              )}
            </div>
            <div className="bt-stat">
              <b>HP</b>
              <Bar value={p.hp} max={p.maxHp} kind="hp" />
              <span className="bt-num">{p.hp}</span>
            </div>
            <div className="bt-stat">
              <b>MP</b>
              <Bar value={p.mp} max={p.maxMp} kind="mp" />
              <span className="bt-num">{p.mp}</span>
            </div>
          </div>
        </div>
        <div className="bt-enemies" style={{ bottom: `${ENEMY_BOTTOM * 100}%` }}>
          {view.enemies.map((e, i) => (
            <button
              key={e.uid}
              type="button"
              ref={(el) => {
                enemyRefs.current[i] = el
              }}
              className={`bt-enemy ${efx[i] ?? ''} ${targetIdx === i ? 'targeted' : ''}`}
              style={{ '--d': `${i * 110}ms`, '--s': (scale * spriteSize) / 32 } as CSSProperties}
              disabled={e.hp <= 0 || phase !== 'target'}
              onClick={() => phase === 'target' && begin(act, i)}
              aria-label={`${e.name} ${e.nameEn}`}
            >
              {targetIdx === i && <span className="bt-target">▼</span>}
              <span className="bt-sprite">
                <PixelSprite id={e.def.id} scale={scale} animate flash={flashing[i]} />
              </span>
              <span className="bt-shadow" />
              <span className="bt-ename">
                <span lang="ja">
                  {e.name}
                  {weakSeen[i] && (
                    <span className="bt-weak" style={{ color: EL_COLOR[weakSeen[i]] }} title={`Weak to ${weakSeen[i]}`}>
                      {' '}
                      弱{EL_NOUN[weakSeen[i]]}
                    </span>
                  )}
                </span>
                <span className="bt-ehp">
                  <span style={{ width: `${(e.hp / e.maxHp) * 100}%` }} />
                </span>
              </span>
            </button>
          ))}
        </div>
        {chant && (
          <div className="bt-chant" style={{ color: chant.color }} lang="ja">
            {chant.text}
          </div>
        )}
        {banner && (
          <div className="bt-banner" onAnimationEnd={() => setBanner(null)}>
            <Bi line={banner} imm={imm} block />
          </div>
        )}
      </div>

      <div className="bt-bottom">
        {phase !== 'question' && phase !== 'incant' && !(phase === 'busy' && castFb) && renderMessage()}
        {panel}
      </div>

      <div className="bt-fx" aria-hidden>
        {fx.map((f) => (
          <FxNode key={f.id} f={f} />
        ))}
      </div>
      {screenFlash && <div className="bt-flash" style={{ background: screenFlash }} />}
      {phase === 'intro' && <div className="bt-wipe" aria-hidden />}
      {end?.kind === 'lose' && (
        <div className="bt-defeat" onClick={() => endOnce('lose')}>
          <p lang="ja">目の前が 真っ暗に なった…</p>
          {imm <= 2 && <small>Everything went dark…</small>}
          <span className="bt-more">▼</span>
        </div>
      )}
    </div>
  )
}

function FxNode({ f }: { f: Fx }) {
  const style = { left: f.x, top: f.y, '--dx': `${f.dx ?? 0}px`, '--dy': `${f.dy ?? 0}px`, '--c': f.color ?? '#fff', '--sz': `${f.size ?? 4}px` } as CSSProperties
  switch (f.kind) {
    case 'dmg':
      return (
        <span className={`fx-dmg ${f.crit ? 'crit' : ''}`} style={style}>
          {f.text}
        </span>
      )
    case 'heal':
      return (
        <span className="fx-dmg heal" style={style}>
          {f.text}
        </span>
      )
    case 'spark':
      return <span className="fx-spark" style={style} />
    case 'slash':
      return (
        <span className={`fx-slash ${f.crit ? 'crit' : ''}`} style={style}>
          <i />
          {f.crit && <i className="b" />}
        </span>
      )
    case 'ring':
      return <span className="fx-ring" style={style} />
    case 'kanji':
      return (
        <span className="fx-kanji" style={style} lang="ja">
          {f.text}
        </span>
      )
  }
}

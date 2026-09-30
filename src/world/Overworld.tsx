/**
 * The explorable overworld (route `/`). One canvas driven by a rAF loop;
 * React only renders the overlays (HUD, dialogue, battle, cutscenes, menu).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Dir, SpriteId } from '../art'
import Battle, { type BattleOutcome } from '../battle/Battle'
import { ITEM_BY_ID } from '../battle/items'
import { ACTIVITY_BY_ID, bossOf, REGIONS } from '../data/regions'
import { WORD_BY_ID } from '../data/vocab'
import { item } from '../engine/items'
import { playMusic } from '../engine/music'
import { dueItems } from '../engine/quests'
import { xpForLevel } from '../engine/rewards'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import { strength } from '../engine/srs'
import { addItem, getState, grantRewards, isPassed, level, markOpened, markScene, regionUnlocked, setWorldPos, usePlayer, type PlayerState } from '../engine/store'
import type { Activity } from '../games/types'
import { Cutscene, hasScene } from '../story/Cutscene'
import { GameMenu } from '../ui/GameMenu'
import { Bi, Dialog, nextActivity, type Step } from './Dialog'
import { OPPOSITE, World } from './engine'
import { makeEntities } from './entities'
import { tileSolid } from './mapdef'
import { getMap, locateActivity, REGION_MAPS } from './maps'
import { Renderer, type RenderInfo } from './render'
import type { Entity, Exit, GameMap, Line } from './types'
import { Sprite } from './Sprite'
import './Overworld.css'

const fx = (name: string) => {
  try {
    ;(sfx as unknown as Record<string, (() => void) | undefined>)[name]?.()
  } catch {
    /* audio unavailable */
  }
}

const KEY_DIR: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
}

/** Exterior map of a region (interiors resolve to their region's exterior). */
function exteriorOf(m: GameMap): GameMap {
  return m.spec.interior ? getMap(REGION_MAPS[m.spec.region - 1])! : m
}

function ghostIds(p: PlayerState, m: GameMap): Set<string> {
  const out = new Set<string>()
  const now = Date.now()
  for (const e of m.entitySpecs) {
    if (!e.word) continue
    const c = p.srs[item.word(e.word)]
    if (c && c.seen > 0 && strength(c, now) < 0.5) out.add(e.id)
  }
  return out
}

function markerMap(p: PlayerState, m: GameMap): Map<string, 'next' | 'done'> {
  const out = new Map<string, 'next' | 'done'>()
  const next = nextActivity(p)
  for (const e of m.entitySpecs) {
    const acts = e.activities ?? []
    if (!acts.length) continue
    if (next && acts.includes(next.id)) out.set(e.id, 'next')
    else if (acts.every((id) => isPassed(p, id))) out.set(e.id, 'done')
  }
  return out
}

function exitLockedFor(ex: Exit): boolean {
  const t = getMap(ex.to)
  return !!t && !regionUnlocked(getState(), t.spec.region)
}

function fudeHint(p: PlayerState, m: GameMap, n: number): Line {
  const due = dueItems(p).length
  const ghosts = ghostIds(p, m).size
  const next = nextActivity(p)
  const options: Line[] = []
  if (next) {
    const loc = locateActivity(next.id)
    const host = loc?.map.entitySpecs.find((e) => e.id === loc.entityId)
    if (loc && loc.map.id === m.id) options.push({ jp: `『${next.jp}』は この ちかくだよ。「！」を さがして！`, en: `“${next.title}” is close by. Look for the “!”.` })
    else if (loc && host?.name) {
      const ext = exteriorOf(loc.map)
      const where = loc.map.spec.interior ? `${ext.spec.jp}の「${loc.map.spec.jp}」` : loc.map.spec.jp
      const whereEn = loc.map.spec.interior ? `the ${loc.map.spec.name} in ${ext.spec.name}` : ext.spec.name
      options.push({ jp: `つぎは『${next.jp}』！ ${where}の ${host.name.jp}に あいに いこう。`, en: `Next: “${next.title}”. Go see the ${host.name.en} — ${whereEn}.` })
    }
  } else options.push({ jp: 'すごい！ ぜんぶの しれんを クリアしたね！', en: 'Amazing! You’ve cleared every trial!' })
  if (due > 0) options.push({ jp: `ことばが ${due}こ きえかけてる… メニューの「クエスト」で ふくしゅうしよう！`, en: `${due} words are fading… review them from Quests in the menu!` })
  if (ghosts > 0) options.push({ jp: 'あれ？ なにかが すけて 見える… しらべて みよう！', en: 'Huh? Something here looks see-through… let’s check it!' })
  if (m.spec.id === 'forest') options.push({ jp: 'きの 下を とおれる ばしょが あるかも…？', en: 'Maybe some paths run right under the trees…?' })
  options.push({ jp: 'たかい くさには まものが いるよ。きを つけてね。', en: 'Monsters lurk in tall grass. Be careful!' })
  return options[n % options.length]
}

interface DialogState {
  steps: Step[]
  speaker?: Line
}

export default function Overworld() {
  const p = usePlayer()
  const nav = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const R = useRef<Renderer | null>(null)
  const Wd = useRef<World | null>(null)
  const infoRef = useRef<RenderInfo>({ outfit: p.outfit, ghosts: new Set(), markers: new Map(), opened: new Set(p.opened), exitLocked: exitLockedFor })
  const modal = useRef(false)
  const busy = useRef(false) // map transition / battle intro in progress
  const fadeTarget = useRef(0)
  const onFaded = useRef<(() => void) | null>(null)
  const lastSave = useRef(0)
  const saveTimer = useRef(0)
  const heldStack = useRef<Dir[]>([])
  const hintN = useRef(0)
  const lineN = useRef(new Map<string, number>())

  const [mapId, setMapId] = useState<string>(() => (getMap(getState().world.map) ? getState().world.map : 'village'))
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [battle, setBattle] = useState<number | null>(null)
  const [scenes, setScenes] = useState<{ id: string; then?: () => void }[]>([])
  const [menu, setMenu] = useState(false)
  const [banner, setBanner] = useState<{ jp: string; en: string; key: number } | null>(null)
  const [toast, setToast] = useState<{ line: Line; key: number } | null>(null)
  const [run, setRun] = useState(false)
  const [touch] = useState(() => typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window))

  const map = getMap(mapId)!
  const isModal = !!dialog || battle !== null || scenes.length > 0 || menu
  modal.current = isModal

  // Keep render info in sync with the save.
  infoRef.current = useMemo(
    () => ({ outfit: p.outfit, ghosts: ghostIds(p, map), markers: markerMap(p, map), opened: new Set(p.opened), exitLocked: exitLockedFor }),
    [p, map],
  )

  // ─── persistence ─────────────────────────────────────────────────
  const savePos = useCallback((force = false) => {
    const w = Wd.current
    if (!w) return
    const doSave = () => {
      lastSave.current = performance.now()
      const cur = getState().world
      const next = { map: w.map.id, x: w.player.x, y: w.player.y, dir: w.player.dir }
      if (cur.map !== next.map || cur.x !== next.x || cur.y !== next.y || cur.dir !== next.dir) setWorldPos(next)
    }
    clearTimeout(saveTimer.current)
    if (force || performance.now() - lastSave.current > 800) doSave()
    else saveTimer.current = window.setTimeout(doSave, 800)
  }, [])

  const showToast = useCallback((line: Line) => setToast({ line, key: Date.now() }), [])

  // ─── map loading ─────────────────────────────────────────────────
  const loadMap = useCallback(
    (id: string, x: number, y: number, dir: Dir, opts: { banner?: boolean } = {}) => {
      const m = getMap(id)!
      const s = getState()
      const ents = makeEntities(m, (eid) => {
        const spec = m.entitySpecs.find((e) => e.id === eid)!
        return !(spec.kind === 'boss' && spec.activities?.every((a) => isPassed(s, a)))
      })
      Wd.current!.teleport(m, ents, x, y, dir)
      Wd.current!.encounters = !m.spec.interior
      R.current!.setMap(m)
      setMapId(id)
      playMusic(m.spec.music)
      if (opts.banner !== false) setBanner({ jp: m.spec.jp, en: m.spec.name, key: Date.now() })
      savePos(true)
      const arrive = `arrive-${id}`
      if (!m.spec.interior && hasScene(arrive) && !s.seenScenes.includes(arrive)) setScenes((q) => [...q, { id: arrive }])
      else if (!m.spec.interior && Math.random() < 0.5) setTimeout(() => showToast(fudeHint(getState(), m, hintN.current++)), 2600)
    },
    [savePos, showToast],
  )

  /** Fade to black, run `fn`, fade back in. */
  const transition = useCallback((fn: () => void) => {
    busy.current = true
    fadeTarget.current = 1
    onFaded.current = () => {
      fn()
      fadeTarget.current = 0
      setTimeout(() => (busy.current = false), 180)
    }
  }, [])

  const goToPoint = useCallback(
    (id: string, point: string) => {
      const m = getMap(id)
      const pt = m?.points[point]
      if (!m || !pt) return
      fx('door')
      transition(() => loadMap(id, pt.x, pt.y, pt.dir))
    },
    [transition, loadMap],
  )

  // ─── interactions ───────────────────────────────────────────────
  const startActivity = useCallback(
    (a: Activity) => {
      savePos(true)
      setDialog(null)
      const go = () => nav(`/play/${a.id}`)
      const pre = `pre-boss-r${a.region}`
      if (a.stage === 'boss' && hasScene(pre) && !getState().seenScenes.includes(pre)) setScenes((q) => [...q, { id: pre, then: go }])
      else go()
    },
    [nav, savePos],
  )

  const openChest = useCallback((e: Entity): Step[] => {
    const c = e.spec.chest!
    markOpened(e.spec.id)
    fx('chest')
    if (c.item) addItem(c.item, c.n ?? 1)
    grantRewards(c.xp ?? 5, c.shards ?? 0)
    const it = c.item ? ITEM_BY_ID.get(c.item) : undefined
    const steps: Step[] = []
    if (it) steps.push({ kind: 'say', portrait: it.icon, line: { jp: `${it.jp}（${it.kana}）を ${c.n ?? 1}こ てに いれた！`, en: `You got ${c.n ?? 1} × ${it.name}!` }, voice: false })
    if (c.shards) steps.push({ kind: 'say', portrait: 'shard', line: { jp: `ことだまの かけら ${c.shards}こ！`, en: `${c.shards} spirit shards!` }, voice: false })
    return steps
  }, [])

  const interactSteps = useCallback(
    (e: Entity): DialogState => {
      const s = getState()
      const spec = e.spec
      const speaker = spec.name
      const portrait: SpriteId | undefined = spec.sprite
      const lines = spec.lines ?? []
      const say = (line: Line, voice = true): Step => ({ kind: 'say', speaker, portrait, line, voice })
      let steps: Step[] = []

      if (spec.kind === 'chest') {
        const c = spec.chest!
        if (s.opened.includes(spec.id)) steps = [{ kind: 'say', line: { jp: 'からっぽだ。', en: 'It’s empty.' }, voice: false }]
        else if (c.lock) {
          steps = [
            { kind: 'say', portrait: 'chest', line: { jp: c.lock.jp, en: c.lock.en }, voice: false },
            {
              kind: 'kana',
              prompt: { jp: 'ことばを となえよ…', en: 'Speak the word… (type romaji)' },
              answer: c.lock.answer,
              onResult: (ok) => {
                if (ok) {
                  void speak(c.lock!.answer)
                  return [{ kind: 'say', line: { jp: 'カチッ… たからばこが ひらいた！', en: 'Click… the chest swings open!' }, voice: false }, ...openChest(e)]
                }
                return [{ kind: 'say', line: { jp: '…なにも おこらない。', en: '…Nothing happens.' }, voice: false }]
              },
            },
          ]
        } else steps = [{ kind: 'say', line: { jp: 'たからばこを あけた！', en: 'You opened the chest!' }, voice: false }, ...openChest(e)]
        return { steps }
      }

      if (spec.kind === 'sign') {
        const region = getMap(s.world.map)?.spec.region ?? 1
        const open = region < 5 && isPassed(s, bossOf(region).id)
        steps = open ? [say({ jp: 'みちは ひらかれている。さあ、すすもう！', en: 'The road is open. Onward!' }, false)] : lines.map((l) => say(l, false))
        return { steps, speaker }
      }

      // Ghost re-solidifying (words not practised lately).
      if (spec.word && infoRef.current.ghosts.has(spec.id)) {
        const w = WORD_BY_ID.get(spec.word)!
        steps.push({ kind: 'say', line: { jp: `${spec.name?.jp ?? ''}が きえかけている！ ことばで つなぎとめよう！`, en: `The ${spec.name?.en ?? 'landmark'} is fading! Anchor it with its word!` }, voice: false })
        steps.push({
          kind: 'recall',
          wordId: w.id,
          onResult: (ok) => (ok ? [{ kind: 'say', line: { jp: `${w.jp}（${w.kana}）が もどった！`, en: `${w.en} is solid again!` } }] : [{ kind: 'say', line: { jp: 'まだ すけている… また ためそう。', en: 'Still see-through… try again later.' }, voice: false }]),
        })
        if (spec.kind === 'landmark') return { steps, speaker }
      }

      if (spec.kind === 'landmark') {
        steps.push(say(lines[0]))
        const w = spec.word ? WORD_BY_ID.get(spec.word) : undefined
        if (w) steps.push({ kind: 'say', line: { jp: `${w.jp}（${w.kana}）`, en: `${w.emoji} ${w.en}` } })
        return { steps, speaker }
      }

      if (spec.kind === 'npc') {
        const n = lineN.current.get(spec.id) ?? 0
        lineN.current.set(spec.id, n + 1)
        if (lines.length) steps.push(say(lines[n % lines.length]))
        return { steps, speaker }
      }

      // activity hosts & bosses
      if (lines.length) steps.push(say(lines[0]))
      const acts = (spec.activities ?? []).map((id) => ACTIVITY_BY_ID.get(id)!).filter(Boolean)
      if (acts.length === 1) steps.push({ kind: 'activity', activity: acts[0], speaker, portrait })
      else if (acts.length > 1)
        steps.push({
          kind: 'choice',
          prompt: { jp: 'どれに ちょうせんする？', en: 'Which will you attempt?' },
          options: acts.map((a) => ({ id: a.id, label: { jp: a.jp, en: a.title } })),
          onPick: (id) => [{ kind: 'activity', activity: ACTIVITY_BY_ID.get(id)!, speaker, portrait }],
        })
      return { steps, speaker }
    },
    [openChest],
  )

  // ─── world + renderer setup (once) ──────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current!
    const r = new Renderer(canvas)
    R.current = r
    const s = getState()
    let m = getMap(s.world.map) ?? getMap('village')!
    let { x, y } = s.world
    let dir: Dir = s.world.dir ?? 'down'
    if (tileSolid(m, x, y) || m.exits.has(y * m.w + x) || !getMap(s.world.map)) {
      m = getMap(s.world.map) ?? getMap('village')!
      const sp = m.points[m.spec.spawn]
      x = sp.x
      y = sp.y
      dir = sp.dir
    }
    const w = new World(m, [], x, y, dir, {
      onStep: () => savePos(),
      onExit: (ex) => goToPoint(ex.to, ex.point),
      onBump: () => fx('bump'),
      exitLocked: exitLockedFor,
      onInteract: (t) => {
        const wd = Wd.current!
        if (t.fude) {
          setDialog({ speaker: { jp: 'フデ', en: 'Fude' }, steps: [{ kind: 'say', portrait: 'fude', speaker: { jp: 'フデ', en: 'Fude' }, line: fudeHint(getState(), wd.map, hintN.current++) }] })
          return
        }
        if (t.exit) {
          const target = getMap(t.exit.to)!
          const boss = bossOf(target.spec.region - 1)
          setDialog({
            steps: [
              { kind: 'say', line: { jp: 'ふしぎな けっかいが みちを ふさいでいる…', en: 'A strange barrier seals the way…' }, voice: false },
              { kind: 'say', line: { jp: `『${boss.jp}』を たおせば、けっかいは きえる。`, en: `Defeat ${boss.title} and the seal will break.` }, voice: false },
            ],
          })
          fx('wrong')
          return
        }
        const e = t.entity!
        if (e.spec.sprite && !e.big) e.dir = OPPOSITE[wd.player.dir]
        wd.talking = e
        setDialog(interactSteps(e))
      },
      onEncounter: () => {
        busy.current = true
        fx('encounter')
        playMusic('battle')
        R.current!.startBattleFx(performance.now())
        setTimeout(() => setBattle(Wd.current!.map.spec.region), 1250)
      },
    })
    Wd.current = w
    if (import.meta.env.DEV) (window as unknown as { __ow: unknown }).__ow = { world: w, renderer: r }
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect()
      r.resize(rect.width, rect.height, Math.min(3, window.devicePixelRatio || 1))
    }
    resize()
    window.addEventListener('resize', resize)
    r.fade = 1
    loadMap(m.id, x, y, dir)

    // Story beats owed after returning from a boss fight.
    const owed: { id: string }[] = []
    for (let rg = 1; rg <= 5; rg++) {
      const id = `post-boss-r${rg}`
      if (isPassed(s, bossOf(rg).id) && hasScene(id) && !s.seenScenes.includes(id)) owed.push({ id })
    }
    if (isPassed(s, 'r5-dragon') && hasScene('ending') && !s.seenScenes.includes('ending')) owed.push({ id: 'ending' })
    if (owed.length) setScenes((q) => [...owed, ...q])

    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      // fades
      const ft = fadeTarget.current
      if (r.fade < ft) {
        r.fade = Math.min(ft, r.fade + dt * 4.5)
        if (r.fade >= 1 && onFaded.current) {
          const f = onFaded.current
          onFaded.current = null
          f()
        }
      } else if (r.fade > ft) r.fade = Math.max(ft, r.fade - dt * 3.2)
      w.frozen = modal.current || busy.current
      if (w.frozen) {
        w.held = null
        w.path = []
      } else w.held = heldStack.current[heldStack.current.length - 1] ?? null
      w.update(dt, now)
      r.draw(w, now, dt, infoRef.current)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      clearTimeout(saveTimer.current)
      const cur = Wd.current
      if (cur) setWorldPos({ map: cur.map.id, x: cur.player.x, y: cur.player.y, dir: cur.player.dir })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Clear held input whenever an overlay opens.
  useEffect(() => {
    if (isModal) heldStack.current = []
    if (!dialog && Wd.current) Wd.current.talking = null
  }, [isModal, dialog])

  // Companion chatter while exploring.
  useEffect(() => {
    const id = setInterval(() => {
      if (modal.current || busy.current || !Wd.current) return
      showToast(fudeHint(getState(), Wd.current.map, hintN.current++))
    }, 75000)
    return () => clearInterval(id)
  }, [showToast])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 6500)
    return () => clearTimeout(id)
  }, [toast])

  useEffect(() => {
    if (!banner) return
    const id = setTimeout(() => setBanner(null), 2800)
    return () => clearTimeout(id)
  }, [banner])

  useEffect(() => {
    if (Wd.current) Wd.current.run = run
  }, [run])

  // ─── keyboard ────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if (modal.current) return
      const d = KEY_DIR[e.key]
      if (d) {
        e.preventDefault()
        if (!heldStack.current.includes(d)) heldStack.current.push(d)
        if (Wd.current && !e.repeat) Wd.current.pendingTurn = d
        return
      }
      if (e.key === 'Shift') Wd.current && (Wd.current.run = true)
      else if (e.key === 'z' || e.key === 'Z' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (!e.repeat) Wd.current?.interact()
      } else if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        fx('confirm')
        setMenu(true)
      } else if (e.key === 'x' || e.key === 'X' || e.key === 'Backspace' || e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        if (!e.repeat) setRun((v) => !v)
      }
    }
    const up = (e: KeyboardEvent) => {
      const d = KEY_DIR[e.key]
      if (d) heldStack.current = heldStack.current.filter((x) => x !== d)
      if (e.key === 'Shift' && Wd.current) Wd.current.run = run
    }
    const blur = () => (heldStack.current = [])
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [run])

  // ─── touch / pointer ─────────────────────────────────────────────
  const onCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (modal.current || busy.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const t = R.current!.tileAt(e.clientX - rect.left, e.clientY - rect.top)
    R.current!.tap = { x: t.x, y: t.y, at: performance.now() }
    Wd.current?.walkTo(t.x, t.y)
  }

  const pressA = () => {
    if (modal.current) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }))
    else Wd.current?.interact()
  }
  const pressB = () => {
    if (modal.current) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }))
    else setRun((v) => !v)
  }

  const onTravel = (id: string) => {
    const m = getMap(id)
    if (!m || !regionUnlocked(getState(), m.spec.region)) return
    setMenu(false)
    const sp = m.points[m.spec.spawn]
    fx('door')
    transition(() => loadMap(id, sp.x, sp.y, sp.dir))
  }

  const onBattleEnd = (outcome: BattleOutcome) => {
    const w = Wd.current!
    const r = R.current!
    setBattle(null)
    r.battleFx = null
    r.fade = 1
    fadeTarget.current = 0
    w.stepsSinceBattle = 0
    if (outcome === 'lose') {
      const ext = exteriorOf(w.map)
      const pt = ext.points[ext.spec.inn ?? ext.spec.spawn]
      loadMap(ext.id, pt.x, pt.y, pt.dir, { banner: false })
      setDialog({
        steps: [
          { kind: 'say', portrait: 'fude', speaker: { jp: 'フデ', en: 'Fude' }, line: { jp: 'だいじょうぶ？ ここまで はこんで きたよ。', en: 'Are you okay? I carried you back here.' } },
          { kind: 'say', portrait: 'fude', speaker: { jp: 'フデ', en: 'Fude' }, line: { jp: 'おぼえた ことばは なくなって いないよ。また がんばろう！', en: 'You haven’t lost any words you learned. Let’s try again!' } },
        ],
      })
    } else playMusic(w.map.spec.music)
    setTimeout(() => (busy.current = false), 250)
  }

  const closeDialog = useCallback(() => setDialog(null), [])

  // ─── HUD values ──────────────────────────────────────────────────
  const lvl = level(p)
  const cur = xpForLevel(lvl)
  const nxt = xpForLevel(lvl + 1)
  const region = REGIONS.find((r) => r.id === map.spec.region)
  const scene = scenes[0]

  return (
    <div className="ow-root">
      <canvas ref={canvasRef} className="ow-canvas" onPointerDown={onCanvasPointer} aria-label={`${map.spec.name} — overworld`} />

      <div className="ow-hud">
        <div className="win ow-stat">
          <div className="ow-lv">
            <span className="ow-lv-num">Lv {lvl}</span>
            <div className="ow-xp" title={`${p.xp - cur} / ${nxt - cur} XP`}>
              <span style={{ width: `${Math.max(4, ((p.xp - cur) / Math.max(1, nxt - cur)) * 100)}%` }} />
            </div>
          </div>
          <div className="ow-shards">
            <Sprite id="shard" scale={2} />
            <span>{p.shards}</span>
          </div>
        </div>
        <div className="ow-right">
          <button type="button" className="win ow-menu-btn" onClick={() => setMenu(true)} aria-label="Menu">
            <span className="ow-burger" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <Bi line={{ jp: 'メニュー', en: 'Menu' }} />
          </button>
        </div>
      </div>

      {banner && (
        <div className="ow-banner win" key={banner.key} style={{ ['--region' as string]: region?.color ?? '#f7c948' }}>
          <span className="ow-banner-jp" lang="ja">
            {banner.jp}
          </span>
          <span className="ow-banner-en">{banner.en}</span>
        </div>
      )}

      {toast && !isModal && (
        <button type="button" className="ow-toast" key={toast.key} onClick={() => setToast(null)}>
          <span className="ow-toast-face">
            <Sprite id="fude" scale={2} animate />
          </span>
          <span className="win ow-toast-bubble">
            <Bi line={toast.line} />
          </span>
        </button>
      )}

      {touch && !isModal && <TouchControls heldStack={heldStack} onA={pressA} onB={pressB} run={run} />}
      {touch && dialog && (
        <div className="ow-ab ow-ab-modal">
          <button type="button" className="ow-btn ow-btn-a" onPointerDown={(e) => (e.preventDefault(), pressA())}>
            A
          </button>
        </div>
      )}
      {!touch && !isModal && (
        <div className="ow-keys-hint" aria-hidden>
          <span>←↑↓→ / WASD</span> <span>Z: しらべる</span> <span>X: {run ? 'はしる ON' : 'はしる'}</span> <span>Esc: メニュー</span>
        </div>
      )}

      {dialog && <Dialog steps={dialog.steps} speaker={dialog.speaker} onClose={closeDialog} onStart={startActivity} />}

      {battle !== null && (
        <div className="ow-battle">
          <Battle region={battle} onEnd={onBattleEnd} />
        </div>
      )}

      {scene && (
        <div className="ow-scene">
          <Cutscene
            key={scene.id}
            id={scene.id}
            onDone={() => {
              markScene(scene.id)
              setScenes((q) => q.slice(1))
              scene.then?.()
            }}
          />
        </div>
      )}

      {menu && (
        <div className="ow-menu">
          <GameMenu onClose={() => setMenu(false)} onTravel={onTravel} />
        </div>
      )}
    </div>
  )
}

function TouchControls({ heldStack, onA, onB, run }: { heldStack: React.MutableRefObject<Dir[]>; onA: () => void; onB: () => void; run: boolean }) {
  const padRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<Dir | null>(null)
  const setDir = (d: Dir | null) => {
    heldStack.current = d ? [d] : []
    setActive(d)
  }
  const fromEvent = (e: React.PointerEvent) => {
    const r = padRef.current!.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    if (Math.hypot(dx, dy) < r.width * 0.12) return null
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
  }
  useEffect(() => () => void (heldStack.current = []), [heldStack])
  return (
    <>
      <div
        ref={padRef}
        className="ow-dpad"
        onPointerDown={(e) => {
          e.preventDefault()
          e.currentTarget.setPointerCapture(e.pointerId)
          setDir(fromEvent(e))
        }}
        onPointerMove={(e) => {
          if (e.buttons || e.pointerType === 'touch') setDir(fromEvent(e) ?? active)
        }}
        onPointerUp={() => setDir(null)}
        onPointerCancel={() => setDir(null)}
        role="group"
        aria-label="Direction pad"
      >
        {(['up', 'down', 'left', 'right'] as Dir[]).map((d) => (
          <span key={d} className={`ow-dpad-${d} ${active === d ? 'on' : ''}`} />
        ))}
        <span className="ow-dpad-c" />
      </div>
      <div className="ow-ab">
        <button type="button" className={`ow-btn ow-btn-b ${run ? 'on' : ''}`} onPointerDown={(e) => (e.preventDefault(), onB())} aria-label="B (run)">
          B<small>{run ? 'RUN' : ''}</small>
        </button>
        <button type="button" className="ow-btn ow-btn-a" onPointerDown={(e) => (e.preventDefault(), onA())} aria-label="A (talk / check)">
          A
        </button>
      </div>
    </>
  )
}


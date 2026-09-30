import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import * as wanakana from 'wanakana'
import type { GameProps, GameResult } from './types'
import { GameFrame, HpBar, Intro, Jp, T, useAnswerTimer, useBurst, useFlash } from '../components/ui'
import { RADICAL_BY_CHAR, RADICALS, type KanjiRecipe } from '../data/kanji'
import { item } from '../engine/items'
import { shuffle } from '../engine/random'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import { weakness } from '../engine/srs'
import { discoverKanji, usePlayer } from '../engine/store'
import type { Review } from '../engine/srs'
import {
  contributes,
  ELEMENT_INFO,
  ELEMENT_WORD,
  ELEMENTS,
  findReactions,
  fuse,
  makeMap,
  manaFor,
  objectiveCells,
  objectivePoints,
  pickObjectives,
  pickRiddle,
  riddlePoints,
  sceneFor,
  checkObjective,
  type Element,
  type LandMap,
  type Objective,
  type ReactionHit,
} from './crafting'
import { PixelSprite } from '../art'
import { PixelTile, TileStrip, useWide, type StripCell } from './pixel'
import './MagicCrafting.css'

/** setTimeout that is cleared automatically on unmount. */
function useTimers() {
  const ids = useRef(new Set<number>())
  useEffect(() => {
    const set = ids.current
    return () => set.forEach((id) => clearTimeout(id))
  }, [])
  return useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      ids.current.delete(id)
      fn()
    }, ms)
    ids.current.add(id)
  }, [])
}

/** What each element turns a map cell into (drawn as pixel terrain tiles). */
const TERRAIN: Record<string, StripCell> = {
  '': 'grass',
  '#': { id: 'boulder', under: 'grass' },
  火: { id: 'campfire', under: 'dirt' },
  水: 'water',
  木: { id: 'tree', under: 'grass' },
  土: 'dirt',
  石: { id: 'rock', under: 'dirt' },
  日: 'flowers',
}

export default function MagicCrafting({ activity, params, onFinish, onExit }: GameProps<'crafting'>) {
  const [started, setStarted] = useState(false)
  const [hud, setHud] = useState<{ mana: number; maxMana: number; label: string }>({ mana: 0, maxMana: 1, label: '' })
  const finished = useRef(false)
  const finish = useCallback(
    (r: GameResult) => {
      if (finished.current) return
      finished.current = true
      onFinish(r)
    },
    [onFinish],
  )
  const evolution = params.mode === 'evolution'
  const right = started ? (
    <div className="mc-hud">
      <span className="mc-hud-label">{hud.label}</span>
      <div className="mc-hud-mana" title="Mana">
        <HpBar value={hud.mana} max={hud.maxMana} color="linear-gradient(90deg,#6f8bff,#b28bff)" label={`🔮 ${hud.mana}`} />
      </div>
    </div>
  ) : null

  return (
    <GameFrame title={activity.title} jp={activity.jp} onExit={onExit} right={right} className="mc-game">
      {!started ? (
        evolution ? (
          <Intro
            title="Kanji Evolution"
            jp="かんじのしんか"
            lines={[
              'Solve each riddle by fusing radicals from your grimoire on the altar.',
              'Tap (or drag) 2–3 radicals into the slots, then Fuse. 木 + 木 = 林!',
              'New kanji unlock new radicals. Failed fusions fizzle and cost mana 🔮.',
              `Solve ${params.goal} riddles before your mana runs dry.`,
            ]}
            onStart={() => setStarted(true)}
          />
        ) : (
          <Intro
            title="Shape the Land"
            jp="だいちをつくる"
            lines={[
              'Each quest asks you to shape the land: 「川」を作れ! Create a river.',
              'Pick an element spell. The spells are written only in kanji: know your 火 from your 水!',
              'Tap tiles to cast. Neighbouring elements react (水 + 火 → ♨️).',
              'Casting the wrong element wastes mana 🔮. Run out and the quest fails.',
            ]}
            onStart={() => setStarted(true)}
          />
        )
      ) : evolution ? (
        <Evolution goal={params.goal} onFinish={finish} setHud={setHud} />
      ) : (
        <World goal={params.goal} onFinish={finish} setHud={setHud} />
      )}
    </GameFrame>
  )
}

type HudSetter = (h: { mana: number; maxMana: number; label: string }) => void

// ─── Kanji Evolution ────────────────────────────────────────────────────

const EVO_MANA = 12
const FIZZLE_COST = 2
const HINT_COST = 2
const SKIP_COST = 3
const SOLVE_REGEN = 2

interface RevealState {
  recipe: KanjiRecipe
  isTarget: boolean
  isNew: boolean
  newRadicals: string[]
  skipped?: boolean
}

function Evolution({ goal, onFinish, setHud }: { goal: number; onFinish: (r: GameResult) => void; setHud: HudSetter }) {
  const player = usePlayer()
  const later = useTimers()
  const [burstNode, fire] = useBurst()
  const [flashCls, flash] = useFlash()
  const reviews = useRef<Review[]>([])
  const [mana, setMana] = useState(EVO_MANA)
  const [score, setScore] = useState(0)
  const [solved, setSolved] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const [riddle, setRiddle] = useState<KanjiRecipe | null>(() =>
    pickRiddle(player.unlockedRadicals, player.discoveredKanji, (k) => weakness(player.srs[item.kanji(k)])),
  )
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null])
  const [fizzles, setFizzles] = useState(0)
  const [hints, setHints] = useState(0)
  const [reveal, setReveal] = useState<RevealState | null>(null)
  const [scene, setScene] = useState<string[]>([])
  const [msg, setMsg] = useState<{ text: string; good: boolean } | null>(null)
  const [ending, setEnding] = useState(false)
  const elapsed = useAnswerTimer(riddle?.result)
  const unlocked = useMemo(() => RADICALS.filter((r) => player.unlockedRadicals.includes(r.char)), [player.unlockedRadicals])

  useEffect(() => setHud({ mana, maxMana: EVO_MANA, label: `📜 ${solved}/${goal}` }), [mana, solved, goal, setHud])

  const end = useCallback(
    (won: boolean, finalScore: number, solvedN: number) => {
      setEnding(true)
      if (won) sfx.win()
      else sfx.lose()
      later(
        () =>
          onFinish({
            score: finalScore,
            maxScore: goal * 2,
            reviews: reviews.current,
            passed: finalScore / (goal * 2) >= 0.6,
            notes: [won ? `Solved all ${goal} riddles!` : `Mana ran dry after ${solvedN} of ${goal} riddles.`],
          }),
        1200,
      )
    },
    [goal, later, onFinish],
  )

  const placeRadical = (ch: string, at?: number) => {
    if (reveal || ending) return
    sfx.click()
    setMsg(null)
    setSlots((s) => {
      const n = [...s]
      const idx = at ?? n.findIndex((x) => x === null)
      if (idx < 0) return s
      n[idx] = ch
      return n
    })
  }
  const clearSlot = (i: number) => {
    if (reveal || ending) return
    setSlots((s) => s.map((x, j) => (j === i ? null : x)))
  }

  const doFuse = () => {
    if (!riddle || reveal || ending) return
    const filled = slots.filter(Boolean)
    if (filled.length < 2) {
      setMsg({ text: 'Place at least two radicals on the altar.', good: false })
      return
    }
    const ms = elapsed()
    const out = fuse(slots, riddle.result, player.discoveredKanji, player.unlockedRadicals)
    if (out.kind === 'fizzle') {
      sfx.wrong()
      flash('bad')
      reviews.current.push({ itemId: item.kanji(riddle.result), correct: false, ms })
      const nf = fizzles + 1
      setFizzles(nf)
      const m = mana - FIZZLE_COST
      setMana(m)
      setSlots([null, null, null])
      // Learning moment: after two fizzles, reveal one part for free.
      if (nf >= 2 && hints < riddle.parts.length - 1) {
        setHints((h) => h + 1)
        setMsg({ text: `💨 Fizzle! ${filled.join(' + ')} makes nothing. The spirits whisper a part…`, good: false })
      } else setMsg({ text: `💨 Fizzle! ${filled.join(' + ')} makes nothing. −${FIZZLE_COST} mana`, good: false })
      if (m <= 0) end(false, score, solved)
      return
    }
    const { recipe } = out
    discoverKanji(recipe.result, recipe.unlocks ?? [])
    setScene((s) => [...s, ...sceneFor(recipe)].slice(-24))
    setSlots([null, null, null])
    setMsg(null)
    sfx.cast()
    fire(50, 40, 18)
    later(() => void speak(recipe.reading), 700)
    if (out.isTarget) {
      sfx.correct()
      flash('good')
      reviews.current.push({ itemId: item.kanji(riddle.result), correct: true, ms })
      setScore((s) => s + riddlePoints(fizzles, hints))
      setSolved((n) => n + 1)
      setMana((m) => Math.min(EVO_MANA, m + SOLVE_REGEN))
    } else {
      // A real kanji, but not the one asked for: a discovery, yet the riddle stands.
      reviews.current.push({ itemId: item.kanji(riddle.result), correct: false, ms })
    }
    setReveal({ recipe, isTarget: out.isTarget, isNew: out.isNew, newRadicals: out.newRadicals })
  }

  const takeHint = () => {
    if (!riddle || reveal || ending || hints >= riddle.parts.length - 1) return
    sfx.click()
    setHints((h) => h + 1)
    const m = mana - HINT_COST
    setMana(m)
    if (m <= 0) end(false, score, solved)
  }

  const skip = () => {
    if (!riddle || reveal || ending) return
    sfx.wrong()
    reviews.current.push({ itemId: item.kanji(riddle.result), correct: false, ms: elapsed() })
    const m = mana - SKIP_COST
    setMana(m)
    setReveal({ recipe: riddle, isTarget: false, isNew: false, newRadicals: [], skipped: true })
    later(() => void speak(riddle.reading), 700)
    if (m <= 0) end(false, score, solved)
  }

  const next = () => {
    if (!reveal || ending || !riddle) return
    const wasTarget = reveal.isTarget || reveal.skipped
    setReveal(null)
    if (!wasTarget) return
    if (reveal.isTarget && solved >= goal) {
      end(true, score, solved)
      return
    }
    const hist = [...history, riddle.result]
    setHistory(hist)
    setRiddle(pickRiddle(player.unlockedRadicals, player.discoveredKanji, (k) => weakness(player.srs[item.kanji(k)]), hist.slice(-3)))
    setFizzles(0)
    setHints(0)
  }

  // Keyboard: Enter fuses / continues, Backspace clears the last slot.
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {})
  useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (reveal) next()
        else doFuse()
      } else if (e.key === 'Backspace' && !reveal) {
        const last = slots.map((s, i) => (s ? i : -1)).filter((i) => i >= 0).pop()
        if (last !== undefined) clearSlot(last)
      }
    }
  })
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // No riddle possible (shouldn't happen with the starter radicals).
  if (!riddle)
    return (
      <div className="card center">
        <p>The grimoire is silent…</p>
        <button type="button" className="btn btn-primary" onClick={() => end(false, score, solved)} disabled={ending}>
          <T en="Finish" jp="おわり" />
        </button>
      </div>
    )

  const onDrop = (i: number) => (e: DragEvent) => {
    e.preventDefault()
    const ch = e.dataTransfer.getData('text/plain')
    if (ch && RADICAL_BY_CHAR.has(ch)) placeRadical(ch, i)
  }
  const shownParts = riddle.parts.slice(0, hints)
  const known = player.discoveredKanji.includes(riddle.result)

  return (
    <div className="mc-evo">
      <div className="card mc-riddle pop" key={riddle.result + history.length}>
        <div className="prompt-label">
          <T en={known ? 'Riddle (review)' : 'Riddle'} jp={known ? 'なぞなぞ・ふくしゅう' : 'なぞなぞ'} />
        </div>
        <div className="mc-riddle-main">
          <span className="mc-riddle-emoji">{riddle.emoji}</span>
          <div>
            <div className="mc-riddle-en">Create “{riddle.meaning}”</div>
            <div className="mc-riddle-jp" lang="ja">
              「<span className="mc-riddle-kanji">{riddle.result}</span>」を作れ!
            </div>
          </div>
        </div>
        {shownParts.length > 0 && (
          <div className="mc-riddle-hint">
            💡 Contains: {shownParts.map((p) => RADICAL_BY_CHAR.get(p)?.form ?? p).join(' + ')}
            {' + ?'.repeat(riddle.parts.length - shownParts.length)}
          </div>
        )}
      </div>

      <div className={`card mc-altar ${flashCls}`}>
        {burstNode}
        <div className="mc-slots">
          {slots.map((s, i) => (
            <button
              type="button"
              key={i}
              className={`mc-slot ${s ? 'filled' : ''}`}
              onClick={() => clearSlot(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop(i)}
              aria-label={s ? `Remove ${s}` : `Empty slot ${i + 1}`}
            >
              {s ? <span lang="ja">{s}</span> : <span className="mc-slot-empty">{i === 2 ? '(+)' : '+'}</span>}
            </button>
          ))}
        </div>
        <div className="mc-cauldron" aria-hidden>
          <span className="mc-cauldron-fude">
            <PixelSprite id="fude" scale={3} animate />
          </span>
          <PixelTile id="altar" under="stone-floor" scale={3} />
          <span className="mc-cauldron-glow" />
        </div>
        <div className="row mc-altar-actions">
          <button type="button" className="btn btn-primary btn-lg" onClick={doFuse} disabled={slots.filter(Boolean).length < 2 || !!reveal || ending}>
            ✨ <T en="Fuse" jp="がったい" />
          </button>
        </div>
        <div className="row mc-altar-actions">
          <button type="button" className="btn btn-sm" onClick={takeHint} disabled={hints >= riddle.parts.length - 1 || !!reveal || ending}>
            💡 Hint (−{HINT_COST}🔮)
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={skip} disabled={!!reveal || ending}>
            Show answer (−{SKIP_COST}🔮)
          </button>
        </div>
        <div className={`feedback ${msg?.good ? 'good' : 'bad'}`}>{msg?.text}</div>
      </div>

      <div className="card mc-grimoire">
        <div className="prompt-label">
          <T en="Your grimoire" jp="まどうしょ" />
        </div>
        <div className="mc-radicals">
          {unlocked.map((r) => (
            <button
              type="button"
              key={r.char}
              className="mc-radical"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', r.char)}
              onClick={() => placeRadical(r.char)}
              title={`${r.char} ${r.reading} · ${r.meaning}`}
              disabled={!!reveal || ending}
            >
              <span className="mc-radical-char" lang="ja">
                {r.char}
              </span>
              <span className="mc-radical-emoji">{r.emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {scene.length > 0 && (
        <div className="mc-scene" aria-label="Your growing world">
          {scene.map((e, i) => (
            <span key={i} className="mc-scene-item" style={{ animationDelay: `${(i % 3) * 0.08}s` }}>
              {e}
            </span>
          ))}
        </div>
      )}

      {reveal && <Reveal reveal={reveal} onNext={next} />}
    </div>
  )
}

function Reveal({ reveal, onNext }: { reveal: RevealState; onNext: () => void }) {
  const { recipe, isTarget, isNew, newRadicals, skipped } = reveal
  const n = recipe.parts.length
  return (
    <div className="mc-reveal-backdrop" role="dialog" aria-label={`Created ${recipe.result}`}>
      <div className="card mc-reveal">
        <div className="mc-reveal-stage">
          {recipe.parts.map((p, i) => (
            <span
              key={i}
              className="mc-reveal-part"
              lang="ja"
              style={{ ['--sx' as string]: `${(i - (n - 1) / 2) * 90}px`, ['--sy' as string]: n === 3 && i === 1 ? '-60px' : '30px' }}
            >
              {RADICAL_BY_CHAR.get(p)?.form ?? p}
            </span>
          ))}
          <span className="mc-reveal-kanji glow-text" lang="ja">
            {recipe.result}
          </span>
        </div>
        <div className="mc-reveal-text">
          <div className="mc-reveal-title">
            {skipped ? '📖 The answer' : isTarget ? '🎉 Riddle solved!' : isNew ? '✨ New kanji discovered!' : '✨ A kanji forms…'}
          </div>
          <div className="mc-reveal-recipe" lang="ja">
            {recipe.parts.join(' + ')} = {recipe.result}
          </div>
          <div className="mc-reveal-reading">
            <Jp text={recipe.result} reading={recipe.reading} /> · {recipe.emoji} {recipe.meaning}
          </div>
          <p className="mc-reveal-story">“{recipe.story}”</p>
          {newRadicals.length > 0 && (
            <div className="mc-unlock pop">
              🔓 New radical unlocked!{' '}
              {newRadicals.map((r) => (
                <span key={r} className="mc-unlock-char" lang="ja">
                  {r} <small>{RADICAL_BY_CHAR.get(r)?.emoji}</small>
                </span>
              ))}
            </div>
          )}
          {!isTarget && !skipped && <div className="muted">…but the riddle still waits.</div>}
        </div>
        <button type="button" className="btn btn-primary" onClick={onNext} autoFocus>
          <T en="Continue" jp="つぎへ" />
        </button>
      </div>
    </div>
  )
}

// ─── Shape the Land ─────────────────────────────────────────────────────

const MISCAST_COST = 2

type WorldPhase = 'play' | 'complete' | 'failed'

function World({ goal, onFinish, setHud }: { goal: number; onFinish: (r: GameResult) => void; setHud: HudSetter }) {
  const player = usePlayer()
  const wide = useWide()
  const showRomaji = player.settings.showRomaji
  const later = useTimers()
  const [burstNode, fire] = useBurst()
  const [flashCls, flash] = useFlash()
  const reviews = useRef<Review[]>([])
  const [objectives] = useState<Objective[]>(() => pickObjectives(goal))
  const [idx, setIdx] = useState(0)
  const obj = objectives[idx]
  const [map, setMap] = useState<LandMap>(() => makeMap())
  const [mana, setMana] = useState(() => manaFor(objectives[0]))
  const [palette, setPalette] = useState<Element[]>(() => shuffle(ELEMENTS))
  const [selected, setSelected] = useState<Element | null>(null)
  const reviewedSel = useRef(false)
  const [miscasts, setMiscasts] = useState(0)
  const [phase, setPhase] = useState<WorldPhase>('play')
  const [score, setScore] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [msg, setMsg] = useState<{ text: string; good: boolean } | null>(null)
  const [fizzleAt, setFizzleAt] = useState<{ r: number; c: number; el: Element; k: number } | null>(null)
  const [fresh, setFresh] = useState<Set<string>>(new Set())
  const [ending, setEnding] = useState(false)
  const elapsed = useAnswerTimer(selected)
  const maxMana = manaFor(obj)
  const reactions = useMemo(() => findReactions(map), [map])
  const doneCells = useMemo(() => (phase === 'complete' ? new Set(objectiveCells(obj.id, map).map(([r, c]) => `${r},${c}`)) : new Set<string>()), [phase, obj, map])

  useEffect(() => setHud({ mana, maxMana, label: `🗺️ ${Math.min(idx + 1, goal)}/${goal}` }), [mana, maxMana, idx, goal, setHud])

  const select = (el: Element) => {
    if (phase !== 'play') return
    sfx.click()
    if (el !== selected) reviewedSel.current = false
    setSelected(el)
  }

  const cast = (r: number, c: number) => {
    if (phase !== 'play' || ending) return
    const tile = map[r][c]
    if (!selected) {
      setMsg({ text: 'Choose a spell from the palette first.', good: false })
      return
    }
    if (tile === '#') {
      setMsg({ text: 'A great boulder blocks this tile.', good: false })
      return
    }
    if (tile === selected) return
    const info = ELEMENT_INFO[selected]
    const good = contributes(obj, selected)
    if (!reviewedSel.current) {
      reviewedSel.current = true
      reviews.current.push({ itemId: item.word(ELEMENT_WORD[selected]), correct: good, ms: elapsed() })
    }
    if (!good) {
      sfx.wrong()
      flash('bad')
      setMiscasts((n) => n + 1)
      setFizzleAt({ r, c, el: selected, k: (fizzleAt?.k ?? 0) + 1 })
      const need = obj.elements.map((e) => `${e} (${ELEMENT_INFO[e].reading}, ${ELEMENT_INFO[e].en})`).join(' or ')
      setMsg({ text: `💨 ${selected} is ${info.reading} “${info.en}”. It fizzles! This needs ${need}.`, good: false })
      const m = mana - MISCAST_COST
      setMana(Math.max(0, m))
      if (m <= 0) failObjective()
      return
    }
    const nm = map.map((row) => [...row])
    nm[r][c] = selected
    const before = new Set(reactions.map((h) => `${h.a}|${h.b}|${h.reaction.result}`))
    const after = findReactions(nm)
    const added = after.filter((h) => !before.has(`${h.a}|${h.b}|${h.reaction.result}`))
    setMap(nm)
    sfx.cast()
    const m = mana - 1
    setMana(m)
    setFresh(new Set(added.map((h) => `${h.a}|${h.b}`)))
    if (added.length) {
      const h = added[0]
      setMsg({ text: `${h.reaction.emoji} ${nm[h.a[0]][h.a[1]]} + ${nm[h.b[0]][h.b[1]]} → ${h.reaction.result} (${h.reaction.label})`, good: true })
    } else setMsg(null)
    if (checkObjective(obj.id, nm)) {
      completeObjective()
    } else if (m <= 0) failObjective()
  }

  const completeObjective = () => {
    const pts = objectivePoints(true, miscasts)
    setScore((s) => s + pts)
    setCompleted((n) => n + 1)
    setPhase('complete')
    sfx.correct()
    flash('good')
    fire(50, 50, 20)
    later(() => void speak(obj.reading), 400)
  }

  const failObjective = () => {
    setPhase('failed')
    sfx.lose()
  }

  const nextObjective = () => {
    if (phase === 'play' || ending) return
    if (idx + 1 >= objectives.length) {
      setEnding(true)
      const finalScore = score
      if (finalScore > 0) sfx.win()
      later(
        () =>
          onFinish({
            score: finalScore,
            maxScore: goal * 2,
            reviews: reviews.current,
            notes: [`Shaped ${completed} of ${goal} lands.`],
          }),
        900,
      )
      return
    }
    const ni = idx + 1
    setIdx(ni)
    setMap(makeMap())
    setMana(manaFor(objectives[ni]))
    setPalette(shuffle(ELEMENTS))
    setSelected(null)
    reviewedSel.current = false
    setMiscasts(0)
    setPhase('play')
    setMsg(null)
    setFresh(new Set())
  }

  // Keyboard: 1–6 choose a spell, Enter continues.
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {})
  useEffect(() => {
    keyRef.current = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= palette.length) select(palette[n - 1])
      else if (e.key === 'Enter' && phase !== 'play') {
        e.preventDefault()
        nextObjective()
      }
    }
  })
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const rows = map.length
  const cols = map[0].length
  const scale = wide ? 4 : 3
  const cell = 16 * scale
  const terrain: StripCell[][] = map.map((row) => row.map((t) => TERRAIN[t ?? ''] ?? 'grass'))
  const reacting = new Map<string, ReactionHit>()
  for (const h of reactions) {
    reacting.set(h.a.join(), h)
    reacting.set(h.b.join(), h)
  }

  return (
    <div className="mc-world">
      <div className="card mc-quest pop" key={idx}>
        <div className="mc-quest-jp" lang="ja">
          <span className="mc-quest-emoji">{obj.emoji}</span> {obj.jp}
        </div>
        <div className="mc-quest-en">
          {obj.en} <span className="muted">(</span>
          <Jp text={obj.kanji} reading={obj.reading} />
          <span className="muted">)</span>
        </div>
        <div className="muted mc-quest-hint">{obj.hint}</div>
      </div>

      <div className={`mc-map-wrap ${flashCls}`}>
        {burstNode}
        <div className="mc-map" style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridAutoRows: `${cell}px` }}>
          <div className="mc-terrain" style={{ width: cols * cell }} aria-hidden>
            <TileStrip rows={terrain} scale={scale} align="start" />
          </div>
          {map.map((row, r) =>
            row.map((t, c) => {
              const key = `${r},${c}`
              const el = t && t !== '#' ? ELEMENT_INFO[t] : null
              const fz = fizzleAt && fizzleAt.r === r && fizzleAt.c === c ? fizzleAt : null
              return (
                <button
                  type="button"
                  key={key}
                  className={`mc-tile ${t === '#' ? 'boulder' : ''} ${el ? 'filled' : ''} ${reacting.has(key) ? 'reacting' : ''} ${doneCells.has(key) ? 'done' : ''}`}
                  style={el ? { ['--tile' as string]: el.color } : undefined}
                  onClick={() => cast(r, c)}
                  aria-label={t === '#' ? 'Boulder' : t ? `${t} tile` : `Empty tile row ${r + 1} column ${c + 1}`}
                >
                  {t !== '#' && el ? (
                    <span className="mc-tile-kanji" lang="ja">
                      {t}
                    </span>
                  ) : null}
                  {fz && (
                    <span key={fz.k} className="mc-fizzle" aria-hidden>
                      {ELEMENT_INFO[fz.el].emoji}💨
                    </span>
                  )}
                </button>
              )
            }),
          )}
          {reactions.map((h) => {
            const x = (((h.a[1] + h.b[1]) / 2 + 0.5) / cols) * 100
            const y = (((h.a[0] + h.b[0]) / 2 + 0.5) / rows) * 100
            const k = `${h.a}|${h.b}`
            return (
              <span key={k} className={`mc-reaction ${fresh.has(k) ? 'fresh' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} title={`${h.reaction.result} ${h.reaction.label}`}>
                {h.reaction.emoji}
              </span>
            )
          })}
        </div>
      </div>

      <div className={`feedback ${msg?.good ? 'good' : 'bad'} mc-world-msg`}>{msg?.text}</div>

      {phase === 'play' ? (
        <div className="mc-palette" role="radiogroup" aria-label="Element spells">
          {palette.map((el, i) => (
            <button
              type="button"
              key={el}
              role="radio"
              aria-checked={selected === el}
              className={`mc-spell ${selected === el ? 'selected' : ''}`}
              onClick={() => select(el)}
              disabled={phase !== 'play'}
            >
              <span className="mc-spell-key">{i + 1}</span>
              <span className="mc-spell-kanji" lang="ja">
                {el}
              </span>
              {showRomaji && <span className="mc-spell-romaji">{wanakana.toRomaji(ELEMENT_INFO[el].reading)}</span>}
            </button>
          ))}
        </div>
      ) : (
        <div className={`card mc-map-banner ${phase}`}>
          {phase === 'complete' ? (
            <>
              <div className="mc-banner-kanji glow-text pop" lang="ja">
                {obj.kanji}
              </div>
              <div>
                <Jp text={obj.kanji} reading={obj.reading} /> {obj.emoji} {obj.en.replace(/^\w+ an? /i, '')}!
              </div>
              <div className="mc-banner-sub">{miscasts === 0 ? '✨ Flawless casting!' : `${miscasts} mis-cast${miscasts > 1 ? 's' : ''}`}</div>
            </>
          ) : (
            <>
              <div className="mc-banner-kanji bad" lang="ja">
                {obj.kanji}
              </div>
              <div>Out of mana! 🔮</div>
              <div className="mc-banner-sub">
                {obj.hint} Use: {obj.elements.map((e) => `${e} ${ELEMENT_INFO[e].emoji}`).join(' + ')}
              </div>
            </>
          )}
          <button type="button" className="btn btn-primary" onClick={nextObjective} disabled={ending} autoFocus>
            {idx + 1 >= objectives.length ? <T en="Finish" jp="おわり" /> : <T en="Next quest" jp="つぎへ" />}
          </button>
        </div>
      )}
    </div>
  )
}

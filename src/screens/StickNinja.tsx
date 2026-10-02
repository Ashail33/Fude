/**
 * Stick Ninja (ぼうにんじゃ): a side-on sword fighter for a break from
 * studying. Fight through five worlds of bandits, spearmen, shinobi and
 * brutes; level up, buy better swords with the ryō you win, and beat the
 * five bosses. First clears also bring spirit shards back to the journey.
 *
 * The fight engine is in ../arcade/ninja (sim + draw); this screen is the
 * dojo (stages, armoury), the fight view with its controls, and results.
 */
import { useEffect, useRef, useState } from 'react'
import {
  buySword,
  canBuy,
  clearBonus,
  FOES,
  freshNinja,
  heroStats,
  settleStage,
  stageAt,
  stageUnlocked,
  STAGE_COUNT,
  STAGES_PER_WORLD,
  SWORD_BY_ID,
  SWORDS,
  WORLDS,
  xpToNext,
  type NinjaSave,
  type StageResult,
  type SwordId,
} from '../arcade/ninja/data'
import { draw, resetCamera } from '../arcade/ninja/draw'
import { createSim, noInput, step, type Input, type Sim } from '../arcade/ninja/sim'
import { ninjaStageOpen, ninjaWorldGate } from '../arcade/story'
import { BackLink, isOpen, Locked } from '../arcade/ui'
import { useHdLoaded, useHdLoadedMany } from '../art/hd'
import { sfx } from '../engine/sfx'
import { grantRewards, setState, usePlayer } from '../engine/store'
import './StickNinja.css'

type View = { k: 'dojo' } | { k: 'fight'; stage: number; run: number } | { k: 'result'; stage: number; won: boolean; r: StageResult; kills: number; chain: number }

const saveOf = (n: NinjaSave | undefined) => n ?? freshNinja()

/** Which stages the journey has opened (Stick Ninja's worlds follow the story). */
function useStoryGate() {
  const p = usePlayer()
  return (i: number) => ninjaStageOpen(p, i)
}

export default function StickNinja() {
  const p = usePlayer()
  const save = saveOf(p.ninja)
  const [view, setView] = useState<View>({ k: 'dojo' })
  const [tab, setTab] = useState<'stages' | 'armory' | 'how'>('stages')

  const story = useStoryGate()
  const start = (stage: number) => setView({ k: 'fight', stage, run: Date.now() })

  const finish = (stage: number, s: Sim) => {
    const won = s.outcome === 'win'
    const r = settleStage(save, stageAt(stage), won, s.xp, s.ryo)
    setState((st) => ({ ...st, ninja: r.save }))
    if (r.shards) grantRewards(0, r.shards)
    if (r.levelsGained) sfx.levelUp()
    setView({ k: 'result', stage, won, r, kills: s.kills, chain: s.bestChain })
  }

  if (!isOpen(p, 'dojo'))
    return (
      <Locked
        game="dojo"
        title={
          <>
            <span lang="ja">ぼうにんじゃ</span> Stick Ninja
          </>
        }
      />
    )
  if (view.k === 'fight') return <Fight key={view.run} stage={view.stage} save={save} onEnd={(s) => finish(view.stage, s)} onQuit={() => setView({ k: 'dojo' })} />
  if (view.k === 'result') return <Result view={view} save={save} open={story} onNext={start} onDojo={() => setView({ k: 'dojo' })} />

  const st = heroStats(save.level)
  const sword = SWORD_BY_ID[save.sword]
  const affordable = SWORDS.filter((s) => canBuy(save, s.id) === 'ok').length
  return (
    <main className="nj-page">
      <header className="nj-head">
        <BackLink />
        <h1>
          <span lang="ja">ぼうにんじゃ</span> Stick Ninja
        </h1>
      </header>
      <section className="card nj-stats">
        <HeroArt />
        <div className="nj-lv">
          <b>Lv {save.level}</b>
          <div className="nj-xp" title={`${save.xp} / ${xpToNext(save.level)} XP`}>
            <i style={{ width: `${(save.xp / xpToNext(save.level)) * 100}%` }} />
          </div>
          <small>
            {save.xp} / {xpToNext(save.level)} XP
          </small>
        </div>
        <div className="nj-nums">
          <span title="Health">❤️ {st.hp}</span>
          <span title="Attack">⚔️ {Math.round(sword.dmg * st.atkMul)}</span>
          <span title="Ryō (coins)">💰 {save.ryo}</span>
        </div>
        <div className="nj-sword">
          <span lang="ja">{sword.jp}</span> {sword.name} · ✨ {sword.specialName}
        </div>
      </section>
      <nav className="nj-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'stages'} className={tab === 'stages' ? 'on' : ''} onClick={() => setTab('stages')}>
          ⛩️ Stages
        </button>
        <button role="tab" aria-selected={tab === 'armory'} className={tab === 'armory' ? 'on' : ''} onClick={() => setTab('armory')}>
          🗡️ Armoury{affordable > 0 && <em className="nj-dot">{affordable}</em>}
        </button>
        <button role="tab" aria-selected={tab === 'how'} className={tab === 'how' ? 'on' : ''} onClick={() => setTab('how')}>
          📜 How to play
        </button>
      </nav>
      {tab === 'stages' && <Stages save={save} open={story} onStart={start} />}
      {tab === 'armory' && <Armory save={save} />}
      {tab === 'how' && <HowTo />}
    </main>
  )
}

function HeroArt() {
  const url = useHdLoaded('nj-hero')
  return url ? <img src={url} alt="" className="nj-hero-art" /> : null
}

function Stages({ save, open: storyOpen, onStart }: { save: NinjaSave; open: (i: number) => boolean; onStart: (i: number) => void }) {
  const bgs = useHdLoadedMany(WORLDS.map((_, i) => `nj-bg-${i}`))
  const bosses = useHdLoadedMany(WORLDS.map((w) => `nj-${w.boss}`))
  return (
    <div className="nj-worlds">
      {WORLDS.map((w, wi) => {
        const first = wi * STAGES_PER_WORLD
        const gate = storyOpen(first)
        const open = gate && stageUnlocked(save, first)
        const boss = FOES[w.boss]
        const gateRegion = ninjaWorldGate(wi)
        return (
          <section
            key={w.name}
            className={`card nj-world nj-w${wi}${open ? '' : ' locked'}${bgs[wi] ? ' painted' : ''}`}
            style={bgs[wi] ? { backgroundImage: `linear-gradient(90deg, rgba(8,7,13,0.88) 30%, rgba(8,7,13,0.35)), url(${bgs[wi]})` } : undefined}
          >
            {bosses[wi] && <img src={bosses[wi]!} alt="" className="nj-world-boss" />}
            <h2>
              <span lang="ja">{w.jp}</span> {w.name}
            </h2>
            <small className="muted">
              Boss: {boss.name} <span lang="ja">{boss.jp}</span>
            </small>
            {!gate && gateRegion && (
              <small className="nj-gate">
                🔒 The scroll opens this world when your journey reaches {gateRegion.emoji} {gateRegion.name} <span lang="ja">{gateRegion.jp}</span>.
              </small>
            )}
            <div className="nj-stage-row">
              {Array.from({ length: STAGES_PER_WORLD }, (_, k) => {
                const i = first + k
                const isBoss = k === STAGES_PER_WORLD - 1
                const done = i < save.cleared
                const unlocked = gate && stageUnlocked(save, i)
                return (
                  <button
                    key={i}
                    className={`nj-stage${isBoss ? ' boss' : ''}${done ? ' done' : ''}${i === save.cleared ? ' next' : ''}`}
                    disabled={!unlocked}
                    onClick={() => onStart(i)}
                    aria-label={`Stage ${wi + 1}-${k + 1}${isBoss ? ', boss' : ''}${done ? ', cleared' : unlocked ? '' : ', locked'}`}
                  >
                    {!unlocked ? '🔒' : isBoss ? '👹' : `${wi + 1}-${k + 1}`}
                    {done && <i>✓</i>}
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
      {save.cleared >= STAGE_COUNT && <p className="card nj-done">🏆 You have beaten every boss. Replay any stage to grind ryō and XP.</p>}
    </div>
  )
}

function Armory({ save }: { save: NinjaSave }) {
  const set = (fn: (n: NinjaSave) => NinjaSave | null) =>
    setState((s) => {
      const next = fn(saveOf(s.ninja))
      return next ? { ...s, ninja: next } : s
    })
  const buy = (id: SwordId) => {
    sfx.coin()
    set((n) => buySword(n, id))
  }
  const equip = (id: SwordId) => {
    sfx.confirm()
    set((n) => ({ ...n, sword: id }))
  }
  const top = { dmg: 34, speed: 1.6, reach: 80 }
  return (
    <div className="nj-swords">
      {SWORDS.map((sw) => {
        const check = canBuy(save, sw.id)
        const owned = check === 'owned'
        const on = save.sword === sw.id
        return (
          <article key={sw.id} className={`card nj-blade${on ? ' on' : ''}${owned ? '' : ' unowned'}`} style={{ '--blade': sw.color } as React.CSSProperties}>
            <div className="nj-blade-art" aria-hidden>
              <svg viewBox="0 0 120 20">
                <rect x="2" y="8" width="22" height="4" rx="1" fill="#2b2b2b" />
                <rect x="23" y="4" width="3" height="12" rx="1" fill="#c9a227" />
                <path d={`M26 8 L${26 + (sw.reach / 80) * 90} 9 L${22 + (sw.reach / 80) * 90} 12 L26 12 Z`} fill={sw.color} />
                {sw.twin && <path d={`M26 2 L${26 + (sw.reach / 80) * 70} 3 L${22 + (sw.reach / 80) * 70} 5 L26 5 Z`} fill={sw.color} opacity="0.7" />}
              </svg>
            </div>
            <h3>
              <span lang="ja">{sw.jp}</span> {sw.name}
            </h3>
            <p className="muted">{sw.blurb}</p>
            <dl className="nj-bars">
              <dt>Power</dt>
              <dd>
                <i style={{ width: `${(sw.dmg / top.dmg) * 100}%` }} />
              </dd>
              <dt>Speed</dt>
              <dd>
                <i style={{ width: `${(sw.speed / top.speed) * 100}%` }} />
              </dd>
              <dt>Reach</dt>
              <dd>
                <i style={{ width: `${(sw.reach / top.reach) * 100}%` }} />
              </dd>
            </dl>
            <p className="nj-special">
              ✨ {sw.specialName}
              {sw.burn && ' · 🔥 burns'}
              {sw.lifesteal && ' · 🌙 drains life'}
            </p>
            {on ? (
              <span className="nj-equipped">✓ Equipped</span>
            ) : owned ? (
              <button className="btn btn-sm" onClick={() => equip(sw.id)}>
                Equip
              </button>
            ) : (
              <button className="btn btn-sm btn-primary" disabled={check !== 'ok'} onClick={() => buy(sw.id)}>
                {check === 'level' ? `🔒 Lv ${sw.level}` : `💰 ${sw.cost}`}
              </button>
            )}
          </article>
        )
      })}
    </div>
  )
}

function HowTo() {
  return (
    <section className="card nj-how">
      <h2>How to fight</h2>
      <table>
        <tbody>
          <tr>
            <td>Move</td>
            <td>
              <kbd>←</kbd> <kbd>→</kbd> / <kbd>A</kbd> <kbd>D</kbd> · ◀ ▶
            </td>
          </tr>
          <tr>
            <td>Jump (twice in the air)</td>
            <td>
              <kbd>↑</kbd> / <kbd>W</kbd> / <kbd>Space</kbd> · ⤒
            </td>
          </tr>
          <tr>
            <td>Attack (tap 3× to combo)</td>
            <td>
              <kbd>J</kbd> / <kbd>Z</kbd> · ⚔️
            </td>
          </tr>
          <tr>
            <td>Guard (hold)</td>
            <td>
              <kbd>K</kbd> / <kbd>X</kbd> · 🛡️
            </td>
          </tr>
          <tr>
            <td>Dash (dodge through attacks)</td>
            <td>
              <kbd>L</kbd> / <kbd>C</kbd> / <kbd>Shift</kbd> · 💨
            </td>
          </tr>
          <tr>
            <td>Special (when the blue bar is full)</td>
            <td>
              <kbd>I</kbd> / <kbd>V</kbd> · ✨
            </td>
          </tr>
        </tbody>
      </table>
      <ul>
        <li>
          <b>Parry:</b> raise your guard just before a hit lands to stun the attacker. Parried shuriken fly back.
        </li>
        <li>
          <b>Combos:</b> the third cut knocks foes flying. Landing hits fills your special bar.
        </li>
        <li>
          <b>Jump</b> over the Oni’s shockwaves; <b>dash</b> through attacks you cannot block (they glow orange).
        </li>
        <li>Lost a fight? You keep the XP and half the ryō, so you come back stronger.</li>
        <li>First clears bring spirit shards ✦ back to your journey.</li>
      </ul>
    </section>
  )
}

// ─── The fight ─────────────────────────────────────────────────────────

const KEYS: Record<string, keyof Input> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  KeyJ: 'attack',
  KeyZ: 'attack',
  KeyK: 'block',
  KeyX: 'block',
  ArrowDown: 'block',
  KeyS: 'block',
  KeyL: 'dash',
  KeyC: 'dash',
  ShiftLeft: 'dash',
  ShiftRight: 'dash',
  KeyI: 'special',
  KeyV: 'special',
  KeyE: 'special',
}
const EDGES: (keyof Input)[] = ['jump', 'attack', 'dash', 'special']

const SOUNDS: Record<string, () => void> = {
  hit: sfx.hit,
  hurt: sfx.hurt,
  parry: sfx.crit,
  block: sfx.click,
  special: sfx.cast,
  thunder: sfx.crit,
  kill: sfx.coin,
  boss: sfx.encounter,
  bossDown: sfx.levelUp,
  win: sfx.win,
  dead: sfx.lose,
  slam: sfx.hurt,
  throw: sfx.stroke,
  dash: sfx.stroke,
}

function Fight({ stage, save, onEnd, onQuit }: { stage: number; save: NinjaSave; onEnd: (s: Sim) => void; onQuit: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const input = useRef<Input>(noInput())
  const paused = useRef(false)
  const [isPaused, setPaused] = useState(false)
  const [ready, setReady] = useState(false)
  const endRef = useRef(onEnd)
  endRef.current = onEnd

  useEffect(() => {
    const c = canvas.current!
    const ctx = c.getContext('2d')!
    const sim = createSim(stageAt(stage), save.level, SWORD_BY_ID[save.sword])
    resetCamera()
    let raf = 0
    let last = performance.now()
    let ended = false
    let lastSound = 0
    let wasReady = false
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!paused.current) {
        let rem = dt
        while (rem > 1e-4) {
          const d = Math.min(1 / 60, rem)
          rem -= d
          if (step(sim, input.current, d)) for (const k of EDGES) input.current[k] = false
        }
        for (const e of sim.events) {
          if ((e === 'hit' || e === 'block') && now - lastSound < 60) continue
          lastSound = now
          SOUNDS[e]?.()
        }
        sim.events = []
      }
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const pw = Math.round(c.clientWidth * dpr)
      const ph = Math.round(c.clientHeight * dpr)
      if (c.width !== pw || c.height !== ph) {
        c.width = pw
        c.height = ph
      }
      draw(ctx, sim, save.level, c.width, c.height, dt)
      const full = sim.meter >= 100
      if (full !== wasReady) {
        wasReady = full
        setReady(full)
      }
      if (sim.outcome && sim.outcomeT > 1.8 && !ended) {
        ended = true
        endRef.current(sim)
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // The fight runs once per mount (a retry remounts it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        paused.current = !paused.current
        setPaused(paused.current)
        return
      }
      const k = KEYS[e.code]
      if (!k) return
      e.preventDefault()
      if (EDGES.includes(k) && e.repeat) return
      input.current[k] = true
    }
    const up = (e: KeyboardEvent) => {
      const k = KEYS[e.code]
      if (k && !EDGES.includes(k)) input.current[k] = false
    }
    const blur = () => (input.current = noInput())
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  const pad = (k: keyof Input, label: string, cls = '') => (
    <button
      className={`nj-pad ${cls}`}
      aria-label={k}
      onPointerDown={(e) => {
        e.preventDefault()
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        input.current[k] = true
      }}
      onPointerUp={() => {
        if (!EDGES.includes(k)) input.current[k] = false
      }}
      onPointerCancel={() => (input.current[k] = false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  )

  const togglePause = () => {
    paused.current = !paused.current
    setPaused(paused.current)
  }

  return (
    <div className="nj-fight">
      <div className="nj-screen">
        <canvas ref={canvas} className="nj-canvas" />
        <button className="nj-pause" onClick={togglePause} aria-label="Pause">
          <span aria-hidden>II</span>
        </button>
        {isPaused && (
          <div className="nj-paused">
            <h2>Paused</h2>
            <button className="btn btn-primary" onClick={togglePause}>
              ▶ Resume
            </button>
            <button className="btn" onClick={onQuit}>
              🏳️ Leave the fight
            </button>
          </div>
        )}
      </div>
      <div className="nj-controls">
        <div className="nj-dpad">
          {pad('left', '◀')}
          {pad('right', '▶')}
        </div>
        <div className="nj-actions">
          {pad('block', '🛡️', 'block')}
          {pad('dash', '💨', 'dash')}
          {pad('special', '✨', `special${ready ? ' ready' : ''}`)}
          {pad('jump', '⤒', 'jump')}
          {pad('attack', '⚔️', 'attack')}
        </div>
      </div>
      <p className="nj-keys muted">
        <kbd>A</kbd>/<kbd>D</kbd> move · <kbd>W</kbd> jump · <kbd>J</kbd> attack · <kbd>K</kbd> guard · <kbd>L</kbd> dash · <kbd>I</kbd> special · <kbd>Esc</kbd> pause
      </p>
    </div>
  )
}

function ResultArt({ id }: { id: string }) {
  const url = useHdLoaded(id)
  return url ? <img src={url} alt="" className="nj-res-art" /> : null
}

function Result({ view, save, open: storyOpen, onNext, onDojo }: { view: Extract<View, { k: 'result' }>; save: NinjaSave; open: (i: number) => boolean; onNext: (i: number) => void; onDojo: () => void }) {
  const { r, won, stage } = view
  const st = stageAt(stage)
  const w = WORLDS[st.world]
  const next = stage + 1 < STAGE_COUNT && stageUnlocked(save, stage + 1) && storyOpen(stage + 1) ? stage + 1 : null
  const nowAffordable = SWORDS.filter((s) => canBuy(save, s.id) === 'ok')
  return (
    <main className="nj-page nj-result">
      <section className={`card nj-res ${won ? 'won' : 'lost'}`}>
        <ResultArt id={st.boss ? `nj-${st.boss}` : 'nj-hero'} />
        <h1>{won ? (st.boss ? '👹 Boss defeated!' : '⛩️ Stage clear!') : '💀 Defeated…'}</h1>
        <p className="muted">
          <span lang="ja">{w.jp}</span> {w.name} · {st.world + 1}-{st.n}
        </p>
        <ul className="nj-res-list">
          <li>⚔️ {view.kills} foes cut down</li>
          {view.chain >= 3 && <li>🔥 Best combo: {view.chain} hits</li>}
          <li>✨ +{r.xp} XP</li>
          <li>
            💰 +{r.ryo} ryō{won && <small> (incl. {clearBonus(st)} clear bonus)</small>}
            {!won && <small> (half kept)</small>}
          </li>
          {r.levelsGained > 0 && (
            <li className="nj-up">
              ⬆️ Level up! Now Lv {r.save.level} (❤️ {heroStats(r.save.level).hp})
            </li>
          )}
          {r.shards > 0 && <li className="nj-up">✦ +{r.shards} spirit shards for your journey</li>}
          {won && st.boss && r.firstClear && (
            <li className="nj-up">
              🥋 <span lang="ja">スミ せんせいに しらせよう！</span> Tell Master Sumi in the bamboo grove: he has a keepsake (and a blessing) for you.
            </li>
          )}
          {won && stage + 1 < STAGE_COUNT && !storyOpen(stage + 1) && ninjaWorldGate(st.world + 1) && (
            <li>🔒 The next world opens when your journey reaches {ninjaWorldGate(st.world + 1)!.name}.</li>
          )}
          {nowAffordable.length > 0 && <li>🗡️ You can afford {nowAffordable.map((s) => s.name).join(', ')} in the Armoury!</li>}
        </ul>
        <div className="nj-res-btns">
          {won && next !== null && (
            <button className="btn btn-primary" onClick={() => onNext(next)}>
              Next stage ▶
            </button>
          )}
          <button className={`btn${won ? '' : ' btn-primary'}`} onClick={() => onNext(stage)}>
            ↻ {won ? 'Play again' : 'Try again'}
          </button>
          <button className="btn" onClick={onDojo}>
            ⛩️ Dojo
          </button>
        </div>
      </section>
    </main>
  )
}

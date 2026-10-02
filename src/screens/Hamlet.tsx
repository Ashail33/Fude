/**
 * The Hidden Village (隠れ里): build and upgrade your own village between
 * adventures (see engine/hamlet). Each plot is drawn as a little diorama of
 * real map tiles; buildings strengthen the mage in every battle, and yokai
 * raids are fought in the normal battle system.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { BackLink, isOpen, Locked } from '../arcade/ui'
import { useHdLoaded } from '../art/hd'
import { computeNeighbours, drawTile, type TileId } from '../art/tiles'
import Battle, { type BattleOutcome } from '../battle/Battle'
import { REGION_POOLS } from '../battle/logic'
import { REGIONS } from '../data/regions'
import {
  affordable,
  BUILDING_BY_ID,
  BUILDINGS,
  bonuses,
  blocker,
  buildTime,
  capacity,
  COLS,
  costOf,
  endRaid,
  freshHamlet,
  openPlots,
  production,
  raidDue,
  raiders,
  raidReward,
  ROWS,
  rushCost,
  settle,
  startBuild,
  type BuildingId,
  type Cost,
  type HamletState,
} from '../engine/hamlet'
import { sfx } from '../engine/sfx'
import { addItem, getState, regionUnlocked, setState, usePlayer } from '../engine/store'
import './Hamlet.css'

/** Each building as a 3×3 diorama of overworld tiles ('.' = grass). */
const ART: Record<BuildingId | 'empty' | 'locked' | 'site', string[]> = {
  manor: ['vvv', 'jjj', 'HDH'],
  lumber: ['TPT', '.u.', 'x.x'],
  quarry: ['RrR', 'r.x', 'Rre'],
  paddy: ['~~~', '~~~', 'fff'],
  storehouse: ['^^^', 'AAA', '#D#'],
  dojo: ['^^^', 'AAA', 'HDH'],
  forge: ['^^^', '#D#', 'n&a'],
  shrine: ['K.K', '.I.', 'LnL'],
  apothecary: ['^^^', '#N#', 'pbp'],
  teahouse: ['vvv', 'jjj', '#N#'],
  wall: ['ZZZ', 'Z.Z', 'ZZZ'],
  empty: ['...', '.".', '...'],
  locked: [';;b', 'r;;', ';;;'],
  site: ['_x_', 'f_f', '_e_'],
}
const TILE: Record<string, { g: TileId; o?: TileId }> = {
  '.': { g: 'grass' },
  '"': { g: 'flowers' },
  ';': { g: 'tall-grass' },
  _: { g: 'dirt' },
  n: { g: 'stone-floor' },
  '~': { g: 'water' },
  v: { g: 'grass', o: 'roof-red' },
  j: { g: 'grass', o: 'roof-red-edge' },
  '^': { g: 'grass', o: 'roof' },
  A: { g: 'grass', o: 'roof-edge' },
  '#': { g: 'grass', o: 'wall' },
  H: { g: 'grass', o: 'wall-window' },
  D: { g: 'grass', o: 'door' },
  N: { g: 'grass', o: 'noren' },
  T: { g: 'grass', o: 'tree' },
  P: { g: 'grass', o: 'pine' },
  K: { g: 'grass', o: 'sakura' },
  u: { g: 'grass', o: 'stump' },
  x: { g: 'dirt', o: 'crate' },
  e: { g: 'dirt', o: 'barrel' },
  R: { g: 'dirt', o: 'boulder' },
  r: { g: 'grass', o: 'rock' },
  f: { g: 'grass', o: 'fence' },
  b: { g: 'grass', o: 'bush' },
  p: { g: 'grass', o: 'pot' },
  L: { g: 'stone-floor', o: 'lantern' },
  I: { g: 'stone-floor', o: 'torii' },
  a: { g: 'stone-floor', o: 'anvil' },
  '&': { g: 'dirt', o: 'campfire' },
  Z: { g: 'grass', o: 'stone-wall' },
}

function PlotArt({ kind }: { kind: keyof typeof ART }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    const rows = ART[kind]
    const cell = (x: number, y: number) => TILE[rows[y]?.[x] ?? '.'] ?? TILE['.']
    for (let y = 0; y < 3; y++)
      for (let x = 0; x < 3; x++) {
        const c = cell(x, y)
        drawTile(ctx, c.g, x * 16, y * 16, 1, 0, computeNeighbours((a, b) => (a < 0 || b < 0 || a > 2 || b > 2 ? null : cell(a, b).g), x, y), { tx: x, ty: y })
        if (c.o) drawTile(ctx, c.o, x * 16, y * 16, 1, 0, computeNeighbours((a, b) => (a < 0 || b < 0 || a > 2 || b > 2 ? null : cell(a, b).o ?? null), x, y), { tx: x, ty: y, under: c.g })
      }
  }, [kind])
  return <canvas ref={ref} width={48} height={48} className="hm-art" aria-hidden />
}

/** Painted building art when it has loaded; the pixel diorama until then. Bare land is drawn in CSS. */
function PlotPic({ kind }: { kind: keyof typeof ART }) {
  const painted = kind !== 'empty' && kind !== 'locked'
  const url = useHdLoaded(painted ? `hm-${kind}` : null)
  if (!painted) return <span className={`hm-ground ${kind}`} aria-hidden />
  if (!url) return <PlotArt kind={kind} />
  return (
    <>
      <span className="hm-ground" aria-hidden />
      <img src={url} alt="" className="hm-pic" draggable={false} />
    </>
  )
}

/** A building's painted thumbnail, or its emoji. */
function Thumb({ id, emoji }: { id: string; emoji: string }) {
  const url = useHdLoaded(`hm-${id}`)
  return url ? <img src={url} alt="" className="hm-thumb" /> : <span className="hm-emoji">{emoji}</span>
}

const RES_ICON: Record<keyof Cost, string> = { wood: '🪵', stone: '🪨', rice: '🌾', shards: '✦' }

function CostLine({ cost, h, shards }: { cost: Cost; h: HamletState; shards: number }) {
  return (
    <span className="hm-cost">
      {(Object.entries(cost) as [keyof Cost, number][]).map(([r, n]) => (
        <span key={r} className={(r === 'shards' ? shards : h.res[r]) < n ? 'short' : ''}>
          {RES_ICON[r]} {n}
        </span>
      ))}
    </span>
  )
}

const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  if (s >= 3600) return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`
}

export default function Hamlet() {
  const p = usePlayer()
  const banner = useHdLoaded('hamlet-bg')
  const [now, setNow] = useState(() => Date.now())
  const [sel, setSel] = useState<number | null>(null)
  const [raid, setRaid] = useState<{ region: number; enemies: string[] } | null>(null)
  const [note, setNote] = useState<string | null>(null)

  // found the village on the first visit; settle production once a second
  useEffect(() => {
    if (!getState().hamlet && isOpen(getState(), 'valley')) setState((s) => ({ ...s, hamlet: freshHamlet() }))
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    const h = getState().hamlet
    if (h && now - h.tick > 5000) setState((s) => (s.hamlet ? { ...s, hamlet: settle(s.hamlet, now) } : s))
  }, [now])

  const h = useMemo(() => (p.hamlet ? settle(p.hamlet, now) : null), [p.hamlet, now])
  if (!isOpen(p, 'valley'))
    return (
      <Locked
        game="valley"
        title={
          <>
            <span lang="ja">かくれざと</span> The Hidden Village
          </>
        }
      />
    )
  if (!h) return null

  const cap = capacity(h, now)
  const prod = production(h, now)
  const bonus = bonuses(h, now)
  const open = openPlots(h, now)
  const plot = sel !== null ? h.plots[sel] : undefined

  const save = (next: HamletState, shards = getState().shards) => setState((s) => ({ ...s, hamlet: next, shards }))
  const build = (i: number, id: BuildingId) => {
    const r = startBuild(h, p.shards, i, id, now)
    if (!r) return sfx.wrong()
    sfx.confirm()
    save(r.h, r.shards)
  }
  const rush = (i: number) => {
    const pl = h.plots[i]
    const c = rushCost(pl, now)
    if (!c || p.shards < c) return sfx.wrong()
    sfx.levelUp()
    save({ ...h, plots: { ...h.plots, [i]: { ...pl, until: now } } }, p.shards - c)
  }
  const collect = () => {
    const herbs = Math.floor(h.herbs)
    const tea = Math.floor(h.tea)
    if (!herbs && !tea) return
    if (herbs) addItem('herb', herbs)
    sfx.correct()
    save({ ...h, herbs: 0, tea: h.tea - tea }, p.shards + tea)
    setNote(`Collected${herbs ? ` 🌿 ${herbs} herb${herbs > 1 ? 's' : ''}` : ''}${tea ? ` ✦ ${tea} shards` : ''}`)
  }
  const defend = () => {
    // the raiders come from the farthest land the mage has reached
    const region = [...REGIONS].reverse().find((r) => regionUnlocked(p, r.id) && REGION_POOLS[r.id])?.id ?? 1
    const pool = REGION_POOLS[region]
    const n = raiders(h, now)
    setRaid({ region, enemies: Array.from({ length: n }, () => pool[Math.floor(Math.random() * pool.length)]) })
  }
  const raidOver = (o: BattleOutcome) => {
    const won = o === 'win'
    const reward = raidReward(h, now)
    setState((s) => (s.hamlet ? { ...s, hamlet: endRaid(s.hamlet, won), shards: s.shards + (won ? reward.shards : 0) } : s))
    setRaid(null)
    setNote(won ? `The raiders flee! +🪵${reward.res.wood} 🪨${reward.res.stone} 🌾${reward.res.rice} ✦${reward.shards}` : 'The raiders made off with some of the stores…')
  }

  if (raid)
    return (
      <div className="hm-battle">
        <Battle region={raid.region} enemies={raid.enemies as never} onEnd={raidOver} />
      </div>
    )

  const due = raidDue(h, now)
  return (
    <main className="hm-page">
      <header className={`hm-head${banner ? ' painted' : ''}`} style={banner ? { backgroundImage: `linear-gradient(180deg, rgba(8,7,13,0.15), rgba(8,7,13,0.75)), url(${banner})` } : undefined}>
        <BackLink />
        <h1>
          <span lang="ja">かくれざと</span> The Hidden Village
        </h1>
      </header>

      <section className="card hm-res">
        {(['wood', 'stone', 'rice'] as const).map((r) => (
          <span key={r} title={`+${prod[r]}/hour`}>
            {RES_ICON[r]} <b>{Math.floor(h.res[r])}</b>
            <small>/{cap}</small> <small className="hm-rate">+{prod[r]}/h</small>
          </span>
        ))}
        <span>
          ✦ <b>{p.shards}</b>
        </span>
      </section>

      <section className="card hm-bonus">
        <span>
          🧙 <T2 jp="まほうつかいの ちから" en="Your mage" />
        </span>
        <span>❤️ +{bonus.hp}</span>
        <span>💧 +{bonus.mp}</span>
        <span>⚔️ +{bonus.atk}</span>
        <span>✨ +{bonus.magic}</span>
        {(h.herbs >= 1 || h.tea >= 1) && (
          <button type="button" className="btn btn-sm btn-primary" onClick={collect}>
            {h.herbs >= 1 ? `🌿${Math.floor(h.herbs)} ` : ''}
            {h.tea >= 1 ? `✦${Math.floor(h.tea)} ` : ''}
            <T2 jp="あつめる" en="Collect" />
          </button>
        )}
      </section>

      {due ? (
        <section className="card hm-raid">
          <span>
            ⚔️ <T2 jp="ようかいの しゅうげき！" en="Yokai are raiding the village!" /> ({raiders(h, now)} 👹)
          </span>
          <button type="button" className="btn btn-primary" onClick={defend}>
            <T2 jp="まもる" en="Defend" />
          </button>
        </section>
      ) : (
        <p className="muted small hm-next">🗼 Next raid in {clock(h.raidAt - now)} · won {h.raidsWon}</p>
      )}
      {note && (
        <p className="hm-note" role="status" onClick={() => setNote(null)}>
          {note}
        </p>
      )}

      <div className="hm-grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const pl = h.plots[i]
          const locked = !pl && i >= open
          const building = pl && pl.until > now
          const def = pl ? BUILDING_BY_ID.get(pl.id)! : null
          return (
            <button key={i} type="button" className={`hm-plot ${sel === i ? 'sel' : ''} ${locked ? 'locked' : ''}`} disabled={locked} onClick={() => setSel(sel === i ? null : i)} aria-label={def ? `${def.name} level ${pl!.level}` : locked ? 'Locked land' : 'Empty plot'}>
              <PlotPic kind={building && pl!.level === 1 ? 'site' : (pl?.id ?? (locked ? 'locked' : 'empty'))} />
              {pl && <span className="hm-lv">{pl.level}</span>}
              {building && (
                <span className="hm-timer">
                  <span style={{ width: `${100 - ((pl!.until - now) / (buildTime(pl!.id, pl!.level) * 1000)) * 100}%` }} />
                </span>
              )}
              {!pl && !locked && <span className="hm-plus">＋</span>}
            </button>
          )
        })}
      </div>

      {sel !== null && (
        <section className="card hm-panel">
          {!plot ? (
            <>
              <h2>
                <T2 jp="なにを たてる？" en="Build something" />
              </h2>
              <ul className="hm-list">
                {BUILDINGS.filter((b) => b.id !== 'manor').map((b) => {
                  const why = blocker(h, b.id, 1, now)
                  const cost = costOf(b.id, 1)
                  const ok = !why && affordable(h, p.shards, cost)
                  return (
                    <li key={b.id}>
                      <Thumb id={b.id} emoji={b.emoji} />
                      <span className="hm-info">
                        <b>
                          {b.name} <span lang="ja">{b.jp}</span>
                        </b>
                        <small>{b.desc}</small>
                        {why ? <small className="hm-why">{why}</small> : <CostLine cost={cost} h={h} shards={p.shards} />}
                      </span>
                      <button type="button" className="btn btn-sm btn-primary" disabled={!ok} onClick={() => build(sel, b.id)}>
                        ⏱ {clock(buildTime(b.id, 1) * 1000)}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          ) : (
            (() => {
              const def = BUILDING_BY_ID.get(plot.id)!
              const busy = plot.until > now
              const to = plot.level + 1
              const why = busy ? null : blocker(h, plot.id, to, now)
              const cost = costOf(plot.id, to)
              return (
                <>
                  <h2>
                    {def.emoji} {def.name} <span lang="ja">{def.jp}</span> · Lv {plot.level}
                  </h2>
                  <p className="muted small">{def.desc}</p>
                  {busy ? (
                    <p>
                      🔨 {plot.level === 1 ? 'Building' : 'Upgrading'}… {clock(plot.until - now)}{' '}
                      <button type="button" className="btn btn-sm" disabled={p.shards < rushCost(plot, now)} onClick={() => rush(sel)}>
                        ⚡ Finish now (✦{rushCost(plot, now)})
                      </button>
                    </p>
                  ) : why ? (
                    <p className="hm-why">{why}</p>
                  ) : (
                    <p>
                      <T2 jp="レベルアップ" en="Upgrade" /> → Lv {to}: <CostLine cost={cost} h={h} shards={p.shards} />{' '}
                      <button type="button" className="btn btn-sm btn-primary" disabled={!affordable(h, p.shards, cost)} onClick={() => build(sel, plot.id)}>
                        ⏱ {clock(buildTime(plot.id, to) * 1000)}
                      </button>
                    </p>
                  )}
                </>
              )
            })()
          )}
        </section>
      )}
    </main>
  )
}

function T2({ jp, en }: { jp: string; en: string }) {
  return (
    <span className="bi-inline">
      <span lang="ja">{jp}</span> <small>{en}</small>
    </span>
  )
}

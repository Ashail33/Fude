/**
 * Stick Ninja (ぼうにんじゃ): a side-on sword fighter for a break from
 * studying. Fight through ten worlds of bandits, kappa, ghosts and samurai,
 * then down the endless Ink Abyss; level up, buy (or find) better swords and
 * armour, grow the special move with the Ink Arts, and beat the bosses.
 * First clears also bring spirit shards back to the journey.
 *
 * The fight engine is in ../arcade/ninja (sim + draw); this screen is the
 * dojo (stages, armoury, Ink Arts), the fight view with its controls
 * (keyboard, touch and gamepad), and results.
 */
import { useEffect, useRef, useState } from 'react'
import {
  ARMORS,
  armorOf,
  armorsOf,
  ART_BY_ID,
  artFree,
  artPoints,
  ARTS,
  artsOf,
  buyArmor,
  buySword,
  canBuy,
  canBuyArmor,
  canLearn,
  clearBonus,
  FIRST_WORLDS,
  FOES,
  freshNinja,
  gearName,
  hasGear,
  heroStats,
  infuse,
  learnArt,
  MOD_INFO,
  PERK_INFO,
  rankOf,
  resetArts,
  settleStage,
  stageAt,
  stageUnlocked,
  STAGE_COUNT,
  STAGES_PER_WORLD,
  SWORD_BY_ID,
  SWORDS,
  WORLDS,
  xpToNext,
  type ArmorId,
  type ArtDef,
  type Element,
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
type Tab = 'stages' | 'armory' | 'arts' | 'how'

const saveOf = (n: NinjaSave | undefined) => n ?? freshNinja()

/** Change the ninja save (no-op when `fn` returns null). */
const setSave = (fn: (n: NinjaSave) => NinjaSave | null) =>
  setState((s) => {
    const next = fn(saveOf(s.ninja))
    return next ? { ...s, ninja: next } : s
  })

/** Which stages the journey has opened (Stick Ninja's worlds follow the story). */
function useStoryGate() {
  const p = usePlayer()
  return (i: number) => ninjaStageOpen(p, i)
}

const abyssOpen = (save: NinjaSave) => save.cleared >= FIRST_WORLDS * STAGES_PER_WORLD

export default function StickNinja() {
  const p = usePlayer()
  const save = saveOf(p.ninja)
  const [view, setView] = useState<View>({ k: 'dojo' })
  const [tab, setTab] = useState<Tab>('stages')

  const story = useStoryGate()
  const start = (stage: number) => setView({ k: 'fight', stage, run: Date.now() })

  const finish = (stage: number, s: Sim) => {
    const won = s.outcome === 'win'
    const r = settleStage(save, stageAt(stage), won, s.xp, s.ryo, s.found)
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
  const armor = armorOf(save)
  const el = artsOf(save).element
  const affordable = SWORDS.filter((s) => canBuy(save, s.id) === 'ok').length + ARMORS.filter((a) => canBuyArmor(save, a.id) === 'ok').length
  const free = artFree(save)
  const tabBtn = (t: Tab, label: React.ReactNode) => (
    <button role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
      {label}
    </button>
  )
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
          <span title="Health">❤️ {st.hp + armor.hp}</span>
          <span title="Attack">⚔️ {Math.round(sword.dmg * st.atkMul)}</span>
          <span title="Defence">🛡️ {Math.round(armor.def * 100)}%</span>
          <span title="Ryō (coins)">💰 {save.ryo}</span>
        </div>
        <div className="nj-sword">
          <span lang="ja">{sword.jp}</span> {sword.name} · ✨ {sword.specialName}
          {el && ` · ${ART_BY_ID[`el:${el}`].icon}`} · {armor.name}
        </div>
      </section>
      <nav className="nj-tabs" role="tablist">
        {tabBtn('stages', '⛩️ Stages')}
        {tabBtn(
          'armory',
          <>
            🗡️ Armoury{affordable > 0 && <em className="nj-dot">{affordable}</em>}
          </>,
        )}
        {tabBtn(
          'arts',
          <>
            🖌️ Ink Arts{free > 0 && <em className="nj-dot">{free}</em>}
          </>,
        )}
        {tabBtn('how', '📜 How to play')}
      </nav>
      {tab === 'stages' && <Stages save={save} open={story} onStart={start} />}
      {tab === 'armory' && <Armory save={save} />}
      {tab === 'arts' && <InkArts save={save} />}
      {tab === 'how' && <HowTo />}
    </main>
  )
}

function HeroArt() {
  const url = useHdLoaded('nj-hero')
  return url ? <img src={url} alt="" className="nj-hero-art" /> : null
}

const BOSS_ART: Record<string, string> = { kappaking: 'nj-kappa', gasha: 'nj-gasha', frost: 'nj-frost', storm: 'nj-storm', quiet: 'nj-quiet' }
const bossArt = (kind: string) => BOSS_ART[kind] ?? `nj-${kind}`

function Stages({ save, open: storyOpen, onStart }: { save: NinjaSave; open: (i: number) => boolean; onStart: (i: number) => void }) {
  const bgs = useHdLoadedMany(WORLDS.map((_, i) => `nj-bg-${i}`))
  const bosses = useHdLoadedMany(WORLDS.map((w) => bossArt(w.boss)))
  const floor = save.abyss ?? 0
  return (
    <div className="nj-worlds">
      {WORLDS.map((w, wi) => {
        const first = wi * STAGES_PER_WORLD
        const gate = storyOpen(first)
        const open = gate && stageUnlocked(save, first)
        const boss = FOES[w.boss]
        const gateRegion = ninjaWorldGate(wi)
        const chest = stageAt(first + 2).chest
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
              {chest && (hasGear(save, chest) ? ` · 🎁 ${gearName(chest)} found` : ' · 🎁 a treasure chest is hidden in stage 3')}
            </small>
            {!gate && gateRegion && (
              <small className="nj-gate">
                🔒 The scroll opens this world when your journey reaches {gateRegion.emoji} {gateRegion.name} <span lang="ja">{gateRegion.jp}</span>.
              </small>
            )}
            <div className="nj-stage-row">
              {Array.from({ length: STAGES_PER_WORLD }, (_, k) => {
                const i = first + k
                const stg = stageAt(i)
                const isBoss = k === STAGES_PER_WORLD - 1
                const done = i < save.cleared
                const unlocked = gate && stageUnlocked(save, i)
                const mod = stg.mod ? MOD_INFO[stg.mod] : undefined
                const hidden = stg.chest && !hasGear(save, stg.chest)
                return (
                  <button
                    key={i}
                    className={`nj-stage${isBoss ? ' boss' : ''}${done ? ' done' : ''}${i === save.cleared ? ' next' : ''}`}
                    disabled={!unlocked}
                    onClick={() => onStart(i)}
                    title={mod ? `${mod.name}: ${mod.desc}` : hidden ? 'A treasure chest is hidden somewhere in this stage' : undefined}
                    aria-label={`Stage ${wi + 1}-${k + 1}${isBoss ? ', boss' : ''}${mod ? `, ${mod.name}` : ''}${done ? ', cleared' : unlocked ? '' : ', locked'}`}
                  >
                    {!unlocked ? '🔒' : isBoss ? '👹' : `${wi + 1}-${k + 1}`}
                    {done && <i>✓</i>}
                    {unlocked && (mod || hidden) && <b className="nj-stage-tag">{hidden ? '🎁' : mod!.icon}</b>}
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
      <section className={`card nj-world nj-abyss${abyssOpen(save) ? '' : ' locked'}`}>
        <h2>
          <span lang="ja">墨の深淵</span> The Ink Abyss
        </h2>
        <small className="muted">Endless floors of mixed foes from every world, harder each time down. A boss guards every fifth floor.</small>
        {abyssOpen(save) ? (
          <div className="nj-stage-row">
            {Array.from({ length: Math.min(floor + 1, 60) }, (_, f) => f)
              .slice(-6)
              .map((f) => (
                <button key={f} className={`nj-stage${f % 5 === 4 ? ' boss' : ''}${f < floor ? ' done' : ' next'}`} onClick={() => onStart(STAGE_COUNT + f)} aria-label={`Abyss floor ${f + 1}`}>
                  B{f + 1}
                  {f < floor && <i>✓</i>}
                </button>
              ))}
          </div>
        ) : (
          <small className="nj-gate">🔒 Opens once you have beaten the Dragon Shōgun (world 5).</small>
        )}
        {floor > 0 && <small className="muted">Deepest floor reached: B{floor}</small>}
      </section>
      {save.cleared >= STAGE_COUNT && <p className="card nj-done">🏆 You have beaten every boss, even the Quiet. Replay any stage, or see how deep the Abyss goes.</p>}
    </div>
  )
}

function Armory({ save }: { save: NinjaSave }) {
  const [part, setPart] = useState<'swords' | 'armour'>('swords')
  return (
    <>
      <nav className="nj-subtabs">
        <button className={part === 'swords' ? 'on' : ''} onClick={() => setPart('swords')}>
          🗡️ Swords
        </button>
        <button className={part === 'armour' ? 'on' : ''} onClick={() => setPart('armour')}>
          🛡️ Armour
        </button>
      </nav>
      <p className="muted nj-found-note">✨ Gold-edged gear can’t be bought: find it in hidden stage chests, from great bosses, or in secret caches around your journey.</p>
      {part === 'swords' ? <Swords save={save} /> : <Armours save={save} />}
    </>
  )
}

function Swords({ save }: { save: NinjaSave }) {
  const buy = (id: SwordId) => {
    sfx.coin()
    setSave((n) => buySword(n, id))
  }
  const equip = (id: SwordId) => {
    sfx.confirm()
    setSave((n) => ({ ...n, sword: id }))
  }
  const top = { dmg: 52, speed: 1.6, reach: 82 }
  return (
    <div className="nj-swords">
      {SWORDS.map((sw) => {
        const check = canBuy(save, sw.id)
        const owned = check === 'owned'
        const on = save.sword === sw.id
        return (
          <article key={sw.id} className={`card nj-blade${on ? ' on' : ''}${owned ? '' : ' unowned'}${sw.found ? ' found' : ''}`} style={{ '--blade': sw.color } as React.CSSProperties}>
            <div className="nj-blade-art" aria-hidden>
              <svg viewBox="0 0 120 20">
                <rect x="2" y="8" width="22" height="4" rx="1" fill="#2b2b2b" />
                <rect x="23" y="4" width="3" height="12" rx="1" fill="#c9a227" />
                <path d={`M26 8 L${26 + (sw.reach / 82) * 90} 9 L${22 + (sw.reach / 82) * 90} 12 L26 12 Z`} fill={sw.color} />
                {sw.twin && <path d={`M26 2 L${26 + (sw.reach / 82) * 70} 3 L${22 + (sw.reach / 82) * 70} 5 L26 5 Z`} fill={sw.color} opacity="0.7" />}
              </svg>
            </div>
            <h3>
              <span lang="ja">{sw.jp}</span> {sw.name}
            </h3>
            <p className="muted">{sw.found && !owned ? `❓ ${sw.blurb.slice(sw.blurb.lastIndexOf('('))}` : sw.blurb}</p>
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
            ) : sw.found ? (
              <span className="nj-unfound">🔍 Not found yet</span>
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

function Armours({ save }: { save: NinjaSave }) {
  const buy = (id: ArmorId) => {
    sfx.coin()
    setSave((n) => buyArmor(n, id))
  }
  const wear = (id: ArmorId) => {
    sfx.confirm()
    setSave((n) => ({ ...n, armor: id }))
  }
  const owned = armorsOf(save)
  const on = armorOf(save).id
  return (
    <div className="nj-swords">
      {ARMORS.map((a) => {
        const check = canBuyArmor(save, a.id)
        const have = owned.includes(a.id)
        return (
          <article key={a.id} className={`card nj-blade nj-armour${on === a.id ? ' on' : ''}${have ? '' : ' unowned'}${a.found ? ' found' : ''}`} style={{ '--blade': a.color } as React.CSSProperties}>
            <div className="nj-armour-art" aria-hidden>
              <svg viewBox="0 0 40 40">
                <path d="M8 10 L14 6 L20 9 L26 6 L32 10 L30 20 L32 34 L8 34 L10 20 Z" fill={a.color} stroke="rgba(0,0,0,0.5)" strokeWidth="1" />
                {a.def >= 0.12 && <path d="M5 11 L14 7 L14 14 L6 16 Z M35 11 L26 7 L26 14 L34 16 Z" fill={a.color} stroke="rgba(0,0,0,0.5)" strokeWidth="0.8" />}
                <rect x="9" y="22" width="22" height="2.5" fill="#c62828" />
                {a.perk && <circle cx="20" cy="15" r="2.2" fill="#ffd54f" />}
              </svg>
            </div>
            <h3>
              <span lang="ja">{a.jp}</span> {a.name}
            </h3>
            <p className="muted">{a.found && !have ? `❓ ${a.blurb.slice(a.blurb.lastIndexOf('('))}` : a.blurb}</p>
            <p className="nj-special">
              🛡️ {Math.round(a.def * 100)}% · ❤️ +{a.hp}
              {a.perk && (
                <>
                  <br />✨ {PERK_INFO[a.perk]}
                </>
              )}
            </p>
            {on === a.id ? (
              <span className="nj-equipped">✓ Wearing</span>
            ) : have ? (
              <button className="btn btn-sm" onClick={() => wear(a.id)}>
                Wear
              </button>
            ) : a.found ? (
              <span className="nj-unfound">🔍 Not found yet</span>
            ) : (
              <button className="btn btn-sm btn-primary" disabled={check !== 'ok'} onClick={() => buy(a.id)}>
                {check === 'level' ? `🔒 Lv ${a.level}` : `💰 ${a.cost}`}
              </button>
            )}
          </article>
        )
      })}
    </div>
  )
}

function InkArts({ save }: { save: NinjaSave }) {
  const free = artFree(save)
  const learn = (a: ArtDef) => {
    sfx.levelUp()
    setSave((n) => learnArt(n, a.id))
  }
  const pick = (el: Element) => {
    sfx.confirm()
    setSave((n) => infuse(n, n.element === el ? undefined : el))
  }
  const group = (title: string, jp: string, note: string, prefix: string) => (
    <section className="card nj-arts-group">
      <h3>
        <span lang="ja">{jp}</span> {title}
      </h3>
      <small className="muted">{note}</small>
      <div className="nj-arts">
        {ARTS.filter((a) => a.id.startsWith(prefix)).map((a) => {
          const r = rankOf(save, a.id)
          const check = canLearn(save, a.id)
          const el = a.id.startsWith('el:') ? (a.id.slice(3) as Element) : null
          const infused = el && save.element === el
          return (
            <article key={a.id} className={`nj-art${r > 0 ? ' known' : ''}${infused ? ' on' : ''}`} style={{ '--art': a.color } as React.CSSProperties}>
              <div className="nj-art-icon" aria-hidden>
                {a.icon}
              </div>
              <div className="nj-art-body">
                <b>
                  <span lang="ja">{a.jp}</span> {a.name}
                </b>
                <small>{a.desc}</small>
                {a.ranks > 1 && (
                  <span className="nj-pips" aria-label={`Rank ${r} of ${a.ranks}`}>
                    {Array.from({ length: a.ranks }, (_, i) => (
                      <i key={i} className={i < r ? 'on' : ''} />
                    ))}
                  </span>
                )}
              </div>
              <div className="nj-art-act">
                {check !== 'max' && (
                  <button className="btn btn-sm btn-primary" disabled={check !== 'ok'} onClick={() => learn(a)} title={check === 'needs' ? `Learn ${ART_BY_ID[a.needs!].name} first` : undefined}>
                    {check === 'needs' ? '🔒' : r > 0 ? '+1' : 'Learn'} · {a.cost}✦
                  </button>
                )}
                {el && r > 0 && (
                  <button className={`btn btn-sm${infused ? ' btn-primary' : ''}`} onClick={() => pick(el)}>
                    {infused ? '✓ Infused' : 'Infuse'}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
  return (
    <div className="nj-arts-page">
      <section className="card nj-arts-head">
        <div>
          <b className="nj-points">✦ {free}</b> <span className="muted">points to spend · {artPoints(save)} earned</span>
        </div>
        <small className="muted">
          One point every second level, plus one for each secret <b>Ink Scroll</b> found on your journey ({save.scrolls ?? 0} found so far; look in the hidden corners of every region).
        </small>
        <button
          className="btn btn-sm"
          onClick={() => {
            sfx.cancel()
            setSave((n) => resetArts(n))
          }}
        >
          ↺ Unlearn all (free)
        </button>
      </section>
      {group('Elements', '五遁', 'Learn any; infuse one into your special at a time.', 'el:')}
      {group('Special upgrades', '奥義', 'Make the special itself stronger.', 'up:')}
      {group('Techniques', '技', 'New moves.', 'tech:')}
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
              <kbd>←</kbd> <kbd>→</kbd> / <kbd>A</kbd> <kbd>D</kbd> · ◀ ▶ · 🎮 stick / d-pad
            </td>
          </tr>
          <tr>
            <td>Jump (again in the air)</td>
            <td>
              <kbd>↑</kbd> / <kbd>W</kbd> / <kbd>Space</kbd> · ⤒ · 🎮 A
            </td>
          </tr>
          <tr>
            <td>Attack (tap 3× to combo, or hold)</td>
            <td>
              <kbd>J</kbd> / <kbd>Z</kbd> · ⚔️ · 🎮 X
            </td>
          </tr>
          <tr>
            <td>Guard (hold)</td>
            <td>
              <kbd>K</kbd> / <kbd>X</kbd> / hold <kbd>↓</kbd> · 🛡️ · 🎮 LB / RB
            </td>
          </tr>
          <tr>
            <td>Dash (dodge through attacks)</td>
            <td>
              <kbd>L</kbd> / <kbd>C</kbd> / <kbd>Shift</kbd> · 💨 · 🎮 B
            </td>
          </tr>
          <tr>
            <td>Special (when the blue bar is full)</td>
            <td>
              <kbd>I</kbd> / <kbd>V</kbd> · ✨ · 🎮 Y
            </td>
          </tr>
          <tr>
            <td>Rising Dragon / Falling Star (Ink Arts)</td>
            <td>
              hold <kbd>↓</kbd> + attack · ▼ + ⚔️
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
          <b>Explore the arena:</b> break urns for ryō 💰, onigiri 🍙 and ink orbs 🔵. Every world’s third stage hides a treasure chest 🎁 in a far corner (a gold arrow points the way); hit it three times.
        </li>
        <li>
          <b>Ink Arts:</b> spend points to infuse your special with fire, frost, thunder, wind or shadow, make it heal or shield you, and learn new moves.
        </li>
        <li>
          <b>Watch for warnings:</b> red and gold marks on the ground show where geysers, bones and lightning will strike. Jump shockwaves; dash through what you cannot block.
        </li>
        <li>Lost a fight? You keep the XP, half the ryō and anything you found, so you come back stronger.</li>
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
  ArrowDown: 'down',
  KeyS: 'down',
  KeyL: 'dash',
  KeyC: 'dash',
  ShiftLeft: 'dash',
  ShiftRight: 'dash',
  KeyI: 'special',
  KeyV: 'special',
  KeyE: 'special',
}
const EDGES: (keyof Input)[] = ['jump', 'attack', 'dash', 'special']

/** Standard gamepad mapping: A jump, B dash, X attack, Y special, bumpers guard. */
const PAD: [number, keyof Input][] = [
  [0, 'jump'],
  [1, 'dash'],
  [2, 'attack'],
  [3, 'special'],
  [4, 'block'],
  [5, 'block'],
  [6, 'block'],
  [7, 'special'],
]

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
  urn: sfx.click,
  chest: sfx.chest,
  coin: sfx.coin,
  heal: sfx.heal,
  gear: sfx.levelUp,
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
    const sim = createSim(stageAt(stage), save.level, SWORD_BY_ID[save.sword], Math.random, {
      armor: armorOf(save),
      arts: artsOf(save),
      have: [...save.owned, ...armorsOf(save)],
    })
    resetCamera()
    let raf = 0
    let last = performance.now()
    let ended = false
    let lastSound = 0
    let wasReady = false
    let padWas: Partial<Record<keyof Input, boolean>> = {}
    let padHeld: Partial<Record<keyof Input, boolean>> = {}
    let hpWas = sim.hero.hp
    /** Gamepad: held buttons drive the input; presses become edges. */
    const pollPad = () => {
      const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : []
      const gp = Array.from(pads ?? []).find((g) => g && g.connected)
      if (!gp) return
      const now: Partial<Record<keyof Input, boolean>> = {}
      for (const [b, k] of PAD) if (gp.buttons[b]?.pressed) now[k] = true
      const ax = gp.axes[0] ?? 0
      const ay = gp.axes[1] ?? 0
      if (ax < -0.4 || gp.buttons[14]?.pressed) now.left = true
      if (ax > 0.4 || gp.buttons[15]?.pressed) now.right = true
      if (ay > 0.5 || gp.buttons[13]?.pressed) now.down = true
      if (gp.buttons[12]?.pressed) now.jump = true
      const inp = input.current
      for (const k of ['left', 'right', 'down', 'block'] as (keyof Input)[]) {
        if (now[k]) inp[k] = true
        else if (padHeld[k]) inp[k] = false
      }
      for (const k of EDGES) if (now[k] && !padWas[k]) inp[k] = true
      inp.attackHeld = !!now.attack || (inp.attackHeld && !padWas.attack)
      if (padWas.attack && !now.attack) inp.attackHeld = false
      padHeld = now
      padWas = now
    }
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      pollPad()
      if (!paused.current) {
        let rem = dt
        while (rem > 1e-4) {
          const d = Math.min(1 / 60, rem)
          rem -= d
          if (step(sim, input.current, d)) for (const k of EDGES) input.current[k] = false
        }
        for (const e of sim.events) {
          if ((e === 'hit' || e === 'block' || e === 'coin') && now - lastSound < 60) continue
          lastSound = now
          SOUNDS[e]?.()
        }
        sim.events = []
        // A little buzz on phones when you get hurt.
        if (sim.hero.hp < hpWas - 0.5) navigator.vibrate?.(40)
        hpWas = sim.hero.hp
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
      if (k === 'attack') input.current.attackHeld = true
      if (EDGES.includes(k) && e.repeat) return
      input.current[k] = true
    }
    const up = (e: KeyboardEvent) => {
      const k = KEYS[e.code]
      if (k === 'attack') input.current.attackHeld = false
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
        if (k === 'attack') input.current.attackHeld = true
      }}
      onPointerUp={() => {
        if (k === 'attack') input.current.attackHeld = false
        if (!EDGES.includes(k)) input.current[k] = false
      }}
      onPointerCancel={() => {
        input.current[k] = false
        if (k === 'attack') input.current.attackHeld = false
      }}
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
          {pad('down', '▼', 'down')}
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
        <kbd>A</kbd>/<kbd>D</kbd> move · <kbd>W</kbd> jump · <kbd>J</kbd> attack · <kbd>K</kbd> or <kbd>S</kbd> guard · <kbd>L</kbd> dash · <kbd>I</kbd> special · <kbd>S</kbd>+<kbd>J</kbd> arts moves · <kbd>Esc</kbd> pause · 🎮 gamepads work too
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
  const abyss = st.abyss !== undefined
  const next = abyss ? (won ? stage + 1 : null) : stage + 1 < STAGE_COUNT && stageUnlocked(save, stage + 1) && storyOpen(stage + 1) ? stage + 1 : null
  const nowAffordable = [...SWORDS.filter((s) => canBuy(save, s.id) === 'ok').map((s) => s.name), ...ARMORS.filter((a) => canBuyArmor(save, a.id) === 'ok').map((a) => a.name)]
  const free = artFree(save)
  return (
    <main className="nj-page nj-result">
      <section className={`card nj-res ${won ? 'won' : 'lost'}`}>
        <ResultArt id={st.boss ? bossArt(st.boss) : 'nj-hero'} />
        <h1>{won ? (st.boss ? '👹 Boss defeated!' : abyss ? '🌀 Floor cleared!' : '⛩️ Stage clear!') : '💀 Defeated…'}</h1>
        <p className="muted">
          {abyss ? (
            <>
              <span lang="ja">墨の深淵</span> The Ink Abyss · B{st.abyss! + 1}
            </>
          ) : (
            <>
              <span lang="ja">{w.jp}</span> {w.name} · {st.world + 1}-{st.n}
            </>
          )}
        </p>
        <ul className="nj-res-list">
          {r.found.map((g) => (
            <li key={g} className="nj-up nj-found">
              🎁 Found: <b>{gearName(g)}</b>! Equip it in the Armoury.
            </li>
          ))}
          <li>⚔️ {view.kills} foes cut down</li>
          {view.chain >= 3 && <li>🔥 Best combo: {view.chain} hits</li>}
          <li>✨ +{r.xp} XP</li>
          <li>
            💰 +{r.ryo} ryō{won && <small> (incl. {clearBonus(st)} clear bonus)</small>}
            {!won && <small> (half kept)</small>}
          </li>
          {r.levelsGained > 0 && (
            <li className="nj-up">
              ⬆️ Level up! Now Lv {r.save.level} (❤️ {heroStats(r.save.level).hp + armorOf(r.save).hp})
            </li>
          )}
          {free > 0 && <li className="nj-up">🖌️ {free} Ink Arts point{free > 1 ? 's' : ''} to spend in the dojo.</li>}
          {r.shards > 0 && <li className="nj-up">✦ +{r.shards} spirit shards for your journey</li>}
          {won && st.boss && r.firstClear && st.world < FIRST_WORLDS && (
            <li className="nj-up">
              🥋 <span lang="ja">スミ せんせいに しらせよう！</span> Tell Master Sumi in the bamboo grove: he has a keepsake (and a blessing) for you.
            </li>
          )}
          {won && !abyss && stage + 1 < STAGE_COUNT && !storyOpen(stage + 1) && ninjaWorldGate(st.world + 1) && (
            <li>🔒 The next world opens when your journey reaches {ninjaWorldGate(st.world + 1)!.name}.</li>
          )}
          {won && st.chest && !r.found.includes(st.chest) && !hasGear(save, st.chest) && <li>🎁 Something glinted in a far corner of this stage… did you miss a chest?</li>}
          {nowAffordable.length > 0 && <li>🗡️ You can afford {nowAffordable.join(', ')} in the Armoury!</li>}
        </ul>
        <div className="nj-res-btns">
          {won && next !== null && (
            <button className="btn btn-primary" onClick={() => onNext(next)}>
              {abyss ? 'Descend ▼' : 'Next stage ▶'}
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

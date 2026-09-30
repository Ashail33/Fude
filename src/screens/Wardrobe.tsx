import { Avatar } from '../components/Avatar'
import { T, useBurst } from '../components/ui'
import { EFFECTS, OUTFITS, titleFor, TITLES, xpForLevel } from '../engine/rewards'
import { sfx } from '../engine/sfx'
import { effectUnlocked, level, outfitUnlocked, setState, usePlayer } from '../engine/store'
import { REGIONS } from '../data/regions'

function unlockText(u: (typeof OUTFITS)[number]['unlock'] | (typeof EFFECTS)[number]['unlock']): string {
  switch (u.kind) {
    case 'start':
      return 'Starter'
    case 'level':
      return `Reach level ${u.level}`
    case 'region':
      return `Reach ${REGIONS[u.region - 1].name}`
    case 'mastery':
      return `Master ${REGIONS[u.region - 1].name}`
    case 'boss':
      return 'Defeat a boss'
  }
}

export default function Wardrobe() {
  const p = usePlayer()
  const lvl = level(p)
  const [title, titleJp] = titleFor(lvl)
  const [burst, fire] = useBurst()

  return (
    <main className="wardrobe">
      <section className="card wardrobe-hero">
        {burst}
        <Avatar outfit={p.outfit} size={160} className="float" />
        <div>
          <h1>{p.name}</h1>
          <p className="glow-text">
            <T en={title} jp={titleJp} /> · Lv {lvl}
          </p>
          <p className="muted small">
            {p.xp} XP · {xpForLevel(lvl + 1) - p.xp} XP to next level · 💠 {p.shards}
          </p>
          <button type="button" className="btn btn-sm" onClick={() => fire(20, 50, 20)}>
            ✨ <T en="Test spell effect" jp="エフェクトをためす" />
          </button>
        </div>
      </section>

      <h2 className="section-title">
        👘 <T en="Outfits" jp="いしょう" />
      </h2>
      <div className="outfit-grid">
        {OUTFITS.map((o) => {
          const open = outfitUnlocked(p, o.id)
          const on = p.outfit === o.id
          return (
            <button
              key={o.id}
              type="button"
              className={`card outfit ${on ? 'on' : ''} ${open ? '' : 'locked'}`}
              disabled={!open}
              onClick={() => {
                sfx.click()
                setState((s) => ({ ...s, outfit: o.id }))
              }}
            >
              <Avatar outfit={o.id} size={72} className={open ? '' : 'silhouette'} />
              <strong>{o.name}</strong>
              <span className="muted small" lang="ja">
                {o.jp}
              </span>
              <span className="small">{open ? (on ? '✔ Equipped' : 'Equip') : `🔒 ${unlockText(o.unlock)}`}</span>
            </button>
          )
        })}
      </div>

      <h2 className="section-title">
        ✨ <T en="Spell effects" jp="まほうのエフェクト" />
      </h2>
      <div className="outfit-grid">
        {EFFECTS.map((e) => {
          const open = effectUnlocked(p, e.id)
          const on = p.effect === e.id
          return (
            <button
              key={e.id}
              type="button"
              className={`card outfit ${on ? 'on' : ''} ${open ? '' : 'locked'}`}
              disabled={!open}
              onClick={() => {
                setState((s) => ({ ...s, effect: e.id }))
                setTimeout(() => fire(50, 40, 16), 0)
              }}
            >
              <span className="effect-preview">{open ? e.emoji.join('') : '❔'}</span>
              <strong>{e.name}</strong>
              <span className="small">{open ? (on ? '✔ Equipped' : 'Equip') : `🔒 ${unlockText(e.unlock)}`}</span>
            </button>
          )
        })}
      </div>

      <h2 className="section-title">
        🎖️ <T en="Titles" jp="しょうごう" />
      </h2>
      <div className="row">
        {TITLES.map(([l, en, jp]) => (
          <span key={en} className={`chip ${lvl >= l ? '' : 'dim'}`}>
            {lvl >= l ? '🏅' : '🔒'} {en} <span lang="ja">{jp}</span> <span className="muted small">Lv{l}</span>
          </span>
        ))}
      </div>
    </main>
  )
}

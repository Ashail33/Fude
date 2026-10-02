import { useEffect, useState } from 'react'
import { PixelSprite, type Dir } from '../art'
import { T, useBurst } from '../components/ui'
import { EFFECTS, OUTFITS, titleFor, TITLES, xpForLevel } from '../engine/rewards'
import { sfx } from '../engine/sfx'
import { effectUnlocked, level, outfitUnlocked, setState, usePlayer } from '../engine/store'
import { REGION_BY_ID } from '../data/regions'

function unlockText(u: (typeof OUTFITS)[number]['unlock'] | (typeof EFFECTS)[number]['unlock']): string {
  switch (u.kind) {
    case 'start':
      return 'Starter'
    case 'level':
      return `Reach level ${u.level}`
    case 'region':
      return `Reach ${REGION_BY_ID.get(u.region)?.name}`
    case 'mastery':
      return `Master ${REGION_BY_ID.get(u.region)?.name}`
    case 'boss':
      return 'Defeat a boss'
  }
}

export default function Wardrobe() {
  const p = usePlayer()
  const lvl = level(p)
  const [title, titleJp] = titleFor(lvl)
  const [burst, fire] = useBurst()
  const [dir, setDir] = useState<Dir>('down')
  const [spin, setSpin] = useState(true)

  // Turn the mannequin slowly so every side of the outfit shows.
  useEffect(() => {
    if (!spin) return
    const order: Dir[] = ['down', 'left', 'up', 'right']
    const id = setInterval(() => setDir((d) => order[(order.indexOf(d) + 1) % 4]), 1400)
    return () => clearInterval(id)
  }, [spin])

  return (
    <main className="wardrobe">
      <h1>
        <T en="Wardrobe" jp="きがえ" />
      </h1>
      <section className="card wardrobe-hero">
        <span className="win-title">
          <T en="Mage" jp="まどうし" />
        </span>
        {burst}
        <div>
          <div className="wardrobe-stage">
            <PixelSprite id="mage" outfit={p.outfit} dir={dir} scale={6} animate />
          </div>
          <div className="wardrobe-dirs" role="group" aria-label="Turn">
            {(
              [
                ['left', '◀'],
                ['down', '▼'],
                ['up', '▲'],
                ['right', '▶'],
              ] as const
            ).map(([d, ch]) => (
              <button
                key={d}
                type="button"
                className="btn-icon"
                aria-label={`Face ${d}`}
                onClick={() => {
                  setSpin(false)
                  setDir(d)
                }}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="wardrobe-name">{p.name}</h2>
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
        <T en="Outfits" jp="いしょう" />
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
              <span className={open ? '' : 'silhouette'}>
                <PixelSprite id="mage" outfit={o.id} scale={4} />
              </span>
              <span className="outfit-swatch" aria-hidden>
                <span style={{ background: open ? o.robe : '#3a3f6e' }} />
                <span style={{ background: open ? o.trim : '#3a3f6e' }} />
              </span>
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
        <T en="Spell effects" jp="まほうのエフェクト" />
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
        <T en="Titles" jp="しょうごう" />
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

/**
 * The map that unrolls when you cast the travel spell: the road through
 * every region, opened ones glowing. Arrow keys walk along the road, Enter
 * (or a tap) travels, Escape closes.
 */
import { useEffect, useMemo, useState } from 'react'
import { usePlayer } from '../engine/store'
import { travelStops } from './travel'
import './TravelMap.css'

export function TravelMap({ here, onGo, onClose }: { here: number | undefined; onGo: (map: string) => void; onClose: () => void }) {
  const p = usePlayer()
  const stops = useMemo(() => travelStops(p), [p])
  const start = Math.max(0, stops.findIndex((s) => s.region.id === here))
  const [sel, setSel] = useState(start)
  const cur = stops[sel]

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const step = (d: number) => {
        e.preventDefault()
        setSel((i) => {
          for (let j = i + d; j >= 0 && j < stops.length; j += d) if (stops[j].open) return j
          return i
        })
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'd' || e.key === 'w') step(1)
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'a' || e.key === 's') step(-1)
      else if (e.key === 'Enter' || e.key === 'z' || e.key === ' ') {
        e.preventDefault()
        if (stops[sel]?.open && stops[sel].region.id !== here) onGo(stops[sel].map)
      } else if (e.key === 'Escape' || e.key === 'x') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [stops, sel, here, onGo, onClose])

  const pts = stops.map((s) => s.region.pos)
  return (
    <div className="tm-backdrop" onClick={onClose}>
      <div className="tm" role="dialog" aria-label="Travel spell" onClick={(e) => e.stopPropagation()}>
        <header className="tm-head">
          <span className="tm-glyph" aria-hidden>
            ✦
          </span>
          <span>
            <b lang="ja">たびの じゅもん</b> <small>Travel Spell</small>
          </span>
          <button type="button" className="tm-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="tm-map">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="tm-road" aria-hidden>
            {pts.slice(1).map((pt, i) => (
              <line key={i} x1={pts[i].x} y1={pts[i].y} x2={pt.x} y2={pt.y} className={stops[i + 1].open ? 'open' : ''} />
            ))}
          </svg>
          {stops.map((s, i) => (
            <button
              key={s.region.id}
              type="button"
              className={`tm-pin${s.open ? ' open' : ''}${i === sel ? ' sel' : ''}${s.region.id === here ? ' here' : ''}`}
              style={{ left: `${s.region.pos.x}%`, top: `${s.region.pos.y}%`, ['--c' as string]: s.region.color }}
              disabled={!s.open}
              onClick={() => (i === sel && s.region.id !== here ? onGo(s.map) : setSel(i))}
              aria-label={`${s.region.name}${s.open ? '' : ' (not reached yet)'}`}
            >
              <span>{s.open ? s.region.emoji : '🔒'}</span>
            </button>
          ))}
        </div>
        <footer className="tm-foot">
          {cur && (
            <>
              <div className="tm-name">
                <b lang="ja">{cur.region.jp}</b> <span>{cur.region.name}</span>
                {cur.region.id === here && <em> · you are here</em>}
              </div>
              <small className="muted">{cur.region.tagline}</small>
              <button type="button" className="btn btn-primary" disabled={!cur.open || cur.region.id === here} onClick={() => onGo(cur.map)}>
                ✨ <span lang="ja">とんで いく</span> Travel
              </button>
            </>
          )}
          <small className="muted tm-keys">←→ choose · Enter travel · Esc close</small>
        </footer>
      </div>
    </div>
  )
}

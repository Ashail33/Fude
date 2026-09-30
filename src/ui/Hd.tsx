/**
 * Shared presentation for the illustrated (HD) art:
 *  - <KenBurns>: a still that slowly pans/zooms and crossfades to the next.
 *  - <VnBusts>: visual-novel character busts that slide in beside a message
 *    window, bob gently, and dim while someone else speaks.
 * Both render nothing until their image is decoded, so callers keep their
 * pixel-art fallback underneath.
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { HD_BY_ID } from '../art/hd/manifest'
import { useHdLoaded } from '../art/hd'
import { LivingArt } from '../anim/LivingArt'
import './hd.css'

let layerSeq = 0

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const KB_VARIANTS = ['kb-a', 'kb-b', 'kb-c', 'kb-d']

/**
 * Ken Burns still: shows `url` (already decoded) with a slow pan/zoom;
 * changing `url` crossfades. `motion` picks the move (defaults to a hash of the url).
 */
export function KenBurns({ url, className, motion, children }: { url: string | null; className?: string; motion?: string; children?: ReactNode }) {
  const [layers, setLayers] = useState<{ url: string; key: number; kb: string }[]>([])
  useEffect(() => {
    if (!url) {
      setLayers([])
      return
    }
    setLayers((l) => (l.at(-1)?.url === url ? l : [...l.slice(-1), { url, key: layerSeq++, kb: motion ?? KB_VARIANTS[hash(url) % KB_VARIANTS.length] }]))
  }, [url, motion])
  useEffect(() => {
    if (layers.length < 2) return
    const t = setTimeout(() => setLayers((l) => l.slice(-1)), 1500)
    return () => clearTimeout(t)
  }, [layers])
  if (!layers.length) return null
  return (
    <div className={`kb-stack ${className ?? ''}`} aria-hidden>
      {layers.map((L) => (
        <div key={L.key} className={`kb-layer ${L.kb}`}>
          <img className="hd-img kb-img" src={L.url} alt="" draggable={false} />
        </div>
      ))}
      {children}
    </div>
  )
}

export interface Bust {
  /** HD asset id. */
  id: string
  side: 'left' | 'right'
  /** Currently speaking (others are dimmed). */
  active: boolean
  /** Mirror horizontally (face the other side). */
  flip?: boolean
  /** Text is being typed out for this speaker: a soft talking bounce. */
  talking?: boolean
}

/** Relative size: small floating mascots and full-body monsters are scaled down a little. */
function bustScale(id: string): number {
  const a = HD_BY_ID.get(id)
  if (id === 'fude') return 0.62
  if (a?.category === 'enemies') return 0.7
  if (a?.category === 'bosses') return id === 'void-dragon' ? 0.85 : 0.95
  return 1
}

function BustImg({ b }: { b: Bust }) {
  const url = useHdLoaded(b.id)
  if (!url) return null
  const floaty = b.id === 'fude' || HD_BY_ID.get(b.id)?.category !== 'portraits'
  return (
    <div className={`vn-bust vn-${b.side} ${b.active ? 'on' : 'dim'} ${floaty ? 'floaty' : ''}`} style={{ '--vn-k': bustScale(b.id) } as CSSProperties}>
      <div className="vn-slide">
        <LivingArt
          src={url}
          id={b.id}
          className="vn-la"
          imgClassName="vn-img"
          flip={b.flip}
          talking={b.active && b.talking}
          // The speaker turns slightly toward the conversation; listeners are dimmed in-shader.
          look={b.active ? (b.side === 'left' ? 0.6 : -0.6) : 0}
          tint={b.active ? 1 : 0.55}
        />
      </div>
    </div>
  )
}

/** Visual-novel busts, anchored to the bottom of their (positioned) container. */
export function VnBusts({ busts, className }: { busts: Bust[]; className?: string }) {
  if (!busts.length) return null
  return (
    <div className={`vn-busts ${className ?? ''}`} aria-hidden>
      {busts.map((b) => (
        <BustImg key={`${b.side}:${b.id}`} b={b} />
      ))}
    </div>
  )
}

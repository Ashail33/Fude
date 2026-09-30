/**
 * Shared pixel-art helpers for the mini-games: the player's mage, a
 * hit-flash hook, a tint filter for elemental "skins", and a small tile
 * strip (village / shrine / forge scenery) drawn with `drawTile`.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { PixelSprite, spriteSize, type Dir, type SpriteId } from '../art'
import { computeNeighbours, drawTile, type TileId } from '../art/tiles'
import { usePlayer } from '../engine/store'
import './pixel.css'

/** The player's mage, wearing their current outfit. */
export function PlayerMage({ scale = 3, dir = 'down', animate = true, flash, className }: { scale?: number; dir?: Dir; animate?: boolean; flash?: boolean; className?: string }) {
  const outfit = usePlayer().outfit
  return <PixelSprite id="mage" outfit={outfit} scale={scale} dir={dir} animate={animate} flash={flash} className={className} title="you" />
}

export type StripCell = TileId | { id: TileId; under?: TileId } | null

/**
 * A strip of pixel tiles (rows × repeating columns), filling its container's
 * width at an integer scale. Animated tiles (lanterns, water) tick slowly.
 */
export function TileStrip({ rows, scale = 2, className, animate = true, align = 'center' }: { rows: StripCell[][]; scale?: number; className?: string; animate?: boolean; align?: 'center' | 'start' }) {
  const wrap = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLCanvasElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  // Callers often build `rows` inline; redraw only when its content changes.
  const key = JSON.stringify(rows)
  const grid = useMemo(() => JSON.parse(key) as StripCell[][], [key])
  useEffect(() => {
    const rows = grid
    const c = ref.current
    if (!c || !width) return
    const size = 16 * scale
    const cols = Math.max(1, Math.ceil(width / size))
    c.width = cols * size
    c.height = rows.length * size
    const ctx = c.getContext('2d')!
    // Centre the repeating pattern so both edges look alike.
    const cellAt = (x: number, y: number): StripCell => {
      const row = rows[y]
      const n = row.length
      const off = align === 'center' ? Math.floor((cols - n) / 2) : 0
      return row[(((x - off) % n) + n) % n]
    }
    // Neighbour lookup: sky above the strip and empty cells count as "other"
    // (so roofs get ridges and eaves); below the strip counts as "same".
    const idAt = (x: number, y: number): TileId | undefined => {
      if (y < 0) return 'grass'
      if (y >= rows.length) return undefined
      const cell = cellAt(x, y)
      return cell ? (typeof cell === 'string' ? cell : cell.id) : 'grass'
    }
    let raf = 0
    let last = -1
    const draw = (t: number) => {
      const tick = Math.floor(t / 250)
      if (tick !== last) {
        last = tick
        ctx.clearRect(0, 0, c.width, c.height)
        for (let y = 0; y < rows.length; y++)
          for (let x = 0; x < cols; x++) {
            const cell = cellAt(x, y)
            if (!cell) continue
            const id = typeof cell === 'string' ? cell : cell.id
            const under = typeof cell === 'string' ? undefined : cell.under
            const nb = computeNeighbours(idAt, x, y)
            drawTile(ctx, id, x * size, y * size, scale, t / 1000, nb, { tx: x, ty: y, under })
          }
      }
      if (animate) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [grid, width, scale, animate, align])
  return (
    <div ref={wrap} className={`tile-strip ${className ?? ''}`} aria-hidden>
      <canvas ref={ref} className="pixel" style={{ display: 'block', marginLeft: width ? Math.floor((width - Math.ceil(width / (16 * scale)) * 16 * scale) / 2) : 0 }} />
    </div>
  )
}

/** A named character sprite standing in a scene, with an optional shadow. */
export function SceneSprite({ id, scale = 3, dir, animate = true, flash, className }: { id: SpriteId; scale?: number; dir?: Dir; animate?: boolean; flash?: boolean; className?: string }) {
  return (
    <span className={`scene-sprite ${className ?? ''}`}>
      <PixelSprite id={id} scale={scale} dir={dir} animate={animate} flash={flash} />
    </span>
  )
}

/**
 * A DQ-style framed portrait: a character sprite standing on a patch of map
 * tiles (grass, stone floor, tatami…). Used for NPC hosts in the mini-games.
 */
export function Portrait({
  id,
  scale = 4,
  ground = 'grass',
  dir = 'down',
  talking = false,
  flash,
  className,
  title,
}: {
  id: SpriteId
  scale?: number
  ground?: TileId
  dir?: Dir
  talking?: boolean
  flash?: boolean
  className?: string
  title?: string
}) {
  const box = spriteSize(id).w * scale + 16
  const rows = Math.ceil(box / 32)
  return (
    <span className={`px-portrait ${talking ? 'talking' : ''} ${className ?? ''}`} style={{ width: box, height: box }} title={title}>
      <TileStrip rows={Array.from({ length: rows }, () => [ground])} scale={2} animate={false} />
      <span className="px-portrait-sprite">
        <PixelSprite id={id} scale={scale} dir={dir} animate flash={flash} title={title} />
      </span>
    </span>
  )
}

/** A single (optionally animated) map tile as an inline element. */
export function PixelTile({ id, under, scale = 2, className, animate = true }: { id: TileId; under?: TileId; scale?: number; className?: string; animate?: boolean }) {
  const size = 16 * scale
  return (
    <span className={`px-tile ${className ?? ''}`} style={{ width: size, height: size }} aria-hidden>
      <TileStrip rows={[[{ id, under }]]} scale={scale} animate={animate} />
    </span>
  )
}

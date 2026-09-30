/**
 * Tile dioramas used behind cutscenes and on the title screen: a sky
 * gradient (CSS) over a strip of real overworld tiles drawn on a canvas.
 */
import { useEffect, useRef } from 'react'
import { drawTile, TILE_IDS, type TileId } from '../art/tiles'
import type { Backdrop } from './scenes'

const LEGEND: Record<string, TileId> = {
  g: 'grass',
  G: 'grass-dark',
  f: 'flowers',
  t: 'tall-grass',
  p: 'path',
  s: 'sand',
  d: 'dirt',
  S: 'stone-floor',
  w: 'water',
  W: 'water-deep',
  l: 'lily',
  x: 'bridge-h',
  T: 'tree',
  P: 'pine',
  K: 'sakura',
  b: 'bamboo',
  u: 'bush',
  r: 'rock',
  R: 'roof',
  H: 'wall',
  h: 'wall-window',
  D: 'door',
  F: 'fence',
  Y: 'tower-wall',
  n: 'sign',
  L: 'lantern',
  o: 'well',
  I: 'torii',
  B: 'shrine-bell',
  V: 'statue',
  c: 'carpet',
  q: 'bookshelf',
  k: 'tablet',
  O: 'portal',
  e: 'campfire',
}

interface Diorama {
  /** CSS background for the sky. */
  sky: string
  /** Show twinkling stars in the sky. */
  stars?: boolean
  /** Rows of 20 tiles, top → bottom. '.' = empty (sky). */
  rows: string[]
  /** Per row: base tile drawn under objects ('.' = none). */
  base: string
}

export const DIORAMAS: Record<Backdrop, Diorama> = {
  void: {
    sky: 'radial-gradient(ellipse at 50% 70%, #2a1340 0%, #0b0618 55%, #030208 100%)',
    stars: true,
    rows: ['....................', '....................', '....................', '....................', '....................'],
    base: '.....',
  },
  'night-hill': {
    sky: 'linear-gradient(180deg, #070a1f 0%, #141a4a 45%, #2b2f5e 75%, #3d4a8c 100%)',
    stars: true,
    rows: ['....................', '.............K......', '......gggggggggg....', '...ggfgggggggggfggg.', 'ggggggggggfggggggggg'],
    base: '..ggg',
  },
  village: {
    sky: 'linear-gradient(180deg, #3d4a8c 0%, #8a6bb8 38%, #f28a2e 78%, #f7c948 100%)',
    rows: ['..RRRR........RRRR..', '..HhDH.K..L...HDhH..', 'gggggggngppgggggfggg', 'gfgggggggppgggggggfg', 'ggggfggggppggfgggggg'],
    base: '..ggg',
  },
  fields: {
    sky: 'linear-gradient(180deg, #3b86d6 0%, #7fc4f0 60%, #d6f1ff 100%)',
    rows: ['....................', 'P...........u.....P.', 'ttgggfgggwwgggtggftt', 'gggfggggwwwwgggfgggg', 'gfggggggwwwwggggggfg'],
    base: 'ggggg',
  },
  forest: {
    sky: 'linear-gradient(180deg, #10241c 0%, #1f5c3a 70%, #2f8a4a 100%)',
    rows: ['TPTTPTTTPTTTTPTTPTTT', 'TTPTuGGGGGGGGGGuTPTT', 'GGuGGGGGGGGGGGGGGuGG', 'GGGGGGGppppppGGGGGGG', 'GGGGGppppppppppGGGGG'],
    base: 'GGGGG',
  },
  shrine: {
    sky: 'linear-gradient(180deg, #2b2f5e 0%, #8a4fd1 40%, #f7a8c4 85%, #f7c948 100%)',
    rows: ['PP...............PP.', 'PP..L....I....L..PP.', 'GGGGSSSSSSSSSSSSGGGG', 'GGGGSSSSSSSSSSSSGGGG', 'GGGSSSSSSSSSSSSSSGGG'],
    base: 'GGGGG',
  },
  tower: {
    sky: 'linear-gradient(180deg, #120d1c 0%, #241d3a 100%)',
    rows: ['YYYYYYYYYYYYYYYYYYYY', 'YqYYLYYYYYYYYYLYYqYY', 'SSSSSSSScccSSSSSSSSS', 'SSSSSSSScccSSSSSSSSS', 'SSSSSSSScccSSSSSSSSS'],
    base: 'YYSSS',
  },
  dawn: {
    sky: 'linear-gradient(180deg, #3d4a8c 0%, #c7a3f0 35%, #f7a8c4 70%, #ffe066 100%)',
    rows: ['....................', '...K.........K......', '..gggfgggggggggfgg..', 'gfgggggfggggfgggggfg', 'ggfggggggfgggggggggg'],
    base: '..ggg',
  },
}

const COLS = 20
const TILE = 16

function tileAt(d: Diorama, x: number, y: number): TileId | null {
  const ch = d.rows[y]?.[x]
  if (!ch || ch === '.') return null
  return LEGEND[ch] ?? null
}

function neighbours(d: Diorama, x: number, y: number, id: TileId): number {
  const dirs: [number, number][] = [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
  ]
  let m = 0
  dirs.forEach(([dx, dy], bit) => {
    const nx = x + dx
    const ny = y + dy
    const out = nx < 0 || nx >= COLS || ny < 0 || ny >= d.rows.length
    // Off-canvas counts as "same" so edges don't draw shorelines/eaves.
    if (out || tileAt(d, nx, ny) === id || baseAt(d, nx, ny) === id) m |= 1 << bit
  })
  return m
}

function baseAt(d: Diorama, x: number, y: number): TileId | null {
  const b = d.base[y]
  if (!b || b === '.' || !d.rows[y] || d.rows[y][x] === '.') return null
  return LEGEND[b] ?? null
}

const known = new Set<string>(TILE_IDS)

/** Draw a diorama onto a 2D context at native resolution. */
export function drawDiorama(ctx: CanvasRenderingContext2D, bg: Backdrop, time: number) {
  const d = DIORAMAS[bg]
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, COLS * TILE, d.rows.length * TILE)
  for (let y = 0; y < d.rows.length; y++) {
    for (let x = 0; x < COLS; x++) {
      const base = baseAt(d, x, y)
      const t = tileAt(d, x, y)
      if (base && known.has(base) && base !== t) drawTile(ctx, base, x * TILE, y * TILE, 1, time, neighbours(d, x, y, base))
      if (t && known.has(t)) drawTile(ctx, t, x * TILE, y * TILE, 1, time, neighbours(d, x, y, t))
    }
  }
}

/** Sky + tile strip. Fills its (position: relative) parent. */
export function SceneBackdrop({ bg, className }: { bg: Backdrop; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const d = DIORAMAS[bg]
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.width = COLS * TILE
    el.height = d.rows.length * TILE
    const ctx = el.getContext('2d')
    if (!ctx) return
    let raf = 0
    let last = -1e9
    const loop = (t: number) => {
      if (t - last > 120) {
        last = t
        drawDiorama(ctx, bg, t)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [bg, d])
  return (
    <div className={`backdrop ${className ?? ''}`} style={{ background: d.sky }} aria-hidden>
      {d.stars && <div className="backdrop-stars" />}
      <canvas ref={ref} className="pixel backdrop-ground" />
    </div>
  )
}

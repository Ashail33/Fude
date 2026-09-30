/**
 * Dev-only art sheet: every tile, a composed sample scene, every sprite
 * (all directions/frames), outfits, hit-flash and icons, at 3×.
 * Not routed by the app; mount it from a scratch Vite entry to review art.
 */
import { useEffect, useRef } from 'react'
import { OUTFITS } from '../engine/rewards'
import { CHARACTER_SPRITES, ENEMY_SPRITES, ICON_SPRITES, spriteCanvas, spriteSize, type Dir, type SpriteId } from './index'
import { PAL } from './palette'
import { TILE_IDS, computeNeighbours, drawTile, type TileId } from './tiles'

const S = typeof location !== 'undefined' ? Number(new URLSearchParams(location.search).get('s') ?? 3) : 3

function Sprite({ id, dir, frame, outfit, flash, scale = S }: { id: SpriteId; dir?: Dir; frame?: number; outfit?: string; flash?: boolean; scale?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = ref.current!
    let src: HTMLCanvasElement
    try {
      src = spriteCanvas(id, { dir, frame, outfit, flash })
    } catch {
      return
    }
    el.width = src.width * scale
    el.height = src.height * scale
    const ctx = el.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(src, 0, 0, el.width, el.height)
  }, [id, dir, frame, outfit, flash, scale])
  return <canvas ref={ref} style={{ imageRendering: 'pixelated', display: 'block' }} />
}

/** A little canvas that animates one tile (or a whole scene) with rAF. */
function TileCanvas({ w, h, draw }: { w: number; h: number; draw: (ctx: CanvasRenderingContext2D, t: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let raf = 0
    const loop = (t: number) => {
      const el = ref.current
      if (!el) return
      const ctx = el.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      draw(ctx, t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [draw])
  return <canvas ref={ref} width={w} height={h} style={{ imageRendering: 'pixelated', display: 'block' }} />
}

// A 12×8 sample scene. Legend below.
const SCENE = [
  'GGGGTTGGPPGGGGGGSG',
  'GTGRRRRGPGGBBBBGGG',
  'GGGrwdrGPGGhhhhGTG',
  'GFGGGGGGPPPPPGGGGG',
  'GGWWWWGGGGGPGGLGGG',
  'GWWWWWWWGGGPGGGGGG',
  'GWWlWWW=====PPPPPG',
  'GWWWWWWWGGGGGGGGGG',
  'GGWWWWG###GGGFGGTG',
  'GGGGGGG###GGGGGGGG',
  'GTG#####GGGGIGGIGG',
]
const SCENE_KEY: Record<string, TileId> = {
  G: 'grass',
  T: 'tree',
  S: 'sakura',
  P: 'path',
  R: 'roof',
  r: 'roof-edge',
  w: 'wall-window',
  d: 'door',
  B: 'roof-red',
  h: 'noren',
  F: 'flowers',
  W: 'water',
  l: 'lily',
  '=': 'bridge-h',
  '#': 'tall-grass',
  L: 'lantern',
  I: 'torii',
}
const sceneTiles = SCENE.map((row) => [...row].map((ch) => SCENE_KEY[ch] ?? 'grass'))

function drawScene(ctx: CanvasRenderingContext2D, t: number) {
  const get = (x: number, y: number) => sceneTiles[y]?.[x]
  for (let y = 0; y < sceneTiles.length; y++)
    for (let x = 0; x < sceneTiles[y].length; x++) {
      const id = sceneTiles[y][x]
      drawTile(ctx, id, x * 16 * S, y * 16 * S, S, t, computeNeighbours(get, x, y), { tx: x, ty: y })
    }
  const ph = Math.floor(t / 280) % 2
  const draw = (id: SpriteId, x: number, y: number, dir: Dir = 'down', outfit?: string) => {
    const c = spriteCanvas(id, { dir, frame: ph, outfit })
    ctx.drawImage(c, x * S, y * S, c.width * S, c.height * S)
  }
  draw('mage', 16 * 9, 16 * 3 - 4)
  draw('fude', 16 * 10, 16 * 3 - 8 + (ph ? -1 : 0), 'left')
  draw('villager-b', 16 * 5, 16 * 3 - 4, 'right')
  draw('cat', 16 * 14, 16 * 8, 'left')
  draw('priest', 16 * 13, 16 * 9)
}

function sizeLabel(id: SpriteId) {
  try {
    const s = spriteSize(id)
    return `${s.w}×${s.h}`
  } catch {
    return '?'
  }
}

const label: React.CSSProperties = { font: '11px monospace', color: PAL.paper, marginTop: 2, textAlign: 'center' }
const cell: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 6 }
const h2: React.CSSProperties = { font: 'bold 16px monospace', color: PAL.gold, margin: '18px 0 6px' }

export function ArtPreview() {
  const dirs: Dir[] = ['down', 'up', 'left', 'right']
  return (
    <div style={{ background: '#2a2438', padding: 12, minHeight: '100vh' }}>
      <div style={h2}>Scene</div>
      <TileCanvas w={SCENE[0].length * 16 * S} h={SCENE.length * 16 * S} draw={drawScene} />

      <div style={h2}>Tiles</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {TILE_IDS.map((id) => (
          <div key={id} style={cell} data-tile={id}>
            <TileCanvas w={16 * S} h={16 * S} draw={(ctx, t) => drawTile(ctx, id, 0, 0, S, t, 0)} />
            <div style={label}>{id}</div>
          </div>
        ))}
      </div>

      <div style={h2}>Characters</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {CHARACTER_SPRITES.map((id) => (
          <div key={id} data-char={id} style={{ ...cell, background: PAL.grass, padding: 4 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {dirs.map((d) => [0, 1].map((f) => <Sprite key={d + f} id={id} dir={d} frame={f} />))}
            </div>
            <div style={label}>{id}</div>
          </div>
        ))}
      </div>

      <div style={h2}>Outfits</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {OUTFITS.map((o) => (
          <div key={o.id} style={cell}>
            <Sprite id="mage" outfit={o.id} />
            <div style={label}>{o.id}</div>
          </div>
        ))}
      </div>

      <div style={h2}>Enemies</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {ENEMY_SPRITES.map((id) => (
          <div key={id} style={cell} data-enemy={id}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
              <Sprite id={id} frame={0} />
              <Sprite id={id} frame={1} />
              <Sprite id={id} flash />
            </div>
            <div style={label}>
              {id} {sizeLabel(id)}
            </div>
          </div>
        ))}
      </div>

      <div style={h2}>Icons</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {ICON_SPRITES.map((id) => (
          <div key={id} style={cell}>
            <Sprite id={id} />
            <div style={label}>{id}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

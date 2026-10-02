/**
 * Pixel-art library. Every sprite is original art authored in code as
 * palette-indexed pixel maps (src/art/sprites/*), assembled by a pure
 * rasteriser (raster.ts) and rendered once into cached canvases.
 *
 * Sizes: characters and icons 16×16; enemies 32×32 except the dragon
 * (64×64, the final boss). Use `spriteSize(id)` rather than assuming.
 */
import { useEffect, useRef } from 'react'
import { imgToCanvas } from './canvas'
import { animAt, animFrameCount, buildSprite, spriteDims, type Anim, type Dir } from './sprites/build'
import { PACK_CHARACTER_SPRITES, PACK_ENEMY_SPRITES } from '../regions/ids'

export type { Anim, Dir }
export { animAt, animFrameCount }

/**
 * Walking characters: 16×16, 4 directions; animations `idle` (2 frames +
 * blink), `walk` and `run` (4 frames each); Fude floats on a 6-frame cycle.
 */
export const CHARACTER_SPRITES = [
  'mage', // the player; recoloured by outfit id
  'fude', // companion brush spirit (floating, 2-frame bob)
  'merchant',
  'scribe', // Kotone, in Fude's memories
  'guard',
  'priest',
  'king',
  'elder',
  'innkeeper',
  'jailer',
  'villager-a',
  'villager-b',
  'child',
  'cat',
  'dog',
  'fox',
  ...PACK_CHARACTER_SPRITES,
] as const

/** Battle enemies: 32×32 (dragon 64×64), 2-frame idle. */
export const ENEMY_SPRITES = [
  'slime',
  'ice-slime',
  'imp',
  'bat',
  'mushroom',
  'kappa',
  'tanuki',
  'golem',
  'wisp',
  'kitsune',
  'harpy',
  'treant',
  'tengu',
  'oni',
  'skeleton',
  'dragon',
  ...PACK_ENEMY_SPRITES,
] as const

/** 16×16 icons for items and UI. */
export const ICON_SPRITES = ['herb', 'ether', 'smoke', 'charm', 'scroll', 'key', 'shard', 'heart', 'heart-empty', 'star', 'star-empty', 'lock', 'sword', 'staff', 'book', 'chest', 'chest-open', 'exclaim', 'question'] as const

export type CharacterSprite = (typeof CHARACTER_SPRITES)[number]
export type EnemySprite = (typeof ENEMY_SPRITES)[number]
export type IconSprite = (typeof ICON_SPRITES)[number]
export type SpriteId = CharacterSprite | EnemySprite | IconSprite

export interface SpriteOpts {
  dir?: Dir
  frame?: number
  /** Character animation. Omitted: the legacy 2-frame step (frames 0/1). */
  anim?: Anim
  /** Eyes closed (characters). */
  blink?: boolean
  /** Outfit id (engine/rewards OUTFITS) for recolouring the mage. */
  outfit?: string
  /** Flash white (hit effect). */
  flash?: boolean
}

/** Native pixel size of a sprite (16×16, 32×32, or 64×64 for the dragon). */
export function spriteSize(id: SpriteId): { w: number; h: number } {
  return spriteDims(id)
}

const cache = new Map<string, HTMLCanvasElement>()

/** Native-resolution canvas for a sprite frame (cached). */
export function spriteCanvas(id: SpriteId, opts: SpriteOpts = {}): HTMLCanvasElement {
  const isChar = (CHARACTER_SPRITES as readonly string[]).includes(id)
  const dir = isChar ? (opts.dir ?? 'down') : 'down'
  const anim = isChar ? opts.anim : undefined
  const n = anim ? animFrameCount(id, anim) : 2
  const frame = (((opts.frame ?? 0) % n) + n) % n
  const blink = isChar && !!opts.blink
  const outfit = id === 'mage' ? (opts.outfit ?? '') : ''
  const key = `${id}|${dir}|${anim ?? ''}|${frame}|${blink ? 1 : 0}|${outfit}|${opts.flash ? 1 : 0}`
  let c = cache.get(key)
  if (!c) {
    c = imgToCanvas(buildSprite(id, { dir, frame, anim, blink, outfit: outfit || undefined, flash: opts.flash }))
    cache.set(key, c)
  }
  return c
}

/** Draw a sprite frame onto a canvas at pixel position (top-left), scaled. */
export function drawSprite(ctx: CanvasRenderingContext2D, id: SpriteId, x: number, y: number, scale = 1, opts: SpriteOpts = {}) {
  const c = spriteCanvas(id, opts)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(c, Math.round(x), Math.round(y), c.width * scale, c.height * scale)
}

let seedN = 0

/**
 * React component: a crisp, scaled sprite. `animate` plays an animation:
 * characters default to their 4-frame walk (pass `anim="idle"` for the
 * breathing/blinking idle, `"run"` for the run); enemies bob on 2 frames.
 * Honours prefers-reduced-motion (idle only, no cycling walk).
 */
export function PixelSprite({ id, scale = 3, dir = 'down', animate = false, anim, outfit, flash, className, title }: { id: SpriteId; scale?: number; dir?: Dir; animate?: boolean; anim?: Anim; outfit?: string; flash?: boolean; className?: string; title?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const isChar = (CHARACTER_SPRITES as readonly string[]).includes(id)
    const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
    const seed = seedN++ % 7
    const a: Anim | undefined = isChar ? (reduced ? 'idle' : (anim ?? (animate ? 'walk' : undefined))) : undefined
    let raf = 0
    let lastKey = ''
    let t0 = 0
    const draw = (t: number) => {
      const el = ref.current
      if (!el) return
      if (!t0) t0 = t
      let frame = 0
      let blink = false
      if (animate && a) ({ frame, blink } = animAt(a, t - t0, { float: id === 'fude', seed }))
      else if (animate && !reduced) frame = Math.floor((t - t0) / 280) % 2
      const key = `${frame}|${blink}`
      if (key !== lastKey) {
        lastKey = key
        const src = spriteCanvas(id, { dir, frame, anim: animate ? a : isChar ? 'idle' : undefined, blink, outfit, flash })
        if (el.width !== src.width * scale) el.width = src.width * scale
        if (el.height !== src.height * scale) el.height = src.height * scale
        const ctx = el.getContext('2d')!
        ctx.imageSmoothingEnabled = false
        ctx.clearRect(0, 0, el.width, el.height)
        ctx.drawImage(src, 0, 0, el.width, el.height)
      }
      if (animate) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [id, scale, dir, animate, anim, outfit, flash])
  return <canvas ref={ref} className={`pixel ${className ?? ''}`} role="img" aria-label={title ?? id} />
}

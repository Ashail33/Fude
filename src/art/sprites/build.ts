/**
 * Pure sprite assembly: pixel maps → shaded, outlined Img frames.
 * No DOM here, so everything is unit-testable in node.
 */
import { OUTFITS } from '../../engine/rewards'
import { PAL } from '../palette'
import { Img, autoShade, flipX, fromMap, luminance, mirrorRows, mix, outline, shift, silhouette, squash, type Slots } from '../raster'
import { CHARACTERS, type CharDef } from './characters'
import { ENEMIES, type EnemyDef, type Patch } from './enemies'
import { ICONS, type IconDef } from './icons'

export type Dir = 'up' | 'down' | 'left' | 'right'

export interface BuildOpts {
  dir?: Dir
  frame?: number
  outfit?: string
  flash?: boolean
}

/** Robe/trim slots for the mage from an outfit id. */
export function outfitSlots(outfit?: string): Slots {
  const o = OUTFITS.find((x) => x.id === outfit) ?? OUTFITS[0]
  let main = o.robe
  let dark = mix(o.robe, PAL.ink, 0.42)
  let light = mix(o.robe, PAL.white, 0.28)
  if (luminance(o.robe) < 0.1) {
    // very dark robes: lift the main tone so it reads against the outline
    main = mix(o.robe, PAL.white, 0.2)
    dark = mix(o.robe, PAL.dusk, 0.25)
    light = mix(o.robe, PAL.white, 0.38)
  }
  if (luminance(o.robe) > 0.8) {
    // white robes: shade toward paper
    dark = PAL.mist
    light = PAL.white
    main = PAL.paper
  }
  return { 1: main, 2: dark, 3: o.trim, 4: light }
}

function passingLegs(img: Img, rows: [number, number], span: [number, number]): Img {
  const o = img.clone()
  for (let y = rows[0]; y <= rows[1]; y++) {
    const xs: number[] = []
    for (let x = span[0]; x <= span[1]; x++) if (img.get(x, y)) xs.push(x)
    if (!xs.length) continue
    const col = img.get(xs[xs.length - 1], y)!
    for (let x = span[0]; x <= span[1]; x++) o.set(x, y, null)
    const cx = Math.round((xs[0] + xs[xs.length - 1]) / 2)
    const w = Math.min(3, xs.length)
    for (let i = 0; i < w; i++) o.set(cx - 1 + i, y, col)
  }
  return o
}

export function buildCharacter(id: string, o: BuildOpts = {}): Img {
  const def: CharDef = CHARACTERS[id]
  if (!def) throw new Error(`no character ${id}`)
  const dir = o.dir ?? 'down'
  const frame = (o.frame ?? 0) % 2
  const slots = id === 'mage' ? outfitSlots(o.outfit) : (def.slots ?? {})
  const legRows = def.legRows ?? [13, 14]
  const span = def.span ?? [3, 12]
  let img: Img
  if (dir === 'down' || dir === 'up') {
    const explicit = frame ? (dir === 'down' ? def.down1 : def.up1) : undefined
    img = fromMap(explicit ?? def[dir], slots)
    if (frame && !explicit && !def.float) img = mirrorRows(img, legRows[0], legRows[1], span[0], span[1])
  } else {
    const explicit = frame ? def.side1 : undefined
    img = fromMap(explicit ?? def.side, slots)
    if (frame && !explicit && !def.float) img = passingLegs(img, legRows, def.sideSpan ?? [2, 12])
  }
  if (frame && def.float) img = shift(img, 0, -1)
  if (def.shade) img = autoShade(img, def.shade, slots)
  if (dir === 'left') img = flipX(img)
  img = outline(img)
  return o.flash ? silhouette(img) : img
}

function overlay(img: Img, x0: number, y0: number, rows: readonly string[], slots?: Slots, mirror = false) {
  for (let y = 0; y < rows.length; y++)
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x]
      if (ch === '.') continue
      const px = mirror ? img.w - 1 - (x0 + x) : x0 + x
      if (ch === '_') img.set(px, y0 + y, null)
      else img.map([ch], px, y0 + y, slots)
    }
}

function applyPatch(img: Img, p: Patch, slots?: Slots) {
  overlay(img, p.x, p.y, p.rows, slots)
  if (p.sym) overlay(img, p.x, p.y, p.rows, slots, true)
}

/** Expand a (possibly half-width, mirrored) enemy map into full rows. */
export function enemyRows(def: EnemyDef): string[] {
  if (!def.rows) return []
  if (!def.sym) return def.rows
  return def.rows.map((r) => r + [...r].reverse().join(''))
}

export function enemySize(def: EnemyDef) {
  return { w: def.w ?? 32, h: def.h ?? 32 }
}

function enemyBase(def: EnemyDef): Img {
  const { w, h } = enemySize(def)
  let img: Img
  if (def.build) img = def.build()
  else {
    img = new Img(w, h)
    img.map(enemyRows(def), 0, 0, def.slots)
  }
  for (const p of def.patch ?? []) applyPatch(img, p, def.slots)
  return img
}

const SWAP_FIRE: Record<string, string> = {
  [PAL.fire]: PAL.orange,
  [PAL.orange]: PAL.gold,
  [PAL.gold]: PAL.light,
  [PAL.light]: PAL.gold,
  [PAL.crimson]: PAL.fire,
  [PAL.ice]: PAL.foam,
  [PAL.wind]: PAL.ice,
}

export function buildEnemy(id: string, o: BuildOpts = {}): Img {
  const def = ENEMIES[id]
  if (!def) throw new Error(`no enemy ${id}`)
  const frame = (o.frame ?? 0) % 2
  let img = enemyBase(def)
  if (frame) {
    for (const p of def.frame1 ?? []) applyPatch(img, p, def.slots)
    const anims = Array.isArray(def.anim) ? def.anim : [def.anim]
    for (const a of anims) {
      if (a === 'squash') img = squash(img, def.pivot ?? img.h - 4)
      else if (a === 'bob') img = shift(img, 0, -1)
      else if (a === 'flicker') img.recolor((c) => SWAP_FIRE[c])
    }
  }
  if (def.shade) img = autoShade(img, def.shade, def.slots, 2)
  img = outline(img)
  return o.flash ? silhouette(img) : img
}

export function buildIcon(id: string, o: BuildOpts = {}): Img {
  const def: IconDef = ICONS[id]
  if (!def) throw new Error(`no icon ${id}`)
  let img = fromMap(def.rows, def.slots)
  if (def.shade) img = autoShade(img, def.shade, def.slots)
  img = outline(img)
  return o.flash ? silhouette(img) : img
}

export type SpriteKind = 'character' | 'enemy' | 'icon'

export function spriteKind(id: string): SpriteKind | null {
  if (CHARACTERS[id]) return 'character'
  if (ENEMIES[id]) return 'enemy'
  if (ICONS[id]) return 'icon'
  return null
}

export function buildSprite(id: string, o: BuildOpts = {}): Img {
  const k = spriteKind(id)
  if (k === 'character') return buildCharacter(id, o)
  if (k === 'enemy') return buildEnemy(id, o)
  if (k === 'icon') return buildIcon(id, o)
  throw new Error(`unknown sprite ${id}`)
}

export function spriteDims(id: string): { w: number; h: number } {
  const k = spriteKind(id)
  if (k === 'enemy') return enemySize(ENEMIES[id])
  return { w: 16, h: 16 }
}

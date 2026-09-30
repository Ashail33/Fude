/**
 * Pure sprite assembly: pixel maps → shaded, outlined Img frames.
 * No DOM here, so everything is unit-testable in node.
 */
import { OUTFITS } from '../../engine/rewards'
import { PAL } from '../palette'
import { Img, autoShade, flipX, fromMap, luminance, mix, outline, shift, silhouette, squash, type Slots } from '../raster'
import { ANIM_FRAMES, FLOAT_FRAMES, bobHead, blinkEyes, findHands, floatFrame, fromGrid, gatherLegs, headEnd, leanHead, moveHand, shiftY, standLegs, swapLegs, swingSideHand, toGrid, type Anim } from './anim'
import { CHARACTERS, type CharDef } from './characters'
import { ENEMIES, type EnemyDef, type Patch } from './enemies'
import { ICONS, type IconDef } from './icons'

export type Dir = 'up' | 'down' | 'left' | 'right'

export type { Anim }

export interface BuildOpts {
  dir?: Dir
  frame?: number
  /** Character animation (idle breathing, 4-frame walk, leaning run). Omitted: legacy 2-frame walk. */
  anim?: Anim
  /** Eyes closed (humanoids). */
  blink?: boolean
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

/** Frame count of an animation for a sprite (enemies idle on 2 frames; icons 1). */
export function frameCount(id: string, anim: Anim = 'walk'): number {
  const def = CHARACTERS[id]
  if (def) return def.float ? FLOAT_FRAMES : ANIM_FRAMES[anim]
  return ENEMIES[id] ? 2 : 1
}

const TAIL_ROWS = [12, 13, 14]

export function buildCharacter(id: string, o: BuildOpts = {}): Img {
  const def: CharDef = CHARACTERS[id]
  if (!def) throw new Error(`no character ${id}`)
  const dir = o.dir ?? 'down'
  const slots = id === 'mage' ? outfitSlots(o.outfit) : (def.slots ?? {})
  const legRows = def.legRows ?? [13, 14]
  const span = def.span ?? [3, 12]
  const sideSpan = def.sideSpan ?? [2, 12]
  const head = def.head ?? headEnd(def.down)
  const torso: [number, number] = [head + 1, legRows[0] - 1]
  const side = dir === 'left' || dir === 'right'
  const key = side ? 'side' : dir
  // Legacy callers (no `anim`) alternate frames 0/1: the two contact poses.
  const anim: Anim = o.anim ?? 'walk'
  const n = def.float ? FLOAT_FRAMES : ANIM_FRAMES[anim]
  let frame = o.frame ?? 0
  if (!o.anim) frame = def.float ? (frame % 2) * 2 : (frame % 2) * 2
  frame = ((frame % n) + n) % n

  let g = toGrid(def[key])
  if (def.float) {
    const f = floatFrame(g, frame, TAIL_ROWS)
    g = f.grid
    if (o.blink) g = blinkEyes(g, head)
    g = shiftY(g, f.dy)
  } else if (anim === 'idle') {
    g = side ? toGrid(def.side1 ?? fromGrid(gatherLegs(g, legRows, sideSpan))) : standLegs(g, legRows, span)
    if (o.blink) g = blinkEyes(g, head)
    if (frame === 1) g = bobHead(g, head)
  } else {
    const contact = frame % 2 === 0
    const second = frame === 2
    const run = anim === 'run'
    if (side) {
      if (contact) {
        if (second && def.side1Contact) g = toGrid(def.side1Contact)
        g = swingSideHand(g, torso, second ? -1 : 1)
      } else g = def.side1 ? toGrid(def.side1) : gatherLegs(g, legRows, sideSpan)
      if (run) g = leanHead(g, head, 1)
    } else {
      if (contact) {
        const explicit = second ? (dir === 'down' ? def.down1 : def.up1) : undefined
        if (explicit) g = toGrid(explicit)
        else if (second) g = swapLegs(g, legRows, span)
        const hands = findHands(g, torso)
        const up = second ? hands.right : hands.left
        const down = second ? hands.left : hands.right
        if (down) g = moveHand(g, down, 1, legRows[0] - 1)
        if (up) g = moveHand(g, up, -1, legRows[0] - 1)
      } else {
        g = standLegs(g, legRows, span)
        if (run) {
          const hands = findHands(g, torso)
          if (hands.left) g = moveHand(g, hands.left, -1, legRows[0] - 1)
          if (hands.right) g = moveHand(g, hands.right, -1, legRows[0] - 1)
        }
      }
    }
    if (o.blink) g = blinkEyes(g, head)
    if (contact) g = bobHead(g, head)
  }
  let img = fromMap(fromGrid(g), slots)
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

function enemyBase(def: EnemyDef, frame = 0): Img {
  const { w, h } = enemySize(def)
  let img: Img
  if (def.build) img = def.build(frame)
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
  [PAL.light]: PAL.gold,
  [PAL.crimson]: PAL.fire,
}

export function buildEnemy(id: string, o: BuildOpts = {}): Img {
  const def = ENEMIES[id]
  if (!def) throw new Error(`no enemy ${id}`)
  const frame = (o.frame ?? 0) % 2
  let img = enemyBase(def, frame)
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

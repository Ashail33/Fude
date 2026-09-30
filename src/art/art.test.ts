import { describe, expect, it } from 'vitest'
import { OUTFITS } from '../engine/rewards'
import { CHARACTER_SPRITES, ENEMY_SPRITES, ICON_SPRITES } from './index'
import { PAL } from './palette'
import { LEGEND, checkMap, outline, fromMap, autoShade, type Img } from './raster'
import { CHARACTERS } from './sprites/characters'
import { ENEMIES } from './sprites/enemies'
import { ICONS } from './sprites/icons'
import { buildSprite, enemyRows, enemySize, spriteDims } from './sprites/build'
import { PROPS } from './tilemaps'
import { TILE_IDS, computeNeighbours, tileFrame, tileVariant, type TileId } from './tiles'
import { SPECS, frameCount, normaliseNb, renderTile } from './tilegen'

const palHex = new Set<string>(Object.values(PAL))
const slotKeys = (s?: Record<string, string>) => Object.keys(s ?? {}).join('')

function opaque(img: Img) {
  return img.px.filter(Boolean).length
}

describe('palette legend', () => {
  it('maps every legend char to a palette key', () => {
    for (const k of Object.values(LEGEND)) expect(PAL[k]).toMatch(/^#[0-9a-f]{6}$/i)
  })
  it('legend chars are unique single characters', () => {
    for (const ch of Object.keys(LEGEND)) expect(ch).toHaveLength(1)
  })
})

describe('character pixel maps', () => {
  it('every contract id has art', () => {
    for (const id of CHARACTER_SPRITES) expect(CHARACTERS[id], id).toBeDefined()
  })
  for (const id of CHARACTER_SPRITES) {
    it(`${id}: all maps are 16×16 with valid chars`, () => {
      const d = CHARACTERS[id]
      const slots = id === 'mage' ? '1234' : slotKeys(d.slots)
      for (const k of ['down', 'up', 'side', 'down1', 'up1', 'side1'] as const) {
        const m = d[k]
        if (!m) continue
        expect(checkMap(m, 16, 16, slots), `${id}.${k}`).toEqual([])
      }
    })
    it(`${id}: builds 4 directions × 2 frames`, () => {
      for (const dir of ['down', 'up', 'left', 'right'] as const)
        for (const frame of [0, 1]) {
          const img = buildSprite(id, { dir, frame })
          expect(img.w).toBe(16)
          expect(img.h).toBe(16)
          expect(opaque(img), `${id} ${dir} ${frame}`).toBeGreaterThan(20)
        }
    })
  }
  it('the two walk frames differ', () => {
    for (const id of CHARACTER_SPRITES)
      for (const dir of ['down', 'up', 'right'] as const) {
        const a = buildSprite(id, { dir, frame: 0 }).px.join()
        const b = buildSprite(id, { dir, frame: 1 }).px.join()
        expect(a === b, `${id} ${dir}`).toBe(false)
      }
  })
  it('left is the mirror of right', () => {
    const r = buildSprite('guard', { dir: 'right' })
    const l = buildSprite('guard', { dir: 'left' })
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) expect(l.get(x, y)).toBe(r.get(15 - x, y))
  })
  it('mage recolours per outfit', () => {
    const seen = new Set<string>()
    for (const o of OUTFITS) seen.add(buildSprite('mage', { outfit: o.id }).px.join())
    expect(seen.size).toBe(OUTFITS.length)
  })
})

describe('enemy pixel maps', () => {
  it('every contract id has art', () => {
    for (const id of ENEMY_SPRITES) expect(ENEMIES[id], id).toBeDefined()
  })
  for (const id of ENEMY_SPRITES) {
    it(`${id}: map dimensions, chars and frames`, () => {
      const d = ENEMIES[id]
      const { w, h } = enemySize(d)
      if (d.rows) {
        expect(checkMap(d.rows, d.sym ? w / 2 : w, h, slotKeys(d.slots)), id).toEqual([])
        expect(enemyRows(d).every((r) => r.length === w)).toBe(true)
      }
      for (const p of [...(d.patch ?? []), ...(d.frame1 ?? [])]) {
        const width = p.rows[0].length
        expect(checkMap(p.rows, width, p.rows.length, slotKeys(d.slots) + '_'), `${id} patch`).toEqual([])
        expect(p.x + width).toBeLessThanOrEqual(w)
        expect(p.y + p.rows.length).toBeLessThanOrEqual(h)
      }
      const f0 = buildSprite(id, { frame: 0 })
      const f1 = buildSprite(id, { frame: 1 })
      expect([f0.w, f0.h]).toEqual([w, h])
      expect(spriteDims(id)).toEqual({ w, h })
      expect(opaque(f0)).toBeGreaterThan(w * h * 0.12)
      expect(f0.px.join() === f1.px.join(), `${id} idle frames differ`).toBe(false)
    })
  }
  it('the final boss is big', () => {
    expect(spriteDims('dragon').w).toBeGreaterThanOrEqual(48)
  })
})

describe('icons', () => {
  it('every contract id has art', () => {
    for (const id of ICON_SPRITES) expect(ICONS[id], id).toBeDefined()
  })
  for (const id of ICON_SPRITES) {
    it(`${id}: 16×16 valid`, () => {
      expect(checkMap(ICONS[id].rows, 16, 16, slotKeys(ICONS[id].slots)), id).toEqual([])
      expect(opaque(buildSprite(id))).toBeGreaterThan(15)
    })
  }
})

describe('flash', () => {
  it('renders a pure white silhouette with the same shape', () => {
    for (const id of ['mage', 'slime', 'heart', 'dragon'] as const) {
      const a = buildSprite(id)
      const b = buildSprite(id, { flash: true })
      for (let i = 0; i < a.px.length; i++) {
        expect(!!b.px[i]).toBe(!!a.px[i])
        if (b.px[i]) expect(b.px[i]).toBe(PAL.white)
      }
    }
  })
})

describe('sprites only use palette colours (plus outfit recolours)', () => {
  it('characters (non-mage), enemies and icons', () => {
    const ids = [...CHARACTER_SPRITES.filter((x) => x !== 'mage'), ...ENEMY_SPRITES, ...ICON_SPRITES]
    for (const id of ids)
      for (const frame of [0, 1]) for (const c of buildSprite(id, { frame }).px) if (c) expect(palHex.has(c), `${id} ${c}`).toBe(true)
  })
})

describe('tile maps', () => {
  it('prop maps are 16×16 with valid chars', () => {
    for (const [id, p] of Object.entries(PROPS)) {
      for (const m of p.frames ?? [p.rows!]) expect(checkMap(m, 16, 16), id).toEqual([])
    }
  })
  it('every tile id renders every frame, fully covering the cell', () => {
    for (const id of TILE_IDS) {
      for (let f = 0; f < frameCount(id); f++)
        for (const nb of [0, 0xff, 0x55, 0x11, 0x44]) {
          const img = renderTile(id, { frame: f, nb: normaliseNb(id, nb) })
          expect(img.w).toBe(16)
          expect(opaque(img), `${id} f${f} nb${nb}`).toBe(256)
        }
    }
  })
  it('animated tiles actually animate', () => {
    for (const id of ['water', 'flowers', 'tall-grass', 'lantern', 'portal', 'warp-circle', 'campfire', 'sakura', 'gate-closed'] as TileId[]) {
      expect(frameCount(id), id).toBeGreaterThan(1)
      const a = renderTile(id, { frame: 0, nb: 0xff }).px.join()
      const b = renderTile(id, { frame: 1, nb: 0xff }).px.join()
      expect(a === b, id).toBe(false)
    }
  })
  it('water draws a shoreline where neighbours are land', () => {
    const open = renderTile('water', { nb: 0xff })
    const shore = renderTile('water', { nb: 0 })
    expect(open.get(8, 0)).not.toBe(shore.get(8, 0))
    expect([PAL.grass, PAL.leaf, PAL.grassLight]).toContain(shore.get(8, 0))
  })
  it('grass varies by position', () => {
    const seen = new Set<string>()
    for (let x = 0; x < 8; x++) seen.add(renderTile('grass', { variant: tileVariant('grass', x, 3) }).px.join())
    expect(seen.size).toBeGreaterThan(3)
  })
  it('specs only reference known tiles', () => {
    for (const k of Object.keys(SPECS)) expect(TILE_IDS as readonly string[]).toContain(k)
    for (const s of Object.values(SPECS)) if (s?.under) expect(TILE_IDS as readonly string[]).toContain(s.under)
  })
  it('computeNeighbours treats water family as one', () => {
    const map: TileId[][] = [
      ['grass', 'water', 'grass'],
      ['water', 'lily', 'bridge-h'],
      ['grass', 'water', 'grass'],
    ]
    const nb = computeNeighbours((x, y) => map[y]?.[x], 1, 1)
    expect(nb & 1).toBe(1) // N water
    expect(nb & 4).toBe(4) // E bridge
    expect(nb & 2).toBe(0) // NE grass
  })
  it('tileFrame cycles and is stable', () => {
    expect(tileFrame('water', 0)).toBe(0)
    expect(tileFrame('grass', 12345)).toBe(0)
    expect(tileFrame('water', 280 * 5)).toBe(1)
  })
})

describe('raster helpers', () => {
  it('outline wraps a pixel in ink', () => {
    const o = outline(fromMap(['...', '.r.', '...']))
    expect(o.get(1, 0)).toBe(PAL.ink)
    expect(o.get(0, 0)).toBe(null)
  })
  it('autoShade lights the top-left and darkens the bottom-right', () => {
    const img = autoShade(fromMap(['rrrrrr', 'rrrrrr', 'rrrrrr', 'rrrrrr', 'rrrrrr', 'rrrrrr']), 'r')
    expect(img.get(0, 0)).toBe(PAL.grassLight)
    expect(img.get(5, 5)).toBe(PAL.leaf)
  })
})

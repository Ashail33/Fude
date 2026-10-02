#!/usr/bin/env node
/**
 * Process raw Higgsfield downloads into game-ready WebP.
 *
 *   art-src/<category>/<id>.(png|jpg|jpeg|webp)  →  public/art/hd/<category>/<id>.webp
 *
 * Cut-out art (portraits, enemies, bosses) is generated on a flat key colour
 * (#00FF00 or #FF00FF, see src/art/hd/manifest.ts); this removes it with a
 * soft edge, suppresses colour spill, trims empty margins and resizes.
 * Writes public/art/hd/available.json, which the game reads at startup.
 *
 * Run: npm run art:process   (add --force to re-process everything)
 */
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, parse } from 'node:path'
import sharp from 'sharp'

const { HD_ASSETS } = await import('../src/art/hd/manifest.ts')

const SRC = 'art-src'
const OUT = 'public/art/hd'
const force = process.argv.includes('--force')

/** Longest-side limits per category (keeps downloads small on phones). */
const MAX = { portraits: 900, enemies: 700, bosses: 1100, backdrops: 1920, scenes: 1920, title: 1920 }

function findSource(asset) {
  const dir = join(SRC, asset.category)
  if (!existsSync(dir)) return null
  const f = readdirSync(dir).find((n) => parse(n).name.toLowerCase() === asset.id && /\.(png|jpe?g|webp)$/i.test(n))
  return f ? join(dir, f) : null
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * Chroma-key: alpha from distance to the key colour in a
 * key-relative space, with a soft ramp and spill suppression.
 */
export function keyOut(data, channels, key) {
  const [kr, kg, kb] = key
  const keyIsGreen = kg > kr && kg > kb
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // How much the pixel is dominated by the key hue.
    const dom = keyIsGreen ? g - Math.max(r, b) : Math.min(r, b) - g
    const dist = Math.hypot(r - kr, g - kg, b - kb)
    let a = 1
    if (dist < 90 || dom > 110) a = 0
    else if (dom > 40) a = Math.max(0, 1 - (dom - 40) / 70)
    // Despill: pull the key channel(s) back toward the others on edges.
    if (a > 0 && dom > 0) {
      if (keyIsGreen) data[i + 1] = Math.max(r, b) + Math.round(dom * 0.25)
      else {
        const m = g + Math.round(dom * 0.25)
        data[i] = Math.min(r, m + 20)
        data[i + 2] = Math.min(b, m + 20)
      }
    }
    // Respect existing transparency (e.g. images generated with a transparent background).
    data[i + 3] = Math.round(a * data[i + 3])
  }
  return data
}

/**
 * The box worth keeping in a cut-out: rows and columns with real coverage,
 * padded a little. A plain trim keeps every stray speck (a firefly, a
 * sparkle, leftover key noise), which can leave a figure floating in a
 * mostly empty square that then shows up small and off-centre in the game.
 */
export function contentBox(data, width, height, channels) {
  const solid = (x, y) => data[(y * width + x) * channels + 3] > 96
  const rows = new Uint32Array(height)
  const cols = new Uint32Array(width)
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (solid(x, y)) {
        rows[y]++
        cols[x]++
      }
  const span = (counts, need) => {
    const a = counts.findIndex((c) => c >= need)
    if (a < 0) return null
    let b = counts.length - 1
    while (counts[b] < need) b--
    return [a, b]
  }
  // the body: rows and columns with real coverage
  const r = span(rows, Math.max(2, Math.round(width * 0.02)))
  const c = span(cols, Math.max(2, Math.round(height * 0.02)))
  if (!r || !c) return null
  let [top, bottom] = r
  let [left, right] = c
  // then grow over anything touching it (antlers, a tail, a raised hand),
  // jumping small gaps but not across to far-off specks
  const gap = Math.max(2, Math.round(Math.max(width, height) * 0.015))
  const rowHit = (y) => { for (let x = left; x <= right; x++) if (solid(x, y)) return true; return false }
  const colHit = (x) => { for (let y = top; y <= bottom; y++) if (solid(x, y)) return true; return false }
  const grow = (pos, dir, limit, hit) => {
    for (let miss = 0, p = pos + dir; p >= 0 && p < limit && miss <= gap; p += dir) {
      if (hit(p)) { pos = p; miss = 0 } else miss++
    }
    return pos
  }
  for (let changed = true; changed; ) {
    const before = [top, bottom, left, right].join()
    top = grow(top, -1, height, rowHit)
    bottom = grow(bottom, 1, height, rowHit)
    left = grow(left, -1, width, colHit)
    right = grow(right, 1, width, colHit)
    changed = before !== [top, bottom, left, right].join()
  }
  const pad = Math.round(Math.max(width, height) * 0.01)
  top = Math.max(0, top - pad)
  left = Math.max(0, left - pad)
  bottom = Math.min(height - 1, bottom + pad)
  right = Math.min(width - 1, right + pad)
  return { left, top, width: right - left + 1, height: bottom - top + 1 }
}

async function processOne(asset, src) {
  const outDir = join(OUT, asset.category)
  mkdirSync(outDir, { recursive: true })
  const dest = join(outDir, `${asset.id}.webp`)
  if (!force && existsSync(dest) && statSync(dest).mtimeMs > statSync(src).mtimeMs) return 'skip'
  const max = MAX[asset.category] ?? 1600
  let img = sharp(src).rotate()
  if (asset.cutout) {
    const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    keyOut(data, info.channels, hexToRgb(asset.cutout.key))
    img = sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    const box = contentBox(data, info.width, info.height, info.channels)
    img = box ? img.extract(box) : img.trim({ threshold: 1 })
    // Re-materialise after trim so resize sees trimmed bounds.
    const trimmed = await img.png().toBuffer()
    img = sharp(trimmed)
  }
  await img
    .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: asset.cutout ? 86 : 80, alphaQuality: 90, effort: 5 })
    .toFile(dest)
  return 'done'
}

const available = []
let done = 0
for (const asset of HD_ASSETS) {
  const src = findSource(asset)
  if (src) {
    const r = await processOne(asset, src)
    if (r === 'done') {
      done++
      console.log(`✔ ${asset.category}/${asset.id}`)
    }
  }
  if (existsSync(join(OUT, asset.category, `${asset.id}.webp`))) available.push(asset.id)
}
mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'available.json'), JSON.stringify(available.sort(), null, 0) + '\n')
const missing = HD_ASSETS.filter((a) => !available.includes(a.id))
console.log(`\nProcessed ${done}. Available ${available.length}/${HD_ASSETS.length}.`)
if (missing.length) console.log(`Still missing (priority 1 first):\n` + missing.sort((a, b) => a.priority - b.priority).map((a) => `  P${a.priority} ${a.category}/${a.id}`).join('\n'))

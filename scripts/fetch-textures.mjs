/**
 * Build-time HD environment textures. art-src/textures.json maps names
 * (grass, path, wall, roof…) to generated images: { url, tile?: boolean }.
 * Each is downloaded once into public/tex as a JPEG: ground and wall
 * surfaces made seamless (the edges are blended with a half-offset copy,
 * so they repeat without visible seams), single pictures such as doors kept
 * as they are. public/tex/available.json lists what made it; the 3D
 * renderer falls back to the pixel tiles for anything missing. Failures
 * never fail the build.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'art-src/textures.json'
const OUT = 'public/tex'
const SIZE = 512

mkdirSync(OUT, { recursive: true })
const sources = existsSync(SRC) ? JSON.parse(readFileSync(SRC, 'utf8')) : {}
let fetched = 0
let failed = 0

/** Blend the borders with a half-offset copy so the image wraps seamlessly. */
function seamless(px, n) {
  const out = Buffer.alloc(px.length)
  const h = n >> 1
  const band = n * 0.22
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const d = Math.min(x, n - 1 - x, y, n - 1 - y)
      const t = Math.min(1, d / band)
      const w = t * t * (3 - 2 * t)
      const i = (y * n + x) * 3
      const j = (((y + h) % n) * n + ((x + h) % n)) * 3
      for (let c = 0; c < 3; c++) out[i + c] = Math.round(px[i + c] * w + px[j + c] * (1 - w))
    }
  return out
}

async function process(buf, tile) {
  const { default: sharp } = await import('sharp')
  const { data } = await sharp(buf).removeAlpha().resize(SIZE, SIZE, { fit: 'cover' }).raw().toBuffer({ resolveWithObject: true })
  const px = tile ? seamless(data, SIZE) : data
  return sharp(px, { raw: { width: SIZE, height: SIZE, channels: 3 } }).jpeg({ quality: 86 }).toBuffer()
}

await Promise.all(
  Object.entries(sources).map(async ([id, src]) => {
    const { url, tile = true } = typeof src === 'string' ? { url: src } : src
    const dest = join(OUT, `${id}.jpg`)
    if (existsSync(dest) && statSync(dest).size > 1000) return
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 120_000)
      const res = await fetch(url, { signal: ctrl.signal })
      clearTimeout(t)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      writeFileSync(dest, await process(Buffer.from(await res.arrayBuffer()), tile))
      fetched++
    } catch (e) {
      failed++
      console.warn(`textures: could not fetch ${id} (${e.message}); keeping the pixel tile`)
    }
  }),
)
const available = readdirSync(OUT)
  .filter((f) => f.endsWith('.jpg') && statSync(join(OUT, f)).size > 1000)
  .map((f) => f.slice(0, -4))
  .sort()
writeFileSync(join(OUT, 'available.json'), JSON.stringify(available) + '\n')
console.log(`textures: ${Object.keys(sources).length} sources, ${fetched} downloaded, ${failed} unavailable, ${available.length} available`)
// TEMP: verification export
writeFileSync(join(OUT, 'all.txt'), JSON.stringify(Object.fromEntries(available.map((id) => [id, readFileSync(join(OUT, `${id}.jpg`)).toString('base64')]))))

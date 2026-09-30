#!/usr/bin/env node
/**
 * Build-time art fetch. art-src/sources.json maps asset ids to the URLs of
 * generated images (e.g. Higgsfield results). Before each build this
 * downloads any source not already in art-src/, then runs the normal
 * processing (background removal, trim, WebP) via process-art.mjs.
 *
 * Never fails the build: an unreachable URL is logged and that asset keeps
 * its pixel-art fallback.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const { HD_BY_ID } = await import('../src/art/hd/manifest.ts')

const SOURCES = 'art-src/sources.json'
const sources = existsSync(SOURCES) ? JSON.parse(readFileSync(SOURCES, 'utf8')) : {}
const entries = Object.entries(sources).filter(([id]) => HD_BY_ID.has(id))

let fetched = 0
let failed = 0
await Promise.all(
  entries.map(async ([id, url]) => {
    const asset = HD_BY_ID.get(id)
    const dir = join('art-src', asset.category)
    const ext = (new URL(url).pathname.match(/\.(png|jpe?g|webp)$/i)?.[1] ?? 'png').toLowerCase()
    const dest = join(dir, `${id}.${ext}`)
    if (existsSync(dest)) return
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 60_000)
      const res = await fetch(url, { signal: ctrl.signal })
      clearTimeout(t)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      mkdirSync(dir, { recursive: true })
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
      fetched++
    } catch (e) {
      failed++
      console.warn(`art: could not fetch ${id} (${e.message}); keeping pixel art`)
    }
  }),
)
console.log(`art: ${entries.length} sources, ${fetched} downloaded, ${failed} unavailable`)

const r = spawnSync(process.execPath, ['--experimental-strip-types', '--no-warnings', 'scripts/process-art.mjs'], { stdio: 'inherit' })
if (r.status !== 0) console.warn('art: processing failed; building with pixel art only')

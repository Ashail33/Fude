#!/usr/bin/env node
/**
 * Build-time 3D model fetch. art-src/models.json maps character ids to the
 * URLs of generated GLB models (Higgsfield image-to-3D). Missing ones are
 * downloaded to public/models/<id>.glb and public/models/available.json
 * lists what's there; the game uses a model when listed and falls back to
 * its built-in toy model otherwise. Never fails the build.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'art-src/models.json'
const OUT = 'public/models'
const sources = existsSync(SRC) ? JSON.parse(readFileSync(SRC, 'utf8')) : {}
mkdirSync(OUT, { recursive: true })

let fetched = 0
let failed = 0
await Promise.all(
  Object.entries(sources).map(async ([id, url]) => {
    const dest = join(OUT, `${id}.glb`)
    if (existsSync(dest) && statSync(dest).size > 1000) return
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 120_000)
      const res = await fetch(url, { signal: ctrl.signal })
      clearTimeout(t)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.subarray(0, 4).toString() !== 'glTF') throw new Error('not a GLB')
      writeFileSync(dest, buf)
      fetched++
    } catch (e) {
      failed++
      console.warn(`models: could not fetch ${id} (${e.message}); keeping the built-in model`)
    }
  }),
)
const available = readdirSync(OUT)
  .filter((f) => f.endsWith('.glb') && statSync(join(OUT, f)).size > 1000)
  .map((f) => f.slice(0, -4))
  .sort()
writeFileSync(join(OUT, 'available.json'), JSON.stringify(available) + '\n')
// TEMP (orientation check): text copies of the models, readable through the Vercel fetch tool
mkdirSync(join(OUT, 'b64'), { recursive: true })
for (const id of available) writeFileSync(join(OUT, 'b64', `${id}.txt`), readFileSync(join(OUT, `${id}.glb`)).toString('base64'))
console.log(`models: ${Object.keys(sources).length} sources, ${fetched} downloaded, ${failed} unavailable, ${available.length} available`)

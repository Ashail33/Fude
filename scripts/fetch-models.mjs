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
/**
 * Turn a model about Y so it faces +Z (some generators output side-facing
 * meshes). Rotates POSITION/NORMAL data in place and clears node rotations
 * on mesh nodes, so every tool (the game, auto-riggers) sees it upright
 * and facing forward.
 */
function turnGlb(buf, degrees) {
  const jsonLen = buf.readUInt32LE(12)
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'))
  const binStart = 20 + jsonLen + 8
  const a = (degrees * Math.PI) / 180
  const c = Math.cos(a)
  const s = Math.sin(a)
  const done = new Set()
  for (const mesh of json.meshes ?? [])
    for (const prim of mesh.primitives ?? [])
      for (const key of ['POSITION', 'NORMAL']) {
        const ai = prim.attributes?.[key]
        if (ai === undefined || done.has(ai)) continue
        done.add(ai)
        const acc = json.accessors[ai]
        const bv = json.bufferViews[acc.bufferView]
        const off = binStart + (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0)
        const stride = bv.byteStride ?? 12
        const mn = [Infinity, Infinity, Infinity]
        const mx = [-Infinity, -Infinity, -Infinity]
        for (let i = 0; i < acc.count; i++) {
          const p = off + i * stride
          const x = buf.readFloatLE(p)
          const y = buf.readFloatLE(p + 4)
          const z = buf.readFloatLE(p + 8)
          const v = [c * x + s * z, y, -s * x + c * z]
          buf.writeFloatLE(v[0], p)
          buf.writeFloatLE(v[2], p + 8)
          for (let k = 0; k < 3; k++) {
            mn[k] = Math.min(mn[k], v[k])
            mx[k] = Math.max(mx[k], v[k])
          }
        }
        if (key === 'POSITION') {
          acc.min = mn
          acc.max = mx
        }
      }
  let js = Buffer.from(JSON.stringify(json))
  const pad = (4 - (js.length % 4)) % 4
  js = Buffer.concat([js, Buffer.alloc(pad, 0x20)])
  const rest = buf.subarray(20 + jsonLen)
  const head = Buffer.alloc(20)
  head.write('glTF', 0)
  head.writeUInt32LE(2, 4)
  head.writeUInt32LE(20 + js.length + rest.length, 8)
  head.writeUInt32LE(js.length, 12)
  head.write('JSON', 16)
  return Buffer.concat([head, js, rest])
}

await Promise.all(
  Object.entries(sources).map(async ([id, src]) => {
    const { url, turn } = typeof src === 'string' ? { url: src, turn: 0 } : src
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
      writeFileSync(dest, turn ? turnGlb(buf, turn) : buf)
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
// TEMP (testing rigs): text copies readable through the Vercel fetch tool
mkdirSync(join(OUT, 'b64'), { recursive: true })
for (const id of available) writeFileSync(join(OUT, 'b64', `${id}.txt`), readFileSync(join(OUT, `${id}.glb`)).toString('base64'))
console.log(`models: ${Object.keys(sources).length} sources, ${fetched} downloaded, ${failed} unavailable, ${available.length} available`)

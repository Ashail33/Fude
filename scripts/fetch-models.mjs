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
import { slimToBudget } from './glb-opt.mjs'

const SRC = 'art-src/models.json'
const OUT = 'public/models'
const sources = existsSync(SRC) ? JSON.parse(readFileSync(SRC, 'utf8')) : {}
mkdirSync(OUT, { recursive: true })

/** Which URL each downloaded model came from, so a changed source (say, a re-rigged model) is fetched again. */
const STAMP = join(OUT, '.sources.json')
const stamp = existsSync(STAMP) ? JSON.parse(readFileSync(STAMP, 'utf8')) : {}

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

/**
 * Re-encode oversized embedded textures (some rigging exports embed 5 MB
 * PNGs) as ≤1024 px JPEG/PNG so models stay light on phones. Rebuilds the
 * binary chunk with the new image bytes.
 */
async function slimGlb(buf) {
  const { default: sharp } = await import('sharp')
  const jsonLen = buf.readUInt32LE(12)
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'))
  const binStart = 20 + jsonLen + 8
  const binLen = buf.readUInt32LE(20 + jsonLen)
  const bin = buf.subarray(binStart, binStart + binLen)
  const views = json.bufferViews.map((v) => bin.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength))
  let changed = false
  for (const img of json.images ?? []) {
    if (img.bufferView === undefined) continue
    const data = views[img.bufferView]
    if (data.length < 600_000) continue
    const meta = await sharp(data).metadata()
    const opaque = !meta.hasAlpha
    const out = await sharp(data)
      .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
      [opaque ? 'jpeg' : 'png'](opaque ? { quality: 86 } : { compressionLevel: 9, palette: true })
      .toBuffer()
    views[img.bufferView] = out
    img.mimeType = opaque ? 'image/jpeg' : 'image/png'
    changed = true
  }
  if (!changed) return buf
  // repack every view (4-byte aligned) into a fresh binary chunk
  const parts = []
  let off = 0
  json.bufferViews.forEach((v, i) => {
    const d = views[i]
    const pad = (4 - (off % 4)) % 4
    if (pad) parts.push(Buffer.alloc(pad))
    off += pad
    v.byteOffset = off
    v.byteLength = d.length
    parts.push(d)
    off += d.length
  })
  const endPad = (4 - (off % 4)) % 4
  if (endPad) parts.push(Buffer.alloc(endPad))
  const newBin = Buffer.concat(parts)
  json.buffers[0].byteLength = newBin.length
  let js = Buffer.from(JSON.stringify(json))
  js = Buffer.concat([js, Buffer.alloc((4 - (js.length % 4)) % 4, 0x20)])
  const head = Buffer.alloc(20)
  head.write('glTF', 0)
  head.writeUInt32LE(2, 4)
  head.writeUInt32LE(20 + js.length + 8 + newBin.length, 8)
  head.writeUInt32LE(js.length, 12)
  head.write('JSON', 16)
  const binHead = Buffer.alloc(8)
  binHead.writeUInt32LE(newBin.length, 0)
  binHead.write('BIN\0', 4)
  return Buffer.concat([head, js, binHead, newBin])
}

await Promise.all(
  Object.entries(sources).map(async ([id, src]) => {
    const { url, turn } = typeof src === 'string' ? { url: src, turn: 0 } : src
    const dest = join(OUT, `${id}.glb`)
    // (an unstamped file is fetched again once; if that fails the old file stays)
    if (existsSync(dest) && statSync(dest).size > 1000 && stamp[id] === url) return
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 120_000)
      const res = await fetch(url, { signal: ctrl.signal })
      clearTimeout(t)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.subarray(0, 4).toString() !== 'glTF') throw new Error('not a GLB')
      // characters stand ~100 px tall on a phone: 7k triangles and 512 px textures are plenty
      writeFileSync(dest, (await slimToBudget(await slimGlb(turn ? turnGlb(buf, turn) : buf), 7000)).glb)
      stamp[id] = url
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
writeFileSync(STAMP, JSON.stringify(stamp, null, 1) + '\n')
console.log(`models: ${Object.keys(sources).length} sources, ${fetched} downloaded, ${failed} unavailable, ${available.length} available`)

/**
 * Build-time 3D prop fetch. art-src/props.json maps tile ids (tree, well,
 * torii…) to generated GLB URLs. Each is downloaded once into public/props,
 * decimated to a triangle budget (forests draw hundreds of trees) and given
 * small JPEG textures. public/props/available.json lists what made it, so
 * the 3D renderer uses a model where one exists and the built-in smooth
 * prop otherwise. Failures never fail the build.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'art-src/props.json'
const OUT = 'public/props'
/** Triangle budgets: repeated scenery stays light, landmarks keep detail. */
const SCENERY = new Set(['tree', 'pine', 'sakura', 'bamboo', 'bush', 'rock', 'stump'])
const budget = (id) => (SCENERY.has(id) ? 1800 : 6000)

mkdirSync(OUT, { recursive: true })
const sources = existsSync(SRC) ? JSON.parse(readFileSync(SRC, 'utf8')) : {}
let fetched = 0
let failed = 0

async function optimise(buf, id) {
  const { NodeIO } = await import('@gltf-transform/core')
  const { dedup, prune, simplify, weld, textureCompress } = await import('@gltf-transform/functions')
  const { MeshoptSimplifier } = await import('meshoptimizer')
  const { default: sharp } = await import('sharp')
  await MeshoptSimplifier.ready
  const io = new NodeIO()
  const doc = await io.readBinary(new Uint8Array(buf))
  let tris = 0
  for (const mesh of doc.getRoot().listMeshes())
    for (const prim of mesh.listPrimitives()) tris += (prim.getIndices()?.getCount() ?? prim.getAttribute('POSITION').getCount()) / 3
  const ratio = Math.min(1, budget(id) / Math.max(1, tris))
  await doc.transform(
    dedup(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.01 }),
    textureCompress({ encoder: sharp, targetFormat: 'jpeg', resize: [512, 512], quality: 85 }),
    prune(),
  )
  return Buffer.from(await io.writeBinary(doc))
}

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
      writeFileSync(dest, await optimise(buf, id))
      fetched++
    } catch (e) {
      failed++
      console.warn(`props: could not fetch ${id} (${e.message}); keeping the built-in prop`)
    }
  }),
)
const available = readdirSync(OUT)
  .filter((f) => f.endsWith('.glb') && statSync(join(OUT, f)).size > 1000)
  .map((f) => f.slice(0, -4))
  .sort()
writeFileSync(join(OUT, 'available.json'), JSON.stringify(available) + '\n')
console.log(`props: ${Object.keys(sources).length} sources, ${fetched} downloaded, ${failed} unavailable, ${available.length} available`)

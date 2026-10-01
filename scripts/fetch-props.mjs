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
import { slimToBudget } from './glb-opt.mjs'

const SRC = 'art-src/props.json'
const OUT = 'public/props'
/** Triangle budgets: repeated scenery stays light, landmarks keep detail. */
const SCENERY = new Set(['tree', 'pine', 'sakura', 'bamboo', 'bush', 'rock', 'stump'])
const SMALL = new Set(['stepping-stone', 'pot', 'barrel', 'crate', 'chest', 'chest-open', 'lantern', 'sign', 'campfire', 'anvil'])
const budget = (id) => (SCENERY.has(id) ? 1800 : SMALL.has(id) ? 1500 : 3000)

mkdirSync(OUT, { recursive: true })
const sources = existsSync(SRC) ? JSON.parse(readFileSync(SRC, 'utf8')) : {}
let fetched = 0
let failed = 0

async function optimise(buf, id) {
  return (await slimToBudget(buf, budget(id))).glb
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

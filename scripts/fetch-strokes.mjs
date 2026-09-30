#!/usr/bin/env node
/**
 * Downloads stroke-order data from KanjiVG (CC BY-SA 3.0, Ulrich Apel)
 * and writes src/data/strokes.json: { "<char>": ["<path d>", ...] } in
 * stroke order. Coordinates use KanjiVG's 0 0 109 109 viewBox.
 *
 *   node scripts/fetch-strokes.mjs
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/'

// Kana: every single-character entry in the gojūon tables of src/data/kana.ts.
const kanaSrc = await readFile(resolve(root, 'src/data/kana.ts'), 'utf8')
const rowsBlock = kanaSrc.slice(kanaSrc.indexOf('const ROWS'), kanaSrc.indexOf('export const HIRAGANA'))
const kana = [...rowsBlock.matchAll(/'([぀-ヿ])'/g)].map((m) => m[1])

// Kanji: the core list plus any CJK characters in arcana activities of regions.ts.
const CORE = [...'火水木土石日月山川田人口大小中上下一二三本目手女子力林森休明男犬花空雨金']
// Extra look-alikes (Spot the Difference) so they can be drawn later too.
const EXTRA = [...'士太白未末入十']
const regionsSrc = await readFile(resolve(root, 'src/data/regions.ts'), 'utf8')
const arcanaKanji = regionsSrc
  .split('\n')
  .filter((l) => l.includes("game: 'arcana'"))
  .flatMap((l) => {
    const params = l.slice(l.indexOf('params:'))
    return [...params.matchAll(/'([一-鿿])'/g)].map((m) => m[1])
  })

const chars = [...new Set([...kana, ...CORE, ...arcanaKanji, ...EXTRA])]

function hex(ch) {
  return ch.codePointAt(0).toString(16).padStart(5, '0')
}

function extract(svg, ch) {
  const start = svg.indexOf('id="kvg:StrokePaths_')
  const end = svg.indexOf('id="kvg:StrokeNumbers_')
  if (start < 0) throw new Error(`no StrokePaths group for ${ch}`)
  const body = svg.slice(start, end < 0 ? undefined : end)
  const paths = []
  for (const m of body.matchAll(/<path\b[^>]*>/g)) {
    const tag = m[0]
    const id = /id="[^"]*-s(\d+)"/.exec(tag)
    const d = /\bd="([^"]+)"/.exec(tag)
    if (id && d) paths.push({ n: Number(id[1]), d: d[1].trim() })
  }
  if (!paths.length) throw new Error(`no strokes for ${ch}`)
  paths.sort((a, b) => a.n - b.n)
  return paths.map((p) => p.d)
}

async function fetchChar(ch) {
  const url = `${BASE}${hex(ch)}.svg`
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${res.status} ${url}`)
      return extract(await res.text(), ch)
    } catch (e) {
      if (attempt >= 2) throw e
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)))
    }
  }
}

const out = {}
const queue = [...chars]
const failed = []
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const ch = queue.shift()
      try {
        out[ch] = await fetchChar(ch)
      } catch (e) {
        failed.push(ch)
        console.error(`✗ ${ch}: ${e.message}`)
      }
    }
  }),
)

const ordered = Object.fromEntries(chars.filter((c) => out[c]).map((c) => [c, out[c]]))
await writeFile(resolve(root, 'src/data/strokes.json'), JSON.stringify(ordered, null, 0).replace(/\],"/g, '],\n"') + '\n')
console.log(`Wrote ${Object.keys(ordered).length} characters to src/data/strokes.json`)
if (failed.length) {
  console.error(`Failed: ${failed.join(' ')}`)
  process.exitCode = 1
}

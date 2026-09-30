/**
 * Crossword generator for G5 Word Crossword. Pure logic: no React.
 *
 * Each cell holds one character (kana, or kanji for "write in kanji"
 * entries). Words are placed one at a time so that every new word crosses
 * an existing one on a shared character, never overlapping a parallel word
 * and never touching one side-by-side (standard crossword adjacency).
 */
import type { Word } from '../data/vocab'
import { seeded } from './random'

export type Dir = 'across' | 'down'

export interface Candidate {
  /** Vocabulary word id. */
  id: string
  /** Answer characters, one per cell. */
  answer: string[]
  /** true when the answer is the word's kanji form. */
  kanji: boolean
  /** Higher = more wanted (e.g. SRS weakness). */
  weight: number
}

export interface Placed {
  id: string
  answer: string[]
  kanji: boolean
  row: number
  col: number
  dir: Dir
  /** Clue number (standard crossword numbering). */
  num: number
}

export interface Crossword {
  size: number
  entries: Placed[]
  /** grid[row][col] = character or null for a blocked/empty square. */
  grid: (string | null)[][]
}

const KANJI_RE = /[㐀-鿿々]/

export function chars(s: string): string[] {
  return Array.from(s)
}

/** Whether a word can be clued as a "write it in kanji" entry. */
export function kanjiEligible(w: Word): boolean {
  return w.jp !== w.kana && KANJI_RE.test(w.jp) && chars(w.jp).length >= 2
}

/**
 * Candidate answers for a pool of words. In `mixed` mode every word that
 * can be written in kanji is offered in both forms (the generator places at
 * most one form per word and aims for about a third kanji entries).
 * Answers must be 2..size characters; duplicate answer strings are dropped.
 */
export function buildCandidates(words: Word[], mode: 'kana' | 'mixed', size: number, weight: (id: string) => number): Candidate[] {
  const seen = new Set<string>()
  const out: Candidate[] = []
  const add = (w: Word, kanji: boolean) => {
    const answer = chars(kanji ? w.jp : w.kana)
    if (answer.length < 2 || answer.length > size) return
    const key = answer.join('')
    if (seen.has(key)) return
    seen.add(key)
    out.push({ id: w.id, answer, kanji, weight: weight(w.id) })
  }
  for (const w of words) {
    add(w, false)
    if (mode === 'mixed' && kanjiEligible(w)) add(w, true)
  }
  return out
}

interface Board {
  size: number
  cells: (string | null)[][]
  across: boolean[][]
  down: boolean[][]
}

function emptyBoard(size: number): Board {
  const mk = <T,>(v: T) => Array.from({ length: size }, () => Array.from({ length: size }, () => v))
  return { size, cells: mk<string | null>(null), across: mk(false), down: mk(false) }
}

function at(b: Board, r: number, c: number): string | null {
  if (r < 0 || c < 0 || r >= b.size || c >= b.size) return null
  return b.cells[r][c]
}

/** Returns the number of crossings if `ans` fits at (r,c,dir), or -1 if not. */
export function fitScore(b: Board, ans: string[], r: number, c: number, dir: Dir): number {
  const dr = dir === 'down' ? 1 : 0
  const dc = dir === 'across' ? 1 : 0
  const n = ans.length
  const endR = r + dr * (n - 1)
  const endC = c + dc * (n - 1)
  if (r < 0 || c < 0 || endR >= b.size || endC >= b.size) return -1
  // Squares immediately before and after the word must be empty.
  if (at(b, r - dr, c - dc) !== null) return -1
  if (at(b, endR + dr, endC + dc) !== null) return -1
  let crossings = 0
  for (let i = 0; i < n; i++) {
    const rr = r + dr * i
    const cc = c + dc * i
    const cur = b.cells[rr][cc]
    if (cur !== null) {
      if (cur !== ans[i]) return -1
      // Already used in this direction → would overlap a parallel word.
      if (dir === 'across' ? b.across[rr][cc] : b.down[rr][cc]) return -1
      crossings++
    } else {
      // Empty square: its perpendicular neighbours must be empty (no touching).
      if (at(b, rr - dc, cc - dr) !== null) return -1
      if (at(b, rr + dc, cc + dr) !== null) return -1
    }
  }
  if (crossings === n) return -1
  return crossings
}

function place(b: Board, ans: string[], r: number, c: number, dir: Dir) {
  const dr = dir === 'down' ? 1 : 0
  const dc = dir === 'across' ? 1 : 0
  ans.forEach((ch, i) => {
    const rr = r + dr * i
    const cc = c + dc * i
    b.cells[rr][cc] = ch
    if (dir === 'across') b.across[rr][cc] = true
    else b.down[rr][cc] = true
  })
}

/** Weighted random order (higher weight earlier on average). */
function weightedOrder<T>(arr: T[], weight: (t: T) => number, rng: () => number): T[] {
  // Efraimidis–Spirakis: key = u^(1/w), sort descending.
  return arr
    .map((t) => ({ t, k: Math.pow(rng(), 1 / Math.max(0.05, weight(t))) }))
    .sort((a, b) => b.k - a.k)
    .map((x) => x.t)
}

interface Layout {
  board: Board
  placed: Omit<Placed, 'num'>[]
  crossings: number
}

function attempt(cands: Candidate[], size: number, maxEntries: number, rng: () => number): Layout {
  const board = emptyBoard(size)
  // Kanji entries are harder to cross (fewer shared characters), so try them early.
  const mixed = cands.some((c) => c.kanji)
  // Mixed: coin-flip per word whether its kanji or kana form is tried first,
  // and kanji entries (fewer shared characters) get a head start.
  const kanjiFirst = new Map<string, boolean>()
  for (const c of cands) if (!kanjiFirst.has(c.id)) kanjiFirst.set(c.id, rng() < 0.45)
  const order = weightedOrder(cands, (c) => c.weight + 0.2 + (mixed && c.kanji === kanjiFirst.get(c.id) ? (c.kanji ? 1.5 : 0.6) : 0), rng)
  // First word: one of the first few, preferring a longer one.
  const head = order.slice(0, 6).filter((c) => c.answer.length >= 3 && c.answer.length <= size)
  const first = head.length ? head.sort((a, b) => b.answer.length - a.answer.length)[Math.floor(rng() * Math.min(2, head.length))] : order[0]
  const placed: Omit<Placed, 'num'>[] = []
  if (!first) return { board, placed, crossings: 0 }
  const fr = Math.floor(size / 2) + (rng() < 0.5 ? 0 : -1)
  const fc = Math.floor((size - first.answer.length) / 2)
  const fdir: Dir = rng() < 0.5 ? 'across' : 'down'
  if (fdir === 'across') place(board, first.answer, fr, fc, 'across')
  else place(board, first.answer, fc, fr, 'down')
  placed.push(fdir === 'across' ? { ...first, row: fr, col: fc, dir: 'across' } : { ...first, row: fc, col: fr, dir: 'down' })
  let crossings = 0
  const rest = order.filter((c) => c !== first)
  // Two passes: words skipped early may fit once the grid has grown.
  for (let pass = 0; pass < 2 && placed.length < maxEntries; pass++) {
    for (const cand of rest) {
      if (placed.length >= maxEntries) break
      if (placed.some((p) => p.id === cand.id)) continue
      let best: { r: number; c: number; dir: Dir; score: number } | null = null
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const cell = board.cells[r][c]
          if (cell === null) continue
          for (let i = 0; i < cand.answer.length; i++) {
            if (cand.answer[i] !== cell) continue
            for (const dir of ['across', 'down'] as Dir[]) {
              const sr = dir === 'down' ? r - i : r
              const sc = dir === 'across' ? c - i : c
              const x = fitScore(board, cand.answer, sr, sc, dir)
              if (x <= 0) continue
              // Prefer more crossings, then words nearer the centre; random tiebreak.
              const mid = (size - 1) / 2
              const score = x * 3 - (Math.abs(sr - mid) + Math.abs(sc - mid)) * 0.1 + rng() * 0.5
              if (!best || score > best.score) best = { r: sr, c: sc, dir, score }
            }
          }
        }
      }
      if (best) {
        crossings += fitScore(board, cand.answer, best.r, best.c, best.dir)
        place(board, cand.answer, best.r, best.c, best.dir)
        placed.push({ id: cand.id, answer: cand.answer, kanji: cand.kanji, row: best.r, col: best.c, dir: best.dir })
      }
    }
  }
  return { board, placed, crossings }
}

/** Assigns standard clue numbers (row-major order of start squares). */
export function numberEntries(entries: Omit<Placed, 'num'>[]): Placed[] {
  const starts = [...new Set(entries.map((e) => e.row * 1000 + e.col))].sort((a, b) => a - b)
  const numOf = new Map(starts.map((k, i) => [k, i + 1]))
  return entries
    .map((e) => ({ ...e, num: numOf.get(e.row * 1000 + e.col) ?? 0 }))
    .sort((a, b) => (a.dir === b.dir ? a.num - b.num : a.dir === 'across' ? -1 : 1))
}

export interface GenerateOptions {
  seed?: number
  attempts?: number
  minEntries?: number
  maxEntries?: number
}

/**
 * Generates a crossword from candidates. Runs several seeded attempts and
 * keeps the best (most entries within target, then most crossings, then
 * highest total weight).
 */
export function generateCrossword(cands: Candidate[], size: number, opts: GenerateOptions = {}): Crossword {
  const { seed = Math.floor(Math.random() * 2 ** 31), attempts = 60, minEntries = 6, maxEntries = 10 } = opts
  let best: Layout | null = null
  let bestScore = -Infinity
  for (let a = 0; a < attempts; a++) {
    const rng = seeded(seed + a * 7919)
    const lay = attempt(cands, size, maxEntries, rng)
    const n = lay.placed.length
    const kanjiN = lay.placed.filter((p) => p.kanji).length
    const w = lay.placed.reduce((s, p) => s + (cands.find((c) => c.id === p.id)?.weight ?? 0), 0)
    // Mixed puzzles read best with roughly a third kanji entries.
    const kanjiBalance = cands.some((c) => c.kanji) ? -Math.abs(kanjiN - Math.round(n / 3)) : 0
    const score = Math.min(n, maxEntries) * 10 + (n >= minEntries ? 50 : 0) + lay.crossings * 2 + w + kanjiBalance * 10
    if (score > bestScore) {
      bestScore = score
      best = lay
    }
    if (n >= maxEntries && kanjiBalance === 0 && a >= 8) break
  }
  const b = best ?? { board: emptyBoard(size), placed: [], crossings: 0 }
  return { size, entries: numberEntries(b.placed), grid: b.board.cells.map((row) => [...row]) }
}

/** Cells of an entry, in answer order. */
export function entryCells(e: Pick<Placed, 'row' | 'col' | 'dir' | 'answer'>): [number, number][] {
  return e.answer.map((_, i) => (e.dir === 'across' ? [e.row, e.col + i] : [e.row + i, e.col]))
}

/**
 * Checks that a crossword is consistent. Returns a list of problems (empty
 * = valid): every entry reads correctly in the grid, every run of 2+
 * letters in the grid is exactly one entry, and the grid is connected.
 */
export function validateCrossword(cw: Crossword): string[] {
  const errs: string[] = []
  const { size, grid, entries } = cw
  const rebuilt: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null))
  for (const e of entries) {
    for (const [i, [r, c]] of entryCells(e).entries()) {
      if (r >= size || c >= size) {
        errs.push(`${e.id} out of bounds`)
        continue
      }
      if (grid[r][c] !== e.answer[i]) errs.push(`${e.id} mismatch at ${r},${c}`)
      if (rebuilt[r][c] !== null && rebuilt[r][c] !== e.answer[i]) errs.push(`conflict at ${r},${c}`)
      rebuilt[r][c] = e.answer[i]
    }
  }
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (grid[r][c] !== rebuilt[r][c]) errs.push(`stray cell ${r},${c}`)
  // Every maximal run of ≥2 filled cells must be an entry.
  const key = (r: number, c: number, d: Dir, len: number) => `${r},${c},${d},${len}`
  const entryKeys = new Set(entries.map((e) => key(e.row, e.col, e.dir, e.answer.length)))
  const runs = new Set<string>()
  for (const d of ['across', 'down'] as Dir[]) {
    for (let a = 0; a < size; a++) {
      let start = -1
      for (let b = 0; b <= size; b++) {
        const r = d === 'across' ? a : b
        const c = d === 'across' ? b : a
        const filled = b < size && grid[r][c] !== null
        if (filled && start < 0) start = b
        if (!filled && start >= 0) {
          const len = b - start
          if (len >= 2) {
            const k = d === 'across' ? key(a, start, d, len) : key(start, a, d, len)
            runs.add(k)
            if (!entryKeys.has(k)) errs.push(`unclued run ${k}`)
          }
          start = -1
        }
      }
    }
  }
  for (const k of entryKeys) if (!runs.has(k)) errs.push(`entry ${k} is not a maximal run`)
  // Connectivity.
  const filled: [number, number][] = []
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (grid[r][c] !== null) filled.push([r, c])
  if (filled.length) {
    const seen = new Set<string>([filled[0].join()])
    const stack = [filled[0]]
    while (stack.length) {
      const [r, c] = stack.pop()!
      for (const [nr, nc] of [
        [r + 1, c],
        [r - 1, c],
        [r, c + 1],
        [r, c - 1],
      ]) {
        if (nr < 0 || nc < 0 || nr >= size || nc >= size || grid[nr][nc] === null || seen.has(`${nr},${nc}`)) continue
        seen.add(`${nr},${nc}`)
        stack.push([nr, nc])
      }
    }
    if (seen.size !== filled.length) errs.push('grid not connected')
  }
  return errs
}

/** Bounding box of filled cells (for cropping the rendered grid). */
export function bounds(cw: Crossword): { r0: number; c0: number; r1: number; c1: number } {
  let r0 = cw.size, c0 = cw.size, r1 = -1, c1 = -1
  cw.grid.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v === null) return
      r0 = Math.min(r0, r)
      c0 = Math.min(c0, c)
      r1 = Math.max(r1, r)
      c1 = Math.max(c1, c)
    }),
  )
  if (r1 < 0) return { r0: 0, c0: 0, r1: 0, c1: 0 }
  return { r0, c0, r1, c1 }
}

/** Scoring for one entry: 3 points, minus 1 per mistake or revealed letter. */
export function entryPoints(mistakes: number, reveals: number, fullyRevealed: boolean): number {
  if (fullyRevealed) return 0
  return Math.max(0, 3 - mistakes - reveals)
}

import { describe, expect, it } from 'vitest'
import strokesJson from '../data/strokes.json'
import { BOX, characterPoints, compareStroke, evaluateCharacter, evaluateStroke, parsePath, resample, seededScribble, type Pt } from './stroke.testutil'

const STROKES = strokesJson as Record<string, string[]>
const pts = (d: string): Pt[] => parsePath(d)
const reversed = (d: string): Pt[] => [...parsePath(d)].reverse()

describe('parsePath', () => {
  it('parses absolute and relative commands', () => {
    const line = parsePath('M10,10 L20,10 h10 v10 Z')
    expect(line[0]).toEqual({ x: 10, y: 10 })
    expect(line.at(-2)).toEqual({ x: 30, y: 20 })
    expect(line.at(-1)).toEqual({ x: 10, y: 10 })
    const curve = parsePath('M0,0c10,0,10,10,10,10s0,10,-10,10')
    expect(curve.at(-1)!.x).toBeCloseTo(0)
    expect(curve.at(-1)!.y).toBeCloseTo(20)
  })
  it('handles packed numbers like 0.5.5 and 1-2', () => {
    const p = parsePath('M1-2l0.5.5')
    expect(p).toEqual([{ x: 1, y: -2 }, { x: 1.5, y: -1.5 }])
  })
  it('parses every stroke in strokes.json inside the box', () => {
    for (const [ch, list] of Object.entries(STROKES)) {
      expect(list.length, ch).toBeGreaterThan(0)
      for (const d of list) {
        const p = parsePath(d)
        expect(p.length).toBeGreaterThan(1)
        for (const q of p) {
          expect(q.x).toBeGreaterThan(-5)
          expect(q.x).toBeLessThan(BOX + 5)
          expect(q.y).toBeGreaterThan(-5)
          expect(q.y).toBeLessThan(BOX + 5)
        }
      }
    }
  })
  it('resamples to equidistant points', () => {
    const r = resample([{ x: 0, y: 0 }, { x: 90, y: 0 }], 10)
    expect(r).toHaveLength(10)
    r.forEach((p, i) => expect(p.x).toBeCloseTo(i * 10))
  })
})

describe('strokes.json coverage', () => {
  it('has all kana and the core kanji', () => {
    expect(STROKES['あ']).toHaveLength(3)
    expect(STROKES['木']).toHaveLength(4)
    expect(STROKES['ン']).toHaveLength(2)
    for (const c of '火水木土石日月山川田人口大小中上下一二三本目手女子力林森休明男犬花空雨金') expect(STROKES[c], c).toBeDefined()
  })
})

describe('evaluateStroke', () => {
  it('reference strokes score ~100 for every character', () => {
    for (const [ch, list] of Object.entries(STROKES)) {
      list.forEach((d, i) => {
        const r = evaluateStroke(pts(d), list, i)
        expect(r.pass, `${ch} stroke ${i + 1}: ${r.message}`).toBe(true)
        expect(r.score, `${ch} stroke ${i + 1}`).toBeGreaterThanOrEqual(98)
      })
    }
  })
  it('tolerates a slightly shifted, scaled and wobbly stroke', () => {
    const list = STROKES['き']
    const wobbly = pts(list[2]).map((p, i) => ({ x: p.x * 1.08 + 3 + Math.sin(i) * 1.5, y: p.y * 0.95 + 4 }))
    expect(evaluateStroke(wobbly, list, 2).pass).toBe(true)
  })
  it('a reversed stroke fails direction', () => {
    for (const ch of ['一', '二', '三', '木', 'い', 'し', 'く', 'ノ', 'あ']) {
      const list = STROKES[ch]
      const r = evaluateStroke(reversed(list[0]), list, 0)
      expect(r.pass, ch).toBe(false)
      expect(r.verdict, ch).toBe('direction')
    }
  })
  it('flags a stroke drawn in the wrong place', () => {
    const list = STROKES['口']
    const moved = pts(list[0]).map((p) => ({ x: p.x + 45, y: p.y }))
    const r = evaluateStroke(moved, list, 0)
    expect(r.pass).toBe(false)
  })
  it('swapped strokes are flagged as wrong order', () => {
    for (const ch of ['い', '二', '十', '川', '人', 'け']) {
      const list = STROKES[ch]
      if (!list) continue
      const r = evaluateStroke(pts(list[1]), list, 0)
      expect(r.verdict, ch).toBe('order')
      expect(r.matched, ch).toBe(1)
      expect(r.message).toMatch(/order/i)
    }
  })
  it('random scribbles fail', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const ch of ['あ', '木', 'ソ']) {
        const list = STROKES[ch]
        const r = evaluateStroke(seededScribble(seed), list, 0)
        expect(r.pass, `${ch} seed ${seed}`).toBe(false)
      }
    }
  })
  it('an empty stroke is missing', () => {
    expect(evaluateStroke([], STROKES['あ'], 0).verdict).toBe('missing')
  })
  it('compareStroke reports shape failure for a tiny flick', () => {
    const d = STROKES['一'][0]
    const m = compareStroke([{ x: 50, y: 50 }, { x: 53, y: 50 }], d)
    expect(m.pass).toBe(false)
    expect(m.failure).toBe('shape')
  })
})

describe('evaluateCharacter', () => {
  it('perfect character scores ~100', () => {
    const list = STROKES['森']
    const r = evaluateCharacter(list.map(pts), list)
    expect(r.pass).toBe(true)
    expect(r.accuracy).toBeGreaterThanOrEqual(98)
    expect(r.messages).toEqual([])
  })
  it('swapped strokes are wrong order and lower the accuracy', () => {
    const list = STROKES['二']
    const r = evaluateCharacter([pts(list[1]), pts(list[0])], list)
    expect(r.pass).toBe(false)
    expect(r.strokes.map((s) => s.verdict)).toEqual(['order', 'order'])
    expect(r.accuracy).toBeLessThan(50)
  })
  it('missing and extra strokes are reported', () => {
    const list = STROKES['三']
    const missing = evaluateCharacter([pts(list[0])], list)
    expect(missing.strokes[1].verdict).toBe('missing')
    expect(missing.accuracy).toBeLessThan(40)
    const extra = evaluateCharacter([...list.map(pts), pts(list[0])], list)
    expect(extra.extra).toBe(1)
    expect(extra.pass).toBe(false)
  })
  it('scribble character fails badly', () => {
    const list = STROKES['あ']
    const r = evaluateCharacter(list.map((_, i) => seededScribble(i + 7)), list)
    expect(r.pass).toBe(false)
    expect(r.accuracy).toBeLessThan(50)
  })
})

describe('characterPoints', () => {
  it('rewards clean strokes and charges for mistakes and hints', () => {
    expect(characterPoints([100, 95, 90], 0, 0)).toBe(100)
    expect(characterPoints([100, 100], 1, 0)).toBe(80)
    expect(characterPoints([100, 100], 0, 2, 10)).toBe(80)
    expect(characterPoints([40, 40], 0, 0)).toBe(0)
    expect(characterPoints([100], 9, 9)).toBe(0)
    expect(characterPoints([], 0, 0)).toBe(0)
  })
})

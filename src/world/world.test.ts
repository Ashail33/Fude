import { describe, expect, it } from 'vitest'
import { ACTIVITIES } from '../data/regions'
import { START_POS } from '../engine/store'
import { bfs, cameraFor, chooseScale, ENCOUNTER_GRACE, entityCells, rollEncounter, World } from './engine'
import { LEGEND, parseMap, tileSolid } from './mapdef'
import { getMap, locateActivity, MAP_SPECS, REGION_MAPS } from './maps'
import { makeEntities } from './entities'
import type { Entity, GameMap, MapSpec } from './types'

const COUNTERS = new Set(['stall', 'shop-awning', 'fence', 'crate', 'barrel'])

function markerChars(spec: MapSpec): Set<string> {
  return new Set([...Object.keys(spec.points), ...spec.exits.map((e) => e.at), ...spec.entities.map((e) => e.at)])
}

/** Cells from which the player can interact with `e` (adjacent, or across a counter). */
function interactCells(m: GameMap, e: Entity): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (const c of entityCells(e))
    for (const [dx, dy] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      out.push({ x: c.x + dx, y: c.y + dy })
      const mid = m.obj[(c.y + dy) * m.w + c.x + dx]
      if (mid && COUNTERS.has(mid)) out.push({ x: c.x + 2 * dx, y: c.y + 2 * dy })
    }
  return out
}

describe('map data', () => {
  for (const spec of MAP_SPECS) {
    describe(spec.id, () => {
      const m = getMap(spec.id)!
      const markers = markerChars(spec)
      const ents = makeEntities(m)

      it('has rectangular rows with only known characters', () => {
        const w = [...spec.rows[0]].length
        spec.rows.forEach((r, y) => {
          expect([...r].length, `row ${y}`).toBe(w)
          for (const ch of r) expect(ch in LEGEND || ch in (spec.legend ?? {}) || markers.has(ch), `unknown char '${ch}' in row ${y}`).toBe(true)
        })
        for (const ch of markers) expect(ch in LEGEND && !(ch in (spec.legend ?? {})), `marker '${ch}' collides with the legend`).toBe(false)
      })

      it('places every point and entity marker exactly once', () => {
        const count = (ch: string) => spec.rows.join('').split(ch).length - 1
        for (const ch of Object.keys(spec.points)) expect(count(ch), `point ${ch}`).toBe(1)
        for (const e of spec.entities) expect(count(e.at), `entity ${e.id}`).toBe(1)
        for (const e of spec.exits) expect(count(e.at), `exit ${e.at}`).toBeGreaterThan(0)
        expect(m.points[spec.spawn], 'spawn point').toBeDefined()
        if (spec.inn) expect(m.points[spec.inn], 'inn point').toBeDefined()
      })

      it('has arrival points on open ground', () => {
        for (const [name, p] of Object.entries(m.points)) {
          expect(tileSolid(m, p.x, p.y), `${name} solid`).toBe(false)
          expect(m.exits.has(p.y * m.w + p.x), `${name} is an exit`).toBe(false)
          const blocker = ents.find((e) => e.spec.kind !== 'boss' && entityCells(e).some((c) => c.x === p.x && c.y === p.y))
          expect(blocker, `${name} covered by an entity`).toBeUndefined()
        }
      })

      it('has exits that lead to existing maps and points', () => {
        for (const ex of m.exits.values()) {
          const to = getMap(ex.to)
          expect(to, `exit to ${ex.to}`).toBeDefined()
          expect(to!.points[ex.point], `${ex.to}.${ex.point}`).toBeDefined()
        }
      })

      it('keeps entities on their own cells', () => {
        const seen = new Set<string>()
        for (const e of ents)
          for (const c of entityCells(e)) {
            const k = `${c.x},${c.y}`
            expect(seen.has(k), `${e.spec.id} overlaps at ${k}`).toBe(false)
            seen.add(k)
            expect(c.x >= 0 && c.y >= 0 && c.x < m.w && c.y < m.h).toBe(true)
            expect(m.exits.has(c.y * m.w + c.x), `${e.spec.id} on an exit`).toBe(false)
          }
      })

      it('lets the player reach every interactable and exit from the spawn', () => {
        const sp = m.points[spec.spawn]
        const blocked = (x: number, y: number) => tileSolid(m, x, y) || ents.some((e) => entityCells(e).some((c) => c.x === x && c.y === y))
        for (const e of ents) {
          const goals = new Set(interactCells(m, e).map((c) => `${c.x},${c.y}`))
          const path = bfs(m.w, m.h, sp, (x, y) => goals.has(`${x},${y}`) && !blocked(x, y), (x, y) => !blocked(x, y) && !m.exits.has(y * m.w + x))
          expect(path, `${e.spec.id} unreachable`).not.toBeNull()
        }
        // With bosses defeated (removed), every exit must be reachable.
        const noBoss = (x: number, y: number) => tileSolid(m, x, y) || ents.some((e) => e.spec.kind !== 'boss' && entityCells(e).some((c) => c.x === x && c.y === y))
        for (const ex of m.exits.values()) {
          const path = bfs(m.w, m.h, sp, (x, y) => x === ex.x && y === ex.y, (x, y) => !noBoss(x, y) && !m.exits.has(y * m.w + x))
          expect(path, `exit ${ex.to} at ${ex.x},${ex.y}`).not.toBeNull()
        }
      })
    })
  }

  it('places every activity exactly once', () => {
    for (const a of ACTIVITIES) {
      const hosts = MAP_SPECS.flatMap((s) => s.entities.filter((e) => e.activities?.includes(a.id)))
      expect(hosts.length, a.id).toBe(1)
      const loc = locateActivity(a.id)!
      expect(loc.map.spec.region, `${a.id} in its region`).toBe(a.region)
    }
    const all = MAP_SPECS.flatMap((s) => s.entities.flatMap((e) => e.activities ?? []))
    for (const id of all) expect(ACTIVITIES.some((a) => a.id === id), id).toBe(true)
  })

  it('chains the regions village ⇄ fields ⇄ forest ⇄ shrine ⇄ tower', () => {
    const reach = (from: string, to: string): boolean => {
      const seen = new Set([from])
      const q = [from]
      while (q.length) {
        const id = q.shift()!
        if (id === to) return true
        for (const ex of getMap(id)!.exits.values())
          if (!seen.has(ex.to) && (getMap(ex.to)!.spec.interior || REGION_MAPS.includes(ex.to as never))) {
            seen.add(ex.to)
            q.push(ex.to)
          }
      }
      return false
    }
    for (let i = 0; i + 1 < REGION_MAPS.length; i++) {
      const a = getMap(REGION_MAPS[i])!
      const b = getMap(REGION_MAPS[i + 1])!
      expect([...a.exits.values()].some((e) => e.to === b.id), `${a.id} → ${b.id}`).toBe(true)
      expect([...b.exits.values()].some((e) => e.to === a.id), `${b.id} → ${a.id}`).toBe(true)
      expect(b.spec.region).toBe(a.spec.region + 1)
    }
    expect(reach('village', 'tower-top')).toBe(true)
  })

  it('starts a new game on open ground', () => {
    const v = getMap(START_POS.map)!
    expect(tileSolid(v, START_POS.x, START_POS.y)).toBe(false)
  })
})

// ─── engine ──────────────────────────────────────────────────────────

const TEST_SPEC: MapSpec = {
  id: 'test',
  name: 'Test',
  jp: 'テスト',
  region: 1,
  music: 'village',
  particles: 'none',
  rows: [
    'TTTTTTTT', //
    'T......T',
    'T.TT.1.T',
    'T......T',
    'T.;;;;.T',
    'TTTT0TTT',
  ],
  points: {},
  spawn: 'x',
  exits: [{ at: '0', to: 'village', point: 'inn' }],
  entities: [{ at: '1', id: 'npc', kind: 'npc', sprite: 'elder', lines: [{ jp: 'こんにちは', en: 'Hello' }] }],
}

function testWorld(x = 1, y = 1, rng = () => 0.99) {
  const m = parseMap(TEST_SPEC)
  const events: string[] = []
  const w = new World(m, makeEntities(m), x, y, 'down', {
    onExit: (e) => events.push('exit:' + e.to),
    onInteract: (t) => events.push('talk:' + (t.entity?.spec.id ?? (t.fude ? 'fude' : 'exit'))),
    onEncounter: () => events.push('battle'),
    onBump: () => events.push('bump'),
  }, rng)
  return { m, w, events }
}

const run = (w: World, secs: number) => {
  for (let t = 0; t < secs; t += 1 / 60) w.update(1 / 60)
}

describe('movement', () => {
  it('walks one tile per step with tweening and keeps walking while held', () => {
    const { w } = testWorld()
    w.held = 'right'
    run(w, 0.15)
    expect(w.player.x).toBe(2)
    expect(w.player.t).toBeLessThan(1)
    run(w, 0.5)
    expect(w.player.x).toBeGreaterThanOrEqual(3)
    w.held = null
    run(w, 0.5)
    expect(w.player.t).toBe(1)
  })

  it('a short tap in a new direction only turns', () => {
    const { w } = testWorld()
    w.held = 'right'
    w.update(1 / 60)
    w.held = null
    run(w, 0.3)
    expect(w.player.x).toBe(1)
    expect(w.player.dir).toBe('right')
  })

  it('collides with walls and NPCs', () => {
    const { w, events } = testWorld(1, 1)
    w.held = 'up'
    run(w, 0.5)
    expect(w.player.y).toBe(1)
    expect(events).toContain('bump')
    const t = testWorld(4, 2)
    t.w.held = 'right'
    run(t.w, 0.6)
    expect(t.w.player.x).toBe(4) // NPC at (5,2)
  })

  it('companion follows one tile behind (snake)', () => {
    const { w } = testWorld(1, 1)
    w.fude.x = 1
    w.fude.y = 1
    w.held = 'right'
    run(w, 0.8)
    w.held = null
    run(w, 0.3)
    expect(Math.abs(w.fude.x - w.player.x) + Math.abs(w.fude.y - w.player.y)).toBe(1)
    expect(w.fude.x).toBe(w.player.x - 1)
  })

  it('tap-to-walk follows a BFS path around obstacles and interacts at the end', () => {
    const { w, events } = testWorld(1, 3)
    w.walkTo(5, 2) // the NPC
    run(w, 3)
    expect(events).toContain('talk:npc')
    const d = Math.abs(w.player.x - 5) + Math.abs(w.player.y - 2)
    expect(d).toBe(1)
  })

  it('stepping onto an exit fires onExit', () => {
    const { w, events } = testWorld(4, 3)
    w.walkTo(4, 5)
    run(w, 2)
    expect(events).toContain('exit:village')
  })

  it('tall grass triggers encounters only after the grace period', () => {
    expect(rollEncounter(ENCOUNTER_GRACE - 1, () => 0)).toBe(false)
    expect(rollEncounter(ENCOUNTER_GRACE, () => 0)).toBe(true)
    expect(rollEncounter(50, () => 0.5)).toBe(false)
    const { w, events } = testWorld(2, 4, () => 0)
    w.stepsSinceBattle = ENCOUNTER_GRACE
    w.held = 'right'
    run(w, 0.5)
    expect(events).toContain('battle')
  })

  it('interacting with the companion works', () => {
    const { w, events } = testWorld(3, 1)
    w.fude.x = 4
    w.fude.y = 1
    w.player.dir = 'right'
    w.interact()
    expect(events).toContain('talk:fude')
  })
})

describe('pathfinding & camera', () => {
  it('bfs finds shortest paths and reports unreachable goals', () => {
    const open = () => true
    expect(bfs(5, 5, { x: 0, y: 0 }, (x, y) => x === 2 && y === 0, open)).toEqual([
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ])
    const wall = (x: number) => x !== 2
    expect(bfs(5, 5, { x: 0, y: 0 }, (x) => x === 4, wall)).toBeNull()
  })

  it('camera centres on the player and clamps to map edges', () => {
    expect(cameraFor(0, 0, 100, 100, 400, 400)).toEqual({ x: 0, y: 0 })
    expect(cameraFor(200, 200, 100, 100, 400, 400)).toEqual({ x: 150, y: 150 })
    expect(cameraFor(400, 400, 100, 100, 400, 400)).toEqual({ x: 300, y: 300 })
    // Map smaller than view: centred.
    expect(cameraFor(10, 10, 200, 200, 100, 100)).toEqual({ x: -50, y: -50 })
  })

  it('chooses an integer scale showing ~11–15 tiles on phones and more on desktop', () => {
    for (const dpr of [1, 2, 3]) {
      const s = chooseScale(390, 844, dpr)
      const tiles = (390 * dpr) / (16 * s)
      expect(tiles).toBeGreaterThanOrEqual(10.5)
      expect(tiles).toBeLessThanOrEqual(16)
    }
    const s = chooseScale(1280, 800, 1)
    expect(1280 / (16 * s)).toBeGreaterThan(16)
  })
})

import { describe, expect, it } from 'vitest'
import { freshNinja, SWORD_BY_ID } from './data'
import { createSim, noInput, step, type Sim } from './sim'
import { buildTrial, GEMS_PER_TRIAL, settleTrial, TRIAL_COUNT, trialStage, trialUnlocked, type Level, type Solid } from './trials'

const rng = () => 0.5
/** What the hero can reach: ~200 across (jump + a bit of dash), ~190 up with a double jump. */
const REACH_X = 200
const REACH_UP = 190

/** Surfaces reachable from the start, walking and jumping between them. */
function reachable(lv: Level): Set<Solid> {
  const start = lv.solids.find((s) => lv.start.x >= s.x && lv.start.x <= s.x + s.w)!
  const seen = new Set<Solid>([start])
  const q = [start]
  while (q.length) {
    const a = q.shift()!
    for (const b of lv.solids) {
      if (seen.has(b)) continue
      const gap = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w))
      const up = b.top - a.top
      if (gap <= REACH_X && up <= REACH_UP) {
        seen.add(b)
        q.push(b)
      }
    }
  }
  return seen
}

describe('Shadow Trials levels', () => {
  it('builds 40 levels, the same every time', () => {
    expect(TRIAL_COUNT).toBe(40)
    expect(buildTrial(5)).toEqual(buildTrial(5))
  })

  it('every level can be finished, and every diamond and hostage reached', () => {
    for (let i = 0; i < TRIAL_COUNT; i++) {
      const lv = buildTrial(i)
      const ok = reachable(lv)
      const onReach = (x: number, y: number, up: number) => [...ok].some((s) => x >= s.x - 30 && x <= s.x + s.w + 30 && y - s.top <= up && y >= s.top - 5)
      expect(onReach(lv.exit, (lv.solids.find((s) => lv.exit >= s.x && lv.exit <= s.x + s.w)?.top ?? 0) + 1, 10), `trial ${i}: gate`).toBe(true)
      expect(lv.gems).toHaveLength(GEMS_PER_TRIAL)
      for (const g of lv.gems) expect(onReach(g.x, g.y, REACH_UP + 40), `trial ${i}: diamond at ${Math.round(g.x)},${Math.round(g.y)}`).toBe(true)
      for (const c of lv.cages) expect(onReach(c.x, c.y + 1, 10), `trial ${i}: cage`).toBe(true)
      expect(lv.cages.length).toBeGreaterThan(0)
      expect(lv.foes.length).toBeGreaterThan(0)
      // nothing too high to see on screen
      for (const s of lv.solids) expect(s.top).toBeLessThan(170)
    }
  })
})

function sim(i: number): Sim {
  return createSim(trialStage(i), 10, SWORD_BY_ID.katana, rng)
}

describe('Shadow Trials physics', () => {
  it('the hero stands on the ground and runs along the level', () => {
    const s = sim(0)
    const x0 = s.hero.x
    const inp = noInput()
    inp.right = true
    for (let i = 0; i < 30; i++) step(s, inp, 1 / 60)
    expect(s.hero.x).toBeGreaterThan(x0 + 80)
    expect(s.hero.y).toBe(s.hero.gy)
  })

  it('falling in a pit hurts and puts you back at the last lantern', () => {
    const s = sim(0)
    const lv = s.lv!
    // find a pit: a gap between two solids
    const sorted = [...lv.solids].filter((x) => !x.oneWay).sort((a, b) => a.x - b.x)
    let pitX = -1
    for (let i = 1; i < sorted.length; i++) if (sorted[i].x > sorted[i - 1].x + sorted[i - 1].w + 30) pitX = sorted[i - 1].x + sorted[i - 1].w + 15
    expect(pitX).toBeGreaterThan(0)
    s.hero.x = pitX
    s.hero.y = 5
    const hp = s.hero.hp
    for (let i = 0; i < 90; i++) step(s, noInput(), 1 / 60)
    expect(s.falls).toBe(1)
    expect(s.hero.hp).toBeLessThan(hp)
    expect(s.hero.x).toBe(s.checkpoint.x)
  })

  it('reaching the gate wins', () => {
    const s = sim(0)
    s.hero.x = s.lv!.exit - 5
    const inp = noInput()
    inp.right = true
    for (let i = 0; i < 20; i++) step(s, inp, 1 / 60)
    expect(s.outcome).toBe('win')
  })

  it('a foe struck from behind before it notices you is assassinated', () => {
    const s = sim(0)
    const f = s.foes[0]
    f.face = 1
    s.hero.x = f.x - 52
    s.hero.y = f.y
    s.hero.gy = f.gy
    s.hero.face = 1
    expect(f.aware).toBe(false)
    const inp = noInput()
    inp.attack = true
    for (let i = 0; i < 30; i++) step(s, i === 0 ? inp : noInput(), 1 / 60)
    expect(f.dead).toBe(true)
  })

  it('wall-jumping kicks off a wall', () => {
    const s = sim(0)
    // a wall in front of the hero
    s.lv!.solids.push({ x: s.hero.x + 30, w: 60, top: 300 })
    const inp = noInput()
    inp.right = true
    inp.jump = true
    step(s, inp, 1 / 60)
    const hold = noInput()
    hold.right = true
    for (let i = 0; i < 20; i++) step(s, hold, 1 / 60)
    expect(s.hero.wall).toBe(1)
    const kick = noInput()
    kick.right = true
    kick.jump = true
    step(s, kick, 1 / 60)
    expect(s.hero.vx).toBeLessThan(0)
    expect(s.hero.vy).toBeGreaterThan(300)
  })

  it('cages free hostages and diamonds count', () => {
    const s = sim(0)
    const cage = s.props.find((p) => p.kind === 'cage')!
    s.hero.x = cage.x - 30
    s.hero.y = cage.y
    s.hero.gy = cage.y
    s.hero.face = 1
    s.foes = []
    for (let n = 0; n < 2; n++) {
      const inp = noInput()
      inp.attack = true
      for (let i = 0; i < 40; i++) step(s, i === 0 ? inp : noInput(), 1 / 60)
    }
    expect(s.saved).toBe(1)
    const gem = s.drops.find((d) => d.kind === 'gem')!
    s.hero.x = gem.x
    s.hero.y = gem.y - 30
    for (let i = 0; i < 30; i++) step(s, noInput(), 1 / 60)
    expect(s.gems).toBe(1)
  })
})

describe('Shadow Trials progress', () => {
  it('clearing opens the next trial and keeps the best diamonds', () => {
    let save = freshNinja()
    expect(trialUnlocked(save, 0)).toBe(true)
    expect(trialUnlocked(save, 1)).toBe(false)
    save = settleTrial(save, 0, true, 50, 20, 2, 1).save
    expect(save.trials).toBe(1)
    expect(trialUnlocked(save, 1)).toBe(true)
    save = settleTrial(save, 0, true, 0, 0, 1, 0).save
    expect(save.trialGems?.[0]).toBe(2)
    expect(save.trials).toBe(1)
  })
})

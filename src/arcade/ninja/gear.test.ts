import { describe, expect, it } from 'vitest'
import {
  ARMOR_BY_ID,
  artFree,
  artsOf,
  BOSS_DROPS,
  canBuy,
  canBuyArmor,
  canLearn,
  CHESTS,
  FOES,
  freshNinja,
  learnArt,
  resetArts,
  settleStage,
  stageAt,
  stageUnlocked,
  STAGE_COUNT,
  SWORD_BY_ID,
  WORLDS,
  type NinjaSave,
} from './data'
import { ARENA, createSim, FOE_MOVES, hit, MAX_STARS, noInput, step } from './sim'
import { CACHES } from '../../story/tales/ninjaCaches'
import { getMap } from '../../world/maps'
import { tileSolid } from '../../world/mapdef'

const rng = () => 0.5

describe('more stick ninja', () => {
  it('ten worlds, then endless Abyss floors with a boss every fifth', () => {
    expect(WORLDS).toHaveLength(10)
    for (const w of WORLDS) expect(FOES[w.boss].boss).toBe(true)
    for (const d of Object.values(FOES)) for (const [id] of d.moves) expect(FOE_MOVES[id], id).toBeTruthy()
    for (let f = 0; f < 30; f++) {
      const st = stageAt(STAGE_COUNT + f)
      expect(st.abyss).toBe(f)
      expect(Boolean(st.boss)).toBe(f % 5 === 4)
      for (const w of st.waves) expect(w.length).toBeGreaterThan(0)
    }
    expect(stageAt(STAGE_COUNT + 9).power).toBeGreaterThan(stageAt(STAGE_COUNT - 1).power)
  })

  it('stages get twists; each world hides a chest in stage 3', () => {
    const mods = new Set<string>()
    for (let i = 0; i < STAGE_COUNT; i++) {
      const st = stageAt(i)
      if (st.mod) mods.add(st.mod)
      expect(Boolean(st.chest)).toBe(st.n === 3)
      if (st.elites) for (let w = 0; w < st.waves.length; w++) for (const e of st.elites[w] ?? []) expect(e).toBeLessThan(st.waves[w].length)
    }
    expect(mods.size).toBe(5)
    expect(new Set(CHESTS).size).toBe(CHESTS.length)
  })

  it('the Abyss opens after the Dragon Shōgun', () => {
    const s = { ...freshNinja(), cleared: 24 }
    expect(stageUnlocked(s, STAGE_COUNT)).toBe(false)
    expect(stageUnlocked({ ...s, cleared: 25 }, STAGE_COUNT)).toBe(true)
    expect(stageUnlocked({ ...s, cleared: 25 }, STAGE_COUNT + 1)).toBe(false)
    const r = settleStage({ ...s, cleared: 25 }, stageAt(STAGE_COUNT), true, 0, 0)
    expect(r.save.abyss).toBe(1)
    expect(r.save.cleared).toBe(25)
  })

  it('a stage chest breaks open into its gear, which the fight keeps', () => {
    const st = stageAt(2)
    const s = createSim(st, 5, SWORD_BY_ID.katana, rng)
    const chest = s.props.find((p) => p.kind === 'chest')!
    expect(chest.gear).toBe(CHESTS[0])
    // walk over and hit it three times
    s.foes = []
    s.hero.x = chest.x - 30 * Math.sign(chest.x - ARENA / 2) * -1
    s.hero.face = chest.x > s.hero.x ? 1 : -1
    for (let n = 0; n < 3; n++) {
      const inp = noInput()
      inp.attack = true
      for (let i = 0; i < 40; i++) step(s, i === 0 ? inp : noInput(), 1 / 60)
    }
    expect(chest.broken).toBe(true)
    for (let i = 0; i < 300 && !s.found.length; i++) {
      const g = s.drops.find((d) => d.kind === 'gear')
      const inp = noInput()
      if (g) inp[g.x > s.hero.x ? 'right' : 'left'] = true
      step(s, inp, 1 / 60)
    }
    expect(s.found).toEqual([CHESTS[0]])
    const r = settleStage(freshNinja(), st, false, 0, 0, s.found)
    expect(r.found).toEqual([CHESTS[0]])
    expect(r.save.owned).toContain(CHESTS[0])
    // owned gear is never offered again
    expect(createSim(st, 5, SWORD_BY_ID.katana, rng, { have: [CHESTS[0]] }).props.some((p) => p.kind === 'chest')).toBe(false)
  })

  it('found gear cannot be bought', () => {
    const rich: NinjaSave = { ...freshNinja(), level: 50, ryo: 1e6 }
    expect(canBuy(rich, 'masamune')).toBe('found')
    expect(canBuyArmor(rich, 'dragon-armour')).toBe('found')
    expect(canBuyArmor(rich, 'kusari')).toBe('ok')
    expect(BOSS_DROPS[9]).toBe('masamune')
  })

  it('armour cuts the damage you take', () => {
    const plain = createSim(stageAt(0), 5, SWORD_BY_ID.katana, rng)
    const armed = createSim(stageAt(0), 5, SWORD_BY_ID.katana, rng, { armor: ARMOR_BY_ID['dragon-armour'] })
    expect(armed.hero.maxHp).toBe(plain.hero.maxHp + 50)
    hit(plain, null, plain.hero, 50, { kb: 0 })
    hit(armed, null, armed.hero, 50, { kb: 0 })
    expect(plain.hero.maxHp - plain.hero.hp).toBe(50)
    expect(armed.hero.maxHp - armed.hero.hp).toBe(35)
  })

  it('Ink Arts: points from levels and scrolls, ranks, elements, and a free reset', () => {
    let s: NinjaSave = { ...freshNinja(), level: 9, scrolls: 2 }
    expect(artFree(s)).toBe(6)
    expect(canLearn(s, 'tech:dashcut')).toBe('needs')
    s = learnArt(s, 'el:frost')!
    expect(s.element).toBe('frost')
    for (let i = 0; i < 3; i++) s = learnArt(s, 'up:power')!
    expect(canLearn(s, 'up:power')).toBe('max')
    expect(artFree(s)).toBe(1)
    expect(canLearn(s, 'el:fire')).toBe('points')
    s = resetArts(s)
    expect(artFree(s)).toBe(6)
    expect(s.element).toBeUndefined()
  })

  it('a frost-infused special freezes and chills; Might makes it hit harder', () => {
    let save: NinjaSave = { ...freshNinja(), level: 20 }
    save = learnArt(save, 'el:frost')!
    const s = createSim(stageAt(0), 20, SWORD_BY_ID.katana, rng, { arts: artsOf(save) })
    const foe = s.foes[0]
    foe.hp = foe.maxHp = 1e5
    hit(s, s.hero, foe, 100, { kb: 0, sp: true })
    expect(foe.chillT).toBeGreaterThan(0)
    expect(foe.stunT).toBeGreaterThan(1)
    save = learnArt(learnArt(save, 'up:power')!, 'up:power')!
    const s2 = createSim(stageAt(0), 20, SWORD_BY_ID.katana, rng, { arts: artsOf(save) })
    const f2 = s2.foes[0]
    f2.hp = f2.maxHp = 1e5
    hit(s2, s2.hero, f2, 100, { kb: 0, sp: true })
    expect(f2.maxHp - f2.hp).toBe(130)
  })

  it('opening surge fills the meter at the start', () => {
    let save: NinjaSave = { ...freshNinja(), level: 20 }
    for (let i = 0; i < 2; i++) save = learnArt(save, 'up:surge')!
    expect(createSim(stageAt(0), 20, SWORD_BY_ID.katana, rng, { arts: artsOf(save) }).meter).toBe(30)
  })
})

describe('secret caches on the journey', () => {
  it('sit on reachable floor, out of the way, each with distinct loot', () => {
    const ids = new Set<string>()
    for (const c of CACHES) {
      const m = getMap(c.map)!
      expect(m, c.map).toBeTruthy()
      expect(tileSolid(m, c.x, c.y), c.id).toBe(false)
      expect(m.entitySpecs.filter((e) => e.x === c.x && e.y === c.y), c.id).toHaveLength(1)
      // reachable from the map's spawn point
      const sp = m.points[m.spec.spawn]
      const seen = new Set([sp.y * m.w + sp.x])
      const q = [[sp.x, sp.y]]
      const occ = new Set(m.entitySpecs.filter((e) => e.id !== c.id).map((e) => e.y * m.w + e.x))
      let found = false
      while (q.length && !found) {
        const [x, y] = q.shift()!
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx
          const ny = y + dy
          if (nx === c.x && ny === c.y) found = true
          const i = ny * m.w + nx
          if (seen.has(i) || tileSolid(m, nx, ny) || occ.has(i)) continue
          seen.add(i)
          q.push([nx, ny])
        }
      }
      expect(found, c.id).toBe(true)
      ids.add(c.id)
    }
    expect(ids.size).toBe(CACHES.length)
    const gear = CACHES.flatMap((c) => ('gear' in c.loot ? [c.loot.gear] : []))
    expect(new Set(gear).size).toBe(gear.length)
    for (const g of gear) expect(CHESTS.includes(g) || BOSS_DROPS.includes(g)).toBe(false)
  })
})

describe('guarding', () => {
  it('raising the guard turns toward the nearest foe, so a hit from behind is blocked', () => {
    const s = createSim(stageAt(0), 5, SWORD_BY_ID.katana, rng)
    const h = s.hero
    s.foes = s.foes.slice(0, 1)
    const foe = s.foes[0]
    foe.x = h.x - 40
    h.face = 1 // facing away
    const inp = noInput()
    inp.block = true
    step(s, inp, 1 / 60)
    expect(h.blockT).toBeGreaterThanOrEqual(0)
    expect(h.face).toBe(-1)
    // let the parry window pass, then take a hit: blocked (chip damage only)
    for (let i = 0; i < 20; i++) step(s, inp, 1 / 60)
    const before = h.hp
    hit(s, foe, h, 40, { kb: 100 })
    expect(before - h.hp).toBeLessThan(10)
  })

  it('left/right while guarding turns without moving; letting go drops the guard', () => {
    const s = createSim(stageAt(0), 5, SWORD_BY_ID.katana, rng)
    const h = s.hero
    const x = h.x
    const inp = noInput()
    inp.block = true
    inp.right = true
    for (let i = 0; i < 10; i++) step(s, inp, 1 / 60)
    expect(h.face).toBe(1)
    expect(Math.abs(h.x - x)).toBeLessThan(2)
    step(s, noInput(), 1 / 60)
    expect(h.blockT).toBe(-1)
  })

  it('holding down crouches (it no longer guards); crouched you cannot walk', () => {
    const s = createSim(stageAt(0), 5, SWORD_BY_ID.katana, rng)
    const x = s.hero.x
    const inp = noInput()
    inp.down = true
    inp.right = true
    for (let i = 0; i < 10; i++) step(s, inp, 1 / 60)
    expect(s.hero.crouch).toBe(true)
    expect(s.hero.blockT).toBe(-1)
    expect(Math.abs(s.hero.x - x)).toBeLessThan(2)
    step(s, noInput(), 1 / 60)
    expect(s.hero.crouch).toBe(false)
  })
})

describe('shuriken and crouching', () => {
  it('throws a shuriken from the hand (six, and they come back)', () => {
    const s = createSim(stageAt(0), 5, SWORD_BY_ID.katana, rng)
    expect(s.stars).toBe(MAX_STARS)
    const inp = noInput()
    inp.throw = true
    step(s, inp, 1 / 60)
    for (let i = 0; i < 6; i++) step(s, noInput(), 1 / 60)
    expect(s.stars).toBe(MAX_STARS - 1)
    expect(s.shots.some((sh) => sh.team === 0 && sh.kind === 'star')).toBe(true)
    for (let i = 0; i < 120; i++) step(s, noInput(), 1 / 60)
    expect(s.stars).toBe(MAX_STARS)
  })

  it('no shuriken left: nothing is thrown', () => {
    const s = createSim(stageAt(0), 5, SWORD_BY_ID.katana, rng)
    s.stars = 0
    const inp = noInput()
    inp.throw = true
    step(s, inp, 1 / 60)
    expect(s.shots.filter((sh) => sh.team === 0)).toHaveLength(0)
  })

  it('a crouching hero ducks under a thrown star that would hit him standing', () => {
    const run = (crouch: boolean) => {
      const s = createSim(stageAt(0), 5, SWORD_BY_ID.katana, rng)
      s.foes = s.foes.slice(0, 1)
      const foe = s.foes[0]
      foe.x = s.hero.x + 200
      foe.face = -1
      foe.cd = 99
      s.shots.push({ kind: 'star', team: 1, x: foe.x - 20, y: 36, vx: -430, vy: 0, r: 7, dmg: 20, life: 2, age: 0, pierce: false, hit: [], kb: 90 })
      const hp = s.hero.hp
      const inp = noInput()
      inp.down = crouch
      for (let i = 0; i < 60; i++) step(s, inp, 1 / 60)
      return hp - s.hero.hp
    }
    expect(run(false)).toBeGreaterThan(0)
    expect(run(true)).toBe(0)
  })

  it('crouch + attack is a low sweep that trips', () => {
    const s = createSim(stageAt(0), 5, SWORD_BY_ID.katana, rng)
    const inp = noInput()
    inp.down = true
    inp.attack = true
    step(s, inp, 1 / 60)
    expect(s.hero.move?.id).toBe('sweep')
  })
})

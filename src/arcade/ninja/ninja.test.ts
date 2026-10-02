import { describe, expect, it } from 'vitest'
import { buySword, canBuy, freshNinja, settleStage, stageAt, STAGE_COUNT, SWORD_BY_ID, SWORDS, xpToNext, type NinjaSave } from './data'
import { ARENA, createSim, FOE_MOVES, noInput, step, type Input, type Sim } from './sim'

function rng(seed: number) {
  let a = seed
  return () => {
    a = (a * 1103515245 + 12345) % 2147483648
    return a / 2147483648
  }
}

/** A middling player: walks in, swings, blocks some telegraphed attacks, jumps shockwaves. */
function bot(s: Sim, r: () => number, skill: number): Input {
  const inp = noInput()
  const h = s.hero
  const foes = s.foes.filter((f) => !f.dead)
  if (!foes.length) return inp
  const near = foes.reduce((a, b) => (Math.abs(b.x - h.x) < Math.abs(a.x - h.x) ? b : a))
  const dx = near.x - h.x
  const dist = Math.abs(dx)
  const threat = foes.find((f) => f.move && f.moveT < f.move.windup && Math.abs(f.x - h.x) < f.move.reach * f.scale + 40)
  const wave = s.shots.find((sh) => sh.team === 1 && (sh.kind === 'shock' || sh.kind === 'flame') && Math.abs(sh.x - h.x) < 70 && Math.sign(h.x - sh.x) === Math.sign(sh.vx))
  if (s.meter >= 100) inp.special = true
  if (wave && r() < skill) inp.jump = true
  else if (threat && r() < skill * 0.5) inp.block = true
  else if (dist > s.sword.reach * 0.8 || near.y > 60) {
    if (dx > 0) inp.right = true
    else inp.left = true
    if (near.y > 60 && dist < 60 && r() < 0.1) inp.jump = true
    if (near.y > 60 && h.y > 40) inp.attack = true
  } else {
    if (Math.sign(dx) !== h.face) {
      if (dx > 0) inp.right = true
      else inp.left = true
    }
    if (r() < 0.5) inp.attack = true
  }
  return inp
}

function play(save: NinjaSave, index: number, seed: number, skill = 0.6) {
  const r = rng(seed)
  const s = createSim(stageAt(index), save.level, SWORD_BY_ID[save.sword], rng(seed + 7))
  let t = 0
  while (!s.outcome && t < 240) {
    step(s, bot(s, r, skill), 1 / 60)
    t += 1 / 60
  }
  return { s, t, won: s.outcome === 'win' }
}

describe('stick ninja data', () => {
  it('builds 25 stages, a boss closing each world', () => {
    expect(STAGE_COUNT).toBe(25)
    for (let i = 0; i < STAGE_COUNT; i++) {
      const st = stageAt(i)
      expect(st.waves.length).toBeGreaterThanOrEqual(2)
      for (const w of st.waves) expect(w.length).toBeGreaterThan(0)
      expect(Boolean(st.boss)).toBe(st.n === 5)
    }
    expect(stageAt(3)).toEqual(stageAt(3))
  })
  it('every foe move exists', async () => {
    const { FOES } = await import('./data')
    for (const d of Object.values(FOES)) for (const [id] of d.moves) expect(FOE_MOVES[id], id).toBeTruthy()
  })
  it('levels up, banks ryō and opens the next stage', () => {
    const save = freshNinja()
    const r = settleStage(save, stageAt(0), true, xpToNext(1) + 5, 30)
    expect(r.save.level).toBe(2)
    expect(r.levelsGained).toBe(1)
    expect(r.save.cleared).toBe(1)
    expect(r.shards).toBeGreaterThan(0)
    const again = settleStage(r.save, stageAt(0), true, 0, 0)
    expect(again.firstClear).toBe(false)
    expect(again.save.cleared).toBe(1)
    const lost = settleStage(save, stageAt(0), false, 10, 30)
    expect(lost.save.ryo).toBe(15)
    expect(lost.save.cleared).toBe(0)
  })
  it('sells swords for ryō once the level allows', () => {
    const save = { ...freshNinja(), ryo: 1000, level: 2 }
    expect(canBuy(save, 'kodachi')).toBe('level')
    expect(canBuy(save, 'bokken')).toBe('owned')
    const after = buySword(save, 'katana')!
    expect(after.ryo).toBe(1000 - SWORD_BY_ID.katana.cost)
    expect(after.sword).toBe('katana')
    expect(buySword({ ...save, ryo: 10 }, 'katana')).toBeNull()
  })
})

describe('stick ninja fight', () => {
  it('a swing hits the foe in front, not the one behind', () => {
    const s = createSim(stageAt(0), 1, SWORD_BY_ID.katana, rng(1))
    s.foes = []
    const { spawnFoe } = { spawnFoe: (k: 'bandit', x: number) => import('./sim').then((m) => m.spawnFoe(s, k, x)) }
    return Promise.all([spawnFoe('bandit', s.hero.x + 40), spawnFoe('bandit', s.hero.x - 40)]).then(([front, back]) => {
      front.cd = back.cd = 99
      s.hero.face = 1
      const inp = { ...noInput(), attack: true }
      for (let i = 0; i < 30; i++) step(s, i === 0 ? inp : noInput(), 1 / 60)
      expect(front.hp).toBeLessThan(front.maxHp)
      expect(back.hp).toBe(back.maxHp)
    })
  })
  it('blocking takes far less damage, and a timely guard parries', async () => {
    const { spawnFoe } = await import('./sim')
    const take = (blockFrom: number | null) => {
      const s = createSim(stageAt(0), 1, SWORD_BY_ID.bokken, rng(2))
      s.foes = []
      const f = spawnFoe(s, 'bandit', s.hero.x + 40)
      f.cd = 99
      s.hero.face = 1
      f.move = FOE_MOVES.slash
      f.moveT = 0
      let t = 0
      for (let i = 0; i < 60; i++) {
        t += 1 / 60
        step(s, { ...noInput(), block: blockFrom !== null && t >= blockFrom }, 1 / 60)
      }
      return { lost: s.hero.maxHp - s.hero.hp, stunned: f.stunT > 0 || f.move === null }
    }
    const open = take(null)
    const guarded = take(0)
    const parried = take(FOE_MOVES.slash.windup - 0.08)
    expect(open.lost).toBeGreaterThan(4)
    expect(guarded.lost).toBeLessThan(open.lost / 3)
    expect(parried.lost).toBe(0)
  })
  it('stays inside the arena', () => {
    const s = createSim(stageAt(0), 1, SWORD_BY_ID.bokken, rng(3))
    for (let i = 0; i < 300; i++) step(s, { ...noInput(), right: true, dash: i % 20 === 0 }, 1 / 60)
    expect(s.hero.x).toBeLessThanOrEqual(ARENA)
  })
  it('an idle hero is eventually beaten', () => {
    const s = createSim(stageAt(2), 1, SWORD_BY_ID.bokken, rng(4))
    for (let i = 0; i < 60 * 120 && !s.outcome; i++) step(s, noInput(), 1 / 60)
    expect(s.outcome).toBe('lose')
  })
})

describe('stick ninja campaign (simulated player)', () => {
  it('a middling player can finish the campaign by levelling and buying swords, without it being a walkover', () => {
    let save = freshNinja()
    let attempts = 0
    let losses = 0
    const log: string[] = []
    for (let i = 0; i < STAGE_COUNT; ) {
      attempts++
      expect(attempts, log.join('\n')).toBeLessThan(140)
      const { s, won } = play(save, i, attempts * 31)
      if (!won) losses++
      save = settleStage(save, stageAt(i), won, s.xp, s.ryo).save
      // Spend on the best sword in reach.
      for (const sw of [...SWORDS].reverse()) {
        if (canBuy(save, sw.id) === 'ok' && sw.cost > SWORD_BY_ID[save.sword].cost) {
          save = buySword(save, sw.id)!
          break
        }
      }
      log.push(`${i} ${won ? 'W' : 'L'} lv${save.level} ${save.sword} ryo${save.ryo} hp${Math.round(s.hero.hp)}`)
      if (won) i++
    }
    console.log(log.filter((l) => / L /.test(l) || /^(4|9|14|19|24) /.test(l)).join('\n'), `\nattempts ${attempts} losses ${losses} level ${save.level}`)
    expect(save.cleared).toBe(STAGE_COUNT)
    expect(losses).toBeGreaterThan(0)
  })
})

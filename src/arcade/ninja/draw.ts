/**
 * Drawing for Stick Ninja: ink-brush stick figures with procedural poses,
 * sword trails, a parallax backdrop per world, projectiles, particles and
 * the fight HUD. All in a 480×270 logical view, scaled to the canvas.
 */
import { FOES, WORLDS, type FoeKind, type Weapon } from './data'
import { ARENA, type Fighter, type Move, type Shot, type Sim, type Swing } from './sim'

export const VW = 480
export const VH = 270
const GY = 232
/** The logical width in use: wider on landscape screens, narrower (closer in) on portrait ones. */
let vw = VW

type Pt = [number, number]

interface Theme {
  sky: [string, string]
  far: string
  mid: string
  ground: string
  edge: string
  deco: 'bamboo' | 'torii' | 'pines' | 'castle' | 'pagoda'
  moon?: string
  motes?: string
}

const THEMES: Theme[] = [
  { sky: ['#bfe3c8', '#f6eccb'], far: '#8fb89a', mid: '#3f6e4c', ground: '#5a4632', edge: '#2e5d3f', deco: 'bamboo', motes: '#e9f5d0' },
  { sky: ['#3a1c2e', '#e0703f'], far: '#6b2f2a', mid: '#2d1616', ground: '#3b2a22', edge: '#1e0f0d', deco: 'torii', moon: '#ffb98a', motes: '#ff9d6b' },
  { sky: ['#86c2e6', '#eef7fb'], far: '#a8bfcf', mid: '#5d7a8c', ground: '#6e6a66', edge: '#3f4a52', deco: 'pines', motes: '#ffffff' },
  { sky: ['#0d0a22', '#3f2c6b'], far: '#291d47', mid: '#130d25', ground: '#1f1a33', edge: '#0b0816', deco: 'castle', moon: '#f4ecff', motes: '#b79cff' },
  { sky: ['#2a0e08', '#ff8c42'], far: '#6a2a16', mid: '#2a110a', ground: '#3c1f14', edge: '#1a0a05', deco: 'pagoda', moon: '#ffd27a', motes: '#ffb04d' },
]

function seeded(seed: number) {
  let a = seed * 7919 + 13
  return () => {
    a = (a * 16807) % 2147483647
    return a / 2147483647
  }
}

// ─── Backdrop ──────────────────────────────────────────────────────────

const ridgeCache = new Map<number, number[]>()
function ridge(world: number, n: number, lo: number, hi: number, salt: number) {
  const key = world * 100 + salt
  if (!ridgeCache.has(key)) {
    const r = seeded(key + 1)
    const pts: number[] = []
    let h = (lo + hi) / 2
    for (let i = 0; i <= n; i++) {
      h = Math.max(lo, Math.min(hi, h + (r() - 0.5) * (hi - lo) * 0.7))
      pts.push(h)
    }
    ridgeCache.set(key, pts)
  }
  return ridgeCache.get(key)!
}

function backdrop(ctx: CanvasRenderingContext2D, world: number, cam: number, t: number) {
  const th = THEMES[world]
  const g = ctx.createLinearGradient(0, 0, 0, GY)
  g.addColorStop(0, th.sky[0])
  g.addColorStop(1, th.sky[1])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, vw, VH)
  if (th.moon) {
    ctx.fillStyle = th.moon
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.arc(360 - cam * 0.05, 58, 26, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }
  if (world === 2) {
    // drifting clouds
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    for (let i = 0; i < 6; i++) {
      const x = ((i * 170 + t * 8 - cam * 0.15) % 700) - 80
      const y = 40 + (i % 3) * 22
      ctx.beginPath()
      ctx.ellipse(x, y, 44, 12, 0, 0, Math.PI * 2)
      ctx.ellipse(x + 26, y - 6, 26, 12, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  // Far mountains (slow parallax).
  const far = ridge(world, 24, 120, 175, 1)
  ctx.fillStyle = th.far
  ctx.beginPath()
  ctx.moveTo(0, GY)
  far.forEach((h, i) => ctx.lineTo(i * 40 - cam * 0.25, h))
  ctx.lineTo(vw, GY)
  ctx.fill()
  // Mid layer silhouettes.
  const pm = cam * 0.55
  ctx.fillStyle = th.mid
  ctx.strokeStyle = th.mid
  const r = seeded(world + 50)
  if (th.deco === 'bamboo') {
    for (let i = 0; i < 46; i++) {
      const x = i * 26 + r() * 14 - pm
      if (x < -20 || x > vw + 20) continue
      const w = 4 + r() * 4
      ctx.fillRect(x, 40 + r() * 40, w, GY)
      for (let k = 0; k < 6; k++) ctx.fillRect(x - 1, 70 + k * 28 + r() * 6, w + 2, 2)
      ctx.beginPath()
      ctx.ellipse(x + 10, 60 + r() * 50, 12, 3, -0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (th.deco === 'pines') {
    for (let i = 0; i < 30; i++) {
      const x = i * 40 + r() * 20 - pm
      const h = 50 + r() * 50
      ctx.beginPath()
      ctx.moveTo(x, GY - h - 30)
      ctx.lineTo(x - 18, GY - 20)
      ctx.lineTo(x + 18, GY - 20)
      ctx.fill()
      ctx.fillRect(x - 2, GY - 22, 4, 22)
    }
  } else {
    const n = th.deco === 'torii' ? 5 : 4
    for (let i = 0; i < n; i++) {
      const x = 80 + i * 230 - pm
      if (x < -120 || x > vw + 120) continue
      if (th.deco === 'torii') {
        ctx.fillRect(x - 30, GY - 90, 7, 90)
        ctx.fillRect(x + 23, GY - 90, 7, 90)
        ctx.fillRect(x - 44, GY - 98, 88, 8)
        ctx.fillRect(x - 36, GY - 80, 72, 5)
      } else if (th.deco === 'castle') {
        for (let k = 0; k < 4; k++) {
          const w = 90 - k * 18
          const y = GY - 40 - k * 32
          ctx.fillRect(x - w / 2 + 8, y, w - 16, 32)
          ctx.beginPath()
          ctx.moveTo(x - w / 2 - 6, y + 4)
          ctx.quadraticCurveTo(x, y - 18, x + w / 2 + 6, y + 4)
          ctx.fill()
        }
        ctx.fillStyle = 'rgba(255,214,120,0.6)'
        for (let k = 0; k < 4; k++) ctx.fillRect(x - 12 + (k % 2) * 18, GY - 30 - Math.floor(k / 2) * 34, 5, 7)
        ctx.fillStyle = th.mid
      } else {
        for (let k = 0; k < 5; k++) {
          const w = 70 - k * 11
          const y = GY - 30 - k * 26
          ctx.fillRect(x - w / 2 + 10, y, w - 20, 26)
          ctx.beginPath()
          ctx.moveTo(x - w / 2 - 8, y + 6)
          ctx.lineTo(x, y - 8)
          ctx.lineTo(x + w / 2 + 8, y + 6)
          ctx.fill()
        }
        ctx.fillRect(x - 1, GY - 175, 2, 30)
      }
    }
  }
  // Ground.
  ctx.fillStyle = th.ground
  ctx.fillRect(0, GY, vw, VH - GY)
  ctx.fillStyle = th.edge
  ctx.fillRect(0, GY, vw, 3)
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  for (let i = 0; i < 40; i++) {
    const x = ((i * 53) % ARENA) - cam
    if (x > -10 && x < vw) ctx.fillRect(x, GY + 8 + ((i * 7) % 26), 14 + (i % 3) * 6, 2)
  }
  // Floating motes.
  if (th.motes) {
    ctx.fillStyle = th.motes
    for (let i = 0; i < 18; i++) {
      const x = (((i * 97 + t * (10 + (i % 5) * 4)) % (vw + 40)) + vw + 40 - cam * 0.8 * ((i % 3) * 0.1)) % (vw + 40) - 20
      const y = (i * 37 + Math.sin(t + i) * 12) % GY
      ctx.globalAlpha = 0.35 + 0.3 * Math.sin(t * 2 + i)
      ctx.fillRect(x, y, 2, 2)
    }
    ctx.globalAlpha = 1
  }
}

// ─── Poses ─────────────────────────────────────────────────────────────

const REST: [number, number] = [-0.85, 0.55]
const KEYS: Record<Swing, { wind: [number, number]; end: [number, number] }> = {
  slash: { wind: [2.3, 2.7], end: [-0.7, -0.5] },
  up: { wind: [-1.4, -2.5], end: [1.7, 1.5] },
  thrust: { wind: [-0.15, 0], end: [0, 0] },
  slam: { wind: [2.1, 1.9], end: [-1.0, -1.3] },
  spin: { wind: [0.3, 0.3], end: [0.3, 0.3] },
  throw: { wind: [2.4, 2.4], end: [0, 0.1] },
  cast: { wind: [1.35, 1.5], end: [1.35, 1.5] },
}
const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const easeOut = (u: number) => 1 - (1 - u) * (1 - u)
const easeIn = (u: number) => u * u

interface Pose {
  phi: number
  psi: number
  ext: number
  lean: number
  /** 0..1 how much the move is in its live window (for trails). */
  live: boolean
  spinning: boolean
}

function movePose(m: Move, t: number): Pose {
  const k = KEYS[m.swing]
  const w = m.windup
  const a = m.active
  let phi: number
  let psi: number
  let ext = 1
  let lean = 0
  let live = false
  if (m.swing === 'spin') {
    const u = Math.min(1, Math.max(0, (t - w) / a))
    const ang = 0.3 + u * Math.PI * 4
    return { phi: ang, psi: ang, ext: 1.1, lean: 0.1, live: t >= w && t < w + a, spinning: true }
  }
  if (t < w) {
    const u = easeIn(t / w)
    phi = lerp(REST[0], k.wind[0], u)
    psi = lerp(REST[1], k.wind[1], u)
    if (m.swing === 'thrust') ext = lerp(1, 0.55, u)
    lean = -0.12 * u
  } else if (t < w + a) {
    const u = easeOut((t - w) / a)
    phi = lerp(k.wind[0], k.end[0], u)
    psi = lerp(k.wind[1], k.end[1], u)
    if (m.swing === 'thrust') ext = lerp(0.55, 1.3, u)
    lean = 0.22
    live = true
  } else {
    const u = Math.min(1, (t - w - a) / Math.max(0.01, m.recover))
    phi = lerp(k.end[0], REST[0], easeIn(u))
    psi = lerp(k.end[1], REST[1], easeIn(u))
    if (m.swing === 'thrust') ext = lerp(1.3, 1, u)
    lean = lerp(0.22, 0, u)
  }
  return { phi, psi, ext, lean, live, spinning: false }
}

function poseOf(f: Fighter): Pose {
  if (f.move) return movePose(f.move, f.moveT)
  if (f.blockT >= 0) return { phi: -0.2, psi: 1.45, ext: 0.8, lean: -0.05, live: false, spinning: false }
  if (f.hurtT > 0 || f.stunT > 0) return { phi: -1.7, psi: -2.2, ext: 1, lean: -0.35, live: false, spinning: false }
  const moving = Math.abs(f.vx) > 30 && f.y <= 0
  if (f.dashT > 0) return { phi: -2.6, psi: -2.9, ext: 1, lean: 0.5, live: false, spinning: false }
  if (moving) return { phi: -2.3, psi: -2.8, ext: 1, lean: 0.25, live: false, spinning: false }
  if (f.y > 0) return { phi: 0.4, psi: 1.1, ext: 1, lean: 0.1, live: false, spinning: false }
  return { phi: REST[0] + Math.sin(f.age * 2.2) * 0.04, psi: REST[1], ext: 1, lean: 0.04, live: false, spinning: false }
}

// ─── Figures ───────────────────────────────────────────────────────────

const trails = new WeakMap<Fighter, Pt[][]>()

interface Look {
  color: string
  weapon: Weapon
  blade: string
  len: number
  thick: number
  twin?: boolean
}

function lookOf(s: Sim, f: Fighter): Look {
  if (f.kind === 'hero') return { color: '#141414', weapon: 'sword', blade: s.sword.color, len: s.sword.reach * 0.66, thick: 1, twin: s.sword.twin }
  const d = FOES[f.kind as FoeKind]
  const len = d.weapon === 'spear' ? 70 : d.weapon === 'club' ? 38 : d.weapon === 'kunai' ? 14 : d.weapon === 'fan' ? 16 : 36
  return { color: d.color, weapon: d.weapon, blade: d.weapon === 'club' ? '#3b2a1a' : '#d8dde4', len, thick: f.kind === 'brute' || f.kind === 'oni' ? 1.5 : 1 }
}

function line(ctx: CanvasRenderingContext2D, a: Pt, b: Pt) {
  ctx.beginPath()
  ctx.moveTo(a[0], a[1])
  ctx.lineTo(b[0], b[1])
  ctx.stroke()
}

function drawFighter(ctx: CanvasRenderingContext2D, s: Sim, f: Fighter, cam: number) {
  const sc = f.scale
  const look = lookOf(s, f)
  const pose = poseOf(f)
  const sx = f.x - cam
  const sy = GY - f.y
  const P = (lx: number, ly: number): Pt => [sx + lx * f.face, sy - ly]
  const dirPt = (o: Pt, ang: number, len: number): Pt => [o[0] + Math.cos(ang) * len * f.face, o[1] - Math.sin(ang) * len]

  ctx.save()
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath()
  ctx.ellipse(sx, GY + 2, 16 * sc * Math.max(0.4, 1 - f.y / 300), 3.5, 0, 0, Math.PI * 2)
  ctx.fill()
  if (f.dead) {
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, f.deadT - 0.8) / 0.8)
    ctx.translate(sx, sy)
    ctx.rotate(-f.face * Math.min(1, f.deadT * 5) * (Math.PI / 2) * (f.vx * f.face > 0 ? -1 : 1))
    ctx.translate(-sx, -sy)
  }
  if (f.kind === 'shade') ctx.globalAlpha *= 0.7
  if (f.inv > 0 && f.team === 0 && !f.move && Math.floor(f.inv * 20) % 2 === 0) ctx.globalAlpha *= 0.45
  const glow = f.kind === 'kage' || f.kind === 'shade' ? '#a26bff' : f.kind === 'hero' && s.meter >= 100 ? s.sword.color : null
  if (glow) {
    ctx.shadowColor = glow
    ctx.shadowBlur = 12
  }
  const ink = f.flash > 0 ? '#ffffff' : look.color
  ctx.strokeStyle = ink
  ctx.fillStyle = ink
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 3.9 * sc * look.thick

  // Legs.
  const moving = Math.abs(f.vx) > 30 && f.y <= 0 && !f.move && f.dashT <= 0
  const ph = f.x / (13 * sc)
  let legs: [number, number][]
  if (f.y > 2 && !f.dead) legs = [[0.7, 1.5], [-0.3, 0.7]]
  else if (moving) legs = [[Math.sin(ph) * 0.8, 0.25 + Math.max(0, Math.cos(ph)) * 1.1], [-Math.sin(ph) * 0.8, 0.25 + Math.max(0, -Math.cos(ph)) * 1.1]]
  else if (f.move || f.blockT >= 0 || f.dashT > 0) legs = [[0.5, 0.35], [-0.45, 0.2]]
  else legs = [[0.22, 0.12], [-0.22, 0.12]]
  if (f.kind === 'tengu' && f.y > 10) legs = [[0.3, 0.9], [0.1, 0.7]]
  const hipY = 26 * sc + (moving ? Math.abs(Math.cos(ph)) * 2 : 0) - (f.move && pose.live ? 2 : 0)
  const hip = P(0, hipY)
  for (const [a, bend] of legs) {
    const knee: Pt = [hip[0] + Math.sin(a) * 13 * sc * f.face, hip[1] + Math.cos(a) * 13 * sc]
    const b = a - bend
    const foot: Pt = [knee[0] + Math.sin(b) * 13 * sc * f.face, knee[1] + Math.cos(b) * 13 * sc]
    ctx.beginPath()
    ctx.moveTo(hip[0], hip[1])
    ctx.lineTo(knee[0], knee[1])
    ctx.lineTo(foot[0], foot[1])
    ctx.stroke()
  }
  // Torso and head.
  const lean = pose.lean
  const up = (len: number): Pt => [hip[0] + Math.sin(lean) * len * sc * f.face, hip[1] - Math.cos(lean) * len * sc]
  const neck = up(24)
  const shoulder = up(20)
  const head = up(32)
  if (f.kind === 'brute') {
    ctx.save()
    ctx.lineWidth = 9 * sc
    line(ctx, hip, shoulder)
    ctx.restore()
    ctx.fillStyle = '#e8d9b8'
    ctx.fillRect(hip[0] - 7 * sc, hip[1] - 3 * sc, 14 * sc, 5 * sc)
    ctx.fillStyle = ink
  } else line(ctx, hip, neck)
  ctx.beginPath()
  ctx.arc(head[0], head[1], 7.5 * sc, 0, Math.PI * 2)
  ctx.fill()
  extras(ctx, s, f, head, sc, ink)

  // Back arm.
  const backAng = moving ? -1.57 - Math.sin(ph) * 0.9 : f.move ? -2.4 : -2.0
  const backHand = dirPt(shoulder, look.twin ? (pose.live ? pose.phi + 2.2 : -2.5) : backAng, 15 * sc)
  line(ctx, shoulder, backHand)
  if (look.twin) blade(ctx, backHand, look.twin && pose.live ? pose.psi + 2.4 : -2.8, look.len * 0.9 * sc, look, f, ink)
  // Weapon arm.
  const hand = dirPt(shoulder, pose.phi, 16 * sc * pose.ext)
  const elbow: Pt = [(shoulder[0] + hand[0]) / 2 - 2 * f.face, (shoulder[1] + hand[1]) / 2 + 2]
  ctx.beginPath()
  ctx.moveTo(shoulder[0], shoulder[1])
  ctx.lineTo(elbow[0], elbow[1])
  ctx.lineTo(hand[0], hand[1])
  ctx.stroke()
  const tip = blade(ctx, hand, pose.psi, look.len * sc, look, f, ink)
  ctx.restore()

  // Sword trail.
  let tr = trails.get(f)
  if (!tr) trails.set(f, (tr = []))
  if (pose.live && look.weapon !== 'kunai') tr.push([hand, tip])
  else if (tr.length) tr.shift()
  if (tr.length > 7) tr.shift()
  if (tr.length > 1) {
    ctx.save()
    ctx.fillStyle = f.kind === 'hero' ? hexA(look.blade, 0.45) : 'rgba(255,255,255,0.32)'
    ctx.beginPath()
    tr.forEach(([, t], i) => (i ? ctx.lineTo(t[0], t[1]) : ctx.moveTo(t[0], t[1])))
    for (let i = tr.length - 1; i >= 0; i--) {
      const [h, t] = tr[i]
      ctx.lineTo(lerp(h[0], t[0], 0.45), lerp(h[1], t[1], 0.45))
    }
    ctx.fill()
    ctx.restore()
  }
  // Stun stars.
  if (f.stunT > 0 && !f.dead) {
    ctx.fillStyle = '#ffe066'
    for (let i = 0; i < 3; i++) {
      const a = s.t * 6 + (i * Math.PI * 2) / 3
      ctx.fillRect(head[0] + Math.cos(a) * 11 * sc - 1.5, head[1] - 11 * sc + Math.sin(a) * 3 - 1.5, 3, 3)
    }
  }
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

function blade(ctx: CanvasRenderingContext2D, hand: Pt, psi: number, len: number, look: Look, f: Fighter, ink: string): Pt {
  const dx = Math.cos(psi) * f.face
  const dy = -Math.sin(psi)
  const tip: Pt = [hand[0] + dx * len, hand[1] + dy * len]
  ctx.save()
  if (look.weapon === 'spear') {
    ctx.strokeStyle = '#6b4a2b'
    ctx.lineWidth = 2.2 * f.scale
    line(ctx, [hand[0] - dx * len * 0.35, hand[1] - dy * len * 0.35], tip)
    ctx.fillStyle = '#cfd8dc'
    ctx.beginPath()
    ctx.moveTo(tip[0] + dx * 9, tip[1] + dy * 9)
    ctx.lineTo(tip[0] - dy * 3, tip[1] + dx * 3)
    ctx.lineTo(tip[0] + dy * 3, tip[1] - dx * 3)
    ctx.fill()
  } else if (look.weapon === 'club') {
    ctx.strokeStyle = look.blade
    ctx.lineWidth = 6 * f.scale
    line(ctx, hand, tip)
    if (f.kind === 'oni') {
      ctx.fillStyle = '#bbb'
      for (let k = 1; k < 5; k++) ctx.fillRect(hand[0] + dx * len * (k / 5) - 1.5, hand[1] + dy * len * (k / 5) - 1.5, 3, 3)
    }
  } else if (look.weapon === 'fan') {
    ctx.fillStyle = '#f2e7c9'
    ctx.strokeStyle = '#7a1f1f'
    ctx.lineWidth = 1
    const a0 = Math.atan2(dy, dx)
    ctx.beginPath()
    ctx.moveTo(hand[0], hand[1])
    ctx.arc(hand[0], hand[1], len * 1.3, a0 - 0.6, a0 + 0.6)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  } else {
    // Handle, guard, blade.
    ctx.strokeStyle = ink
    ctx.lineWidth = 2.6 * f.scale
    line(ctx, [hand[0] - dx * 6 * f.scale, hand[1] - dy * 6 * f.scale], hand)
    ctx.strokeStyle = '#c9a227'
    ctx.lineWidth = 2
    line(ctx, [hand[0] - dy * 3.5, hand[1] + dx * 3.5], [hand[0] + dy * 3.5, hand[1] - dx * 3.5])
    ctx.strokeStyle = look.blade
    ctx.lineWidth = (look.weapon === 'kunai' ? 2 : 2.4) * f.scale
    line(ctx, hand, tip)
  }
  ctx.restore()
  return tip
}

function extras(ctx: CanvasRenderingContext2D, s: Sim, f: Fighter, head: Pt, sc: number, ink: string) {
  const fc = f.face
  ctx.save()
  switch (f.kind) {
    case 'hero': {
      // Red headband with trailing tails.
      ctx.strokeStyle = '#d32f2f'
      ctx.lineWidth = 2.4
      line(ctx, [head[0] - 6.5, head[1] - 1], [head[0] + 6.5, head[1] - 1])
      ctx.lineWidth = 1.8
      const speed = Math.min(1, Math.abs(f.vx) / 250)
      for (const k of [0, 1]) {
        ctx.beginPath()
        ctx.moveTo(head[0] - fc * 6, head[1] - 1)
        for (let i = 1; i <= 4; i++) {
          const x = head[0] - fc * (6 + i * 4.5)
          const y = head[1] - 1 + i * (2.4 - speed * 2) + Math.sin(s.t * 12 + i + k * 1.5) * (1 + speed * 1.5) + k * 2
          ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      break
    }
    case 'bandit':
      ctx.fillStyle = ink
      ctx.beginPath()
      ctx.arc(head[0] - fc * 4 * sc, head[1] - 7 * sc, 2.6 * sc, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#e0c068'
      ctx.lineWidth = 1.6
      line(ctx, [head[0] - 7, head[1] - 2], [head[0] + 7, head[1] - 2])
      break
    case 'spear':
    case 'ronin': {
      const w = f.kind === 'ronin' ? 15 : 11
      ctx.fillStyle = f.kind === 'ronin' ? '#c9a66b' : '#3a3a3a'
      ctx.beginPath()
      ctx.moveTo(head[0] - w * sc, head[1] - 3 * sc)
      ctx.lineTo(head[0], head[1] - 12 * sc)
      ctx.lineTo(head[0] + w * sc, head[1] - 3 * sc)
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'thrower':
    case 'assassin':
    case 'shade':
    case 'kage':
      ctx.fillStyle = f.kind === 'kage' ? '#ffffff' : '#f2f2f2'
      ctx.fillRect(head[0] + fc * 1 - 3.5 * sc, head[1] - 2 * sc, 7 * sc, 1.8 * sc)
      if (f.kind === 'assassin' || f.kind === 'kage') {
        ctx.strokeStyle = f.kind === 'kage' ? '#a26bff' : '#c2185b'
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(head[0] - fc * 3, head[1] + 7 * sc)
        for (let i = 1; i <= 4; i++) ctx.lineTo(head[0] - fc * (3 + i * 5), head[1] + 7 * sc + i * 1.5 + Math.sin(s.t * 10 + i) * 2)
        ctx.stroke()
      }
      break
    case 'brute':
      ctx.fillStyle = ink
      ctx.beginPath()
      ctx.arc(head[0], head[1] - 7 * sc, 2.8 * sc, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'oni':
      ctx.fillStyle = '#f5e6c8'
      for (const d of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(head[0] + d * 3 * sc, head[1] - 5 * sc)
        ctx.lineTo(head[0] + d * 6 * sc, head[1] - 13 * sc)
        ctx.lineTo(head[0] + d * 6.5 * sc, head[1] - 4 * sc)
        ctx.fill()
      }
      ctx.fillStyle = '#ffe14d'
      ctx.fillRect(head[0] + fc * 2 * sc - 1.5, head[1] - 2 * sc, 3, 2.5)
      ctx.fillRect(head[0] + fc * 5 * sc - 1.5, head[1] - 2 * sc, 3, 2.5)
      break
    case 'tengu': {
      ctx.fillStyle = '#c62828'
      ctx.beginPath()
      ctx.arc(head[0], head[1], 6.6 * sc, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#c62828'
      ctx.lineWidth = 3 * sc
      line(ctx, [head[0] + fc * 5 * sc, head[1]], [head[0] + fc * 15 * sc, head[1] + 1])
      // Wings.
      const flap = Math.sin(s.t * (f.y > 10 ? 10 : 3)) * 0.4
      ctx.fillStyle = '#1b1b1b'
      for (const k of [0, 1]) {
        ctx.save()
        ctx.translate(head[0] - fc * 2, head[1] + 12 * sc)
        ctx.rotate(fc * (-0.6 - flap - k * 0.35))
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.quadraticCurveTo(-fc * 28 * sc, -18 * sc, -fc * 40 * sc, 6 * sc)
        ctx.quadraticCurveTo(-fc * 20 * sc, 4 * sc, 0, 8 * sc)
        ctx.fill()
        ctx.restore()
      }
      break
    }
    case 'shogun':
      ctx.fillStyle = '#5a3d0c'
      ctx.beginPath()
      ctx.arc(head[0], head[1] - 1, 8.5 * sc, Math.PI, 0)
      ctx.fill()
      ctx.fillRect(head[0] - 11 * sc, head[1] - 1, 22 * sc, 2.5 * sc)
      ctx.strokeStyle = '#ffd54f'
      ctx.lineWidth = 2.4
      ctx.beginPath()
      ctx.moveTo(head[0] - 9 * sc, head[1] - 18 * sc)
      ctx.quadraticCurveTo(head[0], head[1] - 4 * sc, head[0] + 9 * sc, head[1] - 18 * sc)
      ctx.stroke()
      ctx.fillStyle = '#ff7043'
      ctx.fillRect(head[0] + fc * 2 * sc - 1.5, head[1] + 1, 3, 2)
      break
  }
  ctx.restore()
}

// ─── Shots and effects ─────────────────────────────────────────────────

function drawShot(ctx: CanvasRenderingContext2D, sh: Shot, cam: number, t: number) {
  const x = sh.x - cam
  const y = GY - sh.y
  const dir = Math.sign(sh.vx) || 1
  ctx.save()
  switch (sh.kind) {
    case 'star':
      ctx.translate(x, y)
      ctx.rotate(t * 20)
      ctx.fillStyle = sh.team === 0 ? '#ffe066' : '#cfd8dc'
      ctx.beginPath()
      for (let i = 0; i < 8; i++) {
        const r = i % 2 ? 2.5 : 8
        ctx.lineTo(Math.cos((i * Math.PI) / 4) * r, Math.sin((i * Math.PI) / 4) * r)
      }
      ctx.fill()
      break
    case 'wave': {
      ctx.shadowColor = '#bfe9ff'
      ctx.shadowBlur = 14
      ctx.fillStyle = sh.lifesteal ? 'rgba(200,170,255,0.9)' : 'rgba(225,245,255,0.92)'
      ctx.beginPath()
      ctx.ellipse(x, y, sh.r * 0.45, sh.r * 1.25, 0, -Math.PI / 2, Math.PI / 2, dir < 0)
      ctx.ellipse(x - dir * sh.r * 0.25, y, sh.r * 0.25, sh.r * 1.1, 0, Math.PI / 2, -Math.PI / 2, dir > 0)
      ctx.fill()
      break
    }
    case 'wind':
      ctx.strokeStyle = 'rgba(210,255,225,0.9)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(x, y, sh.r, Math.atan2(-sh.vy, sh.vx) - 1.2, Math.atan2(-sh.vy, sh.vx) + 1.2)
      ctx.stroke()
      break
    case 'shock':
      ctx.fillStyle = 'rgba(255,170,90,0.85)'
      ctx.beginPath()
      ctx.ellipse(x, GY, sh.r, sh.r * 1.4, 0, Math.PI, 0)
      ctx.fill()
      ctx.fillStyle = 'rgba(120,70,40,0.8)'
      for (let i = 0; i < 4; i++) ctx.fillRect(x - dir * i * 7, GY - 4 - ((i * 5 + t * 60) % 10), 3, 3)
      break
    case 'fire':
    case 'flame': {
      const n = sh.kind === 'fire' ? 6 : 2
      for (let i = 0; i < n; i++) {
        const r = sh.r * (0.5 + 0.5 * Math.sin(t * 20 + i * 2))
        ctx.fillStyle = i % 2 ? 'rgba(255,193,7,0.85)' : 'rgba(255,87,34,0.85)'
        ctx.beginPath()
        ctx.arc(x - dir * i * 6, y - (sh.kind === 'fire' ? r : 0) - i * 3, r * 0.7, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'dragon': {
      ctx.shadowColor = '#4dd0e1'
      ctx.shadowBlur = 18
      for (let i = 12; i >= 0; i--) {
        const bx = x - dir * i * 9
        const by = y + Math.sin(t * 10 - i * 0.6) * 12
        ctx.fillStyle = i === 0 ? '#e0f7fa' : `rgba(77,208,225,${0.95 - i * 0.05})`
        ctx.beginPath()
        ctx.arc(bx, by, (i === 0 ? sh.r * 0.55 : sh.r * 0.42) * (1 - i * 0.04), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = '#006064'
      ctx.fillRect(x + dir * 6 - 2, y - 6, 4, 4)
      break
    }
  }
  ctx.restore()
}

function drawFx(ctx: CanvasRenderingContext2D, s: Sim, cam: number) {
  for (const p of s.fx) {
    const a = Math.max(0, p.life / p.max)
    const x = p.x - cam
    const y = GY - p.y
    ctx.globalAlpha = a
    if (p.kind === 'text') {
      ctx.font = `bold ${p.size}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.lineWidth = 3
      ctx.strokeStyle = 'rgba(0,0,0,0.7)'
      ctx.strokeText(p.text!, x, y)
      ctx.fillStyle = p.color
      ctx.fillText(p.text!, x, y)
    } else if (p.kind === 'ring') {
      ctx.strokeStyle = p.color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, p.size * (1.4 - a), 0, Math.PI * 2)
      ctx.stroke()
    } else if (p.kind === 'bolt') {
      ctx.strokeStyle = p.color
      ctx.lineWidth = 3
      ctx.shadowColor = p.color
      ctx.shadowBlur = 12
      ctx.beginPath()
      let bx = x
      ctx.moveTo(bx, 0)
      for (let yy = 20; yy < y; yy += 20) {
        bx = x + (Math.random() - 0.5) * 18
        ctx.lineTo(bx, yy)
      }
      ctx.lineTo(x, y)
      ctx.stroke()
      ctx.shadowBlur = 0
    } else if (p.kind === 'spark') {
      ctx.strokeStyle = p.color
      ctx.lineWidth = p.size
      line(ctx, [x, y], [x - p.vx * 0.02, y + p.vy * 0.02])
    } else {
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(x, y, p.size * (p.kind === 'ember' ? a : 1), 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
}

// ─── HUD ───────────────────────────────────────────────────────────────

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, v: number, fill: string) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2)
  ctx.fillStyle = '#3a0d0d'
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = fill
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, v)), h)
}

function hud(ctx: CanvasRenderingContext2D, s: Sim, level: number) {
  const h = s.hero
  ctx.font = 'bold 9px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'
  ctx.lineWidth = 2.5
  const label = `Lv ${level}`
  ctx.strokeText(label, 8, 14)
  ctx.fillText(label, 8, 14)
  bar(ctx, 36, 7, 120, 8, h.hp / h.maxHp, h.hp / h.maxHp < 0.3 ? '#ff5252' : '#4caf50')
  ctx.font = 'bold 7px system-ui, sans-serif'
  ctx.fillStyle = '#fff'
  ctx.fillText(`${Math.ceil(h.hp)} / ${h.maxHp}`, 40, 14)
  const full = s.meter >= 100
  bar(ctx, 36, 18, 90, 5, s.meter / 100, full ? (Math.floor(s.t * 6) % 2 ? '#fff176' : s.sword.color) : '#64b5f6')
  if (full) {
    ctx.font = 'bold 7px system-ui, sans-serif'
    ctx.fillStyle = '#fff176'
    ctx.strokeText('SPECIAL!', 130, 24)
    ctx.fillText('SPECIAL!', 130, 24)
  }
  ctx.textAlign = 'right'
  ctx.font = 'bold 9px system-ui, sans-serif'
  const w = WORLDS[s.stage.world]
  const st = `${w.jp} ${s.stage.world + 1}-${s.stage.n}   ⚔ ${s.kills}`
  ctx.strokeText(st, vw - 8, 14)
  ctx.fillStyle = '#fff'
  ctx.fillText(st, vw - 8, 14)
  if (s.chain >= 3) {
    ctx.font = `bold ${10 + Math.min(8, s.chain / 2)}px system-ui, sans-serif`
    ctx.fillStyle = '#ffd54f'
    ctx.strokeText(`${s.chain} HIT`, vw - 8, 30)
    ctx.fillText(`${s.chain} HIT`, vw - 8, 30)
  }
  if (s.boss && !s.boss.dead) {
    const d = FOES[s.boss.kind as FoeKind]
    ctx.textAlign = 'center'
    ctx.font = 'bold 8px system-ui, sans-serif'
    ctx.fillStyle = '#fff'
    ctx.strokeText(`${d.name}  ${d.jp}`, vw / 2, 40)
    ctx.fillText(`${d.name}  ${d.jp}`, vw / 2, 40)
    bar(ctx, vw / 2 - 110, 44, 220, 6, s.boss.hp / s.boss.maxHp, s.boss.enraged ? '#ff1744' : '#e53935')
  }
  if (s.banner) {
    const a = Math.min(1, s.banner.t * 2)
    ctx.globalAlpha = a
    ctx.textAlign = 'center'
    ctx.font = 'bold 22px system-ui, sans-serif'
    ctx.lineWidth = 4
    ctx.strokeStyle = 'rgba(0,0,0,0.75)'
    ctx.strokeText(s.banner.text, vw / 2, 110)
    ctx.fillStyle = '#fff'
    ctx.fillText(s.banner.text, vw / 2, 110)
    if (s.banner.sub) {
      ctx.font = 'bold 12px system-ui, sans-serif'
      ctx.strokeText(s.banner.sub, vw / 2, 128)
      ctx.fillStyle = '#ffd54f'
      ctx.fillText(s.banner.sub, vw / 2, 128)
    }
    ctx.globalAlpha = 1
  }
  // Off-screen foe arrows.
  const cam = camOf(s)
  for (const f of s.foes) {
    if (f.dead) continue
    const x = f.x - cam
    if (x >= 0 && x <= vw) continue
    const left = x < 0
    ctx.fillStyle = FOES[f.kind as FoeKind].boss ? '#ff5252' : 'rgba(255,255,255,0.85)'
    ctx.beginPath()
    const ax = left ? 6 : vw - 6
    const ay = GY - 30 - Math.min(f.y, 120)
    ctx.moveTo(ax, ay)
    ctx.lineTo(ax + (left ? 8 : -8), ay - 6)
    ctx.lineTo(ax + (left ? 8 : -8), ay + 6)
    ctx.fill()
  }
}

let camX = -1
export function camOf(s: Sim) {
  const target = Math.max(0, Math.min(ARENA - vw, s.hero.x - vw / 2))
  if (camX < 0 || Math.abs(camX - target) > 300) camX = target
  return camX
}

/** Draw a frame. `width`/`height` are the canvas's pixel size. */
export function draw(ctx: CanvasRenderingContext2D, s: Sim, level: number, width: number, height: number, dt: number) {
  vw = Math.max(260, Math.min(640, Math.round((VH * width) / height)))
  const target = Math.max(0, Math.min(ARENA - vw, s.hero.x - vw / 2))
  camX = camX < 0 ? target : camX + (target - camX) * Math.min(1, dt * 6)
  const k = height / VH
  ctx.setTransform(k, 0, 0, k, 0, 0)
  ctx.clearRect(0, 0, vw, VH)
  const shake = s.shake > 0 ? s.shake * 10 : 0
  ctx.save()
  if (shake) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake)
  backdrop(ctx, s.stage.world, camX, s.t)
  const all = [...s.foes.filter((f) => f.dead), ...s.foes.filter((f) => !f.dead), s.hero]
  for (const f of all) drawFighter(ctx, s, f, camX)
  for (const sh of s.shots) drawShot(ctx, sh, camX, s.t)
  drawFx(ctx, s, camX)
  ctx.restore()
  hud(ctx, s, level)
}

export function resetCamera() {
  camX = -1
}

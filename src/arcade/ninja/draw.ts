/**
 * Drawing for Stick Ninja: ink-brush stick figures with procedural poses,
 * sword trails, a parallax backdrop per world, projectiles, particles and
 * the fight HUD. All in a 480×270 logical view, scaled to the canvas.
 */
import { hdAvailable } from '../../art/hd'
import { hdUrl } from '../../art/hd/manifest'
import { Fighters3D } from './fighters3d'
import { groundUnder, type Level } from './trials'
import { ART_BY_ID, FOES, MOD_INFO, WORLDS, isSword, type Deco, type FoeKind, type Weapon } from './data'
import { ARENA, MAX_STARS, type Fighter, type Move, type Shot, type Sim, type Swing } from './sim'

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
  deco: Deco
  moon?: string
  motes?: string
}

const THEMES: Theme[] = [
  { sky: ['#bfe3c8', '#f6eccb'], far: '#8fb89a', mid: '#3f6e4c', ground: '#5a4632', edge: '#2e5d3f', deco: 'bamboo', motes: '#e9f5d0' },
  { sky: ['#3a1c2e', '#e0703f'], far: '#6b2f2a', mid: '#2d1616', ground: '#3b2a22', edge: '#1e0f0d', deco: 'torii', moon: '#ffb98a', motes: '#ff9d6b' },
  { sky: ['#86c2e6', '#eef7fb'], far: '#a8bfcf', mid: '#5d7a8c', ground: '#6e6a66', edge: '#3f4a52', deco: 'pines', motes: '#ffffff' },
  { sky: ['#0d0a22', '#3f2c6b'], far: '#291d47', mid: '#130d25', ground: '#1f1a33', edge: '#0b0816', deco: 'castle', moon: '#f4ecff', motes: '#b79cff' },
  { sky: ['#2a0e08', '#ff8c42'], far: '#6a2a16', mid: '#2a110a', ground: '#3c1f14', edge: '#1a0a05', deco: 'pagoda', moon: '#ffd27a', motes: '#ffb04d' },
  { sky: ['#2c4a48', '#a9cfae'], far: '#5f8a7a', mid: '#21423a', ground: '#4a5a48', edge: '#2b3b2c', deco: 'willows', motes: '#d4ff6a' },
  { sky: ['#04060d', '#1f3550'], far: '#18283a', mid: '#0b121b', ground: '#2a2e33', edge: '#11151a', deco: 'temple', moon: '#e6f4ff', motes: '#7fe7ff' },
  { sky: ['#465c84', '#cbdaea'], far: '#9fb2c8', mid: '#55698a', ground: '#e3ebf3', edge: '#9fb4c7', deco: 'snowpass', motes: '#ffffff' },
  { sky: ['#191c28', '#5b5f78'], far: '#373b52', mid: '#20233a', ground: '#cfd4dd', edge: '#8d94a6', deco: 'drums', motes: '#ffe066' },
  { sky: ['#ece7f3', '#b6a3d8'], far: '#8a7aa8', mid: '#1b1030', ground: '#efeae0', edge: '#1b1030', deco: 'void', motes: '#3d2a5c' },
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
  } else if (th.deco === 'willows') {
    // A slow river behind the bank, and willows trailing into it.
    ctx.fillStyle = 'rgba(120,180,170,0.55)'
    ctx.fillRect(0, GY - 20, vw, 20)
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    for (let i = 0; i < 16; i++) ctx.fillRect(((i * 61 - cam * 0.6 + t * 12) % (vw + 40) + vw + 40) % (vw + 40) - 20, GY - 16 + (i % 3) * 5, 10 + (i % 4) * 4, 1)
    ctx.fillStyle = th.mid
    ctx.strokeStyle = th.mid
    for (let i = 0; i < 12; i++) {
      const x = i * 110 + r() * 40 - pm
      if (x < -80 || x > vw + 80) continue
      const top = 70 + r() * 30
      ctx.lineWidth = 6
      line(ctx, [x, GY - 18], [x + 6, top])
      ctx.lineWidth = 1.2
      for (let k = 0; k < 16; k++) {
        const bx = x - 40 + k * 6
        const sway = Math.sin(t * 1.2 + k + i) * 4
        ctx.beginPath()
        ctx.moveTo(x + 6, top)
        ctx.quadraticCurveTo(bx, top - 10, bx + sway, top + 50 + ((k * 13) % 30))
        ctx.stroke()
      }
    }
  } else if (th.deco === 'snowpass') {
    for (let i = 0; i < 30; i++) {
      const x = i * 40 + r() * 20 - pm
      const h = 50 + r() * 60
      ctx.fillStyle = th.mid
      ctx.beginPath()
      ctx.moveTo(x, GY - h - 30)
      ctx.lineTo(x - 18, GY - 20)
      ctx.lineTo(x + 18, GY - 20)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.beginPath()
      ctx.moveTo(x, GY - h - 30)
      ctx.lineTo(x - 8, GY - h - 8)
      ctx.lineTo(x + 8, GY - h - 8)
      ctx.fill()
    }
  } else if (th.deco === 'drums') {
    // Floating taiko drums on banks of cloud; now and then the sky flashes.
    const flash = Math.max(0, Math.sin(t * 0.9) * Math.sin(t * 7.3)) > 0.93
    if (flash) {
      ctx.fillStyle = 'rgba(255,250,220,0.35)'
      ctx.fillRect(0, 0, vw, GY)
    }
    for (let i = 0; i < 6; i++) {
      const x = 60 + i * 190 - pm
      if (x < -60 || x > vw + 60) continue
      const y = 90 + Math.sin(t * 0.8 + i) * 8 + (i % 2) * 30
      ctx.fillStyle = th.mid
      ctx.beginPath()
      ctx.ellipse(x, y, 22, 26, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#c9a227'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.ellipse(x, y, 22, 26, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = '#b71c1c'
      ctx.beginPath()
      ctx.arc(x, y, 10, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = 'rgba(220,224,235,0.9)'
    for (let i = 0; i < 9; i++) {
      const x = ((i * 140 - cam * 0.5 + t * 6) % (vw + 160)) - 80
      ctx.beginPath()
      ctx.ellipse(x, GY - 6, 60, 16, 0, 0, Math.PI * 2)
      ctx.ellipse(x + 40, GY - 14, 34, 14, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (th.deco === 'void') {
    // A vast ink torii, and written characters drifting apart.
    const x = 300 - pm * 0.4
    ctx.fillStyle = th.mid
    ctx.fillRect(x - 70, GY - 170, 12, 170)
    ctx.fillRect(x + 58, GY - 170, 12, 170)
    ctx.fillRect(x - 96, GY - 186, 192, 14)
    ctx.fillRect(x - 80, GY - 150, 160, 8)
    ctx.font = '14px serif'
    ctx.textAlign = 'center'
    const chars = '言葉心字文音声名話語'
    for (let i = 0; i < 22; i++) {
      const cx = ((i * 83 - cam * (0.2 + (i % 4) * 0.1)) % (vw + 40) + vw + 40) % (vw + 40) - 20
      const cy = (GY - ((t * (6 + (i % 5) * 3) + i * 37) % GY))
      ctx.globalAlpha = 0.15 + 0.3 * ((i * 7) % 10) / 10
      ctx.fillText(chars[i % chars.length], cx, cy)
    }
    ctx.globalAlpha = 1
  } else if (th.deco === 'temple') {
    for (let i = 0; i < 4; i++) {
      const x = 120 + i * 260 - pm
      if (x < -140 || x > vw + 140) continue
      ctx.fillStyle = th.mid
      ctx.fillRect(x - 60, GY - 70, 120, 70)
      ctx.beginPath()
      ctx.moveTo(x - 90, GY - 66)
      ctx.quadraticCurveTo(x, GY - 120, x + 90, GY - 66)
      ctx.fill()
      // Torn paper doors glowing ghost-blue.
      ctx.fillStyle = `rgba(127,231,255,${0.35 + 0.15 * Math.sin(t * 2 + i)})`
      for (let k = 0; k < 4; k++) ctx.fillRect(x - 48 + k * 25, GY - 56, 20, 40)
    }
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 130 - cam * 0.75
      if (x < -20 || x > vw + 20) continue
      ctx.fillStyle = '#1a2129'
      ctx.fillRect(x - 4, GY - 30, 8, 30)
      ctx.fillRect(x - 8, GY - 38, 16, 9)
      ctx.fillStyle = `rgba(127,231,255,${0.6 + 0.3 * Math.sin(t * 5 + i)})`
      ctx.beginPath()
      ctx.arc(x, GY - 44 + Math.sin(t * 2 + i) * 2, 3.5, 0, Math.PI * 2)
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

// ─── Painted art ───────────────────────────────────────────────────────

const imgCache = new Map<string, HTMLImageElement | null>()

/** A painted (HD) asset ready to draw, or null while missing or loading (loading starts on first ask). */
export function paint(id: string): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null
  const have = imgCache.get(id)
  if (have !== undefined) return have && have.complete && have.naturalWidth > 0 ? have : null
  if (!hdAvailable(id)) return null
  const img = new Image()
  img.decoding = 'async'
  img.onerror = () => imgCache.set(id, null)
  img.src = hdUrl(id)
  imgCache.set(id, img)
  return null
}

/** The painted backdrop if there is one (panning slowly as you cross the arena), else the drawn one. */
function scenery(ctx: CanvasRenderingContext2D, world: number, cam: number, t: number, width = ARENA) {
  const img = paint(`nj-bg-${world}`)
  if (img) {
    const h = Math.max(292, (vw * 1.15 * img.naturalHeight) / img.naturalWidth)
    const w = (h * img.naturalWidth) / img.naturalHeight
    const pan = width > vw ? cam / (width - vw) : 0
    ctx.drawImage(img, -pan * Math.max(0, w - vw), GY - 0.82 * h, w, h)
    // Settle the fighters onto the painted ground.
    const g = ctx.createLinearGradient(0, GY - 8, 0, VH)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(0.3, 'rgba(0,0,0,0.16)')
    g.addColorStop(1, 'rgba(0,0,0,0.5)')
    ctx.fillStyle = g
    ctx.fillRect(0, GY - 8, vw, VH - GY + 8)
  } else backdrop(ctx, world, cam, t)
  atmosphere(ctx, world, cam, t)
}

const ATMOS = [
  { rays: '255,244,200', fog: '235,245,230', motes: '#f4ffd8', fall: 'leaf' },
  { rays: '', fog: '90,20,20', motes: '#ff8a50', fall: 'ember' },
  { rays: '255,255,255', fog: '245,250,255', motes: '#ffffff', fall: 'snow' },
  { rays: '', fog: '120,80,200', motes: '#ffb7d5', fall: 'petal' },
  { rays: '255,170,80', fog: '120,40,10', motes: '#ffb04d', fall: 'ember' },
  { rays: '', fog: '170,215,195', motes: '#cfe8e4', fall: 'rain' },
  { rays: '', fog: '110,190,255', motes: '#7fe7ff', fall: 'ember' },
  { rays: '255,255,255', fog: '240,248,255', motes: '#ffffff', fall: 'blizzard' },
  { rays: '255,230,120', fog: '200,200,220', motes: '#dfe6ff', fall: 'rain' },
  { rays: '', fog: '70,40,100', motes: '#2a1840', fall: 'ink' },
] as const

function atmosphere(ctx: CanvasRenderingContext2D, world: number, cam: number, t: number) {
  const a = ATMOS[world]
  ctx.save()
  if (a.rays) {
    ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 4; i++) {
      const x = ((i * 150 + 60 - cam * 0.2) % (vw + 200)) - 60
      const sway = Math.sin(t * 0.4 + i) * 12
      const g = ctx.createLinearGradient(x, 0, x - 60, GY)
      g.addColorStop(0, `rgba(${a.rays},0.11)`)
      g.addColorStop(1, `rgba(${a.rays},0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(x + sway, -10)
      ctx.lineTo(x + 26 + sway, -10)
      ctx.lineTo(x - 50, GY)
      ctx.lineTo(x - 110, GY)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  }
  // Low drifting fog over the ground.
  for (let i = 0; i < 5; i++) {
    const x = ((i * 170 + t * (6 + i * 2) - cam * 0.7) % (vw + 260)) - 130
    const g = ctx.createRadialGradient(x, GY - 6, 4, x, GY - 6, 110)
    g.addColorStop(0, `rgba(${a.fog},0.16)`)
    g.addColorStop(1, `rgba(${a.fog},0)`)
    ctx.fillStyle = g
    ctx.fillRect(x - 110, GY - 60, 220, 90)
  }
  // Falling leaves, snow, petals or rain; rising embers or ink.
  if (a.fall === 'rain') {
    ctx.strokeStyle = a.motes
    ctx.lineWidth = 0.8
    ctx.globalAlpha = 0.45
    for (let i = 0; i < 70; i++) {
      const x = ((i * 53.7 + t * 40 - cam * 0.9) % (vw + 40) + vw + 40) % (vw + 40) - 20
      const y = (i * 41 + t * (260 + (i % 5) * 30)) % (GY + 20)
      line(ctx, [x, y], [x - 3, y + 9])
    }
    ctx.restore()
    return
  }
  const n = a.fall === 'ember' ? 26 : a.fall === 'blizzard' ? 60 : a.fall === 'ink' ? 30 : 20
  ctx.fillStyle = a.motes
  for (let i = 0; i < n; i++) {
    const r = (i * 97.13) % 1
    const speed = (a.fall === 'blizzard' ? 40 : 10) + ((i * 37) % 23)
    const rise = a.fall === 'ember' || a.fall === 'ink'
    let y = ((i * 53 + t * speed) % (GY + 40)) - 20
    if (rise) y = GY - y
    const drift = a.fall === 'blizzard' ? -t * 90 : 0
    const x = ((i * 131 + drift + Math.sin(t * 0.8 + i) * 18 - cam * (0.3 + r * 0.5)) % (vw + 40) + vw + 40) % (vw + 40) - 20
    ctx.globalAlpha = rise ? 0.55 + 0.4 * Math.sin(t * 5 + i) : 0.75
    if (a.fall === 'leaf' || a.fall === 'petal') {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(t * 2 + i)
      ctx.beginPath()
      ctx.ellipse(0, 0, 2.6, 1.2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    } else ctx.fillRect(x, y, rise ? 1.6 : 2, rise ? 1.6 : 2)
  }
  ctx.restore()
}

/** Dark grass and stones in front of the fighters, moving faster than the camera for depth. */
function foreground(ctx: CanvasRenderingContext2D, world: number, cam: number, t: number) {
  const col = ['#14261a', '#1a0b08', '#2a3036', '#0b0814', '#1c0905', '#12291f', '#05080d', '#b8c7d6', '#171a26', '#1b1030'][world] ?? '#111'
  ctx.fillStyle = col
  const span = vw + 120
  for (let i = 0; i < 14; i++) {
    const x = ((((i * 97 - cam * 1.25) % span) + span) % span) - 60
    const h = 8 + ((i * 7) % 9)
    if (i % 4 === 0) {
      ctx.beginPath()
      ctx.ellipse(x, VH + 2, 16, 7, 0, Math.PI, 0)
      ctx.fill()
      continue
    }
    ctx.beginPath()
    for (let k = -3; k <= 3; k++) {
      const bx = x + k * 3
      const sway = Math.sin(t * 1.6 + i + k) * 1.5
      ctx.moveTo(bx - 1.5, VH)
      ctx.quadraticCurveTo(bx + sway, VH - h * 0.6, bx + sway * 2 + k, VH - h - Math.abs(k))
      ctx.quadraticCurveTo(bx + sway, VH - h * 0.5, bx + 1.5, VH)
    }
    ctx.fill()
  }
}

/** Dust from feet: puffs when landing and while running. Purely cosmetic. */
interface Puff {
  x: number
  y: number
  vx: number
  r: number
  life: number
}
let puffs: Puff[] = []

function feet(s: Sim, dt: number) {
  for (const f of [s.hero, ...s.foes]) {
    if (f.dead || f.fly > 0) continue
    const was = lastY.get(f) ?? 0
    lastY.set(f, f.y)
    const g = Number.isFinite(f.gy) ? f.gy : -999
    const down = f.y <= g + 0.5
    if (was > g + 12 && down) for (let i = 0; i < 6; i++) puffs.push({ x: f.x + (i - 2.5) * 5, y: g, vx: (i - 2.5) * 22, r: 3 + Math.random() * 3, life: 0.5 })
    else if (down && Math.abs(f.vx) > 200 && Math.random() < dt * 14) puffs.push({ x: f.x - Math.sign(f.vx) * 6, y: g, vx: -Math.sign(f.vx) * 20, r: 2 + Math.random() * 2, life: 0.4 })
  }
  for (const p of puffs) {
    p.life -= dt
    p.x += p.vx * dt
    p.y += 14 * dt
    p.r += 10 * dt
  }
  puffs = puffs.filter((p) => p.life > 0).slice(-80)
}

function drawPuffs(ctx: CanvasRenderingContext2D, cam: number, world: number) {
  const col = ['200,190,160', '120,90,80', '220,220,225', '150,130,170', '170,110,80', '160,180,160', '120,140,160', '235,240,245', '210,210,220', '200,190,215'][world] ?? '200,200,200'
  for (const p of puffs) {
    ctx.fillStyle = `rgba(${col},${Math.max(0, p.life) * 0.7})`
    ctx.beginPath()
    ctx.arc(p.x - cam, GY - p.y, p.r, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Remember positions for afterimages while dashing or unleashing a special. */
function trackGhosts(s: Sim) {
  for (const f of [s.hero, ...s.foes]) {
    const fast = f.dashT > 0 || (f.move && (f.move.inv || (f.move.dash && f.moveT >= f.move.windup)))
    let g = ghosts.get(f)
    if (!g) ghosts.set(f, (g = []))
    if (fast && !f.dead) g.push({ x: f.x, y: f.y })
    else if (g.length) g.shift()
    if (g.length > 5) g.shift()
  }
}

function drawGhosts(ctx: CanvasRenderingContext2D, s: Sim, f: Fighter, cam: number) {
  const g = ghosts.get(f)
  if (!g || g.length < 2) return
  const tint = f.kind === 'hero' ? s.sword.color : (lookOf(s, f).glow ?? '#ffffff')
  g.slice(0, -1).forEach((p, i) => drawFighter(ctx, s, f, cam, { x: p.x, y: p.y, alpha: 0.08 + (i / g.length) * 0.22, tint }))
}

/** The boss's painted portrait sweeping in behind its name. */
function bossEntrance(ctx: CanvasRenderingContext2D, s: Sim) {
  if (!s.boss || !s.banner?.sub || s.boss.dead) return
  const img = paint(`nj-${s.boss.kind}`)
  if (!img) return
  const life = s.banner.t
  const a = Math.min(1, life * 1.5) * Math.min(1, (2.4 - life) * 4 + 0.2)
  const h = VH * 0.95
  const w = (h * img.naturalWidth) / img.naturalHeight
  const slide = Math.max(0, (life - 1.6) * 120)
  ctx.save()
  ctx.globalAlpha = Math.max(0, a) * 0.95
  const g = ctx.createLinearGradient(0, 0, vw, 0)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, vw, VH)
  ctx.drawImage(img, vw - w * 0.85 + slide, VH - h, w, h)
  ctx.restore()
}

function vignette(ctx: CanvasRenderingContext2D, s: Sim) {
  const v = ctx.createRadialGradient(vw / 2, VH * 0.55, VH * 0.3, vw / 2, VH * 0.55, Math.max(vw, VH) * 0.75)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,0,0,0.42)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, vw, VH)
  // Red edges when badly hurt.
  const hp = s.hero.hp / s.hero.maxHp
  if (hp < 0.3 && !s.hero.dead) {
    const r = ctx.createRadialGradient(vw / 2, VH / 2, VH * 0.35, vw / 2, VH / 2, Math.max(vw, VH) * 0.7)
    r.addColorStop(0, 'rgba(180,0,0,0)')
    r.addColorStop(1, `rgba(180,0,0,${(0.3 - hp) * (1.2 + Math.sin(s.t * 6) * 0.4)})`)
    ctx.fillStyle = r
    ctx.fillRect(0, 0, vw, VH)
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

export interface Pose {
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

export function poseOf(f: Fighter): Pose {
  if (f.move) {
    const p = movePose(f.move, f.moveT)
    return f.crouch ? { ...p, lean: p.lean + 0.3 } : p
  }
  if (f.crouch && f.blockT >= 0) return { phi: -0.1, psi: 1.4, ext: 0.75, lean: 0.25, live: false, spinning: false }
  if (f.crouch) return { phi: -0.35, psi: 0.2, ext: 0.9, lean: 0.35, live: false, spinning: false }
  if (f.blockT >= 0) return { phi: -0.2, psi: 1.45, ext: 0.8, lean: -0.05, live: false, spinning: false }
  if (f.hurtT > 0 || f.stunT > 0) return { phi: -1.7, psi: -2.2, ext: 1, lean: -0.35, live: false, spinning: false }
  const moving = Math.abs(f.vx) > 30 && f.y <= 0
  if (f.dashT > 0) return { phi: -2.6, psi: -2.9, ext: 1, lean: 0.5, live: false, spinning: false }
  if (moving) return { phi: -2.3, psi: -2.8, ext: 1, lean: 0.25, live: false, spinning: false }
  if (f.y > 0) return { phi: 0.4, psi: 1.1, ext: 1, lean: 0.1, live: false, spinning: false }
  return { phi: REST[0] + Math.sin(f.age * 2.2) * 0.04, psi: REST[1], ext: 1, lean: 0.04, live: false, spinning: false }
}

// ─── Figures ───────────────────────────────────────────────────────────

/** Recent [hand, tip] pairs of each fighter's live swing, for trails. */
const trails = new WeakMap<Fighter, Pt[][]>()
/** Recent positions while dashing or using a special, for afterimages. */
const ghosts = new WeakMap<Fighter, { x: number; y: number }[]>()
/** Height last frame, to puff dust on landing. */
const lastY = new WeakMap<Fighter, number>()

interface Look {
  /** Skin / ink of the figure. */
  body: string
  /** Clothing. */
  cloth: string
  /** Belt or trim. */
  trim: string
  /** Hakama (wide trousers) or a short tunic. */
  hakama: boolean
  weapon: Weapon
  blade: string
  len: number
  thick: number
  twin?: boolean
  glow?: string
}

/** Darken (k < 0) or lighten (k > 0) a #rrggbb colour. */
function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16)
  const f = (c: number) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k)
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`
}

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

function lookOf(s: Sim, f: Fighter): Look {
  if (f.kind === 'hero') {
    const sw = s.sword
    const glow = sw.burn || sw.lifesteal || sw.special === 'lightning' ? sw.color : undefined
    const el = s.arts.element ? ART_BY_ID[`el:${s.arts.element}`].color : undefined
    return { body: '#141418', cloth: s.armor.color, trim: '#c62828', hakama: true, weapon: 'sword', blade: sw.color, len: sw.reach * 0.66, thick: 1, twin: sw.twin, glow: glow ?? (s.meter >= 100 ? el : undefined) }
  }
  const d = FOES[f.kind as FoeKind]
  const len = d.weapon === 'spear' ? 70 : d.weapon === 'club' ? 38 : d.weapon === 'kunai' ? 14 : d.weapon === 'fan' ? 16 : d.weapon === 'bow' ? 26 : d.weapon === 'claw' ? 9 : 36
  const hakama = ['spear', 'ronin', 'shogun', 'kage', 'tengu', 'samurai', 'monk', 'frost', 'quiet', 'gasha', 'yurei'].includes(f.kind)
  const trim = f.kind === 'shogun' ? '#ffd54f' : f.kind === 'brute' ? '#e8d9b8' : f.kind === 'oni' ? '#f5c542' : f.kind === 'samurai' ? '#ffd54f' : f.kind === 'quiet' ? '#b388ff' : shade(d.color, 0.45)
  const BODY: Partial<Record<FoeKind, string>> = { oni: '#9e1c14', brute: '#6e2626', kappa: '#2e6b46', kappaking: '#225c3a', yurei: '#e8f6fc', gasha: '#efe9d8', storm: '#8a5a2b', quiet: '#0a0612' }
  const GLOW: Partial<Record<FoeKind, string>> = { kage: '#a26bff', shade: '#a26bff', shogun: '#ff9800', yurei: '#7fe7ff', gasha: '#7fe7ff', frost: '#bfe9ff', storm: '#ffe066', quiet: '#b388ff' }
  return {
    body: BODY[f.kind as FoeKind] ?? shade(d.color, -0.55),
    cloth: d.color,
    trim,
    hakama,
    weapon: d.weapon,
    blade: d.weapon === 'club' ? '#3b2a1a' : '#d8dde4',
    len,
    thick: f.kind === 'brute' || f.kind === 'oni' || f.kind === 'kappaking' ? 1.5 : f.kind === 'gasha' ? 0.75 : 1,
    glow: f.elite ? '#ffd54f' : GLOW[f.kind as FoeKind],
  }
}

function line(ctx: CanvasRenderingContext2D, a: Pt, b: Pt) {
  ctx.beginPath()
  ctx.moveTo(a[0], a[1])
  ctx.lineTo(b[0], b[1])
  ctx.stroke()
}

/** Add a tapered, round-ended stroke from a (width w0) to b (width w1) to the current path. */
function limb(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, w0: number, w1: number) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const th = Math.atan2(ny, nx)
  ctx.moveTo(a[0] + (nx * w0) / 2, a[1] + (ny * w0) / 2)
  ctx.lineTo(b[0] + (nx * w1) / 2, b[1] + (ny * w1) / 2)
  ctx.arc(b[0], b[1], w1 / 2, th, th + Math.PI, true)
  ctx.lineTo(a[0] - (nx * w0) / 2, a[1] - (ny * w0) / 2)
  ctx.arc(a[0], a[1], w0 / 2, th + Math.PI, th, true)
  ctx.closePath()
}

interface Rig {
  hip: Pt
  shoulder: Pt
  neck: Pt
  head: Pt
  legs: [Pt, Pt, Pt][]
  backHand: Pt
  backElbow: Pt
  hand: Pt
  elbow: Pt
}

function rig(f: Fighter, pose: Pose, sx: number, sy: number, look: Look): Rig {
  const sc = f.scale
  const P = (lx: number, ly: number): Pt => [sx + lx * f.face, sy - ly]
  const dirPt = (o: Pt, ang: number, len: number): Pt => [o[0] + Math.cos(ang) * len * f.face, o[1] - Math.sin(ang) * len]
  const moving = Math.abs(f.vx) > 30 && f.y <= 0 && !f.move && f.dashT <= 0
  const ph = f.x / (13 * sc)
  let legs: [number, number][]
  if (f.y > 2 && !f.dead) legs = [[0.7, 1.5], [-0.3, 0.7]]
  else if (moving) legs = [[Math.sin(ph) * 0.8, 0.25 + Math.max(0, Math.cos(ph)) * 1.1], [-Math.sin(ph) * 0.8, 0.25 + Math.max(0, -Math.cos(ph)) * 1.1]]
  else if (f.move || f.blockT >= 0 || f.dashT > 0) legs = [[0.5, 0.35], [-0.45, 0.2]]
  else legs = [[0.22, 0.12], [-0.22, 0.12]]
  if (f.kind === 'tengu' && f.y > 10) legs = [[0.3, 0.9], [0.1, 0.7]]
  // Crouching: front knee up, back knee almost on the ground, hips low.
  if (f.crouch) legs = [[1.1, 2.0], [-0.1, 1.39]]
  const hipY = f.crouch ? 14 * sc : 26 * sc + (moving ? Math.abs(Math.cos(ph)) * 2 : 0) - (f.move && pose.live ? 2 : 0) + (f.move || f.blockT >= 0 ? -1.5 : Math.sin(f.age * 2.2) * 0.5)
  const hip = P(0, hipY)
  const legPts = legs.map(([a, bend]): [Pt, Pt, Pt] => {
    const knee: Pt = [hip[0] + Math.sin(a) * 13 * sc * f.face, hip[1] + Math.cos(a) * 13 * sc]
    const b = a - bend
    const foot: Pt = [knee[0] + Math.sin(b) * 13 * sc * f.face, knee[1] + Math.cos(b) * 13 * sc]
    return [hip, knee, foot]
  })
  const lean = pose.lean
  const up = (len: number): Pt => [hip[0] + Math.sin(lean) * len * sc * f.face, hip[1] - Math.cos(lean) * len * sc]
  const shoulder = up(20)
  const backAng = moving ? -1.57 - Math.sin(ph) * 0.9 : f.move ? -2.4 : -2.0
  const backHand = dirPt(shoulder, look.twin ? (pose.live ? pose.phi + 2.2 : -2.5) : backAng, 15 * sc)
  const hand = dirPt(shoulder, pose.phi, 16 * sc * pose.ext)
  const bend = (a: Pt, b: Pt, k: number): Pt => [(a[0] + b[0]) / 2 - k * f.face, (a[1] + b[1]) / 2 + Math.abs(k)]
  return { hip, shoulder, neck: up(24), head: up(32), legs: legPts, backHand, backElbow: bend(shoulder, backHand, 1.5), hand, elbow: bend(shoulder, hand, 2) }
}

interface At {
  x: number
  y: number
  alpha: number
  tint?: string
}

/**
 * Draw a fighter. `mode`: 'full' (the stick figure), 'shadow' (just its
 * shadow, under a 3D body), 'fx' (only what goes over a 3D body: trails,
 * marks, ice, barrier).
 */
function drawFighter(ctx: CanvasRenderingContext2D, s: Sim, f: Fighter, cam: number, at?: At, mode: 'full' | 'shadow' | 'fx' = 'full') {
  const sc = f.scale
  const look = lookOf(s, f)
  const pose = poseOf(f)
  const fx = at ? at.x : f.x
  const fy = at ? at.y : f.y
  const sx = fx - cam
  const sy = GY - fy
  const R = rig(f, pose, sx, sy, look)
  const ghost = !!at

  ctx.save()
  if (!ghost && mode !== 'fx' && Number.isFinite(f.gy)) {
    const gy = GY + 2 - f.gy
    const sh = ctx.createRadialGradient(sx, gy, 1, sx, gy, 20 * sc)
    sh.addColorStop(0, `rgba(0,0,0,${0.38 * Math.max(0.3, 1 - (fy - f.gy) / 260)})`)
    sh.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = sh
    ctx.beginPath()
    ctx.ellipse(sx, gy, 20 * sc, 4.5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  if (mode === 'shadow') {
    ctx.restore()
    return
  }
  let tip: Pt
  if (mode === 'fx') tip = [R.hand[0] + Math.cos(pose.psi) * f.face * look.len * sc, R.hand[1] - Math.sin(pose.psi) * look.len * sc]
  else {
  if (f.dead) {
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, f.deadT - 0.8) / 0.8)
    ctx.translate(sx, sy)
    ctx.rotate(-f.face * Math.min(1, f.deadT * 5) * (Math.PI / 2) * (f.vx * f.face > 0 ? -1 : 1))
    ctx.translate(-sx, -sy)
  }
  if (ghost) ctx.globalAlpha = at.alpha
  if (f.kind === 'shade') ctx.globalAlpha *= 0.7
  if (f.kind === 'yurei') ctx.globalAlpha *= 0.62 + 0.15 * Math.sin(s.t * 3 + f.uid)
  // A gold aura for elites; the hero's element shimmering when the special is ready.
  const aura = !ghost && !f.dead ? (f.elite ? '#ffd54f' : f.kind === 'hero' && s.meter >= 100 && s.arts.element ? ART_BY_ID[`el:${s.arts.element}`].color : null) : null
  if (aura) {
    const ag = ctx.createRadialGradient(sx, sy - 34 * sc, 4, sx, sy - 34 * sc, 46 * sc)
    ag.addColorStop(0, hexA(aura, 0.35 + 0.1 * Math.sin(s.t * 6)))
    ag.addColorStop(1, hexA(aura, 0))
    ctx.fillStyle = ag
    ctx.fillRect(sx - 50 * sc, sy - 84 * sc, 100 * sc, 100 * sc)
  }
  if (!ghost && f.inv > 0 && f.team === 0 && !f.move && Math.floor(f.inv * 20) % 2 === 0) ctx.globalAlpha *= 0.45
  const fullMeter = f.kind === 'hero' && s.meter >= 100
  const glow = look.glow ?? (fullMeter ? s.sword.color : undefined)
  const flash = f.flash > 0
  const chilled = f.chillT > 0 || (f.stunT > 0.6 && f.chillT > 0)
  const body = ghost ? at.tint! : flash ? '#ffffff' : chilled ? '#9fd8f5' : look.body
  const cloth = ghost ? at.tint! : flash ? '#ffffff' : chilled ? '#cdeefc' : look.cloth
  const back = ghost ? at.tint! : flash ? '#f0f0f0' : shade(look.body.startsWith('#') ? look.body : '#202020', -0.35)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const T = look.thick * sc

  // Back limbs, in shadow.
  ctx.fillStyle = back
  ctx.beginPath()
  const [bh, bk, bf] = R.legs[1]
  limb(ctx, bh, bk, 5.2 * T, 3.8 * T)
  limb(ctx, bk, bf, 3.8 * T, 2.8 * T)
  limb(ctx, R.shoulder, R.backElbow, 3.6 * T, 3 * T)
  limb(ctx, R.backElbow, R.backHand, 3 * T, 2.4 * T)
  ctx.fill()
  if (look.twin) blade(ctx, s, f, R.backHand, look.twin && pose.live ? pose.psi + 2.4 : -2.8, look.len * 0.9 * sc, look, ghost)

  // Body: front leg, torso, neck, head.
  if (glow && !ghost) {
    ctx.shadowColor = glow
    ctx.shadowBlur = fullMeter ? 14 : 9
  }
  ctx.fillStyle = body
  ctx.beginPath()
  const [fh, fk, ff] = R.legs[0]
  limb(ctx, fh, fk, 5.4 * T, 4 * T)
  limb(ctx, fk, ff, 4 * T, 3 * T)
  limb(ctx, R.hip, R.neck, (f.kind === 'brute' ? 11 : 6.5) * T, (f.kind === 'brute' ? 12 : 8) * T)
  ctx.moveTo(R.head[0] + 7.6 * sc, R.head[1])
  ctx.arc(R.head[0], R.head[1], 7.6 * sc, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  // Clothing.
  ctx.fillStyle = cloth
  ctx.beginPath()
  if (look.hakama) {
    // Wide trousers flaring from the waist to below the knees.
    const k0 = R.legs[0][1]
    const k1 = R.legs[1][1]
    const w = 4.5 * T
    ctx.moveTo(R.hip[0] - w, R.hip[1] - 4 * sc)
    ctx.lineTo(R.hip[0] + w, R.hip[1] - 4 * sc)
    const front = f.face > 0 ? Math.max(k0[0], k1[0]) : Math.min(k0[0], k1[0])
    const rear = f.face > 0 ? Math.min(k0[0], k1[0]) : Math.max(k0[0], k1[0])
    const ky = Math.max(k0[1], k1[1]) + 4 * sc
    const sway = Math.sin(s.t * 6 + f.uid) * 1.2 + (Math.abs(f.vx) > 30 ? -f.face * 3 : 0)
    ctx.lineTo(front + f.face * 5 * sc, ky)
    ctx.quadraticCurveTo((front + rear) / 2, ky + 3 * sc, rear - f.face * 5 * sc + sway, ky)
    ctx.closePath()
  }
  // Jacket over the torso.
  limb(ctx, [R.hip[0], R.hip[1] - 2 * sc], R.shoulder, (f.kind === 'brute' ? 0 : 7.6) * T, (f.kind === 'brute' ? 0 : 9.2) * T)
  ctx.fill()
  // Belt.
  if (!ghost) {
    ctx.strokeStyle = flash ? '#fff' : look.trim
    ctx.lineWidth = 2.4 * sc
    line(ctx, [R.hip[0] - 4.6 * T, R.hip[1] - 3 * sc], [R.hip[0] + 4.6 * T, R.hip[1] - 3 * sc])
  }
  // Front arm and weapon.
  ctx.fillStyle = body
  ctx.beginPath()
  limb(ctx, R.shoulder, R.elbow, 4 * T, 3.2 * T)
  limb(ctx, R.elbow, R.hand, 3.2 * T, 2.6 * T)
  ctx.fill()
  if (!ghost && !flash) {
    // Sleeve.
    ctx.fillStyle = cloth
    ctx.beginPath()
    limb(ctx, R.shoulder, [lerp(R.shoulder[0], R.elbow[0], 0.7), lerp(R.shoulder[1], R.elbow[1], 0.7)], 5 * T, 4.4 * T)
    ctx.fill()
    // Rim light on the head and back.
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(R.head[0], R.head[1], 6.8 * sc, -Math.PI * 0.95, -Math.PI * 0.35)
    ctx.stroke()
    // Eye.
    if (f.kind !== 'thrower' && f.kind !== 'assassin' && f.kind !== 'shade' && f.kind !== 'kage' && f.kind !== 'oni') {
      ctx.fillStyle = f.kind === 'hero' ? '#ffffff' : '#f3e6c4'
      ctx.fillRect(R.head[0] + f.face * 3 * sc - 1.2, R.head[1] - 1.5 * sc, 2.6 * sc, 1.3 * sc)
    }
  }
  tip = blade(ctx, s, f, R.hand, pose.psi, look.len * sc, look, ghost)
  if (!ghost) extras(ctx, s, f, R.head, sc, body)
  }
  if (!ghost && !f.dead) {
    // Shadow's mark: a violet sigil over the head.
    if (f.markT > 0) {
      ctx.strokeStyle = `rgba(179,136,255,${0.6 + 0.3 * Math.sin(s.t * 8)})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(R.head[0], R.head[1] - 16 * sc, 5, 0, Math.PI * 2)
      ctx.moveTo(R.head[0] - 5, R.head[1] - 16 * sc)
      ctx.lineTo(R.head[0] + 5, R.head[1] - 16 * sc)
      ctx.stroke()
    }
    // Frozen solid: an ice shell.
    if (f.stunT > 0 && f.chillT > 0) {
      ctx.fillStyle = 'rgba(190,235,255,0.35)'
      ctx.strokeStyle = 'rgba(230,250,255,0.8)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(sx - 15 * sc, sy - 72 * sc, 30 * sc, 74 * sc, 4)
      ctx.fill()
      ctx.stroke()
    }
    // The Ink Barrier around the hero.
    if (f.kind === 'hero' && s.barrier > 0) {
      ctx.strokeStyle = `rgba(77,208,225,${0.45 + 0.25 * Math.sin(s.t * 10)})`
      ctx.fillStyle = 'rgba(77,208,225,0.08)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.ellipse(sx, sy - 34, 26, 40, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  }
  ctx.restore()
  if (ghost) return

  // Sword trail: a glowing ribbon through the last few frames of the swing.
  let tr = trails.get(f)
  if (!tr) trails.set(f, (tr = []))
  if (pose.live && look.weapon !== 'kunai') tr.push([R.hand, tip])
  else if (tr.length) tr.splice(0, 2)
  if (tr.length > 9) tr.shift()
  if (tr.length > 1) {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    const col = f.kind === 'hero' ? look.blade : '#ffffff'
    for (let i = 1; i < tr.length; i++) {
      const [h0, t0] = tr[i - 1]
      const [h1, t1] = tr[i]
      ctx.fillStyle = hexA(col.startsWith('#') ? col : '#ffffff', (i / tr.length) * (f.kind === 'hero' ? 0.55 : 0.3))
      ctx.beginPath()
      ctx.moveTo(t0[0], t0[1])
      ctx.lineTo(t1[0], t1[1])
      ctx.lineTo(lerp(h1[0], t1[0], 0.35), lerp(h1[1], t1[1], 0.35))
      ctx.lineTo(lerp(h0[0], t0[0], 0.35), lerp(h0[1], t0[1], 0.35))
      ctx.fill()
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    tr.forEach(([, t], i) => (i ? ctx.lineTo(t[0], t[1]) : ctx.moveTo(t[0], t[1])))
    ctx.stroke()
    ctx.restore()
  }
  // Stun stars.
  if (f.stunT > 0 && !f.dead) {
    ctx.fillStyle = '#ffe066'
    for (let i = 0; i < 3; i++) {
      const a = s.t * 6 + (i * Math.PI * 2) / 3
      ctx.fillRect(R.head[0] + Math.cos(a) * 11 * sc - 1.5, R.head[1] - 11 * sc + Math.sin(a) * 3 - 1.5, 3, 3)
    }
  }
}

function blade(ctx: CanvasRenderingContext2D, s: Sim, f: Fighter, hand: Pt, psi: number, len: number, look: Look, ghost: boolean): Pt {
  const dx = Math.cos(psi) * f.face
  const dy = -Math.sin(psi)
  const nx = -dy
  const ny = dx
  const tip: Pt = [hand[0] + dx * len, hand[1] + dy * len]
  ctx.save()
  if (ghost) {
    ctx.strokeStyle = ctx.fillStyle
    ctx.lineWidth = 2
    line(ctx, hand, tip)
    ctx.restore()
    return tip
  }
  if (look.weapon === 'spear') {
    const g = ctx.createLinearGradient(hand[0] + nx * 2, hand[1] + ny * 2, hand[0] - nx * 2, hand[1] - ny * 2)
    g.addColorStop(0, '#9c7448')
    g.addColorStop(1, '#4e3520')
    ctx.strokeStyle = g
    ctx.lineWidth = 2.4 * f.scale
    line(ctx, [hand[0] - dx * len * 0.35, hand[1] - dy * len * 0.35], tip)
    ctx.fillStyle = '#e3e9ee'
    ctx.beginPath()
    ctx.moveTo(tip[0] + dx * 11, tip[1] + dy * 11)
    ctx.lineTo(tip[0] - dy * 3.2, tip[1] + dx * 3.2)
    ctx.lineTo(tip[0] + dy * 3.2, tip[1] - dx * 3.2)
    ctx.fill()
    ctx.fillStyle = '#b71c1c'
    ctx.fillRect(tip[0] - 2, tip[1] - 2, 4, 4)
  } else if (look.weapon === 'club') {
    ctx.fillStyle = look.blade
    ctx.beginPath()
    limb(ctx, hand, tip, 4 * f.scale, 8 * f.scale)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.lineWidth = 1
    line(ctx, [hand[0] + nx * 1.5, hand[1] + ny * 1.5], [tip[0] + nx * 3, tip[1] + ny * 3])
    if (f.kind === 'oni') {
      ctx.fillStyle = '#c9c9c9'
      for (let k = 1; k < 6; k++) {
        const u = 0.2 + k * 0.15
        for (const side of [-1, 1]) ctx.fillRect(hand[0] + dx * len * u + nx * side * 4 * f.scale - 1.5, hand[1] + dy * len * u + ny * side * 4 * f.scale - 1.5, 3, 3)
      }
    }
  } else if (look.weapon === 'bow') {
    // A tall yumi bow held upright, string drawn back on the throw.
    const a0 = Math.atan2(dy, dx)
    ctx.strokeStyle = '#5d3a1a'
    ctx.lineWidth = 2 * f.scale
    ctx.beginPath()
    ctx.arc(hand[0] - dx * 8, hand[1] - dy * 8, len * 0.9, a0 - 1.1, a0 + 1.1)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(240,240,240,0.8)'
    ctx.lineWidth = 0.7
    const c = [hand[0] - dx * 8, hand[1] - dy * 8]
    line(ctx, [c[0] + Math.cos(a0 - 1.1) * len * 0.9, c[1] + Math.sin(a0 - 1.1) * len * 0.9], [c[0] + Math.cos(a0 + 1.1) * len * 0.9, c[1] + Math.sin(a0 + 1.1) * len * 0.9])
  } else if (look.weapon === 'claw') {
    // Clawed hands (kappa, ghosts, bones).
    ctx.strokeStyle = f.kind === 'gasha' ? '#efe9d8' : f.kind === 'yurei' ? 'rgba(232,246,252,0.8)' : '#1d4a2f'
    ctx.lineWidth = 1.4 * f.scale
    for (const k of [-0.5, 0, 0.5]) line(ctx, hand, [hand[0] + Math.cos(Math.atan2(dy, dx) + k) * len, hand[1] + Math.sin(Math.atan2(dy, dx) + k) * len])
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
    ctx.strokeStyle = 'rgba(122,31,31,0.5)'
    for (let k = -2; k <= 2; k++) line(ctx, hand, [hand[0] + Math.cos(a0 + k * 0.25) * len * 1.25, hand[1] + Math.sin(a0 + k * 0.25) * len * 1.25])
  } else {
    // Hilt, guard, then a curved, tapering blade with a bright edge.
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.8 * f.scale
    line(ctx, [hand[0] - dx * 7 * f.scale, hand[1] - dy * 7 * f.scale], hand)
    ctx.strokeStyle = '#c62828'
    ctx.lineWidth = 1
    for (let k = 1; k < 4; k++) line(ctx, [hand[0] - dx * k * 1.8 * f.scale - nx * 1.2, hand[1] - dy * k * 1.8 * f.scale - ny * 1.2], [hand[0] - dx * k * 1.8 * f.scale + nx * 1.2, hand[1] - dy * k * 1.8 * f.scale + ny * 1.2])
    ctx.fillStyle = '#d4a52a'
    ctx.beginPath()
    ctx.ellipse(hand[0], hand[1], 1.6, 3.6, Math.atan2(dy, dx), 0, Math.PI * 2)
    ctx.fill()
    const w = (look.weapon === 'kunai' ? 2.2 : 2.6) * f.scale
    const curve = look.weapon === 'kunai' ? 0 : len * 0.07
    const mid: Pt = [hand[0] + dx * len * 0.55 - nx * curve * f.face, hand[1] + dy * len * 0.55 - ny * curve * f.face]
    const g = ctx.createLinearGradient(mid[0] + nx * w, mid[1] + ny * w, mid[0] - nx * w, mid[1] - ny * w)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.45, look.blade)
    g.addColorStop(1, shade(look.blade.startsWith('#') ? look.blade : '#cccccc', -0.45))
    if (look.glow && f.kind === 'hero') {
      ctx.shadowColor = look.glow
      ctx.shadowBlur = 10
    }
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(hand[0] + (nx * w) / 2, hand[1] + (ny * w) / 2)
    ctx.quadraticCurveTo(mid[0] + (nx * w) / 2, mid[1] + (ny * w) / 2, tip[0], tip[1])
    ctx.quadraticCurveTo(mid[0] - (nx * w) / 2, mid[1] - (ny * w) / 2, hand[0] - (nx * w) / 2, hand[1] - (ny * w) / 2)
    ctx.closePath()
    ctx.fill()
    ctx.shadowBlur = 0
    // A glint sliding along the steel.
    const u = (s.t * 0.7 + f.uid * 0.37) % 1.8
    if (u < 1) {
      const gx = lerp(hand[0], tip[0], u)
      const gy = lerp(hand[1], tip[1], u)
      ctx.globalCompositeOperation = 'lighter'
      const rg = ctx.createRadialGradient(gx, gy, 0, gx, gy, 5)
      rg.addColorStop(0, 'rgba(255,255,255,0.9)')
      rg.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = rg
      ctx.fillRect(gx - 5, gy - 5, 10, 10)
    }
  }
  ctx.restore()
  return tip
}

/** What the hero's chosen armour looks like on the stick figure. */
function heroArmour(ctx: CanvasRenderingContext2D, s: Sim, f: Fighter, head: Pt, sc: number) {
  const a = s.armor
  const fc = f.face
  const t = s.t
  // the torso, roughly, from the head down
  const neck: Pt = [head[0] - fc * 1, head[1] + 9 * sc]
  const hip: Pt = [head[0] - fc * 3, head[1] + (f.crouch ? 26 : 31) * sc]
  const plate = (fill: string) => {
    ctx.fillStyle = fill
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = 0.8
  }
  const pauldrons = (fill: string, big = false) => {
    plate(fill)
    ctx.beginPath()
    ctx.roundRect(head[0] - (big ? 11 : 9) - fc, head[1] + 7, big ? 22 : 18, big ? 7 : 5, 2)
    ctx.fill()
    ctx.stroke()
  }
  const skirt = (fill: string, rows = 2) => {
    plate(fill)
    for (let r = 0; r < rows; r++) {
      ctx.beginPath()
      ctx.roundRect(hip[0] - 8 * sc, hip[1] - 4 * sc + r * 4 * sc, 16 * sc, 4 * sc, 1)
      ctx.fill()
      ctx.stroke()
    }
  }
  const scarf = (color: string, len: number) => {
    ctx.strokeStyle = color
    ctx.lineWidth = 2.2
    ctx.beginPath()
    ctx.moveTo(neck[0], neck[1])
    for (let i = 1; i <= len; i++) ctx.lineTo(neck[0] - fc * i * 5, neck[1] + i * 1.6 + Math.sin(t * 9 + i) * 2)
    ctx.stroke()
  }
  switch (a.id) {
    case 'kusari':
      // chain mail glinting through the jacket
      ctx.strokeStyle = 'rgba(200,210,220,0.55)'
      ctx.lineWidth = 0.6
      for (let k = 0; k < 4; k++) line(ctx, [neck[0] - 5 * sc, neck[1] + 4 + k * 4 * sc], [neck[0] + 5 * sc, neck[1] + 4 + k * 4 * sc])
      break
    case 'lacquer':
      pauldrons(a.color)
      plate(shade(a.color, 0.15))
      ctx.beginPath()
      ctx.roundRect(neck[0] - 6 * sc, neck[1] + 2, 12 * sc, 14 * sc, 3)
      ctx.fill()
      ctx.stroke()
      break
    case 'oyoroi':
    case 'frost-mail':
    case 'dragon-armour':
      pauldrons(a.color, true)
      skirt(a.id === 'dragon-armour' ? '#a8862a' : shade(a.color, -0.15), 3)
      if (a.id === 'dragon-armour') {
        ctx.fillStyle = '#ffd54f'
        ctx.fillRect(neck[0] - 1, neck[1] + 4, 2, 8)
      }
      if (a.id === 'frost-mail') scarf('rgba(255,255,255,0.9)', 5)
      break
    case 'oni-hide':
      pauldrons(a.color)
      // shaggy fur at the shoulders
      ctx.fillStyle = '#5d1a12'
      for (let k = -2; k <= 2; k++) ctx.fillRect(head[0] + k * 3.5 - fc, head[1] + 12, 2, 3)
      break
    case 'tengu-cloak': {
      // a black feather cape streaming behind
      const flap = Math.sin(t * 7) * 2 + Math.min(1, Math.abs(f.vx) / 250) * 6
      ctx.fillStyle = '#1b1f1c'
      ctx.beginPath()
      ctx.moveTo(neck[0], neck[1])
      ctx.quadraticCurveTo(neck[0] - fc * (12 + flap), neck[1] + 12, hip[0] - fc * (14 + flap), hip[1] + 6)
      ctx.lineTo(hip[0] - fc * 2, hip[1] + 2)
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'kage-garb':
      scarf('#7c4dbd', 6)
      break
    case 'kappa-shell':
      // a green shell on the back
      plate('#2e6b46')
      ctx.beginPath()
      ctx.ellipse(neck[0] - fc * 6 * sc, neck[1] + 10 * sc, 6 * sc, 10 * sc, fc * 0.15, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.strokeStyle = 'rgba(200,240,210,0.35)'
      line(ctx, [neck[0] - fc * 6 * sc, neck[1] + 2], [neck[0] - fc * 6 * sc, neck[1] + 18 * sc])
      break
    case 'monk-robe':
      // a long pale robe to the shins
      ctx.fillStyle = 'rgba(224,214,194,0.92)'
      ctx.beginPath()
      ctx.moveTo(neck[0] - 5, neck[1])
      ctx.lineTo(neck[0] + 5, neck[1])
      ctx.lineTo(hip[0] + 9 * sc, hip[1] + 12 * sc)
      ctx.lineTo(hip[0] - 9 * sc, hip[1] + 12 * sc)
      ctx.closePath()
      ctx.fill()
      break
    case 'tennin-robe':
      // a heavenly scarf floating in loops
      ctx.strokeStyle = 'rgba(248,187,208,0.9)'
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(neck[0] + fc * 6, neck[1])
      ctx.bezierCurveTo(neck[0] + fc * 14, neck[1] - 10 + Math.sin(t * 2) * 3, neck[0] - fc * 18, neck[1] - 8, neck[0] - fc * 20, neck[1] + 14 + Math.sin(t * 2.5) * 3)
      ctx.stroke()
      break
  }
}

function extras(ctx: CanvasRenderingContext2D, s: Sim, f: Fighter, head: Pt, sc: number, ink: string) {
  const fc = f.face
  ctx.save()
  switch (f.kind) {
    case 'hero': {
      heroArmour(ctx, s, f, head, sc)
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
    case 'kappa':
    case 'kappaking': {
      // The water dish on the head (and the king's reed crown), and a shell.
      ctx.fillStyle = '#d8efe4'
      ctx.beginPath()
      ctx.ellipse(head[0], head[1] - 6 * sc, 6 * sc, 2.2 * sc, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#5fb3d0'
      ctx.beginPath()
      ctx.ellipse(head[0], head[1] - 6.5 * sc, 4 * sc, 1.2 * sc, 0, 0, Math.PI * 2)
      ctx.fill()
      if (f.kind === 'kappaking') {
        ctx.strokeStyle = '#c9a227'
        ctx.lineWidth = 1.4
        for (let k = -3; k <= 3; k++) line(ctx, [head[0] + k * 2 * sc, head[1] - 7 * sc], [head[0] + k * 2.6 * sc, head[1] - 13 * sc])
      }
      ctx.fillStyle = '#5b4a2a'
      ctx.beginPath()
      ctx.ellipse(head[0] - fc * 7 * sc, head[1] + 22 * sc, 7 * sc, 12 * sc, fc * 0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffe14d'
      ctx.fillRect(head[0] + fc * 3 * sc - 1, head[1] - 1, 2.4, 2.4)
      break
    }
    case 'yurei':
      // Long black hair over a pale face; a triangular headband.
      ctx.fillStyle = '#0d0d12'
      ctx.beginPath()
      ctx.moveTo(head[0] - 7 * sc, head[1] - 4 * sc)
      ctx.quadraticCurveTo(head[0], head[1] - 10 * sc, head[0] + 7 * sc, head[1] - 4 * sc)
      ctx.lineTo(head[0] + fc * 3 * sc, head[1] + 20 * sc)
      ctx.lineTo(head[0] - fc * 9 * sc, head[1] + 16 * sc)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(head[0] - 2, head[1] - 7 * sc)
      ctx.lineTo(head[0] + 2, head[1] - 7 * sc)
      ctx.lineTo(head[0], head[1] - 11 * sc)
      ctx.fill()
      break
    case 'archer':
      ctx.fillStyle = '#3a2e18'
      ctx.beginPath()
      ctx.ellipse(head[0], head[1] - 4 * sc, 10 * sc, 3 * sc, 0, Math.PI, 0)
      ctx.fill()
      // Quiver.
      ctx.fillStyle = '#5d3a1a'
      ctx.fillRect(head[0] - fc * 7 * sc - 2, head[1] + 10 * sc, 4, 16 * sc)
      ctx.fillStyle = '#eee'
      for (let k = 0; k < 3; k++) ctx.fillRect(head[0] - fc * 7 * sc - 2 + k * 1.4, head[1] + 6 * sc, 1, 4)
      break
    case 'monk':
      // A white hood wrapped round the head.
      ctx.fillStyle = '#f5f5f5'
      ctx.beginPath()
      ctx.arc(head[0], head[1], 8.4 * sc, Math.PI * 0.9, Math.PI * 2.1)
      ctx.lineTo(head[0] - fc * 6 * sc, head[1] + 10 * sc)
      ctx.fill()
      break
    case 'samurai':
    case 'frost': {
      // Kabuto helmet with a crest.
      ctx.fillStyle = f.kind === 'frost' ? '#bcd8ea' : '#2b0d16'
      ctx.beginPath()
      ctx.arc(head[0], head[1] - 1, 8.4 * sc, Math.PI, 0)
      ctx.fill()
      ctx.fillRect(head[0] - 10 * sc, head[1] - 1, 20 * sc, 2.4 * sc)
      ctx.strokeStyle = f.kind === 'frost' ? '#ffffff' : '#ffd54f'
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.moveTo(head[0] - 6 * sc, head[1] - 14 * sc)
      ctx.lineTo(head[0], head[1] - 6 * sc)
      ctx.lineTo(head[0] + 6 * sc, head[1] - 14 * sc)
      ctx.stroke()
      if (f.kind === 'frost') {
        // A long white scarf.
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(head[0] - fc * 3, head[1] + 8 * sc)
        for (let i = 1; i <= 5; i++) ctx.lineTo(head[0] - fc * (3 + i * 6), head[1] + 8 * sc + i * 1.2 + Math.sin(s.t * 9 + i) * 2.4)
        ctx.stroke()
      }
      break
    }
    case 'gasha':
      // A skull: dark sockets with ghost-fire.
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.arc(head[0] + fc * 1.5 * sc, head[1] - 1, 1.8 * sc, 0, Math.PI * 2)
      ctx.arc(head[0] + fc * 5 * sc, head[1] - 1, 1.6 * sc, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = `rgba(127,231,255,${0.7 + 0.3 * Math.sin(s.t * 9)})`
      ctx.fillRect(head[0] + fc * 1.5 * sc - 0.8, head[1] - 1.8, 1.6, 1.6)
      ctx.fillRect(head[0] + fc * 5 * sc - 0.8, head[1] - 1.8, 1.6, 1.6)
      // Ribs.
      ctx.strokeStyle = 'rgba(40,36,30,0.6)'
      ctx.lineWidth = 0.8
      for (let k = 0; k < 4; k++) line(ctx, [head[0] - 5 * sc, head[1] + (12 + k * 4) * sc], [head[0] + 5 * sc, head[1] + (12 + k * 4) * sc])
      break
    case 'storm': {
      // Wild golden hair and a ring of drums.
      ctx.strokeStyle = '#f2c94c'
      ctx.lineWidth = 1.6
      for (let k = -4; k <= 4; k++) line(ctx, [head[0] + k * 1.6 * sc, head[1] - 6 * sc], [head[0] + k * 3 * sc, head[1] - (14 + Math.abs(Math.sin(s.t * 12 + k)) * 4) * sc])
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + s.t * 0.6
        const x = head[0] + Math.cos(a) * 26 * sc
        const y = head[1] + 14 * sc + Math.sin(a) * 10 * sc
        ctx.fillStyle = '#5d2a12'
        ctx.beginPath()
        ctx.arc(x, y, 4 * sc, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#f2c94c'
        ctx.beginPath()
        ctx.arc(x, y, 1.6 * sc, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'quiet': {
      // A hood with no face, peeling into ink.
      ctx.fillStyle = '#0a0612'
      ctx.beginPath()
      ctx.arc(head[0], head[1], 9 * sc, Math.PI * 0.85, Math.PI * 2.15)
      ctx.lineTo(head[0] - fc * 10 * sc, head[1] + 12 * sc)
      ctx.fill()
      ctx.fillStyle = '#b388ff'
      ctx.font = `${7 * sc}px serif`
      ctx.textAlign = 'center'
      for (let k = 0; k < 3; k++) {
        const u = (s.t * 0.6 + k / 3) % 1
        ctx.globalAlpha = 1 - u
        ctx.fillText('言葉心'[k], head[0] - fc * (8 + u * 30), head[1] - u * 26)
      }
      ctx.globalAlpha = 1
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
  // A telegraph while the shot waits: a warning mark where it will strike.
  if (sh.delay && sh.age < sh.delay) {
    const u = sh.age / sh.delay
    const col = sh.team === 0 ? '120,230,255' : sh.kind === 'bolt' ? '255,230,90' : '255,80,60'
    ctx.strokeStyle = `rgba(${col},${0.35 + 0.5 * u})`
    ctx.fillStyle = `rgba(${col},${0.12 + 0.2 * u})`
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(x, GY + 1, sh.r * (1.4 - 0.4 * u), 4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    if (sh.kind === 'bolt') {
      ctx.fillStyle = `rgba(255,240,150,${0.1 + 0.25 * u})`
      ctx.fillRect(x - 2, 0, 4, GY)
    }
    ctx.restore()
    return
  }
  const tint = sh.tint
  if (tint) {
    ctx.shadowColor = tint
    ctx.shadowBlur = 12
  }
  switch (sh.kind) {
    case 'water':
      ctx.fillStyle = 'rgba(120,200,230,0.9)'
      ctx.beginPath()
      ctx.arc(x, y, sh.r * 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillRect(x - 2, y - 3, 2, 2)
      break
    case 'wisp': {
      const g = ctx.createRadialGradient(x, y, 1, x, y, sh.r * 1.8)
      g.addColorStop(0, 'rgba(230,255,255,0.95)')
      g.addColorStop(0.4, 'rgba(127,231,255,0.7)')
      g.addColorStop(1, 'rgba(127,231,255,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, sh.r * 1.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(127,231,255,0.4)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.quadraticCurveTo(x - Math.sign(sh.vx || 1) * 10, y + 6 + Math.sin(t * 9) * 3, x - Math.sign(sh.vx || 1) * 18, y + 2)
      ctx.stroke()
      break
    }
    case 'arrow': {
      const a = Math.atan2(-sh.vy, sh.vx)
      ctx.translate(x, y)
      ctx.rotate(a)
      ctx.strokeStyle = '#6d4c2b'
      ctx.lineWidth = 1.4
      line(ctx, [-12, 0], [8, 0])
      ctx.fillStyle = '#cfd8dc'
      ctx.beginPath()
      ctx.moveTo(11, 0)
      ctx.lineTo(7, -2.5)
      ctx.lineTo(7, 2.5)
      ctx.fill()
      ctx.fillStyle = '#e0e0e0'
      ctx.fillRect(-13, -2.5, 4, 1.4)
      ctx.fillRect(-13, 1.1, 4, 1.4)
      break
    }
    case 'ice':
      ctx.fillStyle = 'rgba(190,235,255,0.9)'
      for (let i = 0; i < 4; i++) {
        const bx = x - dir * i * 9
        const h = sh.r * (1.6 - i * 0.3)
        ctx.beginPath()
        ctx.moveTo(bx - 5, GY)
        ctx.lineTo(bx, GY - h)
        ctx.lineTo(bx + 5, GY)
        ctx.fill()
      }
      break
    case 'bolt': {
      ctx.strokeStyle = sh.team === 0 ? '#bdf3ff' : '#fff59d'
      ctx.shadowColor = '#ffe066'
      ctx.shadowBlur = 16
      ctx.lineWidth = 3
      ctx.beginPath()
      let bx = x
      ctx.moveTo(bx, 0)
      for (let yy = 20; yy <= GY; yy += 20) {
        bx = x + (Math.sin(yy * 0.37 + t * 40) * 8)
        ctx.lineTo(bx, yy)
      }
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,250,200,0.5)'
      ctx.beginPath()
      ctx.ellipse(x, GY, 26, 6, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'ink':
      ctx.fillStyle = tint ?? 'rgba(20,10,35,0.92)'
      ctx.beginPath()
      ctx.ellipse(x, y, sh.r * 0.5, sh.r * 1.2, 0, -Math.PI / 2, Math.PI / 2, dir < 0)
      ctx.fill()
      ctx.fillStyle = 'rgba(179,136,255,0.6)'
      for (let i = 0; i < 4; i++) ctx.fillRect(x - dir * (6 + i * 7), y + Math.sin(t * 10 + i) * sh.r * 0.8, 3, 3)
      break
    case 'bone':
      ctx.translate(x, y)
      ctx.rotate(t * 8 + sh.x)
      ctx.fillStyle = tint === '#1b1030' ? '#1b1030' : '#efe9d8'
      ctx.fillRect(-7, -1.6, 14, 3.2)
      for (const e of [-7, 7]) {
        ctx.beginPath()
        ctx.arc(e, -1.6, 2.2, 0, Math.PI * 2)
        ctx.arc(e, 1.6, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    case 'firefly': {
      const g = ctx.createRadialGradient(x, y, 0, x, y, 9)
      g.addColorStop(0, 'rgba(250,255,190,1)')
      g.addColorStop(0.35, 'rgba(212,255,106,0.8)')
      g.addColorStop(1, 'rgba(212,255,106,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - 9, y - 9, 18, 18)
      break
    }
    case 'crow': {
      const flap = Math.sin(t * 22 + sh.x * 0.1) * 5
      ctx.fillStyle = '#1a1a22'
      ctx.beginPath()
      ctx.ellipse(x, y, 6, 3.2, Math.atan2(-sh.vy, sh.vx), 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#1a1a22'
      ctx.lineWidth = 2
      line(ctx, [x, y], [x - 6, y - 4 - flap])
      line(ctx, [x, y], [x + 4, y - 4 - flap])
      ctx.fillStyle = '#ff5252'
      ctx.fillRect(x + Math.sign(sh.vx || 1) * 4, y - 1.5, 1.5, 1.5)
      break
    }
    case 'geyser': {
      const live = sh.age - (sh.delay ?? 0)
      const h = Math.min(1, live * 6) * (sh.team === 0 ? 120 : 100)
      const g = ctx.createLinearGradient(0, GY - h, 0, GY)
      g.addColorStop(0, 'rgba(230,250,255,0.95)')
      g.addColorStop(1, tint ? hexA(tint, 0.8) : 'rgba(80,180,210,0.85)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(x - sh.r * 0.6, GY)
      ctx.quadraticCurveTo(x - sh.r * 0.4, GY - h * 0.6, x - sh.r * 0.2 + Math.sin(t * 30) * 2, GY - h)
      ctx.lineTo(x + sh.r * 0.2, GY - h)
      ctx.quadraticCurveTo(x + sh.r * 0.4, GY - h * 0.6, x + sh.r * 0.6, GY)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      for (let i = 0; i < 5; i++) ctx.fillRect(x + Math.sin(t * 9 + i) * sh.r * 0.7, GY - h - ((t * 120 + i * 13) % 20), 2, 2)
      break
    }
    case 'tornado': {
      ctx.strokeStyle = tint ? hexA(tint, 0.8) : 'rgba(200,240,190,0.8)'
      ctx.lineWidth = 2
      for (let i = 0; i < 9; i++) {
        const yy = GY - i * 11
        const w = 8 + i * 4.5
        ctx.beginPath()
        ctx.ellipse(x + Math.sin(t * 6 + i) * 4, yy, w, 3 + i * 0.4, 0, t * 12 + i, t * 12 + i + Math.PI * 1.4)
        ctx.stroke()
      }
      break
    }
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
      if (tint) ctx.shadowColor = tint
      ctx.fillStyle = tint ? hexA(tint, 0.85) : sh.lifesteal ? 'rgba(200,170,255,0.9)' : 'rgba(225,245,255,0.92)'
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

// ─── Shadow Trials terrain ─────────────────────────────────────────────

function drawTerrain(ctx: CanvasRenderingContext2D, s: Sim, lv: Level, cam: number) {
  const th = THEMES[s.stage.world]
  const t = s.t
  // the chasm: pits fall away into dark mist (covers the painted ground strip)
  const mist = ctx.createLinearGradient(0, GY - 30, 0, VH)
  mist.addColorStop(0, 'rgba(8,8,16,0)')
  mist.addColorStop(0.35, 'rgba(8,8,16,0.85)')
  mist.addColorStop(1, 'rgba(4,4,10,1)')
  ctx.fillStyle = mist
  ctx.fillRect(0, GY - 30, vw, VH - GY + 30)
  for (const sd of lv.solids) {
    const x = sd.x - cam
    if (x > vw + 10 || x + sd.w < -10) continue
    const y = GY - sd.top
    if (sd.oneWay) {
      // a wooden plank platform on two posts
      ctx.fillStyle = '#3e2a18'
      ctx.fillRect(x + 6, y + 6, 4, 22)
      ctx.fillRect(x + sd.w - 10, y + 6, 4, 22)
      ctx.fillStyle = '#7a5532'
      ctx.fillRect(x, y, sd.w, 7)
      ctx.fillStyle = 'rgba(255,230,180,0.35)'
      ctx.fillRect(x, y, sd.w, 1.5)
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      for (let k = 12; k < sd.w; k += 14) ctx.fillRect(x + k, y + 1, 1, 6)
      continue
    }
    // solid ground: earth or stone in the world's colours, a lit top edge
    const g = ctx.createLinearGradient(0, y, 0, VH)
    g.addColorStop(0, th.ground)
    g.addColorStop(1, shade(th.ground.startsWith('#') ? th.ground : '#333333', -0.55))
    ctx.fillStyle = g
    ctx.fillRect(x, y, sd.w, VH - y + 2)
    ctx.fillStyle = th.edge
    ctx.fillRect(x, y, sd.w, 3)
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillRect(x, y, sd.w, 1)
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.fillRect(x, y, 2, VH - y)
    ctx.fillRect(x + sd.w - 2, y, 2, VH - y)
    for (let k = 0; k < sd.w / 30; k++) {
      const sx = x + ((k * 37 + sd.x) % Math.max(1, sd.w - 16))
      const sy = y + 10 + ((k * 23) % 40)
      if (sy < VH) ctx.fillRect(sx, sy, 10 + (k % 3) * 4, 2)
    }
  }
  // spikes
  for (const sp of lv.spikes) {
    const x = sp.x - cam
    if (x > vw + 10 || x + sp.w < -10) continue
    const y = GY - sp.top
    ctx.fillStyle = '#cfd8dc'
    ctx.strokeStyle = '#455a64'
    ctx.lineWidth = 0.8
    for (let k = 0; k < sp.w; k += 8) {
      ctx.beginPath()
      ctx.moveTo(x + k, y)
      ctx.lineTo(x + k + 4, y - 11)
      ctx.lineTo(x + k + 8, y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }
  // saws on their tracks
  for (const sw of lv.saws) {
    const u = Math.sin(t * sw.speed)
    const cx = sw.x + sw.ax * u - cam
    const cy = GY - (sw.y + sw.ay * u)
    if (cx < -40 || cx > vw + 40) continue
    ctx.strokeStyle = 'rgba(30,30,30,0.6)'
    ctx.lineWidth = 2
    line(ctx, [sw.x - sw.ax - cam, GY - (sw.y - sw.ay)], [sw.x + sw.ax - cam, GY - (sw.y + sw.ay)])
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(t * 14)
    ctx.fillStyle = '#b0bec5'
    ctx.beginPath()
    for (let k = 0; k < 24; k++) {
      const r = k % 2 ? sw.r * 0.78 : sw.r
      ctx.lineTo(Math.cos((k * Math.PI) / 12) * r, Math.sin((k * Math.PI) / 12) * r)
    }
    ctx.fill()
    ctx.fillStyle = '#37474f'
    ctx.beginPath()
    ctx.arc(0, 0, sw.r * 0.25, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  // lanterns (checkpoints): lit once reached
  for (const cp of lv.checkpoints) {
    const x = cp.x - cam
    if (x < -20 || x > vw + 20) continue
    const y = GY - cp.y
    const lit = s.checkpoint.x >= cp.x
    ctx.fillStyle = '#2b2b2b'
    ctx.fillRect(x - 2, y - 40, 4, 40)
    ctx.fillRect(x - 8, y - 42, 16, 3)
    ctx.fillStyle = lit ? '#ff7043' : '#5d4037'
    ctx.beginPath()
    ctx.ellipse(x, y - 50, 7, 9, 0, 0, Math.PI * 2)
    ctx.fill()
    if (lit) {
      ctx.globalCompositeOperation = 'lighter'
      const g = ctx.createRadialGradient(x, y - 50, 0, x, y - 50, 30)
      g.addColorStop(0, 'rgba(255,170,90,0.6)')
      g.addColorStop(1, 'rgba(255,170,90,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - 30, y - 80, 60, 60)
      ctx.globalCompositeOperation = 'source-over'
    }
  }
  // the gate at the end: a glowing torii
  const gx = lv.exit - cam
  if (gx > -80 && gx < vw + 80) {
    const gy = GY - (groundUnder(lv, lv.exit) ?? 0)
    ctx.globalCompositeOperation = 'lighter'
    const g = ctx.createRadialGradient(gx, gy - 40, 4, gx, gy - 40, 70)
    g.addColorStop(0, `rgba(255,220,140,${0.35 + 0.15 * Math.sin(t * 3)})`)
    g.addColorStop(1, 'rgba(255,220,140,0)')
    ctx.fillStyle = g
    ctx.fillRect(gx - 70, gy - 110, 140, 120)
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#c62828'
    ctx.fillRect(gx - 26, gy - 72, 6, 72)
    ctx.fillRect(gx + 20, gy - 72, 6, 72)
    ctx.fillRect(gx - 38, gy - 80, 76, 7)
    ctx.fillRect(gx - 30, gy - 62, 60, 4)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(gx - 40, gy - 83, 80, 3)
  }
}

// ─── Urns, chests and pick-ups ─────────────────────────────────────────

function drawProps(ctx: CanvasRenderingContext2D, s: Sim, cam: number) {
  for (const p of s.props) {
    if (p.broken) continue
    const x = p.x - cam + (p.shake > 0 ? Math.sin(p.shake * 80) * 2 : 0)
    if (x < -30 || x > vw + 30) continue
    ctx.save()
    ctx.translate(0, -p.y)
    if (p.kind === 'cage') {
      // a bamboo cage with a hostage waving inside
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.beginPath()
      ctx.ellipse(x, GY + 2, 16, 3, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = 2.6
      const wave = Math.sin(s.t * 6) * 0.6
      line(ctx, [x, GY - 2], [x, GY - 18])
      line(ctx, [x, GY - 14], [x + 6, GY - 22 - wave * 4])
      line(ctx, [x, GY - 14], [x - 5, GY - 9])
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath()
      ctx.arc(x, GY - 22, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#8d6e3f'
      ctx.lineWidth = 2
      for (let k = -2; k <= 2; k++) line(ctx, [x + k * 6, GY], [x + k * 6, GY - 34])
      ctx.fillStyle = '#6d4c2b'
      ctx.fillRect(x - 15, GY - 36, 30, 4)
      ctx.fillRect(x - 15, GY - 2, 30, 3)
      if (Math.floor(s.t * 2) % 2 === 0) {
        ctx.font = 'bold 8px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#fff'
        ctx.fillText('たすけて!', x, GY - 42)
      }
      ctx.restore()
      continue
    }
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.beginPath()
    ctx.ellipse(x, GY + 2, 13, 3, 0, 0, Math.PI * 2)
    ctx.fill()
    if (p.kind === 'urn') {
      const g = ctx.createLinearGradient(x - 9, 0, x + 9, 0)
      g.addColorStop(0, '#6d3f22')
      g.addColorStop(0.45, '#b9773f')
      g.addColorStop(1, '#5a3219')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(x - 5, GY - 22)
      ctx.quadraticCurveTo(x - 13, GY - 12, x - 7, GY)
      ctx.lineTo(x + 7, GY)
      ctx.quadraticCurveTo(x + 13, GY - 12, x + 5, GY - 22)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#3e2412'
      ctx.fillRect(x - 6, GY - 24, 12, 3)
      ctx.strokeStyle = 'rgba(255,230,180,0.35)'
      ctx.lineWidth = 1
      line(ctx, [x - 8, GY - 12], [x + 8, GY - 12])
    } else {
      // A red-lacquered treasure chest with gold bands, glinting.
      ctx.fillStyle = '#8e1b1b'
      ctx.beginPath()
      ctx.roundRect(x - 14, GY - 18, 28, 18, 2)
      ctx.fill()
      ctx.fillStyle = '#b71c1c'
      ctx.beginPath()
      ctx.ellipse(x, GY - 18, 14, 6, 0, Math.PI, 0)
      ctx.fill()
      ctx.fillStyle = '#ffd54f'
      ctx.fillRect(x - 14, GY - 12, 28, 2)
      ctx.fillRect(x - 2, GY - 16, 4, 7)
      const glint = (s.t * 0.8) % 2
      if (glint < 1) {
        ctx.globalCompositeOperation = 'lighter'
        const gx = x - 14 + glint * 28
        const rg = ctx.createRadialGradient(gx, GY - 16, 0, gx, GY - 16, 8)
        rg.addColorStop(0, 'rgba(255,240,180,0.9)')
        rg.addColorStop(1, 'rgba(255,240,180,0)')
        ctx.fillStyle = rg
        ctx.fillRect(gx - 8, GY - 24, 16, 16)
      }
      // A soft beacon so it is noticed from afar.
      ctx.globalCompositeOperation = 'lighter'
      const b = ctx.createLinearGradient(0, GY - 90, 0, GY - 18)
      b.addColorStop(0, 'rgba(255,215,80,0)')
      b.addColorStop(1, `rgba(255,215,80,${0.18 + 0.08 * Math.sin(s.t * 3)})`)
      ctx.fillStyle = b
      ctx.fillRect(x - 10, GY - 90, 20, 72)
    }
    ctx.restore()
  }
}

function drawDrops(ctx: CanvasRenderingContext2D, s: Sim, cam: number) {
  for (const d of s.drops) {
    const x = d.x - cam
    const y = GY - d.y - 4
    ctx.save()
    if (d.kind === 'coin') {
      // A gold ryō oval with a square hole, spinning.
      const w = 4 * Math.abs(Math.cos(s.t * 6 + d.x))
      ctx.fillStyle = '#ffca28'
      ctx.strokeStyle = '#a17312'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.ellipse(x, y, Math.max(0.8, w), 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    } else if (d.kind === 'heal') {
      ctx.fillStyle = '#fafafa'
      ctx.beginPath()
      ctx.moveTo(x, y - 7)
      ctx.lineTo(x - 7, y + 4)
      ctx.lineTo(x + 7, y + 4)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#263238'
      ctx.fillRect(x - 4, y, 8, 4)
    } else if (d.kind === 'gem') {
      const by = y - 4 + Math.sin(s.t * 3 + d.x) * 2
      ctx.globalCompositeOperation = 'lighter'
      const g = ctx.createRadialGradient(x, by, 0, x, by, 14)
      g.addColorStop(0, 'rgba(160,240,255,0.8)')
      g.addColorStop(1, 'rgba(120,200,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - 14, by - 14, 28, 28)
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = '#7fe7ff'
      ctx.strokeStyle = '#e0f7ff'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(x, by - 7)
      ctx.lineTo(x + 6, by - 2)
      ctx.lineTo(x, by + 7)
      ctx.lineTo(x - 6, by - 2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    } else if (d.kind === 'ink') {
      const g = ctx.createRadialGradient(x, y, 0, x, y, 8)
      g.addColorStop(0, '#e3f2fd')
      g.addColorStop(0.5, '#42a5f5')
      g.addColorStop(1, 'rgba(66,165,245,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - 8, y - 8, 16, 16)
    } else {
      // Found gear: a slowly turning, glowing treasure.
      const by = y - 10 + Math.sin(s.t * 3) * 3
      ctx.globalCompositeOperation = 'lighter'
      const g = ctx.createRadialGradient(x, by, 0, x, by, 22)
      g.addColorStop(0, 'rgba(255,240,170,0.9)')
      g.addColorStop(1, 'rgba(255,200,80,0)')
      ctx.fillStyle = g
      ctx.fillRect(x - 22, by - 22, 44, 44)
      ctx.globalCompositeOperation = 'source-over'
      ctx.font = '14px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(d.gear && isSword(d.gear) ? '🗡️' : '🛡️', x, by + 5)
    }
    ctx.restore()
  }
}

/** Night stages: darkness, with light around the hero and the lanterns of the backdrop. */
function night(ctx: CanvasRenderingContext2D, s: Sim, cam: number) {
  const hx = s.hero.x - cam
  const hy = GY - s.hero.y - 34
  const g = ctx.createRadialGradient(hx, hy, 30, hx, hy, 190)
  g.addColorStop(0, 'rgba(6,8,30,0)')
  g.addColorStop(1, 'rgba(6,8,30,0.72)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, vw, VH)
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
      ctx.lineWidth = 3 * a
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
      ctx.globalCompositeOperation = 'lighter'
      ctx.strokeStyle = p.color
      ctx.lineWidth = p.size + 0.6
      line(ctx, [x, y], [x - p.vx * 0.03, y + p.vy * 0.03])
      ctx.globalCompositeOperation = 'source-over'
    } else if (p.kind === 'ink') {
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.ellipse(x, y, p.size * (p.y <= 0 ? 1.8 : 1), p.size * (p.y <= 0 ? 0.6 : 1), 0, 0, Math.PI * 2)
      ctx.fill()
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
  const r = h / 2
  const pill = (px: number, pw: number) => {
    ctx.beginPath()
    ctx.roundRect(px, y, Math.max(h, pw), h, r)
  }
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.beginPath()
  ctx.roundRect(x - 1.5, y - 1.5, w + 3, h + 3, r + 1.5)
  ctx.fill()
  ctx.fillStyle = 'rgba(60,15,15,0.9)'
  pill(x, w)
  ctx.fill()
  const fw = w * Math.max(0, Math.min(1, v))
  if (fw > 0.5) {
    const g = ctx.createLinearGradient(0, y, 0, y + h)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.25, fill)
    g.addColorStop(1, fill)
    ctx.fillStyle = g
    ctx.globalAlpha = 0.95
    pill(x, fw)
    ctx.fill()
    ctx.globalAlpha = 1
  }
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
  const el = s.arts.element ? ART_BY_ID[`el:${s.arts.element}`] : undefined
  if (el) {
    ctx.font = '8px system-ui, sans-serif'
    ctx.fillText(el.icon, 27, 24)
  }
  if (s.barrier > 0) bar(ctx, 36, 26, 60 * Math.min(1, s.barrier / (h.maxHp * 0.21)), 3, 1, '#4dd0e1')
  // Shuriken in hand (they come back over time).
  for (let i = 0; i < MAX_STARS; i++) {
    const x = 160 + i * 9
    const y = 10.5
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(Math.PI / 4)
    ctx.fillStyle = i < s.stars ? '#e0e6ec' : 'rgba(255,255,255,0.18)'
    ctx.beginPath()
    for (let k = 0; k < 8; k++) {
      const r = k % 2 ? 1.3 : 3.6
      ctx.lineTo(Math.cos((k * Math.PI) / 4) * r, Math.sin((k * Math.PI) / 4) * r)
    }
    ctx.fill()
    ctx.restore()
  }
  if (full) {
    ctx.font = 'bold 7px system-ui, sans-serif'
    ctx.fillStyle = '#fff176'
    ctx.strokeText('SPECIAL!', 130, 24)
    ctx.fillText('SPECIAL!', 130, 24)
  }
  if (s.stage.mod) {
    const m = MOD_INFO[s.stage.mod]
    ctx.font = 'bold 7px system-ui, sans-serif'
    ctx.fillStyle = '#ffd54f'
    ctx.strokeText(`${m.icon} ${m.name}`, 8, 40)
    ctx.fillText(`${m.icon} ${m.name}`, 8, 40)
  }
  ctx.textAlign = 'right'
  ctx.font = 'bold 9px system-ui, sans-serif'
  const w = WORLDS[s.stage.world]
  const st = s.lv ? `影 ${s.stage.world + 1}-${s.stage.n}   💎 ${s.gems}/3   ⛓ ${s.saved}/${s.lv.cages.length}` : `${w.jp} ${s.stage.world + 1}-${s.stage.n}   ⚔ ${s.kills}`
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
  // Off-screen foe arrows, and a gold one toward an unopened chest.
  const cam = camOf(s)
  for (const p of s.props) {
    if (p.broken || p.kind !== 'chest') continue
    const x = p.x - cam
    if (x >= 0 && x <= vw) continue
    const left = x < 0
    const ax = left ? 6 : vw - 6
    ctx.fillStyle = `rgba(255,213,79,${0.6 + 0.4 * Math.sin(s.t * 5)})`
    ctx.beginPath()
    ctx.moveTo(ax, GY - 8)
    ctx.lineTo(ax + (left ? 9 : -9), GY - 15)
    ctx.lineTo(ax + (left ? 9 : -9), GY - 1)
    ctx.fill()
  }
  for (const f of s.foes) {
    if (f.dead) continue
    const x = f.x - cam
    if (x >= 0 && x <= vw) continue
    // in a trial, only foes that have spotted you and are close get an arrow
    if (s.lv && (!f.aware || Math.abs(f.x - s.hero.x) > 600)) continue
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
/** Where the camera wants to be: on the hero (looking a little ahead in a trial). */
const camTarget = (s: Sim) => Math.max(0, Math.min(s.width - vw, s.hero.x - vw / 2 + (s.lv ? s.hero.face * vw * 0.12 : 0)))

export function camOf(s: Sim) {
  const target = camTarget(s)
  if (camX < 0 || Math.abs(camX - target) > 300) camX = target
  return camX
}

/** Draw a frame. `width`/`height` are the canvas's pixel size. */
export function draw(ctx: CanvasRenderingContext2D, s: Sim, level: number, width: number, height: number, dt: number) {
  vw = Math.max(260, Math.min(640, Math.round((VH * width) / height)))
  const target = camTarget(s)
  camX = camX < 0 ? target : camX + (target - camX) * Math.min(1, dt * 6)
  const k = height / VH
  ctx.setTransform(k, 0, 0, k, 0, 0)
  ctx.imageSmoothingQuality = 'high'
  ctx.clearRect(0, 0, vw, VH)
  feet(s, dt)
  trackGhosts(s)
  const shake = s.shake > 0 ? s.shake * 10 : 0
  ctx.save()
  if (shake) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake)
  scenery(ctx, s.stage.world, camX, s.t, s.width)
  if (s.lv) drawTerrain(ctx, s, s.lv, camX)
  drawPuffs(ctx, camX, s.stage.world)
  drawProps(ctx, s, camX)
  const all = [...s.foes.filter((f) => f.dead), ...s.foes.filter((f) => !f.dead), s.hero]
  for (const f of all) drawGhosts(ctx, s, f, camX)
  // Rigged 3D fighters where there are models; stick figures for the rest.
  const f3 = use3d ? (fighters3d ??= new Fighters3D()) : null
  if (import.meta.env?.DEV && f3) (globalThis as { __nj3d?: Fighters3D }).__nj3d = f3
  let layer: HTMLCanvasElement | null = null
  try {
    layer = f3?.render(s, camX, vw, VH, GY, width, height, poseOf, THEMES[s.stage.world].sky[1], true) ?? null
  } catch (e) {
    // a model or the GPU failed: carry on with stick figures rather than an empty fight
    console.warn('Stick Ninja 3D off:', e)
    use3d = false
    f3?.drawn.clear()
  }
  const in3d = (f: Fighter) => !!layer && f3!.drawn.has(f)
  for (const f of all) if (in3d(f)) drawFighter(ctx, s, f, camX, undefined, 'shadow')
  for (const f of all) if (!in3d(f)) drawFighter(ctx, s, f, camX)
  if (layer) ctx.drawImage(layer, 0, 0, vw, VH)
  for (const f of all) if (in3d(f)) drawFighter(ctx, s, f, camX, undefined, 'fx')
  for (const sh of s.shots) drawShot(ctx, sh, camX, s.t)
  drawDrops(ctx, s, camX)
  drawFx(ctx, s, camX)
  foreground(ctx, s.stage.world, camX, s.t)
  if (s.stage.mod === 'night') night(ctx, s, camX)
  ctx.restore()
  vignette(ctx, s)
  if (s.flashT > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.6, s.flashT * 2)})`
    ctx.fillRect(0, 0, vw, VH)
  }
  bossEntrance(ctx, s)
  hud(ctx, s, level)
}

let fighters3d: Fighters3D | null = null
let use3d = true

/** Turn the 3D fighters on or off (they also stay off without WebGL or models). */
export function setFighters3D(on: boolean) {
  use3d = on
}

export function resetCamera() {
  camX = -1
  fighters3d?.clear()
  puffs = []
}

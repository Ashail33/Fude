/**
 * Ambient particle layer over painted backdrops: petals, pollen, fireflies,
 * falling paper talismans, rising glyph sparks, or glyph shards pulled into
 * the void. Canvas 2D with pre-rendered sprites, three depth bands (size,
 * speed, brightness and pointer parallax scale with nearness). Pauses when
 * hidden/offscreen; off entirely for prefers-reduced-motion.
 */
import { useEffect, useRef } from 'react'
import type { AmbientKind } from './ambientKinds'
import { onTick, prefersReducedMotion } from './ticker'

interface P {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  rot: number
  vr: number
  ph: number
  s: number
  life: number
  spr: number
}

interface KindCfg {
  /** Particles per 1280×800 of area (scaled, clamped). */
  density: number
  additive: boolean
  sprites: HTMLCanvasElement[]
  spawn(p: P, initial: boolean): void
  step(p: P, dt: number, t: number): void
  /** Alpha 0..1 for drawing. */
  alpha(p: P, t: number): number
  /** Horizontal squash for 3D flipping (1 = none). */
  flip?: (p: P, t: number) => number
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a)

function sprite(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  if (g) draw(g)
  return c
}

function glow(r: number, core: string, halo: string): HTMLCanvasElement {
  return sprite(r * 2, r * 2, (g) => {
    const grd = g.createRadialGradient(r, r, 0, r, r, r)
    grd.addColorStop(0, core)
    grd.addColorStop(0.18, core)
    grd.addColorStop(0.45, halo)
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, r * 2, r * 2)
  })
}

function petal(fill: string, edge: string): HTMLCanvasElement {
  return sprite(28, 28, (g) => {
    g.translate(14, 14)
    g.beginPath()
    g.moveTo(0, -11)
    g.bezierCurveTo(8, -8, 9, 5, 0, 11)
    g.bezierCurveTo(-9, 5, -8, -8, 0, -11)
    // The notch at the tip of a sakura petal.
    g.closePath()
    const grd = g.createLinearGradient(0, -11, 0, 11)
    grd.addColorStop(0, edge)
    grd.addColorStop(1, fill)
    g.fillStyle = grd
    g.fill()
    g.globalCompositeOperation = 'destination-out'
    g.beginPath()
    g.moveTo(-2.2, -12)
    g.lineTo(0, -7.5)
    g.lineTo(2.2, -12)
    g.fill()
  })
}

function talisman(): HTMLCanvasElement {
  return sprite(20, 44, (g) => {
    g.fillStyle = '#f3e9cf'
    g.fillRect(2, 2, 16, 40)
    g.strokeStyle = 'rgba(120,90,50,0.35)'
    g.strokeRect(2.5, 2.5, 15, 39)
    g.fillStyle = '#c8321f'
    g.fillRect(5, 6, 10, 3)
    g.strokeStyle = '#2a1d18'
    g.lineWidth = 1.6
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(10, 12)
    g.lineTo(10, 36)
    g.moveTo(6, 17)
    g.lineTo(14, 16)
    g.moveTo(6, 25)
    g.quadraticCurveTo(10, 23, 14, 26)
    g.moveTo(7, 31)
    g.lineTo(13, 33)
    g.stroke()
  })
}

/** A tiny glowing brush-stroke fragment (abstract, not a readable character). */
function glyph(color: string, seed: number): HTMLCanvasElement {
  return sprite(40, 40, (g) => {
    g.translate(20, 20)
    g.shadowColor = color
    g.shadowBlur = 8
    g.strokeStyle = color
    g.lineWidth = 2.4
    g.lineCap = 'round'
    g.beginPath()
    const k = seed % 4
    if (k === 0) {
      g.moveTo(-8, -6)
      g.quadraticCurveTo(0, -10, 8, -4)
      g.moveTo(-2, -2)
      g.lineTo(2, 9)
    } else if (k === 1) {
      g.moveTo(-7, 6)
      g.quadraticCurveTo(-4, -8, 6, -8)
      g.moveTo(0, 0)
      g.lineTo(7, 6)
    } else if (k === 2) {
      g.arc(0, 0, 6, 0.4, 5.2)
      g.moveTo(-8, 8)
      g.lineTo(-3, 3)
    } else {
      g.moveTo(-8, 0)
      g.lineTo(8, 0)
      g.moveTo(0, -8)
      g.quadraticCurveTo(3, 0, -2, 8)
    }
    g.stroke()
    g.stroke()
  })
}

function config(kind: AmbientKind): KindCfg {
  switch (kind) {
    case 'petals':
      return {
        density: 26,
        additive: false,
        sprites: [petal('#f7c6d4', '#fde8ee'), petal('#f2a9c0', '#fbd9e3'), petal('#fbe2ea', '#ffffff')],
        spawn(p, init) {
          p.x = init ? rnd(0, 1) : rnd(-0.2, 0.9)
          p.y = init ? rnd(-0.1, 1) : rnd(-0.15, -0.03)
          p.vx = rnd(0.02, 0.05)
          p.vy = rnd(0.035, 0.06)
          p.rot = rnd(0, 6.28)
          p.vr = rnd(-1.2, 1.2)
          p.s = rnd(0.5, 0.8)
        },
        step(p, dt, t) {
          const sway = Math.sin(t * 1.3 + p.ph) * 0.03
          p.x += (p.vx + sway) * p.z * dt
          p.y += p.vy * p.z * dt
          p.rot += p.vr * dt
        },
        alpha: (p) => 0.55 + 0.45 * p.z,
        flip: (p, t) => Math.cos(t * 2.1 + p.ph),
      }
    case 'pollen':
      return {
        density: 40,
        additive: true,
        sprites: [glow(10, 'rgba(255,240,190,1)', 'rgba(247,201,72,0.35)'), glow(8, 'rgba(255,255,230,1)', 'rgba(255,220,140,0.3)')],
        spawn(p, init) {
          p.x = rnd(0, 1)
          p.y = init ? rnd(0.1, 1) : rnd(0.85, 1.05)
          p.vx = rnd(-0.01, 0.02)
          p.vy = rnd(-0.02, -0.008)
          p.s = rnd(0.35, 0.7)
          p.life = 0
        },
        step(p, dt, t) {
          p.life += dt
          p.x += (p.vx + Math.sin(t * 0.7 + p.ph) * 0.012) * p.z * dt
          p.y += (p.vy + Math.cos(t * 0.9 + p.ph * 1.7) * 0.008) * p.z * dt
        },
        alpha: (p, t) => Math.min(1, p.life / 2) * (0.35 + 0.35 * Math.sin(t * 2.2 + p.ph)) * (0.5 + 0.5 * p.z),
      }
    case 'fireflies':
      return {
        density: 22,
        additive: true,
        sprites: [glow(16, 'rgba(240,255,190,1)', 'rgba(170,230,90,0.28)'), glow(14, 'rgba(255,250,200,1)', 'rgba(220,240,120,0.25)')],
        spawn(p, init) {
          p.x = rnd(0, 1)
          p.y = init ? rnd(0.25, 0.95) : rnd(0.4, 1)
          p.vx = 0
          p.vy = 0
          p.s = rnd(0.35, 0.65)
          p.life = 0
        },
        step(p, dt, t) {
          p.life += dt
          // Wandering: smooth, meandering velocity field.
          p.x += Math.sin(t * 0.35 + p.ph) * 0.02 * dt + Math.sin(t * 0.9 + p.ph * 2.3) * 0.008 * dt
          p.y += Math.cos(t * 0.3 + p.ph * 1.3) * 0.016 * dt - 0.004 * dt
        },
        alpha: (p, t) => {
          const blink = Math.max(0, Math.sin(t * 0.9 + p.ph * 3))
          return Math.min(1, p.life / 1.5) * Math.pow(blink, 2.5) * (0.5 + 0.5 * p.z)
        },
      }
    case 'talismans':
      return {
        density: 9,
        additive: false,
        sprites: [talisman()],
        spawn(p, init) {
          p.x = rnd(0.02, 0.98)
          p.y = init ? rnd(-0.1, 0.9) : rnd(-0.2, -0.06)
          p.vx = rnd(-0.01, 0.01)
          p.vy = rnd(0.022, 0.035)
          p.rot = rnd(-0.5, 0.5)
          p.vr = 0
          p.s = rnd(0.55, 0.85)
        },
        step(p, dt, t) {
          // Paper falls like a leaf: side-to-side glide, tilting into each swing.
          const sw = Math.sin(t * 0.9 + p.ph)
          p.x += (p.vx + sw * 0.03) * p.z * dt
          p.y += p.vy * p.z * (0.7 + 0.3 * Math.abs(sw)) * dt
          p.rot = sw * 0.45
        },
        alpha: (p) => 0.55 + 0.4 * p.z,
        flip: (p, t) => 0.55 + 0.45 * Math.cos(t * 0.9 + p.ph),
      }
    case 'glyphs':
      return {
        density: 16,
        additive: true,
        sprites: [0, 1, 2, 3].map((k) => glyph(k % 2 ? '#b9a4ff' : '#8fe3ff', k)),
        spawn(p, init) {
          p.x = rnd(0.05, 0.95)
          p.y = init ? rnd(0.2, 1) : rnd(0.9, 1.08)
          p.vx = rnd(-0.008, 0.008)
          p.vy = rnd(-0.045, -0.025)
          p.rot = rnd(-0.4, 0.4)
          p.vr = rnd(-0.3, 0.3)
          p.s = rnd(0.35, 0.6)
          p.life = 0
        },
        step(p, dt, t) {
          p.life += dt
          p.x += (p.vx + Math.sin(t * 0.8 + p.ph) * 0.006) * dt
          p.y += p.vy * p.z * dt
          p.rot += p.vr * dt
        },
        alpha: (p, t) => Math.min(1, p.life / 1.2) * Math.min(1, Math.max(0, (p.y - 0.05) * 3)) * (0.45 + 0.25 * Math.sin(t * 3 + p.ph)) * (0.6 + 0.4 * p.z),
      }
    case 'vortex':
      return {
        density: 30,
        additive: true,
        sprites: [0, 1, 2, 3].map((k) => glyph(k % 2 ? '#f7c948' : '#ff9ad5', k)),
        spawn(p) {
          // Start on a wide ring, spiral into the void at the top centre.
          const a = rnd(0, Math.PI * 2)
          p.vx = a
          p.vy = rnd(0.7, 1.05)
          p.x = 0.5 + Math.cos(a) * p.vy * 0.7
          p.y = 0.22 + Math.sin(a) * p.vy * 0.45
          p.s = rnd(0.3, 0.55)
          p.rot = rnd(0, 6)
          p.life = 0
        },
        step(p, dt) {
          p.life += dt
          const r = p.vy
          p.vy = Math.max(0, r - dt * (0.05 + 0.25 * (1 - r)) * p.z)
          p.vx += dt * (0.25 + 0.9 * (1 - r)) * p.z
          p.x = 0.5 + Math.cos(p.vx) * p.vy * 0.7
          p.y = 0.22 + Math.sin(p.vx) * p.vy * 0.45
          p.rot += dt * 2
          if (p.vy < 0.03) p.y = 99
        },
        alpha: (p) => Math.min(1, p.life / 1.5) * Math.min(1, p.vy * 4) * (0.35 + 0.5 * p.z),
      }
  }
}

function newParticle(cfg: KindCfg, initial: boolean): P {
  const z = Math.random() < 0.5 ? rnd(0.35, 0.55) : Math.random() < 0.7 ? rnd(0.6, 0.8) : rnd(0.85, 1)
  const p: P = { x: 0, y: 0, z, vx: 0, vy: 0, rot: 0, vr: 0, ph: rnd(0, 100), s: 1, life: 0, spr: Math.floor(Math.random() * cfg.sprites.length) }
  cfg.spawn(p, initial)
  return p
}

/** Full-size overlay canvas; place it inside a positioned container. */
export function Ambient({ kind, className }: { kind: AmbientKind; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c || prefersReducedMotion()) return
    const g = c.getContext('2d')
    if (!g) return
    const cfg = config(kind)
    let parts: P[] = []
    let W = 0
    let H = 0
    let dpr = 1
    const fit = () => {
      dpr = Math.min(1.5, window.devicePixelRatio || 1)
      W = c.clientWidth
      H = c.clientHeight
      c.width = Math.max(1, Math.round(W * dpr))
      c.height = Math.max(1, Math.round(H * dpr))
      const n = Math.round(cfg.density * Math.min(1.4, Math.max(0.55, (W * H) / (1280 * 800))))
      while (parts.length < n) parts.push(newParticle(cfg, true))
      parts = parts.slice(0, n)
    }
    fit()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null
    ro?.observe(c)
    let visible = true
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver((es) => (visible = es.some((e) => e.isIntersecting))) : null
    io?.observe(c)
    let mx = 0
    let my = 0
    let sx = 0
    let sy = 0
    const move = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1
      my = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', move, { passive: true })
    // Sort far → near once so nearer particles draw on top.
    parts.sort((a, b) => a.z - b.z)
    const stop = onTick((t, dt) => {
      if (!visible || !W || !H) return
      sx += (mx - sx) * Math.min(1, dt * 2)
      sy += (my - sy) * Math.min(1, dt * 2)
      g.setTransform(1, 0, 0, 1, 0, 0)
      g.clearRect(0, 0, c.width, c.height)
      g.globalCompositeOperation = cfg.additive ? 'lighter' : 'source-over'
      const unit = Math.min(W, H) / 320
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]
        cfg.step(p, dt, t)
        if (p.y > 1.15 || p.y < -0.25 || p.x < -0.25 || p.x > 1.25) {
          const q = newParticle(cfg, false)
          q.z = p.z
          parts[i] = q
          continue
        }
        const a = cfg.alpha(p, t)
        if (a <= 0.01) continue
        const img = cfg.sprites[p.spr]
        const k = p.s * unit * (0.45 + 0.75 * p.z)
        const x = (p.x * W - sx * 14 * p.z) * dpr
        const y = (p.y * H - sy * 8 * p.z) * dpr
        const fl = cfg.flip ? cfg.flip(p, t) : 1
        const cs = Math.cos(p.rot)
        const sn = Math.sin(p.rot)
        const kx = k * dpr * (Math.abs(fl) < 0.08 ? 0.08 : fl)
        const ky = k * dpr
        g.setTransform(cs * kx, sn * kx, -sn * ky, cs * ky, x, y)
        g.globalAlpha = Math.min(1, a)
        g.drawImage(img, -img.width / 2, -img.height / 2)
      }
      g.globalAlpha = 1
    })
    return () => {
      stop()
      ro?.disconnect()
      io?.disconnect()
      window.removeEventListener('pointermove', move)
    }
  }, [kind])
  return <canvas ref={ref} className={`la-ambient ${className ?? ''}`} aria-hidden />
}

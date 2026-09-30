/**
 * Region-themed battle backdrops, painted procedurally as low-resolution
 * pixel art (one canvas pixel ≈ 3–4 CSS px) and scaled up crisply.
 */
import { useEffect, useRef } from 'react'
import { PAL } from '../art/palette'

type Ctx = CanvasRenderingContext2D

function rnd(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Banded (posterised) vertical gradient — the classic 16-bit sky. */
function bands(c: Ctx, x: number, y: number, w: number, h: number, colors: string[]) {
  const n = colors.length
  for (let i = 0; i < n; i++) {
    const y0 = Math.round(y + (h * i) / n)
    const y1 = Math.round(y + (h * (i + 1)) / n)
    c.fillStyle = colors[i]
    c.fillRect(x, y0, w, y1 - y0)
    // dither seam
    if (i < n - 1) {
      c.fillStyle = colors[i + 1]
      for (let xx = x + ((i * 2) % 2); xx < x + w; xx += 2) c.fillRect(xx, y1 - 1, 1, 1)
    }
  }
}

function hills(c: Ctx, w: number, base: number, amp: number, freq: number, phase: number, color: string, h: number) {
  c.fillStyle = color
  for (let x = 0; x < w; x++) {
    const y = Math.round(base - amp * (0.6 * Math.sin(x * freq + phase) + 0.4 * Math.sin(x * freq * 2.3 + phase * 1.7)))
    c.fillRect(x, y, 1, h - y)
  }
}

function stars(c: Ctx, w: number, h: number, n: number, r: () => number, cols: string[]) {
  for (let i = 0; i < n; i++) {
    c.fillStyle = cols[Math.floor(r() * cols.length)]
    const x = Math.floor(r() * w)
    const y = Math.floor(r() * h)
    c.fillRect(x, y, 1, 1)
    if (r() < 0.08) {
      c.fillRect(x - 1, y, 3, 1)
      c.fillRect(x, y - 1, 1, 3)
    }
  }
}

function tuft(c: Ctx, x: number, y: number, col: string) {
  c.fillStyle = col
  c.fillRect(x, y, 1, 2)
  c.fillRect(x + 2, y - 1, 1, 3)
  c.fillRect(x + 4, y, 1, 2)
}

function cloud(c: Ctx, x: number, y: number, s: number, col: string, shade: string) {
  c.fillStyle = shade
  c.fillRect(x, y + 3 * s, 16 * s, 2 * s)
  c.fillStyle = col
  c.fillRect(x + 2 * s, y + 1 * s, 12 * s, 3 * s)
  c.fillRect(x + 4 * s, y, 5 * s, 2 * s)
  c.fillRect(x + 9 * s, y - 1 * s, 4 * s, 3 * s)
}

function tree(c: Ctx, x: number, base: number, s: number, leaf: string, dark: string, trunk: string) {
  c.fillStyle = trunk
  c.fillRect(x - s, base - 6 * s, 2 * s, 6 * s)
  c.fillStyle = dark
  c.fillRect(x - 5 * s, base - 13 * s, 10 * s, 7 * s)
  c.fillRect(x - 3 * s, base - 16 * s, 6 * s, 3 * s)
  c.fillStyle = leaf
  c.fillRect(x - 4 * s, base - 14 * s, 7 * s, 5 * s)
  c.fillRect(x - 2 * s, base - 16 * s, 4 * s, 2 * s)
}

function paint(c: Ctx, region: number, w: number, h: number, horizon: number) {
  const r = rnd(region * 7919)
  const hz = Math.round(h * horizon)
  c.clearRect(0, 0, w, h)
  switch (region) {
    case 1: {
      // Village meadow: morning sky, blue hills, flowered grass.
      bands(c, 0, 0, w, hz, ['#5fa8e8', '#72b8ee', '#8ac8f2', '#a6d8f4', '#c4e6f4', '#e0f0ec'])
      for (let i = 0; i < 4; i++) cloud(c, Math.floor(r() * w), Math.floor(4 + r() * hz * 0.4), 1 + Math.floor(r() * 2), PAL.white, '#d6e8f4')
      hills(c, w, hz - 6, 6, 0.05, 1, '#6f93c8', h)
      hills(c, w, hz - 1, 4, 0.08, 3, '#4f8a5a', h)
      bands(c, 0, hz + 2, w, h - hz - 2, [PAL.leaf, '#3f9c4c', PAL.grass, '#6cbe52', PAL.grassLight])
      for (let i = 0; i < w * 0.8; i++) {
        const y = hz + 4 + Math.floor(r() ** 0.7 * (h - hz - 4))
        tuft(c, Math.floor(r() * w), y, r() < 0.5 ? PAL.leafDark : PAL.leaf)
      }
      const flowers = [PAL.sakura, PAL.white, PAL.gold, '#f26b8a']
      for (let i = 0; i < w * 0.35; i++) {
        c.fillStyle = flowers[i % flowers.length]
        const y = hz + 8 + Math.floor(r() * (h - hz - 8))
        c.fillRect(Math.floor(r() * w), y, 1, 1)
      }
      tree(c, Math.round(w * 0.08), hz + 4, 2, PAL.sakura, PAL.sakuraDark, PAL.woodDark)
      tree(c, Math.round(w * 0.93), hz + 3, 1, PAL.grass, PAL.leaf, PAL.woodDark)
      break
    }
    case 2: {
      // Golden fields at sunset.
      bands(c, 0, 0, w, hz, ['#3d4a8c', '#6a4f9a', '#b35a8a', '#e2735a', '#f28a2e', '#f7b048', '#f7d36a'])
      c.fillStyle = '#ffe9a0'
      const sx = Math.round(w * 0.7)
      for (let y = -6; y <= 6; y++) {
        const half = Math.round(Math.sqrt(36 - y * y))
        if (hz - 4 + y < hz) c.fillRect(sx - half, hz - 4 + y, half * 2, 1)
      }
      hills(c, w, hz - 8, 7, 0.035, 2, '#8a4f7a', h)
      hills(c, w, hz - 2, 3, 0.07, 5, '#a8604a', h)
      bands(c, 0, hz, w, h - hz, ['#c7862e', '#d99a34', '#e6b040', '#f0c54a', '#f7d35a'])
      // wheat rows
      for (let y = hz + 3; y < h; y += 3 + Math.floor((y - hz) / 12)) {
        c.fillStyle = y % 2 ? '#b0701f' : '#c47f28'
        for (let x = (y * 3) % 4; x < w; x += 3) c.fillRect(x, y, 1, 1 + Math.floor((y - hz) / 20))
      }
      for (let i = 0; i < w * 0.2; i++) {
        c.fillStyle = '#fff1b0'
        c.fillRect(Math.floor(r() * w), hz + Math.floor(r() * (h - hz)), 1, 1)
      }
      // scarecrow-ish post
      c.fillStyle = PAL.woodDark
      c.fillRect(Math.round(w * 0.12), hz - 6, 1, 14)
      c.fillRect(Math.round(w * 0.12) - 4, hz - 2, 9, 1)
      break
    }
    case 3: {
      // Deep forest: layered trunks, canopy, light shafts.
      bands(c, 0, 0, w, h, ['#0e2a22', '#123428', '#17402c', '#1c4a2f', '#1f5c3a'])
      for (let layer = 0; layer < 3; layer++) {
        const col = ['#1a3a2c', '#14301f', '#0c2016'][layer]
        const n = 6 + layer * 3
        for (let i = 0; i < n; i++) {
          const x = Math.floor(r() * w)
          const tw = 3 + layer * 2 + Math.floor(r() * 3)
          c.fillStyle = col
          c.fillRect(x, 0, tw, hz + 4 + layer * 4)
        }
      }
      // canopy
      for (let i = 0; i < w * 1.5; i++) {
        c.fillStyle = r() < 0.5 ? '#0f3a24' : '#18502f'
        c.fillRect(Math.floor(r() * w), Math.floor(r() * hz * 0.35), 3, 2)
      }
      // light shafts
      c.globalAlpha = 0.12
      c.fillStyle = '#d6ffb0'
      for (let i = 0; i < 4; i++) {
        const x0 = Math.floor(r() * w)
        for (let y = 0; y < h; y++) c.fillRect(x0 + Math.floor(y * 0.4), y, 6, 1)
      }
      c.globalAlpha = 1
      bands(c, 0, hz + 2, w, h - hz - 2, ['#1f3a22', '#244a26', '#2f5c2c', '#3a6a30'])
      for (let i = 0; i < w * 0.6; i++) tuft(c, Math.floor(r() * w), hz + 4 + Math.floor(r() * (h - hz - 4)), r() < 0.5 ? '#16301a' : '#4a7a36')
      // mushrooms & fireflies
      for (let i = 0; i < 6; i++) {
        const x = Math.floor(r() * w)
        const y = hz + 6 + Math.floor(r() * (h - hz - 8))
        c.fillStyle = PAL.paper
        c.fillRect(x, y, 1, 2)
        c.fillStyle = PAL.vermilion
        c.fillRect(x - 1, y - 1, 3, 1)
      }
      break
    }
    case 4: {
      // Shrine courtyard at night: moon, torii, stone lanterns.
      bands(c, 0, 0, w, hz, ['#0a0d26', '#101634', '#15204a', '#1c2a5c', '#243468', '#2b3d70'])
      stars(c, w, hz - 6, Math.floor(w * 0.5), r, [PAL.paper, PAL.mist, PAL.gold])
      // moon
      const mx = Math.round(w * 0.78)
      const my = Math.round(hz * 0.28)
      c.fillStyle = '#fff4c8'
      for (let y = -6; y <= 6; y++) {
        const half = Math.round(Math.sqrt(36 - y * y))
        c.fillRect(mx - half, my + y, half * 2, 1)
      }
      c.fillStyle = '#e8d890'
      c.fillRect(mx - 2, my - 2, 2, 2)
      c.fillRect(mx + 2, my + 2, 2, 1)
      hills(c, w, hz - 4, 4, 0.06, 1, '#1a1f44', h)
      // torii
      const tx = Math.round(w * 0.5)
      const tw = Math.max(26, Math.round(w * 0.3))
      c.fillStyle = '#8a1e28'
      c.fillRect(tx - tw / 2 + 3, hz - 24, 3, 24)
      c.fillRect(tx + tw / 2 - 6, hz - 24, 3, 24)
      c.fillStyle = PAL.vermilion
      c.fillRect(tx - tw / 2 + 4, hz - 24, 1, 24)
      c.fillRect(tx + tw / 2 - 5, hz - 24, 1, 24)
      c.fillStyle = PAL.ink
      c.fillRect(tx - tw / 2 - 2, hz - 28, tw + 4, 2)
      c.fillStyle = PAL.vermilion
      c.fillRect(tx - tw / 2, hz - 26, tw, 2)
      c.fillRect(tx - tw / 2 + 2, hz - 21, tw - 4, 1)
      // stone path
      bands(c, 0, hz, w, h - hz, ['#2a2f52', '#30365c', '#373e66', '#3f4670'])
      c.fillStyle = '#565d86'
      for (let y = hz + 2; y < h; y += 4) {
        const spread = Math.round(6 + (y - hz) * 0.6)
        for (let x = tx - spread; x < tx + spread; x += 6) c.fillRect(x + ((y / 4) % 2) * 3, y, 5, 3)
      }
      // lanterns
      for (const lx of [Math.round(w * 0.14), Math.round(w * 0.86)]) {
        c.fillStyle = PAL.stone
        c.fillRect(lx - 1, hz - 2, 3, 10)
        c.fillRect(lx - 3, hz - 6, 7, 4)
        c.fillRect(lx - 4, hz - 8, 9, 2)
        c.fillStyle = PAL.gold
        c.fillRect(lx - 1, hz - 5, 3, 2)
        c.globalAlpha = 0.18
        c.fillRect(lx - 7, hz - 10, 15, 12)
        c.globalAlpha = 1
      }
      break
    }
    default: {
      // Tower of Creation interior: arched windows onto the stars.
      bands(c, 0, 0, w, hz + 6, ['#1a1030', '#221640', '#2a1c4c', '#302258', '#382862'])
      const n = Math.max(3, Math.round(w / 40))
      for (let i = 0; i < n; i++) {
        const cx = Math.round(((i + 0.5) * w) / n)
        const ww = 12
        const top = Math.round(hz * 0.18)
        const bot = hz - 6
        c.fillStyle = '#070a1f'
        c.fillRect(cx - ww / 2, top + 5, ww, bot - top - 5)
        for (let y = 0; y < 6; y++) {
          const half = Math.round(Math.sqrt(36 - (6 - y) ** 2))
          c.fillRect(cx - half, top + y, half * 2, 1)
        }
        const rs = rnd(i * 31 + 5)
        for (let k = 0; k < 10; k++) {
          c.fillStyle = [PAL.paper, PAL.lilac, PAL.ice][k % 3]
          c.fillRect(cx - ww / 2 + 1 + Math.floor(rs() * (ww - 2)), top + 2 + Math.floor(rs() * (bot - top - 3)), 1, 1)
        }
        c.fillStyle = '#5a4a8a'
        c.fillRect(cx - ww / 2 - 1, bot, ww + 2, 2)
        c.fillStyle = PAL.lilac
        c.fillRect(cx, top - 2, 1, 2)
      }
      // brick lines
      c.fillStyle = 'rgba(0,0,0,0.25)'
      for (let y = 4; y < hz; y += 6) for (let x = (y / 6) % 2 ? 0 : 5; x < w; x += 10) c.fillRect(x, y, 1, 5)
      for (let y = 3; y < hz; y += 6) c.fillRect(0, y, w, 1)
      // floor tiles in perspective
      bands(c, 0, hz + 6, w, h - hz - 6, ['#2a2050', '#322660', '#3a2c6a', '#443476'])
      c.fillStyle = '#5a4a8a'
      for (let y = hz + 8, step = 3; y < h; y += step, step++) c.fillRect(0, y, w, 1)
      for (let k = -12; k <= 12; k++) {
        for (let y = hz + 6; y < h; y++) c.fillRect(Math.round(w / 2 + k * (4 + (y - hz) * 0.9)), y, 1, 1)
      }
      // magic circle glow
      c.globalAlpha = 0.35
      c.fillStyle = PAL.lilac
      const cy = Math.round(hz + (h - hz) * 0.45)
      for (let a = 0; a < 64; a++) {
        const t = (a / 64) * Math.PI * 2
        c.fillRect(Math.round(w / 2 + Math.cos(t) * w * 0.28), Math.round(cy + Math.sin(t) * (h - hz) * 0.22), 2, 1)
      }
      c.globalAlpha = 1
    }
  }
  // Vignette for depth.
  const g = c.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.3, w / 2, h * 0.55, Math.max(w, h) * 0.8)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(0,0,0,0.45)')
  c.fillStyle = g
  c.fillRect(0, 0, w, h)
}

export default function Backdrop({ region, horizon = 0.56 }: { region: number; horizon?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let painted = false
    const draw = () => {
      const rect = el.getBoundingClientRect()
      const px = rect.width > 700 ? 4 : 3
      const w = Math.max(40, Math.ceil(rect.width / px))
      const h = Math.max(40, Math.ceil(rect.height / px))
      if (painted && el.width === w && el.height === h) return
      painted = true
      el.width = w
      el.height = h
      const c = el.getContext('2d')
      if (c) paint(c, region, w, h, horizon)
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(el)
    return () => ro.disconnect()
  }, [region, horizon])
  return <canvas ref={ref} className="bt-backdrop pixel" aria-hidden />
}

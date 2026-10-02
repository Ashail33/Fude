/**
 * Bamboo Bridge (ぼうわたり): a one-button arcade break from studying.
 * Hold to stretch a pole, let go to drop it across the gap; land the tip on
 * the next pillar to cross, hit the red centre for a bonus. While running
 * across, tap to flip under the pole and grab spirit shards, but flip back
 * before you reach the pillar or down you go. Shards collected are kept.
 */
import { useEffect, useRef, useState } from 'react'
import { paint } from '../arcade/ninja/draw'
import { BackLink, isOpen, Locked } from '../arcade/ui'
import { sfx } from '../engine/sfx'
import { grantRewards, setState, usePlayer } from '../engine/store'
import './PoleBridge.css'

const H = 240
const W = 270
const GROUND = 165
const HERO = 20
const GROW = 160 // px per second
const WALK = 120
const PERFECT = 3

interface Pillar {
  x: number
  w: number
}
interface Shard {
  x: number
  taken: boolean
}
type Phase = 'ready' | 'grow' | 'turn' | 'walk' | 'scroll' | 'fall' | 'over'

interface Game {
  pillars: Pillar[]
  /** Index of the pillar the ninja stands on. */
  at: number
  stick: number
  angle: number
  heroX: number
  flipped: boolean
  camera: number
  cameraTo: number
  phase: Phase
  score: number
  shards: number
  perfect: number
  combo: number
  fallY: number
  shard: Shard | null
  t: number
}

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function nextPillar(prev: Pillar, score: number): Pillar {
  const hard = Math.min(1, score / 30)
  const w = Math.round(rnd(12, 42 - hard * 18))
  const gap = Math.round(rnd(24, 80 + hard * 45))
  return { x: prev.x + prev.w + gap, w }
}

function newGame(): Game {
  const first = { x: 0, w: 48 }
  const second = nextPillar(first, 0)
  return { pillars: [first, second], at: 0, stick: 0, angle: 0, heroX: first.w - HERO, flipped: false, camera: 0, cameraTo: 0, phase: 'ready', score: 0, shards: 0, perfect: 0, combo: 0, fallY: 0, shard: makeShard(first, second), t: 0 }
}

/** Sometimes a shard hangs under the gap. */
function makeShard(a: Pillar, b: Pillar): Shard | null {
  const gap = b.x - (a.x + a.w)
  if (gap < 50 || Math.random() < 0.45) return null
  return { x: a.x + a.w + rnd(14, gap - 14), taken: false }
}

export default function PoleBridge() {
  const p = usePlayer()
  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef<Game>(newGame())
  const holding = useRef(false)
  const [hud, setHud] = useState({ score: 0, shards: 0, phase: 'ready' as Phase, perfect: false })
  const best = p.arcade?.stick ?? 0

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')!
    let raf = 0
    let last = performance.now()

    const finish = (g: Game) => {
      g.phase = 'over'
      sfx.wrong()
      const reward = g.shards + Math.floor(g.score / 5)
      if (reward) grantRewards(0, reward)
      setState((s) => ({ ...s, arcade: { ...s.arcade, stick: Math.max(s.arcade?.stick ?? 0, g.score) } }))
    }

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const g = game.current
      g.t += dt
      const cur = g.pillars[g.at]
      const nxt = g.pillars[g.at + 1]
      const edge = cur.x + cur.w
      let perfectHit = false
      if (g.phase === 'grow') {
        g.stick += GROW * dt
        if (!holding.current) g.phase = 'turn'
      } else if (g.phase === 'turn') {
        g.angle = Math.min(90, g.angle + 300 * dt)
        if (g.angle >= 90) {
          g.phase = 'walk'
          sfx.confirm()
        }
      } else if (g.phase === 'walk') {
        const tip = edge + g.stick
        const lands = tip >= nxt.x && tip <= nxt.x + nxt.w
        const target = lands ? nxt.x + nxt.w - HERO : tip
        g.heroX = Math.min(target, g.heroX + WALK * dt)
        // flipped under the pole: grab shards, but crash into the pillar
        if (g.flipped && g.heroX + HERO >= nxt.x && lands) {
          g.phase = 'fall'
        } else if (g.shard && !g.shard.taken && g.flipped && Math.abs(g.heroX + HERO / 2 - g.shard.x) < 10) {
          g.shard.taken = true
          g.shards += 1
          sfx.correct()
        }
        if (g.phase === 'walk' && g.heroX >= target) {
          if (!lands) g.phase = 'fall'
          else {
            const centre = nxt.x + nxt.w / 2
            perfectHit = Math.abs(tip - centre) <= PERFECT
            g.combo = perfectHit ? g.combo + 1 : 0
            g.score += perfectHit ? 1 + g.combo : 1
            if (perfectHit) g.perfect++
            sfx.correct()
            g.at += 1
            g.pillars.push(nextPillar(g.pillars[g.pillars.length - 1], g.score))
            g.shard = makeShard(g.pillars[g.at], g.pillars[g.at + 1])
            g.cameraTo = g.pillars[g.at].x + g.pillars[g.at].w - 54
            g.phase = 'scroll'
          }
        }
      } else if (g.phase === 'scroll') {
        g.camera += (g.cameraTo - g.camera) * Math.min(1, dt * 8)
        if (Math.abs(g.cameraTo - g.camera) < 0.5) {
          g.camera = g.cameraTo
          g.stick = 0
          g.angle = 0
          g.phase = 'ready'
        }
      } else if (g.phase === 'fall') {
        g.angle = Math.min(180, g.angle + 300 * dt)
        g.fallY += 420 * dt
        if (g.fallY > H) finish(g)
      }
      draw(ctx, g)
      setHud((h) => (h.score !== g.score || h.shards !== g.shards || h.phase !== g.phase || (perfectHit && !h.perfect) ? { score: g.score, shards: g.shards, phase: g.phase, perfect: perfectHit || (h.perfect && g.phase === 'scroll') } : h))
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  const press = () => {
    const g = game.current
    if (g.phase === 'ready') {
      holding.current = true
      g.phase = 'grow'
    } else if (g.phase === 'walk') {
      g.flipped = !g.flipped
    }
  }
  const release = () => {
    holding.current = false
  }
  const restart = () => {
    game.current = newGame()
    holding.current = false
    setHud({ score: 0, shards: 0, phase: 'ready', perfect: false })
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return
      e.preventDefault()
      if (e.repeat) return
      if (game.current.phase === 'over') restart()
      else press()
    }
    const up = (e: KeyboardEvent) => (e.key === ' ' || e.key === 'Enter') && release()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const over = hud.phase === 'over'
  if (!isOpen(p, 'bridge'))
    return (
      <Locked
        game="bridge"
        title={
          <>
            <span lang="ja">ぼうわたり</span> Bamboo Bridge
          </>
        }
      />
    )
  return (
    <main className="sn-page">
      <header className="sn-head">
        <BackLink />
        <span className="sn-title">
          <span lang="ja">ぼうわたり</span> Bamboo Bridge
        </span>
        <span className="sn-best">🏆 {Math.max(best, hud.score)}</span>
      </header>
      <div className="sn-stage">
        <canvas
          ref={canvas}
          width={W}
          height={H}
          className="sn-canvas"
          onPointerDown={(e) => {
            e.preventDefault()
            if (over) restart()
            else press()
          }}
          onPointerUp={release}
          onPointerLeave={release}
          onPointerCancel={release}
          aria-label="Bamboo Bridge: hold to stretch the pole, let go to drop it"
        />
        <div className="sn-score" aria-live="polite">
          {hud.score}
          {hud.shards > 0 && <small> ✦{hud.shards}</small>}
        </div>
        {hud.perfect && hud.phase === 'scroll' && <div className="sn-perfect">PERFECT!</div>}
        {hud.phase === 'ready' && hud.score === 0 && <div className="sn-tip">Hold to stretch the pole · let go to drop it · tap while running to flip for ✦</div>}
        {over && (
          <div className="sn-over">
            <strong>Score {hud.score}</strong>
            <span>
              +{hud.shards + Math.floor(hud.score / 5)} ✦ shards {hud.score > best && best > 0 ? '· New best!' : ''}
            </span>
            <button type="button" className="btn btn-primary" onClick={restart}>
              もう いちど · Again
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

/** Keep the canvas at the screen's real resolution and draw in game units (W×H). */
function fit(ctx: CanvasRenderingContext2D) {
  const c = ctx.canvas
  const dpr = Math.min(3, window.devicePixelRatio || 1)
  const pw = Math.round((c.clientWidth || W) * dpr)
  const ph = Math.round((pw * H) / W)
  if (c.width !== pw || c.height !== ph) {
    c.width = pw
    c.height = ph
  }
  ctx.setTransform(pw / W, 0, 0, pw / W, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
}

function sky(ctx: CanvasRenderingContext2D, g: Game) {
  const img = paint('bridge-bg')
  if (img) {
    const size = W * 1.15
    const pan = (g.camera * 0.04) % (size - W)
    ctx.drawImage(img, -pan, GROUND + 40 - size * 0.86, size, size)
    return
  }
  const s = ctx.createLinearGradient(0, 0, 0, H)
  s.addColorStop(0, '#232756')
  s.addColorStop(0.5, '#b8608a')
  s.addColorStop(0.8, '#f2a46a')
  s.addColorStop(1, '#f7c58a')
  ctx.fillStyle = s
  ctx.fillRect(0, 0, W, H)
  const moon = ctx.createRadialGradient(200, 52, 4, 200, 52, 40)
  moon.addColorStop(0, 'rgba(255,244,214,1)')
  moon.addColorStop(0.4, 'rgba(255,240,200,0.9)')
  moon.addColorStop(0.42, 'rgba(255,230,190,0.25)')
  moon.addColorStop(1, 'rgba(255,230,190,0)')
  ctx.fillStyle = moon
  ctx.fillRect(150, 2, 100, 100)
  // Layered ridges, the far ones paler, each with its own parallax.
  const layers = [
    { c: 'rgba(120,90,150,0.55)', k: 0.06, base: GROUND - 40, amp: 26, f: 0.021 },
    { c: 'rgba(90,70,125,0.8)', k: 0.12, base: GROUND - 18, amp: 34, f: 0.016 },
    { c: '#3d2f5f', k: 0.22, base: GROUND + 6, amp: 22, f: 0.027 },
  ]
  for (const L of layers) {
    ctx.fillStyle = L.c
    ctx.beginPath()
    ctx.moveTo(0, H)
    for (let x = 0; x <= W; x += 6) {
      const wx = x + g.camera * L.k
      ctx.lineTo(x, L.base - Math.abs(Math.sin(wx * L.f)) * L.amp - Math.sin(wx * L.f * 2.7) * 6)
    }
    ctx.lineTo(W, H)
    ctx.fill()
  }
  // Fuji, far away.
  const fx = 60 - ((g.camera * 0.05) % 400)
  ctx.fillStyle = 'rgba(100,80,140,0.9)'
  ctx.beginPath()
  ctx.moveTo(fx - 20, GROUND - 30)
  ctx.lineTo(fx + 70, GROUND - 112)
  ctx.lineTo(fx + 96, GROUND - 114)
  ctx.lineTo(fx + 190, GROUND - 30)
  ctx.fill()
  ctx.fillStyle = '#f4eefb'
  ctx.beginPath()
  ctx.moveTo(fx + 70, GROUND - 112)
  ctx.lineTo(fx + 96, GROUND - 114)
  ctx.lineTo(fx + 112, GROUND - 98)
  ctx.lineTo(fx + 100, GROUND - 102)
  ctx.lineTo(fx + 88, GROUND - 94)
  ctx.lineTo(fx + 76, GROUND - 102)
  ctx.lineTo(fx + 58, GROUND - 98)
  ctx.fill()
}

function pillar(ctx: CanvasRenderingContext2D, x: number, w: number) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0)
  g.addColorStop(0, '#5b4f7a')
  g.addColorStop(0.35, '#3a2f57')
  g.addColorStop(1, '#1c1530')
  ctx.fillStyle = g
  ctx.fillRect(x, GROUND, w, H - GROUND)
  // stone courses
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 0.6
  for (let y = GROUND + 12; y < H; y += 12) {
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + w, y)
    ctx.stroke()
  }
  // mossy cap with tufts
  ctx.fillStyle = '#3f8f4f'
  ctx.beginPath()
  ctx.roundRect(x - 1, GROUND - 1, w + 2, 5, 2)
  ctx.fill()
  ctx.fillStyle = '#5fb86b'
  for (let i = 0; i < w; i += 4) ctx.fillRect(x + i, GROUND - 2 - ((i * 7) % 3), 1.2, 2.5)
  // glowing red centre
  const cx = x + w / 2
  const r = ctx.createRadialGradient(cx, GROUND, 0, cx, GROUND, 6)
  r.addColorStop(0, 'rgba(255,90,60,1)')
  r.addColorStop(1, 'rgba(255,90,60,0)')
  ctx.fillStyle = r
  ctx.fillRect(cx - 6, GROUND - 6, 12, 10)
  ctx.fillStyle = '#ff5a3c'
  ctx.fillRect(cx - 2, GROUND - 0.5, 4, 2.5)
}

function bamboo(ctx: CanvasRenderingContext2D, len: number) {
  const g = ctx.createLinearGradient(-2, 0, 2, 0)
  g.addColorStop(0, '#9ccc65')
  g.addColorStop(0.5, '#689f38')
  g.addColorStop(1, '#33691e')
  ctx.fillStyle = g
  ctx.fillRect(-1.8, -len, 3.6, len)
  ctx.fillStyle = '#c5e1a5'
  for (let y = 10; y < len; y += 14) ctx.fillRect(-2.2, -y, 4.4, 1)
}

/** A small stick ninja with a red scarf (pose: running legs, or standing). */
function ninja(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, run: boolean) {
  const s = HERO / 26
  const ph = t * 16
  const hip: [number, number] = [x + 10 * s, y - 11 * s]
  ctx.strokeStyle = '#141418'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 2.4 * s
  const legs = run ? [Math.sin(ph) * 0.8, -Math.sin(ph) * 0.8] : [0.2, -0.2]
  for (const a of legs) {
    const k: [number, number] = [hip[0] + Math.sin(a) * 6 * s, hip[1] + Math.cos(a) * 6 * s]
    const b = a - (run ? 0.3 + Math.max(0, Math.cos(ph + (a > 0 ? 0 : Math.PI))) : 0.1)
    ctx.beginPath()
    ctx.moveTo(hip[0], hip[1])
    ctx.lineTo(k[0], k[1])
    ctx.lineTo(k[0] + Math.sin(b) * 6 * s, k[1] + Math.cos(b) * 6 * s)
    ctx.stroke()
  }
  const lean = run ? 0.3 : 0.05
  const neck: [number, number] = [hip[0] + Math.sin(lean) * 10 * s, hip[1] - Math.cos(lean) * 10 * s]
  ctx.lineWidth = 3.2 * s
  ctx.beginPath()
  ctx.moveTo(hip[0], hip[1])
  ctx.lineTo(neck[0], neck[1])
  ctx.stroke()
  // hakama
  ctx.fillStyle = '#1f2b4d'
  ctx.beginPath()
  ctx.moveTo(hip[0] - 2.5 * s, hip[1] - 1.5 * s)
  ctx.lineTo(hip[0] + 2.5 * s, hip[1] - 1.5 * s)
  ctx.lineTo(hip[0] + 5 * s, hip[1] + 5 * s)
  ctx.lineTo(hip[0] - 5 * s, hip[1] + 5 * s)
  ctx.fill()
  // arms and sword on the back
  ctx.lineWidth = 2 * s
  const arm = run ? -Math.sin(ph) * 0.9 : 0
  ctx.beginPath()
  ctx.moveTo(neck[0], neck[1] + 2 * s)
  ctx.lineTo(neck[0] + Math.sin(arm + 0.6) * 7 * s, neck[1] + 2 * s + Math.cos(arm + 0.6) * 7 * s)
  ctx.stroke()
  ctx.strokeStyle = '#cfd8dc'
  ctx.lineWidth = 1.2 * s
  ctx.beginPath()
  ctx.moveTo(hip[0] - 6 * s, hip[1] + 1 * s)
  ctx.lineTo(neck[0] + 5 * s, neck[1] - 4 * s)
  ctx.stroke()
  // head
  const head: [number, number] = [neck[0] + Math.sin(lean) * 3 * s, neck[1] - 3.6 * s]
  ctx.fillStyle = '#141418'
  ctx.beginPath()
  ctx.arc(head[0], head[1], 3.6 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.fillRect(head[0] + 1.2 * s, head[1] - 0.8 * s, 1.6 * s, 0.8 * s)
  // red headband and streaming tails
  ctx.strokeStyle = '#d32f2f'
  ctx.lineWidth = 1.3 * s
  ctx.beginPath()
  ctx.moveTo(head[0] - 3.4 * s, head[1] - 0.6 * s)
  ctx.lineTo(head[0] + 3.4 * s, head[1] - 0.6 * s)
  ctx.stroke()
  ctx.lineWidth = 1 * s
  ctx.beginPath()
  ctx.moveTo(head[0] - 3 * s, head[1] - 0.6 * s)
  for (let i = 1; i <= 4; i++) ctx.lineTo(head[0] - (3 + i * 2.6) * s, head[1] + (run ? 0 : i * 1.2) * s + Math.sin(t * 14 + i) * s)
  ctx.stroke()
}

function draw(ctx: CanvasRenderingContext2D, g: Game) {
  fit(ctx)
  sky(ctx, g)
  const sx = (x: number) => x - g.camera
  // falling petals
  ctx.fillStyle = 'rgba(255,200,220,0.8)'
  for (let i = 0; i < 14; i++) {
    const px = (((i * 53 + g.t * 14 - g.camera * 0.4) % (W + 20)) + W + 20) % (W + 20) - 10
    const py = (i * 37 + g.t * (12 + (i % 4) * 4)) % H
    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(g.t * 2 + i)
    ctx.beginPath()
    ctx.ellipse(0, 0, 2, 1, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  for (const p of g.pillars) {
    const x = sx(p.x)
    if (x > W || x + p.w < 0) continue
    pillar(ctx, x, p.w)
  }
  // mist in the gaps
  const mist = ctx.createLinearGradient(0, GROUND + 20, 0, H)
  mist.addColorStop(0, 'rgba(60,40,90,0)')
  mist.addColorStop(1, 'rgba(30,20,50,0.75)')
  ctx.fillStyle = mist
  ctx.fillRect(0, GROUND + 20, W, H - GROUND - 20)
  // shard under the gap
  if (g.shard && !g.shard.taken) {
    const x = sx(g.shard.x)
    const y = GROUND + 14 + Math.sin(g.t * 4) * 2
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 12)
    glow.addColorStop(0, 'rgba(200,160,255,0.8)')
    glow.addColorStop(1, 'rgba(200,160,255,0)')
    ctx.fillStyle = glow
    ctx.fillRect(x - 12, y - 12, 24, 24)
    ctx.restore()
    ctx.fillStyle = '#d7b8ff'
    ctx.beginPath()
    ctx.moveTo(x, y - 6)
    ctx.lineTo(x + 4, y)
    ctx.lineTo(x, y + 6)
    ctx.lineTo(x - 4, y)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.fillRect(x - 1, y - 3, 2, 2)
  }
  // the bamboo pole
  const cur = g.pillars[g.at]
  ctx.save()
  ctx.translate(sx(cur.x + cur.w), GROUND)
  ctx.rotate((g.angle * Math.PI) / 180)
  bamboo(ctx, g.stick)
  ctx.restore()
  // the ninja
  const run = g.phase === 'walk'
  const hx = sx(g.heroX)
  if (g.flipped && g.phase !== 'fall') {
    ctx.save()
    ctx.translate(0, GROUND * 2)
    ctx.scale(1, -1)
    ninja(ctx, hx, GROUND, g.t, run)
    ctx.restore()
  } else ninja(ctx, hx, GROUND + g.fallY, g.t, run)
}

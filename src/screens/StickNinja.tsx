/**
 * Stick Ninja (ぼうにんじゃ): a one-button arcade break from studying.
 * Hold to stretch a pole, let go to drop it across the gap; land the tip on
 * the next pillar to cross, hit the red centre for a bonus. While running
 * across, tap to flip under the pole and grab spirit shards, but flip back
 * before you reach the pillar or down you go. Shards collected are kept.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { spriteCanvas } from '../art'
import { sfx } from '../engine/sfx'
import { getState, grantRewards, setState, usePlayer } from '../engine/store'
import './StickNinja.css'

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

export default function StickNinja() {
  const p = usePlayer()
  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef<Game>(newGame())
  const holding = useRef(false)
  const [hud, setHud] = useState({ score: 0, shards: 0, phase: 'ready' as Phase, perfect: false })
  const best = p.arcade?.stick ?? 0

  useEffect(() => {
    const c = canvas.current!
    const ctx = c.getContext('2d')!
    let raf = 0
    let last = performance.now()
    const outfit = getState().outfit

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
      draw(ctx, g, outfit)
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
  return (
    <main className="sn-page">
      <header className="sn-head">
        <Link to="/arcade" className="btn btn-sm">
          ← あそび
        </Link>
        <span className="sn-title">
          <span lang="ja">ぼうにんじゃ</span> Stick Ninja
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
          aria-label="Stick Ninja: hold to stretch the pole, let go to drop it"
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

function draw(ctx: CanvasRenderingContext2D, g: Game, outfit: string) {
  ctx.imageSmoothingEnabled = false
  // dusk sky, a far mountain, drifting petals
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#2b2f5e')
  sky.addColorStop(0.55, '#c86b8a')
  sky.addColorStop(1, '#f7b267')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(255,240,200,0.85)'
  ctx.beginPath()
  ctx.arc(200, 52, 17, 0, Math.PI * 2)
  ctx.fill()
  const par = (g.camera * 0.15) % 300
  ctx.fillStyle = '#5a4a7a'
  for (let i = -1; i < 3; i++) {
    const bx = i * 300 - par
    ctx.beginPath()
    ctx.moveTo(bx, GROUND)
    ctx.lineTo(bx + 90, GROUND - 90)
    ctx.lineTo(bx + 112, GROUND - 95)
    ctx.lineTo(bx + 135, GROUND - 88)
    ctx.lineTo(bx + 240, GROUND)
    ctx.fill()
    ctx.fillStyle = '#f2eef8'
    ctx.beginPath()
    ctx.moveTo(bx + 90, GROUND - 90)
    ctx.lineTo(bx + 112, GROUND - 95)
    ctx.lineTo(bx + 135, GROUND - 88)
    ctx.lineTo(bx + 122, GROUND - 75)
    ctx.lineTo(bx + 105, GROUND - 80)
    ctx.fill()
    ctx.fillStyle = '#5a4a7a'
  }
  const sx = (x: number) => Math.round(x - g.camera)
  // pillars
  for (const p of g.pillars) {
    const x = sx(p.x)
    if (x > W || x + p.w < 0) continue
    ctx.fillStyle = '#1b1430'
    ctx.fillRect(x, GROUND, p.w, H - GROUND)
    ctx.fillStyle = '#3f8f4f'
    ctx.fillRect(x, GROUND, p.w, 4)
    ctx.fillStyle = '#e2432f'
    ctx.fillRect(x + Math.round(p.w / 2) - 2, GROUND, 4, 3)
  }
  // shard under the gap
  if (g.shard && !g.shard.taken) {
    const x = sx(g.shard.x)
    const y = GROUND + 14 + Math.sin(g.t * 4) * 2
    ctx.fillStyle = '#c7a3f0'
    ctx.beginPath()
    ctx.moveTo(x, y - 6)
    ctx.lineTo(x + 4, y)
    ctx.lineTo(x, y + 6)
    ctx.lineTo(x - 4, y)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.fillRect(x - 1, y - 3, 2, 2)
  }
  // the pole
  const cur = g.pillars[g.at]
  const ex = sx(cur.x + cur.w)
  ctx.save()
  ctx.translate(ex, GROUND)
  ctx.rotate((g.angle * Math.PI) / 180)
  ctx.fillStyle = '#8a5a2b'
  ctx.fillRect(-2, -g.stick, 3, g.stick)
  ctx.restore()
  // the ninja (the player's mage, running)
  const run = g.phase === 'walk'
  const frame = run ? Math.floor(g.t * 12) % 4 : 0
  const sprite = spriteCanvas('mage', { dir: 'right', anim: run ? 'run' : 'idle', frame, outfit })
  const hx = sx(g.heroX)
  const hy = GROUND - HERO + g.fallY
  if (g.flipped && g.phase !== 'fall') {
    ctx.save()
    ctx.translate(hx, GROUND + HERO)
    ctx.scale(1, -1)
    ctx.drawImage(sprite, 0, 0, HERO, HERO)
    ctx.restore()
  } else ctx.drawImage(sprite, hx, hy, HERO, HERO)
}

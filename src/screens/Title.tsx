/**
 * Title screen: a mage and Fude on a moonlit hill, sakura drifting past, the
 * 言葉の魔法 logo glowing overhead. PRESS START → Continue / New Game / Settings.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PixelSprite } from '../art'
import { preloadHd, useHdLoaded, useMediaQuery, useOptionalMedia } from '../art/hd'
import { CommandMenu } from '../components/CommandMenu'
import { playMusic } from '../engine/music'
import { resetProgress, usePlayer } from '../engine/store'
import { SceneBackdrop } from '../story/Backdrop'
import '../ui/hd.css'
import { uiSound } from '../ui/sound'
import Onboarding from './Onboarding'

type Phase = 'press' | 'menu' | 'confirm' | 'new'

function Moon() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const n = 24
    c.width = n
    c.height = n
    const ctx = c.getContext('2d')!
    const r = 10.5
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const dx = x + 0.5 - 12
        const dy = y + 0.5 - 12
        const d = Math.hypot(dx, dy)
        if (d > r) continue
        // light from the upper left; a crescent of shade on the lower right
        const shade = Math.hypot(dx - 3, dy - 3) > r - 1 && dx + dy > 6
        ctx.fillStyle = d > r - 1.2 ? '#fff8e0' : shade ? '#d8cfb4' : '#f4ecd8'
        ctx.fillRect(x, y, 1, 1)
      }
    ctx.fillStyle = '#ddd3b6'
    ;[
      [8, 9, 2],
      [14, 6, 1],
      [13, 14, 3],
      [7, 15, 1],
    ].forEach(([x, y, s]) => ctx.fillRect(x, y, s, s))
  }, [])
  return <canvas ref={ref} className="pixel title-moon" aria-hidden />
}

function Petals({ count = 16 }: { count?: number }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 61) % 100,
        delay: -((i * 1.37) % 9),
        dur: 7 + ((i * 7) % 6),
        size: i % 3 === 0 ? 6 : 4,
        drift: 60 + ((i * 37) % 90),
      })),
    [count],
  )
  return (
    <div className="petals" aria-hidden>
      {petals.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Illustrated key art (landscape or portrait), or the optional looping video,
 * behind the logo. Renders nothing until something is ready to show.
 */
function TitleArt({ onReady }: { onReady: (ready: boolean) => void }) {
  const portrait = useMediaQuery('(orientation: portrait)')
  const calm = useMediaQuery('(prefers-reduced-motion: reduce)')
  const id = portrait ? 'title-tall' : 'title-wide'
  useEffect(() => preloadHd([id]), [id])
  const main = useHdLoaded(id)
  const other = useHdLoaded(portrait ? 'title-wide' : 'title-tall')
  const still = main ?? other
  const video = useOptionalMedia('art/hd/title/title-loop.mp4', 'video/')
  const [playing, setPlaying] = useState(false)
  const useVideo = !!video && !calm
  const ready = !!still || playing
  const cb = useRef(onReady)
  cb.current = onReady
  useEffect(() => cb.current(ready), [ready])
  if (!still && !useVideo) return null
  return (
    <div className={`title-hd ${ready ? 'ready' : ''} ${portrait ? 'tall' : 'wide'}`} aria-hidden>
      {still && <img className="hd-img title-hd-img" src={still} alt="" draggable={false} />}
      {useVideo && (
        <video className={`title-hd-video ${playing ? 'on' : ''}`} src={video} poster={still ?? undefined} autoPlay muted loop playsInline preload="auto" onPlaying={() => setPlaying(true)} onError={() => setPlaying(false)} />
      )}
      <div className="title-hd-shade" />
    </div>
  )
}

export default function Title() {
  const p = usePlayer()
  const nav = useNavigate()
  const hasSave = p.onboarded
  const [phase, setPhase] = useState<Phase>('press')
  const [hd, setHd] = useState(false)

  // Music: try now, and again on the first gesture (autoplay policies).
  useEffect(() => {
    playMusic('title')
    const kick = () => playMusic('title')
    window.addEventListener('pointerdown', kick, { once: true })
    window.addEventListener('keydown', kick, { once: true })
    return () => {
      window.removeEventListener('pointerdown', kick)
      window.removeEventListener('keydown', kick)
    }
  }, [])

  // PRESS START: any key or tap.
  useEffect(() => {
    if (phase !== 'press') return
    const go = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.metaKey || e.ctrlKey) return
      e.preventDefault()
      uiSound.confirm()
      setPhase('menu')
    }
    window.addEventListener('keydown', go)
    return () => window.removeEventListener('keydown', go)
  }, [phase])

  if (phase === 'new') return <Onboarding onDone={() => nav('/world')} />

  const items = [
    ...(hasSave ? [{ id: 'continue', label: <TitleLabel jp="つづきから" en="Continue" />, hint: `${p.name}` }] : []),
    { id: 'new', label: <TitleLabel jp="はじめから" en="New Game" /> },
    { id: 'settings', label: <TitleLabel jp="せってい" en="Settings" /> },
  ]

  const choose = (id: string) => {
    if (id === 'continue') nav('/world')
    else if (id === 'settings') nav('/settings')
    else if (id === 'new') {
      if (hasSave) setPhase('confirm')
      else setPhase('new')
    }
  }

  return (
    <div
      className={`title-screen ${hd ? 'has-hd' : ''}`}
      onClick={() => {
        if (phase === 'press') {
          uiSound.confirm()
          setPhase('menu')
        }
      }}
    >
      <SceneBackdrop bg="night-hill" className="title-backdrop" />
      <Moon />
      <TitleArt onReady={setHd} />
      <div className="title-hill-cast" aria-hidden hidden={hd}>
        <span className="title-mage">
          <PixelSprite id="mage" outfit={p.onboarded ? p.outfit : 'apprentice'} dir="right" scale={4} animate />
        </span>
        <span className="title-fude">
          <PixelSprite id="fude" dir="left" scale={4} animate />
        </span>
      </div>
      <Petals />

      <header className="title-logo">
        <h1 lang="ja" className="title-jp">
          言葉の魔法
        </h1>
        <div className="title-en">
          <span>
            KOTOBA NO MAH<span className="macron">O</span>
          </span>
          <small>~ The Magic of Words ~</small>
        </div>
      </header>

      <div className="title-bottom">
        {phase === 'press' && (
          <button type="button" className="title-press" autoFocus>
            PRESS START
            <small lang="ja">はじめる</small>
          </button>
        )}
        {phase === 'menu' && (
          <div className="card title-menu pop" onClick={(e) => e.stopPropagation()}>
            <CommandMenu items={items} onSelect={choose} onCancel={() => setPhase('press')} label="Title menu" />
          </div>
        )}
        {phase === 'confirm' && (
          <div className="card title-menu title-confirm pop" onClick={(e) => e.stopPropagation()}>
            <p>
              <span lang="ja">ぼうけんのしょを けして、はじめから？</span>
              <small className="muted">Erase your adventure log and start over?</small>
            </p>
            <CommandMenu
              items={[
                { id: 'no', label: <TitleLabel jp="いいえ" en="No" /> },
                { id: 'yes', label: <TitleLabel jp="はい" en="Yes, erase it" /> },
              ]}
              onSelect={(id) => {
                if (id === 'yes') {
                  resetProgress()
                  setPhase('new')
                } else setPhase('menu')
              }}
              onCancel={() => setPhase('menu')}
              label="Confirm new game"
            />
          </div>
        )}
      </div>
      <footer className="title-foot">© 言葉の魔法 · v2</footer>
    </div>
  )
}

function TitleLabel({ jp, en }: { jp: string; en: string }) {
  return (
    <span className="title-label">
      <span lang="ja">{jp}</span>
      <small>{en}</small>
    </span>
  )
}

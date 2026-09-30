/**
 * Story cutscenes: letterboxed stage with a tile diorama, pixel actors that
 * enter/emote/shake, and a Dragon-Quest message window with a portrait and
 * typewriter text. Tap / Z / Enter / Space advances; hold SKIP (or Esc) to
 * skip the scene. Scenes are data in ./scenes.ts.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ENEMY_SPRITES, PixelSprite } from '../art'
import { playMusic } from '../engine/music'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import { getState, immersionOf, markScene, usePlayer } from '../engine/store'
import { SceneBackdrop } from './Backdrop'
import { backdropAt, castAt, fill, SCENES, SPEAKERS, speechText, type ActorId } from './scenes'
import './Cutscene.css'

export interface CutsceneProps {
  /** Scene id, e.g. 'intro', 'arrive-village', 'arrive-fields', 'pre-boss-r1', 'post-boss-r1', 'ending'. */
  id: string
  onDone: () => void
}

/** Whether a scene with this id exists. */
export function hasScene(id: string): boolean {
  return id in SCENES
}

const HEROES: ActorId[] = ['you', 'fude']
const isEnemy = (sprite: string) => (ENEMY_SPRITES as readonly string[]).includes(sprite)
const SKIP_HOLD_MS = 650

function blip() {
  ;(sfx as unknown as Record<string, (() => void) | undefined>).blip?.()
}

export function Cutscene({ id, onDone }: CutsceneProps) {
  const scene = SCENES[id]
  const p = usePlayer()
  const imm = immersionOf(p)
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(0)
  const [showEn, setShowEn] = useState(false)
  const [skipHold, setSkipHold] = useState(0)
  const done = useRef(false)
  const doneCb = useRef(onDone)
  doneCb.current = onDone

  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    markScene(id)
    doneCb.current()
  }, [id])

  // Unknown scene: finish immediately (contract).
  useEffect(() => {
    if (!scene) finish()
  }, [scene, finish])

  useEffect(() => {
    if (scene?.music) playMusic(scene.music)
  }, [scene])

  const step = scene?.steps[i]
  const primary = step ? fill(step.jp ?? step.en, p.name) : ''
  const secondary = step?.jp ? fill(step.en, p.name) : ''
  const typing = shown < primary.length
  const isPause = !!step?.pause && !step.jp && !step.en

  // Typewriter.
  useEffect(() => {
    setShown(0)
    setShowEn(false)
    if (!step) return
    if (step.jp) void speak(speechText(step, getState().name))
    if (step.shake || step.flash) sfx.hit()
  }, [i, step])

  useEffect(() => {
    if (!typing || isPause) return
    const perChar = step?.jp ? 45 : 22
    const t = setTimeout(() => {
      setShown((n) => n + 1)
      const ch = primary[shown]
      if (ch && ch.trim() && shown % 2 === 0) blip()
    }, perChar)
    return () => clearTimeout(t)
  }, [typing, shown, primary, step, isPause])

  const next = useCallback(() => {
    if (!scene) return
    if (i + 1 >= scene.steps.length) finish()
    else setI(i + 1)
  }, [scene, i, finish])

  // Silent beats auto-advance.
  useEffect(() => {
    if (!isPause || !step?.pause) return
    const t = setTimeout(next, step.pause)
    return () => clearTimeout(t)
  }, [isPause, step, next])

  const advance = useCallback(() => {
    if (typing && !isPause) {
      setShown(primary.length)
      return
    }
    sfx.click()
    next()
  }, [typing, isPause, primary, next])

  // Hold-to-skip.
  const holdStart = useRef(0)
  const holdRaf = useRef(0)
  const startHold = useCallback(() => {
    holdStart.current = performance.now()
    const tick = () => {
      const f = Math.min(1, (performance.now() - holdStart.current) / SKIP_HOLD_MS)
      setSkipHold(f)
      if (f >= 1) finish()
      else holdRaf.current = requestAnimationFrame(tick)
    }
    cancelAnimationFrame(holdRaf.current)
    holdRaf.current = requestAnimationFrame(tick)
  }, [finish])
  const endHold = useCallback(() => {
    cancelAnimationFrame(holdRaf.current)
    setSkipHold(0)
  }, [])
  useEffect(() => () => cancelAnimationFrame(holdRaf.current), [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Swallow every key while a scene plays (capture phase): the map must not move.
      e.stopImmediatePropagation()
      if (['z', 'Z', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        if (!e.repeat) advance()
      } else if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
        e.preventDefault()
        if (!e.repeat) startHold()
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') endHold()
    }
    window.addEventListener('keydown', down, true)
    window.addEventListener('keyup', up, true)
    return () => {
      window.removeEventListener('keydown', down, true)
      window.removeEventListener('keyup', up, true)
    }
  }, [advance, startHold, endHold])

  const cast = useMemo(() => (scene ? castAt(scene, i) : []), [scene, i])
  const bg = scene ? backdropAt(scene, i) : 'void'

  if (!scene || !step) return null

  const speaker = step.who ? SPEAKERS[step.who] : null
  const emoteTarget = step.emote ? (step.target ?? step.who) : undefined
  const heroes = cast.filter((a) => HEROES.includes(a))
  const others = cast.filter((a) => !HEROES.includes(a))
  const enShown = !!secondary && !typing && (imm <= 2 || showEn)

  return (
    <div className="cutscene" role="dialog" aria-label={scene.title} onClick={advance}>
      <div className="cs-bar cs-bar-top" />
      <div key={step.shake ? `s${i}` : 'stage'} className={`cs-stage ${step.shake ? 'cs-shake' : ''}`}>
        <SceneBackdrop key={bg} bg={bg} className="cs-fade-in" />
        <div className="cs-actors">
          {[...heroes.map((a, k) => ({ a, side: 'left' as const, k, n: heroes.length })), ...others.map((a, k) => ({ a, side: 'right' as const, k, n: others.length }))].map(({ a, side, k, n }) => {
            const sp = SPEAKERS[a]
            const enemy = isEnemy(sp.sprite)
            const x = side === 'left' ? 16 + k * 14 : 84 - (n - 1 - k) * 16
            return (
              <div key={a} className={`cs-actor cs-enter-${side} ${step.who === a ? 'talking' : ''} ${enemy ? 'enemy' : ''}`} style={{ left: `${x}%` }}>
                {emoteTarget === a && (
                  <span key={`e${i}`} className="cs-emote">
                    {step.emote}
                  </span>
                )}
                <PixelSprite id={sp.sprite} scale={enemy ? 3 : 4} dir={side === 'left' ? 'right' : 'left'} animate />
              </div>
            )
          })}
        </div>
        {step.flash && <div key={`f${i}`} className="cs-flash" style={{ background: step.flash }} />}
      </div>

      {!isPause && (
        <div key={`m${i}`} className={`cs-window card ${speaker ? '' : 'narration'}`}>
          {speaker && (
            <>
              <div className="cs-name" style={{ color: speaker.color }}>
                {fill(imm >= 2 ? speaker.jp : speaker.name, p.name)}
              </div>
              <div className="cs-portrait">
                <PixelSprite id={speaker.sprite} scale={isEnemy(speaker.sprite) ? 2 : 4} dir="down" animate />
              </div>
            </>
          )}
          <div className="cs-text">
            <p className={`cs-primary ${step.jp ? '' : 'en'}`} lang={step.jp ? 'ja' : undefined}>
              <span>{primary.slice(0, shown)}</span>
              <span className="cs-ghost">{primary.slice(shown)}</span>
            </p>
            {secondary &&
              (enShown ? (
                <p className={`cs-secondary ${imm === 2 ? 'dim' : ''}`}>{secondary}</p>
              ) : (
                !typing && (
                  <button
                    type="button"
                    className="cs-en-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowEn(true)
                    }}
                  >
                    EN
                  </button>
                )
              ))}
          </div>
          {!typing && <span className="cs-more">▼</span>}
        </div>
      )}

      <button
        type="button"
        className="cs-skip"
        aria-label="Hold to skip scene"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => {
          e.stopPropagation()
          startHold()
        }}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onPointerCancel={endHold}
      >
        <span className="cs-skip-fill" style={{ width: `${skipHold * 100}%` }} />
        <span className="cs-skip-label">SKIP ▶▶</span>
      </button>
      <div className="cs-bar cs-bar-bottom" />
    </div>
  )
}

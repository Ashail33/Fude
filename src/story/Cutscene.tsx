/**
 * Story cutscenes: letterboxed stage with a tile diorama, pixel actors that
 * enter/emote/shake, and a Dragon-Quest message window with a portrait and
 * typewriter text. Tap / Z / Enter / Space advances; hold SKIP (or Esc) to
 * skip the scene. Scenes are data in ./scenes.ts.
 */
import { Weave } from '../components/Weave'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ENEMY_SPRITES, PixelSprite } from '../art'
import { BOSS_HD, preloadHd, speakerHd, useHdLoaded } from '../art/hd'
import { preloadRegionHd } from '../battle/hd'
import { REGIONS } from '../data/regions'
import { playMusic } from '../engine/music'
import { sfx } from '../engine/sfx'
import { speak } from '../engine/speech'
import { voices } from '../engine/voice'
import { getState, immersionOf, markScene, usePlayer } from '../engine/store'
import { SceneBackdrop } from './Backdrop'
import { KenBurns, VnBusts, type Bust } from '../ui/Hd'
import { LivingArt } from '../anim/LivingArt'
import { backdropAt, castAt, fill, SCENES, SPEAKERS, speechText, type ActorId, type Backdrop, type Scene } from './scenes'
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

/** Illustrated backdrop for the story backdrops that match a region. */
const BG_HD: Partial<Record<Backdrop, string>> = { village: 'battle-village', fields: 'battle-fields', forest: 'battle-forest', shrine: 'battle-shrine', tower: 'battle-tower', 'night-hill': 'intro-3', dawn: 'ending', harbour: 'battle-harbour', onsen: 'battle-onsen', castletown: 'battle-castletown', snowtemple: 'battle-snowtemple', clouds: 'battle-clouds' }

/**
 * The illustration behind step `i`: a full scene still (the characters are
 * painted in, so pixel actors hide) or a region backdrop (bosses stand on it).
 */
export function sceneArt(scene: Scene, i: number): { id: string; still: boolean } | null {
  const bg = backdropAt(scene, i)
  if (scene.art) return bg === 'void' ? null : { id: scene.art, still: true }
  if (scene.id === 'intro') return { id: bg !== 'void' ? 'intro-3' : i <= 2 ? 'intro-1' : 'intro-2', still: true }
  if (scene.id.startsWith('arrive-')) return { id: scene.id, still: true }
  // Fude's memories and the true ending are painted scenes; the void between memories stays dark
  if (scene.memory || scene.id === 'true-ending') return bg === 'void' ? null : { id: scene.id, still: true }
  if (scene.id === 'ending') return bg === 'dawn' ? { id: 'ending', still: true } : { id: 'battle-summit', still: false }
  if (bg === 'void') return /-r5$/.test(scene.id) ? { id: 'battle-summit', still: false } : null
  const id = BG_HD[bg]
  return id ? { id, still: id.startsWith('intro') || id === 'ending' } : null
}

/** Boss actors (drawn as big illustrations on stage). */
const bossHd = (a: ActorId): string | undefined => (a in BOSS_HD ? BOSS_HD[a] : undefined)

/** All art a scene may show (to preload). */
function sceneAssets(scene: Scene): string[] {
  const ids = new Set<string>()
  scene.steps.forEach((_, i) => {
    const art = sceneArt(scene, i)
    if (art) ids.add(art.id)
    castAt(scene, i).forEach((a) => {
      const b = bossHd(a)
      if (b) ids.add(b)
    })
  })
  for (const st of scene.steps) if (st.who) ids.add(speakerHd(SPEAKERS[st.who].sprite, st.who) ?? '')
  ids.delete('')
  return [...ids]
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

  // Warm the illustration cache (this scene, and the region's battles after an arrival).
  useEffect(() => {
    if (!scene) return
    preloadHd(sceneAssets(scene))
    const r = REGIONS.find((x) => scene.id === `arrive-${x.map}`)
    if (r) preloadRegionHd(r.id)
  }, [scene])

  const step = scene?.steps[i]
  const primary = step ? fill(step.jp ?? step.en, p.name) : ''
  const secondary = step?.jp ? fill(step.en, p.name) : ''
  const typing = shown < primary.length
  const isPause = !!step?.pause && !step.jp && !step.en

  // Typewriter.
  const voiceId = step?.who ? SPEAKERS[step.who].sprite : undefined
  const cried = useRef(new Set<string>())
  const leads = useRef(new Map<number, number>())
  useEffect(() => {
    setShown(0)
    setShowEn(false)
    if (!step) return
    if (step.shake || step.flash) sfx.hit()
    // Signature sounds: when an actor walks on, or first speaks in the scene
    // (speech then waits a moment so the cry is heard).
    const who = step.enter ?? step.who
    if (who && !cried.current.has(who)) {
      cried.current.add(who)
      if (voices.cry(SPEAKERS[who].sprite) && who === step.who) leads.current.set(i, voices.cryLead(SPEAKERS[who].sprite))
    }
    const lead = leads.current.get(i) ?? 0
    if (!step.jp) return
    const text = speechText(step, getState().name)
    const speaker = step.who ? SPEAKERS[step.who].sprite : undefined
    if (!lead) {
      void speak(text, { speaker })
      return
    }
    const id = setTimeout(() => void speak(text, { speaker }), lead)
    return () => clearTimeout(id)
  }, [i, step])

  useEffect(() => {
    if (!typing || isPause) return
    const perChar = step?.jp ? 45 : 22
    const t = setTimeout(() => {
      setShown((n) => n + 1)
      const ch = primary[shown]
      if (ch) voices.talk(voiceId, ch, shown)
    }, perChar)
    return () => clearTimeout(t)
  }, [typing, shown, primary, step, isPause, voiceId])

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

  // ─── Illustrated art (falls back to the tile diorama + pixel actors) ───
  const art = scene ? sceneArt(scene, i) : null
  const artUrl = useHdLoaded(art?.id)
  const stageBossActor = cast.find((a) => bossHd(a))
  const stageBossUrl = useHdLoaded(artUrl && !art?.still && stageBossActor ? bossHd(stageBossActor) : null)
  const illustrated = !!artUrl && (!!art?.still || !!stageBossUrl)
  /** Last hero / other speaker so far (for the visual-novel busts). */
  const speakers = useMemo(() => {
    let hero: ActorId | undefined
    let other: ActorId | undefined
    if (scene)
      for (let k = 0; k <= i && k < scene.steps.length; k++) {
        const w = scene.steps[k].who
        if (!w) continue
        if (HEROES.includes(w)) hero = w
        else other = w
      }
    return { hero, other }
  }, [scene, i])
  const bustOf = (a: ActorId | undefined) => (a ? speakerHd(SPEAKERS[a].sprite, a) : undefined)
  const busts: Bust[] = []
  if (speakers.hero) {
    const id = bustOf(speakers.hero)
    if (id) busts.push({ id, side: 'left', active: step?.who === speakers.hero, talking: typing && !isPause })
  }
  if (speakers.other && cast.includes(speakers.other) && !(stageBossUrl && speakers.other === stageBossActor)) {
    const id = bustOf(speakers.other)
    if (id) busts.push({ id, side: 'right', active: step?.who === speakers.other, talking: typing && !isPause })
  }
  const whoBust = useHdLoaded(step?.who && !(stageBossUrl && step.who === stageBossActor) ? bustOf(step.who) : null)
  const hidePortrait = !!whoBust || (!!stageBossUrl && step?.who === stageBossActor)

  // Screen shake without remounting the stage (keeps the art's pan/zoom running).
  const stageRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!step?.shake) return
    stageRef.current?.animate?.(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }],
      { duration: 400, easing: 'steps(6)' },
    )
  }, [i, step])

  if (!scene || !step) return null

  const speaker = step.who ? SPEAKERS[step.who] : null
  const emoteTarget = step.emote ? (step.target ?? step.who) : undefined
  const heroes = cast.filter((a) => HEROES.includes(a))
  const others = cast.filter((a) => !HEROES.includes(a))
  const enShown = !!secondary && !typing && (imm <= 2 || showEn)

  return (
    <div className={`cutscene ${scene.memory ? 'memory' : ''}`} role="dialog" aria-label={scene.title} onClick={advance}>
      <div className="cs-bar cs-bar-top" />
      <div ref={stageRef} className={`cs-stage ${illustrated ? 'illustrated' : ''}`}>
        <SceneBackdrop key={bg} bg={bg} className="cs-fade-in" />
        <KenBurns url={artUrl} className="cs-art" motion={art?.still ? undefined : 'kb-c'} />
        {stageBossUrl && stageBossActor && (
          <div key={stageBossActor} className={`cs-boss ${stageBossActor === 'dragon' ? 'dragon' : ''} ${step.who === stageBossActor ? 'talking' : step.who ? 'listening' : ''}`}>
            {emoteTarget === stageBossActor && (
              <span key={`e${i}`} className="cs-emote">
                {step.emote}
              </span>
            )}
            <LivingArt
              src={stageBossUrl}
              id={bossHd(stageBossActor)}
              className="cs-boss-la"
              talking={step.who === stageBossActor && typing && !isPause}
              tint={step.who && step.who !== stageBossActor ? 0.72 : 1}
              look={-0.4}
            />
          </div>
        )}
        <div className={`cs-actors ${illustrated ? 'hidden' : ''}`}>
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

      <div className="cs-dock">
      {!isPause && busts.length > 0 && (
        <div className="cs-vn">
          <VnBusts busts={busts} />
          {emoteTarget && busts.some((b) => b.active) && illustrated && emoteTarget === step.who && (
            <span key={`ve${i}`} className={`cs-emote cs-vn-emote ${HEROES.includes(emoteTarget) ? 'left' : 'right'}`}>
              {step.emote}
            </span>
          )}
        </div>
      )}
      {!isPause && (
        <div key={`m${i}`} className={`cs-window card ${speaker ? '' : 'narration'} ${speaker && hidePortrait ? 'no-portrait' : ''}`}>
          {speaker && (
            <>
              <div className={`cs-name ${whoBust && step.who && !HEROES.includes(step.who) ? 'right' : ''}`} style={{ color: speaker.color }}>
                {fill(imm >= 2 ? speaker.jp : speaker.name, p.name)}
              </div>
              {!hidePortrait && (
                <div className="cs-portrait">
                  <PixelSprite id={speaker.sprite} scale={isEnemy(speaker.sprite) ? 2 : 4} dir="down" animate anim="idle" />
                </div>
              )}
            </>
          )}
          <div className="cs-text">
            <p className={`cs-primary ${step.jp ? '' : 'en'}`} lang={step.jp ? 'ja' : undefined}>
              <span>{primary.slice(0, shown)}</span>
              <span className="cs-ghost">{primary.slice(shown)}</span>
            </p>
            {secondary &&
              (enShown ? (
                <p className={`cs-secondary ${imm === 2 ? 'dim' : ''}`}>
                  <Weave text={secondary} />
                </p>
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
      </div>

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

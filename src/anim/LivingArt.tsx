/**
 * "Living art": a single illustrated cut-out drawn as a WebGL grid mesh
 * whose vertices are deformed every frame (breathing, sway, flutter, waves,
 * hover, jelly) plus spring-driven reactions (hit, lunge, defeat dissolve,
 * spawn pop, talking bounce). A static <img> is always rendered underneath
 * for layout and as the fallback when WebGL is unavailable or lost.
 *
 *   <LivingArt src={url} id="kana-oni" cue={efx} edge="#f7c948" />
 *   <LivingScene src={url} id="battle-forest" />   // full-bleed backdrops
 */
import { useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type Ref, type RefObject } from 'react'
import { deformGrid, floatPose, profilePad, reducedProfile, type Dyn, type Profile } from './deform'
import { hexRgb, MeshRenderer } from './gl'
import { profileFor, sceneFor } from './profiles'
import { coverRect, sceneUv, type SceneMotion } from './scene'
import { CRITICAL, Reactor, Spring, type Cue } from './spring'
import { onTick, prefersReducedMotion } from './ticker'
import './anim.css'

export type { Cue } from './spring'

export interface LivingArtHandle {
  /** Fire a reaction: dir −1 left / +1 right / 0 either, k = strength. */
  cue(c: Cue, dir?: number, k?: number): void
  reset(): void
}

const CUES: ReadonlySet<string> = new Set<Cue>(['hit', 'crit', 'attack', 'attack-big', 'defeat', 'spawn', 'hop', 'dodge', 'talk'])

/** Map a free-form state string (e.g. a battle CSS class list) to a cue. */
export function cueOf(s: string | undefined | null): Cue | null {
  if (!s) return null
  const parts = s.split(/\s+/)
  if (parts.includes('lunge')) return parts.includes('big') ? 'attack-big' : 'attack'
  if (parts.includes('dying')) return 'defeat'
  if (parts.includes('crit')) return 'crit'
  if (parts.includes('idle-bounce')) return 'hop'
  for (const p of parts) if (CUES.has(p)) return p as Cue
  return null
}

/** Increments per live GL renderer so effects re-bind to the new canvas. */
let serial = 0

const dprOf = () => Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)

/** Visible on screen (pauses animation when scrolled away / display:none). */
function useVisible(ref: RefObject<Element | null>) {
  const vis = useRef(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((es) => {
      for (const e of es) vis.current = e.isIntersecting
    })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return vis
}

/** Fit the drawing buffer to the canvas's CSS size × DPR (capped). */
function fitCanvas(r: MeshRenderer, c: HTMLCanvasElement, maxPx = 2_400_000) {
  const w = c.clientWidth
  const h = c.clientHeight
  if (!w || !h) return false
  let d = dprOf()
  if (w * h * d * d > maxPx) d = Math.sqrt(maxPx / (w * h))
  r.resize(Math.max(1, Math.round(w * d)), Math.max(1, Math.round(h * d)))
  return true
}

/** Create a renderer for a canvas + loaded image; null (→ static fallback) on any failure. */
function makeRenderer(canvas: HTMLCanvasElement, img: HTMLImageElement): MeshRenderer | null {
  try {
    const r = new MeshRenderer(canvas, 24)
    r.setImage(img)
    return r
  } catch (e) {
    console.info('[anim] WebGL unavailable, using the static image', e)
    return null
  }
}

/**
 * A fresh <canvas> per GL lifetime: a canvas whose context was released
 * can't be reused (matters for StrictMode re-mounts and src changes).
 */
function mountCanvas(parent: HTMLElement, style: Partial<CSSStyleDeclaration>): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.className = 'la-canvas'
  c.setAttribute('aria-hidden', 'true')
  Object.assign(c.style, style)
  parent.appendChild(c)
  return c
}

/** Wait until an <img> has decoded pixels. */
function whenLoaded(img: HTMLImageElement, cb: () => void): () => void {
  if (img.complete && img.naturalWidth) {
    cb()
    return () => {}
  }
  const on = () => img.naturalWidth && cb()
  img.addEventListener('load', on)
  return () => img.removeEventListener('load', on)
}

export interface LivingArtProps {
  src: string
  /** HD asset id (picks the motion profile). */
  id?: string
  /** Explicit profile (overrides `id`). */
  profile?: Profile
  className?: string
  imgClassName?: string
  style?: CSSProperties
  imgStyle?: CSSProperties
  /** Reaction trigger: fires whenever it changes to a recognised cue ('hit', 'attack', 'defeat', … or battle classes like 'lunge big'). */
  cue?: string | null
  /** Delay (ms) of the pop-in when `cue` leaves 'enter' (staggered spawns). */
  spawnDelay?: number
  /** Direction for `cue` (−1 / 0 / +1). */
  cueDir?: number
  /** Dissolve edge glow colour (#rrggbb), e.g. the finishing element. */
  edge?: string
  /** Speaking: a soft bounce at syllable pace. */
  talking?: boolean
  /** Lean toward a look target, −1 (left) … +1 (right). */
  look?: number
  /** Mirror horizontally. */
  flip?: boolean
  /** Brightness tint (1 = normal) — cheaper than a CSS filter. */
  tint?: number
  /** Called every frame with the vertical lift (fraction of height, negative = up) — e.g. to scale a ground shadow. */
  onLift?: (lift: number) => void
  handle?: Ref<LivingArtHandle>
  /** Time offset (s) so identical monsters don't move in lockstep. */
  seed?: number
}

/** An illustrated figure brought to life with mesh deformation + reactions. */
export function LivingArt(props: LivingArtProps) {
  const { src, id, className, imgClassName, style, imgStyle, handle } = props
  const rootRef = useRef<HTMLSpanElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<MeshRenderer | null>(null)
  const reactor = useMemo(() => new Reactor(), [])
  const [on, setOn] = useState(0)
  const P = useRef(props)
  P.current = props
  const visible = useVisible(rootRef)

  const reduced = useMemo(prefersReducedMotion, [])
  const base = props.profile ?? profileFor(id)
  const profile = useMemo(() => (reduced ? reducedProfile(base) : base), [base, reduced])
  const aspectRef = useRef(1)
  const pad = useMemo(() => profilePad(profile, 1.2), [profile])
  reactor.reduced = reduced

  useImperativeHandle(handle, () => ({ cue: (c, dir, k) => reactor.cue(c, dir, k), reset: () => reactor.reset() }), [reactor])

  // Dev only: window.__livingArt lets tests / the console fire reactions.
  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return
    const w = window as unknown as { __livingArt?: Map<Reactor, string> }
    const reg = (w.__livingArt ??= new Map())
    reg.set(reactor, id ?? src)
    return () => {
      reg.delete(reactor)
    }
  }, [reactor, id, src])

  // Cue prop → reaction. 'enter' holds the art hidden; leaving it pops it in.
  const lastCue = useRef<string | null | undefined>(undefined)
  useEffect(() => {
    const c = props.cue ?? null
    const prev = lastCue.current
    if (c === prev) return
    lastCue.current = c
    const entering = (s: string | null | undefined) => !!s && s.split(/\s+/).includes('enter')
    if (entering(c)) {
      reactor.hide()
      return
    }
    if (entering(prev)) {
      const d = props.spawnDelay ?? 0
      if (d <= 0) reactor.cue('spawn')
      else {
        const id = setTimeout(() => reactor.cue('spawn'), d)
        return () => clearTimeout(id)
      }
      return
    }
    const q = cueOf(c)
    // A cue already present at mount is a state, not an event (except spawn).
    if (q && !(prev === undefined && q !== 'spawn')) reactor.cue(q, props.cueDir ?? 0)
  }, [props.cue, props.cueDir, props.spawnDelay, reactor])

  // WebGL setup per image.
  useEffect(() => {
    const img = imgRef.current
    const root = rootRef.current
    if (!img || !root) return
    const canvas = mountCanvas(root, {
      left: `${-pad.x * 100}%`,
      right: `${-pad.x * 100}%`,
      top: `${-pad.top * 100}%`,
      bottom: `${-pad.bottom * 100}%`,
      transformOrigin: `50% ${((pad.top + 1) / (1 + pad.top + pad.bottom)) * 100}%`,
    })
    canvasRef.current = canvas
    let r: MeshRenderer | null = null
    const lost = (e: Event) => {
      e.preventDefault()
      setOn(0)
    }
    canvas.addEventListener('webglcontextlost', lost)
    const stopLoad = whenLoaded(img, () => {
      r = makeRenderer(canvas, img)
      rendererRef.current = r
      if (!r) return setOn(0)
      aspectRef.current = img.naturalWidth / img.naturalHeight
      fitCanvas(r, canvas)
      setOn(++serial)
    })
    return () => {
      stopLoad()
      canvas.removeEventListener('webglcontextlost', lost)
      rendererRef.current = null
      canvasRef.current = null
      r?.dispose()
      canvas.remove()
      setOn(0)
    }
  }, [src, pad])

  // Keep the buffer matched to the element size.
  useLayoutEffect(() => {
    const c = canvasRef.current
    if (!c || !on || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => rendererRef.current && fitCanvas(rendererRef.current, c))
    ro.observe(c)
    return () => ro.disconnect()
  }, [on])

  // The frame loop.
  useEffect(() => {
    if (!on) return
    const look = new Spring(0, CRITICAL)
    const dyn: Dyn = { squash: 0, bend: 0, lean: 0, amp: 1, reduced }
    let nextTalk = 0
    let edge = hexRgb(P.current.edge ?? '#ffd27a')
    let edgeHex = P.current.edge
    const W = 1 + 2 * pad.x
    const H = 1 + pad.top + pad.bottom
    const tint: [number, number, number] = [1, 1, 1]
    return onTick((now, dt) => {
      const r = rendererRef.current
      const c = canvasRef.current
      if (!r || !c || !visible.current) return
      const p = P.current
      const t = now + (p.seed ?? 0)
      const f = reactor.update(dt)
      if (p.talking && !reduced && now >= nextTalk) {
        reactor.cue('talk', 0, profile.talk ?? 1)
        nextTalk = now + 0.2 + Math.random() * 0.12
      }
      look.target = p.look ?? 0
      dyn.lean = look.step(dt)
      dyn.squash = f.squash
      dyn.bend = f.bend * (p.flip ? -1 : 1)
      deformGrid(r.pos, r.uvs, profile, t, dyn, aspectRef.current, pad, p.flip)
      // Rigid part of the reaction on the compositor (origin = the feet).
      c.style.transform = f.tx || f.ty || f.rot || f.scale !== 1 ? `translate(${((f.tx / W) * 100).toFixed(3)}%, ${((f.ty / H) * 100).toFixed(3)}%) rotate(${f.rot.toFixed(4)}rad) scale(${f.scale.toFixed(4)})` : ''
      if (p.edge !== edgeHex) {
        edgeHex = p.edge
        edge = hexRgb(p.edge ?? '#ffd27a')
      }
      const k = p.tint ?? 1
      tint[0] = tint[1] = tint[2] = k
      r.draw({ flash: f.flash, dissolve: f.dissolve, alpha: f.alpha, edge, tint })
      if (p.onLift) p.onLift((profile.float && !reduced ? floatPose(profile.float, t).dy * (profile.gain ?? 1) : 0) + f.ty)
    })
  }, [on, pad, profile, reactor, reduced, visible])

  return (
    <span ref={rootRef} className={`la ${on ? 'la-on' : ''} ${className ?? ''}`} style={style} aria-hidden>
      <img ref={imgRef} className={`hd-img la-img ${imgClassName ?? ''} ${props.flip ? 'flip' : ''}`} style={imgStyle} src={src} alt="" draggable={false} decoding="async" />
    </span>
  )
}

export interface LivingSceneProps {
  src: string
  id?: string
  motion?: SceneMotion
  className?: string
  imgClassName?: string
  /** Follow the pointer for depth parallax. Default true. */
  parallax?: boolean
}

/** Full-bleed art (backdrop / key art): Ken Burns drift, depth parallax, subtle wind. */
export function LivingScene(props: LivingSceneProps) {
  const { src, id, className, imgClassName } = props
  const rootRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<MeshRenderer | null>(null)
  const [on, setOn] = useState(0)
  const visible = useVisible(rootRef)
  const reduced = useMemo(prefersReducedMotion, [])
  const motion = props.motion ?? sceneFor(id)
  const parallax = props.parallax ?? true

  useEffect(() => {
    const img = imgRef.current
    const root = rootRef.current
    if (!img || !root) return
    const canvas = mountCanvas(root, { inset: '0', width: '100%', height: '100%' })
    canvasRef.current = canvas
    let r: MeshRenderer | null = null
    const lost = (e: Event) => {
      e.preventDefault()
      setOn(0)
    }
    canvas.addEventListener('webglcontextlost', lost)
    const stop = whenLoaded(img, () => {
      r = makeRenderer(canvas, img)
      rendererRef.current = r
      if (!r) return setOn(0)
      // Static full-screen grid; only the texture coordinates move.
      r.pos.set(r.uvs)
      fitCanvas(r, canvas, 3_000_000)
      setOn(++serial)
    })
    return () => {
      stop()
      canvas.removeEventListener('webglcontextlost', lost)
      rendererRef.current = null
      canvasRef.current = null
      r?.dispose()
      canvas.remove()
      setOn(0)
    }
  }, [src])

  useLayoutEffect(() => {
    const c = canvasRef.current
    if (!c || !on || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => rendererRef.current && fitCanvas(rendererRef.current, c, 3_000_000))
    ro.observe(c)
    return () => ro.disconnect()
  }, [on])

  useEffect(() => {
    if (!on) return
    const px = new Spring(0, { freq: 0.6, damping: 1 })
    const py = new Spring(0, { freq: 0.6, damping: 1 })
    const move = (e: PointerEvent) => {
      if (!parallax || reduced) return
      px.target = (e.clientX / window.innerWidth) * 2 - 1
      py.target = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', move, { passive: true })
    let drawnW = 0
    let drawnH = 0
    const t0 = Math.random() * motion.period
    const stopTick = onTick((now, dt) => {
      const r = rendererRef.current
      const c = canvasRef.current
      if (!r || !c || !visible.current) return
      if (reduced && drawnW === c.width && drawnH === c.height) return
      const cover = coverRect(c.width / c.height, r.texW / r.texH, motion.focus[0], motion.focus[1])
      const X = px.step(dt)
      const Y = py.step(dt)
      const t = reduced ? 0 : now + t0
      const uv = r.uvs
      const pos = r.pos
      for (let k = 0; k < uv.length; k += 2) {
        const [u, v] = sceneUv(pos[k], pos[k + 1], t, motion, cover, X, Y, reduced ? 0 : 1)
        uv[k] = u
        uv[k + 1] = v
      }
      r.draw({ flash: 0, dissolve: 0, alpha: 1, edge: [0, 0, 0], tint: [1, 1, 1] }, true)
      drawnW = c.width
      drawnH = c.height
    })
    return () => {
      stopTick()
      window.removeEventListener('pointermove', move)
    }
  }, [on, motion, parallax, reduced, visible])

  return (
    <div ref={rootRef} className={`la-scene ${on ? 'la-on' : ''} ${className ?? ''}`} aria-hidden>
      <img ref={imgRef} className={`hd-img la-img ${imgClassName ?? ''}`} src={src} alt="" draggable={false} decoding="async" />
    </div>
  )
}

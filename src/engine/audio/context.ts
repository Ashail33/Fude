/**
 * The one shared AudioContext (music + sfx), created only after a user
 * gesture so browsers never block or warn about autoplay. Also routes
 * everything through a master → destination chain with separate music/sfx
 * buses, and pauses audio while the tab is hidden (saves battery on phones).
 */

let ctx: AudioContext | null = null
let unlocked = false
let master: GainNode | null = null
let musicBus: GainNode | null = null
let sfxBus: GainNode | null = null
const unlockListeners: (() => void)[] = []

export function isUnlocked(): boolean {
  return unlocked
}

/** Run `cb` once audio is allowed (immediately if it already is). */
export function onUnlock(cb: () => void) {
  if (unlocked) cb()
  else unlockListeners.push(cb)
}

function build(): AudioContext | null {
  if (ctx) return ctx
  const AC: typeof AudioContext | undefined =
    typeof window === 'undefined' ? undefined : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
  if (!AC) return null
  ctx = new AC({ latencyHint: 'interactive' })
  master = ctx.createGain()
  master.gain.value = 0.9
  master.connect(ctx.destination)
  musicBus = ctx.createGain()
  musicBus.connect(master)
  sfxBus = ctx.createGain()
  sfxBus.connect(master)
  return ctx
}

/** The live context, or null before the first gesture / without WebAudio. */
export function audioCtx(): AudioContext | null {
  if (!unlocked) return null
  const c = build()
  if (c && c.state === 'suspended' && !hidden()) void c.resume().catch(() => {})
  return c
}

export function getMusicBus(): GainNode | null {
  return audioCtx() ? musicBus : null
}

export function getSfxBus(): GainNode | null {
  return audioCtx() ? sfxBus : null
}

function hidden() {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden'
}

function unlock() {
  if (unlocked) return
  unlocked = true
  const c = build()
  if (c) void c.resume().catch(() => {})
  for (const cb of unlockListeners.splice(0)) cb()
}

if (typeof window !== 'undefined') {
  const opts = { capture: true, passive: true } as const
  const onGesture = () => {
    unlock()
    // Some browsers need resume() inside a gesture even after creation.
    if (ctx && ctx.state === 'suspended' && !hidden()) void ctx.resume().catch(() => {})
  }
  for (const ev of ['pointerdown', 'keydown', 'touchend', 'click'] as const) window.addEventListener(ev, onGesture, opts)
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (hidden()) void ctx.suspend().catch(() => {})
    else if (unlocked) void ctx.resume().catch(() => {})
  })
}

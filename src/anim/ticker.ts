/**
 * One shared requestAnimationFrame loop for every animated layer. Frames
 * stop entirely when nothing is subscribed; after the tab was hidden the
 * first delta is clamped so springs don't jump.
 */
export type TickFn = (now: number, dt: number) => void

const subs = new Set<TickFn>()
let raf = 0
let last = 0

/** Dev only: a manual clock for frame-exact captures (window.__animManual(dt)). */
let manual = false
let manualT = 0

function run(t: number, dt: number) {
  for (const f of [...subs]) {
    try {
      f(t, dt)
    } catch (e) {
      subs.delete(f)
      console.warn('[anim] layer stopped', e)
    }
  }
}

if (import.meta.env?.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __animManual: (dt: number, n?: number) => void }).__animManual = (dt: number, n = 1) => {
    if (!manual) manualT = performance.now() / 1000
    manual = true
    for (let i = 0; i < n; i++) {
      manualT += dt
      run(manualT, dt)
    }
  }
}

function loop(now: number) {
  raf = 0
  if (manual) {
    if (subs.size) raf = requestAnimationFrame(loop)
    return
  }
  const t = now / 1000
  const dt = last ? Math.min(0.05, Math.max(0, t - last)) : 1 / 60
  last = t
  run(t, dt)
  if (subs.size && typeof requestAnimationFrame !== 'undefined') raf = requestAnimationFrame(loop)
  else last = 0
}

if (typeof document !== 'undefined')
  document.addEventListener('visibilitychange', () => {
    last = 0
  })

/** Subscribe to frames; returns an unsubscribe function. */
export function onTick(f: TickFn): () => void {
  subs.add(f)
  if (!raf && typeof requestAnimationFrame !== 'undefined') raf = requestAnimationFrame(loop)
  return () => {
    subs.delete(f)
  }
}

/** Current prefers-reduced-motion (non-reactive). */
export const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

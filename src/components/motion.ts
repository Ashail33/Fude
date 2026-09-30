/**
 * Shared motion helpers for the UI: easing curves (mirrored as CSS custom
 * properties in index.css: --ease-out, --ease-back, --ease-in-out,
 * --ease-spring), a tiny critically-damped spring, and hooks for springy
 * numbers and rolling counters. Everything honours prefers-reduced-motion.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react'

export const EASE = {
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  back: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3)
export const easeInOutCubic = (t: number) => {
  t = clamp01(t)
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
/** Overshoots ~10% then settles (the "pop"). */
export const easeOutBack = (t: number, s = 1.70158) => {
  t = clamp01(t)
  return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2)
}

function clamp01(t: number) {
  return t < 0 ? 0 : t > 1 ? 1 : t
}

export function prefersReducedMotion(): boolean {
  try {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export interface Spring1 {
  x: number
  v: number
}

/**
 * Advance a 1-D damped spring toward `target` (omega = stiffness in rad/s,
 * zeta = damping ratio; 1 = no overshoot, <1 = bouncy). Mutates and returns `s`.
 */
export function stepSpring(s: Spring1, target: number, dt: number, omega = 14, zeta = 0.8): Spring1 {
  const n = Math.max(1, Math.ceil(dt / (1 / 120)))
  const h = dt / n
  for (let i = 0; i < n; i++) {
    s.v += (omega * omega * (target - s.x) - 2 * zeta * omega * s.v) * h
    s.x += s.v * h
  }
  return s
}

export function springSettled(s: Spring1, target: number, eps = 0.01): boolean {
  return Math.abs(target - s.x) < eps && Math.abs(s.v) < eps * 10
}

/** A number that springs toward `target` (for gliding cursors, meters). */
export function useSpring(target: number, omega = 16, zeta = 0.78): number {
  const [v, setV] = useState(target)
  const s = useRef<Spring1>({ x: target, v: 0 })
  useEffect(() => {
    if (prefersReducedMotion()) {
      s.current.x = target
      s.current.v = 0
      setV(target)
      return
    }
    let raf = 0
    let last = performance.now()
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      stepSpring(s.current, target, dt, omega, zeta)
      if (springSettled(s.current, target)) {
        s.current.x = target
        s.current.v = 0
        setV(target)
        return
      }
      setV(s.current.x)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, omega, zeta])
  return v
}

/** Rolls a counter from 0 to `target` after `delayMs`, decelerating into the final value. */
export function useCountUp(target: number, delayMs = 0, durMs = 900): number {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (prefersReducedMotion()) {
      setV(target)
      return
    }
    let raf = 0
    const t0 = performance.now() + delayMs
    const tick = (t: number) => {
      const f = Math.max(0, Math.min(1, (t - t0) / durMs))
      setV(Math.round(target * easeOutCubic(f)))
      if (f < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, delayMs, durMs])
  return v
}

/** Inline style that staggers an entrance animation by index (see `.stagger` in index.css). */
export function stagger(i: number, stepMs = 40, baseMs = 0): CSSProperties {
  return { ['--i' as string]: i, ['--stagger' as string]: `${stepMs}ms`, ['--stagger-base' as string]: `${baseMs}ms` }
}
